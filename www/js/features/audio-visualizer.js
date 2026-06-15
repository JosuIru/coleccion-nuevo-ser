// ============================================================================
// AUDIO VISUALIZER - Visualizador de espectro en tiempo real
// ============================================================================
// Muestra una representación visual del audio que se está reproduciendo

// 🔧 FIX v2.9.198: Migrated console.log to logger
class AudioVisualizer {
  constructor(audioContext) {
    this.audioContext = audioContext;
    this.analyser = null;
    this.canvas = null;
    this.canvasContext = null;
    this.animationId = null;
    this.isActive = false;

    // Configuración del visualizador
    this.fftSize = 256; // Tamaño de la FFT (más pequeño = menos barras pero más rápido)
    this.smoothingTimeConstant = 0.8; // Suavizado de la visualización (0-1)

    // Estilo
    this.barWidth = 3;
    this.barGap = 1;
    this.barColor = '#06b6d4'; // Cyan
    this.backgroundColor = 'rgba(15, 23, 42, 0.8)'; // Slate-900/80
  }

  // ==========================================================================
  // INICIALIZACIÓN
  // ==========================================================================

  initialize(sourceNode) {
    if (!this.audioContext) {
      // logger.warn('No hay AudioContext disponible');
      return false;
    }

    try {
      // Crear nodo analizador
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = this.fftSize;
      this.analyser.smoothingTimeConstant = this.smoothingTimeConstant;

      // Conectar el nodo fuente al analizador
      if (sourceNode) {
        sourceNode.connect(this.analyser);
      }

      // logger.debug('✅ AudioVisualizer inicializado');
      return true;
    } catch (error) {
      logger.error('❌ Error inicializando AudioVisualizer:', error);
      return false;
    }
  }

  // ==========================================================================
  // CREAR CANVAS
  // ==========================================================================

  createCanvas(containerId, width = 300, height = 80) {
    const container = document.getElementById(containerId);
    if (!container) {
      // logger.warn('Contenedor no encontrado:', containerId);
      return null;
    }

    // Remover canvas existente
    const existing = container.querySelector('.audio-visualizer-canvas');
    if (existing) existing.remove();

    // Crear nuevo canvas
    const canvas = document.createElement('canvas');
    canvas.className = 'audio-visualizer-canvas';
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = '100%';
    canvas.style.height = `${height}px`;
    canvas.style.borderRadius = '8px';
    canvas.style.backgroundColor = this.backgroundColor;

    container.appendChild(canvas);

    this.canvas = canvas;
    this.canvasContext = canvas.getContext('2d');

    return canvas;
  }

  // ==========================================================================
  // RENDERIZADO
  // ==========================================================================

  start() {
    if (!this.analyser || !this.canvas) {
      // logger.warn('Analyser o Canvas no inicializado');
      return;
    }

    this.isActive = true;
    this.draw();
  }

  stop() {
    this.isActive = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    // Limpiar canvas
    if (this.canvasContext && this.canvas) {
      this.canvasContext.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  draw() {
    if (!this.isActive) return;

    this.animationId = requestAnimationFrame(() => this.draw());

    // Obtener datos de frecuencia
    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteFrequencyData(dataArray);

    // Limpiar canvas
    this.canvasContext.fillStyle = this.backgroundColor;
    this.canvasContext.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Calcular ancho de barras
    const barTotalWidth = this.barWidth + this.barGap;
    const numBars = Math.floor(this.canvas.width / barTotalWidth);

    // Dibujar barras
    for (let i = 0; i < numBars; i++) {
      // Obtener valor promediado de frecuencia
      const dataIndex = Math.floor(i * bufferLength / numBars);
      const value = dataArray[dataIndex];

      // Calcular altura de barra (normalizada)
      const barHeight = (value / 255) * this.canvas.height;

      // Calcular posición
      const x = i * barTotalWidth;
      const y = this.canvas.height - barHeight;

      // Crear gradiente para la barra
      const gradient = this.canvasContext.createLinearGradient(0, y, 0, this.canvas.height);
      gradient.addColorStop(0, this.barColor);
      gradient.addColorStop(1, this.adjustColorOpacity(this.barColor, 0.5));

      // Dibujar barra
      this.canvasContext.fillStyle = gradient;
      this.canvasContext.fillRect(x, y, this.barWidth, barHeight);
    }
  }

  // ==========================================================================
  // ESTILOS DE VISUALIZACIÓN
  // ==========================================================================

  setStyle(style) {
    const styles = this.getStyles();
    const selectedStyle = styles[style];

    if (selectedStyle) {
      this.barColor = selectedStyle.barColor;
      this.backgroundColor = selectedStyle.backgroundColor;
      this.barWidth = selectedStyle.barWidth || this.barWidth;
      this.barGap = selectedStyle.barGap || this.barGap;
    }
  }

  getStyles() {
    return {
      CYAN: {
        name: 'Cyan (Defecto)',
        barColor: '#06b6d4',
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        barWidth: 3,
        barGap: 1
      },

      PURPLE: {
        name: 'Púrpura',
        barColor: '#a855f7',
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        barWidth: 3,
        barGap: 1
      },

      GREEN: {
        name: 'Verde',
        barColor: '#10b981',
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        barWidth: 3,
        barGap: 1
      },

      ORANGE: {
        name: 'Naranja',
        barColor: '#f97316',
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        barWidth: 3,
        barGap: 1
      },

      RAINBOW: {
        name: 'Arco Iris',
        barColor: '#06b6d4', // Se sobrescribe en draw
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        barWidth: 3,
        barGap: 1,
        isRainbow: true
      },

      MINIMAL: {
        name: 'Minimalista',
        barColor: '#94a3b8',
        backgroundColor: 'transparent',
        barWidth: 2,
        barGap: 2
      },

      RETRO: {
        name: 'Retro',
        barColor: '#22c55e',
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        barWidth: 4,
        barGap: 2
      }
    };
  }

  // ==========================================================================
  // MODOS DE VISUALIZACIÓN
  // ==========================================================================

  drawCircular() {
    if (!this.isActive) return;

    this.animationId = requestAnimationFrame(() => this.drawCircular());

    // Obtener datos
    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteFrequencyData(dataArray);

    // Limpiar
    this.canvasContext.fillStyle = this.backgroundColor;
    this.canvasContext.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Centro del canvas
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 20;

    // Dibujar círculo base
    this.canvasContext.strokeStyle = 'rgba(100, 116, 139, 0.3)';
    this.canvasContext.lineWidth = 2;
    this.canvasContext.beginPath();
    this.canvasContext.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    this.canvasContext.stroke();

    // Dibujar barras radiales
    const numBars = 64;
    const angleStep = (2 * Math.PI) / numBars;

    for (let i = 0; i < numBars; i++) {
      const dataIndex = Math.floor(i * bufferLength / numBars);
      const value = dataArray[dataIndex];
      const barHeight = (value / 255) * (radius * 0.6);

      const angle = i * angleStep - Math.PI / 2;

      const x1 = centerX + Math.cos(angle) * radius;
      const y1 = centerY + Math.sin(angle) * radius;
      const x2 = centerX + Math.cos(angle) * (radius + barHeight);
      const y2 = centerY + Math.sin(angle) * (radius + barHeight);

      // Gradiente
      const gradient = this.canvasContext.createLinearGradient(x1, y1, x2, y2);
      gradient.addColorStop(0, this.adjustColorOpacity(this.barColor, 0.3));
      gradient.addColorStop(1, this.barColor);

      this.canvasContext.strokeStyle = gradient;
      this.canvasContext.lineWidth = 3;
      this.canvasContext.beginPath();
      this.canvasContext.moveTo(x1, y1);
      this.canvasContext.lineTo(x2, y2);
      this.canvasContext.stroke();
    }
  }

  drawWaveform() {
    if (!this.isActive) return;

    this.animationId = requestAnimationFrame(() => this.drawWaveform());

    // Obtener datos de forma de onda
    const bufferLength = this.analyser.fftSize;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteTimeDomainData(dataArray);

    // Limpiar
    this.canvasContext.fillStyle = this.backgroundColor;
    this.canvasContext.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Dibujar línea
    this.canvasContext.lineWidth = 2;
    this.canvasContext.strokeStyle = this.barColor;
    this.canvasContext.beginPath();

    const sliceWidth = this.canvas.width / bufferLength;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0;
      const y = v * this.canvas.height / 2;

      if (i === 0) {
        this.canvasContext.moveTo(x, y);
      } else {
        this.canvasContext.lineTo(x, y);
      }

      x += sliceWidth;
    }

    this.canvasContext.lineTo(this.canvas.width, this.canvas.height / 2);
    this.canvasContext.stroke();
  }

  // ==========================================================================
  // UTILIDADES
  // ==========================================================================

  adjustColorOpacity(color, opacity) {
    // Convertir hex a rgba
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  setMode(mode) {
    // Detener animación actual
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }

    // Iniciar nuevo modo
    switch (mode) {
      case 'BARS':
        this.draw();
        break;
      case 'CIRCULAR':
        this.drawCircular();
        break;
      case 'WAVEFORM':
        this.drawWaveform();
        break;
      default:
        this.draw();
    }
  }

  // ==========================================================================
  // CONFIGURACIÓN
  // ==========================================================================

  setFFTSize(size) {
    // Debe ser potencia de 2: 32, 64, 128, 256, 512, 1024, 2048, etc.
    if (this.analyser) {
      this.analyser.fftSize = size;
    }
  }

  setSmoothing(value) {
    // 0 = sin suavizado, 1 = suavizado máximo
    if (this.analyser) {
      this.analyser.smoothingTimeConstant = Math.max(0, Math.min(1, value));
    }
  }

  // ==========================================================================
  // INFORMACIÓN
  // ==========================================================================

  getFrequencyData() {
    if (!this.analyser) return null;

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteFrequencyData(dataArray);

    return dataArray;
  }

  getAverageFrequency() {
    const data = this.getFrequencyData();
    if (!data) return 0;

    const sum = data.reduce((acc, val) => acc + val, 0);
    return sum / data.length;
  }

  // ==========================================================================
  // LIMPIEZA
  // ==========================================================================

  destroy() {
    this.stop();

    if (this.analyser) {
      this.analyser.disconnect();
      this.analyser = null;
    }

    if (this.canvas) {
      this.canvas.remove();
      this.canvas = null;
    }

    this.canvasContext = null;
    this.isActive = false;
  }
}

// Exportar
window.AudioVisualizer = AudioVisualizer;

if (typeof module !== 'undefined' && module.exports) {
  module.exports = AudioVisualizer;
}
