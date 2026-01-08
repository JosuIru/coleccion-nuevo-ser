// ============================================================================
// WELCOME FLOW - Onboarding Rápido de 3 Pasos
// ============================================================================
// Flujo de bienvenida orientado a la acción:
// 1. ¿Qué buscas hoy? (Leer, Meditar, Explorar)
// 2. Recomendación personalizada
// 3. Primera práctica guiada (90 segundos)
// ============================================================================

// 🔧 FIX v2.9.198: Migrated console.log to logger
class WelcomeFlow {
  constructor() {
    this.currentStep = 0;
    this.userIntent = null; // 'read', 'meditate', 'explore'
    this.recommendedBook = null;
    this.isActive = false;
    this.container = null;

    // ⭐ FIX v2.9.183: Tracking de timers para cleanup (6 timers sin clear)
    this.timers = [];
    this.intervals = [];

    // Configuración de intenciones y recomendaciones
    this.intents = {
      philosophy: {
        icon: '💡',
        label: 'Filosofía',
        description: 'Comprender las bases teóricas del Nuevo Ser',
        recommendedBooks: ['codigo-despertar', 'filosofia-nuevo-ser', 'dialogos-maquina'],
        borderClass: 'border-cyan-500/30 hover:border-cyan-500/60',
        bgClass: 'bg-cyan-500/10 hover:bg-cyan-500/20',
        textClass: 'text-cyan-300',
        btnClass: 'from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 shadow-cyan-500/25'
      },
      community: {
        icon: '🏛️',
        label: 'Comunidades',
        description: 'Crear y transformar organizaciones',
        recommendedBooks: ['toolkit-transicion', 'guia-acciones', 'ahora-instituciones'],
        borderClass: 'border-emerald-500/30 hover:border-emerald-500/60',
        bgClass: 'bg-emerald-500/10 hover:bg-emerald-500/20',
        textClass: 'text-emerald-300',
        btnClass: 'from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 shadow-emerald-500/25'
      },
      education: {
        icon: '🎓',
        label: 'Educación',
        description: 'Herramientas para educadores y agentes sociales',
        recommendedBooks: ['ahora-instituciones', 'guia-transicion', 'manual-transicion'],
        borderClass: 'border-amber-500/30 hover:border-amber-500/60',
        bgClass: 'bg-amber-500/10 hover:bg-amber-500/20',
        textClass: 'text-amber-300',
        btnClass: 'from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 shadow-amber-500/25'
      },
      practice: {
        icon: '🌀',
        label: 'Práctica',
        description: 'Ejercicios de transformación personal',
        recommendedBooks: ['manual-practico', 'practicas-radicales', 'tierra-que-despierta'],
        borderClass: 'border-violet-500/30 hover:border-violet-500/60',
        bgClass: 'bg-violet-500/10 hover:bg-violet-500/20',
        textClass: 'text-violet-300',
        btnClass: 'from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 shadow-violet-500/25'
      },
      explore: {
        icon: '🔍',
        label: 'Explorar',
        description: 'Descubrir la colección libremente',
        recommendedBooks: ['manifiesto', 'codigo-despertar', 'filosofia-nuevo-ser'],
        borderClass: 'border-slate-500/30 hover:border-slate-500/60',
        bgClass: 'bg-slate-500/10 hover:bg-slate-500/20',
        textClass: 'text-slate-300',
        btnClass: 'from-slate-600 to-slate-500 hover:from-slate-500 hover:to-slate-400 shadow-slate-500/25'
      }
    };

    // Primera práctica rápida (respiración consciente)
    this.quickPractice = {
      title: 'Respiración Consciente',
      duration: 60, // segundos
      steps: [
        { text: 'Encuentra una posición cómoda', duration: 5 },
        { text: 'Cierra los ojos suavemente', duration: 5 },
        { text: 'Inhala profundamente... 4 segundos', duration: 5 },
        { text: 'Sostén... 4 segundos', duration: 5 },
        { text: 'Exhala lentamente... 6 segundos', duration: 7 },
        { text: 'Repite: Inhala...', duration: 5 },
        { text: 'Sostén...', duration: 5 },
        { text: 'Exhala...', duration: 7 },
        { text: 'Una vez más: Inhala profundo...', duration: 5 },
        { text: 'Sostén con calma...', duration: 5 },
        { text: 'Exhala todo el aire...', duration: 7 },
        { text: 'Abre los ojos cuando estés listo', duration: 5 }
      ]
    };
  }

  // ==========================================================================
  // CONTROL DEL FLUJO
  // ==========================================================================

  shouldShow() {
    // Mostrar si nunca se completó el welcome flow
    return !localStorage.getItem('welcome_flow_completed');
  }

  start() {
    if (!this.shouldShow()) {
      logger.debug('[WelcomeFlow] Ya completado anteriormente');
      return false;
    }

    this.isActive = true;
    this.currentStep = 0;
    this.createContainer();
    this.renderStep1();

    // Track inicio
    if (window.analyticsHelper) {
      window.analyticsHelper.trackEvent('welcome_flow_start');
    }

    return true;
  }

  skip() {
    this.markAsCompleted();
    this.close();

    if (window.analyticsHelper) {
      window.analyticsHelper.trackEvent('welcome_flow_skip', { step: this.currentStep });
    }
  }

  complete() {
    this.markAsCompleted();
    this.close();

    if (window.toast) {
      window.toast.success('¡Bienvenido! Explora a tu ritmo 🌟');
    }

    if (window.analyticsHelper) {
      window.analyticsHelper.trackEvent('welcome_flow_complete');
    }
  }

  markAsCompleted() {
    localStorage.setItem('welcome_flow_completed', 'true');
    localStorage.setItem('welcome_flow_date', new Date().toISOString());
    if (this.userIntent) {
      localStorage.setItem('user_primary_intent', this.userIntent);
    }
  }

  close() {
    this.isActive = false;
    if (this.container) {
      this.container.classList.add('opacity-0');
      // ⭐ FIX v2.9.183: Usar _setTimeout para tracking
      this._setTimeout(() => {
        this.container.remove();
        this.container = null;
      }, 300);
    }
  }

  reset() {
    localStorage.removeItem('welcome_flow_completed');
    localStorage.removeItem('welcome_flow_date');
    localStorage.removeItem('user_primary_intent');
    logger.debug('[WelcomeFlow] Reset - se mostrará en la próxima visita');
  }

  // ==========================================================================
  // RENDERIZADO
  // ==========================================================================

  createContainer() {
    // Remover container existente si hay
    const existing = document.getElementById('welcome-flow-container');
    if (existing) existing.remove();

    this.container = document.createElement('div');
    this.container.id = 'welcome-flow-container';
    this.container.className = 'fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-opacity duration-300';
    this.container.innerHTML = `
      <div class="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"></div>
      <div id="welcome-flow-content" class="relative z-10 w-full max-w-lg"></div>
    `;

    document.body.appendChild(this.container);
  }

  getContentContainer() {
    return document.getElementById('welcome-flow-content');
  }

  // --------------------------------------------------------------------------
  // PASO 1: ¿Qué buscas hoy?
  // --------------------------------------------------------------------------

  renderStep1() {
    const content = this.getContentContainer();
    if (!content) return;

    content.innerHTML = `
      <div class="text-center mb-6 animate-fade-in">
        <h1 class="text-3xl sm:text-4xl font-bold mb-3 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
          Bienvenido a Nuevo Ser
        </h1>
        <p class="text-lg text-gray-300">
          ¿Qué te trae aquí hoy?
        </p>
      </div>

      <div class="grid grid-cols-1 gap-3 mb-6 max-h-[60vh] overflow-y-auto">
        ${Object.entries(this.intents).map(([key, intent]) => `
          <button
            data-intent="${key}"
            class="welcome-intent-btn group p-4 rounded-xl border-2 ${intent.borderClass} ${intent.bgClass} transition-all duration-300 text-left flex items-center gap-4"
          >
            <span class="text-3xl group-hover:scale-110 transition-transform">${intent.icon}</span>
            <div class="flex-1">
              <div class="text-lg font-bold ${intent.textClass}">${intent.label}</div>
              <div class="text-sm text-gray-400">${intent.description}</div>
            </div>
            <span class="ml-auto ${intent.textClass} opacity-0 group-hover:opacity-100 transition-opacity">→</span>
          </button>
        `).join('')}
      </div>

      <div class="text-center">
        <button id="welcome-skip-btn" class="text-sm text-gray-500 hover:text-gray-300 transition-colors">
          Explorar directamente
        </button>
      </div>
    `;

    // Event listeners
    content.querySelectorAll('.welcome-intent-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.userIntent = btn.dataset.intent;
        this.currentStep = 1;
        this.renderStep2();
      });
    });

    content.querySelector('#welcome-skip-btn')?.addEventListener('click', () => {
      this.skip();
    });
  }

  // --------------------------------------------------------------------------
  // PASO 2: Recomendación personalizada
  // --------------------------------------------------------------------------

  renderStep2() {
    const content = this.getContentContainer();
    if (!content) return;

    const intent = this.intents[this.userIntent];
    const bookId = intent.recommendedBooks[0];

    // Obtener datos del libro del catálogo
    const bookData = this.getBookData(bookId);
    this.recommendedBook = bookData;

    content.innerHTML = `
      <div class="animate-fade-in">
        <div class="text-center mb-6">
          <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full ${intent.bgClass} ${intent.textClass} text-sm mb-4">
            <span>${intent.icon}</span>
            <span>${intent.label}</span>
          </div>
          <h2 class="text-2xl sm:text-3xl font-bold text-white mb-2">
            Te recomendamos empezar con:
          </h2>
        </div>

        <!-- Book Card -->
        <div class="p-6 rounded-2xl border-2 ${intent.borderClass} bg-gradient-to-br from-slate-800/80 to-slate-900/80 mb-6">
          <div class="flex items-start gap-4 mb-4">
            <div class="w-16 h-16 flex items-center justify-center rounded-xl ${intent.bgClass} text-3xl">
              ${bookData?.icon || '📖'}
            </div>
            <div class="flex-1">
              <h3 class="text-xl font-bold text-white mb-1">${bookData?.title || 'El Código del Despertar'}</h3>
              <p class="text-sm text-gray-400">${bookData?.subtitle || ''}</p>
            </div>
          </div>

          <p class="text-gray-300 text-sm mb-4 line-clamp-3">
            ${bookData?.description || 'Un viaje transformador hacia la comprensión de la conciencia y la realidad.'}
          </p>

          <div class="flex items-center gap-4 text-xs text-gray-400">
            <span class="flex items-center gap-1">📚 ${bookData?.chapters || 14} capítulos</span>
            <span class="flex items-center gap-1">⏱️ ${bookData?.estimatedReadTime || '~4h'}</span>
          </div>
        </div>

        <!-- Actions -->
        <div class="space-y-3">
          <button id="welcome-start-reading" class="w-full py-4 px-6 rounded-xl font-bold text-lg bg-gradient-to-r ${intent.btnClass} text-white transition-all duration-300 flex items-center justify-center gap-2 shadow-lg">
            Empezar a leer →
          </button>

          <button id="welcome-do-practice" class="w-full py-3 px-6 rounded-xl font-semibold bg-slate-700/50 hover:bg-slate-600/50 text-gray-200 transition-all duration-300 flex items-center justify-center gap-2 border border-slate-600/50">
            <span>🌀</span>
            <span>Una pausa antes de empezar (opcional)</span>
          </button>
        </div>

        <div class="text-center mt-4">
          <button id="welcome-back-btn" class="text-sm text-gray-500 hover:text-gray-300 transition-colors">
            ← Volver
          </button>
        </div>
      </div>
    `;

    // Event listeners
    content.querySelector('#welcome-start-reading')?.addEventListener('click', () => {
      this.complete();
      // Abrir el libro recomendado
      if (window.biblioteca && bookId) {
        // ⭐ FIX v2.9.183: Usar _setTimeout para tracking
        this._setTimeout(() => {
          window.biblioteca?.openBook(bookId);
        }, 300);
      }
    });

    content.querySelector('#welcome-do-practice')?.addEventListener('click', () => {
      this.currentStep = 2;
      this.renderStep3();
    });

    content.querySelector('#welcome-back-btn')?.addEventListener('click', () => {
      this.currentStep = 0;
      this.renderStep1();
    });
  }

  // --------------------------------------------------------------------------
  // PASO 3: Práctica guiada
  // --------------------------------------------------------------------------

  renderStep3() {
    const content = this.getContentContainer();
    if (!content) return;

    content.innerHTML = `
      <div class="animate-fade-in text-center">
        <div class="mb-6">
          <div class="inline-flex items-center justify-center w-20 h-20 rounded-full bg-violet-500/20 text-4xl mb-4">
            🧘
          </div>
          <h2 class="text-2xl font-bold text-white mb-2">${this.quickPractice.title}</h2>
          <p class="text-gray-400">1 minuto de presencia antes de comenzar</p>
        </div>

        <!-- Practice Container -->
        <div id="practice-area" class="p-8 rounded-2xl bg-gradient-to-br from-violet-900/30 to-purple-900/30 border border-violet-500/30 mb-6">
          <div id="practice-instruction" class="text-2xl font-medium text-violet-200 mb-6 min-h-[4rem] flex items-center justify-center">
            Presiona iniciar cuando estés listo
          </div>

          <!-- Progress Ring -->
          <div class="relative w-32 h-32 mx-auto mb-4">
            <svg class="w-32 h-32 transform -rotate-90">
              <circle cx="64" cy="64" r="58" stroke="currentColor" stroke-width="6" fill="none" class="text-slate-700"/>
              <circle id="progress-ring" cx="64" cy="64" r="58" stroke="currentColor" stroke-width="6" fill="none"
                      class="text-violet-500 transition-all duration-1000"
                      stroke-dasharray="364.4"
                      stroke-dashoffset="364.4"
                      stroke-linecap="round"/>
            </svg>
            <div id="practice-timer" class="absolute inset-0 flex items-center justify-center text-3xl font-bold text-white">
              ${this.quickPractice.duration}
            </div>
          </div>
        </div>

        <!-- Controls -->
        <div id="practice-controls" class="space-y-3">
          <button id="practice-start-btn" class="w-full py-4 px-6 rounded-xl font-bold text-lg bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white transition-all duration-300">
            Iniciar práctica
          </button>

          <button id="practice-skip-btn" class="text-sm text-gray-500 hover:text-gray-300 transition-colors">
            Saltar y comenzar a leer
          </button>
        </div>

        <!-- Post-practice (hidden initially) -->
        <div id="practice-complete" class="hidden space-y-4">
          <div class="text-xl text-green-400 mb-4">✨ ¡Excelente! Ya estás presente.</div>
          <button id="practice-continue-btn" class="w-full py-4 px-6 rounded-xl font-bold text-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white transition-all duration-300">
            Comenzar a leer →
          </button>
        </div>
      </div>
    `;

    // Event listeners
    content.querySelector('#practice-start-btn')?.addEventListener('click', () => {
      this.startPractice();
    });

    content.querySelector('#practice-skip-btn')?.addEventListener('click', () => {
      this.finishPractice();
    });

    content.querySelector('#practice-continue-btn')?.addEventListener('click', () => {
      this.finishPractice();
    });
  }

  startPractice() {
    const instruction = document.getElementById('practice-instruction');
    const timer = document.getElementById('practice-timer');
    const progressRing = document.getElementById('progress-ring');
    const controls = document.getElementById('practice-controls');
    const complete = document.getElementById('practice-complete');
    const startBtn = document.getElementById('practice-start-btn');

    if (!instruction || !timer || !progressRing) return;

    // Ocultar botón de inicio
    if (startBtn) startBtn.style.display = 'none';

    const totalDuration = this.quickPractice.duration;
    const circumference = 364.4; // 2 * PI * 58
    let currentTime = totalDuration;
    let stepIndex = 0;
    let stepTime = 0;

    // Actualizar instrucción inicial
    instruction.textContent = this.quickPractice.steps[0].text;

    // ⭐ FIX v2.9.183: Usar _setInterval para tracking
    const interval = this._setInterval(() => {
      currentTime--;
      stepTime++;

      // Actualizar timer
      timer.textContent = currentTime;

      // Actualizar progress ring
      const progress = (totalDuration - currentTime) / totalDuration;
      progressRing.style.strokeDashoffset = circumference * (1 - progress);

      // Verificar si hay que cambiar de paso
      if (stepIndex < this.quickPractice.steps.length) {
        const currentStep = this.quickPractice.steps[stepIndex];
        if (stepTime >= currentStep.duration) {
          stepIndex++;
          stepTime = 0;
          if (stepIndex < this.quickPractice.steps.length) {
            instruction.textContent = this.quickPractice.steps[stepIndex].text;
            instruction.classList.add('animate-pulse');
            // ⭐ FIX v2.9.183: Usar _setTimeout para tracking
            this._setTimeout(() => instruction.classList.remove('animate-pulse'), 500);
          }
        }
      }

      // Finalizar
      if (currentTime <= 0) {
        this._clearInterval(interval);
        instruction.textContent = '🙏 Gracias por este momento de presencia';

        // Mostrar botón de continuar
        if (controls) controls.classList.add('hidden');
        if (complete) complete.classList.remove('hidden');
      }
    }, 1000);
  }

  finishPractice() {
    this.complete();

    // Abrir el libro recomendado
    const bookId = this.recommendedBook?.id || this.intents[this.userIntent]?.recommendedBooks[0];
    if (window.biblioteca && bookId) {
      // ⭐ FIX v2.9.183: Usar _setTimeout para tracking
      this._setTimeout(() => {
        window.biblioteca.openBook(bookId);
      }, 300);
    }
  }

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  getBookData(bookId) {
    // Intentar obtener del catálogo cargado
    if (window.bookEngine?.catalog?.books) {
      const book = window.bookEngine.catalog.books.find(b => b.id === bookId);
      if (book) return book;
    }

    // Fallback a datos hardcodeados
    const fallbackBooks = {
      'codigo-despertar': {
        id: 'codigo-despertar',
        title: 'El Código del Despertar',
        subtitle: 'Exploraciones sobre conciencia y realidad',
        description: 'Un viaje transformador que explora la naturaleza de la conciencia, la física cuántica y la meditación como caminos hacia el despertar.',
        icon: '🌟',
        chapters: 14,
        estimatedReadTime: '~4h'
      },
      'manual-practico': {
        id: 'manual-practico',
        title: 'Manual Práctico',
        subtitle: '50 ejercicios de transformación',
        description: 'Meditaciones guiadas, prácticas contemplativas y ejercicios para integrar los conceptos en tu vida diaria.',
        icon: '🧘',
        chapters: 50,
        estimatedReadTime: '~6h'
      },
      'manifiesto': {
        id: 'manifiesto',
        title: 'Manifiesto de la Conciencia Compartida',
        subtitle: 'Hacia una nueva política',
        description: 'Una crítica constructiva del sistema actual y propuestas para una transformación social basada en la interdependencia.',
        icon: '📜',
        chapters: 18,
        estimatedReadTime: '~3h'
      },
      'filosofia-nuevo-ser': {
        id: 'filosofia-nuevo-ser',
        title: 'Filosofía del Nuevo Ser',
        subtitle: 'Ontología de la reconexión',
        description: 'Exploración filosófica profunda sobre la separación y la reconexión como ejes de la transformación personal.',
        icon: '🔮',
        chapters: 24,
        estimatedReadTime: '~5h'
      },
      'tierra-que-despierta': {
        id: 'tierra-que-despierta',
        title: 'La Tierra que Despierta',
        subtitle: 'Ecología profunda y reconexión',
        description: 'Prácticas de reconexión con la naturaleza, duelo ecológico y transformación de nuestra relación con la Tierra.',
        icon: '🌍',
        chapters: 26,
        estimatedReadTime: '~5h'
      },
      'practicas-radicales': {
        id: 'practicas-radicales',
        title: 'Prácticas Radicales',
        subtitle: 'Al borde del conocimiento',
        description: 'Ejercicios avanzados que confrontan sin consuelo, llevándote al límite de tu zona de confort.',
        icon: '⚡',
        chapters: 15,
        estimatedReadTime: '~3h'
      },
      'dialogos-maquina': {
        id: 'dialogos-maquina',
        title: 'Diálogos con la Máquina',
        subtitle: 'Conversaciones humano-IA',
        description: 'Exploración de la conciencia a través del diálogo entre humano e inteligencia artificial.',
        icon: '🤖',
        chapters: 17,
        estimatedReadTime: '~4h'
      },
      'ahora-instituciones': {
        id: 'ahora-instituciones',
        title: 'AHORA',
        subtitle: 'Transformación institucional',
        description: 'Cómo transformar organizaciones e instituciones desde la perspectiva de la interdependencia.',
        icon: '🏛️',
        chapters: 23,
        estimatedReadTime: '~5h'
      },
      'guia-acciones': {
        id: 'guia-acciones',
        title: 'Guía de Acciones Transformadoras',
        subtitle: '54 acciones concretas',
        description: 'Acciones prácticas a nivel individual, comunitario y sistémico derivadas del Manifiesto.',
        icon: '🎯',
        chapters: 54,
        estimatedReadTime: '~6h'
      }
    };

    return fallbackBooks[bookId] || fallbackBooks['codigo-despertar'];
  }

  // ==========================================================================
  // ⭐ FIX v2.9.183: TIMER CLEANUP HELPERS
  // ==========================================================================

  /**
   * Helper: setTimeout que se auto-registra para cleanup
   */
  _setTimeout(callback, delay) {
    const timerId = setTimeout(() => {
      callback();
      // Auto-remover del array cuando se ejecuta
      const index = this.timers.indexOf(timerId);
      if (index > -1) this.timers.splice(index, 1);
    }, delay);
    this.timers.push(timerId);
    return timerId;
  }

  /**
   * Helper: setInterval que se auto-registra para cleanup
   */
  _setInterval(callback, delay) {
    const intervalId = setInterval(callback, delay);
    this.intervals.push(intervalId);
    return intervalId;
  }

  /**
   * Helper: clearInterval con auto-tracking
   */
  _clearInterval(intervalId) {
    clearInterval(intervalId);
    const index = this.intervals.indexOf(intervalId);
    if (index > -1) this.intervals.splice(index, 1);
  }

  /**
   * Cleanup: Limpiar todos los timers e intervals
   */
  cleanup() {
    // Limpiar todos los timers
    this.timers.forEach(timerId => clearTimeout(timerId));
    this.timers = [];

    // Limpiar todos los intervals
    this.intervals.forEach(intervalId => clearInterval(intervalId));
    this.intervals = [];

    logger.debug('[WelcomeFlow] Cleanup completado');
  }
}

// ============================================================================
// EXPORTAR Y AUTO-INICIALIZAR
// ============================================================================

window.WelcomeFlow = WelcomeFlow;

// Crear instancia global
document.addEventListener('DOMContentLoaded', () => {
  window.welcomeFlow = new WelcomeFlow();

  // Auto-mostrar si es primera visita (después de que cargue la biblioteca)
  // ⭐ FIX v2.9.183: Usar _setTimeout para tracking
  window.welcomeFlow._setTimeout(() => {
    if (window.welcomeFlow.shouldShow()) {
      window.welcomeFlow.start();
    }
  }, 1000);
});
