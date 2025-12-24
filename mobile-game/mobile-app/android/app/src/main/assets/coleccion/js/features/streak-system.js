// ============================================================================
// STREAK SYSTEM - Sistema de Rachas Diarias
// ============================================================================
// Motiva el uso diario con:
// - Contador de días consecutivos
// - Recordatorios sutiles
// - Milestones y celebraciones
// ============================================================================

class StreakSystem {
  constructor() {
    this.storageKey = 'user_streak_data';
    this.data = this.loadData();

    // Configuración de milestones
    this.milestones = [3, 7, 14, 21, 30, 60, 90, 100, 180, 365];

    // Mensajes motivacionales por nivel de racha
    this.motivationalMessages = {
      0: ['¡Hoy es un buen día para empezar!', '¡El primer paso es el más importante!'],
      1: ['¡Gran comienzo! Mañana serán 2 días', '¡El viaje de mil millas comienza con un paso!'],
      3: ['¡3 días seguidos! El hábito se está formando', '¡Excelente constancia!'],
      7: ['¡Una semana completa! 🔥', '¡Tu dedicación es admirable!'],
      14: ['¡2 semanas de práctica! El cambio es real', '¡Eres imparable!'],
      21: ['¡21 días! Se dice que aquí nace un hábito', '¡Tu compromiso inspira!'],
      30: ['¡Un mes entero! 🏆 Eres extraordinario', '¡La transformación está en marcha!'],
      60: ['¡2 meses! Tu disciplina es legendaria', '¡Has recorrido un gran camino!'],
      90: ['¡90 días! Maestría en progreso', '¡Eres un ejemplo de perseverancia!'],
      100: ['¡100 días! 💎 Logro desbloqueado', '¡Centenario de consciencia!'],
      365: ['¡UN AÑO COMPLETO! 👑 Eres una leyenda', '¡365 días de transformación!']
    };
  }

  // ==========================================================================
  // GESTIÓN DE DATOS
  // ==========================================================================

  loadData() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('[StreakSystem] Error loading data:', e);
    }

    return {
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: null,
      totalActiveDays: 0,
      streakHistory: [],
      achievements: []
    };
  }

  saveData() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.data));

      // Sincronizar con Supabase si está disponible
      if (window.supabaseSyncHelper) {
        window.supabaseSyncHelper.syncStreakData(this.data);
      }
    } catch (e) {
      console.error('[StreakSystem] Error saving data:', e);
    }
  }

  // ==========================================================================
  // LÓGICA DE RACHA
  // ==========================================================================

  /**
   * Registra actividad del día actual
   * Llamar cuando el usuario lea, practique o interactúe significativamente
   */
  recordActivity() {
    const today = this.getDateString(new Date());
    const lastActive = this.data.lastActiveDate;

    // Si ya se registró hoy, no hacer nada
    if (lastActive === today) {
      return { streakUpdated: false, currentStreak: this.data.currentStreak };
    }

    const yesterday = this.getDateString(new Date(Date.now() - 86400000));

    let streakBroken = false;
    let newMilestone = null;

    if (lastActive === yesterday) {
      // Día consecutivo - incrementar racha
      this.data.currentStreak++;
    } else if (lastActive === null) {
      // Primera actividad
      this.data.currentStreak = 1;
    } else {
      // Se rompió la racha
      streakBroken = true;
      if (this.data.currentStreak > 0) {
        this.data.streakHistory.push({
          streak: this.data.currentStreak,
          endDate: lastActive,
          startDate: this.getStreakStartDate(lastActive, this.data.currentStreak)
        });
      }
      this.data.currentStreak = 1;
    }

    // Actualizar récord
    if (this.data.currentStreak > this.data.longestStreak) {
      this.data.longestStreak = this.data.currentStreak;
    }

    // Verificar milestone
    if (this.milestones.includes(this.data.currentStreak)) {
      newMilestone = this.data.currentStreak;
      this.unlockAchievement(`streak_${newMilestone}`);
    }

    this.data.lastActiveDate = today;
    this.data.totalActiveDays++;
    this.saveData();

    // Notificar al sistema de momentos compartibles
    if (newMilestone && window.shareableMoments) {
      window.shareableMoments.onStreakUpdate(newMilestone);
    }

    return {
      streakUpdated: true,
      currentStreak: this.data.currentStreak,
      streakBroken,
      newMilestone
    };
  }

  /**
   * Obtiene el estado actual de la racha
   */
  getStreakStatus() {
    const today = this.getDateString(new Date());
    const lastActive = this.data.lastActiveDate;
    const yesterday = this.getDateString(new Date(Date.now() - 86400000));

    let status = 'inactive';
    let atRisk = false;

    if (lastActive === today) {
      status = 'active_today';
    } else if (lastActive === yesterday) {
      status = 'continue_today';
      atRisk = true; // La racha se perderá si no hay actividad hoy
    } else {
      status = 'broken';
    }

    return {
      currentStreak: lastActive === today || lastActive === yesterday ? this.data.currentStreak : 0,
      longestStreak: this.data.longestStreak,
      totalActiveDays: this.data.totalActiveDays,
      status,
      atRisk,
      lastActiveDate: lastActive,
      message: this.getMotivationalMessage()
    };
  }

  /**
   * Obtiene un mensaje motivacional basado en la racha actual
   */
  getMotivationalMessage() {
    const streak = this.data.currentStreak;

    // Buscar el mensaje más cercano por debajo
    let messageKey = 0;
    for (const key of Object.keys(this.motivationalMessages).map(Number).sort((a, b) => b - a)) {
      if (streak >= key) {
        messageKey = key;
        break;
      }
    }

    const messages = this.motivationalMessages[messageKey];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  // ==========================================================================
  // UI - WIDGET DE RACHA
  // ==========================================================================

  /**
   * Renderiza el widget de racha para mostrar en la biblioteca
   */
  renderWidget() {
    const status = this.getStreakStatus();

    // No mostrar si nunca ha habido actividad
    if (status.totalActiveDays === 0) {
      return '';
    }

    const flameClass = status.currentStreak >= 7 ? 'animate-pulse' : '';
    const atRiskClass = status.atRisk ? 'border-amber-500/50 bg-amber-900/20' : 'border-cyan-500/30 bg-cyan-900/20';

    return `
      <div class="streak-widget p-4 rounded-xl ${atRiskClass} border mb-6">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="text-3xl ${flameClass}">${status.currentStreak >= 7 ? '🔥' : '✨'}</span>
            <div>
              <div class="text-2xl font-bold text-white">${status.currentStreak} ${status.currentStreak === 1 ? 'día' : 'días'}</div>
              <div class="text-sm text-gray-400">Racha actual</div>
            </div>
          </div>

          <div class="text-right">
            <div class="text-sm text-gray-400">Récord: ${status.longestStreak} días</div>
            <div class="text-xs text-gray-500">${status.totalActiveDays} días totales</div>
          </div>
        </div>

        ${status.atRisk ? `
          <div class="mt-3 pt-3 border-t border-amber-500/30">
            <p class="text-sm text-amber-400 flex items-center gap-2">
              <span>⚠️</span>
              <span>¡Practica hoy para mantener tu racha!</span>
            </p>
          </div>
        ` : `
          <div class="mt-3 pt-3 border-t border-cyan-500/30">
            <p class="text-sm text-cyan-400">${status.message}</p>
          </div>
        `}

        ${this.renderNextMilestone(status.currentStreak)}
      </div>
    `;
  }

  /**
   * Renderiza el progreso hacia el siguiente milestone
   */
  renderNextMilestone(currentStreak) {
    const nextMilestone = this.milestones.find(m => m > currentStreak);
    if (!nextMilestone) return '';

    const progress = (currentStreak / nextMilestone) * 100;
    const daysRemaining = nextMilestone - currentStreak;

    return `
      <div class="mt-3">
        <div class="flex justify-between text-xs text-gray-500 mb-1">
          <span>Próximo logro: ${nextMilestone} días</span>
          <span>${daysRemaining} días restantes</span>
        </div>
        <div class="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
          <div class="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-500 rounded-full"
               style="width: ${progress}%"></div>
        </div>
      </div>
    `;
  }

  /**
   * Muestra notificación de racha actualizada
   */
  showStreakNotification(result) {
    if (!window.toast) return;

    if (result.newMilestone) {
      window.toast.success(`🔥 ¡${result.newMilestone} días de racha! ¡Increíble!`);
    } else if (result.streakBroken) {
      window.toast.info('💪 Nueva racha iniciada. ¡Tú puedes!');
    } else if (result.streakUpdated) {
      // Solo mostrar cada 5 días para no ser molesto
      if (result.currentStreak % 5 === 0) {
        window.toast.success(`✨ Racha de ${result.currentStreak} días`);
      }
    }
  }

  // ==========================================================================
  // RECORDATORIOS
  // ==========================================================================

  /**
   * Programa un recordatorio para mantener la racha
   * (Usa notificaciones del navegador si están disponibles)
   */
  scheduleReminder() {
    // Verificar si las notificaciones están disponibles
    if (!('Notification' in window)) return;

    // Pedir permiso si no se ha dado
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Programar para las 20:00 si no ha habido actividad
    const now = new Date();
    const reminderTime = new Date();
    reminderTime.setHours(20, 0, 0, 0);

    if (now > reminderTime) {
      reminderTime.setDate(reminderTime.getDate() + 1);
    }

    const timeUntilReminder = reminderTime - now;

    setTimeout(() => {
      this.sendReminderNotification();
    }, timeUntilReminder);
  }

  sendReminderNotification() {
    const status = this.getStreakStatus();

    if (status.status === 'active_today') return; // Ya hubo actividad hoy

    if (Notification.permission === 'granted') {
      new Notification('Colección Nuevo Ser', {
        body: status.atRisk
          ? `¡Tu racha de ${status.currentStreak} días está en riesgo! 🔥`
          : '¿Unos minutos de lectura consciente hoy? 📚',
        icon: '/assets/icons/icon-192.png',
        badge: '/assets/icons/icon-192.png',
        tag: 'streak-reminder'
      });
    }
  }

  // ==========================================================================
  // LOGROS
  // ==========================================================================

  unlockAchievement(achievementId) {
    if (this.data.achievements.includes(achievementId)) return;

    this.data.achievements.push(achievementId);
    this.saveData();

    // Notificar al sistema de logros si existe
    if (window.achievementSystem) {
      window.achievementSystem.unlock(achievementId);
    }
  }

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  getDateString(date) {
    return date.toISOString().split('T')[0];
  }

  getStreakStartDate(endDate, streakLength) {
    const end = new Date(endDate);
    const start = new Date(end.getTime() - (streakLength - 1) * 86400000);
    return this.getDateString(start);
  }

  /**
   * Resetea los datos (para testing)
   */
  reset() {
    localStorage.removeItem(this.storageKey);
    this.data = this.loadData();
    console.log('[StreakSystem] Data reset');
  }
}

// ============================================================================
// EXPORTAR Y AUTO-INICIALIZAR
// ============================================================================

window.StreakSystem = StreakSystem;
window.streakSystem = new StreakSystem();

// Registrar actividad automáticamente en ciertos eventos
document.addEventListener('DOMContentLoaded', () => {
  // Registrar actividad cuando el usuario lee un capítulo
  window.addEventListener('chapter-read', () => {
    const result = window.streakSystem.recordActivity();
    window.streakSystem.showStreakNotification(result);
  });

  // Registrar actividad cuando completa una práctica
  window.addEventListener('practice-completed', () => {
    const result = window.streakSystem.recordActivity();
    window.streakSystem.showStreakNotification(result);
  });

  // Programar recordatorio
  window.streakSystem.scheduleReminder();
});
