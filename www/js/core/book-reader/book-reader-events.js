// ============================================================================
// BOOK READER EVENTS - Gestores de eventos
// ============================================================================
// v2.9.279: Modularizacion del BookReader
// Todos los event listeners, handlers y su cleanup

class BookReaderEvents {
  constructor(bookReader) {
    this.bookReader = bookReader;

    // Flag para evitar duplicacion masiva de listeners
    this._eventListenersAttached = false;

    // Handler references para cleanup
    this._eventHandlers = new Map();

    // Dropdown state flags
    this._bottomNavClickOutsideAttached = false;
    this._moreActionsClickOutsideAttached = false;
    this._desktopDropdownsClickOutsideAttached = false;

    // Handler references para re-attach despues de render parcial
    this._toggleSidebarHandler = null;
    this._closeSidebarHandler = null;
    this._backToBibliotecaHandler = null;
    this._mobileMenuHandler = null;
    this._bottomNavMoreHandler = null;
    this._bottomNavClickOutsideHandler = null;
    this._audioreaderHandler = null;
    this._audioExpandHandler = null;
    this._moreActionsToggleHandler = null;
    this._moreActionsClickOutsideHandler = null;
    this._desktopDropdownsClickOutsideHandler = null;
    this._markReadHandler = null;
    this._prevChapterHandler = null;
    this._nextChapterHandler = null;

    // Mapa de dropdown handlers
    this._dropdownHandlers = null;
  }

  // ==========================================================================
  // HELPER METHODS
  // ==========================================================================

  /**
   * Acceso seguro a dependencias
   */
  getDependency(name) {
    if (window.dependencyInjector) {
      return window.dependencyInjector.getSafe(name);
    }
    return window[name] || null;
  }

  /**
   * Helper para mostrar toasts
   */
  showToast(type, message) {
    const toast = this.getDependency('toast');
    if (toast && typeof toast[type] === 'function') {
      toast[type](message);
    } else {
      if (typeof logger !== 'undefined') {
        logger.debug(`[Toast ${type.toUpperCase()}]`, message);
      }
    }
  }

  /**
   * Obtener EventManager del bookReader
   */
  get eventManager() {
    return this.bookReader.eventManager;
  }

  /**
   * Obtener BookEngine del bookReader
   */
  get bookEngine() {
    return this.bookReader.bookEngine;
  }

  /**
   * Obtener i18n del bookReader
   */
  get i18n() {
    return this.bookReader.i18n;
  }

  /**
   * Obtener capitulo actual
   */
  get currentChapter() {
    return this.bookReader.currentChapter;
  }

  // ==========================================================================
  // TOGGLE DROPDOWN
  // ==========================================================================

  /**
   * Toggle dropdown con cierre automatico al click fuera
   */
  toggleDropdown(dropdownId) {
    const dropdown = document.getElementById(dropdownId);
    if (!dropdown) return;

    const isOpen = dropdown.classList.contains('hidden');

    // Cerrar todos los dropdowns
    document.querySelectorAll('[id$="-dropdown"]').forEach(dd => {
      dd.classList.add('hidden');
    });

    if (isOpen) {
      dropdown.classList.remove('hidden');

      // Cerrar al hacer click fuera
      const closeHandler = (e) => {
        if (!e.target.closest(`#${dropdownId}`) && !e.target.closest('[data-dropdown-toggle]')) {
          dropdown.classList.add('hidden');
          document.removeEventListener('click', closeHandler);
        }
      };

      // Usar setTimeout para evitar que el click actual cierre el dropdown
      setTimeout(() => {
        document.addEventListener('click', closeHandler);
      }, 0);
    }
  }

  // ==========================================================================
  // ATTACH EVENT LISTENER (con tracking)
  // ==========================================================================

  /**
   * Adjunta un event listener con seguimiento para limpieza posterior
   */
  attachEventListener(elementId, event, handler) {
    const key = `${elementId}-${event}`;
    const oldHandler = this._eventHandlers.get(key);

    // Limpiar listener anterior si existe
    if (oldHandler) {
      const element = document.getElementById(elementId);
      if (element) {
        element.removeEventListener(event, oldHandler);
      }
    }

    // Agregar nuevo listener
    const element = document.getElementById(elementId);
    if (element) {
      element.addEventListener(event, handler);
      this._eventHandlers.set(key, handler);
    }
  }

  // ==========================================================================
  // HELPER FACTORY METHODS
  // ==========================================================================

  /**
   * Crea un handler para abrir modales con cierre automatico de menus
   */
  createModalHandler(modalPath, closeMenu = null, methodName = 'open', ...args) {
    return () => {
      if (closeMenu) closeMenu();

      const modal = this.getDependency(modalPath);

      if (modal) {
        // Evaluar args que sean funciones
        const evaluatedArgs = args.map(arg => typeof arg === 'function' ? arg() : arg);
        modal[methodName](...evaluatedArgs);
      } else {
        const errorKey = `error.${modalPath}NotAvailable`;
        this.showToast('error', errorKey);
      }
    };
  }

  /**
   * Crea un handler para cambiar de libro
   */
  createBookSwitchHandler(bookId, closeMenu = null) {
    return async () => {
      if (closeMenu) closeMenu();
      await this.bookReader.handleBookSwitch(bookId);
    };
  }

  /**
   * Crea un handler generico para ejecutar metodos del bookReader
   */
  createMethodHandler(methodName, ...args) {
    return () => {
      if (typeof this.bookReader[methodName] === 'function') {
        this.bookReader[methodName](...args);
      }
    };
  }

  /**
   * Registra el mismo handler en multiples botones
   */
  attachMultiDevice(buttonIds, handler) {
    buttonIds.forEach(id => {
      const btn = document.getElementById(id);
      if (btn) {
        this.eventManager.addEventListener(btn, 'click', handler);
      }
    });
  }

  /**
   * attachMultiDevice con cierre automatico de menus segun ID
   */
  attachMultiDeviceWithMenuClose(buttonIds, handler, closeMobileMenuDropdown, closeDropdownHelper) {
    buttonIds.forEach(id => {
      const btn = document.getElementById(id);
      if (btn) {
        this.eventManager.addEventListener(btn, 'click', () => {
          // Cerrar menus segun el tipo de boton
          if (id.includes('-mobile') && closeMobileMenuDropdown) {
            closeMobileMenuDropdown();
          } else if (id.includes('-dropdown') && closeDropdownHelper) {
            closeDropdownHelper();
          }
          // Ejecutar handler principal
          handler();
        });
      }
    });
  }

  /**
   * Setup de dropdown toggle
   */
  setupDropdown(btnId, dropdownId) {
    const btn = document.getElementById(btnId);
    const dropdown = document.getElementById(dropdownId);
    if (btn && dropdown) {
      // Guardar handler para evitar duplicacion
      if (!this._dropdownHandlers) this._dropdownHandlers = {};

      const handlerKey = `${btnId}_${dropdownId}`;
      if (!this._dropdownHandlers[handlerKey]) {
        this._dropdownHandlers[handlerKey] = (e) => {
          e.stopPropagation();
          // Cerrar otros dropdowns
          ['tools-dropdown', 'book-features-dropdown', 'settings-dropdown'].forEach(id => {
            if (id !== dropdownId) {
              document.getElementById(id)?.classList.add('hidden');
            }
          });
          dropdown.classList.toggle('hidden');
        };
      }

      this.eventManager.addEventListener(btn, 'click', this._dropdownHandlers[handlerKey]);
    }
  }

  // ==========================================================================
  // MAIN ATTACH EVENT LISTENERS
  // ==========================================================================

  /**
   * Adjunta todos los event listeners del BookReader
   * Solo se ejecuta una vez para evitar acumulacion masiva
   */
  attachEventListeners() {
    // Proteccion: Solo ejecutar una vez
    if (this._eventListenersAttached) {
      return;
    }

    if (typeof logger !== 'undefined') {
      logger.debug('[BookReaderEvents] Ejecutando attachEventListeners');
    }
    this._eventListenersAttached = true;

    // Helper para cerrar dropdown del menu
    const closeDropdownHelper = () => {
      ['more-actions-dropdown', 'tools-dropdown', 'book-features-dropdown', 'settings-dropdown'].forEach(id => {
        document.getElementById(id)?.classList.add('hidden');
      });
    };

    // Helper para cerrar menu movil
    const closeMobileMenuDropdown = () => {
      const menu = document.getElementById('mobile-menu');
      if (menu) menu.classList.add('hidden');
    };

    // ========================================================================
    // SIDEBAR TOGGLE
    // ========================================================================
    if (!this._toggleSidebarHandler) {
      this._toggleSidebarHandler = (e) => {
        e.stopPropagation();
        e.preventDefault();
        this.bookReader.toggleSidebar();
      };
    }

    const toggleSidebar = document.getElementById('toggle-sidebar');
    if (toggleSidebar) {
      this.eventManager.addEventListener(toggleSidebar, 'click', this._toggleSidebarHandler);
    }

    // Close sidebar (mobile)
    if (!this._closeSidebarHandler) {
      this._closeSidebarHandler = (e) => {
        e.stopPropagation();
        e.preventDefault();
        if (this.bookReader.sidebarOpen) {
          this.bookReader.toggleSidebar();
        }
      };
    }

    const closeSidebarMobile = document.getElementById('close-sidebar-mobile');
    if (closeSidebarMobile) {
      this.eventManager.addEventListener(closeSidebarMobile, 'click', this._closeSidebarHandler);
    }

    // ========================================================================
    // BACK TO BIBLIOTECA
    // ========================================================================
    if (!this._backToBibliotecaHandler) {
      this._backToBibliotecaHandler = (e) => {
        e.stopPropagation();
        e.preventDefault();
        this.bookReader.removeBookTheme();
        this.bookReader.hide();
        const biblioteca = this.getDependency('biblioteca');
        if (biblioteca) biblioteca.show();
      };
    }

    const backBtn = document.getElementById('back-to-biblioteca');
    if (backBtn) {
      this.eventManager.addEventListener(backBtn, 'click', this._backToBibliotecaHandler);
    }

    // ========================================================================
    // MOBILE MENU
    // ========================================================================
    if (!this._mobileMenuHandler) {
      this._mobileMenuHandler = (e) => {
        e.stopPropagation();
        e.preventDefault();
        document.getElementById('mobile-menu')?.classList.remove('hidden');
      };
    }

    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    if (mobileMenuBtn) {
      this.eventManager.addEventListener(mobileMenuBtn, 'click', this._mobileMenuHandler);
    }

    // Close mobile menu button
    const closeMobileMenu = document.getElementById('close-mobile-menu');
    if (closeMobileMenu) {
      this.eventManager.addEventListener(closeMobileMenu, 'click', () => {
        const mobileMenu = document.getElementById('mobile-menu');
        if (mobileMenu) {
          mobileMenu.classList.add('hidden');
        }
      });
    }

    // Close on backdrop click
    const mobileMenuBackdrop = document.getElementById('mobile-menu-backdrop');
    if (mobileMenuBackdrop) {
      this.eventManager.addEventListener(mobileMenuBackdrop, 'click', () => {
        const mobileMenu = document.getElementById('mobile-menu');
        if (mobileMenu) {
          mobileMenu.classList.add('hidden');
        }
      });
    }

    // Back to biblioteca (mobile)
    const backToLibMobile = document.getElementById('back-to-biblioteca-mobile');
    if (backToLibMobile) {
      this.eventManager.addEventListener(backToLibMobile, 'click', () => {
        const mobileMenu = document.getElementById('mobile-menu');
        if (mobileMenu) {
          mobileMenu.classList.add('hidden');
        }
        this.bookReader.removeBookTheme();
        this.bookReader.hide();
        const biblioteca = this.getDependency('biblioteca');
        if (biblioteca) biblioteca.show();
      });
    }

    // ========================================================================
    // BOTTOM NAV DROPDOWN
    // ========================================================================
    const bottomNavMoreBtn = document.getElementById('bottom-nav-more-btn');
    const bottomNavDropdown = document.getElementById('bottom-nav-dropdown');
    if (bottomNavMoreBtn && bottomNavDropdown) {
      if (!this._bottomNavMoreHandler) {
        this._bottomNavMoreHandler = (e) => {
          e.stopPropagation();
          bottomNavDropdown.classList.toggle('hidden');
        };
      }

      this.eventManager.addEventListener(bottomNavMoreBtn, 'click', this._bottomNavMoreHandler);

      // Cerrar dropdown al hacer click fuera
      if (!this._bottomNavClickOutsideAttached) {
        this._bottomNavClickOutsideHandler = (e) => {
          if (!bottomNavDropdown.contains(e.target) && e.target !== bottomNavMoreBtn) {
            bottomNavDropdown.classList.add('hidden');
          }
        };
        this.eventManager.addEventListener(document, 'click', this._bottomNavClickOutsideHandler);
        this._bottomNavClickOutsideAttached = true;
      }

      // Cerrar dropdown despues de seleccionar una opcion
      bottomNavDropdown.querySelectorAll('button').forEach(btn => {
        this.eventManager.addEventListener(btn, 'click', () => {
          setTimeout(() => {
            bottomNavDropdown.classList.add('hidden');
          }, 100);
        });
      });
    }

    // ========================================================================
    // AI CHAT
    // ========================================================================
    const aiChatHandler = async () => {
      closeMobileMenuDropdown();
      // 🔧 v2.9.283: Usar AILazyLoader para carga dinámica
      if (window.aiLazyLoader) {
        await window.aiLazyLoader.showAIChatModal();
      } else {
        // Fallback: intentar cargar directo
        const aiChatModal = this.getDependency('aiChatModal');
        if (aiChatModal) {
          aiChatModal.open();
        } else {
          this.showToast('error', 'error.chatNotAvailable');
        }
      }
    };

    const aiChatBtn = document.getElementById('ai-chat-btn');
    const aiChatBtnTablet = document.getElementById('ai-chat-btn-tablet');
    const aiChatBtnMobile = document.getElementById('ai-chat-btn-mobile');

    if (aiChatBtn) this.eventManager.addEventListener(aiChatBtn, 'click', aiChatHandler);
    if (aiChatBtnTablet) this.eventManager.addEventListener(aiChatBtnTablet, 'click', aiChatHandler);
    if (aiChatBtnMobile) this.eventManager.addEventListener(aiChatBtnMobile, 'click', aiChatHandler);

    // ========================================================================
    // EXPLORATION HUB
    // ========================================================================
    const explorationHubBtn = document.getElementById('exploration-hub-floating-btn');
    if (explorationHubBtn) {
      this.eventManager.addEventListener(explorationHubBtn, 'click', async () => {
        // Lazy load Exploration Hub (44KB) - loads only when user clicks
        if (window.lazyLoader && !window.lazyLoader.isLoaded('exploration-hub')) {
          await window.lazyLoader.loadExplorationHub();
        }

        const ExplorationHub = this.getDependency('ExplorationHub');
        if (ExplorationHub && this.bookEngine) {
          const hub = new ExplorationHub(this.bookEngine);
          hub.open('search');
        } else {
          logger.error('ExplorationHub no esta disponible');
        }
      });
    }

    // ========================================================================
    // NOTES
    // ========================================================================
    const notesBtn = document.getElementById('notes-btn');
    if (notesBtn) {
      this.eventManager.addEventListener(notesBtn, 'click', () => {
        const notesModal = this.getDependency('notesModal');
        if (notesModal) {
          notesModal.open(this.currentChapter?.id);
        } else {
          this.showToast('error', 'error.notesNotAvailable');
        }
      });
    }

    // Voice notes
    const voiceNotesBtn = document.getElementById('voice-notes-btn');
    if (voiceNotesBtn) {
      this.eventManager.addEventListener(voiceNotesBtn, 'click', () => {
        const voiceNotes = this.getDependency('voiceNotes');
        if (voiceNotes) {
          voiceNotes.showRecordingModal();
        } else {
          this.showToast('error', 'Notas de voz no disponibles');
        }
      });
    }

    // ========================================================================
    // KOAN
    // ========================================================================
    const koanBtn = document.getElementById('koan-btn');
    if (koanBtn) {
      this.eventManager.addEventListener(koanBtn, 'click', () => {
        const koanModal = this.getDependency('koanModal');
        if (koanModal) {
          koanModal.setCurrentChapter(this.currentChapter?.id);
          koanModal.open(this.currentChapter?.id);
        } else {
          this.showToast('error', 'error.koanNotAvailable');
        }
      });
    }

    // ========================================================================
    // QUIZ
    // ========================================================================
    const quizBtn = document.getElementById('quiz-btn');
    if (quizBtn) {
      this.eventManager.addEventListener(quizBtn, 'click', async () => {
        const bookId = this.bookEngine.getCurrentBook();
        const chapterId = this.currentChapter?.id;

        if (!chapterId) {
          this.showToast('info', 'Selecciona un capitulo primero');
          return;
        }

        // 🔧 v2.9.283: Usar LearningLazyLoader para carga dinámica
        if (window.learningLazyLoader) {
          await window.learningLazyLoader.ensureInteractiveQuiz();
        }

        const interactiveQuiz = this.getDependency('interactiveQuiz') || window.interactiveQuiz;
        if (interactiveQuiz) {
          const quiz = await interactiveQuiz.loadQuiz(bookId, chapterId);
          if (quiz) {
            interactiveQuiz.open(bookId, chapterId);
          } else {
            this.showToast('info', 'No hay quiz disponible para este capitulo');
          }
        } else {
          logger.error('InteractiveQuiz no esta disponible');
        }
      });
    }

    // ========================================================================
    // TIMELINE
    // ========================================================================
    const timelineBtn = document.getElementById('timeline-btn');
    if (timelineBtn) {
      this.eventManager.addEventListener(timelineBtn, 'click', () => {
        const timelineViewer = this.getDependency('timelineViewer');
        if (timelineViewer) {
          timelineViewer.open();
        } else {
          this.showToast('error', 'error.timelineNotAvailable');
        }
      });
    }

    // ========================================================================
    // AUDIOREADER
    // ========================================================================
    if (!this._audioreaderHandler) {
      this._audioreaderHandler = async (e) => {
        e.stopPropagation();
        e.preventDefault();

        // Cerrar menu movil si esta abierto
        const menu = document.getElementById('mobile-menu');
        if (menu) menu.classList.add('hidden');

        const audioReader = this.getDependency('audioReader');
        const reader = audioReader?.baseReader || audioReader;
        if (!reader) {
          this.showToast('error', 'Reproductor no disponible');
          return;
        }

        // Si no tiene contenido preparado, prepararlo primero
        if (reader.paragraphs.length === 0) {
          const chapterContent = document.querySelector('.chapter-content');
          if (chapterContent) {
            reader.prepareContent(chapterContent.innerHTML);
            await reader.updateUI();
          }
          return;
        }

        // Ya tiene contenido - toggle play/pause
        if (reader.isPlaying && !reader.isPaused) {
          await reader.pause();
          await reader.updateUI();
        } else {
          if (reader.isPaused) {
            await reader.resume();
            await reader.updateUI();
          } else {
            const chapterContent = document.querySelector('.chapter-content');
            if (chapterContent) {
              await reader.play(chapterContent.innerHTML);
              await reader.updateUI();
            }
          }
        }
      };
    }

    if (!this._audioExpandHandler) {
      this._audioExpandHandler = async () => {
        const audioReader = this.getDependency('audioReader');
        const reader = audioReader?.baseReader || audioReader;
        if (reader) {
          if (reader.isMinimized) {
            await reader.toggleBottomSheet();
          } else {
            reader.toggleMinimize();
          }
        }
      };
    }

    const audioExpandBtn = document.getElementById('audio-expand-btn-mobile');
    if (audioExpandBtn) {
      this.eventManager.addEventListener(audioExpandBtn, 'click', this._audioExpandHandler);
    }

    const audioreaderBtn = document.getElementById('audioreader-btn');
    const audioreaderBtnTablet = document.getElementById('audioreader-btn-tablet');
    const audioreaderBtnMobile = document.getElementById('audioreader-btn-mobile');

    if (audioreaderBtn) {
      this.eventManager.addEventListener(audioreaderBtn, 'click', this._audioreaderHandler);
    }
    if (audioreaderBtnTablet) {
      this.eventManager.addEventListener(audioreaderBtnTablet, 'click', this._audioreaderHandler);
    }
    if (audioreaderBtnMobile) {
      this.eventManager.addEventListener(audioreaderBtnMobile, 'click', this._audioreaderHandler);
    }

    // ========================================================================
    // SUPPORT BUTTONS
    // ========================================================================
    this.attachMultiDevice(
      ['support-btn-tablet', 'support-btn-mobile'],
      this.createModalHandler('donationsModal')
    );

    // ========================================================================
    // ANDROID DOWNLOAD
    // ========================================================================
    const androidBtn = document.getElementById('android-download-btn');
    if (androidBtn) {
      this.eventManager.addEventListener(androidBtn, 'click', () => {
        const apkUrl = this.bookEngine.getLatestAPK();
        window.open(apkUrl, '_blank');
      });
    }

    // ========================================================================
    // ACHIEVEMENTS
    // ========================================================================
    const achievementsBtn = document.getElementById('achievements-btn');
    if (achievementsBtn) {
      this.eventManager.addEventListener(achievementsBtn, 'click', () => {
        const achievementSystem = this.getDependency('achievementSystem');
        if (achievementSystem) {
          achievementSystem.showDashboardModal();
        }
      });
    }

    // ========================================================================
    // CONTENT ADAPTER
    // ========================================================================
    const contentAdapterBtn = document.getElementById('content-adapter-btn');
    if (contentAdapterBtn) {
      this.eventManager.addEventListener(contentAdapterBtn, 'click', () => {
        const contentAdapter = this.getDependency('contentAdapter');
        if (contentAdapter) {
          contentAdapter.toggleSelector();
        } else {
          this.showToast('info', 'Cargando adaptador de contenido...');
          const lazyLoader = this.getDependency('lazyLoader');
          if (lazyLoader) {
            lazyLoader.load('contentAdapter').then(() => {
              const loaded = this.getDependency('contentAdapter');
              if (loaded) {
                loaded.toggleSelector();
              }
            }).catch(() => {
              this.showToast('error', 'Error al cargar el adaptador de contenido');
            });
          }
        }
      });
    }

    // ========================================================================
    // SUMMARY (Auto-summary with AI)
    // ========================================================================
    const summaryBtn = document.getElementById('summary-btn');
    if (summaryBtn) {
      this.eventManager.addEventListener(summaryBtn, 'click', () => {
        const autoSummary = this.getDependency('autoSummary');
        if (autoSummary && this.currentChapter) {
          const bookId = this.bookEngine.getCurrentBook();
          autoSummary.showSummaryModal(this.currentChapter, bookId);
        } else {
          this.showToast('info', 'Configura la IA para generar resumenes');
        }
      });
    }

    // ========================================================================
    // CONCEPT MAP
    // ========================================================================
    const conceptMapBtn = document.getElementById('concept-map-btn');
    if (conceptMapBtn) {
      this.eventManager.addEventListener(conceptMapBtn, 'click', async () => {
        // 🔧 v2.9.283: Usar LearningLazyLoader para carga dinámica
        if (window.learningLazyLoader) {
          await window.learningLazyLoader.ensureConceptMaps();
        }

        const conceptMaps = this.getDependency('conceptMaps') || window.conceptMaps;
        if (conceptMaps) {
          conceptMaps.show();
        }
      });
    }

    // ========================================================================
    // ACTION PLANS
    // ========================================================================
    const actionPlansBtn = document.getElementById('action-plans-btn');
    if (actionPlansBtn) {
      this.eventManager.addEventListener(actionPlansBtn, 'click', async () => {
        // 🔧 v2.9.283: Usar LearningLazyLoader para carga dinámica
        if (window.learningLazyLoader) {
          await window.learningLazyLoader.ensureActionPlans();
        }

        const actionPlans = this.getDependency('actionPlans') || window.actionPlans;
        if (actionPlans) {
          actionPlans.show();
        }
      });
    }

    // ========================================================================
    // CHAPTER RESOURCES Y BOOK RESOURCES
    // ========================================================================
    this.attachMultiDevice(
      ['chapter-resources-btn'],
      this.createModalHandler('chapterResourcesModal', closeDropdownHelper, 'open', () => this.currentChapter?.id)
    );

    this.attachMultiDevice(
      ['book-resources-btn'],
      this.createModalHandler('resourcesViewer', closeDropdownHelper)
    );

    // ========================================================================
    // DONATIONS/SUPPORT
    // ========================================================================
    this.attachMultiDevice(
      ['donations-btn', 'support-btn'],
      this.createModalHandler('donationsModal')
    );

    // ========================================================================
    // PREMIUM EDITION
    // ========================================================================
    this.attachMultiDeviceWithMenuClose(
      ['premium-edition-btn', 'premium-edition-btn-mobile', 'premium-edition-btn-dropdown'],
      this.createMethodHandler('showPremiumDownloadModal'),
      closeMobileMenuDropdown,
      closeDropdownHelper
    );

    // ========================================================================
    // SETTINGS MODAL
    // ========================================================================
    this.attachMultiDevice(
      ['open-settings-modal-btn', 'open-settings-modal-btn-mobile', 'open-settings-modal-btn-tablet'],
      async () => {
        document.getElementById('mobile-menu')?.classList.add('hidden');
        document.getElementById('more-actions-dropdown')?.classList.add('hidden');

        // Lazy load Settings Modal (124KB) - loads only when user clicks
        if (window.lazyLoader && !window.lazyLoader.isLoaded('settings-modal')) {
          await window.lazyLoader.loadSettingsModal();
        }

        const SettingsModal = this.getDependency('SettingsModal');
        if (SettingsModal) {
          const settingsModal = new SettingsModal();
          settingsModal.show();
        }
      }
    );

    // ========================================================================
    // HELP CENTER
    // ========================================================================
    this.attachMultiDevice(
      ['open-help-center-btn', 'open-help-center-btn-tablet', 'open-help-center-btn-mobile'],
      this.createModalHandler('helpCenterModal', () => {
        document.getElementById('mobile-menu')?.classList.add('hidden');
        document.getElementById('more-actions-dropdown')?.classList.add('hidden');
        document.getElementById('settings-dropdown')?.classList.add('hidden');
      })
    );

    // ========================================================================
    // LANGUAGE SELECTOR
    // ========================================================================
    this.attachMultiDeviceWithMenuClose(
      ['language-selector-btn', 'language-selector-btn-mobile', 'language-selector-btn-dropdown'],
      this.createModalHandler('languageSelector'),
      closeMobileMenuDropdown,
      closeDropdownHelper
    );

    // ========================================================================
    // THEME TOGGLE
    // ========================================================================
    const themeToggleHandler = () => {
      const themeHelper = this.getDependency('themeHelper');
      if (themeHelper) {
        themeHelper.toggle();
        this.bookReader.updateThemeIcons();
        this.showToast('info', `Tema: ${themeHelper.getThemeLabel()}`);
      }
    };

    this.attachMultiDeviceWithMenuClose(
      ['theme-toggle-btn', 'theme-toggle-btn-mobile', 'theme-toggle-btn-dropdown'],
      themeToggleHandler,
      closeMobileMenuDropdown,
      closeDropdownHelper
    );

    // ========================================================================
    // SHARE CHAPTER
    // ========================================================================
    this.attachMultiDeviceWithMenuClose(
      ['share-chapter-btn', 'share-chapter-btn-mobile', 'share-chapter-btn-dropdown'],
      () => this.bookReader.shareCurrentChapter(),
      closeMobileMenuDropdown,
      closeDropdownHelper
    );

    // ========================================================================
    // MI CUENTA
    // ========================================================================
    this.attachMultiDeviceWithMenuClose(
      ['my-account-btn', 'my-account-btn-mobile', 'my-account-btn-tablet'],
      () => this.bookReader.openProfile(),
      closeMobileMenuDropdown,
      closeDropdownHelper
    );

    // ========================================================================
    // LEARNING PATHS
    // ========================================================================
    this.attachMultiDeviceWithMenuClose(
      ['learning-paths-btn-desktop', 'learning-paths-btn-mobile', 'learning-paths-btn-dropdown'],
      async () => {
        // Lazy load Learning Paths (100KB) - loads only when user clicks
        if (window.lazyLoader && !window.lazyLoader.isLoaded('learning-paths')) {
          await window.lazyLoader.loadLearningPaths();
        }

        const learningPaths = this.getDependency('learningPaths');
        if (learningPaths) {
          const currentBookId = this.bookEngine.getCurrentBook();
          learningPaths.open(currentBookId);
        } else {
          this.showToast('error', 'Learning Paths no disponible');
        }
      },
      closeMobileMenuDropdown,
      closeDropdownHelper
    );

    // ========================================================================
    // BOOK SWITCH HANDLERS
    // ========================================================================
    this.attachMultiDevice(
      ['manual-practico-btn'],
      this.createBookSwitchHandler('manual-practico')
    );

    this.attachMultiDevice(
      ['practicas-radicales-btn'],
      this.createBookSwitchHandler('practicas-radicales')
    );

    // ========================================================================
    // MOBILE MENU BUTTONS
    // ========================================================================
    this.attachMultiDevice(
      ['notes-btn-mobile'],
      this.createModalHandler('notesModal', closeMobileMenuDropdown, 'open', () => this.currentChapter?.id)
    );

    this.attachMultiDevice(
      ['timeline-btn-mobile'],
      this.createModalHandler('timelineViewer', closeMobileMenuDropdown)
    );

    this.attachMultiDevice(
      ['chapter-resources-btn-mobile'],
      this.createModalHandler('chapterResourcesModal', closeMobileMenuDropdown, 'open', () => this.currentChapter?.id)
    );

    this.attachMultiDevice(
      ['book-resources-btn-mobile'],
      this.createModalHandler('resourcesViewer', closeMobileMenuDropdown)
    );

    this.attachMultiDevice(
      ['manual-practico-btn-mobile'],
      this.createBookSwitchHandler('manual-practico', closeMobileMenuDropdown)
    );

    this.attachMultiDevice(
      ['practicas-radicales-btn-mobile'],
      this.createBookSwitchHandler('practicas-radicales', closeMobileMenuDropdown)
    );

    this.attachMultiDevice(['koan-btn-mobile'], () => {
      closeMobileMenuDropdown();
      const koanModal = this.getDependency('koanModal');
      if (koanModal) {
        koanModal.setCurrentChapter(this.currentChapter?.id);
        koanModal.open(this.currentChapter?.id);
      } else {
        this.showToast('error', 'error.koanNotAvailable');
      }
    });

    this.attachMultiDevice(['android-download-btn-mobile'], () => {
      closeMobileMenuDropdown();
      const apkUrl = this.bookEngine.getLatestAPK();
      window.open(apkUrl, '_blank');
    });

    this.attachMultiDevice(
      ['donations-btn-mobile'],
      this.createModalHandler('donationsModal', closeMobileMenuDropdown)
    );

    // ========================================================================
    // TABLET DROPDOWN MENU
    // ========================================================================
    const moreActionsBtn = document.getElementById('more-actions-btn');
    const moreActionsDropdown = document.getElementById('more-actions-dropdown');

    if (moreActionsBtn && moreActionsDropdown) {
      if (!this._moreActionsToggleHandler) {
        this._moreActionsToggleHandler = (e) => {
          e.stopPropagation();
          moreActionsDropdown.classList.toggle('hidden');
        };
      }

      this.eventManager.addEventListener(moreActionsBtn, 'click', this._moreActionsToggleHandler);

      if (!this._moreActionsClickOutsideAttached) {
        this._moreActionsClickOutsideHandler = (e) => {
          if (!moreActionsBtn.contains(e.target) && !moreActionsDropdown.contains(e.target)) {
            moreActionsDropdown.classList.add('hidden');
          }
        };
        this.eventManager.addEventListener(document, 'click', this._moreActionsClickOutsideHandler);
        this._moreActionsClickOutsideAttached = true;
      }
    }

    // ========================================================================
    // DESKTOP DROPDOWN MENUS
    // ========================================================================
    this.setupDropdown('tools-dropdown-btn', 'tools-dropdown');
    this.setupDropdown('book-features-dropdown-btn', 'book-features-dropdown');
    this.setupDropdown('settings-dropdown-btn', 'settings-dropdown');

    // Cerrar dropdowns al hacer click fuera
    if (!this._desktopDropdownsClickOutsideAttached) {
      this._desktopDropdownsClickOutsideHandler = (e) => {
        const dropdowns = ['tools-dropdown', 'book-features-dropdown', 'settings-dropdown'];
        const btns = ['tools-dropdown-btn', 'book-features-dropdown-btn', 'settings-dropdown-btn'];

        let clickedInside = false;
        btns.forEach((btnId, i) => {
          const btn = document.getElementById(btnId);
          const dropdown = document.getElementById(dropdowns[i]);
          if ((btn && btn.contains(e.target)) || (dropdown && dropdown.contains(e.target))) {
            clickedInside = true;
          }
        });

        if (!clickedInside) {
          dropdowns.forEach(id => {
            document.getElementById(id)?.classList.add('hidden');
          });
        }
      };
      this.eventManager.addEventListener(document, 'click', this._desktopDropdownsClickOutsideHandler);
      this._desktopDropdownsClickOutsideAttached = true;
    }

    // ========================================================================
    // DROPDOWN BUTTONS
    // ========================================================================
    this.attachMultiDevice(
      ['notes-btn-dropdown'],
      this.createModalHandler('notesModal', closeDropdownHelper, 'open', () => this.currentChapter?.id)
    );

    this.attachMultiDevice(
      ['timeline-btn-dropdown'],
      this.createModalHandler('timelineViewer', closeDropdownHelper)
    );

    this.attachMultiDevice(
      ['chapter-resources-btn-dropdown'],
      this.createModalHandler('chapterResourcesModal', closeDropdownHelper, 'open', () => this.currentChapter?.id)
    );

    this.attachMultiDevice(
      ['book-resources-btn-dropdown'],
      this.createModalHandler('resourcesViewer', closeDropdownHelper)
    );

    this.attachMultiDevice(
      ['manual-practico-btn-dropdown'],
      this.createBookSwitchHandler('manual-practico', closeDropdownHelper)
    );

    this.attachMultiDevice(
      ['practicas-radicales-btn-dropdown'],
      this.createBookSwitchHandler('practicas-radicales', closeDropdownHelper)
    );

    this.attachMultiDevice(['koan-btn-dropdown'], () => {
      closeDropdownHelper();
      const koanModal = this.getDependency('koanModal');
      if (koanModal) {
        koanModal.setCurrentChapter(this.currentChapter?.id);
        koanModal.open(this.currentChapter?.id);
      }
    });

    this.attachMultiDevice(['android-btn-dropdown'], () => {
      closeDropdownHelper();
      const apkUrl = this.bookEngine.getLatestAPK();
      window.open(apkUrl, '_blank');
    });

    this.attachMultiDevice(
      ['donations-btn-dropdown'],
      this.createModalHandler('donationsModal', closeDropdownHelper)
    );

    // ========================================================================
    // CHAPTER READ TOGGLE BUTTONS
    // ========================================================================
    const readToggleBtns = document.querySelectorAll('.chapter-read-toggle');
    readToggleBtns.forEach(btn => {
      this.eventManager.addEventListener(btn, 'click', (e) => {
        e.stopPropagation();
        const chapterId = btn.getAttribute('data-chapter-id');
        this.bookEngine.toggleChapterRead(chapterId);
        this.bookReader.updateSidebar();
      });
    });

    // ========================================================================
    // CHAPTER TITLE AREAS
    // ========================================================================
    const chapterTitleAreas = document.querySelectorAll('.chapter-title-area');
    chapterTitleAreas.forEach(area => {
      this.eventManager.addEventListener(area, 'click', () => {
        const chapterId = area.getAttribute('data-chapter-id');
        this.bookReader.navigateToChapter(chapterId);
        if (window.innerWidth < 768 && this.bookReader.sidebarOpen) {
          this.bookReader.toggleSidebar();
        }
      });
    });

    // ========================================================================
    // CHAPTER ITEMS
    // ========================================================================
    const chapterItems = document.querySelectorAll('.chapter-item');
    chapterItems.forEach(item => {
      this.eventManager.addEventListener(item, 'click', (e) => {
        if (e.target.closest('.chapter-read-toggle') || e.target.closest('.chapter-title-area')) {
          return;
        }
        const chapterId = item.getAttribute('data-chapter-id');
        this.bookReader.navigateToChapter(chapterId);
        if (window.innerWidth < 768 && this.bookReader.sidebarOpen) {
          this.bookReader.toggleSidebar();
        }
      });
    });

    // ========================================================================
    // MARK CHAPTER AS READ
    // ========================================================================
    if (!this._markReadHandler) {
      this._markReadHandler = () => {
        if (this.currentChapter?.id) {
          this.bookEngine.toggleChapterRead(this.currentChapter.id);
          const markReadSection = document.querySelector('.mark-read-section');
          if (markReadSection) {
            markReadSection.outerHTML = this.bookReader.renderMarkAsReadButton();
            const newBtn = document.getElementById('mark-chapter-read-btn');
            if (newBtn) {
              this.eventManager.addEventListener(newBtn, 'click', this._markReadHandler);
            }
            const Icons = this.getDependency('Icons');
            if (Icons) Icons.init();
          }
          this.bookReader.updateSidebar();
        }
      };
    }

    const markReadBtn = document.getElementById('mark-chapter-read-btn');
    if (markReadBtn) {
      this.eventManager.addEventListener(markReadBtn, 'click', this._markReadHandler);
    }

    // ========================================================================
    // ACTION CARDS
    // ========================================================================
    const actionCards = document.querySelectorAll('.action-card');
    actionCards.forEach(card => {
      this.eventManager.addEventListener(card, 'click', async (e) => {
        const action = card.getAttribute('data-action');

        if (action === 'quiz') {
          const InteractiveQuiz = this.getDependency('InteractiveQuiz');
          if (InteractiveQuiz && this.currentChapter && this.currentChapter.quiz) {
            const quiz = new InteractiveQuiz(this.currentChapter.quiz, this.currentChapter.id);
            quiz.start();
          }
        } else if (action === 'resources') {
          // Lazy load Chapter Resources Modal (36KB)
          if (window.lazyLoader && !window.lazyLoader.isLoaded('chapter-resources-modal')) {
            await window.lazyLoader.loadChapterResourcesModal();
          }

          const chapterResourcesModal = this.getDependency('chapterResourcesModal');
          if (chapterResourcesModal) {
            const chapterId = this.currentChapter?.id || null;
            chapterResourcesModal.open(chapterId);
          }
        } else if (action === 'reflection') {
          this.bookReader.scrollToElement('.closing-question');
        }
      });
    });

    // ========================================================================
    // PREVIOUS/NEXT BUTTONS
    // ========================================================================
    const prevBtn = document.getElementById('prev-chapter');
    if (prevBtn) {
      this.eventManager.addEventListener(prevBtn, 'click', () => {
        const chapterId = prevBtn.getAttribute('data-chapter-id');
        this.bookReader.navigateToChapter(chapterId);
      });
    }

    const nextBtn = document.getElementById('next-chapter');
    if (nextBtn) {
      this.eventManager.addEventListener(nextBtn, 'click', () => {
        const chapterId = nextBtn.getAttribute('data-chapter-id');
        this.bookReader.navigateToChapter(chapterId);
      });
    }

    // ========================================================================
    // CROSS-REFERENCE ITEMS
    // ========================================================================
    const crossRefItems = document.querySelectorAll('.reference');
    crossRefItems.forEach(item => {
      this.eventManager.addEventListener(item, 'click', async () => {
        const targetBook = item.getAttribute('data-book');
        const targetChapter = item.getAttribute('data-chapter');

        if (!targetBook) {
          this.showToast('warning', 'Referencia sin libro destino');
          return;
        }

        try {
          this.showToast('info', `Navegando a ${targetBook}...`);
          await this.bookEngine.loadBook(targetBook);
          this.bookReader.applyBookTheme();

          if (targetChapter) {
            const chapters = this.bookEngine.getChapters();
            const chapter = chapters.find(c => c.id === targetChapter || c.slug === targetChapter);
            if (chapter) {
              await this.bookReader.navigateTo(chapter.id);
            } else {
              await this.bookReader.navigateTo(chapters[0]?.id);
            }
          } else {
            const chapters = this.bookEngine.getChapters();
            if (chapters.length > 0) {
              await this.bookReader.navigateTo(chapters[0].id);
            }
          }

          this.showToast('success', `Ahora leyendo: ${this.bookEngine.getCurrentBookData()?.title || targetBook}`);
        } catch (error) {
          logger.error('Error navegando a referencia cruzada:', error);
          this.showToast('error', 'Error al cargar el libro referenciado');
        }
      });
    });

    // ========================================================================
    // PREMIUM EDITION DOWNLOAD BUTTON
    // ========================================================================
    const downloadPremiumBtn = document.getElementById('download-premium-btn');
    if (downloadPremiumBtn) {
      this.eventManager.addEventListener(downloadPremiumBtn, 'click', () => {
        this.bookReader.showPremiumDownloadModal();
      });
    }

    // ========================================================================
    // EXERCISE LINK BUTTONS
    // ========================================================================
    this.attachExerciseLinkListeners();

    // ========================================================================
    // CROSS REFERENCE BUTTONS
    // ========================================================================
    this.attachCrossReferenceListeners();

    // ========================================================================
    // ACTION LINK BUTTONS
    // ========================================================================
    this.attachActionLinkListeners();

    // ========================================================================
    // AI SUGGESTIONS
    // ========================================================================
    const aiSuggestions = this.getDependency('aiSuggestions');
    if (aiSuggestions) {
      aiSuggestions.attachToChapterContent();
    }
  }

  // ==========================================================================
  // EXERCISE LINK LISTENERS
  // ==========================================================================

  attachExerciseLinkListeners() {
    const exerciseLinkBtns = document.querySelectorAll('.exercise-link-btn');
    exerciseLinkBtns.forEach(btn => {
      this.eventManager.addEventListener(btn, 'click', async () => {
        const targetBook = btn.getAttribute('data-book');
        const exerciseId = btn.getAttribute('data-exercise-id');
        const exerciseTitle = btn.getAttribute('data-exercise-title');

        try {
          await this.bookEngine.loadBook(targetBook);
          this.bookReader.applyBookTheme();

          let targetChapterId = null;

          if (exerciseId) {
            targetChapterId = exerciseId;
            const chapter = this.bookEngine.navigateToChapter(targetChapterId);
            if (!chapter) {
              targetChapterId = this.bookEngine.findChapterByExerciseId(exerciseId);
            }
          } else if (exerciseTitle) {
            targetChapterId = this.bookEngine.findChapterByExerciseTitle(exerciseTitle);
          }

          if (targetChapterId) {
            this.bookReader.navigateToChapter(targetChapterId);
          } else {
            this.bookReader.navigateToChapter(this.bookEngine.getFirstChapter().id);
          }
        } catch (error) {
          logger.error('Error navigating to exercise:', error);
          this.showToast('error', 'error.navigationFailed');
        }
      });
    });
  }

  // ==========================================================================
  // CROSS REFERENCE LISTENERS
  // ==========================================================================

  attachCrossReferenceListeners() {
    const crossRefBtns = document.querySelectorAll('.cross-reference-btn');
    crossRefBtns.forEach(btn => {
      this.eventManager.addEventListener(btn, 'click', async () => {
        const targetBook = btn.getAttribute('data-book');
        const targetChapterId = btn.getAttribute('data-chapter-id');

        try {
          await this.bookEngine.loadBook(targetBook);
          this.bookReader.applyBookTheme();

          if (targetChapterId) {
            const chapter = this.bookEngine.getChapter(targetChapterId);
            if (!chapter) {
              logger.warn(`Cross-reference target not found: ${targetChapterId}`);
              this.showToast('warning', 'Referencia no encontrada');
              this.bookReader.navigateToChapter(this.bookEngine.getFirstChapter().id);
              return;
            }
            this.bookReader.navigateToChapter(targetChapterId);
          } else {
            this.bookReader.navigateToChapter(this.bookEngine.getFirstChapter().id);
          }
        } catch (error) {
          logger.error('Error navigating to cross reference:', error);
          this.showToast('error', 'error.navigationFailed');
        }
      });
    });
  }

  // ==========================================================================
  // ACTION LINK LISTENERS
  // ==========================================================================

  attachActionLinkListeners() {
    // Open actions book buttons
    const openActionsBookBtns = document.querySelectorAll('.open-actions-book-btn');
    openActionsBookBtns.forEach(btn => {
      this.eventManager.addEventListener(btn, 'click', async () => {
        const targetBook = btn.getAttribute('data-book');

        try {
          await this.bookEngine.loadBook(targetBook);
          this.bookReader.applyBookTheme();
          const firstChapter = this.bookEngine.getFirstChapter();
          this.bookReader.navigateToChapter(firstChapter?.id || 'prologo');
        } catch (error) {
          logger.error('Error opening actions book:', error);
          this.showToast('error', 'Error al abrir la Guia de Acciones');
        }
      });
    });

    // Open action detail buttons
    const openActionDetailBtns = document.querySelectorAll('.open-action-detail-btn');
    openActionDetailBtns.forEach(btn => {
      this.eventManager.addEventListener(btn, 'click', async () => {
        const targetBook = btn.getAttribute('data-book');
        const targetChapterId = btn.getAttribute('data-chapter');

        try {
          await this.bookEngine.loadBook(targetBook);
          this.bookReader.applyBookTheme();

          if (targetChapterId) {
            const chapter = this.bookEngine.getChapter(targetChapterId);
            if (!chapter) {
              logger.warn(`Action detail target not found: ${targetChapterId}`);
              this.showToast('warning', 'Referencia no encontrada');
              this.bookReader.navigateToChapter(this.bookEngine.getFirstChapter().id);
              return;
            }
            this.bookReader.currentChapter = this.bookEngine.navigateToChapter(targetChapterId);
          }

          if (!this.bookReader.currentChapter) {
            this.bookReader.navigateToChapter(this.bookEngine.getFirstChapter().id);
          }

          const contentArea = document.querySelector('.chapter-content');
          if (contentArea) contentArea.scrollTop = 0;
        } catch (error) {
          logger.error('Error navigating to action detail:', error);
          this.showToast('error', 'Error al abrir la accion');
        }
      });
    });

    // Toolkit exercise buttons
    const toolkitExerciseBtns = document.querySelectorAll('.toolkit-exercise-btn');
    toolkitExerciseBtns.forEach(btn => {
      this.eventManager.addEventListener(btn, 'click', async () => {
        const targetBook = btn.getAttribute('data-book');
        const targetChapterId = btn.getAttribute('data-chapter-id');

        try {
          await this.bookEngine.loadBook(targetBook);
          this.bookReader.applyBookTheme();

          if (targetChapterId) {
            const chapter = this.bookEngine.getChapter(targetChapterId);
            if (!chapter) {
              logger.warn(`Toolkit exercise target not found: ${targetChapterId}`);
              this.showToast('warning', 'Referencia no encontrada');
              this.bookReader.navigateToChapter(this.bookEngine.getFirstChapter().id);
              return;
            }
            this.bookReader.currentChapter = this.bookEngine.navigateToChapter(targetChapterId);
          }

          if (!this.bookReader.currentChapter) {
            this.bookReader.navigateToChapter(this.bookEngine.getFirstChapter().id);
          }

          const contentArea = document.querySelector('.chapter-content');
          if (contentArea) contentArea.scrollTop = 0;
        } catch (error) {
          logger.error('Error navigating to toolkit exercise:', error);
          this.showToast('error', 'Error al abrir el ejercicio del Toolkit');
        }
      });
    });

    // Open toolkit book buttons
    const openToolkitBookBtns = document.querySelectorAll('.open-toolkit-book-btn');
    openToolkitBookBtns.forEach(btn => {
      this.eventManager.addEventListener(btn, 'click', async () => {
        const targetBook = btn.getAttribute('data-book');

        try {
          await this.bookEngine.loadBook(targetBook);
          this.bookReader.applyBookTheme();
          const firstChapter = this.bookEngine.getFirstChapter();
          this.bookReader.navigateToChapter(firstChapter?.id || 'toolkit-1');
        } catch (error) {
          logger.error('Error opening toolkit book:', error);
          this.showToast('error', 'Error al abrir el Toolkit de Transicion');
        }
      });
    });

    // Manifiesto link buttons
    const manifiestoLinkBtns = document.querySelectorAll('.manifiesto-link-btn');
    manifiestoLinkBtns.forEach(btn => {
      this.eventManager.addEventListener(btn, 'click', async () => {
        const targetBook = btn.getAttribute('data-book');
        const targetChapterId = btn.getAttribute('data-chapter-id');

        try {
          await this.bookEngine.loadBook(targetBook);
          this.bookReader.applyBookTheme();

          if (targetChapterId) {
            this.bookReader.currentChapter = this.bookEngine.navigateToChapter(targetChapterId);
          }

          if (!this.bookReader.currentChapter) {
            this.bookReader.navigateToChapter(this.bookEngine.getFirstChapter().id);
          }

          const contentArea = document.querySelector('.chapter-content');
          if (contentArea) contentArea.scrollTop = 0;
        } catch (error) {
          logger.error('Error navigating to Manifiesto:', error);
          this.showToast('error', 'Error al abrir el Manifiesto');
        }
      });
    });

    // Parent book buttons
    const parentBookBtns = document.querySelectorAll('.parent-book-btn');
    parentBookBtns.forEach(btn => {
      this.eventManager.addEventListener(btn, 'click', async () => {
        const targetBook = btn.getAttribute('data-book');
        const targetChapterId = btn.getAttribute('data-chapter-id');

        try {
          await this.bookEngine.loadBook(targetBook);
          this.bookReader.applyBookTheme();

          if (targetChapterId) {
            const chapter = this.bookEngine.getChapter(targetChapterId);
            if (!chapter) {
              logger.warn(`Parent book target not found: ${targetChapterId}`);
              this.showToast('warning', 'Referencia no encontrada');
              this.bookReader.navigateToChapter(this.bookEngine.getFirstChapter().id);
              return;
            }
            this.bookReader.currentChapter = this.bookEngine.navigateToChapter(targetChapterId);
          }

          if (!this.bookReader.currentChapter) {
            this.bookReader.navigateToChapter(this.bookEngine.getFirstChapter().id);
          }

          const contentArea = document.querySelector('.chapter-content');
          if (contentArea) contentArea.scrollTop = 0;
        } catch (error) {
          logger.error('Error navigating to parent book:', error);
          this.showToast('error', 'Error al abrir el libro principal');
        }
      });
    });
  }

  // ==========================================================================
  // CONTENT EVENT LISTENERS (para actualizaciones parciales)
  // ==========================================================================

  /**
   * Adjunta event listeners solo para elementos dentro del contenido del capitulo
   * Usado despues de updateChapterContent() para restaurar interactividad
   */
  attachContentEventListeners() {
    try {
      // Mark chapter as read button
      if (!this._markReadHandler) {
        this._markReadHandler = () => {
          if (this.currentChapter?.id) {
            this.bookEngine.toggleChapterRead(this.currentChapter.id);
            const markReadSection = document.querySelector('.mark-read-section');
            if (markReadSection) {
              markReadSection.outerHTML = this.bookReader.renderMarkAsReadButton();
              const newBtn = document.getElementById('mark-chapter-read-btn');
              if (newBtn) {
                this.eventManager.addEventListener(newBtn, 'click', this._markReadHandler);
              }
              const Icons = this.getDependency('Icons');
              if (Icons) Icons.init();
            }
            this.bookReader.updateSidebar();
          }
        };
      }

      const markReadBtn = document.getElementById('mark-chapter-read-btn');
      if (markReadBtn) {
        this.eventManager.addEventListener(markReadBtn, 'click', this._markReadHandler);
      }

      // Action cards
      const actionCards = document.querySelectorAll('.action-card');
      actionCards.forEach(card => {
        const action = card.getAttribute('data-action');
        if (action) {
          this.eventManager.addEventListener(card, 'click', async (e) => {
            if (action === 'quiz') {
              const InteractiveQuiz = this.getDependency('InteractiveQuiz');
              if (InteractiveQuiz && this.currentChapter && this.currentChapter.quiz) {
                const quiz = new InteractiveQuiz(this.currentChapter.quiz, this.currentChapter.id);
                quiz.start();
              }
            } else if (action === 'resources') {
              // Lazy load Chapter Resources Modal (36KB)
              if (window.lazyLoader && !window.lazyLoader.isLoaded('chapter-resources-modal')) {
                await window.lazyLoader.loadChapterResourcesModal();
              }

              const chapterResourcesModal = this.getDependency('chapterResourcesModal');
              if (chapterResourcesModal) {
                const chapterId = this.currentChapter?.id || null;
                chapterResourcesModal.open(chapterId);
              }
            } else if (action === 'reflection') {
              this.bookReader.scrollToElement('.closing-question');
            }
          });
        }
      });

      // Previous/Next chapter buttons
      const prevBtn = document.getElementById('prev-chapter');
      if (prevBtn) {
        this.eventManager.addEventListener(prevBtn, 'click', () => {
          const chapterId = prevBtn.getAttribute('data-chapter-id');
          this.bookReader.navigateToChapter(chapterId);
        });
      }

      const nextBtn = document.getElementById('next-chapter');
      if (nextBtn) {
        this.eventManager.addEventListener(nextBtn, 'click', () => {
          const chapterId = nextBtn.getAttribute('data-chapter-id');
          this.bookReader.navigateToChapter(chapterId);
        });
      }

      // AI Suggestions
      const aiSuggestions = this.getDependency('aiSuggestions');
      if (aiSuggestions) {
        aiSuggestions.attachToChapterContent();
      }

      // Re-inicializar iconos
      const Icons = this.getDependency('Icons');
      if (Icons) Icons.init();

    } catch (error) {
      logger.error('[BookReaderEvents] Error adjuntando content listeners:', error);
    }
  }

  // ==========================================================================
  // HEADER LISTENERS (para actualizaciones parciales)
  // ==========================================================================

  /**
   * Re-adjunta event listeners del header despues de updateHeader()
   */
  attachHeaderListeners() {
    try {
      if (typeof logger !== 'undefined') {
        logger.debug('[BookReaderEvents] Re-adjuntando listeners del header...');
      }

      // Toggle sidebar - Crear handler si no existe (fix v2.9.285)
      if (!this._toggleSidebarHandler) {
        this._toggleSidebarHandler = (e) => {
          e.stopPropagation();
          e.preventDefault();
          this.bookReader.toggleSidebar();
        };
      }

      const toggleSidebar = document.getElementById('toggle-sidebar');
      if (toggleSidebar) {
        this.eventManager.addEventListener(toggleSidebar, 'click', this._toggleSidebarHandler);
      }

      // Audioreader - Crear handler si no existe (fix v2.9.285)
      if (!this._audioreaderHandler) {
        this._audioreaderHandler = async (e) => {
          e.stopPropagation();
          e.preventDefault();
          const audioReader = this.getDependency('audioReader');
          if (audioReader) {
            if (audioReader.isPlaying) {
              await audioReader.pause();
            } else {
              await audioReader.play();
            }
          }
        };
      }

      const audioreaderBtn = document.getElementById('audioreader-btn');
      const audioreaderBtnTablet = document.getElementById('audioreader-btn-tablet');
      const audioreaderBtnMobile = document.getElementById('audioreader-btn-mobile');

      if (audioreaderBtn) {
        this.eventManager.addEventListener(audioreaderBtn, 'click', this._audioreaderHandler);
      }
      if (audioreaderBtnTablet) {
        this.eventManager.addEventListener(audioreaderBtnTablet, 'click', this._audioreaderHandler);
      }
      if (audioreaderBtnMobile) {
        this.eventManager.addEventListener(audioreaderBtnMobile, 'click', this._audioreaderHandler);
      }

      // Audio expand button
      if (this._audioExpandHandler) {
        const audioExpandBtn = document.getElementById('audio-expand-btn-mobile');
        if (audioExpandBtn) {
          this.eventManager.addEventListener(audioExpandBtn, 'click', this._audioExpandHandler);
        }
      }

      // Support/Donations
      const supportHandler = async () => {
        const modal = this.getDependency('donationsModal');
        if (modal && typeof modal.open === 'function') {
          await modal.open();
        }
      };

      ['support-btn', 'support-btn-tablet', 'support-btn-mobile'].forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
          this.eventManager.addEventListener(btn, 'click', supportHandler);
        }
      });

      // Notes
      const notesHandler = async () => {
        const modal = this.getDependency('notesModal');
        if (modal && typeof modal.open === 'function') {
          await modal.open();
        }
      };

      const notesBtn = document.getElementById('notes-btn');
      if (notesBtn) {
        this.eventManager.addEventListener(notesBtn, 'click', notesHandler);
      }

      // AI Chat
      const aiChatHandler = async () => {
        // 🔧 v2.9.283: Usar AILazyLoader para carga dinámica
        if (window.aiLazyLoader) {
          await window.aiLazyLoader.showAIChatModal();
        } else {
          const modal = this.getDependency('aiChatModal');
          if (modal && typeof modal.open === 'function') {
            await modal.open();
          }
        }
      };

      ['ai-chat-btn', 'ai-chat-btn-tablet'].forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
          this.eventManager.addEventListener(btn, 'click', aiChatHandler);
        }
      });

      // Mobile menu
      const mobileMenuBtn = document.getElementById('mobile-menu-btn');
      if (mobileMenuBtn && this._mobileMenuHandler) {
        this.eventManager.addEventListener(mobileMenuBtn, 'click', this._mobileMenuHandler);
      }

      if (typeof logger !== 'undefined') {
        logger.debug('[BookReaderEvents] Listeners del header re-adjuntados');
      }
    } catch (error) {
      logger.error('[BookReaderEvents] Error adjuntando listeners del header:', error);
    }
  }

  // ==========================================================================
  // NAVIGATION LISTENERS (para actualizaciones parciales)
  // ==========================================================================

  /**
   * Adjunta event listeners para botones de navegacion prev/next
   * Con soporte para touch en Android
   */
  attachNavigationListeners() {
    try {
      setTimeout(() => {
        const prevBtn = document.getElementById('prev-chapter');
        const nextBtn = document.getElementById('next-chapter');

        if (prevBtn) {
          const prevChapterId = prevBtn.getAttribute('data-chapter-id');

          if (prevChapterId) {
            const handler = (e) => {
              e.preventDefault();
              e.stopPropagation();
              this.bookReader.navigateToChapter(prevChapterId);
            };

            // Remover listeners anteriores
            if (this._prevChapterHandler) {
              prevBtn.removeEventListener('click', this._prevChapterHandler);
              prevBtn.removeEventListener('touchend', this._prevChapterHandler);
            }

            this._prevChapterHandler = handler;
            prevBtn.addEventListener('click', handler, { passive: false });
            prevBtn.addEventListener('touchend', handler, { passive: false });
          }
        }

        if (nextBtn) {
          const nextChapterId = nextBtn.getAttribute('data-chapter-id');

          if (nextChapterId) {
            const handler = (e) => {
              e.preventDefault();
              e.stopPropagation();
              this.bookReader.navigateToChapter(nextChapterId);
            };

            // Remover listeners anteriores
            if (this._nextChapterHandler) {
              nextBtn.removeEventListener('click', this._nextChapterHandler);
              nextBtn.removeEventListener('touchend', this._nextChapterHandler);
            }

            this._nextChapterHandler = handler;
            nextBtn.addEventListener('click', handler, { passive: false });
            nextBtn.addEventListener('touchend', handler, { passive: false });
          }
        }
      }, 200); // Delay para Android WebView
    } catch (error) {
      logger.error('[BookReaderEvents] Error adjuntando navigation listeners:', error);
    }
  }

  // ==========================================================================
  // CHAPTER LISTENERS (para sidebar)
  // ==========================================================================

  /**
   * Adjunta event listeners para chapter items en el sidebar
   */
  attachChapterListeners() {
    // Chapter read toggle buttons
    const readToggleBtns = document.querySelectorAll('.chapter-read-toggle');
    readToggleBtns.forEach(btn => {
      this.eventManager.addEventListener(btn, 'click', (e) => {
        e.stopPropagation();
        const chapterId = btn.getAttribute('data-chapter-id');
        this.bookEngine.toggleChapterRead(chapterId);
        this.bookReader.updateSidebar();
      });
    });

    // Chapter title areas
    const chapterTitleAreas = document.querySelectorAll('.chapter-title-area');
    chapterTitleAreas.forEach(area => {
      this.eventManager.addEventListener(area, 'click', () => {
        const chapterId = area.getAttribute('data-chapter-id');
        this.bookReader.navigateToChapter(chapterId);
        if (window.innerWidth < 768 && this.bookReader.sidebarOpen) {
          this.bookReader.toggleSidebar();
        }
      });
    });

    // Chapter items
    const chapterItems = document.querySelectorAll('.chapter-item');
    chapterItems.forEach(item => {
      this.eventManager.addEventListener(item, 'click', (e) => {
        if (e.target.closest('.chapter-read-toggle') || e.target.closest('.chapter-title-area')) {
          return;
        }
        const chapterId = item.getAttribute('data-chapter-id');
        this.bookReader.navigateToChapter(chapterId);
        if (window.innerWidth < 768 && this.bookReader.sidebarOpen) {
          this.bookReader.toggleSidebar();
        }
      });
    });
  }

  // ==========================================================================
  // CLEANUP
  // ==========================================================================

  /**
   * Resetea todos los flags y referencias de handlers
   */
  resetFlags() {
    this._eventListenersAttached = false;
    this._bottomNavClickOutsideAttached = false;
    this._moreActionsClickOutsideAttached = false;
    this._desktopDropdownsClickOutsideAttached = false;

    this._toggleSidebarHandler = null;
    this._closeSidebarHandler = null;
    this._backToBibliotecaHandler = null;
    this._mobileMenuHandler = null;
    this._bottomNavMoreHandler = null;
    this._bottomNavClickOutsideHandler = null;
    this._audioreaderHandler = null;
    this._audioExpandHandler = null;
    this._moreActionsToggleHandler = null;
    this._moreActionsClickOutsideHandler = null;
    this._desktopDropdownsClickOutsideHandler = null;
    this._markReadHandler = null;
    this._prevChapterHandler = null;
    this._nextChapterHandler = null;

    this._dropdownHandlers = null;
  }

  /**
   * Limpia event handlers del mapa
   */
  clearEventHandlers() {
    if (this._eventHandlers) {
      this._eventHandlers.forEach((handler, key) => {
        const [elementId, event] = key.split('-');
        const element = document.getElementById(elementId);
        if (element) {
          element.removeEventListener(event, handler);
        }
      });
      this._eventHandlers.clear();
    }
  }

  /**
   * Cleanup completo
   */
  cleanup() {
    this.clearEventHandlers();
    this.resetFlags();
  }

  /**
   * Destructor
   */
  destroy() {
    this.cleanup();
    this.bookReader = null;
  }
}

// Exportar globalmente
window.BookReaderEvents = BookReaderEvents;
