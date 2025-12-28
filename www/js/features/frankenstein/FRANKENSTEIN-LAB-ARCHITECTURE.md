# Frankenstein Lab - Arquitectura v2.9.201

## Descripción General

El Frankenstein Lab es un sistema modular de construcción de "seres" a partir de piezas de conocimiento (capítulos, ejercicios, recursos) que valida si cumplen con misiones específicas. Ha sido completamente refactorizado de un monolito de 7469 líneas a una arquitectura modular de 22 módulos independientes.

## Arquitectura de 4 Capas

```
┌─────────────────────────────────────────────────────────────┐
│                    CAPA 4: ORQUESTACIÓN                     │
│                                                             │
│  frankenstein-lab.js (985 líneas)                          │
│  - Ciclo de vida completo (init/destroy)                   │
│  - Coordinación de 22 módulos                              │
│  - DOM cache (50+ elementos)                               │
│  - Memory management (timers/intervals/listeners)          │
│  - Backward compatibility                                  │
└─────────────────────────────────────────────────────────────┘
                            ▲
                            │
┌─────────────────────────────────────────────────────────────┐
│                   CAPA 3: CORE LOGIC                        │
│                     (10 módulos)                            │
│                                                             │
│  ┌──────────────────┐  ┌──────────────────┐               │
│  │ Mission          │  │ Being            │               │
│  │ Validator        │  │ Builder          │               │
│  └──────────────────┘  └──────────────────┘               │
│                                                             │
│  ┌──────────────────┐  ┌──────────────────┐               │
│  │ Being            │  │ Micro            │               │
│  │ Storage          │  │ Society          │               │
│  └──────────────────┘  └──────────────────┘               │
│                                                             │
│  ┌──────────────────┐  ┌──────────────────┐               │
│  │ Mini             │  │ Rewards          │               │
│  │ Challenges       │  │ System           │               │
│  └──────────────────┘  └──────────────────┘               │
│                                                             │
│  ┌──────────────────┐  ┌──────────────────┐               │
│  │ Search           │  │ Validation       │               │
│  │ Filter           │  │ Export           │               │
│  └──────────────────┘  └──────────────────┘               │
│                                                             │
│  ┌──────────────────┐  ┌──────────────────┐               │
│  │ Demo             │  │ Experiment       │               │
│  │ Scenarios        │  │ Log              │               │
│  └──────────────────┘  └──────────────────┘               │
└─────────────────────────────────────────────────────────────┘
                            ▲
                            │
┌─────────────────────────────────────────────────────────────┐
│                   CAPA 2: UI COMPONENTS                     │
│                      (7 módulos)                            │
│                                                             │
│  ┌──────────────────┐  ┌──────────────────┐               │
│  │ Tooltips         │  │ Avatar           │               │
│  │                  │  │ Generator        │               │
│  └──────────────────┘  └──────────────────┘               │
│                                                             │
│  ┌──────────────────┐  ┌──────────────────┐               │
│  │ Vitruvian        │  │ Modals           │               │
│  │ Display          │  │ System           │               │
│  └──────────────────┘  └──────────────────┘               │
│                                                             │
│  ┌──────────────────┐  ┌──────────────────┐               │
│  │ Piece            │  │ Bottom           │               │
│  │ Cards            │  │ Sheet            │               │
│  └──────────────────┘  └──────────────────┘               │
│                                                             │
│  ┌──────────────────┐                                      │
│  │ Tutorial         │                                      │
│  │                  │                                      │
│  └──────────────────┘                                      │
└─────────────────────────────────────────────────────────────┘
                            ▲
                            │
┌─────────────────────────────────────────────────────────────┐
│           CAPA 1: DATA + UTILS + ANIMATIONS                 │
│                      (5 módulos)                            │
│                                                             │
│  DATA:                                                      │
│  ┌──────────────────┐  ┌──────────────────┐               │
│  │ Mission          │  │ Piece            │               │
│  │ Data             │  │ Catalog          │               │
│  └──────────────────┘  └──────────────────┘               │
│                                                             │
│  ┌──────────────────┐                                      │
│  │ Being            │                                      │
│  │ Templates        │                                      │
│  └──────────────────┘                                      │
│                                                             │
│  UTILS:                                                     │
│  ┌──────────────────┐  ┌──────────────────┐               │
│  │ Background       │  │ Drag Drop        │               │
│  │ Rotator          │  │ Handler          │               │
│  └──────────────────┘  └──────────────────┘               │
│                                                             │
│  ANIMATIONS:                                                │
│  ┌──────────────────┐                                      │
│  │ Confetti         │                                      │
│  │ Effects          │                                      │
│  └──────────────────┘                                      │
└─────────────────────────────────────────────────────────────┘
```

## Módulos Detallados

### CAPA 1: Fundamentos

#### Data Modules (3)

1. **FrankensteinMissionData** (`data/frankenstein-mission-data.js`)
   - Catálogo completo de misiones disponibles
   - Requisitos y criterios de validación
   - Metadatos de dificultad y recompensas

2. **FrankensteinPieceCatalog** (`data/frankenstein-piece-catalog.js`)
   - Catálogo de todas las piezas disponibles
   - Clasificación por tipo (chapter, exercise, resource)
   - Atributos y poder de cada pieza

3. **FrankensteinBeingTemplates** (`data/frankenstein-being-templates.js`)
   - Plantillas predefinidas de seres
   - Configuraciones recomendadas
   - Ejemplos para tutorial/demo

#### Utils & Animations (2)

4. **BackgroundRotator** (`utils/frankenstein-background-rotator.js`)
   - Rotación automática de fondos vintage
   - 9 fondos científicos históricos
   - Transiciones suaves con preload

5. **ConfettiEffects** (`animations/frankenstein-confetti-effects.js`)
   - Efectos de celebración visual
   - Canvas-based particle system
   - Triggered en completado de misiones

### CAPA 2: UI Components

6. **FrankensteinTooltips** (`ui/frankenstein-tooltips.js`)
   - Tooltips contextuales
   - Posicionamiento inteligente
   - Touch & mouse support
   - EventManager integration

7. **FrankensteinAvatarGenerator** (`ui/frankenstein-avatar-generator.js`)
   - Generación procedimental de avatares
   - Basado en atributos del ser
   - SVG rendering

8. **FrankensteinVitruvianDisplay** (`ui/frankenstein-vitruvian-display.js`)
   - Visualización estilo Hombre de Vitrubio
   - Slots anatómicos para piezas
   - Drag & drop integration

9. **FrankensteinModals** (`ui/frankenstein-modals.js`)
   - Sistema completo de modales
   - Mission modal, Requirements modal, Pieces modal
   - EventManager cleanup
   - ~600 líneas

10. **FrankensteinPieceCards** (`ui/frankenstein-piece-cards.js`)
    - Renderizado de cartas de piezas
    - Estados: disponible, seleccionada, compatible
    - Animaciones y transiciones

11. **FrankensteinBottomSheet** (`ui/frankenstein-bottom-sheet.js`)
    - Sheet móvil para piezas
    - Gestos de arrastre
    - Filtrado y búsqueda
    - ~400 líneas

12. **FrankensteinTutorial** (`ui/frankenstein-tutorial.js`)
    - Sistema de onboarding
    - Guía paso a paso
    - Highlights interactivos

13. **FrankensteinDragDropHandler** (`utils/frankenstein-drag-drop-handler.js`)
    - Lógica de drag & drop
    - Compatibilidad de slots
    - Animaciones de drop

### CAPA 3: Core Logic

14. **FrankensteinMissionValidator** (`core/frankenstein-mission-validator.js`)
    - Validación de requisitos de misión
    - Cálculo de progreso
    - Generación de feedback

15. **FrankensteinBeingBuilder** (`core/frankenstein-being-builder.js`)
    - Construcción del ser actual
    - Toggle de piezas seleccionadas
    - Cálculo de atributos y poder
    - Actualización de displays

16. **FrankensteinBeingStorage** (`core/frankenstein-being-storage.js`)
    - Persistencia de seres creados
    - LocalStorage management
    - Exportación/importación

17. **FrankensteinMicroSociety** (`core/frankenstein-micro-society.js`)
    - Simulación de micro-sociedad
    - Eventos de interacción
    - Métricas de cohesión/resiliencia

18. **FrankensteinMiniChallenges** (`core/frankenstein-mini-challenges.js`)
    - Desafíos rápidos aleatorios
    - Recompensas inmediatas
    - Tracking de historial

19. **FrankensteinRewardsSystem** (`core/frankenstein-rewards-system.js`)
    - Sistema de recompensas y logros
    - Unlockables
    - Progression tracking

20. **FrankensteinSearchFilter** (`core/frankenstein-search-filter.js`)
    - Búsqueda de piezas por texto
    - Filtrado por tipo/atributos
    - Filtro de compatibilidad con misión

21. **FrankensteinValidationExport** (`core/frankenstein-validation-export.js`)
    - Exportación de seres validados
    - Formatos: JSON, Markdown, PDF
    - Share functionality

22. **FrankensteinDemoScenarios** (`core/frankenstein-demo-scenarios.js`)
    - Escenarios predefinidos de demo
    - Datos de prueba
    - Modo sandbox

23. **FrankensteinExperimentLog** (`core/frankenstein-experiment-log.js`)
    - Registro de experimentos
    - Historial de construcciones
    - Analytics

### CAPA 4: Orquestación

24. **FrankensteinLabUI** (`frankenstein-lab.js`)
    - Módulo orquestador principal
    - Inicializa y coordina los 22 módulos
    - Gestión de ciclo de vida completo
    - DOM cache optimization
    - Memory management
    - Backward compatibility con API legacy

## Flujo de Inicialización

```javascript
// 1. Constructor
const lab = new FrankensteinLabUI(organismKnowledge);

// 2. Inicialización
await lab.init();
  ├─ Verificar si ya inicializado
  ├─ Inicializar FrankensteinMissions (legacy global)
  ├─ Inicializar FrankensteinAvatarSystem (legacy global)
  ├─ Cargar piezas disponibles
  ├─ Inicializar módulos UI
  │   ├─ FrankensteinBottomSheet
  │   └─ FrankensteinModals
  ├─ Crear UI
  │   ├─ Si labStarted: createLabUI()
  │   └─ Si primera vez: createStartScreen()
  ├─ Cargar datos demo (si modo demo)
  └─ Cargar experiment log

// 3. Uso normal del laboratorio
// ... interacción del usuario ...

// 4. Cleanup
lab.destroy();
  ├─ Limpiar timers (setTimeout/setInterval)
  ├─ Limpiar event listeners
  ├─ Destruir módulos
  │   ├─ FrankensteinModals.destroy()
  │   └─ FrankensteinBottomSheet.destroy()
  ├─ Limpiar DOM
  ├─ Resetear estado
  └─ Marcar como no inicializado
```

## DOM Cache (50+ elementos)

El orquestador mantiene un cache de 50+ elementos DOM para optimización:

```javascript
this.domCache = {
  // Contenedores principales (3)
  organismContainer, piecesGrid, missionsGrid,

  // Modales (4)
  missionModal, requirementsModal, piecesModal, vitruvianPopup,

  // Botones de acción (3)
  btnExportBeing, btnValidateBeing, btnTalkToBeing,

  // FABs (4)
  fabRequirements, fabPieces, fabRequirementsBadge, fabPiecesBadge,

  // Info del ser (9)
  beingName, beingMission, beingPower, beingPieces, beingStatus,
  beingAvatar, beingAttributes, beingBalance, beingComponentsList,

  // Requisitos (6)
  requirementsChecklist, currentMissionName, currentPower,
  requiredPower, progressFill, progressText,

  // Mini-vista requisitos (4)
  progressFillMini, progressLabelMini, requirementsListMini,
  requirementsSummaryLabel,

  // Sticky header (3)
  stickyRequirementsHeader, stickyProgressFill, stickyProgressText,

  // Quick view (3)
  quickViewList, quickViewStatus, quickView,

  // Piezas seleccionadas (2)
  piecesSelectedCount, piecesSelectedPower,

  // Vitruvian (4)
  vitruvianHud, vitruvianEnergyBadge, vitruvianSlotLegend,
  vitruvianBeingContainer,

  // Modal de misión (6)
  modalMissionName, modalMissionDescription, modalMissionDifficulty,
  modalMissionPower, modalMissionProgress, modalMissionHints,

  // Progress ring (5)
  missionProgressRing, missionProgressPercent, missionProgressStatus,
  missionProgressFillRing, missionProgressHint,

  // Mini challenge (2)
  miniChallengeBody, miniChallengeTitle,

  // Validación (1)
  validationResults,

  // Experiment log (2)
  experimentLogList, experimentLogMeta,

  // Bottom sheet (2)
  piecesBottomSheet, bottomSheetHandle,

  // Menú (1)
  labSideMenu,

  // Otros (2)
  piecesSearch, biblioteca
}
```

## Memory Management (v2.9.186)

El orquestador implementa tracking automático de recursos para evitar memory leaks:

### Timers & Intervals

```javascript
// Wrappers con auto-tracking
this._setTimeout(callback, delay);
this._setInterval(callback, delay);
this._clearInterval(intervalId);

// Cleanup automático en destroy()
this.timers.forEach(timerId => clearTimeout(timerId));
this.intervals.forEach(intervalId => clearInterval(intervalId));
```

### Event Listeners

```javascript
// Wrapper con auto-tracking
this._addEventListener(target, event, handler, options);

// Cleanup automático en destroy()
this.eventListeners.forEach(({ target, event, handler, options }) => {
  target.removeEventListener(event, handler, options);
});
```

## Backward Compatibility

El orquestador mantiene 100% backward compatibility con el API original:

1. **Export global**: `window.FrankensteinLabUI`
2. **Constructor signature**: `new FrankensteinLabUI(organismKnowledge)`
3. **Public API**: `init()`, `destroy()`, `updateActionButtons()`
4. **Property access**: Todas las propiedades legacy accesibles

## Estado Actual vs. Objetivo Final

### ✅ Completado (22 módulos)

- ✅ CAPA 1: Data (3/3)
- ✅ CAPA 1: Utils & Animations (2/2)
- ✅ CAPA 2: UI Components (8/8)
- ✅ CAPA 3: Core Logic (10/10)
- ✅ CAPA 4: Orquestador principal

### 🚧 Pendiente de Extracción

Código legacy que aún vive en `frankenstein-ui.js` (~6500 líneas):

1. **FrankensteinUIRenderer** (~1500 líneas)
   - `createStartScreen()`
   - `createLabUI()`
   - `renderMissionsGrid()`
   - `renderPiecesGrid()`
   - `updateBeingDisplay()`

2. **FrankensteinEventCoordinator** (~800 líneas)
   - `attachEventListeners()`
   - Event handlers para clicks, drag&drop, gestures
   - Keyboard shortcuts

3. **Legacy integrations** (~500 líneas)
   - `loadAvailablePieces()`
   - Integraciones con FrankensteinMissions global
   - Integraciones con FrankensteinAvatarSystem global

### Migración Gradual

El plan de migración es gradual:

1. ✅ **Fase 1-3**: Extraer 22 módulos (COMPLETADO)
2. ✅ **Fase 4**: Crear orquestador principal (COMPLETADO)
3. 🚧 **Fase 5**: Extraer UIRenderer
4. 🚧 **Fase 6**: Extraer EventCoordinator
5. 🚧 **Fase 7**: Deprecar `frankenstein-ui.js` original
6. 🚧 **Fase 8**: Migrar todos los imports a `frankenstein-lab.js`

## Uso del Orquestador

### Import ES6

```javascript
import FrankensteinLabUI from './features/frankenstein/frankenstein-lab.js';

const lab = new FrankensteinLabUI(organismKnowledge);
await lab.init();
```

### Global Legacy

```html
<script src="frankenstein/frankenstein-lab.js" type="module"></script>
<script>
  const lab = new window.FrankensteinLabUI(organismKnowledge);
  lab.init();
</script>
```

## Métricas

| Métrica | Valor |
|---------|-------|
| **Total módulos** | 22 módulos + 1 orquestador |
| **Líneas totales** | ~8000 líneas (vs. 7469 monolito) |
| **Líneas orquestador** | 985 líneas |
| **Línea promedio/módulo** | ~300 líneas |
| **DOM cache elements** | 50+ elementos |
| **Memory tracking** | Timers, Intervals, Listeners |
| **Backward compatibility** | 100% |

## Beneficios de la Arquitectura

1. **Modularidad**: Cada módulo tiene una responsabilidad única y clara
2. **Testabilidad**: Cada módulo puede testearse aisladamente
3. **Mantenibilidad**: Cambios localizados, fácil navegación
4. **Escalabilidad**: Fácil agregar nuevos módulos sin afectar existentes
5. **Performance**: DOM cache y memory management optimizados
6. **Developer Experience**: Documentación JSDoc completa
7. **Backward Compatibility**: No rompe código existente

## Siguiente Pasos

1. Extraer `FrankensteinUIRenderer` del código legacy
2. Extraer `FrankensteinEventCoordinator` del código legacy
3. Implementar métodos placeholder en orquestador
4. Agregar tests unitarios para orquestador
5. Documentar API pública completa
6. Crear guía de migración para desarrolladores
