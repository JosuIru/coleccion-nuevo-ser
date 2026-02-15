/**
// 🔧 FIX v2.9.284: Migrated all console.* to logger
 * AUTH HELPER - Sistema de Autenticación Premium
 * Gestión completa de usuarios, suscripciones y permisos
 *
 * @version 1.0.0
 */

class AuthHelper {
  constructor() {
    this.supabase = null;
    this.currentUser = null;
    this.currentProfile = null;
    this.session = null; // Compatibilidad con supabaseAuthHelper
    this.authStateListeners = [];
    this.initialized = false;
    this.initRetries = 0;
    this.maxInitRetries = 10; // Máximo 10 intentos (5 segundos)

    this.init();
  }

  // Getter para compatibilidad con supabaseAuthHelper.user
  get user() {
    return this.currentUser;
  }

  /**
   * Inicializar Supabase y listeners
   */
  async init() {
    if (this.initialized) return;

    // Esperar a que Supabase library y config estén disponibles
    const supabaseLib = window.supabase;
    if (typeof supabaseLib !== 'undefined' && supabaseLib.createClient && window.supabaseConfig) {
      try {
        // Crear cliente Supabase si no existe
        if (!window.supabaseClient) {
          const config = window.supabaseConfig;
          window.supabaseClient = supabaseLib.createClient(config.url, config.anonKey, {
            auth: config.auth
          });
          // Exponer cliente como window.supabase para compatibilidad
          window.supabase = window.supabaseClient;
        }

        this.supabase = window.supabaseClient;

        await this.loadSession();
        this.setupAuthListener();
        this.initialized = true;
        logger.debug('🔐 AuthHelper inicializado');
      } catch (error) {
        logger.error('❌ Error inicializando AuthHelper:', error);
      }
    } else {
      this.initRetries++;
      if (this.initRetries < this.maxInitRetries) {
        // Solo loguear en el primer intento para evitar spam
        if (this.initRetries === 1) {
          logger.warn('⚠️ Supabase no disponible. AuthHelper esperando...');
        }
        setTimeout(() => this.init(), 500);
      } else {
        logger.warn('⚠️ AuthHelper: Supabase no cargó después de', this.maxInitRetries, 'intentos. Auth deshabilitado.');
        this.initialized = true; // Marcar como inicializado para evitar más intentos
      }
    }
  }

  /**
   * Cargar sesión actual
   */
  async loadSession() {
    try {
      const { data: { session } } = await this.supabase.auth.getSession();

      if (session) {
        this.session = session;
        this.currentUser = session.user;
        await this.loadUserProfile();
        this.notifyAuthStateChange('signed_in', this.currentUser);
      }
    } catch (error) {
      logger.error('Error loading session:', error);
    }
  }

  /**
   * Escuchar cambios de autenticación
   */
  setupAuthListener() {
    this.supabase.auth.onAuthStateChange(async (event, session) => {
      logger.debug('🔔 Auth state changed:', event);
      this.session = session;

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        this.currentUser = session?.user || null;
        await this.loadUserProfile();
        this.notifyAuthStateChange('signed_in', this.currentUser);

        // Actualizar UI si existe el modal de settings
        if (window.settingsModal) {
          window.settingsModal.updateContent?.();
        }
      } else if (event === 'SIGNED_OUT') {
        this.currentUser = null;
        this.currentProfile = null;
        this.session = null;
        this.notifyAuthStateChange('signed_out', null);

        if (window.settingsModal) {
          window.settingsModal.updateContent?.();
        }
      }
    });
  }

  /**
   * Cargar perfil del usuario desde la base de datos
   */
  async loadUserProfile() {
    if (!this.currentUser) return null;

    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', this.currentUser.id)
        .single();

      if (error) throw error;

      this.currentProfile = data;
      // 🔧 v2.9.391: Log detallado de tokens para debugging
      logger.debug('👤 Perfil cargado:', {
        email: data?.email?.split('@')[0] || 'usuario',
        tier: data?.subscription_tier,
        tokenBalance: data?.token_balance,
        aiCreditsRemaining: data?.ai_credits_remaining,
        role: data?.role
      });

      // Verificar si necesita reset de créditos
      this.checkCreditsReset();

      // 🔧 FIX v2.9.381: Actualizar proveedor IA si es premium
      this.updateAIProviderForPremium(data);

      return data;
    } catch (error) {
      logger.error('Error loading profile:', error);
      return null;
    }
  }

  /**
   * Verificar si necesita resetear créditos mensuales
   */
  async checkCreditsReset() {
    if (!this.currentProfile) return;

    try {
      const resetDate = new Date(this.currentProfile.ai_credits_reset_date);
      const now = new Date();

      if (now >= resetDate) {
        logger.debug('🔄 Reseteando créditos mensuales...');

        // 🔧 FIX #99: Agregar retry logic y error handling
        const { error } = await this.executeWithRetry(() =>
          this.supabase
            .from('profiles')
            .update({
              ai_credits_remaining: this.currentProfile.ai_credits_total,
              ai_credits_reset_date: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // +30 días
            })
            .eq('id', this.currentUser.id)
        );

        if (error) throw error;

        await this.loadUserProfile();
      }
    } catch (error) {
      // 🔧 FIX #99: Capturar y reportar error
      logger.error('❌ Error reseteando créditos:', error);
      this.handleSupabaseError(error, 'checkCreditsReset');
      // No lanzar error para no bloquear la carga del perfil
    }
  }

  /**
   * 🔧 FIX v2.9.381: Actualizar proveedor de IA para usuarios premium
   * Los usuarios premium usan Claude via proxy automáticamente
   */
  updateAIProviderForPremium(profile) {
    if (!profile) return;

    // 🔧 FIX v2.9.382: Verificar premium case-insensitive
    const tier = (profile.subscription_tier || '').toLowerCase();
    const isPremium = ['premium', 'pro'].includes(tier);

    logger.debug('🔍 [AI Provider] subscription_tier:', profile.subscription_tier, '-> isPremium:', isPremium);

    if (isPremium) {
      // Esperar a que aiConfig esté disponible
      const updateProvider = () => {
        if (!window.aiConfig) {
          logger.debug('⏳ aiConfig no disponible, reintentando...');
          setTimeout(updateProvider, 100);
          return;
        }

        const currentProvider = window.aiConfig.getCurrentProvider();
        logger.debug('🔍 [AI Provider] Current:', currentProvider);

        // SIEMPRE establecer Claude para premium (forzar)
        window.aiConfig.config.provider = 'claude';
        window.aiConfig.config.preferences = window.aiConfig.config.preferences || {};
        window.aiConfig.config.preferences.selectedModel = 'claude-3-5-haiku-20241022';
        window.aiConfig.saveConfig();

        logger.debug('⭐ Usuario premium: Provider establecido a Claude');

        // Mostrar toast siempre para premium
        if (window.toast) {
          window.toast.success('⭐ Premium: Claude IA activo', 3000);
        }

        // Emitir evento para que las UIs se actualicen
        window.dispatchEvent(new CustomEvent('ai-provider-updated', {
          detail: { provider: 'claude', isPremium: true }
        }));
      };

      updateProvider();
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MÉTODOS DE AUTENTICACIÓN
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Registrar nuevo usuario
   */
  async signUp(email, password, fullName) {
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          },
          emailRedirectTo: `${window.location.origin}/verify-email`
        }
      });

      if (error) throw error;

      logger.debug('✅ Usuario registrado:', data);

      // Mostrar mensaje de confirmación de email
      this.showEmailConfirmationMessage(email);

      return { success: true, data };
    } catch (error) {
      logger.error('❌ Error en registro:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Iniciar sesión
   */
  async signIn(email, password) {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      logger.debug('✅ Sesión iniciada:', data);
      return { success: true, data };
    } catch (error) {
      logger.error('❌ Error al iniciar sesión:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Iniciar sesión con Google
   */
  async signInWithGoogle() {
    try {
      // Detectar si estamos en app Capacitor o web
      const isCapacitor = window.Capacitor?.isNativePlatform?.() ||
                          (window.location.origin.includes('localhost') && window.Capacitor);

      // En Capacitor, usar el custom scheme; en web, usar origin
      const redirectUrl = isCapacitor
        ? 'com.nuevosser.coleccion://auth/callback'
        : `${window.location.origin}/auth/callback`;

      logger.debug('🔐 OAuth redirect URL:', redirectUrl);

      const { data, error } = await this.supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      });

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      logger.error('❌ Error con Google:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Cerrar sesión
   */
  async signOut() {
    try {
      const { error } = await this.supabase.auth.signOut();

      if (error) throw error;

      this.currentUser = null;
      this.currentProfile = null;

      // 🔧 FIX #5: Limpiar caché de admin al hacer logout
      if (window.biblioteca && typeof window.biblioteca.clearAdminCache === 'function') {
        window.biblioteca?.clearAdminCache();
      }

      logger.debug('👋 Sesión cerrada');
      return { success: true };
    } catch (error) {
      logger.error('❌ Error al cerrar sesión:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Recuperar contraseña
   */
  async resetPassword(email) {
    try {
      const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) throw error;

      this.showNotification('📧 Email de recuperación enviado. Revisa tu bandeja de entrada.', 'success');
      return { success: true };
    } catch (error) {
      logger.error('❌ Error al recuperar contraseña:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Actualizar contraseña
   */
  async updatePassword(newPassword) {
    try {
      const { error } = await this.supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      this.showNotification('✅ Contraseña actualizada correctamente', 'success');
      return { success: true };
    } catch (error) {
      logger.error('❌ Error al actualizar contraseña:', error);
      return { success: false, error: error.message };
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GESTIÓN DE PERFIL
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Actualizar perfil del usuario
   */
  async updateProfile(updates) {
    if (!this.currentUser) {
      throw new Error('No hay usuario autenticado');
    }

    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .update(updates)
        .eq('id', this.currentUser.id)
        .select()
        .single();

      if (error) throw error;

      this.currentProfile = data;
      logger.debug('✅ Perfil actualizado');

      return { success: true, data };
    } catch (error) {
      logger.error('❌ Error al actualizar perfil:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Actualizar avatar
   */
  async updateAvatar(file) {
    if (!this.currentUser) {
      throw new Error('No hay usuario autenticado');
    }

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${this.currentUser.id}-${Date.now()}.${fileExt}`;

      // Subir a Supabase Storage
      const { data: uploadData, error: uploadError } = await this.supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Obtener URL pública
      const { data: urlData } = this.supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Actualizar perfil
      await this.updateProfile({
        avatar_url: urlData.publicUrl
      });

      return { success: true, url: urlData.publicUrl };
    } catch (error) {
      logger.error('❌ Error al subir avatar:', error);
      return { success: false, error: error.message };
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SISTEMA DE PERMISOS Y SUSCRIPCIONES
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Verificar si el usuario tiene una feature habilitada
   * 🔧 FIX v2.9.383: Usar PLANS_CONFIG en lugar de profile.features
   * 🔧 v2.9.391: Añadido debug logging
   */
  hasFeature(featureName) {
    if (!this.currentProfile) {
      logger.debug('[AuthHelper] hasFeature: no profile loaded');
      return false;
    }

    const tier = (this.currentProfile.subscription_tier || 'free').toLowerCase();
    logger.debug('[AuthHelper] hasFeature check:', { featureName, tier, rawTier: this.currentProfile.subscription_tier });

    // Usar PLANS_CONFIG para verificar features según plan
    if (window.PLANS_CONFIG) {
      const result = window.PLANS_CONFIG.hasFeature(tier, featureName);
      logger.debug('[AuthHelper] PLANS_CONFIG.hasFeature result:', result);
      return result;
    }

    // Fallback: premium/pro tienen todas las features principales
    if (['premium', 'pro'].includes(tier)) {
      const premiumFeatures = ['ai_chat', 'ai_tutor', 'ai_content_adapter', 'elevenlabs_tts', 'advanced_analytics'];
      const result = premiumFeatures.includes(featureName);
      logger.debug('[AuthHelper] Fallback hasFeature result:', result);
      return result;
    }

    logger.debug('[AuthHelper] hasFeature: tier not premium/pro, returning false');
    return false;
  }

  /**
   * Obtener tier de suscripción
   */
  getSubscriptionTier() {
    return this.currentProfile?.subscription_tier || 'free';
  }

  /**
   * Verificar si la suscripción está activa
   */
  isSubscriptionActive() {
    return this.currentProfile?.subscription_status === 'active';
  }

  /**
   * Verificar si el usuario es Premium (tier premium o pro)
   */
  isPremium() {
    const tier = this.getSubscriptionTier();
    return tier === 'premium' || tier === 'pro';
  }

  /**
   * 🔧 v2.9.391: Verificar si el usuario es administrador
   * Admins tienen tokens ilimitados y acceso a todas las features
   */
  isAdmin() {
    return this.currentProfile?.role === 'admin';
  }

  /**
   * Obtener créditos de IA restantes
   */
  getAICredits() {
    return this.currentProfile?.ai_credits_remaining || 0;
  }

  /**
   * Verificar si tiene créditos suficientes
   */
  hasEnoughCredits(requiredCredits) {
    return this.getAICredits() >= requiredCredits;
  }

  /**
   * Consumir créditos de IA
   */
  async consumeCredits(amount, context, provider, model, tokensUsed = 0) {
    if (!this.currentUser) {
      throw new Error('Usuario no autenticado');
    }

    try {
      // Verificar créditos disponibles
      if (!this.hasEnoughCredits(amount)) {
        throw new Error('Créditos insuficientes. Por favor, actualiza tu plan.');
      }

      // 🔧 FIX #99: Usar executeWithRetry para consumir créditos
      const { data, error } = await this.executeWithRetry(() =>
        this.supabase.rpc('consume_ai_credits', {
          p_user_id: this.currentUser.id,
          p_credits: amount
        })
      );

      if (error) throw error;

      if (!data) {
        throw new Error('No se pudieron consumir los créditos');
      }

      // 🔧 FIX #99: Registrar uso con retry logic
      await this.executeWithRetry(() =>
        this.supabase.from('ai_usage').insert({
          user_id: this.currentUser.id,
          provider,
          model,
          context,
          tokens_total: tokensUsed,
          cost_usd: this.estimateCost(tokensUsed, provider, model)
        })
      );

      // Recargar perfil
      await this.loadUserProfile();

      return { success: true, remaining: this.getAICredits() };
    } catch (error) {
      logger.error('❌ Error al consumir créditos:', error);
      // 🔧 FIX #99: Usar handleSupabaseError para categorización
      const category = this.handleSupabaseError(error, 'consumeCredits');
      return { success: false, error: error.message, category };
    }
  }

  /**
   * Estimar costo de tokens
   */
  estimateCost(tokens, provider, model) {
    // Usar pricing de PLANS_CONFIG si está disponible
    if (window.PLANS_CONFIG?.tokenPricing?.[model]) {
      const pricing = window.PLANS_CONFIG.tokenPricing[model];
      return ((tokens / 1000) * pricing.costPer1K).toFixed(6);
    }

    // Fallback: Costos por 1K tokens
    const costs = {
      'claude-sonnet-4': 0.003,
      'claude-3-5-sonnet': 0.003,
      'claude-3-5-haiku': 0.001,
      'gpt-4o': 0.005,
      'gpt-4o-mini': 0.0005,
      'gemini-2.0-flash': 0.001
    };

    const costPer1K = costs[model] || 0.002;
    return ((tokens / 1000) * costPer1K).toFixed(6);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SISTEMA DE TOKENS v2.9.386
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Obtener balance total de tokens (comprados + mensuales restantes)
   * 🔧 v2.9.391: Añadido debug logging
   */
  getTokenBalance() {
    const purchased = this.currentProfile?.token_balance || 0;
    const monthly = this.currentProfile?.ai_credits_remaining || 0;
    const total = purchased + monthly;

    // Debug: mostrar los valores del perfil
    logger.debug('[AuthHelper] getTokenBalance:', {
      purchased,
      monthly,
      total,
      rawTokenBalance: this.currentProfile?.token_balance,
      rawAiCredits: this.currentProfile?.ai_credits_remaining
    });

    return total;
  }

  /**
   * Obtener tokens comprados (wallet)
   */
  getPurchasedTokens() {
    return this.currentProfile?.token_balance || 0;
  }

  /**
   * Obtener tokens mensuales restantes (de suscripción)
   */
  getMonthlyTokensRemaining() {
    return this.currentProfile?.ai_credits_remaining || 0;
  }

  /**
   * Verificar si tiene suficientes tokens
   */
  hasEnoughTokens(requiredTokens) {
    return this.getTokenBalance() >= requiredTokens;
  }

  /**
   * Consumir tokens (primero mensuales, luego comprados)
   * @param {number} amount - Cantidad de tokens a consumir
   * @param {string} context - Contexto (ai_chat, elevenlabs, game_master)
   * @param {string} provider - Proveedor (claude, openai, etc)
   * @param {string} model - Modelo específico
   */
  async consumeTokens(amount, context, provider, model) {
    if (!this.currentUser) {
      throw new Error('Usuario no autenticado');
    }

    try {
      // Verificar tokens disponibles
      if (!this.hasEnoughTokens(amount)) {
        throw new Error('Tokens insuficientes. Compra más tokens para continuar.');
      }

      // Calcular cuánto consumir de cada fuente
      let monthlyToConsume = 0;
      let purchasedToConsume = 0;
      const monthlyRemaining = this.getMonthlyTokensRemaining();

      if (monthlyRemaining >= amount) {
        // Solo consumir de mensuales
        monthlyToConsume = amount;
      } else {
        // Consumir todos los mensuales y el resto de comprados
        monthlyToConsume = monthlyRemaining;
        purchasedToConsume = amount - monthlyRemaining;
      }

      // Consumir tokens mensuales si hay
      if (monthlyToConsume > 0) {
        const { error: monthlyError } = await this.executeWithRetry(() =>
          this.supabase.rpc('consume_ai_credits', {
            p_user_id: this.currentUser.id,
            p_credits: monthlyToConsume
          })
        );
        if (monthlyError) throw monthlyError;
      }

      // Consumir tokens comprados si hay
      if (purchasedToConsume > 0) {
        const { error: purchasedError } = await this.executeWithRetry(() =>
          this.supabase.rpc('consume_purchased_tokens', {
            p_user_id: this.currentUser.id,
            p_tokens: purchasedToConsume
          })
        );
        if (purchasedError) throw purchasedError;
      }

      // Registrar uso en ai_usage
      await this.executeWithRetry(() =>
        this.supabase.from('ai_usage').insert({
          user_id: this.currentUser.id,
          provider,
          model,
          context,
          tokens_total: amount,
          cost_usd: this.estimateCost(amount, provider, model)
        })
      );

      // Registrar en historial de tokens
      await this.executeWithRetry(() =>
        this.supabase.from('token_transactions').insert({
          user_id: this.currentUser.id,
          type: 'consumption',
          tokens_amount: -amount,
          payment_method: monthlyToConsume > 0 ? 'subscription' : 'purchased',
          context
        })
      );

      // Recargar perfil
      await this.loadUserProfile();

      return { success: true, remaining: this.getTokenBalance() };
    } catch (error) {
      logger.error('❌ Error al consumir tokens:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Añadir tokens al balance (después de compra)
   */
  async addTokens(amount, paymentMethod, paymentId = null) {
    if (!this.currentUser) {
      throw new Error('Usuario no autenticado');
    }

    try {
      // Actualizar balance
      const { error } = await this.executeWithRetry(() =>
        this.supabase.rpc('add_purchased_tokens', {
          p_user_id: this.currentUser.id,
          p_tokens: amount
        })
      );

      if (error) throw error;

      // Registrar transacción
      await this.executeWithRetry(() =>
        this.supabase.from('token_transactions').insert({
          user_id: this.currentUser.id,
          type: 'purchase',
          tokens_amount: amount,
          payment_method: paymentMethod,
          payment_id: paymentId
        })
      );

      // Recargar perfil
      await this.loadUserProfile();

      logger.debug(`✅ Añadidos ${amount} tokens via ${paymentMethod}`);
      return { success: true, newBalance: this.getTokenBalance() };
    } catch (error) {
      logger.error('❌ Error añadiendo tokens:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Verificar si tokens están bajos (<10% del último paquete o <1000)
   */
  isTokenBalanceLow() {
    const balance = this.getTokenBalance();
    return balance < 1000;
  }

  /**
   * Obtener información formateada de tokens para UI
   */
  getTokensInfo() {
    const purchased = this.getPurchasedTokens();
    const monthly = this.getMonthlyTokensRemaining();
    const total = purchased + monthly;
    const plan = this.getSubscriptionTier();
    const planData = window.PLANS_CONFIG?.getPlan(plan);

    return {
      total,
      purchased,
      monthly,
      monthlyMax: planData?.monthlyTokens || 0,
      formatted: window.PLANS_CONFIG?.formatTokens(total) || total.toLocaleString(),
      isLow: this.isTokenBalanceLow(),
      plan
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILIDADES
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Verificar si el usuario está autenticado
   */
  isAuthenticated() {
    return !!this.currentUser;
  }

  /**
   * Obtener usuario actual
   */
  getUser() {
    return this.currentUser;
  }

  /**
   * Obtener perfil actual
   */
  getProfile() {
    return this.currentProfile;
  }

  /**
   * Suscribirse a cambios de auth state
   */
  onAuthStateChange(callback) {
    this.authStateListeners.push(callback);

    // Llamar inmediatamente con el estado actual
    if (this.currentUser) {
      callback('signed_in', this.currentUser);
    }

    // Retornar función para desuscribirse
    return () => {
      this.authStateListeners = this.authStateListeners.filter(cb => cb !== callback);
    };
  }

  /**
   * Notificar a todos los listeners
   */
  notifyAuthStateChange(event, user) {
    this.authStateListeners.forEach(callback => {
      try {
        callback(event, user);
      } catch (error) {
        logger.error('Error in auth state listener:', error);
      }
    });
  }

  /**
   * Mostrar mensaje de confirmación de email
   */
  showEmailConfirmationMessage(email) {
    const message = `
      📧 Email de confirmación enviado a ${email}

      Por favor, revisa tu bandeja de entrada y confirma tu cuenta.
    `;

    this.showNotification(message, 'info', 8000);
  }

  /**
   * Mostrar notificación (integración con sistema existente)
   */
  showNotification(message, type = 'info', duration = 5000) {
    // Usar toast si está disponible
    if (window.toast) {
      if (type === 'error') window.toast.error(message);
      else if (type === 'success') window.toast.success(message);
      else window.toast.info(message);
      return;
    }

    // Si existe el sistema de notificaciones de la app, usarlo
    if (typeof window.showNotification === 'function') {
      window.showNotification(message, type);
      return;
    }

    // Fallback: solo log (sin alert para no molestar)
    logger.log(`[${type.toUpperCase()}] ${message}`);
  }

  /**
   * Obtener días restantes de suscripción
   */
  getDaysUntilRenewal() {
    if (!this.currentProfile?.subscription_end) return null;

    const endDate = new Date(this.currentProfile.subscription_end);
    const now = new Date();
    const diffTime = endDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  }

  /**
   * Verificar si está en trial
   */
  isOnTrial() {
    return this.currentProfile?.subscription_status === 'trialing';
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MÉTODOS DE COMPATIBILIDAD CON supabaseAuthHelper
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Obtener usuario actual (alias para compatibilidad)
   */
  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * Obtener sesión actual
   */
  getSession() {
    return this.session;
  }

  /**
   * Obtener token de acceso actual
   */
  async getAccessToken() {
    if (this.session?.access_token) {
      return this.session.access_token;
    }
    // Intentar obtener de Supabase
    try {
      const { data } = await this.supabase.auth.getSession();
      return data?.session?.access_token || null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Login anónimo
   */
  async signInAnonymously() {
    try {
      const { data, error } = await this.supabase.auth.signInAnonymously();

      if (error) throw error;

      window.toast?.info('Sesión anónima iniciada');
      return { data, error: null };
    } catch (error) {
      logger.error('Error en signInAnonymously:', error);
      window.toast?.error('Error al iniciar sesión anónima');
      return { data: null, error };
    }
  }

  /**
   * Eliminar cuenta
   */
  async deleteAccount() {
    if (!this.currentUser) {
      window.toast?.error('No hay usuario autenticado');
      return { error: new Error('No user') };
    }

    const confirmed = await window.confirmModal?.show({
      title: 'Eliminar cuenta',
      message: '¿Estás seguro de que quieres eliminar tu cuenta? Esta acción no se puede deshacer.',
      confirmText: 'Eliminar cuenta',
      cancelText: 'Cancelar',
      type: 'danger'
    }) ?? confirm('¿Estás seguro de que quieres eliminar tu cuenta?');
    if (!confirmed) {
      return { error: new Error('Cancelled') };
    }

    try {
      await this.deleteAllUserData();
      await this.supabase.auth.signOut();

      this.currentUser = null;
      this.currentProfile = null;
      this.session = null;

      window.toast?.success('Cuenta y datos eliminados correctamente');

      setTimeout(() => {
        window.location.href = '/';
      }, 1500);

      return { error: null };
    } catch (error) {
      logger.error('Error en deleteAccount:', error);
      window.toast?.error(error.message || 'Error al eliminar cuenta');
      return { error };
    }
  }

  /**
   * Eliminar todos los datos del usuario
   */
  async deleteAllUserData() {
    if (!this.currentUser) return;

    const tables = ['reading_progress', 'bookmarks', 'notes', 'quotes', 'ai_usage', 'ai_missions', 'ai_conversations'];
    const deletePromises = tables.map(table =>
      this.supabase.from(table).delete().eq('user_id', this.currentUser.id)
    );

    await Promise.allSettled(deletePromises);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MÉTODOS UI - RENDERIZADO DE PANELES
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Renderizar panel de settings para Account tab
   */
  renderSettingsPanel() {
    if (!this.isAuthenticated()) {
      // 🔧 v2.9.400: Mostrar formulario de login directamente en el panel
      return `
        <div class="space-y-4">
          <p class="text-gray-400 mb-4">Inicia sesión para sincronizar tus datos en la nube</p>

          <!-- Formulario de Login Inline -->
          <form id="supabase-inline-login-form" class="space-y-4">
            <div>
              <label class="block text-sm text-gray-400 mb-2">Email</label>
              <input type="email" id="inline-login-email" required
                     class="w-full bg-slate-700 rounded-lg px-4 py-3 text-white border border-slate-600 focus:border-blue-500 focus:outline-none">
            </div>
            <div>
              <label class="block text-sm text-gray-400 mb-2">Contraseña</label>
              <input type="password" id="inline-login-password" required
                     class="w-full bg-slate-700 rounded-lg px-4 py-3 text-white border border-slate-600 focus:border-blue-500 focus:outline-none">
            </div>
            <button type="submit" class="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 !text-white font-semibold rounded-lg transition-all">
              Iniciar Sesión
            </button>
          </form>

          <div class="relative my-4">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-slate-600"></div>
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-2 bg-slate-800 text-gray-400">o continúa con</span>
            </div>
          </div>

          <button id="supabase-signin-google" class="w-full py-3 px-4 bg-white hover:bg-gray-100 text-gray-800 font-semibold rounded-lg transition-all flex items-center justify-center gap-3 border border-gray-300">
            <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Continuar con Google
          </button>

          <div class="text-center mt-4">
            <button type="button" id="supabase-forgot-password-inline" class="text-sm text-blue-400 hover:underline">¿Olvidaste tu contraseña?</button>
          </div>

          <div class="border-t border-slate-700 pt-4 mt-4">
            <p class="text-sm text-gray-500 text-center mb-3">¿No tienes cuenta?</p>
            <button id="supabase-show-signup" class="w-full py-2.5 px-4 bg-slate-700 hover:bg-slate-600 !text-white font-medium rounded-lg transition-all border border-slate-600">
              Crear Cuenta Nueva
            </button>
          </div>

          <button id="supabase-signin-anonymous" class="w-full py-2 text-sm text-gray-500 hover:text-gray-300 transition-colors">
            Continuar sin cuenta →
          </button>
        </div>
      `;
    }

    const tier = this.getSubscriptionTier();
    const planInfo = this.getPlanInfo();
    const credits = this.getAICredits();
    const creditsTotal = this.currentProfile?.ai_credits_total || 0;

    return `
      <div class="space-y-4">
        <div class="bg-slate-700 rounded-lg p-4">
          <p class="text-sm text-gray-400 mb-2">Email</p>
          <p class="text-white font-medium">${this.currentUser.email}</p>
        </div>

        <div class="bg-slate-700 rounded-lg p-4">
          <p class="text-sm text-gray-400 mb-2">Plan</p>
          <p class="text-white font-medium">${planInfo.icon} ${planInfo.name}</p>
          ${tier !== 'free' ? `<p class="text-xs text-green-400 mt-1">✓ Suscripción activa</p>` : ''}
        </div>

        <div class="bg-slate-700 rounded-lg p-4">
          <p class="text-sm text-gray-400 mb-2">Créditos IA</p>
          <div class="flex items-center gap-2">
            <div class="flex-1 bg-slate-600 rounded-full h-2">
              <div class="bg-amber-500 h-2 rounded-full" style="width: ${creditsTotal > 0 ? (credits / creditsTotal) * 100 : 0}%"></div>
            </div>
            <span class="text-white text-sm">${credits} / ${creditsTotal}</span>
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <button id="supabase-change-password" class="btn-secondary">Cambiar Contraseña</button>
          <button id="supabase-signout" class="btn-secondary">Cerrar Sesión</button>
          <button id="supabase-delete-account" class="btn-danger text-sm">Eliminar Cuenta</button>
        </div>
      </div>
    `;
  }

  /**
   * Adjuntar event listeners para el panel de settings
   */
  attachSettingsListeners() {
    // 🔧 v2.9.400: Listener para formulario de login inline
    document.getElementById('supabase-inline-login-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('inline-login-email').value;
      const password = document.getElementById('inline-login-password').value;
      const submitBtn = e.target.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'Entrando...';
      submitBtn.disabled = true;

      const result = await this.signIn(email, password);
      if (result.success) {
        if (window.settingsModalInstance) {
          window.settingsModalInstance.updateContent();
        }
      } else {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      }
    });

    // Listener para "Olvidaste tu contraseña" inline
    document.getElementById('supabase-forgot-password-inline')?.addEventListener('click', () => {
      this.showForgotPasswordModal();
    });

    // Listener para Google Sign-In
    document.getElementById('supabase-signin-google')?.addEventListener('click', async () => {
      await this.signInWithGoogle();
    });

    // Legacy: por si aún se usa el botón de mostrar login modal
    document.getElementById('supabase-show-login')?.addEventListener('click', () => {
      this.showLoginModal();
    });

    document.getElementById('supabase-show-signup')?.addEventListener('click', () => {
      this.showSignupModal();
    });

    document.getElementById('supabase-signin-anonymous')?.addEventListener('click', async () => {
      await this.signInAnonymously();
    });

    document.getElementById('supabase-change-password')?.addEventListener('click', () => {
      this.showChangePasswordModal();
    });

    document.getElementById('supabase-signout')?.addEventListener('click', async () => {
      const confirmed = await window.confirmModal?.show({
        title: 'Cerrar sesión',
        message: '¿Estás seguro de que quieres cerrar sesión?',
        confirmText: 'Cerrar sesión',
        cancelText: 'Cancelar',
        type: 'warning',
        icon: '🚪'
      }) ?? confirm('¿Cerrar sesión?');
      if (confirmed) {
        await this.signOut();
        if (window.settingsModalInstance) {
          window.settingsModalInstance.updateContent();
        }
      }
    });

    document.getElementById('supabase-delete-account')?.addEventListener('click', async () => {
      const confirmed = await window.confirmModal?.show({
        title: '⚠️ Eliminar cuenta permanentemente',
        message: 'Esto eliminará permanentemente tu cuenta y todos tus datos. Esta acción NO se puede deshacer.',
        confirmText: 'Sí, eliminar todo',
        cancelText: 'Cancelar',
        type: 'danger'
      }) ?? confirm('⚠️ ADVERTENCIA: Esto eliminará permanentemente tu cuenta y todos tus datos. ¿Estás seguro?');
      if (confirmed) {
        const doubleConfirm = prompt('Escribe "ELIMINAR" para confirmar:');
        if (doubleConfirm === 'ELIMINAR') {
          await this.deleteAccount();
        }
      }
    });
  }

  /**
   * Mostrar modal de login
   */
  showLoginModal() {
    // 🔧 v2.9.400: Cerrar settings modal antes de abrir login para evitar conflictos de CSS
    if (window.settingsModalInstance) {
      window.settingsModalInstance.close();
    }

    // Crear el modal con estilos inline completos para evitar conflictos CSS
    const modalContainer = document.createElement('div');
    modalContainer.id = 'supabase-login-modal';
    modalContainer.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;width:100vw;height:100vh;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;z-index:99999;padding:1rem;';

    modalContainer.innerHTML = `
      <div style="background:#1e293b;border-radius:12px;padding:1.5rem;max-width:400px;width:100%;box-shadow:0 25px 50px -12px rgba(0,0,0,0.5);border:1px solid #334155;">
        <h2 style="font-size:1.25rem;font-weight:bold;margin-bottom:1rem;color:white;">Iniciar Sesión</h2>
        <form id="supabase-login-form">
          <div style="margin-bottom:1rem;">
            <label style="display:block;font-size:0.875rem;color:#9ca3af;margin-bottom:0.5rem;">Email</label>
            <input type="email" id="login-email" required
                   style="width:100%;background:#334155;border-radius:8px;padding:0.75rem 1rem;color:white;border:1px solid #475569;outline:none;box-sizing:border-box;">
          </div>
          <div style="margin-bottom:1rem;">
            <label style="display:block;font-size:0.875rem;color:#9ca3af;margin-bottom:0.5rem;">Contraseña</label>
            <input type="password" id="login-password" required
                   style="width:100%;background:#334155;border-radius:8px;padding:0.75rem 1rem;color:white;border:1px solid #475569;outline:none;box-sizing:border-box;">
          </div>
          <div style="display:flex;gap:0.75rem;margin-top:1.5rem;">
            <button type="submit" style="flex:1;padding:0.75rem 1rem;background:linear-gradient(135deg,#2563eb,#1d4ed8);color:white;font-weight:600;border-radius:8px;border:none;cursor:pointer;">Entrar</button>
            <button type="button" id="cancel-login" style="flex:1;padding:0.75rem 1rem;background:#475569;color:white;font-weight:600;border-radius:8px;border:1px solid #64748b;cursor:pointer;">Cancelar</button>
          </div>
          <button type="button" id="forgot-password" style="margin-top:1rem;font-size:0.875rem;color:#60a5fa;background:none;border:none;cursor:pointer;text-decoration:underline;">¿Olvidaste tu contraseña?</button>
        </form>
      </div>
    `;

    document.body.appendChild(modalContainer);

    document.getElementById('supabase-login-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;
      const result = await this.signIn(email, password);
      if (result.success) {
        document.getElementById('supabase-login-modal').remove();
        if (window.settingsModalInstance) {
          window.settingsModalInstance.updateContent();
        }
      }
    });

    document.getElementById('cancel-login').addEventListener('click', () => {
      document.getElementById('supabase-login-modal').remove();
    });

    document.getElementById('forgot-password').addEventListener('click', () => {
      document.getElementById('supabase-login-modal').remove();
      this.showForgotPasswordModal();
    });
  }

  /**
   * Mostrar modal de signup
   */
  showSignupModal() {
    const modal = `
      <div id="supabase-signup-modal" class="fixed inset-0 bg-black/80 flex items-center justify-center z-[10001] p-4">
        <div class="bg-slate-800 rounded-xl p-6 max-w-md w-full">
          <h2 class="text-xl font-bold mb-4">Crear Cuenta</h2>
          <form id="supabase-signup-form" class="space-y-4">
            <div>
              <label class="block text-sm text-gray-400 mb-2">Nombre</label>
              <input type="text" id="signup-name" class="w-full bg-slate-700 rounded-lg px-4 py-2 text-white">
            </div>
            <div>
              <label class="block text-sm text-gray-400 mb-2">Email</label>
              <input type="email" id="signup-email" required class="w-full bg-slate-700 rounded-lg px-4 py-2 text-white">
            </div>
            <div>
              <label class="block text-sm text-gray-400 mb-2">Contraseña (mínimo 6 caracteres)</label>
              <input type="password" id="signup-password" required minlength="6" class="w-full bg-slate-700 rounded-lg px-4 py-2 text-white">
            </div>
            <div>
              <label class="block text-sm text-gray-400 mb-2">Confirmar Contraseña</label>
              <input type="password" id="signup-password-confirm" required class="w-full bg-slate-700 rounded-lg px-4 py-2 text-white">
            </div>
            <div id="recaptcha-signup"></div>
            <div class="flex gap-3">
              <button type="submit" class="btn-primary flex-1">Crear Cuenta</button>
              <button type="button" id="cancel-signup" class="btn-secondary flex-1">Cancelar</button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modal);

    // Initialize CAPTCHA if available
    if (window.CustomCaptcha) {
      this.signupCaptcha = new window.CustomCaptcha('recaptcha-signup');
      this.signupCaptcha.render();
    }

    document.getElementById('supabase-signup-form').addEventListener('submit', async (e) => {
      e.preventDefault();

      if (this.signupCaptcha && !this.signupCaptcha.isVerified()) {
        window.toast?.error('Por favor completa la verificación de seguridad');
        return;
      }

      const name = document.getElementById('signup-name').value;
      const email = document.getElementById('signup-email').value;
      const password = document.getElementById('signup-password').value;
      const confirmPassword = document.getElementById('signup-password-confirm').value;

      if (password !== confirmPassword) {
        window.toast?.error('Las contraseñas no coinciden');
        return;
      }

      const result = await this.signUp(email, password, name);
      if (result.success) {
        document.getElementById('supabase-signup-modal').remove();
        if (window.settingsModalInstance) {
          window.settingsModalInstance.updateContent();
        }
      }
    });

    document.getElementById('cancel-signup').addEventListener('click', () => {
      document.getElementById('supabase-signup-modal').remove();
    });
  }

  /**
   * Mostrar modal de recuperar contraseña
   */
  showForgotPasswordModal() {
    const modal = `
      <div id="supabase-forgot-modal" class="fixed inset-0 bg-black/80 flex items-center justify-center z-[10001] p-4">
        <div class="bg-slate-800 rounded-xl p-6 max-w-md w-full">
          <h2 class="text-xl font-bold mb-4">Recuperar Contraseña</h2>
          <form id="supabase-forgot-form" class="space-y-4">
            <div>
              <label class="block text-sm text-gray-400 mb-2">Email</label>
              <input type="email" id="forgot-email" required class="w-full bg-slate-700 rounded-lg px-4 py-2 text-white">
            </div>
            <div class="flex gap-3">
              <button type="submit" class="btn-primary flex-1">Enviar</button>
              <button type="button" id="cancel-forgot" class="btn-secondary flex-1">Cancelar</button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modal);

    document.getElementById('supabase-forgot-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('forgot-email').value;
      const result = await this.resetPassword(email);
      if (result.success) {
        document.getElementById('supabase-forgot-modal').remove();
      }
    });

    document.getElementById('cancel-forgot').addEventListener('click', () => {
      document.getElementById('supabase-forgot-modal').remove();
    });
  }

  /**
   * Mostrar modal de cambiar contraseña
   */
  showChangePasswordModal() {
    const modal = `
      <div id="supabase-change-password-modal" class="fixed inset-0 bg-black/80 flex items-center justify-center z-[10001] p-4">
        <div class="bg-slate-800 rounded-xl p-6 max-w-md w-full">
          <h2 class="text-xl font-bold mb-4">Cambiar Contraseña</h2>
          <form id="supabase-change-password-form" class="space-y-4">
            <div>
              <label class="block text-sm text-gray-400 mb-2">Nueva Contraseña</label>
              <input type="password" id="new-password" required minlength="6" class="w-full bg-slate-700 rounded-lg px-4 py-2 text-white">
            </div>
            <div>
              <label class="block text-sm text-gray-400 mb-2">Confirmar Contraseña</label>
              <input type="password" id="new-password-confirm" required class="w-full bg-slate-700 rounded-lg px-4 py-2 text-white">
            </div>
            <div class="flex gap-3">
              <button type="submit" class="btn-primary flex-1">Cambiar</button>
              <button type="button" id="cancel-change" class="btn-secondary flex-1">Cancelar</button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modal);

    document.getElementById('supabase-change-password-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const newPassword = document.getElementById('new-password').value;
      const confirmPassword = document.getElementById('new-password-confirm').value;

      if (newPassword !== confirmPassword) {
        window.toast?.error('Las contraseñas no coinciden');
        return;
      }

      const result = await this.updatePassword(newPassword);
      if (result.success) {
        document.getElementById('supabase-change-password-modal').remove();
      }
    });

    document.getElementById('cancel-change').addEventListener('click', () => {
      document.getElementById('supabase-change-password-modal').remove();
    });
  }

  /**
   * Obtener información de plan para UI
   */
  getPlanInfo() {
    const profile = this.currentProfile;

    const plans = {
      free: {
        name: 'Gratuito',
        monthlyCredits: 10,
        features: ['ai_chat: NO', 'ai_tutor: NO', 'ai_game_master: NO'],
        icon: '🆓',
      },
      premium: {
        name: 'Premium',
        monthlyCredits: 500,
        features: ['ai_chat: SÍ', 'ai_tutor: SÍ', 'ai_game_master: NO'],
        icon: '⭐',
      },
      pro: {
        name: 'Pro',
        monthlyCredits: 2000,
        features: ['ai_chat: SÍ', 'ai_tutor: SÍ', 'ai_game_master: SÍ'],
        icon: '👑',
      },
    };

    const tier = profile?.subscription_tier || 'free';
    return plans[tier] || plans['free'];
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🔧 FIX #99: ERROR HANDLING Y RETRY LOGIC
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Ejecutar operación de Supabase con retry automático
   * @param {Function} operation - Función async que ejecuta la operación
   * @param {number} maxRetries - Máximo número de intentos (default: 3)
   * @param {number} delayMs - Delay entre intentos en ms (default: 1000)
   */
  async executeWithRetry(operation, maxRetries = 3, delayMs = 1000) {
    let lastError = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await operation();
        return result;
      } catch (error) {
        lastError = error;

        // Verificar si es un error recuperable
        if (this.isRecoverableError(error) && attempt < maxRetries) {
          logger.warn(`⚠️ Intento ${attempt}/${maxRetries} falló. Reintentando en ${delayMs}ms...`);
          await this.delay(delayMs);
          // Aumentar delay exponencialmente
          delayMs *= 2;
        } else {
          // Error no recuperable o último intento
          throw error;
        }
      }
    }

    throw lastError;
  }

  /**
   * Verificar si un error de Supabase es recuperable
   */
  isRecoverableError(error) {
    if (!error) return false;

    const recoverable = [
      'Network request failed',
      'Failed to fetch',
      'timeout',
      'ETIMEDOUT',
      'ECONNRESET',
      'ENOTFOUND',
      'Too many requests', // Rate limiting
      '429', // HTTP status
      '503', // Service unavailable
      '504', // Gateway timeout
    ];

    const errorMessage = error.message?.toLowerCase() || '';
    const errorCode = error.code?.toLowerCase() || '';

    return recoverable.some(pattern =>
      errorMessage.includes(pattern.toLowerCase()) ||
      errorCode.includes(pattern.toLowerCase())
    );
  }

  /**
   * Delay helper para retry logic
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Manejar errores de Supabase con categorización y logging
   */
  handleSupabaseError(error, context = 'unknown') {
    // Categorizar error
    const category = this.categorizeSupabaseError(error);

    // Log estructurado
    logger.group(`%c[AuthHelper] Error en ${context}`, 'color: #ef4444; font-weight: bold;');
    logger.debug('Categoría:', category);
    logger.debug('Mensaje:', error.message);
    logger.debug('Código:', error.code);
    logger.debug('Detalles:', error.details);
    logger.debug('Hint:', error.hint);
    logger.groupEnd();

    // Reportar a ErrorBoundary si está disponible
    if (window.errorBoundary) {
      window.errorBoundary.captureError(error, {
        context: `supabase_${context}`,
        category,
        filename: 'auth-helper.js',
        supabaseCode: error.code,
        supabaseDetails: error.details
      });
    }

    // Notificar al usuario si es necesario
    if (category === 'fatal' || category === 'user_action_required') {
      this.notifyUserOfError(error, category, context);
    }

    return category;
  }

  /**
   * Categorizar error de Supabase
   */
  categorizeSupabaseError(error) {
    if (!error) return 'unknown';

    const message = error.message?.toLowerCase() || '';
    const code = error.code?.toLowerCase() || '';

    // Errores de red (recuperables)
    if (this.isRecoverableError(error)) {
      return 'network';
    }

    // Errores de autenticación
    if (code.includes('auth') || message.includes('authentication')) {
      return 'auth';
    }

    // Errores de permisos
    if (code === 'pgrst301' || message.includes('permission') || message.includes('denied')) {
      return 'permission';
    }

    // Errores de validación
    if (code === '23505' || message.includes('unique') || message.includes('duplicate')) {
      return 'validation';
    }

    // Errores de sesión expirada
    if (code.includes('refresh_token') || message.includes('expired')) {
      return 'session_expired';
    }

    // Email no confirmado
    if (message.includes('email not confirmed')) {
      return 'user_action_required';
    }

    // Créditos insuficientes
    if (message.includes('insufficient') || message.includes('insuficientes')) {
      return 'insufficient_credits';
    }

    // Error fatal (requiere intervención)
    return 'fatal';
  }

  /**
   * Notificar al usuario sobre el error
   */
  notifyUserOfError(error, category, context) {
    const messages = {
      network: 'Problema de conexión. Por favor, verifica tu internet.',
      auth: 'Error de autenticación. Por favor, vuelve a iniciar sesión.',
      permission: 'No tienes permisos para realizar esta acción.',
      validation: 'Los datos ingresados no son válidos.',
      session_expired: 'Tu sesión ha expirado. Por favor, vuelve a iniciar sesión.',
      user_action_required: 'Por favor, confirma tu email antes de continuar.',
      insufficient_credits: 'Créditos insuficientes. Por favor, actualiza tu plan.',
      fatal: 'Ha ocurrido un error. Por favor, intenta de nuevo más tarde.'
    };

    const userMessage = messages[category] || messages.fatal;

    // Mostrar toast si está disponible
    if (window.toast) {
      window.toast.error(userMessage);
    } else {
      logger.error('❌', userMessage);
    }

    // Para errores de sesión expirada, cerrar sesión automáticamente
    if (category === 'session_expired') {
      setTimeout(() => {
        this.signOut();
      }, 2000);
    }
  }

  /**
   * Obtener estadísticas de errores (para debugging)
   */
  getErrorStats() {
    if (window.errorBoundary) {
      const allErrors = window.errorBoundary.getErrorLog();
      const supabaseErrors = allErrors.filter(e =>
        e.context?.includes('supabase') || e.filename?.includes('auth-helper')
      );

      return {
        total: supabaseErrors.length,
        byCategory: this.groupBy(supabaseErrors, e => e.category),
        recent: supabaseErrors.slice(-5)
      };
    }

    return { total: 0, byCategory: {}, recent: [] };
  }

  /**
   * Helper para agrupar array por propiedad
   */
  groupBy(array, keyFn) {
    return array.reduce((result, item) => {
      const key = keyFn(item);
      if (!result[key]) result[key] = 0;
      result[key]++;
      return result;
    }, {});
  }
}

// Crear instancia global
window.authHelper = new AuthHelper();

// Alias para compatibilidad con código existente que usa supabaseAuthHelper
window.supabaseAuthHelper = window.authHelper;

// 🔧 v2.9.391: Función de debug mejorada (disponible siempre, no solo en localhost)
window.debugAuth = () => {
  const profile = window.authHelper.currentProfile;
  console.log('═══════════════════════════════════════════');
  console.log('🔐 AUTH DEBUG');
  console.log('═══════════════════════════════════════════');
  console.log('Current User:', window.authHelper.currentUser?.email);
  console.log('Is Authenticated:', window.authHelper.isAuthenticated());
  console.log('═══════════════════════════════════════════');
  console.log('📋 PROFILE');
  console.log('═══════════════════════════════════════════');
  console.log('Subscription Tier:', profile?.subscription_tier);
  console.log('Role:', profile?.role);
  console.log('Token Balance (purchased):', profile?.token_balance);
  console.log('AI Credits Remaining (monthly):', profile?.ai_credits_remaining);
  console.log('Total Tokens:', window.authHelper.getTokenBalance());
  console.log('═══════════════════════════════════════════');
  console.log('🎯 FEATURES CHECK');
  console.log('═══════════════════════════════════════════');
  console.log('ai_chat:', window.authHelper.hasFeature('ai_chat'));
  console.log('ai_tutor:', window.authHelper.hasFeature('ai_tutor'));
  console.log('ai_content_adapter:', window.authHelper.hasFeature('ai_content_adapter'));
  console.log('elevenlabs_tts:', window.authHelper.hasFeature('elevenlabs_tts'));
  console.log('═══════════════════════════════════════════');
  console.log('📊 FULL PROFILE:', profile);
  console.log('═══════════════════════════════════════════');
  return profile;
};

logger.debug('🔐 AuthHelper loaded. Use window.authHelper to access authentication.');
