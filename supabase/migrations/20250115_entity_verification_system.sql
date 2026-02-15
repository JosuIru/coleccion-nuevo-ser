-- ═══════════════════════════════════════════════════════════════════════════════
-- SISTEMA DE VERIFICACIÓN DESCENTRALIZADA DE ENTIDADES
-- ═══════════════════════════════════════════════════════════════════════════════
--
-- Niveles de verificación:
--   0: Sin verificar (solo puede registrar intenciones)
--   1: Básico (max €100, espera 14 días)
--   2: Medio (max €1000, espera 7 días)
--   3: Completo (sin límites, espera 48h)
--
-- Métodos de verificación:
--   - dns: TXT record en dominio
--   - meta_tag: Meta tag en web
--   - crypto_signature: Firma con wallet
--   - social_endorsement: Avales de la comunidad
--
-- ═══════════════════════════════════════════════════════════════════════════════

-- Añadir campos de verificación a transition_entities
ALTER TABLE transition_entities ADD COLUMN IF NOT EXISTS verification_level INTEGER DEFAULT 0;
ALTER TABLE transition_entities ADD COLUMN IF NOT EXISTS verification_code VARCHAR(64);
ALTER TABLE transition_entities ADD COLUMN IF NOT EXISTS total_received DECIMAL(12,2) DEFAULT 0;
ALTER TABLE transition_entities ADD COLUMN IF NOT EXISTS total_pending DECIMAL(12,2) DEFAULT 0;
ALTER TABLE transition_entities ADD COLUMN IF NOT EXISTS claimed_by UUID REFERENCES auth.users(id);
ALTER TABLE transition_entities ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ;
ALTER TABLE transition_entities ADD COLUMN IF NOT EXISTS withdrawal_available_at TIMESTAMPTZ;
ALTER TABLE transition_entities ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE;
ALTER TABLE transition_entities ADD COLUMN IF NOT EXISTS ban_reason TEXT;

-- Índices para búsquedas eficientes
CREATE INDEX IF NOT EXISTS idx_entities_verification_level ON transition_entities(verification_level);
CREATE INDEX IF NOT EXISTS idx_entities_claimed_by ON transition_entities(claimed_by);

-- ═══════════════════════════════════════════════════════════════════════════════
-- TABLA: entity_verifications
-- Registro de verificaciones completadas
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS entity_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id UUID NOT NULL REFERENCES transition_entities(id) ON DELETE CASCADE,
    method VARCHAR(32) NOT NULL, -- 'dns', 'meta_tag', 'crypto_signature', 'social_endorsement'
    proof_data JSONB NOT NULL, -- Datos de la prueba (dominio verificado, firma, etc.)
    verified_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ, -- Algunas verificaciones pueden expirar
    is_valid BOOLEAN DEFAULT TRUE,

    UNIQUE(entity_id, method)
);

CREATE INDEX IF NOT EXISTS idx_verifications_entity ON entity_verifications(entity_id);
CREATE INDEX IF NOT EXISTS idx_verifications_method ON entity_verifications(method);

-- ═══════════════════════════════════════════════════════════════════════════════
-- TABLA: entity_endorsements
-- Avales de usuarios con stake (skin in the game)
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS entity_endorsements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id UUID NOT NULL REFERENCES transition_entities(id) ON DELETE CASCADE,
    endorser_id UUID NOT NULL REFERENCES auth.users(id),
    stake_amount DECIMAL(10,2) NOT NULL DEFAULT 20.00, -- Mínimo €20
    stake_currency VARCHAR(3) DEFAULT 'EUR',
    stake_status VARCHAR(20) DEFAULT 'active', -- 'active', 'slashed', 'returned'

    -- Anti-colusión: datos para detectar fraude
    endorser_ip VARCHAR(45),
    endorser_device_hash VARCHAR(64),
    endorser_account_age_days INTEGER,

    reason TEXT, -- Por qué avala a esta entidad
    created_at TIMESTAMPTZ DEFAULT NOW(),
    slashed_at TIMESTAMPTZ,
    returned_at TIMESTAMPTZ,

    UNIQUE(entity_id, endorser_id)
);

CREATE INDEX IF NOT EXISTS idx_endorsements_entity ON entity_endorsements(entity_id);
CREATE INDEX IF NOT EXISTS idx_endorsements_endorser ON entity_endorsements(endorser_id);
CREATE INDEX IF NOT EXISTS idx_endorsements_status ON entity_endorsements(stake_status);

-- ═══════════════════════════════════════════════════════════════════════════════
-- TABLA: donation_intents
-- Intenciones de donación (antes de que la entidad pueda recibir)
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS donation_intents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id UUID NOT NULL REFERENCES transition_entities(id) ON DELETE CASCADE,
    donor_id UUID REFERENCES auth.users(id),
    donor_email VARCHAR(255),
    donor_name VARCHAR(100),

    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',
    message TEXT,

    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'notified', 'completed', 'cancelled', 'expired'

    created_at TIMESTAMPTZ DEFAULT NOW(),
    notified_at TIMESTAMPTZ, -- Cuando se notificó al donante que puede completar
    completed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '90 days'),

    -- Referencia a donación real cuando se complete
    donation_id UUID
);

CREATE INDEX IF NOT EXISTS idx_intents_entity ON donation_intents(entity_id);
CREATE INDEX IF NOT EXISTS idx_intents_donor ON donation_intents(donor_id);
CREATE INDEX IF NOT EXISTS idx_intents_status ON donation_intents(status);

-- ═══════════════════════════════════════════════════════════════════════════════
-- TABLA: entity_disputes
-- Disputas sobre entidades (sistema descentralizado de resolución)
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS entity_disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id UUID NOT NULL REFERENCES transition_entities(id) ON DELETE CASCADE,
    complainant_id UUID NOT NULL REFERENCES auth.users(id),
    complainant_stake DECIMAL(10,2) DEFAULT 5.00, -- Fianza del denunciante

    reason VARCHAR(50) NOT NULL, -- 'fraud', 'impersonation', 'abandoned', 'other'
    description TEXT NOT NULL,
    evidence_urls TEXT[], -- URLs de evidencia

    status VARCHAR(20) DEFAULT 'open', -- 'open', 'voting', 'resolved_fraud', 'resolved_legitimate', 'dismissed'

    -- Resultado
    votes_fraud INTEGER DEFAULT 0,
    votes_legitimate INTEGER DEFAULT 0,
    resolution TEXT,
    resolved_at TIMESTAMPTZ,

    -- Fechas
    created_at TIMESTAMPTZ DEFAULT NOW(),
    voting_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
);

CREATE INDEX IF NOT EXISTS idx_disputes_entity ON entity_disputes(entity_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON entity_disputes(status);

-- ═══════════════════════════════════════════════════════════════════════════════
-- TABLA: dispute_votes
-- Votos de árbitros en disputas
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS dispute_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dispute_id UUID NOT NULL REFERENCES entity_disputes(id) ON DELETE CASCADE,
    arbiter_id UUID NOT NULL REFERENCES auth.users(id),
    vote VARCHAR(20) NOT NULL, -- 'fraud', 'legitimate'
    reasoning TEXT,
    voted_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(dispute_id, arbiter_id)
);

CREATE INDEX IF NOT EXISTS idx_votes_dispute ON dispute_votes(dispute_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- TABLA: entity_donations (actualizada)
-- Donaciones reales a entidades
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS entity_donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id UUID NOT NULL REFERENCES transition_entities(id) ON DELETE CASCADE,
    donor_id UUID REFERENCES auth.users(id),
    donor_name VARCHAR(100),
    donor_email VARCHAR(255),
    donor_message TEXT,

    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',

    -- Pago
    payment_method VARCHAR(20), -- 'stripe', 'paypal', 'btc'
    payment_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'refunded'
    payment_id VARCHAR(100), -- ID externo (Stripe, PayPal, TX hash)

    -- Bitcoin específico
    btc_amount DECIMAL(18,8),
    btc_address VARCHAR(100),
    btc_tx_id VARCHAR(100),
    is_p2p BOOLEAN DEFAULT FALSE,

    -- Withdrawal
    withdrawal_status VARCHAR(20) DEFAULT 'held', -- 'held', 'available', 'withdrawn', 'refunded'
    withdrawal_available_at TIMESTAMPTZ,
    withdrawn_at TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,

    -- Referencia a intención original si existía
    intent_id UUID REFERENCES donation_intents(id)
);

CREATE INDEX IF NOT EXISTS idx_donations_entity ON entity_donations(entity_id);
CREATE INDEX IF NOT EXISTS idx_donations_donor ON entity_donations(donor_id);
CREATE INDEX IF NOT EXISTS idx_donations_status ON entity_donations(payment_status);
CREATE INDEX IF NOT EXISTS idx_donations_withdrawal ON entity_donations(withdrawal_status);

-- ═══════════════════════════════════════════════════════════════════════════════
-- TABLA: user_reputation
-- Reputación de usuarios para ser árbitros y avaladores
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS user_reputation (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id),
    reputation_score INTEGER DEFAULT 0,

    -- Estadísticas
    donations_made INTEGER DEFAULT 0,
    donations_amount_total DECIMAL(12,2) DEFAULT 0,
    endorsements_made INTEGER DEFAULT 0,
    endorsements_slashed INTEGER DEFAULT 0, -- Avales que resultaron ser fraude
    disputes_participated INTEGER DEFAULT 0,
    disputes_correct_votes INTEGER DEFAULT 0, -- Votos que coincidieron con el resultado

    -- Niveles
    can_endorse BOOLEAN DEFAULT FALSE, -- Puede avalar entidades
    can_arbitrate BOOLEAN DEFAULT FALSE, -- Puede votar en disputas

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- FUNCIONES Y TRIGGERS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Función para calcular nivel de verificación
CREATE OR REPLACE FUNCTION calculate_verification_level(entity_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    tech_verifications INTEGER;
    social_endorsements INTEGER;
    days_without_disputes INTEGER;
    current_level INTEGER;
BEGIN
    -- Contar verificaciones técnicas (DNS, meta, firma)
    SELECT COUNT(*) INTO tech_verifications
    FROM entity_verifications
    WHERE entity_id = entity_uuid
      AND method IN ('dns', 'meta_tag', 'crypto_signature')
      AND is_valid = TRUE;

    -- Contar avales activos
    SELECT COUNT(*) INTO social_endorsements
    FROM entity_endorsements
    WHERE entity_id = entity_uuid
      AND stake_status = 'active';

    -- Calcular días sin disputas resueltas como fraude
    SELECT COALESCE(
        EXTRACT(DAY FROM NOW() - MAX(created_at))::INTEGER,
        999
    ) INTO days_without_disputes
    FROM entity_disputes
    WHERE entity_id = entity_uuid
      AND status = 'resolved_fraud';

    -- Determinar nivel
    IF days_without_disputes < 30 THEN
        -- Disputa reciente de fraude: nivel 0
        current_level := 0;
    ELSIF tech_verifications >= 2 AND days_without_disputes >= 180 THEN
        -- 2+ verificaciones técnicas + 6 meses limpio: nivel 3
        current_level := 3;
    ELSIF tech_verifications >= 1 OR social_endorsements >= 3 THEN
        -- 1 verificación técnica O 3+ avales: nivel 2 o 1
        IF tech_verifications >= 1 AND social_endorsements >= 3 THEN
            current_level := 2;
        ELSE
            current_level := 1;
        END IF;
    ELSE
        current_level := 0;
    END IF;

    RETURN current_level;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar nivel de verificación automáticamente
CREATE OR REPLACE FUNCTION update_entity_verification_level()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE transition_entities
    SET verification_level = calculate_verification_level(
        COALESCE(NEW.entity_id, OLD.entity_id)
    )
    WHERE id = COALESCE(NEW.entity_id, OLD.entity_id);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers en tablas relacionadas
DROP TRIGGER IF EXISTS trg_update_level_on_verification ON entity_verifications;
CREATE TRIGGER trg_update_level_on_verification
    AFTER INSERT OR UPDATE OR DELETE ON entity_verifications
    FOR EACH ROW EXECUTE FUNCTION update_entity_verification_level();

DROP TRIGGER IF EXISTS trg_update_level_on_endorsement ON entity_endorsements;
CREATE TRIGGER trg_update_level_on_endorsement
    AFTER INSERT OR UPDATE OR DELETE ON entity_endorsements
    FOR EACH ROW EXECUTE FUNCTION update_entity_verification_level();

-- Función para generar código de verificación único
CREATE OR REPLACE FUNCTION generate_verification_code()
RETURNS VARCHAR(64) AS $$
BEGIN
    RETURN 'ns-' || encode(gen_random_bytes(16), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Trigger para generar código al crear entidad
CREATE OR REPLACE FUNCTION set_verification_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.verification_code IS NULL THEN
        NEW.verification_code := generate_verification_code();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_verification_code ON transition_entities;
CREATE TRIGGER trg_set_verification_code
    BEFORE INSERT ON transition_entities
    FOR EACH ROW EXECUTE FUNCTION set_verification_code();

-- Actualizar códigos de entidades existentes que no tengan
UPDATE transition_entities
SET verification_code = generate_verification_code()
WHERE verification_code IS NULL;

-- ═══════════════════════════════════════════════════════════════════════════════
-- CONFIGURACIÓN DE LÍMITES POR NIVEL
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS verification_level_config (
    level INTEGER PRIMARY KEY,
    max_amount DECIMAL(12,2),
    withdrawal_delay_hours INTEGER,
    description TEXT
);

INSERT INTO verification_level_config (level, max_amount, withdrawal_delay_hours, description)
VALUES
    (0, 0, NULL, 'Sin verificar - Solo intenciones de donación'),
    (1, 100, 336, 'Básico - Max €100, espera 14 días'),
    (2, 1000, 168, 'Medio - Max €1000, espera 7 días'),
    (3, NULL, 48, 'Completo - Sin límite, espera 48h')
ON CONFLICT (level) DO UPDATE SET
    max_amount = EXCLUDED.max_amount,
    withdrawal_delay_hours = EXCLUDED.withdrawal_delay_hours,
    description = EXCLUDED.description;

-- ═══════════════════════════════════════════════════════════════════════════════
-- POLÍTICAS RLS (Row Level Security)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Habilitar RLS
ALTER TABLE entity_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_endorsements ENABLE ROW LEVEL SECURITY;
ALTER TABLE donation_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispute_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_donations ENABLE ROW LEVEL SECURITY;

-- Políticas de lectura pública (transparencia)
CREATE POLICY "Verificaciones públicas" ON entity_verifications FOR SELECT USING (true);
CREATE POLICY "Avales públicos" ON entity_endorsements FOR SELECT USING (true);
CREATE POLICY "Intenciones públicas" ON donation_intents FOR SELECT USING (true);
CREATE POLICY "Disputas públicas" ON entity_disputes FOR SELECT USING (true);
CREATE POLICY "Votos públicos" ON dispute_votes FOR SELECT USING (true);
CREATE POLICY "Donaciones públicas" ON entity_donations FOR SELECT USING (true);

-- Políticas de escritura
CREATE POLICY "Usuario puede crear intención" ON donation_intents
    FOR INSERT WITH CHECK (auth.uid() = donor_id OR donor_id IS NULL);

CREATE POLICY "Usuario puede avalar" ON entity_endorsements
    FOR INSERT WITH CHECK (auth.uid() = endorser_id);

CREATE POLICY "Usuario puede disputar" ON entity_disputes
    FOR INSERT WITH CHECK (auth.uid() = complainant_id);

CREATE POLICY "Árbitro puede votar" ON dispute_votes
    FOR INSERT WITH CHECK (auth.uid() = arbiter_id);
