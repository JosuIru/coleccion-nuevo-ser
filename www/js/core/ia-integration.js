/**
// 🔧 FIX v2.9.198: Migrated console.log to logger
 * IA INTEGRATION - Sistema Integrado de IA Premium
 * Conecta AI Features con UI existente
 *
 * @version 1.0.0
 */

class IAIntegration {
  constructor() {
    this.bookReader = null;
    this.aiBookFeatures = window.aiBookFeatures;
    this.aiGameMaster = window.aiGameMaster;
    this.aiPremium = window.aiPremium;
    this.authHelper = window.authHelper;
    this.initialized = false;
  }

  /**
   * Inicializar integración con UI
   */
  async init() {
    logger.debug('🔌 IAIntegration iniciando...');

    // Esperar a que aiBookFeatures esté disponible
    if (!window.aiBookFeatures) {
      logger.debug('⏳ Esperando aiBookFeatures...');
      setTimeout(() => this.init(), 500);
      return;
    }

    // Esperar a que elementos del DOM estén listos
    if (!document.getElementById('book-reader-view')) {
      setTimeout(() => this.init(), 500);
      return;
    }

    await this.setupBookReaderIntegration();
    await this.setupFrankensteinIntegration();
    await this.setupCreditsWidget();

    this.initialized = true;
    logger.debug('✅ IAIntegration inicializado completamente');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // INTEGRACIÓN BOOK READER
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Integrar IA con el lector de libros
   */
  async setupBookReaderIntegration() {
    logger.debug('📚 Configurando integración con Book Reader...');

    // Escuchar cambios en el capítulo actual
    if (window.bookEngine) {
      window.bookEngine.onChapterChange?.((chapter) => {
        this.currentChapter = chapter;
        this.updateIAButtonStates();
      });
    }

    // Attachear listeners a botones existentes
    this.attachBookReaderListeners();

    logger.debug('✅ Book Reader integrado');
  }

  attachBookReaderListeners() {
    // Chat buttons
    const chatBtns = [
      document.getElementById('ai-chat-btn'),
      document.getElementById('ai-chat-btn-mobile'),
      document.getElementById('ai-chat-btn-tablet')
    ].filter(Boolean);

    chatBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.handleChatAboutBook();
      });
    });

    // Agregar botones adicionales de IA al dropdown (si existe)
    this.addIAFeaturesToDropdown();
  }

  /**
   * Agregar botones de IA al dropdown de más opciones
   */
  addIAFeaturesToDropdown() {
    const dropdownSelector = [
      '#more-actions-dropdown'
    ];

    dropdownSelector.forEach(selector => {
      const dropdown = document.querySelector(selector);
      if (!dropdown) return;

      // Buscar línea divisoria y agregar antes
      const lastDivider = dropdown.querySelector('div.border-t:last-of-type');

      // Crear sección de IA Features
      const iaSection = document.createElement('div');
      iaSection.className = 'px-3 py-1.5 text-xs text-gray-500 uppercase tracking-wide border-t border-gray-700 mt-1';
      iaSection.textContent = '✨ IA Premium';

      // Botones de IA
      const quizBtn = document.createElement('button');
      quizBtn.className = 'w-full text-left px-4 py-2 hover:bg-purple-900/30 flex items-center gap-3 text-purple-400 font-semibold';
      quizBtn.innerHTML = '📝 <span>Generar Quiz</span>';
      quizBtn.onclick = (e) => {
        e.preventDefault();
        this.handleGenerateQuiz();
      };

      const summaryBtn = document.createElement('button');
      summaryBtn.className = 'w-full text-left px-4 py-2 hover:bg-purple-900/30 flex items-center gap-3 text-purple-400 font-semibold';
      summaryBtn.innerHTML = '📖 <span>Resumen IA</span>';
      summaryBtn.onclick = (e) => {
        e.preventDefault();
        this.handleSummary();
      };

      const exercisesBtn = document.createElement('button');
      exercisesBtn.className = 'w-full text-left px-4 py-2 hover:bg-purple-900/30 flex items-center gap-3 text-purple-400 font-semibold';
      exercisesBtn.innerHTML = '💪 <span>Ejercicios Personalizados</span>';
      exercisesBtn.onclick = (e) => {
        e.preventDefault();
        this.handleExercises();
      };

      // Insertar antes de la última sección
      if (lastDivider) {
        lastDivider.parentNode.insertBefore(iaSection, lastDivider);
        lastDivider.parentNode.insertBefore(quizBtn, lastDivider);
        lastDivider.parentNode.insertBefore(summaryBtn, lastDivider);
        lastDivider.parentNode.insertBefore(exercisesBtn, lastDivider);
      }
    });
  }

  /**
   * Actualizar estado de botones según disponibilidad de créditos
   */
  updateIAButtonStates() {
    const hasAccess = this.aiPremium?.hasFeature('ai_chat');
    const buttons = document.querySelectorAll('[id*="ai-"]');

    buttons.forEach(btn => {
      if (!hasAccess && btn.id.includes('chat')) {
        btn.style.opacity = '0.5';
        btn.title += ' (requiere Premium)';
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HANDLERS DE FEATURES IA - LIBROS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Chat sobre el libro actual
   */
  async handleChatAboutBook() {
    // Verificar acceso
    if (!this.aiPremium?.hasFeature('ai_chat')) {
      this.aiGameMaster?.showUpgradeIfNeeded('ai_chat');
      return;
    }

    const chapter = window.bookEngine?.currentChapter;
    if (!chapter) {
      this.showNotification('Selecciona un capítulo primero', 'warning');
      return;
    }

    // Mostrar modal de chat
    this.showChatModal(chapter);
  }

  /**
   * Generar quiz personalizado
   */
  async handleGenerateQuiz() {
    if (!this.aiPremium?.hasFeature('ai_tutor')) {
      this.aiGameMaster?.showUpgradeIfNeeded('ai_tutor');
      return;
    }

    const chapter = window.bookEngine?.currentChapter;
    if (!chapter) {
      this.showNotification('Selecciona un capítulo primero', 'warning');
      return;
    }

    this.showProcessing('Generando quiz personalizado...');

    try {
      const result = await this.aiBookFeatures.generatePersonalizedQuiz(
        {
          title: chapter.title,
          content: chapter.content,
          id: chapter.id
        }
      );

      if (result.success) {
        this.showQuizModal(result.quiz, chapter.id);
      } else {
        this.showNotification(`Error: ${result.error}`, 'error');
      }
    } catch (error) {
      logger.error('Error generando quiz:', error);
      this.showNotification('No se pudo generar el quiz', 'error');
    } finally {
      this.hideProcessing();
    }
  }

  /**
   * Generar resumen del capítulo
   */
  async handleSummary() {
    if (!this.aiPremium?.hasFeature('ai_tutor')) {
      this.aiGameMaster?.showUpgradeIfNeeded('ai_tutor');
      return;
    }

    const chapter = window.bookEngine?.currentChapter;
    if (!chapter) {
      this.showNotification('Selecciona un capítulo primero', 'warning');
      return;
    }

    this.showProcessing('Generando resumen...');

    try {
      const result = await this.aiBookFeatures.generateChapterSummary(
        {
          title: chapter.title,
          content: chapter.content
        },
        'medium'
      );

      if (result.success) {
        this.showSummaryModal(result.summary, chapter.title);
      } else {
        this.showNotification(`Error: ${result.error}`, 'error');
      }
    } catch (error) {
      logger.error('Error generando resumen:', error);
      this.showNotification('No se pudo generar el resumen', 'error');
    } finally {
      this.hideProcessing();
    }
  }

  /**
   * Generar ejercicios personalizados
   */
  async handleExercises() {
    if (!this.aiPremium?.hasFeature('ai_tutor')) {
      this.aiGameMaster?.showUpgradeIfNeeded('ai_tutor');
      return;
    }

    const chapter = window.bookEngine?.currentChapter;
    if (!chapter) {
      this.showNotification('Selecciona un capítulo primero', 'warning');
      return;
    }

    this.showProcessing('Generando ejercicios personalizados...');

    try {
      const result = await this.aiBookFeatures.generatePersonalizedExercises(
        {
          title: chapter.title,
          content: chapter.content
        },
        [] // weak areas
      );

      if (result.success) {
        this.showExercisesModal(result.exercises, chapter.title);
      } else {
        this.showNotification(`Error: ${result.error}`, 'error');
      }
    } catch (error) {
      logger.error('Error generando ejercicios:', error);
      this.showNotification('No se pudieron generar los ejercicios', 'error');
    } finally {
      this.hideProcessing();
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // INTEGRACIÓN FRANKENSTEIN LAB
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Integrar Game Master IA en Frankenstein Lab
   */
  async setupFrankensteinIntegration() {
    logger.debug('🎮 Configurando integración con Frankenstein Lab...');

    // Esperar a que Frankenstein esté inicializado
    if (!window.FrankensteinLabUI) {
      setTimeout(() => this.setupFrankensteinIntegration(), 500);
      return;
    }

    // Escuchar cuando el Lab se abre
    this.attachGameMasterButton();

    logger.debug('✅ Frankenstein Lab integrado');
  }

  /**
   * Agregar botón de Game Master al menú principal
   */
  attachGameMasterButton() {
    // Esperar a que el UI del lab esté renderizado
    const waitForLabUI = setInterval(() => {
      const labContainer = document.getElementById('frankenstein-lab-view');

      if (labContainer && !document.getElementById('game-master-menu-item')) {
        clearInterval(waitForLabUI);

        // Buscar el menú principal
        const menu = labContainer.querySelector('.game-menu, .menu, [class*="menu"]');

        if (menu) {
          this.injectGameMasterMenuItem(menu);
        }
      }
    }, 500);

    // Timeout después de 10 segundos
    setTimeout(() => clearInterval(waitForLabUI), 10000);
  }

  /**
   * Inyectar item de Game Master en el menú
   */
  injectGameMasterMenuItem(menu) {
    const gameMasterItem = document.createElement('div');
    gameMasterItem.id = 'game-master-menu-item';
    gameMasterItem.className = 'menu-item-ia-premium';
    gameMasterItem.innerHTML = `
      <button class="game-master-btn" title="Game Master IA (Función Pro)">
        <span class="menu-icon">🎮</span>
        <span class="menu-label">Game Master IA</span>
        <span class="pro-badge">PRO</span>
      </button>
    `;

    gameMasterItem.querySelector('.game-master-btn').addEventListener('click', () => {
      this.handleGameMaster();
    });

    // Agregar al menú
    menu.appendChild(gameMasterItem);
  }

  /**
   * Handler para Game Master IA
   */
  async handleGameMaster() {
    // Verificar acceso
    if (!this.aiGameMaster?.canUseGameMaster()) {
      this.aiGameMaster?.showUpgradeIfNeeded('ai_game_master');
      return;
    }

    // Mostrar opciones del Game Master
    this.showGameMasterModal();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // WIDGET DE CRÉDITOS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Configurar y posicionar widget de créditos
   */
  async setupCreditsWidget() {
    logger.debug('💰 Configurando widget de créditos...');

    // Escuchar cambios de autenticación
    if (this.authHelper) {
      this.authHelper.onAuthStateChange?.((event, user) => {
        if (event === 'signed_in') {
          this.insertCreditsWidget();
        } else {
          this.removeCreditsWidget();
        }
      });
    }

    // Si ya está autenticado, insertar widget
    if (this.authHelper?.getUser?.()) {
      this.insertCreditsWidget();
    }

    logger.debug('✅ Widget de créditos configurado');
  }

  /**
   * Insertar widget en la página
   */
  insertCreditsWidget() {
    // No insertar si ya existe
    if (document.getElementById('ai-credits-widget-container')) {
      return;
    }

    const widget = this.aiPremium?.createCreditsWidget?.();
    if (!widget) return;

    // Buscar lugar para insertar (header, navbar, sidebar)
    const header = document.querySelector('.header, [class*="header"], nav[class*="nav"]');

    if (header) {
      const container = document.createElement('div');
      container.id = 'ai-credits-widget-container';
      container.style.cssText = 'position: absolute; right: 2rem; top: 1rem; z-index: 100;';
      container.appendChild(widget);

      // Hacer que el header sea relativo si no lo es
      if (getComputedStyle(header).position === 'static') {
        header.style.position = 'relative';
      }

      header.appendChild(container);

      logger.debug('✅ Widget de créditos insertado');
    }
  }

  removeCreditsWidget() {
    const container = document.getElementById('ai-credits-widget-container');
    container?.remove();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MODALES UI
  // ═══════════════════════════════════════════════════════════════════════════

  showChatModal(chapter) {
    const modal = document.createElement('div');
    modal.className = 'upgrade-prompt-modal fade-in';
    modal.innerHTML = `
      <div class="upgrade-overlay" onclick="this.parentElement.remove()"></div>
      <div class="upgrade-content" style="max-width: 600px;">
        <div style="text-align: left;">
          <h2 style="color: #8b5cf6; margin-bottom: 1rem;">💬 Chat sobre "${chapter.title}"</h2>
          <div style="margin-bottom: 1rem;">
            <textarea
              id="user-question"
              placeholder="¿Cuál es el tema principal del capítulo? ¿Qué elementos destacan?"
              style="
                width: 100%;
                padding: 0.75rem;
                background: rgba(139, 92, 246, 0.05);
                border: 1px solid rgba(139, 92, 246, 0.2);
                border-radius: 8px;
                color: #e5e7eb;
                min-height: 100px;
                font-family: inherit;
                resize: vertical;
              "
            ></textarea>
          </div>
          <div style="display: flex; gap: 0.75rem;">
            <button
              class="ai-feature-btn"
              style="flex: 1;"
              onclick="window.iaIntegration.submitChatQuestion(this.parentElement.parentElement.parentElement.parentElement, '${chapter.id}')"
            >
              📤 Enviar
            </button>
            <button
              style="flex: 1; padding: 0.75rem; background: rgba(139, 92, 246, 0.1); border: 1px solid rgba(139, 92, 246, 0.2); border-radius: 8px; color: #9ca3af; cursor: pointer;"
              onclick="this.closest('.upgrade-prompt-modal').remove()"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  }

  async submitChatQuestion(modalEl, chapterId) {
    const textarea = modalEl.querySelector('textarea');
    const question = textarea?.value?.trim();

    if (!question) {
      this.showNotification('Escribe una pregunta', 'warning');
      return;
    }

    const chapter = window.bookEngine?.getChapterById(chapterId);
    if (!chapter) return;

    this.showProcessing('Analizando capítulo...');

    try {
      const result = await this.aiBookFeatures.chatAboutBook(
        chapter.content,
        chapter.title,
        question
      );

      if (result.success) {
        this.showResponseCard('Chat IA', result.response, modalEl);
      } else {
        this.showNotification(`Error: ${result.error}`, 'error');
      }
    } catch (error) {
      logger.error('Error:', error);
      this.showNotification('Error al procesar la pregunta', 'error');
    } finally {
      this.hideProcessing();
    }
  }

  showQuizModal(quiz, chapterId) {
    const modal = document.createElement('div');
    modal.className = 'ai-response-card';
    modal.innerHTML = `
      <div class="ai-response-header">
        <span class="ai-response-icon">📝</span>
        <span class="ai-response-title">${quiz.title || 'Quiz Personalizado'}</span>
        <span style="color: #9ca3af; margin-left: auto;">${quiz.difficulty}</span>
      </div>
      <div class="ai-response-content">
        ${quiz.questions?.map((q, i) => `
          <div style="margin-bottom: 1.5rem;">
            <p style="font-weight: 600; margin-bottom: 0.75rem;"><strong>Pregunta ${i + 1}:</strong> ${q.question}</p>
            <div style="margin-left: 1rem; display: flex; flex-direction: column; gap: 0.5rem;">
              ${q.options?.map((opt, j) => `
                <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; color: #e5e7eb;">
                  <input type="radio" name="q${i}" value="${j}" style="cursor: pointer;">
                  ${opt}
                </label>
              `).join('')}
            </div>
            <p style="font-size: 0.85rem; color: #9ca3af; margin-top: 0.75rem; font-style: italic;">
              ${q.explanation}
            </p>
          </div>
        `).join('')}
      </div>
      <div class="ai-response-actions">
        <button class="ai-response-action" onclick="this.closest('.ai-response-card').remove()">
          ✓ Completado
        </button>
      </div>
    `;

    document.querySelector('.chapter-content')?.appendChild(modal);
    this.showNotification('Quiz generado correctamente', 'success');
  }

  showSummaryModal(summary, chapterTitle) {
    const modal = document.createElement('div');
    modal.className = 'ai-response-card';
    modal.innerHTML = `
      <div class="ai-response-header">
        <span class="ai-response-icon">📖</span>
        <span class="ai-response-title">Resumen: ${chapterTitle}</span>
      </div>
      <div class="ai-response-content">
        ${summary}
      </div>
      <div class="ai-response-actions">
        <button class="ai-response-action" onclick="navigator.clipboard.writeText('${summary.replace(/'/g, "\\'")}'); this.textContent = '✓ Copiado'">
          📋 Copiar
        </button>
        <button class="ai-response-action" onclick="this.closest('.ai-response-card').remove()">
          ✓ Cerrar
        </button>
      </div>
    `;

    document.querySelector('.chapter-content')?.appendChild(modal);
    this.showNotification('Resumen generado', 'success');
  }

  showExercisesModal(exercises, chapterTitle) {
    const modal = document.createElement('div');
    modal.className = 'ai-response-card';
    modal.innerHTML = `
      <div class="ai-response-header">
        <span class="ai-response-icon">💪</span>
        <span class="ai-response-title">Ejercicios: ${chapterTitle}</span>
      </div>
      <div class="ai-response-content">
        ${exercises?.map((ex, i) => `
          <div style="margin-bottom: 1.5rem; padding: 1rem; background: rgba(139, 92, 246, 0.05); border-left: 3px solid #8b5cf6; border-radius: 4px;">
            <p style="font-weight: 700; color: #8b5cf6; margin-bottom: 0.5rem;">Ejercicio ${i + 1}: ${ex.title}</p>
            <p style="margin-bottom: 0.75rem;">${ex.description}</p>
            <ol style="margin-left: 1rem; color: #9ca3af;">
              ${ex.steps?.map(step => `<li>${step}</li>`).join('')}
            </ol>
          </div>
        `).join('')}
      </div>
      <div class="ai-response-actions">
        <button class="ai-response-action" onclick="this.closest('.ai-response-card').remove()">
          ✓ Cerrar
        </button>
      </div>
    `;

    document.querySelector('.chapter-content')?.appendChild(modal);
    this.showNotification('Ejercicios generados', 'success');
  }

  showGameMasterModal() {
    const modal = document.createElement('div');
    modal.className = 'upgrade-prompt-modal fade-in';
    modal.innerHTML = `
      <div class="upgrade-overlay" onclick="this.parentElement.remove()"></div>
      <div class="upgrade-content" style="max-width: 600px;">
        <div style="text-align: left;">
          <h2 style="color: #8b5cf6; margin-bottom: 1rem;">🎮 Game Master IA</h2>

          <div style="display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1rem;">
            <button class="ai-feature-btn" onclick="window.iaIntegration.launchNPCChat()">
              💬 Conversar con NPCs
            </button>
            <button class="ai-feature-btn" onclick="window.iaIntegration.launchMissionGenerator()">
              🗺️ Generar Misión Única
            </button>
            <button class="ai-feature-btn" onclick="window.iaIntegration.launchAdaptiveNarrative()">
              📖 Continuar Narrativa
            </button>
            <button class="ai-feature-btn" onclick="window.iaIntegration.analyzeBeingViability()">
              🔍 Analizar Ser
            </button>
          </div>

          <button
            style="width: 100%; padding: 0.75rem; background: rgba(139, 92, 246, 0.1); border: 1px solid rgba(139, 92, 246, 0.2); border-radius: 8px; color: #9ca3af; cursor: pointer;"
            onclick="this.closest('.upgrade-prompt-modal').remove()"
          >
            Cerrar
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  }

  async launchNPCChat() {
    this.showNotification('Iniciando chat con NPC...', 'info');
    // Implementar chat con NPC
  }

  async launchMissionGenerator() {
    this.showNotification('Generando misión única...', 'info');
    // Implementar generador de misiones
  }

  async launchAdaptiveNarrative() {
    this.showNotification('Continuando narrativa adaptativa...', 'info');
    // Implementar narrativa adaptativa
  }

  async analyzeBeingViability() {
    this.showNotification('Analizando viabilidad del ser...', 'info');
    // Implementar análisis
  }

  showResponseCard(title, content, replaceElement) {
    const card = document.createElement('div');
    card.className = 'ai-response-card';
    card.innerHTML = `
      <div class="ai-response-header">
        <span class="ai-response-icon">✨</span>
        <span class="ai-response-title">${title}</span>
      </div>
      <div class="ai-response-content">
        ${content}
      </div>
      <div class="ai-response-actions">
        <button class="ai-response-action" onclick="this.closest('.ai-response-card').remove()">
          ✓ Cerrar
        </button>
      </div>
    `;

    if (replaceElement) {
      replaceElement.remove();
    }

    document.querySelector('.chapter-content')?.appendChild(card);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // NOTIFICACIONES Y ESTADOS
  // ═══════════════════════════════════════════════════════════════════════════

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      padding: 1rem 1.5rem;
      background: ${type === 'error' ? 'rgba(239, 68, 68, 0.1)' : type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)'};
      border: 1px solid ${type === 'error' ? 'rgba(239, 68, 68, 0.3)' : type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(59, 130, 246, 0.3)'};
      color: ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#3b82f6'};
      border-radius: 8px;
      z-index: 9999;
      animation: slideInRight 0.3s ease-out;
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slideOutRight 0.3s ease-out';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  showProcessing(message) {
    const processing = document.createElement('div');
    processing.id = 'ia-processing';
    processing.className = 'ai-processing fade-in';
    processing.innerHTML = `
      <div class="ai-loading-spinner"></div>
      <p>${message}</p>
    `;

    document.body.appendChild(processing);
  }

  hideProcessing() {
    const processing = document.getElementById('ia-processing');
    if (processing) {
      processing.classList.add('fade-out');
      setTimeout(() => processing.remove(), 300);
    }
  }
}

// Crear instancia global
window.iaIntegration = new IAIntegration();

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', async () => {
  await window.iaIntegration.init();
});

logger.debug('✅ IAIntegration cargado. Use window.iaIntegration para integración de IA.');
