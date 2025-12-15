-- ═══════════════════════════════════════════════════════════════════════════════
-- MIGRACIÓN INICIAL - Sistema de Usuarios Premium
-- Ejecutar en: Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════════

-- ============================================================================
-- 1. EXTENSIONES
-- ============================================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 2. TABLA DE PERFILES (extiende auth.users)
-- ============================================================================

CREATE TABLE IF NOT EXISTS profiles (
  -- Identificación
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,

  -- Suscripción
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium', 'pro')),
  subscription_status TEXT DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive', 'canceled', 'past_due', 'trialing')),

  -- Stripe
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT,

  -- Fechas de suscripción
  subscription_start TIMESTAMPTZ,
  subscription_end TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,

  -- Créditos de IA
  ai_credits_remaining INTEGER DEFAULT 10,
  ai_credits_total INTEGER DEFAULT 10,
  ai_credits_reset_date TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 month'),

  -- Features habilitadas (JSON flexible)
  features JSONB DEFAULT '{
    "ai_chat": false,
    "ai_tutor": false,
    "ai_game_master": false,
    "advanced_analytics": false,
    "export_pdf": false,
    "cloud_sync": true,
    "custom_themes": false,
    "priority_support": false
  }'::jsonb,

  -- Metadatos
  onboarding_completed BOOLEAN DEFAULT false,
  preferences JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_profiles_subscription_tier ON profiles(subscription_tier);
CREATE INDEX idx_profiles_stripe_customer ON profiles(stripe_customer_id);
CREATE INDEX idx_profiles_subscription_status ON profiles(subscription_status);

-- ============================================================================
-- 3. TABLA DE USO DE IA
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,

  -- Detalles de la llamada
  provider TEXT NOT NULL, -- 'claude', 'openai', 'gemini', etc
  model TEXT NOT NULL,
  context TEXT NOT NULL, -- 'book_chat', 'game_npc', 'quiz_generation', etc

  -- Uso
  tokens_input INTEGER DEFAULT 0,
  tokens_output INTEGER DEFAULT 0,
  tokens_total INTEGER DEFAULT 0,

  -- Costo
  cost_usd DECIMAL(10,6) DEFAULT 0,

  -- Metadatos opcionales
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para analytics
CREATE INDEX idx_ai_usage_user_date ON ai_usage(user_id, created_at DESC);
CREATE INDEX idx_ai_usage_context ON ai_usage(context);
CREATE INDEX idx_ai_usage_provider ON ai_usage(provider);
CREATE INDEX idx_ai_usage_created_at ON ai_usage(created_at DESC);

-- ============================================================================
-- 4. TABLA DE TRANSACCIONES
-- ============================================================================

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,

  -- Stripe
  stripe_payment_id TEXT UNIQUE,
  stripe_invoice_id TEXT,

  -- Detalles del pago
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'eur',
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded', 'canceled')),

  -- Descripción
  description TEXT,
  item_description TEXT,

  -- Metadatos
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Índices
CREATE INDEX idx_transactions_user_date ON transactions(user_id, created_at DESC);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_stripe_payment ON transactions(stripe_payment_id);

-- ============================================================================
-- 5. TABLA DE EVENTOS DE SUSCRIPCIÓN (Audit Log)
-- ============================================================================

CREATE TABLE IF NOT EXISTS subscription_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,

  event_type TEXT NOT NULL, -- 'created', 'upgraded', 'downgraded', 'canceled', 'renewed', 'payment_failed'
  from_tier TEXT,
  to_tier TEXT,

  -- Detalles
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscription_events_user ON subscription_events(user_id, created_at DESC);

-- ============================================================================
-- 6. FUNCIONES HELPER
-- ============================================================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 7. FUNCIÓN: Crear perfil automáticamente al registrarse
-- ============================================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear perfil automáticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================================================
-- 8. FUNCIÓN: Resetear créditos mensuales
-- ============================================================================

CREATE OR REPLACE FUNCTION reset_monthly_credits()
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET
    ai_credits_remaining = ai_credits_total,
    ai_credits_reset_date = NOW() + INTERVAL '1 month'
  WHERE
    ai_credits_reset_date <= NOW()
    AND subscription_status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 9. FUNCIÓN: Verificar y consumir créditos
-- ============================================================================

CREATE OR REPLACE FUNCTION consume_ai_credits(
  p_user_id UUID,
  p_credits INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  v_remaining INTEGER;
BEGIN
  -- Obtener créditos actuales
  SELECT ai_credits_remaining INTO v_remaining
  FROM profiles
  WHERE id = p_user_id;

  -- Verificar si tiene suficientes
  IF v_remaining < p_credits THEN
    RETURN FALSE;
  END IF;

  -- Consumir créditos
  UPDATE profiles
  SET ai_credits_remaining = ai_credits_remaining - p_credits
  WHERE id = p_user_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 10. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLICIES PARA PROFILES
-- ============================================================================

-- Los usuarios pueden ver su propio perfil
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Los usuarios pueden actualizar su propio perfil (campos limitados)
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Inserción solo mediante trigger (seguridad)
DROP POLICY IF EXISTS "Profiles are created via trigger" ON profiles;
CREATE POLICY "Profiles are created via trigger"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================================================
-- POLICIES PARA AI_USAGE
-- ============================================================================

-- Los usuarios pueden ver su propio uso
DROP POLICY IF EXISTS "Users can view own AI usage" ON ai_usage;
CREATE POLICY "Users can view own AI usage"
  ON ai_usage FOR SELECT
  USING (auth.uid() = user_id);

-- Solo el sistema puede insertar registros de uso
DROP POLICY IF EXISTS "System can insert AI usage" ON ai_usage;
CREATE POLICY "System can insert AI usage"
  ON ai_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- POLICIES PARA TRANSACTIONS
-- ============================================================================

-- Los usuarios pueden ver sus propias transacciones
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Solo el sistema (via Edge Functions) puede insertar
DROP POLICY IF EXISTS "System can insert transactions" ON transactions;
CREATE POLICY "System can insert transactions"
  ON transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- POLICIES PARA SUBSCRIPTION_EVENTS
-- ============================================================================

-- Los usuarios pueden ver sus propios eventos
DROP POLICY IF EXISTS "Users can view own events" ON subscription_events;
CREATE POLICY "Users can view own events"
  ON subscription_events FOR SELECT
  USING (auth.uid() = user_id);

-- Solo el sistema puede insertar eventos
DROP POLICY IF EXISTS "System can insert events" ON subscription_events;
CREATE POLICY "System can insert events"
  ON subscription_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 11. DATOS DE EJEMPLO (DESARROLLO)
-- ============================================================================

-- Usuario de prueba (descomentar solo en desarrollo)
/*
INSERT INTO profiles (id, email, full_name, subscription_tier, subscription_status, ai_credits_remaining, ai_credits_total, features)
VALUES (
  gen_random_uuid(),
  'test@nuevosser.com',
  'Usuario de Prueba',
  'premium',
  'active',
  500,
  500,
  '{
    "ai_chat": true,
    "ai_tutor": true,
    "ai_game_master": false,
    "advanced_analytics": true,
    "export_pdf": true,
    "cloud_sync": true
  }'::jsonb
);
*/

-- ============================================================================
-- 12. VISTAS ÚTILES
-- ============================================================================

-- Vista: Estadísticas de uso de IA por usuario
CREATE OR REPLACE VIEW user_ai_stats AS
SELECT
  user_id,
  COUNT(*) as total_calls,
  SUM(tokens_total) as total_tokens,
  SUM(cost_usd) as total_cost,
  AVG(tokens_total) as avg_tokens_per_call,
  COUNT(DISTINCT context) as unique_contexts,
  MAX(created_at) as last_used
FROM ai_usage
GROUP BY user_id;

-- Vista: Resumen de suscripciones activas
CREATE OR REPLACE VIEW active_subscriptions AS
SELECT
  subscription_tier,
  COUNT(*) as count,
  SUM(ai_credits_remaining) as total_credits_remaining,
  AVG(ai_credits_remaining) as avg_credits_remaining
FROM profiles
WHERE subscription_status = 'active'
GROUP BY subscription_tier;

-- ============================================================================
-- 13. FUNCIONES ADMINISTRATIVAS
-- ============================================================================

-- Función: Obtener métricas generales
CREATE OR REPLACE FUNCTION get_admin_metrics()
RETURNS TABLE (
  total_users BIGINT,
  free_users BIGINT,
  premium_users BIGINT,
  pro_users BIGINT,
  active_subscriptions BIGINT,
  total_revenue_month NUMERIC,
  total_ai_calls_month BIGINT,
  total_ai_cost_month NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT p.id) as total_users,
    COUNT(DISTINCT p.id) FILTER (WHERE p.subscription_tier = 'free') as free_users,
    COUNT(DISTINCT p.id) FILTER (WHERE p.subscription_tier = 'premium') as premium_users,
    COUNT(DISTINCT p.id) FILTER (WHERE p.subscription_tier = 'pro') as pro_users,
    COUNT(DISTINCT p.id) FILTER (WHERE p.subscription_status = 'active') as active_subscriptions,

    COALESCE((SELECT SUM(amount) FROM transactions
     WHERE status = 'completed'
     AND created_at > NOW() - INTERVAL '30 days'), 0) as total_revenue_month,

    COALESCE((SELECT COUNT(*) FROM ai_usage
     WHERE created_at > NOW() - INTERVAL '30 days'), 0) as total_ai_calls_month,

    COALESCE((SELECT SUM(cost_usd) FROM ai_usage
     WHERE created_at > NOW() - INTERVAL '30 days'), 0) as total_ai_cost_month
  FROM profiles p;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FIN DE LA MIGRACIÓN
-- ============================================================================

-- Comentarios finales
COMMENT ON TABLE profiles IS 'Perfiles de usuario con información de suscripción y créditos de IA';
COMMENT ON TABLE ai_usage IS 'Registro de uso de IA para tracking y billing';
COMMENT ON TABLE transactions IS 'Historial de pagos y transacciones';
COMMENT ON TABLE subscription_events IS 'Log de eventos de suscripción para auditoría';

-- ✅ Migración completada
-- Siguiente paso: Configurar Stripe y Edge Functions
