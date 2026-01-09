// ============================================================================
// AUTO SUMMARY - Resumen Automático de Capítulos con IA
// ============================================================================

// 🔧 FIX v2.9.198: Migrated console.log to logger
class AutoSummary {
  constructor(bookEngine, aiAdapter) {
    this.bookEngine = bookEngine;
    this.aiAdapter = aiAdapter;
    this.i18n = window.i18n || { t: (key) => key };
    this.summaryCache = this.loadCache();
  }

  // ==========================================================================
  // CACHE DE RESÚMENES
  // ==========================================================================

  loadCache() {
    try {
      return JSON.parse(localStorage.getItem('chapter-summaries')) || {};
    } catch {
      return {};
    }
  }

  saveCache() {
    localStorage.setItem('chapter-summaries', JSON.stringify(this.summaryCache));
  }

  getCacheKey(bookId, chapterId) {
    return `${bookId}:${chapterId}`;
  }

  getCachedSummary(bookId, chapterId) {
    const key = this.getCacheKey(bookId, chapterId);
    return this.summaryCache[key] || null;
  }

  cacheSummary(bookId, chapterId, summary) {
    const key = this.getCacheKey(bookId, chapterId);
    this.summaryCache[key] = {
      summary,
      generatedAt: new Date().toISOString()
    };
    this.saveCache();
  }

  // ==========================================================================
  // GENERACIÓN DE RESUMEN
  // ==========================================================================

  async generateSummary(chapter, bookId) {
    if (!this.aiAdapter || !window.aiConfig?.getClaudeApiKey()) {
      // logger.debug('IA no configurada para generar resumen');
      return null;
    }

    // Verificar cache primero
    const cached = this.getCachedSummary(bookId, chapter.id);
    if (cached) {
      // logger.debug('Usando resumen cacheado');
      return cached.summary;
    }

    // Obtener contenido del capítulo
    const content = this.extractChapterText(chapter);
    if (!content || content.length < 100) {
      // logger.debug('Contenido insuficiente para generar resumen');
      return null;
    }

    // Limitar contenido para no gastar muchos tokens
    const limitedContent = content.substring(0, 4000);

    const prompt = `Genera un resumen conciso del siguiente capítulo en formato de puntos clave.

INSTRUCCIONES:
- Extrae 3-5 puntos CLAVE (los más importantes)
- Cada punto debe ser una idea completa pero breve (máx 2 líneas)
- Usa formato: "🔑 **Concepto**: Explicación breve"
- Si hay términos técnicos, explícalos brevemente
- Mantén el tono del libro original

CAPÍTULO: "${chapter.title}"

CONTENIDO:
${limitedContent}

FORMATO DE RESPUESTA:
🔑 **Punto 1**: Explicación
🔑 **Punto 2**: Explicación
...etc`;

    try {
      const response = await this.aiAdapter.ask(prompt, '', []);

      if (response) {
        // Cachear el resumen
        this.cacheSummary(bookId, chapter.id, response);
        return response;
      }
    } catch (error) {
      logger.error('Error generando resumen:', error);
    }

    return null;
  }

  extractChapterText(chapter) {
    // Extraer texto del contenido del capítulo
    let text = '';

    if (chapter.content) {
      // Si es string directo
      if (typeof chapter.content === 'string') {
        text = chapter.content;
      }
      // Si es array de secciones
      else if (Array.isArray(chapter.content)) {
        text = chapter.content.map(section => {
          if (typeof section === 'string') return section;
          if (section.text) return section.text;
          if (section.content) return section.content;
          return '';
        }).join('\n\n');
      }
    }

    // Limpiar HTML si existe
    text = text.replace(/<[^>]*>/g, ' ');
    // Limpiar múltiples espacios
    text = text.replace(/\s+/g, ' ').trim();

    return text;
  }

  // ==========================================================================
  // MODAL DE RESUMEN
  // ==========================================================================

  async showSummaryModal(chapter, bookId) {
    // Mostrar loading
    this.showLoadingModal();

    // Generar resumen
    const summary = await this.generateSummary(chapter, bookId);

    // Cerrar loading
    this.closeModal();

    if (!summary) {
      window.toast?.info('No se pudo generar el resumen. Verifica tu configuración de IA.');
      return;
    }

    // Mostrar modal con resumen
    this.renderSummaryModal(chapter, summary, bookId);
  }

  showLoadingModal() {
    const existing = document.getElementById('summary-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'summary-modal';
    modal.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4';

    modal.innerHTML = `
      <div class="bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-8 text-center border border-cyan-500/30">
        <div class="animate-pulse">
          <div class="text-5xl mb-4">🧠</div>
          <h3 class="text-xl font-bold text-cyan-300 mb-2">Generando Resumen</h3>
          <p class="text-gray-400">La IA está analizando el capítulo...</p>
          <div class="mt-4 flex justify-center gap-1">
            <div class="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style="animation-delay: 0s"></div>
            <div class="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
            <div class="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  }

  renderSummaryModal(chapter, summary, bookId) {
    const existing = document.getElementById('summary-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'summary-modal';
    modal.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4';
    modal.style.animation = 'fadeIn 0.3s ease-out';

    modal.innerHTML = `
      <div class="bg-gradient-to-br from-gray-900 to-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col border border-cyan-500/30">
        <!-- Header -->
        <div class="bg-cyan-900/30 px-6 py-4 border-b border-cyan-500/30 flex items-center justify-between rounded-t-2xl">
          <div class="flex items-center gap-3">
            <span class="text-3xl">📄</span>
            <div>
              <h2 class="text-xl font-bold text-cyan-200">Resumen del Capítulo</h2>
              <p class="text-sm text-cyan-400/70">${chapter.title}</p>
            </div>
          </div>
          <button id="close-summary-modal"
                  class="text-cyan-300 hover:text-white p-3 hover:bg-cyan-800/50 rounded-lg transition"
                  aria-label="Cerrar resumen"
                  title="Cerrar">
            ${Icons.close(20)}
          </button>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto p-6">
          <div class="prose prose-invert max-w-none">
            <div class="summary-content space-y-4 text-gray-200">
              ${this.formatSummary(summary)}
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="px-6 py-4 border-t border-cyan-500/30 flex flex-wrap gap-3">
          <button id="copy-summary-btn" class="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg font-semibold transition flex items-center justify-center gap-2">
            ${Icons.note(18)}
            <span>Copiar</span>
          </button>
          <button id="save-summary-note-btn" class="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg font-semibold transition flex items-center justify-center gap-2">
            ${Icons.bookmark(18)}
            <span>Guardar como Nota</span>
          </button>
          <button id="discuss-summary-btn" class="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition flex items-center justify-center gap-2">
            ${Icons.chat(18)}
            <span>Preguntar a IA</span>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this.attachModalListeners(chapter, summary, bookId);
  }

  formatSummary(summary) {
    // Convertir markdown básico a HTML
    let formatted = summary;

    // Negritas
    formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong class="text-cyan-300">$1</strong>');

    // Emojis de puntos clave como separadores
    formatted = formatted.split(/🔑/).map((part, index) => {
      if (index === 0 && !part.trim()) return '';
      if (!part.trim()) return '';
      return `
        <div class="flex gap-3 p-3 bg-cyan-900/20 rounded-lg border border-cyan-500/20">
          <span class="text-2xl">🔑</span>
          <div class="flex-1">${part.trim()}</div>
        </div>
      `;
    }).join('');

    // Si no había emojis, mostrar como párrafos
    if (!formatted.includes('🔑')) {
      formatted = summary.split('\n').map(line =>
        line.trim() ? `<p class="mb-2">${line}</p>` : ''
      ).join('');
    }

    return formatted;
  }

  attachModalListeners(chapter, summary, bookId) {
    const modal = document.getElementById('summary-modal');
    if (!modal) return;

    // Close button
    document.getElementById('close-summary-modal')?.addEventListener('click', () => this.closeModal());

    // Click outside
    modal.addEventListener('click', (e) => {
      if (e.target === modal) this.closeModal();
    });

    // ESC key
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        this.closeModal();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);

    // Copy button
    document.getElementById('copy-summary-btn')?.addEventListener('click', () => {
      navigator.clipboard.writeText(summary).then(() => {
        window.toast?.success('Resumen copiado al portapapeles');
      }).catch(() => {
        window.toast?.error('Error al copiar');
      });
    });

    // Save as note button
    document.getElementById('save-summary-note-btn')?.addEventListener('click', () => {
      if (window.notesModal) {
        const noteContent = `📄 RESUMEN: ${chapter.title}\n\n${summary}`;
        window.notesModal.addNote(chapter.id, noteContent);
        window.toast?.success('Resumen guardado como nota');
        this.closeModal();
      }
    });

    // Discuss with AI button
    document.getElementById('discuss-summary-btn')?.addEventListener('click', async () => {
      // 🔧 v2.9.283: Usar AILazyLoader para carga dinámica
      this.closeModal();
      if (window.aiLazyLoader) {
        await window.aiLazyLoader.showAIChatModal();
      } else if (window.aiChatModal) {
        window.aiChatModal.open();
      }
      // Pre-fill con contexto del resumen
      setTimeout(() => {
        const input = document.getElementById('ai-chat-input');
        if (input) {
          input.value = `Sobre el resumen del capítulo "${chapter.title}": `;
          input.focus();
        }
      }, 300);
    });
  }

  closeModal() {
    const modal = document.getElementById('summary-modal');
    if (modal) {
      modal.style.animation = 'fadeOut 0.2s ease-out';
      setTimeout(() => modal.remove(), 200);
    }
  }

  // ==========================================================================
  // BOTÓN EN TOOLBAR
  // ==========================================================================

  static createButton() {
    return `
      <button id="summary-btn" class="p-2 hover:bg-cyan-900/50 rounded-lg transition text-cyan-400" title="Resumen del capítulo">
        ${Icons.create('file-text', 20)}
      </button>
    `;
  }
}

// Exportar clase
window.AutoSummary = AutoSummary;

// 🔧 v2.9.325: Auto-instanciar para que funcione el botón
window.autoSummary = new AutoSummary();
