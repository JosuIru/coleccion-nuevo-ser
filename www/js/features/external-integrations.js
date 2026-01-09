// ============================================================================
// EXTERNAL INTEGRATIONS - Integraciones con Servicios Externos
// ============================================================================
// v2.9.330: Exportar a Notion, Google Calendar, y más
// Permite conectar la app con herramientas de productividad

class ExternalIntegrations {
  constructor() {
    this.modalElement = null;
    this.connections = this.loadConnections();

    // Integraciones disponibles
    this.integrations = {
      notion: {
        id: 'notion',
        name: 'Notion',
        icon: '📝',
        description: 'Exporta tus notas y reflexiones a Notion',
        color: 'bg-gray-800',
        features: ['Exportar notas', 'Exportar reflexiones', 'Crear base de datos de lectura']
      },
      calendar: {
        id: 'calendar',
        name: 'Google Calendar',
        icon: '📅',
        description: 'Programa recordatorios de lectura',
        color: 'bg-blue-600',
        features: ['Recordatorios diarios', 'Metas de lectura', 'Sesiones programadas']
      },
      todoist: {
        id: 'todoist',
        name: 'Todoist',
        icon: '✅',
        description: 'Convierte tus planes de acción en tareas',
        color: 'bg-red-600',
        features: ['Exportar planes de acción', 'Crear proyectos', 'Seguimiento de tareas']
      },
      obsidian: {
        id: 'obsidian',
        name: 'Obsidian',
        icon: '💎',
        description: 'Exporta notas en formato Markdown',
        color: 'bg-purple-700',
        features: ['Exportar en Markdown', 'Estructura de carpetas', 'Links entre notas']
      }
    };
  }

  // ==========================================================================
  // PERSISTENCIA
  // ==========================================================================

  loadConnections() {
    try {
      return JSON.parse(localStorage.getItem('external-connections')) || {};
    } catch {
      return {};
    }
  }

  saveConnections() {
    localStorage.setItem('external-connections', JSON.stringify(this.connections));
  }

  // ==========================================================================
  // CONEXIONES
  // ==========================================================================

  isConnected(integrationId) {
    return !!this.connections[integrationId]?.connected;
  }

  /**
   * Conectar con una integración (simulado - requiere OAuth real en producción)
   */
  async connect(integrationId) {
    const integration = this.integrations[integrationId];
    if (!integration) return;

    // En producción, esto abriría un flujo OAuth
    // Por ahora, simulamos la conexión
    window.toast?.info(`Conectando con ${integration.name}...`);

    // Simular delay de autenticación
    await new Promise(resolve => setTimeout(resolve, 1500));

    this.connections[integrationId] = {
      connected: true,
      connectedAt: new Date().toISOString(),
      // En producción, guardaríamos tokens aquí
      accessToken: `simulated-token-${Date.now()}`
    };

    this.saveConnections();
    window.toast?.success(`Conectado con ${integration.name}`);
    this.updateUI();
  }

  disconnect(integrationId) {
    const integration = this.integrations[integrationId];
    if (!integration) return;

    delete this.connections[integrationId];
    this.saveConnections();

    window.toast?.info(`Desconectado de ${integration.name}`);
    this.updateUI();
  }

  // ==========================================================================
  // EXPORTACIÓN A NOTION
  // ==========================================================================

  async exportToNotion(data, type = 'notes') {
    if (!this.isConnected('notion')) {
      window.toast?.error('Conecta primero con Notion');
      return;
    }

    window.toast?.info('Exportando a Notion...');

    try {
      // En producción, esto llamaría a la API de Notion
      // Por ahora, generamos el contenido y lo copiamos

      let content = '';

      if (type === 'notes') {
        content = this.formatNotesForNotion(data);
      } else if (type === 'reflections') {
        content = this.formatReflectionsForNotion(data);
      } else if (type === 'progress') {
        content = this.formatProgressForNotion(data);
      }

      // Copiar al portapapeles como fallback
      await navigator.clipboard.writeText(content);

      window.toast?.success('Contenido copiado. Pega en Notion.');
      return content;
    } catch (error) {
      logger.error('[Integrations] Error exporting to Notion:', error);
      window.toast?.error('Error al exportar');
    }
  }

  formatNotesForNotion(notes) {
    let markdown = '# Mis Notas de Lectura\n\n';
    markdown += `*Exportado el ${new Date().toLocaleDateString('es-ES')}*\n\n`;
    markdown += '---\n\n';

    if (Array.isArray(notes)) {
      notes.forEach(note => {
        markdown += `## ${note.chapterTitle || 'Nota'}\n`;
        markdown += `📅 ${new Date(note.createdAt).toLocaleDateString('es-ES')}\n\n`;
        markdown += `${note.content}\n\n`;
        markdown += '---\n\n';
      });
    }

    return markdown;
  }

  formatReflectionsForNotion(reflections) {
    let markdown = '# Mis Reflexiones\n\n';
    markdown += `*Colección Nuevo Ser*\n\n`;
    markdown += '---\n\n';

    Object.entries(reflections).forEach(([key, reflection]) => {
      markdown += `## Día ${key}\n`;
      markdown += `${reflection.text}\n\n`;
      markdown += `*${new Date(reflection.savedAt).toLocaleDateString('es-ES')}*\n\n`;
      markdown += '---\n\n';
    });

    return markdown;
  }

  formatProgressForNotion(progress) {
    let markdown = '# Mi Progreso de Lectura\n\n';
    markdown += '| Libro | Progreso | Capítulos |\n';
    markdown += '|-------|----------|----------|\n';

    if (Array.isArray(progress)) {
      progress.forEach(p => {
        markdown += `| ${p.title} | ${p.percentage}% | ${p.chaptersRead}/${p.totalChapters} |\n`;
      });
    }

    return markdown;
  }

  // ==========================================================================
  // EXPORTACIÓN A OBSIDIAN
  // ==========================================================================

  async exportToObsidian(data, type = 'notes') {
    window.toast?.info('Generando archivo Markdown...');

    try {
      let content = '';
      let filename = '';

      if (type === 'notes') {
        content = this.formatNotesForObsidian(data);
        filename = `notas-nuevo-ser-${Date.now()}.md`;
      } else if (type === 'all') {
        content = this.formatAllForObsidian(data);
        filename = `coleccion-nuevo-ser-${Date.now()}.md`;
      }

      // Descargar como archivo
      this.downloadFile(content, filename, 'text/markdown');

      window.toast?.success('Archivo descargado. Impórtalo en Obsidian.');
    } catch (error) {
      logger.error('[Integrations] Error exporting to Obsidian:', error);
      window.toast?.error('Error al exportar');
    }
  }

  formatNotesForObsidian(notes) {
    let md = '---\n';
    md += 'tags: [coleccion-nuevo-ser, notas]\n';
    md += `created: ${new Date().toISOString()}\n`;
    md += '---\n\n';
    md += '# Notas de Lectura\n\n';

    if (Array.isArray(notes)) {
      notes.forEach(note => {
        md += `## ${note.chapterTitle || 'Nota'}\n\n`;
        md += `${note.content}\n\n`;
        if (note.tags) {
          md += `Tags: ${note.tags.map(t => `#${t}`).join(' ')}\n\n`;
        }
        md += '---\n\n';
      });
    }

    return md;
  }

  formatAllForObsidian(data) {
    let md = '---\n';
    md += 'tags: [coleccion-nuevo-ser]\n';
    md += `exported: ${new Date().toISOString()}\n`;
    md += '---\n\n';
    md += '# Mi Viaje con Colección Nuevo Ser\n\n';

    // Progreso
    if (data.progress) {
      md += '## Progreso de Lectura\n\n';
      data.progress.forEach(p => {
        md += `- **${p.title}**: ${p.percentage}% (${p.chaptersRead}/${p.totalChapters})\n`;
      });
      md += '\n';
    }

    // Notas
    if (data.notes?.length > 0) {
      md += '## Notas\n\n';
      data.notes.forEach(note => {
        md += `### ${note.chapterTitle || 'Nota'}\n`;
        md += `${note.content}\n\n`;
      });
    }

    // Logros
    if (data.achievements?.length > 0) {
      md += '## Logros Desbloqueados\n\n';
      data.achievements.forEach(a => {
        md += `- ${a.icon || '🏆'} **${a.title}**: ${a.description}\n`;
      });
      md += '\n';
    }

    return md;
  }

  // ==========================================================================
  // CALENDARIO
  // ==========================================================================

  async addToCalendar(event) {
    const { title, description, date, duration = 30 } = event;

    // Generar URL de Google Calendar
    const startDate = new Date(date);
    const endDate = new Date(startDate.getTime() + duration * 60000);

    const formatDate = (d) => d.toISOString().replace(/-|:|\.\d+/g, '');

    const calendarUrl = new URL('https://calendar.google.com/calendar/render');
    calendarUrl.searchParams.set('action', 'TEMPLATE');
    calendarUrl.searchParams.set('text', title);
    calendarUrl.searchParams.set('details', description);
    calendarUrl.searchParams.set('dates', `${formatDate(startDate)}/${formatDate(endDate)}`);

    // Abrir en nueva pestaña
    window.open(calendarUrl.toString(), '_blank');

    window.toast?.success('Abriendo Google Calendar...');
  }

  /**
   * Crear recordatorio de lectura diaria
   */
  async createReadingReminder(time = '09:00', bookTitle) {
    const now = new Date();
    const [hours, minutes] = time.split(':');

    const reminderDate = new Date(now);
    reminderDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    // Si ya pasó la hora, programar para mañana
    if (reminderDate <= now) {
      reminderDate.setDate(reminderDate.getDate() + 1);
    }

    await this.addToCalendar({
      title: `📚 Lectura: ${bookTitle || 'Colección Nuevo Ser'}`,
      description: 'Es hora de tu lectura diaria. Abre la app y continúa tu viaje.',
      date: reminderDate,
      duration: 30
    });
  }

  // ==========================================================================
  // TODOIST
  // ==========================================================================

  async exportToTodoist(actionPlans) {
    if (!this.isConnected('todoist')) {
      // Generar formato compatible y copiar
      const tasks = this.formatForTodoist(actionPlans);
      await navigator.clipboard.writeText(tasks);
      window.toast?.success('Tareas copiadas. Pega en Todoist.');
      return;
    }

    window.toast?.info('Exportando a Todoist...');

    // En producción, llamar a la API de Todoist
    const tasks = this.formatForTodoist(actionPlans);
    await navigator.clipboard.writeText(tasks);
    window.toast?.success('Tareas copiadas');
  }

  formatForTodoist(actionPlans) {
    let output = '';

    if (Array.isArray(actionPlans)) {
      actionPlans.forEach(plan => {
        output += `# ${plan.title}\n`;
        if (plan.steps) {
          plan.steps.forEach(step => {
            output += `- ${step.text} ${step.completed ? '✓' : ''}\n`;
          });
        }
        output += '\n';
      });
    }

    return output;
  }

  // ==========================================================================
  // UTILIDADES
  // ==========================================================================

  downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
  }

  /**
   * Obtiene todos los datos exportables
   */
  async getAllExportData() {
    const data = {
      exportedAt: new Date().toISOString(),
      progress: [],
      notes: [],
      achievements: [],
      reflections: {}
    };

    // Progreso de lectura
    if (window.bookEngine) {
      const books = window.bookEngine.getAllBooks();
      books.forEach(book => {
        const progress = window.bookEngine.getProgress(book.id);
        if (progress) {
          data.progress.push({
            bookId: book.id,
            title: book.title,
            percentage: progress.percentage,
            chaptersRead: progress.chaptersRead,
            totalChapters: progress.totalChapters
          });
        }
      });
    }

    // Notas
    if (window.notesModal?.getAllNotes) {
      data.notes = window.notesModal.getAllNotes();
    }

    // Logros
    if (window.achievementSystem?.getUnlockedAchievements) {
      data.achievements = window.achievementSystem.getUnlockedAchievements();
    }

    return data;
  }

  // ==========================================================================
  // UI - MODAL PRINCIPAL
  // ==========================================================================

  show() {
    this.close();

    const modal = document.createElement('div');
    modal.id = 'integrations-modal';
    modal.className = 'fixed inset-0 z-[9999] flex items-center justify-center p-4';
    modal.innerHTML = `
      <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" onclick="window.externalIntegrations?.close()"></div>
      <div class="relative bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col border border-gray-700">
        <!-- Header -->
        <div class="p-4 border-b border-gray-700 bg-gradient-to-r from-blue-900/30 to-purple-900/30">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-xl font-bold text-white flex items-center gap-2">
                <span class="text-2xl">🔗</span> Integraciones
              </h2>
              <p class="text-xs text-blue-300/70 mt-0.5">Conecta con tus herramientas favoritas</p>
            </div>
            <button onclick="window.externalIntegrations?.close()"
                    class="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Quick Export -->
        <div class="p-4 border-b border-gray-700 bg-slate-800/50">
          <h3 class="text-sm font-medium text-gray-300 mb-3">Exportación Rápida</h3>
          <div class="flex flex-wrap gap-2">
            <button onclick="window.externalIntegrations?.quickExport('markdown')"
                    class="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs transition-colors">
              📄 Markdown
            </button>
            <button onclick="window.externalIntegrations?.quickExport('json')"
                    class="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs transition-colors">
              📋 JSON
            </button>
            <button onclick="window.externalIntegrations?.quickExport('clipboard')"
                    class="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs transition-colors">
              📎 Copiar Todo
            </button>
          </div>
        </div>

        <!-- Integrations List -->
        <div id="integrations-content" class="flex-1 overflow-y-auto p-4 space-y-3">
          ${Object.values(this.integrations).map(int => this.renderIntegrationCard(int)).join('')}
        </div>

        <!-- Footer -->
        <div class="p-3 border-t border-gray-700 text-center">
          <p class="text-xs text-gray-500">
            Las integraciones permiten sincronizar tu progreso con otras apps
          </p>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this.modalElement = modal;

    this._escapeHandler = (e) => {
      if (e.key === 'Escape') this.close();
    };
    document.addEventListener('keydown', this._escapeHandler);
  }

  renderIntegrationCard(integration) {
    const connected = this.isConnected(integration.id);

    return `
      <div class="bg-slate-800/50 rounded-xl p-4 border border-gray-700/50">
        <div class="flex items-start gap-4">
          <div class="w-12 h-12 rounded-xl ${integration.color} flex items-center justify-center text-2xl shadow-lg">
            ${integration.icon}
          </div>
          <div class="flex-1">
            <div class="flex items-center gap-2">
              <h3 class="font-bold text-white">${integration.name}</h3>
              ${connected ? `
                <span class="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">Conectado</span>
              ` : ''}
            </div>
            <p class="text-xs text-gray-400 mt-0.5">${integration.description}</p>

            <div class="flex flex-wrap gap-1 mt-2">
              ${integration.features.map(f => `
                <span class="text-xs bg-slate-700 text-gray-300 px-2 py-0.5 rounded">${f}</span>
              `).join('')}
            </div>

            <div class="mt-3 flex gap-2">
              ${connected ? `
                <button onclick="window.externalIntegrations?.showExportOptions('${integration.id}')"
                        class="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs transition-colors">
                  Exportar
                </button>
                <button onclick="window.externalIntegrations?.disconnect('${integration.id}')"
                        class="px-3 py-1.5 bg-slate-600 hover:bg-slate-500 text-white rounded-lg text-xs transition-colors">
                  Desconectar
                </button>
              ` : `
                <button onclick="window.externalIntegrations?.connect('${integration.id}')"
                        class="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs transition-colors">
                  Conectar
                </button>
              `}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ==========================================================================
  // ACCIONES
  // ==========================================================================

  async quickExport(format) {
    const data = await this.getAllExportData();

    if (format === 'markdown') {
      const md = this.formatAllForObsidian(data);
      this.downloadFile(md, `coleccion-nuevo-ser-${Date.now()}.md`, 'text/markdown');
      window.toast?.success('Archivo Markdown descargado');
    } else if (format === 'json') {
      const json = JSON.stringify(data, null, 2);
      this.downloadFile(json, `coleccion-nuevo-ser-${Date.now()}.json`, 'application/json');
      window.toast?.success('Archivo JSON descargado');
    } else if (format === 'clipboard') {
      const md = this.formatAllForObsidian(data);
      await navigator.clipboard.writeText(md);
      window.toast?.success('Datos copiados al portapapeles');
    }
  }

  showExportOptions(integrationId) {
    const integration = this.integrations[integrationId];
    if (!integration) return;

    // Dependiendo de la integración, mostrar opciones específicas
    if (integrationId === 'notion') {
      this.showNotionExportModal();
    } else if (integrationId === 'calendar') {
      this.showCalendarModal();
    } else if (integrationId === 'obsidian') {
      this.exportToObsidian(null, 'all');
    } else if (integrationId === 'todoist') {
      this.showTodoistExportModal();
    }
  }

  showNotionExportModal() {
    window.toast?.info('Selecciona qué exportar a Notion...');
    // Por simplicidad, exportamos todo
    this.getAllExportData().then(data => {
      this.exportToNotion(data.progress, 'progress');
    });
  }

  showCalendarModal() {
    const bookTitle = window.bookEngine?.getCurrentBookData()?.title || 'Colección Nuevo Ser';
    this.createReadingReminder('09:00', bookTitle);
  }

  showTodoistExportModal() {
    // Exportar planes de acción si existen
    if (window.actionPlansManager?.getAllPlans) {
      const plans = window.actionPlansManager.getAllPlans();
      this.exportToTodoist(plans);
    } else {
      window.toast?.info('No hay planes de acción para exportar');
    }
  }

  updateUI() {
    const content = document.getElementById('integrations-content');
    if (content) {
      content.innerHTML = Object.values(this.integrations)
        .map(int => this.renderIntegrationCard(int))
        .join('');
    }
  }

  close() {
    if (this.modalElement) {
      this.modalElement.remove();
      this.modalElement = null;
    }
    if (this._escapeHandler) {
      document.removeEventListener('keydown', this._escapeHandler);
      this._escapeHandler = null;
    }
  }
}

// ==========================================================================
// INICIALIZACIÓN
// ==========================================================================

window.ExternalIntegrations = ExternalIntegrations;
window.externalIntegrations = new ExternalIntegrations();

logger.log('[ExternalIntegrations] Sistema de integraciones inicializado');
