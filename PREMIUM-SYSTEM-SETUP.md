# Sistema Premium - Guía de Configuración para Producción

Esta guía describe los pasos necesarios para configurar el sistema premium completo de la Colección Nuevo Ser.

## Resumen del Sistema

El sistema premium incluye:
- **Autenticación** via Supabase Auth
- **Suscripciones** Premium (9,99€/mes) y Pro (19,99€/mes)
- **Créditos de IA** con API preconfigurada del administrador
- **Panel de administración** para gestionar usuarios
- **Pagos** via PayPal (manual) y Stripe (automático)

## Modelo de Negocio Premium

### ¿Es legal revender acceso a IA?
**Sí**, este modelo es completamente legal y lo usan empresas como Cursor, Notion AI, Perplexity, etc.

**Condiciones legales cumplidas:**
- ✅ Ofreces valor añadido (app, libros, contexto específico)
- ✅ No es solo "acceso a Claude" sino servicios específicos
- ✅ Tienes una aplicación completa con funciones propias
- ✅ El contenido y la experiencia son únicos

### Costos y Márgenes Estimados

| Plan | Precio | Consultas | Costo IA* | Margen |
|------|--------|-----------|-----------|--------|
| Free | 0€ | 50/mes | ~$0.50 | Subsidio |
| Premium | 9,99€ | 500/mes | ~$2-3 | ~7€ |
| Pro | 19,99€ | 2000/mes | ~$8-12 | ~10€ |

*Usando mezcla de Claude Haiku (económico) y Sonnet (calidad)

## 1. Configuración de Supabase

### 1.1 Crear proyecto en Supabase

1. Ir a [supabase.com](https://supabase.com) y crear cuenta/proyecto
2. Obtener las credenciales:
   - `SUPABASE_URL`: URL del proyecto (ej: `https://xxxxx.supabase.co`)
   - `SUPABASE_ANON_KEY`: Clave pública anónima

### 1.2 Configurar variables en el código

Editar `www/js/core/supabase-config.js`:

```javascript
const SUPABASE_URL = 'https://TU-PROYECTO.supabase.co';
const SUPABASE_ANON_KEY = 'tu-clave-anon-publica';
```

### 1.3 Crear tablas en Supabase

Ejecutar en el SQL Editor de Supabase:

```sql
-- Tabla de perfiles de usuario
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user', -- 'user' | 'admin'
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de suscripciones
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  plan TEXT NOT NULL, -- 'premium' | 'pro'
  status TEXT DEFAULT 'active', -- 'active' | 'cancelled' | 'expired'
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  payment_method TEXT, -- 'stripe' | 'paypal' | 'manual'
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de uso de IA
CREATE TABLE IF NOT EXISTS ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  credits_used INTEGER DEFAULT 0,
  monthly_limit INTEGER DEFAULT 50, -- Gratuito: 50, Premium: 500, Pro: 2000
  last_reset_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de historial de transacciones
CREATE TABLE IF NOT EXISTS payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10,2),
  currency TEXT DEFAULT 'EUR',
  payment_method TEXT,
  status TEXT, -- 'completed' | 'pending' | 'failed' | 'refunded'
  description TEXT,
  stripe_payment_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de historial de uso de IA
CREATE TABLE IF NOT EXISTS ai_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  feature TEXT, -- 'chat' | 'tutor' | 'adapter' | 'game_master'
  credits_consumed INTEGER DEFAULT 1,
  prompt_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_id ON ai_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_user_id ON payment_history(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_history_user_id ON ai_history(user_id);

-- Función para incrementar créditos de IA (usada por el proxy)
CREATE OR REPLACE FUNCTION increment_ai_credits(p_user_id UUID, p_credits INTEGER DEFAULT 1)
RETURNS void AS $$
BEGIN
  UPDATE ai_usage
  SET credits_used = credits_used + p_credits,
      last_used_at = NOW()
  WHERE user_id = p_user_id;

  -- Si no existe registro, crear uno
  IF NOT FOUND THEN
    INSERT INTO ai_usage (user_id, credits_used, monthly_limit, last_used_at)
    VALUES (p_user_id, p_credits, 50, NOW());
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para resetear créditos mensuales (ejecutar con cron el día 1)
CREATE OR REPLACE FUNCTION reset_monthly_credits()
RETURNS void AS $$
BEGIN
  UPDATE ai_usage SET credits_used = 0, last_reset_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear perfil automáticamente al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);

  INSERT INTO public.ai_usage (user_id, credits_used, monthly_limit)
  VALUES (NEW.id, 0, 50);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_history ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Políticas para subscriptions
CREATE POLICY "Users can view own subscription" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all subscriptions" ON subscriptions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Políticas para ai_usage
CREATE POLICY "Users can view own ai_usage" ON ai_usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own ai_usage" ON ai_usage
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all ai_usage" ON ai_usage
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Políticas para payment_history
CREATE POLICY "Users can view own payment_history" ON payment_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all payment_history" ON payment_history
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Políticas para ai_history
CREATE POLICY "Users can view own ai_history" ON ai_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ai_history" ON ai_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### 1.4 Crear primer administrador

Después de que el admin se registre, ejecutar:

```sql
UPDATE profiles
SET role = 'admin'
WHERE email = 'tu-email-admin@ejemplo.com';
```

## 2. Configuración de Stripe (Opcional - Pagos Automáticos)

### 2.1 Crear cuenta en Stripe

1. Ir a [stripe.com](https://stripe.com) y crear cuenta
2. Activar modo Live cuando estés listo para producción

### 2.2 Crear productos y precios

En el Dashboard de Stripe > Products:

**Producto: Nuevo Ser Premium**
- Precio: 9,99€/mes (recurring)
- ID del precio: `price_premium_monthly`

**Producto: Nuevo Ser Pro**
- Precio: 19,99€/mes (recurring)
- ID del precio: `price_pro_monthly`

### 2.3 Configurar Webhook

En Stripe > Developers > Webhooks:

1. Crear endpoint: `https://tu-dominio.com/api/stripe-webhook.php`
2. Eventos a escuchar:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`

### 2.4 Crear archivo de webhook

Crear `api/stripe-webhook.php`:

```php
<?php
require_once __DIR__ . '/vendor/autoload.php';

$stripe = new \Stripe\StripeClient(getenv('STRIPE_SECRET_KEY'));
$endpoint_secret = getenv('STRIPE_WEBHOOK_SECRET');

$payload = @file_get_contents('php://input');
$sig_header = $_SERVER['HTTP_STRIPE_SIGNATURE'];

try {
    $event = \Stripe\Webhook::constructEvent(
        $payload, $sig_header, $endpoint_secret
    );
} catch(\Exception $e) {
    http_response_code(400);
    exit();
}

// Configurar Supabase
$supabase_url = getenv('SUPABASE_URL');
$supabase_key = getenv('SUPABASE_SERVICE_KEY');

switch ($event->type) {
    case 'checkout.session.completed':
        $session = $event->data->object;
        // Activar suscripción del usuario
        activateSubscription($session, $supabase_url, $supabase_key);
        break;

    case 'customer.subscription.deleted':
        $subscription = $event->data->object;
        // Cancelar suscripción
        cancelSubscription($subscription, $supabase_url, $supabase_key);
        break;

    case 'invoice.payment_failed':
        $invoice = $event->data->object;
        // Marcar como fallido
        handleFailedPayment($invoice, $supabase_url, $supabase_key);
        break;
}

http_response_code(200);

function activateSubscription($session, $url, $key) {
    $user_id = $session->client_reference_id;
    $plan = $session->metadata->plan ?? 'premium';

    $ch = curl_init("$url/rest/v1/subscriptions");
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => [
            "apikey: $key",
            "Authorization: Bearer $key",
            "Content-Type: application/json",
            "Prefer: resolution=merge-duplicates"
        ],
        CURLOPT_POSTFIELDS => json_encode([
            'user_id' => $user_id,
            'plan' => $plan,
            'status' => 'active',
            'stripe_subscription_id' => $session->subscription,
            'stripe_customer_id' => $session->customer,
            'current_period_start' => date('c'),
            'current_period_end' => date('c', strtotime('+1 month')),
            'payment_method' => 'stripe'
        ])
    ]);
    curl_exec($ch);
    curl_close($ch);

    // Actualizar créditos
    $monthly_limit = $plan === 'pro' ? 2000 : 500;
    $ch = curl_init("$url/rest/v1/ai_usage");
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => [
            "apikey: $key",
            "Authorization: Bearer $key",
            "Content-Type: application/json",
            "Prefer: resolution=merge-duplicates"
        ],
        CURLOPT_POSTFIELDS => json_encode([
            'user_id' => $user_id,
            'monthly_limit' => $monthly_limit
        ])
    ]);
    curl_exec($ch);
    curl_close($ch);
}
```

### 2.5 Variables de entorno para Stripe

```bash
STRIPE_PUBLIC_KEY=pk_live_xxx
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRICE_PREMIUM=price_xxx
STRIPE_PRICE_PRO=price_xxx
```

## 3. Configuración de Email (Opcional)

### 3.1 Supabase Email Templates

En Supabase Dashboard > Authentication > Email Templates:

**Confirmación de email:**
```html
<h2>Bienvenido a Nuevo Ser</h2>
<p>Confirma tu email haciendo clic en el siguiente enlace:</p>
<p><a href="{{ .ConfirmationURL }}">Confirmar email</a></p>
```

**Resetear contraseña:**
```html
<h2>Restablecer contraseña</h2>
<p>Haz clic en el siguiente enlace para restablecer tu contraseña:</p>
<p><a href="{{ .ConfirmationURL }}">Restablecer contraseña</a></p>
```

## 4. Flujos del Sistema

### 4.1 Registro de Usuario

1. Usuario se registra con email/contraseña
2. Supabase Auth crea el usuario
3. Trigger crea perfil en `profiles` y registro en `ai_usage` con 50 créditos gratuitos
4. Usuario recibe email de confirmación

### 4.2 Suscripción Premium/Pro

**Vía PayPal (manual):**
1. Usuario paga vía PayPal (enlace en modal de pricing)
2. Admin verifica el pago
3. Admin usa Panel Admin > Activación Manual
4. Se crea registro en `subscriptions` y se actualizan créditos en `ai_usage`

**Vía Stripe (automático):**
1. Usuario inicia checkout de Stripe
2. Stripe procesa el pago
3. Webhook actualiza `subscriptions` y `ai_usage` automáticamente

### 4.3 Consumo de Créditos IA

1. Usuario usa función de IA (chat, tutor, etc.)
2. Sistema verifica créditos disponibles en `ai_usage`
3. Si hay créditos, se ejecuta la consulta y se incrementa `credits_used`
4. Se registra en `ai_history` para historial

### 4.4 Renovación Mensual

**Stripe:**
- Automático via webhook

**PayPal:**
- Manual: admin reactiva cuando recibe el pago

### 4.5 Cancelación

1. Usuario cancela desde "Mi Cuenta"
2. Se actualiza `subscriptions.status = 'cancelled'`
3. Acceso se mantiene hasta `current_period_end`
4. Después de expirar, créditos vuelven a 50 (gratuito)

## 5. Configuración del Proxy de IA Premium

El proxy `api/premium-ai-proxy.php` permite que los usuarios Premium/Pro usen TU API key de Claude.

### 5.1 Obtener API Key de Claude

1. Ir a [console.anthropic.com](https://console.anthropic.com)
2. Crear cuenta o iniciar sesión
3. Ir a Settings → API Keys
4. Crear nueva key: `nuevo-ser-production`
5. Guardar la key de forma segura

**Recomendación**: Empieza con el plan "Build" (pay-as-you-go). Si creces mucho, pasa a "Scale".

### 5.2 Subir el Proxy a tu Servidor

```bash
# Subir a gailu.net o tu hosting
scp api/premium-ai-proxy.php usuario@gailu.net:/var/www/html/api/
```

### 5.3 Configurar Variables de Entorno

En tu servidor (`.htaccess` o panel de hosting):

```apache
# .htaccess o configuración del servidor
SetEnv CLAUDE_API_KEY sk-ant-api03-TU-CLAVE-AQUI
SetEnv SUPABASE_URL https://TU-PROYECTO.supabase.co
SetEnv SUPABASE_SERVICE_KEY eyJhbG...TU-SERVICE-KEY
```

O en PHP (menos seguro):

```php
// Al inicio de premium-ai-proxy.php
$ADMIN_API_KEYS = [
    'claude' => 'sk-ant-api03-TU-CLAVE-AQUI',
    // ...
];
```

### 5.4 Actualizar el Frontend

En `www/js/ai/ai-adapter.js`, añadir opción de usar proxy premium:

```javascript
// Para usuarios premium, usar el proxy del admin
async callPremiumProxy(messages, systemPrompt, feature) {
    const userToken = await window.authHelper?.getAccessToken();

    const response = await fetch('https://gailu.net/api/premium-ai-proxy.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-User-Token': userToken
        },
        body: JSON.stringify({
            messages,
            systemPrompt,
            feature // 'chat', 'tutor', 'adapter', 'game_master'
        })
    });

    return response.json();
}
```

### 5.5 Monitorear Costos

Revisa regularmente en [console.anthropic.com/usage](https://console.anthropic.com/usage):
- Uso por día/mes
- Costos acumulados
- Alertas de gasto

**Tip**: Configura alertas de gasto en Anthropic para evitar sorpresas.

## 6. Checklist de Producción

### Básico (Mínimo para funcionar):
- [ ] Supabase configurado con todas las tablas y funciones
- [ ] Variables de Supabase en `supabase-config.js`
- [ ] Primer admin creado (UPDATE profiles SET role='admin')
- [ ] PayPal link configurado en modal de pricing

### Proxy IA Premium:
- [ ] API Key de Claude obtenida
- [ ] `premium-ai-proxy.php` subido a gailu.net/api/
- [ ] Variables de entorno configuradas en servidor
- [ ] Frontend actualizado para usar proxy premium
- [ ] Probado el consumo de créditos IA

### Opcional:
- [ ] Email templates de Supabase configurados
- [ ] Stripe configurado con productos
- [ ] Webhook de Stripe desplegado
- [ ] Cron job para resetear créditos mensuales

## 6. Archivos del Sistema Premium

```
www/
├── js/
│   ├── core/
│   │   ├── supabase-config.js      # Configuración Supabase
│   │   ├── auth-helper.js          # Helper de autenticación
│   │   └── premium-validator.js    # Validador de premium
│   └── features/
│       ├── auth-modal.js           # Modal de login/registro
│       ├── pricing-modal.js        # Modal de precios
│       ├── my-account-modal.js     # Modal Mi Cuenta
│       ├── admin-panel-modal.js    # Panel de administración
│       └── ai-premium.js           # Sistema de créditos IA
├── css/
│   └── auth-premium.css            # Estilos premium
└── api/
    └── stripe-webhook.php          # Webhook de Stripe (opcional)
```

## 7. Soporte y Contacto

Para problemas con el sistema premium:
- Email: soporte@tudominio.com
- PayPal: paypal.me/codigodespierto

---

*Última actualización: Diciembre 2025*
