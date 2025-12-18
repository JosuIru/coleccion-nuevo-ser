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
      <div class="frankenstein-laboratory awakening-theme">
        <!-- Header Estilo Awakening -->
        <header class="awakening-header">
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
            <div class="being-overview">
              <div class="data-card being-info-card">
                <div class="being-info-top">
                  <div>
                    <p class="label-chip">Ser activo</p>
                    <h3 class="being-name" id="being-name">Ser sin nombre</h3>
                  </div>
                  <button class="change-mission-btn" id="btn-change-mission">
                    🎯 Seleccionar misión
                  </button>
                </div>
                <div class="being-mission-row">
                  <p class="being-mission" id="being-mission">No hay misión seleccionada</p>
                  <span class="mission-pill" id="mission-difficulty-pill">--</span>
                </div>
                <div class="being-quick-stats">
                  <div class="stat-chip">
                    <span class="stat-label">⚡ Poder</span>
                    <span class="stat-value" id="being-power">0</span>
                  </div>
                  <div class="stat-chip">
                    <span class="stat-label">🧩 Piezas</span>
                    <span class="stat-value" id="being-pieces">0</span>
                  </div>
                  <div class="stat-chip">
                    <span class="stat-label">🎯 Estado</span>
                    <span class="stat-value" id="being-status">Sin misión</span>
                  </div>
                </div>
              </div>

              <div class="being-visual-grid">
                <div class="data-card">
                  <div class="card-header">
                    <h4>Identidad visual</h4>
                  </div>
                  <div id="being-avatar-display" class="being-avatar-display"></div>
                </div>
                <div class="data-card vitruvian-card">
                  <div class="card-header">
                    <h4>Vitruvian analyzer</h4>
                  </div>
                  <div id="vitruvian-being-container" class="vitruvian-container">
                    <!-- El Hombre de Vitrubio se renderiza aquí -->
                  </div>
                </div>
              </div>
            </div>

            <div class="being-panels">
              <details class="data-card collapsible-card" open>
                <summary>
                  <span>📊 Atributos del Ser</span>
                  <small id="attributes-summary-meta">Selecciona piezas para ver atributos</small>
                </summary>
                <div class="card-body" id="being-attributes">
                  <!-- Barras de atributos se generan dinámicamente -->
                </div>
              </details>

              <details class="data-card collapsible-card" open>
                <summary>
                  <span>🎯 Requisitos de la misión</span>
                  <small id="requirements-summary-label">0/0</small>
                </summary>
                <div class="card-body">
                  <div class="mission-requirements-summary" id="mission-requirements-summary" hidden>
                    <div class="requirements-summary-progress">
                      <div class="progress-bar-mini">
                        <div class="progress-fill-mini" id="progress-fill-mini" style="width: 0%"></div>
                      </div>
                      <span class="progress-label-mini" id="progress-label-mini">0/0 cumplidos</span>
                    </div>
                    <div class="requirements-list-mini" id="requirements-list-mini">
                      <!-- Lista de requisitos se genera aquí -->
                    </div>
                    <button class="view-all-requirements" onclick="document.getElementById('fab-requirements').click()">
                      Ver panel completo
                    </button>
                  </div>
                </div>
              </details>

              <details class="data-card collapsible-card" open>
                <summary>
                  <span>⚖️ Balance integral</span>
                  <small id="balance-summary-meta">0%</small>
                </summary>
                <div class="card-body being-balance" id="being-balance">
                  <!-- Balance se muestra aquí -->
                </div>
              </details>

              <div class="data-card actions-card">
                <div class="lab-controls">
                  <button class="lab-button" id="btn-clear-selection">
                    🔄 Limpiar selección
                  </button>
                  <button class="lab-button" id="btn-export-being" disabled>
                    📤 Exportar Prompt
                  </button>
                  <button class="lab-button primary" id="btn-validate-being" disabled>
                    ✨ Validar misión
                  </button>
                  <button class="lab-button primary" id="btn-talk-to-being" disabled>
                    💬 Hablar con el Ser
                  </button>
                </div>
                <div class="validation-results" id="validation-results" style="display: none;">
                  <!-- Resultados aparecen aquí -->
                </div>
              </div>
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

        <!-- Bottom Navigation - Estilo Awakening Protocol -->
        <nav class="awakening-bottom-nav" id="bottom-nav">
          <button class="awakening-tab active" data-tab="laboratorio" onclick="window.frankensteinLabUI.switchTab('laboratorio')">
            <span class="awakening-tab-icon">🔬</span>
            <span class="awakening-tab-label">Lab</span>
          </button>
          <button class="awakening-tab" data-tab="seres" onclick="window.frankensteinLabUI.switchTab('seres')">
            <span class="awakening-tab-icon">🧬</span>
            <span class="awakening-tab-label">Seres</span>
          </button>
          <button class="awakening-tab" data-tab="misiones" onclick="window.frankensteinLabUI.switchTab('misiones')">
            <span class="awakening-tab-icon">🎯</span>
            <span class="awakening-tab-label">Misiones</span>
          </button>
          <button class="awakening-tab" data-tab="piezas" onclick="window.frankensteinLabUI.switchTab('piezas')">
            <span class="awakening-tab-icon">🧩</span>
            <span class="awakening-tab-label">Piezas</span>
          </button>
          <button class="awakening-tab" data-tab="perfil" onclick="window.frankensteinLabUI.switchTab('perfil')">
            <span class="awakening-tab-icon">👤</span>
            <span class="awakening-tab-label">Perfil</span>
          </button>
        </nav>

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
    this.ensureMissionRequirements(this.selectedMission);
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
      const requirements = this.getCurrentMissionRequirements();
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
    // Primero: usar el título de la pieza si ya existe
    if (piece.title && piece.title !== piece.chapterId) {
      return piece.title;
    }

    // Buscar el capítulo original
    const catalog = this.organism.bookEngine?.catalog;
    if (!catalog) {
      return piece.title || `Capítulo ${piece.chapterId}`;
    }

    const book = catalog.books.find(b => b.id === piece.bookId);
    if (!book) {
      return piece.title || `Capítulo ${piece.chapterId}`;
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

    // Último fallback: usar título de la pieza o el ID del capítulo
    return piece.title || `Capítulo ${piece.chapterId}`;
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
    const missionDifficultyPill = document.getElementById('mission-difficulty-pill');
    if (missionDifficultyPill) {
      const difficulty = this.selectedMission?.difficulty || '--';
      missionDifficultyPill.textContent = difficulty;
      missionDifficultyPill.dataset.level = difficulty;
    }

    const powerValue = Math.max(0, Math.round(this.currentBeing?.totalPower || this.calculateCurrentPower() || 0));
    const powerEl = document.getElementById('being-power');
    if (powerEl) {
      powerEl.textContent = powerValue.toLocaleString('es-ES');
    }

    const piecesEl = document.getElementById('being-pieces');
    if (piecesEl) {
      piecesEl.textContent = this.selectedPieces.length;
    }

    const statusEl = document.getElementById('being-status');
    if (statusEl) {
      let status = 'Sin misión';
      if (this.selectedMission) {
        if (this.lastValidationResults?.viable) {
          status = 'Validado';
        } else if (this.selectedPieces.length === 0) {
          status = 'Agrega piezas';
        } else {
          status = 'En progreso';
        }
      }
      statusEl.textContent = status;
    }

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
    const container = document.getElementById('being-balance');
    const summaryMeta = document.getElementById('balance-summary-meta');
    if (!container) return;

    if (!this.currentBeing) {
      container.innerHTML = '<p class="empty-card-message">Selecciona piezas para generar un balance.</p>';
      if (summaryMeta) summaryMeta.textContent = '0%';
      return;
    }

    const balance = this.currentBeing.balance;

    if (summaryMeta) {
      summaryMeta.textContent = `${Math.round(balance.harmony || 0)}%`;
    }

    container.innerHTML = `
      <div class="balance-grid">
        <div class="balance-item">
          <span class="balance-label">🧠 Intelectual</span>
          <span class="balance-value">${Math.round(balance.intellectual)}</span>
        </div>
        <div class="balance-item">
          <span class="balance-label">❤️ Emocional</span>
          <span class="balance-value">${Math.round(balance.emotional)}</span>
        </div>
        <div class="balance-item">
          <span class="balance-label">⚡ Acción</span>
          <span class="balance-value">${Math.round(balance.action)}</span>
        </div>
        <div class="balance-item">
          <span class="balance-label">🌟 Espiritual</span>
          <span class="balance-value">${Math.round(balance.spiritual)}</span>
        </div>
        <div class="balance-item">
          <span class="balance-label">🔧 Práctico</span>
          <span class="balance-value">${Math.round(balance.practical)}</span>
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
          <button class="lab-button accent" onclick="window.frankensteinLabUI.exportToMobile()" title="Enviar a Awakening Protocol">
            📱 Enviar a App Móvil
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
   * Exportar ser a la app móvil Awakening Protocol
   */
  exportToMobile() {
    if (!this.currentBeing || !this.selectedMission) {
      this.showNotification('No hay ser para exportar', 'warning');
      return;
    }

    const being = this.currentBeing;
    const mission = this.selectedMission;

    // Preparar datos del ser para la app móvil
    const beingData = {
      id: Date.now(),
      name: being.name || mission.name,
      attributes: being.attributes,
      totalPower: being.totalPower,
      balance: being.balance,
      missionId: mission.id,
      mission: {
        id: mission.id,
        name: mission.name,
        description: mission.description
      },
      pieces: being.pieces.map(p => ({
        title: p.piece.title,
        bookTitle: p.piece.bookTitle
      })),
      createdAt: new Date().toISOString(),
      sourceApp: 'frankenstein-lab'
    };

    // Codificar en base64
    const encodedData = btoa(unescape(encodeURIComponent(JSON.stringify(beingData))));

    // Generar deep link
    const deepLink = `awakeningprotocol://receive-being?data=${encodeURIComponent(encodedData)}`;

    // Mostrar modal con opciones
    this.showExportToMobileModal(beingData, deepLink, encodedData);
  }

  /**
   * Mostrar modal de exportación a móvil
   */
  showExportToMobileModal(beingData, deepLink, encodedData) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4';
    modal.id = 'export-mobile-modal';
    modal.innerHTML = `
      <div class="bg-slate-900 rounded-xl border-2 border-emerald-500 p-6 max-w-lg w-full">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-xl font-bold text-emerald-400">📱 Enviar a Awakening Protocol</h3>
          <button onclick="document.getElementById('export-mobile-modal').remove()" class="text-slate-400 hover:text-white text-2xl">&times;</button>
        </div>

        <div class="text-center mb-6">
          <div class="text-6xl mb-3">${this.selectAvatarForExport(beingData.attributes)}</div>
          <h4 class="text-lg font-bold text-white">${beingData.name}</h4>
          <p class="text-slate-400 text-sm">${beingData.mission.name}</p>
          <p class="text-emerald-400 mt-2">⚡ Poder: ${beingData.totalPower}</p>
        </div>

        <div class="space-y-3">
          <p class="text-slate-300 text-sm text-center mb-4">
            Elige cómo enviar el ser a tu dispositivo móvil:
          </p>

          <button onclick="window.frankensteinLabUI.openDeepLink('${deepLink}')"
                  class="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 px-4 rounded-lg font-bold transition-colors">
            📲 Abrir en App (si está instalada)
          </button>

          <button onclick="window.frankensteinLabUI.copyToClipboard('${encodedData}', 'Código copiado')"
                  class="w-full bg-slate-700 hover:bg-slate-600 text-white py-3 px-4 rounded-lg transition-colors">
            📋 Copiar Código de Importación
          </button>

          <button onclick="window.frankensteinLabUI.showQRCode('${deepLink}')"
                  class="w-full bg-slate-700 hover:bg-slate-600 text-white py-3 px-4 rounded-lg transition-colors">
            📷 Mostrar Código QR
          </button>
        </div>

        <div class="mt-4 p-3 bg-slate-800 rounded-lg">
          <p class="text-xs text-slate-400 text-center">
            💡 Si no tienes la app, descárgala desde la sección de descargas
          </p>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  /**
   * Seleccionar avatar basado en atributos dominantes
   */
  selectAvatarForExport(attributes) {
    const sorted = Object.entries(attributes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 1);

    const top = sorted[0]?.[0];

    const avatarMap = {
      consciousness: '🌟',
      wisdom: '🦉',
      empathy: '💜',
      creativity: '🎨',
      leadership: '👑',
      action: '⚡',
      resilience: '💪',
      analysis: '🔬',
      reflection: '🧠',
      communication: '🗣️',
      connection: '🌍',
      strategy: '♟️',
      organization: '📋',
      collaboration: '🤝',
      technical: '⚙️'
    };

    return avatarMap[top] || '🧬';
  }

  /**
   * Abrir deep link
   */
  openDeepLink(url) {
    window.location.href = url;
    this.showNotification('Abriendo Awakening Protocol...', 'info', 3000);
  }

  /**
   * Copiar al portapapeles
   */
  copyToClipboard(text, message = 'Copiado') {
    navigator.clipboard.writeText(text).then(() => {
      this.showNotification(`📋 ${message}`, 'success', 3000);
    }).catch(err => {
      console.error('Error copiando:', err);
      this.showNotification('Error al copiar', 'error');
    });
  }

  /**
   * Mostrar código QR (usando API externa)
   */
  showQRCode(data) {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data)}`;

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4';
    modal.id = 'qr-modal';
    modal.innerHTML = `
      <div class="bg-slate-900 rounded-xl border-2 border-cyan-500 p-6 text-center">
        <h3 class="text-xl font-bold text-cyan-400 mb-4">📷 Escanea con tu móvil</h3>
        <div class="bg-white p-4 rounded-lg inline-block mb-4">
          <img src="${qrUrl}" alt="QR Code" class="w-48 h-48" />
        </div>
        <p class="text-slate-400 text-sm mb-4">Escanea este código con la app Awakening Protocol</p>
        <button onclick="document.getElementById('qr-modal').remove()"
                class="bg-slate-700 hover:bg-slate-600 text-white py-2 px-6 rounded-lg">
          Cerrar
        </button>
      </div>
    `;
    document.body.appendChild(modal);
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
   * Cambiar tab de navegación (Bottom Navigation)
   * En móvil usa pantallas completas, en desktop usa modales
   */
  switchTab(tabName) {
    console.log('🔄 Cambiando a tab:', tabName);

    // Actualizar estado visual de tabs
    document.querySelectorAll('.awakening-tab').forEach(tab => {
      tab.classList.remove('active');
      if (tab.dataset.tab === tabName) {
        tab.classList.add('active');
      }
    });

    // Cerrar cualquier pantalla móvil abierta
    this.closeMobileScreen();

    // Detectar si es móvil
    const isMobile = window.innerWidth <= 768;

    // Manejar cambio de contenido según tab
    switch (tabName) {
      case 'laboratorio':
        // Mostrar workspace principal
        const workspace = document.querySelector('.lab-workspace');
        if (workspace) workspace.style.display = '';
        break;
      case 'seres':
        if (isMobile) {
          this.showMobileSeresScreen();
        } else {
          this.showSavedBeingsModal();
        }
        break;
      case 'misiones':
        if (isMobile) {
          this.showMobileMisionesScreen();
        } else {
          this.openMissionModal();
        }
        break;
      case 'piezas':
        if (isMobile) {
          this.showMobilePiezasScreen();
        } else {
          this.openPiecesModal();
        }
        break;
      case 'perfil':
        if (isMobile) {
          this.showMobilePerfilScreen();
        } else {
          this.showProfileSection();
        }
        break;
    }
  }

  /**
   * Cerrar pantalla móvil activa
   */
  closeMobileScreen() {
    const screen = document.getElementById('mobile-screen');
    if (screen) {
      screen.remove();
    }
    // Restaurar workspace
    const workspace = document.querySelector('.lab-workspace');
    if (workspace) workspace.style.display = '';
    // Restaurar tab laboratorio
    document.querySelectorAll('.awakening-tab').forEach(tab => {
      tab.classList.remove('active');
      if (tab.dataset.tab === 'laboratorio') {
        tab.classList.add('active');
      }
    });
  }

  /**
   * Pantalla móvil: Seres guardados
   */
  showMobileSeresScreen() {
    const savedBeings = this.loadBeings();

    const screen = document.createElement('div');
    screen.id = 'mobile-screen';
    screen.className = 'mobile-screen active';

    screen.innerHTML = `
      <div class="mobile-screen-header">
        <button class="mobile-screen-back" onclick="window.frankensteinLabUI.closeMobileScreen()">←</button>
        <h2 class="mobile-screen-title">🧬 Mis Seres</h2>
      </div>
      <div class="mobile-screen-content">
        ${savedBeings.length === 0 ? `
          <div class="empty-state">
            <div class="empty-state-icon">🧬</div>
            <h3 class="empty-state-title">Sin seres guardados</h3>
            <p class="empty-state-text">Crea tu primer ser en el laboratorio</p>
            <button class="empty-state-btn" onclick="window.frankensteinLabUI.closeMobileScreen()">Ir al Lab</button>
          </div>
        ` : `
          <div class="beings-list">
            ${savedBeings.map(saved => {
              const totalPower = saved.totalPower || saved.being?.totalPower || 0;
              const missionName = saved.mission?.name || 'Sin misión';
              const beingEmoji = this.avatarSystem ? this.avatarSystem.getBeingEmoji(saved.being) : '🧬';
              return `
                <div class="being-list-item" onclick="window.frankensteinLabUI.loadBeing('${saved.id}'); window.frankensteinLabUI.closeMobileScreen();">
                  <div class="being-list-avatar">${beingEmoji}</div>
                  <div class="being-list-info">
                    <h4 class="being-list-name">${saved.name || 'Ser sin nombre'}</h4>
                    <p class="being-list-mission">🎯 ${missionName}</p>
                  </div>
                  <span class="being-list-power">⚡${Math.round(totalPower)}</span>
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>
    `;

    // Ocultar workspace
    const workspace = document.querySelector('.lab-workspace');
    if (workspace) workspace.style.display = 'none';

    document.querySelector('.frankenstein-laboratory').appendChild(screen);
  }

  /**
   * Pantalla móvil: Misiones
   */
  showMobileMisionesScreen() {
    const missions = this.missionsSystem?.missions || [];
    const difficulties = ['principiante', 'intermedio', 'avanzado', 'maestro'];

    const screen = document.createElement('div');
    screen.id = 'mobile-screen';
    screen.className = 'mobile-screen active';

    // Agrupar misiones por dificultad
    const groupedMissions = {};
    difficulties.forEach(d => groupedMissions[d] = []);
    missions.forEach(m => {
      if (groupedMissions[m.difficulty]) {
        groupedMissions[m.difficulty].push(m);
      }
    });

    screen.innerHTML = `
      <div class="mobile-screen-header">
        <button class="mobile-screen-back" onclick="window.frankensteinLabUI.closeMobileScreen()">←</button>
        <h2 class="mobile-screen-title">🎯 Elige tu Misión</h2>
      </div>
      <div class="mobile-screen-content">
        <p style="color: #94a3b8; font-size: 14px; margin: 0 0 20px 0; text-align: center;">
          Cada misión requiere atributos específicos. Combina las piezas correctas para cumplirla.
        </p>

        ${difficulties.map(difficulty => {
          const missionList = groupedMissions[difficulty];
          if (missionList.length === 0) return '';

          const diffColors = {
            principiante: '#34d399',
            intermedio: '#60a5fa',
            avanzado: '#fbbf24',
            maestro: '#ef4444'
          };

          return `
            <div class="mission-difficulty-group">
              <h3 style="color: ${diffColors[difficulty]}; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 12px 0; display: flex; align-items: center; gap: 8px;">
                <span style="width: 8px; height: 8px; background: ${diffColors[difficulty]}; border-radius: 50%;"></span>
                ${difficulty}
              </h3>
              <div class="missions-list" style="margin-bottom: 24px;">
                ${missionList.map(mission => {
                  const reqAttrs = Object.entries(mission.requiredAttributes || {}).slice(0, 3);
                  return `
                    <div class="mission-list-item ${this.selectedMission?.id === mission.id ? 'selected' : ''}"
                         onclick="window.frankensteinLabUI.selectMissionFromMobile('${mission.id}')">
                      <div class="mission-list-icon">${mission.icon}</div>
                      <div class="mission-list-info">
                        <h4 class="mission-list-name">${mission.name}</h4>
                        <p class="mission-list-desc">${mission.description}</p>
                        <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px;">
                          ${reqAttrs.map(([attr, value]) => {
                            const attrData = this.missionsSystem?.attributes?.[attr];
                            return `<span style="font-size: 11px; background: rgba(255,255,255,0.1); padding: 3px 8px; border-radius: 10px;">${attrData?.icon || '📊'} ${value}+</span>`;
                          }).join('')}
                        </div>
                      </div>
                      ${this.selectedMission?.id === mission.id ? '<span style="color: #34d399; font-size: 20px;">✓</span>' : ''}
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    const workspace = document.querySelector('.lab-workspace');
    if (workspace) workspace.style.display = 'none';

    document.querySelector('.frankenstein-laboratory').appendChild(screen);
  }

  /**
   * Seleccionar misión desde pantalla móvil
   */
  selectMissionFromMobile(missionId) {
    const mission = this.missionsSystem?.missions.find(m => m.id === missionId);
    if (mission) {
      this.selectedMission = mission;
      this.updateBeingDisplay();
      window.showToast(`Misión: ${mission.name}`, 'success');
    }
    this.closeMobileScreen();
  }

  /**
   * Pantalla móvil: Piezas
   */
  showMobilePiezasScreen() {
    const pieces = this.availablePieces || [];
    const currentMode = window.FrankensteinQuiz?.getMode() || 'demo';

    const screen = document.createElement('div');
    screen.id = 'mobile-screen';
    screen.className = 'mobile-screen active';

    // Organizar piezas por libro
    const piecesByBook = this.organizePiecesByBook('all');

    screen.innerHTML = `
      <div class="mobile-screen-header">
        <button class="mobile-screen-back" onclick="window.frankensteinLabUI.closeMobileScreen()">←</button>
        <h2 class="mobile-screen-title">📚 Biblioteca</h2>
        <span style="color: var(--awakening-accent-primary); font-weight: 600;">${this.selectedPieces.length} sel.</span>
      </div>
      <div class="mobile-screen-content" style="padding-top: 8px;">
        <div class="mobile-mode-indicator" style="display: flex; align-items: center; gap: 8px; padding: 10px 14px; background: rgba(96, 165, 250, 0.1); border-radius: 10px; margin-bottom: 12px; font-size: 13px;">
          <span>${currentMode === 'juego' ? '🧠' : currentMode === 'demo' ? '✨' : '🔬'}</span>
          <span style="color: #94a3b8;">Modo:</span>
          <span style="color: #60a5fa; font-weight: 600;">${currentMode === 'juego' ? 'Aprendizaje (Quiz)' : currentMode === 'demo' ? 'Demo' : 'Investigación'}</span>
        </div>
        <div class="mobile-books-list" id="mobile-books-list">
          ${this.renderMobileBooksList(piecesByBook)}
        </div>
      </div>
    `;

    const workspace = document.querySelector('.lab-workspace');
    if (workspace) workspace.style.display = 'none';

    document.querySelector('.frankenstein-laboratory').appendChild(screen);
  }

  /**
   * Renderizar lista de libros para móvil con sus atributos
   */
  renderMobileBooksList(piecesByBook) {
    if (Object.keys(piecesByBook).length === 0) {
      return `
        <div class="empty-state">
          <div class="empty-state-icon">📚</div>
          <h3 class="empty-state-title">Sin libros</h3>
          <p class="empty-state-text">No hay libros disponibles</p>
        </div>
      `;
    }

    return Object.entries(piecesByBook).map(([bookId, bookData]) => {
      // Calcular atributos agregados del libro
      let totalPower = 0;
      const aggregatedAttributes = {};
      let totalPieces = 0;

      Object.values(bookData.chapters).forEach(ch => {
        totalPieces += ch.pieces.length;
        ch.pieces.forEach(piece => {
          const analysis = this.missionsSystem?.analyzePiece(piece);
          if (analysis) {
            totalPower += analysis.totalPower || 0;
            Object.entries(analysis.attributes || {}).forEach(([attr, value]) => {
              aggregatedAttributes[attr] = (aggregatedAttributes[attr] || 0) + value;
            });
          }
        });
      });

      // Top 4 atributos
      const topAttrs = Object.entries(aggregatedAttributes)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([attr, value]) => {
          const attrData = this.missionsSystem?.attributes?.[attr];
          return attrData ? `<span style="display: inline-flex; align-items: center; gap: 2px; font-size: 12px;">${attrData.icon}${Math.round(value)}</span>` : '';
        })
        .filter(Boolean)
        .join(' ');

      const bgColor = bookData.color || '#64748b';
      const chapterCount = Object.keys(bookData.chapters).length;

      return `
        <div class="mobile-book-item" data-book-id="${bookId}">
          <div class="mobile-book-header" onclick="window.frankensteinLabUI.toggleMobileBook('${bookId}')">
            <div class="mobile-book-icon" style="background: ${bgColor}20; color: ${bgColor};">📚</div>
            <div class="mobile-book-info">
              <h4 class="mobile-book-title">${bookData.bookTitle}</h4>
              <div class="mobile-book-meta">
                <span>${chapterCount} caps</span>
                <span>•</span>
                <span>⚡${totalPower}</span>
              </div>
              <div class="mobile-book-attrs">${topAttrs}</div>
            </div>
            <span class="mobile-book-toggle">▶</span>
          </div>
          <div class="mobile-book-chapters" id="mobile-chapters-${bookId}" style="display: none;">
            ${this.renderMobileChaptersList(bookId, bookData.chapters)}
          </div>
        </div>
      `;
    }).join('');
  }

  /**
   * Renderizar lista de capítulos dentro de un libro
   */
  renderMobileChaptersList(bookId, chapters) {
    return Object.entries(chapters).map(([chapterId, chapterData]) => {
      // Calcular atributos del capítulo
      let chapterPower = 0;
      const chapterAttrs = {};

      chapterData.pieces.forEach(piece => {
        const analysis = this.missionsSystem?.analyzePiece(piece);
        if (analysis) {
          chapterPower += analysis.totalPower || 0;
          Object.entries(analysis.attributes || {}).forEach(([attr, value]) => {
            chapterAttrs[attr] = (chapterAttrs[attr] || 0) + value;
          });
        }
      });

      // Top 3 atributos del capítulo
      const topAttrs = Object.entries(chapterAttrs)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([attr, value]) => {
          const attrData = this.missionsSystem?.attributes?.[attr];
          return attrData ? `<span title="${attrData.name}" style="font-size: 11px;">${attrData.icon}${Math.round(value)}</span>` : '';
        })
        .filter(Boolean)
        .join(' ');

      // Verificar si ya está seleccionado
      const mainPiece = chapterData.pieces.find(p => p.type === 'chapter');
      const isSelected = mainPiece && this.selectedPieces.some(p => p.id === mainPiece.id);

      return `
        <div class="mobile-chapter-item ${isSelected ? 'selected' : ''}"
             data-chapter-id="${chapterId}"
             data-book-id="${bookId}"
             onclick="window.frankensteinLabUI.selectMobileChapter('${bookId}', '${chapterId}')">
          <div class="mobile-chapter-icon">${isSelected ? '✓' : '📖'}</div>
          <div class="mobile-chapter-info">
            <h5 class="mobile-chapter-title">${chapterData.chapterTitle || `Capítulo ${chapterId}`}</h5>
            <div class="mobile-chapter-meta">
              <span>⚡${chapterPower}</span>
              <span class="mobile-chapter-attrs">${topAttrs}</span>
            </div>
          </div>
          ${isSelected ? '<span style="color: #34d399; font-weight: bold;">✓</span>' : ''}
        </div>
      `;
    }).join('');
  }

  /**
   * Toggle expandir/colapsar libro en móvil
   */
  toggleMobileBook(bookId) {
    const chapters = document.getElementById(`mobile-chapters-${bookId}`);
    const header = document.querySelector(`.mobile-book-item[data-book-id="${bookId}"] .mobile-book-header`);
    const toggle = header?.querySelector('.mobile-book-toggle');

    if (!chapters) return;

    const isOpen = chapters.style.display !== 'none';

    // Cerrar todos los demás
    document.querySelectorAll('.mobile-book-chapters').forEach(el => {
      el.style.display = 'none';
    });
    document.querySelectorAll('.mobile-book-toggle').forEach(el => {
      el.textContent = '▶';
      el.style.transform = 'rotate(0deg)';
    });

    if (!isOpen) {
      chapters.style.display = 'block';
      if (toggle) {
        toggle.textContent = '▼';
        toggle.style.transform = 'rotate(0deg)';
      }
    }
  }

  /**
   * Seleccionar capítulo desde móvil (con quiz si aplica)
   */
  async selectMobileChapter(bookId, chapterId) {
    // Encontrar la pieza del capítulo
    const piece = this.availablePieces.find(p =>
      p.bookId === bookId && p.chapterId === chapterId && p.type === 'chapter'
    );

    if (!piece) {
      window.showToast('Capítulo no encontrado', 'error');
      return;
    }

    const isSelected = this.selectedPieces.some(p => p.id === piece.id);

    if (isSelected) {
      // Deseleccionar
      const index = this.selectedPieces.findIndex(p => p.id === piece.id);
      if (index >= 0) {
        this.selectedPieces.splice(index, 1);
        window.showToast('Capítulo removido', 'info');
      }
    } else {
      // MODO JUEGO: Mostrar quiz antes de añadir
      if (window.FrankensteinQuiz) {
        const currentMode = window.FrankensteinQuiz.getMode();
        console.log(`[Mobile] Quiz mode: ${currentMode}, piece: ${piece.title}`);

        if (currentMode === 'juego') {
          try {
            console.log(`[Mobile] Showing quiz for ${piece.bookId}/${piece.chapterId}`);
            const quizResult = await window.FrankensteinQuiz.showQuizModal(
              piece,
              piece.bookId,
              piece.chapterId
            );

            console.log(`[Mobile] Quiz result:`, quizResult);

            if (quizResult.cancelled) {
              console.log(`[Mobile] Quiz cancelled`);
              return;
            }

            if (!quizResult.skipped) {
              piece.powerMultiplier = quizResult.powerMultiplier;
              piece.quizScore = quizResult.correctCount;
              piece.quizTotal = quizResult.totalQuestions;
            }
          } catch (error) {
            console.error('[Mobile] Quiz error:', error);
            return;
          }
        }
      }

      this.selectedPieces.push(piece);
      window.showToast(`${piece.title} añadido`, 'success');
    }

    // Actualizar displays
    this.updateBeingDisplay();

    // Actualizar UI móvil
    const header = document.querySelector('.mobile-screen-header span:last-child');
    if (header) header.textContent = `${this.selectedPieces.length} sel.`;

    // Re-renderizar lista de capítulos
    const bookItem = document.querySelector(`.mobile-book-item[data-book-id="${bookId}"]`);
    if (bookItem) {
      const chaptersContainer = bookItem.querySelector('.mobile-book-chapters');
      const piecesByBook = this.organizePiecesByBook('all');
      if (chaptersContainer && piecesByBook[bookId]) {
        chaptersContainer.innerHTML = this.renderMobileChaptersList(bookId, piecesByBook[bookId].chapters);
      }
    }
  }

  /**
   * Renderizar lista de piezas para móvil
   */
  renderMobilePiecesList(pieces, filter = 'all') {
    const filteredPieces = filter === 'all' ? pieces : pieces.filter(p => p.type === filter);

    if (filteredPieces.length === 0) {
      return `
        <div class="empty-state">
          <div class="empty-state-icon">🧩</div>
          <h3 class="empty-state-title">Sin piezas</h3>
          <p class="empty-state-text">No hay piezas disponibles</p>
        </div>
      `;
    }

    return filteredPieces.slice(0, 50).map(piece => {
      const isSelected = this.selectedPieces.some(p => p.id === piece.id);
      const bgColor = piece.color || '#64748b';
      return `
        <div class="piece-list-item ${isSelected ? 'selected' : ''}"
             onclick="window.frankensteinLabUI.toggleMobilePiece('${piece.id}')">
          <div class="piece-list-icon" style="background: ${bgColor}20; color: ${bgColor};">
            ${piece.icon || '📄'}
          </div>
          <div class="piece-list-info">
            <h4 class="piece-list-title">${piece.title}</h4>
            <p class="piece-list-book">${piece.bookTitle || ''}</p>
          </div>
          <div class="piece-list-check">✓</div>
        </div>
      `;
    }).join('');
  }

  /**
   * Filtrar piezas en móvil
   */
  filterMobilePieces(filter) {
    // Actualizar botones
    document.querySelectorAll('.piece-filter-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filter === filter);
    });
    // Renderizar lista filtrada
    const list = document.getElementById('mobile-pieces-list');
    if (list) {
      list.innerHTML = this.renderMobilePiecesList(this.availablePieces, filter);
    }
  }

  /**
   * Toggle pieza desde móvil
   */
  toggleMobilePiece(pieceId) {
    const piece = this.availablePieces.find(p => p.id === pieceId);
    if (!piece) return;

    const index = this.selectedPieces.findIndex(p => p.id === pieceId);
    if (index >= 0) {
      this.selectedPieces.splice(index, 1);
      window.showToast('Pieza removida', 'info');
    } else {
      this.selectedPieces.push(piece);
      window.showToast('Pieza añadida', 'success');
    }

    // Actualizar UI
    this.updateBeingDisplay();

    // Actualizar contador en header
    const header = document.querySelector('.mobile-screen-header span');
    if (header) header.textContent = `${this.selectedPieces.length} sel.`;

    // Actualizar item visual
    const item = document.querySelector(`.piece-list-item[onclick*="${pieceId}"]`);
    if (item) item.classList.toggle('selected');
  }

  /**
   * Pantalla móvil: Perfil
   */
  showMobilePerfilScreen() {
    const savedBeings = this.loadBeings();
    const currentMode = window.FrankensteinQuiz?.getMode() || 'demo';
    const currentDifficulty = window.FrankensteinQuiz?.getDifficulty() || 'iniciado';

    const screen = document.createElement('div');
    screen.id = 'mobile-screen';
    screen.className = 'mobile-screen active';

    screen.innerHTML = `
      <div class="mobile-screen-header">
        <button class="mobile-screen-back" onclick="window.frankensteinLabUI.closeMobileScreen()">←</button>
        <h2 class="mobile-screen-title">👤 Perfil</h2>
      </div>
      <div class="mobile-screen-content">
        <div class="profile-stats-grid">
          <div class="profile-stat-card">
            <span class="profile-stat-icon">🧬</span>
            <span class="profile-stat-value">${savedBeings.length}</span>
            <span class="profile-stat-label">Seres</span>
          </div>
          <div class="profile-stat-card">
            <span class="profile-stat-icon">🧩</span>
            <span class="profile-stat-value">${this.availablePieces?.length || 0}</span>
            <span class="profile-stat-label">Piezas</span>
          </div>
          <div class="profile-stat-card">
            <span class="profile-stat-icon">🎯</span>
            <span class="profile-stat-value">${this.missionsSystem?.missions?.length || 0}</span>
            <span class="profile-stat-label">Misiones</span>
          </div>
        </div>

        <div class="profile-section">
          <h3 class="profile-section-title">⚙️ Configuración</h3>
          <div class="profile-option" onclick="window.FrankensteinSettings?.open(); window.frankensteinLabUI.closeMobileScreen();">
            <span class="profile-option-icon">🎮</span>
            <div class="profile-option-info">
              <p class="profile-option-label">Modo de juego</p>
              <p class="profile-option-value">${currentMode}</p>
            </div>
            <span class="profile-option-arrow">→</span>
          </div>
          <div class="profile-option" onclick="window.FrankensteinSettings?.open(); window.frankensteinLabUI.closeMobileScreen();">
            <span class="profile-option-icon">📊</span>
            <div class="profile-option-info">
              <p class="profile-option-label">Dificultad</p>
              <p class="profile-option-value">${currentDifficulty}</p>
            </div>
            <span class="profile-option-arrow">→</span>
          </div>
        </div>

        <div class="profile-section">
          <h3 class="profile-section-title">📱 Aplicación</h3>
          <div class="profile-option">
            <span class="profile-option-icon">ℹ️</span>
            <div class="profile-option-info">
              <p class="profile-option-label">Versión</p>
              <p class="profile-option-value">v1.3.2</p>
            </div>
          </div>
        </div>
      </div>
    `;

    const workspace = document.querySelector('.lab-workspace');
    if (workspace) workspace.style.display = 'none';

    document.querySelector('.frankenstein-laboratory').appendChild(screen);
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
            <button class="awakening-modal-close" onclick="document.getElementById('profile-modal').classList.remove('active')">×</button>
          </div>
          <div class="awakening-modal-body">
            <div class="awakening-stats" style="margin-bottom: 24px;">
              <div class="awakening-stat-box">
                <span class="awakening-stat-icon">🧬</span>
                <span class="awakening-stat-value" id="profile-beings-count">0</span>
                <span class="awakening-stat-label">Seres</span>
              </div>
              <div class="awakening-stat-box">
                <span class="awakening-stat-icon">🧩</span>
                <span class="awakening-stat-value" id="profile-pieces-count">0</span>
                <span class="awakening-stat-label">Piezas</span>
              </div>
              <div class="awakening-stat-box">
                <span class="awakening-stat-icon">🎯</span>
                <span class="awakening-stat-value" id="profile-missions-count">0</span>
                <span class="awakening-stat-label">Misiones</span>
              </div>
            </div>

            <div style="background: var(--awakening-bg-card); border-radius: var(--radius-md); padding: var(--space-4); margin-bottom: 16px;">
              <h4 style="color: var(--awakening-text-primary); margin: 0 0 12px 0; font-size: 16px;">⚙️ Configuración</h4>
              <div class="awakening-list">
                <div class="awakening-list-item" onclick="window.frankensteinLabUI.openSettings()">
                  <span style="font-size: 20px;">🎮</span>
                  <div style="flex: 1;">
                    <div style="color: var(--awakening-text-primary); font-weight: 600;">Modo de Juego</div>
                    <div style="color: var(--awakening-text-secondary); font-size: 12px;" id="profile-game-mode">Investigación</div>
                  </div>
                  <span style="color: var(--awakening-text-dim);">→</span>
                </div>
                <div class="awakening-list-item" onclick="window.frankensteinLabUI.openSettings()">
                  <span style="font-size: 20px;">📊</span>
                  <div style="flex: 1;">
                    <div style="color: var(--awakening-text-primary); font-weight: 600;">Dificultad</div>
                    <div style="color: var(--awakening-text-secondary); font-size: 12px;" id="profile-difficulty">Principiante</div>
                  </div>
                  <span style="color: var(--awakening-text-dim);">→</span>
                </div>
              </div>
            </div>

            <button class="awakening-btn awakening-btn-primary" style="width: 100%;" onclick="window.frankensteinLabUI.openSettings()">
              ⚙️ Abrir Ajustes
            </button>
          </div>
        </div>
      `;
      document.body.appendChild(profileModal);
    }

    // Actualizar estadísticas
    const savedBeings = JSON.parse(localStorage.getItem('frankenstein_saved_beings') || '[]');
    document.getElementById('profile-beings-count').textContent = savedBeings.length;
    document.getElementById('profile-pieces-count').textContent = this.selectedPieces.length;
    document.getElementById('profile-missions-count').textContent = this.missionsSystem?.missions?.length || 8;

    // Obtener modo y dificultad actual
    const currentMode = window.FrankensteinQuiz?.getMode() || 'investigacion';
    const currentDifficulty = window.FrankensteinQuiz?.getDifficulty() || 'principiante';
    document.getElementById('profile-game-mode').textContent = currentMode.charAt(0).toUpperCase() + currentMode.slice(1);
    document.getElementById('profile-difficulty').textContent = currentDifficulty.charAt(0).toUpperCase() + currentDifficulty.slice(1);

    // Mostrar modal
    profileModal.classList.add('active');
  }

  /**
   * Mostrar sección específica
   */
  showSection(sectionId) {
    // Por ahora solo log, se puede expandir
    console.log('📍 Mostrando sección:', sectionId);
  }

  /**
   * Abrir panel de settings
   */
  openSettings() {
    // Cerrar modal de perfil si está abierto
    const profileModal = document.getElementById('profile-modal');
    if (profileModal) {
      profileModal.classList.remove('active');
    }

    // Abrir settings
    if (window.FrankensteinSettings) {
      window.FrankensteinSettings.open();
    }
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
      const legacyPieces = savedBeing.pieces?.length
        ? savedBeing.pieces
        : (savedBeing.being?.pieces?.map(entry => entry.piece || entry) || []);
      const missingPieces = [];
      this.selectedPieces = legacyPieces
        .map(piece => {
          const resolved = piecesById.get(piece.id);
          if (resolved) {
            return resolved;
          }
          const fallback = this.hydrateLegacyPiece(piece);
          if (fallback) {
            missingPieces.push(fallback);
            return fallback;
          }
          return null;
        })
        .filter(Boolean);

      if (missingPieces.length > 0) {
        console.warn('[FrankensteinUI] Piezas no disponibles en el catálogo actual:', missingPieces.map(p => p.id));
        this.showNotification(`⚠️ ${missingPieces.length} piezas de este ser ya no están en el catálogo. Se usaron versiones de respaldo.`, 'warning', 6000);
      }

      this.lastValidationResults = savedBeing.validation || null;

      // Reconstruir ser si falta información crítica
      let restoredBeing = savedBeing.being;
      if (!restoredBeing || !restoredBeing.attributes) {
        const analyzedPieces = this.selectedPieces.map(piece =>
          this.missionsSystem?.analyzePiece(piece) || { attributes: {}, totalPower: 0 }
        );
        const shouldUseSnapshot = !this.missionsSystem || analyzedPieces.length === 0 || missingPieces.length > 0;
        if (this.missionsSystem && analyzedPieces.length > 0 && !shouldUseSnapshot) {
          restoredBeing = this.missionsSystem.createBeing(analyzedPieces, savedBeing.name || 'Ser guardado');
        } else {
          restoredBeing = {
            name: savedBeing.name || 'Ser guardado',
            attributes: {},
            totalPower: savedBeing.totalPower || 0,
            balance: null
          };
        }
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

      if (this.selectedMission) {
        const missionLabel = document.getElementById('being-mission');
        if (missionLabel) {
          missionLabel.textContent = `Misión: ${this.selectedMission.name}`;
        }
        this.updateRequirementsPanel();
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

              const attrEntries = Object.entries(saved.being?.attributes || {})
                .sort((a, b) => b[1] - a[1])
                .slice(0, 6);
              const attributesHTML = attrEntries.length
                ? attrEntries.map(([attr, value]) => {
                    const attrData = this.missionsSystem.attributes[attr];
                    return `<span class="being-card-attribute-pill">${attrData?.icon || '📊'} ${attrData?.name || attr}: ${value}</span>`;
                  }).join('')
                : '<span class="being-card-attribute-pill">Sin atributos calculados</span>';
              const missionName = saved.mission?.name || 'Misión desconocida';

              return `
                <div class="being-card" style="background: ${bgGradient || 'rgba(34, 28, 23, 0.6)'}; border: 2px solid rgba(139, 115, 85, 0.4); backdrop-filter: blur(10px);">
                  <div class="being-card-header">
                    <div class="being-card-avatar">
                      ${avatarUrl
                        ? `<img src="${avatarUrl}" alt="${saved.name || 'Ser guardado'}">`
                        : beingEmoji}
                    </div>
                    <div class="being-card-info">
                      <p class="being-card-date">${new Date(timestamp).toLocaleString('es-ES')}</p>
                      <h4 class="being-card-name">${saved.name || 'Ser guardado'}</h4>
                      <p class="being-card-mission">🎯 ${missionName}</p>
                      <div class="being-card-stats">
                        <span>⚡ ${Math.round(totalPower)} poder</span>
                        <span>🧩 ${pieceCount} piezas</span>
                      </div>
                    </div>
                    <div class="being-card-actions">
                      <button
                        class="lab-button secondary"
                        onclick="window.frankensteinLabUI.loadBeing('${saved.id}'); document.getElementById('saved-beings-modal').remove()">
                        📥 Cargar
                      </button>
                      <button
                        class="lab-button danger"
                        onclick="if(confirm('¿Eliminar este ser?')) { window.frankensteinLabUI.deleteBeing('${saved.id}'); this.closest('.being-card').remove(); if(document.querySelectorAll('.being-card').length === 0) { document.getElementById('saved-beings-modal').remove(); window.frankensteinLabUI.showSavedBeingsModal(); } }">
                        🗑️ Eliminar
                      </button>
                    </div>
                  </div>
                  <div class="being-card-body">
                    ${radarChart ? `<div class="being-card-radar">${radarChart}</div>` : ''}
                    <div class="being-card-attributes">
                      ${attributesHTML}
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
      miniSummary.hidden = true;
    }

    const headerLabel = document.getElementById('requirements-summary-label');
    if (headerLabel) {
      headerLabel.textContent = '0/0';
    }
  }

  /**
   * Update Requirements Summary Mini (workspace panel)
   */
  updateRequirementsSummaryMini() {
    const miniSummary = document.getElementById('mission-requirements-summary');
    const progressFillMini = document.getElementById('progress-fill-mini');
    const progressLabelMini = document.getElementById('progress-label-mini');
    const headerLabel = document.getElementById('requirements-summary-label');
    const requirementsListMini = document.getElementById('requirements-list-mini');

    if (!miniSummary || !this.selectedMission) {
      if (miniSummary) miniSummary.hidden = true;
      if (headerLabel) headerLabel.textContent = '0/0';
      return;
    }

    const requirements = this.getCurrentMissionRequirements();
    if (requirements.length === 0) {
      miniSummary.hidden = true;
      if (headerLabel) headerLabel.textContent = '0/0';
      return;
    }

    // Show panel
    miniSummary.hidden = false;

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
    if (headerLabel) {
      headerLabel.textContent = `${fulfilled}/${total}`;
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

    const requirements = this.getCurrentMissionRequirements();
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
    const mainVitruvian = document.querySelector('#vitruvian-being-container svg');
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
        this.openMicrosocietiesSimulator();
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
   * Intentar abrir la experiencia de microsociedades con fallbacks
   */
  openMicrosocietiesSimulator() {
    // Preferir la nueva galería si está disponible
    if (window.microsocietiesGallery && typeof window.microsocietiesGallery.open === 'function') {
      window.microsocietiesGallery.open();
      return;
    }

    // Asegurar que exista un manager de microsociedades
    if (!window.microSocietiesManager) {
      const ManagerClass = window.MicroSocietiesManager || window.FrankensteinMicrosocieties;
      if (ManagerClass) {
        window.microSocietiesManager = new ManagerClass();
      }
    }

    const manager = window.microSocietiesManager;
    if (!manager) {
      this.showNotification('Microsociedades en desarrollo', 'info');
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
      window.openMicroSocietiesModal(society);
      return;
    }

    // Fallback a un modal resumido propio
    this.renderBasicMicrosocietyModal(society);
  }

  /**
   * Renderizar modal simple con el estado actual de la microsociedad
   */
  renderBasicMicrosocietyModal(society) {
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
