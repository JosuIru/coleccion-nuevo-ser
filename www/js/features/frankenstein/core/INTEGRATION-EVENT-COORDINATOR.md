# Guía de Integración: FrankensteinEventCoordinator

## Objetivo

Integrar el módulo `FrankensteinEventCoordinator` en el archivo principal `frankenstein-ui.js` para centralizar la gestión de eventos.

## Pasos de Integración

### 1. Agregar Import

En `www/js/features/frankenstein-ui.js`, agregar el import después de los existentes:

```javascript
// 🔧 REFACTORING v2.9.201: Bottom Sheet extracted to module
import FrankensteinBottomSheet from './frankenstein/ui/frankenstein-bottom-sheet.js';
// 🔧 REFACTORING v2.9.201: Modals system extracted to module
import FrankensteinModals from './frankenstein/ui/frankenstein-modals.js';
// 🔧 REFACTORING v2.9.201: Event Coordinator extracted to module
import FrankensteinEventCoordinator from './frankenstein/core/frankenstein-event-coordinator.js';
```

### 2. Inicializar en Constructor

En el constructor de `FrankensteinLabUI`, agregar:

```javascript
constructor(organismKnowledge) {
  // ... código existente ...

  // 🔧 REFACTORING v2.9.201: Event Coordinator module
  this.eventCoordinator = null; // Inicializado en init()

  // ... resto del código ...
}
```

### 3. Inicializar en init()

En el método `init()`, después de inicializar bottomSheet y modals:

```javascript
async init() {
  // ... código existente ...

  // 🔧 REFACTORING v2.9.201: Initialize Event Coordinator
  this.eventCoordinator = new FrankensteinEventCoordinator(this, this.domCache);

  // ... resto del código ...
}
```

### 4. Reemplazar attachEventListeners()

Opción A - Wrapper (Backward Compatible):
```javascript
/**
 * @deprecated Use eventCoordinator.attachAll() instead
 * Attach event listeners - Wrapper para backward compatibility
 */
attachEventListeners() {
  if (this.eventCoordinator) {
    this.eventCoordinator.attachAll();
  } else {
    console.warn('⚠️ EventCoordinator not initialized');
  }
}
```

Opción B - Llamada Directa (Recomendado):
```javascript
// En init(), reemplazar:
// this.attachEventListeners();

// Por:
this.eventCoordinator.attachAll();
```

### 5. Delegar Métodos de Menú

Reemplazar los métodos existentes con wrappers:

```javascript
/**
 * Toggle del menú lateral - Wrapper
 * @deprecated Use eventCoordinator.toggleSideMenu() instead
 */
toggleSideMenu() {
  if (this.eventCoordinator) {
    this.eventCoordinator.toggleSideMenu();
  }
}

/**
 * Abrir menú lateral - Wrapper
 * @deprecated Use eventCoordinator.openSideMenu() instead
 */
openSideMenu() {
  if (this.eventCoordinator) {
    this.eventCoordinator.openSideMenu();
  }
}

/**
 * Cerrar menú lateral - Wrapper
 * @deprecated Use eventCoordinator.closeSideMenu() instead
 */
closeSideMenu() {
  if (this.eventCoordinator) {
    this.eventCoordinator.closeSideMenu();
  }
}

/**
 * Manejar navegación del menú - Wrapper
 * @deprecated Use eventCoordinator.handleMenuNavigation() instead
 */
handleMenuNavigation(section) {
  if (this.eventCoordinator) {
    this.eventCoordinator.handleMenuNavigation(section);
  }
}

/**
 * Actualizar badges del menú - Wrapper
 * @deprecated Use eventCoordinator.updateMenuBadges() instead
 */
updateMenuBadges() {
  if (this.eventCoordinator) {
    this.eventCoordinator.updateMenuBadges();
  }
}
```

### 6. Cleanup en destroy()

En el método `destroy()`, agregar:

```javascript
destroy() {
  // ... código existente de cleanup ...

  // 🔧 REFACTORING v2.9.201: Cleanup event coordinator
  if (this.eventCoordinator) {
    this.eventCoordinator.destroy();
    this.eventCoordinator = null;
  }

  // ... resto del cleanup ...
}
```

## Código Completo de Integración

### frankenstein-ui.js (líneas 1-20)

```javascript
/**
 * FRANKENSTEIN LAB UI v3.1 - SISTEMA DE MISIONES
 * Sistema de cartas con piezas individuales y validación por misiones
 * Las piezas (capítulos/ejercicios/recursos) se combinan para crear seres con propósito
 * v3.1: Tabs horizontales móvil, gestos mejorados, glassmorphism, GPU animations
 *
 * @version 3.1.0
 * @author J. Irurtzun & Claude Sonnet 4.5
 */

// 🔧 REFACTORING v2.9.201: Bottom Sheet extracted to module
import FrankensteinBottomSheet from './frankenstein/ui/frankenstein-bottom-sheet.js';
// 🔧 REFACTORING v2.9.201: Modals system extracted to module
import FrankensteinModals from './frankenstein/ui/frankenstein-modals.js';
// 🔧 REFACTORING v2.9.201: Event Coordinator extracted to module
import FrankensteinEventCoordinator from './frankenstein/core/frankenstein-event-coordinator.js';

class FrankensteinLabUI {
  constructor(organismKnowledge) {
    this.organism = organismKnowledge;

    // ... propiedades existentes ...

    // 🔧 REFACTORING v2.9.201: Módulos extraídos
    this.modals = null; // Inicializado en init()
    this.bottomSheet = null; // Inicializado en init()
    this.eventCoordinator = null; // Inicializado en init()

    // ... resto del constructor ...
  }
}
```

### frankenstein-ui.js - init() (ejemplo)

```javascript
async init() {
  if (this.isInitialized) return;

  // ... código existente ...

  // 🔧 REFACTORING v2.9.201: Initialize modules
  this.bottomSheet = new FrankensteinBottomSheet(this, this.domCache);
  this.modals = new FrankensteinModals(this, this.domCache);
  this.eventCoordinator = new FrankensteinEventCoordinator(this, this.domCache);

  // Attach all event listeners
  this.eventCoordinator.attachAll();

  // ... resto de init ...

  this.isInitialized = true;
}
```

### frankenstein-ui.js - destroy() (ejemplo)

```javascript
destroy() {
  console.log('[FrankensteinUI] Destroying laboratory...');

  // 🔧 REFACTORING v2.9.201: Cleanup modules
  if (this.eventCoordinator) {
    this.eventCoordinator.destroy();
    this.eventCoordinator = null;
  }

  if (this.bottomSheet) {
    this.bottomSheet.destroy();
    this.bottomSheet = null;
  }

  if (this.modals) {
    this.modals.destroy();
    this.modals = null;
  }

  // ... resto del cleanup ...
}
```

## Verificación de Integración

### Checklist

- [ ] Import agregado correctamente
- [ ] EventCoordinator inicializado en constructor
- [ ] EventCoordinator.attachAll() llamado en init()
- [ ] Métodos de menú delegados (wrappers)
- [ ] Cleanup en destroy()
- [ ] Código original comentado o eliminado
- [ ] Tests funcionando correctamente

### Testing

1. **Verificar event listeners:**
   ```javascript
   // En Chrome DevTools Console
   getEventListeners(document.getElementById('btn-menu-hamburger'))
   ```

2. **Verificar menú lateral:**
   - Abrir menú hamburguesa
   - Navegar entre secciones
   - Verificar badges de contadores
   - Cerrar con overlay

3. **Verificar modales:**
   - FAB Requirements
   - FAB Pieces
   - Modal de misiones
   - Navegación entre modales

4. **Verificar cleanup:**
   ```javascript
   // Verificar que no hay listeners huérfanos después de destroy()
   frankensteinLabUI.destroy();
   getEventListeners(document.getElementById('btn-menu-hamburger'))
   ```

## Código a Eliminar/Comentar

### En frankenstein-ui.js

Marcar como deprecated o eliminar:

**Líneas 3356-3618:**
```javascript
// 🔧 DEPRECATED v2.9.201 - Migrado a FrankensteinEventCoordinator
// attachEventListeners() { ... }
```

**Líneas 7040-7189:**
```javascript
// 🔧 DEPRECATED v2.9.201 - Migrado a FrankensteinEventCoordinator
// toggleSideMenu() { ... }
// openSideMenu() { ... }
// closeSideMenu() { ... }
// handleMenuNavigation() { ... }
// updateMenuBadges() { ... }
```

## Beneficios de la Integración

### Organización
✅ Código de eventos centralizado en un solo módulo
✅ Separación clara de responsabilidades
✅ Más fácil de mantener y testear

### Performance
✅ Cleanup automático con AbortController
✅ Sin memory leaks por listeners huérfanos
✅ Cache de referencias DOM optimizado

### Mantenibilidad
✅ Código modular y reutilizable
✅ Documentación JSDoc completa
✅ Backward compatibility garantizada

### Testing
✅ Módulo testeable de forma aislada
✅ Mocking más sencillo
✅ Cobertura de tests mejorada

## Rollback Plan

Si hay problemas, se puede hacer rollback:

1. Comentar el import del EventCoordinator
2. Descomentar el código original
3. Restaurar llamadas directas a `attachEventListeners()`

El código original permanece en el archivo principal hasta verificar que todo funciona correctamente.

## Timeline de Migración

### Fase 1: Setup (Completado ✅)
- Crear módulo FrankensteinEventCoordinator
- Documentación completa
- Tests iniciales

### Fase 2: Integración (Siguiente)
- Agregar import
- Inicializar módulo
- Crear wrappers

### Fase 3: Verificación
- Testing exhaustivo
- Verificar cleanup
- Validar backward compatibility

### Fase 4: Cleanup (Final)
- Eliminar código deprecated
- Actualizar referencias
- Documentación final

## Notas Importantes

⚠️ **No eliminar código original hasta verificar que todo funciona**
⚠️ **Mantener wrappers para backward compatibility**
⚠️ **Verificar que no hay referencias directas a métodos eliminados**
⚠️ **Probar en móviles y escritorio**

## Contacto

Para dudas sobre la integración:
- Revisar README-EVENT-COORDINATOR.md
- Revisar código fuente del módulo
- Verificar tests existentes
