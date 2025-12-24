-- ============================================================================
-- FRANKENSTEIN LAB - Tablas para sincronización de seres
-- Ejecutar en Supabase SQL Editor
-- ============================================================================

-- Tabla principal de seres
CREATE TABLE IF NOT EXISTS public.frankenstein_beings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  being_id TEXT NOT NULL,
  being_data JSONB NOT NULL DEFAULT '{}',

  -- Campos indexables para búsquedas rápidas
  name TEXT,
  level INTEGER DEFAULT 1,
  total_power NUMERIC DEFAULT 0,
  specialty TEXT,
  missions_completed INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraint único por usuario + being_id
  UNIQUE(user_id, being_id)
);

-- Índices para rendimiento
CREATE INDEX IF NOT EXISTS idx_frankenstein_beings_user_id
  ON public.frankenstein_beings(user_id);
CREATE INDEX IF NOT EXISTS idx_frankenstein_beings_level
  ON public.frankenstein_beings(level DESC);
CREATE INDEX IF NOT EXISTS idx_frankenstein_beings_power
  ON public.frankenstein_beings(total_power DESC);
CREATE INDEX IF NOT EXISTS idx_frankenstein_beings_updated
  ON public.frankenstein_beings(updated_at DESC);

-- Tabla de configuración del lab por usuario
CREATE TABLE IF NOT EXISTS public.frankenstein_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  settings_data JSONB NOT NULL DEFAULT '{}',

  -- Campos específicos para búsquedas
  game_mode TEXT DEFAULT 'juego',
  difficulty TEXT DEFAULT 'principiante',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de logros globales del usuario
CREATE TABLE IF NOT EXISTS public.frankenstein_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL,
  achievement_data JSONB NOT NULL DEFAULT '{}',

  -- Campos del logro
  name TEXT,
  description TEXT,
  icon TEXT,

  -- Timestamps
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraint único por usuario + logro
  UNIQUE(user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_frankenstein_achievements_user
  ON public.frankenstein_achievements(user_id);

-- Tabla de estadísticas globales del usuario en Frankenstein
CREATE TABLE IF NOT EXISTS public.frankenstein_user_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,

  -- Estadísticas acumuladas
  total_beings_created INTEGER DEFAULT 0,
  total_missions_completed INTEGER DEFAULT 0,
  total_xp_earned BIGINT DEFAULT 0,
  total_play_time_ms BIGINT DEFAULT 0,
  highest_level_reached INTEGER DEFAULT 1,
  highest_power_reached NUMERIC DEFAULT 0,

  -- Rachas
  longest_streak INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,

  -- Preferencias de juego
  favorite_mission_type TEXT,
  favorite_specialty TEXT,

  -- Timestamps
  first_played_at TIMESTAMPTZ DEFAULT NOW(),
  last_played_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de leaderboard (opcional)
CREATE TABLE IF NOT EXISTS public.frankenstein_leaderboard (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  being_id TEXT NOT NULL,

  -- Datos para ranking
  name TEXT NOT NULL,
  level INTEGER NOT NULL,
  total_power NUMERIC NOT NULL,
  specialty TEXT,
  missions_completed INTEGER DEFAULT 0,

  -- Para identificar al usuario (sin exponer email)
  display_name TEXT,
  avatar_url TEXT,

  -- Timestamps
  submitted_at TIMESTAMPTZ DEFAULT NOW(),

  -- Solo un ser por usuario en el leaderboard
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_frankenstein_leaderboard_power
  ON public.frankenstein_leaderboard(total_power DESC);
CREATE INDEX IF NOT EXISTS idx_frankenstein_leaderboard_level
  ON public.frankenstein_leaderboard(level DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE public.frankenstein_beings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.frankenstein_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.frankenstein_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.frankenstein_user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.frankenstein_leaderboard ENABLE ROW LEVEL SECURITY;

-- Políticas para frankenstein_beings
CREATE POLICY "Users can view own beings" ON public.frankenstein_beings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own beings" ON public.frankenstein_beings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own beings" ON public.frankenstein_beings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own beings" ON public.frankenstein_beings
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas para frankenstein_settings
CREATE POLICY "Users can view own settings" ON public.frankenstein_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON public.frankenstein_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON public.frankenstein_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- Políticas para frankenstein_achievements
CREATE POLICY "Users can view own achievements" ON public.frankenstein_achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements" ON public.frankenstein_achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Políticas para frankenstein_user_stats
CREATE POLICY "Users can view own stats" ON public.frankenstein_user_stats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stats" ON public.frankenstein_user_stats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stats" ON public.frankenstein_user_stats
  FOR UPDATE USING (auth.uid() = user_id);

-- Políticas para leaderboard (todos pueden ver, solo el propio puede editar)
CREATE POLICY "Anyone can view leaderboard" ON public.frankenstein_leaderboard
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own leaderboard entry" ON public.frankenstein_leaderboard
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own leaderboard entry" ON public.frankenstein_leaderboard
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own leaderboard entry" ON public.frankenstein_leaderboard
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- FUNCIONES Y TRIGGERS
-- ============================================================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
DROP TRIGGER IF EXISTS update_frankenstein_beings_updated_at ON public.frankenstein_beings;
CREATE TRIGGER update_frankenstein_beings_updated_at
  BEFORE UPDATE ON public.frankenstein_beings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_frankenstein_settings_updated_at ON public.frankenstein_settings;
CREATE TRIGGER update_frankenstein_settings_updated_at
  BEFORE UPDATE ON public.frankenstein_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_frankenstein_user_stats_updated_at ON public.frankenstein_user_stats;
CREATE TRIGGER update_frankenstein_user_stats_updated_at
  BEFORE UPDATE ON public.frankenstein_user_stats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para actualizar estadísticas del usuario cuando se modifica un ser
CREATE OR REPLACE FUNCTION update_user_frankenstein_stats()
RETURNS TRIGGER AS $$
DECLARE
  stats_record RECORD;
BEGIN
  -- Calcular estadísticas agregadas
  SELECT
    COUNT(*) as total_beings,
    COALESCE(SUM((being_data->>'stats'->>'missionsCompleted')::INTEGER), 0) as total_missions,
    COALESCE(SUM((being_data->>'stats'->>'totalXpEarned')::BIGINT), 0) as total_xp,
    COALESCE(MAX(level), 1) as max_level,
    COALESCE(MAX(total_power), 0) as max_power
  INTO stats_record
  FROM public.frankenstein_beings
  WHERE user_id = COALESCE(NEW.user_id, OLD.user_id);

  -- Upsert en la tabla de estadísticas
  INSERT INTO public.frankenstein_user_stats (
    user_id,
    total_beings_created,
    total_missions_completed,
    total_xp_earned,
    highest_level_reached,
    highest_power_reached,
    last_played_at
  )
  VALUES (
    COALESCE(NEW.user_id, OLD.user_id),
    stats_record.total_beings,
    stats_record.total_missions,
    stats_record.total_xp,
    stats_record.max_level,
    stats_record.max_power,
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_beings_created = stats_record.total_beings,
    total_missions_completed = stats_record.total_missions,
    total_xp_earned = stats_record.total_xp,
    highest_level_reached = GREATEST(frankenstein_user_stats.highest_level_reached, stats_record.max_level),
    highest_power_reached = GREATEST(frankenstein_user_stats.highest_power_reached, stats_record.max_power),
    last_played_at = NOW();

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar stats cuando cambia un ser
DROP TRIGGER IF EXISTS update_user_stats_on_being_change ON public.frankenstein_beings;
CREATE TRIGGER update_user_stats_on_being_change
  AFTER INSERT OR UPDATE OR DELETE ON public.frankenstein_beings
  FOR EACH ROW EXECUTE FUNCTION update_user_frankenstein_stats();

-- ============================================================================
-- DATOS INICIALES (opcional)
-- ============================================================================

-- Crear entrada de stats para usuarios existentes que no tienen
INSERT INTO public.frankenstein_user_stats (user_id)
SELECT id FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.frankenstein_user_stats)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- COMENTARIOS
-- ============================================================================

COMMENT ON TABLE public.frankenstein_beings IS 'Seres Transformadores creados por los usuarios';
COMMENT ON TABLE public.frankenstein_settings IS 'Configuración del Frankenstein Lab por usuario';
COMMENT ON TABLE public.frankenstein_achievements IS 'Logros desbloqueados en el juego';
COMMENT ON TABLE public.frankenstein_user_stats IS 'Estadísticas globales del usuario en Frankenstein';
COMMENT ON TABLE public.frankenstein_leaderboard IS 'Tabla de clasificación pública';
