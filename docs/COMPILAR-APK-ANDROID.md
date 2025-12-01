# 📱 CÓMO COMPILAR APK ANDROID - Colección Nuevo Ser

## Estado Actual

✅ **Capacitor configurado completamente**
✅ **Proyecto Android generado**
✅ **Archivos web sincronizados**
⚠️ **Pendiente: Aceptar licencias de Android SDK**

---

## 🎯 PROBLEMA ACTUAL

El build falla porque las licencias del Android SDK no han sido aceptadas:

```
Failed to install the following Android SDK packages as some licences have not been accepted.
   platforms;android-33 Android SDK Platform 33
   build-tools;34.0.0 Android SDK Build-Tools 34
```

---

## ✅ SOLUCIÓN: Aceptar Licencias

### Opción 1: Con sdkmanager (Recomendado)

```bash
# Buscar sdkmanager
find /usr/lib/android-sdk -name "sdkmanager"

# Si está en cmdline-tools/latest/bin/
/usr/lib/android-sdk/cmdline-tools/latest/bin/sdkmanager --licenses

# O si está en tools/bin/
/usr/lib/android-sdk/tools/bin/sdkmanager --licenses

# Aceptar todas las licencias presionando 'y' cuando pregunte
```

### Opción 2: Crear archivos de licencia manualmente

```bash
# Crear directorio de licencias
sudo mkdir -p /usr/lib/android-sdk/licenses

# Crear archivo de licencia de Android SDK
echo -e "\n24333f8a63b6825ea9c5514f83c2829b004d1fee" | sudo tee /usr/lib/android-sdk/licenses/android-sdk-license

# Crear licencia de preview
echo -e "\n84831b9409646a918e30573bab4c9c91346d8abd" | sudo tee /usr/lib/android-sdk/licenses/android-sdk-preview-license
```

### Opción 3: Usar Android Studio

1. Abrir Android Studio
2. Tools → SDK Manager
3. SDK Tools tab
4. Marcar "Android SDK Platform 33" y "Android SDK Build-Tools 34"
5. Click "OK" → Aceptar licencias → Install

---

## 🚀 COMPILAR APK (Después de aceptar licencias)

### Debug APK (Para pruebas)

```bash
cd /home/josu/Documentos/guiaIT/25-11-25-version/coleccion-nuevo-ser

# Sync archivos web a Android
npx cap sync

# Compilar APK debug
cd android && ./gradlew assembleDebug

# El APK estará en:
# android/app/build/outputs/apk/debug/app-debug.apk
```

### Release APK (Para publicación)

```bash
# 1. Generar keystore (primera vez)
keytool -genkey -v -keystore ~/coleccion-keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias coleccion

# 2. Configurar signing en android/app/build.gradle
# Añadir antes de android { ... }:

def keystorePropertiesFile = rootProject.file("keystore.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
    // ... config existente ...

    signingConfigs {
        release {
            if (keystorePropertiesFile.exists()) {
                keyAlias keystoreProperties['keyAlias']
                keyPassword keystoreProperties['keyPassword']
                storeFile file(keystoreProperties['storeFile'])
                storePassword keystoreProperties['storePassword']
            }
        }
    }

    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}

# 3. Crear android/keystore.properties:
storeFile=/home/josu/coleccion-keystore.jks
storePassword=TU_PASSWORD
keyAlias=coleccion
keyPassword=TU_PASSWORD

# 4. Compilar release
cd android && ./gradlew assembleRelease

# El APK estará en:
# android/app/build/outputs/apk/release/app-release.apk
```

---

## 📂 ESTRUCTURA DEL PROYECTO

```
coleccion-nuevo-ser/
├── www/                          (Web assets)
│   ├── index.html
│   ├── css/
│   ├── js/
│   └── books/
├── android/                      (Android project)
│   ├── app/
│   │   └── build/
│   │       └── outputs/
│   │           └── apk/
│   │               ├── debug/
│   │               │   └── app-debug.apk ← APK DEBUG
│   │               └── release/
│   │                   └── app-release.apk ← APK RELEASE
│   ├── build.gradle
│   ├── variables.gradle
│   └── local.properties         (SDK location)
├── capacitor.config.json         (Capacitor config)
├── package.json                  (npm dependencies)
└── node_modules/                 (Capacitor CLI)
```

---

## 🔧 CONFIGURACIÓN ACTUAL

### capacitor.config.json

```json
{
  "appId": "com.nuevosser.coleccion",
  "appName": "Colección Nuevo Ser",
  "webDir": "www",
  "server": {
    "androidScheme": "https"
  }
}
```

### android/variables.gradle

```groovy
ext {
    minSdkVersion = 22          // Android 5.0+
    compileSdkVersion = 33
    targetSdkVersion = 33
}
```

### android/local.properties

```
sdk.dir=/usr/lib/android-sdk
```

---

## ✅ CHECKLIST DE BUILD

- [x] Node.js y npm instalados
- [x] Capacitor instalado (`npm install`)
- [x] Plataforma Android añadida (`npx cap add android`)
- [x] Archivos web sincronizados (`npx cap sync`)
- [x] Android SDK ubicado (`/usr/lib/android-sdk`)
- [x] `local.properties` configurado
- [x] Gradle wrapper ejecutable (`chmod +x gradlew`)
- [ ] **Licencias de Android SDK aceptadas** ← PENDIENTE
- [ ] APK compilado

---

## 🐛 TROUBLESHOOTING

### Error: "SDK location not found"

**Solución:** Crear `android/local.properties` con:
```
sdk.dir=/usr/lib/android-sdk
```

### Error: "License not accepted"

**Solución:** Ver "Opción 1" o "Opción 2" arriba para aceptar licencias.

### Error: "Java version incompatible"

**Solución:** Verificar Java version:
```bash
java -version  # Debe ser Java 11 o superior
```

Si es muy viejo, instalar Java 17:
```bash
sudo apt install openjdk-17-jdk
```

### Error: "Gradle sync failed"

**Solución:**
```bash
cd android
./gradlew clean
./gradlew --stop
./gradlew assembleDebug
```

### Error: "Out of memory"

**Solución:** Editar `android/gradle.properties`:
```
org.gradle.jvmargs=-Xmx2048m -XX:MaxPermSize=512m
```

---

## 📱 INSTALAR APK EN DISPOSITIVO

### Opción 1: USB (Recomendado)

```bash
# Habilitar USB debugging en Android (Ajustes → Opciones de desarrollador)

# Conectar dispositivo por USB

# Verificar conexión
adb devices

# Instalar APK
adb install android/app/build/outputs/apk/debug/app-debug.apk

# Si ya está instalado (actualizar)
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

### Opción 2: Compartir archivo

1. Copiar APK a un servidor web o Google Drive
2. Descargar en el dispositivo Android
3. Habilitar "Instalar apps de fuentes desconocidas"
4. Abrir archivo APK → Instalar

### Opción 3: Android Studio

```bash
# Abrir proyecto en Android Studio
npx cap open android

# En Android Studio:
# Run → Run 'app'
# Seleccionar dispositivo conectado o emulador
```

---

## 📊 TAMAÑO ESPERADO DEL APK

**Debug APK:** ~3-5 MB
- Incluye código no optimizado
- Incluye symbols de debug
- Sin ProGuard

**Release APK:** ~2-3 MB
- Código optimizado
- Sin symbols de debug
- Comprimido

**Contenido incluido:**
- Toda la carpeta `www/` (585 KB)
- Capacitor runtime
- WebView bindings
- Android system libraries

---

## 🚀 PRÓXIMOS PASOS

1. **Aceptar licencias** (ver arriba)
2. **Compilar APK:**
   ```bash
   cd android && ./gradlew assembleDebug
   ```
3. **Verificar APK:**
   ```bash
   ls -lh android/app/build/outputs/apk/debug/app-debug.apk
   ```
4. **Instalar en dispositivo:**
   ```bash
   adb install android/app/build/outputs/apk/debug/app-debug.apk
   ```
5. **Probar la app** en el dispositivo

---

## 📝 COMANDOS ÚTILES

```bash
# Ver logs de la app en tiempo real
adb logcat | grep "Colección"

# Ver dispositivos conectados
adb devices

# Desinstalar app
adb uninstall com.nuevosser.coleccion

# Reiniciar adb
adb kill-server && adb start-server

# Limpiar build
cd android && ./gradlew clean

# Ver todas las tareas disponibles
cd android && ./gradlew tasks

# Build con más info
cd android && ./gradlew assembleDebug --info
```

---

## ✅ ESTADO FINAL

**Todo está configurado y listo.** Solo falta ejecutar:

```bash
# 1. Aceptar licencias (una sola vez)
sudo /usr/lib/android-sdk/tools/bin/sdkmanager --licenses

# 2. Compilar
cd /home/josu/Documentos/guiaIT/25-11-25-version/coleccion-nuevo-ser/android
./gradlew assembleDebug

# 3. El APK estará en:
# android/app/build/outputs/apk/debug/app-debug.apk
```

**¡Listo para compilar!** 🎉
