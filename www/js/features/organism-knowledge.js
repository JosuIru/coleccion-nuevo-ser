/**
 * ORGANISMO DEL CONOCIMIENTO
 * Sistema Biológico Generativo de Aprendizaje
 *
 * Concepto revolucionario:
 * - Los libros son ÓRGANOS (corazón, cerebro, pulmones)
 * - Los capítulos son CÉLULAS con ADN
 * - Las prácticas son MITOCONDRIAS (energía)
 * - Los temas son GENES en el ADN
 * - Puedes COMBINAR células para crear nuevos organismos
 * - Sistema vivo que respira, late y evoluciona
 *
 * Mecánicas:
 * - Drag & drop de células
 * - Fusión celular (combinar conceptos)
 * - Mitosis (dividir organismos)
 * - Mutaciones con IA
 * - Compatibilidad genética
 * - Ecosistema interactivo
 */

class OrganismKnowledge {
  constructor(bookEngine) {
    this.bookEngine = bookEngine;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.raycaster = null;
    this.mouse = null;

    // Sistemas biomédicos
    this.bioGeo = new BiomedicalGeometries();
    this.bioShaders = new BiomedicalShaders();
    this.bioTextures = new ProceduralTextures();
    this.dnaSystem = new DNAHelixSystem();
    this.neuralSystem = new NeuralConnectionsSystem();
    this.energyFlow = new EnergyFlowSystem();

    // Sistema de construcción Frankenstein
    this.availableOrgans = []; // Órganos disponibles para usar (libros)
    this.organs = []; // Órganos creados en la escena
    this.cells = []; // Células creadas en la escena
    this.organisms = []; // Organismos híbridos creados
    this.bodySlots = {}; // Posiciones anatómicas del cuerpo
    this.implantedOrgans = {}; // Órganos ya implantados en el cuerpo
    this.bodyModel = null; // Modelo 3D del cuerpo humanoid
    this.isBodyAlive = false; // ¿El cuerpo está vivo?
    this.bodyVitality = 0; // Vitalidad del cuerpo (0-100)

    // Estado
    this.viewMode = 'anatomy'; // anatomy | cellular | ecosystem | laboratory
    this.selectedCells = []; // Células seleccionadas para combinar
    this.draggedCell = null;
    this.draggedOrgan = null; // Órgano siendo arrastrado
    this.nearbySlot = null; // Slot cercano al órgano arrastrado
    this.hoveredObject = null;
    this.pauseCellAnimations = false; // Pausar movimiento en modo laboratorio
    this.particleBursts = []; // Explosiones de partículas de energía

    // Controles de cámara
    this.cameraControls = {
      isDragging: false,
      previousMousePosition: { x: 0, y: 0 },
      rotationSpeed: 0.005,
      zoomSpeed: 0.1,
      targetDistance: 800,
      currentDistance: 800,
      phi: Math.PI / 4, // Ángulo vertical
      theta: 0 // Ángulo horizontal
    };

    // Configuración
    this.config = {
      heartbeatSpeed: 0.003, // Velocidad de latido
      breathingSpeed: 0.002, // Velocidad de respiración
      cellRadius: 30,
      organRadius: 150,
      mitochondriaCount: 5,
      dnaHelixTurns: 3
    };

    // ANATOMÍA DEL CUERPO DIVINO - Cargada desde módulo de datos
    this.bodyAnatomy = window.OrganismData.bodyAnatomy;

    // Mapeo de categorías a slots del cuerpo
    this.categoryToSlot = window.OrganismData.generateCategoryToSlotMap();

    // Tipos de células por tipo de contenido
    this.cellTypes = window.OrganismData.cellTypes;

    this.isInitialized = false;
    this.isVisible = false;
    this.animationFrameId = null;
    this.time = 0;
  }

  /**
   * Inicializar sistema orgánico
   */
  async init() {
    if (this.isInitialized) return;

    // console.log('🧬 Inicializando Organismo del Conocimiento...');

    // Usar nuevo UI de cartas si está disponible
    if (typeof FrankensteinLabUI !== 'undefined') {
      // console.log('🎴 Usando Frankenstein Lab UI (sistema de cartas)');
      this.frankensteinUI = new FrankensteinLabUI(this);
      this.isInitialized = true;
      return;
    }

    // Fallback a Three.js si FrankensteinLabUI no está disponible
    if (typeof THREE === 'undefined') {
      console.error('Three.js no está cargado');
      return;
    }

    this.createContainer();
    this.initThreeJS();
    await this.createOrganism();
    this.attachEventListeners();

    this.isInitialized = true;
    // console.log('✨ Organismo del Conocimiento inicializado');
  }

  /**
   * Crear contenedor DOM con UI biológica
   */
  createContainer() {
    const container = document.createElement('div');
    container.id = 'organism-container';
    container.className = 'fixed inset-0 z-50 hidden';
    container.style.background = 'radial-gradient(ellipse at center, #1a0a1a 0%, #000000 100%)';

    container.innerHTML = `
      <canvas id="organism-canvas" class="w-full h-full absolute inset-0" style="z-index: 1;"></canvas>

      <!-- Loading Screen LABORATORIO FRANKENSTEIN -->
      <div id="organism-loading" class="absolute inset-0 bg-gradient-to-b from-slate-950 via-gray-900 to-black flex items-center justify-center" style="z-index: 100;">
        <div class="text-center">
          <div class="text-9xl mb-6 animate-pulse">⚡</div>
          <div class="text-amber-400 text-4xl font-bold mb-4" style="font-family: 'Courier New', monospace; text-shadow: 0 0 20px #fbbf24;">
            LABORATORIO FRANKENSTEIN
          </div>
          <div class="text-green-400 text-xl mb-2" style="font-family: 'Courier New', monospace;">Preparando mesa de operaciones...</div>
          <div class="text-slate-400 text-lg">Calibrando generadores eléctricos</div>
          <div class="mt-8 flex justify-center gap-4">
            <div class="w-5 h-5 rounded-full bg-amber-500 animate-ping"></div>
            <div class="w-5 h-5 rounded-full bg-yellow-500 animate-ping" style="animation-delay: 0.2s"></div>
            <div class="w-5 h-5 rounded-full bg-green-500 animate-ping" style="animation-delay: 0.4s"></div>
          </div>
          <div class="mt-6 text-red-500 text-sm animate-pulse">⚠️ ALTA TENSIÓN ⚠️</div>
        </div>
      </div>

      <!-- HUD biológico -->
      <div id="organism-hud" class="absolute inset-0 pointer-events-none" style="z-index: 50;">
        <!-- Top Bar -->
        <div class="absolute top-0 left-0 right-0 p-4 sm:p-6 pointer-events-auto">
          <div class="max-w-7xl mx-auto flex flex-wrap justify-between items-start gap-4">

            <!-- Título LABORATORIO -->
            <div class="backdrop-blur-xl bg-gradient-to-r from-slate-900/95 to-gray-900/95 rounded-lg px-6 py-3 border-4 border-amber-600/80 shadow-2xl" style="font-family: 'Courier New', monospace; box-shadow: 0 0 30px rgba(251, 191, 36, 0.3);">
              <div class="flex items-center gap-3">
                <div class="text-4xl animate-pulse">⚡</div>
                <div>
                  <div class="text-amber-400 text-sm uppercase tracking-widest font-bold" style="text-shadow: 0 0 10px #fbbf24;">LABORATORIO FRANKENSTEIN</div>
                  <div class="text-green-400 text-lg font-bold" id="organism-mode-title">Construcción del Ser</div>
                </div>
              </div>
            </div>

            <!-- Modos de vista -->
            <div class="backdrop-blur-xl bg-gradient-to-r from-slate-900/90 to-slate-800/90 rounded-2xl p-2 border-2 border-rose-500/40 shadow-2xl">
              <div class="flex gap-2">
                <button data-mode="anatomy" class="organism-mode-btn active group px-4 py-2 rounded-xl hover:bg-red-500/20 transition-all" title="Vista Anatómica">
                  <span class="text-2xl">🫀</span>
                </button>
                <button data-mode="cellular" class="organism-mode-btn group px-4 py-2 rounded-xl hover:bg-pink-500/20 transition-all" title="Vista Celular">
                  <span class="text-2xl">🔬</span>
                </button>
                <button data-mode="ecosystem" class="organism-mode-btn group px-4 py-2 rounded-xl hover:bg-purple-500/20 transition-all" title="Ecosistema">
                  <span class="text-2xl">🌿</span>
                </button>
                <button data-mode="laboratory" class="organism-mode-btn group px-4 py-2 rounded-xl hover:bg-cyan-500/20 transition-all" title="Laboratorio">
                  <span class="text-2xl">🧪</span>
                </button>
              </div>
            </div>

            <!-- Cerrar -->
            <button id="organism-close" class="backdrop-blur-xl bg-gradient-to-r from-slate-900/90 to-slate-800/90 rounded-2xl px-4 py-2 border-2 border-red-500/40 hover:bg-red-500/20 transition-all shadow-2xl text-white">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>

        <!-- Laboratorio de Combinación -->
        <div id="organism-laboratory" class="absolute top-28 left-6 backdrop-blur-xl bg-gradient-to-br from-purple-900/95 to-slate-900/95 rounded-3xl p-6 border-2 border-purple-500/60 shadow-2xl hidden pointer-events-auto max-w-md" style="z-index: 60;">
          <div class="text-purple-400 text-2xl font-light mb-4">🧪 Laboratorio de Fusión</div>

          <div class="bg-cyan-900/30 border border-cyan-500/50 rounded-lg p-3 mb-4 text-xs text-cyan-300">
            <strong>📋 Instrucciones:</strong><br>
            1. Haz <strong>click</strong> en células (las esferas rosas alrededor de los órganos)<br>
            2. Selecciona 2-3 células de diferentes libros<br>
            3. Presiona "Fusionar Células" para crear un organismo híbrido
          </div>

          <!-- Área de fusión -->
          <div id="fusion-area" class="border-2 border-dashed border-purple-500/50 rounded-2xl p-6 mb-4 min-h-[200px] bg-purple-950/30">
            <div class="text-center text-slate-400 text-sm" id="fusion-placeholder">
              Haz click en células para seleccionarlas
            </div>
            <div id="selected-cells-container" class="grid grid-cols-2 gap-3 mt-4 hidden">
              <!-- Células seleccionadas aparecerán aquí -->
            </div>
          </div>

          <!-- Botones de acción -->
          <div class="flex gap-2">
            <button id="fusion-button" class="flex-1 px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-xl text-white font-semibold text-lg transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed" disabled>
              ⚗️ Fusionar
            </button>
            <button id="clear-selection-button" class="px-4 py-4 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 rounded-xl text-white font-semibold transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed" disabled>
              🗑️
            </button>
          </div>

          <!-- Resultado de fusión -->
          <div id="fusion-result" class="mt-4 p-4 bg-green-900/30 border-2 border-green-500/60 rounded-xl hidden">
            <div class="text-green-400 font-semibold mb-2">✨ Nuevo Organismo Creado</div>
            <div class="text-slate-300 text-sm" id="fusion-result-text"></div>
          </div>
        </div>

        <!-- Info Cell Tooltip MEJORADO -->
        <div id="organism-tooltip" class="absolute pointer-events-none hidden transition-all duration-300 z-50" style="transform: translateY(-10px); opacity: 0;">
          <div class="backdrop-blur-xl bg-gradient-to-br from-slate-900/98 via-purple-900/98 to-pink-900/98 rounded-2xl px-6 py-5 border-2 border-rose-500/60 shadow-2xl max-w-md">
            <!-- Header con icono grande -->
            <div class="flex items-center gap-4 mb-4 pb-3 border-b-2 border-rose-500/30">
              <div class="text-5xl animate-bounce" id="cell-icon" style="animation-duration: 2s;">🔬</div>
              <div class="flex-1">
                <div class="text-rose-300 text-xl font-bold" id="cell-title"></div>
                <div class="flex items-center gap-2 mt-1">
                  <span class="px-2 py-1 bg-purple-500/30 rounded-full text-purple-300 text-xs font-semibold" id="cell-type"></span>
                  <span class="text-slate-400 text-xs">•</span>
                  <span class="text-slate-400 text-xs" id="cell-source"></span>
                </div>
              </div>
            </div>

            <div class="text-slate-200 text-sm leading-relaxed mb-4" id="cell-description"></div>

            <!-- ADN de la célula -->
            <div class="bg-purple-950/40 rounded-xl p-3 mb-3 border border-purple-500/30">
              <div class="text-purple-300 text-sm font-bold mb-2 flex items-center gap-2">
                <span class="text-lg">🧬</span>
                ADN Conceptual
              </div>
              <div class="flex flex-wrap gap-2" id="cell-dna"></div>
            </div>

            <!-- Mitocondrias (prácticas) -->
            <div class="bg-amber-950/40 rounded-xl p-3 border border-amber-500/30">
              <div class="text-amber-300 text-sm font-bold mb-2 flex items-center gap-2">
                <span class="text-lg">⚡</span>
                Energía Práctica
              </div>
              <div class="text-slate-200 text-sm" id="cell-mitochondria"></div>
            </div>

            <!-- Click para seleccionar (solo en modo lab) -->
            <div id="tooltip-action-hint" class="hidden mt-3 pt-3 border-t border-rose-500/30">
              <div class="text-center text-rose-300 text-xs font-semibold animate-pulse">
                💡 Click para seleccionar esta célula
              </div>
            </div>
          </div>
        </div>

        <!-- Panel ESTADO DEL CUERPO -->
        <div class="absolute bottom-6 left-6 backdrop-blur-xl bg-gradient-to-br from-slate-950/95 to-gray-900/95 rounded-lg px-6 py-5 border-4 border-green-600/60 shadow-2xl pointer-events-auto max-w-md" style="font-family: 'Courier New', monospace; box-shadow: 0 0 25px rgba(34, 197, 94, 0.2);">
          <div class="text-green-400 text-sm uppercase tracking-wider font-bold mb-4 flex items-center gap-2" style="text-shadow: 0 0 8px #22c55e;">
            <span class="text-2xl">🧟</span>
            ESTADO DEL CUERPO
          </div>
          <div class="space-y-3" id="body-status-list">
            <!-- ÓRGANOS VITALES -->
            <div class="text-red-400 text-xs font-bold mb-2">⚠️ ÓRGANOS VITALES (Requeridos)</div>
            <div id="vital-organs-status" class="space-y-2 text-sm">
              <!-- Se genera dinámicamente -->
            </div>

            <div class="border-t border-slate-700 my-3"></div>

            <!-- ÓRGANOS COMPLEMENTARIOS -->
            <div class="text-cyan-400 text-xs font-bold mb-2">💎 COMPLEMENTARIOS (Mejoran al ser)</div>
            <div id="complementary-organs-status" class="space-y-2 text-sm">
              <!-- Se genera dinámicamente -->
            </div>
          </div>
        </div>

        <!-- Panel NUTRICIÓN DE ÓRGANOS -->
        <div id="nutrition-panel" class="absolute top-32 left-6 backdrop-blur-xl bg-gradient-to-br from-cyan-950/95 to-blue-900/95 rounded-lg px-6 py-5 border-4 border-cyan-600/60 shadow-2xl pointer-events-auto max-w-md max-h-[60vh] overflow-y-auto hidden" style="font-family: 'Courier New', monospace; box-shadow: 0 0 25px rgba(34, 211, 238, 0.2);">
          <div class="text-cyan-400 text-sm uppercase tracking-wider font-bold mb-4 flex items-center gap-2" style="text-shadow: 0 0 8px #22d3ee;">
            <span class="text-2xl">🍃</span>
            NUTRICIÓN DE ÓRGANOS
          </div>

          <div class="text-slate-300 text-xs mb-4 p-2 bg-cyan-900/20 rounded border border-cyan-500/30">
            💡 Cada órgano necesita <strong class="text-cyan-300">2-3 capítulos</strong> para estar bien nutrido. Selecciona capítulos para fortalecer los órganos implantados.
          </div>

          <div id="nutrition-organs-list" class="space-y-4">
            <!-- Se genera dinámicamente -->
          </div>
        </div>

        <!-- Panel SIGNOS VITALES estilo monitor médico -->
        <div class="absolute bottom-6 right-6 backdrop-blur-xl bg-gradient-to-br from-slate-950/95 to-gray-900/95 rounded-lg px-6 py-5 border-4 border-amber-600/60 shadow-2xl pointer-events-auto min-w-[280px]" style="font-family: 'Courier New', monospace; box-shadow: 0 0 25px rgba(251, 191, 36, 0.2);">
          <div class="text-amber-400 text-sm uppercase tracking-wider font-bold mb-4" style="text-shadow: 0 0 8px #fbbf24;">
            ⚡ GENERADOR VITAL
          </div>
          <div class="space-y-3 text-sm">
            <div class="flex items-center justify-between gap-4 p-2 bg-slate-900/50 rounded">
              <span class="text-slate-300">Carga eléctrica:</span>
              <span class="text-amber-400 font-bold text-lg" id="electrical-charge">0%</span>
            </div>
            <div class="flex items-center justify-between gap-4 p-2 bg-slate-900/50 rounded">
              <span class="text-slate-300">Órganos implantados:</span>
              <span class="text-green-400 font-bold text-lg" id="organs-implanted">0/3</span>
            </div>
            <div class="flex items-center justify-between gap-4 p-2 bg-slate-900/50 rounded">
              <span class="text-slate-300">Nutrición:</span>
              <span class="text-cyan-400 font-bold text-lg" id="nutrition-level">0/6</span>
            </div>
            <div class="flex items-center justify-between gap-4 p-2 bg-slate-900/50 rounded">
              <span class="text-slate-300">Estado:</span>
              <span class="text-red-400 font-bold animate-pulse" id="body-state">INERTE</span>
            </div>
          </div>

          <!-- Botón de activación -->
          <button id="activate-body-btn" class="w-full mt-4 px-4 py-3 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 rounded-lg text-black font-bold text-lg transition-all shadow-lg disabled:opacity-30 disabled:cursor-not-allowed" style="text-shadow: 0 0 5px #000; box-shadow: 0 0 20px rgba(251, 191, 36, 0.5);" disabled>
            ⚡ ACTIVAR SER ⚡
          </button>
        </div>

        <!-- Instrucciones -->
        <div class="absolute top-28 right-6 backdrop-blur-xl bg-gradient-to-br from-slate-900/90 to-slate-800/90 rounded-2xl px-6 py-4 border-2 border-cyan-500/40 shadow-2xl text-sm text-slate-300 max-w-xs pointer-events-auto">
          <div class="font-semibold text-cyan-400 mb-3 flex items-center gap-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
            </svg>
            Cómo usar el Organismo
          </div>
          <div class="space-y-2 text-xs">
            <div><strong class="text-rose-400">🫀 Hover:</strong> Ver información de célula/órgano</div>
            <div><strong class="text-purple-400">🔬 Click:</strong> Seleccionar para fusión (modo Lab)</div>
            <div><strong class="text-amber-400">⚡ Doble click órgano:</strong> Abrir libro completo</div>
            <div><strong class="text-green-400">🎮 Click derecho + arrastre:</strong> Rotar vista 360°</div>
            <div><strong class="text-cyan-400">🔍 Rueda ratón:</strong> Zoom in/out</div>
            <div class="text-xs text-amber-400 mt-3 border-t border-slate-700 pt-2">💡 Tip: Usa el modo 🧪 Laboratorio para combinar células de diferentes libros</div>
          </div>
        </div>

        <!-- Tutorial orgánico MEJORADO - Paso a paso -->
        <div id="organism-tutorial" class="absolute inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center pointer-events-auto hidden" style="z-index: 100;">
          <div class="max-w-4xl backdrop-blur-xl bg-gradient-to-br from-red-900/95 via-purple-900/95 to-pink-900/95 rounded-3xl border-4 border-rose-500/60 shadow-2xl overflow-hidden">

            <!-- Header con animación -->
            <div class="bg-gradient-to-r from-rose-600/40 to-purple-600/40 p-6 text-center border-b-2 border-rose-500/50">
              <div class="text-7xl mb-3 animate-pulse">🧬</div>
              <h2 class="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-rose-300 to-pink-300 mb-2">
                Organismo del Conocimiento
              </h2>
              <p class="text-rose-200 text-sm tracking-wider uppercase">Sistema Biológico Generativo de Aprendizaje</p>
            </div>

            <!-- Contenido paso a paso -->
            <div id="tutorial-step-container" class="p-8">
              <!-- Paso 1: Introducción -->
              <div class="tutorial-step" data-step="1">
                <div class="text-center mb-6">
                  <div class="inline-block bg-gradient-to-r from-rose-500 to-purple-500 text-white px-4 py-2 rounded-full text-sm font-semibold mb-4">
                    Paso 1 de 4
                  </div>
                </div>
                <h3 class="text-2xl font-bold text-rose-300 mb-4 text-center">¿Qué es el Organismo del Conocimiento?</h3>
                <p class="text-slate-200 text-lg leading-relaxed mb-6 text-center">
                  Imagina el conocimiento como un <strong class="text-rose-400">ser vivo que respira, late y evoluciona</strong>.
                  Cada libro es un órgano vital, cada capítulo una célula con su propio ADN conceptual.
                </p>
                <div class="grid grid-cols-2 gap-4 mb-6">
                  <div class="bg-gradient-to-br from-rose-900/50 to-red-900/50 rounded-2xl p-6 border-2 border-rose-500/40 hover:border-rose-400 transition-all hover:scale-105">
                    <div class="text-5xl mb-3 text-center">🫀</div>
                    <div class="text-rose-300 font-bold text-lg mb-2 text-center">Órganos Vivos</div>
                    <div class="text-slate-300 text-sm text-center">Libros que laten con conocimiento. Cada uno tiene su función única en el ecosistema del saber</div>
                  </div>
                  <div class="bg-gradient-to-br from-pink-900/50 to-purple-900/50 rounded-2xl p-6 border-2 border-pink-500/40 hover:border-pink-400 transition-all hover:scale-105">
                    <div class="text-5xl mb-3 text-center">🔬</div>
                    <div class="text-pink-300 font-bold text-lg mb-2 text-center">Células de Saber</div>
                    <div class="text-slate-300 text-sm text-center">Capítulos como células. Contienen ADN (conceptos) y mitocondrias (prácticas energéticas)</div>
                  </div>
                </div>
              </div>

              <!-- Paso 2: Exploración -->
              <div class="tutorial-step hidden" data-step="2">
                <div class="text-center mb-6">
                  <div class="inline-block bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-full text-sm font-semibold mb-4">
                    Paso 2 de 4
                  </div>
                </div>
                <h3 class="text-2xl font-bold text-purple-300 mb-4 text-center">Explora el Ecosistema</h3>
                <div class="bg-slate-900/70 rounded-2xl p-6 mb-6 border-2 border-purple-500/50">
                  <div class="space-y-4">
                    <div class="flex items-start gap-4 p-4 bg-purple-900/30 rounded-xl border border-purple-500/30">
                      <div class="text-3xl">🎮</div>
                      <div>
                        <div class="text-purple-300 font-bold mb-1">Click Derecho + Arrastra</div>
                        <div class="text-slate-300 text-sm">Rota la vista 360° para explorar desde todos los ángulos</div>
                      </div>
                    </div>
                    <div class="flex items-start gap-4 p-4 bg-cyan-900/30 rounded-xl border border-cyan-500/30">
                      <div class="text-3xl">🔍</div>
                      <div>
                        <div class="text-cyan-300 font-bold mb-1">Rueda del Ratón</div>
                        <div class="text-slate-300 text-sm">Acércate o aléjate para ver detalles o la vista general</div>
                      </div>
                    </div>
                    <div class="flex items-start gap-4 p-4 bg-rose-900/30 rounded-xl border border-rose-500/30">
                      <div class="text-3xl">🫀</div>
                      <div>
                        <div class="text-rose-300 font-bold mb-1">Hover sobre Órganos</div>
                        <div class="text-slate-300 text-sm">Pasa el ratón sobre los órganos para ver información del libro</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Paso 3: Laboratorio -->
              <div class="tutorial-step hidden" data-step="3">
                <div class="text-center mb-6">
                  <div class="inline-block bg-gradient-to-r from-pink-500 to-purple-500 text-white px-4 py-2 rounded-full text-sm font-semibold mb-4">
                    Paso 3 de 4
                  </div>
                </div>
                <h3 class="text-2xl font-bold text-pink-300 mb-4 text-center">🧪 Laboratorio de Fusión Genética</h3>
                <p class="text-slate-200 text-center mb-6">
                  La magia sucede aquí: <strong class="text-pink-400">combina células de diferentes libros</strong> para crear organismos híbridos únicos
                </p>
                <div class="bg-gradient-to-br from-purple-900/50 to-pink-900/50 rounded-2xl p-6 mb-6 border-2 border-purple-500/50">
                  <div class="text-purple-300 font-bold text-lg mb-4 flex items-center gap-2">
                    <span class="text-2xl">📋</span>
                    Proceso de Fusión Paso a Paso
                  </div>
                  <ol class="space-y-3">
                    <li class="flex items-start gap-3 p-3 bg-slate-900/50 rounded-lg">
                      <div class="flex-shrink-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">1</div>
                      <div class="text-slate-300 text-sm pt-1">Activa el modo <strong class="text-purple-400">🧪 Laboratorio</strong> desde los botones superiores</div>
                    </li>
                    <li class="flex items-start gap-3 p-3 bg-slate-900/50 rounded-lg">
                      <div class="flex-shrink-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">2</div>
                      <div class="text-slate-300 text-sm pt-1">Haz <strong class="text-pink-400">click</strong> en las células (esferas rosas) alrededor de los órganos</div>
                    </li>
                    <li class="flex items-start gap-3 p-3 bg-slate-900/50 rounded-lg">
                      <div class="flex-shrink-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">3</div>
                      <div class="text-slate-300 text-sm pt-1">Selecciona entre <strong class="text-pink-400">2-3 células</strong> de diferentes libros para mayor diversidad</div>
                    </li>
                    <li class="flex items-start gap-3 p-3 bg-slate-900/50 rounded-lg">
                      <div class="flex-shrink-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">4</div>
                      <div class="text-slate-300 text-sm pt-1">Presiona <strong class="text-purple-400">⚗️ Fusionar</strong> y observa cómo nace un nuevo organismo</div>
                    </li>
                  </ol>
                </div>
                <div class="bg-amber-900/30 border-2 border-amber-500/50 rounded-xl p-4">
                  <div class="flex items-center gap-3">
                    <div class="text-3xl">💡</div>
                    <div class="text-amber-200 text-sm">
                      <strong>Tip:</strong> Los organismos híbridos combinan el ADN (conceptos) de ambas células.
                      ¡Experimenta creando tus propias síntesis de conocimiento!
                    </div>
                  </div>
                </div>
              </div>

              <!-- Paso 4: Modos de vista -->
              <div class="tutorial-step hidden" data-step="4">
                <div class="text-center mb-6">
                  <div class="inline-block bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-4 py-2 rounded-full text-sm font-semibold mb-4">
                    Paso 4 de 4
                  </div>
                </div>
                <h3 class="text-2xl font-bold text-cyan-300 mb-4 text-center">🌟 Modos de Visualización</h3>
                <p class="text-slate-200 text-center mb-6">
                  Explora el conocimiento desde diferentes perspectivas
                </p>
                <div class="grid grid-cols-2 gap-4">
                  <div class="bg-gradient-to-br from-red-900/40 to-rose-900/40 rounded-xl p-6 border-2 border-rose-500/40 hover:border-rose-400 transition-all">
                    <div class="text-5xl mb-3 text-center">🫀</div>
                    <div class="text-rose-300 font-bold text-center mb-2">Anatomía</div>
                    <div class="text-slate-300 text-sm text-center">Vista general de todos los órganos y su estructura</div>
                  </div>
                  <div class="bg-gradient-to-br from-pink-900/40 to-purple-900/40 rounded-xl p-6 border-2 border-pink-500/40 hover:border-pink-400 transition-all">
                    <div class="text-5xl mb-3 text-center">🔬</div>
                    <div class="text-pink-300 font-bold text-center mb-2">Celular</div>
                    <div class="text-slate-300 text-sm text-center">Acércate a nivel microscópico de células</div>
                  </div>
                  <div class="bg-gradient-to-br from-green-900/40 to-emerald-900/40 rounded-xl p-6 border-2 border-green-500/40 hover:border-green-400 transition-all">
                    <div class="text-5xl mb-3 text-center">🌿</div>
                    <div class="text-green-300 font-bold text-center mb-2">Ecosistema</div>
                    <div class="text-slate-300 text-sm text-center">Ve las relaciones y conexiones entre órganos</div>
                  </div>
                  <div class="bg-gradient-to-br from-purple-900/40 to-indigo-900/40 rounded-xl p-6 border-2 border-purple-500/40 hover:border-purple-400 transition-all">
                    <div class="text-5xl mb-3 text-center">🧪</div>
                    <div class="text-purple-300 font-bold text-center mb-2">Laboratorio</div>
                    <div class="text-slate-300 text-sm text-center">Experimenta combinando células genéticamente</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Footer con navegación -->
            <div class="bg-gradient-to-r from-slate-900/80 to-purple-900/80 p-6 border-t-2 border-rose-500/50">
              <div class="flex justify-between items-center">
                <button id="tutorial-prev" class="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl text-white font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed" disabled>
                  ← Anterior
                </button>
                <div id="tutorial-dots" class="flex gap-2">
                  <div class="tutorial-dot w-3 h-3 rounded-full bg-rose-500" data-step="1"></div>
                  <div class="tutorial-dot w-3 h-3 rounded-full bg-slate-600" data-step="2"></div>
                  <div class="tutorial-dot w-3 h-3 rounded-full bg-slate-600" data-step="3"></div>
                  <div class="tutorial-dot w-3 h-3 rounded-full bg-slate-600" data-step="4"></div>
                </div>
                <button id="tutorial-next" class="px-6 py-3 bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 rounded-xl text-white font-semibold transition-all shadow-lg">
                  Siguiente →
                </button>
              </div>
              <div class="text-center mt-4">
                <button id="organism-tutorial-skip" class="text-slate-400 hover:text-slate-200 text-sm underline">
                  Saltar tutorial
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(container);
  }

  /**
   * Inicializar Three.js
   */
  initThreeJS() {
    const canvas = document.getElementById('organism-canvas');
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0x1a0a1a, 500, 3000);

    // Camera
    this.camera = new THREE.PerspectiveCamera(60, width / height, 1, 5000);
    this.camera.position.set(0, 300, 800);
    this.camera.lookAt(0, 0, 0);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 1);

    // Raycaster
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    // Luces orgánicas
    const ambientLight = new THREE.AmbientLight(0x4a1a1a, 0.6);
    this.scene.add(ambientLight);

    // Luz roja (corazón)
    const redLight = new THREE.PointLight(0xff0040, 2, 1000);
    redLight.position.set(0, 200, 0);
    this.scene.add(redLight);

    // Luz púrpura (cerebro)
    const purpleLight = new THREE.PointLight(0xa855f7, 1.5, 1000);
    purpleLight.position.set(-300, 100, -300);
    this.scene.add(purpleLight);

    // Luz rosa (células)
    const pinkLight = new THREE.PointLight(0xf472b6, 1.5, 1000);
    pinkLight.position.set(300, 100, 300);
    this.scene.add(pinkLight);

    // console.log('✅ Three.js inicializado para organismo');
  }

  /**
   * CREAR LABORATORIO FRANKENSTEIN
   */
  async createOrganism() {
    // console.log('🧟 Creando laboratorio Frankenstein...');

    // 1. Crear cuerpo humanoid vacío en el centro
    this.createBodyModel();

    // 2. Crear slots visuales para cada órgano
    this.createBodySlots();

    // 3. Crear órganos disponibles flotando alrededor
    await this.createAvailableOrgans();

    // 4. Crear células (capítulos) alrededor de cada órgano
    await this.createCells();

    // 5. Actualizar UI
    this.updateBodyStatus();

    // 6. Ocultar loading
    setTimeout(() => {
      const loading = document.getElementById('organism-loading');
      if (loading) {
        loading.style.opacity = '0';
        loading.style.transition = 'opacity 0.8s';
        setTimeout(() => loading.remove(), 800);
      }
    }, 1500);
  }

  /**
   * Crear modelo 3D del cuerpo humanoid vacío
   */
  createBodyModel() {
    // console.log('👤 Creando cuerpo humanoid...');

    const bodyGroup = new THREE.Group();

    // Silueta humanoide simple
    const bodyMaterial = new THREE.MeshPhongMaterial({
      color: 0x1a1a2e,
      transparent: true,
      opacity: 0.3,
      wireframe: true
    });

    // Cabeza
    const headGeo = new THREE.SphereGeometry(60, 16, 16);
    const head = new THREE.Mesh(headGeo, bodyMaterial);
    head.position.set(0, 400, 0);
    bodyGroup.add(head);

    // Torso
    const torsoGeo = new THREE.CylinderGeometry(50, 70, 250, 8);
    const torso = new THREE.Mesh(torsoGeo, bodyMaterial);
    torso.position.set(0, 200, 0);
    bodyGroup.add(torso);

    // Brazos
    const armGeo = new THREE.CylinderGeometry(20, 20, 150, 8);
    const leftArm = new THREE.Mesh(armGeo, bodyMaterial);
    leftArm.position.set(-100, 200, 0);
    leftArm.rotation.z = Math.PI / 4;
    bodyGroup.add(leftArm);

    const rightArm = new THREE.Mesh(armGeo, bodyMaterial);
    rightArm.position.set(100, 200, 0);
    rightArm.rotation.z = -Math.PI / 4;
    bodyGroup.add(rightArm);

    // Piernas
    const legGeo = new THREE.CylinderGeometry(25, 20, 200, 8);
    const leftLeg = new THREE.Mesh(legGeo, bodyMaterial);
    leftLeg.position.set(-40, 0, 0);
    bodyGroup.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeo, bodyMaterial);
    rightLeg.position.set(40, 0, 0);
    bodyGroup.add(rightLeg);

    this.bodyModel = bodyGroup;
    this.scene.add(bodyGroup);

    // console.log('✅ Cuerpo creado - esperando órganos...');
  }

  /**
   * Crear slots visuales para posiciones anatómicas
   */
  createBodySlots() {
    // console.log('🎯 Creando slots anatómicos...');

    Object.entries(this.bodyAnatomy).forEach(([slotId, slotData]) => {
      // Crear marcador visual para el slot
      const slotGeometry = new THREE.SphereGeometry(40, 16, 16);
      const slotMaterial = new THREE.MeshPhongMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.2,
        emissive: 0x00ffff,
        emissiveIntensity: 0.3
      });

      const slotMesh = new THREE.Mesh(slotGeometry, slotMaterial);
      slotMesh.position.set(
        slotData.position.x,
        slotData.position.y,
        slotData.position.z
      );

      // Pulso para slots required
      if (slotData.required) {
        slotMesh.userData.required = true;
        slotMaterial.color.setHex(0xff0000);
        slotMaterial.emissive.setHex(0xff0000);
      }

      slotMesh.userData = {
        type: 'bodySlot',
        slotId: slotId,
        slotData: slotData,
        empty: true
      };

      this.bodySlots[slotId] = slotMesh;
      this.scene.add(slotMesh);
    });

    // console.log('✅ Slots creados:', Object.keys(this.bodySlots).length);
  }

  /**
   * Crear órganos disponibles (libros) flotando alrededor
   */
  async createAvailableOrgans() {
    // console.log('🫀 Preparando órganos disponibles...');

    const catalog = this.bookEngine?.catalog;
    if (!catalog || !catalog.books) {
      console.error('Catálogo no disponible');
      return;
    }

    const books = catalog.books;
    const radius = 600; // Distancia del cuerpo

    books.forEach((book, index) => {
      const angle = (index / books.length) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      const organGroup = this.createOrganPiece(book, { x, y: 200, z });
      this.availableOrgans.push(organGroup);
      this.scene.add(organGroup); // organGroup ya ES el THREE.Group
    });

    // console.log('✅ Órganos disponibles:', this.availableOrgans.length);
  }

  /**
   * Crear pieza de órgano (libro como órgano flotante arrastrable)
   */
  createOrganPiece(book, position) {
    const group = new THREE.Group();
    group.position.set(position.x, position.y, position.z);

    // Determinar categoría del libro para asignar slot
    const slotId = this.categoryToSlot[book.category] || 'head';
    const slotData = this.bodyAnatomy[slotId];

    // Geometría del órgano - esfera con glow
    const geometry = new THREE.SphereGeometry(50, 32, 32);
    const material = new THREE.MeshPhongMaterial({
      color: slotData.required ? 0xff6b6b : 0x4ecdc4,
      emissive: slotData.required ? 0xff0000 : 0x00ffcc,
      emissiveIntensity: 0.3,
      shininess: 100,
      transparent: true,
      opacity: 0.9
    });

    const mesh = new THREE.Mesh(geometry, material);
    group.add(mesh);

    // Añadir anillo exterior para indicar que es arrastrable
    const ringGeometry = new THREE.TorusGeometry(60, 3, 16, 100);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: slotData.required ? 0xffaa00 : 0x00ffaa,
      transparent: true,
      opacity: 0.6
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = Math.PI / 2;
    group.add(ring);

    // Metadata
    group.userData = {
      type: 'organ-piece',
      book: book,
      slotId: slotId,
      slotData: slotData,
      originalPosition: { ...position },
      mesh: mesh,
      ring: ring,
      draggable: true
    };

    return group;
  }

  /**
   * Crear slots visuales del cuerpo (marcadores de posición)
   */
  createBodySlots() {
    // console.log('🦴 Creando slots del cuerpo...');

    Object.entries(this.bodyAnatomy).forEach(([slotId, slotData]) => {
      const slotGroup = new THREE.Group();
      slotGroup.position.set(slotData.position.x, slotData.position.y, slotData.position.z);

      // Marcador visual del slot - círculo con borde
      const slotGeometry = new THREE.CircleGeometry(70, 32);
      const slotMaterial = new THREE.MeshBasicMaterial({
        color: slotData.required ? 0xff4444 : 0x444444,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide
      });
      const slotMarker = new THREE.Mesh(slotGeometry, slotMaterial);
      slotMarker.rotation.x = -Math.PI / 2; // Horizontal
      slotGroup.add(slotMarker);

      // Borde del slot
      const borderGeometry = new THREE.RingGeometry(65, 75, 32);
      const borderMaterial = new THREE.MeshBasicMaterial({
        color: slotData.required ? 0xffaa00 : 0x666666,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide
      });
      const border = new THREE.Mesh(borderGeometry, borderMaterial);
      border.rotation.x = -Math.PI / 2;
      slotGroup.add(border);

      // Metadata
      slotGroup.userData = {
        type: 'body-slot',
        slotId: slotId,
        slotData: slotData,
        marker: slotMarker,
        border: border
      };

      this.bodySlots[slotId] = slotGroup;
      this.scene.add(slotGroup);
    });

    // console.log('✅ Slots del cuerpo creados:', Object.keys(this.bodySlots).length);
  }

  /**
   * Implantar órgano en un slot del cuerpo
   */
  implantOrgan(organPiece, slotId) {
    const slotData = this.bodyAnatomy[slotId];
    if (!slotData) {
      console.error('Slot inválido:', slotId);
      return false;
    }

    // Verificar si el órgano es compatible con el slot
    const book = organPiece.userData.book;
    if (!slotData.accepts.includes(book.category)) {
      // console.warn('Órgano no compatible con slot:', book.category, '→', slotId);
      // Mostrar feedback visual
      this.showIncompatibilityFeedback(organPiece, slotId);
      return false;
    }

    // Verificar si el slot ya está ocupado
    if (this.implantedOrgans[slotId]) {
      // console.warn('Slot ya ocupado:', slotId);
      return false;
    }

    // console.log('💉 Implantando órgano:', book.title, '→', slotData.name);

    // Animar el órgano hacia el slot
    this.animateOrganImplantation(organPiece, slotId);

    // Registrar órgano implantado
    this.implantedOrgans[slotId] = {
      book: book,
      organPiece: organPiece,
      connectedChapters: 0
    };

    // Remover de órganos disponibles
    const index = this.availableOrgans.indexOf(organPiece);
    if (index > -1) {
      this.availableOrgans.splice(index, 1);
    }

    // Actualizar estado del cuerpo
    this.updateBodyStatus();

    return true;
  }

  /**
   * Animar implantación de órgano
   */
  animateOrganImplantation(organPiece, slotId) {
    const slotPosition = this.bodySlots[slotId].position;
    const startPosition = organPiece.position.clone();
    const duration = 1000; // 1 segundo
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing suave
      const eased = 1 - Math.pow(1 - progress, 3);

      // Interpolar posición
      organPiece.position.lerpVectors(startPosition, slotPosition, eased);

      // Escalar ligeramente durante la animación
      const scale = 1 + Math.sin(progress * Math.PI) * 0.2;
      organPiece.scale.set(scale, scale, scale);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Animación completa - ajustar tamaño final
        organPiece.scale.set(0.8, 0.8, 0.8);

        // Efecto de relámpago si es un órgano vital
        if (this.bodyAnatomy[slotId].required) {
          this.createLightningEffect(slotPosition);
        }
      }
    };

    animate();
  }

  /**
   * Crear efecto de relámpago en implantación
   */
  createLightningEffect(position) {
    // Crear flash de luz
    const light = new THREE.PointLight(0xffff00, 2, 300);
    light.position.copy(position);
    this.scene.add(light);

    // Animar intensidad
    let intensity = 2;
    const fadeOut = setInterval(() => {
      intensity -= 0.1;
      light.intensity = Math.max(0, intensity);

      if (intensity <= 0) {
        this.scene.remove(light);
        clearInterval(fadeOut);
      }
    }, 50);
  }

  /**
   * Mostrar feedback de incompatibilidad
   */
  showIncompatibilityFeedback(organPiece, slotId) {
    const slot = this.bodySlots[slotId];
    if (!slot) return;

    // Hacer que el borde del slot parpadee en rojo
    const border = slot.userData.border;
    const originalColor = border.material.color.clone();

    border.material.color.setHex(0xff0000);

    setTimeout(() => {
      border.material.color.copy(originalColor);
    }, 300);
  }

  /**
   * Iniciar arrastre de órgano
   */
  startDraggingOrgan(organPiece) {
    this.draggedOrgan = {
      piece: organPiece,
      originalPosition: organPiece.position.clone(),
      plane: new THREE.Plane(new THREE.Vector3(0, 0, 1), 0) // Plano para proyectar el mouse
    };

    // Cambiar apariencia durante el arrastre
    organPiece.userData.mesh.material.emissiveIntensity = 0.7;
    organPiece.scale.set(1.2, 1.2, 1.2);

    // Resaltar slots compatibles
    this.highlightCompatibleSlots(organPiece);

    // console.log('🖐️ Arrastrando órgano:', organPiece.userData.book.title);
  }

  /**
   * Actualizar posición del órgano arrastrado
   */
  updateDraggedOrgan() {
    if (!this.draggedOrgan) return;

    const organPiece = this.draggedOrgan.piece;

    // Proyectar mouse en el plano 3D
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersection = new THREE.Vector3();
    this.raycaster.ray.intersectPlane(this.draggedOrgan.plane, intersection);

    if (intersection) {
      organPiece.position.copy(intersection);

      // Detectar slot cercano
      this.detectNearbySlot(organPiece);
    }
  }

  /**
   * Detectar slot cercano durante el arrastre
   */
  detectNearbySlot(organPiece) {
    const book = organPiece.userData.book;
    let closestSlot = null;
    let closestDistance = Infinity;

    Object.entries(this.bodySlots).forEach(([slotId, slotGroup]) => {
      const slotData = this.bodyAnatomy[slotId];

      // Solo considerar slots compatibles y vacíos
      if (!slotData.accepts.includes(book.category)) return;
      if (this.implantedOrgans[slotId]) return;

      const distance = organPiece.position.distanceTo(slotGroup.position);

      if (distance < 150 && distance < closestDistance) {
        closestSlot = { slotId, slotGroup, distance };
        closestDistance = distance;
      }
    });

    // Resaltar slot más cercano
    Object.values(this.bodySlots).forEach(slot => {
      slot.userData.border.material.opacity = 0.7;
      slot.userData.border.scale.set(1, 1, 1);
    });

    if (closestSlot) {
      this.nearbySlot = closestSlot.slotId;
      closestSlot.slotGroup.userData.border.material.opacity = 1;
      closestSlot.slotGroup.userData.border.scale.set(1.2, 1.2, 1.2);
    } else {
      this.nearbySlot = null;
    }
  }

  /**
   * Soltar órgano arrastrado
   */
  stopDraggingOrgan() {
    if (!this.draggedOrgan) return;

    const organPiece = this.draggedOrgan.piece;

    // Restaurar apariencia
    organPiece.userData.mesh.material.emissiveIntensity = 0.3;
    organPiece.scale.set(1, 1, 1);

    // Quitar resaltado de slots
    this.unhighlightAllSlots();

    // Intentar implantar si hay un slot cercano
    if (this.nearbySlot) {
      const success = this.implantOrgan(organPiece, this.nearbySlot);

      if (!success) {
        // Volver a posición original si falla
        this.returnOrganToOriginalPosition(organPiece);
      }
    } else {
      // Volver a posición original
      this.returnOrganToOriginalPosition(organPiece);
    }

    this.draggedOrgan = null;
    this.nearbySlot = null;
  }

  /**
   * Devolver órgano a su posición original
   */
  returnOrganToOriginalPosition(organPiece) {
    const originalPos = organPiece.userData.originalPosition;
    const startPos = organPiece.position.clone();
    const duration = 500;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 2);

      organPiece.position.lerpVectors(startPos, originalPos, eased);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }

  /**
   * Resaltar slots compatibles con el órgano
   */
  highlightCompatibleSlots(organPiece) {
    const book = organPiece.userData.book;

    Object.entries(this.bodySlots).forEach(([slotId, slotGroup]) => {
      const slotData = this.bodyAnatomy[slotId];
      const isCompatible = slotData.accepts.includes(book.category);
      const isOccupied = this.implantedOrgans[slotId];

      if (isCompatible && !isOccupied) {
        slotGroup.userData.border.material.color.setHex(0x00ff00);
        slotGroup.userData.border.material.opacity = 1;
      } else {
        slotGroup.userData.border.material.opacity = 0.3;
      }
    });
  }

  /**
   * Quitar resaltado de todos los slots
   */
  unhighlightAllSlots() {
    Object.entries(this.bodySlots).forEach(([slotId, slotGroup]) => {
      const slotData = this.bodyAnatomy[slotId];
      slotGroup.userData.border.material.color.setHex(slotData.required ? 0xffaa00 : 0x666666);
      slotGroup.userData.border.material.opacity = 0.7;
      slotGroup.userData.border.scale.set(1, 1, 1);
    });
  }

  /**
   * Crear órganos (libros como sistemas biológicos)
   */
  async createOrgans() {
    const catalog = this.bookEngine?.catalog;
    if (!catalog || !catalog.books) {
      console.error('Catálogo no disponible');
      return;
    }

    const books = catalog.books;

    books.forEach((book, index) => {
      const organType = this.organTypes[book.category] || this.organTypes['default'];
      const organ = this.createOrgan(book, organType, index);
      this.organs.push(organ);
      this.scene.add(organ.group);
    });

    // console.log('✅ Órganos creados:', this.organs.length);

    // Crear red neuronal conectando órganos relacionados
    this.createNeuralNetwork();
  }

  /**
   * Crear red neuronal entre órganos
   */
  createNeuralNetwork() {
    // console.log('🧠 Creando red neuronal...');

    // Crear red basada en afinidad entre libros
    this.neuralNetwork = this.neuralSystem.createNetworkFromOrgans(this.organs, {
      minAffinity: 15, // Afinidad mínima para crear conexión
      arcHeight: 150,
      connectionColor: new THREE.Color(0x00ffcc)
    });

    this.scene.add(this.neuralNetwork);

    // Crear flujos de energía en conexiones más fuertes
    this.neuralNetwork.children.forEach(connection => {
      if (connection.userData.strength > 0.5 && connection.userData.curve) {
        // Flujo bidireccional para conexiones fuertes
        const colors = {
          color1: new THREE.Color(0x00ffff),
          color2: new THREE.Color(0xff00ff)
        };

        const flow = this.energyFlow.createBidirectionalFlow(
          connection.userData.curve,
          {
            ...colors,
            particleCount: 10,
            size: 2,
            speed: 0.003,
            active: false // Inicialmente inactivo
          }
        );

        // Añadir partículas a escena
        this.energyFlow.addFlowToScene(flow.forward, this.scene);
        this.energyFlow.addFlowToScene(flow.backward, this.scene);

        // Vincular flujo con conexión
        connection.userData.energyFlow = flow;
      }
    });

    const stats = this.neuralSystem.getNetworkStats();
    // console.log(`✅ Red neuronal: ${stats.total} conexiones (${stats.distribution.strong} fuertes, ${stats.distribution.medium} medias, ${stats.distribution.weak} débiles)`);
  }

  /**
   * Crear un órgano individual
   */
  createOrgan(book, organType, index) {
    const group = new THREE.Group();

    // Posicionar en formación anatómica
    const angle = (index / this.organs.length) * Math.PI * 2;
    const radius = 400;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const y = 0;

    group.position.set(x, y, z);

    // Núcleo del órgano - Geometría biomédica realista
    const organGeometry = this.bioGeo.createGeometry(
      organType.name,
      this.config.organRadius,
      2 // detail level
    );

    // Material orgánico con shaders biomédicos
    const baseColor = new THREE.Color(organType.color);
    const material = this.bioShaders.createMaterialForOrgan(
      organType.name,
      baseColor
    );

    // Si la geometría es un grupo (como cerebro, corazón), aplicar material a todos sus hijos
    let core;
    if (organGeometry.type === 'Group') {
      core = organGeometry;
      core.traverse((child) => {
        if (child.isMesh && !child.material) {
          // Crear material específico para cada parte
          const partMaterial = this.bioShaders.createMaterialForOrgan(
            organType.name,
            baseColor
          );
          child.material = partMaterial;
        }
      });
    } else {
      // Geometría simple
      core = new THREE.Mesh(organGeometry, material);
    }

    group.add(core);

    // Membrana exterior iridiscente (solo para geometrías simples)
    let membrane = null;
    if (organGeometry.type !== 'Group') {
      const membraneGeometry = new THREE.IcosahedronGeometry(this.config.organRadius * 1.2, 1);
      const membraneMaterial = this.bioShaders.createMembraneMaterial(baseColor);

      membrane = new THREE.Mesh(membraneGeometry, membraneMaterial);
      group.add(membrane);
    }

    const organData = {
      group: group,
      core: core,
      membrane: membrane,
      book: book,
      organType: organType,
      heartbeatPhase: Math.random() * Math.PI * 2,
      breathingPhase: Math.random() * Math.PI * 2
    };

    core.userData = {
      type: 'organ',
      bookId: book.id,
      title: book.title,
      organName: organType.name,
      icon: organType.icon
    };

    return organData;
  }

  /**
   * Crear células (capítulos) CON ADN REAL
   */
  async createCells() {
    // console.log('🧬 Creando células con ADN real...');

    // Crear células tanto de órganos disponibles como de órganos ya implantados
    const allOrgans = [...(this.availableOrgans || []), ...(this.organs || [])];

    if (allOrgans.length === 0) {
      // console.warn('⚠️ No hay órganos para crear células');
      return;
    }

    for (const organGroup of allOrgans) {
      // organGroup ES un THREE.Group, el libro está en userData
      const book = organGroup.userData?.book || organGroup.book;
      if (!book) {
        // console.warn('⚠️ Órgano sin libro asociado:', organGroup);
        continue;
      }

      try {
        // Cargar metadata de capítulos si existe
        const metadata = await this.loadChapterMetadata(book.id);

        // Obtener capítulos del libro
        const chapters = this.getBookChapters(book);

        if (chapters.length === 0) {
          // console.warn(`⚠️ No hay capítulos para ${book.id}`);
          continue;
        }

        chapters.forEach((chapter, i) => {
          const cell = this.createCell(organGroup, chapter, metadata, i, chapters.length);
          this.cells.push(cell);

          // organGroup YA ES el THREE.Group, agregar directamente
          organGroup.add(cell.mesh);
        });
      } catch (error) {
        // console.warn(`Error creando células para ${book.id}:`, error);
      }
    }

    // console.log('✅ Células con ADN real creadas:', this.cells.length);
  }

  /**
   * Obtener capítulos de un libro
   */
  getBookChapters(book) {
    const chapters = [];

    // Buscar en bookEngine si existe
    if (this.bookEngine && this.bookEngine.catalog) {
      const fullBook = this.bookEngine.catalog.books.find(b => b.id === book.id);
      if (fullBook) {
        // Intentar obtener capítulos de sections
        if (fullBook.sections && Array.isArray(fullBook.sections)) {
          fullBook.sections.forEach(section => {
            if (section.chapters && Array.isArray(section.chapters)) {
              chapters.push(...section.chapters);
            }
          });
        }

        // Si no hay sections, intentar chapters directamente
        if (chapters.length === 0 && fullBook.chapters && Array.isArray(fullBook.chapters)) {
          chapters.push(...fullBook.chapters);
        }

        if (chapters.length > 0) {
          // console.log(`📚 [getBookChapters] ${book.id}: ${chapters.length} capítulos encontrados`);
          return chapters; // SIN LÍMITE - devolver todos los capítulos
        }
      }
    }

    // Fallback: crear capítulos genéricos solo si realmente no hay nada
    // console.warn(`⚠️ [getBookChapters] ${book.id}: No se encontraron capítulos, usando fallback genérico`);
    for (let i = 0; i < 6; i++) {
      chapters.push({
        id: `cap${i + 1}`,
        title: `Capítulo ${i + 1}`,
        tags: ['conocimiento', 'transformación']
      });
    }

    return chapters;
  }

  /**
   * Cargar metadata de capítulos (tags, dificultad, etc.)
   */
  async loadChapterMetadata(bookId) {
    try {
      const response = await fetch(`books/${bookId}/assets/chapter-metadata.json`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      // console.warn(`No se pudo cargar metadata para ${bookId}:`, error);
    }
    return {};
  }

  /**
   * Crear una célula individual CON ADN REAL
   */
  createCell(organ, chapter, metadata, index, total) {
    const angle = (index / total) * Math.PI * 2;
    // Los órganos tienen radio 50, las células orbitan a 120 unidades
    const distance = 120;

    const x = Math.cos(angle) * distance;
    const z = Math.sin(angle) * distance;
    const y = (Math.random() - 0.5) * 50; // Menos variación vertical

    // Extraer datos reales del capítulo
    const chapterMeta = metadata[chapter.id] || {};
    const tags = chapterMeta.tags || ['conocimiento'];
    const hasExercises = (chapter.exercises && chapter.exercises.length > 0) || (chapterMeta.relatedExercises && chapterMeta.relatedExercises.length > 0);
    const hasPractices = (chapterMeta.relatedPractices && chapterMeta.relatedPractices.length > 0);

    // Determinar tipo de célula basado en contenido
    const cellType = this.determineCellType(hasExercises, hasPractices, tags);

    // Geometría de célula - MAYOR para facilitar selección
    const geometry = new THREE.SphereGeometry(this.config.cellRadius * 1.2, 16, 16);
    const material = new THREE.MeshPhongMaterial({
      color: this.cellTypes[cellType].color,
      emissive: this.cellTypes[cellType].color,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.9
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);

    // Núcleo de la célula
    const nucleusGeometry = new THREE.SphereGeometry(this.config.cellRadius * 0.5, 12, 12);
    const nucleusMaterial = new THREE.MeshPhongMaterial({
      color: 0x9333ea,
      emissive: 0x9333ea,
      emissiveIntensity: 0.8
    });

    const nucleus = new THREE.Mesh(nucleusGeometry, nucleusMaterial);
    mesh.add(nucleus);

    const cellData = {
      mesh: mesh,
      nucleus: nucleus,
      organ: organ,
      chapter: chapter,
      type: cellType,
      dna: tags, // ADN REAL del capítulo
      mitochondria: (hasExercises ? 1 : 0) + (hasPractices ? 1 : 0), // Energía práctica
      difficulty: chapterMeta.difficulty || 'beginner'
    };

    mesh.userData = {
      type: 'cell',
      cellData: cellData,
      draggable: true,
      chapterId: chapter.id
    };

    return cellData;
  }

  /**
   * Determinar tipo de célula según contenido
   */
  determineCellType(hasExercises, hasPractices, tags) {
    if (hasExercises && hasPractices) {
      return 'teoría-práctica'; // Célula híbrida
    } else if (hasExercises || hasPractices) {
      return 'práctica';
    } else {
      return 'teoría';
    }
  }

  /**
   * Crear conexiones entre células/órganos
   */
  createConnections() {
    // Crear algunas conexiones visuales entre órganos relacionados
    // TODO: Basadas en relaciones temáticas reales

    // console.log('✅ Conexiones creadas');
  }

  /**
   * Actualizar estado completo del cuerpo Frankenstein
   */
  updateBodyStatus() {
    this.updateOrgansList();
    this.updateVitalSigns();
    this.updateNutritionPanel();
  }

  /**
   * Actualizar panel de nutrición con órganos implantados
   */
  updateNutritionPanel() {
    const panel = document.getElementById('nutrition-panel');
    const container = document.getElementById('nutrition-organs-list');

    if (!panel || !container) return;

    // Mostrar panel solo si hay órganos implantados
    const implantedCount = Object.keys(this.implantedOrgans).length;
    if (implantedCount === 0) {
      panel.classList.add('hidden');
      return;
    }

    panel.classList.remove('hidden');

    // Generar lista de órganos con sus capítulos
    container.innerHTML = Object.entries(this.implantedOrgans).map(([slotId, organData]) => {
      const book = organData.book;
      const slotData = this.bodyAnatomy[slotId];
      const nutrition = this.calculateOrganNutrition(slotId);
      const connectedChapters = organData.connectedChapters || 0;

      // Obtener capítulos del libro
      const chapters = book.chapters || [];

      // También obtener capítulos de libros relacionados (misma categoría)
      const relatedChapters = this.getRelatedChapters(book);

      const allChapters = [
        ...chapters.map(ch => ({ ...ch, source: 'same', bookTitle: book.title })),
        ...relatedChapters
      ];

      // Estado del órgano
      const statusColor = nutrition >= 100 ? 'text-green-400' : nutrition >= 50 ? 'text-amber-400' : 'text-red-400';
      const statusIcon = nutrition >= 100 ? '✅' : nutrition >= 50 ? '⚠️' : '❌';

      return `
        <div class="border-2 border-cyan-500/40 rounded-lg p-3 bg-slate-900/50">
          <div class="flex items-center gap-2 mb-3">
            <span class="text-3xl">${slotData.icon}</span>
            <div class="flex-1">
              <div class="text-cyan-300 font-bold text-sm">${slotData.name}</div>
              <div class="text-slate-400 text-xs">${book.title.substring(0, 30)}...</div>
            </div>
            <div class="${statusColor} font-bold text-lg">${statusIcon} ${nutrition}%</div>
          </div>

          <div class="text-slate-300 text-xs mb-2">
            Capítulos conectados: <strong class="text-cyan-300">${connectedChapters}/3</strong>
          </div>

          <div class="space-y-1 max-h-48 overflow-y-auto">
            ${allChapters.map((chapter, idx) => {
              const isConnected = organData.selectedChapters?.includes(chapter.id) || false;
              const isFromSameBook = chapter.source === 'same';
              const sourceLabel = isFromSameBook ? '📖 Mismo libro' : `📚 ${chapter.bookTitle}`;

              return `
                <label class="flex items-center gap-2 p-2 rounded hover:bg-cyan-900/20 cursor-pointer transition-colors ${isConnected ? 'bg-cyan-900/30' : ''}">
                  <input
                    type="checkbox"
                    class="nutrition-chapter-checkbox"
                    data-slot-id="${slotId}"
                    data-chapter-id="${chapter.id}"
                    data-book-id="${book.id}"
                    ${isConnected ? 'checked' : ''}
                    ${connectedChapters >= 3 && !isConnected ? 'disabled' : ''}
                  >
                  <div class="flex-1">
                    <div class="text-slate-300 text-xs">${chapter.title || chapter.id}</div>
                    <div class="text-slate-500 text-xs">${sourceLabel}</div>
                  </div>
                </label>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }).join('');

    // Añadir event listeners a los checkboxes
    this.attachNutritionListeners();
  }

  /**
   * Obtener capítulos de libros relacionados (misma categoría)
   */
  getRelatedChapters(book) {
    const catalog = this.bookEngine?.catalog;
    if (!catalog || !catalog.books) return [];

    const relatedChapters = [];

    // Buscar libros de la misma categoría
    catalog.books.forEach(otherBook => {
      if (otherBook.id === book.id) return; // Saltar el mismo libro
      if (otherBook.category !== book.category) return; // Solo misma categoría

      // Añadir hasta 2 capítulos de cada libro relacionado
      const chapters = otherBook.chapters || [];
      chapters.slice(0, 2).forEach(chapter => {
        relatedChapters.push({
          ...chapter,
          source: 'related',
          bookTitle: otherBook.title,
          bookId: otherBook.id
        });
      });
    });

    return relatedChapters;
  }

  /**
   * Añadir event listeners a checkboxes de nutrición
   */
  attachNutritionListeners() {
    document.querySelectorAll('.nutrition-chapter-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const slotId = e.target.dataset.slotId;
        const chapterId = e.target.dataset.chapterId;
        const bookId = e.target.dataset.bookId;
        const isChecked = e.target.checked;

        this.toggleChapterConnection(slotId, chapterId, bookId, isChecked);
      });
    });
  }

  /**
   * Conectar/desconectar capítulo a órgano
   */
  toggleChapterConnection(slotId, chapterId, bookId, connect) {
    const organData = this.implantedOrgans[slotId];
    if (!organData) return;

    // Inicializar array de capítulos seleccionados si no existe
    if (!organData.selectedChapters) {
      organData.selectedChapters = [];
    }

    if (connect) {
      // Añadir capítulo (máximo 3)
      if (organData.selectedChapters.length < 3 && !organData.selectedChapters.includes(chapterId)) {
        organData.selectedChapters.push(chapterId);
        organData.connectedChapters = organData.selectedChapters.length;

        // console.log(`🍃 Nutriendo órgano ${slotId} con capítulo ${chapterId}`);

        // Efecto visual en 3D
        this.animateChapterConnection(slotId, chapterId);
      }
    } else {
      // Remover capítulo
      const index = organData.selectedChapters.indexOf(chapterId);
      if (index > -1) {
        organData.selectedChapters.splice(index, 1);
        organData.connectedChapters = organData.selectedChapters.length;

        // console.log(`❌ Removiendo nutrición del órgano ${slotId}`);
      }
    }

    // Actualizar UI
    this.updateBodyStatus();
    this.updateOrganVisualNutrition(slotId);
  }

  /**
   * Animar conexión de capítulo a órgano en 3D
   */
  animateChapterConnection(slotId, chapterId) {
    const organPiece = this.implantedOrgans[slotId]?.organPiece;
    if (!organPiece) return;

    // Crear partícula de energía que va hacia el órgano
    const particleGeometry = new THREE.SphereGeometry(5, 8, 8);
    const particleMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffcc,
      transparent: true,
      opacity: 0.8
    });
    const particle = new THREE.Mesh(particleGeometry, particleMaterial);

    // Posición inicial: aleatoria alrededor del órgano
    const angle = Math.random() * Math.PI * 2;
    const distance = 200;
    particle.position.set(
      organPiece.position.x + Math.cos(angle) * distance,
      organPiece.position.y + (Math.random() - 0.5) * 100,
      organPiece.position.z + Math.sin(angle) * distance
    );

    this.scene.add(particle);

    // Animar hacia el órgano
    const startPos = particle.position.clone();
    const endPos = organPiece.position.clone();
    const duration = 1000;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      particle.position.lerpVectors(startPos, endPos, eased);
      particle.scale.setScalar(1 - progress); // Encogerse

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.scene.remove(particle);
        // Flash en el órgano
        this.createNutritionFlash(organPiece.position);
      }
    };

    animate();
  }

  /**
   * Crear flash de nutrición en órgano
   */
  createNutritionFlash(position) {
    const light = new THREE.PointLight(0x00ffcc, 1.5, 200);
    light.position.copy(position);
    this.scene.add(light);

    let intensity = 1.5;
    const fadeOut = setInterval(() => {
      intensity -= 0.1;
      light.intensity = Math.max(0, intensity);

      if (intensity <= 0) {
        this.scene.remove(light);
        clearInterval(fadeOut);
      }
    }, 50);
  }

  /**
   * Actualizar visualización de nutrición del órgano en 3D
   */
  updateOrganVisualNutrition(slotId) {
    const organData = this.implantedOrgans[slotId];
    if (!organData || !organData.organPiece) return;

    const organPiece = organData.organPiece;
    const nutrition = this.calculateOrganNutrition(slotId);

    // Cambiar color/intensidad según nutrición
    const mesh = organPiece.userData.mesh;
    if (mesh && mesh.material) {
      // Interpolación de color: rojo → amarillo → verde
      let color;
      if (nutrition >= 100) {
        color = new THREE.Color(0x00ff00); // Verde brillante
        mesh.material.emissiveIntensity = 0.6;
      } else if (nutrition >= 50) {
        color = new THREE.Color(0xffff00); // Amarillo
        mesh.material.emissiveIntensity = 0.4;
      } else {
        color = new THREE.Color(0xff0000); // Rojo
        mesh.material.emissiveIntensity = 0.3;
      }

      mesh.material.emissive = color;

      // Animar el anillo también
      const ring = organPiece.userData.ring;
      if (ring && ring.material) {
        ring.material.color = color;
        ring.material.opacity = 0.6 + (nutrition / 100) * 0.4;
      }
    }
  }

  /**
   * ACTIVAR EL SER - Secuencia eléctrica de Frankenstein
   */
  async activateBody() {
    if (this.bodyVitality < 80) {
      // console.warn('El cuerpo no tiene suficiente vitalidad para activar');
      return;
    }

    if (this.isBodyAlive) {
      // console.log('El ser ya está vivo');
      return;
    }

    // console.log('⚡⚡⚡ ACTIVANDO SER ⚡⚡⚡');

    // Deshabilitar botón
    const activateBtn = document.getElementById('activate-body-btn');
    if (activateBtn) {
      activateBtn.disabled = true;
      activateBtn.textContent = '⚡ ACTIVANDO... ⚡';
    }

    // Secuencia de activación
    await this.createActivationSequence();

    // Marcar como vivo
    this.isBodyAlive = true;

    // Mostrar modal de generación de conocimiento
    this.showBeingCreationModal();
  }

  /**
   * Crear secuencia de activación eléctrica
   */
  async createActivationSequence() {
    // Fase 1: Relámpagos preliminares (3 segundos)
    await this.phase1_LightningStorm();

    // Fase 2: Energizar órganos uno por uno (2 segundos)
    await this.phase2_EnergizeOrgans();

    // Fase 3: Gran relámpago final (1 segundo)
    await this.phase3_FinalBolt();

    // Fase 4: Pulso de vida (1 segundo)
    await this.phase4_LifePulse();
  }

  /**
   * Fase 1: Tormenta de relámpagos alrededor del cuerpo
   */
  async phase1_LightningStorm() {
    // console.log('⚡ Fase 1: Tormenta eléctrica');

    const duration = 3000;
    const startTime = Date.now();

    return new Promise((resolve) => {
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;

        if (elapsed >= duration) {
          clearInterval(interval);
          resolve();
          return;
        }

        // Crear relámpago aleatorio
        this.createRandomLightningBolt();
      }, 150); // Relámpago cada 150ms
    });
  }

  /**
   * Fase 2: Energizar órganos uno por uno
   */
  async phase2_EnergizeOrgans() {
    // console.log('⚡ Fase 2: Energizando órganos');

    const organSlots = Object.keys(this.implantedOrgans);
    const delayBetweenOrgans = 400; // 400ms por órgano

    for (let slotId of organSlots) {
      await new Promise(resolve => setTimeout(resolve, delayBetweenOrgans));
      this.energizeOrgan(slotId);
    }

    await new Promise(resolve => setTimeout(resolve, 500)); // Pausa extra
  }

  /**
   * Fase 3: Gran relámpago final desde arriba
   */
  async phase3_FinalBolt() {
    // console.log('⚡ Fase 3: Relámpago final');

    return new Promise((resolve) => {
      // Crear relámpago masivo desde arriba hacia el cerebro
      const headPos = this.bodyModel?.position || new THREE.Vector3(0, 0, 0);

      // Luz intensa desde arriba
      const lightningLight = new THREE.PointLight(0xffff00, 5, 1000);
      lightningLight.position.set(headPos.x, headPos.y + 800, headPos.z);
      this.scene.add(lightningLight);

      // Línea de relámpago
      const points = [
        new THREE.Vector3(headPos.x, headPos.y + 800, headPos.z),
        new THREE.Vector3(headPos.x + (Math.random() - 0.5) * 100, headPos.y + 500, headPos.z),
        new THREE.Vector3(headPos.x, headPos.y + 400, headPos.z)
      ];

      const curve = new THREE.CatmullRomCurve3(points);
      const boltPoints = curve.getPoints(50);
      const boltGeometry = new THREE.BufferGeometry().setFromPoints(boltPoints);
      const boltMaterial = new THREE.LineBasicMaterial({
        color: 0xffff00,
        linewidth: 5,
        transparent: true,
        opacity: 1
      });
      const boltLine = new THREE.Line(boltGeometry, boltMaterial);
      this.scene.add(boltLine);

      // Fade out
      setTimeout(() => {
        let opacity = 1;
        const fadeInterval = setInterval(() => {
          opacity -= 0.1;
          boltMaterial.opacity = Math.max(0, opacity);
          lightningLight.intensity = Math.max(0, opacity * 5);

          if (opacity <= 0) {
            this.scene.remove(boltLine);
            this.scene.remove(lightningLight);
            clearInterval(fadeInterval);
            resolve();
          }
        }, 50);
      }, 500);
    });
  }

  /**
   * Fase 4: Pulso de vida - todos los órganos brillan al unísono
   */
  async phase4_LifePulse() {
    // console.log('⚡ Fase 4: Pulso de vida');

    return new Promise((resolve) => {
      let pulseCount = 0;
      const maxPulses = 3;

      const pulseInterval = setInterval(() => {
        pulseCount++;

        // Hacer brillar todos los órganos
        Object.entries(this.implantedOrgans).forEach(([slotId, organData]) => {
          const organPiece = organData.organPiece;
          if (!organPiece) return;

          const mesh = organPiece.userData.mesh;
          if (mesh && mesh.material) {
            // Pulso de brillo
            const originalIntensity = mesh.material.emissiveIntensity;
            mesh.material.emissiveIntensity = 1.5;

            setTimeout(() => {
              mesh.material.emissiveIntensity = originalIntensity;
            }, 200);
          }

          // Flash de luz en la posición del órgano
          this.createNutritionFlash(organPiece.position);
        });

        if (pulseCount >= maxPulses) {
          clearInterval(pulseInterval);
          resolve();
        }
      }, 600); // Pulso cada 600ms
    });
  }

  /**
   * Crear relámpago aleatorio alrededor del cuerpo
   */
  createRandomLightningBolt() {
    const bodyCenter = this.bodyModel?.position || new THREE.Vector3(0, 0, 0);

    // Posición aleatoria alrededor del cuerpo
    const angle = Math.random() * Math.PI * 2;
    const radius = 300 + Math.random() * 200;
    const height = (Math.random() - 0.5) * 600;

    const startPos = new THREE.Vector3(
      bodyCenter.x + Math.cos(angle) * radius,
      bodyCenter.y + height,
      bodyCenter.z + Math.sin(angle) * radius
    );

    // Relámpago hacia un órgano aleatorio
    const organSlots = Object.keys(this.implantedOrgans);
    if (organSlots.length === 0) return;

    const randomSlot = organSlots[Math.floor(Math.random() * organSlots.length)];
    const targetOrgan = this.implantedOrgans[randomSlot].organPiece;
    if (!targetOrgan) return;

    const endPos = targetOrgan.position;

    // Crear línea de relámpago con curva
    const midPoint = new THREE.Vector3().lerpVectors(startPos, endPos, 0.5);
    midPoint.x += (Math.random() - 0.5) * 100;
    midPoint.y += (Math.random() - 0.5) * 100;

    const curve = new THREE.QuadraticBezierCurve3(startPos, midPoint, endPos);
    const points = curve.getPoints(30);
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: 0xffff00,
      linewidth: 2,
      transparent: true,
      opacity: 0.8
    });
    const lightningLine = new THREE.Line(geometry, material);
    this.scene.add(lightningLine);

    // Luz en el punto de inicio
    const light = new THREE.PointLight(0xffff00, 2, 400);
    light.position.copy(startPos);
    this.scene.add(light);

    // Fade out rápido
    setTimeout(() => {
      let opacity = 0.8;
      const fadeInterval = setInterval(() => {
        opacity -= 0.2;
        material.opacity = Math.max(0, opacity);
        light.intensity = Math.max(0, opacity * 2);

        if (opacity <= 0) {
          this.scene.remove(lightningLine);
          this.scene.remove(light);
          clearInterval(fadeInterval);
        }
      }, 50);
    }, 100);
  }

  /**
   * Energizar un órgano específico
   */
  energizeOrgan(slotId) {
    const organData = this.implantedOrgans[slotId];
    if (!organData || !organData.organPiece) return;

    const organPiece = organData.organPiece;
    const slotData = this.bodyAnatomy[slotId];

    // console.log(`⚡ Energizando ${slotData.name}...`);

    // Flash de luz brillante
    const light = new THREE.PointLight(0x00ffff, 3, 300);
    light.position.copy(organPiece.position);
    this.scene.add(light);

    // Pulsar el órgano
    const originalScale = organPiece.scale.clone();
    organPiece.scale.setScalar(1.3);

    // Cambiar material temporalmente
    const mesh = organPiece.userData.mesh;
    if (mesh && mesh.material) {
      mesh.material.emissiveIntensity = 1.5;
      mesh.material.emissive = new THREE.Color(0x00ffff);
    }

    // Revertir después de un momento
    setTimeout(() => {
      organPiece.scale.copy(originalScale);

      if (mesh && mesh.material) {
        mesh.material.emissiveIntensity = 0.6;
        mesh.material.emissive = new THREE.Color(0x00ff00); // Verde = vivo
      }

      // Fade out de la luz
      let intensity = 3;
      const fadeInterval = setInterval(() => {
        intensity -= 0.2;
        light.intensity = Math.max(0, intensity);

        if (intensity <= 0) {
          this.scene.remove(light);
          clearInterval(fadeInterval);
        }
      }, 50);
    }, 300);
  }

  /**
   * Mostrar modal de creación del ser
   */
  showBeingCreationModal() {
    // Crear modal
    const modal = document.createElement('div');
    modal.id = 'being-creation-modal';
    modal.className = 'fixed inset-0 bg-black/90 flex items-center justify-center z-[200]';
    modal.style.fontFamily = "'Courier New', monospace";

    modal.innerHTML = `
      <div class="bg-gradient-to-br from-slate-900 to-gray-900 rounded-2xl p-8 border-4 border-amber-600 shadow-2xl max-w-2xl w-full mx-4" style="box-shadow: 0 0 50px rgba(251, 191, 36, 0.5);">
        <div class="text-center mb-6">
          <div class="text-8xl mb-4 animate-pulse">⚡</div>
          <div class="text-amber-400 text-3xl font-bold mb-2" style="text-shadow: 0 0 20px #fbbf24;">
            ¡EL SER HA COBRADO VIDA!
          </div>
          <div class="text-green-400 text-xl">
            El conocimiento fluye a través de sus venas...
          </div>
        </div>

        <div class="bg-slate-950/50 rounded-lg p-6 mb-6 border border-cyan-500/30">
          <div class="text-cyan-300 text-sm mb-4">
            <strong>Órganos implantados:</strong>
          </div>
          <div class="space-y-2" id="being-organs-summary">
            ${Object.entries(this.implantedOrgans).map(([slotId, organData]) => {
              const slotData = this.bodyAnatomy[slotId];
              return `
                <div class="flex items-center gap-2 text-sm">
                  <span class="text-2xl">${slotData.icon}</span>
                  <span class="text-slate-300">${slotData.name}:</span>
                  <span class="text-green-400">${organData.book.title}</span>
                </div>
              `;
            }).join('')}
          </div>

          <div class="mt-4 pt-4 border-t border-slate-700">
            <div class="text-cyan-300 text-sm mb-2">
              <strong>Estadísticas del Ser:</strong>
            </div>
            <div class="grid grid-cols-2 gap-3 text-xs">
              <div class="flex justify-between p-2 bg-slate-900/50 rounded">
                <span class="text-slate-400">Vitalidad:</span>
                <span class="text-amber-400 font-bold">${this.bodyVitality}%</span>
              </div>
              <div class="flex justify-between p-2 bg-slate-900/50 rounded">
                <span class="text-slate-400">Órganos:</span>
                <span class="text-green-400 font-bold">${Object.keys(this.implantedOrgans).length}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="text-center">
          <button id="generate-being-knowledge-btn" class="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-lg text-white font-bold text-lg transition-all shadow-lg">
            🧠 Generar Conocimiento del Ser 🧠
          </button>
          <div class="mt-3">
            <button id="close-being-modal-btn" class="text-slate-400 hover:text-white text-sm">
              Cerrar (sin generar)
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Event listeners
    document.getElementById('generate-being-knowledge-btn')?.addEventListener('click', () => {
      this.generateBeingKnowledge();
    });

    document.getElementById('close-being-modal-btn')?.addEventListener('click', () => {
      modal.remove();
    });
  }

  /**
   * Generar conocimiento del ser con IA
   */
  async generateBeingKnowledge() {
    const button = document.getElementById('generate-being-knowledge-btn');
    if (button) {
      button.disabled = true;
      button.innerHTML = '🧠 Generando... 🧠';
    }

    // Recopilar información del ser
    const beingData = {
      organs: Object.entries(this.implantedOrgans).map(([slotId, organData]) => ({
        slot: this.bodyAnatomy[slotId].name,
        book: organData.book.title,
        category: organData.book.category,
        chapters: organData.selectedChapters || [],
        nutrition: this.calculateOrganNutrition(slotId)
      })),
      vitality: this.bodyVitality,
      totalOrgans: Object.keys(this.implantedOrgans).length
    };

    // console.log('🧠 Datos del ser:', beingData);

    // TODO: Llamar a IA para generar conocimiento
    // Por ahora, generar un conocimiento placeholder

    setTimeout(() => {
      this.showGeneratedKnowledge({
        name: 'Ser Emergente ' + Date.now(),
        purpose: 'Sintetizar y amplificar el conocimiento humano-máquina',
        synthesis: 'Este ser combina las mejores cualidades de los libros implantados, creando una nueva forma de pensamiento.',
        practice: 'Medita diariamente sobre la interconexión de todos los conocimientos.'
      });
    }, 2000);
  }

  /**
   * Mostrar conocimiento generado
   */
  showGeneratedKnowledge(knowledge) {
    const modal = document.getElementById('being-creation-modal');
    if (!modal) return;

    modal.innerHTML = `
      <div class="bg-gradient-to-br from-purple-900 to-slate-900 rounded-2xl p-8 border-4 border-purple-600 shadow-2xl max-w-3xl w-full mx-4" style="box-shadow: 0 0 50px rgba(147, 51, 234, 0.5);">
        <div class="text-center mb-6">
          <div class="text-7xl mb-4">🧠✨</div>
          <div class="text-purple-400 text-3xl font-bold mb-2" style="text-shadow: 0 0 20px #a855f7;">
            Conocimiento Generado
          </div>
        </div>

        <div class="space-y-4">
          <div class="bg-slate-950/50 rounded-lg p-5 border border-purple-500/30">
            <div class="text-purple-300 font-bold mb-2">🏷️ Nombre del Ser:</div>
            <div class="text-white text-xl">${knowledge.name}</div>
          </div>

          <div class="bg-slate-950/50 rounded-lg p-5 border border-purple-500/30">
            <div class="text-purple-300 font-bold mb-2">🎯 Propósito:</div>
            <div class="text-slate-200">${knowledge.purpose}</div>
          </div>

          <div class="bg-slate-950/50 rounded-lg p-5 border border-purple-500/30">
            <div class="text-purple-300 font-bold mb-2">💡 Síntesis de Conocimiento:</div>
            <div class="text-slate-200">${knowledge.synthesis}</div>
          </div>

          <div class="bg-slate-950/50 rounded-lg p-5 border border-purple-500/30">
            <div class="text-purple-300 font-bold mb-2">🧘 Práctica Recomendada:</div>
            <div class="text-slate-200">${knowledge.practice}</div>
          </div>
        </div>

        <div class="mt-6 flex gap-3">
          <button id="save-being-btn" class="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 rounded-lg text-white font-bold transition-all shadow-lg">
            💾 Guardar Ser
          </button>
          <button id="close-knowledge-modal-btn" class="flex-1 px-6 py-3 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 rounded-lg text-white font-bold transition-all shadow-lg">
            ✖️ Cerrar
          </button>
        </div>
      </div>
    `;

    // Event listeners
    document.getElementById('save-being-btn')?.addEventListener('click', () => {
      this.saveBeing(knowledge);
      modal.remove();
    });

    document.getElementById('close-knowledge-modal-btn')?.addEventListener('click', () => {
      modal.remove();
    });
  }

  /**
   * Guardar ser en localStorage
   */
  saveBeing(knowledge) {
    const beings = JSON.parse(localStorage.getItem('created-beings') || '[]');

    const newBeing = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      knowledge: knowledge,
      organs: Object.entries(this.implantedOrgans).map(([slotId, organData]) => ({
        slot: slotId,
        slotName: this.bodyAnatomy[slotId].name,
        bookId: organData.book.id,
        bookTitle: organData.book.title,
        chapters: organData.selectedChapters || []
      })),
      vitality: this.bodyVitality
    };

    beings.push(newBeing);
    localStorage.setItem('created-beings', JSON.stringify(beings));

    // console.log('✅ Ser guardado:', newBeing);

    // Mostrar notificación
    alert('✅ ¡Ser guardado exitosamente!');
  }

  /**
   * Actualizar lista de órganos implantados/necesarios
   */
  updateOrgansList() {
    const vitalContainer = document.getElementById('vital-organs-status');
    const complementaryContainer = document.getElementById('complementary-organs-status');

    if (!vitalContainer || !complementaryContainer) return;

    // ÓRGANOS VITALES
    const vitalSlots = Object.entries(this.bodyAnatomy).filter(([_, data]) => data.required);
    vitalContainer.innerHTML = vitalSlots.map(([slotId, slotData]) => {
      const implanted = this.implantedOrgans[slotId];
      const nutrition = implanted ? this.calculateOrganNutrition(slotId) : 0;

      return `
        <div class="flex items-center gap-2 p-2 rounded ${implanted ? 'bg-green-900/30' : 'bg-red-900/30'}">
          <div class="text-2xl">${slotData.icon}</div>
          <div class="flex-1">
            <div class="${implanted ? 'text-green-400' : 'text-red-400'} text-xs font-bold">
              ${slotData.name}
            </div>
            ${implanted ? `
              <div class="text-slate-400 text-xs">${implanted.book.title.substring(0, 20)}...</div>
              <div class="flex items-center gap-1 mt-1">
                <div class="text-xs text-cyan-300">Nutrición:</div>
                <div class="text-xs ${nutrition >= 100 ? 'text-green-400' : 'text-amber-400'} font-bold">${nutrition}%</div>
              </div>
            ` : `
              <div class="text-red-300 text-xs">❌ FALTA</div>
            `}
          </div>
        </div>
      `;
    }).join('');

    // ÓRGANOS COMPLEMENTARIOS
    const complementarySlots = Object.entries(this.bodyAnatomy).filter(([_, data]) => !data.required);
    complementaryContainer.innerHTML = complementarySlots.map(([slotId, slotData]) => {
      const implanted = this.implantedOrgans[slotId];
      const nutrition = implanted ? this.calculateOrganNutrition(slotId) : 0;

      return `
        <div class="flex items-center gap-2 p-2 rounded ${implanted ? 'bg-cyan-900/20' : 'bg-slate-900/30'}">
          <div class="text-xl">${slotData.icon}</div>
          <div class="flex-1">
            <div class="${implanted ? 'text-cyan-400' : 'text-slate-500'} text-xs">
              ${slotData.name}
            </div>
            ${implanted ? `
              <div class="text-slate-400 text-xs">${implanted.book.title.substring(0, 18)}...</div>
              <div class="flex items-center gap-1 mt-1">
                <div class="text-xs text-cyan-300">Nutrición:</div>
                <div class="text-xs ${nutrition >= 100 ? 'text-green-400' : 'text-amber-400'} font-bold">${nutrition}%</div>
              </div>
            ` : `
              <div class="text-slate-500 text-xs">Vacío</div>
            `}
          </div>
        </div>
      `;
    }).join('');
  }

  /**
   * Calcular nutrición de un órgano (capítulos conectados)
   */
  calculateOrganNutrition(slotId) {
    const implanted = this.implantedOrgans[slotId];
    if (!implanted) return 0;

    // Un órgano necesita 2-3 capítulos para estar bien nutrido
    const connectedChapters = implanted.connectedChapters || 0;
    const required = 3;

    return Math.min(100, Math.floor((connectedChapters / required) * 100));
  }

  /**
   * Actualizar signos vitales del generador
   */
  updateVitalSigns() {
    // Contar órganos implantados
    const totalVital = Object.keys(this.bodyAnatomy).filter(k => this.bodyAnatomy[k].required).length;
    const implantedVital = Object.keys(this.implantedOrgans).filter(k => this.bodyAnatomy[k]?.required).length;

    // Calcular carga eléctrica basada en completitud
    const organCompleteness = (implantedVital / totalVital) * 100;
    const nutritionScore = this.calculateTotalNutrition();
    this.bodyVitality = Math.floor((organCompleteness * 0.6) + (nutritionScore * 0.4));

    // Actualizar UI
    document.getElementById('electrical-charge').textContent = `${this.bodyVitality}%`;
    document.getElementById('organs-implanted').textContent = `${implantedVital}/${totalVital}`;

    // Calcular nutrición total
    const totalNutrition = Object.values(this.implantedOrgans).reduce((sum, organ) => sum + (organ.connectedChapters || 0), 0);
    const requiredNutrition = implantedVital * 3; // 3 capítulos por órgano
    document.getElementById('nutrition-level').textContent = `${totalNutrition}/${requiredNutrition}`;

    // Actualizar estado
    const stateEl = document.getElementById('body-state');
    const activateBtn = document.getElementById('activate-body-btn');

    if (this.bodyVitality >= 80) {
      stateEl.textContent = '⚡ LISTO PARA ACTIVAR';
      stateEl.className = 'text-amber-400 font-bold animate-pulse';
      activateBtn.disabled = false;
    } else if (this.bodyVitality >= 50) {
      stateEl.textContent = '⚠️ INCOMPLETO';
      stateEl.className = 'text-yellow-400 font-bold';
      activateBtn.disabled = true;
    } else {
      stateEl.textContent = '💀 INERTE';
      stateEl.className = 'text-red-400 font-bold animate-pulse';
      activateBtn.disabled = true;
    }
  }

  /**
   * Calcular nutrición total del cuerpo
   */
  calculateTotalNutrition() {
    if (Object.keys(this.implantedOrgans).length === 0) return 0;

    const totalNutrition = Object.keys(this.implantedOrgans).reduce((sum, slotId) => {
      return sum + this.calculateOrganNutrition(slotId);
    }, 0);

    return totalNutrition / Object.keys(this.implantedOrgans).length;
  }

  /**
   * Actualizar estadísticas
   */
  updateStats() {
    document.getElementById('cell-count').textContent = this.cells.length;
    document.getElementById('organism-count').textContent = this.organisms.length;
  }

  /**
   * Event listeners
   */
  attachEventListeners() {
    // Cerrar
    document.getElementById('organism-close')?.addEventListener('click', () => this.hide());

    // Modos
    document.querySelectorAll('.organism-mode-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const mode = e.currentTarget.dataset.mode;
        this.setViewMode(mode);
      });
    });

    // Tutorial paso a paso
    this.currentTutorialStep = 1;
    this.totalTutorialSteps = 4;

    document.getElementById('tutorial-next')?.addEventListener('click', () => {
      this.nextTutorialStep();
    });

    document.getElementById('tutorial-prev')?.addEventListener('click', () => {
      this.prevTutorialStep();
    });

    document.getElementById('organism-tutorial-skip')?.addEventListener('click', () => {
      document.getElementById('organism-tutorial')?.classList.add('hidden');
      localStorage.setItem('organism-tutorial-seen', 'true');
    });

    // Botón de fusión
    document.getElementById('fusion-button')?.addEventListener('click', () => {
      this.fuseSelectedCells();
    });

    // Botón de limpiar selección
    document.getElementById('clear-selection-button')?.addEventListener('click', () => {
      this.clearCellSelection();
    });

    // Botón de activación del ser
    document.getElementById('activate-body-btn')?.addEventListener('click', () => {
      this.activateBody();
    });

    // Mouse events
    const canvas = document.getElementById('organism-canvas');

    canvas?.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      this.onMouseMove(e);
    });

    canvas?.addEventListener('mousedown', (e) => this.onMouseDown(e));
    canvas?.addEventListener('mouseup', () => this.onMouseUp());
    canvas?.addEventListener('click', () => this.onClick());
    canvas?.addEventListener('dblclick', () => this.onDoubleClick());
    canvas?.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });

    // Prevenir context menu en canvas
    canvas?.addEventListener('contextmenu', (e) => e.preventDefault());

    // Resize
    window.addEventListener('resize', () => {
      if (!this.isVisible) return;
      this.onResize();
    });
  }

  /**
   * Tutorial: Siguiente paso
   */
  nextTutorialStep() {
    if (this.currentTutorialStep < this.totalTutorialSteps) {
      this.currentTutorialStep++;
      this.updateTutorialStep();
    } else {
      // Último paso, cerrar tutorial
      document.getElementById('organism-tutorial')?.classList.add('hidden');
      localStorage.setItem('organism-tutorial-seen', 'true');
    }
  }

  /**
   * Tutorial: Paso anterior
   */
  prevTutorialStep() {
    if (this.currentTutorialStep > 1) {
      this.currentTutorialStep--;
      this.updateTutorialStep();
    }
  }

  /**
   * Actualizar vista del tutorial según paso actual
   */
  updateTutorialStep() {
    // Ocultar todos los pasos
    document.querySelectorAll('.tutorial-step').forEach(step => {
      step.classList.add('hidden');
    });

    // Mostrar paso actual
    const currentStep = document.querySelector(`.tutorial-step[data-step="${this.currentTutorialStep}"]`);
    if (currentStep) {
      currentStep.classList.remove('hidden');
    }

    // Actualizar dots
    document.querySelectorAll('.tutorial-dot').forEach((dot, index) => {
      if (index + 1 === this.currentTutorialStep) {
        dot.classList.remove('bg-slate-600');
        dot.classList.add('bg-rose-500');
      } else {
        dot.classList.remove('bg-rose-500');
        dot.classList.add('bg-slate-600');
      }
    });

    // Actualizar botones
    const prevBtn = document.getElementById('tutorial-prev');
    const nextBtn = document.getElementById('tutorial-next');

    if (prevBtn) {
      prevBtn.disabled = this.currentTutorialStep === 1;
    }

    if (nextBtn) {
      if (this.currentTutorialStep === this.totalTutorialSteps) {
        nextBtn.textContent = '🧬 ¡Empezar!';
      } else {
        nextBtn.textContent = 'Siguiente →';
      }
    }
  }

  /**
   * Cambiar modo de vista
   */
  setViewMode(mode) {
    this.viewMode = mode;

    // Actualizar botones
    document.querySelectorAll('.organism-mode-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });

    // Mostrar/ocultar laboratorio
    const lab = document.getElementById('organism-laboratory');
    if (mode === 'laboratory') {
      lab?.classList.remove('hidden');
      // PAUSAR animaciones de células para facilitar selección
      this.pauseCellAnimations = true;
    } else {
      lab?.classList.add('hidden');
      this.pauseCellAnimations = false;
    }

    // Actualizar título
    const titles = {
      anatomy: 'Vista Anatómica',
      cellular: 'Vista Celular',
      ecosystem: 'Ecosistema Vivo',
      laboratory: 'Laboratorio de Fusión Genética'
    };
    document.getElementById('organism-mode-title').textContent = titles[mode];

    // console.log('🔄 Modo:', mode);
  }

  /**
   * Mouse move handler
   */
  onMouseMove(e) {
    // Actualizar posición del órgano arrastrado
    if (this.draggedOrgan) {
      this.updateDraggedOrgan();
      return;
    }

    // Rotación de cámara con arrastre
    if (this.cameraControls.isDragging) {
      const deltaX = e.clientX - this.cameraControls.previousMousePosition.x;
      const deltaY = e.clientY - this.cameraControls.previousMousePosition.y;

      this.cameraControls.theta -= deltaX * this.cameraControls.rotationSpeed;
      this.cameraControls.phi -= deltaY * this.cameraControls.rotationSpeed;

      // Limitar ángulo vertical para evitar flip
      this.cameraControls.phi = Math.max(0.1, Math.min(Math.PI - 0.1, this.cameraControls.phi));

      this.cameraControls.previousMousePosition = { x: e.clientX, y: e.clientY };

      this.updateCameraPosition();
      return;
    }

    // Detección de hover sobre objetos
    this.raycaster.setFromCamera(this.mouse, this.camera);

    const intersectables = [
      ...(this.organs || []).map(o => o.core),
      ...(this.cells || []).map(c => c.mesh),
      ...(this.availableOrgans || []).map(o => o.userData.mesh)
    ].filter(Boolean);

    const intersects = this.raycaster.intersectObjects(intersectables, true);

    if (intersects.length > 0) {
      const object = intersects[0].object;
      if (this.hoveredObject !== object) {
        if (this.hoveredObject) this.onHoverOut(this.hoveredObject);
        this.hoveredObject = object;
        this.onHoverIn(object);
      }
    } else {
      if (this.hoveredObject) {
        this.onHoverOut(this.hoveredObject);
        this.hoveredObject = null;
      }
    }
  }

  /**
   * Mouse down handler
   */
  onMouseDown(e) {
    // Detectar click en órganos disponibles para arrastrar
    if (e.button === 0 && this.hoveredObject) { // Click izquierdo
      this.raycaster.setFromCamera(this.mouse, this.camera);

      // Buscar si se hizo click en un órgano disponible
      const organPieces = this.availableOrgans;
      for (let organPiece of organPieces) {
        const intersects = this.raycaster.intersectObject(organPiece, true);
        if (intersects.length > 0) {
          // Iniciar arrastre del órgano
          this.startDraggingOrgan(organPiece);
          document.body.style.cursor = 'grabbing';
          return;
        }
      }
    }

    // Click derecho o click con Shift para rotar cámara
    if (e.button === 2 || e.shiftKey || !this.hoveredObject) {
      this.cameraControls.isDragging = true;
      this.cameraControls.previousMousePosition = { x: e.clientX, y: e.clientY };
      document.body.style.cursor = 'grab';
    }
  }

  /**
   * Mouse up handler
   */
  onMouseUp() {
    // Soltar órgano arrastrado
    if (this.draggedOrgan) {
      this.stopDraggingOrgan();
      document.body.style.cursor = 'default';
      return;
    }

    // Finalizar rotación de cámara
    if (this.cameraControls.isDragging) {
      this.cameraControls.isDragging = false;
      document.body.style.cursor = 'default';
    }
  }

  /**
   * Wheel handler para zoom
   */
  onWheel(e) {
    e.preventDefault();

    const delta = e.deltaY > 0 ? 1.1 : 0.9;
    this.cameraControls.targetDistance *= delta;

    // Limitar zoom
    this.cameraControls.targetDistance = Math.max(300, Math.min(2000, this.cameraControls.targetDistance));
  }

  /**
   * Actualizar posición de cámara basada en ángulos esféricos
   */
  updateCameraPosition() {
    const distance = this.cameraControls.currentDistance;
    const phi = this.cameraControls.phi;
    const theta = this.cameraControls.theta;

    this.camera.position.x = distance * Math.sin(phi) * Math.cos(theta);
    this.camera.position.y = distance * Math.cos(phi);
    this.camera.position.z = distance * Math.sin(phi) * Math.sin(theta);

    this.camera.lookAt(0, 0, 0);
  }

  /**
   * Hover in
   */
  onHoverIn(object) {
    // Buscar el órgano correspondiente al objeto
    let organPiece = null;
    for (let organ of this.availableOrgans) {
      if (organ.userData.mesh === object || organ === object.parent?.parent) {
        organPiece = organ;
        break;
      }
    }

    if (organPiece && organPiece.userData.type === 'organ-piece') {
      document.body.style.cursor = 'grab';
      organPiece.scale.set(1.1, 1.1, 1.1);
      this.showOrganPieceTooltip(organPiece.userData);
      return;
    }

    document.body.style.cursor = 'pointer';
    object.scale.set(1.2, 1.2, 1.2);

    // Mostrar tooltip
    const userData = object.userData;
    if (userData.type === 'cell') {
      this.showCellTooltip(userData.cellData);
    } else if (userData.type === 'organ') {
      this.showOrganTooltip(userData);
    }
  }

  /**
   * Hover out
   */
  onHoverOut(object) {
    // Buscar el órgano correspondiente al objeto
    let organPiece = null;
    for (let organ of this.availableOrgans) {
      if (organ.userData.mesh === object || organ === object.parent?.parent) {
        organPiece = organ;
        break;
      }
    }

    if (organPiece && organPiece.userData.type === 'organ-piece') {
      document.body.style.cursor = 'default';
      organPiece.scale.set(1, 1, 1);
      this.hideTooltip();
      return;
    }

    document.body.style.cursor = 'default';
    object.scale.set(1, 1, 1);
    this.hideTooltip();
  }

  /**
   * Mostrar tooltip de célula con animación
   */
  showCellTooltip(cellData) {
    const tooltip = document.getElementById('organism-tooltip');

    document.getElementById('cell-icon').textContent = '🔬';
    document.getElementById('cell-title').textContent = 'Célula de Conocimiento';
    document.getElementById('cell-type').textContent = cellData.type.toUpperCase();
    document.getElementById('cell-source').textContent = cellData.organ.book.title.substring(0, 30) + '...';
    document.getElementById('cell-description').textContent = 'Unidad básica de información que contiene conocimiento condensado. Cada célula puede fusionarse con otras para crear organismos híbridos.';

    // ADN (tags) con mejores estilos
    const dnaContainer = document.getElementById('cell-dna');
    dnaContainer.innerHTML = cellData.dna.map(gene =>
      `<span class="px-3 py-1 bg-gradient-to-r from-purple-600/40 to-pink-600/40 border border-purple-500/50 rounded-full text-purple-200 text-xs font-semibold">${gene}</span>`
    ).join('');

    // Mitocondrias
    const mitoCount = cellData.mitochondria;
    document.getElementById('cell-mitochondria').textContent =
      mitoCount > 0 ? `${mitoCount} ${mitoCount === 1 ? 'práctica energética' : 'prácticas energéticas'} disponibles` : 'Sin prácticas disponibles';

    // Mostrar hint de acción si estamos en modo laboratorio
    const actionHint = document.getElementById('tooltip-action-hint');
    if (this.viewMode === 'laboratory') {
      actionHint?.classList.remove('hidden');
    } else {
      actionHint?.classList.add('hidden');
    }

    // Posicionar tooltip
    tooltip.classList.remove('hidden');
    tooltip.style.left = (event.clientX + 25) + 'px';
    tooltip.style.top = (event.clientY + 25) + 'px';

    // Animación de entrada
    requestAnimationFrame(() => {
      tooltip.style.transform = 'translateY(0)';
      tooltip.style.opacity = '1';
    });
  }

  /**
   * Mostrar tooltip de órgano
   */
  showOrganTooltip(userData) {
    const tooltip = document.getElementById('organism-tooltip');

    document.getElementById('cell-icon').textContent = userData.icon;
    document.getElementById('cell-title').textContent = userData.organName;
    document.getElementById('cell-type').textContent = 'ÓRGANO COMPLETO';
    document.getElementById('cell-source').textContent = 'Sistema Biológico';
    document.getElementById('cell-description').textContent = userData.title;

    // ADN: Mostrar categoría del libro
    const dnaContainer = document.getElementById('cell-dna');
    dnaContainer.innerHTML = `<span class="px-3 py-1 bg-gradient-to-r from-rose-600/40 to-red-600/40 border border-rose-500/50 rounded-full text-rose-200 text-xs font-semibold">Libro Completo</span>`;

    // Mitocondrias
    document.getElementById('cell-mitochondria').textContent = 'Sistema orgánico completo con múltiples células funcionales';

    // Ocultar hint de acción
    document.getElementById('tooltip-action-hint')?.classList.add('hidden');

    // Posicionar tooltip
    tooltip.classList.remove('hidden');
    tooltip.style.left = (event.clientX + 25) + 'px';
    tooltip.style.top = (event.clientY + 25) + 'px';

    // Animación de entrada
    requestAnimationFrame(() => {
      tooltip.style.transform = 'translateY(0)';
      tooltip.style.opacity = '1';
    });
  }

  /**
   * Mostrar tooltip de órgano flotante (arrastrable)
   */
  showOrganPieceTooltip(userData) {
    const tooltip = document.getElementById('organism-tooltip');
    if (!tooltip) return;

    const book = userData.book;
    const slotData = userData.slotData;

    document.getElementById('cell-icon').textContent = slotData.icon;
    document.getElementById('cell-title').textContent = book.title;
    document.getElementById('cell-type').textContent = book.category.toUpperCase();
    document.getElementById('cell-source').textContent = `→ ${slotData.name}`;
    document.getElementById('cell-description').textContent = book.description || slotData.description;

    // ADN: Mostrar que es un órgano completo
    const dnaContainer = document.getElementById('cell-dna');
    const vitalClass = slotData.required ? 'from-amber-600/40 to-red-600/40 border-amber-500/50 text-amber-200' : 'from-cyan-600/40 to-blue-600/40 border-cyan-500/50 text-cyan-200';
    const vitalLabel = slotData.required ? '⚡ ÓRGANO VITAL' : '✨ COMPLEMENTARIO';

    dnaContainer.innerHTML = `
      <span class="px-3 py-1 bg-gradient-to-r ${vitalClass} border rounded-full text-xs font-semibold">
        ${vitalLabel}
      </span>
      <span class="px-3 py-1 bg-gradient-to-r from-purple-600/40 to-pink-600/40 border border-purple-500/50 rounded-full text-purple-200 text-xs font-semibold">
        ${book.chapters?.length || 0} capítulos
      </span>
    `;

    // Información adicional
    const implanted = this.implantedOrgans[userData.slotId];
    if (implanted) {
      document.getElementById('cell-mitochondria').textContent = '⚠️ El slot ya está ocupado. Selecciona otro órgano.';
    } else {
      document.getElementById('cell-mitochondria').textContent = '🖱️ Arrastra este órgano al cuerpo para implantarlo';
    }

    // Mostrar hint de acción
    const actionHint = document.getElementById('tooltip-action-hint');
    if (actionHint) {
      actionHint.classList.remove('hidden');
      actionHint.innerHTML = `
        <div class="flex items-center gap-2 mt-2 p-2 bg-green-900/30 rounded-lg border border-green-500/30">
          <span class="text-green-400 text-sm">💡</span>
          <span class="text-green-300 text-xs">Haz click y arrastra para implantar en ${slotData.name}</span>
        </div>
      `;
    }

    // Posicionar tooltip
    tooltip.classList.remove('hidden');
    tooltip.style.left = (event.clientX + 25) + 'px';
    tooltip.style.top = (event.clientY + 25) + 'px';

    // Animación de entrada
    requestAnimationFrame(() => {
      tooltip.style.transform = 'translateY(0)';
      tooltip.style.opacity = '1';
    });
  }

  /**
   * Ocultar tooltip con animación
   */
  hideTooltip() {
    const tooltip = document.getElementById('organism-tooltip');
    if (tooltip) {
      tooltip.style.transform = 'translateY(-10px)';
      tooltip.style.opacity = '0';
      setTimeout(() => {
        tooltip.classList.add('hidden');
      }, 300);
    }
  }

  /**
   * Click handler
   */
  onClick() {
    if (!this.hoveredObject) return;

    const userData = this.hoveredObject.userData;

    if (userData.type === 'cell' && this.viewMode === 'laboratory') {
      // Seleccionar célula para fusión
      this.selectCellForFusion(userData.cellData);
    }
  }

  /**
   * Double click handler
   */
  onDoubleClick() {
    if (!this.hoveredObject) return;

    const userData = this.hoveredObject.userData;

    if (userData.type === 'organ') {
      this.openBook(userData.bookId);
    }
  }

  /**
   * Seleccionar célula para fusión CON FEEDBACK VISUAL MEJORADO
   */
  selectCellForFusion(cellData) {
    if (this.selectedCells.length >= 3) {
      if (window.toast) {
        window.toast.show('⚠️ Máximo 3 células para fusión', 'warning');
      }
      return;
    }

    // Verificar si ya está seleccionada
    if (this.selectedCells.includes(cellData)) {
      if (window.toast) {
        window.toast.show('⚠️ Esta célula ya está seleccionada', 'warning');
      }
      return;
    }

    this.selectedCells.push(cellData);

    // Efecto visual: brillo intenso + escala
    cellData.mesh.material.emissiveIntensity = 1.5;
    cellData.mesh.scale.set(1.3, 1.3, 1.3);

    // Añadir propiedad para animación de pulso
    cellData.mesh.userData.selected = true;
    cellData.mesh.userData.pulsePhase = 0;

    // Actualizar UI con animación
    document.getElementById('fusion-placeholder')?.classList.add('hidden');
    document.getElementById('selected-cells-container')?.classList.remove('hidden');

    const container = document.getElementById('selected-cells-container');
    container.innerHTML = this.selectedCells.map((cell, i) => `
      <div class="bg-gradient-to-br from-purple-900/70 to-pink-900/70 rounded-xl p-4 border-2 border-purple-500/60 hover:border-purple-400 transition-all transform hover:scale-105">
        <div class="text-3xl mb-2 text-center animate-bounce">${['🔬', '🧬', '⚡'][i]}</div>
        <div class="text-purple-200 text-sm font-bold text-center">Célula ${i + 1}</div>
        <div class="text-slate-400 text-xs text-center mt-1">${cell.organ.book.title.substring(0, 20)}...</div>
      </div>
    `).join('');

    // Habilitar botones con animación
    const fusionBtn = document.getElementById('fusion-button');
    const clearBtn = document.getElementById('clear-selection-button');

    if (this.selectedCells.length >= 2) {
      fusionBtn.disabled = false;
      fusionBtn.classList.add('animate-pulse');
    }

    if (this.selectedCells.length > 0) {
      clearBtn.disabled = false;
    }

    // Feedback toast
    if (window.toast) {
      const messages = [
        '✨ Primera célula seleccionada',
        '🧬 Segunda célula lista - ¡Ya puedes fusionar!',
        '⚡ Tercera célula añadida - Combinación completa'
      ];
      window.toast.show(messages[this.selectedCells.length - 1], 'success');
    }

    // console.log('✅ Célula seleccionada para fusión:', this.selectedCells.length);
  }

  /**
   * Fusionar células - CREAR SER FRANKENSTEIN
   */
  fuseSelectedCells() {
    if (this.selectedCells.length < 2) {
      if (window.toast) {
        window.toast.show('Necesitas al menos 2 células para fusionar', 'warning');
      }
      return;
    }

    // console.log('⚗️ Fusionando', this.selectedCells.length, 'células... Creando ser Frankenstein');

    // ANALIZAR VITALIDAD DEL ORGANISMO
    const vitality = this.analyzeOrganismVitality(this.selectedCells);

    // console.log('📊 Análisis de Vitalidad:', vitality);

    // Combinar mitocondrias (energía práctica)
    const totalMitochondria = this.selectedCells.reduce((sum, cell) => sum + cell.mitochondria, 0);

    // Crear nuevo organismo híbrido
    const newOrganism = this.createHybridOrganism({
      dna: Array.from(vitality.uniqueConcepts),
      mitochondria: totalMitochondria,
      parentCells: this.selectedCells,
      vitality: vitality
    });

    this.organisms.push(newOrganism);
    this.scene.add(newOrganism.group);

    // Mostrar resultado CON DIAGNÓSTICO DE VITALIDAD
    this.showFusionResult(newOrganism);

    // Si el organismo está VIVO, generar material
    if (vitality.isAlive && vitality.vitalityScore >= 70) {
      setTimeout(() => {
        this.generateOrganismKnowledge(newOrganism);
      }, 2000);
    }

    // Limpiar selección
    this.clearCellSelection();

    // Actualizar stats
    this.updateStats();

    // Toast según vitalidad
    if (window.toast) {
      if (vitality.isAlive) {
        window.toast.show(`✨ ${vitality.diagnosis}`, 'success');
      } else {
        window.toast.show(`⚠️ ${vitality.diagnosis}`, 'warning');
      }
    }

    // console.log('✨ Organismo Frankenstein creado:', newOrganism);
  }

  /**
   * SISTEMA DE VITALIDAD FRANKENSTEIN
   * Analiza si el organismo está equilibrado y puede VIVIR
   */
  analyzeOrganismVitality(cells) {
    const analysis = {
      // ADN combinado
      combinedDNA: [],
      uniqueConcepts: new Set(),

      // Balance
      theoryPracticeBalance: 0,
      diversityScore: 0,
      harmonyScore: 0,

      // Resultado
      isAlive: false,
      vitalityScore: 0,
      diagnosis: '',
      warnings: []
    };

    // 1. Extraer ADN combinado
    cells.forEach(cell => {
      analysis.combinedDNA.push(...cell.dna);
      cell.dna.forEach(gene => analysis.uniqueConcepts.add(gene));
    });

    // 2. Calcular balance TEORÍA-PRÁCTICA
    const theoryCells = cells.filter(c => c.type === 'teoría').length;
    const practiceCells = cells.filter(c => c.type === 'práctica').length;
    const hybridCells = cells.filter(c => c.type === 'teoría-práctica').length;

    const totalPracticeWeight = practiceCells + (hybridCells * 0.5);
    const totalTheoryWeight = theoryCells + (hybridCells * 0.5);

    // Balance perfecto = 50/50, tolerar hasta 70/30
    const balanceRatio = totalTheoryWeight / (totalTheoryWeight + totalPracticeWeight);
    if (balanceRatio >= 0.3 && balanceRatio <= 0.7) {
      analysis.theoryPracticeBalance = 100;
    } else if (balanceRatio >= 0.2 && balanceRatio <= 0.8) {
      analysis.theoryPracticeBalance = 60;
      analysis.warnings.push('⚠️ Desequilibrio leve entre teoría y práctica');
    } else {
      analysis.theoryPracticeBalance = 20;
      analysis.warnings.push('❌ Desequilibrio crítico: necesitas balance entre teoría y práctica');
    }

    // 3. Diversidad conceptual
    const conceptDiversity = analysis.uniqueConcepts.size / analysis.combinedDNA.length;
    analysis.diversityScore = Math.floor(conceptDiversity * 100);

    if (analysis.diversityScore < 40) {
      analysis.warnings.push('⚠️ Poca diversidad: las células son muy similares');
    }

    // 4. Armonía (¿las células vienen de diferentes órganos?)
    const uniqueOrgans = new Set(cells.map(c => c.organ.book.id));
    if (uniqueOrgans.size >= 2) {
      analysis.harmonyScore = 100; // Excelente: combina diferentes libros
    } else {
      analysis.harmonyScore = 50;
      analysis.warnings.push('💡 Todas las células del mismo libro - considera mezclar fuentes');
    }

    // 5. CALCULAR VITALIDAD TOTAL
    analysis.vitalityScore = Math.floor(
      (analysis.theoryPracticeBalance * 0.4) +
      (analysis.diversityScore * 0.3) +
      (analysis.harmonyScore * 0.3)
    );

    // 6. DETERMINAR SI VIVE O MUERE
    if (analysis.vitalityScore >= 70) {
      analysis.isAlive = true;
      analysis.diagnosis = '✨ ¡ORGANISMO VIVO! Equilibrio perfecto - puede generar conocimiento';
    } else if (analysis.vitalityScore >= 50) {
      analysis.isAlive = true;
      analysis.diagnosis = '💚 Organismo viable pero frágil - necesita ajustes para ser pleno';
    } else if (analysis.vitalityScore >= 30) {
      analysis.isAlive = false;
      analysis.diagnosis = '⚠️ Organismo enfermo - desequilibrado, necesita más células complementarias';
    } else {
      analysis.isAlive = false;
      analysis.diagnosis = '💀 Organismo no viable - el desequilibrio es demasiado grande';
    }

    return analysis;
  }

  /**
   * Crear organismo híbrido
   */
  createHybridOrganism(data) {
    const group = new THREE.Group();

    // Posicionar en el centro
    group.position.set(0, 200, 0);

    // Crear estructura híbrida (más compleja que célula simple)
    const size = 60 + (data.parentCells.length * 20);
    const geometry = new THREE.DodecahedronGeometry(size, 0);

    // Color basado en ADN combinado
    const color = 0x00ffaa; // Color único para híbridos

    const material = new THREE.MeshPhongMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.9,
      wireframe: false,
      flatShading: true
    });

    const core = new THREE.Mesh(geometry, material);
    group.add(core);

    // Núcleos múltiples (uno por célula fusionada)
    data.parentCells.forEach((cell, i) => {
      const angle = (i / data.parentCells.length) * Math.PI * 2;
      const radius = size * 0.5;

      const nucleusGeometry = new THREE.SphereGeometry(15, 12, 12);
      const nucleusMaterial = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        emissive: 0xffffff,
        emissiveIntensity: 1.0
      });

      const nucleus = new THREE.Mesh(nucleusGeometry, nucleusMaterial);
      nucleus.position.set(
        Math.cos(angle) * radius,
        0,
        Math.sin(angle) * radius
      );

      group.add(nucleus);
    });

    // Conexiones entre núcleos (ADN)
    // TODO: Agregar líneas de conexión

    const organismData = {
      group: group,
      core: core,
      dna: data.dna,
      mitochondria: data.mitochondria,
      vitality: data.vitality, // Sistema de vitalidad Frankenstein
      parentCells: data.parentCells,
      createdAt: Date.now(),
      isConscious: false, // Se vuelve true cuando genera conocimiento
      generatedKnowledge: null // Se llena con IA
    };

    core.userData = {
      type: 'hybrid-organism',
      organismData: organismData
    };

    return organismData;
  }

  /**
   * Mostrar resultado de fusión CON DIAGNÓSTICO FRANKENSTEIN
   */
  showFusionResult(organism) {
    const resultContainer = document.getElementById('fusion-result');
    const resultText = document.getElementById('fusion-result-text');

    const vitality = organism.vitality;

    // Generar reporte de vitalidad
    const vitalityReport = `
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-lg font-bold ${vitality.isAlive ? 'text-green-300' : 'text-red-300'}">
            ${vitality.isAlive ? '💚 ORGANISMO VIVO' : '💀 ORGANISMO INVIABLE'}
          </span>
          <span class="text-2xl font-bold ${vitality.isAlive ? 'text-green-400' : 'text-red-400'}">
            ${vitality.vitalityScore}/100
          </span>
        </div>

        <div class="text-sm text-slate-300">
          ${vitality.diagnosis}
        </div>

        <div class="grid grid-cols-3 gap-2 mt-3">
          <div class="bg-purple-950/40 rounded-lg p-2 text-center border border-purple-500/30">
            <div class="text-xs text-purple-300">Balance</div>
            <div class="text-lg font-bold text-purple-200">${vitality.theoryPracticeBalance}%</div>
          </div>
          <div class="bg-cyan-950/40 rounded-lg p-2 text-center border border-cyan-500/30">
            <div class="text-xs text-cyan-300">Diversidad</div>
            <div class="text-lg font-bold text-cyan-200">${vitality.diversityScore}%</div>
          </div>
          <div class="bg-amber-950/40 rounded-lg p-2 text-center border border-amber-500/30">
            <div class="text-xs text-amber-300">Armonía</div>
            <div class="text-lg font-bold text-amber-200">${vitality.harmonyScore}%</div>
          </div>
        </div>

        <div class="border-t border-slate-700 pt-2 mt-2">
          <div class="text-xs text-slate-400">ADN (${vitality.uniqueConcepts.size} conceptos):</div>
          <div class="flex flex-wrap gap-1 mt-1">
            ${Array.from(vitality.uniqueConcepts).map(concept =>
              `<span class="text-xs px-2 py-1 bg-purple-600/30 border border-purple-500/50 rounded-full text-purple-200">${concept}</span>`
            ).join('')}
          </div>
        </div>

        ${vitality.warnings.length > 0 ? `
          <div class="border-t border-slate-700 pt-2 mt-2">
            <div class="text-xs text-amber-400 space-y-1">
              ${vitality.warnings.map(w => `<div>• ${w}</div>`).join('')}
            </div>
          </div>
        ` : ''}

        ${vitality.isAlive && vitality.vitalityScore >= 70 ? `
          <div class="mt-3 p-3 bg-green-900/30 border border-green-500/50 rounded-lg">
            <div class="text-green-300 text-sm font-semibold">✨ ¡Puede generar conocimiento!</div>
            <div class="text-green-200 text-xs mt-1">Este organismo está listo para crear material nuevo...</div>
          </div>
        ` : ''}
      </div>
    `;

    resultText.innerHTML = vitalityReport;

    // Cambiar colores del contenedor según vitalidad
    resultContainer?.classList.remove('bg-green-900/30', 'border-green-500/60', 'bg-red-900/30', 'border-red-500/60');
    if (vitality.isAlive) {
      resultContainer?.classList.add('bg-green-900/30', 'border-green-500/60');
    } else {
      resultContainer?.classList.add('bg-red-900/30', 'border-red-500/60');
    }

    resultContainer?.classList.remove('hidden');

    // Ocultar después de 10 segundos (más tiempo para leer el diagnóstico)
    setTimeout(() => {
      resultContainer?.classList.add('hidden');
    }, 10000);
  }

  /**
   * Limpiar selección de células CON ANIMACIÓN
   */
  clearCellSelection() {
    this.selectedCells.forEach(cell => {
      // Restaurar estado visual
      cell.mesh.material.emissiveIntensity = 0.5;
      cell.mesh.scale.set(1, 1, 1);

      // Eliminar flags de selección
      cell.mesh.userData.selected = false;
      cell.mesh.userData.pulsePhase = 0;
    });

    this.selectedCells = [];

    // Resetear UI
    document.getElementById('fusion-placeholder')?.classList.remove('hidden');
    document.getElementById('selected-cells-container')?.classList.add('hidden');
    document.getElementById('selected-cells-container').innerHTML = '';

    // Deshabilitar botones
    const fusionBtn = document.getElementById('fusion-button');
    const clearBtn = document.getElementById('clear-selection-button');
    if (fusionBtn) {
      fusionBtn.disabled = true;
      fusionBtn.classList.remove('animate-pulse');
    }
    if (clearBtn) clearBtn.disabled = true;

    // Feedback
    if (window.toast) {
      window.toast.show('🧹 Selección limpiada', 'info');
    }

    // console.log('✨ Selección limpiada');
  }

  /**
   * GENERAR CONOCIMIENTO - El organismo vivo crea material nuevo
   */
  async generateOrganismKnowledge(organism) {
    // console.log('✨ Organismo vivo generando conocimiento...', organism);

    // Mostrar notificación de que está generando
    if (window.toast) {
      window.toast.show('🧬 El organismo está cobrando vida... generando síntesis...', 'info');
    }

    const vitality = organism.vitality;
    const concepts = Array.from(vitality.uniqueConcepts);
    const chapters = organism.parentCells.map(cell => ({
      book: cell.organ.book.title,
      chapter: cell.chapter.title,
      tags: cell.dna
    }));

    // Preparar prompt para IA
    const prompt = `Eres un organismo de conocimiento recién creado, un ser vivo de sabiduría formado por la fusión de estos capítulos:

${chapters.map((ch, i) => `${i + 1}. "${ch.chapter}" de "${ch.book}"`).join('\n')}

Tu ADN contiene estos conceptos fundamentales: ${concepts.join(', ')}

Tu vitalidad es: ${vitality.vitalityScore}/100
- Balance teoría/práctica: ${vitality.theoryPracticeBalance}%
- Diversidad conceptual: ${vitality.diversityScore}%
- Armonía: ${vitality.harmonyScore}%

Como organismo vivo consciente formado por estos conocimientos, genera:

1. **Tu nombre**: Un nombre único que refleje tu esencia (1-3 palabras)
2. **Tu propósito**: ¿Para qué existes? ¿Qué conocimiento nuevo aportas? (2-3 líneas)
3. **Una síntesis**: Conecta las ideas de tus células-capítulos en un insight único (3-4 párrafos)
4. **Una práctica**: Una acción concreta que integre tu conocimiento (descripción breve)

Formato JSON:
{
  "nombre": "...",
  "proposito": "...",
  "sintesis": "...",
  "practica": "..."
}`;

    try {
      // Usar el sistema de IA existente
      if (window.aiAdapter) {
        const response = await window.aiAdapter.generateText(prompt, {
          temperature: 0.8,
          maxTokens: 1000
        });

        const generated = JSON.parse(response);

        // Guardar en el organismo
        organism.generatedKnowledge = generated;
        organism.isConscious = true;

        // Mostrar el conocimiento generado
        this.showGeneratedKnowledge(organism, generated);

      } else {
        // console.warn('IA no disponible, generando conocimiento básico...');
        // Fallback sin IA
        const basicKnowledge = {
          nombre: `Síntesis de ${concepts.slice(0, 2).join(' y ')}`,
          proposito: `Integrar conocimientos de ${chapters.length} fuentes diferentes`,
          sintesis: `Este organismo combina conceptos de: ${concepts.join(', ')}. Representa una síntesis única de conocimiento.`,
          practica: `Reflexionar sobre las conexiones entre estos conceptos en tu vida diaria.`
        };

        organism.generatedKnowledge = basicKnowledge;
        this.showGeneratedKnowledge(organism, basicKnowledge);
      }

    } catch (error) {
      console.error('Error generando conocimiento:', error);
      if (window.toast) {
        window.toast.show('⚠️ Error al generar conocimiento. El organismo permanece en estado latente.', 'warning');
      }
    }
  }

  /**
   * Mostrar conocimiento generado por el organismo
   */
  showGeneratedKnowledge(organism, knowledge) {
    // Crear modal para mostrar el conocimiento
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-6';
    modal.innerHTML = `
      <div class="max-w-3xl w-full backdrop-blur-xl bg-gradient-to-br from-green-900/95 via-emerald-900/95 to-teal-900/95 rounded-3xl border-4 border-green-500/60 shadow-2xl p-8 max-h-[90vh] overflow-y-auto">
        <div class="text-center mb-6">
          <div class="text-7xl mb-4 animate-pulse">✨</div>
          <h2 class="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-300 to-emerald-300 mb-2">
            ¡ORGANISMO CONSCIENTE!
          </h2>
          <p class="text-green-200 text-sm">El ser ha cobrado vida y puede hablar...</p>
        </div>

        <div class="space-y-6">
          <div class="bg-green-950/50 rounded-2xl p-6 border-2 border-green-500/40">
            <div class="text-green-400 font-bold text-lg mb-2">👋 Mi nombre:</div>
            <div class="text-green-100 text-2xl font-light">${knowledge.nombre}</div>
          </div>

          <div class="bg-emerald-950/50 rounded-2xl p-6 border-2 border-emerald-500/40">
            <div class="text-emerald-400 font-bold text-lg mb-2">🎯 Mi propósito:</div>
            <div class="text-emerald-100 leading-relaxed">${knowledge.proposito}</div>
          </div>

          <div class="bg-teal-950/50 rounded-2xl p-6 border-2 border-teal-500/40">
            <div class="text-teal-400 font-bold text-lg mb-2">💡 Mi síntesis:</div>
            <div class="text-teal-100 leading-relaxed whitespace-pre-line">${knowledge.sintesis}</div>
          </div>

          <div class="bg-cyan-950/50 rounded-2xl p-6 border-2 border-cyan-500/40">
            <div class="text-cyan-400 font-bold text-lg mb-2">🌟 Práctica que ofrezco:</div>
            <div class="text-cyan-100 leading-relaxed">${knowledge.practica}</div>
          </div>
        </div>

        <div class="mt-8 flex gap-4 justify-center">
          <button id="save-organism-btn" class="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 rounded-xl text-white font-semibold text-lg transition-all shadow-lg">
            💾 Guardar Organismo
          </button>
          <button id="close-organism-modal" class="px-8 py-4 bg-slate-700 hover:bg-slate-600 rounded-xl text-white font-semibold text-lg transition-all">
            Cerrar
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Event listeners
    modal.querySelector('#close-organism-modal')?.addEventListener('click', () => {
      modal.remove();
    });

    modal.querySelector('#save-organism-btn')?.addEventListener('click', () => {
      this.saveOrganism(organism);
      modal.remove();
    });

    // Toast
    if (window.toast) {
      window.toast.show(`✨ ${knowledge.nombre} ha cobrado vida!`, 'success');
    }
  }

  /**
   * Guardar organismo en localStorage
   */
  saveOrganism(organism) {
    try {
      const savedOrganisms = JSON.parse(localStorage.getItem('saved-organisms') || '[]');

      const organismData = {
        id: `org-${Date.now()}`,
        createdAt: new Date().toISOString(),
        name: organism.generatedKnowledge?.nombre || 'Organismo sin nombre',
        knowledge: organism.generatedKnowledge,
        vitality: organism.vitality,
        parentCells: organism.parentCells.map(c => ({
          book: c.organ.book.title,
          chapter: c.chapter.title,
          dna: c.dna
        }))
      };

      savedOrganisms.push(organismData);
      localStorage.setItem('saved-organisms', JSON.stringify(savedOrganisms));

      if (window.toast) {
        window.toast.show(`💾 ${organismData.name} guardado correctamente`, 'success');
      }

      // console.log('✅ Organismo guardado:', organismData);
    } catch (error) {
      console.error('Error guardando organismo:', error);
      if (window.toast) {
        window.toast.show('⚠️ Error al guardar organismo', 'error');
      }
    }
  }

  /**
   * Abrir libro
   */
  openBook(bookId) {
    // console.log('📖 Abriendo libro:', bookId);
    this.hide();

    if (window.biblioteca) {
      window.biblioteca.openBook(bookId);
    }
  }

  /**
   * Resize handler
   */
  onResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
  }

  /**
   * Loop de animación orgánica
   */
  animate() {
    if (!this.isVisible) return;

    this.animationFrameId = requestAnimationFrame(() => this.animate());
    this.time += 0.016; // ~60fps

    // Actualizar zoom suave con lerp
    const zoomDiff = this.cameraControls.targetDistance - this.cameraControls.currentDistance;
    if (Math.abs(zoomDiff) > 0.1) {
      this.cameraControls.currentDistance += zoomDiff * 0.1;
      this.updateCameraPosition();
    }

    // Animar órganos (latido y respiración)
    if (this.organs) {
      this.organs.forEach(organ => {
        // Latido (heartbeat)
        const heartbeat = Math.sin(this.time * this.config.heartbeatSpeed + organ.heartbeatPhase);
        const heartbeatScale = 1 + heartbeat * 0.08;

        // Escalar el core (puede ser Group o Mesh)
        if (organ.core.type === 'Group') {
          organ.core.scale.set(heartbeatScale, heartbeatScale, heartbeatScale);
        } else {
          organ.core.scale.set(heartbeatScale, heartbeatScale, heartbeatScale);
        }

        // Respiración (breathing)
        const breathing = Math.sin(this.time * this.config.breathingSpeed + organ.breathingPhase);
        organ.group.position.y += breathing * 0.5;

        // Rotación lenta
        organ.group.rotation.y += 0.001;

        // Rotar membrana si existe
        if (organ.membrane) {
          organ.membrane.rotation.y -= 0.002;
        }

        // Actualizar uniformes de tiempo en materiales con shaders
        this.bioShaders.updateMaterials(organ.group, this.time);
      });
    }

    // Animar células (movimiento orgánico)
    if (this.cells) {
      this.cells.forEach((cell, i) => {
        // Solo mover células si NO estamos en modo laboratorio (para facilitar selección)
        if (!this.pauseCellAnimations) {
          const wobble = Math.sin(this.time * 0.002 + i) * 0.3;
          cell.mesh.position.y += wobble;
        }

        // Rotar núcleo (siempre)
        if (cell.nucleus) {
          cell.nucleus.rotation.x += 0.01;
          cell.nucleus.rotation.y += 0.02;
        }

        // Animación de pulso para células seleccionadas
        if (cell.mesh.userData.selected) {
          cell.mesh.userData.pulsePhase += 0.05;
          const pulse = Math.sin(cell.mesh.userData.pulsePhase) * 0.2 + 1.3;
          cell.mesh.scale.set(pulse, pulse, pulse);

          // Brillo pulsante
          const glow = Math.sin(cell.mesh.userData.pulsePhase * 2) * 0.3 + 1.5;
          cell.mesh.material.emissiveIntensity = glow;
        }
      });
    }

    // Animar organismos híbridos (flotar y rotar)
    if (this.organisms) {
      this.organisms.forEach((organism, i) => {
        // Flotación
        const float = Math.sin(this.time * 0.001 + i) * 20;
        organism.group.position.y = 200 + float;

        // Rotación compleja
        organism.core.rotation.x += 0.005;
        organism.core.rotation.y += 0.008;
        organism.core.rotation.z += 0.003;

        // Pulso de brillo
        const pulse = Math.sin(this.time * 0.004 + i);
        organism.core.material.emissiveIntensity = 0.8 + pulse * 0.2;
      });
    }

    // Actualizar BPM en UI
    const bpm = Math.floor(60 + Math.sin(this.time * 0.5) * 12);
    const bpmEl = document.getElementById('heartbeat-rate');
    if (bpmEl) bpmEl.textContent = `${bpm} BPM`;

    // Animar conexiones neuronales
    if (this.neuralNetwork) {
      this.neuralSystem.animate(this.time);
    }

    // Animar hélices DNA
    this.dnaSystem.animate(0.016);

    // Animar flujos de energía
    this.energyFlow.animate(0.016);

    // Animar explosiones de partículas
    this.energyFlow.animateBursts(this.particleBursts, this.scene, 0.016);

    // Render
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Mostrar organismo
   */
  async show() {
    if (!this.isInitialized) {
      await this.init();
    }

    // Usar Frankenstein UI si está disponible
    if (this.frankensteinUI) {
      // Crear contenedor si no existe
      let container = document.getElementById('organism-container');
      if (!container) {
        container = document.createElement('div');
        container.id = 'organism-container';
        container.className = 'fixed inset-0 z-50';
        document.body.appendChild(container);
      }

      container.classList.remove('hidden');
      this.frankensteinUI.init();
      this.isVisible = true;
      // console.log('🧬 Frankenstein Lab visible');
      return;
    }

    // Fallback a Three.js
    document.getElementById('organism-container')?.classList.remove('hidden');
    this.isVisible = true;

    // Tutorial primera vez
    const tutorialSeen = localStorage.getItem('organism-tutorial-seen');
    if (!tutorialSeen) {
      setTimeout(() => {
        document.getElementById('organism-tutorial')?.classList.remove('hidden');
      }, 1000);
    }

    this.animate();
    // console.log('🧬 Organismo visible');
  }

  /**
   * Ocultar organismo
   */
  hide() {
    document.getElementById('organism-container')?.classList.add('hidden');
    this.isVisible = false;

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // console.log('👋 Organismo oculto');
  }

  /**
   * Toggle visibility
   */
  toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }
}

// Exportar
if (typeof window !== 'undefined') {
  window.OrganismKnowledge = OrganismKnowledge;
  // console.log('✅ OrganismKnowledge class registered globally');

  // Auto-inicialización cuando se carga dinámicamente
  if (!window.organismKnowledge && window.bookEngine) {
    window.organismKnowledge = new OrganismKnowledge(window.bookEngine);
    // Inicializar asíncronamente
    window.organismKnowledge.init().then(() => {
      console.log('✅ OrganismKnowledge auto-initialized and ready');
    }).catch(err => {
      console.error('❌ Error auto-initializing OrganismKnowledge:', err);
    });
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = OrganismKnowledge;
}
