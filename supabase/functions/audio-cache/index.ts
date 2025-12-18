/**
 * Supabase Edge Function: Audio Cache Manager
 *
 * Gestiona el caché compartido de audios ElevenLabs
 * - GET: Verifica si existe audio y retorna URL
 * - POST: Sube nuevo audio al caché compartido
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Genera hash del texto para identificación única
function hashText(text: string): string {
  let hash = 0
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(36)
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    // Crear cliente con service role para operaciones de storage
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Cliente con auth del usuario
    const authHeader = req.headers.get('Authorization')
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader || '' } }
    })

    // Verificar usuario (opcional para lectura, requerido para escritura)
    const { data: { user } } = await supabase.auth.getUser()

    if (req.method === 'GET') {
      // ========== BUSCAR AUDIO EXISTENTE ==========
      const url = new URL(req.url)
      const textHash = url.searchParams.get('text_hash')
      const voiceId = url.searchParams.get('voice_id')
      const cacheKey = url.searchParams.get('cache_key')

      if (!textHash && !cacheKey) {
        return new Response(
          JSON.stringify({ error: 'Se requiere text_hash o cache_key' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Buscar en la base de datos
      let query = supabaseAdmin
        .from('shared_audio_cache')
        .select('cache_key, file_path, file_size')

      if (cacheKey) {
        query = query.eq('cache_key', cacheKey)
      } else {
        query = query.eq('text_hash', textHash).eq('voice_id', voiceId)
      }

      const { data: audioData, error: searchError } = await query.single()

      if (searchError || !audioData) {
        return new Response(
          JSON.stringify({ exists: false }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Obtener URL pública del archivo
      const { data: urlData } = supabaseAdmin
        .storage
        .from('audio-libros')
        .getPublicUrl(audioData.file_path)

      // Incrementar contador de descargas
      await supabaseAdmin.rpc('increment_audio_downloads', {
        p_cache_key: audioData.cache_key
      })

      return new Response(
        JSON.stringify({
          exists: true,
          url: urlData.publicUrl,
          cache_key: audioData.cache_key,
          file_size: audioData.file_size
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )

    } else if (req.method === 'POST') {
      // ========== SUBIR NUEVO AUDIO ==========

      // Requiere autenticación
      if (!user) {
        return new Response(
          JSON.stringify({ error: 'Autenticación requerida' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Verificar que es usuario Premium/Pro
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_tier')
        .eq('id', user.id)
        .single()

      if (!profile || !['premium', 'pro'].includes(profile.subscription_tier || '')) {
        return new Response(
          JSON.stringify({ error: 'Solo usuarios Premium pueden subir audios' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Obtener datos del request
      const formData = await req.formData()
      const audioFile = formData.get('audio') as File
      const metadata = JSON.parse(formData.get('metadata') as string || '{}')

      if (!audioFile) {
        return new Response(
          JSON.stringify({ error: 'Archivo de audio requerido' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const {
        cache_key,
        book_id,
        chapter_id,
        paragraph_index,
        voice_id,
        text_hash,
        text_length
      } = metadata

      if (!cache_key || !book_id || !voice_id || !text_hash) {
        return new Response(
          JSON.stringify({ error: 'Metadata incompleta' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Verificar si ya existe (evitar duplicados)
      const { data: existing } = await supabaseAdmin
        .from('shared_audio_cache')
        .select('cache_key')
        .eq('cache_key', cache_key)
        .single()

      if (existing) {
        return new Response(
          JSON.stringify({ success: true, message: 'Audio ya existe', cache_key }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Generar ruta del archivo
      const filePath = `${book_id}/${chapter_id || 'general'}/${cache_key}.mp3`

      // Subir archivo a Storage
      const arrayBuffer = await audioFile.arrayBuffer()
      const { error: uploadError } = await supabaseAdmin
        .storage
        .from('audio-libros')
        .upload(filePath, arrayBuffer, {
          contentType: 'audio/mpeg',
          upsert: true
        })

      if (uploadError) {
        console.error('Error subiendo audio:', uploadError)
        return new Response(
          JSON.stringify({ error: 'Error subiendo audio', details: uploadError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Registrar en la base de datos
      const { error: insertError } = await supabaseAdmin
        .from('shared_audio_cache')
        .insert({
          cache_key,
          book_id,
          chapter_id,
          paragraph_index,
          voice_id,
          text_hash,
          file_path: filePath,
          file_size: audioFile.size,
          created_by: user.id
        })

      if (insertError) {
        console.error('Error registrando audio:', insertError)
        // No fallar si el insert falla, el archivo ya está subido
      }

      // Obtener URL pública
      const { data: urlData } = supabaseAdmin
        .storage
        .from('audio-libros')
        .getPublicUrl(filePath)

      return new Response(
        JSON.stringify({
          success: true,
          url: urlData.publicUrl,
          cache_key,
          file_path: filePath
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Método no soportado' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error en audio-cache:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
