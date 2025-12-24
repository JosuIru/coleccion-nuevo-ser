/**
 * Configuración específica para mobile app
 * Este archivo es automáticamente cargado cuando se detecta mobile app
 */

window.MOBILE_APP_CONFIG = {
  version: '1.0.0',
  buildDate: new Date().toISOString(),
  platform: 'android',
  isEmbedded: true,
  features: {
    offline: true,
    syncWithGame: true,
    rewards: true,
    analytics: true
  }
};

// Detectar si estamos en mobile app
if (window.IS_MOBILE_APP || window.ReactNativeWebView) {
  console.log('[MobileConfig] Running in mobile app');

  // Deshabilitar features que no funcionan en WebView
  if (window.navigator && window.navigator.serviceWorker) {
    window.navigator.serviceWorker.getRegistrations().then(function(registrations) {
      for(let registration of registrations) {
        registration.unregister();
      }
    });
  }

  // Ocultar elementos específicos de web
  document.addEventListener('DOMContentLoaded', () => {
    const webOnlyElements = document.querySelectorAll('.web-only, .download-app-buttons');
    webOnlyElements.forEach(el => el.style.display = 'none');
  });
}
