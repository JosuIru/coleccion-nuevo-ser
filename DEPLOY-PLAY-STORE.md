# Guía de Despliegue para Play Store

Esta guía describe los pasos necesarios para desplegar la aplicación en Google Play Store.

## 1. Preparación del Backend (IMPORTANTE)

### Subir archivo PHP al servidor

El archivo `api/check-version.php` debe estar accesible en:
```
https://gailu.net/api/check-version.php
```

**Pasos:**
1. Conectar por FTP/SFTP a gailu.net
2. Crear carpeta `/api/` si no existe
3. Subir el archivo `api/check-version.php`
4. Asegurar permisos de lectura (chmod 644)
5. Verificar que el servidor tenga PHP habilitado

### Verificar el endpoint

Probar manualmente con curl:
```bash
curl -X POST https://gailu.net/api/check-version.php \
  -H "Content-Type: application/json" \
  -d '{"currentVersion":"2.9.0","platform":"android"}'
```

Debería responder:
```json
{
  "status": "success",
  "currentVersion": "2.9.0",
  "latestVersion": "2.9.286",
  "updateAvailable": true,
  ...
}
```

## 2. Actualizar Versión de la App

Antes de construir el APK de producción:

### Android (build.gradle)

Editar `android/app/build.gradle`:
```gradle
versionCode 286      // Incrementar cada release
versionName "2.9.286"
```

### Manifest (opcional)

El versionCode debe ser único y mayor que cualquier versión anterior en Play Store.

## 3. Construcción del APK Release

### Build Release APK

```bash
cd android
./gradlew assembleRelease
```

El APK se genera en:
```
android/app/build/outputs/apk/release/app-release-unsigned.apk
```

### Firmar el APK

**Para desarrollo (debug keystore):**
```bash
APK_UNSIGNED="android/app/build/outputs/apk/release/app-release-unsigned.apk"
APK_ALIGNED="/tmp/coleccion-nuevo-ser-v2.9.286-aligned.apk"
APK_SIGNED="www/downloads/coleccion-nuevo-ser-v2.9.286.apk"
DEBUG_KEYSTORE="android/app/debug.keystore"

# Align
/home/josu/Android/Sdk/build-tools/36.0.0/zipalign -f 4 "$APK_UNSIGNED" "$APK_ALIGNED"

# Sign
/home/josu/Android/Sdk/build-tools/36.0.0/apksigner sign \
  --ks "$DEBUG_KEYSTORE" \
  --ks-pass pass:android \
  --key-pass pass:android \
  --out "$APK_SIGNED" \
  "$APK_ALIGNED"

# Verify
/home/josu/Android/Sdk/build-tools/36.0.0/apksigner verify "$APK_SIGNED"
```

**Para Play Store (production keystore):**

Necesitarás crear un keystore de producción:
```bash
keytool -genkey -v -keystore release.keystore \
  -alias coleccion-nuevo-ser \
  -keyalg RSA -keysize 2048 -validity 10000
```

⚠️ **IMPORTANTE**: Guarda el keystore y contraseñas en un lugar seguro. Si lo pierdes, no podrás actualizar la app en Play Store.

## 4. Subir APK al Servidor

Copiar el APK firmado a gailu.net:
```
www/downloads/coleccion-nuevo-ser-v2.9.286.apk
```

Debe estar accesible en:
```
https://gailu.net/downloads/coleccion-nuevo-ser-v2.9.286.apk
```

## 5. Play Store Console

### Primera vez (nuevo listing)

1. Ir a [Google Play Console](https://play.google.com/console)
2. Crear nueva aplicación
3. Completar ficha de la tienda:
   - Título: "Colección Nuevo Ser"
   - Descripción corta
   - Descripción completa
   - Capturas de pantalla (mínimo 2)
   - Icono de la aplicación (512x512)
   - Gráfico de funciones (1024x500)
4. Subir APK a "Producción" o "Prueba interna/cerrada/abierta"
5. Completar cuestionario de contenido
6. Configurar precio (gratis/pago)
7. Seleccionar países de distribución

### Actualizaciones

1. Ir a la app en Play Console
2. Release → Producción → Crear nueva versión
3. Subir nuevo APK (versionCode debe ser mayor)
4. Escribir notas de la versión (changelog)
5. Revisar y publicar

## 6. Testing Previo

### Test local del sistema de actualizaciones

1. Modificar temporalmente la versión actual a 2.9.0 en `www/index.html`:
```html
<script>window.__APP_VERSION__ = '2.9.0';</script>
```

2. Compilar y probar que detecta actualización:
```bash
npx cap sync android
cd android && ./gradlew assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

3. Verificar en logcat:
```bash
adb logcat | grep VersionManager
```

Debería ver:
```
[VersionManager] Actualización disponible: 2.9.286
```

### Test en dispositivos reales

- Probar en Android 8.0+ (API 26+)
- Probar en tablets y phones
- Verificar rotación de pantalla
- Probar con diferentes temas (claro/oscuro)

## 7. Monitoreo Post-Lanzamiento

### Logs de actualización

Revisar Google Play Console:
- Informes de errores (crashes)
- ANR (Application Not Responding)
- Calificaciones y reseñas
- Estadísticas de instalación

### Actualizar check-version.php

Cada vez que lances una nueva versión:

1. Editar `api/check-version.php`
2. Cambiar `'latest' => 'X.X.X'`
3. Añadir nueva entrada en `'versions'`
4. Añadir URL de descarga en `'downloads'`
5. Subir al servidor
6. Verificar endpoint con curl

## Checklist Pre-Release

- [ ] Backend PHP subido y funcionando en gailu.net
- [ ] Endpoint verificado con curl
- [ ] versionCode incrementado en build.gradle
- [ ] APK release compilado y firmado
- [ ] APK subido a gailu.net/downloads
- [ ] Probado sistema de detección de actualizaciones
- [ ] Capturas de pantalla actualizadas
- [ ] Changelog escrito
- [ ] Keystore de producción guardado de forma segura

## Troubleshooting

### Error: "API returned 404"

- Verificar que check-version.php esté en gailu.net/api/
- Verificar permisos del archivo
- Verificar que el servidor soporte PHP

### Error: "CORS policy"

Añadir headers en check-version.php (ya incluidos):
```php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
```

### APK rechazado por Play Store

- Verificar que versionCode sea mayor que el anterior
- Verificar que esté firmado con el mismo keystore
- Verificar targetSdkVersion (debe ser 33+ para nuevas apps)

## Contacto

Para problemas técnicos con el despliegue, revisar:
- [Documentación de Capacitor](https://capacitorjs.com/docs/android)
- [Play Console Help](https://support.google.com/googleplay/android-developer)
