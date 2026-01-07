/**
 * NATIVE BRIDGE - Puente a funcionalidades nativas de Android
 * Proporciona acceso a haptics, status bar, teclado y más
 * @version 1.0.0
 */

class NativeBridge {
  constructor() {
    this.isNative = false;
    this.plugins = {};
    this.initialized = false;
  }

  /**
   * Inicializa el bridge y detecta si estamos en entorno nativo
   */
  async init() {
    if (this.initialized) return;

    // Detectar si estamos en Capacitor
    this.isNative = typeof window.Capacitor !== 'undefined' && window.Capacitor.isNativePlatform();

    if (this.isNative) {
      try {
        // Importar plugins de Capacitor
        const { Haptics } = await import('@capacitor/haptics');
        const { StatusBar, Style } = await import('@capacitor/status-bar');
        const { App } = await import('@capacitor/app');
        const { Keyboard } = await import('@capacitor/keyboard');

        this.plugins = { Haptics, StatusBar, Style, App, Keyboard };

        // Configurar status bar
        await this.configureStatusBar();

        // Configurar listeners de app
        this.setupAppListeners();

        // Configurar listeners de teclado
        this.setupKeyboardListeners();

        console.log('✅ NativeBridge inicializado en modo nativo');
      } catch (error) {
        console.warn('⚠️ No se pudieron cargar todos los plugins nativos:', error);
        this.isNative = false;
      }
    } else {
      console.log('📱 NativeBridge en modo web (sin funciones nativas)');
    }

    this.initialized = true;
  }

  /**
   * Configura la status bar para Android
   */
  async configureStatusBar() {
    if (!this.isNative || !this.plugins.StatusBar) return;

    try {
      await this.plugins.StatusBar.setBackgroundColor({ color: '#0a0e1f' });
      await this.plugins.StatusBar.setStyle({ style: this.plugins.Style.Dark });
    } catch (e) {
      console.warn('StatusBar config error:', e);
    }
  }

  /**
   * Configura listeners de ciclo de vida de la app
   */
  setupAppListeners() {
    if (!this.isNative || !this.plugins.App) return;

    // Listener para el botón de atrás
    this.plugins.App.addListener('backButton', ({ canGoBack }) => {
      this.handleBackButton(canGoBack);
    });

    // Listener para cuando la app pasa a segundo plano
    this.plugins.App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        this.onAppResume();
      } else {
        this.onAppPause();
      }
    });
  }

  /**
   * Configura listeners del teclado
   */
  setupKeyboardListeners() {
    if (!this.isNative || !this.plugins.Keyboard) return;

    this.plugins.Keyboard.addListener('keyboardWillShow', (info) => {
      document.body.style.setProperty('--keyboard-height', `${info.keyboardHeight}px`);
      document.body.classList.add('keyboard-open');
    });

    this.plugins.Keyboard.addListener('keyboardWillHide', () => {
      document.body.style.setProperty('--keyboard-height', '0px');
      document.body.classList.remove('keyboard-open');
    });
  }

  /**
   * Maneja el botón de atrás de Android
   */
  handleBackButton(canGoBack) {
    // Primero, cerrar cualquier modal abierto
    const modals = document.querySelectorAll('.frankenstein-modal, .modal-overlay, .grimoire-tooltip');
    if (modals.length > 0) {
      modals.forEach(m => m.remove());
      this.hapticLight();
      return;
    }

    // Verificar si estamos en una pantalla que puede ir atrás
    const labUI = window.FrankensteinLabUI;
    if (labUI && labUI.currentScreen !== 'start') {
      // Volver a la pantalla de inicio
      if (typeof labUI.createStartScreen === 'function') {
        labUI.createStartScreen();
        this.hapticLight();
        return;
      }
    }

    // Si no hay nada más que hacer, confirmar salida
    this.confirmExit();
  }

  /**
   * Confirmar salida de la app
   */
  async confirmExit() {
    // Crear diálogo de confirmación nativo
    const confirmed = confirm('¿Salir del Laboratorio Frankenstein?');
    if (confirmed && this.plugins.App) {
      this.hapticMedium();
      await this.plugins.App.exitApp();
    }
  }

  /**
   * Callback cuando la app se resume
   */
  onAppResume() {
    console.log('📱 App resumed');
    // Reiniciar audio si estaba pausado
    if (window.FrankensteinAudio && window.FrankensteinAudio.wasPlaying) {
      window.FrankensteinAudio.resume();
    }
  }

  /**
   * Callback cuando la app pasa a segundo plano
   */
  onAppPause() {
    console.log('📱 App paused');
    // Pausar audio
    if (window.FrankensteinAudio && window.FrankensteinAudio.isPlaying) {
      window.FrankensteinAudio.wasPlaying = true;
      window.FrankensteinAudio.pause();
    }
  }

  // ==================== HAPTIC FEEDBACK ====================

  /**
   * Vibración ligera - para interacciones sutiles
   */
  async hapticLight() {
    if (!this.isNative || !this.plugins.Haptics) {
      return this.fallbackHaptic(10);
    }
    try {
      await this.plugins.Haptics.impact({ style: 'light' });
    } catch (e) {
      this.fallbackHaptic(10);
    }
  }

  /**
   * Vibración media - para selecciones y confirmaciones
   */
  async hapticMedium() {
    if (!this.isNative || !this.plugins.Haptics) {
      return this.fallbackHaptic(20);
    }
    try {
      await this.plugins.Haptics.impact({ style: 'medium' });
    } catch (e) {
      this.fallbackHaptic(20);
    }
  }

  /**
   * Vibración fuerte - para acciones importantes
   */
  async hapticHeavy() {
    if (!this.isNative || !this.plugins.Haptics) {
      return this.fallbackHaptic(30);
    }
    try {
      await this.plugins.Haptics.impact({ style: 'heavy' });
    } catch (e) {
      this.fallbackHaptic(30);
    }
  }

  /**
   * Vibración de éxito - patrón de celebración
   */
  async hapticSuccess() {
    if (!this.isNative || !this.plugins.Haptics) {
      return this.fallbackHaptic(50);
    }
    try {
      await this.plugins.Haptics.notification({ type: 'success' });
    } catch (e) {
      this.fallbackHaptic(50);
    }
  }

  /**
   * Vibración de error
   */
  async hapticError() {
    if (!this.isNative || !this.plugins.Haptics) {
      return this.fallbackHaptic(100);
    }
    try {
      await this.plugins.Haptics.notification({ type: 'error' });
    } catch (e) {
      this.fallbackHaptic(100);
    }
  }

  /**
   * Vibración de selección - muy sutil
   */
  async hapticSelection() {
    if (!this.isNative || !this.plugins.Haptics) {
      return this.fallbackHaptic(5);
    }
    try {
      await this.plugins.Haptics.selectionStart();
      await this.plugins.Haptics.selectionEnd();
    } catch (e) {
      this.fallbackHaptic(5);
    }
  }

  /**
   * Fallback usando Web Vibration API
   */
  fallbackHaptic(duration = 10) {
    if ('vibrate' in navigator) {
      navigator.vibrate(duration);
    }
  }

  // ==================== UTILIDADES ====================

  /**
   * Mantener pantalla encendida (para gameplay)
   */
  async keepScreenAwake(awake = true) {
    // Nota: Esto requiere un plugin adicional o configuración en Android
    // Por ahora usamos NoSleep.js como fallback
    if (awake) {
      document.body.classList.add('screen-awake');
    } else {
      document.body.classList.remove('screen-awake');
    }
  }

  /**
   * Obtener información del dispositivo
   */
  getDeviceInfo() {
    return {
      isNative: this.isNative,
      platform: this.isNative ? 'android' : 'web',
      userAgent: navigator.userAgent,
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
      pixelRatio: window.devicePixelRatio || 1
    };
  }
}

// Crear instancia global
window.NativeBridge = new NativeBridge();

// Auto-inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  window.NativeBridge.init();
});

// También exponer para uso como módulo
if (typeof module !== 'undefined' && module.exports) {
  module.exports = NativeBridge;
}
