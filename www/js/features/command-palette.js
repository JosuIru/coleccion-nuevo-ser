// ============================================================================
// COMMAND PALETTE - Paleta de comandos con Ctrl/Cmd+K
// ============================================================================
// v2.9.355: Fix acciones - audio, navegación, tamaño fuente; condición visibilidad
// v2.9.354: Nuevo componente de acceso rápido
// Permite buscar y ejecutar comandos con el teclado

class CommandPalette {
  constructor() {
    this.isOpen = false;
    this.selectedIndex = 0;
    this.searchQuery = '';
    this.filteredCommands = [];

    // EventManager para cleanup automático
    this.eventManager = new EventManager();
    this.eventManager.setComponentName('CommandPalette');

    // i18n
    this.i18n = window.i18n || { t: (key) => key };

    // Definir comandos
    this.commands = this.defineCommands();

    // Inicializar listener global
    this.init();
  }

  // ==========================================================================
  // DEFINICIÓN DE COMANDOS
  // ==========================================================================

  defineCommands() {
    return [
      // NAVEGACIÓN
      {
        id: 'nav-prev',
        label: 'Capítulo Anterior',
        category: 'Navegación',
        icon: 'chevron-left',
        shortcut: '←',
        action: () => this.navigatePrev()
      },
      {
        id: 'nav-next',
        label: 'Capítulo Siguiente',
        category: 'Navegación',
        icon: 'chevron-right',
        shortcut: '→',
        action: () => this.navigateNext()
      },
      {
        id: 'nav-toc',
        label: 'Mostrar Índice',
        category: 'Navegación',
        icon: 'list',
        action: () => window.bookReader?.sidebar?.toggleSidebar()
      },
      {
        id: 'nav-library',
        label: 'Volver a Biblioteca',
        category: 'Navegación',
        icon: 'home',
        shortcut: 'Esc',
        action: () => window.bookReader?.backToLibrary()
      },
      {
        id: 'nav-search',
        label: 'Buscar en Libro',
        category: 'Navegación',
        icon: 'search',
        shortcut: 'Ctrl+F',
        action: () => window.searchModal?.open()
      },

      // HERRAMIENTAS
      {
        id: 'tool-ai',
        label: 'Chat con IA',
        category: 'Herramientas',
        icon: 'bot',
        shortcut: 'Ctrl+I',
        action: () => window.aiChatModal?.open()
      },
      {
        id: 'tool-notes',
        label: 'Mis Notas',
        category: 'Herramientas',
        icon: 'file-text',
        shortcut: 'Ctrl+N',
        action: () => window.notesModal?.open()
      },
      {
        id: 'tool-bookmark',
        label: 'Agregar/Quitar Marcador',
        category: 'Herramientas',
        icon: 'bookmark',
        shortcut: 'Ctrl+B',
        action: () => this.toggleBookmark()
      },
      {
        id: 'tool-share',
        label: 'Compartir Capítulo',
        category: 'Herramientas',
        icon: 'share-2',
        action: () => window.shareHelper?.shareChapter?.() || this.showToast('Compartir no disponible')
      },
      {
        id: 'tool-resources',
        label: 'Recursos del Capítulo',
        category: 'Herramientas',
        icon: 'folder',
        action: () => window.chapterResourcesModal?.open()
      },

      // MULTIMEDIA
      {
        id: 'audio-toggle',
        label: 'Reproducir/Pausar Audio',
        category: 'Multimedia',
        icon: 'headphones',
        shortcut: 'Space',
        action: () => this.toggleAudio()
      },
      {
        id: 'audio-binaural',
        label: 'Sonidos Binaurales',
        category: 'Multimedia',
        icon: 'waves',
        action: () => window.binauralModal?.open()
      },

      // CONFIGURACIÓN
      {
        id: 'config-font-up',
        label: 'Aumentar Tamaño de Fuente',
        category: 'Configuración',
        icon: 'zoom-in',
        shortcut: 'Ctrl++',
        action: () => this.adjustFontSize(2)
      },
      {
        id: 'config-font-down',
        label: 'Reducir Tamaño de Fuente',
        category: 'Configuración',
        icon: 'zoom-out',
        shortcut: 'Ctrl+-',
        action: () => this.adjustFontSize(-2)
      },
      {
        id: 'config-theme',
        label: 'Cambiar Tema (Claro/Oscuro)',
        category: 'Configuración',
        icon: 'moon',
        action: () => this.toggleTheme()
      },
      {
        id: 'config-settings',
        label: 'Abrir Configuración',
        category: 'Configuración',
        icon: 'settings',
        action: () => window.settingsModalInstance?.show?.()
      },
      {
        id: 'config-ai',
        label: 'Configurar IA',
        category: 'Configuración',
        icon: 'cpu',
        action: () => window.aiSettingsModal?.open()
      }
    ];
  }

  // ==========================================================================
  // INICIALIZACIÓN
  // ==========================================================================

  init() {
    // Listener global para Ctrl/Cmd+K
    this.keydownHandler = (e) => {
      // Ctrl+K o Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        this.toggle();
      }
    };

    document.addEventListener('keydown', this.keydownHandler);
  }

  // ==========================================================================
  // TOGGLE / OPEN / CLOSE
  // ==========================================================================

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  open() {
    if (this.isOpen) return;

    // Solo abrir si estamos en book-reader (no tiene clase 'hidden')
    const bookReaderView = document.getElementById('book-reader-view');
    if (!bookReaderView || bookReaderView.classList.contains('hidden')) {
      return;
    }

    this.isOpen = true;
    this.searchQuery = '';
    this.selectedIndex = 0;
    this.filteredCommands = [...this.commands];

    this.render();
    this.attachEventListeners();

    // Focus en input
    setTimeout(() => {
      document.getElementById('command-palette-input')?.focus();
    }, 50);
  }

  close() {
    if (!this.isOpen) return;

    this.isOpen = false;
    this.eventManager.cleanup();

    const modal = document.getElementById('command-palette');
    if (modal) {
      modal.remove();
    }
  }

  // ==========================================================================
  // RENDER
  // ==========================================================================

  render() {
    // Remover existente si hay
    const existing = document.getElementById('command-palette');
    if (existing) existing.remove();

    const Icons = window.Icons || { search: () => '', x: () => '' };

    const html = `
      <div id="command-palette"
           class="fixed inset-0 bg-black/60 z-[10000] flex items-start justify-center pt-[12vh]"
           role="dialog"
           aria-modal="true"
           aria-label="Paleta de comandos">

        <div class="command-palette-content bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-xl mx-4 border border-gray-200 dark:border-slate-700 overflow-hidden">

          <!-- Search Input -->
          <div class="p-4 border-b border-gray-200 dark:border-slate-700">
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                ${Icons.search?.(20) || '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>'}
              </span>
              <input
                id="command-palette-input"
                type="text"
                placeholder="Escribe un comando..."
                class="command-palette-input w-full pl-10 pr-16 py-3 bg-gray-50 dark:bg-slate-800 border-0 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                autocomplete="off"
                spellcheck="false"
              />
              <kbd class="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 text-xs bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-gray-400 rounded font-mono">Esc</kbd>
            </div>
          </div>

          <!-- Commands List -->
          <div id="command-palette-list" class="max-h-[400px] overflow-y-auto p-2">
            ${this.renderCommandsList()}
          </div>

        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', html);
  }

  renderCommandsList() {
    if (this.filteredCommands.length === 0) {
      return `
        <div class="command-empty text-gray-500 dark:text-gray-400">
          No se encontraron comandos
        </div>
      `;
    }

    const Icons = window.Icons || {};

    // Agrupar por categoría
    const grouped = {};
    this.filteredCommands.forEach(cmd => {
      if (!grouped[cmd.category]) {
        grouped[cmd.category] = [];
      }
      grouped[cmd.category].push(cmd);
    });

    let html = '';
    let globalIndex = 0;

    Object.entries(grouped).forEach(([category, commands]) => {
      html += `<div class="command-category-header">${category}</div>`;

      commands.forEach(cmd => {
        const isSelected = globalIndex === this.selectedIndex;
        const iconHtml = Icons[cmd.icon]?.(18) || this.getDefaultIcon(cmd.icon);

        html += `
          <div class="command-item ${isSelected ? 'selected' : ''}"
               data-index="${globalIndex}"
               data-command-id="${cmd.id}"
               role="option"
               aria-selected="${isSelected}">
            <div class="command-item-icon">
              ${iconHtml}
            </div>
            <div class="command-item-text">
              <div class="command-item-label">${cmd.label}</div>
            </div>
            ${cmd.shortcut ? `<span class="command-shortcut">${cmd.shortcut}</span>` : ''}
          </div>
        `;

        globalIndex++;
      });
    });

    return html;
  }

  getDefaultIcon(iconName) {
    // Iconos SVG básicos como fallback
    const icons = {
      'chevron-left': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg>',
      'chevron-right': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>',
      'list': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>',
      'home': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
      'search': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>',
      'bot': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/></svg>',
      'file-text': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
      'bookmark': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m19 21-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>',
      'share-2': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>',
      'folder': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>',
      'headphones': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>',
      'waves': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12h2a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H2v-8zM22 12h-2a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h2v-8z"/><path d="M6 12a6 6 0 0 1 12 0"/></svg>',
      'zoom-in': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>',
      'zoom-out': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>',
      'moon': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
      'settings': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
      'cpu': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>'
    };

    return icons[iconName] || '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>';
  }

  // ==========================================================================
  // EVENT LISTENERS
  // ==========================================================================

  attachEventListeners() {
    const modal = document.getElementById('command-palette');
    const input = document.getElementById('command-palette-input');
    const list = document.getElementById('command-palette-list');

    if (!modal) return;

    // Click en overlay cierra
    this.eventManager.addEventListener(modal, 'click', (e) => {
      if (e.target.id === 'command-palette') {
        this.close();
      }
    });

    // Input para filtrar
    if (input) {
      this.eventManager.addEventListener(input, 'input', (e) => {
        this.filterCommands(e.target.value);
      });

      // Navegación por teclado
      this.eventManager.addEventListener(input, 'keydown', (e) => {
        this.handleKeydown(e);
      });
    }

    // Click en comando
    if (list) {
      this.eventManager.addEventListener(list, 'click', (e) => {
        const item = e.target.closest('.command-item');
        if (item) {
          const commandId = item.dataset.commandId;
          this.executeCommand(commandId);
        }
      });
    }
  }

  handleKeydown(e) {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this.moveSelection(1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        this.moveSelection(-1);
        break;
      case 'Enter':
        e.preventDefault();
        this.executeSelected();
        break;
      case 'Escape':
        e.preventDefault();
        this.close();
        break;
    }
  }

  moveSelection(delta) {
    const maxIndex = this.filteredCommands.length - 1;
    this.selectedIndex = Math.max(0, Math.min(maxIndex, this.selectedIndex + delta));
    this.updateSelection();
  }

  updateSelection() {
    const items = document.querySelectorAll('.command-item');
    items.forEach((item, index) => {
      item.classList.toggle('selected', index === this.selectedIndex);
      item.setAttribute('aria-selected', index === this.selectedIndex);
    });

    // Scroll into view
    const selected = document.querySelector('.command-item.selected');
    if (selected) {
      selected.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }

  // ==========================================================================
  // FILTRADO
  // ==========================================================================

  filterCommands(query) {
    this.searchQuery = query.toLowerCase().trim();

    if (!this.searchQuery) {
      this.filteredCommands = [...this.commands];
    } else {
      this.filteredCommands = this.commands.filter(cmd => {
        return cmd.label.toLowerCase().includes(this.searchQuery) ||
               cmd.category.toLowerCase().includes(this.searchQuery) ||
               cmd.id.toLowerCase().includes(this.searchQuery);
      });
    }

    this.selectedIndex = 0;

    // Re-render lista
    const list = document.getElementById('command-palette-list');
    if (list) {
      list.innerHTML = this.renderCommandsList();
    }
  }

  // ==========================================================================
  // EJECUCIÓN DE COMANDOS
  // ==========================================================================

  executeSelected() {
    if (this.filteredCommands.length > 0 && this.filteredCommands[this.selectedIndex]) {
      const cmd = this.filteredCommands[this.selectedIndex];
      this.executeCommand(cmd.id);
    }
  }

  executeCommand(commandId) {
    const cmd = this.commands.find(c => c.id === commandId);
    if (cmd && cmd.action) {
      this.close();

      // Ejecutar con pequeño delay para que el modal se cierre primero
      setTimeout(() => {
        try {
          cmd.action();
        } catch (error) {
          logger.error('[CommandPalette] Error ejecutando comando:', commandId, error);
          this.showToast('Error al ejecutar el comando');
        }
      }, 100);
    }
  }

  // ==========================================================================
  // ACCIONES DE COMANDOS
  // ==========================================================================

  navigatePrev() {
    const bookReader = window.bookReader;
    const bookEngine = bookReader?.bookEngine || window.bookEngine;
    if (bookReader && bookEngine) {
      const currentChapterId = bookReader.currentChapter?.id;
      const prevChapter = bookEngine.getPreviousChapter(currentChapterId);
      if (prevChapter) {
        bookReader.navigateToChapter(prevChapter.id);
      } else {
        this.showToast('Ya estás en el primer capítulo');
      }
    }
  }

  navigateNext() {
    const bookReader = window.bookReader;
    const bookEngine = bookReader?.bookEngine || window.bookEngine;
    if (bookReader && bookEngine) {
      const currentChapterId = bookReader.currentChapter?.id;
      const nextChapter = bookEngine.getNextChapter(currentChapterId);
      if (nextChapter) {
        bookReader.navigateToChapter(nextChapter.id);
      } else {
        this.showToast('Ya estás en el último capítulo');
      }
    }
  }

  toggleBookmark() {
    if (window.bookReader?.toggleBookmark) {
      window.bookReader.toggleBookmark();
    } else {
      this.showToast('Marcadores no disponibles');
    }
  }

  toggleAudio() {
    const audioReader = window.audioReader || window.dependencyInjector?.getSafe('audioReader');
    if (audioReader) {
      if (audioReader.isPlaying && !audioReader.isPaused) {
        audioReader.pause();
      } else if (audioReader.isPaused) {
        audioReader.resume();
      } else {
        audioReader.play();
      }
    } else {
      this.showToast('Audio no disponible');
    }
  }

  adjustFontSize(delta) {
    const savedSize = localStorage.getItem('font-size');
    const currentSize = savedSize ? parseInt(savedSize) : 16;
    const newSize = Math.max(12, Math.min(24, currentSize + delta));

    localStorage.setItem('font-size', newSize);

    // Aplicar al contenido
    const contentArea = document.querySelector('.chapter-content');
    if (contentArea) {
      contentArea.style.fontSize = `${newSize}px`;
    }

    this.showToast(`Tamaño de fuente: ${newSize}px`);
  }

  toggleTheme() {
    const body = document.body;
    const isCurrentlyDark = body.classList.contains('theme-dark') || body.classList.contains('dark');

    if (isCurrentlyDark) {
      body.classList.remove('theme-dark', 'dark');
      body.classList.add('theme-light');
      localStorage.setItem('theme-mode', 'light');
      this.showToast('Tema claro activado');
    } else {
      body.classList.remove('theme-light');
      body.classList.add('theme-dark', 'dark');
      localStorage.setItem('theme-mode', 'dark');
      this.showToast('Tema oscuro activado');
    }
  }

  showToast(message) {
    const toast = window.toast || window.dependencyInjector?.getSafe('toast');
    if (toast?.show) {
      toast.show(message);
    } else {
      logger.log('[CommandPalette]', message);
    }
  }

  // ==========================================================================
  // CLEANUP
  // ==========================================================================

  destroy() {
    document.removeEventListener('keydown', this.keydownHandler);
    this.eventManager.cleanup();
    this.close();
  }
}

// Exportar como global
window.CommandPalette = CommandPalette;
window.commandPalette = new CommandPalette();
