import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@13.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ═══════════════════════════════════════════════════════════════════════════════
// EDGE FUNCTION: Webhook de Stripe
// Procesa eventos de suscripción, pagos, etc.
// ═══════════════════════════════════════════════════════════════════════════════

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
});

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Planes y su configuración de créditos
const PLAN_CONFIG: Record<string, any> = {
  premium: {
    tier: "premium",
    credits: 500,
    features: {
      ai_chat: true,
      ai_tutor: true,
      ai_game_master: false,
      advanced_analytics: true,
      export_pdf: true,
      cloud_sync: true,
      custom_themes: false,
      priority_support: false,
    },
  },
  pro: {
    tier: "pro",
    credits: 2000,
    features: {
      ai_chat: true,
      ai_tutor: true,
      ai_game_master: true,
      advanced_analytics: true,
      export_pdf: true,
      cloud_sync: true,
      custom_themes: true,
      priority_support: true,
    },
  },
};

serve(async (req) => {
  // Solo POST
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const signature = req.headers.get("stripe-signature");
  const body = await req.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature!,
      Deno.env.get("STRIPE_WEBHOOK_SECRET")!
    );
  } catch (err) {
    console.error("❌ Webhook signature verification failed:", err);
    return new Response(
      JSON.stringify({ error: "Invalid signature" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  console.log(`📨 Webhook recibido: ${event.type}`);

  try {
    // Manejar diferentes tipos de eventos
    switch (event.type) {
      // ════════════════════════════════════════════════════════════════════
      // Checkout completado - Usuario compró suscripción
      // ════════════════════════════════════════════════════════════════════
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.supabase_user_id;
        const tier = session.metadata?.tier || "premium";

        if (!userId) {
          console.warn("⚠️ checkout.session.completed sin user ID");
          break;
        }

        const planConfig = PLAN_CONFIG[tier];
        if (!planConfig) {
          console.warn(`⚠️ Plan desconocido: ${tier}`);
          break;
        }

        console.log(`💳 Checkout completado para usuario ${userId}, tier: ${tier}`);

        // Actualizar perfil del usuario
        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            subscription_tier: planConfig.tier,
            subscription_status: "active",
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            subscription_start: new Date().toISOString(),
            subscription_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            ai_credits_remaining: planConfig.credits,
            ai_credits_total: planConfig.credits,
            ai_credits_reset_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            features: planConfig.features,
          })
          .eq("id", userId);

        if (updateError) {
          console.error("❌ Error actualizando perfil:", updateError);
          break;
        }

        // Registrar evento de suscripción
        await supabase.from("subscription_events").insert({
          user_id: userId,
          event_type: "created",
          from_tier: "free",
          to_tier: planConfig.tier,
          description: `Suscripción a ${planConfig.tier}`,
        });

        console.log(`✅ Usuario ${userId} actualizado a ${planConfig.tier}`);
        break;
      }

      // ════════════════════════════════════════════════════════════════════
      // Suscripción actualizada
      // ════════════════════════════════════════════════════════════════════
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;

        console.log(`🔄 Suscripción actualizada: ${subscription.id}`);

        // Obtener información de la suscripción
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("stripe_subscription_id", subscription.id)
          .single();

        if (profileError) {
          console.warn("⚠️ Perfil no encontrado para suscripción");
          break;
        }

        // Actualizar estado
        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            subscription_status: subscription.status as string,
            subscription_end: new Date(subscription.current_period_end * 1000).toISOString(),
          })
          .eq("id", profile.id);

        if (updateError) {
          console.error("❌ Error actualizando suscripción:", updateError);
          break;
        }

        console.log(`✅ Suscripción ${subscription.id} actualizada a ${subscription.status}`);
        break;
      }

      // ════════════════════════════════════════════════════════════════════
      // Suscripción cancelada
      // ════════════════════════════════════════════════════════════════════
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;

        console.log(`❌ Suscripción cancelada: ${subscription.id}`);

        // Obtener perfil del usuario
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("stripe_subscription_id", subscription.id)
          .single();

        if (profileError) {
          console.warn("⚠️ Perfil no encontrado para suscripción cancelada");
          break;
        }

        // Downgrade a free
        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            subscription_tier: "free",
            subscription_status: "canceled",
            ai_credits_remaining: 10,
            ai_credits_total: 10,
            ai_credits_reset_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            features: {
              ai_chat: false,
              ai_tutor: false,
              ai_game_master: false,
              advanced_analytics: false,
              export_pdf: false,
              cloud_sync: true,
              custom_themes: false,
              priority_support: false,
            },
          })
          .eq("id", profile.id);

        if (updateError) {
          console.error("❌ Error downgrading a free:", updateError);
          break;
        }

        // Registrar evento
        await supabase.from("subscription_events").insert({
          user_id: profile.id,
          event_type: "canceled",
          from_tier: profile.subscription_tier,
          to_tier: "free",
          description: "Suscripción cancelada",
        });

        console.log(`✅ Usuario ${profile.id} downgraded a free`);
        break;
      }

      // ════════════════════════════════════════════════════════════════════
      // Pago falló
      // ════════════════════════════════════════════════════════════════════
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;

        console.log(`⚠️ Pago fallido para: ${invoice.customer}`);

        // Obtener perfil
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("stripe_customer_id", invoice.customer)
          .single();

        if (profile) {
          // Cambiar estado a past_due
          await supabase
            .from("profiles")
            .update({ subscription_status: "past_due" })
            .eq("id", profile.id);

          // Registrar evento
          await supabase.from("subscription_events").insert({
            user_id: profile.id,
            event_type: "payment_failed",
            from_tier: profile.subscription_tier,
            to_tier: profile.subscription_tier,
            description: "Fallo en el pago automático",
          });

          console.log(`⚠️ Suscripción de ${profile.id} marcada como past_due`);
        }
        break;
      }

      // ════════════════════════════════════════════════════════════════════
      // Pago exitoso
      // ════════════════════════════════════════════════════════════════════
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;

        console.log(`✅ Pago exitoso: ${invoice.id}`);

        // Obtener perfil y actualizar estado
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("stripe_customer_id", invoice.customer)
          .single();

        if (profile && profile.subscription_status === "past_due") {
          await supabase
            .from("profiles")
            .update({ subscription_status: "active" })
            .eq("id", profile.id);

          console.log(`✅ Suscripción de ${profile.id} restaurada a activa`);
        }

        // Registrar transacción
        await supabase.from("transactions").insert({
          user_id: profile?.id,
          stripe_payment_id: invoice.id,
          stripe_invoice_id: invoice.id,
          amount: (invoice.total || 0) / 100, // Stripe usa centavos
          currency: invoice.currency?.toUpperCase() || "EUR",
          status: "completed",
          description: `Pago de suscripción - ${profile?.subscription_tier || "unknown"}`,
        });

        break;
      }

      default:
        console.log(`📌 Evento no manejado: ${event.type}`);
    }

    return new Response(
      JSON.stringify({ received: true }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("❌ Error procesando webhook:", error);

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
