# 🔧 GUÍA DE DEBUGGING - APK AWAKENING PROTOCOL
**Fecha:** 2025-12-14
**Versión APK:** 1.0.0
**Estado:** Debugging en progreso

---

## 📱 PROBLEMA: APK no inicia en dispositivo Android

El APK está instalado pero la aplicación no arranca cuando intentas abrirla.

---

## 🔍 MÉTODOS DE DEBUGGING

### MÉTODO 1: Obtener Logs del Dispositivo (RECOMENDADO)

#### Requisitos:
- Dispositivo Android o emulador conectado vía USB
- USB Debugging habilitado en el dispositivo
- ADB (Android Debug Bridge) instalado

#### Pasos:

**1. Habilitar USB Debugging en el dispositivo:**
```
Configuración → Opciones de Desarrollador → USB Debugging (activar)
```

Si no ves "Opciones de Desarrollador":
```
Configuración → Acerca del teléfono → Número de compilación
(Toca 7 veces) → Aparecerá "Opciones de Desarrollador"
```

**2. Conectar dispositivo por USB y verificar:**
```bash
adb devices
```

**Salida esperada:**
```
List of devices attached
XXXXXXXXXXXX           device
```

Si muestra `unauthorized`, acepta la confirmación de debugging en el dispositivo.

**3. Obtener logs en tiempo real:**
```bash
# Limpiar logs previos
adb logcat -c

# Ver logs (CTRL+C para salir)
adb logcat

# O filtrar solo errores de nuestra app
adb logcat | grep -E "AwakeningProtocol|E/.*|FATAL"
```

**4. Iniciar la app y capturar logs:**
```bash
# Terminal 1: Ver logs
adb logcat | tee awakening-logs.txt

# Terminal 2: Iniciar app
adb shell am start -n com.awakeningprotocol/.MainActivity
```

**5. Buscar errores en los logs:**
```
ERRORES COMUNES:

E/Zygote: isLoadedAndroid Studio
E/LoadedApk: Unable to instantiate application
E/AndroidRuntime: FATAL EXCEPTION
E/ReactNativeJS: Error: Cannot find module
E/RNGestureHandler: Error initializing
E/Firebase: Configuration failed
```

---

### MÉTODO 2: Usar adb logcat con filtro

```bash
# Solo errores y warnings
adb logcat *:E *:W | head -100

# Específicamente para crashes
adb logcat AndroidRuntime:E

# Para nuestra app específicamente
adb logcat | grep com.awakeningprotocol
```

---

### MÉTODO 3: Desinstalar y reinstalar con logs

```bash
# Desinstalar app
adb uninstall com.awakeningprotocol

# Instalar APK con logging
adb install -r www/downloads/awakening-protocol-latest.apk

# Ver logs de instalación
adb logcat Installer:I
```

---

### MÉTODO 4: Usar emulador Android

Si no tienes dispositivo físico:

```bash
# Verificar emuladores disponibles
emulator -list-avds

# Iniciar emulador (reemplaza con tu nombre)
emulator -avd Pixel_4_API_30

# Luego conectar y obtener logs
adb devices
adb logcat
```

---

## 🐛 PROBLEMAS CONOCIDOS Y SOLUCIONES

### Problema 1: "Package not found" o "Application not installed"

**Síntoma:**
```
adb: error: install failed: User denied permissions
```

**Soluciones:**
1. Desinstalar versión anterior: `adb uninstall com.awakeningprotocol`
2. Verificar APK: `adb install -r www/downloads/awakening-protocol-latest.apk`
3. Ver logs: `adb logcat | grep Install`

---

### Problema 2: "Google Maps API Key not configured"

**Síntoma en logs:**
```
E/Google Maps Android API: Google Maps Android API key is missing
```

**Solución:**
Editar `mobile-game/mobile-app/app.json`:

```json
"android": {
  "config": {
    "googleMaps": {
      "apiKey": "YOUR_ACTUAL_API_KEY_HERE"  // ← Agregar clave real
    }
  }
}
```

**Para obtener Google Maps API Key:**
1. Ir a https://console.cloud.google.com/
2. Crear proyecto nuevo o usar existente
3. Habilitar "Maps SDK for Android"
4. Ir a Credenciales → Crear credencial → Clave de API
5. Copiar la clave API
6. En Android, necesitas SHA1 del keystore:
   ```bash
   keytool -list -v -keystore ~/.android/debug.keystore
   ```
7. Agregar SHA1 a la restricción de la clave en Google Cloud

**Nota:** Para desarrollo rápido, puedes comentar el uso de Maps en MapScreen.js (Ver Problema 3)

---

### Problema 3: React Native Gesture Handler error

**Síntoma en logs:**
```
E/RNGestureHandler: Failed to find gesture handler provider
```

**Solución:**
El `GestureHandlerRootView` en `index.js` debería estar envolviendo todo.
Verificar que el index.js sea:

```javascript
function AppEntry() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <RootNavigator />
    </GestureHandlerRootView>
  );
}
```

---

### Problema 4: "Cannot find module" error

**Síntoma en logs:**
```
E/ReactNativeJS: Error: Cannot find module 'XX' from 'YY'
```

**Soluciones:**
1. Verificar que todas las pantallas existan:
   ```bash
   ls -la mobile-game/mobile-app/src/screens/
   # Debe mostrar: MapScreen.js, BeingsScreen.js, etc.
   ```

2. Limpiar caché y reconstruir:
   ```bash
   cd mobile-game/mobile-app
   rm -rf node_modules
   npm install

   # Limpiar bundle
   rm -rf android/app/build

   # Reconstruir
   cd android
   ./gradlew clean
   ./gradlew assembleDebug
   ```

---

### Problema 5: "Firebase initialization failed"

**Síntoma en logs:**
```
E/Firebase: Firebase initialization failed
E/Google-Services: GoogleService JSON is invalid
```

**Soluciones:**
1. Verificar que Google Services está habilitado en build.gradle:
   ```gradle
   plugins {
     id 'com.google.gms.google-services'  // ← Debe estar
   }
   ```

2. Verificar google-services.json en `android/app/`:
   ```bash
   ls android/app/google-services.json
   ```

3. Si no existe, descargar de Firebase Console:
   - https://console.firebase.google.com/
   - Proyecto "awakening-protocol"
   - Agregar app Android
   - Descargar google-services.json
   - Copiar a `android/app/google-services.json`

---

## 🛠️ VERSIÓN DE DEBUGGING SIMPLIFICADA

Si los problemas persisten, voy a crear una versión simplificada sin Google Maps ni Firebase:

### Crear versión simple:

**1. Comentar Google Maps en MapScreen.js:**
```javascript
// import MapView from 'react-native-maps';  // ← Comentar
// Reemplazar con pantalla simple:
const MapScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>🗺️ Mapa (Simplified Version)</Text>
  </View>
);
```

**2. Desactivar Firebase en app.json:**
```json
"plugins": [
  // Comentar o eliminar Firebase config
]
```

**3. Recompilar APK simple:**
```bash
cd mobile-game/mobile-app/android
./gradlew assembleDebug
# APK estará en: android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 📋 CHECKLIST DE DEBUGGING

Marcar cada paso completado:

- [ ] Conectar dispositivo Android con USB Debugging
- [ ] Ejecutar: `adb devices` (ver dispositivo listado)
- [ ] Ejecutar: `adb logcat -c` (limpiar logs)
- [ ] Desinstalar app: `adb uninstall com.awakeningprotocol`
- [ ] Instalar APK: `adb install -r www/downloads/awakening-protocol-latest.apk`
- [ ] Iniciar app desde dispositivo
- [ ] Capturar logs: `adb logcat > logs.txt` (CTRL+C después de 30s)
- [ ] Buscar "FATAL EXCEPTION" en logs.txt
- [ ] Buscar "Error" en logs.txt
- [ ] Identificar línea de error
- [ ] Implementar solución según problema encontrado
- [ ] Recompilar si es necesario
- [ ] Reintentar

---

## 📊 INFORMACIÓN A COMPARTIR

Una vez obtengas los logs, comparte:

```
1. Output de "adb logcat" de los primeros 50 segundos después de tocar el ícono
2. Error específico que ves (FATAL EXCEPTION, Error, etc.)
3. Línea de código donde ocurre el error
4. Dispositivo Android (versión Android, marca, modelo)
```

**Ejemplo de log útil:**
```
E/AndroidRuntime: FATAL EXCEPTION: main
E/AndroidRuntime: Process: com.awakeningprotocol, PID: 12345
E/AndroidRuntime: java.lang.RuntimeException: Unable to instantiate application
E/AndroidRuntime:   Caused by: com.google.android.gms.common.GooglePlayServicesNotAvailableException
E/AndroidRuntime:     at com.google.android.gms.internal.firebase:...
```

---

## 🔄 PRÓXIMOS PASOS

### Si obtengo acceso a logs:

1. **Analizar error específico**
2. **Crear fix** (puede ser en código o configuración)
3. **Recompilar APK** con el fix
4. **Testear en dispositivo**
5. **Validar que funciona**

### Versiones alternativas que puedo compilar:

- ✅ Versión simplificada (sin Maps, sin Firebase)
- ✅ Versión con debugging mejorado (logs más verbosos)
- ✅ Versión debug (sin ofuscación, más fácil debuggear)
- ✅ Versión release optimizada

---

## 💡 ALTERNATIVAS RÁPIDAS

Si quieres probar ahora mismo sin emulator:

### 1. Crear APK Debug más simple:
```bash
cd mobile-game/mobile-app/android
./gradlew assembleDebug
```

### 2. Instalar emulador Android rápido:
```bash
# Verificar si Android Studio está instalado
which emulator

# Si no, usar Android Studio o:
sdkmanager "emulator"
sdkmanager "system-images;android-30;google_apis;arm64-v8a"
avdmanager create avd -n Pixel_4 -k "system-images;android-30;google_apis;arm64-v8a"
```

---

## 🆘 CONTACTO Y SEGUIMIENTO

Cuando obtengas los logs:
1. Compartir en formato legible
2. Indicar exactamente qué error ves
3. Decir qué versión de Android tienes
4. Yo compilaré fix y lo probaremos juntos

---

*Guía de debugging - Awakening Protocol*
*Actualizado: 2025-12-14*
*¿Problemas? Ejecuta los métodos de debugging y comparteix los logs.*

