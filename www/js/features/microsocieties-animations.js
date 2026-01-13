/**
// 🔧 FIX v2.9.198: Migrated console.log to logger
 * SISTEMA DE ANIMACIONES Y EFECTOS VISUALES
 * Añade "juice" al juego para mejorar feedback visual
 */

class AnimationSystem {
  constructor() {
    this.particles = [];
    this.floatingTexts = [];
    this.canvas = null;
    this.ctx = null;
    this.animationFrame = null;
    this.initialized = false;
    this._resizeHandler = null; // Para cleanup
  }

  /**
   * Inicializar sistema de animaciones
   */
  init(containerId = 'microsocieties-modal') {
    const container = document.getElementById(containerId);
    if (!container) {
      logger.error('❌ Container no encontrado para AnimationSystem');
      return false;
    }

    // Crear canvas para partículas
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'animation-canvas';
    this.canvas.style.cssText = `
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 10000;
    `;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;

    document.body.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');

    // Resize handler (guardamos referencia para cleanup)
    this._resizeHandler = () => {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', this._resizeHandler);

    // Iniciar loop de animación
    this.startAnimationLoop();
    this.initialized = true;

    // logger.debug('✨ Animation System inicializado');
    return true;
  }

  /**
   * Loop de animación principal
   */
  startAnimationLoop() {
    const animate = () => {
      if (!this.ctx) return;

      // Limpiar canvas
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      // Actualizar y renderizar partículas
      this.updateParticles();
      this.renderParticles();

      // Actualizar y renderizar textos flotantes
      this.updateFloatingTexts();
      this.renderFloatingTexts();

      this.animationFrame = requestAnimationFrame(animate);
    };

    animate();
  }

  /**
   * Detener sistema
   */
  stop() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    // Remover resize listener (prevenir memory leak)
    if (this._resizeHandler) {
      window.removeEventListener('resize', this._resizeHandler);
      this._resizeHandler = null;
    }

    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }

    this.initialized = false;
    // logger.debug('✨ Animation System detenido');
  }

  /**
   * PARTÍCULAS: Efecto de level-up
   */
  spawnLevelUpParticles(x, y) {
    const colors = ['#d4af37', '#b87333', '#f4e9d8', '#ffd700'];
    const count = 30;

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = 2 + Math.random() * 3;

      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2, // Bias hacia arriba
        radius: 3 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        decay: 0.02,
        life: 1
      });
    }
  }

  /**
   * PARTÍCULAS: Efecto de misión completada
   */
  spawnMissionCompleteParticles(x, y) {
    const colors = ['#2d5016', '#4a7c2e', '#85c54e', '#9acd32'];
    const count = 20;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 2;

      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        radius: 2 + Math.random() * 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        decay: 0.015,
        life: 1,
        shape: 'star' // Estrella pequeña
      });
    }
  }

  /**
   * PARTÍCULAS: Efecto de hibridación
   */
  spawnHybridizationParticles(x, y) {
    const colors = ['#4a235a', '#6a3579', '#8b4789', '#c77dff'];
    const count = 25;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.5 + Math.random() * 2;

      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 2 + Math.random() * 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        decay: 0.01,
        life: 1,
        shape: 'heart'
      });
    }
  }

  /**
   * PARTÍCULAS: Efecto de evento crítico
   */
  spawnCriticalEventParticles(x, y) {
    const colors = ['#8b0000', '#b22222', '#ff6b35', '#ff4500'];
    const count = 40;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 5;

      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 4 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        decay: 0.025,
        life: 1,
        shape: 'circle'
      });
    }
  }

  /**
   * Actualizar partículas
   */
  updateParticles() {
    this.particles = this.particles.filter(p => {
      // Aplicar física
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.1; // Gravedad
      p.vx *= 0.99; // Fricción

      // Decaer alpha
      p.alpha -= p.decay;
      p.life -= p.decay;

      return p.life > 0;
    });
  }

  /**
   * Renderizar partículas
   */
  renderParticles() {
    this.particles.forEach(p => {
      this.ctx.save();
      this.ctx.globalAlpha = p.alpha;

      if (p.shape === 'star') {
        this.drawStar(p.x, p.y, p.radius, p.color);
      } else if (p.shape === 'heart') {
        this.drawHeart(p.x, p.y, p.radius, p.color);
      } else {
        // Círculo por defecto
        this.ctx.fillStyle = p.color;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        this.ctx.fill();
      }

      this.ctx.restore();
    });
  }

  /**
   * Dibujar estrella
   */
  drawStar(x, y, radius, color) {
    this.ctx.fillStyle = color;
    this.ctx.beginPath();

    for (let i = 0; i < 5; i++) {
      const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
      const outerRadius = radius;
      const innerRadius = radius * 0.5;

      const ox = x + Math.cos(angle) * outerRadius;
      const oy = y + Math.sin(angle) * outerRadius;

      if (i === 0) {
        this.ctx.moveTo(ox, oy);
      } else {
        this.ctx.lineTo(ox, oy);
      }

      const innerAngle = angle + Math.PI / 5;
      const ix = x + Math.cos(innerAngle) * innerRadius;
      const iy = y + Math.sin(innerAngle) * innerRadius;
      this.ctx.lineTo(ix, iy);
    }

    this.ctx.closePath();
    this.ctx.fill();
  }

  /**
   * Dibujar corazón
   */
  drawHeart(x, y, radius, color) {
    this.ctx.fillStyle = color;
    this.ctx.beginPath();

    const topCurveHeight = radius * 0.3;
    this.ctx.moveTo(x, y + topCurveHeight);

    // Lado izquierdo
    this.ctx.bezierCurveTo(
      x, y,
      x - radius / 2, y - radius / 2,
      x, y - radius
    );

    // Lado derecho
    this.ctx.bezierCurveTo(
      x + radius / 2, y - radius / 2,
      x, y,
      x, y + topCurveHeight
    );

    this.ctx.closePath();
    this.ctx.fill();
  }

  /**
   * TEXTO FLOTANTE: Mostrar +XP
   */
  showFloatingText(text, x, y, color = '#d4af37', size = 24) {
    this.floatingTexts.push({
      text,
      x,
      y,
      vy: -2, // Velocidad hacia arriba
      color,
      size,
      alpha: 1,
      life: 1,
      decay: 0.02
    });
  }

  /**
   * Actualizar textos flotantes
   */
  updateFloatingTexts() {
    this.floatingTexts = this.floatingTexts.filter(t => {
      t.y += t.vy;
      t.alpha -= t.decay;
      t.life -= t.decay;

      return t.life > 0;
    });
  }

  /**
   * Renderizar textos flotantes
   */
  renderFloatingTexts() {
    this.floatingTexts.forEach(t => {
      this.ctx.save();
      this.ctx.globalAlpha = t.alpha;
      this.ctx.font = `bold ${t.size}px sans-serif`;
      this.ctx.fillStyle = t.color;
      this.ctx.strokeStyle = '#000';
      this.ctx.lineWidth = 3;
      this.ctx.textAlign = 'center';

      this.ctx.strokeText(t.text, t.x, t.y);
      this.ctx.fillText(t.text, t.x, t.y);

      this.ctx.restore();
    });
  }

  /**
   * SCREEN SHAKE: Sacudir pantalla
   */
  screenShake(duration = 500, intensity = 10) {
    const container = document.querySelector('.microsocieties-container');
    if (!container) return;

    const startTime = Date.now();

    const shake = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed > duration) {
        container.style.transform = '';
        return;
      }

      const progress = elapsed / duration;
      const currentIntensity = intensity * (1 - progress);

      const x = (Math.random() - 0.5) * currentIntensity;
      const y = (Math.random() - 0.5) * currentIntensity;

      container.style.transform = `translate(${x}px, ${y}px)`;

      requestAnimationFrame(shake);
    };

    shake();
  }

  /**
   * PULSO: Animar elemento con pulso
   */
  pulse(element, scale = 1.1, duration = 300) {
    if (!element) return;

    element.style.transition = `transform ${duration}ms ease-out`;
    element.style.transform = `scale(${scale})`;

    setTimeout(() => {
      element.style.transform = 'scale(1)';
    }, duration);
  }

  /**
   * GLOW: Añadir resplandor temporal
   */
  glow(element, color = '#d4af37', duration = 1000) {
    if (!element) return;

    const originalBoxShadow = element.style.boxShadow;
    element.style.transition = `box-shadow ${duration}ms ease-out`;
    element.style.boxShadow = `0 0 20px ${color}, 0 0 40px ${color}`;

    setTimeout(() => {
      element.style.boxShadow = originalBoxShadow;
    }, duration);
  }

  /**
   * FADE IN: Entrada con fade
   */
  fadeIn(element, duration = 300) {
    if (!element) return;

    element.style.opacity = '0';
    element.style.transition = `opacity ${duration}ms ease-in`;

    requestAnimationFrame(() => {
      element.style.opacity = '1';
    });
  }

  /**
   * SLIDE IN: Entrada deslizante
   */
  slideIn(element, direction = 'up', duration = 400) {
    if (!element) return;

    const translations = {
      up: 'translateY(20px)',
      down: 'translateY(-20px)',
      left: 'translateX(20px)',
      right: 'translateX(-20px)'
    };

    element.style.opacity = '0';
    element.style.transform = translations[direction] || translations.up;
    element.style.transition = `opacity ${duration}ms ease-out, transform ${duration}ms ease-out`;

    requestAnimationFrame(() => {
      element.style.opacity = '1';
      element.style.transform = 'translate(0, 0)';
    });
  }

  /**
   * BOUNCE: Rebote en elemento
   */
  bounce(element, height = 10, duration = 600) {
    if (!element) return;

    const keyframes = [
      { transform: 'translateY(0)' },
      { transform: `translateY(-${height}px)` },
      { transform: 'translateY(0)' },
      { transform: `translateY(-${height / 2}px)` },
      { transform: 'translateY(0)' }
    ];

    element.animate(keyframes, {
      duration,
      easing: 'ease-out'
    });
  }

  /**
   * ROTATE: Rotación suave
   */
  rotate(element, degrees = 360, duration = 500) {
    if (!element) return;

    element.style.transition = `transform ${duration}ms ease-in-out`;
    element.style.transform = `rotate(${degrees}deg)`;

    setTimeout(() => {
      element.style.transform = 'rotate(0deg)';
    }, duration);
  }

  /**
   * CONFETTI: Explosión de confetti (similar a level-up pero más colorido)
   */
  confetti(x, y) {
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7', '#fd79a8'];
    const count = 50;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 4;

      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3,
        radius: 3 + Math.random() * 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        decay: 0.015,
        life: 1,
        shape: Math.random() > 0.5 ? 'circle' : 'star'
      });
    }
  }

  /**
   * Limpiar todas las animaciones
   */
  clear() {
    this.particles = [];
    this.floatingTexts = [];
    if (this.ctx) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  /**
   * Obtener estadísticas
   */
  getStats() {
    return {
      particles: this.particles.length,
      floatingTexts: this.floatingTexts.length,
      initialized: this.initialized
    };
  }
}

// Exportar
window.AnimationSystem = AnimationSystem;
// logger.debug('✨ Sistema de Animaciones cargado');
