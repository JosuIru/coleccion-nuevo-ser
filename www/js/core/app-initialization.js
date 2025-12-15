/**
 * APP INITIALIZATION
 * Inicializa todo el sistema de versiones y actualizaciones
 *
 * @version 1.0.0
 */

class AppInitialization {
  static async initialize() {
    console.log('[AppInit] Iniciando sistema de aplicación...');

    try {
      // 1. Inyectar versión global
      this.injectVersionInfo();

      // 2. Inicializar VersionManager
      window.versionManager = new VersionManager({
        apiUrl: '/api/check-version.php',
        autoCheckInterval: 3600000, // 1 hora
        enableAutoCheck: true
      });

      // 3. Inicializar UpdateHelper
      window.updateHelper = new UpdateHelper(window.versionManager);

      // 4. Inicializar UpdateModal
      window.updateModal = new UpdateModal(window.versionManager, window.updateHelper);

      console.log('[AppInit] Sistema de versiones inicializado');

      // 5. Verificar actualizaciones al iniciar
      const delay = Math.random() * 3000; // 0-3 segundos de delay aleatorio
      setTimeout(() => {
        window.versionManager.checkForUpdates();
      }, delay);

      return true;

    } catch (error) {
      console.error('[AppInit] Error al inicializar:', error);
      return false;
    }
  }

  /**
   * Inyectar información de versión en window
   */
  static injectVersionInfo() {
    // Se puede obtener del manifest o build
    window.__APP_VERSION__ = '2.9.32'; // Cambiar con cada release
    window.__BUILD_TIME__ = new Date().toISOString();
    window.__ENVIRONMENT__ = 'production'; // 'development', 'staging', 'production'

    console.log('[AppInit] Versión:', window.__APP_VERSION__);
  }

  /**
   * Obtener estado del sistema
   */
  static getSystemStatus() {
    return {
      version: window.__APP_VERSION__,
      platform: window.versionManager?.config.platform || 'unknown',
      environment: window.__ENVIRONMENT__,
      updateAvailable: !!window.versionManager?.availableUpdate,
      lastCheckTime: window.versionManager?.lastCheckTime
    };
  }

  /**
   * Obtener información para debugging
   */
  static getDebugInfo() {
    return {
      appStatus: this.getSystemStatus(),
      versionManager: window.versionManager?.getDebugInfo?.(),
      updateInfo: window.versionManager?.availableUpdate
    };
  }
}

// Exportar global
window.AppInitialization = AppInitialization;

// Auto-inicializar cuando DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    AppInitialization.initialize();
  });
} else {
  AppInitialization.initialize();
}
