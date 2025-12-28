/**
// 🔧 FIX v2.9.198: Migrated console.log to logger
 * INICIALIZADOR DE MICROSOCIEDADES
 * Conecta todos los sistemas y proporciona panel de control unificado
 */

class MicrosocietiesInit {
  constructor() {
    this.manager = null;
    this.eventsSystem = null;
    this.eventsModal = null;
    this.saveSystem = null;
    this.progressionSystem = null;
    this.storyMode = null;
    this.sandboxMode = null;
    this.interventions = null;
    this.currentSociety = null;
    this.isInitialized = false;
    this.panelOpen = false;
  }

  /**
   * Inicializar todos los sistemas
   */
  init() {
    if (this.isInitialized) return;

    try {
      // Inicializar sistemas disponibles
      if (window.EventsSystem) {
        this.eventsSystem = new window.EventsSystem();
      }

      if (window.EventsModal) {
        this.eventsModal = new window.EventsModal();
        this.eventsModal.init();
      }

      if (window.SaveSystem) {
        this.saveSystem = new window.SaveSystem();
      }

      if (window.ProgressionSystem) {
        this.progressionSystem = new window.ProgressionSystem();
      }

      if (window.StoryMode) {
        this.storyMode = new window.StoryMode();
      }

      if (window.SandboxMode) {
        this.sandboxMode = new window.SandboxMode();
      }

      if (window.DivinInterventions) {
        this.interventions = new window.DivinInterventions();
      }

      // Crear panel UI
      this.createMainPanel();

      this.isInitialized = true;
      logger.debug('Microsociedades inicializado correctamente');

    } catch (error) {
      console.error('Error inicializando microsociedades:', error);
    }
  }

  /**
   * Crear panel principal de microsociedades
   */
  createMainPanel() {
    const panelHTML = `
      <div id="microsocieties-main-panel" class="microsocieties-panel" style="
        display: none;
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.95);
        z-index: 10002;
        overflow-y: auto;
      ">
        <div class="microsocieties-panel-content" style="
          max-width: 900px;
          margin: 2rem auto;
          padding: 2rem;
          background: linear-gradient(135deg, #0a0a0f 0%, #1a1520 100%);
          border: 4px solid #d4af37;
          border-radius: 16px;
          animation: panelSlideIn 0.4s ease-out;
        ">
          <!-- Header -->
          <div style="
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2rem;
            padding-bottom: 1rem;
            border-bottom: 2px solid rgba(212, 175, 55, 0.3);
          ">
            <div>
              <h2 style="color: #d4af37; font-size: 2rem; margin: 0;">
                Microsociedades
              </h2>
              <p style="color: #a0a0a0; margin: 0.25rem 0 0 0;">
                Simulador de sociedades autónomas
              </p>
            </div>
            <button id="microsocieties-close" style="
              background: rgba(255, 107, 53, 0.2);
              border: 2px solid #ff6b35;
              color: #ff6b35;
              width: 44px;
              height: 44px;
              border-radius: 50%;
              cursor: pointer;
              font-size: 1.3rem;
            ">✕</button>
          </div>

          <!-- Modos de juego -->
          <div id="mode-selection" style="margin-bottom: 2rem;">
            <h3 style="color: #f4e9d8; margin-bottom: 1rem;">Selecciona un modo</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem;">

              <button class="mode-card" data-mode="new" style="
                background: linear-gradient(135deg, #2d5016 0%, #4a7c2e 100%);
                border: 2px solid #85c54e;
                border-radius: 12px;
                padding: 1.5rem;
                text-align: left;
                cursor: pointer;
                transition: all 0.3s ease;
              ">
                <div style="font-size: 2rem; margin-bottom: 0.5rem;">🌱</div>
                <div style="color: #f4e9d8; font-size: 1.2rem; font-weight: 700;">Nueva Sociedad</div>
                <div style="color: #a0a0a0; font-size: 0.9rem; margin-top: 0.5rem;">
                  Crea una microsociedad con tus seres
                </div>
              </button>

              <button class="mode-card" data-mode="story" style="
                background: linear-gradient(135deg, #4a235a 0%, #6a3579 100%);
                border: 2px solid #9932cc;
                border-radius: 12px;
                padding: 1.5rem;
                text-align: left;
                cursor: pointer;
                transition: all 0.3s ease;
              ">
                <div style="font-size: 2rem; margin-bottom: 0.5rem;">📖</div>
                <div style="color: #f4e9d8; font-size: 1.2rem; font-weight: 700;">Modo Historia</div>
                <div style="color: #a0a0a0; font-size: 0.9rem; margin-top: 0.5rem;">
                  5 capítulos de evolución guiada
                </div>
              </button>

              <button class="mode-card" data-mode="sandbox" style="
                background: linear-gradient(135deg, #b87333 0%, #d4af37 100%);
                border: 2px solid #ffd700;
                border-radius: 12px;
                padding: 1.5rem;
                text-align: left;
                cursor: pointer;
                transition: all 0.3s ease;
              ">
                <div style="font-size: 2rem; margin-bottom: 0.5rem;">🧪</div>
                <div style="color: #0a0a0f; font-size: 1.2rem; font-weight: 700;">Modo Sandbox</div>
                <div style="color: rgba(0,0,0,0.7); font-size: 0.9rem; margin-top: 0.5rem;">
                  Experimenta con configuraciones
                </div>
              </button>

              <button class="mode-card" data-mode="load" style="
                background: linear-gradient(135deg, #1a1520 0%, #2a2530 100%);
                border: 2px solid #8b7355;
                border-radius: 12px;
                padding: 1.5rem;
                text-align: left;
                cursor: pointer;
                transition: all 0.3s ease;
              ">
                <div style="font-size: 2rem; margin-bottom: 0.5rem;">💾</div>
                <div style="color: #f4e9d8; font-size: 1.2rem; font-weight: 700;">Cargar Partida</div>
                <div style="color: #a0a0a0; font-size: 0.9rem; margin-top: 0.5rem;">
                  Continúa una sociedad guardada
                </div>
              </button>

            </div>
          </div>

          <!-- Simulación activa (oculta por defecto) -->
          <div id="active-simulation" style="display: none;">
            <!-- Info de la sociedad -->
            <div id="society-info" style="
              background: rgba(212, 175, 55, 0.1);
              border: 1px solid rgba(212, 175, 55, 0.3);
              border-radius: 12px;
              padding: 1.5rem;
              margin-bottom: 1.5rem;
            ">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <h3 id="society-name" style="color: #d4af37; margin: 0;">Mi Sociedad</h3>
                  <p id="society-goal" style="color: #a0a0a0; margin: 0.25rem 0 0 0;">Objetivo: -</p>
                </div>
                <div style="text-align: right;">
                  <div style="color: #85c54e; font-size: 1.5rem; font-weight: 700;">
                    Turno <span id="turn-counter">0</span>
                  </div>
                  <div id="beings-count" style="color: #a0a0a0;">0 seres vivos</div>
                </div>
              </div>
            </div>

            <!-- Controles -->
            <div style="
              display: flex;
              gap: 1rem;
              margin-bottom: 1.5rem;
              flex-wrap: wrap;
            ">
              <button id="btn-play-pause" style="
                flex: 1;
                min-width: 120px;
                padding: 1rem;
                background: linear-gradient(135deg, #2d5016 0%, #4a7c2e 100%);
                border: 2px solid #85c54e;
                border-radius: 8px;
                color: #f4e9d8;
                font-weight: 700;
                cursor: pointer;
              ">▶️ Iniciar</button>

              <select id="speed-selector" style="
                padding: 1rem;
                background: #1a1520;
                border: 2px solid #8b7355;
                border-radius: 8px;
                color: #f4e9d8;
                cursor: pointer;
              ">
                <option value="1">1x</option>
                <option value="2">2x</option>
                <option value="5">5x</option>
                <option value="10">10x</option>
              </select>

              <button id="btn-intervene" style="
                padding: 1rem 1.5rem;
                background: linear-gradient(135deg, #4a235a 0%, #6a3579 100%);
                border: 2px solid #9932cc;
                border-radius: 8px;
                color: #f4e9d8;
                font-weight: 700;
                cursor: pointer;
              ">✨ Intervenir</button>

              <button id="btn-save" style="
                padding: 1rem 1.5rem;
                background: linear-gradient(135deg, #1a1520 0%, #2a2530 100%);
                border: 2px solid #8b7355;
                border-radius: 8px;
                color: #f4e9d8;
                cursor: pointer;
              ">💾 Guardar</button>
            </div>

            <!-- Métricas -->
            <div style="
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 1rem;
              margin-bottom: 1.5rem;
            ">
              <div class="metric-card" style="
                background: rgba(133, 197, 78, 0.15);
                border: 2px solid #85c54e;
                border-radius: 12px;
                padding: 1rem;
                text-align: center;
              ">
                <div style="font-size: 1.5rem;">🌱</div>
                <div style="color: #85c54e; font-size: 1.3rem; font-weight: 700;">
                  <span id="metric-health">100</span>%
                </div>
                <div style="color: #a0a0a0; font-size: 0.85rem;">Salud</div>
              </div>

              <div class="metric-card" style="
                background: rgba(65, 105, 225, 0.15);
                border: 2px solid #4169e1;
                border-radius: 12px;
                padding: 1rem;
                text-align: center;
              ">
                <div style="font-size: 1.5rem;">💡</div>
                <div style="color: #4169e1; font-size: 1.3rem; font-weight: 700;">
                  <span id="metric-knowledge">50</span>%
                </div>
                <div style="color: #a0a0a0; font-size: 0.85rem;">Conocimiento</div>
              </div>

              <div class="metric-card" style="
                background: rgba(255, 107, 53, 0.15);
                border: 2px solid #ff6b35;
                border-radius: 12px;
                padding: 1rem;
                text-align: center;
              ">
                <div style="font-size: 1.5rem;">⚡</div>
                <div style="color: #ff6b35; font-size: 1.3rem; font-weight: 700;">
                  <span id="metric-action">50</span>%
                </div>
                <div style="color: #a0a0a0; font-size: 0.85rem;">Acción</div>
              </div>

              <div class="metric-card" style="
                background: rgba(212, 175, 55, 0.15);
                border: 2px solid #d4af37;
                border-radius: 12px;
                padding: 1rem;
                text-align: center;
              ">
                <div style="font-size: 1.5rem;">🤝</div>
                <div style="color: #d4af37; font-size: 1.3rem; font-weight: 700;">
                  <span id="metric-cohesion">75</span>%
                </div>
                <div style="color: #a0a0a0; font-size: 0.85rem;">Cohesión</div>
              </div>
            </div>

            <!-- Log de eventos -->
            <div style="
              background: rgba(0, 0, 0, 0.3);
              border: 1px solid #8b7355;
              border-radius: 8px;
              padding: 1rem;
              max-height: 200px;
              overflow-y: auto;
            ">
              <h4 style="color: #d4af37; margin: 0 0 0.5rem 0;">📜 Registro de Eventos</h4>
              <div id="event-log" style="color: #a0a0a0; font-size: 0.9rem;">
                <p style="margin: 0; opacity: 0.6;">Los eventos aparecerán aquí...</p>
              </div>
            </div>

            <!-- Botón volver -->
            <button id="btn-back-to-modes" style="
              margin-top: 1.5rem;
              padding: 0.75rem 1.5rem;
              background: transparent;
              border: 2px solid #8b7355;
              border-radius: 8px;
              color: #a0a0a0;
              cursor: pointer;
            ">← Volver a modos</button>
          </div>

          <!-- Formulario nueva sociedad (oculto) -->
          <div id="new-society-form" style="display: none;">
            <h3 style="color: #f4e9d8; margin-bottom: 1rem;">Crear Nueva Sociedad</h3>

            <div style="margin-bottom: 1rem;">
              <label style="color: #d4af37; display: block; margin-bottom: 0.5rem;">Nombre de la sociedad</label>
              <input type="text" id="new-society-name" placeholder="Mi Sociedad" style="
                width: 100%;
                padding: 0.75rem;
                background: #1a1520;
                border: 2px solid #8b7355;
                border-radius: 8px;
                color: #f4e9d8;
                font-size: 1rem;
              ">
            </div>

            <div style="margin-bottom: 1rem;">
              <label style="color: #d4af37; display: block; margin-bottom: 0.5rem;">Objetivo</label>
              <select id="new-society-goal" style="
                width: 100%;
                padding: 0.75rem;
                background: #1a1520;
                border: 2px solid #8b7355;
                border-radius: 8px;
                color: #f4e9d8;
              ">
                <option value="survive">Supervivencia</option>
                <option value="knowledge">Conocimiento</option>
                <option value="harmony">Armonía</option>
                <option value="expansion">Expansión</option>
              </select>
            </div>

            <p style="color: #a0a0a0; margin-bottom: 1rem;">
              Se usarán los seres guardados de tu laboratorio Frankenstein.
            </p>

            <div style="display: flex; gap: 1rem;">
              <button id="btn-create-society" style="
                flex: 1;
                padding: 1rem;
                background: linear-gradient(135deg, #2d5016 0%, #4a7c2e 100%);
                border: 2px solid #85c54e;
                border-radius: 8px;
                color: #f4e9d8;
                font-weight: 700;
                cursor: pointer;
              ">🌱 Crear Sociedad</button>

              <button id="btn-cancel-create" style="
                padding: 1rem;
                background: transparent;
                border: 2px solid #8b7355;
                border-radius: 8px;
                color: #a0a0a0;
                cursor: pointer;
              ">Cancelar</button>
            </div>
          </div>

          <!-- Lista de partidas guardadas (oculto) -->
          <div id="saved-games-list" style="display: none;">
            <h3 style="color: #f4e9d8; margin-bottom: 1rem;">Partidas Guardadas</h3>
            <div id="saved-games-container">
              <p style="color: #a0a0a0;">No hay partidas guardadas.</p>
            </div>
            <button id="btn-back-from-load" style="
              margin-top: 1rem;
              padding: 0.75rem 1.5rem;
              background: transparent;
              border: 2px solid #8b7355;
              border-radius: 8px;
              color: #a0a0a0;
              cursor: pointer;
            ">← Volver</button>
          </div>

        </div>
      </div>

      <style>
        @keyframes panelSlideIn {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .mode-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
        }

        .microsocieties-panel::-webkit-scrollbar {
          width: 8px;
        }

        .microsocieties-panel::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.3);
        }

        .microsocieties-panel::-webkit-scrollbar-thumb {
          background: #d4af37;
          border-radius: 4px;
        }
      </style>
    `;

    document.body.insertAdjacentHTML('beforeend', panelHTML);
    this.panel = document.getElementById('microsocieties-main-panel');
    this.setupEventListeners();
  }

  /**
   * Configurar event listeners
   */
  setupEventListeners() {
    // Cerrar panel
    document.getElementById('microsocieties-close')?.addEventListener('click', () => this.close());

    // Clicks fuera del contenido
    this.panel?.addEventListener('click', (e) => {
      if (e.target === this.panel) this.close();
    });

    // Selección de modo
    document.querySelectorAll('.mode-card').forEach(card => {
      card.addEventListener('click', (e) => {
        const mode = e.currentTarget.dataset.mode;
        this.handleModeSelection(mode);
      });
    });

    // Controles de simulación
    document.getElementById('btn-play-pause')?.addEventListener('click', () => this.togglePlayPause());
    document.getElementById('speed-selector')?.addEventListener('change', (e) => this.changeSpeed(e.target.value));
    document.getElementById('btn-intervene')?.addEventListener('click', () => this.openInterventions());
    document.getElementById('btn-save')?.addEventListener('click', () => this.saveSociety());
    document.getElementById('btn-back-to-modes')?.addEventListener('click', () => this.showModeSelection());

    // Formulario nueva sociedad
    document.getElementById('btn-create-society')?.addEventListener('click', () => this.createNewSociety());
    document.getElementById('btn-cancel-create')?.addEventListener('click', () => this.showModeSelection());
    document.getElementById('btn-back-from-load')?.addEventListener('click', () => this.showModeSelection());
  }

  /**
   * Abrir panel principal
   */
  open() {
    if (!this.isInitialized) this.init();

    this.panel.style.display = 'block';
    this.panelOpen = true;
    document.body.style.overflow = 'hidden';
    this.showModeSelection();
  }

  /**
   * Cerrar panel
   */
  close() {
    // Pausar simulación si está corriendo
    if (this.currentSociety && this.currentSociety.running) {
      this.currentSociety.pause();
    }

    this.panel.style.display = 'none';
    this.panelOpen = false;
    document.body.style.overflow = '';
  }

  /**
   * Mostrar selección de modos
   */
  showModeSelection() {
    document.getElementById('mode-selection').style.display = 'block';
    document.getElementById('active-simulation').style.display = 'none';
    document.getElementById('new-society-form').style.display = 'none';
    document.getElementById('saved-games-list').style.display = 'none';
  }

  /**
   * Manejar selección de modo
   */
  handleModeSelection(mode) {
    switch (mode) {
      case 'new':
        this.showNewSocietyForm();
        break;
      case 'story':
        this.startStoryMode();
        break;
      case 'sandbox':
        this.startSandboxMode();
        break;
      case 'load':
        this.showSavedGames();
        break;
    }
  }

  /**
   * Mostrar formulario de nueva sociedad
   */
  showNewSocietyForm() {
    document.getElementById('mode-selection').style.display = 'none';
    document.getElementById('new-society-form').style.display = 'block';
  }

  /**
   * Crear nueva sociedad
   */
  createNewSociety() {
    const name = document.getElementById('new-society-name').value || 'Mi Sociedad';
    const goal = document.getElementById('new-society-goal').value;

    // Obtener seres guardados del laboratorio
    let beings = [];
    try {
      const savedBeings = localStorage.getItem('frankenstein-saved-beings');
      if (savedBeings) {
        beings = JSON.parse(savedBeings);
      }
    } catch (e) {
      console.error('Error cargando seres:', e);
    }

    if (beings.length === 0) {
      // Crear seres de demostración
      beings = this.createDemoBeings();
      this.showNotification('Se usaron seres de demostración', 'info');
    }

    // Crear sociedad
    this.currentSociety = new MicroSociety(name, beings, goal);

    // Conectar eventos con modal si están disponibles
    if (this.eventsSystem && this.eventsModal) {
      this.connectEventsToModal();
    }

    this.showActiveSimulation();
    this.updateUI();
  }

  /**
   * Crear seres de demostración
   */
  createDemoBeings() {
    return [
      {
        name: 'Ser Inicial 1',
        attributes: { wisdom: 40, empathy: 50, action: 30, resilience: 45 }
      },
      {
        name: 'Ser Inicial 2',
        attributes: { wisdom: 55, empathy: 35, action: 60, resilience: 40 }
      },
      {
        name: 'Ser Inicial 3',
        attributes: { wisdom: 30, empathy: 60, action: 45, resilience: 50 }
      }
    ];
  }

  /**
   * Conectar sistema de eventos con modal
   */
  connectEventsToModal() {
    // Override del método generateEvent de la sociedad para usar EventsSystem
    const originalProcessTurn = this.currentSociety.processTurn.bind(this.currentSociety);

    this.currentSociety.processTurn = () => {
      this.currentSociety.turn++;

      // Cada 5 turnos, generar evento interactivo
      if (this.currentSociety.turn % 5 === 0 && this.eventsSystem) {
        const event = this.eventsSystem.generateEvent(this.currentSociety);
        if (event && this.eventsModal) {
          this.currentSociety.pause();
          this.eventsModal.show(event, this.currentSociety, (result) => {
            this.addToLog(`${event.icon} ${event.name}: ${result.result.success ? 'Éxito' : 'Fracaso'}`);
            this.updateUI();
          });
          return;
        }
      }

      // Procesar turno normal
      const event = this.currentSociety.generateEvent();
      const response = this.currentSociety.beingsRespond(event);
      this.currentSociety.applyConsequences(event, response);

      // Hibridación cada 10 turnos
      if (this.currentSociety.turn % 10 === 0) {
        this.currentSociety.hybridize();
      }

      // Guardar historial
      this.currentSociety.metricsHistory.push({
        turn: this.currentSociety.turn,
        ...this.currentSociety.metrics
      });

      // Actualizar UI
      this.updateUI();
      this.addToLog(event.description || `Turno ${this.currentSociety.turn} procesado`);
    };
  }

  /**
   * Mostrar simulación activa
   */
  showActiveSimulation() {
    document.getElementById('mode-selection').style.display = 'none';
    document.getElementById('new-society-form').style.display = 'none';
    document.getElementById('saved-games-list').style.display = 'none';
    document.getElementById('active-simulation').style.display = 'block';
  }

  /**
   * Actualizar UI
   */
  updateUI() {
    if (!this.currentSociety) return;

    const s = this.currentSociety;

    document.getElementById('society-name').textContent = s.name;
    document.getElementById('society-goal').textContent = `Objetivo: ${this.translateGoal(s.goal)}`;
    document.getElementById('turn-counter').textContent = s.turn;
    document.getElementById('beings-count').textContent = `${s.beings.filter(b => b.alive).length} seres vivos`;

    document.getElementById('metric-health').textContent = Math.round(s.metrics.health);
    document.getElementById('metric-knowledge').textContent = Math.round(s.metrics.knowledge);
    document.getElementById('metric-action').textContent = Math.round(s.metrics.action);
    document.getElementById('metric-cohesion').textContent = Math.round(s.metrics.cohesion);

    // Botón play/pause
    const btn = document.getElementById('btn-play-pause');
    if (s.running) {
      btn.innerHTML = '⏸️ Pausar';
      btn.style.background = 'linear-gradient(135deg, #8b0000 0%, #b22222 100%)';
      btn.style.borderColor = '#ff6b35';
    } else {
      btn.innerHTML = '▶️ Iniciar';
      btn.style.background = 'linear-gradient(135deg, #2d5016 0%, #4a7c2e 100%)';
      btn.style.borderColor = '#85c54e';
    }
  }

  /**
   * Traducir objetivo
   */
  translateGoal(goal) {
    const translations = {
      survive: 'Supervivencia',
      knowledge: 'Conocimiento',
      harmony: 'Armonía',
      expansion: 'Expansión'
    };
    return translations[goal] || goal;
  }

  /**
   * Toggle play/pause
   */
  togglePlayPause() {
    if (!this.currentSociety) return;

    if (this.currentSociety.running) {
      this.currentSociety.pause();
    } else {
      this.currentSociety.start();
    }
    this.updateUI();
  }

  /**
   * Cambiar velocidad
   */
  changeSpeed(speed) {
    if (!this.currentSociety) return;
    this.currentSociety.setSpeed(parseInt(speed));
  }

  /**
   * Agregar al log
   */
  addToLog(message) {
    const log = document.getElementById('event-log');
    const entry = document.createElement('p');
    entry.style.margin = '0.25rem 0';
    entry.style.borderLeft = '2px solid #d4af37';
    entry.style.paddingLeft = '0.5rem';
    entry.textContent = `[T${this.currentSociety?.turn || 0}] ${message}`;
    log.insertBefore(entry, log.firstChild);

    // Limitar a 50 entradas
    while (log.children.length > 50) {
      log.removeChild(log.lastChild);
    }
  }

  /**
   * Abrir panel de intervenciones
   */
  openInterventions() {
    if (this.interventions && this.currentSociety) {
      this.showNotification('Intervenciones divinas disponibles', 'info');
      // TODO: Implementar UI de intervenciones
    } else {
      this.showNotification('Sistema de intervenciones no disponible', 'warning');
    }
  }

  /**
   * Guardar sociedad
   */
  saveSociety() {
    if (!this.currentSociety) return;

    if (this.saveSystem) {
      this.saveSystem.save(this.currentSociety, 0);
      this.showNotification('Sociedad guardada', 'success');
    } else {
      // Guardar en localStorage directamente
      try {
        const saves = JSON.parse(localStorage.getItem('microsocieties_saves') || '[]');
        saves.unshift({
          name: this.currentSociety.name,
          data: JSON.stringify(this.currentSociety),
          timestamp: new Date().toISOString()
        });
        localStorage.setItem('microsocieties_saves', JSON.stringify(saves.slice(0, 5)));
        this.showNotification('Sociedad guardada', 'success');
      } catch (e) {
        this.showNotification('Error al guardar', 'error');
      }
    }
  }

  /**
   * Mostrar partidas guardadas
   */
  showSavedGames() {
    document.getElementById('mode-selection').style.display = 'none';
    document.getElementById('saved-games-list').style.display = 'block';

    const container = document.getElementById('saved-games-container');
    let saves = [];

    try {
      saves = JSON.parse(localStorage.getItem('microsocieties_saves') || '[]');
    } catch (e) {
      saves = [];
    }

    if (saves.length === 0) {
      container.innerHTML = '<p style="color: #a0a0a0;">No hay partidas guardadas.</p>';
      return;
    }

    container.innerHTML = saves.map((save, index) => `
      <div style="
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        background: rgba(139, 115, 85, 0.15);
        border: 1px solid #8b7355;
        border-radius: 8px;
        margin-bottom: 0.5rem;
      ">
        <div>
          <div style="color: #f4e9d8; font-weight: 700;">${save.name}</div>
          <div style="color: #a0a0a0; font-size: 0.85rem;">
            ${new Date(save.timestamp).toLocaleString()}
          </div>
        </div>
        <button class="load-save-btn" data-index="${index}" style="
          padding: 0.5rem 1rem;
          background: linear-gradient(135deg, #2d5016 0%, #4a7c2e 100%);
          border: 2px solid #85c54e;
          border-radius: 6px;
          color: #f4e9d8;
          cursor: pointer;
        ">Cargar</button>
      </div>
    `).join('');

    // Event listeners para cargar
    container.querySelectorAll('.load-save-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.currentTarget.dataset.index);
        this.loadSave(index);
      });
    });
  }

  /**
   * Cargar partida guardada
   */
  loadSave(index) {
    try {
      const saves = JSON.parse(localStorage.getItem('microsocieties_saves') || '[]');
      const save = saves[index];
      if (!save) return;

      const data = JSON.parse(save.data);

      // Recrear sociedad
      this.currentSociety = new MicroSociety(data.name, data.beings, data.goal);
      this.currentSociety.turn = data.turn || 0;
      this.currentSociety.metrics = data.metrics || this.currentSociety.metrics;
      this.currentSociety.metricsHistory = data.metricsHistory || [];

      if (this.eventsSystem && this.eventsModal) {
        this.connectEventsToModal();
      }

      this.showActiveSimulation();
      this.updateUI();
      this.showNotification('Partida cargada', 'success');

    } catch (e) {
      console.error('Error cargando partida:', e);
      this.showNotification('Error al cargar partida', 'error');
    }
  }

  /**
   * Iniciar modo historia
   */
  startStoryMode() {
    if (this.storyMode) {
      // Crear sociedad para historia
      this.createNewSociety();
      this.storyMode.start(this.currentSociety);
      this.showNotification('Modo Historia iniciado - Capítulo 1', 'success');
    } else {
      this.showNotification('Modo Historia no disponible', 'warning');
    }
  }

  /**
   * Iniciar modo sandbox
   */
  startSandboxMode() {
    if (this.sandboxMode) {
      this.createNewSociety();
      this.sandboxMode.init(this.currentSociety);
      this.showNotification('Modo Sandbox activo', 'success');
    } else {
      this.showNotification('Modo Sandbox no disponible', 'warning');
    }
  }

  /**
   * Mostrar notificación
   */
  showNotification(message, type = 'info') {
    if (window.frankensteinUI?.showNotification) {
      window.frankensteinUI.showNotification(message, type);
    } else if (window.showToast) {
      window.showToast(message, type);
    } else {
      logger.debug(`[${type}] ${message}`);
    }
  }
}

// Inicializar y exportar
window.microsocietiesInit = new MicrosocietiesInit();

// Auto-inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  // Retrasar inicialización para asegurar que otros scripts están cargados
  setTimeout(() => {
    window.microsocietiesInit.init();
  }, 500);
});

logger.debug('Microsocieties Init cargado');
