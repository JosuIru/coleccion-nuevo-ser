/**
 * ENHANCED UI SYSTEM v1.0
 * Sistema de UI/UX mejorado para Frankenstein Lab
 * Incluye: Toasts, Bottom Sheets, Tooltips, y utilidades
 *
 * Inspirado en: Hearthstone, Legends of Runeterra, Material Design 3
 *
 * @version 1.0.0
 * @date 2024-12
 */

// ========================================
// 1. SISTEMA DE TOASTS MEJORADO
// ========================================

class EnhancedToastSystem {
  constructor() {
    this.container = null;
    this.toasts = [];
    this.maxToasts = 5;
    this.defaultDuration = 4000;
    this.init();
  }

  init() {
    // Crear container si no existe
    if (!document.querySelector('.toast-container')) {
      this.container = document.createElement('div');
      this.container.className = 'toast-container';
      this.container.setAttribute('role', 'region');
      this.container.setAttribute('aria-label', 'Notificaciones');
      document.body.appendChild(this.container);
    } else {
      this.container = document.querySelector('.toast-container');
    }

    // Crear region para screen readers
    this.createAriaLiveRegion();
  }

  createAriaLiveRegion() {
    if (!document.getElementById('toast-announcer')) {
      const announcer = document.createElement('div');
      announcer.id = 'toast-announcer';
      announcer.setAttribute('aria-live', 'polite');
      announcer.setAttribute('aria-atomic', 'true');
      announcer.className = 'sr-only';
      document.body.appendChild(announcer);
    }
  }

  /**
   * Mostrar un toast
   * @param {string} message - Mensaje principal
   * @param {string} type - 'success' | 'error' | 'warning' | 'info'
   * @param {Object} options - Opciones adicionales
   */
  show(message, type = 'info', options = {}) {
    const {
      title = null,
      duration = type === 'error' ? 6000 : this.defaultDuration,
      critical = false,
      action = null,
      actionLabel = 'Accion',
      onAction = null,
      icon = null
    } = options;

    // Limitar numero de toasts
    if (this.toasts.length >= this.maxToasts) {
      this.dismiss(this.toasts[0].id);
    }

    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const toast = this.createToastElement(id, message, type, {
      title,
      duration,
      critical,
      action,
      actionLabel,
      onAction,
      icon
    });

    this.container.appendChild(toast);
    this.toasts.push({ id, element: toast, duration, critical });

    // Anunciar para screen readers
    this.announceToast(message, type);

    // Haptic feedback en movil
    this.triggerHaptic(type);

    // Auto-dismiss (excepto criticos)
    if (!critical && duration > 0) {
      setTimeout(() => this.dismiss(id), duration);
    }

    return id;
  }

  createToastElement(id, message, type, options) {
    const { title, duration, critical, action, actionLabel, onAction, icon } = options;

    const toast = document.createElement('div');
    toast.id = id;
    toast.className = `toast ${type}${critical ? ' critical' : ''}`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', critical ? 'assertive' : 'polite');

    // Icono
    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };

    toast.innerHTML = `
      <div class="toast-icon">${icon || icons[type] || icons.info}</div>
      <div class="toast-content">
        ${title ? `<div class="toast-title">${title}</div>` : ''}
        <div class="toast-message">${message}</div>
        ${action ? `
          <div class="toast-action">
            <button class="toast-action-btn" data-action="${action}">${actionLabel}</button>
          </div>
        ` : ''}
      </div>
      <button class="toast-close" aria-label="Cerrar notificacion">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M1 1L13 13M1 13L13 1" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>
      ${!critical && duration > 0 ? `<div class="toast-progress" style="animation-duration: ${duration}ms"></div>` : ''}
    `;

    // Event listeners
    toast.querySelector('.toast-close').addEventListener('click', () => this.dismiss(id));

    if (action && onAction) {
      toast.querySelector('.toast-action-btn').addEventListener('click', () => {
        onAction();
        this.dismiss(id);
      });
    }

    return toast;
  }

  announceToast(message, type) {
    const announcer = document.getElementById('toast-announcer');
    if (announcer) {
      const typeLabels = {
        success: 'Exito',
        error: 'Error',
        warning: 'Advertencia',
        info: 'Informacion'
      };
      announcer.textContent = `${typeLabels[type] || ''}: ${message}`;
    }
  }

  triggerHaptic(type) {
    if ('vibrate' in navigator) {
      const patterns = {
        success: [10],
        error: [50, 30, 50],
        warning: [30, 20, 30],
        info: [10]
      };
      navigator.vibrate(patterns[type] || [10]);
    }
  }

  dismiss(id) {
    const index = this.toasts.findIndex(t => t.id === id);
    if (index === -1) return;

    const { element } = this.toasts[index];
    element.classList.add('exiting');

    setTimeout(() => {
      element.remove();
      this.toasts.splice(index, 1);
    }, 350);
  }

  dismissAll() {
    [...this.toasts].forEach(t => this.dismiss(t.id));
  }

  // Metodos de conveniencia
  success(message, options = {}) {
    return this.show(message, 'success', options);
  }

  error(message, options = {}) {
    return this.show(message, 'error', options);
  }

  warning(message, options = {}) {
    return this.show(message, 'warning', options);
  }

  info(message, options = {}) {
    return this.show(message, 'info', options);
  }

  // Toast critico que no desaparece
  critical(message, options = {}) {
    return this.show(message, 'error', { ...options, critical: true });
  }
}


// ========================================
// 2. BOTTOM SHEET CON PHYSICS
// ========================================

class EnhancedBottomSheet {
  constructor(element, options = {}) {
    this.element = typeof element === 'string' ? document.querySelector(element) : element;
    if (!this.element) return;

    this.options = {
      snapPoints: [0, 0.25, 0.5, 1], // closed, peek, half, full
      defaultSnap: 0.25,
      velocityThreshold: 0.5,
      resistanceFactor: 0.4,
      onSnapChange: null,
      onDragStart: null,
      onDragEnd: null,
      ...options
    };

    this.currentSnap = this.options.defaultSnap;
    this.isDragging = false;
    this.startY = 0;
    this.startHeight = 0;
    this.lastY = 0;
    this.lastTime = 0;
    this.velocity = 0;

    this.init();
  }

  init() {
    this.element.classList.add('bottom-sheet-enhanced');
    this.createHandle();
    this.attachEvents();
    this.snapTo(this.currentSnap, false);
  }

  createHandle() {
    if (!this.element.querySelector('.bottom-sheet-handle')) {
      const handle = document.createElement('div');
      handle.className = 'bottom-sheet-handle';
      handle.innerHTML = `
        <div class="bottom-sheet-handle-bar"></div>
        <span class="bottom-sheet-scroll-hint">Desliza para expandir</span>
      `;
      this.element.insertBefore(handle, this.element.firstChild);
    }
    this.handle = this.element.querySelector('.bottom-sheet-handle');
  }

  attachEvents() {
    // Touch events
    this.handle.addEventListener('touchstart', this.onDragStart.bind(this), { passive: true });
    document.addEventListener('touchmove', this.onDragMove.bind(this), { passive: false });
    document.addEventListener('touchend', this.onDragEnd.bind(this));

    // Mouse events (para desktop)
    this.handle.addEventListener('mousedown', this.onDragStart.bind(this));
    document.addEventListener('mousemove', this.onDragMove.bind(this));
    document.addEventListener('mouseup', this.onDragEnd.bind(this));

    // Click en handle para toggle
    this.handle.addEventListener('click', (e) => {
      if (!this.wasDragging) {
        this.toggle();
      }
    });

    // Keyboard
    this.handle.setAttribute('tabindex', '0');
    this.handle.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.toggle();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        this.snapToNext();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        this.snapToPrev();
      }
    });
  }

  onDragStart(e) {
    this.isDragging = true;
    this.wasDragging = false;
    this.element.classList.add('dragging');
    this.element.style.transition = 'none';

    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    this.startY = clientY;
    this.startHeight = this.element.offsetHeight;
    this.lastY = clientY;
    this.lastTime = Date.now();
    this.velocity = 0;

    if (this.options.onDragStart) {
      this.options.onDragStart();
    }
  }

  onDragMove(e) {
    if (!this.isDragging) return;

    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const deltaY = this.startY - clientY;
    const currentTime = Date.now();
    const deltaTime = currentTime - this.lastTime;

    // Calcular velocidad para momentum
    if (deltaTime > 0) {
      this.velocity = (this.lastY - clientY) / deltaTime;
    }

    this.lastY = clientY;
    this.lastTime = currentTime;

    // Calcular nueva altura
    let newHeight = this.startHeight + deltaY;
    const maxHeight = window.innerHeight * 0.9;
    const minHeight = 0;

    // Resistencia en los bordes
    if (newHeight > maxHeight) {
      const overflow = newHeight - maxHeight;
      newHeight = maxHeight + (overflow * this.options.resistanceFactor);
    } else if (newHeight < minHeight) {
      const overflow = minHeight - newHeight;
      newHeight = minHeight - (overflow * this.options.resistanceFactor);
    }

    this.element.style.height = `${newHeight}px`;
    this.wasDragging = true;

    // Prevenir scroll del body
    if (e.cancelable) {
      e.preventDefault();
    }
  }

  onDragEnd(e) {
    if (!this.isDragging) return;

    this.isDragging = false;
    this.element.classList.remove('dragging');
    this.element.style.transition = '';

    // Determinar snap point basado en velocidad y posicion
    const currentHeight = this.element.offsetHeight;
    const currentRatio = currentHeight / window.innerHeight;

    let targetSnap;

    if (Math.abs(this.velocity) > this.options.velocityThreshold) {
      // Velocidad alta: ir al siguiente snap en direccion del swipe
      const direction = this.velocity > 0 ? 1 : -1;
      targetSnap = this.findNextSnap(currentRatio, direction);
    } else {
      // Velocidad baja: ir al snap mas cercano
      targetSnap = this.findNearestSnap(currentRatio);
    }

    this.snapTo(targetSnap);

    if (this.options.onDragEnd) {
      this.options.onDragEnd(targetSnap);
    }
  }

  findNearestSnap(ratio) {
    return this.options.snapPoints.reduce((closest, snap) =>
      Math.abs(snap - ratio) < Math.abs(closest - ratio) ? snap : closest
    );
  }

  findNextSnap(currentRatio, direction) {
    const sorted = [...this.options.snapPoints].sort((a, b) => a - b);
    const currentIndex = sorted.findIndex(snap =>
      Math.abs(snap - currentRatio) < 0.1
    );

    if (currentIndex === -1) {
      return this.findNearestSnap(currentRatio);
    }

    const newIndex = Math.max(0, Math.min(sorted.length - 1, currentIndex + direction));
    return sorted[newIndex];
  }

  snapTo(ratio, animate = true) {
    const snapName = this.getSnapName(ratio);

    if (animate) {
      this.element.style.transition = 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), height 0.4s cubic-bezier(0.22, 1, 0.36, 1)';
    }

    if (ratio === 0) {
      this.element.style.height = '';
      this.element.classList.remove('open');
      this.element.setAttribute('data-snap', 'closed');
    } else {
      this.element.style.height = `${ratio * 100}vh`;
      this.element.classList.add('open');
      this.element.setAttribute('data-snap', snapName);
    }

    this.currentSnap = ratio;

    // Haptic feedback
    if ('vibrate' in navigator && animate) {
      navigator.vibrate(10);
    }

    if (this.options.onSnapChange) {
      this.options.onSnapChange(ratio, snapName);
    }

    // Limpiar transition despues de animar
    if (animate) {
      setTimeout(() => {
        this.element.style.transition = '';
      }, 400);
    }
  }

  getSnapName(ratio) {
    if (ratio === 0) return 'closed';
    if (ratio <= 0.3) return 'peek';
    if (ratio <= 0.6) return 'half';
    return 'full';
  }

  toggle() {
    if (this.currentSnap === 0) {
      this.snapTo(this.options.defaultSnap);
    } else if (this.currentSnap < 0.5) {
      this.snapTo(0.5);
    } else if (this.currentSnap < 1) {
      this.snapTo(1);
    } else {
      this.snapTo(this.options.defaultSnap);
    }
  }

  snapToNext() {
    const sorted = [...this.options.snapPoints].sort((a, b) => a - b);
    const currentIndex = sorted.indexOf(this.currentSnap);
    const newIndex = Math.min(sorted.length - 1, currentIndex + 1);
    this.snapTo(sorted[newIndex]);
  }

  snapToPrev() {
    const sorted = [...this.options.snapPoints].sort((a, b) => a - b);
    const currentIndex = sorted.indexOf(this.currentSnap);
    const newIndex = Math.max(0, currentIndex - 1);
    this.snapTo(sorted[newIndex]);
  }

  open() {
    this.snapTo(this.options.defaultSnap);
  }

  close() {
    this.snapTo(0);
  }

  expand() {
    this.snapTo(1);
  }
}


// ========================================
// 3. SISTEMA DE TOOLTIPS INTELIGENTES
// ========================================

class SmartTooltipSystem {
  constructor() {
    this.tooltip = null;
    this.currentTarget = null;
    this.showTimeout = null;
    this.hideTimeout = null;
    this.delay = 200;
    this.init();
  }

  init() {
    this.createTooltip();
    this.attachGlobalListeners();
  }

  createTooltip() {
    if (!document.querySelector('.smart-tooltip')) {
      this.tooltip = document.createElement('div');
      this.tooltip.className = 'smart-tooltip';
      this.tooltip.setAttribute('role', 'tooltip');
      this.tooltip.setAttribute('aria-hidden', 'true');
      document.body.appendChild(this.tooltip);
    } else {
      this.tooltip = document.querySelector('.smart-tooltip');
    }
  }

  attachGlobalListeners() {
    // Delegacion de eventos para elementos con data-tooltip
    // Verificar que e.target sea un elemento DOM antes de usar closest()
    document.addEventListener('mouseenter', (e) => {
      if (!e.target || !e.target.closest) return;
      const target = e.target.closest('[data-tooltip]');
      if (target) {
        this.scheduleShow(target);
      }
    }, true);

    document.addEventListener('mouseleave', (e) => {
      if (!e.target || !e.target.closest) return;
      const target = e.target.closest('[data-tooltip]');
      if (target) {
        this.scheduleHide();
      }
    }, true);

    // Focus para accesibilidad
    document.addEventListener('focusin', (e) => {
      if (!e.target || !e.target.closest) return;
      const target = e.target.closest('[data-tooltip]');
      if (target) {
        this.show(target);
      }
    });

    document.addEventListener('focusout', (e) => {
      if (!e.target || !e.target.closest) return;
      const target = e.target.closest('[data-tooltip]');
      if (target) {
        this.hide();
      }
    });

    // Ocultar al hacer scroll
    document.addEventListener('scroll', () => this.hide(), { passive: true });

    // Touch: long press
    let longPressTimer;
    document.addEventListener('touchstart', (e) => {
      if (!e.target || !e.target.closest) return;
      const target = e.target.closest('[data-tooltip]');
      if (target) {
        longPressTimer = setTimeout(() => {
          this.show(target);
        }, 500);
      }
    }, { passive: true });

    document.addEventListener('touchend', () => {
      clearTimeout(longPressTimer);
      this.scheduleHide();
    });
  }

  scheduleShow(target) {
    clearTimeout(this.hideTimeout);
    this.showTimeout = setTimeout(() => {
      this.show(target);
    }, this.delay);
  }

  scheduleHide() {
    clearTimeout(this.showTimeout);
    this.hideTimeout = setTimeout(() => {
      this.hide();
    }, 100);
  }

  show(target) {
    if (this.currentTarget === target) return;

    this.currentTarget = target;
    const content = target.dataset.tooltip;
    const tooltipType = target.dataset.tooltipType || 'text';
    const title = target.dataset.tooltipTitle;

    // Construir contenido
    let html = '';
    if (tooltipType === 'attribute') {
      const icon = target.dataset.tooltipIcon || '';
      const value = target.dataset.tooltipValue || '';
      html = `
        <div class="smart-tooltip-icon">${icon}</div>
        <div>
          ${title ? `<div class="smart-tooltip-title">${title}</div>` : ''}
          ${value ? `<div class="smart-tooltip-value">${value}</div>` : ''}
          <div>${content}</div>
        </div>
      `;
      this.tooltip.classList.add('tooltip-attribute');
    } else {
      html = `
        ${title ? `<div class="smart-tooltip-title">${title}</div>` : ''}
        <div>${content}</div>
      `;
      this.tooltip.classList.remove('tooltip-attribute');
    }

    this.tooltip.innerHTML = html;

    // Posicionar
    this.position(target);

    // Mostrar
    this.tooltip.classList.add('visible');
    this.tooltip.setAttribute('aria-hidden', 'false');

    // Vincular con target para accesibilidad
    const tooltipId = 'tooltip-' + Date.now();
    this.tooltip.id = tooltipId;
    target.setAttribute('aria-describedby', tooltipId);
  }

  position(target) {
    const targetRect = target.getBoundingClientRect();
    const tooltipRect = this.tooltip.getBoundingClientRect();
    const padding = 12;
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    // Calcular posiciones posibles
    const positions = {
      top: {
        top: targetRect.top - tooltipRect.height - padding,
        left: targetRect.left + (targetRect.width - tooltipRect.width) / 2,
        fits: targetRect.top > tooltipRect.height + padding
      },
      bottom: {
        top: targetRect.bottom + padding,
        left: targetRect.left + (targetRect.width - tooltipRect.width) / 2,
        fits: viewport.height - targetRect.bottom > tooltipRect.height + padding
      },
      left: {
        top: targetRect.top + (targetRect.height - tooltipRect.height) / 2,
        left: targetRect.left - tooltipRect.width - padding,
        fits: targetRect.left > tooltipRect.width + padding
      },
      right: {
        top: targetRect.top + (targetRect.height - tooltipRect.height) / 2,
        left: targetRect.right + padding,
        fits: viewport.width - targetRect.right > tooltipRect.width + padding
      }
    };

    // Elegir mejor posicion (prioridad: top > bottom > right > left)
    const priority = ['top', 'bottom', 'right', 'left'];
    let chosen = positions.top;
    let chosenName = 'top';

    for (const pos of priority) {
      if (positions[pos].fits) {
        chosen = positions[pos];
        chosenName = pos;
        break;
      }
    }

    // Ajustar para no salirse de pantalla
    chosen.left = Math.max(padding, Math.min(chosen.left, viewport.width - tooltipRect.width - padding));
    chosen.top = Math.max(padding, Math.min(chosen.top, viewport.height - tooltipRect.height - padding));

    // Aplicar posicion
    this.tooltip.style.top = `${chosen.top}px`;
    this.tooltip.style.left = `${chosen.left}px`;

    // Clase de posicion para flecha
    this.tooltip.className = `smart-tooltip position-${chosenName}`;
  }

  hide() {
    this.tooltip.classList.remove('visible');
    this.tooltip.setAttribute('aria-hidden', 'true');

    if (this.currentTarget) {
      this.currentTarget.removeAttribute('aria-describedby');
      this.currentTarget = null;
    }
  }
}


// ========================================
// 4. FAB TOUCH HANDLER
// ========================================

class FABTouchHandler {
  constructor() {
    this.longPressTimer = null;
    this.longPressDuration = 500;
    this.init();
  }

  init() {
    document.querySelectorAll('.fab:not(.fab-primary)').forEach(fab => {
      this.attachTouchEvents(fab);
    });
  }

  attachTouchEvents(fab) {
    // Crear tooltip touch si no existe
    if (!fab.querySelector('.fab-tooltip-touch')) {
      const label = fab.querySelector('.fab-label')?.textContent ||
                    fab.getAttribute('aria-label') ||
                    fab.title || '';

      if (label) {
        const tooltip = document.createElement('span');
        tooltip.className = 'fab-tooltip-touch';
        tooltip.textContent = label;
        fab.appendChild(tooltip);
      }
    }

    // Long press para mostrar tooltip
    fab.addEventListener('touchstart', (e) => {
      this.longPressTimer = setTimeout(() => {
        fab.classList.add('show-tooltip');
        if ('vibrate' in navigator) {
          navigator.vibrate(20);
        }
      }, this.longPressDuration);
    }, { passive: true });

    fab.addEventListener('touchend', () => {
      clearTimeout(this.longPressTimer);
      fab.classList.remove('show-tooltip');
    });

    fab.addEventListener('touchmove', () => {
      clearTimeout(this.longPressTimer);
      fab.classList.remove('show-tooltip');
    });
  }

  refresh() {
    this.init();
  }
}


// ========================================
// 5. LOADING STATES MANAGER
// ========================================

class LoadingStatesManager {
  constructor() {
    this.activeLoaders = new Map();
  }

  showCardLoading(selector) {
    const cards = document.querySelectorAll(selector);
    cards.forEach(card => {
      card.classList.add('loading');
      const id = card.id || `card-${Date.now()}`;
      this.activeLoaders.set(id, card);
    });
  }

  hideCardLoading(selector) {
    const cards = document.querySelectorAll(selector);
    cards.forEach(card => {
      card.classList.remove('loading');
    });
  }

  showButtonLoading(button) {
    if (typeof button === 'string') {
      button = document.querySelector(button);
    }
    if (button) {
      button.classList.add('loading');
      button.disabled = true;
    }
  }

  hideButtonLoading(button) {
    if (typeof button === 'string') {
      button = document.querySelector(button);
    }
    if (button) {
      button.classList.remove('loading');
      button.disabled = false;
    }
  }

  showOverlay(container, message = 'Cargando...') {
    if (typeof container === 'string') {
      container = document.querySelector(container);
    }
    if (!container) return;

    let overlay = container.querySelector('.loading-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'loading-overlay';
      overlay.innerHTML = `
        <div class="loading-spinner-large"></div>
        <div class="loading-text">${message}</div>
      `;
      container.style.position = 'relative';
      container.appendChild(overlay);
    }

    overlay.querySelector('.loading-text').textContent = message;
    requestAnimationFrame(() => {
      overlay.classList.add('active');
    });
  }

  hideOverlay(container) {
    if (typeof container === 'string') {
      container = document.querySelector(container);
    }
    if (!container) return;

    const overlay = container.querySelector('.loading-overlay');
    if (overlay) {
      overlay.classList.remove('active');
    }
  }

  createSkeletonCards(container, count = 3, template = 'default') {
    if (typeof container === 'string') {
      container = document.querySelector(container);
    }
    if (!container) return;

    const templates = {
      default: `
        <div class="piece-card loading">
          <div class="skeleton skeleton-text" style="width: 60%"></div>
          <div class="skeleton skeleton-text" style="width: 80%"></div>
          <div class="skeleton skeleton-text" style="width: 40%"></div>
        </div>
      `,
      mission: `
        <div class="mission-card loading">
          <div class="skeleton skeleton-avatar"></div>
          <div class="skeleton skeleton-text" style="width: 70%"></div>
          <div class="skeleton skeleton-text" style="width: 50%"></div>
        </div>
      `
    };

    const html = templates[template] || templates.default;
    container.innerHTML = Array(count).fill(html).join('');
  }
}


// ========================================
// 6. INICIALIZACION GLOBAL
// ========================================

// Auto-inicializar cuando DOM este listo
document.addEventListener('DOMContentLoaded', () => {
  // Toast system
  window.enhancedToast = new EnhancedToastSystem();

  // Tooltips
  window.smartTooltips = new SmartTooltipSystem();

  // FAB touch handler
  window.fabTouchHandler = new FABTouchHandler();

  // Loading manager
  window.loadingStates = new LoadingStatesManager();

  console.log('✅ Enhanced UI System initialized');
});

// Exportar para uso como modulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    EnhancedToastSystem,
    EnhancedBottomSheet,
    SmartTooltipSystem,
    FABTouchHandler,
    LoadingStatesManager
  };
}

// Exponer globalmente
window.EnhancedToastSystem = EnhancedToastSystem;
window.EnhancedBottomSheet = EnhancedBottomSheet;
window.SmartTooltipSystem = SmartTooltipSystem;
window.FABTouchHandler = FABTouchHandler;
window.LoadingStatesManager = LoadingStatesManager;
