#!/bin/bash

###############################################################################
# AWAKENING PROTOCOL - KEYSTORE GENERATOR
# Genera un keystore de release para firmar APKs de producción
###############################################################################

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir mensajes
print_message() {
    echo -e "${BLUE}[KEYSTORE]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

# Banner
echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   AWAKENING PROTOCOL - KEYSTORE GENERATOR         ║${NC}"
echo -e "${BLUE}║   Generador de Keystore para Producción           ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════╝${NC}"
echo ""

# Verificar que keytool está instalado
if ! command -v keytool &> /dev/null; then
    print_error "keytool no está instalado. Instala JDK primero."
    echo ""
    echo "Para instalar JDK en Ubuntu/Debian:"
    echo "  sudo apt install openjdk-17-jdk"
    echo ""
    echo "Para instalar JDK en macOS:"
    echo "  brew install openjdk@17"
    echo ""
    exit 1
fi

# Directorio de salida
KEYSTORE_DIR="$(dirname "$0")/../mobile-app/android/app"
mkdir -p "$KEYSTORE_DIR"

# Valores por defecto
DEFAULT_KEYSTORE_NAME="awakening-release-key.keystore"
DEFAULT_KEY_ALIAS="awakening-key-alias"
DEFAULT_VALIDITY_DAYS="10000"

print_message "Este script te guiará para crear un keystore de producción."
echo ""

# Preguntar valores
read -p "Nombre del archivo keystore [$DEFAULT_KEYSTORE_NAME]: " KEYSTORE_NAME
KEYSTORE_NAME=${KEYSTORE_NAME:-$DEFAULT_KEYSTORE_NAME}

read -p "Alias de la key [$DEFAULT_KEY_ALIAS]: " KEY_ALIAS
KEY_ALIAS=${KEY_ALIAS:-$DEFAULT_KEY_ALIAS}

read -p "Validez en días [$DEFAULT_VALIDITY_DAYS]: " VALIDITY_DAYS
VALIDITY_DAYS=${VALIDITY_DAYS:-$DEFAULT_VALIDITY_DAYS}

echo ""
print_warning "⚠️  IMPORTANTE: Guarda estas credenciales en un lugar seguro"
echo ""

# Solicitar passwords
read -sp "Password del keystore: " STORE_PASSWORD
echo ""
read -sp "Confirmar password del keystore: " STORE_PASSWORD_CONFIRM
echo ""

if [ "$STORE_PASSWORD" != "$STORE_PASSWORD_CONFIRM" ]; then
    print_error "Los passwords no coinciden"
    exit 1
fi

read -sp "Password de la key (puede ser igual al del keystore): " KEY_PASSWORD
echo ""
read -sp "Confirmar password de la key: " KEY_PASSWORD_CONFIRM
echo ""

if [ "$KEY_PASSWORD" != "$KEY_PASSWORD_CONFIRM" ]; then
    print_error "Los passwords de la key no coinciden"
    exit 1
fi

echo ""
print_message "Ingresa la información del certificado:"
echo ""

read -p "Nombre completo (CN): " DNAME_CN
read -p "Organización (O): " DNAME_O
read -p "Unidad organizacional (OU): " DNAME_OU
read -p "Ciudad (L): " DNAME_L
read -p "Estado/Provincia (ST): " DNAME_ST
read -p "Código de país (C, 2 letras): " DNAME_C

# Construir Distinguished Name
DNAME="CN=$DNAME_CN, OU=$DNAME_OU, O=$DNAME_O, L=$DNAME_L, ST=$DNAME_ST, C=$DNAME_C"

# Ruta completa del keystore
KEYSTORE_PATH="$KEYSTORE_DIR/$KEYSTORE_NAME"

# Verificar si ya existe
if [ -f "$KEYSTORE_PATH" ]; then
    echo ""
    print_warning "El archivo $KEYSTORE_PATH ya existe."
    read -p "¿Deseas sobrescribirlo? (s/N): " OVERWRITE
    if [ "$OVERWRITE" != "s" ] && [ "$OVERWRITE" != "S" ]; then
        print_message "Operación cancelada"
        exit 0
    fi
    rm "$KEYSTORE_PATH"
fi

echo ""
print_message "Generando keystore..."

# Generar keystore
keytool -genkeypair \
    -v \
    -storetype PKCS12 \
    -keystore "$KEYSTORE_PATH" \
    -alias "$KEY_ALIAS" \
    -keyalg RSA \
    -keysize 4096 \
    -validity "$VALIDITY_DAYS" \
    -storepass "$STORE_PASSWORD" \
    -keypass "$KEY_PASSWORD" \
    -dname "$DNAME"

if [ $? -eq 0 ]; then
    echo ""
    print_success "Keystore generado exitosamente en:"
    echo "  $KEYSTORE_PATH"
    echo ""

    # Crear archivo de configuración (NO SE SUBE A GIT)
    CONFIG_FILE="$KEYSTORE_DIR/keystore.properties"
    cat > "$CONFIG_FILE" <<EOF
# KEYSTORE CONFIGURATION - DO NOT COMMIT TO GIT!
# Add this file to .gitignore

AWAKENING_RELEASE_STORE_FILE=$KEYSTORE_NAME
AWAKENING_RELEASE_KEY_ALIAS=$KEY_ALIAS
AWAKENING_RELEASE_STORE_PASSWORD=$STORE_PASSWORD
AWAKENING_RELEASE_KEY_PASSWORD=$KEY_PASSWORD
EOF

    print_success "Archivo de configuración creado:"
    echo "  $CONFIG_FILE"
    echo ""

    # Crear archivo de ejemplo para git
    EXAMPLE_FILE="$KEYSTORE_DIR/keystore.properties.example"
    cat > "$EXAMPLE_FILE" <<EOF
# KEYSTORE CONFIGURATION EXAMPLE
# Copy this file to keystore.properties and fill with your actual values

AWAKENING_RELEASE_STORE_FILE=awakening-release-key.keystore
AWAKENING_RELEASE_KEY_ALIAS=awakening-key-alias
AWAKENING_RELEASE_STORE_PASSWORD=YOUR_STORE_PASSWORD_HERE
AWAKENING_RELEASE_KEY_PASSWORD=YOUR_KEY_PASSWORD_HERE
EOF

    print_success "Archivo de ejemplo creado para git:"
    echo "  $EXAMPLE_FILE"
    echo ""

    # Agregar a .gitignore si existe
    GITIGNORE_FILE="$(dirname "$0")/../mobile-app/android/.gitignore"
    if [ -f "$GITIGNORE_FILE" ]; then
        if ! grep -q "keystore.properties" "$GITIGNORE_FILE"; then
            echo "" >> "$GITIGNORE_FILE"
            echo "# Keystore configuration" >> "$GITIGNORE_FILE"
            echo "keystore.properties" >> "$GITIGNORE_FILE"
            echo "*.keystore" >> "$GITIGNORE_FILE"
            echo "*.jks" >> "$GITIGNORE_FILE"
            print_success ".gitignore actualizado"
        fi
    fi

    echo ""
    print_warning "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    print_warning "⚠️  IMPORTANTE - GUARDA ESTA INFORMACIÓN DE FORMA SEGURA"
    print_warning "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "  Keystore file:     $KEYSTORE_NAME"
    echo "  Key alias:         $KEY_ALIAS"
    echo "  Store password:    $STORE_PASSWORD"
    echo "  Key password:      $KEY_PASSWORD"
    echo ""
    print_warning "Si pierdes esta información, NO PODRÁS actualizar la app en Play Store"
    echo ""
    echo "Recomendaciones:"
    echo "  1. Guarda una copia del keystore en un lugar seguro (USB, cloud cifrado)"
    echo "  2. Anota las credenciales en un gestor de passwords (1Password, Bitwarden, etc.)"
    echo "  3. Considera usar variables de entorno en CI/CD"
    echo "  4. NUNCA subas el keystore a git"
    echo ""

    print_message "Próximos pasos:"
    echo "  1. Edita mobile-app/android/gradle.properties"
    echo "  2. Descomenta las líneas de AWAKENING_RELEASE_*"
    echo "  3. Ejecuta: npm run build:android"
    echo ""

    print_success "¡Listo! Ya puedes firmar tus APKs de producción"

else
    print_error "Error al generar el keystore"
    exit 1
fi

echo ""
