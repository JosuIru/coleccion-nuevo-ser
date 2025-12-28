# Arquitectura: FrankensteinEventCoordinator

## Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────────┐
│                    FrankensteinLabUI                        │
│                   (Clase Principal)                         │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    │ Referencias
                    ▼
┌─────────────────────────────────────────────────────────────┐
│           FrankensteinEventCoordinator                      │
│                 (Coordinador Central)                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Constructor(labUIRef, domCache)                           │
│    ├── this.labUI       → Referencia a clase principal    │
│    ├── this.dom         → Cache de elementos DOM           │
│    ├── this.listeners   → Array de tracking                │
│    └── this.abortController → Cleanup automático           │
│                                                             │
│  attachAll()                                               │
│    ├── _attachFilterPills()    → Filtros de piezas        │
│    ├── _attachActionButtons()  → Botones de acción        │
│    ├── _attachHeaderButtons()  → Header y menú            │
│    ├── _attachModalListeners() → Sistema de modales       │
│    └── _attachFABListeners()   → FABs flotantes           │
│                                                             │
│  Navegación                                                │
│    ├── toggleSideMenu()                                    │
│    ├── openSideMenu()                                      │
│    ├── closeSideMenu()                                     │
│    └── handleMenuNavigation(section)                       │
│                                                             │
│  UI Updates                                                │
│    └── updateMenuBadges()                                  │
│                                                             │
│  Cleanup                                                   │
│    └── destroy()                                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                    │
                    │ Coordina
                    ▼
┌─────────────────────────────────────────────────────────────┐
│                    Event Listeners                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  DOM Events                                                │
│    ├── Click → Botones, Pills, FABs                       │
│    ├── Input → Búsqueda de piezas                         │
│    ├── Scroll → Sticky headers                            │
│    └── Touch → Bottom sheet gestures                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                    │
                    │ Delega a
                    ▼
┌─────────────────────────────────────────────────────────────┐
│                   Módulos Dependientes                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  FrankensteinBottomSheet                                   │
│    └── Gestos del bottom sheet                            │
│                                                             │
│  FrankensteinModals                                        │
│    ├── Modal de misiones                                   │
│    ├── Modal de requisitos                                 │
│    └── Modal de piezas                                     │
│                                                             │
│  FrankensteinLabUI (métodos delegados)                     │
│    ├── toggleRequirements()                                │
│    ├── searchPieces()                                      │
│    ├── filterCompatiblePieces()                            │
│    ├── populatePiecesGrid()                                │
│    ├── clearSelection()                                    │
│    ├── exportBeingAsPrompt()                               │
│    ├── validateBeing()                                     │
│    ├── talkToBeing()                                       │
│    ├── createMicroSociety()                                │
│    ├── openMicrosocietiesSimulator()                       │
│    ├── showSavedBeingsModal()                              │
│    ├── generateMiniChallenge()                             │
│    ├── hideVitruvianPopup()                                │
│    ├── handlePiecesModalScroll()                           │
│    ├── initContextualTooltips()                            │
│    ├── showMiniTutorial()                                  │
│    └── restoreLabState()                                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Flujo de Eventos

```
┌──────────────┐
│  User Click  │
└──────┬───────┘
       │
       ▼
┌────────────────────────┐
│  DOM Event Listener    │
│  (con AbortController) │
└──────┬─────────────────┘
       │
       ▼
┌────────────────────────────┐
│  Event Handler             │
│  - preventDefault()        │
│  - stopPropagation()       │
└──────┬─────────────────────┘
       │
       ▼
┌────────────────────────────┐
│  Delega a método del       │
│  FrankensteinLabUI         │
└──────┬─────────────────────┘
       │
       ▼
┌────────────────────────────┐
│  Ejecuta lógica de negocio │
└────────────────────────────┘
```

## Navegación del Menú

```
┌────────────────────┐
│  User Click Item   │
│  del Menú Lateral  │
└─────────┬──────────┘
          │
          ▼
┌────────────────────────┐
│  handleMenuNavigation  │
│  (section)             │
└─────────┬──────────────┘
          │
          ▼
     ┌────┴────┐
     │ Switch  │
     └────┬────┘
          │
    ┌─────┴──────────────────────────────┐
    │                                    │
    ▼                                    ▼
'seres'                          'microsociedades'
showSavedBeingsModal()          openMicrosocietiesSimulator()
    │                                    │
    ▼                                    ▼
'retos'                              'ajustes'
frankensteinChallengesModal      frankensteinSettings.open()
    │                                    │
    ▼                                    ▼
'estadisticas'                        'ayuda'
frankensteinStats.open()            showHelpModal()
    │                                    │
    ▼                                    ▼
'salir'                             'laboratorio'
organism.hide()                    (ya estamos aquí)
```

## Sistema de Cleanup

```
┌─────────────────────┐
│  AbortController    │
│  Creado en          │
│  constructor()      │
└──────┬──────────────┘
       │
       ▼
┌────────────────────────────┐
│  Cada addEventListener()   │
│  recibe signal:            │
│  abortController.signal    │
└──────┬─────────────────────┘
       │
       │ (múltiples listeners)
       │
       ▼
┌────────────────────────────┐
│  destroy() es llamado      │
└──────┬─────────────────────┘
       │
       ▼
┌────────────────────────────┐
│  abortController.abort()   │
│  → Todos los listeners     │
│     son removidos          │
│     automáticamente        │
└────────────────────────────┘
```

## Helpers de Event Listeners

```
┌─────────────────────────────────────────┐
│  _addEventListener(element, event,      │
│                     handler, options)   │
├─────────────────────────────────────────┤
│  1. Agrega signal del AbortController   │
│  2. Registra en array listeners         │
│  3. Llama a element.addEventListener()  │
└────────────┬────────────────────────────┘
             │
             │ usado por
             ▼
┌─────────────────────────────────────────┐
│  _addEventListenerById(id, event,       │
│                        handler, options)│
├─────────────────────────────────────────┤
│  1. Busca elemento por ID               │
│  2. Si existe, llama _addEventListener  │
└─────────────────────────────────────────┘
```

## Categorías de Listeners

```
attachAll()
│
├── Prevención de Interferencias
│   └── laboratory → mousedown, mouseup, click
│
├── Bottom Sheet
│   ├── bottomSheet.init() (delegado)
│   └── bottom-sheet-header-click → click
│
├── Filtros y Búsqueda
│   ├── .filter-pill → click (múltiples)
│   ├── pieces-search → input
│   └── toggle-requirements → click
│
├── Botones de Acción
│   ├── btn-clear-selection → click
│   ├── btn-export-being → click
│   ├── btn-validate-being → click
│   ├── btn-talk-to-being → click
│   ├── btn-create-microsociety-card → click
│   ├── btn-open-microsociety-card → click
│   └── btn-change-mission → click
│
├── Header y Menú
│   ├── btn-menu-hamburger → click
│   ├── lab-menu-overlay → click
│   ├── .lab-menu-item → click (múltiples)
│   ├── btn-saved-beings → click
│   ├── btn-stats → click
│   ├── btn-settings → click
│   └── btn-close-lab → click
│
├── Modales
│   ├── Mission Modal
│   │   ├── mission-modal-close → click
│   │   ├── mission-modal-overlay → click
│   │   └── modal-open-pieces → click
│   ├── Requirements Modal
│   │   ├── requirements-modal-close → click
│   │   └── requirements-modal-overlay → click
│   └── Pieces Modal
│       ├── pieces-modal-close → click
│       ├── pieces-modal-overlay → click
│       ├── pieces-open-requirements → click
│       └── .pieces-modal-body → scroll
│
├── FABs
│   ├── fab-requirements → click
│   └── fab-pieces → click
│
└── Otros
    ├── mini-challenge-refresh → click
    └── vitruvian-popup-close → click
```

## Integración con Otros Módulos

```
FrankensteinEventCoordinator
│
├── Usa
│   ├── FrankensteinBottomSheet.init()
│   └── FrankensteinModals (implícito)
│
├── Invoca métodos de FrankensteinLabUI
│   ├── toggleBottomSheet()
│   ├── toggleRequirements()
│   ├── searchPieces()
│   ├── filterCompatiblePieces()
│   ├── populatePiecesGrid()
│   ├── clearSelection()
│   ├── exportBeingAsPrompt()
│   ├── validateBeing()
│   ├── talkToBeing()
│   ├── createMicroSociety()
│   ├── openMicrosocietiesSimulator()
│   ├── openMissionModal()
│   ├── closeMissionModal()
│   ├── closeRequirementsModal()
│   ├── openPiecesModal()
│   ├── closePiecesModal()
│   ├── openRequirementsModal()
│   ├── showSavedBeingsModal()
│   ├── generateMiniChallenge()
│   ├── hideVitruvianPopup()
│   ├── handlePiecesModalScroll()
│   ├── initContextualTooltips()
│   ├── showMiniTutorial()
│   ├── restoreLabState()
│   ├── showNotification()
│   ├── showHelpModal()
│   └── loadBeings()
│
└── Interactúa con sistemas globales
    ├── window.frankensteinStats
    ├── window.frankensteinSettings
    ├── window.frankensteinChallengesModal
    ├── window.microsocietiesInit
    └── window.microsocietiesGallery
```

## Patrones de Diseño

### 1. Coordinador (Coordinator Pattern)
- Centraliza la gestión de eventos
- Reduce acoplamiento entre componentes
- Facilita testing y mantenimiento

### 2. Delegación (Delegation Pattern)
- EventCoordinator delega a FrankensteinLabUI
- Separación de responsabilidades
- Single Responsibility Principle

### 3. Template Method
- `attachAll()` orquesta llamadas a helpers privados
- Flujo de inicialización estandarizado
- Extensible para nuevas categorías

### 4. Facade
- API pública simplificada
- Oculta complejidad de event handling
- Interfaz clara y consistente

## Ventajas Arquitectónicas

### Separación de Responsabilidades
```
EventCoordinator → Gestión de eventos
LabUI            → Lógica de negocio
Modals           → Sistema de modales
BottomSheet      → Gestos táctiles
```

### Testabilidad
```
EventCoordinator puede ser testeado aisladamente
├── Mock de FrankensteinLabUI
├── Mock de DOM elements
└── Verificar llamadas a métodos
```

### Mantenibilidad
```
Cambios en event listeners
└── Solo modificar EventCoordinator
    └── No afecta lógica de negocio
```

### Performance
```
AbortController
├── Cleanup automático
├── Sin memory leaks
└── Mejor rendimiento
```

## Métricas de Complejidad

```
Complejidad Ciclomática: ~15 (handleMenuNavigation)
Acoplamiento: BAJO (solo 2 módulos directos)
Cohesión: ALTA (single purpose)
Líneas de código: 642
Funciones públicas: 6
Funciones privadas: 6
Event listeners: ~50+
```

## Evolución Futura

### Posibles Mejoras

1. **Event Bus**
   ```
   EventCoordinator podría emitir eventos
   └── Otros módulos se suscriben
       └── Comunicación desacoplada
   ```

2. **Keyboard Shortcuts**
   ```
   Agregar soporte para teclado
   ├── Ctrl+S → Guardar ser
   ├── Ctrl+M → Abrir misiones
   └── Esc → Cerrar modales
   ```

3. **Telemetría**
   ```
   Tracking de eventos de usuario
   ├── Analytics
   ├── UX insights
   └── A/B testing
   ```

4. **Gestos Avanzados**
   ```
   Más allá de click/scroll
   ├── Swipe
   ├── Pinch to zoom
   └── Long press
   ```

---

**Versión:** v2.9.201
**Fecha:** 2025-12-28
**Autor:** J. Irurtzun & Claude Sonnet 4.5
