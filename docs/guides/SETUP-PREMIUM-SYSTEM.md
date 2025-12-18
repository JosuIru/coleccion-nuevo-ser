# GUÍA DE SETUP - Sistema Premium + IA

## 📋 Tabla de Contenidos

1. [Fase 1: Base de Datos](#fase-1-base-de-datos)
2. [Fase 2: Configuración Stripe](#fase-2-stripe)
3. [Fase 3: Despliegue Supabase](#fase-3-supabase)
4. [Fase 4: Integración Frontend](#fase-4-frontend)
5. [Testing y Troubleshooting](#testing)

---

## FASE 1: Base de Datos

### 1.1 Crear Tablas en Supabase

1. Ir a: https://supabase.com/dashboard
2. Selecciona tu proyecto
3. SQL Editor → New Query
4. Copiar contenido de `supabase/migrations/001_initial_schema.sql`
5. Ejecutar (⌘ Cmd + Enter)

**Expected output:**
```
✅ CREATE TABLE
✅ CREATE INDEX
✅ CREATE TRIGGER
✅ CREATE POLICY
```

### 1.2 Verificar Tablas Creadas

En Supabase Dashboard → Table Editor:

- [ ] `profiles` - perfiles de usuario con suscripción
- [ ] `ai_usage` - tracking de uso de IA
- [ ] `transactions` - historial de pagos
- [ ] `subscription_events` - log de eventos

---

## FASE 2: Configuración Stripe

### 2.1 Crear Cuenta Stripe

1. Ir a: https://stripe.com/register
2. Completar registro
3. Verificar email

### 2.2 Crear Productos

En Stripe Dashboard → Products:

**Premium Monthly:**
- Name: `Nuevo Ser Premium`
- Price: `9,99 EUR`
- Billing: Monthly
- **Guardar Price ID**: `price_1234...` ← Importante
- Tax: Habilitar si procede

**Pro Monthly:**
- Name: `Nuevo Ser Pro`
- Price: `19,99 EUR`
- Billing: Monthly
- **Guardar Price ID**: `price_5678...` ← Importante

### 2.3 Obtener API Keys

En Stripe Dashboard → Developers → API Keys:

```
Publishable Key (Frontend):
pk_test_51234567890abcdefghijklmnopqrstuvwxyz

Secret Key (Backend):
sk_test_51234567890abcdefghijklmnopqrstuvwxyz

Webhook Signing Secret:
whsec_1234567890abcdefghijklmnopqrstuvwxyz
```

**⚠️ Guardar estos valores en variables de entorno**

### 2.4 Configurar Webhook

En Stripe Dashboard → Webhooks → Add endpoint:

- Endpoint URL: `https://tu-proyecto.supabase.co/functions/v1/stripe-webhook`
- Events: Seleccionar:
  - `checkout.session.completed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_failed`
  - `invoice.payment_succeeded`

---

## FASE 3: Despliegue Supabase

### 3.1 Instalar Supabase CLI

```bash
npm install -g supabase

# Login
supabase login
```

### 3.2 Crear Edge Functions

```bash
# Premium directory
mkdir -p supabase/functions/create-checkout-session

# Copiar archivo
cp supabase/functions/create-checkout-session/index.ts \
   supabase/functions/create-checkout-session/

# Hacer lo mismo para stripe-webhook
mkdir -p supabase/functions/stripe-webhook
cp supabase/functions/stripe-webhook/index.ts \
   supabase/functions/stripe-webhook/
```

### 3.3 Configurar Variables de Entorno

En Supabase Dashboard → Settings → Edge Functions secrets:

```
STRIPE_SECRET_KEY = sk_test_...
STRIPE_WEBHOOK_SECRET = whsec_...
STRIPE_PRICE_ID_PREMIUM = price_...
STRIPE_PRICE_ID_PRO = price_...
```

### 3.4 Deploy Functions

```bash
supabase functions deploy create-checkout-session
supabase functions deploy stripe-webhook
```

**Expected output:**
```
✅ Function deployed successfully
Endpoint: https://tu-proyecto.supabase.co/functions/v1/create-checkout-session
```

---

## FASE 4: Integración Frontend

### 4.1 Cargar Archivos en el Proyecto

```bash
# Archivos JS
cp www/js/core/auth-helper.js             → www/js/core/
cp www/js/features/auth-modal.js           → www/js/features/
cp www/js/features/pricing-modal.js        → www/js/features/

# Archivo CSS
cp www/css/auth-premium.css                → www/css/
```

### 4.2 Incluir en HTML Principal

En `www/index.html` o donde se carguen los scripts:

```html
<!-- Auth & Premium System -->
<link rel="stylesheet" href="/css/auth-premium.css">

<!-- Supabase Client (ya debe estar) -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

<!-- Auth Helper -->
<script src="/js/core/auth-helper.js"></script>

<!-- Auth Modal -->
<script src="/js/features/auth-modal.js"></script>

<!-- Pricing Modal -->
<script src="/js/features/pricing-modal.js"></script>

<!-- Stripe.js (se carga dinámicamente desde pricing-modal) -->
```

### 4.3 Configurar Supabase Client

En `www/js/core/supabase-config.js` (ya existe):

```javascript
// Ya debería estar, verificar:
const supabaseConfig = {
    url: 'https://flxrilsxghiqfsfifxch.supabase.co',
    anonKey: 'eyJhbGc...',
};

window.supabaseConfig = supabaseConfig;
```

### 4.4 Configurar Stripe Publishable Key

Opción A: Variable global en HTML:

```html
<script>
  window.STRIPE_PUBLISHABLE_KEY = 'pk_test_1234...';
</script>
```

Opción B: En `.env` del frontend:

```
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_1234...
```

Luego en `pricing-modal.js`:

```javascript
getStripePublishableKey() {
  return import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_...';
}
```

### 4.5 Agregar Botones de Auth a la UI

En tu interfaz principal, añade botones para:

```html
<!-- Login/Signup Button -->
<button onclick="window.authModal.showLoginModal()">
  🔐 Iniciar Sesión
</button>

<!-- Profile Button (si está autenticado) -->
<button onclick="window.authModal.showProfileModal()" id="profile-btn" style="display:none;">
  👤 Mi Cuenta
</button>

<!-- Pricing Button -->
<button onclick="window.pricingModal.showPricingModal()">
  ✨ Planes Premium
</button>
```

### 4.6 Mostrar/Ocultar UI según Autenticación

```javascript
// En el código de inicialización
window.authHelper.onAuthStateChange((event, user) => {
  const profileBtn = document.getElementById('profile-btn');
  const loginBtn = document.querySelector('[onclick*="showLoginModal"]');

  if (event === 'signed_in') {
    profileBtn.style.display = 'block';
    loginBtn.style.display = 'none';
  } else {
    profileBtn.style.display = 'none';
    loginBtn.style.display = 'block';
  }
});
```

---

## Testing

### Test 1: Registro

```javascript
// En consola
window.authModal.showSignupModal()

// Llenar formulario
// Email: test@example.com
// Password: TestPassword123
// Full Name: Test User

// Verificar email
// Ir a Supabase → auth.users
```

**Expected:**
- [ ] Usuario creado en `auth.users`
- [ ] Perfil creado automáticamente en `profiles`
- [ ] Email de confirmación enviado

### Test 2: Login

```javascript
window.authModal.showLoginModal()

// Usar email/password del test anterior (después de verificar)
```

**Expected:**
- [ ] Session creada
- [ ] Perfil cargado en `window.authHelper.currentProfile`
- [ ] Modal cerrado automáticamente

### Test 3: Checkout (Modo Test Stripe)

```javascript
window.authModal.showProfileModal()

// Click "Actualizar a Premium"
// Debería abrir pricing modal
// Click "Comenzar Premium"
```

**Usar tarjeta de prueba:**
```
Number: 4242 4242 4242 4242
Exp: 12/25
CVC: 123
```

**Expected:**
- [ ] Redirige a Stripe Checkout
- [ ] Pago procesado
- [ ] Perfil actualizado a `premium` tier
- [ ] Créditos establecidos a 500

### Test 4: Webhook

```javascript
// En Supabase → Functions → stripe-webhook
// Logs deberían mostrar eventos procesados

// Verificar que el perfil fue actualizado:
// Ir a profiles table → buscar usuario
// subscription_tier = 'premium'
// ai_credits_remaining = 500
```

---

## Troubleshooting

### "Supabase no disponible"

**Síntoma:** Consola muestra "Supabase no disponible"

**Solución:**
```html
<!-- Verificar que está antes de auth-helper.js -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="/js/core/supabase-config.js"></script>
<script src="/js/core/auth-helper.js"></script>
```

### "Invalid Stripe Publishable Key"

**Síntoma:** Error en pricing modal

**Solución:**
```javascript
// Verificar en consola:
console.log(window.STRIPE_PUBLISHABLE_KEY)

// Debería mostrar: pk_test_...
// Si es undefined, configurar en HTML o .env
```

### "Webhook signature verification failed"

**Síntoma:** Eventos Stripe no procesados

**Solución:**
1. Verificar `STRIPE_WEBHOOK_SECRET` en Supabase secrets
2. Debe ser exacto (copiar sin espacios)
3. Usar `whsec_...` no la API key

### "Function not found"

**Síntoma:** Error 404 al crear checkout

**Solución:**
```bash
# Verificar que está deployed:
supabase functions list

# Debería listar:
# create-checkout-session
# stripe-webhook

# Si no está, deploy:
supabase functions deploy create-checkout-session --no-verify-jwt
```

### "CORS error"

**Síntoma:** Error al llamar a Edge Function desde frontend

**Solución:**
En Supabase → Project Settings → API → CORS:

```
Allowed origins:
- http://localhost:3000
- http://localhost:5173
- https://tu-dominio.com
```

---

## Checklist de Deployment

### Pre-Producción

- [ ] Base de datos creada y RLS habilitado
- [ ] Stripe cuenta en modo Test
- [ ] Edge Functions deployadas
- [ ] Variables de entorno configuradas
- [ ] Frontend cargando archivos correctamente
- [ ] Auth modal funciona (login/signup)
- [ ] Checkout completa sin errores
- [ ] Webhook procesa eventos
- [ ] Perfil se actualiza después del pago

### Producción

- [ ] Cambiar Stripe a modo Live
- [ ] Actualizar `STRIPE_SECRET_KEY` y `STRIPE_PUBLISHABLE_KEY` a keys de producción
- [ ] Re-deploy Edge Functions
- [ ] Actualizar webhook URL en Stripe
- [ ] Probar un pago real (pequeño monto)
- [ ] Verificar email transaccionales (opcional)
- [ ] Configurar términos de servicio y política de privacidad
- [ ] SSL/HTTPS habilitado

---

## Variables de Entorno (Resumen)

### Supabase (Secrets)
```
STRIPE_SECRET_KEY = sk_live_...
STRIPE_WEBHOOK_SECRET = whsec_...
STRIPE_PRICE_ID_PREMIUM = price_...
STRIPE_PRICE_ID_PRO = price_...
```

### Frontend (.env)
```
VITE_SUPABASE_URL = https://...supabase.co
VITE_SUPABASE_ANON_KEY = eyJ...
VITE_STRIPE_PUBLISHABLE_KEY = pk_live_...
```

---

## Próximos Pasos

Después de completar el setup:

1. **Fase 5:** Implementar IA Features (chat sobre libros, quizzes personalizados)
2. **Fase 6:** Game Master IA (NPCs, misiones dinámicas)
3. **Fase 7:** Analytics Dashboard (para admins)
4. **Fase 8:** Emails transaccionales (confirmación de pago, renovación, etc)

---

## Soporte

Si encuentras problemas:

1. Revisar logs en Supabase → Functions
2. Revisar logs en Stripe Dashboard → Logs
3. Abrir consola del navegador (F12) para errores JS
4. Verificar que Supabase client está inicializado: `window.supabase`

---

**¡Listo! Tu sistema de autenticación y pagos está configurado.** 🚀
