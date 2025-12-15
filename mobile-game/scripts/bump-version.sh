#!/bin/bash

###############################################################################
# AWAKENING PROTOCOL - VERSION BUMPER
# Incrementa versión, actualiza package.json y crea tag de git
###############################################################################

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

print_message() { echo -e "${BLUE}[VERSION]${NC} $1"; }
print_success() { echo -e "${GREEN}[✓]${NC} $1"; }
print_error() { echo -e "${RED}[✗]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[!]${NC} $1"; }

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   AWAKENING PROTOCOL - VERSION BUMPER              ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════╝${NC}"
echo ""

# Directorio del proyecto
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")/mobile-app"

cd "$PROJECT_DIR"

# Verificar que estamos en un repo git
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    print_error "No estás en un repositorio git"
    exit 1
fi

# Verificar que no hay cambios sin commitear
if ! git diff-index --quiet HEAD --; then
    print_warning "Hay cambios sin commitear"
    read -p "¿Continuar de todas formas? (s/N): " CONTINUE
    if [ "$CONTINUE" != "s" ] && [ "$CONTINUE" != "S" ]; then
        exit 1
    fi
fi

# Obtener versión actual
CURRENT_VERSION=$(node -p "require('./package.json').version")
print_message "Versión actual: $CURRENT_VERSION"

# Parsear versión semántica
IFS='.' read -r -a VERSION_PARTS <<< "$CURRENT_VERSION"
MAJOR="${VERSION_PARTS[0]}"
MINOR="${VERSION_PARTS[1]}"
PATCH="${VERSION_PARTS[2]}"

echo ""
echo "Tipo de incremento:"
echo "  1) Patch (bug fixes)        $CURRENT_VERSION → $MAJOR.$MINOR.$((PATCH + 1))"
echo "  2) Minor (new features)     $CURRENT_VERSION → $MAJOR.$((MINOR + 1)).0"
echo "  3) Major (breaking changes) $CURRENT_VERSION → $((MAJOR + 1)).0.0"
echo "  4) Custom version"
echo ""

read -p "Selecciona (1-4): " BUMP_TYPE

case $BUMP_TYPE in
    1)
        NEW_VERSION="$MAJOR.$MINOR.$((PATCH + 1))"
        VERSION_TYPE="patch"
        ;;
    2)
        NEW_VERSION="$MAJOR.$((MINOR + 1)).0"
        VERSION_TYPE="minor"
        ;;
    3)
        NEW_VERSION="$((MAJOR + 1)).0.0"
        VERSION_TYPE="major"
        ;;
    4)
        read -p "Ingresa nueva versión (formato: X.Y.Z): " NEW_VERSION
        VERSION_TYPE="custom"

        # Validar formato
        if ! [[ $NEW_VERSION =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
            print_error "Formato de versión inválido. Debe ser X.Y.Z"
            exit 1
        fi
        ;;
    *)
        print_error "Opción inválida"
        exit 1
        ;;
esac

echo ""
print_message "Nueva versión: $CURRENT_VERSION → $NEW_VERSION"
echo ""

# Solicitar changelog
echo "Describe los cambios de esta versión:"
echo "(Presiona Ctrl+D cuando termines)"
echo ""

CHANGELOG_ENTRIES=""
while IFS= read -r line; do
    if [ -n "$line" ]; then
        CHANGELOG_ENTRIES="${CHANGELOG_ENTRIES}- ${line}\n"
    fi
done

if [ -z "$CHANGELOG_ENTRIES" ]; then
    CHANGELOG_ENTRIES="- Version bump to $NEW_VERSION\n"
fi

echo ""
read -p "¿Confirmar actualización de versión? (s/N): " CONFIRM
if [ "$CONFIRM" != "s" ] && [ "$CONFIRM" != "S" ]; then
    print_message "Operación cancelada"
    exit 0
fi

###############################################################################
# ACTUALIZAR ARCHIVOS
###############################################################################

print_message "Actualizando archivos..."

# Actualizar package.json
if command -v jq &> /dev/null; then
    # Usar jq si está disponible
    jq ".version = \"$NEW_VERSION\"" package.json > package.json.tmp
    mv package.json.tmp package.json
else
    # Fallback a sed
    sed -i.bak "s/\"version\": \"$CURRENT_VERSION\"/\"version\": \"$NEW_VERSION\"/" package.json
    rm package.json.bak 2>/dev/null || true
fi

print_success "package.json actualizado"

# Actualizar CHANGELOG.md
CHANGELOG_FILE="$(dirname "$PROJECT_DIR")/CHANGELOG.md"

if [ ! -f "$CHANGELOG_FILE" ]; then
    cat > "$CHANGELOG_FILE" <<EOF
# Changelog

All notable changes to Awakening Protocol will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

EOF
fi

# Crear entrada de changelog
DATE=$(date +"%Y-%m-%d")
TEMP_FILE=$(mktemp)

cat > "$TEMP_FILE" <<EOF
## [$NEW_VERSION] - $DATE

$(echo -e "$CHANGELOG_ENTRIES")

EOF

cat "$CHANGELOG_FILE" >> "$TEMP_FILE"
mv "$TEMP_FILE" "$CHANGELOG_FILE"

print_success "CHANGELOG.md actualizado"

###############################################################################
# GIT COMMIT Y TAG
###############################################################################

print_message "Creando commit y tag de git..."

# Agregar archivos
git add package.json
git add "$CHANGELOG_FILE"

# Crear commit
COMMIT_MESSAGE="chore: bump version to $NEW_VERSION

$(echo -e "$CHANGELOG_ENTRIES")"

git commit -m "$COMMIT_MESSAGE"

# Crear tag
TAG_NAME="v$NEW_VERSION"
git tag -a "$TAG_NAME" -m "Release $NEW_VERSION

$(echo -e "$CHANGELOG_ENTRIES")"

print_success "Commit y tag creados"

###############################################################################
# RESUMEN
###############################################################################

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✓ VERSIÓN ACTUALIZADA EXITOSAMENTE${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${CYAN}Cambios realizados:${NC}"
echo ""
echo "  📦 Versión:      $CURRENT_VERSION → $NEW_VERSION"
echo "  📝 Commit:       $(git log -1 --format=%h)"
echo "  🏷️  Tag:          $TAG_NAME"
echo ""
echo -e "${CYAN}Archivos modificados:${NC}"
echo ""
echo "  • package.json"
echo "  • CHANGELOG.md"
echo ""
echo -e "${CYAN}Próximos pasos:${NC}"
echo ""
echo "  1. Revisa los cambios:"
echo "     git log -1 --stat"
echo ""
echo "  2. Push a remote (incluyendo tags):"
echo "     git push origin main"
echo "     git push origin $TAG_NAME"
echo ""
echo "  3. Crea el build de producción:"
echo "     ./scripts/build-release.sh"
echo ""
echo "  4. Opcionalmente, crea un GitHub Release:"
echo "     gh release create $TAG_NAME --generate-notes"
echo ""

print_success "¡Listo! 🎉"
echo ""
