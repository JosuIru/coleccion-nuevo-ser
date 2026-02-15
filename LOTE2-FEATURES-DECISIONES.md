# Lote 2 Features: Decisiones de Unificación (`v3` -> `actual`)

Fecha: 2026-02-15

## Sublote 2A aplicado

- **Archivo**: `www/js/features/help-center-modal.js`
- **Cambio aplicado**: acceso rápido al chat de soporte IA desde la sección de soporte.
- **Estrategia**: cambio aditivo (se mantiene formulario de soporte actual).
- **Commit**: `13e3a27`
- **Validación**:
  - Tests: `258 passed`
  - Lint archivo: OK

## Diferencias revisadas y no migradas (por seguridad)

- `www/js/features/ai-chat-modal.js`
  - `v3` elimina bloques de Knowledge Evolution presentes en `actual`.
  - Decisión: **no migrar** (riesgo de pérdida funcional).

- `www/js/features/support-chat.js`
  - `v3` elimina `systemContext` del payload.
  - Decisión: **no migrar** (posible degradación de calidad de respuestas).

- `www/js/features/token-purchase-modal.js`
  - `v3` agrega variable local no usada (`btcConfig`).
  - Decisión: **no migrar**.

- `www/js/features/entity-donation-modal.js`
  - Cambio cosmético en parámetro no usado.
  - Decisión: **no migrar**.

- `www/js/features/admin-debug-panel.js`
  - Cambios de variables no usadas / placeholders.
  - Decisión: **no migrar**.

- `www/js/features/my-account-modal.js`
  - Cambio menor sin impacto funcional claro.
  - Decisión: **no migrar**.

- `www/js/features/notes-modal.js`, `www/js/features/ai-premium.js`
  - Variantes de namespace/variables no usadas.
  - Decisión: **no migrar**.

## Observación estructural clave

`actual` está más avanzado en arquitectura modular para:
- `settings-modal/`
- `educators-kit/`
- `learning-paths/`
- `practice-timer/`

En `v3` esas piezas aparecen como archivos monolíticos (`*.js`) y no deben sustituir el diseño modular actual.

## Siguiente paso recomendado

Continuar con lote de alto valor:
1. `api/` (validación de seguridad por endpoint)
2. `supabase/` (plan de migraciones ordenado + rollback)

