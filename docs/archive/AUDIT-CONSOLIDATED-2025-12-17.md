# AUDITORÍA CONSOLIDADA - COLECCIÓN NUEVO SER

**Fecha:** 17 de Diciembre de 2025
**Versión del Proyecto:** 2.9.32
**Tamaño Total:** 4.0 GB

---

## RESUMEN EJECUTIVO

El proyecto **Colección Nuevo Ser** es un ecosistema de aplicaciones educativas/transformacionales compuesto por:

1. **Webapp Principal (www)** - Biblioteca digital con 12 libros interactivos
2. **Laboratorio Frankenstein** - Gamificación de creación de "seres transformadores"
3. **Awakening Protocol** - Juego móvil React Native de crisis y misiones
4. **Backend Supabase** - Autenticación, pagos y IA

### Métricas Globales

| Métrica | Valor |
|---------|-------|
| **Líneas de Código Total** | ~120,000 LOC |
| **Archivos JavaScript** | 200+ |
| **Archivos CSS** | 50+ |
| **Migraciones SQL** | 1,100 líneas |
| **Edge Functions** | 1,488 líneas TypeScript |
| **Documentación** | 62 archivos markdown |
| **APKs en repositorio** | 413 MB (problema) |
| **Archivos sin commitear** | 128 |

### Puntuación General por Área

| Área | Puntuación | Estado |
|------|------------|--------|
| Documentación | 6.5/10 | ⚠️ Desorganizada |
| Webapp Principal | 5.5/10 | 🔴 Problemas de seguridad |
| Frankenstein Lab | 7.0/10 | ⚠️ Bugs de atributos |
| Awakening Protocol | 6.5/10 | ⚠️ API keys expuestas |
| Backend Supabase | 7.2/10 | ⚠️ Campos incorrectos |
| Build/Config | 4.0/10 | 🔴 Crítico - ProGuard off |

**PUNTUACIÓN GLOBAL: 6.1/10** - Funcional pero requiere trabajo significativo

---

## PROBLEMAS CRÍTICOS (P0) - RESOLVER INMEDIATAMENTE

### 1. 🔴 SEGURIDAD: Credenciales Supabase Expuestas en Frontend

**Ubicación:** `www/js/core/auth-helper.js`, `www/js/ai/ai-config.js`

```javascript
// EXPUESTO EN CÓDIGO FUENTE
const SUPABASE_URL = 'https://flxrilsxghiqfsfifxch.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

**Riesgo:** Cualquiera puede acceder a la API con estas credenciales
**Solución:** Mover a variables de entorno, usar proxy backend
**Tiempo:** 4 horas

---

### 2. 🔴 SEGURIDAD: Google Maps API Key Expuesta (Mobile Game)

**Ubicación:** `mobile-game/mobile-app/android/app/src/main/AndroidManifest.xml:20`

```xml
<meta-data
    android:name="com.google.android.geo.API_KEY"
    android:value="AIzaSyBLh4pc1FW8kB7iyNl2IEfX52opqLz-3EE" />
```

**Riesgo:** Uso malicioso, throttling, costos inesperados
**Solución:** Usar BuildConfig + gradle.properties
**Tiempo:** 1 hora

---

### 3. 🔴 SEGURIDAD: ProGuard Deshabilitado en APKs Release

**Ubicación:** `android/app/build.gradle:línea 48`

```gradle
minifyEnabled false  // ❌ CRÍTICO
```

**Riesgo:** Código completamente decompilable, ingeniería inversa trivial
**Solución:** Habilitar `minifyEnabled true` + proguard-rules.pro
**Tiempo:** 2 horas

---

### 4. 🔴 SEGURIDAD: Release APK Firmada con Debug Keystore (Mobile Game)

**Ubicación:** `mobile-game/mobile-app/android/app/build.gradle:29-34`

```gradle
signingConfigs {
    release {
        storeFile file("${System.properties['user.home']}/.android/debug.keystore")
        storePassword 'android'  // ❌ INSEGURO
    }
}
```

**Riesgo:** Imposible publicar en Play Store, fácil de explotar
**Solución:** Crear keystore de producción real
**Tiempo:** 1 hora

---

### 5. 🔴 BACKEND: Campos de BD Incorrectos en Edge Functions

**Ubicación:** `supabase/functions/ai-proxy/index.ts:69`

```typescript
// INCORRECTO:
.select('subscription_tier, ai_credits, ai_credits_total')

// CORRECTO:
.select('subscription_tier, ai_credits_remaining, ai_credits_total')
```

**Riesgo:** Función falla silenciosamente, créditos no se deducen
**Solución:** Corregir nombre del campo
**Tiempo:** 15 minutos

---

### 6. 🔴 BACKEND: Parámetros RPC Incorrectos en ElevenLabs TTS

**Ubicación:** `supabase/functions/elevenlabs-tts/index.ts:146`

```typescript
// INCORRECTO: Parámetros que no existen en la función SQL
.rpc('consume_ai_credits', {
  p_user_id: user.id,
  p_credits: creditsNeeded,
  p_context: 'elevenlabs_tts',      // ❌ No existe
  p_provider: 'elevenlabs',         // ❌ No existe
})
```

**Riesgo:** Edge function crashea, TTS no funciona
**Solución:** Adaptar llamada a función real
**Tiempo:** 30 minutos

---

### 7. 🔴 SEGURIDAD: XSS via innerHTML (58 archivos afectados)

**Ubicación:** Múltiples archivos en `www/js/`

```javascript
element.innerHTML = userInput;  // ❌ XSS VULNERABILITY
```

**Riesgo:** Inyección de scripts maliciosos
**Solución:** Usar textContent o sanitización
**Tiempo:** 8-12 horas (requiere revisión exhaustiva)

---

## PROBLEMAS ALTOS (P1) - RESOLVER ESTA SEMANA

### 8. ⚠️ FRANKENSTEIN: Atributos Inconsistentes entre Componentes

**Ubicación:** `frankenstein-avatar-system.js` vs `frankenstein-missions.js`

```javascript
// missions.js define estos atributos:
[reflection, analysis, creativity, empathy, communication, ...]

// avatar-system.js usa estos (NO EXISTEN):
if (attrs.courage > 70) { ... }    // ❌ 'courage' no definido
if (attrs.discipline > 70) { ... } // ❌ 'discipline' no definido
```

**Impacto:** Avatares no se personalizan correctamente, radar charts rotos
**Solución:** Unificar definición de atributos en archivo centralizado
**Tiempo:** 2 horas

---

### 9. ⚠️ BUILD: Conflicto de Versiones Capacitor

| Proyecto | Versión Capacitor |
|----------|-------------------|
| Colección Nuevo Ser | 6.0.0 |
| Frankenstein Lab | 5.0.0 |

**Impacto:** No se puede hacer `npm install` en la raíz
**Solución:** Actualizar Frankenstein a Capacitor 6.0.0
**Tiempo:** 4 horas + testing

---

### 10. ⚠️ BUILD: 413 MB de APKs en Repositorio

**Ubicación:** `www/downloads/*.apk`, `www/downloads/*.idsig`

```bash
# 44 archivos binarios que NO deberían estar en git
ls www/downloads/*.apk | wc -l  # 44 archivos
```

**Impacto:** Repo innecesariamente grande, clones lentos
**Solución:** `git rm --cached www/downloads/*.apk` + actualizar .gitignore
**Tiempo:** 30 minutos

---

### 11. ⚠️ BACKEND: Email Queue Sin Procesamiento Automático

**Ubicación:** Función `process_email_queue()` existe pero no está en cron

**Impacto:** Emails pueden no enviarse nunca
**Solución:** Configurar pg_cron en Supabase
**Tiempo:** 1 hora

---

### 12. ⚠️ MOBILE: Template Strings Mal Escapados

**Ubicación:** `mobile-game/mobile-app/src/services/MissionService.js:137`

```javascript
// INCORRECTO:
logger.info("`🚀 Desplegando ${beingIds.length} seres...`", "");

// CORRECTO:
logger.info(`🚀 Desplegando ${beingIds.length} seres...`, "");
```

**Impacto:** Logs no muestran variables
**Tiempo:** 15 minutos

---

### 13. ⚠️ MOBILE: BackgroundTimer Sin Cleanup

**Ubicación:** `MissionService.js`, `NotificationService.js`

**Impacto:** Memory leaks potenciales
**Solución:** Agregar cleanup en useEffect/dismount
**Tiempo:** 2 horas

---

### 14. ⚠️ WEBAPP: Archivo index.html Monolítico (86,936 líneas)

**Ubicación:** `www/index.html`

**Impacto:** Carga lenta, difícil mantenimiento, testing imposible
**Solución:** Modularizar en componentes
**Tiempo:** 20+ horas (proyecto grande)

---

## PROBLEMAS MEDIOS (P2) - RESOLVER ESTE MES

### Documentación
- [ ] Organizar 62 archivos markdown en estructura coherente
- [ ] Documentar sistema premium (actualmente 0% documentado)
- [ ] Crear documentación del juego móvil (0% documentado)
- [ ] Eliminar documentación obsoleta/duplicada

### Código
- [ ] Dividir `frankenstein-ui.js` (8000+ líneas) en módulos
- [ ] Implementar ErrorBoundary en React Native app
- [ ] Agregar rate limiting a Edge Functions
- [ ] Mejorar hash function en audio-cache (usar SHA-256)
- [ ] Validar permisos POST_NOTIFICATIONS en Android 13+

### Testing
- [ ] Implementar tests unitarios (cobertura actual: 0%)
- [ ] Configurar Jest para www/
- [ ] Configurar Detox E2E para mobile-game
- [ ] Crear test suite para Supabase functions

### CI/CD
- [ ] Implementar GitHub Actions workflow
- [ ] Automatizar build de APKs
- [ ] Agregar linting automático
- [ ] Configurar signing automático

---

## ESTADO DEL DESARROLLO POR MÓDULO

### 1. Webapp Principal (www)

| Feature | Estado | Completitud |
|---------|--------|-------------|
| Biblioteca de libros | ✅ Producción | 95% |
| Sistema de lectura | ✅ Producción | 90% |
| Quizzes | ✅ Producción | 85% |
| Audio/TTS | ⚠️ Beta | 70% |
| Sistema IA | ⚠️ Beta | 60% |
| Suscripciones Stripe | ⚠️ Beta | 75% |
| Frankenstein Lab (web) | ⚠️ Beta | 80% |

**Archivos críticos:**
- `www/index.html` - 86,936 líneas (TODO: modularizar)
- `www/js/core/biblioteca.js` - Lógica principal
- `www/js/features/ai-chat-modal.js` - Chat IA
- `www/js/core/auth-helper.js` - Autenticación

---

### 2. Laboratorio Frankenstein (Standalone)

| Feature | Estado | Completitud |
|---------|--------|-------------|
| Creación de seres | ✅ Producción | 90% |
| Sistema de misiones | ✅ Producción | 95% |
| Quiz integration | ✅ Producción | 85% |
| Avatares procedurales | ⚠️ Parcial | 70% |
| Microsociedades | ✅ Producción | 90% |
| Desafíos | ⚠️ Incompleto | 40% |
| Persistencia | ⚠️ Parcial | 50% |

**Bugs activos:**
- BUG-001: Atributos `courage` y `discipline` no definidos
- BUG-002: Sin manejo de errores en fetch de quizzes
- BUG-003: Data attributes sin validación

---

### 3. Awakening Protocol (Mobile Game)

| Feature | Estado | Completitud |
|---------|--------|-------------|
| Mapa interactivo | ✅ Producción | 90% |
| Sistema de seres | ✅ Producción | 85% |
| Crisis y misiones | ✅ Producción | 90% |
| Fractales de consciencia | ✅ Producción | 85% |
| Notificaciones push | ⚠️ Beta | 70% |
| Tutorial onboarding | ✅ Producción | 95% |
| Sistema de logros | ✅ Producción | 80% |
| Deep links | ✅ Producción | 85% |
| Sincronización servidor | ⚠️ Beta | 60% |

**Bugs activos:**
- API key expuesta en AndroidManifest
- Debug keystore en release
- Template strings mal escapados
- BackgroundTimer sin cleanup

---

### 4. Backend Supabase

| Feature | Estado | Completitud |
|---------|--------|-------------|
| Autenticación | ✅ Producción | 95% |
| Perfiles/suscripciones | ✅ Producción | 90% |
| RLS policies | ✅ Producción | 95% |
| AI Proxy | ⚠️ Roto | 30% |
| ElevenLabs TTS | ⚠️ Roto | 30% |
| Email queue | ⚠️ Incompleto | 60% |
| Stripe webhooks | ✅ Producción | 85% |
| Audio cache | ⚠️ Beta | 70% |

**Bugs activos:**
- Campo `ai_credits` incorrecto (debe ser `ai_credits_remaining`)
- Parámetros RPC incorrectos en elevenlabs-tts
- Email queue sin cron job

---

## PLAN DE ACCIÓN PRIORIZADO

### Semana 1: Seguridad Crítica

| Día | Tarea | Tiempo | Responsable |
|-----|-------|--------|-------------|
| L | Habilitar ProGuard en releases | 2h | Dev |
| L | Mover credenciales a env vars | 4h | Dev |
| M | Corregir campos BD en ai-proxy | 30m | Dev |
| M | Corregir RPC en elevenlabs-tts | 30m | Dev |
| M | Mover Google Maps key a BuildConfig | 1h | Dev |
| Mi | Crear keystore producción real | 1h | Dev |
| Mi | Remover APKs del repositorio | 1h | Dev |
| J | Configurar cron para email queue | 1h | Dev |
| J | Revisar y documentar XSS vulnerabilities | 4h | Dev |
| V | Testing de cambios de seguridad | 4h | QA |

**Horas estimadas Semana 1:** 20 horas

---

### Semana 2: Estabilidad y Bugs

| Tarea | Tiempo |
|-------|--------|
| Unificar atributos Frankenstein | 2h |
| Actualizar Frankenstein a Capacitor 6 | 4h |
| Corregir template strings en MissionService | 1h |
| Agregar cleanup de BackgroundTimer | 2h |
| Testing de Frankenstein Lab | 4h |
| Testing de Awakening Protocol | 4h |
| Documentar cambios | 2h |

**Horas estimadas Semana 2:** 19 horas

---

### Semana 3: Infraestructura

| Tarea | Tiempo |
|-------|--------|
| Implementar CI/CD básico (GitHub Actions) | 6h |
| Configurar linting automático | 2h |
| Implementar tests unitarios básicos | 8h |
| Configurar Sentry para error tracking | 2h |
| Documentar proceso de build | 2h |

**Horas estimadas Semana 3:** 20 horas

---

### Semana 4: Documentación y Limpieza

| Tarea | Tiempo |
|-------|--------|
| Organizar estructura de documentación | 4h |
| Documentar sistema premium | 3h |
| Documentar APIs de backend | 3h |
| Eliminar código muerto | 4h |
| Eliminar archivos obsoletos | 2h |
| Actualizar README principal | 2h |

**Horas estimadas Semana 4:** 18 horas

---

## MÉTRICAS DE ÉXITO

### Corto Plazo (1 mes)
- [ ] 0 vulnerabilidades críticas de seguridad
- [ ] ProGuard habilitado en todas las releases
- [ ] Sin credenciales expuestas en código
- [ ] CI/CD funcional para builds automáticos
- [ ] Cobertura de tests > 20%

### Medio Plazo (3 meses)
- [ ] Documentación 100% actualizada y organizada
- [ ] Cobertura de tests > 50%
- [ ] index.html modularizado
- [ ] frankenstein-ui.js dividido en módulos
- [ ] Rate limiting implementado en backend

### Largo Plazo (6 meses)
- [ ] App publicada en Play Store
- [ ] Cobertura de tests > 70%
- [ ] Performance: Lighthouse score > 80
- [ ] 0 bugs críticos activos
- [ ] Documentación multilingüe

---

## RECURSOS NECESARIOS

### Herramientas
- GitHub Actions (CI/CD)
- Sentry (error tracking)
- Jest + Detox (testing)
- ESLint + Prettier (code quality)

### Tiempo de Desarrollo
- **Total estimado:** 77 horas en 4 semanas
- **Recomendación:** 1 desarrollador full-time o 2 part-time

### Prioridades Absolutas (hacer ANTES de cualquier feature nuevo)
1. Habilitar ProGuard
2. Mover credenciales a env vars
3. Corregir bugs de backend (ai-proxy, elevenlabs-tts)
4. Crear keystore de producción

---

## CONCLUSIONES

El proyecto **Colección Nuevo Ser** es un ecosistema ambicioso y funcionalmente rico, pero presenta **problemas críticos de seguridad** que deben resolverse antes de cualquier lanzamiento público.

### Fortalezas
- ✅ Arquitectura bien pensada (separación de concerns)
- ✅ Múltiples plataformas (web, Android nativo, React Native)
- ✅ Sistema de gamificación innovador
- ✅ Backend robusto con Supabase
- ✅ RLS policies bien implementadas (44 políticas)

### Debilidades Críticas
- ❌ Credenciales expuestas en código fuente
- ❌ ProGuard deshabilitado (código decompilable)
- ❌ Bugs en funciones de backend críticas
- ❌ Sin CI/CD automatizado
- ❌ Testing inexistente (0% cobertura)
- ❌ Documentación desorganizada

### Recomendación Final

**NO PUBLICAR** ninguna versión hasta resolver los 7 problemas P0 de seguridad.

Una vez resueltos, el proyecto estará en condiciones de:
1. Publicarse en Play Store
2. Manejar usuarios reales con datos sensibles
3. Procesar pagos de forma segura
4. Escalar con confianza

---

**Auditoría realizada por:** Claude Code (6 agentes paralelos)
**Tiempo total de auditoría:** ~45 minutos
**Próxima auditoría recomendada:** Después de implementar fixes P0
