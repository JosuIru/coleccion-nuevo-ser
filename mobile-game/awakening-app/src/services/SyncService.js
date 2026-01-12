/**
 * SYNC SERVICE
 * Sistema de sincronización seguro entre web y móvil
 *
 * PRINCIPIO: NO INVASIVO
 * - Solo lee de web (por defecto)
 * - Escribe solo en BD móvil separada
 * - Sincronización bidireccional OPCIONAL y explícita
 *
 * @version 1.1.0
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, SYNC_CONFIG } from '../config/constants';
import logger from '../utils/logger';

class SyncService {
  constructor() {
    this.apiUrl = API_BASE_URL || 'http://localhost/api/mobile-bridge.php';
    this.syncInProgress = false;
    this.syncTimeout = SYNC_CONFIG.TIMEOUT || 10000;
    this.retryAttempts = SYNC_CONFIG.RETRY_ATTEMPTS || 3;
    this.retryDelay = SYNC_CONFIG.RETRY_DELAY || 2000;
  }

  /**
   * Fetch con timeout
   */
  async fetchWithTimeout(url, options = {}, timeout = this.syncTimeout) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }

      throw error;
    }
  }

  /**
   * Retry logic con backoff exponencial
   */
  async retryWithBackoff(fn, attempts = this.retryAttempts) {
    for (let i = 0; i < attempts; i++) {
      try {
        return await fn();
      } catch (error) {
        const is_last_attempt = i === attempts - 1;

        if (is_last_attempt) {
          throw error;
        }

        // Backoff exponencial: 2s, 4s, 8s
        const delay = this.retryDelay * Math.pow(2, i);

        logger.info("`⏳ Retry ${i + 1}/${attempts} en ${delay}ms...`", "");

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  /**
   * Validar respuesta de API
   */
  validateApiResponse(data) {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid API response format');
    }

    if (data.status !== 'success') {
      throw new Error(data.message || 'API request failed');
    }

    if (!data.data) {
      throw new Error('Missing data in API response');
    }

    return true;
  }

  /**
   * Sincronización desde Web → Móvil (SOLO LECTURA)
   * Lee datos de la web y actualiza BD móvil
   */
  async syncFromWeb(userId) {
    if (this.syncInProgress) {
      logger.info('⏳ Sincronización ya en progreso...', '');
      return { success: false, reason: 'sync_in_progress' };
    }

    this.syncInProgress = true;
    logger.info('🔄 Iniciando sincronización desde web...', '');

    try {
      const result = {
        beings: await this.syncBeingsFromWeb(userId),
        progress: await this.syncProgressFromWeb(userId),
        societies: await this.syncSocietiesFromWeb(userId)
      };

      // Guardar timestamp de última sincronización
      await AsyncStorage.setItem(
        'last_sync_from_web',
        new Date().toISOString()
      );

      logger.info('SyncService', 'Sincronización completada:', result);

      this.syncInProgress = false;
      return { success: true, result };

    } catch (error) {
      logger.error('❌ Error en sincronización:', error);
      this.syncInProgress = false;
      return { success: false, error: error.message };
    }
  }

  /**
   * Sincronizar seres desde web
   */
  async syncBeingsFromWeb(userId) {
    logger.info('📥 Sincronizando seres desde web...', '');

    if (!userId || typeof userId !== 'string') {
      throw new Error('Invalid user ID');
    }

    return this.retryWithBackoff(async () => {
      try {
        // Llamar a la API de solo lectura con timeout
        const response = await this.fetchWithTimeout(
          `${this.apiUrl}?action=get_beings&user_id=${encodeURIComponent(userId)}`
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        // Validar respuesta
        this.validateApiResponse(data);

        const webBeings = Array.isArray(data.data.beings) ? data.data.beings : [];

        // Obtener seres actuales en móvil
        const mobileBeings = await this.getMobileBeings(userId);

        // Detectar cambios
        const changes = this.detectBeingChanges(webBeings, mobileBeings);

        // Aplicar cambios en BD móvil (no toca web)
        for (const being of changes.new) {
          await this.insertMobileBeing(userId, being, true); // synced_from_web = true
        }

        for (const being of changes.updated) {
          await this.updateMobileBeing(being.id, being);
        }

        logger.info("`✅ Seres sincronizados: ${changes.new.length} nuevos, ${changes.updated.length} actualizados`", "");

        return {
          new: changes.new.length,
          updated: changes.updated.length,
          total: webBeings.length
        };

      } catch (error) {
        logger.error('❌ Error sincronizando seres:', error.message);
        throw error;
      }
    });
  }

  /**
   * Sincronizar progreso de lectura desde web
   */
  async syncProgressFromWeb(userId) {
    logger.info('📥 Sincronizando progreso de lectura desde web...', '');

    try {
      const response = await fetch(
        `${this.apiUrl}?action=get_progress&user_id=${userId}`
      );

      const data = await response.json();

      if (data.status !== 'success') {
        throw new Error(data.message || 'Error fetching progress');
      }

      const webProgress = data.data.progress || [];

      // Guardar en móvil (sobrescribe si es más reciente)
      let syncedCount = 0;

      for (const progressItem of webProgress) {
        const updated = await this.mergeMobileProgress(userId, progressItem);
        if (updated) syncedCount++;
      }

      logger.info("`✅ Progreso sincronizado: ${syncedCount} capítulos`", "");

      return { synced: syncedCount };

    } catch (error) {
      logger.error('❌ Error sincronizando progreso:', error);
      throw error;
    }
  }

  /**
   * Sincronizar microsociedades desde web
   */
  async syncSocietiesFromWeb(userId) {
    logger.info('📥 Sincronizando microsociedades desde web...', '');

    try {
      const response = await fetch(
        `${this.apiUrl}?action=get_societies&user_id=${userId}`
      );

      const data = await response.json();

      if (data.status !== 'success') {
        throw new Error(data.message || 'Error fetching societies');
      }

      const webSocieties = data.data.societies || [];

      // Guardar en móvil
      await AsyncStorage.setItem(
        `mobile_societies_${userId}`,
        JSON.stringify(webSocieties)
      );

      logger.info("`✅ Microsociedades sincronizadas: ${webSocieties.length}`", "");

      return { count: webSocieties.length };

    } catch (error) {
      logger.error('❌ Error sincronizando microsociedades:', error);
      throw error;
    }
  }

  // ═══════════════════════════════════════════════════════════
  // HELPERS - Operaciones en BD móvil
  // ═══════════════════════════════════════════════════════════


  /**
   * Guardar ser en móvil
   */
  async insertMobileBeing(userId, being, syncedFromWeb = false) {
    const beings = await this.getMobileBeings(userId);

    const mobileBeing = {
      id: being.id,
      mobile_user_id: userId,
      web_being_id: being.id,
      name: being.name,
      attributes: being.attributes,
      // Propiedades móvil
      energy: 100,
      status: 'available',
      synced_from_web: syncedFromWeb,
      created_at: new Date().toISOString()
    };

    beings.push(mobileBeing);

    await AsyncStorage.setItem(
      `mobile_beings_${userId}`,
      JSON.stringify(beings)
    );

    return mobileBeing;
  }

  /**
   * Actualizar ser en móvil
   * @param {string} beingId - ID del ser a actualizar
   * @param {object} updates - Cambios a aplicar
   */
  async updateMobileBeing(beingId, updates) {
    try {
      // Obtener seres actuales del almacenamiento
      const storedBeings = await AsyncStorage.getItem('mobile_beings');
      const beings = storedBeings ? JSON.parse(storedBeings) : [];

      // Encontrar y actualizar el ser
      const updatedBeings = beings.map(being =>
        being.id === beingId
          ? { ...being, ...updates, updated_at: new Date().toISOString() }
          : being
      );

      // Guardar de vuelta
      await AsyncStorage.setItem('mobile_beings', JSON.stringify(updatedBeings));

      logger.info('SyncService', `✅ Ser actualizado: ${beingId}`);
      return { success: true, being: updatedBeings.find(b => b.id === beingId) };
    } catch (error) {
      logger.error('SyncService', `Error actualizando ser ${beingId}`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Detectar cambios entre seres de web y móvil
   */
  detectBeingChanges(webBeings, mobileBeings) {
    const webIds = new Set(webBeings.map(b => b.id));
    const mobileMap = new Map(mobileBeings.map(b => [b.web_being_id, b]));

    const newBeings = [];
    const updatedBeings = [];

    for (const webBeing of webBeings) {
      const mobileBeing = mobileMap.get(webBeing.id);

      if (!mobileBeing) {
        // Nuevo en web, no existe en móvil
        newBeings.push(webBeing);
      } else {
        // Existe, verificar si cambió
        if (this.beingHasChanged(webBeing, mobileBeing)) {
          updatedBeings.push(webBeing);
        }
      }
    }

    return { new: newBeings, updated: updatedBeings };
  }

  /**
   * Verificar si un ser cambió
   */
  beingHasChanged(webBeing, mobileBeing) {
    // Comparar atributos
    return JSON.stringify(webBeing.attributes) !==
           JSON.stringify(mobileBeing.attributes);
  }

  /**
   * Merge de progreso (el más avanzado gana)
   */
  async mergeMobileProgress(userId, webProgress) {
    const key = `mobile_progress_${userId}`;
    const stored = await AsyncStorage.getItem(key);
    const mobileProgress = stored ? JSON.parse(stored) : {};

    const bookId = webProgress.book_id;
    const chapterId = webProgress.chapter_id;
    const progressKey = `${bookId}_${chapterId}`;

    // Si no existe en móvil o el de web es más reciente, actualizar
    if (!mobileProgress[progressKey] ||
        webProgress.progress_percent > (mobileProgress[progressKey]?.progress_percent || 0)) {

      mobileProgress[progressKey] = {
        ...webProgress,
        synced_from_web: true,
        last_sync: new Date().toISOString()
      };

      await AsyncStorage.setItem(key, JSON.stringify(mobileProgress));
      return true;
    }

    return false;
  }

  // ═══════════════════════════════════════════════════════════
  // SINCRONIZACIÓN BIDIRECCIONAL (OPCIONAL)
  // Solo si el usuario lo activa explícitamente
  // ═══════════════════════════════════════════════════════════

  /**
   * Verificar si usuario permite escritura a web
   */
  async canWriteToWeb(userId) {
    const settings = await AsyncStorage.getItem(`user_settings_${userId}`);
    const parsed = settings ? JSON.parse(settings) : {};
    return parsed.allow_write_to_web === true;
  }

  /**
   * Sincronizar móvil → web (SOLO SI ESTÁ ACTIVADO)
   */
  async syncToWeb(userId) {
    const canWrite = await this.canWriteToWeb(userId);

    if (!canWrite) {
      logger.warn('SyncService', 'Sincronización a web desactivada');
      return {
        success: false,
        reason: 'write_to_web_disabled',
        message: 'El usuario no ha activado la sincronización bidireccional'
      };
    }

    logger.info('SyncService', '🔄 Sincronizando hacia web...');

    /**
     * NOTA SOBRE SINCRONIZACIÓN BIDIRECCIONAL:
     *
     * La escritura a web está DELIBERADAMENTE desactivada por defecto
     * por razones de seguridad y arquitectura:
     *
     * 1. PROTECCIÓN: El sistema web no debe ser modificado por la app móvil
     * 2. INTEGRIDAD: Datos móviles separados evitan corrupción
     * 3. REVERSIBILIDAD: Usuario puede desinstalar app sin afectar web
     *
     * FUTURO: Si se implementa, será con:
     * - API_WRITE endpoint separado (solo para datos móviles)
     * - Hash de validación para conflictos
     * - Audit log completo
     * - Rate limiting y validación de integridad
     */
    return {
      success: false,
      reason: 'bidirectional_sync_disabled',
      message: 'Sincronización bidireccional está desactivada por defecto. El sistema opera en modo read-only para proteger la integridad del sistema web. Para activar, contacta al administrador.'
    };
  }

  // ═══════════════════════════════════════════════════════════
  // UTILIDADES
  // ═══════════════════════════════════════════════════════════

  /**
   * Obtener timestamp de última sincronización
   */
  async getLastSyncTimestamp() {
    const timestamp = await AsyncStorage.getItem('last_sync_from_web');
    return timestamp ? new Date(timestamp) : null;
  }

  /**
   * Verificar si hay conexión a internet
   */
  async hasInternetConnection() {
    try {
      const response = await this.fetchWithTimeout(
        `${this.apiUrl}?action=health`,
        {},
        3000
      );

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.status === 'success';
    } catch (error) {
      logger.debug('SyncService', 'No internet connection:', error.message);
      return false;
    }
  }

  /**
   * Obtener seres con manejo de errores
   */
  async getMobileBeings(userId) {
    try {
      const stored = await AsyncStorage.getItem(`mobile_beings_${userId}`);
      const parsed = stored ? JSON.parse(stored) : [];

      if (!Array.isArray(parsed)) {
        logger.warn('SyncService', 'Invalid beings data structure, resetting to empty array');
        return [];
      }

      return parsed;
    } catch (error) {
      logger.error('Error getting mobile beings:', error);
      return [];
    }
  }
}

export default new SyncService();
