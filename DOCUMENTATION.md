# Colección Nuevo Ser - Documentación Completa

## Tabla de Contenidos

1. [Visión General](#visión-general)
2. [Aplicaciones del Ecosistema](#aplicaciones-del-ecosistema)
3. [Biblioteca Principal](#biblioteca-principal)
4. [Lector de Libros](#lector-de-libros)
5. [Sistema de Audio](#sistema-de-audio)
6. [Laboratorio Frankenstein](#laboratorio-frankenstein)
7. [Sistema Cosmos](#sistema-cosmos)
8. [Prácticas y Ejercicios](#prácticas-y-ejercicios)
9. [Sistema de Progreso](#sistema-de-progreso)
10. [Configuración y Ajustes](#configuración-y-ajustes)
11. [Funcionalidades Premium](#funcionalidades-premium)
12. [Instalación y Despliegue](#instalación-y-despliegue)
13. [API y Servicios](#api-y-servicios)
14. [Arquitectura Técnica](#arquitectura-técnica)

---

## Visión General

**Colección Nuevo Ser** es una plataforma integral de lectura transformacional que combina libros interactivos, prácticas meditativas, juegos gamificados y herramientas de desarrollo personal. Disponible como aplicación web progresiva (PWA) y aplicación Android nativa.

### Características Principales

- 📚 **Biblioteca de 10+ libros** sobre consciencia, filosofía y transformación personal
- 🎧 **Audiolector avanzado** con múltiples proveedores TTS (Web Speech, Capacitor, OpenAI)
- 🧬 **Laboratorio Frankenstein** - Juego de creación de seres con conocimiento
- 🌌 **Cosmos 3D** - Navegación visual entre libros como sistemas planetarios
- 🧘 **Sistema de prácticas** con meditaciones guiadas y ejercicios
- 📊 **Seguimiento de progreso** con estadísticas y logros
- 🤖 **Integración IA** para chat contextual y resúmenes
- 🔄 **Sincronización en la nube** con Supabase

---

## Aplicaciones del Ecosistema

### 1. Biblioteca Principal (`index.html`)

La pantalla de inicio muestra:

- **Grid de libros** con portadas, progreso y categorías
- **Práctica del día** recomendada según tu historial
- **Filtros rápidos**: Todos, En progreso, Sin empezar, Completados
- **Buscador** de libros y contenido
- **Botones de acción**: Prácticas, Explorar, Progreso, Ayuda, Donaciones
- **Navegación inferior** (móvil): Inicio, Libros, Prácticas, Herramientas, Perfil

### 2. Laboratorio Frankenstein (`lab.html`)

Juego de creación donde combinas conocimientos de los libros para crear "seres" con propósito:

- **Sistema de misiones** con requisitos específicos
- **Piezas de conocimiento** (capítulos, ejercicios, recursos)
- **Creación de seres** con nombre, propósito y síntesis
- **Estadísticas del jugador** (seres creados, misiones, racha)
- **Ajustes** (sonido, animaciones, dificultad, autoguardado)

### 3. Cosmos (`codigo-cosmico.html`)

Visualización 3D de la biblioteca como un sistema cósmico:

- **Planetas** = Libros
- **Lunas** = Capítulos
- **Órbitas** = Relaciones entre contenidos
- **Navegación espacial** con zoom y rotación

### 4. Portal SETI-IA (`portal-seti-ia.html`)

Interfaz de inteligencia artificial para:

- Chat contextual sobre el contenido de los libros
- Resúmenes automáticos de capítulos
- Preguntas reflexivas generadas por IA
- Definiciones y explicaciones de términos

### 5. Awakening Protocol (Juego Móvil Independiente)

**Ubicación:** `/mobile-game/mobile-app/`
**Tecnología:** React Native
**APK:** `www/downloads/awakening-protocol-v1.0.4.apk`

Juego móvil de transformación basado en ubicación GPS:

#### Características Principales

| Feature | Descripción |
|---------|-------------|
| 🗺️ **Mapa GPS** | Explora tu ciudad en tiempo real |
| 💎 **Fractales de Consciencia** | Colecciona fragmentos de conocimiento |
| ⚠️ **Sistema de Crisis** | Misiones basadas en noticias reales del mundo |
| 🧟 **Seres Transformadores** | Usa los seres creados en Frankenstein Lab |
| 🏆 **Logros y XP** | Sistema de progresión gamificado |
| 👥 **Modo Comandante Global** | Juega sin GPS desde casa |

#### Sincronización con Colección Nuevo Ser

- **Bidireccional**: Los seres creados en Frankenstein Lab pueden usarse en misiones
- **Deep Links**: Enlaces directos entre apps
- **Progreso compartido**: XP y logros se sincronizan

#### Sistema de Crisis Dinámicas

El juego genera crisis basadas en noticias reales:

1. **Fuentes RSS**: Guardian, Al Jazeera, Reuters
2. **Clasificación IA**: Categoriza automáticamente las crisis
3. **Generación de misiones**: Crea objetivos jugables
4. **Fallback offline**: Crisis predefinidas cuando no hay conexión

#### Pantallas del Juego

| Pantalla | Función |
|----------|---------|
| MapScreen | Mapa con fractales y crisis cercanas |
| CommandCenterScreen | Modo comandante sin GPS |
| ProfileScreen | Estadísticas del jugador |
| FrankensteinLabScreen | Acceso al laboratorio embebido |
| CrisisDetailScreen | Detalles de misión activa |
| ConsciousnessShopScreen | Tienda de mejoras |

#### Compilar Awakening Protocol

```bash
cd mobile-game/mobile-app

# Instalar dependencias
npm install

# Android debug
cd android && ./gradlew assembleDebug

# Android release
./gradlew assembleRelease
```

---

## Biblioteca Principal

### Categorías de Libros

| Categoría | Descripción | Ejemplos |
|-----------|-------------|----------|
| Espiritualidad & Ciencia | Consciencia, física cuántica, realidad | El Código del Despertar |
| Filosofía Política | Ideas transformadoras de sociedad | Manifiesto por un Nuevo Ser |
| Activismo & Transformación | Acciones prácticas de cambio | Guía de Acciones |
| Prácticas & Ejercicios | Meditaciones y ejercicios guiados | Manual Práctico |
| Prácticas Avanzadas | Técnicas profundas de transformación | Prácticas Radicales |

### Funciones de la Biblioteca

1. **Búsqueda global**: Busca en títulos, descripciones y contenido
2. **Filtros por categoría**: Selecciona qué tipo de libros ver
3. **Ordenación**: Por título, fecha de adición, progreso
4. **Vista de grid/lista**: Cambia la visualización
5. **Libros recientes**: Los últimos 30 días destacados

---

## Lector de Libros

### Navegación

- **Menú lateral**: Lista de capítulos con indicador de lectura
- **Flechas**: Navegar entre capítulos (← →)
- **Teclado**: Flechas izquierda/derecha
- **Gestos táctiles**: Deslizar para cambiar capítulo

### Funcionalidades del Header

| Icono | Función | Descripción |
|-------|---------|-------------|
| ☰ | Menú | Abre el índice de capítulos |
| 🎧 | Audio | Activa el reproductor de audio |
| 🔖 | Marcador | Guarda el capítulo actual |
| 🔍 | Buscar | Busca texto en el libro |
| ⚙️ | Ajustes | Configuración de lectura |
| ❓ | Ayuda | Centro de ayuda |
| ❤️ | Donar | Apoyar el proyecto |

### Opciones de Lectura

- **Tamaño de fuente**: Pequeño, Normal, Grande, Muy Grande
- **Tema claro/oscuro**: Adapta colores a tus preferencias
- **Tema del libro**: Cada libro tiene su paleta de colores
- **Modo nocturno automático**: Según hora del día

### Referencias Cruzadas

Los libros tienen enlaces entre sí. Al hacer clic en una referencia:
1. Se carga el libro de destino
2. Se navega al capítulo específico
3. Se aplica el tema del nuevo libro

---

## Sistema de Audio

### Proveedores de Voz (TTS)

| Proveedor | Calidad | Requisitos | Voces |
|-----------|---------|------------|-------|
| Web Speech | Media | Ninguno | Navegador nativo |
| Capacitor | Alta | App Android | Sistema Android |
| OpenAI | Muy Alta | API Key + Premium | Alloy, Echo, Nova, etc. |

### Controles del Reproductor

#### Controles Principales
- ▶️ **Play/Pause**: Iniciar o pausar narración
- ⏮️ **Anterior**: Párrafo anterior
- ⏭️ **Siguiente**: Párrafo siguiente
- ⏹️ **Detener**: Parar y cerrar reproductor

#### Controles Secundarios
- **Velocidad**: 0.5x a 2x
- **Sleep Timer**: Apagar en 15/30/60 minutos
- **Auto-avance**: Pasar al siguiente capítulo automáticamente
- **Palabra por palabra**: Resaltar cada palabra mientras se lee
- **Marcador**: Guardar posición actual

#### Ambiente Sonoro
- 🌧️ **Lluvia**: Sonido de lluvia suave
- 🌳 **Bosque**: Sonidos de naturaleza
- 🌊 **Océano**: Olas del mar
- 🔥 **Fogata**: Crepitar del fuego

#### Audio Binaural
- 🎯 **Enfoque**: Ondas para concentración
- 😌 **Relax**: Ondas para relajación
- 🧘 **Meditación**: Ondas theta profundas
- 😴 **Sueño**: Ondas delta para dormir

### Barra de Progreso en Header

Cuando el audio está activo:
- El icono 🎧 cambia a ▶️ (play) o ⏸️ (pause)
- Aparece botón ▼ para desplegar reproductor completo
- Barra de progreso debajo del header
- Indicador de párrafo actual / total

---

## Laboratorio Frankenstein

### Concepto

Crea "seres" combinando conocimientos de diferentes libros. Cada ser tiene:
- **Nombre**: Generado según las categorías de los libros
- **Propósito**: Basado en las piezas seleccionadas
- **Síntesis**: Combinación de las enseñanzas
- **Práctica recomendada**: Ejercicio diario sugerido

### Sistema de Misiones

Las misiones definen qué piezas necesitas para crear seres específicos:

1. **Selecciona una misión** de la lista disponible
2. **Cumple los requisitos** (capítulos específicos, categorías, etc.)
3. **Crea el ser** cuando todos los requisitos estén cumplidos
4. **Recibe recompensas** (XP, logros, desbloqueos)

### Estadísticas del Jugador

Accede desde el botón 📊 en el menú:
- Seres creados
- Misiones completadas
- Total de experimentos
- Racha de días
- Tiempo de juego

### Ajustes del Laboratorio

Accede desde el botón ⚙️:
- 🔊 Sonido: Efectos del laboratorio
- ✨ Animaciones: Efectos visuales
- 📖 Tutorial: Ayuda contextual
- 💾 Autoguardado: Guardar progreso automático
- 🎮 Dificultad: Fácil/Normal/Difícil
- 🗑️ Reiniciar: Borrar todo el progreso

---

## Sistema Cosmos

### Navegación Espacial

- **Zoom**: Rueda del ratón o gestos de pinza
- **Rotación**: Arrastrar con ratón o dedo
- **Selección**: Click en un planeta/luna
- **Info panel**: Aparece al seleccionar

### Elementos Visuales

- **Sol central**: Colección Nuevo Ser
- **Planetas**: Libros principales
- **Lunas**: Capítulos de cada libro
- **Conexiones**: Líneas entre contenidos relacionados
- **Partículas**: Efecto de estrellas y polvo cósmico

---

## Prácticas y Ejercicios

### Biblioteca de Prácticas

Accede desde el botón "Prácticas" o la pestaña en navegación móvil:

- **Meditaciones guiadas**: Con audio y temporizador
- **Ejercicios de respiración**: Técnicas específicas
- **Contemplaciones**: Reflexiones profundas
- **Ejercicios físicos**: Movimientos conscientes

### Práctica del Día

El sistema recomienda una práctica diaria basada en:
- Tu historial de prácticas
- Libros que estás leyendo
- Hora del día
- Días de racha

### Seguimiento de Prácticas

- ✅ Marca prácticas como completadas
- 📊 Ve estadísticas de prácticas
- 🔥 Mantén tu racha diaria
- 🏆 Desbloquea logros

---

## Sistema de Progreso

### Métricas Rastreadas

| Métrica | Descripción |
|---------|-------------|
| Capítulos leídos | Por libro y total |
| Tiempo de lectura | Minutos dedicados |
| Racha de días | Días consecutivos leyendo |
| Prácticas completadas | Total y por tipo |
| Libros terminados | Completados al 100% |

### Dashboard de Progreso

Accede desde "Mi Progreso" en la biblioteca:

- **Gráfico de actividad**: Lectura por día/semana
- **Libros en curso**: Con barra de progreso
- **Logros desbloqueados**: Lista de achievements
- **Estadísticas globales**: Resumen de toda tu actividad

### Sistema de Logros

| Logro | Requisito |
|-------|-----------|
| 📖 Primer capítulo | Leer tu primer capítulo |
| 📚 Bibliófilo | Completar 3 libros |
| 🔥 Racha de 7 días | 7 días seguidos leyendo |
| 🧘 Practicante | 10 prácticas completadas |
| 🧬 Creador | Crear tu primer ser |

---

## Configuración y Ajustes

### Ajustes Generales

Accede desde el menú de perfil > Configuración:

#### General
- Idioma de la interfaz
- Tema claro/oscuro
- Tamaño de fuente por defecto

#### Inteligencia Artificial
- Proveedor de IA (OpenAI, Anthropic, local)
- API Key (para funciones premium)
- Modelo preferido

#### Cuenta
- Datos de usuario
- Sincronización
- Exportar datos

#### Notificaciones
- Recordatorio de lectura
- Práctica del día
- Actualizaciones

#### Seguridad
- Cambiar contraseña
- Sesiones activas
- Eliminar cuenta

#### Apariencia
- Tema del sistema
- Animaciones reducidas
- Alto contraste

#### Sincronización
- Estado de sincronización
- Última sincronización
- Forzar sincronización

#### Acerca de
- Versión de la app
- Licencias
- Créditos

---

## Funcionalidades Premium

### Características Premium

| Función | Descripción |
|---------|-------------|
| 🤖 Chat IA ilimitado | Preguntas sin límite |
| 🎙️ Voces OpenAI | TTS de alta calidad |
| 📥 Descargas offline | Libros completos sin internet |
| 🔄 Sync prioritaria | Sincronización en tiempo real |
| 🎨 Temas exclusivos | Paletas de colores adicionales |
| 📊 Estadísticas avanzadas | Análisis detallado |

### Cómo Activar Premium

1. Crea una cuenta o inicia sesión
2. Ve a Configuración > Cuenta
3. Selecciona "Activar Premium"
4. Completa el proceso de suscripción

### Donaciones

El proyecto acepta donaciones voluntarias:
- PayPal
- Crypto (Bitcoin, Ethereum)
- Patreon

---

## Instalación y Despliegue

### Versión Web (PWA)

```bash
# Clonar repositorio
git clone https://github.com/tu-usuario/coleccion-nuevo-ser.git

# Instalar dependencias
npm install

# Servir en desarrollo
npm run serve

# Construir para producción
npm run build
```

### Versión Android (Capacitor)

```bash
# Sincronizar web assets
npx cap sync

# Construir APK debug
cd android && ./gradlew assembleDebug

# Construir APK release
./gradlew assembleRelease

# Firmar APK
# (ver script build-apk.sh)
```

### Variables de Entorno

```env
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJxxx

# OpenAI (opcional, para TTS premium)
OPENAI_API_KEY=sk-xxx

# Google Analytics (opcional)
GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

---

## API y Servicios

### Supabase (Backend)

Tablas principales:
- `users`: Usuarios y perfiles
- `reading_progress`: Progreso de lectura
- `bookmarks`: Marcadores guardados
- `practices_completed`: Prácticas realizadas
- `ai_cache`: Caché de respuestas IA

### Edge Functions

- `check-version`: Verifica actualizaciones disponibles
- `ai-chat`: Procesa mensajes de chat IA
- `sync-progress`: Sincroniza progreso entre dispositivos

### Webhooks

- `on-book-completed`: Cuando se termina un libro
- `on-streak-milestone`: Al alcanzar racha importante
- `on-being-created`: Al crear un ser en Frankenstein

---

## Arquitectura Técnica

### Estructura de Archivos

```
coleccion-nuevo-ser/
├── www/                          # Aplicación web
│   ├── index.html                # Entrada principal
│   ├── lab.html                  # Laboratorio Frankenstein
│   ├── codigo-cosmico.html       # Visualización Cosmos
│   ├── css/
│   │   ├── core.css              # Estilos base
│   │   ├── themes/               # Temas por libro
│   │   └── frankenstein-*.css    # Estilos del lab
│   ├── js/
│   │   ├── core/                 # Módulos principales
│   │   │   ├── app-initialization.js
│   │   │   ├── book-engine.js
│   │   │   ├── book-reader.js
│   │   │   └── biblioteca.js
│   │   └── features/             # Funcionalidades
│   │       ├── audioreader.js
│   │       ├── frankenstein-ui.js
│   │       ├── ai-chat-modal.js
│   │       └── ...
│   └── books/                    # Contenido de libros
│       ├── catalog.json          # Índice de libros
│       └── {book-id}/
│           ├── config.json
│           ├── chapters/
│           └── assets/
├── android/                      # App Android (Capacitor)
├── supabase/                     # Configuración Supabase
│   └── migrations/               # Migraciones SQL
├── api/                          # Endpoints PHP
└── scripts/                      # Utilidades
```

### Tecnologías Utilizadas

| Categoría | Tecnología |
|-----------|------------|
| Frontend | Vanilla JS, TailwindCSS |
| Estilos | CSS Variables, Glassmorphism |
| 3D | Three.js (Cosmos) |
| Audio | Web Audio API, Speech Synthesis |
| Mobile | Capacitor 6 |
| Backend | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Storage | LocalStorage + Supabase |
| Analytics | Google Analytics 4 (opcional) |

### Flujo de Datos

```
Usuario → UI → BookEngine → LocalStorage
                    ↓
              Supabase Sync
                    ↓
              Cloud Database
```

---

## Soporte y Contacto

### Reportar Problemas

1. Ve a [GitHub Issues](https://github.com/tu-usuario/coleccion-nuevo-ser/issues)
2. Usa la plantilla de bug report
3. Incluye: versión, dispositivo, pasos para reproducir

### Contribuir

1. Fork del repositorio
2. Crea una rama para tu feature
3. Envía un Pull Request
4. Espera revisión

### Comunidad

- Discord: [enlace]
- Telegram: [enlace]
- Email: soporte@nuevosser.com

---

## Changelog

### v2.9.57 (Actual)
- ✅ Corregido: Analytics solo se activa con ID configurado
- ✅ Implementado: Generación dinámica de conocimiento en Frankenstein
- ✅ Implementado: Navegación entre libros por referencias cruzadas
- ✅ Implementado: Detección dinámica de libros recientes
- ✅ Implementado: Generación de imágenes compartibles (Canvas)
- ✅ Implementado: Modal de estadísticas en Frankenstein
- ✅ Implementado: Modal de ajustes en Frankenstein
- ✅ Mejorado: Modal de ayuda responsive en móvil
- ✅ Mejorado: Selector de sistema de voces en reproductor
- ✅ Corregido: Padding de biblioteca en móvil

### v2.9.56
- Sistema de audio mejorado
- Corrección de bottom nav en biblioteca

### v2.9.55
- Reproductor de audio completo con todas las funcionalidades
- Tema para libro "Nacimiento"

---

*Documentación generada el 21 de Diciembre de 2025*
*Colección Nuevo Ser v2.9.57*
