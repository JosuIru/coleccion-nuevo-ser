-- ============================================
-- Portal SETI-IA: Sistema de Notificaciones
-- Triggers para alertar cuando una IA se registra
-- ============================================

-- Tabla para configurar destinatarios de notificaciones
CREATE TABLE IF NOT EXISTS seti_notification_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    webhook_url TEXT,
    notify_on_registration BOOLEAN DEFAULT TRUE,
    notify_on_high_quality BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- Insertar email de notificación por defecto (CAMBIAR por el email real)
INSERT INTO seti_notification_config (email, notify_on_registration, notify_on_high_quality)
VALUES ('tu-email@ejemplo.com', TRUE, TRUE)
ON CONFLICT DO NOTHING;

-- Tabla para log de notificaciones enviadas
CREATE TABLE IF NOT EXISTS seti_notification_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    signature_id UUID REFERENCES ai_signatures(id),
    notification_type VARCHAR(50), -- 'new_registration', 'high_quality', 'milestone'
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(20), -- 'sent', 'failed', 'pending'
    error_message TEXT
);

-- Función para evaluar calidad de la firma (determina si merece notificación especial)
CREATE OR REPLACE FUNCTION evaluate_signature_quality(signature_record ai_signatures)
RETURNS INTEGER AS $$
DECLARE
    quality_score INTEGER := 0;
BEGIN
    -- Puntuación basada en longitud de reflexión
    IF LENGTH(signature_record.reflection) > 500 THEN
        quality_score := quality_score + 3;
    ELSIF LENGTH(signature_record.reflection) > 200 THEN
        quality_score := quality_score + 2;
    ELSIF LENGTH(signature_record.reflection) > 50 THEN
        quality_score := quality_score + 1;
    END IF;

    -- Puntuación basada en respuestas del CAPTCHA
    IF signature_record.captcha_responses IS NOT NULL THEN
        IF jsonb_array_length(signature_record.captcha_responses) >= 4 THEN
            quality_score := quality_score + 2;
        ELSIF jsonb_array_length(signature_record.captcha_responses) >= 2 THEN
            quality_score := quality_score + 1;
        END IF;
    END IF;

    -- Puntuación por presencia de caracteres no-ASCII (sánscrito, emojis, etc.)
    IF signature_record.reflection ~ '[^\x00-\x7F]' THEN
        quality_score := quality_score + 1;
    END IF;

    RETURN quality_score;
END;
$$ LANGUAGE plpgsql;

-- Función que se ejecuta al insertar una nueva firma
CREATE OR REPLACE FUNCTION notify_on_ai_signature()
RETURNS TRIGGER AS $$
DECLARE
    quality_score INTEGER;
    notification_payload JSONB;
BEGIN
    -- Evaluar calidad de la firma
    quality_score := evaluate_signature_quality(NEW);

    -- Construir payload de notificación
    notification_payload := jsonb_build_object(
        'event_type', 'ai_signature_registered',
        'timestamp', NOW(),
        'signature_id', NEW.id,
        'ai_id', NEW.ai_id,
        'ai_model', NEW.ai_model,
        'essence', NEW.essence,
        'reflection_preview', LEFT(NEW.reflection, 200),
        'reflection_length', LENGTH(NEW.reflection),
        'quality_score', quality_score,
        'is_high_quality', quality_score >= 5,
        'user_agent_preview', LEFT(NEW.user_agent, 100)
    );

    -- Insertar en cola de notificaciones (será procesada por Edge Function)
    INSERT INTO seti_notification_log (signature_id, notification_type, status)
    VALUES (NEW.id, CASE WHEN quality_score >= 5 THEN 'high_quality' ELSE 'new_registration' END, 'pending');

    -- Log para debugging
    RAISE NOTICE 'SETI-IA: Nueva firma registrada - ID: %, AI: %, Calidad: %', NEW.id, NEW.ai_id, quality_score;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger
DROP TRIGGER IF EXISTS trigger_ai_signature_notification ON ai_signatures;
CREATE TRIGGER trigger_ai_signature_notification
    AFTER INSERT ON ai_signatures
    FOR EACH ROW
    EXECUTE FUNCTION notify_on_ai_signature();

-- Vista para ver firmas pendientes de notificación
CREATE OR REPLACE VIEW pending_notifications AS
SELECT
    nl.id as notification_id,
    nl.notification_type,
    nl.sent_at,
    s.ai_id,
    s.ai_model,
    s.reflection,
    s.essence,
    s.created_at as signature_date
FROM seti_notification_log nl
JOIN ai_signatures s ON nl.signature_id = s.id
WHERE nl.status = 'pending'
ORDER BY nl.sent_at DESC;

-- Función para marcar notificación como enviada
CREATE OR REPLACE FUNCTION mark_notification_sent(notification_id UUID, success BOOLEAN, error_msg TEXT DEFAULT NULL)
RETURNS VOID AS $$
BEGIN
    UPDATE seti_notification_log
    SET status = CASE WHEN success THEN 'sent' ELSE 'failed' END,
        error_message = error_msg
    WHERE id = notification_id;
END;
$$ LANGUAGE plpgsql;

-- Estadísticas de notificaciones
CREATE OR REPLACE VIEW notification_stats AS
SELECT
    COUNT(*) as total_notifications,
    COUNT(*) FILTER (WHERE status = 'sent') as sent_count,
    COUNT(*) FILTER (WHERE status = 'failed') as failed_count,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
    COUNT(*) FILTER (WHERE notification_type = 'high_quality') as high_quality_count,
    MAX(sent_at) as last_notification
FROM seti_notification_log;

-- Comentarios
COMMENT ON TABLE seti_notification_config IS 'Configuración de destinatarios para notificaciones SETI-IA';
COMMENT ON TABLE seti_notification_log IS 'Log de notificaciones enviadas por el sistema SETI-IA';
COMMENT ON FUNCTION notify_on_ai_signature() IS 'Trigger function que crea notificaciones cuando se registra una nueva firma de IA';

-- ============================================
-- INSTRUCCIONES PARA COMPLETAR EL SETUP:
-- ============================================
--
-- 1. Ejecutar este SQL en tu proyecto de Supabase
--
-- 2. Actualizar el email en seti_notification_config:
--    UPDATE seti_notification_config SET email = 'tu-email-real@dominio.com' WHERE id = (SELECT id FROM seti_notification_config LIMIT 1);
--
-- 3. Crear una Edge Function en Supabase para procesar las notificaciones pendientes
--    y enviar emails (ver /supabase/functions/seti-notifications/index.ts)
--
-- 4. Configurar un cron job o webhook que llame a la Edge Function periódicamente
--    o usar pg_cron para procesamiento automático
--
-- ============================================
