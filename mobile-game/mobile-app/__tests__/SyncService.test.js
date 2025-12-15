/**
 * SYNC SERVICE TESTS
 * Unit tests for synchronization service
 *
 * Coverage:
 * - Sync from web (beings, progress, societies)
 * - Conflict detection and resolution
 * - Merge strategies
 * - Error handling
 * - Network requests (mocked)
 * - AsyncStorage operations
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import SyncService from '../src/services/SyncService';
import { API_BASE_URL } from '../src/config/constants';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve())
}));

// Mock fetch
global.fetch = jest.fn();

describe('SyncService', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    AsyncStorage.getItem.mockResolvedValue(null);

    // Reset sync flag
    SyncService.syncInProgress = false;
  });

  // ═══════════════════════════════════════════════════════════
  // TESTS DE SINCRONIZACIÓN DESDE WEB
  // ═══════════════════════════════════════════════════════════

  describe('syncFromWeb', () => {
    const idUsuario = 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6';

    test('should sync successfully from web', async () => {
      // Mock API responses
      fetch
        .mockResolvedValueOnce({
          json: async () => ({
            status: 'success',
            data: { beings: [{ id: 'being-1', name: 'Test Being' }] }
          })
        })
        .mockResolvedValueOnce({
          json: async () => ({
            status: 'success',
            data: { progress: [] }
          })
        })
        .mockResolvedValueOnce({
          json: async () => ({
            status: 'success',
            data: { societies: [] }
          })
        });

      const resultado = await SyncService.syncFromWeb(idUsuario);

      expect(resultado.success).toBe(true);
      expect(resultado.result).toHaveProperty('beings');
      expect(resultado.result).toHaveProperty('progress');
      expect(resultado.result).toHaveProperty('societies');

      // Verify timestamp was saved
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'last_sync_from_web',
        expect.any(String)
      );
    });

    test('should prevent concurrent sync operations', async () => {
      SyncService.syncInProgress = true;

      const resultado = await SyncService.syncFromWeb(idUsuario);

      expect(resultado.success).toBe(false);
      expect(resultado.reason).toBe('sync_in_progress');
      expect(fetch).not.toHaveBeenCalled();
    });

    test('should handle sync errors gracefully', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      const resultado = await SyncService.syncFromWeb(idUsuario);

      expect(resultado.success).toBe(false);
      expect(resultado.error).toBe('Network error');
      expect(SyncService.syncInProgress).toBe(false); // Flag reset
    });
  });

  // ═══════════════════════════════════════════════════════════
  // TESTS DE SINCRONIZACIÓN DE SERES
  // ═══════════════════════════════════════════════════════════

  describe('syncBeingsFromWeb', () => {
    const idUsuario = 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6';

    test('should sync new beings from web', async () => {
      const seresDeWeb = [
        { id: 'being-1', name: 'Web Being 1', attributes: { empathy: 80 } },
        { id: 'being-2', name: 'Web Being 2', attributes: { action: 70 } }
      ];

      fetch.mockResolvedValueOnce({
        json: async () => ({
          status: 'success',
          data: { beings: seresDeWeb }
        })
      });

      // No beings in mobile storage
      AsyncStorage.getItem.mockResolvedValueOnce(null);

      const resultado = await SyncService.syncBeingsFromWeb(idUsuario);

      expect(resultado.new).toBe(2);
      expect(resultado.updated).toBe(0);
      expect(resultado.total).toBe(2);

      // Verify beings were stored
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        `mobile_beings_${idUsuario}`,
        expect.stringContaining('being-1')
      );
    });

    test('should detect and sync updated beings', async () => {
      const seresDeWeb = [
        {
          id: 'being-1',
          name: 'Updated Being',
          attributes: { empathy: 90 } // Changed
        }
      ];

      const seresEnMovil = [
        {
          id: 'mobile-being-1',
          web_being_id: 'being-1',
          name: 'Old Being',
          attributes: { empathy: 80 }
        }
      ];

      fetch.mockResolvedValueOnce({
        json: async () => ({
          status: 'success',
          data: { beings: seresDeWeb }
        })
      });

      AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(seresEnMovil));

      const resultado = await SyncService.syncBeingsFromWeb(idUsuario);

      expect(resultado.new).toBe(0);
      expect(resultado.updated).toBe(1);
    });

    test('should handle API errors', async () => {
      fetch.mockResolvedValueOnce({
        json: async () => ({
          status: 'error',
          message: 'Failed to fetch beings'
        })
      });

      await expect(
        SyncService.syncBeingsFromWeb(idUsuario)
      ).rejects.toThrow('Failed to fetch beings');
    });

    test('should handle network errors', async () => {
      fetch.mockRejectedValueOnce(new Error('Network timeout'));

      await expect(
        SyncService.syncBeingsFromWeb(idUsuario)
      ).rejects.toThrow('Network timeout');
    });
  });

  // ═══════════════════════════════════════════════════════════
  // TESTS DE SINCRONIZACIÓN DE PROGRESO
  // ═══════════════════════════════════════════════════════════

  describe('syncProgressFromWeb', () => {
    const idUsuario = 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6';

    test('should sync reading progress from web', async () => {
      const progresoDeWeb = [
        {
          book_id: 'book-1',
          chapter_id: 'chapter-1',
          progress_percent: 50,
          updated_at: '2025-01-01T12:00:00Z'
        },
        {
          book_id: 'book-1',
          chapter_id: 'chapter-2',
          progress_percent: 75,
          updated_at: '2025-01-02T12:00:00Z'
        }
      ];

      fetch.mockResolvedValueOnce({
        json: async () => ({
          status: 'success',
          data: { progress: progresoDeWeb }
        })
      });

      AsyncStorage.getItem.mockResolvedValue(null);

      const resultado = await SyncService.syncProgressFromWeb(idUsuario);

      expect(resultado.synced).toBe(2);

      // Verify progress was stored
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        `mobile_progress_${idUsuario}`,
        expect.any(String)
      );
    });

    test('should merge progress correctly (web wins if more recent)', async () => {
      const progresoDeWeb = [
        {
          book_id: 'book-1',
          chapter_id: 'chapter-1',
          progress_percent: 80, // Higher than mobile
          updated_at: '2025-01-05T12:00:00Z'
        }
      ];

      const progresoEnMovil = {
        'book-1_chapter-1': {
          book_id: 'book-1',
          chapter_id: 'chapter-1',
          progress_percent: 50, // Lower
          synced_from_web: true,
          last_sync: '2025-01-01T12:00:00Z'
        }
      };

      fetch.mockResolvedValueOnce({
        json: async () => ({
          status: 'success',
          data: { progress: progresoDeWeb }
        })
      });

      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(progresoEnMovil));

      const resultado = await SyncService.syncProgressFromWeb(idUsuario);

      expect(resultado.synced).toBe(1);

      // Verify the call to setItem contains the updated progress
      const llamadasSetItem = AsyncStorage.setItem.mock.calls;
      const llamadaProgreso = llamadasSetItem.find(call =>
        call[0] === `mobile_progress_${idUsuario}`
      );

      expect(llamadaProgreso).toBeDefined();
      const progresoGuardado = JSON.parse(llamadaProgreso[1]);
      expect(progresoGuardado['book-1_chapter-1'].progress_percent).toBe(80);
    });

    test('should not overwrite if mobile progress is higher', async () => {
      const progresoDeWeb = [
        {
          book_id: 'book-1',
          chapter_id: 'chapter-1',
          progress_percent: 50 // Lower than mobile
        }
      ];

      const progresoEnMovil = {
        'book-1_chapter-1': {
          progress_percent: 80 // Higher
        }
      };

      fetch.mockResolvedValueOnce({
        json: async () => ({
          status: 'success',
          data: { progress: progresoDeWeb }
        })
      });

      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(progresoEnMovil));

      const resultado = await SyncService.syncProgressFromWeb(idUsuario);

      expect(resultado.synced).toBe(0); // Not synced because mobile is ahead
    });
  });

  // ═══════════════════════════════════════════════════════════
  // TESTS DE SINCRONIZACIÓN DE MICROSOCIEDADES
  // ═══════════════════════════════════════════════════════════

  describe('syncSocietiesFromWeb', () => {
    const idUsuario = 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6';

    test('should sync microsocieties from web', async () => {
      const sociedadesDeWeb = [
        { id: 'society-1', name: 'Test Society', population: 100 },
        { id: 'society-2', name: 'Another Society', population: 50 }
      ];

      fetch.mockResolvedValueOnce({
        json: async () => ({
          status: 'success',
          data: { societies: sociedadesDeWeb }
        })
      });

      const resultado = await SyncService.syncSocietiesFromWeb(idUsuario);

      expect(resultado.count).toBe(2);

      // Verify societies were stored
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        `mobile_societies_${idUsuario}`,
        JSON.stringify(sociedadesDeWeb)
      );
    });

    test('should handle empty societies array', async () => {
      fetch.mockResolvedValueOnce({
        json: async () => ({
          status: 'success',
          data: { societies: [] }
        })
      });

      const resultado = await SyncService.syncSocietiesFromWeb(idUsuario);

      expect(resultado.count).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // TESTS DE HELPERS
  // ═══════════════════════════════════════════════════════════

  describe('Helper Methods', () => {
    const idUsuario = 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6';

    test('getMobileBeings should retrieve beings from AsyncStorage', async () => {
      const seresGuardados = [
        { id: 'being-1', name: 'Stored Being' }
      ];

      AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(seresGuardados));

      const resultado = await SyncService.getMobileBeings(idUsuario);

      expect(resultado).toEqual(seresGuardados);
      expect(AsyncStorage.getItem).toHaveBeenCalledWith(`mobile_beings_${idUsuario}`);
    });

    test('getMobileBeings should return empty array if no data', async () => {
      AsyncStorage.getItem.mockResolvedValueOnce(null);

      const resultado = await SyncService.getMobileBeings(idUsuario);

      expect(resultado).toEqual([]);
    });

    test('insertMobileBeing should add being to storage', async () => {
      const serNuevo = {
        id: 'being-1',
        name: 'New Being',
        attributes: { empathy: 80 }
      };

      AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify([]));

      const resultado = await SyncService.insertMobileBeing(idUsuario, serNuevo, true);

      expect(resultado.id).toBe('being-1');
      expect(resultado.synced_from_web).toBe(true);
      expect(resultado.energy).toBe(100);
      expect(resultado.status).toBe('available');

      // Verify it was stored
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    test('detectBeingChanges should identify new beings', () => {
      const seresDeWeb = [
        { id: 'being-1', name: 'New Being', attributes: { empathy: 80 } },
        { id: 'being-2', name: 'Another Being', attributes: { action: 70 } }
      ];

      const seresEnMovil = [];

      const cambios = SyncService.detectBeingChanges(seresDeWeb, seresEnMovil);

      expect(cambios.new).toHaveLength(2);
      expect(cambios.updated).toHaveLength(0);
    });

    test('detectBeingChanges should identify updated beings', () => {
      const seresDeWeb = [
        { id: 'being-1', name: 'Being 1', attributes: { empathy: 90 } }
      ];

      const seresEnMovil = [
        { id: 'mobile-1', web_being_id: 'being-1', name: 'Being 1', attributes: { empathy: 80 } }
      ];

      const cambios = SyncService.detectBeingChanges(seresDeWeb, seresEnMovil);

      expect(cambios.new).toHaveLength(0);
      expect(cambios.updated).toHaveLength(1);
      expect(cambios.updated[0].id).toBe('being-1');
    });

    test('beingHasChanged should detect attribute changes', () => {
      const serDeWeb = {
        id: 'being-1',
        attributes: { empathy: 90, action: 70 }
      };

      const serEnMovil = {
        id: 'being-1',
        attributes: { empathy: 80, action: 70 }
      };

      const cambiado = SyncService.beingHasChanged(serDeWeb, serEnMovil);

      expect(cambiado).toBe(true);
    });

    test('beingHasChanged should return false if unchanged', () => {
      const serDeWeb = {
        id: 'being-1',
        attributes: { empathy: 80, action: 70 }
      };

      const serEnMovil = {
        id: 'being-1',
        attributes: { empathy: 80, action: 70 }
      };

      const cambiado = SyncService.beingHasChanged(serDeWeb, serEnMovil);

      expect(cambiado).toBe(false);
    });

    test('mergeMobileProgress should update if web progress is higher', async () => {
      const progresoDeWeb = {
        book_id: 'book-1',
        chapter_id: 'chapter-1',
        progress_percent: 80
      };

      const progresoEnMovil = {
        'book-1_chapter-1': {
          progress_percent: 50
        }
      };

      AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(progresoEnMovil));

      const actualizado = await SyncService.mergeMobileProgress(idUsuario, progresoDeWeb);

      expect(actualizado).toBe(true);
    });

    test('mergeMobileProgress should not update if mobile progress is higher', async () => {
      const progresoDeWeb = {
        book_id: 'book-1',
        chapter_id: 'chapter-1',
        progress_percent: 50
      };

      const progresoEnMovil = {
        'book-1_chapter-1': {
          progress_percent: 80
        }
      };

      AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(progresoEnMovil));

      const actualizado = await SyncService.mergeMobileProgress(idUsuario, progresoDeWeb);

      expect(actualizado).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // TESTS DE SINCRONIZACIÓN BIDIRECCIONAL
  // ═══════════════════════════════════════════════════════════

  describe('Bidirectional Sync', () => {
    const idUsuario = 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6';

    test('canWriteToWeb should return false by default', async () => {
      AsyncStorage.getItem.mockResolvedValueOnce(null);

      const puedeEscribir = await SyncService.canWriteToWeb(idUsuario);

      expect(puedeEscribir).toBe(false);
    });

    test('canWriteToWeb should return true if enabled in settings', async () => {
      const configuracion = {
        allow_write_to_web: true
      };

      AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(configuracion));

      const puedeEscribir = await SyncService.canWriteToWeb(idUsuario);

      expect(puedeEscribir).toBe(true);
    });

    test('syncToWeb should reject if write is disabled', async () => {
      AsyncStorage.getItem.mockResolvedValueOnce(null);

      const resultado = await SyncService.syncToWeb(idUsuario);

      expect(resultado.success).toBe(false);
      expect(resultado.reason).toBe('write_to_web_disabled');
      expect(fetch).not.toHaveBeenCalled();
    });

    test('syncToWeb should return not_implemented if enabled', async () => {
      const configuracion = {
        allow_write_to_web: true
      };

      AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(configuracion));

      const resultado = await SyncService.syncToWeb(idUsuario);

      expect(resultado.success).toBe(false);
      expect(resultado.reason).toBe('not_implemented');
    });
  });

  // ═══════════════════════════════════════════════════════════
  // TESTS DE UTILIDADES
  // ═══════════════════════════════════════════════════════════

  describe('Utility Methods', () => {
    test('getLastSyncTimestamp should return timestamp if exists', async () => {
      const fechaGuardada = '2025-01-15T12:00:00Z';
      AsyncStorage.getItem.mockResolvedValueOnce(fechaGuardada);

      const timestamp = await SyncService.getLastSyncTimestamp();

      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.toISOString()).toBe(fechaGuardada);
    });

    test('getLastSyncTimestamp should return null if no sync yet', async () => {
      AsyncStorage.getItem.mockResolvedValueOnce(null);

      const timestamp = await SyncService.getLastSyncTimestamp();

      expect(timestamp).toBeNull();
    });

    test('hasInternetConnection should return true if API is reachable', async () => {
      fetch.mockResolvedValueOnce({
        json: async () => ({
          status: 'success'
        })
      });

      const tieneConexion = await SyncService.hasInternetConnection();

      expect(tieneConexion).toBe(true);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('action=health'),
        expect.objectContaining({ timeout: 3000 })
      );
    });

    test('hasInternetConnection should return false if API is unreachable', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      const tieneConexion = await SyncService.hasInternetConnection();

      expect(tieneConexion).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // TESTS DE INTEGRACIÓN
  // ═══════════════════════════════════════════════════════════

  describe('Integration Tests', () => {
    const idUsuario = 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6';

    test('full sync cycle: beings + progress + societies', async () => {
      // Mock all API calls
      fetch
        .mockResolvedValueOnce({
          json: async () => ({
            status: 'success',
            data: {
              beings: [
                { id: 'being-1', name: 'Being 1', attributes: { empathy: 80 } }
              ]
            }
          })
        })
        .mockResolvedValueOnce({
          json: async () => ({
            status: 'success',
            data: {
              progress: [
                { book_id: 'book-1', chapter_id: 'chapter-1', progress_percent: 50 }
              ]
            }
          })
        })
        .mockResolvedValueOnce({
          json: async () => ({
            status: 'success',
            data: {
              societies: [
                { id: 'society-1', name: 'Society 1', population: 100 }
              ]
            }
          })
        });

      // Mock empty storage
      AsyncStorage.getItem.mockResolvedValue(null);

      const resultado = await SyncService.syncFromWeb(idUsuario);

      expect(resultado.success).toBe(true);
      expect(resultado.result.beings.new).toBe(1);
      expect(resultado.result.progress.synced).toBe(1);
      expect(resultado.result.societies.count).toBe(1);

      // Verify timestamp was saved
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'last_sync_from_web',
        expect.any(String)
      );
    });

    test('should handle partial failures gracefully', async () => {
      // First call succeeds, second fails
      fetch
        .mockResolvedValueOnce({
          json: async () => ({
            status: 'success',
            data: { beings: [] }
          })
        })
        .mockRejectedValueOnce(new Error('Progress API failed'));

      AsyncStorage.getItem.mockResolvedValue(null);

      const resultado = await SyncService.syncFromWeb(idUsuario);

      expect(resultado.success).toBe(false);
      expect(resultado.error).toBe('Progress API failed');
    });
  });
});
