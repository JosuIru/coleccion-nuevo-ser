/**
 * SISTEMA DE TUTORIAL INTERACTIVO
 * Guía paso a paso para nuevos jugadores
 */

class TutorialSystem {
  constructor() {
    this.steps = this.createTutorialSteps();
    this.currentStep = 0;
    this.completed = this.loadCompletionStatus();
    this.active = false;
    this.overlay = null;
    this.tooltip = null;
  }

  /**
   * Crear pasos del tutorial
   */
  createTutorialSteps() {
    return [
      {
        id: 'welcome',
        title: '¡Bienvenido a Microsociedades!',
        message: 'Estás a punto de crear y guiar sociedades evolutivas de seres híbridos de conocimiento. Esta aventura combina filosofía, genética y estrategia.',
        target: null,
        position: 'center',
        actions: [
          { label: 'Comenzar Tutorial', action: 'next' },
          { label: 'Saltar Tutorial', action: 'skip' }
        ],
        highlight: false
      },
      {
        id: 'metrics-intro',
        title: 'Métricas de la Sociedad',
        message: 'Estas 4 métricas determinan la salud de tu sociedad:<br><br>🌱 <b>Salud</b>: Vitalidad y recursos<br>💡 <b>Conocimiento</b>: Sabiduría colectiva<br>⚡ <b>Acción</b>: Capacidad de movilización<br>🤝 <b>Cohesión</b>: Unidad interna',
        target: '.metrics-grid',
        position: 'right',
        actions: [
          { label: 'Entendido', action: 'next' }
        ],
        highlight: true
      },
      {
        id: 'beings-intro',
        title: 'Tus Seres',
        message: 'Cada ser es único, creado desde piezas de conocimiento real (libros, capítulos, ejercicios). Tienen atributos como Sabiduría, Empatía, Coraje, etc.',
        target: '.beings-list-panel',
        position: 'left',
        actions: [
          { label: 'Siguiente', action: 'next' }
        ],
        highlight: true
      },
      {
        id: 'play-button',
        title: 'Controles de Simulación',
        message: 'Dale click a ▶️ <b>Iniciar</b> para comenzar la evolución. La sociedad procesará eventos automáticamente cada 2 segundos.',
        target: '#btn-play-pause',
        position: 'bottom',
        actions: [
          { label: 'Iniciar Ahora', action: 'trigger-play' },
          { label: 'Esperar', action: 'next' }
        ],
        highlight: true
      },
      {
        id: 'events-intro',
        title: 'Eventos',
        message: 'Tu sociedad enfrentará crisis, oportunidades y dilemas. Los seres responderán según sus atributos. Observa el log de eventos aquí.',
        target: '.events-log-panel',
        position: 'left',
        actions: [
          { label: 'Continuar', action: 'next' }
        ],
        highlight: true
      },
      {
        id: 'evolution-intro',
        title: 'Evolución Genética',
        message: 'Cada 10 turnos, los 2 mejores seres <b>hibridan</b> automáticamente. El hijo hereda atributos mezclados de ambos padres con mutaciones aleatorias (±5%).',
        target: '.beings-list',
        position: 'left',
        actions: [
          { label: 'Interesante', action: 'next' }
        ],
        highlight: true
      },
      {
        id: 'speed-controls',
        title: 'Control de Velocidad',
        message: 'Acelera o desacelera el tiempo:<br>• 1x = Normal (2 seg/turno)<br>• 2x = Rápido (1 seg/turno)<br>• 5x = Muy rápido<br>• 10x = Ultra rápido',
        target: '.speed-selector',
        position: 'bottom',
        actions: [
          { label: 'Perfecto', action: 'next' }
        ],
        highlight: true
      },
      {
        id: 'graph-intro',
        title: 'Gráfico de Evolución',
        message: 'Este gráfico muestra la evolución de tus métricas en los últimos 30 turnos. Te ayuda a identificar tendencias.',
        target: '.evolution-graph',
        position: 'top',
        actions: [
          { label: 'Siguiente', action: 'next' }
        ],
        highlight: true
      },
      {
        id: 'missions-intro',
        title: 'Sistema de Misiones',
        message: '¡Tienes misiones que completar! Gana XP, sube de nivel y desbloquea contenido nuevo. Completa "Primeros Pasos" creando esta sociedad.',
        target: null,
        position: 'center',
        actions: [
          { label: '¡Vamos!', action: 'next' }
        ],
        highlight: false
      },
      {
        id: 'save-reminder',
        title: 'Guardado Automático',
        message: 'Tu progreso se guarda automáticamente cada 30 segundos. También puedes guardar manualmente en cualquier momento.',
        target: null,
        position: 'center',
        actions: [
          { label: 'Entendido', action: 'next' }
        ],
        highlight: false
      },
      {
        id: 'completion',
        title: '¡Tutorial Completado!',
        message: 'Ya conoces lo básico. Ahora experimenta y descubre:<br><br>• Eventos con opciones múltiples<br>• Intervenciones divinas<br>• Modo historia<br>• ¡Y mucho más!<br><br>¡Buena suerte, Creador!',
        target: null,
        position: 'center',
        actions: [
          { label: '¡Comenzar!', action: 'complete' }
        ],
        highlight: false
      }
    ];
  }

  /**
   * Iniciar tutorial
   */
  start() {
    if (this.completed) {
      const restart = confirm('¿Quieres reiniciar el tutorial?');
      if (!restart) return;
    }

    this.active = true;
    this.currentStep = 0;
    this.createOverlay();
    this.showStep(this.steps[0]);

    // console.log('📚 Tutorial iniciado');
  }

  /**
   * Crear overlay
   */
  createOverlay() {
    // IMPORTANTE: Buscar el contenedor del modal de microsociedades
    const modalContainer = document.querySelector('.microsocieties-modal.active');

    if (!modalContainer) {
      // console.warn('⚠️ Modal de microsociedades no está abierto. Tutorial no se puede iniciar.');
      return;
    }

    // Crear overlay oscuro DENTRO del modal
    this.overlay = document.createElement('div');
    this.overlay.className = 'tutorial-overlay';
    this.overlay.style.cssText = `
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.8);
      z-index: 10000;
      pointer-events: all;
    `;
    modalContainer.appendChild(this.overlay);

    // Crear tooltip DENTRO del modal
    this.tooltip = document.createElement('div');
    this.tooltip.className = 'tutorial-tooltip';
    this.tooltip.style.cssText = `
      position: absolute;
      background: linear-gradient(135deg, #f4e9d8 0%, #e8dac8 100%);
      border: 4px solid #d4af37;
      border-radius: 12px;
      padding: 2rem;
      max-width: 500px;
      z-index: 10001;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
      animation: fadeIn 0.3s ease;
    `;
    modalContainer.appendChild(this.tooltip);
  }

  /**
   * Mostrar paso
   */
  showStep(step) {
    if (!step) return;

    // Limpiar highlight anterior
    document.querySelectorAll('.tutorial-highlight').forEach(el => {
      el.classList.remove('tutorial-highlight');
    });

    // Highlight elemento target
    if (step.target && step.highlight) {
      const targetEl = document.querySelector(step.target);
      if (targetEl) {
        targetEl.classList.add('tutorial-highlight');
        targetEl.style.position = 'relative';
        targetEl.style.zIndex = '9999';

        // Scroll suave al elemento
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }

    // Renderizar tooltip
    this.renderTooltip(step);

    // Posicionar tooltip
    this.positionTooltip(step);
  }

  /**
   * Renderizar tooltip
   */
  renderTooltip(step) {
    const actionsHTML = step.actions.map(action => {
      const btnClass = action.action === 'skip' ? 'tutorial-btn-secondary' : 'tutorial-btn-primary';
      return `<button class="tutorial-btn ${btnClass}" data-action="${action.action}">${action.label}</button>`;
    }).join('');

    this.tooltip.innerHTML = `
      <div class="tutorial-content">
        <h2 class="tutorial-title" style="
          font-size: 1.5rem;
          font-weight: 700;
          color: #8b7355;
          margin-bottom: 1rem;
          border-bottom: 2px solid #d4af37;
          padding-bottom: 0.5rem;
        ">${step.title}</h2>
        <p class="tutorial-message" style="
          font-size: 1rem;
          color: #5a4a3a;
          line-height: 1.6;
          margin-bottom: 1.5rem;
        ">${step.message}</p>
        <div class="tutorial-actions" style="
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
        ">${actionsHTML}</div>
      </div>
      <div class="tutorial-progress" style="
        position: absolute;
        bottom: 0.5rem;
        left: 1rem;
        font-size: 0.85rem;
        color: #8b7355;
        opacity: 0.7;
      ">Paso ${this.currentStep + 1} de ${this.steps.length}</div>
    `;

    // CSS inline para botones
    const style = document.createElement('style');
    style.textContent = `
      .tutorial-btn {
        padding: 0.75rem 1.5rem;
        border: none;
        border-radius: 6px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        font-size: 0.95rem;
      }
      .tutorial-btn-primary {
        background: linear-gradient(135deg, #d4af37 0%, #b87333 100%);
        color: #0a0a0f;
      }
      .tutorial-btn-primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(212, 175, 55, 0.4);
      }
      .tutorial-btn-secondary {
        background: rgba(139, 115, 85, 0.3);
        color: #8b7355;
        border: 2px solid #8b7355;
      }
      .tutorial-btn-secondary:hover {
        background: rgba(139, 115, 85, 0.5);
      }
      .tutorial-highlight {
        box-shadow: 0 0 0 4px #d4af37, 0 0 30px rgba(212, 175, 55, 0.6) !important;
        animation: pulse-highlight 2s ease-in-out infinite !important;
      }
      @keyframes pulse-highlight {
        0%, 100% { box-shadow: 0 0 0 4px #d4af37, 0 0 30px rgba(212, 175, 55, 0.6); }
        50% { box-shadow: 0 0 0 6px #d4af37, 0 0 50px rgba(212, 175, 55, 0.8); }
      }
      @keyframes fadeIn {
        from { opacity: 0; transform: scale(0.9); }
        to { opacity: 1; transform: scale(1); }
      }
    `;
    document.head.appendChild(style);

    // Event listeners para botones
    this.tooltip.querySelectorAll('.tutorial-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = e.target.dataset.action;
        this.handleAction(action);
      });
    });
  }

  /**
   * Posicionar tooltip
   */
  positionTooltip(step) {
    if (step.position === 'center' || !step.target) {
      // Centrado
      this.tooltip.style.left = '50%';
      this.tooltip.style.top = '50%';
      this.tooltip.style.transform = 'translate(-50%, -50%)';
      return;
    }

    const targetEl = document.querySelector(step.target);
    if (!targetEl) {
      // Fallback a centro
      this.tooltip.style.left = '50%';
      this.tooltip.style.top = '50%';
      this.tooltip.style.transform = 'translate(-50%, -50%)';
      return;
    }

    const targetRect = targetEl.getBoundingClientRect();
    const tooltipRect = this.tooltip.getBoundingClientRect();

    let left, top;

    switch (step.position) {
      case 'top':
        left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
        top = targetRect.top - tooltipRect.height - 20;
        break;
      case 'bottom':
        left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
        top = targetRect.bottom + 20;
        break;
      case 'left':
        left = targetRect.left - tooltipRect.width - 20;
        top = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2);
        break;
      case 'right':
        left = targetRect.right + 20;
        top = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2);
        break;
    }

    // Ajustar si se sale de la pantalla
    if (left < 10) left = 10;
    if (top < 10) top = 10;
    if (left + tooltipRect.width > window.innerWidth - 10) {
      left = window.innerWidth - tooltipRect.width - 10;
    }
    if (top + tooltipRect.height > window.innerHeight - 10) {
      top = window.innerHeight - tooltipRect.height - 10;
    }

    this.tooltip.style.left = `${left}px`;
    this.tooltip.style.top = `${top}px`;
    this.tooltip.style.transform = 'none';
  }

  /**
   * Manejar acción
   */
  handleAction(action) {
    switch (action) {
      case 'next':
        this.nextStep();
        break;
      case 'skip':
        this.skip();
        break;
      case 'complete':
        this.complete();
        break;
      case 'trigger-play':
        // Trigger play button
        document.getElementById('btn-play-pause')?.click();
        this.nextStep();
        break;
    }
  }

  /**
   * Siguiente paso
   */
  nextStep() {
    this.currentStep++;

    if (this.currentStep >= this.steps.length) {
      this.complete();
      return;
    }

    this.showStep(this.steps[this.currentStep]);
  }

  /**
   * Saltar tutorial
   */
  skip() {
    const confirm = window.confirm('¿Estás seguro de saltar el tutorial? Puedes reiniciarlo desde el menú de ayuda.');
    if (confirm) {
      this.complete();
    }
  }

  /**
   * Completar tutorial
   */
  complete() {
    this.active = false;
    this.completed = true;
    this.saveCompletionStatus();

    // Limpiar UI
    this.cleanup();

    // Notificar
    // console.log('✅ Tutorial completado');

    // Disparar evento custom
    window.dispatchEvent(new CustomEvent('tutorialCompleted'));
  }

  /**
   * Limpiar UI
   */
  cleanup() {
    // Remover highlight
    document.querySelectorAll('.tutorial-highlight').forEach(el => {
      el.classList.remove('tutorial-highlight');
      el.style.zIndex = '';
    });

    // Remover overlay y tooltip
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
    if (this.tooltip) {
      this.tooltip.remove();
      this.tooltip = null;
    }
  }

  /**
   * Guardar estado de completación
   */
  saveCompletionStatus() {
    localStorage.setItem('microsocieties-tutorial-completed', this.completed);
  }

  /**
   * Cargar estado de completación
   */
  loadCompletionStatus() {
    return localStorage.getItem('microsocieties-tutorial-completed') === 'true';
  }

  /**
   * Resetear tutorial
   */
  reset() {
    this.completed = false;
    this.currentStep = 0;
    this.saveCompletionStatus();
  }

  /**
   * Obtener progreso
   */
  getProgress() {
    return {
      completed: this.completed,
      currentStep: this.currentStep,
      totalSteps: this.steps.length,
      percentage: this.completed ? 100 : Math.round((this.currentStep / this.steps.length) * 100)
    };
  }
}

// Exportar
window.TutorialSystem = TutorialSystem;
// console.log('📚 Sistema de Tutorial cargado');
