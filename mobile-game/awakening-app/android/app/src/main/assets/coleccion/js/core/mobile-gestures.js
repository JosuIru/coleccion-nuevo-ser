/**
 * MOBILE GESTURES - Sistema de gestos optimizado para móvil
 * Manejo mejorado de touch, swipe, y scroll momentum
 *
 * @version 1.0.0
 * @author J. Irurtzun & Claude Sonnet 4.5
 */

class MobileGestures {
  constructor() {
    this.touchStartY = 0;
    this.touchStartX = 0;
    this.touchEndY = 0;
    this.touchEndX = 0;
    this.scrollLocks = new Set();
    this.activeGestures = new Map();

    this.init();
  }

  /**
   * Inicializar sistema de gestos
   */
  init() {
    // Detectar si es dispositivo móvil
    this.isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    this.isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (this.isMobile) {
      this.setupGlobalGestures();
      this.preventUnwantedZoom();
      this.optimizeScrollPerformance();
    }

    console.log('📱 MobileGestures inicializado', {
      isMobile: this.isMobile,
      isIOS: this.isIOS
    });
  }

  /**
   * Configurar gestos globales
   */
  setupGlobalGestures() {
    // Prevenir comportamiento por defecto de algunos gestos
    document.addEventListener('gesturestart', (e) => {
      e.preventDefault();
    }, { passive: false });

    document.addEventListener('gesturechange', (e) => {
      e.preventDefault();
    }, { passive: false });

    document.addEventListener('gestureend', (e) => {
      e.preventDefault();
    }, { passive: false });
  }

  /**
   * Prevenir zoom no deseado
   */
  preventUnwantedZoom() {
    // Prevenir doble-tap zoom en elementos específicos
    const preventZoomElements = [
      '.lab-button',
      '.piece-card',
      '.mission-card',
      '.being-card'
    ];

    preventZoomElements.forEach(selector => {
      document.addEventListener('touchend', (e) => {
        if (e.target.closest(selector)) {
          const now = Date.now();
          const lastTap = this.lastTap || 0;

          if (now - lastTap < 300) {
            e.preventDefault();
          }

          this.lastTap = now;
        }
      }, { passive: false });
    });
  }

  /**
   * Optimizar rendimiento de scroll
   */
  optimizeScrollPerformance() {
    // Detectar scroll y aplicar optimizaciones
    let scrolling = false;

    const scrollableElements = [
      '.pieces-container',
      '.book-tree-content',
      '.chapter-tree-content',
      '.modal-body',
      '.scrollable-container'
    ];

    scrollableElements.forEach(selector => {
      document.addEventListener('scroll', (e) => {
        const target = e.target;
        if (target.matches && target.matches(selector)) {
          if (!scrolling) {
            scrolling = true;
            requestAnimationFrame(() => {
              // Optimizaciones durante scroll
              scrolling = false;
            });
          }
        }
      }, { passive: true, capture: true });
    });
  }

  /**
   * Detectar dirección de swipe
   * @param {TouchEvent} startEvent
   * @param {TouchEvent} endEvent
   * @returns {string} 'up', 'down', 'left', 'right', or null
   */
  detectSwipeDirection(startEvent, endEvent) {
    const startX = startEvent.touches[0].clientX;
    const startY = startEvent.touches[0].clientY;
    const endX = endEvent.changedTouches[0].clientX;
    const endY = endEvent.changedTouches[0].clientY;

    const deltaX = endX - startX;
    const deltaY = endY - startY;

    const minSwipeDistance = 50; // píxeles

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Swipe horizontal
      if (Math.abs(deltaX) > minSwipeDistance) {
        return deltaX > 0 ? 'right' : 'left';
      }
    } else {
      // Swipe vertical
      if (Math.abs(deltaY) > minSwipeDistance) {
        return deltaY > 0 ? 'down' : 'up';
      }
    }

    return null;
  }

  /**
   * Añadir soporte de swipe a un elemento
   * @param {HTMLElement} element
   * @param {Object} callbacks - { onSwipeUp, onSwipeDown, onSwipeLeft, onSwipeRight }
   */
  addSwipeSupport(element, callbacks = {}) {
    if (!element) return;

    let touchStartEvent = null;

    element.addEventListener('touchstart', (e) => {
      touchStartEvent = e;
    }, { passive: true });

    element.addEventListener('touchend', (e) => {
      if (!touchStartEvent) return;

      const direction = this.detectSwipeDirection(touchStartEvent, e);

      if (direction && callbacks[`onSwipe${direction.charAt(0).toUpperCase() + direction.slice(1)}`]) {
        callbacks[`onSwipe${direction.charAt(0).toUpperCase() + direction.slice(1)}`](e);
      }

      touchStartEvent = null;
    }, { passive: true });
  }

  /**
   * Bloquear scroll en un elemento específico
   * @param {HTMLElement|string} element
   */
  lockScroll(element) {
    const el = typeof element === 'string' ? document.querySelector(element) : element;
    if (!el) return;

    el.style.overflow = 'hidden';
    el.style.touchAction = 'none';
    this.scrollLocks.add(el);
  }

  /**
   * Desbloquear scroll en un elemento
   * @param {HTMLElement|string} element
   */
  unlockScroll(element) {
    const el = typeof element === 'string' ? document.querySelector(element) : element;
    if (!el) return;

    el.style.overflow = '';
    el.style.touchAction = '';
    this.scrollLocks.delete(el);
  }

  /**
   * Desbloquear todos los scrolls
   */
  unlockAllScrolls() {
    this.scrollLocks.forEach(el => {
      el.style.overflow = '';
      el.style.touchAction = '';
    });
    this.scrollLocks.clear();
  }

  /**
   * Scroll suave a un elemento
   * @param {HTMLElement|string} element
   * @param {Object} options
   */
  smoothScrollTo(element, options = {}) {
    const el = typeof element === 'string' ? document.querySelector(element) : element;
    if (!el) return;

    const defaultOptions = {
      behavior: 'smooth',
      block: 'start',
      inline: 'nearest',
      ...options
    };

    el.scrollIntoView(defaultOptions);
  }

  /**
   * Configurar bottom sheet con gestos mejorados
   * @param {HTMLElement} bottomSheet
   * @param {Object} options
   */
  setupBottomSheet(bottomSheet, options = {}) {
    if (!bottomSheet) return;

    const handle = bottomSheet.querySelector('[id*="handle"]') || bottomSheet.querySelector('.handle');
    if (!handle) {
      console.warn('⚠️ No se encontró handle para bottom sheet');
      return;
    }

    let startY = 0;
    let currentY = 0;
    let isDragging = false;
    let startTime = 0;
    let startPos = 0;

    const states = options.states || {
      collapsed: 0.1,
      half: 0.5,
      full: 0.9
    };

    let currentState = 'collapsed';

    // Prevenir scroll del contenido mientras se arrastra el handle
    handle.addEventListener('touchstart', (e) => {
      isDragging = true;
      startY = e.touches[0].clientY;
      startTime = Date.now();
      startPos = bottomSheet.getBoundingClientRect().top;

      bottomSheet.style.transition = 'none';

      // Bloquear scroll del body
      this.lockScroll(document.body);
    }, { passive: false });

    handle.addEventListener('touchmove', (e) => {
      if (!isDragging) return;

      currentY = e.touches[0].clientY;
      const deltaY = currentY - startY;

      // Aplicar transformación temporal
      const newPos = Math.max(window.innerHeight * 0.1, Math.min(window.innerHeight * 0.9, startPos + deltaY));
      const percentage = newPos / window.innerHeight;

      bottomSheet.style.transform = `translateY(${newPos}px)`;

      e.preventDefault();
    }, { passive: false });

    handle.addEventListener('touchend', (e) => {
      if (!isDragging) return;

      isDragging = false;
      bottomSheet.style.transition = '';

      const deltaY = currentY - startY;
      const deltaTime = Date.now() - startTime;
      const velocity = Math.abs(deltaY) / deltaTime;

      // Determinar nuevo estado basado en velocidad y dirección
      let newState = currentState;

      if (velocity > 0.5) {
        // Swipe rápido
        if (deltaY < 0) {
          // Swipe up
          newState = currentState === 'collapsed' ? 'half' : 'full';
        } else {
          // Swipe down
          newState = currentState === 'full' ? 'half' : 'collapsed';
        }
      } else {
        // Movimiento lento - snap al estado más cercano
        const percentage = bottomSheet.getBoundingClientRect().top / window.innerHeight;

        if (percentage < 0.3) {
          newState = 'full';
        } else if (percentage < 0.7) {
          newState = 'half';
        } else {
          newState = 'collapsed';
        }
      }

      // Aplicar nuevo estado
      this.setBottomSheetState(bottomSheet, newState, states);
      currentState = newState;

      // Desbloquear scroll
      this.unlockScroll(document.body);

      // Callback si está definido
      if (options.onStateChange) {
        options.onStateChange(newState);
      }
    }, { passive: false });
  }

  /**
   * Establecer estado del bottom sheet
   */
  setBottomSheetState(bottomSheet, state, states) {
    const percentage = states[state] || 0.5;
    const translateY = window.innerHeight * (1 - percentage);

    bottomSheet.style.transform = `translateY(${translateY}px)`;
    bottomSheet.dataset.state = state;
  }

  /**
   * Configurar modal con swipe para cerrar
   * @param {HTMLElement} modal
   * @param {Function} onClose
   */
  setupSwipeToCloseModal(modal, onClose) {
    if (!modal) return;

    let startY = 0;
    let currentY = 0;
    let isDragging = false;

    modal.addEventListener('touchstart', (e) => {
      // Solo permitir swipe desde el header o áreas no scrollables
      if (e.target.closest('.modal-header') || e.target.closest('.non-scrollable')) {
        startY = e.touches[0].clientY;
        isDragging = true;
        modal.style.transition = 'none';
      }
    }, { passive: true });

    modal.addEventListener('touchmove', (e) => {
      if (!isDragging) return;

      currentY = e.touches[0].clientY;
      const deltaY = currentY - startY;

      if (deltaY > 0) {
        // Solo permitir swipe down
        modal.style.transform = `translateY(${deltaY}px)`;
        modal.style.opacity = Math.max(0, 1 - (deltaY / 300));
      }
    }, { passive: true });

    modal.addEventListener('touchend', (e) => {
      if (!isDragging) return;

      isDragging = false;
      modal.style.transition = '';

      const deltaY = currentY - startY;

      if (deltaY > 150) {
        // Cerrar modal
        modal.style.transform = 'translateY(100%)';
        modal.style.opacity = '0';
        setTimeout(() => {
          if (onClose) onClose();
          modal.remove();
        }, 300);
      } else {
        // Volver a posición original
        modal.style.transform = '';
        modal.style.opacity = '1';
      }
    }, { passive: true });
  }

  /**
   * Añadir pull-to-refresh a un contenedor
   * @param {HTMLElement} container
   * @param {Function} onRefresh
   */
  addPullToRefresh(container, onRefresh) {
    if (!container || !onRefresh) return;

    let startY = 0;
    let pulling = false;
    const pullThreshold = 80;

    const refreshIndicator = document.createElement('div');
    refreshIndicator.className = 'pull-to-refresh-indicator';
    refreshIndicator.style.cssText = `
      position: absolute;
      top: -60px;
      left: 50%;
      transform: translateX(-50%);
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: rgba(212, 175, 55, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      transition: all 0.3s ease;
    `;
    refreshIndicator.textContent = '↓';

    container.style.position = 'relative';
    container.appendChild(refreshIndicator);

    container.addEventListener('touchstart', (e) => {
      if (container.scrollTop === 0) {
        startY = e.touches[0].clientY;
        pulling = true;
      }
    }, { passive: true });

    container.addEventListener('touchmove', (e) => {
      if (!pulling) return;

      const currentY = e.touches[0].clientY;
      const deltaY = currentY - startY;

      if (deltaY > 0 && container.scrollTop === 0) {
        const pullDistance = Math.min(deltaY, pullThreshold * 1.5);
        refreshIndicator.style.top = `${-60 + pullDistance}px`;
        refreshIndicator.style.opacity = Math.min(pullDistance / pullThreshold, 1);

        if (pullDistance >= pullThreshold) {
          refreshIndicator.textContent = '↻';
          refreshIndicator.style.transform = 'translateX(-50%) rotate(180deg)';
        } else {
          refreshIndicator.textContent = '↓';
          refreshIndicator.style.transform = 'translateX(-50%)';
        }
      }
    }, { passive: true });

    container.addEventListener('touchend', (e) => {
      if (!pulling) return;

      pulling = false;

      const currentTop = parseInt(refreshIndicator.style.top);

      if (currentTop >= pullThreshold - 60) {
        // Trigger refresh
        refreshIndicator.textContent = '...';
        refreshIndicator.style.animation = 'spin 1s linear infinite';

        onRefresh().then(() => {
          refreshIndicator.style.top = '-60px';
          refreshIndicator.style.opacity = '0';
          refreshIndicator.style.animation = '';
        });
      } else {
        refreshIndicator.style.top = '-60px';
        refreshIndicator.style.opacity = '0';
      }
    }, { passive: true });
  }
}

// CSS para pull-to-refresh
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    from { transform: translateX(-50%) rotate(0deg); }
    to { transform: translateX(-50%) rotate(360deg); }
  }
`;
document.head.appendChild(style);

// Exportar instancia global
if (typeof window !== 'undefined') {
  window.mobileGestures = new MobileGestures();
}
