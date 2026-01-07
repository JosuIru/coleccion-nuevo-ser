/**
 * UNIFIED SYNC SERVICE
 * Sincroniza datos entre WebView (Colección Nuevo Ser) y React Native (Awakening Protocol)
 *
 * Arquitectura de sincronización:
 * WebView (localStorage) ↔ RN (AsyncStorage) ↔ Supabase (cloud)
 *
 * @version 1.0.0
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from '../utils/logger';
import useGameStore from '../stores/gameStore';

class UnifiedSyncService {
  constructor() {
    this.syncKeys = {
      // Autenticación compartida
      'auth_user': 'shared',
      'auth_session': 'shared',
      'premium_status': 'shared',

      // Progreso de lectura
      'reading_progress': 'shared',
      'completed_chapters': 'shared',
      'bookmarks': 'shared',
      'reading_time': 'shared',
      'current_book': 'shared',

      // Notas y highlights
      'chapter_notes': 'shared',
      'highlights': 'shared',

      // Configuración
      'app_settings': 'shared',
      'theme_preference': 'shared',
      'audio_settings': 'shared',

      // Frankenstein Lab (ya sincronizado, pero necesita bridge)
      'frankenstein_being': 'webapp_only',
      'frankenstein_progress': 'webapp_only',

      // Awakening Protocol (solo app nativa)
      'game_state': 'native_only',
      'beings': 'native_only',
      'missions': 'native_only'
    };

    this.syncInterval = null;
    this.lastSync = {};
  }

  /**
   * Inicializar el servicio de sincronización
   */
  async initialize() {
    logger.info('UnifiedSyncService', '🔄 Inicializando sincronización unificada...');

    try {
      // Cargar último estado de sincronización
      const lastSyncData = await AsyncStorage.getItem('unified_sync_last');
      if (lastSyncData) {
        this.lastSync = JSON.parse(lastSyncData);
      }

      logger.info('UnifiedSyncService', '✓ Servicio inicializado');
      return true;
    } catch (error) {
      logger.error('UnifiedSyncService', 'Error al inicializar', error);
      return false;
    }
  }

  /**
   * Sincronizar datos desde WebView a AsyncStorage
   * Se llama cuando BibliotecaScreen recibe un mensaje del WebView
   */
  async syncFromWebView(webViewData) {
    logger.info('UnifiedSyncService', '📥 Sincronizando desde WebView...');

    try {
      const updates = [];

      for (const [key, value] of Object.entries(webViewData)) {
        const syncType = this.syncKeys[key];

        if (syncType === 'shared' || syncType === 'webapp_only') {
          // Guardar en AsyncStorage con prefijo para evitar colisiones
          const storageKey = `webapp_${key}`;
          await AsyncStorage.setItem(storageKey, JSON.stringify(value));

          updates.push(key);
          this.lastSync[key] = Date.now();
        }
      }

      // Guardar timestamp de última sincronización
      await AsyncStorage.setItem('unified_sync_last', JSON.stringify(this.lastSync));

      // Procesar actualizaciones específicas
      await this.processWebViewUpdates(webViewData);

      logger.info('UnifiedSyncService', `✓ Sincronizados ${updates.length} items desde WebView`);
      return true;
    } catch (error) {
      logger.error('UnifiedSyncService', 'Error al sincronizar desde WebView', error);
      return false;
    }
  }

  /**
   * Sincronizar datos desde AsyncStorage a WebView
   * Se usa para inicializar el WebView con datos de la app nativa
   */
  async syncToWebView() {
    logger.info('UnifiedSyncService', '📤 Preparando datos para WebView...');

    try {
      const webViewData = {};

      // Recopilar datos compartidos
      for (const [key, syncType] of Object.entries(this.syncKeys)) {
        if (syncType === 'shared' || syncType === 'webapp_only') {
          const storageKey = `webapp_${key}`;
          const value = await AsyncStorage.getItem(storageKey);

          if (value) {
            try {
              webViewData[key] = JSON.parse(value);
            } catch {
              webViewData[key] = value;
            }
          }
        }
      }

      // Agregar datos del usuario si está autenticado
      const gameState = useGameStore.getState();
      if (gameState.user) {
        webViewData.auth_user = {
          id: gameState.user.id,
          email: gameState.user.email,
          username: gameState.user.username,
          premium: gameState.user.premium || false
        };
      }

      logger.info('UnifiedSyncService', `✓ Datos preparados para WebView (${Object.keys(webViewData).length} items)`);
      return webViewData;
    } catch (error) {
      logger.error('UnifiedSyncService', 'Error al preparar datos para WebView', error);
      return {};
    }
  }

  /**
   * Procesar actualizaciones específicas desde el WebView
   * Ejemplo: otorgar XP cuando se completa un capítulo
   */
  async processWebViewUpdates(data) {
    try {
      // Progreso de lectura → XP en la app nativa
      if (data.reading_progress) {
        const gameState = useGameStore.getState();
        const { addXP, addFragments } = gameState;

        // Verificar si hay capítulos nuevos completados
        const previousProgress = await AsyncStorage.getItem('webapp_reading_progress');
        const previousData = previousProgress ? JSON.parse(previousProgress) : {};

        for (const [bookId, chapters] of Object.entries(data.reading_progress)) {
          if (previousData[bookId]) {
            // Detectar capítulos nuevos completados
            const newCompleted = Object.keys(chapters).filter(
              chapterId => chapters[chapterId]?.completed && !previousData[bookId][chapterId]?.completed
            );

            if (newCompleted.length > 0) {
              // Calcular recompensas
              const xpPerChapter = 50;
              const totalXP = newCompleted.length * xpPerChapter;
              const totalFragments = newCompleted.length * 2;

              // Otorgar recompensas
              addXP(totalXP);
              addFragments(totalFragments);

              logger.info(
                'UnifiedSyncService',
                `🎁 Recompensas otorgadas: +${totalXP} XP, +${totalFragments} fragmentos (${newCompleted.length} capítulos)`
              );
            }
          }
        }
      }

      // Tiempo de lectura → Estadísticas
      if (data.reading_time) {
        const gameState = useGameStore.getState();
        const currentStats = gameState.statistics || {};

        const totalReadingTime = currentStats.total_reading_time || 0;
        const newReadingTime = data.reading_time.total || 0;

        if (newReadingTime > totalReadingTime) {
          // Actualizar estadísticas
          gameState.updateStatistics({
            total_reading_time: newReadingTime,
            last_reading_session: Date.now()
          });
        }
      }
    } catch (error) {
      logger.error('UnifiedSyncService', 'Error al procesar actualizaciones', error);
    }
  }

  /**
   * Iniciar sincronización automática periódica
   * Se ejecuta cada 30 segundos para mantener los datos actualizados
   */
  startAutoSync(webViewRef) {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(async () => {
      try {
        // Enviar solicitud de sync al WebView
        if (webViewRef && webViewRef.current) {
          webViewRef.current.postMessage(JSON.stringify({
            type: 'SYNC_REQUEST',
            timestamp: Date.now()
          }));
        }
      } catch (error) {
        logger.error('UnifiedSyncService', 'Error en auto-sync', error);
      }
    }, 30000); // 30 segundos

    logger.info('UnifiedSyncService', '⏱️ Auto-sync activado (cada 30s)');
  }

  /**
   * Detener sincronización automática
   */
  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      logger.info('UnifiedSyncService', '⏹️ Auto-sync detenido');
    }
  }

  /**
   * Obtener estado de sincronización
   */
  getSyncStatus() {
    return {
      lastSync: this.lastSync,
      autoSyncActive: !!this.syncInterval,
      syncedKeys: Object.keys(this.lastSync).length
    };
  }

  /**
   * Forzar sincronización completa
   */
  async forceSync(webViewRef) {
    logger.info('UnifiedSyncService', '🔄 Forzando sincronización completa...');

    try {
      if (webViewRef && webViewRef.current) {
        webViewRef.current.postMessage(JSON.stringify({
          type: 'FORCE_SYNC',
          timestamp: Date.now()
        }));
      }

      return true;
    } catch (error) {
      logger.error('UnifiedSyncService', 'Error al forzar sync', error);
      return false;
    }
  }

  /**
   * Limpiar datos de sincronización
   */
  async clearSyncData() {
    logger.info('UnifiedSyncService', '🧹 Limpiando datos de sincronización...');

    try {
      const keys = await AsyncStorage.getAllKeys();
      const webappKeys = keys.filter(key => key.startsWith('webapp_'));

      await AsyncStorage.multiRemove(webappKeys);
      await AsyncStorage.removeItem('unified_sync_last');

      this.lastSync = {};

      logger.info('UnifiedSyncService', `✓ ${webappKeys.length} items eliminados`);
      return true;
    } catch (error) {
      logger.error('UnifiedSyncService', 'Error al limpiar datos', error);
      return false;
    }
  }
}

// Exportar instancia única (singleton)
export default new UnifiedSyncService();
