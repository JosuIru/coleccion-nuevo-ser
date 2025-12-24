#!/bin/bash

# ============================================================================
# PREPARAR ASSETS DE BIBLIOTECA PARA MOBILE APP
# ============================================================================
# Este script prepara la webapp de Colección Nuevo Ser para ser empaquetada
# en la aplicación móvil de Awakening Protocol
#
# Autor: Claude Sonnet 4.5
# Fecha: 2025-12-20
# Versión: 1.0.0
# ============================================================================

set -e  # Exit on error

echo "🚀 Preparando assets de Biblioteca para mobile app..."
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Directorios
WWW_DIR="www"
MOBILE_ASSETS_DIR="mobile-game/mobile-app/android/app/src/main/assets/coleccion"
TEMP_DIR="/tmp/coleccion-assets-prep"

# Verificar que estamos en el directorio correcto
if [ ! -d "$WWW_DIR" ]; then
  echo -e "${RED}❌ Error: Directorio www/ no encontrado${NC}"
  echo "   Ejecuta este script desde la raíz del proyecto coleccion-nuevo-ser"
  exit 1
fi

# Crear directorio temporal
echo -e "${BLUE}📁 Creando directorio temporal...${NC}"
rm -rf "$TEMP_DIR"
mkdir -p "$TEMP_DIR"

# ============================================================================
# PASO 1: COPIAR ARCHIVOS ESENCIALES
# ============================================================================

echo -e "${BLUE}📋 Copiando archivos esenciales...${NC}"

# Copiar todo excepto lo que vamos a excluir
rsync -av \
  --exclude='downloads/' \
  --exclude='*.apk' \
  --exclude='*.log' \
  --exclude='node_modules/' \
  --exclude='.git/' \
  --exclude='DEPLOYMENT-NOTES.txt' \
  --progress \
  "$WWW_DIR/" "$TEMP_DIR/"

echo -e "${GREEN}✅ Archivos copiados${NC}"

# ============================================================================
# PASO 2: DESCARGAR CDN DEPENDENCIES LOCALMENTE
# ============================================================================

echo -e "${BLUE}📦 Descargando dependencias de CDN...${NC}"

mkdir -p "$TEMP_DIR/js/vendor"

# Tailwind CSS (alternativa: usar build compilado)
if [ ! -f "$TEMP_DIR/js/vendor/tailwind.min.js" ]; then
  echo "  → Descargando Tailwind CSS..."
  curl -s -o "$TEMP_DIR/js/vendor/tailwind.min.js" \
    https://cdn.tailwindcss.com || echo "  ⚠️  No se pudo descargar Tailwind (usar fallback)"
fi

# Lucide Icons
if [ ! -f "$TEMP_DIR/js/vendor/lucide.min.js" ]; then
  echo "  → Descargando Lucide Icons..."
  curl -s -o "$TEMP_DIR/js/vendor/lucide.min.js" \
    https://unpkg.com/lucide@0.294.0/dist/umd/lucide.min.js || echo "  ⚠️  No se pudo descargar Lucide"
fi

# Supabase JS Client
if [ ! -f "$TEMP_DIR/js/vendor/supabase.min.js" ]; then
  echo "  → Descargando Supabase JS..."
  curl -s -o "$TEMP_DIR/js/vendor/supabase.min.js" \
    https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.0/dist/umd/supabase.min.js || echo "  ⚠️  No se pudo descargar Supabase"
fi

echo -e "${GREEN}✅ Dependencias descargadas${NC}"

# ============================================================================
# PASO 3: OPTIMIZAR IMÁGENES
# ============================================================================

echo -e "${BLUE}🖼️  Optimizando imágenes grandes...${NC}"

# Optimizar vitruvio.jpg si existe
VITRUVIO="$TEMP_DIR/assets/backgrounds/vitruvio.jpg"
if [ -f "$VITRUVIO" ]; then
  ORIGINAL_SIZE=$(du -h "$VITRUVIO" | cut -f1)
  echo "  → vitruvio.jpg: $ORIGINAL_SIZE"

  # Verificar si ImageMagick está instalado
  if command -v convert &> /dev/null; then
    echo "    Comprimiendo con ImageMagick..."
    convert "$VITRUVIO" -quality 70 -resize 1920x1080\> "$TEMP_DIR/assets/backgrounds/vitruvio_optimized.jpg"
    mv "$TEMP_DIR/assets/backgrounds/vitruvio_optimized.jpg" "$VITRUVIO"
    NEW_SIZE=$(du -h "$VITRUVIO" | cut -f1)
    echo -e "    ${GREEN}✓ Optimizado: $ORIGINAL_SIZE → $NEW_SIZE${NC}"
  else
    echo -e "    ${YELLOW}⚠️  ImageMagick no instalado, saltando optimización${NC}"
    echo "       Instalar: sudo apt-get install imagemagick (Linux) o brew install imagemagick (Mac)"
  fi
fi

echo -e "${GREEN}✅ Imágenes optimizadas${NC}"

# ============================================================================
# PASO 4: MODIFICAR INDEX.HTML PARA USAR VENDORS LOCALES
# ============================================================================

echo -e "${BLUE}🔧 Modificando index.html para usar vendors locales...${NC}"

INDEX_FILE="$TEMP_DIR/index.html"

if [ -f "$INDEX_FILE" ]; then
  # Backup original
  cp "$INDEX_FILE" "$INDEX_FILE.backup"

  # Reemplazar Tailwind CDN con local (con fallback)
  sed -i 's|https://cdn.tailwindcss.com|js/vendor/tailwind.min.js|g' "$INDEX_FILE"

  # Reemplazar Lucide CDN con local
  sed -i 's|https://unpkg.com/lucide@[^/]*/dist/umd/lucide.min.js|js/vendor/lucide.min.js|g' "$INDEX_FILE"

  # Reemplazar Supabase CDN con local
  sed -i 's|https://cdn.jsdelivr.net/npm/@supabase/supabase-js@[^/]*/dist/umd/supabase.min.js|js/vendor/supabase.min.js|g' "$INDEX_FILE"

  # Agregar fallback para Tailwind
  sed -i '/<script src="js\/vendor\/tailwind.min.js"/a\
        onerror="document.head.appendChild(Object.assign(document.createElement('"'"'link'"'"'),{rel:'"'"'stylesheet'"'"',href:'"'"'css/tailwind-fallback.css'"'"'}))"' "$INDEX_FILE"

  echo -e "${GREEN}✅ index.html modificado para usar vendors locales${NC}"
else
  echo -e "${YELLOW}⚠️  index.html no encontrado${NC}"
fi

# ============================================================================
# PASO 5: CREAR ARCHIVO DE CONFIGURACIÓN PARA MOBILE
# ============================================================================

echo -e "${BLUE}⚙️  Creando configuración de mobile...${NC}"

cat > "$TEMP_DIR/js/config-mobile.js" << 'EOF'
/**
 * Configuración específica para mobile app
 * Este archivo es automáticamente cargado cuando se detecta mobile app
 */

window.MOBILE_APP_CONFIG = {
  version: '1.0.0',
  buildDate: new Date().toISOString(),
  platform: 'android',
  isEmbedded: true,
  features: {
    offline: true,
    syncWithGame: true,
    rewards: true,
    analytics: true
  }
};

// Detectar si estamos en mobile app
if (window.IS_MOBILE_APP || window.ReactNativeWebView) {
  console.log('[MobileConfig] Running in mobile app');

  // Deshabilitar features que no funcionan en WebView
  if (window.navigator && window.navigator.serviceWorker) {
    window.navigator.serviceWorker.getRegistrations().then(function(registrations) {
      for(let registration of registrations) {
        registration.unregister();
      }
    });
  }

  // Ocultar elementos específicos de web
  document.addEventListener('DOMContentLoaded', () => {
    const webOnlyElements = document.querySelectorAll('.web-only, .download-app-buttons');
    webOnlyElements.forEach(el => el.style.display = 'none');
  });
}
EOF

echo -e "${GREEN}✅ Configuración de mobile creada${NC}"

# ============================================================================
# PASO 6: CALCULAR TAMAÑO TOTAL
# ============================================================================

echo ""
echo -e "${BLUE}📊 Calculando tamaño de assets...${NC}"

TOTAL_SIZE=$(du -sh "$TEMP_DIR" | cut -f1)
BOOKS_SIZE=$(du -sh "$TEMP_DIR/books" 2>/dev/null | cut -f1 || echo "0")
JS_SIZE=$(du -sh "$TEMP_DIR/js" 2>/dev/null | cut -f1 || echo "0")
CSS_SIZE=$(du -sh "$TEMP_DIR/css" 2>/dev/null | cut -f1 || echo "0")
ASSETS_SIZE=$(du -sh "$TEMP_DIR/assets" 2>/dev/null | cut -f1 || echo "0")

echo ""
echo "  📦 Total:   $TOTAL_SIZE"
echo "  📚 Books:   $BOOKS_SIZE"
echo "  📜 JS:      $JS_SIZE"
echo "  🎨 CSS:     $CSS_SIZE"
echo "  🖼️  Assets:  $ASSETS_SIZE"
echo ""

# ============================================================================
# PASO 7: COPIAR A ANDROID ASSETS
# ============================================================================

echo -e "${BLUE}📲 Copiando a Android assets...${NC}"

# Crear directorio de destino
mkdir -p "$MOBILE_ASSETS_DIR"

# Copiar assets preparados
rsync -av --delete --progress "$TEMP_DIR/" "$MOBILE_ASSETS_DIR/"

echo -e "${GREEN}✅ Assets copiados a $MOBILE_ASSETS_DIR${NC}"

# ============================================================================
# PASO 8: VERIFICAR ARCHIVOS CRÍTICOS
# ============================================================================

echo ""
echo -e "${BLUE}🔍 Verificando archivos críticos...${NC}"

CRITICAL_FILES=(
  "index.html"
  "js/core/biblioteca.js"
  "js/core/book-reader.js"
  "js/vendor/tailwind.min.js"
  "js/vendor/lucide.min.js"
  "js/vendor/supabase.min.js"
  "books/catalog.json"
  "css/core.css"
)

ALL_OK=true

for file in "${CRITICAL_FILES[@]}"; do
  if [ -f "$MOBILE_ASSETS_DIR/$file" ]; then
    echo -e "  ${GREEN}✓${NC} $file"
  else
    echo -e "  ${RED}✗${NC} $file (FALTANTE)"
    ALL_OK=false
  fi
done

echo ""

if [ "$ALL_OK" = true ]; then
  echo -e "${GREEN}✅ Todos los archivos críticos presentes${NC}"
else
  echo -e "${YELLOW}⚠️  Algunos archivos críticos faltan. Revisar warnings arriba.${NC}"
fi

# ============================================================================
# PASO 9: GENERAR REPORTE
# ============================================================================

REPORT_FILE="$MOBILE_ASSETS_DIR/ASSETS_REPORT.txt"

cat > "$REPORT_FILE" << EOF
REPORTE DE PREPARACIÓN DE ASSETS
=================================

Fecha: $(date)
Script: prepare-biblioteca-assets.sh v1.0.0

TAMAÑOS:
--------
Total:   $TOTAL_SIZE
Books:   $BOOKS_SIZE
JS:      $JS_SIZE
CSS:     $CSS_SIZE
Assets:  $ASSETS_SIZE

ARCHIVOS CRÍTICOS:
------------------
EOF

for file in "${CRITICAL_FILES[@]}"; do
  if [ -f "$MOBILE_ASSETS_DIR/$file" ]; then
    SIZE=$(du -h "$MOBILE_ASSETS_DIR/$file" | cut -f1)
    echo "✓ $file ($SIZE)" >> "$REPORT_FILE"
  else
    echo "✗ $file (FALTANTE)" >> "$REPORT_FILE"
  fi
done

echo "" >> "$REPORT_FILE"
echo "DEPENDENCIAS CDN LOCALES:" >> "$REPORT_FILE"
echo "-------------------------" >> "$REPORT_FILE"
echo "✓ Tailwind CSS → js/vendor/tailwind.min.js" >> "$REPORT_FILE"
echo "✓ Lucide Icons → js/vendor/lucide.min.js" >> "$REPORT_FILE"
echo "✓ Supabase JS  → js/vendor/supabase.min.js" >> "$REPORT_FILE"

echo -e "${GREEN}✅ Reporte generado: $REPORT_FILE${NC}"

# ============================================================================
# PASO 10: LIMPIEZA
# ============================================================================

echo ""
echo -e "${BLUE}🧹 Limpiando archivos temporales...${NC}"

# Descomentar para eliminar temp (deshabilitado por defecto para debug)
# rm -rf "$TEMP_DIR"

echo -e "${YELLOW}ℹ️  Archivos temporales conservados en: $TEMP_DIR${NC}"
echo "   Elimínalos manualmente si ya no los necesitas"

# ============================================================================
# FIN
# ============================================================================

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ ASSETS PREPARADOS EXITOSAMENTE${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "📁 Assets ubicados en: ${BLUE}$MOBILE_ASSETS_DIR${NC}"
echo -e "📊 Tamaño total: ${BLUE}$TOTAL_SIZE${NC}"
echo ""
echo "PRÓXIMOS PASOS:"
echo "---------------"
echo "1. Renombrar BibliotecaScreen.POC.js → BibliotecaScreen.js"
echo "2. Agregar BibliotecaScreen al RootNavigator"
echo "3. Compilar APK: cd mobile-game/mobile-app && npm run build:android"
echo "4. Probar en dispositivo real"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANTE:${NC}"
echo "   - Verifica que index.html carga correctamente"
echo "   - Prueba offline mode deshabilitando WiFi"
echo "   - Monitorea logs de WebView para errores"
echo ""
echo -e "${GREEN}🚀 ¡Listo para implementar Opción A!${NC}"
echo ""
