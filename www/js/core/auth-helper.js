/**
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
    this.authStateListeners = [];

    this.init();
  }

  /**
   * Inicializar Supabase y listeners
   */
  async init() {
    // Esperar a que Supabase esté disponible
    if (typeof window.supabase !== 'undefined') {
      this.supabase = window.supabase;
      await this.loadSession();
      this.setupAuthListener();
      console.log('🔐 AuthHelper inicializado');
    } else {
      console.warn('⚠️ Supabase no disponible. AuthHelper esperando...');
      setTimeout(() => this.init(), 1000);
    }
  }

  /**
   * Cargar sesión actual
   */
  async loadSession() {
    try {
      const { data: { session } } = await this.supabase.auth.getSession();

      if (session) {
        this.currentUser = session.user;
        await this.loadUserProfile();
        this.notifyAuthStateChange('signed_in', this.currentUser);
      }
    } catch (error) {
      console.error('Error loading session:', error);
    }
  }

  /**
   * Escuchar cambios de autenticación
   */
  setupAuthListener() {
    this.supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔔 Auth state changed:', event);

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        this.currentUser = session?.user || null;
        await this.loadUserProfile();
        this.notifyAuthStateChange('signed_in', this.currentUser);
      } else if (event === 'SIGNED_OUT') {
        this.currentUser = null;
        this.currentProfile = null;
        this.notifyAuthStateChange('signed_out', null);
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
      console.log('👤 Perfil cargado:', data);

      // Verificar si necesita reset de créditos
      this.checkCreditsReset();

      return data;
    } catch (error) {
      console.error('Error loading profile:', error);
      return null;
    }
  }

  /**
   * Verificar si necesita resetear créditos mensuales
   */
  async checkCreditsReset() {
    if (!this.currentProfile) return;

    const resetDate = new Date(this.currentProfile.ai_credits_reset_date);
    const now = new Date();

    if (now >= resetDate) {
      console.log('🔄 Reseteando créditos mensuales...');

      await this.supabase
        .from('profiles')
        .update({
          ai_credits_remaining: this.currentProfile.ai_credits_total,
          ai_credits_reset_date: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // +30 días
        })
        .eq('id', this.currentUser.id);

      await this.loadUserProfile();
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

      console.log('✅ Usuario registrado:', data);

      // Mostrar mensaje de confirmación de email
      this.showEmailConfirmationMessage(email);

      return { success: true, data };
    } catch (error) {
      console.error('❌ Error en registro:', error);
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

      console.log('✅ Sesión iniciada:', data);
      return { success: true, data };
    } catch (error) {
      console.error('❌ Error al iniciar sesión:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Iniciar sesión con Google
   */
  async signInWithGoogle() {
    try {
      const { data, error } = await this.supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      });

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('❌ Error con Google:', error);
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

      console.log('👋 Sesión cerrada');
      return { success: true };
    } catch (error) {
      console.error('❌ Error al cerrar sesión:', error);
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
      console.error('❌ Error al recuperar contraseña:', error);
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
      console.error('❌ Error al actualizar contraseña:', error);
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
      console.log('✅ Perfil actualizado:', data);

      return { success: true, data };
    } catch (error) {
      console.error('❌ Error al actualizar perfil:', error);
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
      console.error('❌ Error al subir avatar:', error);
      return { success: false, error: error.message };
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SISTEMA DE PERMISOS Y SUSCRIPCIONES
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Verificar si el usuario tiene una feature habilitada
   */
  hasFeature(featureName) {
    if (!this.currentProfile) return false;
    return this.currentProfile.features?.[featureName] || false;
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

      // Consumir créditos usando la función de Supabase
      const { data, error } = await this.supabase.rpc('consume_ai_credits', {
        p_user_id: this.currentUser.id,
        p_credits: amount
      });

      if (error) throw error;

      if (!data) {
        throw new Error('No se pudieron consumir los créditos');
      }

      // Registrar uso en ai_usage
      await this.supabase.from('ai_usage').insert({
        user_id: this.currentUser.id,
        provider,
        model,
        context,
        tokens_total: tokensUsed,
        cost_usd: this.estimateCost(tokensUsed, provider, model)
      });

      // Recargar perfil
      await this.loadUserProfile();

      return { success: true, remaining: this.getAICredits() };
    } catch (error) {
      console.error('❌ Error al consumir créditos:', error);
      return { success: false, error: error.message };
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
        console.error('Error in auth state listener:', error);
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
    // Si existe el sistema de notificaciones de la app, usarlo
    if (typeof window.showNotification === 'function') {
      window.showNotification(message, type);
      return;
    }

    // Fallback: alert simple
    console.log(`[${type.toUpperCase()}] ${message}`);
    alert(message);
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
}

// Crear instancia global
window.authHelper = new AuthHelper();

// Exponer para debugging
if (window.location.hostname === 'localhost') {
  window.debugAuth = () => {
    console.log('Current User:', window.authHelper.currentUser);
    console.log('Current Profile:', window.authHelper.currentProfile);
    console.log('Is Authenticated:', window.authHelper.isAuthenticated());
    console.log('Subscription Tier:', window.authHelper.getSubscriptionTier());
    console.log('AI Credits:', window.authHelper.getAICredits());
    console.log('Features:', window.authHelper.currentProfile?.features);
  };
}

console.log('🔐 AuthHelper loaded. Use window.authHelper to access authentication.');
