/**
 * ADMIN DEBUG PANEL
 * Panel de debug solo para admin - Ver logs, errores, estado de features
 *
 * @version 1.0.0
 */

class AdminDebugPanel {
  constructor() {
    this.isOpen = false;
    this.apiUrl = window.ENV?.ADMIN_DEBUG_API || 'https://gailu.net/api/admin-debug-api.php';
    this.adminToken = this.generateAdminToken();
    this.currentTab = 'health';
    this.refreshInterval = null;
  }

  /**
   * Generar token de admin (hash SHA256 de email)
   */
  generateAdminToken() {
    // En producción, esto vendría del servidor
    // Por ahora usamos hash simple del email admin
    return 'debug-token'; // Placeholder - el servidor verificará correctamente
  }

  /**
   * Abrir panel
   */
  async open() {
    if (this.isOpen) return;
    this.isOpen = true;

    // Crear modal
    this.render();

    // Auto-refresh cada 10 segundos
    this.startAutoRefresh();
  }

  /**
   * Cerrar panel
   */
  close() {
    this.isOpen = false;
    this.stopAutoRefresh();

    const modal = document.getElementById('admin-debug-modal');
    if (modal) {
      modal.remove();
    }
  }

  /**
   * Renderizar panel
   */
  render() {
    const existing = document.getElementById('admin-debug-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'admin-debug-modal';
    modal.className = 'fixed inset-0 z-[10000] bg-black/50 flex items-center justify-center p-4';
    modal.innerHTML = `
      <div class="bg-slate-900 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-slate-700">
        <!-- Header -->
        <div class="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4 flex items-center justify-between rounded-t-lg">
          <div class="flex items-center gap-2">
            <span class="text-2xl">🔧</span>
            <h2 class="text-xl font-bold text-white">Panel Admin Debug</h2>
            <span class="ml-2 text-xs bg-black/30 px-2 py-1 rounded">v2.9.387</span>
          </div>
          <button id="close-admin-debug" class="p-2 hover:bg-white/10 rounded-lg text-white">
            ✕
          </button>
        </div>

        <!-- Tabs -->
        <div class="flex gap-1 px-6 pt-4 border-b border-slate-700 overflow-x-auto">
          ${['health', 'features', 'logs', 'errors', 'stats'].map(tab => `
            <button class="admin-debug-tab px-4 py-2 rounded-t-lg font-medium transition-colors ${
              tab === this.currentTab
                ? 'bg-purple-600 text-white'
                : 'bg-slate-800 text-gray-400 hover:text-white'
            }" data-tab="${tab}">
              ${this.getTabLabel(tab)}
            </button>
          `).join('')}
        </div>

        <!-- Content -->
        <div id="admin-debug-content" class="flex-1 overflow-y-auto p-6 space-y-4">
          <div class="text-center text-gray-400">Cargando...</div>
        </div>

        <!-- Footer -->
        <div class="border-t border-slate-700 px-6 py-3 text-xs text-gray-400 flex items-center justify-between">
          <span>Auto-refresh: cada 10s</span>
          <button id="admin-debug-refresh" class="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs">
            🔄 Refrescar
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this.attachListeners();
    this.loadTab('health');
  }

  /**
   * Obtener label del tab
   */
  getTabLabel(tab) {
    const labels = {
      health: '🏥 Salud',
      features: '✨ Features',
      logs: '📝 Logs',
      errors: '❌ Errores',
      stats: '📊 Estadísticas'
    };
    return labels[tab] || tab;
  }

  /**
   * Cargar contenido del tab
   */
  async loadTab(tab) {
    this.currentTab = tab;
    const content = document.getElementById('admin-debug-content');

    try {
      const url = `${this.apiUrl}?action=${tab}`;
      const response = await fetch(url);
      const data = await response.json();

      content.innerHTML = this.renderTabContent(tab, data);

    } catch (error) {
      content.innerHTML = `<div class="text-red-400">Error cargando: ${error.message}</div>`;
    }
  }

  /**
   * Renderizar contenido del tab
   */
  renderTabContent(tab, data) {
    switch (tab) {
      case 'health':
        return this.renderHealth(data);
      case 'features':
        return this.renderFeatures(data);
      case 'logs':
        return this.renderLogs(data);
      case 'errors':
        return this.renderErrors(data);
      case 'stats':
        return this.renderStats(data);
      default:
        return '<div>Tab desconocido</div>';
    }
  }

  /**
   * Renderizar Health
   */
  renderHealth(data) {
    if (!data.services) return 'No hay datos';

    return `
      <div class="space-y-3">
        <div class="text-sm text-gray-400 mb-4">Última actualización: ${data.timestamp}</div>
        ${Object.entries(data.services).map(([_key, service]) => `
          <div class="bg-slate-800 rounded p-4 border-l-4 ${
            service.status === 'ok' ? 'border-green-500' : 'border-red-500'
          }">
            <div class="flex items-center justify-between mb-2">
              <span class="font-medium text-white">${service.name}</span>
              <span class="text-xs px-2 py-1 rounded ${
                service.status === 'ok'
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-red-500/20 text-red-400'
              }">
                ${service.status === 'ok' ? '✓ OK' : '✗ Error'}
              </span>
            </div>
            <div class="text-xs text-gray-400 space-y-1">
              ${service.response_time ? `<div>Tiempo: ${service.response_time}</div>` : ''}
              ${service.http_code ? `<div>HTTP: ${service.http_code}</div>` : ''}
              ${service.model ? `<div>Modelo: ${service.model}</div>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  /**
   * Renderizar Features
   */
  renderFeatures(data) {
    if (!data.features) return 'No hay datos';

    return `
      <div class="space-y-2">
        ${Object.entries(data.features).map(([key, feature]) => `
          <div class="bg-slate-800 rounded p-3 flex items-center justify-between">
            <div>
              <div class="font-medium text-white">${feature.name}</div>
              <div class="text-xs text-gray-400">${key}</div>
            </div>
            <span class="text-xs px-2 py-1 rounded ${
              feature.enabled && feature.status === 'active'
                ? 'bg-green-500/20 text-green-400'
                : 'bg-yellow-500/20 text-yellow-400'
            }">
              ${feature.enabled ? '🟢 Activo' : '🔴 Inactivo'}
            </span>
          </div>
        `).join('')}
      </div>
    `;
  }

  /**
   * Renderizar Logs
   */
  renderLogs(data) {
    if (!data.logs || data.logs.length === 0) return 'Sin logs';

    return `
      <div class="space-y-2">
        <div class="text-xs text-gray-400">Total: ${data.total} logs</div>
        ${data.logs.slice(0, 20).map(log => `
          <div class="bg-slate-800 rounded p-2 text-xs font-mono border-l-2 ${
            log.level === 'ERROR' || log.level === 'CRITICAL'
              ? 'border-red-500'
              : log.level === 'WARNING'
              ? 'border-yellow-500'
              : 'border-blue-500'
          }">
            <div class="text-gray-300">${log.message}</div>
            <div class="text-gray-500 mt-1">${new Date(log.created_at).toLocaleString()} | ${log.source} | ${log.level}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  /**
   * Renderizar Errores
   */
  renderErrors(data) {
    if (!data.errors || data.errors.length === 0) return 'Sin errores registrados';

    return `
      <div class="space-y-2">
        <div class="text-xs text-gray-400">Total: ${data.total} errores</div>
        ${data.errors.slice(0, 20).map(error => `
          <div class="bg-red-900/20 rounded p-3 border border-red-500/50">
            <div class="flex items-center justify-between mb-2">
              <span class="font-medium text-red-300">${error.error_type}</span>
              <span class="text-xs bg-red-500/20 px-2 py-1 rounded">HTTP ${error.http_code}</span>
            </div>
            <div class="text-sm text-gray-300 mb-2">${error.error_message}</div>
            <div class="text-xs text-gray-500">${new Date(error.created_at).toLocaleString()}</div>
            ${error.details ? `<div class="text-xs text-gray-400 mt-1">Detalles: ${typeof error.details === 'string' ? error.details : JSON.stringify(error.details)}</div>` : ''}
          </div>
        `).join('')}
      </div>
    `;
  }

  /**
   * Renderizar Estadísticas
   */
  renderStats(_data) {
    return `
      <div class="grid grid-cols-2 gap-4">
        <div class="bg-slate-800 rounded p-4 text-center">
          <div class="text-3xl font-bold text-purple-400">−</div>
          <div class="text-xs text-gray-400 mt-1">Logs Totales</div>
        </div>
        <div class="bg-slate-800 rounded p-4 text-center">
          <div class="text-3xl font-bold text-red-400">−</div>
          <div class="text-xs text-gray-400 mt-1">Errores</div>
        </div>
        <div class="bg-slate-800 rounded p-4 text-center">
          <div class="text-3xl font-bold text-blue-400">−</div>
          <div class="text-xs text-gray-400 mt-1">Advertencias</div>
        </div>
        <div class="bg-slate-800 rounded p-4 text-center">
          <div class="text-3xl font-bold text-green-400">−</div>
          <div class="text-xs text-gray-400 mt-1">Info</div>
        </div>
      </div>
    `;
  }

  /**
   * Adjuntar listeners
   */
  attachListeners() {
    // Cerrar
    document.getElementById('close-admin-debug')?.addEventListener('click', () => this.close());

    // Cambiar tab
    document.querySelectorAll('.admin-debug-tab').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.loadTab(e.target.dataset.tab);
      });
    });

    // Refrescar manual
    document.getElementById('admin-debug-refresh')?.addEventListener('click', () => {
      this.loadTab(this.currentTab);
    });

    // Cerrar al hacer click fuera
    document.getElementById('admin-debug-modal')?.addEventListener('click', (e) => {
      if (e.target.id === 'admin-debug-modal') this.close();
    });
  }

  /**
   * Auto-refresh
   */
  startAutoRefresh() {
    this.refreshInterval = setInterval(() => {
      if (this.isOpen) {
        this.loadTab(this.currentTab);
      }
    }, 10000);
  }

  stopAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }
}

// Crear instancia global
window.adminDebugPanel = new AdminDebugPanel();
logger.debug('✅ AdminDebugPanel loaded');
