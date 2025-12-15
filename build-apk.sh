#!/bin/bash
# build-apk.sh - Script automatizado para compilar APK sin APKs anidadas

VERSION=$1
BUILD=$2

if [ -z "$VERSION" ] || [ -z "$BUILD" ]; then
  echo "❌ Error: Debes proporcionar VERSION y BUILD"
  echo "Uso: ./build-apk.sh VERSION BUILD"
  echo "Ejemplo: ./build-apk.sh 2.8.6.4 59"
  exit 1
fi

APK_NAME="coleccion-nuevo-ser-v$VERSION-build$BUILD-SIGNED.apk"

echo "🚀 Iniciando build de APK..."
echo "   Versión: $VERSION"
echo "   Build: $BUILD"
echo ""

# Paso 1: Limpiar APKs de www/downloads/
echo "🧹 [1/6] Limpiando APKs antiguas de www/downloads/..."
rm -f www/downloads/*.apk
echo "   ✅ Limpieza completada"
echo ""

# Paso 2: Sync con Capacitor
echo "📦 [2/6] Sincronizando con Android (Capacitor)..."
npx cap sync android
if [ $? -ne 0 ]; then
  echo "   ❌ Error en sync"
  exit 1
fi
echo "   ✅ Sync completado"
echo ""

# Paso 3: Compilar APK
echo "🔨 [3/6] Compilando APK (Debug)..."
cd android
./gradlew clean assembleDebug
if [ $? -ne 0 ]; then
  echo "   ❌ Error en compilación"
  exit 1
fi
cd ..
echo "   ✅ Compilación exitosa"
echo ""

# Paso 4: Crear carpeta releases
echo "📁 [4/6] Preparando carpeta releases/..."
mkdir -p releases
echo "   ✅ Carpeta lista"
echo ""

# Paso 5: Copiar APK a releases
echo "💾 [5/6] Guardando APK en releases/..."
cp android/app/build/outputs/apk/debug/app-debug.apk "releases/$APK_NAME"
if [ $? -ne 0 ]; then
  echo "   ❌ Error al copiar APK"
  exit 1
fi
cp "releases/$APK_NAME" "releases/coleccion-nuevo-ser-latest.apk"
echo "   ✅ APK guardada"
echo ""

# Paso 6: Mostrar info
echo "📊 [6/6] Información de la APK:"
ls -lh "releases/$APK_NAME"
SIZE=$(du -h "releases/$APK_NAME" | cut -f1)
echo ""
echo "✅ ¡Build completado exitosamente!"
echo ""
echo "📦 APK generada:"
echo "   Archivo: releases/$APK_NAME"
echo "   Tamaño: $SIZE"
echo ""
echo "⚠️  PRÓXIMOS PASOS:"
echo "   1. Actualizar android/app/build.gradle:"
echo "      - versionCode $BUILD"
echo "      - versionName \"$VERSION\""
echo "   2. Actualizar www/books/catalog.json:"
echo "      - version: \"$VERSION\""
echo "      - file: \"$APK_NAME\""
echo "      - size: \"$SIZE\""
echo "      - changelog: \"...\""
echo "   3. ⚠️  NO copiar la APK a www/downloads/"
echo ""
