#!/bin/bash

###############################################################################
# AWAKENING PROTOCOL - ASSET OPTIMIZER
# Optimiza imágenes, SVGs y audio para reducir tamaño de APK
###############################################################################

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_message() { echo -e "${BLUE}[OPTIMIZER]${NC} $1"; }
print_success() { echo -e "${GREEN}[✓]${NC} $1"; }
print_error() { echo -e "${RED}[✗]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[!]${NC} $1"; }

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   AWAKENING PROTOCOL - ASSET OPTIMIZER            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════╝${NC}"
echo ""

# Directorio de assets
ASSETS_DIR="$(dirname "$0")/../mobile-app/src/assets"

if [ ! -d "$ASSETS_DIR" ]; then
    print_error "Directorio de assets no encontrado: $ASSETS_DIR"
    exit 1
fi

cd "$ASSETS_DIR"

# Contadores
TOTAL_BEFORE=0
TOTAL_AFTER=0
FILES_OPTIMIZED=0

###############################################################################
# OPTIMIZACIÓN DE IMÁGENES PNG
###############################################################################

print_message "Optimizando imágenes PNG..."

if command -v pngquant &> /dev/null; then
    while IFS= read -r -d '' file; do
        BEFORE=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null)
        TOTAL_BEFORE=$((TOTAL_BEFORE + BEFORE))

        pngquant --quality=65-80 --ext .png --force "$file" 2>/dev/null || true

        AFTER=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null)
        TOTAL_AFTER=$((TOTAL_AFTER + AFTER))
        FILES_OPTIMIZED=$((FILES_OPTIMIZED + 1))

        SAVED=$((BEFORE - AFTER))
        PERCENT=$((100 * SAVED / BEFORE))
        echo "  ✓ $(basename "$file"): $BEFORE → $AFTER bytes (-${PERCENT}%)"
    done < <(find . -type f -name "*.png" -print0)
    print_success "PNGs optimizados"
else
    print_warning "pngquant no instalado. Instalarlo para optimizar PNGs:"
    echo "    Ubuntu/Debian: sudo apt install pngquant"
    echo "    macOS: brew install pngquant"
fi

###############################################################################
# OPTIMIZACIÓN DE IMÁGENES JPG
###############################################################################

print_message "Optimizando imágenes JPG..."

if command -v jpegoptim &> /dev/null; then
    while IFS= read -r -d '' file; do
        BEFORE=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null)
        TOTAL_BEFORE=$((TOTAL_BEFORE + BEFORE))

        jpegoptim --max=85 --strip-all "$file" 2>/dev/null || true

        AFTER=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null)
        TOTAL_AFTER=$((TOTAL_AFTER + AFTER))
        FILES_OPTIMIZED=$((FILES_OPTIMIZED + 1))

        SAVED=$((BEFORE - AFTER))
        if [ $BEFORE -gt 0 ]; then
            PERCENT=$((100 * SAVED / BEFORE))
            echo "  ✓ $(basename "$file"): $BEFORE → $AFTER bytes (-${PERCENT}%)"
        fi
    done < <(find . -type f \( -name "*.jpg" -o -name "*.jpeg" \) -print0)
    print_success "JPGs optimizados"
else
    print_warning "jpegoptim no instalado. Instalarlo para optimizar JPGs:"
    echo "    Ubuntu/Debian: sudo apt install jpegoptim"
    echo "    macOS: brew install jpegoptim"
fi

###############################################################################
# OPTIMIZACIÓN DE SVGs
###############################################################################

print_message "Optimizando SVGs..."

if command -v svgo &> /dev/null; then
    while IFS= read -r -d '' file; do
        BEFORE=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null)
        TOTAL_BEFORE=$((TOTAL_BEFORE + BEFORE))

        svgo "$file" --quiet 2>/dev/null || true

        AFTER=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null)
        TOTAL_AFTER=$((TOTAL_AFTER + AFTER))
        FILES_OPTIMIZED=$((FILES_OPTIMIZED + 1))

        SAVED=$((BEFORE - AFTER))
        if [ $BEFORE -gt 0 ]; then
            PERCENT=$((100 * SAVED / BEFORE))
            echo "  ✓ $(basename "$file"): $BEFORE → $AFTER bytes (-${PERCENT}%)"
        fi
    done < <(find . -type f -name "*.svg" -print0)
    print_success "SVGs optimizados"
else
    print_warning "svgo no instalado. Instalarlo para optimizar SVGs:"
    echo "    npm install -g svgo"
fi

###############################################################################
# CONVERSIÓN DE AUDIO A OGG (más comprimido que MP3)
###############################################################################

print_message "Verificando archivos de audio..."

if command -v ffmpeg &> /dev/null; then
    MP3_COUNT=$(find . -type f -name "*.mp3" 2>/dev/null | wc -l)
    WAV_COUNT=$(find . -type f -name "*.wav" 2>/dev/null | wc -l)

    if [ $MP3_COUNT -gt 0 ] || [ $WAV_COUNT -gt 0 ]; then
        print_warning "Encontrados $MP3_COUNT MP3s y $WAV_COUNT WAVs"
        echo "  Considera convertir a OGG (mejor compresión):"
        echo "    ffmpeg -i input.mp3 -c:a libvorbis -q:a 4 output.ogg"
    fi
else
    print_warning "ffmpeg no instalado (opcional para audio)"
fi

###############################################################################
# RESUMEN
###############################################################################

echo ""
print_message "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
print_message "RESUMEN DE OPTIMIZACIÓN"
print_message "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ $TOTAL_BEFORE -gt 0 ]; then
    TOTAL_SAVED=$((TOTAL_BEFORE - TOTAL_AFTER))
    TOTAL_PERCENT=$((100 * TOTAL_SAVED / TOTAL_BEFORE))

    echo "  Archivos procesados:  $FILES_OPTIMIZED"
    echo "  Tamaño antes:         $(numfmt --to=iec $TOTAL_BEFORE 2>/dev/null || echo $TOTAL_BEFORE bytes)"
    echo "  Tamaño después:       $(numfmt --to=iec $TOTAL_AFTER 2>/dev/null || echo $TOTAL_AFTER bytes)"
    echo "  Espacio ahorrado:     $(numfmt --to=iec $TOTAL_SAVED 2>/dev/null || echo $TOTAL_SAVED bytes) (-${TOTAL_PERCENT}%)"
else
    echo "  No se encontraron archivos para optimizar"
fi

echo ""
print_success "¡Optimización completada!"
echo ""

###############################################################################
# RECOMENDACIONES ADICIONALES
###############################################################################

print_message "Recomendaciones adicionales:"
echo ""
echo "  1. Usa WebP en lugar de PNG/JPG cuando sea posible:"
echo "     cwebp -q 80 input.png -o output.webp"
echo ""
echo "  2. Genera iconos en múltiples densidades (mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi)"
echo ""
echo "  3. Usa vector drawables (XML) en lugar de PNGs para iconos simples"
echo ""
echo "  4. Considera usar recursos remotos (CDN) para assets grandes"
echo ""
echo "  5. Implementa lazy loading de imágenes en la app"
echo ""
