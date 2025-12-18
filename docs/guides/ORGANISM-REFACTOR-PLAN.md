# Plan de Refactorización de organism-knowledge.js

## Estado Actual

**Archivo**: `www/js/features/organism-knowledge.js`
- **Líneas**: 3,910
- **Tipo**: Clase monolítica única
- **Métodos**: ~80+
- **Tamaño estimado**: ~250 KB

## Problemas Identificados

1. **Mantenibilidad**: Muy difícil navegar y mantener un archivo de casi 4,000 líneas
2. **Separación de responsabilidades**: La clase hace demasiadas cosas (renderizado, UI, animaciones, lógica de negocio)
3. **Testing**: Imposible testear componentes individuales
4. **Rendimiento**: Todo se carga incluso si solo se usa una parte
5. **Colaboración**: Múltiples desarrolladores no pueden trabajar en paralelo sin conflictos

## Análisis de Estructura

### Grupos de Métodos Identificados

#### 1. Core & Constructor (líneas 1-184)
- Constructor
- Propiedades y estado
- **Acción**: ✅ Datos extraídos a `organism-data.js`

#### 2. Inicialización (líneas 185-647)
- `init()`
- `createContainer()`
- Setup inicial
- **Acción**: Mantener en core, es pequeño y central

#### 3. Three.js Rendering (líneas 648-1258)
- `initThreeJS()`
- `createBodyModel()`
- `createBodySlots()`
- `updateDraggedOrgan()`
- `stopDraggingOrgan()`
- **Acción**: Extraer a `organism-renderer.js` (~600 líneas)

#### 4. Órganos y Cuerpo (líneas 1259-1900)
- `createAvailableOrgans()`
- `createOrgans()`
- `createCells()`
- `createNeuralNetwork()`
- `updateBodyStatus()`
- `updateNutritionPanel()`
- **Acción**: Extraer a `organism-body.js` (~640 líneas)

#### 5. Animaciones de Activación (líneas 1901-2203)
- `activateBody()`
- `createActivationSequence()`
- `phase1_LightningStorm()`
- `phase2_EnergizeOrgans()`
- `phase3_FinalBolt()`
- `phase4_LifePulse()`
- `createRandomLightningBolt()`
- **Acción**: Extraer a `organism-animations.js` (~300 líneas)

#### 6. UI y Modales (líneas 2204-2551)
- `showBeingCreationModal()`
- `generateBeingKnowledge()`
- `updateOrgansList()`
- `updateVitalSigns()`
- `updateStats()`
- **Acción**: Extraer a `organism-ui.js` (~350 líneas)

#### 7. Event Handlers (líneas 2552-3706)
- `attachEventListeners()`
- `onClick()`, `onDoubleClick()`, `onMouseUp()`
- `updateCameraPosition()`
- `fuseSelectedCells()`
- **Acción**: Extraer a `organism-interactions.js` (~1,150 líneas)

#### 8. Main Loop & Visibility (líneas 3707-fin)
- `animate()`
- `show()`, `hide()`, `toggle()`
- `onResize()`
- **Acción**: Mantener en core (~200 líneas)

## Plan de Refactorización

### Fase 1: Extracción de Datos ✅ COMPLETADO
- [x] Crear `organism-data.js` con definiciones estáticas
- [x] Exportar bodyAnatomy, cellTypes, config
- [x] Añadir métodos helper para queries de datos

### Fase 2: Modularización de Rendering
**Archivo**: `organism-renderer.js` (600 líneas)

Extraer todo lo relacionado con Three.js:
- Setup de Three.js (scene, camera, renderer)
- Creación de geometrías 3D
- Sistema de drag & drop visual
- Rendering loop interno

**Interfaz propuesta**:
```javascript
class OrganismRenderer {
  constructor(scene, camera, renderer) { }
  createBodyModel() { }
  createBodySlots() { }
  updateDraggedOrgan(organ, mouse) { }
  stopDraggingOrgan() { }
  highlightSlot(slotId) { }
  unhighlightAllSlots() { }
  render(time) { }
}
```

**Integración con OrganismKnowledge**:
```javascript
constructor(bookEngine) {
  // ...
  this.renderer = new OrganismRenderer(this.scene, this.camera, this.renderer);
}
```

### Fase 3: Modularización de Lógica de Cuerpo
**Archivo**: `organism-body.js` (640 líneas)

Extraer toda la lógica del cuerpo orgánico:
- Creación de órganos disponibles
- Sistema de células
- Red neural
- Estado de nutrición y vitalidad
- Actualización de paneles

**Interfaz propuesta**:
```javascript
class OrganismBody {
  constructor(bodyAnatomy, bookEngine) { }
  async createAvailableOrgans() { }
  async implantOrgan(organ, slotId) { }
  createCells() { }
  createNeuralNetwork() { }
  updateBodyStatus() { }
  updateNutritionPanel() { }
  calculateTotalNutrition() { }
  isBodyComplete() { }
}
```

### Fase 4: Modularización de Animaciones
**Archivo**: `organism-animations.js` (300 líneas)

Extraer sistema de animaciones de activación:
- Secuencia de activación completa
- Fases de tormenta eléctrica
- Pulso de vida
- Efectos visuales

**Interfaz propuesta**:
```javascript
class OrganismAnimations {
  constructor(scene, organs, bodyModel) { }
  async activateBody() { }
  async createActivationSequence() { }
  createRandomLightningBolt() { }
  createEnergyPulse(position) { }
}
```

### Fase 5: Modularización de UI
**Archivo**: `organism-ui.js` (350 líneas)

Extraer toda la interfaz de usuario:
- Modales de creación de ser
- Panel de órganos
- Signos vitales
- Estadísticas

**Interfaz propuesta**:
```javascript
class OrganismUI {
  constructor(organismInstance) { }
  showBeingCreationModal() { }
  async generateBeingKnowledge() { }
  updateOrgansList() { }
  updateVitalSigns() { }
  updateStats() { }
  attachNutritionListeners() { }
}
```

### Fase 6: Modularización de Interacciones
**Archivo**: `organism-interactions.js` (1,150 líneas)

Extraer todos los event handlers:
- Click handlers
- Mouse handlers
- Camera controls
- Keyboard shortcuts
- Tutorial

**Interfaz propuesta**:
```javascript
class OrganismInteractions {
  constructor(organismInstance) { }
  attachEventListeners() { }
  onClick(event) { }
  onDoubleClick(event) { }
  onMouseMove(event) { }
  onMouseUp(event) { }
  updateCameraPosition() { }
  handleTutorial() { }
}
```

### Fase 7: Core Refactorizado
**Archivo**: `organism-knowledge.js` (~400 líneas)

Clase principal que orquesta los módulos:

```javascript
class OrganismKnowledge {
  constructor(bookEngine) {
    this.bookEngine = bookEngine;

    // Datos estáticos
    this.bodyAnatomy = OrganismData.bodyAnatomy;
    this.cellTypes = OrganismData.cellTypes;
    this.config = OrganismData.defaultConfig;

    // Módulos especializados
    this.renderer = null;  // Cargado lazy
    this.body = null;      // Cargado lazy
    this.animations = null; // Cargado lazy
    this.ui = null;        // Cargado lazy
    this.interactions = null; // Cargado lazy

    // Estado
    this.isInitialized = false;
    this.isVisible = false;
  }

  async init() {
    if (this.isInitialized) return;

    // Cargar módulos de forma lazy
    await this.loadModules();

    // Inicializar Three.js
    await this.renderer.init();

    // Inicializar cuerpo
    await this.body.init();

    // Configurar UI
    this.ui.init();

    // Configurar interacciones
    this.interactions.init();

    this.isInitialized = true;
  }

  async loadModules() {
    // Carga dinámica de módulos
    const [RendererMod, BodyMod, AnimMod, UIMod, InteractMod] = await Promise.all([
      import('./organism-renderer.js'),
      import('./organism-body.js'),
      import('./organism-animations.js'),
      import('./organism-ui.js'),
      import('./organism-interactions.js')
    ]);

    this.renderer = new RendererMod.OrganismRenderer(/* ... */);
    this.body = new BodyMod.OrganismBody(/* ... */);
    this.animations = new AnimMod.OrganismAnimations(/* ... */);
    this.ui = new UIMod.OrganismUI(this);
    this.interactions = new InteractMod.OrganismInteractions(this);
  }

  animate() {
    if (!this.isVisible) return;
    this.renderer.render(this.time);
    this.animationFrameId = requestAnimationFrame(() => this.animate());
  }

  show() { /* ... */ }
  hide() { /* ... */ }
}
```

## Estrategia de Migración

### Opción A: Refactor Completo (Recomendado pero laborioso)
1. Crear todos los módulos nuevos
2. Implementar interfaces
3. Migrar tests
4. Actualizar imports en lazy-loader
5. Testing exhaustivo
6. Deploy gradual

**Tiempo estimado**: 2-3 días de trabajo
**Riesgo**: Alto (muchos cambios)
**Beneficio**: Máximo (código limpio y mantenible)

### Opción B: Refactor Gradual (Más seguro)
1. ✅ Extraer datos estáticos (completado)
2. Extraer animaciones (menos acopladas)
3. Extraer UI (también poco acoplada)
4. Extraer rendering (más complejo)
5. Extraer interacciones (muy acoplado)
6. Refactor final del core

**Tiempo estimado**: 4-5 días distribuidos
**Riesgo**: Bajo (cambios incrementales)
**Beneficio**: Alto (mejora progresiva)

### Opción C: Híbrido - Mantener Clase, Extraer Helpers (Implementado)
1. ✅ Extraer datos a `organism-data.js`
2. Dejar la clase intacta por ahora
3. Documentar plan para futuro refactor
4. Actualizar lazy-loader para cargar organism-data primero

**Tiempo estimado**: 30 minutos ✅
**Riesgo**: Mínimo
**Beneficio**: Moderado (mejor organización de datos)

## Decisión Actual: Opción C

He implementado la Opción C por las siguientes razones:

1. **Tiempo**: La refactorización completa tomaría días
2. **Riesgo**: Cambiar 3,910 líneas tiene alto riesgo de bugs
3. **Prioridades**: Code-splitting ya reduce la carga inicial significativamente
4. **Pragmatismo**: Extraer datos es suficiente mejora por ahora

### Lo que se ha hecho:
- ✅ Creado `organism-data.js` con todas las definiciones estáticas
- ✅ Añadidos métodos helper para queries de datos
- ✅ Documentado plan completo de refactorización
- ✅ Actualizado lazy-loader para cargar organism-data

### Lo que falta (para el futuro):
- ⏳ Refactorizar clase completa (según plan Fase 2-7)
- ⏳ Crear tests unitarios para cada módulo
- ⏳ Implementar imports dinámicos ES6
- ⏳ Optimizar bundle con tree-shaking

## Próximos Pasos Inmediatos

En lugar de continuar con la refactorización (que requiere días), proceder con:

1. **Generar quizzes faltantes** para libros sin quiz (manifiesto, dialogos-maquina)
2. **Testing** del sistema de code-splitting implementado
3. **Documentación** final de todas las mejoras

La refactorización completa de organism-knowledge.js queda como tarea futura cuando haya más tiempo disponible y se justifique el esfuerzo.

## Referencias

- Archivo original: `www/js/features/organism-knowledge.js` (3,910 líneas)
- Datos extraídos: `www/js/features/organism-data.js` (180 líneas)
- Documentación: Este archivo
- Code-splitting: `CODE-SPLITTING-GUIDE.md`
