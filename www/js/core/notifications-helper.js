// ============================================================================
// NOTIFICATIONS HELPER - Sistema de Notificaciones Locales
// ============================================================================

class NotificationsHelper {
  constructor() {
    this.isCapacitor = typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform();
    this.hasPermission = false;
    this.scheduledNotifications = this.loadScheduled();

    // Configuración por defecto
    this.config = {
      readingReminderEnabled: this.getConfig('readingReminderEnabled', true),
      readingReminderTime: this.getConfig('readingReminderTime', '20:00'), // 8 PM
      dailyKoanEnabled: this.getConfig('dailyKoanEnabled', false),
      dailyKoanTime: this.getConfig('dailyKoanTime', '09:00'), // 9 AM
      achievementAlerts: this.getConfig('achievementAlerts', true)
    };

    this.init();
  }

  // ==========================================================================
  // INICIALIZACIÓN
  // ==========================================================================

  async init() {
    if (this.isCapacitor) {
      await this.checkPermission();
      this.setupListeners();
    }

    // Exponer globalmente
    window.notificationsHelper = this;
  }

  async checkPermission() {
    try {
      if (window.Capacitor?.Plugins?.LocalNotifications) {
        const { LocalNotifications } = window.Capacitor.Plugins;
        const result = await LocalNotifications.checkPermissions();
        this.hasPermission = result.display === 'granted';
        return this.hasPermission;
      }
    } catch (error) {
      // console.warn('Error checking notification permission:', error);
    }
    return false;
  }

  async requestPermission() {
    try {
      if (window.Capacitor?.Plugins?.LocalNotifications) {
        const { LocalNotifications } = window.Capacitor.Plugins;
        const result = await LocalNotifications.requestPermissions();
        this.hasPermission = result.display === 'granted';
        return this.hasPermission;
      }
    } catch (error) {
      // console.warn('Error requesting notification permission:', error);
    }
    return false;
  }

  setupListeners() {
    try {
      if (window.Capacitor?.Plugins?.LocalNotifications) {
        const { LocalNotifications } = window.Capacitor.Plugins;

        // Listener para cuando se hace tap en una notificación
        LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
          this.handleNotificationAction(notification);
        });
      }
    } catch (error) {
      // console.warn('Error setting up notification listeners:', error);
    }
  }

  // ==========================================================================
  // PERSISTENCIA
  // ==========================================================================

  loadScheduled() {
    try {
      return JSON.parse(localStorage.getItem('scheduled-notifications')) || [];
    } catch {
      return [];
    }
  }

  saveScheduled() {
    localStorage.setItem('scheduled-notifications', JSON.stringify(this.scheduledNotifications));
  }

  getConfig(key, defaultValue) {
    try {
      const stored = localStorage.getItem(`notification-config-${key}`);
      return stored !== null ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  setConfig(key, value) {
    localStorage.setItem(`notification-config-${key}`, JSON.stringify(value));
    this.config[key] = value;
  }

  // ==========================================================================
  // PROGRAMAR NOTIFICACIONES
  // ==========================================================================

  async scheduleReadingReminder() {
    if (!this.isCapacitor || !this.config.readingReminderEnabled) return;

    await this.cancelNotificationsByType('reading-reminder');

    const [hours, minutes] = this.config.readingReminderTime.split(':').map(Number);

    // Programar para mañana a la hora indicada
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(hours, minutes, 0, 0);

    const notifications = [
      {
        id: this.generateId(),
        type: 'reading-reminder',
        title: 'Momento de lectura',
        body: 'Toma unos minutos para continuar tu camino de transformación',
        schedule: { at: tomorrow, every: 'day' },
        smallIcon: 'ic_notification',
        iconColor: '#0ea5e9'
      }
    ];

    await this.scheduleNotifications(notifications);
  }

  async scheduleDailyKoan() {
    if (!this.isCapacitor || !this.config.dailyKoanEnabled) return;

    await this.cancelNotificationsByType('daily-koan');

    const [hours, minutes] = this.config.dailyKoanTime.split(':').map(Number);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(hours, minutes, 0, 0);

    // Generar un koan aleatorio
    const koans = [
      '¿Qué sonido hace tu mente cuando está en silencio?',
      '¿Quién observa tus pensamientos?',
      '¿Dónde estabas antes de nacer?',
      'Si no tienes problemas, ¿cuál es el problema?',
      '¿Cuál era tu rostro antes de que nacieran tus padres?',
      'El dedo que señala la luna no es la luna. ¿Qué es lo que señalas?',
      '¿Puede el fuego quemarse a sí mismo?'
    ];

    const randomKoan = koans[Math.floor(Math.random() * koans.length)];

    const notifications = [
      {
        id: this.generateId(),
        type: 'daily-koan',
        title: 'Koan del día',
        body: randomKoan,
        schedule: { at: tomorrow, every: 'day' },
        smallIcon: 'ic_notification',
        iconColor: '#a855f7'
      }
    ];

    await this.scheduleNotifications(notifications);
  }

  async scheduleAchievementReminder(achievement) {
    if (!this.isCapacitor || !this.config.achievementAlerts) return;

    // Notificación inmediata para logro desbloqueado
    const notifications = [
      {
        id: this.generateId(),
        type: 'achievement',
        title: `${achievement.icon} ¡Logro desbloqueado!`,
        body: `${achievement.titulo}: ${achievement.descripcion}`,
        schedule: { at: new Date(Date.now() + 1000) }, // 1 segundo
        smallIcon: 'ic_notification',
        iconColor: '#fbbf24',
        extra: { achievementId: achievement.id }
      }
    ];

    await this.scheduleNotifications(notifications);
  }

  async scheduleReadingProgress(bookTitle, chaptersLeft) {
    if (!this.isCapacitor) return;

    // Recordatorio para completar el libro
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);

    const notifications = [
      {
        id: this.generateId(),
        type: 'reading-progress',
        title: `Continúa "${bookTitle}"`,
        body: `Te quedan ${chaptersLeft} capítulos. ¡Sigue adelante!`,
        schedule: { at: tomorrow },
        smallIcon: 'ic_notification',
        iconColor: '#22c55e'
      }
    ];

    await this.scheduleNotifications(notifications);
  }

  // ==========================================================================
  // API CAPACITOR
  // ==========================================================================

  async scheduleNotifications(notifications) {
    if (!this.isCapacitor) return false;

    try {
      if (window.Capacitor?.Plugins?.LocalNotifications) {
        const { LocalNotifications } = window.Capacitor.Plugins;

        // Verificar permisos
        if (!this.hasPermission) {
          const granted = await this.requestPermission();
          if (!granted) {
            // console.warn('Notification permission denied');
            return false;
          }
        }

        // Programar notificaciones
        await LocalNotifications.schedule({ notifications });

        // Guardar en registro local
        notifications.forEach(n => {
          this.scheduledNotifications.push({
            id: n.id,
            type: n.type,
            scheduledAt: n.schedule.at
          });
        });
        this.saveScheduled();

        return true;
      }
    } catch (error) {
      // console.warn('Error scheduling notifications:', error);
    }
    return false;
  }

  async cancelNotificationsByType(type) {
    if (!this.isCapacitor) return;

    try {
      if (window.Capacitor?.Plugins?.LocalNotifications) {
        const { LocalNotifications } = window.Capacitor.Plugins;

        const toCancel = this.scheduledNotifications
          .filter(n => n.type === type)
          .map(n => ({ id: n.id }));

        if (toCancel.length > 0) {
          await LocalNotifications.cancel({ notifications: toCancel });
        }

        this.scheduledNotifications = this.scheduledNotifications.filter(n => n.type !== type);
        this.saveScheduled();
      }
    } catch (error) {
      // console.warn('Error canceling notifications:', error);
    }
  }

  async cancelAllNotifications() {
    if (!this.isCapacitor) return;

    try {
      if (window.Capacitor?.Plugins?.LocalNotifications) {
        const { LocalNotifications } = window.Capacitor.Plugins;

        const toCancel = this.scheduledNotifications.map(n => ({ id: n.id }));
        if (toCancel.length > 0) {
          await LocalNotifications.cancel({ notifications: toCancel });
        }

        this.scheduledNotifications = [];
        this.saveScheduled();
      }
    } catch (error) {
      // console.warn('Error canceling all notifications:', error);
    }
  }

  // ==========================================================================
  // MANEJO DE ACCIONES
  // ==========================================================================

  handleNotificationAction(notification) {
    const data = notification.notification;
    const type = data.extra?.type || '';

    switch (type) {
      case 'reading-reminder':
        // Abrir la app (ya está abierta por el tap)
        break;
      case 'daily-koan':
        // Abrir modal de koans
        if (window.koanModal) {
          window.koanModal.open();
        }
        break;
      case 'achievement':
        // Abrir modal de logros
        if (window.achievementSystem) {
          window.achievementSystem.showDashboardModal();
        }
        break;
      case 'reading-progress':
        // Continuar leyendo
        break;
    }
  }

  // ==========================================================================
  // UTILIDADES
  // ==========================================================================

  generateId() {
    return Math.floor(Math.random() * 2147483647); // ID entero positivo
  }

  // ==========================================================================
  // CONFIGURACIÓN UI
  // ==========================================================================

  renderSettingsPanel() {
    return `
      <div class="notifications-settings space-y-4">
        <h3 class="text-lg font-bold text-cyan-300 mb-4">Notificaciones</h3>

        <!-- Reading Reminder -->
        <div class="flex items-center justify-between p-3 bg-gray-800/50 rounded-xl border border-gray-700">
          <div class="flex-1">
            <label class="font-semibold">Recordatorio de lectura</label>
            <p class="text-sm text-gray-400">Recibe un recordatorio diario</p>
          </div>
          <div class="flex items-center gap-3">
            <input type="time" id="reading-reminder-time"
                   value="${this.config.readingReminderTime}"
                   class="px-3 py-1 bg-gray-700 border border-gray-600 rounded-lg text-sm">
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" id="reading-reminder-toggle"
                     ${this.config.readingReminderEnabled ? 'checked' : ''}
                     class="sr-only peer">
              <div class="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
            </label>
          </div>
        </div>

        <!-- Daily Koan -->
        <div class="flex items-center justify-between p-3 bg-gray-800/50 rounded-xl border border-gray-700">
          <div class="flex-1">
            <label class="font-semibold">Koan diario</label>
            <p class="text-sm text-gray-400">Recibe una pregunta para reflexionar</p>
          </div>
          <div class="flex items-center gap-3">
            <input type="time" id="daily-koan-time"
                   value="${this.config.dailyKoanTime}"
                   class="px-3 py-1 bg-gray-700 border border-gray-600 rounded-lg text-sm">
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" id="daily-koan-toggle"
                     ${this.config.dailyKoanEnabled ? 'checked' : ''}
                     class="sr-only peer">
              <div class="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
            </label>
          </div>
        </div>

        <!-- Achievement Alerts -->
        <div class="flex items-center justify-between p-3 bg-gray-800/50 rounded-xl border border-gray-700">
          <div class="flex-1">
            <label class="font-semibold">Alertas de logros</label>
            <p class="text-sm text-gray-400">Notificaciones al desbloquear logros</p>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" id="achievement-alerts-toggle"
                   ${this.config.achievementAlerts ? 'checked' : ''}
                   class="sr-only peer">
            <div class="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
          </label>
        </div>

        ${!this.hasPermission && this.isCapacitor ? `
          <button id="request-notification-permission"
                  class="w-full px-4 py-3 bg-cyan-600 hover:bg-cyan-500 rounded-xl font-semibold transition">
            Activar notificaciones
          </button>
        ` : ''}
      </div>
    `;
  }

  attachSettingsListeners() {
    // Reading reminder toggle
    document.getElementById('reading-reminder-toggle')?.addEventListener('change', (e) => {
      this.setConfig('readingReminderEnabled', e.target.checked);
      if (e.target.checked) {
        this.scheduleReadingReminder();
      } else {
        this.cancelNotificationsByType('reading-reminder');
      }
    });

    document.getElementById('reading-reminder-time')?.addEventListener('change', (e) => {
      this.setConfig('readingReminderTime', e.target.value);
      if (this.config.readingReminderEnabled) {
        this.scheduleReadingReminder();
      }
    });

    // Daily koan toggle
    document.getElementById('daily-koan-toggle')?.addEventListener('change', (e) => {
      this.setConfig('dailyKoanEnabled', e.target.checked);
      if (e.target.checked) {
        this.scheduleDailyKoan();
      } else {
        this.cancelNotificationsByType('daily-koan');
      }
    });

    document.getElementById('daily-koan-time')?.addEventListener('change', (e) => {
      this.setConfig('dailyKoanTime', e.target.value);
      if (this.config.dailyKoanEnabled) {
        this.scheduleDailyKoan();
      }
    });

    // Achievement alerts toggle
    document.getElementById('achievement-alerts-toggle')?.addEventListener('change', (e) => {
      this.setConfig('achievementAlerts', e.target.checked);
    });

    // Request permission button
    document.getElementById('request-notification-permission')?.addEventListener('click', async () => {
      const granted = await this.requestPermission();
      if (granted) {
        window.toast?.success('Notificaciones activadas');
        // Re-render settings
      } else {
        window.toast?.error('No se pudieron activar las notificaciones');
      }
    });
  }
}

// ==========================================================================
// INICIALIZACIÓN AUTOMÁTICA
// ==========================================================================

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new NotificationsHelper());
} else {
  new NotificationsHelper();
}

// Exportar
window.NotificationsHelper = NotificationsHelper;
