/**
 * Practice Timer - Recurring Practices Module
 * Gestiona las practicas recurrentes programadas
 * @version 2.9.390 - Modularizado
 */

class PracticeTimerRecurring {
  constructor(practiceTimer) {
    this.practiceTimer = practiceTimer;
  }

  // ==========================================================================
  // CARGA Y GUARDADO DE PRACTICAS RECURRENTES
  // ==========================================================================

  /**
   * Carga las practicas recurrentes programadas
   */
  loadRecurringPractices() {
    try {
      return JSON.parse(localStorage.getItem('recurring-practices')) || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Guarda las practicas recurrentes
   */
  saveRecurringPractices() {
    try {
      localStorage.setItem('recurring-practices', JSON.stringify(this.practiceTimer.recurringPractices));
    } catch (error) {
      logger.warn('[PracticeTimerRecurring] Error guardando practicas recurrentes');
    }
  }

  // ==========================================================================
  // GESTION DE PRACTICAS RECURRENTES
  // ==========================================================================

  /**
   * Programa una practica recurrente
   * @param {Object} practice - La practica a programar
   * @param {string} frequency - 'daily', 'weekly', 'weekdays', 'custom'
   * @param {string} time - Hora en formato HH:MM
   * @param {Array} customDays - Dias personalizados (0=domingo, 6=sabado)
   */
  scheduleRecurringPractice(practice, frequency, time, customDays = []) {
    const recurring = {
      id: Date.now(),
      practiceId: practice.id,
      practiceTitle: practice.title,
      practice: practice,
      frequency,
      time,
      customDays,
      enabled: true,
      createdAt: Date.now(),
      lastCompleted: null,
      completionCount: 0
    };

    this.practiceTimer.recurringPractices.push(recurring);
    this.saveRecurringPractices();

    window.toast?.success(`Practica programada: ${frequency === 'daily' ? 'diariamente' : frequency === 'weekdays' ? 'dias laborables' : frequency === 'weekly' ? 'semanalmente' : 'dias personalizados'} a las ${time}`);

    return recurring;
  }

  /**
   * Elimina una practica recurrente
   */
  removeRecurringPractice(recurringId) {
    this.practiceTimer.recurringPractices = this.practiceTimer.recurringPractices.filter(r => r.id !== recurringId);
    this.saveRecurringPractices();
    window.toast?.info('Practica programada eliminada');
  }

  /**
   * Activa/desactiva una practica recurrente
   */
  toggleRecurringPractice(recurringId) {
    const recurring = this.practiceTimer.recurringPractices.find(r => r.id === recurringId);
    if (recurring) {
      recurring.enabled = !recurring.enabled;
      this.saveRecurringPractices();
    }
  }

  /**
   * Obtiene las practicas recurrentes
   */
  getRecurringPractices() {
    return this.practiceTimer.recurringPractices;
  }

  // ==========================================================================
  // SISTEMA DE RECORDATORIOS
  // ==========================================================================

  /**
   * Inicia la verificacion periodica de practicas recurrentes
   */
  startRecurringReminders() {
    this.stopRecurringReminders();
    this.checkAndShowReminders();
    this.practiceTimer._reminderInterval = setInterval(() => this.checkAndShowReminders(), 60000);
  }

  /**
   * Detiene la verificacion periodica de practicas recurrentes
   */
  stopRecurringReminders() {
    if (this.practiceTimer._reminderInterval) {
      clearInterval(this.practiceTimer._reminderInterval);
      this.practiceTimer._reminderInterval = null;
    }
  }

  /**
   * Verifica si hay practicas pendientes para hoy
   */
  checkAndShowReminders() {
    const now = new Date();
    const today = now.getDay();
    const todayDate = now.toISOString().split('T')[0];

    this.practiceTimer.recurringPractices.forEach(recurring => {
      if (!recurring.enabled) return;

      if (!this.shouldShowReminder(recurring, today, todayDate)) return;

      const [scheduledHour, scheduledMin] = recurring.time.split(':').map(Number);
      const scheduledMinutes = scheduledHour * 60 + scheduledMin;
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      if (currentMinutes >= scheduledMinutes && currentMinutes <= scheduledMinutes + 5) {
        this.showRecurringReminder(recurring);
      }
    });
  }

  /**
   * Determina si se debe mostrar recordatorio para una practica
   */
  shouldShowReminder(recurring, today, todayDate) {
    let appliesToday = false;

    switch (recurring.frequency) {
      case 'daily':
        appliesToday = true;
        break;
      case 'weekdays':
        appliesToday = today >= 1 && today <= 5;
        break;
      case 'weekly':
        const createdDay = new Date(recurring.createdAt).getDay();
        appliesToday = today === createdDay;
        break;
      case 'custom':
        appliesToday = recurring.customDays?.includes(today);
        break;
    }

    if (!appliesToday) return false;

    // Verificar si ya se completo hoy
    if (recurring.lastCompleted?.split('T')[0] === todayDate) return false;

    return true;
  }

  /**
   * Muestra recordatorio de practica recurrente
   */
  showRecurringReminder(recurring) {
    if (this.practiceTimer._lastReminderId === recurring.id) return;
    this.practiceTimer._lastReminderId = recurring.id;

    if (window.toast) {
      window.toast.show(`Es hora de: ${recurring.practiceTitle}`, 'info', 10000);
    }

    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Practica Programada', {
        body: `Es hora de: ${recurring.practiceTitle}`,
        icon: '/assets/icons/icon-192.png',
        tag: `recurring-${recurring.id}`
      });
    }

    const reminderCleanupId = setTimeout(() => {
      if (this.practiceTimer._lastReminderId === recurring.id) {
        this.practiceTimer._lastReminderId = null;
      }
    }, 600000);

    if (this.practiceTimer.ambient) {
      this.practiceTimer.ambient.trackAmbientTimeout(reminderCleanupId);
    }
  }

  /**
   * Obtiene la proxima hora de recordatorio
   */
  getNextReminderTime(recurring) {
    if (!recurring.enabled) return null;

    const now = new Date();
    const [hour, min] = recurring.time.split(':').map(Number);

    // Calcular proxima ocurrencia
    const nextDate = new Date(now);
    nextDate.setHours(hour, min, 0, 0);

    // Si ya paso hoy, buscar el proximo dia aplicable
    if (nextDate <= now) {
      nextDate.setDate(nextDate.getDate() + 1);
    }

    // Buscar el proximo dia que aplique
    let daysChecked = 0;
    while (daysChecked < 8) {
      const dayOfWeek = nextDate.getDay();
      let applies = false;

      switch (recurring.frequency) {
        case 'daily':
          applies = true;
          break;
        case 'weekdays':
          applies = dayOfWeek >= 1 && dayOfWeek <= 5;
          break;
        case 'weekly':
          const createdDay = new Date(recurring.createdAt).getDay();
          applies = dayOfWeek === createdDay;
          break;
        case 'custom':
          applies = recurring.customDays?.includes(dayOfWeek);
          break;
      }

      if (applies) return nextDate;

      nextDate.setDate(nextDate.getDate() + 1);
      daysChecked++;
    }

    return null;
  }

  /**
   * Marca una practica recurrente como completada
   */
  markRecurringCompleted(recurringId) {
    const recurring = this.practiceTimer.recurringPractices.find(r => r.id === recurringId);
    if (recurring) {
      recurring.lastCompleted = new Date().toISOString();
      recurring.completionCount = (recurring.completionCount || 0) + 1;
      this.saveRecurringPractices();
    }
  }

  /**
   * Obtiene practicas pendientes para hoy
   */
  getTodaysPendingPractices() {
    const now = new Date();
    const today = now.getDay();
    const todayDate = now.toISOString().split('T')[0];

    return this.practiceTimer.recurringPractices.filter(recurring => {
      if (!recurring.enabled) return false;

      let appliesToday = false;
      switch (recurring.frequency) {
        case 'daily':
          appliesToday = true;
          break;
        case 'weekdays':
          appliesToday = today >= 1 && today <= 5;
          break;
        case 'weekly':
          const createdDay = new Date(recurring.createdAt).getDay();
          appliesToday = today === createdDay;
          break;
        case 'custom':
          appliesToday = recurring.customDays?.includes(today);
          break;
      }

      if (!appliesToday) return false;

      return recurring.lastCompleted?.split('T')[0] !== todayDate;
    });
  }

  // ==========================================================================
  // MODALES DE PROGRAMACION
  // ==========================================================================

  /**
   * Muestra modal para programar practica recurrente
   */
  showScheduleModal(practice) {
    const existingModal = document.getElementById('schedule-practice-modal');
    if (existingModal) existingModal.remove();

    const dayNames = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];

    const modal = document.createElement('div');
    modal.id = 'schedule-practice-modal';
    modal.className = 'fixed inset-0 z-[10001] flex items-center justify-center p-4';
    modal.innerHTML = `
      <div class="absolute inset-0 bg-black/80" onclick="this.parentElement.remove()"></div>
      <div class="relative bg-slate-900 rounded-2xl p-6 max-w-sm w-full border border-slate-700">
        <h3 class="text-lg font-bold text-white mb-4">Programar Practica</h3>
        <p class="text-sm text-gray-400 mb-4">${practice.title}</p>

        <div class="space-y-4">
          <!-- Frecuencia -->
          <div>
            <label class="text-sm text-gray-400 mb-2 block">Frecuencia</label>
            <select id="schedule-frequency" class="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white">
              <option value="daily">Diariamente</option>
              <option value="weekdays">Dias laborables (L-V)</option>
              <option value="weekly">Semanalmente</option>
              <option value="custom">Dias personalizados</option>
            </select>
          </div>

          <!-- Dias personalizados -->
          <div id="custom-days-container" class="hidden">
            <label class="text-sm text-gray-400 mb-2 block">Selecciona los dias</label>
            <div class="flex gap-1 flex-wrap">
              ${dayNames.map((day, i) => `
                <button type="button" class="custom-day-btn px-3 py-1.5 rounded-lg text-sm bg-slate-800 hover:bg-violet-600 transition-colors" data-day="${i}">
                  ${day}
                </button>
              `).join('')}
            </div>
          </div>

          <!-- Hora -->
          <div>
            <label class="text-sm text-gray-400 mb-2 block">Hora</label>
            <input type="time" id="schedule-time" value="08:00" class="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white">
          </div>

          <!-- Botones -->
          <div class="flex gap-3 pt-2">
            <button id="schedule-cancel" class="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-gray-300 transition-colors">
              Cancelar
            </button>
            <button id="schedule-confirm" class="flex-1 px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-white transition-colors">
              Programar
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const frequencySelect = modal.querySelector('#schedule-frequency');
    const customDaysContainer = modal.querySelector('#custom-days-container');
    frequencySelect.addEventListener('change', () => {
      customDaysContainer.classList.toggle('hidden', frequencySelect.value !== 'custom');
    });

    const selectedDays = new Set();
    modal.querySelectorAll('.custom-day-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const day = parseInt(btn.dataset.day);
        if (selectedDays.has(day)) {
          selectedDays.delete(day);
          btn.classList.remove('bg-violet-600');
          btn.classList.add('bg-slate-800');
        } else {
          selectedDays.add(day);
          btn.classList.add('bg-violet-600');
          btn.classList.remove('bg-slate-800');
        }
      });
    });

    modal.querySelector('#schedule-cancel').addEventListener('click', () => modal.remove());

    modal.querySelector('#schedule-confirm').addEventListener('click', () => {
      const frequency = frequencySelect.value;
      const time = modal.querySelector('#schedule-time').value;
      const customDays = frequency === 'custom' ? [...selectedDays] : [];

      if (frequency === 'custom' && customDays.length === 0) {
        window.toast?.error('Selecciona al menos un dia');
        return;
      }

      this.scheduleRecurringPractice(practice, frequency, time, customDays);
      modal.remove();
    });
  }

  /**
   * Muestra lista de practicas programadas
   */
  showScheduledPracticesModal() {
    const existingModal = document.getElementById('scheduled-practices-modal');
    if (existingModal) existingModal.remove();

    const dayNames = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
    const frequencyLabels = {
      daily: 'Diariamente',
      weekdays: 'L-V',
      weekly: 'Semanalmente',
      custom: 'Personalizado'
    };

    const modal = document.createElement('div');
    modal.id = 'scheduled-practices-modal';
    modal.className = 'fixed inset-0 z-[10001] flex items-center justify-center p-4';
    modal.innerHTML = `
      <div class="absolute inset-0 bg-black/80" onclick="this.parentElement.remove()"></div>
      <div class="relative bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-slate-700 max-h-[80vh] overflow-y-auto">
        <h3 class="text-lg font-bold text-white mb-4">Practicas Programadas</h3>

        ${this.practiceTimer.recurringPractices.length === 0 ? `
          <p class="text-gray-400 text-center py-8">No hay practicas programadas</p>
        ` : `
          <div class="space-y-3">
            ${this.practiceTimer.recurringPractices.map(r => `
              <div class="p-3 bg-slate-800 rounded-xl border border-slate-700 ${!r.enabled ? 'opacity-50' : ''}">
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <p class="font-medium text-white">${r.practiceTitle}</p>
                    <p class="text-sm text-gray-400">
                      ${frequencyLabels[r.frequency]} a las ${r.time}
                      ${r.frequency === 'custom' ? ` (${r.customDays.map(d => dayNames[d]).join(', ')})` : ''}
                    </p>
                    <p class="text-xs text-gray-500 mt-1">
                      Completada ${r.completionCount || 0} veces
                    </p>
                  </div>
                  <div class="flex items-center gap-2">
                    <button class="toggle-recurring p-1.5 rounded-lg hover:bg-slate-700" data-id="${r.id}" title="${r.enabled ? 'Desactivar' : 'Activar'}">
                      ${r.enabled ? '✓' : '⏸'}
                    </button>
                    <button class="delete-recurring p-1.5 rounded-lg hover:bg-red-900/30 text-red-400" data-id="${r.id}" title="Eliminar">
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        `}

        <button class="w-full mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-gray-300 transition-colors" onclick="this.closest('#scheduled-practices-modal').remove()">
          Cerrar
        </button>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelectorAll('.toggle-recurring').forEach(btn => {
      btn.addEventListener('click', () => {
        this.toggleRecurringPractice(parseInt(btn.dataset.id));
        this.showScheduledPracticesModal();
      });
    });

    modal.querySelectorAll('.delete-recurring').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('Eliminar esta practica programada?')) {
          this.removeRecurringPractice(parseInt(btn.dataset.id));
          this.showScheduledPracticesModal();
        }
      });
    });
  }

  /**
   * Destruye el modulo y limpia recursos
   */
  destroy() {
    this.stopRecurringReminders();
  }
}

// Exportar globalmente
window.PracticeTimerRecurring = PracticeTimerRecurring;
