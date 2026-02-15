/**
 * SettingsModal - Modal centralizado de configuración (Coordinador)
 * v2.9.390: Arquitectura modular
 *
 * Módulos:
 *   - SettingsModalGeneral    - Tab general + TTS
 *   - SettingsModalAI         - Tab IA
 *   - SettingsModalAccount    - Cuenta/notif/seguridad
 *   - SettingsModalAppearance - Tema/sync/about
 *   - SettingsModalEvents     - Event listeners
 */
class SettingsModal {
    constructor() {
        this.currentTab = 'general';
        this.modalId = 'settings-modal';
        this.escapeHandler = null;

        // EventManager centralizado para limpieza consistente
        this.eventManager = new window.EventManager();
        this.eventManager.setComponentName('SettingsModal');

        // Flags para cancelar loadVoices() cuando se cierra modal
        this.loadingVoices = false;
        this.voicesLoadCancelled = false;

        // Referencia al TTS manager de test para cancelar audio anterior
        this.currentTestTTSManager = null;

        // Debounce timers para sliders
        this.sliderDebounceTimers = new Map();

        // Debounce timer para auto-guardar config de AI
        this.aiConfigAutoSaveTimer = null;

        // Handler de resize para limpiar después
        this.resizeHandler = null;

        // Memory leak cleanup - timer and listener tracking
        this.timers = [];
        this.intervals = [];
        this.listeners = new Map();

        // Focus trap para accesibilidad
        this.focusTrap = null;

        // Inicializar módulos
        this.general = new (window.SettingsModalGeneral)(this);
        this.ai = new (window.SettingsModalAI)(this);
        this.account = new (window.SettingsModalAccount)(this);
        this.appearance = new (window.SettingsModalAppearance)(this);
        this.events = new (window.SettingsModalEvents)(this);
    }

    // ==========================================================================
    // TIMER TRACKING
    // ==========================================================================

    _setTimeout(callback, delay) {
        const timerId = setTimeout(() => {
            callback();
            const index = this.timers.indexOf(timerId);
            if (index > -1) this.timers.splice(index, 1);
        }, delay);
        this.timers.push(timerId);
        return timerId;
    }

    _setInterval(callback, delay) {
        const intervalId = setInterval(callback, delay);
        this.intervals.push(intervalId);
        return intervalId;
    }

    _clearTimeout(timerId) {
        if (timerId) {
            clearTimeout(timerId);
            const index = this.timers.indexOf(timerId);
            if (index > -1) this.timers.splice(index, 1);
        }
    }

    _clearInterval(intervalId) {
        if (intervalId) {
            clearInterval(intervalId);
            const index = this.intervals.indexOf(intervalId);
            if (index > -1) this.intervals.splice(index, 1);
        }
    }

    _addEventListener(element, event, handler, options) {
        element.addEventListener(event, handler, options);
        const elementId = element.id || `elem-${this.listeners.size}`;
        const key = `${elementId}-${event}-${Date.now()}`;
        this.listeners.set(key, { element, event, handler, options });
    }

    _removeEventListener(element, event, handler) {
        element.removeEventListener(event, handler);
        for (const [key, value] of this.listeners.entries()) {
            if (value.element === element && value.event === event && value.handler === handler) {
                this.listeners.delete(key);
                break;
            }
        }
    }

    // ==========================================================================
    // SHOW / CLOSE
    // ==========================================================================

    /**
     * Muestra el modal de configuración
     * @param {string} initialTab - Tab inicial a mostrar (opcional)
     */
    async show(initialTab = 'general') {
        this.currentTab = initialTab;

        // Remover modal previo si existe
        const existingModal = document.getElementById(this.modalId);
        if (existingModal) {
            existingModal.remove();
        }

        // Renderizar modal
        const modalHTML = this.render();
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Guardar referencia global
        window.settingsModalInstance = this;

        // Adjuntar listeners
        await this.events.attachListeners();

        // Listener para resize
        if (this.resizeHandler) {
            window.removeEventListener('resize', this.resizeHandler);
        }

        this.resizeHandler = () => {
            const isMobile = this.isMobile();
            const dropdown = document.getElementById('mobile-tab-dropdown');
            const sidebar = document.getElementById('desktop-tab-sidebar');

            if (dropdown && sidebar) {
                if (isMobile) {
                    dropdown.classList.remove('hidden');
                    dropdown.classList.add('block');
                    sidebar.classList.remove('block');
                    sidebar.classList.add('hidden');
                } else {
                    dropdown.classList.remove('block');
                    dropdown.classList.add('hidden');
                    sidebar.classList.remove('hidden');
                    sidebar.classList.add('block');
                }
            }
        };

        this._addEventListener(window, 'resize', this.resizeHandler);

        // Inicializar Lucide icons
        if (window.lucide) {
            lucide.createIcons();
        }

        // Activar focus trap para accesibilidad
        setTimeout(() => {
            const modal = document.getElementById(this.modalId);
            if (modal && window.createFocusTrap) {
                this.focusTrap = window.createFocusTrap(modal);
            }
        }, 100);
    }

    /**
     * Cierra el modal
     */
    close() {
        // Desactivar focus trap
        if (this.focusTrap) {
            this.focusTrap.deactivate();
            this.focusTrap = null;
        }

        // Cancelar carga de voces si está en progreso
        if (this.loadingVoices) {
            logger.debug('[Settings] Cancelando carga de voces al cerrar modal');
            this.voicesLoadCancelled = true;
            this.loadingVoices = false;
        }

        // Cancelar audio de test si está reproduciéndose
        if (this.currentTestTTSManager) {
            logger.debug('[Settings] Deteniendo audio de test al cerrar modal');
            try {
                this.currentTestTTSManager.stop();
            } catch (e) {
                logger.warn('[Settings] Error al detener test:', e);
            }
            this.currentTestTTSManager = null;
        }

        // Limpiar todos los timers trackeados
        this.timers.forEach(id => clearTimeout(id));
        this.timers = [];

        this.intervals.forEach(id => clearInterval(id));
        this.intervals = [];

        // Limpiar timers legacy
        if (this.aiConfigAutoSaveTimer) {
            clearTimeout(this.aiConfigAutoSaveTimer);
            this.aiConfigAutoSaveTimer = null;
        }

        // Limpiar timers de debounce de sliders
        if (this.sliderDebounceTimers.size > 0) {
            logger.debug('[Settings] Limpiando timers de sliders pendientes');
            this.sliderDebounceTimers.forEach((timer, key) => {
                clearTimeout(timer);
            });
            this.sliderDebounceTimers.clear();
        }

        // Limpiar todos los event listeners trackeados
        this.listeners.forEach(({ element, event, handler }) => {
            element.removeEventListener(event, handler);
        });
        this.listeners.clear();

        // Limpiar listener de resize
        if (this.resizeHandler) {
            window.removeEventListener('resize', this.resizeHandler);
            this.resizeHandler = null;
        }

        // Limpiar todos los event listeners con EventManager
        if (this.eventManager) {
            this.eventManager.cleanup();
        }

        // Limpiar escape key handler
        if (this.escapeHandler) {
            document.removeEventListener('keydown', this.escapeHandler);
            this.escapeHandler = null;
        }

        const modal = document.getElementById(this.modalId);
        if (modal) {
            modal.remove();
        }

        // Limpiar referencia global
        if (window.settingsModalInstance === this) {
            window.settingsModalInstance = null;
        }
    }

    // ==========================================================================
    // RENDER
    // ==========================================================================

    /**
     * Detecta si es pantalla móvil
     */
    isMobile() {
        return window.innerWidth < 768;
    }

    /**
     * Renderiza el modal completo
     */
    render() {
        const isMobile = this.isMobile();

        return `
            <div id="${this.modalId}" class="modal-overlay fixed inset-0 bg-black/80 flex items-center justify-center z-[10000] p-0 sm:p-4">
                <div class="modal-container bg-slate-800 rounded-none sm:rounded-2xl shadow-2xl max-w-5xl w-full h-full sm:h-auto sm:max-h-[90vh] flex flex-col overflow-hidden">
                    <!-- Header - SIEMPRE VISIBLE -->
                    <div class="modal-header flex items-center justify-between p-3 sm:p-6 border-b border-slate-700 flex-shrink-0 sticky top-0 bg-slate-800 z-10">
                        <div class="flex items-center gap-2 sm:gap-3">
                            <i data-lucide="settings" class="w-5 h-5 sm:w-6 sm:h-6 text-blue-400"></i>
                            <h2 class="text-lg sm:text-2xl font-bold text-white">Configuración</h2>
                        </div>
                        <button id="close-settings-modal"
                                class="text-gray-400 hover:text-white transition-colors p-3 -mr-2"
                                aria-label="Cerrar configuración"
                                title="Cerrar">
                            <i data-lucide="x" class="w-6 h-6 sm:w-6 sm:h-6"></i>
                        </button>
                    </div>

                    <!-- Body con tabs -->
                    <div class="modal-body flex flex-col ${isMobile ? 'flex-col' : 'md:flex-row'} flex-1 overflow-hidden">
                        <!-- Mobile: Tabs como dropdown -->
                        <div id="mobile-tab-dropdown" class="${isMobile ? 'block' : 'hidden'} border-b border-slate-700 p-3">
                            <select id="mobile-settings-tab" class="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm">
                                ${this.renderMobileTabs()}
                            </select>
                        </div>

                        <!-- Desktop: Sidebar con tabs -->
                        <div id="desktop-tab-sidebar" class="${isMobile ? 'hidden' : 'block'} settings-sidebar w-48 lg:w-56 bg-slate-900/50 border-r border-slate-700 p-4 overflow-y-auto">
                            ${this.renderTabs()}
                        </div>

                        <!-- Content -->
                        <div class="settings-content flex-1 p-3 sm:p-4 md:p-6 overflow-y-auto">
                            ${this.renderTabContent()}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Lista de tabs disponibles
     */
    getTabs() {
        return [
            { id: 'general', icon: 'settings', label: 'General' },
            { id: 'ai', icon: 'bot', label: 'Inteligencia Artificial' },
            { id: 'account', icon: 'user', label: 'Cuenta' },
            { id: 'notifications', icon: 'bell', label: 'Notificaciones' },
            { id: 'security', icon: 'lock', label: 'Seguridad' },
            { id: 'appearance', icon: 'palette', label: 'Apariencia' },
            { id: 'sync', icon: 'refresh-cw', label: 'Sincronización' },
            { id: 'about', icon: 'info', label: 'Acerca de' }
        ];
    }

    /**
     * Renderiza el dropdown de tabs para móvil
     */
    renderMobileTabs() {
        const tabs = this.getTabs();
        return tabs.map(tab => `
            <option value="${tab.id}" ${tab.id === this.currentTab ? 'selected' : ''}>
                ${tab.label}
            </option>
        `).join('');
    }

    /**
     * Renderiza los tabs del sidebar (desktop)
     */
    renderTabs() {
        const tabs = this.getTabs();

        return tabs.map(tab => `
            <button
                class="settings-tab w-full flex items-center gap-2 lg:gap-3 px-3 lg:px-4 py-2 lg:py-3 rounded-lg text-left transition-all ${
                    tab.id === this.currentTab
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'text-gray-400 hover:bg-slate-800 hover:text-white'
                }"
                data-tab="${tab.id}">
                <i data-lucide="${tab.icon}" class="w-4 h-4 lg:w-5 lg:h-5"></i>
                <span class="font-medium text-sm lg:text-base">${tab.label}</span>
            </button>
        `).join('');
    }

    /**
     * Renderiza el contenido del tab actual
     */
    renderTabContent() {
        switch (this.currentTab) {
            case 'general':
                return this.general.renderGeneralTab();
            case 'ai':
                return this.ai.renderAITab();
            case 'account':
                return this.account.renderAccountTab();
            case 'notifications':
                return this.account.renderNotificationsTab();
            case 'security':
                return this.account.renderSecurityTab();
            case 'appearance':
                return this.appearance.renderAppearanceTab();
            case 'sync':
                return this.appearance.renderSyncTab();
            case 'about':
                return this.appearance.renderAboutTab();
            default:
                return '<p class="text-gray-400">Tab no encontrado</p>';
        }
    }

    /**
     * Helper para renderizar contenido de tab específico
     */
    renderTabContentByType(tabId) {
        switch (tabId) {
            case 'general':
                return this.general.renderGeneralTab();
            case 'ai':
                return this.ai.renderAITab();
            case 'account':
                return this.account.renderAccountTab();
            case 'notifications':
                return this.account.renderNotificationsTab();
            case 'security':
                return this.account.renderSecurityTab();
            case 'appearance':
                return this.appearance.renderAppearanceTab();
            case 'sync':
                return this.appearance.renderSyncTab();
            case 'about':
                return this.appearance.renderAboutTab();
            default:
                return '';
        }
    }

    // ==========================================================================
    // UPDATE CONTENT
    // ==========================================================================

    /**
     * Actualiza el contenido del modal (al cambiar de tab)
     */
    async updateContent() {
        const contentContainer = document.querySelector('.settings-content');
        if (!contentContainer) return;

        // Verificar si ya existen los contenedores de tabs
        const existingTabs = contentContainer.querySelectorAll('[data-settings-tab-content]');

        if (existingTabs.length === 0) {
            // Primera renderización: crear todos los tabs a la vez
            const allTabs = this.getTabs();
            let tabsHTML = '';

            for (const tab of allTabs) {
                const isActive = tab.id === this.currentTab;
                tabsHTML += `
                    <div data-settings-tab-content="${tab.id}" class="${isActive ? 'block' : 'hidden'}">
                        ${this.renderTabContentByType(tab.id)}
                    </div>
                `;
            }

            contentContainer.innerHTML = tabsHTML;
            await this.events.attachTabListeners();
        } else {
            // Solo mostrar/ocultar tabs existentes (sin re-renderizar)
            existingTabs.forEach(tabContent => {
                const tabId = tabContent.getAttribute('data-settings-tab-content');
                if (tabId === this.currentTab) {
                    tabContent.classList.remove('hidden');
                    tabContent.classList.add('block');
                } else {
                    tabContent.classList.remove('block');
                    tabContent.classList.add('hidden');
                }
            });

            // Solo re-adjuntar listeners del tab actual
            await this.events.attachTabListeners();
        }

        // Actualizar tabs activos (desktop sidebar)
        document.querySelectorAll('.settings-tab').forEach(tab => {
            tab.classList.toggle('bg-blue-600', tab.dataset.tab === this.currentTab);
            tab.classList.toggle('text-white', tab.dataset.tab === this.currentTab);
            tab.classList.toggle('shadow-lg', tab.dataset.tab === this.currentTab);
            tab.classList.toggle('text-gray-400', tab.dataset.tab !== this.currentTab);
        });

        // Actualizar select móvil
        const mobileTabSelect = document.getElementById('mobile-settings-tab');
        if (mobileTabSelect) {
            mobileTabSelect.value = this.currentTab;
        }

        // Reinicializar Lucide icons
        if (window.lucide) {
            lucide.createIcons();
        }
    }

    // ==========================================================================
    // HELPERS
    // ==========================================================================

    /**
     * Guardar valor de slider con debounce
     */
    debouncedSliderSave(key, value, delay = 300) {
        if (this.sliderDebounceTimers.has(key)) {
            this._clearTimeout(this.sliderDebounceTimers.get(key));
        }

        const timer = this._setTimeout(() => {
            localStorage.setItem(key, value);
            this.sliderDebounceTimers.delete(key);
            logger.debug(`[Settings] Slider "${key}" guardado: ${value}`);
        }, delay);

        this.sliderDebounceTimers.set(key, timer);
    }

    /**
     * Modal de confirmación simple como fallback
     */
    showSimpleConfirm(title, message) {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 z-[10000] flex items-center justify-center bg-black/50';
            modal.innerHTML = `
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md mx-4 p-6">
                    <h3 class="text-lg font-bold mb-3 text-gray-900 dark:text-white">${title}</h3>
                    <p class="text-sm text-gray-700 dark:text-gray-300 mb-6">${message}</p>
                    <div class="flex gap-3 justify-end">
                        <button class="simple-confirm-cancel px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600">
                            Cancelar
                        </button>
                        <button class="simple-confirm-ok px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600">
                            Eliminar
                        </button>
                    </div>
                </div>
            `;

            const cancelBtn = modal.querySelector('.simple-confirm-cancel');
            const okBtn = modal.querySelector('.simple-confirm-ok');

            const cleanup = () => {
                modal.remove();
            };

            cancelBtn.addEventListener('click', () => {
                cleanup();
                resolve(false);
            });

            okBtn.addEventListener('click', () => {
                cleanup();
                resolve(true);
            });

            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    cleanup();
                    resolve(false);
                }
            });

            const escHandler = (e) => {
                if (e.key === 'Escape') {
                    cleanup();
                    document.removeEventListener('keydown', escHandler);
                    resolve(false);
                }
            };
            document.addEventListener('keydown', escHandler);

            document.body.appendChild(modal);
        });
    }

    /**
     * Mostrar toast notification
     */
    showToast(message, type = 'info') {
        if (window.Toast && window.Toast.show) {
            window.Toast.show(message, type);
        } else if (window.showToast) {
            window.showToast(message, type);
        } else {
            logger.debug(`[${type}] ${message}`);
        }
    }

    /**
     * Helper para auto-guardar config de AI con debounce
     */
    autoSaveAIConfig() {
        this._clearTimeout(this.aiConfigAutoSaveTimer);
        this.aiConfigAutoSaveTimer = this._setTimeout(() => {
            const aiConfig = window.aiConfig;
            if (!aiConfig) return;

            const providerSelect = document.getElementById('settings-ai-provider-select');
            const modelSelect = document.getElementById('settings-ai-model-select');
            const keyInput = document.getElementById('settings-ai-key-input');
            const provider = providerSelect?.value;

            if (modelSelect && modelSelect.value) {
                aiConfig.setSelectedModel(modelSelect.value);
            }

            if (keyInput && keyInput.value && provider) {
                switch (provider) {
                    case 'claude':
                        aiConfig.setClaudeApiKey(keyInput.value);
                        break;
                    case 'openai':
                        aiConfig.setOpenAIApiKey(keyInput.value);
                        break;
                    case 'gemini':
                        aiConfig.setGeminiApiKey(keyInput.value);
                        break;
                    case 'qwen':
                        aiConfig.setQwenApiKey(keyInput.value);
                        break;
                    case 'mistral':
                        aiConfig.setMistralApiKey(keyInput.value);
                        break;
                    case 'huggingface':
                        aiConfig.setHuggingFaceToken(keyInput.value);
                        break;
                    case 'ollama':
                        aiConfig.setOllamaUrl(keyInput.value);
                        break;
                }
            }

            aiConfig.saveConfig();
            logger.debug('[Settings] AI configuration auto-saved');
        }, 1000);
    }
}

// Exponer globalmente
window.SettingsModal = SettingsModal;

// ============================================================================
// INICIALIZACIÓN DE CONFIGURACIÓN AL CARGAR
// ============================================================================

/**
 * Aplica la configuración guardada en localStorage al cargar la página
 */
function initializeSettings() {
    const savedFontSize = localStorage.getItem('font-size');
    if (savedFontSize) {
        document.documentElement.style.setProperty('--font-size-base', savedFontSize + 'px');

        const readingContent = document.querySelector('.chapter-content');
        if (readingContent) {
            readingContent.style.fontSize = savedFontSize + 'px';
        }
    }
}

// Ejecutar inicialización cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSettings);
} else {
    initializeSettings();
}
