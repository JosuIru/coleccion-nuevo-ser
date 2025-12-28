/**
// 🔧 FIX v2.9.198: Migrated console.log to logger
 * Supabase Notifications Helper
 * Sistema de notificaciones inteligentes basado en Supabase Realtime
 */

class SupabaseNotificationsHelper {
    constructor() {
        this.isCapacitor = typeof Capacitor !== 'undefined';
        this.channel = null;
        this.lastNotificationTime = {};
        this.minNotificationInterval = 3600000; // 1 hora entre notificaciones del mismo tipo
    }

    /**
     * Inicializar sistema de notificaciones
     */
    async init() {
        if (!window.supabaseAuthHelper?.isAuthenticated()) {
            // logger.debug('Notifications: Usuario no autenticado');
            return;
        }

        // Verificar permisos de notificaciones
        const hasPermission = await this.checkPermissions();
        if (!hasPermission) {
            // logger.debug('Notifications: Sin permisos');
            return;
        }

        // Subscribe a realtime channel para notificaciones
        await this.setupRealtimeNotifications();

        // Schedule notificaciones locales periódicas
        await this.schedulePeriodicNotifications();

        // logger.debug('✓ Supabase Notifications inicializado');
    }

    /**
     * Verificar permisos de notificaciones
     */
    async checkPermissions() {
        if (!this.isCapacitor || !window.Capacitor?.Plugins?.LocalNotifications) {
            return false;
        }

        try {
            const { display } = await window.Capacitor.Plugins.LocalNotifications.checkPermissions();

            if (display !== 'granted') {
                const result = await window.Capacitor.Plugins.LocalNotifications.requestPermissions();
                return result.display === 'granted';
            }

            return true;
        } catch (error) {
            console.error('Error checking notification permissions:', error);
            return false;
        }
    }

    /**
     * Setup realtime notifications desde Supabase
     */
    async setupRealtimeNotifications() {
        if (!window.supabaseAuthHelper?.supabase) return;

        const userId = window.supabaseAuthHelper.user?.id;
        if (!userId) return;

        // Canal de realtime para notificaciones personalizadas
        this.channel = window.supabaseAuthHelper.supabase
            .channel('user-notifications')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'user_notifications',
                    filter: `user_id=eq.${userId}`
                },
                (payload) => {
                    this.handleRealtimeNotification(payload.new);
                }
            )
            .subscribe();

        // logger.debug('✓ Realtime notifications activo');
    }

    /**
     * Manejar notificación desde realtime
     */
    async handleRealtimeNotification(notification) {
        if (!this.shouldSendNotification(notification.type)) {
            return;
        }

        await this.sendLocalNotification({
            title: notification.title,
            body: notification.body,
            data: notification.data
        });

        this.lastNotificationTime[notification.type] = Date.now();
    }

    /**
     * Verificar si debe enviar notificación (rate limiting)
     */
    shouldSendNotification(type) {
        const lastTime = this.lastNotificationTime[type] || 0;
        const now = Date.now();
        return (now - lastTime) >= this.minNotificationInterval;
    }

    /**
     * Enviar notificación local
     */
    async sendLocalNotification({ title, body, data = {} }) {
        if (!this.isCapacitor || !window.Capacitor?.Plugins?.LocalNotifications) {
            // logger.debug('Notification:', title, '-', body);
            return;
        }

        try {
            await window.Capacitor.Plugins.LocalNotifications.schedule({
                notifications: [{
                    title,
                    body,
                    id: Date.now(),
                    schedule: { at: new Date(Date.now() + 1000) }, // 1 segundo
                    sound: undefined,
                    attachments: undefined,
                    actionTypeId: "",
                    extra: data
                }]
            });
        } catch (error) {
            console.error('Error sending notification:', error);
        }
    }

    /**
     * Schedule notificaciones periódicas inteligentes
     */
    async schedulePeriodicNotifications() {
        // Notificación diaria de lectura (si no ha leído hoy)
        await this.scheduleDailyReadingReminder();

        // Notificación de racha en riesgo
        await this.scheduleStreakReminder();

        // Notificación de koan del día
        await this.scheduleDailyKoan();
    }

    /**
     * Recordatorio diario de lectura
     */
    async scheduleDailyReadingReminder() {
        if (!this.isCapacitor) return;

        const lastRead = localStorage.getItem('last-read-date');
        const today = new Date().toDateString();

        if (lastRead !== today) {
            // Programar notificación para las 20:00
            const notificationTime = new Date();
            notificationTime.setHours(20, 0, 0, 0);

            if (notificationTime < new Date()) {
                notificationTime.setDate(notificationTime.getDate() + 1);
            }

            try {
                await window.Capacitor.Plugins.LocalNotifications.schedule({
                    notifications: [{
                        title: '📚 Momento de lectura',
                        body: 'Dedica unos minutos a tu crecimiento personal',
                        id: 1,
                        schedule: { at: notificationTime },
                        sound: undefined,
                        attachments: undefined,
                        actionTypeId: ""
                    }]
                });
            } catch (error) {
                console.error('Error scheduling reading reminder:', error);
            }
        }
    }

    /**
     * Recordatorio de racha en riesgo
     */
    async scheduleStreakReminder() {
        if (!this.isCapacitor) return;

        const widgetData = window.widgetDataHelper?.getCurrentData();
        if (!widgetData) return;

        const lastRead = localStorage.getItem('last-read-date');
        const today = new Date().toDateString();
        const streak = widgetData.streak.days;

        // Si tiene racha y no ha leído hoy
        if (streak > 0 && lastRead !== today) {
            const notificationTime = new Date();
            notificationTime.setHours(21, 30, 0, 0);

            if (notificationTime < new Date()) {
                notificationTime.setDate(notificationTime.getDate() + 1);
            }

            try {
                await window.Capacitor.Plugins.LocalNotifications.schedule({
                    notifications: [{
                        title: '🔥 ¡Mantén tu racha!',
                        body: `Llevas ${streak} días seguidos. No pierdas el momentum.`,
                        id: 2,
                        schedule: { at: notificationTime },
                        sound: undefined,
                        attachments: undefined,
                        actionTypeId: ""
                    }]
                });
            } catch (error) {
                console.error('Error scheduling streak reminder:', error);
            }
        }
    }

    /**
     * Koan del día
     */
    async scheduleDailyKoan() {
        if (!this.isCapacitor) return;

        const widgetData = window.widgetDataHelper?.getCurrentData();
        if (!widgetData?.dailyKoan) return;

        const notificationTime = new Date();
        notificationTime.setHours(9, 0, 0, 0);

        if (notificationTime < new Date()) {
            notificationTime.setDate(notificationTime.getDate() + 1);
        }

        try {
            await window.Capacitor.Plugins.LocalNotifications.schedule({
                notifications: [{
                    title: '☯️ Koan del día',
                    body: widgetData.dailyKoan.shortText,
                    id: 3,
                    schedule: { at: notificationTime },
                    sound: undefined,
                    attachments: undefined,
                    actionTypeId: ""
                }]
            });
        } catch (error) {
            console.error('Error scheduling koan:', error);
        }
    }

    /**
     * Enviar notificación de logro desbloqueado
     */
    async notifyAchievementUnlocked(achievement) {
        await this.sendLocalNotification({
            title: '🏆 ¡Logro desbloqueado!',
            body: achievement.title,
            data: { type: 'achievement', id: achievement.id }
        });
    }

    /**
     * Enviar notificación de capítulo completado
     */
    async notifyChapterCompleted(bookTitle, chapterTitle) {
        await this.sendLocalNotification({
            title: '✅ Capítulo completado',
            body: `"${chapterTitle}" de ${bookTitle}`,
            data: { type: 'chapter_completed' }
        });
    }

    /**
     * Enviar notificación de libro completado
     */
    async notifyBookCompleted(bookTitle) {
        await this.sendLocalNotification({
            title: '🎉 ¡Libro completado!',
            body: `Has terminado "${bookTitle}"`,
            data: { type: 'book_completed' }
        });
    }

    /**
     * Cleanup
     */
    cleanup() {
        if (this.channel) {
            window.supabaseAuthHelper?.supabase?.removeChannel(this.channel);
            this.channel = null;
        }
    }
}

// Crear instancia global
window.supabaseNotificationsHelper = new SupabaseNotificationsHelper();
