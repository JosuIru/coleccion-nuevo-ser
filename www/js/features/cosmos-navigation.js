/**
// 🔧 FIX v2.9.198: Migrated console.log to logger
 * COSMOS DEL CONOCIMIENTO v2.0
 * Sistema de Navegación 3D Inmersivo Multi-Dimensional - VERSIÓN MEJORADA
 *
 * Mejoras v2:
 * - Controles de cámara suaves con inercia
 * - Labels de texto flotantes en 3D
 * - Transiciones animadas entre modos
 * - Efectos visuales mejorados (glow, bloom)
 * - Búsqueda integrada en tiempo real
 * - Tutorial interactivo
 * - Performance optimizado
 */

class CosmosNavigationV2 {
  constructor(bookEngine) {
    this.bookEngine = bookEngine;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.raycaster = null;
    this.mouse = null;

    // Objetos 3D
    this.galaxies = [];
    this.stars = [];
    this.constellations = [];
    this.particles = null;
    this.labels = []; // Labels de texto para galaxias

    // Estado
    this.currentMode = 'cosmos';
    this.selectedGalaxy = null;
    this.hoveredObject = null;
    this.needFilter = null;
    this.searchQuery = '';

    // Controles de cámara mejorados
    this.cameraTarget = new THREE.Vector3(0, 0, 0);
    this.cameraPosition = { x: 0, y: 500, z: 1500 };
    this.cameraVelocity = { x: 0, y: 0, z: 0 };
    this.isDragging = false;
    this.previousMousePosition = { x: 0, y: 0 };
    this.cameraRotation = { phi: 0, theta: 0 }; // Coordenadas esféricas
    this.cameraDistance = 1500;
    this.targetCameraDistance = 1500;

    // Configuración
    this.config = {
      universeRadius: 2000,
      galaxySize: { min: 50, max: 150 },
      starSize: { min: 2, max: 8 },
      particleCount: 5000, // Reducido para mejor performance
      animationSpeed: 0.001,
      cameraDamping: 0.15, // Suavizado de cámara
      zoomSpeed: 0.1,
      rotationSpeed: 0.005
    };

    // Mapeo de necesidades
    this.needMap = {
      'paz': ['meditación', 'respiración', 'calma', 'mindfulness', 'contemplación'],
      'actuar': ['acción', 'activismo', 'praxis', 'organizar', 'protesta'],
      'entender': ['teoría', 'filosofía', 'análisis', 'comprensión', 'reflexión'],
      'comunidad': ['colectivo', 'organización', 'asambleas', 'cooperativas', 'autogestión'],
      'proyecto': ['práctica', 'implementar', 'crear', 'construir', 'desarrollar'],
      'radical': ['transformación', 'revolución', 'cambio-sistémico', 'resistencia'],
      'ia': ['inteligencia-artificial', 'tecnología', 'diálogo-ia', 'posthumano'],
      'arte': ['creatividad', 'expresión', 'estética', 'belleza']
    };

    this.isInitialized = false;
    this.isVisible = false;
    this.animationFrameId = null;

    // ⭐ FIX v2.9.180: EventManager para prevenir memory leaks
    this.eventManager = new EventManager();

    // ⭐ FIX v2.9.185: Tracking de timers para cleanup (3 timers sin clear)
    this.timers = [];
  }

  /**
   * Inicializar Three.js y crear el universo
   */
  async init() {
    if (this.isInitialized) return;

    // logger.debug('🌌 Inicializando Cosmos del Conocimiento v2...');

    // Verificar Three.js
    if (typeof THREE === 'undefined') {
      logger.error('Three.js no está cargado');
      return;
    }

    // Crear contenedor
    this.createContainer();

    // Inicializar Three.js
    this.initThreeJS();

    // Crear universo
    await this.createUniverse();

    // Event listeners
    this.attachEventListeners();

    this.isInitialized = true;
    // logger.debug('✨ Cosmos del Conocimiento v2 inicializado');
  }

  /**
   * Crear contenedor DOM con UI mejorada
   */
  createContainer() {
    const container = document.createElement('div');
    container.id = 'cosmos-container';
    container.className = 'fixed inset-0 z-40 hidden';
    container.style.background = 'radial-gradient(ellipse at center, #0a0a1a 0%, #000000 100%)';

    container.innerHTML = `
      <canvas id="cosmos-canvas" class="w-full h-full"></canvas>

      <!-- Loading Screen mejorado -->
      <div id="cosmos-loading" class="absolute inset-0 bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-950 flex items-center justify-center">
        <div class="text-center">
          <div class="text-8xl mb-6 animate-pulse">🌌</div>
          <div class="text-cyan-400 text-3xl font-light mb-2">Generando el Cosmos...</div>
          <div class="text-slate-400 text-lg">Preparando tu viaje dimensional</div>
          <div class="mt-8 flex justify-center gap-2">
            <div class="w-3 h-3 bg-cyan-500 rounded-full animate-bounce" style="animation-delay: 0s"></div>
            <div class="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
            <div class="w-3 h-3 bg-pink-500 rounded-full animate-bounce" style="animation-delay: 0.4s"></div>
          </div>
        </div>
      </div>

      <!-- HUD Overlay mejorado -->
      <div id="cosmos-hud" class="absolute inset-0 pointer-events-none">
        <!-- Top Bar mejorada -->
        <div class="absolute top-0 left-0 right-0 p-4 sm:p-6 pointer-events-auto">
          <div class="max-w-7xl mx-auto flex flex-wrap justify-between items-start gap-4">
            <!-- Título y modo -->
            <div class="backdrop-blur-xl bg-gradient-to-r from-slate-900/90 to-slate-800/90 rounded-2xl px-6 py-3 border border-cyan-500/40 shadow-2xl shadow-cyan-500/20">
              <div class="flex items-center gap-3">
                <div class="text-3xl">🌌</div>
                <div>
                  <div class="text-cyan-400 text-xs uppercase tracking-widest font-semibold">Cosmos del Conocimiento</div>
                  <div class="text-white text-lg font-light" id="cosmos-mode-title">Vista de Universo</div>
                </div>
              </div>
            </div>

            <!-- Búsqueda integrada -->
            <div class="backdrop-blur-xl bg-gradient-to-r from-slate-900/90 to-slate-800/90 rounded-2xl px-4 py-2 border border-purple-500/40 shadow-2xl shadow-purple-500/20 flex-1 max-w-md">
              <div class="flex items-center gap-3">
                <svg class="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
                <input
                  type="text"
                  id="cosmos-search-input"
                  placeholder="Buscar libros, temas..."
                  class="bg-transparent text-white placeholder-slate-400 outline-none flex-1 text-sm"
                />
              </div>
            </div>

            <!-- Controles de vista -->
            <div class="backdrop-blur-xl bg-gradient-to-r from-slate-900/90 to-slate-800/90 rounded-2xl p-2 border border-cyan-500/40 shadow-2xl shadow-cyan-500/20">
              <div class="flex gap-2">
                <button data-mode="cosmos" class="cosmos-mode-btn active group relative px-4 py-2 rounded-xl hover:bg-cyan-500/20 transition-all duration-300" title="Vista de Universo">
                  <span class="text-2xl">🌌</span>
                  <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-cyan-500 group-hover:w-full transition-all duration-300"></div>
                </button>
                <button data-mode="constellation" class="cosmos-mode-btn group relative px-4 py-2 rounded-xl hover:bg-purple-500/20 transition-all duration-300" title="Rutas de Aprendizaje">
                  <span class="text-2xl">✨</span>
                  <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-purple-500 group-hover:w-full transition-all duration-300"></div>
                </button>
                <button data-mode="exploration" class="cosmos-mode-btn group relative px-4 py-2 rounded-xl hover:bg-amber-500/20 transition-all duration-300" title="Grafo de Conocimiento">
                  <span class="text-2xl">🕸️</span>
                  <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-amber-500 group-hover:w-full transition-all duration-300"></div>
                </button>
                <button data-mode="need" class="cosmos-mode-btn group relative px-4 py-2 rounded-xl hover:bg-rose-500/20 transition-all duration-300" title="Búsqueda por Necesidad">
                  <span class="text-2xl">🎯</span>
                  <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-rose-500 group-hover:w-full transition-all duration-300"></div>
                </button>
              </div>
            </div>

            <!-- Cerrar -->
            <button id="cosmos-close" class="backdrop-blur-xl bg-gradient-to-r from-slate-900/90 to-slate-800/90 rounded-2xl px-4 py-2 border border-red-500/40 hover:bg-red-500/20 transition-all duration-300 shadow-2xl shadow-red-500/20 text-white">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>

        <!-- Panel de Necesidades (mejorado) -->
        <div id="cosmos-needs-panel" class="absolute top-28 left-6 backdrop-blur-xl bg-gradient-to-br from-slate-900/95 to-slate-800/95 rounded-3xl p-6 border border-cyan-500/40 shadow-2xl shadow-cyan-500/30 hidden pointer-events-auto max-w-md">
          <div class="text-cyan-400 text-2xl font-light mb-6">¿Qué estás buscando?</div>
          <div class="grid grid-cols-2 gap-3">
            ${this.createNeedButtons()}
          </div>
          <button id="cosmos-clear-filter" class="mt-6 w-full px-4 py-3 bg-slate-800/80 rounded-xl hover:bg-red-500/30 transition-all duration-300 border border-slate-600 hover:border-red-500 text-white text-sm font-semibold">
            ✕ Limpiar filtro
          </button>
        </div>

        <!-- Tooltip mejorado -->
        <div id="cosmos-tooltip" class="absolute pointer-events-none hidden backdrop-blur-xl bg-gradient-to-br from-slate-900/98 to-slate-800/98 rounded-2xl px-6 py-4 border-2 border-cyan-500/60 shadow-2xl shadow-cyan-500/40 max-w-sm">
          <div class="flex items-center gap-3 mb-2">
            <div class="text-3xl" id="tooltip-icon">📚</div>
            <div class="text-cyan-400 text-lg font-semibold" id="tooltip-title"></div>
          </div>
          <div class="text-slate-300 text-sm leading-relaxed" id="tooltip-description"></div>
          <div class="text-slate-400 text-xs mt-3 flex items-center gap-2" id="tooltip-meta"></div>
        </div>

        <!-- Stats mejorado -->
        <div class="absolute bottom-6 right-6 backdrop-blur-xl bg-gradient-to-br from-slate-900/90 to-slate-800/90 rounded-2xl px-6 py-4 border border-cyan-500/40 shadow-2xl shadow-cyan-500/20 pointer-events-auto">
          <div class="text-cyan-400 text-xs uppercase tracking-widest font-semibold mb-3">Estadísticas</div>
          <div class="space-y-2 text-sm">
            <div class="flex items-center gap-2">
              <div class="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></div>
              <span class="text-slate-300"><span id="stats-galaxies">13</span> Galaxias</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-2 h-2 rounded-full bg-amber-500 animate-pulse" style="animation-delay: 0.2s"></div>
              <span class="text-slate-300"><span id="stats-stars">102</span> Prácticas</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" style="animation-delay: 0.4s"></div>
              <span class="text-slate-300"><span id="stats-paths">42</span> Paths</span>
            </div>
          </div>
        </div>

        <!-- Instrucciones mejoradas -->
        <div class="absolute bottom-6 left-6 backdrop-blur-xl bg-gradient-to-br from-slate-900/90 to-slate-800/90 rounded-2xl px-6 py-4 border border-cyan-500/40 shadow-2xl shadow-cyan-500/20 text-sm text-slate-300 max-w-xs">
          <div class="font-semibold text-cyan-400 mb-3 flex items-center gap-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
            </svg>
            Controles
          </div>
          <div class="space-y-2 text-xs">
            <div class="flex items-start gap-2">
              <span class="text-cyan-400">🖱️</span>
              <span><strong>Arrastrar:</strong> Rotar vista</span>
            </div>
            <div class="flex items-start gap-2">
              <span class="text-cyan-400">🖱️</span>
              <span><strong>Rueda:</strong> Zoom</span>
            </div>
            <div class="flex items-start gap-2">
              <span class="text-cyan-400">🖱️</span>
              <span><strong>Doble click:</strong> Abrir</span>
            </div>
          </div>
        </div>

        <!-- Tutorial inicial (se oculta después) -->
        <div id="cosmos-tutorial" class="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center pointer-events-auto hidden">
          <div class="max-w-2xl backdrop-blur-xl bg-gradient-to-br from-slate-900/95 to-slate-800/95 rounded-3xl p-8 border-2 border-cyan-500/60 shadow-2xl shadow-cyan-500/40">
            <div class="text-center">
              <div class="text-6xl mb-4">🌌</div>
              <h2 class="text-3xl font-light text-cyan-400 mb-4">Bienvenido al Cosmos</h2>
              <p class="text-slate-300 text-lg leading-relaxed mb-8">
                Explora el conocimiento como nunca antes. Cada galaxia es un libro, cada estrella una práctica.
                Navega libremente por el universo del aprendizaje.
              </p>
              <button id="cosmos-tutorial-start" class="px-8 py-4 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 rounded-xl text-white font-semibold text-lg transition-all duration-300 shadow-lg shadow-cyan-500/50">
                Comenzar Exploración
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(container);
  }

  /**
   * Crear botones de necesidades con diseño mejorado
   */
  createNeedButtons() {
    const needs = [
      { key: 'paz', icon: '🧘', label: 'Necesito paz', color: 'cyan' },
      { key: 'actuar', icon: '🎯', label: 'Quiero actuar', color: 'red' },
      { key: 'entender', icon: '💡', label: 'Busco entender', color: 'purple' },
      { key: 'comunidad', icon: '🤝', label: 'Crear comunidad', color: 'green' },
      { key: 'proyecto', icon: '🌱', label: 'Empezar proyecto', color: 'amber' },
      { key: 'radical', icon: '⚡', label: 'Cambio radical', color: 'rose' },
      { key: 'ia', icon: '🤖', label: 'Dialogar con IA', color: 'blue' },
      { key: 'arte', icon: '🎨', label: 'Crear arte', color: 'pink' }
    ];

    return needs.map(need => `
      <button data-need="${need.key}" class="cosmos-need-btn group relative px-4 py-4 bg-slate-800/50 rounded-xl hover:bg-${need.color}-500/30 transition-all duration-300 border-2 border-slate-700 hover:border-${need.color}-500 text-left overflow-hidden">
        <div class="absolute inset-0 bg-gradient-to-br from-${need.color}-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div class="relative">
          <div class="text-3xl mb-2">${need.icon}</div>
          <div class="text-white text-sm font-medium">${need.label}</div>
        </div>
      </button>
    `).join('');
  }

  /**
   * Inicializar Three.js con mejoras
   */
  initThreeJS() {
    const canvas = document.getElementById('cosmos-canvas');
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x000000, 0.00020);

    // Camera
    this.camera = new THREE.PerspectiveCamera(60, width / height, 1, 10000);
    this.camera.position.set(0, 500, 1500);
    this.camera.lookAt(0, 0, 0);

    // Renderer con mejoras
    this.renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limitar para performance
    this.renderer.setClearColor(0x000000, 1);

    // Raycaster
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    // Luces mejoradas
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    this.scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x0ea5e9, 1.5, 2000);
    pointLight1.position.set(500, 500, 500);
    this.scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xa855f7, 1.5, 2000);
    pointLight2.position.set(-500, -500, -500);
    this.scene.add(pointLight2);

    // logger.debug('✅ Three.js inicializado con mejoras');
  }

  /**
   * Crear el universo completo
   */
  async createUniverse() {
    // logger.debug('🌠 Creando universo mejorado...');

    // 1. Campo de estrellas de fondo
    this.createStarfield();

    // 2. Crear galaxias con labels
    await this.createGalaxies();

    // 3. Ocultar loading screen con animación
    this._setTimeout(() => {
      const loading = document.getElementById('cosmos-loading');
      if (loading) {
        loading.style.opacity = '0';
        loading.style.transition = 'opacity 0.8s ease-out';
        this._setTimeout(() => loading.remove(), 800);
      }
    }, 1500);
  }

  /**
   * Crear campo de estrellas mejorado
   */
  createStarfield() {
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    const colors = [];
    const sizes = [];

    for (let i = 0; i < this.config.particleCount; i++) {
      const radius = this.config.universeRadius;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);

      vertices.push(x, y, z);

      // Colores variados
      const colorChoice = Math.random();
      if (colorChoice < 0.5) {
        colors.push(0.9, 0.9, 1.0); // Blanco-azulado
      } else if (colorChoice < 0.75) {
        colors.push(0.6, 0.8, 1.0); // Cyan
      } else if (colorChoice < 0.9) {
        colors.push(0.9, 0.6, 1.0); // Púrpura
      } else {
        colors.push(1.0, 0.8, 0.6); // Dorado
      }

      // Tamaños variados
      sizes.push(Math.random() * 3 + 1);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 2,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    });

    this.particles = new THREE.Points(geometry, material);
    this.scene.add(this.particles);

    // logger.debug('✨ Campo de estrellas mejorado:', this.config.particleCount, 'partículas');
  }

  /**
   * Crear galaxias con labels de texto
   */
  async createGalaxies() {
    const catalog = this.bookEngine?.catalog;
    if (!catalog || !catalog.books) {
      logger.error('Catálogo de libros no disponible');
      return;
    }

    const books = catalog.books;
    const bookCount = books.length;
    const radius = 800;

    for (let i = 0; i < bookCount; i++) {
      const book = books[i];
      const angle = (i / bookCount) * Math.PI * 2;

      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = (Math.random() - 0.5) * 200;

      const galaxy = await this.createGalaxy(book, x, y, z);
      this.galaxies.push(galaxy);
      this.scene.add(galaxy.group);

      // Crear label de texto
      const label = this.createTextLabel(book.title, x, y + 100, z);
      this.labels.push(label);
      this.scene.add(label);
    }

    // logger.debug('✅ Galaxias creadas con labels:', this.galaxies.length);
  }

  /**
   * Crear galaxia individual mejorada
   */
  async createGalaxy(book, x, y, z) {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    // Núcleo con glow mejorado
    const coreGeometry = new THREE.SphereGeometry(35, 32, 32);
    const coreMaterial = new THREE.MeshPhongMaterial({
      color: this.getBookColor(book),
      emissive: this.getBookColor(book),
      emissiveIntensity: 0.7,
      transparent: true,
      opacity: 0.95,
      shininess: 100
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    group.add(core);

    // Halo exterior
    const haloGeometry = new THREE.SphereGeometry(60, 32, 32);
    const haloMaterial = new THREE.MeshBasicMaterial({
      color: this.getBookColor(book),
      transparent: true,
      opacity: 0.15,
      side: THREE.BackSide
    });
    const halo = new THREE.Mesh(haloGeometry, haloMaterial);
    group.add(halo);

    // Anillo de partículas (capítulos)
    const particleCount = (book.chapterCount || 20) * 2;
    const particles = this.createGalaxyParticles(particleCount, this.getBookColor(book));
    group.add(particles);

    const galaxyData = {
      group: group,
      core: core,
      halo: halo,
      particles: particles,
      book: book,
      originalPosition: { x, y, z },
      rotationSpeed: 0.0005 + Math.random() * 0.001,
      pulsing: false
    };

    core.userData = {
      type: 'galaxy',
      bookId: book.id,
      title: book.title,
      description: book.subtitle || book.description,
      category: book.category
    };

    return galaxyData;
  }

  /**
   * Crear partículas de galaxia
   */
  createGalaxyParticles(count, color) {
    const geometry = new THREE.BufferGeometry();
    const vertices = [];

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 4;
      const radius = 40 + (i / count) * 50;

      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = (Math.random() - 0.5) * 15;

      vertices.push(x, y, z);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

    const material = new THREE.PointsMaterial({
      color: color,
      size: 4,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending
    });

    return new THREE.Points(geometry, material);
  }

  /**
   * Crear label de texto flotante
   */
  createTextLabel(text, x, y, z) {
    // Crear canvas para el texto
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 512;
    canvas.height = 128;

    // Dibujar texto
    context.fillStyle = 'rgba(14, 165, 233, 0.8)';
    context.font = 'bold 48px Inter, sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text.substring(0, 30), 256, 64);

    // Crear textura
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    // Crear sprite
    const spriteMaterial = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      opacity: 0.8,
      depthTest: false
    });

    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.position.set(x, y, z);
    sprite.scale.set(200, 50, 1);

    return sprite;
  }

  /**
   * Obtener color de libro
   */
  getBookColor(book) {
    const colorMap = {
      'Filosofía': 0x9333ea,
      'IA y Tecnología': 0x0ea5e9,
      'Pedagogía': 0x10b981,
      'Ecología': 0x84cc16,
      'Arte': 0xf472b6,
      'Transformación': 0xf59e0b,
      'Acción': 0xef4444,
      'default': 0x60a5fa
    };

    return colorMap[book.category] || colorMap.default;
  }

  /**
   * Event listeners mejorados
   * ⭐ FIX v2.9.180: Migrado a EventManager para prevenir memory leaks
   */
  attachEventListeners() {
    // Cerrar
    const closeBtn = document.getElementById('cosmos-close');
    if (closeBtn) {
      this.eventManager.addEventListener(closeBtn, 'click', () => this.hide());
    }

    // Cambio de modo
    document.querySelectorAll('.cosmos-mode-btn').forEach(btn => {
      this.eventManager.addEventListener(btn, 'click', (e) => {
        const mode = e.currentTarget.dataset.mode;
        this.setMode(mode);
      });
    });

    // Necesidades
    document.querySelectorAll('.cosmos-need-btn').forEach(btn => {
      this.eventManager.addEventListener(btn, 'click', (e) => {
        const need = e.currentTarget.dataset.need;
        this.applyNeedFilter(need);
      });
    });

    // Limpiar filtro
    const clearFilterBtn = document.getElementById('cosmos-clear-filter');
    if (clearFilterBtn) {
      this.eventManager.addEventListener(clearFilterBtn, 'click', () => {
        this.clearNeedFilter();
      });
    }

    // Tutorial
    const tutorialBtn = document.getElementById('cosmos-tutorial-start');
    if (tutorialBtn) {
      this.eventManager.addEventListener(tutorialBtn, 'click', () => {
        document.getElementById('cosmos-tutorial')?.classList.add('hidden');
        // 🔧 FIX v2.9.198: Error handling - prevent silent failures in localStorage operations
        try {
          localStorage.setItem('cosmos-tutorial-seen', 'true');
        } catch (error) {
          logger.error('Error guardando estado del tutorial:', error);
        }
      });
    }

    // Búsqueda
    const searchInput = document.getElementById('cosmos-search-input');
    if (searchInput) {
      this.eventManager.addEventListener(searchInput, 'input', (e) => {
        this.searchQuery = e.target.value.toLowerCase();
        this.applySearch();
      });
    }

    // Mouse events con controles mejorados
    const canvas = document.getElementById('cosmos-canvas');
    if (!canvas) return;

    this.eventManager.addEventListener(canvas, 'mousedown', (e) => {
      this.isDragging = true;
      this.previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    this.eventManager.addEventListener(canvas, 'mouseup', () => {
      this.isDragging = false;
    });

    this.eventManager.addEventListener(canvas, 'mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (this.isDragging) {
        const deltaX = e.clientX - this.previousMousePosition.x;
        const deltaY = e.clientY - this.previousMousePosition.y;

        this.cameraRotation.theta += deltaX * this.config.rotationSpeed;
        this.cameraRotation.phi += deltaY * this.config.rotationSpeed;

        // Limitar phi para evitar flip
        this.cameraRotation.phi = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.cameraRotation.phi));

        this.previousMousePosition = { x: e.clientX, y: e.clientY };
      }

      this.onMouseMove();
    });

    this.eventManager.addEventListener(canvas, 'wheel', (e) => {
      e.preventDefault();
      this.targetCameraDistance += e.deltaY * this.config.zoomSpeed;
      this.targetCameraDistance = Math.max(500, Math.min(3000, this.targetCameraDistance));
    });

    this.eventManager.addEventListener(canvas, 'dblclick', (e) => {
      if (e.target.closest('#cosmos-hud')) return;
      this.onDoubleClick();
    });

    // Resize
    this.eventManager.addEventListener(window, 'resize', () => {
      if (!this.isVisible) return;
      this.onResize();
    });
  }

  /**
   * Actualizar controles de cámara suaves
   */
  updateCamera() {
    // Smooth zoom
    this.cameraDistance += (this.targetCameraDistance - this.cameraDistance) * this.config.cameraDamping;

    // Calcular posición de cámara en coordenadas esféricas
    const targetX = this.cameraDistance * Math.sin(this.cameraRotation.phi) * Math.cos(this.cameraRotation.theta);
    const targetY = this.cameraDistance * Math.cos(this.cameraRotation.phi);
    const targetZ = this.cameraDistance * Math.sin(this.cameraRotation.phi) * Math.sin(this.cameraRotation.theta);

    // Smooth movement
    this.camera.position.x += (targetX - this.camera.position.x) * this.config.cameraDamping;
    this.camera.position.y += (targetY - this.camera.position.y) * this.config.cameraDamping;
    this.camera.position.z += (targetZ - this.camera.position.z) * this.config.cameraDamping;

    this.camera.lookAt(this.cameraTarget);
  }

  /**
   * Cambiar modo con transición
   */
  setMode(mode) {
    this.currentMode = mode;

    // Actualizar botones
    document.querySelectorAll('.cosmos-mode-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });

    // Mostrar/ocultar panel de necesidades
    const needsPanel = document.getElementById('cosmos-needs-panel');
    if (mode === 'need') {
      needsPanel?.classList.remove('hidden');
    } else {
      needsPanel?.classList.add('hidden');
    }

    // Actualizar título
    const titles = {
      cosmos: 'Vista de Universo',
      constellation: 'Constelaciones de Aprendizaje',
      exploration: 'Grafo de Conocimiento',
      need: 'Navegación por Necesidad'
    };
    const titleEl = document.getElementById('cosmos-mode-title');
    if (titleEl) titleEl.textContent = titles[mode];

    // logger.debug('🔄 Modo cambiado a:', mode);
  }

  /**
   * Aplicar búsqueda
   */
  applySearch() {
    if (!this.searchQuery) {
      this.galaxies.forEach(g => this.highlightGalaxy(g, true));
      return;
    }

    this.galaxies.forEach(galaxy => {
      const book = galaxy.book;
      const matches =
        book.title.toLowerCase().includes(this.searchQuery) ||
        (book.subtitle && book.subtitle.toLowerCase().includes(this.searchQuery)) ||
        (book.tags && book.tags.some(tag => tag.toLowerCase().includes(this.searchQuery)));

      this.highlightGalaxy(galaxy, matches);
    });
  }

  /**
   * Aplicar filtro por necesidad
   */
  applyNeedFilter(need) {
    this.needFilter = need;
    const tags = this.needMap[need] || [];

    this.galaxies.forEach(galaxy => {
      const book = galaxy.book;
      const isRelevant = tags.some(tag =>
        book.tags && book.tags.some(bookTag =>
          bookTag.toLowerCase().includes(tag.toLowerCase())
        )
      );

      this.highlightGalaxy(galaxy, isRelevant);
    });

    if (window.toast) {
      window.toast.show(`Filtrando: ${need}`, 'info');
    }
  }

  /**
   * Limpiar filtro
   */
  clearNeedFilter() {
    this.needFilter = null;
    this.galaxies.forEach(g => this.highlightGalaxy(g, true));
  }

  /**
   * Destacar/atenuar galaxia
   */
  highlightGalaxy(galaxy, highlight) {
    const targetOpacity = highlight ? 0.95 : 0.25;
    const targetEmissive = highlight ? 0.7 : 0.1;

    galaxy.core.material.opacity = targetOpacity;
    galaxy.core.material.emissiveIntensity = targetEmissive;
    galaxy.halo.material.opacity = highlight ? 0.15 : 0.05;
    galaxy.pulsing = highlight;
  }

  /**
   * Mouse move handler
   */
  onMouseMove() {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersectables = this.galaxies.map(g => g.core);
    const intersects = this.raycaster.intersectObjects(intersectables);

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
   * Hover in
   */
  onHoverIn(object) {
    document.body.style.cursor = 'pointer';
    object.scale.set(1.3, 1.3, 1.3);

    const userData = object.userData;
    if (userData) this.showTooltip(userData);
  }

  /**
   * Hover out
   */
  onHoverOut(object) {
    document.body.style.cursor = 'default';
    object.scale.set(1, 1, 1);
    this.hideTooltip();
  }

  /**
   * Mostrar tooltip mejorado
   */
  showTooltip(userData) {
    const tooltip = document.getElementById('cosmos-tooltip');
    const icon = document.getElementById('tooltip-icon');
    const title = document.getElementById('tooltip-title');
    const description = document.getElementById('tooltip-description');
    const meta = document.getElementById('tooltip-meta');

    // Iconos por categoría
    const icons = {
      'Filosofía': '🧠',
      'IA y Tecnología': '🤖',
      'Pedagogía': '🎓',
      'Ecología': '🌱',
      'Arte': '🎨',
      'Transformación': '⚡',
      'Acción': '🎯'
    };

    icon.textContent = icons[userData.category] || '📚';
    title.textContent = userData.title || 'Sin título';
    description.textContent = userData.description || '';
    meta.textContent = userData.category ? `📚 ${userData.category}` : '';

    tooltip.classList.remove('hidden');

    // Posicionar cerca del mouse
    tooltip.style.left = (event.clientX + 20) + 'px';
    tooltip.style.top = (event.clientY + 20) + 'px';
  }

  /**
   * Ocultar tooltip
   */
  hideTooltip() {
    document.getElementById('cosmos-tooltip')?.classList.add('hidden');
  }

  /**
   * Double click handler
   */
  onDoubleClick() {
    if (!this.hoveredObject) return;

    const userData = this.hoveredObject.userData;
    if (userData.type === 'galaxy') {
      this.openBook(userData.bookId);
    }
  }

  /**
   * Abrir libro
   */
  openBook(bookId) {
    // logger.debug('📖 Abriendo libro:', bookId);
    this.hide();

    if (window.biblioteca) {
      window.biblioteca?.openBook(bookId);
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
   * Loop de animación mejorado
   */
  animate() {
    if (!this.isVisible) return;

    this.animationFrameId = requestAnimationFrame(() => this.animate());

    // Actualizar controles de cámara
    this.updateCamera();

    // Rotar campo de estrellas
    if (this.particles) {
      this.particles.rotation.y += 0.0001;
    }

    // Rotar y animar galaxias
    this.galaxies.forEach(galaxy => {
      galaxy.group.rotation.y += galaxy.rotationSpeed;

      // Pulsar si está destacada
      if (galaxy.pulsing) {
        const scale = 1 + Math.sin(Date.now() * 0.002) * 0.12;
        galaxy.core.scale.set(scale, scale, scale);
      } else {
        galaxy.core.scale.set(1, 1, 1);
      }
    });

    // Labels siempre mirando a la cámara
    this.labels.forEach(label => {
      label.lookAt(this.camera.position);
    });

    // Render
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Mostrar cosmos
   */
  show() {
    if (!this.isInitialized) {
      this.init();
    }

    const container = document.getElementById('cosmos-container');
    container?.classList.remove('hidden');
    this.isVisible = true;

    // Mostrar tutorial si es primera vez
    const tutorialSeen = localStorage.getItem('cosmos-tutorial-seen');
    if (!tutorialSeen) {
      this._setTimeout(() => {
        document.getElementById('cosmos-tutorial')?.classList.remove('hidden');
      }, 1000);
    }

    this.animate();
    // logger.debug('🌌 Cosmos visible');
  }

  /**
   * Ocultar cosmos
   */
  hide() {
    document.getElementById('cosmos-container')?.classList.add('hidden');
    this.isVisible = false;

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    this.clearNeedFilter();
    // logger.debug('👋 Cosmos oculto');
  }

  /**
   * setTimeout wrapper que auto-registra el timer para cleanup posterior
   * ⭐ FIX v2.9.185: Timer tracking para prevenir memory leaks
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
   * Cleanup completo - Liberar todos los recursos
   * ⭐ FIX v2.9.180: Prevenir memory leaks críticos de WebGL y event listeners
   * ⭐ FIX v2.9.185: Añadido cleanup de timers pendientes
   */
  cleanup() {
    logger.debug('🧹 [CosmosNavigation] Iniciando cleanup completo...');

    // 1. Cancelar animationFrame
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // 2. Limpiar timers pendientes (⭐ FIX v2.9.185)
    this.timers.forEach(timerId => clearTimeout(timerId));
    this.timers = [];

    // 3. Limpiar event listeners
    this.eventManager.cleanup();

    // 4. Dispose de Three.js resources (CRÍTICO para evitar memory leaks de WebGL)
    if (this.scene) {
      this.scene.traverse((object) => {
        // Dispose geometries
        if (object.geometry) {
          object.geometry.dispose();
        }

        // Dispose materials
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
          } else {
            object.material.dispose();
          }
        }

        // Dispose textures
        if (object.material && object.material.map) {
          object.material.map.dispose();
        }
      });

      // Clear scene
      while (this.scene.children.length > 0) {
        this.scene.remove(this.scene.children[0]);
      }

      this.scene = null;
    }

    // 5. Dispose renderer y forzar liberación de contexto WebGL
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.forceContextLoss();
      this.renderer.domElement = null;
      this.renderer = null;
    }

    // 6. Limpiar arrays
    this.galaxies = [];
    this.stars = [];
    this.constellations = [];
    this.labels = [];
    this.particles = null;

    // 7. Limpiar referencias
    this.camera = null;
    this.raycaster = null;
    this.mouse = null;
    this.hoveredObject = null;
    this.selectedGalaxy = null;

    this.isInitialized = false;

    logger.debug('✅ [CosmosNavigation] Cleanup completado - Memoria liberada');
  }

  /**
   * Destruir completamente el componente
   * Llamar cuando ya no se necesite el cosmos navigation
   */
  destroy() {
    this.hide();
    this.cleanup();

    // Remover contenedor del DOM
    const container = document.getElementById('cosmos-container');
    if (container) {
      container.remove();
    }

    logger.debug('🗑️ [CosmosNavigation] Componente destruido completamente');
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

// Exportar para uso global
if (typeof window !== 'undefined') {
  window.CosmosNavigation = CosmosNavigationV2;
  // logger.debug('✅ CosmosNavigation v2 class registered globally');
}

// Node.js module export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CosmosNavigationV2;
}
