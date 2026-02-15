/**
 * Edge Function: admin-notifications
 * Sistema de notificaciones al administrador
 *
 * Tipos de notificaciones:
 * - support_escalation: Cuando un usuario solicita atencion humana
 * - payment_issue: Problemas con pagos
 * - btc_pending: Pagos BTC pendientes de verificacion
 * - user_feedback: Sugerencias/feedback de usuarios
 * - daily_summary: Resumen diario de actividad
 *
 * @version 1.0.0
 * @created 2025-01-15
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Email del admin (configurar en variables de entorno)
const ADMIN_EMAIL = Deno.env.get('ADMIN_EMAIL') || 'irurag@gmail.com';
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || '';

interface NotificationPayload {
  type: 'support_escalation' | 'payment_issue' | 'btc_pending' | 'user_feedback' | 'daily_summary';
  userId?: string;
  userEmail?: string;
  userName?: string;
  category?: string;
  reason?: string;
  message?: string;
  conversationId?: string;
  conversationHistory?: Array<{ role: string; content: string }>;
  data?: Record<string, unknown>;
  timestamp?: string;
}

/**
 * Enviar email via Resend API
 */
async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not configured, skipping email');
    return false;
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Coleccion Nuevo Ser <notificaciones@nuevosser.com>',
        to: [to],
        subject,
        html,
      }),
    });

    if (!response.ok) {
      console.error('Resend API error:', await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

/**
 * Guardar notificacion en la base de datos
 */
async function saveNotification(supabase: ReturnType<typeof createClient>, notification: NotificationPayload) {
  try {
    await supabase.from('admin_notifications').insert({
      type: notification.type,
      user_id: notification.userId,
      user_email: notification.userEmail,
      category: notification.category,
      message: notification.message,
      data: notification.data || {},
      read: false,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error saving notification:', error);
  }
}

/**
 * Construir email HTML segun tipo
 */
function buildEmailHtml(notification: NotificationPayload): { subject: string; html: string } {
  const timestamp = new Date(notification.timestamp || Date.now()).toLocaleString('es-ES');

  switch (notification.type) {
    case 'support_escalation':
      return {
        subject: `[SOPORTE] Escalacion: ${notification.category} - ${notification.userName || notification.userEmail}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #0891b2, #3b82f6); padding: 20px; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0;">🚨 Escalacion de Soporte</h1>
            </div>
            <div style="background: #1e293b; padding: 20px; color: #e2e8f0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px; color: #94a3b8;">Usuario:</td>
                  <td style="padding: 8px;">${notification.userName || 'N/A'} (${notification.userEmail || 'N/A'})</td>
                </tr>
                <tr>
                  <td style="padding: 8px; color: #94a3b8;">Categoria:</td>
                  <td style="padding: 8px;">${notification.category || 'General'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; color: #94a3b8;">Razon:</td>
                  <td style="padding: 8px;">${notification.reason || 'Solicitud de atencion humana'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; color: #94a3b8;">Fecha:</td>
                  <td style="padding: 8px;">${timestamp}</td>
                </tr>
              </table>

              <div style="margin-top: 20px; padding: 15px; background: #0f172a; border-radius: 8px;">
                <h3 style="color: #f8fafc; margin-top: 0;">Mensaje del usuario:</h3>
                <p style="color: #e2e8f0; white-space: pre-wrap;">${notification.message || 'Sin mensaje'}</p>
              </div>

              ${notification.conversationHistory && notification.conversationHistory.length > 0 ? `
                <div style="margin-top: 20px;">
                  <h3 style="color: #f8fafc;">Historial de conversacion:</h3>
                  ${notification.conversationHistory.map((msg: { role: string; content: string }) => `
                    <div style="margin: 10px 0; padding: 10px; background: ${msg.role === 'user' ? '#0891b2' : '#374151'}; border-radius: 8px;">
                      <strong style="color: ${msg.role === 'user' ? '#fff' : '#94a3b8'};">${msg.role === 'user' ? 'Usuario' : 'IA'}:</strong>
                      <p style="color: #f8fafc; margin: 5px 0 0 0;">${msg.content}</p>
                    </div>
                  `).join('')}
                </div>
              ` : ''}

              <div style="margin-top: 20px; padding: 15px; background: #059669; border-radius: 8px; text-align: center;">
                <a href="mailto:${notification.userEmail}" style="color: white; text-decoration: none; font-weight: bold;">
                  Responder al usuario
                </a>
              </div>
            </div>
            <div style="background: #0f172a; padding: 15px; text-align: center; border-radius: 0 0 12px 12px;">
              <p style="color: #64748b; margin: 0; font-size: 12px;">
                Coleccion Nuevo Ser - Panel de Administracion
              </p>
            </div>
          </div>
        `,
      };

    case 'btc_pending':
      return {
        subject: `[BTC] Pago pendiente de verificacion`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #f97316, #eab308); padding: 20px; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0;">₿ Pago Bitcoin Pendiente</h1>
            </div>
            <div style="background: #1e293b; padding: 20px; color: #e2e8f0;">
              <p>Hay un nuevo pago Bitcoin pendiente de verificacion automatica.</p>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px; color: #94a3b8;">Usuario:</td>
                  <td style="padding: 8px;">${notification.userName || notification.userEmail}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; color: #94a3b8;">TX ID:</td>
                  <td style="padding: 8px; font-family: monospace;">${(notification.data as Record<string, unknown>)?.txId || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; color: #94a3b8;">Monto BTC:</td>
                  <td style="padding: 8px;">${(notification.data as Record<string, unknown>)?.btcAmount || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; color: #94a3b8;">Tokens:</td>
                  <td style="padding: 8px;">${(notification.data as Record<string, unknown>)?.tokens || 'N/A'}</td>
                </tr>
              </table>
              <p style="color: #94a3b8; font-size: 12px; margin-top: 20px;">
                La verificacion automatica via Blockstream API deberia procesar este pago.
                Si no se verifica en 30 minutos, revisa manualmente.
              </p>
            </div>
          </div>
        `,
      };

    case 'payment_issue':
      return {
        subject: `[PAGO] Problema con pago - ${notification.userEmail}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #dc2626, #f97316); padding: 20px; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0;">⚠️ Problema de Pago</h1>
            </div>
            <div style="background: #1e293b; padding: 20px; color: #e2e8f0;">
              <p>${notification.message}</p>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px; color: #94a3b8;">Usuario:</td>
                  <td style="padding: 8px;">${notification.userEmail}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; color: #94a3b8;">Fecha:</td>
                  <td style="padding: 8px;">${timestamp}</td>
                </tr>
              </table>
            </div>
          </div>
        `,
      };

    case 'user_feedback':
      return {
        subject: `[FEEDBACK] ${notification.category} - ${notification.userName || notification.userEmail}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #8b5cf6, #ec4899); padding: 20px; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0;">💡 Feedback de Usuario</h1>
            </div>
            <div style="background: #1e293b; padding: 20px; color: #e2e8f0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px; color: #94a3b8;">Usuario:</td>
                  <td style="padding: 8px;">${notification.userName || 'Anonimo'} (${notification.userEmail || 'N/A'})</td>
                </tr>
                <tr>
                  <td style="padding: 8px; color: #94a3b8;">Tipo:</td>
                  <td style="padding: 8px;">${notification.category}</td>
                </tr>
              </table>
              <div style="margin-top: 20px; padding: 15px; background: #0f172a; border-radius: 8px;">
                <p style="color: #e2e8f0; white-space: pre-wrap;">${notification.message}</p>
              </div>
            </div>
          </div>
        `,
      };

    case 'daily_summary':
      return {
        subject: `[RESUMEN] Actividad diaria - ${new Date().toLocaleDateString('es-ES')}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #0891b2, #8b5cf6); padding: 20px; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0;">📊 Resumen Diario</h1>
            </div>
            <div style="background: #1e293b; padding: 20px; color: #e2e8f0;">
              ${notification.message}
            </div>
          </div>
        `,
      };

    default:
      return {
        subject: `[NOTIFICACION] ${notification.type}`,
        html: `<div>${notification.message || 'Notificacion sin contenido'}</div>`,
      };
  }
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const notification: NotificationPayload = await req.json();

    if (!notification.type) {
      return new Response(
        JSON.stringify({ error: 'type es requerido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Inicializar Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Guardar notificacion en DB
    await saveNotification(supabase, notification);

    // Construir y enviar email
    const { subject, html } = buildEmailHtml(notification);
    const emailSent = await sendEmail(ADMIN_EMAIL, subject, html);

    console.log(`Admin notification: ${notification.type} - Email sent: ${emailSent}`);

    return new Response(
      JSON.stringify({
        success: true,
        emailSent,
        type: notification.type,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error processing admin notification:', error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Error interno',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
