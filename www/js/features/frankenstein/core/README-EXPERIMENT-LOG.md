# FrankensteinExperimentLog

Sistema de registro y análisis de experimentos para el Laboratorio Frankenstein.

## Descripción

`FrankensteinExperimentLog` gestiona el historial de validaciones de seres creados, almacenando resultados, puntajes y análisis detallados de cada experimento realizado en el laboratorio.

## Características

- **Persistencia**: Almacenamiento automático en localStorage
- **Límite inteligente**: Mantiene los 20 registros más recientes
- **Renderizado automático**: Actualización visual de entradas
- **Análisis detallado**: Viabilidad, atributos y piezas utilizadas
- **Estadísticas**: Cálculo de tasas de éxito y promedios
- **Filtrado**: Búsqueda por viabilidad, misión y puntaje

## Instalación

```javascript
import { FrankensteinExperimentLog } from './frankenstein-experiment-log.js';
```

## Uso Básico

### Inicialización

```javascript
const domCache = {
  experimentLogList: document.getElementById('experiment-log-list'),
  experimentLogMeta: document.getElementById('experiment-log-meta')
};

const dependencies = {
  missionsSystem: missionsSystemInstance,
  getCurrentMissionRequirements: () => [...requirements],
  countFulfilledRequirements: (reqs) => reqs.filter(r => r.fulfilled).length
};

const experimentLog = new FrankensteinExperimentLog(
  domCache,
  dependencies,
  'frankenstein-experiments' // storageKey opcional
);
```

### Cargar Registros

```javascript
// Cargar desde localStorage y renderizar
experimentLog.load();
```

### Registrar Experimento

```javascript
const entry = experimentLog.record({
  results: {
    viable: true,
    percentage: 85,
    strengths: [{ message: 'Excelente balance cognitivo' }],
    missingAttributes: [],
    balanceIssues: []
  },
  currentBeing: {
    attributes: {
      intelligence: 80,
      strength: 60,
      agility: 70,
      creativity: 65
    }
  },
  selectedMission: {
    name: 'Exploración Científica',
    successMessage: 'Perfecto para investigación'
  },
  selectedPieces: [
    { title: 'Cerebro Avanzado', id: 'brain-advanced' },
    { title: 'Corazón Resistente', id: 'heart-resistant' }
  ]
});

// entry contiene:
// {
//   id: 1735123456789,
//   timestamp: '2024-12-28T12:34:56.789Z',
//   mission: 'Exploración Científica',
//   viable: true,
//   score: 85,
//   fulfilled: 3,
//   totalReqs: 4,
//   attributes: [
//     '🧠 Inteligencia: 80',
//     '⚡ Agilidad: 70',
//     '🎨 Creatividad: 65'
//   ],
//   pieces: ['Cerebro Avanzado', 'Corazón Resistente'],
//   insight: 'Excelente balance cognitivo'
// }
```

### Obtener Estadísticas

```javascript
const stats = experimentLog.getStats();
// {
//   total: 15,
//   viable: 10,
//   inviable: 5,
//   viabilityRate: 66.67,
//   averageScore: 72.5
// }
```

### Filtrar Entradas

```javascript
// Filtrar por viabilidad
const viableExperiments = experimentLog.getFilteredEntries({ viable: true });

// Filtrar por misión
const explorationExperiments = experimentLog.getFilteredEntries({
  mission: 'Exploración Científica'
});

// Filtrar por puntaje mínimo
const highScoreExperiments = experimentLog.getFilteredEntries({
  minScore: 80
});

// Combinar filtros
const filteredExperiments = experimentLog.getFilteredEntries({
  viable: true,
  mission: 'Exploración Científica',
  minScore: 75
});
```

### Limpiar Log

```javascript
// Eliminar todos los registros
experimentLog.clear();
```

### Destruir Sistema

```javascript
// Limpiar recursos al cerrar
experimentLog.destroy();
```

## API

### Constructor

```javascript
new FrankensteinExperimentLog(domCache, dependencies, storageKey)
```

**Parámetros:**
- `domCache` (Object): Referencias a elementos DOM
  - `experimentLogList`: Contenedor de lista de entradas
  - `experimentLogMeta`: Elemento para metadatos
- `dependencies` (Object): Dependencias del sistema
  - `missionsSystem`: Sistema de misiones
  - `getCurrentMissionRequirements()`: Función para obtener requisitos
  - `countFulfilledRequirements(reqs)`: Función para contar cumplidos
- `storageKey` (string): Clave localStorage (default: 'frankenstein-experiments')

### Métodos

#### load()
Carga registros desde localStorage y renderiza.

**Returns:** `void`

#### record(options)
Registra nueva entrada de experimento.

**Parameters:**
- `options.results` (Object): Resultados de validación
- `options.currentBeing` (Object): Ser validado
- `options.selectedMission` (Object): Misión seleccionada
- `options.selectedPieces` (Array): Piezas utilizadas

**Returns:** `Object|null` - Entrada creada o null si falta currentBeing

#### render()
Renderiza log en UI.

**Returns:** `void`

#### clear()
Elimina todos los registros.

**Returns:** `void`

#### getStats()
Calcula estadísticas del log.

**Returns:** `Object`
- `total` (number): Total de entradas
- `viable` (number): Entradas viables
- `inviable` (number): Entradas inviables
- `viabilityRate` (number): Porcentaje de viabilidad
- `averageScore` (number): Puntaje promedio

#### getFilteredEntries(filters)
Obtiene entradas filtradas.

**Parameters:**
- `filters.viable` (boolean): Filtrar por viabilidad
- `filters.mission` (string): Filtrar por misión
- `filters.minScore` (number): Puntaje mínimo

**Returns:** `Array` - Entradas filtradas

#### destroy()
Limpia recursos y referencias.

**Returns:** `void`

## Estructura de Entrada

```javascript
{
  id: number,              // Timestamp único
  timestamp: string,       // ISO 8601
  mission: string,         // Nombre de misión
  viable: boolean,         // Viabilidad del ser
  score: number,           // Porcentaje (0-100)
  fulfilled: number,       // Requisitos cumplidos
  totalReqs: number,       // Total requisitos
  attributes: string[],    // Top 3 atributos
  pieces: string[],        // Primeras 4 piezas
  insight: string          // Mensaje principal
}
```

## Integración con FrankensteinLabUI

### Ejemplo de Integración

```javascript
class FrankensteinLabUI {
  constructor() {
    // ... otras inicializaciones

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
    // ... otras inicializaciones
    this.experimentLog.load();
  }

  validateBeing() {
    const results = this.performValidation();

    // Registrar resultado
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

## Estilos CSS Requeridos

```css
/* Contenedor de log */
.experiment-log-body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-height: 400px;
  overflow-y: auto;
}

/* Item de experimento */
.experiment-log-item {
  padding: 1rem;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  border-left: 4px solid var(--color);
}

.experiment-log-item.viable {
  --color: #4CAF50;
}

.experiment-log-item.inviable {
  --color: #FF5722;
}

/* Header del item */
.experiment-log-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
}

.experiment-log-date {
  font-size: 0.85rem;
  opacity: 0.7;
}

.experiment-log-score {
  font-weight: bold;
  font-size: 1.25rem;
  color: var(--color);
}

/* Insight destacado */
.experiment-log-highlight {
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  font-style: italic;
  margin: 0.5rem 0;
}

/* Metadatos */
.experiment-log-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.85rem;
  opacity: 0.8;
  margin: 0.5rem 0;
}

/* Atributos */
.experiment-log-attributes {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.experiment-log-attributes span {
  padding: 0.25rem 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  font-size: 0.85rem;
}

/* Mensaje vacío */
.empty-card-message {
  text-align: center;
  opacity: 0.6;
  padding: 2rem;
}
```

## Consideraciones

### Rendimiento

- **Límite de 20 entradas**: Evita crecimiento excesivo del localStorage
- **Renderizado eficiente**: Solo se renderiza cuando hay cambios
- **localStorage**: Puede fallar si el storage está lleno (manejo de errores incluido)

### Seguridad

- **Validación de datos**: Verifica que currentBeing exista antes de registrar
- **Manejo de errores**: Try-catch en operaciones de localStorage
- **Sanitización**: No se requiere, los datos no vienen del usuario directamente

### Compatibilidad

- **localStorage**: Requiere navegador moderno con API de Storage
- **ES6**: Usa características modernas de JavaScript
- **Modules**: Exporta como ES6 module y global window object

## Testing

```bash
# Ejecutar tests
npm test frankenstein-experiment-log.test.js
```

## Changelog

### v1.0.0 (2024-12-28)
- Extracción inicial desde FrankensteinLabUI
- Sistema de registro completo
- Estadísticas y filtrado
- Documentación completa
- Tests unitarios

## Licencia

Parte del proyecto "El Código del Despertar" - Todos los derechos reservados.
