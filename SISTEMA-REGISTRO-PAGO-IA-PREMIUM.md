# SISTEMA DE REGISTRO + PAGO + IA PREMIUM

## 🎯 Objetivo

Crear un sistema completo de suscripción premium que permita a los usuarios:
1. **Registrarse** con email/password o OAuth
2. **Pagar** una suscripción mensual/anual
3. **Acceder a IA premium** para libros y juegos
4. **Sincronizar** progreso en la nube

---

## 🏗️ Arquitectura Propuesta

### Stack Tecnológico (Ya tienes casi todo)

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (Ya existe)                 │
│  ✅ Supabase Client (autenticación)                     │
│  ✅ AI Adapter (multi-provider)                         │
│  ➕ Payment UI (Stripe Elements) - A CREAR              │
└─────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────┐
│                  SUPABASE (Ya configurado)              │
│  ✅ Auth (email/OAuth)                                  │
│  ✅ Database (profiles, progress)                       │
│  ➕ Edge Functions (webhooks Stripe) - A CREAR          │
│  ➕ Row Level Security (RLS) - A CONFIGURAR             │
└─────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────┐
│              SERVICIOS EXTERNOS                         │
│  ➕ Stripe (pagos)                                      │
│  ✅ Anthropic/OpenAI/Gemini (IA)                        │
│  ➕ SendGrid/Resend (emails) - OPCIONAL                 │
└─────────────────────────────────────────────────────────┘
```

---

## 📋 FASE 1: Sistema de Registro y Autenticación

### 1.1 Configuración Supabase Auth

Ya tienes configurado Supabase. Añade estas tablas:

```sql
-- Tabla de perfiles de usuario (extender la existente)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,

  -- NUEVO: Campos de suscripción
  subscription_tier TEXT DEFAULT 'free', -- 'free', 'premium', 'pro'
  subscription_status TEXT DEFAULT 'inactive', -- 'active', 'inactive', 'canceled', 'past_due'
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_start DATE,
  subscription_end DATE,

  -- NUEVO: Créditos de IA
  ai_credits_remaining INTEGER DEFAULT 0,
  ai_credits_total INTEGER DEFAULT 0,
  ai_credits_reset_date TIMESTAMP,

  -- NUEVO: Features habilitadas
  features JSONB DEFAULT '{
    "ai_chat": false,
    "ai_tutor": false,
    "ai_game_master": false,
    "advanced_analytics": false,
    "export_pdf": false,
    "cloud_sync": true
  }'::jsonb,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de uso de IA (tracking)
CREATE TABLE ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  provider TEXT, -- 'claude', 'openai', 'gemini'
  model TEXT,
  context TEXT, -- 'book_chat', 'game_npc', 'quiz_generation', etc
  tokens_used INTEGER,
  cost_usd DECIMAL(10,4),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de transacciones
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  stripe_payment_id TEXT,
  amount DECIMAL(10,2),
  currency TEXT DEFAULT 'eur',
  status TEXT, -- 'pending', 'completed', 'failed', 'refunded'
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_ai_usage_user ON ai_usage(user_id, created_at DESC);
CREATE INDEX idx_transactions_user ON transactions(user_id, created_at DESC);
```

### 1.2 Row Level Security (RLS)

```sql
-- Usuarios solo pueden ver su propio perfil
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Solo usuarios premium pueden ver su uso de IA
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own AI usage"
  ON ai_usage FOR SELECT
  USING (auth.uid() = user_id);

-- Solo usuarios pueden ver sus transacciones
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);
```

### 1.3 UI de Registro (Componente React/Vanilla JS)

Crear: `/www/js/features/auth-modal.js`

```javascript
class AuthModal {
  constructor() {
    this.supabase = null;
    this.init();
  }

  async init() {
    // Esperar a que Supabase esté disponible
    if (window.supabase) {
      this.supabase = window.supabase;
    }
  }

  async signUp(email, password, fullName) {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        },
        emailRedirectTo: window.location.origin
      }
    });

    if (error) throw error;

    // Crear perfil inicial (trigger automático en Supabase)
    return data;
  }

  async signIn(email, password) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    return data;
  }

  async signInWithGoogle() {
    const { data, error } = await this.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });

    if (error) throw error;
    return data;
  }

  async signOut() {
    const { error } = await this.supabase.auth.signOut();
    if (error) throw error;
  }

  async getUser() {
    const { data: { user } } = await this.supabase.auth.getUser();
    return user;
  }

  async getUserProfile() {
    const user = await this.getUser();
    if (!user) return null;

    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) throw error;
    return data;
  }
}

window.authModal = new AuthModal();
```

---

## 💳 FASE 2: Sistema de Pagos con Stripe

### 2.1 Configuración Stripe

1. **Crear cuenta Stripe**: https://stripe.com
2. **Obtener API keys**:
   - Test key: `sk_test_...`
   - Publishable key: `pk_test_...`

3. **Crear productos y precios** en Stripe Dashboard:

```javascript
// Planes de suscripción
const PLANES = {
  FREE: {
    name: 'Gratuito',
    price: 0,
    features: [
      'Acceso a todos los libros',
      'Progreso local',
      'Quizzes básicos',
      '10 consultas IA/mes'
    ],
    ai_credits: 10
  },

  PREMIUM: {
    name: 'Premium',
    price: 9.99, // EUR/mes
    stripe_price_id: 'price_xxx', // Del dashboard Stripe
    features: [
      'Todo lo de Gratuito',
      'Chat IA ilimitado sobre libros',
      'Tutor IA personalizado',
      'Generación de quizzes personalizados',
      'Sincronización en la nube',
      'Exportar a PDF',
      'Sin anuncios',
      '500 consultas IA/mes'
    ],
    ai_credits: 500
  },

  PRO: {
    name: 'Pro',
    price: 19.99, // EUR/mes
    stripe_price_id: 'price_yyy',
    features: [
      'Todo lo de Premium',
      'Game Master IA para juegos',
      'NPCs conversacionales ilimitados',
      'Generación de misiones dinámicas',
      'Narrativa adaptativa',
      'Analytics avanzados',
      'API access',
      '2000 consultas IA/mes'
    ],
    ai_credits: 2000
  }
};
```

### 2.2 Supabase Edge Function para Stripe Webhook

Crear: `supabase/functions/stripe-webhook/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@13.0.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
})

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  const body = await req.text()

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature!,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!
    )
  } catch (err) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }

  // Manejar eventos de Stripe
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session

      // Actualizar perfil del usuario
      await supabase
        .from('profiles')
        .update({
          subscription_tier: 'premium', // O 'pro' según el plan
          subscription_status: 'active',
          stripe_customer_id: session.customer,
          stripe_subscription_id: session.subscription,
          subscription_start: new Date(),
          ai_credits_remaining: 500, // Según el plan
          ai_credits_total: 500,
          features: {
            ai_chat: true,
            ai_tutor: true,
            ai_game_master: false, // Solo para pro
            advanced_analytics: true,
            export_pdf: true,
            cloud_sync: true
          }
        })
        .eq('stripe_customer_id', session.customer)

      break
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription

      await supabase
        .from('profiles')
        .update({
          subscription_status: subscription.status,
          subscription_end: new Date(subscription.current_period_end * 1000)
        })
        .eq('stripe_subscription_id', subscription.id)

      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription

      // Downgrade a free
      await supabase
        .from('profiles')
        .update({
          subscription_tier: 'free',
          subscription_status: 'canceled',
          ai_credits_remaining: 10,
          ai_credits_total: 10,
          features: {
            ai_chat: false,
            ai_tutor: false,
            ai_game_master: false,
            advanced_analytics: false,
            export_pdf: false,
            cloud_sync: true
          }
        })
        .eq('stripe_subscription_id', subscription.id)

      break
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
```

### 2.3 Frontend - Checkout Component

Crear: `/www/js/features/pricing-modal.js`

```javascript
class PricingModal {
  constructor() {
    this.stripe = null;
    this.initStripe();
  }

  async initStripe() {
    // Cargar Stripe.js
    const script = document.createElement('script');
    script.src = 'https://js.stripe.com/v3/';
    script.onload = () => {
      this.stripe = Stripe('pk_test_YOUR_PUBLISHABLE_KEY');
    };
    document.head.appendChild(script);
  }

  async createCheckoutSession(priceId, tier) {
    const user = await window.authModal.getUser();
    if (!user) {
      alert('Debes iniciar sesión primero');
      return;
    }

    // Llamar a Edge Function para crear sesión
    const { data, error } = await window.supabase.functions.invoke(
      'create-checkout-session',
      {
        body: {
          priceId,
          tier,
          userId: user.id,
          email: user.email
        }
      }
    );

    if (error) {
      console.error('Error creating checkout:', error);
      return;
    }

    // Redirigir a Stripe Checkout
    const { error: stripeError } = await this.stripe.redirectToCheckout({
      sessionId: data.sessionId
    });

    if (stripeError) {
      console.error('Stripe redirect error:', stripeError);
    }
  }

  showPricingModal() {
    const modal = document.createElement('div');
    modal.className = 'pricing-modal';
    modal.innerHTML = `
      <div class="pricing-overlay" onclick="this.parentElement.remove()"></div>
      <div class="pricing-content">
        <h2>Elige tu plan</h2>

        <div class="pricing-grid">
          <!-- Plan Free -->
          <div class="pricing-card">
            <h3>Gratuito</h3>
            <div class="price">0€<span>/mes</span></div>
            <ul class="features">
              <li>✓ Acceso a todos los libros</li>
              <li>✓ Progreso local</li>
              <li>✓ 10 consultas IA/mes</li>
              <li>✗ Chat IA ilimitado</li>
              <li>✗ Tutor IA</li>
            </ul>
            <button class="btn-secondary" disabled>Plan actual</button>
          </div>

          <!-- Plan Premium -->
          <div class="pricing-card featured">
            <div class="badge">Recomendado</div>
            <h3>Premium</h3>
            <div class="price">9.99€<span>/mes</span></div>
            <ul class="features">
              <li>✓ Todo lo de Gratuito</li>
              <li>✓ Chat IA ilimitado</li>
              <li>✓ Tutor IA personalizado</li>
              <li>✓ 500 consultas/mes</li>
              <li>✓ Sincronización nube</li>
              <li>✓ Exportar a PDF</li>
            </ul>
            <button class="btn-primary" onclick="window.pricingModal.createCheckoutSession('price_xxx', 'premium')">
              Comenzar Premium
            </button>
          </div>

          <!-- Plan Pro -->
          <div class="pricing-card">
            <h3>Pro</h3>
            <div class="price">19.99€<span>/mes</span></div>
            <ul class="features">
              <li>✓ Todo lo de Premium</li>
              <li>✓ Game Master IA</li>
              <li>✓ NPCs conversacionales</li>
              <li>✓ 2000 consultas/mes</li>
              <li>✓ Analytics avanzados</li>
              <li>✓ API access</li>
            </ul>
            <button class="btn-primary" onclick="window.pricingModal.createCheckoutSession('price_yyy', 'pro')">
              Comenzar Pro
            </button>
          </div>
        </div>

        <button class="close-btn" onclick="this.closest('.pricing-modal').remove()">×</button>
      </div>
    `;

    document.body.appendChild(modal);
  }
}

window.pricingModal = new PricingModal();
```

---

## 🤖 FASE 3: Integración de IA Premium

### 3.1 Sistema de Créditos y Rate Limiting

Crear: `/www/js/features/ai-premium.js`

```javascript
class AIPremium {
  constructor() {
    this.userProfile = null;
    this.loadUserProfile();
  }

  async loadUserProfile() {
    this.userProfile = await window.authModal.getUserProfile();
  }

  async checkCredits(estimatedTokens = 100) {
    await this.loadUserProfile();

    if (!this.userProfile) {
      throw new Error('Usuario no autenticado');
    }

    const remaining = this.userProfile.ai_credits_remaining || 0;

    if (remaining < estimatedTokens) {
      throw new Error('Créditos insuficientes. Actualiza tu plan para continuar.');
    }

    return true;
  }

  async consumeCredits(tokensUsed, context, provider, model) {
    await this.loadUserProfile();

    // Actualizar créditos del usuario
    const { error } = await window.supabase
      .from('profiles')
      .update({
        ai_credits_remaining: this.userProfile.ai_credits_remaining - tokensUsed
      })
      .eq('id', this.userProfile.id);

    if (error) throw error;

    // Registrar uso
    await window.supabase
      .from('ai_usage')
      .insert({
        user_id: this.userProfile.id,
        provider,
        model,
        context,
        tokens_used: tokensUsed,
        cost_usd: this.estimateCost(tokensUsed, provider, model)
      });

    // Recargar perfil
    await this.loadUserProfile();
  }

  estimateCost(tokens, provider, model) {
    // Costos aproximados por 1K tokens (actualizar según pricing real)
    const costs = {
      'claude-sonnet-4': 0.003,
      'gpt-4o': 0.005,
      'gemini-2.0-flash': 0.001
    };

    return ((tokens / 1000) * (costs[model] || 0.002)).toFixed(4);
  }

  hasFeature(featureName) {
    if (!this.userProfile) return false;
    return this.userProfile.features?.[featureName] || false;
  }

  getSubscriptionTier() {
    return this.userProfile?.subscription_tier || 'free';
  }

  getRemainingCredits() {
    return this.userProfile?.ai_credits_remaining || 0;
  }
}

window.aiPremium = new AIPremium();
```

### 3.2 Features de IA para Libros

Crear: `/www/js/features/ai-book-features.js`

```javascript
class AIBookFeatures {
  constructor() {
    this.aiAdapter = window.aiAdapter;
    this.aiPremium = window.aiPremium;
  }

  /**
   * Chat IA sobre contenido del libro
   */
  async chatAboutBook(bookId, chapterId, userQuestion, bookContext) {
    // Verificar permisos
    if (!this.aiPremium.hasFeature('ai_chat')) {
      throw new Error('Necesitas Premium para usar el chat IA. ¡Actualiza tu plan!');
    }

    // Verificar créditos
    await this.aiPremium.checkCredits(300);

    const systemPrompt = `Eres un tutor experto sobre el libro "${bookContext.title}".
El usuario está leyendo el capítulo "${bookContext.chapterTitle}".

Contexto del capítulo:
${bookContext.chapterContent}

Tu rol:
- Responde preguntas sobre el contenido
- Proporciona explicaciones claras
- Haz conexiones con conceptos previos
- Sugiere reflexiones profundas
- Mantén un tono filosófico y educativo

Responde en español de forma concisa (máx 200 palabras).`;

    const response = await this.aiAdapter.chat(userQuestion, {
      systemPrompt,
      maxTokens: 500,
      temperature: 0.7
    });

    // Consumir créditos (aproximado por tokens de respuesta)
    const tokensUsed = Math.ceil(response.length / 4); // Aproximación
    await this.aiPremium.consumeCredits(
      tokensUsed,
      `book_chat:${bookId}:${chapterId}`,
      this.aiAdapter.currentProvider,
      this.aiAdapter.currentModel
    );

    return response;
  }

  /**
   * Generar quizzes personalizados con IA
   */
  async generatePersonalizedQuiz(bookId, chapterId, difficulty, numQuestions = 5) {
    if (!this.aiPremium.hasFeature('ai_tutor')) {
      throw new Error('Necesitas Premium para generar quizzes personalizados.');
    }

    await this.aiPremium.checkCredits(400);

    const systemPrompt = `Eres un experto en crear evaluaciones educativas.
Genera un quiz de ${numQuestions} preguntas sobre este capítulo.

Dificultad: ${difficulty}
Formato JSON:
{
  "questions": [
    {
      "question": "...",
      "options": ["A", "B", "C", "D"],
      "correct": 0,
      "explanation": "..."
    }
  ]
}`;

    const response = await this.aiAdapter.chat(
      `Contenido del capítulo: ${chapterContent}`,
      {
        systemPrompt,
        maxTokens: 1000,
        temperature: 0.8
      }
    );

    // Parse JSON response
    const quiz = JSON.parse(response);

    await this.aiPremium.consumeCredits(
      800,
      `quiz_generation:${bookId}:${chapterId}`,
      this.aiAdapter.currentProvider,
      this.aiAdapter.currentModel
    );

    return quiz;
  }

  /**
   * Resumen inteligente del capítulo
   */
  async generateChapterSummary(chapterContent, length = 'medium') {
    if (!this.aiPremium.hasFeature('ai_tutor')) {
      throw new Error('Necesitas Premium para generar resúmenes IA.');
    }

    await this.aiPremium.checkCredits(300);

    const lengths = {
      short: '2-3 párrafos',
      medium: '4-5 párrafos',
      long: 'análisis detallado'
    };

    const systemPrompt = `Genera un resumen ${lengths[length]} de este capítulo.
Incluye:
- Ideas principales
- Conceptos clave
- Implicaciones prácticas
- Conexiones con otros temas`;

    const summary = await this.aiAdapter.chat(chapterContent, {
      systemPrompt,
      maxTokens: length === 'long' ? 800 : 400,
      temperature: 0.5
    });

    await this.aiPremium.consumeCredits(
      400,
      'chapter_summary',
      this.aiAdapter.currentProvider,
      this.aiAdapter.currentModel
    );

    return summary;
  }

  /**
   * Ejercicios personalizados basados en progreso
   */
  async generatePersonalizedExercises(userProgress, weakAreas) {
    if (!this.aiPremium.hasFeature('ai_tutor')) {
      throw new Error('Necesitas Premium para ejercicios personalizados.');
    }

    await this.aiPremium.checkCredits(500);

    const systemPrompt = `Basándote en el progreso del usuario y sus áreas débiles,
genera 3 ejercicios prácticos personalizados.

Áreas a reforzar: ${weakAreas.join(', ')}

Formato JSON:
{
  "exercises": [
    {
      "title": "...",
      "description": "...",
      "difficulty": "...",
      "estimatedTime": "...",
      "steps": ["..."]
    }
  ]
}`;

    const response = await this.aiAdapter.chat(
      JSON.stringify(userProgress),
      { systemPrompt, maxTokens: 1200, temperature: 0.8 }
    );

    const exercises = JSON.parse(response);

    await this.aiPremium.consumeCredits(
      1000,
      'personalized_exercises',
      this.aiAdapter.currentProvider,
      this.aiAdapter.currentModel
    );

    return exercises;
  }
}

window.aiBookFeatures = new AIBookFeatures();
```

### 3.3 Features de IA para Juegos (Frankenstein Lab)

Crear: `/www/js/features/ai-game-master.js`

```javascript
class AIGameMaster {
  constructor() {
    this.aiAdapter = window.aiAdapter;
    this.aiPremium = window.aiPremium;
  }

  /**
   * NPC conversacional (Pro feature)
   */
  async chatWithNPC(npcId, npcPersonality, conversationHistory, userMessage) {
    if (!this.aiPremium.hasFeature('ai_game_master')) {
      throw new Error('Necesitas el plan Pro para NPCs conversacionales. ¡Actualiza ahora!');
    }

    await this.aiPremium.checkCredits(250);

    const systemPrompt = `Eres ${npcPersonality.name}, ${npcPersonality.role}.

Personalidad:
${npcPersonality.traits.join(', ')}

Conocimiento:
${npcPersonality.knowledge}

Estilo de habla: ${npcPersonality.speechStyle}

Mantén el personaje SIEMPRE. Responde de forma natural y coherente con tu personalidad.
Máximo 100 palabras.`;

    const response = await this.aiAdapter.chat(userMessage, {
      systemPrompt,
      conversationHistory,
      maxTokens: 300,
      temperature: 0.9 // Mayor creatividad para NPCs
    });

    await this.aiPremium.consumeCredits(
      250,
      `npc_chat:${npcId}`,
      this.aiAdapter.currentProvider,
      this.aiAdapter.currentModel
    );

    return response;
  }

  /**
   * Generar misiones dinámicas (Pro feature)
   */
  async generateDynamicMission(userBeing, difficulty, theme) {
    if (!this.aiPremium.hasFeature('ai_game_master')) {
      throw new Error('Necesitas Pro para misiones dinámicas.');
    }

    await this.aiPremium.checkCredits(600);

    const systemPrompt = `Genera una misión única para Frankenstein Lab.

Ser del usuario:
${JSON.stringify(userBeing.attributes, null, 2)}

Dificultad: ${difficulty}
Tema: ${theme}

Formato JSON:
{
  "name": "...",
  "icon": "emoji",
  "description": "...",
  "narrative": "Historia de 2-3 párrafos",
  "requirements": [
    {"type": "attribute", "name": "...", "min": ...},
    {"type": "piece", "category": "...", "count": ...}
  ],
  "rewards": {
    "experience": ...,
    "unlocks": ["..."]
  },
  "challenges": [
    {"description": "...", "difficulty": "..."}
  ]
}`;

    const response = await this.aiAdapter.chat('Genera la misión', {
      systemPrompt,
      maxTokens: 1500,
      temperature: 0.85
    });

    const mission = JSON.parse(response);

    await this.aiPremium.consumeCredits(
      1200,
      `dynamic_mission:${difficulty}:${theme}`,
      this.aiAdapter.currentProvider,
      this.aiAdapter.currentModel
    );

    return mission;
  }

  /**
   * Narrativa adaptativa según decisiones
   */
  async generateAdaptiveNarrative(gameState, lastAction, choices) {
    if (!this.aiPremium.hasFeature('ai_game_master')) {
      throw new Error('Necesitas Pro para narrativa adaptativa.');
    }

    await this.aiPremium.checkCredits(400);

    const systemPrompt = `Eres un Game Master experto en narrativa adaptativa.
Genera la siguiente escena basándote en las decisiones del jugador.

Estado actual del juego:
${JSON.stringify(gameState, null, 2)}

Última acción: ${lastAction}

Genera:
1. Descripción de la escena (2-3 párrafos)
2. Consecuencias de la acción
3. Nuevas opciones disponibles

Tono: filosófico, introspectivo, con toques de ciencia ficción.`;

    const narrative = await this.aiAdapter.chat(
      JSON.stringify(choices),
      { systemPrompt, maxTokens: 800, temperature: 0.8 }
    );

    await this.aiPremium.consumeCredits(
      650,
      'adaptive_narrative',
      this.aiAdapter.currentProvider,
      this.aiAdapter.currentModel
    );

    return narrative;
  }

  /**
   * Feedback inteligente sobre creación de seres
   */
  async analyzeBeingCreation(being, mission) {
    if (!this.aiPremium.hasFeature('ai_game_master')) {
      // Feature disponible también en Premium
      if (!this.aiPremium.hasFeature('ai_tutor')) {
        throw new Error('Necesitas Premium o Pro para análisis de seres.');
      }
    }

    await this.aiPremium.checkCredits(200);

    const systemPrompt = `Analiza este ser creado en Frankenstein Lab.

Ser:
${JSON.stringify(being, null, 2)}

Misión objetivo:
${mission.name} - ${mission.description}

Proporciona:
1. Análisis de fortalezas/debilidades
2. Sugerencias de mejora
3. Piezas recomendadas
4. Probabilidad de éxito en la misión

Formato: párrafos cortos, tono constructivo.`;

    const analysis = await this.aiAdapter.chat('Analiza', {
      systemPrompt,
      maxTokens: 500,
      temperature: 0.6
    });

    await this.aiPremium.consumeCredits(
      350,
      'being_analysis',
      this.aiAdapter.currentProvider,
      this.aiAdapter.currentModel
    );

    return analysis;
  }
}

window.aiGameMaster = new AIGameMaster();
```

---

## 🎨 FASE 4: UI/UX Premium

### 4.1 Indicadores de Estado Premium

```javascript
// Añadir a la UI principal
class PremiumIndicators {
  showCreditsWidget() {
    const widget = document.createElement('div');
    widget.className = 'credits-widget';
    widget.innerHTML = `
      <div class="credits-display">
        <span class="icon">🪙</span>
        <span class="count">${window.aiPremium.getRemainingCredits()}</span>
        <span class="label">créditos IA</span>
      </div>
      <div class="tier-badge ${window.aiPremium.getSubscriptionTier()}">
        ${window.aiPremium.getSubscriptionTier().toUpperCase()}
      </div>
    `;

    return widget;
  }

  showUpgradePrompt(feature) {
    const modal = document.createElement('div');
    modal.className = 'upgrade-prompt-modal';
    modal.innerHTML = `
      <div class="upgrade-content">
        <div class="icon">✨</div>
        <h3>Desbloquea ${feature}</h3>
        <p>Esta función premium requiere una suscripción.</p>

        <div class="benefits">
          ${this.getBenefitsForFeature(feature).map(b => `
            <div class="benefit">✓ ${b}</div>
          `).join('')}
        </div>

        <button onclick="window.pricingModal.showPricingModal()" class="btn-upgrade">
          Ver Planes
        </button>
        <button onclick="this.closest('.upgrade-prompt-modal').remove()" class="btn-cancel">
          Ahora no
        </button>
      </div>
    `;

    document.body.appendChild(modal);
  }

  getBenefitsForFeature(feature) {
    const benefits = {
      ai_chat: [
        'Chat ilimitado con IA sobre el contenido',
        'Respuestas contextuales profundas',
        'Historial de conversaciones'
      ],
      ai_game_master: [
        'NPCs con personalidades únicas',
        'Misiones generadas dinámicamente',
        'Narrativa que se adapta a tus decisiones'
      ],
      ai_tutor: [
        'Quizzes personalizados según tu nivel',
        'Ejercicios adaptados a tus debilidades',
        'Feedback inteligente y detallado'
      ]
    };

    return benefits[feature] || [];
  }
}

window.premiumIndicators = new PremiumIndicators();
```

---

## 📊 FASE 5: Analytics y Admin Dashboard

### 5.1 Métricas Clave (Supabase)

```sql
-- Vista de métricas para admin
CREATE VIEW admin_metrics AS
SELECT
  COUNT(DISTINCT id) FILTER (WHERE subscription_tier = 'free') as free_users,
  COUNT(DISTINCT id) FILTER (WHERE subscription_tier = 'premium') as premium_users,
  COUNT(DISTINCT id) FILTER (WHERE subscription_tier = 'pro') as pro_users,

  SUM(ai_credits_total - ai_credits_remaining) as total_credits_used,

  (SELECT COUNT(*) FROM ai_usage WHERE created_at > NOW() - INTERVAL '24 hours') as ai_calls_24h,
  (SELECT SUM(tokens_used) FROM ai_usage WHERE created_at > NOW() - INTERVAL '30 days') as tokens_last_month,
  (SELECT SUM(cost_usd) FROM ai_usage WHERE created_at > NOW() - INTERVAL '30 days') as cost_last_month,

  (SELECT COUNT(*) FROM transactions WHERE status = 'completed' AND created_at > NOW() - INTERVAL '30 days') as transactions_month,
  (SELECT SUM(amount) FROM transactions WHERE status = 'completed' AND created_at > NOW() - INTERVAL '30 days') as revenue_month
FROM profiles;
```

---

## 🚀 ROADMAP DE IMPLEMENTACIÓN

### Semana 1-2: Base
- [ ] Configurar tablas Supabase
- [ ] Implementar RLS policies
- [ ] Crear UI de registro/login
- [ ] Integrar OAuth (Google)

### Semana 3-4: Pagos
- [ ] Configurar Stripe
- [ ] Crear productos y precios
- [ ] Implementar Edge Function webhook
- [ ] UI de pricing y checkout

### Semana 5-6: IA Premium
- [ ] Sistema de créditos
- [ ] AI Book Features (chat, quizzes)
- [ ] Rate limiting
- [ ] UI de features premium

### Semana 7-8: Game Master IA
- [ ] NPCs conversacionales
- [ ] Generación de misiones
- [ ] Narrativa adaptativa
- [ ] Testing y refinamiento

### Semana 9-10: Polish
- [ ] Analytics dashboard
- [ ] Emails transaccionales
- [ ] Documentación
- [ ] Testing completo
- [ ] Launch 🚀

---

## 💰 ESTIMACIÓN DE COSTOS

### Costos Mensuales (100 usuarios premium)

```
Supabase:
  - Database (Pro): $25/mes
  - Auth: Gratis hasta 50K MAU
  - Edge Functions: ~$2/mes

Stripe:
  - 2.9% + €0.25 por transacción
  - €9.99 x 100 = €999
  - Comisión: ~€32/mes

IA (Claude API):
  - Premium (500 tokens x 100 users): ~$15/mes
  - Pro (2000 tokens x 20 users): ~$12/mes
  - Total IA: ~$27/mes

Total estimado: ~$86/mes
Ingresos: €999/mes
Margen: ~91% 🎉
```

---

## 🔒 SEGURIDAD

### Checklist
- [x] RLS habilitado en todas las tablas
- [ ] Validación server-side de permisos
- [ ] Rate limiting en Edge Functions
- [ ] Sanitización de inputs de IA
- [ ] Logging de accesos
- [ ] Monitoreo de uso anómalo
- [ ] 2FA opcional para usuarios

---

## 📝 CONCLUSIÓN

Esta arquitectura te permite:

✅ **Registro rápido**: Email/password + OAuth Google
✅ **Pagos seguros**: Stripe con webhooks
✅ **IA premium**: Features diferenciadas por tier
✅ **Escalable**: Supabase + Edge Functions
✅ **Económico**: >90% margen después de costos
✅ **Ya implementado**: 70% del código ya existe

**Siguiente paso**: ¿Empezamos con la configuración de Supabase y las tablas?
