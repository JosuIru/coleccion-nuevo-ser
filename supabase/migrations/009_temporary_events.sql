-- =====================================================
-- MIGRATION 009: TEMPORARY EVENTS SYSTEM
-- =====================================================
-- Sistema de eventos temporales para aumentar urgencia
-- y engagement en el juego móvil
-- =====================================================

-- ======================
-- 1. TEMPORARY_EVENTS TABLE
-- ======================
CREATE TABLE IF NOT EXISTS public.temporary_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identificación del evento
    event_type TEXT NOT NULL,
    event_name TEXT NOT NULL,
    event_description TEXT NOT NULL,

    -- Temporalidad (lo que hace que sean "temporales")
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN GENERATED ALWAYS AS (
        NOW() >= starts_at AND NOW() <= ends_at
    ) STORED,

    -- Configuración del evento
    event_config JSONB DEFAULT '{}',

    -- Recompensas del evento
    rewards JSONB DEFAULT '{}',

    -- Progreso global del evento (para eventos colaborativos)
    global_progress JSONB DEFAULT '{"current": 0, "goal": 100}',

    -- Restricciones de nivel/acceso
    min_level INTEGER DEFAULT 1,
    max_participants INTEGER,
    current_participants INTEGER DEFAULT 0,

    -- Visualización
    banner_url TEXT,
    icon_url TEXT,
    theme_color TEXT DEFAULT '#FF6B35',

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT temporary_events_type_check CHECK (event_type IN (
        'crisis_surge',       -- Oleada de crisis
        'double_rewards',     -- Recompensas dobles
        'community_challenge',-- Desafío comunitario
        'special_mission',    -- Misión especial
        'consciousness_boost', -- Boost de consciencia
        'being_summon',       -- Invocación de ser especial
        'global_event'        -- Evento global colaborativo
    )),
    CONSTRAINT temporary_events_dates_check CHECK (ends_at > starts_at),
    CONSTRAINT temporary_events_level_check CHECK (min_level >= 1),
    CONSTRAINT temporary_events_participants_check CHECK (
        current_participants >= 0 AND
        (max_participants IS NULL OR current_participants <= max_participants)
    )
);

-- Índices para temporary_events
CREATE INDEX IF NOT EXISTS idx_temporary_events_active ON public.temporary_events(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_temporary_events_type ON public.temporary_events(event_type);
CREATE INDEX IF NOT EXISTS idx_temporary_events_starts_at ON public.temporary_events(starts_at);
CREATE INDEX IF NOT EXISTS idx_temporary_events_ends_at ON public.temporary_events(ends_at);
CREATE INDEX IF NOT EXISTS idx_temporary_events_created_at ON public.temporary_events(created_at DESC);

-- ======================
-- 2. USER_EVENT_PARTICIPATION TABLE
-- ======================
-- Rastrea participación de usuarios en eventos
CREATE TABLE IF NOT EXISTS public.user_event_participation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES public.temporary_events(id) ON DELETE CASCADE,

    -- Estado de participación
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    is_completed BOOLEAN DEFAULT false,

    -- Progreso individual
    progress JSONB DEFAULT '{"current": 0, "goal": 100}',
    tasks_completed TEXT[] DEFAULT '{}',

    -- Recompensas reclamadas
    rewards_claimed BOOLEAN DEFAULT false,
    rewards_claimed_at TIMESTAMPTZ,

    -- Estadísticas del evento
    stats JSONB DEFAULT '{}',

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraint: Un usuario solo puede participar una vez por evento
    CONSTRAINT unique_user_event UNIQUE (user_id, event_id)
);

-- Índices para user_event_participation
CREATE INDEX IF NOT EXISTS idx_user_event_participation_user_id ON public.user_event_participation(user_id);
CREATE INDEX IF NOT EXISTS idx_user_event_participation_event_id ON public.user_event_participation(event_id);
CREATE INDEX IF NOT EXISTS idx_user_event_participation_completed ON public.user_event_participation(is_completed);
CREATE INDEX IF NOT EXISTS idx_user_event_participation_joined_at ON public.user_event_participation(joined_at DESC);

-- ======================
-- 3. EVENT_LEADERBOARD TABLE
-- ======================
-- Tabla de leaderboard para eventos competitivos
CREATE TABLE IF NOT EXISTS public.event_leaderboard (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.temporary_events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Puntuación
    score INTEGER DEFAULT 0,
    rank INTEGER,

    -- Metadata
    username TEXT,
    user_level INTEGER DEFAULT 1,
    user_avatar TEXT,

    -- Timestamp
    last_updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraint: Un usuario solo puede tener un registro por evento
    CONSTRAINT unique_user_event_leaderboard UNIQUE (event_id, user_id)
);

-- Índices para event_leaderboard
CREATE INDEX IF NOT EXISTS idx_event_leaderboard_event_id ON public.event_leaderboard(event_id);
CREATE INDEX IF NOT EXISTS idx_event_leaderboard_score ON public.event_leaderboard(event_id, score DESC);
CREATE INDEX IF NOT EXISTS idx_event_leaderboard_rank ON public.event_leaderboard(event_id, rank);

-- ======================
-- 4. RLS POLICIES
-- ======================

-- RLS para temporary_events (público para lectura, admin para escritura)
ALTER TABLE public.temporary_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos pueden ver eventos activos"
    ON public.temporary_events FOR SELECT
    USING (true);

CREATE POLICY "Solo admins pueden crear eventos"
    ON public.temporary_events FOR INSERT
    WITH CHECK (auth.jwt()->>'role' = 'admin' OR auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Solo admins pueden actualizar eventos"
    ON public.temporary_events FOR UPDATE
    USING (auth.jwt()->>'role' = 'admin' OR auth.jwt()->>'role' = 'service_role')
    WITH CHECK (auth.jwt()->>'role' = 'admin' OR auth.jwt()->>'role' = 'service_role');

-- RLS para user_event_participation
ALTER TABLE public.user_event_participation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own participation"
    ON public.user_event_participation FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can join events"
    ON public.user_event_participation FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own participation"
    ON public.user_event_participation FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- RLS para event_leaderboard (público para lectura)
ALTER TABLE public.event_leaderboard ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos pueden ver leaderboards"
    ON public.event_leaderboard FOR SELECT
    USING (true);

CREATE POLICY "Sistema puede actualizar leaderboards"
    ON public.event_leaderboard FOR INSERT
    WITH CHECK (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Sistema puede modificar leaderboards"
    ON public.event_leaderboard FOR UPDATE
    USING (auth.jwt()->>'role' = 'service_role');

-- ======================
-- 5. TRIGGERS
-- ======================

-- Trigger para auto-actualizar updated_at
CREATE TRIGGER update_temporary_events_updated_at
    BEFORE UPDATE ON public.temporary_events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_event_participation_updated_at
    BEFORE UPDATE ON public.user_event_participation
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para incrementar current_participants cuando un usuario se une
CREATE OR REPLACE FUNCTION increment_event_participants()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.temporary_events
    SET current_participants = current_participants + 1
    WHERE id = NEW.event_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_participants_on_join
    AFTER INSERT ON public.user_event_participation
    FOR EACH ROW EXECUTE FUNCTION increment_event_participants();

-- Trigger para actualizar ranking automáticamente
CREATE OR REPLACE FUNCTION update_event_rankings()
RETURNS TRIGGER AS $$
BEGIN
    -- Actualizar ranks basados en score
    WITH ranked AS (
        SELECT
            id,
            ROW_NUMBER() OVER (PARTITION BY event_id ORDER BY score DESC) as new_rank
        FROM public.event_leaderboard
        WHERE event_id = NEW.event_id
    )
    UPDATE public.event_leaderboard l
    SET rank = r.new_rank
    FROM ranked r
    WHERE l.id = r.id AND l.event_id = NEW.event_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_rankings_on_score_change
    AFTER INSERT OR UPDATE OF score ON public.event_leaderboard
    FOR EACH ROW EXECUTE FUNCTION update_event_rankings();

-- ======================
-- 6. FUNCIONES ÚTILES
-- ======================

/**
 * Obtiene eventos activos para un usuario
 */
CREATE OR REPLACE FUNCTION get_active_events_for_user(p_user_id UUID, p_user_level INTEGER)
RETURNS TABLE (
    event_id UUID,
    event_type TEXT,
    event_name TEXT,
    event_description TEXT,
    starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    rewards JSONB,
    event_config JSONB,
    banner_url TEXT,
    icon_url TEXT,
    theme_color TEXT,
    time_remaining INTERVAL,
    is_participating BOOLEAN,
    participation_progress JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        e.id AS event_id,
        e.event_type,
        e.event_name,
        e.event_description,
        e.starts_at,
        e.ends_at,
        e.rewards,
        e.event_config,
        e.banner_url,
        e.icon_url,
        e.theme_color,
        (e.ends_at - NOW()) AS time_remaining,
        (p.id IS NOT NULL) AS is_participating,
        COALESCE(p.progress, '{}'::jsonb) AS participation_progress
    FROM public.temporary_events e
    LEFT JOIN public.user_event_participation p
        ON e.id = p.event_id AND p.user_id = p_user_id
    WHERE e.is_active = true
      AND e.min_level <= p_user_level
      AND (e.max_participants IS NULL OR e.current_participants < e.max_participants)
    ORDER BY e.ends_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

/**
 * Une a un usuario a un evento
 */
CREATE OR REPLACE FUNCTION join_event(p_user_id UUID, p_event_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_event RECORD;
    v_participation_id UUID;
BEGIN
    -- Verificar que el evento existe y está activo
    SELECT * INTO v_event
    FROM public.temporary_events
    WHERE id = p_event_id AND is_active = true;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Event not found or inactive'
        );
    END IF;

    -- Verificar que no esté lleno
    IF v_event.max_participants IS NOT NULL AND
       v_event.current_participants >= v_event.max_participants THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Event is full'
        );
    END IF;

    -- Insertar participación (ignora si ya existe)
    INSERT INTO public.user_event_participation (user_id, event_id)
    VALUES (p_user_id, p_event_id)
    ON CONFLICT (user_id, event_id) DO NOTHING
    RETURNING id INTO v_participation_id;

    IF v_participation_id IS NOT NULL THEN
        RETURN jsonb_build_object(
            'success', true,
            'participation_id', v_participation_id,
            'message', 'Successfully joined event'
        );
    ELSE
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Already participating in this event'
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

/**
 * Actualiza progreso de un usuario en un evento
 */
CREATE OR REPLACE FUNCTION update_event_progress(
    p_user_id UUID,
    p_event_id UUID,
    p_progress_delta INTEGER,
    p_task_completed TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_participation RECORD;
    v_new_progress JSONB;
    v_new_current INTEGER;
    v_goal INTEGER;
BEGIN
    -- Obtener participación actual
    SELECT * INTO v_participation
    FROM public.user_event_participation
    WHERE user_id = p_user_id AND event_id = p_event_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Not participating in this event'
        );
    END IF;

    -- Calcular nuevo progreso
    v_goal := (v_participation.progress->>'goal')::INTEGER;
    v_new_current := LEAST(
        (v_participation.progress->>'current')::INTEGER + p_progress_delta,
        v_goal
    );

    v_new_progress := jsonb_build_object(
        'current', v_new_current,
        'goal', v_goal
    );

    -- Actualizar
    UPDATE public.user_event_participation
    SET
        progress = v_new_progress,
        tasks_completed = CASE
            WHEN p_task_completed IS NOT NULL
            THEN array_append(tasks_completed, p_task_completed)
            ELSE tasks_completed
        END,
        is_completed = (v_new_current >= v_goal),
        completed_at = CASE
            WHEN v_new_current >= v_goal AND completed_at IS NULL
            THEN NOW()
            ELSE completed_at
        END
    WHERE user_id = p_user_id AND event_id = p_event_id;

    -- Actualizar leaderboard si aplica
    INSERT INTO public.event_leaderboard (event_id, user_id, score)
    VALUES (p_event_id, p_user_id, v_new_current)
    ON CONFLICT (event_id, user_id)
    DO UPDATE SET score = v_new_current, last_updated_at = NOW();

    RETURN jsonb_build_object(
        'success', true,
        'progress', v_new_progress,
        'is_completed', (v_new_current >= v_goal)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ======================
-- 7. COMMENTS
-- ======================

COMMENT ON TABLE public.temporary_events IS 'Eventos temporales que generan urgencia y engagement';
COMMENT ON TABLE public.user_event_participation IS 'Participación de usuarios en eventos temporales';
COMMENT ON TABLE public.event_leaderboard IS 'Rankings de eventos competitivos';

COMMENT ON COLUMN public.temporary_events.is_active IS 'Calculado automáticamente basado en starts_at y ends_at';
COMMENT ON COLUMN public.temporary_events.global_progress IS 'Para eventos colaborativos donde todos contribuyen a una meta';

-- ======================
-- 8. DATOS DE EJEMPLO (OPCIONAL)
-- ======================

-- Insertar un evento de ejemplo (comentar en producción)
/*
INSERT INTO public.temporary_events (
    event_type,
    event_name,
    event_description,
    starts_at,
    ends_at,
    event_config,
    rewards,
    min_level,
    theme_color
) VALUES (
    'crisis_surge',
    'Oleada de Crisis Existencial',
    'Una ola masiva de crisis ha surgido. Ayuda a resolverlas antes de que termine el tiempo.',
    NOW(),
    NOW() + INTERVAL '7 days',
    '{"crisis_multiplier": 2, "reward_boost": 1.5}'::jsonb,
    '{"xp": 500, "consciousness": 100, "special_piece": "existential_fragment"}'::jsonb,
    5,
    '#FF4444'
);
*/

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
