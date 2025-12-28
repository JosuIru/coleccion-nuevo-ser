/**
 * OFFLINE DETECTOR
 * Detecta cambios en conectividad y notifica al usuario
 *
 * @version 1.0.0
 * FIX: Audit v2.9.234 - offline behavior no manejado
 */

class OfflineDetector {
  constructor() {
    this.isOnline = navigator.onLine;
    this.wasOffline = false;
    this.listeners = [];

    this.init();
  }

  init() {
    // Listen for online/offline events
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());

    // Initial check
    if (!this.isOnline) {
      this.showOfflineNotice();
    }
  }

  handleOnline() {
    this.isOnline = true;

    if (this.wasOffline) {
      this.wasOffline = false;

      // Show reconnected toast
      if (window.toast) {
        window.toast.success('Conexion restaurada');
      }

      // Notify listeners
      this.notifyListeners('online');

      // Clear offline indicator
      this.hideOfflineIndicator();
    }
  }

  handleOffline() {
    this.isOnline = false;
    this.wasOffline = true;

    this.showOfflineNotice();

    // Notify listeners
    this.notifyListeners('offline');
  }

  showOfflineNotice() {
    // Show toast
    if (window.toast) {
      window.toast.warning('Sin conexion. Modo offline activo.');
    }

    // Show persistent indicator
    this.showOfflineIndicator();
  }

  showOfflineIndicator() {
    // Remove existing
    const existing = document.getElementById('offline-indicator');
    if (existing) existing.remove();

    const indicator = document.createElement('div');
    indicator.id = 'offline-indicator';
    indicator.className = 'fixed bottom-4 left-4 bg-yellow-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2 text-sm';
    indicator.innerHTML = `
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636a9 9 0 010 12.728m-3.536-3.536a5 5 0 010-7.072M9.172 9.172a4 4 0 015.656 0m-5.656 0L3.515 3.515m0 0L3 3m.515.515L9.172 9.172"></path>
      </svg>
      <span>Modo offline</span>
    `;
    document.body.appendChild(indicator);
  }

  hideOfflineIndicator() {
    const indicator = document.getElementById('offline-indicator');
    if (indicator) {
      indicator.style.opacity = '0';
      setTimeout(() => indicator.remove(), 300);
    }
  }

  // Subscribe to connectivity changes
  onConnectivityChange(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  notifyListeners(status) {
    this.listeners.forEach(cb => {
      try {
        cb(status);
      } catch (e) {
        console.error('Offline detector listener error:', e);
      }
    });
  }

  // Check if online (can be used before fetch)
  checkOnline() {
    return navigator.onLine;
  }

  // Show offline warning if offline
  warnIfOffline(action = 'Esta accion') {
    if (!navigator.onLine) {
      if (window.toast) {
        window.toast.warning(`${action} requiere conexion a Internet.`);
      }
      return true; // is offline
    }
    return false; // is online
  }
}

// Export global
window.OfflineDetector = OfflineDetector;

// Auto-initialize
window.offlineDetector = new OfflineDetector();
