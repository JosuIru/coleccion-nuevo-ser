-- =====================================================
-- Migration: 002_email_triggers.sql
-- Description: Email notification triggers and functions
-- =====================================================

-- Enable pg_net extension for HTTP calls (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- =====================================================
-- Email queue table for reliable delivery
-- =====================================================

CREATE TABLE IF NOT EXISTS email_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    to_email TEXT NOT NULL,
    template TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
    attempts INTEGER DEFAULT 0,
    last_error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    sent_at TIMESTAMPTZ,
    CONSTRAINT max_attempts CHECK (attempts <= 5)
);

-- Index for processing pending emails
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_email_queue_created ON email_queue(created_at);

-- =====================================================
-- Function to queue an email
-- =====================================================

CREATE OR REPLACE FUNCTION queue_email(
    p_to_email TEXT,
    p_template TEXT,
    p_data JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_email_id UUID;
BEGIN
    INSERT INTO email_queue (to_email, template, data)
    VALUES (p_to_email, p_template, p_data)
    RETURNING id INTO v_email_id;

    RETURN v_email_id;
END;
$$;

-- =====================================================
-- Function to send email via Edge Function
-- =====================================================

CREATE OR REPLACE FUNCTION send_email_via_edge(
    p_to_email TEXT,
    p_template TEXT,
    p_data JSONB DEFAULT '{}'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_edge_function_url TEXT;
    v_service_role_key TEXT;
BEGIN
    -- Get configuration from secrets
    -- These should be set via Supabase dashboard
    v_edge_function_url := current_setting('app.settings.edge_function_url', true);
    v_service_role_key := current_setting('app.settings.service_role_key', true);

    -- If settings not available, queue for later processing
    IF v_edge_function_url IS NULL OR v_service_role_key IS NULL THEN
        PERFORM queue_email(p_to_email, p_template, p_data);
        RETURN;
    END IF;

    -- Call Edge Function via pg_net
    PERFORM net.http_post(
        url := v_edge_function_url || '/send-email',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || v_service_role_key
        ),
        body := jsonb_build_object(
            'to', p_to_email,
            'template', p_template,
            'data', p_data
        )
    );

EXCEPTION WHEN OTHERS THEN
    -- If HTTP call fails, queue the email for retry
    PERFORM queue_email(p_to_email, p_template, p_data);
    RAISE WARNING 'Email queued due to error: %', SQLERRM;
END;
$$;

-- =====================================================
-- Trigger: Send welcome email on new user signup
-- =====================================================

CREATE OR REPLACE FUNCTION trigger_send_welcome_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Queue welcome email
    PERFORM queue_email(
        NEW.email,
        'welcome',
        jsonb_build_object(
            'userName', COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
            'userEmail', NEW.email
        )
    );

    RETURN NEW;
END;
$$;

-- Note: This trigger should be on auth.users, but we can't create triggers
-- on auth schema in migrations. Instead, use Supabase Auth hooks or
-- create a trigger on the profiles table.

-- Trigger on profiles table (created after auth signup)
DROP TRIGGER IF EXISTS on_profile_created_send_welcome ON profiles;

CREATE TRIGGER on_profile_created_send_welcome
    AFTER INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION trigger_send_welcome_email();

-- =====================================================
-- Trigger: Send payment confirmation on subscription update
-- =====================================================

CREATE OR REPLACE FUNCTION trigger_send_payment_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Only send if tier changed from free to premium/pro
    IF OLD.subscription_tier = 'free' AND NEW.subscription_tier IN ('premium', 'pro') THEN
        PERFORM queue_email(
            NEW.email,
            'payment-success',
            jsonb_build_object(
                'userName', COALESCE(NEW.full_name, split_part(NEW.email, '@', 1)),
                'userEmail', NEW.email,
                'tier', NEW.subscription_tier,
                'credits', NEW.ai_credits_remaining
            )
        );
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_subscription_upgrade ON profiles;

CREATE TRIGGER on_subscription_upgrade
    AFTER UPDATE OF subscription_tier ON profiles
    FOR EACH ROW
    WHEN (OLD.subscription_tier IS DISTINCT FROM NEW.subscription_tier)
    EXECUTE FUNCTION trigger_send_payment_email();

-- =====================================================
-- Trigger: Send low credits warning
-- =====================================================

CREATE OR REPLACE FUNCTION trigger_send_low_credits_warning()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_threshold INTEGER;
    v_days_remaining INTEGER;
BEGIN
    -- Calculate threshold (20% of monthly allowance)
    v_threshold := CASE NEW.subscription_tier
        WHEN 'pro' THEN 400      -- 20% of 2000
        WHEN 'premium' THEN 100  -- 20% of 500
        ELSE 2                   -- 20% of 10 (free)
    END;

    -- Only send if:
    -- 1. Credits dropped below threshold
    -- 2. Credits were above threshold before
    -- 3. User is premium or pro (not free)
    IF NEW.ai_credits_remaining < v_threshold
       AND OLD.ai_credits_remaining >= v_threshold
       AND NEW.subscription_tier IN ('premium', 'pro')
    THEN
        -- Calculate days until reset (assuming monthly)
        v_days_remaining := EXTRACT(DAY FROM
            (date_trunc('month', NOW()) + INTERVAL '1 month' - NOW())
        )::INTEGER;

        PERFORM queue_email(
            NEW.email,
            'low-credits',
            jsonb_build_object(
                'userName', COALESCE(NEW.full_name, split_part(NEW.email, '@', 1)),
                'credits', NEW.ai_credits_remaining,
                'daysRemaining', v_days_remaining,
                'tier', NEW.subscription_tier
            )
        );
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_credits_low ON profiles;

CREATE TRIGGER on_credits_low
    AFTER UPDATE OF ai_credits_remaining ON profiles
    FOR EACH ROW
    WHEN (OLD.ai_credits_remaining IS DISTINCT FROM NEW.ai_credits_remaining)
    EXECUTE FUNCTION trigger_send_low_credits_warning();

-- =====================================================
-- RLS Policies for email_queue
-- =====================================================

ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;

-- Only service role can access email queue
CREATE POLICY "Service role access only"
    ON email_queue
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- Scheduled function to process email queue
-- This should be called by a cron job or pg_cron
-- =====================================================

CREATE OR REPLACE FUNCTION process_email_queue()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_email RECORD;
    v_processed INTEGER := 0;
    v_edge_function_url TEXT;
    v_service_role_key TEXT;
BEGIN
    -- Get configuration
    v_edge_function_url := current_setting('app.settings.edge_function_url', true);
    v_service_role_key := current_setting('app.settings.service_role_key', true);

    -- Exit if configuration not available
    IF v_edge_function_url IS NULL OR v_service_role_key IS NULL THEN
        RAISE NOTICE 'Email processing skipped: configuration not set';
        RETURN 0;
    END IF;

    -- Process pending emails (max 10 per run)
    FOR v_email IN
        SELECT id, to_email, template, data
        FROM email_queue
        WHERE status = 'pending'
          AND attempts < 5
        ORDER BY created_at
        LIMIT 10
    LOOP
        BEGIN
            -- Try to send via Edge Function
            PERFORM net.http_post(
                url := v_edge_function_url || '/send-email',
                headers := jsonb_build_object(
                    'Content-Type', 'application/json',
                    'Authorization', 'Bearer ' || v_service_role_key
                ),
                body := jsonb_build_object(
                    'to', v_email.to_email,
                    'template', v_email.template,
                    'data', v_email.data
                )
            );

            -- Mark as sent
            UPDATE email_queue
            SET status = 'sent',
                sent_at = NOW()
            WHERE id = v_email.id;

            v_processed := v_processed + 1;

        EXCEPTION WHEN OTHERS THEN
            -- Mark failed attempt
            UPDATE email_queue
            SET attempts = attempts + 1,
                last_error = SQLERRM,
                status = CASE
                    WHEN attempts >= 4 THEN 'failed'
                    ELSE 'pending'
                END
            WHERE id = v_email.id;
        END;
    END LOOP;

    RETURN v_processed;
END;
$$;

-- =====================================================
-- Grant permissions
-- =====================================================

GRANT EXECUTE ON FUNCTION queue_email TO authenticated;
GRANT EXECUTE ON FUNCTION send_email_via_edge TO service_role;
GRANT EXECUTE ON FUNCTION process_email_queue TO service_role;

-- =====================================================
-- Comments
-- =====================================================

COMMENT ON TABLE email_queue IS 'Queue for email notifications with retry support';
COMMENT ON FUNCTION queue_email IS 'Add an email to the queue for sending';
COMMENT ON FUNCTION send_email_via_edge IS 'Send email directly via Edge Function';
COMMENT ON FUNCTION process_email_queue IS 'Process queued emails (call via cron)';
