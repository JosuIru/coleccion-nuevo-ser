// ============================================================================
// FAB MENU - Floating Action Button con acciones rápidas
// ============================================================================
// v2.9.354: Nuevo componente de acceso rápido
// Botón flotante que expande mini-botones con acciones frecuentes

class FABMenu {
  constructor() {
    this.isExpanded = false;
    this.isVisible = false;

    // EventManager para cleanup automático
    this.eventManager = new EventManager();
    this.eventManager.setComponentName('FABMenu');

    // i18n
    this.i18n = window.i18n || { t: (key) => key };

    // Acciones del FAB
    this.actions = [
      {
        id: 'ai-chat',
        icon: 'bot',
        label: 'Chat IA',
        color: 'cyan',
        action: () => window.aiChatModal?.open()
      },
      {
        id: 'audio',
        icon: 'headphones',
        label: 'Audio',
        color: 'purple',
        action: () => this.toggleAudio()
      },
      {
        id: 'notes',
        icon: 'file-text',
        label: 'Notas',
        color: 'amber',
        action: () => window.notesModal?.open()
      },
      {
        id: 'share',
        icon: 'share-2',
        label: 'Compartir',
        color: 'green',
        action: () => this.shareChapter()
      },
      {
        id: 'toc',
        icon: 'list',
        label: 'Índice',
        color: 'blue',
        action: () => window.bookReader?.sidebar?.toggleSidebar()
      }
    ];
  }

  // ==========================================================================
  // SHOW / HIDE
  // ==========================================================================

  show() {
    if (this.isVisible) return;

    // Solo mostrar si estamos en book-reader
    if (!document.getElementById('book-reader-view')?.classList.contains('active')) {
      return;
    }

    this.isVisible = true;
    this.render();
    this.attachEventListeners();
  }

  hide() {
    if (!this.isVisible) return;

    this.isVisible = false;
    this.isExpanded = false;
    this.eventManager.cleanup();

    const fab = document.getElementById('fab-menu');
    if (fab) {
      fab.remove();
    }
  }

  // ==========================================================================
  // RENDER
  // ==========================================================================

  render() {
    // Remover existente si hay
    const existing = document.getElementById('fab-menu');
    if (existing) existing.remove();

    const html = `
      <div id="fab-menu"
           class="fixed right-4 bottom-20 sm:bottom-6 z-[9000]"
           role="group"
           aria-label="Acciones rápidas">

        <!-- Mini-botones (ocultos por defecto) -->
        <div id="fab-actions" class="flex flex-col-reverse gap-3 mb-3">
          ${this.renderActions()}
        </div>

        <!-- Botón Principal -->
        <button id="fab-main"
                class="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2"
                aria-label="Menú de acciones rápidas"
                aria-expanded="false"
                aria-haspopup="true">
          <span class="fab-icon transition-transform duration-300">
            ${this.getSparklesIcon()}
          </span>
        </button>

      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', html);
  }

  renderActions() {
    return this.actions.map(action => `
      <button class="fab-action opacity-0"
              data-action-id="${action.id}"
              data-color="${action.color}"
              aria-label="${action.label}"
              title="${action.label}">
        <span class="fab-tooltip">${action.label}</span>
        ${this.getIcon(action.icon)}
      </button>
    `).join('');
  }

  getSparklesIcon() {
    return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
      <path d="M5 3v4"/>
      <path d="M19 17v4"/>
      <path d="M3 5h4"/>
      <path d="M17 19h4"/>
    </svg>`;
  }

  getIcon(iconName) {
    const Icons = window.Icons;
    if (Icons && Icons[iconName]) {
      return Icons[iconName](20);
    }

    // Fallback SVG icons
    const icons = {
      'bot': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><circle cx="8" cy="16" r="1"/><circle cx="16" cy="16" r="1"/></svg>',
      'headphones': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>',
      'file-text': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
      'share-2': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>',
      'list': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>'
    };

    return icons[iconName] || '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>';
  }

  // ==========================================================================
  // EVENT LISTENERS
  // ==========================================================================

  attachEventListeners() {
    const mainBtn = document.getElementById('fab-main');
    const actionsContainer = document.getElementById('fab-actions');

    if (!mainBtn) return;

    // Click en botón principal toggle
    this.eventManager.addEventListener(mainBtn, 'click', (e) => {
      e.stopPropagation();
      this.toggle();
    });

    // Click en acciones
    if (actionsContainer) {
      this.eventManager.addEventListener(actionsContainer, 'click', (e) => {
        const actionBtn = e.target.closest('.fab-action');
        if (actionBtn) {
          e.stopPropagation();
          const actionId = actionBtn.dataset.actionId;
          this.executeAction(actionId);
        }
      });
    }

    // Click fuera cierra
    this.eventManager.addEventListener(document, 'click', (e) => {
      if (this.isExpanded && !e.target.closest('#fab-menu')) {
        this.collapse();
      }
    });

    // Escape cierra
    this.eventManager.addEventListener(document, 'keydown', (e) => {
      if (e.key === 'Escape' && this.isExpanded) {
        this.collapse();
      }
    });
  }

  // ==========================================================================
  // TOGGLE / EXPAND / COLLAPSE
  // ==========================================================================

  toggle() {
    if (this.isExpanded) {
      this.collapse();
    } else {
      this.expand();
    }
  }

  expand() {
    if (this.isExpanded) return;

    this.isExpanded = true;

    const mainBtn = document.getElementById('fab-main');
    const actionsContainer = document.getElementById('fab-actions');

    if (mainBtn) {
      mainBtn.classList.add('expanded');
      mainBtn.setAttribute('aria-expanded', 'true');
    }

    if (actionsContainer) {
      actionsContainer.classList.add('expanded');
    }
  }

  collapse() {
    if (!this.isExpanded) return;

    this.isExpanded = false;

    const mainBtn = document.getElementById('fab-main');
    const actionsContainer = document.getElementById('fab-actions');

    if (mainBtn) {
      mainBtn.classList.remove('expanded');
      mainBtn.setAttribute('aria-expanded', 'false');
    }

    if (actionsContainer) {
      actionsContainer.classList.remove('expanded');
    }
  }

  // ==========================================================================
  // EJECUTAR ACCIONES
  // ==========================================================================

  executeAction(actionId) {
    const action = this.actions.find(a => a.id === actionId);
    if (action && action.action) {
      // Colapsar primero
      this.collapse();

      // Ejecutar con pequeño delay
      setTimeout(() => {
        try {
          action.action();
        } catch (error) {
          console.error('[FABMenu] Error ejecutando acción:', actionId, error);
          this.showToast('Error al ejecutar la acción');
        }
      }, 150);
    }
  }

  // ==========================================================================
  // ACCIONES HELPERS
  // ==========================================================================

  toggleAudio() {
    const audioReader = window.audioReader || window.dependencyInjector?.getSafe('audioReader');
    if (audioReader) {
      if (audioReader.isPlaying) {
        audioReader.pause();
        this.showToast('Audio pausado');
      } else {
        audioReader.play();
        this.showToast('Reproduciendo audio');
      }
    } else {
      this.showToast('Audio no disponible');
    }
  }

  shareChapter() {
    if (window.shareHelper?.shareChapter) {
      window.shareHelper.shareChapter();
    } else if (navigator.share) {
      // Fallback a Web Share API
      const title = window.bookReader?.currentChapter?.title || 'Capítulo';
      navigator.share({
        title: title,
        url: window.location.href
      }).catch(() => {
        // Usuario canceló o error
      });
    } else {
      // Copiar URL al portapapeles
      navigator.clipboard.writeText(window.location.href).then(() => {
        this.showToast('Enlace copiado al portapapeles');
      }).catch(() => {
        this.showToast('No se pudo copiar el enlace');
      });
    }
  }

  showToast(message) {
    const toast = window.toast || window.dependencyInjector?.getSafe('toast');
    if (toast?.show) {
      toast.show(message);
    } else {
      console.log('[FABMenu]', message);
    }
  }

  // ==========================================================================
  // CLEANUP
  // ==========================================================================

  destroy() {
    this.eventManager.cleanup();
    this.hide();
  }
}

// Exportar como global
window.FABMenu = FABMenu;
window.fabMenu = new FABMenu();
