# Sistema de Pagos, Donaciones y Soporte IA

## Resumen Ejecutivo

Sistema completo de monetizacion para Coleccion Nuevo Ser con:
- **Modelo hibrido** de tokens (mensuales gratis + compra adicional)
- **3 metodos de pago**: Stripe, PayPal, Bitcoin
- **Chat de soporte IA** con Claude
- **Sistema de donaciones** para entidades del mapa de transicion
- **Notificaciones automaticas** al administrador

---

## 1. Sistema de Tokens

### 1.1 Modelo de Negocio

**Suscripciones mensuales** (tokens gratis cada mes):
| Plan | Precio | Tokens/mes | Features |
|------|--------|------------|----------|
| Free | 0€ | 5,000 | Chat IA basico |
| Premium | 4.99€ | 100,000 | +Tutor IA, Voces ElevenLabs |
| Pro | 9.99€ | 300,000 | +Game Master, Prioridad |

**Paquetes de tokens** (compra unica, no expiran):
| Paquete | Tokens | Precio | Descuento |
|---------|--------|--------|-----------|
| Basico | 50,000 | 2.99€ | - |
| Estandar | 150,000 | 7.99€ | 11% |
| Premium | 500,000 | 19.99€ | 20% |
| Pro | 1,500,000 | 49.99€ | 33% |

### 1.2 Consumo de Tokens

| Feature | Tokens aprox |
|---------|-------------|
| Chat IA | ~500/consulta |
| Tutor IA | ~800/sesion |
| Quiz IA | ~600/quiz |
| Game Master | ~1000/sesion |
| Resumen | ~300 |
| Voz ElevenLabs | ~200/1K chars |

### 1.3 Prioridad de Consumo

1. Primero se consumen tokens mensuales (gratis)
2. Luego tokens comprados (wallet)
3. Si no hay tokens, se bloquea la funcion

---

## 2. Metodos de Pago

### 2.1 Stripe (Tarjeta)
- Checkout embebido via Stripe
- Webhooks para confirmar pagos
- Soporta Google Pay, Apple Pay

**Flujo**:
```
Usuario -> Modal compra -> Stripe Checkout -> Webhook -> Tokens acreditados
```

### 2.2 PayPal
- Redireccion a PayPal.me
- Confirmacion manual por usuario
- Link: paypal.me/codigodespierto

**Flujo**:
```
Usuario -> Modal compra -> PayPal -> Confirmacion manual -> Tokens acreditados
```

### 2.3 Bitcoin
- Verificacion automatica via Blockstream API
- Direcciones:
  - SegWit: `bc1qjnva46wy92ldhsv4w0j26jmu8c5wm5cxvgdfd7`
  - Taproot: `bc1p29l9vjelerljlwhg6dhr0uldldus4zgn8vjaecer0spj7273d7rss4gnyk`

**Flujo**:
```
Usuario -> Modal compra -> Muestra direccion BTC -> Paga -> Ingresa TX ID
-> Edge Function verifica via Blockstream -> Tokens acreditados
```

---

## 3. Archivos del Sistema

### 3.1 Frontend (www/js/)

| Archivo | Descripcion |
|---------|-------------|
| `core/plans-config.js` | Configuracion central de planes y precios |
| `core/auth-helper.js` | Gestion de tokens del usuario |
| `features/ai-premium.js` | Logica de consumo de tokens |
| `features/token-purchase-modal.js` | Modal de compra de tokens |
| `features/my-account-modal.js` | Visualizacion de balance |
| `features/support-chat.js` | Chat de soporte IA |
| `features/entity-donation-modal.js` | Donaciones a entidades |

### 3.2 Backend (api/)

| Archivo | Descripcion |
|---------|-------------|
| `premium-ai-proxy.php` | Proxy para llamadas IA (verifica tokens) |

### 3.3 Edge Functions (supabase/functions/)

| Funcion | Descripcion |
|---------|-------------|
| `create-token-checkout` | Crea sesion Stripe para tokens |
| `stripe-webhook` | Procesa webhooks de Stripe |
| `verify-btc-payment` | Verifica pagos BTC via Blockstream |
| `support-chat` | API del chat de soporte con Claude |
| `admin-notifications` | Envia notificaciones al admin |
| `create-entity-donation` | Crea donaciones (modo Escrow) |
| `process-donation-payout` | Procesa payout automatico a entidades |
| `entity-verification` | Sistema de verificacion de entidades |
| `direct-btc-donation` | Donaciones BTC P2P (descentralizadas) |

### 3.4 Migraciones SQL

| Archivo | Descripcion |
|---------|-------------|
| `013_token_system.sql` | Tablas para tokens y pagos BTC |
| `014_entity_donations.sql` | Tablas para donaciones a entidades |

---

## 4. Chat de Soporte IA

### 4.1 Caracteristicas
- Chat flotante accesible desde cualquier pantalla
- Respuestas automaticas via Claude (Haiku para velocidad)
- Categorias: Pagos, Tecnico, Cuenta, Contenido, IA
- Escalado a humano cuando necesario
- Historial guardado en localStorage

### 4.2 Flujo de Escalacion
```
Usuario pregunta -> IA responde
    |
    +-> Resuelto -> Fin
    |
    +-> Necesita humano -> Notifica admin por email -> Ticket generado
```

### 4.3 Configuracion
Base de conocimiento en `support-chat/index.ts`:
- Precios y planes
- Soluciones a problemas comunes
- Instrucciones de uso

---

## 5. Notificaciones al Admin

### 5.1 Tipos de Notificaciones

| Tipo | Cuando se envia |
|------|-----------------|
| `support_escalation` | Usuario pide atencion humana |
| `btc_pending` | Pago BTC pendiente de verificar |
| `payment_issue` | Problema con pago |
| `user_feedback` | Sugerencia de usuario |
| `daily_summary` | Resumen diario (si configurado) |

### 5.2 Configuracion
Variables de entorno:
```
ADMIN_EMAIL=irurag@gmail.com
RESEND_API_KEY=re_xxxx (para envio de emails)
```

---

## 6. Sistema de Donaciones a Entidades

### 6.1 Concepto
Las entidades del mapa de transicion pueden recibir donaciones de usuarios.

**Dos modos de donacion**:
- **P2P (Descentralizado)**: Para BTC a entidades verificadas. Pago directo sin intermediarios.
- **Escrow (Custodia)**: Para Stripe/PayPal o entidades no verificadas. Fondos custodiados.

### 6.2 Modo P2P - Bitcoin Descentralizado

Para entidades **verificadas** con **direccion BTC configurada**:

```
1. Donador selecciona entidad verificada en el mapa
2. Elige cantidad y Bitcoin como metodo
3. Ve la direccion BTC de la entidad (no la nuestra)
4. Envia BTC directamente desde su wallet
5. Ingresa TX ID para verificar
6. Sistema verifica en blockchain via Blockstream API
7. Fondos ya estan en wallet de la entidad (instantaneo!)
```

**Ventajas del modo P2P**:
- Sin intermediarios (trustless)
- Fondos directos a la entidad
- Verificacion automatica en blockchain
- Sin custodia ni retrasos

### 6.3 Modo Escrow - Stripe/PayPal

Para pagos fiat o entidades no verificadas:

```
1. Donador selecciona entidad en el mapa
2. Elige cantidad y metodo (Stripe/PayPal)
3. Realiza el pago
4. Fondos quedan en ESCROW (custodia)
5. Entidad recibe notificacion
6. Entidad verifica su identidad (una sola vez)
7. Entidad reclama fondos -> LIBERACION AUTOMATICA
8. Admin recibe email con instrucciones de payout
9. Pago se procesa (automatico Stripe Connect o manual)
```

### 6.4 Estados de Donacion

| Estado | Descripcion | Modo |
|--------|-------------|------|
| `pending` | Esperando pago | Ambos |
| `in_escrow` | Fondos en custodia | Solo Escrow |
| `claimed` | Entidad reclamo | Solo Escrow |
| `released` | Fondos liberados/entregados | Ambos |
| `refunded` | Devuelto al donador | Solo Escrow |
| `expired` | Expiro sin reclamar (30 dias) | Solo Escrow |

### 6.5 Verificacion de Entidades

Las entidades deben verificarse para recibir donaciones P2P. **4 metodos disponibles**:

#### 1. Verificacion por Email (recomendado)
```
1. Entidad registra email de contacto
2. Sistema envia email con link de verificacion
3. Entidad hace clic en el link
4. Verificada automaticamente
```

#### 2. Verificacion por Website
```
1. Entidad tiene website registrado
2. Sistema genera meta tag unico
3. Entidad añade: <meta name="nuevosser-verification" content="TOKEN">
4. Sistema verifica que el tag existe en el website
5. Verificada automaticamente
```

#### 3. Verificacion por Redes Sociales
```
1. Entidad publica codigo en sus redes (Twitter, Facebook, etc)
2. Formato: #NuevoSer-XXXXXXXX
3. Admin verifica el post manualmente
4. Verificada tras confirmacion
```

#### 4. Verificacion Manual por Admin
```
1. Entidad solicita verificacion manual
2. Admin recibe notificacion
3. Admin verifica por otros medios (llamada, documentos, etc)
4. Admin aprueba desde panel
```

### 6.6 Requisitos para Donaciones P2P

Una entidad puede recibir donaciones P2P cuando:
1. Esta **verificada** (cualquier metodo)
2. Tiene **direccion BTC configurada** en su perfil
3. Estado es **activo**

Si no cumple estos requisitos, las donaciones BTC usan modo Escrow.

---

## 7. Base de Datos

### 7.1 Tablas Principales

```sql
-- Balance de tokens del usuario
profiles.token_balance          -- Tokens comprados (wallet)
profiles.tokens_purchased_total -- Total historico
profiles.ai_credits_remaining   -- Tokens mensuales restantes
profiles.ai_credits_total       -- Tokens mensuales del plan

-- Pagos BTC
btc_payment_requests (
  id, user_id, package_id, tokens_amount,
  btc_amount, tx_id, status, created_at, verified_at
)

-- Historial de tokens
token_transactions (
  id, user_id, type, tokens_amount,
  balance_before, balance_after, payment_method
)

-- Entidades del mapa
map_entities (
  id, name, category, location,
  btc_address, is_verified, total_donations_received
)

-- Donaciones
entity_donations (
  id, entity_id, donor_id, amount, currency,
  payment_method, status, escrow_address
)
```

### 7.2 Funciones SQL

| Funcion | Descripcion |
|---------|-------------|
| `add_purchased_tokens()` | Añade tokens tras compra |
| `consume_tokens()` | Descuenta tokens al usar IA |
| `reset_monthly_tokens()` | Renueva tokens mensuales |
| `verify_btc_payment()` | Verifica pago BTC |
| `create_donation()` | Crea donacion |
| `claim_donation()` | Entidad reclama fondos |
| `verify_entity()` | Verifica identidad de entidad |

---

## 8. Configuracion y Despliegue

### 8.1 Variables de Entorno (Supabase)

```bash
# Stripe
STRIPE_SECRET_KEY=sk_live_xxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxx

# Anthropic (Claude)
ANTHROPIC_API_KEY=sk-ant-xxxx

# Email (Resend)
RESEND_API_KEY=re_xxxx
ADMIN_EMAIL=irurag@gmail.com

# Supabase (automatico)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxx
```

### 8.2 Webhooks de Stripe

Configurar en Dashboard de Stripe:
- URL: `https://xxx.supabase.co/functions/v1/stripe-webhook`
- Eventos:
  - `checkout.session.completed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_failed`
  - `invoice.payment_succeeded`

### 8.3 Desplegar Edge Functions

```bash
supabase functions deploy create-token-checkout
supabase functions deploy stripe-webhook
supabase functions deploy verify-btc-payment
supabase functions deploy support-chat
supabase functions deploy admin-notifications
supabase functions deploy create-entity-donation
supabase functions deploy process-donation-payout
supabase functions deploy entity-verification
supabase functions deploy direct-btc-donation
```

### 8.4 Aplicar Migraciones

```bash
supabase db push
# o
supabase migration up
```

---

## 9. Testing

### 9.1 Test de Compra de Tokens (Stripe)
1. Usar tarjeta de test: `4242 4242 4242 4242`
2. Verificar webhook recibido
3. Verificar tokens acreditados en perfil

### 9.2 Test de Pago BTC
1. Usar testnet de Bitcoin (opcional)
2. Verificar llamada a Blockstream API
3. Simular confirmacion con TX real

### 9.3 Test de Donaciones
1. Crear entidad de prueba
2. Donar pequeña cantidad
3. Verificar estado `in_escrow`
4. Verificar entidad -> reclamar -> `claimed`

---

## 10. Seguridad

- Todos los pagos via HTTPS
- Verificacion de firma de webhooks Stripe
- Verificacion blockchain para BTC
- RLS (Row Level Security) en todas las tablas
- Tokens de verificacion para entidades
- Escrow de fondos para proteger donadores

---

## 11. Soporte y Contacto

- **Email soporte**: irurag@gmail.com
- **Chat IA**: Disponible 24/7 en la app
- **PayPal**: paypal.me/codigodespierto

---

## 12. Arquitectura Descentralizada

### 12.1 Principios
El sistema prioriza la descentralizacion cuando es posible:

| Aspecto | Centralizado | Descentralizado |
|---------|--------------|-----------------|
| Pagos BTC verificados | ❌ | ✅ P2P directo |
| Pagos BTC no verificados | ✅ Escrow | ❌ |
| Pagos Stripe/PayPal | ✅ Siempre | ❌ No posible |
| Verificacion entidades | ✅ Email/Admin | ✅ Website/Social |

### 12.2 Flujo P2P vs Escrow

```
                    ┌─────────────────────┐
                    │  Entidad Verificada │
                    │  + Direccion BTC    │
                    └─────────┬───────────┘
                              │
              ┌───────────────┴───────────────┐
              │                               │
         ┌────▼────┐                    ┌─────▼─────┐
         │   SI    │                    │    NO     │
         └────┬────┘                    └─────┬─────┘
              │                               │
    ┌─────────▼─────────┐         ┌──────────▼──────────┐
    │   MODO P2P        │         │    MODO ESCROW      │
    │                   │         │                     │
    │ • Pago directo    │         │ • Fondos custodia   │
    │ • Sin intermediario│         │ • Admin libera      │
    │ • Verificacion BTC│         │ • Verificacion req. │
    └───────────────────┘         └─────────────────────┘
```

### 12.3 Seguridad del Modo P2P

- Verificacion en blockchain via Blockstream API
- Confirmaciones minimas requeridas
- Registro de transacciones para disputas
- Entidad debe estar verificada previamente

---

*Documentacion generada: 2025-01-15*
*Version: 2.0.0 - Añadido sistema P2P descentralizado*
