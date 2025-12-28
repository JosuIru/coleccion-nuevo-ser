/**
 * FRANKENSTEIN LAB - PIECE CATALOG
 * Extracted from frankenstein-ui.js (Refactoring v2.9.200 Phase 1)
 *
 * Contains: Piece type definitions, labels, icons, power values, compatibility matrix
 *
 * @version 1.0.0 (extracted from v3.1.0)
 * @author J. Irurtzun & Claude Sonnet 4.5
 */

/**
 * PIECE TYPES
 * Tipos de piezas disponibles en el laboratorio
 */
export const PIECE_TYPES = {
  CHAPTER: 'chapter',
  EXERCISE: 'exercise',
  RESOURCE: 'resource',
  SPECIAL: 'special', // Fragmentos especiales
  PIECE: 'piece' // Tipo genérico
};

/**
 * PIECE TYPE LABELS
 * Etiquetas en español para cada tipo de pieza
 */
export const PIECE_TYPE_LABELS = {
  [PIECE_TYPES.CHAPTER]: 'Capítulo',
  [PIECE_TYPES.EXERCISE]: 'Ejercicio',
  [PIECE_TYPES.RESOURCE]: 'Recurso',
  [PIECE_TYPES.SPECIAL]: 'Fragmento',
  [PIECE_TYPES.PIECE]: 'Pieza'
};

/**
 * PIECE TYPE ICONS
 * Iconos para cada tipo de pieza
 */
export const PIECE_TYPE_ICONS = {
  [PIECE_TYPES.CHAPTER]: '📖',
  [PIECE_TYPES.EXERCISE]: '⚡',
  [PIECE_TYPES.RESOURCE]: '🔧',
  [PIECE_TYPES.SPECIAL]: '✨',
  [PIECE_TYPES.PIECE]: '📦'
};

/**
 * PIECE TYPE METADATA
 * Metadata completa para cada tipo de pieza (usado en análisis canónico)
 */
export const PIECE_TYPE_METADATA = {
  [PIECE_TYPES.CHAPTER]: { icon: '📖', label: 'Capítulo' },
  [PIECE_TYPES.EXERCISE]: { icon: '🧪', label: 'Ejercicio' },
  [PIECE_TYPES.RESOURCE]: { icon: '🧰', label: 'Recurso' },
  [PIECE_TYPES.SPECIAL]: { icon: '✨', label: 'Fragmento' },
  [PIECE_TYPES.PIECE]: { icon: '🧩', label: 'Pieza' }
};

/**
 * PIECE POWER VALUES
 * Valores de poder base por tipo de pieza
 */
export const PIECE_POWER_VALUES = {
  [PIECE_TYPES.CHAPTER]: 25,
  [PIECE_TYPES.EXERCISE]: 40,
  [PIECE_TYPES.RESOURCE]: 35
};

/**
 * DEFAULT PIECE POWER
 * Valor de poder por defecto para tipos no especificados
 */
export const DEFAULT_PIECE_POWER = 20;

/**
 * VITRUVIAN SLOT TYPES
 * Tipos de slots en la visualización del Hombre de Vitrubio
 */
export const VITRUVIAN_SLOT_TYPES = {
  HEAD: 'head',
  HEART: 'heart',
  ARMS: 'arms',
  CORE: 'core',
  LEGS: 'legs'
};

/**
 * SLOT COMPATIBILITY MATRIX
 * Define qué tipos de piezas son compatibles con cada slot del Hombre de Vitrubio
 */
export const SLOT_COMPATIBILITY_MATRIX = {
  [VITRUVIAN_SLOT_TYPES.HEAD]: [PIECE_TYPES.CHAPTER, PIECE_TYPES.RESOURCE],
  [VITRUVIAN_SLOT_TYPES.HEART]: [PIECE_TYPES.EXERCISE, PIECE_TYPES.CHAPTER],
  [VITRUVIAN_SLOT_TYPES.ARMS]: [PIECE_TYPES.RESOURCE, PIECE_TYPES.EXERCISE],
  [VITRUVIAN_SLOT_TYPES.CORE]: [PIECE_TYPES.CHAPTER],
  [VITRUVIAN_SLOT_TYPES.LEGS]: [PIECE_TYPES.EXERCISE, PIECE_TYPES.RESOURCE]
};

/**
 * EXERCISE CATEGORY ICONS
 * Iconos para categorías de ejercicios
 */
export const EXERCISE_CATEGORY_ICONS = {
  meditation: '🧘',
  dialogue: '💬',
  planning: '📋',
  reflection: '🤔',
  practice: '⚡'
};

/**
 * DEFAULT EXERCISE ICON
 * Icono por defecto para ejercicios sin categoría específica
 */
export const DEFAULT_EXERCISE_ICON = '📝';

/**
 * REQUIREMENT TYPE ICONS
 * Iconos para diferentes tipos de requerimientos (fallback cuando no hay atributo)
 */
export const REQUIREMENT_TYPE_ICONS = {
  [PIECE_TYPES.CHAPTER]: '📖',
  [PIECE_TYPES.EXERCISE]: '⚡',
  [PIECE_TYPES.RESOURCE]: '🔧',
  power: '💪',
  balance: '⚖️',
  category: '🏷️'
};

/**
 * DEFAULT REQUIREMENT ICON
 * Icono por defecto para requerimientos sin tipo específico
 */
export const DEFAULT_REQUIREMENT_ICON = '📋';

/**
 * DEFAULT ATTRIBUTE ICON
 * Icono por defecto para atributos sin definición
 */
export const DEFAULT_ATTRIBUTE_ICON = '📊';

// ============================================================================
// HELPER FUNCTIONS (Pure functions for data manipulation)
// ============================================================================

/**
 * Get piece type label
 * @param {string} tipo_pieza - Tipo de pieza
 * @returns {string} Etiqueta en español
 */
export function getPieceTypeLabel(tipo_pieza) {
  return PIECE_TYPE_LABELS[tipo_pieza] || tipo_pieza;
}

/**
 * Get piece type icon
 * @param {string} tipo_pieza - Tipo de pieza
 * @returns {string} Icono emoji
 */
export function getPieceTypeIcon(tipo_pieza) {
  return PIECE_TYPE_ICONS[tipo_pieza] || PIECE_TYPE_ICONS[PIECE_TYPES.PIECE];
}

/**
 * Get piece power by type
 * @param {string} tipo_pieza - Tipo de pieza
 * @returns {number} Valor de poder
 */
export function getPiecePower(tipo_pieza) {
  return PIECE_POWER_VALUES[tipo_pieza] || DEFAULT_PIECE_POWER;
}

/**
 * Get exercise icon by category
 * @param {string} categoria_ejercicio - Categoría del ejercicio
 * @returns {string} Icono emoji
 */
export function getExerciseIcon(categoria_ejercicio) {
  return EXERCISE_CATEGORY_ICONS[categoria_ejercicio] || DEFAULT_EXERCISE_ICON;
}

/**
 * Check if slot is compatible with piece type
 * @param {string} tipo_slot - Tipo de slot (head, heart, arms, core, legs)
 * @param {string} tipo_pieza - Tipo de pieza
 * @returns {boolean} true si son compatibles
 */
export function isSlotCompatible(tipo_slot, tipo_pieza) {
  return SLOT_COMPATIBILITY_MATRIX[tipo_slot]?.includes(tipo_pieza) || false;
}

/**
 * Get requirement icon
 * @param {string} tipo_requerimiento - Tipo de requerimiento
 * @param {Object} sistema_misiones - Sistema de misiones (opcional, para buscar atributo)
 * @returns {string} Icono emoji
 */
export function getRequirementIcon(tipo_requerimiento, sistema_misiones = null) {
  // Intentar obtener icono del atributo si existe sistema de misiones
  const atributo_sistema = sistema_misiones?.attributes?.[tipo_requerimiento];
  if (atributo_sistema) {
    return atributo_sistema.icon || DEFAULT_ATTRIBUTE_ICON;
  }

  // Fallback a iconos de tipo
  return REQUIREMENT_TYPE_ICONS[tipo_requerimiento] || DEFAULT_REQUIREMENT_ICON;
}

/**
 * Get piece type metadata
 * @param {string} tipo_pieza - Tipo de pieza
 * @returns {Object} { icon, label }
 */
export function getPieceTypeMetadata(tipo_pieza) {
  return PIECE_TYPE_METADATA[tipo_pieza] || PIECE_TYPE_METADATA[PIECE_TYPES.PIECE];
}
