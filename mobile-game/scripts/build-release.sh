#!/bin/bash

###############################################################################
# AWAKENING PROTOCOL - PRODUCTION BUILD SCRIPT
# Build completo de APK/AAB firmado con validaciones
###############################################################################

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

print_message() { echo -e "${BLUE}[BUILD]${NC} $1"; }
print_success() { echo -e "${GREEN}[✓]${NC} $1"; }
print_error() { echo -e "${RED}[✗]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[!]${NC} $1"; }
print_step() { echo -e "${CYAN}[→]${NC} $1"; }

# Banner
clear
echo ""
echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   AWAKENING PROTOCOL - PRODUCTION BUILD                  ║${NC}"
echo -e "${BLUE}║   Building signed APK/AAB for release                     ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Variables
BUILD_TYPE="release"
BUILD_FORMAT="apk" # apk o aab
CLEAN_BUILD=true
RUN_TESTS=true
RUN_LINT=true
OPTIMIZE_ASSETS=true

# Parsear argumentos
while [[ $# -gt 0 ]]; do
  case $1 in
    --no-clean)
      CLEAN_BUILD=false
      shift
      ;;
    --no-tests)
      RUN_TESTS=false
      shift
      ;;
    --no-lint)
      RUN_LINT=false
      shift
      ;;
    --aab)
      BUILD_FORMAT="aab"
      shift
      ;;
    --skip-assets)
      OPTIMIZE_ASSETS=false
      shift
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: $0 [--no-clean] [--no-tests] [--no-lint] [--aab] [--skip-assets]"
      exit 1
      ;;
  esac
done

# Directorio del proyecto
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")/mobile-app"
ANDROID_DIR="$PROJECT_DIR/android"

cd "$PROJECT_DIR"

###############################################################################
# VERIFICACIONES PREVIAS
###############################################################################

print_step "Verificando requisitos..."

# Verificar Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js no está instalado"
    exit 1
fi
NODE_VERSION=$(node -v)
print_success "Node.js: $NODE_VERSION"

# Verificar npm
if ! command -v npm &> /dev/null; then
    print_error "npm no está instalado"
    exit 1
fi
NPM_VERSION=$(npm -v)
print_success "npm: v$NPM_VERSION"

# Verificar Java
if ! command -v java &> /dev/null; then
    print_error "Java no está instalado"
    exit 1
fi
JAVA_VERSION=$(java -version 2>&1 | awk -F '"' '/version/ {print $2}')
print_success "Java: $JAVA_VERSION"

# Verificar Android SDK
if [ -z "$ANDROID_HOME" ]; then
    print_warning "ANDROID_HOME no está configurado"
    print_warning "Buscando Android SDK..."

    # Intentar encontrar Android SDK
    if [ -d "$HOME/Android/Sdk" ]; then
        export ANDROID_HOME="$HOME/Android/Sdk"
        print_success "Android SDK encontrado en: $ANDROID_HOME"
    elif [ -d "$HOME/Library/Android/sdk" ]; then
        export ANDROID_HOME="$HOME/Library/Android/sdk"
        print_success "Android SDK encontrado en: $ANDROID_HOME"
    else
        print_error "No se pudo encontrar Android SDK"
        exit 1
    fi
else
    print_success "Android SDK: $ANDROID_HOME"
fi

# Verificar keystore
KEYSTORE_FILE="$ANDROID_DIR/app/awakening-release-key.keystore"
if [ ! -f "$KEYSTORE_FILE" ]; then
    print_error "Keystore no encontrado: $KEYSTORE_FILE"
    print_message "Ejecuta: ./scripts/create-keystore.sh"
    exit 1
fi
print_success "Keystore encontrado"

# Verificar keystore.properties
KEYSTORE_PROPS="$ANDROID_DIR/app/keystore.properties"
if [ ! -f "$KEYSTORE_PROPS" ]; then
    print_error "keystore.properties no encontrado"
    print_message "Ejecuta: ./scripts/create-keystore.sh"
    exit 1
fi
print_success "keystore.properties configurado"

###############################################################################
# OBTENER INFORMACIÓN DE VERSIÓN
###############################################################################

print_step "Obteniendo información de versión..."

VERSION_NAME=$(node -p "require('./package.json').version")
VERSION_CODE=$(git rev-list --count HEAD 2>/dev/null || echo "1")
GIT_HASH=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
BUILD_DATE=$(date +"%Y-%m-%d %H:%M:%S")

echo ""
echo -e "${CYAN}  Version Name:  ${NC}$VERSION_NAME"
echo -e "${CYAN}  Version Code:  ${NC}$VERSION_CODE"
echo -e "${CYAN}  Git Hash:      ${NC}$GIT_HASH"
echo -e "${CYAN}  Build Date:    ${NC}$BUILD_DATE"
echo -e "${CYAN}  Build Format:  ${NC}${BUILD_FORMAT^^}"
echo ""

###############################################################################
# LIMPIEZA
###############################################################################

if [ "$CLEAN_BUILD" = true ]; then
    print_step "Limpiando build anterior..."

    rm -rf node_modules/.cache
    rm -rf $ANDROID_DIR/app/build
    rm -rf $ANDROID_DIR/build

    cd $ANDROID_DIR
    ./gradlew clean --no-daemon
    cd - > /dev/null

    print_success "Limpieza completada"
fi

###############################################################################
# INSTALACIÓN DE DEPENDENCIAS
###############################################################################

print_step "Instalando dependencias..."

if [ ! -d "node_modules" ] || [ "$CLEAN_BUILD" = true ]; then
    npm ci --prefer-offline --no-audit
else
    print_message "Dependencias ya instaladas (usar --clean para reinstalar)"
fi

print_success "Dependencias instaladas"

###############################################################################
# OPTIMIZACIÓN DE ASSETS
###############################################################################

if [ "$OPTIMIZE_ASSETS" = true ]; then
    print_step "Optimizando assets..."

    if [ -f "$SCRIPT_DIR/optimize-assets.sh" ]; then
        bash "$SCRIPT_DIR/optimize-assets.sh" || true
        print_success "Assets optimizados"
    else
        print_warning "Script de optimización no encontrado"
    fi
fi

###############################################################################
# LINTER
###############################################################################

if [ "$RUN_LINT" = true ]; then
    print_step "Ejecutando linter..."

    npm run lint || {
        print_warning "Linter encontró problemas (continuando...)"
    }

    print_success "Linter completado"
fi

###############################################################################
# TESTS
###############################################################################

if [ "$RUN_TESTS" = true ]; then
    print_step "Ejecutando tests..."

    npm test -- --ci --coverage --maxWorkers=2 || {
        print_error "Tests fallaron"
        read -p "¿Continuar de todas formas? (s/N): " CONTINUE
        if [ "$CONTINUE" != "s" ] && [ "$CONTINUE" != "S" ]; then
            exit 1
        fi
    }

    print_success "Tests completados"
fi

###############################################################################
# BUILD DE ANDROID
###############################################################################

print_step "Construyendo Android $BUILD_FORMAT..."

cd $ANDROID_DIR

# Hacer gradlew ejecutable
chmod +x gradlew

# Build según formato
if [ "$BUILD_FORMAT" = "aab" ]; then
    ./gradlew bundleRelease --no-daemon --stacktrace
    BUILD_OUTPUT="$ANDROID_DIR/app/build/outputs/bundle/release/app-release.aab"
else
    ./gradlew assembleRelease --no-daemon --stacktrace
    BUILD_OUTPUT="$ANDROID_DIR/app/build/outputs/apk/release"
fi

cd - > /dev/null

if [ $? -eq 0 ]; then
    print_success "Build completado exitosamente"
else
    print_error "Build falló"
    exit 1
fi

###############################################################################
# RENOMBRAR ARCHIVOS
###############################################################################

print_step "Renombrando archivos de salida..."

if [ "$BUILD_FORMAT" = "aab" ]; then
    # Renombrar AAB
    OUTPUT_AAB="$ANDROID_DIR/app/build/outputs/bundle/release/awakening-protocol-v${VERSION_NAME}-${VERSION_CODE}.aab"
    mv "$ANDROID_DIR/app/build/outputs/bundle/release/app-release.aab" "$OUTPUT_AAB" 2>/dev/null || true

    print_success "AAB: $(basename "$OUTPUT_AAB")"
else
    # Renombrar APKs
    cd "$BUILD_OUTPUT"

    for apk in *.apk; do
        if [[ $apk == *"universal"* ]]; then
            NEW_NAME="awakening-protocol-v${VERSION_NAME}-${VERSION_CODE}-universal.apk"
        elif [[ $apk == *"arm64-v8a"* ]]; then
            NEW_NAME="awakening-protocol-v${VERSION_NAME}-${VERSION_CODE}-arm64.apk"
        elif [[ $apk == *"armeabi-v7a"* ]]; then
            NEW_NAME="awakening-protocol-v${VERSION_NAME}-${VERSION_CODE}-arm32.apk"
        elif [[ $apk == *"x86_64"* ]]; then
            NEW_NAME="awakening-protocol-v${VERSION_NAME}-${VERSION_CODE}-x86_64.apk"
        elif [[ $apk == *"x86"* ]] && [[ $apk != *"x86_64"* ]]; then
            NEW_NAME="awakening-protocol-v${VERSION_NAME}-${VERSION_CODE}-x86.apk"
        else
            continue
        fi

        mv "$apk" "$NEW_NAME"

        # Tamaño del archivo
        SIZE=$(du -h "$NEW_NAME" | cut -f1)
        print_success "APK: $NEW_NAME ($SIZE)"
    done

    cd - > /dev/null
fi

###############################################################################
# GENERAR CHANGELOG
###############################################################################

print_step "Generando changelog..."

CHANGELOG_FILE="$PROJECT_DIR/../CHANGELOG-v${VERSION_NAME}.md"

cat > "$CHANGELOG_FILE" <<EOF
# Awakening Protocol v${VERSION_NAME}

**Release Date:** $BUILD_DATE
**Version Code:** $VERSION_CODE
**Git Hash:** $GIT_HASH

## Changes

EOF

# Obtener commits desde el último tag
LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")

if [ -n "$LAST_TAG" ]; then
    git log $LAST_TAG..HEAD --pretty=format:"- %s" --no-merges >> "$CHANGELOG_FILE"
else
    git log --pretty=format:"- %s" --no-merges --max-count=20 >> "$CHANGELOG_FILE"
fi

cat >> "$CHANGELOG_FILE" <<EOF


## Build Info

- **Platform:** Android
- **Build Type:** Release
- **Format:** ${BUILD_FORMAT^^}
- **Min SDK:** 23 (Android 6.0)
- **Target SDK:** 34 (Android 14.0)

## Installation

1. Download el APK correspondiente a tu dispositivo
2. Habilita "Instalar apps de fuentes desconocidas" en Configuración
3. Abre el APK descargado e instala

## APK Variants

- **Universal:** Compatible con todos los dispositivos (más pesado)
- **ARM64:** Para dispositivos modernos (recomendado)
- **ARM32:** Para dispositivos antiguos
- **x86/x86_64:** Para emuladores y tablets Intel

EOF

print_success "Changelog generado: $(basename "$CHANGELOG_FILE")"

###############################################################################
# RESUMEN
###############################################################################

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✓ BUILD COMPLETADO EXITOSAMENTE${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${CYAN}Archivos generados:${NC}"
echo ""

if [ "$BUILD_FORMAT" = "aab" ]; then
    echo "  📦 AAB (Google Play):"
    ls -lh "$ANDROID_DIR/app/build/outputs/bundle/release/"*.aab | awk '{print "     " $9 " (" $5 ")"}'
else
    echo "  📦 APKs:"
    ls -lh "$BUILD_OUTPUT"/*.apk | awk '{print "     " $9 " (" $5 ")"}'
fi

echo ""
echo "  📄 Changelog:"
echo "     $CHANGELOG_FILE"
echo ""

if [ -d "$ANDROID_DIR/app/build/outputs/mapping/release" ]; then
    echo "  🗺️  ProGuard Mapping:"
    echo "     $ANDROID_DIR/app/build/outputs/mapping/release/mapping.txt"
    echo ""
fi

echo -e "${CYAN}Próximos pasos:${NC}"
echo ""

if [ "$BUILD_FORMAT" = "aab" ]; then
    echo "  1. Sube el AAB a Google Play Console"
    echo "  2. Completa la información del listing"
    echo "  3. Crea una release en Play Console"
else
    echo "  1. Prueba el APK en dispositivos reales"
    echo "  2. Distribuye via GitHub Releases o Firebase App Distribution"
    echo "  3. Considera generar AAB para Play Store: $0 --aab"
fi

echo ""
print_success "¡Todo listo para producción! 🚀"
echo ""
