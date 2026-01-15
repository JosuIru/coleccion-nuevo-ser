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
      // Log reducido para producción (sin datos sensibles)
      logger.debug('👤 Perfil cargado para:', data?.email?.split('@')[0] || 'usuario');

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
   */
  hasFeature(featureName) {
    if (!this.currentProfile) return false;

    const tier = (this.currentProfile.subscription_tier || 'free').toLowerCase();

    // Usar PLANS_CONFIG para verificar features según plan
    if (window.PLANS_CONFIG) {
      return window.PLANS_CONFIG.hasFeature(tier, featureName);
    }

    // Fallback: premium/pro tienen todas las features principales
    if (['premium', 'pro'].includes(tier)) {
      const premiumFeatures = ['ai_chat', 'ai_tutor', 'ai_content_adapter', 'elevenlabs_tts', 'advanced_analytics'];
      return premiumFeatures.includes(featureName);
    }

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
    // Costos por 1K tokens (actualizar según pricing real)
    const costs = {
      'claude-sonnet-4': 0.003,
      'claude-3-5-sonnet': 0.003,
      'gpt-4o': 0.005,
      'gpt-4o-mini': 0.0005,
      'gemini-2.0-flash': 0.001
    };

    const costPer1K = costs[model] || 0.002;
    return ((tokens / 1000) * costPer1K).toFixed(6);
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
      return `
        <div class="space-y-4">
          <p class="text-gray-400">Inicia sesión para sincronizar tus datos en la nube</p>
          <div class="flex flex-col gap-3">
            <button id="supabase-show-login" class="btn-primary">Iniciar Sesión</button>
            <button id="supabase-show-signup" class="btn-secondary">Crear Cuenta</button>
            <button id="supabase-signin-anonymous" class="btn-secondary text-sm">Continuar sin cuenta</button>
          </div>
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
    const modal = `
      <div id="supabase-login-modal" class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
        <div class="bg-slate-800 rounded-xl p-6 max-w-md w-full">
          <h2 class="text-xl font-bold mb-4">Iniciar Sesión</h2>
          <form id="supabase-login-form" class="space-y-4">
            <div>
              <label class="block text-sm text-gray-400 mb-2">Email</label>
              <input type="email" id="login-email" required class="w-full bg-slate-700 rounded-lg px-4 py-2 text-white">
            </div>
            <div>
              <label class="block text-sm text-gray-400 mb-2">Contraseña</label>
              <input type="password" id="login-password" required class="w-full bg-slate-700 rounded-lg px-4 py-2 text-white">
            </div>
            <div class="flex gap-3">
              <button type="submit" class="btn-primary flex-1">Entrar</button>
              <button type="button" id="cancel-login" class="btn-secondary flex-1">Cancelar</button>
            </div>
            <button type="button" id="forgot-password" class="text-sm text-blue-400 hover:underline">¿Olvidaste tu contraseña?</button>
          </form>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modal);

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
      <div id="supabase-signup-modal" class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
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
      <div id="supabase-forgot-modal" class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
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
      <div id="supabase-change-password-modal" class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
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

// Exponer para debugging
if (window.location.hostname === 'localhost') {
  window.debugAuth = () => {
    logger.debug('Current User:', window.authHelper.currentUser);
    logger.debug('Current Profile:', window.authHelper.currentProfile);
    logger.debug('Is Authenticated:', window.authHelper.isAuthenticated());
    logger.debug('Subscription Tier:', window.authHelper.getSubscriptionTier());
    logger.debug('AI Credits:', window.authHelper.getAICredits());
    logger.debug('Features:', window.authHelper.currentProfile?.features);
  };
}

logger.debug('🔐 AuthHelper loaded. Use window.authHelper to access authentication.');
