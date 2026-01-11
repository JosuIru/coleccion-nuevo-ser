/**
 * Globe3D.js
 * Globo terráqueo 3D interactivo usando Three.js en WebView
 * Muestra crisis como marcadores luminosos sobre la superficie
 */

import React, { useRef, useCallback, useMemo } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { COLORS } from '../config/constants';

const Globe3D = ({
  crises = [],
  onCrisisSelect,
  selectedCrisis,
  style
}) => {
  const webViewRef = useRef(null);

  // Convertir crises a formato JSON para el WebView
  const crisesJson = useMemo(() => JSON.stringify(crises.map(c => ({
    id: c.id,
    lat: c.lat,
    lon: c.lon,
    urgency: c.urgency,
    type: c.type,
    title: c.title,
    typeIcon: c.typeIcon
  }))), [crises]);

  const selectedId = selectedCrisis?.id || '';

  // HTML con Three.js para el globo 3D
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
    }
    canvas {
      display: block;
      width: 100%;
      height: 100%;
    }
    #loading {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: #60a5fa;
      font-family: system-ui, sans-serif;
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
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div id="loading">
    <div class="spinner"></div>
    Cargando globo...
  </div>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
  <script>
    // Variables globales
    let scene, camera, renderer, globe, atmosphere, markers = [];
    let isDragging = false, previousTouch = null;
    let rotationVelocity = { x: 0.001, y: 0 };
    let autoRotate = true;
    let crisisData = ${crisesJson};
    let selectedCrisisId = "${selectedId}";

    // Inicializar escena
    function init() {
      // Escena
      scene = new THREE.Scene();

      // Cámara
      camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.z = 2.8;

      // Renderer con transparencia
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
      });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(0x000000, 0);
      document.body.appendChild(renderer.domElement);

      // Crear globo
      createGlobe();

      // Crear atmósfera
      createAtmosphere();

      // Crear marcadores de crisis
      createMarkers();

      // Luces
      const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
      directionalLight.position.set(5, 3, 5);
      scene.add(directionalLight);

      const backLight = new THREE.DirectionalLight(0x3b82f6, 0.3);
      backLight.position.set(-5, -3, -5);
      scene.add(backLight);

      // Eventos
      setupEventListeners();

      // Ocultar loading
      document.getElementById('loading').style.display = 'none';

      // Animar
      animate();
    }

    function createGlobe() {
      // Geometría de la esfera
      const geometry = new THREE.SphereGeometry(1, 64, 64);

      // Crear textura procedural de la Tierra
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');

      // Fondo océano oscuro
      ctx.fillStyle = '#0c1929';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Dibujar continentes simplificados (estilo mapa)
      ctx.fillStyle = '#1e3a5f';
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 1;

      // América del Norte
      drawContinent(ctx, [[120, 80], [280, 80], [320, 140], [280, 200], [200, 220], [160, 200], [100, 140]]);

      // América del Sur
      drawContinent(ctx, [[220, 240], [280, 260], [300, 340], [280, 420], [240, 440], [200, 400], [180, 320], [200, 260]]);

      // Europa
      drawContinent(ctx, [[480, 100], [560, 80], [600, 100], [580, 140], [540, 160], [500, 140], [460, 120]]);

      // África
      drawContinent(ctx, [[480, 180], [560, 180], [600, 240], [580, 340], [520, 380], [460, 340], [440, 260], [460, 200]]);

      // Asia
      drawContinent(ctx, [[600, 80], [800, 80], [900, 120], [920, 200], [880, 240], [800, 260], [720, 240], [640, 200], [600, 140]]);

      // Australia
      drawContinent(ctx, [[800, 320], [880, 320], [920, 360], [900, 420], [840, 440], [780, 400], [780, 360]]);

      // Grilla
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.15)';
      ctx.lineWidth = 0.5;
      for (let i = 0; i < 12; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 85.3, 0);
        ctx.lineTo(i * 85.3, 512);
        ctx.stroke();
      }
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * 85.3);
        ctx.lineTo(1024, i * 85.3);
        ctx.stroke();
      }

      const texture = new THREE.CanvasTexture(canvas);

      // Material del globo
      const material = new THREE.MeshPhongMaterial({
        map: texture,
        bumpScale: 0.02,
        specular: new THREE.Color(0x333333),
        shininess: 5
      });

      globe = new THREE.Mesh(geometry, material);
      scene.add(globe);
    }

    function drawContinent(ctx, points) {
      if (points.length < 3) return;
      ctx.beginPath();
      ctx.moveTo(points[0][0], points[0][1]);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i][0], points[i][1]);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    function createAtmosphere() {
      const geometry = new THREE.SphereGeometry(1.05, 64, 64);
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
            gl_FragColor = vec4(0.3, 0.6, 1.0, 1.0) * intensity;
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
      // Limpiar marcadores existentes
      markers.forEach(m => {
        scene.remove(m.mesh);
        if (m.glow) scene.remove(m.glow);
      });
      markers = [];

      crisisData.forEach(crisis => {
        const position = latLonToVector3(crisis.lat, crisis.lon, 1.02);

        // Determinar color según urgencia
        let color;
        if (crisis.urgency >= 8) color = 0xef4444;
        else if (crisis.urgency >= 6) color = 0xf97316;
        else if (crisis.urgency >= 4) color = 0xeab308;
        else color = 0x22c55e;

        const isSelected = crisis.id === selectedCrisisId;
        const size = 0.02 + (crisis.urgency * 0.003);

        // Marcador principal
        const geometry = new THREE.SphereGeometry(size, 16, 16);
        const material = new THREE.MeshBasicMaterial({
          color: color,
          transparent: true,
          opacity: isSelected ? 1 : 0.9
        });
        const marker = new THREE.Mesh(geometry, material);
        marker.position.copy(position);
        marker.userData = { crisisId: crisis.id };
        scene.add(marker);

        // Glow effect
        const glowGeometry = new THREE.SphereGeometry(size * 2, 16, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
          color: color,
          transparent: true,
          opacity: isSelected ? 0.5 : 0.3
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.copy(position);
        scene.add(glow);

        // Anillo de selección
        if (isSelected) {
          const ringGeometry = new THREE.RingGeometry(size * 2, size * 2.5, 32);
          const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
          });
          const ring = new THREE.Mesh(ringGeometry, ringMaterial);
          ring.position.copy(position);
          ring.lookAt(0, 0, 0);
          scene.add(ring);
          markers.push({ mesh: marker, glow: glow, ring: ring, crisisId: crisis.id });
        } else {
          markers.push({ mesh: marker, glow: glow, crisisId: crisis.id });
        }
      });
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

    function setupEventListeners() {
      const canvas = renderer.domElement;

      // Touch events
      canvas.addEventListener('touchstart', onTouchStart, { passive: false });
      canvas.addEventListener('touchmove', onTouchMove, { passive: false });
      canvas.addEventListener('touchend', onTouchEnd, { passive: false });

      // Mouse events (para debug en navegador)
      canvas.addEventListener('mousedown', onMouseDown);
      canvas.addEventListener('mousemove', onMouseMove);
      canvas.addEventListener('mouseup', onMouseUp);
      canvas.addEventListener('click', onClick);

      // Resize
      window.addEventListener('resize', onResize);
    }

    function onTouchStart(e) {
      e.preventDefault();
      if (e.touches.length === 1) {
        isDragging = true;
        autoRotate = false;
        previousTouch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    }

    function onTouchMove(e) {
      e.preventDefault();
      if (isDragging && e.touches.length === 1 && previousTouch) {
        const deltaX = e.touches[0].clientX - previousTouch.x;
        const deltaY = e.touches[0].clientY - previousTouch.y;

        globe.rotation.y += deltaX * 0.005;
        globe.rotation.x += deltaY * 0.005;
        globe.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, globe.rotation.x));

        // Rotar marcadores con el globo
        markers.forEach(m => {
          if (m.ring) {
            m.ring.lookAt(camera.position);
          }
        });

        previousTouch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        rotationVelocity = { x: deltaX * 0.0001, y: 0 };
      }
    }

    function onTouchEnd(e) {
      isDragging = false;
      previousTouch = null;

      // Detectar tap para selección
      if (e.changedTouches.length === 1) {
        const touch = e.changedTouches[0];
        checkMarkerClick(touch.clientX, touch.clientY);
      }

      // Reactivar auto-rotación después de un delay
      setTimeout(() => {
        if (!isDragging) autoRotate = true;
      }, 3000);
    }

    function onMouseDown(e) {
      isDragging = true;
      autoRotate = false;
      previousTouch = { x: e.clientX, y: e.clientY };
    }

    function onMouseMove(e) {
      if (isDragging && previousTouch) {
        const deltaX = e.clientX - previousTouch.x;
        const deltaY = e.clientY - previousTouch.y;

        globe.rotation.y += deltaX * 0.005;
        globe.rotation.x += deltaY * 0.005;
        globe.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, globe.rotation.x));

        previousTouch = { x: e.clientX, y: e.clientY };
        rotationVelocity = { x: deltaX * 0.0001, y: 0 };
      }
    }

    function onMouseUp() {
      isDragging = false;
      previousTouch = null;
      setTimeout(() => {
        if (!isDragging) autoRotate = true;
      }, 3000);
    }

    function onClick(e) {
      checkMarkerClick(e.clientX, e.clientY);
    }

    function checkMarkerClick(clientX, clientY) {
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();

      mouse.x = (clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);

      const markerMeshes = markers.map(m => m.mesh);
      const intersects = raycaster.intersectObjects(markerMeshes);

      if (intersects.length > 0) {
        const crisisId = intersects[0].object.userData.crisisId;
        // Enviar mensaje a React Native
        window.ReactNativeWebView?.postMessage(JSON.stringify({
          type: 'crisisSelect',
          crisisId: crisisId
        }));
      }
    }

    function onResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function animate() {
      requestAnimationFrame(animate);

      // Auto-rotación suave
      if (autoRotate) {
        globe.rotation.y += 0.002;
      } else {
        // Inercia
        globe.rotation.y += rotationVelocity.x;
        rotationVelocity.x *= 0.95;
      }

      // Pulso de los marcadores
      const time = Date.now() * 0.003;
      markers.forEach((m, i) => {
        if (m.glow) {
          const scale = 1 + Math.sin(time + i) * 0.2;
          m.glow.scale.set(scale, scale, scale);
        }
        if (m.ring) {
          m.ring.rotation.z += 0.02;
        }
      });

      renderer.render(scene, camera);
    }

    // Función para actualizar datos desde React Native
    function updateCrises(data, selectedId) {
      crisisData = data;
      selectedCrisisId = selectedId;
      createMarkers();
    }

    // Iniciar cuando el DOM esté listo
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  </script>
</body>
</html>
  `, [crisesJson, selectedId]);

  // Manejar mensajes del WebView
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
