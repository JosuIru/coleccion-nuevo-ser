#!/bin/bash

# Script para verificar que el endpoint de actualizaciones funciona correctamente
# Uso: ./scripts/test-version-api.sh [url]

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuración
API_URL=${1:-"https://gailu.net/api/check-version.php"}
TEST_VERSION="2.9.0"  # Versión antigua para forzar que detecte actualización

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Test Version API${NC}"
echo -e "${GREEN}========================================${NC}"
echo
echo -e "Endpoint: ${YELLOW}${API_URL}${NC}"
echo

# Verificar que curl está instalado
if ! command -v curl &> /dev/null; then
    echo -e "${RED}Error: curl no está instalado${NC}"
    exit 1
fi

# Test 1: Endpoint accesible
echo -e "${YELLOW}[Test 1/4] Verificando que el endpoint está accesible...${NC}"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL" -X OPTIONS)

if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✓ Endpoint accesible (HTTP $HTTP_CODE)${NC}"
elif [ "$HTTP_CODE" -eq 405 ]; then
    echo -e "${GREEN}✓ Endpoint accesible (HTTP $HTTP_CODE - Method Not Allowed es esperado para OPTIONS)${NC}"
else
    echo -e "${RED}✗ Error: HTTP $HTTP_CODE${NC}"
    echo -e "${YELLOW}El endpoint no está accesible. Verifica que el archivo PHP esté subido.${NC}"
    exit 1
fi
echo

# Test 2: POST con datos válidos
echo -e "${YELLOW}[Test 2/4] Enviando request POST con versión ${TEST_VERSION}...${NC}"

RESPONSE=$(curl -s -X POST "$API_URL" \
    -H "Content-Type: application/json" \
    -d "{\"currentVersion\":\"${TEST_VERSION}\",\"platform\":\"android\",\"timestamp\":$(date +%s)000}")

echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"
echo

# Verificar que la respuesta es JSON válido
if ! echo "$RESPONSE" | jq empty 2>/dev/null; then
    echo -e "${RED}✗ Error: La respuesta no es JSON válido${NC}"
    echo -e "${YELLOW}Respuesta recibida:${NC}"
    echo "$RESPONSE"
    exit 1
fi
echo -e "${GREEN}✓ Respuesta JSON válida${NC}"
echo

# Test 3: Verificar campos de la respuesta
echo -e "${YELLOW}[Test 3/4] Validando campos de la respuesta...${NC}"

STATUS=$(echo "$RESPONSE" | jq -r '.status')
if [ "$STATUS" != "success" ]; then
    echo -e "${RED}✗ Error: status != 'success' (status: $STATUS)${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Status: $STATUS${NC}"

CURRENT_VERSION=$(echo "$RESPONSE" | jq -r '.currentVersion')
echo -e "${GREEN}✓ Current Version: $CURRENT_VERSION${NC}"

LATEST_VERSION=$(echo "$RESPONSE" | jq -r '.latestVersion')
echo -e "${GREEN}✓ Latest Version: $LATEST_VERSION${NC}"

UPDATE_AVAILABLE=$(echo "$RESPONSE" | jq -r '.updateAvailable')
echo -e "${GREEN}✓ Update Available: $UPDATE_AVAILABLE${NC}"

if [ "$UPDATE_AVAILABLE" != "true" ]; then
    echo -e "${YELLOW}⚠ Advertencia: updateAvailable debería ser true para versión ${TEST_VERSION}${NC}"
fi
echo

# Test 4: Verificar información de la actualización
echo -e "${YELLOW}[Test 4/4] Verificando información de actualización...${NC}"

if [ "$UPDATE_AVAILABLE" == "true" ]; then
    UPDATE_INFO=$(echo "$RESPONSE" | jq '.update')

    VERSION=$(echo "$UPDATE_INFO" | jq -r '.version')
    echo -e "${GREEN}✓ Update Version: $VERSION${NC}"

    DOWNLOAD_URL=$(echo "$UPDATE_INFO" | jq -r '.downloadUrl')
    echo -e "${GREEN}✓ Download URL: $DOWNLOAD_URL${NC}"

    FEATURES=$(echo "$UPDATE_INFO" | jq -r '.features | length')
    echo -e "${GREEN}✓ Features: $FEATURES items${NC}"

    IS_CRITICAL=$(echo "$UPDATE_INFO" | jq -r '.isCritical')
    echo -e "  Is Critical: $IS_CRITICAL"

    IS_SECURITY=$(echo "$UPDATE_INFO" | jq -r '.isSecurity')
    echo -e "  Is Security: $IS_SECURITY"
else
    echo -e "${YELLOW}⚠ No hay información de actualización (updateAvailable = false)${NC}"
fi
echo

# Resumen final
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  ✓ Todos los tests pasaron${NC}"
echo -e "${GREEN}========================================${NC}"
echo
echo -e "${YELLOW}Resumen:${NC}"
echo -e "  • Endpoint: ${API_URL}"
echo -e "  • Versión actual: ${CURRENT_VERSION}"
echo -e "  • Última versión: ${LATEST_VERSION}"
echo -e "  • Actualización disponible: ${UPDATE_AVAILABLE}"
echo

# Test adicional: verificar URL de descarga
if [ "$UPDATE_AVAILABLE" == "true" ] && [ "$DOWNLOAD_URL" != "null" ]; then
    echo -e "${YELLOW}Test adicional: Verificando que el APK existe...${NC}"

    APK_HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$DOWNLOAD_URL" -I)

    if [ "$APK_HTTP_CODE" -eq 200 ]; then
        echo -e "${GREEN}✓ APK accesible en $DOWNLOAD_URL (HTTP $APK_HTTP_CODE)${NC}"
    else
        echo -e "${YELLOW}⚠ APK no encontrado: HTTP $APK_HTTP_CODE${NC}"
        echo -e "${YELLOW}  Asegúrate de subir el APK a: $DOWNLOAD_URL${NC}"
    fi
fi
echo

echo -e "${GREEN}Todo listo para usar el sistema de actualizaciones.${NC}"
