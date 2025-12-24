# Trascendencia - PRD y Desarrollo Inicial

## Vision
APK separada, simbionte de Coleccion Nuevo Ser y Awakening Protocol. Su rol es convertir aprendizaje en accion real con GPS + check-ins, usando seres y logros compartidos.

**Nombre:** Trascendencia
**Promesa:** Aprende, juega, siente, se consciente, evoluciona junto a tu planeta y juega.

## Objetivos
- Priorizar misiones reales (accion en territorio) sobre juego abstracto.
- Mantener compatibilidad total con seres/logros actuales.
- IA y sugerencias personalizadas segun plan del usuario.

## Core Loop (prioridad misiones reales)
1) Ritual breve (3-8 min) con texto guia del libro.
2) Mision real (GPS o check-in manual).
3) Evidencia y reflexion corta.
4) Recompensa y evolucion del Ser.
5) Sync con Coleccion/Frankenstein/Awakening.

## Tipos de misiones
- Ecologicas: territorio, residuos, agua, biodiversidad.
- Sociales: cuidado, comunidad, cooperacion.
- Interior: practica consciente, integracion.

## Integracion con ecosistema
- **Seres y logros compartidos**: usar `frankenstein_beings`, `frankenstein_user_stats`, `frankenstein_achievements`.
- **Deep links**: bidireccional con `nuevosser://` y `awakeningprotocol://`.
- **Sync**: reutilizar SyncBridge y Supabase. Nuevas tablas se agregan al final (migracion pendiente).

## IA y planes
- Gratis: sugerencias breves + validacion basica.
- Premium: guia personalizada, analisis del Ser, recomendaciones cruzadas.

## Estetica
Tecnologica + organica + natural. Paleta verde/ambar con acentos neon suaves. Sonidos naturales con pulsos digitales.

## Pantallas MVP
- Home: ritual del dia, estado del Ser, pulso global.
- Mision: detalle, GPS/check-in, evidencia, reflexion.
- Ser: atributos, logros, evolucion.
- Perfil/Plan: nivel, rachas, plan IA.

## Datos (sin migracion)
- Guardar progreso en `being_data.stats.trascendencia`.
- `frankenstein_user_stats` para rachas y XP.
- Misiones y check-ins locales hasta migracion final.

## Fases
**Fase 1 (MVP, sin migracion)**
- Modulo Trascendencia en RN con pantallas base.
- Sync basico de seres y stats.
- Deep links base.

**Fase 2 (IA por plan + pulso colectivo)**
- Prompts segmentados por plan.
- Eventos globales por misiones.

**Fase 3 (expansion)**
- Cooperativo y ranking por impacto real.
- Misiones avanzadas y temporadas.

## Entregables iniciales
- Modulo RN en `mobile-game/mobile-app/src/trascendencia/`.
- Configuracion de misiones y tipos.
- Servicios stub para sync y IA.

## Build separado
- Android flavors: `awakening` y `trascendencia` en `mobile-game/mobile-app/android/app/build.gradle`.
- Deep links por flavor (scheme + host).
- Cambiar `APP_VARIANT` a `trascendencia` para activar navegacion MVP.
