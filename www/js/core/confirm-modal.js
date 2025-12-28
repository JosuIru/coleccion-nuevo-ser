/**
// 🔧 FIX v2.9.198: Migrated console.log to logger
 * CONFIRM MODAL - Modal de confirmación personalizado
 *
 * Reemplaza window.confirm() con un modal accesible y personalizable.
 * Soporta async/await y promesas.
 *
 * @version 1.0.0
 */

class ConfirmModal {
  constructor() {
    this.modalId = 'confirm-modal';
    this.escapeHandler = null;
    this.resolvePromise = null;
    this.focusTrap = null;
  }

  /**
   * Muestra un modal de confirmación
   *
   * @param {Object} options - Opciones del modal
   * @param {string} options.title - Título del modal
   * @param {string} options.message - Mensaje de confirmación
   * @param {string} options.confirmText - Texto del botón de confirmar
   * @param {string} options.cancelText - Texto del botón de cancelar
   * @param {string} options.type - Tipo: 'warning', 'danger', 'info', 'success'
   * @param {string} options.icon - Emoji o icono personalizado
   * @returns {Promise<boolean>} - true si confirma, false si cancela
   *
   * @example
   * const confirmed = await window.confirmModal.show({
   *   title: 'Eliminar archivo',
   *   message: '¿Estás seguro de que quieres eliminar este archivo?',
   *   confirmText: 'Eliminar',
   *   type: 'danger'
   * });
   */
  show(options = {}) {
    return new Promise((resolve) => {
      this.resolvePromise = resolve;

      const config = {
        title: options.title || 'Confirmar',
        message: options.message || '¿Estás seguro?',
        confirmText: options.confirmText || 'Confirmar',
        cancelText: options.cancelText || 'Cancelar',
        type: options.type || 'warning',
        icon: options.icon || this.getDefaultIcon(options.type)
      };

      this.render(config);
      this.attachEventListeners();
    });
  }

  /**
   * Obtiene el icono por defecto según el tipo
   */
  getDefaultIcon(type) {
    const icons = {
      warning: '⚠️',
      danger: '🗑️',
      info: 'ℹ️',
      success: '✅'
    };
    return icons[type] || icons.warning;
  }

  /**
   * Obtiene las clases de color según el tipo
   */
  getTypeClasses(type) {
    const classes = {
      warning: {
        bg: 'bg-amber-500',
        hover: 'hover:bg-amber-600',
        border: 'border-amber-500/30',
        iconBg: 'bg-amber-500/20'
      },
      danger: {
        bg: 'bg-red-600',
        hover: 'hover:bg-red-700',
        border: 'border-red-500/30',
        iconBg: 'bg-red-500/20'
      },
      info: {
        bg: 'bg-blue-600',
        hover: 'hover:bg-blue-700',
        border: 'border-blue-500/30',
        iconBg: 'bg-blue-500/20'
      },
      success: {
        bg: 'bg-green-600',
        hover: 'hover:bg-green-700',
        border: 'border-green-500/30',
        iconBg: 'bg-green-500/20'
      }
    };
    return classes[type] || classes.warning;
  }

  /**
   * Renderiza el modal
   */
  render(config) {
    // Remover modal existente si hay
    this.close(false);

    const typeClasses = this.getTypeClasses(config.type);

    const modal = document.createElement('div');
    modal.id = this.modalId;
    modal.className = 'fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[10001] p-4';
    modal.setAttribute('role', 'alertdialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'confirm-modal-title');
    modal.setAttribute('aria-describedby', 'confirm-modal-message');

    modal.innerHTML = `
      <div class="bg-slate-800 rounded-xl shadow-2xl max-w-md w-full border ${typeClasses.border} transform transition-all duration-200 scale-100 animate-modal-enter">
        <!-- Header -->
        <div class="p-6 text-center">
          <div class="w-16 h-16 mx-auto mb-4 rounded-full ${typeClasses.iconBg} flex items-center justify-center text-3xl">
            ${config.icon}
          </div>
          <h3 id="confirm-modal-title" class="text-xl font-bold text-white mb-2">
            ${this.escapeHtml(config.title)}
          </h3>
          <p id="confirm-modal-message" class="text-slate-300 text-sm">
            ${this.escapeHtml(config.message)}
          </p>
        </div>

        <!-- Actions -->
        <div class="flex gap-3 p-4 bg-slate-900/50 rounded-b-xl border-t border-slate-700">
          <button
            id="confirm-modal-cancel"
            class="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition focus:outline-none focus:ring-2 focus:ring-slate-500"
            aria-label="${this.escapeHtml(config.cancelText)}"
          >
            ${this.escapeHtml(config.cancelText)}
          </button>
          <button
            id="confirm-modal-confirm"
            class="flex-1 px-4 py-3 ${typeClasses.bg} ${typeClasses.hover} text-white font-semibold rounded-lg transition focus:outline-none focus:ring-2 focus:ring-white/50"
            aria-label="${this.escapeHtml(config.confirmText)}"
          >
            ${this.escapeHtml(config.confirmText)}
          </button>
        </div>
      </div>
    `;

    // Estilos de animación inline
    if (!document.getElementById('confirm-modal-styles')) {
      const style = document.createElement('style');
      style.id = 'confirm-modal-styles';
      style.textContent = `
        @keyframes modal-enter {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .animate-modal-enter {
          animation: modal-enter 0.2s ease-out;
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';

    // Activar focus trap si está disponible
    if (window.createFocusTrap) {
      this.focusTrap = window.createFocusTrap(modal);
    } else {
      // Fallback: Focus en el botón de cancelar
      setTimeout(() => {
        const cancelBtn = document.getElementById('confirm-modal-cancel');
        cancelBtn?.focus();
      }, 100);
    }
  }

  /**
   * Adjunta event listeners
   */
  attachEventListeners() {
    // Botón confirmar
    const confirmBtn = document.getElementById('confirm-modal-confirm');
    confirmBtn?.addEventListener('click', () => this.close(true));

    // Botón cancelar
    const cancelBtn = document.getElementById('confirm-modal-cancel');
    cancelBtn?.addEventListener('click', () => this.close(false));

    // Click fuera del modal
    const modal = document.getElementById(this.modalId);
    modal?.addEventListener('click', (e) => {
      if (e.target.id === this.modalId) {
        this.close(false);
      }
    });

    // Escape key
    this.escapeHandler = (e) => {
      if (e.key === 'Escape') {
        this.close(false);
      }
    };
    document.addEventListener('keydown', this.escapeHandler);

    // Enter en el botón confirm
    confirmBtn?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.close(true);
      }
    });
  }

  /**
   * Cierra el modal y resuelve la promesa
   */
  close(result) {
    // Desactivar focus trap
    if (this.focusTrap) {
      this.focusTrap.deactivate();
      this.focusTrap = null;
    }

    // Limpiar escape handler
    if (this.escapeHandler) {
      document.removeEventListener('keydown', this.escapeHandler);
      this.escapeHandler = null;
    }

    const modal = document.getElementById(this.modalId);
    if (modal) {
      modal.remove();
      document.body.style.overflow = '';
    }

    // Resolver la promesa
    if (this.resolvePromise) {
      this.resolvePromise(result);
      this.resolvePromise = null;
    }
  }

  /**
   * Escapa HTML para prevenir XSS
   */
  escapeHtml(text) {
    if (window.Sanitizer) {
      return window.Sanitizer.escapeHtml(text);
    }
    // Fallback si Sanitizer no está disponible
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Crear instancia global
window.confirmModal = new ConfirmModal();

/**
 * Función helper para uso rápido
 * Reemplaza window.confirm() de forma async
 *
 * @example
 * if (await confirm('¿Eliminar?')) { ... }
 */
window.showConfirm = async (message, options = {}) => {
  return window.confirmModal.show({
    message,
    ...options
  });
};

/**
 * Función helper para confirmación de eliminación
 *
 * @example
 * if (await confirmDelete('este archivo')) { ... }
 */
window.confirmDelete = async (itemName) => {
  return window.confirmModal.show({
    title: 'Confirmar eliminación',
    message: `¿Estás seguro de que quieres eliminar ${itemName}? Esta acción no se puede deshacer.`,
    confirmText: 'Eliminar',
    cancelText: 'Cancelar',
    type: 'danger'
  });
};

/**
 * Función helper para confirmación de cierre de sesión
 *
 * @example
 * if (await confirmLogout()) { ... }
 */
window.confirmLogout = async () => {
  return window.confirmModal.show({
    title: 'Cerrar sesión',
    message: '¿Estás seguro de que quieres cerrar sesión?',
    confirmText: 'Cerrar sesión',
    cancelText: 'Cancelar',
    type: 'warning',
    icon: '🚪'
  });
};

logger.debug('[ConfirmModal] Custom confirm modal loaded. Use window.confirmModal.show() or window.showConfirm()');
