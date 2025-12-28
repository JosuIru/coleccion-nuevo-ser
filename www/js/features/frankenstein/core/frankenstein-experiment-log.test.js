/**
 * Tests para FrankensteinExperimentLog
 *
 * Pruebas unitarias para verificar el funcionamiento del sistema
 * de registro de experimentos.
 */

import { FrankensteinExperimentLog } from './frankenstein-experiment-log.js';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value.toString(); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();

global.localStorage = localStorageMock;

describe('FrankensteinExperimentLog', () => {
  let experimentLog;
  let mockDomCache;
  let mockDependencies;

  beforeEach(() => {
    // Limpiar localStorage
    localStorage.clear();

    // Mock DOM cache
    mockDomCache = {
      experimentLogList: {
        innerHTML: ''
      },
      experimentLogMeta: {
        textContent: ''
      }
    };

    // Mock dependencies
    mockDependencies = {
      missionsSystem: {
        attributes: {
          intelligence: { name: 'Inteligencia', icon: '🧠' },
          strength: { name: 'Fuerza', icon: '💪' },
          agility: { name: 'Agilidad', icon: '⚡' }
        }
      },
      getCurrentMissionRequirements: () => [
        { type: 'attribute', key: 'intelligence', value: 50 },
        { type: 'attribute', key: 'strength', value: 30 }
      ],
      countFulfilledRequirements: (reqs) => reqs.length
    };

    experimentLog = new FrankensteinExperimentLog(
      mockDomCache,
      mockDependencies,
      'test-experiment-log'
    );
  });

  test('constructor inicializa correctamente', () => {
    expect(experimentLog.entries).toEqual([]);
    expect(experimentLog.storageKey).toBe('test-experiment-log');
    expect(experimentLog.dom).toBe(mockDomCache);
  });

  test('load() carga entradas desde localStorage', () => {
    const testEntries = [
      { id: 1, mission: 'Test Mission', score: 85, viable: true }
    ];
    localStorage.setItem('test-experiment-log', JSON.stringify(testEntries));

    experimentLog.load();

    expect(experimentLog.entries).toEqual(testEntries);
  });

  test('load() inicializa array vacío si no hay datos', () => {
    experimentLog.load();
    expect(experimentLog.entries).toEqual([]);
  });

  test('record() crea entrada correctamente', () => {
    const entry = experimentLog.record({
      results: {
        viable: true,
        percentage: 85,
        strengths: [{ message: 'Excelente balance' }]
      },
      currentBeing: {
        attributes: {
          intelligence: 80,
          strength: 60,
          agility: 70
        }
      },
      selectedMission: {
        name: 'Misión de Exploración',
        successMessage: 'Misión exitosa'
      },
      selectedPieces: [
        { title: 'Pieza 1' },
        { title: 'Pieza 2' }
      ]
    });

    expect(entry).toBeDefined();
    expect(entry.mission).toBe('Misión de Exploración');
    expect(entry.viable).toBe(true);
    expect(entry.score).toBe(85);
    expect(entry.attributes.length).toBe(3);
    expect(experimentLog.entries.length).toBe(1);
  });

  test('record() retorna null si no hay currentBeing', () => {
    const entry = experimentLog.record({
      results: { viable: true, percentage: 85 }
    });

    expect(entry).toBeNull();
    expect(experimentLog.entries.length).toBe(0);
  });

  test('record() mantiene solo 20 entradas', () => {
    // Crear 25 entradas
    for (let i = 0; i < 25; i++) {
      experimentLog.record({
        results: { viable: true, percentage: 50 + i },
        currentBeing: { attributes: { intelligence: 50 } },
        selectedMission: { name: `Misión ${i}` },
        selectedPieces: []
      });
    }

    expect(experimentLog.entries.length).toBe(20);
  });

  test('clear() elimina todas las entradas', () => {
    experimentLog.record({
      results: { viable: true, percentage: 85 },
      currentBeing: { attributes: { intelligence: 50 } },
      selectedMission: { name: 'Test' },
      selectedPieces: []
    });

    experimentLog.clear();

    expect(experimentLog.entries.length).toBe(0);
    expect(localStorage.getItem('test-experiment-log')).toBeNull();
  });

  test('getStats() calcula estadísticas correctamente', () => {
    // Agregar entradas de prueba
    experimentLog.entries = [
      { viable: true, score: 80 },
      { viable: true, score: 90 },
      { viable: false, score: 40 }
    ];

    const stats = experimentLog.getStats();

    expect(stats.total).toBe(3);
    expect(stats.viable).toBe(2);
    expect(stats.inviable).toBe(1);
    expect(stats.viabilityRate).toBeCloseTo(66.67, 1);
    expect(stats.averageScore).toBeCloseTo(70, 1);
  });

  test('getFilteredEntries() filtra por viabilidad', () => {
    experimentLog.entries = [
      { viable: true, score: 80, mission: 'A' },
      { viable: false, score: 40, mission: 'B' },
      { viable: true, score: 90, mission: 'C' }
    ];

    const viable = experimentLog.getFilteredEntries({ viable: true });
    expect(viable.length).toBe(2);
    expect(viable.every(e => e.viable)).toBe(true);
  });

  test('getFilteredEntries() filtra por misión', () => {
    experimentLog.entries = [
      { viable: true, score: 80, mission: 'A' },
      { viable: false, score: 40, mission: 'B' },
      { viable: true, score: 90, mission: 'A' }
    ];

    const filtered = experimentLog.getFilteredEntries({ mission: 'A' });
    expect(filtered.length).toBe(2);
    expect(filtered.every(e => e.mission === 'A')).toBe(true);
  });

  test('getFilteredEntries() filtra por puntaje mínimo', () => {
    experimentLog.entries = [
      { viable: true, score: 80, mission: 'A' },
      { viable: false, score: 40, mission: 'B' },
      { viable: true, score: 90, mission: 'C' }
    ];

    const filtered = experimentLog.getFilteredEntries({ minScore: 70 });
    expect(filtered.length).toBe(2);
    expect(filtered.every(e => e.score >= 70)).toBe(true);
  });

  test('destroy() limpia recursos', () => {
    experimentLog.destroy();

    expect(experimentLog.entries).toEqual([]);
    expect(experimentLog.dom).toBeNull();
    expect(experimentLog.missionsSystem).toBeNull();
  });

  test('render() muestra mensaje cuando no hay entradas', () => {
    experimentLog.render();

    expect(mockDomCache.experimentLogList.innerHTML).toContain('Valida un ser');
    expect(mockDomCache.experimentLogMeta.textContent).toBe('Sin registros');
  });

  test('render() muestra entradas correctamente', () => {
    experimentLog.entries = [
      {
        id: 1,
        timestamp: new Date().toISOString(),
        mission: 'Test Mission',
        viable: true,
        score: 85,
        fulfilled: 2,
        totalReqs: 2,
        attributes: ['🧠 Inteligencia: 80'],
        pieces: ['Pieza 1'],
        insight: 'Excelente balance'
      }
    ];

    experimentLog.render();

    expect(mockDomCache.experimentLogList.innerHTML).toContain('Test Mission');
    expect(mockDomCache.experimentLogList.innerHTML).toContain('85%');
    expect(mockDomCache.experimentLogList.innerHTML).toContain('viable');
  });
});
