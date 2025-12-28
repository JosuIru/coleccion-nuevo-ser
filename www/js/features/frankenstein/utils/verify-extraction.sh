#!/bin/bash
# Verificación de extracción del Background Rotator
# REFACTORING v2.9.200 - Fase 1

echo "=========================================="
echo "VERIFICACIÓN: Background Rotator Extract"
echo "=========================================="
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contadores
PASSED=0
FAILED=0

# Test 1: Verificar que el módulo existe
echo -n "Test 1: Módulo creado... "
if [ -f "frankenstein-background-rotator.js" ]; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((FAILED++))
fi

# Test 2: Verificar que el módulo tiene exportaciones
echo -n "Test 2: Exportaciones ES6... "
if grep -q "export class BackgroundRotator" frankenstein-background-rotator.js; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((FAILED++))
fi

# Test 3: Verificar que no tiene dependencias externas
echo -n "Test 3: Sin dependencias... "
if ! grep -qE "^import " frankenstein-background-rotator.js; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((FAILED++))
fi

# Test 4: Verificar que frankenstein-ui.js tiene el import
echo -n "Test 4: Import en frankenstein-ui.js... "
if grep -q "import BackgroundRotator from './frankenstein/utils/frankenstein-background-rotator.js'" ../../frankenstein-ui.js; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((FAILED++))
fi

# Test 5: Verificar que frankenstein-ui.js usa el rotator
echo -n "Test 5: Uso de BackgroundRotator... "
if grep -q "this.backgroundRotator = new BackgroundRotator" ../../frankenstein-ui.js; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((FAILED++))
fi

# Test 6: Verificar que tiene método destroy
echo -n "Test 6: Método destroy()... "
if grep -q "destroy()" frankenstein-background-rotator.js; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((FAILED++))
fi

# Test 7: Verificar que tiene los 3 métodos principales
echo -n "Test 7: Métodos principales... "
if grep -q "setRandomBackground" frankenstein-background-rotator.js && \
   grep -q "resolveAssetUrl" frankenstein-background-rotator.js && \
   grep -q "startRotation" frankenstein-background-rotator.js; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((FAILED++))
fi

# Test 8: Verificar tamaño del módulo (debe ser ~4-5KB)
echo -n "Test 8: Tamaño del módulo... "
SIZE=$(wc -c < frankenstein-background-rotator.js)
if [ "$SIZE" -gt 3000 ] && [ "$SIZE" -lt 10000 ]; then
    echo -e "${GREEN}✓ PASS${NC} (${SIZE} bytes)"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠ WARNING${NC} (${SIZE} bytes - esperado 3-10KB)"
    ((PASSED++))
fi

# Test 9: Verificar líneas del módulo (debe ser ~100-200)
echo -n "Test 9: Líneas del módulo... "
LINES=$(wc -l < frankenstein-background-rotator.js)
if [ "$LINES" -gt 80 ] && [ "$LINES" -lt 250 ]; then
    echo -e "${GREEN}✓ PASS${NC} (${LINES} líneas)"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠ WARNING${NC} (${LINES} líneas - esperado 80-250)"
    ((PASSED++))
fi

# Test 10: Verificar que lazy-loader habilita módulos ES6
echo -n "Test 10: Lazy-loader ES6 modules... "
if grep -q "script.type = 'module'" ../../../core/lazy-loader.js; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((FAILED++))
fi

echo ""
echo "=========================================="
echo "RESULTADOS"
echo "=========================================="
echo -e "${GREEN}Pasados: ${PASSED}${NC}"
echo -e "${RED}Fallados: ${FAILED}${NC}"
echo ""

if [ "$FAILED" -eq 0 ]; then
    echo -e "${GREEN}✓ TODOS LOS TESTS PASARON${NC}"
    echo ""
    echo "Archivos creados/modificados:"
    echo "  - frankenstein-background-rotator.js (módulo)"
    echo "  - frankenstein-background-rotator.test.html (tests)"
    echo "  - ../../../frankenstein-ui.js (modificado)"
    echo "  - ../../../../core/lazy-loader.js (modificado)"
    echo ""
    echo "Siguiente paso: Probar en navegador"
    exit 0
else
    echo -e "${RED}✗ ALGUNOS TESTS FALLARON${NC}"
    exit 1
fi
