/**
 * Ejemplos de uso de FrankensteinExperimentLog
 *
 * Este archivo contiene ejemplos prácticos de cómo usar el sistema
 * de registro de experimentos en diferentes escenarios.
 */

import { FrankensteinExperimentLog } from './frankenstein-experiment-log.js';

// =============================================================================
// EJEMPLO 1: Configuración Básica
// =============================================================================

function example1_BasicSetup() {
  console.log('📝 Ejemplo 1: Configuración Básica\n');

  // DOM Cache
  const domCache = {
    experimentLogList: document.getElementById('experiment-log-list'),
    experimentLogMeta: document.getElementById('experiment-log-meta')
  };

  // Dependencies
  const dependencies = {
    missionsSystem: {
      attributes: {
        intelligence: { name: 'Inteligencia', icon: '🧠' },
        strength: { name: 'Fuerza', icon: '💪' }
      }
    },
    getCurrentMissionRequirements: () => [
      { type: 'attribute', key: 'intelligence', value: 50 }
    ],
    countFulfilledRequirements: (reqs) => reqs.filter(r => r.fulfilled).length
  };

  // Crear instancia
  const experimentLog = new FrankensteinExperimentLog(domCache, dependencies);

  // Cargar registros existentes
  experimentLog.load();

  console.log('✅ Sistema inicializado');
  console.log(`📊 Entradas cargadas: ${experimentLog.entries.length}\n`);

  return experimentLog;
}

// =============================================================================
// EJEMPLO 2: Registrar Experimento Exitoso
// =============================================================================

function example2_SuccessfulExperiment(experimentLog) {
  console.log('📝 Ejemplo 2: Registrar Experimento Exitoso\n');

  const entry = experimentLog.record({
    results: {
      viable: true,
      percentage: 92,
      strengths: [
        { message: 'Balance perfecto entre cognición y acción' }
      ]
    },
    currentBeing: {
      attributes: {
        intelligence: 85,
        strength: 75,
        agility: 80,
        creativity: 70
      }
    },
    selectedMission: {
      name: 'Exploración Científica',
      successMessage: 'Ideal para investigación avanzada'
    },
    selectedPieces: [
      { title: 'Cerebro Cuántico', id: 'brain-quantum' },
      { title: 'Corazón Titanio', id: 'heart-titanium' },
      { title: 'Ojos Telescópicos', id: 'eyes-telescopic' }
    ]
  });

  console.log('✅ Experimento registrado:');
  console.log(`   Misión: ${entry.mission}`);
  console.log(`   Viable: ${entry.viable ? 'SÍ' : 'NO'}`);
  console.log(`   Puntaje: ${entry.score}%`);
  console.log(`   Insight: ${entry.insight}`);
  console.log(`   Atributos destacados: ${entry.attributes.join(', ')}\n`);

  return entry;
}

// =============================================================================
// EJEMPLO 3: Registrar Experimento Fallido
// =============================================================================

function example3_FailedExperiment(experimentLog) {
  console.log('📝 Ejemplo 3: Registrar Experimento Fallido\n');

  const entry = experimentLog.record({
    results: {
      viable: false,
      percentage: 45,
      missingAttributes: [
        { message: 'Requiere mayor inteligencia para esta misión' }
      ],
      balanceIssues: [
        { message: 'Demasiada fuerza, poca agilidad' }
      ]
    },
    currentBeing: {
      attributes: {
        intelligence: 30,
        strength: 90,
        agility: 20,
        creativity: 35
      }
    },
    selectedMission: {
      name: 'Diplomacia Intergaláctica',
      successMessage: 'Perfecto negociador'
    },
    selectedPieces: [
      { title: 'Músculos Reforzados', id: 'muscles-reinforced' },
      { title: 'Armadura Pesada', id: 'armor-heavy' }
    ]
  });

  console.log('❌ Experimento fallido:');
  console.log(`   Misión: ${entry.mission}`);
  console.log(`   Viable: ${entry.viable ? 'SÍ' : 'NO'}`);
  console.log(`   Puntaje: ${entry.score}%`);
  console.log(`   Problema: ${entry.insight}\n`);

  return entry;
}

// =============================================================================
// EJEMPLO 4: Obtener Estadísticas
// =============================================================================

function example4_GetStatistics(experimentLog) {
  console.log('📝 Ejemplo 4: Obtener Estadísticas\n');

  const stats = experimentLog.getStats();

  console.log('📊 Estadísticas del laboratorio:');
  console.log(`   Total de experimentos: ${stats.total}`);
  console.log(`   Seres viables: ${stats.viable}`);
  console.log(`   Seres inviables: ${stats.inviable}`);
  console.log(`   Tasa de éxito: ${stats.viabilityRate.toFixed(2)}%`);
  console.log(`   Puntaje promedio: ${stats.averageScore.toFixed(2)}%\n`);

  return stats;
}

// =============================================================================
// EJEMPLO 5: Filtrar Experimentos
// =============================================================================

function example5_FilterExperiments(experimentLog) {
  console.log('📝 Ejemplo 5: Filtrar Experimentos\n');

  // Solo experimentos viables
  const viableOnes = experimentLog.getFilteredEntries({ viable: true });
  console.log(`✅ Experimentos viables: ${viableOnes.length}`);

  // Solo experimentos inviables
  const inviableOnes = experimentLog.getFilteredEntries({ viable: false });
  console.log(`❌ Experimentos inviables: ${inviableOnes.length}`);

  // Experimentos de una misión específica
  const explorationExperiments = experimentLog.getFilteredEntries({
    mission: 'Exploración Científica'
  });
  console.log(`🔬 Experimentos de exploración: ${explorationExperiments.length}`);

  // Experimentos con puntaje alto
  const highScoreExperiments = experimentLog.getFilteredEntries({
    minScore: 80
  });
  console.log(`⭐ Experimentos con puntaje ≥80: ${highScoreExperiments.length}`);

  // Combinar filtros
  const viableHighScore = experimentLog.getFilteredEntries({
    viable: true,
    minScore: 90
  });
  console.log(`🏆 Experimentos viables con puntaje ≥90: ${viableHighScore.length}\n`);

  return {
    viable: viableOnes,
    inviable: inviableOnes,
    exploration: explorationExperiments,
    highScore: highScoreExperiments,
    viableHighScore
  };
}

// =============================================================================
// EJEMPLO 6: Análisis de Tendencias
// =============================================================================

function example6_AnalyzeTrends(experimentLog) {
  console.log('📝 Ejemplo 6: Análisis de Tendencias\n');

  const stats = experimentLog.getStats();

  // Analizar tendencias
  if (stats.total === 0) {
    console.log('⚠️ No hay experimentos para analizar\n');
    return;
  }

  // Tasa de mejora
  const recentEntries = experimentLog.entries.slice(0, 5);
  const recentAvg = recentEntries.reduce((sum, e) => sum + e.score, 0) / recentEntries.length;

  console.log('📈 Análisis de tendencias:');
  console.log(`   Promedio general: ${stats.averageScore.toFixed(2)}%`);
  console.log(`   Promedio últimos 5: ${recentAvg.toFixed(2)}%`);
  console.log(`   Tendencia: ${recentAvg > stats.averageScore ? '📈 Mejorando' : '📉 Empeorando'}\n`);

  // Misión más exitosa
  const missionStats = {};
  experimentLog.entries.forEach(entry => {
    if (!missionStats[entry.mission]) {
      missionStats[entry.mission] = { total: 0, viable: 0, scoreSum: 0 };
    }
    missionStats[entry.mission].total++;
    if (entry.viable) missionStats[entry.mission].viable++;
    missionStats[entry.mission].scoreSum += entry.score;
  });

  console.log('🎯 Rendimiento por misión:');
  Object.entries(missionStats).forEach(([mission, data]) => {
    const avg = data.scoreSum / data.total;
    const rate = (data.viable / data.total) * 100;
    console.log(`   ${mission}:`);
    console.log(`     - Promedio: ${avg.toFixed(2)}%`);
    console.log(`     - Tasa éxito: ${rate.toFixed(2)}%`);
  });
  console.log('');

  return { missionStats, recentAvg };
}

// =============================================================================
// EJEMPLO 7: Limpiar y Reiniciar
// =============================================================================

function example7_ClearAndReset(experimentLog) {
  console.log('📝 Ejemplo 7: Limpiar y Reiniciar\n');

  const beforeCount = experimentLog.entries.length;
  console.log(`📊 Entradas antes de limpiar: ${beforeCount}`);

  // Limpiar todo el log
  experimentLog.clear();

  const afterCount = experimentLog.entries.length;
  console.log(`🗑️ Entradas después de limpiar: ${afterCount}`);
  console.log(`✅ Log limpiado correctamente\n`);

  return { beforeCount, afterCount };
}

// =============================================================================
// EJEMPLO 8: Integración con UI
// =============================================================================

function example8_UIIntegration() {
  console.log('📝 Ejemplo 8: Integración con UI\n');

  // Simulación de integración completa
  class MockFrankensteinLabUI {
    constructor() {
      this.domCache = {
        experimentLogList: document.getElementById('experiment-log-list'),
        experimentLogMeta: document.getElementById('experiment-log-meta')
      };

      this.missionsSystem = {
        attributes: {
          intelligence: { name: 'Inteligencia', icon: '🧠' },
          strength: { name: 'Fuerza', icon: '💪' },
          agility: { name: 'Agilidad', icon: '⚡' }
        }
      };

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
      this.experimentLog.load();
      console.log('✅ UI inicializada con sistema de log');
    }

    validateBeing(being, mission, pieces) {
      const results = this.performValidation(being, mission);

      const entry = this.experimentLog.record({
        results,
        currentBeing: being,
        selectedMission: mission,
        selectedPieces: pieces
      });

      console.log(`📝 Experimento registrado: ${entry.mission} - ${entry.score}%`);
      return entry;
    }

    performValidation(being, mission) {
      // Mock validation
      const score = Math.random() * 100;
      return {
        viable: score >= 60,
        percentage: score,
        strengths: [{ message: 'Buen balance general' }]
      };
    }

    getCurrentMissionRequirements() {
      return [
        { type: 'attribute', key: 'intelligence', value: 50 }
      ];
    }

    countFulfilledRequirements(reqs) {
      return reqs.length;
    }

    showStats() {
      const stats = this.experimentLog.getStats();
      console.log('\n📊 Estadísticas del laboratorio:');
      console.log(`   Experimentos totales: ${stats.total}`);
      console.log(`   Tasa de éxito: ${stats.viabilityRate.toFixed(2)}%`);
    }

    destroy() {
      this.experimentLog.destroy();
      console.log('🧹 UI destruida');
    }
  }

  // Usar la UI
  const ui = new MockFrankensteinLabUI();
  ui.initialize();

  // Simular validaciones
  ui.validateBeing(
    { attributes: { intelligence: 80, strength: 60 } },
    { name: 'Misión Test' },
    [{ title: 'Pieza 1' }]
  );

  ui.showStats();
  ui.destroy();

  console.log('');
}

// =============================================================================
// EJECUTAR TODOS LOS EJEMPLOS
// =============================================================================

export function runAllExamples() {
  console.log('🚀 Iniciando ejemplos de FrankensteinExperimentLog\n');
  console.log('='.repeat(70) + '\n');

  // Ejemplo 1: Setup
  const experimentLog = example1_BasicSetup();

  // Ejemplo 2: Experimento exitoso
  example2_SuccessfulExperiment(experimentLog);

  // Ejemplo 3: Experimento fallido
  example3_FailedExperiment(experimentLog);

  // Ejemplo 4: Estadísticas
  example4_GetStatistics(experimentLog);

  // Ejemplo 5: Filtros
  example5_FilterExperiments(experimentLog);

  // Ejemplo 6: Análisis
  example6_AnalyzeTrends(experimentLog);

  // Ejemplo 7: Limpiar
  // example7_ClearAndReset(experimentLog); // Comentado para no perder datos

  // Ejemplo 8: Integración UI
  example8_UIIntegration();

  console.log('='.repeat(70));
  console.log('✅ Todos los ejemplos ejecutados correctamente\n');
}

// Exportar ejemplos individuales
export {
  example1_BasicSetup,
  example2_SuccessfulExperiment,
  example3_FailedExperiment,
  example4_GetStatistics,
  example5_FilterExperiments,
  example6_AnalyzeTrends,
  example7_ClearAndReset,
  example8_UIIntegration
};

// Auto-ejecutar si se carga directamente
if (typeof window !== 'undefined' && window.location.search.includes('run-examples')) {
  document.addEventListener('DOMContentLoaded', runAllExamples);
}
