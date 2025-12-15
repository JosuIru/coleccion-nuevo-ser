/**
 * CONSTANTES DEL JUEGO
 * Configuración global y valores por defecto
 */

// ═══════════════════════════════════════════════════════════
// API Y BACKEND
// ═══════════════════════════════════════════════════════════

export const API_BASE_URL = __DEV__
  ? 'http://localhost/coleccion-nuevo-ser/mobile-game/api/mobile-bridge.php'
  : 'https://tudominio.com/mobile-game/api/mobile-bridge.php';

// ═══════════════════════════════════════════════════════════
// RECURSOS DEL JUEGO
// ═══════════════════════════════════════════════════════════

export const RESOURCES = {
  ENERGY: {
    DEFAULT: 100,
    MAX_BASE: 100,
    REGEN_PER_MINUTE: 1,
    COST_DEPLOY_BEING: 10
  },

  CONSCIOUSNESS: {
    DEFAULT: 0
  }
};

// ═══════════════════════════════════════════════════════════
// NIVELES Y PROGRESIÓN
// ═══════════════════════════════════════════════════════════

export const LEVELS = {
  1: { name: 'Despertar', xpRequired: 0, maxBeings: 3, maxEnergy: 100 },
  2: { name: 'Aprendiz Inicial', xpRequired: 100, maxBeings: 4, maxEnergy: 120 },
  3: { name: 'Aprendiz', xpRequired: 250, maxBeings: 5, maxEnergy: 150 },
  5: { name: 'Practicante', xpRequired: 1000, maxBeings: 8, maxEnergy: 200 },
  10: { name: 'Transformador', xpRequired: 5000, maxBeings: 15, maxEnergy: 300 },
  15: { name: 'Guía', xpRequired: 12000, maxBeings: 20, maxEnergy: 400 },
  20: { name: 'Arquitecto', xpRequired: 20000, maxBeings: 30, maxEnergy: 500 },
  30: { name: 'Maestro', xpRequired: 50000, maxBeings: 50, maxEnergy: 700 },
  50: { name: 'Nuevo Ser', xpRequired: 100000, maxBeings: 100, maxEnergy: 1000 }
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
// VERSIÓN
// ═══════════════════════════════════════════════════════════

export const APP_VERSION = '1.0.0';
export const APP_NAME = 'Awakening Protocol';
export const BUILD_NUMBER = 1;
