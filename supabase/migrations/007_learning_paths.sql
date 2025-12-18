-- ═══════════════════════════════════════════════════════════════════════════════
-- MIGRACIÓN 007 - Sistema de Learning Paths (Jornadas de Aprendizaje)
-- Ejecutar en: Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════════

-- ============================================================================
-- 1. TABLAS PRINCIPALES
-- ============================================================================

-- Tabla de paths disponibles
CREATE TABLE IF NOT EXISTS learning_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(100) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  duration_days INTEGER NOT NULL, -- 7, 21, 30
  difficulty VARCHAR(20) DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  objectives JSONB DEFAULT '[]'::jsonb, -- ["Objetivo 1", "Objetivo 2"]
  requirements JSONB DEFAULT '{}'::jsonb, -- { "books": [], "minLevel": 0 }
  tags JSONB DEFAULT '[]'::jsonb, -- ["transformación", "despertar", "práctica"]
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  is_premium BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE learning_paths IS 'Paths de aprendizaje disponibles en la plataforma';
COMMENT ON COLUMN learning_paths.slug IS 'Identificador único amigable (ej: viaje-despertar)';
COMMENT ON COLUMN learning_paths.objectives IS 'Lista de objetivos que se lograrán al completar el path';
COMMENT ON COLUMN learning_paths.requirements IS 'Prerrequisitos para iniciar el path';

-- Etapas de cada path (días)
CREATE TABLE IF NOT EXISTS learning_path_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  path_id UUID REFERENCES learning_paths(id) ON DELETE CASCADE NOT NULL,
  day_number INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,

  -- Tipo de contenido de la etapa
  content_type VARCHAR(50) NOT NULL CHECK (content_type IN (
    'reading',      -- Lectura de capítulo
    'exercise',     -- Ejercicio práctico
    'meditation',   -- Meditación guiada
    'quiz',         -- Quiz de comprensión
    'reflection',   -- Reflexión escrita
    'video',        -- Video educativo
    'mixed'         -- Combinación de varios tipos
  )),

  -- Referencia al contenido
  content_reference JSONB NOT NULL, -- { "bookId": "codigo-despertar", "chapterId": "cap1" } o { "exerciseId": "meditation-1" }

  -- Detalles de la etapa
  duration_minutes INTEGER DEFAULT 30,
  is_optional BOOLEAN DEFAULT false,
  unlock_condition JSONB DEFAULT '{}'::jsonb, -- { "requiresPrevious": true, "minScore": 70 }

  -- Orden dentro del día
  order_index INTEGER NOT NULL,

  -- Recursos adicionales
  resources JSONB DEFAULT '[]'::jsonb, -- [{ "title": "PDF Guide", "url": "..." }]

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(path_id, day_number, order_index)
);

COMMENT ON TABLE learning_path_stages IS 'Etapas diarias de cada learning path';
COMMENT ON COLUMN learning_path_stages.content_type IS 'Tipo de actividad: reading, exercise, meditation, quiz, reflection, video, mixed';
COMMENT ON COLUMN learning_path_stages.content_reference IS 'Referencia al contenido específico (bookId+chapterId, exerciseId, etc)';

-- Progreso del usuario en paths
CREATE TABLE IF NOT EXISTS user_learning_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  path_id UUID REFERENCES learning_paths(id) ON DELETE CASCADE NOT NULL,

  -- Estado del path
  status VARCHAR(20) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned', 'paused')),

  -- Progreso
  started_at TIMESTAMPTZ DEFAULT NOW(),
  current_day INTEGER DEFAULT 1,
  completed_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),

  -- Racha (streak)
  streak_days INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_streak_date DATE,

  -- Estadísticas
  total_time_minutes INTEGER DEFAULT 0,
  completion_percentage INTEGER DEFAULT 0,

  -- Certificación
  certificate_issued_at TIMESTAMPTZ,
  certificate_url TEXT,

  -- Metadatos
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, path_id)
);

COMMENT ON TABLE user_learning_paths IS 'Progreso de usuarios en learning paths';
COMMENT ON COLUMN user_learning_paths.streak_days IS 'Días consecutivos de actividad actual';
COMMENT ON COLUMN user_learning_paths.longest_streak IS 'Mejor racha histórica';

-- Progreso de etapas individuales
CREATE TABLE IF NOT EXISTS user_stage_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user_path_id UUID REFERENCES user_learning_paths(id) ON DELETE CASCADE NOT NULL,
  stage_id UUID REFERENCES learning_path_stages(id) ON DELETE CASCADE NOT NULL,

  -- Estado
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),

  -- Progreso
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  time_spent_minutes INTEGER DEFAULT 0,

  -- Evaluación (si aplica)
  score INTEGER CHECK (score BETWEEN 0 AND 100),
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),

  -- Notas y reflexiones del usuario
  notes TEXT,
  reflections JSONB DEFAULT '[]'::jsonb, -- [{ "question": "...", "answer": "..." }]

  -- Metadatos
  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, stage_id)
);

COMMENT ON TABLE user_stage_progress IS 'Progreso detallado en cada etapa de un learning path';
COMMENT ON COLUMN user_stage_progress.reflections IS 'Respuestas a preguntas de reflexión';

-- ============================================================================
-- 2. ÍNDICES PARA PERFORMANCE
-- ============================================================================

-- Learning paths
CREATE INDEX idx_learning_paths_active ON learning_paths(is_active, sort_order) WHERE is_active = true;
CREATE INDEX idx_learning_paths_difficulty ON learning_paths(difficulty);
CREATE INDEX idx_learning_paths_duration ON learning_paths(duration_days);
CREATE INDEX idx_learning_paths_premium ON learning_paths(is_premium);

-- Path stages
CREATE INDEX idx_path_stages_path_day ON learning_path_stages(path_id, day_number, order_index);
CREATE INDEX idx_path_stages_content_type ON learning_path_stages(content_type);

-- User paths
CREATE INDEX idx_user_paths_user_status ON user_learning_paths(user_id, status);
CREATE INDEX idx_user_paths_active ON user_learning_paths(user_id, status) WHERE status = 'in_progress';
CREATE INDEX idx_user_paths_last_activity ON user_learning_paths(user_id, last_activity_at DESC);
CREATE INDEX idx_user_paths_completed ON user_learning_paths(user_id, completed_at) WHERE status = 'completed';

-- Stage progress
CREATE INDEX idx_stage_progress_user_path ON user_stage_progress(user_path_id, stage_id);
CREATE INDEX idx_stage_progress_status ON user_stage_progress(user_id, status);
CREATE INDEX idx_stage_progress_completed ON user_stage_progress(user_id, completed_at) WHERE status = 'completed';

-- ============================================================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_path_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stage_progress ENABLE ROW LEVEL SECURITY;

-- Policies para learning_paths (público puede ver paths activos)
CREATE POLICY "Cualquiera puede ver paths activos"
  ON learning_paths FOR SELECT
  USING (is_active = true);

CREATE POLICY "Solo admins pueden modificar paths"
  ON learning_paths FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Policies para learning_path_stages (público puede ver stages de paths activos)
CREATE POLICY "Cualquiera puede ver stages de paths activos"
  ON learning_path_stages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM learning_paths
      WHERE id = learning_path_stages.path_id
      AND is_active = true
    )
  );

CREATE POLICY "Solo admins pueden modificar stages"
  ON learning_path_stages FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Policies para user_learning_paths (usuarios solo ven sus propios paths)
CREATE POLICY "Usuarios pueden ver sus propios paths"
  ON user_learning_paths FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden crear sus propios paths"
  ON user_learning_paths FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden actualizar sus propios paths"
  ON user_learning_paths FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden eliminar sus propios paths"
  ON user_learning_paths FOR DELETE
  USING (auth.uid() = user_id);

-- Policies para user_stage_progress (usuarios solo ven su propio progreso)
CREATE POLICY "Usuarios pueden ver su propio progreso"
  ON user_stage_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden crear su propio progreso"
  ON user_stage_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden actualizar su propio progreso"
  ON user_stage_progress FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden eliminar su propio progreso"
  ON user_stage_progress FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 4. TRIGGERS
-- ============================================================================

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_learning_paths_updated_at
  BEFORE UPDATE ON learning_paths
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_learning_path_stages_updated_at
  BEFORE UPDATE ON learning_path_stages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_learning_paths_updated_at
  BEFORE UPDATE ON user_learning_paths
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_stage_progress_updated_at
  BEFORE UPDATE ON user_stage_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para actualizar streak cuando se completa una etapa
CREATE OR REPLACE FUNCTION update_learning_path_streak()
RETURNS TRIGGER AS $$
DECLARE
  current_date_only DATE;
  last_streak_date_value DATE;
  days_difference INTEGER;
BEGIN
  -- Solo procesar cuando una etapa se completa
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    current_date_only := CURRENT_DATE;

    -- Obtener el user_learning_path correspondiente
    SELECT last_streak_date INTO last_streak_date_value
    FROM user_learning_paths
    WHERE id = NEW.user_path_id;

    -- Calcular diferencia de días
    IF last_streak_date_value IS NULL THEN
      -- Primera actividad
      UPDATE user_learning_paths
      SET
        streak_days = 1,
        longest_streak = GREATEST(longest_streak, 1),
        last_streak_date = current_date_only,
        last_activity_at = NOW()
      WHERE id = NEW.user_path_id;
    ELSE
      days_difference := current_date_only - last_streak_date_value;

      IF days_difference = 0 THEN
        -- Misma fecha, no cambiar streak
        UPDATE user_learning_paths
        SET last_activity_at = NOW()
        WHERE id = NEW.user_path_id;

      ELSIF days_difference = 1 THEN
        -- Día consecutivo, incrementar streak
        UPDATE user_learning_paths
        SET
          streak_days = streak_days + 1,
          longest_streak = GREATEST(longest_streak, streak_days + 1),
          last_streak_date = current_date_only,
          last_activity_at = NOW()
        WHERE id = NEW.user_path_id;

      ELSE
        -- Racha rota, reiniciar
        UPDATE user_learning_paths
        SET
          streak_days = 1,
          longest_streak = GREATEST(longest_streak, 1),
          last_streak_date = current_date_only,
          last_activity_at = NOW()
        WHERE id = NEW.user_path_id;
      END IF;
    END IF;

    -- Actualizar porcentaje de completitud
    UPDATE user_learning_paths ulp
    SET completion_percentage = (
      SELECT ROUND(
        (COUNT(*) FILTER (WHERE usp.status = 'completed')::DECIMAL /
         NULLIF(COUNT(*), 0) * 100)::NUMERIC, 0
      )::INTEGER
      FROM user_stage_progress usp
      WHERE usp.user_path_id = ulp.id
    )
    WHERE ulp.id = NEW.user_path_id;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_learning_path_streak
  AFTER INSERT OR UPDATE ON user_stage_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_learning_path_streak();

-- Trigger para marcar path como completado cuando se completan todas las etapas
CREATE OR REPLACE FUNCTION check_path_completion()
RETURNS TRIGGER AS $$
DECLARE
  total_stages INTEGER;
  completed_stages INTEGER;
  path_id_value UUID;
BEGIN
  -- Obtener el path_id del user_learning_path
  SELECT ulp.path_id INTO path_id_value
  FROM user_learning_paths ulp
  WHERE ulp.id = NEW.user_path_id;

  -- Contar etapas totales (excluyendo opcionales)
  SELECT COUNT(*) INTO total_stages
  FROM learning_path_stages
  WHERE path_id = path_id_value
  AND is_optional = false;

  -- Contar etapas completadas
  SELECT COUNT(*) INTO completed_stages
  FROM user_stage_progress usp
  JOIN learning_path_stages lps ON usp.stage_id = lps.id
  WHERE usp.user_path_id = NEW.user_path_id
  AND usp.status = 'completed'
  AND lps.is_optional = false;

  -- Si se completaron todas las etapas, marcar path como completado
  IF completed_stages >= total_stages AND total_stages > 0 THEN
    UPDATE user_learning_paths
    SET
      status = 'completed',
      completed_at = NOW(),
      completion_percentage = 100
    WHERE id = NEW.user_path_id
    AND status != 'completed'; -- Solo actualizar si no estaba completado
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_path_completion
  AFTER INSERT OR UPDATE ON user_stage_progress
  FOR EACH ROW
  EXECUTE FUNCTION check_path_completion();

-- ============================================================================
-- 5. FUNCIONES RPC
-- ============================================================================

-- Función para obtener un path con todas sus etapas y progreso del usuario
CREATE OR REPLACE FUNCTION get_learning_path_with_progress(
  path_slug_param TEXT,
  user_id_param UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  result JSON;
  user_id_to_use UUID;
BEGIN
  -- Usar el user_id proporcionado o el del usuario autenticado
  user_id_to_use := COALESCE(user_id_param, auth.uid());

  SELECT json_build_object(
    'path', row_to_json(lp.*),
    'stages', (
      SELECT json_agg(
        json_build_object(
          'stage', row_to_json(lps.*),
          'progress', (
            SELECT row_to_json(usp.*)
            FROM user_stage_progress usp
            WHERE usp.stage_id = lps.id
            AND usp.user_id = user_id_to_use
          )
        )
        ORDER BY lps.day_number, lps.order_index
      )
      FROM learning_path_stages lps
      WHERE lps.path_id = lp.id
    ),
    'user_progress', (
      SELECT row_to_json(ulp.*)
      FROM user_learning_paths ulp
      WHERE ulp.path_id = lp.id
      AND ulp.user_id = user_id_to_use
    )
  ) INTO result
  FROM learning_paths lp
  WHERE lp.slug = path_slug_param
  AND lp.is_active = true;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener estadísticas del usuario en learning paths
CREATE OR REPLACE FUNCTION get_user_learning_stats(
  user_id_param UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  result JSON;
  user_id_to_use UUID;
BEGIN
  user_id_to_use := COALESCE(user_id_param, auth.uid());

  SELECT json_build_object(
    'total_paths_started', COUNT(*),
    'total_paths_completed', COUNT(*) FILTER (WHERE status = 'completed'),
    'total_paths_in_progress', COUNT(*) FILTER (WHERE status = 'in_progress'),
    'current_streak', MAX(streak_days),
    'longest_streak', MAX(longest_streak),
    'total_time_minutes', COALESCE(SUM(total_time_minutes), 0),
    'average_completion', COALESCE(AVG(completion_percentage), 0)
  ) INTO result
  FROM user_learning_paths
  WHERE user_id = user_id_to_use;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener el siguiente contenido a completar en un path
CREATE OR REPLACE FUNCTION get_next_stage(
  path_slug_param TEXT,
  user_id_param UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  result JSON;
  user_id_to_use UUID;
  user_path_id_value UUID;
  current_day_value INTEGER;
BEGIN
  user_id_to_use := COALESCE(user_id_param, auth.uid());

  -- Obtener el user_learning_path
  SELECT id, current_day INTO user_path_id_value, current_day_value
  FROM user_learning_paths ulp
  JOIN learning_paths lp ON ulp.path_id = lp.id
  WHERE lp.slug = path_slug_param
  AND ulp.user_id = user_id_to_use
  AND ulp.status = 'in_progress';

  IF user_path_id_value IS NULL THEN
    RETURN NULL;
  END IF;

  -- Buscar la primera etapa no completada del día actual
  SELECT row_to_json(lps.*) INTO result
  FROM learning_path_stages lps
  WHERE lps.path_id = (
    SELECT path_id FROM user_learning_paths WHERE id = user_path_id_value
  )
  AND lps.day_number = current_day_value
  AND NOT EXISTS (
    SELECT 1 FROM user_stage_progress usp
    WHERE usp.stage_id = lps.id
    AND usp.user_id = user_id_to_use
    AND usp.status = 'completed'
  )
  ORDER BY lps.order_index
  LIMIT 1;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para avanzar al siguiente día en un path
CREATE OR REPLACE FUNCTION advance_to_next_day(
  path_slug_param TEXT,
  user_id_param UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  user_id_to_use UUID;
  user_path_id_value UUID;
  current_day_value INTEGER;
  max_day INTEGER;
  all_stages_completed BOOLEAN;
BEGIN
  user_id_to_use := COALESCE(user_id_param, auth.uid());

  -- Obtener el user_learning_path
  SELECT ulp.id, ulp.current_day INTO user_path_id_value, current_day_value
  FROM user_learning_paths ulp
  JOIN learning_paths lp ON ulp.path_id = lp.id
  WHERE lp.slug = path_slug_param
  AND ulp.user_id = user_id_to_use
  AND ulp.status = 'in_progress';

  IF user_path_id_value IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Obtener el día máximo del path
  SELECT MAX(day_number) INTO max_day
  FROM learning_path_stages lps
  JOIN user_learning_paths ulp ON lps.path_id = ulp.path_id
  WHERE ulp.id = user_path_id_value;

  -- Verificar que todas las etapas no opcionales del día actual estén completadas
  SELECT NOT EXISTS (
    SELECT 1 FROM learning_path_stages lps
    WHERE lps.path_id = (SELECT path_id FROM user_learning_paths WHERE id = user_path_id_value)
    AND lps.day_number = current_day_value
    AND lps.is_optional = false
    AND NOT EXISTS (
      SELECT 1 FROM user_stage_progress usp
      WHERE usp.stage_id = lps.id
      AND usp.user_id = user_id_to_use
      AND usp.status = 'completed'
    )
  ) INTO all_stages_completed;

  -- Solo avanzar si todas las etapas están completadas y no es el último día
  IF all_stages_completed AND current_day_value < max_day THEN
    UPDATE user_learning_paths
    SET current_day = current_day + 1
    WHERE id = user_path_id_value;

    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 6. DATOS SEED (2 PATHS DE EJEMPLO)
-- ============================================================================

-- Path 1: Viaje del Despertar (7 días - Introductorio)
INSERT INTO learning_paths (slug, title, description, duration_days, difficulty, objectives, requirements, tags, is_active, is_premium, sort_order)
VALUES (
  'viaje-despertar',
  'Viaje del Despertar',
  'Una introducción de 7 días al camino de la conciencia expandida. Perfecto para quienes inician su jornada de transformación personal.',
  7,
  'easy',
  '["Comprender los fundamentos del despertar", "Establecer una práctica diaria de meditación", "Desarrollar consciencia del momento presente", "Integrar nuevas perspectivas en la vida cotidiana"]'::jsonb,
  '{"books": [], "minLevel": 0, "timeCommitment": "20-30 minutos diarios"}'::jsonb,
  '["introducción", "meditación", "despertar", "consciencia"]'::jsonb,
  true,
  false,
  1
) ON CONFLICT (slug) DO NOTHING;

-- Etapas del Path 1
INSERT INTO learning_path_stages (path_id, day_number, title, description, content_type, content_reference, duration_minutes, is_optional, order_index)
SELECT
  lp.id,
  1,
  'El Primer Despertar',
  'Introducción a la consciencia y el despertar. ¿Qué significa realmente despertar?',
  'reading',
  '{"bookId": "codigo-despertar", "chapterId": "prologo"}'::jsonb,
  20,
  false,
  1
FROM learning_paths lp WHERE lp.slug = 'viaje-despertar'
ON CONFLICT (path_id, day_number, order_index) DO NOTHING;

INSERT INTO learning_path_stages (path_id, day_number, title, description, content_type, content_reference, duration_minutes, is_optional, order_index)
SELECT
  lp.id,
  1,
  'Meditación de Presencia',
  'Primera práctica: anclarse en el momento presente',
  'meditation',
  '{"exerciseId": "meditation-presence", "instructions": "Siéntate cómodamente. Cierra los ojos. Respira profundamente 3 veces. Observa tu respiración sin modificarla durante 10 minutos."}'::jsonb,
  15,
  false,
  2
FROM learning_paths lp WHERE lp.slug = 'viaje-despertar'
ON CONFLICT (path_id, day_number, order_index) DO NOTHING;

INSERT INTO learning_path_stages (path_id, day_number, title, description, content_type, content_reference, duration_minutes, is_optional, order_index)
SELECT
  lp.id,
  2,
  'La Naturaleza de la Realidad',
  'Explorando la pregunta fundamental: ¿Qué es real?',
  'reading',
  '{"bookId": "codigo-despertar", "chapterId": "cap1"}'::jsonb,
  25,
  false,
  1
FROM learning_paths lp WHERE lp.slug = 'viaje-despertar'
ON CONFLICT (path_id, day_number, order_index) DO NOTHING;

INSERT INTO learning_path_stages (path_id, day_number, title, description, content_type, content_reference, duration_minutes, is_optional, order_index)
SELECT
  lp.id,
  2,
  'Reflexión: Mi Realidad',
  'Escribe sobre tu percepción actual de la realidad',
  'reflection',
  '{"questions": ["¿Cómo defines tu realidad actual?", "¿Qué aspectos de tu vida das por sentado?", "¿Qué cuestionarías si pudieras?"]}'::jsonb,
  15,
  false,
  2
FROM learning_paths lp WHERE lp.slug = 'viaje-despertar'
ON CONFLICT (path_id, day_number, order_index) DO NOTHING;

INSERT INTO learning_path_stages (path_id, day_number, title, description, content_type, content_reference, duration_minutes, is_optional, order_index)
SELECT
  lp.id,
  3,
  'Consciencia y Observación',
  'Desarrollando el músculo de la observación consciente',
  'reading',
  '{"bookId": "codigo-despertar", "chapterId": "cap2"}'::jsonb,
  25,
  false,
  1
FROM learning_paths lp WHERE lp.slug = 'viaje-despertar'
ON CONFLICT (path_id, day_number, order_index) DO NOTHING;

INSERT INTO learning_path_stages (path_id, day_number, title, description, content_type, content_reference, duration_minutes, is_optional, order_index)
SELECT
  lp.id,
  3,
  'Ejercicio de Observación',
  'Práctica: observar sin juzgar durante el día',
  'exercise',
  '{"instructions": "Durante todo el día de hoy, practica observar tus pensamientos, emociones y reacciones sin juzgarlos. Simplemente nota que están ahí.", "checkpoints": ["Mañana: observa tus primeros pensamientos", "Tarde: nota tus reacciones emocionales", "Noche: reflexiona sobre lo observado"]}'::jsonb,
  30,
  false,
  2
FROM learning_paths lp WHERE lp.slug = 'viaje-despertar'
ON CONFLICT (path_id, day_number, order_index) DO NOTHING;

INSERT INTO learning_path_stages (path_id, day_number, title, description, content_type, content_reference, duration_minutes, is_optional, order_index)
SELECT
  lp.id,
  4,
  'El Poder del Ahora',
  'Vivir en el momento presente como práctica transformadora',
  'reading',
  '{"bookId": "manual-practico", "chapterId": "cap1"}'::jsonb,
  20,
  false,
  1
FROM learning_paths lp WHERE lp.slug = 'viaje-despertar'
ON CONFLICT (path_id, day_number, order_index) DO NOTHING;

INSERT INTO learning_path_stages (path_id, day_number, title, description, content_type, content_reference, duration_minutes, is_optional, order_index)
SELECT
  lp.id,
  4,
  'Meditación del Ahora',
  'Anclarse completamente en el momento presente',
  'meditation',
  '{"exerciseId": "meditation-now", "instructions": "Siéntate en silencio. Pregúntate: ¿Qué está ocurriendo AHORA? ¿Qué estoy experimentando en este preciso instante? Permanece con esa pregunta 15 minutos."}'::jsonb,
  20,
  false,
  2
FROM learning_paths lp WHERE lp.slug = 'viaje-despertar'
ON CONFLICT (path_id, day_number, order_index) DO NOTHING;

INSERT INTO learning_path_stages (path_id, day_number, title, description, content_type, content_reference, duration_minutes, is_optional, order_index)
SELECT
  lp.id,
  5,
  'Liberando Condicionamientos',
  'Identificar y soltar creencias limitantes',
  'reading',
  '{"bookId": "codigo-despertar", "chapterId": "cap3"}'::jsonb,
  25,
  false,
  1
FROM learning_paths lp WHERE lp.slug = 'viaje-despertar'
ON CONFLICT (path_id, day_number, order_index) DO NOTHING;

INSERT INTO learning_path_stages (path_id, day_number, title, description, content_type, content_reference, duration_minutes, is_optional, order_index)
SELECT
  lp.id,
  5,
  'Ejercicio: Mis Condicionamientos',
  'Identifica 3 creencias que limitan tu vida',
  'reflection',
  '{"questions": ["¿Qué creencias heredaste de tu familia?", "¿Qué ''deberías'' guían tu vida?", "¿Qué sería posible si soltaras una de estas creencias?"]}'::jsonb,
  20,
  false,
  2
FROM learning_paths lp WHERE lp.slug = 'viaje-despertar'
ON CONFLICT (path_id, day_number, order_index) DO NOTHING;

INSERT INTO learning_path_stages (path_id, day_number, title, description, content_type, content_reference, duration_minutes, is_optional, order_index)
SELECT
  lp.id,
  6,
  'La Interconexión de Todo',
  'Comprender que todo está conectado en una red invisible',
  'reading',
  '{"bookId": "codigo-despertar", "chapterId": "cap4"}'::jsonb,
  25,
  false,
  1
FROM learning_paths lp WHERE lp.slug = 'viaje-despertar'
ON CONFLICT (path_id, day_number, order_index) DO NOTHING;

INSERT INTO learning_path_stages (path_id, day_number, title, description, content_type, content_reference, duration_minutes, is_optional, order_index)
SELECT
  lp.id,
  6,
  'Meditación de Conexión',
  'Sentir la conexión con todo lo que existe',
  'meditation',
  '{"exerciseId": "meditation-connection", "instructions": "Visualiza un hilo de luz que te conecta con todas las personas, animales, plantas y elementos de la naturaleza. Siente esa conexión durante 15 minutos."}'::jsonb,
  20,
  false,
  2
FROM learning_paths lp WHERE lp.slug = 'viaje-despertar'
ON CONFLICT (path_id, day_number, order_index) DO NOTHING;

INSERT INTO learning_path_stages (path_id, day_number, title, description, content_type, content_reference, duration_minutes, is_optional, order_index)
SELECT
  lp.id,
  7,
  'Integrando el Despertar',
  'Cómo llevar la consciencia expandida a la vida diaria',
  'reading',
  '{"bookId": "manual-practico", "chapterId": "cap2"}'::jsonb,
  25,
  false,
  1
FROM learning_paths lp WHERE lp.slug = 'viaje-despertar'
ON CONFLICT (path_id, day_number, order_index) DO NOTHING;

INSERT INTO learning_path_stages (path_id, day_number, title, description, content_type, content_reference, duration_minutes, is_optional, order_index)
SELECT
  lp.id,
  7,
  'Reflexión Final: Mi Viaje',
  'Documenta tu transformación en estos 7 días',
  'reflection',
  '{"questions": ["¿Qué cambió en ti durante este viaje?", "¿Qué práctica fue más transformadora?", "¿Cómo continuarás este camino?", "¿Qué compromiso haces contigo mismo?"]}'::jsonb,
  25,
  false,
  2
FROM learning_paths lp WHERE lp.slug = 'viaje-despertar'
ON CONFLICT (path_id, day_number, order_index) DO NOTHING;

-- Path 2: Transformación Profunda (21 días - Intermedio)
INSERT INTO learning_paths (slug, title, description, duration_days, difficulty, objectives, requirements, tags, is_active, is_premium, sort_order)
VALUES (
  'transformacion-profunda',
  'Transformación Profunda',
  'Un viaje intensivo de 21 días para quienes buscan una transformación real y duradera. Combina lectura profunda, práctica diaria y reflexión constante.',
  21,
  'medium',
  '["Desarrollar una práctica espiritual sólida", "Transformar patrones mentales y emocionales", "Integrar consciencia en todas las áreas de la vida", "Establecer nuevos hábitos transformadores", "Conectar con tu propósito de vida"]'::jsonb,
  '{"books": [], "minLevel": 0, "timeCommitment": "30-45 minutos diarios", "recommended": "Haber completado ''Viaje del Despertar''"}'::jsonb,
  '["transformación", "práctica", "integración", "propósito"]'::jsonb,
  true,
  true,
  2
) ON CONFLICT (slug) DO NOTHING;

-- Primeros 7 días del Path 2 (ejemplo representativo)
INSERT INTO learning_path_stages (path_id, day_number, title, description, content_type, content_reference, duration_minutes, is_optional, order_index)
SELECT
  lp.id,
  1,
  'Fundamentos de la Transformación',
  'Comprender qué significa transformarse genuinamente',
  'reading',
  '{"bookId": "codigo-despertar", "chapterId": "prologo"}'::jsonb,
  30,
  false,
  1
FROM learning_paths lp WHERE lp.slug = 'transformacion-profunda'
ON CONFLICT (path_id, day_number, order_index) DO NOTHING;

INSERT INTO learning_path_stages (path_id, day_number, title, description, content_type, content_reference, duration_minutes, is_optional, order_index)
SELECT
  lp.id,
  1,
  'Evaluación Inicial',
  'Mapea tu estado actual en todas las áreas de vida',
  'reflection',
  '{"questions": ["¿Dónde estás ahora en tu vida?", "¿Qué áreas requieren transformación?", "¿Qué resistencias anticipas?", "¿Qué te motiva a transformarte?"]}'::jsonb,
  20,
  false,
  2
FROM learning_paths lp WHERE lp.slug = 'transformacion-profunda'
ON CONFLICT (path_id, day_number, order_index) DO NOTHING;

INSERT INTO learning_path_stages (path_id, day_number, title, description, content_type, content_reference, duration_minutes, is_optional, order_index)
SELECT
  lp.id,
  1,
  'Meditación de Intención',
  'Establece tu intención clara para estos 21 días',
  'meditation',
  '{"exerciseId": "meditation-intention", "instructions": "Siéntate en silencio. Conecta con tu deseo más profundo de transformación. Formula una intención clara y poderosa. Repítela 21 veces."}'::jsonb,
  15,
  false,
  3
FROM learning_paths lp WHERE lp.slug = 'transformacion-profunda'
ON CONFLICT (path_id, day_number, order_index) DO NOTHING;

-- Día 2
INSERT INTO learning_path_stages (path_id, day_number, title, description, content_type, content_reference, duration_minutes, is_optional, order_index)
SELECT
  lp.id,
  2,
  'La Mente y sus Patrones',
  'Comprender cómo funciona la mente y sus automatismos',
  'reading',
  '{"bookId": "codigo-despertar", "chapterId": "cap1"}'::jsonb,
  30,
  false,
  1
FROM learning_paths lp WHERE lp.slug = 'transformacion-profunda'
ON CONFLICT (path_id, day_number, order_index) DO NOTHING;

INSERT INTO learning_path_stages (path_id, day_number, title, description, content_type, content_reference, duration_minutes, is_optional, order_index)
SELECT
  lp.id,
  2,
  'Observación de Patrones',
  'Identifica tus 3 patrones mentales más recurrentes',
  'exercise',
  '{"instructions": "Durante todo el día, observa tus pensamientos recurrentes. Al final del día, identifica los 3 patrones más frecuentes y escríbelos.", "checkpoints": ["Mañana: activa modo observador", "Tarde: toma notas mentales", "Noche: documenta patrones"]}'::jsonb,
  30,
  false,
  2
FROM learning_paths lp WHERE lp.slug = 'transformacion-profunda'
ON CONFLICT (path_id, day_number, order_index) DO NOTHING;

-- Continuar con más días...
-- (Por brevedad, incluyo solo estructura representativa. En producción, completar los 21 días)

COMMENT ON TABLE learning_paths IS 'Sistema de Learning Paths - Jornadas guiadas de aprendizaje de 7, 21 o 30 días';
COMMENT ON TABLE learning_path_stages IS 'Etapas diarias de cada path con contenido específico';
COMMENT ON TABLE user_learning_paths IS 'Progreso de usuarios en paths - tracking de estado, streak y completitud';
COMMENT ON TABLE user_stage_progress IS 'Progreso detallado en cada etapa individual';

-- ============================================================================
-- FIN DE MIGRACIÓN 007
-- ============================================================================
