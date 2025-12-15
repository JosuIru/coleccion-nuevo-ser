# Guía para Añadir un Nuevo Libro

Esta guía explica paso a paso cómo añadir un nuevo libro a la Colección Nuevo Ser.

## Índice

1. [Generación Automática](#1-generación-automática)
2. [Estructura de Archivos](#2-estructura-de-archivos)
3. [Configuración del Libro](#3-configuración-del-libro)
4. [Contenido del Libro](#4-contenido-del-libro)
5. [Tema Visual](#5-tema-visual)
6. [Assets Opcionales](#6-assets-opcionales)
7. [Registro en el Catálogo](#7-registro-en-el-catálogo)
8. [Validación](#8-validación)
9. [Buenas Prácticas](#9-buenas-prácticas)

---

## 1. Generación Automática

La forma más rápida de crear un nuevo libro es usar el generador interactivo:

```bash
node scripts/create-book.js
```

Este script te guiará paso a paso para crear:
- ✅ Estructura de directorios
- ✅ `book.json` con plantilla básica
- ✅ `config.json` con configuración estándar
- ✅ Tema CSS personalizado
- ✅ Plantillas de assets
- ✅ README del libro

Después de ejecutar el script, sigue los **Próximos Pasos** que aparecen en pantalla.

---

## 2. Estructura de Archivos

Cada libro debe tener la siguiente estructura:

```
www/books/mi-nuevo-libro/
├── book.json              # ✅ OBLIGATORIO - Contenido del libro
├── config.json            # ✅ OBLIGATORIO - Configuración
├── README.md              # Documentación del libro
└── assets/                # Assets opcionales
    ├── chapter-metadata.json
    ├── quizzes.json
    ├── resources.json
    └── timeline.json
```

**Archivos CSS asociados:**

```
www/css/themes/
└── mi-nuevo-libro.css     # ✅ OBLIGATORIO - Tema visual
```

---

## 3. Configuración del Libro

El archivo `config.json` define la configuración y características del libro.

### Estructura Completa

```json
{
  "id": "mi-nuevo-libro",
  "version": "1.0.0",
  "lastUpdate": "2024-01-15",

  "theme": {
    "name": "Mi Tema Personalizado",
    "primary": "#059669",
    "secondary": "#10b981",
    "accent": "#fbbf24",
    "background": "#1a1a1a",
    "backgroundSecondary": "#0a2e1a",
    "text": "#d1fae5",
    "textSecondary": "#a7f3d0",
    "border": "#047857",
    "gradient": "from-emerald-600 to-emerald-500"
  },

  "ui": {
    "showStarfield": true,
    "animationType": "cosmic",
    "animationSpeed": "medium",
    "fontFamily": "'Inter', sans-serif",
    "fontSize": {
      "base": 16,
      "heading": 24,
      "title": 32
    },
    "spacing": {
      "section": 48,
      "paragraph": 16
    }
  },

  "features": {
    "audiobook": {
      "enabled": true,
      "voice": "es-ES",
      "speedControl": true,
      "speeds": [0.75, 1.0, 1.25, 1.5],
      "highlightCurrentParagraph": true,
      "autoAdvanceChapter": false
    },
    "aiChat": {
      "enabled": true,
      "systemPrompt": "Eres un asistente experto en...",
      "modes": {},
      "maxHistoryMessages": 10
    },
    "personalNotes": {
      "enabled": true,
      "markdown": true,
      "exportable": true
    },
    "bookmarks": {
      "enabled": true,
      "allowMultiple": true
    },
    "progressTracking": {
      "enabled": true,
      "trackTime": true,
      "trackChapters": true,
      "trackExercises": true
    }
  },

  "content": {
    "sourceFile": "book.json",
    "dataStructure": "standard"
  },

  "metadata": {
    "locale": "es-ES",
    "readingLevel": "intermediate",
    "recommendedPace": "reflective",
    "tags": ["filosofía", "crecimiento-personal"],
    "complementaryBooks": ["otro-libro-relacionado"]
  }
}
```

### Campos Obligatorios

#### `id` (string)
- Identificador único del libro
- Formato: **kebab-case** (`mi-nuevo-libro`)
- Solo letras minúsculas, números y guiones

#### `version` (string)
- Versión semántica: `X.Y.Z`
- Ejemplo: `"1.0.0"`

#### `lastUpdate` (string)
- Fecha de última actualización
- Formato: `YYYY-MM-DD`
- Ejemplo: `"2024-01-15"`

#### `theme.name` (string)
- Nombre descriptivo del tema visual

#### `theme.primary`, `theme.secondary`, `theme.background`, `theme.text` (string)
- Colores en formato hexadecimal
- Ejemplo: `"#059669"`

#### `ui.animationType` (string)
- Valores válidos: `"cosmic"`, `"revolutionary"`, `"organic"`, `"minimal"`

#### `ui.fontFamily` (string)
- Stack de fuentes CSS

#### `ui.fontSize` (object)
- `base`, `heading`, `title` (números en px)

#### `metadata.locale` (string)
- Código de idioma: `es-ES`, `en-US`, etc.

#### `metadata.readingLevel` (string)
- Valores válidos: `"beginner"`, `"intermediate"`, `"advanced"`

#### `metadata.recommendedPace` (string)
- Valores válidos: `"slow"`, `"reflective"`, `"normal"`, `"fast"`

---

## 4. Contenido del Libro

El archivo `book.json` contiene todo el contenido estructurado del libro.

### Estructura Completa

```json
{
  "title": "Título del Libro",
  "subtitle": "Subtítulo Descriptivo",
  "author": "Nombre del Autor",
  "coAuthor": "Co-autor (opcional)",

  "sections": [
    {
      "id": "seccion-1",
      "title": "Título de la Sección",
      "subtitle": "Subtítulo opcional",
      "chapters": [
        {
          "id": "capitulo-1",
          "title": "Título del Capítulo",
          "epigraph": {
            "text": "Cita inspiradora",
            "author": "Autor de la cita"
          },
          "content": "## Introducción\n\nContenido en Markdown...",
          "closingQuestion": "¿Pregunta reflexiva?",
          "exercises": [
            {
              "id": "ejercicio-1",
              "title": "Nombre del Ejercicio",
              "duration": "10-15 minutos",
              "description": "Descripción breve",
              "steps": [
                "Paso 1: ...",
                "Paso 2: ..."
              ],
              "reflection": "¿Pregunta de reflexión?"
            }
          ]
        }
      ]
    }
  ]
}
```

### Formato del Contenido

El campo `content` de cada capítulo usa **Markdown**. Elementos soportados:

#### Encabezados
```markdown
## Título de Sección
### Subtítulo
```

#### Énfasis
```markdown
*texto en cursiva*
**texto en negrita**
```

#### Listas
```markdown
- Elemento 1
- Elemento 2

1. Elemento ordenado 1
2. Elemento ordenado 2
```

#### Citas
```markdown
> Texto de la cita en bloque
```

#### Párrafos
Los párrafos se separan con **doble salto de línea** (`\n\n`).

### IDs Únicos

**IMPORTANTE:** Todos los IDs deben ser:
- ✅ Únicos en todo el libro
- ✅ En formato kebab-case
- ✅ Descriptivos

```json
{
  "sections": [
    { "id": "introduccion" },        // ✅ Bien
    { "id": "primera_parte" }        // ❌ Mal (usa guiones bajos)
  ],
  "chapters": [
    { "id": "capitulo-despertar" },  // ✅ Bien
    { "id": "cap1" }                 // ⚠️  Poco descriptivo
  ]
}
```

---

## 5. Tema Visual

Cada libro necesita un archivo CSS en `www/css/themes/{libro-id}.css`.

### Plantilla Básica

```css
/* ============================================================================
   TEMA: NOMBRE DEL TEMA
   ============================================================================
   Descripción breve
   ============================================================================ */

/* VARIABLES CSS - DARK MODE */
body.theme-dark.theme-mi-libro {
  --color-primary: #059669;
  --color-secondary: #10b981;
  --color-accent: #fbbf24;
  --color-background: #1a1a1a;
  --color-background-secondary: #0a2e1a;
  --color-text: #d1fae5;
  --color-text-secondary: #a7f3d0;
  --color-border: #047857;
}

/* VARIABLES CSS - LIGHT MODE */
body.theme-light.theme-mi-libro {
  --color-primary: #047857;
  --color-secondary: #059669;
  --color-accent: #d97706;
  --color-background: #f0fdf4;
  --color-background-secondary: #dcfce7;
  --color-text: #064e3b;
  --color-text-secondary: #065f46;
  --color-border: #6ee7b7;
}

/* FONDO ANIMADO - DARK MODE */
body.theme-dark.theme-mi-libro {
  background: var(--color-background);
  position: relative;
  overflow-x: hidden;
}

body.theme-dark.theme-mi-libro::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  /* Tu efecto visual aquí */
  background: radial-gradient(circle, var(--color-primary)20 0%, transparent 50%);
  animation: miLibroAnimation 20s ease-in-out infinite;
  z-index: -1;
  pointer-events: none;
}

@keyframes miLibroAnimation {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 0.7; }
}

/* ELEMENTOS INTERACTIVOS */
.theme-dark.theme-mi-libro .card:hover {
  box-shadow: 0 10px 40px -10px var(--color-primary);
  transform: translateY(-2px);
}

.theme-dark.theme-mi-libro .btn-primary {
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  border-color: var(--color-primary);
}

/* ENLACES */
.theme-dark.theme-mi-libro a {
  color: var(--color-secondary);
}

.theme-dark.theme-mi-libro a:hover {
  color: var(--color-primary);
}

/* HEADINGS */
.theme-dark.theme-mi-libro h1,
.theme-dark.theme-mi-libro h2,
.theme-dark.theme-mi-libro h3 {
  color: var(--color-text);
  text-shadow: 0 2px 10px var(--color-primary)40;
}
```

### Variables Obligatorias

Cada tema **DEBE** definir estas 8 variables CSS:

1. `--color-primary`
2. `--color-secondary`
3. `--color-accent`
4. `--color-background`
5. `--color-background-secondary`
6. `--color-text`
7. `--color-text-secondary`
8. `--color-border`

### Registro del Tema

Añade el tema a `www/index.html`:

```html
<!-- Theme Styles -->
<link rel="stylesheet" href="css/themes/mi-nuevo-libro.css">
```

Mantén los temas en **orden alfabético**.

---

## 6. Assets Opcionales

Los assets añaden funcionalidad extra al libro.

### 6.1 Chapter Metadata (`assets/chapter-metadata.json`)

Metadatos adicionales por capítulo:

```json
[
  {
    "chapterId": "capitulo-1",
    "estimatedReadingTime": "15 min",
    "difficulty": "medium",
    "prerequisites": ["capitulo-intro"],
    "keywords": ["conciencia", "meditación"],
    "summary": "Resumen breve del capítulo"
  }
]
```

### 6.2 Quizzes (`assets/quizzes.json`)

Cuestionarios interactivos:

```json
[
  {
    "id": "quiz-capitulo-1",
    "chapterId": "capitulo-1",
    "title": "Verifica tu Comprensión",
    "questions": [
      {
        "id": "q1",
        "question": "¿Cuál es la idea principal?",
        "type": "multiple-choice",
        "options": [
          "Opción A",
          "Opción B",
          "Opción C"
        ],
        "correctAnswer": 1,
        "explanation": "Explicación de la respuesta correcta"
      }
    ]
  }
]
```

### 6.3 Resources (`assets/resources.json`)

Recursos adicionales (lecturas, videos, enlaces):

```json
{
  "resources": [
    {
      "id": "resource-1",
      "chapterId": "capitulo-1",
      "title": "Lectura Complementaria",
      "type": "article",
      "url": "https://ejemplo.com/articulo",
      "description": "Descripción breve"
    },
    {
      "id": "resource-2",
      "chapterId": "capitulo-2",
      "title": "Video Explicativo",
      "type": "video",
      "url": "https://youtube.com/watch?v=...",
      "duration": "12:34"
    }
  ]
}
```

### 6.4 Timeline (`assets/timeline.json`)

Líneas de tiempo para contexto histórico/narrativo:

```json
{
  "events": [
    {
      "id": "event-1",
      "date": "2020-01-15",
      "title": "Evento Importante",
      "description": "Descripción del evento",
      "chapterIds": ["capitulo-3", "capitulo-4"]
    }
  ]
}
```

---

## 7. Registro en el Catálogo

Una vez creado el libro, regístralo en el catálogo global.

### Editar `www/books/catalog.json`

Añade una entrada al array de libros:

```json
{
  "books": [
    {
      "id": "mi-nuevo-libro",
      "title": "Mi Nuevo Libro",
      "subtitle": "Subtítulo descriptivo",
      "author": "Nombre del Autor",
      "category": "filosofía",
      "coverImage": "books/mi-nuevo-libro/cover.jpg",
      "description": "Descripción breve del libro (1-2 frases)",
      "published": true,
      "featured": false,
      "order": 100
    }
  ],
  "categories": [
    {
      "id": "filosofía",
      "name": "Filosofía",
      "icon": "🧠",
      "description": "Exploración filosófica"
    }
  ]
}
```

### Campos del Catálogo

- **id**: ID del libro (debe coincidir con el directorio)
- **title**: Título completo
- **author**: Autor principal
- **category**: ID de categoría existente
- **published**: `true` para mostrar en biblioteca, `false` para ocultar
- **featured**: `true` para destacar en portada
- **order**: Orden de aparición (menor = primero)

---

## 8. Validación

Antes de publicar el libro, valídalo con el script de validación.

### Ejecutar Validación

```bash
node scripts/validate-book.js mi-nuevo-libro
```

### Salida Esperada

Si el libro es válido:

```
✅ VALIDACIÓN EXITOSA

Estadísticas:
- Secciones: 3
- Capítulos: 12
- Ejercicios: 8
```

Si hay errores:

```
❌ ERRORES (3)
- book.json: Campo "author" faltante
- Capítulo duplicado: capitulo-1
- CSS: Falta variable --color-primary

⚠️  ADVERTENCIAS (1)
- No existe assets/quizzes.json
```

### Errores Comunes

| Error | Solución |
|-------|----------|
| `Campo "X" faltante` | Añadir campo obligatorio a config.json o book.json |
| `ID duplicado: X` | Cambiar ID para hacerlo único |
| `Formato inválido: color` | Usar formato hex `#RRGGBB` |
| `Tema CSS no encontrado` | Crear archivo en `www/css/themes/` |
| `No está en catalog.json` | Añadir entrada al catálogo |

---

## 9. Buenas Prácticas

### ✅ Estructura de Contenido

- **Secciones**: Agrupa capítulos temáticamente (3-5 capítulos por sección)
- **Capítulos**: Unidades autocontenidas de lectura (2000-5000 palabras)
- **Ejercicios**: Prácticos y accionables (máximo 3-4 por capítulo)

### ✅ Calidad del Texto

- **Markdown limpio**: Usa encabezados jerárquicos (`##`, `###`)
- **Párrafos cortos**: 3-5 líneas por párrafo
- **Formato consistente**: Sigue el estilo de otros libros

### ✅ Metadatos

- **IDs descriptivos**: `capitulo-introduccion-consciencia` > `cap1`
- **Epígrafes relevantes**: Complementan el contenido
- **Preguntas de cierre**: Abiertas, provocan reflexión

### ✅ Tema Visual

- **Colores coherentes**: Elige paleta de 3-4 colores
- **Contraste suficiente**: WCAG AA mínimo (4.5:1 para texto)
- **Animaciones sutiles**: No distraer de la lectura
- **Usa design tokens**: Referencia `--space-4`, `--text-lg`, etc.

### ✅ Accesibilidad

- **Texto legible**: Tamaño mínimo 16px
- **Jerarquía clara**: Usa encabezados semánticos
- **Descripciones alt**: Para imágenes (si las hay)

### ✅ Performance

- **Assets optimizados**: Comprime imágenes
- **JSON limpio**: Sin espacios innecesarios en producción
- **Lazy loading**: Para contenido pesado

### ✅ Testing

1. **Validación**: Ejecutar `validate-book.js`
2. **Lectura**: Leer al menos 2 capítulos completos
3. **Audio**: Probar TTS en varios capítulos
4. **Ejercicios**: Verificar pasos de ejercicios
5. **Responsive**: Probar en móvil/tablet/desktop
6. **Temas**: Verificar dark/light mode

---

## Checklist Completa

Antes de publicar un libro, verifica:

- [ ] `book.json` creado con contenido completo
- [ ] `config.json` con todos los campos obligatorios
- [ ] Tema CSS creado en `www/css/themes/`
- [ ] Tema registrado en `www/index.html`
- [ ] Libro añadido a `catalog.json`
- [ ] IDs únicos en todo el libro (secciones, capítulos, ejercicios)
- [ ] Validación exitosa con `validate-book.js`
- [ ] Contenido revisado (ortografía, formato)
- [ ] Assets opcionales creados (si aplica)
- [ ] Probado en navegador (lectura, audio, ejercicios)
- [ ] Probado en móvil
- [ ] README.md del libro actualizado

---

## Soporte

### Documentación Adicional

- **Design Tokens**: Ver `www/css/design-tokens.css`
- **Schemas JSON**: Ver `scripts/schemas/`
- **Ejemplos**: Revisar libros existentes como `codigo-despertar` o `manifiesto`

### Scripts Disponibles

```bash
# Crear nuevo libro (interactivo)
node scripts/create-book.js

# Validar libro existente
node scripts/validate-book.js {libro-id}
```

### Temas de Ejemplo

Consulta estos temas para inspiración:

- `toolkit-transicion.css` - Patrón geométrico
- `dialogos-maquina.css` - Efecto matrix digital
- `codigo-despertar.css` - Gradiente cósmico
- `manifiesto.css` - Estilo revolucionario

---

**¡Listo para crear tu libro! 📚✨**
