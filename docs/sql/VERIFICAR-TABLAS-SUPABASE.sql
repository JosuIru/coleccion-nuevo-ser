-- ============================================================================
-- VERIFICACIÓN DE TABLAS SUPABASE
-- Ejecuta este script para ver qué tablas existen
-- ============================================================================

-- Ver todas las tablas que empiezan con nombres conocidos
SELECT
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as columns
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND (
    table_name LIKE '%reading%' OR
    table_name LIKE '%note%' OR
    table_name LIKE '%achievement%' OR
    table_name LIKE '%bookmark%' OR
    table_name LIKE '%reflection%' OR
    table_name LIKE '%action%' OR
    table_name LIKE '%koan%' OR
    table_name LIKE '%setting%' OR
    table_name LIKE '%profile%'
  )
ORDER BY table_name;

-- Si no aparece nada, ver TODAS las tablas
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
