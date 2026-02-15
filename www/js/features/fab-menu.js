// ============================================================================
// FAB MENU - Floating Action Button con acciones rápidas
// ============================================================================
// v2.9.367: Fix drag - validaciones de límites y coordenadas touch seguras
// v2.9.366: Fix despliegue hacia abajo - usar top positioning cuando FAB arriba
// v2.9.365: Fix iconos - usar siempre SVG inline (no depende de Lucide)
// v2.9.363: FAB despliega hacia abajo cuando está en la parte superior
// v2.9.362: FAB arrastrable + posicionamiento inteligente (evita colisiones)
// v2.9.361: Fix toggleAudio - carga lazy el AudioReader si no existe
// v2.9.356: Añadir Exploración (brújula) al FAB, reemplaza botón flotante separado
// v2.9.354: Nuevo componente de acceso rápido
// Botón flotante que expande mini-botones con acciones frecuentes

class FABMenu {
  constructor() {
    this.isExpanded = false;
    this.isVisible = false;

    // EventManager para cleanup automático
    this.eventManager = new window.EventManager();
    this.eventManager.setComponentName('FABMenu');

    // i18n
    this.i18n = window.i18n || { t: (key) => key };

    // Drag state
    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.fabStartX = 0;
    this.fabStartY = 0;
    this.hasMoved = false;

    // Posición guardada (null = usar posición inteligente)
    this.savedPosition = this.loadPosition();

    // Acciones del FAB
    this.actions = [
      {
        id: 'explore',
        icon: 'compass',
        label: 'Explorar',
        color: 'pink',
        action: () => this.openExplorationHub()
      },
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

    // Solo mostrar si estamos en book-reader (no tiene clase 'hidden')
    const bookReaderView = document.getElementById('book-reader-view');
    if (!bookReaderView || bookReaderView.classList.contains('hidden')) {
      return;
    }

    this.isVisible = true;
    this.render();
    this.attachEventListeners();
    this.attachDragListeners();
    this.startPositionObserver();
  }

  hide() {
    if (!this.isVisible) return;

    this.isVisible = false;
    this.isExpanded = false;
    this.eventManager.cleanup();
    this.stopPositionObserver();

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

    // Calcular posición (guardada o inteligente)
    const position = this.savedPosition || this.calculateSmartPosition();

    // Determinar dirección de despliegue según posición vertical
    // Si bottom > 50% de la pantalla, el FAB está arriba → desplegar hacia abajo
    const isTopPosition = position.bottom > (window.innerHeight / 2);
    this.deployDirection = isTopPosition ? 'down' : 'up';

    const html = isTopPosition
      ? this.renderTopLayout(position)
      : this.renderBottomLayout(position);

    document.body.insertAdjacentHTML('beforeend', html);
  }

  renderBottomLayout(position) {
    // FAB abajo: acciones se despliegan hacia arriba
    return `
      <div id="fab-menu"
           class="fixed z-[9000] touch-none select-none"
           style="right: ${position.right}px; bottom: ${position.bottom}px;"
           data-direction="up"
           role="group"
           aria-label="Acciones rápidas">

        <!-- Mini-botones (despliegan hacia arriba) -->
        <div id="fab-actions" class="flex flex-col-reverse gap-3 mb-3">
          ${this.renderActions()}
        </div>

        <!-- Botón Principal -->
        <button id="fab-main"
                class="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 cursor-grab active:cursor-grabbing"
                aria-label="Menú de acciones rápidas"
                aria-expanded="false"
                aria-haspopup="true">
          <span class="fab-icon transition-transform duration-300 pointer-events-none">
            ${this.getSparklesIcon()}
          </span>
        </button>

      </div>
    `;
  }

  renderTopLayout(position) {
    // FAB arriba: usar TOP positioning para que crezca hacia abajo
    // Convertir bottom a top: top = windowHeight - bottom - fabSize
    const fabSize = 56;
    const margin = 8;
    let topValue = window.innerHeight - position.bottom - fabSize;

    // Validar que topValue esté dentro de límites razonables
    topValue = Math.max(margin, Math.min(topValue, window.innerHeight - fabSize - margin));

    return `
      <div id="fab-menu"
           class="fixed z-[9000] touch-none select-none"
           style="right: ${position.right}px; top: ${topValue}px;"
           data-direction="down"
           data-bottom="${position.bottom}"
           role="group"
           aria-label="Acciones rápidas">

        <!-- Botón Principal (primero cuando está arriba) -->
        <button id="fab-main"
                class="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 cursor-grab active:cursor-grabbing"
                aria-label="Menú de acciones rápidas"
                aria-expanded="false"
                aria-haspopup="true">
          <span class="fab-icon transition-transform duration-300 pointer-events-none">
            ${this.getSparklesIcon()}
          </span>
        </button>

        <!-- Mini-botones (despliegan hacia abajo) -->
        <div id="fab-actions" class="flex flex-col gap-3 mt-3">
          ${this.renderActions()}
        </div>

      </div>
    `;
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
    // SVG icons inline (siempre funcionan, no dependen de Lucide)
    const icons = {
      'compass': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>',
      'bot': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><circle cx="8" cy="16" r="1"/><circle cx="16" cy="16" r="1"/></svg>',
      'headphones': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>',
      'file-text': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
      'share-2': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>',
      'list': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>'
    };

    // Usar siempre SVG inline para garantizar que funcionen
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
          logger.error('[FABMenu] Error ejecutando acción:', actionId, error);
          this.showToast('Error al ejecutar la acción');
        }
      }, 150);
    }
  }

  // ==========================================================================
  // ACCIONES HELPERS
  // ==========================================================================

  async openExplorationHub() {
    // Lazy load exploration hub si no está cargado
    if (window.lazyLoader && !window.lazyLoader.isLoaded('exploration-hub')) {
      try {
        await window.lazyLoader.loadExplorationHub();
      } catch (error) {
        logger.error('[FABMenu] Error cargando ExplorationHub:', error);
        this.showToast('Error cargando exploración');
        return;
      }
    }

    // Crear instancia y abrir
    const ExplorationHub = window.ExplorationHub;
    const bookEngine = window.bookEngine || window.bookReader?.bookEngine;

    if (ExplorationHub && bookEngine) {
      const hub = new ExplorationHub(bookEngine);
      hub.open('search');
    } else {
      this.showToast('Exploración no disponible');
    }
  }

  async toggleAudio() {
    let audioReader = window.audioReader || window.dependencyInjector?.getSafe('audioReader');

    // Si no existe, intentar cargarlo
    if (!audioReader) {
      try {
        // Cargar AudioReader suite via lazy loader
        if (window.lazyLoader && !window.lazyLoader.isLoaded('audioreader-suite')) {
          this.showToast('Cargando reproductor...');
          await window.lazyLoader.loadAudioreaderSuite();
        }

        // Crear instancia si la clase existe
        if (window.AudioReader && window.bookEngine) {
          window.audioReader = new window.AudioReader(window.bookEngine);
          audioReader = window.audioReader;
        }
      } catch (error) {
        logger.error('[FABMenu] Error cargando AudioReader:', error);
        this.showToast('Error cargando reproductor');
        return;
      }
    }

    if (audioReader) {
      // Verificar si el reproductor está visible
      const isVisible = document.getElementById('audioreader-controls') ||
                        document.getElementById('audioreader-bottom-sheet');

      if (audioReader.isPlaying && !audioReader.isPaused) {
        // Está reproduciendo: pausar
        audioReader.pause();
        this.showToast('Audio pausado');
      } else if (audioReader.isPaused) {
        // Está pausado: reanudar
        audioReader.resume();
        this.showToast('Reproduciendo audio');
      } else if (!isVisible) {
        // No está visible: mostrar reproductor
        await audioReader.show();
      } else {
        // Está visible pero no reproduciendo: iniciar reproducción
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
      logger.log('[FABMenu]', message);
    }
  }

  // ==========================================================================
  // POSICIONAMIENTO INTELIGENTE
  // ==========================================================================

  calculateSmartPosition() {
    const margin = 16;
    const fabSize = 56;

    // Detectar elementos que podrían colisionar
    const audioPlayer = document.getElementById('audioreader-controls') ||
                        document.getElementById('audioreader-bottom-sheet');
    const footerNav = document.querySelector('.footer-nav');
    const chapterNav = document.querySelector('[class*="chapter-navigation"]');

    // Calcular altura de elementos inferiores
    let bottomOffset = margin;

    if (audioPlayer) {
      const rect = audioPlayer.getBoundingClientRect();
      const playerHeight = window.innerHeight - rect.top;
      bottomOffset = Math.max(bottomOffset, playerHeight + margin);
    }

    if (footerNav) {
      const rect = footerNav.getBoundingClientRect();
      const navHeight = window.innerHeight - rect.top;
      bottomOffset = Math.max(bottomOffset, navHeight + margin);
    }

    if (chapterNav) {
      const rect = chapterNav.getBoundingClientRect();
      const navHeight = window.innerHeight - rect.top;
      bottomOffset = Math.max(bottomOffset, navHeight + margin);
    }

    // Asegurar mínimo y máximo razonables
    bottomOffset = Math.max(margin, Math.min(bottomOffset, window.innerHeight - fabSize - 100));

    return {
      right: margin,
      bottom: bottomOffset
    };
  }

  updatePosition() {
    if (!this.isVisible || this.savedPosition) return;

    const fab = document.getElementById('fab-menu');
    if (!fab) return;

    const position = this.calculateSmartPosition();
    fab.style.right = `${position.right}px`;
    fab.style.bottom = `${position.bottom}px`;
  }

  // ==========================================================================
  // DRAG & DROP
  // ==========================================================================

  attachDragListeners() {
    const fab = document.getElementById('fab-menu');
    const mainBtn = document.getElementById('fab-main');
    if (!fab || !mainBtn) return;

    // Touch events
    this.eventManager.addEventListener(mainBtn, 'touchstart', (e) => this.onDragStart(e), { passive: false });
    this.eventManager.addEventListener(document, 'touchmove', (e) => this.onDragMove(e), { passive: false });
    this.eventManager.addEventListener(document, 'touchend', (e) => this.onDragEnd(e));

    // Mouse events
    this.eventManager.addEventListener(mainBtn, 'mousedown', (e) => this.onDragStart(e));
    this.eventManager.addEventListener(document, 'mousemove', (e) => this.onDragMove(e));
    this.eventManager.addEventListener(document, 'mouseup', (e) => this.onDragEnd(e));
  }

  onDragStart(e) {
    // Solo iniciar drag con botón izquierdo o touch
    if (e.type === 'mousedown' && e.button !== 0) return;

    const fab = document.getElementById('fab-menu');
    if (!fab) return;

    this.isDragging = true;
    this.hasMoved = false;

    // Detectar si estamos usando top o bottom positioning
    this.usingTopPositioning = fab.dataset.direction === 'down';

    // Posición inicial del toque/click
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    this.dragStartX = clientX;
    this.dragStartY = clientY;

    // Posición actual del FAB
    const rect = fab.getBoundingClientRect();
    this.fabStartX = window.innerWidth - rect.right;
    // Guardar tanto top como bottom para flexibilidad
    this.fabStartTop = rect.top;
    this.fabStartBottom = window.innerHeight - rect.bottom;

    // Añadir clase visual
    fab.classList.add('dragging');
  }

  onDragMove(e) {
    if (!this.isDragging) return;

    const fab = document.getElementById('fab-menu');
    if (!fab) return;

    // Obtener coordenadas de forma segura
    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if (e.clientX !== undefined) {
      clientX = e.clientX;
      clientY = e.clientY;
    } else {
      return; // No podemos obtener coordenadas
    }

    const deltaX = this.dragStartX - clientX;
    const deltaY = this.dragStartY - clientY;

    // Detectar si se ha movido lo suficiente para considerarlo drag
    if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
      this.hasMoved = true;
      e.preventDefault();
    }

    if (!this.hasMoved) return;

    // Calcular nueva posición
    const fabSize = 56;
    const margin = 8;

    let newRight = this.fabStartX + deltaX;
    newRight = Math.max(margin, Math.min(newRight, window.innerWidth - fabSize - margin));

    // Aplicar posición horizontal
    fab.style.right = `${newRight}px`;

    // Posición vertical depende del tipo de positioning
    if (this.usingTopPositioning) {
      // Usando top positioning
      let newTop = this.fabStartTop - deltaY;
      newTop = Math.max(margin, Math.min(newTop, window.innerHeight - fabSize - margin));
      fab.style.top = `${newTop}px`;
      fab.style.bottom = 'auto';
    } else {
      // Usando bottom positioning
      let newBottom = this.fabStartBottom + deltaY;
      newBottom = Math.max(margin, Math.min(newBottom, window.innerHeight - fabSize - margin));
      fab.style.bottom = `${newBottom}px`;
      fab.style.top = 'auto';
    }
  }

  onDragEnd(e) {
    if (!this.isDragging) return;

    const fab = document.getElementById('fab-menu');
    if (fab) {
      fab.classList.remove('dragging');
    }

    this.isDragging = false;

    // Si se movió, guardar posición y prevenir click
    if (this.hasMoved && fab) {
      const rect = fab.getBoundingClientRect();

      // Validar que el rect sea válido
      if (rect.width > 0 && rect.height > 0) {
        const fabSize = 56;
        const margin = 8;

        // Calcular posición y validar límites
        let right = window.innerWidth - rect.right;
        let bottom = window.innerHeight - rect.bottom;

        // Asegurar que esté dentro de límites razonables
        right = Math.max(margin, Math.min(right, window.innerWidth - fabSize - margin));
        bottom = Math.max(margin, Math.min(bottom, window.innerHeight - fabSize - margin));

        this.savedPosition = { right, bottom };
        this.savePosition(this.savedPosition);

        // Verificar si la dirección de despliegue cambió
        const isTopPosition = bottom > (window.innerHeight / 2);
        const newDirection = isTopPosition ? 'down' : 'up';

        if (newDirection !== this.deployDirection) {
          // Re-renderizar para cambiar la dirección de despliegue
          this.render();
          this.attachEventListeners();
          this.attachDragListeners();
        }
      }

      // Prevenir que se abra el menú después del drag
      e.preventDefault();
      e.stopPropagation();
    }

    this.hasMoved = false;
  }

  // ==========================================================================
  // OBSERVER PARA CAMBIOS DE LAYOUT
  // ==========================================================================

  startPositionObserver() {
    // Observar cambios en el DOM que puedan afectar la posición
    this.positionObserver = new MutationObserver(() => {
      this.updatePosition();
    });

    this.positionObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style']
    });

    // También observar resize
    this.resizeHandler = () => this.updatePosition();
    window.addEventListener('resize', this.resizeHandler);
  }

  stopPositionObserver() {
    if (this.positionObserver) {
      this.positionObserver.disconnect();
      this.positionObserver = null;
    }

    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
      this.resizeHandler = null;
    }
  }

  // ==========================================================================
  // PERSISTENCIA DE POSICIÓN
  // ==========================================================================

  loadPosition() {
    try {
      const saved = localStorage.getItem('fab-position');
      if (saved) {
        const position = JSON.parse(saved);
        // Validar que la posición guardada es razonable
        if (position.right >= 0 && position.bottom >= 0 &&
            position.right < window.innerWidth &&
            position.bottom < window.innerHeight) {
          return position;
        }
      }
    } catch (e) {}
    return null;
  }

  savePosition(position) {
    try {
      localStorage.setItem('fab-position', JSON.stringify(position));
    } catch (e) {}
  }

  resetPosition() {
    try {
      localStorage.removeItem('fab-position');
    } catch (e) {}
    this.savedPosition = null;
    this.updatePosition();
  }

  // ==========================================================================
  // CLEANUP
  // ==========================================================================

  destroy() {
    this.eventManager.cleanup();
    this.stopPositionObserver();
    this.hide();
  }
}

// Exportar como global
window.FABMenu = FABMenu;
window.fabMenu = new FABMenu();
