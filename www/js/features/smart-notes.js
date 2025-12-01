// ============================================================================
// SMART NOTES - Sistema de Notas Inteligentes
// ============================================================================
// Mejora el sistema de notas con plantillas, etiquetas, búsqueda y sugerencias

class SmartNotes {
  constructor(bookEngine, notesModal) {
    this.bookEngine = bookEngine;
    this.notesModal = notesModal;
    this.i18n = window.i18n || { t: (key) => key };

    // Plantillas de notas predefinidas
    this.templates = {
      reflexion: {
        icon: '🤔',
        name: 'Reflexión',
        placeholder: 'Mi reflexión sobre este tema...\n\n¿Qué me hace pensar?\n¿Cómo se relaciona con mi vida?',
        tags: ['reflexion', 'personal']
      },
      duda: {
        icon: '❓',
        name: 'Duda',
        placeholder: 'Mi duda o pregunta:\n\n¿Por qué...?\n¿Cómo...?',
        tags: ['duda', 'pregunta']
      },
      conexion: {
        icon: '🔗',
        name: 'Conexión',
        placeholder: 'Esto me recuerda a...\n\nConexión con otros capítulos/libros/ideas:',
        tags: ['conexion', 'relacion']
      },
      accion: {
        icon: '✅',
        name: 'Acción',
        placeholder: 'Quiero hacer:\n\n1. \n2. \n3. \n\nPlazo: ',
        tags: ['accion', 'compromiso']
      },
      cita: {
        icon: '💬',
        name: 'Cita importante',
        placeholder: '"[Cita del texto]"\n\n¿Por qué es importante para mí?',
        tags: ['cita', 'destacado']
      },
      insight: {
        icon: '💡',
        name: 'Insight',
        placeholder: '¡Acabo de darme cuenta de que...!\n\nEsto cambia mi perspectiva porque:',
        tags: ['insight', 'descubrimiento']
      }
    };

    // Tags disponibles
    this.availableTags = [
      { id: 'reflexion', icon: '🤔', name: 'Reflexión' },
      { id: 'duda', icon: '❓', name: 'Duda' },
      { id: 'conexion', icon: '🔗', name: 'Conexión' },
      { id: 'accion', icon: '✅', name: 'Acción' },
      { id: 'cita', icon: '💬', name: 'Cita' },
      { id: 'insight', icon: '💡', name: 'Insight' },
      { id: 'importante', icon: '⭐', name: 'Importante' },
      { id: 'revisar', icon: '🔄', name: 'Revisar' }
    ];

    this.searchQuery = '';
    this.selectedTags = [];
  }

  // ==========================================================================
  // PLANTILLAS
  // ==========================================================================

  renderTemplateSelector() {
    return `
      <div class="smart-notes-templates mb-4">
        <p class="text-xs text-gray-400 mb-2">Usar plantilla:</p>
        <div class="flex flex-wrap gap-2">
          ${Object.entries(this.templates).map(([key, template]) => `
            <button class="template-btn px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-cyan-500/50 rounded-lg text-sm transition flex items-center gap-1.5"
                    data-template="${key}">
              <span>${template.icon}</span>
              <span>${template.name}</span>
            </button>
          `).join('')}
        </div>
      </div>
    `;
  }

  applyTemplate(templateKey) {
    const template = this.templates[templateKey];
    if (!template) return;

    const textarea = document.getElementById('note-input');
    if (textarea) {
      textarea.value = template.placeholder;
      textarea.focus();
      // Seleccionar el primer placeholder
      const start = textarea.value.indexOf('[');
      const end = textarea.value.indexOf(']');
      if (start !== -1 && end !== -1) {
        textarea.setSelectionRange(start, end + 1);
      }
    }

    // Actualizar tags seleccionados
    this.selectedTags = [...template.tags];
    this.updateTagsUI();
  }

  // ==========================================================================
  // ETIQUETAS
  // ==========================================================================

  renderTagSelector() {
    return `
      <div class="smart-notes-tags mb-3">
        <p class="text-xs text-gray-400 mb-2">Etiquetas:</p>
        <div class="flex flex-wrap gap-1.5">
          ${this.availableTags.map(tag => `
            <button class="tag-btn px-2 py-1 text-xs rounded-full transition ${
              this.selectedTags.includes(tag.id)
                ? 'bg-cyan-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }" data-tag="${tag.id}">
              ${tag.icon} ${tag.name}
            </button>
          `).join('')}
        </div>
      </div>
    `;
  }

  toggleTag(tagId) {
    const index = this.selectedTags.indexOf(tagId);
    if (index === -1) {
      this.selectedTags.push(tagId);
    } else {
      this.selectedTags.splice(index, 1);
    }
    this.updateTagsUI();
  }

  updateTagsUI() {
    document.querySelectorAll('.tag-btn').forEach(btn => {
      const tagId = btn.dataset.tag;
      if (this.selectedTags.includes(tagId)) {
        btn.classList.remove('bg-gray-800', 'text-gray-400', 'hover:bg-gray-700');
        btn.classList.add('bg-cyan-600', 'text-white');
      } else {
        btn.classList.add('bg-gray-800', 'text-gray-400', 'hover:bg-gray-700');
        btn.classList.remove('bg-cyan-600', 'text-white');
      }
    });
  }

  // ==========================================================================
  // BÚSQUEDA
  // ==========================================================================

  renderSearchBar() {
    return `
      <div class="smart-notes-search mb-4">
        <div class="relative">
          <input type="text"
                 id="notes-search-input"
                 class="w-full px-4 py-2 pl-10 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-cyan-500 transition text-sm"
                 placeholder="Buscar en mis notas..."
                 value="${this.searchQuery}">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
            ${Icons.search(16)}
          </span>
          ${this.searchQuery ? `
            <button id="clear-search-btn" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
              ${Icons.close(16)}
            </button>
          ` : ''}
        </div>
        <!-- Tag filters -->
        <div class="flex flex-wrap gap-1.5 mt-2">
          <span class="text-xs text-gray-500">Filtrar:</span>
          ${this.availableTags.map(tag => `
            <button class="filter-tag-btn px-2 py-0.5 text-xs rounded transition ${
              this.selectedTags.includes(tag.id)
                ? 'bg-cyan-900/50 text-cyan-300 border border-cyan-500/50'
                : 'bg-gray-800/50 text-gray-500 hover:text-gray-300'
            }" data-filter-tag="${tag.id}">
              ${tag.icon}
            </button>
          `).join('')}
        </div>
      </div>
    `;
  }

  filterNotes(notes) {
    let filtered = [...notes];

    // Filtrar por búsqueda
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(note =>
        note.content.toLowerCase().includes(query)
      );
    }

    // Filtrar por tags
    if (this.selectedTags.length > 0) {
      filtered = filtered.filter(note => {
        const noteTags = note.tags || [];
        return this.selectedTags.some(tag => noteTags.includes(tag));
      });
    }

    return filtered;
  }

  // ==========================================================================
  // SUGERENCIAS DE IA
  // ==========================================================================

  async getSuggestionForNote(noteContent, chapterContent) {
    if (!window.aiAdapter || !window.aiConfig?.getClaudeApiKey()) {
      return null;
    }

    const prompt = `Basándote en esta nota del usuario y el contexto del capítulo, sugiere UNA pregunta de profundización o reflexión adicional. Sé breve (máx 1 línea).

NOTA DEL USUARIO:
${noteContent.substring(0, 500)}

CONTEXTO DEL CAPÍTULO:
${chapterContent.substring(0, 1000)}

Responde SOLO con la pregunta sugerida, sin explicaciones.`;

    try {
      const response = await window.aiAdapter.ask(prompt, '', []);
      return response?.trim();
    } catch (error) {
      console.error('Error getting note suggestion:', error);
      return null;
    }
  }

  renderNoteSuggestion(suggestion) {
    if (!suggestion) return '';

    return `
      <div class="note-suggestion mt-3 p-3 bg-purple-900/20 border border-purple-500/30 rounded-lg">
        <div class="flex items-start gap-2">
          <span class="text-lg">💡</span>
          <div class="flex-1">
            <p class="text-sm text-purple-200">${suggestion}</p>
            <button class="use-suggestion-btn mt-2 text-xs text-purple-400 hover:text-purple-300 underline"
                    data-suggestion="${suggestion}">
              Usar esta pregunta
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // ==========================================================================
  // ESTADÍSTICAS DE NOTAS
  // ==========================================================================

  getNotesStats() {
    const allNotes = [];
    const notes = this.notesModal?.notes || {};

    for (const key in notes) {
      allNotes.push(...notes[key]);
    }

    const stats = {
      total: allNotes.length,
      byTag: {},
      thisWeek: 0,
      thisMonth: 0
    };

    const now = new Date();
    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

    for (const note of allNotes) {
      // Por tag
      const tags = note.tags || ['sin-etiqueta'];
      for (const tag of tags) {
        stats.byTag[tag] = (stats.byTag[tag] || 0) + 1;
      }

      // Por tiempo
      const noteDate = new Date(note.created);
      if (noteDate >= weekAgo) stats.thisWeek++;
      if (noteDate >= monthAgo) stats.thisMonth++;
    }

    return stats;
  }

  renderNotesStats() {
    const stats = this.getNotesStats();

    return `
      <div class="notes-stats grid grid-cols-3 gap-3 mb-4">
        <div class="bg-gray-800/50 rounded-lg p-3 text-center border border-gray-700/50">
          <div class="text-2xl font-bold text-cyan-400">${stats.total}</div>
          <div class="text-xs text-gray-400">Total notas</div>
        </div>
        <div class="bg-gray-800/50 rounded-lg p-3 text-center border border-gray-700/50">
          <div class="text-2xl font-bold text-green-400">${stats.thisWeek}</div>
          <div class="text-xs text-gray-400">Esta semana</div>
        </div>
        <div class="bg-gray-800/50 rounded-lg p-3 text-center border border-gray-700/50">
          <div class="text-2xl font-bold text-purple-400">${stats.thisMonth}</div>
          <div class="text-xs text-gray-400">Este mes</div>
        </div>
      </div>
    `;
  }

  // ==========================================================================
  // INTEGRACIÓN CON MODAL DE NOTAS
  // ==========================================================================

  enhanceNotesModal() {
    // Escuchar cuando se abre el modal de notas
    const originalRender = this.notesModal.render.bind(this.notesModal);

    this.notesModal.render = () => {
      originalRender();
      this.injectSmartFeatures();
    };
  }

  injectSmartFeatures() {
    // Inyectar plantillas antes del textarea
    const noteInput = document.getElementById('note-input');
    if (noteInput) {
      const inputContainer = noteInput.closest('.border-t');
      if (inputContainer) {
        // Insertar plantillas y tags
        const smartFeaturesHtml = `
          <div id="smart-notes-features" class="px-4 pt-4">
            ${this.renderTemplateSelector()}
            ${this.renderTagSelector()}
          </div>
        `;
        inputContainer.insertAdjacentHTML('afterbegin', smartFeaturesHtml);
        this.attachSmartListeners();
      }
    }

    // Inyectar búsqueda y stats en la vista de todas las notas
    if (!this.notesModal.currentChapterId) {
      const content = document.querySelector('#notes-modal .overflow-y-auto');
      if (content) {
        const searchAndStats = `
          <div id="smart-notes-header">
            ${this.renderNotesStats()}
            ${this.renderSearchBar()}
          </div>
        `;
        content.insertAdjacentHTML('afterbegin', searchAndStats);
        this.attachSearchListeners();
      }
    }
  }

  attachSmartListeners() {
    // Template buttons
    document.querySelectorAll('.template-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const template = btn.dataset.template;
        this.applyTemplate(template);
      });
    });

    // Tag buttons
    document.querySelectorAll('.tag-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tag = btn.dataset.tag;
        this.toggleTag(tag);
      });
    });

    // Interceptar guardado de nota para añadir tags
    const saveBtn = document.getElementById('save-note-btn');
    if (saveBtn) {
      const originalHandler = () => {
        const textarea = document.getElementById('note-input');
        if (!textarea || !textarea.value.trim()) return;

        // Modificar addNote para incluir tags
        const originalAddNote = this.notesModal.addNote.bind(this.notesModal);
        this.notesModal.addNote = (chapterId, content) => {
          const note = originalAddNote(chapterId, content);
          // Añadir tags a la nota
          if (note && this.selectedTags.length > 0) {
            note.tags = [...this.selectedTags];
            this.notesModal.saveNotes();
          }
          // Reset tags
          this.selectedTags = [];
          return note;
        };
      };

      // Add listener before the original
      saveBtn.addEventListener('click', originalHandler, true);
    }
  }

  attachSearchListeners() {
    const searchInput = document.getElementById('notes-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        this.refreshFilteredNotes();
      });
    }

    const clearBtn = document.getElementById('clear-search-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.searchQuery = '';
        const input = document.getElementById('notes-search-input');
        if (input) input.value = '';
        this.refreshFilteredNotes();
      });
    }

    // Filter tag buttons
    document.querySelectorAll('.filter-tag-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tag = btn.dataset.filterTag;
        this.toggleTag(tag);
        this.refreshFilteredNotes();
      });
    });
  }

  refreshFilteredNotes() {
    // Re-render the notes list with filters applied
    const allNotes = this.notesModal.getAllNotes();
    const filtered = this.filterNotes(allNotes);

    const container = document.querySelector('#notes-modal .space-y-4');
    if (container) {
      if (filtered.length === 0) {
        container.innerHTML = `
          <div class="text-center py-8 text-gray-500">
            <div class="text-4xl mb-2">🔍</div>
            <p>No se encontraron notas</p>
          </div>
        `;
      } else {
        container.innerHTML = filtered.map(note => {
          const chapter = this.bookEngine.getChapter(note.chapterId);
          return this.notesModal.renderNoteCard(note, chapter?.title);
        }).join('');

        // Re-attach note card listeners
        this.notesModal.attachEventListeners();
      }
    }
  }

  // ==========================================================================
  // MODAL DE REFLEXIÓN GUIADA
  // ==========================================================================

  showGuidedReflectionModal(chapterId) {
    const chapter = this.bookEngine.getChapter(chapterId);
    if (!chapter) return;

    const existing = document.getElementById('guided-reflection-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'guided-reflection-modal';
    modal.className = 'fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-50 p-4';
    modal.style.animation = 'fadeIn 0.3s ease-out';

    modal.innerHTML = `
      <div class="bg-gradient-to-br from-gray-900 to-purple-900/30 rounded-2xl shadow-2xl max-w-lg w-full border border-purple-500/30">
        <!-- Header -->
        <div class="bg-purple-900/50 px-6 py-4 border-b border-purple-500/30 rounded-t-2xl">
          <div class="flex items-center gap-3">
            <span class="text-3xl">🧘</span>
            <div>
              <h2 class="text-xl font-bold text-purple-200">Reflexión Guiada</h2>
              <p class="text-sm text-purple-300/70">${chapter.title}</p>
            </div>
          </div>
        </div>

        <!-- Steps -->
        <div class="p-6 space-y-4">
          <div class="reflection-step">
            <label class="block text-sm font-semibold text-purple-300 mb-2">
              1. ¿Qué idea principal te llevas de este capítulo?
            </label>
            <textarea id="reflection-main-idea" class="w-full h-20 bg-gray-800/50 border border-gray-700 rounded-lg p-3 text-sm resize-none focus:outline-none focus:border-purple-500" placeholder="La idea más importante es..."></textarea>
          </div>

          <div class="reflection-step">
            <label class="block text-sm font-semibold text-purple-300 mb-2">
              2. ¿Cómo se conecta con tu experiencia personal?
            </label>
            <textarea id="reflection-personal" class="w-full h-20 bg-gray-800/50 border border-gray-700 rounded-lg p-3 text-sm resize-none focus:outline-none focus:border-purple-500" placeholder="Esto me recuerda a..."></textarea>
          </div>

          <div class="reflection-step">
            <label class="block text-sm font-semibold text-purple-300 mb-2">
              3. ¿Qué acción concreta puedes tomar?
            </label>
            <textarea id="reflection-action" class="w-full h-20 bg-gray-800/50 border border-gray-700 rounded-lg p-3 text-sm resize-none focus:outline-none focus:border-purple-500" placeholder="Voy a..."></textarea>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 border-t border-purple-500/30 flex justify-between">
          <button id="close-guided-reflection" class="px-4 py-2 text-gray-400 hover:text-white transition">
            Cancelar
          </button>
          <button id="save-guided-reflection" class="px-6 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg font-semibold transition">
            Guardar Reflexión
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this.attachGuidedReflectionListeners(chapterId);
  }

  attachGuidedReflectionListeners(chapterId) {
    const modal = document.getElementById('guided-reflection-modal');
    if (!modal) return;

    // Close
    document.getElementById('close-guided-reflection')?.addEventListener('click', () => {
      modal.remove();
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });

    // Save
    document.getElementById('save-guided-reflection')?.addEventListener('click', () => {
      const mainIdea = document.getElementById('reflection-main-idea')?.value.trim();
      const personal = document.getElementById('reflection-personal')?.value.trim();
      const action = document.getElementById('reflection-action')?.value.trim();

      if (!mainIdea && !personal && !action) {
        window.toast?.warning('Escribe al menos una reflexión');
        return;
      }

      // Construir nota compuesta
      let content = '## 🧘 Reflexión Guiada\n\n';
      if (mainIdea) content += `**Idea principal:**\n${mainIdea}\n\n`;
      if (personal) content += `**Conexión personal:**\n${personal}\n\n`;
      if (action) content += `**Acción a tomar:**\n${action}\n\n`;

      // Guardar como nota
      if (this.notesModal) {
        const note = this.notesModal.addNote(chapterId, content);
        if (note) {
          note.tags = ['reflexion', 'guiada'];
          this.notesModal.saveNotes();
        }
      }

      // Track logro
      if (window.achievementSystem) {
        window.achievementSystem.trackReflexionSaved();
      }

      window.toast?.success('Reflexión guardada');
      modal.remove();
    });
  }
}

// Exportar
window.SmartNotes = SmartNotes;
