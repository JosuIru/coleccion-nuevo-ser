# Plan de Unificacion v3 -> coleccion-nuevo-ser

## Directorio de trabajo recomendado
Trabajar en:
- `/home/josu/Documentos/guiaIT/25-11-25-version/coleccion-nuevo-ser`

Motivo:
- Es la linea mas nueva (`v2.9.408`) y estable (tests OK, lint sin errores bloqueantes).
- `coleccion-nuevo-ser-v3` esta en `v2.9.385` con gran volumen de cambios sin commit y regresiones de calidad.
- El `merge-base` confirma que `cb2c773` (v3) es ancestro de `coleccion-nuevo-ser`.

## Estrategia
No mezclar repositorios completos. Migrar por lotes funcionales desde `../coleccion-nuevo-ser-v3` hacia esta base.

## Preparacion (en coleccion-nuevo-ser)
1. Crear rama de integracion:
   - `git checkout -b chore/unificacion-v3`
2. Mantener fuera artefactos de build (dist, apk, logs).
3. Ejecutar gate minimo tras cada lote:
   - `npm run lint`
   - `npm test -- --runInBand`

## Lotes de migracion (orden)
1. `supabase` (migrations + functions)
2. `api` (endpoints PHP nuevos)
3. `www/js/features` (token/donaciones/soporte/verificacion)
4. `www/js/core` y `www/js/utils` relacionados
5. `www/css` + `www/index.html` + vistas
6. `android` y configuracion de plataforma
7. `package.json` y al final `package-lock.json`
8. `docs`

## Comandos de referencia para copiar por lote
Ejemplo lote API:
- `rsync -av --ignore-existing ../coleccion-nuevo-ser-v3/api/ ./api/`
- Revisar diffs: `git diff -- api/`

Ejemplo lote Supabase:
- `rsync -av ../coleccion-nuevo-ser-v3/supabase/functions/ ./supabase/functions/`
- `rsync -av ../coleccion-nuevo-ser-v3/supabase/migrations/ ./supabase/migrations/`
- Revisar diffs: `git diff -- supabase/`

## Criterios de aceptacion por lote
- Sin errores de lint.
- Tests existentes en verde.
- Sin secretos en archivos versionados.
- Sin cambios de dist/binarios en commit.

## Riesgos a vigilar
- Regresiones ya detectadas en v3 (regex unicode, safe-storage ESM/script, condicional con asignacion, XSS en `portal-seti-ia`).
- Orden de carga globales (`no-undef`) en modulos legacy.
- Migraciones destructivas o duplicadas.

## Definicion de listo para release
- Todos los lotes integrados en rama de unificacion.
- `npm run lint` sin errores.
- `npm test` verde.
- Build web/android validado.
- Checklist manual de pagos/donaciones/soporte/verificacion completado.
