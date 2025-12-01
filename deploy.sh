#!/bin/bash

# ============================================================================
# DEPLOY SCRIPT - Colección Nuevo Ser → gailu.net
# ============================================================================
# Este script sube la aplicación web a gailu.net vía FTP

set -e  # Exit on error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ============================================================================
# CONFIGURACIÓN
# ============================================================================

FTP_HOST="gailu.net"
FTP_USER="tu_usuario_ftp"  # ← CAMBIAR POR TU USUARIO
FTP_PASS="tu_password_ftp"  # ← CAMBIAR POR TU PASSWORD
REMOTE_DIR="/public_html/coleccion"  # ← CAMBIAR SI ES NECESARIO

LOCAL_DIR="./www"
BACKUP_DIR="./backups"

# ============================================================================
# FUNCIONES
# ============================================================================

print_header() {
    echo -e "\n${GREEN}========================================${NC}"
    echo -e "${GREEN}$1${NC}"
    echo -e "${GREEN}========================================${NC}\n"
}

print_info() {
    echo -e "${YELLOW}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_requirements() {
    print_header "Verificando requisitos"

    # Verificar que existe directorio www
    if [ ! -d "$LOCAL_DIR" ]; then
        print_error "No se encuentra el directorio $LOCAL_DIR"
        exit 1
    fi

    # Verificar que existe index.html
    if [ ! -f "$LOCAL_DIR/index.html" ]; then
        print_error "No se encuentra index.html en $LOCAL_DIR"
        exit 1
    fi

    # Verificar lftp (para FTP)
    if ! command -v lftp &> /dev/null; then
        print_info "lftp no está instalado. Instalando..."
        sudo apt-get update
        sudo apt-get install -y lftp
    fi

    print_success "Todos los requisitos están listos"
}

create_backup() {
    print_header "Creando backup local"

    mkdir -p "$BACKUP_DIR"

    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="$BACKUP_DIR/coleccion_backup_$TIMESTAMP.tar.gz"

    print_info "Creando archivo: $BACKUP_FILE"
    tar -czf "$BACKUP_FILE" -C "$LOCAL_DIR" .

    print_success "Backup creado: $BACKUP_FILE"
}

optimize_files() {
    print_header "Optimizando archivos para deploy"

    # Crear directorio temporal
    TEMP_DIR="/tmp/coleccion-deploy"
    rm -rf "$TEMP_DIR"
    mkdir -p "$TEMP_DIR"

    # Copiar archivos
    print_info "Copiando archivos a directorio temporal..."
    cp -r "$LOCAL_DIR"/* "$TEMP_DIR/"

    # Opcional: Minificar HTML/CSS/JS (si tienes las herramientas)
    # print_info "Minificando archivos..."
    # find "$TEMP_DIR" -name "*.html" -exec html-minifier --collapse-whitespace -o {} {} \;

    print_success "Archivos optimizados en $TEMP_DIR"
}

deploy_ftp() {
    print_header "Subiendo archivos a gailu.net vía FTP"

    print_info "Conectando a $FTP_HOST..."

    # Usar lftp para subir archivos
    lftp -u "$FTP_USER,$FTP_PASS" "$FTP_HOST" <<EOF
set ftp:ssl-allow no
set net:timeout 10
set net:max-retries 3

# Crear directorio remoto si no existe
mkdir -p $REMOTE_DIR

# Cambiar al directorio remoto
cd $REMOTE_DIR

# Subir todos los archivos (mirror = sync)
mirror --reverse --delete --verbose $LOCAL_DIR .

# Salir
bye
EOF

    if [ $? -eq 0 ]; then
        print_success "Deploy completado exitosamente!"
    else
        print_error "Error durante el deploy"
        exit 1
    fi
}

verify_deploy() {
    print_header "Verificando deploy"

    URL="https://gailu.net/coleccion/"

    print_info "Verificando acceso a: $URL"

    # Verificar que responde el servidor
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$URL")

    if [ "$HTTP_CODE" = "200" ]; then
        print_success "Deploy verificado - La app está accesible!"
        echo -e "\n${GREEN}🎉 Accede a tu app en:${NC} ${YELLOW}$URL${NC}\n"
    else
        print_error "El servidor respondió con código HTTP: $HTTP_CODE"
        print_info "Verifica la configuración en el servidor"
    fi
}

# ============================================================================
# MAIN SCRIPT
# ============================================================================

main() {
    echo -e "\n${GREEN}"
    echo "╔════════════════════════════════════════╗"
    echo "║    DEPLOY - Colección Nuevo Ser       ║"
    echo "║    gailu.net/coleccion                 ║"
    echo "╚════════════════════════════════════════╝"
    echo -e "${NC}"

    # Verificar credenciales
    if [ "$FTP_USER" = "tu_usuario_ftp" ] || [ "$FTP_PASS" = "tu_password_ftp" ]; then
        print_error "Debes configurar FTP_USER y FTP_PASS en este script"
        print_info "Edita deploy.sh y cambia las credenciales en las líneas 14-15"
        exit 1
    fi

    # Ejecutar pasos
    check_requirements
    create_backup
    # optimize_files  # Opcional, descomenta si quieres optimizar
    deploy_ftp
    verify_deploy

    echo -e "\n${GREEN}✅ DEPLOY COMPLETADO${NC}\n"
}

# Ejecutar
main "$@"
