# 🚀 DEPLOYMENT GUIDE - AWAKENING PROTOCOL

Guía completa para deployar Awakening Protocol en producción.

---

## 📋 PRE-RELEASE CHECKLIST

Antes de hacer un release, verifica:

### Código
- [ ] Todos los tests pasan (`npm test`)
- [ ] Linter sin errores (`npm run lint`)
- [ ] No hay console.logs en producción
- [ ] No hay TODOs críticos pendientes
- [ ] Código reviewed y mergeado a main

### Configuración
- [ ] Keystore generado y guardado de forma segura
- [ ] Variables de entorno configuradas (`.env.production`)
- [ ] API endpoints apuntan a producción
- [ ] Firebase/Sentry configurados (si aplica)
- [ ] Google Services configurado

### Assets
- [ ] Imágenes optimizadas
- [ ] SVGs minificados
- [ ] Audio en formato comprimido
- [ ] Iconos generados para todas las densidades
- [ ] Screenshots actualizados

### Play Store
- [ ] Descripción actualizada (ES + EN)
- [ ] Screenshots de calidad (mínimo 2)
- [ ] Feature graphic creado
- [ ] Privacy policy publicada
- [ ] Content rating completado

### Performance
- [ ] APK size < 50 MB (universal)
- [ ] Tiempo de inicio < 3s
- [ ] FPS del mapa > 30fps en dispositivos de gama baja
- [ ] Memoria < 200 MB
- [ ] Sin memory leaks

### Testing
- [ ] Probado en Android 6.0 (API 23)
- [ ] Probado en Android 14.0 (API 34)
- [ ] Probado en dispositivos de diferentes gamas
- [ ] Probado en diferentes tamaños de pantalla
- [ ] Probado offline/online
- [ ] Probado en diferentes regiones GPS

---

## 🔧 SETUP INICIAL

### 1. Instalar Dependencias

```bash
cd mobile-app
npm install
```

### 2. Configurar Android SDK

Asegúrate de tener:
- Android SDK Platform 34
- Android SDK Build-Tools 34.0.0
- Android SDK Platform-Tools
- NDK 25.1.8937393

```bash
# Verificar instalación
npx react-native doctor
```

### 3. Generar Keystore

**⚠️ IMPORTANTE: Solo hazlo UNA VEZ. Si pierdes el keystore, NO podrás actualizar la app en Play Store.**

```bash
cd ..
./scripts/create-keystore.sh
```

Guarda el keystore y las credenciales en:
1. USB encriptado
2. Gestor de passwords (1Password, Bitwarden, etc.)
3. Vault de tu organización
4. Cloud storage cifrado

### 4. Configurar Variables de Entorno

Crea `mobile-app/.env.production`:

```env
# API Configuration
API_BASE_URL=https://api.awakeningprotocol.com
API_TIMEOUT=10000

# Feature Flags
ENABLE_ANALYTICS=true
ENABLE_CRASH_REPORTING=true
ENABLE_PERFORMANCE_MONITORING=true

# Sentry (si se usa)
SENTRY_DSN=https://xxx@sentry.io/xxx
SENTRY_ENVIRONMENT=production

# Firebase (si se usa)
FIREBASE_ENABLED=false

# App Configuration
APP_VERSION=1.0.0
BUILD_TYPE=production
```

---

## 🏗️ BUILD PROCESS

### Opción A: Build Local

#### 1. Incrementar Versión

```bash
./scripts/bump-version.sh
```

Selecciona tipo de incremento:
- **Patch** (1.0.0 → 1.0.1): Bug fixes
- **Minor** (1.0.0 → 1.1.0): Nuevas features
- **Major** (1.0.0 → 2.0.0): Breaking changes

#### 2. Build Release APK

```bash
./scripts/build-release.sh
```

Opciones disponibles:
- `--no-clean`: No limpiar build anterior
- `--no-tests`: Saltar tests
- `--no-lint`: Saltar linter
- `--aab`: Generar AAB en lugar de APK
- `--skip-assets`: No optimizar assets

#### 3. Verificar Output

```bash
ls -lh mobile-app/android/app/build/outputs/apk/release/
```

Deberías ver:
- `awakening-protocol-v1.0.0-X-universal.apk` (todos los dispositivos)
- `awakening-protocol-v1.0.0-X-arm64.apk` (dispositivos modernos)
- `awakening-protocol-v1.0.0-X-arm32.apk` (dispositivos antiguos)
- `awakening-protocol-v1.0.0-X-x86.apk` (emuladores)

### Opción B: Build con CI/CD (GitHub Actions)

#### 1. Configurar Secrets en GitHub

Ve a: `Settings > Secrets and variables > Actions`

Agrega:
```
KEYSTORE_BASE64=<base64 del keystore>
KEYSTORE_PASSWORD=<password del keystore>
KEY_ALIAS=<alias de la key>
KEY_PASSWORD=<password de la key>
SENTRY_AUTH_TOKEN=<token de Sentry, opcional>
```

Para generar KEYSTORE_BASE64:
```bash
base64 -i mobile-app/android/app/awakening-release-key.keystore | pbcopy
# En Linux: base64 -w 0 ... | xclip -selection clipboard
```

#### 2. Push o Tag

**Push a main** (genera APK para testing):
```bash
git push origin main
```

**Tag para release** (genera APK + AAB + GitHub Release):
```bash
git tag -a v1.0.0 -m "Release 1.0.0"
git push origin v1.0.0
```

#### 3. Monitorear Build

Ve a: `Actions` tab en GitHub

El workflow:
1. ✅ Ejecuta tests
2. ✅ Build APK firmado
3. ✅ Genera múltiples variantes por ABI
4. ✅ Sube artifacts
5. ✅ (Si es tag) Crea GitHub Release
6. ✅ (Si es tag) Notifica a Sentry

---

## 📦 DISTRIBUCIÓN

### Opción 1: Google Play Store (Recomendado)

#### Preparación

1. **Crear cuenta de desarrollador**: https://play.google.com/console
   - Costo: $25 USD (una sola vez)

2. **Generar AAB**:
   ```bash
   ./scripts/build-release.sh --aab
   ```

3. **Completar Play Store listing**:
   - Descripción (ver `play-store/store-listing-ES.md`)
   - Screenshots (mínimo 2)
   - Feature graphic
   - Launcher icon
   - Privacy policy

#### Subir a Play Console

1. **Crear nueva app**:
   - Nombre: "Awakening Protocol"
   - Idioma: Español
   - Tipo: App o juego gratuito

2. **Internal Testing** (recomendado primero):
   - Upload AAB
   - Agregar testers internos
   - Probar durante 1-2 semanas

3. **Closed Alpha/Beta**:
   - Upload AAB
   - Invitar testers externos
   - Recoger feedback

4. **Production**:
   - Upload AAB final
   - Completar todo el listing
   - Submit for review
   - Esperar aprobación (1-3 días típicamente)

#### Actualizaciones

Para actualizar:
1. Incrementar versión: `./scripts/bump-version.sh`
2. Build nuevo AAB: `./scripts/build-release.sh --aab`
3. Upload a Play Console
4. Agregar "What's new" (changelog)
5. Submit

**Rollout gradual recomendado**:
- Día 1: 5% de usuarios
- Día 3: 25% de usuarios
- Día 5: 50% de usuarios
- Día 7: 100% de usuarios

### Opción 2: GitHub Releases (Open Source)

```bash
# Crear release
gh release create v1.0.0 \
  mobile-app/android/app/build/outputs/apk/release/*.apk \
  --title "Awakening Protocol v1.0.0" \
  --notes-file CHANGELOG-v1.0.0.md

# O usar la interfaz web de GitHub
```

### Opción 3: Firebase App Distribution (Beta Testing)

1. **Setup**:
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase init
   ```

2. **Upload**:
   ```bash
   firebase appdistribution:distribute \
     mobile-app/android/app/build/outputs/apk/release/app-release.apk \
     --app YOUR_FIREBASE_APP_ID \
     --groups testers \
     --release-notes "Version 1.0.0 - Bug fixes and improvements"
   ```

### Opción 4: Direct APK Distribution

**⚠️ Advertencias de seguridad**:
- Los usuarios deben habilitar "Fuentes desconocidas"
- No hay actualizaciones automáticas
- Mayor riesgo de APKs modificados

Solo recomendado para:
- Testing interno
- Distribución muy controlada
- Regiones sin acceso a Play Store

---

## 🔄 ROLLBACK PROCEDURE

Si necesitas hacer rollback de una versión:

### En Play Store

1. **Detener rollout**:
   - Play Console > Release > Halt rollout

2. **Revertir a versión anterior**:
   - No es posible automáticamente
   - Debes subir una nueva versión con el código anterior
   - Incrementa versionCode pero usa código estable

3. **Hotfix urgente**:
   ```bash
   git checkout v1.0.0  # última versión estable
   git checkout -b hotfix/1.0.1
   # Hacer fix
   ./scripts/bump-version.sh  # patch: 1.0.0 → 1.0.1
   ./scripts/build-release.sh --aab
   # Upload a Play Console
   ```

### GitHub Releases

1. **Marcar release como pre-release**:
   ```bash
   gh release edit v1.0.0 --prerelease
   ```

2. **Crear nuevo release con fix**:
   ```bash
   gh release create v1.0.1 --notes "Hotfix for critical bug"
   ```

---

## 🐛 TROUBLESHOOTING

### Build Fails

**Error: "SDK location not found"**
```bash
echo "sdk.dir=$ANDROID_HOME" > mobile-app/android/local.properties
```

**Error: "Keystore not found"**
```bash
./scripts/create-keystore.sh
```

**Error: "Duplicate resources"**
```bash
cd mobile-app/android
./gradlew clean
cd ../..
./scripts/build-release.sh
```

### APK Too Large

1. **Check size**:
   ```bash
   ls -lh mobile-app/android/app/build/outputs/apk/release/*.apk
   ```

2. **Enable ProGuard** (ya está enabled):
   - Verifica `build.gradle`: `minifyEnabled true`

3. **Optimize assets**:
   ```bash
   ./scripts/optimize-assets.sh
   ```

4. **Use splits** (ya configurado):
   - Genera APKs por ABI automáticamente

5. **Remove unused libraries**:
   ```bash
   npm prune --production
   ```

### Crashes After Release

1. **Check Sentry/Crashlytics**:
   - Ver stack traces
   - Identificar patrones

2. **Test on affected devices**:
   - Obtener logs: `adb logcat`

3. **Hotfix urgente**:
   - Ver sección Rollback

### Performance Issues

1. **Monitor con Firebase Performance**:
   ```javascript
   import firebasePerf from './services/FirebasePerformance';
   await firebasePerf.measureAppStart();
   ```

2. **Profile con React DevTools**:
   ```bash
   npm install -g react-devtools
   react-devtools
   ```

3. **Analyze bundle**:
   ```bash
   npx react-native-bundle-visualizer
   ```

---

## 📊 POST-DEPLOYMENT MONITORING

### Métricas Clave

**Performance**:
- App start time: < 3s
- Frame rate: > 30 fps
- Memory usage: < 200 MB
- Crash-free rate: > 99%

**Engagement**:
- DAU (Daily Active Users)
- MAU (Monthly Active Users)
- Session length: > 5 min
- Retention D1: > 40%
- Retention D7: > 20%

**Quality**:
- Rating: > 4.0 ⭐
- Review sentiment: > 70% positive
- Uninstall rate: < 5%

### Herramientas

**Google Play Console**:
- Statistics
- Vitals (crashes, ANRs)
- Reviews
- Pre-launch reports

**Firebase**:
- Analytics
- Performance
- Crashlytics
- A/B Testing

**Sentry**:
- Error tracking
- Performance monitoring
- Release health

---

## 🔐 SECURITY CHECKLIST

Antes de release:

- [ ] No hay API keys hardcoded
- [ ] No hay passwords en código
- [ ] ProGuard/R8 habilitado
- [ ] HTTPS para todas las requests
- [ ] Certificate pinning (si aplica)
- [ ] Input validation en formularios
- [ ] Secure storage para datos sensibles
- [ ] Permisos mínimos necesarios
- [ ] Ofuscación de código crítico
- [ ] No logs sensibles en producción

---

## 📚 RECURSOS ADICIONALES

### Documentación Oficial
- [Google Play Console](https://play.google.com/console/about/)
- [Android Developer Guides](https://developer.android.com/guide)
- [React Native Docs](https://reactnative.dev/docs/getting-started)

### Herramientas
- [Fastlane](https://fastlane.tools/): Automatización de deployments
- [Bitrise](https://www.bitrise.io/): CI/CD para mobile
- [AppCenter](https://appcenter.ms/): Testing y distribución

### Comunidad
- [React Native Community](https://github.com/react-native-community)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/react-native)

---

## 📞 SUPPORT

Para soporte con el deployment:

- Email: dev@nuevosser.org
- Discord: https://discord.gg/nuevosser
- GitHub Issues: https://github.com/nuevosser/awakening-protocol/issues

---

**¡Buena suerte con el deployment! 🚀**

Recuerda: El primer deployment es el más difícil. Los siguientes serán mucho más fáciles.
