/**
 * GAME STORE
 * Estado global del juego usando Zustand
 *
 * @version 1.1.0
 */

import { create } from 'zustand';
import memoryStorage from '../utils/MemoryStorage';

// Usar MemoryStorage - almacenamiento en memoria sin dependencias nativas
const AsyncStorage = memoryStorage;

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
  // CRISIS ACTIVAS
  // ═══════════════════════════════════════════════════════════

  crises: [],
  localCrises: [],

  // ═══════════════════════════════════════════════════════════
  // MISIONES ACTIVAS
  // ═══════════════════════════════════════════════════════════

  activeMissions: [],

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

  addXP: (amount) => {
    // Validar amount
    if (typeof amount !== 'number' || amount < 0 || !isFinite(amount)) {
      logger.error('Invalid XP amount:', amount);
      return;
    }

    set((state) => {
      const current_xp = state.user.xp || 0;
      const new_xp = Math.min(current_xp + amount, 999999); // Límite máximo
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
   * Guardar estado en AsyncStorage (con lock para evitar race conditions)
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
        settings: state.settings || {}
      };

      await AsyncStorage.setItem('game_state', JSON.stringify(data_to_save));

      logger.info('✅ Estado guardado en AsyncStorage', '');
    } catch (error) {
      logger.error('❌ Error guardando estado:', error);
    } finally {
      saveLock = false;
    }
  },

  /**
   * Cargar estado desde AsyncStorage
   */
  loadFromStorage: async () => {
    try {
      const stored = await AsyncStorage.getItem('game_state');

      if (stored) {
        const parsed = JSON.parse(stored);

        set({
          user: parsed.user || get().user,
          beings: parsed.beings || [],
          settings: parsed.settings || get().settings
        });

        logger.info('✅ Estado cargado desde AsyncStorage', '');
        return true;
      }

      return false;
    } catch (error) {
      logger.error('❌ Error cargando estado:', error);
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
    crises: [],
    localCrises: [],
    activeMissions: [],
    userLocation: null,
    nearbyFractals: [],
    error: null
  })
}));

export default useGameStore;
