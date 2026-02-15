-- ═══════════════════════════════════════════════════════════════════════════════
-- MIGRATION 013: Sistema de Tokens Híbrido
-- ═══════════════════════════════════════════════════════════════════════════════
-- Modelo híbrido:
-- - Suscripciones mensuales dan tokens gratis cada mes (ai_credits_remaining)
-- - Paquetes de tokens adicionales disponibles para compra (token_balance)
-- - Métodos de pago: Stripe, PayPal, Bitcoin
--
-- @version 1.0.0
-- @created 2025-01-15
-- ═══════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. MODIFICAR TABLA PROFILES
-- ═══════════════════════════════════════════════════════════════════════════════

-- Añadir columna para tokens comprados (wallet)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS token_balance INTEGER DEFAULT 0;

-- Añadir columna para total de tokens comprados históricamente
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS tokens_purchased_total INTEGER DEFAULT 0;

-- Comentarios descriptivos
COMMENT ON COLUMN profiles.token_balance IS 'Tokens comprados disponibles (wallet). No expiran.';
COMMENT ON COLUMN profiles.tokens_purchased_total IS 'Total histórico de tokens comprados por el usuario.';
COMMENT ON COLUMN profiles.ai_credits_remaining IS 'Tokens mensuales restantes del plan. Se renuevan cada mes.';

-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. TABLA DE SOLICITUDES DE PAGO BTC
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS btc_payment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  package_id TEXT NOT NULL,
  tokens_amount INTEGER NOT NULL,
  eur_amount DECIMAL(10,2) NOT NULL,
  btc_amount DECIMAL(18,8) NOT NULL,
  btc_address TEXT NOT NULL,
  tx_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES profiles(id),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),

  CONSTRAINT btc_status_check CHECK (status IN ('pending', 'submitted', 'verifying', 'verified', 'rejected', 'expired'))
);

-- Índices para BTC payments
CREATE INDEX IF NOT EXISTS idx_btc_requests_user ON btc_payment_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_btc_requests_status ON btc_payment_requests(status);
CREATE INDEX IF NOT EXISTS idx_btc_requests_tx ON btc_payment_requests(tx_id) WHERE tx_id IS NOT NULL;

-- Comentarios
COMMENT ON TABLE btc_payment_requests IS 'Solicitudes de pago con Bitcoin. Verificación automática via blockchain API.';
COMMENT ON COLUMN btc_payment_requests.status IS 'Estado: pending (esperando pago), submitted (TX enviado), verifying (verificando blockchain), verified (confirmado), rejected (rechazado), expired (expirado)';

-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. TABLA DE TRANSACCIONES DE TOKENS
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS token_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  tokens_amount INTEGER NOT NULL,
  balance_before INTEGER,
  balance_after INTEGER,
  payment_method TEXT,
  payment_id TEXT,
  package_id TEXT,
  context TEXT,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT token_type_check CHECK (type IN ('purchase', 'consumption', 'bonus', 'refund', 'monthly_reset', 'admin_adjustment'))
);

-- Índices para token transactions
CREATE INDEX IF NOT EXISTS idx_token_trans_user ON token_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_token_trans_type ON token_transactions(type);
CREATE INDEX IF NOT EXISTS idx_token_trans_date ON token_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_token_trans_payment ON token_transactions(payment_id) WHERE payment_id IS NOT NULL;

-- Comentarios
COMMENT ON TABLE token_transactions IS 'Historial de todas las transacciones de tokens (compras, consumos, bonificaciones, etc.)';
COMMENT ON COLUMN token_transactions.type IS 'Tipo: purchase (compra), consumption (uso), bonus (regalo), refund (devolución), monthly_reset (renovación mensual), admin_adjustment (ajuste admin)';
COMMENT ON COLUMN token_transactions.payment_method IS 'Método de pago: stripe, paypal, btc, bonus';

-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. TABLA DE PAGOS PAYPAL
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS paypal_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  paypal_order_id TEXT NOT NULL UNIQUE,
  package_id TEXT NOT NULL,
  tokens_amount INTEGER NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'EUR',
  status TEXT NOT NULL DEFAULT 'created',
  payer_email TEXT,
  capture_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  CONSTRAINT paypal_status_check CHECK (status IN ('created', 'approved', 'completed', 'cancelled', 'failed'))
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_paypal_user ON paypal_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_paypal_order ON paypal_payments(paypal_order_id);
CREATE INDEX IF NOT EXISTS idx_paypal_status ON paypal_payments(status);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 5. RLS (Row Level Security)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Habilitar RLS en nuevas tablas
ALTER TABLE btc_payment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE paypal_payments ENABLE ROW LEVEL SECURITY;

-- Políticas para btc_payment_requests
CREATE POLICY "Users can view own btc requests"
ON btc_payment_requests FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create btc requests"
ON btc_payment_requests FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pending btc requests"
ON btc_payment_requests FOR UPDATE
USING (auth.uid() = user_id AND status IN ('pending', 'submitted'));

-- Políticas para token_transactions (solo lectura para usuarios)
CREATE POLICY "Users can view own token transactions"
ON token_transactions FOR SELECT
USING (auth.uid() = user_id);

-- Políticas para paypal_payments
CREATE POLICY "Users can view own paypal payments"
ON paypal_payments FOR SELECT
USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 6. FUNCIÓN PARA AÑADIR TOKENS DESPUÉS DE COMPRA
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION add_purchased_tokens(
  p_user_id UUID,
  p_tokens INTEGER,
  p_payment_method TEXT,
  p_payment_id TEXT DEFAULT NULL,
  p_package_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
BEGIN
  -- Obtener balance actual
  SELECT COALESCE(token_balance, 0) INTO v_current_balance
  FROM profiles WHERE id = p_user_id;

  v_new_balance := v_current_balance + p_tokens;

  -- Actualizar balance
  UPDATE profiles
  SET
    token_balance = v_new_balance,
    tokens_purchased_total = COALESCE(tokens_purchased_total, 0) + p_tokens,
    updated_at = NOW()
  WHERE id = p_user_id;

  -- Registrar transacción
  INSERT INTO token_transactions (
    user_id, type, tokens_amount, balance_before, balance_after,
    payment_method, payment_id, package_id, description
  ) VALUES (
    p_user_id, 'purchase', p_tokens, v_current_balance, v_new_balance,
    p_payment_method, p_payment_id, p_package_id,
    'Compra de ' || p_tokens || ' tokens via ' || p_payment_method
  );

  RETURN jsonb_build_object(
    'success', true,
    'previous_balance', v_current_balance,
    'new_balance', v_new_balance,
    'tokens_added', p_tokens
  );
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 7. FUNCIÓN PARA CONSUMIR TOKENS
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION consume_tokens(
  p_user_id UUID,
  p_tokens INTEGER,
  p_context TEXT DEFAULT 'ai_chat'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_monthly_remaining INTEGER;
  v_purchased_balance INTEGER;
  v_monthly_consumed INTEGER := 0;
  v_purchased_consumed INTEGER := 0;
  v_tokens_left INTEGER;
BEGIN
  -- Obtener balances actuales
  SELECT
    COALESCE(ai_credits_remaining, 0),
    COALESCE(token_balance, 0)
  INTO v_monthly_remaining, v_purchased_balance
  FROM profiles WHERE id = p_user_id;

  v_tokens_left := p_tokens;

  -- Primero consumir de tokens mensuales
  IF v_monthly_remaining > 0 THEN
    v_monthly_consumed := LEAST(v_tokens_left, v_monthly_remaining);
    v_tokens_left := v_tokens_left - v_monthly_consumed;
  END IF;

  -- Si no alcanza, consumir de tokens comprados
  IF v_tokens_left > 0 AND v_purchased_balance > 0 THEN
    v_purchased_consumed := LEAST(v_tokens_left, v_purchased_balance);
    v_tokens_left := v_tokens_left - v_purchased_consumed;
  END IF;

  -- Verificar si hay suficientes tokens
  IF v_tokens_left > 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Tokens insuficientes',
      'needed', p_tokens,
      'available', v_monthly_remaining + v_purchased_balance
    );
  END IF;

  -- Actualizar balances
  UPDATE profiles
  SET
    ai_credits_remaining = v_monthly_remaining - v_monthly_consumed,
    token_balance = v_purchased_balance - v_purchased_consumed,
    updated_at = NOW()
  WHERE id = p_user_id;

  -- Registrar transacción
  INSERT INTO token_transactions (
    user_id, type, tokens_amount,
    balance_before, balance_after,
    context, description
  ) VALUES (
    p_user_id, 'consumption', p_tokens,
    v_monthly_remaining + v_purchased_balance,
    (v_monthly_remaining - v_monthly_consumed) + (v_purchased_balance - v_purchased_consumed),
    p_context,
    'Consumo de ' || p_tokens || ' tokens en ' || p_context
  );

  RETURN jsonb_build_object(
    'success', true,
    'tokens_consumed', p_tokens,
    'monthly_consumed', v_monthly_consumed,
    'purchased_consumed', v_purchased_consumed,
    'monthly_remaining', v_monthly_remaining - v_monthly_consumed,
    'purchased_remaining', v_purchased_balance - v_purchased_consumed,
    'total_remaining', (v_monthly_remaining - v_monthly_consumed) + (v_purchased_balance - v_purchased_consumed)
  );
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 8. FUNCIÓN PARA VERIFICAR PAGO BTC (llamada desde Edge Function)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION verify_btc_payment(
  p_request_id UUID,
  p_tx_confirmed BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_request RECORD;
  v_result JSONB;
BEGIN
  -- Obtener solicitud
  SELECT * INTO v_request
  FROM btc_payment_requests
  WHERE id = p_request_id;

  IF v_request IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Request not found');
  END IF;

  IF v_request.status NOT IN ('submitted', 'verifying') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid request status: ' || v_request.status);
  END IF;

  IF p_tx_confirmed THEN
    -- Marcar como verificado
    UPDATE btc_payment_requests
    SET status = 'verified', verified_at = NOW()
    WHERE id = p_request_id;

    -- Añadir tokens al usuario
    SELECT add_purchased_tokens(
      v_request.user_id,
      v_request.tokens_amount,
      'btc',
      v_request.tx_id,
      v_request.package_id
    ) INTO v_result;

    RETURN jsonb_build_object(
      'success', true,
      'status', 'verified',
      'tokens_added', v_request.tokens_amount,
      'user_id', v_request.user_id
    );
  ELSE
    -- Marcar como en verificación
    UPDATE btc_payment_requests
    SET status = 'verifying'
    WHERE id = p_request_id;

    RETURN jsonb_build_object(
      'success', true,
      'status', 'verifying',
      'message', 'Waiting for blockchain confirmation'
    );
  END IF;
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 9. FUNCIÓN PARA RESET MENSUAL DE TOKENS
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION reset_monthly_tokens()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER := 0;
  v_plan_tokens JSONB := '{
    "free": 5000,
    "premium": 100000,
    "pro": 300000
  }'::JSONB;
BEGIN
  -- Actualizar usuarios cuya fecha de reset ha pasado
  WITH updated AS (
    UPDATE profiles
    SET
      ai_credits_remaining = COALESCE((v_plan_tokens->>subscription_tier)::INTEGER, 5000),
      ai_credits_reset_date = (DATE_TRUNC('month', NOW()) + INTERVAL '1 month')::DATE
    WHERE ai_credits_reset_date <= NOW()
    RETURNING id, subscription_tier
  )
  SELECT COUNT(*) INTO v_count FROM updated;

  -- Registrar en logs si hay actualizaciones
  IF v_count > 0 THEN
    INSERT INTO token_transactions (user_id, type, tokens_amount, description)
    SELECT
      id,
      'monthly_reset',
      COALESCE((v_plan_tokens->>subscription_tier)::INTEGER, 5000),
      'Reset mensual de tokens del plan ' || subscription_tier
    FROM profiles
    WHERE ai_credits_reset_date = (DATE_TRUNC('month', NOW()) + INTERVAL '1 month')::DATE;
  END IF;

  RETURN v_count;
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 10. CRON JOB PARA RESET MENSUAL (si pg_cron está disponible)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Nota: Ejecutar manualmente si pg_cron no está disponible
-- SELECT cron.schedule('monthly-token-reset', '0 0 1 * *', 'SELECT reset_monthly_tokens()');

-- ═══════════════════════════════════════════════════════════════════════════════
-- 11. EXPIRAR SOLICITUDES BTC ANTIGUAS
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION expire_old_btc_requests()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE btc_payment_requests
  SET status = 'expired'
  WHERE status IN ('pending', 'submitted')
    AND expires_at < NOW();

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 12. INICIALIZAR TOKENS PARA USUARIOS EXISTENTES
-- ═══════════════════════════════════════════════════════════════════════════════

-- Asegurar que todos los usuarios tengan token_balance inicializado
UPDATE profiles
SET token_balance = 0
WHERE token_balance IS NULL;

UPDATE profiles
SET tokens_purchased_total = 0
WHERE tokens_purchased_total IS NULL;

-- ═══════════════════════════════════════════════════════════════════════════════
-- NOTAS DE IMPLEMENTACIÓN
-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. Las Edge Functions deben llamar a add_purchased_tokens() después de verificar pagos
-- 2. El proxy PHP llama directamente a UPDATE profiles para consumir tokens
-- 3. El reset mensual se puede ejecutar via cron o desde una Edge Function programada
-- 4. La verificación BTC se hace via API de blockchain (blockstream.info o similar)
