-- ============================================
-- Agregar columna 'settings' a user_settings
-- ============================================

-- Agregar columna settings JSONB
ALTER TABLE public.user_settings
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;

-- Migrar datos existentes (si hay)
UPDATE public.user_settings
SET settings = jsonb_build_object(
    'notifications_enabled', COALESCE(notifications_enabled, true),
    'notifications_reading_reminder', COALESCE(notifications_reading_reminder, true),
    'notifications_achievements', COALESCE(notifications_achievements, true),
    'notifications_new_content', COALESCE(notifications_new_content, true),
    'theme', COALESCE(theme, 'dark'),
    'font_size', COALESCE(font_size, 16),
    'auto_audio', COALESCE(auto_audio, false),
    'biometric_enabled', COALESCE(biometric_enabled, false),
    'sync_wifi_only', COALESCE(sync_wifi_only, false)
)
WHERE settings IS NULL OR settings = '{}'::jsonb;
