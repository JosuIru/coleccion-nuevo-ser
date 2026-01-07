# Archivos para Subir a gailu.net

**Versión actual local**: v2.9.286
**Versión en gailu.net**: v2.9.267
**Diferencia**: 19 versiones

## 📋 Archivos Críticos que DEBEN subirse

### 1. API Backend (OBLIGATORIO)
```
api/check-version.php
```
Este archivo es crítico para el sistema de actualizaciones.

### 2. Arquitectura Modular de BookReader (v2.9.279)
```
www/js/core/book-reader/book-reader-utils.js
www/js/core/book-reader/book-reader-sidebar.js
www/js/core/book-reader/book-reader-header.js
www/js/core/book-reader/book-reader-content.js
www/js/core/book-reader/book-reader-navigation.js
www/js/core/book-reader/book-reader-events.js
www/js/core/book-reader/book-reader-mobile.js
www/js/core/book-reader/index.js
```

### 3. Arquitectura Modular de AudioReader (v2.9.278)
```
www/js/features/audioreader/audioreader-sleep-timer.js
www/js/features/audioreader/audioreader-bookmarks.js
www/js/features/audioreader/audioreader-meditation.js
www/js/features/audioreader/audioreader-position.js
www/js/features/audioreader/audioreader-utils.js
www/js/features/audioreader/audioreader-content.js
www/js/features/audioreader/audioreader-highlighter.js
www/js/features/audioreader/audioreader-tts-engine.js
www/js/features/audioreader/audioreader-playback.js
www/js/features/audioreader/audioreader-events.js
www/js/features/audioreader/audioreader-ui.js
www/js/features/audioreader/index.js
```

### 4. Nuevos Helpers
```
www/js/utils/storage-helper.js
www/js/utils/ai-lazy-loader.js
www/js/utils/learning-lazy-loader.js
```

### 5. Archivos Core Actualizados
```
www/js/core/app-initialization.js  (VersionManager config)
www/js/core/icons.js
www/js/core/shortcuts-handler.js
www/js/core/supabase-sync-helper.js
```

### 6. Features Actualizadas
```
www/js/features/achievements-system.js
www/js/features/action-plans.js
www/js/features/admin-panel-modal.js
www/js/features/ai-suggestions.js
www/js/features/audio-mixer.js
www/js/features/auth-modal.js
www/js/features/auto-summary.js
www/js/features/binaural-modal.js
www/js/features/frankenstein-rewards.js
www/js/features/interactive-quiz.js
www/js/features/practice-library.js
www/js/features/resource-ai-helper.js
www/js/features/resources-viewer.js
www/js/features/shareable-moments.js
www/js/features/text-selection-helper.js
www/js/features/voice-notes.js
```

### 7. Archivos HTML y Config
```
www/index.html
www/manifest.json
www/books/catalog.json
www/css/welcome-flow.css
```

### 8. APKs (Opcional - solo si quieres ofrecer descarga directa)
```
www/downloads/coleccion-nuevo-ser-v2.9.284.apk
www/downloads/coleccion-nuevo-ser-v2.9.284.apk.idsig
www/downloads/coleccion-nuevo-ser-latest.apk (symlink)
```

## 🚀 Método Recomendado: Subir TODO www/

La forma más segura es subir todo el directorio `www/` completo:

### Por SFTP/FTP:
```bash
# Conectar a gailu.net
# Navegar a la raíz del sitio
# Subir toda la carpeta www/ (reemplazar archivos existentes)
```

### Por rsync (si tienes acceso SSH):
```bash
rsync -avz --progress www/ usuario@gailu.net:/ruta/al/sitio/www/
```

## ⚠️ IMPORTANTE: No olvides el API

Subir también:
```
api/check-version.php  →  https://gailu.net/api/check-version.php
```

## ✅ Verificación Post-Subida

Después de subir, verifica:

1. **Versión en la web**:
   - Abre https://gailu.net
   - Abre consola del navegador (F12)
   - Busca: `[AppInit] Versión:`
   - Debe mostrar: **2.9.286** (o superior)

2. **Módulos cargando correctamente**:
   - No debe haber errores "Unexpected token '<'"
   - BookReader debe definirse correctamente

3. **API funcionando**:
   ```bash
   curl -X POST https://gailu.net/api/check-version.php \
     -H "Content-Type: application/json" \
     -d '{"currentVersion":"2.9.0","platform":"android"}'
   ```
   Debe responder con JSON válido mostrando v2.9.286 como latest.

## 📦 Alternativa: Crear ZIP para subir

Si prefieres subir un archivo comprimido:
```bash
cd /home/josu/Documentos/guiaIT/25-11-25-version/coleccion-nuevo-ser
zip -r gailu-update-v2.9.286.zip www/ api/check-version.php -x "*.apk" "www/downloads/*.apk"
```

Luego descomprimir en el servidor.

## 🔍 Archivos que Cambiaron

Para ver exactamente qué cambió desde v2.9.267:
```bash
git log --oneline v2.9.267..HEAD --name-only | grep "www/"
```

## 💡 Consejo

Si tienes acceso a la carpeta del servidor, haz un backup antes:
```bash
cp -r www www.backup-2.9.267
cp api/check-version.php api/check-version.php.backup
```

Así puedes revertir si algo sale mal.
