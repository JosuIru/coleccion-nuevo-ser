/**
 * UPDATE HELPER
 * Maneja descarga e instalación de actualizaciones
 *
 * @version 1.0.0
 */

class UpdateHelper {
  constructor(versionManager) {
    this.versionManager = versionManager;
    this.downloadProgress = 0;
    this.isUpdating = false;

    // Listeners
    this.listeners = {
      downloadStarted: [],
      downloadProgress: [],
      downloadCompleted: [],
      updateApplied: [],
      updateError: []
    };
  }

  /**
   * Descargar actualización
   */
  async downloadUpdate(updateInfo) {
    if (this.isUpdating) {
      console.warn('[UpdateHelper] Ya hay una descarga en curso');
      return false;
    }

    this.isUpdating = true;
    this.downloadProgress = 0;

    try {
      const platform = this.versionManager.config.platform;

      // En Android, abrir descarga directa
      if (platform.includes('android')) {
        return this.downloadAndroidAPK(updateInfo);
      }

      // En iOS, abrir App Store
      if (platform.includes('ios')) {
        return this.openAppStoreIOS(updateInfo);
      }

      // En web, hacer reload forzado
      if (platform === 'web') {
        return this.forceWebUpdate(updateInfo);
      }

      throw new Error(`Plataforma no soportada: ${platform}`);

    } catch (error) {
      console.error('[UpdateHelper] Error al descargar:', error);
      this.emit('updateError', error);
      return false;

    } finally {
      this.isUpdating = false;
    }
  }

  /**
   * Descargar APK en Android
   */
  async downloadAndroidAPK(updateInfo) {
    const url = updateInfo.downloadUrl;

    if (!url) {
      throw new Error('URL de descarga no disponible');
    }

    console.log('[UpdateHelper] Iniciando descarga APK:', url);
    this.emit('downloadStarted', { version: updateInfo.version });

    // En app nativa, usar plugin de descarga
    if (window.Capacitor) {
      try {
        const { Filesystem, Directory } = Capacitor.Plugins;

        // Descargar archivo
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Error al descargar: ${response.status}`);
        }

        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();

        // Guardar en dispositivo
        const fileName = `awakening-protocol-${updateInfo.version}.apk`;
        await Filesystem.writeFile({
          path: fileName,
          data: arrayBuffer,
          directory: Directory.Documents
        });

        console.log('[UpdateHelper] APK descargado:', fileName);
        this.emit('downloadCompleted', { fileName });

        // Iniciar instalación
        return this.installAPK(fileName);

      } catch (error) {
        console.error('[UpdateHelper] Error con Capacitor:', error);
        // Fallback: abrir descarga en navegador
        window.location.href = url;
        return true;
      }
    }

    // Fallback: descarga directa en navegador
    window.location.href = url;
    return true;
  }

  /**
   * Instalar APK (Android nativo)
   */
  async installAPK(fileName) {
    try {
      if (!window.Capacitor) {
        console.log('[UpdateHelper] No se puede instalar APK desde web');
        return false;
      }

      const { FileOpener } = Capacitor.Plugins;

      await FileOpener.open({
        filePath: fileName,
        contentType: 'application/vnd.android.package-archive'
      });

      this.emit('updateApplied', { version: this.versionManager.availableUpdate.version });
      return true;

    } catch (error) {
      console.error('[UpdateHelper] Error al instalar APK:', error);
      throw error;
    }
  }

  /**
   * Abrir App Store en iOS
   */
  openAppStoreIOS(updateInfo) {
    const url = updateInfo.downloadUrl;

    if (!url) {
      throw new Error('URL de App Store no disponible');
    }

    console.log('[UpdateHelper] Abriendo App Store:', url);

    // Abrir URL de App Store
    if (window.cordova) {
      window.cordova.InAppBrowser.open(url, '_system');
    } else {
      window.location.href = url;
    }

    this.emit('downloadStarted', { version: updateInfo.version });
    return true;
  }

  /**
   * Forzar actualización en web
   */
  async forceWebUpdate(updateInfo) {
    console.log('[UpdateHelper] Forzando actualización web...');

    this.emit('downloadStarted', { version: updateInfo.version });

    // Limpiar cache
    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
        console.log('[UpdateHelper] Service Worker desregistrado');
      } catch (error) {
        console.warn('[UpdateHelper] Error al desregistrar SW:', error);
      }
    }

    // Limpiar localStorage y sessionStorage parcialmente
    const keysToKeep = [
      'coleccion-nuevo-ser-data',
      'nuevosser-auth',
      'user-preferences'
    ];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!keysToKeep.includes(key)) {
        localStorage.removeItem(key);
      }
    }

    console.log('[UpdateHelper] Cache limpiado');
    this.emit('downloadCompleted', { version: updateInfo.version });

    // Hacer reload con cache busting
    const timestamp = Date.now();
    window.location.href = `/?update-time=${timestamp}`;

    this.emit('updateApplied', { version: updateInfo.version });
    return true;
  }

  /**
   * Verificar si update está completado
   */
  async checkUpdateStatus() {
    // En Android, verificar versión de APK instalado
    if (this.versionManager.config.platform.includes('android')) {
      try {
        // Aquí iría código nativo para verificar versión del APK
        // Por ahora retornar basado en localStorage
        const installedVersion = localStorage.getItem('app-version');
        const latestVersion = this.versionManager.currentVersion;

        if (installedVersion === latestVersion) {
          return {
            status: 'installed',
            version: installedVersion
          };
        }
      } catch (error) {
        console.warn('[UpdateHelper] No se pudo verificar versión nativa:', error);
      }
    }

    return { status: 'unknown' };
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
          console.error(`[UpdateHelper] Error en listener ${event}:`, error);
        }
      });
    }
  }
}

// Exportar para uso global
window.UpdateHelper = UpdateHelper;
