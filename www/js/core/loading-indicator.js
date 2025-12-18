/**
 * LOADING INDICATOR - Sistema de indicadores de carga
 * Proporciona feedback visual durante operaciones asíncronas
 *
 * @version 1.0.0
 */

class LoadingIndicator {
  constructor() {
    this.activeLoaders = new Map();
    this.containerId = 'loading-indicator-container';
    this.init();
  }

  /**
   * Inicializar contenedor de indicadores
   */
  init() {
    if (document.getElementById(this.containerId)) return;

    const container = document.createElement('div');
    container.id = this.containerId;
    container.setAttribute('role', 'status');
    container.setAttribute('aria-live', 'polite');
    container.innerHTML = '';
    document.body.appendChild(container);

    this.injectStyles();
  }

  /**
   * Inyectar estilos CSS
   */
  injectStyles() {
    if (document.getElementById('loading-indicator-styles')) return;

    const style = document.createElement('style');
    style.id = 'loading-indicator-styles';
    style.textContent = `
      #loading-indicator-container {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 10002;
        pointer-events: none;
      }

      .loading-bar {
        height: 3px;
        background: linear-gradient(90deg, #0ea5e9, #8b5cf6, #0ea5e9);
        background-size: 200% 100%;
        animation: loading-bar-animation 1.5s ease-in-out infinite;
        transform-origin: left;
      }

      .loading-bar.indeterminate {
        animation: loading-bar-indeterminate 1.5s ease-in-out infinite;
      }

      @keyframes loading-bar-animation {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }

      @keyframes loading-bar-indeterminate {
        0% { transform: scaleX(0); transform-origin: left; }
        50% { transform: scaleX(1); transform-origin: left; }
        50.1% { transform: scaleX(1); transform-origin: right; }
        100% { transform: scaleX(0); transform-origin: right; }
      }

      .loading-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(2px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10003;
        pointer-events: auto;
      }

      .loading-spinner-container {
        background: var(--bg-card, #1e293b);
        border-radius: 12px;
        padding: 24px 32px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 16px;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        border: 1px solid rgba(255, 255, 255, 0.1);
      }

      .loading-spinner {
        width: 48px;
        height: 48px;
        border: 3px solid rgba(255, 255, 255, 0.1);
        border-top-color: #0ea5e9;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }

      .loading-text {
        color: #e2e8f0;
        font-size: 14px;
        font-weight: 500;
      }

      .loading-skeleton {
        background: linear-gradient(90deg,
          var(--skeleton-bg, #374151) 25%,
          var(--skeleton-highlight, #4b5563) 50%,
          var(--skeleton-bg, #374151) 75%
        );
        background-size: 200% 100%;
        animation: skeleton-shimmer 1.5s ease-in-out infinite;
        border-radius: 4px;
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }

      @keyframes skeleton-shimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }

      .loading-dots {
        display: inline-flex;
        gap: 4px;
      }

      .loading-dots span {
        width: 8px;
        height: 8px;
        background: #0ea5e9;
        border-radius: 50%;
        animation: loading-dot 1.4s ease-in-out infinite both;
      }

      .loading-dots span:nth-child(1) { animation-delay: -0.32s; }
      .loading-dots span:nth-child(2) { animation-delay: -0.16s; }

      @keyframes loading-dot {
        0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
        40% { transform: scale(1); opacity: 1; }
      }

      /* Reduced motion */
      @media (prefers-reduced-motion: reduce) {
        .loading-bar,
        .loading-spinner,
        .loading-skeleton,
        .loading-dots span {
          animation: none;
        }
        .loading-bar {
          background: #0ea5e9;
        }
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Mostrar barra de carga en la parte superior
   * @param {string} id - Identificador único
   * @returns {string} ID del loader
   */
  showBar(id = 'default') {
    const loaderId = `loading-bar-${id}`;

    if (this.activeLoaders.has(loaderId)) return loaderId;

    const container = document.getElementById(this.containerId);
    const bar = document.createElement('div');
    bar.id = loaderId;
    bar.className = 'loading-bar indeterminate';
    container.appendChild(bar);

    this.activeLoaders.set(loaderId, bar);
    return loaderId;
  }

  /**
   * Mostrar overlay de carga con spinner
   * @param {string} message - Mensaje a mostrar
   * @param {string} id - Identificador único
   * @returns {string} ID del loader
   */
  showOverlay(message = 'Cargando...', id = 'overlay') {
    const loaderId = `loading-overlay-${id}`;

    if (this.activeLoaders.has(loaderId)) {
      this.updateText(loaderId, message);
      return loaderId;
    }

    const overlay = document.createElement('div');
    overlay.id = loaderId;
    overlay.className = 'loading-overlay';
    overlay.innerHTML = `
      <div class="loading-spinner-container">
        <div class="loading-spinner" aria-hidden="true"></div>
        <span class="loading-text">${window.Sanitizer?.escapeHtml(message) || message}</span>
      </div>
    `;

    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    this.activeLoaders.set(loaderId, overlay);
    return loaderId;
  }

  /**
   * Mostrar indicador inline de carga (dots)
   * @param {HTMLElement} container - Elemento contenedor
   * @param {string} id - Identificador único
   * @returns {string} ID del loader
   */
  showInline(container, id = 'inline') {
    const loaderId = `loading-inline-${id}`;

    if (this.activeLoaders.has(loaderId)) return loaderId;

    const dots = document.createElement('span');
    dots.id = loaderId;
    dots.className = 'loading-dots';
    dots.setAttribute('aria-label', 'Cargando');
    dots.innerHTML = '<span></span><span></span><span></span>';

    container.appendChild(dots);
    this.activeLoaders.set(loaderId, dots);
    return loaderId;
  }

  /**
   * Crear un skeleton loader
   * @param {Object} options - Opciones del skeleton
   * @returns {HTMLElement} Elemento skeleton
   */
  createSkeleton({ width = '100%', height = '20px', borderRadius = '4px' } = {}) {
    const skeleton = document.createElement('div');
    skeleton.className = 'loading-skeleton';
    skeleton.style.width = width;
    skeleton.style.height = height;
    skeleton.style.borderRadius = borderRadius;
    skeleton.setAttribute('aria-hidden', 'true');
    return skeleton;
  }

  /**
   * Actualizar texto de un loader
   * @param {string} loaderId - ID del loader
   * @param {string} text - Nuevo texto
   */
  updateText(loaderId, text) {
    const loader = this.activeLoaders.get(loaderId);
    if (!loader) return;

    const textEl = loader.querySelector('.loading-text');
    if (textEl) {
      textEl.textContent = text;
    }
  }

  /**
   * Ocultar un loader específico
   * @param {string} loaderId - ID del loader
   */
  hide(loaderId) {
    const loader = this.activeLoaders.get(loaderId);
    if (!loader) return;

    loader.remove();
    this.activeLoaders.delete(loaderId);

    // Restaurar scroll si no hay más overlays
    if (!Array.from(this.activeLoaders.keys()).some(id => id.includes('overlay'))) {
      document.body.style.overflow = '';
    }
  }

  /**
   * Ocultar todos los loaders
   */
  hideAll() {
    this.activeLoaders.forEach((loader, id) => {
      loader.remove();
    });
    this.activeLoaders.clear();
    document.body.style.overflow = '';
  }

  /**
   * Ejecutar función con loader automático
   * @param {Function} asyncFn - Función asíncrona
   * @param {Object} options - Opciones
   * @returns {Promise} Resultado de la función
   */
  async withLoader(asyncFn, { type = 'bar', message = 'Cargando...', id = 'auto' } = {}) {
    const loaderId = type === 'overlay'
      ? this.showOverlay(message, id)
      : this.showBar(id);

    try {
      return await asyncFn();
    } finally {
      this.hide(loaderId);
    }
  }
}

// Crear instancia global
window.loadingIndicator = new LoadingIndicator();

// Helpers globales
window.showLoading = (message, type = 'bar') => {
  if (type === 'overlay') {
    return window.loadingIndicator.showOverlay(message);
  }
  return window.loadingIndicator.showBar();
};

window.hideLoading = (id) => {
  if (id) {
    window.loadingIndicator.hide(id);
  } else {
    window.loadingIndicator.hideAll();
  }
};

console.log('[LoadingIndicator] Sistema de indicadores de carga inicializado');
