# Guía de Integración: Módulo Demo Scenarios

**Fecha:** 2025-12-28
**Módulo:** FrankensteinDemoScenarios
**Versión:** 1.0.0

---

## Paso 1: Verificar Archivos Creados

Confirma que los siguientes archivos estén presentes:

```bash
www/js/features/frankenstein/core/
├── frankenstein-demo-scenarios.js          # ✅ Módulo principal (309 líneas)
├── frankenstein-demo-scenarios.test.js     # ✅ Suite de tests (269 líneas)
└── frankenstein-demo-scenarios.example.js  # ✅ Ejemplos de uso (328 líneas)
```

---

## Paso 2: Importar en FrankensteinUI

### Opción A: Integración Moderna (Recomendada)

Edita `www/js/features/frankenstein-ui.js`:

```javascript
// 1. Añadir import al inicio del archivo
import { FrankensteinDemoScenarios } from './frankenstein/core/frankenstein-demo-scenarios.js';

// 2. En el constructor de FrankensteinUI
constructor() {
  // ... código existente ...

  // Inicializar módulo de escenarios demo
  this.demoScenarios = new FrankensteinDemoScenarios(this, {});

  // ... resto del constructor ...
}
```

### Opción B: Integración Legacy (Compatible)

Si prefieres mantener compatibilidad total sin cambiar código existente:

```javascript
// 1. Añadir import
import { createDemoScenariosLegacyWrapper } from './frankenstein/core/frankenstein-demo-scenarios.js';

// 2. En el constructor de FrankensteinUI
constructor() {
  // ... código existente ...

  // Crear wrapper legacy
  const wrapper = createDemoScenariosLegacyWrapper(this);

  // Asignar métodos legacy
  this.applyDemoScenario = wrapper.applyDemoScenario.bind(wrapper);
  this.renderDemoScenarioCard = wrapper.renderDemoScenarioCard.bind(wrapper);
  this.evaluateScenarioObjective = wrapper.evaluateScenarioObjective.bind(wrapper);
  this.updateDemoScenarioProgress = wrapper.updateDemoScenarioProgress.bind(wrapper);

  // Guardar instancia para acceso directo
  this._demoScenariosInstance = wrapper._instance;

  // ... resto del constructor ...
}
```

---

## Paso 3: Reemplazar Llamadas (Solo Opción A)

Si elegiste la integración moderna, reemplaza las llamadas a métodos antiguos:

### 3.1 Búsqueda de Llamadas

```bash
# Buscar todas las llamadas a métodos antiguos
grep -n "this.applyDemoScenario\|this.renderDemoScenarioCard\|this.evaluateScenarioObjective\|this.updateDemoScenarioProgress" www/js/features/frankenstein-ui.js
```

### 3.2 Reemplazos Necesarios

| Línea | Código Antiguo | Código Nuevo |
|-------|---------------|--------------|
| ~1645 | `this.renderDemoScenarioCard()` | `this.demoScenarios.render()` |
| ~2034 | `this.updateDemoScenarioProgress()` | `this.demoScenarios.updateProgress()` |
| ~2548 | `this.updateDemoScenarioProgress()` | `this.demoScenarios.updateProgress()` |
| ~3243 | `this.updateDemoScenarioProgress()` | `this.demoScenarios.updateProgress()` |
| ~3980 | `this.applyDemoScenario(savedBeing)` | `this.demoScenarios.apply(savedBeing)` |
| ~4950 | (método completo a eliminar) | - |
| ~4974 | (método completo a eliminar) | - |
| ~5022 | (método completo a eliminar) | - |
| ~5066 | (método completo a eliminar) | - |

### 3.3 Script de Reemplazo Automatizado

```bash
# Crear backup primero
cp www/js/features/frankenstein-ui.js www/js/features/frankenstein-ui.js.backup

# Reemplazos
sed -i 's/this\.renderDemoScenarioCard()/this.demoScenarios.render()/g' www/js/features/frankenstein-ui.js
sed -i 's/this\.updateDemoScenarioProgress()/this.demoScenarios.updateProgress()/g' www/js/features/frankenstein-ui.js
sed -i 's/this\.applyDemoScenario(\(.*\))/this.demoScenarios.apply(\1)/g' www/js/features/frankenstein-ui.js
sed -i 's/this\.evaluateScenarioObjective(\(.*\))/this.demoScenarios.evaluate(\1)/g' www/js/features/frankenstein-ui.js
```

---

## Paso 4: Eliminar Código Antiguo (Solo Opción A)

### 4.1 Eliminar Propiedad de Estado

Busca y elimina:
```javascript
this.activeDemoScenario = null;  // Línea ~37
```

El estado ahora se gestiona en `this.demoScenarios.currentScenario`

### 4.2 Eliminar Métodos Antiguos

Elimina las siguientes funciones de `frankenstein-ui.js`:

```javascript
// Líneas 4950-4972
applyDemoScenario(savedBeing) {
  // ... código a eliminar ...
}

// Líneas 4974-5020
renderDemoScenarioCard() {
  // ... código a eliminar ...
}

// Líneas 5022-5064
evaluateScenarioObjective(objective) {
  // ... código a eliminar ...
}

// Líneas 5066-5069
updateDemoScenarioProgress() {
  // ... código a eliminar ...
}
```

### 4.3 Script de Eliminación

```bash
# ADVERTENCIA: Hacer backup primero
# Este script elimina líneas 4950-5069 (120 líneas)

# Opción 1: Manual con editor
# Abrir en VSCode y eliminar líneas 4950-5069

# Opción 2: Con sed
sed -i '4950,5069d' www/js/features/frankenstein-ui.js
```

---

## Paso 5: Actualizar index.html

Añade el script del módulo antes de frankenstein-ui.js:

```html
<!-- FRANKENSTEIN LAB - Módulos Core -->
<script type="module" src="js/features/frankenstein/core/frankenstein-demo-scenarios.js"></script>

<!-- FRANKENSTEIN LAB - UI Principal -->
<script type="module" src="js/features/frankenstein-ui.js"></script>
```

**IMPORTANTE:** El orden es crucial. El módulo debe cargarse antes del UI principal.

---

## Paso 6: Verificar Integración

### 6.1 Test Manual en Consola

Abre las DevTools y ejecuta:

```javascript
// Verificar que el módulo esté cargado
console.log(window.frankensteinUI?.demoScenarios);
// Debe mostrar: FrankensteinDemoScenarios { labUI: {...}, dom: {...}, currentScenario: null }

// Verificar que render funcione
if (window.frankensteinUI?.demoScenarios) {
  window.frankensteinUI.demoScenarios.render();
  console.log('✅ render() ejecutado correctamente');
}

// Verificar que evaluate funcione
const testObjective = {
  type: 'attribute',
  attribute: 'wisdom',
  target: 50,
  label: 'Test Wisdom'
};
const result = window.frankensteinUI?.demoScenarios?.evaluate(testObjective);
console.log('Resultado evaluación:', result);
// Debe mostrar: { fulfilled: boolean, progressText: string, label: string }
```

### 6.2 Test de Escenario Demo

```javascript
// Cargar un ser demo
const demoBeing = {
  id: 'demo-eco-activist-001',
  name: 'Guardián de la Tierra'
};

// Aplicar escenario
window.frankensteinUI?.demoScenarios?.apply(demoBeing);

// Verificar que se cargó
console.log('Escenario activo:', window.frankensteinUI?.demoScenarios?.currentScenario);
// Debe mostrar el escenario con título, intro, objetivos, etc.
```

### 6.3 Ejecutar Suite de Tests

```javascript
// Importar y ejecutar tests
import { runTests } from './js/features/frankenstein/core/frankenstein-demo-scenarios.test.js';
runTests();

// O si está disponible globalmente:
window.runDemoScenariosTests();
```

---

## Paso 7: Testing en Producción

### 7.1 Flujo Completo de Usuario

1. **Abrir Frankenstein Lab**
   ```javascript
   window.frankensteinUI.startLab();
   ```

2. **Activar Modo Demo**
   ```javascript
   window.FrankensteinQuiz.setMode('demo');
   ```

3. **Cargar Ser Demo**
   - Ir a "Seres Guardados"
   - Seleccionar "Guardián de la Tierra" (demo-eco-activist-001)
   - Verificar que aparece el card de "Ruta Eco-Guardiana"

4. **Verificar Objetivos**
   - Debe mostrar objetivos con checkboxes
   - Progreso debe actualizar en tiempo real
   - Tips deben estar visibles

5. **Interactuar con el Ser**
   - Añadir piezas → Verificar que progreso actualiza
   - Cambiar misión → Verificar que objetivo de misión actualiza
   - Validar ser → Verificar que objetivo de validación actualiza

### 7.2 Casos Edge

```javascript
// Test: Cargar ser sin escenario
window.frankensteinUI.demoScenarios.apply(null);
// Debe mostrar mensaje vacío

// Test: Cargar ser normal (no demo) en modo demo
const normalBeing = { id: 'user-001', name: 'Mi Ser' };
window.frankensteinUI.demoScenarios.apply(normalBeing);
// Debe mostrar mensaje vacío

// Test: Cargar ser demo sin modo demo activo
window.FrankensteinQuiz.setMode('normal');
const demoBeing = { id: 'demo-eco-activist-001' };
window.frankensteinUI.demoScenarios.apply(demoBeing);
// Debe cargar el escenario de todas formas (por el prefijo 'demo-')
```

---

## Paso 8: Cleanup (Opcional)

Si todo funciona correctamente, puedes limpiar archivos temporales:

```bash
# Eliminar backup si todo está OK
rm www/js/features/frankenstein-ui.js.backup

# Mover reportes a carpeta de documentación
mkdir -p docs/refactoring-reports
mv EXTRACTION-REPORT-demo-scenarios.md docs/refactoring-reports/
mv VALIDATION-CHECKLIST-demo-scenarios.md docs/refactoring-reports/
mv INTEGRATION-GUIDE-demo-scenarios.md docs/refactoring-reports/
```

---

## Troubleshooting

### Problema 1: "Cannot read property 'render' of undefined"

**Causa:** El módulo no se inicializó correctamente.

**Solución:**
```javascript
// Verificar que el módulo existe
if (!this.demoScenarios) {
  console.error('❌ demoScenarios no inicializado');
  this.demoScenarios = new FrankensteinDemoScenarios(this, {});
}
```

### Problema 2: "FrankensteinDemoData is not defined"

**Causa:** FrankensteinDemoData no está cargado.

**Solución:**
```html
<!-- Asegurar que frankenstein-demo-data.js esté importado -->
<script src="js/features/frankenstein-demo-data.js"></script>
```

### Problema 3: Escenarios no se muestran

**Causa:** Elementos DOM no existen.

**Solución:**
```javascript
// Verificar elementos DOM
const body = document.getElementById('demo-scenario-body');
const title = document.getElementById('demo-scenario-title');

if (!body || !title) {
  console.error('❌ Elementos DOM de escenarios no encontrados');
  // Añadir elementos al HTML
}
```

### Problema 4: Objetivos no actualizan

**Causa:** No se llama a `updateProgress()` en los lugares correctos.

**Solución:**
```javascript
// Verificar que se llama tras cambios de estado
addPiece(piece) {
  // ... lógica ...
  this.demoScenarios.updateProgress();  // ← Importante
}

validateBeing() {
  // ... lógica ...
  this.demoScenarios.updateProgress();  // ← Importante
}

selectMission(mission) {
  // ... lógica ...
  this.demoScenarios.updateProgress();  // ← Importante
}
```

---

## Rollback (Si es Necesario)

Si encuentras problemas críticos, puedes revertir los cambios:

```bash
# Restaurar backup
cp www/js/features/frankenstein-ui.js.backup www/js/features/frankenstein-ui.js

# Remover import del módulo
sed -i '/frankenstein-demo-scenarios/d' www/js/features/frankenstein-ui.js

# Remover script de index.html
# (editar manualmente)
```

---

## Siguientes Pasos

Una vez completada la integración de Demo Scenarios, proceder con:

1. **Módulo de Microsociedades** (`frankenstein-microsociety.js`)
   - Extraer `renderMicrosocietyCard()`
   - Extraer `applyMicroEvent()`
   - Extraer lógica de eventos comunitarios

2. **Módulo de Mini-Desafíos** (`frankenstein-challenges.js`)
   - Extraer `renderMiniChallenge()`
   - Extraer `completeMiniChallenge()`
   - Extraer sistema de recompensas

3. **Módulo de Validación** (`frankenstein-validation.js`)
   - Extraer `validateBeing()`
   - Extraer `checkViability()`
   - Extraer evaluación de requisitos

---

## Checklist de Integración

- [ ] Paso 1: Archivos creados y verificados
- [ ] Paso 2: Import añadido en frankenstein-ui.js
- [ ] Paso 3: Llamadas reemplazadas (Opción A) o wrapper configurado (Opción B)
- [ ] Paso 4: Código antiguo eliminado (solo Opción A)
- [ ] Paso 5: Script añadido en index.html
- [ ] Paso 6: Tests manuales ejecutados y OK
- [ ] Paso 7: Testing en producción completado
- [ ] Paso 8: Cleanup realizado (opcional)
- [ ] Verificación final: No hay errores en consola
- [ ] Verificación final: Escenarios demo funcionan correctamente
- [ ] Verificación final: Objetivos actualizan en tiempo real
- [ ] Verificación final: Backward compatibility OK (si aplica)

---

## Contacto y Soporte

Para preguntas o problemas durante la integración, consultar:
- Reporte de extracción: `EXTRACTION-REPORT-demo-scenarios.md`
- Checklist de validación: `VALIDATION-CHECKLIST-demo-scenarios.md`
- Ejemplos de uso: `frankenstein-demo-scenarios.example.js`
- Suite de tests: `frankenstein-demo-scenarios.test.js`

---

**Fin de la Guía de Integración**
**Versión:** 1.0.0
**Fecha:** 2025-12-28
