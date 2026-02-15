/**
 * Edge Function: create-entity-donation
 * Crea una donacion para una entidad del mapa
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

// Direccion BTC de escrow
const ESCROW_BTC_ADDRESS = 'bc1qjnva46wy92ldhsv4w0j26jmu8c5wm5cxvgdfd7';

interface DonationRequest {
  entityId: string;
  amount: number;
  currency: string;
  paymentMethod: 'stripe' | 'paypal' | 'btc';
  donorId?: string;
  donorName?: string;
  donorEmail?: string;
  donorMessage?: string;
}

/**
 * Obtener precio BTC actual
 */
async function getBtcPrice(): Promise<number> {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=eur');
    const data = await response.json();
    return data.bitcoin.eur;
  } catch {
    return 85000; // Fallback
  }
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const donation: DonationRequest = await req.json();

    // Validar
    if (!donation.entityId || !donation.amount || donation.amount <= 0) {
      return new Response(
        JSON.stringify({ error: 'entityId y amount son requeridos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Inicializar Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verificar que la entidad existe y esta activa
    const { data: entity, error: entityError } = await supabase
      .from('map_entities')
      .select('*')
      .eq('id', donation.entityId)
      .eq('status', 'active')
      .single();

    if (entityError || !entity) {
      return new Response(
        JSON.stringify({ error: 'Entidad no encontrada o inactiva' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calcular monto BTC si es necesario
    let btcAmount: number | null = null;
    if (donation.paymentMethod === 'btc') {
      const btcPrice = await getBtcPrice();
      btcAmount = donation.amount / btcPrice;
    }

    // Crear registro de donacion
    const { data: donationRecord, error: createError } = await supabase
      .from('entity_donations')
      .insert({
        entity_id: donation.entityId,
        donor_id: donation.donorId || null,
        donor_name: donation.donorName || 'Anonimo',
        donor_email: donation.donorEmail || null,
        donor_message: donation.donorMessage || null,
        amount: donation.amount,
        currency: donation.currency || 'EUR',
        btc_amount: btcAmount,
        payment_method: donation.paymentMethod,
        escrow_address: donation.paymentMethod === 'btc' ? ESCROW_BTC_ADDRESS : null,
        status: 'pending',
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating donation:', createError);
      return new Response(
        JSON.stringify({ error: 'Error creando donacion' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let responseData: Record<string, unknown> = {
      donationId: donationRecord.id,
      entityName: entity.name,
      amount: donation.amount,
      currency: donation.currency,
    };

    // Procesar segun metodo de pago
    switch (donation.paymentMethod) {
      case 'stripe':
        // Crear sesion de checkout de Stripe
        const session = await stripe.checkout.sessions.create({
          mode: 'payment',
          payment_method_types: ['card'],
          line_items: [{
            price_data: {
              currency: 'eur',
              product_data: {
                name: `Donacion a ${entity.name}`,
                description: `Apoyo a ${entity.category}: ${entity.name}`,
                images: ['https://gailu.net/coleccion/assets/icons/icon-512.png'],
              },
              unit_amount: Math.round(donation.amount * 100), // En centimos
            },
            quantity: 1,
          }],
          metadata: {
            type: 'entity_donation',
            donationId: donationRecord.id,
            entityId: donation.entityId,
            entityName: entity.name,
          },
          success_url: `https://gailu.net/coleccion/?donation=success&id=${donationRecord.id}`,
          cancel_url: `https://gailu.net/coleccion/?donation=cancelled`,
        });

        responseData.checkoutUrl = session.url;
        responseData.sessionId = session.id;
        break;

      case 'paypal':
        // Para PayPal, devolver URL con monto y nota
        const paypalNote = encodeURIComponent(`Donacion a ${entity.name} - ID: ${donationRecord.id}`);
        responseData.paypalUrl = `https://www.paypal.com/paypalme/codigodespierto/${donation.amount}EUR?note=${paypalNote}`;
        break;

      case 'btc':
        responseData.btcAmount = btcAmount?.toFixed(8);
        responseData.btcAddress = ESCROW_BTC_ADDRESS;
        responseData.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24h
        break;
    }

    console.log(`Donation created: ${donationRecord.id} for entity ${entity.name}`);

    return new Response(
      JSON.stringify(responseData),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in create-entity-donation:', error);

    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Error interno' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
