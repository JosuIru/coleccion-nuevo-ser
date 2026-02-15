/**
 * SettingsModalAppearance - Tema, Sync y About
 * v2.9.390: Arquitectura modular
 */
class SettingsModalAppearance {
    constructor(settingsModal) {
        this.settingsModal = settingsModal;
    }

    // ==========================================================================
    // TAB APARIENCIA
    // ==========================================================================

    renderAppearanceTab() {
        const themeHTML = this.renderThemeSelector();
        const dynamicColorsHTML = window.dynamicColorsHelper?.renderSettingsPanel() || '';

        return `
            <div class="settings-section">
                <h3 class="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6">Apariencia</h3>

                <!-- Selector de tema -->
                ${themeHTML}

                <!-- Material You (Android 12+) -->
                ${dynamicColorsHTML ? `
                    <div class="mt-8 pt-8 border-t border-slate-700">
                        ${dynamicColorsHTML}
                    </div>
                ` : ''}
            </div>
        `;
    }

    // ==========================================================================
    // THEME SELECTOR
    // ==========================================================================

    renderThemeSelector() {
        const currentTheme = localStorage.getItem('theme-preference') || 'dark';

        return `
            <div class="theme-selector">
                <h4 class="text-lg font-semibold text-white mb-4">Tema</h4>
                <div class="grid grid-cols-3 gap-4">
                    <button class="theme-option ${currentTheme === 'dark' ? 'active' : ''}" data-theme="dark">
                        <div class="theme-preview bg-slate-900 border-2 border-slate-700 rounded-lg p-4 h-24 flex items-center justify-center">
                            <i data-lucide="moon" class="w-8 h-8 text-blue-400"></i>
                        </div>
                        <span class="block mt-2 text-sm text-gray-300">Oscuro</span>
                    </button>
                    <button class="theme-option ${currentTheme === 'light' ? 'active' : ''}" data-theme="light">
                        <div class="theme-preview bg-slate-100 border-2 border-slate-300 rounded-lg p-4 h-24 flex items-center justify-center">
                            <i data-lucide="sun" class="w-8 h-8 text-amber-500"></i>
                        </div>
                        <span class="block mt-2 text-sm text-gray-300">Claro</span>
                    </button>
                    <button class="theme-option ${currentTheme === 'auto' ? 'active' : ''}" data-theme="auto">
                        <div class="theme-preview bg-gradient-to-br from-slate-900 to-slate-100 border-2 border-slate-600 rounded-lg p-4 h-24 flex items-center justify-center">
                            <i data-lucide="laptop" class="w-8 h-8 text-purple-400"></i>
                        </div>
                        <span class="block mt-2 text-sm text-gray-300">Automático</span>
                    </button>
                </div>
            </div>
        `;
    }

    // ==========================================================================
    // TAB SYNC
    // ==========================================================================

    renderSyncTab() {
        const syncHTML = window.supabaseSyncHelper?.renderSettingsPanel() ||
            '<p class="text-gray-400">Supabase Sync no disponible</p>';

        return `
            <div class="settings-section">
                <h3 class="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6">Sincronización</h3>
                ${syncHTML}
                <div class="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-slate-700">
                    <h4 class="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Backup Local</h4>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <button id="export-data-btn" class="btn-secondary bg-slate-700 hover:bg-slate-600 text-white rounded-lg px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-medium transition-colors">
                            <i data-lucide="download" class="w-4 h-4 inline mr-2"></i>
                            Exportar Datos
                        </button>
                        <button id="import-data-btn" class="btn-secondary bg-slate-700 hover:bg-slate-600 text-white rounded-lg px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-medium transition-colors">
                            <i data-lucide="upload" class="w-4 h-4 inline mr-2"></i>
                            Importar Datos
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    // ==========================================================================
    // TAB ABOUT
    // ==========================================================================

    renderAboutTab() {
        return `
            <div class="settings-section">
                <h3 class="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6">Acerca de</h3>

                <div class="about-info bg-slate-700/50 rounded-lg sm:rounded-xl p-4 sm:p-6 mb-4 sm:mb-6">
                    <div class="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                        <img src="assets/icons/icon-192.png" alt="Logo" class="w-12 h-12 sm:w-16 sm:h-16 rounded-lg">
                        <div>
                            <h4 class="text-base sm:text-xl font-bold text-white">Colección Nuevo Ser</h4>
                            <p class="text-xs sm:text-sm text-gray-400">Una colección interactiva co-creada entre humano e IA para explorar la conciencia, la meditación, el activismo y la transformación social.</p>
                        </div>
                    </div>

                    <div class="space-y-1 sm:space-y-2 text-xs sm:text-sm">
                        <p class="text-gray-300"><strong>Versión:</strong> 2.7.8</p>
                        <p class="text-gray-300"><strong>Build:</strong> 47</p>
                        <p class="text-gray-300"><strong>Capacitor:</strong> 6.0.0</p>
                        <p class="text-gray-300"><strong>Plataforma:</strong> Android</p>
                    </div>
                </div>

                <!-- Centro de ayuda -->
                <div class="support-section mb-4 sm:mb-6">
                    <h4 class="text-sm sm:text-base font-semibold text-white mb-3">Centro de Ayuda</h4>
                    <button id="open-support-chat-btn" class="w-full flex items-center gap-3 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 border border-cyan-500/30 rounded-lg px-3 sm:px-4 py-3 sm:py-4 text-sm sm:text-base text-white transition-all">
                        <div class="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                            <i data-lucide="message-circle" class="w-5 h-5"></i>
                        </div>
                        <div class="text-left">
                            <span class="font-medium">Chat de Soporte IA</span>
                            <p class="text-xs text-gray-400">Obtén ayuda instantánea con tus dudas</p>
                        </div>
                        <i data-lucide="chevron-right" class="w-5 h-5 ml-auto text-gray-400"></i>
                    </button>
                </div>

                <div class="links space-y-2 sm:space-y-3">
                    <a href="legal/privacy-policy.html" target="_blank" class="block bg-slate-700/50 hover:bg-slate-700 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-gray-300 hover:text-white transition-colors">
                        <i data-lucide="shield" class="w-4 h-4 inline mr-2"></i>
                        Política de Privacidad
                    </a>
                    <a href="legal/terms-of-service.html" target="_blank" class="block bg-slate-700/50 hover:bg-slate-700 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-gray-300 hover:text-white transition-colors">
                        <i data-lucide="file-text" class="w-4 h-4 inline mr-2"></i>
                        Términos de Servicio
                    </a>
                    <a href="legal/licenses.html" target="_blank" class="block bg-slate-700/50 hover:bg-slate-700 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-gray-300 hover:text-white transition-colors">
                        <i data-lucide="book-open" class="w-4 h-4 inline mr-2"></i>
                        Licencias Open Source
                    </a>
                </div>

                <div class="mt-4 sm:mt-6 text-center text-xs sm:text-sm text-gray-400">
                    <p>Creado con amor por J. Irurtzun & Claude</p>
                    <p class="mt-2">2025 Colección Nuevo Ser</p>
                </div>
            </div>
        `;
    }

    // ==========================================================================
    // IMPORT / EXPORT DATA
    // ==========================================================================

    /**
     * Mostrar diálogo de importación
     */
    showImportDialog() {
        const settingsModal = this.settingsModal;
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';

        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                const text = await file.text();
                const data = JSON.parse(text);

                if (!data || typeof data !== 'object') {
                    throw new Error('Formato de archivo inválido');
                }

                const confirmed = confirm(
                    '¿Estás seguro de importar estos datos?\n\n' +
                    'Esto sobrescribirá tus datos actuales.\n' +
                    'Se recomienda exportar primero un backup.'
                );

                if (!confirmed) return;

                this.importData(data);
                settingsModal.showToast('Datos importados correctamente', 'success');

            } catch (error) {
                logger.error('Error importando datos:', error);
                settingsModal.showToast('Error al importar: ' + error.message, 'error');
            }
        };

        input.click();
    }

    /**
     * Importar datos desde objeto
     */
    importData(data) {
        const settingsModal = this.settingsModal;
        const importKeys = [
            'readProgress',
            'completedPractices',
            'userNotes',
            'bookmarks',
            'achievements',
            'frankenstein-saved-beings',
            'microsocieties_saves',
            'user_action_plan',
            'appSettings'
        ];

        for (const key of importKeys) {
            if (data[key] !== undefined) {
                localStorage.setItem(key, JSON.stringify(data[key]));
            }
        }

        if (data.settings) {
            Object.entries(data.settings).forEach(([key, value]) => {
                localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
            });
        }

        settingsModal._setTimeout(() => {
            if (confirm('Los datos se han importado. ¿Deseas recargar la página para aplicar los cambios?')) {
                window.location.reload();
            }
        }, 500);
    }

    /**
     * Exportar datos (fallback si fileExportHelper no está disponible)
     */
    exportDataFallback() {
        const settingsModal = this.settingsModal;
        const exportKeys = [
            'readProgress',
            'completedPractices',
            'userNotes',
            'bookmarks',
            'achievements',
            'frankenstein-saved-beings',
            'microsocieties_saves',
            'user_action_plan',
            'appSettings'
        ];

        const data = {
            exportDate: new Date().toISOString(),
            version: '1.0',
            settings: {}
        };

        for (const key of exportKeys) {
            const value = localStorage.getItem(key);
            if (value) {
                try {
                    data[key] = JSON.parse(value);
                } catch (e) {
                    data[key] = value;
                }
            }
        }

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `coleccion-nuevo-ser-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        settingsModal.showToast('Backup exportado', 'success');
    }
}

// Exponer globalmente
window.SettingsModalAppearance = SettingsModalAppearance;
