/**
// 🔧 FIX v2.9.198: Migrated console.log to logger
 * FOCUS TRAP - Utilidad para atrapar el foco en modales
 *
 * Mantiene el foco dentro de un elemento (modal, dialog, drawer)
 * para mejorar la accesibilidad con teclado.
 *
 * @version 1.0.0
 */

class FocusTrap {
  constructor(element) {
    this.element = element;
    this.firstFocusable = null;
    this.lastFocusable = null;
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.previousActiveElement = null;
  }

  /**
   * Obtiene todos los elementos focusables dentro del contenedor
   */
  getFocusableElements() {
    const focusableSelectors = [
      'button:not([disabled])',
      'a[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable]'
    ].join(', ');

    return Array.from(this.element.querySelectorAll(focusableSelectors))
      .filter(el => {
        // Verificar que el elemento es visible
        const style = window.getComputedStyle(el);
        return style.display !== 'none' &&
               style.visibility !== 'hidden' &&
               el.offsetParent !== null;
      });
  }

  /**
   * Activa el focus trap
   */
  activate() {
    // Guardar el elemento previamente enfocado
    this.previousActiveElement = document.activeElement;

    // Obtener elementos focusables
    const focusables = this.getFocusableElements();

    if (focusables.length === 0) {
      // Si no hay elementos focusables, hacer el contenedor focusable
      this.element.setAttribute('tabindex', '-1');
      this.element.focus();
      return;
    }

    this.firstFocusable = focusables[0];
    this.lastFocusable = focusables[focusables.length - 1];

    // Añadir listener para Tab
    document.addEventListener('keydown', this.handleKeyDown);

    // Enfocar el primer elemento
    this.firstFocusable.focus();
  }

  /**
   * Desactiva el focus trap
   */
  deactivate() {
    document.removeEventListener('keydown', this.handleKeyDown);

    // Restaurar foco al elemento anterior
    if (this.previousActiveElement && this.previousActiveElement.focus) {
      this.previousActiveElement.focus();
    }
  }

  /**
   * Maneja el evento keydown para Tab y Shift+Tab
   */
  handleKeyDown(event) {
    if (event.key !== 'Tab') return;

    // Actualizar elementos focusables (pueden haber cambiado)
    const focusables = this.getFocusableElements();
    if (focusables.length === 0) return;

    this.firstFocusable = focusables[0];
    this.lastFocusable = focusables[focusables.length - 1];

    if (event.shiftKey) {
      // Shift + Tab: ir hacia atrás
      if (document.activeElement === this.firstFocusable) {
        event.preventDefault();
        this.lastFocusable.focus();
      }
    } else {
      // Tab: ir hacia adelante
      if (document.activeElement === this.lastFocusable) {
        event.preventDefault();
        this.firstFocusable.focus();
      }
    }
  }
}

/**
 * Función helper para crear y activar un focus trap
 *
 * @param {HTMLElement} element - Elemento contenedor
 * @returns {FocusTrap} - Instancia del focus trap
 *
 * @example
 * const trap = createFocusTrap(modalElement);
 * // Cuando se cierra el modal:
 * trap.deactivate();
 */
function createFocusTrap(element) {
  const trap = new FocusTrap(element);
  trap.activate();
  return trap;
}

// Exponer globalmente
window.FocusTrap = FocusTrap;
window.createFocusTrap = createFocusTrap;

logger.debug('[FocusTrap] Focus trap utility loaded. Use createFocusTrap(element) to trap focus.');
