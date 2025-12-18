# Configuracion para Produccion

## Coleccion Nuevo Ser v2.9.32

Ultima actualizacion: 16 Diciembre 2024

---

## 1. Migraciones SQL (Supabase)

Ejecutar en orden en Supabase SQL Editor:

```bash
# Opcion A: Supabase CLI
supabase db push

# Opcion B: Manualmente en SQL Editor
# 1. supabase/migrations/001_initial_schema.sql
# 2. supabase/migrations/002_email_triggers.sql
# 3. supabase/migrations/003_phase5_ai_features.sql
# 4. supabase/migrations/004_fix_ai_tables_rls.sql  <- CRITICO para seguridad
```

---

## 2. Variables de Entorno

### Frontend (www/js/core/supabase-config.js)

```javascript
window.SUPABASE_CONFIG = {
  url: 'https://TU_PROYECTO.supabase.co',
  anonKey: 'eyJ...'  // Desde Supabase Dashboard > Settings > API
};

window.STRIPE_PUBLISHABLE_KEY = 'pk_live_...';  // Desde Stripe Dashboard
```

### Backend (Supabase Edge Functions)

En Supabase Dashboard > Edge Functions > Secrets:

```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_PREMIUM=price_...
STRIPE_PRICE_ID_PRO=price_...
RESEND_API_KEY=re_...
```

---

## 3. Configurar Google OAuth

1. Ir a [Google Cloud Console](https://console.cloud.google.com)
2. Crear proyecto o seleccionar existente
3. APIs & Services > Credentials > Create OAuth Client ID
4. Tipo: Web Application
5. Authorized redirect URIs:
   - `https://TU_PROYECTO.supabase.co/auth/v1/callback`
6. Copiar Client ID y Client Secret

En Supabase Dashboard:
1. Authentication > Providers > Google
2. Habilitar
3. Pegar Client ID y Client Secret

---

## 4. Configurar Stripe

### Crear Productos

En [Stripe Dashboard](https://dashboard.stripe.com):

1. Products > Add Product
   - **Premium**: 9.99 EUR/mes
   - **Pro**: 19.99 EUR/mes

2. Copiar Price IDs (price_...) a variables de entorno

### Configurar Webhook

1. Developers > Webhooks > Add endpoint
2. URL: `https://TU_PROYECTO.supabase.co/functions/v1/stripe-webhook`
3. Events a escuchar:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copiar Signing Secret a `STRIPE_WEBHOOK_SECRET`

---

## 5. Validar Sistema

En consola del navegador:

```javascript
// Validacion rapida
window.systemValidator.runQuickCheck();

// Tests completos
const tests = new PremiumSystemTests();
await tests.runAll();
```

---

## Checklist Final

- [ ] Migracion 004_fix_ai_tables_rls.sql ejecutada
- [ ] Google OAuth configurado
- [ ] Stripe productos creados
- [ ] Stripe webhook configurado
- [ ] Variables de entorno en produccion
- [ ] systemValidator.runQuickCheck() > 80%

---

## Archivos Clave Modificados

| Archivo | Cambio |
|---------|--------|
| `www/js/core/auth-helper.js` | Consolidado con supabaseAuthHelper |
| `www/js/core/plans-config.js` | Config centralizada de planes |
| `www/js/features/pricing-modal.js` | Usa PLANS_CONFIG |
| `www/js/features/ai-chat-modal.js` | Consume creditos |
| `www/js/features/ai-premium.js` | Precios actualizados |
| `supabase/migrations/004_fix_ai_tables_rls.sql` | Fix seguridad RLS |

---

## Soporte

- Tests: `www/tests/premium-system-test.js`
- Validador: `www/js/core/system-validator.js`
- Auditoria: `AUDIT-REPORT-2024-12-16.md`
