// ============================================================================
// QUOTE IMAGE GENERATOR - Generador de Imágenes de Citas
// ============================================================================
// v2.9.372: Más estilos, formato cuadrado e historia, preview en tiempo real
// ============================================================================

class QuoteImageGenerator {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.currentQuote = '';
    this.currentSource = '';
    this.selectedStyle = 'cosmic';
    this.selectedFormat = 'square'; // v2.9.372: formato seleccionable

    // v2.9.372: Formatos disponibles
    this.formats = {
      square: { name: 'Cuadrado', width: 1080, height: 1080 },
      story: { name: 'Historia', width: 1080, height: 1920 },
      landscape: { name: 'Apaisado', width: 1920, height: 1080 }
    };

    // Estilos de fondo disponibles (v2.9.372: añadidos 3 más)
    this.styles = {
      cosmic: {
        name: 'Cósmico',
        gradient: ['#0f0c29', '#302b63', '#24243e'],
        textColor: '#ffffff',
        accentColor: '#60a5fa'
      },
      sunset: {
        name: 'Atardecer',
        gradient: ['#f12711', '#f5af19'],
        textColor: '#ffffff',
        accentColor: '#fde68a'
      },
      forest: {
        name: 'Bosque',
        gradient: ['#134e5e', '#71b280'],
        textColor: '#ffffff',
        accentColor: '#bbf7d0'
      },
      ocean: {
        name: 'Océano',
        gradient: ['#2193b0', '#6dd5ed'],
        textColor: '#ffffff',
        accentColor: '#ffffff'
      },
      minimal: {
        name: 'Minimalista',
        gradient: ['#f5f5f5', '#e5e5e5'],
        textColor: '#1f2937',
        accentColor: '#6b7280'
      },
      night: {
        name: 'Noche',
        gradient: ['#0f2027', '#203a43', '#2c5364'],
        textColor: '#ffffff',
        accentColor: '#a5b4fc'
      },
      aurora: {
        name: 'Aurora',
        gradient: ['#00c6ff', '#0072ff', '#7209b7'],
        textColor: '#ffffff',
        accentColor: '#c4b5fd'
      },
      warmth: {
        name: 'Calidez',
        gradient: ['#834d9b', '#d04ed6', '#f0a500'],
        textColor: '#ffffff',
        accentColor: '#fef08a'
      },
      earth: {
        name: 'Tierra',
        gradient: ['#3d2c1f', '#5c4033', '#8b5e3c'],
        textColor: '#ffffff',
        accentColor: '#d97706'
      }
    };
  }

  // ==========================================================================
  // GENERACIÓN DE IMAGEN
  // ==========================================================================

  async generate(quote, source = 'Colección Nuevo Ser') {
    this.currentQuote = quote;
    this.currentSource = source;
    this.showModal();
  }

  createCanvas() {
    // v2.9.372: Usar formato seleccionado
    const format = this.formats[this.selectedFormat] || this.formats.square;

    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
      this.ctx = this.canvas.getContext('2d');
    }

    this.canvas.width = format.width;
    this.canvas.height = format.height;

    return this.canvas;
  }

  drawImage() {
    this.createCanvas();
    const style = this.styles[this.selectedStyle];
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;

    // Fondo con gradiente
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    style.gradient.forEach((color, i) => {
      gradient.addColorStop(i / (style.gradient.length - 1), color);
    });
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Efecto decorativo (círculos sutiles)
    if (this.selectedStyle !== 'minimal') {
      ctx.globalAlpha = 0.1;
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.arc(
          Math.random() * width,
          Math.random() * height,
          100 + Math.random() * 200,
          0,
          Math.PI * 2
        );
        ctx.fillStyle = style.accentColor;
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    // Comillas decorativas
    ctx.font = 'bold 200px Georgia';
    ctx.fillStyle = style.accentColor;
    ctx.globalAlpha = 0.15;
    ctx.fillText('"', 60, 200);
    ctx.fillText('"', width - 160, height - 100);
    ctx.globalAlpha = 1;

    // Texto de la cita
    ctx.fillStyle = style.textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const maxWidth = width - 160;
    const lineHeight = 60;
    const fontSize = this.calculateFontSize(this.currentQuote, maxWidth, lineHeight);

    ctx.font = `italic ${fontSize}px Georgia`;

    const lines = this.wrapText(this.currentQuote, maxWidth);
    const totalHeight = lines.length * lineHeight;
    const startY = (height - totalHeight) / 2;

    lines.forEach((line, i) => {
      ctx.fillText(line, width / 2, startY + (i * lineHeight) + lineHeight / 2);
    });

    // Fuente
    ctx.font = '28px sans-serif';
    ctx.fillStyle = style.accentColor;
    ctx.fillText(`— ${this.currentSource}`, width / 2, height - 120);

    // Marca de agua
    ctx.font = '20px sans-serif';
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = style.textColor;
    ctx.fillText('Colección Nuevo Ser', width / 2, height - 60);
    ctx.globalAlpha = 1;

    return this.canvas;
  }

  calculateFontSize(text, _maxWidth, _lineHeight) {
    const baseSize = 48;
    const words = text.split(' ').length;

    if (words > 50) return 32;
    if (words > 30) return 38;
    if (words > 20) return 42;
    return baseSize;
  }

  wrapText(text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    // Usar un contexto temporal para medir
    this.ctx.font = `italic 48px Georgia`;

    for (const word of words) {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const metrics = this.ctx.measureText(testLine);

      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  }

  // ==========================================================================
  // MODAL UI
  // ==========================================================================

  showModal() {
    document.getElementById('quote-generator-modal')?.remove();

    const modal = document.createElement('div');
    modal.id = 'quote-generator-modal';
    modal.className = 'fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[10000] p-4';

    modal.innerHTML = `
      <div class="bg-white dark:bg-gray-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-gray-300 dark:border-slate-600">
        <!-- Header -->
        <div class="p-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
          <h2 class="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            🎨 Crear imagen de cita
          </h2>
          <button id="close-quote-generator" class="text-gray-400 hover:text-gray-600 dark:hover:text-white p-2">
            ${Icons.close(24)}
          </button>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto p-4">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Preview -->
            <div>
              <h3 class="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">Vista previa</h3>
              <div id="quote-preview-container" class="bg-gray-100 dark:bg-slate-800 rounded-lg p-4 flex items-center justify-center">
                <canvas id="quote-preview-canvas" class="max-w-full h-auto rounded-lg shadow-lg" style="max-height: 400px;"></canvas>
              </div>
            </div>

            <!-- Options -->
            <div>
              <h3 class="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">Personalizar</h3>

              <!-- v2.9.372: Format selector -->
              <div class="mb-4">
                <label class="block text-sm text-gray-700 dark:text-gray-300 mb-2">Formato</label>
                <div class="flex gap-2">
                  ${Object.entries(this.formats).map(([key, format]) => `
                    <button class="format-btn flex-1 px-3 py-2 rounded-lg text-sm font-medium transition ${
                      this.selectedFormat === key
                        ? 'ring-2 ring-purple-500 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                        : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                    }" data-format="${key}">
                      ${format.name}
                    </button>
                  `).join('')}
                </div>
              </div>

              <!-- Style selector -->
              <div class="mb-6">
                <label class="block text-sm text-gray-700 dark:text-gray-300 mb-2">Estilo de fondo</label>
                <div class="grid grid-cols-3 gap-2">
                  ${Object.entries(this.styles).map(([key, style]) => `
                    <button class="style-btn px-3 py-2 rounded-lg text-sm font-medium transition ${
                      this.selectedStyle === key
                        ? 'ring-2 ring-cyan-500 bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300'
                        : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                    }" data-style="${key}">
                      ${style.name}
                    </button>
                  `).join('')}
                </div>
              </div>

              <!-- Edit quote -->
              <div class="mb-6">
                <label class="block text-sm text-gray-700 dark:text-gray-300 mb-2">Texto de la cita</label>
                <textarea id="quote-text-input"
                          class="w-full h-32 p-3 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white resize-none">${this.escapeHtml(this.currentQuote)}</textarea>
              </div>

              <!-- Edit source -->
              <div class="mb-6">
                <label class="block text-sm text-gray-700 dark:text-gray-300 mb-2">Fuente</label>
                <input type="text" id="quote-source-input"
                       value="${this.escapeHtml(this.currentSource)}"
                       class="w-full p-3 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white">
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="p-4 border-t border-gray-200 dark:border-slate-700 flex flex-col sm:flex-row gap-3">
          <button id="download-quote-image" class="flex-1 px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-semibold transition flex items-center justify-center gap-2">
            ${Icons.download(20)} Descargar imagen
          </button>
          <button id="share-quote-image" class="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition flex items-center justify-center gap-2">
            ${Icons.share(20)} Compartir
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Dibujar preview inicial
    this.updatePreview();

    // Attach listeners
    this.attachModalListeners();
  }

  attachModalListeners() {
    // Cerrar
    document.getElementById('close-quote-generator')?.addEventListener('click', () => this.closeModal());

    // Click fuera
    document.getElementById('quote-generator-modal')?.addEventListener('click', (e) => {
      if (e.target.id === 'quote-generator-modal') this.closeModal();
    });

    // v2.9.372: Cambiar formato
    document.querySelectorAll('.format-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.selectedFormat = e.currentTarget.dataset.format;
        this.updateFormatButtons();
        this.updatePreview();
      });
    });

    // Cambiar estilo
    document.querySelectorAll('.style-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.selectedStyle = e.currentTarget.dataset.style;
        this.updateStyleButtons();
        this.updatePreview();
      });
    });

    // Actualizar texto
    document.getElementById('quote-text-input')?.addEventListener('input', (e) => {
      this.currentQuote = e.target.value;
      this.debounceUpdatePreview();
    });

    // Actualizar fuente
    document.getElementById('quote-source-input')?.addEventListener('input', (e) => {
      this.currentSource = e.target.value;
      this.debounceUpdatePreview();
    });

    // Descargar
    document.getElementById('download-quote-image')?.addEventListener('click', () => {
      this.downloadImage();
    });

    // Compartir
    document.getElementById('share-quote-image')?.addEventListener('click', () => {
      this.shareImage();
    });

    // ESC
    this.escHandler = (e) => {
      if (e.key === 'Escape') this.closeModal();
    };
    document.addEventListener('keydown', this.escHandler);
  }

  // v2.9.372: Actualizar botones de formato
  updateFormatButtons() {
    document.querySelectorAll('.format-btn').forEach(btn => {
      const isSelected = btn.dataset.format === this.selectedFormat;
      btn.classList.toggle('ring-2', isSelected);
      btn.classList.toggle('ring-purple-500', isSelected);
      btn.classList.toggle('bg-purple-50', isSelected);
      btn.classList.toggle('dark:bg-purple-900/30', isSelected);
      btn.classList.toggle('text-purple-700', isSelected);
      btn.classList.toggle('dark:text-purple-300', isSelected);
      btn.classList.toggle('bg-gray-100', !isSelected);
      btn.classList.toggle('dark:bg-slate-800', !isSelected);
    });
  }

  updateStyleButtons() {
    document.querySelectorAll('.style-btn').forEach(btn => {
      const isSelected = btn.dataset.style === this.selectedStyle;
      btn.classList.toggle('ring-2', isSelected);
      btn.classList.toggle('ring-cyan-500', isSelected);
      btn.classList.toggle('bg-cyan-50', isSelected);
      btn.classList.toggle('dark:bg-cyan-900/30', isSelected);
      btn.classList.toggle('text-cyan-700', isSelected);
      btn.classList.toggle('dark:text-cyan-300', isSelected);
      btn.classList.toggle('bg-gray-100', !isSelected);
      btn.classList.toggle('dark:bg-slate-800', !isSelected);
    });
  }

  debounceUpdatePreview() {
    clearTimeout(this.previewDebounce);
    this.previewDebounce = setTimeout(() => this.updatePreview(), 300);
  }

  updatePreview() {
    this.drawImage();

    // Crear mini canvas para preview
    const previewCanvas = document.getElementById('quote-preview-canvas');
    if (previewCanvas) {
      const previewCtx = previewCanvas.getContext('2d');
      const scale = 0.4;
      previewCanvas.width = this.canvas.width * scale;
      previewCanvas.height = this.canvas.height * scale;
      previewCtx.drawImage(this.canvas, 0, 0, previewCanvas.width, previewCanvas.height);
    }
  }

  closeModal() {
    document.removeEventListener('keydown', this.escHandler);
    const modal = document.getElementById('quote-generator-modal');
    if (modal) {
      modal.style.opacity = '0';
      setTimeout(() => modal.remove(), 200);
    }
  }

  // ==========================================================================
  // EXPORTAR Y COMPARTIR
  // ==========================================================================

  downloadImage() {
    this.drawImage();
    const link = document.createElement('a');
    link.download = `cita-${Date.now()}.png`;
    link.href = this.canvas.toDataURL('image/png');
    link.click();
    window.toast?.success('Imagen descargada');
  }

  async shareImage() {
    this.drawImage();

    try {
      const blob = await new Promise(resolve => this.canvas.toBlob(resolve, 'image/png'));
      const file = new File([blob], 'cita.png', { type: 'image/png' });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Cita - Colección Nuevo Ser',
          text: this.currentQuote.substring(0, 100) + '...'
        });
      } else {
        // Fallback: descargar
        this.downloadImage();
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        this.downloadImage();
      }
    }
  }

  // ==========================================================================
  // UTILIDADES
  // ==========================================================================

  escapeHtml(text) {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

// ==========================================================================
// SELECCIÓN DE TEXTO
// ==========================================================================

// Función helper para obtener texto seleccionado y generar imagen
function createQuoteFromSelection() {
  const selection = window.getSelection();
  const selectedText = selection?.toString().trim();

  if (!selectedText || selectedText.length < 10) {
    window.toast?.info('Selecciona un texto más largo');
    return;
  }

  if (selectedText.length > 500) {
    window.toast?.info('El texto es muy largo. Selecciona máximo 500 caracteres.');
    return;
  }

  // Obtener fuente del contexto
  let source = 'Colección Nuevo Ser';
  if (window.bookEngine) {
    const bookData = window.bookEngine.getCurrentBookData();
    if (bookData) {
      source = bookData.title;
    }
  }

  window.quoteImageGenerator.generate(selectedText, source);
}

// ==========================================================================
// INICIALIZACIÓN
// ==========================================================================

window.QuoteImageGenerator = QuoteImageGenerator;
window.createQuoteFromSelection = createQuoteFromSelection;

// Crear instancia global
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.quoteImageGenerator = new QuoteImageGenerator();
  });
} else {
  window.quoteImageGenerator = new QuoteImageGenerator();
}
