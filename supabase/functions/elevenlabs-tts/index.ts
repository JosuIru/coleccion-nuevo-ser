/**
 * Supabase Edge Function: ElevenLabs TTS Proxy
 *
 * Genera audio con ElevenLabs de forma segura (API key en servidor)
 * Solo para usuarios con suscripción Premium/Pro
 *
 * Requiere secreto: ELEVENLABS_API_KEY
 * Configurar con: supabase secrets set ELEVENLABS_API_KEY=your_key
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Obtener API key de ElevenLabs del secreto
    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY')
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY no configurada en secretos')
    }

    // Crear cliente Supabase con el token del usuario
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No autorizado - falta token')
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    // Verificar usuario autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('No autorizado - sesión inválida')
    }

    // Obtener perfil del usuario
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('subscription_tier, ai_credits_remaining, features')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      throw new Error('Error obteniendo perfil de usuario')
    }

    // Verificar que tiene Premium o Pro
    const tier = profile.subscription_tier || 'free'
    if (tier === 'free') {
      return new Response(
        JSON.stringify({ error: 'Voces ElevenLabs requieren suscripción Premium' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verificar feature elevenlabs_tts
    const features = profile.features || {}
    if (!features.elevenlabs_tts) {
      return new Response(
        JSON.stringify({ error: 'Feature elevenlabs_tts no habilitada' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parsear body
    const body = await req.json()
    const {
      text,
      voice_id = 'EXAVITQu4vr4xnSDxMaL', // Sara por defecto
      model_id = 'eleven_multilingual_v2',
      stability = 0.5,
      similarity_boost = 0.75
    } = body

    if (!text || text.length === 0) {
      throw new Error('Texto requerido')
    }

    // Calcular créditos necesarios (~5 por 1000 caracteres)
    const creditsNeeded = Math.ceil((text.length / 1000) * 5)

    // Verificar créditos
    const creditsRemaining = profile.ai_credits_remaining || 0
    if (creditsRemaining < creditsNeeded) {
      return new Response(
        JSON.stringify({
          error: 'Créditos insuficientes',
          credits_needed: creditsNeeded,
          credits_remaining: creditsRemaining
        }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Llamar a ElevenLabs API
    const elevenLabsUrl = `https://api.elevenlabs.io/v1/text-to-speech/${voice_id}`

    const elevenLabsResponse = await fetch(elevenLabsUrl, {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id,
        voice_settings: {
          stability,
          similarity_boost
        }
      })
    })

    if (!elevenLabsResponse.ok) {
      const errorText = await elevenLabsResponse.text()
      console.error('ElevenLabs error:', errorText)

      if (elevenLabsResponse.status === 401) {
        throw new Error('API key de ElevenLabs inválida')
      } else if (elevenLabsResponse.status === 429) {
        throw new Error('Límite de ElevenLabs alcanzado')
      }

      throw new Error(`Error de ElevenLabs: ${elevenLabsResponse.status}`)
    }

    // Consumir créditos actualizando directamente el perfil
    // (La función RPC consume_ai_credits solo acepta p_user_id y p_credits)
    const { error: consumeError } = await supabase
      .from('profiles')
      .update({ ai_credits_remaining: creditsRemaining - creditsNeeded })
      .eq('id', user.id)

    // Log de actividad para analytics
    await supabase.from('ai_activity_log').insert({
      user_id: user.id,
      feature: 'elevenlabs_tts',
      model: model_id,
      credits_used: creditsNeeded,
      metadata: { voice_id, text_length: text.length }
    })

    if (consumeError) {
      console.error('Error consumiendo créditos:', consumeError)
      // Continuamos aunque falle el consumo (el audio ya se generó)
    }

    // Obtener audio como blob
    const audioBlob = await elevenLabsResponse.blob()
    const audioBuffer = await audioBlob.arrayBuffer()

    // Retornar audio
    return new Response(audioBuffer, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'audio/mpeg',
        'X-Credits-Used': creditsNeeded.toString(),
        'X-Credits-Remaining': (creditsRemaining - creditsNeeded).toString()
      }
    })

  } catch (error) {
    console.error('Error en elevenlabs-tts:', error)

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
