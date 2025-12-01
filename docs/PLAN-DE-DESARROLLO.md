# 📋 PLAN DE DESARROLLO - COLECCIÓN NUEVO SER v2.0.0

## 🎯 OBJETIVO

Crear un ecosistema modular de libros interactivos que:
- Unifica "El Código del Despertar" y "Manifiesto de la Conciencia Compartida"
- Permite añadir fácilmente nuevos libros en el futuro
- Mantiene identidad visual única para cada libro
- Comparte infraestructura (IA, notas, progreso)

---

## 📊 ESTADO ACTUAL

### ✅ Completado:
- [x] Estructura de carpetas creada
- [x] Catálogo maestro (catalog.json)
- [x] Configuraciones de libros (config.json)
- [x] Decisiones de arquitectura confirmadas

### 🔄 En Progreso:
- [ ] Extracción de contenido del Manifiesto
- [ ] Desarrollo del motor de libros
- [ ] Pantalla Home de la biblioteca

### ⏳ Pendiente:
- [ ] Migración del Código del Despertar
- [ ] Sistema de referencias cruzadas
- [ ] Compilación y deploy

---

## 🗓️ FASES DE DESARROLLO

### FASE 1: PREPARACIÓN (1-2 días) ⏳ ACTUAL

#### 1.1 Extracción de Contenido del Manifiesto
**Duración:** 4-6 horas

**Tareas:**
- [ ] Convertir todos los .docx a texto plano
- [ ] Estructurar en formato JSON compatible
- [ ] Identificar capítulos, secciones, epígrafes
- [ ] Extraer preguntas de reflexión
- [ ] Crear lista de acciones sugeridas por capítulo
- [ ] Generar timeline de movimientos históricos
- [ ] Compilar recursos externos mencionados

**Archivos a crear:**
- `books/manifiesto/book.json` (contenido completo)
- `books/manifiesto/assets/timeline.json` (timeline histórico)
- `books/manifiesto/assets/resources.json` (enlaces externos)
- `books/manifiesto/assets/actions.json` (acciones por capítulo)

#### 1.2 Migración del Código del Despertar
**Duración:** 2-3 horas

**Tareas:**
- [ ] Copiar app.js actual de PRODUCTION
- [ ] Extraer bookData a formato JSON separado
- [ ] Crear `books/codigo-despertar/book.json`
- [ ] Mantener compatibilidad con estructura actual
- [ ] Verificar que no se pierdan meditaciones

**Archivos a crear:**
- `books/codigo-despertar/book.json`

#### 1.3 Sistema de IA Compartido
**Duración:** 1-2 horas

**Tareas:**
- [ ] Copiar ai-adapter.js de PRODUCTION
- [ ] Copiar ai-config.js de PRODUCTION
- [ ] Crear contextos específicos por libro
- [ ] Implementar sistema de modos de IA

**Archivos a crear:**
- `js/ai/ai-adapter.js` (copiado)
- `js/ai/ai-config.js` (copiado)
- `js/ai/contexts/codigo-despertar.txt`
- `js/ai/contexts/manifiesto-critical.txt`
- `js/ai/contexts/manifiesto-constructive.txt`
- `js/ai/contexts/manifiesto-historical.txt`

---

### FASE 2: DESARROLLO CORE (2-3 días)

#### 2.1 Motor Universal de Libros
**Duración:** 6-8 horas

**Componente:** `js/core/book-engine.js`

**Funciones principales:**
```javascript
class BookEngine {
  constructor(bookId)
  loadBook(bookId)
  getCurrentChapter()
  navigateToChapter(chapterId)
  getProgress()
  saveProgress(chapterData)
  applyTheme(themeConfig)
  renderContent(content)
  handleCrossReferences()
}
```

**Responsabilidades:**
- Cargar dinámicamente cualquier libro desde catalog.json
- Gestionar navegación entre capítulos/secciones
- Aplicar tema visual específico del libro
- Renderizar contenido con formato Markdown
- Detectar y mostrar referencias cruzadas
- Guardar progreso de lectura

#### 2.2 Pantalla Home (Biblioteca)
**Duración:** 4-6 horas

**Componente:** `js/core/biblioteca.js`

**Funciones principales:**
```javascript
class Biblioteca {
  constructor()
  loadCatalog()
  renderBookGrid()
  showBookDetails(bookId)
  getGlobalProgress()
  searchGlobal(query)
  renderStats()
  handleBookSelection(bookId)
}
```

**Elementos UI:**
- Grid de libros con portadas
- Barra de progreso global
- Estadísticas de lectura
- Búsqueda global
- Filtros por categoría/tag
- Botón "Próximamente" para futuros libros

#### 2.3 Sistema de Temas Dinámicos
**Duración:** 3-4 horas

**Componente:** `js/core/theme-manager.js`

**CSS a crear:**
- `css/core.css` (estilos base)
- `css/themes/codigo-despertar.css`
- `css/themes/manifiesto.css`

**Funcionalidad:**
- Cargar tema CSS dinámicamente
- Aplicar colores de config.json
- Activar animaciones específicas (estrellas vs geométrico)
- Transiciones suaves entre temas

#### 2.4 Renderizador de Contenido
**Duración:** 2-3 horas

**Componente:** `js/core/content-renderer.js`

**Funciones:**
- Parsear Markdown básico
- Renderizar epígrafes
- Mostrar ejercicios/meditaciones
- Renderizar preguntas de reflexión
- Mostrar acciones sugeridas
- Integrar referencias cruzadas

---

### FASE 3: FEATURES ESPECÍFICAS (2-3 días)

#### 3.1 Feature: Meditaciones (Código del Despertar)
**Duración:** 3-4 horas

**Componente:** `js/features/meditation-player.js`

**Funcionalidad:**
- Reutilizar código actual de meditaciones
- Adaptar a arquitectura modular
- Mantener timer, pasos, reflexión

#### 3.2 Feature: Reflexiones Críticas (Manifiesto)
**Duración:** 2-3 horas

**Componente:** `js/features/critical-reflections.js`

**UI:**
```
┌────────────────────────────────────┐
│ 🔍 REFLEXIÓN CRÍTICA               │
├────────────────────────────────────┤
│ ¿Cómo se manifiesta esta premisa   │
│ en tu vida diaria?                 │
│                                    │
│ [Escribe tu reflexión...]          │
│                                    │
│ [GUARDAR] [SIGUIENTE PREGUNTA]     │
└────────────────────────────────────┘
```

#### 3.3 Feature: Tracker de Acciones (Manifiesto)
**Duración:** 3-4 horas

**Componente:** `js/features/action-tracker.js`

**UI:**
```
┌────────────────────────────────────┐
│ ⚡ TOMA ACCIÓN                      │
├────────────────────────────────────┤
│ Acciones sugeridas:                │
│                                    │
│ □ Identifica una institución que   │
│   perpetúe la escasez artificial   │
│   [Individual - Fácil]             │
│                                    │
│ □ Organiza un círculo de estudio   │
│   sobre economía alternativa       │
│   [Comunitaria - Moderado]         │
│                                    │
│ ☑ Investiga cooperativas locales   │
│   ✓ Completada hace 2 días         │
│                                    │
│ Progreso: 12 de 54 acciones (22%)  │
└────────────────────────────────────┘
```

#### 3.4 Feature: Timeline Histórico (Manifiesto)
**Duración:** 2-3 horas

**Componente:** `js/features/timeline-viewer.js`

**Datos:** `books/manifiesto/assets/timeline.json`

**UI:**
```
┌────────────────────────────────────┐
│ 📅 LÍNEA TEMPORAL                  │
├────────────────────────────────────┤
│ Movimientos de transformación:     │
│                                    │
│ 1789 ━━ Revolución Francesa        │
│ 1871 ━━ Comuna de París            │
│ 1936 ━━ Colectivizaciones España   │
│ 1968 ━━ Mayo Francés               │
│ 2011 ━━ Occupy Wall Street         │
│ 2019 ━━ Movimientos climáticos     │
│                                    │
│ [Filtrar: Económicos ▼]            │
└────────────────────────────────────┘
```

#### 3.5 Feature: Modo Debate IA (Manifiesto)
**Duración:** 2-3 horas

**Componente:** `js/features/ai-debate-mode.js`

**UI:**
```
┌────────────────────────────────────┐
│ 🤖 MODO DEBATE                     │
├────────────────────────────────────┤
│ Elige perspectiva:                 │
│ [●] Crítico Sistémico              │
│ [ ] Constructor de Alternativas    │
│ [ ] Historiador de Movimientos     │
├────────────────────────────────────┤
│ Tú: ¿Es posible una economía sin   │
│     crecimiento infinito?          │
│                                    │
│ IA (Crítico): El concepto mismo de │
│ "crecimiento" es una trampa...     │
└────────────────────────────────────┘
```

---

### FASE 4: INTEGRACIÓN Y REFERENCIAS (1-2 días)

#### 4.1 Sistema de Referencias Cruzadas
**Duración:** 4-5 horas

**Componente:** `js/data/cross-references.js`

**Funcionalidad:**
- Leer crossReferences de catalog.json
- Detectar cuando usuario está en un capítulo referenciado
- Mostrar sugerencias de lectura relacionada
- Permitir navegación rápida entre libros

**UI en capítulo:**
```
┌────────────────────────────────────┐
│ 🔗 EXPLORAR MÁS                    │
├────────────────────────────────────┤
│ Este tema se complementa con:      │
│                                    │
│ 🔥 Manifiesto · Cap. 5             │
│ "La Conciencia como Fundamento"    │
│                                    │
│ Perspectiva: Política              │
│ [IR AL CAPÍTULO] [MARCAR]          │
└────────────────────────────────────┘
```

#### 4.2 Búsqueda Global
**Duración:** 3-4 horas

**Componente:** `js/data/search-engine.js`

**Funcionalidad:**
- Indexar contenido de todos los libros
- Buscar en: títulos, contenido, notas, ejercicios
- Resultados agrupados por libro
- Highlight de términos encontrados

#### 4.3 Sistema de Datos Unificado
**Duración:** 2-3 horas

**Componente:** `js/data/user-data.js`

**Estructura localStorage:**
```javascript
{
  userProfile: {
    id, name, createdAt, preferences
  },
  library: {
    books: [
      {
        id: "codigo-despertar",
        progress: 0.65,
        chaptersCompleted: [...],
        notes: [...],
        bookmarks: [...],
        meditationsCompleted: 12
      },
      {
        id: "manifiesto",
        progress: 0.10,
        chaptersCompleted: [...],
        reflections: [...],
        actions: [...]
      }
    ],
    globalStats: {...}
  }
}
```

---

### FASE 5: UI/UX Y PULIDO (1-2 días)

#### 5.1 index.html Principal
**Duración:** 2-3 horas

**Archivo:** `www/index.html`

**Estructura:**
```html
<!DOCTYPE html>
<html>
<head>
  <title>Colección Nuevo Ser</title>
  <link rel="stylesheet" href="css/core.css">
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
  <div id="app">
    <!-- Pantalla de carga -->
    <div id="splash-screen"></div>

    <!-- Biblioteca (Home) -->
    <div id="biblioteca-view"></div>

    <!-- Lector de libros -->
    <div id="book-reader-view"></div>
  </div>

  <script src="js/core/biblioteca.js"></script>
  <script src="js/core/book-engine.js"></script>
  <script src="js/core/theme-manager.js"></script>
  <script src="js/ai/ai-adapter.js"></script>
  <script src="js/data/user-data.js"></script>
  <script src="js/app.js"></script>
</body>
</html>
```

#### 5.2 Transiciones y Animaciones
**Duración:** 2-3 horas

**CSS:**
- Transiciones suaves entre biblioteca ↔ libro
- Cambio de tema fluido
- Animaciones de carga
- Efectos hover

#### 5.3 Responsive Design
**Duración:** 2-3 horas

**Breakpoints:**
- Mobile: 320px - 640px
- Tablet: 641px - 1024px
- Desktop: 1025px+

**Adaptaciones:**
- Grid de libros: 1 col (mobile), 2 col (tablet), 3 col (desktop)
- Sidebar collapsible en móvil
- Botones táctiles grandes

---

### FASE 6: ANDROID APP (1 día)

#### 6.1 Configuración Capacitor
**Duración:** 2-3 horas

**Tareas:**
- [ ] Copiar configuración de app-final
- [ ] Actualizar capacitor.config.json
- [ ] Configurar AndroidManifest.xml
- [ ] Actualizar build.gradle

**Archivos:**
```
android/
├── app/
│   ├── build.gradle (v2.0.0)
│   └── src/main/
│       ├── AndroidManifest.xml
│       └── res/
│           ├── mipmap-*/ic_launcher.png (nuevo logo)
│           └── values/strings.xml
└── gradle.properties
```

#### 6.2 Íconos y Splash Screen
**Duración:** 1-2 horas

**Tareas:**
- [ ] Diseñar nuevo logo "Colección Nuevo Ser"
- [ ] Generar iconos para todas las resoluciones
- [ ] Crear splash screen unificado
- [ ] Configurar colores de tema Android

#### 6.3 Compilación y Testing
**Duración:** 2-3 horas

**Proceso:**
```bash
cd coleccion-nuevo-ser
npx cap sync
cd android
./gradlew assembleDebug
# Test en dispositivo
./gradlew assembleRelease
# Firmar APK
```

**APK Final:**
- Nombre: `ColeccionNuevoSer-v2.0.0.apk`
- Tamaño estimado: 8-10 MB
- Versión: 2.0.0 (versionCode 20)

---

### FASE 7: WEB DEPLOY (medio día)

#### 7.1 Preparación para Web
**Duración:** 1-2 horas

**Tareas:**
- [ ] Optimizar assets (imágenes, JSON)
- [ ] Minificar JS/CSS (opcional)
- [ ] Crear service worker para PWA (opcional)
- [ ] Configurar .htaccess

#### 7.2 Estructura en Servidor
**Duración:** 1 hora

**En gailu.net:**
```
/public_html/
├── desarrollo/cd/ (mantener app actual por ahora)
└── coleccion/ (NUEVA)
    ├── index.html
    ├── css/
    ├── js/
    ├── books/
    ├── assets/
    └── downloads/
        └── ColeccionNuevoSer-v2.0.0.apk
```

#### 7.3 Deploy y Verificación
**Duración:** 1 hora

**Checklist:**
- [ ] Subir todos los archivos vía FTP
- [ ] Verificar que index.html carga
- [ ] Probar navegación entre libros
- [ ] Verificar IA funciona con proxy
- [ ] Probar en móvil y desktop
- [ ] Verificar descarga de APK

**URLs:**
- Web: `https://gailu.net/coleccion/`
- APK: `https://gailu.net/coleccion/downloads/ColeccionNuevoSer-v2.0.0.apk`

---

### FASE 8: DOCUMENTACIÓN (medio día)

#### 8.1 Guía de Usuario
**Archivo:** `docs/GUIA-USUARIO.md`

**Contenido:**
- Cómo navegar la biblioteca
- Cómo usar cada feature (meditaciones, acciones, etc.)
- Cómo configurar IA
- FAQ

#### 8.2 Guía Técnica
**Archivo:** `docs/GUIA-TECNICA.md`

**Contenido:**
- Arquitectura del sistema
- Cómo añadir un nuevo libro
- Formato de book.json
- Sistema de temas
- Despliegue

#### 8.3 Changelog
**Archivo:** `docs/CHANGELOG.md`

**Contenido:**
```markdown
# Changelog

## v2.0.0 - 2025-11-28

### 🎉 NUEVA ARQUITECTURA
- Migración a "Colección Nuevo Ser"
- Sistema modular de libros
- Biblioteca unificada

### 📚 LIBROS
- [MIGRADO] El Código del Despertar v1.1.5
- [NUEVO] Manifiesto de la Conciencia Compartida v1.0.0

### ✨ NUEVAS FEATURES
- Reflexiones críticas
- Tracker de acciones
- Timeline histórico
- Modo debate IA
- Referencias cruzadas
- Búsqueda global

### 🎨 MEJORAS UI
- Temas dinámicos por libro
- Transiciones fluidas
- Responsive mejorado
```

---

## 📊 RESUMEN DE TIEMPOS

| Fase | Duración Estimada | Prioridad |
|------|-------------------|-----------|
| 1. Preparación | 1-2 días | 🔴 ALTA |
| 2. Desarrollo Core | 2-3 días | 🔴 ALTA |
| 3. Features Específicas | 2-3 días | 🟡 MEDIA |
| 4. Integración | 1-2 días | 🟡 MEDIA |
| 5. UI/UX | 1-2 días | 🟡 MEDIA |
| 6. Android App | 1 día | 🟢 BAJA |
| 7. Web Deploy | 0.5 día | 🟢 BAJA |
| 8. Documentación | 0.5 día | 🟢 BAJA |

**TOTAL: 9-15 días de desarrollo**

---

## 🎯 HITOS CLAVE

### Hito 1: Prototipo Funcional (Fin Fase 2)
- [ ] Biblioteca home funcionando
- [ ] Un libro (Código Despertar) migrado y navegable
- [ ] Temas dinámicos aplicándose
- [ ] IA básica funcionando

### Hito 2: Features Completas (Fin Fase 3)
- [ ] Todas las features de ambos libros implementadas
- [ ] Manifiesto con contenido completo
- [ ] Modos de IA funcionando

### Hito 3: Integración (Fin Fase 4)
- [ ] Referencias cruzadas activas
- [ ] Búsqueda global funcionando
- [ ] Datos persistentes

### Hito 4: Release Candidate (Fin Fase 6)
- [ ] APK compilado y probado
- [ ] Web funcionando
- [ ] Sin bugs críticos

### Hito 5: Release (Fin Fase 8)
- [ ] Documentación completa
- [ ] Deploy en producción
- [ ] Anuncio público

---

## 🚀 PRÓXIMOS PASOS INMEDIATOS

### HOY (Día 1):

1. **Extraer contenido Manifiesto** (4-6h)
   - Convertir .docx a JSON
   - Estructurar capítulos
   - Crear timeline y recursos

2. **Migrar Código Despertar** (2-3h)
   - Extraer bookData a JSON
   - Verificar integridad

3. **Copiar sistema IA** (1h)
   - ai-adapter.js
   - ai-config.js
   - Crear contextos

### MAÑANA (Día 2):

4. **Motor de libros básico** (6-8h)
   - book-engine.js
   - Cargar libro
   - Renderizar capítulo

5. **Pantalla Home** (4-6h)
   - biblioteca.js
   - Grid de libros
   - Navegación

---

## 📝 NOTAS IMPORTANTES

### Compatibilidad con App Actual
- La app actual (`app-final`) seguirá funcionando
- Nueva app es independiente
- Usuarios pueden migrar manualmente (copiar notas)
- Eventualmente podríamos importar datos de v1.1.5

### Estrategia de Migración de Usuarios
1. **Fase 1:** Lanzar v2.0.0 como nueva app
2. **Fase 2:** Mantener ambas apps disponibles 1 mes
3. **Fase 3:** Deprecar v1.1.5, redirigir a v2.0.0
4. **Opcional:** Tool de importación de datos v1 → v2

### Backups
- Mantener copias de:
  - `/app-final/` (versión actual funcional)
  - `/PRODUCTION/` (archivos de producción)
  - `.docx` originales (siempre)

---

## ❓ DECISIONES PENDIENTES

Antes de continuar, necesito que confirmes:

1. **¿Empezamos con la extracción del Manifiesto?**
   (Convertir .docx → JSON, ~4-6 horas de trabajo)

2. **¿Diseño de portadas/logos?**
   - ¿Tienes imágenes para portadas de libros?
   - ¿Quieres que diseñemos logo "Colección Nuevo Ser"?

3. **¿Prioridades de features?**
   - ¿Qué es imprescindible para v2.0.0?
   - ¿Qué puede esperar a v2.1.0?

4. **¿Timeline de lanzamiento?**
   - ¿Cuándo quieres tener la v2.0.0 lista?
   - ¿Desarrollo continuo o por sprints?

---

Dime si quieres que empiece con la **extracción del Manifiesto** o si prefieres ajustar algo del plan primero. 🚀
