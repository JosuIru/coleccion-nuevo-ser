#!/bin/bash

# Script para preparar archivos para subir a gailu.net
# Crea un paquete limpio sin archivos innecesarios

set -e

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Preparando archivos para gailu.net${NC}"
echo -e "${GREEN}========================================${NC}"
echo

# Directorio de salida
OUTPUT_DIR="/tmp/gailu-upload-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$OUTPUT_DIR"

echo -e "${YELLOW}Copiando archivos...${NC}"

# Copiar www/ (excluyendo APKs y archivos grandes)
echo "  → www/ (sin APKs)"
rsync -a --progress \
  --exclude='*.apk' \
  --exclude='*.apk.idsig' \
  --exclude='downloads/*.apk' \
  --exclude='node_modules' \
  --exclude='.git' \
  www/ "$OUTPUT_DIR/www/"

# Copiar API
echo "  → api/check-version.php"
mkdir -p "$OUTPUT_DIR/api"
cp api/check-version.php "$OUTPUT_DIR/api/"

# Crear archivo de instrucciones
cat > "$OUTPUT_DIR/INSTRUCCIONES.txt" << 'EOF'
INSTRUCCIONES PARA SUBIR A GAILU.NET
====================================

1. Conectar por FTP/SFTP a gailu.net

2. Subir TODOS los archivos de esta carpeta al servidor:
   - www/ → Reemplazar carpeta www/ del servidor
   - api/ → Reemplazar/crear carpeta api/ del servidor

3. Verificar permisos:
   - api/check-version.php debe tener permisos 644 (rw-r--r--)
   - Archivos .js deben tener permisos 644

4. IMPORTANTE: Subir también el APK si quieres descarga directa:
   Subir manualmente:
   - coleccion-nuevo-ser-v2.9.284.apk → www/downloads/
   - coleccion-nuevo-ser-v2.9.284.apk.idsig → www/downloads/

5. Verificar después de subir:
   - Abrir https://gailu.net en el navegador
   - Abrir consola (F12)
   - Buscar: [AppInit] Versión:
   - Debe mostrar: 2.9.286 o superior
   - No debe haber errores "Unexpected token '<'"

6. Probar API:
   curl -X POST https://gailu.net/api/check-version.php \
     -H "Content-Type: application/json" \
     -d '{"currentVersion":"2.9.0","platform":"android"}'

   Debe responder JSON con "latestVersion": "2.9.286"

IMPORTANTE:
- Hacer backup del servidor antes de subir
- Si algo falla, restaurar el backup
- Los APKs son opcionales (muy grandes para subir por FTP)

EOF

# Crear archivo con lista de cambios principales
cat > "$OUTPUT_DIR/CHANGELOG.txt" << 'EOF'
CAMBIOS PRINCIPALES v2.9.267 → v2.9.286
========================================

v2.9.286 (07/01/2026)
- VersionManager configurado para gailu.net backend
- Re-habilitado sistema de actualizaciones automáticas
- APK v2.9.284 disponible para descarga

v2.9.285 (07/01/2026)
- Fix: Botón sidebar intermitente (race condition)
- Fix: Flecha en footer de navegación (HTML comment)

v2.9.284 (07/01/2026)
- LazyLoader: Fix duplicate declaration

v2.9.281 (03/01/2026)
- Post-modular refactor bug fixes

v2.9.280 (02/01/2026)
- Restaurados controles ambient/binaural y botón AI chat

v2.9.279 (02/01/2026)
- Arquitectura modular BookReader (CRÍTICO)
- 8 archivos modulares nuevos en js/core/book-reader/

v2.9.278 (02/01/2026)
- Arquitectura modular AudioReader (CRÍTICO)
- 12 archivos modulares nuevos en js/features/audioreader/

v2.9.277 (31/12/2025)
- Null checks, accesibilidad, perfil en reader

ARCHIVOS CRÍTICOS NUEVOS:
- js/core/book-reader/ (8 archivos)
- js/features/audioreader/ (12 archivos)
- js/utils/storage-helper.js
- js/utils/ai-lazy-loader.js
- js/utils/learning-lazy-loader.js
- api/check-version.php (actualizado)

EOF

# Calcular tamaño
SIZE=$(du -sh "$OUTPUT_DIR" | cut -f1)

echo
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  ✓ Archivos preparados${NC}"
echo -e "${GREEN}========================================${NC}"
echo
echo -e "Ubicación: ${YELLOW}$OUTPUT_DIR${NC}"
echo -e "Tamaño total: ${YELLOW}$SIZE${NC}"
echo
echo -e "${YELLOW}Archivos incluidos:${NC}"
find "$OUTPUT_DIR" -type f | wc -l | xargs echo "  Total archivos:"
echo
echo -e "${YELLOW}Estructura:${NC}"
tree -L 3 -d "$OUTPUT_DIR" 2>/dev/null || find "$OUTPUT_DIR" -type d | head -20

echo
echo -e "${GREEN}Siguiente paso:${NC}"
echo -e "  1. Revisar archivos en: $OUTPUT_DIR"
echo -e "  2. Conectar por FTP/SFTP a gailu.net"
echo -e "  3. Subir todo el contenido de $OUTPUT_DIR"
echo -e "  4. Leer $OUTPUT_DIR/INSTRUCCIONES.txt"
echo
echo -e "${YELLOW}Opcional - Crear ZIP:${NC}"
echo -e "  cd $(dirname $OUTPUT_DIR)"
echo -e "  zip -r gailu-upload.zip $(basename $OUTPUT_DIR)"
echo
