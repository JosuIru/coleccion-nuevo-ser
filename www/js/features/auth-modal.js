/**
// 🔧 FIX v2.9.198: Migrated console.log to logger
 * AUTH MODAL - UI de Autenticación
 * Modal moderno para login, registro y gestión de cuenta
 *
 * @version 1.0.0
 */

class AuthModal {
  constructor() {
    this.authHelper = window.authHelper;
    this.currentView = 'login'; // 'login', 'signup', 'reset', 'profile'
    this.modal = null;
    this.escapeHandler = null; // Handler for escape key
    this.previousActiveElement = null; // For focus trap

    // 🔧 FIX #86: Usar EventManager para prevenir memory leaks
    this.eventManager = new window.EventManager();

    this.init();
  }

  /**
   * Escape HTML to prevent XSS attacks
   */
  escapeHTML(str) {
    if (!str) return '';
    const escapeMap = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;'
    };
    return String(str).replace(/[&<>"'/]/g, char => escapeMap[char]);
  }

  /**
   * Validate URL to prevent javascript: protocol XSS
   */
  sanitizeURL(url) {
    if (!url) return '';
    try {
      const parsed = new URL(url);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return '';
      }
      return url;
    } catch {
      return '';
    }
  }

  async init() {
    // 🔧 FIX #87: Usar DependencyInjector en lugar de setTimeout
    try {
      this.authHelper = await window.dependencyInjector.get('authHelper', 10000);

      // Escuchar cambios de autenticación
      this.authHelper.onAuthStateChange((event, user) => {
        if (event === 'signed_in') {
          this.closeModal();
          this.showWelcomeMessage(user);
        } else if (event === 'signed_out') {
          this.closeModal();
        }
      });

      logger.debug('✅ AuthModal inicializado');
    } catch (error) {
      logger.error('[AuthModal] Error al cargar authHelper:', error);
      // Fallback: intentar con setTimeout como antes
      if (!this.authHelper && window.authHelper) {
        this.authHelper = window.authHelper;
        this.init();
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MOSTRAR MODALES
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Mostrar modal de login
   */
  showLoginModal() {
    this.currentView = 'login';
    this.renderModal();
  }

  /**
   * Mostrar modal de registro
   */
  showSignupModal() {
    this.currentView = 'signup';
    this.renderModal();
  }

  /**
   * Mostrar modal de perfil
   */
  showProfileModal() {
    if (!this.authHelper.isAuthenticated()) {
      this.showLoginModal();
      return;
    }

    this.currentView = 'profile';
    this.renderModal();
  }

  /**
   * Mostrar modal de recuperación de contraseña
   */
  showResetPasswordModal() {
    this.currentView = 'reset';
    this.renderModal();
  }

  /**
   * 🔧 FIX v2.9.236: Método show() genérico para compatibilidad
   * @param {string} view - 'login' | 'signup' | 'reset' | 'profile'
   */
  show(view = 'login') {
    switch (view) {
      case 'signup':
      case 'register':
        this.showSignupModal();
        break;
      case 'reset':
      case 'forgot':
        this.showResetPasswordModal();
        break;
      case 'profile':
        this.showProfileModal();
        break;
      case 'login':
      default:
        this.showLoginModal();
        break;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDERIZADO
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Renderizar modal según la vista actual
   */
  renderModal() {
    // Cerrar modal existente si hay uno
    this.closeModal();

    // Guardar elemento activo para restaurar después
    this.previousActiveElement = document.activeElement;

    // Crear modal con accesibilidad
    this.modal = document.createElement('div');
    this.modal.className = 'auth-modal-overlay fade-in';
    this.modal.setAttribute('role', 'dialog');
    this.modal.setAttribute('aria-modal', 'true');
    this.modal.setAttribute('aria-labelledby', 'auth-modal-title');
    this.modal.innerHTML = `
      <div class="auth-modal-container scale-in">
        <button class="auth-modal-close" onclick="window.authModal.closeModal()" aria-label="Cerrar modal de autenticación">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
            <path d="M18 6L6 18M6 6l12 12" stroke-width="2"/>
          </svg>
        </button>

        <div class="auth-modal-content">
          ${this.getViewHTML()}
        </div>
      </div>
    `;

    document.body.appendChild(this.modal);

    // Bloquear scroll del body
    document.body.style.overflow = 'hidden';

    // Setup event listeners
    this.setupEventListeners();

    // Focus trap - enfocar primer elemento interactivo
    this.setupFocusTrap();
  }

  /**
   * Configurar focus trap para accesibilidad
   */
  setupFocusTrap() {
    const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const focusableElements = this.modal.querySelectorAll(focusableSelector);
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    // Enfocar primer elemento
    if (firstFocusable) {
      setTimeout(() => firstFocusable.focus(), 100);
    }

    // 🔧 FIX #86: Usar EventManager para manejar Tab
    this.eventManager.addEventListener(this.modal, 'keydown', (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable.focus();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable.focus();
        }
      }
    });
  }

  /**
   * Obtener HTML según la vista actual
   */
  getViewHTML() {
    switch (this.currentView) {
      case 'login':
        return this.getLoginHTML();
      case 'signup':
        return this.getSignupHTML();
      case 'reset':
        return this.getResetHTML();
      case 'profile':
        return this.getProfileHTML();
      default:
        return this.getLoginHTML();
    }
  }

  /**
   * HTML de login
   */
  getLoginHTML() {
    return `
      <div class="auth-header">
        <div class="auth-icon">🔐</div>
        <h2 id="auth-modal-title">Iniciar Sesión</h2>
        <p>Accede a tu cuenta para sincronizar tu progreso</p>
      </div>

      <form id="login-form" class="auth-form">
        <div class="form-group">
          <label for="login-email">Email</label>
          <input
            type="email"
            id="login-email"
            name="email"
            placeholder="tu@email.com"
            required
            autocomplete="email"
          />
        </div>

        <div class="form-group">
          <label for="login-password">Contraseña</label>
          <input
            type="password"
            id="login-password"
            name="password"
            placeholder="••••••••"
            required
            autocomplete="current-password"
          />
        </div>

        <div class="form-actions">
          <button type="button" class="link-button" onclick="window.authModal.currentView = 'reset'; window.authModal.renderModal()">
            ¿Olvidaste tu contraseña?
          </button>
        </div>

        <button type="submit" class="btn-primary auth-submit">
          Iniciar Sesión
        </button>

        <div class="auth-divider">
          <span>o continuar con</span>
        </div>

        <button type="button" class="btn-oauth google" onclick="window.authModal.handleGoogleLogin()">
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
            <path fill="#FBBC05" d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
          </svg>
          Continuar con Google
        </button>

        <div class="auth-footer">
          ¿No tienes cuenta?
          <button type="button" class="link-button" onclick="window.authModal.currentView = 'signup'; window.authModal.renderModal()">
            Regístrate gratis
          </button>
        </div>
      </form>
    `;
  }

  /**
   * HTML de registro
   */
  getSignupHTML() {
    return `
      <div class="auth-header">
        <div class="auth-icon">✨</div>
        <h2 id="auth-modal-title">Crear Cuenta</h2>
        <p>Únete y comienza tu viaje de transformación</p>
      </div>

      <form id="signup-form" class="auth-form">
        <div class="form-group">
          <label for="signup-name">Nombre completo</label>
          <input
            type="text"
            id="signup-name"
            name="fullName"
            placeholder="Tu nombre"
            required
            autocomplete="name"
          />
        </div>

        <div class="form-group">
          <label for="signup-email">Email</label>
          <input
            type="email"
            id="signup-email"
            name="email"
            placeholder="tu@email.com"
            required
            autocomplete="email"
          />
        </div>

        <div class="form-group">
          <label for="signup-password">Contraseña</label>
          <input
            type="password"
            id="signup-password"
            name="password"
            placeholder="Mínimo 8 caracteres"
            required
            minlength="8"
            autocomplete="new-password"
          />
          <small class="form-hint">Mínimo 8 caracteres, combina letras y números</small>
        </div>

        <div class="form-group checkbox-group">
          <label class="checkbox-label">
            <input type="checkbox" id="terms-checkbox" required />
            <span>
              Acepto los <a href="/legal/terms.html" target="_blank" rel="noopener noreferrer">términos y condiciones</a>
              y la <a href="/legal/privacy.html" target="_blank" rel="noopener noreferrer">política de privacidad</a>
            </span>
          </label>
        </div>

        <button type="submit" class="btn-primary auth-submit">
          Crear Cuenta Gratis
        </button>

        <div class="auth-divider">
          <span>o continuar con</span>
        </div>

        <button type="button" class="btn-oauth google" onclick="window.authModal.handleGoogleLogin()">
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
            <path fill="#FBBC05" d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
          </svg>
          Continuar con Google
        </button>

        <div class="auth-footer">
          ¿Ya tienes cuenta?
          <button type="button" class="link-button" onclick="window.authModal.currentView = 'login'; window.authModal.renderModal()">
            Inicia sesión
          </button>
        </div>
      </form>
    `;
  }

  /**
   * HTML de recuperación de contraseña
   */
  getResetHTML() {
    return `
      <div class="auth-header">
        <div class="auth-icon">🔑</div>
        <h2 id="auth-modal-title">Recuperar Contraseña</h2>
        <p>Te enviaremos un link para restablecer tu contraseña</p>
      </div>

      <form id="reset-form" class="auth-form">
        <div class="form-group">
          <label for="reset-email">Email</label>
          <input
            type="email"
            id="reset-email"
            name="email"
            placeholder="tu@email.com"
            required
            autocomplete="email"
          />
        </div>

        <button type="submit" class="btn-primary auth-submit">
          Enviar Link de Recuperación
        </button>

        <div class="auth-footer">
          <button type="button" class="link-button" onclick="window.authModal.currentView = 'login'; window.authModal.renderModal()">
            ← Volver al login
          </button>
        </div>
      </form>
    `;
  }

  /**
   * HTML de perfil de usuario mejorado con Frankenstein Lab
   */
  getProfileHTML() {
    const profile = this.authHelper.getProfile();
    const user = this.authHelper.getUser();

    if (!profile) return '<h2 id="auth-modal-title">Cargando perfil...</h2>';

    const tier = this.escapeHTML(profile.subscription_tier) || 'free';
    const credits = Number(profile.ai_credits_remaining) || 0;
    const totalCredits = Number(profile.ai_credits_total) || 1;
    const creditsPercentage = Math.min(100, (credits / totalCredits) * 100);

    // Sanitizar datos de usuario para prevenir XSS
    const safeFullName = this.escapeHTML(profile.full_name) || 'Usuario';
    const safeEmail = this.escapeHTML(user?.email) || '';
    const safeAvatarUrl = this.sanitizeURL(profile.avatar_url);
    const safeInitial = safeFullName.charAt(0) || 'U';

    // Obtener estadísticas de Frankenstein Lab
    const frankensteinStats = this.getFrankensteinStats();

    return `
      <div class="profile-header">
        <div class="profile-avatar relative">
          ${safeAvatarUrl
            ? `<img src="${safeAvatarUrl}" alt="${safeFullName}" class="w-20 h-20 rounded-full object-cover" />`
            : `<div class="avatar-placeholder w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-3xl font-bold text-white">${safeInitial}</div>`
          }
          <button onclick="window.authModal.showEditProfile()"
                  class="absolute -bottom-1 -right-1 bg-slate-700 hover:bg-slate-600 p-1.5 rounded-full text-xs transition"
                  title="Editar perfil">
            ✏️
          </button>
        </div>
        <div class="profile-info">
          <h2 id="auth-modal-title">${safeFullName}</h2>
          <p class="profile-email">${safeEmail}</p>
          <div class="profile-tier ${tier}">
            ${tier === 'free' ? '🆓' : tier === 'premium' ? '⭐' : '👑'} ${tier.toUpperCase()}
          </div>
        </div>
      </div>

      <!-- Frankenstein Lab Stats -->
      ${frankensteinStats.totalBeings > 0 ? `
        <div class="frankenstein-stats mt-4 p-4 bg-gradient-to-br from-purple-900/30 to-cyan-900/30 rounded-xl border border-purple-500/30">
          <div class="flex items-center gap-2 mb-3">
            <span class="text-xl">🧬</span>
            <h3 class="font-bold text-purple-300">Frankenstein Lab</h3>
          </div>
          <div class="grid grid-cols-3 gap-3 text-center">
            <div>
              <div class="text-2xl font-bold text-cyan-400">${frankensteinStats.totalBeings}</div>
              <div class="text-xs text-slate-400">Seres</div>
            </div>
            <div>
              <div class="text-2xl font-bold text-green-400">${frankensteinStats.totalMissions}</div>
              <div class="text-xs text-slate-400">Misiones</div>
            </div>
            <div>
              <div class="text-2xl font-bold text-amber-400">${frankensteinStats.highestLevel}</div>
              <div class="text-xs text-slate-400">Nivel Max</div>
            </div>
          </div>
          ${frankensteinStats.bestBeing ? `
            <div class="mt-3 pt-3 border-t border-purple-500/30">
              <div class="text-xs text-slate-400 mb-1">Mejor Ser</div>
              <div class="flex items-center gap-2">
                <span class="text-lg">${frankensteinStats.bestBeing.specialty?.icon || '🧬'}</span>
                <span class="font-medium">${this.escapeHTML(frankensteinStats.bestBeing.name)}</span>
                <span class="text-xs text-amber-400 ml-auto">Poder: ${Math.round(frankensteinStats.bestBeing.totalPower)}</span>
              </div>
            </div>
          ` : ''}
        </div>
      ` : `
        <div class="frankenstein-promo mt-4 p-4 bg-slate-800/50 rounded-xl border border-slate-600/50 text-center">
          <span class="text-3xl">🧬</span>
          <p class="text-sm text-slate-400 mt-2">Crea tu primer Ser Transformador en el</p>
          <a href="lab.html" class="text-purple-400 hover:text-purple-300 font-medium">Frankenstein Lab</a>
        </div>
      `}

      <div class="profile-stats mt-4">
        <div class="stat-card">
          <div class="stat-label">Créditos IA</div>
          <div class="stat-value">${credits} / ${totalCredits}</div>
          <div class="stat-bar">
            <div class="stat-bar-fill" style="width: ${creditsPercentage}%"></div>
          </div>
        </div>

        ${this.authHelper.isSubscriptionActive() ? `
          <div class="stat-card">
            <div class="stat-label">Renovación</div>
            <div class="stat-value">
              ${this.authHelper.getDaysUntilRenewal()} días
            </div>
          </div>
        ` : ''}
      </div>

      <div class="profile-actions mt-4 space-y-2">
        <button class="btn-secondary w-full" onclick="window.authModal.showEditProfile()">
          ✏️ Editar Perfil
        </button>

        ${tier === 'free' ? `
          <button class="btn-upgrade w-full" onclick="window.authModal.showUpgradeToPremium()">
            ✨ Actualizar a Premium
          </button>
        ` : ''}

        <div class="flex gap-2">
          <button class="btn-secondary flex-1" onclick="window.authModal.showSyncSettings()">
            🔄 Sincronización
          </button>
          <button class="btn-secondary flex-1 text-red-400 hover:text-red-300" onclick="window.authModal.handleSignOut()">
            🚪 Cerrar Sesión
          </button>
        </div>
      </div>

      <div class="profile-features mt-4">
        <h3>Features Disponibles</h3>
        <div class="features-list">
          ${this.getFeaturesListHTML(profile.features)}
        </div>
      </div>
    `;
  }

  /**
   * Obtener estadísticas de Frankenstein Lab
   */
  getFrankensteinStats() {
    const beings = window.frankensteinSync?.getLocalBeings() || [];

    if (beings.length === 0) {
      return { totalBeings: 0, totalMissions: 0, highestLevel: 0, bestBeing: null };
    }

    let totalMissions = 0;
    let highestLevel = 0;
    let bestBeing = null;
    let highestPower = 0;

    beings.forEach(being => {
      totalMissions += being.stats?.missionsCompleted || 0;
      if ((being.level || 1) > highestLevel) {
        highestLevel = being.level || 1;
      }
      if ((being.totalPower || 0) > highestPower) {
        highestPower = being.totalPower || 0;
        bestBeing = being;
      }
    });

    return {
      totalBeings: beings.length,
      totalMissions,
      highestLevel,
      bestBeing
    };
  }

  /**
   * Mostrar modal de edición de perfil
   */
  showEditProfile() {
    const profile = this.authHelper.getProfile();
    if (!profile) return;

    const safeFullName = this.escapeHTML(profile.full_name) || '';
    const safeAvatarUrl = this.sanitizeURL(profile.avatar_url);

    const editContent = `
      <div class="auth-header">
        <div class="auth-icon">✏️</div>
        <h2 id="auth-modal-title">Editar Perfil</h2>
        <p>Actualiza tu información personal</p>
      </div>

      <form id="edit-profile-form" class="auth-form">
        <div class="form-group">
          <label for="edit-name">Nombre completo</label>
          <input
            type="text"
            id="edit-name"
            name="fullName"
            value="${safeFullName}"
            placeholder="Tu nombre"
            required
            autocomplete="name"
          />
        </div>

        <div class="form-group">
          <label>Foto de perfil</label>
          <div class="flex items-center gap-4">
            <div class="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden">
              ${safeAvatarUrl
                ? `<img src="${safeAvatarUrl}" alt="Avatar" class="w-full h-full object-cover" id="avatar-preview" />`
                : `<span class="text-2xl" id="avatar-preview">${safeFullName.charAt(0) || '?'}</span>`
              }
            </div>
            <div class="flex-1">
              <input
                type="url"
                id="edit-avatar"
                name="avatarUrl"
                value="${safeAvatarUrl}"
                placeholder="URL de imagen (opcional)"
                class="w-full"
              />
              <small class="text-slate-400 text-xs">Pega la URL de una imagen</small>
            </div>
          </div>
        </div>

        <button type="submit" class="btn-primary auth-submit">
          Guardar Cambios
        </button>

        <div class="auth-footer">
          <button type="button" class="link-button" onclick="window.authModal.currentView = 'profile'; window.authModal.renderModal()">
            ← Volver al perfil
          </button>
        </div>
      </form>
    `;

    // Actualizar contenido del modal
    const contentDiv = this.modal?.querySelector('.auth-modal-content');
    if (contentDiv) {
      contentDiv.innerHTML = editContent;
      this.setupEditProfileListeners();
    }
  }

  /**
   * Configurar listeners para edición de perfil
   */
  setupEditProfileListeners() {
    const form = document.getElementById('edit-profile-form');
    if (form) {
      // 🔧 FIX #86: Usar EventManager
      this.eventManager.addEventListener(form, 'submit', (e) => this.handleEditProfile(e));
    }

    // Preview de avatar
    const avatarInput = document.getElementById('edit-avatar');
    if (avatarInput) {
      // 🔧 FIX #86: Usar EventManager
      this.eventManager.addEventListener(avatarInput, 'input', (e) => {
        const preview = document.getElementById('avatar-preview');
        const url = e.target.value.trim();
        if (preview && url) {
          if (preview.tagName === 'IMG') {
            preview.src = url;
          } else {
            preview.outerHTML = `<img src="${this.sanitizeURL(url)}" alt="Avatar" class="w-full h-full object-cover" id="avatar-preview" />`;
          }
        }
      });
    }
  }

  /**
   * Manejar edición de perfil
   */
  async handleEditProfile(e) {
    e.preventDefault();

    const form = e.target;
    const fullName = form.fullName.value.trim();
    const avatarUrl = form.avatarUrl?.value.trim() || '';

    const submitBtn = form.querySelector('.auth-submit');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Guardando...';

    try {
      // Actualizar en Supabase via UserService o AuthHelper
      const result = await this.authHelper.updateProfile({
        full_name: fullName,
        avatar_url: avatarUrl ? this.sanitizeURL(avatarUrl) : null
      });

      if (result) {
        this.showSuccess('Perfil actualizado correctamente');
        // Recargar perfil
        await this.authHelper.fetchProfile();
        // Volver a la vista de perfil
        this.currentView = 'profile';
        this.renderModal();
      } else {
        throw new Error('No se pudo actualizar el perfil');
      }
    } catch (error) {
      logger.error('Error actualizando perfil:', error);
      this.showError('Error al actualizar perfil');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Guardar Cambios';
    }
  }

  /**
   * Mostrar configuración de sincronización
   */
  showSyncSettings() {
    const syncStatus = window.frankensteinSync?.getSyncStatus() || {};
    const lastSync = syncStatus.lastSyncTime
      ? new Date(syncStatus.lastSyncTime).toLocaleString('es-ES')
      : 'Nunca';

    const syncContent = `
      <div class="auth-header">
        <div class="auth-icon">🔄</div>
        <h2 id="auth-modal-title">Sincronización</h2>
        <p>Gestiona la sincronización de tus datos</p>
      </div>

      <div class="space-y-4">
        <!-- Estado de sincronización -->
        <div class="p-4 bg-slate-800/50 rounded-xl">
          <div class="flex items-center justify-between mb-2">
            <span class="text-slate-400">Estado</span>
            <span class="${syncStatus.isAuthenticated ? 'text-green-400' : 'text-yellow-400'}">
              ${syncStatus.isAuthenticated ? '✅ Conectado' : '⚠️ Solo local'}
            </span>
          </div>
          <div class="flex items-center justify-between mb-2">
            <span class="text-slate-400">Última sincronización</span>
            <span class="text-slate-300">${lastSync}</span>
          </div>
          <div class="flex items-center justify-between mb-2">
            <span class="text-slate-400">Seres guardados</span>
            <span class="text-cyan-400">${syncStatus.localBeingsCount || 0}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-slate-400">Tiempo real</span>
            <span class="${syncStatus.realtimeConnected ? 'text-green-400' : 'text-slate-500'}">
              ${syncStatus.realtimeConnected ? '🟢 Activo' : '⚫ Inactivo'}
            </span>
          </div>
        </div>

        <!-- Acciones de sincronización -->
        <div class="space-y-2">
          <button onclick="window.authModal.handleForceSync()" class="btn-secondary w-full flex items-center justify-center gap-2">
            🔄 Sincronizar Ahora
          </button>

          <button onclick="window.authModal.handleExportData()" class="btn-secondary w-full flex items-center justify-center gap-2">
            📤 Exportar Datos
          </button>

          <label class="btn-secondary w-full flex items-center justify-center gap-2 cursor-pointer">
            📥 Importar Datos
            <input type="file" accept=".json" class="hidden" onchange="window.authModal.handleImportData(event)" />
          </label>
        </div>

        <div class="auth-footer">
          <button type="button" class="link-button" onclick="window.authModal.currentView = 'profile'; window.authModal.renderModal()">
            ← Volver al perfil
          </button>
        </div>
      </div>
    `;

    const contentDiv = this.modal?.querySelector('.auth-modal-content');
    if (contentDiv) {
      contentDiv.innerHTML = syncContent;
    }
  }

  /**
   * Forzar sincronización
   */
  async handleForceSync() {
    this.showSuccess('Sincronizando...');
    const result = await window.frankensteinSync?.forceSync();
    if (result) {
      this.showSuccess('Sincronización completada');
      this.showSyncSettings(); // Refrescar vista
    }
  }

  /**
   * Exportar datos
   */
  handleExportData() {
    const data = window.frankensteinSync?.exportBeings();
    if (!data) {
      this.showError('No hay datos para exportar');
      return;
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `frankenstein-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    this.showSuccess('Datos exportados correctamente');
  }

  /**
   * Importar datos
   */
  handleImportData(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        window.frankensteinSync?.importBeings(data);
        this.showSyncSettings(); // Refrescar vista
      } catch (error) {
        this.showError('Archivo inválido');
      }
    };
    reader.readAsText(file);
  }

  /**
   * Obtener HTML de lista de features
   */
  getFeaturesListHTML(features) {
    const featureLabels = {
      ai_chat: 'Chat IA sobre libros',
      ai_tutor: 'Tutor IA personalizado',
      ai_game_master: 'Game Master IA',
      advanced_analytics: 'Analytics avanzados',
      export_pdf: 'Exportar a PDF',
      cloud_sync: 'Sincronización en la nube',
      custom_themes: 'Temas personalizados',
      priority_support: 'Soporte prioritario'
    };

    return Object.entries(features)
      .map(([key, enabled]) => `
        <div class="feature-item ${enabled ? 'enabled' : 'disabled'}">
          <span class="feature-icon">${enabled ? '✅' : '❌'}</span>
          <span class="feature-label">${featureLabels[key] || key}</span>
        </div>
      `).join('');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EVENT HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Configurar event listeners
   */
  setupEventListeners() {
    // 🔧 FIX #86: Usar EventManager para todos los listeners

    // Login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      this.eventManager.addEventListener(loginForm, 'submit', (e) => this.handleLogin(e));
    }

    // Signup form
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
      this.eventManager.addEventListener(signupForm, 'submit', (e) => this.handleSignup(e));
    }

    // Reset form
    const resetForm = document.getElementById('reset-form');
    if (resetForm) {
      this.eventManager.addEventListener(resetForm, 'submit', (e) => this.handleResetPassword(e));
    }

    // Click fuera del modal para cerrar
    this.eventManager.addEventListener(this.modal, 'click', (e) => {
      if (e.target.classList.contains('auth-modal-overlay')) {
        this.closeModal();
      }
    });

    // Escape key para cerrar modal
    this.escapeHandler = (e) => {
      if (e.key === 'Escape') {
        this.closeModal();
      }
    };
    this.eventManager.addEventListener(document, 'keydown', this.escapeHandler);
  }

  /**
   * Manejar login
   */
  async handleLogin(e) {
    e.preventDefault();

    const form = e.target;
    const email = form.email.value.trim();
    const password = form.password.value;

    const submitBtn = form.querySelector('.auth-submit');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Iniciando sesión...';

    const result = await this.authHelper.signIn(email, password);

    if (result.success) {
      // El modal se cerrará automáticamente por el auth state listener
    } else {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Iniciar Sesión';
      this.showError('Error al iniciar sesión: ' + result.error);
    }
  }

  /**
   * Manejar registro
   */
  async handleSignup(e) {
    e.preventDefault();

    const form = e.target;
    const fullName = form.fullName.value.trim();
    const email = form.email.value.trim();
    const password = form.password.value;

    const submitBtn = form.querySelector('.auth-submit');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creando cuenta...';

    const result = await this.authHelper.signUp(email, password, fullName);

    if (result.success) {
      // Mostrar mensaje de verificación de email
      this.showSuccess('¡Cuenta creada! Revisa tu email para verificar tu cuenta.');
    } else {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Crear Cuenta Gratis';
      this.showError('Error al crear cuenta: ' + result.error);
    }
  }

  /**
   * Manejar login con Google
   */
  async handleGoogleLogin() {
    const result = await this.authHelper.signInWithGoogle();

    if (!result.success) {
      this.showError('Error con Google: ' + result.error);
    }
    // Si tiene éxito, Supabase redirige automáticamente
  }

  /**
   * Manejar recuperación de contraseña
   */
  async handleResetPassword(e) {
    e.preventDefault();

    const form = e.target;
    const email = form.email.value.trim();

    const submitBtn = form.querySelector('.auth-submit');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Enviando...';

    const result = await this.authHelper.resetPassword(email);

    submitBtn.disabled = false;
    submitBtn.textContent = 'Enviar Link de Recuperación';

    if (result.success) {
      this.showSuccess('Email de recuperación enviado. Revisa tu bandeja de entrada.');
      setTimeout(() => {
        this.currentView = 'login';
        this.renderModal();
      }, 2000);
    } else {
      this.showError('Error: ' + result.error);
    }
  }

  /**
   * Manejar cierre de sesión
   */
  async handleSignOut() {
    const confirmed = await window.confirmModal?.show({
      title: 'Cerrar sesión',
      message: '¿Estás seguro de que quieres cerrar sesión?',
      confirmText: 'Cerrar sesión',
      cancelText: 'Cancelar',
      type: 'warning',
      icon: '🚪'
    }) ?? confirm('¿Estás seguro de que quieres cerrar sesión?');

    if (!confirmed) return;

    await this.authHelper.signOut();
    this.closeModal();
  }

  /**
   * Mostrar upgrade a premium
   */
  showUpgradeToPremium() {
    this.closeModal();

    // Abrir modal de pricing (si existe)
    if (typeof window.pricingModal !== 'undefined') {
      window.pricingModal.showPricingModal();
    } else {
      alert('Próximamente: Planes Premium y Pro con IA avanzada');
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILIDADES
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Cerrar modal
   */
  closeModal() {
    // 🔧 FIX #86: Usar EventManager.cleanup() para limpiar todos los listeners
    this.eventManager.cleanup();
    this.escapeHandler = null;

    if (this.modal) {
      this.modal.remove();
      this.modal = null;
      document.body.style.overflow = '';
    }

    // Restaurar foco al elemento previo para accesibilidad
    if (this.previousActiveElement && typeof this.previousActiveElement.focus === 'function') {
      this.previousActiveElement.focus();
      this.previousActiveElement = null;
    }
  }

  /**
   * Mostrar mensaje de bienvenida
   */
  showWelcomeMessage(user) {
    const profile = this.authHelper.getProfile();
    const name = profile?.full_name || user.email;

    this.showSuccess(`¡Bienvenido de vuelta, ${name}! 🎉`);
  }

  /**
   * Mostrar error
   */
  showError(message) {
    if (window.toast) {
      window.toast.error(message);
    } else if (typeof window.showNotification === 'function') {
      window.showNotification(message, 'error');
    } else {
      logger.error('[Auth]', message);
    }
  }

  /**
   * Mostrar éxito
   */
  showSuccess(message) {
    if (window.toast) {
      window.toast.success(message);
    } else if (typeof window.showNotification === 'function') {
      window.showNotification(message, 'success');
    } else {
      logger.log('[Auth]', message);
    }
  }
}

// Crear instancia global
window.authModal = new AuthModal();

logger.debug('✅ AuthModal loaded. Use window.authModal.showLoginModal() to open.');
