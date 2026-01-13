/**
 * FRANKENSTEIN LAB UI v3.1 - SISTEMA DE MISIONES
 * Sistema de cartas con piezas individuales y validación por misiones
 * Las piezas (capítulos/ejercicios/recursos) se combinan para crear seres con propósito
 * v3.1: Tabs horizontales móvil, gestos mejorados, glassmorphism, GPU animations
 *
 * @version 3.1.0
 * @author J. Irurtzun & Claude Sonnet 4.5
 */

// 🔧 REFACTORING v2.9.201: Bottom Sheet extracted to module
import FrankensteinBottomSheet from './frankenstein/ui/frankenstein-bottom-sheet.js';
// 🔧 REFACTORING v2.9.201: Modals system extracted to module
import FrankensteinModals from './frankenstein/ui/frankenstein-modals.js';
// 🔧 REFACTORING v2.9.201: UI Renderer extracted to module
import FrankensteinUIRenderer from './frankenstein/core/frankenstein-ui-renderer.js';

class FrankensteinLabUI {
  constructor(organismKnowledge) {
    this.organism = organismKnowledge;
    this.missionsSystem = null;
    this.selectedMission = null;
    this.selectedPieces = []; // Piezas seleccionadas (chapters/exercises/resources)
    this.currentBeing = null; // Ser en construcción
    this.availablePieces = []; // Todas las piezas disponibles de la colección
    this.vitruvianBeing = null; // Visualización del Hombre de Vitrubio
    this.avatarSystem = null; // Sistema de avatares procedurales
    this.isInitialized = false;
    this.labStarted = false; // Track si ya se inició el lab
    this.pendingRequirementsUpdate = false;
    this.mobileBooksData = {};
    this.mobileSheetFilter = 'all';
    this.mobileSheetSearch = '';
    this.experimentLog = [];
    this.lastRequirementState = {};
    this.missionProgress = { fulfilled: 0, total: 0 };
    this.activeMiniChallenge = null;
    this.miniChallengeHistory = [];
    this.activeDemoScenario = null;
    this.microSocietySnapshot = null;
    this.skipQuizForSpecialReward = false;

    // 🔧 REFACTORING v2.9.201: Bottom Sheet module
    // 🔧 REFACTORING v2.9.201: Modals system module
    // 🔧 REFACTORING v2.9.201: UI Renderer module
    this.modals = null; // Inicializado en init()
    this.bottomSheet = null; // Inicializado en init()
    this.uiRenderer = null; // Inicializado en init()

    this.vintageBackgrounds = [
      'assets/backgrounds/vitruvio.jpg',
      'assets/backgrounds/leonardo-skull.jpg',
      'assets/backgrounds/frankenstein-1931.jpg',
      'assets/backgrounds/turtle-anatomy.jpg',
      'assets/backgrounds/cheselden-skeleton.jpg',
      'assets/backgrounds/galvanism-aldini.jpg',
      'assets/backgrounds/spiralist-anatomy.jpg',
      'assets/backgrounds/spiralist-bones.jpg',
      'assets/backgrounds/spiralist-heart.jpg'
    ];
    this.backgroundRotationTimer = null;
    this.previousBackgroundIndex = -1;
    this.microSocietyEvents = [
      {
        id: 'research',
        label: 'Explorar piezas',
        description: 'Investigar nuevas piezas y compartir aprendizajes.',
        deltas: { knowledge: 8, action: 3 }
      },
      {
        id: 'care',
        label: 'Círculo de cuidado',
        description: 'Activar redes de apoyo y fortalecer la cohesión.',
        deltas: { cohesion: 10, health: 4 }
      },
      {
        id: 'respond',
        label: 'Responder crisis',
        description: 'Actuar rápido ante desafíos y demostrar resiliencia.',
        deltas: { action: 7, resilience: 5, health: -2 }
      }
    ];
    this.microEventHistory = [];
    this.hasRestoredLabState = false;
    this.labStateKey = 'frankenstein-lab-state';
    this.vitruvianPopupTimeout = null;

    // ⭐ FIX v2.9.186: Tracking de timers para cleanup (~44 timers sin clear)
    this.timers = [];
    this.intervals = [];

    // Cache de referencias DOM frecuentes (optimización de rendimiento)
    this.domCache = {
      // Contenedores principales
      organismContainer: null,
      piecesGrid: null,
      missionsGrid: null,

      // Modales
      missionModal: null,
      requirementsModal: null,
      piecesModal: null,
      vitruvianPopup: null,

      // Botones de acción
      btnExportBeing: null,
      btnValidateBeing: null,
      btnTalkToBeing: null,

      // FABs
      fabRequirements: null,
      fabPieces: null,
      fabRequirementsBadge: null,
      fabPiecesBadge: null,

      // Información del ser
      beingName: null,
      beingMission: null,
      beingPower: null,
      beingPieces: null,
      beingStatus: null,
      beingAvatar: null,
      beingAttributes: null,
      beingBalance: null,
      beingComponentsList: null,

      // Requisitos de misión
      requirementsChecklist: null,
      currentMissionName: null,
      currentPower: null,
      requiredPower: null,
      progressFill: null,
      progressText: null,

      // Mini-vista de requisitos
      progressFillMini: null,
      progressLabelMini: null,
      requirementsListMini: null,
      requirementsSummaryLabel: null,

      // Sticky header
      stickyRequirementsHeader: null,
      stickyProgressFill: null,
      stickyProgressText: null,

      // Quick view
      quickViewList: null,
      quickViewStatus: null,
      quickView: null,

      // Piezas seleccionadas
      piecesSelectedCount: null,
      piecesSelectedPower: null,

      // Vitruvian
      vitruvianHud: null,
      vitruvianEnergyBadge: null,
      vitruvianSlotLegend: null,
      vitruvianBeingContainer: null,

      // Modal de misión
      modalMissionName: null,
      modalMissionDescription: null,
      modalMissionDifficulty: null,
      modalMissionPower: null,
      modalMissionProgress: null,
      modalMissionHints: null,

      // Progress ring
      missionProgressRing: null,
      missionProgressPercent: null,
      missionProgressStatus: null,
      missionProgressFillRing: null,
      missionProgressHint: null,

      // Mini challenge
      miniChallengeBody: null,
      miniChallengeTitle: null,

      // Validación
      validationResults: null,

      // Experiment log
      experimentLogList: null,
      experimentLogMeta: null,

      // Bottom sheet
      piecesBottomSheet: null,
      bottomSheetHandle: null,

      // Menú
      labSideMenu: null,

      // Otros
      piecesSearch: null,
      biblioteca: null
    };
  }

  /**
   * Inicializar cache de referencias DOM
   * Optimiza el rendimiento al evitar llamadas repetidas a querySelector/getElementById
   */
  initDomCache() {
    const cache = this.domCache;

    // Contenedores principales
    cache.organismContainer = document.getElementById('organism-container');
    cache.piecesGrid = document.getElementById('pieces-grid');
    cache.missionsGrid = document.getElementById('missions-grid');

    // Modales
    cache.missionModal = document.getElementById('mission-modal');
    cache.requirementsModal = document.getElementById('requirements-modal');
    cache.piecesModal = document.getElementById('pieces-modal');
    cache.vitruvianPopup = document.getElementById('vitruvian-popup');

    // Botones de acción
    cache.btnExportBeing = document.getElementById('btn-export-being');
    cache.btnValidateBeing = document.getElementById('btn-validate-being');
    cache.btnTalkToBeing = document.getElementById('btn-talk-to-being');

    // FABs
    cache.fabRequirements = document.getElementById('fab-requirements');
    cache.fabPieces = document.getElementById('fab-pieces');
    cache.fabRequirementsBadge = document.getElementById('fab-requirements-badge');
    cache.fabPiecesBadge = document.getElementById('fab-pieces-badge');

    // Información del ser
    cache.beingName = document.getElementById('being-name');
    cache.beingMission = document.getElementById('being-mission');
    cache.beingPower = document.getElementById('being-power');
    cache.beingPieces = document.getElementById('being-pieces');
    cache.beingStatus = document.getElementById('being-status');
    cache.beingAvatar = document.getElementById('being-avatar-display');
    cache.beingAttributes = document.getElementById('being-attributes');
    cache.beingBalance = document.getElementById('being-balance');
    cache.beingComponentsList = document.getElementById('being-components-list');

    // Requisitos de misión
    cache.requirementsChecklist = document.getElementById('requirements-checklist');
    cache.currentMissionName = document.getElementById('current-mission-name');
    cache.currentPower = document.getElementById('current-power');
    cache.requiredPower = document.getElementById('required-power');
    cache.progressFill = document.getElementById('progress-fill');
    cache.progressText = document.getElementById('progress-text');

    // Mini-vista de requisitos
    cache.progressFillMini = document.getElementById('progress-fill-mini');
    cache.progressLabelMini = document.getElementById('progress-label-mini');
    cache.requirementsListMini = document.getElementById('requirements-list-mini');
    cache.requirementsSummaryLabel = document.getElementById('requirements-summary-label');

    // Sticky header
    cache.stickyRequirementsHeader = document.getElementById('requirements-sticky-header');
    cache.stickyProgressFill = document.getElementById('sticky-progress-fill');
    cache.stickyProgressText = document.getElementById('sticky-progress-text');

    // Quick view
    cache.quickViewList = document.getElementById('quick-view-list');
    cache.quickViewStatus = document.getElementById('quick-view-status');
    cache.quickView = document.getElementById('missing-requirements-quick-view');

    // Piezas seleccionadas
    cache.piecesSelectedCount = document.getElementById('pieces-selected-count');
    cache.piecesSelectedPower = document.getElementById('pieces-selected-power');

    // Vitruvian
    cache.vitruvianHud = document.getElementById('vitruvian-hud');
    cache.vitruvianEnergyBadge = document.getElementById('vitruvian-energy-badge');
    cache.vitruvianSlotLegend = document.getElementById('vitruvian-slot-legend');
    cache.vitruvianBeingContainer = document.getElementById('vitruvian-being-container');

    // Modal de misión
    cache.modalMissionName = document.getElementById('modal-mission-name');
    cache.modalMissionDescription = document.getElementById('modal-mission-description');
    cache.modalMissionDifficulty = document.getElementById('modal-mission-difficulty');
    cache.modalMissionPower = document.getElementById('modal-mission-power');
    cache.modalMissionProgress = document.getElementById('modal-mission-progress');
    cache.modalMissionHints = document.getElementById('modal-mission-hints');

    // Progress ring
    cache.missionProgressRing = document.getElementById('mission-progress-ring');
    cache.missionProgressPercent = document.getElementById('mission-progress-percent');
    cache.missionProgressStatus = document.getElementById('mission-progress-status');
    cache.missionProgressFillRing = document.getElementById('mission-progress-fill');
    cache.missionProgressHint = document.getElementById('mission-progress-hint');

    // Mini challenge
    cache.miniChallengeBody = document.getElementById('mini-challenge-body');
    cache.miniChallengeTitle = document.getElementById('mini-challenge-title');

    // Validación
    cache.validationResults = document.getElementById('validation-results');

    // Experiment log
    cache.experimentLogList = document.getElementById('experiment-log-list');
    cache.experimentLogMeta = document.getElementById('experiment-log-meta');

    // Bottom sheet
    cache.piecesBottomSheet = document.getElementById('pieces-bottom-sheet');
    cache.bottomSheetHandle = document.getElementById('bottom-sheet-handle');

    // Menú
    cache.labSideMenu = document.getElementById('lab-side-menu');

    // Otros
    cache.piecesSearch = document.getElementById('pieces-search');
    cache.biblioteca = document.getElementById('biblioteca-view');
  }

  /**
   * Limpiar cache DOM (útil cuando se recrea la UI)
   */
  clearDomCache() {
    Object.keys(this.domCache).forEach(key => {
      this.domCache[key] = null;
    });
  }

  /**
   * Sincronizar estado de botones de acción
   */
  updateActionButtons() {
    const hasBeing = !!(this.currentBeing && (this.selectedPieces.length > 0 || (this.currentBeing.pieces && this.currentBeing.pieces.length > 0)));
    const exportBtn = this.domCache.btnExportBeing || document.getElementById('btn-export-being');
    const validateBtn = this.domCache.btnValidateBeing || document.getElementById('btn-validate-being');
    const talkBtn = this.domCache.btnTalkToBeing || document.getElementById('btn-talk-to-being');

    if (exportBtn) {
      exportBtn.disabled = !hasBeing;
    }

    if (talkBtn) {
      talkBtn.disabled = !hasBeing;
    }

    if (validateBtn) {
      validateBtn.disabled = !(hasBeing && this.selectedMission);
    }
  }

  /**
   * Inicializar UI del laboratorio
   */
  async init() {
    logger.log('🎬 FrankensteinLabUI.init() llamado. isInitialized:', this.isInitialized, 'labStarted:', this.labStarted);

    if (this.isInitialized) {
      logger.log('⏭️ Ya inicializado, saltando...');
      return;
    }

    // Inicializar sistema de misiones
    if (typeof FrankensteinMissions !== 'undefined') {
      this.missionsSystem = new FrankensteinMissions();
      logger.log('✅ FrankensteinMissions inicializado');
    } else {
      logger.error('❌ FrankensteinMissions no disponible');
      return;
    }

    // Inicializar sistema de avatares
    if (typeof FrankensteinAvatarSystem !== 'undefined') {
      this.avatarSystem = new FrankensteinAvatarSystem();
      logger.log('✅ FrankensteinAvatarSystem inicializado');
    } else {
      logger.warn('⚠️ FrankensteinAvatarSystem no disponible - avatares deshabilitados');
    }

    // Cargar todas las piezas disponibles
    logger.log('📦 Cargando piezas disponibles...');
    await this.loadAvailablePieces();
    logger.log('✅ Piezas cargadas:', this.availablePieces.length);

    // Inicializar sistema de bottom sheet móvil
    this.bottomSheet = new FrankensteinBottomSheet(this.domCache, this);
    logger.log('✅ FrankensteinBottomSheet inicializado');

    // Inicializar sistema de modales
    this.modals = new FrankensteinModals(this.domCache, this);
    logger.log('✅ FrankensteinModals inicializado');

    // Inicializar UI renderer
    this.uiRenderer = new FrankensteinUIRenderer(this, this.domCache);
    logger.log('✅ FrankensteinUIRenderer inicializado');

    // Si ya se inició antes, ir directo al lab, sino mostrar pantalla de inicio
    if (this.labStarted) {
      logger.log('🎮 Lab ya iniciado antes, creando UI directamente');
      this.uiRenderer.createLabUI();
      this.attachEventListeners();
    } else {
      logger.log('🌟 Primera vez, mostrando pantalla de inicio');
      this.uiRenderer.createStartScreen();

      // Si el modo actual es demo, cargar datos automáticamente
      const currentMode = window.FrankensteinQuiz?.getMode();
      if (currentMode === 'demo' && window.FrankensteinDemoData) {
        logger.log('📦 Modo demo detectado - cargando datos automáticamente');
        window.FrankensteinDemoData.loadDemoData(this);
      }
    }

    this.isInitialized = true;
    this.loadExperimentLog();

    // Inicializar sistema de recompensas
    this.initRewardsSystem();

    logger.log('✅ FrankensteinLabUI inicializado completamente');
  }

  /**
   * Inicializar sistema de recompensas
   */
  initRewardsSystem() {
    if (typeof FrankensteinRewards === 'undefined') {
      logger.warn('⚠️ FrankensteinRewards no disponible');
      return;
    }

    if (!window.frankensteinRewards) {
      window.frankensteinRewards = new FrankensteinRewards();
    }

    // Verificar login diario y mostrar recompensa si aplica
    const dailyReward = window.frankensteinRewards.checkDailyLogin();
    if (dailyReward) {
      this._setTimeout(() => {
        this.showDailyLoginReward(dailyReward);
      }, 1500);
    }

    logger.log('✅ Sistema de recompensas inicializado');
  }

  /**
   * Mostrar recompensa de login diario
   */
  showDailyLoginReward(reward) {
    const modal = document.createElement('div');
    modal.className = 'daily-reward-modal';
    modal.innerHTML = `
      <div class="daily-reward-content">
        <div class="daily-reward-icon">${reward.streak >= 7 ? '🔥' : '☀️'}</div>
        <h2>¡Bienvenido de nuevo!</h2>
        <p class="daily-streak">Racha: ${reward.streak} día${reward.streak !== 1 ? 's' : ''}</p>
        ${reward.isNewRecord ? '<p class="new-record">🏆 ¡Nuevo récord!</p>' : ''}
        <div class="daily-rewards">
          <span class="daily-xp">+${reward.xp} ⭐ XP</span>
          <span class="daily-coins">+${reward.coins} 🪙</span>
        </div>
        <button class="lab-button primary" onclick="this.closest('.daily-reward-modal').remove()">
          ¡Genial!
        </button>
      </div>
    `;
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.85);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10005;
      animation: frFadeIn 0.3s ease-out;
    `;

    const content = modal.querySelector('.daily-reward-content');
    content.style.cssText = `
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      border-radius: 20px;
      padding: 32px;
      text-align: center;
      color: white;
      max-width: 320px;
      border: 2px solid #fbbf24;
      box-shadow: 0 0 40px rgba(251, 191, 36, 0.3);
    `;

    modal.querySelector('.daily-reward-icon').style.cssText = 'font-size: 64px; margin-bottom: 16px;';
    modal.querySelector('h2').style.cssText = 'margin: 0 0 8px; font-size: 24px;';
    modal.querySelector('.daily-streak').style.cssText = 'color: #fbbf24; font-size: 18px; margin: 8px 0;';
    modal.querySelector('.daily-rewards').style.cssText = 'display: flex; justify-content: center; gap: 20px; margin: 16px 0; font-size: 20px;';

    const newRecord = modal.querySelector('.new-record');
    if (newRecord) newRecord.style.cssText = 'color: #22c55e; font-size: 14px; margin: 4px 0;';

    // Aplicar recompensas
    window.frankensteinRewards.addXP(reward.xp, 'dailyLogin');
    window.frankensteinRewards.addCoins(reward.coins, 'dailyLogin');

    document.body.appendChild(modal);
  }

  /**
   * Iniciar el laboratorio con la configuración seleccionada
   */
  startLab() {
    // Ocultar pantalla de inicio
    const startScreen = document.getElementById('frankenstein-start-screen');
    if (startScreen) {
      startScreen.remove();
    }

    // Marcar que el lab ya se inició
    this.labStarted = true;

    // Crear UI del laboratorio (delegado a renderer)
    this.uiRenderer.createLabUI();
    // El selector de modo ya se configuró en la pantalla de inicio
    // this.createGameModeSelector();
    this.attachEventListeners();
  }

  /**
   * Cargar todas las piezas disponibles de la colección
   */
  async loadAvailablePieces() {
    const catalog = this.organism.bookEngine?.catalog;
    if (!catalog || !catalog.books) return;

    this.availablePieces = [];

    for (const book of catalog.books) {
      // Cargar el book.json completo para obtener capítulos reales
      let fullBook = null;
      try {
        const response = await fetch(`books/${book.id}/book.json`);
        if (response.ok) {
          fullBook = await response.json();
        }
      } catch (error) {
        // Silent error
      }

      // Obtener capítulos del libro completo
      const chapters = [];
      if (fullBook && fullBook.sections && Array.isArray(fullBook.sections)) {
        fullBook.sections.forEach(section => {
          if (section.chapters && Array.isArray(section.chapters)) {
            chapters.push(...section.chapters);
          }
        });
      } else if (fullBook && fullBook.chapters && Array.isArray(fullBook.chapters)) {
        chapters.push(...fullBook.chapters);
      }

      // Cargar metadata si está disponible
      let metadata = {};
      try {
        metadata = await this.organism.loadChapterMetadata(book.id);
      } catch (error) {
        // Silent error
      }

      chapters.forEach((chapter, index) => {
        const chapterMeta = metadata[chapter.id] || {};

        // Añadir capítulo como pieza
        this.availablePieces.push({
          type: 'chapter',
          id: `${book.id}-${chapter.id}`,
          bookId: book.id,
          bookTitle: book.title,
          chapterId: chapter.id,
          title: chapter.title,
          tags: chapterMeta.tags || [],
          icon: '📖',
          color: this.getBookColor(book.id)
        });

        // Añadir ejercicios como piezas
        if (chapter.exercises && chapter.exercises.length > 0) {
          chapter.exercises.forEach((exercise, exIndex) => {
            this.availablePieces.push({
              type: 'exercise',
              id: `${book.id}-${chapter.id}-ex${exIndex}`,
              bookId: book.id,
              bookTitle: book.title,
              chapterId: chapter.id,
              exerciseId: exercise.id,
              title: exercise.title,
              category: exercise.category || 'practice',
              duration: exercise.duration,
              icon: this.getExerciseIcon(exercise.category),
              color: this.getBookColor(book.id)
            });
          });
        }

        // Añadir recursos si hay
        if (chapterMeta.relatedResources && chapterMeta.relatedResources.length > 0) {
          chapterMeta.relatedResources.forEach((resource, resIndex) => {
            this.availablePieces.push({
              type: 'resource',
              id: `${book.id}-${chapter.id}-res${resIndex}`,
              bookId: book.id,
              bookTitle: book.title,
              chapterId: chapter.id,
              title: resource.title || resource.name,
              category: resource.category || 'tools',
              icon: '🔧',
              color: this.getBookColor(book.id)
            });
          });
        }
      });
    }
  }

  /**
   * Obtener color del libro
   */
  getBookColor(bookId) {
    const colors = {
      'codigo-despertar': '#a855f7',
      'tierra-que-despierta': '#10b981',
      'manifiesto': '#ef4444',
      'manual-practico': '#f59e0b',
      'manual-transicion': '#06b6d4',
      'guia-acciones': '#eab308',
      'toolkit-transicion': '#8b5cf6',
      'practicas-radicales': '#ec4899'
    };
    return colors[bookId] || '#64748b';
  }

  getBookTitle(bookId) {
    const catalog = this.organism?.bookEngine?.catalog;
    if (!catalog || !Array.isArray(catalog.books)) return 'Colección';
    return catalog.books.find(book => book.id === bookId)?.title || 'Colección';
  }

  hydrateLegacyPiece(piece) {
    if (!piece || !piece.id) return null;
    const hydrated = { ...piece };
    hydrated.type = hydrated.type || 'chapter';
    hydrated.bookId = hydrated.bookId || (piece.id.includes('-') ? piece.id.split('-')[0] : '');
    hydrated.bookTitle = hydrated.bookTitle || this.getBookTitle(hydrated.bookId);
    hydrated.title = hydrated.title || 'Pieza sin título';
    hydrated.color = hydrated.color || this.getBookColor(hydrated.bookId);
    return hydrated;
  }

  ensureMissionRequirements(mission) {
    if (!mission) return [];

    if (Array.isArray(mission.requirements) && mission.requirements.length > 0) {
      return mission.requirements;
    }

    const requiredAttrs = mission.requiredAttributes || {};
    const requirements = Object.entries(requiredAttrs).map(([attr, value]) => {
      const attrData = this.missionsSystem?.attributes?.[attr];
      return {
        type: attr,
        count: value,
        description: attrData ? `${attrData.icon} ${attrData.name}: ${value}+` : `${attr}: ${value}+`,
        icon: attrData?.icon || '📊'
      };
    });

    mission.requirements = requirements;
    return requirements;
  }

  getCurrentMissionRequirements() {
    if (!this.selectedMission) return [];
    return this.ensureMissionRequirements(this.selectedMission) || [];
  }

  isMobileViewport() {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 768px)').matches;
  }

  /**
   * Obtener icono de ejercicio según categoría
   */
  getExerciseIcon(category) {
    const icons = {
      meditation: '🧘',
      dialogue: '💬',
      planning: '📋',
      reflection: '🤔',
      practice: '⚡'
    };
    return icons[category] || '📝';
  }

  /**
   * Crear pantalla de inicio con selección de modo y dificultad
   * @deprecated v2.9.201 - Use uiRenderer.createStartScreen() instead
   */
  createStartScreen() {
    return this.uiRenderer.createStartScreen();
  }

  /**
   * Set random vintage scientific/technical background image
   * @deprecated v2.9.201 - Use uiRenderer.setRandomDaVinciBackground() instead
   */
  setRandomDaVinciBackground(preferredImage = null) {
    return this.uiRenderer.setRandomDaVinciBackground(preferredImage);
  }

  /**
   * Resolver URL de asset relativo a absoluto
   * @deprecated v2.9.201 - Use uiRenderer.resolveAssetUrl() instead
   */
  resolveAssetUrl(assetPath) {
    return this.uiRenderer.resolveAssetUrl(assetPath);
  }

  /**
   * Iniciar rotación automática de fondos vintage
   * @deprecated v2.9.201 - Use uiRenderer.startBackgroundRotation() instead
   */
  startBackgroundRotation(forceImage = null) {
    return this.uiRenderer.startBackgroundRotation(forceImage);
  }

  /**
   * Crear estructura HTML del laboratorio
   * @deprecated v2.9.201 - Use uiRenderer.createLabUI() instead
   */
  createLabUI() {
    return this.uiRenderer.createLabUI();
  }

  /**
   * Verificar y mostrar onboarding si aplica
   */
  checkOnboarding() {
    if (typeof FrankensteinOnboarding === 'undefined') {
      logger.warn('⚠️ FrankensteinOnboarding no disponible');
      return;
    }

    if (!window.frankensteinOnboarding) {
      window.frankensteinOnboarding = new FrankensteinOnboarding();
    }

    // Esperar a que la UI esté lista
    this._setTimeout(() => {
      if (window.frankensteinOnboarding.shouldShow()) {
        window.frankensteinOnboarding.start();
      }
    }, 1000);
  }

  /**
   * Inicializar HUD de recompensas en la UI
   */
  initRewardsHUD() {
    if (!window.frankensteinRewards) return;

    // Remover HUD existente si hay
    const existingHUD = document.getElementById('fr-rewards-hud');
    if (existingHUD) existingHUD.remove();

    // Crear nuevo HUD
    const hud = window.frankensteinRewards.createRewardsHUD();
    document.body.appendChild(hud);

    // Agregar botón de logros al header si existe
    const headerActions = document.querySelector('.lab-header-actions');
    if (headerActions) {
      const achievementsBtn = document.createElement('button');
      achievementsBtn.className = 'lab-header-icon-btn';
      achievementsBtn.id = 'btn-achievements';
      achievementsBtn.title = 'Logros';
      achievementsBtn.innerHTML = '<span>🏆</span>';
      achievementsBtn.onclick = () => window.frankensteinRewards.showAchievementsPanel();

      // Insertar antes del botón de ajustes
      const settingsBtn = document.getElementById('btn-settings');
      if (settingsBtn) {
        headerActions.insertBefore(achievementsBtn, settingsBtn);
      } else {
        headerActions.appendChild(achievementsBtn);
      }
    }
  }

  /**
   * Poblar grid de misiones
   */
  populateMissions() {
    const grid = this.domCache.missionsGrid || document.getElementById('missions-grid');
    if (!grid || !this.missionsSystem) return;

    // Detectar si es móvil
    const isMobile = window.innerWidth <= 768;

    // Aplicar clase según dispositivo
    if (isMobile) {
      grid.classList.add('horizontal-tabs');
      grid.classList.remove('desktop-grid');
    } else {
      grid.classList.add('desktop-grid');
      grid.classList.remove('horizontal-tabs');
    }

    this.missionsSystem.missions.forEach(mission => {
      const card = document.createElement('div');
      card.className = isMobile ? 'mission-tab' : 'mission-card';
      card.dataset.missionId = mission.id;
      card.dataset.difficulty = mission.difficulty;

      if (isMobile) {
        // Diseño compacto para tabs
        card.innerHTML = `
          <div class="mission-tab-icon">${mission.icon}</div>
          <h3 class="mission-tab-name">${mission.name}</h3>
          <span class="mission-tab-difficulty ${mission.difficulty}">${mission.difficulty}</span>
        `;
      } else {
        // Diseño completo para desktop
        card.innerHTML = `
          <div class="mission-icon">${mission.icon}</div>
          <h3 class="mission-name">${mission.name}</h3>
          <p class="mission-description">${mission.description}</p>
          <span class="mission-difficulty">${mission.difficulty}</span>
        `;
      }

      card.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.selectMission(mission, card);
      });

      grid.appendChild(card);
    });

    // Aplicar scroll snap en móvil
    if (isMobile) {
      this.setupMissionTabsScroll(grid);
    }
  }

  /**
   * Configurar scroll horizontal con snap para tabs de misiones
   */
  setupMissionTabsScroll(container) {
    if (!container) return;

    // Scroll suave con momentum
    let isScrolling = false;
    let startX = 0;
    let scrollLeft = 0;

    container.addEventListener('touchstart', (e) => {
      isScrolling = true;
      startX = e.touches[0].pageX - container.offsetLeft;
      scrollLeft = container.scrollLeft;
    }, { passive: true });

    container.addEventListener('touchmove', (e) => {
      if (!isScrolling) return;
      const x = e.touches[0].pageX - container.offsetLeft;
      const walk = (x - startX) * 2;
      container.scrollLeft = scrollLeft - walk;
    }, { passive: true });

    container.addEventListener('touchend', () => {
      isScrolling = false;
    }, { passive: true });

    // Indicador visual de scroll
    this.addScrollIndicator(container);
  }

  /**
   * Añadir indicador visual de scroll (opcional)
   */
  addScrollIndicator(container) {
    // Verificar si hay más contenido para hacer scroll
    const hasOverflow = container.scrollWidth > container.clientWidth;

    if (hasOverflow) {
      container.classList.add('has-scroll');

      // Listener para ocultar indicador cuando llegue al final
      container.addEventListener('scroll', () => {
        const isAtEnd = container.scrollLeft + container.clientWidth >= container.scrollWidth - 10;
        if (isAtEnd) {
          container.classList.add('scroll-end');
        } else {
          container.classList.remove('scroll-end');
        }
      }, { passive: true });
    }
  }

  /**
   * Seleccionar misión
   */
  /**
   * Open Mission Modal
   * 🔧 REFACTORING v2.9.201: Delegated to FrankensteinModals
   */
  openMissionModal() {
    if (this.modals) {
      this.modals.openMission();
    }
  }

  /**
   * Close Mission Modal
   * 🔧 REFACTORING v2.9.201: Delegated to FrankensteinModals
   */
  closeMissionModal() {
    if (this.modals) {
      this.modals.closeMission();
    }
  }

  /**
   * Cambiar tab de navegación (Bottom Navigation)
   */
  switchTab(tabName) {
    logger.log('🔄 Cambiando a tab:', tabName);

    // Actualizar estado visual de tabs
    document.querySelectorAll('.awakening-tab').forEach(tab => {
      tab.classList.remove('active');
      if (tab.dataset.tab === tabName) {
        tab.classList.add('active');
      }
    });

    // Manejar cambio de contenido según tab
    switch (tabName) {
      case 'laboratorio':
        // Ya está visible por defecto
        this.showSection('lab-workspace');
        break;
      case 'seres':
        this.showSavedBeingsModal();
        break;
      case 'misiones':
        this.openMissionModal();
        break;
      case 'piezas':
        // Abrir panel de piezas
        const piecesPanel = document.getElementById('pieces-panel');
        if (piecesPanel) {
          piecesPanel.classList.add('expanded');
        }
        break;
      case 'perfil':
        this.showProfileSection();
        break;
    }
  }

  /**
   * Mostrar sección de perfil/estadísticas
   */
  showProfileSection() {
    // Crear modal de perfil si no existe
    let profileModal = document.getElementById('profile-modal');

    if (!profileModal) {
      profileModal = document.createElement('div');
      profileModal.id = 'profile-modal';
      profileModal.className = 'awakening-modal-overlay';
      profileModal.innerHTML = `
        <div class="awakening-modal" style="width: 90%; max-width: 500px;">
          <div class="awakening-modal-header">
            <h2 class="awakening-modal-title">👤 Perfil</h2>
            <button class="awakening-modal-close" onclick="document.getElementById('profile-modal').classList.remove('active')" aria-label="Cerrar perfil"><span aria-hidden="true">×</span></button>
          </div>
          <div class="awakening-modal-body">
            <div class="awakening-stats" style="margin-bottom: 24px;">
              <div class="awakening-stat-box">
                <span class="awakening-stat-icon">🧬</span>
                <div class="awakening-stat-value">${this.getSavedBeingsCount()}</div>
                <div class="awakening-stat-label">Seres Creados</div>
              </div>
              <div class="awakening-stat-box">
                <span class="awakening-stat-icon">🎯</span>
                <div class="awakening-stat-value">${this.getCompletedMissionsCount()}</div>
                <div class="awakening-stat-label">Misiones</div>
              </div>
              <div class="awakening-stat-box">
                <span class="awakening-stat-icon">🧩</span>
                <div class="awakening-stat-value">${this.availablePieces.length}</div>
                <div class="awakening-stat-label">Piezas</div>
              </div>
            </div>

            <div class="awakening-section">
              <h3 class="awakening-section-title">⚙️ Configuración</h3>
              <div class="awakening-list">
                <div class="awakening-list-item" onclick="window.frankensteinLabUI.openSettings()">
                  <span class="awakening-list-icon">🎨</span>
                  <span class="awakening-list-text">Personalización</span>
                  <span class="awakening-list-arrow">›</span>
                </div>
                <div class="awakening-list-item" onclick="window.frankensteinLabUI.openSettings()">
                  <span class="awakening-list-icon">🔊</span>
                  <span class="awakening-list-text">Sonido y Vibración</span>
                  <span class="awakening-list-arrow">›</span>
                </div>
              </div>
            </div>

            <button class="awakening-btn awakening-btn-primary" style="width: 100%;" onclick="window.frankensteinLabUI.openSettings()">
              Abrir Configuración Completa
            </button>
          </div>
        </div>
      `;
      document.body.appendChild(profileModal);
    }

    profileModal.classList.add('active');
  }

  /**
   * Abrir configuración
   */
  openSettings() {
    if (window.FrankensteinSettings) {
      window.FrankensteinSettings.open();
    } else {
      logger.warn('FrankensteinSettings no disponible');
      if (window.showToast) {
        window.showToast('Configuración no disponible', 'warning');
      }
    }
  }

  /**
   * Obtener conteo de seres guardados
   */
  getSavedBeingsCount() {
    try {
      const saved = JSON.parse(localStorage.getItem('frankenstein-saved-beings') || '[]');
      return saved.length;
    } catch (e) {
      return 0;
    }
  }

  /**
   * Obtener conteo de misiones completadas
   */
  getCompletedMissionsCount() {
    try {
      const stats = JSON.parse(localStorage.getItem('frankenstein-stats') || '{}');
      return stats.missionsCompleted || 0;
    } catch (e) {
      return 0;
    }
  }

  /**
   * Mostrar sección específica
   */
  showSection(sectionId) {
    logger.log('📱 Mostrando sección:', sectionId);
  }

  selectMission(mission, card, { silent = false } = {}) {
    // Deseleccionar anterior (soporta tanto cards como tabs)
    document.querySelectorAll('.mission-card.selected, .mission-tab.selected').forEach(c => {
      c.classList.remove('selected');
    });

    // Seleccionar nueva
    card.classList.add('selected');
    this.selectedMission = mission;
    this.ensureMissionRequirements(this.selectedMission);
    this.lastRequirementState = {};
    this.updateMissionProgressUI({
      fulfilled: 0,
      total: mission.requirements ? mission.requirements.length : 0
    });
    this.generateMiniChallenge(true);
    this.hasShownConfetti = false; // Reset confetti flag

    // Actualizar UI
    document.getElementById('being-mission').textContent = `Misión: ${mission.name}`;
    this.updateBeingDisplay();
    this.updateRequirementsPanel(); // Update requirements panel

    if (!silent) {
      this.showNotification(`🎯 Misión seleccionada: ${mission.name}`, 'info');
    }

    // Close modal after selection
    this.closeMissionModal();
    this.updateDemoScenarioProgress();

    this.saveLabState();
  }

  /**
   * Open Requirements Modal
   * 🔧 REFACTORING v2.9.201: Delegated to FrankensteinModals
   */
  openRequirementsModal() {
    if (this.modals) {
      this.modals.openRequirements();
    }
  }

  /**
   * Close Requirements Modal
   * 🔧 REFACTORING v2.9.201: Delegated to FrankensteinModals
   */
  closeRequirementsModal() {
    if (this.modals) {
      this.modals.closeRequirements();
    }
  }

  /**
   * Open Pieces Modal
   * 🔧 REFACTORING v2.9.201: Delegated to FrankensteinModals
   */
  openPiecesModal() {
    if (this.modals) {
      this.modals.openPieces();
    }
  }

  /**
   * Close Pieces Modal
   */
  closePiecesModal() {
    if (this.modals) {
      this.modals.closePieces();
    }
  }

  /**
   * Update FAB Badges
   */
  updateFABBadges() {
    // Update requirements badge
    if (this.selectedMission) {
      const requirements = this.getCurrentMissionRequirements();
      const fulfilled = this.countFulfilledRequirements(requirements);
      const total = requirements.length;
      const requirementsBadge = this.domCache.fabRequirementsBadge || document.getElementById('fab-requirements-badge');
      if (requirementsBadge) {
        requirementsBadge.textContent = `${fulfilled}/${total}`;
        requirementsBadge.style.backgroundColor = fulfilled === total ? '#4CAF50' : '#FF9800';
      }
    }

    // Update pieces badge
    const piecesBadge = this.domCache.fabPiecesBadge || document.getElementById('fab-pieces-badge');
    if (piecesBadge) {
      piecesBadge.textContent = this.selectedPieces.length;
      piecesBadge.style.backgroundColor = this.selectedPieces.length > 0 ? '#2196F3' : '#757575';
    }
  }

  /**
   * Update Missing Requirements Quick View
   */
  updateMissingRequirementsQuickView() {
    const quickViewList = this.domCache.quickViewList || document.getElementById('quick-view-list');
    const quickViewStatus = this.domCache.quickViewStatus || document.getElementById('quick-view-status');
    const quickView = this.domCache.quickView || document.getElementById('missing-requirements-quick-view');

    if (!quickViewList || !quickViewStatus || !quickView) return;

    if (!this.selectedMission) {
      quickView.style.display = 'block';
      quickViewStatus.textContent = '0/0';
      quickViewStatus.style.color = '#757575';
      quickViewList.innerHTML = `
        <div class="quick-view-no-mission">
          <span class="no-mission-icon">🎯</span>
          <span class="no-mission-text">Selecciona una misión primero</span>
          <button class="no-mission-btn" onclick="document.getElementById('btn-change-mission').click(); document.getElementById('pieces-modal').classList.remove('active');">
            Elegir Misión
          </button>
        </div>
      `;
      this.updatePiecesTipsPanel();
      return;
    }

    quickView.style.display = 'block';

    const requirements = this.getCurrentMissionRequirements();

    // If mission has no requirements, show message
    if (requirements.length === 0) {
      quickViewStatus.textContent = '0/0';
      quickViewStatus.style.color = '#757575';
      quickViewList.innerHTML = `
        <div class="quick-view-no-mission">
          <span class="no-mission-icon">⚠️</span>
          <span class="no-mission-text">Esta misión no tiene requisitos definidos</span>
        </div>
      `;
      this.updatePiecesTipsPanel();
      return;
    }

    const missing = this.getMissingRequirements(requirements);
    const fulfilled = this.countFulfilledRequirements(requirements);
    const total = requirements.length;

    // Update status
    quickViewStatus.textContent = `${fulfilled}/${total}`;
    quickViewStatus.style.color = fulfilled === total && total > 0 ? '#4CAF50' : '#FF9800';

    // Update list
    if (missing.length === 0 && total > 0) {
      quickViewList.innerHTML = `
        <div class="quick-view-complete">
          <span class="complete-icon">✅</span>
          <span class="complete-text">¡Todos los requisitos cumplidos!</span>
        </div>
      `;
    } else {
      quickViewList.innerHTML = missing.map(req => {
        const icon = this.getRequirementIcon(req.type);
        const attrData = this.missionsSystem?.attributes?.[req.type];
        const label = attrData ? `${attrData.icon} ${attrData.name}` : (req.description || req.type);
        const targetValue = this.getRequirementTarget(req) || 0;
        const currentValue = Math.round(this.getRequirementCurrentValue(req));
        const remaining = Math.max(0, targetValue - currentValue);

        return `
          <div class="quick-view-item" data-type="${req.type}">
            <span class="quick-view-item-icon">${icon}</span>
            <div class="quick-view-item-content">
              <span class="quick-view-item-text">${label}</span>
              <span class="quick-view-item-count">${targetValue ? `${currentValue}/${targetValue}` : currentValue} • Faltan: ${remaining}</span>
            </div>
            <button class="quick-view-filter-btn" data-filter="${req.type}" title="Filtrar por este tipo">
              <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="8" cy="8" r="6"/>
                <path d="M12 12l4 4"/>
              </svg>
            </button>
          </div>
        `;
      }).join('');

      // Add click handlers to filter buttons
      this._setTimeout(() => {
        document.querySelectorAll('.quick-view-filter-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const attributeFilter = btn.dataset.filter;

            // Filter pieces that provide this attribute
            this.filterPiecesByAttribute(attributeFilter);

            // Reset filter pills to "all" since we're using custom attribute filter
            document.querySelectorAll('.filter-pill').forEach(pill => {
              pill.classList.remove('active');
            });
            const allPill = document.querySelector('.filter-pill[data-filter="all"]');
            if (allPill) allPill.classList.add('active');

            // Scroll to pieces grid ONLY if no book is expanded
            const expandedBook = document.querySelector('.book-tree-item.expanded');
            if (!expandedBook) {
              const piecesGrid = document.getElementById('pieces-grid');
              if (piecesGrid) {
                piecesGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            } else {
              // If book is expanded, scroll within the book to first matching piece
              const firstVisiblePiece = expandedBook.querySelector('.piece-card:not([style*="display: none"])');
              if (firstVisiblePiece) {
                // Scroll within the expanded book's content area
                const bookContent = expandedBook.querySelector('.book-tree-content');
                if (bookContent) {
                  const pieceRect = firstVisiblePiece.getBoundingClientRect();
                  const contentRect = bookContent.getBoundingClientRect();
                  const scrollTop = pieceRect.top - contentRect.top + bookContent.scrollTop - 20;
                  bookContent.scrollTo({ top: scrollTop, behavior: 'smooth' });
                }
              }
            }
          });
        });
      }, 100);
    }

    this.updatePiecesTipsPanel(missing, requirements);
  }

  /**
   * Poblar grid de piezas (ahora como árbol)
   * 🔧 REFACTORING v2.9.154: Delegated to FrankensteinPieceCards module
   */
  populatePiecesGrid(filter = 'all') {
    if (!this.pieceCards) {
      logger.error('❌ FrankensteinPieceCards not initialized');
      return;
    }
    this.pieceCards.populateGrid(filter);
  }

  /**
   * Exposed helper para que datos de demo puedan refrescar la UI
   * 🔧 REFACTORING v2.9.154: Delegated to FrankensteinPieceCards module
   */
  renderPiecesTree(filter = 'all') {
    if (!this.pieceCards) {
      logger.error('❌ FrankensteinPieceCards not initialized');
      return;
    }
    this.pieceCards.renderTree(filter);
  }

  /**
   * Organizar piezas por libro
   * 🔧 REFACTORING v2.9.154: Delegated to FrankensteinPieceCards module
   */
  organizePiecesByBook(filter) {
    return this.pieceCards?.organizeByBook(filter) || {};
  }

  /**
   * Obtener título del capítulo de una pieza
   * 🔧 REFACTORING v2.9.154: Delegated to FrankensteinPieceCards module
   */
  getChapterTitle(piece) {
    return this.pieceCards?.getChapterTitle(piece) || `Capítulo ${piece.chapterId}`;
  }

  /**
   * Obtener HTML del resumen de estadísticas
   * 🔧 REFACTORING v2.9.154: Delegated to FrankensteinPieceCards module
   */
  getStatsSummaryHtml(totalPower, totalPieces) {
    return this.pieceCards?.getStatsSummaryHtml(totalPower, totalPieces) || '';
  }

  /**
   * Crear card de libro para vista mobile
   * 🔧 REFACTORING v2.9.154: Delegated to FrankensteinPieceCards module
   */
  createBookCardMobile(bookId, bookData, subtitleText, totalPieces, totalPower, aggregatedAttributes) {
    return this.pieceCards?.createBookCardMobile(bookId, bookData, subtitleText, totalPieces, totalPower, aggregatedAttributes);
  }

  /**
   * Abrir bottom sheet de libro (mobile)
   * 🔧 REFACTORING v2.9.201: Delegated to FrankensteinBottomSheet module
   */
  openBookBottomSheet(bookId) {
    if (this.bottomSheet) {
      this.bottomSheet.registerBook(bookId, this.mobileBooksData?.[bookId]);
      this.bottomSheet.openBook(bookId);
    }
  }

  /**
   * Configurar controles del bottom sheet
   * 🔧 REFACTORING v2.9.154: Delegated to FrankensteinPieceCards module
   */
  setupBookBottomSheetControls(sheet, bookId, bookData) {
    this.pieceCards?.setupBookBottomSheetControls(sheet, bookId, bookData);
  }

  /**
   * Cerrar bottom sheet de libro
   * 🔧 REFACTORING v2.9.154: Delegated to FrankensteinPieceCards module
   */
  closeBookBottomSheet() {
    if (this.bottomSheet) { this.bottomSheet.close(); }
  }

  /**
   * Renderizar capítulos del libro en mobile
   * 🔧 REFACTORING v2.9.154: Delegated to FrankensteinPieceCards module
   */
  renderMobileBookChapters(container, bookId, bookData) {
    this.pieceCards?.renderMobileBookChapters(container, bookId, bookData);
  }

  /**
   * Crear card de pieza para mobile
   * 🔧 REFACTORING v2.9.154: Delegated to FrankensteinPieceCards module
   */
  createMobilePieceCard(piece) {
    return this.pieceCards?.createMobilePieceCard(piece);
  }

  /**
   * Actualizar estado del botón de acción en mobile piece card
   * 🔧 REFACTORING v2.9.154: Delegated to FrankensteinPieceCards module
   */
  updateMobilePieceActionState(button, card) {
    this.pieceCards?.updateMobilePieceActionState(button, card);
  }

  /**
   * Verificar si una pieza está seleccionada
   * 🔧 REFACTORING v2.9.154: Delegated to FrankensteinPieceCards module
   */
  isPieceSelected(pieceId) {
    return this.pieceCards?.isPieceSelected(pieceId) || false;
  }

  /**
   * Calcular poder total de un capítulo
   * 🔧 REFACTORING v2.9.154: Delegated to FrankensteinPieceCards module
   */
  calculateChapterPower(pieces = []) {
    return this.pieceCards?.calculateChapterPower(pieces) || 0;
  }

  /**
   * Crear árbol de libro (vista desktop)
   * 🔧 REFACTORING v2.9.154: Delegated to FrankensteinPieceCards module
   */
  createBookTree(bookId, bookData) {
    return this.pieceCards?.createBookTree(bookId, bookData);
  }

  /**
   * Crear árbol de capítulo (vista desktop)
   * 🔧 REFACTORING v2.9.154: Delegated to FrankensteinPieceCards module
   */
  createChapterTree(bookId, chapterId, chapterData) {
    return this.pieceCards?.createChapterTree(bookId, chapterId, chapterData);
  }

  /**
   * Crear carta de pieza (vista desktop)
   * 🔧 REFACTORING v2.9.154: Delegated to FrankensteinPieceCards module
   */
  createPieceCard(piece) {
    return this.pieceCards?.createPieceCard(piece);
  }
      this.showNotification('Máximo 12 piezas para un ser', 'warning');
      return;
    }

    // EN MODO JUEGO: Mostrar quiz antes de añadir pieza
    if (window.FrankensteinQuiz) {
      const currentMode = window.FrankensteinQuiz.getMode();
      logger.log(`[FrankensteinUI] Quiz mode: ${currentMode}, piece: ${piece.title} (${piece.bookId}/${piece.chapterId})`);

      if (currentMode === 'juego') {
        try {
          logger.log(`[FrankensteinUI] Showing quiz for ${piece.bookId}/${piece.chapterId}`);
          const quizResult = await window.FrankensteinQuiz.showQuizModal(
            piece,
            piece.bookId,
            piece.chapterId
          );

          logger.log(`[FrankensteinUI] Quiz result:`, quizResult);

          if (!quizResult.skipped) {
            // Aplicar multiplicador de poder a la pieza
            piece.powerMultiplier = quizResult.powerMultiplier;

            // Guardar resultado del quiz
            piece.quizScore = quizResult.correctCount;
            piece.quizTotal = quizResult.totalQuestions;
          }
        } catch (error) {
          logger.error('[FrankensteinUI] Error en quiz:', error);
          // Si hay error, continuar sin quiz
        }
      } else {
        logger.log(`[FrankensteinUI] Skipping quiz - mode is "${currentMode}"`);
      }
    } else {
      logger.warn('[FrankensteinUI] FrankensteinQuiz not available');
    }

    // Añadir pieza
    card.classList.add('selected');
    this.selectedPieces.push(piece);

    // Disparar partículas de energía si el sistema está disponible
    if (window.energyParticles) {
      window.energyParticles.createSelectionEffect(card);
    }

    // Pulso de energía en el Hombre de Vitrubio
    if (this.vitruvianBeing && piece.dominantAttribute) {
      this.vitruvianBeing.pulseEnergy(piece.dominantAttribute);
    }

    // Actualizar display del ser
    this.updateBeingFromPieces();

    // Update requirements panel
    this.updateRequirementsPanel();
  }

  /**
   * Actualizar ser a partir de piezas seleccionadas
   */
  updateBeingFromPieces() {
    if (this.selectedPieces.length === 0) {
      this.currentBeing = null;
      this.updateBeingDisplay();
      return;
    }

    // Analizar cada pieza
    const analyzedPieces = this.selectedPieces.map(piece =>
      this.missionsSystem.analyzePiece(piece)
    );

    // Crear ser
    this.currentBeing = this.missionsSystem.createBeing(analyzedPieces, 'Ser en construcción');

    // Actualizar display
    this.updateBeingDisplay();

    // Actualizar indicador de poder si está disponible
    if (window.powerIndicator) {
      const totalPower = this.currentBeing.totalPower || 0;
      const pieceCount = this.selectedPieces.length;
      window.powerIndicator.update(totalPower, pieceCount);
    }

    // Habilitar botones
    this.updateActionButtons();
  }

  /**
   * Actualizar display del ser
   */
  updateBeingDisplay() {
    const missionDifficultyPill = document.getElementById('mission-difficulty-pill');
    if (missionDifficultyPill) {
      const difficulty = this.selectedMission?.difficulty || '--';
      missionDifficultyPill.textContent = difficulty;
      missionDifficultyPill.dataset.level = difficulty;
    }

    const nameEl = this.domCache.beingName || document.getElementById('being-name');
    if (nameEl) {
      nameEl.textContent = this.currentBeing?.name || 'Ser sin nombre';
    }

    const missionLabel = this.domCache.beingMission || document.getElementById('being-mission');
    if (missionLabel) {
      missionLabel.textContent = this.selectedMission
        ? `Misión: ${this.selectedMission.name}`
        : 'No hay misión seleccionada';
    }

    const powerValue = Math.max(
      0,
      Math.round(this.currentBeing?.totalPower || this.calculateCurrentPower() || 0)
    );
    const powerEl = this.domCache.beingPower || document.getElementById('being-power');
    if (powerEl) {
      powerEl.textContent = powerValue.toLocaleString('es-ES');
    }

    const piecesEl = this.domCache.beingPieces || document.getElementById('being-pieces');
    if (piecesEl) {
      piecesEl.textContent = this.selectedPieces.length;
    }

    const statusEl = this.domCache.beingStatus || document.getElementById('being-status');
    if (statusEl) {
      let status = this.selectedMission ? 'Selecciona piezas' : 'Sin misión';

      if (this.selectedMission) {
        if (this.lastValidationResults?.viable) {
          status = 'Validado';
        } else if (this.selectedPieces.length > 0) {
          status = 'En progreso';
        }
      }

      statusEl.textContent = status;
    }

    this.updateVitruvianHud();
    this.updateBeingCompositionSummary();

    this.updateAttributeBars();
    this.updateBalance();
    this.updateAvatarDisplay();

    // Actualizar visualización del Hombre de Vitrubio
    if (this.vitruvianBeing && this.currentBeing) {
      this.vitruvianBeing.updateAttributes(this.currentBeing.attributes);
    } else if (this.vitruvianBeing) {
      // Si no hay ser, resetear
      this.vitruvianBeing.reset();
    }

    this.updatePiecesSidebarMeta();

    if (window.labAIEngineProxy?.updateContext) {
      window.labAIEngineProxy.updateContext(this.currentBeing, this.selectedMission);
    }

    this.updateMiniChallengeProgress();
    this.updateDemoScenarioProgress();
    this.updateActionButtons();
  }

  /**
   * Actualizar display del avatar
   * 🔧 REFACTORING v2.9.201: Delegado a FrankensteinAvatarGenerator
   */
  updateAvatarDisplay() {
    if (this.avatarGenerator) {
      this.avatarGenerator.updateDisplay(this.currentBeing, this.selectedPieces);
    } else {
      // Fallback: ocultar contenedor si no hay generador
      const container = this.domCache.beingAvatar || document.getElementById('being-avatar-display');
      if (container) {
        container.style.display = 'none';
      }
    }
  }


  /**
   * Actualizar barras de atributos
   */
  updateAttributeBars() {
    const container = this.domCache.beingAttributes || document.getElementById('being-attributes');
    const summaryMeta = document.getElementById('attributes-summary-meta');
    if (!container || !this.missionsSystem) return;

    const attributes = this.currentBeing?.attributes || {};
    const requiredAttrs = this.selectedMission?.requiredAttributes || {};
    const entries = Object.entries(attributes).filter(([, value]) => value > 0);

    if (!this.currentBeing || this.selectedPieces.length === 0 || entries.length === 0) {
      container.innerHTML = '<p class="empty-card-message">Agrega piezas para ver los atributos resultantes de tu ser.</p>';
      if (summaryMeta) summaryMeta.textContent = 'Sin atributos';
      return;
    }

    if (summaryMeta) {
      summaryMeta.textContent = `${entries.length} atributos activos`;
    }

    const balanceSnapshot = this.currentBeing.balance ||
      this.missionsSystem?.calculateBalance(attributes) || null;

    const overviewData = balanceSnapshot ? [
      { key: 'intellectual', label: 'Intelectual', icon: '🧠', value: Math.round(balanceSnapshot.intellectual || 0) },
      { key: 'emotional', label: 'Emocional', icon: '❤️', value: Math.round(balanceSnapshot.emotional || 0) },
      { key: 'action', label: 'Acción', icon: '⚡', value: Math.round(balanceSnapshot.action || 0) },
      { key: 'spiritual', label: 'Espiritual', icon: '🌟', value: Math.round(balanceSnapshot.spiritual || 0) },
      { key: 'practical', label: 'Práctico', icon: '🔧', value: Math.round(balanceSnapshot.practical || 0) }
    ] : [];

    const maxOverviewValue = overviewData.length > 0
      ? Math.max(...overviewData.map(d => d.value), 1)
      : 1;

    const overviewHTML = overviewData.length > 0 ? `
      <div class="attributes-overview">
        ${overviewData.map(data => {
          const progress = maxOverviewValue > 0
            ? Math.min(100, Math.round((data.value / maxOverviewValue) * 100))
            : 0;
          return `
            <div class="attribute-radar-card">
              <div class="attribute-radar-meter" style="--progress:${progress}%;">
                <span class="attribute-radar-value">${data.value}</span>
                <span class="attribute-radar-label">${data.icon}</span>
              </div>
              <small>${data.label}</small>
            </div>
          `;
        }).join('')}
      </div>
    ` : '';

    let chipsHTML = '';

    entries
      .sort((a, b) => (b[1] - a[1]))
      .forEach(([key, value]) => {
        const attrData = this.missionsSystem.attributes[key] || {};
        const required = requiredAttrs[key] || 0;
        const percentage = required > 0 ? Math.min((value / required) * 100, 100) : 100;
        const status = required > 0 ? (value >= required ? 'met' : 'unmet') : 'met';

        chipsHTML += `
          <div class="attribute-chip ${status}">
            <div class="chip-head">
              <span class="attribute-icon">${attrData.icon || '🔆'}</span>
              <div class="chip-title">
                <span class="attribute-name">${attrData.name || key}</span>
                <span class="attribute-value">${required > 0 ? `${Math.round(value)}/${required}` : Math.round(value)}</span>
              </div>
            </div>
            <div class="chip-bar">
              <span style="width: ${percentage}%; background-color: ${attrData.color || '#c084fc'};"></span>
            </div>
          </div>
        `;
      });

    container.innerHTML = `
      <div class="attributes-panel">
        ${overviewHTML}
        <div class="attributes-grid">
          ${chipsHTML}
        </div>
      </div>
    `;
  }

  /**
   * Actualizar balance
   */
  updateBalance() {
    const container = this.domCache.beingBalance || document.getElementById('being-balance');
    const summaryMeta = document.getElementById('balance-summary-meta');
    if (!container) return;

    if (!this.currentBeing) {
      container.innerHTML = '<p class="empty-card-message">Selecciona piezas para generar un balance.</p>';
      if (summaryMeta) summaryMeta.textContent = '0%';
      return;
    }

    let balance = this.currentBeing.balance;
    if (!balance || typeof balance !== 'object') {
      balance = this.missionsSystem?.calculateBalance(this.currentBeing.attributes || {}) || {};
    }

    if (summaryMeta) {
      summaryMeta.textContent = `${Math.round(balance.harmony || 0)}%`;
    }

    container.innerHTML = `
      <div class="balance-grid">
        <div class="balance-item">
          <span class="balance-label">🧠 Intelectual</span>
          <span class="balance-value">${Math.round(balance.intellectual || 0)}</span>
        </div>
        <div class="balance-item">
          <span class="balance-label">❤️ Emocional</span>
          <span class="balance-value">${Math.round(balance.emotional || 0)}</span>
        </div>
        <div class="balance-item">
          <span class="balance-label">⚡ Acción</span>
          <span class="balance-value">${Math.round(balance.action || 0)}</span>
        </div>
        <div class="balance-item">
          <span class="balance-label">🌟 Espiritual</span>
          <span class="balance-value">${Math.round(balance.spiritual || 0)}</span>
        </div>
        <div class="balance-item">
          <span class="balance-label">🔧 Práctico</span>
          <span class="balance-value">${Math.round(balance.practical || 0)}</span>
        </div>
      </div>
      <div class="harmony-meter">
        <span style="width: ${Math.min(100, Math.round(balance.harmony || 0))}%"></span>
      </div>
      <p class="balance-total">Poder total: ${Math.round(balance.total || 0)}</p>
    `;
  }

  /**
   * Validar ser para misión
   */
  validateBeing() {
    if (!this.currentBeing || !this.selectedMission) {
      this.showNotification('Selecciona una misión y construye un ser primero', 'warning');
      return;
    }

    const results = this.missionsSystem.validateBeingForMission(this.currentBeing, this.selectedMission);

    // Mostrar resultados
    this.showValidationResults(results);

    // Efectos visuales
    if (results.viable) {
      this.playLightningEffect();
      this._setTimeout(() => this.playLightningEffect(), 300);
      this._setTimeout(() => this.playLightningEffect(), 600);

      // Recompensas por validar ser viable
      if (window.frankensteinRewards) {
        window.frankensteinRewards.giveReward('validateBeing');
      }
    }
  }

  /**
   * Mostrar resultados de validación
   */
  showValidationResults(results) {
    const container = this.domCache.validationResults || document.getElementById('validation-results');
    if (!container) return;

    let html = `
      <div class="validation-header ${results.viable ? 'viable' : 'not-viable'}">
        <h3>${results.viable ? '✅ ¡SER VIABLE!' : '❌ Ser No Viable'}</h3>
        <p class="validation-score">Puntuación: ${results.percentage}% (${results.grade.letter})</p>
      </div>
    `;

    if (results.strengths.length > 0) {
      html += '<div class="validation-section"><h4>💪 Fortalezas</h4><ul>';
      results.strengths.forEach(s => {
        html += `<li>${s.message}</li>`;
      });
      html += '</ul></div>';
    }

    if (results.missingAttributes.length > 0) {
      html += '<div class="validation-section"><h4>⚠️ Atributos Faltantes</h4><ul>';
      results.missingAttributes.forEach(m => {
        html += `<li>${m.message}</li>`;
      });
      html += '</ul></div>';
    }

    if (results.balanceIssues.length > 0) {
      html += '<div class="validation-section"><h4>⚖️ Problemas de Balance</h4><ul>';
      results.balanceIssues.forEach(b => {
        html += `<li>${b.message}</li>`;
      });
      html += '</ul></div>';
    }

    if (results.viable) {
      html += `<p class="validation-message success">${this.selectedMission.successMessage}</p>`;
      html += `
        <div style="display: flex; gap: 0.75rem; justify-content: center; margin-top: 1rem; flex-wrap: wrap;">
          <button class="lab-button primary" onclick="window.frankensteinLabUI.saveBeingWithPrompt()">
            💾 Guardar Ser
          </button>
          <button class="lab-button secondary" onclick="window.frankensteinLabUI.exportBeingAsPrompt()">
            🌟 Exportar Prompt
          </button>
          <button class="lab-button secondary" onclick="window.frankensteinLabUI.startChallenges()">
            🎮 Poner a Prueba
          </button>
          <button class="lab-button secondary" onclick="window.frankensteinLabUI.createMicroSociety()" title="Crear una microsociedad evolutiva con este ser">
            🌍 Microsociedad
          </button>
        </div>
      `;
    }

    container.innerHTML = html;
    container.style.display = 'block';
  }

  /**
   * Exportar ser como prompt para IA
   */
  exportBeingAsPrompt() {
    if (!this.currentBeing) {
      this.showNotification('No hay ser para exportar', 'warning');
      return;
    }

    const prompt = this.generateBeingPrompt();

    // Copiar al portapapeles
    navigator.clipboard.writeText(prompt).then(() => {
      this.showNotification('📋 Prompt copiado al portapapeles', 'success', 4000);
    }).catch(err => {
      logger.error('Error copiando:', err);
    });

    // También mostrar en modal
    this.showPromptModal(prompt);
  }

  /**
   * Generar prompt del ser
   */
  generateBeingPrompt() {
    const being = this.currentBeing;
    if (!being) {
      return 'No hay un ser activo en este momento. Construye o carga un ser para generar su prompt.';
    }

    const fallbackMission = {
      name: 'Exploración Libre',
      description: 'Explorar el laboratorio sin un encargo específico, definiendo el propósito durante la conversación.',
      longDescription: 'Este ser todavía no tiene una misión asignada. Úsalo para prototipar ideas y definir objetivos durante la sesión.'
    };

    const mission = this.selectedMission || fallbackMission;

    // Asegurar que tenemos atributos acumulados
    let collectedAttributes = { ...(being.attributes || {}) };
    if ((!collectedAttributes || Object.keys(collectedAttributes).length === 0) && this.missionsSystem) {
      collectedAttributes = {};
      const piecesSource = (being.pieces && being.pieces.length > 0 ? being.pieces : this.selectedPieces) || [];
      piecesSource.forEach(entry => {
        const pieceData = entry?.piece || entry;
        if (!pieceData) return;
        const analysis = this.missionsSystem.analyzePiece(pieceData);
        if (!analysis || !analysis.attributes) return;
        Object.entries(analysis.attributes).forEach(([attr, value]) => {
          if (value > 0) {
            collectedAttributes[attr] = (collectedAttributes[attr] || 0) + value;
          }
        });
      });
    }

    const balanceData =
      being.balance ||
      (this.missionsSystem?.calculateBalance(collectedAttributes) ?? {
        intellectual: 0,
        emotional: 0,
        action: 0,
        spiritual: 0,
        practical: 0,
        harmony: 0
      });

    const compositionPieces = this.getCanonicalBeingPieces(being).filter(Boolean);
    const attributeEntries = Object.entries(collectedAttributes || {});
    const dnaEntries = attributeEntries
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([key, value]) => {
        const attrData = this.missionsSystem?.attributes?.[key];
        return `- ${attrData?.icon || '📊'} ${attrData?.name || key}: ${Math.round(value)}`;
      })
      .join('\n') || '- Aún no hay atributos dominantes.';

    const knowledgeSection = compositionPieces.length
      ? compositionPieces.map(piece => {
          const safeAttrs = (piece.attributes || [])
            .map(attr => {
              if (!attr) return null;
              const label = attr.name || attr.key;
              const icon = attr.icon || '📊';
              const value = Math.round(attr.value || 0);
              return `${icon} ${label}: ${value}`;
            })
            .filter(Boolean)
            .join(', ');
          const pieceIcon = piece.icon || '🧩';
          const pieceTypeLabel = piece.typeLabel || piece.type || 'Pieza';
          const bookTitle = piece.bookTitle || this.getBookTitle(piece.bookId) || 'Libro desconocido';
          return `- ${pieceIcon} ${pieceTypeLabel}: "${piece.title || 'Sin título'}" (${bookTitle}) → ${safeAttrs || 'sin atributos detectados'}`;
        }).join('\n')
      : '- Agrega piezas para definir el conocimiento base del ser.';

    let prompt = `Eres un Ser Transformador creado en el Laboratorio Frankenstein de la Colección Nuevo Ser.

MISIÓN: ${mission.name}
${mission.longDescription || mission.description || 'Explora, aprende y define tu propósito durante la conversación.'}

ATRIBUTOS NUCLEARES:
${dnaEntries}

BALANCE:
- 🧠 Intelectual: ${Math.round(balanceData.intellectual || 0)}
- ❤️ Emocional: ${Math.round(balanceData.emotional || 0)}
- ⚡ Acción: ${Math.round(balanceData.action || 0)}
- 🌟 Espiritual: ${Math.round(balanceData.spiritual || 0)}
- 🔧 Práctico: ${Math.round(balanceData.practical || 0)}
- Armonía: ${Math.round(balanceData.harmony || 0)}%

CONOCIMIENTO BASE (capítulos y ejercicios seleccionados):
${knowledgeSection}

Como este ser, debes:
1. Actuar según tus atributos y balance específicos
2. Usar el conocimiento de las piezas que te componen
3. Cumplir tu misión: ${mission.description || 'Clarificar el propósito de la sesión junto a la persona que te invoca'}
4. Mantener coherencia con tu propósito transformador

Cuando interactúes, habla desde tu identidad única como este ser, no como una IA genérica.`;

    return prompt;
  }

  getCanonicalBeingPieces(beingOverride = null) {
    if (!this.missionsSystem) return [];
    const targetBeing = beingOverride || this.currentBeing;
    const analyzedPieces = [];
    const typeMeta = {
      chapter: { icon: '📖', label: 'Capítulo' },
      exercise: { icon: '🧪', label: 'Ejercicio' },
      resource: { icon: '🧰', label: 'Recurso' },
      special: { icon: '✨', label: 'Fragmento' }
    };

    const pushAnalysis = (analysis) => {
      if (!analysis) return;
      const pieceData = analysis.piece || analysis;
      if (!pieceData) return;
      const attrEntries = Object.entries(analysis.attributes || {})
        .filter(([, value]) => value > 0)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([key, value]) => {
          const attr = this.missionsSystem?.attributes?.[key];
          return {
            key,
            value: Math.round(value),
            icon: attr?.icon || '📊',
            name: attr?.name || key
          };
        });

      const typeInfo = typeMeta[pieceData.type] || { icon: '🧩', label: 'Pieza' };
      analyzedPieces.push({
        id: pieceData.id || `piece-${analyzedPieces.length}`,
        title: pieceData.title || 'Pieza sin título',
        type: pieceData.type || 'piece',
        icon: pieceData.icon || typeInfo.icon,
        typeLabel: typeInfo.label,
        bookId: pieceData.bookId || '',
        bookTitle: pieceData.bookTitle || this.getBookTitle(pieceData.bookId),
        attributes: attrEntries,
        totalPower: Math.round(analysis.totalPower || 0)
      });
    };

    if (targetBeing?.pieces?.length) {
      targetBeing.pieces.forEach(pushAnalysis);
    } else if (this.selectedPieces.length && this.missionsSystem) {
      this.selectedPieces.forEach(piece => {
        const analysis = this.missionsSystem.analyzePiece(piece);
        pushAnalysis(analysis);
      });
    }

    return analyzedPieces;
  }

  updateVitruvianHud() {
    const hud = this.domCache.vitruvianHud || document.getElementById('vitruvian-hud');
    const badge = this.domCache.vitruvianEnergyBadge || document.getElementById('vitruvian-energy-badge');
    const legend = this.domCache.vitruvianSlotLegend || document.getElementById('vitruvian-slot-legend');
    if (!hud) return;

    if (badge) {
      const totalPower = Math.max(0, Math.round(this.currentBeing?.totalPower || this.calculateCurrentPower() || 0));
      badge.textContent = `⚡ ${totalPower}`;
    }

    if (!this.currentBeing || !this.currentBeing.attributes) {
      hud.innerHTML = '<p class="vitruvian-hud-empty">Añade capítulos y ejercicios para activar este radar.</p>';
      if (legend) {
        legend.innerHTML = '<p class="vitruvian-composition-empty">Selecciona piezas para ver qué partes del cuerpo se energizan.</p>';
      }
      return;
    }

    const attrEntries = Object.entries(this.currentBeing.attributes || {})
      .filter(([, value]) => value > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);

    if (!attrEntries.length) {
      hud.innerHTML = '<p class="vitruvian-hud-empty">Aún no hay atributos dominantes para mostrar.</p>';
    } else {
      hud.innerHTML = attrEntries.map(([key, value]) => {
        const attr = this.missionsSystem?.attributes?.[key];
        const percent = Math.min(100, Math.round((value / 120) * 100));
        return `
          <div class="vitruvian-hud-item">
            <div class="vitruvian-hud-icon">${attr?.icon || '📊'}</div>
            <div class="vitruvian-hud-details">
              <p>${attr?.name || key}</p>
              <span>${Math.round(value)}</span>
              <div class="vitruvian-hud-meter">
                <span style="width:${percent}%"></span>
              </div>
            </div>
          </div>
        `;
      }).join('');
    }

    if (legend) {
      const pieces = this.getCanonicalBeingPieces().slice(0, 3);
      if (!pieces.length) {
        legend.innerHTML = '<p class="vitruvian-composition-empty">Selecciona piezas para ver cómo se distribuye la energía.</p>';
      } else {
        legend.innerHTML = `
          <p class="vitruvian-composition-title">Componentes clave</p>
          <ul class="vitruvian-composition-list">
            ${pieces.map(piece => `
              <li>
                <span class="composition-icon">${piece.icon}</span>
                <div>
                  <p>${piece.title}</p>
                  <small>${piece.typeLabel} · ${piece.bookTitle}</small>
                </div>
                <span class="composition-power">⚡ ${piece.totalPower}</span>
              </li>
            `).join('')}
          </ul>
        `;
      }
    }
  }

  updateBeingCompositionSummary() {
    const list = this.domCache.beingComponentsList || document.getElementById('being-components-list');
    const countLabel = document.getElementById('being-components-count');
    if (!list) return;

    const pieces = this.getCanonicalBeingPieces();
    if (countLabel) {
      countLabel.textContent = `${pieces.length} pieza${pieces.length === 1 ? '' : 's'}`;
    }

    if (!pieces.length) {
      list.innerHTML = '<li>Selecciona capítulos y ejercicios para componer este ser.</li>';
      return;
    }

    list.innerHTML = pieces.slice(0, 4).map(piece => `
      <li>
        <span class="component-icon">${piece.icon}</span>
        <div>
          <p>${piece.title}</p>
          <small>${piece.typeLabel} · ${piece.bookTitle}</small>
        </div>
        <span class="component-power">⚡ ${piece.totalPower}</span>
      </li>
    `).join('');
  }

  /**
   * Mostrar prompt en modal
   */
  showPromptModal(prompt) {
    if (this.modals) {
      this.modals.showPrompt(prompt);
    }
  }

  /**
   * Hablar con el ser (abrir chat IA con contexto del ser)
   */
  talkToBeing() {
    if (!this.currentBeing) {
      this.showNotification('No hay ser para conversar', 'warning');
      return;
    }

    const prompt = this.generateBeingPrompt();

    if (!window.aiChatModal) {
      this.showPromptModal(prompt);
      this.showNotification('Configura la IA en Ajustes para hablar con el ser dentro del laboratorio.', 'info', 5000);
      return;
    }

    // Cerrar instancias anteriores del chat
    const existingModal = document.getElementById('ai-chat-modal');
    if (existingModal) {
      existingModal.remove();
    }

    if (window.labAIEngineProxy?.updateContext) {
      window.labAIEngineProxy.updateContext(this.currentBeing, this.selectedMission);
    }

    // Abrir chat de IA con el prompt
    window.aiChatModal.open();

    this._setTimeout(() => {
      const input = document.getElementById('ai-chat-input');
      if (input) {
        input.value = '';
        input.placeholder = 'Describe tu siguiente paso o pregúntale algo a tu ser...';
        input.focus();
      }
    }, 200);
  }

  /**
   * Limpiar selección
   */
  clearSelection() {
    // Limpiar piezas
    document.querySelectorAll('.piece-card.selected').forEach(card => {
      card.classList.remove('selected');
    });
    this.selectedPieces = [];
    this.currentBeing = null;
    this.lastValidationResults = null;

    // Resetear indicador de poder si está disponible
    if (window.powerIndicator) {
      window.powerIndicator.update(0, 0);
    }

    // Ocultar resultados
    const validationResults = document.getElementById('validation-results');
    if (validationResults) {
      validationResults.style.display = 'none';
    }

    // Desactivar botones
    this.updateActionButtons();

    this.updateBeingDisplay();

    if (this.selectedMission) {
      this.updateRequirementsPanel();
    } else {
      this.clearRequirementsPanel();
    }

    this.saveLabState();
    this.showNotification('Selección limpiada', 'info');
  }

  /**
   * Guardar el estado actual del laboratorio en localStorage
   */
  saveLabState() {
    if (!window?.localStorage) return;
    const record = {
      missionId: this.selectedMission?.id || null,
      selectedPieces: this.selectedPieces.map(piece => this.serializePieceState(piece))
    };
    try {
      localStorage.setItem(this.labStateKey, JSON.stringify(record));
    } catch (error) {
      logger.warn('[FrankensteinUI] No se pudo guardar el estado del laboratorio:', error);
    }
  }

  serializePieceState(piece) {
    if (!piece) return null;
    const overrides = {};
    const fields = [
      'title', 'bookTitle', 'bookId', 'chapterId', 'exerciseId', 'icon',
      'type', 'description', 'dominantAttribute', 'totalPower', 'powerMultiplier',
      'quizScore', 'quizTotal', 'syntheticAttributes', 'isSpecialReward', 'color', 'tags'
    ];
    fields.forEach(key => {
      if (piece[key] !== undefined) {
        overrides[key] = piece[key];
      }
    });
    return {
      id: piece.id || `piece-${Date.now()}`,
      overrides
    };
  }

  /**
   * Restaurar el estado del laboratorio desde localStorage
   */
  restoreLabState() {
    if (this.hasRestoredLabState) return;
    this.hasRestoredLabState = true;
    if (!window?.localStorage) return;
    const raw = localStorage.getItem(this.labStateKey);
    if (!raw) return;
    let state;
    try {
      state = JSON.parse(raw);
    } catch (error) {
      logger.warn('[FrankensteinUI] Estado del laboratorio corrupto:', error);
      return;
    }

    if (state?.missionId) {
      this.applyMissionFromState(state.missionId);
    }

    if (Array.isArray(state?.selectedPieces) && state.selectedPieces.length) {
      document.querySelectorAll('.piece-card.selected, .mobile-piece-card.selected').forEach(card => {
        card.classList.remove('selected');
      });

      this.selectedPieces = this.rehydratePiecesFromState(state.selectedPieces);
      this.selectedPieces.forEach(piece => this.markSelectedPieceCards(piece.id));
      if (this.selectedPieces.length) {
        this.updateBeingFromPieces();
      } else {
        this.currentBeing = null;
        this.updateBeingDisplay();
      }
    } else {
      this.updateBeingDisplay();
    }

    this.updateRequirementsPanel();
    this.updateDemoScenarioProgress();
    this.updateMiniChallengeProgress();
    this.updatePiecesSidebarMeta();
    this.saveLabState();
  }

  rehydratePiecesFromState(records = []) {
    const piecesById = new Map(this.availablePieces.map(piece => [piece.id, piece]));
    const rehydrated = [];
    records.forEach(record => {
      if (!record?.id) return;
      const overrides = record.overrides || {};
      const base = piecesById.get(record.id);
      if (base) {
        rehydrated.push({ ...base, ...overrides });
      } else {
        rehydrated.push({ id: record.id, ...overrides });
      }
    });
    return rehydrated;
  }

  markSelectedPieceCards(pieceId) {
    if (!pieceId) return;
    ['.piece-card', '.mobile-piece-card'].forEach(selector => {
      const card = document.querySelector(`${selector}[data-piece-id="${pieceId}"]`);
      if (card) {
        card.classList.add('selected');
      }
    });
  }

  applyMissionFromState(missionId) {
    if (!missionId || !this.missionsSystem) return false;
    const mission = this.missionsSystem.missions.find(m => m.id === missionId);
    if (!mission) return false;
    const card = document.querySelector(`[data-mission-id="${mission.id}"]`);
    if (card) {
      this.selectMission(mission, card, { silent: true });
      return true;
    }

    this.selectedMission = mission;
    this.ensureMissionRequirements(mission);
    this.updateMissionProgressUI({
      fulfilled: 0,
      total: mission.requirements ? mission.requirements.length : 0
    });
    this.updateBeingDisplay();
    this.updateRequirementsPanel();
    return true;
  }

  /**
   * Efecto de relámpago
   */
  playLightningEffect() {
    const lightning = document.createElement('div');
    lightning.className = 'fusion-lightning';
    document.querySelector('.frankenstein-laboratory')?.appendChild(lightning);
    this._setTimeout(() => lightning.remove(), 1000);
  }

  /**
   * Mostrar notificación usando el sistema mejorado
   * Fallback al sistema basico si enhancedToast no esta disponible
   */
  showNotification(message, type = 'info', duration = 3000) {
    // Usar sistema mejorado si esta disponible
    if (window.enhancedToast) {
      window.enhancedToast.show(message, type, { duration });
      return;
    }

    // Fallback al sistema basico
    const colors = {
      info: 'bg-blue-600',
      success: 'bg-green-600',
      warning: 'bg-amber-600',
      error: 'bg-red-600'
    };

    const notification = document.createElement('div');
    notification.className = `fixed top-20 left-1/2 transform -translate-x-1/2 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-2xl z-50 font-bold text-center`;
    notification.style.minWidth = '300px';
    notification.textContent = message;

    document.body.appendChild(notification);

    this._setTimeout(() => {
      notification.style.transition = 'opacity 0.5s';
      notification.style.opacity = '0';
      this._setTimeout(() => notification.remove(), 500);
    }, duration);
  }

  /**
   * Generar partículas flotantes decorativas
   * @deprecated v2.9.201 - Use uiRenderer.generateFloatingParticles() instead
   */
  generateFloatingParticles() {
    return this.uiRenderer.generateFloatingParticles();
  }

  /**
   * Adjuntar event listeners
   */
  attachEventListeners() {
    // Prevenir interferencia con text selection
    const laboratory = document.querySelector('.frankenstein-laboratory');
    if (laboratory) {
      laboratory.addEventListener('mousedown', (e) => e.stopPropagation());
      laboratory.addEventListener('mouseup', (e) => e.stopPropagation());
      laboratory.addEventListener('click', (e) => e.stopPropagation());
    }

    // Bottom Sheet - Swipe Gestures (delegado al módulo)
    if (this.bottomSheet) {
      this.bottomSheet.init();
    }

    // Bottom Sheet - Header Click
    document.getElementById('bottom-sheet-header-click')?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.toggleBottomSheet();
    });

    // Toggle Requirements Button
    document.getElementById('toggle-requirements')?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.toggleRequirements();
    });

    // Filtros de piezas (ahora con pills)
    document.querySelectorAll('.filter-pill').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        document.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Special handling for compatible filter
        if (btn.dataset.filter === 'compatible') {
          this.filterCompatiblePieces();
        } else {
          this.populatePiecesGrid(btn.dataset.filter);
        }
      });
    });

    // Búsqueda de piezas
    document.getElementById('pieces-search')?.addEventListener('input', (e) => {
      this.searchPieces(e.target.value);
    });

    // Botones
    document.getElementById('btn-clear-selection')?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.clearSelection();
    });

    document.getElementById('btn-export-being')?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.exportBeingAsPrompt();
    });

    document.getElementById('btn-validate-being')?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.validateBeing();
    });

    document.getElementById('btn-talk-to-being')?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.talkToBeing();
    });

    document.getElementById('btn-create-microsociety-card')?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.createMicroSociety();
    });

    document.getElementById('btn-open-microsociety-card')?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.openMicrosocietiesSimulator();
    });

    // Botón cambiar misión
    document.getElementById('btn-change-mission')?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.openMissionModal();
    });

    // === HEADER MEJORADO: Nuevos botones ===

    // Botón menú hamburguesa
    document.getElementById('btn-menu-hamburger')?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.toggleSideMenu();
    });

    // Overlay del menú lateral
    document.getElementById('lab-menu-overlay')?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.closeSideMenu();
    });

    // Items del menú lateral
    document.querySelectorAll('.lab-menu-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const section = item.dataset.section;
        this.handleMenuNavigation(section);
      });
    });

    // Botón de seres guardados
    document.getElementById('btn-saved-beings')?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.showSavedBeingsModal();
    });

    // Botón de estadísticas
    document.getElementById('btn-stats')?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (window.frankensteinStats) {
        window.frankensteinStats.open();
      } else {
        this.showNotification('Estadísticas en desarrollo', 'info');
      }
    });

    // Botón de ajustes
    document.getElementById('btn-settings')?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (window.frankensteinSettings) {
        window.frankensteinSettings.open();
      } else {
        this.showNotification('Ajustes en desarrollo', 'info');
      }
    });

    // Botón cerrar laboratorio
    document.getElementById('btn-close-lab')?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (this.organism && this.organism.hide) {
        this.organism.hide();
      } else {
        // Fallback: navegar a index
        window.location.href = 'index.html';
      }
    });

    // Actualizar contadores en menú
    this.updateMenuBadges();

    // Modal de misiones
    document.getElementById('mission-modal-close')?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.closeMissionModal();
    });

    document.getElementById('mission-modal-overlay')?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.closeMissionModal();
    });

    document.getElementById('modal-open-pieces')?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.closeRequirementsModal();
      this.openPiecesModal();
    });

    // FAB Requirements
    document.getElementById('fab-requirements')?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.openRequirementsModal();
    });

    // Modal de requisitos
    document.getElementById('requirements-modal-close')?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.closeRequirementsModal();
    });

    document.getElementById('requirements-modal-overlay')?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.closeRequirementsModal();
    });

    // FAB Pieces
    document.getElementById('fab-pieces')?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.openPiecesModal();
    });

    // Modal de piezas
    document.getElementById('pieces-modal-close')?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.closePiecesModal();
    });

    document.getElementById('pieces-modal-overlay')?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.closePiecesModal();
    });

    document.getElementById('pieces-open-requirements')?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.closePiecesModal();
      this.openRequirementsModal();
    });

    document.getElementById('mini-challenge-refresh')?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.generateMiniChallenge(true);
    });

    // Vitruvian popup close button
    document.getElementById('vitruvian-popup-close')?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.hideVitruvianPopup();
    });

    // Sticky header scroll detection en modal de piezas
    const piecesModalBody = document.querySelector('.pieces-modal-body');
    if (piecesModalBody) {
      piecesModalBody.addEventListener('scroll', () => {
        this.handlePiecesModalScroll();
      });
    }

    // Initialize Phase 3 features
    this.initContextualTooltips();
    this.showMiniTutorial();

    this.restoreLabState();

    // Open mission modal on first load if no mission selected
    if (!this.selectedMission) {
      this._setTimeout(() => this.openMissionModal(), 500);
    }
  }

  /**
   * Iniciar juego de retos
   */
  startChallenges() {
    if (!this.currentBeing || !this.selectedMission) {
      this.showNotification('⚠️ No hay ser creado para poner a prueba', 'warning');
      return;
    }

    if (!window.startChallengesGame) {
      this.showNotification('⚠️ Sistema de retos no disponible', 'error');
      return;
    }

    // Llamar función global que inicia el juego
    window.startChallengesGame(this.currentBeing, this.selectedMission);
  }

  /**
   * Crear microsociedad con el ser actual
   */
  createMicroSociety() {
    if (!this.currentBeing) {
      this.showNotification('⚠️ No hay ser creado para la microsociedad', 'warning');
      return;
    }

    // Preguntar cuántos seres iniciales quiere
    const count = parseInt(prompt(
      '¿Cuántos seres iniciales para la microsociedad?\n(Se crearán variaciones del ser actual)\nRango: 5-12',
      '7'
    ));

    if (isNaN(count) || count < 5 || count > 12) {
      this.showNotification('⚠️ Número de seres debe estar entre 5 y 12', 'error');
      return;
    }

    // Crear variaciones del ser actual
    const beings = [this.currentBeing];

    // Crear (count - 1) variaciones con mutaciones aleatorias
    for (let i = 1; i < count; i++) {
      const variation = this.createBeingVariation(this.currentBeing, i);
      beings.push(variation);
    }

    const name = `${this.currentBeing.name || 'Microsociedad'} (${count} seres)`;
    const goal = this.selectedMission?.name || 'Explorar cooperación evolutiva';
    let society = null;
    let usedLocalFallback = false;

    if (typeof window.createMicroSocietyFromBeings === 'function') {
      window.createMicroSocietyFromBeings(beings);
    } else {
      const manager = this.ensureMicroSocietiesManager();
      if (manager?.createSociety) {
        society = manager.createSociety(name, beings, goal);
      } else {
        usedLocalFallback = true;
        society = this.simulateMicroSocietyLocally(beings, { name, goal });
      }
    }

    this.microSocietySnapshot = {
      name,
      beingsCount: count,
      metrics: this.estimateMicrosocietyMetrics(beings),
      updatedAt: new Date().toISOString()
    };
    this.renderMicrosocietyCard();

    if (society) {
      if (!usedLocalFallback && typeof window.openMicroSocietiesModal === 'function') {
        window.openMicroSocietiesModal(society);
      } else if (usedLocalFallback) {
        this.renderBasicMicrosocietyModal(society);
      }
    }

    this.showNotification(`🌍 Microsociedad creada con ${count} seres`, 'success');
  }

  ensureMicroSocietiesManager() {
    if (window.microSocietiesManager) {
      return window.microSocietiesManager;
    }
    const ManagerClass = window.MicroSocietiesManager || window.FrankensteinMicrosocieties;
    if (ManagerClass) {
      window.microSocietiesManager = new ManagerClass();
      return window.microSocietiesManager;
    }
    return null;
  }

  /**
   * Crear variación de un ser con mutaciones aleatorias
   */
  createBeingVariation(original, index) {
    const variation = {
      name: `${original.name} (v${index})`,
      pieces: original.pieces,
      attributes: {},
      totalPower: 0
    };

    // Mutar atributos ±10%
    Object.entries(original.attributes).forEach(([attr, value]) => {
      const mutation = (Math.random() - 0.5) * 0.2; // ±10%
      variation.attributes[attr] = Math.max(0, value * (1 + mutation));
    });

    // Recalcular poder total
    variation.totalPower = original.totalPower * (0.9 + Math.random() * 0.2); // 90%-110%

    return variation;
  }

  simulateMicroSocietyLocally(beings, { name, goal } = {}) {
    const preparedBeings = beings.map((being, index) => {
      const clone = JSON.parse(JSON.stringify(being));
      clone.id = clone.id || `being-${Date.now()}-${index}`;
      clone.alive = clone.alive ?? true;
      clone.totalPower = Math.round(
        clone.totalPower ||
        Object.values(clone.attributes || {}).reduce((acc, value) => acc + (value || 0), 0)
      );
      return clone;
    });

    const metrics = this.estimateMicrosocietyMetrics(preparedBeings);
    return {
      name: name || 'Microsociedad Experimental',
      goal: goal || 'Explorar cooperación evolutiva',
      beings: preparedBeings,
      turn: 0,
      metrics,
      metricsHistory: [{ turn: 0, ...metrics }],
      eventLog: [{
        turn: 0,
        icon: '🧪',
        message: 'Simulación local generada desde el laboratorio'
      }]
    };
  }

  /**
   * ========================================
   * SISTEMA DE GUARDADO DE SERES
   * ========================================
   */

  /**
   * Guardar ser pidiendo nombre al usuario
   */
  saveBeingWithPrompt() {
    if (!this.currentBeing || !this.selectedMission) {
      this.showNotification('⚠️ No hay ser para guardar', 'warning');
      return;
    }

    const defaultName = `${this.selectedMission.name.substring(0, 20)} - ${new Date().toLocaleDateString()}`;
    const beingName = prompt('Nombre para este ser:', defaultName);

    if (!beingName) {
      // Usuario canceló
      return;
    }

    this.saveBeing(beingName.trim());
  }

  /**
   * Guardar ser actual en localStorage
   */
  saveBeing(beingName) {
    if (!this.currentBeing || !this.selectedMission) {
      this.showNotification('⚠️ No hay ser para guardar', 'warning');
      return false;
    }

    try {
      // Cargar seres existentes
      const savedBeings = this.loadBeings();

      // Crear objeto de ser guardado
      const savedBeing = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        name: beingName || `Ser del ${new Date().toLocaleDateString()}`,
        being: this.currentBeing,
        mission: this.selectedMission,
        validation: this.lastValidationResults,
        pieces: this.selectedPieces,
        // Metadata adicional
        totalPower: this.currentBeing.totalPower,
        pieceCount: this.selectedPieces.length,
        missionId: this.selectedMission.id
      };

      // Añadir a la lista
      savedBeings.push(savedBeing);

      // Guardar en localStorage
      localStorage.setItem('frankenstein-saved-beings', JSON.stringify(savedBeings));

      // Intentar guardar en Supabase si está disponible
      if (window.supabaseSyncHelper && window.supabaseSyncHelper.isAuthenticated) {
        this.saveBeingToSupabase(savedBeing).catch(err => {
          logger.warn('No se pudo sincronizar con Supabase:', err);
        });
      }

      this.showNotification(`✅ Ser "${savedBeing.name}" guardado exitosamente`, 'success', 4000);

      // Sonido dramático de trueno al crear ser
      if (window.frankenAudio && window.frankenAudio.enabled) {
        window.frankenAudio.playThunder();
        logger.log('[FrankenAudio] ⚡ Trueno reproducido al crear ser');
      }

      // Recompensa por crear/guardar ser
      if (window.frankensteinRewards) {
        window.frankensteinRewards.giveReward('createBeing');
      }

      return true;
    } catch (error) {
      logger.error('Error guardando ser:', error);
      this.showNotification('❌ Error al guardar el ser', 'error');
      return false;
    }
  }

  /**
   * Cargar seres guardados desde localStorage
   */
  loadBeings() {
    try {
      const saved = localStorage.getItem('frankenstein-saved-beings');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      logger.error('Error cargando seres:', error);
      return [];
    }
  }

  /**
   * Cargar un ser específico
   */
  loadBeing(savedBeingId) {
    try {
      const savedBeings = this.loadBeings();
      const savedBeing = savedBeings.find(b => b.id === savedBeingId);

      if (!savedBeing) {
        this.showNotification('⚠️ Ser no encontrado', 'warning');
        return false;
      }

      // Resolver misión actual desde el sistema (por si cambió el schema)
      if (this.missionsSystem) {
        const missionId = savedBeing.mission?.id || savedBeing.missionId;
        const resolvedMission = this.missionsSystem.missions.find(m => m.id === missionId);
        this.selectedMission = resolvedMission || savedBeing.mission || null;
      } else {
        this.selectedMission = savedBeing.mission || null;
      }

      this.ensureMissionRequirements(this.selectedMission);

      // Mapear piezas guardadas a las disponibles actualmente
      const piecesById = new Map(this.availablePieces.map(piece => [piece.id, piece]));
      const storedPieces = savedBeing.pieces?.length
        ? savedBeing.pieces
        : (savedBeing.being?.pieces?.map(entry => entry.piece || entry) || []);

      const missingPieces = [];
      this.selectedPieces = storedPieces
        .map(piece => {
          const overrides = piece?.overrides ? piece.overrides : piece;
          const resolved = piecesById.get(piece.id);

          if (resolved) {
            return { ...resolved, ...overrides };
          }

          const fallback = this.hydrateLegacyPiece(overrides);
          if (fallback) {
            missingPieces.push(fallback);
            return fallback;
          }
          return null;
        })
        .filter(Boolean);

      if (missingPieces.length > 0) {
        logger.warn('[FrankensteinUI] Piezas no encontradas en el catálogo actual:', missingPieces.map(p => p.id));
        this.showNotification(`⚠️ ${missingPieces.length} piezas no existen en el catálogo actual. Se usaron versiones de respaldo.`, 'warning', 6000);
      }

      this.lastValidationResults = savedBeing.validation || null;

      const analyzedPieces = (this.missionsSystem && this.selectedPieces.length > 0)
        ? this.selectedPieces.map(piece =>
            this.missionsSystem.analyzePiece(piece) || { piece, attributes: {}, totalPower: 0 }
          )
        : [];

      let restoredBeing = null;
      const isDemoBeing = Boolean(savedBeing.id && savedBeing.id.startsWith('demo-')) || Boolean(savedBeing.isDemo);

      const shouldUseSnapshot =
        isDemoBeing ||
        !this.missionsSystem ||
        analyzedPieces.length === 0 ||
        missingPieces.length > 0;

      if (this.missionsSystem && analyzedPieces.length > 0 && !shouldUseSnapshot) {
        restoredBeing = this.missionsSystem.createBeing(analyzedPieces, savedBeing.name || 'Ser guardado');
        restoredBeing.pieces = analyzedPieces;
      } else if (savedBeing.being) {
        restoredBeing = {
          ...savedBeing.being,
          pieces: savedBeing.being.pieces || analyzedPieces
        };
      } else {
        restoredBeing = {
          name: savedBeing.name || 'Ser guardado',
          attributes: {},
          totalPower: savedBeing.totalPower || 0,
          balance: null,
          pieces: analyzedPieces
        };
      }

      const savedPower = savedBeing.totalPower || savedBeing.being?.totalPower || 0;
      if (savedPower > (restoredBeing?.totalPower || 0)) {
        restoredBeing.totalPower = savedPower;
      }

      this.currentBeing = {
        ...restoredBeing,
        name: savedBeing.name || restoredBeing?.name || 'Ser guardado'
      };

      // Calcular balance si no existe (para seres demo)
      if (!this.currentBeing.balance && this.currentBeing.attributes) {
        const attrs = this.currentBeing.attributes;
        this.currentBeing.balance = {
          intellectual: Math.round((attrs.wisdom + attrs.consciousness) / 2),
          emotional: Math.round((attrs.empathy + attrs.balance) / 2),
          action: Math.round((attrs.action + attrs.courage) / 2),
          spiritual: Math.round((attrs.consciousness + attrs.balance) / 2),
          practical: Math.round((attrs.organization + attrs.discipline) / 2),
          harmony: Math.round((attrs.balance + attrs.resilience) / 2)
        };
      }
      // Actualizar UI del laboratorio
      this.updateBeingDisplay();
      this.applyDemoScenario(savedBeing);

      if (this.selectedMission) {
        this.updateRequirementsPanel();
      } else {
        this.clearRequirementsPanel();
      }

      // Marcar piezas como seleccionadas en el grid
      document.querySelectorAll('.piece-card.selected').forEach(card => card.classList.remove('selected'));
      this.selectedPieces.forEach(piece => {
        if (!piece || !piece.id) return;
        const card = document.querySelector(`[data-piece-id="${piece.id}"]`);
        if (card) {
          card.classList.add('selected');
        }
      });

      // Resaltar misión seleccionada en la UI si existe
      if (this.selectedMission?.id) {
        document.querySelectorAll('.mission-card.selected, .mission-tab.selected').forEach(c => c.classList.remove('selected'));
        const missionCard = document.querySelector(`[data-mission-id="${this.selectedMission.id}"]`);
        if (missionCard) {
          missionCard.classList.add('selected');
        }
      }

      this.generateMiniChallenge(true);
      this.showNotification(`✅ Ser "${savedBeing.name}" cargado`, 'success', 3000);
      this.saveLabState();
      return true;
    } catch (error) {
      logger.error('Error cargando ser:', error);
      this.showNotification('❌ Error al cargar el ser', 'error');
      return false;
    }
  }

  /**
   * Eliminar ser guardado
   */
  deleteBeing(savedBeingId) {
    try {
      let savedBeings = this.loadBeings();
      const originalLength = savedBeings.length;

      savedBeings = savedBeings.filter(b => b.id !== savedBeingId);

      if (savedBeings.length === originalLength) {
        this.showNotification('⚠️ Ser no encontrado', 'warning');
        return false;
      }

      localStorage.setItem('frankenstein-saved-beings', JSON.stringify(savedBeings));
      this.showNotification('🗑️ Ser eliminado', 'info', 2000);
      return true;
    } catch (error) {
      logger.error('Error eliminando ser:', error);
      this.showNotification('❌ Error al eliminar el ser', 'error');
      return false;
    }
  }

  /**
   * Guardar en Supabase (opcional)
   */
  async saveBeingToSupabase(savedBeing) {
    if (!window.supabase) return;

    try {
      const { data, error } = await window.supabase
        .from('frankenstein_beings')
        .insert([{
          user_id: window.supabaseSyncHelper.userId,
          being_data: savedBeing,
          name: savedBeing.name,
          mission_id: savedBeing.missionId,
          total_power: savedBeing.totalPower,
          created_at: savedBeing.timestamp
        }]);

      if (error) throw error;
      logger.log('✅ Ser sincronizado con Supabase');
    } catch (error) {
      logger.warn('Error en Supabase sync:', error);
      // No lanzar error, es opcional
    }
  }

  /**
   * Mostrar modal de seres guardados
   */
  showSavedBeingsModal() {
    if (this.modals) {
      this.modals.showSavedBeings();
    }
  }

  /**
   * Helper: sleep
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * ========================================
   * BOTTOM SHEET FUNCTIONALITY
   * ========================================
   */

  /**
   * Toggle Bottom Sheet (click on header)
   */
  // 🔧 REFACTORING v2.9.201: Wrapper - delegado a FrankensteinBottomSheet
  toggleBottomSheet() {
    if (this.bottomSheet) {
      this.bottomSheet.toggle();
    }
  }

  /**
   * Toggle Requirements Panel
   */
  toggleRequirements() {
    const checklist = document.getElementById('requirements-checklist');
    const button = document.getElementById('toggle-requirements');

    if (!checklist || !button) return;

    const isExpanded = checklist.classList.contains('expanded');

    if (isExpanded) {
      checklist.classList.remove('expanded');
      button.classList.remove('expanded');
      button.querySelector('span').textContent = 'Ver Requisitos';
    } else {
      checklist.classList.add('expanded');
      button.classList.add('expanded');
      button.querySelector('span').textContent = 'Ocultar Requisitos';
    }
  }

  /**
   * Update Requirements Panel
   */
  updateRequirementsPanel() {
    if (!this.selectedMission) {
      this.clearRequirementsPanel();
      return;
    }

    const missionNameEl = this.domCache.currentMissionName || document.getElementById('current-mission-name');
    const currentPowerEl = this.domCache.currentPower || document.getElementById('current-power');
    const requiredPowerEl = this.domCache.requiredPower || document.getElementById('required-power');
    const progressFill = this.domCache.progressFill || document.getElementById('progress-fill');
    const progressText = this.domCache.progressText || document.getElementById('progress-text');
    const checklist = this.domCache.requirementsChecklist || document.getElementById('requirements-checklist');

    if (!missionNameEl || !currentPowerEl || !requiredPowerEl || !progressFill || !progressText || !checklist) {
      this.pendingRequirementsUpdate = true;
      return;
    }

    this.pendingRequirementsUpdate = false;

    const mission = this.selectedMission;
    const requirements = mission.requirements || [];
    const missingRequirements = this.getMissingRequirements(requirements);

    // Update mission name
    missionNameEl.textContent = mission.name;

    // Update power indicator
    const currentPower = this.calculateCurrentPower();
    const requiredPower = mission.minPower || 0;

    currentPowerEl.textContent = Math.floor(currentPower);
    requiredPowerEl.textContent = requiredPower;

    // Update progress bar
    const fulfilled = this.countFulfilledRequirements(requirements);
    const total = requirements.length;
    const percentage = total > 0 ? (fulfilled / total) * 100 : 0;

    progressFill.style.width = `${percentage}%`;
    if (percentage > this.lastProgressPercentage) {
      progressFill.classList.add('increased');
      this._setTimeout(() => progressFill.classList.remove('increased'), 600);
    }

    progressText.textContent = `${fulfilled}/${total}`;

    this.lastProgressPercentage = percentage;

    // Update checklist
    this.updateRequirementsChecklist(requirements);

    // Show progress hint when requirements are fulfilled
    if (fulfilled > 0 && fulfilled < total) {
      this.showProgressHint(`${fulfilled}/${total} requisitos cumplidos`);
    }

    // Show confetti if complete
    if (fulfilled === total && total > 0 && !this.hasShownConfetti) {
      this.showConfetti();
      this.hasShownConfetti = true;
    }

    // Update FAB badges
    this.updateFABBadges();

    // Update missing requirements quick view
    this.updateMissingRequirementsQuickView();

    // Update mini summary in workspace
    this.updateRequirementsSummaryMini();
    this.updateRequirementsBriefing(mission, {
      requirements,
      requiredPower,
      fulfilled,
      total
    });
    this.updatePiecesTipsPanel(missingRequirements, requirements);
    this.updateMissionProgressUI({ fulfilled, total });
    this.handleRequirementMilestones(requirements);
    this.updateStickyRequirementsHeader();
  }

  /**
   * Update Requirements Checklist
   */
  updateRequirementsChecklist(requirements) {
    const checklist = this.domCache.requirementsChecklist || document.getElementById('requirements-checklist');
    if (!checklist) return;

    checklist.innerHTML = requirements.map(req => {
      const fulfilled = this.isRequirementFulfilled(req);
      const conflict = this.hasRequirementConflict(req);
       const currentValue = Math.round(this.getRequirementCurrentValue(req));
       const targetValue = this.getRequirementTarget(req) || 0;
       const attrData = this.missionsSystem?.attributes?.[req.type];

      const className = fulfilled ? 'fulfilled' : (conflict ? 'conflict' : '');
      const icon = this.getRequirementIcon(req.type);
      const status = fulfilled ? '✅' : (conflict ? '🔴' : '⬜');
      const label = attrData ? `${attrData.icon} ${attrData.name}` : (req.description || req.type);

      return `
        <div class="requirement-item ${className}">
          <div class="requirement-icon">${icon}</div>
          <div class="requirement-text">
            <span>${label}</span>
            <span class="requirement-value">${targetValue ? `${currentValue}/${targetValue}` : currentValue}</span>
          </div>
          <div class="requirement-status">${status}</div>
        </div>
      `;
    }).join('');
  }

  /**
   * Clear Requirements Panel
   */
  clearRequirementsPanel() {
    const missionNameEl = document.getElementById('current-mission-name');
    const currentPowerEl = document.getElementById('current-power');
    const requiredPowerEl = document.getElementById('required-power');
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    const checklist = document.getElementById('requirements-checklist');

    if (!missionNameEl || !currentPowerEl || !requiredPowerEl || !progressFill || !progressText || !checklist) {
      return;
    }

    missionNameEl.textContent = 'Sin Misión';
    currentPowerEl.textContent = '0';
    requiredPowerEl.textContent = '0';
    progressFill.style.width = '0%';
    progressText.textContent = '0/0';
    checklist.innerHTML = '';
    this.updateRequirementsSummaryMini();
    this.updateRequirementsBriefing(null);
    this.updatePiecesTipsPanel();
    this.lastRequirementState = {};
    this.updateMissionProgressUI({ fulfilled: 0, total: 0 });
    this.activeMiniChallenge = null;
    this.renderMiniChallenge();
    this.updateStickyRequirementsHeader(true);
  }

  /**
   * Update Requirements Summary Mini (workspace panel)
   */
  updateRequirementsSummaryMini() {
    const miniSummary = document.getElementById('mission-requirements-summary');
    const progressFillMini = this.domCache.progressFillMini || document.getElementById('progress-fill-mini');
    const progressLabelMini = this.domCache.progressLabelMini || document.getElementById('progress-label-mini');
    const requirementsListMini = this.domCache.requirementsListMini || document.getElementById('requirements-list-mini');
    const summaryLabel = this.domCache.requirementsSummaryLabel || document.getElementById('requirements-summary-label');
    const viewAllBtn = document.getElementById('requirements-mini-view-all');

    if (!miniSummary) return;

    if (!this.selectedMission) {
      miniSummary.hidden = false;
      if (summaryLabel) summaryLabel.textContent = '--';
      if (progressFillMini) {
        progressFillMini.style.width = '0%';
        progressFillMini.style.backgroundColor = '#555';
      }
      if (progressLabelMini) {
        progressLabelMini.textContent = 'Selecciona una misión';
      }
      if (requirementsListMini) {
        requirementsListMini.innerHTML = '<p class="empty-card-message">Selecciona una misión para ver requisitos.</p>';
      }
      if (viewAllBtn) {
        viewAllBtn.style.display = 'none';
      }
      return;
    }

    const requirements = this.getCurrentMissionRequirements();
    const total = requirements.length;
    const fulfilled = this.countFulfilledRequirements(requirements);
    const percentage = total > 0 ? (fulfilled / total) * 100 : 0;

    miniSummary.hidden = false;

    if (summaryLabel) {
      summaryLabel.textContent = total > 0 ? `${fulfilled}/${total}` : '--';
    }

    if (progressFillMini) {
      progressFillMini.style.width = `${percentage}%`;
      progressFillMini.style.backgroundColor = percentage >= 100 ? '#4CAF50' : '#FF9800';
    }

    if (progressLabelMini) {
      progressLabelMini.textContent = total > 0 ? `${fulfilled}/${total} cumplidos` : 'Sin requisitos';
    }

    if (requirementsListMini) {
      if (requirements.length === 0) {
        requirementsListMini.innerHTML = '<p class="empty-card-message">Esta misión no tiene requisitos definidos.</p>';
      } else {
        const topRequirements = requirements.slice(0, 5);
        requirementsListMini.innerHTML = topRequirements.map(req => {
          const isFulfilled = this.isRequirementFulfilled(req);
          const icon = isFulfilled ? '✅' : '⬜';
          const attrData = this.missionsSystem?.attributes?.[req.type];
          const label = attrData ? `${attrData.icon} ${attrData.name}` : (req.description || req.type);
          const targetValue = this.getRequirementTarget(req) || 0;
          const currentValue = Math.round(this.getRequirementCurrentValue(req));

          return `
            <div class="requirement-mini-item ${isFulfilled ? 'fulfilled' : ''}">
              <span class="requirement-mini-icon">${icon}</span>
              <div class="requirement-mini-text">
                <span>${label}</span>
                <small>${targetValue ? `${currentValue}/${targetValue}` : currentValue}</small>
              </div>
            </div>
          `;
        }).join('');

        if (requirements.length > 5) {
          requirementsListMini.innerHTML += `
            <div class="requirement-mini-more">
              +${requirements.length - 5} más...
              <button class="view-all-requirements" onclick="document.getElementById('fab-requirements').click()">
                Ver todos
              </button>
            </div>
          `;
        }
      }
    }

    if (viewAllBtn) {
      viewAllBtn.style.display = requirements.length > 0 ? 'inline-flex' : 'none';
    }
  }

  /**
   * Update briefing sidebar inside requirements modal
   */
  updateRequirementsBriefing(mission, { requirements = [], requiredPower = 0, fulfilled = 0, total = 0 } = {}) {
    const nameEl = this.domCache.modalMissionName || document.getElementById('modal-mission-name');
    const descEl = this.domCache.modalMissionDescription || document.getElementById('modal-mission-description');
    const difficultyEl = this.domCache.modalMissionDifficulty || document.getElementById('modal-mission-difficulty');
    const powerEl = this.domCache.modalMissionPower || document.getElementById('modal-mission-power');
    const progressEl = this.domCache.modalMissionProgress || document.getElementById('modal-mission-progress');
    const hintsList = this.domCache.modalMissionHints || document.getElementById('modal-mission-hints');

    if (!nameEl || !descEl || !difficultyEl || !powerEl || !progressEl || !hintsList) {
      return;
    }

    if (!mission) {
      nameEl.textContent = 'Selecciona una misión';
      descEl.textContent = 'Elige una misión para conocer sus requisitos, objetivos y sugerencias.';
      difficultyEl.textContent = '--';
      difficultyEl.dataset.level = '';
      powerEl.textContent = '0';
      progressEl.textContent = '0/0';
      hintsList.innerHTML = '<li>Selecciona una misión para recibir sugerencias estratégicas.</li>';
      return;
    }

    nameEl.textContent = mission.name;
    descEl.textContent = mission.longDescription || mission.description || 'Misión sin descripción.';
    difficultyEl.textContent = mission.difficulty || '--';
    difficultyEl.dataset.level = mission.difficulty || '';
    powerEl.textContent = Math.max(requiredPower, mission.minPower || 0).toLocaleString('es-ES');
    progressEl.textContent = total > 0 ? `${fulfilled}/${total}` : '--';

    const missing = this.getMissingRequirements(requirements);
    if (missing.length === 0) {
      hintsList.innerHTML = '<li>¡Todos los requisitos están cubiertos! Puedes validar el ser.</li>';
      return;
    }

    hintsList.innerHTML = missing.slice(0, 4).map(req => {
      const attrData = this.missionsSystem?.attributes?.[req.type];
      const label = attrData ? `${attrData.icon} ${attrData.name}` : (req.description || req.type);
      const targetValue = this.getRequirementTarget(req) || 0;
      const currentValue = Math.round(this.getRequirementCurrentValue(req));
      return `<li><strong>${label}:</strong> ${currentValue}/${targetValue}. Añade piezas que mejoren este atributo.</li>`;
    }).join('');
  }

  /**
   * Update extra stats on pieces sidebar
   */
  updatePiecesSidebarMeta() {
    const selectedCountEl = this.domCache.piecesSelectedCount || document.getElementById('pieces-selected-count');
    const powerEl = this.domCache.piecesSelectedPower || document.getElementById('pieces-selected-power');
    if (selectedCountEl) {
      selectedCountEl.textContent = this.selectedPieces.length.toString();
    }
    if (powerEl) {
      powerEl.textContent = Math.max(0, Math.round(this.calculateCurrentPower())).toLocaleString('es-ES');
    }
  }

  /**
   * Update tips card within pieces modal
   */
  updatePiecesTipsPanel(missing = [], requirements = []) {
    const tipsList = document.getElementById('pieces-tips-list');
    if (!tipsList) return;

    if (!this.selectedMission) {
      tipsList.innerHTML = '<li>Selecciona una misión para recibir recomendaciones de piezas.</li>';
      return;
    }

    if (!missing || missing.length === 0) {
      tipsList.innerHTML = '<li>¡Requisitos completos! Usa esta vista para refinar o validar tu ser.</li>';
      return;
    }

    tipsList.innerHTML = missing.slice(0, 3).map(req => {
      const attrData = this.missionsSystem?.attributes?.[req.type];
      const label = attrData ? `${attrData.icon} ${attrData.name}` : (req.description || req.type);
      const targetValue = this.getRequirementTarget(req) || 0;
      const currentValue = Math.round(this.getRequirementCurrentValue(req));
      const remaining = Math.max(0, targetValue - currentValue);
      return `<li>${label}: agrega piezas que aporten al menos ${remaining} puntos.</li>`;
    }).join('');
  }

  /**
   * Get Requirement Icon
   */
  getRequirementIcon(type) {
    const attribute = this.missionsSystem?.attributes?.[type];
    if (attribute) {
      return attribute.icon || '📊';
    }

    const icons = {
      chapter: '📖',
      exercise: '⚡',
      resource: '🔧',
      power: '💪',
      balance: '⚖️',
      category: '🏷️'
    };
    return icons[type] || '📋';
  }

  /**
   * Obtener valor objetivo de un requisito
   */
  getRequirementTarget(requirement) {
    if (!requirement) return 0;
    if (typeof requirement.count === 'number') return requirement.count;
    if (typeof requirement.min === 'number') return requirement.min;
    if (typeof requirement.value === 'number') return requirement.value;
    return 0;
  }

  /**
   * Obtener progreso actual de un requisito
   */
  getRequirementCurrentValue(requirement) {
    if (!requirement) return 0;

    if (requirement.type === 'power') {
      return Math.round(this.currentBeing?.totalPower || this.calculateCurrentPower());
    }

    if (this.missionsSystem?.attributes?.[requirement.type]) {
      if (this.currentBeing?.attributes?.[requirement.type] != null) {
        return Math.round(this.currentBeing.attributes[requirement.type]);
      }

      if (this.selectedPieces.length > 0) {
        return this.selectedPieces.reduce((sum, piece) => {
          const analysis = this.missionsSystem.analyzePiece(piece);
          return sum + (analysis.attributes[requirement.type] || 0);
        }, 0);
      }

      return 0;
    }

    return this.selectedPieces.filter(p => p.type === requirement.type).length;
  }

  getRequirementKey(requirement) {
    if (!requirement) return '';
    return requirement.id ||
      `${requirement.type || 'req'}-${requirement.description || ''}-${requirement.count || requirement.min || requirement.value || ''}`;
  }

  handleRequirementMilestones(requirements = []) {
    if (!requirements || requirements.length === 0) {
      this.lastRequirementState = {};
      return;
    }

    if (!this.lastRequirementState) {
      this.lastRequirementState = {};
    }

    const newlyFulfilled = [];
    requirements.forEach(req => {
      const key = this.getRequirementKey(req);
      const isFulfilled = this.isRequirementFulfilled(req);
      if (isFulfilled && !this.lastRequirementState[key]) {
        newlyFulfilled.push(req);
      }
      this.lastRequirementState[key] = isFulfilled;
    });

    if (newlyFulfilled.length > 0) {
      const fulfilled = this.countFulfilledRequirements(requirements);
      const total = requirements.length;
      const percent = total > 0 ? (fulfilled / total) * 100 : 0;
      newlyFulfilled.forEach(req => this.triggerRequirementCelebration(req, percent, fulfilled, total));
    }
  }

  triggerRequirementCelebration(requirement, percent, fulfilled, total) {
    const attrData = this.missionsSystem?.attributes?.[requirement.type];
    const label = attrData
      ? `${attrData.icon || '🎯'} ${attrData.name}`
      : (requirement.description || 'Requisito de misión');
    this.spawnProgressReward(percent || 0, label);
    this.showNotification(`✅ Objetivo completado: ${label}`, 'success', 2400);

    if (fulfilled === total && total > 0) {
      this.showNotification('🏆 ¡Todos los objetivos de la misión están listos! Valida tu ser.', 'success', 3500);
    }
  }

  spawnProgressReward(percent, label) {
    const card = document.querySelector('.mission-progress-card');
    if (!card) return;

    const celebration = document.createElement('div');
    celebration.className = 'progress-celebration';
    celebration.textContent = `+ ${label}`;
    const clampPercent = Math.max(10, Math.min(90, percent || 0));
    celebration.style.left = `${clampPercent}%`;
    celebration.style.top = '10px';
    card.appendChild(celebration);
    this._setTimeout(() => celebration.remove(), 1200);
  }

  generateMiniChallenge(force = false) {
    if (!this.selectedMission) {
      this.activeMiniChallenge = null;
      this.renderMiniChallenge();
      return;
    }

    if (this.activeMiniChallenge && !force && !this.activeMiniChallenge.completed) {
      return;
    }

    const requirements = this.getCurrentMissionRequirements();
    const missing = this.getMissingRequirements(requirements);
    let attrKey = null;
    let baseRequirement = null;

    if (missing.length > 0) {
      baseRequirement = missing.find(req => this.missionsSystem?.attributes?.[req.type]);
      attrKey = baseRequirement?.type || null;
    }

    const attributeKeys = Object.keys(this.missionsSystem?.attributes || {});
    if (!attrKey && attributeKeys.length > 0) {
      attrKey = attributeKeys[Math.floor(Math.random() * attributeKeys.length)];
    }

    if (!attrKey) {
      this.activeMiniChallenge = null;
      this.renderMiniChallenge();
      return;
    }

    const currentValue = Math.round(this.currentBeing?.attributes?.[attrKey] || 0);
    const baseTarget = baseRequirement ? this.getRequirementTarget(baseRequirement) : currentValue + 20;
    const randomBoost = 15 + Math.round(Math.random() * 25);
    const target = Math.max(baseTarget, currentValue + randomBoost);

    this.activeMiniChallenge = {
      id: Date.now(),
      attribute: attrKey,
      target,
      createdAt: new Date().toISOString(),
      completed: false
    };

    this.renderMiniChallenge();
    this.updateMiniChallengeProgress();
  }

  renderMiniChallenge() {
    const body = this.domCache.miniChallengeBody || document.getElementById('mini-challenge-body');
    const titleEl = this.domCache.miniChallengeTitle || document.getElementById('mini-challenge-title');
    if (!body) return;

    if (!this.selectedMission) {
      if (titleEl) titleEl.textContent = 'Sin misión activa';
      body.innerHTML = '<p class="empty-card-message">Selecciona una misión para recibir eventos dinámicos.</p>';
      return;
    }

    if (!this.activeMiniChallenge) {
      if (titleEl) titleEl.textContent = 'Sin evento activo';
      body.innerHTML = '<p class="empty-card-message">Pulsa el botón ↻ para generar un evento relámpago.</p>';
      return;
    }

    const challenge = this.activeMiniChallenge;
    const attrData = this.missionsSystem?.attributes?.[challenge.attribute];
    const value = Math.round(this.currentBeing?.attributes?.[challenge.attribute] || 0);
    const percent = Math.min(100, Math.round((value / challenge.target) * 100));
    const status = challenge.completed ? 'Completado' : `${value}/${challenge.target}`;

    if (titleEl) {
      titleEl.textContent = challenge.completed
        ? 'Evento completado'
        : `${attrData?.icon || '🎯'} ${attrData?.name || 'Evento activo'}`;
    }

    body.innerHTML = `
      <div class="mini-challenge-meta">
        <span class="mini-challenge-attr">${attrData?.icon || '🎯'} ${attrData?.name || 'Atributo'}</span>
        <span class="mini-challenge-status">${status}</span>
      </div>
      <p class="mini-challenge-description">
        ${challenge.completed
          ? 'Evento superado. Se generará un nuevo reto en breve.'
          : 'Impulsa este atributo hasta la meta para desbloquear recompensas del laboratorio.'}
      </p>
      <div class="mini-challenge-progress-track">
        <div class="mini-challenge-progress-fill" style="width:${percent}%"></div>
      </div>
      <small class="mini-challenge-progress-hint">${percent >= 100 ? 'Listo para celebrar.' : `Progreso: ${percent}%`}</small>
      ${this.getMiniChallengeHistoryMarkup()}
    `;
  }

  getMiniChallengeHistoryMarkup() {
    if (!this.miniChallengeHistory.length) {
      return '<div class="mini-challenge-history"><h5>Registro</h5><p class="mini-challenge-history-empty">Sin eventos completados.</p></div>';
    }

    const items = this.miniChallengeHistory.slice(0, 3).map(entry => {
      const date = new Date(entry.timestamp);
      const time = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
      const rewardTag = entry.reward ? `<span class="mini-challenge-reward">🎁 ${entry.reward}</span>` : '';
      return `<li><span>${entry.label}${rewardTag}</span><span>${time}</span></li>`;
    }).join('');

    return `<div class="mini-challenge-history"><h5>Registro</h5><ul>${items}</ul></div>`;
  }

  updateMiniChallengeProgress() {
    if (!this.activeMiniChallenge || !this.selectedMission) {
      this.renderMiniChallenge();
      return;
    }

    const value = Math.round(this.currentBeing?.attributes?.[this.activeMiniChallenge.attribute] || 0);
    if (!this.activeMiniChallenge.completed && value >= this.activeMiniChallenge.target) {
      this.completeMiniChallenge();
    } else {
      this.renderMiniChallenge();
    }
  }

  completeMiniChallenge() {
    if (!this.activeMiniChallenge || this.activeMiniChallenge.completed) return;

    const attrData = this.missionsSystem?.attributes?.[this.activeMiniChallenge.attribute];
    const label = attrData?.name || 'Evento';

    this.activeMiniChallenge.completed = true;
    this.miniChallengeHistory.unshift({
      id: this.activeMiniChallenge.id,
      label,
      timestamp: new Date().toISOString()
    });

    this.renderMiniChallenge();
    this.showNotification(`⚡ Evento relámpago completado: ${label}`, 'success', 3200);
    this.spawnProgressReward(100, 'Evento');

    if (this.activeMiniChallenge?.attribute) {
      this.rewardSpecialPiece(this.activeMiniChallenge.attribute);
    }

    this._setTimeout(() => this.generateMiniChallenge(true), 3500);
  }

  rewardSpecialPiece(attributeKey) {
    const attrData = this.missionsSystem?.attributes?.[attributeKey];
    if (!attrData) return;

    if (this.selectedPieces.length >= 12) {
      this.showNotification('Inventario lleno: no puedes recibir la pieza especial. Libera un espacio.', 'warning', 4200);
      return;
    }

    const rewardValue = 30 + Math.round(Math.random() * 25);
    const supportAttribute = this.getSupportAttributeForReward(attributeKey);
    const syntheticAttributes = { [attributeKey]: rewardValue };

    if (supportAttribute && this.missionsSystem?.attributes?.[supportAttribute]) {
      syntheticAttributes[supportAttribute] = Math.round(rewardValue * 0.5);
    }

    const rewardPiece = {
      id: `lab-reward-${attributeKey}-${Date.now()}`,
      title: `${attrData.icon || '✨'} Fragmento ${attrData.name}`,
      description: `Pieza especial desbloqueada al completar un evento relámpago centrado en ${attrData.name}.`,
      type: 'special',
      category: 'lab-reward',
      bookId: 'lab-reward',
      chapterId: `evento-${attributeKey}`,
      icon: attrData.icon || '✨',
      dominantAttribute: attributeKey,
      syntheticAttributes,
      rarity: 'legendary',
      source: 'mini-challenge',
      tags: ['recompensa', 'evento'],
      isSpecialReward: true
    };

    this.skipQuizForSpecialReward = true;
    this.togglePieceSelectionEnhanced(rewardPiece);
    this.showNotification(`🎁 Has obtenido ${rewardPiece.title}`, 'success', 3800);

    if (this.miniChallengeHistory.length > 0) {
      this.miniChallengeHistory[0].reward = rewardPiece.title;
      this.renderMiniChallenge();
    }
  }

  getSupportAttributeForReward(attributeKey) {
    const supportMap = {
      empathy: 'communication',
      communication: 'empathy',
      action: 'strategy',
      strategy: 'action',
      reflection: 'analysis',
      analysis: 'reflection',
      resilience: 'organization',
      organization: 'technical',
      creativity: 'collaboration',
      collaboration: 'creativity',
      wisdom: 'consciousness',
      consciousness: 'wisdom',
      connection: 'empathy',
      leadership: 'collaboration',
      technical: 'action'
    };
    return supportMap[attributeKey] || null;
  }

  applyDemoScenario(savedBeing) {
    if (!savedBeing) {
      this.activeDemoScenario = null;
      this.renderDemoScenarioCard();
      return;
    }

    const scenario = window.FrankensteinDemoData?.getDemoScenario?.(savedBeing.id);
    const isDemoMode = typeof window.FrankensteinQuiz?.getMode === 'function'
      ? window.FrankensteinQuiz.getMode() === 'demo'
      : false;

    if (scenario && (isDemoMode || (savedBeing.id && savedBeing.id.toString().startsWith('demo-')))) {
      this.activeDemoScenario = {
        ...scenario,
        beingId: savedBeing.id
      };
    } else {
      this.activeDemoScenario = null;
    }

    this.renderDemoScenarioCard();
  }

  renderDemoScenarioCard() {
    const body = document.getElementById('demo-scenario-body');
    const titleEl = document.getElementById('demo-scenario-title');
    if (!body) return;

    const isDemoMode = typeof window.FrankensteinQuiz?.getMode === 'function'
      ? window.FrankensteinQuiz.getMode() === 'demo'
      : false;

    if (!this.activeDemoScenario) {
      if (titleEl) titleEl.textContent = 'Ruta educativa';
      body.innerHTML = `<p class="empty-card-message">${isDemoMode
        ? 'Carga un ser demo desde la sección “Seres Guardados” para recibir guía educativa.'
        : 'Activa el modo demo para desbloquear rutas educativas con narrativas guiadas.'}</p>`;
      return;
    }

    const scenario = this.activeDemoScenario;
    if (titleEl) {
      titleEl.textContent = scenario.title || 'Recorrido demo';
    }

    const objectives = (scenario.objectives || []).map(obj => {
      const status = this.evaluateScenarioObjective(obj);
      const label = obj.label || status.label || 'Objetivo';
      return `
        <div class="scenario-objective ${status.fulfilled ? 'fulfilled' : ''}">
          <div class="scenario-objective-icon">${status.fulfilled ? '✅' : '⬜'}</div>
          <div>
            <p>${label}</p>
            <small>${status.progressText || ''}</small>
          </div>
        </div>
      `;
    }).join('') || '<p class="empty-card-message">Configura objetivos en FrankensteinDemoData para esta guía.</p>';

    const tips = scenario.tips?.length
      ? `<div class="scenario-tips"><h5>Recomendado</h5><ul>${scenario.tips.map(tip => `<li>${tip}</li>`).join('')}</ul></div>`
      : '';

    body.innerHTML = `
      <p class="scenario-intro">${scenario.intro || 'Explora este ser demo para aprender a ensamblar combinaciones efectivas.'}</p>
      <div class="scenario-objectives">${objectives}</div>
      ${scenario.callToAction ? `<div class="scenario-cta">${scenario.callToAction}</div>` : ''}
      ${tips}
    `;
  }

  evaluateScenarioObjective(objective) {
    if (!objective) {
      return { fulfilled: false, progressText: '', label: 'Objetivo' };
    }

    const type = objective.type || 'attribute';

    if (type === 'attribute') {
      const attrKey = objective.attribute;
      const target = objective.target || objective.value || 0;
      const current = Math.round(this.currentBeing?.attributes?.[attrKey] || 0);
      return {
        fulfilled: current >= target,
        progressText: `${current}/${target}`,
        label: objective.label
      };
    }

    if (type === 'mission') {
      const missionId = objective.missionId || objective.targetMissionId;
      const fulfilled = !!missionId && this.selectedMission?.id === missionId;
      return {
        fulfilled,
        progressText: fulfilled ? 'Misión activa' : 'Activa la misión sugerida',
        label: objective.label
      };
    }

    if (type === 'validation') {
      const fulfilled = !!this.lastValidationResults?.viable;
      return {
        fulfilled,
        progressText: fulfilled ? 'Ser validado' : 'Pendiente de validación',
        label: objective.label
      };
    }

    return {
      fulfilled: false,
      progressText: '',
      label: objective.label
    };
  }

  updateDemoScenarioProgress() {
    if (!this.activeDemoScenario) return;
    this.renderDemoScenarioCard();
  }

  renderMicrosocietyCard() {
    const body = document.getElementById('microsociety-body');
    const titleEl = document.getElementById('microsociety-title');
    if (!body) return;

    if (this.microSocietySnapshot) {
      const snap = this.microSocietySnapshot;
      if (titleEl) titleEl.textContent = snap.name || 'Microsociedad';
      const metrics = snap.metrics || {};
      const eventsMarkup = this.microSocietyEvents.map(event => `
        <button class="micro-event-btn" data-event="${event.id}">
          <span>${event.label}</span>
          <small>${event.description}</small>
        </button>
      `).join('');
      const historyMarkup = this.microEventHistory.length
        ? this.microEventHistory.slice(0, 3).map(entry => `
            <div class="micro-event-history-item">
              <strong>${entry.label}</strong>
              <p>${entry.description}</p>
              <small>${new Date(entry.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</small>
            </div>
          `).join('')
        : '<p class="micro-event-empty">Aún no hay eventos dinámicos.</p>';

      body.innerHTML = `
        <div class="microsociety-meta">
          <div class="microsociety-meta-item">
            <span>Seres</span>
            <strong>${snap.beingsCount || snap.beings?.length || 0}</strong>
          </div>
          <div class="microsociety-meta-item">
            <span>Última actualización</span>
            <strong>${new Date(snap.updatedAt || Date.now()).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</strong>
          </div>
        </div>
        <div class="microsociety-metrics">
          <div class="micro-metric"><span>❤️ Salud</span><strong>${metrics.health ?? '--'}</strong></div>
          <div class="micro-metric"><span>📚 Conocimiento</span><strong>${metrics.knowledge ?? '--'}</strong></div>
          <div class="micro-metric"><span>⚡ Acción</span><strong>${metrics.action ?? '--'}</strong></div>
          <div class="micro-metric"><span>🤝 Cohesión</span><strong>${metrics.cohesion ?? '--'}</strong></div>
        </div>
        <div class="micro-event-panel">
          <h4>Eventos rápidos</h4>
          <div class="micro-event-buttons">
            ${eventsMarkup}
          </div>
          <div class="micro-event-history">
            ${historyMarkup}
          </div>
        </div>
        <p class="microsociety-hint">Pulsa “Simular” para abrir el gestor completo o “Crear” para generar otra variante con este ser.</p>
      `;
      this.wireMicroEventButtons();
      return;
    }

    const demoAvailable = window.FrankensteinDemoData?.getDemoMicrosocieties;
    if (titleEl) titleEl.textContent = 'Sin simulación';
    body.innerHTML = `
      <p class="empty-card-message">Crea una microsociedad con tu ser (botón “Crear”) y revisa cómo responden sus atributos a eventos.</p>
      ${demoAvailable ? `<button class="micro-action secondary" id="btn-demo-microsociety">Ver demo</button>` : ''}
    `;

    const demoBtn = document.getElementById('btn-demo-microsociety');
    if (demoBtn) {
      demoBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.previewDemoMicrosociety();
      });
    }
  }

  wireMicroEventButtons() {
    const body = document.getElementById('microsociety-body');
    if (!body) return;

    body.querySelectorAll('.micro-event-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.triggerMicroEvent(btn.dataset.event);
      });
    });
  }

  triggerMicroEvent(eventId) {
    if (!this.microSocietySnapshot) return;
    const event = this.microSocietyEvents.find(evt => evt.id === eventId);
    if (!event) return;

    const metrics = this.microSocietySnapshot.metrics || {};
    Object.entries(event.deltas || {}).forEach(([key, delta]) => {
      const current = metrics[key] ?? 50;
      metrics[key] = Math.min(100, Math.max(0, current + delta));
    });
    this.microSocietySnapshot.metrics = metrics;
    this.microSocietySnapshot.updatedAt = new Date().toISOString();

    this.microEventHistory.unshift({
      label: event.label,
      description: event.description,
      timestamp: Date.now()
    });
    if (this.microEventHistory.length > 5) {
      this.microEventHistory.pop();
    }

    this.showNotification(`🎯 Evento: ${event.label}`, 'success', 2500);
    this.renderMicrosocietyCard();
  }

  previewDemoMicrosociety() {
    const demoSocieties = window.FrankensteinDemoData?.getDemoMicrosocieties?.();
    if (!demoSocieties || demoSocieties.length === 0) {
      this.showNotification('⚠️ No hay microsociedades demo disponibles.', 'warning');
      return;
    }
    const random = demoSocieties[Math.floor(Math.random() * demoSocieties.length)];
    this.microSocietySnapshot = {
      name: random.name || 'Microsociedad Demo',
      metrics: this.estimateMicrosocietyMetrics(random.beings || []),
      beingsCount: random.beings?.length || 0,
      updatedAt: new Date().toISOString()
    };
    this.renderMicrosocietyCard();
    this.showNotification('✨ Mostrando microsociedad demo. Usa “Simular” para explorar más.', 'info', 4000);
  }

  estimateMicrosocietyMetrics(beings = []) {
    const safeBeings = (beings && beings.length > 0) ? beings : (this.currentBeing ? [this.currentBeing] : []);
    if (safeBeings.length === 0) {
      return { health: '--', knowledge: '--', action: '--', cohesion: '--' };
    }

    const averageAttr = (attr) => {
      const sum = safeBeings.reduce((acc, being) => acc + (being.attributes?.[attr] || being[attr] || 0), 0);
      return sum / safeBeings.length;
    };

    return {
      health: Math.round((averageAttr('resilience') + averageAttr('organization')) / 2 || 60),
      knowledge: Math.round((averageAttr('wisdom') + averageAttr('analysis')) / 2 || 50),
      action: Math.round((averageAttr('action') + averageAttr('strategy')) / 2 || 50),
      cohesion: Math.round((averageAttr('empathy') + averageAttr('communication')) / 2 || 60)
    };
  }

  updateMissionProgressUI({ fulfilled = 0, total = 0 } = {}) {
    this.missionProgress = { fulfilled, total };
    const percent = total > 0 ? Math.round((fulfilled / total) * 100) : 0;

    const ring = this.domCache.missionProgressRing || document.getElementById('mission-progress-ring');
    if (ring) {
      ring.style.setProperty('--progress', percent);
    }

    const percentEl = this.domCache.missionProgressPercent || document.getElementById('mission-progress-percent');
    if (percentEl) {
      percentEl.textContent = `${percent}%`;
    }

    const statusEl = this.domCache.missionProgressStatus || document.getElementById('mission-progress-status');
    if (statusEl) {
      statusEl.textContent = total > 0 ? `${fulfilled}/${total}` : '--';
    }

    const fillEl = this.domCache.missionProgressFillRing || document.getElementById('mission-progress-fill');
    if (fillEl) {
      fillEl.style.width = `${percent}%`;
    }

    const hintEl = this.domCache.missionProgressHint || document.getElementById('mission-progress-hint');
    if (hintEl) {
      if (!this.selectedMission) {
        hintEl.textContent = 'Selecciona una misión para desbloquear recompensas.';
      } else if (total === 0) {
        hintEl.textContent = 'Esta misión no tiene requisitos definidos.';
      } else if (percent >= 100) {
        hintEl.textContent = 'Valida el ser para reclamar esta misión.';
      } else {
        hintEl.textContent = `Completa ${total - fulfilled} objetivo(s) más para avanzar.`;
      }
    }

    const rewardIcons = document.querySelectorAll('.mission-reward-icon');
    rewardIcons.forEach(icon => {
      const threshold = Number(icon.dataset.threshold || 0);
      if (percent >= threshold) {
        icon.classList.add('active');
      } else {
        icon.classList.remove('active');
      }
    });
  }

  /**
   * Check if requirement is fulfilled
   */
  isRequirementFulfilled(req) {
    if (!req) return false;

    const target = this.getRequirementTarget(req) || 1;

    if (req.type === 'power') {
      return this.getRequirementCurrentValue(req) >= target;
    }

    if (this.missionsSystem?.attributes?.[req.type]) {
      return this.getRequirementCurrentValue(req) >= target;
    }

    const selectedByType = this.selectedPieces.filter(p => p.type === req.type);
    return selectedByType.length >= target;
  }

  /**
   * Check if requirement has conflict
   */
  hasRequirementConflict(req) {
    if (this.missionsSystem?.attributes?.[req.type] || req.type === 'power') {
      return false;
    }

    // Detectar conflictos (ej: demasiadas piezas de un tipo)
    const selectedByType = this.selectedPieces.filter(p => p.type === req.type);
    const maxCount = req.maxCount || Infinity;
    return selectedByType.length > maxCount;
  }

  /**
   * Count fulfilled requirements
   */
  countFulfilledRequirements(requirements) {
    return requirements.filter(req => this.isRequirementFulfilled(req)).length;
  }

  /**
   * Calculate current power
   */
  calculateCurrentPower() {
    if (this.currentBeing?.totalPower) {
      return this.currentBeing.totalPower;
    }

    if (!this.missionsSystem) {
      return this.selectedPieces.reduce((total, piece) => {
        const power = piece.power || this.getPiecePower(piece.type);
        return total + power;
      }, 0);
    }

    return this.selectedPieces.reduce((total, piece) => {
      const analysis = this.missionsSystem.analyzePiece(piece);
      return total + (analysis.totalPower || this.getPiecePower(piece.type));
    }, 0);
  }

  /**
   * Get piece power by type
   */
  getPiecePower(type) {
    const powers = {
      chapter: 25,
      exercise: 40,
      resource: 35
    };
    return powers[type] || 20;
  }

  /**
   * Search Pieces
   */
  searchPieces(query) {
    const normalizedQuery = query.toLowerCase().trim();

    if (!normalizedQuery) {
      // Si no hay búsqueda, mostrar todas las piezas según filtro activo
      const activeFilter = document.querySelector('.filter-pill.active');
      const filter = activeFilter ? activeFilter.dataset.filter : 'all';
      this.populatePiecesGrid(filter);
      return;
    }

    // Filtrar piezas que coincidan con la búsqueda
    const filtered = this.availablePieces.filter(piece => {
      const title = piece.title.toLowerCase();
      const bookTitle = piece.bookTitle.toLowerCase();
      const category = (piece.category || '').toLowerCase();

      return title.includes(normalizedQuery) ||
             bookTitle.includes(normalizedQuery) ||
             category.includes(normalizedQuery);
    });

    this.renderFilteredPieces(filtered);
  }

  /**
   * Render Filtered Pieces
   */
  renderFilteredPieces(pieces) {
    const grid = document.getElementById('pieces-grid');
    if (!grid) return;

    grid.innerHTML = '';

    if (pieces.length === 0) {
      grid.innerHTML = '<p class="no-results">No se encontraron piezas</p>';
      return;
    }

    // Organize filtered pieces by book
    const piecesByBook = {};
    pieces.forEach(piece => {
      if (!piecesByBook[piece.bookId]) {
        piecesByBook[piece.bookId] = {
          bookTitle: piece.bookTitle,
          bookId: piece.bookId,
          color: piece.color,
          chapters: {}
        };
      }

      if (!piecesByBook[piece.bookId].chapters[piece.chapterId]) {
        piecesByBook[piece.bookId].chapters[piece.chapterId] = {
          chapterTitle: this.getChapterTitle(piece),
          pieces: []
        };
      }

      piecesByBook[piece.bookId].chapters[piece.chapterId].pieces.push(piece);
    });

    // Create tree for each book
    Object.entries(piecesByBook).forEach(([bookId, bookData]) => {
      const bookTree = this.createBookTree(bookId, bookData);
      grid.appendChild(bookTree);
    });

    // Update pieces count badge
    this.updatePiecesCountBadge();
  }

  /**
   * Filter pieces by attribute they provide
   */
  filterPiecesByAttribute(attribute) {
    if (!this.missionsSystem) return;

    // Filter pieces that provide the specified attribute
    const filtered = this.availablePieces.filter(piece => {
      const analysis = this.missionsSystem.analyzePiece(piece);
      return analysis.attributes[attribute] && analysis.attributes[attribute] > 0;
    });

    // Sort by attribute value (highest first)
    filtered.sort((a, b) => {
      const analysisA = this.missionsSystem.analyzePiece(a);
      const analysisB = this.missionsSystem.analyzePiece(b);
      const valueA = analysisA.attributes[attribute] || 0;
      const valueB = analysisB.attributes[attribute] || 0;
      return valueB - valueA;
    });

    const grid = document.getElementById('pieces-grid');
    if (!grid) return;

    // Clear grid
    grid.innerHTML = '';

    // Show filter info message
    if (filtered.length > 0) {
      const attrData = this.missionsSystem.attributes[attribute];
      const attrName = attrData ? `${attrData.icon} ${attrData.name}` : attribute;

      const filterInfo = document.createElement('div');
      filterInfo.className = 'filter-info';
      filterInfo.innerHTML = `
        Mostrando ${filtered.length} piezas que aportan <strong>${attrName}</strong>
        <button class="clear-filter-btn" onclick="window.frankensteinLabUI.populatePiecesGrid('all')">
          ✕ Limpiar filtro
        </button>
      `;
      grid.appendChild(filterInfo);
    }

    // Organize filtered pieces by book and render them
    const piecesByBook = {};
    filtered.forEach(piece => {
      if (!piecesByBook[piece.bookId]) {
        piecesByBook[piece.bookId] = {
          bookTitle: piece.bookTitle,
          bookId: piece.bookId,
          color: piece.color,
          chapters: {}
        };
      }

      if (!piecesByBook[piece.bookId].chapters[piece.chapterId]) {
        piecesByBook[piece.bookId].chapters[piece.chapterId] = {
          chapterTitle: this.getChapterTitle(piece),
          pieces: []
        };
      }

      piecesByBook[piece.bookId].chapters[piece.chapterId].pieces.push(piece);
    });

    // Create tree for each book
    Object.entries(piecesByBook).forEach(([bookId, bookData]) => {
      const bookTree = this.createBookTree(bookId, bookData);
      grid.appendChild(bookTree);
    });

    // Update pieces count badge
    this.updatePiecesCountBadge();

    // Initialize drag and drop
    this._setTimeout(() => {
      this.initDragAndDropEnhanced();
    }, 100);
  }

  /**
   * Update Pieces Count Badge
   */
  updatePiecesCountBadge() {
    const badge = document.getElementById('pieces-count-badge');
    if (badge) {
      const activeFilter = document.querySelector('.filter-pill.active');
      const filter = activeFilter ? activeFilter.dataset.filter : 'all';

      let count = this.availablePieces.length;
      if (filter !== 'all') {
        count = this.availablePieces.filter(p => p.type === filter).length;
      }

      badge.textContent = count;
    }
  }

  /**
   * Show Confetti Animation
   */
  showConfetti() {
    // Simple confetti effect using CSS
    const confettiContainer = document.createElement('div');
    confettiContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 9999;
    `;

    const colors = ['#d4af37', '#b87333', '#8b7355', '#ffd700'];
    const confettiCount = 50;

    for (let i = 0; i < confettiCount; i++) {
      const confetti = document.createElement('div');
      confetti.style.cssText = `
        position: absolute;
        width: 10px;
        height: 10px;
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        left: ${Math.random() * 100}%;
        top: -10px;
        opacity: 1;
        transform: rotate(${Math.random() * 360}deg);
        animation: confetti-fall ${2 + Math.random() * 2}s linear forwards;
      `;
      confettiContainer.appendChild(confetti);
    }

    document.body.appendChild(confettiContainer);

    this._setTimeout(() => {
      confettiContainer.remove();
    }, 4000);

    // Add confetti animation if not exists
    if (!document.getElementById('confetti-animation-style')) {
      const style = document.createElement('style');
      style.id = 'confetti-animation-style';
      style.textContent = `
        @keyframes confetti-fall {
          to {
            top: 100%;
            opacity: 0;
            transform: translateY(100vh) rotate(720deg);
          }
        }
      `;
      document.head.appendChild(style);
    }
  }

  /**
   * ========================================
   * PHASE 2 - VISUAL FEEDBACK AVANZADO
   * ========================================
   */

  /**
   * Animate piece flying to target (FLIP technique)
   */
  animatePieceToTarget(pieceElement, targetElement) {
    // Get positions
    const pieceRect = pieceElement.getBoundingClientRect();
    const targetRect = targetElement.getBoundingClientRect();

    // Create flying clone
    const clone = pieceElement.cloneNode(true);
    clone.classList.add('piece-flying');
    clone.style.position = 'fixed';
    clone.style.left = `${pieceRect.left}px`;
    clone.style.top = `${pieceRect.top}px`;
    clone.style.width = `${pieceRect.width}px`;
    clone.style.height = `${pieceRect.height}px`;
    clone.style.zIndex = '9999';

    document.body.appendChild(clone);

    // Calculate trajectory
    const deltaX = targetRect.left + (targetRect.width / 2) - (pieceRect.left + (pieceRect.width / 2));
    const deltaY = targetRect.top + (targetRect.height / 2) - (pieceRect.top + (pieceRect.height / 2));

    // Create trail particles
    this.createFlightTrail(pieceRect, targetRect);

    // Animate using FLIP
    const animation = clone.animate([
      {
        transform: 'translate(0, 0) scale(1) rotate(0deg)',
        opacity: 1
      },
      {
        transform: `translate(${deltaX}px, ${deltaY}px) scale(0.5) rotate(360deg)`,
        opacity: 0.3
      }
    ], {
      duration: 600,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
    });

    animation.onfinish = () => {
      clone.remove();
      // Trigger particle burst at target
      this.createParticleBurst(targetElement);
      // Flash target
      targetElement.classList.add('drop-success');
      this._setTimeout(() => targetElement.classList.remove('drop-success'), 400);
    };
  }

  /**
   * Create flight trail particles
   */
  createFlightTrail(startRect, endRect) {
    const trailCount = 15;
    const duration = 600; // Same as flight animation

    for (let i = 0; i < trailCount; i++) {
      this._setTimeout(() => {
        const trail = document.createElement('div');
        trail.classList.add('flight-trail');

        // Interpolate position
        const progress = i / trailCount;
        const x = startRect.left + (endRect.left - startRect.left) * progress;
        const y = startRect.top + (endRect.top - startRect.top) * progress;

        trail.style.left = `${x}px`;
        trail.style.top = `${y}px`;
        trail.style.background = `rgba(212, 175, 55, ${1 - progress})`;

        document.body.appendChild(trail);

        this._setTimeout(() => trail.remove(), 800);
      }, (duration / trailCount) * i);
    }
  }

  /**
   * Create particle burst effect
   */
  createParticleBurst(element, options = {}) {
    const {
      particleCount = 20,
      colors = ['#d4af37', '#b87333', '#ffd700', '#e0f7ff'],
      types = ['circle', 'star', 'energy'],
      duration = 1000
    } = options;

    const rect = element.getBoundingClientRect();
    const centerX = rect.left + (rect.width / 2);
    const centerY = rect.top + (rect.height / 2);

    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');

      // Random type
      const type = types[Math.floor(Math.random() * types.length)];
      particle.classList.add('particle');

      if (type === 'star') {
        particle.classList.add('particle-star');
      } else if (type === 'energy') {
        particle.classList.add('particle-energy');
      } else {
        particle.style.background = colors[Math.floor(Math.random() * colors.length)];
      }

      // Random trajectory
      const angle = (Math.PI * 2 * i) / particleCount;
      const velocity = 50 + Math.random() * 100;
      const tx = Math.cos(angle) * velocity;
      const ty = Math.sin(angle) * velocity;

      particle.style.left = `${centerX}px`;
      particle.style.top = `${centerY}px`;
      particle.style.setProperty('--tx', `${tx}px`);
      particle.style.setProperty('--ty', `${ty}px`);

      // Random animation duration
      const animDuration = duration + (Math.random() * 500 - 250);
      particle.style.animation = type === 'star'
        ? `particle-star-burst ${animDuration}ms ease-out forwards`
        : type === 'energy'
        ? `particle-energy-burst ${animDuration}ms ease-out forwards`
        : `particle-burst ${animDuration}ms ease-out forwards`;

      document.body.appendChild(particle);

      this._setTimeout(() => particle.remove(), animDuration);
    }

    // Play sound if available
    this.playSelectionSound();

    // Haptic feedback
    this.triggerHaptic('medium');
  }

  /**
   * Create selection ripple effect
   */
  createSelectionRipple(element) {
    const ripple = document.createElement('div');
    ripple.classList.add('selection-ripple');

    const rect = element.getBoundingClientRect();
    ripple.style.left = `${rect.left + rect.width / 2}px`;
    ripple.style.top = `${rect.top + rect.height / 2}px`;
    ripple.style.marginLeft = '0';
    ripple.style.marginTop = '0';

    document.body.appendChild(ripple);

    this._setTimeout(() => ripple.remove(), 600);
  }

  /**
   * Trigger haptic feedback (mobile)
   */
  triggerHaptic(intensity = 'medium') {
    if (!navigator.vibrate) return;

    const patterns = {
      light: [10],
      medium: [20],
      heavy: [30],
      success: [10, 50, 10],
      error: [20, 100, 20, 100, 20]
    };

    navigator.vibrate(patterns[intensity] || patterns.medium);
  }

  /**
   * Play selection sound
   */
  playSelectionSound() {
    // Usar FrankensteinAudioSystem si está disponible y habilitado
    if (window.frankenAudio && window.frankenAudio.enabled) {
      window.frankenAudio.playElectricity();
      return;
    }

    // Fallback: usar el ping básico si FrankensteinAudioSystem no está disponible
    if (!window.AudioContext && !window.webkitAudioContext) return;

    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();

      // Create oscillator for "ping" sound
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800; // High pitch
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);

      // 🔧 FIX #61: Cerrar AudioContext después del sonido para prevenir memory leak
      this._setTimeout(() => {
        audioContext.close();
      }, 150); // 50ms después de que termina el sonido
    } catch (e) {
      // Silently fail if audio doesn't work
    }
  }

  /**
   * Enhanced toggle piece selection with animations
   */
  async togglePieceSelectionEnhanced(piece, card) {
    const targetCard = card || document.querySelector(`.piece-card[data-piece-id="${piece.id}"]`) || document.querySelector(`.mobile-piece-card[data-piece-id="${piece.id}"]`);
    const isSelecting = targetCard ? !targetCard.classList.contains('selected') : !this.isPieceSelected(piece.id);

    if (isSelecting) {
      // Máximo 12 piezas
      if (this.selectedPieces.length >= 12) {
        this.showNotification('Máximo 12 piezas para un ser', 'warning');
        return;
      }

      const bypassQuiz = this.skipQuizForSpecialReward;
      this.skipQuizForSpecialReward = false;

      // EN MODO JUEGO: Mostrar quiz antes de añadir pieza
      if (!bypassQuiz) {
        if (window.FrankensteinQuiz) {
          const currentMode = window.FrankensteinQuiz.getMode();
          logger.log(`[FrankensteinUI] Quiz mode: ${currentMode}, piece: ${piece.title} (${piece.bookId}/${piece.chapterId})`);

          if (currentMode === 'juego') {
            try {
              logger.log(`[FrankensteinUI] Showing quiz for ${piece.bookId}/${piece.chapterId}`);
              const quizResult = await window.FrankensteinQuiz.showQuizModal(
                piece,
                piece.bookId,
                piece.chapterId
              );

              logger.log(`[FrankensteinUI] Quiz result:`, quizResult);

              // Si el usuario canceló el quiz, no añadir la pieza
              if (quizResult.cancelled) {
                logger.log(`[FrankensteinUI] Quiz cancelled, not adding piece`);
                return;
              }

              if (!quizResult.skipped) {
                // Aplicar multiplicador de poder a la pieza
                piece.powerMultiplier = quizResult.powerMultiplier;

                // Guardar resultado del quiz
                piece.quizScore = quizResult.correctCount;
                piece.quizTotal = quizResult.totalQuestions;

                // Dar recompensas por completar quiz
                if (window.frankensteinRewards) {
                  const isPerfect = quizResult.correctCount === quizResult.totalQuestions;
                  if (isPerfect) {
                    window.frankensteinRewards.giveReward('perfectQuiz', quizResult.powerMultiplier);
                  } else {
                    window.frankensteinRewards.giveReward('completeQuiz', quizResult.powerMultiplier);
                  }
                }
              }
            } catch (error) {
              logger.error('[FrankensteinUI] Error en quiz:', error);
              // Si hay error, no añadir la pieza
              return;
            }
          } else {
            logger.log(`[FrankensteinUI] Skipping quiz - mode is "${currentMode}"`);
          }
        } else {
          logger.warn('[FrankensteinUI] FrankensteinQuiz not available');
        }
      } else {
        logger.log('[FrankensteinUI] Añadiendo pieza especial sin quiz.');
      }

      // Solo ejecutar animaciones si el quiz fue exitoso o no hay quiz
      // Create ripple effect
      if (targetCard) {
        this.createSelectionRipple(targetCard);
      }

      // Particle burst
      this._setTimeout(() => {
        if (!targetCard) return;
        this.createParticleBurst(targetCard, {
          particleCount: 12,
          types: ['circle', 'energy'],
          duration: 800
        });
      }, 100);

      // If there's a vitruvian being, animate to it
      const vitruvianContainer = document.getElementById('vitruvian-being-container');
      if (vitruvianContainer) {
        this._setTimeout(() => {
          if (targetCard) {
            this.animatePieceToTarget(targetCard, vitruvianContainer);
          }
        }, 200);
      }

      // Show Vitruvian popup after animation completes
      this._setTimeout(() => {
        this.showVitruvianPopup(piece);
      }, 800);

      // Añadir pieza
      if (targetCard) {
        targetCard.classList.add('selected');
      }
      this.selectedPieces.push(piece);

      // Trackear pieza para estadísticas de recompensas
      if (window.frankensteinRewards) {
        window.frankensteinRewards.trackPieceUsed();
      }

      // Disparar partículas de energía si el sistema está disponible
      if (window.energyParticles && targetCard) {
        window.energyParticles.createSelectionEffect(targetCard);
      }

      // Pulso de energía en el Hombre de Vitrubio
      if (this.vitruvianBeing && piece.dominantAttribute) {
        this.vitruvianBeing.pulseEnergy(piece.dominantAttribute);
      }

      // Actualizar display del ser
      this.updateBeingFromPieces();

      // Update requirements panel
      this.updateRequirementsPanel();

      this.saveLabState();
    } else {
      // Deselección
      this.triggerHaptic('light');
      if (targetCard) {
        targetCard.classList.add('shake');
        this._setTimeout(() => targetCard.classList.remove('shake'), 500);
        targetCard.classList.remove('selected');
      }
      this.selectedPieces = this.selectedPieces.filter(p => p.id !== piece.id);

      // Actualizar display del ser
      this.updateBeingFromPieces();
      // Update requirements panel
      this.updateRequirementsPanel();

      this.saveLabState();
    }
  }

  /**
   * Add glow to compatible slots
   */
  highlightCompatibleSlots(pieceType) {
    const slots = document.querySelectorAll('.vitruvian-slot');

    slots.forEach(slot => {
      // Remove previous states
      slot.classList.remove('compatible', 'incompatible', 'empty');

      const slotType = slot.dataset.type;

      if (!slotType) {
        slot.classList.add('empty');
      } else if (this.isSlotCompatible(slotType, pieceType)) {
        slot.classList.add('compatible');
      } else {
        slot.classList.add('incompatible');
      }
    });
  }

  /**
   * Clear slot highlights
   */
  clearSlotHighlights() {
    const slots = document.querySelectorAll('.vitruvian-slot');
    slots.forEach(slot => {
      slot.classList.remove('compatible', 'incompatible', 'empty');
    });
  }

  /**
   * Check if slot is compatible with piece type
   */
  isSlotCompatible(slotType, pieceType) {
    // Basic compatibility logic - extend as needed
    const compatibility = {
      head: ['chapter', 'resource'],
      heart: ['exercise', 'chapter'],
      arms: ['resource', 'exercise'],
      core: ['chapter'],
      legs: ['exercise', 'resource']
    };

    return compatibility[slotType]?.includes(pieceType) || false;
  }

  /**
   * Initialize drag and drop enhanced
   */
  initDragAndDropEnhanced() {
    const pieces = document.querySelectorAll('.piece-card');

    pieces.forEach(piece => {
      piece.setAttribute('draggable', 'true');

      piece.addEventListener('dragstart', (e) => {
        piece.classList.add('dragging');
        const pieceData = this.getPieceData(piece);

        // Highlight compatible slots
        if (pieceData) {
          this.highlightCompatibleSlots(pieceData.type);
        }

        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', piece.id);

        // Create custom drag image
        const clone = piece.cloneNode(true);
        clone.classList.add('drag-clone');
        clone.style.position = 'absolute';
        clone.style.top = '-1000px';
        document.body.appendChild(clone);
        e.dataTransfer.setDragImage(clone, clone.offsetWidth / 2, clone.offsetHeight / 2);

        this._setTimeout(() => clone.remove(), 0);
      });

      piece.addEventListener('dragend', (e) => {
        piece.classList.remove('dragging');
        this.clearSlotHighlights();
      });
    });

    // Setup drop zones
    const dropZones = document.querySelectorAll('.vitruvian-slot, .being-display');

    dropZones.forEach(zone => {
      zone.addEventListener('dragover', (e) => {
        e.preventDefault();
        zone.classList.add('drop-zone-active');
      });

      zone.addEventListener('dragleave', (e) => {
        zone.classList.remove('drop-zone-active');
      });

      zone.addEventListener('drop', (e) => {
        e.preventDefault();
        zone.classList.remove('drop-zone-active');

        const pieceId = e.dataTransfer.getData('text/plain');
        const piece = document.getElementById(pieceId);

        if (piece) {
          // Animate piece to zone
          this.animatePieceToTarget(piece, zone);

          // Add piece to being
          const pieceData = this.getPieceData(piece);
          if (pieceData) {
            this._setTimeout(() => {
              this.togglePieceSelectionEnhanced(pieceData, piece);
            }, 300);
          }
        }
      });
    });
  }

  /**
   * Get piece data from DOM element
   */
  getPieceData(element) {
    const pieceId = element.dataset.pieceId;
    if (!pieceId) return null;

    return this.availablePieces.find(p => p.id === pieceId);
  }

  /**
   * ========================================
   * PHASE 3 - SMART FILTERS & TOOLTIPS
   * ========================================
   */

  /**
   * Filter compatible pieces based on current requirements
   */
  filterCompatiblePieces() {
    if (!this.selectedMission) {
      this.showNoMissionAlert();
      return;
    }

    const requirements = this.getCurrentMissionRequirements();
    const compatible = this.getCompatiblePieces(requirements);

    if (compatible.length === 0) {
      this.showEmptyCompatibleState();
    } else {
      this.renderFilteredPieces(compatible);
      this.showSmartSuggestions(compatible, requirements);
    }
  }

  /**
   * Get compatible pieces based on requirements
   */
  getCompatiblePieces(requirements) {
    if (!this.missionsSystem) return [];

    const needed = this.getMissingRequirements(requirements);
    if (needed.length === 0) return [];

    return this.availablePieces.filter(piece => {
      // Check if already selected
      const alreadySelected = this.selectedPieces.find(p => p.id === piece.id);
      if (alreadySelected) return false;

      const analysis = this.missionsSystem.analyzePiece(piece);

      const helpsRequirement = needed.some(req => {
        if (this.missionsSystem.attributes[req.type]) {
          return (analysis.attributes[req.type] || 0) > 0;
        }
        return req.type === piece.type;
      });

      if (!helpsRequirement) return false;

      // Check power threshold
      const piecePower = analysis.totalPower || piece.power || this.getPiecePower(piece.type);
      const currentPower = this.calculateCurrentPower();
      const requiredPower = this.selectedMission?.minPower || 0;

      // Prefer pieces that help reach power goal
      const powerNeeded = requiredPower - currentPower;
      if (powerNeeded > 0 && piecePower < powerNeeded * 0.2) {
        return false; // Too weak to be useful
      }

      return true;
    });
  }

  /**
   * Get missing requirements
   */
  getMissingRequirements(requirements) {
    return requirements.filter(req => !this.isRequirementFulfilled(req));
  }

  /**
   * Show smart suggestions panel
   */
  showSmartSuggestions(compatiblePieces, requirements) {
    // Remove existing suggestions
    const existing = document.querySelector('.smart-suggestions');
    if (existing) existing.remove();

    // Get top 3 suggestions
    const topSuggestions = this.getTopSuggestions(compatiblePieces, requirements);

    if (topSuggestions.length === 0) return;

    // Create suggestions panel
    const panel = document.createElement('div');
    panel.classList.add('smart-suggestions', 'active');

    panel.innerHTML = `
      <div class="suggestions-header">
        💡 Sugerencias Inteligentes
      </div>
      <div class="suggestions-list">
        ${topSuggestions.map((suggestion, index) => `
          <div class="suggestion-item" data-piece-id="${suggestion.piece.id}">
            <span class="suggestion-icon">${this.getTypeIcon(suggestion.piece.type)}</span>
            <span class="suggestion-text">${suggestion.reason}</span>
            <span class="suggestion-badge">+${suggestion.piece.power || this.getPiecePower(suggestion.piece.type)}⚡</span>
          </div>
        `).join('')}
      </div>
    `;

    // Insert before pieces grid
    const grid = document.getElementById('pieces-grid');
    if (grid && grid.parentElement) {
      grid.parentElement.insertBefore(panel, grid);
    }

    // Attach click listeners
    panel.querySelectorAll('.suggestion-item').forEach(item => {
      item.addEventListener('click', () => {
        const pieceId = item.dataset.pieceId;
        const piece = this.availablePieces.find(p => p.id === pieceId);
        if (piece) {
          // Find card and trigger selection
          const card = document.querySelector(`.piece-card[data-piece-id="${pieceId}"]`);
          if (card) {
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            this._setTimeout(() => {
              card.classList.add('bounce');
              this._setTimeout(() => card.classList.remove('bounce'), 600);
            }, 300);
          }
        }
      });
    });
  }

  /**
   * Get top suggestions based on requirements and strategy
   */
  getTopSuggestions(compatiblePieces, requirements) {
    if (!this.missionsSystem) return [];

    const suggestions = [];
    const missing = this.getMissingRequirements(requirements);
    const analyzedPieces = compatiblePieces.map(piece => ({
      piece,
      analysis: this.missionsSystem.analyzePiece(piece)
    }));

    const getEntryPower = (entry) =>
      entry.analysis.totalPower || entry.piece.power || this.getPiecePower(entry.piece.type);

    missing.forEach(req => {
      let candidates = [];

      if (this.missionsSystem.attributes[req.type]) {
        candidates = analyzedPieces
          .filter(entry => (entry.analysis.attributes[req.type] || 0) > 0)
          .sort((a, b) => (b.analysis.attributes[req.type] || 0) - (a.analysis.attributes[req.type] || 0));
      } else {
        candidates = analyzedPieces
          .filter(entry => entry.piece.type === req.type)
          .sort((a, b) => getEntryPower(b) - getEntryPower(a));
      }

      if (candidates.length === 0) return;

      const best = candidates[0];
      suggestions.push({
        piece: best.piece,
        reason: this.getSuggestionReason(best.piece, req, best.analysis),
        priority: this.getSuggestionPriority(best.piece, req, best.analysis)
      });
    });

    // Sort by priority and return top 3
    return suggestions
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 3);
  }

  /**
   * Get suggestion reason text
   */
  getSuggestionReason(piece, requirement, analysis) {
    if (this.missionsSystem?.attributes?.[requirement.type] && analysis) {
      const attrData = this.missionsSystem.attributes[requirement.type];
      const boost = Math.round(analysis.attributes[requirement.type] || 0);
      return `${attrData.icon} +${boost} ${attrData.name}`;
    }

    return `${piece.title.substring(0, 40)}${piece.title.length > 40 ? '...' : ''}`;
  }

  /**
   * Get suggestion priority score
   */
  getSuggestionPriority(piece, requirement, analysis) {
    let score = 0;

    // Higher power = higher priority
    const power = (analysis?.totalPower) || piece.power || this.getPiecePower(piece.type);
    score += power;

    if (this.missionsSystem?.attributes?.[requirement.type] && analysis) {
      const target = this.getRequirementTarget(requirement) || 0;
      const current = this.getRequirementCurrentValue(requirement);
      const boost = analysis.attributes[requirement.type] || 0;
      const deficit = Math.max(0, target - current);
      score += boost * 2;

      if (deficit > 0) {
        const coverage = Math.min(1, boost / deficit);
        score += coverage * 150;
      }
    } else {
      // Needed type = bonus
      score += 50;
    }

    // Current power deficit
    const currentPower = this.calculateCurrentPower();
    const requiredPower = this.selectedMission?.minPower || 0;
    const deficit = requiredPower - currentPower;

    if (deficit > 0 && power >= deficit * 0.5) {
      score += 100; // Big bonus if piece can close the gap
    }

    return score;
  }

  /**
   * Get type icon
   */
  getTypeIcon(type) {
    const icons = {
      chapter: '📖',
      exercise: '⚡',
      resource: '🔧'
    };
    return icons[type] || '📦';
  }

  /**
   * Show empty compatible state
   */
  showEmptyCompatibleState() {
    const grid = document.getElementById('pieces-grid');
    if (!grid) return;

    grid.innerHTML = `
      <div class="empty-compatible">
        <div class="empty-compatible-icon">✨</div>
        <div class="empty-compatible-title">¡Ya tienes todas las piezas compatibles!</div>
        <div class="empty-compatible-text">
          Has seleccionado todas las piezas que cumplen con los requisitos actuales.
        </div>
        <div class="empty-compatible-suggestion">
          💡 Intenta con "Todas" para ver más opciones o completa la misión actual.
        </div>
      </div>
    `;
  }

  /**
   * Show no mission alert
   */
  showNoMissionAlert() {
    this.showNotification('⚠️ Primero selecciona una misión para ver piezas compatibles', 'warning');

    // Switch back to "all" filter
    const allFilter = document.querySelector('.filter-pill[data-filter="all"]');
    if (allFilter) {
      document.querySelectorAll('.filter-pill').forEach(btn => btn.classList.remove('active'));
      allFilter.classList.add('active');
    }
  }

  /**
   * Handle scroll in pieces modal to show/hide sticky header
   */
  handlePiecesModalScroll() {
    const modalBody = document.querySelector('.pieces-modal-body');
    const stickyHeader = document.getElementById('requirements-sticky-header');
    const quickView = document.getElementById('missing-requirements-quick-view');

    if (!modalBody || !stickyHeader) return;

    // Si hay un libro expandido, mantener sticky header visible siempre
    if (document.body.classList.contains('book-expanded')) {
      stickyHeader.classList.add('visible');
      this.updateStickyRequirementsHeader();
      return;
    }

    // Comportamiento normal cuando no hay libro expandido
    if (!quickView) return;

    const quickViewRect = quickView.getBoundingClientRect();
    const modalBodyRect = modalBody.getBoundingClientRect();

    // Mostrar sticky header cuando el quick view sale de la vista
    if (quickViewRect.bottom < modalBodyRect.top + 80) {
      stickyHeader.classList.add('visible');
      this.updateStickyRequirementsHeader();
    } else {
      stickyHeader.classList.remove('visible');
    }
  }

  /**
   * Update sticky requirements header content
   */
  updateStickyRequirementsHeader(forceReset = false) {
    const compactContainer = document.getElementById('sticky-requirements-compact');
    const progressFill = this.domCache.stickyProgressFill || document.getElementById('sticky-progress-fill');
    const progressText = this.domCache.stickyProgressText || document.getElementById('sticky-progress-text');

    if (!compactContainer || !progressFill || !progressText) return;

    if (forceReset || !this.selectedMission) {
      compactContainer.innerHTML = '';
      progressFill.style.width = '0%';
      progressFill.classList.remove('complete');
      progressText.textContent = '0/0';
      return;
    }

    const requirements = this.getCurrentMissionRequirements();
    if (requirements.length === 0) {
      compactContainer.innerHTML = '';
      progressFill.style.width = '0%';
      progressFill.classList.remove('complete');
      progressText.textContent = '0/0';
      return;
    }

    // Calculate fulfillment
    const fulfilled = this.countFulfilledRequirements(requirements);
    const total = requirements.length;
    const percentage = total > 0 ? (fulfilled / total) * 100 : 0;

    // Update progress bar
    progressFill.style.width = `${percentage}%`;
    if (percentage === 100) {
      progressFill.classList.add('complete');
    } else {
      progressFill.classList.remove('complete');
    }

    // Update progress text
    progressText.textContent = `${fulfilled}/${total}`;

    // Update requirements list (show only top 5)
    const topRequirements = requirements.slice(0, 5);
    compactContainer.innerHTML = topRequirements.map(req => {
      const isFulfilled = this.isRequirementFulfilled(req);
      const fulfillmentPercentage = this.getRequirementFulfillmentPercentage(req);
      const attrData = this.missionsSystem.attributes[req.type];
      const icon = attrData?.icon || '📊';

      return `
        <div class="sticky-requirement-item ${isFulfilled ? 'fulfilled' : ''}">
          <span class="sticky-requirement-icon">${icon}</span>
          <span class="sticky-requirement-percentage">${fulfillmentPercentage}%</span>
        </div>
      `;
    }).join('');
  }

  /**
   * Get requirement fulfillment percentage
   */
  getRequirementFulfillmentPercentage(requirement) {
    const target = this.getRequirementTarget(requirement) || 0;
    if (target === 0) return 0;

    const currentValue = this.getRequirementCurrentValue(requirement);
    return Math.min(100, Math.round((currentValue / target) * 100));
  }

  /**
   * Show Vitruvian popup when piece is added
   */
  showVitruvianPopup(piece) {
    const popup = this.domCache.vitruvianPopup || document.getElementById('vitruvian-popup');
    const beingContainer = document.getElementById('vitruvian-popup-being');
    const pieceInfo = document.getElementById('vitruvian-popup-piece');
    const attributesContainer = document.getElementById('vitruvian-popup-attributes');

    if (!popup || !beingContainer || !pieceInfo || !attributesContainer) return;

    // Clone current Vitruvian SVG
    const mainVitruvian = document.querySelector('#vitruvian-being-container svg') || this.vitruvianBeing?.svg;
    beingContainer.innerHTML = '';
    if (mainVitruvian) {
      const clonedSVG = mainVitruvian.cloneNode(true);
      beingContainer.appendChild(clonedSVG);

      // Add pulse animation
      beingContainer.classList.add('piece-added');
      this._setTimeout(() => {
        beingContainer.classList.remove('piece-added');
      }, 600);
    } else {
      beingContainer.innerHTML = '<p class="vitruvian-popup-empty">Añade piezas para visualizar el ser</p>';
    }

    // Update piece info
    const analysis = this.missionsSystem.analyzePiece(piece);
    pieceInfo.innerHTML = `
      ¡Pieza añadida!<br>
      <strong>${piece.title}</strong>
    `;

    // Update attributes
    const attributeEntries = analysis?.attributes
      ? Object.entries(analysis.attributes).filter(([, value]) => value > 0)
      : [];

    const attributesHTML = attributeEntries.length
      .filter(([_, value]) => value > 0)
      .map(([attr, value]) => {
        const attrData = this.missionsSystem.attributes[attr];
        if (!attrData) return '';
        return `
          <span class="vitruvian-popup-attribute">
            ${attrData.icon} +${value}
          </span>
        `;
      })
      .join('');
    attributesContainer.innerHTML = attributesHTML || '<p class="vitruvian-popup-empty">Aún no hay atributos para mostrar.</p>';

    // Show popup
    popup.classList.add('visible');

    // Auto-hide after 4 seconds
    if (this.vitruvianPopupTimeout) {
      clearTimeout(this.vitruvianPopupTimeout);
      this.vitruvianPopupTimeout = null;
    }
    this.vitruvianPopupTimeout = this._setTimeout(() => {
      this.hideVitruvianPopup();
      this.vitruvianPopupTimeout = null;
    }, 4000);
  }

  /**
   * Hide Vitruvian popup
   */
  hideVitruvianPopup() {
    const popup = this.domCache.vitruvianPopup || document.getElementById('vitruvian-popup');
    if (popup) {
      popup.classList.remove('visible');
    }
    if (this.vitruvianPopupTimeout) {
      clearTimeout(this.vitruvianPopupTimeout);
      this.vitruvianPopupTimeout = null;
    }
  }

  /**
   * =============================
   * Experiments Log
   * =============================
   */
  loadExperimentLog() {
    try {
      const stored = localStorage.getItem('frankenstein-experiments');
      this.experimentLog = stored ? JSON.parse(stored) : [];
    } catch (error) {
      logger.warn('[FrankensteinUI] No se pudo leer la bitácora:', error);
      this.experimentLog = [];
    }
    this.renderExperimentLog();
  }

  recordExperimentEntry(results) {
    if (!this.currentBeing) return;
    const missionName = this.selectedMission?.name || 'Sin misión';
    const requirements = this.getCurrentMissionRequirements();
    const entry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      mission: missionName,
      viable: !!results.viable,
      score: results.percentage || 0,
      fulfilled: this.countFulfilledRequirements(requirements),
      totalReqs: requirements.length,
      attributes: Object.entries(this.currentBeing.attributes || {})
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([key, value]) => {
          const attrData = this.missionsSystem.attributes[key];
          return `${attrData?.icon || '📊'} ${attrData?.name || key}: ${Math.round(value)}`;
        }),
      pieces: this.selectedPieces.map(piece => piece.title || piece.id).slice(0, 4),
      insight: results.viable
        ? (results.strengths?.[0]?.message || this.selectedMission?.successMessage || 'Ser viable.')
        : (results.missingAttributes?.[0]?.message || results.balanceIssues?.[0]?.message || 'Ajusta los atributos faltantes.')
    };

    this.experimentLog = [entry, ...this.experimentLog].slice(0, 20);
    try {
      localStorage.setItem('frankenstein-experiments', JSON.stringify(this.experimentLog));
    } catch (error) {
      logger.warn('[FrankensteinUI] No se pudo guardar la bitácora:', error);
    }
  }

  renderExperimentLog() {
    const list = this.domCache.experimentLogList || document.getElementById('experiment-log-list');
    const meta = this.domCache.experimentLogMeta || document.getElementById('experiment-log-meta');
    if (!list) return;

    if (!this.experimentLog.length) {
      list.innerHTML = '<p class="empty-card-message">Valida un ser para registrar sus resultados.</p>';
      if (meta) meta.textContent = 'Sin registros';
      return;
    }

    if (meta) {
      meta.textContent = `${this.experimentLog.length} registro${this.experimentLog.length !== 1 ? 's' : ''}`;
    }

    list.innerHTML = this.experimentLog.map(entry => `
      <div class="experiment-log-item ${entry.viable ? 'viable' : 'inviable'}">
        <div class="experiment-log-header">
          <div>
            <p class="experiment-log-date">${new Date(entry.timestamp).toLocaleString('es-ES')}</p>
            <h4>${entry.mission}</h4>
          </div>
          <span class="experiment-log-score">${entry.score}%</span>
        </div>
        <p class="experiment-log-highlight">${entry.insight}</p>
        <div class="experiment-log-meta">
          <span>🎯 ${entry.fulfilled}/${entry.totalReqs} requisitos</span>
          <span>🧩 ${entry.pieces.join(', ') || 'Sin piezas registradas'}</span>
        </div>
        <div class="experiment-log-attributes">
          ${entry.attributes.map(attr => `<span>${attr}</span>`).join('')}
        </div>
      </div>
    `).join('');
  }

  /**
   * Initialize contextual tooltips
   */
  initContextualTooltips() {
    const tooltipData = [
      {
        selector: '#btn-change-mission',
        title: '🎯 Cambiar Misión',
        content: 'Cada misión requiere diferentes tipos de piezas. Haz clic para ver todas las misiones disponibles.',
        shortcut: null
      },
      {
        selector: '#pieces-bottom-sheet-header-click',
        title: '📦 Piezas Disponibles',
        content: 'Desliza hacia arriba o toca para expandir. Usa filtros para encontrar lo que necesitas.',
        shortcut: 'Swipe ↑'
      },
      {
        selector: '.filter-pill[data-filter="compatible"]',
        title: '⚡ Filtro Inteligente',
        content: 'Muestra solo las piezas que te ayudan a completar la misión actual.',
        shortcut: 'A'
      },
      {
        selector: '#toggle-requirements',
        title: '📋 Requisitos',
        content: 'Expande para ver qué necesitas. Verde ✅ = cumplido, Gris ⬜ = pendiente.',
        shortcut: 'R'
      },
      {
        selector: '#vitruvian-being-container',
        title: '🧬 Tu Ser',
        content: 'Arrastra piezas aquí o tócalas para añadirlas. El ser crece con cada pieza.',
        shortcut: 'Drag & Drop'
      }
    ];

    tooltipData.forEach(data => {
      const element = document.querySelector(data.selector);
      if (!element) return;

      element.addEventListener('mouseenter', (e) => {
        this.showTooltip(element, data);
      });

      element.addEventListener('mouseleave', () => {
        this.hideTooltip();
      });

      // Touch support
      element.addEventListener('touchstart', (e) => {
        if (e.target.closest('.help-hint')) {
          e.preventDefault();
          this.showTooltip(element, data);
          this._setTimeout(() => this.hideTooltip(), 3000);
        }
      });
    });
  }

  /**
   * Show tooltip
   */
  showTooltip(element, data) {
    // Remove existing tooltip
    this.hideTooltip();

    const tooltip = document.createElement('div');
    tooltip.classList.add('franken-tooltip');
    tooltip.id = 'active-tooltip';

    tooltip.innerHTML = `
      <div class="tooltip-title">
        ${data.title}
      </div>
      <div class="tooltip-content">
        ${data.content}
      </div>
      ${data.shortcut ? `
        <div class="tooltip-shortcut">
          Atajo: <kbd>${data.shortcut}</kbd>
        </div>
      ` : ''}
    `;

    document.body.appendChild(tooltip);

    // Position tooltip
    const rect = element.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();

    let top, left;
    let position = 'top';

    // Try to position on top
    if (rect.top > tooltipRect.height + 20) {
      top = rect.top - tooltipRect.height - 10;
      left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
      position = 'top';
    } else {
      // Position on bottom
      top = rect.bottom + 10;
      left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
      position = 'bottom';
    }

    // Keep tooltip in viewport
    if (left < 10) left = 10;
    if (left + tooltipRect.width > window.innerWidth - 10) {
      left = window.innerWidth - tooltipRect.width - 10;
    }

    tooltip.style.top = `${top}px`;
    tooltip.style.left = `${left}px`;
    tooltip.setAttribute('data-position', position);

    // Show tooltip
    requestAnimationFrame(() => {
      tooltip.classList.add('show');
    });
  }

  /**
   * Hide tooltip
   */
  hideTooltip() {
    const tooltip = document.getElementById('active-tooltip');
    if (tooltip) {
      tooltip.classList.remove('show');
      this._setTimeout(() => tooltip.remove(), 200);
    }
  }

  /**
   * Show mini tutorial for Frankenstein Lab
   */
  showMiniTutorial() {
    // Check if already shown
    if (localStorage.getItem('frankenstein-tutorial-shown')) {
      return;
    }

    const overlay = document.createElement('div');
    overlay.classList.add('franken-mini-tutorial', 'active');

    overlay.innerHTML = `
      <div class="tutorial-card">
        <div class="tutorial-header">
          <div class="tutorial-icon">⚗️</div>
          <div class="tutorial-title">Laboratorio Frankenstein</div>
          <div class="tutorial-subtitle">Crea seres de conocimiento únicos</div>
        </div>

        <div class="tutorial-steps">
          <div class="tutorial-step">
            <div class="step-number">1</div>
            <div class="step-content">
              <div class="step-title">Selecciona una Misión</div>
              <div class="step-description">Cada misión requiere diferentes piezas de conocimiento</div>
            </div>
          </div>

          <div class="tutorial-step">
            <div class="step-number">2</div>
            <div class="step-content">
              <div class="step-title">Desliza el Panel de Piezas</div>
              <div class="step-description">Swipe hacia arriba para ver todas las piezas disponibles</div>
            </div>
          </div>

          <div class="tutorial-step">
            <div class="step-number">3</div>
            <div class="step-content">
              <div class="step-title">Usa "⚡ Compatibles"</div>
              <div class="step-description">Filtra solo las piezas que necesitas para tu misión</div>
            </div>
          </div>

          <div class="tutorial-step">
            <div class="step-number">4</div>
            <div class="step-content">
              <div class="step-title">Toca para Seleccionar</div>
              <div class="step-description">Verás animaciones y el progreso en la barra superior</div>
            </div>
          </div>

          <div class="tutorial-step">
            <div class="step-number">5</div>
            <div class="step-content">
              <div class="step-title">Completa y Activa</div>
              <div class="step-description">Cuando cumplas los requisitos, ¡confetti y celebración! 🎉</div>
            </div>
          </div>
        </div>

        <div class="tutorial-actions">
          <button class="tutorial-btn tutorial-btn-secondary" id="tutorial-skip">
            Omitir
          </button>
          <button class="tutorial-btn tutorial-btn-primary" id="tutorial-start">
            ¡Entendido!
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Event listeners
    overlay.querySelector('#tutorial-skip').addEventListener('click', () => {
      localStorage.setItem('frankenstein-tutorial-shown', 'skipped');
      overlay.classList.remove('active');
      this._setTimeout(() => overlay.remove(), 300);
    });

    overlay.querySelector('#tutorial-start').addEventListener('click', () => {
      localStorage.setItem('frankenstein-tutorial-shown', 'completed');
      overlay.classList.remove('active');
      this._setTimeout(() => overlay.remove(), 300);

      // Show first tooltip
      this._setTimeout(() => {
        const missionSelector = document.getElementById('mission-selector');
        if (missionSelector) {
          this.showTooltip(missionSelector, {
            title: '🎯 Empieza Aquí',
            content: 'Selecciona una misión para comenzar tu creación',
            shortcut: null
          });

          this._setTimeout(() => this.hideTooltip(), 4000);
        }
      }, 500);
    });
  }

  /**
   * Show progress hint when requirement fulfilled
   */
  showProgressHint(text) {
    const progressBar = document.querySelector('.mission-progress-bar');
    if (!progressBar) return;

    const hint = document.createElement('div');
    hint.classList.add('progress-hint');
    hint.textContent = text;

    progressBar.style.position = 'relative';
    progressBar.appendChild(hint);

    this._setTimeout(() => {
      hint.style.opacity = '0';
      hint.style.transform = 'translateX(-50%) translateY(-10px)';
      this._setTimeout(() => hint.remove(), 300);
    }, 2000);
  }

  /**
   * Crear selector de modo de juego
   */
  createGameModeSelector() {
    if (!window.FrankensteinQuiz) {
      logger.warn('[FrankensteinUI] Quiz system not available');
      return;
    }

    // Buscar el header del laboratorio
    const labHeader = document.querySelector('.lab-header');
    if (!labHeader) {
      logger.warn('[FrankensteinUI] Lab header not found');
      return;
    }

    // Crear el selector
    const currentMode = window.FrankensteinQuiz.getMode();
    const currentDifficulty = window.FrankensteinQuiz.getDifficulty();

    const selector = document.createElement('div');
    selector.className = 'game-mode-selector';
    selector.innerHTML = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 0.5rem;">
        <div>
          <div class="game-mode-label">
            <span>🎮</span> Modo de Juego
          </div>
          <div class="game-mode-toggle">
            <button class="game-mode-option ${currentMode === 'investigacion' ? 'active' : ''}" data-mode="investigacion" title="Explora sin evaluaciones">
              🔍 Investigación
            </button>
            <button class="game-mode-option ${currentMode === 'juego' ? 'active' : ''}" data-mode="juego" title="Aprende con quizzes">
              🧠 Aprendizaje
            </button>
            <button class="game-mode-option ${currentMode === 'demo' ? 'active' : ''}" data-mode="demo" title="Explora seres y sociedades de ejemplo">
              ✨ Demo
            </button>
          </div>
        </div>

        <div>
          <div class="game-mode-label">
            <span>⚡</span> Dificultad Quiz
          </div>
          <div class="difficulty-toggle">
            <button class="difficulty-option ${currentDifficulty === 'ninos' ? 'active' : ''}" data-difficulty="ninos" title="Preguntas fáciles con lenguaje sencillo para niños">
              🎈 Niños
            </button>
            <button class="difficulty-option ${currentDifficulty === 'principiante' ? 'active' : ''}" data-difficulty="principiante" title="Preguntas sencillas sobre conceptos básicos">
              🌱 Principiante
            </button>
            <button class="difficulty-option ${currentDifficulty === 'iniciado' ? 'active' : ''}" data-difficulty="iniciado" title="Preguntas de complejidad media">
              📚 Iniciado
            </button>
            <button class="difficulty-option ${currentDifficulty === 'experto' ? 'active' : ''}" data-difficulty="experto" title="Preguntas profundas y complejas">
              🎓 Experto
            </button>
          </div>
        </div>
      </div>

      <div class="game-mode-description">
        <span id="mode-description">
          ${this.getModeDescription(currentMode)}
        </span>
      </div>
    `;

    // Insertar después del header del laboratorio
    labHeader.parentNode.insertBefore(selector, labHeader.nextSibling);

    // Event listeners para modo de juego
    selector.querySelectorAll('.game-mode-option').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const mode = btn.dataset.mode;
        logger.log(`[FrankensteinUI] Changing mode to: ${mode}`);

        if (!window.FrankensteinQuiz) {
          logger.error('[FrankensteinUI] FrankensteinQuiz not available');
          return;
        }

        window.FrankensteinQuiz.setMode(mode);
        logger.log(`[FrankensteinUI] Mode changed, current mode: ${window.FrankensteinQuiz.getMode()}`);

        // Update UI
        selector.querySelectorAll('.game-mode-option').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Update description
        const desc = selector.querySelector('#mode-description');
        desc.textContent = this.getModeDescription(mode);

        // Si se activa modo demo, cargar datos de ejemplo
        if (mode === 'demo' && window.FrankensteinDemoData) {
          window.FrankensteinDemoData.loadDemoData(this);
          this.showNotification('✨ Datos de demostración cargados. Revisa la sección "Seres Guardados" para ver los ejemplos.', 'success', 5000);
        }

        // Show notification
        const modeMessages = {
          'investigacion': '🔍 Modo Investigación activado',
          'juego': '🧠 Modo Aprendizaje activado',
          'demo': '✨ Modo Demo activado'
        };
        this.showNotification(modeMessages[mode] || 'Modo cambiado', 'info');
      });
    });

    // Event listeners para dificultad
    selector.querySelectorAll('.difficulty-option').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const difficulty = btn.dataset.difficulty;
        logger.log(`[FrankensteinUI] Changing difficulty to: ${difficulty}`);

        if (!window.FrankensteinQuiz) {
          logger.error('[FrankensteinUI] FrankensteinQuiz not available');
          return;
        }

        window.FrankensteinQuiz.setDifficulty(difficulty);

        // Update UI
        selector.querySelectorAll('.difficulty-option').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Show notification
        const difficultyMessages = {
          'ninos': '🎈 Nivel Niños: Preguntas fáciles con lenguaje sencillo',
          'principiante': '🌱 Nivel Principiante: Preguntas sencillas y conceptos básicos',
          'iniciado': '📚 Nivel Iniciado: Preguntas de complejidad media',
          'experto': '🎓 Nivel Experto: Preguntas profundas y pensamiento crítico'
        };
        this.showNotification(difficultyMessages[difficulty] || 'Nivel cambiado', 'info');
      });
    });
  }

  /**
   * Obtener descripción del modo de juego
   */
  getModeDescription(mode) {
    const descriptions = {
      'investigacion': 'Explora libremente sin evaluaciones. Las piezas tienen poder estándar. Ideal para lectura y reflexión.',
      'juego': 'Responde quizzes adaptados a tu nivel. El poder de las piezas depende de tu comprensión. Elige entre Principiante, Iniciado o Experto.',
      'demo': 'Explora seres y microsociedades de ejemplo. Sin quizzes, poder moderado. Perfecto para conocer el sistema.'
    };
    return descriptions[mode] || 'Modo desconocido';
  }

  // ============================================
  // MÉTODOS DEL MENÚ LATERAL
  // ============================================

  /**
   * Alternar visibilidad del menú lateral
   */
  toggleSideMenu() {
    const menu = document.getElementById('lab-side-menu');
    if (menu) {
      if (menu.classList.contains('open')) {
        this.closeSideMenu();
      } else {
        this.openSideMenu();
      }
    }
  }

  /**
   * Abrir menú lateral
   */
  openSideMenu() {
    const menu = document.getElementById('lab-side-menu');
    if (menu) {
      menu.classList.add('open');
      document.body.style.overflow = 'hidden';
      // Feedback háptico si disponible
      if (navigator.vibrate) {
        navigator.vibrate(10);
      }
    }
  }

  /**
   * Cerrar menú lateral
   */
  closeSideMenu() {
    const menu = document.getElementById('lab-side-menu');
    if (menu) {
      menu.classList.remove('open');
      document.body.style.overflow = '';
    }
  }

  /**
   * Manejar navegación desde el menú
   */
  handleMenuNavigation(section) {
    logger.log(`[Menu] Navegando a: ${section}`);
    this.closeSideMenu();

    switch(section) {
      case 'laboratorio':
        // Ya estamos aquí, solo cerrar menú
        break;

      case 'seres':
        this.showSavedBeingsModal();
        break;

      case 'microsociedades':
        this.openMicrosocietiesSimulator();
        break;

      case 'retos':
        if (window.frankensteinChallengesModal && this.currentBeing && this.currentMission) {
          window.frankensteinChallengesModal.open(this.currentBeing, this.currentMission);
        } else if (!this.currentBeing || !this.currentMission) {
          this.showNotification('Primero crea y valida un ser con una misión', 'warning');
        } else {
          this.showNotification('Sistema de retos no disponible', 'info');
        }
        break;

      case 'ajustes':
        if (window.frankensteinSettings) {
          window.frankensteinSettings.open();
        } else {
          this.showNotification('Ajustes en desarrollo', 'info');
        }
        break;

      case 'estadisticas':
        if (window.frankensteinStats) {
          window.frankensteinStats.open();
        } else {
          this.showNotification('Estadísticas en desarrollo', 'info');
        }
        break;

      case 'ayuda':
        this.showHelpModal();
        break;

      case 'salir':
        if (this.organism && this.organism.hide) {
          this.organism.hide();
        } else {
          window.location.href = 'index.html';
        }
        break;

      default:
        logger.log(`[Menu] Sección desconocida: ${section}`);
    }
  }

  /**
   * Actualizar badges del menú con contadores
   */
  updateMenuBadges() {
    // Contador de seres guardados
    const savedBeings = this.loadBeings();
    const seresCount = savedBeings.length;

    const headerBadge = document.getElementById('saved-beings-count');
    if (headerBadge) {
      headerBadge.textContent = seresCount;
      headerBadge.style.display = seresCount > 0 ? 'flex' : 'none';
    }

    const menuSeresCount = document.getElementById('menu-seres-count');
    if (menuSeresCount) {
      menuSeresCount.textContent = seresCount;
      menuSeresCount.style.display = seresCount > 0 ? 'inline-flex' : 'none';
    }

    // Contador de microsociedades
    try {
      const microsocieties = JSON.parse(localStorage.getItem('frankenstein_microsocieties') || '[]');
      const microCount = microsocieties.length;

      const menuMicroCount = document.getElementById('menu-micro-count');
      if (menuMicroCount) {
        menuMicroCount.textContent = microCount;
        menuMicroCount.style.display = microCount > 0 ? 'inline-flex' : 'none';
      }
    } catch (e) {
      logger.warn('[Menu] Error al obtener microsociedades:', e);
    }
  }

  /**
   * Intentar abrir la experiencia de microsociedades con fallbacks
   */
  openMicrosocietiesSimulator() {
    // Preferir el nuevo panel de microsociedades
    if (window.microsocietiesInit && typeof window.microsocietiesInit.open === 'function') {
      window.microsocietiesInit.open();
      return;
    }

    // Fallback: galería si está disponible
    if (window.microsocietiesGallery && typeof window.microsocietiesGallery.open === 'function') {
      window.microsocietiesGallery.open();
      return;
    }

    // Asegurar que exista un manager de microsociedades
    const manager = this.ensureMicroSocietiesManager();
    if (!manager) {
      this.showNotification('Sistema de microsociedades no disponible', 'info');
      return;
    }

    let society = manager.getCurrentSociety();

    // Crear sociedad base si no existe ninguna
    if (!society) {
      const beings = this.loadBeings();
      if (!beings.length) {
        this.showNotification('Crea o guarda un ser para iniciar una microsociedad', 'warning');
        return;
      }

      const seedBeings = beings.slice(0, Math.min(8, beings.length));
      society = manager.createSociety(
        `Microsociedad ${seedBeings[0]?.name || 'sin nombre'}`,
        seedBeings,
        'Explorar cooperación evolutiva'
      );
    }

    // Usar modal nativo del sistema completo si existe
    if (typeof window.openMicroSocietiesModal === 'function') {
      if (society) {
        this.microSocietySnapshot = {
          name: society.name,
          beingsCount: society.beings?.length || 0,
          metrics: this.estimateMicrosocietyMetrics(society.beings || []),
          updatedAt: new Date().toISOString()
        };
        this.renderMicrosocietyCard();
      }
      window.openMicroSocietiesModal(society);
      return;
    }

    // Fallback a un modal resumido propio
    if (society) {
      this.microSocietySnapshot = {
        name: society.name,
        beingsCount: society.beings?.length || 0,
        metrics: this.estimateMicrosocietyMetrics(society.beings || []),
        updatedAt: new Date().toISOString()
      };
      this.renderMicrosocietyCard();
    }
    this.renderBasicMicrosocietyModal(society);
  }

  /**
   * Renderizar modal simple con el estado actual de la microsociedad
   */
  renderBasicMicrosocietyModal(society) {
    if (!society) {
      this.showNotification('⚠️ No hay datos de microsociedad para mostrar.', 'warning');
      return;
    }
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay modal-overlay-enhanced active';

    const livingBeings = society.beings.filter(b => b.alive);
    const metrics = society.metrics || {};
    const metricItems = Object.entries(metrics).map(([key, value]) => `
      <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:0.75rem 1rem;">
        <div style="font-size:0.75rem;text-transform:uppercase;letter-spacing:0.08em;color:#cbd5f5">${key}</div>
        <div style="font-size:1.4rem;font-weight:600;color:#ffffff">${Math.round(value)}</div>
      </div>
    `).join('');

    const beingsList = livingBeings.slice(0, 5).map(being => `
      <li style="background:rgba(15,23,42,0.6);border:1px solid rgba(148,163,184,0.2);border-radius:10px;padding:0.75rem 1rem;">
        <strong style="color:#f8fafc">${being.name}</strong>
        <span style="display:block;font-size:0.85rem;color:#a7f3d0">Poder: ${Math.round(being.totalPower || 0)}</span>
      </li>
    `).join('') || '<li>No hay seres disponibles</li>';

    overlay.innerHTML = `
      <div class="modal-content modal-content-enhanced" style="max-width: 640px;">
        <div class="modal-header">
          <div>
            <h2>🌍 ${society.name}</h2>
            <p class="text-sm text-gray-300">Turno ${society.turn} · ${livingBeings.length} seres activos</p>
          </div>
          <button class="modal-close" aria-label="Cerrar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div class="modal-body">
          <section class="mb-4">
            <h3 class="text-lg mb-2">Estado actual</h3>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
              ${metricItems || '<p>No hay métricas disponibles</p>'}
            </div>
          </section>

          <section class="mb-4">
            <h3 class="text-lg mb-2">Seres activos</h3>
            <ul class="space-y-2">${beingsList}</ul>
          </section>

          <section>
            <p class="text-sm text-gray-300">
              La experiencia completa de microsociedades se encuentra en desarrollo.
              Este resumen permite verificar que los datos se generaron correctamente.
            </p>
          </section>
        </div>
      </div>
    `;

    overlay.addEventListener('click', (event) => {
      if (event.target === overlay || event.target.closest('.modal-close')) {
        overlay.remove();
      }
    });

    document.body.appendChild(overlay);
  }

  /**
   * Mostrar modal de ayuda
   */
  showHelpModal() {
    const helpContent = `
      <div class="help-modal-content">
        <h2>🧬 Guía del Laboratorio Frankenstein</h2>

        <div class="help-section">
          <h3>🎯 ¿Qué es esto?</h3>
          <p>El Laboratorio Frankenstein te permite crear "Seres Transformadores" combinando conocimientos de los libros de la colección.</p>
        </div>

        <div class="help-section">
          <h3>📝 Cómo crear un Ser</h3>
          <ol>
            <li><strong>Selecciona una Misión:</strong> Define el propósito de tu ser</li>
            <li><strong>Añade Piezas:</strong> Capítulos, ejercicios y recursos de los libros</li>
            <li><strong>Responde Quizzes:</strong> Demuestra tu comprensión del material</li>
            <li><strong>Valida tu Ser:</strong> Comprueba si cumple los requisitos</li>
          </ol>
        </div>

        <div class="help-section">
          <h3>⚙️ Modos de Juego</h3>
          <ul>
            <li><strong>🔍 Investigación:</strong> Explora sin evaluaciones</li>
            <li><strong>🧠 Aprendizaje:</strong> Con quizzes y niveles de dificultad</li>
            <li><strong>✨ Demo:</strong> Explora ejemplos precargados</li>
          </ul>
        </div>

        <div class="help-section">
          <h3>🏛️ Microsociedades</h3>
          <p>Simula cómo interactuarían tus seres en una comunidad. Observa cómo evolucionan sus atributos y relaciones.</p>
        </div>

        <button class="lab-button primary" onclick="this.closest('.modal-overlay').remove()">
          Entendido
        </button>
      </div>
    `;

    const modal = document.createElement('div');
    modal.className = 'modal-overlay modal-overlay-enhanced active';
    modal.innerHTML = `
      <div class="modal-content modal-content-enhanced" style="max-width: 600px; max-height: 80vh; overflow-y: auto;">
        ${helpContent}
      </div>
    `;

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });

    document.body.appendChild(modal);
  }

  // ==========================================================================
  // TIMER MANAGEMENT - ⭐ FIX v2.9.186
  // ==========================================================================

  /**
   * setTimeout wrapper que auto-registra el timer para cleanup posterior
   * @param {Function} callback - Función a ejecutar
   * @param {Number} delay - Delay en ms
   * @returns {Number} - Timer ID
   */
  _setTimeout(callback, delay) {
    const timerId = setTimeout(() => {
      callback();
      // Auto-remove del tracking array al completarse
      const index = this.timers.indexOf(timerId);
      if (index > -1) {
        this.timers.splice(index, 1);
      }
    }, delay);
    this.timers.push(timerId);
    return timerId;
  }

  /**
   * setInterval wrapper que auto-registra el interval para cleanup posterior
   * @param {Function} callback - Función a ejecutar
   * @param {Number} delay - Delay en ms
   * @returns {Number} - Interval ID
   */
  _setInterval(callback, delay) {
    const intervalId = setInterval(callback, delay);
    this.intervals.push(intervalId);
    return intervalId;
  }

  /**
   * clearInterval wrapper que remueve el interval del tracking array
   * @param {Number} intervalId - Interval ID a limpiar
   */
  _clearInterval(intervalId) {
    clearInterval(intervalId);
    const index = this.intervals.indexOf(intervalId);
    if (index > -1) {
      this.intervals.splice(index, 1);
    }
  }

  /**
   * Destruir UI
   * ⭐ FIX v2.9.186: Añadido cleanup de timers pendientes
   */
  destroy() {
    // Limpiar timers e intervals pendientes (⭐ FIX v2.9.186)
    this.timers.forEach(timerId => clearTimeout(timerId));
    this.timers = [];

    this.intervals.forEach(intervalId => clearInterval(intervalId));
    this.intervals = [];

    // Limpiar timers específicos con referencias guardadas
    if (this.backgroundRotationTimer) {
      clearInterval(this.backgroundRotationTimer);
      this.backgroundRotationTimer = null;
    }

    if (this.vitruvianPopupTimeout) {
      clearTimeout(this.vitruvianPopupTimeout);
      this.vitruvianPopupTimeout = null;
    }

    // 🔧 REFACTORING v2.9.201: Cleanup FrankensteinModals
    if (this.modals) {
      this.modals.destroy();
      this.modals = null;
    }

    // 🔧 REFACTORING v2.9.201: Cleanup FrankensteinUIRenderer
    if (this.uiRenderer) {
      this.uiRenderer.destroy();
      this.uiRenderer = null;
    }

    const container = document.getElementById('organism-container');
    if (container) {
      container.innerHTML = '';
    }
    this.hideTooltip();
    this.isInitialized = false;
    this.currentBottomSheetState = null;
    this.lastProgressPercentage = 0;
    this.hasShownConfetti = false;
  }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
  window.FrankensteinLabUI = FrankensteinLabUI;
}
