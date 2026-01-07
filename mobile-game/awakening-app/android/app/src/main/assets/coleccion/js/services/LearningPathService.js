/**
 * LEARNING PATH SERVICE
 * ======================
 *
 * Servicio para gestionar Learning Paths (Jornadas de Aprendizaje) en Colección Nuevo Ser.
 * Permite a los usuarios seguir rutas guiadas de 7, 21 o 30 días con contenido estructurado.
 *
 * CARACTERÍSTICAS:
 * - Listar paths disponibles con filtros
 * - Iniciar y gestionar progreso en paths
 * - Completar etapas con notas y ratings
 * - Sistema de streaks (rachas diarias)
 * - Estadísticas de progreso
 * - Avance automático al siguiente día
 * - Integración con eventBus para notificaciones
 *
 * DEPENDENCIAS:
 * - window.supabase (cliente Supabase)
 * - window.eventBus (sistema de eventos)
 * - window.authHelper (autenticación)
 *
 * EVENTOS EMITIDOS:
 * - learningPath.started - Cuando se inicia un nuevo path
 * - learningPath.stage.completed - Cuando se completa una etapa
 * - learningPath.day.completed - Cuando se completan todas las etapas de un día
 * - learningPath.completed - Cuando se completa todo el path
 * - learningPath.streak.updated - Cuando cambia la racha
 * - learningPath.abandoned - Cuando se abandona un path
 *
 * USO:
 * ```javascript
 * // Inicializar
 * await window.learningPathService.init();
 *
 * // Listar paths
 * const paths = await window.learningPathService.getPaths();
 *
 * // Iniciar un path
 * await window.learningPathService.startPath('viaje-despertar');
 *
 * // Completar una etapa
 * await window.learningPathService.completeStage(stageId, {
 *   notes: 'Excelente meditación',
 *   rating: 5
 * });
 *
 * // Obtener progreso
 * const progress = await window.learningPathService.getUserProgress('viaje-despertar');
 * ```
 *
 * @version 1.0.0
 */

class LearningPathService {
  constructor() {
    this.supabase = null;
    this.user = null;
    this.initialized = false;
    this.cache = {
      paths: null,
      userProgress: {},
      lastUpdate: null
    };
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutos
  }

  // ========================================================================
  // INICIALIZACIÓN
  // ========================================================================

  /**
   * Inicializa el servicio
   */
  async init() {
    if (this.initialized) {
      console.log('[LearningPathService] Ya inicializado');
      return;
    }

    try {
      // Verificar dependencias
      if (!window.supabase) {
        console.warn('[LearningPathService] Supabase no disponible');
        return;
      }

      if (!window.eventBus) {
        console.warn('[LearningPathService] EventBus no disponible');
      }

      this.supabase = window.supabase;

      // Escuchar cambios de autenticación
      if (window.authHelper) {
        window.authHelper.onAuthStateChange((event, session) => {
          this.handleAuthChange(event, session);
        });

        // Obtener usuario actual
        this.user = window.authHelper.user;
      }

      this.initialized = true;
      console.log('[LearningPathService] ✓ Inicializado correctamente');

    } catch (error) {
      console.error('[LearningPathService] Error en inicialización:', error);
    }
  }

  /**
   * Maneja cambios en el estado de autenticación
   */
  handleAuthChange(event, session) {
    if (event === 'SIGNED_IN') {
      this.user = session?.user || null;
      this.clearCache();
      console.log('[LearningPathService] Usuario autenticado');
    } else if (event === 'SIGNED_OUT') {
      this.user = null;
      this.clearCache();
      console.log('[LearningPathService] Usuario desconectado');
    }
  }

  // ========================================================================
  // GESTIÓN DE PATHS
  // ========================================================================

  /**
   * Obtiene la lista de paths disponibles
   * @param {Object} options - Opciones de filtrado
   * @returns {Promise<Array>} Lista de paths
   */
  async getPaths(options = {}) {
    try {
      const {
        includeInactive = false,
        difficulty = null,
        maxDuration = null,
        isPremium = null,
        forceRefresh = false
      } = options;

      // Verificar cache
      if (!forceRefresh && this.cache.paths && this.isCacheValid()) {
        return this.filterPaths(this.cache.paths, options);
      }

      // Construir query
      let query = this.supabase
        .from('learning_paths')
        .select('*')
        .order('sort_order', { ascending: true });

      // Aplicar filtros
      if (!includeInactive) {
        query = query.eq('is_active', true);
      }

      if (difficulty) {
        query = query.eq('difficulty', difficulty);
      }

      if (maxDuration) {
        query = query.lte('duration_days', maxDuration);
      }

      if (isPremium !== null) {
        query = query.eq('is_premium', isPremium);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Actualizar cache
      this.cache.paths = data;
      this.cache.lastUpdate = Date.now();

      return data || [];

    } catch (error) {
      console.error('[LearningPathService] Error obteniendo paths:', error);
      return [];
    }
  }

  /**
   * Obtiene un path específico con todas sus etapas y progreso del usuario
   * @param {string} pathSlug - Slug del path
   * @returns {Promise<Object|null>} Path completo con progreso
   */
  async getPath(pathSlug) {
    try {
      if (!pathSlug) {
        throw new Error('pathSlug es requerido');
      }

      const userId = this.user?.id || null;

      // Usar función RPC para obtener path con progreso
      const { data, error } = await this.supabase
        .rpc('get_learning_path_with_progress', {
          path_slug_param: pathSlug,
          user_id_param: userId
        });

      if (error) throw error;

      return data;

    } catch (error) {
      console.error('[LearningPathService] Error obteniendo path:', error);
      return null;
    }
  }

  /**
   * Inicia un nuevo path para el usuario
   * @param {string} pathSlug - Slug del path a iniciar
   * @returns {Promise<Object|null>} User path creado
   */
  async startPath(pathSlug) {
    try {
      if (!this.user) {
        throw new Error('Usuario no autenticado');
      }

      // Verificar que el path existe y está activo
      const pathData = await this.getPath(pathSlug);
      if (!pathData?.path) {
        throw new Error('Path no encontrado');
      }

      const path = pathData.path;

      // Verificar si ya tiene este path activo
      if (pathData.user_progress) {
        console.warn('[LearningPathService] Usuario ya tiene este path iniciado');
        return pathData.user_progress;
      }

      // Crear user_learning_path
      const { data: userPath, error: insertError } = await this.supabase
        .from('user_learning_paths')
        .insert({
          user_id: this.user.id,
          path_id: path.id,
          status: 'in_progress',
          current_day: 1,
          started_at: new Date().toISOString(),
          last_activity_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Crear registros de progreso para todas las etapas
      const stages = pathData.stages || [];
      if (stages.length > 0) {
        const stageProgressRecords = stages.map(stageData => ({
          user_id: this.user.id,
          user_path_id: userPath.id,
          stage_id: stageData.stage.id,
          status: 'pending'
        }));

        const { error: progressError } = await this.supabase
          .from('user_stage_progress')
          .insert(stageProgressRecords);

        if (progressError) {
          console.warn('[LearningPathService] Error creando progreso de etapas:', progressError);
        }
      }

      // Limpiar cache
      this.clearCache();

      // Emitir evento
      window.eventBus?.emit('learningPath.started', {
        pathSlug,
        pathId: path.id,
        pathTitle: path.title,
        durationDays: path.duration_days,
        timestamp: new Date().toISOString()
      });

      console.log(`[LearningPathService] Path "${path.title}" iniciado`);

      return userPath;

    } catch (error) {
      console.error('[LearningPathService] Error iniciando path:', error);
      return null;
    }
  }

  // ========================================================================
  // GESTIÓN DE PROGRESO
  // ========================================================================

  /**
   * Obtiene el progreso del usuario en un path específico
   * @param {string} pathSlug - Slug del path
   * @returns {Promise<Object|null>} Progreso del usuario
   */
  async getUserProgress(pathSlug) {
    try {
      if (!this.user) {
        console.warn('[LearningPathService] Usuario no autenticado');
        return null;
      }

      const pathData = await this.getPath(pathSlug);
      return pathData?.user_progress || null;

    } catch (error) {
      console.error('[LearningPathService] Error obteniendo progreso:', error);
      return null;
    }
  }

  /**
   * Obtiene todos los paths activos del usuario
   * @returns {Promise<Array>} Lista de paths activos
   */
  async getActiveUserPaths() {
    try {
      if (!this.user) {
        return [];
      }

      const { data, error } = await this.supabase
        .from('user_learning_paths')
        .select(`
          *,
          learning_paths (*)
        `)
        .eq('user_id', this.user.id)
        .eq('status', 'in_progress')
        .order('last_activity_at', { ascending: false });

      if (error) throw error;

      return data || [];

    } catch (error) {
      console.error('[LearningPathService] Error obteniendo paths activos:', error);
      return [];
    }
  }

  /**
   * Completa una etapa del path
   * @param {string} stageId - ID de la etapa
   * @param {Object} completionData - Datos de completitud
   * @returns {Promise<boolean>} Éxito de la operación
   */
  async completeStage(stageId, completionData = {}) {
    try {
      if (!this.user) {
        throw new Error('Usuario no autenticado');
      }

      const {
        notes = null,
        rating = null,
        score = null,
        timeSpentMinutes = null,
        reflections = null
      } = completionData;

      // Actualizar progreso de la etapa
      const updateData = {
        status: 'completed',
        completed_at: new Date().toISOString(),
        notes,
        rating,
        score,
        time_spent_minutes: timeSpentMinutes,
        reflections
      };

      // Remover campos null
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === null) delete updateData[key];
      });

      const { data: stageProgress, error: updateError } = await this.supabase
        .from('user_stage_progress')
        .update(updateData)
        .eq('stage_id', stageId)
        .eq('user_id', this.user.id)
        .select(`
          *,
          learning_path_stages (*),
          user_learning_paths (
            *,
            learning_paths (*)
          )
        `)
        .single();

      if (updateError) throw updateError;

      // Limpiar cache
      this.clearCache();

      // Obtener información del stage y path
      const stage = stageProgress.learning_path_stages;
      const userPath = stageProgress.user_learning_paths;
      const path = userPath.learning_paths;

      // Emitir evento de etapa completada
      window.eventBus?.emit('learningPath.stage.completed', {
        stageId,
        stageTitle: stage.title,
        dayNumber: stage.day_number,
        pathSlug: path.slug,
        pathTitle: path.title,
        rating,
        timestamp: new Date().toISOString()
      });

      // Verificar si se completaron todas las etapas del día
      const dayCompleted = await this.checkDayCompletion(userPath.id, stage.day_number);
      if (dayCompleted) {
        window.eventBus?.emit('learningPath.day.completed', {
          dayNumber: stage.day_number,
          pathSlug: path.slug,
          pathTitle: path.title,
          timestamp: new Date().toISOString()
        });
      }

      // Emitir evento de streak actualizado
      window.eventBus?.emit('learningPath.streak.updated', {
        pathSlug: path.slug,
        streakDays: userPath.streak_days,
        longestStreak: userPath.longest_streak,
        timestamp: new Date().toISOString()
      });

      console.log(`[LearningPathService] Etapa completada: ${stage.title}`);

      return true;

    } catch (error) {
      console.error('[LearningPathService] Error completando etapa:', error);
      return false;
    }
  }

  /**
   * Verifica si se completaron todas las etapas de un día
   * @param {string} userPathId - ID del user_learning_path
   * @param {number} dayNumber - Número del día
   * @returns {Promise<boolean>} True si el día está completo
   */
  async checkDayCompletion(userPathId, dayNumber) {
    try {
      // Obtener el path_id
      const { data: userPath } = await this.supabase
        .from('user_learning_paths')
        .select('path_id')
        .eq('id', userPathId)
        .single();

      if (!userPath) return false;

      // Obtener todas las etapas no opcionales del día
      const { data: dayStages } = await this.supabase
        .from('learning_path_stages')
        .select('id')
        .eq('path_id', userPath.path_id)
        .eq('day_number', dayNumber)
        .eq('is_optional', false);

      if (!dayStages || dayStages.length === 0) return false;

      // Verificar cuántas están completadas
      const { data: completedStages } = await this.supabase
        .from('user_stage_progress')
        .select('id')
        .eq('user_path_id', userPathId)
        .in('stage_id', dayStages.map(s => s.id))
        .eq('status', 'completed');

      return (completedStages?.length || 0) >= dayStages.length;

    } catch (error) {
      console.error('[LearningPathService] Error verificando día completo:', error);
      return false;
    }
  }

  /**
   * Avanza al siguiente día del path
   * @param {string} pathSlug - Slug del path
   * @returns {Promise<boolean>} Éxito de la operación
   */
  async advanceToNextDay(pathSlug) {
    try {
      if (!this.user) {
        throw new Error('Usuario no autenticado');
      }

      // Usar función RPC
      const { data, error } = await this.supabase
        .rpc('advance_to_next_day', {
          path_slug_param: pathSlug,
          user_id_param: this.user.id
        });

      if (error) throw error;

      if (data) {
        console.log('[LearningPathService] Avanzado al siguiente día');
        this.clearCache();
        return true;
      } else {
        console.log('[LearningPathService] No se puede avanzar (día incompleto o último día)');
        return false;
      }

    } catch (error) {
      console.error('[LearningPathService] Error avanzando día:', error);
      return false;
    }
  }

  /**
   * Obtiene la siguiente etapa a completar en un path
   * @param {string} pathSlug - Slug del path
   * @returns {Promise<Object|null>} Siguiente etapa o null
   */
  async getNextStage(pathSlug) {
    try {
      if (!this.user) {
        return null;
      }

      const { data, error } = await this.supabase
        .rpc('get_next_stage', {
          path_slug_param: pathSlug,
          user_id_param: this.user.id
        });

      if (error) throw error;

      return data;

    } catch (error) {
      console.error('[LearningPathService] Error obteniendo siguiente etapa:', error);
      return null;
    }
  }

  /**
   * Abandona un path
   * @param {string} pathSlug - Slug del path
   * @param {string} reason - Razón del abandono (opcional)
   * @returns {Promise<boolean>} Éxito de la operación
   */
  async abandonPath(pathSlug, reason = null) {
    try {
      if (!this.user) {
        throw new Error('Usuario no autenticado');
      }

      // Obtener el path
      const pathData = await this.getPath(pathSlug);
      if (!pathData?.user_progress) {
        throw new Error('Path no iniciado');
      }

      const userPath = pathData.user_progress;
      const path = pathData.path;

      // Actualizar estado
      const { error } = await this.supabase
        .from('user_learning_paths')
        .update({
          status: 'abandoned',
          metadata: {
            ...userPath.metadata,
            abandon_reason: reason,
            abandoned_at: new Date().toISOString()
          }
        })
        .eq('id', userPath.id);

      if (error) throw error;

      // Limpiar cache
      this.clearCache();

      // Emitir evento
      window.eventBus?.emit('learningPath.abandoned', {
        pathSlug,
        pathTitle: path.title,
        reason,
        timestamp: new Date().toISOString()
      });

      console.log(`[LearningPathService] Path abandonado: ${path.title}`);

      return true;

    } catch (error) {
      console.error('[LearningPathService] Error abandonando path:', error);
      return false;
    }
  }

  /**
   * Pausa un path activo
   * @param {string} pathSlug - Slug del path
   * @returns {Promise<boolean>} Éxito de la operación
   */
  async pausePath(pathSlug) {
    try {
      if (!this.user) {
        throw new Error('Usuario no autenticado');
      }

      const pathData = await this.getPath(pathSlug);
      if (!pathData?.user_progress) {
        throw new Error('Path no iniciado');
      }

      const { error } = await this.supabase
        .from('user_learning_paths')
        .update({ status: 'paused' })
        .eq('id', pathData.user_progress.id);

      if (error) throw error;

      this.clearCache();
      console.log('[LearningPathService] Path pausado');

      return true;

    } catch (error) {
      console.error('[LearningPathService] Error pausando path:', error);
      return false;
    }
  }

  /**
   * Reanuda un path pausado
   * @param {string} pathSlug - Slug del path
   * @returns {Promise<boolean>} Éxito de la operación
   */
  async resumePath(pathSlug) {
    try {
      if (!this.user) {
        throw new Error('Usuario no autenticado');
      }

      const pathData = await this.getPath(pathSlug);
      if (!pathData?.user_progress) {
        throw new Error('Path no iniciado');
      }

      const { error } = await this.supabase
        .from('user_learning_paths')
        .update({
          status: 'in_progress',
          last_activity_at: new Date().toISOString()
        })
        .eq('id', pathData.user_progress.id);

      if (error) throw error;

      this.clearCache();
      console.log('[LearningPathService] Path reanudado');

      return true;

    } catch (error) {
      console.error('[LearningPathService] Error reanudando path:', error);
      return false;
    }
  }

  // ========================================================================
  // ESTADÍSTICAS
  // ========================================================================

  /**
   * Obtiene estadísticas del usuario en learning paths
   * @returns {Promise<Object|null>} Estadísticas del usuario
   */
  async getUserStats() {
    try {
      if (!this.user) {
        return null;
      }

      const { data, error } = await this.supabase
        .rpc('get_user_learning_stats', {
          user_id_param: this.user.id
        });

      if (error) throw error;

      return data;

    } catch (error) {
      console.error('[LearningPathService] Error obteniendo estadísticas:', error);
      return null;
    }
  }

  /**
   * Obtiene el historial completo de paths del usuario
   * @returns {Promise<Array>} Historial de paths
   */
  async getPathHistory() {
    try {
      if (!this.user) {
        return [];
      }

      const { data, error } = await this.supabase
        .from('user_learning_paths')
        .select(`
          *,
          learning_paths (*)
        `)
        .eq('user_id', this.user.id)
        .order('started_at', { ascending: false });

      if (error) throw error;

      return data || [];

    } catch (error) {
      console.error('[LearningPathService] Error obteniendo historial:', error);
      return [];
    }
  }

  // ========================================================================
  // UTILIDADES
  // ========================================================================

  /**
   * Limpia el cache
   */
  clearCache() {
    this.cache = {
      paths: null,
      userProgress: {},
      lastUpdate: null
    };
  }

  /**
   * Verifica si el cache es válido
   */
  isCacheValid() {
    if (!this.cache.lastUpdate) return false;
    return (Date.now() - this.cache.lastUpdate) < this.cacheTimeout;
  }

  /**
   * Filtra paths según opciones
   */
  filterPaths(paths, options) {
    let filtered = [...paths];

    if (options.difficulty) {
      filtered = filtered.filter(p => p.difficulty === options.difficulty);
    }

    if (options.maxDuration) {
      filtered = filtered.filter(p => p.duration_days <= options.maxDuration);
    }

    if (options.isPremium !== null) {
      filtered = filtered.filter(p => p.is_premium === options.isPremium);
    }

    return filtered;
  }

  /**
   * Obtiene información sobre el estado actual del servicio
   */
  getServiceInfo() {
    return {
      initialized: this.initialized,
      authenticated: !!this.user,
      userId: this.user?.id || null,
      cacheValid: this.isCacheValid(),
      cachedPaths: this.cache.paths?.length || 0
    };
  }
}

// ========================================================================
// INICIALIZACIÓN GLOBAL
// ========================================================================

// Crear instancia global
window.learningPathService = new LearningPathService();

// Auto-inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.learningPathService.init();
  });
} else {
  // DOM ya está listo
  window.learningPathService.init();
}

console.log('[LearningPathService] Servicio cargado - Accesible como window.learningPathService');
