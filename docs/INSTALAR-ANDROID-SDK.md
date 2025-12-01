# 🔧 INSTALAR ANDROID SDK COMPLETO

## Problema Detectado

Tu instalación de Android SDK solo tiene:
- `platform-tools/` (adb, fastboot)
- `licenses/` (una licencia básica)

**Falta:**
- `platforms/android-33/` (Android SDK Platform 33)
- `build-tools/34.0.0/` (Build Tools)
- `cmdline-tools/` (sdkmanager)

---

## ✅ SOLUCIÓN 1: Instalar Android Studio (Recomendado)

### Opción A: Snap (Más fácil)

```bash
# Instalar Android Studio
sudo snap install android-studio --classic

# Abrir Android Studio
android-studio
```

**En Android Studio:**
1. Welcome screen → **More Actions** → **SDK Manager**
2. En **SDK Platforms** tab:
   - ☑️ Marcar **Android 13.0 (Tiramisu)** - API Level 33
   - Click **Apply**
3. En **SDK Tools** tab:
   - ☑️ Marcar **Android SDK Build-Tools 34**
   - ☑️ Marcar **Android SDK Platform-Tools**
   - ☑️ Marcar **Android SDK Command-line Tools**
   - Click **Apply**
4. Aceptar licencias cuando pregunte
5. Esperar a que descargue e instale (~2 GB)

**Ubicación del SDK:**
- Snap: `~/Android/Sdk/`
- Manual: `/opt/android-studio/`

### Opción B: Descarga manual

```bash
# Descargar Android Studio
wget https://redirector.gvt1.com/edgedl/android/studio/ide-zips/2023.3.1.18/android-studio-2023.3.1.18-linux.tar.gz

# Extraer
tar -xvzf android-studio-*.tar.gz -C /opt/

# Ejecutar
/opt/android-studio/bin/studio.sh
```

### Actualizar local.properties

Después de instalar, actualiza la ubicación del SDK:

```bash
# Editar
nano android/local.properties

# Cambiar a (si usaste snap):
sdk.dir=/home/josu/Android/Sdk

# O (si instalaste manual):
sdk.dir=/opt/android-studio/sdk
```

---

## ✅ SOLUCIÓN 2: Instalar Solo SDK Command-line Tools

Si no quieres Android Studio completo:

### Paso 1: Descargar Command-line Tools

```bash
# Crear directorio
sudo mkdir -p /usr/lib/android-sdk/cmdline-tools

# Descargar (verifica última versión en: https://developer.android.com/studio)
cd /tmp
wget https://dl.google.com/android/repository/commandlinetools-linux-9477386_latest.zip

# Extraer
unzip commandlinetools-linux-*.zip

# Mover a ubicación correcta
sudo mv cmdline-tools /usr/lib/android-sdk/cmdline-tools/latest

# Permisos
sudo chmod -R 755 /usr/lib/android-sdk/cmdline-tools
```

### Paso 2: Aceptar licencias

```bash
yes | sudo /usr/lib/android-sdk/cmdline-tools/latest/bin/sdkmanager --licenses
```

### Paso 3: Instalar plataformas necesarias

```bash
# Instalar Android SDK Platform 33
sudo /usr/lib/android-sdk/cmdline-tools/latest/bin/sdkmanager "platforms;android-33"

# Instalar Build Tools 34
sudo /usr/lib/android-sdk/cmdline-tools/latest/bin/sdkmanager "build-tools;34.0.0"

# Verificar instalación
sudo /usr/lib/android-sdk/cmdline-tools/latest/bin/sdkmanager --list_installed
```

---

## ✅ SOLUCIÓN 3: Usar API Level más bajo (Quick Fix)

Si quieres compilar rápido sin instalar nada, usa una API más antigua que ya esté en el sistema:

### Ver qué plataformas tienes

```bash
ls -la /usr/lib/android-sdk/platforms/
ls -la /usr/lib/android-sdk/build-tools/
```

Si aparece alguna, por ejemplo `android-30` y `build-tools/30.0.3`:

### Modificar variables.gradle

```bash
nano android/variables.gradle
```

Cambiar a:
```groovy
ext {
    minSdkVersion = 22
    compileSdkVersion = 30      // ← Lo que tengas disponible
    targetSdkVersion = 30        // ← Lo que tengas disponible
}
```

### Modificar build.gradle del proyecto

```bash
nano android/build.gradle
```

Cambiar:
```groovy
buildscript {
    dependencies {
        classpath 'com.android.tools.build:gradle:7.4.2'  // ← Versión compatible
    }
}
```

---

## 🎯 MI RECOMENDACIÓN

**Para ti, lo mejor es SOLUCIÓN 1 (Snap):**

```bash
# 1. Instalar Android Studio
sudo snap install android-studio --classic

# 2. Abrir Android Studio
android-studio

# 3. En el wizard:
#    - SDK Manager
#    - Install API 33
#    - Install Build Tools 34
#    - Accept licenses

# 4. Actualizar local.properties
echo "sdk.dir=/home/josu/Android/Sdk" > android/local.properties

# 5. Compilar
cd android && ./gradlew assembleDebug
```

**Ventajas:**
- ✅ Instala todo automáticamente
- ✅ UI gráfica fácil
- ✅ Incluye emulador para probar
- ✅ Actualizaciones automáticas

**Tiempo:** ~20 minutos (15 min descarga + 5 min setup)

---

## 🐛 Troubleshooting

### Error: "SDK not found"

```bash
# Verificar ubicación
ls -la ~/Android/Sdk/

# Actualizar local.properties
echo "sdk.dir=$HOME/Android/Sdk" > android/local.properties
```

### Error: "JAVA_HOME not set"

```bash
# Ver versión de Java
java -version

# Si es diferente a lo que espera Gradle
export JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64
```

### Error: "Out of space"

Android SDK + Build Tools ocupan ~2-3 GB. Verifica espacio:

```bash
df -h
```

---

## ✅ Verificar Instalación

Después de instalar, verifica:

```bash
# 1. Licencias
ls -la /home/josu/Android/Sdk/licenses/

# 2. Platform 33
ls -la /home/josu/Android/Sdk/platforms/android-33/

# 3. Build Tools 34
ls -la /home/josu/Android/Sdk/build-tools/34.0.0/

# 4. Compilar
cd android && ./gradlew assembleDebug
```

Si todo está OK, verás:
```
BUILD SUCCESSFUL in Xs
```

Y el APK en:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 📞 ¿Necesitas Ayuda?

Si sigues teniendo problemas después de instalar Android Studio, avísame y te ayudo con el siguiente paso.
