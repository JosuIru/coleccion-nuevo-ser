/**
 * Globe3D.js
 * Globo terráqueo 3D con continentes simplificados reconocibles
 * Marcadores de crisis 3D interactivos con selección
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
    html, body { width: 100%; height: 100%; overflow: hidden; background: transparent; touch-action: none; }
    canvas { display: block; }
    #loading { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: #60a5fa; font-size: 14px; text-align: center; font-family: system-ui; }
    .spinner { width: 40px; height: 40px; border: 3px solid rgba(96,165,250,0.3); border-top-color: #60a5fa; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 10px; }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div id="loading"><div class="spinner"></div>Cargando globo...</div>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
  <script>
    // Continentes simplificados - formas limpias y reconocibles
    const continents = {
      // NORTH AMERICA - forma simplificada
      northAmerica: [
        [-168, 66], [-145, 60], [-141, 60], [-130, 55], [-125, 50], [-124, 48],
        [-122, 37], [-117, 32], [-110, 31], [-104, 29], [-97, 26], [-97, 22],
        [-87, 21], [-83, 22], [-81, 25], [-80, 28], [-82, 30], [-85, 30],
        [-88, 30], [-90, 29], [-94, 29], [-97, 28], [-97, 26], [-99, 27],
        [-104, 29], [-106, 32], [-110, 31], [-115, 32], [-118, 34], [-121, 36],
        [-123, 38], [-124, 42], [-124, 46], [-123, 49], [-130, 55], [-135, 58],
        [-141, 60], [-145, 60], [-149, 61], [-155, 58], [-160, 56], [-165, 55],
        [-168, 54], [-166, 60], [-168, 66]
      ],
      // SOUTH AMERICA
      southAmerica: [
        [-80, 10], [-75, 11], [-72, 12], [-68, 11], [-64, 10], [-60, 8],
        [-55, 5], [-50, 0], [-50, -5], [-45, -6], [-40, -8], [-38, -12],
        [-39, -17], [-42, -22], [-45, -24], [-48, -28], [-52, -33], [-55, -35],
        [-58, -38], [-63, -40], [-65, -42], [-67, -46], [-66, -52], [-68, -55],
        [-70, -52], [-72, -48], [-75, -42], [-74, -38], [-73, -33], [-70, -28],
        [-70, -18], [-75, -15], [-77, -10], [-80, -3], [-80, 2], [-77, 7],
        [-74, 11], [-80, 10]
      ],
      // EUROPE (sin Rusia asiática)
      europe: [
        [-10, 36], [-6, 37], [0, 38], [5, 43], [8, 44], [10, 45], [14, 46],
        [16, 48], [18, 50], [22, 52], [24, 55], [28, 56], [30, 60], [28, 64],
        [25, 70], [20, 70], [15, 69], [10, 64], [5, 62], [5, 58], [8, 56],
        [12, 55], [8, 53], [4, 52], [3, 50], [0, 49], [-4, 48], [-5, 44],
        [-9, 43], [-10, 40], [-10, 36]
      ],
      // AFRICA
      africa: [
        [-17, 21], [-17, 15], [-12, 15], [-12, 12], [-8, 10], [-5, 5],
        [0, 5], [8, 4], [10, 2], [10, -5], [15, -10], [20, -15],
        [28, -20], [35, -25], [32, -30], [28, -34], [20, -35], [18, -32],
        [15, -28], [12, -18], [15, -10], [20, -5], [30, 0], [35, 5],
        [40, 10], [43, 12], [50, 12], [51, 10], [43, 8], [38, 10],
        [33, 10], [35, 15], [35, 22], [32, 30], [28, 31], [25, 32],
        [20, 33], [12, 35], [10, 37], [2, 36], [-5, 36], [-6, 32],
        [-8, 29], [-13, 28], [-17, 25], [-17, 21]
      ],
      // ASIA (simplificada)
      asia: [
        [30, 40], [40, 42], [50, 45], [60, 50], [70, 55], [80, 55],
        [90, 50], [100, 50], [110, 45], [120, 42], [130, 43], [140, 45],
        [145, 50], [155, 55], [170, 65], [180, 68], [180, 72], [170, 72],
        [160, 70], [150, 62], [145, 55], [140, 50], [130, 50], [125, 53],
        [120, 55], [100, 55], [90, 55], [80, 60], [70, 65], [60, 68],
        [50, 66], [40, 65], [35, 60], [40, 55], [50, 50], [45, 45],
        [40, 40], [30, 40]
      ],
      // ASIA SUR (India, Sudeste)
      asiaSouth: [
        [68, 24], [75, 30], [80, 28], [85, 27], [90, 25], [95, 28],
        [100, 22], [105, 20], [108, 15], [110, 10], [105, 5], [100, 5],
        [95, 8], [92, 10], [90, 18], [88, 22], [85, 20], [80, 15],
        [75, 10], [72, 15], [68, 24]
      ],
      // AUSTRALIA
      australia: [
        [115, -20], [120, -18], [130, -15], [140, -12], [145, -15],
        [150, -22], [153, -27], [150, -35], [145, -38], [140, -38],
        [135, -35], [130, -32], [125, -33], [120, -35], [115, -33],
        [114, -28], [115, -20]
      ],
      // INDONESIA (simplificada)
      indonesia: [
        [95, 5], [100, 2], [105, -5], [110, -8], [115, -8], [120, -8],
        [125, -8], [130, -5], [135, -5], [140, -2], [140, 0], [135, 2],
        [130, 2], [125, 5], [120, 5], [115, 2], [110, 0], [105, 2],
        [100, 5], [95, 5]
      ]
    };

    let scene, camera, renderer, globe, atmosphere;
    let markersGroup;
    let isDragging = false, previousTouch = null, touchStartTime = 0, touchStartPos = null;
    let rotationVelocity = { x: 0, y: 0 };
    let autoRotate = true;
    let crisisData = ${crisesJson};
    let selectedCrisisId = "${selectedId}";

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

      // Ocean gradient
      const oceanGrad = ctx.createLinearGradient(0, 0, 0, 1024);
      oceanGrad.addColorStop(0, '#0a1628');
      oceanGrad.addColorStop(0.3, '#0d2847');
      oceanGrad.addColorStop(0.5, '#0f3460');
      oceanGrad.addColorStop(0.7, '#0d2847');
      oceanGrad.addColorStop(1, '#0a1628');
      ctx.fillStyle = oceanGrad;
      ctx.fillRect(0, 0, 2048, 1024);

      // Draw each continent
      Object.values(continents).forEach((coords, index) => {
        drawContinent(ctx, coords, index);
      });

      // Subtle grid
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.08)';
      ctx.lineWidth = 1;
      for (let lon = -180; lon <= 180; lon += 30) {
        const x = ((lon + 180) / 360) * 2048;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 1024);
        ctx.stroke();
      }
      for (let lat = -90; lat <= 90; lat += 30) {
        const y = ((90 - lat) / 180) * 1024;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(2048, y);
        ctx.stroke();
      }

      const texture = new THREE.CanvasTexture(canvas);
      const material = new THREE.MeshPhongMaterial({
        map: texture,
        specular: new THREE.Color(0x222244),
        shininess: 5
      });

      globe = new THREE.Mesh(geometry, material);
      scene.add(globe);
    }

    function drawContinent(ctx, coords, index) {
      if (!coords || coords.length < 3) return;

      ctx.beginPath();
      let first = true;
      coords.forEach(coord => {
        const x = ((coord[0] + 180) / 360) * 2048;
        const y = ((90 - coord[1]) / 180) * 1024;
        if (first) {
          ctx.moveTo(x, y);
          first = false;
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.closePath();

      // Different shades of green for each continent
      const greens = [
        ['#1a5c3a', '#2d7a4f', '#40916c'], // North America
        ['#145c32', '#228b4a', '#34a463'], // South America
        ['#1e6b44', '#32875a', '#46a370'], // Europe
        ['#1b5e3e', '#2f7d55', '#439c6c'], // Africa
        ['#165839', '#2a7650', '#3e9467'], // Asia
        ['#1a6642', '#2e845a', '#42a272'], // Asia South
        ['#14593a', '#287752', '#3c956a'], // Australia
        ['#185a3b', '#2c7853', '#40966b'], // Indonesia
      ];

      const colorSet = greens[index % greens.length];

      // Land fill with gradient effect
      const landGrad = ctx.createLinearGradient(0, 0, 0, 1024);
      landGrad.addColorStop(0, colorSet[0]);
      landGrad.addColorStop(0.5, colorSet[1]);
      landGrad.addColorStop(1, colorSet[2]);
      ctx.fillStyle = landGrad;
      ctx.fill();

      // Coast glow effect
      ctx.shadowColor = '#4ade80';
      ctx.shadowBlur = 8;
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.shadowBlur = 0;
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
            gl_FragColor = vec4(0.3, 0.6, 1.0, intensity * 0.6);
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
        const marker = createCrisisMarker(crisis, i);
        markersGroup.add(marker);
      });

      scene.add(markersGroup);
    }

    function createCrisisMarker(crisis, index) {
      const group = new THREE.Group();
      const pos = latLonToVector3(crisis.lat, crisis.lon, 1.03);

      // Color by urgency
      let color, glowColor;
      if (crisis.urgency >= 8) { color = 0xef4444; glowColor = 0xff6b6b; }
      else if (crisis.urgency >= 6) { color = 0xf97316; glowColor = 0xffa94d; }
      else if (crisis.urgency >= 4) { color = 0xeab308; glowColor = 0xffd43b; }
      else { color = 0x22c55e; glowColor = 0x69db7c; }

      const isSelected = crisis.id === selectedCrisisId;
      const size = 0.035 + (crisis.urgency * 0.004);

      // Main sphere
      const sphereGeo = new THREE.SphereGeometry(size, 24, 24);
      const sphereMat = new THREE.MeshPhongMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: isSelected ? 0.9 : 0.5,
        shininess: 100
      });
      const sphere = new THREE.Mesh(sphereGeo, sphereMat);
      sphere.position.copy(pos);
      sphere.userData = { crisisId: crisis.id, crisis: crisis };
      group.add(sphere);

      // Outer glow
      const glowGeo = new THREE.SphereGeometry(size * 2.2, 16, 16);
      const glowMat = new THREE.MeshBasicMaterial({
        color: glowColor,
        transparent: true,
        opacity: isSelected ? 0.45 : 0.2
      });
      const glow = new THREE.Mesh(glowGeo, glowMat);
      glow.position.copy(pos);
      glow.userData = { isGlow: true };
      group.add(glow);

      // Selection rings
      if (isSelected) {
        for (let i = 0; i < 2; i++) {
          const ringGeo = new THREE.RingGeometry(size * (2.5 + i * 0.7), size * (2.8 + i * 0.7), 32);
          const ringMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.6 - i * 0.2,
            side: THREE.DoubleSide
          });
          const ring = new THREE.Mesh(ringGeo, ringMat);
          ring.position.copy(pos);
          ring.lookAt(0, 0, 0);
          ring.userData = { isRing: true, speed: 0.03 + i * 0.01 };
          group.add(ring);
        }
      }

      group.userData = { crisisId: crisis.id };
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
      scene.add(new THREE.AmbientLight(0x404060, 0.5));
      const sun = new THREE.DirectionalLight(0xffffff, 1.3);
      sun.position.set(5, 3, 5);
      scene.add(sun);
      const fill = new THREE.DirectionalLight(0x3b82f6, 0.4);
      fill.position.set(-5, -2, -5);
      scene.add(fill);
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
      if (e.touches.length === 1) {
        isDragging = true;
        autoRotate = false;
        touchStartTime = Date.now();
        touchStartPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        previousTouch = { ...touchStartPos };
      }
    }

    function onTouchMove(e) {
      e.preventDefault();
      if (isDragging && e.touches.length === 1 && previousTouch) {
        const dx = e.touches[0].clientX - previousTouch.x;
        const dy = e.touches[0].clientY - previousTouch.y;
        globe.rotation.y += dx * 0.006;
        globe.rotation.x += dy * 0.006;
        globe.rotation.x = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, globe.rotation.x));
        previousTouch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        rotationVelocity = { x: dx * 0.0002, y: dy * 0.0001 };
      }
    }

    function onTouchEnd(e) {
      const duration = Date.now() - touchStartTime;
      const touch = e.changedTouches[0];
      const dist = touchStartPos ? Math.hypot(touch.clientX - touchStartPos.x, touch.clientY - touchStartPos.y) : 999;

      isDragging = false;
      previousTouch = null;

      if (duration < 250 && dist < 15) {
        checkMarkerClick(touch.clientX, touch.clientY);
      }

      setTimeout(() => { if (!isDragging) autoRotate = true; }, 3000);
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
        globe.rotation.y += dx * 0.006;
        globe.rotation.x += dy * 0.006;
        globe.rotation.x = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, globe.rotation.x));
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

    function checkMarkerClick(clientX, clientY) {
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2(
        (clientX / window.innerWidth) * 2 - 1,
        -(clientY / window.innerHeight) * 2 + 1
      );
      raycaster.setFromCamera(mouse, camera);

      const targets = [];
      markersGroup.children.forEach(g => {
        g.children.forEach(c => {
          if (c.userData && c.userData.crisisId) targets.push(c);
        });
      });

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

      if (autoRotate) {
        globe.rotation.y += 0.001;
      } else {
        globe.rotation.y += rotationVelocity.x;
        rotationVelocity.x *= 0.96;
      }

      markersGroup.rotation.copy(globe.rotation);

      // Animate markers
      markersGroup.children.forEach((g, i) => {
        g.children.forEach(c => {
          if (c.userData.isGlow) {
            const pulse = 1 + Math.sin(time * 3 + i) * 0.25;
            c.scale.set(pulse, pulse, pulse);
          }
          if (c.userData.isRing) {
            c.rotateZ(c.userData.speed);
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
        if (crisis) onCrisisSelect(crisis);
      }
    } catch (e) {}
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
  container: { flex: 1, backgroundColor: 'transparent', overflow: 'hidden', borderRadius: 12 },
  webview: { flex: 1, backgroundColor: 'transparent' }
});

export default Globe3D;
