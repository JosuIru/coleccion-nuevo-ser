#!/bin/bash

# ═══════════════════════════════════════════════════════════
# SETUP CRISIS SYSTEM
# Script de instalación rápida del sistema de crisis
# ═══════════════════════════════════════════════════════════

set -e  # Exit on error

echo "🌍 ═══════════════════════════════════════════════════════"
echo "   Awakening Protocol - Crisis System Setup"
echo "   ═══════════════════════════════════════════════════════"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# ═══════════════════════════════════════════════════════════
# VERIFICAR REQUISITOS
# ═══════════════════════════════════════════════════════════

echo "📋 Verificando requisitos..."

# PHP
if ! command -v php &> /dev/null; then
    echo -e "${RED}❌ PHP no encontrado${NC}"
    echo "Instala PHP 7.4+ y vuelve a ejecutar este script"
    exit 1
fi

PHP_VERSION=$(php -r 'echo PHP_VERSION;')
echo -e "${GREEN}✅ PHP ${PHP_VERSION}${NC}"

# cURL
if ! php -m | grep -q curl; then
    echo -e "${YELLOW}⚠️  cURL extension no encontrada${NC}"
    echo "Instala php-curl: sudo apt install php-curl"
    exit 1
fi

echo -e "${GREEN}✅ cURL extension${NC}"

# ═══════════════════════════════════════════════════════════
# CREAR DIRECTORIOS
# ═══════════════════════════════════════════════════════════

echo ""
echo "📁 Creando directorios de caché..."

mkdir -p cache/rss
mkdir -p cache/ai
chmod 755 cache
chmod 755 cache/rss
chmod 755 cache/ai

echo -e "${GREEN}✅ Directorios creados${NC}"
echo "   - cache/rss"
echo "   - cache/ai"

# ═══════════════════════════════════════════════════════════
# CONFIGURAR API KEYS (OPCIONAL)
# ═══════════════════════════════════════════════════════════

echo ""
echo "🔑 Configuración de API Keys (opcional)"
echo "   El sistema funciona SIN API keys usando fallback"
echo ""

if [ ! -f api/.env ]; then
    read -p "¿Quieres configurar una API key para IA? (y/N): " -n 1 -r
    echo

    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cp api/.env.example api/.env

        echo ""
        echo "Selecciona proveedor de IA:"
        echo "  1) OpenAI GPT-4 (recomendado)"
        echo "  2) Anthropic Claude 3.5"
        echo "  3) Google Gemini (gratuito)"
        echo "  4) Ninguno (usar fallback)"
        echo ""
        read -p "Opción (1-4): " -n 1 -r PROVIDER_CHOICE
        echo

        case $PROVIDER_CHOICE in
            1)
                read -p "Ingresa tu OpenAI API key (sk-...): " OPENAI_KEY
                echo "OPENAI_API_KEY=${OPENAI_KEY}" > api/.env
                echo -e "${GREEN}✅ OpenAI configurado${NC}"
                ;;
            2)
                read -p "Ingresa tu Claude API key (sk-ant-...): " CLAUDE_KEY
                echo "CLAUDE_API_KEY=${CLAUDE_KEY}" > api/.env
                echo -e "${GREEN}✅ Claude configurado${NC}"
                ;;
            3)
                read -p "Ingresa tu Gemini API key: " GEMINI_KEY
                echo "GEMINI_API_KEY=${GEMINI_KEY}" > api/.env
                echo -e "${GREEN}✅ Gemini configurado${NC}"
                ;;
            *)
                echo -e "${YELLOW}⚠️  Sin API key - usando fallback${NC}"
                ;;
        esac
    else
        echo -e "${YELLOW}⚠️  Sin API key - usando fallback${NC}"
    fi
else
    echo -e "${GREEN}✅ Archivo .env ya existe${NC}"
fi

# ═══════════════════════════════════════════════════════════
# VERIFICAR INSTALACIÓN
# ═══════════════════════════════════════════════════════════

echo ""
echo "🧪 Verificando instalación..."

# Test RSS Parser
echo -n "   RSS Parser... "
if php -r '
    $_GET["action"] = "health";
    include "api/rss-parser.php";
' 2>/dev/null | grep -q "success"; then
    echo -e "${GREEN}✅${NC}"
else
    echo -e "${RED}❌${NC}"
    echo "Error en RSS Parser. Verifica los logs."
fi

# Test AI Classifier
echo -n "   AI Classifier... "
if php -r '
    $_GET["action"] = "health";
    include "api/ai-classifier.php";
' 2>/dev/null | grep -q "success"; then
    echo -e "${GREEN}✅${NC}"
else
    echo -e "${RED}❌${NC}"
    echo "Error en AI Classifier. Verifica los logs."
fi

# ═══════════════════════════════════════════════════════════
# RESUMEN
# ═══════════════════════════════════════════════════════════

echo ""
echo "═══════════════════════════════════════════════════════"
echo -e "${GREEN}✅ Instalación completada${NC}"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "📚 Próximos pasos:"
echo ""
echo "1. Ejecutar tests:"
echo "   Abrir: http://localhost/mobile-game/test-crisis-system.html"
echo ""
echo "2. Test desde terminal:"
echo "   curl \"http://localhost/api/rss-parser.php?action=get_news&limit=5\""
echo ""
echo "3. Configurar Mobile App:"
echo "   - Editar: mobile-app/src/config/constants.js"
echo "   - Agregar URL de tu API"
echo ""
echo "4. Leer documentación:"
echo "   - Quick Start: CRISIS-QUICK-START.md"
echo "   - Guía completa: CRISIS-SYSTEM-GUIDE.md"
echo "   - Implementación: IMPLEMENTACION-CRISIS.md"
echo ""
echo "═══════════════════════════════════════════════════════"
echo ""

# Opcional: Abrir test en navegador
if command -v xdg-open &> /dev/null; then
    read -p "¿Abrir interfaz de testing en navegador? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        xdg-open "http://localhost/mobile-game/test-crisis-system.html" 2>/dev/null || true
    fi
fi

echo "¡Listo para generar crisis del mundo real! 🌍✨"
