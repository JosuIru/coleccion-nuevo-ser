# 🛠️ GUÍA DE ACCESO - Herramientas del Ecosistema Nuevo Ser

**Versión:** 2.0 | **Fecha:** Diciembre 2025 | **Estado:** ✅ Producción

---

## 📍 Acceso a Herramientas

### Opción A: Desde la Web (Recomendado)

**URL:** http://localhost:8000/

1. Abre tu navegador
2. Accede a http://localhost:8000/
3. Desplázate hasta la sección **"Herramientas y Aplicaciones"**
4. Verás 4 cards con las herramientas disponibles
5. Haz clic en "🚀 Abrir Aplicación" para acceder

### Opción B: Desde el Juego Móvil

**Ubicación en app:** Tab 5 (👤 Perfil) → Botón "🛠️ Herramientas"

1. Abre Awakening Protocol Mobile Game
2. Ve a la pestaña 5 (Perfil)
3. Desplázate hacia abajo
4. Toca el botón azul "🛠️ Herramientas del Ecosistema"
5. Se abrirá la pantalla de herramientas
6. Selecciona una y toca "Abrir"

---

## 🎯 Las 4 Herramientas

### 1. ⚡ **Frankenstein Lab**
- **Descripción:** Juego educativo donde creas seres conscientes combinando conocimientos de los libros
- **URL Web:** http://localhost:8000/test-frankenstein.html
- **Características:**
  - Quiz interactivo
  - Gamificación con puntos y logros
  - Leaderboard
  - Creación de seres personalizados
- **Tags:** juego, educativo, quiz, gamificación
- **Color:** 🎨 Púrpura (#8B5CF6)

### 2. 🌌 **Cosmos**
- **Descripción:** Navegación cósmica 3D que explora los libros como sistemas planetarios interconectados
- **URL Web:** http://localhost:8000/codigo-cosmico.html
- **Características:**
  - Visualización 3D interactiva
  - Exploración inmersiva
  - Relaciones conceptuales entre libros
  - Mapa visual del conocimiento
- **Tags:** visualización, 3D, exploración, inmersivo
- **Color:** 🎨 Índigo (#6366F1)

### 3. 🤝 **TRUK**
- **Descripción:** Red social de economía colaborativa local para transformar tu comunidad
- **URL Web:** https://truk-production.up.railway.app/
- **Características:**
  - Comunidad local
  - Economía circular y colaborativa
  - Intercambios comunitarios
  - Proyectos colaborativos
- **Tags:** economía, colaborativa, comunidad, local
- **Color:** 🎨 Azul (#3B82F6)

### 4. 🎮 **Awakening Protocol**
- **Descripción:** Juego móvil transformacional para Android: resuelve crisis globales, crea seres conscientes y transforma el mundo
- **Descarga:** http://localhost:8000/downloads/coleccion-nuevo-ser-latest.apk
- **Plataforma:** Android (APK)
- **Tamaño:** ~26 MB
- **Características:**
  - Misiones transformacionales interactivas
  - Resolución de crisis globales en tiempo real
  - Creación y evolución de seres conscientes
  - Sistema de logros y progreso
  - Integración completa con Colección del Nuevo Ser
  - Notificaciones en tiempo real
  - Sincronización de datos
- **Tags:** juego, transformación, conciencia, misiones, android
- **Color:** 🎨 Verde (#10B981)
- **Instalación:**
  1. Descarga el APK desde aquí
  2. En tu Android: Ajustes → Seguridad → Habilita "Orígenes desconocidos"
  3. Abre el archivo descargado
  4. Instala la aplicación

---

## 🎨 Diseño de Tarjetas

Cada herramienta se presenta como una tarjeta con:

```
┌─────────────────────────────────┐
│  [Icono]              [Badge]   │
│                                 │
│  Nombre de Herramienta          │
│  Descripción clara y concisa    │
│                                 │
│  #tag1 #tag2 #tag3 #tag4        │
│                                 │
│     [🚀 Abrir Aplicación]       │
└─────────────────────────────────┘
```

**Elementos:**
- **Icono:** Emoji distintivo (⚡, 🌌, 🤝, 🎮)
- **Badge:** Tipo (🌐 Web App o 🎮 Juego)
- **Nombre:** Título de la herramienta
- **Descripción:** Explicación breve del contenido
- **Tags:** Clasificación temática con #
- **Botón:** Abre la aplicación

---

## 🌍 Arquitectura de Ecosistema

```
┌────────────────────────────────────────┐
│   Colección del Nuevo Ser (WEB)        │
│   http://localhost:8000/               │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │  BIBLIOTECA (Home)               │ │
│  │  - Catálogo de 7 libros         │ │
│  │  - Búsqueda y filtros           │ │
│  │  - Progreso de lectura          │ │
│  └──────────────────────────────────┘ │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │  HERRAMIENTAS & APLICACIONES      │ │
│  │  (Sección hub de acceso)          │ │
│  │  ├─ ⚡ Frankenstein Lab           │ │
│  │  ├─ 🌌 Cosmos                    │ │
│  │  ├─ 🤝 TRUK                      │ │
│  │  └─ 🎮 Awakening Protocol         │ │
│  └──────────────────────────────────┘ │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │  OTRAS CARACTERÍSTICAS            │ │
│  │  - Centro de Ayuda               │ │
│  │  - Exploración Hub               │ │
│  │  - Prácticas Recomendadas        │ │
│  │  - Dashboard de Progreso         │ │
│  └──────────────────────────────────┘ │
│                                        │
└────────────────────────────────────────┘
         ↓    ↓    ↓    ↓
    ┌────┴────┴────┴────┴────────────┐
    │    │    │    │                 │
┌───▼───────┐  ┌───────▼──┐  ┌──────▼──┐  ┌──────────▼───┐
│Frankenstein│  │ Cosmos   │  │  TRUK   │  │  Awakening   │
│    Lab     │  │ (3D Nav) │  │(Social) │  │  Protocol    │
│  (Web)     │  │  (Web)   │  │ (Web)   │  │   (Mobile)   │
└────────────┘  └──────────┘  └─────────┘  └──────────────┘
```

---

## 🔄 Flujo de Usuario Típico

```
1. Usuario entra a http://localhost:8000/
   ↓
2. Ve la Biblioteca con los 7 libros
   ↓
3. (Opcional) Desplaza hasta "Herramientas"
   ↓
4. Elige una herramienta
   ↓
5. Hace clic en "Abrir"
   ↓
6. Herramienta se abre en el navegador
   ↓
7. Vuelve con botón atrás o tab anterior
   ↓
8. Continúa explorando
```

---

## 🛠️ Implementación Técnica

### Configuración Web

**Archivo:** `www/js/core/biblioteca.js` (líneas 57-99)

```javascript
HERRAMIENTAS_ECOSISTEMA: [
  {
    id: 'frankenstein-lab',
    name: 'Frankenstein Lab',
    description: 'Juego educativo: crea seres conscientes...',
    icon: '⚡',
    url: './test-frankenstein.html',
    color: '#8B5CF6',
    tags: ['juego', 'aprendizaje', 'quiz', 'gamificación'],
    isInternal: false
  },
  {
    id: 'cosmos-navigation',
    name: 'Cosmos',
    description: 'Navegación cósmica 3D...',
    icon: '🌌',
    url: './codigo-cosmico.html',
    color: '#6366F1',
    tags: ['visualización', '3D', 'exploración', 'inmersivo'],
    isInternal: false
  },
  {
    id: 'truk',
    name: 'Truk',
    description: 'Red social de economía colaborativa...',
    icon: '🤝',
    url: 'https://truk-production.up.railway.app/',
    color: '#3B82F6',
    tags: ['economía', 'colaborativa', 'comunidad', 'local'],
    isInternal: false
  },
  {
    id: 'awakening-protocol',
    name: 'Awakening Protocol',
    description: 'Juego móvil transformacional (Android): resuelve crisis globales...',
    icon: '🎮',
    url: './downloads/coleccion-nuevo-ser-latest.apk',
    color: '#10B981',
    tags: ['juego', 'transformación', 'conciencia', 'misiones', 'android'],
    isInternal: false
  }
]
```

### Renderizado

**Método:** `renderToolsSection()` (línea 573)

- Grid responsive de tarjetas
- Colores únicos por herramienta
- Tailwind CSS para estilos
- Links directos para abrir

### Ubicación en Página

**Método:** `render()` (línea 287)

```
render() {
  ├─ Header
  ├─ Global Stats
  ├─ Search & Filters
  ├─ Books Grid
  ├─ Tools Section  ← AQUÍ ESTÁ
  ├─ Future Books
  └─ About
}
```

---

## ✨ Características del Sistema

- **Responsive:** Funciona en desktop, tablet y móvil
- **Colores dinámicos:** Cada herramienta tiene un tema de color único
- **Links directos:** Abre en navegador sin intermediarios
- **Badges informativos:** Indica el tipo (Web App)
- **Tags clasificables:** Facilita encontrar por categoría
- **Sin instalación:** Todo en el navegador
- **Acceso desde móvil:** También disponible en app

---

## 🚀 Próximas Mejoras (Opcionales)

- [ ] Agregar más herramientas al ecosistema
- [ ] Analytics de qué herramientas se usan más
- [ ] Sistema de favoritos/marcados
- [ ] Notificaciones de actualizaciones
- [ ] Búsqueda dentro de herramientas
- [ ] Descripciones en múltiples idiomas
- [ ] Links de profundidad en Awakening Protocol

---

## ❓ Preguntas Frecuentes

**P: ¿Necesito descargar algo?**
A: No. Todo es web. Solo accede a la URL en tu navegador.

**P: ¿Qué pasa si cierro una herramienta?**
A: Vuelves a la Colección y puedes abrir otra. Tu progreso se mantiene.

**P: ¿Puedo usar varias herramientas a la vez?**
A: Sí, puedes tener varias pestañas abiertas.

**P: ¿Funcionan en el móvil?**
A: Sí, el navegador móvil abre las herramientas. También puedes usar el acceso desde el juego.

**P: ¿Necesito estar conectado?**
A: Sí, excepto los libros descargados previamente.

---

**Última actualización:** 13 de diciembre 2025
**Versión:** Ecosistema Nuevo Ser 2.0
**Estado:** ✅ Producción Lista
