/**
 * DIAGNOSTIC TOOL
 * Herramienta de diagnóstico para verificar qué features están disponibles
 *
 * USO: Abrir consola del navegador y ejecutar:
 * window.diagnosticTool.runFullDiagnostic()
 *
 * @version 1.0.0
 */

class DiagnosticTool {
  constructor() {
    this.results = [];
  }

  /**
   * Ejecutar diagnóstico completo
   */
  runFullDiagnostic() {
    console.log('%c🔍 INICIANDO DIAGNÓSTICO COMPLETO', 'background: #4CAF50; color: white; padding: 10px; font-size: 16px; font-weight: bold');
    console.log('%c═══════════════════════════════════', 'color: #4CAF50');

    this.results = [];

    // 1. Información del entorno
    this.checkEnvironment();

    // 2. Verificar módulos globales críticos
    this.checkCoreModules();

    // 3. Verificar lazy loader
    this.checkLazyLoader();

    // 4. Verificar features
    this.checkFeatures();

    // 5. Verificar navegación
    this.checkNavigation();

    // 6. Mostrar resumen
    this.showSummary();

    return this.results;
  }

  /**
   * Verificar entorno
   */
  checkEnvironment() {
    console.log('\n%c📱 ENTORNO', 'background: #2196F3; color: white; padding: 5px; font-weight: bold');

    const env = {
      'User Agent': navigator.userAgent,
      'Window Width': window.innerWidth,
      'Window Height': window.innerHeight,
      'Platform': navigator.platform,
      'Is Capacitor': typeof Capacitor !== 'undefined',
      'Is Native': window.isNative || false,
      'App Version': window.__APP_VERSION__ || 'unknown',
      'Environment': window.__ENVIRONMENT__ || 'unknown'
    };

    for (const [key, value] of Object.entries(env)) {
      console.log(`  ${key}: ${value}`);
      this.results.push({ category: 'Entorno', item: key, status: '✅', value });
    }
  }

  /**
   * Verificar módulos críticos
   */
  checkCoreModules() {
    console.log('\n%c🔧 MÓDULOS CRÍTICOS', 'background: #FF9800; color: white; padding: 5px; font-weight: bold');

    const modules = [
      'logger',
      'StorageHelper',
      'eventBus',
      'bookEngine',
      'biblioteca',
      'lazyLoader',
      'authHelper',
      'syncBridge',
      'analyticsHelper'
    ];

    modules.forEach(moduleName => {
      const exists = typeof window[moduleName] !== 'undefined';
      const status = exists ? '✅' : '❌';
      const value = exists ? 'Cargado' : 'NO ENCONTRADO';

      console.log(`  ${status} ${moduleName}: ${value}`);
      this.results.push({ category: 'Módulos Críticos', item: moduleName, status, value });
    });
  }

  /**
   * Verificar lazy loader
   */
  checkLazyLoader() {
    console.log('\n%c⏳ LAZY LOADER', 'background: #9C27B0; color: white; padding: 5px; font-weight: bold');

    if (!window.lazyLoader) {
      console.log('  ❌ LazyLoader no está disponible');
      this.results.push({ category: 'LazyLoader', item: 'Disponibilidad', status: '❌', value: 'NO ENCONTRADO' });
      return;
    }

    console.log('  ✅ LazyLoader disponible');
    this.results.push({ category: 'LazyLoader', item: 'Disponibilidad', status: '✅', value: 'Cargado' });

    // Verificar método load()
    const hasLoadMethod = typeof window.lazyLoader.load === 'function';
    const loadStatus = hasLoadMethod ? '✅' : '❌';
    console.log(`  ${loadStatus} Método load(): ${hasLoadMethod ? 'Disponible' : 'NO ENCONTRADO'}`);
    this.results.push({ category: 'LazyLoader', item: 'Método load()', status: loadStatus, value: hasLoadMethod ? 'Disponible' : 'NO ENCONTRADO' });

    // Mostrar módulos cargados
    if (window.lazyLoader.loadedModules) {
      const loaded = Array.from(window.lazyLoader.loadedModules.keys());
      console.log(`  📦 Módulos cargados (${loaded.length}): ${loaded.join(', ') || 'ninguno'}`);
      this.results.push({ category: 'LazyLoader', item: 'Módulos cargados', status: '✅', value: loaded.length });
    }
  }

  /**
   * Verificar features
   */
  checkFeatures() {
    console.log('\n%c🎯 FEATURES', 'background: #E91E63; color: white; padding: 5px; font-weight: bold');

    const features = [
      { name: 'AIChatModal', key: 'AIChatModal', description: 'Chat IA' },
      { name: 'ExplorationHub', key: 'ExplorationHub', description: 'Hub de Exploración' },
      { name: 'BrujulaRecursos', key: 'brujulaRecursos', description: 'Brújula de Recursos' },
      { name: 'SettingsModal', key: 'settingsModal', description: 'Configuración' },
      { name: 'NotesModal', key: 'notesModal', description: 'Notas' },
      { name: 'AudioReader', key: 'audioReader', description: 'Reproductor de Audio' },
      { name: 'PracticeLibrary', key: 'practiceLibrary', description: 'Biblioteca de Prácticas' },
      { name: 'ProgressDashboard', key: 'progressDashboard', description: 'Panel de Progreso' },
      { name: 'HelpCenter', key: 'helpCenter', description: 'Centro de Ayuda' },
      { name: 'MyAccountModal', key: 'myAccountModal', description: 'Mi Cuenta' },
      { name: 'UpdateModal', key: 'updateModal', description: 'Modal de Actualizaciones' },
      { name: 'WelcomeFlow', key: 'welcomeFlow', description: 'Flujo de Bienvenida' }
    ];

    features.forEach(({ name, key, description }) => {
      const exists = typeof window[key] !== 'undefined';
      const status = exists ? '✅' : '❌';
      const value = exists ? 'Disponible' : 'NO CARGADO';

      console.log(`  ${status} ${name} (${description}): ${value}`);
      this.results.push({ category: 'Features', item: description, status, value });
    });
  }

  /**
   * Verificar navegación
   */
  checkNavigation() {
    console.log('\n%c🧭 NAVEGACIÓN', 'background: #00BCD4; color: white; padding: 5px; font-weight: bold');

    const navElements = [
      { selector: '.app-bottom-nav', name: 'Bottom Navigation (móvil)' },
      { selector: '#more-options-btn-bib', name: 'Botón Más Opciones' },
      { selector: '#exploration-hub-btn-bib', name: 'Botón Explorar' },
      { selector: '#practice-library-btn-bib', name: 'Botón Prácticas' },
      { selector: '#progress-dashboard-btn-bib', name: 'Botón Progreso' },
      { selector: '#help-center-btn-bib', name: 'Botón Ayuda' }
    ];

    navElements.forEach(({ selector, name }) => {
      const element = document.querySelector(selector);
      const exists = !!element;
      const status = exists ? '✅' : '❌';
      const value = exists ? 'Presente en DOM' : 'NO ENCONTRADO';

      console.log(`  ${status} ${name}: ${value}`);
      this.results.push({ category: 'Navegación', item: name, status, value });
    });
  }

  /**
   * Mostrar resumen
   */
  showSummary() {
    console.log('\n%c📊 RESUMEN', 'background: #4CAF50; color: white; padding: 10px; font-size: 14px; font-weight: bold');

    const total = this.results.length;
    const ok = this.results.filter(r => r.status === '✅').length;
    const errors = this.results.filter(r => r.status === '❌').length;
    const warnings = this.results.filter(r => r.status === '⚠️').length;

    console.log(`  Total de verificaciones: ${total}`);
    console.log(`  ✅ Exitosas: ${ok}`);
    console.log(`  ❌ Fallidas: ${errors}`);
    console.log(`  ⚠️  Advertencias: ${warnings}`);

    if (errors > 0) {
      console.log('\n%c❌ PROBLEMAS DETECTADOS:', 'background: #F44336; color: white; padding: 5px; font-weight: bold');
      this.results
        .filter(r => r.status === '❌')
        .forEach(r => {
          console.log(`  - ${r.category} → ${r.item}: ${r.value}`);
        });
    } else {
      console.log('\n%c✅ TODO OK - No se detectaron problemas', 'background: #4CAF50; color: white; padding: 5px; font-weight: bold');
    }

    console.log('\n%c═══════════════════════════════════', 'color: #4CAF50');
    console.log('%c🔍 DIAGNÓSTICO COMPLETADO', 'background: #4CAF50; color: white; padding: 10px; font-size: 16px; font-weight: bold');
  }

  /**
   * Probar feature específico
   */
  testFeature(featureName) {
    console.log(`%c🧪 PROBANDO FEATURE: ${featureName}`, 'background: #673AB7; color: white; padding: 5px; font-weight: bold');

    const feature = window[featureName];
    if (!feature) {
      console.log(`  ❌ Feature ${featureName} NO está disponible`);
      return false;
    }

    console.log(`  ✅ Feature ${featureName} está disponible`);
    console.log('  📝 Métodos disponibles:');
    console.dir(Object.getOwnPropertyNames(Object.getPrototypeOf(feature)));

    return true;
  }

  /**
   * Probar botón específico
   */
  testButton(buttonId) {
    console.log(`%c🔘 PROBANDO BOTÓN: ${buttonId}`, 'background: #FF5722; color: white; padding: 5px; font-weight: bold');

    const button = document.getElementById(buttonId);
    if (!button) {
      console.log(`  ❌ Botón ${buttonId} NO encontrado en DOM`);
      return false;
    }

    console.log(`  ✅ Botón ${buttonId} encontrado`);
    console.log(`  📍 Texto: ${button.textContent.trim()}`);
    console.log(`  📍 Visible: ${button.offsetParent !== null}`);
    console.log(`  📍 Classes: ${button.className}`);

    return true;
  }

  /**
   * Exportar reporte
   */
  exportReport() {
    const report = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      windowSize: { width: window.innerWidth, height: window.innerHeight },
      appVersion: window.__APP_VERSION__,
      results: this.results
    };

    console.log('\n%c📄 REPORTE EXPORTADO', 'background: #607D8B; color: white; padding: 5px; font-weight: bold');
    console.log(JSON.stringify(report, null, 2));

    return report;
  }
}

// Crear instancia global
window.diagnosticTool = new DiagnosticTool();

// Mensaje de ayuda
console.log('%c🔍 Diagnostic Tool Cargado', 'background: #4CAF50; color: white; padding: 10px; font-weight: bold');
console.log('%cEjecuta: window.diagnosticTool.runFullDiagnostic()', 'color: #2196F3; font-size: 14px; font-weight: bold');
console.log('Otros comandos disponibles:');
console.log('  - window.diagnosticTool.testFeature("nombreFeature")');
console.log('  - window.diagnosticTool.testButton("id-boton")');
console.log('  - window.diagnosticTool.exportReport()');
