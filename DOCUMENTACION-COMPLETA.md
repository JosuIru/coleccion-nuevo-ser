# Coleccion Nuevo Ser - Documentacion Completa

## Indice

1. [Vision y Proposito](#1-vision-y-proposito)
2. [Arquitectura Tecnica](#2-arquitectura-tecnica)
3. [Estructura del Proyecto](#3-estructura-del-proyecto)
4. [Libros Disponibles](#4-libros-disponibles)
5. [Funcionalidades](#5-funcionalidades)
6. [Guia de Usuario](#6-guia-de-usuario)
7. [Desarrollo y Mantenimiento](#7-desarrollo-y-mantenimiento)
8. [Compilacion Android](#8-compilacion-android)
9. [Anadir Nuevos Libros](#9-anadir-nuevos-libros)
10. [Sistemas UX Avanzados](#10-sistemas-ux-avanzados)

---

## 1. Vision y Proposito

### Que es Coleccion Nuevo Ser

Una plataforma de libros interactivos para la transformacion personal y social. Explora consciencia, filosofia, y herramientas practicas para:

- **Crear comunidades y empresas** basadas en principios del Nuevo Ser
- **Resolver conflictos** con herramientas filosoficas
- **Ayudar a educadores y agentes sociales** con metodologias transformadoras
- **Desarrollar un nuevo mundo** a traves de la teoria y la practica

### Valores Core

- **Accesibilidad**: Funciona en web y Android, sin dependencias pesadas
- **Transformacion**: Herramientas practicas, no solo teoria
- **Comunidad**: Diseñado para crear y fortalecer grupos
- **Colaboracion Humano-IA**: Co-creado con inteligencia artificial

---

## 2. Arquitectura Tecnica

### Stack Tecnologico

| Componente | Tecnologia |
|------------|------------|
| Frontend | Vanilla JavaScript ES6+ |
| Estilos | Tailwind CSS (CDN) |
| Persistencia | LocalStorage + Supabase (opcional) |
| Mobile | Capacitor v6 |
| TTS | Web Speech API |
| IA Chat | Claude API |

### Por que Vanilla JavaScript

- Sin dependencias de frameworks pesados
- Rendimiento optimo (carga rapida)
- Compatible con Capacitor sin build especial
- Bundle size pequeño (~620 KB total)

### Capas de la Aplicacion

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

**Core Layer:**
- `book-engine.js` - Motor de gestion de libros
- `biblioteca.js` - Vista principal (home)
- `book-reader.js` - Vista de lectura

**AI Layer:**
- `ai-config.js` - Configuracion de providers
- `ai-adapter.js` - Adaptador universal para APIs

**Features Layer:**
- `ai-chat-modal.js` - Chat con IA
- `notes-modal.js` - Notas personales
- `timeline-viewer.js` - Timeline historico
- `resources-viewer.js` - Recursos externos
- `audioreader.js` - Narracion TTS
- `welcome-flow.js` - Onboarding usuarios nuevos
- `streak-system.js` - Sistema de rachas
- `contextual-hints.js` - Hints contextuales
- `shareable-moments.js` - Momentos compartibles

---

## 3. Estructura del Proyecto

```
coleccion-nuevo-ser/
├── www/                          # Web app principal
│   ├── index.html                # Entry point
│   ├── lab.html                  # Frankenstein Lab
│   ├── css/
│   │   ├── core.css              # Estilos base
│   │   ├── design-tokens.css     # Variables CSS
│   │   └── themes/               # Temas por libro
│   ├── js/
│   │   ├── core/                 # Modulos principales
│   │   │   ├── app-initialization.js
│   │   │   ├── book-engine.js
│   │   │   ├── book-reader.js
│   │   │   ├── biblioteca.js
│   │   │   ├── theme-helper.js
│   │   │   ├── auth-helper.js
│   │   │   └── tts-platform-helper.js
│   │   ├── features/             # Funcionalidades
│   │   │   ├── ai-chat-modal.js
│   │   │   ├── notes-modal.js
│   │   │   ├── audioreader.js
│   │   │   ├── search-modal.js
│   │   │   ├── welcome-flow.js
│   │   │   ├── streak-system.js
│   │   │   ├── contextual-hints.js
│   │   │   └── shareable-moments.js
│   │   └── services/             # Servicios
│   └── books/                    # Contenido de libros
│       ├── catalog.json          # Indice de libros
│       ├── codigo-despertar/
│       ├── manifiesto/
│       ├── filosofia-nuevo-ser/
│       └── [12 libros total]/
├── android/                      # Proyecto Android (Capacitor)
│   ├── app/
│   │   ├── src/main/
│   │   └── build/outputs/apk/
│   ├── build.gradle
│   └── variables.gradle
├── mobile-game/                  # Frankenstein Lab (React Native)
├── api/                          # APIs PHP
├── supabase/                     # Migraciones Supabase
├── scripts/                      # Scripts de utilidad
├── docs/                         # Documentacion legacy
├── capacitor.config.json
├── package.json
└── DOCUMENTACION-COMPLETA.md     # Este archivo
```

---

## 4. Libros Disponibles

### Catalogo Completo (12 libros)

| ID | Titulo | Tema | Capitulos |
|----|--------|------|-----------|
| codigo-despertar | El Codigo del Despertar | Consciencia, fisica cuantica | 16 |
| manifiesto | Manifiesto de la Conciencia Compartida | Filosofia politica, transformacion | 20 |
| filosofia-nuevo-ser | Filosofia del Nuevo Ser | Bases teoricas | 12 |
| tierra-que-despierta | La Tierra que Despierta | Ecologia, consciencia | 14 |
| manual-practico | Manual Practico | Ejercicios aplicados | 10 |
| practicas-radicales | Practicas Radicales | Transformacion personal | 8 |
| toolkit-transicion | Toolkit de Transicion | Herramientas comunidades | 15 |
| guia-acciones | Guia de Acciones | Acciones concretas | 12 |
| manual-transicion | Manual de Transicion | Metodologia completa | 18 |
| dialogos-maquina | Dialogos con la Maquina | Reflexiones IA-humano | 10 |
| ahora-instituciones | Ahora Instituciones | Transformacion institucional | 14 |
| nacimiento | El Nacimiento | Origen del movimiento | 8 |

### Estructura de un Libro

```
www/books/[libro-id]/
├── book.json        # Contenido completo (secciones, capitulos)
├── config.json      # Configuracion (tema, features, IA)
├── README.md        # Descripcion del libro
└── assets/          # Assets opcionales
    ├── quizzes.json
    ├── resources.json
    └── timeline.json
```

---

## 5. Funcionalidades

### Core

| Feature | Descripcion |
|---------|-------------|
| Lectura fluida | Navegacion intuitiva entre capitulos |
| Progreso persistente | Se guarda automaticamente en LocalStorage |
| Bookmarks | Marcar capitulos importantes |
| Temas dinamicos | Cada libro tiene su tema visual |
| Dark/Light mode | Cambio de tema con clase CSS `dark` |
| Responsive | Funciona en movil y desktop |

### Avanzadas

| Feature | Descripcion |
|---------|-------------|
| Chat IA | Asistente especializado por libro |
| Notas personales | Markdown, exportables |
| Audioreader TTS | Narracion con highlight |
| Timeline historico | Eventos y movimientos |
| Recursos externos | Links categorizados |
| Busqueda global | Buscar en todos los libros |

### UX Avanzado (Nuevo)

| Feature | Archivo | Descripcion |
|---------|---------|-------------|
| Welcome Flow | welcome-flow.js | Onboarding personalizado |
| Sistema de Racha | streak-system.js | Gamificacion de lectura |
| Hints Contextuales | contextual-hints.js | Ayuda progresiva |
| Momentos Compartibles | shareable-moments.js | Compartir logros |
| Herramienta del Dia | biblioteca.js | Sugerencia diaria de lectura |

---

## 6. Guia de Usuario

### Comenzar

1. **Web**: Abre `https://gailu.net/coleccion/` o `http://localhost:8000`
2. **Primera vez**: Completa el Welcome Flow seleccionando tu intencion
3. **Biblioteca**: Explora los libros disponibles

### Leer un Libro

1. Click en la tarjeta del libro
2. Click "Comenzar" o "Continuar"
3. Navega con botones `<` `>` o sidebar
4. Tu progreso se guarda automaticamente

### Audioreader

1. Click en icono de auriculares en el header
2. Controles: Play/Pause, velocidad (0.5x-2x), voz
3. El parrafo actual se ilumina
4. Auto-advance opcional al terminar capitulo

### Chat IA

1. Click en icono de robot en el header
2. Configura API key la primera vez:
   ```javascript
   localStorage.setItem('claude_api_key', 'sk-ant-TU_KEY');
   ```
3. Escribe tu pregunta
4. En Manifiesto: 3 modos (Critico, Constructor, Historiador)

### Notas

1. Click en icono de nota en el header
2. Escribe en Markdown
3. Ctrl+Enter para guardar
4. Exportar a .md

---

## 7. Desarrollo y Mantenimiento

### Requisitos Desarrollo

- Node.js 18+
- npm o pnpm
- Android SDK (para compilar APK)
- Java 17+

### Instalacion Local

```bash
# Clonar
git clone [repo-url]
cd coleccion-nuevo-ser

# Instalar dependencias
npm install

# Servir localmente
cd www
python3 -m http.server 8000
# o
npx serve .

# Abrir http://localhost:8000
```

### Estructura de Codigo

**Estilo:**
- Indentacion: 2 espacios
- Comillas: simples
- Semicolons: si
- Nombres descriptivos para variables

**Naming:**
- Classes: `PascalCase`
- Functions/methods: `camelCase`
- Constants: `UPPER_SNAKE_CASE`
- Files: `kebab-case.js`

### LocalStorage Schema

```javascript
// Progreso
"coleccion_progress": {
  "codigo-despertar": {
    "chaptersRead": ["prologo", "cap1"],
    "lastChapter": "cap1",
    "lastVisit": "2025-12-20T..."
  }
}

// Bookmarks
"coleccion_bookmarks": {
  "codigo-despertar": ["cap3", "cap7"]
}

// Notas
"coleccion_notes": {
  "codigo-despertar_cap1": [{ id, content, created, updated }]
}

// Racha
"streak_system_data": {
  "currentStreak": 5,
  "lastReadDate": "2025-12-20",
  "longestStreak": 10
}

// Welcome Flow
"welcome_flow_completed": true
"user_intent": "philosophy"

// Tema
"theme-preference": "dark"
```

---

## 8. Compilacion Android

### Requisitos

- Android SDK instalado
- Java 17+
- Variables de entorno configuradas:
  ```bash
  export ANDROID_SDK_ROOT=/home/usuario/Android/Sdk
  export JAVA_HOME=/usr/lib/jvm/java-17-openjdk
  ```

### Compilar APK

```bash
# 1. Sincronizar assets web
npx cap sync

# 2. Compilar APK debug
cd android && ./gradlew assembleDebug

# APK en: android/app/build/outputs/apk/debug/app-debug.apk
```

### Compilar APK Release (firmado)

```bash
# Variables
APK_UNSIGNED="android/app/build/outputs/apk/release/app-release-unsigned.apk"
APK_ALIGNED="/tmp/coleccion-aligned.apk"
APK_SIGNED="www/downloads/coleccion-nuevo-ser-vX.X.X.apk"
DEBUG_KEYSTORE="android/app/debug.keystore"

# 1. Compilar release
cd android && ./gradlew assembleRelease

# 2. Alinear
$ANDROID_SDK_ROOT/build-tools/36.0.0/zipalign -f 4 "$APK_UNSIGNED" "$APK_ALIGNED"

# 3. Firmar
$ANDROID_SDK_ROOT/build-tools/36.0.0/apksigner sign \
  --ks "$DEBUG_KEYSTORE" \
  --ks-pass pass:android \
  --key-pass pass:android \
  --out "$APK_SIGNED" \
  "$APK_ALIGNED"
```

### Instalar en Dispositivo

```bash
# Verificar dispositivo conectado
adb devices

# Instalar
adb install www/downloads/coleccion-nuevo-ser-vX.X.X.apk

# Desinstalar version anterior si existe
adb uninstall com.nuevosser.coleccion
```

### Configuracion Capacitor

```json
// capacitor.config.json
{
  "appId": "com.nuevosser.coleccion",
  "appName": "Coleccion Nuevo Ser",
  "webDir": "www",
  "server": {
    "androidScheme": "https"
  }
}
```

```groovy
// android/variables.gradle
ext {
  minSdkVersion = 22          // Android 5.0+
  compileSdkVersion = 35
  targetSdkVersion = 35
}
```

---

## 9. Anadir Nuevos Libros

### Generador Automatico

```bash
node scripts/create-book.js
```

### Manual

1. **Crear directorio:**
   ```
   www/books/mi-nuevo-libro/
   ├── book.json
   ├── config.json
   └── assets/
   ```

2. **config.json minimo:**
   ```json
   {
     "id": "mi-nuevo-libro",
     "version": "1.0.0",
     "theme": {
       "primary": "#059669",
       "secondary": "#10b981",
       "accent": "#fbbf24",
       "background": "#1a1a1a",
       "text": "#d1fae5"
     },
     "features": {
       "audiobook": { "enabled": true },
       "aiChat": { "enabled": true },
       "personalNotes": { "enabled": true }
     }
   }
   ```

3. **book.json estructura:**
   ```json
   {
     "title": "Mi Nuevo Libro",
     "author": "Autor",
     "sections": [
       {
         "id": "seccion-1",
         "title": "Primera Seccion",
         "chapters": [
           {
             "id": "capitulo-1",
             "title": "Primer Capitulo",
             "content": "## Introduccion\n\nContenido en Markdown..."
           }
         ]
       }
     ]
   }
   ```

4. **Crear tema CSS:**
   ```css
   /* www/css/themes/mi-nuevo-libro.css */
   body.theme-dark.theme-mi-nuevo-libro {
     --color-primary: #059669;
     --color-secondary: #10b981;
     /* ... */
   }
   ```

5. **Registrar en index.html:**
   ```html
   <link rel="stylesheet" href="css/themes/mi-nuevo-libro.css">
   ```

6. **Agregar a catalog.json:**
   ```json
   {
     "id": "mi-nuevo-libro",
     "title": "Mi Nuevo Libro",
     "published": true
   }
   ```

7. **Validar:**
   ```bash
   node scripts/validate-book.js mi-nuevo-libro
   ```

---

## 10. Sistemas UX Avanzados

### Welcome Flow (welcome-flow.js)

Onboarding para nuevos usuarios con seleccion de intencion:

| Intencion | Descripcion | Libros Recomendados |
|-----------|-------------|---------------------|
| philosophy | Comprender bases teoricas | codigo-despertar, filosofia-nuevo-ser |
| community | Crear organizaciones | toolkit-transicion, manual-transicion |
| education | Herramientas para educadores | manual-practico, guia-acciones |
| practice | Ejercicios de transformacion | practicas-radicales |
| explore | Explorar libremente | manifiesto |

### Sistema de Racha (streak-system.js)

- Contador de dias consecutivos leyendo
- Animacion de celebracion al mantener racha
- Persistencia en LocalStorage
- Eventos: `chapter-read`, `practice-completed`

### Hints Contextuales (contextual-hints.js)

Ayudas progresivas que aparecen segun uso:

- Primera visita a biblioteca
- Primera vez en lector
- Sugerencias de features no usadas

### Momentos Compartibles (shareable-moments.js)

Al completar un libro, genera tarjeta compartible con:
- Titulo del libro
- Capitulos completados
- Tiempo estimado de lectura

### Herramienta del Dia (biblioteca.js)

Sugerencia diaria rotativa de herramientas filosoficas/teoricas:
- Principios del Reconocimiento
- Transicion Consciente
- Estructura de Microsociedad
- Resolucion de Conflictos
- Comunicacion Transformadora

---

## Comandos Utiles

```bash
# Desarrollo
npm install                    # Instalar dependencias
npx cap sync                   # Sincronizar con Android
python3 -m http.server 8000    # Servidor local

# Compilacion
./gradlew assembleDebug        # APK debug
./gradlew assembleRelease      # APK release
./gradlew clean                # Limpiar build

# Instalacion
adb devices                    # Ver dispositivos
adb install [apk]              # Instalar APK
adb logcat | grep Coleccion    # Ver logs

# Validacion
node scripts/validate-book.js [libro-id]
node scripts/create-book.js

# Git
git status
git add .
git commit -m "mensaje"
git push
```

---

## Contacto y Recursos

- **Web**: https://gailu.net/coleccion/
- **Email**: contacto@gailu.net
- **Version actual**: 2.9.40

---

**Ultima actualizacion**: 2025-12-20
**Generado con**: Claude Code
