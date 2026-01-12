/**
 * TransitionGlobe.js
 * Globo 3D interactivo para visualizar proyectos de transición
 * Adaptado de Globe3D (Awakening Protocol) para uso web
 * @version 1.0.0
 */

class TransitionGlobe {
  constructor(containerId, options = {}) {
    this.containerId = containerId;
    this.container = document.getElementById(containerId);

    if (!this.container) {
      console.error(`[TransitionGlobe] Container #${containerId} not found`);
      return;
    }

    this.options = {
      onProjectSelect: options.onProjectSelect || null,
      autoRotate: options.autoRotate !== false,
      ...options
    };

    this.projects = [];
    this.filteredProjects = [];
    this.categories = {};
    this.selectedProject = null;
    this.filters = {
      categories: [],
      scales: []
    };

    this.init();
  }

  async init() {
    this.showLoading();

    try {
      await this.loadProjectsData();
      this.renderGlobe();
    } catch (error) {
      console.error('[TransitionGlobe] Init error:', error);
      this.hideLoading();
    }
  }

  showLoading() {
    const loading = document.createElement('div');
    loading.id = 'tg-loading';
    loading.className = 'tg-loading';
    loading.innerHTML = `
      <div class="tg-loading-spinner"></div>
      <p class="tg-loading-text">Cargando mapa de transición...</p>
    `;
    this.container.appendChild(loading);
  }

  hideLoading() {
    const loading = document.getElementById('tg-loading');
    if (loading) loading.remove();
  }

  async loadProjectsData() {
    try {
      const response = await fetch('./js/data/transition-projects.json');
      const data = await response.json();

      this.projects = data.projects || [];
      this.categories = data.categories || {};
      this.scales = data.scales || {};
      this.filteredProjects = [...this.projects];

      console.log(`[TransitionGlobe] Loaded ${this.projects.length} projects`);
    } catch (error) {
      console.error('[TransitionGlobe] Error loading projects:', error);
      this.projects = [];
      this.filteredProjects = [];
    }
  }

  applyFilters() {
    this.filteredProjects = this.projects.filter(project => {
      // Category filter
      if (this.filters.categories.length > 0) {
        if (!this.filters.categories.includes(project.type)) {
          return false;
        }
      }

      // Scale filter
      if (this.filters.scales.length > 0) {
        if (!this.filters.scales.includes(project.scale)) {
          return false;
        }
      }

      return true;
    });

    // Update globe with filtered projects
    this.updateMarkers();

    // Update stats
    this.updateStats();
  }

  toggleCategoryFilter(category) {
    const index = this.filters.categories.indexOf(category);
    if (index === -1) {
      this.filters.categories.push(category);
    } else {
      this.filters.categories.splice(index, 1);
    }
    this.applyFilters();
  }

  toggleScaleFilter(scale) {
    const index = this.filters.scales.indexOf(scale);
    if (index === -1) {
      this.filters.scales.push(scale);
    } else {
      this.filters.scales.splice(index, 1);
    }
    this.applyFilters();
  }

  getProjectsJSON() {
    return JSON.stringify(this.filteredProjects.map(p => ({
      id: p.id,
      lat: p.lat,
      lon: p.lon,
      type: p.type,
      name: p.name,
      scale: p.scale,
      color: this.categories[p.type]?.color || '#10b981'
    })));
  }

  getCategoriesJSON() {
    return JSON.stringify(this.categories);
  }

  updateMarkers() {
    if (this.iframe && this.iframe.contentWindow) {
      const projectsJson = this.getProjectsJSON();
      this.iframe.contentWindow.postMessage({
        type: 'updateProjects',
        projects: projectsJson
      }, '*');
    }
  }

  updateStats() {
    const statsContainer = document.getElementById('tg-stats');
    if (statsContainer) {
      const countrySet = new Set(this.filteredProjects.map(p => p.country).filter(Boolean));

      statsContainer.innerHTML = `
        <div class="tg-stat">
          <div class="tg-stat-value">${this.filteredProjects.length}</div>
          <div class="tg-stat-label">Proyectos</div>
        </div>
        <div class="tg-stat">
          <div class="tg-stat-value">${countrySet.size}</div>
          <div class="tg-stat-label">Países</div>
        </div>
        <div class="tg-stat">
          <div class="tg-stat-value">${Object.keys(this.categories).length}</div>
          <div class="tg-stat-label">Categorías</div>
        </div>
      `;
    }
  }

  selectProject(projectId) {
    this.selectedProject = this.projects.find(p => p.id === projectId);

    if (this.selectedProject && this.options.onProjectSelect) {
      this.options.onProjectSelect(this.selectedProject);
    }

    // Notify globe to highlight marker
    if (this.iframe && this.iframe.contentWindow) {
      this.iframe.contentWindow.postMessage({
        type: 'selectProject',
        projectId: projectId
      }, '*');
    }
  }

  renderGlobe() {
    const projectsJson = this.getProjectsJSON();
    const categoriesJson = this.getCategoriesJSON();

    const globeHTML = this.generateGlobeHTML(projectsJson, categoriesJson);

    // Create iframe for globe
    this.iframe = document.createElement('iframe');
    this.iframe.style.cssText = 'width:100%;height:100%;border:none;';
    this.iframe.srcdoc = globeHTML;

    this.container.appendChild(this.iframe);

    // Listen for messages from globe
    window.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'projectSelect') {
        this.selectProject(event.data.projectId);
      }
      if (event.data && event.data.type === 'globeReady') {
        this.hideLoading();
        this.updateStats();
      }
    });
  }

  generateGlobeHTML(projectsJson, categoriesJson) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: #0f172a; touch-action: none; }
    canvas { display: block; }

    #zoom-controls {
      position: absolute;
      bottom: 20px;
      right: 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      z-index: 100;
    }
    .zoom-btn {
      width: 44px;
      height: 44px;
      border: none;
      border-radius: 50%;
      background: rgba(16, 185, 129, 0.85);
      color: white;
      font-size: 24px;
      font-weight: bold;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.4);
      transition: all 0.2s ease;
      -webkit-tap-highlight-color: transparent;
      user-select: none;
    }
    .zoom-btn:active {
      transform: scale(0.92);
      background: rgba(5, 150, 105, 0.9);
    }
    .zoom-btn:hover {
      background: rgba(5, 150, 105, 0.9);
    }

    /* Tooltip */
    #marker-tooltip {
      position: absolute;
      background: rgba(15, 23, 42, 0.95);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 8px;
      padding: 8px 12px;
      color: white;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 12px;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.2s ease;
      z-index: 200;
      max-width: 200px;
    }
    #marker-tooltip.visible {
      opacity: 1;
    }
    #marker-tooltip .tooltip-name {
      font-weight: 600;
      margin-bottom: 4px;
    }
    #marker-tooltip .tooltip-location {
      color: #94a3b8;
      font-size: 11px;
    }
    #marker-tooltip .tooltip-category {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      margin-top: 4px;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 10px;
    }
  </style>
</head>
<body>
  <div id="zoom-controls">
    <button class="zoom-btn" id="zoom-in" onclick="zoomIn()">+</button>
    <button class="zoom-btn" id="zoom-out" onclick="zoomOut()">−</button>
  </div>
  <div id="marker-tooltip"></div>

  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
  <script>
    // Textures
    const TEXTURES = {
      earth: 'https://unpkg.com/three-globe@2.24.13/example/img/earth-blue-marble.jpg',
      night: 'https://unpkg.com/three-globe@2.24.13/example/img/earth-night.jpg',
      clouds: 'https://unpkg.com/three-globe@2.24.13/example/img/earth-clouds.png'
    };

    // Data
    let projectsData = ${projectsJson};
    let categoriesData = ${categoriesJson};
    let selectedProjectId = null;

    // Three.js variables
    let scene, camera, renderer, globe, nightGlobe, clouds, atmosphere, sunLight;
    let markersGroup;
    let isDragging = false, previousTouch = null, touchStartTime = 0, touchStartPos = null;
    let rotationVelocity = { x: 0, y: 0 };
    let autoRotate = true;
    let texturesLoaded = 0;
    const requiredTextures = 2;

    // Zoom variables
    let isPinching = false;
    let lastPinchDistance = 0;
    let cameraDistance = 2.5;
    const MIN_ZOOM = 1.5;
    const MAX_ZOOM = 5.0;
    const ZOOM_STEP = 0.35;

    const textureLoader = new THREE.TextureLoader();
    textureLoader.crossOrigin = 'anonymous';

    // Tooltip element
    const tooltip = document.getElementById('marker-tooltip');

    function zoomIn() {
      cameraDistance = Math.max(MIN_ZOOM, cameraDistance - ZOOM_STEP);
      if (camera) camera.position.z = cameraDistance;
      autoRotate = false;
      setTimeout(() => { if (!isDragging && !isPinching) autoRotate = true; }, 3000);
    }

    function zoomOut() {
      cameraDistance = Math.min(MAX_ZOOM, cameraDistance + ZOOM_STEP);
      if (camera) camera.position.z = cameraDistance;
      autoRotate = false;
      setTimeout(() => { if (!isDragging && !isPinching) autoRotate = true; }, 3000);
    }

    function init() {
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.z = 2.5;

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(0x0f172a, 1);
      document.body.appendChild(renderer.domElement);

      createStarfield();
      setupLights();
      loadTextures();
      setupEventListeners();

      // Listen for updates from parent
      window.addEventListener('message', handleParentMessage);
    }

    function handleParentMessage(event) {
      if (!event.data) return;

      if (event.data.type === 'updateProjects') {
        projectsData = JSON.parse(event.data.projects);
        createMarkers();
      }

      if (event.data.type === 'selectProject') {
        selectedProjectId = event.data.projectId;
        createMarkers();
      }
    }

    function createStarfield() {
      const starsGeometry = new THREE.BufferGeometry();
      const starsMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.02,
        transparent: true,
        opacity: 0.8
      });

      const starsVertices = [];
      for (let i = 0; i < 2000; i++) {
        const x = (Math.random() - 0.5) * 100;
        const y = (Math.random() - 0.5) * 100;
        const z = (Math.random() - 0.5) * 100;
        starsVertices.push(x, y, z);
      }

      starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
      const starField = new THREE.Points(starsGeometry, starsMaterial);
      scene.add(starField);
    }

    function setupLights() {
      scene.add(new THREE.AmbientLight(0x111122, 0.15));
      sunLight = new THREE.DirectionalLight(0xffffff, 2.2);
      scene.add(sunLight);
      const fill = new THREE.DirectionalLight(0x334466, 0.05);
      fill.position.set(-5, 0, -5);
      scene.add(fill);
    }

    function loadTextures() {
      textureLoader.load(TEXTURES.earth,
        (texture) => {
          texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
          createDayGlobe(texture);
          onTextureLoaded();
        },
        undefined,
        () => {
          createFallbackGlobe();
          onTextureLoaded();
        }
      );

      textureLoader.load(TEXTURES.night,
        (texture) => {
          createNightGlobe(texture);
          onTextureLoaded();
        },
        undefined,
        () => {
          createProceduralNightGlobe();
          onTextureLoaded();
        }
      );

      textureLoader.load(TEXTURES.clouds,
        (texture) => createClouds(texture),
        undefined,
        () => {}
      );
    }

    function onTextureLoaded() {
      texturesLoaded++;
      if (texturesLoaded >= requiredTextures) {
        createAtmosphere();
        createMarkers();

        // Notify parent that globe is ready
        window.parent.postMessage({ type: 'globeReady' }, '*');

        animate();
      }
    }

    function createDayGlobe(texture) {
      const geometry = new THREE.SphereGeometry(1, 64, 64);
      const material = new THREE.ShaderMaterial({
        uniforms: {
          dayTexture: { value: texture },
          sunDirection: { value: new THREE.Vector3(1, 0, 0) }
        },
        vertexShader: \`
          varying vec2 vUv;
          varying vec3 vNormal;
          void main() {
            vUv = uv;
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        \`,
        fragmentShader: \`
          uniform sampler2D dayTexture;
          uniform vec3 sunDirection;
          varying vec2 vUv;
          varying vec3 vNormal;
          void main() {
            vec4 dayColor = texture2D(dayTexture, vUv);
            vec3 normal = normalize(vNormal);
            float sunLight = dot(normal, normalize(sunDirection));
            float brightness = smoothstep(-0.15, 0.35, sunLight);
            brightness = mix(0.18, 1.0, brightness);
            vec3 nightTint = vec3(0.15, 0.2, 0.35);
            vec3 finalColor = mix(dayColor.rgb * nightTint, dayColor.rgb, brightness);
            gl_FragColor = vec4(finalColor, 1.0);
          }
        \`
      });

      globe = new THREE.Mesh(geometry, material);
      scene.add(globe);
    }

    function createNightGlobe(nightTexture) {
      const geometry = new THREE.SphereGeometry(1.003, 64, 64);
      const material = new THREE.ShaderMaterial({
        uniforms: {
          nightTexture: { value: nightTexture },
          sunDirection: { value: new THREE.Vector3(1, 0, 0).normalize() }
        },
        vertexShader: \`
          varying vec2 vUv;
          varying vec3 vNormal;
          void main() {
            vUv = uv;
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        \`,
        fragmentShader: \`
          uniform sampler2D nightTexture;
          uniform vec3 sunDirection;
          varying vec2 vUv;
          varying vec3 vNormal;
          void main() {
            vec3 normal = normalize(vNormal);
            float sunIntensity = dot(normal, sunDirection);
            float nightVisibility = smoothstep(0.1, -0.2, sunIntensity);
            vec4 nightColor = texture2D(nightTexture, vUv);
            vec3 lightColor = nightColor.rgb * 1.5;
            float alpha = nightVisibility * nightColor.r * 0.7;
            gl_FragColor = vec4(lightColor, alpha);
          }
        \`,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });

      nightGlobe = new THREE.Mesh(geometry, material);
      scene.add(nightGlobe);
    }

    function createProceduralNightGlobe() {
      // Simplified procedural night lights
      const canvas = document.createElement('canvas');
      canvas.width = 2048;
      canvas.height = 1024;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = 'rgba(0,0,0,0)';
      ctx.fillRect(0, 0, 2048, 1024);

      // Major cities
      const cities = [
        [40.71, -74.01, 12], [34.05, -118.24, 10], [51.51, -0.13, 12],
        [48.86, 2.35, 11], [35.68, 139.65, 14], [31.23, 121.47, 13],
        [19.43, -99.13, 11], [-23.55, -46.63, 12], [28.61, 77.21, 11],
        [55.76, 37.62, 10], [-33.87, 151.21, 8]
      ];

      cities.forEach(([lat, lon, size]) => {
        const x = ((lon + 180) / 360) * 2048;
        const y = ((90 - lat) / 180) * 1024;
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, size * 1.8);
        gradient.addColorStop(0, 'rgba(255, 230, 150, 0.9)');
        gradient.addColorStop(0.4, 'rgba(255, 200, 100, 0.5)');
        gradient.addColorStop(1, 'rgba(255, 150, 50, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, size * 1.8, 0, Math.PI * 2);
        ctx.fill();
      });

      const nightTexture = new THREE.CanvasTexture(canvas);
      createNightGlobe(nightTexture);
    }

    function createFallbackGlobe() {
      const geometry = new THREE.SphereGeometry(1, 64, 64);
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      const oceanGrad = ctx.createLinearGradient(0, 0, 0, 512);
      oceanGrad.addColorStop(0, '#0a2463');
      oceanGrad.addColorStop(0.5, '#1e3a5f');
      oceanGrad.addColorStop(1, '#0a2463');
      ctx.fillStyle = oceanGrad;
      ctx.fillRect(0, 0, 1024, 512);
      ctx.fillStyle = '#2d5a27';
      ctx.beginPath();
      ctx.ellipse(180, 150, 80, 60, 0, 0, Math.PI * 2);
      ctx.fill();

      const texture = new THREE.CanvasTexture(canvas);
      const material = new THREE.MeshPhongMaterial({ map: texture });
      globe = new THREE.Mesh(geometry, material);
      scene.add(globe);
    }

    function createClouds(texture) {
      const geometry = new THREE.SphereGeometry(1.015, 64, 64);
      const material = new THREE.MeshPhongMaterial({
        map: texture,
        transparent: true,
        opacity: 0.25,
        depthWrite: false
      });
      clouds = new THREE.Mesh(geometry, material);
      scene.add(clouds);
    }

    function createAtmosphere() {
      const geometry = new THREE.SphereGeometry(1.12, 64, 64);
      const material = new THREE.ShaderMaterial({
        vertexShader: \`
          varying vec3 vNormal;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        \`,
        fragmentShader: \`
          varying vec3 vNormal;
          void main() {
            float intensity = pow(0.7 - dot(vNormal, vec3(0, 0, 1.0)), 2.0);
            gl_FragColor = vec4(0.2, 0.8, 0.5, intensity * 0.4);
          }
        \`,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        transparent: true
      });
      atmosphere = new THREE.Mesh(geometry, material);
      scene.add(atmosphere);
    }

    function createMarkers() {
      if (markersGroup) scene.remove(markersGroup);
      markersGroup = new THREE.Group();

      projectsData.forEach((project, i) => {
        if (project.lat && project.lon) {
          const marker = createProjectMarker(project, i);
          markersGroup.add(marker);
        }
      });

      scene.add(markersGroup);
    }

    function createProjectMarker(project, index) {
      const group = new THREE.Group();

      const color = new THREE.Color(project.color || '#10b981');
      const isSelected = project.id === selectedProjectId;

      // Scale based on project scale
      let sizeMultiplier = 1;
      if (project.scale === 'global') sizeMultiplier = 1.4;
      else if (project.scale === 'nacional') sizeMultiplier = 1.2;
      else if (project.scale === 'regional') sizeMultiplier = 1.0;
      else sizeMultiplier = 0.8;

      const size = 0.018 * sizeMultiplier;

      // Pin base position
      const basePos = latLonToVector3(project.lat, project.lon, 1.01);

      // Pin stem
      const stemGeo = new THREE.CylinderGeometry(0.002, 0.002, 0.03, 8);
      const stemMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const stem = new THREE.Mesh(stemGeo, stemMat);
      stem.position.copy(basePos);
      stem.lookAt(0, 0, 0);
      stem.rotateX(Math.PI / 2);
      group.add(stem);

      // Pin head
      const headPos = latLonToVector3(project.lat, project.lon, 1.045);
      const sphereGeo = new THREE.SphereGeometry(size, 16, 16);
      const sphereMat = new THREE.MeshPhongMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: isSelected ? 0.9 : 0.5,
        shininess: 100
      });
      const sphere = new THREE.Mesh(sphereGeo, sphereMat);
      sphere.position.copy(headPos);
      sphere.userData = { projectId: project.id, project: project };
      group.add(sphere);

      // Glow (also clickable for easier selection)
      const glowGeo = new THREE.SphereGeometry(size * 2.5, 16, 16);
      const glowMat = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: isSelected ? 0.45 : 0.22
      });
      const glow = new THREE.Mesh(glowGeo, glowMat);
      glow.position.copy(headPos);
      glow.userData = { isGlow: true, projectId: project.id, project: project };
      group.add(glow);

      // Selection rings
      if (isSelected) {
        for (let i = 0; i < 2; i++) {
          const ringGeo = new THREE.RingGeometry(size * (2.2 + i * 0.5), size * (2.5 + i * 0.5), 32);
          const ringMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.6 - i * 0.2,
            side: THREE.DoubleSide
          });
          const ring = new THREE.Mesh(ringGeo, ringMat);
          ring.position.copy(headPos);
          ring.lookAt(0, 0, 0);
          ring.userData = { isRing: true, speed: 0.02 + i * 0.01 };
          group.add(ring);
        }
      }

      group.userData = { projectId: project.id };
      return group;
    }

    function latLonToVector3(lat, lon, radius) {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);
      return new THREE.Vector3(
        -radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta)
      );
    }

    function getRealTimeSunPosition() {
      const now = new Date();
      const utcHours = now.getUTCHours() + now.getUTCMinutes() / 60 + now.getUTCSeconds() / 3600;
      const sunLongitude = (12 - utcHours) * 15;
      const sunLongitudeRad = sunLongitude * Math.PI / 180;
      const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
      const solarDeclination = 23.45 * Math.sin((2 * Math.PI / 365) * (dayOfYear - 81));
      const solarDeclinationRad = solarDeclination * Math.PI / 180;
      const sunX = Math.cos(solarDeclinationRad) * Math.sin(sunLongitudeRad);
      const sunY = Math.sin(solarDeclinationRad);
      const sunZ = Math.cos(solarDeclinationRad) * Math.cos(sunLongitudeRad);
      return new THREE.Vector3(sunX, sunY, sunZ).multiplyScalar(10);
    }

    function setupEventListeners() {
      const c = renderer.domElement;
      c.addEventListener('touchstart', onTouchStart, { passive: false });
      c.addEventListener('touchmove', onTouchMove, { passive: false });
      c.addEventListener('touchend', onTouchEnd, { passive: false });
      c.addEventListener('mousedown', onMouseDown);
      c.addEventListener('mousemove', onMouseMove);
      c.addEventListener('mouseup', onMouseUp);
      window.addEventListener('resize', onResize);
    }

    function onTouchStart(e) {
      e.preventDefault();
      autoRotate = false;

      if (e.touches.length === 2) {
        isPinching = true;
        isDragging = false;
        lastPinchDistance = getPinchDistance(e.touches);
      } else if (e.touches.length === 1) {
        isDragging = true;
        isPinching = false;
        touchStartTime = Date.now();
        touchStartPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        previousTouch = { ...touchStartPos };
      }
    }

    function onTouchMove(e) {
      e.preventDefault();

      if (e.touches.length === 2 && isPinching) {
        const currentDistance = getPinchDistance(e.touches);
        const delta = currentDistance - lastPinchDistance;
        cameraDistance -= delta * 0.01;
        cameraDistance = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, cameraDistance));
        camera.position.z = cameraDistance;
        lastPinchDistance = currentDistance;
      } else if (isDragging && e.touches.length === 1 && previousTouch) {
        const dx = e.touches[0].clientX - previousTouch.x;
        const dy = e.touches[0].clientY - previousTouch.y;
        rotateGlobe(dx, dy);
        previousTouch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        rotationVelocity = { x: dx * 0.0002, y: dy * 0.0001 };
      }
    }

    function onTouchEnd(e) {
      if (e.touches.length < 2) isPinching = false;

      if (e.touches.length === 0) {
        const duration = Date.now() - touchStartTime;
        const touch = e.changedTouches[0];
        const dist = touchStartPos ? Math.hypot(touch.clientX - touchStartPos.x, touch.clientY - touchStartPos.y) : 999;

        isDragging = false;
        previousTouch = null;

        if (duration < 350 && dist < 25 && !isPinching) {
          checkMarkerClick(touch.clientX, touch.clientY);
        }

        setTimeout(() => { if (!isDragging && !isPinching) autoRotate = true; }, 3000);
      }
    }

    function getPinchDistance(touches) {
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      return Math.hypot(dx, dy);
    }

    function onMouseDown(e) {
      isDragging = true;
      autoRotate = false;
      touchStartTime = Date.now();
      touchStartPos = { x: e.clientX, y: e.clientY };
      previousTouch = { ...touchStartPos };
    }

    function onMouseMove(e) {
      // Update tooltip for hover
      updateTooltip(e.clientX, e.clientY);

      if (isDragging && previousTouch) {
        const dx = e.clientX - previousTouch.x;
        const dy = e.clientY - previousTouch.y;
        rotateGlobe(dx, dy);
        previousTouch = { x: e.clientX, y: e.clientY };
        rotationVelocity = { x: dx * 0.0002, y: 0 };
      }
    }

    function onMouseUp(e) {
      const duration = Date.now() - touchStartTime;
      const dist = touchStartPos ? Math.hypot(e.clientX - touchStartPos.x, e.clientY - touchStartPos.y) : 999;

      isDragging = false;
      previousTouch = null;

      if (duration < 350 && dist < 20) {
        checkMarkerClick(e.clientX, e.clientY);
      }

      setTimeout(() => { if (!isDragging) autoRotate = true; }, 3000);
    }

    function rotateGlobe(dx, dy) {
      if (globe) {
        globe.rotation.y += dx * 0.005;
        globe.rotation.x += dy * 0.005;
        globe.rotation.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, globe.rotation.x));
      }
    }

    function checkMarkerClick(clientX, clientY) {
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2(
        (clientX / window.innerWidth) * 2 - 1,
        -(clientY / window.innerHeight) * 2 + 1
      );
      raycaster.setFromCamera(mouse, camera);

      const targets = [];
      if (markersGroup) {
        markersGroup.children.forEach(g => {
          g.children.forEach(c => {
            if (c.userData && c.userData.projectId) targets.push(c);
          });
        });
      }

      const hits = raycaster.intersectObjects(targets, false);
      if (hits.length > 0) {
        const id = hits[0].object.userData.projectId;
        selectedProjectId = id;
        createMarkers();
        window.parent.postMessage({ type: 'projectSelect', projectId: id }, '*');
      }
    }

    function updateTooltip(clientX, clientY) {
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2(
        (clientX / window.innerWidth) * 2 - 1,
        -(clientY / window.innerHeight) * 2 + 1
      );
      raycaster.setFromCamera(mouse, camera);

      const targets = [];
      if (markersGroup) {
        markersGroup.children.forEach(g => {
          g.children.forEach(c => {
            if (c.userData && c.userData.project) targets.push(c);
          });
        });
      }

      const hits = raycaster.intersectObjects(targets, false);

      if (hits.length > 0) {
        const project = hits[0].object.userData.project;
        const category = categoriesData[project.type];

        tooltip.innerHTML = \`
          <div class="tooltip-name">\${project.name}</div>
          <div class="tooltip-location">\${project.location || ''}</div>
          <div class="tooltip-category" style="background:\${category?.color || '#10b981'}20;color:\${category?.color || '#10b981'}">
            \${category?.name || project.type}
          </div>
        \`;
        tooltip.style.left = (clientX + 15) + 'px';
        tooltip.style.top = (clientY - 10) + 'px';
        tooltip.classList.add('visible');
      } else {
        tooltip.classList.remove('visible');
      }
    }

    function onResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function animate() {
      requestAnimationFrame(animate);
      const time = Date.now() * 0.001;

      const realSunPos = getRealTimeSunPosition();
      if (sunLight) sunLight.position.copy(realSunPos);

      if (globe) {
        if (autoRotate) {
          globe.rotation.y += 0.0004;
        } else {
          globe.rotation.y += rotationVelocity.x;
          rotationVelocity.x *= 0.95;
        }

        const sunDir = realSunPos.clone().normalize();
        sunDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), -globe.rotation.y);

        if (globe.material && globe.material.uniforms && globe.material.uniforms.sunDirection) {
          globe.material.uniforms.sunDirection.value.copy(sunDir);
        }

        if (nightGlobe && nightGlobe.material && nightGlobe.material.uniforms) {
          nightGlobe.rotation.copy(globe.rotation);
          nightGlobe.material.uniforms.sunDirection.value.copy(sunDir);
        }

        if (clouds) {
          clouds.rotation.y = globe.rotation.y + time * 0.00003;
          clouds.rotation.x = globe.rotation.x;
        }

        if (markersGroup) {
          markersGroup.rotation.copy(globe.rotation);
        }
      }

      // Animate markers
      if (markersGroup) {
        markersGroup.children.forEach((g, i) => {
          g.children.forEach(c => {
            if (c.userData.isGlow) {
              const pulse = 1 + Math.sin(time * 2.5 + i) * 0.3;
              c.scale.set(pulse, pulse, pulse);
            }
            if (c.userData.isRing) {
              c.rotateZ(c.userData.speed);
            }
          });
        });
      }

      renderer.render(scene, camera);
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  </script>
</body>
</html>
    `;
  }

  destroy() {
    window.removeEventListener('message', this.handleMessage);
    if (this.iframe) {
      this.iframe.remove();
    }
  }
}

// Export for use
if (typeof window !== 'undefined') {
  window.TransitionGlobe = TransitionGlobe;
}
