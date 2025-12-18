/**
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

    this.init();
  }

  init() {
    // Esperar a que AuthHelper esté listo
    if (!this.authHelper) {
      setTimeout(() => this.init(), 500);
      return;
    }

    // Escuchar cambios de autenticación
    this.authHelper.onAuthStateChange((event, user) => {
      if (event === 'signed_in') {
        this.closeModal();
        this.showWelcomeMessage(user);
      } else if (event === 'signed_out') {
        this.closeModal();
      }
    });

    console.log('✅ AuthModal inicializado');
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

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDERIZADO
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Renderizar modal según la vista actual
   */
  renderModal() {
    // Cerrar modal existente si hay uno
    this.closeModal();

    // Crear modal
    this.modal = document.createElement('div');
    this.modal.className = 'auth-modal-overlay fade-in';
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
        <h2>Iniciar Sesión</h2>
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
        <h2>Crear Cuenta</h2>
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
              Acepto los <a href="/legal/terms.html" target="_blank">términos y condiciones</a>
              y la <a href="/legal/privacy.html" target="_blank">política de privacidad</a>
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
        <h2>Recuperar Contraseña</h2>
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
   * HTML de perfil de usuario
   */
  getProfileHTML() {
    const profile = this.authHelper.getProfile();
    const user = this.authHelper.getUser();

    if (!profile) return '<p>Cargando perfil...</p>';

    const tier = profile.subscription_tier;
    const credits = profile.ai_credits_remaining;
    const totalCredits = profile.ai_credits_total;
    const creditsPercentage = (credits / totalCredits) * 100;

    return `
      <div class="profile-header">
        <div class="profile-avatar">
          ${profile.avatar_url
            ? `<img src="${profile.avatar_url}" alt="${profile.full_name}" />`
            : `<div class="avatar-placeholder">${profile.full_name?.charAt(0) || 'U'}</div>`
          }
        </div>
        <div class="profile-info">
          <h2>${profile.full_name || 'Usuario'}</h2>
          <p class="profile-email">${user.email}</p>
          <div class="profile-tier ${tier}">
            ${tier === 'free' ? '🆓' : tier === 'premium' ? '⭐' : '👑'} ${tier.toUpperCase()}
          </div>
        </div>
      </div>

      <div class="profile-stats">
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

      <div class="profile-actions">
        ${tier === 'free' ? `
          <button class="btn-upgrade" onclick="window.authModal.showUpgradeToPremium()">
            ✨ Actualizar a Premium
          </button>
        ` : ''}

        <button class="btn-secondary" onclick="window.authModal.handleSignOut()">
          Cerrar Sesión
        </button>
      </div>

      <div class="profile-features">
        <h3>Features Disponibles</h3>
        <div class="features-list">
          ${this.getFeaturesListHTML(profile.features)}
        </div>
      </div>
    `;
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
    // Login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => this.handleLogin(e));
    }

    // Signup form
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
      signupForm.addEventListener('submit', (e) => this.handleSignup(e));
    }

    // Reset form
    const resetForm = document.getElementById('reset-form');
    if (resetForm) {
      resetForm.addEventListener('submit', (e) => this.handleResetPassword(e));
    }

    // Click fuera del modal para cerrar
    this.modal.addEventListener('click', (e) => {
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
    document.addEventListener('keydown', this.escapeHandler);
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
    // Limpiar escape key handler
    if (this.escapeHandler) {
      document.removeEventListener('keydown', this.escapeHandler);
      this.escapeHandler = null;
    }

    if (this.modal) {
      this.modal.remove();
      this.modal = null;
      document.body.style.overflow = '';
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
    if (typeof window.showNotification === 'function') {
      window.showNotification(message, 'error');
    } else {
      alert(message);
    }
  }

  /**
   * Mostrar éxito
   */
  showSuccess(message) {
    if (typeof window.showNotification === 'function') {
      window.showNotification(message, 'success');
    } else {
      alert(message);
    }
  }
}

// Crear instancia global
window.authModal = new AuthModal();

console.log('✅ AuthModal loaded. Use window.authModal.showLoginModal() to open.');
