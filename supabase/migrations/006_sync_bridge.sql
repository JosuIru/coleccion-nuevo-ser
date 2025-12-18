-- ═══════════════════════════════════════════════════════════════════════════════
-- MIGRACIÓN 006 - Sync Bridge (Sincronización Web ↔ Mobile)
-- ═══════════════════════════════════════════════════════════════════════════════
-- Sistema de sincronización bidireccional entre webapp y mobile game
-- Ejecutar en: Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════════

-- ============================================================================
-- 1. TABLA: sync_state
-- Rastrea el estado de sincronización por plataforma
-- ============================================================================

CREATE TABLE IF NOT EXISTS sync_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,

  -- Identificación de plataforma
  platform TEXT NOT NULL CHECK (platform IN ('web', 'mobile', 'android', 'ios')),
  device_id TEXT, -- Identificador único del dispositivo

  -- Estado de sincronización
  last_sync_at TIMESTAMPTZ DEFAULT NOW(),
  last_sync_version INTEGER DEFAULT 1,
  data_hash TEXT, -- Hash MD5 del estado para detectar cambios

  -- Metadata de sincronización
  sync_status TEXT DEFAULT 'idle' CHECK (sync_status IN ('idle', 'syncing', 'error', 'conflict')),
  sync_error TEXT,
  conflict_data JSONB, -- Datos en conflicto para resolución manual

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraint: un usuario puede tener múltiples dispositivos
  UNIQUE(user_id, platform, device_id)
);

-- Índices para performance
CREATE INDEX idx_sync_state_user ON sync_state(user_id);
CREATE INDEX idx_sync_state_platform ON sync_state(platform);
CREATE INDEX idx_sync_state_last_sync ON sync_state(last_sync_at DESC);

-- ============================================================================
-- 2. TABLA: beings (seres creados en el juego móvil)
-- ============================================================================

CREATE TABLE IF NOT EXISTS beings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,

  -- Identificación del ser
  being_id TEXT NOT NULL, -- ID local del ser (desde mobile game)
  name TEXT NOT NULL,
  avatar TEXT DEFAULT '🌱',

  -- Estado del ser
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'deployed', 'resting', 'evolving')),
  current_mission TEXT, -- ID de la crisis/misión actual

  -- Progreso
  level INTEGER DEFAULT 1,
  experience INTEGER DEFAULT 0,

  -- Atributos del ser (flexibles vía JSONB)
  attributes JSONB DEFAULT '{
    "reflection": 20,
    "analysis": 20,
    "creativity": 20,
    "empathy": 20,
    "communication": 20,
    "leadership": 20,
    "action": 20,
    "resilience": 20,
    "strategy": 20,
    "consciousness": 20,
    "connection": 20,
    "wisdom": 20,
    "organization": 20,
    "collaboration": 20,
    "technical": 20
  }'::jsonb,

  -- Metadata
  source_app TEXT DEFAULT 'mobile-game', -- 'mobile-game', 'frankenstein-lab', 'community-reward'
  community_id TEXT, -- Si proviene de una comunidad desbloqueada

  -- Sincronización
  synced_from TEXT DEFAULT 'mobile', -- 'mobile' o 'web'
  last_modified_at TIMESTAMPTZ DEFAULT NOW(),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraint: evitar duplicados
  UNIQUE(user_id, being_id)
);

-- Índices
CREATE INDEX idx_beings_user ON beings(user_id);
CREATE INDEX idx_beings_status ON beings(status);
CREATE INDEX idx_beings_level ON beings(level DESC);
CREATE INDEX idx_beings_modified ON beings(last_modified_at DESC);

-- ============================================================================
-- 3. TABLA: reading_progress (progreso de lectura en webapp)
-- ============================================================================

CREATE TABLE IF NOT EXISTS reading_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,

  -- Identificación del contenido
  book_id TEXT NOT NULL,
  chapter_id TEXT,

  -- Progreso
  progress_percentage DECIMAL(5,2) DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  last_position INTEGER DEFAULT 0, -- Posición del scroll o párrafo

  -- Estado
  completed BOOLEAN DEFAULT false,
  bookmarked BOOLEAN DEFAULT false,

  -- Tiempo de lectura
  reading_time_seconds INTEGER DEFAULT 0,
  last_read_at TIMESTAMPTZ DEFAULT NOW(),

  -- Sincronización
  synced_from TEXT DEFAULT 'web', -- 'web' o 'mobile'
  last_modified_at TIMESTAMPTZ DEFAULT NOW(),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraint: un progreso por libro-capítulo por usuario
  UNIQUE(user_id, book_id, chapter_id)
);

-- Índices
CREATE INDEX idx_reading_progress_user ON reading_progress(user_id);
CREATE INDEX idx_reading_progress_book ON reading_progress(book_id);
CREATE INDEX idx_reading_progress_modified ON reading_progress(last_modified_at DESC);
CREATE INDEX idx_reading_progress_completed ON reading_progress(completed);

-- ============================================================================
-- 4. TABLA: achievements (logros compartidos entre plataformas)
-- ============================================================================

CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,

  -- Identificación del logro
  achievement_id TEXT NOT NULL,
  achievement_type TEXT NOT NULL, -- 'reading', 'game', 'quiz', 'community', 'special'

  -- Detalles
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '🏆',

  -- Progreso
  progress DECIMAL(5,2) DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  unlocked_at TIMESTAMPTZ,

  -- Recompensas
  rewards JSONB DEFAULT '{
    "xp": 0,
    "consciousness": 0,
    "energy": 0,
    "special_item": null
  }'::jsonb,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Sincronización
  synced_from TEXT DEFAULT 'web',
  last_modified_at TIMESTAMPTZ DEFAULT NOW(),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraint: un logro por usuario
  UNIQUE(user_id, achievement_id)
);

-- Índices
CREATE INDEX idx_achievements_user ON achievements(user_id);
CREATE INDEX idx_achievements_type ON achievements(achievement_type);
CREATE INDEX idx_achievements_completed ON achievements(completed);
CREATE INDEX idx_achievements_modified ON achievements(last_modified_at DESC);

-- ============================================================================
-- 5. TABLA: sync_queue (cola offline-first)
-- ============================================================================

CREATE TABLE IF NOT EXISTS sync_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,

  -- Identificación de la operación
  operation_type TEXT NOT NULL CHECK (operation_type IN ('create', 'update', 'delete')),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('being', 'reading_progress', 'achievement')),
  entity_id TEXT NOT NULL,

  -- Datos de la operación
  data JSONB NOT NULL,
  platform TEXT NOT NULL,

  -- Estado de la cola
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  error_message TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,

  -- Índice compuesto para procesamiento
  UNIQUE(user_id, entity_type, entity_id, operation_type, created_at)
);

-- Índices
CREATE INDEX idx_sync_queue_user ON sync_queue(user_id);
CREATE INDEX idx_sync_queue_status ON sync_queue(status);
CREATE INDEX idx_sync_queue_created ON sync_queue(created_at ASC);

-- ============================================================================
-- 6. FUNCIONES HELPER
-- ============================================================================

-- Función: Actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_sync_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.last_modified_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para actualizar timestamps
DROP TRIGGER IF EXISTS update_sync_state_timestamp ON sync_state;
CREATE TRIGGER update_sync_state_timestamp
  BEFORE UPDATE ON sync_state
  FOR EACH ROW
  EXECUTE FUNCTION update_sync_updated_at();

DROP TRIGGER IF EXISTS update_beings_timestamp ON beings;
CREATE TRIGGER update_beings_timestamp
  BEFORE UPDATE ON beings
  FOR EACH ROW
  EXECUTE FUNCTION update_sync_updated_at();

DROP TRIGGER IF EXISTS update_reading_progress_timestamp ON reading_progress;
CREATE TRIGGER update_reading_progress_timestamp
  BEFORE UPDATE ON reading_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_sync_updated_at();

DROP TRIGGER IF EXISTS update_achievements_timestamp ON achievements;
CREATE TRIGGER update_achievements_timestamp
  BEFORE UPDATE ON achievements
  FOR EACH ROW
  EXECUTE FUNCTION update_sync_updated_at();

-- ============================================================================
-- 7. FUNCIÓN: Sincronizar estado (resolver conflictos)
-- ============================================================================

CREATE OR REPLACE FUNCTION sync_entity(
  p_user_id UUID,
  p_entity_type TEXT,
  p_entity_id TEXT,
  p_data JSONB,
  p_platform TEXT,
  p_modified_at TIMESTAMPTZ
)
RETURNS JSONB AS $$
DECLARE
  v_existing_record RECORD;
  v_result JSONB;
  v_conflict BOOLEAN := FALSE;
BEGIN
  -- Verificar si existe el registro
  CASE p_entity_type
    WHEN 'being' THEN
      SELECT * INTO v_existing_record FROM beings
      WHERE user_id = p_user_id AND being_id = p_entity_id;

      IF FOUND THEN
        -- Detectar conflicto (más reciente gana)
        IF v_existing_record.last_modified_at > p_modified_at THEN
          v_conflict := TRUE;
          v_result := jsonb_build_object(
            'status', 'conflict',
            'message', 'Server has newer data',
            'server_data', row_to_json(v_existing_record),
            'client_modified_at', p_modified_at,
            'server_modified_at', v_existing_record.last_modified_at
          );
        ELSE
          -- Actualizar con datos del cliente
          UPDATE beings
          SET
            name = p_data->>'name',
            avatar = p_data->>'avatar',
            status = p_data->>'status',
            current_mission = p_data->>'current_mission',
            level = (p_data->>'level')::INTEGER,
            experience = (p_data->>'experience')::INTEGER,
            attributes = p_data->'attributes',
            synced_from = p_platform,
            last_modified_at = p_modified_at
          WHERE user_id = p_user_id AND being_id = p_entity_id;

          v_result := jsonb_build_object('status', 'updated', 'message', 'Being updated successfully');
        END IF;
      ELSE
        -- Crear nuevo registro
        INSERT INTO beings (user_id, being_id, name, avatar, status, level, experience, attributes, synced_from, last_modified_at)
        VALUES (
          p_user_id,
          p_entity_id,
          p_data->>'name',
          p_data->>'avatar',
          COALESCE(p_data->>'status', 'available'),
          COALESCE((p_data->>'level')::INTEGER, 1),
          COALESCE((p_data->>'experience')::INTEGER, 0),
          COALESCE(p_data->'attributes', '{}'::jsonb),
          p_platform,
          p_modified_at
        );

        v_result := jsonb_build_object('status', 'created', 'message', 'Being created successfully');
      END IF;

    WHEN 'reading_progress' THEN
      SELECT * INTO v_existing_record FROM reading_progress
      WHERE user_id = p_user_id
        AND book_id = p_data->>'book_id'
        AND chapter_id = p_data->>'chapter_id';

      IF FOUND THEN
        IF v_existing_record.last_modified_at > p_modified_at THEN
          v_conflict := TRUE;
          v_result := jsonb_build_object(
            'status', 'conflict',
            'message', 'Server has newer progress',
            'server_data', row_to_json(v_existing_record)
          );
        ELSE
          UPDATE reading_progress
          SET
            progress_percentage = (p_data->>'progress_percentage')::DECIMAL,
            last_position = (p_data->>'last_position')::INTEGER,
            completed = (p_data->>'completed')::BOOLEAN,
            reading_time_seconds = (p_data->>'reading_time_seconds')::INTEGER,
            synced_from = p_platform,
            last_modified_at = p_modified_at
          WHERE user_id = p_user_id
            AND book_id = p_data->>'book_id'
            AND chapter_id = p_data->>'chapter_id';

          v_result := jsonb_build_object('status', 'updated', 'message', 'Progress updated');
        END IF;
      ELSE
        INSERT INTO reading_progress (user_id, book_id, chapter_id, progress_percentage, last_position, completed, synced_from, last_modified_at)
        VALUES (
          p_user_id,
          p_data->>'book_id',
          p_data->>'chapter_id',
          COALESCE((p_data->>'progress_percentage')::DECIMAL, 0),
          COALESCE((p_data->>'last_position')::INTEGER, 0),
          COALESCE((p_data->>'completed')::BOOLEAN, false),
          p_platform,
          p_modified_at
        );

        v_result := jsonb_build_object('status', 'created', 'message', 'Progress created');
      END IF;

    WHEN 'achievement' THEN
      SELECT * INTO v_existing_record FROM achievements
      WHERE user_id = p_user_id AND achievement_id = p_entity_id;

      IF FOUND THEN
        IF v_existing_record.last_modified_at > p_modified_at THEN
          v_conflict := TRUE;
          v_result := jsonb_build_object('status', 'conflict', 'message', 'Server has newer achievement');
        ELSE
          UPDATE achievements
          SET
            progress = (p_data->>'progress')::DECIMAL,
            completed = (p_data->>'completed')::BOOLEAN,
            unlocked_at = (p_data->>'unlocked_at')::TIMESTAMPTZ,
            synced_from = p_platform,
            last_modified_at = p_modified_at
          WHERE user_id = p_user_id AND achievement_id = p_entity_id;

          v_result := jsonb_build_object('status', 'updated', 'message', 'Achievement updated');
        END IF;
      ELSE
        INSERT INTO achievements (user_id, achievement_id, achievement_type, title, description, progress, completed, synced_from, last_modified_at)
        VALUES (
          p_user_id,
          p_entity_id,
          p_data->>'achievement_type',
          p_data->>'title',
          p_data->>'description',
          COALESCE((p_data->>'progress')::DECIMAL, 0),
          COALESCE((p_data->>'completed')::BOOLEAN, false),
          p_platform,
          p_modified_at
        );

        v_result := jsonb_build_object('status', 'created', 'message', 'Achievement created');
      END IF;
  END CASE;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 8. FUNCIÓN: Obtener cambios desde última sincronización
-- ============================================================================

CREATE OR REPLACE FUNCTION get_changes_since(
  p_user_id UUID,
  p_platform TEXT,
  p_last_sync TIMESTAMPTZ
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  v_result := jsonb_build_object(
    'beings', (
      SELECT COALESCE(jsonb_agg(row_to_json(b)), '[]'::jsonb)
      FROM beings b
      WHERE b.user_id = p_user_id
        AND b.last_modified_at > p_last_sync
        AND b.synced_from != p_platform
    ),
    'reading_progress', (
      SELECT COALESCE(jsonb_agg(row_to_json(r)), '[]'::jsonb)
      FROM reading_progress r
      WHERE r.user_id = p_user_id
        AND r.last_modified_at > p_last_sync
        AND r.synced_from != p_platform
    ),
    'achievements', (
      SELECT COALESCE(jsonb_agg(row_to_json(a)), '[]'::jsonb)
      FROM achievements a
      WHERE a.user_id = p_user_id
        AND a.last_modified_at > p_last_sync
        AND a.synced_from != p_platform
    ),
    'sync_timestamp', NOW()
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 9. ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE sync_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE beings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_queue ENABLE ROW LEVEL SECURITY;

-- Policies para sync_state
DROP POLICY IF EXISTS "Users can view own sync state" ON sync_state;
CREATE POLICY "Users can view own sync state"
  ON sync_state FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own sync state" ON sync_state;
CREATE POLICY "Users can update own sync state"
  ON sync_state FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policies para beings
DROP POLICY IF EXISTS "Users can view own beings" ON beings;
CREATE POLICY "Users can view own beings"
  ON beings FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own beings" ON beings;
CREATE POLICY "Users can manage own beings"
  ON beings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policies para reading_progress
DROP POLICY IF EXISTS "Users can view own progress" ON reading_progress;
CREATE POLICY "Users can view own progress"
  ON reading_progress FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own progress" ON reading_progress;
CREATE POLICY "Users can manage own progress"
  ON reading_progress FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policies para achievements
DROP POLICY IF EXISTS "Users can view own achievements" ON achievements;
CREATE POLICY "Users can view own achievements"
  ON achievements FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own achievements" ON achievements;
CREATE POLICY "Users can manage own achievements"
  ON achievements FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policies para sync_queue
DROP POLICY IF EXISTS "Users can view own sync queue" ON sync_queue;
CREATE POLICY "Users can view own sync queue"
  ON sync_queue FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own sync queue" ON sync_queue;
CREATE POLICY "Users can manage own sync queue"
  ON sync_queue FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 10. COMENTARIOS Y DOCUMENTACIÓN
-- ============================================================================

COMMENT ON TABLE sync_state IS 'Estado de sincronización por dispositivo y plataforma';
COMMENT ON TABLE beings IS 'Seres creados en el mobile game, sincronizados con la webapp';
COMMENT ON TABLE reading_progress IS 'Progreso de lectura en libros, compartido entre plataformas';
COMMENT ON TABLE achievements IS 'Logros desbloqueados por el usuario en ambas plataformas';
COMMENT ON TABLE sync_queue IS 'Cola de sincronización para operaciones offline-first';

COMMENT ON FUNCTION sync_entity IS 'Sincroniza una entidad resolviendo conflictos (más reciente gana)';
COMMENT ON FUNCTION get_changes_since IS 'Obtiene cambios desde la última sincronización';

-- ✅ Migración 006 completada
-- Sistema de sincronización bidireccional Web ↔ Mobile activado
