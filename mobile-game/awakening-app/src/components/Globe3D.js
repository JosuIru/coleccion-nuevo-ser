/**
 * Globe3D.js
 * Globo terráqueo 3D interactivo mejorado usando Three.js en WebView
 * - Continentes detallados con coastlines realistas
 * - Marcadores de crisis con pins 3D y efectos de pulso
 * - Sistema de selección mejorado con tooltip y feedback visual
 */

import React, { useRef, useCallback, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

const Globe3D = ({
  crises = [],
  onCrisisSelect,
  selectedCrisis,
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
    typeIcon: c.typeIcon || '!'
  }))), [crises]);

  const selectedId = selectedCrisis?.id || '';

  const globeHTML = useMemo(() => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: transparent;
      touch-action: none;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    canvas { display: block; width: 100%; height: 100%; }
    #loading {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: #60a5fa;
      font-size: 14px;
      text-align: center;
    }
    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid rgba(96, 165, 250, 0.3);
      border-top-color: #60a5fa;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 10px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    #tooltip {
      position: absolute;
      display: none;
      background: rgba(15, 23, 42, 0.95);
      border: 1px solid rgba(59, 130, 246, 0.5);
      border-radius: 8px;
      padding: 8px 12px;
      color: #fff;
      font-size: 12px;
      max-width: 200px;
      pointer-events: none;
      z-index: 100;
      box-shadow: 0 4px 20px rgba(0,0,0,0.5);
    }
    #tooltip .title {
      font-weight: 600;
      margin-bottom: 4px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    #tooltip .urgency {
      font-size: 10px;
      opacity: 0.8;
    }
    #tooltip .icon {
      font-size: 16px;
    }

    #instructions {
      position: absolute;
      bottom: 10px;
      left: 50%;
      transform: translateX(-50%);
      color: rgba(255,255,255,0.5);
      font-size: 10px;
      text-align: center;
    }
  </style>
</head>
<body>
  <div id="loading">
    <div class="spinner"></div>
    Cargando globo...
  </div>
  <div id="tooltip">
    <div class="title"><span class="icon"></span><span class="text"></span></div>
    <div class="urgency"></div>
  </div>
  <div id="instructions">Toca y arrastra para rotar</div>

  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
  <script>
    let scene, camera, renderer, globe, atmosphere, clouds;
    let markersGroup, selectedMarkerGroup;
    let isDragging = false, previousTouch = null, touchStartTime = 0;
    let rotationVelocity = { x: 0, y: 0 };
    let autoRotate = true;
    let crisisData = ${crisesJson};
    let selectedCrisisId = "${selectedId}";
    let hoveredCrisis = null;

    // Datos de continentes más detallados (coordenadas simplificadas pero realistas)
    const continentPaths = {
      northAmerica: [
        [-168, 65], [-166, 60], [-141, 60], [-141, 70], [-156, 71], [-168, 65], // Alaska
        [-141, 60], [-130, 55], [-125, 48], [-124, 40], [-117, 32], [-105, 25],
        [-97, 25], [-97, 20], [-87, 20], [-82, 22], [-81, 25], [-80, 25],
        [-75, 35], [-70, 40], [-70, 43], [-67, 44], [-67, 47], [-60, 47],
        [-55, 50], [-55, 52], [-60, 55], [-65, 60], [-75, 62], [-80, 65],
        [-85, 68], [-95, 70], [-105, 72], [-120, 72], [-130, 70], [-141, 70]
      ],
      southAmerica: [
        [-80, 10], [-75, 10], [-70, 12], [-62, 10], [-60, 5], [-52, 5],
        [-35, -5], [-35, -10], [-38, -15], [-40, -22], [-48, -25], [-53, -33],
        [-58, -38], [-63, -40], [-65, -45], [-68, -50], [-72, -52], [-75, -50],
        [-73, -45], [-72, -40], [-70, -30], [-70, -20], [-75, -15], [-80, -5],
        [-78, 0], [-80, 5], [-77, 8], [-80, 10]
      ],
      europe: [
        [-10, 36], [-5, 36], [0, 38], [3, 42], [0, 43], [-2, 43], [-9, 43],
        [-9, 40], [-10, 36], // Iberia
        [3, 42], [5, 43], [8, 44], [12, 44], [14, 41], [18, 40], [16, 42],
        [13, 45], [14, 46], [10, 47], [7, 48], [2, 49], [-5, 48], [-5, 51],
        [-3, 54], [-6, 55], [-8, 55], [-10, 52], [-10, 51], [-5, 48],
        [2, 51], [5, 53], [8, 54], [12, 54], [14, 55], [10, 57], [12, 56],
        [18, 55], [22, 55], [24, 57], [28, 60], [30, 62], [28, 65], [25, 70],
        [20, 70], [18, 68], [15, 69], [10, 63], [5, 62], [5, 58], [10, 57]
      ],
      africa: [
        [-17, 15], [-15, 20], [-17, 25], [-13, 28], [-5, 35], [0, 35], [10, 37],
        [12, 33], [25, 32], [32, 31], [35, 30], [38, 28], [43, 12], [51, 12],
        [51, 3], [42, -2], [40, -10], [35, -20], [33, -25], [27, -33], [20, -35],
        [18, -30], [15, -25], [12, -17], [12, -5], [10, 5], [5, 5], [0, 5],
        [-5, 5], [-10, 8], [-15, 10], [-17, 15]
      ],
      asia: [
        [30, 62], [40, 65], [50, 67], [60, 68], [70, 72], [80, 73], [100, 75],
        [120, 73], [140, 72], [160, 68], [170, 65], [180, 65], [180, 60],
        [165, 60], [160, 55], [155, 50], [145, 45], [140, 43], [135, 35],
        [130, 33], [128, 37], [130, 40], [132, 43], [140, 45], [142, 46],
        [145, 50], [150, 55], [155, 58], [160, 60], [163, 62], [170, 62],
        [175, 58], [180, 55], [180, 45], [145, 42], [141, 39], [130, 30],
        [122, 25], [118, 22], [110, 20], [105, 10], [100, 5], [105, -8],
        [120, -8], [130, -3], [140, -5], [142, -10], [140, -15], [145, -20],
        [150, -25], [153, -28], [150, -35], [145, -38], [140, -38], [135, -35],
        [130, -32], [125, -33], [120, -35], [115, -34], [115, -22], [120, -18],
        [125, -15], [128, -15], [130, -12], [125, -8], [120, -5], [115, -5],
        [110, -8], [105, -6], [100, -1], [95, 5], [90, 20], [88, 22], [90, 25],
        [95, 28], [97, 28], [100, 22], [105, 22], [108, 20], [110, 18],
        [120, 22], [122, 28], [120, 32], [115, 35], [110, 38], [105, 40],
        [100, 40], [90, 45], [80, 42], [75, 35], [70, 25], [65, 25], [60, 28],
        [55, 25], [50, 28], [48, 30], [45, 32], [40, 35], [35, 35], [32, 35],
        [30, 40], [28, 42], [30, 45], [35, 48], [40, 50], [35, 55], [30, 60],
        [30, 62]
      ],
      australia: [
        [113, -22], [115, -20], [120, -18], [125, -15], [130, -12], [135, -12],
        [140, -15], [142, -12], [145, -15], [150, -22], [153, -25], [153, -28],
        [150, -35], [145, -38], [140, -38], [135, -35], [130, -32], [125, -33],
        [120, -35], [115, -34], [115, -30], [113, -26], [113, -22]
      ]
    };

    function init() {
      scene = new THREE.Scene();

      camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.z = 2.5;

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(0x000000, 0);
      document.body.appendChild(renderer.domElement);

      createGlobe();
      createAtmosphere();
      createClouds();
      createMarkers();
      setupLights();
      setupEventListeners();

      document.getElementById('loading').style.display = 'none';
      animate();
    }

    function createGlobe() {
      const geometry = new THREE.SphereGeometry(1, 96, 96);
      const canvas = document.createElement('canvas');
      canvas.width = 2048;
      canvas.height = 1024;
      const ctx = canvas.getContext('2d');

      // Gradiente oceánico
      const oceanGradient = ctx.createRadialGradient(1024, 512, 0, 1024, 512, 1200);
      oceanGradient.addColorStop(0, '#0a1628');
      oceanGradient.addColorStop(0.5, '#0d2847');
      oceanGradient.addColorStop(1, '#061220');
      ctx.fillStyle = oceanGradient;
      ctx.fillRect(0, 0, 2048, 1024);

      // Dibujar continentes con mejor detalle
      Object.values(continentPaths).forEach(path => {
        drawContinentPath(ctx, path);
      });

      // Grid sutil
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.08)';
      ctx.lineWidth = 1;
      for (let lon = -180; lon <= 180; lon += 30) {
        ctx.beginPath();
        const x = ((lon + 180) / 360) * 2048;
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 1024);
        ctx.stroke();
      }
      for (let lat = -90; lat <= 90; lat += 30) {
        ctx.beginPath();
        const y = ((90 - lat) / 180) * 1024;
        ctx.moveTo(0, y);
        ctx.lineTo(2048, y);
        ctx.stroke();
      }

      // Ecuador destacado
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.2)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 512);
      ctx.lineTo(2048, 512);
      ctx.stroke();

      const texture = new THREE.CanvasTexture(canvas);
      texture.anisotropy = renderer.capabilities.getMaxAnisotropy();

      const material = new THREE.MeshPhongMaterial({
        map: texture,
        specular: new THREE.Color(0x1a365d),
        shininess: 10,
        bumpScale: 0.02
      });

      globe = new THREE.Mesh(geometry, material);
      scene.add(globe);
    }

    function drawContinentPath(ctx, coords) {
      if (coords.length < 3) return;

      ctx.beginPath();
      const startX = ((coords[0][0] + 180) / 360) * 2048;
      const startY = ((90 - coords[0][1]) / 180) * 1024;
      ctx.moveTo(startX, startY);

      for (let i = 1; i < coords.length; i++) {
        const x = ((coords[i][0] + 180) / 360) * 2048;
        const y = ((90 - coords[i][1]) / 180) * 1024;
        ctx.lineTo(x, y);
      }
      ctx.closePath();

      // Gradiente para tierra
      const gradient = ctx.createLinearGradient(0, 0, 0, 1024);
      gradient.addColorStop(0, '#1e4d2b');
      gradient.addColorStop(0.3, '#1a5f3c');
      gradient.addColorStop(0.5, '#2d6a4f');
      gradient.addColorStop(0.7, '#40916c');
      gradient.addColorStop(1, '#1b4332');

      ctx.fillStyle = gradient;
      ctx.fill();

      // Borde costero brillante
      ctx.strokeStyle = '#52b788';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Borde interior más suave
      ctx.strokeStyle = 'rgba(82, 183, 136, 0.3)';
      ctx.lineWidth = 4;
      ctx.stroke();
    }

    function createAtmosphere() {
      const geometry = new THREE.SphereGeometry(1.08, 64, 64);
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
            float intensity = pow(0.65 - dot(vNormal, vec3(0, 0, 1.0)), 2.0);
            vec3 color = vec3(0.3, 0.6, 1.0);
            gl_FragColor = vec4(color, intensity * 0.6);
          }
        \`,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        transparent: true
      });
      atmosphere = new THREE.Mesh(geometry, material);
      scene.add(atmosphere);
    }

    function createClouds() {
      const geometry = new THREE.SphereGeometry(1.02, 64, 64);
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = 'rgba(0,0,0,0)';
      ctx.fillRect(0, 0, 1024, 512);

      // Nubes aleatorias sutiles
      for (let i = 0; i < 100; i++) {
        const x = Math.random() * 1024;
        const y = Math.random() * 512;
        const r = 20 + Math.random() * 60;
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
        gradient.addColorStop(0, 'rgba(255,255,255,0.08)');
        gradient.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      const texture = new THREE.CanvasTexture(canvas);
      const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 0.4
      });

      clouds = new THREE.Mesh(geometry, material);
      scene.add(clouds);
    }

    function createMarkers() {
      // Limpiar marcadores existentes
      if (markersGroup) scene.remove(markersGroup);
      if (selectedMarkerGroup) scene.remove(selectedMarkerGroup);

      markersGroup = new THREE.Group();
      selectedMarkerGroup = new THREE.Group();

      crisisData.forEach((crisis, index) => {
        const marker = createCrisisMarker(crisis, index);
        markersGroup.add(marker);

        if (crisis.id === selectedCrisisId) {
          const selectionEffect = createSelectionEffect(crisis);
          selectedMarkerGroup.add(selectionEffect);
        }
      });

      scene.add(markersGroup);
      scene.add(selectedMarkerGroup);
    }

    function createCrisisMarker(crisis, index) {
      const group = new THREE.Group();
      const pos = latLonToVector3(crisis.lat, crisis.lon, 1.01);

      // Color según urgencia
      let color, glowColor;
      if (crisis.urgency >= 8) {
        color = 0xef4444; glowColor = 0xff6b6b;
      } else if (crisis.urgency >= 6) {
        color = 0xf97316; glowColor = 0xffa94d;
      } else if (crisis.urgency >= 4) {
        color = 0xeab308; glowColor = 0xffd43b;
      } else {
        color = 0x22c55e; glowColor = 0x69db7c;
      }

      const isSelected = crisis.id === selectedCrisisId;
      const baseSize = 0.025 + (crisis.urgency * 0.004);
      const size = isSelected ? baseSize * 1.5 : baseSize;

      // Pin base (esfera)
      const sphereGeo = new THREE.SphereGeometry(size, 24, 24);
      const sphereMat = new THREE.MeshPhongMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: isSelected ? 0.8 : 0.4,
        shininess: 100
      });
      const sphere = new THREE.Mesh(sphereGeo, sphereMat);
      sphere.position.copy(pos);
      sphere.userData = { crisisId: crisis.id, crisis: crisis, index: index };
      group.add(sphere);

      // Pin spike (cono hacia afuera)
      const spikeHeight = size * 2;
      const spikeGeo = new THREE.ConeGeometry(size * 0.3, spikeHeight, 8);
      const spikeMat = new THREE.MeshPhongMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 0.3
      });
      const spike = new THREE.Mesh(spikeGeo, spikeMat);

      // Posicionar spike apuntando hacia afuera
      const spikePos = latLonToVector3(crisis.lat, crisis.lon, 1.01 + size + spikeHeight/2);
      spike.position.copy(spikePos);
      spike.lookAt(0, 0, 0);
      spike.rotateX(Math.PI / 2);
      group.add(spike);

      // Glow exterior
      const glowGeo = new THREE.SphereGeometry(size * 2.5, 16, 16);
      const glowMat = new THREE.MeshBasicMaterial({
        color: glowColor,
        transparent: true,
        opacity: isSelected ? 0.4 : 0.2
      });
      const glow = new THREE.Mesh(glowGeo, glowMat);
      glow.position.copy(pos);
      glow.userData = { isGlow: true, baseOpacity: isSelected ? 0.4 : 0.2 };
      group.add(glow);

      // Anillo pulsante
      const ringGeo = new THREE.RingGeometry(size * 1.5, size * 2, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: glowColor,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.copy(pos);
      ring.lookAt(0, 0, 0);
      ring.userData = { isRing: true, baseScale: 1 };
      group.add(ring);

      // Línea conectora al globo
      const lineGeo = new THREE.BufferGeometry().setFromPoints([
        latLonToVector3(crisis.lat, crisis.lon, 1.0),
        pos
      ]);
      const lineMat = new THREE.LineBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.6
      });
      const line = new THREE.Line(lineGeo, lineMat);
      group.add(line);

      group.userData = { crisisId: crisis.id, crisis: crisis };
      return group;
    }

    function createSelectionEffect(crisis) {
      const group = new THREE.Group();
      const pos = latLonToVector3(crisis.lat, crisis.lon, 1.01);
      const size = 0.025 + (crisis.urgency * 0.004);

      // Anillos de selección concéntricos
      for (let i = 0; i < 3; i++) {
        const ringGeo = new THREE.RingGeometry(size * (3 + i), size * (3.3 + i), 32);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.6 - (i * 0.15),
          side: THREE.DoubleSide
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.copy(pos);
        ring.lookAt(0, 0, 0);
        ring.userData = { rotationSpeed: 0.02 + (i * 0.01), direction: i % 2 === 0 ? 1 : -1 };
        group.add(ring);
      }

      // Partículas de energía
      const particleCount = 8;
      for (let i = 0; i < particleCount; i++) {
        const particleGeo = new THREE.SphereGeometry(size * 0.2, 8, 8);
        const particleMat = new THREE.MeshBasicMaterial({
          color: 0x60a5fa,
          transparent: true,
          opacity: 0.8
        });
        const particle = new THREE.Mesh(particleGeo, particleMat);
        particle.userData = {
          isParticle: true,
          angle: (i / particleCount) * Math.PI * 2,
          radius: size * 4,
          speed: 0.03
        };
        group.add(particle);
      }

      group.userData = { centerPos: pos };
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
      const ambientLight = new THREE.AmbientLight(0x404060, 0.6);
      scene.add(ambientLight);

      const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
      sunLight.position.set(5, 3, 5);
      scene.add(sunLight);

      const fillLight = new THREE.DirectionalLight(0x3b82f6, 0.4);
      fillLight.position.set(-5, -2, -5);
      scene.add(fillLight);

      const topLight = new THREE.DirectionalLight(0xffffff, 0.3);
      topLight.position.set(0, 5, 0);
      scene.add(topLight);
    }

    function setupEventListeners() {
      const canvas = renderer.domElement;
      canvas.addEventListener('touchstart', onTouchStart, { passive: false });
      canvas.addEventListener('touchmove', onTouchMove, { passive: false });
      canvas.addEventListener('touchend', onTouchEnd, { passive: false });
      canvas.addEventListener('mousedown', onMouseDown);
      canvas.addEventListener('mousemove', onMouseMove);
      canvas.addEventListener('mouseup', onMouseUp);
      window.addEventListener('resize', onResize);
    }

    function onTouchStart(e) {
      e.preventDefault();
      if (e.touches.length === 1) {
        isDragging = true;
        autoRotate = false;
        touchStartTime = Date.now();
        previousTouch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        document.getElementById('instructions').style.opacity = '0';
      }
    }

    function onTouchMove(e) {
      e.preventDefault();
      if (isDragging && e.touches.length === 1 && previousTouch) {
        const deltaX = e.touches[0].clientX - previousTouch.x;
        const deltaY = e.touches[0].clientY - previousTouch.y;

        globe.rotation.y += deltaX * 0.006;
        globe.rotation.x += deltaY * 0.006;
        globe.rotation.x = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, globe.rotation.x));

        if (clouds) {
          clouds.rotation.y = globe.rotation.y;
          clouds.rotation.x = globe.rotation.x;
        }

        previousTouch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        rotationVelocity = { x: deltaX * 0.0002, y: deltaY * 0.0001 };
      }
    }

    function onTouchEnd(e) {
      const touchDuration = Date.now() - touchStartTime;
      const wasTap = touchDuration < 200 && e.changedTouches.length === 1;

      isDragging = false;
      previousTouch = null;

      if (wasTap) {
        const touch = e.changedTouches[0];
        checkMarkerClick(touch.clientX, touch.clientY);
      }

      setTimeout(() => {
        if (!isDragging) autoRotate = true;
      }, 4000);
    }

    function onMouseDown(e) {
      isDragging = true;
      autoRotate = false;
      touchStartTime = Date.now();
      previousTouch = { x: e.clientX, y: e.clientY };
    }

    function onMouseMove(e) {
      // Hover effect
      checkMarkerHover(e.clientX, e.clientY);

      if (isDragging && previousTouch) {
        const deltaX = e.clientX - previousTouch.x;
        const deltaY = e.clientY - previousTouch.y;

        globe.rotation.y += deltaX * 0.006;
        globe.rotation.x += deltaY * 0.006;
        globe.rotation.x = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, globe.rotation.x));

        if (clouds) {
          clouds.rotation.y = globe.rotation.y;
          clouds.rotation.x = globe.rotation.x;
        }

        previousTouch = { x: e.clientX, y: e.clientY };
        rotationVelocity = { x: deltaX * 0.0002, y: 0 };
      }
    }

    function onMouseUp(e) {
      const touchDuration = Date.now() - touchStartTime;
      const wasClick = touchDuration < 200;

      isDragging = false;
      previousTouch = null;

      if (wasClick) {
        checkMarkerClick(e.clientX, e.clientY);
      }

      setTimeout(() => {
        if (!isDragging) autoRotate = true;
      }, 4000);
    }

    function checkMarkerClick(clientX, clientY) {
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2(
        (clientX / window.innerWidth) * 2 - 1,
        -(clientY / window.innerHeight) * 2 + 1
      );

      raycaster.setFromCamera(mouse, camera);

      // Buscar en todos los hijos del markersGroup
      const allMarkers = [];
      markersGroup.children.forEach(group => {
        group.children.forEach(child => {
          if (child.userData && child.userData.crisisId) {
            allMarkers.push(child);
          }
        });
      });

      const intersects = raycaster.intersectObjects(allMarkers, false);

      if (intersects.length > 0) {
        const crisisId = intersects[0].object.userData.crisisId;
        window.ReactNativeWebView?.postMessage(JSON.stringify({
          type: 'crisisSelect',
          crisisId: crisisId
        }));
        hideTooltip();
      }
    }

    function checkMarkerHover(clientX, clientY) {
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2(
        (clientX / window.innerWidth) * 2 - 1,
        -(clientY / window.innerHeight) * 2 + 1
      );

      raycaster.setFromCamera(mouse, camera);

      const allMarkers = [];
      markersGroup.children.forEach(group => {
        group.children.forEach(child => {
          if (child.userData && child.userData.crisis) {
            allMarkers.push(child);
          }
        });
      });

      const intersects = raycaster.intersectObjects(allMarkers, false);

      if (intersects.length > 0 && intersects[0].object.userData.crisis) {
        const crisis = intersects[0].object.userData.crisis;
        if (hoveredCrisis !== crisis.id) {
          hoveredCrisis = crisis.id;
          showTooltip(crisis, clientX, clientY);
        }
      } else {
        if (hoveredCrisis) {
          hoveredCrisis = null;
          hideTooltip();
        }
      }
    }

    function showTooltip(crisis, x, y) {
      const tooltip = document.getElementById('tooltip');
      tooltip.querySelector('.icon').textContent = crisis.typeIcon;
      tooltip.querySelector('.text').textContent = crisis.title;

      let urgencyText = 'Bajo';
      let urgencyColor = '#22c55e';
      if (crisis.urgency >= 8) { urgencyText = 'CRITICO'; urgencyColor = '#ef4444'; }
      else if (crisis.urgency >= 6) { urgencyText = 'Alto'; urgencyColor = '#f97316'; }
      else if (crisis.urgency >= 4) { urgencyText = 'Medio'; urgencyColor = '#eab308'; }

      tooltip.querySelector('.urgency').innerHTML = 'Urgencia: <span style="color:' + urgencyColor + '">' + urgencyText + '</span>';

      tooltip.style.left = Math.min(x + 15, window.innerWidth - 220) + 'px';
      tooltip.style.top = Math.min(y + 15, window.innerHeight - 80) + 'px';
      tooltip.style.display = 'block';
    }

    function hideTooltip() {
      document.getElementById('tooltip').style.display = 'none';
    }

    function onResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function animate() {
      requestAnimationFrame(animate);
      const time = Date.now() * 0.001;

      // Auto-rotación
      if (autoRotate) {
        globe.rotation.y += 0.001;
        if (clouds) clouds.rotation.y += 0.0012;
      } else {
        globe.rotation.y += rotationVelocity.x;
        rotationVelocity.x *= 0.96;
        if (clouds) clouds.rotation.y = globe.rotation.y;
      }

      // Sincronizar markersGroup con globo
      markersGroup.rotation.copy(globe.rotation);

      // Animar marcadores
      markersGroup.children.forEach((group, i) => {
        group.children.forEach(child => {
          if (child.userData.isGlow) {
            const pulse = 1 + Math.sin(time * 3 + i) * 0.3;
            child.scale.set(pulse, pulse, pulse);
            child.material.opacity = child.userData.baseOpacity * (0.7 + Math.sin(time * 2 + i) * 0.3);
          }
          if (child.userData.isRing) {
            const ringPulse = 1 + Math.sin(time * 2 + i * 0.5) * 0.4;
            child.scale.set(ringPulse, ringPulse, 1);
            child.material.opacity = 0.5 - (ringPulse - 1) * 0.8;
          }
        });
      });

      // Animar efectos de selección
      selectedMarkerGroup.rotation.copy(globe.rotation);
      selectedMarkerGroup.children.forEach(group => {
        group.children.forEach(child => {
          if (child.userData.rotationSpeed) {
            child.rotateZ(child.userData.rotationSpeed * child.userData.direction);
          }
          if (child.userData.isParticle) {
            child.userData.angle += child.userData.speed;
            const pos = group.userData.centerPos;
            const offset = new THREE.Vector3(
              Math.cos(child.userData.angle) * child.userData.radius,
              Math.sin(child.userData.angle * 2) * child.userData.radius * 0.3,
              Math.sin(child.userData.angle) * child.userData.radius
            );
            child.position.copy(pos).add(offset);
          }
        });
      });

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
  `, [crisesJson, selectedId]);

  const handleMessage = useCallback((event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'crisisSelect' && onCrisisSelect) {
        const crisis = crises.find(c => c.id === data.crisisId);
        if (crisis) {
          onCrisisSelect(crisis);
        }
      }
    } catch (error) {
      console.log('Globe3D message parse error:', error);
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
        allowFileAccess={true}
        mixedContentMode="always"
        originWhitelist={['*']}
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        androidLayerType="hardware"
        cacheEnabled={true}
        startInLoadingState={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    overflow: 'hidden',
    borderRadius: 12
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent'
  }
});

export default Globe3D;
