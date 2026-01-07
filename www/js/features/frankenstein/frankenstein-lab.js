/**
 * FRANKENSTEIN LAB UI - ORQUESTADOR PRINCIPAL v2.9.201
 *
 * Módulo orquestador que integra todos los componentes extraídos del sistema
 * Frankenstein Lab. Este módulo reemplaza a frankenstein-ui.js con una
 * arquitectura modular y escalable.
 *
 * Responsabilidades:
 * - Inicialización y coordinación de todos los módulos
 * - Gestión del ciclo de vida completo (init/destroy)
 * - Cache de elementos DOM para optimización
 * - Tracking de timers/intervals/listeners para cleanup
 * - Orquestación de eventos entre módulos
 * - Backward compatibility con API original
 *
 * Arquitectura:
 * - 22 módulos integrados organizados en 4 capas
 * - Fase 1: Data + Utils + Animations (5 módulos)
 * - Fase 2: UI Components (7 módulos)
 * - Fase 3: Core Logic (10 módulos)
 * - Fase 4: Orquestación (este módulo)
 *
 * @module FrankensteinLab
 * @version 2.9.201
 * @author J. Irurtzun & Claude Sonnet 4.5
 */

// =====================================================================
// FASE 1: DATA MODULES
// =====================================================================

import { FrankensteinMissionData } from './data/frankenstein-mission-data.js';
import { FrankensteinPieceCatalog } from './data/frankenstein-piece-catalog.js';
import { FrankensteinBeingTemplates } from './data/frankenstein-being-templates.js';

// =====================================================================
// FASE 1: UTILS & ANIMATIONS
// =====================================================================

import { BackgroundRotator } from './utils/frankenstein-background-rotator.js';
import { ConfettiEffects } from './animations/frankenstein-confetti-effects.js';

// =====================================================================
// FASE 2: UI COMPONENTS
// =====================================================================

import { FrankensteinTooltips } from './ui/frankenstein-tooltips.js';
import { FrankensteinAvatarGenerator } from './ui/frankenstein-avatar-generator.js';
import { FrankensteinVitruvianDisplay } from './ui/frankenstein-vitruvian-display.js';
import { FrankensteinModals } from './ui/frankenstein-modals.js';
import { FrankensteinPieceCards } from './ui/frankenstein-piece-cards.js';
import { FrankensteinBottomSheet } from './ui/frankenstein-bottom-sheet.js';
import { FrankensteinTutorial } from './ui/frankenstein-tutorial.js';
import { FrankensteinDragDropHandler } from './utils/frankenstein-drag-drop-handler.js';

// =====================================================================
// FASE 3: CORE LOGIC
// =====================================================================

import { FrankensteinMissionValidator } from './core/frankenstein-mission-validator.js';
import { FrankensteinBeingBuilder } from './core/frankenstein-being-builder.js';
import { FrankensteinBeingStorage } from './core/frankenstein-being-storage.js';
import { FrankensteinMicroSociety } from './core/frankenstein-micro-society.js';
import { FrankensteinMiniChallenges } from './core/frankenstein-mini-challenges.js';
import { FrankensteinRewardsSystem } from './core/frankenstein-rewards-system.js';
import { FrankensteinSearchFilter } from './core/frankenstein-search-filter.js';
import { FrankensteinValidationExport } from './core/frankenstein-validation-export.js';
import { FrankensteinDemoScenarios } from './core/frankenstein-demo-scenarios.js';
import { FrankensteinExperimentLog } from './core/frankenstein-experiment-log.js';

/**
 * Clase principal del Laboratorio Frankenstein
 *
 * Orquesta todos los módulos del sistema y proporciona la API principal
 * para la interacción con el laboratorio de construcción de seres.
 *
 * @class FrankensteinLabUI
 * @example
 * const lab = new FrankensteinLabUI(organismKnowledge);
 * await lab.init();
 * // ... usar el laboratorio
 * lab.destroy(); // cleanup cuando termine
 */
export class FrankensteinLabUI {
  /**
   * Crea una nueva instancia del Laboratorio Frankenstein
   *
   * @param {Object} organismKnowledge - Datos del organismo/colección de conocimiento
   */
  constructor(organismKnowledge) {
    // =========================================================================
    // ESTADO CORE
    // =========================================================================

    /** @type {Object} Referencia al organismo/colección de conocimiento */
    this.organism = organismKnowledge;

    /** @type {Object|null} Sistema de misiones (legacy - FrankensteinMissions global) */
    this.missionsSystem = null;

    /** @type {Object|null} Misión actualmente seleccionada */
    this.selectedMission = null;

    /** @type {Array} Piezas seleccionadas para construir el ser */
    this.selectedPieces = [];

    /** @type {Object|null} Ser en construcción actual */
    this.currentBeing = null;

    /** @type {Array} Todas las piezas disponibles de la colección */
    this.availablePieces = [];

    /** @type {Object|null} Visualización del Hombre de Vitrubio (legacy) */
    this.vitruvianBeing = null;

    /** @type {Object|null} Sistema de avatares procedurales (legacy) */
    this.avatarSystem = null;

    // =========================================================================
    // FLAGS DE ESTADO
    // =========================================================================

    /** @type {boolean} Flag de inicialización completa */
    this.isInitialized = false;

    /** @type {boolean} Flag de laboratorio iniciado */
    this.labStarted = false;

    /** @type {boolean} Flag de actualización pendiente de requisitos */
    this.pendingRequirementsUpdate = false;

    /** @type {boolean} Flag para saltar quiz en recompensa especial */
    this.skipQuizForSpecialReward = false;

    /** @type {boolean} Flag de restauración de estado */
    this.hasRestoredLabState = false;

    // =========================================================================
    // DATOS Y ESTADO
    // =========================================================================

    /** @type {Object} Datos de libros para vista móvil */
    this.mobileBooksData = {};

    /** @type {string} Filtro activo en bottom sheet móvil */
    this.mobileSheetFilter = 'all';

    /** @type {string} Búsqueda activa en bottom sheet móvil */
    this.mobileSheetSearch = '';

    /** @type {Array} Historial de experimentos */
    this.experimentLog = [];

    /** @type {Object} Último estado de requisitos conocido */
    this.lastRequirementState = {};

    /** @type {Object} Progreso de misión actual */
    this.missionProgress = { fulfilled: 0, total: 0 };

    /** @type {Object|null} Mini-desafío activo */
    this.activeMiniChallenge = null;

    /** @type {Array} Historial de mini-desafíos */
    this.miniChallengeHistory = [];

    /** @type {Object|null} Escenario demo activo */
    this.activeDemoScenario = null;

    /** @type {Object|null} Snapshot de micro-sociedad */
    this.microSocietySnapshot = null;

    /** @type {Array} Historial de eventos de micro-sociedad */
    this.microEventHistory = [];

    /** @type {string} Key para almacenar estado del laboratorio */
    this.labStateKey = 'frankenstein-lab-state';

    /** @type {number|null} Timeout del popup vitruviano */
    this.vitruvianPopupTimeout = null;

    /** @type {string|null} Estado actual del bottom sheet */
    this.currentBottomSheetState = null;

    /** @type {number} Último porcentaje de progreso mostrado */
    this.lastProgressPercentage = 0;

    /** @type {boolean} Flag de confetti mostrado */
    this.hasShownConfetti = false;

    // =========================================================================
    // TRACKING DE MEMORIA (v2.9.186)
    // =========================================================================

    /** @type {Array<number>} IDs de setTimeout activos para cleanup */
    this.timers = [];

    /** @type {Array<number>} IDs de setInterval activos para cleanup */
    this.intervals = [];

    /** @type {Array<Object>} Event listeners registrados para cleanup */
    this.eventListeners = [];

    // =========================================================================
    // BACKGROUNDS Y EVENTOS (LEGACY - se moverán a módulos)
    // =========================================================================

    /** @type {Array<string>} Lista de fondos vintage disponibles */
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

    /** @type {number|null} Timer de rotación de fondo */
    this.backgroundRotationTimer = null;

    /** @type {number} Índice del fondo anterior */
    this.previousBackgroundIndex = -1;

    /** @type {Array<Object>} Eventos de micro-sociedad disponibles */
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

    // =========================================================================
    // MÓDULOS INTEGRADOS (22 módulos)
    // =========================================================================

    // --- FASE 1: DATA MODULES ---
    /** @type {FrankensteinMissionData} Catálogo de misiones */
    this.missionData = new FrankensteinMissionData();

    /** @type {FrankensteinPieceCatalog} Catálogo de piezas */
    this.pieceCatalog = new FrankensteinPieceCatalog();

    /** @type {FrankensteinBeingTemplates} Plantillas de seres */
    this.beingTemplates = new FrankensteinBeingTemplates();

    // --- FASE 1: UTILS & ANIMATIONS ---
    /** @type {BackgroundRotator} Gestor de rotación de fondos */
    this.backgroundRotator = new BackgroundRotator(this.vintageBackgrounds);

    /** @type {ConfettiEffects} Sistema de efectos de confetti */
    this.confettiEffects = new ConfettiEffects();

    // --- FASE 2: UI COMPONENTS (se inicializarán en init()) ---
    /** @type {FrankensteinTooltips|null} Gestor de tooltips */
    this.tooltips = null;

    /** @type {FrankensteinAvatarGenerator|null} Generador de avatares */
    this.avatarGenerator = null;

    /** @type {FrankensteinVitruvianDisplay|null} Display del ser vitruviano */
    this.vitruvianDisplay = null;

    /** @type {FrankensteinModals|null} Sistema de modales */
    this.modals = null;

    /** @type {FrankensteinPieceCards|null} Gestor de cartas de piezas */
    this.pieceCards = null;

    /** @type {FrankensteinBottomSheet|null} Bottom sheet móvil */
    this.bottomSheet = null;

    /** @type {FrankensteinTutorial|null} Sistema de tutorial */
    this.tutorial = null;

    /** @type {FrankensteinDragDropHandler|null} Gestor de drag & drop */
    this.dragDropHandler = null;

    // --- FASE 3: CORE LOGIC (se inicializarán en init()) ---
    /** @type {FrankensteinMissionValidator|null} Validador de misiones */
    this.missionValidator = null;

    /** @type {FrankensteinBeingBuilder|null} Constructor de seres */
    this.beingBuilder = null;

    /** @type {FrankensteinBeingStorage|null} Almacenamiento de seres */
    this.beingStorage = null;

    /** @type {FrankensteinMicroSociety|null} Simulador de micro-sociedad */
    this.microSociety = null;

    /** @type {FrankensteinMiniChallenges|null} Sistema de mini-desafíos */
    this.miniChallenges = null;

    /** @type {FrankensteinRewardsSystem|null} Sistema de recompensas */
    this.rewardsSystem = null;

    /** @type {FrankensteinSearchFilter|null} Sistema de búsqueda y filtrado */
    this.searchFilter = null;

    /** @type {FrankensteinValidationExport|null} Exportador de validaciones */
    this.validationExport = null;

    /** @type {FrankensteinDemoScenarios|null} Escenarios de demostración */
    this.demoScenarios = null;

    /** @type {FrankensteinExperimentLog|null} Registro de experimentos */
    this.experimentLogModule = null;

    // =========================================================================
    // DOM CACHE (50+ elementos)
    // =========================================================================

    /**
     * Cache de referencias DOM frecuentes para optimización de rendimiento.
     * Se inicializa en initDomCache() después de crear la UI.
     * @type {Object}
     */
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

  // ===========================================================================
  // DOM CACHE MANAGEMENT
  // ===========================================================================

  /**
   * Inicializar cache de referencias DOM
   *
   * Optimiza el rendimiento al evitar llamadas repetidas a querySelector/getElementById.
   * Debe llamarse después de crear la UI del laboratorio.
   *
   * @private
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
   * Limpiar cache DOM
   *
   * Útil cuando se recrea la UI. Pone todas las referencias DOM a null.
   *
   * @private
   */
  clearDomCache() {
    Object.keys(this.domCache).forEach(key => {
      this.domCache[key] = null;
    });
  }

  // ===========================================================================
  // MEMORY MANAGEMENT WRAPPERS (v2.9.186)
  // ===========================================================================

  /**
   * setTimeout wrapper con tracking automático
   *
   * Registra el timer para cleanup posterior en destroy().
   * El timer se auto-remueve del tracking al completarse.
   *
   * @param {Function} callback - Función a ejecutar
   * @param {number} delay - Delay en milisegundos
   * @returns {number} Timer ID
   *
   * @example
   * this._setTimeout(() => logger.log('delayed'), 1000);
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
   * setInterval wrapper con tracking automático
   *
   * Registra el interval para cleanup posterior en destroy().
   *
   * @param {Function} callback - Función a ejecutar
   * @param {number} delay - Delay en milisegundos
   * @returns {number} Interval ID
   *
   * @example
   * const intervalId = this._setInterval(() => logger.log('tick'), 1000);
   */
  _setInterval(callback, delay) {
    const intervalId = setInterval(callback, delay);
    this.intervals.push(intervalId);
    return intervalId;
  }

  /**
   * clearInterval wrapper con auto-limpieza del tracking
   *
   * @param {number} intervalId - Interval ID a limpiar
   *
   * @example
   * this._clearInterval(this.myIntervalId);
   */
  _clearInterval(intervalId) {
    clearInterval(intervalId);
    const index = this.intervals.indexOf(intervalId);
    if (index > -1) {
      this.intervals.splice(index, 1);
    }
  }

  /**
   * addEventListener wrapper con tracking automático
   *
   * Registra el listener para cleanup posterior en destroy().
   *
   * @param {EventTarget} target - Elemento que escucha
   * @param {string} event - Tipo de evento
   * @param {Function} handler - Función manejadora
   * @param {Object} [options] - Opciones del listener
   *
   * @example
   * this._addEventListener(button, 'click', () => logger.log('clicked'));
   */
  _addEventListener(target, event, handler, options) {
    target.addEventListener(event, handler, options);
    this.eventListeners.push({ target, event, handler, options });
  }

  // ===========================================================================
  // INITIALIZATION & LIFECYCLE
  // ===========================================================================

  /**
   * Inicializar UI del Laboratorio Frankenstein
   *
   * Flujo de inicialización:
   * 1. Verificar si ya está inicializado (evitar doble init)
   * 2. Inicializar sistema de misiones legacy (FrankensteinMissions)
   * 3. Inicializar sistema de avatares legacy (FrankensteinAvatarSystem)
   * 4. Cargar todas las piezas disponibles del organismo
   * 5. Inicializar módulos UI (bottom sheet, modals)
   * 6. Crear pantalla de inicio o lab UI según estado
   * 7. Cargar datos demo si modo demo está activo
   * 8. Cargar log de experimentos
   * 9. Marcar como inicializado
   *
   * @async
   * @public
   */
  async init() {
    logger.log('🎬 FrankensteinLabUI.init() llamado. isInitialized:', this.isInitialized, 'labStarted:', this.labStarted);

    if (this.isInitialized) {
      logger.log('⏭️ Ya inicializado, saltando...');
      return;
    }

    // -------------------------------------------------------------------------
    // INICIALIZAR SISTEMAS LEGACY
    // -------------------------------------------------------------------------

    // Sistema de misiones (global legacy)
    if (typeof FrankensteinMissions !== 'undefined') {
      this.missionsSystem = new FrankensteinMissions();
      logger.log('✅ FrankensteinMissions inicializado');
    } else {
      logger.error('❌ FrankensteinMissions no disponible');
      return;
    }

    // Sistema de avatares (global legacy)
    if (typeof FrankensteinAvatarSystem !== 'undefined') {
      this.avatarSystem = new FrankensteinAvatarSystem();
      logger.log('✅ FrankensteinAvatarSystem inicializado');
    } else {
      logger.warn('⚠️ FrankensteinAvatarSystem no disponible - avatares deshabilitados');
    }

    // -------------------------------------------------------------------------
    // CARGAR PIEZAS DISPONIBLES
    // -------------------------------------------------------------------------

    logger.log('📦 Cargando piezas disponibles...');
    await this.loadAvailablePieces();
    logger.log('✅ Piezas cargadas:', this.availablePieces.length);

    // -------------------------------------------------------------------------
    // INICIALIZAR MÓDULOS UI
    // -------------------------------------------------------------------------

    // Bottom sheet móvil
    this.bottomSheet = new FrankensteinBottomSheet(this.domCache, this);
    logger.log('✅ FrankensteinBottomSheet inicializado');

    // Sistema de modales
    this.modals = new FrankensteinModals(this.domCache, this);
    logger.log('✅ FrankensteinModals inicializado');

    // -------------------------------------------------------------------------
    // CREAR UI SEGÚN ESTADO
    // -------------------------------------------------------------------------

    if (this.labStarted) {
      logger.log('🎮 Lab ya iniciado antes, creando UI directamente');
      this.createLabUI();
      this.attachEventListeners();
    } else {
      logger.log('🌟 Primera vez, mostrando pantalla de inicio');
      await this.createStartScreen();

      // Si el modo actual es demo, cargar datos automáticamente
      const currentMode = window.FrankensteinQuiz?.getMode();
      if (currentMode === 'demo' && window.FrankensteinDemoData) {
        logger.log('📦 Modo demo detectado - cargando datos automáticamente');
        window.FrankensteinDemoData.loadDemoData(this);
      }
    }

    // -------------------------------------------------------------------------
    // FINALIZAR INICIALIZACIÓN
    // -------------------------------------------------------------------------

    this.isInitialized = true;
    this.loadExperimentLog();

    logger.log('✅ FrankensteinLabUI inicializado completamente');
  }

  /**
   * Destruir UI y limpiar recursos
   *
   * Proceso de cleanup:
   * 1. Limpiar todos los timers pendientes
   * 2. Limpiar todos los intervals pendientes
   * 3. Limpiar event listeners registrados
   * 4. Limpiar timers específicos (background rotation, vitruvian popup)
   * 5. Destruir módulos (modals, bottom sheet, etc.)
   * 6. Limpiar contenedor DOM
   * 7. Resetear estado interno
   *
   * @public
   */
  destroy() {
    logger.log('🧹 FrankensteinLabUI.destroy() - Iniciando cleanup');

    // -------------------------------------------------------------------------
    // CLEANUP DE TIMERS E INTERVALS (v2.9.186)
    // -------------------------------------------------------------------------

    // Limpiar todos los timers pendientes
    this.timers.forEach(timerId => clearTimeout(timerId));
    this.timers = [];
    logger.log('✅ Timers limpiados');

    // Limpiar todos los intervals pendientes
    this.intervals.forEach(intervalId => clearInterval(intervalId));
    this.intervals = [];
    logger.log('✅ Intervals limpiados');

    // -------------------------------------------------------------------------
    // CLEANUP DE EVENT LISTENERS
    // -------------------------------------------------------------------------

    this.eventListeners.forEach(({ target, event, handler, options }) => {
      if (target && target.removeEventListener) {
        target.removeEventListener(event, handler, options);
      }
    });
    this.eventListeners = [];
    logger.log('✅ Event listeners limpiados');

    // -------------------------------------------------------------------------
    // CLEANUP DE TIMERS ESPECÍFICOS
    // -------------------------------------------------------------------------

    if (this.backgroundRotationTimer) {
      clearInterval(this.backgroundRotationTimer);
      this.backgroundRotationTimer = null;
    }

    if (this.vitruvianPopupTimeout) {
      clearTimeout(this.vitruvianPopupTimeout);
      this.vitruvianPopupTimeout = null;
    }

    // -------------------------------------------------------------------------
    // DESTRUIR MÓDULOS
    // -------------------------------------------------------------------------

    // Modals system
    if (this.modals) {
      this.modals.destroy();
      this.modals = null;
      logger.log('✅ FrankensteinModals destruido');
    }

    // Bottom sheet
    if (this.bottomSheet) {
      this.bottomSheet.destroy();
      this.bottomSheet = null;
      logger.log('✅ FrankensteinBottomSheet destruido');
    }

    // TODO: Destruir otros módulos cuando implementen método destroy()
    // - tooltips
    // - avatarGenerator
    // - vitruvianDisplay
    // - pieceCards
    // - tutorial
    // - dragDropHandler
    // - missionValidator
    // - beingBuilder
    // - beingStorage
    // - microSociety
    // - miniChallenges
    // - rewardsSystem
    // - searchFilter
    // - validationExport
    // - demoScenarios
    // - experimentLogModule

    // -------------------------------------------------------------------------
    // CLEANUP DE DOM
    // -------------------------------------------------------------------------

    const container = document.getElementById('organism-container');
    if (container) {
      container.innerHTML = '';
    }

    this.clearDomCache();

    // -------------------------------------------------------------------------
    // RESETEAR ESTADO
    // -------------------------------------------------------------------------

    this.isInitialized = false;
    this.currentBottomSheetState = null;
    this.lastProgressPercentage = 0;
    this.hasShownConfetti = false;

    logger.log('✅ FrankensteinLabUI destruido completamente');
  }

  // ===========================================================================
  // PLACEHOLDER METHODS (pendientes de implementación/extracción)
  // ===========================================================================

  /**
   * Cargar todas las piezas disponibles del organismo
   *
   * TODO: Extraer a FrankensteinPieceCatalog cuando se migre código legacy
   *
   * @async
   * @private
   */
  async loadAvailablePieces() {
    // TODO: Implementar carga de piezas desde organism
    // Por ahora es un placeholder que mantiene compatibilidad
    logger.log('📦 loadAvailablePieces() - pendiente de implementación');
  }

  /**
   * Crear pantalla de inicio del laboratorio
   *
   * TODO: Extraer a módulo FrankensteinUIRenderer
   *
   * @async
   * @private
   */
  async createStartScreen() {
    // TODO: Implementar pantalla de inicio
    logger.log('🌟 createStartScreen() - pendiente de implementación');
  }

  /**
   * Crear UI principal del laboratorio
   *
   * TODO: Extraer a módulo FrankensteinUIRenderer
   *
   * @private
   */
  createLabUI() {
    // TODO: Implementar creación de UI del lab
    logger.log('🎮 createLabUI() - pendiente de implementación');
  }

  /**
   * Adjuntar event listeners a la UI
   *
   * TODO: Extraer a módulo FrankensteinEventCoordinator
   *
   * @private
   */
  attachEventListeners() {
    // TODO: Implementar adjunto de event listeners
    logger.log('🎧 attachEventListeners() - pendiente de implementación');
  }

  /**
   * Cargar log de experimentos
   *
   * TODO: Delegar a FrankensteinExperimentLog
   *
   * @private
   */
  loadExperimentLog() {
    // TODO: Implementar carga de log
    logger.log('📋 loadExperimentLog() - pendiente de implementación');
  }

  /**
   * Sincronizar estado de botones de acción
   *
   * Actualiza el estado enabled/disabled de los botones principales según:
   * - Si hay un ser construido (piezas seleccionadas)
   * - Si hay una misión seleccionada
   *
   * @private
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
}

// =============================================================================
// GLOBAL EXPORT (BACKWARD COMPATIBILITY)
// =============================================================================

/**
 * Exportar a window para backward compatibility con código legacy
 * que espera window.FrankensteinLabUI
 */
if (typeof window !== 'undefined') {
  window.FrankensteinLabUI = FrankensteinLabUI;
}

/**
 * Export por defecto para imports ES6
 */
export default FrankensteinLabUI;

logger.log('✅ FrankensteinLabUI v2.9.201 cargado');
