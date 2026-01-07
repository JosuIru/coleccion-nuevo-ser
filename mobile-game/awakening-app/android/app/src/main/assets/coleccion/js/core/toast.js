// ============================================================================
// TOAST NOTIFICATION SYSTEM - Sistema de notificaciones tipo toast
// ============================================================================
// Reemplaza alerts nativos con notificaciones modernas y accesibles

class Toast {
  constructor() {
    this.i18n = window.i18n || new I18n();
    this.container = null;
    this.activeToasts = [];
    this.maxToasts = 5;
    this.init();
  }

  // ==========================================================================
  // INITIALIZATION
  // ==========================================================================

  init() {
    // Create toast container if it doesn't exist
    if (!document.getElementById('toast-container')) {
      const container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none';
      container.style.maxWidth = 'calc(100vw - 3rem)';
      document.body.appendChild(container);
      this.container = container;
    } else {
      this.container = document.getElementById('toast-container');
    }
  }

  // ==========================================================================
  // SHOW TOAST
  // ==========================================================================

  /**
   * Show a toast notification
   * @param {string} message - The message to display (can be i18n key or plain text)
   * @param {string} type - Type: 'success', 'error', 'warning', 'info'
   * @param {number} duration - Duration in milliseconds (default: 4000)
   * @param {boolean} translate - Whether to translate the message (default: true)
   */
  show(message, type = 'info', duration = 4000, translate = true) {
    // Translate message if needed
    const displayMessage = translate ? this.i18n.t(message) || message : message;

    // Create toast element
    const toast = this.createToastElement(displayMessage, type);

    // Add to container
    this.container.appendChild(toast);
    this.activeToasts.push(toast);

    // Remove oldest toast if max exceeded
    if (this.activeToasts.length > this.maxToasts) {
      const oldest = this.activeToasts.shift();
      this.removeToast(oldest);
    }

    // Trigger entrance animation
    setTimeout(() => {
      toast.classList.add('toast-enter');
    }, 10);

    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        this.removeToast(toast);
      }, duration);
    }

    return toast;
  }

  // ==========================================================================
  // SHORTCUTS
  // ==========================================================================

  success(message, duration = 3000) {
    return this.show(message, 'success', duration);
  }

  error(message, duration = 5000) {
    return this.show(message, 'error', duration);
  }

  warning(message, duration = 4000) {
    return this.show(message, 'warning', duration);
  }

  info(message, duration = 4000) {
    return this.show(message, 'info', duration);
  }

  // ==========================================================================
  // TOAST CREATION
  // ==========================================================================

  createToastElement(message, type) {
    const toast = document.createElement('div');
    toast.className = 'toast pointer-events-auto';

    // Get colors and icon based on type
    const config = this.getTypeConfig(type);

    toast.innerHTML = `
      <div class="flex items-start gap-3 ${config.bg} ${config.border} ${config.text}
                  px-4 py-3 rounded-lg shadow-2xl border-2 backdrop-blur-sm
                  transform translate-x-full opacity-0 transition-all duration-300 ease-out
                  min-w-[280px] max-w-md">
        <!-- Icon -->
        <div class="flex-shrink-0 text-2xl" role="img" aria-label="${config.ariaLabel}">
          ${config.icon}
        </div>

        <!-- Message -->
        <div class="flex-1 text-sm font-medium pt-0.5">
          ${this.escapeHtml(message)}
        </div>

        <!-- Close button -->
        <button class="flex-shrink-0 text-lg hover:opacity-70 transition-opacity -mr-1"
                aria-label="${this.i18n.t('btn.close')}"
                onclick="window.toast.removeToast(this.closest('.toast'))">
          ×
        </button>
      </div>
    `;

    return toast;
  }

  getTypeConfig(type) {
    const configs = {
      success: {
        bg: 'bg-green-900/90',
        border: 'border-green-500/50',
        text: 'text-green-100',
        icon: Icons.check(18),
        ariaLabel: 'Success'
      },
      error: {
        bg: 'bg-red-900/90',
        border: 'border-red-500/50',
        text: 'text-red-100',
        icon: Icons.close(18),
        ariaLabel: 'Error'
      },
      warning: {
        bg: 'bg-yellow-900/90',
        border: 'border-yellow-500/50',
        text: 'text-yellow-100',
        icon: Icons.alertTriangle(18),
        ariaLabel: 'Warning'
      },
      info: {
        bg: 'bg-blue-900/90',
        border: 'border-blue-500/50',
        text: 'text-blue-100',
        icon: Icons.helpCircle(18),
        ariaLabel: 'Information'
      }
    };

    return configs[type] || configs.info;
  }

  // ==========================================================================
  // TOAST REMOVAL
  // ==========================================================================

  removeToast(toast) {
    if (!toast || !toast.parentNode) return;

    // Trigger exit animation
    const inner = toast.querySelector('div');
    if (inner) {
      inner.classList.remove('translate-x-0', 'opacity-100');
      inner.classList.add('translate-x-full', 'opacity-0');
    }

    // Remove from DOM after animation
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
      // Remove from active toasts array
      const index = this.activeToasts.indexOf(toast);
      if (index > -1) {
        this.activeToasts.splice(index, 1);
      }
    }, 300);
  }

  // ==========================================================================
  // UTILITIES
  // ==========================================================================

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Clear all toasts
  clearAll() {
    this.activeToasts.forEach(toast => this.removeToast(toast));
    this.activeToasts = [];
  }
}

// ==========================================================================
// CSS CLASSES (to be added to global CSS or inline)
// ==========================================================================
// Add this CSS to your global stylesheet:
/*
.toast-enter {
  transform: translateX(0) !important;
  opacity: 1 !important;
}
*/

// ==========================================================================
// GLOBAL INSTANCE
// ==========================================================================
window.toast = new Toast();
window.Toast = Toast;
