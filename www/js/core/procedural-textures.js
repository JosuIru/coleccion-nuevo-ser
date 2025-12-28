/**
// 🔧 FIX v2.9.198: Migrated console.log to logger
 * Generador de Texturas Procedurales Orgánicas
 * Crea texturas en canvas para normal maps, roughness, y patrones vasculares
 *
 * @version 2.0.0
 * @author J. Irurtzun & Claude Sonnet 4.5
 */

class ProceduralTextures {
  constructor() {
    this.textureCache = new Map();
  }

  /**
   * Perlin Noise 2D simplificado
   */
  perlin2D(x, y) {
    const xi = Math.floor(x) & 255;
    const yi = Math.floor(y) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);

    const u = this.fade(xf);
    const v = this.fade(yf);

    const p = this.permutation;
    const aa = p[p[xi] + yi];
    const ab = p[p[xi] + yi + 1];
    const ba = p[p[xi + 1] + yi];
    const bb = p[p[xi + 1] + yi + 1];

    const x1 = this.lerp(this.grad(aa, xf, yf), this.grad(ba, xf - 1, yf), u);
    const x2 = this.lerp(this.grad(ab, xf, yf - 1), this.grad(bb, xf - 1, yf - 1), u);

    return this.lerp(x1, x2, v);
  }

  fade(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  lerp(a, b, t) {
    return a + t * (b - a);
  }

  grad(hash, x, y) {
    const h = hash & 3;
    const u = h < 2 ? x : y;
    const v = h < 2 ? y : x;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  get permutation() {
    if (!this._permutation) {
      this._permutation = [];
      for (let i = 0; i < 256; i++) {
        this._permutation[i] = Math.floor(Math.random() * 256);
      }
      this._permutation = this._permutation.concat(this._permutation);
    }
    return this._permutation;
  }

  /**
   * Generar Textura Vascular (red de capilares)
   */
  generateVascularTexture(size = 512, color = '#ff0033', options = {}) {
    const key = `vascular_${size}_${color}_${JSON.stringify(options)}`;

    if (this.textureCache.has(key)) {
      return this.textureCache.get(key);
    }

    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Fondo base
    ctx.fillStyle = 'rgba(0, 0, 0, 0)';
    ctx.fillRect(0, 0, size, size);

    // Sistema vascular con L-Systems
    const branches = options.branches || 5;
    const iterations = options.iterations || 4;
    const thickness = options.thickness || 3;

    // Puntos de inicio (arterias principales)
    const startPoints = [];
    for (let i = 0; i < branches; i++) {
      const angle = (i / branches) * Math.PI * 2;
      const radius = size * 0.1;
      startPoints.push({
        x: size / 2 + Math.cos(angle) * radius,
        y: size / 2 + Math.sin(angle) * radius,
        angle: angle + Math.PI,
        thickness: thickness
      });
    }

    // Dibujar red vascular recursivamente
    const drawBranch = (x, y, angle, length, thick, depth) => {
      if (depth >= iterations || thick < 0.5) return;

      const endX = x + Math.cos(angle) * length;
      const endY = y + Math.sin(angle) * length;

      // Gradiente de grosor y opacidad
      const gradient = ctx.createLinearGradient(x, y, endX, endY);
      const alpha1 = Math.min(1.0, thick / thickness);
      const alpha2 = Math.min(0.8, (thick * 0.8) / thickness);

      gradient.addColorStop(0, `${color}${Math.floor(alpha1 * 255).toString(16).padStart(2, '0')}`);
      gradient.addColorStop(1, `${color}${Math.floor(alpha2 * 255).toString(16).padStart(2, '0')}`);

      ctx.strokeStyle = gradient;
      ctx.lineWidth = thick;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      // Ramificación
      const angleVariation = (Math.random() - 0.5) * Math.PI / 3;
      const branchAngle1 = angle + Math.PI / 6 + angleVariation;
      const branchAngle2 = angle - Math.PI / 6 - angleVariation;

      const newLength = length * (0.6 + Math.random() * 0.2);
      const newThick = thick * 0.7;

      drawBranch(endX, endY, branchAngle1, newLength, newThick, depth + 1);
      drawBranch(endX, endY, branchAngle2, newLength, newThick, depth + 1);

      // Ocasionalmente continuar recto
      if (Math.random() < 0.3) {
        drawBranch(endX, endY, angle + angleVariation * 0.5, newLength, newThick, depth + 1);
      }
    };

    // Dibujar todas las ramas
    startPoints.forEach(point => {
      drawBranch(
        point.x,
        point.y,
        point.angle,
        size * 0.15,
        point.thickness,
        0
      );
    });

    // Aplicar blur para suavizar
    if (options.blur !== false) {
      ctx.filter = 'blur(1px)';
      ctx.drawImage(canvas, 0, 0);
      ctx.filter = 'none';
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

    this.textureCache.set(key, texture);
    return texture;
  }

  /**
   * Generar Normal Map Orgánico (bumps y poros)
   */
  generateOrganicNormalMap(size = 512, intensity = 0.5) {
    const key = `normal_${size}_${intensity}`;

    if (this.textureCache.has(key)) {
      return this.textureCache.get(key);
    }

    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');

    const imageData = ctx.createImageData(size, size);
    const data = imageData.data;

    // Generar height map con Perlin noise
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const i = (y * size + x) * 4;

        // Multi-octave Perlin noise
        let height = 0;
        let amplitude = 1;
        let frequency = 0.01;

        for (let octave = 0; octave < 4; octave++) {
          height += this.perlin2D(x * frequency, y * frequency) * amplitude;
          amplitude *= 0.5;
          frequency *= 2;
        }

        // Normalizar a rango [0, 1]
        height = (height + 1) * 0.5;

        // Calcular normales aproximadas usando diferencias finitas
        const heightL = this.perlin2D((x - 1) * 0.01, y * 0.01);
        const heightR = this.perlin2D((x + 1) * 0.01, y * 0.01);
        const heightU = this.perlin2D(x * 0.01, (y - 1) * 0.01);
        const heightD = this.perlin2D(x * 0.01, (y + 1) * 0.01);

        const dx = (heightR - heightL) * intensity;
        const dy = (heightD - heightU) * intensity;

        // Convertir a color RGB (normal map)
        data[i] = ((dx + 1) * 0.5) * 255;     // R = X
        data[i + 1] = ((dy + 1) * 0.5) * 255; // G = Y
        data[i + 2] = 255;                     // B = Z (siempre hacia arriba)
        data[i + 3] = 255;                     // Alpha
      }
    }

    ctx.putImageData(imageData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

    this.textureCache.set(key, texture);
    return texture;
  }

  /**
   * Generar Mapa de Bioluminiscencia
   */
  generateBiolumMap(size = 512, hotspots = 20) {
    const key = `biolum_${size}_${hotspots}`;

    if (this.textureCache.has(key)) {
      return this.textureCache.get(key);
    }

    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Fondo oscuro
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, size, size);

    // Puntos luminosos aleatorios
    for (let i = 0; i < hotspots; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const radius = 10 + Math.random() * 30;
      const intensity = 0.3 + Math.random() * 0.7;

      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, `rgba(255, 255, 255, ${intensity})`);
      gradient.addColorStop(0.5, `rgba(255, 255, 255, ${intensity * 0.5})`);
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

    this.textureCache.set(key, texture);
    return texture;
  }

  /**
   * Generar Roughness Map
   */
  generateRoughnessMap(size = 512, baseRoughness = 0.7, variation = 0.3) {
    const key = `roughness_${size}_${baseRoughness}_${variation}`;

    if (this.textureCache.has(key)) {
      return this.textureCache.get(key);
    }

    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');

    const imageData = ctx.createImageData(size, size);
    const data = imageData.data;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const i = (y * size + x) * 4;

        // Perlin noise para variación
        const noise = this.perlin2D(x * 0.02, y * 0.02);
        const roughness = baseRoughness + noise * variation;
        const value = Math.max(0, Math.min(1, roughness)) * 255;

        data[i] = value;
        data[i + 1] = value;
        data[i + 2] = value;
        data[i + 3] = 255;
      }
    }

    ctx.putImageData(imageData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

    this.textureCache.set(key, texture);
    return texture;
  }

  /**
   * Generar Textura de Células (Worley/Voronoi)
   */
  generateCellularTexture(size = 512, cellCount = 50, color = '#ffffff') {
    const key = `cellular_${size}_${cellCount}_${color}`;

    if (this.textureCache.has(key)) {
      return this.textureCache.get(key);
    }

    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Generar puntos semilla
    const seeds = [];
    for (let i = 0; i < cellCount; i++) {
      seeds.push({
        x: Math.random() * size,
        y: Math.random() * size
      });
    }

    const imageData = ctx.createImageData(size, size);
    const data = imageData.data;

    // Calcular distancia a celda más cercana (Worley)
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        let minDist = Infinity;

        // Encontrar semilla más cercana
        seeds.forEach(seed => {
          const dx = x - seed.x;
          const dy = y - seed.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          minDist = Math.min(minDist, dist);
        });

        // Normalizar distancia
        const value = Math.min(255, minDist);
        const i = (y * size + x) * 4;

        data[i] = value;
        data[i + 1] = value;
        data[i + 2] = value;
        data[i + 3] = 255;
      }
    }

    ctx.putImageData(imageData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

    this.textureCache.set(key, texture);
    return texture;
  }

  /**
   * Limpiar caché de texturas
   */
  clearCache() {
    this.textureCache.forEach(texture => texture.dispose());
    this.textureCache.clear();
  }
}

// Exportar para uso en navegador
if (typeof window !== 'undefined') {
  window.ProceduralTextures = ProceduralTextures;
  // logger.debug('✅ ProceduralTextures class registered globally');
}
