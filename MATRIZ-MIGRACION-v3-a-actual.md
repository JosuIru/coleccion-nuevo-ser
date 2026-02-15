# Matriz de Migración: `coleccion-nuevo-ser-v3` -> `coleccion-nuevo-ser`

Fecha: 2026-02-15  
Base recomendada de trabajo: `coleccion-nuevo-ser`

## Estado actual

- `coleccion-nuevo-ser`: limpio (solo `coverage/` sin trackear), `master` ahead `49`.
- `coleccion-nuevo-ser-v3`: árbol muy sucio (`~92` entradas en status: `42 M`, `2 D`, `48 ??`).
- Ambos con `package.json` versión `2.9.397`.

## Resumen por módulos (v3)

- `www`: ~40 cambios (modificados + nuevos)
- `api`: ~21 cambios
- `supabase`: ~17 cambios
- `android`: ~3 cambios directos + artefactos de build
- raíz: cambios en `.gitignore`, `package.json`, `package-lock.json`, `capacitor.config.json`, SQL sueltos, `dist/`

## Matriz de priorización

| Módulo | Avance detectado en v3 | Riesgo de migración | Recomendación |
|---|---|---|---|
| `www/js/core` | Alto (muchos archivos diferentes) | Medio | Migrar por lotes temáticos + pruebas |
| `www/js/features` | Muy alto (muchas features nuevas/alteradas) | Alto | Migrar solo features validadas, no todo de golpe |
| `www/books` + `www/css` + `www/index.html` | Alto | Medio | Migrar tras core para evitar regressions UI |
| `api/` | Alto (muchos endpoints nuevos) | Alto | Revisar seguridad/autenticación por endpoint antes de traer |
| `supabase/` + migraciones SQL | Alto | Muy alto | Migrar con orden explícito de migraciones y backup DB |
| `android/` | Medio-bajo en código fuente, alto en artefactos | Medio | Ignorar artefactos de build, traer solo fuente útil |
| docs/reportes/apks | Muy alto volumen | Bajo (funcional), alto (ruido) | No migrar al core; archivar aparte |

## Lotes de unificación propuestos (seguros)

1. **Lote 1 (inmediato, bajo riesgo):**
   - `www/js/core` crítico: `auth-helper.js`, `book-engine.js`, `app-initialization.js`, `ai-utils.js`, `biblioteca*`, `book-reader*`.
   - Criterio: merge manual por archivo + `npm test` + lint.

2. **Lote 2 (medio):**
   - `www/js/features` de lectura/audio/IA ya existentes en actual.
   - Criterio: comparar feature por feature y mantener API estable.

3. **Lote 3 (medio-alto):**
   - `www/books`, `www/css`, `www/index.html`, assets selectivos.
   - Criterio: revisión visual y smoke test en app/web.

4. **Lote 4 (alto):**
   - `api/` endpoints nuevos y cambios de pagos/soporte/admin.
   - Criterio: checklist de seguridad y variables de entorno.

5. **Lote 5 (muy alto):**
   - `supabase/` funciones y migraciones SQL.
   - Criterio: plan de migración DB con rollback y validación de integridad.

## No migrar en bloque

- `dist/`
- `android/app/build/` y artefactos Gradle
- APKs y reportes históricos
- SQL sueltos sin trazabilidad/migración asociada

## Decisión operativa

Trabajar en: **`/home/josu/Documentos/guiaIT/25-11-25-version/coleccion-nuevo-ser`**  
Usar `v3` como **fuente de extracción controlada**, no como base principal.

