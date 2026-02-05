/**
 * SettingsModalAccount - Cuenta, Notificaciones y Seguridad
 * v2.9.390: Arquitectura modular
 */
class SettingsModalAccount {
    constructor(settingsModal) {
        this.settingsModal = settingsModal;
    }

    // ==========================================================================
    // TAB CUENTA
    // ==========================================================================

    renderAccountTab() {
        const authHTML = window.supabaseAuthHelper?.renderSettingsPanel() ||
            '<p class="text-gray-400">Supabase Auth no disponible</p>';

        // Verificar si el usuario es el autor (admin)
        const authorToolsHTML = this.renderAuthorTools();

        return `
            <div class="settings-section">
                <h3 class="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6">Cuenta</h3>
                ${authHTML}
            </div>
            ${authorToolsHTML}
        `;
    }

    // ==========================================================================
    // HERRAMIENTAS DEL AUTOR
    // ==========================================================================

    /**
     * Verifica si el usuario actual es el autor/administrador
     */
    isAuthor() {
        const authHelper = window.authHelper || window.supabaseAuthHelper;
        const user = authHelper?.currentUser || authHelper?.user;

        if (!user?.email) return false;

        // El autor se identifica por su email configurado en env.js o por patron conocido
        const authorEmail = window.env?.ADMIN_EMAIL || 'irurag@gmail.com';
        return user.email === authorEmail;
    }

    /**
     * Renderiza las herramientas del autor (solo visibles para el admin)
     */
    renderAuthorTools() {
        if (!this.isAuthor()) return '';

        return `
            <div class="settings-section mt-8 pt-8 border-t border-amber-700/30">
                <h3 class="text-lg sm:text-xl font-bold text-amber-400 mb-4 sm:mb-6 flex items-center gap-2">
                    <span>🔧</span> Herramientas del Autor
                </h3>

                <div class="space-y-4">
                    <!-- Knowledge Evolution -->
                    <div class="bg-gradient-to-r from-amber-900/30 to-slate-800/50 rounded-xl p-4 border border-amber-700/30">
                        <div class="flex items-start gap-4">
                            <span class="text-3xl">🧠</span>
                            <div class="flex-1">
                                <h4 class="text-white font-semibold">Knowledge Evolution</h4>
                                <p class="text-sm text-slate-400 mt-1">
                                    Sistema que analiza los 18 libros, conecta conceptos y genera sintesis evolutiva.
                                </p>
                                <button onclick="window.settingsModal?.account?.openKnowledgeEvolution()"
                                        class="mt-3 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-sm rounded-lg transition-colors">
                                    Abrir Knowledge Evolution
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Otros tools del autor aqui en el futuro -->
                </div>
            </div>
        `;
    }

    /**
     * Abre el sistema Knowledge Evolution
     */
    async openKnowledgeEvolution() {
        try {
            // Cargar el modulo si no esta cargado
            if (!window.KnowledgeEvolution) {
                if (window.toast) {
                    window.toast.info('Cargando Knowledge Evolution...', 2000);
                }
                await window.lazyLoader.loadKnowledgeEvolution();
            }

            // Inicializar si es necesario
            if (!window.knowledgeEvolution) {
                window.knowledgeEvolution = new KnowledgeEvolution();
                await window.knowledgeEvolution.init();
            }

            // Cerrar settings y abrir Knowledge Evolution
            this.settingsModal.close();
            window.knowledgeEvolution.openModal();

        } catch (error) {
            logger.error('[SettingsModal] Error abriendo Knowledge Evolution:', error);
            if (window.toast) {
                window.toast.error('Error cargando Knowledge Evolution');
            }
        }
    }

    // ==========================================================================
    // TAB NOTIFICACIONES
    // ==========================================================================

    renderNotificationsTab() {
        const notificationsHTML = window.notificationsHelper?.renderSettingsPanel() ||
            '<p class="text-gray-400">NotificationsHelper no disponible</p>';

        const fcmHTML = window.fcmHelper?.renderSettingsPanel() || '';

        return `
            <div class="settings-section">
                <h3 class="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6">Notificaciones</h3>

                <!-- Notificaciones Locales -->
                <div class="mb-8">
                    <h4 class="text-md font-semibold text-gray-300 mb-4">Notificaciones Locales</h4>
                    ${notificationsHTML}
                </div>

                <!-- Notificaciones Push (FCM) -->
                ${fcmHTML ? `
                    <div class="mt-8 pt-8 border-t border-slate-700">
                        ${fcmHTML}
                    </div>
                ` : ''}
            </div>
        `;
    }

    // ==========================================================================
    // TAB SEGURIDAD
    // ==========================================================================

    renderSecurityTab() {
        const biometricHTML = window.biometricHelper?.renderSettingsPanel() ||
            '<p class="text-gray-400">BiometricHelper no disponible</p>';

        const incognitoMode = localStorage.getItem('incognito-mode') === 'true';

        return `
            <div class="settings-section">
                <h3 class="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6">Seguridad y Privacidad</h3>

                <!-- Biometría -->
                ${biometricHTML}

                <!-- Modo incógnito -->
                <div class="mt-8 pt-8 border-t border-slate-700">
                    <h4 class="text-lg font-semibold text-white mb-4">Privacidad</h4>
                    <label class="flex items-center justify-between cursor-pointer">
                        <div>
                            <span class="text-gray-300 font-medium flex items-center gap-2">
                                <i data-lucide="eye-off" class="w-4 h-4"></i>
                                Modo incógnito
                            </span>
                            <p class="text-sm text-gray-400 mt-1">
                                No guardar historial de lectura ni progreso
                            </p>
                        </div>
                        <input type="checkbox" id="incognito-toggle" ${incognitoMode ? 'checked' : ''}
                               class="toggle-checkbox">
                    </label>
                </div>
            </div>
        `;
    }
}

// Exponer globalmente
window.SettingsModalAccount = SettingsModalAccount;
