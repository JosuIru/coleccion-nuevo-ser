# Deploy Security Runbook

Fecha: 2026-02-15

## Objetivo

Aplicar en producción los hardenings realizados:
- CORS por allowlist en `api/*.php`
- bloqueo de endpoints debug/setup en producción
- saneamiento de carga de secretos en `api/config.php`

## 1) Variables de entorno requeridas (producción)

Definir en servidor/API runtime:

- `APP_ENV=production`
- `APP_ALLOWED_ORIGINS=https://gailu.net,https://www.gailu.net`
- `ADMIN_DEBUG_TOKEN=<token-largo-aleatorio>`
- `ENABLE_ADMIN_DEBUG_API=0`
- `ENABLE_DEBUG_ENDPOINTS=0`

Secretos:

- `CLAUDE_API_KEY=<nueva-clave-rotada>`
- `MISTRAL_API_KEY=<si aplica>`
- `SUPABASE_URL=<url>`
- `SUPABASE_ANON_KEY=<anon>`
- `SUPABASE_SERVICE_KEY=<service>`
- `STRIPE_SECRET_KEY=<si aplica>`
- `STRIPE_WEBHOOK_SECRET=<si aplica>`
- `PAYPAL_CLIENT_ID=<si aplica>`
- `PAYPAL_CLIENT_SECRET=<si aplica>`
- `PAYPAL_WEBHOOK_ID=<si aplica>`

## 2) Rotación de clave Claude (obligatorio)

1. Generar nueva `CLAUDE_API_KEY` en Anthropic.
2. Actualizar variable de entorno en servidor.
3. Invalidar/revocar la clave anterior.
4. Reiniciar proceso PHP/FPM o recargar entorno.

## 3) Orden recomendado de despliegue

1. Actualizar variables de entorno.
2. Desplegar código backend/API.
3. Limpiar caches de PHP/opcache si aplica.
4. Ejecutar smoke tests.

## 4) Smoke tests post-deploy

## CORS
- Desde origen permitido (`gailu.net`): endpoints API deben responder normal.
- Desde origen no permitido: deben responder `403` con `Origin not allowed`.

## Debug endpoints
- `api/admin-debug-api.php` sin token: `401`.
- con `APP_ENV=production` y flags `0`: `403` o bloqueado.

## Flujos críticos
- Login + consumo IA (`ai-proxy` / `premium-ai-proxy`).
- soporte (`support-chat`).
- webhooks Stripe/PayPal (firma válida).
- donaciones/entidades (endpoints de create/confirm/verification).

## 5) Verificación local previa

```bash
bash scripts/security-audit-local.sh
```

Resultado esperado: `PASS`.

## 6) Rollback rápido

Si hay incidencia:
1. Revertir despliegue de código API al commit estable anterior.
2. Mantener variables de entorno seguras (no restaurar secretos viejos).
3. Revisar logs (`admin-debug-api` solo si habilitado temporalmente y seguro).

## 7) Estado actual resumido

- CORS wildcard eliminado en `api/*.php`.
- Endpoints debug críticos protegidos por flags/token.
- `create-admin-user.php` restringido a CLI.
- Auditoría local automatizada disponible en `scripts/security-audit-local.sh`.

