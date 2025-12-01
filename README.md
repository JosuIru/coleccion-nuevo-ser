# 📚 Colección Nuevo Ser

> Exploraciones en la Frontera del Pensamiento Humano-IA

Una plataforma de libros interactivos que explora consciencia, filosofía y transformación social a través de la colaboración humano-IA.

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/...)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Web](https://img.shields.io/badge/web-gailu.net%2Fcoleccion-orange.svg)](https://gailu.net/coleccion)

---

## 🎯 ¿Qué es Colección Nuevo Ser?

Una aplicación web/móvil para **leer libros interactivos** con features avanzadas:

- 📖 **Lectura fluida** con navegación intuitiva
- 🤖 **Chat con IA** especializada en cada libro
- 📝 **Notas personales** con Markdown
- 🎧 **Narración con TTS** (Text-to-Speech)
- ⏳ **Timeline histórico** de movimientos sociales
- 🔗 **Recursos externos** curados
- 📱 **App Android** nativa con Capacitor

---

## 📚 Libros Disponibles

### 🌌 El Código del Despertar
**Tema:** Consciencia, física cuántica, meditación

Explora la naturaleza de la consciencia, la conexión entre ciencia y espiritualidad, y prácticas contemplativas.

- **16 capítulos** (Prólogo + 14 + Epílogo)
- **26,204 palabras**
- **Meditaciones guiadas** y ejercicios
- **IA contemplativa** para profundizar en conceptos

### 🔥 Manifiesto de la Conciencia Compartida
**Tema:** Filosofía política, crítica sistémica, alternativas

Análisis crítico del capitalismo y exploración de alternativas para una sociedad más justa.

- **18 capítulos** + Prólogo + Epílogo
- **141,270 caracteres**
- **54 reflexiones críticas** + **54 acciones sugeridas**
- **Timeline histórico** de 25 eventos (1789-2024)
- **30 recursos externos** (organizaciones, libros, docs, tools)
- **3 modos de IA** (Crítico, Constructivo, Historiador)

---

## ✨ Features

### Core
- ✅ Sistema de libros modular
- ✅ Navegación entre capítulos
- ✅ Progreso de lectura persistente
- ✅ Bookmarks por capítulo
- ✅ Temas dinámicos por libro
- ✅ Markdown rendering
- ✅ Responsive design

### Avanzadas
- 🤖 **Chat IA** con multi-modos
- 📝 **Notas personales** con export a Markdown
- 🎧 **Audioreader** con controles (play/pause/speed)
- ⏳ **Timeline histórico** interactivo
- 🔗 **Recursos externos** categorizados

---

## 🚀 Quick Start

### Uso Web (Sin instalación)

Accede directamente desde tu navegador:
```
https://gailu.net/coleccion/
```

### Instalación Local

```bash
# Clonar repositorio
git clone https://github.com/tu-repo/coleccion-nuevo-ser.git
cd coleccion-nuevo-ser

# Levantar servidor local
cd www
python3 -m http.server 8000

# Abrir en navegador
# http://localhost:8000
```

### App Android

**APK disponible en:**
```
android/app/build/outputs/apk/debug/app-debug.apk
```

**Instalar en dispositivo:**
```bash
# Vía ADB
adb install android/app/build/outputs/apk/debug/app-debug.apk

# O transfiere el archivo APK a tu móvil y abre
```

**Compilar tú mismo:**
```bash
# Ver guía completa en: docs/COMPILAR-APK-ANDROID.md
cd android && ./gradlew assembleDebug
# APK en: android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 📖 Documentación

### Para Usuarios
- **[Guía de Usuario](docs/GUIA-USUARIO.md)** - Cómo usar todas las features
- **[Cómo Probar Chat IA](docs/COMO-PROBAR-CHAT-IA.md)** - Configurar y usar el chat

### Para Desarrolladores
- **[Arquitectura Técnica](docs/ARQUITECTURA-TECNICA.md)** - Detalles técnicos completos
- **[Compilar APK Android](docs/COMPILAR-APK-ANDROID.md)** - Guía de compilación
- **[Deploy a Web](docs/DEPLOY-WEB.md)** - Cómo subir a tu servidor

### Resúmenes
- **[Features Completadas](docs/FEATURES-COMPLETADAS.md)** - Resumen de features
- **[Resumen de Sesión](docs/RESUMEN-SESION-COMPLETA.md)** - Historial de desarrollo

---

## 🏗️ Arquitectura

```
coleccion-nuevo-ser/
├── www/                    # Web app (620 KB)
│   ├── index.html
│   ├── css/
│   │   ├── core.css
│   │   └── themes/
│   ├── js/
│   │   ├── core/          # BookEngine, Biblioteca, BookReader
│   │   ├── ai/            # AI system
│   │   └── features/      # Chat, Notes, Timeline, Resources, Audio
│   └── books/
│       ├── catalog.json
│       ├── codigo-despertar/
│       └── manifiesto/
├── android/               # Android project (Capacitor)
├── docs/                  # Documentation
└── deploy.sh              # Deploy script
```

**Stack:**
- Vanilla JavaScript (ES6+)
- Tailwind CSS (CDN)
- LocalStorage (persistencia)
- Capacitor v6 (Android)
- Web Speech API (TTS)
- Claude API (chat IA)

---

## 🎮 Uso

### Leer un Libro

1. **Abre la biblioteca** (pantalla principal)
2. **Click en un libro** para abrirlo
3. **Navega** con los botones `←` y `→`
4. **Usa el sidebar** para saltar entre capítulos

### Chat con IA 🤖

1. **Click en 🤖** en el header
2. **Configura API key** (primera vez):
   ```javascript
   // En consola del navegador (F12)
   localStorage.setItem('claude_api_key', 'sk-ant-TU_KEY');
   ```
3. **Escribe tu pregunta** y presiona Enter
4. **Cambia de modo** (solo en Manifiesto) para diferentes perspectivas

### Tomar Notas 📝

1. **Click en 📝** en el header
2. **Escribe tu nota** con Markdown
3. **Guarda** con Ctrl+Enter
4. **Exporta** todas tus notas a archivo .md

### Narración (Audioreader) 🎧

1. **Click en 🎧** en el header
2. **Aparecen controles** en la parte inferior
3. **Click ▶️** para empezar
4. **Ajusta velocidad** y voz a tu gusto

---

## 🔧 Configuración

### API Key de Claude (para Chat IA)

**Obtener key:**
1. Regístrate en [https://console.anthropic.com/](https://console.anthropic.com/)
2. Crea una API key en el dashboard
3. Copia la key (empieza con `sk-ant-`)

**Configurar en la app:**
```javascript
// Opción 1: Desde consola del navegador (F12)
localStorage.setItem('claude_api_key', 'sk-ant-TU_KEY_AQUI');

// Opción 2: Desde el código (temporal)
// Edita www/index.html línea ~171
aiConfig.setClaudeApiKey('sk-ant-TU_KEY_AQUI');
```

### Personalizar Temas

Edita `www/books/[libro]/config.json`:

```json
{
  "theme": {
    "primary": "#0ea5e9",
    "secondary": "#a855f7",
    "accent": "#fbbf24"
  }
}
```

---

## 📱 Plataformas

### ✅ Web (Desktop & Mobile)
- **Chrome/Edge:** ✅ Excelente (todas las features)
- **Safari:** ✅ Bueno (TTS limitado)
- **Firefox:** ✅ Bueno (TTS experimental)

### ✅ Android (App Nativa)
- **Versión mínima:** Android 5.0 (API 22)
- **Target:** Android 13 (API 33)
- **Tamaño APK:** ~3-5 MB

### 🔜 iOS (Futuro)
- Capacitor soporta iOS
- Requiere compilación en macOS con Xcode

---

## 🤝 Contribuir

¡Las contribuciones son bienvenidas!

### Reportar Bugs

Abre un issue en GitHub con:
- Descripción del problema
- Pasos para reproducir
- Navegador/dispositivo
- Screenshots (si aplica)

### Proponer Features

Abre un issue con:
- Descripción de la feature
- Caso de uso
- Mockups (opcional)

### Pull Requests

1. Fork del repo
2. Crea branch: `git checkout -b feature/mi-feature`
3. Commit: `git commit -m 'Add: mi feature'`
4. Push: `git push origin feature/mi-feature`
5. Abre Pull Request

**Estilo de código:**
- JavaScript: ES6+, 2 espacios, comillas simples
- CSS: Tailwind utilities preferidas
- Commits: Descriptivos en español

---

## 📊 Roadmap

### v2.1 (Próximo)
- [ ] Service Worker para modo offline completo
- [ ] Estadísticas avanzadas de lectura
- [ ] Sistema de logros/badges
- [ ] Compartir citas en redes sociales

### v3.0 (Futuro)
- [ ] Backend para sync entre dispositivos
- [ ] App iOS nativa
- [ ] Modo colaborativo (comentarios compartidos)
- [ ] Más libros de la colección

---

## 📄 Licencia

MIT License - Ver [LICENSE](LICENSE) para más detalles.

Copyright (c) 2025 J. Irurtzun & Claude

---

## 🙏 Agradecimientos

- **Anthropic** por Claude API
- **Capacitor** por el framework híbrido
- **Tailwind CSS** por el sistema de diseño
- **Web Speech API** por TTS
- **Todos los contribuidores** y usuarios

---

## 📞 Contacto

- **Web:** [gailu.net/coleccion](https://gailu.net/coleccion)
- **Email:** [contacto@gailu.net](mailto:contacto@gailu.net)
- **GitHub:** [Issues](https://github.com/...)

---

## 📈 Stats

![GitHub stars](https://img.shields.io/github/stars/..?style=social)
![GitHub forks](https://img.shields.io/github/forks/..?style=social)

**Hecho con ❤️ por humanos e IA**

---

## 🎯 TL;DR

```bash
# 1. Clonar
git clone https://github.com/.../coleccion-nuevo-ser.git

# 2. Servir
cd coleccion-nuevo-ser/www
python3 -m http.server 8000

# 3. Abrir
# http://localhost:8000

# 4. Disfrutar
# 📖 Lee, 🤖 chatea, 📝 toma notas, 🎧 escucha
```

**¡Explora, aprende y comparte!** 🚀
