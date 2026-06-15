// ============================================================================
// ZEN MODE - Modo de Lectura Simplificado
// ============================================================================
// v1.0.0: Oculta elementos no esenciales para una experiencia de lectura
// sin distracciones. Ideal para nuevos usuarios o lectores que prefieren
// una interfaz minimalista.
//
// VISIBLE en Modo Zen:
// - Contenido del libro/capítulo
// - Navegación básica (anterior/siguiente, índice/sidebar)
// - Audio/narración
// - Marcadores
// - Botón de apoyo
//
// OCULTO en Modo Zen:
// - Dropdowns de herramientas IA
// - Configuración avanzada
// - Comunidad (comentarios, círculos, clasificación)
// - Features del libro (timeline, recursos, etc.)
// - Botones secundarios en biblioteca
// - Herramientas del ecosistema

class ZenMode {
  constructor() {
    this.STORAGE_KEY = 'zen_mode_enabled';
    this.enabled = this._loadState();
    this._applyState();
  }

  // ==========================================================================
  // ESTADO
  // ==========================================================================

  _loadState() {
    try {
      return localStorage.getItem(this.STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  }

  _saveState() {
    try {
      localStorage.setItem(this.STORAGE_KEY, this.enabled ? 'true' : 'false');
    } catch (error) {
      logger.warn('[ZenMode] No se pudo guardar estado:', error);
    }
  }

  // ==========================================================================
  // TOGGLE Y APLICACIÓN
  // ==========================================================================

  toggle() {
    this.enabled = !this.enabled;
    this._saveState();
    this._applyState();
    this._notifyChange();
    return this.enabled;
  }

  enable() {
    if (!this.enabled) {
      this.enabled = true;
      this._saveState();
      this._applyState();
      this._notifyChange();
    }
  }

  disable() {
    if (this.enabled) {
      this.enabled = false;
      this._saveState();
      this._applyState();
      this._notifyChange();
    }
  }

  isEnabled() {
    return this.enabled;
  }

  _applyState() {
    const root = document.documentElement;

    if (this.enabled) {
      root.classList.add('zen-mode');
      root.setAttribute('data-zen-mode', 'true');
    } else {
      root.classList.remove('zen-mode');
      root.removeAttribute('data-zen-mode');
    }

    // Actualizar iconos/labels si existen
    this._updateToggleButtons();
  }

  _updateToggleButtons() {
    const zenToggleButtons = document.querySelectorAll('[data-zen-toggle]');
    zenToggleButtons.forEach(button => {
      const icon = button.querySelector('.zen-toggle-icon');
      const label = button.querySelector('.zen-toggle-label');

      if (icon) {
        icon.textContent = this.enabled ? '🧘' : '☯️';
      }
      if (label) {
        label.textContent = this.enabled ? 'Modo Normal' : 'Modo Zen';
      }

      button.setAttribute('aria-pressed', this.enabled ? 'true' : 'false');
      button.title = this.enabled
        ? 'Desactivar Modo Zen (mostrar todas las opciones)'
        : 'Activar Modo Zen (ocultar opciones avanzadas)';
    });
  }

  _notifyChange() {
    // Disparar evento personalizado
    window.dispatchEvent(new CustomEvent('zenModeChange', {
      detail: { enabled: this.enabled }
    }));

    // Toast de confirmación
    if (window.toast) {
      if (this.enabled) {
        window.toast.success('Modo Zen activado', {
          description: 'Interfaz simplificada para lectura sin distracciones'
        });
      } else {
        window.toast.info('Modo Normal activado', {
          description: 'Todas las herramientas disponibles'
        });
      }
    }
  }

  // ==========================================================================
  // RENDERIZADO DEL BOTÓN TOGGLE
  // ==========================================================================

  /**
   * Genera el HTML para un botón toggle de Modo Zen
   * @param {Object} options - Opciones de renderizado
   * @param {string} options.variant - 'icon' | 'full' | 'compact'
   * @param {string} options.className - Clases CSS adicionales
   * @returns {string} HTML del botón
   */
  renderToggleButton(options = {}) {
    const { variant = 'full', className = '' } = options;
    const isActive = this.enabled;

    const baseClass = 'zen-mode-toggle flex items-center gap-2 transition-all duration-200';
    const activeClass = isActive
      ? 'bg-gradient-to-r from-teal-500/20 to-cyan-500/20 text-teal-400 border-teal-500/50'
      : 'hover:bg-gray-100 dark:hover:bg-gray-700';

    if (variant === 'icon') {
      return `
        <button
          data-zen-toggle
          class="${baseClass} p-2 rounded-lg ${activeClass} ${className}"
          aria-pressed="${isActive}"
          aria-label="${isActive ? 'Desactivar Modo Zen' : 'Activar Modo Zen'}"
          title="${isActive ? 'Desactivar Modo Zen' : 'Activar Modo Zen'}"
          onclick="window.zenMode?.toggle()">
          <span class="zen-toggle-icon text-lg">${isActive ? '🧘' : '☯️'}</span>
        </button>
      `;
    }

    if (variant === 'compact') {
      return `
        <button
          data-zen-toggle
          class="${baseClass} px-3 py-2 rounded-lg border ${activeClass} ${className}"
          aria-pressed="${isActive}"
          onclick="window.zenMode?.toggle()">
          <span class="zen-toggle-icon">${isActive ? '🧘' : '☯️'}</span>
          <span class="zen-toggle-label text-sm font-medium">${isActive ? 'Zen' : 'Zen'}</span>
        </button>
      `;
    }

    // variant === 'full'
    return `
      <button
        data-zen-toggle
        class="${baseClass} w-full px-4 py-3 rounded-xl border ${activeClass} ${className}"
        aria-pressed="${isActive}"
        onclick="window.zenMode?.toggle()">
        <span class="zen-toggle-icon text-xl">${isActive ? '🧘' : '☯️'}</span>
        <div class="flex flex-col items-start">
          <span class="zen-toggle-label font-semibold">${isActive ? 'Modo Zen Activo' : 'Activar Modo Zen'}</span>
          <span class="text-xs opacity-70">${isActive ? 'Interfaz simplificada' : 'Ocultar opciones avanzadas'}</span>
        </div>
        <span class="ml-auto text-xs px-2 py-1 rounded-full ${isActive ? 'bg-teal-500/30 text-teal-300' : 'bg-gray-500/30 text-gray-400'}">
          ${isActive ? 'ON' : 'OFF'}
        </span>
      </button>
    `;
  }

  // ==========================================================================
  // CLEANUP
  // ==========================================================================

  destroy() {
    this.disable();
  }
}

// Exportar instancia global
window.ZenMode = ZenMode;
window.zenMode = new ZenMode();

// Log de inicialización
logger.log('[ZenMode] Inicializado. Estado:', window.zenMode.isEnabled() ? 'Activo' : 'Inactivo');
