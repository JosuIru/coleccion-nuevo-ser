/**
 * GAME STORE TESTS
 * Unit tests for Zustand game store
 *
 * Coverage:
 * - User state management (XP, level, energy, consciousness)
 * - Beings management (add, update, deploy, recall)
 * - Crisis management
 * - Fractals collection
 * - AsyncStorage persistence
 * - Settings management
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import useGameStore from '../src/stores/gameStore';
import { RESOURCES, LEVELS } from '../src/config/constants';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve())
}));

describe('GameStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    const { reset } = useGameStore.getState();
    reset();

    // Clear all mocks
    jest.clearAllMocks();
  });

  // ═══════════════════════════════════════════════════════════
  // TESTS DE USUARIO
  // ═══════════════════════════════════════════════════════════

  describe('User Management', () => {
    test('should initialize with default user state', () => {
      const { user } = useGameStore.getState();

      expect(user).toEqual({
        id: null,
        username: null,
        level: 1,
        xp: 0,
        energy: RESOURCES.ENERGY.DEFAULT,
        maxEnergy: RESOURCES.ENERGY.MAX_BASE,
        consciousnessPoints: 0,
        maxBeings: 3
      });
    });

    test('setUser should update user state', () => {
      const { setUser, user } = useGameStore.getState();

      const nuevoUsuario = {
        id: 'test-user-123',
        username: 'TestUser',
        level: 1,
        xp: 0,
        energy: 100,
        maxEnergy: 100,
        consciousnessPoints: 0,
        maxBeings: 3
      };

      setUser(nuevoUsuario);

      const estadoActualizado = useGameStore.getState().user;
      expect(estadoActualizado).toEqual(nuevoUsuario);
    });

    test('addXP should increase XP without leveling up', () => {
      const { addXP } = useGameStore.getState();

      addXP(50);

      const { user } = useGameStore.getState();
      expect(user.xp).toBe(50);
      expect(user.level).toBe(1);
    });

    test('addXP should level up when reaching threshold', () => {
      const { addXP } = useGameStore.getState();

      // Level 2 requires 100 XP
      addXP(100);

      const { user } = useGameStore.getState();
      expect(user.xp).toBe(100);
      expect(user.level).toBe(2);
      expect(user.maxEnergy).toBe(LEVELS[2].maxEnergy);
      expect(user.maxBeings).toBe(LEVELS[2].maxBeings);
    });

    test('addXP should handle multiple level ups correctly', () => {
      const { addXP } = useGameStore.getState();

      // Add enough XP to reach level 3 (requires 250)
      addXP(250);

      const { user } = useGameStore.getState();
      expect(user.level).toBe(3);
      expect(user.maxBeings).toBe(LEVELS[3].maxBeings);
    });

    test('consumeEnergy should decrease energy', () => {
      const { consumeEnergy } = useGameStore.getState();

      consumeEnergy(20);

      const { user } = useGameStore.getState();
      expect(user.energy).toBe(80);
    });

    test('consumeEnergy should not go below 0', () => {
      const { consumeEnergy } = useGameStore.getState();

      consumeEnergy(150); // More than available

      const { user } = useGameStore.getState();
      expect(user.energy).toBe(0);
    });

    test('addEnergy should increase energy', () => {
      const { consumeEnergy, addEnergy } = useGameStore.getState();

      consumeEnergy(30); // Reduce to 70
      addEnergy(20);

      const { user } = useGameStore.getState();
      expect(user.energy).toBe(90);
    });

    test('addEnergy should not exceed maxEnergy', () => {
      const { addEnergy } = useGameStore.getState();

      addEnergy(50); // Try to go to 150

      const { user } = useGameStore.getState();
      expect(user.energy).toBe(100); // Capped at maxEnergy
    });

    test('addConsciousness should increase consciousness points', () => {
      const { addConsciousness } = useGameStore.getState();

      addConsciousness(50);
      addConsciousness(30);

      const { user } = useGameStore.getState();
      expect(user.consciousnessPoints).toBe(80);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // TESTS DE SERES
  // ═══════════════════════════════════════════════════════════

  describe('Beings Management', () => {
    const serDePrueba = {
      id: 'being-123',
      name: 'Test Being',
      attributes: { reflection: 80, empathy: 60 },
      status: 'available',
      currentMission: null
    };

    test('should initialize with empty beings array', () => {
      const { beings } = useGameStore.getState();
      expect(beings).toEqual([]);
    });

    test('addBeing should add being to array', () => {
      const { addBeing } = useGameStore.getState();

      addBeing(serDePrueba);

      const { beings } = useGameStore.getState();
      expect(beings).toHaveLength(1);
      expect(beings[0]).toEqual(serDePrueba);
    });

    test('setBeings should replace entire beings array', () => {
      const { setBeings } = useGameStore.getState();

      const nuevosSeres = [
        { id: 'being-1', name: 'Being 1', status: 'available' },
        { id: 'being-2', name: 'Being 2', status: 'available' }
      ];

      setBeings(nuevosSeres);

      const { beings } = useGameStore.getState();
      expect(beings).toHaveLength(2);
      expect(beings).toEqual(nuevosSeres);
    });

    test('updateBeing should update specific being', () => {
      const { addBeing, updateBeing } = useGameStore.getState();

      addBeing(serDePrueba);
      updateBeing('being-123', { name: 'Updated Name' });

      const { beings } = useGameStore.getState();
      expect(beings[0].name).toBe('Updated Name');
      expect(beings[0].attributes).toEqual(serDePrueba.attributes);
    });

    test('deployBeing should deploy being and consume energy', () => {
      const { addBeing, deployBeing } = useGameStore.getState();

      addBeing(serDePrueba);
      deployBeing('being-123', 'crisis-456');

      const state = useGameStore.getState();

      expect(state.beings[0].status).toBe('deployed');
      expect(state.beings[0].currentMission).toBe('crisis-456');
      expect(state.user.energy).toBe(90); // 100 - 10
    });

    test('deployBeing should fail if not enough energy', () => {
      const { addBeing, consumeEnergy, deployBeing } = useGameStore.getState();

      addBeing(serDePrueba);
      consumeEnergy(95); // Leave only 5 energy

      deployBeing('being-123', 'crisis-456');

      const state = useGameStore.getState();

      expect(state.beings[0].status).toBe('available'); // Not deployed
      expect(state.error).toBe('No hay suficiente energía');
    });

    test('recallBeing should recall deployed being', () => {
      const { addBeing, deployBeing, recallBeing } = useGameStore.getState();

      addBeing(serDePrueba);
      deployBeing('being-123', 'crisis-456');
      recallBeing('being-123');

      const state = useGameStore.getState();

      expect(state.beings[0].status).toBe('available');
      expect(state.beings[0].currentMission).toBeNull();
    });
  });

  // ═══════════════════════════════════════════════════════════
  // TESTS DE CRISIS
  // ═══════════════════════════════════════════════════════════

  describe('Crisis Management', () => {
    const crisisDePrueba = {
      id: 'crisis-123',
      type: 'environmental',
      severity: 'high',
      lat: 40.4168,
      lon: -3.7038
    };

    test('addCrisis should add crisis to array', () => {
      const { addCrisis } = useGameStore.getState();

      addCrisis(crisisDePrueba);

      const { crises } = useGameStore.getState();
      expect(crises).toHaveLength(1);
      expect(crises[0]).toEqual(crisisDePrueba);
    });

    test('setCrises should replace entire crises array', () => {
      const { setCrises } = useGameStore.getState();

      const nuevasCrisis = [
        { id: 'crisis-1', type: 'social' },
        { id: 'crisis-2', type: 'economic' }
      ];

      setCrises(nuevasCrisis);

      const { crises } = useGameStore.getState();
      expect(crises).toEqual(nuevasCrisis);
    });

    test('resolveCrisis should remove crisis and give rewards on success', () => {
      const { addCrisis, resolveCrisis } = useGameStore.getState();

      addCrisis(crisisDePrueba);

      const recompensas = {
        xp: 100,
        consciousness: 50,
        energy: 20
      };

      resolveCrisis('crisis-123', true, recompensas);

      const state = useGameStore.getState();

      expect(state.crises).toHaveLength(0);
      expect(state.user.xp).toBe(100);
      expect(state.user.consciousnessPoints).toBe(50);
      expect(state.user.energy).toBe(100); // Capped at maxEnergy
    });

    test('resolveCrisis should remove crisis without rewards on failure', () => {
      const { addCrisis, resolveCrisis } = useGameStore.getState();

      addCrisis(crisisDePrueba);
      resolveCrisis('crisis-123', false, null);

      const state = useGameStore.getState();

      expect(state.crises).toHaveLength(0);
      expect(state.user.xp).toBe(0);
      expect(state.user.consciousnessPoints).toBe(0);
    });

    test('setLocalCrises should set local crises separately', () => {
      const { setLocalCrises } = useGameStore.getState();

      const crisisLocales = [{ id: 'local-1', type: 'local' }];
      setLocalCrises(crisisLocales);

      const { localCrises } = useGameStore.getState();
      expect(localCrises).toEqual(crisisLocales);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // TESTS DE FRACTALES
  // ═══════════════════════════════════════════════════════════

  describe('Fractal Collection', () => {
    const fractalDePrueba = {
      id: 'fractal-123',
      type: 'wisdom',
      latitude: 40.4168,
      longitude: -3.7038
    };

    test('setNearbyFractals should set nearby fractals', () => {
      const { setNearbyFractals } = useGameStore.getState();

      const fractales = [fractalDePrueba];
      setNearbyFractals(fractales);

      const { nearbyFractals } = useGameStore.getState();
      expect(nearbyFractals).toEqual(fractales);
    });

    test('collectFractal should remove fractal and give rewards', () => {
      const { setNearbyFractals, collectFractal } = useGameStore.getState();

      setNearbyFractals([fractalDePrueba]);

      const recompensas = {
        consciousness: 30,
        energy: 10
      };

      collectFractal('fractal-123', recompensas);

      const state = useGameStore.getState();

      expect(state.nearbyFractals).toHaveLength(0);
      expect(state.user.consciousnessPoints).toBe(30);
      expect(state.user.energy).toBe(100); // Capped
    });

    test('collectFractal should respect maxEnergy cap', () => {
      const { setNearbyFractals, collectFractal, consumeEnergy } = useGameStore.getState();

      setNearbyFractals([fractalDePrueba]);
      consumeEnergy(50); // 50 energy left

      collectFractal('fractal-123', { energy: 60 });

      const state = useGameStore.getState();
      expect(state.user.energy).toBe(100); // Capped, not 110
    });
  });

  // ═══════════════════════════════════════════════════════════
  // TESTS DE UBICACIÓN
  // ═══════════════════════════════════════════════════════════

  describe('Location Management', () => {
    test('setUserLocation should set user location', () => {
      const { setUserLocation } = useGameStore.getState();

      const ubicacion = {
        latitude: 40.4168,
        longitude: -3.7038,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01
      };

      setUserLocation(ubicacion);

      const { userLocation } = useGameStore.getState();
      expect(userLocation).toEqual(ubicacion);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // TESTS DE CONFIGURACIÓN
  // ═══════════════════════════════════════════════════════════

  describe('Settings Management', () => {
    test('should initialize with default settings', () => {
      const { settings } = useGameStore.getState();

      expect(settings).toEqual({
        syncMode: 'read-only',
        allowWriteToWeb: false,
        notificationsEnabled: true,
        soundEnabled: true,
        hapticsEnabled: true
      });
    });

    test('updateSettings should partially update settings', () => {
      const { updateSettings } = useGameStore.getState();

      updateSettings({
        notificationsEnabled: false,
        soundEnabled: false
      });

      const { settings } = useGameStore.getState();

      expect(settings.notificationsEnabled).toBe(false);
      expect(settings.soundEnabled).toBe(false);
      expect(settings.hapticsEnabled).toBe(true); // Unchanged
    });
  });

  // ═══════════════════════════════════════════════════════════
  // TESTS DE UI STATE
  // ═══════════════════════════════════════════════════════════

  describe('UI State Management', () => {
    test('setLoading should set loading state', () => {
      const { setLoading } = useGameStore.getState();

      setLoading(true);
      expect(useGameStore.getState().loading).toBe(true);

      setLoading(false);
      expect(useGameStore.getState().loading).toBe(false);
    });

    test('setSyncing should set syncing state', () => {
      const { setSyncing } = useGameStore.getState();

      setSyncing(true);
      expect(useGameStore.getState().syncing).toBe(true);
    });

    test('setError should set error state', () => {
      const { setError } = useGameStore.getState();

      setError('Test error message');
      expect(useGameStore.getState().error).toBe('Test error message');
    });

    test('clearError should clear error state', () => {
      const { setError, clearError } = useGameStore.getState();

      setError('Test error');
      clearError();

      expect(useGameStore.getState().error).toBeNull();
    });
  });

  // ═══════════════════════════════════════════════════════════
  // TESTS DE PERSISTENCIA
  // ═══════════════════════════════════════════════════════════

  describe('AsyncStorage Persistence', () => {
    test('saveToStorage should save state to AsyncStorage', async () => {
      const { setUser, saveToStorage } = useGameStore.getState();

      setUser({
        id: 'user-123',
        username: 'TestUser',
        level: 2,
        xp: 150,
        energy: 80,
        maxEnergy: 120,
        consciousnessPoints: 50,
        maxBeings: 4
      });

      await saveToStorage();

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'game_state',
        expect.stringContaining('user-123')
      );
    });

    test('loadFromStorage should load state from AsyncStorage', async () => {
      const estadoGuardado = {
        user: {
          id: 'user-456',
          username: 'LoadedUser',
          level: 3,
          xp: 300,
          energy: 150,
          maxEnergy: 150,
          consciousnessPoints: 100,
          maxBeings: 5
        },
        beings: [{ id: 'being-1', name: 'Loaded Being' }],
        settings: { notificationsEnabled: false }
      };

      AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(estadoGuardado));

      const { loadFromStorage } = useGameStore.getState();
      const resultado = await loadFromStorage();

      expect(resultado).toBe(true);

      const state = useGameStore.getState();
      expect(state.user.id).toBe('user-456');
      expect(state.beings).toHaveLength(1);
      expect(state.settings.notificationsEnabled).toBe(false);
    });

    test('loadFromStorage should return false if no data', async () => {
      AsyncStorage.getItem.mockResolvedValueOnce(null);

      const { loadFromStorage } = useGameStore.getState();
      const resultado = await loadFromStorage();

      expect(resultado).toBe(false);
    });

    test('loadFromStorage should handle errors gracefully', async () => {
      AsyncStorage.getItem.mockRejectedValueOnce(new Error('Storage error'));

      const { loadFromStorage } = useGameStore.getState();
      const resultado = await loadFromStorage();

      expect(resultado).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // TESTS DE RESET
  // ═══════════════════════════════════════════════════════════

  describe('Reset State', () => {
    test('reset should restore initial state', () => {
      const { setUser, addBeing, addCrisis, reset } = useGameStore.getState();

      // Modify state
      setUser({ id: 'user-123', username: 'TestUser', level: 5, xp: 1000, energy: 50, maxEnergy: 200, consciousnessPoints: 200, maxBeings: 8 });
      addBeing({ id: 'being-1', name: 'Test' });
      addCrisis({ id: 'crisis-1', type: 'social' });

      // Reset
      reset();

      const state = useGameStore.getState();

      expect(state.user.id).toBeNull();
      expect(state.user.level).toBe(1);
      expect(state.beings).toHaveLength(0);
      expect(state.crises).toHaveLength(0);
      expect(state.error).toBeNull();
    });
  });

  // ═══════════════════════════════════════════════════════════
  // TESTS DE INTEGRACIÓN
  // ═══════════════════════════════════════════════════════════

  describe('Integration Tests', () => {
    test('complete game flow: collect fractal, level up, deploy being', () => {
      const {
        addXP,
        addBeing,
        collectFractal,
        deployBeing,
        setNearbyFractals
      } = useGameStore.getState();

      // Collect fractal for XP
      setNearbyFractals([{ id: 'fractal-1' }]);
      collectFractal('fractal-1', { consciousness: 20, energy: 10 });

      // Add XP to level up
      addXP(100);

      const estadoDespuesDeNivel = useGameStore.getState();
      expect(estadoDespuesDeNivel.user.level).toBe(2);
      expect(estadoDespuesDeNivel.user.maxBeings).toBe(4);

      // Add and deploy being
      addBeing({ id: 'being-1', name: 'Warrior', status: 'available' });
      deployBeing('being-1', 'crisis-1');

      const estadoFinal = useGameStore.getState();
      expect(estadoFinal.beings[0].status).toBe('deployed');
      expect(estadoFinal.user.energy).toBeLessThan(120); // Energy consumed
    });

    test('should handle edge case: deploy being at exactly minimum energy', () => {
      const { addBeing, consumeEnergy, deployBeing } = useGameStore.getState();

      addBeing({ id: 'being-1', name: 'Test', status: 'available' });

      // Leave exactly enough energy (10)
      consumeEnergy(90);

      deployBeing('being-1', 'crisis-1');

      const state = useGameStore.getState();
      expect(state.beings[0].status).toBe('deployed');
      expect(state.user.energy).toBe(0);
    });
  });
});
