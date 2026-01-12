/**
 * GAME STORE
 * Estado global del juego usando Zustand
 *
 * @version 2.0.0 - Integrated new mechanics: Power Nodes, Hidden Beings, Corruption,
 *                   Knowledge Quizzes, Exploration, Evolution, and Transition
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { RESOURCES, LEVELS, UI_TIMING } from '../config/constants';
import logger from '../utils/logger';
import soundService from '../services/SoundService';

// Import new services (use instances via named exports)
import { powerNodesService } from '../services/PowerNodesService';
import { hiddenBeingsService } from '../services/HiddenBeingsService';
import { corruptionService } from '../services/CorruptionService';
import { knowledgeQuizService } from '../services/KnowledgeQuizService';
import { explorationService } from '../services/ExplorationService';
import { evolutionService } from '../services/EvolutionService';
import transitionService from '../services/TransitionService';
import guardiansService from '../services/GuardiansService';
import institutionsService from '../services/InstitutionsService';

// Lock para prevenir race conditions
let saveLock = false;
let pendingSave = false;

// Debounce timer para auto-save
let saveDebounceTimer = null;
const SAVE_DEBOUNCE_MS = UI_TIMING.SAVE_DEBOUNCE;

// Función debounced para guardar con protección contra race conditions
const debouncedSave = (saveFunction) => {
  if (saveDebounceTimer) {
    clearTimeout(saveDebounceTimer);
  }

  // Si hay un guardado en progreso, marcar como pendiente
  if (saveLock) {
    pendingSave = true;
    return;
  }

  saveDebounceTimer = setTimeout(async () => {
    saveDebounceTimer = null;
    await saveFunction();

    // Si hubo saves pendientes mientras guardábamos, ejecutar uno más
    if (pendingSave) {
      pendingSave = false;
      debouncedSave(saveFunction);
    }
  }, SAVE_DEBOUNCE_MS);
};

const useGameStore = create((set, get) => ({
  // ═══════════════════════════════════════════════════════════
  // ESTADO DEL JUGADOR
  // ═══════════════════════════════════════════════════════════

  user: {
    id: null,
    username: null,
    level: 1,
    xp: 0,
    energy: RESOURCES.ENERGY.DEFAULT,
    maxEnergy: RESOURCES.ENERGY.MAX_BASE,
    consciousnessPoints: 0,
    maxBeings: 3,
    // Estadísticas de juego
    stats: {
      crisesResolved: 0,
      fractalsCollected: 0,
      missionsCompleted: 0,
      beingsCreated: 0,
      fusionsPerformed: 0,
      createdAt: null  // Se establece al crear cuenta
    }
  },

  // ═══════════════════════════════════════════════════════════
  // SERES
  // ═══════════════════════════════════════════════════════════

  beings: [],

  // ═══════════════════════════════════════════════════════════
  // PIEZAS/FRAGMENTOS (para crear seres en el Lab)
  // ═══════════════════════════════════════════════════════════

  pieces: [],  // Fragmentos de atributos desbloqueados

  // ═══════════════════════════════════════════════════════════
  // COMUNIDADES DE SERES
  // ═══════════════════════════════════════════════════════════

  communities: [],  // Grupos de seres desbloqueados

  // ═══════════════════════════════════════════════════════════
  // CRISIS ACTIVAS
  // ═══════════════════════════════════════════════════════════

  crises: [],
  localCrises: [],

  // ═══════════════════════════════════════════════════════════
  // MISIONES ACTIVAS
  // ═══════════════════════════════════════════════════════════

  activeMissions: [],

  // ═══════════════════════════════════════════════════════════
  // BOOSTS TEMPORALES
  // ═══════════════════════════════════════════════════════════

  activeBoosts: [], // Array de { type, multiplier, expiresAt }

  // ═══════════════════════════════════════════════════════════
  // UBICACIÓN
  // ═══════════════════════════════════════════════════════════

  userLocation: null,
  nearbyFractals: [],

  // ═══════════════════════════════════════════════════════════
  // CONFIGURACIÓN
  // ═══════════════════════════════════════════════════════════

  settings: {
    syncMode: 'read-only',
    allowWriteToWeb: false,
    notificationsEnabled: true,
    soundEnabled: true,
    hapticsEnabled: true
  },

  // ═══════════════════════════════════════════════════════════
  // POWER NODES - Sanctuaries and Corruption Zones
  // ═══════════════════════════════════════════════════════════

  powerNodes: {
    sanctuaries: [],
    corruptionZones: [],
    activeSanctuary: null,
    lastVisited: {}
  },

  // ═══════════════════════════════════════════════════════════
  // HIDDEN BEINGS - Discoverable entities
  // ═══════════════════════════════════════════════════════════

  hiddenBeings: {
    discovered: [],
    legendaryUnlocked: [],
    nuevoSerUnlocked: false
  },

  // ═══════════════════════════════════════════════════════════
  // CORRUPTION - Being corruption state
  // ═══════════════════════════════════════════════════════════

  corruption: {
    corruptedBeings: [], // IDs of corrupted beings
    redemptionMissions: []
  },

  // ═══════════════════════════════════════════════════════════
  // KNOWLEDGE - Quiz progress
  // ═══════════════════════════════════════════════════════════

  knowledge: {
    completedQuizzes: [],
    quizScores: {},
    wisdomFragments: 0
  },

  // ═══════════════════════════════════════════════════════════
  // EXPLORATION - Map discoveries
  // ═══════════════════════════════════════════════════════════

  exploration: {
    exploredRegions: [],
    discoveries: [],
    currentExpedition: null
  },

  // ═══════════════════════════════════════════════════════════
  // EVOLUTION - Being evolution paths
  // ═══════════════════════════════════════════════════════════

  evolution: {
    beingEvolutions: {}, // beingId -> evolutionPath
    unlockedEvolutions: []
  },

  // ═══════════════════════════════════════════════════════════
  // TRANSITION - Ultimate goal progress
  // ═══════════════════════════════════════════════════════════

  transition: {
    currentTitle: 'Dormido',
    totalTranscendence: 0,
    completedMilestones: [],
    realWorldChallengesUnlocked: false
  },

  // ═══════════════════════════════════════════════════════════
  // GUARDIANS - Los 7 Guardianes del Viejo Paradigma
  // ═══════════════════════════════════════════════════════════

  guardians: {
    all: [],
    transformed: [],
    currentBattle: null,
    battleHistory: [],
    progress: { total: 7, transformed: 0, percentage: 0 }
  },

  // ═══════════════════════════════════════════════════════════
  // INSTITUTIONS - Las 7 Instituciones del Nuevo Ser
  // ═══════════════════════════════════════════════════════════

  institutions: {
    all: [],
    built: [],
    progress: { total: 7, built: 0, percentage: 0 },
    lastResourceCollection: null
  },

  // ═══════════════════════════════════════════════════════════
  // ESTADO DE UI
  // ═══════════════════════════════════════════════════════════

  loading: false,
  syncing: false,
  error: null,

  // ═══════════════════════════════════════════════════════════
  // ACCIONES - USUARIO
  // ═══════════════════════════════════════════════════════════

  setUser: (user) => set((state) => ({
    user: {
      ...user,
      stats: {
        ...state.user.stats,
        ...user.stats,
        // Establecer createdAt solo si no existe
        createdAt: user.stats?.createdAt || state.user.stats?.createdAt || new Date().toISOString()
      }
    }
  })),

  // ═══════════════════════════════════════════════════════════
  // ACCIONES - BOOSTS
  // ═══════════════════════════════════════════════════════════

  addBoost: (type, multiplier, durationHours) => set((state) => {
    const expiresAt = Date.now() + (durationHours * 60 * 60 * 1000);
    const newBoost = { type, multiplier, expiresAt, activatedAt: Date.now() };

    return {
      activeBoosts: [...(state.activeBoosts || []), newBoost]
    };
  }),

  cleanExpiredBoosts: () => set((state) => {
    const now = Date.now();
    return {
      activeBoosts: (state.activeBoosts || []).filter(b => b.expiresAt > now)
    };
  }),

  getActiveBoosts: () => {
    const state = useGameStore.getState();
    const now = Date.now();
    return (state.activeBoosts || []).filter(b => b.expiresAt > now);
  },

  addXP: (amount) => {
    // Validar amount
    if (typeof amount !== 'number' || amount < 0 || !isFinite(amount)) {
      logger.error('Invalid XP amount:', amount);
      return;
    }

    set((state) => {
      // Aplicar multiplicadores de boosts activos
      let finalAmount = amount;
      const now = Date.now();
      const activeXPBoosts = (state.activeBoosts || []).filter(
        b => b.type === 'xp' && b.expiresAt > now
      );
      if (activeXPBoosts.length > 0) {
        const totalMultiplier = activeXPBoosts.reduce((acc, b) => acc * b.multiplier, 1);
        finalAmount = Math.round(amount * totalMultiplier);
      }

      const current_xp = state.user.xp || 0;
      const new_xp = Math.min(current_xp + finalAmount, 999999); // Límite máximo
      let new_level = state.user.level || 1;

      // Verificar si sube de nivel
      const next_level_data = LEVELS[new_level + 1];
      if (next_level_data && new_xp >= next_level_data.xpRequired) {
        new_level++;
      }

      const level_data = LEVELS[new_level] || LEVELS[1];

      return {
        user: {
          ...state.user,
          xp: new_xp,
          level: new_level,
          maxEnergy: level_data.maxEnergy || 100,
          maxBeings: level_data.maxBeings || 3
        }
      };
    });

    // Auto-save after XP change (debounced to prevent race conditions)
    debouncedSave(() => get().saveToStorage());
  },

  consumeEnergy: (amount) => {
    // Validar amount
    if (typeof amount !== 'number' || amount < 0 || !isFinite(amount)) {
      logger.error('Invalid energy amount to consume:', amount);
      return;
    }

    set((state) => {
      const current_energy = state.user.energy || 0;
      const new_energy = Math.max(0, current_energy - amount);

      return {
        user: {
          ...state.user,
          energy: new_energy
        }
      };
    });
  },

  addEnergy: (amount) => {
    // Validar amount
    if (typeof amount !== 'number' || amount < 0 || !isFinite(amount)) {
      logger.error('Invalid energy amount to add:', amount);
      return;
    }

    set((state) => {
      const current_energy = state.user.energy || 0;
      const max_energy = state.user.maxEnergy || 100;
      const new_energy = Math.min(max_energy, current_energy + amount);

      return {
        user: {
          ...state.user,
          energy: new_energy
        }
      };
    });
  },

  updateEnergy: (newEnergy) => {
    // Validar newEnergy
    if (typeof newEnergy !== 'number' || newEnergy < 0 || !isFinite(newEnergy)) {
      logger.error('Invalid energy value to update:', newEnergy);
      return;
    }

    set((state) => {
      const max_energy = state.user.maxEnergy || 100;
      const clamped_energy = Math.min(max_energy, Math.max(0, newEnergy));

      return {
        user: {
          ...state.user,
          energy: clamped_energy
        }
      };
    });
  },

  addConsciousness: (amount) => {
    // Validar amount
    if (typeof amount !== 'number' || amount < 0 || !isFinite(amount)) {
      logger.error('Invalid consciousness amount:', amount);
      return;
    }

    set((state) => {
      const current_consciousness = state.user.consciousnessPoints || 0;
      const new_consciousness = Math.min(current_consciousness + amount, 999999);

      return {
        user: {
          ...state.user,
          consciousnessPoints: new_consciousness
        }
      };
    });

    // Auto-save after consciousness change (debounced to prevent race conditions)
    debouncedSave(() => get().saveToStorage());
  },

  // ═══════════════════════════════════════════════════════════
  // ACCIONES - SERES
  // ═══════════════════════════════════════════════════════════

  setBeings: (beings) => set({ beings }),

  addBeing: (being) => {
    // Reproducir sonido de éxito al crear ser
    if (get().settings?.soundEnabled !== false) {
      soundService.playSuccess();
    }

    return set((state) => ({
      beings: [...state.beings, being],
      user: {
        ...state.user,
        stats: {
          ...state.user.stats,
          beingsCreated: (state.user.stats?.beingsCreated || 0) + 1
        }
      }
    }));
  },

  updateBeing: (beingId, updates) => set((state) => ({
    beings: state.beings.map(being =>
      being.id === beingId ? { ...being, ...updates } : being
    )
  })),

  removeBeing: (beingId) => set((state) => ({
    beings: state.beings.filter(being => being.id !== beingId)
  })),

  /**
   * Fusionar dos seres para crear uno nuevo más poderoso
   * Los seres originales se pierden
   */
  fuseBeings: (being1Id, being2Id) => {
    const state = get();
    const being1 = state.beings.find(b => b.id === being1Id);
    const being2 = state.beings.find(b => b.id === being2Id);

    if (!being1 || !being2) {
      logger.error('Fusion failed: beings not found', { being1Id, being2Id });
      return null;
    }

    // Calcular atributos fusionados (promedio + bonus)
    const fusedAttributes = {};
    const allAttrs = new Set([
      ...Object.keys(being1.attributes || {}),
      ...Object.keys(being2.attributes || {})
    ]);

    allAttrs.forEach(attr => {
      const val1 = being1.attributes?.[attr] || 0;
      const val2 = being2.attributes?.[attr] || 0;
      // Promedio + 20% bonus
      fusedAttributes[attr] = Math.floor((val1 + val2) / 2 * 1.2);
    });

    // Determinar rareza del nuevo ser
    const rarityOrder = ['common', 'rare', 'epic', 'legendary'];
    const rarity1 = rarityOrder.indexOf(being1.rarity || 'common');
    const rarity2 = rarityOrder.indexOf(being2.rarity || 'common');
    const maxRarity = Math.max(rarity1, rarity2);
    // 25% de chance de subir de rareza
    const newRarityIndex = Math.random() < 0.25 && maxRarity < 3
      ? maxRarity + 1
      : maxRarity;
    const newRarity = rarityOrder[newRarityIndex];

    // Crear nuevo ser fusionado
    const fusedBeing = {
      id: `fused_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: `${being1.name?.split(' ')[0] || 'Ser'}-${being2.name?.split(' ')[0] || 'Fusión'}`,
      avatar: being1.avatar || being2.avatar || '🧬',
      level: Math.max(being1.level || 1, being2.level || 1),
      xp: 0,
      attributes: fusedAttributes,
      rarity: newRarity,
      status: 'available',
      energy: 100,
      maxEnergy: 100,
      fusedFrom: [being1Id, being2Id],
      createdAt: new Date().toISOString(),
      source: 'fusion'
    };

    // Actualizar estado
    set((state) => ({
      beings: [
        ...state.beings.filter(b => b.id !== being1Id && b.id !== being2Id),
        fusedBeing
      ],
      user: {
        ...state.user,
        stats: {
          ...state.user.stats,
          fusionsPerformed: (state.user.stats?.fusionsPerformed || 0) + 1
        }
      }
    }));

    // Reproducir sonido de fusión
    if (get().settings?.soundEnabled !== false) {
      soundService.playFusion();
    }

    return fusedBeing;
  },

  /**
   * Añadir XP a un ser específico (sistema de progresión)
   * Los seres suben de nivel y mejoran atributos
   */
  addBeingXP: (beingId, xpAmount) => {
    if (!beingId || typeof xpAmount !== 'number' || xpAmount <= 0) {
      logger.error('Invalid being XP params:', { beingId, xpAmount });
      return;
    }

    set((state) => {
      const being = state.beings.find(b => b.id === beingId);
      if (!being) return state;

      const currentXP = being.experience || 0;
      const currentLevel = being.level || 1;
      const newXP = currentXP + xpAmount;

      // XP requerido para siguiente nivel: 100 * nivel^1.5
      const xpForNextLevel = Math.floor(100 * Math.pow(currentLevel, 1.5));

      let newLevel = currentLevel;
      let remainingXP = newXP;
      let leveledUp = false;

      // Verificar si sube de nivel (puede subir múltiples)
      while (remainingXP >= xpForNextLevel && newLevel < 50) { // Max nivel 50
        remainingXP -= xpForNextLevel;
        newLevel++;
        leveledUp = true;
      }

      // Si subió de nivel, mejorar atributos
      let newAttributes = being.attributes || {};
      if (leveledUp) {
        const levelsGained = newLevel - currentLevel;
        const attributeKeys = Object.keys(newAttributes);

        // +2 a todos los atributos por cada nivel
        attributeKeys.forEach(attr => {
          newAttributes[attr] = (newAttributes[attr] || 0) + (2 * levelsGained);
        });

        // Bonus extra al atributo más alto
        const topAttr = attributeKeys.reduce((a, b) =>
          (newAttributes[a] || 0) > (newAttributes[b] || 0) ? a : b
        );
        newAttributes[topAttr] = (newAttributes[topAttr] || 0) + (3 * levelsGained);

        logger.info(`🎉 ${being.name} subió a nivel ${newLevel}! (+${levelsGained} niveles)`, '');
      }

      // Recalcular poder total
      const newTotalPower = Object.values(newAttributes).reduce((sum, v) => sum + (v || 0), 0);

      return {
        beings: state.beings.map(b =>
          b.id === beingId
            ? {
                ...b,
                experience: remainingXP,
                level: newLevel,
                attributes: newAttributes,
                totalPower: newTotalPower,
                leveledUpAt: leveledUp ? new Date().toISOString() : b.leveledUpAt
              }
            : b
        )
      };
    });
  },

  /**
   * Obtener XP necesario para siguiente nivel de un ser
   */
  getBeingXPForNextLevel: (beingLevel) => {
    return Math.floor(100 * Math.pow(beingLevel || 1, 1.5));
  },

  deployBeing: (beingId, crisisId) => {
    // Validar inputs
    if (!beingId || !crisisId) {
      set({ error: 'Invalid being or crisis ID' });
      return;
    }

    set((state) => {
      const energy_cost = RESOURCES.ENERGY.COST_DEPLOY_BEING || 10;

      // Verificar si hay energía suficiente
      if (state.user.energy < energy_cost) {
        return { error: 'No hay suficiente energía' };
      }

      // Verificar que el ser existe y está disponible
      const being = state.beings.find(b => b.id === beingId);
      if (!being) {
        return { error: 'Ser no encontrado' };
      }

      if (being.status !== 'available') {
        return { error: 'El ser no está disponible' };
      }

      // Actualizar ser a estado "deployed"
      const updated_beings = state.beings.map(b =>
        b.id === beingId
          ? { ...b, status: 'deployed', currentMission: crisisId }
          : b
      );

      // Consumir energía de manera segura
      const new_energy = Math.max(0, state.user.energy - energy_cost);

      return {
        beings: updated_beings,
        user: { ...state.user, energy: new_energy },
        error: null
      };
    });
  },

  recallBeing: (beingId) => set((state) => ({
    beings: state.beings.map(being =>
      being.id === beingId
        ? { ...being, status: 'available', currentMission: null }
        : being
    )
  })),

  // ═══════════════════════════════════════════════════════════
  // ACCIONES - PIEZAS/FRAGMENTOS
  // ═══════════════════════════════════════════════════════════

  addPiece: (piece) => set((state) => ({
    pieces: [...state.pieces, {
      id: `piece_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      ...piece,
      obtainedAt: new Date().toISOString()
    }]
  })),

  addPieces: (newPieces) => set((state) => ({
    pieces: [...state.pieces, ...newPieces.map(p => ({
      id: `piece_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      ...p,
      obtainedAt: new Date().toISOString()
    }))]
  })),

  removePiece: (pieceId) => set((state) => ({
    pieces: state.pieces.filter(p => p.id !== pieceId)
  })),

  usePieces: (pieceIds) => set((state) => ({
    pieces: state.pieces.filter(p => !pieceIds.includes(p.id))
  })),

  // ═══════════════════════════════════════════════════════════
  // ACCIONES - COMUNIDADES
  // ═══════════════════════════════════════════════════════════

  addCommunity: (community) => set((state) => ({
    communities: [...state.communities, {
      id: `community_${Date.now()}`,
      ...community,
      unlockedAt: new Date().toISOString()
    }]
  })),

  activateCommunity: (communityId) => {
    const state = get();
    const community = state.communities.find(c => c.id === communityId);

    if (!community || community.activated) return;

    // Añadir todos los seres de la comunidad a la colección
    const newBeings = (community.beings || []).map((being, idx) => ({
      id: `${communityId}_being_${idx}_${Date.now()}`,
      ...being,
      status: 'available',
      currentMission: null,
      level: 1,
      experience: 0,
      createdAt: new Date().toISOString(),
      sourceApp: 'community-reward',
      communityId: communityId
    }));

    set((state) => ({
      beings: [...state.beings, ...newBeings],
      communities: state.communities.map(c =>
        c.id === communityId ? { ...c, activated: true } : c
      )
    }));
  },

  // ═══════════════════════════════════════════════════════════
  // ACCIONES - CRISIS
  // ═══════════════════════════════════════════════════════════

  setCrises: (crises) => set({ crises }),

  addCrisis: (crisis) => set((state) => ({
    crises: [...state.crises, crisis]
  })),

  setLocalCrises: (crises) => set({ localCrises: crises }),

  resolveCrisis: (crisisId, success, rewards) => {
    // Reproducir sonido según resultado
    if (get().settings?.soundEnabled !== false) {
      if (success) {
        soundService.playSuccess();
      } else {
        soundService.playError();
      }
    }

    return set((state) => {
      // Remover crisis de la lista
      const updatedCrises = state.crises.filter(c => c.id !== crisisId);

      // Aplicar recompensas si tuvo éxito
      if (success && rewards) {
        const newXP = state.user.xp + (rewards.xp || 0);
        const newConsciousness = state.user.consciousnessPoints + (rewards.consciousness || 0);
        const newEnergy = Math.min(
          state.user.maxEnergy,
          state.user.energy + (rewards.energy || 0)
        );

        return {
          crises: updatedCrises,
          user: {
            ...state.user,
            xp: newXP,
            consciousnessPoints: newConsciousness,
            energy: newEnergy,
            stats: {
              ...state.user.stats,
              crisesResolved: (state.user.stats?.crisesResolved || 0) + 1
            }
          }
        };
      }

      return { crises: updatedCrises };
    });
  },

  // ═══════════════════════════════════════════════════════════
  // ACCIONES - UBICACIÓN Y FRACTALES
  // ═══════════════════════════════════════════════════════════

  setUserLocation: (location) => set({ userLocation: location }),

  setNearbyFractals: (fractals) => set({ nearbyFractals: fractals }),

  collectFractal: (fractalId, rewards) => {
    // Reproducir sonido de recolección
    if (get().settings?.soundEnabled !== false) {
      soundService.playCollect();
    }

    return set((state) => {
      // Remover fractal de la lista
      const updatedFractals = state.nearbyFractals.filter(f => f.id !== fractalId);

      // Aplicar recompensas
      const newConsciousness = state.user.consciousnessPoints + (rewards.consciousness || 0);
      const newEnergy = Math.min(
        state.user.maxEnergy,
        state.user.energy + (rewards.energy || 0)
      );

      return {
        nearbyFractals: updatedFractals,
        user: {
          ...state.user,
          consciousnessPoints: newConsciousness,
          energy: newEnergy,
          stats: {
            ...state.user.stats,
            fractalsCollected: (state.user.stats?.fractalsCollected || 0) + 1
          }
        }
      };
    });
  },

  // ═══════════════════════════════════════════════════════════
  // ACCIONES - CONFIGURACIÓN
  // ═══════════════════════════════════════════════════════════

  updateSettings: (newSettings) => {
    // Sincronizar servicio de sonido si cambia la configuración
    if (newSettings.soundEnabled !== undefined) {
      soundService.setEnabled(newSettings.soundEnabled);
    }

    return set((state) => ({
      settings: { ...state.settings, ...newSettings }
    }));
  },

  // ═══════════════════════════════════════════════════════════
  // ACCIONES - ESTADO DE UI
  // ═══════════════════════════════════════════════════════════

  setLoading: (loading) => set({ loading }),

  setSyncing: (syncing) => set({ syncing }),

  setError: (error) => set({ error }),

  clearError: () => set({ error: null }),

  // ═══════════════════════════════════════════════════════════
  // ACCIONES - POWER NODES (Sanctuaries & Corruption Zones)
  // ═══════════════════════════════════════════════════════════

  initializePowerNodes: async () => {
    try {
      await powerNodesService.initialize();
      const sanctuaries = powerNodesService.getSanctuaries();
      const corruptionZones = powerNodesService.getCorruptionZones();

      set({
        powerNodes: {
          ...get().powerNodes,
          sanctuaries,
          corruptionZones
        }
      });
      logger.info(`⛩️ Power nodes initialized: ${sanctuaries.length} sanctuaries, ${corruptionZones.length} corruption zones`, '');
    } catch (error) {
      logger.error('Error initializing power nodes:', error);
    }
  },

  visitSanctuary: async (sanctuaryId, beingId) => {
    const result = await powerNodesService.visitSanctuary(sanctuaryId, beingId);

    if (result.success) {
      // Update being stats if training was done
      if (result.training) {
        const being = get().beings.find(b => b.id === beingId);
        if (being) {
          const newAttributes = { ...being.attributes };
          Object.entries(result.training.statBoosts || {}).forEach(([stat, boost]) => {
            newAttributes[stat] = (newAttributes[stat] || 0) + boost;
          });

          get().updateBeing(beingId, { attributes: newAttributes });
        }
      }

      // Update transition statistics
      await transitionService.updateStatistic('sanctuariesVisited', 1);

      set((state) => ({
        powerNodes: {
          ...state.powerNodes,
          activeSanctuary: sanctuaryId,
          lastVisited: {
            ...state.powerNodes.lastVisited,
            [sanctuaryId]: new Date().toISOString()
          }
        }
      }));
    }

    return result;
  },

  enterCorruptionZone: async (zoneId, beingId) => {
    const result = await powerNodesService.enterCorruptionZone(zoneId, beingId);

    if (result.corrupted) {
      // Being got corrupted
      await corruptionService.corruptBeing(beingId, result.corruptionType);

      set((state) => ({
        corruption: {
          ...state.corruption,
          corruptedBeings: [...state.corruption.corruptedBeings, beingId]
        }
      }));

      get().updateBeing(beingId, { corrupted: true, corruptionType: result.corruptionType });
    }

    return result;
  },

  // ═══════════════════════════════════════════════════════════
  // ACCIONES - HIDDEN BEINGS
  // ═══════════════════════════════════════════════════════════

  initializeHiddenBeings: async () => {
    try {
      await hiddenBeingsService.initialize();
      const discovered = hiddenBeingsService.getDiscoveredBeings();
      const legendaryUnlocked = hiddenBeingsService.getLegendaryBeings()
        .filter(b => b.unlocked)
        .map(b => b.id);

      set({
        hiddenBeings: {
          ...get().hiddenBeings,
          discovered: discovered.map(b => b.id),
          legendaryUnlocked
        }
      });
    } catch (error) {
      logger.error('Error initializing hidden beings:', error);
    }
  },

  discoverHiddenBeing: async (beingType, context) => {
    const result = await hiddenBeingsService.discoverBeing(beingType, context);

    if (result.being) {
      // Add being to collection
      get().addBeing({
        ...result.being,
        status: 'available',
        currentMission: null,
        level: 1,
        experience: 0,
        createdAt: new Date().toISOString(),
        source: 'hidden-discovery'
      });

      set((state) => ({
        hiddenBeings: {
          ...state.hiddenBeings,
          discovered: [...state.hiddenBeings.discovered, result.being.id]
        }
      }));

      // Update transition statistics
      await transitionService.updateStatistic('hiddenBeingsFound', 1);
    }

    return result;
  },

  unlockLegendaryBeing: async (legendaryId, quizScore) => {
    const result = await hiddenBeingsService.unlockLegendaryBeing(legendaryId, quizScore);

    if (result.unlocked) {
      get().addBeing({
        ...result.being,
        status: 'available',
        currentMission: null,
        level: 1,
        experience: 0,
        createdAt: new Date().toISOString(),
        source: 'legendary-unlock',
        legendary: true
      });

      set((state) => ({
        hiddenBeings: {
          ...state.hiddenBeings,
          legendaryUnlocked: [...state.hiddenBeings.legendaryUnlocked, legendaryId]
        }
      }));

      // Update transition statistics
      await transitionService.updateStatistic('legendaryBeingsUnlocked', 1);
    }

    return result;
  },

  unlockNuevoSer: async () => {
    const progress = get().transition;
    const result = await hiddenBeingsService.checkNuevoSerRequirements({
      totalTranscendence: progress.totalTranscendence,
      completedMilestones: progress.completedMilestones.length,
      legendaryCount: get().hiddenBeings.legendaryUnlocked.length
    });

    if (result.canUnlock) {
      const nuevoSer = await hiddenBeingsService.unlockNuevoSer();

      if (nuevoSer) {
        get().addBeing({
          ...nuevoSer,
          status: 'available',
          level: 50, // Max level
          source: 'ultimate-goal'
        });

        set((state) => ({
          hiddenBeings: {
            ...state.hiddenBeings,
            nuevoSerUnlocked: true
          }
        }));

        await transitionService.updateStatistic('nuevoSerUnlocked', true, false);
      }
    }

    return result;
  },

  // ═══════════════════════════════════════════════════════════
  // ACCIONES - CORRUPTION
  // ═══════════════════════════════════════════════════════════

  purifyBeing: async (beingId, method) => {
    const result = await corruptionService.purifyBeing(beingId, method);

    if (result.purified) {
      get().updateBeing(beingId, {
        corrupted: false,
        corruptionType: null
      });

      set((state) => ({
        corruption: {
          ...state.corruption,
          corruptedBeings: state.corruption.corruptedBeings.filter(id => id !== beingId)
        }
      }));

      // Update transition statistics
      await transitionService.updateStatistic('beingsPurified', 1);
    }

    return result;
  },

  startRedemptionMission: async (beingId) => {
    const being = get().beings.find(b => b.id === beingId);
    if (!being || !being.corrupted) return null;

    const mission = await corruptionService.createRedemptionMission(beingId, being.corruptionType);

    if (mission) {
      set((state) => ({
        corruption: {
          ...state.corruption,
          redemptionMissions: [...state.corruption.redemptionMissions, mission]
        }
      }));
    }

    return mission;
  },

  completeRedemptionMission: async (missionId) => {
    const mission = get().corruption.redemptionMissions.find(m => m.id === missionId);
    if (!mission) return null;

    const result = await corruptionService.completeRedemptionMission(missionId);

    if (result.success) {
      // Purify the being
      await get().purifyBeing(mission.beingId, 'redemption');

      // Remove mission
      set((state) => ({
        corruption: {
          ...state.corruption,
          redemptionMissions: state.corruption.redemptionMissions.filter(m => m.id !== missionId)
        }
      }));
    }

    return result;
  },

  // ═══════════════════════════════════════════════════════════
  // ACCIONES - KNOWLEDGE QUIZZES
  // ═══════════════════════════════════════════════════════════

  initializeQuizzes: async () => {
    try {
      await knowledgeQuizService.initialize();
      const progress = knowledgeQuizService.getProgress();

      set({
        knowledge: {
          ...get().knowledge,
          completedQuizzes: progress.completedQuizzes || [],
          quizScores: progress.scores || {},
          wisdomFragments: progress.wisdomFragments || 0
        }
      });
    } catch (error) {
      logger.error('Error initializing quizzes:', error);
    }
  },

  submitQuizAnswers: async (bookId, answers) => {
    const result = await knowledgeQuizService.submitQuiz(bookId, answers);

    if (result.passed) {
      // Add XP and consciousness rewards
      get().addXP(result.rewards.xp || 0);
      get().addConsciousness(result.rewards.consciousness || 0);

      set((state) => ({
        knowledge: {
          ...state.knowledge,
          completedQuizzes: [...state.knowledge.completedQuizzes, bookId],
          quizScores: {
            ...state.knowledge.quizScores,
            [bookId]: result.score
          },
          wisdomFragments: state.knowledge.wisdomFragments + (result.rewards.wisdomFragments || 0)
        }
      }));

      // Update transition statistics
      await transitionService.updateStatistic('quizzesCompleted', 1);

      // Check if perfect score
      if (result.score === 100) {
        await transitionService.updateStatistic('perfectQuizzes', 1);
      }

      // Check if can unlock legendary being
      const linkedLegendary = knowledgeQuizService.getLinkedLegendary(bookId);
      if (linkedLegendary && result.score >= 80) {
        // Pass legendary ID (extracting from object if needed)
        const legendaryId = linkedLegendary.legendaryId || linkedLegendary.id || linkedLegendary;
        await get().unlockLegendaryBeing(legendaryId, result.score);
      }
    }

    return result;
  },

  getQuizForBook: (bookId) => {
    return knowledgeQuizService.getQuiz(bookId);
  },

  // ═══════════════════════════════════════════════════════════
  // ACCIONES - EXPLORATION
  // ═══════════════════════════════════════════════════════════

  initializeExploration: async () => {
    try {
      await explorationService.initialize();
      const explorationState = explorationService.getExplorationState();

      set({
        exploration: {
          ...get().exploration,
          exploredRegions: explorationState.exploredRegions || [],
          discoveries: explorationState.discoveries || []
        }
      });
    } catch (error) {
      logger.error('Error initializing exploration:', error);
    }
  },

  startExpedition: async (regionId, beingId) => {
    const being = get().beings.find(b => b.id === beingId);
    if (!being) return null;

    // Check energy - use centralized constant
    const energyCost = RESOURCES.EXPLORATION.ENERGY_COST;
    if (get().user.energy < energyCost) {
      return { error: 'No hay suficiente energía para explorar' };
    }

    // Consume energy
    get().consumeEnergy(energyCost);

    // Start expedition
    const expedition = await explorationService.startExpedition(regionId, being);

    if (expedition) {
      get().updateBeing(beingId, { status: 'exploring', currentExpedition: expedition.id });

      set((state) => ({
        exploration: {
          ...state.exploration,
          currentExpedition: expedition
        }
      }));
    }

    return expedition;
  },

  completeExpedition: async () => {
    const currentExpedition = get().exploration.currentExpedition;
    if (!currentExpedition) return null;

    const result = await explorationService.completeExpedition(currentExpedition.id);

    if (result.success) {
      // Process discoveries
      if (result.discoveries) {
        for (const discovery of result.discoveries) {
          // Handle different discovery types
          if (discovery.type === 'hidden_being') {
            await get().discoverHiddenBeing('exploration_find', { regionId: currentExpedition.regionId });
          } else if (discovery.type === 'wisdom_fragment') {
            set((state) => ({
              knowledge: {
                ...state.knowledge,
                wisdomFragments: state.knowledge.wisdomFragments + discovery.amount
              }
            }));
          } else if (discovery.type === 'energy_well') {
            get().addEnergy(discovery.energy);
          }
        }
      }

      // Add XP for completing exploration
      get().addXP(result.xpReward || 30);

      // Update being status
      get().updateBeing(currentExpedition.beingId, {
        status: 'available',
        currentExpedition: null
      });

      // Mark region as explored
      if (!get().exploration.exploredRegions.includes(currentExpedition.regionId)) {
        set((state) => ({
          exploration: {
            ...state.exploration,
            exploredRegions: [...state.exploration.exploredRegions, currentExpedition.regionId],
            discoveries: [...state.exploration.discoveries, ...result.discoveries],
            currentExpedition: null
          }
        }));

        // Update transition statistics
        await transitionService.updateStatistic('regionsExplored', 1);
      } else {
        set((state) => ({
          exploration: {
            ...state.exploration,
            discoveries: [...state.exploration.discoveries, ...result.discoveries],
            currentExpedition: null
          }
        }));
      }
    }

    return result;
  },

  // ═══════════════════════════════════════════════════════════
  // ACCIONES - EVOLUTION
  // ═══════════════════════════════════════════════════════════

  initializeEvolution: async () => {
    try {
      await evolutionService.initialize();
    } catch (error) {
      logger.error('Error initializing evolution:', error);
    }
  },

  checkEvolutionAvailable: (beingId) => {
    const being = get().beings.find(b => b.id === beingId);
    if (!being) return null;

    const currentPath = get().evolution.beingEvolutions[beingId];
    const gameState = {
      quizzesCompleted: get().knowledge.completedQuizzes.length,
      missionsCompleted: get().user.level * 5, // Approximate from level
      regionsExplored: get().exploration.exploredRegions.length
    };

    return evolutionService.getAvailableEvolutions(being, currentPath, gameState);
  },

  evolveBeing: async (beingId, evolutionPathId) => {
    const being = get().beings.find(b => b.id === beingId);
    if (!being) return null;

    const result = await evolutionService.evolveBeing(being, evolutionPathId);

    if (result.success) {
      // Update being with new stats and traits
      get().updateBeing(beingId, {
        ...result.newStats,
        evolutionPath: evolutionPathId,
        evolutionTier: result.newTier,
        traits: [...(being.traits || []), ...(result.newTraits || [])]
      });

      set((state) => ({
        evolution: {
          ...state.evolution,
          beingEvolutions: {
            ...state.evolution.beingEvolutions,
            [beingId]: evolutionPathId
          },
          unlockedEvolutions: state.evolution.unlockedEvolutions.includes(evolutionPathId)
            ? state.evolution.unlockedEvolutions
            : [...state.evolution.unlockedEvolutions, evolutionPathId]
        }
      }));

      // Update transition statistics based on tier
      if (result.newTier === 4) {
        await transitionService.updateStatistic('masteryBeings', 1);
      } else if (result.newTier === 5) {
        await transitionService.updateStatistic('transcendentBeings', 1);
      }
    }

    return result;
  },

  // ═══════════════════════════════════════════════════════════
  // ACCIONES - TRANSITION (Ultimate Goal)
  // ═══════════════════════════════════════════════════════════

  initializeTransition: async () => {
    try {
      const progress = await transitionService.initialize();

      set({
        transition: {
          currentTitle: progress.currentTitle || 'Dormido',
          totalTranscendence: progress.totalTranscendence || 0,
          completedMilestones: progress.completedMilestones || [],
          realWorldChallengesUnlocked: progress.realWorldChallengesUnlocked || false
        }
      });
    } catch (error) {
      logger.error('Error initializing transition:', error);
    }
  },

  getTransitionProgress: () => {
    return transitionService.getProgressReport();
  },

  getTransitionNarrative: () => {
    return transitionService.getTransitionNarrative();
  },

  updateTransitionStat: async (statName, value) => {
    const result = await transitionService.updateStatistic(statName, value);

    if (result.newlyCompletedMilestones?.length > 0) {
      // Update local state with new milestones
      set((state) => ({
        transition: {
          ...state.transition,
          currentTitle: result.progress.currentTitle,
          totalTranscendence: result.progress.totalTranscendence,
          completedMilestones: result.progress.completedMilestones,
          realWorldChallengesUnlocked: result.progress.realWorldChallengesUnlocked
        }
      }));

      // Notify about completed milestones
      result.newlyCompletedMilestones.forEach(milestone => {
        logger.info(`🎯 Milestone completed: ${milestone.milestone.name}`, '');
      });
    }

    return result;
  },

  getRealWorldChallenges: () => {
    return transitionService.getRealWorldChallenges();
  },

  // ═══════════════════════════════════════════════════════════
  // ACCIONES - GUARDIANS (Los 7 Guardianes del Viejo Paradigma)
  // ═══════════════════════════════════════════════════════════

  initializeGuardians: async () => {
    try {
      await guardiansService.initialize();
      const allGuardians = guardiansService.getAllGuardians();
      const progress = guardiansService.getProgress();

      set({
        guardians: {
          all: allGuardians,
          transformed: progress.transformedGuardians || [],
          currentBattle: null,
          battleHistory: guardiansService.getBattleStats().recentBattles || [],
          progress
        }
      });
    } catch (error) {
      logger.error('Error initializing guardians:', error);
    }
  },

  getGuardian: (guardianId) => {
    return guardiansService.getGuardian(guardianId);
  },

  startGuardianBattle: async (guardianId, teamBeingIds) => {
    const beings = get().beings.filter(b => teamBeingIds.includes(b.id));
    if (beings.length === 0) {
      return { success: false, error: 'Selecciona al menos un ser para la batalla' };
    }

    // Get player's unlocked premises (from completed quizzes)
    const playerPremises = get().knowledge.completedQuizzes?.map(bookId => {
      // Map book IDs to premise IDs
      const premiseMap = {
        'codigo-despertar': 'consciencia_fundamental',
        'filosofia-nuevo-ser': 'consciencia_fundamental',
        'manual-transicion': 'madurez_ciclica',
        'practicas-radicales': 'valor_intrinseco',
        'tierra-que-despierta': 'interdependencia_radical',
        'guia-acciones': 'abundancia_organizable',
        'ahora-instituciones': 'interdependencia_radical'
      };
      return premiseMap[bookId];
    }).filter(Boolean) || [];

    // Get institution bonus for this guardian
    const institutionBonus = institutionsService.getGuardianBonus(guardianId);

    const result = await guardiansService.startBattle(guardianId, beings, playerPremises, institutionBonus);

    if (result.success) {
      set((state) => ({
        guardians: {
          ...state.guardians,
          currentBattle: result.battle
        }
      }));
    }

    return result;
  },

  executeGuardianBattleAction: async (actionType, details = {}) => {
    const result = await guardiansService.playerAction(actionType, details);

    // Update battle state
    if (result.battle) {
      set((state) => ({
        guardians: {
          ...state.guardians,
          currentBattle: result.battle
        }
      }));
    }

    // Check if battle ended
    if (result.victory !== undefined) {
      // Battle ended
      set((state) => ({
        guardians: {
          ...state.guardians,
          currentBattle: null,
          all: guardiansService.getAllGuardians(),
          progress: guardiansService.getProgress()
        }
      }));

      // Add rewards
      if (result.victory && result.rewards) {
        get().addXP(result.rewards.xp || 0);
        get().addConsciousness(result.rewards.consciousness || 0);

        // Update transition for guardian transformed
        await transitionService.updateStatistic('guardiansTransformed', 1);

        // Log transformation
        if (result.transformation) {
          logger.info(`✨ Guardián transformado: ${result.guardianName} -> ${result.transformation.name}`, '');
        }
      }
    }

    return result;
  },

  fleeGuardianBattle: async () => {
    const result = await guardiansService.fleeBattle();

    if (result.success) {
      set((state) => ({
        guardians: {
          ...state.guardians,
          currentBattle: null
        }
      }));
    }

    return result;
  },

  getGuardiansProgress: () => {
    return guardiansService.getProgress();
  },

  getGuardianBattleStats: () => {
    return guardiansService.getBattleStats();
  },

  // ═══════════════════════════════════════════════════════════
  // ACCIONES - INSTITUTIONS (Las 7 Instituciones del Nuevo Ser)
  // ═══════════════════════════════════════════════════════════

  initializeInstitutions: async () => {
    try {
      await institutionsService.initialize();
      const allInstitutions = institutionsService.getAllInstitutions();
      const stats = institutionsService.getStats();

      set({
        institutions: {
          all: allInstitutions,
          built: allInstitutions.filter(i => i.isBuilt).map(i => i.id),
          progress: {
            total: stats.total,
            built: stats.built,
            percentage: stats.percentage
          },
          lastResourceCollection: null
        }
      });

      logger.info(`🏛️ Institutions initialized: ${stats.built}/${stats.total} built`, '');
    } catch (error) {
      logger.error('Error initializing institutions:', error);
    }
  },

  getInstitution: (institutionId) => {
    return institutionsService.getInstitution(institutionId);
  },

  canBuildInstitution: (institutionId) => {
    const state = get();
    const gameState = {
      level: state.user.level,
      completedQuizzes: state.knowledge.completedQuizzes || [],
      resources: {
        wisdomFragments: state.knowledge.wisdomFragments || 0
      },
      awakenedBeings: state.beings || [],
      globalConsciousness: state.transition.totalTranscendence || 0,
      transformedGuardians: state.guardians.transformed || []
    };

    return institutionsService.canBuild(institutionId, gameState);
  },

  buildInstitution: async (institutionId) => {
    const state = get();
    const gameState = {
      level: state.user.level,
      completedQuizzes: state.knowledge.completedQuizzes || [],
      resources: {
        wisdomFragments: state.knowledge.wisdomFragments || 0
      },
      awakenedBeings: state.beings || [],
      globalConsciousness: state.transition.totalTranscendence || 0,
      transformedGuardians: state.guardians.transformed || []
    };

    const result = await institutionsService.build(institutionId, gameState);

    if (result.success) {
      // Deduct resources
      const cost = result.resourceCost;
      set((prevState) => ({
        knowledge: {
          ...prevState.knowledge,
          wisdomFragments: (prevState.knowledge.wisdomFragments || 0) - (cost.wisdomFragments || 0)
        }
      }));

      // Update institutions state
      const allInstitutions = institutionsService.getAllInstitutions();
      const stats = institutionsService.getStats();

      set({
        institutions: {
          ...get().institutions,
          all: allInstitutions,
          built: [...get().institutions.built, institutionId],
          progress: {
            total: stats.total,
            built: stats.built,
            percentage: stats.percentage
          }
        }
      });

      // Update transition statistics
      await transitionService.updateStatistic('institutionsBuilt', 1);

      // Add consciousness bonus
      if (result.benefits.globalConsciousnessBonus) {
        get().addConsciousness(result.benefits.globalConsciousnessBonus * 10);
      }

      logger.info(`🏛️ Institution built: ${result.institution.name}`, '');
    }

    return result;
  },

  upgradeInstitution: async (institutionId) => {
    const state = get();
    const gameState = {
      resources: {
        wisdomFragments: state.knowledge.wisdomFragments || 0
      }
    };

    const result = await institutionsService.upgrade(institutionId, gameState);

    if (result.success) {
      // Deduct upgrade cost
      set((prevState) => ({
        knowledge: {
          ...prevState.knowledge,
          wisdomFragments: (prevState.knowledge.wisdomFragments || 0) - result.cost
        }
      }));

      // Update institutions
      const allInstitutions = institutionsService.getAllInstitutions();

      set({
        institutions: {
          ...get().institutions,
          all: allInstitutions
        }
      });

      logger.info(`⬆️ Institution upgraded: ${result.newName}`, '');
    }

    return result;
  },

  collectInstitutionResources: async () => {
    const result = await institutionsService.collectResources();

    if (result.success && result.hasResources) {
      const collected = result.collected;

      // Apply collected resources
      if (collected.wisdomFragments) {
        set((prevState) => ({
          knowledge: {
            ...prevState.knowledge,
            wisdomFragments: (prevState.knowledge.wisdomFragments || 0) + collected.wisdomFragments
          }
        }));
      }

      if (collected.consciousness) {
        get().addConsciousness(collected.consciousness);
      }

      if (collected.healingEnergy) {
        get().addEnergy(collected.healingEnergy);
      }

      set({
        institutions: {
          ...get().institutions,
          lastResourceCollection: Date.now()
        }
      });

      logger.info(`💰 Resources collected from institutions:`, collected);
    }

    return result;
  },

  getInstitutionGuardianBonus: (guardianId) => {
    return institutionsService.getGuardianBonus(guardianId);
  },

  getInstitutionsStats: () => {
    return institutionsService.getStats();
  },

  getAvailableInstitutions: () => {
    const state = get();
    const gameState = {
      level: state.user.level,
      completedQuizzes: state.knowledge.completedQuizzes || [],
      resources: {
        wisdomFragments: state.knowledge.wisdomFragments || 0
      },
      awakenedBeings: state.beings || [],
      globalConsciousness: state.transition.totalTranscendence || 0,
      transformedGuardians: state.guardians.transformed || []
    };

    return institutionsService.getAvailableToBuild(gameState);
  },

  // ═══════════════════════════════════════════════════════════
  // ACCIONES - INITIALIZE ALL NEW SYSTEMS
  // ═══════════════════════════════════════════════════════════

  initializeAllSystems: async () => {
    logger.info('🚀 Initializing all game systems...', '');

    const systemInitializers = [
      { name: 'PowerNodes', init: () => get().initializePowerNodes() },
      { name: 'HiddenBeings', init: () => get().initializeHiddenBeings() },
      { name: 'Quizzes', init: () => get().initializeQuizzes() },
      { name: 'Exploration', init: () => get().initializeExploration() },
      { name: 'Evolution', init: () => get().initializeEvolution() },
      { name: 'Transition', init: () => get().initializeTransition() },
      { name: 'Guardians', init: () => get().initializeGuardians() },
      { name: 'Institutions', init: () => get().initializeInstitutions() }
    ];

    const results = await Promise.allSettled(
      systemInitializers.map(async ({ name, init }) => {
        try {
          await init();
          return { name, success: true };
        } catch (error) {
          logger.warn(`⚠️ ${name} initialization failed:`, error.message);
          return { name, success: false, error: error.message };
        }
      })
    );

    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.filter(r => r.status === 'rejected' || !r.value?.success).length;

    if (failed > 0) {
      logger.warn(`⚠️ Game systems initialized with ${failed} failures (${successful} successful)`, '');
    } else {
      logger.info(`✅ All ${successful} game systems initialized successfully`, '');
    }

    return { successful, failed, total: systemInitializers.length };
  },

  // ═══════════════════════════════════════════════════════════
  // PERSISTENCIA
  // ═══════════════════════════════════════════════════════════

  /**
   * Guardar estado en AsyncStorage REAL (persistente)
   * Incluye: user, beings, pieces, communities, settings
   */
  saveToStorage: async () => {
    // Prevenir guardados concurrentes
    if (saveLock) {
      logger.info('⏳ Save already in progress, skipping...', '');
      return;
    }

    saveLock = true;

    try {
      const state = get();

      // Validar estado antes de guardar
      if (!state.user || !state.user.id) {
        console.warn('⚠️ Invalid state, skipping save');
        return;
      }

      const data_to_save = {
        user: state.user,
        beings: Array.isArray(state.beings) ? state.beings : [],
        pieces: Array.isArray(state.pieces) ? state.pieces : [],
        communities: Array.isArray(state.communities) ? state.communities : [],
        settings: state.settings || {},
        // New mechanics state
        powerNodes: state.powerNodes || {},
        hiddenBeings: state.hiddenBeings || {},
        corruption: state.corruption || {},
        knowledge: state.knowledge || {},
        exploration: state.exploration || {},
        evolution: state.evolution || {},
        transition: state.transition || {},
        guardians: state.guardians || {},
        institutions: state.institutions || {},
        savedAt: new Date().toISOString()
      };

      await AsyncStorage.setItem('game_state', JSON.stringify(data_to_save));

      logger.info('💾 Estado guardado (AsyncStorage persistente)', '');
    } catch (error) {
      logger.error('❌ Error guardando estado:', error);
    } finally {
      saveLock = false;
    }
  },

  /**
   * Cargar estado desde AsyncStorage REAL (persistente)
   */
  loadFromStorage: async () => {
    try {
      const stored = await AsyncStorage.getItem('game_state');

      if (stored) {
        const parsed = JSON.parse(stored);

        // Validar estructura básica de datos
        const isValidData = parsed &&
          typeof parsed === 'object' &&
          (!parsed.user || typeof parsed.user === 'object') &&
          (!parsed.beings || Array.isArray(parsed.beings)) &&
          (!parsed.pieces || Array.isArray(parsed.pieces));

        if (!isValidData) {
          logger.warn('⚠️ Datos corruptos detectados, reinicializando...', '');
          get().initializeNewPlayer();
          return false;
        }

        // Validar y sanitizar user
        const validUser = parsed.user && parsed.user.id ? {
          ...get().user,
          ...parsed.user,
          // Asegurar valores numéricos válidos
          level: Math.max(1, parseInt(parsed.user.level) || 1),
          xp: Math.max(0, parseInt(parsed.user.xp) || 0),
          energy: Math.max(0, parseInt(parsed.user.energy) || RESOURCES.ENERGY.DEFAULT),
          maxEnergy: Math.max(100, parseInt(parsed.user.maxEnergy) || RESOURCES.ENERGY.MAX_BASE),
          consciousnessPoints: Math.max(0, parseInt(parsed.user.consciousnessPoints) || 0)
        } : get().user;

        // Filtrar beings válidos (deben tener id y name)
        const validBeings = Array.isArray(parsed.beings)
          ? parsed.beings.filter(b => b && b.id && typeof b.id === 'string')
          : [];

        set({
          user: validUser,
          beings: validBeings,
          pieces: Array.isArray(parsed.pieces) ? parsed.pieces : [],
          communities: Array.isArray(parsed.communities) ? parsed.communities : [],
          settings: parsed.settings || get().settings,
          // Load new mechanics state with validation
          powerNodes: parsed.powerNodes && typeof parsed.powerNodes === 'object' ? parsed.powerNodes : get().powerNodes,
          hiddenBeings: parsed.hiddenBeings && typeof parsed.hiddenBeings === 'object' ? parsed.hiddenBeings : get().hiddenBeings,
          corruption: parsed.corruption && typeof parsed.corruption === 'object' ? parsed.corruption : get().corruption,
          knowledge: parsed.knowledge && typeof parsed.knowledge === 'object' ? parsed.knowledge : get().knowledge,
          exploration: parsed.exploration && typeof parsed.exploration === 'object' ? parsed.exploration : get().exploration,
          evolution: parsed.evolution && typeof parsed.evolution === 'object' ? parsed.evolution : get().evolution,
          transition: parsed.transition && typeof parsed.transition === 'object' ? parsed.transition : get().transition,
          guardians: parsed.guardians && typeof parsed.guardians === 'object' ? parsed.guardians : get().guardians,
          institutions: parsed.institutions && typeof parsed.institutions === 'object' ? parsed.institutions : get().institutions
        });

        const beingCount = validBeings.length;
        const pieceCount = (parsed.pieces || []).length;
        const communityCount = (parsed.communities || []).length;

        logger.info(`📂 Datos cargados: ${beingCount} seres, ${pieceCount} piezas, ${communityCount} comunidades`, '');

        // Si no hay seres válidos, inicializar uno
        if (validBeings.length === 0) {
          logger.info('⚠️ No hay seres válidos, inicializando jugador...', '');
          get().initializeNewPlayer();
        }

        return true;
      }

      // No hay datos guardados, inicializar nuevo jugador
      logger.info('📱 Primera ejecución, inicializando nuevo jugador...', '');
      get().initializeNewPlayer();
      return true;
    } catch (error) {
      logger.error('❌ Error cargando estado:', error);
      // En caso de error, asegurar que hay un ser disponible
      get().initializeNewPlayer();
      return false;
    }
  },

  /**
   * Resetear estado (logout)
   */
  reset: () => set({
    user: {
      id: null,
      username: null,
      level: 1,
      xp: 0,
      energy: RESOURCES.ENERGY.DEFAULT,
      maxEnergy: RESOURCES.ENERGY.MAX_BASE,
      consciousnessPoints: 0,
      maxBeings: 3
    },
    beings: [],
    pieces: [],
    communities: [],
    crises: [],
    localCrises: [],
    activeMissions: [],
    userLocation: null,
    nearbyFractals: [],
    error: null
  }),

  /**
   * Inicializar nuevo jugador con datos base
   */
  initializeNewPlayer: () => {
    const playerId = 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

    // Ser inicial - "Primer Despertar"
    const starterBeing = {
      id: 'being_starter_' + Date.now(),
      name: 'Primer Despertar',
      avatar: '🌱',
      status: 'available',
      currentMission: null,
      level: 1,
      experience: 0,
      createdAt: new Date().toISOString(),
      attributes: {
        reflection: 25,
        analysis: 20,
        creativity: 30,
        empathy: 35,
        communication: 25,
        leadership: 15,
        action: 20,
        resilience: 25,
        strategy: 15,
        consciousness: 40,
        connection: 30,
        wisdom: 20,
        organization: 15,
        collaboration: 25,
        technical: 10
      }
    };

    // Crisis locales iniciales para empezar a jugar
    const initialCrises = [
      {
        id: 'crisis_local_1',
        type: 'social',
        title: 'Falta de conexión comunitaria',
        description: 'Los vecinos del barrio no se conocen entre sí. Se necesita fomentar encuentros.',
        lat: 40.4168 + (Math.random() - 0.5) * 0.02,
        lon: -3.7038 + (Math.random() - 0.5) * 0.02,
        scale: 'local',
        difficulty: 1,
        requiredAttributes: { empathy: 20, communication: 15 },
        rewards: { xp: 50, consciousness: 20, energy: 10 },
        duration: 30 // 30 minutos
      },
      {
        id: 'crisis_local_2',
        type: 'environmental',
        title: 'Parque descuidado',
        description: 'Un parque cercano necesita limpieza y cuidado de sus plantas.',
        lat: 40.4168 + (Math.random() - 0.5) * 0.02,
        lon: -3.7038 + (Math.random() - 0.5) * 0.02,
        scale: 'local',
        difficulty: 1,
        requiredAttributes: { action: 15, connection: 20 },
        rewards: { xp: 40, consciousness: 15, energy: 15 },
        duration: 20
      },
      {
        id: 'crisis_local_3',
        type: 'educational',
        title: 'Niños sin apoyo escolar',
        description: 'Varios niños del barrio necesitan ayuda con sus tareas.',
        lat: 40.4168 + (Math.random() - 0.5) * 0.02,
        lon: -3.7038 + (Math.random() - 0.5) * 0.02,
        scale: 'local',
        difficulty: 2,
        requiredAttributes: { wisdom: 25, communication: 20 },
        rewards: { xp: 75, consciousness: 30, energy: 5 },
        duration: 45
      }
    ];

    set({
      user: {
        id: playerId,
        username: 'Nuevo Ser',
        level: 1,
        xp: 0,
        energy: RESOURCES.ENERGY.DEFAULT,
        maxEnergy: RESOURCES.ENERGY.MAX_BASE,
        consciousnessPoints: 100, // 100 puntos iniciales para poder crear seres
        maxBeings: 3,
        stats: {
          crisesResolved: 0,
          fractalsCollected: 0,
          missionsCompleted: 0,
          beingsCreated: 1, // El ser inicial cuenta
          fusionsPerformed: 0,
          createdAt: new Date().toISOString()
        },
        // Flag para onboarding
        onboardingCompleted: false,
        tutorialStep: 'completed'
      },
      beings: [starterBeing],
      pieces: [],
      communities: [],
      crises: initialCrises,
      localCrises: initialCrises,
      error: null
    });

    logger.info('✅ Nuevo jugador inicializado con ser "Primer Despertar" y 100 puntos de consciencia', '');

    // Guardar inmediatamente
    get().saveToStorage();
  }
}));

export default useGameStore;
