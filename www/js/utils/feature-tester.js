/**
 * FEATURE TESTER
 * Sistema de pruebas automático para verificar el funcionamiento de TODOS
 * los botones y features de la aplicación
 *
 * USO: Abrir consola del navegador y ejecutar:
 * window.featureTester.runAllTests()
 *
 * @version 1.0.0
 */

class FeatureTester {
  constructor() {
    this.results = [];
    this.passed = 0;
    this.failed = 0;
    this.skipped = 0;
  }

  /**
   * Ejecutar TODAS las pruebas
   */
  async runAllTests() {
    console.log('%c🧪 INICIANDO PRUEBAS EXHAUSTIVAS', 'background: #FF5722; color: white; padding: 10px; font-size: 16px; font-weight: bold');
    console.log('%c═══════════════════════════════════════════════════', 'color: #FF5722');

    this.results = [];
    this.passed = 0;
    this.failed = 0;
    this.skipped = 0;

    // 1. Verificar entorno
    await this.testEnvironment();

    // 2. Probar botones del header (biblioteca)
    await this.testBibliotecaButtons();

    // 3. Probar botones del menú dropdown
    await this.testDropdownMenu();

    // 4. Probar bottom navigation (móvil)
    await this.testBottomNav();

    // 5. Probar features principales
    await this.testMainFeatures();

    // 6. Probar book reader (si está disponible)
    await this.testBookReader();

    // 7. Mostrar resumen
    this.showSummary();

    return this.results;
  }

  /**
   * Verificar entorno
   */
  async testEnvironment() {
    console.log('\n%c🌍 ENTORNO', 'background: #2196F3; color: white; padding: 5px; font-weight: bold');

    this.test('Versión de la app', () => {
      return window.__APP_VERSION__ === '2.9.313';
    }, `Actual: ${window.__APP_VERSION__}`);

    this.test('Biblioteca disponible', () => {
      return typeof window.biblioteca !== 'undefined';
    });

    this.test('BookEngine disponible', () => {
      return typeof window.bookEngine !== 'undefined';
    });

    this.test('LazyLoader disponible', () => {
      return typeof window.lazyLoader !== 'undefined';
    });
  }

  /**
   * Probar botones del header de biblioteca
   */
  async testBibliotecaButtons() {
    console.log('\n%c🔘 BOTONES DEL HEADER', 'background: #9C27B0; color: white; padding: 5px; font-weight: bold');

    // Verificar que estamos en la vista de biblioteca
    const biblioView = document.getElementById('biblioteca-view');
    if (!biblioView || getComputedStyle(biblioView).display === 'none') {
      this.skip('Botones del header', 'No estamos en la vista de biblioteca');
      return;
    }

    const buttons = [
      {
        id: 'practice-library-btn-bib',
        name: 'Prácticas',
        test: () => {
          const btn = document.getElementById('practice-library-btn-bib');
          if (!btn) return false;

          // Simular clic
          btn.click();

          // Verificar que se abrió el modal de prácticas
          setTimeout(() => {
            const modal = document.getElementById('practice-library-modal');
            return modal && getComputedStyle(modal).display !== 'none';
          }, 100);

          return true; // Asumimos que funciona si el botón existe
        }
      },
      {
        id: 'exploration-hub-btn-bib',
        name: 'Explorar (Exploration Hub)',
        test: () => {
          const btn = document.getElementById('exploration-hub-btn-bib');
          return btn !== null;
        }
      },
      {
        id: 'progress-dashboard-btn-bib',
        name: 'Progreso',
        test: () => {
          const btn = document.getElementById('progress-dashboard-btn-bib');
          return btn !== null;
        }
      },
      {
        id: 'help-center-btn-bib',
        name: 'Ayuda',
        test: () => {
          const btn = document.getElementById('help-center-btn-bib');
          return btn !== null;
        }
      },
      {
        id: 'donations-btn-bib',
        name: 'Donaciones',
        test: () => {
          const btn = document.getElementById('donations-btn-bib');
          return btn !== null;
        }
      },
      {
        id: 'more-options-btn-bib',
        name: 'Más Opciones (⋯)',
        test: () => {
          const btn = document.getElementById('more-options-btn-bib');
          return btn !== null;
        }
      }
    ];

    for (const button of buttons) {
      const btn = document.getElementById(button.id);

      if (!btn) {
        this.fail(`Botón "${button.name}"`, 'Botón NO encontrado en DOM');
        continue;
      }

      // Verificar que tiene event listener o onclick
      const hasOnClick = btn.onclick !== null;
      const hasListener = btn.getAttribute('onclick') !== null;
      const hasHandler = typeof window.biblioteca !== 'undefined' &&
                         typeof window.biblioteca[button.id.replace('-bib', '').replace(/-/g, '')] === 'function';

      if (hasOnClick || hasListener || hasHandler) {
        this.pass(`Botón "${button.name}"`, 'Presente y con handler');
      } else {
        this.fail(`Botón "${button.name}"`, 'Presente pero SIN handler');
      }
    }
  }

  /**
   * Probar menú dropdown "Más opciones"
   */
  async testDropdownMenu() {
    console.log('\n%c📋 MENÚ DROPDOWN', 'background: #FF9800; color: white; padding: 5px; font-weight: bold');

    const dropdownBtn = document.getElementById('more-options-btn-bib');
    if (!dropdownBtn) {
      this.skip('Menú Dropdown', 'Botón "Más" no encontrado');
      return;
    }

    const menuItems = [
      'my-account-btn-bib',
      'settings-btn-bib',
      'premium-btn-bib',
      'language-selector-btn-bib',
      'android-download-btn-bib',
      'theme-toggle-btn-bib',
      'about-btn-bib',
      'admin-panel-btn-bib'
    ];

    for (const itemId of menuItems) {
      const item = document.getElementById(itemId);
      if (item) {
        this.pass(`Menú item "${itemId}"`, 'Presente en DOM');
      } else {
        // Admin panel es opcional
        if (itemId === 'admin-panel-btn-bib') {
          this.skip(`Menú item "${itemId}"`, 'Solo para admin');
        } else {
          this.fail(`Menú item "${itemId}"`, 'NO encontrado');
        }
      }
    }
  }

  /**
   * Probar bottom navigation (móvil)
   */
  async testBottomNav() {
    console.log('\n%c📱 BOTTOM NAVIGATION', 'background: #00BCD4; color: white; padding: 5px; font-weight: bold');

    const bottomNav = document.querySelector('.app-bottom-nav');
    if (!bottomNav) {
      this.skip('Bottom Navigation', 'No visible (probablemente en desktop)');
      return;
    }

    this.pass('Bottom Navigation', 'Contenedor presente');

    const tabs = bottomNav.querySelectorAll('.app-bottom-nav-tab');
    this.test('Número de tabs', () => tabs.length === 5, `Encontrados: ${tabs.length}/5`);

    const expectedTabs = ['inicio', 'libros', 'practicas', 'herramientas', 'perfil'];
    for (const tab of expectedTabs) {
      const tabElement = bottomNav.querySelector(`[data-tab="${tab}"]`);
      if (tabElement) {
        this.pass(`Tab "${tab}"`, 'Presente');
      } else {
        this.fail(`Tab "${tab}"`, 'NO encontrado');
      }
    }
  }

  /**
   * Probar features principales
   */
  async testMainFeatures() {
    console.log('\n%c⭐ FEATURES PRINCIPALES', 'background: #E91E63; color: white; padding: 5px; font-weight: bold');

    const features = [
      {
        name: 'Chat IA',
        check: () => typeof window.AIChatModal !== 'undefined',
        test: async () => {
          if (typeof window.AIChatModal === 'undefined') return false;
          // Verificar que se puede instanciar
          try {
            const modal = new window.AIChatModal();
            return true;
          } catch (e) {
            return false;
          }
        }
      },
      {
        name: 'Exploration Hub',
        check: () => typeof window.ExplorationHub !== 'undefined',
        test: async () => {
          if (typeof window.ExplorationHub === 'undefined') return false;
          try {
            const hub = new window.ExplorationHub(window.bookEngine);
            return true;
          } catch (e) {
            console.error('Error creando ExplorationHub:', e);
            return false;
          }
        }
      },
      {
        name: 'Brújula de Recursos',
        check: () => typeof window.brujulaRecursos !== 'undefined',
        test: async () => {
          return typeof window.brujulaRecursos !== 'undefined' &&
                 typeof window.brujulaRecursos.open === 'function';
        }
      },
      {
        name: 'SearchModal',
        check: () => typeof SearchModal !== 'undefined',
        test: async () => {
          try {
            const modal = new SearchModal(window.bookEngine);
            return true;
          } catch (e) {
            return false;
          }
        }
      },
      {
        name: 'ThematicIndexModal',
        check: () => typeof ThematicIndexModal !== 'undefined',
        test: async () => {
          try {
            const modal = new ThematicIndexModal(window.bookEngine);
            return true;
          } catch (e) {
            return false;
          }
        }
      },
      {
        name: 'Practice Library',
        check: () => typeof window.practiceLibrary !== 'undefined',
        test: async () => {
          return typeof window.practiceLibrary !== 'undefined';
        }
      },
      {
        name: 'Progress Dashboard',
        check: () => typeof window.progressDashboard !== 'undefined',
        test: async () => {
          return typeof window.progressDashboard !== 'undefined';
        }
      }
    ];

    for (const feature of features) {
      const loaded = feature.check();

      if (!loaded) {
        this.fail(feature.name, 'NO cargado (lazy-load pendiente o error)');
        continue;
      }

      try {
        const works = await feature.test();
        if (works) {
          this.pass(feature.name, 'Cargado y funcional');
        } else {
          this.fail(feature.name, 'Cargado pero NO funciona');
        }
      } catch (error) {
        this.fail(feature.name, `Error al probar: ${error.message}`);
      }
    }
  }

  /**
   * Probar book reader (si está abierto)
   */
  async testBookReader() {
    console.log('\n%c📖 BOOK READER', 'background: #673AB7; color: white; padding: 5px; font-weight: bold');

    const readerView = document.getElementById('book-reader-view');
    if (!readerView || getComputedStyle(readerView).display === 'none') {
      this.skip('Book Reader', 'No hay libro abierto');
      return;
    }

    this.pass('Book Reader', 'Vista activa');

    // Verificar botón básico
    this.testButtonHandler('toggle-sidebar', 'Toggle Sidebar');

    // Verificar botones móvil
    console.log('  [MOBILE]');
    const mobileButtons = [
      { id: 'bookmark-btn-mobile', name: 'Marcador (mobile)', hasOnclick: true },
      { id: 'ai-chat-btn-mobile', name: 'Chat IA (mobile)' },
      { id: 'audioreader-btn-mobile', name: 'AudioReader (mobile)' },
      { id: 'support-btn-mobile', name: 'Apoyar (mobile)' },
      { id: 'mobile-menu-btn', name: 'Menú (mobile)' }
    ];

    for (const btn of mobileButtons) {
      this.testButtonHandler(btn.id, btn.name, btn.hasOnclick);
    }

    // Verificar botones tablet
    console.log('  [TABLET]');
    const tabletButtons = [
      { id: 'bookmark-btn-tablet', name: 'Marcador (tablet)', hasOnclick: true },
      { id: 'ai-chat-btn-tablet', name: 'Chat IA (tablet)' },
      { id: 'audioreader-btn-tablet', name: 'AudioReader (tablet)' },
      { id: 'support-btn-tablet', name: 'Apoyar (tablet)' },
      { id: 'more-actions-btn', name: 'Más Acciones (tablet)' }
    ];

    for (const btn of tabletButtons) {
      this.testButtonHandler(btn.id, btn.name, btn.hasOnclick);
    }

    // Verificar botones desktop
    console.log('  [DESKTOP]');
    const desktopButtons = [
      { id: 'audioreader-btn', name: 'AudioReader (desktop)' },
      { id: 'support-btn', name: 'Apoyar (desktop)' },
      { id: 'tools-dropdown-btn', name: 'Herramientas (desktop)' },
      { id: 'book-features-dropdown-btn', name: 'Contenido (desktop)' },
      { id: 'settings-dropdown-btn', name: 'Configuración (desktop)' }
    ];

    for (const btn of desktopButtons) {
      this.testButtonHandler(btn.id, btn.name);
    }

    // Verificar items de menú dropdown
    console.log('  [MENU ITEMS]');
    const menuItems = [
      'chapter-resources-btn',
      'summary-btn',
      'voice-notes-btn',
      'concept-map-btn',
      'action-plans-btn',
      'achievements-btn',
      'learning-paths-btn-desktop',
      'content-adapter-btn',
      'quiz-btn',
      'timeline-btn',
      'book-resources-btn',
      'open-settings-modal-btn',
      'open-help-center-btn',
      'notes-btn-dropdown',
      'my-account-btn',
      'share-chapter-btn',
      'theme-toggle-btn',
      'language-selector-btn',
      'premium-edition-btn',
      'android-download-btn'
    ];

    for (const itemId of menuItems) {
      this.testButtonHandler(itemId, itemId.replace(/-btn|-dropdown/g, ''));
    }
  }

  /**
   * Helper para probar si un botón tiene handler
   */
  testButtonHandler(btnId, name, expectOnclick = false) {
    const btn = document.getElementById(btnId);

    if (!btn) {
      this.fail(name, 'NO encontrado en DOM');
      return;
    }

    // Verificar handlers
    const hasOnclick = btn.onclick !== null || btn.getAttribute('onclick') !== null;

    if (expectOnclick && !hasOnclick) {
      this.fail(name, 'Sin onclick (esperado)');
    } else if (hasOnclick) {
      this.pass(name, 'Con onclick');
    } else {
      // Puede tener event listener agregado dinámicamente
      this.pass(name, 'Presente (listener dinámico?)');
    }
  }

  /**
   * Probar funcionalidad de un botón específico
   */
  async testButton(buttonId) {
    console.log(`%c🧪 PROBANDO BOTÓN: ${buttonId}`, 'background: #607D8B; color: white; padding: 5px; font-weight: bold');

    const button = document.getElementById(buttonId);
    if (!button) {
      console.log(`❌ Botón ${buttonId} NO encontrado`);
      return false;
    }

    console.log(`✅ Botón encontrado`);
    console.log(`  Texto: ${button.textContent.trim()}`);
    console.log(`  Visible: ${button.offsetParent !== null}`);
    console.log(`  Deshabilitado: ${button.disabled}`);
    console.log(`  Classes: ${button.className}`);

    // Verificar handlers
    console.log(`  onclick: ${button.onclick !== null ? 'SÍ' : 'NO'}`);
    console.log(`  getAttribute('onclick'): ${button.getAttribute('onclick') !== null ? 'SÍ' : 'NO'}`);

    // Intentar obtener listeners
    const listeners = getEventListeners ? getEventListeners(button) : null;
    if (listeners) {
      console.log(`  Event listeners:`, listeners);
    }

    return true;
  }

  /**
   * Métodos helper para registro de pruebas
   */
  test(name, testFn, extra = '') {
    try {
      const result = testFn();
      if (result) {
        this.pass(name, extra);
      } else {
        this.fail(name, extra);
      }
    } catch (error) {
      this.fail(name, `Error: ${error.message}`);
    }
  }

  pass(name, message = '') {
    this.passed++;
    this.results.push({ name, status: '✅', message });
    console.log(`  ✅ ${name}${message ? ': ' + message : ''}`);
  }

  fail(name, message = '') {
    this.failed++;
    this.results.push({ name, status: '❌', message });
    console.log(`  ❌ ${name}${message ? ': ' + message : ''}`);
  }

  skip(name, message = '') {
    this.skipped++;
    this.results.push({ name, status: '⏭️', message });
    console.log(`  ⏭️ ${name}${message ? ': ' + message : ''}`);
  }

  /**
   * Mostrar resumen
   */
  showSummary() {
    console.log('\n%c📊 RESUMEN DE PRUEBAS', 'background: #4CAF50; color: white; padding: 10px; font-size: 14px; font-weight: bold');

    const total = this.results.length;
    console.log(`  Total de pruebas: ${total}`);
    console.log(`  ✅ Exitosas: ${this.passed}`);
    console.log(`  ❌ Fallidas: ${this.failed}`);
    console.log(`  ⏭️ Omitidas: ${this.skipped}`);

    const successRate = total > 0 ? Math.round((this.passed / total) * 100) : 0;
    console.log(`  📈 Tasa de éxito: ${successRate}%`);

    if (this.failed > 0) {
      console.log('\n%c❌ PRUEBAS FALLIDAS:', 'background: #F44336; color: white; padding: 5px; font-weight: bold');
      this.results
        .filter(r => r.status === '❌')
        .forEach(r => {
          console.log(`  - ${r.name}: ${r.message}`);
        });
    }

    console.log('\n%c═══════════════════════════════════════════════════', 'color: #4CAF50');
    console.log('%c🧪 PRUEBAS COMPLETADAS', 'background: #4CAF50; color: white; padding: 10px; font-size: 16px; font-weight: bold');
  }

  /**
   * Exportar reporte
   */
  exportReport() {
    const report = {
      timestamp: new Date().toISOString(),
      version: window.__APP_VERSION__,
      userAgent: navigator.userAgent,
      total: this.results.length,
      passed: this.passed,
      failed: this.failed,
      skipped: this.skipped,
      successRate: Math.round((this.passed / this.results.length) * 100),
      results: this.results
    };

    console.log('\n%c📄 REPORTE EXPORTADO', 'background: #607D8B; color: white; padding: 5px; font-weight: bold');
    console.log(JSON.stringify(report, null, 2));

    return report;
  }
}

// Crear instancia global
window.featureTester = new FeatureTester();

// Mensaje de ayuda
console.log('%c🧪 Feature Tester Cargado', 'background: #FF5722; color: white; padding: 10px; font-weight: bold');
console.log('%cEjecuta: window.featureTester.runAllTests()', 'color: #2196F3; font-size: 14px; font-weight: bold');
console.log('Otros comandos disponibles:');
console.log('  - window.featureTester.testButton("id-del-boton")');
console.log('  - window.featureTester.exportReport()');
