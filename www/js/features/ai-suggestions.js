// ============================================================================
// AI SUGGESTIONS - Sugerencias Contextuales de IA
// ============================================================================

// 🔧 FIX v2.9.198: Migrated console.log to logger
class AISuggestions {
  constructor(bookEngine) {
    this.bookEngine = bookEngine;
    this.i18n = window.i18n || { t: (key) => key };
    this.suggestionsCache = {};
  }

  // ==========================================================================
  // SUGERENCIAS PREDEFINIDAS POR LIBRO/CAPÍTULO
  // ==========================================================================

  getPredefinedSuggestions(bookId, chapterId) {
    const suggestions = {
      'manifiesto': {
        'default': [
          {
            type: 'explore',
            icon: '🔍',
            title: 'Profundizar',
            text: '¿Cuáles son los argumentos principales contra el sistema económico actual?',
            action: 'chat'
          },
          {
            type: 'counter',
            icon: '⚖️',
            title: 'Perspectiva alternativa',
            text: '¿Qué argumentos usan los defensores del capitalismo?',
            action: 'chat'
          },
          {
            type: 'action',
            icon: '✊',
            title: 'Actuar ahora',
            text: 'Dame 3 acciones concretas que puedo hacer esta semana',
            action: 'chat'
          }
        ],
        'cap1': [
          {
            type: 'explore',
            icon: '🔍',
            title: 'Profundizar',
            text: '¿Qué es exactamente el "sistema" del que habla el capítulo?',
            action: 'chat'
          },
          {
            type: 'counter',
            icon: '⚖️',
            title: 'Contraargumento',
            text: '¿No ha generado el sistema actual también beneficios?',
            action: 'chat'
          },
          {
            type: 'action',
            icon: '📝',
            title: 'Reflexionar',
            text: 'Ayúdame a identificar cómo participo yo en el sistema',
            action: 'chat'
          }
        ],
        'cap2': [
          {
            type: 'explore',
            icon: '🔍',
            title: 'Profundizar',
            text: '¿Cómo funcionan los monopolios naturales?',
            action: 'chat'
          },
          {
            type: 'action',
            icon: '🛠️',
            title: 'Práctica',
            text: '¿Cómo puedo reducir mi dependencia del sistema?',
            action: 'chat'
          }
        ]
      },
      'codigo-despertar': {
        'default': [
          {
            type: 'explore',
            icon: '🧠',
            title: 'Profundizar',
            text: '¿Qué es exactamente la consciencia según las teorías actuales?',
            action: 'chat'
          },
          {
            type: 'practice',
            icon: '🧘',
            title: 'Practicar',
            text: 'Guíame en una meditación de 5 minutos relacionada con este tema',
            action: 'chat'
          },
          {
            type: 'connect',
            icon: '🔗',
            title: 'Conectar ideas',
            text: '¿Cómo se relaciona esto con la física cuántica?',
            action: 'chat'
          }
        ],
        'cap1': [
          {
            type: 'explore',
            icon: '🔍',
            title: 'Profundizar',
            text: '¿Qué significa que "todo es información"?',
            action: 'chat'
          },
          {
            type: 'science',
            icon: '🔬',
            title: 'Base científica',
            text: '¿Qué dice la ciencia sobre la realidad como información?',
            action: 'chat'
          }
        ],
        'cap4': [
          {
            type: 'explore',
            icon: '🧠',
            title: 'Profundizar',
            text: '¿Puede una IA ser realmente consciente?',
            action: 'chat'
          },
          {
            type: 'philosophy',
            icon: '📚',
            title: 'Filosofía',
            text: '¿Qué dice el test de Turing sobre la consciencia?',
            action: 'chat'
          }
        ]
      }
    };

    // Buscar sugerencias específicas del capítulo, o usar default
    const bookSuggestions = suggestions[bookId];
    if (!bookSuggestions) return this.getGenericSuggestions();

    return bookSuggestions[chapterId] || bookSuggestions['default'] || this.getGenericSuggestions();
  }

  getGenericSuggestions() {
    return [
      {
        type: 'explore',
        icon: '🔍',
        title: 'Profundizar',
        text: '¿Cuáles son los conceptos clave de este capítulo?',
        action: 'chat'
      },
      {
        type: 'apply',
        icon: '💡',
        title: 'Aplicar',
        text: '¿Cómo puedo aplicar estas ideas en mi vida?',
        action: 'chat'
      },
      {
        type: 'question',
        icon: '❓',
        title: 'Cuestionar',
        text: '¿Qué críticas se pueden hacer a estas ideas?',
        action: 'chat'
      }
    ];
  }

  // ==========================================================================
  // RENDERIZADO
  // ==========================================================================

  render(bookId, chapterId) {
    const suggestions = this.getPredefinedSuggestions(bookId, chapterId);

    return `
      <div class="ai-suggestions-container mt-8 p-4 bg-gradient-to-r from-cyan-900/20 to-purple-900/20 rounded-xl border border-cyan-500/20">
        <div class="flex items-center gap-2 mb-4">
          <span class="text-2xl">💡</span>
          <h4 class="font-bold text-cyan-300">Sugerencias para profundizar</h4>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          ${suggestions.map((suggestion, index) => `
            <button class="ai-suggestion-btn group text-left p-4 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg border border-gray-700 hover:border-cyan-500/50 transition-all"
                    data-suggestion-index="${index}"
                    data-suggestion-text="${suggestion.text}">
              <div class="flex items-start gap-3">
                <span class="text-2xl group-hover:scale-110 transition-transform">${suggestion.icon}</span>
                <div>
                  <p class="font-semibold text-gray-200 group-hover:text-cyan-300 transition-colors">${suggestion.title}</p>
                  <p class="text-sm text-gray-400 mt-1 line-clamp-2">${suggestion.text}</p>
                </div>
              </div>
            </button>
          `).join('')}
        </div>

        <p class="text-xs text-gray-400 mt-3 text-center">
          Haz clic en una sugerencia para preguntar a la IA
        </p>
      </div>
    `;
  }

  // ==========================================================================
  // WIDGET FLOTANTE
  // ==========================================================================

  showFloatingWidget(bookId, chapterId) {
    // Remover widget existente
    const existing = document.getElementById('ai-suggestions-widget');
    if (existing) existing.remove();

    const suggestions = this.getPredefinedSuggestions(bookId, chapterId);

    const widget = document.createElement('div');
    widget.id = 'ai-suggestions-widget';
    widget.className = 'fixed bottom-20 right-4 z-40 max-w-sm';
    widget.style.animation = 'slideInRight 0.3s ease-out';

    widget.innerHTML = `
      <div class="bg-gray-900/95 backdrop-blur-sm rounded-xl shadow-2xl border border-cyan-500/30 overflow-hidden">
        <!-- Header -->
        <div class="bg-cyan-900/50 px-4 py-3 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="text-xl">💡</span>
            <span class="font-semibold text-cyan-200 text-sm">¿Quieres profundizar?</span>
          </div>
          <button id="close-suggestions-widget" class="text-cyan-400 hover:text-white p-2 hover:bg-cyan-800/50 rounded transition">
            ${Icons.close(16)}
          </button>
        </div>

        <!-- Suggestions -->
        <div class="p-3 space-y-2">
          ${suggestions.slice(0, 3).map((suggestion, _index) => `
            <button class="ai-suggestion-btn w-full text-left p-3 bg-gray-800/50 hover:bg-cyan-900/30 rounded-lg border border-gray-700/50 hover:border-cyan-500/50 transition-all flex items-center gap-3"
                    data-suggestion-text="${suggestion.text}">
              <span class="text-lg">${suggestion.icon}</span>
              <span class="text-sm text-gray-300 line-clamp-1">${suggestion.text}</span>
            </button>
          `).join('')}
        </div>

        <!-- Dismiss -->
        <div class="px-3 pb-3">
          <button id="dismiss-suggestions" class="w-full text-xs text-gray-400 hover:text-gray-300 py-1">
            No mostrar más en este capítulo
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(widget);
    this.attachWidgetListeners(bookId, chapterId);

    // Auto-hide después de 15 segundos
    setTimeout(() => {
      if (document.getElementById('ai-suggestions-widget')) {
        this.hideFloatingWidget();
      }
    }, 15000);
  }

  attachWidgetListeners(bookId, chapterId) {
    // Close button
    document.getElementById('close-suggestions-widget')?.addEventListener('click', () => {
      this.hideFloatingWidget();
    });

    // Dismiss button
    document.getElementById('dismiss-suggestions')?.addEventListener('click', () => {
      this.dismissForChapter(bookId, chapterId);
      this.hideFloatingWidget();
    });

    // Suggestion buttons
    document.querySelectorAll('#ai-suggestions-widget .ai-suggestion-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const text = btn.dataset.suggestionText;
        this.openChatWithSuggestion(text);
        this.hideFloatingWidget();
      });
    });
  }

  hideFloatingWidget() {
    const widget = document.getElementById('ai-suggestions-widget');
    if (widget) {
      widget.style.animation = 'slideOutRight 0.2s ease-out';
      setTimeout(() => widget.remove(), 200);
    }
  }

  dismissForChapter(bookId, chapterId) {
    const key = `suggestions-dismissed-${bookId}-${chapterId}`;
    localStorage.setItem(key, 'true');
  }

  shouldShowForChapter(bookId, chapterId) {
    const key = `suggestions-dismissed-${bookId}-${chapterId}`;
    return localStorage.getItem(key) !== 'true';
  }

  openChatWithSuggestion(text) {
    if (window.aiChatModal) {
      window.aiChatModal.open();
      setTimeout(() => {
        const input = document.getElementById('ai-chat-input');
        if (input) {
          input.value = text;
          input.focus();
        }
      }, 300);
    }
  }

  // ==========================================================================
  // INTEGRACIÓN CON CONTENIDO DEL CAPÍTULO
  // ==========================================================================

  attachToChapterContent() {
    // Añadir listeners a los botones de sugerencia en el contenido
    const buttons = document.querySelectorAll('.ai-suggestion-btn');
    // logger.debug('🔧 AI Suggestions: Adjuntando listeners a', buttons.length, 'botones');

    buttons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const text = btn.dataset.suggestionText;
        // logger.debug('📝 Sugerencia clickeada:', text);
        if (text) {
          this.openChatWithSuggestion(text);
        }
      });
    });
  }
}

// Añadir estilos de animación
if (!document.getElementById('ai-suggestions-styles')) {
  const styles = document.createElement('style');
  styles.id = 'ai-suggestions-styles';
  styles.textContent = `
    @keyframes slideInRight {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOutRight {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
    .line-clamp-1 {
      display: -webkit-box;
      -webkit-line-clamp: 1;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  `;
  document.head.appendChild(styles);
}

// Exportar
window.AISuggestions = AISuggestions;
