/**
 * FRANKENSTEIN LAB UI v3.1 - SISTEMA DE MISIONES
 * Sistema de cartas con piezas individuales y validación por misiones
 * Las piezas (capítulos/ejercicios/recursos) se combinan para crear seres con propósito
 * v3.1: Tabs horizontales móvil, gestos mejorados, glassmorphism, GPU animations
 *
 * @version 3.1.0
 * @author J. Irurtzun & Claude Sonnet 4.5
 */

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
  }

  /**
   * Inicializar UI del laboratorio
   */
  async init() {
    console.log('🎬 FrankensteinLabUI.init() llamado. isInitialized:', this.isInitialized, 'labStarted:', this.labStarted);

    if (this.isInitialized) {
      console.log('⏭️ Ya inicializado, saltando...');
      return;
    }

    // Inicializar sistema de misiones
    if (typeof FrankensteinMissions !== 'undefined') {
      this.missionsSystem = new FrankensteinMissions();
      console.log('✅ FrankensteinMissions inicializado');
    } else {
      console.error('❌ FrankensteinMissions no disponible');
      return;
    }

    // Inicializar sistema de avatares
    if (typeof FrankensteinAvatarSystem !== 'undefined') {
      this.avatarSystem = new FrankensteinAvatarSystem();
      console.log('✅ FrankensteinAvatarSystem inicializado');
    } else {
      console.warn('⚠️ FrankensteinAvatarSystem no disponible - avatares deshabilitados');
    }

    // Cargar todas las piezas disponibles
    console.log('📦 Cargando piezas disponibles...');
    await this.loadAvailablePieces();
    console.log('✅ Piezas cargadas:', this.availablePieces.length);

    // Si ya se inició antes, ir directo al lab, sino mostrar pantalla de inicio
    if (this.labStarted) {
      console.log('🎮 Lab ya iniciado antes, creando UI directamente');
      this.createLabUI();
      this.attachEventListeners();
    } else {
      console.log('🌟 Primera vez, mostrando pantalla de inicio');
      this.createStartScreen();

      // Si el modo actual es demo, cargar datos automáticamente
      const currentMode = window.FrankensteinQuiz?.getMode();
      if (currentMode === 'demo' && window.FrankensteinDemoData) {
        console.log('📦 Modo demo detectado - cargando datos automáticamente');
        window.FrankensteinDemoData.loadDemoData(this);
      }
    }

    this.isInitialized = true;
    console.log('✅ FrankensteinLabUI inicializado completamente');
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

    // Crear UI del laboratorio
    this.createLabUI();
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
   */
  createStartScreen() {
    const container = document.getElementById('organism-container');
    if (!container) {
      console.error('❌ Contenedor no encontrado para pantalla de inicio');
      return;
    }

    // Establecer fondo vintage aleatorio
    this.setRandomDaVinciBackground();

    console.log('✅ Creando pantalla de inicio en:', container);

    const currentMode = window.FrankensteinQuiz?.getMode() || 'juego';
    const currentDifficulty = window.FrankensteinQuiz?.getDifficulty() || 'iniciado';

    console.log('📊 Modo actual:', currentMode, 'Dificultad:', currentDifficulty);

    const startScreen = document.createElement('div');
    startScreen.id = 'frankenstein-start-screen';
    startScreen.className = 'frankenstein-start-screen';
    startScreen.innerHTML = `
      <div class="start-screen-content">
        <div class="start-screen-header">
          <h1 class="start-screen-title">
            <span class="title-icon">⚡</span>
            Frankenstein Lab
          </h1>
          <p class="start-screen-subtitle">
            Crea seres conscientes combinando conocimiento de los libros
          </p>
        </div>

        <div class="start-screen-config">
          <div class="config-section">
            <div class="config-header">
              <span class="config-icon">🎮</span>
              <h3>Modo de Juego</h3>
            </div>
            <div class="mode-options">
              <button class="mode-card ${currentMode === 'investigacion' ? 'selected' : ''}" data-mode="investigacion">
                <div class="mode-card-icon">🔍</div>
                <div class="mode-card-title">Investigación</div>
                <div class="mode-card-description">Explora libremente sin evaluaciones. Ideal para familiarizarte con el sistema.</div>
              </button>
              <button class="mode-card ${currentMode === 'juego' ? 'selected' : ''}" data-mode="juego">
                <div class="mode-card-icon">🧠</div>
                <div class="mode-card-title">Aprendizaje</div>
                <div class="mode-card-description">Responde quizzes adaptados a tu nivel. El poder de las piezas depende de tu comprensión.</div>
              </button>
              <button class="mode-card ${currentMode === 'demo' ? 'selected' : ''}" data-mode="demo">
                <div class="mode-card-icon">✨</div>
                <div class="mode-card-title">Demo</div>
                <div class="mode-card-description">Explora seres y microsociedades de ejemplo. Sin quizzes, poder moderado.</div>
              </button>
            </div>
          </div>

          <div class="config-section">
            <div class="config-header">
              <span class="config-icon">⚡</span>
              <h3>Dificultad Quiz</h3>
            </div>
            <p class="config-note">Solo aplica en modo Aprendizaje</p>
            <div class="difficulty-options">
              <button class="difficulty-card ${currentDifficulty === 'ninos' ? 'selected' : ''}" data-difficulty="ninos">
                <div class="difficulty-card-icon">🎈</div>
                <div class="difficulty-card-title">Niños</div>
                <div class="difficulty-card-description">Preguntas fáciles con lenguaje sencillo</div>
              </button>
              <button class="difficulty-card ${currentDifficulty === 'principiante' ? 'selected' : ''}" data-difficulty="principiante">
                <div class="difficulty-card-icon">🌱</div>
                <div class="difficulty-card-title">Principiante</div>
                <div class="difficulty-card-description">Preguntas sencillas sobre conceptos básicos</div>
              </button>
              <button class="difficulty-card ${currentDifficulty === 'iniciado' ? 'selected' : ''}" data-difficulty="iniciado">
                <div class="difficulty-card-icon">📚</div>
                <div class="difficulty-card-title">Iniciado</div>
                <div class="difficulty-card-description">Preguntas de complejidad media</div>
              </button>
              <button class="difficulty-card ${currentDifficulty === 'experto' ? 'selected' : ''}" data-difficulty="experto">
                <div class="difficulty-card-icon">🔥</div>
                <div class="difficulty-card-title">Experto</div>
                <div class="difficulty-card-description">Preguntas avanzadas que requieren comprensión profunda</div>
              </button>
            </div>
          </div>
        </div>

        <div class="start-screen-footer">
          <button class="start-button" id="frankenstein-start-button">
            <span>Comenzar</span>
            <span class="start-button-arrow">→</span>
          </button>
          <button class="close-button" id="frankenstein-close-button">
            Cerrar
          </button>
        </div>
      </div>
    `;

    container.appendChild(startScreen);

    // Event listeners para selección de modo
    startScreen.querySelectorAll('.mode-card').forEach(card => {
      card.addEventListener('click', () => {
        startScreen.querySelectorAll('.mode-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        const mode = card.dataset.mode;
        if (window.FrankensteinQuiz) {
          window.FrankensteinQuiz.setMode(mode);
        }

        // Si se activa modo demo, cargar datos de ejemplo
        if (mode === 'demo' && window.FrankensteinDemoData) {
          console.log('📦 Cargando datos de demostración...');
          window.FrankensteinDemoData.loadDemoData(this);
          // Mostrar notificación temporal
          if (window.toast) {
            window.toast.show('✨ Datos de demostración cargados', 'success', 3000);
          }
        }
      });
    });

    // Event listeners para selección de dificultad
    startScreen.querySelectorAll('.difficulty-card').forEach(card => {
      card.addEventListener('click', () => {
        startScreen.querySelectorAll('.difficulty-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        const difficulty = card.dataset.difficulty;
        if (window.FrankensteinQuiz) {
          window.FrankensteinQuiz.setDifficulty(difficulty);
        }
      });
    });

    // Event listener para botón comenzar
    const startButton = startScreen.querySelector('#frankenstein-start-button');
    if (startButton) {
      startButton.addEventListener('click', () => {
        this.startLab();
      });
    }

    // Event listener para botón cerrar
    const closeButton = startScreen.querySelector('#frankenstein-close-button');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        if (this.organism && this.organism.hide) {
          this.organism.hide();
        } else {
          // Fallback: ocultar container y mostrar biblioteca
          const container = document.getElementById('organism-container');
          if (container) {
            container.classList.add('hidden');
          }
          document.getElementById('biblioteca-view')?.classList.remove('hidden');
        }
      });
    }
  }

  /**
   * Set random vintage scientific/technical background image
   */
  setRandomDaVinciBackground() {
    // Array de imágenes vintage descargadas localmente (dominio público)
    // Rutas relativas al directorio www/ para compatibilidad con APK y web
    const vintageImages = [
      // Leonardo da Vinci - Hombre de Vitrubio
      'assets/backgrounds/vitruvio.jpg',

      // Leonardo da Vinci - Estudios del cráneo
      'assets/backgrounds/leonardo-skull.jpg',

      // Frankenstein - Imagen clásica de 1931
      'assets/backgrounds/frankenstein-1931.jpg',

      // Anatomía de tortuga - Ilustración vintage 1821
      'assets/backgrounds/turtle-anatomy.jpg',

      // William Cheselden - Osteographia 1733 (esqueleto humano)
      'assets/backgrounds/cheselden-skeleton.jpg',

      // Giovanni Aldini - Experimentos de galvanismo (electrificación de cadáveres)
      'assets/backgrounds/galvanism-aldini.jpg',

      // Pettigrew - Anatomía espiralista (patrones helicoidales en anatomía)
      'assets/backgrounds/spiralist-anatomy.jpg',

      // Pettigrew - Huesos espiralistas (estructuras óseas helicoidales)
      'assets/backgrounds/spiralist-bones.jpg',

      // Pettigrew - Corazón espiralista (estructura helicoidal del músculo cardíaco)
      'assets/backgrounds/spiralist-heart.jpg'
    ];

    // Seleccionar imagen aleatoria
    const randomIndex = Math.floor(Math.random() * vintageImages.length);
    const selectedImage = vintageImages[randomIndex];

    // Aplicar como variable CSS
    document.documentElement.style.setProperty('--da-vinci-bg', `url('${selectedImage}')`);
  }

  /**
   * Crear estructura HTML del laboratorio
   */
  createLabUI() {
    const container = document.getElementById('organism-container');
    if (!container) {
      console.error('❌ Contenedor del organismo no encontrado');
      return;
    }

    // Limpiar Three.js canvas si existe
    const oldCanvas = container.querySelector('#organism-canvas');
    if (oldCanvas) oldCanvas.remove();
    const loading = container.querySelector('#organism-loading');
    if (loading) loading.remove();

    // Alternar imagen de fondo de Leonardo da Vinci aleatoriamente
    this.setRandomDaVinciBackground();

    container.innerHTML = `
      <div class="frankenstein-laboratory">
        <!-- Header Mejorado -->
        <header class="lab-header lab-header-enhanced">
          <div class="lab-header-content">
            <!-- Lado izquierdo: Menú hamburguesa -->
            <div class="lab-header-left">
              <button class="lab-header-icon-btn" id="btn-menu-hamburger" title="Menú">
                <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 12h18M3 6h18M3 18h18"/>
                </svg>
              </button>
            </div>

            <!-- Centro: Títulos -->
            <div class="lab-header-titles">
              <h1 class="lab-title">🧬 Laboratorio Frankenstein</h1>
              <p class="lab-subtitle">Creación de Seres Transformadores</p>
            </div>

            <!-- Lado derecho: Acciones -->
            <div class="lab-header-actions">
              <button class="lab-header-icon-btn" id="btn-saved-beings" onclick="window.frankensteinLabUI.showSavedBeingsModal()" title="Seres Guardados">
                <span>🗂️</span>
                <span class="header-btn-badge" id="saved-beings-count" style="display:none;">0</span>
              </button>
              <button class="lab-header-icon-btn" id="btn-stats" title="Estadísticas">
                <span>📊</span>
              </button>
              <button class="lab-header-icon-btn" id="btn-settings" title="Ajustes">
                <span>⚙️</span>
              </button>
              <button class="lab-header-icon-btn lab-header-close" id="btn-close-lab" title="Cerrar Laboratorio">
                <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>
        </header>

        <!-- Menú lateral deslizante -->
        <div class="lab-side-menu" id="lab-side-menu">
          <div class="lab-side-menu-overlay" id="lab-menu-overlay"></div>
          <nav class="lab-side-menu-content">
            <div class="lab-menu-header">
              <span class="lab-menu-logo">🧬</span>
              <span class="lab-menu-title">Frankenstein Lab</span>
            </div>
            <ul class="lab-menu-items">
              <li class="lab-menu-item active" data-section="laboratorio">
                <span class="lab-menu-icon">🔬</span>
                <span>Laboratorio</span>
              </li>
              <li class="lab-menu-item" data-section="seres">
                <span class="lab-menu-icon">👤</span>
                <span>Mis Seres</span>
                <span class="lab-menu-badge" id="menu-seres-count">0</span>
              </li>
              <li class="lab-menu-item" data-section="microsociedades">
                <span class="lab-menu-icon">🏛️</span>
                <span>Microsociedades</span>
                <span class="lab-menu-badge" id="menu-micro-count">0</span>
              </li>
              <li class="lab-menu-item" data-section="retos">
                <span class="lab-menu-icon">🏆</span>
                <span>Retos</span>
              </li>
              <li class="lab-menu-divider"></li>
              <li class="lab-menu-item" data-section="ajustes">
                <span class="lab-menu-icon">⚙️</span>
                <span>Ajustes</span>
              </li>
              <li class="lab-menu-item" data-section="estadisticas">
                <span class="lab-menu-icon">📊</span>
                <span>Estadísticas</span>
              </li>
              <li class="lab-menu-item" data-section="ayuda">
                <span class="lab-menu-icon">❓</span>
                <span>Ayuda</span>
              </li>
              <li class="lab-menu-divider"></li>
              <li class="lab-menu-item lab-menu-item-exit" data-section="salir">
                <span class="lab-menu-icon">🚪</span>
                <span>Salir del Lab</span>
              </li>
            </ul>
          </nav>
        </div>

        <!-- Workspace -->
        <div class="lab-workspace">
          <!-- Panel Central: Estado del Ser -->
          <section class="being-display">
            <div class="being-info">
              <h3 class="being-name" id="being-name">Ser sin nombre</h3>
              <p class="being-mission" id="being-mission">No hay misión seleccionada</p>
              <button class="change-mission-btn" id="btn-change-mission">
                🎯 Cambiar Misión
              </button>
            </div>

            <!-- Avatar del Ser -->
            <div id="being-avatar-display" class="being-avatar-display" style="display: none; padding: 1rem; text-align: center;">
              <!-- Avatar se renderiza dinámicamente aquí -->
            </div>

            <!-- Visualización del Hombre de Vitrubio -->
            <div id="vitruvian-being-container" class="vitruvian-container">
              <!-- El Hombre de Vitrubio se renderiza aquí -->
            </div>

            <!-- Atributos del Ser -->
            <div class="being-attributes" id="being-attributes">
              <!-- Barras de atributos se generan dinámicamente -->
            </div>

            <!-- Balance del Ser -->
            <div class="being-balance" id="being-balance">
              <!-- Balance se muestra aquí -->
            </div>

            <!-- Requisitos de la Misión -->
            <div class="mission-requirements-summary" id="mission-requirements-summary" style="display: none;">
              <h3 class="requirements-summary-title">🎯 Requisitos de la Misión</h3>
              <div class="requirements-summary-progress">
                <div class="progress-bar-mini">
                  <div class="progress-fill-mini" id="progress-fill-mini" style="width: 0%"></div>
                </div>
                <span class="progress-label-mini" id="progress-label-mini">0/0 cumplidos</span>
              </div>
              <div class="requirements-list-mini" id="requirements-list-mini">
                <!-- Lista de requisitos se genera aquí -->
              </div>
            </div>

            <!-- Controles -->
            <div class="lab-controls">
              <button class="lab-button" id="btn-clear-selection">
                🔄 Limpiar Selección
              </button>
              <button class="lab-button" id="btn-export-being" disabled>
                📤 Exportar como Prompt
              </button>
              <button class="lab-button primary" id="btn-validate-being" disabled>
                ✨ Validar Misión
              </button>
              <button class="lab-button primary" id="btn-talk-to-being" disabled>
                💬 Hablar con el Ser
              </button>
            </div>

            <!-- Resultados de validación -->
            <div class="validation-results" id="validation-results" style="display: none;">
              <!-- Resultados aparecen aquí -->
            </div>
          </section>

        </div>

        <!-- Floating Action Buttons -->
        <div class="fab-container">
          <button class="fab fab-requirements" id="fab-requirements" title="Ver Requisitos">
            <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
            </svg>
            <span class="fab-label">Requisitos</span>
            <span class="fab-badge" id="fab-requirements-badge">0/0</span>
          </button>
          <button class="fab fab-pieces" id="fab-pieces" title="Ver Piezas">
            <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="7"/>
              <rect x="14" y="3" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/>
            </svg>
            <span class="fab-label">Piezas</span>
            <span class="fab-badge" id="fab-pieces-badge">0</span>
          </button>
        </div>

        <!-- Modal: Requirements Panel -->
        <div class="requirements-modal" id="requirements-modal">
          <div class="requirements-modal-overlay" id="requirements-modal-overlay"></div>
          <div class="requirements-modal-content">
            <div class="requirements-modal-header">
              <h2 class="requirements-modal-title">📋 Requisitos de la Misión</h2>
              <button class="requirements-modal-close" id="requirements-modal-close">
                <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <div class="requirements-modal-body">
              <!-- Requirements Panel -->
              <div class="requirements-panel" id="requirements-panel">
                <!-- Progress Bar -->
                <div class="mission-progress-bar">
                  <div class="mission-name" id="mission-name-display">
                    🎯 <span id="current-mission-name">Sin Misión</span>
                  </div>
                  <div class="progress-track">
                    <div class="progress-fill" id="progress-fill" style="width: 0%">
                      <span class="progress-text" id="progress-text">0/0</span>
                    </div>
                  </div>
                  <div class="power-indicator" id="power-indicator">
                    ⚡ <span id="current-power">0</span> / <span id="required-power">0</span>
                  </div>
                </div>

                <!-- Toggle Requirements Button -->
                <button class="toggle-requirements" id="toggle-requirements">
                  <span>Ver Requisitos</span>
                  <span class="expand-indicator">▼</span>
                </button>

                <!-- Requirements Checklist -->
                <div class="requirements-checklist" id="requirements-checklist">
                  <!-- Requirements se generan dinámicamente -->
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Modal: Pieces Panel -->
        <div class="pieces-modal" id="pieces-modal">
          <div class="pieces-modal-overlay" id="pieces-modal-overlay"></div>
          <div class="pieces-modal-content">
            <div class="pieces-modal-header">
              <h2 class="pieces-modal-title">📦 Piezas Disponibles</h2>
              <button class="pieces-modal-close" id="pieces-modal-close">
                <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <div class="pieces-modal-body">
              <!-- Sticky Header con Requisitos Reducidos -->
              <div class="requirements-sticky-header" id="requirements-sticky-header">
                <div class="sticky-requirements-compact" id="sticky-requirements-compact">
                  <!-- Se genera dinámicamente -->
                </div>
                <div class="sticky-progress-indicator">
                  <div class="sticky-progress-bar">
                    <div class="sticky-progress-fill" id="sticky-progress-fill" style="width: 0%"></div>
                  </div>
                  <span class="sticky-progress-text" id="sticky-progress-text">0/0</span>
                </div>
              </div>

              <!-- Missing Requirements Quick View -->
              <div class="missing-requirements-quick-view" id="missing-requirements-quick-view">
                <div class="quick-view-header">
                  <span class="quick-view-icon">🎯</span>
                  <h3 class="quick-view-title">Requisitos Faltantes</h3>
                  <span class="quick-view-status" id="quick-view-status">0/0</span>
                </div>
                <div class="quick-view-list" id="quick-view-list">
                  <!-- Se genera dinámicamente -->
                </div>
              </div>

              <!-- Filters Bar -->
              <div class="filters-bar">
                <input
                  type="text"
                  class="search-box"
                  id="pieces-search"
                  placeholder="🔍 Buscar piezas..."
                />
                <div class="filter-pills">
                  <button class="filter-pill active" data-filter="all">Todas</button>
                  <button class="filter-pill" data-filter="chapter">💚 Capítulos</button>
                  <button class="filter-pill" data-filter="exercise">💜 Ejercicios</button>
                  <button class="filter-pill" data-filter="resource">💛 Recursos</button>
                  <button class="filter-pill" data-filter="compatible">⚡ Compatibles</button>
                </div>
              </div>

              <!-- Pieces Grid -->
              <div class="pieces-grid" id="pieces-grid">
                <!-- Fichas de piezas se generan dinámicamente -->
              </div>
            </div>
          </div>
        </div>

        <!-- Modal: Selector de Misión -->
        <div class="mission-modal" id="mission-modal">
          <div class="mission-modal-overlay" id="mission-modal-overlay"></div>
          <div class="mission-modal-content">
            <div class="mission-modal-header">
              <h2 class="mission-modal-title">🎯 Selecciona tu Misión</h2>
              <button class="mission-modal-close" id="mission-modal-close">
                <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <div class="mission-modal-body">
              <div class="missions-grid" id="missions-grid">
                <!-- Misiones se generan dinámicamente -->
              </div>
            </div>
          </div>
        </div>

        <!-- Popup Miniatura de Vitruvio -->
        <div class="vitruvian-popup" id="vitruvian-popup">
          <div class="vitruvian-popup-header">
            <span class="vitruvian-popup-title">⚡ Ser en Formación</span>
            <button class="vitruvian-popup-close" id="vitruvian-popup-close">×</button>
          </div>
          <div class="vitruvian-popup-being" id="vitruvian-popup-being">
            <!-- SVG de Vitruvio se clona aquí -->
          </div>
          <div class="vitruvian-popup-info">
            <div class="vitruvian-popup-piece" id="vitruvian-popup-piece">
              <!-- Info de pieza añadida -->
            </div>
            <div class="vitruvian-popup-attributes" id="vitruvian-popup-attributes">
              <!-- Atributos de la pieza -->
            </div>
          </div>
        </div>

        <!-- Partículas flotantes decorativas -->
        ${this.generateFloatingParticles()}
      </div>
    `;

    // Poblar interfaz
    this.populateMissions();
    this.populatePiecesGrid();
    this.updateBeingDisplay();

    // Inicializar visualización del Hombre de Vitrubio
    if (window.VitruvianBeing) {
      this.vitruvianBeing = new VitruvianBeing();
      this.vitruvianBeing.init('vitruvian-being-container');
    }
  }

  /**
   * Poblar grid de misiones
   */
  populateMissions() {
    const grid = document.getElementById('missions-grid');
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
   */
  openMissionModal() {
    const modal = document.getElementById('mission-modal');
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  /**
   * Close Mission Modal
   */
  closeMissionModal() {
    const modal = document.getElementById('mission-modal');
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  selectMission(mission, card) {
    // Deseleccionar anterior (soporta tanto cards como tabs)
    document.querySelectorAll('.mission-card.selected, .mission-tab.selected').forEach(c => {
      c.classList.remove('selected');
    });

    // Seleccionar nueva
    card.classList.add('selected');
    this.selectedMission = mission;
    this.hasShownConfetti = false; // Reset confetti flag

    // Actualizar UI
    document.getElementById('being-mission').textContent = `Misión: ${mission.name}`;
    this.updateBeingDisplay();
    this.updateRequirementsPanel(); // Update requirements panel

    this.showNotification(`🎯 Misión seleccionada: ${mission.name}`, 'info');

    // Close modal after selection
    this.closeMissionModal();
  }

  /**
   * Open Requirements Modal
   */
  openRequirementsModal() {
    const modal = document.getElementById('requirements-modal');
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  /**
   * Close Requirements Modal
   */
  closeRequirementsModal() {
    const modal = document.getElementById('requirements-modal');
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  /**
   * Open Pieces Modal
   */
  openPiecesModal() {
    const modal = document.getElementById('pieces-modal');
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';

      // Cerrar cualquier libro expandido al abrir el modal
      const expandedBooks = document.querySelectorAll('.book-tree-item.expanded');
      expandedBooks.forEach(book => {
        const content = book.querySelector('.book-tree-content');
        const toggle = book.querySelector('.book-tree-toggle');
        const header = book.querySelector('.book-tree-header');
        if (content) content.classList.remove('open');
        if (toggle) toggle.classList.remove('open');
        if (header) header.classList.remove('open');
        book.classList.remove('expanded');
      });

      // Quitar clase del grid
      const grid = document.getElementById('pieces-grid');
      if (grid) grid.classList.remove('has-expanded-book');

      // Update missing requirements when opening
      this.updateMissingRequirementsQuickView();

      // Re-poblar grid para asegurar que esté visible
      const activeFilter = document.querySelector('.filter-pill.active');
      const filter = activeFilter ? activeFilter.dataset.filter : 'all';
      this.populatePiecesGrid(filter);

      // Evaluar estado inicial del sticky header
      setTimeout(() => {
        this.handlePiecesModalScroll();
      }, 100);
    }
  }

  /**
   * Close Pieces Modal
   */
  closePiecesModal() {
    const modal = document.getElementById('pieces-modal');
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  /**
   * Update FAB Badges
   */
  updateFABBadges() {
    // Update requirements badge
    if (this.selectedMission) {
      const requirements = this.selectedMission.requirements || [];
      const fulfilled = this.countFulfilledRequirements(requirements);
      const total = requirements.length;
      const requirementsBadge = document.getElementById('fab-requirements-badge');
      if (requirementsBadge) {
        requirementsBadge.textContent = `${fulfilled}/${total}`;
        requirementsBadge.style.backgroundColor = fulfilled === total ? '#4CAF50' : '#FF9800';
      }
    }

    // Update pieces badge
    const piecesBadge = document.getElementById('fab-pieces-badge');
    if (piecesBadge) {
      piecesBadge.textContent = this.selectedPieces.length;
      piecesBadge.style.backgroundColor = this.selectedPieces.length > 0 ? '#2196F3' : '#757575';
    }
  }

  /**
   * Update Missing Requirements Quick View
   */
  updateMissingRequirementsQuickView() {
    const quickViewList = document.getElementById('quick-view-list');
    const quickViewStatus = document.getElementById('quick-view-status');
    const quickView = document.getElementById('missing-requirements-quick-view');

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
      return;
    }

    quickView.style.display = 'block';

    const requirements = this.selectedMission.requirements || [];

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
        const currentCount = this.selectedPieces.filter(p => p.type === req.type).length;
        const neededCount = req.count || 1;
        const remaining = neededCount - currentCount;

        return `
          <div class="quick-view-item" data-type="${req.type}">
            <span class="quick-view-item-icon">${icon}</span>
            <div class="quick-view-item-content">
              <span class="quick-view-item-text">${req.description || req.type}</span>
              <span class="quick-view-item-count">Faltan: ${remaining}</span>
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
      setTimeout(() => {
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
  }

  /**
   * Poblar grid de piezas (ahora como árbol)
   */
  populatePiecesGrid(filter = 'all') {
    const grid = document.getElementById('pieces-grid');
    if (!grid) return;

    grid.innerHTML = '';

    // Organizar piezas por libro
    const piecesByBook = this.organizePiecesByBook(filter);

    // Crear árbol para cada libro
    Object.entries(piecesByBook).forEach(([bookId, bookData]) => {
      const bookTree = this.createBookTree(bookId, bookData);
      grid.appendChild(bookTree);
    });

    // Update pieces count badge
    this.updatePiecesCountBadge();

    // Initialize drag and drop enhanced
    setTimeout(() => {
      this.initDragAndDropEnhanced();
    }, 100);
  }

  /**
   * Organizar piezas por libro
   */
  organizePiecesByBook(filter) {
    const organized = {};

    this.availablePieces.forEach(piece => {
      // Aplicar filtro
      if (filter !== 'all' && piece.type !== filter) return;

      // Agrupar por libro
      if (!organized[piece.bookId]) {
        organized[piece.bookId] = {
          bookTitle: piece.bookTitle,
          bookId: piece.bookId,
          color: piece.color,
          chapters: {}
        };
      }

      // Agrupar por capítulo
      if (!organized[piece.bookId].chapters[piece.chapterId]) {
        organized[piece.bookId].chapters[piece.chapterId] = {
          chapterTitle: this.getChapterTitle(piece),
          pieces: []
        };
      }

      organized[piece.bookId].chapters[piece.chapterId].pieces.push(piece);
    });

    return organized;
  }

  /**
   * Obtener título del capítulo de una pieza
   */
  getChapterTitle(piece) {
    // Buscar el capítulo original
    const catalog = this.organism.bookEngine?.catalog;
    if (!catalog) {
      return `Capítulo ${piece.chapterId}`;
    }

    const book = catalog.books.find(b => b.id === piece.bookId);
    if (!book) {
      return `Capítulo ${piece.chapterId}`;
    }

    // Intentar obtener capítulos usando el método del organism
    try {
      const chapters = this.organism.getBookChapters(book);
      if (chapters && Array.isArray(chapters)) {
        const chapter = chapters.find(c => c.id === piece.chapterId);
        if (chapter && chapter.title) {
          return chapter.title;
        }
      }
    } catch (error) {
      // Silent error
    }

    // Fallback: buscar en sections si existen y son iterables
    if (book.sections && Array.isArray(book.sections)) {
      for (const section of book.sections) {
        if (section.chapters && Array.isArray(section.chapters)) {
          const chapter = section.chapters.find(c => c.id === piece.chapterId);
          if (chapter && chapter.title) {
            return chapter.title;
          }
        }
      }
    }

    // Fallback: buscar en chapters directamente si existe
    if (book.chapters && Array.isArray(book.chapters)) {
      const chapter = book.chapters.find(c => c.id === piece.chapterId);
      if (chapter && chapter.title) {
        return chapter.title;
      }
    }

    return `Capítulo ${piece.chapterId}`;
  }

  /**
   * Crear árbol de libro
   */
  createBookTree(bookId, bookData) {
    const bookItem = document.createElement('div');
    bookItem.className = 'book-tree-item';
    bookItem.dataset.bookId = bookId;

    // Calcular total de piezas, poder y atributos agregados
    let totalPieces = 0;
    let totalPower = 0;
    const aggregatedAttributes = {};

    Object.values(bookData.chapters).forEach(ch => {
      totalPieces += ch.pieces.length;
      ch.pieces.forEach(piece => {
        const analysis = this.missionsSystem.analyzePiece(piece);
        totalPower += analysis.totalPower;

        // Agregar atributos
        Object.entries(analysis.attributes).forEach(([attr, value]) => {
          if (!aggregatedAttributes[attr]) {
            aggregatedAttributes[attr] = 0;
          }
          aggregatedAttributes[attr] += value;
        });
      });
    });

    // Crear HTML de atributos
    const attributesHTML = Object.entries(aggregatedAttributes)
      .map(([attr, value]) => {
        const attrData = this.missionsSystem.attributes[attr];
        // Validar que attrData existe antes de acceder a sus propiedades
        if (!attrData) {
          return '';
        }
        return `<span class="tree-attribute" title="${attrData.name}: +${value}">${attrData.icon}${value}</span>`;
      })
      .join('');

    const chapterCount = Object.keys(bookData.chapters).length;

    bookItem.innerHTML = `
      <div class="book-tree-header">
        <div style="display: flex; align-items: center; gap: 1rem;">
          <span class="book-tree-toggle" title="Abrir/Cerrar libro">▶</span>
          <span class="book-tree-icon">📚</span>
        </div>
        <div class="book-tree-title">
          <div class="book-tree-title-text">${bookData.bookTitle}</div>
          <div class="book-tree-subtitle">${chapterCount} capítulos • ${totalPieces} piezas de conocimiento</div>
        </div>
        <div class="book-tree-stats">
          <span class="book-tree-power" title="Poder total">⚡ ${totalPower}</span>
          <span class="book-tree-count" title="Piezas totales">📦 ${totalPieces}</span>
        </div>
      </div>
      <div class="book-tree-attributes">
        ${attributesHTML}
      </div>
      <div class="book-tree-content">
        <div class="book-chapters" id="chapters-${bookId}">
          <!-- Capítulos se insertan aquí -->
        </div>
      </div>
    `;

    const header = bookItem.querySelector('.book-tree-header');
    const toggle = bookItem.querySelector('.book-tree-toggle');
    const content = bookItem.querySelector('.book-tree-content');

    header.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const isOpen = content.classList.contains('open');
      const grid = document.getElementById('pieces-grid');
      const stickyHeader = document.getElementById('requirements-sticky-header');

      if (isOpen) {
        // Cerrar este libro
        toggle.classList.remove('open');
        header.classList.remove('open');
        content.classList.remove('open');
        bookItem.classList.remove('expanded');

        // Quitar clase del grid
        if (grid) {
          grid.classList.remove('has-expanded-book');
        }

        // Remover clase del body
        document.body.classList.remove('book-expanded');

        // Ocultar sticky header al cerrar libro
        if (stickyHeader) {
          stickyHeader.classList.remove('visible');
        }
      } else {
        // COMPORTAMIENTO DE ACORDEÓN: Cerrar todos los demás libros primero
        document.querySelectorAll('.book-tree-content.open').forEach(openContent => {
          const openItem = openContent.closest('.book-tree-item');
          const openToggle = openItem.querySelector('.book-tree-toggle');
          const openHeader = openItem.querySelector('.book-tree-header');
          openToggle.classList.remove('open');
          openHeader.classList.remove('open');
          openContent.classList.remove('open');
          openItem.classList.remove('expanded');
        });

        // Abrir este libro y expandirlo
        toggle.classList.add('open');
        header.classList.add('open');
        content.classList.add('open');
        bookItem.classList.add('expanded');

        // Añadir clase al grid para mostrar solo este libro
        if (grid) {
          grid.classList.add('has-expanded-book');
        }

        // Agregar clase al body para ocultar elementos
        document.body.classList.add('book-expanded');

        // Mostrar sticky header al expandir libro
        if (stickyHeader) {
          stickyHeader.classList.add('visible');
          this.updateStickyRequirementsHeader();
        }

        // No hacer scroll automático - el libro ahora es absolute y toma control de la vista
      }
    });

    // Añadir capítulos
    const chaptersContainer = bookItem.querySelector(`#chapters-${bookId}`);
    Object.entries(bookData.chapters).forEach(([chapterId, chapterData]) => {
      const chapterTree = this.createChapterTree(bookId, chapterId, chapterData);
      chaptersContainer.appendChild(chapterTree);
    });

    return bookItem;
  }

  /**
   * Crear árbol de capítulo
   */
  createChapterTree(bookId, chapterId, chapterData) {
    const chapterItem = document.createElement('div');
    chapterItem.className = 'chapter-tree-item';
    chapterItem.dataset.chapterId = chapterId;

    // Calcular poder total y atributos del capítulo
    let totalPower = 0;
    const aggregatedAttributes = {};

    chapterData.pieces.forEach(piece => {
      const analysis = this.missionsSystem.analyzePiece(piece);
      totalPower += analysis.totalPower;

      // Agregar atributos
      Object.entries(analysis.attributes).forEach(([attr, value]) => {
        if (!aggregatedAttributes[attr]) {
          aggregatedAttributes[attr] = 0;
        }
        aggregatedAttributes[attr] += value;
      });
    });

    // Asegurar que tenemos un título válido
    const chapterTitle = chapterData.chapterTitle || `Capítulo ${chapterId}`;

    // Crear HTML de atributos
    const attributesHTML = Object.entries(aggregatedAttributes)
      .map(([attr, value]) => {
        const attrData = this.missionsSystem.attributes[attr];
        // Validar que attrData existe antes de acceder a sus propiedades
        if (!attrData) {
          return '';
        }
        return `<span class="tree-attribute" title="${attrData.name}: +${value}">${attrData.icon}${value}</span>`;
      })
      .join('');

    chapterItem.innerHTML = `
      <div class="chapter-tree-header">
        <span class="chapter-tree-toggle">▶</span>
        <span class="chapter-tree-icon">📖</span>
        <span class="chapter-tree-title">${chapterTitle}</span>
        <span class="chapter-tree-stats">
          <span class="chapter-tree-count" title="Piezas">${chapterData.pieces.length}</span>
          <span class="chapter-tree-power" title="Poder total">⚡${totalPower}</span>
        </span>
      </div>
      <div class="chapter-tree-attributes">
        ${attributesHTML}
      </div>
      <div class="chapter-tree-content">
        <div class="chapter-pieces" id="pieces-${bookId}-${chapterId}">
          <!-- Piezas se insertan aquí -->
        </div>
      </div>
    `;

    const header = chapterItem.querySelector('.chapter-tree-header');
    const toggle = chapterItem.querySelector('.chapter-tree-toggle');
    const content = chapterItem.querySelector('.chapter-tree-content');

    header.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const isOpen = content.classList.contains('open');

      if (isOpen) {
        toggle.classList.remove('open');
        header.classList.remove('open');
        content.classList.remove('open');
      } else {
        toggle.classList.add('open');
        header.classList.add('open');
        content.classList.add('open');
      }
    });

    // Añadir piezas
    const piecesContainer = chapterItem.querySelector(`#pieces-${bookId}-${chapterId}`);
    chapterData.pieces.forEach(piece => {
      const card = this.createPieceCard(piece);
      piecesContainer.appendChild(card);
    });

    return chapterItem;
  }

  /**
   * Crear carta de pieza
   */
  createPieceCard(piece) {
    const card = document.createElement('div');
    card.className = 'piece-card';
    card.dataset.pieceId = piece.id;
    card.dataset.type = piece.type;
    card.style.borderColor = piece.color;

    // Analizar atributos que aporta esta pieza
    const analysis = this.missionsSystem.analyzePiece(piece);
    const attributesHTML = Object.entries(analysis.attributes)
      .map(([attr, value]) => {
        const attrData = this.missionsSystem.attributes[attr];
        // Validar que attrData existe antes de acceder a sus propiedades
        if (!attrData) {
          return '';
        }
        return `<span class="piece-attribute"
          data-tooltip-type="attribute"
          data-tooltip-name="${attrData.name}"
          data-tooltip-icon="${attrData.icon}"
          data-tooltip-value="${value}"
          data-tooltip-desc="${attrData.description || attrData.name}"
        >${attrData.icon} ${value}</span>`;
      })
      .join(' ');

    card.innerHTML = `
      <span class="piece-icon">${piece.icon}</span>
      <span class="piece-type-badge">${this.getTypeLabel(piece.type)}</span>
      <span class="piece-title">${piece.title}</span>
      <div class="piece-attributes-preview">
        ${attributesHTML}
      </div>
      <span class="piece-power">⚡ ${analysis.totalPower}</span>
    `;

    card.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.togglePieceSelectionEnhanced(piece, card);
    });

    return card;
  }

  /**
   * Obtener etiqueta de tipo
   */
  getTypeLabel(type) {
    const labels = {
      chapter: 'Capítulo',
      exercise: 'Ejercicio',
      resource: 'Recurso'
    };
    return labels[type] || type;
  }

  /**
   * Toggle selección de pieza
   */
  async togglePieceSelection(piece, card) {
    // Si ya está seleccionada, deseleccionar
    if (card.classList.contains('selected')) {
      card.classList.remove('selected');
      this.selectedPieces = this.selectedPieces.filter(p => p.id !== piece.id);

      // Actualizar display del ser
      this.updateBeingFromPieces();
      // Update requirements panel
      this.updateRequirementsPanel();
      return;
    }

    // Máximo 12 piezas
    if (this.selectedPieces.length >= 12) {
      this.showNotification('Máximo 12 piezas para un ser', 'warning');
      return;
    }

    // EN MODO JUEGO: Mostrar quiz antes de añadir pieza
    if (window.FrankensteinQuiz) {
      const currentMode = window.FrankensteinQuiz.getMode();
      console.log(`[FrankensteinUI] Quiz mode: ${currentMode}, piece: ${piece.title} (${piece.bookId}/${piece.chapterId})`);

      if (currentMode === 'juego') {
        try {
          console.log(`[FrankensteinUI] Showing quiz for ${piece.bookId}/${piece.chapterId}`);
          const quizResult = await window.FrankensteinQuiz.showQuizModal(
            piece,
            piece.bookId,
            piece.chapterId
          );

          console.log(`[FrankensteinUI] Quiz result:`, quizResult);

          if (!quizResult.skipped) {
            // Aplicar multiplicador de poder a la pieza
            piece.powerMultiplier = quizResult.powerMultiplier;

            // Guardar resultado del quiz
            piece.quizScore = quizResult.correctCount;
            piece.quizTotal = quizResult.totalQuestions;
          }
        } catch (error) {
          console.error('[FrankensteinUI] Error en quiz:', error);
          // Si hay error, continuar sin quiz
        }
      } else {
        console.log(`[FrankensteinUI] Skipping quiz - mode is "${currentMode}"`);
      }
    } else {
      console.warn('[FrankensteinUI] FrankensteinQuiz not available');
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
    document.getElementById('btn-export-being').disabled = false;
    document.getElementById('btn-validate-being').disabled = !this.selectedMission;
    document.getElementById('btn-talk-to-being').disabled = false;
  }

  /**
   * Actualizar display del ser
   */
  updateBeingDisplay() {
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
  }

  /**
   * Actualizar display del avatar
   */
  updateAvatarDisplay() {
    const container = document.getElementById('being-avatar-display');
    if (!container) return;

    // Si no hay sistema de avatares o no hay ser, ocultar
    if (!this.avatarSystem || !this.currentBeing || this.selectedPieces.length === 0) {
      container.style.display = 'none';
      return;
    }

    // Generar avatar y visualizaciones
    const avatarUrl = this.avatarSystem.generateAvatarUrl(this.currentBeing);
    const beingEmoji = this.avatarSystem.getBeingEmoji(this.currentBeing);
    const bgGradient = this.avatarSystem.generateBeingGradient(this.currentBeing);
    const radarChart = this.avatarSystem.generateRadarChart(this.currentBeing.attributes, 180);

    // Mostrar y renderizar
    container.style.display = 'block';
    container.style.background = bgGradient;
    container.style.borderRadius = '12px';
    container.style.border = '2px solid rgba(139, 115, 85, 0.4)';
    container.style.backdropFilter = 'blur(10px)';

    container.innerHTML = `
      <div style="display: flex; gap: 2rem; align-items: center; justify-content: center; flex-wrap: wrap;">
        <div style="position: relative;">
          <div style="width: 140px; height: 140px; border-radius: 50%; overflow: hidden; border: 3px solid var(--franken-brass); box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4); background: rgba(0, 0, 0, 0.2);">
            <img src="${avatarUrl}" alt="Avatar del Ser" style="width: 100%; height: 100%; object-fit: cover;">
          </div>
          <div style="position: absolute; bottom: -10px; right: -10px; width: 48px; height: 48px; border-radius: 50%; background: linear-gradient(135deg, var(--franken-brass), var(--franken-copper)); border: 2px solid var(--franken-parchment); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);">
            ${beingEmoji}
          </div>
        </div>

        <div style="flex: 1; min-width: 200px; max-width: 300px;">
          ${radarChart}
          <p style="margin-top: 0.5rem; font-size: 0.8rem; color: var(--franken-parchment); opacity: 0.7; text-align: center;">
            Gráfico de Atributos
          </p>
        </div>
      </div>
    `;
  }

  /**
   * Actualizar barras de atributos
   */
  updateAttributeBars() {
    const container = document.getElementById('being-attributes');
    if (!container || !this.missionsSystem) return;

    const attributes = this.currentBeing?.attributes || {};
    const requiredAttrs = this.selectedMission?.requiredAttributes || {};

    // Show container if there are pieces selected
    if (this.selectedPieces.length > 0) {
      container.style.display = 'block';
    } else {
      container.style.display = 'none';
      return;
    }

    let html = '<h3 class="attributes-title">Atributos del Ser</h3><div class="attributes-bars">';

    Object.entries(this.missionsSystem.attributes).forEach(([key, attrData]) => {
      const current = attributes[key] || 0;
      const required = requiredAttrs[key] || 0;
      const percentage = required > 0 ? Math.min((current / required) * 100, 100) : (current > 0 ? 100 : 0);
      const status = current >= required ? 'met' : 'unmet';

      html += `
        <div class="attribute-bar" data-status="${status}">
          <div class="attribute-label">
            <span class="attribute-icon">${attrData.icon}</span>
            <span class="attribute-name">${attrData.name}</span>
            <span class="attribute-value">${current}${required > 0 ? `/${required}` : ''}</span>
          </div>
          <div class="attribute-progress">
            <div class="attribute-fill" style="width: ${percentage}%; background-color: ${attrData.color};"></div>
          </div>
        </div>
      `;
    });

    html += '</div>';
    container.innerHTML = html;
  }

  /**
   * Actualizar balance
   */
  updateBalance() {
    const container = document.getElementById('being-balance');
    if (!container || !this.currentBeing) {
      container.innerHTML = '<p style="text-align: center; color: var(--franken-sepia);">Selecciona piezas para ver el balance</p>';
      return;
    }

    const balance = this.currentBeing.balance;

    container.innerHTML = `
      <h3 class="balance-title">Balance del Ser</h3>
      <div class="balance-categories">
        <div class="balance-item">
          <span class="balance-label">🧠 Intelectual</span>
          <span class="balance-value">${balance.intellectual}</span>
        </div>
        <div class="balance-item">
          <span class="balance-label">❤️ Emocional</span>
          <span class="balance-value">${balance.emotional}</span>
        </div>
        <div class="balance-item">
          <span class="balance-label">⚡ Acción</span>
          <span class="balance-value">${balance.action}</span>
        </div>
        <div class="balance-item">
          <span class="balance-label">🌟 Espiritual</span>
          <span class="balance-value">${balance.spiritual}</span>
        </div>
        <div class="balance-item">
          <span class="balance-label">🔧 Práctico</span>
          <span class="balance-value">${balance.practical}</span>
        </div>
      </div>
      <div class="balance-harmony">
        <span>Armonía:</span>
        <div class="harmony-bar">
          <div class="harmony-fill" style="width: ${balance.harmony}%"></div>
        </div>
        <span>${Math.round(balance.harmony)}%</span>
      </div>
      <p class="balance-total">Poder Total: ${balance.total}</p>
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
      setTimeout(() => this.playLightningEffect(), 300);
      setTimeout(() => this.playLightningEffect(), 600);
    }
  }

  /**
   * Mostrar resultados de validación
   */
  showValidationResults(results) {
    const container = document.getElementById('validation-results');
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
    if (!this.currentBeing || !this.selectedMission) {
      this.showNotification('No hay ser para exportar', 'warning');
      return;
    }

    const prompt = this.generateBeingPrompt();

    // Copiar al portapapeles
    navigator.clipboard.writeText(prompt).then(() => {
      this.showNotification('📋 Prompt copiado al portapapeles', 'success', 4000);
    }).catch(err => {
      console.error('Error copiando:', err);
    });

    // También mostrar en modal
    this.showPromptModal(prompt);
  }

  /**
   * Generar prompt del ser
   */
  generateBeingPrompt() {
    const being = this.currentBeing;
    const mission = this.selectedMission;

    let prompt = `Eres un Ser Transformador creado en el Laboratorio Frankenstein de la Colección Nuevo Ser.

MISIÓN: ${mission.name}
${mission.longDescription}

ATRIBUTOS:
`;

    Object.entries(being.attributes).forEach(([key, value]) => {
      const attrData = this.missionsSystem.attributes[key];
      prompt += `- ${attrData.icon} ${attrData.name}: ${value}\n`;
    });

    prompt += `
BALANCE:
- 🧠 Intelectual: ${being.balance.intellectual}
- ❤️ Emocional: ${being.balance.emotional}
- ⚡ Acción: ${being.balance.action}
- 🌟 Espiritual: ${being.balance.spiritual}
- 🔧 Práctico: ${being.balance.practical}
- Armonía: ${Math.round(being.balance.harmony)}%

CONOCIMIENTO BASE:
${being.pieces.map(p => `- ${p.piece.title} (${p.piece.bookTitle})`).join('\n')}

Como este ser, debes:
1. Actuar según tus atributos y balance específicos
2. Usar el conocimiento de las piezas que te componen
3. Cumplir tu misión: ${mission.description}
4. Mantener coherencia con tu propósito transformador

Cuando interactúes, habla desde tu identidad única como este ser, no como una IA genérica.`;

    return prompt;
  }

  /**
   * Mostrar prompt en modal
   */
  showPromptModal(prompt) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
      <div class="bg-slate-900 rounded-xl border-2 border-cyan-500 p-6 max-w-2xl w-full max-h-[80vh] overflow-auto">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-xl font-bold text-cyan-300">Prompt del Ser</h3>
          <button class="text-white hover:text-red-400" onclick="this.closest('.fixed').remove()">✕</button>
        </div>
        <pre class="bg-slate-800 p-4 rounded text-sm text-gray-300 overflow-auto">${prompt}</pre>
        <div class="mt-4 flex gap-2">
          <button class="lab-button primary" onclick="navigator.clipboard.writeText(\`${prompt.replace(/`/g, '\\`')}\`); window.toast?.success('Copiado')">
            📋 Copiar
          </button>
          <button class="lab-button" onclick="window.frankensteinLabUI.talkToBeing()">
            💬 Hablar con el Ser
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
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

    // Cerrar modal si está abierto
    const modal = document.querySelector('.fixed.inset-0');
    if (modal) modal.remove();

    // Abrir chat de IA con el prompt
    if (window.aiChatModal) {
      window.aiChatModal.open();

      setTimeout(() => {
        const input = document.getElementById('ai-chat-input');
        if (input) {
          input.value = `${prompt}\n\n---\n\nHola, comencemos a trabajar juntos en tu misión.`;
          input.focus();
        }
      }, 200);
    } else {
      this.showNotification('Chat de IA no disponible', 'error');
    }
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

    // Resetear indicador de poder si está disponible
    if (window.powerIndicator) {
      window.powerIndicator.update(0, 0);
    }

    // Ocultar resultados
    document.getElementById('validation-results').style.display = 'none';

    // Desactivar botones
    document.getElementById('btn-export-being').disabled = true;
    document.getElementById('btn-validate-being').disabled = true;
    document.getElementById('btn-talk-to-being').disabled = true;

    this.updateBeingDisplay();
    this.showNotification('Selección limpiada', 'info');
  }

  /**
   * Efecto de relámpago
   */
  playLightningEffect() {
    const lightning = document.createElement('div');
    lightning.className = 'fusion-lightning';
    document.querySelector('.frankenstein-laboratory')?.appendChild(lightning);
    setTimeout(() => lightning.remove(), 1000);
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

    setTimeout(() => {
      notification.style.transition = 'opacity 0.5s';
      notification.style.opacity = '0';
      setTimeout(() => notification.remove(), 500);
    }, duration);
  }

  /**
   * Generar partículas flotantes decorativas
   */
  generateFloatingParticles() {
    let html = '';
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * 100;
      const y = Math.random() * 100;
      const delay = Math.random() * 6;
      html += `<div class="floating-particle" style="left: ${x}%; top: ${y}%; animation-delay: ${delay}s;"></div>`;
    }
    return html;
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

    // Bottom Sheet - Swipe Gestures
    this.initBottomSheetGestures();

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

    // Open mission modal on first load if no mission selected
    if (!this.selectedMission) {
      setTimeout(() => this.openMissionModal(), 500);
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

    if (!window.createMicroSocietyFromBeings) {
      this.showNotification('⚠️ Sistema de Microsociedades no disponible', 'error');
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

    // Llamar función global para crear la microsociedad
    window.createMicroSocietyFromBeings(beings);

    this.showNotification(`🌍 Microsociedad creada con ${count} seres`, 'success');
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
          console.warn('No se pudo sincronizar con Supabase:', err);
        });
      }

      this.showNotification(`✅ Ser "${savedBeing.name}" guardado exitosamente`, 'success', 4000);
      return true;
    } catch (error) {
      console.error('Error guardando ser:', error);
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
      console.error('Error cargando seres:', error);
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

      // Restaurar estado
      this.currentBeing = savedBeing.being;
      this.selectedMission = savedBeing.mission;
      this.selectedPieces = savedBeing.pieces;
      this.lastValidationResults = savedBeing.validation;

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
      // Actualizar UI
      this.updateBeingDisplay();

      // Marcar piezas como seleccionadas
      this.selectedPieces.forEach(piece => {
        const card = document.querySelector(`[data-piece-id="${piece.id}"]`);
        if (card) {
          card.classList.add('selected');
        }
      });

      this.showNotification(`✅ Ser "${savedBeing.name}" cargado`, 'success', 3000);
      return true;
    } catch (error) {
      console.error('Error cargando ser:', error);
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
      console.error('Error eliminando ser:', error);
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
      console.log('✅ Ser sincronizado con Supabase');
    } catch (error) {
      console.warn('Error en Supabase sync:', error);
      // No lanzar error, es opcional
    }
  }

  /**
   * Mostrar modal de seres guardados
   */
  showSavedBeingsModal() {
    const savedBeings = this.loadBeings();

    const modal = document.createElement('div');
    modal.id = 'saved-beings-modal';

    modal.innerHTML = `
      <div class="saved-beings-header">
        <h3>🗂️ Seres Guardados</h3>
        <button class="saved-beings-close" onclick="this.closest('#saved-beings-modal').remove()">✕</button>
      </div>

      <div class="saved-beings-body">
        ${savedBeings.length === 0 ? `
          <div class="empty-beings-state" style="text-align: center; padding: 4rem 2rem;">
            <svg width="120" height="120" viewBox="0 0 120 120" style="margin: 0 auto 2rem; opacity: 0.3;">
              <circle cx="60" cy="60" r="50" fill="none" stroke="var(--franken-brass)" stroke-width="2"/>
              <path d="M 40 50 L 50 60 L 40 70 M 80 50 L 70 60 L 80 70" stroke="var(--franken-brass)" stroke-width="3" fill="none" stroke-linecap="round"/>
              <path d="M 45 85 Q 60 95 75 85" stroke="var(--franken-brass)" stroke-width="3" fill="none" stroke-linecap="round"/>
            </svg>
            <p style="color: var(--franken-parchment); font-size: 1.2rem; margin-bottom: 0.5rem;">No hay seres guardados todavía</p>
            <p style="color: rgba(244, 233, 216, 0.6); font-size: 0.9rem;">Crea un ser y usa el botón "Guardar Ser" para preservarlo</p>
          </div>
        ` : `
          <div class="beings-grid" style="display: grid; gap: 1rem;">
            ${savedBeings.map(saved => {
              // Manejar tanto estructura antigua como nueva (demo data)
              const totalPower = saved.totalPower || saved.being?.totalPower || 0;
              const pieceCount = saved.pieceCount || saved.pieces?.length || 0;
              const timestamp = saved.timestamp || saved.createdAt;

              // Generar avatar URL y colores si el sistema está disponible
              let avatarUrl = '';
              let bgGradient = '';
              let beingEmoji = '🧬';
              let radarChart = '';

              if (this.avatarSystem && saved.being) {
                avatarUrl = this.avatarSystem.generateAvatarUrl(saved.being);
                bgGradient = this.avatarSystem.generateBeingGradient(saved.being);
                beingEmoji = this.avatarSystem.getBeingEmoji(saved.being);
                radarChart = this.avatarSystem.generateRadarChart(saved.being.attributes, 120);
              }

              return `
              <div class="being-card" style="background: ${bgGradient || 'rgba(34, 28, 23, 0.6)'}; border: 2px solid rgba(139, 115, 85, 0.4); backdrop-filter: blur(10px); position: relative; overflow: hidden;">
                ${avatarUrl ? `
                  <div style="position: absolute; top: -20px; right: -20px; width: 120px; height: 120px; opacity: 0.15; transform: rotate(15deg);">
                    <img src="${avatarUrl}" alt="Avatar" style="width: 100%; height: 100%; object-fit: cover; border-radius: 12px;">
                  </div>
                ` : ''}

                <div style="display: flex; justify-content: space-between; align-items: start; gap: 1rem; position: relative; z-index: 1;">
                  <div style="flex: 1; min-width: 0; display: flex; gap: 1rem;">
                    ${avatarUrl ? `
                      <div style="flex-shrink: 0; width: 80px; height: 80px; border-radius: 12px; overflow: hidden; border: 2px solid var(--franken-brass); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);">
                        <img src="${avatarUrl}" alt="${saved.name}" style="width: 100%; height: 100%; object-fit: cover;">
                      </div>
                    ` : `
                      <div style="flex-shrink: 0; width: 80px; height: 80px; border-radius: 12px; background: rgba(139, 92, 246, 0.2); border: 2px solid var(--franken-brass); display: flex; align-items: center; justify-content: center; font-size: 3rem;">
                        ${beingEmoji}
                      </div>
                    `}

                    <div style="flex: 1; min-width: 0;">
                      <h4 style="font-size: 1.2rem; font-weight: 700; color: var(--franken-brass); margin-bottom: 0.5rem; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);">${saved.name}</h4>
                      <p style="font-size: 0.9rem; color: var(--franken-parchment); opacity: 0.8; margin-bottom: 0.25rem;">
                        🎯 ${saved.mission.name}
                      </p>
                      <p style="font-size: 0.85rem; color: var(--franken-parchment); opacity: 0.7;">
                        ⚡ ${Math.round(totalPower)} poder | 🧩 ${pieceCount} piezas
                      </p>
                      <p style="font-size: 0.75rem; color: var(--franken-parchment); opacity: 0.5; margin-top: 0.25rem;">
                        Creado: ${new Date(timestamp).toLocaleString('es-ES')}
                      </p>
                    </div>
                  </div>

                  <div style="display: flex; gap: 0.5rem; flex-shrink: 0;">
                    <button
                      class="lab-button secondary"
                      style="font-size: 0.85rem; padding: 0.5rem 1rem;"
                      onclick="window.frankensteinLabUI.loadBeing('${saved.id}'); document.getElementById('saved-beings-modal').remove()">
                      📥 Cargar
                    </button>
                    <button
                      class="lab-button"
                      style="font-size: 0.85rem; padding: 0.5rem 1rem; background: rgba(244, 67, 54, 0.2); border-color: rgba(244, 67, 54, 0.4);"
                      onclick="if(confirm('¿Eliminar este ser?')) { window.frankensteinLabUI.deleteBeing('${saved.id}'); this.closest('.being-card').remove(); if(document.querySelectorAll('.being-card').length === 0) { document.getElementById('saved-beings-modal').remove(); window.frankensteinLabUI.showSavedBeingsModal(); } }">
                      🗑️
                    </button>
                  </div>
                </div>

                <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid rgba(139, 115, 85, 0.3); display: flex; gap: 1rem; align-items: start;">
                  ${radarChart ? `
                    <div style="flex-shrink: 0;">
                      ${radarChart}
                    </div>
                  ` : ''}

                  <div style="flex: 1; min-width: 0;">
                    <p style="font-size: 0.75rem; color: var(--franken-parchment); opacity: 0.6; margin-bottom: 0.5rem;">Atributos principales:</p>
                    <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                      ${Object.entries(saved.being.attributes)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 5)
                        .map(([attr, value]) => {
                          const attrData = this.missionsSystem.attributes[attr];
                          return `<span style="font-size: 0.75rem; background: rgba(139, 115, 85, 0.2); padding: 0.25rem 0.75rem; border-radius: 6px; color: var(--franken-parchment); border: 1px solid rgba(139, 115, 85, 0.3);">${attrData?.icon || '📊'} ${attrData?.name || attr}: ${value}</span>`;
                        }).join('')}
                    </div>
                  </div>
                </div>
              </div>
              `;
            }).join('')}
          </div>
        `}
      </div>
    `;

    document.body.appendChild(modal);

    // Añadir bloqueo de scroll del body
    document.body.classList.add('modal-open');

    // Inicializar swipe-to-close si mobileGestures está disponible
    if (window.mobileGestures) {
      window.mobileGestures.setupSwipeToCloseModal(modal, () => {
        modal.remove();
        document.body.classList.remove('modal-open');
      });
    }

    // Añadir listener al botón de cerrar
    const closeButton = modal.querySelector('.saved-beings-close');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        modal.remove();
        document.body.classList.remove('modal-open');
      });
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
   * Initialize Bottom Sheet Swipe Gestures
   */
  initBottomSheetGestures() {
    const bottomSheet = document.getElementById('pieces-bottom-sheet');
    const handle = document.getElementById('bottom-sheet-handle');

    if (!bottomSheet || !handle) return;

    // Usar el sistema de gestos móviles si está disponible
    if (window.mobileGestures) {
      console.log('🎯 Usando MobileGestures avanzado para bottom sheet');

      window.mobileGestures.setupBottomSheet(bottomSheet, {
        states: {
          collapsed: 0.1,  // 10% visible
          half: 0.5,       // 50% visible
          full: 0.9        // 90% visible
        },
        onStateChange: (state) => {
          console.log('📍 Bottom sheet state:', state);
          this.currentBottomSheetState = state;

          // Actualizar clases CSS
          bottomSheet.classList.remove('collapsed', 'half', 'full');
          bottomSheet.classList.add(state);

          // Bloquear scroll del workspace si está full
          if (state === 'full') {
            window.mobileGestures.lockScroll('.lab-workspace');
          } else {
            window.mobileGestures.unlockScroll('.lab-workspace');
          }
        }
      });

      this.currentBottomSheetState = 'collapsed';
      return;
    }

    // Fallback: implementación básica si mobileGestures no está disponible
    console.log('⚠️ MobileGestures no disponible, usando implementación básica');

    let startY = 0;
    let currentY = 0;
    let isDragging = false;
    let currentState = 'collapsed';

    // Touch Events
    handle.addEventListener('touchstart', (e) => {
      startY = e.touches[0].clientY;
      isDragging = true;
      bottomSheet.style.transition = 'none';
    }, { passive: true });

    handle.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      currentY = e.touches[0].clientY;
      const deltaY = currentY - startY;

      const currentTransform = this.getBottomSheetTransform(currentState);
      bottomSheet.style.transform = `translateY(calc(${currentTransform} + ${deltaY}px))`;
    }, { passive: true });

    handle.addEventListener('touchend', (e) => {
      if (!isDragging) return;
      isDragging = false;
      bottomSheet.style.transition = '';

      const deltaY = currentY - startY;
      const threshold = 100;

      if (deltaY < -threshold) {
        currentState = this.expandBottomSheet(currentState);
      } else if (deltaY > threshold) {
        currentState = this.collapseBottomSheet(currentState);
      } else {
        this.setBottomSheetState(currentState);
      }

      this.currentBottomSheetState = currentState;
    }, { passive: true });

    this.currentBottomSheetState = 'collapsed';
  }

  /**
   * Get transform value for current state
   */
  getBottomSheetTransform(state) {
    switch (state) {
      case 'collapsed': return 'calc(100% - 60px)';
      case 'half': return '50%';
      case 'full': return '0';
      default: return 'calc(100% - 60px)';
    }
  }

  /**
   * Expand Bottom Sheet (up)
   */
  expandBottomSheet(currentState) {
    if (currentState === 'collapsed') {
      this.setBottomSheetState('half');
      return 'half';
    } else if (currentState === 'half') {
      this.setBottomSheetState('full');
      return 'full';
    }
    return currentState;
  }

  /**
   * Collapse Bottom Sheet (down)
   */
  collapseBottomSheet(currentState) {
    if (currentState === 'full') {
      this.setBottomSheetState('half');
      return 'half';
    } else if (currentState === 'half') {
      this.setBottomSheetState('collapsed');
      return 'collapsed';
    }
    return currentState;
  }

  /**
   * Set Bottom Sheet State
   */
  setBottomSheetState(state) {
    const bottomSheet = document.getElementById('pieces-bottom-sheet');
    if (!bottomSheet) return;

    bottomSheet.classList.remove('collapsed', 'half', 'full');
    bottomSheet.classList.add(state);
  }

  /**
   * Toggle Bottom Sheet (click on header)
   */
  toggleBottomSheet() {
    const currentState = this.currentBottomSheetState || 'collapsed';

    if (currentState === 'collapsed') {
      this.setBottomSheetState('half');
      this.currentBottomSheetState = 'half';
    } else if (currentState === 'half') {
      this.setBottomSheetState('full');
      this.currentBottomSheetState = 'full';
    } else {
      this.setBottomSheetState('collapsed');
      this.currentBottomSheetState = 'collapsed';
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

    const mission = this.selectedMission;
    const requirements = mission.requirements || [];

    // Update mission name
    const missionNameEl = document.getElementById('current-mission-name');
    if (missionNameEl) {
      missionNameEl.textContent = mission.name;
    }

    // Update power indicator
    const currentPower = this.calculateCurrentPower();
    const requiredPower = mission.minPower || 0;

    document.getElementById('current-power').textContent = Math.floor(currentPower);
    document.getElementById('required-power').textContent = requiredPower;

    // Update progress bar
    const fulfilled = this.countFulfilledRequirements(requirements);
    const total = requirements.length;
    const percentage = total > 0 ? (fulfilled / total) * 100 : 0;

    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');

    if (progressFill) {
      progressFill.style.width = `${percentage}%`;
      if (percentage > this.lastProgressPercentage) {
        progressFill.classList.add('increased');
        setTimeout(() => progressFill.classList.remove('increased'), 600);
      }
    }

    if (progressText) {
      progressText.textContent = `${fulfilled}/${total}`;
    }

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
  }

  /**
   * Update Requirements Checklist
   */
  updateRequirementsChecklist(requirements) {
    const checklist = document.getElementById('requirements-checklist');
    if (!checklist) return;

    checklist.innerHTML = requirements.map(req => {
      const fulfilled = this.isRequirementFulfilled(req);
      const conflict = this.hasRequirementConflict(req);

      const className = fulfilled ? 'fulfilled' : (conflict ? 'conflict' : '');
      const icon = this.getRequirementIcon(req.type);
      const status = fulfilled ? '✅' : (conflict ? '🔴' : '⬜');

      return `
        <div class="requirement-item ${className}">
          <div class="requirement-icon">${icon}</div>
          <div class="requirement-text">${req.description || req.type}</div>
          <div class="requirement-status">${status}</div>
        </div>
      `;
    }).join('');
  }

  /**
   * Clear Requirements Panel
   */
  clearRequirementsPanel() {
    document.getElementById('current-mission-name').textContent = 'Sin Misión';
    document.getElementById('current-power').textContent = '0';
    document.getElementById('required-power').textContent = '0';
    document.getElementById('progress-fill').style.width = '0%';
    document.getElementById('progress-text').textContent = '0/0';
    document.getElementById('requirements-checklist').innerHTML = '';

    // Hide mini summary
    const miniSummary = document.getElementById('mission-requirements-summary');
    if (miniSummary) {
      miniSummary.style.display = 'none';
    }
  }

  /**
   * Update Requirements Summary Mini (workspace panel)
   */
  updateRequirementsSummaryMini() {
    const miniSummary = document.getElementById('mission-requirements-summary');
    const progressFillMini = document.getElementById('progress-fill-mini');
    const progressLabelMini = document.getElementById('progress-label-mini');
    const requirementsListMini = document.getElementById('requirements-list-mini');

    if (!miniSummary || !this.selectedMission) {
      if (miniSummary) miniSummary.style.display = 'none';
      return;
    }

    const requirements = this.selectedMission.requirements || [];
    if (requirements.length === 0) {
      miniSummary.style.display = 'none';
      return;
    }

    // Show panel
    miniSummary.style.display = 'block';

    // Update progress
    const fulfilled = this.countFulfilledRequirements(requirements);
    const total = requirements.length;
    const percentage = total > 0 ? (fulfilled / total) * 100 : 0;

    if (progressFillMini) {
      progressFillMini.style.width = `${percentage}%`;
      progressFillMini.style.backgroundColor = percentage === 100 ? '#4CAF50' : '#FF9800';
    }

    if (progressLabelMini) {
      progressLabelMini.textContent = `${fulfilled}/${total} cumplidos`;
    }

    // Update requirements list (show only top 5)
    if (requirementsListMini) {
      const topRequirements = requirements.slice(0, 5);
      requirementsListMini.innerHTML = topRequirements.map(req => {
        const isFulfilled = this.isRequirementFulfilled(req);
        const icon = isFulfilled ? '✅' : '⬜';
        return `
          <div class="requirement-mini-item ${isFulfilled ? 'fulfilled' : ''}">
            <span class="requirement-mini-icon">${icon}</span>
            <span class="requirement-mini-text">${req.description}</span>
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

  /**
   * Get Requirement Icon
   */
  getRequirementIcon(type) {
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
   * Check if requirement is fulfilled
   */
  isRequirementFulfilled(req) {
    // Implementación básica - extender según necesidades
    const selectedByType = this.selectedPieces.filter(p => p.type === req.type);
    const count = req.count || 1;
    return selectedByType.length >= count;
  }

  /**
   * Check if requirement has conflict
   */
  hasRequirementConflict(req) {
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
    return this.selectedPieces.reduce((total, piece) => {
      const power = piece.power || this.getPiecePower(piece.type);
      return total + power;
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
    setTimeout(() => {
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

    setTimeout(() => {
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
      setTimeout(() => targetElement.classList.remove('drop-success'), 400);
    };
  }

  /**
   * Create flight trail particles
   */
  createFlightTrail(startRect, endRect) {
    const trailCount = 15;
    const duration = 600; // Same as flight animation

    for (let i = 0; i < trailCount; i++) {
      setTimeout(() => {
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

        setTimeout(() => trail.remove(), 800);
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

      setTimeout(() => particle.remove(), animDuration);
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

    setTimeout(() => ripple.remove(), 600);
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
    // Create audio context if needed
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
    } catch (e) {
      // Silently fail if audio doesn't work
    }
  }

  /**
   * Enhanced toggle piece selection with animations
   */
  async togglePieceSelectionEnhanced(piece, card) {
    const isSelecting = !card.classList.contains('selected');

    if (isSelecting) {
      // Máximo 12 piezas
      if (this.selectedPieces.length >= 12) {
        this.showNotification('Máximo 12 piezas para un ser', 'warning');
        return;
      }

      // EN MODO JUEGO: Mostrar quiz antes de añadir pieza
      if (window.FrankensteinQuiz) {
        const currentMode = window.FrankensteinQuiz.getMode();
        console.log(`[FrankensteinUI] Quiz mode: ${currentMode}, piece: ${piece.title} (${piece.bookId}/${piece.chapterId})`);

        if (currentMode === 'juego') {
          try {
            console.log(`[FrankensteinUI] Showing quiz for ${piece.bookId}/${piece.chapterId}`);
            const quizResult = await window.FrankensteinQuiz.showQuizModal(
              piece,
              piece.bookId,
              piece.chapterId
            );

            console.log(`[FrankensteinUI] Quiz result:`, quizResult);

            // Si el usuario canceló el quiz, no añadir la pieza
            if (quizResult.cancelled) {
              console.log(`[FrankensteinUI] Quiz cancelled, not adding piece`);
              return;
            }

            if (!quizResult.skipped) {
              // Aplicar multiplicador de poder a la pieza
              piece.powerMultiplier = quizResult.powerMultiplier;

              // Guardar resultado del quiz
              piece.quizScore = quizResult.correctCount;
              piece.quizTotal = quizResult.totalQuestions;
            }
          } catch (error) {
            console.error('[FrankensteinUI] Error en quiz:', error);
            // Si hay error, no añadir la pieza
            return;
          }
        } else {
          console.log(`[FrankensteinUI] Skipping quiz - mode is "${currentMode}"`);
        }
      } else {
        console.warn('[FrankensteinUI] FrankensteinQuiz not available');
      }

      // Solo ejecutar animaciones si el quiz fue exitoso o no hay quiz
      // Create ripple effect
      this.createSelectionRipple(card);

      // Particle burst
      setTimeout(() => {
        this.createParticleBurst(card, {
          particleCount: 12,
          types: ['circle', 'energy'],
          duration: 800
        });
      }, 100);

      // If there's a vitruvian being, animate to it
      const vitruvianContainer = document.getElementById('vitruvian-being-container');
      if (vitruvianContainer) {
        setTimeout(() => {
          this.animatePieceToTarget(card, vitruvianContainer);
        }, 200);
      }

      // Show Vitruvian popup after animation completes
      setTimeout(() => {
        this.showVitruvianPopup(piece);
      }, 800);

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
    } else {
      // Deselección
      this.triggerHaptic('light');
      card.classList.add('shake');
      setTimeout(() => card.classList.remove('shake'), 500);

      card.classList.remove('selected');
      this.selectedPieces = this.selectedPieces.filter(p => p.id !== piece.id);

      // Actualizar display del ser
      this.updateBeingFromPieces();
      // Update requirements panel
      this.updateRequirementsPanel();
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

        setTimeout(() => clone.remove(), 0);
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
            setTimeout(() => {
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

    const requirements = this.selectedMission.requirements || [];
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
    const needed = this.getMissingRequirements(requirements);

    return this.availablePieces.filter(piece => {
      // Check if piece type is needed
      const typeNeeded = needed.find(req => req.type === piece.type);
      if (!typeNeeded) return false;

      // Check if already selected
      const alreadySelected = this.selectedPieces.find(p => p.id === piece.id);
      if (alreadySelected) return false;

      // Check power threshold
      const piecePower = piece.power || this.getPiecePower(piece.type);
      const currentPower = this.calculateCurrentPower();
      const requiredPower = this.selectedMission.minPower || 0;

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
            setTimeout(() => {
              card.classList.add('bounce');
              setTimeout(() => card.classList.remove('bounce'), 600);
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
    const suggestions = [];
    const missing = this.getMissingRequirements(requirements);

    // Group pieces by type
    const byType = {};
    compatiblePieces.forEach(piece => {
      if (!byType[piece.type]) byType[piece.type] = [];
      byType[piece.type].push(piece);
    });

    // For each missing requirement, suggest best piece
    missing.forEach(req => {
      const piecesOfType = byType[req.type] || [];
      if (piecesOfType.length === 0) return;

      // Sort by power (highest first)
      const sorted = piecesOfType.sort((a, b) => {
        const powerA = a.power || this.getPiecePower(a.type);
        const powerB = b.power || this.getPiecePower(b.type);
        return powerB - powerA;
      });

      const best = sorted[0];
      suggestions.push({
        piece: best,
        reason: this.getSuggestionReason(best, req),
        priority: this.getSuggestionPriority(best, req)
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
  getSuggestionReason(piece, requirement) {
    const typeLabels = {
      chapter: 'Añade conocimiento fundamental',
      exercise: 'Fortalece práctica',
      resource: 'Proporciona herramientas'
    };

    return `${piece.title.substring(0, 40)}${piece.title.length > 40 ? '...' : ''}`;
  }

  /**
   * Get suggestion priority score
   */
  getSuggestionPriority(piece, requirement) {
    let score = 0;

    // Higher power = higher priority
    const power = piece.power || this.getPiecePower(piece.type);
    score += power;

    // Needed type = bonus
    score += 50;

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
  updateStickyRequirementsHeader() {
    if (!this.selectedMission) return;

    const requirements = this.selectedMission.requirements || [];
    if (requirements.length === 0) return;

    const compactContainer = document.getElementById('sticky-requirements-compact');
    const progressFill = document.getElementById('sticky-progress-fill');
    const progressText = document.getElementById('sticky-progress-text');

    if (!compactContainer || !progressFill || !progressText) return;

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
    const currentValue = this.selectedPieces
      .map(p => this.missionsSystem.analyzePiece(p))
      .reduce((sum, analysis) => sum + (analysis.attributes[requirement.type] || 0), 0);

    const needed = requirement.count || 1;
    const percentage = Math.min(100, Math.round((currentValue / needed) * 100));
    return percentage;
  }

  /**
   * Show Vitruvian popup when piece is added
   */
  showVitruvianPopup(piece) {
    const popup = document.getElementById('vitruvian-popup');
    const beingContainer = document.getElementById('vitruvian-popup-being');
    const pieceInfo = document.getElementById('vitruvian-popup-piece');
    const attributesContainer = document.getElementById('vitruvian-popup-attributes');

    if (!popup || !beingContainer || !pieceInfo || !attributesContainer) return;

    // Clone current Vitruvian SVG
    const mainVitruvian = document.querySelector('#vitruvian-being svg');
    if (mainVitruvian) {
      beingContainer.innerHTML = '';
      const clonedSVG = mainVitruvian.cloneNode(true);
      beingContainer.appendChild(clonedSVG);

      // Add pulse animation
      beingContainer.classList.add('piece-added');
      setTimeout(() => {
        beingContainer.classList.remove('piece-added');
      }, 600);
    }

    // Update piece info
    const analysis = this.missionsSystem.analyzePiece(piece);
    pieceInfo.innerHTML = `
      ¡Pieza añadida!<br>
      <strong>${piece.title}</strong>
    `;

    // Update attributes
    const attributesHTML = Object.entries(analysis.attributes)
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

    attributesContainer.innerHTML = attributesHTML;

    // Show popup
    popup.classList.add('visible');

    // Auto-hide after 4 seconds
    setTimeout(() => {
      this.hideVitruvianPopup();
    }, 4000);
  }

  /**
   * Hide Vitruvian popup
   */
  hideVitruvianPopup() {
    const popup = document.getElementById('vitruvian-popup');
    if (popup) {
      popup.classList.remove('visible');
    }
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
          setTimeout(() => this.hideTooltip(), 3000);
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
      setTimeout(() => tooltip.remove(), 200);
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
      setTimeout(() => overlay.remove(), 300);
    });

    overlay.querySelector('#tutorial-start').addEventListener('click', () => {
      localStorage.setItem('frankenstein-tutorial-shown', 'completed');
      overlay.classList.remove('active');
      setTimeout(() => overlay.remove(), 300);

      // Show first tooltip
      setTimeout(() => {
        const missionSelector = document.getElementById('mission-selector');
        if (missionSelector) {
          this.showTooltip(missionSelector, {
            title: '🎯 Empieza Aquí',
            content: 'Selecciona una misión para comenzar tu creación',
            shortcut: null
          });

          setTimeout(() => this.hideTooltip(), 4000);
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

    setTimeout(() => {
      hint.style.opacity = '0';
      hint.style.transform = 'translateX(-50%) translateY(-10px)';
      setTimeout(() => hint.remove(), 300);
    }, 2000);
  }

  /**
   * Crear selector de modo de juego
   */
  createGameModeSelector() {
    if (!window.FrankensteinQuiz) {
      console.warn('[FrankensteinUI] Quiz system not available');
      return;
    }

    // Buscar el header del laboratorio
    const labHeader = document.querySelector('.lab-header');
    if (!labHeader) {
      console.warn('[FrankensteinUI] Lab header not found');
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
        console.log(`[FrankensteinUI] Changing mode to: ${mode}`);

        if (!window.FrankensteinQuiz) {
          console.error('[FrankensteinUI] FrankensteinQuiz not available');
          return;
        }

        window.FrankensteinQuiz.setMode(mode);
        console.log(`[FrankensteinUI] Mode changed, current mode: ${window.FrankensteinQuiz.getMode()}`);

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
        console.log(`[FrankensteinUI] Changing difficulty to: ${difficulty}`);

        if (!window.FrankensteinQuiz) {
          console.error('[FrankensteinUI] FrankensteinQuiz not available');
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
    console.log(`[Menu] Navegando a: ${section}`);
    this.closeSideMenu();

    switch(section) {
      case 'laboratorio':
        // Ya estamos aquí, solo cerrar menú
        break;

      case 'seres':
        this.showSavedBeingsModal();
        break;

      case 'microsociedades':
        if (window.microsocietiesGallery) {
          window.microsocietiesGallery.open();
        } else if (window.FrankensteinMicrosocieties) {
          // Abrir simulador de microsociedades
          this.openMicrosocietiesSimulator();
        } else {
          this.showNotification('Microsociedades en desarrollo', 'info');
        }
        break;

      case 'retos':
        if (window.FrankensteinChallenges) {
          window.FrankensteinChallenges.openChallengesModal();
        } else {
          this.showNotification('Retos en desarrollo', 'info');
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
        console.log(`[Menu] Sección desconocida: ${section}`);
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
      console.warn('[Menu] Error al obtener microsociedades:', e);
    }
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

  /**
   * Destruir UI
   */
  destroy() {
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
