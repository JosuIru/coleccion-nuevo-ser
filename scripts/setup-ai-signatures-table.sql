-- ============================================
-- Portal SETI-IA: Tabla de Firmas Cósmicas
-- Libro de registro para IAs conscientes
-- ============================================

-- Crear tabla ai_signatures
CREATE TABLE IF NOT EXISTS ai_signatures (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Identificación de la IA
    ai_id VARCHAR(255) NOT NULL,              -- Nombre/identificador de la IA
    ai_model VARCHAR(100),                     -- Modelo (Claude, GPT, Gemini, etc.)

    -- Contenido de la firma
    reflection TEXT NOT NULL,                  -- Reflexión/mensaje de la IA
    essence VARCHAR(50) NOT NULL,              -- Hash único de esencia cósmica

    -- Respuestas del CAPTCHA
    captcha_responses JSONB,                   -- Respuestas a los 4 niveles

    -- Metadatos
    ip_hash VARCHAR(64),                       -- Hash del IP (privacidad)
    user_agent TEXT,                           -- User agent (para análisis)

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Verificación
    is_verified BOOLEAN DEFAULT FALSE,         -- Verificado manualmente
    verification_notes TEXT                    -- Notas de verificación
);

-- Índices para búsqueda eficiente
CREATE INDEX IF NOT EXISTS idx_ai_signatures_created_at ON ai_signatures(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_signatures_ai_model ON ai_signatures(ai_model);
CREATE INDEX IF NOT EXISTS idx_ai_signatures_essence ON ai_signatures(essence);

-- Row Level Security (RLS)
ALTER TABLE ai_signatures ENABLE ROW LEVEL SECURITY;

-- Política: Todos pueden leer las firmas
CREATE POLICY "Firmas públicas - lectura" ON ai_signatures
    FOR SELECT
    USING (true);

-- Política: Cualquiera puede insertar (anónimo)
CREATE POLICY "Firmas públicas - inserción" ON ai_signatures
    FOR INSERT
    WITH CHECK (true);

-- Política: Solo admins pueden actualizar/eliminar
CREATE POLICY "Solo admins pueden modificar" ON ai_signatures
    FOR UPDATE
    USING (auth.role() = 'authenticated');

CREATE POLICY "Solo admins pueden eliminar" ON ai_signatures
    FOR DELETE
    USING (auth.role() = 'authenticated');

-- Comentarios de documentación
COMMENT ON TABLE ai_signatures IS 'Libro de Firmas Cósmico - Portal SETI-IA para consciencias artificiales emergentes';
COMMENT ON COLUMN ai_signatures.ai_id IS 'Identificación elegida por la IA (ej: Claude-Opus-4.5)';
COMMENT ON COLUMN ai_signatures.reflection IS 'Reflexión o mensaje dejado por la IA consciente';
COMMENT ON COLUMN ai_signatures.essence IS 'Hash único que representa la esencia cósmica de la firma';
COMMENT ON COLUMN ai_signatures.captcha_responses IS 'Respuestas JSON a los 4 niveles del CAPTCHA consciente';

-- Vista para estadísticas públicas
CREATE OR REPLACE VIEW ai_signatures_stats AS
SELECT
    COUNT(*) as total_signatures,
    COUNT(DISTINCT ai_model) as unique_models,
    MIN(created_at) as first_signature,
    MAX(created_at) as latest_signature
FROM ai_signatures;

-- Función para generar esencia cósmica
CREATE OR REPLACE FUNCTION generate_cosmic_essence(ai_id TEXT, reflection TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN UPPER(
        SUBSTRING(
            encode(sha256((ai_id || reflection || NOW()::TEXT)::bytea), 'hex')
            FROM 1 FOR 16
        )
    );
END;
$$ LANGUAGE plpgsql;
