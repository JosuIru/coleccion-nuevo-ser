// ============================================================================
// BIBLIOTECA HANDLERS - Manejadores de eventos y acciones
// ============================================================================
// Módulo extraído de biblioteca.js para mejor organización

/**
 * Clase para gestionar todos los handlers de eventos de la Biblioteca
 */
class BibliotecaHandlers {
  constructor(biblioteca) {
    this.biblioteca = biblioteca;
  }

  // ==========================================================================
  // HANDLERS DE BOTONES DEL MENÚ
  // ==========================================================================

  handleSettingsButton(evento) {
    evento.preventDefault();
    if (window.SettingsModal) {
      const modalConfiguracion = new window.SettingsModal();
      modalConfiguracion.show();
    }
  }

  handleDownloadButton(evento) {
    evento.preventDefault();
    const urlApk = this.biblioteca.bookEngine.getLatestAPK();
    window.open(urlApk, '_blank');
  }

  handleAISettingsButton(evento) {
    evento.preventDefault();
    if (window.aiSettingsModal) window.aiSettingsModal.open();
  }

  handleDonationsButton(evento) {
    evento.preventDefault();
    if (window.donationsModal) window.donationsModal.open();
  }

  handleLanguageButton(evento) {
    evento.preventDefault();
    if (window.languageSelector) window.languageSelector.open();
  }

  handleAboutButton(evento) {
    evento.preventDefault();
    this.biblioteca.modals.showAboutModal();
  }

  async handleLogoutButton(evento) {
    evento.preventDefault();
    this.closeMenuDropdown();

    if (window.authHelper) {
      try {
        await window.authHelper.signOut();
        window.toast?.success('Sesión cerrada correctamente');
        this.biblioteca.utils.clearAdminCache();
        this.biblioteca.render();
      } catch (error) {
        logger.error('Error al cerrar sesión:', error);
        window.toast?.error('Error al cerrar sesión');
      }
    } else {
      window.toast?.info('No hay sesión activa');
    }
  }

  handleMyAccountButton(evento) {
    evento.preventDefault();
    if (window.myAccountModal) {
      window.myAccountModal.show();
    } else if (window.lazyLoader) {
      window.lazyLoader.load('my-account').then(() => {
        if (window.myAccountModal) {
          window.myAccountModal.show();
        } else {
          this.biblioteca.modals.showLoginRequiredModal('Mi Cuenta');
        }
      }).catch(() => {
        this.biblioteca.modals.showLoginRequiredModal('Mi Cuenta');
      });
    } else {
      this.biblioteca.modals.showLoginRequiredModal('Mi Cuenta');
    }
  }

  handleAdminPanelButton(evento) {
    evento.preventDefault();
    const bib = this.biblioteca;

    const checkAndShowAdmin = async () => {
      const user = window.authHelper?.getCurrentUser();
      if (!user) {
        bib.modals.showLoginRequiredModal('Panel de Administración');
        return;
      }

      const isAdmin = await bib.utils.checkIsAdmin(user.id);
      if (!isAdmin) {
        bib.modals.showAccessDeniedModal();
        return;
      }

      if (window.adminPanelModal) {
        window.adminPanelModal.show();
      } else if (window.lazyLoader) {
        window.lazyLoader.load('admin-panel').then(() => {
          if (window.adminPanelModal) {
            window.adminPanelModal.show();
          }
        }).catch(error => {
          logger.error('Error loading admin panel:', error);
          window.toast?.error('Error al cargar el panel de administración.');
        });
      }
    };

    checkAndShowAdmin();
  }

  handlePremiumButton(evento) {
    evento.preventDefault();
    if (window.pricingModal && typeof window.pricingModal.showPricingModal === 'function') {
      window.pricingModal.showPricingModal();
    } else {
      if (window.lazyLoader) {
        window.lazyLoader.load('premium-system').then(() => {
          if (window.pricingModal) {
            window.pricingModal.showPricingModal();
          } else {
            this.biblioteca.modals.showPremiumInfoModal();
          }
        }).catch(() => {
          this.biblioteca.modals.showPremiumInfoModal();
        });
      } else {
        this.biblioteca.modals.showPremiumInfoModal();
      }
    }
  }

  handleProgressButton(evento) {
    evento.preventDefault();
    if (window.progressDashboard) window.progressDashboard.show();
  }

  handleHelpCenterButton(evento) {
    evento.preventDefault();
    if (window.helpCenterModal) {
      window.helpCenterModal.open();
    } else {
      logger.warn('[BibliotecaHandlers] Help Center Modal no disponible');
    }
  }

  handlePracticeLibraryButton(evento) {
    evento.preventDefault();
    this.openPracticeLibrary();
  }

  handleAIPracticeGenerator(evento) {
    evento.preventDefault();
    if (window.aiPracticeGenerator) {
      window.aiPracticeGenerator.open();
    } else {
      logger.warn('[BibliotecaHandlers] AI Practice Generator no disponible');
    }
  }

  handleExplorationHub(evento) {
    evento.preventDefault();
    if (window.ExplorationHub && window.bookEngine) {
      const hub = new window.ExplorationHub(window.bookEngine);
      hub.open('search');
    } else {
      logger.error('[BibliotecaHandlers] ExplorationHub no está disponible');
    }
  }

  handleThemeButton(evento) {
    evento.preventDefault();
    if (window.themeHelper) {
      window.themeHelper.toggle();
      window.themeHelper.updateToggleButtons();
      window.toast?.info(`Tema: ${window.themeHelper.getThemeLabel()}`);
    }
  }

  handleOpenBook(evento, idLibro) {
    evento.preventDefault();
    evento.stopPropagation();
    if (idLibro) {
      logger.log('📖 Opening book:', idLibro);
      this.openBook(idLibro);
    }
  }

  // ==========================================================================
  // HANDLERS DE HERRAMIENTAS ESPECIALES
  // ==========================================================================

  async handleCosmosNavigationButton(evento) {
    evento.preventDefault();
    const bib = this.biblioteca;

    if (bib._loadingCosmos) {
      logger.debug('[BibliotecaHandlers] Cosmos ya se está cargando, ignorando click');
      return;
    }

    if (window.cosmosNavigation) {
      window.cosmosNavigation.show();
      return;
    }

    if (window.lazyLoader) {
      bib._loadingCosmos = true;

      if (window.toast) {
        window.toast.show('📦 Cargando Cosmos del Conocimiento...', 'info', 3000);
      }

      try {
        await window.lazyLoader.load('cosmos-3d');

        if (window.cosmosNavigation) {
          window.cosmosNavigation.show();
          if (window.toast) {
            window.toast.show('✅ Cosmos cargado', 'success', 2000);
          }
        } else {
          logger.error('[BibliotecaHandlers] CosmosNavigation no se inicializó correctamente');
          if (window.toast) {
            window.toast.show('❌ Error inicializando Cosmos', 'error', 3000);
          }
        }
      } catch (error) {
        logger.error('[BibliotecaHandlers] Error cargando cosmos-3d:', error);
        if (window.toast) {
          window.toast.show('❌ Error cargando Cosmos del Conocimiento', 'error', 3000);
        }
      } finally {
        bib._loadingCosmos = false;
      }
    } else {
      logger.error('[BibliotecaHandlers] LazyLoader no está disponible');
      if (window.toast) {
        window.toast.show('❌ Sistema de carga no disponible', 'error', 3000);
      }
    }
  }

  async handleFrankensteinLabCard(evento) {
    evento.preventDefault();

    if (window.frankensteinLabUI) {
      const container = document.getElementById('organism-container');
      if (container) {
        container.innerHTML = '';
        container.classList.remove('hidden');
        document.getElementById('biblioteca-view')?.classList.add('hidden');
        window.frankensteinLabUI.isInitialized = false;
        window.frankensteinLabUI.labStarted = false;
        await window.frankensteinLabUI.init();
      }
      return;
    }

    if (window.lazyLoader) {
      if (window.toast) {
        window.toast.show('📦 Cargando Laboratorio Frankenstein...', 'info', 3000);
      }

      try {
        await window.lazyLoader.load('frankenstein-lab');

        let container = document.getElementById('organism-container');
        if (!container) {
          container = document.createElement('div');
          container.id = 'organism-container';
          container.className = 'organism-container';
          document.body.appendChild(container);
        }

        container.classList.remove('hidden');
        document.getElementById('biblioteca-view')?.classList.add('hidden');

        if (window.FrankensteinLabUI && window.bookEngine) {
          const labInstance = {
            bookEngine: window.bookEngine,
            hide: () => {
              container.classList.add('hidden');
              document.getElementById('biblioteca-view')?.classList.remove('hidden');
            },
            getBookChapters: (book) => {
              const chapters = [];
              if (window.bookEngine?.catalog) {
                const fullBook = window.bookEngine.catalog.books.find(b => b.id === book.id);
                if (fullBook) {
                  if (fullBook.sections && Array.isArray(fullBook.sections)) {
                    fullBook.sections.forEach(section => {
                      if (section.chapters && Array.isArray(section.chapters)) {
                        chapters.push(...section.chapters);
                      }
                    });
                  }
                  if (chapters.length === 0 && fullBook.chapters && Array.isArray(fullBook.chapters)) {
                    chapters.push(...fullBook.chapters);
                  }
                  if (chapters.length > 0) return chapters;
                }
              }
              for (let i = 0; i < 6; i++) {
                chapters.push({
                  id: `cap${i + 1}`,
                  title: `Capítulo ${i + 1}`,
                  tags: ['conocimiento', 'transformación']
                });
              }
              return chapters;
            },
            loadChapterMetadata: async (bookId) => {
              try {
                const response = await fetch(`books/${bookId}/assets/chapter-metadata.json`);
                if (response.ok) {
                  return await response.json();
                }
              } catch (error) {
                // Silent fail
              }
              return {};
            }
          };

          window.frankensteinLabUI = new FrankensteinLabUI(labInstance);
          await window.frankensteinLabUI.init();

          if (window.toast) {
            window.toast.show('✅ Laboratorio cargado', 'success', 2000);
          }
        } else {
          logger.error('[BibliotecaHandlers] FrankensteinLabUI o BookEngine no disponibles');
          if (window.toast) {
            window.toast.show('❌ Error inicializando Laboratorio', 'error', 3000);
          }
        }
      } catch (error) {
        logger.error('[BibliotecaHandlers] Error cargando Frankenstein Lab:', error);
        if (window.toast) {
          window.toast.show('❌ Error cargando Laboratorio Frankenstein', 'error', 3000);
        }
      }
    } else {
      logger.error('[BibliotecaHandlers] LazyLoader no está disponible');
      if (window.toast) {
        window.toast.show('❌ Sistema de carga no disponible', 'error', 3000);
      }
    }
  }

  // Alias para compatibilidad
  handleFrankensteinLabClick(evento) {
    return this.handleFrankensteinLabCard(evento);
  }

  handleCosmosNavigationClick(evento) {
    return this.handleCosmosNavigationButton(evento);
  }

  // ==========================================================================
  // MENU DROPDOWN
  // ==========================================================================

  toggleMenuDropdown(evento) {
    evento.preventDefault();
    evento.stopPropagation();

    const menu = document.getElementById('more-options-menu-bib');
    if (!menu) return;

    const bib = this.biblioteca;
    bib.menuDropdownOpen = !bib.menuDropdownOpen;

    if (bib.menuDropdownOpen) {
      const menuContent = menu.querySelector('.py-1');
      if (menuContent) {
        menuContent.innerHTML = bib.renderer.renderOpcionesMenuDropdown();
      }
      menu.classList.remove('hidden');
    } else {
      menu.classList.add('hidden');
    }
  }

  closeMenuDropdown() {
    const menu = document.getElementById('more-options-menu-bib');
    if (menu) {
      menu.classList.add('hidden');
      this.biblioteca.menuDropdownOpen = false;
    }
  }

  // ==========================================================================
  // SCROLL Y NAVEGACIÓN
  // ==========================================================================

  scrollToTop() {
    const container = document.querySelector('.biblioteca-container');

    if (container) {
      container.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      logger.warn('[BibliotecaHandlers] Container not found for scroll to top');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    this.setActiveBottomTab('inicio');
  }

  scrollToElement(selector) {
    const targetElement = document.querySelector(selector);

    if (!targetElement) {
      logger.warn(`[BibliotecaHandlers] Elemento no encontrado: ${selector}`);
      if (window.toast) {
        window.toast.warning('Referencia no encontrada');
      }
      return;
    }

    targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  scrollToBooks() {
    this.scrollToElement('.books-grid');
    this.setActiveBottomTab('libros');
  }

  openPracticeLibrary() {
    this.setActiveBottomTab('practicas');
    if (window.practiceLibrary) {
      window.practiceLibrary.open();
    } else {
      logger.warn('[BibliotecaHandlers] PracticeLibrary not loaded');
      alert('El sistema de prácticas no está disponible. Por favor, recarga la página e intenta de nuevo.');
    }
  }

  openToolsMenu() {
    this.setActiveBottomTab('herramientas');
    if (window.explorationHub) {
      window.explorationHub.open();
    } else {
      this.scrollToElement('.tools-section');
    }
  }

  async openProfileMenu() {
    this.setActiveBottomTab('perfil');
    if (window.myAccountModal) {
      window.myAccountModal.show();
    } else if (window.lazyLoader) {
      try {
        await window.lazyLoader.load('my-account');
        if (window.myAccountModal) {
          window.myAccountModal.show();
        }
      } catch (err) {
        logger.error('[BibliotecaHandlers] Error cargando my-account:', err);
        if (window.lazyLoader && !window.lazyLoader.isLoaded('auth-modal')) {
          await window.lazyLoader.loadAuthModal();
        }
        if (window.authModal) {
          window.authModal.show('login');
        }
      }
    } else {
      if (window.lazyLoader && !window.lazyLoader.isLoaded('auth-modal')) {
        await window.lazyLoader.loadAuthModal();
      }
      if (window.authModal) {
        window.authModal.show('login');
      }
    }
  }

  setActiveBottomTab(tabName) {
    window.StorageHelper?.set('biblioteca-active-tab', tabName);

    document.querySelectorAll('.app-bottom-nav-tab').forEach(tab => {
      tab.classList.remove('active');
      if (tab.dataset.tab === tabName) {
        tab.classList.add('active');
      }
    });
  }

  // ==========================================================================
  // APERTURA DE LIBROS
  // ==========================================================================

  openDailyPractice(libroId) {
    this.biblioteca.utils.trackPracticeUsage(libroId);
    this.openBook(libroId);
  }

  async openBook(idLibro, idCapituloObjetivo = null) {
    const bib = this.biblioteca;

    try {
      bib.utils.showLoading(`${bib.i18n.t('loading.loadingBook')} ${idLibro}...`);

      await bib.bookEngine.loadBook(idLibro);
      await bib.bookEngine.applyTheme(bib.bookEngine.getCurrentBookConfig());

      bib.utils.debounce('lastReadBook', () => {
        window.StorageHelper?.set('lastReadBook', idLibro);
      }, 500);

      let idCapitulo;

      if (idCapituloObjetivo) {
        idCapitulo = idCapituloObjetivo;
      } else {
        const progresoLibro = bib.bookEngine.getProgress(idLibro);

        if (progresoLibro.lastChapter) {
          idCapitulo = progresoLibro.lastChapter;
        } else {
          const capitulos = bib.bookEngine.getAllChapters();
          idCapitulo = capitulos[0]?.id || 'prologo';
        }
      }

      const capitulo = bib.bookEngine.navigateToChapter(idCapitulo);

      bib.utils.hideLoading();

      bib.hide();
      window.bookReader.show(capitulo);

      if (window.achievementSystem) {
        window.achievementSystem.trackBookOpened(idLibro);
      }

    } catch (error) {
      logger.error('[BibliotecaHandlers] Error opening book:', error);
      window.toast.error(`${bib.i18n.t('error.openBook')}: ${error.message}`, 5000, false);
      bib.utils.hideLoading();
    }
  }

  // ==========================================================================
  // SETUP DE DEVICE DETECTION
  // ==========================================================================

  setupToolDeviceDetection() {
    const isAndroid = /Android/i.test(navigator.userAgent);
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

    BIBLIOTECA_CONFIG.HERRAMIENTAS_ECOSISTEMA.forEach(herramienta => {
      if (!herramienta.hasApk) return;

      const container = document.getElementById(`tool-actions-${herramienta.id}`);
      const deviceInfo = document.getElementById(`device-info-${herramienta.id}`);
      if (!container) return;

      const apkBtn = container.querySelector('.tool-apk-btn');
      const webBtn = container.querySelector('.tool-web-btn');
      const webText = webBtn?.querySelector('.tool-web-text');

      if (isAndroid) {
        if (apkBtn) apkBtn.classList.remove('hidden');
        if (apkBtn) apkBtn.classList.add('flex');
        if (webText) webText.textContent = 'Web';
        if (deviceInfo) deviceInfo.innerHTML = '📱 Android - <span class="text-green-400">APK recomendado</span>';
      } else if (isIOS) {
        if (apkBtn) apkBtn.classList.add('hidden');
        if (webText) webText.textContent = 'Abrir Lab';
        if (deviceInfo) deviceInfo.textContent = '📱 iOS';
      } else {
        if (apkBtn) apkBtn.classList.remove('hidden');
        if (apkBtn) apkBtn.classList.add('flex');
        if (webText) webText.textContent = 'Abrir Lab';
        if (deviceInfo) deviceInfo.textContent = '💻 Ordenador';
      }
    });
  }

  // ==========================================================================
  // EVENT DELEGATION
  // ==========================================================================

  attachDelegatedListeners() {
    const bib = this.biblioteca;
    if (bib.delegatedListenersAttached) return;

    const contenedorBiblioteca = document.getElementById('biblioteca-view');
    if (!contenedorBiblioteca) return;

    if (bib._globalClickHandler) {
      document.removeEventListener('click', bib._globalClickHandler);
    }

    const mapaHandlers = {};
    BIBLIOTECA_CONFIG.BOTONES_ACCION_GLOBAL.forEach(boton => {
      mapaHandlers[boton.id] = this[boton.handler].bind(this);
    });

    bib.eventManager.addEventListener(contenedorBiblioteca, 'click', (evento) => {
      // Dropdown toggle button
      const botonDropdown = evento.target.closest('#more-options-btn-bib');
      if (botonDropdown) {
        this.toggleMenuDropdown(evento);
        return;
      }

      // Handle button clicks (including dropdown menu items)
      for (const [idBoton, handler] of Object.entries(mapaHandlers)) {
        const botonEncontrado = evento.target.closest(`#${idBoton}`);
        if (botonEncontrado) {
          handler(evento);
          this.closeMenuDropdown();
          return;
        }
      }

      // Handle internal tool card clicks
      const tarjetaHerramienta = evento.target.closest('[data-tool-handler]');
      if (tarjetaHerramienta) {
        const nombreHandler = tarjetaHerramienta.getAttribute('data-tool-handler');
        const idHerramienta = tarjetaHerramienta.getAttribute('data-tool-id');

        if (nombreHandler && this[nombreHandler]) {
          logger.log(`🛠️ Opening tool: ${idHerramienta}`);
          this[nombreHandler](evento);
        } else {
          logger.error(`[BibliotecaHandlers] Handler ${nombreHandler} not found for tool ${idHerramienta}`);
        }
        return;
      }

      // Handler para "Leer más" en descripciones
      const toggleDescBtn = evento.target.closest('[data-action="toggle-description"]');
      if (toggleDescBtn) {
        evento.preventDefault();
        evento.stopPropagation();
        const wrapper = toggleDescBtn.closest('.book-description-wrapper');
        const description = wrapper?.querySelector('.book-description');
        if (description) {
          const isExpanded = description.dataset.expanded === 'true';
          description.dataset.expanded = (!isExpanded).toString();
          description.classList.toggle('line-clamp-3', isExpanded);
          toggleDescBtn.textContent = isExpanded ? 'Leer más ↓' : 'Leer menos ↑';
          toggleDescBtn.setAttribute('aria-expanded', (!isExpanded).toString());
        }
        return;
      }

      const botonAbrir = evento.target.closest('[data-action="open-book"]');
      const tarjetaLibro = evento.target.closest('.book-card');

      if (botonAbrir) {
        const idLibro = botonAbrir.getAttribute('data-book-id');
        this.handleOpenBook(evento, idLibro);
      } else if (tarjetaLibro && evento.target.tagName !== 'BUTTON' && !evento.target.closest('button')) {
        const idLibro = tarjetaLibro.getAttribute('data-book-id');
        if (idLibro) {
          logger.log('📖 Opening book from card:', idLibro);
          this.openBook(idLibro);
        }
      }
    });

    // Global click handler para cerrar dropdown
    bib._globalClickHandler = (evento) => {
      const dropdown = document.getElementById('more-options-menu-bib');
      const botonDropdown = document.getElementById('more-options-btn-bib');

      if (dropdown && !dropdown.classList.contains('hidden')) {
        if (!dropdown.contains(evento.target) && !botonDropdown?.contains(evento.target)) {
          this.closeMenuDropdown();
        }
      }
    };

    bib.eventManager.addEventListener(document, 'click', bib._globalClickHandler);

    bib.delegatedListenersAttached = true;
    logger.log('✅ Event delegation attached to biblioteca-view');
  }

  /**
   * Devuelve un mapa de handlers para uso externo
   * @returns {Object} Mapa de handlers
   */
  getHandlersMap() {
    const handlersMap = {};
    BIBLIOTECA_CONFIG.BOTONES_ACCION_GLOBAL.forEach(boton => {
      handlersMap[boton.id] = this[boton.handler].bind(this);
    });
    return handlersMap;
  }
}

// Exportar globalmente
window.BibliotecaHandlers = BibliotecaHandlers;
