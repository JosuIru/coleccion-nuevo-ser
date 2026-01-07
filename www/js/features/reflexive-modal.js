// ============================================================================
// REFLEXIVE MODAL - Modal de Preguntas Reflexivas al terminar capítulo
// ============================================================================

// 🔧 FIX v2.9.198: Migrated console.log to logger
class ReflexiveModal {
  constructor(bookEngine) {
    this.bookEngine = bookEngine;
    this.i18n = window.i18n || { t: (key) => key };
    this.isOpen = false;
    this.currentQuestion = null;
  }

  // ==========================================================================
  // MOSTRAR PREGUNTA
  // ==========================================================================

  show(bookId, chapterId) {
    // Obtener pregunta aleatoria para este capítulo
    const question = window.getRandomQuestion?.(bookId, chapterId);

    if (!question) {
      // logger.debug('No hay preguntas reflexivas para este capítulo');
      return;
    }

    this.currentQuestion = question;
    this.currentBookId = bookId;
    this.currentChapterId = chapterId;
    this.isOpen = true;

    this.render();
    this.attachEventListeners();
  }

  // ==========================================================================
  // RENDERIZADO
  // ==========================================================================

  render() {
    // Eliminar modal existente
    const existing = document.getElementById('reflexive-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'reflexive-modal';
    modal.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[10000] p-4';
    modal.style.animation = 'fadeIn 0.3s ease-out';

    modal.innerHTML = `
      <div class="bg-gradient-to-br from-purple-900/95 to-indigo-900/95 rounded-2xl shadow-2xl max-w-lg w-full border border-purple-500/30 overflow-hidden">
        <!-- Header -->
        <div class="bg-purple-800/50 px-6 py-4 border-b border-purple-500/30">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <span class="text-3xl">✨</span>
              <h2 class="text-xl font-bold text-purple-200">Momento de Reflexión</h2>
            </div>
            <button id="close-reflexive-modal"
                    class="text-purple-300 hover:text-white p-3 hover:bg-purple-700/50 rounded-lg transition"
                    aria-label="Cerrar momento de reflexión"
                    title="Cerrar">
              ${Icons.close(20)}
            </button>
          </div>
        </div>

        <!-- Question -->
        <div class="p-6">
          <p class="text-lg text-purple-100 italic leading-relaxed mb-6 text-center">
            "${this.currentQuestion}"
          </p>

          <!-- Textarea para reflexión -->
          <textarea
            id="reflexion-input"
            placeholder="Tómate un momento para reflexionar... (opcional)"
            rows="4"
            class="w-full px-4 py-3 bg-purple-950/50 border border-purple-500/30 rounded-xl text-purple-100 placeholder-purple-400 focus:border-purple-400 focus:outline-none resize-none"
          ></textarea>

          <!-- Stats de reflexiones guardadas -->
          ${this.renderStats()}
        </div>

        <!-- Actions -->
        <div class="px-6 pb-6 flex flex-col gap-3">
          <div class="flex gap-3">
            <button id="save-reflexion-btn" class="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-500 rounded-xl font-semibold transition flex items-center justify-center gap-2">
              ${Icons.bookmark(18)}
              <span>Guardar privado</span>
            </button>
            <button id="skip-reflexion-btn" class="px-4 py-3 bg-purple-800/50 hover:bg-purple-700/50 border border-purple-500/30 rounded-xl font-semibold transition">
              Continuar
            </button>
          </div>

          <!-- Opción de no mostrar más -->
          <label class="flex items-center gap-2 text-sm text-purple-400 cursor-pointer hover:text-purple-300 transition">
            <input type="checkbox" id="disable-reflexions-checkbox" class="rounded border-purple-500 bg-purple-900">
            <span>No mostrar preguntas reflexivas</span>
          </label>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  }

  renderStats() {
    const savedCount = this.getSavedReflexionsCount();

    if (savedCount === 0) return '';

    return `
      <div class="mt-4 text-center text-sm text-purple-400">
        <span class="inline-flex items-center gap-1">
          ${Icons.note(14)}
          ${savedCount} reflexiones guardadas
        </span>
      </div>
    `;
  }

  // ==========================================================================
  // EVENT LISTENERS
  // ==========================================================================

  attachEventListeners() {
    // Close button
    const closeBtn = document.getElementById('close-reflexive-modal');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }

    // Click outside modal
    const modal = document.getElementById('reflexive-modal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.close();
      });
    }

    // ESC key
    this.escHandler = (e) => {
      if (e.key === 'Escape' && this.isOpen) this.close();
    };
    document.addEventListener('keydown', this.escHandler);

    // Save button
    const saveBtn = document.getElementById('save-reflexion-btn');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => this.saveReflexion());
    }

    // Skip button
    const skipBtn = document.getElementById('skip-reflexion-btn');
    if (skipBtn) {
      skipBtn.addEventListener('click', () => this.close());
    }

    // Disable checkbox
    const disableCheckbox = document.getElementById('disable-reflexions-checkbox');
    if (disableCheckbox) {
      disableCheckbox.addEventListener('change', (e) => {
        this.setReflexionsDisabled(e.target.checked);
      });
    }
  }

  // ==========================================================================
  // LÓGICA
  // ==========================================================================

  saveReflexion() {
    const input = document.getElementById('reflexion-input');
    const content = input?.value?.trim();

    if (!content) {
      window.toast?.info('Escribe algo para guardar tu reflexión');
      return;
    }

    // Guardar en localStorage
    const key = `reflexion-${this.currentBookId}-${this.currentChapterId}-${Date.now()}`;
    const reflexion = {
      question: this.currentQuestion,
      answer: content,
      bookId: this.currentBookId,
      chapterId: this.currentChapterId,
      timestamp: new Date().toISOString()
    };

    // Guardar en estructura unificada
    try {
      const allReflexions = JSON.parse(localStorage.getItem('user-reflections') || '{}');
      allReflexions[key] = reflexion;
      localStorage.setItem('user-reflections', JSON.stringify(allReflexions));
    } catch {
      localStorage.setItem(key, JSON.stringify(reflexion));
    }

    // Track para logros
    if (window.achievementSystem) {
      window.achievementSystem.trackReflexionSaved();
    }

    // Sincronizar a la nube si está autenticado
    if (window.supabaseSyncHelper && window.supabaseAuthHelper?.isAuthenticated()) {
      window.supabaseSyncHelper.migrateReflections().catch(err => {
        logger.error('Error sincronizando reflexión:', err);
      });
    }

    // Mostrar confirmación
    window.toast?.success('Reflexión guardada');

    // Cerrar modal
    this.close();
  }

  getSavedReflexionsCount() {
    try {
      const allReflexions = JSON.parse(localStorage.getItem('user-reflections') || '{}');
      return Object.keys(allReflexions).length;
    } catch {
      // Fallback: contar claves individuales (legacy)
      let count = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('reflexion-')) {
          count++;
        }
      }
      return count;
    }
  }

  setReflexionsDisabled(disabled) {
    localStorage.setItem('reflexions-disabled', disabled ? 'true' : 'false');
    if (disabled) {
      window.toast?.info('Preguntas reflexivas desactivadas');
    }
  }

  isReflexionsDisabled() {
    return localStorage.getItem('reflexions-disabled') === 'true';
  }

  // ==========================================================================
  // CERRAR
  // ==========================================================================

  close() {
    const modal = document.getElementById('reflexive-modal');
    if (modal) {
      modal.style.animation = 'fadeOut 0.2s ease-out';
      setTimeout(() => modal.remove(), 200);
    }

    if (this.escHandler) {
      document.removeEventListener('keydown', this.escHandler);
    }

    this.isOpen = false;
  }

  // ==========================================================================
  // TRIGGER AL TERMINAR CAPÍTULO
  // ==========================================================================

  static shouldShowForChapter(bookId, chapterId) {
    // No mostrar si está desactivado
    if (localStorage.getItem('reflexions-disabled') === 'true') {
      return false;
    }

    // Verificar si hay preguntas para este capítulo
    const hasQuestions = window.REFLEXIVE_QUESTIONS?.[bookId]?.[chapterId]?.length > 0;

    // No mostrar si ya se mostró recientemente (evitar spam)
    const lastShownKey = `reflexion-shown-${bookId}-${chapterId}`;
    const lastShown = localStorage.getItem(lastShownKey);
    const now = Date.now();

    if (lastShown && (now - parseInt(lastShown)) < 24 * 60 * 60 * 1000) {
      // Menos de 24 horas desde la última vez
      return false;
    }

    return hasQuestions;
  }

  static markAsShown(bookId, chapterId) {
    const key = `reflexion-shown-${bookId}-${chapterId}`;
    localStorage.setItem(key, Date.now().toString());
  }
}

// Exportar
window.ReflexiveModal = ReflexiveModal;
