#!/bin/bash

# Frankenstein Lab Orchestrator - Verification Script
# Verifica que todos los módulos importados existan

ORCHESTRATOR="www/js/features/frankenstein/frankenstein-lab.js"
BASE_DIR="www/js/features/frankenstein"
PASSED=0
FAILED=0
MISSING=()

echo "🔍 Verificando Frankenstein Lab Orchestrator..."
echo ""
echo "Archivo: $ORCHESTRATOR"
echo "Directorio base: $BASE_DIR"
echo ""

# Extraer todos los imports del orquestador
echo "📦 Verificando imports de módulos..."
echo ""

# Array de módulos esperados
MODULES=(
  # Data
  "data/frankenstein-mission-data.js"
  "data/frankenstein-piece-catalog.js"
  "data/frankenstein-being-templates.js"

  # Utils & Animations
  "utils/frankenstein-background-rotator.js"
  "animations/frankenstein-confetti-effects.js"

  # UI Components
  "ui/frankenstein-tooltips.js"
  "ui/frankenstein-avatar-generator.js"
  "ui/frankenstein-vitruvian-display.js"
  "ui/frankenstein-modals.js"
  "ui/frankenstein-piece-cards.js"
  "ui/frankenstein-bottom-sheet.js"
  "ui/frankenstein-tutorial.js"
  "utils/frankenstein-drag-drop-handler.js"

  # Core Logic
  "core/frankenstein-mission-validator.js"
  "core/frankenstein-being-builder.js"
  "core/frankenstein-being-storage.js"
  "core/frankenstein-micro-society.js"
  "core/frankenstein-mini-challenges.js"
  "core/frankenstein-rewards-system.js"
  "core/frankenstein-search-filter.js"
  "core/frankenstein-validation-export.js"
  "core/frankenstein-demo-scenarios.js"
  "core/frankenstein-experiment-log.js"
)

for module in "${MODULES[@]}"; do
  MODULE_PATH="$BASE_DIR/$module"

  if [ -f "$MODULE_PATH" ]; then
    echo "✅ $module"
    ((PASSED++))
  else
    echo "❌ $module - NO EXISTE"
    MISSING+=("$module")
    ((FAILED++))
  fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 RESULTADOS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Total módulos esperados: ${#MODULES[@]}"
echo "✅ Módulos encontrados:   $PASSED"
echo "❌ Módulos faltantes:     $FAILED"
echo ""

if [ $FAILED -eq 0 ]; then
  echo "🎉 VERIFICACIÓN EXITOSA - Todos los módulos existen"
  echo ""

  # Verificar líneas de código del orquestador
  LINES=$(wc -l < "$ORCHESTRATOR")
  echo "📏 Líneas del orquestador: $LINES"

  # Verificar que tenga JSDoc
  JSDOC_COUNT=$(grep -c "@param\|@returns\|@type" "$ORCHESTRATOR")
  echo "📖 Anotaciones JSDoc: $JSDOC_COUNT"

  # Verificar exports
  echo ""
  echo "📤 Verificando exports..."
  if grep -q "export class FrankensteinLabUI" "$ORCHESTRATOR"; then
    echo "✅ export class FrankensteinLabUI"
  fi
  if grep -q "window.FrankensteinLabUI" "$ORCHESTRATOR"; then
    echo "✅ window.FrankensteinLabUI (backward compatibility)"
  fi
  if grep -q "export default FrankensteinLabUI" "$ORCHESTRATOR"; then
    echo "✅ export default FrankensteinLabUI"
  fi

  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "✅ ORQUESTADOR LISTO PARA USAR"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  exit 0
else
  echo "⚠️  VERIFICACIÓN FALLIDA - Módulos faltantes:"
  echo ""
  for module in "${MISSING[@]}"; do
    echo "   - $module"
  done
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "❌ ORQUESTADOR INCOMPLETO"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  exit 1
fi
