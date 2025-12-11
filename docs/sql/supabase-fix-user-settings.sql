-- ============================================
-- FIX: user_settings table
-- Agregar columna 'settings' JSONB para almacenar configuración flexible
-- ============================================

-- 1. Agregar columna settings si no existe
ALTER TABLE public.user_settings
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;

-- 2. Migrar datos existentes a la columna settings (si hay datos)
UPDATE public.user_settings
SET settings = jsonb_build_object(
    'notifications_enabled', notifications_enabled,
    'notifications_reading_reminder', notifications_reading_reminder,
    'notifications_achievements', notifications_achievements,
    'notifications_new_content', notifications_new_content,
    'theme', theme,
    'font_size', font_size,
    'auto_audio', auto_audio,
    'biometric_enabled', biometric_enabled,
    'sync_wifi_only', sync_wifi_only
)
WHERE settings = '{}'::jsonb;

-- 3. Ahora las columnas individuales son opcionales
-- Puedes mantenerlas o eliminarlas, el código usará la columna 'settings'

-- ============================================
-- NOTA: Después de ejecutar esto, elimina el usuario actual
-- y crea uno nuevo para que el trigger cree el perfil correctamente
-- ============================================
