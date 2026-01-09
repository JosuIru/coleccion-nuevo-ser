/**
 * COMPREHENSIVE FEATURE TEST v2.9.322
 * Test exhaustivo de todas las funcionalidades
 *
 * USO:
 * 1. Abre la app y navega a un capítulo
 * 2. Abre la consola del navegador
 * 3. Ejecuta: window.comprehensiveTest.runAll()
 */

class ComprehensiveTest {
  constructor() {
    this.results = {
      passed: [],
      failed: [],
      warnings: []
    };
  }

  // Verificar que un elemento existe
  checkElement(id, description) {
    const element = document.getElementById(id);
    if (!element) {
      this.failed(`❌ ${description} (${id}) - Element not found`);
      return null;
    }
    return element;
  }

  // Verificar que un elemento tiene listeners
  checkListener(id, description) {
    const element = this.checkElement(id, description);
    if (!element) return false;

    // Check EventManager
    if (window.bookReader?.events?.eventManager) {
      const stats = window.bookReader.events.eventManager.getStats();
      if (stats.byTarget && stats.byTarget[id] > 0) {
        this.passed(`✅ ${description} (${id}) - ${stats.byTarget[id]} listener(s)`);
        return true;
      }
    }

    // Check onclick
    if (element.onclick || element.getAttribute('onclick')) {
      this.passed(`✅ ${description} (${id}) - onclick attribute`);
      return true;
    }

    // Check getEventListeners (Chrome)
    if (window.getEventListeners) {
      const listeners = window.getEventListeners(element);
      const hasListeners = Object.keys(listeners).length > 0;
      if (hasListeners) {
        this.passed(`✅ ${description} (${id}) - Event listeners found`);
        return true;
      }
    }

    this.warning(`⚠️  ${description} (${id}) - Cannot verify listeners`);
    return null;
  }

  // Verificar que un dropdown funciona
  testDropdown(btnId, dropdownId, description) {
    const btn = this.checkElement(btnId, `${description} Button`);
    const dropdown = this.checkElement(dropdownId, `${description} Dropdown`);

    if (!btn || !dropdown) return false;

    // Check button has listener
    this.checkListener(btnId, `${description} Button`);

    // Check dropdown is hidden by default
    const isHidden = dropdown.classList.contains('hidden');
    if (isHidden) {
      this.passed(`✅ ${description} Dropdown - Hidden by default`);
    } else {
      this.warning(`⚠️  ${description} Dropdown - Not hidden (may be open)`);
    }

    return true;
  }

  // Tests principales
  testHeaderButtons() {
    console.log('\n%c📱 TESTING HEADER BUTTONS', 'background: #00d4ff; color: #000; font-weight: bold; padding: 5px');

    // Desktop
    this.checkListener('toggle-sidebar', 'Toggle Sidebar');
    this.checkListener('ai-chat-btn', 'AI Chat (Desktop)');
    this.checkListener('ai-chat-btn-tablet', 'AI Chat (Tablet)');
    this.checkListener('audioreader-btn', 'AudioReader (Desktop)');
    this.checkListener('audioreader-btn-tablet', 'AudioReader (Tablet)');
    this.checkListener('support-btn', 'Support (Desktop)');
    this.checkListener('support-btn-tablet', 'Support (Tablet)');
    this.checkListener('notes-btn', 'Notes');

    // Mobile
    this.checkListener('bookmark-btn-mobile', 'Bookmark (Mobile)');
    this.checkListener('ai-chat-btn-mobile', 'AI Chat (Mobile)');
    this.checkListener('audioreader-btn-mobile', 'AudioReader (Mobile)');
    this.checkListener('support-btn-mobile', 'Support (Mobile)');
    this.checkListener('mobile-menu-btn', 'Mobile Menu');
  }

  testDropdowns() {
    console.log('\n%c🔽 TESTING DROPDOWNS', 'background: #00d4ff; color: #000; font-weight: bold; padding: 5px');

    this.testDropdown('tools-dropdown-btn', 'tools-dropdown', 'Tools');
    this.testDropdown('book-features-dropdown-btn', 'book-features-dropdown', 'Book Features');
    this.testDropdown('settings-dropdown-btn', 'settings-dropdown', 'Settings');
  }

  testToolsDropdown() {
    console.log('\n%c🔧 TESTING TOOLS DROPDOWN BUTTONS', 'background: #00d4ff; color: #000; font-weight: bold; padding: 5px');

    this.checkListener('chapter-resources-btn', 'Chapter Resources');
    this.checkListener('summary-btn', 'Summary');
    this.checkListener('voice-notes-btn', 'Voice Notes');
    this.checkListener('concept-map-btn', 'Concept Map');
    this.checkListener('action-plans-btn', 'Action Plans');
    this.checkListener('achievements-btn', 'Achievements');
    this.checkListener('learning-paths-btn-desktop', 'Learning Paths');
    this.checkListener('content-adapter-btn', 'Content Adapter');
  }

  testBookFeaturesDropdown() {
    console.log('\n%c📚 TESTING BOOK FEATURES DROPDOWN BUTTONS', 'background: #00d4ff; color: #000; font-weight: bold; padding: 5px');

    this.checkListener('quiz-btn', 'Quiz');
    this.checkListener('timeline-btn', 'Timeline');
    this.checkListener('book-resources-btn', 'Book Resources');
    this.checkListener('koan-btn', 'Koan');
  }

  testSettingsDropdown() {
    console.log('\n%c⚙️ TESTING SETTINGS DROPDOWN BUTTONS', 'background: #00d4ff; color: #000; font-weight: bold; padding: 5px');

    this.checkListener('open-settings-modal-btn', 'Settings Modal');
    this.checkListener('open-help-center-btn', 'Help Center');
    this.checkListener('my-account-btn', 'My Account');
    this.checkListener('android-download-btn', 'Android Download');
    this.checkListener('language-selector-btn', 'Language Selector');
    this.checkListener('theme-toggle-btn', 'Theme Toggle');
    this.checkListener('premium-edition-btn', 'Premium Edition');
    this.checkListener('share-chapter-btn', 'Share Chapter');
  }

  testNavigation() {
    console.log('\n%c🧭 TESTING NAVIGATION', 'background: #00d4ff; color: #000; font-weight: bold; padding: 5px');

    this.checkListener('prev-chapter', 'Previous Chapter');
    this.checkListener('next-chapter', 'Next Chapter');
  }

  testGlobalObjects() {
    console.log('\n%c🌐 TESTING GLOBAL OBJECTS', 'background: #00d4ff; color: #000; font-weight: bold; padding: 5px');

    if (typeof window.bookReader !== 'undefined') {
      this.passed('✅ window.bookReader exists');
    } else {
      this.failed('❌ window.bookReader is undefined');
      return;
    }

    if (window.bookReader.events) {
      this.passed('✅ window.bookReader.events exists');
    } else {
      this.failed('❌ window.bookReader.events is undefined');
      return;
    }

    if (window.bookReader.events.eventManager) {
      this.passed('✅ window.bookReader.events.eventManager exists');

      const stats = window.bookReader.events.eventManager.getStats();
      if (stats.totalListeners > 0) {
        this.passed(`✅ EventManager has ${stats.totalListeners} total listeners`);
        console.log('   Listeners by target:', stats.byTarget);
      } else {
        this.warning('⚠️  EventManager has 0 listeners');
      }
    } else {
      this.failed('❌ window.bookReader.events.eventManager is undefined');
    }

    // Check version
    if (window.__APP_VERSION__) {
      this.passed(`✅ App version: ${window.__APP_VERSION__}`);
    }
  }

  testAfterNavigation() {
    console.log('\n%c🔄 TESTING AFTER NAVIGATION', 'background: #ffa500; color: #000; font-weight: bold; padding: 5px');
    console.log('Para probar después de navegación:');
    console.log('1. Navega a otro capítulo usando las flechas');
    console.log('2. Ejecuta: window.comprehensiveTest.runAll()');
    console.log('3. Verifica que todos los listeners siguen funcionando');
  }

  // Helpers
  passed(message) {
    this.results.passed.push(message);
    console.log('%c' + message, 'color: #00ff00');
  }

  failed(message) {
    this.results.failed.push(message);
    console.error(message);
  }

  warning(message) {
    this.results.warnings.push(message);
    console.warn(message);
  }

  // Run all tests
  runAll() {
    console.clear();
    console.log('%c🧪 COMPREHENSIVE FEATURE TEST v2.9.322', 'background: #00d4ff; color: #000; font-weight: bold; padding: 10px; font-size: 16px');
    console.log('Testing all features...\n');

    this.results = { passed: [], failed: [], warnings: [] };

    this.testGlobalObjects();
    this.testHeaderButtons();
    this.testDropdowns();
    this.testToolsDropdown();
    this.testBookFeaturesDropdown();
    this.testSettingsDropdown();
    this.testNavigation();
    this.testAfterNavigation();

    this.printSummary();
  }

  printSummary() {
    console.log('\n%c═══════════════════════════════════════════════════', 'color: #00d4ff');
    console.log('%c📊 TEST SUMMARY', 'background: #00d4ff; color: #000; font-weight: bold; padding: 5px; font-size: 14px');
    console.log('%c═══════════════════════════════════════════════════', 'color: #00d4ff');

    const total = this.results.passed.length + this.results.failed.length + this.results.warnings.length;
    const passRate = total > 0 ? ((this.results.passed.length / total) * 100).toFixed(1) : 0;

    console.log(`\n%cTotal Tests: ${total}`, 'font-weight: bold; font-size: 14px');
    console.log(`%c✅ Passed: ${this.results.passed.length}`, 'color: #00ff00; font-weight: bold');
    console.log(`%c❌ Failed: ${this.results.failed.length}`, 'color: #ff0000; font-weight: bold');
    console.log(`%c⚠️  Warnings: ${this.results.warnings.length}`, 'color: #ffa500; font-weight: bold');
    console.log(`%cPass Rate: ${passRate}%`, 'font-weight: bold; font-size: 14px');

    if (this.results.failed.length === 0) {
      console.log('\n%c🎉 ALL TESTS PASSED!', 'background: #00ff00; color: #000; font-weight: bold; padding: 10px; font-size: 16px');
    } else {
      console.log('\n%c⚠️  SOME TESTS FAILED', 'background: #ff0000; color: #fff; font-weight: bold; padding: 10px; font-size: 16px');
      console.log('\nFailed tests:');
      this.results.failed.forEach(msg => console.error(msg));
    }

    if (this.results.warnings.length > 0) {
      console.log('\nWarnings (may not be critical):');
      this.results.warnings.forEach(msg => console.warn(msg));
    }

    console.log('\n%cTip: Para hacer un test manual, haz clic en los botones y verifica que funcionan.', 'color: #888; font-style: italic');
  }

  // Quick tests
  quickTest() {
    console.log('%c⚡ QUICK TEST', 'background: #ffa500; color: #000; font-weight: bold; padding: 5px');

    const criticalTests = [
      () => this.checkListener('tools-dropdown-btn', 'Tools Dropdown Button'),
      () => this.checkListener('ai-chat-btn-mobile', 'AI Chat Mobile'),
      () => this.checkListener('prev-chapter', 'Previous Chapter'),
      () => this.checkListener('next-chapter', 'Next Chapter'),
    ];

    this.results = { passed: [], failed: [], warnings: [] };
    criticalTests.forEach(test => test());

    if (this.results.failed.length === 0) {
      console.log('%c✅ Quick test passed - Critical features working', 'color: #00ff00; font-weight: bold');
    } else {
      console.log('%c❌ Quick test failed', 'color: #ff0000; font-weight: bold');
      this.results.failed.forEach(msg => console.error(msg));
    }
  }
}

// Export global
window.comprehensiveTest = new ComprehensiveTest();

// Auto-run if in development
if (window.__ENVIRONMENT__ === 'development') {
  console.log('%c💡 Comprehensive Test loaded. Run with: window.comprehensiveTest.runAll()', 'color: #00d4ff; font-style: italic');
}
