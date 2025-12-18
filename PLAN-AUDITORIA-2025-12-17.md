# PLAN MAESTRO DE AUDITORÍA Y MEJORAS
## Colección Nuevo Ser - 17 de Diciembre 2025

---

## ÍNDICE

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Estado Actual del Proyecto](#estado-actual)
3. [Fase 1: Correcciones Críticas](#fase-1-correcciones-críticas)
4. [Fase 2: Limpieza y Organización](#fase-2-limpieza-y-organización)
5. [Fase 3: Accesibilidad WCAG](#fase-3-accesibilidad-wcag)
6. [Fase 4: UX y Usabilidad](#fase-4-ux-y-usabilidad)
7. [Fase 5: Diseño y Consistencia Visual](#fase-5-diseño-y-consistencia-visual)
8. [Fase 6: Código y Arquitectura](#fase-6-código-y-arquitectura)
9. [Fase 7: Documentación y Testing](#fase-7-documentación-y-testing)
10. [Cronograma Sugerido](#cronograma-sugerido)
11. [Métricas de Éxito](#métricas-de-éxito)
12. [Anexos Técnicos](#anexos-técnicos)

---

## RESUMEN EJECUTIVO

### Alcance de la Auditoría
- **421 archivos JavaScript** auditados
- **32 archivos CSS** analizados
- **50+ archivos HTML** revisados
- **91,084 líneas de código** evaluadas
- **~3.3 GB** de proyecto total

### Hallazgos Principales

| Categoría | Críticos | Altos | Medios | Bajos | Total |
|-----------|----------|-------|--------|-------|-------|
| Navegación | 1 | 7 | 3 | 1 | 12 |
| UX/Usabilidad | 3 | 8 | 4 | 0 | 15 |
| Accesibilidad | 3 | 5 | 6 | 0 | 14 |
| Diseño/Iconos | 1 | 5 | 6 | 0 | 12 |
| Código/Errores | 3 | 8 | 15 | 5 | 31 |
| Organización | 2 | 4 | 4 | 2 | 12 |
| **TOTAL** | **13** | **37** | **38** | **8** | **96** |

### Estimación Total de Trabajo
- **Tiempo total estimado**: 80-100 horas
- **Espacio recuperable**: ~645 MB (20% del proyecto)
- **Archivos a eliminar/consolidar**: ~200+

---

## ESTADO ACTUAL

### Puntuación por Área (sobre 100)

```
Navegación          ████████████████░░░░  65/100
UX/Usabilidad       ███████████████████░  75/100
Accesibilidad       █████████░░░░░░░░░░░  45/100  ⚠️ CRÍTICO
Diseño/Estética     ████████████░░░░░░░░  60/100
Código/Calidad      ███████████░░░░░░░░░  55/100
Organización        ████████░░░░░░░░░░░░  40/100  ⚠️ CRÍTICO
```

### Cumplimiento WCAG 2.1

| Nivel | Estado Actual | Objetivo |
|-------|---------------|----------|
| Nivel A | 45% | 100% |
| Nivel AA | 30% | 85% |
| Nivel AAA | 10% | 40% |

---

## FASE 1: CORRECCIONES CRÍTICAS
**Prioridad**: INMEDIATA
**Tiempo estimado**: 20-24 horas
**Objetivo**: Eliminar bloqueadores, riesgos de seguridad y fallos de accesibilidad críticos

### 1.1 Enlaces Rotos y Navegación Crítica

#### Checklist:

- [ ] **1.1.1** Corregir enlace en `www/about.html:833`
  - Cambiar: `href="legal/privacy.html"`
  - Por: `href="legal/privacy-policy.html"`

- [ ] **1.1.2** Corregir enlace en `www/about.html:834`
  - Cambiar: `href="legal/terms.html"`
  - Por: `href="legal/terms-of-service.html"`

- [ ] **1.1.3** Añadir navegación header en `www/index.html`
  - Copiar estructura de nav de `about.html:164-179`
  - Adaptar estilos responsive

- [ ] **1.1.4** Añadir botón "Volver a Biblioteca" en `www/js/core/book-reader.js`
  - Ubicación: función `renderSidebar()` aprox línea 104
  - Agregar botón con `onclick` que navegue a `index.html`

### 1.2 Accesibilidad Crítica (WCAG Nivel A)

#### Checklist:

- [ ] **1.2.1** Añadir alt text a imagen avatar
  - Archivo: `www/index.html:2301`
  - Código: `alt="Avatar del ser ${being.name || 'Usuario'}"`

- [ ] **1.2.2** Implementar escape key handler en modales
  - Archivos afectados:
    - [ ] `www/js/features/auth-modal.js`
    - [ ] `www/js/features/settings-modal.js`
    - [ ] `www/js/features/search-modal.js`
    - [ ] `www/js/features/ai-chat-modal.js`
    - [ ] `www/js/features/pricing-modal.js`
  - Código a añadir en cada modal:
    ```javascript
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });
    ```

- [ ] **1.2.3** Implementar focus trap en modales
  - Crear función reutilizable `trapFocus(modalElement)`
  - Aplicar en todos los modales del checklist 1.2.2

- [ ] **1.2.4** Añadir skip links a páginas principales
  - Archivos:
    - [ ] `www/index.html`
    - [ ] `www/about.html`
    - [ ] `www/lab.html`
    - [ ] `www/frankenstein-lab.html`
    - [ ] `www/frankenstein-web.html`
  - Código:
    ```html
    <a href="#main-content" class="skip-link">Saltar al contenido principal</a>
    ```

- [ ] **1.2.5** Remover `user-scalable=no` de viewports
  - Archivo: `www/lab.html:5`
  - Cambiar viewport meta para permitir zoom

### 1.3 Seguridad Crítica

#### Checklist:

- [ ] **1.3.1** Crear función de sanitización HTML
  - Crear: `www/js/core/sanitizer.js`
  - Funciones: `sanitizeHTML()`, `escapeHTML()`
  - Opción: integrar DOMPurify

- [ ] **1.3.2** Refactorizar innerHTML críticos (Top 10 prioritarios)
  - [ ] `www/js/features/ai-chat-modal.js:59` - Mensajes de chat
  - [ ] `www/js/features/frankenstein-ui.js` - Contenido dinámico
  - [ ] `www/js/features/settings-modal.js` - Datos de usuario
  - [ ] `www/js/features/auth-modal.js` - Formularios
  - [ ] `www/js/features/pricing-modal.js` - Planes
  - [ ] `www/js/core/biblioteca.js` - Catálogo de libros
  - [ ] `www/js/core/book-reader.js` - Contenido de capítulos
  - [ ] `www/js/features/search-modal.js` - Resultados de búsqueda
  - [ ] `www/js/features/progress-dashboard.js` - Estadísticas
  - [ ] `www/js/core/enhanced-ui-system.js` - Toasts

- [ ] **1.3.3** Mover API keys fuera del frontend
  - Archivo: `www/js/ai/ai-config.js:74-94`
  - Crear proxy en Supabase Edge Functions
  - Eliminar almacenamiento de keys en localStorage

- [ ] **1.3.4** Añadir .catch() a promesas críticas
  - [ ] `www/js/core/elevenlabs-tts-provider.js:312`
  - [ ] `www/js/ai/ai-adapter.js:32`
  - [ ] `mobile-game/mobile-app/src/services/MissionService.js:88,91`
  - [ ] `mobile-game/mobile-app/src/services/CrisisService.js:55,59,62`

### 1.4 UX Crítica

#### Checklist:

- [ ] **1.4.1** Crear modal de confirmación personalizado
  - Crear: `www/js/core/confirm-modal.js`
  - Funciones: `showConfirm({ title, message, confirmText, cancelText, destructive, onConfirm })`
  - Estilos: añadir a `www/css/core.css`

- [ ] **1.4.2** Reemplazar window.confirm() nativos
  - [ ] `www/js/core/auth-helper.js:637`
  - [ ] `www/js/core/auth-helper.js:757`
  - [ ] `www/js/core/auth-helper.js:767`
  - Buscar otros con: `grep -r "window.confirm\|confirm(" www/js/`

- [ ] **1.4.3** Añadir indicador de carga en lazy loading
  - Archivo: `www/js/core/lazy-loader.js`
  - Añadir callback `onProgress(loaded, total)`
  - Mostrar: "Cargando módulo 3/10..."

---

## FASE 2: LIMPIEZA Y ORGANIZACIÓN
**Prioridad**: ALTA
**Tiempo estimado**: 20-24 horas
**Objetivo**: Eliminar redundancias, reducir tamaño del proyecto, mejorar mantenibilidad

### 2.1 Eliminación de Archivos Obsoletos (SEGUROS)

#### Checklist:

- [ ] **2.1.1** Eliminar directorio `_www/` completo
  - Ruta: `/coleccion-nuevo-ser/_www/`
  - Tamaño: 164 MB
  - Verificar: que `www/` contenga todo lo necesario
  - Comando: `rm -rf _www/`

- [ ] **2.1.2** Eliminar build artifacts de Android
  - [ ] `/android/app/build/` (149 MB)
  - [ ] `/frankenstein-standalone/android/app/build/` (52 MB)
  - Regenerables con: `./gradlew clean build`

- [ ] **2.1.3** Limpiar APKs antiguos en `/www/downloads/`
  - Mantener solo últimas 2 versiones de cada producto:
    - [ ] coleccion-nuevo-ser: v2.9.35, v2.9.36
    - [ ] frankenstein-lab: v1.3.3, v1.3.4
    - [ ] awakening-protocol: v1.0.3, v1.0.4
  - Eliminar resto (~280 MB)

- [ ] **2.1.4** Eliminar archivos de log
  - [ ] `install-logs.txt` (218 MB)

- [ ] **2.1.5** Eliminar backups obsoletos
  - [ ] `www/books/manual-practico/index-standalone-backup.html`
  - [ ] `www/books/practicas-radicales/index-standalone-backup.html`

### 2.2 Consolidación de Archivos Duplicados

#### Checklist CSS:

- [ ] **2.2.1** Crear directorio `shared-assets/css/`
  - Mover archivos compartidos entre www/ y frankenstein-standalone/

- [ ] **2.2.2** Unificar `awakening-theme.css` (6 copias → 1)
  - Fuente única: `shared-assets/css/awakening-theme.css`
  - Symlinks o imports desde:
    - [ ] `www/css/`
    - [ ] `frankenstein-standalone/www/css/`
    - [ ] Builds de Android

- [ ] **2.2.3** Unificar archivos Frankenstein CSS
  - [ ] `frankenstein-base.css` (6 copias)
  - [ ] `frankenstein-components.css` (6 copias)
  - [ ] `frankenstein-animations.css` (6 copias)
  - [ ] `frankenstein-ux-improvements.css` (6 copias)
  - [ ] `mobile-enhancements.css` (6 copias)

#### Checklist JS:

- [ ] **2.2.4** Crear directorio `shared-assets/js/features/`

- [ ] **2.2.5** Unificar archivos Frankenstein JS
  - [ ] `frankenstein-demo-data.js` (6 copias)
  - [ ] `frankenstein-ui.js` (6 copias)
  - [ ] `frankenstein-quiz.js` (6 copias)
  - [ ] `frankenstein-missions.js` (6 copias)
  - [ ] `frankenstein-settings.js` (6 copias)
  - [ ] `frankenstein-avatar-system.js` (6 copias)

### 2.3 Consolidación de Sistemas Redundantes

#### Checklist Audio:

- [ ] **2.3.1** Auditar sistemas de audio existentes
  - [ ] `audioreader.js` - ¿Activo?
  - [ ] `enhanced-audioreader.js` - ¿Reemplaza al anterior?
  - [ ] `frankenstein-audio.js` - ¿Específico de Frankenstein?
  - [ ] `radical-audio-system.js` - ¿Se usa?
  - [ ] `audio-mixer.js` - ¿Necesario?
  - [ ] `audio-processor.js` - ¿Necesario?
  - [ ] `binaural-audio.js` - Feature específico
  - [ ] `audio-visualizer.js` - Feature específico

- [ ] **2.3.2** Consolidar en máximo 3 sistemas:
  - `audio-core.js` - Funcionalidad base
  - `audio-tts.js` - Text-to-speech
  - `audio-effects.js` - Binaural, visualizer, etc.

#### Checklist Quiz:

- [ ] **2.3.3** Auditar sistemas de quiz
  - [ ] `interactive-quiz.js` - General
  - [ ] `frankenstein-quiz.js` - Específico
  - [ ] Quizzes en microsocieties

- [ ] **2.3.4** Consolidar en sistema único configurable

### 2.4 Limpieza de Console.logs

#### Checklist:

- [ ] **2.4.1** Habilitar logger.js correctamente
  - Archivo: `www/js/core/logger.js`
  - Descomentar métodos (líneas 26, 32, 43, 50)
  - Configurar por entorno (dev/prod)

- [ ] **2.4.2** Reemplazar console.log por logger
  - Total archivos afectados: 133
  - Archivos prioritarios (más de 10 console.log):
    - [ ] `www/js/features/frankenstein-ui.js`
    - [ ] `www/js/core/elevenlabs-tts-provider.js`
    - [ ] `www/js/features/settings-modal.js`
    - [ ] `frankenstein-standalone/www/js/features/frankenstein-ui.js`

- [ ] **2.4.3** Configurar logger para producción
  - Deshabilitar logs en builds de producción
  - Mantener solo errores críticos

### 2.5 Organización de Documentación

#### Checklist:

- [ ] **2.5.1** Crear estructura de docs/
  ```
  docs/
  ├── guides/           # Guías de usuario
  ├── technical/        # Documentación técnica
  ├── archive/          # Históricos
  └── api/              # Documentación de API
  ```

- [ ] **2.5.2** Mover archivos históricos a `docs/archive/`
  - [ ] `FASE-3-COMPLETADA.md`
  - [ ] `FASE-4-COMPLETADA.md`
  - [ ] `FASE-4-INTEGRACION.md`
  - [ ] `AUDIT-REPORT-2024-12-16.md`
  - [ ] `AUDITORIA-CODIGO-v3.1.0.md`
  - [ ] CHANGELOGs antiguos

- [ ] **2.5.3** Consolidar guías duplicadas
  - [ ] `HERRAMIENTAS-ECOSISTEMA.md` + `GUIA-HERRAMIENTAS-ECOSISTEMA.md` → uno solo

- [ ] **2.5.4** Mantener en raíz solo esenciales
  - `README.md`
  - `CLAUDE.md`
  - `SETUP-PRODUCTION.md`
  - `COMIENZA-AQUI.md`
  - `CHANGELOG.md` (solo actual)

---

## FASE 3: ACCESIBILIDAD WCAG
**Prioridad**: ALTA
**Tiempo estimado**: 18-22 horas
**Objetivo**: Alcanzar cumplimiento WCAG 2.1 Nivel AA

### 3.1 Atributos ARIA

#### Checklist aria-label:

- [ ] **3.1.1** Añadir aria-label a botones icónicos
  - [ ] Botones de cerrar modal (×)
  - [ ] Botones de navegación (←, →)
  - [ ] Botones de audio (▶, ⏸, ⏹)
  - [ ] Botones de configuración (⚙)
  - [ ] Botones de menú hamburguesa (☰)

- [ ] **3.1.2** Archivos específicos a modificar:
  - [ ] `www/js/features/auth-modal.js:94` - Botón cerrar
  - [ ] `www/js/features/audioreader.js` - Controles de audio
  - [ ] `www/js/core/book-reader.js` - Navegación
  - [ ] `www/lab.html:167` - Banner close

#### Checklist aria-live:

- [ ] **3.1.3** Implementar regiones aria-live
  - [ ] Crear anunciador global en `enhanced-ui-system.js`
  - [ ] Anunciar cambios de estado en quizzes
  - [ ] Anunciar progreso de misiones
  - [ ] Anunciar mensajes de chat AI

- [ ] **3.1.4** Configurar aria-live por tipo
  - `polite`: Notificaciones, toasts, progreso
  - `assertive`: Errores, alertas críticas

#### Checklist aria-hidden:

- [ ] **3.1.5** Añadir aria-hidden="true" a elementos decorativos
  - [ ] Emojis en headers (🧬, 📚, ✨)
  - [ ] Iconos de estado (✓, ✗)
  - [ ] Elementos de fondo animados
  - [ ] Separadores visuales

#### Checklist roles:

- [ ] **3.1.6** Añadir roles a modales
  - Todos los modales: `role="dialog" aria-modal="true"`
  - Archivos del checklist 1.2.2

- [ ] **3.1.7** Añadir aria-expanded a elementos expandibles
  - [ ] Sidebars colapsables
  - [ ] Acordeones
  - [ ] Menús desplegables
  - [ ] FAQs expandibles

### 3.2 Estructura Semántica

#### Checklist:

- [ ] **3.2.1** Validar jerarquía de headings
  - Regla: h1 → h2 → h3 (sin saltar niveles)
  - Archivos JS que generan headings dinámicos:
    - [ ] `www/js/features/frankenstein-ui.js`
    - [ ] `www/js/core/book-reader.js`
    - [ ] `www/js/core/biblioteca.js`

- [ ] **3.2.2** Verificar landmarks semánticos
  - [ ] `<header>` en todas las páginas
  - [ ] `<nav>` para navegación
  - [ ] `<main>` para contenido principal
  - [ ] `<footer>` en todas las páginas
  - [ ] `<aside>` para sidebars

### 3.3 Formularios Accesibles

#### Checklist:

- [ ] **3.3.1** Verificar labels en todos los inputs
  - Cada input debe tener `<label for="id">` asociado
  - Archivos prioritarios:
    - [ ] `www/js/features/auth-modal.js`
    - [ ] `www/js/features/settings-modal.js`
    - [ ] `www/js/features/admin-panel-modal.js`

- [ ] **3.3.2** Implementar aria-invalid para validación
  ```javascript
  input.setAttribute('aria-invalid', 'true');
  input.setAttribute('aria-describedby', 'error-id');
  ```

- [ ] **3.3.3** Añadir aria-required a campos obligatorios

- [ ] **3.3.4** Añadir aria-describedby para mensajes de error

### 3.4 Contraste y Visuales

#### Checklist:

- [ ] **3.4.1** Verificar contraste WCAG AA (4.5:1)
  - [ ] Texto sobre fondos gradientes
  - [ ] Texto sobre fondos semitransparentes
  - [ ] Estados hover/focus
  - [ ] Placeholder text

- [ ] **3.4.2** Corregir colores problemáticos
  - [ ] `#fbbf24` sobre fondos oscuros → usar `#d4a000`
  - [ ] Revisar `.loading-bar` background

- [ ] **3.4.3** Implementar `prefers-reduced-motion`
  ```css
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
    }
  }
  ```
  - Archivo: `www/css/core.css`

- [ ] **3.4.4** Mejorar focus visible en modales
  - Aumentar z-index del outline
  - Verificar visibilidad sobre overlays

---

## FASE 4: UX Y USABILIDAD
**Prioridad**: MEDIA
**Tiempo estimado**: 16-20 horas
**Objetivo**: Mejorar experiencia de usuario y feedback visual

### 4.1 Feedback de Carga

#### Checklist:

- [ ] **4.1.1** Mejorar lazy loading feedback
  - Archivo: `www/js/core/lazy-loader.js`
  - Mostrar progreso: "Cargando módulo 3/10"
  - Añadir barra de progreso visual

- [ ] **4.1.2** Añadir skeleton loaders donde faltan
  - [ ] Catálogo de libros
  - [ ] Lista de misiones
  - [ ] Panel de configuración

- [ ] **4.1.3** Estandarizar spinners de botones
  - Crear clase `.btn-loading`
  - Aplicar en todos los botones de submit

### 4.2 Validación de Formularios

#### Checklist:

- [ ] **4.2.1** Implementar validación en tiempo real
  - Archivo: `www/js/features/auth-modal.js`
  - Mostrar ✓/✗ mientras se escribe
  - Feedback inmediato de errores

- [ ] **4.2.2** Crear barra de fortaleza de contraseña
  - Componente reutilizable
  - Niveles: Débil, Media, Fuerte, Muy Fuerte
  - Feedback visual con colores

- [ ] **4.2.3** Mejorar mensajes de error
  - Específicos: "El email ya existe", "Contraseña muy corta"
  - En español consistente
  - Ubicación clara junto al campo

- [ ] **4.2.4** Añadir indicadores de campo requerido
  - Asterisco (*) visible
  - O texto "(requerido)"

### 4.3 Estados Vacíos

#### Checklist:

- [ ] **4.3.1** Crear componente EmptyState reutilizable
  ```javascript
  showEmptyState({
    icon: '📚',
    title: 'No hay contenido',
    description: 'Mensaje explicativo...',
    action: { text: 'Acción', onClick: fn }
  });
  ```

- [ ] **4.3.2** Aplicar en todos los listados
  - [ ] Resultados de búsqueda vacíos
  - [ ] Lista de libros vacía
  - [ ] Misiones sin datos
  - [ ] Historial vacío

- [ ] **4.3.3** Añadir ilustraciones SVG por contexto
  - Búsqueda: lupa con interrogación
  - Libros: estante vacío
  - Misiones: mapa en blanco

### 4.4 Botones y Estados

#### Checklist:

- [ ] **4.4.1** Implementar estado loading en botones
  ```javascript
  button.classList.add('loading');
  button.disabled = true;
  button.innerHTML = '<span class="spinner"></span> Procesando...';
  ```

- [ ] **4.4.2** Mejorar hover states
  - Aumentar contraste en hover
  - Transiciones suaves (200ms)
  - Feedback táctil en móvil

- [ ] **4.4.3** Implementar confirmación visual post-acción
  - Cambio de color a verde
  - Icono checkmark temporal
  - Toast de éxito

### 4.5 Modales

#### Checklist:

- [ ] **4.5.1** Mejorar scroll en modales
  - Añadir shadow gradient cuando hay más contenido
  - Clase `.modal-scroll-hint`

- [ ] **4.5.2** Gestión de body scroll
  - Añadir clase `modal-open` al body
  - Restaurar scroll en cleanup
  - Prevenir scroll del fondo

- [ ] **4.5.3** Estandarizar cierre de modales
  - Click en backdrop cierra
  - Escape key cierra
  - Botón X visible

### 4.6 Onboarding

#### Checklist:

- [ ] **4.6.1** Hacer tutorial accesible desde settings
  - Añadir opción "Mostrar tutorial nuevamente"
  - Archivo: `www/js/features/settings-modal.js`

- [ ] **4.6.2** Mejorar transiciones entre pasos
  - Fade out paso anterior
  - Fade in paso nuevo
  - Duración: 300ms

- [ ] **4.6.3** Añadir indicador de progreso
  - "Paso 3 de 10"
  - O barra de progreso visual

### 4.7 Sistema de Undo

#### Checklist:

- [ ] **4.7.1** Crear sistema de undo para acciones destructivas
  - Mantener registro durante 30 segundos
  - Toast con botón "Deshacer"

- [ ] **4.7.2** Aplicar en acciones críticas
  - [ ] Eliminar notas
  - [ ] Limpiar progreso
  - [ ] Eliminar seres creados

---

## FASE 5: DISEÑO Y CONSISTENCIA VISUAL
**Prioridad**: MEDIA
**Tiempo estimado**: 14-18 horas
**Objetivo**: Unificar sistema de diseño y eliminar inconsistencias

### 5.1 Sistema de Iconos

#### Checklist:

- [ ] **5.1.1** Decidir sistema de iconos
  - Opción A: Implementar Lucide Icons (ya cargado, sin usar)
  - Opción B: Crear sprite SVG personalizado
  - Opción C: Estandarizar uso de emojis

- [ ] **5.1.2** Si Opción A (Lucide):
  - Inicializar en HTML: `lucide.createIcons()`
  - Reemplazar emojis críticos por SVG
  - Documentar uso

- [ ] **5.1.3** Si Opción B o C permanece con emojis:
  - Eliminar carga de Lucide (~30KB)
  - Documentar qué emoji usar para qué función
  - Añadir aria-hidden a todos los decorativos

- [ ] **5.1.4** Resolver iconos con significados múltiples
  - 🧬 → Definir uso único (Lab o Genética)
  - ⚙ → Solo para settings
  - Crear documento de referencia

### 5.2 Paleta de Colores

#### Checklist:

- [ ] **5.2.1** Crear `color-system.css` centralizado
  ```css
  :root {
    /* Colores primarios */
    --color-primary: #0ea5e9;
    --color-secondary: #a855f7;
    --color-accent: #d4a000; /* WCAG AA compliant */

    /* Colores de estado */
    --color-success: #10b981;
    --color-warning: #f59e0b;
    --color-error: #ef4444;
    --color-info: #3b82f6;

    /* Fondos */
    --color-bg-primary: #0f172a;
    --color-bg-secondary: #1e293b;

    /* Texto */
    --color-text-primary: #e2e8f0;
    --color-text-secondary: #94a3b8;
  }
  ```

- [ ] **5.2.2** Unificar color accent
  - Reemplazar `#fbbf24` por `#d4a000` donde corresponda
  - Archivos afectados:
    - [ ] `www/css/frankenstein-lab.css`
    - [ ] `www/css/themes/manifiesto.css`

- [ ] **5.2.3** Documentar paleta por tema
  - Crear sección en DESIGN-SYSTEM.md
  - Incluir ratios de contraste

### 5.3 Tipografía

#### Checklist:

- [ ] **5.3.1** Definir jerarquía tipográfica
  ```css
  /* Texto base */
  body { font-family: 'Inter', system-ui, sans-serif; }

  /* Headings nivel 1-2 (temas históricos) */
  .heading-display { font-family: 'Cinzel', serif; }

  /* Headings nivel 3+ */
  h3, h4, h5, h6 { font-family: 'Inter', sans-serif; font-weight: 600; }
  ```

- [ ] **5.3.2** Eliminar fuentes no utilizadas
  - [ ] Playfair Display (nunca se carga)
  - [ ] Space Grotesk (usado una vez)

- [ ] **5.3.3** Verificar carga de Google Fonts
  - Inter: verificar preconnect
  - Cinzel: verificar preconnect

### 5.4 Espaciados

#### Checklist:

- [ ] **5.4.1** Migrar a design-tokens.css
  - Reemplazar valores hardcodeados por variables
  - Archivos prioritarios:
    - [ ] `www/css/frankenstein-components.css`
    - [ ] `www/css/frankenstein-lab.css`

- [ ] **5.4.2** Estandarizar escala de espaciado
  ```css
  --space-1: 0.25rem;  /* 4px */
  --space-2: 0.5rem;   /* 8px */
  --space-3: 0.75rem;  /* 12px */
  --space-4: 1rem;     /* 16px */
  --space-6: 1.5rem;   /* 24px */
  --space-8: 2rem;     /* 32px */
  --space-12: 3rem;    /* 48px */
  ```

### 5.5 Sombras y Bordes

#### Checklist:

- [ ] **5.5.1** Unificar sistema de sombras
  - Usar exclusivamente variables de design-tokens.css
  - Eliminar sombras custom en frankenstein-components.css

- [ ] **5.5.2** Estandarizar border-radius
  - Pequeño: 4px (inputs, pequeños elementos)
  - Medio: 8px (cards, buttons)
  - Grande: 12px (modales, contenedores)
  - Circular: 50% (avatares, badges)

### 5.6 Z-index

#### Checklist:

- [ ] **5.6.1** Crear escala de z-index
  ```css
  --z-dropdown: 1000;
  --z-sticky: 1020;
  --z-fixed: 1030;
  --z-modal-backdrop: 1040;
  --z-modal: 1050;
  --z-popover: 1060;
  --z-tooltip: 1070;
  --z-toast: 1080;
  ```

- [ ] **5.6.2** Reemplazar z-index hardcodeados
  - Eliminar `z-index: 9999`
  - Usar variables definidas

---

## FASE 6: CÓDIGO Y ARQUITECTURA
**Prioridad**: MEDIA-BAJA
**Tiempo estimado**: 16-20 horas
**Objetivo**: Mejorar calidad de código y reducir deuda técnica

### 6.1 Variables Globales

#### Checklist:

- [ ] **6.1.1** Auditar variables en window
  - Crear lista de todas las globales actuales (~30)
  - Determinar cuáles son necesarias

- [ ] **6.1.2** Encapsular en namespaces
  ```javascript
  window.NuevoSer = {
    logger: new Logger(),
    authHelper: new AuthHelper(),
    toast: new ToastSystem(),
    // ...
  };
  ```

- [ ] **6.1.3** Migrar a módulos ES6 (largo plazo)
  - Crear plan de migración gradual
  - Empezar por módulos nuevos

### 6.2 Event Listeners

#### Checklist:

- [ ] **6.2.1** Implementar cleanup en componentes
  - Cada componente debe tener método `destroy()`
  - Remover listeners en destroy

- [ ] **6.2.2** Archivos prioritarios
  - [ ] `www/js/features/audio-visualizer.js`
  - [ ] `www/js/features/binaural-modal.js`
  - [ ] `www/js/features/search-modal.js`
  - [ ] `www/js/features/progress-dashboard.js`
  - [ ] `www/js/features/cosmos-navigation.js`

### 6.3 Timers

#### Checklist:

- [ ] **6.3.1** Auditar setInterval/setTimeout
  - Total encontrados: 253
  - Verificar cleanup en cada uno

- [ ] **6.3.2** Implementar gestión centralizada
  ```javascript
  class TimerManager {
    constructor() { this.timers = new Map(); }
    set(id, callback, delay) { ... }
    clear(id) { ... }
    clearAll() { ... }
  }
  ```

- [ ] **6.3.3** Archivos prioritarios
  - [ ] `www/js/features/settings-modal.js`
  - [ ] `www/js/features/ai-chat-modal.js`
  - [ ] `mobile-game/mobile-app/src/services/MissionService.js`

### 6.4 Manejo de Errores

#### Checklist:

- [ ] **6.4.1** Crear manejador global de errores
  ```javascript
  window.onerror = (msg, url, line, col, error) => {
    logger.error('Global error', { msg, url, line, col, error });
    // Opcional: enviar a servicio de monitoreo
  };
  ```

- [ ] **6.4.2** Estandarizar try/catch
  - Todas las llamadas async deben tener catch
  - Mensajes de error útiles para usuario

- [ ] **6.4.3** Implementar error boundaries (si aplica React)

### 6.5 Código Muerto

#### Checklist:

- [ ] **6.5.1** Eliminar TODOs sin implementar
  - [ ] `www/js/features/practice-library.js:668-681` - addToPlan vacío
  - [ ] `www/js/core/book-reader.js:2028` - navegación entre libros
  - [ ] `www/js/features/organism-knowledge.js` - múltiples TODOs
  - [ ] `www/js/features/exploration-hub.js` - múltiples TODOs

- [ ] **6.5.2** Eliminar funciones no referenciadas
  - Usar herramienta de análisis estático
  - Verificar manualmente antes de eliminar

### 6.6 Archivos Grandes

#### Checklist:

- [ ] **6.6.1** Dividir archivos > 2000 líneas
  | Archivo | Líneas | Acción |
  |---------|--------|--------|
  | frankenstein-ui.js | 7,728 | Dividir en 4-5 módulos |
  | organism-knowledge.js | 3,836 | Dividir en 2-3 módulos |
  | book-reader.js | 2,681 | Extraer lógica de nav |
  | audioreader.js | 2,547 | Extraer player logic |
  | biblioteca.js | 2,031 | Extraer helpers |

---

## FASE 7: DOCUMENTACIÓN Y TESTING
**Prioridad**: BAJA
**Tiempo estimado**: 12-16 horas
**Objetivo**: Facilitar mantenimiento futuro y prevenir regresiones

### 7.1 Sistema de Diseño

#### Checklist:

- [ ] **7.1.1** Crear `docs/DESIGN-SYSTEM.md`
  - Paleta de colores con códigos hex
  - Escala tipográfica
  - Sistema de espaciado
  - Componentes disponibles
  - Uso de iconos

- [ ] **7.1.2** Crear guía de componentes
  - Documentar cada componente reutilizable
  - Ejemplos de uso
  - Props/opciones disponibles

### 7.2 Guías de Desarrollo

#### Checklist:

- [ ] **7.2.1** Crear `docs/CONTRIBUTING.md`
  - Convenciones de código
  - Proceso de PR
  - Testing requerido

- [ ] **7.2.2** Crear `docs/ARCHITECTURE.md`
  - Estructura de carpetas
  - Flujo de datos
  - Dependencias entre módulos

### 7.3 Testing

#### Checklist:

- [ ] **7.3.1** Configurar Jest
  ```bash
  npm install --save-dev jest @testing-library/dom
  ```

- [ ] **7.3.2** Tests prioritarios
  - [ ] `www/js/core/auth-helper.js` - Autenticación
  - [ ] `www/js/core/lazy-loader.js` - Carga de módulos
  - [ ] `www/js/core/toast.js` - Notificaciones
  - [ ] `www/js/features/auth-modal.js` - Modal de auth

- [ ] **7.3.3** Configurar axe-core para a11y
  ```bash
  npm install --save-dev jest-axe
  ```

### 7.4 Linting

#### Checklist:

- [ ] **7.4.1** Configurar ESLint
  ```bash
  npm install --save-dev eslint eslint-plugin-import
  ```

- [ ] **7.4.2** Crear `.eslintrc.js`
  - Reglas para console.log
  - Reglas para variables no usadas
  - Reglas para promesas

- [ ] **7.4.3** Configurar pre-commit hooks
  ```bash
  npm install --save-dev husky lint-staged
  ```

---

## CRONOGRAMA SUGERIDO

### Vista General (6 semanas)

```
Semana 1:  ████████████████████  Fase 1 (Críticos)
Semana 2:  ████████████████████  Fase 2 (Limpieza)
Semana 3:  ████████████████░░░░  Fase 3 (A11y) - Inicio
Semana 4:  ░░░░████████████████  Fase 3 (A11y) - Fin + Fase 4 (UX) - Inicio
Semana 5:  ░░░░░░░░████████████  Fase 4 (UX) - Fin + Fase 5 (Diseño)
Semana 6:  ░░░░░░░░░░░░████████  Fase 6 (Código) + Fase 7 (Docs)
```

### Desglose por Semana

| Semana | Días | Tareas | Horas |
|--------|------|--------|-------|
| 1 | L-V | Fase 1 completa | 20-24h |
| 2 | L-V | Fase 2 completa | 20-24h |
| 3 | L-J | Fase 3.1-3.3 | 14-16h |
| 4 | V + L-M | Fase 3.4 + Fase 4.1-4.3 | 12-14h |
| 5 | M-V | Fase 4.4-4.7 + Fase 5 | 16-18h |
| 6 | L-V | Fase 6 + Fase 7 | 14-18h |

### Hitos Clave

| Fecha | Hito | Entregable |
|-------|------|------------|
| Fin Sem 1 | Críticos resueltos | 0 errores bloqueadores |
| Fin Sem 2 | Proyecto limpio | -500MB, estructura clara |
| Fin Sem 3 | WCAG A cumplido | 100% Nivel A |
| Fin Sem 4 | WCAG AA parcial | 80% Nivel AA |
| Fin Sem 5 | UX mejorado | Feedback consistente |
| Fin Sem 6 | Proyecto estable | Tests, docs, linting |

---

## MÉTRICAS DE ÉXITO

### Antes vs Después

| Métrica | Actual | Objetivo Fase 2 | Objetivo Final |
|---------|--------|-----------------|----------------|
| Tamaño proyecto | 3.3 GB | 2.8 GB | 2.5 GB |
| Archivos CSS | 32 | 20 | 18 |
| Archivos duplicados | ~200 | 50 | 0 |
| Console.logs prod | 133 archivos | 50 | 0 |
| innerHTML sin sanitizar | 265 | 100 | 0 |
| WCAG Nivel A | 45% | 80% | 100% |
| WCAG Nivel AA | 30% | 60% | 85% |
| Variables globales | 30+ | 20 | 10 |
| Archivos >2000 líneas | 6 | 4 | 0 |

### KPIs de Calidad

- [ ] 0 enlaces rotos
- [ ] 0 errores de consola en producción
- [ ] 100% botones con aria-label
- [ ] 100% modales con escape key
- [ ] 100% imágenes con alt
- [ ] 0 window.confirm() nativos
- [ ] <3s tiempo de carga inicial

---

## ANEXOS TÉCNICOS

### A. Archivos Críticos por Categoría

#### Navegación
```
www/about.html:833-834
www/index.html
www/js/core/book-reader.js:104-150
www/js/core/book-engine.js:198-228
www/js/core/biblioteca.js:577-606
```

#### Accesibilidad
```
www/index.html:2301
www/lab.html:5
www/js/features/auth-modal.js:94
www/js/core/enhanced-ui-system.js:30-50
www/css/core.css:136-144
```

#### Seguridad
```
www/js/ai/ai-config.js:74-94
www/js/features/ai-chat-modal.js:59
www/js/features/frankenstein-ui.js
www/js/core/auth-helper.js:191
```

#### UX
```
www/js/core/auth-helper.js:637,757,767
www/js/core/lazy-loader.js
www/js/features/auth-modal.js:144-250
www/js/core/toast.js
```

### B. Comandos Útiles

```bash
# Buscar console.log
grep -r "console.log" www/js/ --include="*.js" | wc -l

# Buscar innerHTML
grep -r "\.innerHTML\s*=" www/js/ --include="*.js" | wc -l

# Buscar window.confirm
grep -r "window.confirm\|confirm(" www/js/ --include="*.js"

# Buscar archivos duplicados
find . -name "awakening-theme.css" 2>/dev/null

# Tamaño de directorios
du -sh _www/ android/app/build/ www/downloads/

# Contar líneas por archivo
find www/js -name "*.js" -exec wc -l {} + | sort -rn | head -20
```

### C. Dependencias a Instalar

```bash
# Testing
npm install --save-dev jest @testing-library/dom jest-axe

# Linting
npm install --save-dev eslint eslint-plugin-import

# Hooks
npm install --save-dev husky lint-staged

# Sanitización (opcional)
npm install dompurify

# Accesibilidad audit
npm install --save-dev pa11y axe-core
```

### D. Referencias WCAG

- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [Understanding WCAG 2.1](https://www.w3.org/WAI/WCAG21/Understanding/)
- [Techniques for WCAG 2.1](https://www.w3.org/WAI/WCAG21/Techniques/)

---

## NOTAS FINALES

### Recomendaciones Generales

1. **No hacer todo a la vez**: Seguir las fases en orden
2. **Testear después de cada cambio**: Especialmente en Fase 1
3. **Hacer backups antes de eliminar**: Especialmente en Fase 2
4. **Documentar decisiones**: Para futuros desarrolladores
5. **Priorizar accesibilidad**: Es requisito legal en muchos países

### Riesgos a Considerar

| Riesgo | Mitigación |
|--------|------------|
| Romper funcionalidad existente | Testing exhaustivo post-cambio |
| Eliminar archivo necesario | Backup antes de eliminar |
| Inconsistencia entre plataformas | Sincronizar www/ y standalone/ |
| Regresiones de accesibilidad | Tests automatizados con axe |

### Contacto para Dudas

- Revisar `CLAUDE.md` para guías del proyecto
- Consultar `docs/` para documentación existente
- Crear issues en GitHub para tracking

---

*Documento generado: 17 de Diciembre de 2025*
*Versión: 1.0*
*Próxima revisión sugerida: Después de completar Fase 2*
