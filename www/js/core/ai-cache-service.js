/**
// 🔧 FIX v2.9.198: Migrated console.log to logger
 * AI CACHE SERVICE
 * Sistema de caché inteligente para reducir costos de IA en 40-60%
 *
 * Estrategia de caché:
 * - Nivel 1: LocalStorage (inmediato, sin costo)
 * - Nivel 2: Supabase (compartido entre usuarios, persistente)
 * - TTL: 7 días para respuestas estándar, 30 días para definiciones
 * - LRU: Limita a 100 entradas en localStorage
 *
 * @version 1.0.0
 */

class AICacheService {
  constructor(config = {}) {
    this.enabled = config.enabled !== false;
    this.maxLocalEntries = config.maxLocalEntries || 100;
    this.defaultTTL = config.defaultTTL || 7 * 24 * 60 * 60 * 1000; // 7 días
    this.definitionTTL = config.definitionTTL || 30 * 24 * 60 * 60 * 1000; // 30 días
    this.debug = config.debug || false;

    // Métricas
    this.stats = {
      hits: 0,
      misses: 0,
      localHits: 0,
      remoteHits: 0,
      saves: 0
    };

    this.initializeLocalCache();
  }

  // ==========================================================================
  // INICIALIZACIÓN
  // ==========================================================================

  initializeLocalCache() {
    try {
      const stored = localStorage.getItem('ai_cache_stats');
      if (stored) {
        const savedStats = JSON.parse(stored);
        this.stats = { ...this.stats, ...savedStats };
      }
    } catch (error) {
      console.error('[AICache] Error al cargar stats:', error);
    }

    if (this.debug) {
      logger.debug('[AICache] Inicializado con stats:', this.stats);
    }
  }

  // ==========================================================================
  // GENERACIÓN DE CLAVES DE CACHÉ
  // ==========================================================================

  /**
   * Genera una clave única para la consulta
   * Usa hash simple para reducir tamaño
   */
  generateCacheKey(type, prompt, context = {}) {
    const baseString = `${type}:${prompt}:${JSON.stringify(context)}`;
    return this.simpleHash(baseString);
  }

  /**
   * Hash simple y rápido (djb2)
   */
  simpleHash(str) {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash) + str.charCodeAt(i);
    }
    return `ai_cache_${Math.abs(hash).toString(36)}`;
  }

  // ==========================================================================
  // BÚSQUEDA DE CACHÉ (Nivel 1: LocalStorage)
  // ==========================================================================

  /**
   * Busca en caché local
   */
  getFromLocalCache(cacheKey) {
    if (!this.enabled) return null;

    try {
      const cached = localStorage.getItem(cacheKey);
      if (!cached) return null;

      const entry = JSON.parse(cached);

      // Verificar TTL
      const now = Date.now();
      if (entry.expiresAt && entry.expiresAt < now) {
        // Expirado, eliminar
        localStorage.removeItem(cacheKey);
        return null;
      }

      // Actualizar last accessed (LRU)
      entry.lastAccessed = now;
      localStorage.setItem(cacheKey, JSON.stringify(entry));

      this.stats.localHits++;
      this.stats.hits++;

      if (this.debug) {
        logger.debug('[AICache] ✅ Local HIT:', cacheKey);
      }

      return entry.response;

    } catch (error) {
      console.error('[AICache] Error al leer cache local:', error);
      return null;
    }
  }

  // ==========================================================================
  // BÚSQUEDA DE CACHÉ (Nivel 2: Supabase)
  // ==========================================================================

  /**
   * Busca en caché remota de Supabase
   */
  async getFromRemoteCache(cacheKey) {
    if (!this.enabled || !window.supabase) return null;

    try {
      const { data, error } = await window.supabase
        .from('ai_cache')
        .select('response, created_at, expires_at')
        .eq('cache_key', cacheKey)
        .single();

      if (error || !data) return null;

      // Verificar TTL
      const now = new Date();
      const expiresAt = new Date(data.expires_at);
      if (expiresAt < now) {
        // Expirado, eliminar
        await this.deleteFromRemoteCache(cacheKey);
        return null;
      }

      this.stats.remoteHits++;
      this.stats.hits++;

      // Guardar también en local para futuras consultas
      this.saveToLocalCache(cacheKey, data.response, expiresAt.getTime());

      if (this.debug) {
        logger.debug('[AICache] ✅ Remote HIT:', cacheKey);
      }

      return data.response;

    } catch (error) {
      console.error('[AICache] Error al leer cache remota:', error);
      return null;
    }
  }

  // ==========================================================================
  // GUARDAR EN CACHÉ
  // ==========================================================================

  /**
   * Guarda respuesta en caché local
   */
  saveToLocalCache(cacheKey, response, expiresAt) {
    if (!this.enabled) return;

    try {
      // Verificar límite de entradas (LRU)
      this.enforceLocalCacheLimit();

      const entry = {
        response: response,
        createdAt: Date.now(),
        lastAccessed: Date.now(),
        expiresAt: expiresAt
      };

      localStorage.setItem(cacheKey, JSON.stringify(entry));

      if (this.debug) {
        logger.debug('[AICache] 💾 Guardado en local:', cacheKey);
      }

    } catch (error) {
      // Probablemente localStorage lleno
      console.warn('[AICache] Error al guardar en local (¿lleno?):', error);
      this.clearOldestLocalEntries(10);
    }
  }

  /**
   * Guarda respuesta en caché remota (Supabase)
   */
  async saveToRemoteCache(cacheKey, response, type, ttl) {
    if (!this.enabled || !window.supabase) return;

    try {
      const expiresAt = new Date(Date.now() + ttl);

      const { error } = await window.supabase
        .from('ai_cache')
        .upsert({
          cache_key: cacheKey,
          response: response,
          query_type: type,
          expires_at: expiresAt.toISOString(),
          hit_count: 1
        }, {
          onConflict: 'cache_key'
        });

      if (error) {
        console.error('[AICache] Error al guardar en remota:', error);
      } else if (this.debug) {
        logger.debug('[AICache] 💾 Guardado en remota:', cacheKey);
      }

    } catch (error) {
      console.error('[AICache] Error al guardar en remota:', error);
    }
  }

  // ==========================================================================
  // LIMPIEZA DE CACHÉ (LRU)
  // ==========================================================================

  /**
   * Aplica límite de entradas en localStorage usando LRU
   */
  enforceLocalCacheLimit() {
    try {
      // Contar entradas de caché
      const cacheKeys = Object.keys(localStorage).filter(key => key.startsWith('ai_cache_'));

      if (cacheKeys.length >= this.maxLocalEntries) {
        // Obtener entradas con lastAccessed
        const entries = cacheKeys.map(key => {
          try {
            const entry = JSON.parse(localStorage.getItem(key));
            return { key, lastAccessed: entry.lastAccessed || 0 };
          } catch {
            return { key, lastAccessed: 0 };
          }
        });

        // Ordenar por lastAccessed (más viejo primero)
        entries.sort((a, b) => a.lastAccessed - b.lastAccessed);

        // Eliminar los 10 más viejos
        const toDelete = entries.slice(0, 10);
        toDelete.forEach(({ key }) => {
          localStorage.removeItem(key);
        });

        if (this.debug) {
          logger.debug(`[AICache] 🗑️ Eliminadas ${toDelete.length} entradas antiguas (LRU)`);
        }
      }
    } catch (error) {
      console.error('[AICache] Error en enforceLocalCacheLimit:', error);
    }
  }

  /**
   * Elimina las N entradas más viejas
   */
  clearOldestLocalEntries(count) {
    try {
      const cacheKeys = Object.keys(localStorage).filter(key => key.startsWith('ai_cache_'));

      const entries = cacheKeys.map(key => {
        try {
          const entry = JSON.parse(localStorage.getItem(key));
          return { key, lastAccessed: entry.lastAccessed || 0 };
        } catch {
          return { key, lastAccessed: 0 };
        }
      });

      entries.sort((a, b) => a.lastAccessed - b.lastAccessed);
      const toDelete = entries.slice(0, count);

      toDelete.forEach(({ key }) => {
        localStorage.removeItem(key);
      });

      logger.debug(`[AICache] 🗑️ Limpiadas ${toDelete.length} entradas viejas`);
    } catch (error) {
      console.error('[AICache] Error en clearOldestLocalEntries:', error);
    }
  }

  // ==========================================================================
  // ELIMINACIÓN DE CACHÉ
  // ==========================================================================

  /**
   * Elimina entrada de caché remota
   */
  async deleteFromRemoteCache(cacheKey) {
    if (!window.supabase) return;

    try {
      await window.supabase
        .from('ai_cache')
        .delete()
        .eq('cache_key', cacheKey);
    } catch (error) {
      console.error('[AICache] Error al eliminar de remota:', error);
    }
  }

  // ==========================================================================
  // API PÚBLICA
  // ==========================================================================

  /**
   * Obtiene respuesta de caché (local primero, luego remoto)
   */
  async get(type, prompt, context = {}) {
    if (!this.enabled) return null;

    const cacheKey = this.generateCacheKey(type, prompt, context);

    // Nivel 1: Local
    const localResult = this.getFromLocalCache(cacheKey);
    if (localResult) {
      return localResult;
    }

    // Nivel 2: Remoto
    const remoteResult = await this.getFromRemoteCache(cacheKey);
    if (remoteResult) {
      return remoteResult;
    }

    // Miss
    this.stats.misses++;
    return null;
  }

  /**
   * Guarda respuesta en caché (local + remoto)
   */
  async set(type, prompt, response, context = {}) {
    if (!this.enabled) return;

    const cacheKey = this.generateCacheKey(type, prompt, context);

    // Determinar TTL según tipo
    let ttl = this.defaultTTL;
    if (type === 'definition' || type === 'explain') {
      ttl = this.definitionTTL; // Definiciones duran más
    }

    const expiresAt = Date.now() + ttl;

    // Guardar en local
    this.saveToLocalCache(cacheKey, response, expiresAt);

    // Guardar en remoto (async, no bloqueante)
    this.saveToRemoteCache(cacheKey, response, type, ttl).catch(err => {
      console.error('[AICache] Error al guardar en remoto:', err);
    });

    this.stats.saves++;
    this.saveStats();
  }

  // ==========================================================================
  // MÉTRICAS
  // ==========================================================================

  /**
   * Obtiene tasa de aciertos (hit rate)
   */
  getHitRate() {
    const total = this.stats.hits + this.stats.misses;
    if (total === 0) return 0;
    return (this.stats.hits / total * 100).toFixed(2);
  }

  /**
   * Obtiene estadísticas completas
   */
  getStats() {
    return {
      ...this.stats,
      hitRate: this.getHitRate(),
      localCacheSize: this.getLocalCacheSize(),
      estimatedSavings: this.calculateSavings()
    };
  }

  /**
   * Calcula ahorro estimado en euros
   * Asumiendo 0.002€ por solicitud promedio
   */
  calculateSavings() {
    const costPerRequest = 0.002; // €
    const savedRequests = this.stats.hits;
    return (savedRequests * costPerRequest).toFixed(2);
  }

  /**
   * Obtiene tamaño de caché local
   */
  getLocalCacheSize() {
    try {
      const cacheKeys = Object.keys(localStorage).filter(key => key.startsWith('ai_cache_'));
      return cacheKeys.length;
    } catch {
      return 0;
    }
  }

  /**
   * Guarda stats en localStorage
   */
  saveStats() {
    try {
      localStorage.setItem('ai_cache_stats', JSON.stringify(this.stats));
    } catch (error) {
      console.error('[AICache] Error al guardar stats:', error);
    }
  }

  /**
   * Resetea estadísticas
   */
  resetStats() {
    this.stats = {
      hits: 0,
      misses: 0,
      localHits: 0,
      remoteHits: 0,
      saves: 0
    };
    this.saveStats();
    logger.debug('[AICache] Stats reseteadas');
  }

  /**
   * Limpia toda la caché local
   */
  clearLocalCache() {
    try {
      const cacheKeys = Object.keys(localStorage).filter(key => key.startsWith('ai_cache_'));
      cacheKeys.forEach(key => localStorage.removeItem(key));
      logger.debug(`[AICache] 🗑️ Limpiada caché local (${cacheKeys.length} entradas)`);
    } catch (error) {
      console.error('[AICache] Error al limpiar caché:', error);
    }
  }

  /**
   * Limpia toda la caché remota (requiere permisos admin)
   */
  async clearRemoteCache() {
    if (!window.supabase) return;

    try {
      const { error } = await window.supabase
        .from('ai_cache')
        .delete()
        .neq('cache_key', ''); // Elimina todo

      if (error) {
        console.error('[AICache] Error al limpiar caché remota:', error);
      } else {
        logger.debug('[AICache] 🗑️ Limpiada caché remota');
      }
    } catch (error) {
      console.error('[AICache] Error al limpiar caché remota:', error);
    }
  }

  /**
   * Deshabilitar caché
   */
  disable() {
    this.enabled = false;
    logger.debug('[AICache] Caché deshabilitada');
  }

  /**
   * Habilitar caché
   */
  enable() {
    this.enabled = true;
    logger.debug('[AICache] Caché habilitada');
  }
}

// Exportar globalmente
window.AICacheService = AICacheService;
