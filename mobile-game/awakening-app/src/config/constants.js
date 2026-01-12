/**
 * CONSTANTES DEL JUEGO
 * Configuración global y valores por defecto
 */

// ═══════════════════════════════════════════════════════════
// API Y BACKEND
// ═══════════════════════════════════════════════════════════

// NOTA: En modo desarrollo, usar la IP local del servidor (ej: 192.168.1.x)
// localhost no funciona en dispositivos físicos Android/iOS
// Para producción, configurar la URL real del servidor
export const API_BASE_URL = __DEV__
  ? 'http://10.0.2.2/coleccion-nuevo-ser/mobile-game/api/mobile-bridge.php'  // 10.0.2.2 es localhost desde Android emulator
  : 'https://tu-dominio.com/mobile-game/api/mobile-bridge.php';  // Configurar URL real en producción

export const AI_PROXY_URL = __DEV__
  ? 'http://10.0.2.2/coleccion-nuevo-ser/api/ai-proxy.php'
  : 'https://tu-dominio.com/api/ai-proxy.php';

// Flag para indicar si la API está configurada (se usa para features opcionales)
export const IS_API_CONFIGURED = !API_BASE_URL.includes('tu-dominio.com');

// ═══════════════════════════════════════════════════════════
// RECURSOS DEL JUEGO
// ═══════════════════════════════════════════════════════════

export const RESOURCES = {
  ENERGY: {
    DEFAULT: 100,
    MAX_BASE: 100,
    REGEN_PER_MINUTE: 5, // Aumentado de 1 a 5 para mejor experiencia de juego
    COST_DEPLOY_BEING: 10,
    COST_EXPLORATION: 15,
    COST_GUARDIAN_BATTLE: 20
  },

  CONSCIOUSNESS: {
    DEFAULT: 200 // Consciencia inicial para nuevos jugadores
  },

  // Constantes de exploración
  EXPLORATION: {
    ENERGY_COST: 15,
    BASE_XP_REWARD: 30,
    DISCOVERY_CHANCE_BASE: 0.7
  }
};

// ═══════════════════════════════════════════════════════════
// NIVELES Y PROGRESIÓN
// ═══════════════════════════════════════════════════════════

export const LEVELS = {
  1: { name: 'Despertar', xpRequired: 0, maxBeings: 5, maxEnergy: 100 },
  2: { name: 'Aprendiz Inicial', xpRequired: 100, maxBeings: 7, maxEnergy: 120 },
  3: { name: 'Aprendiz', xpRequired: 250, maxBeings: 10, maxEnergy: 150 },
  4: { name: 'Explorador', xpRequired: 500, maxBeings: 12, maxEnergy: 170 },
  5: { name: 'Practicante', xpRequired: 850, maxBeings: 15, maxEnergy: 200 },
  6: { name: 'Activista', xpRequired: 1300, maxBeings: 18, maxEnergy: 230 },
  7: { name: 'Facilitador', xpRequired: 1900, maxBeings: 20, maxEnergy: 260 },
  8: { name: 'Catalizador', xpRequired: 2600, maxBeings: 23, maxEnergy: 290 },
  10: { name: 'Transformador', xpRequired: 4200, maxBeings: 28, maxEnergy: 350 },
  12: { name: 'Visionario', xpRequired: 6500, maxBeings: 33, maxEnergy: 400 },
  15: { name: 'Guía', xpRequired: 10000, maxBeings: 40, maxEnergy: 480 },
  18: { name: 'Mentor', xpRequired: 15000, maxBeings: 48, maxEnergy: 560 },
  20: { name: 'Arquitecto', xpRequired: 20000, maxBeings: 55, maxEnergy: 620 },
  25: { name: 'Pionero', xpRequired: 32000, maxBeings: 70, maxEnergy: 750 },
  30: { name: 'Maestro', xpRequired: 48000, maxBeings: 85, maxEnergy: 880 },
  40: { name: 'Sabio', xpRequired: 75000, maxBeings: 110, maxEnergy: 1100 },
  50: { name: 'Nuevo Ser', xpRequired: 100000, maxBeings: 150, maxEnergy: 1500 }
};

// ═══════════════════════════════════════════════════════════
// ATRIBUTOS DE SERES
// ═══════════════════════════════════════════════════════════

export const ATTRIBUTES = {
  reflection: { name: 'Reflexión', icon: '🧠', color: '#3b82f6' },
  analysis: { name: 'Análisis', icon: '🔍', color: '#8b5cf6' },
  creativity: { name: 'Creatividad', icon: '🎨', color: '#f59e0b' },
  empathy: { name: 'Empatía', icon: '❤️', color: '#ef4444' },
  communication: { name: 'Comunicación', icon: '🗣️', color: '#06b6d4' },
  leadership: { name: 'Liderazgo', icon: '👑', color: '#eab308' },
  action: { name: 'Acción', icon: '⚡', color: '#10b981' },
  resilience: { name: 'Resiliencia', icon: '💪', color: '#dc2626' },
  strategy: { name: 'Estrategia', icon: '♟️', color: '#6366f1' },
  consciousness: { name: 'Consciencia', icon: '🌟', color: '#a855f7' },
  connection: { name: 'Conexión', icon: '🌍', color: '#059669' },
  wisdom: { name: 'Sabiduría', icon: '📿', color: '#7c3aed' },
  organization: { name: 'Organización', icon: '📋', color: '#64748b' },
  collaboration: { name: 'Colaboración', icon: '🤝', color: '#0ea5e9' },
  technical: { name: 'Técnica', icon: '🔧', color: '#475569' }
};

// ═══════════════════════════════════════════════════════════
// ESTADOS DE SERES
// ═══════════════════════════════════════════════════════════

export const BEING_STATUS = {
  available: { name: 'Disponible', color: '#22c55e' },
  deployed: { name: 'Desplegado', color: '#3b82f6' },
  resting: { name: 'Descansando', color: '#f59e0b' },
  training: { name: 'Entrenando', color: '#8b5cf6' },
  exploring: { name: 'Explorando', color: '#06b6d4' }
};

// ═══════════════════════════════════════════════════════════
// RAREZAS
// ═══════════════════════════════════════════════════════════

export const RARITY = {
  common: { name: 'Común', color: '#95A5A6', multiplier: 1.0 },
  rare: { name: 'Raro', color: '#3498DB', multiplier: 1.2 },
  epic: { name: 'Épico', color: '#9B59B6', multiplier: 1.5 },
  legendary: { name: 'Legendario', color: '#FFD700', multiplier: 2.0 }
};

// ═══════════════════════════════════════════════════════════
// DURACIONES DE MISIONES (minutos)
// ═══════════════════════════════════════════════════════════

export const MISSION_DURATIONS = {
  BASE: {
    local: 15,
    regional: 30,
    nacional: 60,
    global: 120
  },
  URGENCY_MULTIPLIER: {
    low: 1.5,
    medium: 1.0,
    high: 0.7
  }
};

// ═══════════════════════════════════════════════════════════
// FRACTALES (Puntos de interés en el mapa)
// ═══════════════════════════════════════════════════════════

export const FRACTAL_TYPES = {
  wisdom: {
    name: 'Fractal de Sabiduría',
    icon: '📚',
    color: '#8b5cf6',
    pois: ['library', 'school', 'university', 'bookstore'],
    rewards: { knowledge: 50, consciousness: 20, energy: 5 },
    cooldown: 30 // minutos
  },

  community: {
    name: 'Fractal de Comunidad',
    icon: '🤝',
    color: '#0ea5e9',
    pois: ['community_centre', 'town_hall', 'social_facility', 'place_of_worship'],
    rewards: { cohesion: 30, consciousness: 15, energy: 10 },
    cooldown: 30
  },

  nature: {
    name: 'Fractal de Naturaleza',
    icon: '🌳',
    color: '#059669',
    pois: ['park', 'forest', 'garden', 'nature_reserve', 'water'],
    rewards: { regeneration: 40, consciousness: 10, energy: 15 },
    cooldown: 30
  },

  action: {
    name: 'Fractal de Acción',
    icon: '⚡',
    color: '#10b981',
    pois: ['ngo', 'cooperative', 'community_garden', 'social_centre'],
    rewards: { action: 35, consciousness: 25, energy: 10 },
    cooldown: 30
  },

  consciousness: {
    name: 'Fractal de Consciencia',
    icon: '🌟',
    color: '#a855f7',
    pois: ['meditation_centre', 'yoga', 'retreat', 'monastery'],
    rewards: { consciousness: 50, wisdom: 20, energy: 5 },
    cooldown: 60
  }
};

// ═══════════════════════════════════════════════════════════
// CRISIS
// ═══════════════════════════════════════════════════════════

export const CRISIS_TYPES = {
  environmental: { name: 'Ambiental', icon: '🌍', color: '#059669' },
  social: { name: 'Social', icon: '👥', color: '#3b82f6' },
  economic: { name: 'Económica', icon: '💰', color: '#f59e0b' },
  humanitarian: { name: 'Humanitaria', icon: '❤️', color: '#ef4444' },
  educational: { name: 'Educativa', icon: '📚', color: '#8b5cf6' },
  health: { name: 'Salud', icon: '🏥', color: '#ec4899' },
  infrastructure: { name: 'Infraestructura', icon: '🏗️', color: '#64748b' }
};

export const CRISIS_SCALE = {
  local: { name: 'Local', radius: 5 }, // km
  regional: { name: 'Regional', radius: 50 },
  national: { name: 'Nacional', radius: 500 },
  continental: { name: 'Continental', radius: 5000 },
  global: { name: 'Global', radius: 20000 }
};

// ═══════════════════════════════════════════════════════════
// CONFIGURACIÓN DE MAPA
// ═══════════════════════════════════════════════════════════

export const MAP_CONFIG = {
  DEFAULT_ZOOM: 15,
  DEFAULT_REGION: {
    latitude: 40.4168,
    longitude: -3.7038,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05
  },

  FRACTAL_SPAWN_RADIUS: 2000, // metros
  FRACTAL_ACTIVATION_RADIUS: 50, // metros para activar

  UPDATE_INTERVAL: 10000, // ms - actualizar posición cada 10s

  MARKER_SIZES: {
    fractal: 30,
    crisis: 40,
    being: 35
  }
};

// ═══════════════════════════════════════════════════════════
// COLORES DEL TEMA (Dark Mode)
// ═══════════════════════════════════════════════════════════

export const COLORS = {
  // Fondos
  bg: {
    primary: '#0a0e14',
    secondary: '#151a24',
    elevated: '#1e2530',
    card: '#1e293b'
  },

  // Acentos
  accent: {
    primary: '#60a5fa',
    success: '#34d399',
    warning: '#fbbf24',
    critical: '#ef4444',
    wisdom: '#a78bfa'
  },

  // Texto
  text: {
    primary: '#f1f5f9',
    secondary: '#94a3b8',
    dim: '#64748b'
  },

  // Gradientes
  gradient: {
    main: ['#60a5fa', '#a78bfa'],
    success: ['#34d399', '#10b981'],
    alert: ['#ef4444', '#dc2626']
  },

  // Estados
  status: {
    available: '#34d399',
    deployed: '#60a5fa',
    resting: '#fbbf24',
    training: '#a78bfa'
  }
};

// ═══════════════════════════════════════════════════════════
// SINCRONIZACIÓN
// ═══════════════════════════════════════════════════════════

export const SYNC_CONFIG = {
  AUTO_SYNC_INTERVAL: 300000, // 5 minutos
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 2000, // ms
  TIMEOUT: 10000 // ms
};

// ═══════════════════════════════════════════════════════════
// NOTIFICACIONES
// ═══════════════════════════════════════════════════════════

export const NOTIFICATIONS = {
  MAX_PER_DAY: 5,
  QUIET_HOURS: {
    start: 22, // 22:00
    end: 8 // 08:00
  }
};

// ═══════════════════════════════════════════════════════════
// UI TIMING (milisegundos)
// ═══════════════════════════════════════════════════════════

export const UI_TIMING = {
  // Modales y transiciones
  MODAL_DELAY: 1000,
  TUTORIAL_DELAY: 2000,
  CELEBRATION_DURATION: 1500,

  // Feedback de acciones
  ACTION_FEEDBACK: 2000,
  TOAST_DURATION: 3000,
  ERROR_DISPLAY: 5000,

  // Debounce
  SEARCH_DEBOUNCE: 300,
  SAVE_DEBOUNCE: 500,
  INPUT_DEBOUNCE: 150,

  // Animaciones
  ANIMATION_FAST: 200,
  ANIMATION_NORMAL: 300,
  ANIMATION_SLOW: 500
};

// ═══════════════════════════════════════════════════════════
// VERSIÓN
// ═══════════════════════════════════════════════════════════

export const APP_VERSION = '1.0.0';
export const APP_NAME = 'Awakening Protocol';
export const BUILD_NUMBER = 1;
