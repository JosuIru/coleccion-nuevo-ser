/**
 * MY ACCOUNT MODAL - Pantalla de Mi Cuenta
 * Gestión completa del perfil de usuario, suscripción y créditos
 *
 * @version 1.0.0
 */

class MyAccountModal {
  constructor() {
    this.authHelper = window.authHelper;
    this.aiPremium = window.aiPremium;
    this.supabase = null;
    this.currentTab = 'profile';
    this.usageHistory = [];
    this.transactions = [];

    this.tabs = [
      { id: 'profile', label: 'Perfil', icon: 'user' },
      { id: 'subscription', label: 'Suscripción', icon: 'crown' },
      { id: 'credits', label: 'Créditos IA', icon: 'zap' },
      { id: 'history', label: 'Historial', icon: 'clock' },
      { id: 'settings', label: 'Preferencias', icon: 'settings' }
    ];

    // 🔧 FIX: EventManager para gestión automática de listeners
    this.eventManager = new EventManager();
    this.eventManager.setComponentName('MyAccountModal');
    this._eventListenersAttached = false;

    this.init();
  }

  async init() {
    if (typeof window.supabase !== 'undefined') {
      this.supabase = window.supabase;
    }
    console.log('✅ MyAccountModal inicializado');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ABRIR/CERRAR MODAL
  // ═══════════════════════════════════════════════════════════════════════════

  async open(tab = 'profile') {
    // Verificar autenticación
    if (!this.authHelper?.isAuthenticated()) {
      if (window.authModal) {
        window.authModal.show('login');
      } else {
        window.toast?.error('Debes iniciar sesión para ver tu cuenta');
      }
      return;
    }

    this.currentTab = tab;
    await this.loadData();
    this.render();
    this.attachEvents();
  }

  close() {
    // 🔧 FIX: Cleanup de event listeners ANTES de remover
    if (this.eventManager) {
      this.eventManager.cleanup();
    }
    this._eventListenersAttached = false;

    const modal = document.getElementById('my-account-modal');
    if (modal) {
      modal.classList.add('fade-out');
      setTimeout(() => modal.remove(), 200);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CARGAR DATOS
  // ═══════════════════════════════════════════════════════════════════════════

  async loadData() {
    try {
      // Cargar historial de uso de IA
      if (this.aiPremium) {
        this.usageHistory = await this.aiPremium.getUsageHistory(30) || [];
      }

      // Cargar transacciones
      if (this.supabase) {
        const { data } = await this.supabase
          .from('transactions')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20);
        this.transactions = data || [];
      }
    } catch (error) {
      console.error('[MyAccount] Error cargando datos:', error);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDERIZADO
  // ═══════════════════════════════════════════════════════════════════════════

  render() {
    // Eliminar modal existente
    const existing = document.getElementById('my-account-modal');
    if (existing) existing.remove();

    const profile = this.authHelper.getProfile() || {};
    const user = this.authHelper.getUser() || {};

    const modal = document.createElement('div');
    modal.id = 'my-account-modal';
    modal.className = 'fixed inset-0 z-[10000] flex items-center justify-center p-4 fade-in';
    modal.innerHTML = `
      <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" id="my-account-backdrop"></div>
      <div class="relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl border border-white/10">

        <!-- Header -->
        <div class="bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border-b border-white/10 p-4 flex items-center justify-between">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-white text-xl font-bold">
              ${profile.full_name ? profile.full_name.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase() || '?'}
            </div>
            <div>
              <h2 class="text-xl font-bold text-white">${profile.full_name || 'Mi Cuenta'}</h2>
              <p class="text-sm text-slate-400">${user.email || ''}</p>
            </div>
          </div>
          <button id="my-account-close" class="p-2 hover:bg-white/10 rounded-lg transition-colors text-white">
            ${Icons.create('x', 24)}
          </button>
        </div>

        <!-- Tabs -->
        <div class="flex border-b border-white/10 overflow-x-auto">
          ${this.tabs.map(tab => `
            <button class="tab-btn flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap
                          ${this.currentTab === tab.id ? 'text-cyan-400 border-b-2 border-cyan-400 bg-white/5' : 'text-slate-400 hover:text-white hover:bg-white/5'}"
                    data-tab="${tab.id}">
              ${Icons.create(tab.icon, 18)}
              <span class="hidden sm:inline">${tab.label}</span>
            </button>
          `).join('')}
        </div>

        <!-- Content -->
        <div class="p-6 overflow-y-auto max-h-[calc(90vh-180px)]" id="my-account-content">
          ${this.renderTabContent()}
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Añadir estilos de animación
    const style = document.createElement('style');
    style.textContent = `
      .fade-in { animation: fadeIn 0.2s ease-out; }
      .fade-out { animation: fadeOut 0.2s ease-out; opacity: 0; }
      @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
    `;
    modal.appendChild(style);
  }

  renderTabContent() {
    switch (this.currentTab) {
      case 'profile': return this.renderProfileTab();
      case 'subscription': return this.renderSubscriptionTab();
      case 'credits': return this.renderCreditsTab();
      case 'history': return this.renderHistoryTab();
      case 'settings': return this.renderSettingsTab();
      default: return this.renderProfileTab();
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TAB: PERFIL
  // ═══════════════════════════════════════════════════════════════════════════

  renderProfileTab() {
    const profile = this.authHelper.getProfile() || {};
    const user = this.authHelper.getUser() || {};

    return `
      <div class="space-y-6">
        <h3 class="text-lg font-semibold text-white">Información Personal</h3>

        <!-- Avatar y nombre -->
        <div class="flex items-center gap-4">
          <div class="relative">
            <div class="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-white text-3xl font-bold">
              ${profile.avatar_url
                ? `<img src="${profile.avatar_url}" class="w-full h-full rounded-full object-cover" alt="Avatar">`
                : (profile.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || '?')}
            </div>
            <button id="change-avatar-btn" class="absolute -bottom-1 -right-1 w-8 h-8 bg-cyan-500 hover:bg-cyan-600 rounded-full flex items-center justify-center text-white transition-colors">
              ${Icons.create('camera', 16)}
            </button>
          </div>
          <div class="flex-1">
            <label class="block text-sm text-slate-400 mb-1">Nombre completo</label>
            <input type="text" id="profile-name" value="${profile.full_name || ''}"
                   class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none">
          </div>
        </div>

        <!-- Email (solo lectura) -->
        <div>
          <label class="block text-sm text-slate-400 mb-1">Email</label>
          <input type="email" value="${user.email || ''}" disabled
                 class="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-slate-400 cursor-not-allowed">
          <p class="text-xs text-slate-500 mt-1">El email no se puede cambiar</p>
        </div>

        <!-- Fecha de registro -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm text-slate-400 mb-1">Miembro desde</label>
            <div class="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-slate-300">
              ${new Date(profile.created_at || user.created_at).toLocaleDateString('es-ES', {
                year: 'numeric', month: 'long', day: 'numeric'
              })}
            </div>
          </div>
          <div>
            <label class="block text-sm text-slate-400 mb-1">Último acceso</label>
            <div class="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-slate-300">
              ${user.last_sign_in_at
                ? new Date(user.last_sign_in_at).toLocaleDateString('es-ES', {
                    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                  })
                : 'N/A'}
            </div>
          </div>
        </div>

        <!-- Botones -->
        <div class="flex gap-3 pt-4 border-t border-white/10">
          <button id="save-profile-btn" class="px-6 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-colors">
            Guardar Cambios
          </button>
          <button id="change-password-btn" class="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors">
            Cambiar Contraseña
          </button>
        </div>
      </div>
    `;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TAB: SUSCRIPCIÓN
  // ═══════════════════════════════════════════════════════════════════════════

  renderSubscriptionTab() {
    const profile = this.authHelper.getProfile() || {};
    const tier = profile.subscription_tier || 'free';
    const status = profile.subscription_status || 'active';

    const tierInfo = {
      free: { name: 'Gratuito', icon: '🆓', color: 'gray', price: '0€' },
      premium: { name: 'Premium', icon: '⭐', color: 'amber', price: '9,99€/mes' },
      pro: { name: 'Pro', icon: '👑', color: 'purple', price: '19,99€/mes' }
    };

    const currentTier = tierInfo[tier] || tierInfo.free;

    const statusLabels = {
      active: { label: 'Activa', color: 'green' },
      inactive: { label: 'Inactiva', color: 'gray' },
      canceled: { label: 'Cancelada', color: 'red' },
      past_due: { label: 'Pago pendiente', color: 'yellow' },
      trialing: { label: 'Prueba', color: 'blue' }
    };

    const currentStatus = statusLabels[status] || statusLabels.inactive;

    return `
      <div class="space-y-6">
        <!-- Plan actual -->
        <div class="bg-gradient-to-br from-${currentTier.color}-500/20 to-${currentTier.color}-600/10 rounded-2xl p-6 border border-${currentTier.color}-500/30">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-3">
              <span class="text-4xl">${currentTier.icon}</span>
              <div>
                <h3 class="text-2xl font-bold text-white">Plan ${currentTier.name}</h3>
                <p class="text-slate-400">${currentTier.price}</p>
              </div>
            </div>
            <span class="px-3 py-1 rounded-full text-sm font-medium bg-${currentStatus.color}-500/20 text-${currentStatus.color}-400">
              ${currentStatus.label}
            </span>
          </div>

          ${tier !== 'free' && profile.subscription_end ? `
            <div class="text-sm text-slate-400">
              ${status === 'canceled'
                ? `Tu suscripción estará activa hasta el ${new Date(profile.subscription_end).toLocaleDateString('es-ES')}`
                : `Próxima renovación: ${new Date(profile.subscription_end).toLocaleDateString('es-ES')}`
              }
            </div>
          ` : ''}
        </div>

        <!-- Features incluidos -->
        <div>
          <h4 class="text-lg font-semibold text-white mb-3">Características incluidas</h4>
          <div class="grid grid-cols-2 gap-3">
            ${this.renderFeaturesList(profile.features || {})}
          </div>
        </div>

        <!-- Acciones -->
        <div class="space-y-3 pt-4 border-t border-white/10">
          ${tier === 'free' ? `
            <button id="upgrade-btn" class="w-full px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2">
              ⭐ Actualizar a Premium
            </button>
          ` : tier === 'premium' ? `
            <button id="upgrade-pro-btn" class="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2">
              👑 Actualizar a Pro
            </button>
          ` : ''}

          ${tier !== 'free' && status !== 'canceled' ? `
            <button id="cancel-subscription-btn" class="w-full px-6 py-3 bg-white/10 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-xl transition-all flex items-center justify-center gap-2">
              Cancelar suscripción
            </button>
          ` : ''}

          ${tier !== 'free' && status === 'canceled' ? `
            <button id="reactivate-btn" class="w-full px-6 py-3 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-xl transition-all flex items-center justify-center gap-2">
              Reactivar suscripción
            </button>
          ` : ''}

          <!-- PayPal alternativo -->
          <div class="flex items-center gap-3 pt-3">
            <span class="text-sm text-slate-500">o pagar con:</span>
            <a href="https://www.paypal.com/paypalme/codigodespierto" target="_blank"
               class="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797H9.48c-.55 0-1.015.394-1.096.937l-1.308 8.069Z"/>
              </svg>
              PayPal
            </a>
          </div>
        </div>
      </div>
    `;
  }

  renderFeaturesList(features) {
    const allFeatures = [
      { key: 'cloud_sync', label: 'Sincronización en la nube', icon: 'cloud' },
      { key: 'ai_chat', label: 'Chat IA sobre libros', icon: 'message-circle' },
      { key: 'ai_tutor', label: 'Tutor IA personalizado', icon: 'graduation-cap' },
      { key: 'ai_game_master', label: 'Game Master IA', icon: 'gamepad-2' },
      { key: 'export_pdf', label: 'Exportar a PDF', icon: 'file-text' },
      { key: 'advanced_analytics', label: 'Analytics avanzados', icon: 'bar-chart-2' },
      { key: 'custom_themes', label: 'Temas personalizados', icon: 'palette' },
      { key: 'priority_support', label: 'Soporte prioritario', icon: 'headphones' }
    ];

    return allFeatures.map(f => {
      const enabled = features[f.key] === true;
      return `
        <div class="flex items-center gap-2 ${enabled ? 'text-green-400' : 'text-slate-600'}">
          ${enabled
            ? Icons.create('check-circle', 18)
            : Icons.create('x-circle', 18)}
          <span class="text-sm">${f.label}</span>
        </div>
      `;
    }).join('');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TAB: CRÉDITOS IA
  // ═══════════════════════════════════════════════════════════════════════════

  renderCreditsTab() {
    const profile = this.authHelper.getProfile() || {};
    const remaining = profile.ai_credits_remaining || 0;
    const total = profile.ai_credits_total || 10;
    const percentage = total > 0 ? Math.round((remaining / total) * 100) : 0;
    const resetDate = profile.ai_credits_reset_date;

    // Calcular estadísticas de uso
    const usageByFeature = {};
    this.usageHistory.forEach(item => {
      const feature = item.feature_used || 'general';
      usageByFeature[feature] = (usageByFeature[feature] || 0) + (item.credits_used || 0);
    });

    return `
      <div class="space-y-6">
        <!-- Créditos actuales -->
        <div class="bg-gradient-to-br from-cyan-500/20 to-blue-500/10 rounded-2xl p-6 border border-cyan-500/30">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-white">Créditos Disponibles</h3>
            <span class="text-3xl font-bold text-cyan-400">${remaining.toLocaleString()}</span>
          </div>

          <!-- Barra de progreso -->
          <div class="h-3 bg-white/10 rounded-full overflow-hidden mb-2">
            <div class="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
                 style="width: ${percentage}%"></div>
          </div>

          <div class="flex justify-between text-sm">
            <span class="text-slate-400">${remaining.toLocaleString()} de ${total.toLocaleString()} créditos</span>
            <span class="text-slate-400">${percentage}% disponible</span>
          </div>

          ${resetDate ? `
            <p class="text-sm text-slate-500 mt-3">
              Los créditos se renuevan el ${new Date(resetDate).toLocaleDateString('es-ES')}
            </p>
          ` : ''}
        </div>

        <!-- Uso por característica -->
        <div>
          <h4 class="text-lg font-semibold text-white mb-3">Uso este mes</h4>
          ${Object.keys(usageByFeature).length > 0 ? `
            <div class="space-y-2">
              ${Object.entries(usageByFeature).map(([feature, credits]) => `
                <div class="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <span class="text-slate-300 capitalize">${feature.replace(/_/g, ' ')}</span>
                  <span class="text-cyan-400 font-medium">${credits.toLocaleString()} créditos</span>
                </div>
              `).join('')}
            </div>
          ` : `
            <div class="text-center py-8 text-slate-500">
              <p>No has usado créditos este mes</p>
            </div>
          `}
        </div>

        <!-- Costos estimados -->
        <div class="bg-white/5 rounded-xl p-4">
          <h4 class="font-semibold text-white mb-3">Costos por característica</h4>
          <div class="grid grid-cols-2 gap-2 text-sm">
            <div class="flex justify-between text-slate-400">
              <span>Chat IA</span>
              <span>~250 créditos</span>
            </div>
            <div class="flex justify-between text-slate-400">
              <span>Resumen</span>
              <span>~200 créditos</span>
            </div>
            <div class="flex justify-between text-slate-400">
              <span>Quiz personalizado</span>
              <span>~400 créditos</span>
            </div>
            <div class="flex justify-between text-slate-400">
              <span>Tutor IA</span>
              <span>~450 créditos</span>
            </div>
            <div class="flex justify-between text-slate-400">
              <span>Game Master</span>
              <span>~500 créditos</span>
            </div>
            <div class="flex justify-between text-slate-400">
              <span>Adaptador contenido</span>
              <span>~300 créditos</span>
            </div>
          </div>
        </div>

        <!-- Comprar más créditos -->
        ${remaining < total * 0.2 ? `
          <div class="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
            <p class="text-amber-400 text-sm mb-3">⚠️ Tus créditos están bajos</p>
            <button id="buy-credits-btn" class="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-lg transition-colors">
              Actualizar plan para más créditos
            </button>
          </div>
        ` : ''}
      </div>
    `;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TAB: HISTORIAL
  // ═══════════════════════════════════════════════════════════════════════════

  renderHistoryTab() {
    return `
      <div class="space-y-6">
        <!-- Historial de pagos -->
        <div>
          <h4 class="text-lg font-semibold text-white mb-3">Historial de Pagos</h4>
          ${this.transactions.length > 0 ? `
            <div class="space-y-2">
              ${this.transactions.map(tx => `
                <div class="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full ${tx.status === 'completed' ? 'bg-green-500/20' : 'bg-yellow-500/20'} flex items-center justify-center">
                      ${tx.status === 'completed'
                        ? Icons.create('check', 20)
                        : Icons.create('clock', 20)}
                    </div>
                    <div>
                      <p class="text-white font-medium">${tx.description || 'Pago de suscripción'}</p>
                      <p class="text-sm text-slate-400">${new Date(tx.created_at).toLocaleDateString('es-ES')}</p>
                    </div>
                  </div>
                  <div class="text-right">
                    <p class="text-white font-bold">${tx.amount}€</p>
                    <p class="text-sm ${tx.status === 'completed' ? 'text-green-400' : 'text-yellow-400'}">
                      ${tx.status === 'completed' ? 'Completado' : 'Pendiente'}
                    </p>
                  </div>
                </div>
              `).join('')}
            </div>
          ` : `
            <div class="text-center py-12 text-slate-500">
              <p class="text-4xl mb-2">📭</p>
              <p>No hay pagos registrados</p>
            </div>
          `}
        </div>

        <!-- Historial de uso IA -->
        <div>
          <h4 class="text-lg font-semibold text-white mb-3">Uso de IA (últimos 30 días)</h4>
          ${this.usageHistory.length > 0 ? `
            <div class="max-h-64 overflow-y-auto space-y-2">
              ${this.usageHistory.slice(0, 20).map(item => `
                <div class="flex items-center justify-between p-3 bg-white/5 rounded-lg text-sm">
                  <div>
                    <span class="text-slate-300 capitalize">${(item.feature_used || 'general').replace(/_/g, ' ')}</span>
                    <span class="text-slate-600 ml-2">${new Date(item.created_at).toLocaleString('es-ES')}</span>
                  </div>
                  <span class="text-cyan-400">-${item.credits_used || 0}</span>
                </div>
              `).join('')}
            </div>
          ` : `
            <div class="text-center py-8 text-slate-500">
              <p>No hay uso de IA registrado</p>
            </div>
          `}
        </div>
      </div>
    `;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TAB: PREFERENCIAS
  // ═══════════════════════════════════════════════════════════════════════════

  renderSettingsTab() {
    const profile = this.authHelper.getProfile() || {};
    const preferences = profile.preferences || {};

    return `
      <div class="space-y-6">
        <h3 class="text-lg font-semibold text-white">Preferencias</h3>

        <!-- Notificaciones -->
        <div class="space-y-4">
          <h4 class="font-medium text-slate-300">Notificaciones</h4>

          <label class="flex items-center justify-between p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10">
            <div>
              <p class="text-white">Notificaciones por email</p>
              <p class="text-sm text-slate-500">Recibe actualizaciones y novedades</p>
            </div>
            <input type="checkbox" id="pref-email-notifications"
                   ${preferences.email_notifications !== false ? 'checked' : ''}
                   class="w-5 h-5 rounded accent-cyan-500">
          </label>

          <label class="flex items-center justify-between p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10">
            <div>
              <p class="text-white">Alertas de créditos bajos</p>
              <p class="text-sm text-slate-500">Aviso cuando quedan pocos créditos IA</p>
            </div>
            <input type="checkbox" id="pref-low-credits-alert"
                   ${preferences.low_credits_alert !== false ? 'checked' : ''}
                   class="w-5 h-5 rounded accent-cyan-500">
          </label>
        </div>

        <!-- Privacidad -->
        <div class="space-y-4">
          <h4 class="font-medium text-slate-300">Privacidad</h4>

          <label class="flex items-center justify-between p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10">
            <div>
              <p class="text-white">Sincronizar progreso</p>
              <p class="text-sm text-slate-500">Guardar tu progreso de lectura en la nube</p>
            </div>
            <input type="checkbox" id="pref-sync-progress"
                   ${preferences.sync_progress !== false ? 'checked' : ''}
                   class="w-5 h-5 rounded accent-cyan-500">
          </label>

          <label class="flex items-center justify-between p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10">
            <div>
              <p class="text-white">Analytics anónimos</p>
              <p class="text-sm text-slate-500">Ayúdanos a mejorar la app</p>
            </div>
            <input type="checkbox" id="pref-analytics"
                   ${preferences.analytics !== false ? 'checked' : ''}
                   class="w-5 h-5 rounded accent-cyan-500">
          </label>
        </div>

        <!-- Guardar -->
        <button id="save-preferences-btn" class="w-full px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-xl transition-colors">
          Guardar Preferencias
        </button>

        <!-- Zona peligrosa -->
        <div class="pt-6 border-t border-red-500/30">
          <h4 class="font-medium text-red-400 mb-4">Zona Peligrosa</h4>

          <div class="space-y-3">
            <button id="export-data-btn" class="w-full px-4 py-3 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg transition-colors text-left flex items-center gap-3">
              ${Icons.create('download', 20)}
              Exportar mis datos
            </button>

            <button id="delete-account-btn" class="w-full px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors text-left flex items-center gap-3">
              ${Icons.create('trash-2', 20)}
              Eliminar mi cuenta
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EVENT HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════

  attachEvents() {
    // 🔧 FIX: Protección contra re-attach múltiple
    if (this._eventListenersAttached) {
      console.warn('[MyAccountModal] Listeners already attached, skipping');
      return;
    }

    const modal = document.getElementById('my-account-modal');
    if (!modal) return;

    // Cerrar modal
    const backdrop = document.getElementById('my-account-backdrop');
    if (backdrop) {
      this.eventManager.addEventListener(backdrop, 'click', () => this.close());
    }

    const closeBtn = document.getElementById('my-account-close');
    if (closeBtn) {
      this.eventManager.addEventListener(closeBtn, 'click', () => this.close());
    }

    // Tabs
    modal.querySelectorAll('.tab-btn').forEach(btn => {
      this.eventManager.addEventListener(btn, 'click', () => {
        this.currentTab = btn.dataset.tab;
        modal.querySelectorAll('.tab-btn').forEach(b => {
          b.classList.remove('text-cyan-400', 'border-b-2', 'border-cyan-400', 'bg-white/5');
          b.classList.add('text-slate-400');
        });
        btn.classList.add('text-cyan-400', 'border-b-2', 'border-cyan-400', 'bg-white/5');
        btn.classList.remove('text-slate-400');
        document.getElementById('my-account-content').innerHTML = this.renderTabContent();
        this.attachTabEvents();
      });
    });

    this.attachTabEvents();

    // 🔧 FIX: Escape para cerrar usando EventManager
    const handleEscape = (e) => {
      if (e.key === 'Escape') this.close();
    };
    this.eventManager.addEventListener(document, 'keydown', handleEscape);

    this._eventListenersAttached = true;
  }

  attachTabEvents() {
    // 🔧 FIX: Usar EventManager para todos los listeners de tabs

    // Guardar perfil
    const saveProfileBtn = document.getElementById('save-profile-btn');
    if (saveProfileBtn) {
      this.eventManager.addEventListener(saveProfileBtn, 'click', async () => {
        const name = document.getElementById('profile-name')?.value;
        if (name && this.supabase) {
          try {
            await this.supabase.from('profiles').update({ full_name: name }).eq('id', this.authHelper.getUser().id);
            window.toast?.success('Perfil actualizado');
          } catch (error) {
            window.toast?.error('Error al guardar');
          }
        }
      });
    }

    // Cambiar contraseña
    const changePasswordBtn = document.getElementById('change-password-btn');
    if (changePasswordBtn) {
      this.eventManager.addEventListener(changePasswordBtn, 'click', () => {
        if (window.authModal) {
          this.close();
          window.authModal.show('reset');
        }
      });
    }

    // Upgrade
    const upgradeBtn = document.getElementById('upgrade-btn');
    if (upgradeBtn) {
      this.eventManager.addEventListener(upgradeBtn, 'click', () => {
        this.close();
        if (window.pricingModal) {
          window.pricingModal.showPricingModal();
        } else if (window.biblioteca) {
          window.biblioteca.showPremiumInfoModal();
        }
      });
    }

    const upgradeProBtn = document.getElementById('upgrade-pro-btn');
    if (upgradeProBtn) {
      this.eventManager.addEventListener(upgradeProBtn, 'click', () => {
        this.close();
        if (window.pricingModal) {
          window.pricingModal.showPricingModal();
        }
      });
    }

    // Cancelar suscripción
    const cancelBtn = document.getElementById('cancel-subscription-btn');
    if (cancelBtn) {
      this.eventManager.addEventListener(cancelBtn, 'click', () => {
        this.showCancelConfirmation();
      });
    }

    // Guardar preferencias
    const savePrefsBtn = document.getElementById('save-preferences-btn');
    if (savePrefsBtn) {
      this.eventManager.addEventListener(savePrefsBtn, 'click', async () => {
        await this.savePreferences();
      });
    }

    // Exportar datos
    const exportBtn = document.getElementById('export-data-btn');
    if (exportBtn) {
      this.eventManager.addEventListener(exportBtn, 'click', async () => {
        await this.exportData();
      });
    }

    // Eliminar cuenta
    const deleteBtn = document.getElementById('delete-account-btn');
    if (deleteBtn) {
      this.eventManager.addEventListener(deleteBtn, 'click', () => {
        this.showDeleteConfirmation();
      });
    }

    // Comprar créditos
    const buyCreditsBtn = document.getElementById('buy-credits-btn');
    if (buyCreditsBtn) {
      this.eventManager.addEventListener(buyCreditsBtn, 'click', () => {
        this.close();
        if (window.pricingModal) {
          window.pricingModal.showPricingModal();
        }
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ACCIONES
  // ═══════════════════════════════════════════════════════════════════════════

  showCancelConfirmation() {
    const profile = this.authHelper.getProfile() || {};
    const endDate = profile.subscription_end
      ? new Date(profile.subscription_end).toLocaleDateString('es-ES')
      : 'el final del período actual';

    const confirm = window.confirm(
      `¿Estás seguro de que deseas cancelar tu suscripción?\n\n` +
      `Tu acceso premium continuará hasta ${endDate}.\n` +
      `Después, tu cuenta pasará al plan gratuito.`
    );

    if (confirm) {
      this.cancelSubscription();
    }
  }

  async cancelSubscription() {
    try {
      // Llamar al endpoint de cancelación
      const response = await fetch('/api/cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: this.authHelper.getUser().id })
      });

      if (response.ok) {
        window.toast?.success('Suscripción cancelada. Seguirás teniendo acceso hasta el final del período.');
        await this.authHelper.refreshProfile();
        this.render();
      } else {
        throw new Error('Error al cancelar');
      }
    } catch (error) {
      console.error('[MyAccount] Error cancelando:', error);
      window.toast?.error('Error al cancelar. Contacta con soporte.');
    }
  }

  async savePreferences() {
    const preferences = {
      email_notifications: document.getElementById('pref-email-notifications')?.checked ?? true,
      low_credits_alert: document.getElementById('pref-low-credits-alert')?.checked ?? true,
      sync_progress: document.getElementById('pref-sync-progress')?.checked ?? true,
      analytics: document.getElementById('pref-analytics')?.checked ?? true
    };

    try {
      if (this.supabase) {
        await this.supabase
          .from('profiles')
          .update({ preferences })
          .eq('id', this.authHelper.getUser().id);
        window.toast?.success('Preferencias guardadas');
      }
    } catch (error) {
      console.error('[MyAccount] Error guardando preferencias:', error);
      window.toast?.error('Error al guardar preferencias');
    }
  }

  async exportData() {
    try {
      const profile = this.authHelper.getProfile();
      const user = this.authHelper.getUser();

      const data = {
        profile,
        user: { email: user.email, created_at: user.created_at },
        usage_history: this.usageHistory,
        transactions: this.transactions,
        exported_at: new Date().toISOString()
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mi-cuenta-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      window.toast?.success('Datos exportados');
    } catch (error) {
      console.error('[MyAccount] Error exportando:', error);
      window.toast?.error('Error al exportar datos');
    }
  }

  showDeleteConfirmation() {
    const email = this.authHelper.getUser()?.email;
    const input = window.prompt(
      `⚠️ ATENCIÓN: Esta acción es IRREVERSIBLE.\n\n` +
      `Se eliminarán todos tus datos:\n` +
      `- Perfil y preferencias\n` +
      `- Progreso de lectura\n` +
      `- Notas y subrayados\n` +
      `- Historial de uso\n\n` +
      `Para confirmar, escribe tu email: ${email}`
    );

    if (input === email) {
      this.deleteAccount();
    } else if (input !== null) {
      window.toast?.error('El email no coincide');
    }
  }

  async deleteAccount() {
    try {
      // Llamar al endpoint de eliminación
      const response = await fetch('/api/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: this.authHelper.getUser().id })
      });

      if (response.ok) {
        window.toast?.info('Cuenta eliminada. Hasta pronto.');
        await this.authHelper.signOut();
        this.close();
        window.location.reload();
      } else {
        throw new Error('Error al eliminar');
      }
    } catch (error) {
      console.error('[MyAccount] Error eliminando cuenta:', error);
      window.toast?.error('Error al eliminar. Contacta con soporte.');
    }
  }
}

// Crear instancia global
window.MyAccountModal = MyAccountModal;
window.myAccountModal = new MyAccountModal();

console.log('✅ MyAccountModal loaded');
