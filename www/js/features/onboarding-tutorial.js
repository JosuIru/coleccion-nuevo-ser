// ============================================================================
// ONBOARDING TUTORIAL - Tutorial Guiado Interactivo
// ============================================================================
// Se muestra solo la primera vez que el usuario entra a la app

class OnboardingTutorial {
  constructor() {
    this.currentStep = 0;
    this.isActive = false;
    this.isTransitioning = false; // Prevenir clics múltiples
    this.i18n = window.i18n || { t: (key) => key };

    // Definir los pasos del tutorial
    this.steps = [
      {
        target: '#biblioteca-view',
        title: '¡Bienvenido a Colección Nuevo Ser! 🎉',
        content: 'Esta es tu biblioteca personal de crecimiento y transformación. Te mostraremos las funciones principales en un rápido tour.',
        position: 'center',
        highlightClass: null,
        buttons: ['skip', 'next']
      },
      {
        target: '.book-card',
        title: '📚 Libros Disponibles',
        content: 'Aquí encontrarás todos los libros de la colección. Click en cualquiera para empezar a leer.',
        position: 'bottom',
        highlightClass: 'ring-4 ring-cyan-500',
        buttons: ['skip', 'next']
      },
      {
        target: '#book-reader-view',
        title: '📖 Lector de Libros',
        content: 'Este es el lector donde disfrutarás del contenido. Navega entre capítulos con las flechas o el menú lateral.',
        position: 'center',
        highlightClass: null,
        buttons: ['skip', 'next'],
        requiresBookOpen: true
      },
      {
        target: '#bookmark-btn',
        title: '🔖 Marcadores',
        content: 'Marca capítulos importantes para volver a ellos fácilmente. Atajo: <kbd>B</kbd>',
        position: 'bottom',
        highlightClass: 'ring-4 ring-cyan-500 rounded-lg',
        buttons: ['skip', 'next'],
        requiresBookOpen: true
      },
      {
        target: '#notes-btn',
        title: '📝 Sistema de Notas',
        content: 'Toma notas mientras lees o graba notas de voz. Todas se sincronizan automáticamente.',
        position: 'bottom',
        highlightClass: 'ring-4 ring-cyan-500 rounded-lg',
        buttons: ['skip', 'next'],
        requiresBookOpen: true
      },
      {
        target: '#ai-chat-btn',
        title: '🤖 Chat con IA',
        content: 'Conversa con IA sobre el libro. Pregunta, profundiza conceptos o pide ejemplos prácticos.',
        position: 'bottom',
        highlightClass: 'ring-4 ring-purple-500 rounded-lg',
        buttons: ['skip', 'next'],
        requiresBookOpen: true
      },
      {
        target: null,
        title: '✨ Selección de Texto Inteligente',
        content: 'Selecciona cualquier texto del libro y aparecerá un menú para:<br>💡 Explicar • 📖 Definir • 🔍 Profundizar • 📝 Resumir • ❓ Preguntar',
        position: 'center',
        highlightClass: null,
        buttons: ['skip', 'next'],
        demo: 'text-selection'
      },
      {
        target: '#audioreader-btn',
        title: '🎧 AudioReader',
        content: 'Escucha el libro con voz sintética. Controles completos, velocidad ajustable, sleep timer y más. Atajo: <kbd>A</kbd>',
        position: 'bottom',
        highlightClass: 'ring-4 ring-green-500 rounded-lg',
        buttons: ['skip', 'next'],
        requiresBookOpen: true
      },
      {
        target: '#settings-dropdown-btn',
        title: '⚙️ Configuración',
        content: 'Aquí configuras la IA, temas, idioma y más. También puedes acceder a este tutorial nuevamente.',
        position: 'bottom',
        highlightClass: 'ring-4 ring-cyan-500 rounded-lg',
        buttons: ['skip', 'next'],
        requiresBookOpen: true
      },
      {
        target: null,
        title: '🎓 ¡Listo para Empezar!',
        content: `
          <p class="mb-3">Ya conoces las funciones principales. Recuerda:</p>
          <ul class="space-y-2 text-sm">
            <li>❓ <strong>Centro de Ayuda:</strong> Accede desde el menú si necesitas más info</li>
            <li>⌨️ <strong>Atajos de teclado:</strong> Presiona <kbd>?</kbd> para verlos todos</li>
            <li>☁️ <strong>Sincronización:</strong> Tus datos se guardan automáticamente</li>
          </ul>
          <p class="mt-4 text-cyan-400 font-semibold">¡Disfruta tu viaje de transformación! 🚀</p>
        `,
        position: 'center',
        highlightClass: null,
        buttons: ['finish']
      }
    ];
  }

  // ==========================================================================
  // CONTROL DEL TUTORIAL
  // ==========================================================================

  start() {
    // Verificar si ya se mostró antes
    const hasSeenTutorial = localStorage.getItem('has_seen_tutorial');
    if (hasSeenTutorial && hasSeenTutorial === 'true') {
      // console.log('Tutorial ya visto anteriormente');
      // Permitir reiniciar manualmente
    }

    // Ocultar menú de selección de texto si está abierto
    if (window.textSelectionHelper && window.textSelectionHelper.isMenuVisible) {
      window.textSelectionHelper.hideMenu();
    }

    this.isActive = true;
    this.currentStep = 0;
    this.showStep(this.currentStep);
  }

  skip() {
    // console.log('[Tutorial] skip() llamado, isTransitioning:', this.isTransitioning);
    if (this.isTransitioning) return;
    this.isTransitioning = true;

    this.markAsCompleted();
    this.close();

    setTimeout(() => {
      this.isTransitioning = false;
    }, 300);
  }

  finish() {
    if (this.isTransitioning) return;
    this.isTransitioning = true;

    this.markAsCompleted();
    this.close();

    // Mostrar mensaje de felicitación
    if (window.toast) {
      window.toast.success('🎉 ¡Tutorial completado! Ya estás listo para explorar.');
    }

    setTimeout(() => {
      this.isTransitioning = false;
    }, 300);
  }

  markAsCompleted() {
    localStorage.setItem('has_seen_tutorial', 'true');
  }

  close() {
    this.isActive = false;
    this.removeOverlay();
    this.removeTooltip();
  }

  next() {
    if (this.isTransitioning) return;
    if (this.currentStep < this.steps.length - 1) {
      this.isTransitioning = true;
      this.currentStep++;
      this.showStep(this.currentStep);
      setTimeout(() => {
        this.isTransitioning = false;
      }, 300);
    }
  }

  previous() {
    if (this.isTransitioning) return;
    if (this.currentStep > 0) {
      this.isTransitioning = true;
      this.currentStep--;
      this.showStep(this.currentStep);
      setTimeout(() => {
        this.isTransitioning = false;
      }, 300);
    }
  }

  // ==========================================================================
  // RENDERIZADO
  // ==========================================================================

  showStep(stepIndex) {
    const step = this.steps[stepIndex];
    if (!step) return;

    // Si requiere libro abierto y no hay ninguno, abrir uno de ejemplo
    if (step.requiresBookOpen && !this.isBookReaderVisible()) {
      this.removeOverlay();
      this.removeTooltip();

      this.openExampleBook(() => {
        setTimeout(() => {
          this.showStep(stepIndex);
        }, 300);
      });
      return;
    }

    // Remover paso anterior
    this.removeOverlay();
    this.removeTooltip();

    // Si hay demo especial
    if (step.demo) {
      this.showDemo(step.demo);
    }

    // Crear overlay
    this.createOverlay(step.target, step.highlightClass);

    // Crear tooltip
    this.createTooltip(step);

    // Scroll al elemento si es necesario
    if (step.target) {
      const targetElement = document.querySelector(step.target);
      if (targetElement) {
        setTimeout(() => {
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
    }
  }

  createOverlay(targetSelector, highlightClass) {
    // Overlay de fondo oscuro
    const overlay = document.createElement('div');
    overlay.id = 'tutorial-overlay';
    overlay.className = 'fixed inset-0 bg-black/70 z-[9998] pointer-events-none transition-opacity duration-300 opacity-0';
    document.body.appendChild(overlay);

    // Trigger animation
    requestAnimationFrame(() => {
      overlay.classList.remove('opacity-0');
    });

    // Si hay target, resaltarlo
    if (targetSelector) {
      const targetElement = document.querySelector(targetSelector);
      if (targetElement) {
        targetElement.classList.add('relative', 'z-[9999]', 'pointer-events-auto');
        if (highlightClass) {
          targetElement.classList.add(...highlightClass.split(' '));
        }

        // Guardar para limpiar después
        overlay.dataset.targetSelector = targetSelector;
        if (highlightClass) {
          overlay.dataset.highlightClass = highlightClass;
        }
      }
    }
  }

  createTooltip(step) {
    const tooltip = document.createElement('div');
    tooltip.id = 'tutorial-tooltip';
    tooltip.className = 'fixed z-[10000] max-w-md w-full sm:w-96 bg-gray-900 border-2 border-cyan-500 rounded-xl shadow-2xl p-5 transition-all duration-300 opacity-0 scale-95 pointer-events-auto select-none';

    // Prevenir selección de texto en el tooltip
    tooltip.style.userSelect = 'none';
    tooltip.style.webkitUserSelect = 'none';
    tooltip.style.mozUserSelect = 'none';

    // Contenido del tooltip
    tooltip.innerHTML = `
      <div class="mb-4">
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-lg font-bold text-cyan-300">${step.title}</h3>
          <span class="text-xs text-gray-500">Paso ${this.currentStep + 1}/${this.steps.length}</span>
        </div>
        <div class="text-sm text-gray-300 leading-relaxed">${step.content}</div>
      </div>

      <!-- Progress bar -->
      <div class="mb-4 h-1 bg-gray-800 rounded-full overflow-hidden">
        <div class="h-full bg-cyan-500 transition-all duration-300" style="width: ${((this.currentStep + 1) / this.steps.length) * 100}%"></div>
      </div>

      <!-- Buttons -->
      <div class="flex items-center justify-between gap-2">
        ${step.buttons.includes('skip') ? `
          <button id="tutorial-skip" class="px-4 py-2 text-sm text-gray-400 hover:text-white transition">
            Saltar tutorial
          </button>
        ` : '<div></div>'}

        <div class="flex gap-2">
          ${this.currentStep > 0 ? `
            <button id="tutorial-prev" class="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-semibold transition">
              ← Anterior
            </button>
          ` : ''}

          ${step.buttons.includes('next') ? `
            <button id="tutorial-next" class="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-lg text-sm font-semibold transition">
              Siguiente →
            </button>
          ` : ''}

          ${step.buttons.includes('finish') ? `
            <button id="tutorial-finish" class="px-6 py-2 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 rounded-lg text-sm font-bold transition">
              ¡Empezar! 🚀
            </button>
          ` : ''}
        </div>
      </div>
    `;

    document.body.appendChild(tooltip);

    // Posicionar tooltip
    this.positionTooltip(tooltip, step);

    // Trigger animation
    requestAnimationFrame(() => {
      tooltip.classList.remove('opacity-0', 'scale-95');
    });

    // Event listeners
    this.attachTooltipListeners();
  }

  positionTooltip(tooltip, step) {
    const target = step.target ? document.querySelector(step.target) : null;

    if (!target || step.position === 'center') {
      // Centrar en pantalla
      tooltip.style.top = '50%';
      tooltip.style.left = '50%';
      tooltip.style.transform = 'translate(-50%, -50%)';
      return;
    }

    const targetRect = target.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();

    let top, left;

    switch (step.position) {
      case 'bottom':
        top = targetRect.bottom + 15;
        left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
        break;

      case 'top':
        top = targetRect.top - tooltipRect.height - 15;
        left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
        break;

      case 'left':
        top = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2);
        left = targetRect.left - tooltipRect.width - 15;
        break;

      case 'right':
        top = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2);
        left = targetRect.right + 15;
        break;

      default:
        top = targetRect.bottom + 15;
        left = targetRect.left;
    }

    // Ajustar si se sale de la pantalla
    if (left < 10) left = 10;
    if (left + tooltipRect.width > window.innerWidth - 10) {
      left = window.innerWidth - tooltipRect.width - 10;
    }
    if (top < 10) top = 10;
    if (top + tooltipRect.height > window.innerHeight - 10) {
      top = window.innerHeight - tooltipRect.height - 10;
    }

    tooltip.style.top = `${top}px`;
    tooltip.style.left = `${left}px`;
  }

  removeOverlay() {
    const overlay = document.getElementById('tutorial-overlay');
    if (overlay) {
      // Limpiar highlight del target
      const targetSelector = overlay.dataset.targetSelector;
      const highlightClass = overlay.dataset.highlightClass;

      if (targetSelector) {
        const target = document.querySelector(targetSelector);
        if (target) {
          target.classList.remove('relative', 'z-[9999]', 'pointer-events-auto');
          if (highlightClass) {
            target.classList.remove(...highlightClass.split(' '));
          }
        }
      }

      overlay.remove();
    }
  }

  removeTooltip() {
    const tooltip = document.getElementById('tutorial-tooltip');
    if (tooltip) {
      // Eliminar inmediatamente para evitar IDs duplicados
      tooltip.remove();
    }
  }

  attachTooltipListeners() {
    // console.log('[Tutorial] attachTooltipListeners() llamado');

    // Pequeño delay para asegurar que el DOM esté renderizado
    requestAnimationFrame(() => {
      // console.log('[Tutorial] Buscando botones del tooltip...');

      const skipBtn = document.getElementById('tutorial-skip');
      // console.log('[Tutorial] skipBtn:', skipBtn);
      if (skipBtn) {
        // console.log('[Tutorial] ✅ Botón "Saltar" encontrado, adjuntando listener');
        skipBtn.addEventListener('click', (e) => {
          // console.log('[Tutorial] 🔵 Click capturado en "Saltar"');
          e.stopPropagation();
          e.preventDefault();
          this.skip();
        }, { capture: true });
      } else {
        // console.warn('[Tutorial] ❌ Botón "Saltar" NO encontrado');
      }

      const prevBtn = document.getElementById('tutorial-prev');
      if (prevBtn) {
        // console.log('[Tutorial] ✅ Botón "Anterior" encontrado');
        prevBtn.addEventListener('click', (e) => {
          // console.log('[Tutorial] 🔵 Click capturado en "Anterior"');
          e.stopPropagation();
          e.preventDefault();
          this.previous();
        }, { capture: true });
      }

      const nextBtn = document.getElementById('tutorial-next');
      // console.log('[Tutorial] nextBtn:', nextBtn);
      if (nextBtn) {
        // console.log('[Tutorial] ✅ Botón "Siguiente" encontrado, adjuntando listener');
        nextBtn.addEventListener('click', (e) => {
          // console.log('[Tutorial] 🔵 Click capturado en "Siguiente"');
          e.stopPropagation();
          e.preventDefault();
          this.next();
        }, { capture: true });
      } else {
        // console.warn('[Tutorial] ❌ Botón "Siguiente" NO encontrado');
      }

      const finishBtn = document.getElementById('tutorial-finish');
      if (finishBtn) {
        // console.log('[Tutorial] ✅ Botón "Empezar" encontrado');
        finishBtn.addEventListener('click', (e) => {
          // console.log('[Tutorial] 🔵 Click capturado en "Empezar"');
          e.stopPropagation();
          e.preventDefault();
          this.finish();
        }, { capture: true });
      }

      // console.log('[Tutorial] Listeners adjuntados completamente');
    });
  }

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  isBookReaderVisible() {
    const bookReader = document.getElementById('book-reader-view');
    return bookReader && !bookReader.classList.contains('hidden');
  }

  openExampleBook(callback) {
    // Primero verificar si ya hay un libro abierto
    if (this.isBookReaderVisible()) {
      if (callback) callback();
      return;
    }

    // Intentar abrir el primer libro disponible
    const firstBookCard = document.querySelector('.book-card');
    if (firstBookCard) {
      firstBookCard.click();

      // Esperar a que el libro se abra
      setTimeout(() => {
        if (this.isBookReaderVisible()) {
          if (callback) callback();
        } else {
          // console.warn('[Tutorial] El libro no se abrió correctamente, reintentando...');
          // Reintentar una vez más
          setTimeout(() => {
            if (callback) callback();
          }, 500);
        }
      }, 1000);
    } else {
      // console.warn('[Tutorial] No se encontró ninguna tarjeta de libro, saltando paso...');
      // Si no hay libros, saltar este paso
      this.next();
    }
  }

  showDemo(demoType) {
    if (demoType === 'text-selection') {
      // Mostrar demo animado de selección de texto
      // Por ahora, solo un placeholder
    }
  }

  // ==========================================================================
  // MÉTODOS PÚBLICOS
  // ==========================================================================

  static shouldShowOnFirstVisit() {
    return !localStorage.getItem('has_seen_tutorial');
  }

  reset() {
    localStorage.removeItem('has_seen_tutorial');
    // console.log('Tutorial reset - se mostrará en la próxima visita');
  }
}

// Exportar globalmente
window.OnboardingTutorial = OnboardingTutorial;

// Inicializar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.onboardingTutorial = new OnboardingTutorial();

    // Mostrar automáticamente en primera visita
    // DESHABILITADO por defecto - el usuario debe activarlo manualmente
    // if (OnboardingTutorial.shouldShowOnFirstVisit()) {
    //   setTimeout(() => {
    //     window.onboardingTutorial.start();
    //   }, 1000);
    // }
  });
} else {
  window.onboardingTutorial = new OnboardingTutorial();
}
