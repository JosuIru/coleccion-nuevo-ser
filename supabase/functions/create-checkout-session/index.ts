import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@13.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ═══════════════════════════════════════════════════════════════════════════════
// EDGE FUNCTION: Crear sesión de checkout de Stripe
// Llamada desde el frontend para iniciar el flujo de pago
// ═══════════════════════════════════════════════════════════════════════════════

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
});

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Configuración de planes (debe coincidir con la del frontend)
const PLANS = {
  premium: {
    name: "Premium",
    priceId: Deno.env.get("STRIPE_PRICE_ID_PREMIUM")!,
    credits: 500,
    interval: "month",
  },
  pro: {
    name: "Pro",
    priceId: Deno.env.get("STRIPE_PRICE_ID_PRO")!,
    credits: 2000,
    interval: "month",
  },
};

serve(async (req) => {
  // Solo POST
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    // Obtener datos del request
    const { priceId, tier, userId } = await req.json();

    // Validar tier
    if (!tier || !PLANS[tier as keyof typeof PLANS]) {
      return new Response(
        JSON.stringify({ error: "Plan inválido" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Obtener perfil del usuario
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (profileError) {
      return new Response(
        JSON.stringify({ error: "Usuario no encontrado" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Crear o recuperar customer de Stripe
    let customerId = profile.stripe_customer_id;

    if (!customerId) {
      const { data: userData, error: userError } = await supabase.auth
        .admin
        .getUserById(userId);

      if (userError) {
        throw userError;
      }

      const customer = await stripe.customers.create({
        email: userData.user?.email || undefined,
        metadata: {
          supabase_user_id: userId,
        },
      });

      customerId = customer.id;

      // Guardar customer ID en el perfil
      await supabase
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", userId);
    }

    // Crear sesión de checkout
    // 🔧 v2.9.276: Habilitar Google Pay, Apple Pay y Link
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ['card', 'link'],
      // Google Pay y Apple Pay se muestran automáticamente cuando están habilitados
      // en el Dashboard de Stripe y el usuario tiene un wallet configurado
      payment_method_options: {
        card: {
          request_three_d_secure: 'automatic',
        },
      },
      line_items: [
        {
          price: priceId || PLANS[tier as keyof typeof PLANS].priceId,
          quantity: 1,
        },
      ],
      success_url: `${req.headers.get("origin")}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/pricing`,
      allow_promotion_codes: true, // Permitir códigos de descuento
      metadata: {
        supabase_user_id: userId,
        tier: tier,
      },
    });

    console.log(`✅ Sesión de checkout creada: ${session.id} para usuario ${userId}`);

    return new Response(
      JSON.stringify({
        sessionId: session.id,
        clientSecret: session.client_secret,
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("❌ Error creating checkout session:", error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Error desconocido",
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
