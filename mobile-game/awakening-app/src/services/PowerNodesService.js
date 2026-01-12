/**
 * PowerNodesService.js
 *
 * Gestiona los Lugares de Poder (Santuarios y Zonas Corruptas)
 * donde los seres pueden mejorar o corromperse.
 *
 * @version 1.0.0
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../utils/logger';

// ============================================================================
// CONFIGURACIÓN DE LUGARES DE PODER
// ============================================================================

const SANCTUARY_TYPES = {
  reflection: {
    id: 'reflection',
    name: 'Templo de la Reflexión',
    icon: '🏛️',
    color: '#8b5cf6',
    description: 'Un lugar ancestral de meditación y contemplación profunda.',
    boostAttribute: 'wisdom',
    boostAmount: { min: 5, max: 15 },
    duration: 4 * 60 * 60 * 1000, // 4 horas
    cooldown: 24 * 60 * 60 * 1000, // 24 horas
    guardian: {
      id: 'guardian_reflection',
      name: 'El Observador Eterno',
      avatar: '👁️',
      rarity: 'legendary',
      requiredVisits: 7,
      quizBook: 'codigo-despertar'
    }
  },
  empathy: {
    id: 'empathy',
    name: 'Jardín de la Empatía',
    icon: '🌸',
    color: '#ec4899',
    description: 'Un jardín donde las conexiones entre seres florecen.',
    boostAttribute: 'empathy',
    boostAmount: { min: 5, max: 15 },
    duration: 3 * 60 * 60 * 1000,
    cooldown: 20 * 60 * 60 * 1000,
    guardian: {
      id: 'guardian_empathy',
      name: 'La Madre Compasiva',
      avatar: '💗',
      rarity: 'legendary',
      requiredVisits: 5,
      quizBook: 'manual-transicion'
    }
  },
  action: {
    id: 'action',
    name: 'Arena del Despertar',
    icon: '⚔️',
    color: '#f59e0b',
    description: 'Un campo de entrenamiento para guerreros de la consciencia.',
    boostAttribute: 'action',
    boostAmount: { min: 8, max: 20 },
    duration: 2 * 60 * 60 * 1000,
    cooldown: 16 * 60 * 60 * 1000,
    guardian: {
      id: 'guardian_action',
      name: 'El Catalizador',
      avatar: '⚡',
      rarity: 'legendary',
      requiredVisits: 10,
      quizBook: 'practicas-radicales'
    }
  },
  knowledge: {
    id: 'knowledge',
    name: 'Biblioteca Oculta',
    icon: '📚',
    color: '#3b82f6',
    description: 'Un repositorio de sabiduría antigua y conocimiento prohibido.',
    boostAttribute: 'knowledge',
    boostAmount: { min: 10, max: 25 },
    duration: 6 * 60 * 60 * 1000,
    cooldown: 48 * 60 * 60 * 1000,
    requiresQuiz: true,
    guardian: {
      id: 'guardian_knowledge',
      name: 'El Archivero Cósmico',
      avatar: '📖',
      rarity: 'mythic',
      requiredVisits: 3,
      quizBook: 'filosofia-nuevo-ser'
    }
  },
  energy: {
    id: 'energy',
    name: 'Fuente de Energía',
    icon: '✨',
    color: '#22c55e',
    description: 'Un manantial de energía vital pura.',
    boostAttribute: 'energy',
    boostAmount: { min: 20, max: 50 },
    duration: 1 * 60 * 60 * 1000,
    cooldown: 8 * 60 * 60 * 1000,
    healCorruption: true,
    guardian: {
      id: 'guardian_energy',
      name: 'El Regenerador',
      avatar: '🌿',
      rarity: 'epic',
      requiredVisits: 4,
      quizBook: 'tierra-que-despierta'
    }
  },
  connection: {
    id: 'connection',
    name: 'Nexo de Consciencias',
    icon: '🔮',
    color: '#06b6d4',
    description: 'Un punto donde múltiples dimensiones de consciencia convergen.',
    boostAttribute: 'connection',
    boostAmount: { min: 7, max: 18 },
    duration: 5 * 60 * 60 * 1000,
    cooldown: 36 * 60 * 60 * 1000,
    guardian: {
      id: 'guardian_connection',
      name: 'El Tejedor de Redes',
      avatar: '🕸️',
      rarity: 'legendary',
      requiredVisits: 6,
      quizBook: 'dialogos-maquina'
    }
  }
};

const CORRUPTION_ZONES = {
  despair: {
    id: 'despair',
    name: 'Abismo de la Desesperanza',
    icon: '🌑',
    color: '#1f2937',
    description: 'Una zona donde la esperanza se desvanece.',
    corruptionType: 'despair',
    corruptionChance: 0.3,
    rewardMultiplier: 1.5,
    negativeTraits: ['Desilusionado', 'Apático', 'Nihilista'],
    spawnNearCrisisTypes: ['humanitarian', 'social']
  },
  chaos: {
    id: 'chaos',
    name: 'Vórtice del Caos',
    icon: '🌀',
    color: '#7c3aed',
    description: 'Un torbellino de energías desordenadas.',
    corruptionType: 'chaos',
    corruptionChance: 0.4,
    rewardMultiplier: 1.8,
    negativeTraits: ['Inestable', 'Impulsivo', 'Fragmentado'],
    spawnNearCrisisTypes: ['infrastructure', 'economic']
  },
  shadow: {
    id: 'shadow',
    name: 'Valle de Sombras',
    icon: '👥',
    color: '#374151',
    description: 'Un lugar donde las sombras cobran vida propia.',
    corruptionType: 'shadow',
    corruptionChance: 0.25,
    rewardMultiplier: 2.0,
    negativeTraits: ['Oscurecido', 'Desconfiado', 'Aislado'],
    spawnNearCrisisTypes: ['health', 'environmental'],
    hiddenBeingChance: 0.15
  },
  void: {
    id: 'void',
    name: 'Fisura del Vacío',
    icon: '⬛',
    color: '#000000',
    description: 'Una grieta hacia la nada absoluta. Extremadamente peligroso.',
    corruptionType: 'void',
    corruptionChance: 0.6,
    rewardMultiplier: 3.0,
    negativeTraits: ['Vacío', 'Perdido', 'Disociado'],
    spawnCondition: 'critical_crisis_unresolved',
    canLoseBeing: true,
    hiddenBeingChance: 0.25
  }
};

// Ubicaciones fijas de santuarios en el mundo
const SANCTUARY_LOCATIONS = [
  { type: 'reflection', lat: 27.9881, lon: 86.9250, region: 'Himalayas' },
  { type: 'reflection', lat: 35.0116, lon: 135.7681, region: 'Kyoto' },
  { type: 'empathy', lat: -13.1631, lon: -72.5450, region: 'Machu Picchu' },
  { type: 'empathy', lat: 51.1789, lon: -1.8262, region: 'Stonehenge' },
  { type: 'action', lat: 29.9792, lon: 31.1342, region: 'Giza' },
  { type: 'action', lat: 19.4326, lon: -99.1332, region: 'Tenochtitlan' },
  { type: 'knowledge', lat: 31.7767, lon: 35.2345, region: 'Jerusalem' },
  { type: 'knowledge', lat: 37.9715, lon: 23.7267, region: 'Athens' },
  { type: 'energy', lat: -22.9519, lon: -43.2105, region: 'Rio de Janeiro' },
  { type: 'energy', lat: 25.2048, lon: 55.2708, region: 'Dubai' },
  { type: 'connection', lat: 64.1466, lon: -21.9426, region: 'Iceland' },
  { type: 'connection', lat: -33.8688, lon: 151.2093, region: 'Sydney' }
];

// ============================================================================
// SERVICIO PRINCIPAL
// ============================================================================

class PowerNodesService {
  constructor() {
    this.sanctuaries = [];
    this.corruptionZones = [];
    this.beingsInTraining = {};
    this.visitHistory = {};
    this.discoveredGuardians = {};
  }

  // --------------------------------------------------------------------------
  // INICIALIZACIÓN
  // --------------------------------------------------------------------------

  async initialize() {
    await this.loadState();
    this.generateSanctuaries();
    return true;
  }

  generateSanctuaries() {
    this.sanctuaries = SANCTUARY_LOCATIONS.map((loc, index) => {
      const type = SANCTUARY_TYPES[loc.type];
      const uniqueId = `sanctuary_${loc.type}_${index}`;
      return {
        ...type,
        id: uniqueId, // Must come AFTER spread to override type.id
        lat: loc.lat,
        lon: loc.lon,
        region: loc.region,
        isActive: true,
        lastVisit: this.visitHistory[uniqueId]?.lastVisit || null,
        visitCount: this.visitHistory[uniqueId]?.count || 0
      };
    });
  }

  // --------------------------------------------------------------------------
  // SANTUARIOS
  // --------------------------------------------------------------------------

  getSanctuaries() {
    return this.sanctuaries.map(sanctuary => ({
      ...sanctuary,
      canVisit: this.canVisitSanctuary(sanctuary),
      cooldownRemaining: this.getCooldownRemaining(sanctuary),
      guardianAvailable: this.isGuardianAvailable(sanctuary)
    }));
  }

  canVisitSanctuary(sanctuary) {
    if (!sanctuary.lastVisit) return true;
    const timeSinceVisit = Date.now() - sanctuary.lastVisit;
    return timeSinceVisit >= sanctuary.cooldown;
  }

  getCooldownRemaining(sanctuary) {
    if (!sanctuary.lastVisit) return 0;
    const timeSinceVisit = Date.now() - sanctuary.lastVisit;
    const remaining = sanctuary.cooldown - timeSinceVisit;
    return Math.max(0, remaining);
  }

  isGuardianAvailable(sanctuary) {
    if (this.discoveredGuardians[sanctuary.guardian.id]) return false;
    return sanctuary.visitCount >= sanctuary.guardian.requiredVisits;
  }

  /**
   * Enviar un ser a entrenar en un santuario
   */
  async sendToSanctuary(beingId, sanctuaryId) {
    const sanctuary = this.sanctuaries.find(s => s.id === sanctuaryId);
    if (!sanctuary) throw new Error('Santuario no encontrado');
    if (!this.canVisitSanctuary(sanctuary)) throw new Error('Santuario en cooldown');

    // Registrar entrenamiento
    this.beingsInTraining[beingId] = {
      sanctuaryId,
      startTime: Date.now(),
      endTime: Date.now() + sanctuary.duration,
      boostAttribute: sanctuary.boostAttribute,
      boostAmount: Math.floor(
        Math.random() * (sanctuary.boostAmount.max - sanctuary.boostAmount.min + 1) +
        sanctuary.boostAmount.min
      )
    };

    // Actualizar historial de visitas
    const visitKey = sanctuaryId;
    if (!this.visitHistory[visitKey]) {
      this.visitHistory[visitKey] = { count: 0, lastVisit: null };
    }
    this.visitHistory[visitKey].count++;
    this.visitHistory[visitKey].lastVisit = Date.now();

    // Actualizar santuario
    const sanctuaryIndex = this.sanctuaries.findIndex(s => s.id === sanctuaryId);
    this.sanctuaries[sanctuaryIndex].visitCount = this.visitHistory[visitKey].count;
    this.sanctuaries[sanctuaryIndex].lastVisit = Date.now();

    await this.saveState();

    return {
      success: true,
      training: this.beingsInTraining[beingId],
      guardianAvailable: this.isGuardianAvailable(sanctuary)
    };
  }

  /**
   * Completar entrenamiento y obtener bonus
   */
  async completeTraining(beingId) {
    const training = this.beingsInTraining[beingId];
    if (!training) return null;

    if (Date.now() < training.endTime) {
      return { complete: false, remainingTime: training.endTime - Date.now() };
    }

    const result = {
      complete: true,
      attribute: training.boostAttribute,
      boost: training.boostAmount
    };

    delete this.beingsInTraining[beingId];
    await this.saveState();

    return result;
  }

  getTrainingStatus(beingId) {
    const training = this.beingsInTraining[beingId];
    if (!training) return null;

    return {
      ...training,
      isComplete: Date.now() >= training.endTime,
      remainingTime: Math.max(0, training.endTime - Date.now()),
      progress: Math.min(1, (Date.now() - training.startTime) / (training.endTime - training.startTime))
    };
  }

  // --------------------------------------------------------------------------
  // ZONAS CORRUPTAS
  // --------------------------------------------------------------------------

  /**
   * Generar zonas corruptas cerca de crisis no resueltas
   */
  generateCorruptionZones(crises) {
    this.corruptionZones = [];

    crises.forEach(crisis => {
      // Solo crisis de alta urgencia pueden generar zonas
      if (crisis.urgency < 7) return;

      // Determinar tipo de zona según tipo de crisis
      let zoneType = null;
      for (const [key, zone] of Object.entries(CORRUPTION_ZONES)) {
        if (zone.spawnNearCrisisTypes?.includes(crisis.type)) {
          if (Math.random() < 0.3) { // 30% chance
            zoneType = zone;
            break;
          }
        }
      }

      // Void zones solo si hay crisis críticas no resueltas
      if (crisis.urgency >= 9 && Math.random() < 0.1) {
        zoneType = CORRUPTION_ZONES.void;
      }

      if (zoneType) {
        this.corruptionZones.push({
          id: `corruption_${crisis.id}`,
          ...zoneType,
          lat: crisis.lat + (Math.random() - 0.5) * 2,
          lon: crisis.lon + (Math.random() - 0.5) * 2,
          linkedCrisisId: crisis.id,
          createdAt: Date.now(),
          expiresAt: Date.now() + 48 * 60 * 60 * 1000 // 48 horas
        });
      }
    });

    return this.corruptionZones;
  }

  getCorruptionZones() {
    // Filtrar zonas expiradas
    const now = Date.now();
    this.corruptionZones = this.corruptionZones.filter(z => z.expiresAt > now);
    return this.corruptionZones;
  }

  /**
   * Enviar ser a zona corrupta (riesgo/recompensa)
   */
  async sendToCorruptionZone(beingId, zoneId, beingStats) {
    const zone = this.corruptionZones.find(z => z.id === zoneId);
    if (!zone) throw new Error('Zona corrupta no encontrada');

    // Calcular resultado basado en stats del ser
    const resilience = beingStats.resilience || 50;
    const wisdom = beingStats.wisdom || 50;
    const protectionFactor = (resilience + wisdom) / 200; // 0-1

    const corruptionRoll = Math.random();
    const adjustedChance = zone.corruptionChance * (1 - protectionFactor * 0.5);

    const result = {
      zoneId,
      beingId,
      timestamp: Date.now()
    };

    if (corruptionRoll < adjustedChance) {
      // Corrupción!
      result.corrupted = true;
      result.corruptionType = zone.corruptionType;
      result.negativeTrait = zone.negativeTraits[
        Math.floor(Math.random() * zone.negativeTraits.length)
      ];

      if (zone.canLoseBeing && Math.random() < 0.1) {
        result.beingLost = true;
        result.rescueRequired = true;
      }
    } else {
      // Éxito!
      result.success = true;
      result.rewardMultiplier = zone.rewardMultiplier;

      // Posibilidad de encontrar ser oculto
      if (zone.hiddenBeingChance && Math.random() < zone.hiddenBeingChance) {
        result.hiddenBeingFound = true;
        result.hiddenBeingType = this.generateHiddenBeingFromZone(zone);
      }
    }

    await this.saveState();
    return result;
  }

  generateHiddenBeingFromZone(zone) {
    const types = [
      { id: 'shadow_walker', name: 'Caminante de Sombras', avatar: '🌘', rarity: 'rare' },
      { id: 'void_survivor', name: 'Superviviente del Vacío', avatar: '⚫', rarity: 'epic' },
      { id: 'redeemed_one', name: 'El Redimido', avatar: '🌅', rarity: 'legendary' }
    ];
    return types[Math.floor(Math.random() * types.length)];
  }

  // --------------------------------------------------------------------------
  // GUARDIANES
  // --------------------------------------------------------------------------

  async attemptGuardianCapture(sanctuaryId, quizPassed) {
    const sanctuary = this.sanctuaries.find(s => s.id === sanctuaryId);
    if (!sanctuary) return { success: false, error: 'Santuario no encontrado' };
    if (!this.isGuardianAvailable(sanctuary)) {
      return { success: false, error: 'Guardián no disponible' };
    }
    if (!quizPassed) {
      return { success: false, error: 'Debes pasar el quiz de conocimiento' };
    }

    // Marcar guardián como descubierto
    this.discoveredGuardians[sanctuary.guardian.id] = {
      discoveredAt: Date.now(),
      sanctuaryId
    };

    await this.saveState();

    return {
      success: true,
      guardian: sanctuary.guardian
    };
  }

  getDiscoveredGuardians() {
    return Object.entries(this.discoveredGuardians).map(([id, data]) => ({
      id,
      ...data,
      ...this.getGuardianById(id)
    }));
  }

  getGuardianById(guardianId) {
    for (const sanctuary of Object.values(SANCTUARY_TYPES)) {
      if (sanctuary.guardian.id === guardianId) {
        return sanctuary.guardian;
      }
    }
    return null;
  }

  // --------------------------------------------------------------------------
  // PERSISTENCIA
  // --------------------------------------------------------------------------

  async saveState() {
    try {
      await AsyncStorage.setItem('power_nodes_state', JSON.stringify({
        visitHistory: this.visitHistory,
        beingsInTraining: this.beingsInTraining,
        discoveredGuardians: this.discoveredGuardians,
        corruptionZones: this.corruptionZones
      }));
    } catch (error) {
      logger.error('PowerNodesService', 'Error saving state:', error);
    }
  }

  async loadState() {
    try {
      const data = await AsyncStorage.getItem('power_nodes_state');
      if (data) {
        const parsed = JSON.parse(data);
        this.visitHistory = parsed.visitHistory || {};
        this.beingsInTraining = parsed.beingsInTraining || {};
        this.discoveredGuardians = parsed.discoveredGuardians || {};
        this.corruptionZones = parsed.corruptionZones || [];
      }
    } catch (error) {
      logger.error('PowerNodesService', 'Error loading state:', error);
    }
  }
}

export const powerNodesService = new PowerNodesService();
export { SANCTUARY_TYPES, CORRUPTION_ZONES };
export default PowerNodesService;
