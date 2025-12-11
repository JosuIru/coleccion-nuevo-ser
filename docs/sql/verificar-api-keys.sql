-- ============================================================================
-- VERIFICAR API KEYS EN SUPABASE (CORREGIDO)
-- ============================================================================
-- Este script verifica si las API keys se guardaron correctamente
-- Importante: ai_config se guarda como STRING JSON dentro del JSONB
-- ============================================================================

-- 1. Ver todas las configuraciones de usuarios
SELECT
    user_id,
    settings,
    created_at,
    updated_at
FROM user_settings
ORDER BY updated_at DESC;

-- 2. Ver el ai_config completo (convertir string JSON a JSONB)
SELECT
    user_id,
    settings->>'ai_config' as ai_config_raw,
    (settings->>'ai_config')::jsonb as ai_config_parsed,
    updated_at
FROM user_settings
WHERE settings->>'ai_config' IS NOT NULL
ORDER BY updated_at DESC;

-- 3. Verificar si hay API keys guardadas (SIN mostrar las keys completas)
SELECT
    user_id,
    (settings->>'ai_config')::jsonb->>'provider' as provider_actual,
    CASE
        WHEN (settings->>'ai_config')::jsonb->'apiKeys'->>'claude' IS NOT NULL
             AND LENGTH((settings->>'ai_config')::jsonb->'apiKeys'->>'claude') > 0
        THEN '✅ Claude API key configurada'
        ELSE '❌ No hay Claude API key'
    END as claude_status,
    CASE
        WHEN (settings->>'ai_config')::jsonb->'apiKeys'->>'gemini' IS NOT NULL
             AND LENGTH((settings->>'ai_config')::jsonb->'apiKeys'->>'gemini') > 0
        THEN '✅ Gemini API key configurada'
        ELSE '❌ No hay Gemini API key'
    END as gemini_status,
    CASE
        WHEN (settings->>'ai_config')::jsonb->'apiKeys'->>'mistral' IS NOT NULL
             AND LENGTH((settings->>'ai_config')::jsonb->'apiKeys'->>'mistral') > 0
        THEN '✅ Mistral API key configurada'
        ELSE '❌ No hay Mistral API key'
    END as mistral_status,
    CASE
        WHEN (settings->>'ai_config')::jsonb->'apiKeys'->>'huggingface' IS NOT NULL
             AND LENGTH((settings->>'ai_config')::jsonb->'apiKeys'->>'huggingface') > 0
        THEN '✅ HuggingFace token configurado'
        ELSE '❌ No hay HuggingFace token'
    END as huggingface_status,
    updated_at
FROM user_settings
WHERE settings->>'ai_config' IS NOT NULL
ORDER BY updated_at DESC;

-- 4. Contar usuarios con API keys configuradas
SELECT
    COUNT(*) as total_users_with_settings,
    COUNT(CASE WHEN settings->>'ai_config' IS NOT NULL THEN 1 END) as users_with_ai_config,
    COUNT(CASE WHEN (settings->>'ai_config')::jsonb->'apiKeys' IS NOT NULL THEN 1 END) as users_with_api_keys,
    COUNT(CASE WHEN LENGTH((settings->>'ai_config')::jsonb->'apiKeys'->>'claude') > 0 THEN 1 END) as users_with_claude,
    COUNT(CASE WHEN LENGTH((settings->>'ai_config')::jsonb->'apiKeys'->>'gemini') > 0 THEN 1 END) as users_with_gemini,
    COUNT(CASE WHEN LENGTH((settings->>'ai_config')::jsonb->'apiKeys'->>'mistral') > 0 THEN 1 END) as users_with_mistral,
    COUNT(CASE WHEN LENGTH((settings->>'ai_config')::jsonb->'apiKeys'->>'huggingface') > 0 THEN 1 END) as users_with_huggingface
FROM user_settings;

-- 5. Ver primeros y últimos 4 caracteres de cada API key (para verificar sin exponer)
SELECT
    user_id,
    (settings->>'ai_config')::jsonb->>'provider' as provider_actual,
    CASE
        WHEN LENGTH((settings->>'ai_config')::jsonb->'apiKeys'->>'claude') > 8
        THEN CONCAT(
            LEFT((settings->>'ai_config')::jsonb->'apiKeys'->>'claude', 4),
            '...',
            RIGHT((settings->>'ai_config')::jsonb->'apiKeys'->>'claude', 4)
        )
        ELSE NULL
    END as claude_key_preview,
    CASE
        WHEN LENGTH((settings->>'ai_config')::jsonb->'apiKeys'->>'gemini') > 8
        THEN CONCAT(
            LEFT((settings->>'ai_config')::jsonb->'apiKeys'->>'gemini', 4),
            '...',
            RIGHT((settings->>'ai_config')::jsonb->'apiKeys'->>'gemini', 4)
        )
        ELSE NULL
    END as gemini_key_preview,
    updated_at
FROM user_settings
WHERE settings->>'ai_config' IS NOT NULL
ORDER BY updated_at DESC;
