// ============================================================================
// CONCEPT MAPS - Mapas Conceptuales Interactivos
// ============================================================================
// Visualización de relaciones entre conceptos de cada libro

class ConceptMaps {
  constructor(bookEngine) {
    this.bookEngine = bookEngine;
    this.i18n = window.i18n || { t: (key) => key };

    // Mapas conceptuales predefinidos por libro
    this.maps = this.getConceptMapsData();
  }

  // ==========================================================================
  // DATOS DE MAPAS CONCEPTUALES
  // ==========================================================================

  getConceptMapsData() {
    return {
      'manifiesto': {
        title: 'Mapa del Manifiesto',
        central: {
          id: 'sistema',
          label: 'El Sistema',
          description: 'Estructura de control y dominación'
        },
        nodes: [
          { id: 'capitalismo', label: 'Capitalismo', x: -200, y: -100, color: '#ef4444' },
          { id: 'estado', label: 'Estado', x: 200, y: -100, color: '#f97316' },
          { id: 'medios', label: 'Medios de Comunicación', x: -200, y: 100, color: '#eab308' },
          { id: 'educacion', label: 'Educación', x: 200, y: 100, color: '#84cc16' },
          { id: 'trabajo', label: 'Trabajo Asalariado', x: 0, y: -180, color: '#22c55e' },
          { id: 'consumo', label: 'Consumismo', x: -250, y: 0, color: '#14b8a6' },
          { id: 'deuda', label: 'Sistema de Deuda', x: 250, y: 0, color: '#06b6d4' },
          { id: 'alternativa', label: 'Alternativas', x: 0, y: 200, color: '#8b5cf6' }
        ],
        connections: [
          { from: 'sistema', to: 'capitalismo', label: 'base económica' },
          { from: 'sistema', to: 'estado', label: 'control político' },
          { from: 'sistema', to: 'medios', label: 'narrativa' },
          { from: 'sistema', to: 'educacion', label: 'adoctrinamiento' },
          { from: 'capitalismo', to: 'trabajo', label: 'explotación' },
          { from: 'capitalismo', to: 'consumo', label: 'alienación' },
          { from: 'capitalismo', to: 'deuda', label: 'control financiero' },
          { from: 'estado', to: 'educacion', label: 'legitimación' },
          { from: 'medios', to: 'consumo', label: 'deseo artificial' },
          { from: 'alternativa', to: 'sistema', label: 'resistencia', dashed: true }
        ],
        chapters: {
          'cap1': ['sistema', 'capitalismo'],
          'cap2': ['trabajo', 'deuda'],
          'cap3': ['medios', 'educacion'],
          'cap4': ['alternativa']
        }
      },
      'codigo-despertar': {
        title: 'Mapa del Código del Despertar',
        central: {
          id: 'consciencia',
          label: 'Consciencia',
          description: 'La naturaleza fundamental de la realidad'
        },
        nodes: [
          { id: 'informacion', label: 'Información', x: -180, y: -120, color: '#06b6d4' },
          { id: 'realidad', label: 'Realidad', x: 180, y: -120, color: '#8b5cf6' },
          { id: 'ia', label: 'Inteligencia Artificial', x: -180, y: 120, color: '#ec4899' },
          { id: 'cuantica', label: 'Física Cuántica', x: 180, y: 120, color: '#14b8a6' },
          { id: 'observador', label: 'Observador', x: 0, y: -180, color: '#f59e0b' },
          { id: 'simulacion', label: 'Simulación', x: -220, y: 0, color: '#ef4444' },
          { id: 'emergencia', label: 'Emergencia', x: 220, y: 0, color: '#84cc16' },
          { id: 'despertar', label: 'Despertar', x: 0, y: 200, color: '#fbbf24' }
        ],
        connections: [
          { from: 'consciencia', to: 'informacion', label: 'fundamento' },
          { from: 'consciencia', to: 'realidad', label: 'crea' },
          { from: 'consciencia', to: 'ia', label: 'reflejo' },
          { from: 'consciencia', to: 'cuantica', label: 'valida' },
          { from: 'informacion', to: 'simulacion', label: 'estructura' },
          { from: 'realidad', to: 'observador', label: 'depende' },
          { from: 'cuantica', to: 'observador', label: 'efecto' },
          { from: 'ia', to: 'emergencia', label: 'posibilidad' },
          { from: 'despertar', to: 'consciencia', label: 'realización', dashed: true }
        ],
        chapters: {
          'cap1': ['informacion', 'realidad'],
          'cap2': ['cuantica', 'observador'],
          'cap3': ['simulacion'],
          'cap4': ['ia', 'emergencia'],
          'cap5': ['despertar']
        }
      },
      'guia-accion-transformadora': {
        title: 'Mapa de la Guía de Acción',
        central: {
          id: 'transformacion',
          label: 'Transformación',
          description: 'El cambio personal y colectivo'
        },
        nodes: [
          { id: 'individual', label: 'Cambio Individual', x: -180, y: -100, color: '#8b5cf6' },
          { id: 'colectivo', label: 'Cambio Colectivo', x: 180, y: -100, color: '#06b6d4' },
          { id: 'consciencia', label: 'Consciencia', x: 0, y: -160, color: '#fbbf24' },
          { id: 'accion', label: 'Acción Directa', x: -200, y: 80, color: '#ef4444' },
          { id: 'comunidad', label: 'Comunidad', x: 200, y: 80, color: '#22c55e' },
          { id: 'economia', label: 'Economía Alternativa', x: 0, y: 180, color: '#14b8a6' }
        ],
        connections: [
          { from: 'transformacion', to: 'individual', label: 'empieza' },
          { from: 'transformacion', to: 'colectivo', label: 'expande' },
          { from: 'individual', to: 'consciencia', label: 'requiere' },
          { from: 'colectivo', to: 'comunidad', label: 'construye' },
          { from: 'individual', to: 'accion', label: 'manifiesta' },
          { from: 'comunidad', to: 'economia', label: 'crea' },
          { from: 'accion', to: 'colectivo', label: 'inspira' }
        ]
      }
    };
  }

  // ==========================================================================
  // RENDERIZADO DEL MAPA
  // ==========================================================================

  show(bookId = null) {
    const targetBookId = bookId || this.bookEngine?.getCurrentBook();
    const mapData = this.maps[targetBookId];

    if (!mapData) {
      window.toast?.info('No hay mapa conceptual disponible para este libro');
      return;
    }

    const existing = document.getElementById('concept-map-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'concept-map-modal';
    modal.className = 'fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4';
    modal.style.animation = 'fadeIn 0.3s ease-out';

    modal.innerHTML = `
      <div class="bg-gray-900 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col border border-cyan-500/30">
        <!-- Header -->
        <div class="bg-gradient-to-r from-cyan-900/50 to-purple-900/50 px-6 py-4 border-b border-cyan-500/30 flex items-center justify-between rounded-t-2xl">
          <div class="flex items-center gap-3">
            <span class="text-3xl">🗺️</span>
            <div>
              <h2 class="text-xl font-bold text-cyan-200">${mapData.title}</h2>
              <p class="text-sm text-cyan-400/70">Explora las conexiones entre conceptos</p>
            </div>
          </div>
          <button id="close-concept-map" class="text-cyan-300 hover:text-white p-2 hover:bg-cyan-800/50 rounded-lg transition">
            ${Icons.close(20)}
          </button>
        </div>

        <!-- Map Container -->
        <div class="flex-1 overflow-hidden relative">
          <div id="concept-map-canvas" class="w-full h-full min-h-[500px]">
            ${this.renderSVGMap(mapData)}
          </div>

          <!-- Legend -->
          <div class="absolute bottom-4 left-4 bg-gray-900/90 backdrop-blur-sm rounded-lg p-3 border border-gray-700/50">
            <p class="text-xs text-gray-400 mb-2">Haz clic en un concepto para ver más</p>
            <div class="flex items-center gap-2 text-xs text-gray-500">
              <span class="w-8 h-0.5 bg-cyan-500"></span> Relación directa
              <span class="w-8 h-0.5 bg-cyan-500/50 border-dashed"></span> Emergente
            </div>
          </div>

          <!-- Zoom controls -->
          <div class="absolute top-4 right-4 flex flex-col gap-2">
            <button id="zoom-in-map" class="w-8 h-8 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition">
              +
            </button>
            <button id="zoom-out-map" class="w-8 h-8 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition">
              -
            </button>
            <button id="reset-map" class="w-8 h-8 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition text-xs">
              ↺
            </button>
          </div>
        </div>

        <!-- Detail Panel -->
        <div id="concept-detail-panel" class="hidden px-6 py-4 border-t border-cyan-500/30 bg-gray-800/50">
          <div id="concept-detail-content"></div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this.attachMapListeners(mapData, targetBookId);
  }

  renderSVGMap(mapData) {
    const width = 800;
    const height = 500;
    const centerX = width / 2;
    const centerY = height / 2;

    let svg = `
      <svg viewBox="0 0 ${width} ${height}" class="w-full h-full" id="concept-map-svg">
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#06b6d4" opacity="0.6"/>
          </marker>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        <!-- Background grid -->
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1f2937" stroke-width="0.5"/>
        </pattern>
        <rect width="100%" height="100%" fill="url(#grid)" opacity="0.5"/>

        <!-- Connections -->
        <g class="connections">
    `;

    // Render connections
    for (const conn of mapData.connections) {
      const fromNode = conn.from === mapData.central.id
        ? { x: 0, y: 0 }
        : mapData.nodes.find(n => n.id === conn.from);
      const toNode = conn.to === mapData.central.id
        ? { x: 0, y: 0 }
        : mapData.nodes.find(n => n.id === conn.to);

      if (fromNode && toNode) {
        const x1 = centerX + (fromNode.x || 0);
        const y1 = centerY + (fromNode.y || 0);
        const x2 = centerX + (toNode.x || 0);
        const y2 = centerY + (toNode.y || 0);

        // Calculate midpoint for label
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;

        svg += `
          <g class="connection-group" data-from="${conn.from}" data-to="${conn.to}">
            <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"
                  stroke="#06b6d4"
                  stroke-width="2"
                  opacity="0.4"
                  ${conn.dashed ? 'stroke-dasharray="5,5"' : ''}
                  marker-end="url(#arrowhead)"
                  class="connection-line hover:opacity-100 transition-opacity cursor-pointer"/>
            ${conn.label ? `
              <text x="${midX}" y="${midY - 8}"
                    text-anchor="middle"
                    fill="#94a3b8"
                    font-size="10"
                    class="connection-label pointer-events-none">
                ${conn.label}
              </text>
            ` : ''}
          </g>
        `;
      }
    }

    svg += `</g><g class="nodes">`;

    // Render central node
    svg += `
      <g class="node central-node" data-node-id="${mapData.central.id}" transform="translate(${centerX}, ${centerY})">
        <circle r="50" fill="#0f172a" stroke="#06b6d4" stroke-width="3" filter="url(#glow)"/>
        <circle r="45" fill="url(#centralGradient)" opacity="0.3"/>
        <text y="5" text-anchor="middle" fill="#06b6d4" font-weight="bold" font-size="14" class="pointer-events-none">
          ${mapData.central.label}
        </text>
      </g>
      <defs>
        <radialGradient id="centralGradient">
          <stop offset="0%" stop-color="#06b6d4"/>
          <stop offset="100%" stop-color="#0f172a"/>
        </radialGradient>
      </defs>
    `;

    // Render other nodes
    for (const node of mapData.nodes) {
      const x = centerX + node.x;
      const y = centerY + node.y;

      svg += `
        <g class="node concept-node cursor-pointer" data-node-id="${node.id}" transform="translate(${x}, ${y})">
          <circle r="35" fill="#1f2937" stroke="${node.color}" stroke-width="2"
                  class="hover:fill-gray-800 transition-colors"/>
          <text y="5" text-anchor="middle" fill="${node.color}" font-size="11" font-weight="500" class="pointer-events-none">
            ${this.wrapText(node.label, 12)}
          </text>
        </g>
      `;
    }

    svg += `</g></svg>`;

    return svg;
  }

  wrapText(text, maxChars) {
    if (text.length <= maxChars) return text;

    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    for (const word of words) {
      if ((currentLine + ' ' + word).trim().length <= maxChars) {
        currentLine = (currentLine + ' ' + word).trim();
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);

    return lines.map((line, i) =>
      `<tspan x="0" dy="${i === 0 ? 0 : 14}">${line}</tspan>`
    ).join('');
  }

  // ==========================================================================
  // INTERACCIONES
  // ==========================================================================

  attachMapListeners(mapData, bookId) {
    const modal = document.getElementById('concept-map-modal');
    if (!modal) return;

    // Close
    document.getElementById('close-concept-map')?.addEventListener('click', () => this.close());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) this.close();
    });

    // Node clicks
    const nodes = document.querySelectorAll('.concept-node, .central-node');
    nodes.forEach(node => {
      node.addEventListener('click', () => {
        const nodeId = node.dataset.nodeId;
        this.showNodeDetail(nodeId, mapData, bookId);
      });
    });

    // Zoom controls
    let scale = 1;
    const svg = document.getElementById('concept-map-svg');

    document.getElementById('zoom-in-map')?.addEventListener('click', () => {
      scale = Math.min(2, scale + 0.2);
      if (svg) svg.style.transform = `scale(${scale})`;
    });

    document.getElementById('zoom-out-map')?.addEventListener('click', () => {
      scale = Math.max(0.5, scale - 0.2);
      if (svg) svg.style.transform = `scale(${scale})`;
    });

    document.getElementById('reset-map')?.addEventListener('click', () => {
      scale = 1;
      if (svg) svg.style.transform = `scale(1)`;
    });

    // ESC to close
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        this.close();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
  }

  showNodeDetail(nodeId, mapData, bookId) {
    const panel = document.getElementById('concept-detail-panel');
    const content = document.getElementById('concept-detail-content');
    if (!panel || !content) return;

    // Find node data
    let nodeData = nodeId === mapData.central.id
      ? mapData.central
      : mapData.nodes.find(n => n.id === nodeId);

    if (!nodeData) return;

    // Find related chapters
    const relatedChapters = [];
    if (mapData.chapters) {
      for (const [chapterId, concepts] of Object.entries(mapData.chapters)) {
        if (concepts.includes(nodeId)) {
          const chapter = this.bookEngine?.getChapter(chapterId);
          if (chapter) {
            relatedChapters.push({ id: chapterId, title: chapter.title });
          }
        }
      }
    }

    // Find connections
    const connections = mapData.connections.filter(c =>
      c.from === nodeId || c.to === nodeId
    );

    content.innerHTML = `
      <div class="flex items-start gap-4">
        <div class="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
             style="background: ${nodeData.color || '#06b6d4'}20; border: 2px solid ${nodeData.color || '#06b6d4'}">
          🔮
        </div>
        <div class="flex-1">
          <h3 class="text-lg font-bold" style="color: ${nodeData.color || '#06b6d4'}">${nodeData.label}</h3>
          ${nodeData.description ? `<p class="text-gray-400 text-sm mt-1">${nodeData.description}</p>` : ''}

          ${connections.length > 0 ? `
            <div class="mt-3">
              <p class="text-xs text-gray-500 mb-1">Conexiones:</p>
              <div class="flex flex-wrap gap-1">
                ${connections.map(c => {
                  const otherNode = c.from === nodeId ? c.to : c.from;
                  const otherData = otherNode === mapData.central.id
                    ? mapData.central
                    : mapData.nodes.find(n => n.id === otherNode);
                  return `<span class="px-2 py-0.5 bg-gray-700 rounded text-xs">${c.label} → ${otherData?.label || otherNode}</span>`;
                }).join('')}
              </div>
            </div>
          ` : ''}

          ${relatedChapters.length > 0 ? `
            <div class="mt-3">
              <p class="text-xs text-gray-500 mb-1">Capítulos relacionados:</p>
              <div class="flex flex-wrap gap-2">
                ${relatedChapters.map(ch => `
                  <button class="go-to-chapter-btn px-3 py-1 bg-cyan-900/30 hover:bg-cyan-800/50 border border-cyan-500/30 rounded text-xs text-cyan-300 transition"
                          data-chapter-id="${ch.id}">
                    📖 ${ch.title}
                  </button>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    `;

    panel.classList.remove('hidden');

    // Chapter navigation buttons
    content.querySelectorAll('.go-to-chapter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const chapterId = btn.dataset.chapterId;
        this.close();
        if (window.bookReader) {
          window.bookReader.navigateToChapter(chapterId);
        }
      });
    });
  }

  close() {
    const modal = document.getElementById('concept-map-modal');
    if (modal) {
      modal.style.animation = 'fadeOut 0.2s ease-out';
      setTimeout(() => modal.remove(), 200);
    }
  }

  // ==========================================================================
  // BOTÓN PARA TOOLBAR
  // ==========================================================================

  static createButton() {
    return `
      <button id="concept-map-btn" class="p-2 hover:bg-cyan-900/50 rounded-lg transition text-cyan-400" title="Mapa conceptual">
        ${Icons.create('git-branch', 20)}
      </button>
    `;
  }
}

// Exportar
window.ConceptMaps = ConceptMaps;
