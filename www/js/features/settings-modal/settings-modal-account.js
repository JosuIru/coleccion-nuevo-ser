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

        return `
            <div class="settings-section">
                <h3 class="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6">Cuenta</h3>
                ${authHTML}
            </div>
        `;
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
