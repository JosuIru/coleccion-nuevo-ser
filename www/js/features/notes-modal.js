// ============================================================================
// NOTES MODAL - Sistema de Notas Personales
// ============================================================================
// Modal para crear, editar y gestionar notas por capítulo

class NotesModal {
  constructor(bookEngine) {
    this.bookEngine = bookEngine;
    this.i18n = window.i18n || new I18n();
    this.isOpen = false;
    this.currentChapterId = null;
    this.notes = this.loadNotes();
    this.previousActiveElement = null; // For accessibility focus restoration

    // 🔧 FIX #86: Usar EventManager para prevenir memory leaks
    this.eventManager = new EventManager();
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
      console.error('Error cargando notas:', error);
      return {};
    }
  }

  saveNotes() {
    // 🔧 FIX v2.9.198: Error handling - prevent silent failures in localStorage operations
    try {
      localStorage.setItem('coleccion_notes', JSON.stringify(this.notes));
    } catch (error) {
      console.error('Error guardando notas:', error);
      window.toast?.error('Error al guardar nota. Intenta de nuevo.');
      return; // No intentar sincronizar si falla guardar localmente
    }

    // 🔧 FIX #18: Verificación explícita de window.supabaseSyncHelper con logging
    if (window.authHelper && window.authHelper.user) {
      if (window.supabaseSyncHelper) {
        try {
          window.supabaseSyncHelper.syncPreference('coleccion_notes', this.notes);
          if (window.logger) {
            window.logger.info('[Notes] Notas sincronizadas con Supabase');
          }
        } catch (error) {
          if (window.logger) {
            window.logger.warn('[Notes] No se pudo sincronizar notas con Supabase:', error);
          }
        }
      } else {
        // 🔧 FIX #18: Warning explícito cuando supabaseSyncHelper no está disponible
        if (window.logger) {
          window.logger.warn('[Notes] Supabase sync helper not available');
        }
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

    // Focus en textarea si está creando nueva nota, o en primer elemento focusable
    setTimeout(() => {
      const textarea = document.getElementById('note-input');
      if (textarea) {
        textarea.focus();
      } else {
        const modal = document.getElementById('notes-modal');
        const firstFocusable = modal?.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (firstFocusable) firstFocusable.focus();
      }
    }, 100);
  }

  close() {
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
      <div class="border-b border-slate-700 p-3 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 bg-slate-800/50">
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
    `;
  }

  renderChapterNotes() {
    const notes = this.getChapterNotes(this.currentChapterId);

    if (notes.length === 0) {
      return `
        <div class="text-center py-12 opacity-50">
          <div class="text-6xl mb-4">📝</div>
          <p class="text-lg">${this.i18n.t('notes.empty')}</p>
          <p class="text-sm mt-2">${this.i18n.t('notes.writeBelow')}</p>
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
    const notes = this.getAllNotes();

    if (notes.length === 0) {
      return `
        <div class="text-center py-12 opacity-50">
          <div class="text-6xl mb-4">📝</div>
          <p class="text-lg">Aún no tienes notas en este libro</p>
          <p class="text-sm mt-2">Abre un capítulo y empieza a escribir</p>
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

    return `
      <div class="note-card bg-slate-800/50 border border-slate-700 rounded-xl p-4 hover:border-cyan-500/50 transition group"
           data-note-id="${note.id}">

        ${chapterTitle ? `
          <div class="text-xs opacity-50 mb-2 flex items-center gap-1">${Icons.book(12)} ${chapterTitle}</div>
        ` : ''}

        <div class="note-content prose prose-invert prose-sm max-w-none mb-3">
          ${this.formatNoteContent(note.content)}
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
        <textarea id="note-input"
                  class="w-full h-32 bg-slate-800 border border-slate-600 rounded-lg p-3 resize-none focus:outline-none focus:border-cyan-500 transition"
                  placeholder="${this.i18n.t('notes.placeholder')}"></textarea>
        <div class="flex justify-between items-center mt-3">
          <span class="text-xs opacity-50">
            💡 Usa **negrita**, *cursiva*, listas con - o 1.
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

    // Enter con Ctrl para guardar
    const textarea = document.getElementById('note-input');
    if (textarea) {
      this.eventManager.addEventListener(textarea, 'keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
          this.handleSaveNote();
        }
      });
    }

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
