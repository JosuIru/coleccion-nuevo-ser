/**
// 🔧 FIX v2.9.198: Migrated console.log to logger
 * SISTEMA DE TOOLTIPS ESTILO GRIMORIO
 * Tooltips elegantes con textura de pergamino para atributos
 * @version 2.0.0 - Corregido para mejor funcionamiento en móvil
 */

class FrankensteinTooltips {
  constructor() {
    this.tooltip = null;
    this.currentTarget = null;
    this.hideTimeout = null;
    this.isVisible = false;
    this.isTouchDevice = false;
  }

  escapeHtml(text) {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  init() {
    // Detectar dispositivo táctil
    this.isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

    // Crear tooltip en el body para mejor posicionamiento
    if (this.tooltip) {
      this.tooltip.remove();
    }

    this.tooltip = document.createElement('div');
    this.tooltip.className = 'grimoire-tooltip';
    this.tooltip.style.cssText = `
      position: fixed;
      z-index: 999999;
      pointer-events: none;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.2s ease, visibility 0.2s ease;
      max-width: 280px;
      padding: 12px 16px;
      background: linear-gradient(135deg, #1a1520 0%, #2d2438 100%);
      border: 2px solid #d4af37;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5), 0 0 15px rgba(212, 175, 55, 0.2);
      font-size: 13px;
      color: #f4e9d8;
    `;
    document.body.appendChild(this.tooltip);

    // Adjuntar listeners
    this.attachListeners();

    logger.debug('✨ Sistema de tooltips v2 inicializado');
  }

  attachListeners() {
    // Remover listeners anteriores si existen
    this.removeListeners();

    // Guardar referencias para poder remover después
    this._onMouseEnter = this.handleMouseEnter.bind(this);
    this._onMouseLeave = this.handleMouseLeave.bind(this);
    this._onTouchStart = this.handleTouchStart.bind(this);
    this._onTouchEnd = this.handleTouchEnd.bind(this);
    this._onScroll = this.handleScroll.bind(this);
    this._onClick = this.handleClick.bind(this);

    if (this.isTouchDevice) {
      // Móvil: usar touch events
      document.addEventListener('touchstart', this._onTouchStart, { passive: true });
      document.addEventListener('touchend', this._onTouchEnd, { passive: true });
    } else {
      // Desktop: usar mouse events con delegación
      document.addEventListener('mouseover', this._onMouseEnter, true);
      document.addEventListener('mouseout', this._onMouseLeave, true);
    }

    // Ocultar al hacer scroll o click en cualquier lugar
    document.addEventListener('scroll', this._onScroll, true);
    document.addEventListener('click', this._onClick, true);
  }

  removeListeners() {
    if (this._onMouseEnter) {
      document.removeEventListener('mouseover', this._onMouseEnter, true);
    }
    if (this._onMouseLeave) {
      document.removeEventListener('mouseout', this._onMouseLeave, true);
    }
    if (this._onTouchStart) {
      document.removeEventListener('touchstart', this._onTouchStart);
    }
    if (this._onTouchEnd) {
      document.removeEventListener('touchend', this._onTouchEnd);
    }
    if (this._onScroll) {
      document.removeEventListener('scroll', this._onScroll, true);
    }
    if (this._onClick) {
      document.removeEventListener('click', this._onClick, true);
    }
  }

  handleMouseEnter(e) {
    if (!e.target || typeof e.target.closest !== 'function') return;

    const target = e.target.closest('[data-tooltip]');
    if (target && target !== this.currentTarget) {
      this.clearHideTimeout();
      this.show(target);
    }
  }

  handleMouseLeave(e) {
    if (!e.target || typeof e.target.closest !== 'function') return;

    const target = e.target.closest('[data-tooltip]');
    if (target && target === this.currentTarget) {
      // Verificar que realmente salimos del elemento
      const relatedTarget = e.relatedTarget;
      if (!relatedTarget || !target.contains(relatedTarget)) {
        this.scheduleHide(100);
      }
    }
  }

  handleTouchStart(e) {
    if (!e.target || typeof e.target.closest !== 'function') return;

    const target = e.target.closest('[data-tooltip]');

    // Si tocamos otro elemento o el mismo, primero ocultar el anterior
    if (this.isVisible) {
      this.hide();
    }

    if (target) {
      // Pequeño delay para mostrar el tooltip
      setTimeout(() => {
        this.show(target);
        // Auto-ocultar después de 2.5 segundos en móvil
        this.scheduleHide(2500);
      }, 100);
    }
  }

  handleTouchEnd(e) {
    // No ocultar inmediatamente para que el usuario pueda leer
  }

  handleScroll() {
    if (this.isVisible) {
      this.hide();
    }
  }

  handleClick(e) {
    // Ocultar tooltip si se hace click fuera del target actual
    if (this.isVisible && this.currentTarget) {
      if (!e.target || typeof e.target.closest !== 'function') {
        this.hide();
        return;
      }
      const clickedTooltipTarget = e.target.closest('[data-tooltip]');
      if (clickedTooltipTarget !== this.currentTarget) {
        this.hide();
      }
    }
  }

  scheduleHide(delay = 150) {
    this.clearHideTimeout();
    this.hideTimeout = setTimeout(() => {
      this.hide();
    }, delay);
  }

  clearHideTimeout() {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
  }

  show(target) {
    if (!this.tooltip || !target) return;

    this.currentTarget = target;
    this.isVisible = true;

    // Obtener datos del tooltip (sanitizados para prevenir XSS)
    const tooltipData = this.escapeHtml(target.dataset.tooltip);
    const tooltipType = target.dataset.tooltipType || 'text';

    let content = '';

    if (tooltipType === 'attribute') {
      const attrName = this.escapeHtml(target.dataset.tooltipName || '');
      const attrIcon = this.escapeHtml(target.dataset.tooltipIcon || '✨');
      const attrValue = this.escapeHtml(target.dataset.tooltipValue || '0');
      const attrDesc = this.escapeHtml(target.dataset.tooltipDesc || '');

      content = `
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px; font-weight: 600; color: #d4af37;">
          <span style="font-size: 1.2em;">${attrIcon}</span>
          <span>${attrName}</span>
        </div>
        <div style="color: #c4b89b; line-height: 1.4; margin-bottom: 8px;">${attrDesc}</div>
        <div style="color: #10b981; font-weight: 600;">+${attrValue} puntos</div>
      `;
    } else if (tooltipType === 'mission') {
      const missionName = this.escapeHtml(target.dataset.tooltipName || '');
      const missionDesc = this.escapeHtml(target.dataset.tooltipDesc || '');

      content = `
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px; font-weight: 600; color: #d4af37;">
          <span style="font-size: 1.2em;">🎯</span>
          <span>${missionName}</span>
        </div>
        <div style="color: #c4b89b; line-height: 1.4;">${missionDesc}</div>
      `;
    } else if (tooltipType === 'help') {
      const helpTitle = this.escapeHtml(target.dataset.tooltipTitle || 'Ayuda');
      content = `
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px; font-weight: 600; color: #60a5fa;">
          <span style="font-size: 1.2em;">💡</span>
          <span>${helpTitle}</span>
        </div>
        <div style="color: #c4b89b; line-height: 1.4;">${tooltipData}</div>
      `;
    } else {
      // Tooltip simple de texto
      content = `<div style="color: #c4b89b; line-height: 1.4;">${tooltipData}</div>`;
    }

    this.tooltip.innerHTML = content;

    // Mostrar tooltip para obtener dimensiones
    this.tooltip.style.opacity = '0';
    this.tooltip.style.visibility = 'visible';

    // Posicionar después de un frame para tener dimensiones correctas
    requestAnimationFrame(() => {
      this.position(target);
      this.tooltip.style.opacity = '1';
    });
  }

  position(target) {
    if (!this.tooltip || !target) return;

    const rect = target.getBoundingClientRect();
    const tooltipRect = this.tooltip.getBoundingClientRect();
    const padding = 10;

    // Calcular posición centrada arriba del elemento
    let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
    let top = rect.top - tooltipRect.height - padding;

    // Ajustar si se sale por la izquierda
    if (left < padding) {
      left = padding;
    }

    // Ajustar si se sale por la derecha
    if (left + tooltipRect.width > window.innerWidth - padding) {
      left = window.innerWidth - tooltipRect.width - padding;
    }

    // Si se sale por arriba, mostrar abajo
    if (top < padding) {
      top = rect.bottom + padding;
    }

    // Si se sale por abajo también, ajustar altura
    if (top + tooltipRect.height > window.innerHeight - padding) {
      top = window.innerHeight - tooltipRect.height - padding;
    }

    this.tooltip.style.left = `${left}px`;
    this.tooltip.style.top = `${top}px`;
  }

  hide() {
    if (!this.tooltip) return;

    this.clearHideTimeout();
    this.tooltip.style.opacity = '0';
    this.tooltip.style.visibility = 'hidden';
    this.currentTarget = null;
    this.isVisible = false;
  }

  destroy() {
    this.removeListeners();
    if (this.tooltip) {
      this.tooltip.remove();
      this.tooltip = null;
    }
    this.currentTarget = null;
    this.isVisible = false;
  }
}

/**
 * INDICADOR DE PODER TOTAL
 * Muestra el poder acumulado de las piezas seleccionadas
 */
class PowerIndicator {
  constructor() {
    this.container = null;
    this.totalPower = 0;
    this.maxPower = 1000;
    this.pieceCount = 0;
  }

  init(parentContainer) {
    // Buscar contenedor padre o usar el proporcionado
    const targetContainer = parentContainer || document.getElementById('challenges-modal') || document.body;

    if (this.container) {
      this.container.remove();
    }

    this.container = document.createElement('div');
    this.container.className = 'power-indicator entering';
    this.container.innerHTML = `
      <div class="power-indicator-title">⚡ Poder Total</div>
      <div class="power-vial">
        <div class="power-liquid" style="height: 0%"></div>
      </div>
      <div class="power-value">0</div>
      <div class="power-breakdown">0 piezas seleccionadas</div>
    `;

    targetContainer.appendChild(this.container);

    setTimeout(() => {
      this.container.classList.remove('entering');
    }, 600);
  }

  update(power, pieceCount) {
    if (!this.container) return;

    this.totalPower = power;
    this.pieceCount = pieceCount;

    const valueEl = this.container.querySelector('.power-value');
    const breakdownEl = this.container.querySelector('.power-breakdown');
    const liquidEl = this.container.querySelector('.power-liquid');

    if (valueEl && breakdownEl && liquidEl) {
      this.animateValue(valueEl, parseInt(valueEl.textContent) || 0, power, 500);
      breakdownEl.textContent = `${pieceCount} pieza${pieceCount !== 1 ? 's' : ''} seleccionada${pieceCount !== 1 ? 's' : ''}`;

      const percentage = Math.min((power / this.maxPower) * 100, 100);
      liquidEl.style.height = `${percentage}%`;

      if (percentage >= 80) {
        this.container.classList.add('pulse-glow');
      } else {
        this.container.classList.remove('pulse-glow');
      }
    }
  }

  animateValue(element, start, end, duration) {
    if (!element) return;

    const range = end - start;
    if (range === 0) return;

    const increment = range / (duration / 16);
    let current = start;

    const timer = setInterval(() => {
      current += increment;
      if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
        current = end;
        clearInterval(timer);
      }
      element.textContent = Math.round(current);
    }, 16);
  }

  hide() {
    if (this.container) {
      this.container.style.display = 'none';
    }
  }

  show() {
    if (this.container) {
      this.container.style.display = 'block';
    }
  }

  destroy() {
    if (this.container) {
      this.container.remove();
      this.container = null;
    }
  }
}

/**
 * EFECTOS DE PARTÍCULAS
 * Partículas de energía al seleccionar piezas
 */
class EnergyParticles {
  createBurst(x, y, count = 8) {
    const container = document.body;

    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div');
      particle.className = 'energy-particle';
      particle.style.cssText = `
        position: fixed;
        width: 8px;
        height: 8px;
        background: radial-gradient(circle, #d4af37 0%, transparent 70%);
        border-radius: 50%;
        pointer-events: none;
        z-index: 999998;
        left: ${x}px;
        top: ${y}px;
      `;

      const angle = (Math.PI * 2 * i) / count;
      const distance = 50 + Math.random() * 50;
      const tx = Math.cos(angle) * distance;
      const ty = Math.sin(angle) * distance;

      particle.style.setProperty('--tx', `${tx}px`);
      particle.style.setProperty('--ty', `${ty}px`);
      particle.style.animation = 'particleBurst 0.8s ease-out forwards';

      container.appendChild(particle);
      setTimeout(() => particle.remove(), 1000);
    }
  }

  createSelectionEffect(element) {
    if (!element) return;
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    this.createBurst(centerX, centerY, 12);
  }
}

// Añadir estilos de animación para partículas si no existen
if (!document.getElementById('tooltip-particle-styles')) {
  const style = document.createElement('style');
  style.id = 'tooltip-particle-styles';
  style.textContent = `
    @keyframes particleBurst {
      0% {
        opacity: 1;
        transform: translate(0, 0) scale(1);
      }
      100% {
        opacity: 0;
        transform: translate(var(--tx, 0), var(--ty, 0)) scale(0);
      }
    }
  `;
  document.head.appendChild(style);
}

// Exportar globalmente
window.FrankensteinTooltips = FrankensteinTooltips;
window.PowerIndicator = PowerIndicator;
window.EnergyParticles = EnergyParticles;

// Auto-inicializar instancia global
window.frankensteinTooltips = new FrankensteinTooltips();
