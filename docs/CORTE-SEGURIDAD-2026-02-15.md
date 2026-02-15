# Release Cut 2026-02-15

## Tag de corte

`release-2026-02-15-security-hardening`

## Objetivo del corte

Consolidar auditoría + hardening de seguridad backend/API y dejar runbooks operativos de despliegue.

## Cambios clave incluidos

1. Auditoría y matriz de migración
- `MATRIZ-MIGRACION-v3-a-actual.md`
- `LOTE1-CORE-DECISIONES.md`
- `LOTE2-FEATURES-DECISIONES.md`
- `LOTE3-BACKEND-API-SUPABASE-AUDITORIA.md`

2. Tests/cobertura
- suite adicional para `ai-utils`, `book-engine`, `auth-helper`
- estado validado: tests en verde durante la ejecución de lotes

3. Hardening de API
- eliminación de `Access-Control-Allow-Origin: *` en `api/*.php`
- CORS por allowlist con `APP_ALLOWED_ORIGINS`
- bloqueo de endpoints debug/setup en producción:
  - `api/admin-debug-api.php`
  - `api/test-claude.php`
  - `api/check-error-table.php`
  - `api/setup-error-logs-table.php`
- `api/create-admin-user.php` restringido a CLI

4. Operación y seguridad
- `SECURITY-HARDENING-CHECKLIST.md`
- `DEPLOY-SECURITY-RUNBOOK.md`
- `scripts/security-audit-local.sh` (auditoría local automatizada)

## Variables de entorno críticas

- `APP_ENV=production`
- `APP_ALLOWED_ORIGINS=https://gailu.net,https://www.gailu.net`
- `ADMIN_DEBUG_TOKEN=<token-largo-aleatorio>`
- `ENABLE_ADMIN_DEBUG_API=0`
- `ENABLE_DEBUG_ENDPOINTS=0`

## Pendiente operativo obligatorio

- Rotar `CLAUDE_API_KEY` en proveedor y actualizar entorno de servidor.

## Comandos de verificación recomendados

```bash
bash scripts/security-audit-local.sh
php -l api/admin-debug-api.php
php -l api/premium-ai-proxy.php
php -l api/support-chat.php
```

