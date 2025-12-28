/**
// 🔧 FIX v2.9.198: Migrated console.log to logger
 * FRANKENSTEIN SYNC SERVICE
 * Sincronización de Seres Transformadores con Supabase
 *
 * Maneja la persistencia y sincronización de:
 * - Seres creados
 * - Progreso de misiones
 * - Estadísticas y logros
 * - Configuración del lab
 *
 * @version 1.0.0
 */

class FrankensteinSyncService {
  constructor() {
    this.supabase = null;
    this.authHelper = null;
    this.localStorageKey = 'frankenstein-beings';
    this.settingsKey = 'frankenstein-settings';
    this.lastSyncKey = 'frankenstein-last-sync';
    this.syncInProgress = false;
    this.syncCallbacks = [];
    this.realtimeChannel = null;
  }

  /**
   * Inicializar el servicio
   */
  async init() {
    // Esperar a que Supabase esté disponible
    if (!window.supabaseAuthHelper?.supabase) {
      console.warn('FrankensteinSyncService: Supabase no disponible, usando solo localStorage');
      return false;
    }

    this.supabase = window.supabaseAuthHelper.supabase;
    this.authHelper = window.supabaseAuthHelper;

    // Listener para cambios de autenticación
    this.authHelper.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN') {
        // Sincronizar al iniciar sesión
        await this.syncOnLogin();
        await this.setupRealtime();
      } else if (event === 'SIGNED_OUT') {
        this.cleanupRealtime();
      }
    });

    // Si ya está autenticado, sincronizar
    if (this.authHelper.isAuthenticated()) {
      await this.syncOnLogin();
      await this.setupRealtime();
    }

    logger.debug('✅ FrankensteinSyncService inicializado');
    return true;
  }

  /**
   * Verificar si el usuario está autenticado
   */
  isAuthenticated() {
    return this.authHelper?.isAuthenticated() || false;
  }

  /**
   * Obtener ID del usuario actual
   */
  getUserId() {
    return this.authHelper?.user?.id || null;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // OPERACIONES LOCALES
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Obtener todos los seres locales
   */
  getLocalBeings() {
    try {
      const data = localStorage.getItem(this.localStorageKey);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error leyendo seres locales:', error);
      return [];
    }
  }

  /**
   * Guardar ser localmente
   */
  saveLocalBeing(being) {
    try {
      const beings = this.getLocalBeings();
      const index = beings.findIndex(b => b.id === being.id);

      if (index >= 0) {
        beings[index] = { ...being, updatedAt: new Date().toISOString() };
      } else {
        beings.push({ ...being, updatedAt: new Date().toISOString() });
      }

      localStorage.setItem(this.localStorageKey, JSON.stringify(beings));

      // Sincronizar con la nube si está autenticado
      if (this.isAuthenticated()) {
        this.syncBeingToCloud(being).catch(console.error);
      }

      return true;
    } catch (error) {
      console.error('Error guardando ser local:', error);
      return false;
    }
  }

  /**
   * Eliminar ser localmente
   */
  deleteLocalBeing(beingId) {
    try {
      const beings = this.getLocalBeings().filter(b => b.id !== beingId);
      localStorage.setItem(this.localStorageKey, JSON.stringify(beings));

      // Eliminar de la nube si está autenticado
      if (this.isAuthenticated()) {
        this.deleteBeingFromCloud(beingId).catch(console.error);
      }

      return true;
    } catch (error) {
      console.error('Error eliminando ser local:', error);
      return false;
    }
  }

  /**
   * Obtener configuración local del lab
   */
  getLocalSettings() {
    try {
      const data = localStorage.getItem(this.settingsKey);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  /**
   * Guardar configuración local
   */
  saveLocalSettings(settings) {
    try {
      localStorage.setItem(this.settingsKey, JSON.stringify({
        ...settings,
        updatedAt: new Date().toISOString()
      }));

      if (this.isAuthenticated()) {
        this.syncSettingsToCloud(settings).catch(console.error);
      }

      return true;
    } catch (error) {
      console.error('Error guardando configuración:', error);
      return false;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // OPERACIONES EN LA NUBE
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Sincronizar al iniciar sesión
   */
  async syncOnLogin() {
    if (!this.isAuthenticated() || this.syncInProgress) return;

    this.syncInProgress = true;
    const userId = this.getUserId();

    try {
      // 1. Obtener seres de la nube
      const cloudBeings = await this.getCloudBeings();

      // 2. Obtener seres locales
      const localBeings = this.getLocalBeings();

      // 3. Merge inteligente
      const mergedBeings = this.mergeBeings(localBeings, cloudBeings);

      // 4. Guardar resultado localmente
      localStorage.setItem(this.localStorageKey, JSON.stringify(mergedBeings));

      // 5. Sincronizar diferencias con la nube
      await this.syncAllBeingsToCloud(mergedBeings);

      // 6. Sincronizar configuración
      await this.syncSettingsOnLogin();

      localStorage.setItem(this.lastSyncKey, new Date().toISOString());

      // Notificar a callbacks
      this.notifySync('sync_complete', { beings: mergedBeings });

      window.toast?.success('Seres sincronizados correctamente');
    } catch (error) {
      console.error('Error en sincronización:', error);
      window.toast?.error('Error al sincronizar seres');
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Obtener seres de la nube
   */
  async getCloudBeings() {
    if (!this.isAuthenticated()) return [];

    const userId = this.getUserId();

    try {
      const { data, error } = await this.supabase
        .from('frankenstein_beings')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error obteniendo seres de la nube:', error);
        return [];
      }

      // Convertir formato de Supabase a formato local
      return (data || []).map(row => ({
        ...row.being_data,
        id: row.being_id,
        cloudId: row.id,
        syncedAt: row.updated_at
      }));
    } catch (error) {
      console.error('Error en getCloudBeings:', error);
      return [];
    }
  }

  /**
   * Sincronizar un ser a la nube
   */
  async syncBeingToCloud(being) {
    if (!this.isAuthenticated()) return false;

    const userId = this.getUserId();

    try {
      const { data, error } = await this.supabase
        .from('frankenstein_beings')
        .upsert({
          user_id: userId,
          being_id: being.id,
          being_data: being,
          name: being.name,
          level: being.level || 1,
          total_power: being.totalPower || 0,
          specialty: being.specialty?.name || 'unknown',
          missions_completed: being.stats?.missionsCompleted || 0,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,being_id'
        })
        .select();

      if (error) {
        console.error('Error sincronizando ser:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error en syncBeingToCloud:', error);
      return false;
    }
  }

  /**
   * Sincronizar todos los seres a la nube
   */
  async syncAllBeingsToCloud(beings) {
    if (!this.isAuthenticated() || !beings.length) return;

    const userId = this.getUserId();

    const rows = beings.map(being => ({
      user_id: userId,
      being_id: being.id,
      being_data: being,
      name: being.name,
      level: being.level || 1,
      total_power: being.totalPower || 0,
      specialty: being.specialty?.name || 'unknown',
      missions_completed: being.stats?.missionsCompleted || 0,
      updated_at: being.updatedAt || new Date().toISOString()
    }));

    try {
      const { error } = await this.supabase
        .from('frankenstein_beings')
        .upsert(rows, { onConflict: 'user_id,being_id' });

      if (error) {
        console.error('Error sincronizando seres:', error);
      }
    } catch (error) {
      console.error('Error en syncAllBeingsToCloud:', error);
    }
  }

  /**
   * Eliminar ser de la nube
   */
  async deleteBeingFromCloud(beingId) {
    if (!this.isAuthenticated()) return;

    const userId = this.getUserId();

    try {
      await this.supabase
        .from('frankenstein_beings')
        .delete()
        .eq('user_id', userId)
        .eq('being_id', beingId);
    } catch (error) {
      console.error('Error eliminando ser de la nube:', error);
    }
  }

  /**
   * Merge inteligente de seres locales y de la nube
   */
  mergeBeings(localBeings, cloudBeings) {
    const merged = new Map();

    // Agregar seres de la nube
    cloudBeings.forEach(being => {
      merged.set(being.id, being);
    });

    // Agregar/actualizar con seres locales
    localBeings.forEach(localBeing => {
      const cloudBeing = merged.get(localBeing.id);

      if (!cloudBeing) {
        // No existe en la nube, agregar
        merged.set(localBeing.id, localBeing);
      } else {
        // Existe en ambos, usar el más reciente
        const localDate = new Date(localBeing.updatedAt || localBeing.createdAt || 0);
        const cloudDate = new Date(cloudBeing.syncedAt || cloudBeing.createdAt || 0);

        if (localDate > cloudDate) {
          // Local más reciente, mergear datos
          merged.set(localBeing.id, this.mergeSingleBeing(cloudBeing, localBeing));
        } else {
          // Cloud más reciente, mantener cloud pero agregar datos locales no sincronizados
          merged.set(localBeing.id, this.mergeSingleBeing(localBeing, cloudBeing));
        }
      }
    });

    return Array.from(merged.values());
  }

  /**
   * Merge de un solo ser (mantiene stats más altos)
   */
  mergeSingleBeing(older, newer) {
    return {
      ...older,
      ...newer,
      // Mantener stats más altos
      stats: {
        ...older.stats,
        ...newer.stats,
        missionsCompleted: Math.max(older.stats?.missionsCompleted || 0, newer.stats?.missionsCompleted || 0),
        missionsSuccess: Math.max(older.stats?.missionsSuccess || 0, newer.stats?.missionsSuccess || 0),
        totalXpEarned: Math.max(older.stats?.totalXpEarned || 0, newer.stats?.totalXpEarned || 0),
        totalTurnsPlayed: Math.max(older.stats?.totalTurnsPlayed || 0, newer.stats?.totalTurnsPlayed || 0)
      },
      // Mantener nivel más alto
      level: Math.max(older.level || 1, newer.level || 1),
      xp: Math.max(older.xp || 0, newer.xp || 0),
      // Combinar rasgos y logros
      traits: [...new Set([...(older.traits || []), ...(newer.traits || [])])],
      achievements: this.mergeAchievements(older.achievements || [], newer.achievements || []),
      // Usar fecha más reciente
      updatedAt: newer.updatedAt || older.updatedAt
    };
  }

  /**
   * Merge de logros (sin duplicados)
   */
  mergeAchievements(older, newer) {
    const merged = new Map();
    [...older, ...newer].forEach(a => {
      if (!merged.has(a.id)) {
        merged.set(a.id, a);
      }
    });
    return Array.from(merged.values());
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SINCRONIZACIÓN DE CONFIGURACIÓN
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Sincronizar configuración al login
   */
  async syncSettingsOnLogin() {
    if (!this.isAuthenticated()) return;

    const userId = this.getUserId();
    const localSettings = this.getLocalSettings();

    try {
      // Obtener configuración de la nube
      const { data: cloudSettings } = await this.supabase
        .from('frankenstein_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (cloudSettings) {
        // Mergear configuración
        const mergedSettings = {
          ...cloudSettings.settings_data,
          ...localSettings,
          // Usar preferencias de la nube para ciertas cosas
          gameMode: cloudSettings.settings_data?.gameMode || localSettings.gameMode,
          difficulty: cloudSettings.settings_data?.difficulty || localSettings.difficulty
        };

        this.saveLocalSettings(mergedSettings);
      } else if (Object.keys(localSettings).length > 0) {
        // No hay en la nube, subir local
        await this.syncSettingsToCloud(localSettings);
      }
    } catch (error) {
      console.error('Error sincronizando configuración:', error);
    }
  }

  /**
   * Sincronizar configuración a la nube
   */
  async syncSettingsToCloud(settings) {
    if (!this.isAuthenticated()) return;

    const userId = this.getUserId();

    try {
      await this.supabase
        .from('frankenstein_settings')
        .upsert({
          user_id: userId,
          settings_data: settings,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });
    } catch (error) {
      console.error('Error sincronizando configuración:', error);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // REALTIME
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Configurar escucha en tiempo real
   */
  async setupRealtime() {
    if (!this.isAuthenticated() || this.realtimeChannel) return;

    const userId = this.getUserId();

    this.realtimeChannel = this.supabase
      .channel('frankenstein-sync')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'frankenstein_beings',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          this.handleRealtimeUpdate(payload);
        }
      )
      .subscribe();
  }

  /**
   * Manejar actualizaciones en tiempo real
   */
  handleRealtimeUpdate(payload) {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    if (eventType === 'INSERT' || eventType === 'UPDATE') {
      // Actualizar ser local
      const being = {
        ...newRecord.being_data,
        id: newRecord.being_id,
        cloudId: newRecord.id,
        syncedAt: newRecord.updated_at
      };

      const beings = this.getLocalBeings();
      const index = beings.findIndex(b => b.id === being.id);

      if (index >= 0) {
        beings[index] = this.mergeSingleBeing(beings[index], being);
      } else {
        beings.push(being);
      }

      localStorage.setItem(this.localStorageKey, JSON.stringify(beings));
      this.notifySync('being_updated', { being });

    } else if (eventType === 'DELETE') {
      // Eliminar ser local
      const beings = this.getLocalBeings().filter(b => b.id !== oldRecord.being_id);
      localStorage.setItem(this.localStorageKey, JSON.stringify(beings));
      this.notifySync('being_deleted', { beingId: oldRecord.being_id });
    }
  }

  /**
   * Limpiar escucha en tiempo real
   */
  cleanupRealtime() {
    if (this.realtimeChannel) {
      this.supabase.removeChannel(this.realtimeChannel);
      this.realtimeChannel = null;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CALLBACKS Y UTILIDADES
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Registrar callback para cambios de sincronización
   */
  onSync(callback) {
    this.syncCallbacks.push(callback);
    return () => {
      this.syncCallbacks = this.syncCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Notificar a todos los callbacks
   */
  notifySync(event, data) {
    this.syncCallbacks.forEach(cb => {
      try {
        cb(event, data);
      } catch (error) {
        console.error('Error en callback de sync:', error);
      }
    });

    // Emitir evento global
    window.dispatchEvent(new CustomEvent('frankenstein-sync', {
      detail: { event, data }
    }));
  }

  /**
   * Forzar sincronización completa
   */
  async forceSync() {
    if (!this.isAuthenticated()) {
      window.toast?.warning('Inicia sesión para sincronizar');
      return false;
    }

    await this.syncOnLogin();
    return true;
  }

  /**
   * Obtener estado de sincronización
   */
  getSyncStatus() {
    const lastSync = localStorage.getItem(this.lastSyncKey);

    return {
      isAuthenticated: this.isAuthenticated(),
      lastSyncTime: lastSync ? new Date(lastSync) : null,
      syncInProgress: this.syncInProgress,
      realtimeConnected: !!this.realtimeChannel,
      localBeingsCount: this.getLocalBeings().length
    };
  }

  /**
   * Exportar todos los seres como JSON
   */
  exportBeings() {
    const beings = this.getLocalBeings();
    const settings = this.getLocalSettings();

    return {
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
      beings,
      settings
    };
  }

  /**
   * Importar seres desde JSON
   */
  importBeings(data) {
    try {
      if (!data.beings || !Array.isArray(data.beings)) {
        throw new Error('Formato inválido');
      }

      const currentBeings = this.getLocalBeings();
      const imported = data.beings.map(being => ({
        ...being,
        id: being.id || `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        importedAt: new Date().toISOString()
      }));

      // Mergear con existentes
      const merged = this.mergeBeings(currentBeings, imported);
      localStorage.setItem(this.localStorageKey, JSON.stringify(merged));

      // Sincronizar con la nube
      if (this.isAuthenticated()) {
        this.syncAllBeingsToCloud(merged).catch(console.error);
      }

      window.toast?.success(`${imported.length} seres importados`);
      return true;
    } catch (error) {
      console.error('Error importando seres:', error);
      window.toast?.error('Error al importar seres');
      return false;
    }
  }
}

// Crear instancia global
if (typeof window !== 'undefined') {
  window.FrankensteinSyncService = FrankensteinSyncService;
  window.frankensteinSync = new FrankensteinSyncService();

  // Inicializar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.frankensteinSync.init();
    });
  } else {
    window.frankensteinSync.init();
  }
}
