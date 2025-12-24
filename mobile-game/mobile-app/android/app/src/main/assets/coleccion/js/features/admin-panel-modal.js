/**
 * ADMIN PANEL MODAL - Panel de Administración
 * Gestión de usuarios, suscripciones, métricas y configuración del sistema
 *
 * @version 1.0.0
 */

class AdminPanelModal {
  constructor() {
    this.modal = null;
    this.currentTab = 'dashboard';
    this.users = [];
    this.metrics = {};
    this.searchQuery = '';
    this.filterPlan = 'all';
    this.currentPage = 1;
    this.usersPerPage = 20;
  }

  /**
   * Mostrar el panel de administración
   */
  async show() {
    // Verificar que el usuario es admin
    const user = window.authHelper?.getCurrentUser();
    if (!user) {
      console.error('Usuario no autenticado');
      return;
    }

    // Verificar permisos de admin
    const isAdmin = await this.checkAdminPermissions(user.id);
    if (!isAdmin) {
      console.error('Usuario no tiene permisos de administrador');
      return;
    }

    this.render();
    this.attachEventListeners();
    this.loadDashboardData();
  }

  /**
   * Verificar permisos de administrador
   */
  async checkAdminPermissions(userId) {
    try {
      const supabase = window.supabaseClient;
      if (!supabase) return false;

      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      return data?.role === 'admin';
    } catch (error) {
      console.error('Error verificando permisos:', error);
      return false;
    }
  }

  /**
   * Renderizar el modal
   */
  render() {
    // Eliminar modal existente
    const existente = document.getElementById('admin-panel-modal');
    if (existente) existente.remove();

    this.modal = document.createElement('div');
    this.modal.id = 'admin-panel-modal';
    this.modal.className = 'fixed inset-0 z-[10000] flex items-center justify-center p-4';
    this.modal.innerHTML = `
      <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" id="admin-panel-backdrop"></div>
      <div class="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden shadow-2xl border border-purple-500/30">
        <!-- Header -->
        <div class="bg-gradient-to-r from-purple-600/20 to-indigo-600/20 border-b border-white/10 p-4 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="text-2xl">🛡️</span>
            <div>
              <h2 class="text-xl font-bold text-white">Panel de Administración</h2>
              <p class="text-sm text-slate-400">Gestión del sistema Nuevo Ser</p>
            </div>
          </div>
          <button id="admin-panel-close" class="p-2 hover:bg-white/10 rounded-lg transition-colors text-white">
            ${this.getIcon('x')}
          </button>
        </div>

        <!-- Tabs -->
        <div class="border-b border-white/10 bg-slate-800/50">
          <div class="flex overflow-x-auto">
            ${this.renderTabs()}
          </div>
        </div>

        <!-- Content -->
        <div id="admin-panel-content" class="p-6 overflow-y-auto" style="max-height: calc(95vh - 140px);">
          <div class="flex items-center justify-center h-64">
            <div class="text-center">
              <div class="animate-spin text-4xl mb-4">⏳</div>
              <p class="text-slate-400">Cargando datos...</p>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(this.modal);
  }

  /**
   * Renderizar pestañas
   */
  renderTabs() {
    const tabs = [
      { id: 'dashboard', icon: '📊', label: 'Dashboard' },
      { id: 'users', icon: '👥', label: 'Usuarios' },
      { id: 'subscriptions', icon: '💳', label: 'Suscripciones' },
      { id: 'ai-usage', icon: '🤖', label: 'Uso IA' },
      { id: 'manual-activation', icon: '🔑', label: 'Activación Manual' },
      { id: 'settings', icon: '⚙️', label: 'Configuración' }
    ];

    return tabs.map(tab => `
      <button class="admin-tab px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors
                     ${this.currentTab === tab.id
                       ? 'text-purple-400 border-b-2 border-purple-400 bg-purple-500/10'
                       : 'text-slate-400 hover:text-white hover:bg-white/5'}"
              data-tab="${tab.id}">
        <span class="mr-2">${tab.icon}</span>
        ${tab.label}
      </button>
    `).join('');
  }

  /**
   * Cargar datos del dashboard
   */
  async loadDashboardData() {
    try {
      const supabase = window.supabaseClient;
      if (!supabase) {
        this.renderContent(this.renderDashboardError('Cliente Supabase no disponible'));
        return;
      }

      // Cargar métricas en paralelo
      const [usersResult, subscriptionsResult, aiUsageResult] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact' }),
        supabase.from('subscriptions').select('*', { count: 'exact' }),
        supabase.from('ai_usage').select('credits_used', { count: 'exact' })
      ]);

      // Calcular métricas
      const totalUsers = usersResult.count || 0;
      const totalSubscriptions = subscriptionsResult.count || 0;
      const activeSubscriptions = subscriptionsResult.data?.filter(s => s.status === 'active').length || 0;
      const totalAICredits = aiUsageResult.data?.reduce((sum, u) => sum + (u.credits_used || 0), 0) || 0;

      // Suscripciones por plan
      const subscriptionsByPlan = {
        premium: subscriptionsResult.data?.filter(s => s.plan === 'premium' && s.status === 'active').length || 0,
        pro: subscriptionsResult.data?.filter(s => s.plan === 'pro' && s.status === 'active').length || 0
      };

      // Calcular ingresos estimados
      const monthlyRevenue = (subscriptionsByPlan.premium * 9.99) + (subscriptionsByPlan.pro * 19.99);

      this.metrics = {
        totalUsers,
        totalSubscriptions,
        activeSubscriptions,
        totalAICredits,
        subscriptionsByPlan,
        monthlyRevenue
      };

      this.renderContent(this.renderDashboard());
    } catch (error) {
      console.error('Error cargando dashboard:', error);
      this.renderContent(this.renderDashboardError(error.message));
    }
  }

  /**
   * Renderizar dashboard
   */
  renderDashboard() {
    const { totalUsers, activeSubscriptions, totalAICredits, subscriptionsByPlan, monthlyRevenue } = this.metrics;

    return `
      <div class="space-y-6">
        <!-- Métricas principales -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-xl p-4 border border-blue-500/30">
            <div class="text-3xl font-bold text-blue-400">${totalUsers}</div>
            <div class="text-sm text-slate-400">Usuarios totales</div>
          </div>
          <div class="bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-xl p-4 border border-purple-500/30">
            <div class="text-3xl font-bold text-purple-400">${activeSubscriptions}</div>
            <div class="text-sm text-slate-400">Suscripciones activas</div>
          </div>
          <div class="bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 rounded-xl p-4 border border-cyan-500/30">
            <div class="text-3xl font-bold text-cyan-400">${totalAICredits.toLocaleString()}</div>
            <div class="text-sm text-slate-400">Créditos IA usados</div>
          </div>
          <div class="bg-gradient-to-br from-green-500/20 to-green-600/10 rounded-xl p-4 border border-green-500/30">
            <div class="text-3xl font-bold text-green-400">€${monthlyRevenue.toFixed(2)}</div>
            <div class="text-sm text-slate-400">Ingresos mensuales</div>
          </div>
        </div>

        <!-- Distribución de planes -->
        <div class="grid md:grid-cols-2 gap-6">
          <div class="bg-white/5 rounded-xl p-6 border border-white/10">
            <h3 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              📊 Distribución de Planes
            </h3>
            <div class="space-y-4">
              <div>
                <div class="flex justify-between text-sm mb-1">
                  <span class="text-slate-400">Gratuitos</span>
                  <span class="text-white">${totalUsers - activeSubscriptions}</span>
                </div>
                <div class="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div class="h-full bg-slate-500 rounded-full"
                       style="width: ${totalUsers > 0 ? ((totalUsers - activeSubscriptions) / totalUsers * 100) : 0}%"></div>
                </div>
              </div>
              <div>
                <div class="flex justify-between text-sm mb-1">
                  <span class="text-amber-400">Premium</span>
                  <span class="text-white">${subscriptionsByPlan.premium}</span>
                </div>
                <div class="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div class="h-full bg-amber-500 rounded-full"
                       style="width: ${totalUsers > 0 ? (subscriptionsByPlan.premium / totalUsers * 100) : 0}%"></div>
                </div>
              </div>
              <div>
                <div class="flex justify-between text-sm mb-1">
                  <span class="text-purple-400">Pro</span>
                  <span class="text-white">${subscriptionsByPlan.pro}</span>
                </div>
                <div class="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div class="h-full bg-purple-500 rounded-full"
                       style="width: ${totalUsers > 0 ? (subscriptionsByPlan.pro / totalUsers * 100) : 0}%"></div>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-white/5 rounded-xl p-6 border border-white/10">
            <h3 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              ⚡ Acciones Rápidas
            </h3>
            <div class="grid grid-cols-2 gap-3">
              <button onclick="window.adminPanelModal.switchTab('manual-activation')"
                      class="p-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-xl text-sm transition-colors text-left">
                <div class="font-semibold">🔑 Activar Usuario</div>
                <div class="text-xs text-slate-400">Activación manual</div>
              </button>
              <button onclick="window.adminPanelModal.exportUsers()"
                      class="p-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-xl text-sm transition-colors text-left">
                <div class="font-semibold">📥 Exportar</div>
                <div class="text-xs text-slate-400">Lista de usuarios</div>
              </button>
              <button onclick="window.adminPanelModal.switchTab('users')"
                      class="p-3 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-xl text-sm transition-colors text-left">
                <div class="font-semibold">👥 Ver Usuarios</div>
                <div class="text-xs text-slate-400">Gestión completa</div>
              </button>
              <button onclick="window.adminPanelModal.switchTab('ai-usage')"
                      class="p-3 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-xl text-sm transition-colors text-left">
                <div class="font-semibold">🤖 Uso de IA</div>
                <div class="text-xs text-slate-400">Ver estadísticas</div>
              </button>
            </div>
          </div>
        </div>

        <!-- Información del sistema -->
        <div class="bg-slate-800/50 rounded-xl p-4 border border-white/10">
          <h3 class="text-sm font-semibold text-white mb-3">ℹ️ Estado del Sistema</h3>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span class="text-slate-400">Supabase:</span>
              <span class="ml-2 ${window.supabaseClient ? 'text-green-400' : 'text-red-400'}">
                ${window.supabaseClient ? '✅ Conectado' : '❌ Desconectado'}
              </span>
            </div>
            <div>
              <span class="text-slate-400">Auth Helper:</span>
              <span class="ml-2 ${window.authHelper ? 'text-green-400' : 'text-yellow-400'}">
                ${window.authHelper ? '✅ Activo' : '⚠️ No cargado'}
              </span>
            </div>
            <div>
              <span class="text-slate-400">AI Premium:</span>
              <span class="ml-2 ${window.aiPremium ? 'text-green-400' : 'text-yellow-400'}">
                ${window.aiPremium ? '✅ Activo' : '⚠️ No cargado'}
              </span>
            </div>
            <div>
              <span class="text-slate-400">Stripe:</span>
              <span class="ml-2 text-yellow-400">⚠️ Pendiente config</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Renderizar lista de usuarios
   */
  async renderUsers() {
    try {
      const supabase = window.supabaseClient;
      if (!supabase) return this.renderDashboardError('Supabase no disponible');

      // Construir query
      let query = supabase
        .from('profiles')
        .select(`
          *,
          subscriptions (plan, status, current_period_end),
          ai_usage (credits_used, monthly_limit)
        `)
        .order('created_at', { ascending: false });

      // Aplicar búsqueda
      if (this.searchQuery) {
        query = query.or(`email.ilike.%${this.searchQuery}%,display_name.ilike.%${this.searchQuery}%`);
      }

      const { data: users, error } = await query;

      if (error) throw error;

      this.users = users || [];

      // Filtrar por plan si es necesario
      let filteredUsers = this.users;
      if (this.filterPlan !== 'all') {
        filteredUsers = this.users.filter(u => {
          const sub = u.subscriptions?.[0];
          if (this.filterPlan === 'free') return !sub || sub.status !== 'active';
          return sub?.plan === this.filterPlan && sub?.status === 'active';
        });
      }

      // Paginación
      const startIndex = (this.currentPage - 1) * this.usersPerPage;
      const paginatedUsers = filteredUsers.slice(startIndex, startIndex + this.usersPerPage);
      const totalPages = Math.ceil(filteredUsers.length / this.usersPerPage);

      return `
        <div class="space-y-4">
          <!-- Controles -->
          <div class="flex flex-wrap gap-4 items-center justify-between">
            <div class="flex gap-3 items-center">
              <div class="relative">
                <input type="text"
                       id="user-search"
                       placeholder="Buscar usuario..."
                       value="${this.searchQuery}"
                       class="pl-10 pr-4 py-2 bg-slate-700 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
              </div>
              <select id="plan-filter"
                      class="px-4 py-2 bg-slate-700 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500">
                <option value="all" ${this.filterPlan === 'all' ? 'selected' : ''}>Todos los planes</option>
                <option value="free" ${this.filterPlan === 'free' ? 'selected' : ''}>Gratuitos</option>
                <option value="premium" ${this.filterPlan === 'premium' ? 'selected' : ''}>Premium</option>
                <option value="pro" ${this.filterPlan === 'pro' ? 'selected' : ''}>Pro</option>
              </select>
            </div>
            <div class="text-sm text-slate-400">
              ${filteredUsers.length} usuarios encontrados
            </div>
          </div>

          <!-- Tabla de usuarios -->
          <div class="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead class="bg-slate-800/50">
                  <tr class="text-left text-xs text-slate-400 uppercase">
                    <th class="p-4">Usuario</th>
                    <th class="p-4">Plan</th>
                    <th class="p-4">Créditos IA</th>
                    <th class="p-4">Registro</th>
                    <th class="p-4">Acciones</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-white/5">
                  ${paginatedUsers.map(user => this.renderUserRow(user)).join('')}
                  ${paginatedUsers.length === 0 ? `
                    <tr>
                      <td colspan="5" class="p-8 text-center text-slate-400">
                        No se encontraron usuarios
                      </td>
                    </tr>
                  ` : ''}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Paginación -->
          ${totalPages > 1 ? `
            <div class="flex items-center justify-center gap-2">
              <button onclick="window.adminPanelModal.changePage(${this.currentPage - 1})"
                      class="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded text-sm disabled:opacity-50"
                      ${this.currentPage === 1 ? 'disabled' : ''}>
                ← Anterior
              </button>
              <span class="text-sm text-slate-400">
                Página ${this.currentPage} de ${totalPages}
              </span>
              <button onclick="window.adminPanelModal.changePage(${this.currentPage + 1})"
                      class="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded text-sm disabled:opacity-50"
                      ${this.currentPage === totalPages ? 'disabled' : ''}>
                Siguiente →
              </button>
            </div>
          ` : ''}
        </div>
      `;
    } catch (error) {
      console.error('Error cargando usuarios:', error);
      return this.renderDashboardError(error.message);
    }
  }

  /**
   * Renderizar fila de usuario
   */
  renderUserRow(user) {
    const subscription = user.subscriptions?.[0];
    const aiUsage = user.ai_usage?.[0];
    const plan = subscription?.status === 'active' ? subscription.plan : 'free';
    const planColors = {
      free: 'text-slate-400 bg-slate-500/20',
      premium: 'text-amber-400 bg-amber-500/20',
      pro: 'text-purple-400 bg-purple-500/20'
    };

    const createdDate = new Date(user.created_at).toLocaleDateString('es-ES');

    return `
      <tr class="hover:bg-white/5 transition-colors">
        <td class="p-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold">
              ${(user.display_name || user.email || '?')[0].toUpperCase()}
            </div>
            <div>
              <div class="font-medium text-white">${user.display_name || 'Sin nombre'}</div>
              <div class="text-sm text-slate-400">${user.email || 'Sin email'}</div>
            </div>
          </div>
        </td>
        <td class="p-4">
          <span class="px-2 py-1 rounded-full text-xs font-medium ${planColors[plan]}">
            ${plan.charAt(0).toUpperCase() + plan.slice(1)}
          </span>
          ${user.role === 'admin' ? '<span class="ml-2 text-xs text-red-400">👑 Admin</span>' : ''}
        </td>
        <td class="p-4">
          <div class="text-white">${aiUsage?.credits_used || 0} / ${aiUsage?.monthly_limit || 50}</div>
          <div class="text-xs text-slate-400">créditos usados</div>
        </td>
        <td class="p-4 text-sm text-slate-400">
          ${createdDate}
        </td>
        <td class="p-4">
          <div class="flex gap-2">
            <button onclick="window.adminPanelModal.showUserDetails('${user.id}')"
                    class="p-2 hover:bg-white/10 rounded-lg transition-colors text-blue-400"
                    title="Ver detalles">
              👁️
            </button>
            <button onclick="window.adminPanelModal.editUserPlan('${user.id}', '${user.email}')"
                    class="p-2 hover:bg-white/10 rounded-lg transition-colors text-amber-400"
                    title="Cambiar plan">
              ⭐
            </button>
            <button onclick="window.adminPanelModal.resetUserCredits('${user.id}')"
                    class="p-2 hover:bg-white/10 rounded-lg transition-colors text-cyan-400"
                    title="Resetear créditos">
              🔄
            </button>
          </div>
        </td>
      </tr>
    `;
  }

  /**
   * Renderizar pestaña de activación manual
   */
  renderManualActivation() {
    return `
      <div class="max-w-2xl mx-auto space-y-6">
        <div class="text-center mb-8">
          <div class="text-4xl mb-4">🔑</div>
          <h3 class="text-xl font-bold text-white mb-2">Activación Manual de Suscripción</h3>
          <p class="text-slate-400">
            Activa manualmente una suscripción Premium o Pro para usuarios que hayan pagado por PayPal u otros métodos.
          </p>
        </div>

        <div class="bg-white/5 rounded-xl p-6 border border-white/10 space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2">Email del usuario *</label>
            <input type="email"
                   id="manual-activation-email"
                   placeholder="usuario@ejemplo.com"
                   class="w-full px-4 py-3 bg-slate-700 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500">
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2">Plan a activar *</label>
            <div class="grid grid-cols-2 gap-4">
              <label class="cursor-pointer">
                <input type="radio" name="activation-plan" value="premium" class="sr-only peer" checked>
                <div class="p-4 bg-slate-700 border-2 border-transparent peer-checked:border-amber-500 rounded-xl transition-all">
                  <div class="text-amber-400 font-bold">⭐ Premium</div>
                  <div class="text-sm text-slate-400">9,99€/mes • 500 créditos IA</div>
                </div>
              </label>
              <label class="cursor-pointer">
                <input type="radio" name="activation-plan" value="pro" class="sr-only peer">
                <div class="p-4 bg-slate-700 border-2 border-transparent peer-checked:border-purple-500 rounded-xl transition-all">
                  <div class="text-purple-400 font-bold">👑 Pro</div>
                  <div class="text-sm text-slate-400">19,99€/mes • 2000 créditos IA</div>
                </div>
              </label>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2">Duración</label>
            <select id="manual-activation-duration"
                    class="w-full px-4 py-3 bg-slate-700 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500">
              <option value="1">1 mes</option>
              <option value="3">3 meses</option>
              <option value="6">6 meses</option>
              <option value="12">12 meses</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2">Notas (opcional)</label>
            <textarea id="manual-activation-notes"
                      placeholder="Ej: Pago por PayPal, referencia #12345"
                      rows="2"
                      class="w-full px-4 py-3 bg-slate-700 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"></textarea>
          </div>

          <button id="manual-activation-submit"
                  class="w-full py-3 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-semibold rounded-xl transition-all">
            🔓 Activar Suscripción
          </button>
        </div>

        <div class="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
          <h4 class="font-semibold text-amber-400 mb-2">⚠️ Importante</h4>
          <ul class="text-sm text-slate-300 space-y-1">
            <li>• Verifica que el pago se haya recibido antes de activar</li>
            <li>• El usuario debe tener una cuenta creada con ese email</li>
            <li>• La suscripción se activará inmediatamente</li>
            <li>• Se enviará un email de confirmación al usuario</li>
          </ul>
        </div>
      </div>
    `;
  }

  /**
   * Renderizar uso de IA
   */
  async renderAIUsage() {
    try {
      const supabase = window.supabaseClient;
      if (!supabase) return this.renderDashboardError('Supabase no disponible');

      const { data: usage, error } = await supabase
        .from('ai_usage')
        .select(`
          *,
          profiles (email, display_name)
        `)
        .order('credits_used', { ascending: false })
        .limit(50);

      if (error) throw error;

      const totalUsed = usage?.reduce((sum, u) => sum + (u.credits_used || 0), 0) || 0;

      return `
        <div class="space-y-6">
          <!-- Resumen -->
          <div class="grid grid-cols-3 gap-4">
            <div class="bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 rounded-xl p-4 border border-cyan-500/30">
              <div class="text-3xl font-bold text-cyan-400">${totalUsed.toLocaleString()}</div>
              <div class="text-sm text-slate-400">Créditos totales usados</div>
            </div>
            <div class="bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-xl p-4 border border-purple-500/30">
              <div class="text-3xl font-bold text-purple-400">${usage?.length || 0}</div>
              <div class="text-sm text-slate-400">Usuarios activos con IA</div>
            </div>
            <div class="bg-gradient-to-br from-green-500/20 to-green-600/10 rounded-xl p-4 border border-green-500/30">
              <div class="text-3xl font-bold text-green-400">${usage?.length > 0 ? Math.round(totalUsed / usage.length) : 0}</div>
              <div class="text-sm text-slate-400">Promedio por usuario</div>
            </div>
          </div>

          <!-- Top usuarios -->
          <div class="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
            <div class="p-4 border-b border-white/10 bg-slate-800/50">
              <h3 class="font-semibold text-white">Top 50 usuarios por uso de IA</h3>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead class="bg-slate-800/30">
                  <tr class="text-left text-xs text-slate-400 uppercase">
                    <th class="p-3">#</th>
                    <th class="p-3">Usuario</th>
                    <th class="p-3">Créditos Usados</th>
                    <th class="p-3">Límite</th>
                    <th class="p-3">% Usado</th>
                    <th class="p-3">Último uso</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-white/5">
                  ${usage?.map((u, i) => `
                    <tr class="hover:bg-white/5">
                      <td class="p-3 text-slate-400">${i + 1}</td>
                      <td class="p-3">
                        <div class="font-medium text-white">${u.profiles?.display_name || 'Sin nombre'}</div>
                        <div class="text-xs text-slate-400">${u.profiles?.email || ''}</div>
                      </td>
                      <td class="p-3 text-cyan-400 font-medium">${u.credits_used || 0}</td>
                      <td class="p-3 text-slate-400">${u.monthly_limit || 50}</td>
                      <td class="p-3">
                        <div class="flex items-center gap-2">
                          <div class="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div class="h-full bg-cyan-500 rounded-full"
                                 style="width: ${Math.min(100, (u.credits_used || 0) / (u.monthly_limit || 50) * 100)}%"></div>
                          </div>
                          <span class="text-xs text-slate-400">${Math.round((u.credits_used || 0) / (u.monthly_limit || 50) * 100)}%</span>
                        </div>
                      </td>
                      <td class="p-3 text-sm text-slate-400">
                        ${u.last_used_at ? new Date(u.last_used_at).toLocaleDateString('es-ES') : '-'}
                      </td>
                    </tr>
                  `).join('') || `
                    <tr>
                      <td colspan="6" class="p-8 text-center text-slate-400">
                        No hay datos de uso de IA
                      </td>
                    </tr>
                  `}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
    } catch (error) {
      console.error('Error cargando uso de IA:', error);
      return this.renderDashboardError(error.message);
    }
  }

  /**
   * Renderizar configuración
   */
  renderSettings() {
    return `
      <div class="max-w-2xl mx-auto space-y-6">
        <h3 class="text-xl font-bold text-white mb-6">⚙️ Configuración del Sistema</h3>

        <!-- Supabase -->
        <div class="bg-white/5 rounded-xl p-6 border border-white/10">
          <h4 class="font-semibold text-white mb-4 flex items-center gap-2">
            <span class="text-green-400">🔌</span> Supabase
          </h4>
          <div class="space-y-3 text-sm">
            <div class="flex justify-between items-center p-3 bg-slate-700/50 rounded-lg">
              <span class="text-slate-300">Estado de conexión</span>
              <span class="${window.supabaseClient ? 'text-green-400' : 'text-red-400'}">
                ${window.supabaseClient ? '✅ Conectado' : '❌ Desconectado'}
              </span>
            </div>
            <div class="flex justify-between items-center p-3 bg-slate-700/50 rounded-lg">
              <span class="text-slate-300">URL del proyecto</span>
              <span class="text-slate-400 text-xs truncate max-w-[200px]">
                ${window.SUPABASE_URL || 'No configurado'}
              </span>
            </div>
          </div>
        </div>

        <!-- Stripe -->
        <div class="bg-white/5 rounded-xl p-6 border border-white/10">
          <h4 class="font-semibold text-white mb-4 flex items-center gap-2">
            <span class="text-purple-400">💳</span> Stripe
          </h4>
          <div class="space-y-3 text-sm">
            <div class="flex justify-between items-center p-3 bg-slate-700/50 rounded-lg">
              <span class="text-slate-300">Estado</span>
              <span class="text-yellow-400">⚠️ Pendiente de configurar</span>
            </div>
            <p class="text-slate-400 text-sm">
              Para activar pagos automáticos, configura las claves de Stripe en las variables de entorno:
            </p>
            <div class="bg-slate-800 rounded-lg p-3 font-mono text-xs text-slate-300">
              STRIPE_PUBLIC_KEY=pk_live_xxx<br>
              STRIPE_SECRET_KEY=sk_live_xxx<br>
              STRIPE_WEBHOOK_SECRET=whsec_xxx
            </div>
          </div>
        </div>

        <!-- IA -->
        <div class="bg-white/5 rounded-xl p-6 border border-white/10">
          <h4 class="font-semibold text-white mb-4 flex items-center gap-2">
            <span class="text-cyan-400">🤖</span> Configuración de IA
          </h4>
          <div class="space-y-3 text-sm">
            <div class="flex justify-between items-center p-3 bg-slate-700/50 rounded-lg">
              <span class="text-slate-300">AI Premium Module</span>
              <span class="${window.aiPremium ? 'text-green-400' : 'text-yellow-400'}">
                ${window.aiPremium ? '✅ Cargado' : '⚠️ No cargado'}
              </span>
            </div>
            <div class="flex justify-between items-center p-3 bg-slate-700/50 rounded-lg">
              <span class="text-slate-300">Créditos gratuitos por usuario</span>
              <span class="text-slate-400">50</span>
            </div>
            <div class="flex justify-between items-center p-3 bg-slate-700/50 rounded-lg">
              <span class="text-slate-300">Créditos Premium</span>
              <span class="text-amber-400">500</span>
            </div>
            <div class="flex justify-between items-center p-3 bg-slate-700/50 rounded-lg">
              <span class="text-slate-300">Créditos Pro</span>
              <span class="text-purple-400">2000</span>
            </div>
          </div>
        </div>

        <!-- Acciones de mantenimiento -->
        <div class="bg-red-500/10 rounded-xl p-6 border border-red-500/20">
          <h4 class="font-semibold text-red-400 mb-4 flex items-center gap-2">
            ⚠️ Zona de Peligro
          </h4>
          <div class="space-y-3">
            <button onclick="window.adminPanelModal.resetAllMonthlyCredits()"
                    class="w-full py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-lg text-sm transition-colors">
              🔄 Resetear créditos mensuales de todos los usuarios
            </button>
            <p class="text-xs text-slate-400">
              Esto reiniciará los contadores de créditos IA de todos los usuarios. Usar solo al inicio de cada mes.
            </p>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Renderizar error
   */
  renderDashboardError(message) {
    return `
      <div class="flex items-center justify-center h-64">
        <div class="text-center">
          <div class="text-5xl mb-4">⚠️</div>
          <h3 class="text-xl font-bold text-red-400 mb-2">Error al cargar datos</h3>
          <p class="text-slate-400">${message}</p>
          <button onclick="window.adminPanelModal.loadDashboardData()"
                  class="mt-4 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors">
            Reintentar
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Renderizar contenido en el área principal
   */
  renderContent(html) {
    const contentEl = document.getElementById('admin-panel-content');
    if (contentEl) {
      contentEl.innerHTML = html;
      this.attachTabSpecificListeners();
    }
  }

  /**
   * Cambiar de pestaña
   */
  async switchTab(tabId) {
    this.currentTab = tabId;
    this.currentPage = 1;

    // Actualizar tabs visualmente
    document.querySelectorAll('.admin-tab').forEach(tab => {
      const isActive = tab.dataset.tab === tabId;
      tab.classList.toggle('text-purple-400', isActive);
      tab.classList.toggle('border-b-2', isActive);
      tab.classList.toggle('border-purple-400', isActive);
      tab.classList.toggle('bg-purple-500/10', isActive);
      tab.classList.toggle('text-slate-400', !isActive);
    });

    // Mostrar loading
    this.renderContent(`
      <div class="flex items-center justify-center h-64">
        <div class="text-center">
          <div class="animate-spin text-4xl mb-4">⏳</div>
          <p class="text-slate-400">Cargando...</p>
        </div>
      </div>
    `);

    // Cargar contenido
    let content;
    switch (tabId) {
      case 'dashboard':
        await this.loadDashboardData();
        return;
      case 'users':
        content = await this.renderUsers();
        break;
      case 'subscriptions':
        content = await this.renderUsers(); // Usar la misma vista filtrada
        break;
      case 'ai-usage':
        content = await this.renderAIUsage();
        break;
      case 'manual-activation':
        content = this.renderManualActivation();
        break;
      case 'settings':
        content = this.renderSettings();
        break;
      default:
        content = this.renderDashboard();
    }

    this.renderContent(content);
  }

  /**
   * Adjuntar event listeners
   */
  attachEventListeners() {
    // Cerrar modal
    document.getElementById('admin-panel-backdrop')?.addEventListener('click', () => this.hide());
    document.getElementById('admin-panel-close')?.addEventListener('click', () => this.hide());

    // Tabs
    document.querySelectorAll('.admin-tab').forEach(tab => {
      tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
    });

    // Escape para cerrar
    this.escapeHandler = (e) => {
      if (e.key === 'Escape') this.hide();
    };
    document.addEventListener('keydown', this.escapeHandler);
  }

  /**
   * Adjuntar listeners específicos de cada tab
   */
  attachTabSpecificListeners() {
    // Búsqueda de usuarios
    const searchInput = document.getElementById('user-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        this.currentPage = 1;
        this.switchTab('users');
      });
    }

    // Filtro de plan
    const planFilter = document.getElementById('plan-filter');
    if (planFilter) {
      planFilter.addEventListener('change', (e) => {
        this.filterPlan = e.target.value;
        this.currentPage = 1;
        this.switchTab('users');
      });
    }

    // Activación manual
    const activationBtn = document.getElementById('manual-activation-submit');
    if (activationBtn) {
      activationBtn.addEventListener('click', () => this.processManualActivation());
    }
  }

  /**
   * Procesar activación manual
   */
  async processManualActivation() {
    const email = document.getElementById('manual-activation-email')?.value?.trim();
    const plan = document.querySelector('input[name="activation-plan"]:checked')?.value;
    const duration = parseInt(document.getElementById('manual-activation-duration')?.value || '1');
    const notes = document.getElementById('manual-activation-notes')?.value?.trim();

    if (!email) {
      alert('Por favor, introduce el email del usuario');
      return;
    }

    try {
      const supabase = window.supabaseClient;
      if (!supabase) throw new Error('Supabase no disponible');

      // Buscar usuario
      const { data: user, error: userError } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', email)
        .single();

      if (userError || !user) {
        alert(`No se encontró un usuario con el email: ${email}`);
        return;
      }

      // Calcular fecha de expiración
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + duration);

      // Crear o actualizar suscripción
      const { error: subError } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: user.id,
          plan: plan,
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: endDate.toISOString(),
          payment_method: 'manual',
          notes: notes || `Activación manual por admin - ${new Date().toLocaleDateString('es-ES')}`
        }, {
          onConflict: 'user_id'
        });

      if (subError) throw subError;

      // Actualizar créditos de IA
      const monthlyLimit = plan === 'pro' ? 2000 : 500;
      await supabase
        .from('ai_usage')
        .upsert({
          user_id: user.id,
          credits_used: 0,
          monthly_limit: monthlyLimit
        }, {
          onConflict: 'user_id'
        });

      alert(`✅ Suscripción ${plan.toUpperCase()} activada para ${email}\nDuración: ${duration} mes(es)\nExpira: ${endDate.toLocaleDateString('es-ES')}`);

      // Limpiar formulario
      document.getElementById('manual-activation-email').value = '';
      document.getElementById('manual-activation-notes').value = '';

    } catch (error) {
      console.error('Error en activación manual:', error);
      alert(`Error: ${error.message}`);
    }
  }

  /**
   * Cambiar página
   */
  changePage(page) {
    if (page < 1) return;
    this.currentPage = page;
    this.switchTab('users');
  }

  /**
   * Editar plan de usuario
   */
  async editUserPlan(userId, userEmail) {
    const plan = prompt(`Cambiar plan para ${userEmail}\n\nOpciones:\n- free\n- premium\n- pro\n\nIntroduce el nuevo plan:`);

    if (!plan || !['free', 'premium', 'pro'].includes(plan.toLowerCase())) {
      return;
    }

    try {
      const supabase = window.supabaseClient;

      if (plan.toLowerCase() === 'free') {
        // Cancelar suscripción
        await supabase
          .from('subscriptions')
          .update({ status: 'cancelled' })
          .eq('user_id', userId);
      } else {
        // Activar suscripción
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 1);

        await supabase
          .from('subscriptions')
          .upsert({
            user_id: userId,
            plan: plan.toLowerCase(),
            status: 'active',
            current_period_start: new Date().toISOString(),
            current_period_end: endDate.toISOString(),
            payment_method: 'manual'
          }, {
            onConflict: 'user_id'
          });

        // Actualizar créditos
        const monthlyLimit = plan === 'pro' ? 2000 : 500;
        await supabase
          .from('ai_usage')
          .upsert({
            user_id: userId,
            monthly_limit: monthlyLimit
          }, {
            onConflict: 'user_id'
          });
      }

      alert('Plan actualizado correctamente');
      this.switchTab('users');
    } catch (error) {
      console.error('Error actualizando plan:', error);
      alert(`Error: ${error.message}`);
    }
  }

  /**
   * Resetear créditos de usuario
   */
  async resetUserCredits(userId) {
    if (!confirm('¿Resetear los créditos de IA de este usuario?')) return;

    try {
      const supabase = window.supabaseClient;
      await supabase
        .from('ai_usage')
        .update({ credits_used: 0 })
        .eq('user_id', userId);

      alert('Créditos reseteados');
      this.switchTab('users');
    } catch (error) {
      console.error('Error reseteando créditos:', error);
      alert(`Error: ${error.message}`);
    }
  }

  /**
   * Resetear créditos mensuales de todos
   */
  async resetAllMonthlyCredits() {
    if (!confirm('¿Estás seguro de resetear los créditos de TODOS los usuarios?\n\nEsto reiniciará el contador de créditos IA a 0 para todos.')) return;

    try {
      const supabase = window.supabaseClient;
      const { error } = await supabase
        .from('ai_usage')
        .update({ credits_used: 0 });

      if (error) throw error;

      alert('✅ Créditos mensuales reseteados para todos los usuarios');
    } catch (error) {
      console.error('Error reseteando créditos:', error);
      alert(`Error: ${error.message}`);
    }
  }

  /**
   * Exportar usuarios
   */
  async exportUsers() {
    try {
      const supabase = window.supabaseClient;
      const { data: users, error } = await supabase
        .from('profiles')
        .select(`
          id, email, display_name, created_at, role,
          subscriptions (plan, status)
        `);

      if (error) throw error;

      // Crear CSV
      const headers = ['ID', 'Email', 'Nombre', 'Plan', 'Estado', 'Rol', 'Fecha Registro'];
      const rows = users.map(u => [
        u.id,
        u.email || '',
        u.display_name || '',
        u.subscriptions?.[0]?.plan || 'free',
        u.subscriptions?.[0]?.status || 'none',
        u.role || 'user',
        new Date(u.created_at).toLocaleDateString('es-ES')
      ]);

      const csv = [headers, ...rows].map(row => row.join(',')).join('\n');

      // Descargar
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `usuarios-nuevo-ser-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error exportando usuarios:', error);
      alert(`Error: ${error.message}`);
    }
  }

  /**
   * Obtener icono
   */
  getIcon(name) {
    if (window.Icons && typeof window.Icons.create === 'function') {
      return window.Icons.create(name, 24);
    }
    return '×';
  }

  /**
   * Ocultar modal
   */
  hide() {
    if (this.escapeHandler) {
      document.removeEventListener('keydown', this.escapeHandler);
    }
    this.modal?.remove();
    this.modal = null;
  }
}

// Crear instancia global
window.adminPanelModal = new AdminPanelModal();

console.log('🛡️ AdminPanelModal inicializado');
