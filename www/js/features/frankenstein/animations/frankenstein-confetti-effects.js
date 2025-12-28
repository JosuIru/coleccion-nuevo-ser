/**
 * FRANKENSTEIN LAB - CONFETTI EFFECTS
 * Extracted from frankenstein-ui.js (Refactoring v2.9.200 Phase 1)
 *
 * Handles: Confetti animations, particle effects, celebration visuals, lightning effects
 * Lines extracted: 3994-3998, 4037-4045, 5635-5646, 6430-6482, 6546-6630
 *
 * Este módulo es completamente independiente y reutilizable.
 * Gestiona todas las animaciones visuales de celebración sin depender del estado de FrankensteinUI.
 */

export class ConfettiEffects {
  constructor() {
    this.activeAnimations = [];
    this.activeTimeouts = [];
    this.hasInjectedStyles = false;

    // Inyectar estilos de animación al inicializar
    this.injectAnimationStyles();
  }

  /**
   * Inyectar estilos CSS necesarios para las animaciones
   */
  injectAnimationStyles() {
    if (this.hasInjectedStyles || document.getElementById('confetti-animation-style')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'confetti-animation-style';
    style.textContent = `
      @keyframes confetti-fall {
        to {
          top: 100%;
          opacity: 0;
          transform: translateY(100vh) rotate(720deg);
        }
      }

      @keyframes particle-burst {
        0% {
          transform: translate(0, 0) scale(1);
          opacity: 1;
        }
        100% {
          transform: translate(var(--tx), var(--ty)) scale(0);
          opacity: 0;
        }
      }

      @keyframes particle-star-burst {
        0% {
          transform: translate(0, 0) scale(1) rotate(0deg);
          opacity: 1;
        }
        100% {
          transform: translate(var(--tx), var(--ty)) scale(0) rotate(720deg);
          opacity: 0;
        }
      }

      @keyframes particle-energy-burst {
        0% {
          transform: translate(0, 0) scale(1);
          opacity: 1;
          filter: blur(0px);
        }
        50% {
          filter: blur(2px);
        }
        100% {
          transform: translate(var(--tx), var(--ty)) scale(0.3);
          opacity: 0;
          filter: blur(4px);
        }
      }

      .particle {
        position: fixed;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        pointer-events: none;
        z-index: 10000;
      }

      .particle-star {
        width: 12px;
        height: 12px;
        background: linear-gradient(45deg, #ffd700, #ffed4e);
        clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
      }

      .particle-energy {
        width: 10px;
        height: 10px;
        background: radial-gradient(circle, #00ffff, #0088ff);
        box-shadow: 0 0 10px #00ffff;
      }

      .flight-trail {
        position: fixed;
        width: 6px;
        height: 6px;
        border-radius: 50%;
        pointer-events: none;
        z-index: 9998;
        opacity: 0.8;
      }

      .progress-celebration {
        position: absolute;
        font-size: 14px;
        font-weight: bold;
        color: #d4af37;
        text-shadow: 0 0 10px rgba(212, 175, 55, 0.8);
        animation: celebration-float 1.2s ease-out forwards;
        pointer-events: none;
        z-index: 100;
      }

      @keyframes celebration-float {
        0% {
          transform: translateY(0) scale(0.5);
          opacity: 0;
        }
        20% {
          opacity: 1;
        }
        100% {
          transform: translateY(-40px) scale(1);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
    this.hasInjectedStyles = true;
  }

  /**
   * Registrar timeout para cleanup
   */
  _setTimeout(callback, delay) {
    const timeoutId = setTimeout(() => {
      callback();
      const index = this.activeTimeouts.indexOf(timeoutId);
      if (index > -1) {
        this.activeTimeouts.splice(index, 1);
      }
    }, delay);
    this.activeTimeouts.push(timeoutId);
    return timeoutId;
  }

  /**
   * Mostrar efecto de confetti
   * @param {Object} options - Opciones de configuración
   * @param {number} options.count - Cantidad de piezas de confetti (default: 50)
   * @param {string[]} options.colors - Array de colores en formato hex (default: dorados)
   * @param {number} options.duration - Duración del efecto en ms (default: 4000)
   */
  playConfetti(options = {}) {
    const {
      count = 50,
      colors = ['#d4af37', '#b87333', '#8b7355', '#ffd700'],
      duration = 4000
    } = options;

    const confettiContainer = document.createElement('div');
    confettiContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 9999;
    `;

    for (let i = 0; i < count; i++) {
      const confetti = document.createElement('div');
      confetti.style.cssText = `
        position: absolute;
        width: 10px;
        height: 10px;
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        left: ${Math.random() * 100}%;
        top: -10px;
        opacity: 1;
        transform: rotate(${Math.random() * 360}deg);
        animation: confetti-fall ${2 + Math.random() * 2}s linear forwards;
      `;
      confettiContainer.appendChild(confetti);
    }

    document.body.appendChild(confettiContainer);
    this.activeAnimations.push(confettiContainer);

    this._setTimeout(() => {
      confettiContainer.remove();
      const index = this.activeAnimations.indexOf(confettiContainer);
      if (index > -1) {
        this.activeAnimations.splice(index, 1);
      }
    }, duration);
  }

  /**
   * Efecto de relámpago (lightning effect)
   * @param {HTMLElement} container - Contenedor donde aparecer el lightning (default: .frankenstein-laboratory)
   */
  playLightning(container = null) {
    const targetContainer = container || document.querySelector('.frankenstein-laboratory');
    if (!targetContainer) {
      console.warn('ConfettiEffects: No container found for lightning effect');
      return;
    }

    const lightning = document.createElement('div');
    lightning.className = 'fusion-lightning';
    targetContainer.appendChild(lightning);

    this.activeAnimations.push(lightning);

    this._setTimeout(() => {
      lightning.remove();
      const index = this.activeAnimations.indexOf(lightning);
      if (index > -1) {
        this.activeAnimations.splice(index, 1);
      }
    }, 1000);
  }

  /**
   * Generar partículas flotantes decorativas
   * @param {number} count - Cantidad de partículas (default: 20)
   * @returns {string} HTML string de las partículas
   */
  generateFloatingParticles(count = 20) {
    let html = '';
    for (let i = 0; i < count; i++) {
      const x = Math.random() * 100;
      const y = Math.random() * 100;
      const delay = Math.random() * 6;
      html += `<div class="floating-particle" style="left: ${x}%; top: ${y}%; animation-delay: ${delay}s;"></div>`;
    }
    return html;
  }

  /**
   * Crear efecto de partículas que explotan desde un elemento
   * @param {HTMLElement} element - Elemento origen de las partículas
   * @param {Object} options - Opciones de configuración
   */
  createParticleBurst(element, options = {}) {
    const {
      particleCount = 20,
      colors = ['#d4af37', '#b87333', '#ffd700', '#e0f7ff'],
      types = ['circle', 'star', 'energy'],
      duration = 1000
    } = options;

    if (!element) {
      console.warn('ConfettiEffects: No element provided for particle burst');
      return;
    }

    const rect = element.getBoundingClientRect();
    const centerX = rect.left + (rect.width / 2);
    const centerY = rect.top + (rect.height / 2);

    const particles = [];

    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');

      // Tipo aleatorio
      const type = types[Math.floor(Math.random() * types.length)];
      particle.classList.add('particle');

      if (type === 'star') {
        particle.classList.add('particle-star');
      } else if (type === 'energy') {
        particle.classList.add('particle-energy');
      } else {
        particle.style.background = colors[Math.floor(Math.random() * colors.length)];
      }

      // Trayectoria aleatoria
      const angle = (Math.PI * 2 * i) / particleCount;
      const velocity = 50 + Math.random() * 100;
      const tx = Math.cos(angle) * velocity;
      const ty = Math.sin(angle) * velocity;

      particle.style.left = `${centerX}px`;
      particle.style.top = `${centerY}px`;
      particle.style.setProperty('--tx', `${tx}px`);
      particle.style.setProperty('--ty', `${ty}px`);

      // Duración aleatoria de la animación
      const animDuration = duration + (Math.random() * 500 - 250);
      particle.style.animation = type === 'star'
        ? `particle-star-burst ${animDuration}ms ease-out forwards`
        : type === 'energy'
        ? `particle-energy-burst ${animDuration}ms ease-out forwards`
        : `particle-burst ${animDuration}ms ease-out forwards`;

      document.body.appendChild(particle);
      particles.push(particle);

      this._setTimeout(() => {
        particle.remove();
        const index = particles.indexOf(particle);
        if (index > -1) {
          particles.splice(index, 1);
        }
      }, animDuration);
    }

    this.activeAnimations.push(...particles);
  }

  /**
   * Crear trail de partículas entre dos puntos
   * @param {DOMRect} startRect - Rectángulo de inicio
   * @param {DOMRect} endRect - Rectángulo de destino
   * @param {Object} options - Opciones de configuración
   */
  createFlightTrail(startRect, endRect, options = {}) {
    const {
      trailCount = 15,
      duration = 600,
      color = 'rgba(212, 175, 55, 1)'
    } = options;

    const trails = [];

    for (let i = 0; i < trailCount; i++) {
      this._setTimeout(() => {
        const trail = document.createElement('div');
        trail.classList.add('flight-trail');

        // Interpolar posición
        const progress = i / trailCount;
        const x = startRect.left + (endRect.left - startRect.left) * progress;
        const y = startRect.top + (endRect.top - startRect.top) * progress;

        trail.style.left = `${x}px`;
        trail.style.top = `${y}px`;
        trail.style.background = color.replace('1)', `${1 - progress})`);

        document.body.appendChild(trail);
        trails.push(trail);

        this._setTimeout(() => {
          trail.remove();
          const index = trails.indexOf(trail);
          if (index > -1) {
            trails.splice(index, 1);
          }
        }, 800);
      }, (duration / trailCount) * i);
    }

    this.activeAnimations.push(...trails);
  }

  /**
   * Crear celebración de progreso flotante
   * @param {HTMLElement} container - Contenedor donde mostrar la celebración
   * @param {number} percent - Porcentaje para posicionar (0-100)
   * @param {string} label - Texto a mostrar
   */
  spawnProgressReward(container, percent, label) {
    if (!container) {
      console.warn('ConfettiEffects: No container provided for progress reward');
      return;
    }

    const celebration = document.createElement('div');
    celebration.className = 'progress-celebration';
    celebration.textContent = `+ ${label}`;
    const clampedPercent = Math.max(10, Math.min(90, percent || 0));
    celebration.style.left = `${clampedPercent}%`;
    celebration.style.top = '10px';
    container.appendChild(celebration);

    this.activeAnimations.push(celebration);

    this._setTimeout(() => {
      celebration.remove();
      const index = this.activeAnimations.indexOf(celebration);
      if (index > -1) {
        this.activeAnimations.splice(index, 1);
      }
    }, 1200);
  }

  /**
   * Detener todas las animaciones activas
   */
  stopAll() {
    // Limpiar todos los timeouts activos
    this.activeTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
    this.activeTimeouts = [];

    // Remover todos los elementos de animación activos
    this.activeAnimations.forEach(element => {
      if (element && element.parentNode) {
        element.remove();
      }
    });
    this.activeAnimations = [];
  }

  /**
   * Destruir la instancia y limpiar recursos
   */
  destroy() {
    this.stopAll();

    // Opcionalmente remover estilos inyectados
    // (comentado por defecto para no afectar otras instancias)
    // const style = document.getElementById('confetti-animation-style');
    // if (style) {
    //   style.remove();
    //   this.hasInjectedStyles = false;
    // }
  }
}

/**
 * Función standalone para mostrar confetti rápidamente
 * @param {Object} options - Ver ConfettiEffects.playConfetti para opciones
 */
export function playConfettiEffect(options = {}) {
  const confetti = new ConfettiEffects();
  confetti.playConfetti(options);
  // Nota: Esta instancia no se trackea, se auto-limpia después del efecto
}

/**
 * Función standalone para efecto de lightning
 * @param {HTMLElement} container - Contenedor opcional
 */
export function playLightningEffect(container = null) {
  const effects = new ConfettiEffects();
  effects.playLightning(container);
}

/**
 * Función standalone para burst de partículas
 * @param {HTMLElement} element - Elemento origen
 * @param {Object} options - Ver ConfettiEffects.createParticleBurst para opciones
 */
export function createParticleBurstEffect(element, options = {}) {
  const effects = new ConfettiEffects();
  effects.createParticleBurst(element, options);
}

export default ConfettiEffects;
