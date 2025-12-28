// ============================================================================
// ACTION PLANS - Planes de Acción Personalizados
// ============================================================================
// Sistema para crear y gestionar planes de acción basados en las lecturas

class ActionPlans {
  constructor(bookEngine) {
    this.bookEngine = bookEngine;
    this.i18n = window.i18n || { t: (key) => key };
    this.plans = this.loadPlans();

    // Plantillas de planes predefinidas
    this.templates = this.getTemplates();
  }

  // ==========================================================================
  // PERSISTENCIA
  // ==========================================================================

  loadPlans() {
    try {
      return JSON.parse(localStorage.getItem('action-plans')) || {};
    } catch {
      return {};
    }
  }

  savePlans() {
    // 🔧 FIX v2.9.198: Error handling - prevent silent failures in localStorage operations
    try {
      localStorage.setItem('action-plans', JSON.stringify(this.plans));
    } catch (error) {
      console.error('Error guardando planes de acción:', error);
      window.toast?.error('Error al guardar plan. Intenta de nuevo.');
      return; // No intentar sincronizar si falla guardar localmente
    }

    // Sincronizar a la nube si está autenticado
    if (window.supabaseSyncHelper && window.supabaseAuthHelper?.isAuthenticated()) {
      window.supabaseSyncHelper.migrateActionPlans().catch(err => {
        console.error('Error sincronizando planes de acción:', err);
      });
    }
  }

  // ==========================================================================
  // PLANTILLAS DE PLANES
  // ==========================================================================

  getTemplates() {
    return {
      'cambio-habito': {
        icon: '🔄',
        name: 'Cambio de Hábito',
        description: 'Reemplazar un hábito nocivo por uno beneficioso',
        fields: [
          { id: 'habito_actual', label: 'Hábito que quiero cambiar', type: 'text' },
          { id: 'habito_nuevo', label: 'Hábito nuevo a desarrollar', type: 'text' },
          { id: 'trigger', label: '¿Qué lo dispara?', type: 'text' },
          { id: 'recompensa', label: 'Nueva recompensa', type: 'text' },
          { id: 'frecuencia', label: 'Frecuencia', type: 'select', options: ['Diario', 'Semanal', '3 veces/semana'] }
        ],
        duration: '21 días'
      },
      'meta-lectura': {
        icon: '📚',
        name: 'Meta de Lectura',
        description: 'Compromiso para completar un libro',
        fields: [
          { id: 'libro', label: 'Libro a leer', type: 'text' },
          { id: 'capitulos_semana', label: 'Capítulos por semana', type: 'number' },
          { id: 'momento', label: '¿Cuándo leeré?', type: 'text' },
          { id: 'notas', label: '¿Tomaré notas?', type: 'select', options: ['Sí, por capítulo', 'Solo ideas clave', 'No'] }
        ],
        duration: '4 semanas'
      },
      'practica-meditacion': {
        icon: '🧘',
        name: 'Práctica de Meditación',
        description: 'Establecer una rutina de meditación',
        fields: [
          { id: 'duracion', label: 'Duración inicial (minutos)', type: 'number' },
          { id: 'momento_dia', label: 'Momento del día', type: 'select', options: ['Mañana', 'Tarde', 'Noche', 'Variable'] },
          { id: 'tipo', label: 'Tipo de meditación', type: 'select', options: ['Respiración', 'Guiada', 'Silenciosa', 'Caminando'] },
          { id: 'lugar', label: 'Lugar', type: 'text' }
        ],
        duration: '30 días'
      },
      'desconexion-digital': {
        icon: '📵',
        name: 'Desconexión Digital',
        description: 'Reducir el uso de tecnología/redes',
        fields: [
          { id: 'que_reducir', label: '¿Qué quiero reducir?', type: 'text' },
          { id: 'tiempo_actual', label: 'Tiempo actual diario', type: 'text' },
          { id: 'meta', label: 'Meta de tiempo', type: 'text' },
          { id: 'alternativa', label: '¿Qué haré en su lugar?', type: 'text' }
        ],
        duration: '14 días'
      },
      'accion-social': {
        icon: '✊',
        name: 'Acción Social',
        description: 'Contribuir al cambio colectivo',
        fields: [
          { id: 'causa', label: 'Causa que me importa', type: 'text' },
          { id: 'accion', label: 'Acción concreta', type: 'text' },
          { id: 'cuando', label: '¿Cuándo empezaré?', type: 'text' },
          { id: 'con_quien', label: '¿Con quién?', type: 'text' }
        ],
        duration: 'Continuo'
      },
      'personalizado': {
        icon: '✨',
        name: 'Plan Personalizado',
        description: 'Crea tu propio plan de acción',
        fields: [
          { id: 'objetivo', label: 'Mi objetivo', type: 'text' },
          { id: 'por_que', label: '¿Por qué es importante?', type: 'textarea' },
          { id: 'pasos', label: 'Pasos a seguir', type: 'textarea' },
          { id: 'obstaculos', label: 'Posibles obstáculos', type: 'textarea' },
          { id: 'como_superar', label: '¿Cómo los superaré?', type: 'textarea' }
        ],
        duration: 'Variable'
      }
    };
  }

  // ==========================================================================
  // CRUD DE PLANES
  // ==========================================================================

  createPlan(templateId, data) {
    const template = this.templates[templateId];
    if (!template) return null;

    const plan = {
      id: `plan_${Date.now()}`,
      templateId,
      templateName: template.name,
      icon: template.icon,
      data,
      status: 'active',
      progress: 0,
      checkIns: [],
      createdAt: new Date().toISOString(),
      duration: template.duration,
      bookId: this.bookEngine?.getCurrentBook(),
      chapterId: (window.bookReader && window.bookReader.currentChapter) ? window.bookReader.currentChapter.id : null
    };

    if (!this.plans[plan.id]) {
      this.plans[plan.id] = plan;
      this.savePlans();

      // Track para logros
      // 🔧 FIX #58: Pasar tipo de acción para evaluación eficiente
      if (window.achievementSystem) {
        window.achievementSystem.stats.plansCreated = (window.achievementSystem.stats.plansCreated || 0) + 1;
        window.achievementSystem.saveStats();
        window.achievementSystem.checkAndUnlock('planCreated');
      }
    }

    return plan;
  }

  updatePlanProgress(planId, progress, checkInNote = '') {
    const plan = this.plans[planId];
    if (!plan) return false;

    plan.progress = Math.min(100, Math.max(0, progress));
    plan.updatedAt = new Date().toISOString();

    if (checkInNote) {
      plan.checkIns.push({
        date: new Date().toISOString(),
        progress: plan.progress,
        note: checkInNote
      });
    }

    if (plan.progress === 100 && plan.status !== 'completed') {
      plan.status = 'completed';
      plan.completedAt = new Date().toISOString();

      // Track para logros
      // 🔧 FIX #58: Pasar tipo de acción para evaluación eficiente
      if (window.achievementSystem) {
        window.achievementSystem.stats.plansCompleted = (window.achievementSystem.stats.plansCompleted || 0) + 1;
        window.achievementSystem.saveStats();
        window.achievementSystem.checkAndUnlock('planCompleted');
      }
    }

    this.savePlans();
    return true;
  }

  deletePlan(planId) {
    if (this.plans[planId]) {
      delete this.plans[planId];
      this.savePlans();
      return true;
    }
    return false;
  }

  getActivePlans() {
    return Object.values(this.plans).filter(p => p.status === 'active');
  }

  getCompletedPlans() {
    return Object.values(this.plans).filter(p => p.status === 'completed');
  }

  getAllPlans() {
    return Object.values(this.plans).sort((a, b) =>
      new Date(b.createdAt) - new Date(a.createdAt)
    );
  }

  // ==========================================================================
  // MODAL PRINCIPAL
  // ==========================================================================

  show() {
    const existing = document.getElementById('action-plans-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'action-plans-modal';
    modal.className = 'fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-50 p-4';
    modal.style.animation = 'fadeIn 0.3s ease-out';

    const activePlans = this.getActivePlans();
    const completedPlans = this.getCompletedPlans();

    modal.innerHTML = `
      <div class="bg-gradient-to-br from-gray-900 to-green-900/20 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col border border-green-500/30">
        <!-- Header -->
        <div class="bg-gradient-to-r from-green-900/50 to-emerald-900/50 px-6 py-4 border-b border-green-500/30 flex items-center justify-between rounded-t-2xl">
          <div class="flex items-center gap-3">
            <span class="text-3xl">📋</span>
            <div>
              <h2 class="text-xl font-bold text-green-200">Mis Planes de Acción</h2>
              <p class="text-sm text-green-400/70">De la reflexión a la acción</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button id="new-plan-btn" class="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg font-semibold transition text-sm flex items-center gap-2">
              <span>+</span> Nuevo Plan
            </button>
            <button id="close-action-plans" class="text-green-300 hover:text-white p-2 hover:bg-green-800/50 rounded-lg transition">
              ${Icons.close(20)}
            </button>
          </div>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto p-6">
          <!-- Active Plans -->
          <div class="mb-6">
            <h3 class="text-lg font-bold text-green-300 mb-3 flex items-center gap-2">
              <span>🚀</span> Planes Activos (${activePlans.length})
            </h3>
            ${activePlans.length > 0 ? `
              <div class="space-y-3">
                ${activePlans.map(plan => this.renderPlanCard(plan)).join('')}
              </div>
            ` : `
              <div class="text-center py-8 bg-gray-800/30 rounded-xl border border-dashed border-gray-700">
                <p class="text-gray-500">No tienes planes activos</p>
                <p class="text-gray-600 text-sm mt-1">Crea uno para empezar tu transformación</p>
              </div>
            `}
          </div>

          <!-- Completed Plans -->
          ${completedPlans.length > 0 ? `
            <div>
              <h3 class="text-lg font-bold text-gray-400 mb-3 flex items-center gap-2">
                <span>✅</span> Completados (${completedPlans.length})
              </h3>
              <div class="space-y-2 opacity-70">
                ${completedPlans.slice(0, 5).map(plan => this.renderCompletedPlanCard(plan)).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this.attachModalListeners();
  }

  renderPlanCard(plan) {
    const daysActive = Math.floor((Date.now() - new Date(plan.createdAt)) / (1000 * 60 * 60 * 24));

    return `
      <div class="plan-card bg-gray-800/50 rounded-xl p-4 border border-gray-700/50 hover:border-green-500/50 transition"
           data-plan-id="${plan.id}">
        <div class="flex items-start gap-4">
          <div class="text-3xl">${plan.icon}</div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between">
              <h4 class="font-bold text-green-200">${plan.templateName}</h4>
              <span class="text-xs text-gray-500">${daysActive} días</span>
            </div>

            <!-- Key data preview -->
            <div class="text-sm text-gray-400 mt-1 truncate">
              ${Object.entries(plan.data).slice(0, 2).map(([key, value]) =>
                `<span>${value}</span>`
              ).join(' • ')}
            </div>

            <!-- Progress bar -->
            <div class="mt-3">
              <div class="flex justify-between text-xs mb-1">
                <span class="text-gray-400">Progreso</span>
                <span class="text-green-400">${plan.progress}%</span>
              </div>
              <div class="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div class="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all"
                     style="width: ${plan.progress}%"></div>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex gap-2 mt-3">
              <button class="check-in-btn flex-1 px-3 py-1.5 bg-green-900/50 hover:bg-green-800/50 border border-green-500/30 rounded-lg text-xs text-green-300 transition"
                      data-plan-id="${plan.id}">
                📝 Check-in
              </button>
              <button class="view-plan-btn px-3 py-1.5 bg-gray-700/50 hover:bg-gray-600/50 rounded-lg text-xs text-gray-300 transition"
                      data-plan-id="${plan.id}">
                Ver detalles
              </button>
              <button class="delete-plan-btn px-3 py-1.5 bg-red-900/30 hover:bg-red-800/50 rounded-lg text-xs text-red-400 transition"
                      data-plan-id="${plan.id}">
                🗑️
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderCompletedPlanCard(plan) {
    const completedDate = new Date(plan.completedAt).toLocaleDateString('es-ES');

    return `
      <div class="bg-gray-800/30 rounded-lg p-3 flex items-center gap-3">
        <span class="text-xl">${plan.icon}</span>
        <div class="flex-1">
          <span class="font-semibold text-gray-300">${plan.templateName}</span>
          <span class="text-xs text-gray-500 ml-2">completado ${completedDate}</span>
        </div>
        <span class="text-green-500">✓</span>
      </div>
    `;
  }

  // ==========================================================================
  // MODAL DE NUEVO PLAN
  // ==========================================================================

  showNewPlanModal() {
    const existing = document.getElementById('new-plan-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'new-plan-modal';
    modal.className = 'fixed inset-0 bg-black/90 flex items-center justify-center z-[60] p-4';
    modal.style.animation = 'fadeIn 0.2s ease-out';

    modal.innerHTML = `
      <div class="bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col border border-green-500/30">
        <!-- Header -->
        <div class="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
          <h3 class="text-lg font-bold text-green-300">Crear Nuevo Plan</h3>
          <button id="close-new-plan" class="text-gray-400 hover:text-white p-1">
            ${Icons.close(20)}
          </button>
        </div>

        <!-- Template Selection -->
        <div class="p-6 overflow-y-auto">
          <p class="text-gray-400 mb-4">Elige una plantilla para empezar:</p>
          <div class="grid grid-cols-2 gap-3">
            ${Object.entries(this.templates).map(([key, template]) => `
              <button class="template-select-btn text-left p-4 bg-gray-800/50 hover:bg-gray-700/50 rounded-xl border border-gray-700 hover:border-green-500/50 transition"
                      data-template="${key}">
                <div class="flex items-center gap-3">
                  <span class="text-2xl">${template.icon}</span>
                  <div>
                    <p class="font-semibold text-gray-200">${template.name}</p>
                    <p class="text-xs text-gray-500">${template.description}</p>
                  </div>
                </div>
              </button>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Close handlers
    document.getElementById('close-new-plan')?.addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });

    // Template selection
    modal.querySelectorAll('.template-select-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const templateId = btn.dataset.template;
        modal.remove();
        this.showPlanFormModal(templateId);
      });
    });
  }

  showPlanFormModal(templateId) {
    const template = this.templates[templateId];
    if (!template) return;

    const modal = document.createElement('div');
    modal.id = 'plan-form-modal';
    modal.className = 'fixed inset-0 bg-black/90 flex items-center justify-center z-[60] p-4';

    modal.innerHTML = `
      <div class="bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] flex flex-col border border-green-500/30">
        <!-- Header -->
        <div class="px-6 py-4 border-b border-gray-700">
          <div class="flex items-center gap-3">
            <span class="text-2xl">${template.icon}</span>
            <div>
              <h3 class="text-lg font-bold text-green-300">${template.name}</h3>
              <p class="text-xs text-gray-500">Duración sugerida: ${template.duration}</p>
            </div>
          </div>
        </div>

        <!-- Form -->
        <form id="plan-form" class="p-6 overflow-y-auto space-y-4">
          ${template.fields.map(field => this.renderFormField(field)).join('')}

          <div class="flex gap-3 pt-4">
            <button type="button" id="cancel-plan-form" class="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition">
              Cancelar
            </button>
            <button type="submit" class="flex-1 px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg font-semibold transition">
              Crear Plan
            </button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    // Cancel
    document.getElementById('cancel-plan-form')?.addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });

    // Submit
    document.getElementById('plan-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const data = {};

      for (const [key, value] of formData.entries()) {
        data[key] = value;
      }

      const plan = this.createPlan(templateId, data);
      if (plan) {
        window.toast?.success('Plan creado correctamente');
        modal.remove();
        this.show(); // Refresh main modal
      }
    });
  }

  renderFormField(field) {
    const baseClasses = 'w-full bg-gray-800 border border-gray-700 rounded-lg p-3 focus:outline-none focus:border-green-500 transition';

    switch (field.type) {
      case 'textarea':
        return `
          <div>
            <label class="block text-sm font-semibold text-gray-300 mb-2">${field.label}</label>
            <textarea name="${field.id}" class="${baseClasses} h-24 resize-none" required></textarea>
          </div>
        `;
      case 'select':
        return `
          <div>
            <label class="block text-sm font-semibold text-gray-300 mb-2">${field.label}</label>
            <select name="${field.id}" class="${baseClasses}" required>
              ${field.options.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
            </select>
          </div>
        `;
      case 'number':
        return `
          <div>
            <label class="block text-sm font-semibold text-gray-300 mb-2">${field.label}</label>
            <input type="number" name="${field.id}" class="${baseClasses}" min="1" required>
          </div>
        `;
      default:
        return `
          <div>
            <label class="block text-sm font-semibold text-gray-300 mb-2">${field.label}</label>
            <input type="text" name="${field.id}" class="${baseClasses}" required>
          </div>
        `;
    }
  }

  // ==========================================================================
  // CHECK-IN MODAL
  // ==========================================================================

  showCheckInModal(planId) {
    const plan = this.plans[planId];
    if (!plan) return;

    const modal = document.createElement('div');
    modal.id = 'check-in-modal';
    modal.className = 'fixed inset-0 bg-black/90 flex items-center justify-center z-[60] p-4';

    modal.innerHTML = `
      <div class="bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full border border-green-500/30">
        <!-- Header -->
        <div class="px-6 py-4 border-b border-gray-700">
          <div class="flex items-center gap-3">
            <span class="text-2xl">${plan.icon}</span>
            <h3 class="text-lg font-bold text-green-300">Check-in: ${plan.templateName}</h3>
          </div>
        </div>

        <!-- Form -->
        <div class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-semibold text-gray-300 mb-2">¿Cuánto has avanzado?</label>
            <div class="flex items-center gap-4">
              <input type="range" id="progress-slider" min="0" max="100" value="${plan.progress}"
                     class="flex-1 accent-green-500">
              <span id="progress-value" class="text-2xl font-bold text-green-400 w-16 text-right">${plan.progress}%</span>
            </div>
          </div>

          <div>
            <label class="block text-sm font-semibold text-gray-300 mb-2">¿Cómo te sientes? (opcional)</label>
            <textarea id="check-in-note" class="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 h-24 resize-none focus:outline-none focus:border-green-500"
                      placeholder="Reflexiona sobre tu progreso..."></textarea>
          </div>

          <div class="flex gap-3">
            <button id="cancel-check-in" class="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition">
              Cancelar
            </button>
            <button id="save-check-in" class="flex-1 px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg font-semibold transition">
              Guardar
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Progress slider
    const slider = document.getElementById('progress-slider');
    const valueDisplay = document.getElementById('progress-value');
    slider?.addEventListener('input', () => {
      valueDisplay.textContent = `${slider.value}%`;
    });

    // Cancel
    document.getElementById('cancel-check-in')?.addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });

    // Save
    document.getElementById('save-check-in')?.addEventListener('click', () => {
      const progress = parseInt(slider.value);
      const note = document.getElementById('check-in-note')?.value.trim();

      this.updatePlanProgress(planId, progress, note);

      if (progress === 100) {
        window.toast?.success('¡Felicidades! Plan completado');
      } else {
        window.toast?.success('Progreso actualizado');
      }

      modal.remove();
      this.show(); // Refresh
    });
  }

  // ==========================================================================
  // EVENT LISTENERS
  // ==========================================================================

  attachModalListeners() {
    const modal = document.getElementById('action-plans-modal');
    if (!modal) return;

    // Close
    document.getElementById('close-action-plans')?.addEventListener('click', () => this.close());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) this.close();
    });

    // New plan
    document.getElementById('new-plan-btn')?.addEventListener('click', () => {
      this.showNewPlanModal();
    });

    // Check-in buttons
    modal.querySelectorAll('.check-in-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const planId = btn.dataset.planId;
        this.showCheckInModal(planId);
      });
    });

    // Delete buttons
    modal.querySelectorAll('.delete-plan-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm('¿Eliminar este plan?')) {
          const planId = btn.dataset.planId;
          this.deletePlan(planId);
          this.show(); // Refresh
        }
      });
    });

    // ESC
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        this.close();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
  }

  close() {
    const modal = document.getElementById('action-plans-modal');
    if (modal) {
      modal.style.animation = 'fadeOut 0.2s ease-out';
      setTimeout(() => modal.remove(), 200);
    }
  }

  // ==========================================================================
  // WIDGET DE RECORDATORIO
  // ==========================================================================

  showReminderWidget() {
    const activePlans = this.getActivePlans();
    if (activePlans.length === 0) return;

    // 🔧 FIX v2.9.198: Error handling - prevent silent failures in localStorage operations
    try {
      // Mostrar solo si no se ha mostrado hoy
      const lastShown = localStorage.getItem('plans-reminder-shown');
      const today = new Date().toDateString();
      if (lastShown === today) return;

      localStorage.setItem('plans-reminder-shown', today);
    } catch (error) {
      console.error('Error guardando recordatorio de planes:', error);
      // Continuar mostrando el widget aunque falle guardar
    }

    const widget = document.createElement('div');
    widget.id = 'plans-reminder-widget';
    widget.className = 'fixed bottom-20 left-4 z-40 max-w-xs';
    widget.style.animation = 'slideInLeft 0.3s ease-out';

    widget.innerHTML = `
      <div class="bg-green-900/95 backdrop-blur-sm rounded-xl shadow-2xl border border-green-500/30 p-4">
        <div class="flex items-center justify-between mb-2">
          <span class="text-lg">📋</span>
          <button id="close-plans-reminder" class="text-green-300 hover:text-white p-1">
            ${Icons.close(16)}
          </button>
        </div>
        <p class="text-sm text-green-200 font-semibold mb-1">Tienes ${activePlans.length} plan(es) activo(s)</p>
        <p class="text-xs text-green-300/70 mb-3">¿Has avanzado hoy?</p>
        <button id="open-plans-from-reminder" class="w-full px-3 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-sm font-semibold transition">
          Ver mis planes
        </button>
      </div>
    `;

    document.body.appendChild(widget);

    // Add animation style
    if (!document.getElementById('plans-reminder-styles')) {
      const styles = document.createElement('style');
      styles.id = 'plans-reminder-styles';
      styles.textContent = `
        @keyframes slideInLeft {
          from { transform: translateX(-100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `;
      document.head.appendChild(styles);
    }

    // Close
    document.getElementById('close-plans-reminder')?.addEventListener('click', () => {
      widget.remove();
    });

    // Open plans
    document.getElementById('open-plans-from-reminder')?.addEventListener('click', () => {
      widget.remove();
      this.show();
    });

    // Auto-hide after 10 seconds
    setTimeout(() => {
      if (document.getElementById('plans-reminder-widget')) {
        widget.remove();
      }
    }, 10000);
  }
}

// Exportar
window.ActionPlans = ActionPlans;
