-- ═══════════════════════════════════════════════════════════════════════════════
-- MIGRATION 014: Sistema de Donaciones para Entidades del Mapa de Transicion
-- ═══════════════════════════════════════════════════════════════════════════════
--
-- Sistema de donaciones con escrow para entidades del mapa:
-- 1. Donador deposita BTC/EUR
-- 2. Fondos quedan en escrow (custodia)
-- 3. Entidad recibe notificacion
-- 4. Entidad verifica su identidad
-- 5. Una vez verificada, puede reclamar los fondos
--
-- @version 1.0.0
-- @created 2025-01-15
-- ═══════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. TABLA DE ENTIDADES DEL MAPA
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS map_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- ecoaldea, cooperativa, proyecto, comunidad, etc.
  location JSONB, -- {lat, lng, address, city, country}
  contact_email TEXT,
  contact_phone TEXT,
  website TEXT,
  social_links JSONB DEFAULT '{}',
  btc_address TEXT, -- Direccion BTC para recibir donaciones
  paypal_email TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  verification_token TEXT,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES profiles(id),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'pending', -- pending, active, suspended
  total_donations_received DECIMAL(18,8) DEFAULT 0,
  donation_count INTEGER DEFAULT 0,

  CONSTRAINT entity_status_check CHECK (status IN ('pending', 'active', 'suspended'))
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_entities_category ON map_entities(category);
CREATE INDEX IF NOT EXISTS idx_entities_status ON map_entities(status);
CREATE INDEX IF NOT EXISTS idx_entities_verified ON map_entities(is_verified);
CREATE INDEX IF NOT EXISTS idx_entities_location ON map_entities USING GIN (location);

-- Comentarios
COMMENT ON TABLE map_entities IS 'Entidades del mapa de transicion que pueden recibir donaciones';
COMMENT ON COLUMN map_entities.btc_address IS 'Direccion Bitcoin de la entidad para recibir donaciones directas';

-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. TABLA DE DONACIONES (ESCROW)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS entity_donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES map_entities(id) ON DELETE RESTRICT,
  donor_id UUID REFERENCES profiles(id), -- NULL si es anonimo
  donor_name TEXT, -- Nombre opcional del donador
  donor_email TEXT, -- Email para notificaciones
  donor_message TEXT, -- Mensaje de apoyo

  -- Monto y metodo
  amount DECIMAL(18,8) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR', -- EUR, BTC
  btc_amount DECIMAL(18,8), -- Si paga en BTC
  payment_method TEXT NOT NULL, -- stripe, paypal, btc

  -- Estado del escrow
  status TEXT NOT NULL DEFAULT 'pending',
  -- pending: esperando pago
  -- in_escrow: fondos recibidos, en custodia
  -- claimed: entidad reclamo los fondos
  -- released: fondos enviados a entidad
  -- refunded: devuelto al donador
  -- expired: expiro sin reclamar

  -- Datos de pago
  tx_id TEXT, -- TX ID de BTC o Stripe payment intent
  stripe_payment_intent TEXT,
  paypal_order_id TEXT,

  -- Tracking
  escrow_address TEXT, -- Direccion BTC de escrow (nuestra direccion)
  release_address TEXT, -- Direccion donde se enviaran los fondos (de la entidad)
  release_tx_id TEXT, -- TX ID cuando se liberan los fondos

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ,
  claimed_at TIMESTAMPTZ,
  released_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),

  -- Metadata
  metadata JSONB DEFAULT '{}',

  CONSTRAINT donation_status_check CHECK (status IN ('pending', 'in_escrow', 'claimed', 'released', 'refunded', 'expired')),
  CONSTRAINT donation_method_check CHECK (payment_method IN ('stripe', 'paypal', 'btc'))
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_donations_entity ON entity_donations(entity_id);
CREATE INDEX IF NOT EXISTS idx_donations_donor ON entity_donations(donor_id);
CREATE INDEX IF NOT EXISTS idx_donations_status ON entity_donations(status);
CREATE INDEX IF NOT EXISTS idx_donations_created ON entity_donations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_donations_tx ON entity_donations(tx_id) WHERE tx_id IS NOT NULL;

-- Comentarios
COMMENT ON TABLE entity_donations IS 'Donaciones a entidades del mapa con sistema de escrow';
COMMENT ON COLUMN entity_donations.status IS 'Estado: pending, in_escrow (fondos custodiados), claimed (entidad reclamo), released (fondos enviados), refunded, expired';

-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. TABLA DE NOTIFICACIONES A ENTIDADES
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS entity_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES map_entities(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- donation_received, verification_needed, funds_released, etc.
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT FALSE,
  sent_email BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_entity_notif_entity ON entity_notifications(entity_id);
CREATE INDEX IF NOT EXISTS idx_entity_notif_read ON entity_notifications(read);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. TABLA DE NOTIFICACIONES DE ADMIN
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  user_id UUID REFERENCES profiles(id),
  user_email TEXT,
  category TEXT,
  message TEXT,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_admin_notif_type ON admin_notifications(type);
CREATE INDEX IF NOT EXISTS idx_admin_notif_read ON admin_notifications(read);
CREATE INDEX IF NOT EXISTS idx_admin_notif_created ON admin_notifications(created_at DESC);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 5. RLS POLICIES
-- ═══════════════════════════════════════════════════════════════════════════════

-- Habilitar RLS
ALTER TABLE map_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

-- Entidades: lectura publica, edicion solo creador o admin
CREATE POLICY "Entities are viewable by everyone"
ON map_entities FOR SELECT
USING (status = 'active' OR auth.uid() = created_by);

CREATE POLICY "Users can create entities"
ON map_entities FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Entity creators can update their entities"
ON map_entities FOR UPDATE
USING (auth.uid() = created_by);

-- Donaciones: donador puede ver sus donaciones
CREATE POLICY "Donors can view their donations"
ON entity_donations FOR SELECT
USING (donor_id = auth.uid() OR donor_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Anyone can create donations"
ON entity_donations FOR INSERT
WITH CHECK (true);

-- Notificaciones de entidad: solo la entidad puede ver
CREATE POLICY "Entities can view their notifications"
ON entity_notifications FOR SELECT
USING (
  entity_id IN (
    SELECT id FROM map_entities WHERE created_by = auth.uid()
  )
);

-- Admin notifications: solo service role
-- (no policy = solo acceso via service role)

-- ═══════════════════════════════════════════════════════════════════════════════
-- 6. FUNCIONES
-- ═══════════════════════════════════════════════════════════════════════════════

-- Funcion para crear una donacion
CREATE OR REPLACE FUNCTION create_donation(
  p_entity_id UUID,
  p_amount DECIMAL,
  p_currency TEXT,
  p_payment_method TEXT,
  p_donor_id UUID DEFAULT NULL,
  p_donor_name TEXT DEFAULT NULL,
  p_donor_email TEXT DEFAULT NULL,
  p_donor_message TEXT DEFAULT NULL,
  p_btc_amount DECIMAL DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_donation_id UUID;
  v_entity RECORD;
BEGIN
  -- Verificar que la entidad existe y esta activa
  SELECT * INTO v_entity FROM map_entities WHERE id = p_entity_id AND status = 'active';
  IF v_entity IS NULL THEN
    RAISE EXCEPTION 'Entidad no encontrada o inactiva';
  END IF;

  -- Crear donacion
  INSERT INTO entity_donations (
    entity_id, donor_id, donor_name, donor_email, donor_message,
    amount, currency, btc_amount, payment_method
  ) VALUES (
    p_entity_id, p_donor_id, p_donor_name, p_donor_email, p_donor_message,
    p_amount, p_currency, p_btc_amount, p_payment_method
  )
  RETURNING id INTO v_donation_id;

  RETURN v_donation_id;
END;
$$;

-- Funcion para confirmar pago y pasar a escrow
CREATE OR REPLACE FUNCTION confirm_donation_payment(
  p_donation_id UUID,
  p_tx_id TEXT DEFAULT NULL,
  p_stripe_pi TEXT DEFAULT NULL,
  p_paypal_id TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_donation RECORD;
  v_entity RECORD;
BEGIN
  -- Obtener donacion
  SELECT * INTO v_donation FROM entity_donations WHERE id = p_donation_id AND status = 'pending';
  IF v_donation IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Actualizar donacion
  UPDATE entity_donations SET
    status = 'in_escrow',
    tx_id = COALESCE(p_tx_id, tx_id),
    stripe_payment_intent = COALESCE(p_stripe_pi, stripe_payment_intent),
    paypal_order_id = COALESCE(p_paypal_id, paypal_order_id),
    paid_at = NOW()
  WHERE id = p_donation_id;

  -- Obtener entidad
  SELECT * INTO v_entity FROM map_entities WHERE id = v_donation.entity_id;

  -- Crear notificacion para la entidad
  INSERT INTO entity_notifications (entity_id, type, title, message, data)
  VALUES (
    v_donation.entity_id,
    'donation_received',
    'Nueva donacion recibida!',
    format('Has recibido una donacion de %s %s de %s. Los fondos estan en custodia hasta que verifiques tu identidad.',
           v_donation.amount, v_donation.currency, COALESCE(v_donation.donor_name, 'Anonimo')),
    jsonb_build_object(
      'donation_id', p_donation_id,
      'amount', v_donation.amount,
      'currency', v_donation.currency,
      'donor_name', v_donation.donor_name,
      'message', v_donation.donor_message
    )
  );

  RETURN TRUE;
END;
$$;

-- Funcion para que entidad reclame fondos (liberacion automatica)
CREATE OR REPLACE FUNCTION claim_donation(
  p_donation_id UUID,
  p_entity_user_id UUID,
  p_release_address TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_donation RECORD;
  v_entity RECORD;
BEGIN
  -- Obtener donacion
  SELECT * INTO v_donation FROM entity_donations WHERE id = p_donation_id AND status = 'in_escrow';
  IF v_donation IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Donacion no encontrada o no esta en escrow');
  END IF;

  -- Verificar que el usuario es el creador de la entidad
  SELECT * INTO v_entity FROM map_entities
  WHERE id = v_donation.entity_id AND created_by = p_entity_user_id;

  IF v_entity IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No tienes permiso para reclamar esta donacion');
  END IF;

  -- Verificar que la entidad esta verificada
  IF NOT v_entity.is_verified THEN
    RETURN jsonb_build_object('success', false, 'error', 'Debes verificar tu entidad primero');
  END IF;

  -- Marcar como LIBERADA automaticamente (no solo claimed)
  UPDATE entity_donations SET
    status = 'released',
    claimed_at = NOW(),
    released_at = NOW(),
    release_address = p_release_address
  WHERE id = p_donation_id;

  -- Actualizar total de la entidad
  UPDATE map_entities SET
    total_donations_received = total_donations_received + v_donation.amount,
    donation_count = donation_count + 1
  WHERE id = v_donation.entity_id;

  -- Crear notificacion para la entidad
  INSERT INTO entity_notifications (entity_id, type, title, message, data)
  VALUES (
    v_donation.entity_id,
    'funds_released',
    'Fondos liberados!',
    format('Se han liberado %s %s a tu direccion %s', v_donation.amount, v_donation.currency,
           CASE WHEN v_donation.payment_method = 'btc' THEN p_release_address
                WHEN v_donation.payment_method = 'paypal' THEN v_entity.paypal_email
                ELSE 'registrada' END),
    jsonb_build_object(
      'donation_id', p_donation_id,
      'release_address', p_release_address,
      'amount', v_donation.amount,
      'currency', v_donation.currency,
      'payment_method', v_donation.payment_method
    )
  );

  -- Crear notificacion para admin (para que procese el envio si es necesario)
  INSERT INTO admin_notifications (type, user_id, category, message, data)
  VALUES (
    'donation_released',
    p_entity_user_id,
    'donations',
    format('Donacion liberada: %s %s para %s via %s',
           v_donation.amount, v_donation.currency, v_entity.name, v_donation.payment_method),
    jsonb_build_object(
      'donation_id', p_donation_id,
      'entity_id', v_entity.id,
      'entity_name', v_entity.name,
      'amount', v_donation.amount,
      'currency', v_donation.currency,
      'payment_method', v_donation.payment_method,
      'release_address', p_release_address,
      'entity_btc_address', v_entity.btc_address,
      'entity_paypal', v_entity.paypal_email
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'donation_id', p_donation_id,
    'amount', v_donation.amount,
    'currency', v_donation.currency,
    'status', 'released',
    'message', 'Fondos liberados! El pago sera procesado automaticamente.'
  );
END;
$$;

-- Funcion para verificar entidad
CREATE OR REPLACE FUNCTION verify_entity(
  p_entity_id UUID,
  p_verification_token TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_entity RECORD;
BEGIN
  SELECT * INTO v_entity FROM map_entities
  WHERE id = p_entity_id AND verification_token = p_verification_token AND NOT is_verified;

  IF v_entity IS NULL THEN
    RETURN FALSE;
  END IF;

  UPDATE map_entities SET
    is_verified = TRUE,
    verified_at = NOW(),
    status = 'active'
  WHERE id = p_entity_id;

  -- Notificar
  INSERT INTO entity_notifications (entity_id, type, title, message)
  VALUES (
    p_entity_id,
    'entity_verified',
    'Entidad verificada!',
    'Tu entidad ha sido verificada. Ahora puedes reclamar las donaciones pendientes.'
  );

  RETURN TRUE;
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 7. DATOS DE EJEMPLO (opcional - comentar en produccion)
-- ═══════════════════════════════════════════════════════════════════════════════

-- INSERT INTO map_entities (name, description, category, location, contact_email, status, is_verified)
-- VALUES
-- ('Ecoaldea Findhorn', 'Comunidad ecologica pionera', 'ecoaldea',
--  '{"lat": 57.6499, "lng": -3.6011, "city": "Findhorn", "country": "Escocia"}',
--  'info@findhorn.org', 'active', true),
-- ('Cooperativa Integral Catalana', 'Red de economia solidaria', 'cooperativa',
--  '{"lat": 41.3851, "lng": 2.1734, "city": "Barcelona", "country": "Espana"}',
--  'info@cooperativa.cat', 'active', true);

-- ═══════════════════════════════════════════════════════════════════════════════
-- NOTAS DE IMPLEMENTACION
-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. El flujo de donacion BTC:
--    a) Donador crea donacion -> status: pending
--    b) Sistema genera QR con nuestra direccion BTC de escrow
--    c) Donador paga, Edge Function verifica via Blockstream
--    d) Pago confirmado -> status: in_escrow
--    e) Entidad recibe notificacion
--    f) Entidad verifica identidad (si no lo ha hecho)
--    g) Entidad reclama fondos -> status: claimed
--    h) Admin envia fondos manualmente o via automatico -> status: released
--
-- 2. Para fondos EUR (Stripe/PayPal):
--    - Los fondos van a nuestra cuenta de Stripe/PayPal
--    - Cuando entidad reclama, hacemos payout manual o via API
--
-- 3. Edge Functions necesarias:
--    - create-entity-donation: Crear donacion
--    - verify-entity-donation: Verificar pago BTC
--    - release-entity-donation: Liberar fondos (admin)
