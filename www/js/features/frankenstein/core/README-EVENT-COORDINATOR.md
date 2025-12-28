# FrankensteinEventCoordinator

**Módulo de coordinación centralizada de eventos del laboratorio Frankenstein**

## Ubicación
```
www/js/features/frankenstein/core/frankenstein-event-coordinator.js
```

## Descripción

Coordinador centralizado que gestiona todos los event listeners del laboratorio:
- Event listeners de UI (botones, inputs, modales)
- Navegación del menú lateral
- Filtros y búsqueda de piezas
- Gestos y swipes del bottom sheet
- Cleanup completo de listeners para evitar memory leaks

## Extracción

### Origen
- **Archivo:** `www/js/features/frankenstein-ui.js`
- **Líneas:** 3356-3618, 7040-7189 (~728 líneas)
- **Versión:** v2.9.201

### Contenido Extraído
1. `attachEventListeners()` - Orquestación completa de event listeners (~263 líneas)
2. `handleMenuNavigation()` - Navegación del menú lateral
3. `toggleSideMenu()`, `openSideMenu()`, `closeSideMenu()` - Gestión de menú lateral
4. `updateMenuBadges()` - Actualización de contadores del menú
5. Sistema de cleanup con AbortController

## API Pública

### Constructor
```javascript
new FrankensteinEventCoordinator(labUIRef, domCache)
```

**Parámetros:**
- `labUIRef` (FrankensteinLabUI): Referencia a la instancia principal
- `domCache` (Object): Cache de referencias DOM

### Métodos Principales

#### `attachAll()`
Adjunta todos los event listeners del laboratorio.

**Categorías de listeners:**
- Prevención de interferencias con selección de texto
- Bottom sheet gestures
- Filtros y búsqueda de piezas
- Botones de acción del ser
- Header mejorado y menú lateral
- Modales (misiones, requisitos, piezas)
- FABs (Requirements, Pieces)
- Mini challenges
- Vitruvian popup

#### `toggleSideMenu()`
Alterna entre abrir y cerrar el menú lateral.

#### `openSideMenu()`
Abre el menú lateral con:
- Animación CSS
- Bloqueo de scroll del body
- Feedback háptico (si disponible)

#### `closeSideMenu()`
Cierra el menú lateral y restaura el scroll.

#### `handleMenuNavigation(section)`
Coordina la navegación entre secciones del laboratorio.

**Secciones soportadas:**
- `'laboratorio'` - Ya estamos aquí
- `'seres'` - Modal de seres guardados
- `'microsociedades'` - Simulador de microsociedades
- `'retos'` - Sistema de retos/challenges
- `'ajustes'` - Panel de ajustes
- `'estadisticas'` - Panel de estadísticas
- `'ayuda'` - Modal de ayuda
- `'salir'` - Cerrar laboratorio

**Parámetros:**
- `section` (string): Identificador de la sección

#### `updateMenuBadges()`
Actualiza los contadores visuales del menú:
- Contador de seres guardados
- Contador de microsociedades

#### `destroy()`
Cleanup completo de todos los event listeners usando AbortController.

## Métodos Privados

### `_attachFilterPills()`
Adjunta listeners a los filtros de piezas (pills).

### `_attachActionButtons()`
Adjunta listeners a los botones de acción del ser:
- Clear selection
- Export being
- Validate being
- Talk to being
- Create microsociety
- Open microsociety

### `_attachHeaderButtons()`
Adjunta listeners al header mejorado:
- Menú hamburguesa
- Overlay del menú
- Items del menú lateral
- Seres guardados
- Estadísticas
- Ajustes
- Cerrar laboratorio

### `_attachModalListeners()`
Adjunta listeners a los modales:
- Modal de misiones
- Modal de requisitos
- Modal de piezas

### `_attachFABListeners()`
Adjunta listeners a los FABs flotantes:
- FAB Requirements
- FAB Pieces

### `_addEventListener(element, event, handler, options)`
Wrapper para addEventListener con tracking y AbortController.

**Parámetros:**
- `element` (HTMLElement): Elemento DOM
- `event` (string): Tipo de evento
- `handler` (Function): Manejador del evento
- `options` (Object): Opciones del listener

### `_addEventListenerById(elementId, event, handler, options)`
Wrapper que busca elemento por ID y agrega listener.

**Parámetros:**
- `elementId` (string): ID del elemento
- `event` (string): Tipo de evento
- `handler` (Function): Manejador del evento
- `options` (Object): Opciones del listener

## Dependencias

### Módulos del Laboratorio
- **FrankensteinBottomSheet**: Gestos del bottom sheet
- **FrankensteinModals**: Sistema de modales
- Todos los módulos funcionales del laboratorio

### Sistemas Globales
- `window.frankensteinStats` - Sistema de estadísticas
- `window.frankensteinSettings` - Sistema de ajustes
- `window.frankensteinChallengesModal` - Modal de retos
- `window.microsocietiesInit` - Panel de microsociedades
- `window.microsocietiesGallery` - Galería de microsociedades

## Propiedades

### `labUI`
Referencia a la instancia principal de FrankensteinLabUI.

### `dom`
Cache de referencias DOM para optimización.

### `listeners`
Array de listeners registrados para tracking manual.

### `abortController`
AbortController para cleanup automático de listeners.

## Uso

### Inicialización
```javascript
import FrankensteinEventCoordinator from './frankenstein/core/frankenstein-event-coordinator.js';

// En FrankensteinLabUI.init()
this.eventCoordinator = new FrankensteinEventCoordinator(this, this.domCache);
this.eventCoordinator.attachAll();
```

### Cleanup
```javascript
// En FrankensteinLabUI.destroy()
if (this.eventCoordinator) {
  this.eventCoordinator.destroy();
}
```

### Navegación Programática
```javascript
// Abrir sección de seres guardados
this.eventCoordinator.handleMenuNavigation('seres');

// Cerrar menú lateral
this.eventCoordinator.closeSideMenu();
```

### Actualizar Badges
```javascript
// Después de guardar/eliminar un ser
this.eventCoordinator.updateMenuBadges();
```

## Características Técnicas

### Sistema de Cleanup
- Usa **AbortController** para cleanup automático
- Evita memory leaks por listeners no removidos
- Compatible con navegadores modernos

### Prevención de Eventos
- Todos los handlers usan `preventDefault()` y `stopPropagation()`
- Previene interferencia con selección de texto
- Gestión cuidadosa de event bubbling

### Feedback de Usuario
- Feedback háptico en dispositivos móviles
- Animaciones CSS coordinadas
- Notificaciones de estado

### Optimización
- Cache de referencias DOM
- Delegación de eventos donde es apropiado
- Lazy loading de funcionalidades opcionales

## Integraciones

### Bottom Sheet
```javascript
if (this.labUI.bottomSheet) {
  this.labUI.bottomSheet.init();
}
```

### Modales
```javascript
this.labUI.openMissionModal();
this.labUI.closeRequirementsModal();
this.labUI.openPiecesModal();
```

### Menú Lateral
```javascript
this.toggleSideMenu();
this.handleMenuNavigation('microsociedades');
```

## Notas de Desarrollo

### Backward Compatibility
✅ Mantiene compatibilidad con el código existente
✅ Todos los métodos preservan sus firmas originales
✅ Delegación transparente a módulos externos

### Testing
- Verificar todos los event listeners funcionan correctamente
- Probar cleanup de listeners (verificar con DevTools)
- Validar navegación del menú en todas las secciones
- Probar feedback háptico en móviles

### Memory Leaks
- AbortController garantiza cleanup automático
- Array `listeners` para tracking manual si es necesario
- Verificar con Chrome DevTools > Performance Monitor

## Changelog

### v2.9.201 (2025-12-28)
- ✅ Extracción inicial desde frankenstein-ui.js
- ✅ Sistema de cleanup con AbortController
- ✅ Coordinación centralizada de eventos
- ✅ Gestión completa del menú lateral
- ✅ Actualización de badges del menú
- ✅ Documentación completa JSDoc

## TODO

- [ ] Añadir tests unitarios para cada categoría de listeners
- [ ] Implementar telemetría de eventos de usuario
- [ ] Optimizar delegación de eventos para listas grandes
- [ ] Añadir soporte para teclado (keyboard shortcuts)
- [ ] Implementar gestos avanzados (swipe, pinch, etc.)

## Referencias

- [MDN: AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)
- [Event Delegation Pattern](https://javascript.info/event-delegation)
- [Memory Leaks Prevention](https://nolanlawson.com/2020/02/19/fixing-memory-leaks-in-web-applications/)
