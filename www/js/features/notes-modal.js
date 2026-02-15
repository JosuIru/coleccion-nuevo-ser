// ============================================================================
// NOTES MODAL - Sistema de Notas Personales
// ============================================================================
// Modal para crear, editar y gestionar notas por capítulo
// v2.9.368: Búsqueda y etiquetas

class NotesModal {
  constructor(bookEngine) {
    this.bookEngine = bookEngine;
    this.i18n = window.i18n || new I18n();
    this.isOpen = false;
    this.currentChapterId = null;
    this.notes = this.loadNotes();
    this.previousActiveElement = null; // For accessibility focus restoration

    // v2.9.368: Búsqueda y filtros
    this.searchQuery = '';
    this.selectedTags = [];
    this.allTags = this.extractAllTags();

    // 🔧 FIX #86: Usar EventManager para prevenir memory leaks
    this.eventManager = new EventManager();

    // 🔧 FIX v2.9.269: Focus trap para accesibilidad
    this.focusTrap = null;
  }

  // ==========================================================================
  // v2.9.368: BÚSQUEDA Y ETIQUETAS
  // ==========================================================================

  extractAllTags() {
    const tags = new Set();
    for (const key in this.notes) {
      for (const note of this.notes[key]) {
        if (note.tags) {
          note.tags.forEach(tag => tags.add(tag));
        }
      }
    }
    return [...tags].sort();
  }

  searchNotes(notes) {
    if (!this.searchQuery && this.selectedTags.length === 0) {
      return notes;
    }

    return notes.filter(note => {
      // Filtrar por texto
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        const matchesText = note.content.toLowerCase().includes(query);
        if (!matchesText) return false;
      }

      // Filtrar por etiquetas
      if (this.selectedTags.length > 0) {
        const noteTags = note.tags || [];
        const hasAllTags = this.selectedTags.every(tag => noteTags.includes(tag));
        if (!hasAllTags) return false;
      }

      return true;
    });
  }

  addTagToNote(noteId, tag) {
    const normalizedTag = tag.trim().toLowerCase().replace(/[^a-záéíóúñü0-9]/g, '');
    if (!normalizedTag) return;

    for (const key in this.notes) {
      const note = this.notes[key].find(n => n.id === noteId);
      if (note) {
        if (!note.tags) note.tags = [];
        if (!note.tags.includes(normalizedTag)) {
          note.tags.push(normalizedTag);
          this.saveNotes();
          this.allTags = this.extractAllTags();
        }
        break;
      }
    }
  }

  removeTagFromNote(noteId, tag) {
    for (const key in this.notes) {
      const note = this.notes[key].find(n => n.id === noteId);
      if (note && note.tags) {
        const index = note.tags.indexOf(tag);
        if (index > -1) {
          note.tags.splice(index, 1);
          this.saveNotes();
          this.allTags = this.extractAllTags();
        }
        break;
      }
    }
  }

  toggleTagFilter(tag) {
    const index = this.selectedTags.indexOf(tag);
    if (index === -1) {
      this.selectedTags.push(tag);
    } else {
      this.selectedTags.splice(index, 1);
    }
    this.render();
    this.attachEventListeners();
  }

  // ==========================================================================
  // GESTIÓN DE DATOS
  // ==========================================================================

  loadNotes() {
    // 🔧 FIX v2.9.198: Error handling - prevent silent failures in localStorage operations
    try {
      const stored = localStorage.getItem('coleccion_notes');
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      logger.error('Error cargando notas:', error);
      return {};
    }
  }

  saveNotes() {
    // 🔧 FIX v2.9.198: Error handling - prevent silent failures in localStorage operations
    try {
      localStorage.setItem('coleccion_notes', JSON.stringify(this.notes));
    } catch (error) {
      logger.error('Error guardando notas:', error);
      window.toast?.error('Error al guardar nota. Intenta de nuevo.');
      return; // No intentar sincronizar si falla guardar localmente
    }

    // 🔧 FIX #18: Verificación explícita de window.supabaseSyncHelper con logging
    if (window.authHelper?.user && typeof window.supabaseSyncHelper?.syncSettingsToCloud === 'function') {
      try {
        window.supabaseSyncHelper.syncSettingsToCloud(['coleccion_notes']);
        if (window.logger) {
          window.logger.info('[Notes] Notas sincronizadas con Supabase');
        }
      } catch (error) {
        if (window.logger) {
          window.logger.warn('[Notes] No se pudo sincronizar notas con Supabase:', error);
        }
      }
    } else if (window.authHelper?.user) {
      // 🔧 FIX #18: Warning explícito cuando supabaseSyncHelper no está disponible
      if (window.logger) {
        window.logger.warn('[Notes] Supabase sync helper not available');
      }
    }
  }

  getChapterNotes(chapterId) {
    const bookId = this.bookEngine.getCurrentBook();
    const key = `${bookId}_${chapterId}`;
    return this.notes[key] || [];
  }

  addNote(chapterId, content) {
    const bookId = this.bookEngine.getCurrentBook();
    const key = `${bookId}_${chapterId}`;

    if (!this.notes[key]) {
      this.notes[key] = [];
    }

    const note = {
      id: `note_${Date.now()}`,
      content: content.trim(),
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      bookId,
      chapterId
    };

    this.notes[key].push(note);
    this.saveNotes();

    // Track para logros
    if (window.achievementSystem) {
      window.achievementSystem.trackNoteCreated();
    }

    return note;
  }

  updateNote(noteId, content) {
    for (const key in this.notes) {
      const noteIndex = this.notes[key].findIndex(n => n.id === noteId);
      if (noteIndex !== -1) {
        this.notes[key][noteIndex].content = content.trim();
        this.notes[key][noteIndex].updated = new Date().toISOString();
        this.saveNotes();
        return true;
      }
    }
    return false;
  }

  deleteNote(noteId) {
    for (const key in this.notes) {
      const noteIndex = this.notes[key].findIndex(n => n.id === noteId);
      if (noteIndex !== -1) {
        this.notes[key].splice(noteIndex, 1);
        this.saveNotes();
        return true;
      }
    }
    return false;
  }

  getAllNotes(bookId = null) {
    const targetBookId = bookId || this.bookEngine.getCurrentBook();
    const allNotes = [];

    for (const key in this.notes) {
      if (key.startsWith(targetBookId + '_')) {
        allNotes.push(...this.notes[key]);
      }
    }

    return allNotes.sort((a, b) =>
      new Date(b.updated) - new Date(a.updated)
    );
  }

  // ==========================================================================
  // UI - RENDERIZADO
  // ==========================================================================

  open(chapterId = null) {
    if (this.isOpen) return;

    // Registrar uso de feature para hints contextuales
    if (window.contextualHints) {
      window.contextualHints.markFeatureUsed('notes');
    }

    // Guardar elemento activo para restaurar después
    this.previousActiveElement = document.activeElement;

    this.currentChapterId = chapterId;
    this.isOpen = true;
    this.render();
    this.attachEventListeners();

    // 🔧 FIX v2.9.269: Activar focus trap para accesibilidad
    setTimeout(() => {
      const modal = document.getElementById('notes-modal');
      if (modal && window.createFocusTrap) {
        this.focusTrap = window.createFocusTrap(modal);
      }
      // Focus en textarea si está creando nueva nota
      const textarea = document.getElementById('note-input');
      if (textarea) {
        textarea.focus();
      }
    }, 100);
  }

  close() {
    // 🔧 FIX v2.9.269: Desactivar focus trap
    if (this.focusTrap) {
      this.focusTrap.deactivate();
      this.focusTrap = null;
    }
    // 🔧 FIX #86: Limpiar todos los event listeners con EventManager
    this.eventManager.cleanup();

    const modal = document.getElementById('notes-modal');
    if (modal) {
      modal.classList.add('opacity-0');
      setTimeout(() => {
        modal.remove();
        this.isOpen = false;
      }, 200);
    }

    // Restaurar foco al elemento previo para accesibilidad
    if (this.previousActiveElement && typeof this.previousActiveElement.focus === 'function') {
      this.previousActiveElement.focus();
      this.previousActiveElement = null;
    }
  }

  render() {
    // Remover modal existente si hay
    const existing = document.getElementById('notes-modal');
    if (existing) existing.remove();

    const bookData = this.bookEngine.getCurrentBookData();
    const chapter = this.currentChapterId
      ? this.bookEngine.getChapter(this.currentChapterId)
      : null;

    const html = `
      <div id="notes-modal"
           role="dialog"
           aria-modal="true"
           aria-labelledby="notes-modal-title"
           class="fixed inset-0 bg-black/80 backdrop-blur-sm z-[10000] flex items-center justify-center p-2 sm:p-4 transition-opacity duration-200">
        <div class="bg-slate-900/95 rounded-xl sm:rounded-2xl border border-slate-700 shadow-2xl max-w-4xl w-full h-[90vh] sm:h-[85vh] flex flex-col overflow-hidden">

          <!-- Header -->
          ${this.renderHeader(bookData, chapter)}

          <!-- Content -->
          <div class="flex-1 overflow-y-auto p-3 sm:p-6">
            ${this.currentChapterId
              ? this.renderChapterNotes()
              : this.renderAllNotes()
            }
          </div>

          <!-- Footer con textarea para nueva nota -->
          ${this.currentChapterId ? this.renderNewNoteInput() : ''}

        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', html);

    // Fade in
    setTimeout(() => {
      const modal = document.getElementById('notes-modal');
      if (modal) modal.classList.remove('opacity-0');
    }, 10);
  }

  renderHeader(bookData, chapter) {
    return `
      <div class="border-b border-slate-700 p-3 sm:p-6 bg-slate-800/50">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
          <div class="flex-1 min-w-0 w-full sm:w-auto">
            <h2 id="notes-modal-title" class="text-lg sm:text-2xl font-bold mb-1 flex items-center gap-2 sm:gap-3">
              ${Icons.note(20)} <span class="truncate">${this.i18n.t('notes.title')}</span>
            </h2>
            <p class="text-xs sm:text-sm opacity-70 flex items-center gap-1 truncate">
              ${chapter
                ? `<span class="truncate">${bookData.title}</span> ${Icons.chevronRight(14)} <span class="truncate">${chapter.title}</span>`
                : `<span class="truncate">Todas las notas de ${bookData.title}</span>`
              }
            </p>
          </div>

          <div class="flex items-center gap-1 sm:gap-2 flex-shrink-0 w-full sm:w-auto justify-end">
            ${this.currentChapterId ? `
              <button id="view-all-notes-btn"
                      class="px-2 sm:px-4 py-1 sm:py-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition text-xs sm:text-sm whitespace-nowrap">
                ${this.i18n.t('notes.viewAll')}
              </button>
            ` : ''}
            <button id="export-notes-btn"
                    class="px-2 sm:px-4 py-1 sm:py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition text-xs sm:text-sm flex items-center gap-1 sm:gap-2 whitespace-nowrap">
              ${Icons.download(16)} <span class="hidden sm:inline">${this.i18n.t('btn.export')}</span>
            </button>
            <button id="close-notes-btn"
                    class="w-8 h-8 sm:w-10 sm:h-10 rounded-lg hover:bg-slate-700 transition flex items-center justify-center"
                    aria-label="Cerrar notas">
              ${Icons.close(20)}
            </button>
          </div>
        </div>

        <!-- v2.9.368: Búsqueda y filtros de etiquetas -->
        <div class="mt-4 space-y-3">
          <!-- Barra de búsqueda -->
          <div class="relative">
            <input type="text"
                   id="notes-search-input"
                   class="w-full px-4 py-2 pl-10 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:border-cyan-500 focus:outline-none"
                   placeholder="Buscar en notas..."
                   value="${this.escapeHtml(this.searchQuery)}">
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            ${this.searchQuery ? `
              <button id="clear-search-btn" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                ${Icons.close(16)}
              </button>
            ` : ''}
          </div>

          <!-- Filtros de etiquetas -->
          ${this.allTags.length > 0 ? `
            <div class="flex flex-wrap gap-2">
              <span class="text-xs text-gray-400 mr-1">🏷️</span>
              ${this.allTags.map(tag => `
                <button class="tag-filter-btn px-2 py-1 rounded-full text-xs transition ${
                  this.selectedTags.includes(tag)
                    ? 'bg-cyan-600 text-white'
                    : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                }" data-tag="${tag}">
                  #${tag}
                </button>
              `).join('')}
              ${this.selectedTags.length > 0 ? `
                <button id="clear-tags-btn" class="px-2 py-1 rounded-full text-xs bg-red-900/50 text-red-300 hover:bg-red-800 transition">
                  Limpiar filtros
                </button>
              ` : ''}
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  renderChapterNotes() {
    const allNotes = this.getChapterNotes(this.currentChapterId);
    const notes = this.searchNotes(allNotes); // v2.9.368: Aplicar búsqueda/filtros

    if (allNotes.length === 0) {
      return `
        <div class="text-center py-12 opacity-50">
          <div class="text-6xl mb-4">📝</div>
          <p class="text-lg">${this.i18n.t('notes.empty')}</p>
          <p class="text-sm mt-2">${this.i18n.t('notes.writeBelow')}</p>
        </div>
      `;
    }

    if (notes.length === 0) {
      return `
        <div class="text-center py-12 opacity-50">
          <div class="text-4xl mb-4">🔍</div>
          <p class="text-lg">No se encontraron notas</p>
          <p class="text-sm mt-2">Intenta con otros términos o filtros</p>
        </div>
      `;
    }

    return `
      <div class="space-y-4">
        ${notes.map(note => this.renderNoteCard(note)).join('')}
      </div>
    `;
  }

  renderAllNotes() {
    const allNotes = this.getAllNotes();
    const notes = this.searchNotes(allNotes); // v2.9.368: Aplicar búsqueda/filtros

    if (allNotes.length === 0) {
      return `
        <div class="text-center py-12 opacity-50">
          <div class="text-6xl mb-4">📝</div>
          <p class="text-lg">Aún no tienes notas en este libro</p>
          <p class="text-sm mt-2">Abre un capítulo y empieza a escribir</p>
        </div>
      `;
    }

    if (notes.length === 0) {
      return `
        <div class="text-center py-12 opacity-50">
          <div class="text-4xl mb-4">🔍</div>
          <p class="text-lg">No se encontraron notas</p>
          <p class="text-sm mt-2">Intenta con otros términos o filtros</p>
        </div>
      `;
    }

    return `
      <div class="space-y-4">
        ${notes.map(note => {
          const chapter = this.bookEngine.getChapter(note.chapterId);
          return this.renderNoteCard(note, chapter?.title);
        }).join('')}
      </div>
    `;
  }

  renderNoteCard(note, chapterTitle = null) {
    const date = new Date(note.updated);
    const dateStr = date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const tags = note.tags || [];

    return `
      <div class="note-card bg-slate-800/50 border border-slate-700 rounded-xl p-4 hover:border-cyan-500/50 transition group"
           data-note-id="${note.id}">

        ${chapterTitle ? `
          <div class="text-xs opacity-50 mb-2 flex items-center gap-1">${Icons.book(12)} ${chapterTitle}</div>
        ` : ''}

        <div class="note-content prose prose-invert prose-sm max-w-none mb-3">
          ${this.formatNoteContent(note.content)}
        </div>

        <!-- v2.9.368: Etiquetas de la nota -->
        <div class="flex flex-wrap items-center gap-1 mb-3">
          ${tags.map(tag => `
            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-cyan-900/30 text-cyan-400 border border-cyan-500/30">
              #${tag}
              <button class="remove-tag-btn hover:text-red-400" data-note-id="${note.id}" data-tag="${tag}" title="Quitar etiqueta">×</button>
            </span>
          `).join('')}
          <button class="add-tag-btn px-2 py-0.5 rounded-full text-xs bg-slate-700 text-gray-400 hover:bg-slate-600 hover:text-white transition"
                  data-note-id="${note.id}" title="Añadir etiqueta">
            + 🏷️
          </button>
        </div>

        <div class="flex items-center justify-between text-xs opacity-50">
          <span>${dateStr}</span>
          <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition">
            <button class="edit-note-btn px-3 py-1 rounded bg-slate-700 hover:bg-slate-600 flex items-center gap-1"
                    data-note-id="${note.id}">
              ${Icons.edit(14)} ${this.i18n.t('btn.edit')}
            </button>
            <button class="delete-note-btn px-3 py-1 rounded bg-red-900/50 hover:bg-red-800 flex items-center gap-1"
                    data-note-id="${note.id}">
              ${Icons.trash(14)} ${this.i18n.t('btn.delete')}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  renderNewNoteInput() {
    return `
      <div class="border-t border-slate-700 p-4 bg-slate-800/30">
        <!-- 🔧 v2.9.390: Toolbar WYSIWYG Markdown -->
        <div class="flex flex-wrap gap-1 mb-2 p-1 bg-slate-900/50 rounded-lg border border-slate-700">
          <button type="button" class="md-toolbar-btn" data-md="bold" title="Negrita (Ctrl+B)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
              <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
            </svg>
          </button>
          <button type="button" class="md-toolbar-btn" data-md="italic" title="Cursiva (Ctrl+I)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="19" y1="4" x2="10" y2="4"></line>
              <line x1="14" y1="20" x2="5" y2="20"></line>
              <line x1="15" y1="4" x2="9" y2="20"></line>
            </svg>
          </button>
          <span class="w-px h-6 bg-slate-600 mx-1"></span>
          <button type="button" class="md-toolbar-btn" data-md="h2" title="Título">
            <span class="font-bold text-sm">H2</span>
          </button>
          <button type="button" class="md-toolbar-btn" data-md="h3" title="Subtítulo">
            <span class="font-bold text-xs">H3</span>
          </button>
          <span class="w-px h-6 bg-slate-600 mx-1"></span>
          <button type="button" class="md-toolbar-btn" data-md="ul" title="Lista con viñetas">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="8" y1="6" x2="21" y2="6"></line>
              <line x1="8" y1="12" x2="21" y2="12"></line>
              <line x1="8" y1="18" x2="21" y2="18"></line>
              <circle cx="3" cy="6" r="1" fill="currentColor"></circle>
              <circle cx="3" cy="12" r="1" fill="currentColor"></circle>
              <circle cx="3" cy="18" r="1" fill="currentColor"></circle>
            </svg>
          </button>
          <button type="button" class="md-toolbar-btn" data-md="ol" title="Lista numerada">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="10" y1="6" x2="21" y2="6"></line>
              <line x1="10" y1="12" x2="21" y2="12"></line>
              <line x1="10" y1="18" x2="21" y2="18"></line>
              <text x="2" y="8" font-size="8" fill="currentColor">1</text>
              <text x="2" y="14" font-size="8" fill="currentColor">2</text>
              <text x="2" y="20" font-size="8" fill="currentColor">3</text>
            </svg>
          </button>
          <span class="w-px h-6 bg-slate-600 mx-1"></span>
          <button type="button" class="md-toolbar-btn" data-md="quote" title="Cita">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21z"></path>
              <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3z"></path>
            </svg>
          </button>
          <button type="button" class="md-toolbar-btn" data-md="link" title="Enlace">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
            </svg>
          </button>
        </div>
        <textarea id="note-input"
                  class="w-full h-32 bg-slate-800 border border-slate-600 rounded-lg p-3 resize-none focus:outline-none focus:border-cyan-500 transition font-mono text-sm"
                  placeholder="${this.i18n.t('notes.placeholder')}"></textarea>
        <div class="flex justify-between items-center mt-3">
          <span class="text-xs opacity-50 hidden sm:inline">
            💡 Selecciona texto y usa los botones para formatear
          </span>
          <button id="save-note-btn"
                  class="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-lg font-semibold transition flex items-center gap-2">
            💾 ${this.i18n.t('notes.saveNote')}
          </button>
        </div>
      </div>
    `;
  }

  escapeHtml(text) {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  formatNoteContent(content) {
    // Sanitizar primero para prevenir XSS
    let html = this.escapeHtml(content);

    // Headers (después de sanitizar)
    html = html.replace(/^### (.+)$/gm, '<h3 class="text-lg font-bold mt-4 mb-2">$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold mt-4 mb-2">$1</h2>');

    // Bold/Italic
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="text-cyan-400">$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em class="text-purple-300">$1</em>');

    // Lists
    const lines = html.split('\n');
    let inList = false;
    let result = [];

    for (let line of lines) {
      if (line.match(/^[\-\*]\s+(.+)$/)) {
        if (!inList) {
          result.push('<ul class="list-disc list-inside space-y-1">');
          inList = true;
        }
        result.push('<li>' + line.replace(/^[\-\*]\s+/, '') + '</li>');
      } else if (line.match(/^\d+\.\s+(.+)$/)) {
        if (!inList) {
          result.push('<ol class="list-decimal list-inside space-y-1">');
          inList = true;
        }
        result.push('<li>' + line.replace(/^\d+\.\s+/, '') + '</li>');
      } else {
        if (inList) {
          result.push('</ul>');
          inList = false;
        }
        if (line.trim()) {
          result.push('<p class="mb-2">' + line + '</p>');
        }
      }
    }

    if (inList) {
      result.push('</ul>');
    }

    return result.join('\n');
  }

  // ==========================================================================
  // EVENT LISTENERS
  // ==========================================================================

  attachEventListeners() {
    // 🔧 FIX #86: Usar EventManager para todos los listeners

    // Close button
    const closeBtn = document.getElementById('close-notes-btn');
    if (closeBtn) {
      this.eventManager.addEventListener(closeBtn, 'click', () => this.close());
    }

    // Close on ESC
    const escHandler = (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    };
    this.eventManager.addEventListener(document, 'keydown', escHandler);

    // Close on click outside
    const modal = document.getElementById('notes-modal');
    if (modal) {
      this.eventManager.addEventListener(modal, 'click', (e) => {
        if (e.target === modal) {
          this.close();
        }
      });
    }

    // Save note button
    const saveBtn = document.getElementById('save-note-btn');
    if (saveBtn) {
      this.eventManager.addEventListener(saveBtn, 'click', () => this.handleSaveNote());
    }

    // Enter con Ctrl para guardar + atajos de teclado markdown
    const textarea = document.getElementById('note-input');
    if (textarea) {
      this.eventManager.addEventListener(textarea, 'keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
          this.handleSaveNote();
        }
        // 🔧 v2.9.390: Atajos de teclado para formato markdown
        if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
          e.preventDefault();
          this.insertMarkdown(textarea, 'bold');
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
          e.preventDefault();
          this.insertMarkdown(textarea, 'italic');
        }
      });
    }

    // 🔧 v2.9.390: Toolbar markdown buttons
    const toolbarBtns = document.querySelectorAll('.md-toolbar-btn');
    toolbarBtns.forEach(btn => {
      this.eventManager.addEventListener(btn, 'click', (e) => {
        e.preventDefault();
        const mdType = btn.getAttribute('data-md');
        const textarea = document.getElementById('note-input');
        if (textarea && mdType) {
          this.insertMarkdown(textarea, mdType);
          textarea.focus();
        }
      });
    });

    // Edit buttons
    const editBtns = document.querySelectorAll('.edit-note-btn');
    editBtns.forEach(btn => {
      this.eventManager.addEventListener(btn, 'click', () => {
        const noteId = btn.getAttribute('data-note-id');
        this.handleEditNote(noteId);
      });
    });

    // Delete buttons
    const deleteBtns = document.querySelectorAll('.delete-note-btn');
    deleteBtns.forEach(btn => {
      this.eventManager.addEventListener(btn, 'click', () => {
        const noteId = btn.getAttribute('data-note-id');
        this.handleDeleteNote(noteId);
      });
    });

    // View all notes button
    const viewAllBtn = document.getElementById('view-all-notes-btn');
    if (viewAllBtn) {
      this.eventManager.addEventListener(viewAllBtn, 'click', () => {
        this.currentChapterId = null;
        this.render();
        this.attachEventListeners();
      });
    }

    // Export button
    const exportBtn = document.getElementById('export-notes-btn');
    if (exportBtn) {
      this.eventManager.addEventListener(exportBtn, 'click', () => this.exportNotes());
    }

    // v2.9.368: Búsqueda con debounce
    const searchInput = document.getElementById('notes-search-input');
    if (searchInput) {
      let searchTimeout;
      this.eventManager.addEventListener(searchInput, 'input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          this.searchQuery = e.target.value;
          this.render();
          this.attachEventListeners();
          // Restaurar foco en el input de búsqueda
          const newInput = document.getElementById('notes-search-input');
          if (newInput) {
            newInput.focus();
            newInput.setSelectionRange(newInput.value.length, newInput.value.length);
          }
        }, 300);
      });
    }

    // v2.9.368: Limpiar búsqueda
    const clearSearchBtn = document.getElementById('clear-search-btn');
    if (clearSearchBtn) {
      this.eventManager.addEventListener(clearSearchBtn, 'click', () => {
        this.searchQuery = '';
        this.render();
        this.attachEventListeners();
        const newInput = document.getElementById('notes-search-input');
        if (newInput) newInput.focus();
      });
    }

    // v2.9.368: Filtros de etiquetas
    const tagFilterBtns = document.querySelectorAll('.tag-filter-btn');
    tagFilterBtns.forEach(btn => {
      this.eventManager.addEventListener(btn, 'click', () => {
        const tag = btn.getAttribute('data-tag');
        this.toggleTagFilter(tag);
      });
    });

    // v2.9.368: Limpiar filtros de etiquetas
    const clearTagsBtn = document.getElementById('clear-tags-btn');
    if (clearTagsBtn) {
      this.eventManager.addEventListener(clearTagsBtn, 'click', () => {
        this.selectedTags = [];
        this.render();
        this.attachEventListeners();
      });
    }

    // v2.9.368: Añadir etiqueta a nota
    const addTagBtns = document.querySelectorAll('.add-tag-btn');
    addTagBtns.forEach(btn => {
      this.eventManager.addEventListener(btn, 'click', () => {
        const noteId = btn.getAttribute('data-note-id');
        this.showAddTagModal(noteId);
      });
    });

    // v2.9.368: Quitar etiqueta de nota
    const removeTagBtns = document.querySelectorAll('.remove-tag-btn');
    removeTagBtns.forEach(btn => {
      this.eventManager.addEventListener(btn, 'click', (e) => {
        e.stopPropagation();
        const noteId = btn.getAttribute('data-note-id');
        const tag = btn.getAttribute('data-tag');
        this.removeTagFromNote(noteId, tag);
        this.render();
        this.attachEventListeners();
      });
    });
  }

  // ==========================================================================
  // 🔧 v2.9.390: MARKDOWN TOOLBAR HELPER
  // ==========================================================================

  /**
   * Inserta formato markdown en el textarea
   * @param {HTMLTextAreaElement} textarea - El textarea donde insertar
   * @param {string} mdType - Tipo de markdown: bold, italic, h2, h3, ul, ol, quote, link
   */
  insertMarkdown(textarea, mdType) {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const beforeText = textarea.value.substring(0, start);
    const afterText = textarea.value.substring(end);

    let insertion = '';
    let cursorOffset = 0;

    switch (mdType) {
      case 'bold':
        if (selectedText) {
          insertion = `**${selectedText}**`;
          cursorOffset = insertion.length;
        } else {
          insertion = '**texto**';
          cursorOffset = 2; // Posicionar después de **
        }
        break;

      case 'italic':
        if (selectedText) {
          insertion = `*${selectedText}*`;
          cursorOffset = insertion.length;
        } else {
          insertion = '*texto*';
          cursorOffset = 1;
        }
        break;

      case 'h2':
        // Añadir al inicio de la línea
        const lineStartH2 = beforeText.lastIndexOf('\n') + 1;
        const lineTextH2 = beforeText.substring(lineStartH2);
        if (lineTextH2.startsWith('## ')) {
          // Ya tiene H2, quitarlo
          textarea.value = beforeText.substring(0, lineStartH2) + lineTextH2.substring(3) + selectedText + afterText;
          textarea.selectionStart = textarea.selectionEnd = start - 3;
          return;
        }
        insertion = selectedText ? `## ${selectedText}` : '## ';
        cursorOffset = selectedText ? insertion.length : 3;
        break;

      case 'h3':
        const lineStartH3 = beforeText.lastIndexOf('\n') + 1;
        const lineTextH3 = beforeText.substring(lineStartH3);
        if (lineTextH3.startsWith('### ')) {
          textarea.value = beforeText.substring(0, lineStartH3) + lineTextH3.substring(4) + selectedText + afterText;
          textarea.selectionStart = textarea.selectionEnd = start - 4;
          return;
        }
        insertion = selectedText ? `### ${selectedText}` : '### ';
        cursorOffset = selectedText ? insertion.length : 4;
        break;

      case 'ul':
        if (selectedText) {
          // Convertir líneas seleccionadas en lista
          const lines = selectedText.split('\n');
          insertion = lines.map(line => `- ${line.replace(/^[-*]\s*/, '')}`).join('\n');
          cursorOffset = insertion.length;
        } else {
          insertion = '- ';
          cursorOffset = 2;
        }
        break;

      case 'ol':
        if (selectedText) {
          const lines = selectedText.split('\n');
          insertion = lines.map((line, i) => `${i + 1}. ${line.replace(/^\d+\.\s*/, '')}`).join('\n');
          cursorOffset = insertion.length;
        } else {
          insertion = '1. ';
          cursorOffset = 3;
        }
        break;

      case 'quote':
        if (selectedText) {
          const lines = selectedText.split('\n');
          insertion = lines.map(line => `> ${line}`).join('\n');
          cursorOffset = insertion.length;
        } else {
          insertion = '> ';
          cursorOffset = 2;
        }
        break;

      case 'link':
        if (selectedText) {
          insertion = `[${selectedText}](url)`;
          cursorOffset = insertion.length - 4; // Antes de "url)"
        } else {
          insertion = '[texto](url)';
          cursorOffset = 1; // Después de "["
        }
        break;

      default:
        return;
    }

    textarea.value = beforeText + insertion + afterText;

    // Posicionar cursor
    if (selectedText) {
      textarea.selectionStart = textarea.selectionEnd = start + cursorOffset;
    } else {
      textarea.selectionStart = start + cursorOffset;
      textarea.selectionEnd = start + insertion.length - (mdType === 'bold' ? 2 : mdType === 'italic' ? 1 : 0);
    }
  }

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  handleSaveNote() {
    const textarea = document.getElementById('note-input');
    if (!textarea) return;

    const content = textarea.value.trim();
    if (!content) return;

    this.addNote(this.currentChapterId, content);
    textarea.value = '';

    // Re-render para mostrar la nueva nota
    this.render();
    this.attachEventListeners();
  }

  handleEditNote(noteId) {
    // Encontrar la nota
    let targetNote = null;
    for (const key in this.notes) {
      targetNote = this.notes[key].find(n => n.id === noteId);
      if (targetNote) break;
    }

    if (!targetNote) return;

    // 🔧 FIX #19: Modal inline en lugar de prompt()
    this.showEditModal(targetNote);
  }

  handleDeleteNote(noteId) {
    // 🔧 FIX #20: Modal custom en lugar de confirm()
    this.showConfirmModal(
      '¿Borrar esta nota?',
      'Esta acción no se puede deshacer.',
      () => {
        this.deleteNote(noteId);
        this.render();
        this.attachEventListeners();
      }
    );
  }

  exportNotes() {
    const bookId = this.bookEngine.getCurrentBook();
    const bookData = this.bookEngine.getCurrentBookData();
    const notes = this.getAllNotes(bookId);

    if (notes.length === 0) {
      alert('No hay notas para exportar en este libro.');
      return;
    }

    let markdown = `# Mis Notas - ${bookData.title}\n\n`;
    markdown += `Exportado: ${new Date().toLocaleString('es-ES')}\n\n`;
    markdown += `---\n\n`;

    // Agrupar por capítulo
    const notesByChapter = {};
    for (const note of notes) {
      if (!notesByChapter[note.chapterId]) {
        notesByChapter[note.chapterId] = [];
      }
      notesByChapter[note.chapterId].push(note);
    }

    for (const chapterId in notesByChapter) {
      const chapter = this.bookEngine.getChapter(chapterId);
      markdown += `## ${chapter?.title || chapterId}\n\n`;

      for (const note of notesByChapter[chapterId]) {
        const date = new Date(note.updated).toLocaleString('es-ES');
        markdown += `### Nota del ${date}\n\n`;
        markdown += note.content + '\n\n';
        markdown += `---\n\n`;
      }
    }

    // Descargar
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notas_${bookId}_${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ==========================================================================
  // 🔧 FIX #19 & #20: MODALES INLINE
  // ==========================================================================

  /**
   * 🔧 FIX #19: Modal inline para editar notas (reemplaza prompt())
   */
  showEditModal(note) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 animate-fade-in';
    modal.innerHTML = `
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full mx-4 p-6 animate-scale-in">
        <h3 class="text-xl font-bold mb-4 text-gray-900 dark:text-white">Editar Nota</h3>
        <textarea
          id="edit-note-textarea"
          class="w-full h-40 p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          placeholder="Escribe tu nota aquí..."
        >${this.escapeHtml(note.content)}</textarea>
        <div class="flex gap-3 justify-end mt-6">
          <button class="edit-note-cancel px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium transition">
            Cancelar
          </button>
          <button class="edit-note-save px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-bold transition">
            Guardar
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const textarea = modal.querySelector('#edit-note-textarea');
    const saveBtn = modal.querySelector('.edit-note-save');
    const cancelBtn = modal.querySelector('.edit-note-cancel');

    // Focus y seleccionar al final
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(note.content.length, note.content.length);
    }, 50);

    // 🔧 FIX #19: Función de limpieza centralizada para evitar memory leaks
    const cleanup = () => {
      document.removeEventListener('keydown', escHandler);
      modal.remove();
    };

    // Guardar
    const save = () => {
      const newContent = textarea.value.trim();
      if (newContent) {
        this.updateNote(note.id, newContent);
        this.render();
        this.attachEventListeners();
      }
      cleanup();
    };

    // ESC para cerrar
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        cleanup();
      }
    };
    document.addEventListener('keydown', escHandler);

    // Eventos
    saveBtn.addEventListener('click', save);
    cancelBtn.addEventListener('click', cleanup);

    // Ctrl+Enter para guardar
    textarea.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        save();
      }
    });

    // Click fuera para cerrar
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        cleanup();
      }
    });
  }

  /**
   * v2.9.368: Modal para añadir etiqueta a una nota
   */
  showAddTagModal(noteId) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-[10001] flex items-center justify-center bg-black/50 animate-fade-in';
    modal.innerHTML = `
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-sm w-full mx-4 p-6 animate-scale-in">
        <h3 class="text-lg font-bold mb-4 text-gray-900 dark:text-white">🏷️ Añadir Etiqueta</h3>
        <input
          type="text"
          id="new-tag-input"
          class="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          placeholder="Escribe una etiqueta..."
          maxlength="20"
        >
        ${this.allTags.length > 0 ? `
          <div class="mt-3">
            <p class="text-xs text-gray-500 dark:text-gray-400 mb-2">Etiquetas existentes:</p>
            <div class="flex flex-wrap gap-1">
              ${this.allTags.slice(0, 10).map(tag => `
                <button class="existing-tag-btn px-2 py-1 rounded-full text-xs bg-slate-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-cyan-500 hover:text-white transition" data-tag="${tag}">
                  #${tag}
                </button>
              `).join('')}
            </div>
          </div>
        ` : ''}
        <div class="flex gap-3 justify-end mt-6">
          <button class="add-tag-cancel px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium transition">
            Cancelar
          </button>
          <button class="add-tag-save px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-bold transition">
            Añadir
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const input = modal.querySelector('#new-tag-input');
    const saveBtn = modal.querySelector('.add-tag-save');
    const cancelBtn = modal.querySelector('.add-tag-cancel');
    const existingTagBtns = modal.querySelectorAll('.existing-tag-btn');

    setTimeout(() => input.focus(), 50);

    const cleanup = () => {
      document.removeEventListener('keydown', escHandler);
      modal.remove();
    };

    const save = () => {
      const tag = input.value.trim();
      if (tag) {
        this.addTagToNote(noteId, tag);
        this.render();
        this.attachEventListeners();
      }
      cleanup();
    };

    const escHandler = (e) => {
      if (e.key === 'Escape') cleanup();
    };
    document.addEventListener('keydown', escHandler);

    saveBtn.addEventListener('click', save);
    cancelBtn.addEventListener('click', cleanup);

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        save();
      }
    });

    // Click en etiqueta existente
    existingTagBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tag = btn.getAttribute('data-tag');
        this.addTagToNote(noteId, tag);
        this.render();
        this.attachEventListeners();
        cleanup();
      });
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) cleanup();
    });
  }

  /**
   * 🔧 FIX #20: Modal custom de confirmación (reemplaza confirm())
   */
  showConfirmModal(title, message, onConfirm) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 animate-fade-in';
    // 🔧 FIX v2.9.198: XSS prevention - sanitize title and message
    modal.innerHTML = `
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full mx-4 p-6 animate-scale-in">
        <h3 class="text-xl font-bold mb-3 text-gray-900 dark:text-white">${Sanitizer.escapeHtml(title)}</h3>
        <p class="text-gray-700 dark:text-gray-300 mb-6">${Sanitizer.escapeHtml(message)}</p>
        <div class="flex gap-3 justify-end">
          <button class="confirm-cancel px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium transition">
            Cancelar
          </button>
          <button class="confirm-ok px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold transition">
            Borrar
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const okBtn = modal.querySelector('.confirm-ok');
    const cancelBtn = modal.querySelector('.confirm-cancel');

    // Focus en botón de cancelar por seguridad
    setTimeout(() => cancelBtn.focus(), 50);

    // 🔧 FIX #19: Función de limpieza centralizada para evitar memory leaks
    const cleanup = () => {
      document.removeEventListener('keydown', escHandler);
      modal.remove();
    };

    // ESC para cerrar
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        cleanup();
      }
    };
    document.addEventListener('keydown', escHandler);

    // Confirmar
    okBtn.addEventListener('click', () => {
      cleanup();
      if (onConfirm) onConfirm();
    });

    // Cancelar
    cancelBtn.addEventListener('click', cleanup);

    // Click fuera para cerrar
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        cleanup();
      }
    });
  }

  // ==========================================================================
  // API PÚBLICA
  // ==========================================================================

  getNotesCount(chapterId = null) {
    if (chapterId) {
      return this.getChapterNotes(chapterId).length;
    } else {
      return this.getAllNotes().length;
    }
  }
}

// Exportar para uso global
window.NotesModal = NotesModal;

// 🔧 v2.9.338: Crear instancia global para que el botón de Notas funcione
// La instancia se crea cuando el DOM está listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (!window.notesModal) {
      window.notesModal = new NotesModal(window.bookEngine);
    }
  });
} else {
  if (!window.notesModal) {
    window.notesModal = new NotesModal(window.bookEngine);
  }
}
