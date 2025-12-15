-- ═══════════════════════════════════════════════════════════════════════
-- AWAKENING PROTOCOL - MOBILE DATABASE SCHEMA
-- Base de datos COMPLETAMENTE SEPARADA del sistema web
-- ═══════════════════════════════════════════════════════════════════════
--
-- PRINCIPIOS:
-- 1. Prefijo "mobile_" en TODAS las tablas
-- 2. NO modifica tablas existentes del sistema web
-- 3. Referencias a web son FK opcionales (no invasivas)
-- 4. Puede desplegarse en BD separada o mismo servidor con prefijo
--
-- Versión: 1.0.0
-- Compatible con: PostgreSQL 14+, SQLite 3.35+
-- ═══════════════════════════════════════════════════════════════════════

-- Extensiones necesarias (solo PostgreSQL)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- CREATE EXTENSION IF NOT EXISTS "postgis"; -- Para ubicaciones geográficas

-- ═══════════════════════════════════════════════════════════════════════
-- TABLA: mobile_users
-- Usuarios del juego móvil (separados de usuarios web)
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS mobile_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Conexión con sistema web (opcional)
    web_user_id UUID,  -- ID del usuario en sistema web
    email TEXT,
    username TEXT NOT NULL,

    -- Progreso del juego
    level INTEGER DEFAULT 1 CHECK (level >= 1 AND level <= 50),
    xp INTEGER DEFAULT 0 CHECK (xp >= 0),

    -- Recursos
    energy INTEGER DEFAULT 100 CHECK (energy >= 0 AND energy <= 1000),
    max_energy INTEGER DEFAULT 100 CHECK (max_energy >= 100),
    consciousness_points INTEGER DEFAULT 0 CHECK (consciousness_points >= 0),

    -- Límites
    max_beings INTEGER DEFAULT 3 CHECK (max_beings >= 3),

    -- Configuración de sincronización
    sync_mode TEXT DEFAULT 'read-only' CHECK (sync_mode IN ('read-only', 'bidirectional', 'offline')),
    allow_write_to_web BOOLEAN DEFAULT FALSE,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_sync_from_web TIMESTAMP,
    last_sync_to_web TIMESTAMP,

    -- Metadata
    device_info JSONB,  -- Info del dispositivo
    settings JSONB DEFAULT '{}'::JSONB,  -- Configuración personalizada

    UNIQUE(email),
    UNIQUE(username)
);

-- Índices para mobile_users
CREATE INDEX IF NOT EXISTS idx_mobile_users_web_id ON mobile_users(web_user_id);
CREATE INDEX IF NOT EXISTS idx_mobile_users_email ON mobile_users(email);
CREATE INDEX IF NOT EXISTS idx_mobile_users_level ON mobile_users(level);

-- ═══════════════════════════════════════════════════════════════════════
-- TABLA: mobile_beings
-- Seres transformadores (copiados desde Frankenstein Lab)
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS mobile_beings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Propietario
    mobile_user_id UUID NOT NULL REFERENCES mobile_users(id) ON DELETE CASCADE,

    -- Referencia al ser original en web (si fue sincronizado)
    web_being_id UUID,  -- ID en sistema Frankenstein Lab

    -- Datos básicos del ser
    name TEXT NOT NULL,
    description TEXT,
    dominant_attribute TEXT,  -- reflection, empathy, action, etc.

    -- Atributos (15 tipos)
    attributes JSONB NOT NULL DEFAULT '{}'::JSONB,
    /*
    Estructura esperada:
    {
        "reflection": 45,
        "analysis": 30,
        "creativity": 60,
        "empathy": 75,
        "communication": 50,
        "leadership": 40,
        "action": 65,
        "resilience": 55,
        "strategy": 35,
        "consciousness": 70,
        "connection": 60,
        "wisdom": 50,
        "organization": 45,
        "collaboration": 55,
        "technical": 30
    }
    */

    -- Propiedades SOLO del móvil (no existen en web)
    energy INTEGER DEFAULT 100 CHECK (energy >= 0 AND energy <= 100),
    fitness INTEGER DEFAULT 50 CHECK (fitness >= 0 AND fitness <= 100),

    -- Ubicación actual (si está desplegado)
    location_lat REAL,
    location_lon REAL,

    -- Estado
    status TEXT DEFAULT 'available' CHECK (status IN ('available', 'deployed', 'resting', 'training')),
    current_mission_id UUID,  -- FK a mobile_missions (nullable)

    -- Cosméticos (opcional)
    avatar_url TEXT,
    color_hex TEXT DEFAULT '#60a5fa',

    -- Sincronización
    synced_from_web BOOLEAN DEFAULT FALSE,
    created_in_mobile BOOLEAN DEFAULT FALSE,  -- TRUE si se creó en móvil
    last_sync TIMESTAMP,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para mobile_beings
CREATE INDEX IF NOT EXISTS idx_mobile_beings_user ON mobile_beings(mobile_user_id);
CREATE INDEX IF NOT EXISTS idx_mobile_beings_web_id ON mobile_beings(web_being_id);
CREATE INDEX IF NOT EXISTS idx_mobile_beings_status ON mobile_beings(status);
CREATE INDEX IF NOT EXISTS idx_mobile_beings_location ON mobile_beings(location_lat, location_lon);

-- ═══════════════════════════════════════════════════════════════════════
-- TABLA: mobile_crises
-- Crisis del mundo (reales de RSS + predefinidas + generadas por usuarios)
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS mobile_crises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Información básica
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    crisis_type TEXT NOT NULL,  -- environmental, social, economic, humanitarian, etc.

    -- Ubicación
    lat REAL NOT NULL,
    lon REAL NOT NULL,
    region TEXT,  -- África, Asia, Europa, etc.
    country TEXT,
    city TEXT,

    -- Mecánicas de juego
    urgency INTEGER NOT NULL CHECK (urgency >= 1 AND urgency <= 10),
    scale TEXT CHECK (scale IN ('local', 'regional', 'national', 'continental', 'global')),

    -- Requisitos
    required_attributes JSONB NOT NULL,
    /*
    Estructura esperada:
    {
        "empathy": 60,
        "organization": 70,
        "action": 80
    }
    */

    -- Recompensas
    rewards JSONB NOT NULL,
    /*
    {
        "xp": 150,
        "consciousness": 50,
        "energy": 20,
        "special_item": null
    }
    */

    -- Duración
    duration_minutes INTEGER DEFAULT 60,  -- Tiempo que toma resolverla

    -- Población afectada
    affected_population INTEGER,

    -- Estado
    active BOOLEAN DEFAULT TRUE,
    completed_count INTEGER DEFAULT 0,  -- Cuántos jugadores la resolvieron

    -- Origen de la crisis
    source TEXT NOT NULL CHECK (source IN ('rss', 'ai_generated', 'user_generated', 'predefined', 'event')),
    source_url TEXT,  -- Si viene de noticia RSS
    source_article TEXT,  -- Texto del artículo original

    -- Para crisis generadas por usuarios
    created_by_user_id UUID REFERENCES mobile_users(id),
    photo_proof_url TEXT,  -- Foto de evidencia
    verified BOOLEAN DEFAULT FALSE,
    verified_by_count INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,  -- Algunas crisis expiran
    resolved_at TIMESTAMP
);

-- Índices para mobile_crises
CREATE INDEX IF NOT EXISTS idx_mobile_crises_location ON mobile_crises(lat, lon);
CREATE INDEX IF NOT EXISTS idx_mobile_crises_active ON mobile_crises(active);
CREATE INDEX IF NOT EXISTS idx_mobile_crises_urgency ON mobile_crises(urgency DESC);
CREATE INDEX IF NOT EXISTS idx_mobile_crises_type ON mobile_crises(crisis_type);
CREATE INDEX IF NOT EXISTS idx_mobile_crises_source ON mobile_crises(source);
CREATE INDEX IF NOT EXISTS idx_mobile_crises_region ON mobile_crises(region);

-- ═══════════════════════════════════════════════════════════════════════
-- TABLA: mobile_missions
-- Misiones activas (seres desplegados a crisis)
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS mobile_missions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Referencias
    mobile_user_id UUID NOT NULL REFERENCES mobile_users(id) ON DELETE CASCADE,
    crisis_id UUID NOT NULL REFERENCES mobile_crises(id) ON DELETE CASCADE,

    -- Seres desplegados (array de IDs)
    deployed_being_ids JSONB NOT NULL,
    /*
    ["uuid1", "uuid2", "uuid3"]
    */

    -- Cálculos
    team_attributes JSONB,  -- Suma de atributos de todos los seres
    success_probability REAL,  -- 0.0 - 1.0

    -- Timing
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ends_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP,

    -- Resultado
    success BOOLEAN,
    actual_success_rate REAL,  -- Resultado real vs probabilidad

    -- Recompensas ganadas
    rewards_earned JSONB,

    -- Metadata
    is_cooperative BOOLEAN DEFAULT FALSE,  -- Si es misión con otros jugadores
    cooperative_user_ids JSONB,  -- ["uuid1", "uuid2"]

    CHECK (ends_at > started_at)
);

-- Índices para mobile_missions
CREATE INDEX IF NOT EXISTS idx_mobile_missions_user ON mobile_missions(mobile_user_id);
CREATE INDEX IF NOT EXISTS idx_mobile_missions_crisis ON mobile_missions(crisis_id);
CREATE INDEX IF NOT EXISTS idx_mobile_missions_active ON mobile_missions(completed_at) WHERE completed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_mobile_missions_ends_at ON mobile_missions(ends_at);

-- ═══════════════════════════════════════════════════════════════════════
-- TABLA: mobile_reading_progress
-- Progreso de lectura (sincronizado desde web)
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS mobile_reading_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    mobile_user_id UUID NOT NULL REFERENCES mobile_users(id) ON DELETE CASCADE,

    -- Identificadores del libro/capítulo
    book_id TEXT NOT NULL,
    chapter_id TEXT,
    section_id TEXT,

    -- Progreso
    progress_percent INTEGER DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
    pages_read INTEGER DEFAULT 0,
    time_spent_minutes INTEGER DEFAULT 0,

    -- Estado
    completed BOOLEAN DEFAULT FALSE,

    -- Sincronización
    synced_from_web BOOLEAN DEFAULT FALSE,
    synced_to_web BOOLEAN DEFAULT FALSE,
    last_sync TIMESTAMP,

    -- Timestamps
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(mobile_user_id, book_id, chapter_id)
);

-- Índices para mobile_reading_progress
CREATE INDEX IF NOT EXISTS idx_mobile_reading_user_book ON mobile_reading_progress(mobile_user_id, book_id);
CREATE INDEX IF NOT EXISTS idx_mobile_reading_completed ON mobile_reading_progress(completed);

-- ═══════════════════════════════════════════════════════════════════════
-- TABLA: mobile_fractals_collected
-- Fractales de consciencia recolectados en el mapa
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS mobile_fractals_collected (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    mobile_user_id UUID NOT NULL REFERENCES mobile_users(id) ON DELETE CASCADE,

    -- Tipo de fractal
    fractal_type TEXT NOT NULL CHECK (fractal_type IN ('wisdom', 'community', 'nature', 'action', 'consciousness')),

    -- Ubicación donde se recolectó
    lat REAL NOT NULL,
    lon REAL NOT NULL,
    poi_name TEXT,  -- Nombre del lugar (ej: "Biblioteca Central")
    poi_type TEXT,  -- library, park, community_center, etc.

    -- Recompensas
    rewards JSONB NOT NULL,
    /*
    {
        "knowledge": 50,
        "energy": 10,
        "consciousness": 20
    }
    */

    -- Timestamps
    collected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para mobile_fractals_collected
CREATE INDEX IF NOT EXISTS idx_mobile_fractals_user ON mobile_fractals_collected(mobile_user_id);
CREATE INDEX IF NOT EXISTS idx_mobile_fractals_type ON mobile_fractals_collected(fractal_type);
CREATE INDEX IF NOT EXISTS idx_mobile_fractals_date ON mobile_fractals_collected(collected_at DESC);

-- ═══════════════════════════════════════════════════════════════════════
-- TABLA: mobile_achievements
-- Logros desbloqueados
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS mobile_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    mobile_user_id UUID NOT NULL REFERENCES mobile_users(id) ON DELETE CASCADE,

    -- ID del logro (predefinido)
    achievement_id TEXT NOT NULL,

    -- Metadata
    progress INTEGER DEFAULT 0,  -- Para logros progresivos
    completed BOOLEAN DEFAULT FALSE,

    -- Timestamps
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,

    UNIQUE(mobile_user_id, achievement_id)
);

-- Índices para mobile_achievements
CREATE INDEX IF NOT EXISTS idx_mobile_achievements_user ON mobile_achievements(mobile_user_id);
CREATE INDEX IF NOT EXISTS idx_mobile_achievements_completed ON mobile_achievements(completed);

-- ═══════════════════════════════════════════════════════════════════════
-- TABLA: mobile_sync_log
-- Log de sincronización (auditoría)
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS mobile_sync_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    mobile_user_id UUID REFERENCES mobile_users(id) ON DELETE SET NULL,

    -- Tipo de sincronización
    sync_type TEXT NOT NULL CHECK (sync_type IN ('pull_from_web', 'push_to_web', 'bidirectional')),

    -- Qué se sincronizó
    entity_type TEXT NOT NULL,  -- beings, progress, societies, etc.

    -- Resultado
    status TEXT NOT NULL CHECK (status IN ('success', 'partial', 'conflict', 'error')),

    -- Detalles
    details JSONB,
    /*
    {
        "records_synced": 5,
        "conflicts_resolved": 1,
        "errors": []
    }
    */

    -- Timestamp
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para mobile_sync_log
CREATE INDEX IF NOT EXISTS idx_mobile_sync_user ON mobile_sync_log(mobile_user_id);
CREATE INDEX IF NOT EXISTS idx_mobile_sync_type ON mobile_sync_log(sync_type);
CREATE INDEX IF NOT EXISTS idx_mobile_sync_date ON mobile_sync_log(created_at DESC);

-- ═══════════════════════════════════════════════════════════════════════
-- TABLA: mobile_zones
-- Salud de zonas geográficas (barrios, ciudades)
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS mobile_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identificación de la zona
    zone_name TEXT NOT NULL,
    zone_type TEXT CHECK (zone_type IN ('neighborhood', 'city', 'region', 'country')),

    -- Ubicación (centro de la zona)
    lat REAL NOT NULL,
    lon REAL NOT NULL,
    radius_km REAL,  -- Radio de cobertura

    -- Salud de la zona (0-100)
    health INTEGER DEFAULT 50 CHECK (health >= 0 AND health <= 100),

    -- Contribuciones
    total_contributions INTEGER DEFAULT 0,
    active_users INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(zone_name, zone_type)
);

-- Índices para mobile_zones
CREATE INDEX IF NOT EXISTS idx_mobile_zones_location ON mobile_zones(lat, lon);
CREATE INDEX IF NOT EXISTS idx_mobile_zones_health ON mobile_zones(health DESC);

-- ═══════════════════════════════════════════════════════════════════════
-- FUNCIONES Y TRIGGERS (PostgreSQL)
-- ═══════════════════════════════════════════════════════════════════════

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger a tablas con updated_at
CREATE TRIGGER update_mobile_beings_updated_at BEFORE UPDATE ON mobile_beings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mobile_users_updated_at BEFORE UPDATE ON mobile_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mobile_reading_progress_updated_at BEFORE UPDATE ON mobile_reading_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mobile_zones_updated_at BEFORE UPDATE ON mobile_zones
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════════════
-- DATOS INICIALES (Seed Data)
-- ═══════════════════════════════════════════════════════════════════════

-- Usuario de prueba (comentar en producción)
-- INSERT INTO mobile_users (username, email, level, xp, energy) VALUES
-- ('test_user', 'test@awakening.com', 1, 0, 100);

-- Crisis predefinidas de ejemplo (comentar en producción)
/*
INSERT INTO mobile_crises (
    title, description, crisis_type, lat, lon, region, country,
    urgency, scale, required_attributes, rewards, duration_minutes, source
) VALUES
(
    'Basura acumulada en Parque Central',
    'El parque ha acumulado basura durante semanas. Necesita limpieza urgente.',
    'environmental',
    40.4168, -3.7038,  -- Madrid
    'Europa', 'España',
    7, 'local',
    '{"action": 60, "organization": 50, "collaboration": 40}'::JSONB,
    '{"xp": 100, "consciousness": 30, "energy": 15}'::JSONB,
    30,
    'predefined'
);
*/

-- ═══════════════════════════════════════════════════════════════════════
-- FIN DEL SCHEMA
-- ═══════════════════════════════════════════════════════════════════════
