# 🏗️ ARQUITECTURA TÉCNICA - Colección Nuevo Ser

## 📋 OVERVIEW

Sistema modular de libros interactivos construido con Vanilla JavaScript, diseñado para ser extensible, mantenible y compilable a Android vía Capacitor.

---

## 🎯 DECISIONES DE DISEÑO

### ¿Por qué Vanilla JavaScript?

**Ventajas:**
- ✅ **Sin dependencias** de frameworks pesados
- ✅ **Rendimiento óptimo** (carga rápida)
- ✅ **Compatible con Capacitor** sin build especial
- ✅ **Fácil de entender** y mantener
- ✅ **Bundle size pequeño** (~620 KB total)

**Desventajas consideradas:**
- ⚠️ Más código manual (mitigado con clases ES6 bien estructuradas)
- ⚠️ Sin reactive state (mitigado con re-render explícito)

### ¿Por qué Tailwind CSS vía CDN?

**Ventajas:**
- ✅ **Rapid prototyping**
- ✅ **Sin build step**
- ✅ **Utility-first** (consistencia de estilos)
- ✅ **Responsive** out-of-the-box

### ¿Por qué LocalStorage?

**Ventajas:**
- ✅ **Sin backend** necesario
- ✅ **Persistencia instantánea**
- ✅ **5-10 MB de capacidad** (suficiente para nuestra app)
- ✅ **Sincronía** (no async)

**Limitaciones:**
- ⚠️ No sincroniza entre dispositivos (futuro: usar backend opcional)
- ⚠️ Solo strings (solucionado con JSON.stringify/parse)

---

## 📐 ARQUITECTURA GENERAL

### Diagrama de Componentes

```
┌─────────────────────────────────────────────┐
│               index.html                     │
│  (Entry point, splash screen, init)         │
└──────────────┬──────────────────────────────┘
               │
       ┌───────┴───────┐
       │               │
   ┌───▼────┐    ┌────▼────┐
   │  CORE  │    │   AI    │
   └────┬───┘    └────┬────┘
        │             │
   ┌────▼─────────────▼──────┐
   │      FEATURES            │
   └──────────┬───────────────┘
              │
         ┌────▼─────┐
         │  THEMES  │
         └──────────┘
```

### Capas de la Aplicación

**1. Core Layer (Sistema Central)**
- `book-engine.js` - Motor de gestión de libros
- `biblioteca.js` - Vista principal (home)
- `book-reader.js` - Vista de lectura

**2. AI Layer (Inteligencia Artificial)**
- `ai-config.js` - Configuración de providers
- `ai-adapter.js` - Adaptador universal para APIs
- `contexts/` - Contextos especializados por libro

**3. Features Layer (Funcionalidades)**
- `ai-chat-modal.js` - Chat con IA
- `notes-modal.js` - Notas personales
- `timeline-viewer.js` - Timeline histórico
- `resources-viewer.js` - Recursos externos
- `audioreader.js` - Narración TTS

**4. Presentation Layer (UI)**
- `core.css` - Estilos base
- `themes/` - Temas por libro
- Tailwind CSS (CDN)

**5. Data Layer (Contenido)**
- `catalog.json` - Índice de libros
- `book.json` - Contenido completo de cada libro
- `config.json` - Configuración por libro

---

## 🧩 COMPONENTES PRINCIPALES

### 1. BookEngine (Motor Central)

**Responsabilidades:**
- Cargar catálogo de libros
- Cargar libro específico (config + data)
- Gestionar navegación entre capítulos
- Aplicar temas dinámicos
- Renderizar contenido (Markdown básico)
- Gestionar progreso de lectura
- Gestionar bookmarks

**Métodos Clave:**
```javascript
class BookEngine {
  async init()                    // Inicialización
  async loadBook(bookId)          // Cargar libro
  getChapter(chapterId)           // Obtener capítulo
  navigateToChapter(chapterId)    // Navegar a capítulo
  getPreviousChapter(chapterId)   // Capítulo anterior
  getNextChapter(chapterId)       // Siguiente capítulo
  renderContent(content)          // Renderizar Markdown
  applyTheme(config)              // Aplicar tema CSS
  markChapterAsRead(chapterId)    // Marcar leído
  getProgress(bookId)             // Obtener progreso
}
```

**Estado Interno:**
```javascript
{
  catalog: {},              // Catálogo de libros
  currentBook: null,        // ID del libro actual
  currentBookConfig: {},    // Config del libro actual
  currentBookData: {},      // Datos del libro actual
  readProgress: {},         // Progreso por libro
  bookmarks: {}             // Bookmarks por libro
}
```

### 2. Biblioteca (Vista Principal)

**Responsabilidades:**
- Renderizar grid de libros
- Mostrar progreso por libro
- Búsqueda y filtrado
- Estadísticas globales

**Métodos Clave:**
```javascript
class Biblioteca {
  constructor(bookEngine)
  show()                          // Mostrar biblioteca
  hide()                          // Ocultar biblioteca
  render()                        // Renderizar HTML
  renderBookCard(book)            // Renderizar tarjeta de libro
  async openBook(bookId)          // Abrir libro
  attachEventListeners()          // Eventos
}
```

### 3. BookReader (Lector)

**Responsabilidades:**
- Renderizar capítulo actual
- Sidebar con navegación
- Header con controles
- Footer con navegación prev/next
- Integración con features

**Métodos Clave:**
```javascript
class BookReader {
  constructor(bookEngine)
  show(chapter)                   // Mostrar lector
  hide()                          // Ocultar lector
  render()                        // Renderizar completo
  renderSidebar()                 // Sidebar
  renderHeader()                  // Header con botones
  renderChapterContent()          // Contenido del capítulo
  renderFooterNav()               // Navegación prev/next
  navigateToChapter(chapterId)    // Navegar
  attachEventListeners()          // Eventos
}
```

### 4. AIChatModal (Chat IA)

**Responsabilidades:**
- Modal de chat conversacional
- Selector de modos (multi-persona)
- Historial de conversación
- Integración con ai-adapter

**Métodos Clave:**
```javascript
class AIChatModal {
  constructor(bookEngine, aiAdapter)
  open()                          // Abrir modal
  close()                         // Cerrar modal
  render()                        // Renderizar UI
  renderMessages()                // Renderizar historial
  renderModeSelector()            // Selector de modos
  async sendMessage()             // Enviar mensaje
  async getAIResponse()           // Obtener respuesta IA
  buildSystemContext()            // Construir contexto
}
```

**Estado:**
```javascript
{
  isOpen: false,
  conversationHistory: [],
  currentMode: 'default',
  suggestedQuestions: []
}
```

### 5. NotesModal (Notas)

**Responsabilidades:**
- CRUD de notas por capítulo
- Persistencia en LocalStorage
- Formato Markdown
- Exportar a .md

**Métodos Clave:**
```javascript
class NotesModal {
  constructor(bookEngine)
  open(chapterId)                 // Abrir modal
  close()                         // Cerrar modal
  addNote(chapterId, content)     // Crear nota
  updateNote(noteId, content)     // Editar nota
  deleteNote(noteId)              // Borrar nota
  getChapterNotes(chapterId)      // Obtener notas
  exportNotes()                   // Exportar a .md
}
```

**Estructura de Datos:**
```javascript
{
  notes: {
    "bookId_chapterId": [
      {
        id: "note_123",
        content: "...",
        created: "2025-11-28T...",
        updated: "2025-11-28T...",
        bookId: "...",
        chapterId: "..."
      }
    ]
  }
}
```

### 6. TimelineViewer (Timeline)

**Responsabilidades:**
- Cargar timeline.json
- Renderizar eventos en línea temporal
- Filtros por categoría
- Vista detalle de evento
- Navegación a capítulos relacionados

**Métodos Clave:**
```javascript
class TimelineViewer {
  constructor(bookEngine)
  async loadTimelineData()        // Cargar JSON
  open()                          // Abrir modal
  render()                        // Renderizar
  renderTimeline()                // Vista timeline
  renderEventDetail()             // Detalle de evento
  getFilteredEvents()             // Filtrar eventos
}
```

### 7. ResourcesViewer (Recursos)

**Responsabilidades:**
- Cargar resources.json
- 4 tabs (organizaciones, libros, docs, tools)
- Renderizar recursos por tipo
- Enlaces externos

**Métodos Clave:**
```javascript
class ResourcesViewer {
  constructor(bookEngine)
  async loadResourcesData()       // Cargar JSON
  open()                          // Abrir modal
  render()                        // Renderizar
  renderOrganizations()           // Tab organizaciones
  renderBooks()                   // Tab libros
  renderDocumentaries()           // Tab documentales
  renderTools()                   // Tab herramientas
}
```

### 8. AudioReader (TTS)

**Responsabilidades:**
- Web Speech API
- Controles de reproducción
- Highlight de párrafo actual
- Control de velocidad y voz
- Auto-advance de capítulos

**Métodos Clave:**
```javascript
class AudioReader {
  constructor(bookEngine)
  prepareContent(chapterContent)  // Parsear párrafos
  play(chapterContent)            // Iniciar narración
  pause()                         // Pausar
  resume()                        // Reanudar
  stop()                          // Detener
  setRate(rate)                   // Velocidad
  setVoice(voiceURI)              // Cambiar voz
  speakParagraph(index)           // Narrar párrafo
  highlightParagraph(index)       // Highlight visual
}
```

**Estado:**
```javascript
{
  isPlaying: false,
  isPaused: false,
  currentParagraphIndex: 0,
  paragraphs: [],
  rate: 1.0,
  selectedVoice: null,
  autoAdvanceChapter: false
}
```

---

## 🔄 FLUJO DE DATOS

### Inicialización de la App

```
1. index.html carga
   ↓
2. Splash screen aparece
   ↓
3. Scripts se cargan en orden:
   - Core (book-engine, biblioteca, book-reader)
   - AI (ai-config, ai-adapter)
   - Features (ai-chat, notes, timeline, resources, audioreader)
   ↓
4. initApp() se ejecuta:
   - bookEngine.init() → Carga catalog.json
   - Instancia Biblioteca y BookReader
   - Instancia features (si están disponibles)
   - Hace globales: window.bookEngine, etc.
   ↓
5. Splash screen desaparece (1.5 seg)
   ↓
6. Biblioteca se muestra automáticamente
```

### Abrir un Libro

```
1. Usuario click en tarjeta de libro
   ↓
2. biblioteca.openBook(bookId)
   ↓
3. bookEngine.loadBook(bookId)
   - Fetch config.json
   - Fetch book.json
   - Aplicar tema (CSS variables)
   ↓
4. Determinar capítulo inicial:
   - Si hay progreso: último capítulo leído
   - Si no: primer capítulo
   ↓
5. bookReader.show(chapter)
   - Renderizar sidebar, header, content, footer
   - Marcar capítulo como leído
   - Guardar progreso
   ↓
6. biblioteca.hide()
```

### Navegar entre Capítulos

```
1. Usuario click en "Siguiente →"
   ↓
2. bookReader.navigateToChapter(nextChapterId)
   ↓
3. bookEngine.navigateToChapter(nextChapterId)
   - Obtener datos del capítulo
   - Marcar como leído
   - Actualizar progreso
   ↓
4. bookReader.show(chapter)
   - Re-renderizar todo
   - Scroll to top
   ↓
5. Guardar en LocalStorage
```

### Chat IA

```
1. Usuario click en 🤖
   ↓
2. aiChatModal.open()
   - Renderizar modal
   - Mostrar preguntas sugeridas
   - Cargar historial (si existe)
   ↓
3. Usuario escribe pregunta
   ↓
4. aiChatModal.sendMessage()
   - Añadir mensaje a historial
   - Construir contexto del sistema:
     * Información del libro
     * Modo actual (si multi-modo)
     * Capítulo actual
   - aiAdapter.ask(mensaje, contexto, historial)
     ↓
     - Llamada a API vía proxy
     - Recibir respuesta
   - Añadir respuesta a historial
   - Re-renderizar mensajes
```

### Audioreader

```
1. Usuario click en 🎧
   ↓
2. audioReader.show()
   - Renderizar controles flotantes
   - Preparar contenido del capítulo actual
     * Parsear HTML → Array de párrafos
   ↓
3. Usuario click en ▶️ Play
   ↓
4. audioReader.play()
   - currentParagraphIndex = 0
   - speakParagraph(0)
     ↓
     - Crear SpeechSynthesisUtterance
     - Aplicar voz y rate
     - highlightParagraph(0)
     - synthesis.speak(utterance)
     ↓
     - Evento onend → speakParagraph(1)
     - Repetir hasta fin del capítulo
   ↓
5. Al terminar capítulo:
   - Si autoAdvance activado → navegar a siguiente capítulo
```

---

## 💾 ESTRUCTURA DE DATOS

### catalog.json

```json
{
  "library": {
    "name": "Colección Nuevo Ser",
    "version": "2.0.0",
    "books": [
      {
        "id": "codigo-despertar",
        "title": "...",
        "author": "...",
        "category": "...",
        "tags": [],
        "chapters": 16,
        "words": 26204,
        "features": {
          "meditations": true,
          "aiChat": true
        }
      }
    ],
    "crossReferences": [
      {
        "from": { "book": "...", "chapter": "..." },
        "to": { "book": "...", "chapter": "..." },
        "type": "..."
      }
    ]
  }
}
```

### book.json

```json
{
  "metadata": { ... },
  "prologo": {
    "id": "prologo",
    "title": "...",
    "content": "..."
  },
  "sections": [
    {
      "id": "parte1",
      "title": "...",
      "chapters": [
        {
          "id": "cap1",
          "title": "...",
          "epigraph": {
            "text": "...",
            "author": "..."
          },
          "content": "...",  // Markdown
          "closingQuestion": "...",
          "exercises": [...],  // Código Despertar
          "criticalReflections": [...],  // Manifiesto
          "suggestedActions": [...]  // Manifiesto
        }
      ]
    }
  ],
  "epilogo": { ... }
}
```

### config.json (por libro)

```json
{
  "id": "...",
  "version": "...",
  "theme": {
    "primary": "#...",
    "secondary": "#...",
    ...
  },
  "ui": {
    "showStarfield": true,
    "animationType": "..."
  },
  "features": {
    "aiChat": {
      "enabled": true,
      "modes": {
        "default": {
          "name": "...",
          "systemPrompt": "..."
        }
      }
    },
    "timeline": {
      "enabled": true
    },
    "resources": {
      "enabled": true
    }
  }
}
```

### LocalStorage Schema

```javascript
// Progreso de lectura
"coleccion_progress": {
  "codigo-despertar": {
    "chaptersRead": ["prologo", "cap1", "cap2"],
    "lastChapter": "cap2",
    "lastVisit": "2025-11-28T..."
  }
}

// Bookmarks
"coleccion_bookmarks": {
  "codigo-despertar": ["cap3", "cap7"]
}

// Notas
"coleccion_notes": {
  "codigo-despertar_cap1": [
    {
      id: "note_123",
      content: "...",
      created: "...",
      updated: "..."
    }
  ]
}

// API Key de Claude
"claude_api_key": "sk-ant-..."
```

---

## 🎨 SISTEMA DE TEMAS

### CSS Variables Dinámicas

En `core.css`:
```css
:root {
  --color-primary: #0ea5e9;
  --color-secondary: #a855f7;
  --color-accent: #fbbf24;
  --color-background: #0f172a;
  /* ... más variables ... */
}
```

### Aplicación de Tema

En `book-engine.js`:
```javascript
applyTheme(config) {
  const root = document.documentElement;
  root.style.setProperty('--color-primary', config.theme.primary);
  root.style.setProperty('--color-secondary', config.theme.secondary);
  // ... todas las variables ...

  // Aplicar clase al body
  document.body.className = `theme-${config.id}`;
}
```

### Temas por Libro

**Código del Despertar:**
- Colores: Cyan (#0ea5e9), Purple (#a855f7), Gold (#fbbf24)
- Background: Dark cosmic (#0f172a)
- Efecto: Starfield animado

**Manifiesto:**
- Colores: Red (#dc2626), Orange (#f97316), Gold (#fbbf24)
- Background: Dark (#171717)
- Efecto: Geometric patterns animados

---

## 🔌 INTEGRACIÓN CON SERVICIOS EXTERNOS

### Claude API (vía Proxy)

**Flujo:**
```
Cliente (navegador)
  ↓ POST con API key en header
Proxy (gailu.net/api/claude-proxy-simple.php)
  ↓ Llamada a API de Claude
Anthropic API
  ↓ Respuesta
Proxy
  ↓ JSON
Cliente
```

**Por qué proxy:**
- Evitar CORS issues
- No exponer API key en cliente (aunque el usuario la provee)
- Control de rate limiting

### Web Speech API

**Uso:**
```javascript
const utterance = new SpeechSynthesisUtterance(text);
utterance.voice = selectedVoice;
utterance.rate = rate;
window.speechSynthesis.speak(utterance);
```

**Compatibilidad:**
- ✅ Chrome/Edge (excelente)
- ✅ Safari (bueno)
- ⚠️ Firefox (limitado)

---

## 📦 BUILD Y DEPLOYMENT

### Web

**No necesita build:**
- Todos los archivos son estáticos
- JavaScript vanilla sin transpilación
- CSS vía CDN (Tailwind)

**Deploy:**
1. Subir carpeta `www/` completa a servidor
2. Configurar servidor para servir `index.html`

### Android (Capacitor)

**Build process:**
```bash
# 1. Sync assets
npx cap sync

# 2. Compile APK
cd android && ./gradlew assembleDebug

# Output: android/app/build/outputs/apk/debug/app-debug.apk
```

**Assets incluidos en APK:**
- Todo el contenido de `www/` (~620 KB)
- Capacitor runtime (~2 MB)
- Android WebView bindings

**APK size:** ~3-5 MB (debug), ~2-3 MB (release)

---

## 🔒 SEGURIDAD

### API Keys

**Almacenamiento:**
- API key de Claude se guarda en LocalStorage
- Cada usuario usa su propia key
- No se comparte entre usuarios

**Recomendaciones:**
- Usar solo en dispositivos personales
- No compartir API key públicamente
- Rotar keys periódicamente

### Contenido

**Sanitización:**
- Input de usuario (notas, chat) no se ejecuta como código
- Markdown parsing es básico (sin HTML injection)
- LocalStorage solo guarda strings (JSON stringified)

**CORS:**
- Proxy PHP maneja CORS con Claude API
- Web Speech API es local (no envía datos)

---

## 📊 PERFORMANCE

### Optimizaciones Aplicadas

**Lazy Loading:**
- Libros se cargan bajo demanda (fetch cuando se abre)
- Timeline y resources se cargan cuando se abren modales

**Caching:**
- Catalog se carga una vez al inicio
- Libro cargado se mantiene en memoria (no re-fetch)
- LocalStorage persiste datos (no re-calcula progreso)

**Rendering:**
- Re-render solo de componentes afectados
- Event listeners se re-asignan después de render (necesario sin framework)

**Bundle Size:**
- Total: ~620 KB
  - JavaScript: ~144 KB
  - JSON (libros): ~440 KB
  - CSS: ~27 KB
  - HTML: ~9 KB

### Métricas Esperadas

**Carga inicial:**
- Time to First Byte: <500ms
- First Contentful Paint: <1s
- Time to Interactive: <2s

**Navegación:**
- Cambio de capítulo: <100ms
- Abrir modal: <50ms
- Response de IA: 2-5s (depende de API)

---

## 🧪 TESTING

### Manual Testing

**Checklist:**
- [ ] Splash screen aparece y desaparece
- [ ] Biblioteca muestra ambos libros
- [ ] Click en libro abre lector
- [ ] Navegación prev/next funciona
- [ ] Sidebar toggle funciona
- [ ] Progreso se guarda y persiste
- [ ] Bookmarks funcionan
- [ ] Cada feature modal se abre correctamente
- [ ] Chat IA responde (con API key)
- [ ] Notas se guardan y exportan
- [ ] Timeline muestra eventos y filtra
- [ ] Recursos muestran 4 tabs
- [ ] Audioreader narra y hace highlight

### Automated Testing (Futuro)

**Sugerencias:**
- Jest para unit tests
- Cypress para E2E tests
- Lighthouse para performance

---

## 🔮 ROADMAP TÉCNICO

### Mejoras a Corto Plazo

1. **Service Worker** para modo offline completo
2. **IndexedDB** para almacenamiento más robusto que LocalStorage
3. **Markdown parser** más completo (usar marked.js o similar)
4. **Lazy load de imágenes** si se añaden muchas

### Mejoras a Medio Plazo

1. **Backend opcional** para sync entre dispositivos
2. **GraphQL API** para consultas más eficientes
3. **WebAssembly** para procesamiento pesado (si se necesita)
4. **PWA completo** con install prompt

### Escalabilidad

**Para añadir más libros:**
1. Crear carpeta en `books/[nuevo-libro]/`
2. Crear `config.json` y `book.json`
3. Añadir entrada en `catalog.json`
4. (Opcional) Crear tema CSS en `css/themes/`

**Para añadir features:**
1. Crear archivo en `js/features/[feature].js`
2. Exportar clase: `window.FeatureName = FeatureName`
3. Cargar script en `index.html`
4. Inicializar en `initApp()`
5. Integrar botón/trigger en `book-reader.js`

---

## 📚 RECURSOS Y REFERENCIAS

### Tecnologías Usadas

- **JavaScript ES6+** - Clases, módulos, async/await
- **Web APIs:**
  - LocalStorage
  - Fetch API
  - Web Speech API
  - DOM API
- **Tailwind CSS v3** - Utility-first CSS
- **Capacitor v6** - Hybrid app framework

### Documentación Externa

- [MDN Web Docs](https://developer.mozilla.org/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Capacitor](https://capacitorjs.com/docs)
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [Claude API](https://docs.anthropic.com/)

---

## 👥 CONTRIBUIR

### Estructura de Código

**Estilo:**
- Indentación: 2 espacios
- Comillas: simples `'`
- Semicolons: sí
- JSDoc comments para funciones públicas

**Naming:**
- Classes: `PascalCase`
- Functions/methods: `camelCase`
- Constants: `UPPER_SNAKE_CASE`
- Files: `kebab-case.js`

**Git Workflow:**
1. Fork del repo
2. Crear branch: `feature/nombre-feature`
3. Commit con mensajes descriptivos
4. Pull request con descripción clara

---

**Última actualización:** 2025-11-28
**Versión:** 2.0.0
