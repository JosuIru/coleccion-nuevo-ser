/**
 * FRANKENSTEIN LAB - DEMO SCENARIOS MODULE TESTS
 * Tests de validación para el módulo de escenarios demo
 *
 * @version 1.0.0
 * @author Claude Sonnet 4.5
 * @date 2025-12-28
 */

import { FrankensteinDemoScenarios } from './frankenstein-demo-scenarios.js';

/**
 * Mock de FrankensteinUI para testing
 */
class MockFrankensteinUI {
  constructor() {
    this.currentBeing = {
      attributes: {
        wisdom: 98,
        empathy: 85,
        courage: 70,
        creativity: 92,
        consciousness: 97
      }
    };
    this.selectedMission = {
      id: 'consciousness-awakener',
      name: 'Despertador de Consciencia'
    };
    this.lastValidationResults = {
      viable: true
    };
  }
}

/**
 * Mock de FrankensteinDemoData
 */
const mockDemoData = {
  getDemoScenario(beingId) {
    const scenarios = {
      'demo-philosopher-002': {
        title: 'Ruta del Sabio Contemplativo',
        intro: 'Explora el puente entre conciencia y tecnología.',
        objectives: [
          {
            id: 'mission-conscious',
            type: 'mission',
            missionId: 'consciousness-awakener',
            label: 'Activa la misión Despertador de Consciencia'
          },
          {
            id: 'attr-wisdom',
            type: 'attribute',
            attribute: 'wisdom',
            target: 100,
            label: 'Sabiduría ≥ 100'
          },
          {
            id: 'validation-check',
            type: 'validation',
            label: 'Validar el ser'
          }
        ],
        tips: ['Refuerza Sabiduría con piezas filosóficas'],
        callToAction: 'Objetivo educativo: analizar balance espiritual.'
      }
    };
    return scenarios[beingId] || null;
  }
};

/**
 * Tests principales
 */
const runTests = () => {
  console.group('🧪 FRANKENSTEIN DEMO SCENARIOS TESTS');

  let mockLabUI;
  let demoScenarios;

  // Setup
  beforeEach();

  function beforeEach() {
    mockLabUI = new MockFrankensteinUI();
    demoScenarios = new FrankensteinDemoScenarios(mockLabUI, {});
    window.FrankensteinDemoData = mockDemoData;
    window.FrankensteinQuiz = {
      getMode: () => 'demo'
    };
  }

  // Test 1: Construcción del módulo
  test('Constructor debe inicializar correctamente', () => {
    assert(demoScenarios.labUI === mockLabUI, 'labUI debe estar asignado');
    assert(demoScenarios.currentScenario === null, 'currentScenario debe iniciar null');
  });

  // Test 2: Aplicar escenario demo
  test('apply() debe cargar escenario demo válido', () => {
    const savedBeing = { id: 'demo-philosopher-002' };
    demoScenarios.apply(savedBeing);

    assert(demoScenarios.currentScenario !== null, 'currentScenario no debe ser null');
    assert(demoScenarios.currentScenario.title === 'Ruta del Sabio Contemplativo', 'Título debe coincidir');
    assert(demoScenarios.currentScenario.beingId === 'demo-philosopher-002', 'beingId debe estar asignado');
  });

  // Test 3: Limpiar escenario
  test('apply(null) debe limpiar escenario', () => {
    demoScenarios.currentScenario = { title: 'Test' };
    demoScenarios.apply(null);

    assert(demoScenarios.currentScenario === null, 'currentScenario debe ser null tras limpiar');
  });

  // Test 4: Evaluación de objetivo de atributo cumplido
  test('evaluate() debe evaluar atributo cumplido correctamente', () => {
    const objective = {
      type: 'attribute',
      attribute: 'wisdom',
      target: 95,
      label: 'Sabiduría ≥ 95'
    };

    const result = demoScenarios.evaluate(objective);

    assert(result.fulfilled === true, 'Atributo debe estar cumplido (98 >= 95)');
    assert(result.progressText === '98/95', 'Progreso debe ser "98/95"');
    assert(result.label === 'Sabiduría ≥ 95', 'Label debe coincidir');
  });

  // Test 5: Evaluación de objetivo de atributo pendiente
  test('evaluate() debe evaluar atributo pendiente correctamente', () => {
    const objective = {
      type: 'attribute',
      attribute: 'wisdom',
      target: 100,
      label: 'Sabiduría ≥ 100'
    };

    const result = demoScenarios.evaluate(objective);

    assert(result.fulfilled === false, 'Atributo no debe estar cumplido (98 < 100)');
    assert(result.progressText === '98/100', 'Progreso debe ser "98/100"');
  });

  // Test 6: Evaluación de objetivo de misión cumplida
  test('evaluate() debe evaluar misión cumplida correctamente', () => {
    const objective = {
      type: 'mission',
      missionId: 'consciousness-awakener',
      label: 'Activa misión específica'
    };

    const result = demoScenarios.evaluate(objective);

    assert(result.fulfilled === true, 'Misión debe estar cumplida');
    assert(result.progressText === 'Misión activa', 'Texto debe indicar misión activa');
  });

  // Test 7: Evaluación de objetivo de misión pendiente
  test('evaluate() debe evaluar misión pendiente correctamente', () => {
    const objective = {
      type: 'mission',
      missionId: 'earth-defender',
      label: 'Activa otra misión'
    };

    const result = demoScenarios.evaluate(objective);

    assert(result.fulfilled === false, 'Misión no debe estar cumplida');
    assert(result.progressText === 'Activa la misión sugerida', 'Texto debe indicar pendiente');
  });

  // Test 8: Evaluación de objetivo de validación cumplida
  test('evaluate() debe evaluar validación cumplida correctamente', () => {
    const objective = {
      type: 'validation',
      label: 'Validar el ser'
    };

    const result = demoScenarios.evaluate(objective);

    assert(result.fulfilled === true, 'Validación debe estar cumplida');
    assert(result.progressText === 'Ser validado', 'Texto debe indicar validado');
  });

  // Test 9: Evaluación de objetivo de validación pendiente
  test('evaluate() debe evaluar validación pendiente correctamente', () => {
    mockLabUI.lastValidationResults = null;

    const objective = {
      type: 'validation',
      label: 'Validar el ser'
    };

    const result = demoScenarios.evaluate(objective);

    assert(result.fulfilled === false, 'Validación no debe estar cumplida');
    assert(result.progressText === 'Pendiente de validación', 'Texto debe indicar pendiente');

    // Restaurar estado
    mockLabUI.lastValidationResults = { viable: true };
  });

  // Test 10: Actualizar progreso
  test('updateProgress() debe re-renderizar cuando hay escenario activo', () => {
    let renderCalled = false;
    demoScenarios.render = () => { renderCalled = true; };

    demoScenarios.currentScenario = { title: 'Test' };
    demoScenarios.updateProgress();

    assert(renderCalled === true, 'render() debe haber sido llamado');
  });

  // Test 11: Actualizar progreso sin escenario
  test('updateProgress() no debe hacer nada sin escenario activo', () => {
    let renderCalled = false;
    demoScenarios.render = () => { renderCalled = true; };

    demoScenarios.currentScenario = null;
    demoScenarios.updateProgress();

    assert(renderCalled === false, 'render() no debe haber sido llamado');
  });

  // Test 12: Destroy debe limpiar recursos
  test('destroy() debe limpiar recursos correctamente', () => {
    demoScenarios.currentScenario = { title: 'Test' };
    demoScenarios.destroy();

    assert(demoScenarios.currentScenario === null, 'currentScenario debe ser null');
    assert(demoScenarios.labUI === null, 'labUI debe ser null');
    assert(demoScenarios.dom === null, 'dom debe ser null');
  });

  console.groupEnd();
  console.log('✅ Todos los tests pasaron correctamente');
};

/**
 * Utilidades de testing
 */
function test(description, testFn) {
  try {
    testFn();
    console.log(`✅ ${description}`);
  } catch (error) {
    console.error(`❌ ${description}`);
    console.error('   Error:', error.message);
    throw error;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

// Ejecutar tests si se importa directamente
if (typeof window !== 'undefined') {
  window.runDemoScenariosTests = runTests;
}

export { runTests };
