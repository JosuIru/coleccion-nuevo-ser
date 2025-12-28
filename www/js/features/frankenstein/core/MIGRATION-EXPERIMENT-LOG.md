# Guía de Migración - FrankensteinExperimentLog

Esta guía detalla cómo migrar desde el sistema de experiment log integrado en `FrankensteinLabUI` al nuevo módulo independiente `FrankensteinExperimentLog`.

## Cambios Principales

### Antes (Código Original en FrankensteinLabUI)

```javascript
class FrankensteinLabUI {
  constructor() {
    this.experimentLog = [];
  }

  initialize() {
    // ...
    this.loadExperimentLog();
  }

  loadExperimentLog() {
    try {
      const stored = localStorage.getItem('frankenstein-experiments');
      this.experimentLog = stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn('[FrankensteinUI] No se pudo leer la bitácora:', error);
      this.experimentLog = [];
    }
    this.renderExperimentLog();
  }

  recordExperimentEntry(results) {
    if (!this.currentBeing) return;
    // ... código de registro
    this.experimentLog = [entry, ...this.experimentLog].slice(0, 20);
    localStorage.setItem('frankenstein-experiments', JSON.stringify(this.experimentLog));
  }

  renderExperimentLog() {
    const list = this.domCache.experimentLogList;
    // ... código de renderizado
  }
}
```

### Después (Con Módulo FrankensteinExperimentLog)

```javascript
import { FrankensteinExperimentLog } from './frankenstein/core/frankenstein-experiment-log.js';

class FrankensteinLabUI {
  constructor() {
    // Crear instancia del sistema de log
    this.experimentLog = new FrankensteinExperimentLog(
      this.domCache,
      {
        missionsSystem: this.missionsSystem,
        getCurrentMissionRequirements: () => this.getCurrentMissionRequirements(),
        countFulfilledRequirements: (reqs) => this.countFulfilledRequirements(reqs)
      }
    );
  }

  initialize() {
    // ...
    this.experimentLog.load();
  }

  // recordExperimentEntry ya no existe aquí
  // Se llama directamente desde donde se valida:
  validateBeing() {
    const results = this.performValidation();

    this.experimentLog.record({
      results,
      currentBeing: this.currentBeing,
      selectedMission: this.selectedMission,
      selectedPieces: this.selectedPieces
    });
  }

  destroy() {
    this.experimentLog.destroy();
    // ... otras limpiezas
  }
}
```

## Pasos de Migración

### 1. Agregar Import

En `/www/js/features/frankenstein-ui.js`, agregar al inicio:

```javascript
import { FrankensteinExperimentLog } from './frankenstein/core/frankenstein-experiment-log.js';
```

### 2. Modificar Constructor

**Antes:**
```javascript
constructor() {
  this.experimentLog = [];
  // ...
}
```

**Después:**
```javascript
constructor() {
  // Inicializar después de domCache y missionsSystem
  this.experimentLog = new FrankensteinExperimentLog(
    this.domCache,
    {
      missionsSystem: this.missionsSystem,
      getCurrentMissionRequirements: () => this.getCurrentMissionRequirements(),
      countFulfilledRequirements: (reqs) => this.countFulfilledRequirements(reqs)
    }
  );
  // ...
}
```

### 3. Actualizar initialize()

**Antes:**
```javascript
initialize() {
  // ...
  this.loadExperimentLog();
}
```

**Después:**
```javascript
initialize() {
  // ...
  this.experimentLog.load();
}
```

### 4. Eliminar Métodos Antiguos

Eliminar estos métodos de `FrankensteinLabUI`:

```javascript
// ELIMINAR:
loadExperimentLog() { ... }
recordExperimentEntry() { ... }
renderExperimentLog() { ... }
```

**Ubicaciones a eliminar:**
- `loadExperimentLog()` - Líneas 6539-6548
- `recordExperimentEntry()` - Líneas 6550-6581
- `renderExperimentLog()` - Líneas 6583-6617

### 5. Buscar Llamadas a recordExperimentEntry

Buscar en el código donde se llama a `this.recordExperimentEntry()` y reemplazar:

**Antes:**
```javascript
this.recordExperimentEntry(results);
```

**Después:**
```javascript
this.experimentLog.record({
  results,
  currentBeing: this.currentBeing,
  selectedMission: this.selectedMission,
  selectedPieces: this.selectedPieces
});
```

### 6. Actualizar destroy()

**Antes:**
```javascript
destroy() {
  // ... otras limpiezas
}
```

**Después:**
```javascript
destroy() {
  if (this.experimentLog) {
    this.experimentLog.destroy();
    this.experimentLog = null;
  }
  // ... otras limpiezas
}
```

### 7. Actualizar Referencias a experimentLog

**Antes (acceso directo al array):**
```javascript
const totalExperiments = this.experimentLog.length;
const viableExperiments = this.experimentLog.filter(e => e.viable);
```

**Después (usar métodos del módulo):**
```javascript
const stats = this.experimentLog.getStats();
const totalExperiments = stats.total;
const viableExperiments = this.experimentLog.getFilteredEntries({ viable: true });
```

## Verificación de Compatibilidad

### 1. Verificar localStorage

El nuevo módulo usa la misma clave por defecto (`'frankenstein-experiments'`), por lo que los datos existentes se cargarán automáticamente.

```javascript
// Verificar que se mantiene la clave
const experimentLog = new FrankensteinExperimentLog(
  domCache,
  dependencies,
  'frankenstein-experiments' // Misma clave que antes
);
```

### 2. Verificar Estructura de Entradas

La estructura de las entradas es **100% compatible**:

```javascript
{
  id: number,
  timestamp: string,
  mission: string,
  viable: boolean,
  score: number,
  fulfilled: number,
  totalReqs: number,
  attributes: string[],
  pieces: string[],
  insight: string
}
```

### 3. Verificar Renderizado

El HTML generado es **idéntico** al original, por lo que no se requieren cambios en CSS.

## Checklist de Migración

- [ ] Importar módulo FrankensteinExperimentLog
- [ ] Modificar constructor para usar nueva instancia
- [ ] Cambiar `this.loadExperimentLog()` por `this.experimentLog.load()`
- [ ] Eliminar métodos `loadExperimentLog()`, `recordExperimentEntry()`, `renderExperimentLog()`
- [ ] Buscar y reemplazar llamadas a `this.recordExperimentEntry()`
- [ ] Agregar `this.experimentLog.destroy()` en destroy()
- [ ] Actualizar accesos directos al array por métodos del módulo
- [ ] Probar carga de datos existentes
- [ ] Probar registro de nuevos experimentos
- [ ] Probar renderizado en UI
- [ ] Verificar que no hay regresiones

## Testing Post-Migración

### 1. Test de Carga

```javascript
// Verificar que carga datos existentes
console.log('Entradas cargadas:', this.experimentLog.entries.length);
```

### 2. Test de Registro

```javascript
// Crear experimento de prueba
const entry = this.experimentLog.record({
  results: { viable: true, percentage: 85 },
  currentBeing: { attributes: { intelligence: 80 } },
  selectedMission: { name: 'Test' },
  selectedPieces: []
});
console.log('Entry creada:', entry);
```

### 3. Test de Renderizado

```javascript
// Verificar que se renderiza correctamente
this.experimentLog.render();
const list = document.getElementById('experiment-log-list');
console.log('HTML renderizado:', list.innerHTML.length > 0);
```

### 4. Test de Estadísticas

```javascript
// Verificar estadísticas
const stats = this.experimentLog.getStats();
console.log('Estadísticas:', stats);
```

## Beneficios de la Migración

### Modularidad
- Sistema de log independiente y reutilizable
- Más fácil de testear en aislamiento
- Mejor separación de responsabilidades

### Mantenibilidad
- Código más organizado y fácil de mantener
- Documentación completa del módulo
- Tests unitarios incluidos

### Funcionalidad Extendida
- Métodos de estadísticas (`getStats()`)
- Filtrado avanzado (`getFilteredEntries()`)
- Limpieza de log (`clear()`)
- Mejor manejo de errores

### Performance
- Sin cambios en rendimiento
- Misma implementación de localStorage
- Renderizado idéntico

## Rollback (Si es necesario)

Si necesitas revertir la migración:

1. Eliminar import:
   ```javascript
   // import { FrankensteinExperimentLog } from './frankenstein/core/frankenstein-experiment-log.js';
   ```

2. Restaurar código original desde git:
   ```bash
   git checkout HEAD -- www/js/features/frankenstein-ui.js
   ```

3. Verificar que los datos en localStorage se mantienen

## Soporte

Si encuentras problemas durante la migración:

1. Verificar logs de consola para errores
2. Comprobar que domCache está inicializado correctamente
3. Verificar que missionsSystem existe antes de crear experimentLog
4. Revisar que getCurrentMissionRequirements() funciona correctamente

## Notas Adicionales

### Compatibilidad con Demo Mode

El sistema es compatible con el modo demo. Si usas `FrankensteinDemoData`, no requiere cambios.

### Integración con Rewards System

El sistema de log es independiente del sistema de recompensas. Si usas recompensas basadas en experimentos, actualiza las referencias:

```javascript
// Antes
const recentExperiments = this.experimentLog.slice(0, 5);

// Después
const recentExperiments = this.experimentLog.entries.slice(0, 5);
```

### Migración Gradual

Puedes hacer una migración gradual manteniendo ambos sistemas temporalmente:

```javascript
// Temporal: mantener ambos
this.experimentLogOld = [];
this.experimentLog = new FrankensteinExperimentLog(...);

// Sincronizar
this.experimentLog.load();
this.experimentLogOld = [...this.experimentLog.entries];
```

Esto permite verificar que todo funciona antes de eliminar el código antiguo.
