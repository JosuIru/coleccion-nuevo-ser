# Estado del Refactoring: frankenstein-piece-cards.js

## Completado ✅

### 1. Creación del Módulo
- **Archivo creado**: `www/js/features/frankenstein/ui/frankenstein-piece-cards.js` (~880 líneas)
- **Todas las funciones extraídas**:
  - `populateGrid()` - Poblar grid de piezas
  - `renderTree()` - Renderizar árbol de piezas
  - `organizeByBook()` - Organizar piezas por libro
  - `getChapterTitle()` - Obtener título de capítulo
  - `createBookCardMobile()` - Card de libro móvil
  - `createMobilePieceCard()` - Card de pieza móvil
  - `createBookTree()` - Árbol de libro (desktop)
  - `createChapterTree()` - Árbol de capítulo
  - `createPieceCard()` - Card de pieza (desktop)
  - `getStatsSummaryHtml()` - Resumen de estadísticas
  - `openBookBottomSheet()` - Abrir panel deslizante móvil
  - `closeBookBottomSheet()` - Cerrar panel deslizante
  - `renderMobileBookChapters()` - Renderizar capítulos móviles
  - `setupBookBottomSheetControls()` - Configurar controles móviles
  - `updateMobilePieceActionState()` - Actualizar estado de botón móvil
  - `isPieceSelected()` - Verificar si pieza está seleccionada
  - `calculateChapterPower()` - Calcular poder de capítulo
  - `isMobileViewport()` - Detectar viewport móvil
  - `getTypeLabel()` - Obtener etiqueta de tipo (delegación)

### 2. Import Agregado
- Agregado import en `frankenstein-ui.js` línea 19:
  ```javascript
  import { FrankensteinPieceCards } from './frankenstein/ui/frankenstein-piece-cards.js';
  ```

### 3. Inicialización
- Propiedad agregada en constructor (línea 77):
  ```javascript
  this.pieceCards = null; // Inicializado en init()
  ```
- Inicialización en `init()` (línea 403-405):
  ```javascript
  this.pieceCards = new FrankensteinPieceCards(this, this.domCache, this.missionsSystem);
  logger.debug('✅ FrankensteinPieceCards inicializado');
  ```

## Pendiente ⏳

### 1. Delegación de Métodos en frankenstein-ui.js

Necesario reemplazar las implementaciones en `frankenstein-ui.js` (líneas 2254-3009) con delegaciones:

#### Métodos Principales (CRÍTICO)
```javascript
// Líneas 2254-2282
populatePiecesGrid(filter = 'all') {
  if (!this.pieceCards) {
    console.error('❌ FrankensteinPieceCards not initialized');
    return;
  }
  this.pieceCards.populateGrid(filter);
}

// Líneas 2284-2291
renderPiecesTree(filter = 'all') {
  if (!this.pieceCards) {
    console.error('❌ FrankensteinPieceCards not initialized');
    return;
  }
  this.pieceCards.renderTree(filter);
}
```

#### Métodos Auxiliares (Conservar como Wrappers)
Debido a que algunos métodos son llamados desde otros lugares del código, se recomienda mantenerlos como wrappers que deleguen al módulo:

```javascript
// Líneas 2293-2325
organizePiecesByBook(filter) {
  return this.pieceCards?.organizeByBook(filter) || {};
}

// Líneas 2327-2377
getChapterTitle(piece) {
  return this.pieceCards?.getChapterTitle(piece) || `Capítulo ${piece.chapterId}`;
}

// Líneas 2379-2396
getStatsSummaryHtml(totalPower, totalPieces) {
  return this.pieceCards?.getStatsSummaryHtml(totalPower, totalPieces) || '';
}

// Líneas 2398-2442
createBookCardMobile(...args) {
  return this.pieceCards?.createBookCardMobile(...args);
}

// Líneas 2444-2506
openBookBottomSheet(bookId) {
  this.pieceCards?.openBookBottomSheet(bookId);
}

// Líneas 2508-2537
setupBookBottomSheetControls(...args) {
  this.pieceCards?.setupBookBottomSheetControls(...args);
}

// Líneas 2539-2549
closeBookBottomSheet() {
  this.pieceCards?.closeBookBottomSheet();
}

// Líneas 2551-2627
renderMobileBookChapters(...args) {
  this.pieceCards?.renderMobileBookChapters(...args);
}

// Líneas 2629-2673
createMobilePieceCard(piece) {
  return this.pieceCards?.createMobilePieceCard(piece);
}

// Líneas 2675-2684
updateMobilePieceActionState(...args) {
  this.pieceCards?.updateMobilePieceActionState(...args);
}

// Líneas 2686-2689
isPieceSelected(pieceId) {
  return this.pieceCards?.isPieceSelected(pieceId) || false;
}

// Líneas 2691-2696
calculateChapterPower(pieces) {
  return this.pieceCards?.calculateChapterPower(pieces) || 0;
}

// Líneas 2698-2850
createBookTree(...args) {
  return this.pieceCards?.createBookTree(...args);
}

// Líneas 2852-2942
createChapterTree(...args) {
  return this.pieceCards?.createChapterTree(...args);
}

// Líneas 2944-2992
createPieceCard(piece) {
  return this.pieceCards?.createPieceCard(piece);
}
```

### 2. Propiedades que Deben Moverse

Estas propiedades del constructor deberían ser gestionadas por el módulo:
- `this.mobileBooksData = {}` (línea 45)
- `this.mobileSheetFilter = 'all'` (línea 46)
- `this.mobileSheetSearch = ''` (línea 47)

**Acción**: Eliminar del constructor principal y dejar que el módulo las gestione internamente.

### 3. Cleanup en destroy()

Agregar llamada a `destroy()` del módulo en el método `destroy()` de `FrankensteinLabUI`:

```javascript
destroy() {
  // ... código existente ...

  // Cleanup piece cards module
  if (this.pieceCards) {
    this.pieceCards.destroy();
    this.pieceCards = null;
  }

  // ... resto del código ...
}
```

## Riesgos y Consideraciones ⚠️

### 1. Dependencias Circulares
El módulo `FrankensteinPieceCards` recibe `labUIRef` para acceder a:
- `this.labUI.availablePieces`
- `this.labUI.selectedPieces`
- `this.labUI.organism`
- `this.labUI.togglePieceSelectionEnhanced()`
- `this.labUI.updatePiecesCountBadge()`
- `this.labUI.updateMissingRequirementsQuickView()`
- `this.labUI.handlePiecesModalScroll()`
- `this.labUI.initDragAndDropEnhanced()`
- `this.labUI.updateStickyRequirementsHeader()`
- `this.labUI._addEventListener()`
- `this.labUI._setTimeout()`

**Solución**: Estas dependencias son aceptables ya que el módulo es un componente UI que necesita interactuar con el estado global del lab.

### 2. Bottom Sheet Integration
El código original tiene integración con `FrankensteinBottomSheet` (líneas 2459, 2470, 2507, 2510, 2519).

**Estado actual**: El módulo `FrankensteinPieceCards` tiene su propia implementación de bottom sheet legacy. Esto podría conflictuar con `FrankensteinBottomSheet`.

**Recomendación**:
- Opción A: Migrar completamente a `FrankensteinBottomSheet` y eliminar la implementación legacy
- Opción B: Mantener ambas implementaciones temporalmente con un feature flag

### 3. Testing
**Pendiente**: Verificar que todas las funcionalidades funcionen correctamente:
- [ ] Renderizado de grid de piezas (desktop)
- [ ] Renderizado de cards móviles
- [ ] Apertura/cierre de bottom sheets
- [ ] Filtrado por tipo de pieza
- [ ] Búsqueda de piezas
- [ ] Selección/deselección de piezas
- [ ] Cálculo de poder y atributos
- [ ] Integración con sistema de misiones
- [ ] Tooltips y hover states
- [ ] Drag and drop (si aplica)

## Próximos Pasos 🚀

1. **Fase 1**: Crear wrappers/delegaciones para todos los métodos (ALTA PRIORIDAD)
   - Reemplazar implementaciones en líneas 2254-3009
   - Mantener backward compatibility

2. **Fase 2**: Testing exhaustivo
   - Probar todas las interacciones
   - Verificar mobile y desktop
   - Validar integración con otros módulos

3. **Fase 3**: Cleanup
   - Eliminar código comentado
   - Actualizar documentación
   - Agregar JSDoc faltante

4. **Fase 4**: Optimización
   - Revisar performance
   - Minimizar re-renders
   - Optimizar event listeners

## Notas Adicionales 📝

- El módulo tiene 880 líneas bien documentadas con JSDoc
- Todas las funciones mantienen la misma firma que las originales
- El código es backward compatible
- Se mantiene soporte para mobile y desktop
- Integración con EventManager para cleanup automático

---

**Fecha**: 2024-12-28
**Versión**: v2.9.154
**Estado**: En Progreso (60% completado)
