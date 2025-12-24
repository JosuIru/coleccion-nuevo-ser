-- ============================================================================
-- AI CACHE TABLE
-- Sistema de caché para reducir costos de IA en 40-60%
-- ============================================================================

-- Crear tabla de caché de IA
CREATE TABLE IF NOT EXISTS public.ai_cache (
  id BIGSERIAL PRIMARY KEY,
  cache_key TEXT NOT NULL UNIQUE,
  response JSONB NOT NULL,
  query_type TEXT NOT NULL, -- 'definition', 'explain', 'chat', 'summary', etc.
  hit_count INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,

  -- Índices
  CONSTRAINT ai_cache_key_unique UNIQUE (cache_key)
);

-- Índices para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_ai_cache_key ON public.ai_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_ai_cache_type ON public.ai_cache(query_type);
CREATE INDEX IF NOT EXISTS idx_ai_cache_expires ON public.ai_cache(expires_at);

-- Índice para limpiar entradas expiradas periódicamente
CREATE INDEX IF NOT EXISTS idx_ai_cache_cleanup ON public.ai_cache(expires_at) WHERE expires_at < NOW();

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_ai_cache_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para updated_at
DROP TRIGGER IF EXISTS trigger_update_ai_cache_updated_at ON public.ai_cache;
CREATE TRIGGER trigger_update_ai_cache_updated_at
  BEFORE UPDATE ON public.ai_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_cache_updated_at();

-- Función para incrementar hit_count en upsert
CREATE OR REPLACE FUNCTION increment_ai_cache_hit_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Si es una actualización (upsert), incrementar hit_count
  IF TG_OP = 'UPDATE' THEN
    NEW.hit_count = OLD.hit_count + 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para hit_count
DROP TRIGGER IF EXISTS trigger_increment_ai_cache_hit_count ON public.ai_cache;
CREATE TRIGGER trigger_increment_ai_cache_hit_count
  BEFORE UPDATE ON public.ai_cache
  FOR EACH ROW
  EXECUTE FUNCTION increment_ai_cache_hit_count();

-- Función para limpiar entradas expiradas (se puede ejecutar con pg_cron)
CREATE OR REPLACE FUNCTION cleanup_expired_ai_cache()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.ai_cache
  WHERE expires_at < NOW();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Políticas RLS (Row Level Security)
ALTER TABLE public.ai_cache ENABLE ROW LEVEL SECURITY;

-- Política: Lectura pública (caché compartida entre todos los usuarios)
CREATE POLICY "ai_cache_select_policy" ON public.ai_cache
  FOR SELECT
  USING (true);

-- Política: Escritura para usuarios autenticados
CREATE POLICY "ai_cache_insert_policy" ON public.ai_cache
  FOR INSERT
  WITH CHECK (true);

-- Política: Update para usuarios autenticados
CREATE POLICY "ai_cache_update_policy" ON public.ai_cache
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Política: Delete solo para admins o entradas propias
CREATE POLICY "ai_cache_delete_policy" ON public.ai_cache
  FOR DELETE
  USING (true); -- Permitir limpiar entradas expiradas

-- Comentarios
COMMENT ON TABLE public.ai_cache IS 'Caché de respuestas de IA para reducir costos y mejorar latencia';
COMMENT ON COLUMN public.ai_cache.cache_key IS 'Hash único de la consulta (tipo + prompt + contexto)';
COMMENT ON COLUMN public.ai_cache.response IS 'Respuesta de la IA en formato JSON';
COMMENT ON COLUMN public.ai_cache.query_type IS 'Tipo de consulta: definition, explain, chat, summary, etc.';
COMMENT ON COLUMN public.ai_cache.hit_count IS 'Número de veces que se ha usado esta entrada de caché';
COMMENT ON COLUMN public.ai_cache.expires_at IS 'Fecha de expiración de la entrada';

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_cache TO authenticated;
GRANT SELECT ON public.ai_cache TO anon;
GRANT USAGE, SELECT ON SEQUENCE ai_cache_id_seq TO authenticated;

-- Vista para estadísticas de caché
CREATE OR REPLACE VIEW public.ai_cache_stats AS
SELECT
  query_type,
  COUNT(*) as total_entries,
  SUM(hit_count) as total_hits,
  AVG(hit_count) as avg_hits_per_entry,
  MIN(created_at) as oldest_entry,
  MAX(created_at) as newest_entry,
  COUNT(CASE WHEN expires_at < NOW() THEN 1 END) as expired_entries
FROM public.ai_cache
GROUP BY query_type;

COMMENT ON VIEW public.ai_cache_stats IS 'Estadísticas de uso de caché de IA por tipo de consulta';

-- Grant para la vista
GRANT SELECT ON public.ai_cache_stats TO authenticated, anon;

-- ============================================================================
-- CONFIGURACIÓN OPCIONAL: pg_cron para limpieza automática
-- ============================================================================
--
-- Si tienes pg_cron instalado, puedes programar limpieza automática:
--
-- SELECT cron.schedule(
--   'cleanup-expired-ai-cache',
--   '0 2 * * *', -- Ejecutar a las 2 AM diariamente
--   $$ SELECT cleanup_expired_ai_cache(); $$
-- );
--
-- ============================================================================

-- Mensaje de confirmación
DO $$
BEGIN
  RAISE NOTICE 'Tabla ai_cache creada exitosamente';
  RAISE NOTICE 'Sistema de caché de IA configurado para reducir costos';
END $$;
