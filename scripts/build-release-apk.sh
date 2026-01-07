#!/bin/bash

# Script para construir y firmar APK de release para Play Store
# Uso: ./scripts/build-release-apk.sh [version]

set -e  # Exit on error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuración
VERSION=${1:-"2.9.286"}
BUILD_TOOLS="$HOME/Android/Sdk/build-tools/36.0.0"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Rutas
APK_UNSIGNED="$PROJECT_ROOT/android/app/build/outputs/apk/release/app-release-unsigned.apk"
APK_ALIGNED="/tmp/coleccion-nuevo-ser-v${VERSION}-aligned.apk"
APK_SIGNED="$PROJECT_ROOT/www/downloads/coleccion-nuevo-ser-v${VERSION}.apk"
DEBUG_KEYSTORE="$PROJECT_ROOT/android/app/debug.keystore"
RELEASE_KEYSTORE="$PROJECT_ROOT/release.keystore"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Build Release APK v${VERSION}${NC}"
echo -e "${GREEN}========================================${NC}"
echo

# Verificar que estamos en el directorio correcto
if [ ! -f "$PROJECT_ROOT/package.json" ]; then
    echo -e "${RED}Error: No se encuentra package.json. Asegúrate de ejecutar desde la raíz del proyecto.${NC}"
    exit 1
fi

# Paso 1: Sync Capacitor
echo -e "${YELLOW}[1/6] Sincronizando Capacitor...${NC}"
cd "$PROJECT_ROOT"
npx cap sync android
echo -e "${GREEN}✓ Capacitor sincronizado${NC}"
echo

# Paso 2: Build release APK
echo -e "${YELLOW}[2/6] Compilando APK de release...${NC}"
cd "$PROJECT_ROOT/android"
./gradlew clean assembleRelease
echo -e "${GREEN}✓ APK compilado${NC}"
echo

# Verificar que el APK se generó
if [ ! -f "$APK_UNSIGNED" ]; then
    echo -e "${RED}Error: No se encontró el APK unsigned en $APK_UNSIGNED${NC}"
    exit 1
fi

APK_SIZE=$(du -h "$APK_UNSIGNED" | cut -f1)
echo -e "  Tamaño: ${APK_SIZE}"
echo

# Paso 3: Zipalign
echo -e "${YELLOW}[3/6] Alineando APK...${NC}"
if [ ! -f "$BUILD_TOOLS/zipalign" ]; then
    echo -e "${RED}Error: No se encontró zipalign en $BUILD_TOOLS${NC}"
    echo -e "${YELLOW}Tip: Verifica la versión de build-tools instalada${NC}"
    exit 1
fi

"$BUILD_TOOLS/zipalign" -f 4 "$APK_UNSIGNED" "$APK_ALIGNED"
echo -e "${GREEN}✓ APK alineado${NC}"
echo

# Paso 4: Firmar APK
echo -e "${YELLOW}[4/6] Firmando APK...${NC}"

# Determinar qué keystore usar
KEYSTORE=""
KEYSTORE_TYPE=""

if [ -f "$RELEASE_KEYSTORE" ]; then
    echo -e "${GREEN}Se encontró keystore de producción${NC}"
    KEYSTORE="$RELEASE_KEYSTORE"
    KEYSTORE_TYPE="release"

    echo -ne "Ingresa la contraseña del keystore: "
    read -s KEYSTORE_PASS
    echo

    echo -ne "Ingresa la contraseña de la key: "
    read -s KEY_PASS
    echo

    "$BUILD_TOOLS/apksigner" sign \
        --ks "$KEYSTORE" \
        --ks-pass "pass:$KEYSTORE_PASS" \
        --key-pass "pass:$KEY_PASS" \
        --out "$APK_SIGNED" \
        "$APK_ALIGNED"
else
    echo -e "${YELLOW}⚠ No se encontró keystore de producción${NC}"
    echo -e "${YELLOW}  Usando debug keystore (solo para testing)${NC}"
    KEYSTORE="$DEBUG_KEYSTORE"
    KEYSTORE_TYPE="debug"

    if [ ! -f "$DEBUG_KEYSTORE" ]; then
        echo -e "${RED}Error: No se encontró debug keystore en $DEBUG_KEYSTORE${NC}"
        exit 1
    fi

    "$BUILD_TOOLS/apksigner" sign \
        --ks "$DEBUG_KEYSTORE" \
        --ks-pass pass:android \
        --key-pass pass:android \
        --out "$APK_SIGNED" \
        "$APK_ALIGNED"
fi

echo -e "${GREEN}✓ APK firmado con keystore $KEYSTORE_TYPE${NC}"
echo

# Paso 5: Verificar firma
echo -e "${YELLOW}[5/6] Verificando firma del APK...${NC}"
"$BUILD_TOOLS/apksigner" verify "$APK_SIGNED"
echo -e "${GREEN}✓ Firma verificada correctamente${NC}"
echo

# Paso 6: Información final
echo -e "${YELLOW}[6/6] Información del APK generado${NC}"
APK_SIGNED_SIZE=$(du -h "$APK_SIGNED" | cut -f1)
echo -e "  Ubicación: ${APK_SIGNED}"
echo -e "  Tamaño: ${APK_SIGNED_SIZE}"
echo -e "  Versión: v${VERSION}"
echo -e "  Keystore: $KEYSTORE_TYPE"
echo

# Limpiar archivo temporal
rm -f "$APK_ALIGNED"

# Resumen final
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  ✓ APK de release generado exitosamente${NC}"
echo -e "${GREEN}========================================${NC}"
echo

# Advertencias finales
if [ "$KEYSTORE_TYPE" == "debug" ]; then
    echo -e "${RED}⚠ ADVERTENCIA: Este APK está firmado con debug keystore${NC}"
    echo -e "${RED}  NO subir a Play Store. Solo para testing local.${NC}"
    echo
    echo -e "${YELLOW}Para generar un APK de producción:${NC}"
    echo -e "  1. Crea un keystore de release con:"
    echo -e "     keytool -genkey -v -keystore release.keystore -alias coleccion-nuevo-ser -keyalg RSA -keysize 2048 -validity 10000"
    echo -e "  2. Guarda el keystore en: $RELEASE_KEYSTORE"
    echo -e "  3. Vuelve a ejecutar este script"
    echo
else
    echo -e "${GREEN}Siguiente paso:${NC}"
    echo -e "  1. Subir a gailu.net/downloads/coleccion-nuevo-ser-v${VERSION}.apk"
    echo -e "  2. Subir a Play Store Console"
    echo
fi

echo -e "${YELLOW}Consejo:${NC} Revisa DEPLOY-PLAY-STORE.md para más detalles"
