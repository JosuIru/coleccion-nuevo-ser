// ============================================================================
// ICONS - Sistema de iconos SVG profesionales usando Lucide Icons
// ============================================================================
// Fuente: https://lucide.dev (MIT License)

const Icons = {
  /**
   * Crea un icono de Lucide Icons
   * @param {string} name - Nombre del icono en formato kebab-case (ej: 'arrow-left')
   * @param {number} size - Tamaño del icono (default: 20)
   * @param {string} className - Clases CSS adicionales
   * @returns {string} HTML del icono
   */
  create(name, size = 20, className = '') {
    return `<i data-lucide="${name}" class="inline-block ${className}" style="width:${size}px;height:${size}px"></i>`;
  },

  // Navegación
  back: (size = 20) => Icons.create('arrow-left', size),
  menu: (size = 20) => Icons.create('menu', size),
  close: (size = 20) => Icons.create('x', size),
  chevronLeft: (size = 20) => Icons.create('chevron-left', size),
  chevronRight: (size = 20) => Icons.create('chevron-right', size),

  // Funcionalidades principales
  bookmark: (size = 20) => Icons.create('bookmark', size),
  bookmarkFilled: (size = 20) => Icons.create('bookmark', size, 'fill-current'),
  note: (size = 20) => Icons.create('file-text', size),
  chat: (size = 20) => Icons.create('message-circle', size),

  // Features del libro
  timeline: (size = 20) => Icons.create('clock', size),
  resources: (size = 20) => Icons.create('book-open', size),
  manual: (size = 20) => Icons.create('book', size),
  meditation: (size = 20) => Icons.create('circle-dot', size),
  radical: (size = 20) => Icons.create('zap', size),
  audio: (size = 20) => Icons.create('volume-2', size),
  koan: (size = 20) => Icons.create('lightbulb', size),

  // Configuración y sistema
  download: (size = 20) => Icons.create('download', size),
  settings: (size = 20) => Icons.create('settings', size),
  donate: (size = 20) => Icons.create('heart', size),
  language: (size = 20) => Icons.create('globe', size),

  // Biblioteca
  library: (size = 20) => Icons.create('library', size),
  book: (size = 20) => Icons.create('book', size),

  // Estados
  check: (size = 20) => Icons.create('check', size),
  checkCircle: (size = 20) => Icons.create('check-circle', size),
  circle: (size = 20) => Icons.create('circle', size),

  // Prácticas y ejercicios
  waves: (size = 20) => Icons.create('waves', size),           // Emergencia
  sparkles: (size = 20) => Icons.create('sparkles', size),     // Phi/Misterio/Meditación
  brain: (size = 20) => Icons.create('brain', size),           // Problema difícil/Mente
  smartphone: (size = 20) => Icons.create('smartphone', size), // Límite borroso
  refreshCw: (size = 20) => Icons.create('refresh-cw', size),  // Autopoiesis/Ciclos
  zap: (size = 20) => Icons.create('zap', size),               // Sorpresa/Energía
  palette: (size = 20) => Icons.create('palette', size),       // Creatividad
  heartPulse: (size = 20) => Icons.create('heart-pulse', size), // Emociones/Somático
  eye: (size = 20) => Icons.create('eye', size),               // Observación/Umwelt
  helpCircle: (size = 20) => Icons.create('help-circle', size), // Preguntas
  alertTriangle: (size = 20) => Icons.create('alert-triangle', size), // Miedo
  skull: (size = 20) => Icons.create('skull', size),           // Muerte
  messageSquare: (size = 20) => Icons.create('message-square', size), // Diálogo
  scale: (size = 20) => Icons.create('scale', size),           // Ética
  link: (size = 20) => Icons.create('link', size),             // Entrelazamiento
  search: (size = 20) => Icons.create('search', size),         // Identificación/Búsqueda
  compass: (size = 20) => Icons.create('compass', size),       // Cartografía/Navegación
  clock: (size = 20) => Icons.create('clock', size),           // Tiempo
  users: (size = 20) => Icons.create('users', size),           // Colaboración
  drama: (size = 20) => Icons.create('drama', size),           // Emociones/Máscaras
  gem: (size = 20) => Icons.create('gem', size),               // Materia/Cristal
  activity: (size = 20) => Icons.create('activity', size),     // Escaneo/Vida
  feather: (size = 20) => Icons.create('feather', size),       // Transformación/Ligereza
  mail: (size = 20) => Icons.create('mail', size),             // Carta
  moonStar: (size = 20) => Icons.create('moon-star', size),    // Sombra/Noche
  fileText: (size = 20) => Icons.create('file-text', size),    // Código/Plan
  bot: (size = 20) => Icons.create('bot', size),               // IA/Robot
  sunrise: (size = 20) => Icons.create('sunrise', size),       // Síntesis/Horizonte
  bookMarked: (size = 20) => Icons.create('book-marked', size), // Referencias
  infinity: (size = 20) => Icons.create('infinity', size),     // Continuo/Espiral
  target: (size = 20) => Icons.create('target', size),         // Objetivo/Foco
  flame: (size = 20) => Icons.create('flame', size),           // Radical/Fuego
  leaf: (size = 20) => Icons.create('leaf', size),             // Impermanencia/Naturaleza
  network: (size = 20) => Icons.create('network', size),       // Conexión/Red
  lightbulb: (size = 20) => Icons.create('lightbulb', size),   // Iluminación/Idea
  route: (size = 20) => Icons.create('route', size),           // Puente/Camino

  // Acciones
  edit: (size = 20) => Icons.create('pencil', size),           // Editar
  trash: (size = 20) => Icons.create('trash-2', size),         // Eliminar
  play: (size = 20) => Icons.create('play', size),             // Reproducir
  stop: (size = 20) => Icons.create('square', size),           // Detener
  pause: (size = 20) => Icons.create('pause', size),           // Pausar
  info: (size = 20) => Icons.create('info', size),             // Información
  user: (size = 20) => Icons.create('user', size),             // Usuario
  calendar: (size = 20) => Icons.create('calendar', size),     // Calendario
  volume: (size = 20) => Icons.create('volume-2', size),       // Volumen
  wrench: (size = 20) => Icons.create('wrench', size),         // Herramientas
  mapPin: (size = 20) => Icons.create('map-pin', size),        // Ubicación
  sword: (size = 20) => Icons.create('swords', size),          // Revoluciones/Conflicto
  video: (size = 20) => Icons.create('video', size),           // Video/Documental
  skipBack: (size = 20) => Icons.create('skip-back', size),    // Anterior
  skipForward: (size = 20) => Icons.create('skip-forward', size), // Siguiente

  /**
   * Inicializa todos los iconos de Lucide en el DOM
   * Debe llamarse después de que el DOM esté listo y después de cada renderizado
   */
  init() {
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    } else {
      console.warn('Lucide Icons no está cargado');
    }
  }
};

// Exportar globalmente
window.Icons = Icons;
