-- ============================================
-- RATE LIMITING Y SEGURIDAD MEJORADA
-- Protección adicional contra spam y bots
-- ============================================

-- 1. Tabla para rastrear intentos de registro
CREATE TABLE IF NOT EXISTS public.registration_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address TEXT,
    email TEXT,
    attempted_at TIMESTAMPTZ DEFAULT NOW(),
    success BOOLEAN DEFAULT false
);

-- Índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_registration_attempts_ip ON public.registration_attempts(ip_address, attempted_at);
CREATE INDEX IF NOT EXISTS idx_registration_attempts_email ON public.registration_attempts(email, attempted_at);

-- 2. Función para verificar rate limit (máximo 3 intentos por hora por IP)
CREATE OR REPLACE FUNCTION public.check_registration_rate_limit(
    p_ip_address TEXT,
    p_email TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    recent_attempts_count INTEGER;
BEGIN
    -- Contar intentos de la última hora desde esta IP
    SELECT COUNT(*)
    INTO recent_attempts_count
    FROM public.registration_attempts
    WHERE ip_address = p_ip_address
      AND attempted_at > NOW() - INTERVAL '1 hour';

    -- Si hay más de 3 intentos en la última hora, bloquear
    IF recent_attempts_count >= 3 THEN
        RETURN FALSE;
    END IF;

    -- Contar intentos con este email en las últimas 24 horas
    SELECT COUNT(*)
    INTO recent_attempts_count
    FROM public.registration_attempts
    WHERE email = p_email
      AND attempted_at > NOW() - INTERVAL '24 hours';

    -- Si hay más de 5 intentos con el mismo email, bloquear
    IF recent_attempts_count >= 5 THEN
        RETURN FALSE;
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Función para registrar intento
CREATE OR REPLACE FUNCTION public.log_registration_attempt(
    p_ip_address TEXT,
    p_email TEXT,
    p_success BOOLEAN
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.registration_attempts (ip_address, email, success)
    VALUES (p_ip_address, p_email, p_success);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Limpiar intentos antiguos (ejecutar periódicamente)
CREATE OR REPLACE FUNCTION public.cleanup_old_registration_attempts()
RETURNS VOID AS $$
BEGIN
    DELETE FROM public.registration_attempts
    WHERE attempted_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Edge Function para validación adicional (pseudocódigo)
-- Crear esto en Supabase Dashboard > Edge Functions
/*
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { email, captchaToken } = await req.json()
  const ip = req.headers.get('x-forwarded-for') || 'unknown'

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL'),
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  )

  // Verificar rate limit
  const { data: canRegister } = await supabase.rpc(
    'check_registration_rate_limit',
    { p_ip_address: ip, p_email: email }
  )

  if (!canRegister) {
    return new Response(
      JSON.stringify({ error: 'Too many attempts' }),
      { status: 429 }
    )
  }

  // Validación adicional del CAPTCHA
  // Aquí podrías agregar lógica más compleja

  return new Response(
    JSON.stringify({ success: true }),
    { status: 200 }
  )
})
*/

-- ============================================
-- CONFIGURACIÓN COMPLETADA
-- ============================================
-- Ejecuta esto en Supabase SQL Editor
-- Luego actualiza tu código JS para llamar a estas funciones
-- ============================================
