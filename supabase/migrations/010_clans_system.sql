-- =====================================================
-- MIGRATION 010: CLANS AND COMMUNITIES SYSTEM
-- =====================================================
-- Sistema de clanes y comunidades para gameplay social
-- Permite a usuarios formar grupos, colaborar y competir
-- =====================================================

-- ======================
-- 1. CLANS TABLE
-- ======================
CREATE TABLE IF NOT EXISTS public.clans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Información básica
    name TEXT NOT NULL,
    description TEXT,
    clan_tag TEXT, -- Ej: [AWAKE], [MIND], etc.

    -- Fundador y liderazgo
    founder_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    leader_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,

    -- Estado del clan
    is_active BOOLEAN DEFAULT true,
    is_public BOOLEAN DEFAULT true, -- Público o privado (requiere invitación)
    is_recruiting BOOLEAN DEFAULT true,

    -- Membresía
    max_members INTEGER DEFAULT 50,
    current_members INTEGER DEFAULT 1,
    member_ids UUID[] DEFAULT '{}',

    -- Estadísticas del clan
    total_xp BIGINT DEFAULT 0,
    total_missions_completed INTEGER DEFAULT 0,
    total_crisis_resolved INTEGER DEFAULT 0,
    clan_level INTEGER DEFAULT 1,

    -- Rankings
    global_rank INTEGER,
    weekly_contribution INTEGER DEFAULT 0, -- Se resetea semanalmente

    -- Configuración
    clan_config JSONB DEFAULT '{}',

    -- Visualización
    banner_url TEXT,
    logo_url TEXT,
    theme_color TEXT DEFAULT '#4A90E2',

    -- Requisitos de entrada
    min_level_required INTEGER DEFAULT 1,
    min_xp_required INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT clans_name_check CHECK (char_length(name) BETWEEN 3 AND 50),
    CONSTRAINT clans_tag_check CHECK (clan_tag IS NULL OR char_length(clan_tag) BETWEEN 2 AND 8),
    CONSTRAINT clans_members_check CHECK (current_members >= 0 AND current_members <= max_members),
    CONSTRAINT clans_level_check CHECK (clan_level >= 1),
    CONSTRAINT unique_clan_name UNIQUE (name),
    CONSTRAINT unique_clan_tag UNIQUE (clan_tag)
);

-- Índices para clans
CREATE INDEX IF NOT EXISTS idx_clans_founder ON public.clans(founder_id);
CREATE INDEX IF NOT EXISTS idx_clans_leader ON public.clans(leader_id);
CREATE INDEX IF NOT EXISTS idx_clans_active ON public.clans(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_clans_public ON public.clans(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_clans_recruiting ON public.clans(is_recruiting) WHERE is_recruiting = true;
CREATE INDEX IF NOT EXISTS idx_clans_level ON public.clans(clan_level DESC);
CREATE INDEX IF NOT EXISTS idx_clans_global_rank ON public.clans(global_rank) WHERE global_rank IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clans_total_xp ON public.clans(total_xp DESC);

-- ======================
-- 2. CLAN_MEMBERS TABLE
-- ======================
CREATE TABLE IF NOT EXISTS public.clan_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clan_id UUID NOT NULL REFERENCES public.clans(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Rol dentro del clan
    role TEXT DEFAULT 'member',

    -- Estado de membresía
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,

    -- Contribuciones
    total_contribution INTEGER DEFAULT 0,
    weekly_contribution INTEGER DEFAULT 0,

    -- Estadísticas personales en el clan
    missions_completed_for_clan INTEGER DEFAULT 0,
    crisis_resolved_for_clan INTEGER DEFAULT 0,

    -- Metadata
    custom_title TEXT, -- Título personalizado dentro del clan
    notes TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT unique_clan_member UNIQUE (clan_id, user_id),
    CONSTRAINT clan_members_role_check CHECK (role IN ('member', 'officer', 'co_leader', 'leader'))
);

-- Índices para clan_members
CREATE INDEX IF NOT EXISTS idx_clan_members_clan ON public.clan_members(clan_id);
CREATE INDEX IF NOT EXISTS idx_clan_members_user ON public.clan_members(user_id);
CREATE INDEX IF NOT EXISTS idx_clan_members_role ON public.clan_members(clan_id, role);
CREATE INDEX IF NOT EXISTS idx_clan_members_contribution ON public.clan_members(clan_id, weekly_contribution DESC);

-- ======================
-- 3. CLAN_INVITATIONS TABLE
-- ======================
CREATE TABLE IF NOT EXISTS public.clan_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clan_id UUID NOT NULL REFERENCES public.clans(id) ON DELETE CASCADE,
    inviter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    invitee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Estado de invitación
    status TEXT DEFAULT 'pending',

    -- Mensaje personalizado
    message TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    responded_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),

    -- Constraints
    CONSTRAINT unique_clan_invitation UNIQUE (clan_id, invitee_id, status),
    CONSTRAINT clan_invitations_status_check CHECK (status IN ('pending', 'accepted', 'declined', 'expired'))
);

-- Índices para clan_invitations
CREATE INDEX IF NOT EXISTS idx_clan_invitations_clan ON public.clan_invitations(clan_id);
CREATE INDEX IF NOT EXISTS idx_clan_invitations_invitee ON public.clan_invitations(invitee_id, status);
CREATE INDEX IF NOT EXISTS idx_clan_invitations_pending ON public.clan_invitations(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_clan_invitations_expires ON public.clan_invitations(expires_at) WHERE status = 'pending';

-- ======================
-- 4. CLAN_ACTIVITIES TABLE
-- ======================
-- Registro de actividades del clan
CREATE TABLE IF NOT EXISTS public.clan_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clan_id UUID NOT NULL REFERENCES public.clans(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Tipo de actividad
    activity_type TEXT NOT NULL,

    -- Descripción de la actividad
    activity_data JSONB DEFAULT '{}',

    -- Timestamp
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT clan_activities_type_check CHECK (activity_type IN (
        'member_joined',
        'member_left',
        'member_promoted',
        'member_demoted',
        'mission_completed',
        'crisis_resolved',
        'level_up',
        'achievement_unlocked',
        'clan_created',
        'clan_disbanded',
        'settings_changed'
    ))
);

-- Índices para clan_activities
CREATE INDEX IF NOT EXISTS idx_clan_activities_clan ON public.clan_activities(clan_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clan_activities_user ON public.clan_activities(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clan_activities_type ON public.clan_activities(activity_type);

-- ======================
-- 5. CLAN_CHAT TABLE
-- ======================
-- Sistema de chat básico para clanes
CREATE TABLE IF NOT EXISTS public.clan_chat (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clan_id UUID NOT NULL REFERENCES public.clans(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Mensaje
    message TEXT NOT NULL,

    -- Metadata
    is_system_message BOOLEAN DEFAULT false,
    reply_to_id UUID REFERENCES public.clan_chat(id) ON DELETE SET NULL,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    edited_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,

    -- Constraints
    CONSTRAINT clan_chat_message_check CHECK (char_length(message) BETWEEN 1 AND 1000)
);

-- Índices para clan_chat
CREATE INDEX IF NOT EXISTS idx_clan_chat_clan ON public.clan_chat(clan_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clan_chat_user ON public.clan_chat(user_id);
CREATE INDEX IF NOT EXISTS idx_clan_chat_deleted ON public.clan_chat(deleted_at) WHERE deleted_at IS NULL;

-- ======================
-- 6. RLS POLICIES
-- ======================

-- RLS para clans
ALTER TABLE public.clans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos pueden ver clanes públicos"
    ON public.clans FOR SELECT
    USING (is_public = true OR auth.uid() = ANY(member_ids));

CREATE POLICY "Usuarios autenticados pueden crear clanes"
    ON public.clans FOR INSERT
    WITH CHECK (auth.uid() = founder_id);

CREATE POLICY "Líder puede actualizar clan"
    ON public.clans FOR UPDATE
    USING (auth.uid() = leader_id)
    WITH CHECK (auth.uid() = leader_id);

CREATE POLICY "Líder puede eliminar clan"
    ON public.clans FOR DELETE
    USING (auth.uid() = leader_id);

-- RLS para clan_members
ALTER TABLE public.clan_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Miembros pueden ver otros miembros del mismo clan"
    ON public.clan_members FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.clans c
            WHERE c.id = clan_id AND auth.uid() = ANY(c.member_ids)
        )
        OR user_id = auth.uid()
    );

CREATE POLICY "Sistema puede insertar miembros"
    ON public.clan_members FOR INSERT
    WITH CHECK (auth.jwt()->>'role' = 'service_role' OR auth.uid() = user_id);

CREATE POLICY "Líder y officers pueden actualizar miembros"
    ON public.clan_members FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.clan_members cm
            WHERE cm.clan_id = clan_members.clan_id
              AND cm.user_id = auth.uid()
              AND cm.role IN ('leader', 'co_leader', 'officer')
        )
    );

-- RLS para clan_invitations
ALTER TABLE public.clan_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Invitados pueden ver sus invitaciones"
    ON public.clan_invitations FOR SELECT
    USING (invitee_id = auth.uid() OR inviter_id = auth.uid());

CREATE POLICY "Miembros pueden enviar invitaciones"
    ON public.clan_invitations FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.clan_members cm
            WHERE cm.clan_id = clan_invitations.clan_id
              AND cm.user_id = auth.uid()
              AND cm.role IN ('leader', 'co_leader', 'officer')
        )
    );

-- RLS para clan_activities
ALTER TABLE public.clan_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Miembros pueden ver actividades de su clan"
    ON public.clan_activities FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.clans c
            WHERE c.id = clan_id AND auth.uid() = ANY(c.member_ids)
        )
    );

-- RLS para clan_chat
ALTER TABLE public.clan_chat ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Miembros pueden ver chat de su clan"
    ON public.clan_chat FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.clans c
            WHERE c.id = clan_id AND auth.uid() = ANY(c.member_ids)
        )
        AND deleted_at IS NULL
    );

CREATE POLICY "Miembros pueden enviar mensajes"
    ON public.clan_chat FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.clans c
            WHERE c.id = clan_id AND auth.uid() = ANY(c.member_ids)
        )
    );

CREATE POLICY "Usuarios pueden editar/eliminar sus mensajes"
    ON public.clan_chat FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- ======================
-- 7. TRIGGERS
-- ======================

-- Trigger para auto-actualizar updated_at
CREATE TRIGGER update_clans_updated_at
    BEFORE UPDATE ON public.clans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clan_members_updated_at
    BEFORE UPDATE ON public.clan_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para actualizar current_members al unirse
CREATE OR REPLACE FUNCTION update_clan_member_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.clans
        SET
            current_members = current_members + 1,
            member_ids = array_append(member_ids, NEW.user_id)
        WHERE id = NEW.clan_id;

        -- Registrar actividad
        INSERT INTO public.clan_activities (clan_id, user_id, activity_type, activity_data)
        VALUES (NEW.clan_id, NEW.user_id, 'member_joined', '{}'::jsonb);

    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.clans
        SET
            current_members = GREATEST(0, current_members - 1),
            member_ids = array_remove(member_ids, OLD.user_id)
        WHERE id = OLD.clan_id;

        -- Registrar actividad
        INSERT INTO public.clan_activities (clan_id, user_id, activity_type, activity_data)
        VALUES (OLD.clan_id, OLD.user_id, 'member_left', '{}'::jsonb);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER maintain_clan_member_count
    AFTER INSERT OR DELETE ON public.clan_members
    FOR EACH ROW EXECUTE FUNCTION update_clan_member_count();

-- Trigger para expirar invitaciones
CREATE OR REPLACE FUNCTION expire_old_invitations()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.clan_invitations
    SET status = 'expired'
    WHERE status = 'pending' AND expires_at < NOW();
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_expired_invitations
    AFTER INSERT ON public.clan_invitations
    FOR EACH STATEMENT EXECUTE FUNCTION expire_old_invitations();

-- ======================
-- 8. FUNCIONES ÚTILES
-- ======================

/**
 * Crear un nuevo clan
 */
CREATE OR REPLACE FUNCTION create_clan(
    p_user_id UUID,
    p_name TEXT,
    p_description TEXT DEFAULT NULL,
    p_clan_tag TEXT DEFAULT NULL,
    p_is_public BOOLEAN DEFAULT true
)
RETURNS JSONB AS $$
DECLARE
    v_clan_id UUID;
BEGIN
    -- Verificar que el usuario no está ya en un clan
    IF EXISTS (SELECT 1 FROM public.clan_members WHERE user_id = p_user_id AND is_active = true) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'User already in a clan'
        );
    END IF;

    -- Crear clan
    INSERT INTO public.clans (
        name, description, clan_tag, founder_id, leader_id, is_public
    )
    VALUES (
        p_name, p_description, p_clan_tag, p_user_id, p_user_id, p_is_public
    )
    RETURNING id INTO v_clan_id;

    -- Agregar fundador como miembro
    INSERT INTO public.clan_members (clan_id, user_id, role)
    VALUES (v_clan_id, p_user_id, 'leader');

    RETURN jsonb_build_object(
        'success', true,
        'clan_id', v_clan_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

/**
 * Unirse a un clan
 */
CREATE OR REPLACE FUNCTION join_clan(
    p_user_id UUID,
    p_clan_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_clan RECORD;
BEGIN
    -- Verificar que el clan existe y acepta miembros
    SELECT * INTO v_clan
    FROM public.clans
    WHERE id = p_clan_id AND is_active = true AND is_recruiting = true;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Clan not found or not recruiting'
        );
    END IF;

    -- Verificar que no está lleno
    IF v_clan.current_members >= v_clan.max_members THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Clan is full'
        );
    END IF;

    -- Verificar que el usuario no está ya en un clan
    IF EXISTS (SELECT 1 FROM public.clan_members WHERE user_id = p_user_id AND is_active = true) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'User already in a clan'
        );
    END IF;

    -- Unirse
    INSERT INTO public.clan_members (clan_id, user_id, role)
    VALUES (p_clan_id, p_user_id, 'member');

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Successfully joined clan'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

/**
 * Salir de un clan
 */
CREATE OR REPLACE FUNCTION leave_clan(
    p_user_id UUID,
    p_clan_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_is_leader BOOLEAN;
BEGIN
    -- Verificar si es líder
    SELECT role = 'leader' INTO v_is_leader
    FROM public.clan_members
    WHERE clan_id = p_clan_id AND user_id = p_user_id;

    IF v_is_leader THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Leader cannot leave (transfer leadership first or disband clan)'
        );
    END IF;

    -- Eliminar membresía
    DELETE FROM public.clan_members
    WHERE clan_id = p_clan_id AND user_id = p_user_id;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Successfully left clan'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ======================
-- 9. COMMENTS
-- ======================

COMMENT ON TABLE public.clans IS 'Clanes y comunidades de jugadores';
COMMENT ON TABLE public.clan_members IS 'Miembros de cada clan';
COMMENT ON TABLE public.clan_invitations IS 'Invitaciones a clanes';
COMMENT ON TABLE public.clan_activities IS 'Registro de actividades del clan';
COMMENT ON TABLE public.clan_chat IS 'Sistema de chat para clanes';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
