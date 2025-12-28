/**
// 🔧 FIX v2.9.198: Migrated console.log to logger
 * SISTEMA DE AVATARES GENERATIVOS V2
 * Avatares procedurales de alta calidad con detalles artísticos
 */

class AvatarSystemV2 {
  constructor() {
    this.canvasSize = 128; // Tamaño aumentado para más detalle
    this.cache = new Map();

    // Patrones y texturas
    this.patterns = ['dots', 'lines', 'waves', 'spirals', 'fractals', 'stars'];

    // Formas base más interesantes
    this.shapes = [
      'organic-blob',
      'sacred-geometry',
      'crystal',
      'mandala',
      'cosmic-eye',
      'neural-net',
      'dna-helix',
      'quantum-field'
    ];
  }

  /**
   * Generar avatar de alta calidad
   */
  generateAvatar(being, size = this.canvasSize) {
    const cacheKey = `${being.name}-${size}-v2`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Análisis del ser
    const dominantAttr = this.getDominantAttribute(being);
    const colors = this.getAdvancedColorScheme(dominantAttr, being.fitness);
    const shape = this.selectShapeForBeing(being);
    const seed = this.generateSeed(being.name);

    // Capas de renderizado (de fondo a frente)
    this.drawBackgroundGradient(ctx, size, colors);
    this.drawCosmicField(ctx, size, colors, seed);
    this.drawMainForm(ctx, size, shape, colors, being);
    this.drawInnerPattern(ctx, size, colors, seed);
    this.drawEyes(ctx, size, colors, being);
    this.drawGenerationSymbols(ctx, size, being.generation || 1, colors);
    this.drawFitnessAura(ctx, size, being.fitness, colors);
    this.drawAttributeRunes(ctx, size, being.attributes, colors);

    // Efectos especiales para seres excepcionales
    if (being.fitness >= 90) {
      this.drawLegendaryEffect(ctx, size, colors);
    } else if (being.fitness >= 80) {
      this.drawEliteGlow(ctx, size, colors);
    }

    if (being.generation >= 5) {
      this.drawEvolutionCrown(ctx, size, colors);
    }

    const dataURL = canvas.toDataURL();
    this.cache.set(cacheKey, dataURL);

    return dataURL;
  }

  /**
   * Generar seed numérico desde nombre
   */
  generateSeed(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = ((hash << 5) - hash) + name.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  /**
   * Seleccionar forma basada en atributos del ser
   */
  selectShapeForBeing(being) {
    const power = being.totalPower || 0;
    const attrs = being.attributes || {};

    if (attrs.consciousness > 80) return 'cosmic-eye';
    if (attrs.wisdom > 80) return 'mandala';
    if (attrs.strategy > 80) return 'sacred-geometry';
    if (attrs.communication > 80) return 'neural-net';
    if (attrs.resilience > 80) return 'crystal';
    if (attrs.action > 80) return 'quantum-field';

    if (power < 50) return 'organic-blob';
    if (power < 150) return 'crystal';
    if (power < 300) return 'mandala';
    return 'cosmic-eye';
  }

  /**
   * Esquema de colores avanzado
   */
  getAdvancedColorScheme(attribute, fitness) {
    const baseSchemes = {
      wisdom: {
        primary: '#6a1b9a',
        secondary: '#ab47bc',
        accent: '#e1bee7',
        dark: '#38006b',
        light: '#f3e5f5',
        glow: '#ce93d8',
        particle: '#ba68c8'
      },
      empathy: {
        primary: '#2e7d32',
        secondary: '#66bb6a',
        accent: '#c8e6c9',
        dark: '#1b5e20',
        light: '#e8f5e9',
        glow: '#81c784',
        particle: '#aed581'
      },
      action: {
        primary: '#d32f2f',
        secondary: '#f44336',
        accent: '#ffcdd2',
        dark: '#b71c1c',
        light: '#ffebee',
        glow: '#ef5350',
        particle: '#e57373'
      },
      strategy: {
        primary: '#f57c00',
        secondary: '#ffa726',
        accent: '#ffe0b2',
        dark: '#e65100',
        light: '#fff3e0',
        glow: '#ffb74d',
        particle: '#ffcc80'
      },
      communication: {
        primary: '#1976d2',
        secondary: '#42a5f5',
        accent: '#bbdefb',
        dark: '#0d47a1',
        light: '#e3f2fd',
        glow: '#64b5f6',
        particle: '#90caf9'
      },
      consciousness: {
        primary: '#00acc1',
        secondary: '#26c6da',
        accent: '#b2ebf2',
        dark: '#006064',
        light: '#e0f7fa',
        glow: '#4dd0e1',
        particle: '#80deea'
      },
      resilience: {
        primary: '#689f38',
        secondary: '#9ccc65',
        accent: '#dcedc8',
        dark: '#33691e',
        light: '#f1f8e9',
        glow: '#aed581',
        particle: '#c5e1a5'
      }
    };

    const scheme = baseSchemes[attribute] || baseSchemes.wisdom;

    // Ajustar intensidad basado en fitness
    const intensity = Math.min(1, fitness / 100);
    scheme.glowAlpha = 0.3 + (intensity * 0.5);
    scheme.brightness = 0.8 + (intensity * 0.2);

    return scheme;
  }

  /**
   * Atributo dominante
   */
  getDominantAttribute(being) {
    if (!being.attributes) return 'wisdom';

    return Object.entries(being.attributes)
      .reduce((max, [attr, value]) => value > max[1] ? [attr, value] : max, ['wisdom', 0])[0];
  }

  /**
   * Fondo con gradiente radial
   */
  drawBackgroundGradient(ctx, size, colors) {
    const gradient = ctx.createRadialGradient(
      size / 2, size / 2, 0,
      size / 2, size / 2, size / 2
    );

    gradient.addColorStop(0, colors.light);
    gradient.addColorStop(0.5, colors.primary);
    gradient.addColorStop(1, colors.dark);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  }

  /**
   * Campo cósmico de fondo
   */
  drawCosmicField(ctx, size, colors, seed) {
    ctx.save();

    // Partículas estelares
    const particleCount = 30;
    for (let i = 0; i < particleCount; i++) {
      const x = ((seed * i * 73) % size);
      const y = ((seed * i * 137) % size);
      const radius = ((seed * i) % 3) + 1;

      ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + ((seed * i) % 50) / 100})`;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  /**
   * Forma principal del ser
   */
  drawMainForm(ctx, size, shape, colors, being) {
    ctx.save();
    ctx.translate(size / 2, size / 2);

    switch (shape) {
      case 'cosmic-eye':
        this.drawCosmicEye(ctx, size * 0.35, colors);
        break;
      case 'mandala':
        this.drawMandala(ctx, size * 0.4, colors, 8);
        break;
      case 'sacred-geometry':
        this.drawSacredGeometry(ctx, size * 0.35, colors);
        break;
      case 'crystal':
        this.drawCrystal(ctx, size * 0.4, colors);
        break;
      case 'neural-net':
        this.drawNeuralNet(ctx, size * 0.4, colors);
        break;
      case 'dna-helix':
        this.drawDNAHelix(ctx, size * 0.4, colors);
        break;
      case 'quantum-field':
        this.drawQuantumField(ctx, size * 0.4, colors);
        break;
      default:
        this.drawOrganicBlob(ctx, size * 0.35, colors);
    }

    ctx.restore();
  }

  /**
   * Ojo cósmico
   */
  drawCosmicEye(ctx, radius, colors) {
    // Óvalo exterior
    ctx.fillStyle = colors.primary;
    ctx.beginPath();
    ctx.ellipse(0, 0, radius * 1.5, radius, 0, 0, Math.PI * 2);
    ctx.fill();

    // Iris
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 0.8);
    gradient.addColorStop(0, colors.accent);
    gradient.addColorStop(0.5, colors.secondary);
    gradient.addColorStop(1, colors.primary);

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.8, 0, Math.PI * 2);
    ctx.fill();

    // Pupila
    ctx.fillStyle = colors.dark;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Brillo
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    ctx.arc(-radius * 0.15, -radius * 0.15, radius * 0.15, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * Mandala fractal
   */
  drawMandala(ctx, radius, colors, petals) {
    const layers = 4;

    for (let layer = layers; layer > 0; layer--) {
      const layerRadius = radius * (layer / layers);
      const petalCount = petals * layer;

      ctx.fillStyle = layer % 2 === 0 ? colors.primary : colors.secondary;

      for (let i = 0; i < petalCount; i++) {
        const angle = (Math.PI * 2 * i) / petalCount;

        ctx.save();
        ctx.rotate(angle);

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(layerRadius * 0.7, 0, layerRadius * 0.3, -Math.PI / 4, Math.PI / 4);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
      }
    }

    // Centro
    ctx.fillStyle = colors.accent;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.15, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * Geometría sagrada (Flor de la vida)
   */
  drawSacredGeometry(ctx, radius, colors) {
    const positions = [
      [0, 0],
      [radius, 0], [-radius, 0],
      [radius * 0.5, radius * 0.866], [-radius * 0.5, radius * 0.866],
      [radius * 0.5, -radius * 0.866], [-radius * 0.5, -radius * 0.866]
    ];

    ctx.strokeStyle = colors.primary;
    ctx.lineWidth = 2;

    positions.forEach(([x, y]) => {
      ctx.beginPath();
      ctx.arc(x, y, radius * 0.6, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Centro brillante
    ctx.fillStyle = colors.accent;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.2, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * Cristal facetado
   */
  drawCrystal(ctx, radius, colors) {
    const sides = 8;

    // Facetas externas
    for (let i = 0; i < sides; i++) {
      const angle = (Math.PI * 2 * i) / sides;
      const nextAngle = (Math.PI * 2 * (i + 1)) / sides;

      const gradient = ctx.createLinearGradient(
        Math.cos(angle) * radius, Math.sin(angle) * radius,
        0, 0
      );
      gradient.addColorStop(0, colors.primary);
      gradient.addColorStop(1, colors.secondary);

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
      ctx.lineTo(Math.cos(nextAngle) * radius, Math.sin(nextAngle) * radius);
      ctx.closePath();
      ctx.fill();

      // Borde brillante
      ctx.strokeStyle = colors.accent;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  /**
   * Red neuronal
   */
  drawNeuralNet(ctx, radius, colors) {
    const nodes = 12;
    const positions = [];

    // Posiciones de nodos
    for (let i = 0; i < nodes; i++) {
      const angle = (Math.PI * 2 * i) / nodes;
      positions.push([
        Math.cos(angle) * radius,
        Math.sin(angle) * radius
      ]);
    }

    // Conexiones
    ctx.strokeStyle = colors.primary + '40';
    ctx.lineWidth = 1;

    for (let i = 0; i < nodes; i++) {
      for (let j = i + 1; j < nodes; j++) {
        if (Math.random() > 0.6) {
          ctx.beginPath();
          ctx.moveTo(positions[i][0], positions[i][1]);
          ctx.lineTo(positions[j][0], positions[j][1]);
          ctx.stroke();
        }
      }
    }

    // Nodos
    positions.forEach(([x, y]) => {
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius * 0.08);
      gradient.addColorStop(0, colors.accent);
      gradient.addColorStop(1, colors.primary);

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, radius * 0.08, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  /**
   * Hélice de ADN
   */
  drawDNAHelix(ctx, radius, colors) {
    const turns = 3;
    const segments = 20;

    for (let i = 0; i < segments; i++) {
      const t = i / segments;
      const angle = t * Math.PI * 2 * turns;

      // Primera hebra
      const x1 = Math.cos(angle) * radius * 0.5;
      const y1 = (t - 0.5) * radius * 2;

      // Segunda hebra (opuesta)
      const x2 = Math.cos(angle + Math.PI) * radius * 0.5;
      const y2 = y1;

      // Conexión
      ctx.strokeStyle = colors.primary + '60';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      // Nucleótidos
      ctx.fillStyle = colors.secondary;
      ctx.beginPath();
      ctx.arc(x1, y1, radius * 0.08, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(x2, y2, radius * 0.08, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /**
   * Campo cuántico
   */
  drawQuantumField(ctx, radius, colors) {
    const particles = 50;

    for (let i = 0; i < particles; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * radius;
      const x = Math.cos(angle) * dist;
      const y = Math.sin(angle) * dist;
      const size = Math.random() * 3 + 1;

      const alpha = 1 - (dist / radius);
      ctx.fillStyle = colors.particle + Math.floor(alpha * 255).toString(16).padStart(2, '0');

      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /**
   * Blob orgánico
   */
  drawOrganicBlob(ctx, radius, colors) {
    const points = 8;
    const variance = 0.3;

    ctx.fillStyle = colors.primary;
    ctx.beginPath();

    for (let i = 0; i <= points; i++) {
      const angle = (Math.PI * 2 * i) / points;
      const randomRadius = radius * (1 + (Math.random() - 0.5) * variance);
      const x = Math.cos(angle) * randomRadius;
      const y = Math.sin(angle) * randomRadius;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.closePath();
    ctx.fill();

    // Sombra interna
    ctx.fillStyle = colors.dark + '60';
    ctx.fill();
  }

  /**
   * Patrón interno decorativo
   */
  drawInnerPattern(ctx, size, colors, seed) {
    ctx.save();
    ctx.translate(size / 2, size / 2);
    ctx.globalAlpha = 0.3;

    const lines = 20;
    for (let i = 0; i < lines; i++) {
      const angle = (Math.PI * 2 * i) / lines + (seed % 100) / 100;
      const length = size * 0.25;

      ctx.strokeStyle = colors.accent;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(angle) * length, Math.sin(angle) * length);
      ctx.stroke();
    }

    ctx.restore();
  }

  /**
   * Ojos expresivos
   */
  drawEyes(ctx, size, colors, being) {
    const baseX = size / 2;
    const baseY = size / 2 - size * 0.1;
    const eyeSpacing = size * 0.15;
    const eyeSize = size * 0.08;

    // Ojo izquierdo
    this.drawSingleEye(ctx, baseX - eyeSpacing, baseY, eyeSize, colors);

    // Ojo derecho
    this.drawSingleEye(ctx, baseX + eyeSpacing, baseY, eyeSize, colors);
  }

  /**
   * Un solo ojo
   */
  drawSingleEye(ctx, x, y, size, colors) {
    // Blanco del ojo
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();

    // Iris
    ctx.fillStyle = colors.primary;
    ctx.beginPath();
    ctx.arc(x, y, size * 0.6, 0, Math.PI * 2);
    ctx.fill();

    // Pupila
    ctx.fillStyle = colors.dark;
    ctx.beginPath();
    ctx.arc(x, y, size * 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Brillo
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    ctx.arc(x - size * 0.1, y - size * 0.1, size * 0.15, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * Símbolos de generación (como estrellas o marcas)
   */
  drawGenerationSymbols(ctx, size, generation, colors) {
    ctx.save();

    const symbolSize = size * 0.06;
    const startX = size * 0.1;
    const y = size * 0.9;

    for (let i = 0; i < Math.min(generation, 10); i++) {
      const x = startX + (i * symbolSize * 1.5);
      this.drawStar(ctx, x, y, symbolSize * 0.5, colors.accent);
    }

    ctx.restore();
  }

  /**
   * Estrella
   */
  drawStar(ctx, x, y, radius, color) {
    const points = 5;
    const innerRadius = radius * 0.4;

    ctx.fillStyle = color;
    ctx.beginPath();

    for (let i = 0; i < points * 2; i++) {
      const angle = (Math.PI * i) / points - Math.PI / 2;
      const r = i % 2 === 0 ? radius : innerRadius;
      const px = x + Math.cos(angle) * r;
      const py = y + Math.sin(angle) * r;

      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }

    ctx.closePath();
    ctx.fill();
  }

  /**
   * Aura de fitness
   */
  drawFitnessAura(ctx, size, fitness, colors) {
    if (fitness < 60) return;

    ctx.save();
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size * 0.5;
    const alpha = (fitness - 60) / 40 * 0.5;

    const gradient = ctx.createRadialGradient(
      centerX, centerY, radius * 0.3,
      centerX, centerY, radius
    );
    gradient.addColorStop(0, colors.glow + Math.floor(alpha * 255).toString(16).padStart(2, '0'));
    gradient.addColorStop(1, colors.glow + '00');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    ctx.restore();
  }

  /**
   * Runas de atributos alrededor
   */
  drawAttributeRunes(ctx, size, attributes, colors) {
    if (!attributes) return;

    ctx.save();
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size * 0.42;

    const sortedAttrs = Object.entries(attributes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3); // Top 3 atributos

    sortedAttrs.forEach(([attr, value], index) => {
      const angle = (Math.PI * 2 * index) / 3 - Math.PI / 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      const runeSymbol = this.getRuneForAttribute(attr);

      ctx.fillStyle = colors.accent;
      ctx.font = `${size * 0.1}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(runeSymbol, x, y);
    });

    ctx.restore();
  }

  /**
   * Símbolo rúnico por atributo
   */
  getRuneForAttribute(attribute) {
    const runes = {
      wisdom: '◈',
      empathy: '❤',
      action: '⚡',
      strategy: '⚔',
      communication: '◎',
      consciousness: '☯',
      resilience: '◆',
      courage: '✦'
    };

    return runes[attribute] || '●';
  }

  /**
   * Efecto legendario (fitness >= 90)
   */
  drawLegendaryEffect(ctx, size, colors) {
    ctx.save();

    const centerX = size / 2;
    const centerY = size / 2;

    // Anillo de energía
    for (let i = 0; i < 3; i++) {
      const radius = size * (0.5 + i * 0.05);

      ctx.strokeStyle = colors.accent + '80';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Rayos de luz
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 * i) / 12;
      const startRadius = size * 0.4;
      const endRadius = size * 0.6;

      const gradient = ctx.createLinearGradient(
        centerX + Math.cos(angle) * startRadius,
        centerY + Math.sin(angle) * startRadius,
        centerX + Math.cos(angle) * endRadius,
        centerY + Math.sin(angle) * endRadius
      );
      gradient.addColorStop(0, colors.accent);
      gradient.addColorStop(1, colors.accent + '00');

      ctx.strokeStyle = gradient;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(
        centerX + Math.cos(angle) * startRadius,
        centerY + Math.sin(angle) * startRadius
      );
      ctx.lineTo(
        centerX + Math.cos(angle) * endRadius,
        centerY + Math.sin(angle) * endRadius
      );
      ctx.stroke();
    }

    ctx.restore();
  }

  /**
   * Resplandor élite (fitness >= 80)
   */
  drawEliteGlow(ctx, size, colors) {
    ctx.save();

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size * 0.48;

    ctx.strokeStyle = colors.accent + 'CC';
    ctx.lineWidth = 3;
    ctx.shadowColor = colors.glow;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Corona evolutiva (generación >= 5)
   */
  drawEvolutionCrown(ctx, size, colors) {
    ctx.save();

    const centerX = size / 2;
    const centerY = size * 0.15;
    const crownWidth = size * 0.3;
    const crownHeight = size * 0.08;

    // Base de la corona
    ctx.fillStyle = colors.accent;
    ctx.beginPath();
    ctx.moveTo(centerX - crownWidth / 2, centerY + crownHeight);
    ctx.lineTo(centerX - crownWidth / 2, centerY);
    ctx.lineTo(centerX - crownWidth / 4, centerY - crownHeight / 2);
    ctx.lineTo(centerX, centerY);
    ctx.lineTo(centerX + crownWidth / 4, centerY - crownHeight / 2);
    ctx.lineTo(centerX + crownWidth / 2, centerY);
    ctx.lineTo(centerX + crownWidth / 2, centerY + crownHeight);
    ctx.closePath();
    ctx.fill();

    // Gemas
    [-crownWidth / 4, 0, crownWidth / 4].forEach(offset => {
      ctx.fillStyle = colors.glow;
      ctx.beginPath();
      ctx.arc(centerX + offset, centerY, size * 0.02, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
  }

  /**
   * Limpiar cache
   */
  clearCache() {
    this.cache.clear();
    // logger.debug('🎨 Avatar cache limpiado');
  }

  /**
   * Obtener estadísticas del cache
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      maxSize: 100
    };
  }
}

// Exportar
window.AvatarSystemV2 = AvatarSystemV2;
// logger.debug('🎨 Avatar System V2 cargado - Avatares de alta calidad');
