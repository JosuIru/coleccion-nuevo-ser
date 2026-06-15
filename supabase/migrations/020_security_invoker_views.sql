-- ============================================================================
-- 020_security_invoker_views.sql
-- Fuerza SECURITY INVOKER en vistas públicas para que respeten RLS del usuario.
-- ============================================================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_views
        WHERE schemaname = 'public' AND viewname = 'user_ai_stats'
    ) THEN
        EXECUTE 'ALTER VIEW public.user_ai_stats SET (security_invoker = true)';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM pg_views
        WHERE schemaname = 'public' AND viewname = 'active_subscriptions'
    ) THEN
        EXECUTE 'ALTER VIEW public.active_subscriptions SET (security_invoker = true)';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM pg_views
        WHERE schemaname = 'public' AND viewname = 'audio_cache_stats'
    ) THEN
        EXECUTE 'ALTER VIEW public.audio_cache_stats SET (security_invoker = true)';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM pg_views
        WHERE schemaname = 'public' AND viewname = 'ai_cache_stats'
    ) THEN
        EXECUTE 'ALTER VIEW public.ai_cache_stats SET (security_invoker = true)';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM pg_views
        WHERE schemaname = 'public' AND viewname = 'user_reading_stats'
    ) THEN
        EXECUTE 'ALTER VIEW public.user_reading_stats SET (security_invoker = true)';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM pg_views
        WHERE schemaname = 'public' AND viewname = 'user_achievements_detailed'
    ) THEN
        EXECUTE 'ALTER VIEW public.user_achievements_detailed SET (security_invoker = true)';
    END IF;
END $$;
