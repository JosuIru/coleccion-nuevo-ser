/**
 * FRANKENSTEIN LAB - DEMO SCENARIOS MODULE
 * Ejemplo de integración y uso
 *
 * @version 1.0.0
 * @author Claude Sonnet 4.5
 * @date 2025-12-28
 */

import { FrankensteinDemoScenarios, createDemoScenariosLegacyWrapper } from './frankenstein-demo-scenarios.js';

/**
 * EJEMPLO 1: Integración Moderna (Recomendada)
 * Usar directamente la instancia de FrankensteinDemoScenarios
 */
class FrankensteinUI_Modern {
  constructor() {
    this.currentBeing = null;
    this.selectedMission = null;
    this.lastValidationResults = null;

    // Inicializar módulo de escenarios demo
    this.demoScenarios = new FrankensteinDemoScenarios(this, {});
  }

  /**
   * Cargar un ser guardado (demo o normal)
   */
  loadBeing(beingId) {
    const savedBeings = this.loadBeings();
    const savedBeing = savedBeings.find(b => b.id === beingId);

    if (!savedBeing) {
      console.error(`Ser ${beingId} no encontrado`);
      return;
    }

    // Aplicar escenario si es un ser demo
    this.demoScenarios.apply(savedBeing);

    // ... resto de lógica de carga
    this.currentBeing = savedBeing.being;
    this.selectedMission = savedBeing.mission;
  }

  /**
   * Añadir pieza al ser actual
   */
  addPiece(piece) {
    // ... lógica de añadir pieza

    // Actualizar progreso de escenario demo
    this.demoScenarios.updateProgress();
  }

  /**
   * Validar el ser actual
   */
  validateBeing() {
    // ... lógica de validación
    this.lastValidationResults = { viable: true };

    // Actualizar progreso de escenario demo
    this.demoScenarios.updateProgress();
  }

  /**
   * Cambiar misión activa
   */
  selectMission(mission) {
    this.selectedMission = mission;

    // Actualizar progreso de escenario demo
    this.demoScenarios.updateProgress();
  }

  /**
   * Limpiar escenario demo
   */
  clearDemoScenario() {
    this.demoScenarios.apply(null);
  }

  loadBeings() {
    // Mock - en producción leer de localStorage
    return [];
  }
}

/**
 * EJEMPLO 2: Integración Legacy (Backward Compatible)
 * Usar wrapper de compatibilidad para código antiguo
 */
class FrankensteinUI_Legacy {
  constructor() {
    this.currentBeing = null;
    this.selectedMission = null;
    this.lastValidationResults = null;
    this.activeDemoScenario = null;

    // Crear wrapper legacy
    const wrapper = createDemoScenariosLegacyWrapper(this);

    // Asignar métodos legacy al prototipo
    this.applyDemoScenario = wrapper.applyDemoScenario.bind(wrapper);
    this.renderDemoScenarioCard = wrapper.renderDemoScenarioCard.bind(wrapper);
    this.evaluateScenarioObjective = wrapper.evaluateScenarioObjective.bind(wrapper);
    this.updateDemoScenarioProgress = wrapper.updateDemoScenarioProgress.bind(wrapper);

    // Guardar instancia interna para acceso directo
    this._demoScenariosInstance = wrapper._instance;
  }

  /**
   * Cargar ser usando método legacy
   */
  loadBeing(beingId) {
    const savedBeings = this.loadBeings();
    const savedBeing = savedBeings.find(b => b.id === beingId);

    if (!savedBeing) return;

    // Usar método legacy
    this.applyDemoScenario(savedBeing);

    this.currentBeing = savedBeing.being;
    this.selectedMission = savedBeing.mission;
  }

  /**
   * Actualizar progreso usando método legacy
   */
  onPieceAdded() {
    // ... lógica
    this.updateDemoScenarioProgress();
  }

  loadBeings() {
    return [];
  }
}

/**
 * EJEMPLO 3: Uso Directo del Módulo
 * Sin integración en FrankensteinUI
 */
const standaloneExample = () => {
  // Crear mock de labUI
  const mockLabUI = {
    currentBeing: {
      attributes: { wisdom: 95, empathy: 88 }
    },
    selectedMission: {
      id: 'consciousness-awakener'
    },
    lastValidationResults: { viable: true }
  };

  // Crear instancia del módulo
  const demoScenarios = new FrankensteinDemoScenarios(mockLabUI, {});

  // Aplicar escenario
  const savedBeing = {
    id: 'demo-philosopher-002',
    name: 'Sabio Contemplativo'
  };
  demoScenarios.apply(savedBeing);

  // Evaluar un objetivo específico
  const objective = {
    type: 'attribute',
    attribute: 'wisdom',
    target: 90,
    label: 'Sabiduría ≥ 90'
  };
  const result = demoScenarios.evaluate(objective);
  console.log('Objetivo cumplido:', result.fulfilled);
  console.log('Progreso:', result.progressText);

  // Actualizar progreso
  demoScenarios.updateProgress();

  // Limpiar
  demoScenarios.destroy();
};

/**
 * EJEMPLO 4: Evaluación Manual de Objetivos
 */
const evaluateObjectivesExample = () => {
  const mockLabUI = {
    currentBeing: {
      attributes: { wisdom: 98, empathy: 85, courage: 70 }
    },
    selectedMission: { id: 'earth-defender' },
    lastValidationResults: null
  };

  const demoScenarios = new FrankensteinDemoScenarios(mockLabUI, {});

  // Definir múltiples objetivos
  const objectives = [
    {
      type: 'attribute',
      attribute: 'wisdom',
      target: 95,
      label: 'Sabiduría ≥ 95'
    },
    {
      type: 'mission',
      missionId: 'earth-defender',
      label: 'Activar Defensor de la Tierra'
    },
    {
      type: 'validation',
      label: 'Validar el ser'
    }
  ];

  // Evaluar todos
  objectives.forEach(obj => {
    const result = demoScenarios.evaluate(obj);
    console.log(`${obj.label}:`, result.fulfilled ? '✅' : '❌', result.progressText);
  });
};

/**
 * EJEMPLO 5: Testing y Debugging
 */
const debugExample = () => {
  const mockLabUI = {
    currentBeing: {
      attributes: { wisdom: 50 }
    },
    selectedMission: null,
    lastValidationResults: null
  };

  const demoScenarios = new FrankensteinDemoScenarios(mockLabUI, {});

  // Aplicar escenario de prueba
  window.FrankensteinDemoData = {
    getDemoScenario: () => ({
      title: 'Test Scenario',
      intro: 'Testing the module',
      objectives: [
        { type: 'attribute', attribute: 'wisdom', target: 100, label: 'High Wisdom' }
      ]
    })
  };

  window.FrankensteinQuiz = {
    getMode: () => 'demo'
  };

  const testBeing = { id: 'demo-test-001' };
  demoScenarios.apply(testBeing);

  // Verificar estado
  console.log('Escenario activo:', demoScenarios.currentScenario);
  console.log('BeingId:', demoScenarios.currentScenario?.beingId);

  // Evaluar objetivo
  const objective = demoScenarios.currentScenario.objectives[0];
  const result = demoScenarios.evaluate(objective);
  console.log('Objetivo:', result);
};

/**
 * EJEMPLO 6: Integración con EventManager
 */
const eventIntegrationExample = () => {
  class FrankensteinUI_WithEvents {
    constructor() {
      this.currentBeing = null;
      this.demoScenarios = new FrankensteinDemoScenarios(this, {});

      // Escuchar eventos
      this.setupEventListeners();
    }

    setupEventListeners() {
      // Cuando se añade pieza
      document.addEventListener('frankenstein:piece-added', () => {
        this.demoScenarios.updateProgress();
      });

      // Cuando se valida ser
      document.addEventListener('frankenstein:being-validated', () => {
        this.demoScenarios.updateProgress();
      });

      // Cuando se cambia misión
      document.addEventListener('frankenstein:mission-changed', () => {
        this.demoScenarios.updateProgress();
      });

      // Cuando se carga ser
      document.addEventListener('frankenstein:being-loaded', (e) => {
        this.demoScenarios.apply(e.detail.being);
      });
    }
  }

  return new FrankensteinUI_WithEvents();
};

// Exportar ejemplos
export {
  FrankensteinUI_Modern,
  FrankensteinUI_Legacy,
  standaloneExample,
  evaluateObjectivesExample,
  debugExample,
  eventIntegrationExample
};

// Hacer ejemplos disponibles globalmente
if (typeof window !== 'undefined') {
  window.DemoScenariosExamples = {
    modern: FrankensteinUI_Modern,
    legacy: FrankensteinUI_Legacy,
    standalone: standaloneExample,
    evaluate: evaluateObjectivesExample,
    debug: debugExample,
    events: eventIntegrationExample
  };
}
