/**
 * Edge Function: process-donation-payout
 * Procesa el pago automatico cuando una entidad reclama fondos
 *
 * Para Stripe: Crea un payout o transfer
 * Para PayPal: Notifica al admin para envio manual (o usar PayPal Payouts API)
 * Para BTC: Notifica al admin con la direccion de destino
 *
 * @version 1.0.0
 * @created 2025-01-15
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import Stripe from 'https://esm.sh/stripe@13.10.0?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const ADMIN_EMAIL = Deno.env.get('ADMIN_EMAIL') || 'irurag@gmail.com';
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || '';

interface PayoutRequest {
  donationId: string;
  entityUserId: string;
  releaseAddress: string; // BTC address o email PayPal
}

/**
 * Enviar email al admin
 */
async function sendAdminEmail(subject: string, html: string): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.log('RESEND not configured, skipping email. Subject:', subject);
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
        to: [ADMIN_EMAIL],
        subject,
        html,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { donationId, entityUserId, releaseAddress }: PayoutRequest = await req.json();

    if (!donationId) {
      return new Response(
        JSON.stringify({ error: 'donationId requerido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Inicializar Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Obtener donacion
    const { data: donation, error: donationError } = await supabase
      .from('entity_donations')
      .select(`
        *,
        entity:map_entities(*)
      `)
      .eq('id', donationId)
      .single();

    if (donationError || !donation) {
      return new Response(
        JSON.stringify({ error: 'Donacion no encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const entity = donation.entity;
    let payoutResult: Record<string, unknown> = {};

    switch (donation.payment_method) {
      case 'stripe':
        // Para Stripe, podriamos usar Stripe Connect para enviar a la cuenta de la entidad
        // Por ahora, notificamos al admin para payout manual desde el dashboard
        payoutResult = {
          method: 'stripe',
          status: 'pending_manual',
          message: 'Payout pendiente desde Stripe Dashboard',
          amount: donation.amount,
          currency: donation.currency,
        };

        await sendAdminEmail(
          `[PAYOUT] Stripe - ${entity.name} - ${donation.amount}€`,
          `
          <div style="font-family: Arial, sans-serif; max-width: 600px;">
            <h2>💳 Payout de Stripe Pendiente</h2>
            <p>La entidad <strong>${entity.name}</strong> ha reclamado una donacion.</p>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px; border: 1px solid #ddd;">Monto:</td><td style="padding: 8px; border: 1px solid #ddd;"><strong>${donation.amount}€</strong></td></tr>
              <tr><td style="padding: 8px; border: 1px solid #ddd;">Metodo original:</td><td style="padding: 8px; border: 1px solid #ddd;">Stripe (tarjeta)</td></tr>
              <tr><td style="padding: 8px; border: 1px solid #ddd;">Entidad:</td><td style="padding: 8px; border: 1px solid #ddd;">${entity.name}</td></tr>
              <tr><td style="padding: 8px; border: 1px solid #ddd;">Email entidad:</td><td style="padding: 8px; border: 1px solid #ddd;">${entity.contact_email || 'N/A'}</td></tr>
              <tr><td style="padding: 8px; border: 1px solid #ddd;">PayPal entidad:</td><td style="padding: 8px; border: 1px solid #ddd;">${entity.paypal_email || 'N/A'}</td></tr>
            </table>
            <p style="margin-top: 20px;">Procesa el payout desde el dashboard de Stripe o envia via PayPal.</p>
          </div>
          `
        );
        break;

      case 'paypal':
        // Notificar para envio via PayPal
        payoutResult = {
          method: 'paypal',
          status: 'pending_manual',
          message: 'Enviar via PayPal al email de la entidad',
          destinationEmail: entity.paypal_email || releaseAddress,
          amount: donation.amount,
        };

        await sendAdminEmail(
          `[PAYOUT] PayPal - ${entity.name} - ${donation.amount}€`,
          `
          <div style="font-family: Arial, sans-serif; max-width: 600px;">
            <h2>🅿️ Payout de PayPal Pendiente</h2>
            <p>La entidad <strong>${entity.name}</strong> ha reclamado una donacion.</p>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px; border: 1px solid #ddd;">Monto:</td><td style="padding: 8px; border: 1px solid #ddd;"><strong>${donation.amount}€</strong></td></tr>
              <tr><td style="padding: 8px; border: 1px solid #ddd;">Enviar a PayPal:</td><td style="padding: 8px; border: 1px solid #ddd;"><strong>${entity.paypal_email || releaseAddress}</strong></td></tr>
              <tr><td style="padding: 8px; border: 1px solid #ddd;">Entidad:</td><td style="padding: 8px; border: 1px solid #ddd;">${entity.name}</td></tr>
            </table>
            <p style="margin-top: 20px;">
              <a href="https://www.paypal.com/myaccount/transfer/homepage/pay" style="background: #0070ba; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                Abrir PayPal para enviar
              </a>
            </p>
          </div>
          `
        );
        break;

      case 'btc':
        // Notificar para envio de BTC
        const btcDestination = entity.btc_address || releaseAddress;
        payoutResult = {
          method: 'btc',
          status: 'pending_manual',
          message: 'Enviar BTC a la direccion de la entidad',
          destinationAddress: btcDestination,
          btcAmount: donation.btc_amount,
          eurAmount: donation.amount,
        };

        await sendAdminEmail(
          `[PAYOUT] Bitcoin - ${entity.name} - ${donation.btc_amount} BTC`,
          `
          <div style="font-family: Arial, sans-serif; max-width: 600px;">
            <h2>₿ Payout de Bitcoin Pendiente</h2>
            <p>La entidad <strong>${entity.name}</strong> ha reclamado una donacion.</p>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px; border: 1px solid #ddd;">Monto BTC:</td><td style="padding: 8px; border: 1px solid #ddd;"><strong>${donation.btc_amount} BTC</strong></td></tr>
              <tr><td style="padding: 8px; border: 1px solid #ddd;">Equivalente EUR:</td><td style="padding: 8px; border: 1px solid #ddd;">${donation.amount}€</td></tr>
              <tr><td style="padding: 8px; border: 1px solid #ddd;">Enviar a:</td><td style="padding: 8px; border: 1px solid #ddd; font-family: monospace; word-break: break-all;">${btcDestination}</td></tr>
              <tr><td style="padding: 8px; border: 1px solid #ddd;">Entidad:</td><td style="padding: 8px; border: 1px solid #ddd;">${entity.name}</td></tr>
            </table>
            <p style="margin-top: 20px;">Envia el BTC desde tu wallet a la direccion indicada.</p>
          </div>
          `
        );
        break;
    }

    // Actualizar donacion con info del payout
    await supabase
      .from('entity_donations')
      .update({
        metadata: {
          ...donation.metadata,
          payout: payoutResult,
          payout_requested_at: new Date().toISOString(),
        },
      })
      .eq('id', donationId);

    console.log(`Payout processed for donation ${donationId}: ${donation.payment_method}`);

    return new Response(
      JSON.stringify({
        success: true,
        ...payoutResult,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing payout:', error);

    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Error interno' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
