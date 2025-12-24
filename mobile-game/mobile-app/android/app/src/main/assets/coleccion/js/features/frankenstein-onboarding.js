/**
 * FRANKENSTEIN LAB - SISTEMA DE ONBOARDING
 * Tutorial interactivo paso a paso para nuevos usuarios
 *
 * @version 1.0.0
 * @author J. Irurtzun & Claude
 */

class FrankensteinOnboarding {
  constructor() {
    this.storageKey = 'frankenstein-onboarding';
    this.currentStep = 0;
    this.isActive = false;
    this.overlay = null;
    this.spotlight = null;

    // Definición de pasos del tutorial
    this.steps = [
      {
        id: 'welcome',
        title: 'Bienvenido al Laboratorio',
        description: 'En este laboratorio crearás "Seres Transformadores" - combinaciones de conocimientos y prácticas que te ayudarán a generar cambio positivo.',
        target: null,
        position: 'center',
        icon: '🧬'
      },
      {
        id: 'missions',
        title: 'Elige una Misión',
        description: 'Cada misión representa un tipo de impacto que quieres lograr. Empieza con una misión fácil como "Explorador Curioso".',
        target: '.mission-card, .mission-tab',
        position: 'bottom',
        icon: '🎯',
        action: 'click'
      },
      {
        id: 'pieces',
        title: 'Selecciona Piezas',
        description: 'Las piezas son capítulos, ejercicios y recursos de los libros. Cada pieza aporta atributos diferentes a tu ser.',
        target: '#fab-pieces, .pieces-panel',
        position: 'left',
        icon: '📦'
      },
      {
        id: 'attributes',
        title: 'Atributos del Ser',
        description: 'Cada pieza contribuye atributos como Reflexión, Empatía, Acción o Creatividad. El balance es clave para completar misiones.',
        target: '#being-attributes, .being-attributes',
        position: 'left',
        icon: '📊'
      },
      {
        id: 'validate',
        title: 'Valida tu Ser',
        description: 'Cuando creas que tu ser tiene los atributos necesarios, presioa Validar para ver si cumple los requisitos de la misión.',
        target: '#btn-validate-being',
        position: 'top',
        icon: '⚡'
      },
      {
        id: 'rewards',
        title: 'Gana Recompensas',
        description: '¡Cada acción te da XP y monedas! Sube de nivel, desbloquea logros y construye una racha diaria.',
        target: '#fr-rewards-hud',
        position: 'bottom',
        icon: '⭐'
      },
      {
        id: 'complete',
        title: '¡Listo para Experimentar!',
        description: 'Ya conoces lo básico. Explora, crea seres únicos y descubre las combinaciones más poderosas.',
        target: null,
        position: 'center',
        icon: '🚀'
      }
    ];

    this.load();
  }

  /**
   * Cargar estado del onboarding
   */
  load() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        this.completed = data.completed || false;
        this.skipped = data.skipped || false;
      }
    } catch {
      // Ignorar errores de localStorage
    }
  }

  /**
   * Guardar estado del onboarding
   */
  save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify({
        completed: this.completed,
        skipped: this.skipped,
        completedAt: this.completed ? new Date().toISOString() : null
      }));
    } catch {
      // Ignorar errores de localStorage
    }
  }

  /**
   * Verificar si debe mostrar el onboarding
   */
  shouldShow() {
    return !this.completed && !this.skipped;
  }

  /**
   * Iniciar el onboarding
   */
  start() {
    if (!this.shouldShow()) {
      return false;
    }

    this.isActive = true;
    this.currentStep = 0;
    this.createOverlay();
    this.showStep(0);
    return true;
  }

  /**
   * Crear overlay del tutorial
   */
  createOverlay() {
    // Eliminar overlay existente
    const existing = document.getElementById('fr-onboarding-overlay');
    if (existing) existing.remove();

    this.overlay = document.createElement('div');
    this.overlay.id = 'fr-onboarding-overlay';
    this.overlay.innerHTML = `
      <div class="fr-onboarding-spotlight" id="fr-spotlight"></div>
      <div class="fr-onboarding-tooltip" id="fr-tooltip">
        <div class="fr-tooltip-header">
          <span class="fr-tooltip-icon" id="fr-tooltip-icon"></span>
          <span class="fr-tooltip-step" id="fr-tooltip-step"></span>
        </div>
        <h3 class="fr-tooltip-title" id="fr-tooltip-title"></h3>
        <p class="fr-tooltip-desc" id="fr-tooltip-desc"></p>
        <div class="fr-tooltip-actions">
          <button class="fr-tooltip-btn fr-skip" id="fr-btn-skip">Omitir</button>
          <button class="fr-tooltip-btn fr-next" id="fr-btn-next">Siguiente</button>
        </div>
        <div class="fr-tooltip-progress">
          <div class="fr-progress-dots" id="fr-progress-dots"></div>
        </div>
      </div>
    `;

    this.applyOverlayStyles();
    document.body.appendChild(this.overlay);

    // Event listeners
    document.getElementById('fr-btn-skip').onclick = () => this.skip();
    document.getElementById('fr-btn-next').onclick = () => this.next();

    // Cerrar con ESC
    this.escHandler = (e) => {
      if (e.key === 'Escape') this.skip();
    };
    document.addEventListener('keydown', this.escHandler);
  }

  /**
   * Aplicar estilos al overlay
   */
  applyOverlayStyles() {
    const style = document.createElement('style');
    style.id = 'fr-onboarding-styles';
    style.textContent = `
      #fr-onboarding-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.85);
        z-index: 20000;
        animation: frFadeIn 0.3s ease-out;
      }

      .fr-onboarding-spotlight {
        position: absolute;
        border-radius: 8px;
        box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.85);
        transition: all 0.4s ease-out;
        pointer-events: none;
      }

      .fr-onboarding-tooltip {
        position: absolute;
        background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
        border: 2px solid #3b82f6;
        border-radius: 16px;
        padding: 24px;
        max-width: 360px;
        color: white;
        z-index: 20001;
        animation: frScaleIn 0.3s ease-out;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
      }

      .fr-tooltip-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;
      }

      .fr-tooltip-icon {
        font-size: 32px;
      }

      .fr-tooltip-step {
        background: rgba(59, 130, 246, 0.2);
        color: #60a5fa;
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
      }

      .fr-tooltip-title {
        margin: 0 0 8px;
        font-size: 20px;
        font-weight: bold;
      }

      .fr-tooltip-desc {
        margin: 0 0 20px;
        color: #94a3b8;
        font-size: 14px;
        line-height: 1.5;
      }

      .fr-tooltip-actions {
        display: flex;
        gap: 12px;
        justify-content: flex-end;
      }

      .fr-tooltip-btn {
        padding: 10px 20px;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        border: none;
        font-size: 14px;
      }

      .fr-tooltip-btn.fr-skip {
        background: transparent;
        color: #64748b;
      }

      .fr-tooltip-btn.fr-skip:hover {
        color: #94a3b8;
      }

      .fr-tooltip-btn.fr-next {
        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        color: white;
      }

      .fr-tooltip-btn.fr-next:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
      }

      .fr-tooltip-progress {
        margin-top: 16px;
        padding-top: 16px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
      }

      .fr-progress-dots {
        display: flex;
        gap: 8px;
        justify-content: center;
      }

      .fr-progress-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.2);
        transition: all 0.3s;
      }

      .fr-progress-dot.active {
        background: #3b82f6;
        transform: scale(1.2);
      }

      .fr-progress-dot.completed {
        background: #22c55e;
      }

      @keyframes frFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      @keyframes frScaleIn {
        from { opacity: 0; transform: scale(0.9); }
        to { opacity: 1; transform: scale(1); }
      }

      .fr-highlight-element {
        position: relative;
        z-index: 20002 !important;
        animation: frPulseHighlight 1.5s ease-in-out infinite;
      }

      @keyframes frPulseHighlight {
        0%, 100% { box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5); }
        50% { box-shadow: 0 0 0 8px rgba(59, 130, 246, 0.3); }
      }
    `;

    // Remover estilos anteriores si existen
    const existingStyle = document.getElementById('fr-onboarding-styles');
    if (existingStyle) existingStyle.remove();

    document.head.appendChild(style);
  }

  /**
   * Mostrar un paso específico
   */
  showStep(stepIndex) {
    const step = this.steps[stepIndex];
    if (!step) return;

    const tooltip = document.getElementById('fr-tooltip');
    const spotlight = document.getElementById('fr-spotlight');

    // Actualizar contenido
    document.getElementById('fr-tooltip-icon').textContent = step.icon;
    document.getElementById('fr-tooltip-step').textContent = `Paso ${stepIndex + 1} de ${this.steps.length}`;
    document.getElementById('fr-tooltip-title').textContent = step.title;
    document.getElementById('fr-tooltip-desc').textContent = step.description;

    // Actualizar botón
    const nextBtn = document.getElementById('fr-btn-next');
    nextBtn.textContent = stepIndex === this.steps.length - 1 ? '¡Comenzar!' : 'Siguiente';

    // Actualizar dots de progreso
    const dotsContainer = document.getElementById('fr-progress-dots');
    dotsContainer.innerHTML = this.steps.map((_, i) => `
      <div class="fr-progress-dot ${i < stepIndex ? 'completed' : ''} ${i === stepIndex ? 'active' : ''}"></div>
    `).join('');

    // Limpiar highlight anterior
    document.querySelectorAll('.fr-highlight-element').forEach(el => {
      el.classList.remove('fr-highlight-element');
    });

    // Posicionar spotlight y tooltip
    if (step.target) {
      const targetEl = document.querySelector(step.target);
      if (targetEl) {
        // Highlight del elemento
        targetEl.classList.add('fr-highlight-element');

        const rect = targetEl.getBoundingClientRect();
        const padding = 8;

        // Posicionar spotlight
        spotlight.style.display = 'block';
        spotlight.style.top = `${rect.top - padding}px`;
        spotlight.style.left = `${rect.left - padding}px`;
        spotlight.style.width = `${rect.width + padding * 2}px`;
        spotlight.style.height = `${rect.height + padding * 2}px`;

        // Posicionar tooltip según la posición especificada
        this.positionTooltip(tooltip, rect, step.position);
      } else {
        // Elemento no encontrado, centrar
        this.centerTooltip(tooltip);
        spotlight.style.display = 'none';
      }
    } else {
      // Sin target, centrar
      this.centerTooltip(tooltip);
      spotlight.style.display = 'none';
    }
  }

  /**
   * Posicionar tooltip relativo al elemento objetivo
   */
  positionTooltip(tooltip, targetRect, position) {
    const tooltipRect = tooltip.getBoundingClientRect();
    const margin = 16;

    let top, left;

    switch (position) {
      case 'top':
        top = targetRect.top - tooltipRect.height - margin;
        left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
        break;
      case 'bottom':
        top = targetRect.bottom + margin;
        left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
        break;
      case 'left':
        top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
        left = targetRect.left - tooltipRect.width - margin;
        break;
      case 'right':
        top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
        left = targetRect.right + margin;
        break;
      default:
        this.centerTooltip(tooltip);
        return;
    }

    // Mantener dentro de la pantalla
    top = Math.max(margin, Math.min(top, window.innerHeight - tooltipRect.height - margin));
    left = Math.max(margin, Math.min(left, window.innerWidth - tooltipRect.width - margin));

    tooltip.style.top = `${top}px`;
    tooltip.style.left = `${left}px`;
    tooltip.style.transform = 'none';
  }

  /**
   * Centrar tooltip en la pantalla
   */
  centerTooltip(tooltip) {
    tooltip.style.top = '50%';
    tooltip.style.left = '50%';
    tooltip.style.transform = 'translate(-50%, -50%)';
  }

  /**
   * Ir al siguiente paso
   */
  next() {
    if (this.currentStep < this.steps.length - 1) {
      this.currentStep++;
      this.showStep(this.currentStep);
    } else {
      this.complete();
    }
  }

  /**
   * Ir al paso anterior
   */
  prev() {
    if (this.currentStep > 0) {
      this.currentStep--;
      this.showStep(this.currentStep);
    }
  }

  /**
   * Omitir el tutorial
   */
  skip() {
    this.skipped = true;
    this.save();
    this.cleanup();
  }

  /**
   * Completar el tutorial
   */
  complete() {
    this.completed = true;
    this.save();
    this.cleanup();

    // Dar recompensa por completar tutorial
    if (window.frankensteinRewards) {
      window.frankensteinRewards.addXP(100, 'tutorial');
      window.frankensteinRewards.addCoins(50, 'tutorial');

      // Mostrar notificación
      setTimeout(() => {
        if (window.frankensteinLabUI) {
          window.frankensteinLabUI.showNotification('🎓 +100 XP +50 🪙 por completar el tutorial', 'success', 4000);
        }
      }, 500);
    }
  }

  /**
   * Limpiar overlay y listeners
   */
  cleanup() {
    this.isActive = false;

    // Remover highlight de elementos
    document.querySelectorAll('.fr-highlight-element').forEach(el => {
      el.classList.remove('fr-highlight-element');
    });

    // Remover overlay
    if (this.overlay) {
      this.overlay.style.animation = 'frFadeIn 0.3s ease-out reverse';
      setTimeout(() => {
        this.overlay.remove();
        this.overlay = null;
      }, 300);
    }

    // Remover listener de ESC
    if (this.escHandler) {
      document.removeEventListener('keydown', this.escHandler);
    }
  }

  /**
   * Resetear el onboarding (para testing)
   */
  reset() {
    this.completed = false;
    this.skipped = false;
    this.save();
    console.log('[Onboarding] Reset completado');
  }
}

// Crear instancia global
window.frankensteinOnboarding = new FrankensteinOnboarding();

// Exportar para módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FrankensteinOnboarding;
}
