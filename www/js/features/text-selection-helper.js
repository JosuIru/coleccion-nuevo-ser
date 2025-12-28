// ============================================================================
// TEXT SELECTION HELPER - Menú contextual para selección de texto
// ============================================================================
// Permite seleccionar texto en los libros y hacer preguntas a la IA sobre él

// 🔧 FIX v2.9.198: Migrated console.log to logger
class TextSelectionHelper {
  constructor(aiChatModal) {
    this.aiChatModal = aiChatModal;
    this.selectedText = '';
    this.selectionMenu = null;
    this.isMenuVisible = false;

    // Opciones de consulta rápida
    this.quickActions = [
      {
        id: 'explain',
        icon: '💡',
        label: 'Explicar',
        prompt: (text) => `Explícame este concepto de forma clara y concisa:\n\n"${text}"`
      },
      {
        id: 'define',
        icon: '📖',
        label: 'Definir',
        prompt: (text) => `Dame una definición precisa de:\n\n"${text}"`
      },
      {
        id: 'deepen',
        icon: '🔍',
        label: 'Profundizar',
        prompt: (text) => `Profundiza en este tema con más detalles y ejemplos:\n\n"${text}"`
      },
      {
        id: 'summarize',
        icon: '📝',
        label: 'Resumir',
        prompt: (text) => `Resume este texto en puntos clave:\n\n"${text}"`
      },
      {
        id: 'question',
        icon: '❓',
        label: 'Preguntar',
        prompt: (text) => `Texto seleccionado: "${text}"\n\nMi pregunta: `
      }
    ];

    this.init();
  }

  // ==========================================================================
  // INICIALIZACIÓN
  // ==========================================================================

  init() {
    try {
      // Verificar que Icons está disponible
      if (!window.Icons) {
        console.error('❌ Icons no disponible, reintentando en 500ms...');
        setTimeout(() => this.init(), 500);
        return;
      }

      // Crear el menú contextual (oculto inicialmente)
      this.createSelectionMenu();

      // Adjuntar listeners
      this.attachListeners();

      // logger.debug('✅ Text Selection Helper inicializado');
      if (window.logger) {
        logger.log('✅ Text Selection Helper inicializado');
      }
    } catch (error) {
      console.error('❌ Error inicializando Text Selection Helper:', error);
    }
  }

  createSelectionMenu() {
    // Remover menú existente si hay
    const existing = document.getElementById('text-selection-menu');
    if (existing) existing.remove();

    const menu = document.createElement('div');
    menu.id = 'text-selection-menu';
    menu.className = 'fixed hidden z-50 bg-slate-900/95 backdrop-blur-sm border-2 border-cyan-500/50 rounded-xl shadow-2xl p-2 transition-opacity';
    menu.style.opacity = '0';

    const sparklesIcon = window.Icons ? Icons.sparkles(14) : '✨';
    const copyIcon = window.Icons ? Icons.copy(16) : '📋';

    menu.innerHTML = `
      <div class="flex flex-col gap-1 min-w-[180px]">
        <!-- Header -->
        <div class="text-xs text-cyan-300 font-semibold px-2 py-1 border-b border-slate-700 flex items-center gap-2">
          ${sparklesIcon}
          <span>Preguntar a IA</span>
        </div>

        <!-- Acciones rápidas -->
        <div class="flex flex-col gap-0.5">
          ${this.quickActions.map(action => `
            <button class="text-selection-action px-3 py-2 text-sm text-left hover:bg-cyan-600/20 rounded-lg transition flex items-center gap-2"
                    data-action-id="${action.id}">
              <span class="text-lg">${action.icon}</span>
              <span>${action.label}</span>
            </button>
          `).join('')}
        </div>

        <!-- Copiar texto -->
        <div class="border-t border-slate-700 pt-1 mt-1">
          <button id="text-selection-copy"
                  class="w-full px-3 py-2 text-sm text-left hover:bg-slate-700/50 rounded-lg transition flex items-center gap-2">
            ${copyIcon}
            <span>Copiar texto</span>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(menu);
    this.selectionMenu = menu;

    // Adjuntar listeners a las acciones
    this.attachMenuListeners();
  }

  attachListeners() {
    // Listener para detección de selección de texto
    document.addEventListener('mouseup', (e) => this.handleTextSelection(e));
    document.addEventListener('touchend', (e) => this.handleTextSelection(e));

    // Ocultar menú cuando se hace click fuera
    document.addEventListener('mousedown', (e) => {
      if (this.isMenuVisible && !this.selectionMenu.contains(e.target)) {
        this.hideMenu();
      }
    });

    // Ocultar menú al hacer scroll
    document.addEventListener('scroll', () => {
      if (this.isMenuVisible) {
        this.hideMenu();
      }
    }, true);
  }

  attachMenuListeners() {
    // Listeners para acciones rápidas
    const actionButtons = this.selectionMenu.querySelectorAll('.text-selection-action');
    actionButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const actionId = btn.getAttribute('data-action-id');
        this.executeAction(actionId);
      });
    });

    // Listener para copiar
    const copyBtn = this.selectionMenu.querySelector('#text-selection-copy');
    if (copyBtn) {
      copyBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.copyToClipboard();
      });
    }
  }

  // ==========================================================================
  // DETECCIÓN DE SELECCIÓN
  // ==========================================================================

  handleTextSelection(e) {
    // Ignorar si el tutorial está activo
    if (window.onboardingTutorial && window.onboardingTutorial.isActive) {
      return;
    }

    // Ignorar si el click está dentro de modales especiales O del Laboratorio Frankenstein
    const clickTarget = e.target;
    if (clickTarget.closest('#tutorial-tooltip') ||
        clickTarget.closest('#tutorial-overlay') ||
        clickTarget.closest('#help-center-modal') ||
        clickTarget.closest('#ai-chat-modal') ||
        clickTarget.closest('#organism-container') ||
        clickTarget.closest('.frankenstein-laboratory')) {
      return;
    }

    // Pequeño delay para asegurar que la selección está completa
    setTimeout(() => {
      const selection = window.getSelection();
      const text = selection.toString().trim();

      // Debug logging
      // logger.debug('[TextSelection] Text selected:', text.substring(0, 50) + '...');
      // logger.debug('[TextSelection] Text length:', text.length);

      // Verificar que:
      // 1. Hay texto seleccionado
      // 2. El texto está en el contenido del libro (no en otros elementos)
      // 3. El texto tiene una longitud razonable (mínimo 3 caracteres)
      if (text.length >= 3) {
        const range = selection.getRangeAt(0);
        const container = range.commonAncestorContainer;

        // logger.debug('[TextSelection] Container:', container);

        // Verificar que está dentro del contenido del capítulo
        const isInChapter = this.isInChapterContent(container);

        // logger.debug('[TextSelection] Is in chapter:', isInChapter);

        if (isInChapter) {
          this.selectedText = text;
          this.showMenu(e);
        } else {
          // console.warn('[TextSelection] Selection not in chapter content');
          this.hideMenu();
        }
      } else {
        // logger.debug('[TextSelection] Text too short');
        this.hideMenu();
      }
    }, 50);
  }

  isInChapterContent(node) {
    // Buscar si el nodo está dentro del contenedor del capítulo
    let current = node;
    let depth = 0;
    while (current && depth < 20) { // Limite de profundidad para evitar loops infinitos
      // Log para debugging
      if (current.classList) {
        // logger.debug('[TextSelection] Checking node:', current.className || current.id || current.tagName);
      }

      if (current.classList) {
        // Múltiples formas de identificar el contenido del libro
        if (current.classList.contains('chapter-content') ||
            current.classList.contains('book-content') ||
            current.classList.contains('content') ||
            current.classList.contains('prose') ||
            current.classList.contains('main-content') ||
            current.id === 'book-reader-view' ||
            current.id === 'book-content') {
          // logger.debug('[TextSelection] Found valid container:', current.className || current.id);
          return true;
        }
      }
      current = current.parentElement;
      depth++;
    }
    // console.warn('[TextSelection] No valid container found after checking', depth, 'levels');
    return false;
  }

  // ==========================================================================
  // MOSTRAR/OCULTAR MENÚ
  // ==========================================================================

  showMenu(event) {
    if (!this.selectionMenu) return;

    // Calcular posición del menú
    const x = event.pageX || event.changedTouches?.[0]?.pageX || 0;
    const y = event.pageY || event.changedTouches?.[0]?.pageY || 0;

    // Obtener dimensiones del menú
    this.selectionMenu.style.display = 'block';
    const menuRect = this.selectionMenu.getBoundingClientRect();

    // Ajustar posición para que no se salga de la pantalla
    let menuX = x;
    let menuY = y + 10; // Offset vertical

    // Ajustar horizontalmente
    if (menuX + menuRect.width > window.innerWidth) {
      menuX = window.innerWidth - menuRect.width - 10;
    }

    // Ajustar verticalmente
    if (menuY + menuRect.height > window.innerHeight + window.scrollY) {
      menuY = y - menuRect.height - 10; // Mostrar arriba
    }

    // Aplicar posición
    this.selectionMenu.style.left = `${menuX}px`;
    this.selectionMenu.style.top = `${menuY}px`;

    // Mostrar con animación
    requestAnimationFrame(() => {
      this.selectionMenu.style.opacity = '1';
      this.isMenuVisible = true;
    });
  }

  hideMenu() {
    if (!this.selectionMenu || !this.isMenuVisible) return;

    this.selectionMenu.style.opacity = '0';
    setTimeout(() => {
      this.selectionMenu.style.display = 'none';
      this.isMenuVisible = false;
    }, 150);
  }

  // ==========================================================================
  // ACCIONES
  // ==========================================================================

  executeAction(actionId) {
    const action = this.quickActions.find(a => a.id === actionId);
    if (!action) return;

    const prompt = action.prompt(this.selectedText);

    // Abrir chat de IA con el prompt pre-llenado
    this.openAIChatWithPrompt(prompt, actionId === 'question');

    this.hideMenu();
  }

  openAIChatWithPrompt(prompt, allowEdit = false) {
    // Abrir el modal de IA
    this.aiChatModal.open();

    // Esperar un momento a que el modal se renderice
    setTimeout(() => {
      const input = document.getElementById('ai-chat-input');
      if (input) {
        input.value = prompt;

        if (allowEdit) {
          // Si es pregunta personalizada, posicionar cursor al final
          input.focus();
          input.setSelectionRange(prompt.length, prompt.length);
        } else {
          // Si es acción rápida, enviar automáticamente
          const sendBtn = document.getElementById('ai-chat-send');
          if (sendBtn) {
            sendBtn.click();
          }
        }
      }
    }, 150);
  }

  async copyToClipboard() {
    try {
      await navigator.clipboard.writeText(this.selectedText);
      window.toast?.success('📋 Texto copiado al portapapeles');
    } catch (error) {
      console.error('Error copiando al portapapeles:', error);

      // Fallback para navegadores antiguos
      const textArea = document.createElement('textarea');
      textArea.value = this.selectedText;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.select();

      try {
        document.execCommand('copy');
        window.toast?.success('📋 Texto copiado al portapapeles');
      } catch (err) {
        window.toast?.error('❌ No se pudo copiar el texto');
      }

      document.body.removeChild(textArea);
    }

    this.hideMenu();
  }

  // ==========================================================================
  // MÉTODOS PÚBLICOS
  // ==========================================================================

  destroy() {
    if (this.selectionMenu) {
      this.selectionMenu.remove();
      this.selectionMenu = null;
    }
    this.isMenuVisible = false;
    this.selectedText = '';
  }
}

// Exportar para uso global en navegador
window.TextSelectionHelper = TextSelectionHelper;

// Exportar para módulos de Node.js (si aplica)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TextSelectionHelper;
}
