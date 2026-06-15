# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Versionado Semántico](https://semver.org/lang/es/).

---

## [2.9.414] - 2026-06-15

> Nota: las versiones intermedias entre 2.0.0 y 2.9.414 se gestionaron por build
> (sufijo `2.9.x`) sin entrada de changelog. Esta entrada agrupa el trabajo
> acumulado más reciente.

### Añadido
- 🪙 **Panel de transparencia y donaciones BTC**: objetivos, contribuciones e
  inventario, con endpoint de confirmación y migraciones de esquema.
- 🛠️ **Panel de administración** ampliado (gestión de transparencia, roles admin
  por email, carga diferida).
- 🎧 **Mejoras de AudioReader**: modo zen, visualizador, procesado de audio,
  soundscapes con caché y sincronización palabra a palabra.
- 🤖 **Adaptador de IA** con carga en caliente de Puter.js y ajustes desde settings.
- 👤 Flujo de **autenticación**, gestión de cuenta y ajustes de cuenta.

### Cambiado
- 📖 Refactor de `book-reader`, biblioteca y adaptador de contenido.
- 📚 Catálogo, ediciones premium generadas y mejoras en prácticas y micro-cursos.

### Seguridad
- 🔒 Migraciones con vistas `security invoker` y verificación de entidades.

### Mantenimiento
- 🧹 Artefactos regenerables (`supabase/.temp/`, `coverage/`) excluidos del control de versiones.
- 🗑️ Retirados tests muertos de `tests/frankenstein/` (módulos inexistentes en producción).

---

## [2.0.0] - 2025-11-28

### 🎉 Lanzamiento Mayor: Colección Completa

**Migración de "El Código del Despertar" a "Colección Nuevo Ser"**

### Añadido
- 🆕 **Segundo libro:** "Manifiesto de la Conciencia Compartida"
  - 18 capítulos + Prólogo + Epílogo
  - 141,270 caracteres de contenido
  - 54 reflexiones críticas + 54 acciones sugeridas
  - Timeline histórico con 25 eventos (1789-2024)
  - 30 recursos externos categorizados
  - 3 modos de IA (Crítico, Constructivo, Historiador)

- 🌐 **Sistema de internacionalización (i18n) completo**
  - Soporte ES/EN en tiempo real
  - 256 traducciones (128 ES + 128 EN)
  - Selector de idioma persistente
  - 100% de cobertura en archivos UI

- 📱 **Responsive Design completo** (Fases 1-3)
  - Mobile menu para pantallas < 768px
  - Breakpoints: mobile (< 640px), tablet (640-1024px), desktop (> 1024px)
  - 42 responsive breakpoints añadidos
  - Optimización táctil para sliders (h-2 → h-4)

- ♿ **Accesibilidad WCAG 2.1 AA**
  - 21 aria-labels añadidos
  - Skip links para navegación por teclado
  - Tooltips informativos en todos los botones
  - Contraste mejorado en textos

- 📚 **Sistema de biblioteca modular**
  - Catálogo centralizado en `catalog.json`
  - Temas dinámicos por libro
  - Cards responsive con gradientes
  - Filtros y búsqueda de libros

- 🎨 **Temas visuales diferenciados**
  - Código del Despertar: Azul/Púrpura cósmico
  - Manifiesto: Rojo/Naranja revolucionario
  - CSS modular por tema

### Mejorado
- 🎧 **AudioReader optimizado**
  - Controles más accesibles
  - UI responsive
  - Mejor feedback visual

- 🤖 **Chat IA multi-modo**
  - Configuración persistente
  - Modal responsive
  - 3 personalidades de IA (Manifiesto)

- 📝 **Sistema de notas**
  - Export a Markdown
  - Modal responsive
  - Mejor UX en mobile

- 🎵 **Generador de koans y audio binaural**
  - Modales completamente responsive
  - Traducciones completas
  - Tooltips descriptivos

### Técnico
- **Archivos modificados:** 15 archivos
- **Líneas de código:** ~435 modificaciones
- **Documentación:** 28 archivos creados
- **APK compilado:** ColeccionNuevoSer-v2.0.0.apk (39 MB)

### Documentación
- `docs/PHASE1-COMPLETED.md` - Internacionalización y mobile menu
- `docs/PHASE2-COMPLETED.md` - Modales y sidebar responsive
- `docs/PHASE3-COMPLETED.md` - Detalles y pulido final
- `docs/PROYECTO-COMPLETO.md` - Resumen ejecutivo completo
- `docs/TESTING-i18n-ES-EN.md` - 147 checkpoints de testing

---

## [1.1.5] - 2024-11-27

### Añadido
- ⏳ Timeline histórico interactivo
- 🔗 Visor de recursos externos categorizados
- 📖 Manual Práctico con ejercicios detallados
- 🧘 Prácticas Radicales con meditaciones guiadas

### Mejorado
- Optimización de performance
- Reducción de tamaño de APK
- Mejoras en la navegación

### Corregido
- Bugs en el sistema de bookmarks
- Problemas de scroll en sidebar
- Errores en la síntesis de voz

---

## [1.1.4] - 2024-11-26

### Añadido
- 🎵 Generador de audio binaural
- 🧘 Sistema de meditaciones guiadas
- 📊 Tracking de progreso de ejercicios

### Mejorado
- UI del chat IA más intuitiva
- Mejor gestión de memoria en audio
- Optimización de imágenes

---

## [1.1.3] - 2024-11-25

### Añadido
- 🎧 Sistema de narración TTS (Text-to-Speech)
- ⚙️ Controles de velocidad y voz
- 📑 Sistema de bookmarks por capítulo

### Mejorado
- Performance en dispositivos móviles
- Carga más rápida de capítulos
- Mejor gestión de estado

---

## [1.1.2] - 2024-11-24

### Añadido
- 📝 Sistema de notas personales
- 💾 Export de notas a Markdown
- 🔍 Búsqueda dentro de notas

### Corregido
- Problemas de persistencia en localStorage
- Bugs en la navegación entre capítulos

---

## [1.1.1] - 2024-11-23

### Añadido
- 🤖 Chat con IA (Claude API)
- ⚙️ Configuración de API key
- 💬 Historial de conversaciones

### Mejorado
- Diseño del header
- Iconografía más clara
- Tooltips informativos

---

## [1.1.0] - 2024-11-22

### Añadido
- 🎨 Sistema de temas personalizables
- 🌙 Modo oscuro/claro
- 📏 Ajuste de tamaño de fuente
- 🎯 Modo inmersivo para lectura

### Mejorado
- Sidebar más funcional
- Mejor contraste en textos
- Animaciones más suaves

---

## [1.0.9] - 2024-11-21

### Añadido
- 🔧 Generador de koans contemplativos
- ⏱️ Temporizador para contemplación
- 💭 Sistema de insights personales

### Corregido
- Errores en la carga de capítulos largos
- Problemas de scroll

---

## [1.0.8] - 2024-11-20

### Versión Inicial Pública

#### Añadido
- 📖 Libro completo "El Código del Despertar"
  - Prólogo + 14 capítulos + Epílogo
  - 26,204 palabras
  - Ejercicios de meditación

- 🎯 Features principales
  - Navegación por capítulos
  - Sidebar con índice
  - Progress tracking
  - Responsive design básico

- 📱 App Android (Capacitor)
  - APK de 4.2 MB
  - Soporte Android 5.0+
  - Modo offline completo

- 🎨 Diseño
  - Tema cósmico (azul/púrpura)
  - Animaciones suaves
  - Tipografía optimizada para lectura

---

## Tipos de cambios

- `Añadido` - Para nuevas funcionalidades
- `Mejorado` - Para cambios en funcionalidades existentes
- `Obsoleto` - Para funcionalidades que serán eliminadas
- `Eliminado` - Para funcionalidades eliminadas
- `Corregido` - Para corrección de bugs
- `Seguridad` - Para vulnerabilidades de seguridad

---

## Versionado

Este proyecto usa **Versionado Semántico 2.0.0**:

- **MAJOR** (X.0.0): Cambios incompatibles con versiones anteriores
- **MINOR** (0.X.0): Nueva funcionalidad compatible con versiones anteriores
- **PATCH** (0.0.X): Correcciones de bugs compatibles

---

## Enlaces

- [Documentación completa](docs/README.md)
- [Guía de usuario](docs/GUIA-USUARIO.md)
- [Arquitectura técnica](docs/ARQUITECTURA-TECNICA.md)
- [Compilar APK](docs/COMPILAR-APK-ANDROID.md)

---

**Hecho con ❤️ por humanos e IA**
