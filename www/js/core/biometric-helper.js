// ============================================================================
// BIOMETRIC HELPER - Autenticación Biométrica para Notas Privadas
// ============================================================================

class BiometricHelper {
  constructor() {
    this.isCapacitor = typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform();
    this.isAvailable = false;
    this.biometryType = 'none';
    this.isEnabled = this.getConfig('biometricEnabled', false);

    this.init();
  }

  // ==========================================================================
  // INICIALIZACIÓN
  // ==========================================================================

  async init() {
    if (this.isCapacitor) {
      await this.checkAvailability();
    }

    // Exponer globalmente
    window.biometricHelper = this;
  }

  async checkAvailability() {
    try {
      if (window.Capacitor?.Plugins?.BiometricAuth) {
        const { BiometricAuth } = window.Capacitor.Plugins;

        const result = await BiometricAuth.checkBiometry();
        this.isAvailable = result.isAvailable;
        this.biometryType = result.biometryType || 'none';

        console.log('Biometric availability:', result);
        return result;
      }
    } catch (error) {
      console.warn('Error checking biometric availability:', error);
      this.isAvailable = false;
    }
    return { isAvailable: false, biometryType: 'none' };
  }

  // ==========================================================================
  // CONFIGURACIÓN
  // ==========================================================================

  getConfig(key, defaultValue) {
    try {
      const stored = localStorage.getItem(`biometric-${key}`);
      return stored !== null ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  setConfig(key, value) {
    localStorage.setItem(`biometric-${key}`, JSON.stringify(value));
    if (key === 'biometricEnabled') {
      this.isEnabled = value;
    }
  }

  // ==========================================================================
  // AUTENTICACIÓN
  // ==========================================================================

  async authenticate(reason = 'Acceder a contenido privado') {
    if (!this.isCapacitor || !this.isAvailable) {
      // Si no hay biometría disponible, permitir acceso
      return { success: true, fallback: true };
    }

    if (!this.isEnabled) {
      // Si el usuario no ha habilitado biometría, permitir acceso
      return { success: true, disabled: true };
    }

    try {
      if (window.Capacitor?.Plugins?.BiometricAuth) {
        const { BiometricAuth } = window.Capacitor.Plugins;

        await BiometricAuth.authenticate({
          reason: reason,
          cancelTitle: 'Cancelar',
          allowDeviceCredential: true, // Permitir PIN/patrón como fallback
          iosFallbackTitle: 'Usar contraseña',
          androidTitle: 'Autenticación Requerida',
          androidSubtitle: reason,
          androidConfirmationRequired: false
        });

        return { success: true };
      }
    } catch (error) {
      console.warn('Biometric authentication failed:', error);

      if (error.code === 'userCancel') {
        return { success: false, cancelled: true };
      }

      return { success: false, error: error.message };
    }

    return { success: false };
  }

  // ==========================================================================
  // PROTECCIÓN DE CONTENIDO
  // ==========================================================================

  async protectContent(callback) {
    if (!this.isEnabled) {
      // Si biometría no está habilitada, ejecutar callback directamente
      return callback();
    }

    const result = await this.authenticate('Verificar identidad para acceder');

    if (result.success) {
      return callback();
    } else if (result.cancelled) {
      window.toast?.info('Autenticación cancelada');
      return null;
    } else {
      window.toast?.error('No se pudo verificar la identidad');
      return null;
    }
  }

  // ==========================================================================
  // UI HELPERS
  // ==========================================================================

  getBiometryIcon() {
    switch (this.biometryType) {
      case 'fingerprint':
      case 'touchId':
        return '👆';
      case 'faceId':
      case 'face':
        return '👤';
      case 'iris':
        return '👁️';
      default:
        return '🔒';
    }
  }

  getBiometryLabel() {
    switch (this.biometryType) {
      case 'fingerprint':
        return 'Huella digital';
      case 'touchId':
        return 'Touch ID';
      case 'faceId':
        return 'Face ID';
      case 'face':
        return 'Reconocimiento facial';
      case 'iris':
        return 'Escaneo de iris';
      default:
        return 'Biometría';
    }
  }

  renderSettingsPanel() {
    if (!this.isAvailable) {
      return `
        <div class="biometric-settings p-4 bg-gray-800/50 rounded-xl border border-gray-700">
          <div class="flex items-center gap-3 text-gray-400">
            <span class="text-2xl">🔒</span>
            <div>
              <p class="font-semibold">Biometría no disponible</p>
              <p class="text-sm">Tu dispositivo no soporta autenticación biométrica</p>
            </div>
          </div>
        </div>
      `;
    }

    return `
      <div class="biometric-settings space-y-4">
        <div class="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl border border-gray-700">
          <div class="flex items-center gap-3">
            <span class="text-3xl">${this.getBiometryIcon()}</span>
            <div>
              <p class="font-semibold">${this.getBiometryLabel()}</p>
              <p class="text-sm text-gray-400">Proteger notas y reflexiones privadas</p>
            </div>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" id="biometric-toggle"
                   ${this.isEnabled ? 'checked' : ''}
                   class="sr-only peer">
            <div class="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
          </label>
        </div>

        ${this.isEnabled ? `
          <div class="p-3 bg-green-900/20 border border-green-500/30 rounded-xl">
            <p class="text-sm text-green-300">
              ${this.getBiometryIcon()} ${this.getBiometryLabel()} activo. Se te pedirá autenticación para acceder a notas privadas.
            </p>
          </div>
        ` : ''}
      </div>
    `;
  }

  attachSettingsListeners() {
    const toggle = document.getElementById('biometric-toggle');
    if (toggle) {
      toggle.addEventListener('change', async (e) => {
        if (e.target.checked) {
          // Verificar biometría antes de activar
          const result = await this.authenticate('Activar protección biométrica');
          if (result.success) {
            this.setConfig('biometricEnabled', true);
            window.toast?.success('Protección biométrica activada');
          } else {
            e.target.checked = false;
            if (!result.cancelled) {
              window.toast?.error('No se pudo activar la biometría');
            }
          }
        } else {
          this.setConfig('biometricEnabled', false);
          window.toast?.info('Protección biométrica desactivada');
        }
      });
    }
  }
}

// ==========================================================================
// INICIALIZACIÓN AUTOMÁTICA
// ==========================================================================

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new BiometricHelper());
} else {
  new BiometricHelper();
}

// Exportar
window.BiometricHelper = BiometricHelper;
