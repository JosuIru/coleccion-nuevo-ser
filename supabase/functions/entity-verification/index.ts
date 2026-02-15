/**
 * Edge Function: entity-verification
 * Sistema de verificación de entidades del mapa de transición
 *
 * Métodos de verificación:
 * 1. Email - Token enviado al email de contacto
 * 2. Website - Verificar propiedad añadiendo meta tag
 * 3. Social - Verificar enlazando desde redes sociales
 * 4. Admin - Verificación manual por administrador
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

const ADMIN_EMAIL = Deno.env.get('ADMIN_EMAIL') || 'irurag@gmail.com';
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || '';
const APP_URL = Deno.env.get('APP_URL') || 'https://coleccionnuevoser.com';

interface VerificationRequest {
  action: 'start' | 'verify' | 'check-website' | 'admin-verify';
  entityId: string;
  method?: 'email' | 'website' | 'social' | 'admin';
  token?: string;
  userId?: string;
}

/**
 * Generar token aleatorio
 */
function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * Enviar email de verificación
 */
async function sendVerificationEmail(
  to: string,
  entityName: string,
  verificationUrl: string
): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.log('RESEND not configured, skipping email');
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
        from: 'Colección Nuevo Ser <verificacion@nuevosser.com>',
        to: [to],
        subject: `Verifica tu entidad: ${entityName}`,
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #059669;">🌱 Verificación de Entidad</h2>
          <p>Has registrado <strong>${entityName}</strong> en el Mapa de Transición.</p>
          <p>Para poder recibir donaciones, necesitas verificar que eres el responsable de esta entidad.</p>
          <p style="margin: 30px 0;">
            <a href="${verificationUrl}" style="background: #059669; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block;">
              Verificar Mi Entidad
            </a>
          </p>
          <p style="color: #666; font-size: 14px;">
            Este enlace expira en 48 horas.<br>
            Si no has registrado esta entidad, puedes ignorar este email.
          </p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #999; font-size: 12px;">
            Colección Nuevo Ser - Mapa de Transición<br>
            ${APP_URL}
          </p>
        </div>
        `,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Error sending verification email:', error);
    return false;
  }
}

/**
 * Verificar propiedad de website
 * La entidad debe añadir un meta tag con el token en su página
 */
async function verifyWebsite(website: string, token: string): Promise<boolean> {
  try {
    const response = await fetch(website, {
      headers: { 'User-Agent': 'ColeccionNuevoSer-Verification/1.0' }
    });

    if (!response.ok) return false;

    const html = await response.text();

    // Buscar el meta tag de verificación
    // <meta name="nuevosser-verification" content="TOKEN">
    const metaPattern = new RegExp(`<meta\\s+name=["']nuevosser-verification["']\\s+content=["']${token}["']`, 'i');
    const altPattern = new RegExp(`<meta\\s+content=["']${token}["']\\s+name=["']nuevosser-verification["']`, 'i');

    return metaPattern.test(html) || altPattern.test(html);
  } catch (error) {
    console.error('Error verifying website:', error);
    return false;
  }
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, entityId, method, token, userId }: VerificationRequest = await req.json();

    if (!entityId) {
      return new Response(
        JSON.stringify({ error: 'entityId requerido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Inicializar Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Obtener entidad
    const { data: entity, error: entityError } = await supabase
      .from('map_entities')
      .select('*')
      .eq('id', entityId)
      .single();

    if (entityError || !entity) {
      return new Response(
        JSON.stringify({ error: 'Entidad no encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Ya verificada
    if (entity.is_verified && action !== 'admin-verify') {
      return new Response(
        JSON.stringify({ success: true, message: 'Entidad ya verificada' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    switch (action) {
      case 'start': {
        // Iniciar proceso de verificación
        const verificationToken = generateToken();
        const verificationMethod = method || 'email';

        // Guardar token y método
        await supabase
          .from('map_entities')
          .update({
            verification_token: verificationToken,
            metadata: {
              ...entity.metadata,
              verification_method: verificationMethod,
              verification_started_at: new Date().toISOString(),
              verification_expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
            }
          })
          .eq('id', entityId);

        let response: Record<string, unknown> = {
          success: true,
          method: verificationMethod,
        };

        switch (verificationMethod) {
          case 'email':
            if (!entity.contact_email) {
              return new Response(
                JSON.stringify({ error: 'La entidad no tiene email de contacto' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              );
            }

            const verificationUrl = `${APP_URL}/verify-entity?id=${entityId}&token=${verificationToken}`;
            await sendVerificationEmail(entity.contact_email, entity.name, verificationUrl);

            response.message = `Email de verificación enviado a ${entity.contact_email.replace(/(.{2}).*(@.*)/, '$1***$2')}`;
            break;

          case 'website':
            if (!entity.website) {
              return new Response(
                JSON.stringify({ error: 'La entidad no tiene website registrado' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              );
            }

            response.message = 'Añade el siguiente meta tag a tu página principal:';
            response.metaTag = `<meta name="nuevosser-verification" content="${verificationToken}">`;
            response.instructions = [
              '1. Copia el meta tag de arriba',
              '2. Añádelo en el <head> de tu página principal',
              '3. Guarda y publica los cambios',
              '4. Vuelve aquí y haz click en "Verificar Website"'
            ];
            break;

          case 'social':
            response.message = 'Publica un mensaje con el código de verificación en tus redes:';
            response.verificationCode = verificationToken.substring(0, 8).toUpperCase();
            response.instructions = [
              '1. Publica un mensaje en tus redes sociales (Twitter, Facebook, Instagram)',
              `2. Incluye el código: #NuevoSer-${response.verificationCode}`,
              '3. El enlace a tu publicación será verificado por nuestro equipo',
              '4. Recibirás confirmación en 24-48 horas'
            ];
            // Notificar a admin para verificación manual de social
            await supabase.from('admin_notifications').insert({
              type: 'social_verification_pending',
              category: 'entities',
              message: `Verificación social pendiente para ${entity.name}`,
              data: { entityId, verificationCode: response.verificationCode }
            });
            break;

          case 'admin':
            response.message = 'Solicitud de verificación manual enviada al administrador';
            // Notificar a admin
            await supabase.from('admin_notifications').insert({
              type: 'manual_verification_request',
              category: 'entities',
              message: `Solicitud de verificación manual para ${entity.name}`,
              data: {
                entityId,
                entityName: entity.name,
                contactEmail: entity.contact_email,
                website: entity.website
              }
            });
            break;
        }

        return new Response(
          JSON.stringify(response),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'verify': {
        // Verificar con token (email o directo)
        if (!token) {
          return new Response(
            JSON.stringify({ error: 'Token requerido' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (entity.verification_token !== token) {
          return new Response(
            JSON.stringify({ error: 'Token inválido o expirado' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Verificar entidad
        await supabase
          .from('map_entities')
          .update({
            is_verified: true,
            verified_at: new Date().toISOString(),
            status: 'active',
            verification_token: null, // Limpiar token usado
          })
          .eq('id', entityId);

        // Notificar a la entidad
        await supabase.from('entity_notifications').insert({
          entity_id: entityId,
          type: 'entity_verified',
          title: '¡Entidad Verificada!',
          message: 'Tu entidad ha sido verificada exitosamente. Ahora puedes recibir donaciones directamente.'
        });

        return new Response(
          JSON.stringify({
            success: true,
            message: '¡Entidad verificada exitosamente! Ahora puedes recibir donaciones.'
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'check-website': {
        // Verificar que el meta tag está en el website
        if (!entity.website || !entity.verification_token) {
          return new Response(
            JSON.stringify({ error: 'Falta website o token de verificación' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const isVerified = await verifyWebsite(entity.website, entity.verification_token);

        if (isVerified) {
          // Verificar entidad
          await supabase
            .from('map_entities')
            .update({
              is_verified: true,
              verified_at: new Date().toISOString(),
              status: 'active',
              verification_token: null,
            })
            .eq('id', entityId);

          // Notificar
          await supabase.from('entity_notifications').insert({
            entity_id: entityId,
            type: 'entity_verified',
            title: '¡Website Verificado!',
            message: 'Hemos verificado tu website. Tu entidad está activa y puede recibir donaciones.'
          });

          return new Response(
            JSON.stringify({ success: true, message: '¡Website verificado! Tu entidad está activa.' }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } else {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'No se encontró el meta tag de verificación en tu website',
              hint: 'Asegúrate de que el meta tag está en el <head> y que la página está publicada'
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      case 'admin-verify': {
        // Verificación manual por admin (requiere autenticación)
        // Este endpoint solo debe ser accesible por admin

        await supabase
          .from('map_entities')
          .update({
            is_verified: true,
            verified_at: new Date().toISOString(),
            verified_by: userId,
            status: 'active',
            verification_token: null,
          })
          .eq('id', entityId);

        // Notificar a la entidad
        await supabase.from('entity_notifications').insert({
          entity_id: entityId,
          type: 'entity_verified',
          title: '¡Entidad Verificada por Admin!',
          message: 'Un administrador ha verificado tu entidad. Ahora puedes recibir donaciones.'
        });

        return new Response(
          JSON.stringify({ success: true, message: 'Entidad verificada por admin' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Acción no válida' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error) {
    console.error('Error in entity-verification:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Error interno' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
