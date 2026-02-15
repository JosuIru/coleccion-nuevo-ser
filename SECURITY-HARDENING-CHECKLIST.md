# Security Hardening Checklist

Fecha: 2026-02-15

## Variables de entorno (producción)

- `APP_ENV=production`
- `APP_ALLOWED_ORIGINS=https://gailu.net,https://www.gailu.net`
- `ENABLE_ADMIN_DEBUG_API=0`
- `ENABLE_DEBUG_ENDPOINTS=0`
- `ADMIN_DEBUG_TOKEN=<token-largo-aleatorio>`

## Secretos

- Rotar `CLAUDE_API_KEY` si estuvo expuesta localmente.
- Verificar que `api/config.php`:
  - no está versionado,
  - tiene permisos restringidos en servidor,
  - no se copia en backups públicos.

## CORS

- Reemplazar `Access-Control-Allow-Origin: *` en endpoints restantes:
  - `api/direct-btc-donation.php`
  - `api/donation-intent.php`
  - `api/admin-notification.php`
  - `api/entity-dispute.php`
  - `api/entity-endorsement.php`
  - `api/entity-verification.php`
  - `api/audio-proxy.php`
  - `api/check-version.php`
  - `api/huggingface-proxy.php`
  - `api/mistral-free-proxy.php`
  - `api/confirm-entity-donation-btc.php`
  - `api/create-entity-donation.php`

## Endpoints debug/setup

- Mantener bloqueados en producción:
  - `api/admin-debug-api.php`
  - `api/test-claude.php`
  - `api/check-error-table.php`
  - `api/setup-error-logs-table.php`
- Permitir solo con `ADMIN_DEBUG_TOKEN` y flags de entorno temporales.

## Verificación rápida local

Ejecutar:

```bash
bash scripts/security-audit-local.sh
```

Debe terminar en `PASS` antes de despliegue.

