/**
 * Edge Function: create-token-checkout
 * Crea una sesión de checkout de Stripe para compra de tokens
 *
 * @version 1.0.0
 * @created 2025-01-15
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@13.10.0?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

// Paquetes de tokens (sincronizar con plans-config.js)
const TOKEN_PACKAGES: Record<string, {
  name: string;
  tokens: number;
  price: number;
  stripePriceId: string;
}> = {
  basico: {
    name: 'Básico - 50K tokens',
    tokens: 50000,
    price: 299, // centavos EUR
    stripePriceId: 'price_tokens_basico',
  },
  estandar: {
    name: 'Estándar - 150K tokens',
    tokens: 150000,
    price: 799,
    stripePriceId: 'price_tokens_estandar',
  },
  premium_pack: {
    name: 'Premium - 500K tokens',
    tokens: 500000,
    price: 1999,
    stripePriceId: 'price_tokens_premium',
  },
  pro_pack: {
    name: 'Pro - 1.5M tokens',
    tokens: 1500000,
    price: 4999,
    stripePriceId: 'price_tokens_pro',
  },
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { packageId, userId, successUrl, cancelUrl } = await req.json();

    // Validar paquete
    const pkg = TOKEN_PACKAGES[packageId];
    if (!pkg) {
      return new Response(
        JSON.stringify({ error: 'Paquete no válido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Usuario no especificado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Crear sesión de checkout de Stripe
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: pkg.name,
              description: `${pkg.tokens.toLocaleString()} tokens para Colección Nuevo Ser`,
              images: ['https://gailu.net/coleccion/assets/icons/icon-512.png'],
            },
            unit_amount: pkg.price,
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId,
        packageId,
        tokens: pkg.tokens.toString(),
        type: 'token_purchase',
      },
      success_url: successUrl || 'https://gailu.net/coleccion/?tokens_purchased=success',
      cancel_url: cancelUrl || 'https://gailu.net/coleccion/?tokens_purchased=cancelled',
    });

    return new Response(
      JSON.stringify({
        checkoutUrl: session.url,
        sessionId: session.id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error creating token checkout:', error);

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
