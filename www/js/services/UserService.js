/**
// 🔧 FIX v2.9.198: Migrated console.log to logger
 * USER SERVICE - Servicio para gestión de usuarios y perfiles
 * Extiende BaseService para operaciones específicas de usuarios
 *
 * @version 1.0.0
 */

class UserService extends BaseService {
  constructor() {
    // Usar tabla de profiles como principal
    super('profiles', {
      cacheTTL: 5 * 60 * 1000, // 5 minutos
      enableOfflineQueue: true
    });

    this.achievementsCache = new Map();
  }

  /**
   * Obtener usuario actual
   * @returns {Object|null} Usuario actual
   */
  getCurrentUser() {
    return this.authHelper?.getCurrentUser() || null;
  }

  /**
   * Obtener perfil del usuario actual con cache
   * @returns {Promise<Object|null>} Perfil del usuario
   */
  async getCurrentProfile() {
    const usuario = this.getCurrentUser();
    if (!usuario) {
      console.warn('No hay usuario autenticado');
      return null;
    }

    return this.getProfile(usuario.id);
  }

  /**
   * Obtener perfil de un usuario con cache
   *
   * @param {string} userId - ID del usuario
   * @returns {Promise<Object|null>} Perfil del usuario
   */
  async getProfile(userId) {
    const cacheKey = `profile:${userId}`;

    // Verificar cache
    if (this.cache.has(cacheKey)) {
      const entrada = this.cache.get(cacheKey);
      if (Date.now() < entrada.expira) {
        return entrada.datos;
      }
    }

    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        this.manejarError('getProfile', error);
        return null;
      }

      // Guardar en cache
      this.cache.set(cacheKey, {
        datos: data,
        expira: Date.now() + this.cacheTTL
      });

      return data;
    } catch (error) {
      this.manejarError('getProfile', error);
      return null;
    }
  }

  /**
   * Actualizar perfil de usuario
   *
   * @param {string} userId - ID del usuario
   * @param {Object} datosActualizacion - Datos a actualizar
   * @param {string} datosActualizacion.full_name - Nombre completo
   * @param {string} datosActualizacion.avatar_url - URL del avatar
   * @param {Object} datosActualizacion.preferences - Preferencias del usuario
   * @returns {Promise<Object|null>} Perfil actualizado
   */
  async updateProfile(userId, datosActualizacion) {
    if (!userId) {
      userId = this.getCurrentUserId();
    }

    if (!userId) {
      console.warn('No hay usuario autenticado para actualizar perfil');
      return null;
    }

    // Preparar datos de actualización
    const datos = {
      ...datosActualizacion,
      updated_at: new Date().toISOString()
    };

    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .update(datos)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        this.manejarError('updateProfile', error);
        return null;
      }

      // Invalidar cache
      this.invalidarCache(userId);

      // Notificar actualización de perfil
      window.dispatchEvent(new CustomEvent('profile-updated', {
        detail: { userId, profile: data }
      }));

      return data;
    } catch (error) {
      this.manejarError('updateProfile', error);
      return null;
    }
  }

  /**
   * Obtener logros del usuario
   *
   * @param {string} userId - ID del usuario
   * @returns {Promise<Array>} Lista de logros
   */
  async getAchievements(userId) {
    if (!userId) {
      userId = this.getCurrentUserId();
    }

    if (!userId) {
      console.warn('No hay usuario autenticado para obtener logros');
      return [];
    }

    const cacheKey = `achievements:${userId}`;

    // Verificar cache
    if (this.achievementsCache.has(cacheKey)) {
      const entrada = this.achievementsCache.get(cacheKey);
      if (Date.now() < entrada.expira) {
        return entrada.datos;
      }
    }

    try {
      const { data, error } = await this.supabase
        .from('achievements')
        .select('*')
        .eq('user_id', userId)
        .order('unlocked_at', { ascending: false });

      if (error) {
        this.manejarError('getAchievements', error);
        return [];
      }

      // Guardar en cache
      this.achievementsCache.set(cacheKey, {
        datos: data || [],
        expira: Date.now() + this.cacheTTL
      });

      return data || [];
    } catch (error) {
      this.manejarError('getAchievements', error);
      return [];
    }
  }

  /**
   * Desbloquear un logro
   *
   * @param {string} userId - ID del usuario
   * @param {string} achievementKey - Clave del logro
   * @param {Object} metadata - Metadatos adicionales
   * @returns {Promise<Object|null>} Logro desbloqueado
   */
  async unlockAchievement(userId, achievementKey, metadata = {}) {
    if (!userId) {
      userId = this.getCurrentUserId();
    }

    if (!userId) {
      console.warn('No hay usuario autenticado para desbloquear logro');
      return null;
    }

    // Verificar si ya está desbloqueado
    const logrosExistentes = await this.getAchievements(userId);
    const yaDesbloqueado = logrosExistentes.find(l => l.achievement_key === achievementKey);

    if (yaDesbloqueado) {
      logger.debug(`Logro ${achievementKey} ya desbloqueado`);
      return yaDesbloqueado;
    }

    const nuevoLogro = {
      user_id: userId,
      achievement_key: achievementKey,
      unlocked_at: new Date().toISOString(),
      metadata
    };

    try {
      const { data, error } = await this.supabase
        .from('achievements')
        .insert(nuevoLogro)
        .select()
        .single();

      if (error) {
        this.manejarError('unlockAchievement', error);
        return null;
      }

      // Invalidar cache de logros
      const cacheKey = `achievements:${userId}`;
      this.achievementsCache.delete(cacheKey);

      // Notificar desbloqueo de logro
      window.dispatchEvent(new CustomEvent('achievement-unlocked', {
        detail: { userId, achievement: data }
      }));

      return data;
    } catch (error) {
      this.manejarError('unlockAchievement', error);
      return null;
    }
  }

  /**
   * Obtener información de suscripción del usuario
   *
   * @param {string} userId - ID del usuario
   * @returns {Promise<Object|null>} Información de suscripción
   */
  async getSubscription(userId) {
    if (!userId) {
      userId = this.getCurrentUserId();
    }

    if (!userId) {
      console.warn('No hay usuario autenticado para obtener suscripción');
      return null;
    }

    try {
      const perfil = await this.getProfile(userId);

      if (!perfil) {
        return null;
      }

      // Extraer información de suscripción del perfil
      const suscripcion = {
        tier: perfil.subscription_tier || 'free',
        status: perfil.subscription_status || 'inactive',
        start: perfil.subscription_start,
        end: perfil.subscription_end,
        trialEndsAt: perfil.trial_ends_at,
        stripeCustomerId: perfil.stripe_customer_id,
        stripeSubscriptionId: perfil.stripe_subscription_id,
        features: perfil.features || {},
        aiCreditsRemaining: perfil.ai_credits_remaining || 0,
        aiCreditsTotal: perfil.ai_credits_total || 0,
        aiCreditsResetDate: perfil.ai_credits_reset_date
      };

      return suscripcion;
    } catch (error) {
      this.manejarError('getSubscription', error);
      return null;
    }
  }

  /**
   * Verificar si el usuario tiene una característica premium activa
   *
   * @param {string} featureKey - Clave de la característica
   * @returns {Promise<boolean>} true si tiene acceso
   */
  async hasFeature(featureKey) {
    try {
      const suscripcion = await this.getSubscription();

      if (!suscripcion) {
        return false;
      }

      // Verificar si la característica está habilitada
      return suscripcion.features[featureKey] === true;
    } catch (error) {
      this.manejarError('hasFeature', error);
      return false;
    }
  }

  /**
   * Verificar si el usuario es premium
   *
   * @param {string} userId - ID del usuario (opcional)
   * @returns {Promise<boolean>} true si es premium
   */
  async isPremium(userId = null) {
    try {
      const suscripcion = await this.getSubscription(userId);

      if (!suscripcion) {
        return false;
      }

      return (
        (suscripcion.tier === 'premium' || suscripcion.tier === 'pro') &&
        suscripcion.status === 'active'
      );
    } catch (error) {
      this.manejarError('isPremium', error);
      return false;
    }
  }

  /**
   * Obtener créditos de IA disponibles
   *
   * @param {string} userId - ID del usuario (opcional)
   * @returns {Promise<Object>} Información de créditos
   */
  async getAICredits(userId = null) {
    try {
      const suscripcion = await this.getSubscription(userId);

      if (!suscripcion) {
        return {
          remaining: 0,
          total: 0,
          resetDate: null
        };
      }

      return {
        remaining: suscripcion.aiCreditsRemaining,
        total: suscripcion.aiCreditsTotal,
        resetDate: suscripcion.aiCreditsResetDate
      };
    } catch (error) {
      this.manejarError('getAICredits', error);
      return {
        remaining: 0,
        total: 0,
        resetDate: null
      };
    }
  }

  /**
   * Decrementar créditos de IA
   *
   * @param {number} cantidad - Cantidad de créditos a decrementar
   * @param {string} userId - ID del usuario (opcional)
   * @returns {Promise<boolean>} true si se decrementó correctamente
   */
  async decrementAICredits(cantidad = 1, userId = null) {
    if (!userId) {
      userId = this.getCurrentUserId();
    }

    if (!userId) {
      console.warn('No hay usuario autenticado para decrementar créditos');
      return false;
    }

    try {
      const perfil = await this.getProfile(userId);

      if (!perfil) {
        return false;
      }

      const nuevosCreditos = Math.max(0, (perfil.ai_credits_remaining || 0) - cantidad);

      const { error } = await this.supabase
        .from('profiles')
        .update({
          ai_credits_remaining: nuevosCreditos,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        this.manejarError('decrementAICredits', error);
        return false;
      }

      // Invalidar cache
      this.invalidarCache(userId);

      return true;
    } catch (error) {
      this.manejarError('decrementAICredits', error);
      return false;
    }
  }

  /**
   * Actualizar preferencias del usuario
   *
   * @param {Object} preferencias - Nuevas preferencias
   * @param {string} userId - ID del usuario (opcional)
   * @returns {Promise<Object|null>} Perfil actualizado
   */
  async updatePreferences(preferencias, userId = null) {
    if (!userId) {
      userId = this.getCurrentUserId();
    }

    if (!userId) {
      console.warn('No hay usuario autenticado para actualizar preferencias');
      return null;
    }

    try {
      // Obtener preferencias actuales
      const perfil = await this.getProfile(userId);
      const preferenciasActuales = perfil?.preferences || {};

      // Combinar con nuevas preferencias
      const preferenciasActualizadas = {
        ...preferenciasActuales,
        ...preferencias
      };

      return this.updateProfile(userId, {
        preferences: preferenciasActualizadas
      });
    } catch (error) {
      this.manejarError('updatePreferences', error);
      return null;
    }
  }

  /**
   * Marcar onboarding como completado
   *
   * @param {string} userId - ID del usuario (opcional)
   * @returns {Promise<boolean>} true si se actualizó correctamente
   */
  async completeOnboarding(userId = null) {
    if (!userId) {
      userId = this.getCurrentUserId();
    }

    if (!userId) {
      console.warn('No hay usuario autenticado para completar onboarding');
      return false;
    }

    try {
      const resultado = await this.updateProfile(userId, {
        onboarding_completed: true
      });

      return resultado !== null;
    } catch (error) {
      this.manejarError('completeOnboarding', error);
      return false;
    }
  }

  /**
   * Obtener estadísticas completas del usuario
   *
   * @param {string} userId - ID del usuario (opcional)
   * @returns {Promise<Object>} Estadísticas del usuario
   */
  async getUserStats(userId = null) {
    if (!userId) {
      userId = this.getCurrentUserId();
    }

    if (!userId) {
      console.warn('No hay usuario autenticado para obtener estadísticas');
      return null;
    }

    try {
      // Obtener datos en paralelo
      const [perfil, logros, suscripcion] = await Promise.all([
        this.getProfile(userId),
        this.getAchievements(userId),
        this.getSubscription(userId)
      ]);

      const estadisticas = {
        perfil,
        logros: {
          total: logros.length,
          lista: logros
        },
        suscripcion,
        miembroDesde: perfil?.created_at,
        ultimaActualizacion: perfil?.updated_at
      };

      return estadisticas;
    } catch (error) {
      this.manejarError('getUserStats', error);
      return null;
    }
  }

  /**
   * Eliminar cuenta de usuario (soft delete)
   *
   * @param {string} userId - ID del usuario
   * @returns {Promise<boolean>} true si se eliminó correctamente
   */
  async deleteAccount(userId = null) {
    if (!userId) {
      userId = this.getCurrentUserId();
    }

    if (!userId) {
      console.warn('No hay usuario autenticado para eliminar cuenta');
      return false;
    }

    // Confirmación obligatoria
    const confirmacion = confirm(
      '¿Estás seguro de que deseas eliminar tu cuenta?\n\n' +
      'Esta acción no se puede deshacer y se perderán todos tus datos.'
    );

    if (!confirmacion) {
      return false;
    }

    try {
      // Marcar como eliminado en lugar de borrar físicamente
      const { error } = await this.supabase
        .from('profiles')
        .update({
          subscription_status: 'canceled',
          preferences: { account_deleted: true },
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        this.manejarError('deleteAccount', error);
        return false;
      }

      // Cerrar sesión
      await this.authHelper?.signOut();

      return true;
    } catch (error) {
      this.manejarError('deleteAccount', error);
      return false;
    }
  }
}

// Crear instancia global y exportar
window.UserService = UserService;
window.userService = new UserService();

logger.debug('👤 UserService inicializado');
