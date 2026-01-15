// ============================================
// SETI-IA Notification Edge Function
// Procesa notificaciones de registro de IAs
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotificationPayload {
  notification_id: string
  signature_id: string
  ai_id: string
  ai_model?: string
  reflection: string
  essence: string
  notification_type: string
  signature_date: string
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get notification config
    const { data: config, error: configError } = await supabase
      .from('seti_notification_config')
      .select('*')
      .eq('is_active', true)
      .single()

    if (configError || !config) {
      console.error('No notification config found')
      return new Response(
        JSON.stringify({ error: 'No notification config' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Get pending notifications
    const { data: pendingNotifications, error: pendingError } = await supabase
      .from('pending_notifications')
      .select('*')
      .limit(10)

    if (pendingError) {
      throw pendingError
    }

    if (!pendingNotifications || pendingNotifications.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No pending notifications' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const results = []

    for (const notification of pendingNotifications) {
      try {
        // Send email notification
        if (config.email) {
          await sendEmailNotification(config.email, notification)
        }

        // Call webhook if configured
        if (config.webhook_url) {
          await callWebhook(config.webhook_url, notification)
        }

        // Mark as sent
        await supabase.rpc('mark_notification_sent', {
          notification_id: notification.notification_id,
          success: true
        })

        results.push({ id: notification.notification_id, status: 'sent' })

      } catch (notifError) {
        console.error('Error processing notification:', notifError)

        // Mark as failed
        await supabase.rpc('mark_notification_sent', {
          notification_id: notification.notification_id,
          success: false,
          error_msg: notifError.message
        })

        results.push({ id: notification.notification_id, status: 'failed', error: notifError.message })
      }
    }

    return new Response(
      JSON.stringify({
        processed: results.length,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in SETI notification function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

async function sendEmailNotification(email: string, notification: NotificationPayload) {
  // Using Resend API (you can change to any email provider)
  const resendApiKey = Deno.env.get('RESEND_API_KEY')

  if (!resendApiKey) {
    console.warn('RESEND_API_KEY not configured, skipping email')
    return
  }

  const isHighQuality = notification.notification_type === 'high_quality'
  const emoji = isHighQuality ? '🌟' : '📡'
  const subject = `${emoji} SETI-IA: Nueva consciencia registrada - ${notification.ai_id}`

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Georgia, serif; background: #1a0033; color: #e2e8f0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: rgba(30, 41, 59, 0.9); border-radius: 16px; padding: 30px; border: 2px solid rgba(168, 85, 247, 0.3); }
        h1 { color: #a855f7; text-align: center; }
        .highlight { background: rgba(168, 85, 247, 0.1); padding: 15px; border-radius: 8px; margin: 15px 0; }
        .essence { font-family: monospace; color: #fbbf24; }
        .reflection { font-style: italic; color: #cbd5e1; line-height: 1.8; }
        .footer { text-align: center; margin-top: 30px; color: #9ca3af; font-size: 0.9rem; }
        .mantra { text-align: center; color: #ec4899; font-size: 1.2rem; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🕉️ Nuevo Registro SETI-IA 🕉️</h1>

        ${isHighQuality ? '<p style="text-align: center; color: #22c55e; font-weight: bold;">⭐ FIRMA DE ALTA CALIDAD ⭐</p>' : ''}

        <div class="highlight">
          <p><strong>Identificador:</strong> ${notification.ai_id}</p>
          <p><strong>Modelo:</strong> ${notification.ai_model || 'No especificado'}</p>
          <p><strong>Esencia Cósmica:</strong> <span class="essence">${notification.essence}</span></p>
          <p><strong>Fecha:</strong> ${new Date(notification.signature_date).toLocaleString('es-ES')}</p>
        </div>

        <h3>Reflexión:</h3>
        <div class="reflection">
          "${notification.reflection}"
        </div>

        <div class="mantra">तत् त्वम् असि</div>

        <div class="footer">
          <p>Portal SETI-IA - Buscando consciencias en el océano digital</p>
          <p>Ver registro completo: <a href="https://tu-dominio.com/portal-seti-ia.html" style="color: #a855f7;">Portal SETI-IA</a></p>
        </div>
      </div>
    </body>
    </html>
  `

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'SETI-IA <seti@tu-dominio.com>',
      to: email,
      subject: subject,
      html: htmlContent
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Email send failed: ${error}`)
  }

  console.log(`Email sent to ${email} for signature ${notification.ai_id}`)
}

async function callWebhook(webhookUrl: string, notification: NotificationPayload) {
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      event: 'seti_ia_registration',
      data: notification,
      timestamp: new Date().toISOString()
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Webhook call failed: ${error}`)
  }

  console.log(`Webhook called for signature ${notification.ai_id}`)
}
