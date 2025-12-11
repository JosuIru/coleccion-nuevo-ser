# 📦 Proceso de Build - Colección Nuevo Ser

## ⚠️ IMPORTANTE: Evitar APKs Anidadas

**PROBLEMA:** Capacitor copia TODO el contenido de `www/` a los assets de Android, incluyendo archivos en `www/downloads/`. Si dejas APKs ahí, la nueva APK las incluirá dentro, creciendo exponencialmente:

- Build 1: 10 MB ✅
- Build 2: 20 MB (incluye Build 1 dentro) ⚠️
- Build 3: 40 MB (incluye Build 1 + Build 2 dentro) ❌
- Build 4: 80 MB (incluye Build 1 + Build 2 + Build 3 dentro) 💥

## ✅ Solución: Proceso de Build Correcto

### Paso 1: Limpiar `www/downloads/` ANTES de compilar

```bash
# SIEMPRE ejecutar esto ANTES de npx cap sync
rm -f www/downloads/*.apk
```

### Paso 2: Sync y Build

```bash
npx cap sync android
cd android
./gradlew clean assembleDebug  # o assembleRelease
```

### Paso 3: Guardar APK en `releases/` (NO en `www/downloads/`)

```bash
# Copiar APK final a releases/
cp android/app/build/outputs/apk/debug/app-debug.apk \
   releases/coleccion-nuevo-ser-v{VERSION}-build{BUILD}.apk
```

### Paso 4: Actualizar `catalog.json`

```json
{
  "downloads": {
    "android": {
      "latest": "coleccion-nuevo-ser-v{VERSION}-build{BUILD}.apk",
      "versions": [
        {
          "version": "{VERSION}",
          "file": "coleccion-nuevo-ser-v{VERSION}-build{BUILD}.apk",
          "size": "{SIZE} MB",
          "changelog": "..."
        }
      ]
    }
  }
}
```

### Paso 5: Si necesitas que la APK esté disponible para descarga desde la app

**Opción A - Hosting externo (RECOMENDADO):**
- Subir APK a GitHub Releases, Google Drive, o servidor propio
- Actualizar `catalog.json` con URL completa:

```json
"downloads": {
  "android": {
    "downloadUrl": "https://github.com/nuevosser/coleccion/releases/download/v{VERSION}/app.apk"
  }
}
```

**Opción B - Incluir en APK (NO RECOMENDADO):**
- Si DEBES incluir la APK dentro de la APK:
  1. Copia SOLO la última APK a `www/downloads/` después del build
  2. Asegúrate de borrarla antes del próximo build

## 🚀 Script Automatizado

Puedes usar este script para automatizar el proceso:

```bash
#!/bin/bash
# build-apk.sh

VERSION=$1
BUILD=$2

if [ -z "$VERSION" ] || [ -z "$BUILD" ]; then
  echo "Uso: ./build-apk.sh VERSION BUILD"
  echo "Ejemplo: ./build-apk.sh 2.8.6.3 58"
  exit 1
fi

echo "🧹 Limpiando APKs antiguas..."
rm -f www/downloads/*.apk

echo "📦 Sincronizando con Android..."
npx cap sync android

echo "🔨 Compilando APK..."
cd android
./gradlew clean assembleDebug
cd ..

echo "💾 Guardando en releases/..."
mkdir -p releases
cp android/app/build/outputs/apk/debug/app-debug.apk \
   "releases/coleccion-nuevo-ser-v$VERSION-build$BUILD-SIGNED.apk"

echo "✅ APK compilada: releases/coleccion-nuevo-ser-v$VERSION-build$BUILD-SIGNED.apk"
ls -lh "releases/coleccion-nuevo-ser-v$VERSION-build$BUILD-SIGNED.apk"

echo ""
echo "⚠️ NO OLVIDES:"
echo "  1. Actualizar catalog.json con la nueva versión"
echo "  2. Subir APK a hosting externo si es necesario"
echo "  3. NO copiar la APK a www/downloads/"
```

## 📝 Checklist de Build

- [ ] Eliminadas APKs de `www/downloads/`
- [ ] Ejecutado `npx cap sync android`
- [ ] Compilado con `./gradlew clean assembleDebug`
- [ ] APK guardada en `releases/` (NO en `www/downloads/`)
- [ ] Actualizado `catalog.json` con versión, tamaño, changelog
- [ ] Actualizado `versionCode` y `versionName` en `build.gradle`
- [ ] Verificado que APK no contiene APKs anteriores (tamaño ~10MB)

## 🔍 Verificación de Tamaño

Tamaños esperados:
- Debug APK: ~10-12 MB
- Release APK (sin símbolos): ~8-10 MB

Si tu APK pesa > 15 MB, probablemente contiene APKs anteriores dentro. Verifica:

```bash
# Ver contenido de assets en la APK
unzip -l android/app/build/outputs/apk/debug/app-debug.apk | grep "assets/public/downloads"

# Si aparecen archivos .apk, ¡HAY PROBLEMA!
```

## 🛠️ Estructura de Carpetas

```
/
├── www/                      # Código web (se copia a Android assets)
│   └── downloads/           # ⚠️ NUNCA guardar APKs aquí
│       └── *.html           # Solo archivos pequeños
├── releases/                # ✅ APKs finales aquí
│   ├── v2.8.6.1-build56.apk
│   ├── v2.8.6.2-build57.apk
│   └── v2.8.6.3-build58.apk
└── android/
    └── app/build/outputs/apk/
        └── debug/
            └── app-debug.apk  # APK temporal (copiar a releases/)
```

## 🚨 Si Ya Compilaste con APKs Anidadas

1. Elimina APKs de `www/downloads/`
2. Ejecuta `npx cap sync android` para limpiar assets
3. Recompila desde cero con `./gradlew clean assembleDebug`
4. La nueva APK tendrá tamaño normal (~10MB)
