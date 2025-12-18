-- =====================================================
-- Migración: Sistema de Caché de Audio Compartido
-- =====================================================
-- Permite que los audios generados por un usuario
-- estén disponibles para todos los demás usuarios
-- =====================================================

-- 1. Crear bucket para audios (si no existe)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'audio-libros',
  'audio-libros',
  true,  -- Público para que cualquier usuario pueda descargar
  10485760,  -- 10MB límite por archivo
  ARRAY['audio/mpeg', 'audio/mp3']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760;

-- 2. Política: Cualquier usuario autenticado puede leer audios
CREATE POLICY "Usuarios pueden leer audios"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'audio-libros');

-- 3. Política: Usuarios con Premium/Pro pueden subir audios
CREATE POLICY "Premium puede subir audios"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'audio-libros'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND subscription_tier IN ('premium', 'pro')
  )
);

-- 4. Política: Acceso público para lectura (sin auth requerida para descargar)
CREATE POLICY "Lectura pública de audios"
ON storage.objects FOR SELECT
TO anon
USING (bucket_id = 'audio-libros');

-- 5. Tabla para tracking de audios compartidos (metadata)
CREATE TABLE IF NOT EXISTS shared_audio_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT UNIQUE NOT NULL,
  book_id TEXT NOT NULL,
  chapter_id TEXT,
  paragraph_index INTEGER,
  voice_id TEXT NOT NULL,
  text_hash TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  duration_seconds FLOAT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  downloads_count INTEGER DEFAULT 0,
  last_downloaded_at TIMESTAMPTZ
);

-- Índices para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_shared_audio_cache_key ON shared_audio_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_shared_audio_book ON shared_audio_cache(book_id, chapter_id);
CREATE INDEX IF NOT EXISTS idx_shared_audio_text_hash ON shared_audio_cache(text_hash, voice_id);

-- 6. RLS para la tabla de metadata
ALTER TABLE shared_audio_cache ENABLE ROW LEVEL SECURITY;

-- Cualquiera puede leer la metadata
CREATE POLICY "Lectura pública de metadata de audio"
ON shared_audio_cache FOR SELECT
TO authenticated
USING (true);

-- Solo usuarios Premium/Pro pueden insertar
CREATE POLICY "Premium puede registrar audios"
ON shared_audio_cache FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND subscription_tier IN ('premium', 'pro')
  )
);

-- 7. Función para incrementar contador de descargas
CREATE OR REPLACE FUNCTION increment_audio_downloads(p_cache_key TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE shared_audio_cache
  SET
    downloads_count = downloads_count + 1,
    last_downloaded_at = NOW()
  WHERE cache_key = p_cache_key;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Función para buscar audio existente
CREATE OR REPLACE FUNCTION find_shared_audio(p_text_hash TEXT, p_voice_id TEXT)
RETURNS TABLE (
  cache_key TEXT,
  file_path TEXT,
  file_size INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sac.cache_key,
    sac.file_path,
    sac.file_size
  FROM shared_audio_cache sac
  WHERE sac.text_hash = p_text_hash
    AND sac.voice_id = p_voice_id
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Vista para estadísticas de uso
CREATE OR REPLACE VIEW audio_cache_stats AS
SELECT
  book_id,
  COUNT(*) as total_audios,
  SUM(file_size) as total_bytes,
  SUM(downloads_count) as total_downloads,
  MAX(created_at) as last_upload
FROM shared_audio_cache
GROUP BY book_id;

COMMENT ON TABLE shared_audio_cache IS 'Caché compartido de audios ElevenLabs para reducir costos';
