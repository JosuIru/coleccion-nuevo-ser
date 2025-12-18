/**
 * GAME STORE
 * Estado global del juego usando Zustand
 *
 * @version 1.1.0
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { RESOURCES, LEVELS } from '../config/constants';
import logger from '../utils/logger';

// Lock para prevenir race conditions
let saveLock = false;

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
    maxBeings: 3
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
  // ESTADO DE UI
  // ═══════════════════════════════════════════════════════════

  loading: false,
  syncing: false,
  error: null,

  // ═══════════════════════════════════════════════════════════
  // ACCIONES - USUARIO
  // ═══════════════════════════════════════════════════════════

  setUser: (user) => set({ user }),

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
  },

  // ═══════════════════════════════════════════════════════════
  // ACCIONES - SERES
  // ═══════════════════════════════════════════════════════════

  setBeings: (beings) => set({ beings }),

  addBeing: (being) => set((state) => ({
    beings: [...state.beings, being]
  })),

  updateBeing: (beingId, updates) => set((state) => ({
    beings: state.beings.map(being =>
      being.id === beingId ? { ...being, ...updates } : being
    )
  })),

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

  resolveCrisis: (crisisId, success, rewards) => set((state) => {
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
          energy: newEnergy
        }
      };
    }

    return { crises: updatedCrises };
  }),

  // ═══════════════════════════════════════════════════════════
  // ACCIONES - UBICACIÓN Y FRACTALES
  // ═══════════════════════════════════════════════════════════

  setUserLocation: (location) => set({ userLocation: location }),

  setNearbyFractals: (fractals) => set({ nearbyFractals: fractals }),

  collectFractal: (fractalId, rewards) => set((state) => {
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
        energy: newEnergy
      }
    };
  }),

  // ═══════════════════════════════════════════════════════════
  // ACCIONES - CONFIGURACIÓN
  // ═══════════════════════════════════════════════════════════

  updateSettings: (newSettings) => set((state) => ({
    settings: { ...state.settings, ...newSettings }
  })),

  // ═══════════════════════════════════════════════════════════
  // ACCIONES - ESTADO DE UI
  // ═══════════════════════════════════════════════════════════

  setLoading: (loading) => set({ loading }),

  setSyncing: (syncing) => set({ syncing }),

  setError: (error) => set({ error }),

  clearError: () => set({ error: null }),

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

        set({
          user: parsed.user || get().user,
          beings: parsed.beings || [],
          pieces: parsed.pieces || [],
          communities: parsed.communities || [],
          settings: parsed.settings || get().settings
        });

        const beingCount = (parsed.beings || []).length;
        const pieceCount = (parsed.pieces || []).length;
        const communityCount = (parsed.communities || []).length;

        logger.info(`📂 Datos cargados: ${beingCount} seres, ${pieceCount} piezas, ${communityCount} comunidades`, '');

        // Si no hay seres, inicializar uno
        if (!parsed.beings || parsed.beings.length === 0) {
          logger.info('⚠️ No hay seres, inicializando jugador...', '');
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
        consciousnessPoints: 0,
        maxBeings: 3
      },
      beings: [starterBeing],
      pieces: [],
      communities: [],
      crises: initialCrises,
      localCrises: initialCrises,
      error: null
    });

    logger.info('✅ Nuevo jugador inicializado con ser inicial y crisis', '');

    // Guardar inmediatamente
    get().saveToStorage();
  }
}));

export default useGameStore;
