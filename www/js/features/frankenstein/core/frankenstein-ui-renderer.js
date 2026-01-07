/**
 * FRANKENSTEIN UI RENDERER v2.9.201
 * Módulo responsable de renderizar las pantallas principales del laboratorio
 *
 * Este módulo contiene:
 * - Pantalla de inicio con selección de modo/dificultad
 * - UI principal del laboratorio (template HTML grande)
 * - Funciones de renderizado de estructura
 * - Gestión de fondos vintage rotativos
 *
 * @module FrankensteinUIRenderer
 * @version 2.9.201
 * @author J. Irurtzun & Claude Sonnet 4.5
 */

export default class FrankensteinUIRenderer {
  /**
   * @param {Object} labUIRef - Referencia a FrankensteinLabUI (this del parent)
   * @param {Object} domCache - Cache de referencias DOM
   */
  constructor(labUIRef, domCache) {
    this.labUI = labUIRef;
    this.dom = domCache;

    // Tracking de timers para cleanup
    this.backgroundRotationTimer = null;
    this.previousBackgroundIndex = -1;
  }

  /**
   * Crear pantalla de inicio con selección de modo y dificultad
   * Esta es la primera pantalla que ve el usuario al entrar al laboratorio
   */
  createStartScreen() {
    const container = document.getElementById('organism-container');
    if (!container) {
      logger.error('❌ Contenedor no encontrado para pantalla de inicio');
      return;
    }

    // Establecer fondo vintage aleatorio y mantenerlo rotando
    this.startBackgroundRotation();

    logger.log('✅ Creando pantalla de inicio en:', container);

    const currentMode = window.FrankensteinQuiz?.getMode() || 'juego';
    const currentDifficulty = window.FrankensteinQuiz?.getDifficulty() || 'iniciado';

    logger.log('📊 Modo actual:', currentMode, 'Dificultad:', currentDifficulty);

    const modeLabels = {
      investigacion: 'Exploración Libre',
      juego: 'Aprendizaje Guiado',
      demo: 'Demo Cinemática'
    };

    const difficultyLabels = {
      ninos: 'Niños',
      principiante: 'Principiante',
      iniciado: 'Iniciado',
      experto: 'Experto'
    };

    const startScreen = document.createElement('div');
    startScreen.id = 'frankenstein-start-screen';
    startScreen.className = 'frankenstein-start-screen';
    startScreen.innerHTML = `
      <div class="start-screen-content">
        <div class="start-hero">
          <div class="hero-info">
            <p class="hero-label">Temporada 3.1 · Laboratorio Vivo</p>
            <h1 class="hero-title">
              Ensambla seres. Activa misiones.
            </h1>
            <p class="hero-description">
              Selecciona tu modo, ajusta la dificultad y entra a un laboratorio inspirado en RPGs tácticos. Cada sesión desbloquea nuevas combinaciones de conocimiento.
            </p>

            <div class="hero-actions">
              <button class="start-button" id="frankenstein-start-button">
                <span>Entrar al Laboratorio</span>
                <span class="start-button-arrow">→</span>
              </button>
              <button class="ghost-button" id="frankenstein-close-button">
                Volver a la Colección
              </button>
            </div>

            <div class="hero-stats">
              <div class="hero-stat">
                <span class="hero-stat-label">Modo activo</span>
                <span class="hero-stat-value">${modeLabels[currentMode] || 'Selecciona modo'}</span>
              </div>
              <div class="hero-stat">
                <span class="hero-stat-label">Dificultad</span>
                <span class="hero-stat-value">${difficultyLabels[currentDifficulty] || 'Principiante'}</span>
              </div>
              <div class="hero-stat">
                <span class="hero-stat-label">Piezas disponibles</span>
                <span class="hero-stat-value">${this.labUI.availablePieces.length}</span>
              </div>
            </div>
          </div>

          <div class="hero-visual">
            <div class="hero-holo">
              <div class="hero-holo-ring ring-1"></div>
              <div class="hero-holo-ring ring-2"></div>
              <div class="hero-holo-ring ring-3"></div>
              <div class="hero-holo-core">🧬</div>
            </div>
            <div class="hero-visual-meta">
              <div>
                <p class="meta-label">Briefing</p>
                <p class="meta-value">Selecciona un modo y pulsa "Entrar" para desbloquear el tablero completo.</p>
              </div>
              <div class="meta-divider"></div>
              <div class="meta-grid">
                <div>
                  <p class="meta-label">Misiones disponibles</p>
                  <p class="meta-number">12</p>
                </div>
                <div>
                  <p class="meta-label">Microsistemas</p>
                  <p class="meta-number">5</p>
                </div>
                <div>
                  <p class="meta-label">Seres demo</p>
                  <p class="meta-number">3</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="hero-tabs">
          <button class="hero-tab active" data-panel-target="panel-modes">🎮 Modos</button>
          <button class="hero-tab" data-panel-target="panel-difficulty">⚙️ Dificultad</button>
          <button class="hero-tab" data-panel-target="panel-briefing">📜 Briefing</button>
        </div>

        <div class="start-panels">
          <section class="start-panel active" id="panel-modes">
            <div class="panel-heading">
              <div>
                <p class="panel-label">Paso 1</p>
                <h2>Elige cómo quieres jugar</h2>
              </div>
              <p class="panel-description">Cada modo ajusta el comportamiento del laboratorio y la forma en que se calculan los atributos.</p>
            </div>
            <div class="mode-grid">
              <button class="mode-card ${currentMode === 'investigacion' ? 'selected' : ''}" data-mode="investigacion">
                <div class="mode-card-icon">🔍</div>
                <div>
                  <h3 class="mode-card-title">Investigación</h3>
                  <p class="mode-card-description">Explora libremente sin evaluaciones ni presión. Perfecto para crear prototipos.</p>
                </div>
              </button>
              <button class="mode-card ${currentMode === 'juego' ? 'selected' : ''}" data-mode="juego">
                <div class="mode-card-icon">🧠</div>
                <div>
                  <h3 class="mode-card-title">Aprendizaje</h3>
                  <p class="mode-card-description">Completa quizzes para potenciar tus piezas. Ideal para progresión narrativa.</p>
                </div>
              </button>
              <button class="mode-card ${currentMode === 'demo' ? 'selected' : ''}" data-mode="demo">
                <div class="mode-card-icon">✨</div>
                <div>
                  <h3 class="mode-card-title">Demo</h3>
                  <p class="mode-card-description">Carga seres y microsociedades de ejemplo para inspirarte rápidamente.</p>
                </div>
              </button>
            </div>
          </section>

          <section class="start-panel" id="panel-difficulty">
            <div class="panel-heading">
              <div>
                <p class="panel-label">Paso 2</p>
                <h2>Ajusta la dificultad del quiz</h2>
              </div>
              <p class="panel-description">Solo aplica en modo Aprendizaje. A mayor dificultad, mayor impacto en el poder de cada pieza.</p>
            </div>
            <div class="difficulty-grid">
              <button class="difficulty-card ${currentDifficulty === 'ninos' ? 'selected' : ''}" data-difficulty="ninos">
                <div class="difficulty-card-icon">🎈</div>
                <div>
                  <h3 class="difficulty-card-title">Niños</h3>
                  <p class="difficulty-card-description">Lenguaje sencillo, feedback amable y retos cortos.</p>
                </div>
              </button>
              <button class="difficulty-card ${currentDifficulty === 'principiante' ? 'selected' : ''}" data-difficulty="principiante">
                <div class="difficulty-card-icon">🌱</div>
                <div>
                  <h3 class="difficulty-card-title">Principiante</h3>
                  <p class="difficulty-card-description">Introduce conceptos clave de cada libro sin saturar.</p>
                </div>
              </button>
              <button class="difficulty-card ${currentDifficulty === 'iniciado' ? 'selected' : ''}" data-difficulty="iniciado">
                <div class="difficulty-card-icon">📚</div>
                <div>
                  <h3 class="difficulty-card-title">Iniciado</h3>
                  <p class="difficulty-card-description">Preguntas situacionales y conexiones entre piezas.</p>
                </div>
              </button>
              <button class="difficulty-card ${currentDifficulty === 'experto' ? 'selected' : ''}" data-difficulty="experto">
                <div class="difficulty-card-icon">🔥</div>
                <div>
                  <h3 class="difficulty-card-title">Experto</h3>
                  <p class="difficulty-card-description">Desafíos profundos que exigen síntesis y visión estratégica.</p>
                </div>
              </button>
            </div>
          </section>

          <section class="start-panel" id="panel-briefing">
            <div class="panel-heading">
              <div>
                <p class="panel-label">Resumen</p>
                <h2>Antes de entrar</h2>
              </div>
              <p class="panel-description">Este laboratorio mezcla UI de videojuegos con contenidos reales de la colección. Usa este briefing para orientarte.</p>
            </div>
            <div class="briefing-grid">
              <article class="briefing-card">
                <h3>🔧 Micro UX</h3>
                <p>Gestos, tarjetas y paneles flotantes pensados para móvil y escritorio.</p>
              </article>
              <article class="briefing-card">
                <h3>🕹️ Flujo modular</h3>
                <p>Activa o desactiva módulos: misiones, piezas, chat IA, microsistemas.</p>
              </article>
              <article class="briefing-card">
                <h3>🌌 Ambientación</h3>
                <p>Fondos dinámicos inspirados en bocetos de Da Vinci y laboratorio gótico.</p>
              </article>
            </div>
            <ul class="briefing-list">
              <li>⚡ Selecciona un modo y una dificultad antes de entrar.</li>
              <li>🧬 En modo Demo cargamos seres automáticamente para que puedas experimentar.</li>
              <li>🎯 Puedes cambiar de misión en cualquier momento desde el laboratorio.</li>
            </ul>
          </section>
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
          logger.log('📦 Cargando datos de demostración...');
          window.FrankensteinDemoData.loadDemoData(this.labUI);
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

    // Tab panels
    const heroTabs = startScreen.querySelectorAll('[data-panel-target]');
    const panels = startScreen.querySelectorAll('.start-panel');
    heroTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetId = tab.dataset.panelTarget;
        heroTabs.forEach(btn => btn.classList.remove('active'));
        panels.forEach(panel => panel.classList.remove('active'));
        tab.classList.add('active');
        const targetPanel = startScreen.querySelector(`#${targetId}`);
        if (targetPanel) {
          targetPanel.classList.add('active');
        }
      });
    });

    // Event listener para botón comenzar
    const startButton = startScreen.querySelector('#frankenstein-start-button');
    if (startButton) {
      startButton.addEventListener('click', () => {
        this.labUI.startLab();
      });
    }

    // Event listener para botón cerrar
    const closeButton = startScreen.querySelector('#frankenstein-close-button');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        if (this.labUI.organism && this.labUI.organism.hide) {
          this.labUI.organism.hide();
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
   * @param {string|null} preferredImage - URL de imagen específica o null para aleatorio
   */
  setRandomDaVinciBackground(preferredImage = null) {
    const fallbackImage = 'assets/backgrounds/vitruvio.jpg';
    const available = this.labUI.vintageBackgrounds?.length ? this.labUI.vintageBackgrounds : [fallbackImage];

    let selectedImage = preferredImage;
    if (!selectedImage) {
      if (available.length === 1) {
        selectedImage = available[0];
      } else {
        let nextIndex = this.previousBackgroundIndex;
        let safety = 0;
        while (nextIndex === this.previousBackgroundIndex && safety < 10) {
          nextIndex = Math.floor(Math.random() * available.length);
          safety += 1;
        }
        this.previousBackgroundIndex = nextIndex;
        selectedImage = available[nextIndex];
      }
    }

    const resolvedUrl = this.resolveAssetUrl(selectedImage);
    const fallbackUrl = this.resolveAssetUrl(fallbackImage);

    const applyBackground = (url) => {
      document.documentElement.style.setProperty('--da-vinci-bg', `url('${url}')`);
    };

    const preview = new Image();
    preview.onload = () => applyBackground(resolvedUrl);
    preview.onerror = () => applyBackground(fallbackUrl || resolvedUrl);
    preview.src = resolvedUrl;
  }

  /**
   * Resolver URL de asset relativo a absoluto
   * @param {string} assetPath - Path del asset
   * @returns {string} URL absoluta
   */
  resolveAssetUrl(assetPath) {
    if (!assetPath) return '';
    if (/^https?:\/\//.test(assetPath)) {
      return assetPath;
    }

    try {
      return new URL(assetPath, window.location.href).href;
    } catch (error) {
      try {
        const basePath = `${window.location.origin}${window.location.pathname.replace(/[^/]*$/, '')}`;
        return new URL(assetPath, basePath).href;
      } catch {
        return assetPath;
      }
    }
  }

  /**
   * Iniciar rotación automática de fondos vintage
   * @param {string|null} forceImage - Imagen específica a usar (opcional)
   */
  startBackgroundRotation(forceImage = null) {
    if (this.backgroundRotationTimer) {
      this.labUI._clearInterval(this.backgroundRotationTimer);
      this.backgroundRotationTimer = null;
    }

    this.setRandomDaVinciBackground(forceImage);

    this.backgroundRotationTimer = this.labUI._setInterval(() => {
      this.setRandomDaVinciBackground();
    }, 45000);
  }

  /**
   * Crear estructura HTML del laboratorio
   * Este es el template principal del laboratorio - ~600 líneas de HTML
   */
  createLabUI() {
    const container = document.getElementById('organism-container');
    if (!container) {
      logger.error('❌ Contenedor del organismo no encontrado');
      return;
    }

    // Limpiar Three.js canvas si existe
    const oldCanvas = container.querySelector('#organism-canvas');
    if (oldCanvas) oldCanvas.remove();
    const loading = container.querySelector('#organism-loading');
    if (loading) loading.remove();

    // Alternar imagen de fondo de Leonardo da Vinci aleatoriamente
    this.startBackgroundRotation();

    container.innerHTML = `
      <div class="frankenstein-laboratory awakening-theme">
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
              <button class="lab-header-icon-btn" id="btn-saved-beings" title="Seres Guardados">
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
                <div class="mission-progress-card">
                  <div class="progress-ring" id="mission-progress-ring">
                    <div class="progress-ring-inner">
                      <span class="progress-ring-percent" id="mission-progress-percent">0%</span>
                      <small id="mission-progress-label">objetivos</small>
                    </div>
                  </div>
                  <div class="progress-track">
                    <div class="progress-track-header">
                      <p>Ruta de misión</p>
                      <span id="mission-progress-status">0/0</span>
                    </div>
                    <div class="progress-reward-bar">
                      <div class="progress-reward-fill" id="mission-progress-fill"></div>
                      <span class="mission-reward-icon" data-threshold="25" style="left:25%">⭐</span>
                      <span class="mission-reward-icon" data-threshold="60" style="left:60%">⚡</span>
                      <span class="mission-reward-icon" data-threshold="100" style="left:100%">🏆</span>
                    </div>
                    <p class="progress-track-hint" id="mission-progress-hint">Selecciona una misión para desbloquear recompensas.</p>
                  </div>
                </div>
              </div>

              <div class="being-visual-grid">
                <div class="vitruvian-stage" id="vitruvian-stage">
                  <div class="vitruvian-stage-inner">
                    <div class="vitruvian-stage-header">
                      <div>
                        <p class="label-chip">Vitruvio</p>
                        <h4>Mapa energético del ser</h4>
                      </div>
                      <span class="vitruvian-energy-badge" id="vitruvian-energy-badge">⚡ 0</span>
                    </div>
                    <div class="vitruvian-stage-body">
                      <div class="vitruvian-hud" id="vitruvian-hud">
                        <p class="vitruvian-hud-empty">Añade capítulos y ejercicios para activar este radar.</p>
                      </div>
                      <div id="vitruvian-being-container" class="vitruvian-container vitruvian-container-expanded">
                        <!-- El Hombre de Vitrubio se renderiza aquí -->
                      </div>
                    </div>
                    <div class="vitruvian-composition" id="vitruvian-slot-legend">
                      <p class="vitruvian-composition-empty">Selecciona piezas para ver qué partes del cuerpo se energizan.</p>
                    </div>
                  </div>
                </div>
                <div class="data-card identity-card">
                  <div class="card-header">
                    <h4>Identidad visual</h4>
                  </div>
                  <div id="being-avatar-display" class="being-avatar-display"></div>
                  <div class="identity-components">
                    <div class="identity-components-header">
                      <span>ADN narrativo</span>
                      <small id="being-components-count">0 piezas</small>
                    </div>
                    <ul id="being-components-list">
                      <li>Selecciona capítulos y ejercicios para componer este ser.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div class="being-panels">
              <details class="data-card collapsible-card attributes-requirements-card">
                <summary>
                  <span>📊 Atributos &amp; Requisitos</span>
                  <small id="attributes-summary-meta">Selecciona piezas para ver atributos</small>
                </summary>
                <div class="card-body">
                  <div class="attributes-requirements-grid">
                    <div id="being-attributes">
                      <!-- Barras de atributos se generan dinámicamente -->
                    </div>

                    <div class="requirements-mini-card">
                      <div class="requirements-mini-header">
                        <span>🎯 Requisitos de la misión</span>
                        <small id="requirements-summary-label">--</small>
                      </div>
                      <div class="mission-requirements-summary" id="mission-requirements-summary">
                        <div class="requirements-summary-progress">
                          <div class="progress-bar-mini">
                            <div class="progress-fill-mini" id="progress-fill-mini" style="width: 0%"></div>
                          </div>
                          <span class="progress-label-mini" id="progress-label-mini">Selecciona una misión</span>
                        </div>
                        <div class="requirements-list-mini" id="requirements-list-mini">
                          <!-- Lista de requisitos se genera aquí -->
                        </div>
                        <button class="view-all-requirements" id="requirements-mini-view-all" onclick="document.getElementById('fab-requirements').click()">
                          Ver panel completo
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </details>

              <details class="data-card collapsible-card">
                <summary>
                  <span>⚖️ Balance integral</span>
                  <small id="balance-summary-meta">0%</small>
                </summary>
                <div class="card-body being-balance" id="being-balance">
                  <!-- Balance se muestra aquí -->
                </div>
              </details>

              <div class="data-card mini-challenge-card">
                <div class="mini-challenge-header">
                  <div>
                    <p class="mini-challenge-label">⚡ Evento relámpago</p>
                    <h4 class="mini-challenge-title" id="mini-challenge-title">Sin evento activo</h4>
                  </div>
                  <button class="mini-challenge-refresh" id="mini-challenge-refresh" title="Generar nuevo evento">
                    🔄
                  </button>
                </div>
                <div class="mini-challenge-body" id="mini-challenge-body">
                  <p class="empty-card-message">Selecciona una misión para recibir eventos dinámicos durante el ensamblaje.</p>
                </div>
              </div>

              <div class="data-card demo-scenario-card" id="demo-scenario-card">
                <div class="demo-scenario-header">
                  <div>
                    <p class="demo-scenario-label">🎓 Ruta educativa</p>
                    <h4 class="demo-scenario-title" id="demo-scenario-title">Modo demo no activo</h4>
                  </div>
                </div>
                <div class="demo-scenario-body" id="demo-scenario-body">
                  <p class="empty-card-message">Activa el modo demo y carga un ser de ejemplo para recibir guías educativas.</p>
                </div>
              </div>

              <div class="data-card microsociety-card" id="microsociety-card">
                <div class="microsociety-header">
                  <div>
                    <p class="microsociety-label">🏛️ Microsociedad</p>
                    <h4 class="microsociety-title" id="microsociety-title">Sin simulación</h4>
                  </div>
                  <div class="microsociety-actions">
                    <button class="micro-action" id="btn-create-microsociety-card">Crear</button>
                    <button class="micro-action secondary" id="btn-open-microsociety-card">Simular</button>
                  </div>
                </div>
                <div class="microsociety-body" id="microsociety-body">
                  <p class="empty-card-message">Crea una microsociedad con tu ser o explora una demo para ver métricas colectivas.</p>
                </div>
              </div>

              <details class="data-card collapsible-card experiment-log-card">
                <summary>
                  <span>📒 Bitácora de experimentos</span>
                  <small id="experiment-log-meta">Sin registros</small>
                </summary>
                <div class="card-body experiment-log-body" id="experiment-log-list">
                  <p class="empty-card-message">Valida un ser para registrar sus resultados y compararlos.</p>
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
              <div class="requirements-layout">
                <div class="requirements-main">
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
                <aside class="requirements-side">
                  <div class="mission-brief-card">
                    <p class="brief-label">Briefing</p>
                    <h3 id="modal-mission-name">Selecciona una misión</h3>
                    <p id="modal-mission-description">Elige una misión para ver objetivos concretos y requisitos clave.</p>
                  </div>
                  <div class="mission-meta-card">
                    <div class="meta-row">
                      <span>Dificultad</span>
                      <strong id="modal-mission-difficulty">--</strong>
                    </div>
                    <div class="meta-row">
                      <span>Poder mínimo</span>
                      <strong id="modal-mission-power">0</strong>
                    </div>
                    <div class="meta-row">
                      <span>Progreso</span>
                      <strong id="modal-mission-progress">0/0</strong>
                    </div>
                    <button class="lab-button secondary" id="modal-open-pieces">Buscar piezas</button>
                  </div>
                  <div class="mission-hints-card">
                    <div class="hints-header">
                      <span>Recomendaciones</span>
                    </div>
                    <ul class="mission-hints-list" id="modal-mission-hints">
                      <li>Selecciona una misión para recibir sugerencias.</li>
                    </ul>
                  </div>
                </aside>
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
              <div class="pieces-layout">
                <div class="pieces-main">
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

                  <div class="pieces-filters">
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
                <aside class="pieces-side">
                  <div class="pieces-meta-card">
                    <h3>Estado actual</h3>
                    <div class="pieces-meta-stat">
                      <span>Seleccionadas</span>
                      <strong id="pieces-selected-count">0</strong>
                    </div>
                    <div class="pieces-meta-stat">
                      <span>Poder estimado</span>
                      <strong id="pieces-selected-power">0</strong>
                    </div>
                    <button class="lab-button secondary" id="pieces-open-requirements">Ver requisitos</button>
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

                  <div class="pieces-tips-card">
                    <h4>Micro estrategias</h4>
                    <ul id="pieces-tips-list">
                      <li>Selecciona una misión para recibir sugerencias específicas.</li>
                    </ul>
                  </div>
                </aside>
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
            <button class="vitruvian-popup-close" id="vitruvian-popup-close" aria-label="Cerrar popup de Vitruvio"><span aria-hidden="true">×</span></button>
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
    this.labUI.populateMissions();
    this.labUI.populatePiecesGrid();
    this.labUI.updateBeingDisplay();
    this.labUI.updateMissionProgressUI({
      fulfilled: this.labUI.selectedMission ? this.labUI.countFulfilledRequirements(this.labUI.selectedMission.requirements || []) : 0,
      total: this.labUI.selectedMission?.requirements?.length || 0
    });
    this.labUI.renderMiniChallenge();
    this.labUI.renderDemoScenarioCard();
    this.labUI.renderMicrosocietyCard();

    if (this.labUI.pendingRequirementsUpdate && this.labUI.selectedMission) {
      this.labUI.updateRequirementsPanel();
    }

    // Inicializar visualización del Hombre de Vitrubio
    if (window.VitruvianBeing) {
      this.labUI.vitruvianBeing = new VitruvianBeing();
      this.labUI.vitruvianBeing.init('vitruvian-being-container');
    }

    // Inicializar cache de referencias DOM para optimizar rendimiento
    this.labUI.initDomCache();

    // Inicializar HUD de recompensas
    this.labUI.initRewardsHUD();

    // Iniciar onboarding si es primera vez
    this.labUI.checkOnboarding();
  }

  /**
   * Generar partículas flotantes decorativas para el fondo
   * @returns {string} HTML de las partículas
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
   * Limpiar recursos del renderer
   */
  destroy() {
    // Detener rotación de fondos
    if (this.backgroundRotationTimer) {
      this.labUI._clearInterval(this.backgroundRotationTimer);
      this.backgroundRotationTimer = null;
    }

    logger.log('✅ FrankensteinUIRenderer destroyed');
  }
}
