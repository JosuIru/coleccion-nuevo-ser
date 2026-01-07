/**
 * ORGANISM KNOWLEDGE - Datos y Configuración
 * Definiciones estáticas separadas del código de la clase principal
 * @version 1.0.0
 */

const OrganismData = {
  /**
   * ANATOMÍA DEL CUERPO DIVINO - Posiciones exactas de órganos
   */
  bodyAnatomy: {
    // ÓRGANOS VITALES (necesarios para vivir)
    head: {
      name: 'Cerebro',
      position: { x: 0, y: 400, z: 0 },
      required: true,
      icon: '🧠',
      description: 'Centro del pensamiento y consciencia',
      accepts: ['Filosofía', 'Filosofía & Ontología', 'Filosofía Política', 'Espiritualidad & Ciencia', 'Tecnología & Filosofía']
    },
    heart: {
      name: 'Corazón',
      position: { x: -50, y: 200, z: 0 },
      required: true,
      icon: '❤️',
      description: 'Motor vital del ser',
      accepts: ['Pedagogía', 'Educación & Transformación', 'Transformación', 'Activismo & Transformación Social']
    },
    lungs: {
      name: 'Pulmones',
      position: { x: 50, y: 200, z: 0 },
      required: true,
      icon: '🫁',
      description: 'Respiración y conexión con el mundo',
      accepts: ['Ecología', 'Ecología Profunda', 'Ecología & Conciencia']
    },

    // ÓRGANOS COMPLEMENTARIOS (mejoran al ser)
    hands: {
      name: 'Manos',
      position: { x: -200, y: 100, z: 0 },
      required: false,
      icon: '🙌',
      description: 'Capacidad de acción y transformación',
      accepts: ['Prácticas & Ejercicios', 'Prácticas Avanzadas', 'Arte', 'Arte & Activismo']
    },
    spine: {
      name: 'Sistema Nervioso',
      position: { x: 0, y: 150, z: -50 },
      required: false,
      icon: '🤖',
      description: 'Conexión y procesamiento de información',
      accepts: ['IA y Tecnología', 'Tecnología & Filosofía']
    },
    muscles: {
      name: 'Músculos',
      position: { x: 200, y: 100, z: 0 },
      required: false,
      icon: '💪',
      description: 'Fuerza para actuar en el mundo',
      accepts: ['Acción', 'Activismo & Transformación Social']
    },
    skeleton: {
      name: 'Esqueleto',
      position: { x: 0, y: 50, z: 0 },
      required: false,
      icon: '🦴',
      description: 'Estructura y sostén del ser',
      accepts: ['instituciones']
    },
    digestive: {
      name: 'Sistema Digestivo',
      position: { x: 0, y: -50, z: 0 },
      required: false,
      icon: '🍃',
      description: 'Procesamiento y purificación',
      accepts: ['Economía Personal & Minimalismo']
    },
    throat: {
      name: 'Garganta',
      position: { x: 0, y: 300, z: 0 },
      required: false,
      icon: '🗣️',
      description: 'Capacidad de expresión',
      accepts: ['Relaciones & Comunicación']
    }
  },

  /**
   * Tipos de células por tipo de contenido
   */
  cellTypes: {
    'teoría': {
      shape: 'sphere',
      color: 0x3b82f6,
      glow: true
    },
    'práctica': {
      shape: 'complex',
      color: 0x10b981,
      glow: true
    },
    'teoría-práctica': {
      shape: 'hybrid',
      color: 0xa855f7,
      glow: true
    }
  },

  /**
   * Configuración por defecto
   */
  defaultConfig: {
    heartbeatSpeed: 0.003,
    breathingSpeed: 0.002,
    cellRadius: 30,
    organRadius: 150,
    mitochondriaCount: 5,
    dnaHelixTurns: 3
  },

  /**
   * Configuración de controles de cámara
   */
  cameraDefaults: {
    isDragging: false,
    previousMousePosition: { x: 0, y: 0 },
    rotationSpeed: 0.005,
    zoomSpeed: 0.1,
    targetDistance: 800,
    currentDistance: 800,
    phi: Math.PI / 4,
    theta: 0
  },

  /**
   * Genera mapeo de categorías a slots del cuerpo
   * @returns {Object} Mapeo de categoría -> slot
   */
  generateCategoryToSlotMap() {
    const map = {};
    Object.entries(this.bodyAnatomy).forEach(([slot, data]) => {
      data.accepts.forEach(category => {
        map[category] = slot;
      });
    });
    return map;
  },

  /**
   * Obtener slots requeridos
   * @returns {string[]} Array de IDs de slots requeridos
   */
  getRequiredSlots() {
    return Object.entries(this.bodyAnatomy)
      .filter(([_, data]) => data.required)
      .map(([slot, _]) => slot);
  },

  /**
   * Obtener slots opcionales
   * @returns {string[]} Array de IDs de slots opcionales
   */
  getOptionalSlots() {
    return Object.entries(this.bodyAnatomy)
      .filter(([_, data]) => !data.required)
      .map(([slot, _]) => slot);
  },

  /**
   * Verificar si una categoría es aceptada por un slot
   * @param {string} slotId - ID del slot
   * @param {string} category - Categoría a verificar
   * @returns {boolean} True si el slot acepta la categoría
   */
  slotAcceptsCategory(slotId, category) {
    const slot = this.bodyAnatomy[slotId];
    return slot && slot.accepts.includes(category);
  }
};

// Exponer globalmente
window.OrganismData = OrganismData;
