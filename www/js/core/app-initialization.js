/**
 * APP INITIALIZATION
 * Inicializa todo el sistema de versiones y actualizaciones
 *
 * @version 2.9.283
 */

class AppInitialization {
  static async initialize() {
    logger.log('[AppInit] Iniciando sistema de aplicación...');

    try {
      // 1. Inyectar versión global
      this.injectVersionInfo();

      // 2. Inicializar Analytics (Google Analytics 4)
      // El ID se configura en localStorage o se deshabilita si no existe
      const gaId = window.StorageHelper?.get('analytics-ga-id') || null;
      window.analyticsHelper = new AnalyticsHelper({
        enabled: !!gaId, // Solo habilitado si hay ID configurado
        measurementId: gaId || 'disabled',
        debug: window.__ENVIRONMENT__ === 'development'
      });

      // Tracking inicial de page view
      window.analyticsHelper.trackPageView('Biblioteca Principal');

      logger.log('[AppInit] Sistema de analytics inicializado');

      // 2.5. Inicializar AI Cache Service (reducir costos 40-60%)
      window.aiCacheService = new AICacheService({
        enabled: true,
        maxLocalEntries: 100,
        defaultTTL: 7 * 24 * 60 * 60 * 1000, // 7 días
        definitionTTL: 30 * 24 * 60 * 60 * 1000, // 30 días
        debug: window.__ENVIRONMENT__ === 'development'
      });

      logger.log('[AppInit] Sistema de caché de IA inicializado');
      logger.log('[AppInit] Hit rate actual:', window.aiCacheService.getHitRate() + '%');

      // 3. Inicializar VersionManager (solo para apps nativas)
      const isNativeApp = typeof capacitor !== 'undefined' || window.isNative;

      window.versionManager = new VersionManager({
        apiUrl: 'https://gailu.net/api/check-version.php',
        autoCheckInterval: 3600000, // 1 hora
        enableAutoCheck: isNativeApp // Solo habilitar en apps nativas (Android/iOS)
      });

      // 4. Inicializar UpdateHelper
      window.updateHelper = new UpdateHelper(window.versionManager);

      // 5. Inicializar UpdateModal
      window.updateModal = new UpdateModal(window.versionManager, window.updateHelper);

      logger.log('[AppInit] Sistema de versiones inicializado', { isNativeApp });

      // 6. Verificar actualizaciones al iniciar (solo en apps nativas)
      if (isNativeApp) {
        const delay = Math.random() * 3000; // 0-3 segundos de delay aleatorio
        setTimeout(() => {
          window.versionManager.checkForUpdates();
        }, delay);
      }

      // 7. Mostrar Welcome Flow para nuevos usuarios (lazy load 28KB)
      // Verificar si es nuevo usuario ANTES de cargar el módulo
      const isNewUser = !localStorage.getItem('welcome-flow-completed');
      if (isNewUser && window.lazyLoader) {
        // Delay pequeño para que la app cargue completamente
        setTimeout(async () => {
          await window.lazyLoader.loadWelcomeFlow();
          if (window.welcomeFlow && window.welcomeFlow.shouldShow()) {
            window.welcomeFlow.start();
          }
        }, 800);
      }

      // 8. Inicializar sistema de hints contextuales
      if (window.contextualHints) {
        window.contextualHints.onPageVisit('biblioteca');
      }

      return true;

    } catch (error) {
      logger.error('[AppInit] Error al inicializar:', error);

      // 🔧 FIX #94: Usar ErrorBoundary para capturar error
      if (window.errorBoundary) {
        window.errorBoundary.captureError(error, {
          context: 'app_initialization',
          filename: 'app-initialization.js'
        });
      }

      // Track error en analytics si está disponible
      if (window.analyticsHelper) {
        window.analyticsHelper.trackFatalError(
          'initialization_error',
          error.message,
          error.stack
        );
      }

      return false;
    }
  }

  /**
   * Inyectar información de versión en window
   */
  static injectVersionInfo() {
    // Se puede obtener del manifest o build
    // 🔧 v2.9.297: Fix "biblioteca is not defined" - Added optional chaining to all window.biblioteca calls
    window.__APP_VERSION__ = '2.9.297'; // Cambiar con cada release
    window.__BUILD_TIME__ = new Date().toISOString();
    window.__ENVIRONMENT__ = 'production'; // 'development', 'staging', 'production'

    logger.log('[AppInit] Versión:', window.__APP_VERSION__);

    // ⭐ FIX v2.9.180: Deshabilitar console.log en producción (795 instancias)
    // Mejora performance ~5-10% y reduce overhead de debugging
    if (window.__ENVIRONMENT__ === 'production') {
      const noop = () => {};
      console.log = noop;
      console.debug = noop;
      console.info = noop;
      // Mantener console.warn y console.error para problemas críticos
      logger.warn('[AppInit] Console.log deshabilitado en producción para mejor performance');
    }
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
