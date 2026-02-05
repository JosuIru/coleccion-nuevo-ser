/**
 * AI Practice Generator - Generador de Prácticas Personalizadas con IA
 * Crea prácticas únicas combinando la biblioteca existente con generación IA
 * @version 1.0.0
 */

class AIPracticeGenerator {
  constructor() {
    this.isOpen = false;
    this.isGenerating = false;
    this.currentPractice = null;
    this.generatedHistory = [];
    this.modalElement = null;

    // Opciones de formulario
    this.emotionalStates = [
      { id: 'calm', label: 'Tranquilo/a', icon: '😌', description: 'Con tiempo para profundizar' },
      { id: 'anxious', label: 'Ansioso/a', icon: '😰', description: 'Necesito calmarme' },
      { id: 'sad', label: 'Triste', icon: '😔', description: 'Desconectado/a' },
      { id: 'frustrated', label: 'Frustrado/a', icon: '😤', description: 'Con tensión acumulada' },
      { id: 'confused', label: 'Confundido/a', icon: '🤔', description: 'Buscando claridad' },
      { id: 'energetic', label: 'Energético/a', icon: '⚡', description: 'Con ganas de actuar' },
      { id: 'tired', label: 'Cansado/a', icon: '😴', description: 'Baja energía' }
    ];

    this.practiceTypes = [
      { id: 'meditation', label: 'Meditación', icon: '🧘', description: 'Contemplación y silencio' },
      { id: 'reflection', label: 'Reflexión', icon: '📝', description: 'Escritura y análisis' },
      { id: 'action', label: 'Acción', icon: '🎯', description: 'Hacer algo concreto' },
      { id: 'physical', label: 'Movimiento', icon: '🌳', description: 'Ejercicio o naturaleza' },
      { id: 'surprise', label: 'Sorpréndeme', icon: '🎲', description: 'Lo que la IA sugiera' }
    ];

    this.focusAreas = [
      { id: 'mindfulness', label: 'Conciencia', icon: '🧠', books: ['codigo-despertar', 'filosofia-nuevo-ser'] },
      { id: 'ecology', label: 'Ecología', icon: '🌍', books: ['tierra-que-despierta'] },
      { id: 'community', label: 'Comunidad', icon: '🤝', books: ['manifiesto'] },
      { id: 'activism', label: 'Activismo', icon: '✊', books: ['guia-acciones', 'practicas-radicales'] },
      { id: 'transition', label: 'Transición', icon: '🔄', books: ['manual-transicion', 'toolkit-transicion'] },
      { id: 'education', label: 'Educación', icon: '📚', books: ['educacion-nuevo-ser'] }
    ];

    // Cargar historial
    this.loadHistory();
  }

  /**
   * Inicializa el generador
   */
  init() {
    this.createModal();
    this.attachEventListeners();
    logger.log('[AIPracticeGenerator] Inicializado');
  }

  /**
   * Carga el historial de prácticas generadas
   */
  loadHistory() {
    try {
      const history = localStorage.getItem('ai-generated-practices');
      this.generatedHistory = history ? JSON.parse(history) : [];
    } catch (error) {
      logger.warn('[AIPracticeGenerator] Error cargando historial:', error);
      this.generatedHistory = [];
    }
  }

  /**
   * Guarda el historial
   */
  saveHistory() {
    try {
      // Mantener solo las últimas 30 prácticas
      const historyToSave = this.generatedHistory.slice(-30);
      localStorage.setItem('ai-generated-practices', JSON.stringify(historyToSave));
    } catch (error) {
      logger.warn('[AIPracticeGenerator] Error guardando historial:', error);
    }
  }

  /**
   * Crea el modal del generador
   */
  createModal() {
    // Eliminar modal existente si hay
    const existingModal = document.getElementById('ai-practice-generator-modal');
    if (existingModal) {
      existingModal.remove();
    }

    const modalHTML = `
      <div id="ai-practice-generator-modal" class="fixed inset-0 z-[9999] hidden" role="dialog" aria-modal="true" aria-labelledby="practice-generator-title">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" id="practice-generator-backdrop"></div>

        <!-- Modal Container -->
        <div class="relative h-full flex items-center justify-center p-4">
          <div class="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-slate-700/50 flex flex-col">

            <!-- Header -->
            <div class="flex items-center justify-between p-4 sm:p-6 border-b border-slate-700/50 bg-gradient-to-r from-violet-900/30 to-purple-900/30">
              <div class="flex items-center gap-3">
                <div class="p-2 rounded-xl bg-violet-500/20 border border-violet-500/30">
                  <span class="text-2xl">✨</span>
                </div>
                <div>
                  <h2 id="practice-generator-title" class="text-xl font-bold text-white">Generador de Prácticas IA</h2>
                  <p class="text-sm text-gray-400">Crea una práctica personalizada para ti</p>
                </div>
              </div>
              <button id="practice-generator-close" class="p-2 rounded-lg hover:bg-slate-700 transition-colors" aria-label="Cerrar">
                <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <!-- Content -->
            <div class="flex-1 overflow-y-auto p-4 sm:p-6" id="practice-generator-content">
              <!-- Form View -->
              <div id="practice-form-view">
                ${this.renderFormView()}
              </div>

              <!-- Loading View -->
              <div id="practice-loading-view" class="hidden">
                ${this.renderLoadingView()}
              </div>

              <!-- Result View -->
              <div id="practice-result-view" class="hidden">
                <!-- Populated dynamically -->
              </div>
            </div>

          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    this.modalElement = document.getElementById('ai-practice-generator-modal');
  }

  /**
   * 🔧 FIX v2.9.380: Usar AIUtils unificado para banner de estado IA
   * Renderiza banner de info cuando no hay IA disponible
   */
  renderAIInfoBanner() {
    const aiUtils = window.aiUtils;
    if (!aiUtils) return '';

    // Usar el banner unificado de AIUtils
    return aiUtils.renderAIStatusBanner({
      showProviderInfo: false,
      customMessage: 'Las prácticas se generarán de forma local. Para prácticas personalizadas con IA:'
    });
  }

  /**
   * Renderiza la vista del formulario
   */
  renderFormView() {
    return `
      ${this.renderAIInfoBanner()}
      <form id="practice-generator-form" class="space-y-6">
        <!-- Estado emocional -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-3">
            ¿Cómo te sientes ahora mismo?
          </label>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2" id="emotional-state-options">
            ${this.emotionalStates.map((state, index) => `
              <label class="emotional-option cursor-pointer">
                <input type="radio" name="emotionalState" value="${state.id}" class="sr-only" ${index === 0 ? 'checked' : ''}>
                <div class="p-3 rounded-xl border-2 border-slate-700 hover:border-violet-500/50 transition-all text-center group state-card">
                  <span class="text-2xl block mb-1 group-hover:scale-110 transition-transform">${state.icon}</span>
                  <span class="text-xs text-gray-400">${state.label}</span>
                </div>
              </label>
            `).join('')}
          </div>
        </div>

        <!-- Duración -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-3">
            ¿Cuánto tiempo tienes? <span id="duration-value" class="text-violet-400">15 minutos</span>
          </label>
          <input type="range" name="duration" min="5" max="60" value="15" step="5"
                 class="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-violet-500"
                 id="duration-slider">
          <div class="flex justify-between text-xs text-gray-500 mt-1">
            <span>5 min</span>
            <span>30 min</span>
            <span>60 min</span>
          </div>
        </div>

        <!-- Tipo de práctica -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-3">
            ¿Qué tipo de práctica prefieres?
          </label>
          <div class="flex flex-wrap gap-2" id="practice-type-options">
            ${this.practiceTypes.map((type, index) => `
              <label class="type-option cursor-pointer">
                <input type="radio" name="practiceType" value="${type.id}" class="sr-only" ${index === 0 ? 'checked' : ''}>
                <div class="px-4 py-2 rounded-xl border-2 border-slate-700 hover:border-violet-500/50 transition-all flex items-center gap-2 type-card">
                  <span class="text-lg">${type.icon}</span>
                  <span class="text-sm text-gray-300">${type.label}</span>
                </div>
              </label>
            `).join('')}
          </div>
        </div>

        <!-- Área de enfoque -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-3">
            ¿En qué área quieres enfocarte?
          </label>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-2" id="focus-area-options">
            ${this.focusAreas.map((area, index) => `
              <label class="focus-option cursor-pointer">
                <input type="radio" name="focusArea" value="${area.id}" class="sr-only" ${index === 0 ? 'checked' : ''}>
                <div class="p-3 rounded-xl border-2 border-slate-700 hover:border-violet-500/50 transition-all text-center focus-card">
                  <span class="text-xl block mb-1">${area.icon}</span>
                  <span class="text-xs text-gray-400">${area.label}</span>
                </div>
              </label>
            `).join('')}
          </div>
        </div>

        <!-- Contexto adicional (opcional) -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">
            ¿Algo más que deba saber? <span class="text-gray-500">(opcional)</span>
          </label>
          <textarea name="context" rows="2"
                    class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-gray-200 placeholder-gray-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none resize-none"
                    placeholder="Ej: Estoy en la oficina, quiero algo sin cerrar los ojos..."></textarea>
        </div>

        <!-- Submit -->
        <button type="submit"
                class="w-full py-4 px-6 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 rounded-xl font-bold text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all flex items-center justify-center gap-2">
          <span class="text-xl">✨</span>
          Generar Mi Práctica
        </button>

        <!-- Historial link -->
        ${this.generatedHistory.length > 0 ? `
          <button type="button" id="show-history-btn"
                  class="w-full py-2 text-sm text-gray-500 hover:text-violet-400 transition-colors">
            Ver historial (${this.generatedHistory.length} prácticas generadas)
          </button>
        ` : ''}
      </form>
    `;
  }

  /**
   * Renderiza la vista de carga
   */
  renderLoadingView() {
    return `
      <div class="flex flex-col items-center justify-center py-12 text-center">
        <div class="relative">
          <div class="w-20 h-20 rounded-full bg-violet-500/20 animate-pulse"></div>
          <div class="absolute inset-0 flex items-center justify-center">
            <span class="text-4xl animate-bounce">✨</span>
          </div>
        </div>
        <h3 class="text-xl font-bold text-white mt-6 mb-2">Creando tu práctica...</h3>
        <p class="text-gray-400 max-w-sm" id="loading-message">
          Combinando sabiduría ancestral con inteligencia artificial
        </p>
        <div class="flex items-center gap-1 mt-4">
          <div class="w-2 h-2 rounded-full bg-violet-500 animate-bounce" style="animation-delay: 0s"></div>
          <div class="w-2 h-2 rounded-full bg-violet-500 animate-bounce" style="animation-delay: 0.2s"></div>
          <div class="w-2 h-2 rounded-full bg-violet-500 animate-bounce" style="animation-delay: 0.4s"></div>
        </div>
      </div>
    `;
  }

  /**
   * Renderiza el resultado de la práctica generada
   */
  renderResultView(practice) {
    const typeIcons = {
      meditation: '🧘',
      reflection: '📝',
      action: '🎯',
      physical: '🌳'
    };

    const difficultyColors = {
      'básico': 'bg-green-500/20 text-green-300 border-green-500/30',
      'intermedio': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      'avanzado': 'bg-red-500/20 text-red-300 border-red-500/30'
    };

    return `
      <div class="practice-result">
        <!-- Header -->
        <div class="text-center mb-6">
          <span class="text-5xl mb-4 block">${typeIcons[practice.type] || '✨'}</span>
          <h3 class="text-2xl font-bold text-white mb-2">${practice.title}</h3>
          <div class="flex items-center justify-center gap-3 text-sm">
            <span class="text-gray-400">${practice.duration}</span>
            <span class="px-2 py-0.5 rounded-full border ${difficultyColors[practice.difficulty] || difficultyColors['intermedio']}">${practice.difficulty}</span>
          </div>
        </div>

        <!-- Intención -->
        <div class="bg-violet-900/20 rounded-xl p-4 mb-6 border border-violet-500/20">
          <h4 class="text-sm font-semibold text-violet-300 mb-2">Intención</h4>
          <p class="text-gray-300">${practice.intention || practice.description}</p>
        </div>

        <!-- Pasos -->
        <div class="mb-6">
          <h4 class="text-sm font-semibold text-gray-400 mb-3">Pasos</h4>
          <div class="space-y-3">
            ${practice.steps.map((step, index) => `
              <div class="flex gap-3 p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
                <div class="flex-shrink-0 w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-400 font-bold text-sm">
                  ${index + 1}
                </div>
                <div class="flex-1">
                  <p class="text-gray-200">${step.text || step}</p>
                  ${step.duration ? `<span class="text-xs text-gray-500 mt-1 block">${step.duration}</span>` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Nota (si es práctica local) -->
        ${practice.note ? `
          <div class="bg-blue-900/20 rounded-xl p-3 mb-4 border border-blue-500/20">
            <p class="text-sm text-blue-300 flex items-center gap-2">
              <span>ℹ️</span>
              ${practice.note}
            </p>
          </div>
        ` : ''}

        <!-- Reflexión -->
        ${practice.reflection ? `
          <div class="bg-amber-900/20 rounded-xl p-4 mb-6 border border-amber-500/20">
            <h4 class="text-sm font-semibold text-amber-300 mb-2">Reflexión Final</h4>
            <p class="text-gray-300 italic">${practice.reflection}</p>
          </div>
        ` : ''}

        <!-- Acciones -->
        <div class="flex flex-wrap gap-3">
          <button id="start-practice-timer" class="flex-1 py-3 px-4 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            Iniciar con Timer
          </button>
          <button id="regenerate-practice" class="py-3 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl font-semibold text-gray-300 transition-all flex items-center justify-center gap-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            Otra
          </button>
        </div>

        <!-- Guardar nota -->
        <div class="mt-6 pt-6 border-t border-slate-700/50">
          <button id="save-practice-btn" class="w-full py-2 text-sm text-gray-500 hover:text-violet-400 transition-colors flex items-center justify-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
            </svg>
            Guardar en favoritos
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Configura los event listeners
   */
  attachEventListeners() {
    // Cerrar modal
    document.getElementById('practice-generator-close')?.addEventListener('click', () => this.close());
    document.getElementById('practice-generator-backdrop')?.addEventListener('click', () => this.close());

    // Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });

    // Form submit
    document.getElementById('practice-generator-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.generatePractice();
    });

    // Duration slider
    const durationSlider = document.getElementById('duration-slider');
    const durationValue = document.getElementById('duration-value');
    if (durationSlider && durationValue) {
      durationSlider.addEventListener('input', (e) => {
        durationValue.textContent = `${e.target.value} minutos`;
      });
    }

    // Radio button styling
    this.setupRadioStyling();

    // 🔧 FIX v2.9.380: Usar AIUtils para eventos del banner de IA
    if (window.aiUtils && this.modalElement) {
      window.aiUtils.attachBannerEvents(this.modalElement, () => this.close());
    }
  }

  /**
   * Configura el estilo de los radio buttons
   */
  setupRadioStyling() {
    const radioContainers = [
      { selector: '.emotional-option input', cardClass: 'state-card' },
      { selector: '.type-option input', cardClass: 'type-card' },
      { selector: '.focus-option input', cardClass: 'focus-card' }
    ];

    radioContainers.forEach(({ selector, cardClass }) => {
      document.querySelectorAll(selector).forEach(radio => {
        radio.addEventListener('change', () => {
          // Remove selected class from siblings
          radio.closest('div[id$="-options"]')?.querySelectorAll(`.${cardClass}`).forEach(card => {
            card.classList.remove('border-violet-500', 'bg-violet-500/10');
            card.classList.add('border-slate-700');
          });

          // Add selected class to current
          if (radio.checked) {
            const card = radio.closest('label')?.querySelector(`.${cardClass}`);
            if (card) {
              card.classList.remove('border-slate-700');
              card.classList.add('border-violet-500', 'bg-violet-500/10');
            }
          }
        });

        // Initial state
        if (radio.checked) {
          radio.dispatchEvent(new Event('change'));
        }
      });
    });
  }

  /**
   * Abre el modal
   */
  open() {
    if (!this.modalElement) {
      this.createModal();
      this.attachEventListeners();
    }

    this.modalElement.classList.remove('hidden');
    this.isOpen = true;
    document.body.style.overflow = 'hidden';

    // Reset to form view
    this.showView('form');

    // Focus trap
    setTimeout(() => {
      document.getElementById('practice-generator-form')?.querySelector('input')?.focus();
    }, 100);
  }

  /**
   * Cierra el modal
   */
  close() {
    if (this.modalElement) {
      this.modalElement.classList.add('hidden');
    }
    this.isOpen = false;
    document.body.style.overflow = '';
  }

  /**
   * Muestra una vista específica
   */
  showView(view) {
    const formView = document.getElementById('practice-form-view');
    const loadingView = document.getElementById('practice-loading-view');
    const resultView = document.getElementById('practice-result-view');

    formView?.classList.add('hidden');
    loadingView?.classList.add('hidden');
    resultView?.classList.add('hidden');

    switch (view) {
      case 'form':
        formView?.classList.remove('hidden');
        break;
      case 'loading':
        loadingView?.classList.remove('hidden');
        break;
      case 'result':
        resultView?.classList.remove('hidden');
        break;
    }
  }

  /**
   * Genera una práctica personalizada
   */
  async generatePractice() {
    if (this.isGenerating) return;

    const form = document.getElementById('practice-generator-form');
    if (!form) return;

    const formData = new FormData(form);
    const userInput = {
      emotionalState: formData.get('emotionalState'),
      duration: parseInt(formData.get('duration')),
      practiceType: formData.get('practiceType'),
      focusArea: formData.get('focusArea'),
      context: formData.get('context') || ''
    };

    this.isGenerating = true;
    this.showView('loading');

    try {
      // Construir el prompt
      const prompt = this.buildPrompt(userInput);
      const systemContext = this.buildSystemContext();

      // Llamar a la IA con timeout
      let response;

      // Helper para timeout
      const withTimeout = (promise, ms) => {
        return Promise.race([
          promise,
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout: La IA tardó demasiado en responder')), ms)
          )
        ]);
      };

      // Detectar si estamos en Capacitor/Android/Cordova
      const isNativeApp = !!(window.Capacitor || window.cordova || document.URL.indexOf('http://') === -1);
      const aiConfig = window.aiConfig?.getConfig?.() || {};
      const currentProvider = aiConfig.provider || 'puter';

      logger.log('[AIPracticeGenerator] Entorno:', {
        isNativeApp,
        currentProvider,
        hasAiAdapter: !!window.aiAdapter,
        hasPuter: !!window.puter?.ai
      });

      // En app nativa: usar fallback local siempre que el proveedor sea Puter
      // porque Puter SDK requiere navegador web real
      if (isNativeApp && (currentProvider === 'puter' || !window.aiAdapter)) {
        logger.warn('[AIPracticeGenerator] App nativa detectada - usando práctica local');
        const practice = this.createFallbackPractice(userInput);
        practice.note = 'Práctica generada localmente. Para IA, configura OpenAI/Gemini en Ajustes > Inteligencia Artificial.';
        this.currentPractice = practice;
        this.savePracticeToHistory(practice);
        this.showResult(practice);
        return;
      }

      if (window.aiAdapter && currentProvider !== 'puter') {
        // Usar aiAdapter solo si NO es Puter
        response = await withTimeout(
          window.aiAdapter.ask(prompt, systemContext, [], 'practice-generator'),
          30000
        );
      } else if (window.puter?.ai && !isNativeApp) {
        // Puter SOLO en navegador web real
        try {
          const result = await withTimeout(
            window.puter.ai.chat(prompt, { system: systemContext }),
            30000
          );
          response = result?.message?.content || result;
        } catch (puterError) {
          logger.error('[AIPracticeGenerator] Error con Puter:', puterError);
          // En vez de error, usar fallback
          const practice = this.createFallbackPractice(userInput);
          practice.note = 'No se pudo conectar con IA. Práctica generada localmente.';
          this.currentPractice = practice;
          this.savePracticeToHistory(practice);
          this.showResult(practice);
          return;
        }
      } else {
        // Fallback para cualquier otro caso
        const practice = this.createFallbackPractice(userInput);
        practice.note = 'Configura un proveedor de IA en Ajustes para prácticas personalizadas.';
        this.currentPractice = practice;
        this.savePracticeToHistory(practice);
        this.showResult(practice);
        return;
      }

      // Parsear la respuesta
      const practice = this.parseAIResponse(response, userInput);

      if (practice) {
        this.currentPractice = practice;
        this.savePracticeToHistory(practice);
        this.showResult(practice);
      } else {
        throw new Error('No se pudo generar la práctica');
      }

    } catch (error) {
      logger.error('[AIPracticeGenerator] Error generando práctica:', error);
      this.showError(error.message);
    } finally {
      this.isGenerating = false;
    }
  }

  /**
   * Construye el prompt para la IA
   */
  buildPrompt(userInput) {
    const stateInfo = this.emotionalStates.find(s => s.id === userInput.emotionalState);
    const typeInfo = this.practiceTypes.find(t => t.id === userInput.practiceType);
    const focusInfo = this.focusAreas.find(f => f.id === userInput.focusArea);

    return `
Crea una práctica personalizada con estos parámetros:

ESTADO EMOCIONAL: ${stateInfo?.label || userInput.emotionalState} (${stateInfo?.description || ''})
TIEMPO DISPONIBLE: ${userInput.duration} minutos
TIPO DE PRÁCTICA: ${typeInfo?.label || userInput.practiceType} (${typeInfo?.description || ''})
ÁREA DE ENFOQUE: ${focusInfo?.label || userInput.focusArea}
${userInput.context ? `CONTEXTO ADICIONAL: ${userInput.context}` : ''}

Responde SOLO con un JSON válido (sin markdown, sin explicaciones) con esta estructura exacta:
{
  "title": "Título creativo y evocador",
  "description": "1-2 frases sobre el propósito",
  "type": "${userInput.practiceType === 'surprise' ? 'meditation' : userInput.practiceType}",
  "duration": "${userInput.duration} min",
  "difficulty": "básico|intermedio|avanzado",
  "intention": "La intención profunda de esta práctica",
  "steps": [
    { "text": "Instrucción del paso 1", "duration": "X min" },
    { "text": "Instrucción del paso 2", "duration": "X min" }
  ],
  "reflection": "Pregunta de reflexión para cerrar"
}

REGLAS:
- Los pasos deben sumar aproximadamente ${userInput.duration} minutos
- Adapta el tono al estado emocional (${stateInfo?.label})
- Incluye 3-6 pasos claros y realizables
- La práctica debe ser viable sin materiales especiales
- Sé específico en las instrucciones
`;
  }

  /**
   * Construye el contexto del sistema
   */
  buildSystemContext() {
    return `Eres un guía experto en prácticas contemplativas, meditación, activismo consciente y transformación personal del proyecto "Colección Nuevo Ser".

Tu tarea es crear prácticas personalizadas únicas que:
- Integren sabiduría ancestral con enfoques contemporáneos
- Sean concretas, realizables y transformadoras
- Conecten lo personal con lo colectivo
- Respeten el tiempo y estado emocional del usuario

Principios del Nuevo Ser que deben informar cada práctica:
1. Interdependencia: Todo está conectado
2. Reconexión: De la separación al vínculo
3. Suficiencia: Más allá del crecimiento infinito
4. Valor intrínseco: Todo ser tiene valor en sí mismo
5. Acción consciente: La práctica transforma

IMPORTANTE: Responde SIEMPRE con JSON válido, sin markdown ni texto adicional.`;
  }

  /**
   * Parsea la respuesta de la IA
   */
  parseAIResponse(response, userInput) {
    try {
      // Intentar extraer JSON de la respuesta
      let jsonStr = response;

      // Si viene envuelto en markdown code blocks
      const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }

      // Limpiar posibles caracteres problemáticos
      jsonStr = jsonStr.trim();

      const practice = JSON.parse(jsonStr);

      // Validar estructura mínima
      if (!practice.title || !practice.steps || !Array.isArray(practice.steps)) {
        throw new Error('Estructura de práctica inválida');
      }

      // Añadir metadatos
      practice.id = `gen_${Date.now()}`;
      practice.generatedAt = new Date().toISOString();
      practice.userInput = userInput;

      return practice;

    } catch (error) {
      logger.error('[AIPracticeGenerator] Error parseando respuesta:', error);
      logger.log('Respuesta raw:', response);

      // Intentar crear una práctica de fallback
      return this.createFallbackPractice(userInput);
    }
  }

  /**
   * Crea una práctica de fallback si el parsing falla
   */
  createFallbackPractice(userInput) {
    const typeInfo = this.practiceTypes.find(t => t.id === userInput.practiceType);

    return {
      id: `gen_${Date.now()}`,
      title: `Práctica de ${typeInfo?.label || 'Mindfulness'}`,
      description: 'Una práctica sencilla para reconectar contigo mismo/a',
      type: userInput.practiceType === 'surprise' ? 'meditation' : userInput.practiceType,
      duration: `${userInput.duration} min`,
      difficulty: 'básico',
      intention: 'Crear un espacio de calma y presencia en tu día',
      steps: [
        { text: 'Encuentra un lugar cómodo donde no te interrumpan. Siéntate con la espalda erguida pero relajada.', duration: '1 min' },
        { text: 'Cierra los ojos y toma tres respiraciones profundas. Con cada exhalación, suelta cualquier tensión.', duration: '2 min' },
        { text: `Dedica los próximos ${Math.floor(userInput.duration * 0.6)} minutos a observar tu respiración natural, sin cambiarla. Cuando tu mente divague, gentilmente vuelve a la respiración.`, duration: `${Math.floor(userInput.duration * 0.6)} min` },
        { text: 'Antes de abrir los ojos, pregúntate: ¿Qué quiero llevar conmigo de este momento de quietud?', duration: '2 min' }
      ],
      reflection: '¿Qué descubrí sobre mi estado interior durante esta práctica?',
      generatedAt: new Date().toISOString(),
      userInput: userInput,
      isFallback: true
    };
  }

  /**
   * Muestra el resultado
   */
  showResult(practice) {
    const resultView = document.getElementById('practice-result-view');
    if (resultView) {
      resultView.innerHTML = this.renderResultView(practice);
    }
    this.showView('result');

    // Attach result event listeners
    document.getElementById('start-practice-timer')?.addEventListener('click', () => this.startTimer());
    document.getElementById('regenerate-practice')?.addEventListener('click', () => {
      this.showView('form');
      // Re-attach form listeners
      this.attachEventListeners();
    });
    document.getElementById('save-practice-btn')?.addEventListener('click', () => this.saveFavorite());
  }

  /**
   * Muestra un error
   */
  showError(message) {
    const resultView = document.getElementById('practice-result-view');
    if (resultView) {
      resultView.innerHTML = `
        <div class="text-center py-8">
          <span class="text-4xl mb-4 block">😕</span>
          <h3 class="text-xl font-bold text-white mb-2">Algo salió mal</h3>
          <p class="text-gray-400 mb-6">${message}</p>
          <button id="retry-generation" class="px-6 py-3 bg-violet-600 hover:bg-violet-500 rounded-xl font-semibold text-white transition-all">
            Intentar de nuevo
          </button>
        </div>
      `;
    }
    this.showView('result');

    document.getElementById('retry-generation')?.addEventListener('click', () => {
      this.showView('form');
    });
  }

  /**
   * Guarda la práctica en el historial
   */
  savePracticeToHistory(practice) {
    this.generatedHistory.push({
      ...practice,
      savedAt: new Date().toISOString()
    });
    this.saveHistory();
  }

  /**
   * Guarda la práctica actual en favoritos
   */
  saveFavorite() {
    if (!this.currentPractice) return;

    try {
      const favorites = JSON.parse(localStorage.getItem('favorite-practices') || '[]');
      favorites.push({
        ...this.currentPractice,
        favoritedAt: new Date().toISOString()
      });
      localStorage.setItem('favorite-practices', JSON.stringify(favorites));

      // Mostrar feedback
      if (window.toast) {
        window.toast.show('⭐ Práctica guardada en favoritos', 'success', 2000);
      }

      // Cambiar botón
      const btn = document.getElementById('save-practice-btn');
      if (btn) {
        btn.innerHTML = `
          <svg class="w-4 h-4" fill="currentColor" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
          </svg>
          Guardada
        `;
        btn.classList.add('text-violet-400');
        btn.disabled = true;
      }

    } catch (error) {
      logger.error('[AIPracticeGenerator] Error guardando favorito:', error);
    }
  }

  /**
   * Inicia el timer para la práctica
   */
  startTimer() {
    if (!this.currentPractice) return;

    // Verificar si existe el PracticeTimer
    if (window.practiceTimer) {
      window.practiceTimer.start(this.currentPractice);
      this.close();
    } else {
      // Fallback: mostrar práctica en modo simple
      if (window.toast) {
        window.toast.show('Timer no disponible. Sigue los pasos manualmente.', 'info', 3000);
      }
    }
  }

  /**
   * Obtiene el historial de prácticas generadas
   */
  getHistory() {
    return this.generatedHistory;
  }

  /**
   * Limpia el historial
   */
  clearHistory() {
    this.generatedHistory = [];
    localStorage.removeItem('ai-generated-practices');
  }
}

// Exportar para uso global
window.AIPracticeGenerator = AIPracticeGenerator;

// Auto-inicializar si el DOM está listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.aiPracticeGenerator = new AIPracticeGenerator();
    window.aiPracticeGenerator.init();
  });
} else {
  window.aiPracticeGenerator = new AIPracticeGenerator();
  window.aiPracticeGenerator.init();
}
