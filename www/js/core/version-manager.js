/**
 * VERSION MANAGER
 * Sistema integral de control de versiones y actualizaciones
 * Mantiene compatibilidad con múltiples plataformas (Web, Android, iOS)
 *
 * @version 2.0.0
 */

class VersionManager {
  constructor(config = {}) {
    // Configuración
    this.config = {
      apiUrl: config.apiUrl || '/api/check-version.php',
      platform: this.detectPlatform(),
      autoCheckInterval: config.autoCheckInterval || 3600000, // 1 hora
      enableAutoCheck: config.enableAutoCheck !== false,
      storageKey: 'version-manager-data',
      ...config
    };

    // Estado
    this.currentVersion = this.getCurrentVersion();
    this.lastCheckTime = this.loadLastCheckTime();
    this.availableUpdate = null;
    this.isChecking = false;
    this.isDownloading = false;

    // Listeners
    this.listeners = {
      updateAvailable: [],
      updateDownloaded: [],
      updateError: [],
      versionChanged: []
    };

    // Auto-check si está habilitado
    if (this.config.enableAutoCheck) {
      this.scheduleAutoCheck();
    }

    console.log('[VersionManager] Inicializado', {
      version: this.currentVersion,
      platform: this.config.platform
    });
  }

  /**
   * Detectar plataforma
   */
  detectPlatform() {
    const ua = navigator.userAgent.toLowerCase();

    if (typeof capacitor !== 'undefined' || window.isNative) {
      if (ua.includes('android')) return 'android';
      if (ua.includes('iphone') || ua.includes('ipad')) return 'ios';
      return 'native';
    }

    if (ua.includes('android')) return 'android-browser';
    if (ua.includes('iphone') || ua.includes('ipad')) return 'ios-browser';
    return 'web';
  }

  /**
   * Obtener versión actual según la plataforma
   */
  getCurrentVersion() {
    // Desde window (inyectado en HTML)
    if (window.__APP_VERSION__) {
      return window.__APP_VERSION__;
    }

    // Desde localStorage (fallback)
    const stored = localStorage.getItem('app-version');
    if (stored) return stored;

    // Default
    return '2.9.31';
  }

  /**
   * Obtener información de versión formateada
   */
  getVersionInfo() {
    const [major, minor, patch] = this.currentVersion.split('.').map(Number);
    return {
      full: this.currentVersion,
      major,
      minor,
      patch,
      platform: this.config.platform,
      buildTime: window.__BUILD_TIME__ || new Date().toISOString()
    };
  }

  /**
   * Comparar versiones (retorna: -1 si a < b, 0 si a == b, 1 si a > b)
   */
  compareVersions(versionA, versionB) {
    const parseVersion = (v) => v.split('.').map(x => parseInt(x) || 0);
    const [a1, a2, a3] = parseVersion(versionA);
    const [b1, b2, b3] = parseVersion(versionB);

    if (a1 !== b1) return a1 > b1 ? 1 : -1;
    if (a2 !== b2) return a2 > b2 ? 1 : -1;
    if (a3 !== b3) return a3 > b3 ? 1 : -1;
    return 0;
  }

  /**
   * Verificar si hay actualización disponible
   */
  async checkForUpdates() {
    if (this.isChecking) {
      console.log('[VersionManager] Ya hay una verificación en curso');
      return this.availableUpdate;
    }

    this.isChecking = true;

    try {
      const response = await fetch(this.config.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentVersion: this.currentVersion,
          platform: this.config.platform,
          timestamp: Date.now()
        })
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const data = await response.json();

      if (data.updateAvailable) {
        this.availableUpdate = data.update;
        this.emit('updateAvailable', data.update);
        console.log('[VersionManager] Actualización disponible:', data.update);
      } else {
        this.availableUpdate = null;
        console.log('[VersionManager] Sistema actualizado');
      }

      this.saveLastCheckTime();
      return this.availableUpdate;

    } catch (error) {
      console.error('[VersionManager] Error al verificar actualizaciones:', error);
      this.emit('updateError', error);
      return null;

    } finally {
      this.isChecking = false;
    }
  }

  /**
   * Obtener changelog entre versiones
   */
  async getChangelog(fromVersion, toVersion) {
    try {
      const response = await fetch('/api/changelog.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromVersion, toVersion })
      });

      if (!response.ok) throw new Error('Changelog no disponible');

      const data = await response.json();
      return data.changelog || [];

    } catch (error) {
      console.warn('[VersionManager] No se pudo obtener changelog:', error);
      return [];
    }
  }

  /**
   * Programar verificación automática
   */
  scheduleAutoCheck() {
    setInterval(() => {
      const now = Date.now();
      const lastCheck = this.lastCheckTime || 0;

      if (now - lastCheck > this.config.autoCheckInterval) {
        console.log('[VersionManager] Auto-check programado');
        this.checkForUpdates();
      }
    }, 60000); // Revisar cada minuto si es tiempo de hacer check
  }

  /**
   * Guardar tiempo del último check
   */
  saveLastCheckTime() {
    this.lastCheckTime = Date.now();
    const data = this.loadStorageData();
    data.lastCheckTime = this.lastCheckTime;
    localStorage.setItem(this.config.storageKey, JSON.stringify(data));
  }

  /**
   * Cargar tiempo del último check
   */
  loadLastCheckTime() {
    const data = this.loadStorageData();
    return data.lastCheckTime || 0;
  }

  /**
   * Cargar datos del storage
   */
  loadStorageData() {
    try {
      const data = localStorage.getItem(this.config.storageKey);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.warn('[VersionManager] Error al cargar storage:', error);
      return {};
    }
  }

  /**
   * Event Listeners
   */
  on(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].push(callback);
    }
  }

  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[VersionManager] Error en listener ${event}:`, error);
        }
      });
    }
  }

  /**
   * Obtener resumen de versión para debugging
   */
  getDebugInfo() {
    return {
      currentVersion: this.currentVersion,
      availableUpdate: this.availableUpdate,
      lastCheckTime: new Date(this.lastCheckTime).toLocaleString(),
      platform: this.config.platform,
      isChecking: this.isChecking,
      isDownloading: this.isDownloading,
      timeSinceLastCheck: Math.round((Date.now() - this.lastCheckTime) / 1000) + 's'
    };
  }
}

// Singleton global
window.VersionManager = VersionManager;
