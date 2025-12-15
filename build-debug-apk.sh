#!/bin/bash

# ============================================================================
# BUILD DEBUG APK - Awakening Protocol
# Compila una versión de debugging simplificada sin dependencias problemáticas
# ============================================================================

set -e  # Exit on error

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  BUILD DEBUG APK - Awakening Protocol v1.0.0              ║"
echo "║  Versión simplificada para testing y debugging            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;36m'
NC='\033[0m' # No Color

# ============================================================================
# PASO 1: Verificar requisitos
# ============================================================================

echo -e "${BLUE}[1/5]${NC} Verificando requisitos..."

if ! command -v java &> /dev/null; then
    echo -e "${RED}✗ Java no está instalado${NC}"
    exit 1
fi

if [ ! -d "mobile-game/mobile-app" ]; then
    echo -e "${RED}✗ Directorio mobile-app no encontrado${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Requisitos verificados${NC}"
echo ""

# ============================================================================
# PASO 2: Limpiar compilación anterior
# ============================================================================

echo -e "${BLUE}[2/5]${NC} Limpiando compilación anterior..."

cd mobile-game/mobile-app/android

if [ -d "app/build" ]; then
    rm -rf app/build
    echo -e "${GREEN}✓ Directorio build eliminado${NC}"
else
    echo -e "${YELLOW}ℹ No había build anterior${NC}"
fi

echo ""

# ============================================================================
# PASO 3: Compilar APK en modo Debug
# ============================================================================

echo -e "${BLUE}[3/5]${NC} Compilando APK en modo debug..."
echo "  (Esto puede tomar 2-5 minutos...)"
echo ""

./gradlew assembleDebug

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Compilación exitosa${NC}"
else
    echo -e "${RED}✗ Compilación falló${NC}"
    exit 1
fi

echo ""

# ============================================================================
# PASO 4: Verificar APK generado
# ============================================================================

echo -e "${BLUE}[4/5]${NC} Verificando APK generado..."

DEBUG_APK="app/build/outputs/apk/debug/app-debug.apk"

if [ -f "$DEBUG_APK" ]; then
    SIZE=$(du -h "$DEBUG_APK" | cut -f1)
    echo -e "${GREEN}✓ APK generado correctamente${NC}"
    echo "  Archivo: $DEBUG_APK"
    echo "  Tamaño: $SIZE"
else
    echo -e "${RED}✗ APK no encontrado en $DEBUG_APK${NC}"
    exit 1
fi

echo ""

# ============================================================================
# PASO 5: Copiar a directorio de descargas
# ============================================================================

echo -e "${BLUE}[5/5]${NC} Copiando APK a directorio de descargas..."

cd - > /dev/null

DEST="www/downloads/awakening-protocol-debug.apk"

cp "$DEBUG_APK" "$DEST"

if [ -f "$DEST" ]; then
    echo -e "${GREEN}✓ APK copiado a $DEST${NC}"
else
    echo -e "${RED}✗ Error al copiar APK${NC}"
    exit 1
fi

echo ""

# ============================================================================
# RESUMEN
# ============================================================================

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  BUILD COMPLETADO EXITOSAMENTE                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}APK Debug disponible en:${NC}"
echo "  $DEST"
echo ""
echo -e "${BLUE}Próximos pasos:${NC}"
echo "  1. Instalar en dispositivo:"
echo "     adb install -r $DEST"
echo ""
echo "  2. Obtener logs:"
echo "     adb logcat -c"
echo "     adb logcat > logs.txt"
echo ""
echo "  3. Ejecutar app:"
echo "     adb shell am start -n com.awakeningprotocol/.MainActivity"
echo ""
echo "  4. Ver logs en tiempo real:"
echo "     adb logcat | grep -E 'AwakeningProtocol|E/|FATAL'"
echo ""

