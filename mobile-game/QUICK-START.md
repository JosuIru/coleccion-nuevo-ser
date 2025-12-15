# ⚡ QUICK START - AWAKENING PROTOCOL

Guía rápida para empezar a trabajar en 5 minutos.

---

## 🚀 SETUP INICIAL (Solo primera vez)

### 1. Instalar Dependencias

```bash
# Navegar al proyecto
cd mobile-game/mobile-app

# Instalar paquetes npm
npm install
```

### 2. Verificar Android SDK

```bash
# Verificar que todo esté OK
npx react-native doctor

# Si hay problemas, instala Android SDK desde Android Studio
# https://developer.android.com/studio
```

### 3. Generar Keystore (SOLO UNA VEZ)

```bash
cd ..
./scripts/create-keystore.sh
```

⚠️ **IMPORTANTE:** Guarda las credenciales de forma segura. No las pierdas.

---

## 🏃 DESARROLLO DIARIO

### Iniciar App en Emulador/Dispositivo

```bash
cd mobile-app

# Opción 1: Todo en uno
npm run android

# Opción 2: Metro bundler separado
# Terminal 1
npm start

# Terminal 2
npx react-native run-android
```

### Comandos Útiles

```bash
# Tests
npm test

# Linter
npm run lint

# Limpiar cache
npm start -- --reset-cache
```

---

## 📦 BUILD DE PRODUCCIÓN

### Opción Rápida (Recomendada)

```bash
cd mobile-game

# Build completo automático
./scripts/build-release.sh
```

Esto hace automáticamente:
- ✅ Limpia builds anteriores
- ✅ Ejecuta tests
- ✅ Ejecuta linter
- ✅ Optimiza assets
- ✅ Genera APK firmado
- ✅ Crea changelog

**APKs generados en:**
```
mobile-app/android/app/build/outputs/apk/release/
```

### Opciones Avanzadas

```bash
# Sin tests (más rápido)
./scripts/build-release.sh --no-tests --no-lint

# AAB para Play Store
./scripts/build-release.sh --aab

# Build limpio completo
./scripts/build-release.sh
```

---

## 🔄 ACTUALIZAR VERSIÓN

### Antes de cada release

```bash
cd mobile-game

# Incrementar versión automáticamente
./scripts/bump-version.sh
```

Selecciona:
- **1** para patch (1.0.0 → 1.0.1) - bug fixes
- **2** para minor (1.0.0 → 1.1.0) - nuevas features
- **3** para major (1.0.0 → 2.0.0) - breaking changes

Esto automáticamente:
- ✅ Actualiza package.json
- ✅ Crea entrada en CHANGELOG.md
- ✅ Hace commit de git
- ✅ Crea tag de git

### Push a GitHub

```bash
# Push normal
git push origin main

# Push con tags (para CI/CD)
git push origin main --tags
```

---

## 🎨 OPTIMIZAR ASSETS

```bash
cd mobile-game

# Optimizar imágenes, SVGs, etc.
./scripts/optimize-assets.sh
```

Requiere (instalar si no lo tienes):
```bash
# Ubuntu/Debian
sudo apt install pngquant jpegoptim
npm install -g svgo

# macOS
brew install pngquant jpegoptim
npm install -g svgo
```

---

## 🐛 PROBLEMAS COMUNES

### "Unable to load script"

```bash
cd mobile-app
npm start -- --reset-cache
```

### "SDK location not found"

```bash
# Linux/Mac
echo "sdk.dir=$ANDROID_HOME" > android/local.properties

# Si ANDROID_HOME no está definido
export ANDROID_HOME=$HOME/Android/Sdk
echo "sdk.dir=$ANDROID_HOME" > android/local.properties
```

### "Gradle daemon stopped"

```bash
cd android
./gradlew clean
./gradlew --stop
cd ..
npm run android
```

### "Metro bundler port already in use"

```bash
# Matar proceso en puerto 8081
npx react-native start --reset-cache --port 8082
```

---

## 📱 TESTING EN DISPOSITIVO REAL

### Via USB

1. Habilitar **Opciones de desarrollador** en el dispositivo
2. Habilitar **Depuración USB**
3. Conectar dispositivo via USB
4. Ejecutar:

```bash
# Verificar que el dispositivo esté conectado
adb devices

# Ejecutar app
npm run android
```

### Via WiFi (Android 11+)

1. Conectar dispositivo via USB primero
2. Ejecutar:

```bash
adb tcpip 5555
adb connect <IP_DEL_DISPOSITIVO>:5555
```

3. Ya puedes desconectar el cable USB

---

## 🚢 DEPLOY A PLAY STORE

### 1. Generar AAB

```bash
cd mobile-game
./scripts/build-release.sh --aab
```

**AAB generado en:**
```
mobile-app/android/app/build/outputs/bundle/release/
```

### 2. Subir a Play Console

1. Ir a https://play.google.com/console
2. Seleccionar tu app
3. **Production > Create new release**
4. Upload AAB
5. Completar "What's new"
6. Submit for review

### 3. Monitorear

- Reviews: Play Console > Reviews
- Crashes: Play Console > Vitals
- Analytics: Play Console > Statistics

---

## 📚 MÁS INFORMACIÓN

- **Deployment completo**: Ver `DEPLOYMENT.md`
- **Production checklist**: Ver `PRODUCTION-READY.md`
- **Play Store assets**: Ver `play-store/ASSETS-CHECKLIST.md`

---

## 🆘 AYUDA

¿Necesitas ayuda?

- 📧 dev@nuevosser.org
- 💬 https://discord.gg/nuevosser
- 📖 Ver documentación completa

---

## ✅ WORKFLOW TÍPICO

### Día a día

```bash
# 1. Pull últimos cambios
git pull origin main

# 2. Instalar dependencias (si hay cambios)
cd mobile-app && npm install

# 3. Desarrollar
npm run android

# 4. Commit cambios
git add .
git commit -m "feat: nueva funcionalidad X"
git push origin main
```

### Antes de release

```bash
# 1. Incrementar versión
cd mobile-game
./scripts/bump-version.sh

# 2. Build y test
./scripts/build-release.sh

# 3. Test manual en dispositivos reales

# 4. Push con tags
git push origin main --tags

# 5. (Opcional) GitHub Actions hace el resto automáticamente
```

### Release a Play Store

```bash
# 1. Build AAB
./scripts/build-release.sh --aab

# 2. Upload a Play Console

# 3. Monitor por 24-48h

# 4. Si todo OK, rollout gradual:
#    5% → 25% → 50% → 100%
```

---

**¡Eso es todo! Ya estás listo para desarrollar y deployar. 🚀**
