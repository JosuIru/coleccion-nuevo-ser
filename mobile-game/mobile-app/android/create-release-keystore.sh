#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════
# Script para crear un keystore de producción para Awakening Protocol
# ═══════════════════════════════════════════════════════════════════════════
#
# IMPORTANTE: Este script genera un keystore REAL para producción.
# - Guarda el keystore y contraseñas en un lugar SEGURO
# - NUNCA commitees el keystore al repositorio
# - Necesitarás este keystore para TODAS las actualizaciones futuras de la app
#
# Uso: ./create-release-keystore.sh
# ═══════════════════════════════════════════════════════════════════════════

set -e

KEYSTORE_NAME="awakening-protocol-release.keystore"
KEY_ALIAS="awakening-protocol"
VALIDITY_DAYS=10000  # ~27 años

echo "═══════════════════════════════════════════════════════════════════════════"
echo " Creación de Keystore de Producción - Awakening Protocol"
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""
echo "⚠️  ADVERTENCIA: Este keystore es CRÍTICO para tu aplicación."
echo "    - Guárdalo en un lugar seguro (backup en la nube, USB cifrado, etc.)"
echo "    - Si lo pierdes, NO podrás actualizar tu app en Play Store"
echo "    - NUNCA lo subas a git ni lo compartas públicamente"
echo ""
read -p "¿Deseas continuar? (s/N): " confirm

if [[ "$confirm" != "s" && "$confirm" != "S" ]]; then
    echo "Cancelado."
    exit 0
fi

echo ""
echo "Generando keystore..."
echo ""

keytool -genkey -v \
    -keystore "$KEYSTORE_NAME" \
    -keyalg RSA \
    -keysize 2048 \
    -validity $VALIDITY_DAYS \
    -alias "$KEY_ALIAS"

if [ -f "$KEYSTORE_NAME" ]; then
    echo ""
    echo "═══════════════════════════════════════════════════════════════════════════"
    echo "✅ Keystore creado exitosamente: $KEYSTORE_NAME"
    echo "═══════════════════════════════════════════════════════════════════════════"
    echo ""
    echo "📋 Próximos pasos:"
    echo ""
    echo "1. Mueve el keystore a un lugar seguro (NO en el repositorio):"
    echo "   mv $KEYSTORE_NAME ~/keystores/"
    echo ""
    echo "2. Crea el archivo gradle.properties.local con:"
    echo "   RELEASE_STORE_FILE=/ruta/completa/a/$KEYSTORE_NAME"
    echo "   RELEASE_STORE_PASSWORD=tu_store_password"
    echo "   RELEASE_KEY_ALIAS=$KEY_ALIAS"
    echo "   RELEASE_KEY_PASSWORD=tu_key_password"
    echo ""
    echo "3. Para CI/CD, configura estas variables como secretos:"
    echo "   - RELEASE_STORE_FILE (base64 del keystore)"
    echo "   - RELEASE_STORE_PASSWORD"
    echo "   - RELEASE_KEY_ALIAS"
    echo "   - RELEASE_KEY_PASSWORD"
    echo ""
    echo "⚠️  IMPORTANTE: Guarda las contraseñas en un gestor de contraseñas"
    echo ""
else
    echo "❌ Error: No se pudo crear el keystore"
    exit 1
fi
