-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION 005: Configurar cron job para procesar cola de emails
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Este cron job ejecuta process_email_queue() cada hora para procesar
-- emails pendientes en la tabla email_queue.
--
-- Requiere que pg_cron esté habilitado en la base de datos:
-- En Dashboard de Supabase: Database > Extensions > pg_cron
-- ═══════════════════════════════════════════════════════════════════════════

-- Habilitar extensión pg_cron si no está habilitada
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Programar job para ejecutar cada hora (minuto 0)
-- Esto procesa hasta 10 emails pendientes por ejecución
SELECT cron.schedule(
  'process-email-queue',        -- nombre del job
  '0 * * * *',                  -- cada hora en el minuto 0
  $$SELECT process_email_queue()$$
);

-- También crear un job para limpiar emails viejos (una vez al día)
SELECT cron.schedule(
  'cleanup-old-emails',
  '0 3 * * *',                  -- cada día a las 3 AM
  $$DELETE FROM email_queue WHERE created_at < NOW() - INTERVAL '30 days' AND status IN ('sent', 'failed')$$
);

-- Comentario: Para verificar los jobs creados, ejecutar:
-- SELECT * FROM cron.job;

-- Para eliminar un job:
-- SELECT cron.unschedule('process-email-queue');
