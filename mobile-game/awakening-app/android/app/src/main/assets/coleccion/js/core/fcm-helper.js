/**
 * FCMHelper - Firebase Cloud Messaging Integration
 *
 * Maneja push notifications usando Firebase Cloud Messaging:
 * - Registro y obtención de token FCM
 * - Solicitud de permisos de notificación
 * - Suscripción a topics
 * - Manejo de mensajes recibidos
 * - Sincronización de token con backend (Supabase)
 *
 * Requiere:
 * - FCMPlugin.kt en el lado nativo
 * - Firebase configurado en el proyecto Android
 * - google-services.json en android/app/
 *
 * Uso:
 * ```javascript
 * const fcm = new FCMHelper();
 * await fcm.init();
 * ```
 */
class FCMHelper {
    constructor() {
        this.isCapacitor = typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform();
        this.fcmAvailable = false;
        this.fcmToken = null;
        this.permissionGranted = false;
        this.subscriptions = new Set();

        // console.log('[FCM] Inicializando FCMHelper...');
    }

    /**
     * Inicializa el helper de FCM
     * - Verifica disponibilidad
     * - Solicita permisos si es necesario
     * - Obtiene token
     * - Configura listeners
     */
    async init() {
        if (!this.isCapacitor) {
            // console.log('[FCM] No está en plataforma nativa, FCM no disponible');
            return;
        }

        try {
            // Verificar si FCM está disponible
            this.fcmAvailable = await this.checkAvailability();

            if (!this.fcmAvailable) {
                // console.log('[FCM] Firebase Cloud Messaging no disponible en este dispositivo');
                return;
            }

            // console.log('[FCM] Firebase Cloud Messaging disponible');

            // Cargar preferencias guardadas
            await this.loadPreferences();

            // Si el usuario ha habilitado notificaciones push, configurar
            const pushEnabled = localStorage.getItem('push-notifications-enabled') === 'true';

            if (pushEnabled) {
                await this.enablePushNotifications();
            }

        } catch (error) {
            console.error('[FCM] Error inicializando:', error);
        }

        // Exponer globalmente
        window.fcmHelper = this;
        // console.log('[FCM] Helper inicializado');
    }

    /**
     * Verifica si FCM está disponible en el dispositivo
     * @returns {Promise<boolean>}
     */
    async checkAvailability() {
        if (!this.isCapacitor) {
            return false;
        }

        try {
            if (window.Capacitor?.Plugins?.FCMPlugin) {
                const { FCMPlugin } = window.Capacitor.Plugins;
                const result = await FCMPlugin.isAvailable();
                return result.available === true;
            }
        } catch (error) {
            console.error('[FCM] Error verificando disponibilidad:', error);
        }

        return false;
    }

    /**
     * Solicita permisos de notificación al usuario
     * @returns {Promise<boolean>} true si se otorgaron permisos
     */
    async requestPermission() {
        if (!this.fcmAvailable || !this.isCapacitor) {
            return false;
        }

        try {
            const { FCMPlugin } = window.Capacitor.Plugins;
            const result = await FCMPlugin.requestPermission();

            this.permissionGranted = result.granted === true;

            if (this.permissionGranted) {
                // console.log('[FCM] ✓ Permisos de notificación otorgados');
            } else {
                // console.log('[FCM] ✗ Permisos de notificación denegados');

                if (result.shouldShowRationale) {
                    // Mostrar explicación al usuario
                    this.showPermissionRationale();
                }
            }

            return this.permissionGranted;

        } catch (error) {
            console.error('[FCM] Error solicitando permisos:', error);
            return false;
        }
    }

    /**
     * Obtiene el token FCM del dispositivo
     * @returns {Promise<string|null>}
     */
    async getToken() {
        if (!this.fcmAvailable || !this.isCapacitor) {
            return null;
        }

        try {
            const { FCMPlugin } = window.Capacitor.Plugins;
            const result = await FCMPlugin.getToken();

            this.fcmToken = result.token;
            // console.log('[FCM] Token obtenido:', this.fcmToken);

            // Guardar token localmente
            localStorage.setItem('fcm-token', this.fcmToken);

            // Sincronizar con backend si hay sesión activa
            if (window.supabaseAuthHelper?.isAuthenticated()) {
                await this.syncTokenToBackend();
            }

            return this.fcmToken;

        } catch (error) {
            console.error('[FCM] Error obteniendo token:', error);
            return null;
        }
    }

    /**
     * Habilita push notifications
     * - Solicita permisos
     * - Obtiene token
     * - Suscribe a topics por defecto
     */
    async enablePushNotifications() {
        // console.log('[FCM] Habilitando push notifications...');

        // Solicitar permisos
        const granted = await this.requestPermission();

        if (!granted) {
            // console.log('[FCM] No se pueden habilitar push notifications sin permisos');
            return false;
        }

        // Obtener token
        const token = await this.getToken();

        if (!token) {
            // console.log('[FCM] No se pudo obtener token FCM');
            return false;
        }

        // Suscribir a topics por defecto
        await this.subscribeToDefaultTopics();

        // Guardar preferencia
        localStorage.setItem('push-notifications-enabled', 'true');

        // console.log('[FCM] ✓ Push notifications habilitadas');
        return true;
    }

    /**
     * Deshabilita push notifications
     */
    async disablePushNotifications() {
        // console.log('[FCM] Deshabilitando push notifications...');

        // Desuscribir de todos los topics
        await this.unsubscribeFromAllTopics();

        // Eliminar token
        try {
            const { FCMPlugin } = window.Capacitor.Plugins;
            await FCMPlugin.deleteToken();
            // console.log('[FCM] Token eliminado');
        } catch (error) {
            // console.warn('[FCM] Error eliminando token:', error);
        }

        // Limpiar estado local
        this.fcmToken = null;
        localStorage.removeItem('fcm-token');
        localStorage.setItem('push-notifications-enabled', 'false');

        // console.log('[FCM] ✓ Push notifications deshabilitadas');
    }

    /**
     * Suscribe a un topic de Firebase
     * @param {string} topic - Nombre del topic
     */
    async subscribeToTopic(topic) {
        if (!this.fcmAvailable || !this.permissionGranted) {
            // console.log('[FCM] No se puede suscribir al topic sin permisos');
            return false;
        }

        try {
            const { FCMPlugin } = window.Capacitor.Plugins;
            await FCMPlugin.subscribeToTopic({ topic });

            this.subscriptions.add(topic);
            this.saveSubscriptions();

            // console.log(`[FCM] ✓ Suscrito al topic: ${topic}`);
            return true;

        } catch (error) {
            console.error(`[FCM] Error suscribiendo al topic ${topic}:`, error);
            return false;
        }
    }

    /**
     * Desuscribe de un topic de Firebase
     * @param {string} topic - Nombre del topic
     */
    async unsubscribeFromTopic(topic) {
        if (!this.fcmAvailable) {
            return false;
        }

        try {
            const { FCMPlugin } = window.Capacitor.Plugins;
            await FCMPlugin.unsubscribeFromTopic({ topic });

            this.subscriptions.delete(topic);
            this.saveSubscriptions();

            // console.log(`[FCM] ✓ Desuscrito del topic: ${topic}`);
            return true;

        } catch (error) {
            console.error(`[FCM] Error desuscribiendo del topic ${topic}:`, error);
            return false;
        }
    }

    /**
     * Suscribe a topics por defecto
     */
    async subscribeToDefaultTopics() {
        const defaultTopics = [
            'all_users',           // Todos los usuarios
            'general_announcements' // Anuncios generales
        ];

        for (const topic of defaultTopics) {
            await this.subscribeToTopic(topic);
        }
    }

    /**
     * Desuscribe de todos los topics
     */
    async unsubscribeFromAllTopics() {
        const topics = Array.from(this.subscriptions);

        for (const topic of topics) {
            await this.unsubscribeFromTopic(topic);
        }
    }

    /**
     * Sincroniza el token FCM con el backend (Supabase)
     */
    async syncTokenToBackend() {
        if (!window.supabaseAuthHelper?.isAuthenticated()) {
            // console.log('[FCM] No hay sesión activa, no se sincroniza token');
            return;
        }

        if (!this.fcmToken) {
            // console.log('[FCM] No hay token para sincronizar');
            return;
        }

        try {
            const userId = window.supabaseAuthHelper.user.id;
            const supabase = window.supabaseAuthHelper.supabase;

            // Guardar token en tabla fcm_tokens
            const { error } = await supabase
                .from('fcm_tokens')
                .upsert({
                    user_id: userId,
                    token: this.fcmToken,
                    platform: 'android',
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'user_id,token'
                });

            if (error) {
                console.error('[FCM] Error guardando token en Supabase:', error);
            } else {
                // console.log('[FCM] ✓ Token sincronizado con Supabase');
            }

        } catch (error) {
            console.error('[FCM] Error sincronizando token:', error);
        }
    }

    /**
     * Muestra una explicación sobre por qué se necesitan permisos
     */
    showPermissionRationale() {
        // Aquí podrías mostrar un modal explicando por qué necesitas permisos
        // console.log('[FCM] Mostrando explicación de permisos...');

        // Ejemplo: mostrar toast o modal
        if (window.showToast) {
            window.showToast(
                'Las notificaciones te ayudarán a mantener tu hábito de lectura con recordatorios diarios',
                'info',
                5000
            );
        }
    }

    /**
     * Carga preferencias guardadas
     */
    async loadPreferences() {
        // Cargar token guardado
        this.fcmToken = localStorage.getItem('fcm-token');

        // Cargar suscripciones
        const subscriptionsStr = localStorage.getItem('fcm-subscriptions');
        if (subscriptionsStr) {
            try {
                const subsArray = JSON.parse(subscriptionsStr);
                this.subscriptions = new Set(subsArray);
            } catch (error) {
                // console.warn('[FCM] Error parseando suscripciones:', error);
            }
        }

        // Verificar permisos
        if (this.fcmToken) {
            this.permissionGranted = true;
        }
    }

    /**
     * Guarda suscripciones en localStorage
     */
    saveSubscriptions() {
        const subsArray = Array.from(this.subscriptions);
        localStorage.setItem('fcm-subscriptions', JSON.stringify(subsArray));
    }

    /**
     * Renderiza el panel de configuración para el modal de settings
     * @returns {string} HTML del panel
     */
    renderSettingsPanel() {
        if (!this.fcmAvailable) {
            return `
                <div class="fcm-settings">
                    <h4 class="text-sm font-semibold mb-3 text-gray-400">Notificaciones Push</h4>
                    <div class="bg-slate-700/50 rounded-lg p-4">
                        <p class="text-sm text-gray-400">
                            <i class="lucide-info mr-2"></i>
                            Firebase Cloud Messaging no está disponible en este dispositivo.
                        </p>
                        <p class="text-xs text-gray-500 mt-2">
                            Requiere Google Play Services instalado.
                        </p>
                    </div>
                </div>
            `;
        }

        const pushEnabled = localStorage.getItem('push-notifications-enabled') === 'true';

        return `
            <div class="fcm-settings">
                <h4 class="text-sm font-semibold mb-3 text-gray-400">Notificaciones Push</h4>

                <div class="settings-group">
                    <label class="flex items-center justify-between">
                        <div class="flex-1">
                            <span class="block font-medium">Notificaciones push</span>
                            <span class="text-sm text-gray-400 mt-1">
                                Recibe recordatorios y notificaciones desde la nube
                            </span>
                        </div>
                        <input
                            type="checkbox"
                            id="push-notifications-toggle"
                            ${pushEnabled ? 'checked' : ''}
                            class="toggle-switch">
                    </label>
                </div>

                ${pushEnabled && this.fcmToken ? `
                    <div class="mt-4 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                        <p class="text-sm text-blue-300">
                            <i class="lucide-check-circle mr-2"></i>
                            Push notifications activas
                        </p>
                        <p class="text-xs text-gray-400 mt-2">
                            Token: ${this.fcmToken.substring(0, 20)}...
                        </p>
                    </div>

                    <div class="mt-4">
                        <h5 class="text-sm font-semibold mb-2">Tipos de notificación</h5>
                        <div class="space-y-2">
                            <label class="flex items-center">
                                <input type="checkbox" id="topic-reading-reminders" checked class="mr-2">
                                <span class="text-sm">Recordatorios de lectura</span>
                            </label>
                            <label class="flex items-center">
                                <input type="checkbox" id="topic-achievements" checked class="mr-2">
                                <span class="text-sm">Logros desbloqueados</span>
                            </label>
                            <label class="flex items-center">
                                <input type="checkbox" id="topic-new-content" checked class="mr-2">
                                <span class="text-sm">Nuevo contenido</span>
                            </label>
                            <label class="flex items-center">
                                <input type="checkbox" id="topic-daily-koan" checked class="mr-2">
                                <span class="text-sm">Koan del día</span>
                            </label>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Adjunta los event listeners al panel de settings
     */
    attachSettingsListeners() {
        const toggle = document.getElementById('push-notifications-toggle');

        if (toggle) {
            toggle.addEventListener('change', async (e) => {
                if (e.target.checked) {
                    const success = await this.enablePushNotifications();
                    if (!success) {
                        // Desmarcar si falló
                        e.target.checked = false;
                    } else {
                        // Recargar panel para mostrar opciones
                        this.reloadSettingsPanel();
                    }
                } else {
                    await this.disablePushNotifications();
                    this.reloadSettingsPanel();
                }
            });
        }

        // Listeners para topics
        const topicCheckboxes = {
            'topic-reading-reminders': 'reading_reminders',
            'topic-achievements': 'achievements',
            'topic-new-content': 'new_content',
            'topic-daily-koan': 'daily_koan'
        };

        Object.entries(topicCheckboxes).forEach(([checkboxId, topic]) => {
            const checkbox = document.getElementById(checkboxId);
            if (checkbox) {
                checkbox.addEventListener('change', async (e) => {
                    if (e.target.checked) {
                        await this.subscribeToTopic(topic);
                    } else {
                        await this.unsubscribeFromTopic(topic);
                    }
                });
            }
        });
    }

    /**
     * Recarga el panel de settings (helper para actualizar UI)
     */
    reloadSettingsPanel() {
        if (window.settingsModal) {
            window.settingsModal.updateContent();
        }
    }
}

// Auto-inicialización
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new FCMHelper();
    });
} else {
    new FCMHelper();
}
