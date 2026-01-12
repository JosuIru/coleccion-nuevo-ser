/**
 * Globe3D.js
 * Globo terráqueo 3D con textura realista, luces nocturnas y ciclo día/noche
 * Geolocalización automática de crisis
 * Marcadores de crisis 3D interactivos
 */

import React, { useRef, useCallback, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

const Globe3D = ({
  crises = [],
  onCrisisSelect,
  selectedCrisis,
  deployedBeings = [],
  style
}) => {
  const webViewRef = useRef(null);

  const crisesJson = useMemo(() => JSON.stringify(crises.map(c => ({
    id: c.id,
    lat: c.lat,
    lon: c.lon,
    urgency: c.urgency,
    type: c.type,
    title: c.title || 'Crisis',
    location: c.location || '',
    typeIcon: c.typeIcon || '!'
  }))), [crises]);

  // Procesar seres desplegados con coordenadas de su crisis asignada
  const deployedBeingsJson = useMemo(() => {
    return JSON.stringify(deployedBeings.map(being => {
      // Encontrar la crisis donde está desplegado
      const crisis = crises.find(c => c.id === being.currentMission);
      return {
        id: being.id,
        name: being.name || 'Ser',
        emoji: being.avatar || '🧬', // Usar avatar (estándar) pero mapear a emoji para el HTML
        crisisId: being.currentMission,
        lat: crisis?.lat || 0,
        lon: crisis?.lon || 0,
        location: crisis?.location || ''
      };
    }).filter(b => b.lat !== 0 || b.lon !== 0));
  }, [deployedBeings, crises]);

  const selectedId = selectedCrisis?.id || '';

  const globeHTML = useMemo(() => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: #000; touch-action: none; }
    canvas { display: block; }
    #loading { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: #60a5fa; font-size: 14px; text-align: center; font-family: system-ui; z-index: 10; }
    .spinner { width: 40px; height: 40px; border: 3px solid rgba(96,165,250,0.3); border-top-color: #60a5fa; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 10px; }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Botones de Zoom */
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
      background: rgba(30, 58, 138, 0.85);
      color: #60a5fa;
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
      background: rgba(59, 130, 246, 0.9);
    }
    .zoom-btn:hover {
      background: rgba(59, 130, 246, 0.9);
    }
  </style>
</head>
<body>
  <div id="loading"><div class="spinner"></div>Cargando globo...</div>

  <!-- Controles de Zoom -->
  <div id="zoom-controls">
    <button class="zoom-btn" id="zoom-in" onclick="zoomIn()">+</button>
    <button class="zoom-btn" id="zoom-out" onclick="zoomOut()">−</button>
  </div>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
  <script>
    // Texturas de la Tierra
    const TEXTURES = {
      earth: 'https://unpkg.com/three-globe@2.24.13/example/img/earth-blue-marble.jpg',
      night: 'https://unpkg.com/three-globe@2.24.13/example/img/earth-night.jpg',
      clouds: 'https://unpkg.com/three-globe@2.24.13/example/img/earth-clouds.png',
      bump: 'https://unpkg.com/three-globe@2.24.13/example/img/earth-topology.png'
    };

    // Base de datos de geolocalización automática
    const LOCATION_DATABASE = {
      // Países
      'afghanistan': [33.93, 67.71], 'albania': [41.15, 20.17], 'algeria': [28.03, 1.66],
      'argentina': [-38.42, -63.62], 'australia': [-25.27, 133.78], 'austria': [47.52, 14.55],
      'bangladesh': [23.68, 90.36], 'belgium': [50.50, 4.47], 'bolivia': [-16.29, -63.59],
      'brazil': [-14.24, -51.93], 'canada': [56.13, -106.35], 'chile': [-35.68, -71.54],
      'china': [35.86, 104.20], 'colombia': [4.57, -74.30], 'congo': [-4.04, 21.76],
      'cuba': [21.52, -77.78], 'egypt': [26.82, 30.80], 'ethiopia': [9.15, 40.49],
      'france': [46.23, 2.21], 'germany': [51.17, 10.45], 'ghana': [7.95, -1.02],
      'greece': [39.07, 21.82], 'haiti': [18.97, -72.29], 'india': [20.59, 78.96],
      'indonesia': [-0.79, 113.92], 'iran': [32.43, 53.69], 'iraq': [33.22, 43.68],
      'ireland': [53.41, -8.24], 'israel': [31.05, 34.85], 'italy': [41.87, 12.57],
      'japan': [36.20, 138.25], 'kenya': [-0.02, 37.91], 'korea': [35.91, 127.77],
      'libya': [26.34, 17.23], 'malaysia': [4.21, 101.98], 'mexico': [23.63, -102.55],
      'morocco': [31.79, -7.09], 'myanmar': [21.91, 95.96], 'nepal': [28.39, 84.12],
      'netherlands': [52.13, 5.29], 'new zealand': [-40.90, 174.89], 'nigeria': [9.08, 8.68],
      'norway': [60.47, 8.47], 'pakistan': [30.38, 69.35], 'palestine': [31.95, 35.23],
      'peru': [-9.19, -75.02], 'philippines': [12.88, 121.77], 'poland': [51.92, 19.15],
      'portugal': [39.40, -8.22], 'russia': [61.52, 105.32], 'saudi arabia': [23.89, 45.08],
      'somalia': [5.15, 46.20], 'south africa': [-30.56, 22.94], 'spain': [40.46, -3.75],
      'sudan': [12.86, 30.22], 'sweden': [60.13, 18.64], 'switzerland': [46.82, 8.23],
      'syria': [34.80, 38.99], 'taiwan': [23.70, 121.00], 'thailand': [15.87, 100.99],
      'turkey': [38.96, 35.24], 'ukraine': [48.38, 31.17], 'uk': [55.38, -3.44],
      'united kingdom': [55.38, -3.44], 'usa': [37.09, -95.71], 'united states': [37.09, -95.71],
      'venezuela': [6.42, -66.59], 'vietnam': [14.06, 108.28], 'yemen': [15.55, 48.52],
      'zimbabwe': [-19.02, 29.15],

      // Ciudades principales
      'new york': [40.71, -74.01], 'los angeles': [34.05, -118.24], 'london': [51.51, -0.13],
      'paris': [48.86, 2.35], 'tokyo': [35.68, 139.65], 'beijing': [39.90, 116.41],
      'moscow': [55.76, 37.62], 'dubai': [25.20, 55.27], 'sydney': [-33.87, 151.21],
      'rio de janeiro': [-22.91, -43.17], 'mumbai': [19.08, 72.88], 'cairo': [30.04, 31.24],
      'buenos aires': [-34.60, -58.38], 'istanbul': [41.01, 28.98], 'lagos': [6.52, 3.38],
      'singapore': [1.35, 103.82], 'hong kong': [22.32, 114.17], 'bangkok': [13.76, 100.50],
      'madrid': [40.42, -3.70], 'berlin': [52.52, 13.41], 'rome': [41.90, 12.50],
      'amsterdam': [52.37, 4.90], 'seoul': [37.57, 126.98], 'delhi': [28.61, 77.21],
      'jakarta': [-6.21, 106.85], 'manila': [14.60, 120.98], 'nairobi': [-1.29, 36.82],
      'johannesburg': [-26.20, 28.05], 'lima': [-12.05, -77.04], 'bogota': [4.71, -74.07],
      'santiago': [-33.45, -70.67], 'caracas': [10.48, -66.90], 'havana': [23.11, -82.37],

      // Regiones
      'amazon': [-3.47, -62.22], 'sahara': [23.42, 12.52], 'himalayas': [28.60, 83.93],
      'siberia': [60.00, 100.00], 'caribbean': [15.00, -75.00], 'mediterranean': [35.00, 18.00],
      'pacific': [0.00, -160.00], 'atlantic': [30.00, -45.00], 'arctic': [90.00, 0.00],
      'antarctic': [-90.00, 0.00], 'middle east': [29.00, 47.00], 'southeast asia': [10.00, 106.00],
      'central america': [15.00, -90.00], 'west africa': [12.00, -5.00], 'east africa': [0.00, 38.00],
      'north africa': [28.00, 10.00], 'southern africa': [-25.00, 25.00]
    };

    // Función para geolocalizar automáticamente
    function autoGeolocate(crisis) {
      if (crisis.lat !== undefined && crisis.lon !== undefined &&
          crisis.lat !== 0 && crisis.lon !== 0) {
        return { lat: crisis.lat, lon: crisis.lon };
      }

      if (crisis.location) {
        const locationLower = crisis.location.toLowerCase();

        // Buscar coincidencia exacta
        if (LOCATION_DATABASE[locationLower]) {
          const [lat, lon] = LOCATION_DATABASE[locationLower];
          return { lat, lon };
        }

        // Buscar coincidencia parcial
        for (const [key, coords] of Object.entries(LOCATION_DATABASE)) {
          if (locationLower.includes(key) || key.includes(locationLower)) {
            return { lat: coords[0], lon: coords[1] };
          }
        }
      }

      // Coordenadas por defecto si no se encuentra
      return { lat: crisis.lat || 0, lon: crisis.lon || 0 };
    }

    let scene, camera, renderer, globe, nightGlobe, clouds, atmosphere, sunLight;
    let markersGroup;
    let beingsGroup;
    let isDragging = false, previousTouch = null, touchStartTime = 0, touchStartPos = null;
    let rotationVelocity = { x: 0, y: 0 };
    let autoRotate = true;
    let texturesLoaded = 0;
    let requiredTextures = 2;
    let crisisData = ${crisesJson};
    let selectedCrisisId = "${selectedId}";
    let deployedBeingsData = ${deployedBeingsJson};

    // Variables para zoom con pellizco
    let isPinching = false;
    let lastPinchDistance = 0;
    let cameraDistance = 2.5;
    const MIN_ZOOM = 1.5;
    const MAX_ZOOM = 5.0;
    const ZOOM_STEP = 0.35; // Cantidad de zoom por click de botón

    // Funciones de zoom para botones
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

    const textureLoader = new THREE.TextureLoader();
    textureLoader.crossOrigin = 'anonymous';

    function init() {
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.z = 2.5;

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(0x000510, 1);
      document.body.appendChild(renderer.domElement);

      createStarfield();
      setupLights();
      loadTextures();
      setupEventListeners();
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

    function loadTextures() {
      // Load day Earth texture
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

      // Intentar cargar textura nocturna real, fallback a procedural
      textureLoader.load(TEXTURES.night,
        (texture) => {
          console.log('[Globe] Textura nocturna CDN cargada');
          createNightGlobeWithTexture(texture);
          onTextureLoaded();
        },
        undefined,
        () => {
          console.log('[Globe] Usando luces nocturnas procedurales');
          createNightGlobe(null);
          onTextureLoaded();
        }
      );

      // Load clouds (optional)
      textureLoader.load(TEXTURES.clouds,
        (texture) => createClouds(texture),
        undefined,
        () => {}
      );
    }

    // Globo nocturno con textura real del CDN
    function createNightGlobeWithTexture(nightTexture) {
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
            // Luces visibles SOLO en el lado nocturno
            float nightVisibility = smoothstep(0.1, -0.2, sunIntensity);
            vec4 nightColor = texture2D(nightTexture, vUv);
            // Intensidad moderada de las luces
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

    function onTextureLoaded() {
      texturesLoaded++;
      if (texturesLoaded >= requiredTextures) {
        createAtmosphere();
        createMarkers();
        createBeingMarkers();
        document.getElementById('loading').style.display = 'none';
        animate();
      }
    }

    function createDayGlobe(texture) {
      const geometry = new THREE.SphereGeometry(1, 64, 64);

      // Shader personalizado que OSCURECE el lado nocturno
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

            // Calcular iluminación solar
            float sunLight = dot(normal, normalize(sunDirection));

            // Lado diurno: bien iluminado
            // Lado nocturno: oscuro pero visible
            float brightness = smoothstep(-0.15, 0.35, sunLight);
            brightness = mix(0.18, 1.0, brightness); // Noche = 18% brillo, Día = 100%

            // Tinte azulado suave para la noche
            vec3 nightTint = vec3(0.15, 0.2, 0.35);
            vec3 finalColor = mix(dayColor.rgb * nightTint, dayColor.rgb, brightness);

            gl_FragColor = vec4(finalColor, 1.0);
          }
        \`
      });

      globe = new THREE.Mesh(geometry, material);
      globe.material.uniforms.sunDirection.value = new THREE.Vector3(1, 0, 0);
      scene.add(globe);
    }

    function createNightGlobe(externalTexture) {
      // Crear textura procedural de luces de ciudades
      const canvas = document.createElement('canvas');
      canvas.width = 2048;
      canvas.height = 1024;
      const ctx = canvas.getContext('2d');

      // Fondo transparente
      ctx.fillStyle = 'rgba(0,0,0,0)';
      ctx.fillRect(0, 0, 2048, 1024);

      // Ciudades principales del mundo con sus coordenadas [lat, lon, tamaño]
      const cities = [
        // América del Norte
        [40.71, -74.01, 12], // Nueva York
        [34.05, -118.24, 10], // Los Angeles
        [41.88, -87.63, 8], // Chicago
        [29.76, -95.37, 7], // Houston
        [33.45, -112.07, 6], // Phoenix
        [37.77, -122.42, 8], // San Francisco
        [47.61, -122.33, 6], // Seattle
        [25.76, -80.19, 7], // Miami
        [43.65, -79.38, 7], // Toronto
        [19.43, -99.13, 11], // Ciudad de México
        // Europa
        [51.51, -0.13, 12], // Londres
        [48.86, 2.35, 11], // París
        [52.52, 13.41, 9], // Berlín
        [41.90, 12.50, 8], // Roma
        [40.42, -3.70, 9], // Madrid
        [55.76, 37.62, 10], // Moscú
        [59.33, 18.07, 6], // Estocolmo
        [52.37, 4.90, 7], // Ámsterdam
        [50.85, 4.35, 6], // Bruselas
        [48.21, 16.37, 6], // Viena
        // Asia
        [35.68, 139.65, 14], // Tokio
        [31.23, 121.47, 13], // Shanghái
        [39.90, 116.41, 12], // Pekín
        [22.32, 114.17, 10], // Hong Kong
        [37.57, 126.98, 11], // Seúl
        [1.35, 103.82, 9], // Singapur
        [13.76, 100.50, 9], // Bangkok
        [28.61, 77.21, 11], // Delhi
        [19.08, 72.88, 12], // Mumbai
        [23.81, 90.41, 9], // Dhaka
        [35.69, 51.39, 8], // Teherán
        [25.20, 55.27, 8], // Dubái
        [31.95, 35.23, 6], // Jerusalén
        // África
        [30.04, 31.24, 9], // El Cairo
        [6.52, 3.38, 8], // Lagos
        [-33.92, 18.42, 6], // Ciudad del Cabo
        [-1.29, 36.82, 6], // Nairobi
        [33.59, -7.62, 6], // Casablanca
        // Sudamérica
        [-23.55, -46.63, 12], // São Paulo
        [-22.91, -43.17, 10], // Río de Janeiro
        [-34.60, -58.38, 9], // Buenos Aires
        [-33.45, -70.67, 7], // Santiago
        [4.71, -74.07, 7], // Bogotá
        [-12.05, -77.04, 7], // Lima
        [10.48, -66.90, 6], // Caracas
        // Oceanía
        [-33.87, 151.21, 8], // Sídney
        [-37.81, 144.96, 7], // Melbourne
        [-36.85, 174.76, 5], // Auckland
      ];

      // Dibujar cada ciudad como un punto brillante (tamaño reducido)
      cities.forEach(([lat, lon, size]) => {
        const x = ((lon + 180) / 360) * 2048;
        const y = ((90 - lat) / 180) * 1024;

        // Gradiente más sutil para la ciudad
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, size * 1.8);
        gradient.addColorStop(0, 'rgba(255, 230, 150, 0.9)');
        gradient.addColorStop(0.4, 'rgba(255, 200, 100, 0.5)');
        gradient.addColorStop(0.7, 'rgba(255, 170, 70, 0.2)');
        gradient.addColorStop(1, 'rgba(255, 150, 50, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, size * 1.8, 0, Math.PI * 2);
        ctx.fill();

        // Núcleo brillante más pequeño
        ctx.fillStyle = 'rgba(255, 250, 220, 0.9)';
        ctx.beginPath();
        ctx.arc(x, y, size * 0.35, 0, Math.PI * 2);
        ctx.fill();
      });

      const nightTexture = new THREE.CanvasTexture(canvas);

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
            // Luces visibles SOLO en el lado nocturno
            float nightVisibility = smoothstep(0.1, -0.2, sunIntensity);
            vec4 nightColor = texture2D(nightTexture, vUv);
            // Color cálido moderado (reducido de 2.0 a 1.2)
            vec3 lightColor = nightColor.rgb * 1.2;
            float alpha = nightVisibility * nightColor.a * 0.85;
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
      ctx.beginPath();
      ctx.ellipse(230, 320, 40, 70, 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(520, 200, 50, 100, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(720, 150, 120, 70, 0, 0, Math.PI * 2);
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
            gl_FragColor = vec4(0.3, 0.6, 1.0, intensity * 0.4);
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

      crisisData.forEach((crisis, i) => {
        // Auto-geolocalizar si es necesario
        const coords = autoGeolocate(crisis);
        crisis.lat = coords.lat;
        crisis.lon = coords.lon;

        if (crisis.lat !== 0 || crisis.lon !== 0) {
          const marker = createCrisisMarker(crisis, i);
          markersGroup.add(marker);
        }
      });

      scene.add(markersGroup);
    }

    function createCrisisMarker(crisis, index) {
      const group = new THREE.Group();

      let color, glowColor;
      if (crisis.urgency >= 8) { color = 0xef4444; glowColor = 0xff6b6b; }
      else if (crisis.urgency >= 6) { color = 0xf97316; glowColor = 0xffa94d; }
      else if (crisis.urgency >= 4) { color = 0xeab308; glowColor = 0xffd43b; }
      else { color = 0x22c55e; glowColor = 0x69db7c; }

      const isSelected = crisis.id === selectedCrisisId;
      const size = 0.022 + (crisis.urgency * 0.003);

      // Pin base
      const basePos = latLonToVector3(crisis.lat, crisis.lon, 1.01);

      // Pin stem
      const stemGeo = new THREE.CylinderGeometry(0.002, 0.002, 0.035, 8);
      const stemMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const stem = new THREE.Mesh(stemGeo, stemMat);
      stem.position.copy(basePos);
      stem.lookAt(0, 0, 0);
      stem.rotateX(Math.PI / 2);
      group.add(stem);

      // Pin head
      const headPos = latLonToVector3(crisis.lat, crisis.lon, 1.05);
      const sphereGeo = new THREE.SphereGeometry(size, 16, 16);
      const sphereMat = new THREE.MeshPhongMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: isSelected ? 0.9 : 0.5,
        shininess: 100
      });
      const sphere = new THREE.Mesh(sphereGeo, sphereMat);
      sphere.position.copy(headPos);
      sphere.userData = { crisisId: crisis.id, crisis: crisis };
      group.add(sphere);

      // Glow
      const glowGeo = new THREE.SphereGeometry(size * 2.2, 16, 16);
      const glowMat = new THREE.MeshBasicMaterial({
        color: glowColor,
        transparent: true,
        opacity: isSelected ? 0.45 : 0.18
      });
      const glow = new THREE.Mesh(glowGeo, glowMat);
      glow.position.copy(headPos);
      glow.userData = { isGlow: true };
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

      group.userData = { crisisId: crisis.id };
      return group;
    }

    // ========== MARCADORES DE SERES DESPLEGADOS ==========
    function createBeingMarkers() {
      if (beingsGroup) scene.remove(beingsGroup);
      beingsGroup = new THREE.Group();

      deployedBeingsData.forEach((being, i) => {
        // Auto-geolocalizar si es necesario
        const coords = autoGeolocate(being);
        being.lat = coords.lat;
        being.lon = coords.lon;

        if (being.lat !== 0 || being.lon !== 0) {
          const marker = createBeingMarker(being, i);
          beingsGroup.add(marker);
        }
      });

      scene.add(beingsGroup);
    }

    function createBeingMarker(being, index) {
      const group = new THREE.Group();

      // Colores para seres: cian/turquesa brillante
      const color = 0x06b6d4; // cyan-500
      const glowColor = 0x22d3ee; // cyan-400

      // Posición ligeramente desplazada de la crisis (más alto)
      const beingPos = latLonToVector3(being.lat, being.lon, 1.12);

      // Marcador principal del ser (forma de diamante/cristal)
      const size = 0.018;

      // Crear geometría de octaedro (cristal)
      const crystalGeo = new THREE.OctahedronGeometry(size, 0);
      const crystalMat = new THREE.MeshPhongMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 0.8,
        shininess: 150,
        transparent: true,
        opacity: 0.95
      });
      const crystal = new THREE.Mesh(crystalGeo, crystalMat);
      crystal.position.copy(beingPos);
      crystal.userData = { beingId: being.id, being: being, isBeing: true };
      group.add(crystal);

      // Aura brillante alrededor
      const auraGeo = new THREE.SphereGeometry(size * 2.5, 16, 16);
      const auraMat = new THREE.MeshBasicMaterial({
        color: glowColor,
        transparent: true,
        opacity: 0.25
      });
      const aura = new THREE.Mesh(auraGeo, auraMat);
      aura.position.copy(beingPos);
      aura.userData = { isBeingAura: true };
      group.add(aura);

      // Anillo orbital giratorio
      const ringGeo = new THREE.TorusGeometry(size * 1.8, size * 0.15, 8, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.6
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.copy(beingPos);
      ring.rotation.x = Math.PI / 2;
      ring.userData = { isBeingRing: true, orbitSpeed: 0.03 + (index * 0.005) };
      group.add(ring);

      // Línea de conexión a la superficie (rayo de energía)
      const linePoints = [
        beingPos.clone(),
        latLonToVector3(being.lat, being.lon, 1.01)
      ];
      const lineGeo = new THREE.BufferGeometry().setFromPoints(linePoints);
      const lineMat = new THREE.LineBasicMaterial({
        color: glowColor,
        transparent: true,
        opacity: 0.4
      });
      const line = new THREE.Line(lineGeo, lineMat);
      line.userData = { isBeingLine: true };
      group.add(line);

      // Partículas de energía subiendo (efecto visual)
      for (let p = 0; p < 3; p++) {
        const particleGeo = new THREE.SphereGeometry(size * 0.2, 8, 8);
        const particleMat = new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.7
        });
        const particle = new THREE.Mesh(particleGeo, particleMat);
        particle.position.copy(latLonToVector3(being.lat, being.lon, 1.04 + p * 0.025));
        particle.userData = {
          isBeingParticle: true,
          baseHeight: 1.04 + p * 0.025,
          speed: 0.002 + Math.random() * 0.002,
          offset: p * 0.3
        };
        group.add(particle);
      }

      group.userData = { beingId: being.id };
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

    function setupLights() {
      // Luz ambiente MUY BAJA para que el lado nocturno sea oscuro
      scene.add(new THREE.AmbientLight(0x111122, 0.15));

      // Luz solar fuerte para el lado diurno
      sunLight = new THREE.DirectionalLight(0xffffff, 2.2);
      scene.add(sunLight);

      // Luz de relleno muy tenue
      const fill = new THREE.DirectionalLight(0x334466, 0.05);
      fill.position.set(-5, 0, -5);
      scene.add(fill);
    }

    // Calcular posición del sol EN TIEMPO REAL basado en UTC
    function getRealTimeSunPosition() {
      const now = new Date();
      const utcHours = now.getUTCHours() + now.getUTCMinutes() / 60 + now.getUTCSeconds() / 3600;

      // El sol está sobre la longitud donde es mediodía
      // A las 12:00 UTC el sol está sobre longitud 0 (Greenwich)
      // La Tierra rota 15 grados por hora hacia el este
      const sunLongitude = (12 - utcHours) * 15; // grados
      const sunLongitudeRad = sunLongitude * Math.PI / 180;

      // Declinación solar (inclinación según época del año)
      const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
      const solarDeclination = 23.45 * Math.sin((2 * Math.PI / 365) * (dayOfYear - 81));
      const solarDeclinationRad = solarDeclination * Math.PI / 180;

      // Convertir a vector 3D (posición del sol)
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
        // Iniciar pellizco para zoom
        isPinching = true;
        isDragging = false;
        lastPinchDistance = getPinchDistance(e.touches);
      } else if (e.touches.length === 1) {
        // Un dedo - rotar
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
        // Zoom con pellizco
        const currentDistance = getPinchDistance(e.touches);
        const delta = currentDistance - lastPinchDistance;

        // Ajustar distancia de cámara
        cameraDistance -= delta * 0.01;
        cameraDistance = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, cameraDistance));
        camera.position.z = cameraDistance;

        lastPinchDistance = currentDistance;
      } else if (isDragging && e.touches.length === 1 && previousTouch) {
        // Rotar con un dedo
        const dx = e.touches[0].clientX - previousTouch.x;
        const dy = e.touches[0].clientY - previousTouch.y;
        rotateGlobe(dx, dy);
        previousTouch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        rotationVelocity = { x: dx * 0.0002, y: dy * 0.0001 };
      }
    }

    function onTouchEnd(e) {
      if (e.touches.length < 2) {
        isPinching = false;
      }

      if (e.touches.length === 0) {
        const duration = Date.now() - touchStartTime;
        const touch = e.changedTouches[0];
        const dist = touchStartPos ? Math.hypot(touch.clientX - touchStartPos.x, touch.clientY - touchStartPos.y) : 999;

        isDragging = false;
        previousTouch = null;

        if (duration < 250 && dist < 15 && !isPinching) {
          checkMarkerClick(touch.clientX, touch.clientY);
        }

        setTimeout(() => { if (!isDragging && !isPinching) autoRotate = true; }, 3000);
      }
    }

    // Calcular distancia entre dos dedos
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

      if (duration < 250 && dist < 10) {
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
            if (c.userData && c.userData.crisisId) targets.push(c);
          });
        });
      }

      const hits = raycaster.intersectObjects(targets, false);
      if (hits.length > 0) {
        const id = hits[0].object.userData.crisisId;
        window.ReactNativeWebView?.postMessage(JSON.stringify({ type: 'crisisSelect', crisisId: id }));
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

      // Actualizar posición del sol EN TIEMPO REAL
      const realSunPos = getRealTimeSunPosition();
      if (sunLight) {
        sunLight.position.copy(realSunPos);
      }

      if (globe) {
        if (autoRotate) {
          globe.rotation.y += 0.0004;
        } else {
          globe.rotation.y += rotationVelocity.x;
          rotationVelocity.x *= 0.95;
        }

        // Dirección del sol en tiempo real (normalizada)
        const sunDir = realSunPos.clone().normalize();
        // Aplicar rotación del globo para mantener sincronización
        sunDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), -globe.rotation.y);

        // Actualizar shader del globo de DÍA con posición solar
        if (globe.material && globe.material.uniforms && globe.material.uniforms.sunDirection) {
          globe.material.uniforms.sunDirection.value.copy(sunDir);
        }

        // Sync night globe con posición solar REAL
        if (nightGlobe && nightGlobe.material && nightGlobe.material.uniforms) {
          nightGlobe.rotation.copy(globe.rotation);
          nightGlobe.material.uniforms.sunDirection.value.copy(sunDir);
        }

        // Sync clouds
        if (clouds) {
          clouds.rotation.y = globe.rotation.y + time * 0.00003;
          clouds.rotation.x = globe.rotation.x;
        }

        // Sync markers
        if (markersGroup) {
          markersGroup.rotation.copy(globe.rotation);
        }

        // Sync beings markers
        if (beingsGroup) {
          beingsGroup.rotation.copy(globe.rotation);
        }
      }

      // Animate crisis markers
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

      // Animate being markers
      if (beingsGroup) {
        beingsGroup.children.forEach((g, i) => {
          g.children.forEach(c => {
            // Rotar cristal principal
            if (c.userData.isBeing) {
              c.rotation.y += 0.02;
              c.rotation.z = Math.sin(time * 2 + i) * 0.2;
            }
            // Pulso del aura
            if (c.userData.isBeingAura) {
              const pulse = 1 + Math.sin(time * 3 + i * 0.5) * 0.3;
              c.scale.set(pulse, pulse, pulse);
              c.material.opacity = 0.15 + Math.sin(time * 2 + i) * 0.1;
            }
            // Rotar anillo orbital
            if (c.userData.isBeingRing) {
              c.rotation.z += c.userData.orbitSpeed;
              c.rotation.x = Math.PI / 2 + Math.sin(time + i) * 0.3;
            }
            // Animar partículas subiendo
            if (c.userData.isBeingParticle) {
              const heightCycle = (time * c.userData.speed + c.userData.offset) % 0.12;
              const newHeight = c.userData.baseHeight + heightCycle;
              const pos = c.position.clone().normalize().multiplyScalar(newHeight);
              c.position.copy(pos);
              c.material.opacity = 0.7 - (heightCycle / 0.12) * 0.5;
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
  `, [crisesJson, selectedId, deployedBeingsJson]);

  const handleMessage = useCallback((event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'crisisSelect' && onCrisisSelect) {
        const crisis = crises.find(c => c.id === data.crisisId);
        if (crisis) onCrisisSelect(crisis);
      }
    } catch (e) {
      // WebView message parse error - non-critical
    }
  }, [crises, onCrisisSelect]);

  return (
    <View style={[styles.container, style]}>
      <WebView
        ref={webViewRef}
        source={{ html: globeHTML }}
        style={styles.webview}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        mixedContentMode="always"
        originWhitelist={['*']}
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
        androidLayerType="hardware"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', overflow: 'hidden', borderRadius: 12 },
  webview: { flex: 1, backgroundColor: 'transparent' }
});

export default Globe3D;
