#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "== Security Audit (local) =="
echo "Repo: $ROOT_DIR"
echo

fail=0

section() {
  echo
  echo "---- $1 ----"
}

section "1) Potential real secrets in api/config.php"
if [[ -f api/config.php ]]; then
  if rg -n "sk-ant-|sk_live_|whsec_|AKIA[0-9A-Z]{16}|eyJ[a-zA-Z0-9_-]{20,}" api/config.php >/tmp/security_audit_secrets.txt 2>/dev/null; then
    echo "WARNING: posible secreto detectado en api/config.php"
    cat /tmp/security_audit_secrets.txt
    fail=1
  else
    echo "OK: no patrones de secreto detectados en api/config.php"
  fi
else
  echo "INFO: api/config.php no existe en este entorno"
fi

section "2) Wildcard CORS in API endpoints"
if rg -n "Access-Control-Allow-Origin:\s*\*" api/*.php >/tmp/security_audit_cors.txt 2>/dev/null; then
  echo "WARNING: endpoints con CORS wildcard detectados:"
  cat /tmp/security_audit_cors.txt
  fail=1
else
  echo "OK: no hay CORS wildcard en api/*.php"
fi

section "3) Debug/setup endpoints without production guards"
if rg -n "admin-debug-api|test-claude|setup-error-logs-table|check-error-table|create-admin-user" api/*.php >/tmp/security_audit_debug_files.txt 2>/dev/null; then
  echo "INFO: endpoints debug/setup presentes:"
  cat /tmp/security_audit_debug_files.txt
else
  echo "OK: no endpoints debug/setup detectados"
fi

if rg -n "ENABLE_DEBUG_ENDPOINTS|ENABLE_ADMIN_DEBUG_API|ADMIN_DEBUG_TOKEN" \
  api/admin-debug-api.php api/test-claude.php api/check-error-table.php api/setup-error-logs-table.php >/dev/null 2>&1; then
  echo "OK: guardas de debug detectadas en endpoints críticos"
else
  echo "WARNING: faltan guardas de debug en endpoints críticos"
  fail=1
fi

section "4) Required env vars checklist"
required_vars=(
  "APP_ENV"
  "APP_ALLOWED_ORIGINS"
  "ADMIN_DEBUG_TOKEN"
)

for v in "${required_vars[@]}"; do
  if [[ -n "${!v:-}" ]]; then
    echo "OK: $v set"
  else
    echo "WARN: $v not set in current shell"
  fi
done

section "Result"
if [[ "$fail" -eq 0 ]]; then
  echo "PASS: no hallazgos críticos automáticos."
  exit 0
fi

echo "FAIL: hay hallazgos que requieren acción."
exit 1
