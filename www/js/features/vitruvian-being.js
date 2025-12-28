/**
// 🔧 FIX v2.9.198: Migrated console.log to logger
 * VITRUVIAN BEING VISUALIZER
 * Visualización del Hombre de Vitrubio que se va construyendo
 * según se seleccionan piezas de conocimiento
 *
 * @version 1.0.0
 * @author Claude Sonnet 4.5
 */

class VitruvianBeing {
  constructor() {
    this.container = null;
    this.svg = null;
    this.bodyParts = {};
    this.attributes = {
      wisdom: { current: 0, max: 100, bodyPart: 'head' },
      empathy: { current: 0, max: 100, bodyPart: 'heart' },
      courage: { current: 0, max: 100, bodyPart: 'arms' },
      creativity: { current: 0, max: 100, bodyPart: 'hands' },
      discipline: { current: 0, max: 100, bodyPart: 'torso' },
      action: { current: 0, max: 100, bodyPart: 'legs' },
      balance: { current: 0, max: 100, bodyPart: 'aura' }
    };

    this.colors = {
      wisdom: '#4a5899',
      empathy: '#6a5d99',
      courage: '#995252',
      creativity: '#99844d',
      discipline: '#4d8899',
      action: '#995276',
      balance: '#d4af37'
    };
  }

  /**
   * Inicializar el Hombre de Vitrubio
   */
  init(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.error('❌ Contenedor de Vitruvian Being no encontrado');
      return;
    }

    this.createSVG();
    // logger.debug('✅ Vitruvian Being inicializado');
  }

  /**
   * Crear SVG del Hombre de Vitrubio
   */
  createSVG() {
    const svgHTML = `
      <svg viewBox="0 0 400 500" class="vitruvian-svg" xmlns="http://www.w3.org/2000/svg">
        <!-- Definiciones -->
        <defs>
          <!-- Gradientes para cada atributo -->
          <linearGradient id="grad-wisdom" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:${this.colors.wisdom};stop-opacity:0" />
            <stop offset="100%" style="stop-color:${this.colors.wisdom};stop-opacity:0.8" />
          </linearGradient>

          <linearGradient id="grad-empathy" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:${this.colors.empathy};stop-opacity:0" />
            <stop offset="100%" style="stop-color:${this.colors.empathy};stop-opacity:0.8" />
          </linearGradient>

          <linearGradient id="grad-courage" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:${this.colors.courage};stop-opacity:0" />
            <stop offset="100%" style="stop-color:${this.colors.courage};stop-opacity:0.8" />
          </linearGradient>

          <linearGradient id="grad-creativity" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:${this.colors.creativity};stop-opacity:0" />
            <stop offset="100%" style="stop-color:${this.colors.creativity};stop-opacity:0.8" />
          </linearGradient>

          <linearGradient id="grad-discipline" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:${this.colors.discipline};stop-opacity:0" />
            <stop offset="100%" style="stop-color:${this.colors.discipline};stop-opacity:0.8" />
          </linearGradient>

          <linearGradient id="grad-action" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:${this.colors.action};stop-opacity:0" />
            <stop offset="100%" style="stop-color:${this.colors.action};stop-opacity:0.8" />
          </linearGradient>

          <!-- Filtros para efectos de brillo -->
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          <!-- Patrón de energía -->
          <pattern id="energy-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="5" cy="5" r="1" fill="rgba(255,255,255,0.3)">
              <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite"/>
            </circle>
          </pattern>
        </defs>

        <!-- Círculo exterior (Vitruvio) -->
        <circle id="vitruvian-circle" cx="200" cy="250" r="180"
                fill="none"
                stroke="#8b7355"
                stroke-width="2"
                stroke-dasharray="5,5"
                opacity="0.3" />

        <!-- Cuadrado exterior (Vitruvio) -->
        <rect id="vitruvian-square" x="70" y="120" width="260" height="260"
              fill="none"
              stroke="#8b7355"
              stroke-width="2"
              stroke-dasharray="5,5"
              opacity="0.3" />

        <!-- AURA / BALANCE (círculo energético) -->
        <circle id="part-aura" cx="200" cy="250" r="175"
                fill="url(#energy-pattern)"
                stroke="${this.colors.balance}"
                stroke-width="3"
                opacity="0"
                class="body-part"
                data-attribute="balance">
          <animate attributeName="stroke-dasharray" values="0,1100;1100,0" dur="3s" fill="freeze" begin="indefinite" />
        </circle>

        <!-- CABEZA / SABIDURÍA -->
        <g id="part-head" class="body-part" data-attribute="wisdom" opacity="0">
          <!-- Cráneo -->
          <ellipse cx="200" cy="100" rx="35" ry="40"
                   fill="url(#grad-wisdom)"
                   stroke="${this.colors.wisdom}"
                   stroke-width="2"
                   filter="url(#glow)" />

          <!-- Cerebro (patrón) -->
          <path d="M 180 85 Q 190 80, 200 82 T 220 85"
                stroke="${this.colors.wisdom}"
                stroke-width="1.5"
                fill="none"
                opacity="0.6" />
          <path d="M 180 95 Q 190 90, 200 92 T 220 95"
                stroke="${this.colors.wisdom}"
                stroke-width="1.5"
                fill="none"
                opacity="0.6" />

          <!-- Ojos brillantes -->
          <circle cx="190" cy="100" r="3" fill="#ffd700" opacity="0.8">
            <animate attributeName="opacity" values="0.8;1;0.8" dur="1.5s" repeatCount="indefinite"/>
          </circle>
          <circle cx="210" cy="100" r="3" fill="#ffd700" opacity="0.8">
            <animate attributeName="opacity" values="0.8;1;0.8" dur="1.5s" repeatCount="indefinite"/>
          </circle>
        </g>

        <!-- CUELLO -->
        <line id="part-neck" x1="200" y1="140" x2="200" y2="170"
              stroke="#8b7355"
              stroke-width="12"
              opacity="0.2" />

        <!-- CORAZÓN / EMPATÍA -->
        <g id="part-heart" class="body-part" data-attribute="empathy" opacity="0">
          <!-- Símbolo de corazón -->
          <path d="M 200 190
                   C 200 180, 190 175, 185 180
                   C 180 185, 180 190, 185 195
                   L 200 210
                   L 215 195
                   C 220 190, 220 185, 215 180
                   C 210 175, 200 180, 200 190 Z"
                fill="url(#grad-empathy)"
                stroke="${this.colors.empathy}"
                stroke-width="2"
                filter="url(#glow)">
            <animate attributeName="opacity" values="0.7;1;0.7" dur="1.2s" repeatCount="indefinite"/>
          </path>

          <!-- Pulso del corazón -->
          <circle cx="200" cy="200" r="30"
                  fill="none"
                  stroke="${this.colors.empathy}"
                  stroke-width="1"
                  opacity="0">
            <animate attributeName="r" values="30;45;30" dur="1.2s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.6;0;0.6" dur="1.2s" repeatCount="indefinite"/>
          </circle>
        </g>

        <!-- TORSO / DISCIPLINA -->
        <g id="part-torso" class="body-part" data-attribute="discipline" opacity="0">
          <!-- Cuerpo principal -->
          <rect x="165" y="170" width="70" height="100" rx="10"
                fill="url(#grad-discipline)"
                stroke="${this.colors.discipline}"
                stroke-width="2"
                filter="url(#glow)" />

          <!-- Líneas de músculo (abs) -->
          <line x1="200" y1="185" x2="200" y2="260" stroke="${this.colors.discipline}" stroke-width="2" opacity="0.4"/>
          <line x1="180" y1="200" x2="220" y2="200" stroke="${this.colors.discipline}" stroke-width="1" opacity="0.3"/>
          <line x1="180" y1="220" x2="220" y2="220" stroke="${this.colors.discipline}" stroke-width="1" opacity="0.3"/>
          <line x1="180" y1="240" x2="220" y2="240" stroke="${this.colors.discipline}" stroke-width="1" opacity="0.3"/>
        </g>

        <!-- BRAZOS / CORAJE -->
        <g id="part-arms" class="body-part" data-attribute="courage" opacity="0">
          <!-- Brazo izquierdo -->
          <line x1="165" y1="180" x2="100" y2="230"
                stroke="${this.colors.courage}"
                stroke-width="12"
                stroke-linecap="round"
                filter="url(#glow)" />
          <!-- Hombro izquierdo -->
          <circle cx="165" cy="180" r="12"
                  fill="url(#grad-courage)"
                  stroke="${this.colors.courage}"
                  stroke-width="2" />

          <!-- Brazo derecho -->
          <line x1="235" y1="180" x2="300" y2="230"
                stroke="${this.colors.courage}"
                stroke-width="12"
                stroke-linecap="round"
                filter="url(#glow)" />
          <!-- Hombro derecho -->
          <circle cx="235" cy="180" r="12"
                  fill="url(#grad-courage)"
                  stroke="${this.colors.courage}"
                  stroke-width="2" />
        </g>

        <!-- MANOS / CREATIVIDAD -->
        <g id="part-hands" class="body-part" data-attribute="creativity" opacity="0">
          <!-- Mano izquierda -->
          <ellipse cx="95" cy="240" rx="12" ry="18"
                   fill="url(#grad-creativity)"
                   stroke="${this.colors.creativity}"
                   stroke-width="2"
                   filter="url(#glow)" />
          <!-- Dedos izquierda -->
          <line x1="95" y1="225" x2="95" y2="215" stroke="${this.colors.creativity}" stroke-width="2"/>
          <line x1="90" y1="225" x2="88" y2="215" stroke="${this.colors.creativity}" stroke-width="2"/>
          <line x1="100" y1="225" x2="102" y2="215" stroke="${this.colors.creativity}" stroke-width="2"/>

          <!-- Mano derecha -->
          <ellipse cx="305" cy="240" rx="12" ry="18"
                   fill="url(#grad-creativity)"
                   stroke="${this.colors.creativity}"
                   stroke-width="2"
                   filter="url(#glow)" />
          <!-- Dedos derecha -->
          <line x1="305" y1="225" x2="305" y2="215" stroke="${this.colors.creativity}" stroke-width="2"/>
          <line x1="310" y1="225" x2="312" y2="215" stroke="${this.colors.creativity}" stroke-width="2"/>
          <line x1="300" y1="225" x2="298" y2="215" stroke="${this.colors.creativity}" stroke-width="2"/>

          <!-- Partículas de creatividad -->
          <circle cx="95" cy="230" r="2" fill="${this.colors.creativity}">
            <animate attributeName="cx" values="95;85;95" dur="2s" repeatCount="indefinite"/>
            <animate attributeName="cy" values="230;220;230" dur="2s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="1;0;1" dur="2s" repeatCount="indefinite"/>
          </circle>
          <circle cx="305" cy="230" r="2" fill="${this.colors.creativity}">
            <animate attributeName="cx" values="305;315;305" dur="2s" repeatCount="indefinite"/>
            <animate attributeName="cy" values="230;220;230" dur="2s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="1;0;1" dur="2s" repeatCount="indefinite"/>
          </circle>
        </g>

        <!-- PIERNAS / ACCIÓN -->
        <g id="part-legs" class="body-part" data-attribute="action" opacity="0">
          <!-- Pierna izquierda -->
          <line x1="185" y1="270" x2="160" y2="380"
                stroke="${this.colors.action}"
                stroke-width="14"
                stroke-linecap="round"
                filter="url(#glow)" />

          <!-- Pierna derecha -->
          <line x1="215" y1="270" x2="240" y2="380"
                stroke="${this.colors.action}"
                stroke-width="14"
                stroke-linecap="round"
                filter="url(#glow)" />

          <!-- Pie izquierdo -->
          <ellipse cx="155" cy="390" rx="15" ry="8"
                   fill="url(#grad-action)"
                   stroke="${this.colors.action}"
                   stroke-width="2" />

          <!-- Pie derecho -->
          <ellipse cx="245" cy="390" rx="15" ry="8"
                   fill="url(#grad-action)"
                   stroke="${this.colors.action}"
                   stroke-width="2" />

          <!-- Líneas de movimiento -->
          <path d="M 160 380 Q 150 370, 145 360"
                stroke="${this.colors.action}"
                stroke-width="1"
                stroke-dasharray="3,3"
                opacity="0.5">
            <animate attributeName="stroke-dashoffset" values="0;6;0" dur="1s" repeatCount="indefinite"/>
          </path>
          <path d="M 240 380 Q 250 370, 255 360"
                stroke="${this.colors.action}"
                stroke-width="1"
                stroke-dasharray="3,3"
                opacity="0.5">
            <animate attributeName="stroke-dashoffset" values="0;6;0" dur="1s" repeatCount="indefinite"/>
          </path>
        </g>

        <!-- Labels informativos (opcional) -->
        <text x="200" y="485" text-anchor="middle" fill="#8b7355" font-size="12" opacity="0.6">
          Hombre de Vitrubio - Ser en Construcción
        </text>
      </svg>

      <!-- Panel de atributos lateral -->
      <div class="vitruvian-attributes">
        <h4 class="vitruvian-attributes-title">Energía Vital</h4>
        <div id="vitruvian-attributes-list" class="attributes-list">
          <!-- Se llenará dinámicamente -->
        </div>
      </div>
    `;

    this.container.innerHTML = svgHTML;
    this.svg = this.container.querySelector('.vitruvian-svg');

    // Guardar referencias a las partes del cuerpo
    this.bodyParts = {
      head: this.svg.querySelector('#part-head'),
      heart: this.svg.querySelector('#part-heart'),
      torso: this.svg.querySelector('#part-torso'),
      arms: this.svg.querySelector('#part-arms'),
      hands: this.svg.querySelector('#part-hands'),
      legs: this.svg.querySelector('#part-legs'),
      aura: this.svg.querySelector('#part-aura')
    };

    // Inicializar lista de atributos
    this.updateAttributesList();
  }

  /**
   * Actualizar atributos del ser
   */
  updateAttributes(attributes) {
    if (!attributes) return;

    // Actualizar valores internos
    Object.entries(attributes).forEach(([key, value]) => {
      if (this.attributes[key]) {
        this.attributes[key].current = value;
      }
    });

    // Calcular colores dinámicos basados en atributos
    this.updateDynamicColors(attributes);

    // Actualizar visualización
    this.updateVisualization();
    this.updateAttributesList();
  }

  /**
   * Calcular colores dinámicos según atributos dominantes
   */
  updateDynamicColors(attributes) {
    // Encontrar los 3 atributos más altos
    const sortedAttrs = Object.entries(attributes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    // Calcular HUE dominante (como en avatar system)
    let totalHue = 0;
    let totalWeight = 0;

    const hueMap = {
      wisdom: 220,      // Azul
      empathy: 140,     // Verde
      courage: 15,      // Rojo
      creativity: 290,  // Violeta
      discipline: 200,  // Azul oscuro
      action: 45,       // Naranja
      balance: 270      // Púrpura
    };

    sortedAttrs.forEach(([attr, value]) => {
      if (hueMap[attr] !== undefined && value > 0) {
        totalHue += hueMap[attr] * value;
        totalWeight += value;
      }
    });

    const dominantHue = totalWeight > 0 ? Math.round(totalHue / totalWeight) : 270;

    // Actualizar colores de las partes del cuerpo
    this.applyDynamicColors(dominantHue, attributes);
  }

  /**
   * Aplicar colores dinámicos al SVG
   */
  applyDynamicColors(hue, attributes) {
    if (!this.svg) return;

    // Calcular variaciones de color según el hue dominante
    const saturation = 60;
    const lightness = 55;

    // Colores personalizados para cada parte basados en el hue
    const colorVariations = {
      wisdom: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
      empathy: `hsl(${(hue + 30) % 360}, ${saturation}%, ${lightness}%)`,
      courage: `hsl(${(hue + 60) % 360}, ${saturation}%, ${lightness}%)`,
      creativity: `hsl(${(hue + 90) % 360}, ${saturation}%, ${lightness}%)`,
      discipline: `hsl(${(hue + 120) % 360}, ${saturation}%, ${lightness}%)`,
      action: `hsl(${(hue + 150) % 360}, ${saturation}%, ${lightness}%)`,
      balance: `hsl(${hue}, ${saturation + 20}%, ${lightness + 10}%)`
    };

    // Actualizar colores de gradientes y strokes
    Object.entries(colorVariations).forEach(([attr, color]) => {
      const bodyPart = this.bodyParts[this.attributes[attr]?.bodyPart];
      if (bodyPart) {
        // Actualizar stroke color
        const elements = bodyPart.querySelectorAll('[stroke]');
        elements.forEach(el => {
          if (!el.getAttribute('stroke').includes('url')) {
            el.setAttribute('stroke', color);
          }
        });

        // Añadir efecto de brillo si el atributo es alto
        const value = attributes[attr] || 0;
        if (value > 70) {
          bodyPart.style.filter = `drop-shadow(0 0 ${value / 10}px ${color}) url(#glow)`;
        }
      }
    });

    // Actualizar color del aura (círculo exterior)
    const aura = this.bodyParts.aura;
    if (aura) {
      const auraColor = `hsl(${hue}, ${saturation + 20}%, ${lightness + 10}%)`;
      aura.setAttribute('stroke', auraColor);

      // Intensidad del aura basada en balance total
      const totalBalance = attributes.balance || 0;
      if (totalBalance > 50) {
        aura.style.filter = `drop-shadow(0 0 ${totalBalance / 5}px ${auraColor})`;
      }
    }
  }

  /**
   * Actualizar visualización de las partes del cuerpo
   */
  updateVisualization() {
    Object.entries(this.attributes).forEach(([attrKey, attrData]) => {
      const bodyPart = this.bodyParts[attrData.bodyPart];
      if (!bodyPart) return;

      const percentage = Math.min(attrData.current / attrData.max, 1);
      const value = attrData.current;

      // Animar opacidad de 0 a percentage
      if (percentage > 0) {
        // Usar animación CSS para transición suave
        bodyPart.style.transition = 'opacity 0.8s ease-in-out, transform 0.5s ease-in-out';
        bodyPart.style.opacity = percentage;

        // Escalar ligeramente según el valor (más grande = más poder)
        const scale = 1 + (percentage * 0.15); // Escala de 1.0 a 1.15
        bodyPart.style.transformOrigin = 'center';
        bodyPart.style.transform = `scale(${scale})`;

        // Si es la primera vez que se activa, disparar animación de trazo
        if (bodyPart.dataset.activated !== 'true') {
          const strokeAnim = bodyPart.querySelector('animate[attributeName="stroke-dasharray"]');
          if (strokeAnim) {
            strokeAnim.beginElement();
          }
          bodyPart.dataset.activated = 'true';
        }

        // Efectos especiales según nivel de poder
        if (percentage >= 0.9) {
          // MÁXIMO PODER - Efecto épico
          bodyPart.classList.add('fully-charged', 'epic-power');
          this.addEpicParticles(bodyPart, attrKey);
        } else if (percentage >= 0.7) {
          // ALTO PODER - Efecto brillante
          bodyPart.classList.add('fully-charged');
          bodyPart.classList.remove('epic-power');
        } else if (percentage >= 0.4) {
          // PODER MEDIO - Efecto moderado
          bodyPart.classList.remove('fully-charged', 'epic-power');
          bodyPart.classList.add('medium-power');
        } else {
          // BAJO PODER - Solo visible
          bodyPart.classList.remove('fully-charged', 'epic-power', 'medium-power');
        }

        // Añadir animación de pulso para atributos muy altos
        if (value > 80) {
          bodyPart.style.animation = 'vitruvian-pulse 2s ease-in-out infinite';
        } else {
          bodyPart.style.animation = 'none';
        }
      } else {
        bodyPart.style.opacity = 0;
        bodyPart.style.transform = 'scale(1)';
        bodyPart.style.animation = 'none';
        bodyPart.classList.remove('fully-charged', 'epic-power', 'medium-power');
      }
    });
  }

  /**
   * Añadir partículas épicas para atributos al máximo
   */
  addEpicParticles(bodyPart, attribute) {
    // Evitar duplicados
    if (bodyPart.querySelector('.epic-particles')) return;

    const particleCount = 8;
    const particlesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    particlesGroup.classList.add('epic-particles');

    // Obtener posición aproximada del bodyPart
    const bbox = bodyPart.getBBox ? bodyPart.getBBox() : { x: 200, y: 250, width: 50, height: 50 };
    const centerX = bbox.x + bbox.width / 2;
    const centerY = bbox.y + bbox.height / 2;

    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const radius = 20 + Math.random() * 30;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      const particle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      particle.setAttribute('cx', x);
      particle.setAttribute('cy', y);
      particle.setAttribute('r', '2');
      particle.setAttribute('fill', this.colors[attribute] || '#d4af37');
      particle.setAttribute('opacity', '0');

      // Animación de partícula
      const animOpacity = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
      animOpacity.setAttribute('attributeName', 'opacity');
      animOpacity.setAttribute('values', '0;1;0');
      animOpacity.setAttribute('dur', '2s');
      animOpacity.setAttribute('repeatCount', 'indefinite');
      animOpacity.setAttribute('begin', `${i * 0.25}s`);

      const animRadius = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
      animRadius.setAttribute('attributeName', 'r');
      animRadius.setAttribute('values', '1;3;1');
      animRadius.setAttribute('dur', '2s');
      animRadius.setAttribute('repeatCount', 'indefinite');
      animRadius.setAttribute('begin', `${i * 0.25}s`);

      particle.appendChild(animOpacity);
      particle.appendChild(animRadius);
      particlesGroup.appendChild(particle);
    }

    bodyPart.appendChild(particlesGroup);
  }

  /**
   * Actualizar lista de atributos
   */
  updateAttributesList() {
    const listContainer = document.getElementById('vitruvian-attributes-list');
    if (!listContainer) return;

    const attributeNames = {
      wisdom: '🧠 Sabiduría',
      empathy: '❤️ Empatía',
      courage: '💪 Coraje',
      creativity: '✨ Creatividad',
      discipline: '🎯 Disciplina',
      action: '⚡ Acción',
      balance: '☯️ Balance'
    };

    let html = '';
    Object.entries(this.attributes).forEach(([key, data]) => {
      const percentage = Math.round((data.current / data.max) * 100);
      const color = this.colors[key];

      html += `
        <div class="vitruvian-attribute-item" data-attribute="${key}">
          <div class="attribute-info">
            <span class="attribute-label">${attributeNames[key]}</span>
            <span class="attribute-percent">${percentage}%</span>
          </div>
          <div class="attribute-mini-bar">
            <div class="attribute-mini-fill" style="width: ${percentage}%; background: ${color};"></div>
          </div>
        </div>
      `;
    });

    listContainer.innerHTML = html;
  }

  /**
   * Resetear visualización
   */
  reset() {
    Object.values(this.attributes).forEach(attr => {
      attr.current = 0;
    });
    this.updateVisualization();
    this.updateAttributesList();
  }

  /**
   * Animar pulso de energía al añadir pieza
   */
  pulseEnergy(attributeKey) {
    if (!this.attributes[attributeKey]) return;

    const bodyPart = this.bodyParts[this.attributes[attributeKey].bodyPart];
    if (!bodyPart) return;

    // Crear pulso temporal
    bodyPart.classList.add('energy-pulse');
    setTimeout(() => {
      bodyPart.classList.remove('energy-pulse');
    }, 600);
  }

  /**
   * Mostrar ser completado
   */
  showCompleted() {
    // Activar todas las partes al 100%
    Object.values(this.attributes).forEach(attr => {
      attr.current = attr.max;
    });
    this.updateVisualization();

    // Efecto de destello
    this.svg.classList.add('completed-flash');
    setTimeout(() => {
      this.svg.classList.remove('completed-flash');
    }, 1500);
  }
}

// Exportar globalmente
window.VitruvianBeing = VitruvianBeing;
// logger.debug('✅ VitruvianBeing cargado');
