# Lote 3 Backend: Auditoría `api + supabase` (`v3` vs `actual`)

Fecha: 2026-02-15

## Resultado de comparación

- `api/`: misma cantidad de archivos en ambos directorios (27).
- `supabase/`: `v3` tiene 8 archivos extra no funcionales (`.temp`) y 2 SQL en `migrations_applied/`.
- Comparación de contenido:
  - `api/`: sin diferencias funcionales relevantes entre `v3` y `actual` (excepto `api/config.php`, archivo local sensible).
  - `supabase/functions`: sin diferencias de contenido detectadas.
  - `supabase/migrations` compartidas: sin diferencias de contenido detectadas.

Conclusión: **backend ya está prácticamente unificado**; no hay ganancia clara por “traer v3” en bloque.

## Hallazgos críticos de seguridad

1. **Secreto en texto plano (local)**
   - Archivo: `api/config.php`
   - Hallazgo: contiene clave real de `CLAUDE_API_KEY` en texto plano.
   - Estado Git: `api/config.php` está ignorado por `.gitignore`, pero sigue siendo riesgo local/operacional.
   - Acción recomendada:
     - Rotar la clave inmediatamente en proveedor.
     - Regenerar `api/config.php` con secreto nuevo y control de acceso del servidor.
     - Evitar copiar este archivo fuera del entorno seguro.

2. **CORS permisivo en endpoints sensibles**
   - Múltiples endpoints usan `Access-Control-Allow-Origin: *`.
   - Impacto: mayor superficie de abuso desde orígenes no confiables.
   - Acción recomendada:
     - Restringir `Origin` por lista blanca de dominios productivos.
     - Mantener `OPTIONS` controlado y validar cabeceras.

3. **Endpoints administrativos/diagnóstico expuestos**
   - Ejemplos: `api/admin-debug-api.php`, `api/create-admin-user.php`, `api/test-claude.php`, scripts de setup.
   - Acción recomendada:
     - Proteger por entorno (`production` deny) + token admin robusto + IP allowlist.
     - Deshabilitar o retirar de producción los scripts de prueba/setup.

## Estado de migración recomendado

- `api`: **No migrar desde v3** (ya equivalente).
- `supabase/functions`: **No migrar desde v3** (ya equivalente).
- `supabase/migrations`: usar solo plan ordenado interno; ignorar `migrations_applied/` y `.temp`.

## Próximo lote sugerido (hardening)

1. Endurecer CORS en `api/*.php` críticos.
2. Gate de entorno para endpoints debug/setup.
3. Checklist de secretos (rotación + verificación de no exposición accidental).
4. Prueba smoke de webhooks Stripe/PayPal con firmas válidas.

