# Lote 1 Core: Decisiones de Unificación (`v3` -> `actual`)

Fecha: 2026-02-15

## Resultado

No se aplicaron cambios funcionales de `v3` en este lote porque:
- la mayoría eran diferencias de estilo/namespace ya resueltas en `actual`,
- o ya estaban presentes (intentos de merge generaron claves/keys duplicadas),
- o introducían warnings de lint.

## Archivos revisados (núcleo)

- `www/js/core/auth-helper.js`
  - Delta mínimo (3+ / 3-), orientado a nombres de variables no usadas.
  - Decisión: mantener `actual`.

- `www/js/core/book-engine.js`
  - Delta mínimo (1+ / 1-), parámetro no usado.
  - Decisión: mantener `actual`.

- `www/js/core/app-initialization.js`
  - Delta mínimo (2+ / 2-), acceso `window.X` vs `X`.
  - Decisión: mantener `actual` por consistencia global.

- `www/js/core/ai-utils.js`
  - Delta pequeño (5+ / 3-), incluye variables no usadas en rama `v3`.
  - Decisión: mantener `actual` (evita warnings).

- `www/js/core/biblioteca.js`
- `www/js/core/biblioteca/BibliotecaHandlers.js`
- `www/js/core/biblioteca/BibliotecaRenderer.js`
  - Deltas asociados a `window.BIBLIOTECA_CONFIG` vs `BIBLIOTECA_CONFIG`.
  - Decisión: mantener `actual` para no romper contratos globales existentes.

- `www/js/core/icons.js`
  - `v3` aporta `wrench`, pero ya existe en `actual`.
  - Decisión: sin cambios.

- `www/js/core/i18n.js`
  - `v3` aporta keys de menú/error, pero ya existen en `actual`.
  - Decisión: sin cambios (evitar duplicados).

## Validación

- Tests: `258 passed`
- Estado repo: limpio de cambios de código (solo `coverage/` sin trackear)

## Conclusión operativa

`core` en `actual` está al menos a la par de `v3` para este lote.  
Siguiente lote recomendado para avance real: **`www/js/features`** (migración selectiva por feature).

