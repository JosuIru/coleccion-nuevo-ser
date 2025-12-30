/**
// 🔧 FIX v2.9.198: Migrated console.log to logger
 * SettingsModal - Modal centralizado de configuración
 *
 * Integra todos los settings de los diferentes helpers en un único modal
 * con navegación por tabs.
 *
 * Tabs disponibles:
 * 1. General - Preferencias generales de lectura
 * 2. Cuenta - Login/registro y gestión de cuenta
 * 3. Notificaciones - Configuración de notificaciones locales/push
 * 4. Seguridad - Autenticación biométrica y privacidad
 * 5. Apariencia - Temas y Material You
 * 6. Sincronización - Cloud sync y backup local
 * 7. Acerca de - Información de la app y licencias
 */
class SettingsModal {
    constructor() {
        this.currentTab = 'general';
        this.modalId = 'settings-modal';
        this.escapeHandler = null; // Handler for escape key

        // 🔧 FIX #86: Event manager centralizado para limpieza consistente
        this.eventManager = new EventManager();
        this.eventManager.setComponentName('SettingsModal');

        // 🔧 FIX #76: Flags para cancelar loadVoices() cuando se cierra modal
        this.loadingVoices = false;
        this.voicesLoadCancelled = false;

        // 🔧 FIX #84: Referencia al TTS manager de test para cancelar audio anterior
        this.currentTestTTSManager = null;

        // 🔧 FIX #83: Debounce timers para sliders
        this.sliderDebounceTimers = new Map();

        // 🔧 FIX #78: Debounce timer para auto-guardar config de AI
        this.aiConfigAutoSaveTimer = null;

        // 🔧 FIX #79: Handler de resize para limpiar después
        this.resizeHandler = null;

        // 🔧 FIX v2.9.197: Memory leak cleanup - timer and listener tracking
        this.timers = [];
        this.intervals = [];
        this.listeners = new Map();

        // 🔧 FIX v2.9.269: Focus trap para accesibilidad
        this.focusTrap = null;
    }

    /**
     * Muestra el modal de configuración
     * @param {string} initialTab - Tab inicial a mostrar (opcional)
     * 🔧 FIX #81: async para permitir await en attachListeners()
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

        // Guardar referencia global para que otros componentes puedan actualizar el modal
        window.settingsModalInstance = this;

        // 🔧 FIX #81: await attachListeners() para completar inicialización async
        // Adjuntar listeners
        await this.attachListeners();

        // 🔧 FIX #79: Listener para resize (con limpieza posterior)
        // Limpiar listener anterior si existe
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

        // 🔧 FIX v2.9.199: Complete listener tracking migration
        this._addEventListener(window, 'resize', this.resizeHandler);

        // Inicializar Lucide icons
        if (window.lucide) {
            lucide.createIcons();
        }

        // 🔧 FIX v2.9.269: Activar focus trap para accesibilidad
        setTimeout(() => {
            const modal = document.getElementById(this.modalId);
            if (modal && window.createFocusTrap) {
                this.focusTrap = window.createFocusTrap(modal);
            }
        }, 100);
    }

    /**
     * 🔧 FIX v2.9.197: Memory leak cleanup - timer and listener tracking
     * Helper methods para tracking de timers y event listeners
     */
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
        // Generar key único usando WeakMap o contador para elementos sin ID
        const elementId = element.id || `elem-${this.listeners.size}`;
        const key = `${elementId}-${event}-${Date.now()}`;
        this.listeners.set(key, { element, event, handler, options });
    }

    _removeEventListener(element, event, handler) {
        element.removeEventListener(event, handler);
        // Buscar y eliminar el listener correspondiente
        for (const [key, value] of this.listeners.entries()) {
            if (value.element === element && value.event === event && value.handler === handler) {
                this.listeners.delete(key);
                break;
            }
        }
    }

    /**
     * Detecta si es pantalla móvil
     * @returns {boolean} true si es móvil
     */
    isMobile() {
        return window.innerWidth < 768;
    }

    /**
     * Renderiza el modal completo
     * @returns {string} HTML del modal
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
     * @returns {string} HTML del select
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
     * @returns {string} HTML de los tabs
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
     * @returns {string} HTML del contenido
     */
    renderTabContent() {
        switch (this.currentTab) {
            case 'general':
                return this.renderGeneralTab();
            case 'ai':
                return this.renderAITab();
            case 'account':
                return this.renderAccountTab();
            case 'notifications':
                return this.renderNotificationsTab();
            case 'security':
                return this.renderSecurityTab();
            case 'appearance':
                return this.renderAppearanceTab();
            case 'sync':
                return this.renderSyncTab();
            case 'about':
                return this.renderAboutTab();
            default:
                return '<p class="text-gray-400">Tab no encontrado</p>';
        }
    }

    /**
     * Tab: General
     */
    renderGeneralTab() {
        const currentLanguage = localStorage.getItem('app-language') || 'es';
        const fontSize = localStorage.getItem('font-size') || '16';
        const autoAudio = localStorage.getItem('auto-audio') === 'true';
        const preferredVoice = localStorage.getItem('preferred-tts-voice');

        return `
            <div class="settings-section">
                <h3 class="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6">Preferencias Generales</h3>

                <div class="space-y-4 sm:space-y-6">
                    <!-- Idioma -->
                    <div class="setting-item">
                        <label class="block mb-2">
                            <span class="text-sm sm:text-base text-gray-300 font-medium flex items-center gap-2">
                                <i data-lucide="globe" class="w-4 h-4"></i>
                                Idioma de la interfaz
                            </span>
                        </label>
                        <select id="language-select" class="w-full bg-slate-700 text-white rounded-lg px-3 sm:px-4 py-2 text-sm sm:text-base border border-slate-600 focus:border-blue-500 focus:outline-none">
                            <option value="es" ${currentLanguage === 'es' ? 'selected' : ''}>Español</option>
                            <option value="en" ${currentLanguage === 'en' ? 'selected' : ''}>English</option>
                        </select>
                    </div>

                    <!-- Tamaño de fuente -->
                    <div class="setting-item">
                        <label class="block mb-2">
                            <span class="text-sm sm:text-base text-gray-300 font-medium flex items-center gap-2">
                                <i data-lucide="type" class="w-4 h-4"></i>
                                Tamaño de fuente
                            </span>
                        </label>
                        <div class="flex items-center gap-3 sm:gap-4">
                            <input type="range" id="font-size-slider" min="14" max="24" value="${fontSize}"
                                   class="flex-1 accent-blue-600">
                            <span id="font-size-display" class="text-white font-mono w-10 sm:w-12 text-right text-sm sm:text-base">${fontSize}px</span>
                        </div>
                    </div>

                    <!-- Reproducción automática de audio -->
                    <div class="setting-item">
                        <label class="flex items-center justify-between cursor-pointer">
                            <span class="text-gray-300 font-medium flex items-center gap-2">
                                <i data-lucide="volume-2" class="w-4 h-4"></i>
                                Reproducción automática de audio
                            </span>
                            <input type="checkbox" id="auto-audio-toggle" ${autoAudio ? 'checked' : ''}
                                   class="toggle-checkbox">
                        </label>
                        <p class="text-sm text-gray-400 mt-2">
                            Iniciar automáticamente la lectura en voz alta al abrir un capítulo
                        </p>
                    </div>

                    <!-- Notificaciones de logros -->
                    <div class="setting-item">
                        <label class="flex items-center justify-between cursor-pointer">
                            <span class="text-gray-300 font-medium flex items-center gap-2">
                                <i data-lucide="award" class="w-4 h-4"></i>
                                Notificaciones de logros
                            </span>
                            <input type="checkbox" id="achievement-notifications-toggle" ${localStorage.getItem('show-achievement-notifications') !== 'false' ? 'checked' : ''}
                                   class="toggle-checkbox">
                        </label>
                        <p class="text-sm text-gray-400 mt-2">
                            Mostrar notificaciones cuando desbloquees logros (los logros se guardan siempre)
                        </p>
                    </div>

                    <!-- Selector de voz para TTS -->
                    ${this.renderVoiceSelector()}

                    <!-- Configuración TTS Premium (OpenAI) -->
                    ${this.renderPremiumTTSSettings()}
                </div>
            </div>
        `;
    }

    /**
     * Renderiza el selector de voz para Text-to-Speech
     */
    renderVoiceSelector() {
        // Renderizar placeholder que se llenará después
        return `
            <div class="setting-item" id="voice-selector-container">
                <label class="block mb-2">
                    <span class="text-sm sm:text-base text-gray-300 font-medium flex items-center gap-2">
                        <i data-lucide="mic" class="w-4 h-4"></i>
                        Voz para lectura en voz alta
                    </span>
                </label>
                <select id="tts-voice-select" class="w-full bg-slate-700 text-white rounded-lg px-3 sm:px-4 py-2 text-sm sm:text-base border border-slate-600 focus:border-blue-500 focus:outline-none">
                    <option value="">Cargando voces...</option>
                </select>
                <p class="text-sm text-gray-400 mt-2">
                    Selecciona la voz que prefieras para la lectura automática de capítulos
                </p>
            </div>
        `;
    }

    /**
     * Renderiza la configuración de TTS Premium (OpenAI)
     */
    renderPremiumTTSSettings() {
        const hasOpenAIKey = !!localStorage.getItem('openai-tts-key');
        const openaiVoice = localStorage.getItem('openai-voice') || 'nova';
        const cacheEnabled = localStorage.getItem('tts-cache-enabled') !== 'false';

        return `
            <div class="setting-item border-t border-slate-700 pt-6 mt-6">
                <div class="flex items-center gap-2 mb-4">
                    <i data-lucide="sparkles" class="w-5 h-5 text-amber-400"></i>
                    <h4 class="text-base sm:text-lg font-bold text-white">Voz Premium (OpenAI)</h4>
                    <span class="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full">Beta</span>
                </div>

                <p class="text-sm text-gray-400 mb-4">
                    Voces neuronales ultra-realistas de OpenAI. Mucho más naturales que las voces del navegador.
                </p>

                <!-- Estado de configuración -->
                <div class="flex items-center gap-2 mb-4">
                    ${hasOpenAIKey ?
                        `<span class="text-xs bg-green-500/20 text-green-300 px-3 py-1 rounded-full flex items-center gap-1">
                            <i data-lucide="check-circle" class="w-3 h-3"></i>
                            Configurado
                        </span>` :
                        `<span class="text-xs bg-slate-700 text-slate-300 px-3 py-1 rounded-full flex items-center gap-1">
                            <i data-lucide="alert-circle" class="w-3 h-3"></i>
                            No configurado
                        </span>`
                    }
                </div>

                <!-- API Key -->
                <label class="block mb-2">
                    <span class="text-sm text-gray-300 font-medium">API Key de OpenAI</span>
                </label>
                <div class="flex gap-2 mb-2">
                    <input type="password"
                           id="openai-tts-key-input"
                           placeholder="sk-proj-..."
                           value="${hasOpenAIKey ? '••••••••••••••••' : ''}"
                           class="flex-1 bg-slate-700 text-white rounded-lg px-3 py-2 text-sm border border-slate-600 focus:border-amber-500 focus:outline-none">
                    <button id="test-openai-voice-btn"
                            class="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            ${!hasOpenAIKey ? 'disabled' : ''}>
                        Probar
                    </button>
                </div>
                <a href="https://platform.openai.com/api-keys"
                   target="_blank"
                   class="text-xs text-blue-400 hover:text-blue-300 inline-flex items-center gap-1 mb-4">
                    <i data-lucide="external-link" class="w-3 h-3"></i>
                    Obtener API Key (gratis con créditos iniciales)
                </a>

                <!-- Selector de voz OpenAI -->
                ${hasOpenAIKey ? `
                    <div class="mt-4">
                        <label class="block mb-2">
                            <span class="text-sm text-gray-300 font-medium">Voz Premium</span>
                        </label>
                        <select id="openai-voice-select"
                                class="w-full bg-slate-700 text-white rounded-lg px-3 py-2 text-sm border border-slate-600 focus:border-amber-500 focus:outline-none">
                            <option value="nova" ${openaiVoice === 'nova' ? 'selected' : ''}>Nova (Femenina) ⭐</option>
                            <option value="alloy" ${openaiVoice === 'alloy' ? 'selected' : ''}>Alloy (Neutral)</option>
                            <option value="echo" ${openaiVoice === 'echo' ? 'selected' : ''}>Echo (Masculina)</option>
                            <option value="fable" ${openaiVoice === 'fable' ? 'selected' : ''}>Fable (Neutral)</option>
                            <option value="onyx" ${openaiVoice === 'onyx' ? 'selected' : ''}>Onyx (Masculina)</option>
                            <option value="shimmer" ${openaiVoice === 'shimmer' ? 'selected' : ''}>Shimmer (Femenina)</option>
                        </select>
                    </div>

                    <!-- Opciones adicionales -->
                    <div class="mt-4 space-y-3">
                        <label class="flex items-center justify-between cursor-pointer">
                            <span class="text-sm text-gray-300 flex items-center gap-2">
                                <i data-lucide="database" class="w-4 h-4"></i>
                                Usar caché (ahorra costos)
                            </span>
                            <input type="checkbox" id="tts-cache-toggle" ${cacheEnabled ? 'checked' : ''}
                                   class="toggle-checkbox">
                        </label>
                        <p class="text-xs text-gray-500 ml-6">
                            El audio generado se guarda localmente para no regenerarlo.
                        </p>
                    </div>

                    <!-- Información de costos -->
                    <div class="mt-4 p-3 bg-slate-700/50 rounded-lg border border-slate-600">
                        <h5 class="text-xs font-semibold text-amber-400 mb-2 flex items-center gap-1">
                            <i data-lucide="dollar-sign" class="w-3 h-3"></i>
                            Costos estimados
                        </h5>
                        <ul class="text-xs text-gray-400 space-y-1">
                            <li>• Capítulo corto: ~$0.01</li>
                            <li>• Capítulo promedio: ~$0.03</li>
                            <li>• Libro completo: ~$0.50</li>
                        </ul>
                        <p class="text-xs text-gray-500 mt-2">
                            Con caché habilitado, solo pagas la primera vez.
                        </p>
                    </div>
                ` : ''}
            </div>

            <!-- ElevenLabs Premium (requiere suscripción) -->
            ${this.renderElevenLabsTTSSettings()}
        `;
    }

    /**
     * Renderiza la configuración de ElevenLabs TTS (Premium con suscripción)
     */
    renderElevenLabsTTSSettings() {
        const hasPremium = window.aiPremium && window.aiPremium.hasFeature('elevenlabs_tts');
        const elevenLabsVoice = localStorage.getItem('elevenlabs-voice') || 'EXAVITQu4vr4xnSDxMaL';
        const elevenLabsStability = localStorage.getItem('elevenlabs-stability') || '0.5';
        const elevenLabsSimilarity = localStorage.getItem('elevenlabs-similarity') || '0.75';

        const voices = [
            { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sara', gender: 'Femenina', desc: 'Clara y natural' },
            { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam', gender: 'Masculina', desc: 'Profesional' },
            { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', gender: 'Femenina', desc: 'Cálida' },
            { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi', gender: 'Femenina', desc: 'Joven' },
            { id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Elli', gender: 'Femenina', desc: 'Expresiva' },
            { id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh', gender: 'Masculina', desc: 'Profunda' },
            { id: 'VR6AewLTigWG4xSOukaG', name: 'Arnold', gender: 'Masculina', desc: 'Fuerte' },
            { id: 'pMsXgVXv3BLzUgSXRplE', name: 'Serena', gender: 'Femenina', desc: 'Suave' }
        ];

        return `
            <div class="setting-item border-t border-slate-700 pt-6 mt-6">
                <div class="flex items-center gap-2 mb-4">
                    <i data-lucide="mic-2" class="w-5 h-5 text-purple-400"></i>
                    <h4 class="text-base sm:text-lg font-bold text-white">Voces Premium ElevenLabs</h4>
                    <span class="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">Suscripción</span>
                </div>

                <p class="text-sm text-gray-400 mb-4">
                    Voces IA ultra-realistas de ElevenLabs. Las voces más naturales disponibles para narración.
                </p>

                <!-- Estado de suscripción -->
                <div class="flex items-center gap-2 mb-4">
                    ${hasPremium ?
                        `<span class="text-xs bg-green-500/20 text-green-300 px-3 py-1 rounded-full flex items-center gap-1">
                            <i data-lucide="check-circle" class="w-3 h-3"></i>
                            Premium activo
                        </span>` :
                        `<span class="text-xs bg-amber-500/20 text-amber-300 px-3 py-1 rounded-full flex items-center gap-1">
                            <i data-lucide="lock" class="w-3 h-3"></i>
                            Requiere Premium
                        </span>`
                    }
                </div>

                ${hasPremium ? `
                    <!-- Selector de voz ElevenLabs -->
                    <div class="mb-4">
                        <label class="block mb-2">
                            <span class="text-sm text-gray-300 font-medium">Voz ElevenLabs</span>
                        </label>
                        <select id="elevenlabs-voice-select"
                                class="w-full bg-slate-700 text-white rounded-lg px-3 py-2 text-sm border border-slate-600 focus:border-purple-500 focus:outline-none">
                            ${voices.map(v => `
                                <option value="${v.id}" ${elevenLabsVoice === v.id ? 'selected' : ''}>
                                    ${v.name} (${v.gender}) - ${v.desc}
                                </option>
                            `).join('')}
                        </select>
                    </div>

                    <!-- Ajustes de voz -->
                    <div class="space-y-4">
                        <div>
                            <label class="block mb-2">
                                <span class="text-sm text-gray-300 font-medium">Estabilidad</span>
                                <span class="text-xs text-gray-500 ml-2">(${elevenLabsStability})</span>
                            </label>
                            <input type="range" id="elevenlabs-stability-slider" min="0" max="1" step="0.1" value="${elevenLabsStability}"
                                   class="w-full accent-purple-600">
                            <p class="text-xs text-gray-500 mt-1">Mayor = más consistente, Menor = más expresivo</p>
                        </div>

                        <div>
                            <label class="block mb-2">
                                <span class="text-sm text-gray-300 font-medium">Similitud</span>
                                <span class="text-xs text-gray-500 ml-2">(${elevenLabsSimilarity})</span>
                            </label>
                            <input type="range" id="elevenlabs-similarity-slider" min="0" max="1" step="0.05" value="${elevenLabsSimilarity}"
                                   class="w-full accent-purple-600">
                            <p class="text-xs text-gray-500 mt-1">Mayor = más fiel a la voz original</p>
                        </div>
                    </div>

                    <!-- Botón de prueba -->
                    <div class="mt-4">
                        <button id="test-elevenlabs-voice-btn"
                                class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors">
                            <i data-lucide="play" class="w-4 h-4 inline mr-1"></i>
                            Probar Voz
                        </button>
                    </div>

                    <!-- Información de créditos -->
                    <div class="mt-4 p-3 bg-slate-700/50 rounded-lg border border-slate-600">
                        <h5 class="text-xs font-semibold text-purple-400 mb-2 flex items-center gap-1">
                            <i data-lucide="coins" class="w-3 h-3"></i>
                            Uso de créditos
                        </h5>
                        <ul class="text-xs text-gray-400 space-y-1">
                            <li>• ~5 créditos por cada 1000 caracteres</li>
                            <li>• Capítulo promedio: ~15-25 créditos</li>
                            <li>• Audio cacheado para no repetir gastos</li>
                        </ul>
                        ${window.aiPremium ? `
                            <p class="text-xs text-purple-300 mt-2">
                                Créditos disponibles: ${window.aiPremium.getCreditsRemaining()} / ${window.aiPremium.getCreditsTotal()}
                            </p>
                        ` : ''}
                    </div>

                    <!-- Botón para activar como provider -->
                    <div class="mt-4 p-3 bg-purple-900/20 rounded-lg border border-purple-500/30">
                        <label class="flex items-center justify-between cursor-pointer">
                            <div>
                                <span class="text-sm text-white font-medium">Usar ElevenLabs como voz principal</span>
                                <p class="text-xs text-gray-400 mt-1">Activar para la narración de libros</p>
                            </div>
                            <input type="checkbox" id="elevenlabs-as-default-toggle"
                                   ${localStorage.getItem('tts-provider') === 'elevenlabs' ? 'checked' : ''}
                                   class="toggle-checkbox">
                        </label>
                    </div>
                ` : `
                    <!-- Call to action para Premium -->
                    <div class="p-4 bg-purple-900/20 rounded-lg border border-purple-500/30 text-center">
                        <p class="text-sm text-purple-200 mb-3">
                            Actualiza a Premium para desbloquear voces ElevenLabs y todas las funciones de IA.
                        </p>
                        <button onclick="window.pricingModal?.showPricingModal()"
                                class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors">
                            Ver Planes Premium
                        </button>
                    </div>
                `}

                <!-- Opción de API key personal (alternativa) -->
                ${this.renderElevenLabsPersonalKeySection()}

                <!-- Gestión de caché de audio -->
                ${this.renderAudioCacheSection()}
            </div>
        `;
    }

    /**
     * Renderiza la sección de gestión de caché de audio ElevenLabs
     */
    renderAudioCacheSection() {
        const isNative = typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform();

        return `
            <div class="mt-6 pt-6 border-t border-slate-600" id="audio-cache-section">
                <div class="flex items-center gap-2 mb-3">
                    <i data-lucide="folder-open" class="w-4 h-4 text-blue-400"></i>
                    <h5 class="text-sm font-semibold text-gray-300">AudioLibros Descargados</h5>
                </div>

                <p class="text-xs text-gray-500 mb-3">
                    ${isNative
                        ? 'Los audios se guardan en <strong class="text-blue-400">Documentos/AudioLibros</strong> para escuchar offline.'
                        : 'Los audios se guardan en el almacenamiento del navegador.'}
                </p>

                <!-- Ubicación de archivos -->
                <div id="audio-path-info" class="text-xs text-gray-500 mb-3 p-2 bg-slate-900 rounded border border-slate-700">
                    <i data-lucide="folder" class="w-3 h-3 inline"></i>
                    <span id="audio-path-text">Cargando ubicación...</span>
                </div>

                <!-- Estadísticas de caché -->
                <div id="audio-cache-stats" class="p-3 bg-slate-800 rounded-lg mb-3">
                    <div class="flex items-center justify-between text-sm">
                        <span class="text-gray-400">Cargando estadísticas...</span>
                    </div>
                </div>

                <!-- Botones de acción -->
                <div class="flex gap-2">
                    <button id="refresh-cache-stats-btn"
                            class="flex-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-gray-300 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1">
                        <i data-lucide="refresh-cw" class="w-3 h-3"></i>
                        Actualizar
                    </button>
                    <button id="clear-audio-cache-btn"
                            class="flex-1 px-3 py-2 bg-red-900/30 hover:bg-red-900/50 text-red-300 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1">
                        <i data-lucide="trash-2" class="w-3 h-3"></i>
                        Limpiar Todo
                    </button>
                </div>

                <p class="text-xs text-gray-600 mt-2">
                    ${isNative
                        ? 'Puedes acceder a los archivos MP3 desde cualquier reproductor de música.'
                        : 'Límite: 500 MB. Los audios más antiguos se eliminan automáticamente.'}
                </p>
            </div>
        `;
    }

    /**
     * Actualiza las estadísticas de caché de audio en la UI
     */
    async updateAudioCacheStats() {
        const statsContainer = document.getElementById('audio-cache-stats');
        const pathText = document.getElementById('audio-path-text');

        const cacheManager = window.audioCacheManager;
        if (!cacheManager) {
            if (statsContainer) {
                statsContainer.innerHTML = `
                    <p class="text-xs text-gray-500">Sistema de caché no disponible</p>
                `;
            }
            return;
        }

        try {
            // Mostrar ubicación de archivos
            if (pathText) {
                const audioPath = await cacheManager.getAudioLibrosPath();
                pathText.textContent = audioPath;
            }

            const cacheSize = await cacheManager.getCacheSize();
            const downloadedBooks = await cacheManager.getDownloadedBooks();

            if (!statsContainer) return;

            if (cacheSize.itemCount === 0) {
                statsContainer.innerHTML = `
                    <div class="text-center py-2">
                        <i data-lucide="music" class="w-6 h-6 text-gray-600 mx-auto mb-2"></i>
                        <p class="text-xs text-gray-500">No hay audios descargados</p>
                        <p class="text-xs text-gray-600 mt-1">Reproduce un capítulo con voz ElevenLabs para descargar</p>
                    </div>
                `;
                if (window.Icons) window.Icons.init();
                return;
            }

            statsContainer.innerHTML = `
                <div class="space-y-2">
                    <div class="flex items-center justify-between">
                        <span class="text-gray-400 text-xs">Espacio usado</span>
                        <span class="text-white text-sm font-medium">${cacheSize.megabytes} MB</span>
                    </div>
                    <div class="flex items-center justify-between">
                        <span class="text-gray-400 text-xs">Archivos MP3</span>
                        <span class="text-white text-sm font-medium">${cacheSize.itemCount}</span>
                    </div>
                    ${downloadedBooks.length > 0 ? `
                        <div class="pt-2 border-t border-slate-700">
                            <span class="text-gray-500 text-xs block mb-2">Libros descargados:</span>
                            ${downloadedBooks.map(book => `
                                <div class="flex items-center justify-between text-xs mb-1 p-1.5 bg-slate-900/50 rounded">
                                    <div class="flex items-center gap-1.5 truncate max-w-[65%]">
                                        <i data-lucide="book" class="w-3 h-3 text-blue-400 flex-shrink-0"></i>
                                        <span class="text-gray-300 truncate">${this.formatBookName(book.bookId)}</span>
                                    </div>
                                    <div class="text-right">
                                        <span class="text-gray-400">${book.totalFiles} audio${book.totalFiles > 1 ? 's' : ''}</span>
                                        <span class="text-gray-600 ml-1">(${(book.totalSize / 1024 / 1024).toFixed(1)} MB)</span>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
            `;
            if (window.Icons) window.Icons.init();
        } catch (error) {
            console.error('Error obteniendo estadísticas de caché:', error);
            if (statsContainer) {
                statsContainer.innerHTML = `
                    <p class="text-xs text-red-400">Error cargando estadísticas</p>
                `;
            }
        }
    }

    /**
     * Formatea el nombre del libro para mostrar
     */
    formatBookName(bookId) {
        if (!bookId) return 'Desconocido';
        return bookId
            .replace(/-/g, ' ')
            .replace(/_/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    /**
     * Renderiza la sección de API key personal de ElevenLabs
     */
    renderElevenLabsPersonalKeySection() {
        const hasPersonalKey = !!localStorage.getItem('elevenlabs-personal-key');
        const usePersonalKey = localStorage.getItem('elevenlabs-use-personal-key') === 'true';

        return `
            <div class="mt-6 pt-6 border-t border-slate-600">
                <div class="flex items-center gap-2 mb-3">
                    <i data-lucide="key" class="w-4 h-4 text-gray-400"></i>
                    <h5 class="text-sm font-semibold text-gray-300">Usar tu propia cuenta ElevenLabs</h5>
                </div>

                <p class="text-xs text-gray-500 mb-3">
                    Alternativa: usa tu API key personal de ElevenLabs en vez del servicio incluido.
                    Pagas directamente a ElevenLabs.
                </p>

                <!-- Toggle para usar key personal -->
                <label class="flex items-center justify-between cursor-pointer mb-3 p-2 bg-slate-800 rounded-lg">
                    <span class="text-sm text-gray-300">Usar mi API key personal</span>
                    <input type="checkbox" id="elevenlabs-use-personal-key-toggle"
                           ${usePersonalKey ? 'checked' : ''}
                           class="toggle-checkbox">
                </label>

                <!-- Input de API key (visible si toggle activo) -->
                <div id="elevenlabs-personal-key-section" class="${usePersonalKey ? '' : 'hidden'}">
                    <label class="block mb-2">
                        <span class="text-xs text-gray-400">API Key de ElevenLabs</span>
                    </label>
                    <div class="flex gap-2">
                        <input type="password"
                               id="elevenlabs-personal-key-input"
                               placeholder="xi-..."
                               value="${hasPersonalKey ? '••••••••••••••••' : ''}"
                               class="flex-1 bg-slate-700 text-white rounded-lg px-3 py-2 text-sm border border-slate-600 focus:border-purple-500 focus:outline-none">
                        <button id="test-elevenlabs-personal-key-btn"
                                class="px-3 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg text-sm transition-colors"
                                ${!hasPersonalKey ? 'disabled' : ''}>
                            Probar
                        </button>
                    </div>
                    <a href="https://elevenlabs.io/app/settings/api-keys"
                       target="_blank"
                       class="text-xs text-purple-400 hover:text-purple-300 inline-flex items-center gap-1 mt-2">
                        <i data-lucide="external-link" class="w-3 h-3"></i>
                        Obtener API Key en ElevenLabs
                    </a>
                </div>
            </div>
        `;
    }

    /**
     * Carga las voces disponibles de forma asíncrona
     */
    async loadVoices() {
        // 🔧 FIX #76: Prevenir múltiples cargas simultáneas
        if (this.loadingVoices) {
            logger.debug('[Settings] ⏭️ Ya hay una carga de voces en progreso');
            return;
        }

        this.loadingVoices = true;
        this.voicesLoadCancelled = false;

        const audioReader = window.audioReader;
        const selectElement = document.getElementById('tts-voice-select');

        // DIAGNÓSTICO VISUAL
        const diagnosis = {
            audioReader: !!audioReader,
            selectElement: !!selectElement,
            synthesis: !!window.speechSynthesis,
            getVoices: typeof window.speechSynthesis?.getVoices
        };

        logger.debug('[Settings] 🎤 Cargando voces...', diagnosis);

        if (!audioReader || !selectElement) {
            console.warn('[Settings] ⚠️ No se puede cargar voces', diagnosis);
            // 🔧 FIX #77: No mostrar toast diagnóstico, solo loguear
            // El usuario no necesita ver estos detalles técnicos
            this.loadingVoices = false;
            return;
        }

        try {
            // Intentar obtener voces directamente de speechSynthesis primero
            const directVoices = window.speechSynthesis ? window.speechSynthesis.getVoices() : [];
            logger.debug('[Settings] 📞 Voces directas de speechSynthesis:', directVoices.length);

            const availableVoices = await audioReader.getAvailableVoices();
            const selectedVoiceURI = audioReader.selectedVoiceURI || audioReader.selectedVoice?.voiceURI || '';

            logger.debug('[Settings] 📋 Voces de audioReader:', availableVoices.length);

            // 🔧 FIX #77: Eliminar toast diagnóstico que se muestra siempre
            // Solo mostrar toasts en caso de éxito o error final

            if (availableVoices.length === 0 && directVoices.length === 0) {
                selectElement.innerHTML = '<option value="">Esperando voces...</option>';

                // Múltiples reintentos con intervalos más largos
                let retryCount = 0;
                const maxRetries = 5;

                const retryLoad = async () => {
                    // 🔧 FIX #76: Verificar si la carga fue cancelada
                    if (this.voicesLoadCancelled) {
                        logger.debug('[Settings] 🛑 Carga de voces cancelada');
                        this.loadingVoices = false;
                        return;
                    }

                    retryCount++;
                    await new Promise(resolve => this._setTimeout(resolve, 1000 * retryCount)); // 1s, 2s, 3s, 4s, 5s

                    // 🔧 FIX #76: Verificar nuevamente después del delay
                    if (this.voicesLoadCancelled) {
                        logger.debug('[Settings] 🛑 Carga de voces cancelada durante delay');
                        this.loadingVoices = false;
                        return;
                    }

                    const retryVoices = await audioReader.getAvailableVoices();
                    const retryDirect = window.speechSynthesis ? window.speechSynthesis.getVoices() : [];

                    logger.debug(`[Settings] 🔄 Reintento ${retryCount}/${maxRetries}:`, retryVoices.length, '/', retryDirect.length);

                    if (retryVoices.length > 0 || retryDirect.length > 0) {
                        const voicesToUse = retryVoices.length > 0 ? retryVoices : retryDirect.filter(v => v.lang.startsWith('es'));
                        selectElement.innerHTML = voicesToUse.map(voice => `
                            <option value="${voice.voiceURI || voice.name}">
                                ${voice.name} ${voice.lang ? `(${voice.lang})` : ''}
                            </option>
                        `).join('');
                        if (window.toast) {
                            window.toast.success(`✅ ${voicesToUse.length} voces cargadas!`);
                        }
                        this.loadingVoices = false; // 🔧 FIX #76: Resetear flag al completar
                    } else if (retryCount < maxRetries) {
                        retryLoad();
                    } else {
                        selectElement.innerHTML = '<option value="">Sin voces (verificar permisos)</option>';
                        if (window.toast) {
                            window.toast.error('No se pudieron cargar voces después de 5 intentos');
                        }
                        this.loadingVoices = false; // 🔧 FIX #76: Resetear flag al agotar reintentos
                    }
                };

                retryLoad();
                return;
            }

            selectElement.innerHTML = availableVoices.map(voice => `
                <option value="${voice.voiceURI || voice.voice}" ${(selectedVoiceURI === voice.voiceURI || selectedVoiceURI === voice.voice) ? 'selected' : ''}>
                    ${voice.name} ${voice.lang ? `(${voice.lang})` : ''}
                </option>
            `).join('');
            logger.debug('[Settings] ✅ Voces cargadas correctamente');
            this.loadingVoices = false; // 🔧 FIX #76: Resetear flag al completar exitosamente
        } catch (error) {
            console.error('[Settings] ❌ Error loading voices:', error);
            // 🔧 FIX v2.9.198: XSS prevention - sanitize error message
            selectElement.innerHTML = '<option value="">Error: ' + (window.sanitizer?.sanitize(error.message) || Sanitizer.escapeHtml(error.message)) + '</option>';
            if (window.toast) {
                window.toast.error('Error cargando voces: ' + (window.sanitizer?.sanitize(error.message) || Sanitizer.escapeHtml(error.message)));
            }
            this.loadingVoices = false; // 🔧 FIX #76: Resetear flag al encontrar error
        }
    }

    /**
     * Tab: Inteligencia Artificial
     */
    renderAITab() {
        const aiConfig = window.aiConfig;
        if (!aiConfig) {
            return `
                <div class="settings-section">
                    <h3 class="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6">Inteligencia Artificial</h3>
                    <p class="text-red-400">Sistema de IA no disponible</p>
                </div>
            `;
        }

        const currentProvider = aiConfig.getCurrentProvider();
        const isConfigured = this.isProviderConfigured(currentProvider);

        return `
            <div class="settings-section">
                <h3 class="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6">
                    ${Icons.bot(24)} Configuración de IA
                </h3>

                <p class="text-gray-300 mb-6 text-sm sm:text-base">
                    Configura el servicio de inteligencia artificial para usar el Chat IA, sugerencias contextuales y análisis de contenido.
                </p>

                <!-- Provider Selector -->
                <div class="mb-6">
                    <label class="block text-sm font-semibold mb-2 text-gray-200">1. Servicio de IA</label>
                    <select id="settings-ai-provider-select" class="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition">
                        <optgroup label="💰 De pago (alta calidad)">
                            <option value="claude" ${currentProvider === 'claude' ? 'selected' : ''}>Claude (Anthropic)</option>
                            <option value="openai" ${currentProvider === 'openai' ? 'selected' : ''}>ChatGPT (OpenAI)</option>
                            <option value="mistral" ${currentProvider === 'mistral' ? 'selected' : ''}>Mistral AI</option>
                        </optgroup>
                        <optgroup label="🆓 Gratis">
                            <option value="gemini" ${currentProvider === 'gemini' ? 'selected' : ''}>Gemini (Google) - 60 consultas/min gratis</option>
                            <option value="qwen" ${currentProvider === 'qwen' ? 'selected' : ''}>Qwen (Alibaba) - 1M tokens gratis/mes</option>
                            <option value="huggingface" ${currentProvider === 'huggingface' ? 'selected' : ''}>HuggingFace - 100% gratis</option>
                        </optgroup>
                        <optgroup label="🏠 Local / Sin conexión">
                            <option value="ollama" ${currentProvider === 'ollama' ? 'selected' : ''}>Ollama - Ejecuta en tu PC</option>
                            <option value="local" ${currentProvider === 'local' ? 'selected' : ''}>Modo offline - Sin IA real</option>
                        </optgroup>
                    </select>
                </div>

                <!-- Model Selector -->
                <div id="settings-ai-model-section" class="mb-6">
                    ${this.renderAIModelSelector(currentProvider)}
                </div>

                <!-- API Key Input -->
                <div id="settings-ai-key-section" class="mb-6">
                    ${this.renderAIKeyInput(currentProvider)}
                </div>

                <!-- Status -->
                <div class="flex items-center gap-3 p-4 rounded-lg ${isConfigured ? 'bg-green-900/20 border border-green-500/30' : 'bg-red-900/20 border border-red-500/30'}">
                    <span class="w-3 h-3 rounded-full flex-shrink-0 ${isConfigured ? 'bg-green-400' : 'bg-red-400'}"></span>
                    <div class="text-sm">
                        ${isConfigured
                            ? '<span class="text-green-300 font-semibold">✓ Configurado</span> - El servicio de IA está listo para usar'
                            : '<span class="text-red-300 font-semibold">✗ No configurado</span> - Ingresa tu API key para habilitar la IA'}
                    </div>
                </div>

                <!-- Save Button -->
                <div class="mt-6">
                    <button id="save-ai-settings" class="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold transition text-sm sm:text-base flex items-center justify-center gap-2">
                        ${Icons.check(20)} Guardar Configuración
                    </button>
                </div>

                <!-- Usage Stats (si existe) -->
                ${this.renderAIUsageStats()}
            </div>
        `;
    }

    renderAIModelSelector(provider) {
        const aiConfig = window.aiConfig;
        if (!aiConfig) return '';

        const models = aiConfig.getAvailableModels(provider);
        if (!models || models.length <= 1) return '';

        const selectedModel = aiConfig.getSelectedModel();

        return `
            <div>
                <label class="block text-sm font-semibold mb-2 text-gray-200">2. Modelo</label>
                <select id="settings-ai-model-select" class="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition">
                    ${models.map(model => `
                        <option value="${model.id}" ${model.id === selectedModel ? 'selected' : ''}>
                            ${model.name} - ${model.description}
                        </option>
                    `).join('')}
                </select>
            </div>
        `;
    }

    renderAIKeyInput(provider) {
        const aiConfig = window.aiConfig;
        if (!aiConfig) return '';

        const configs = {
            claude: {
                key: aiConfig.getClaudeApiKey() || '',
                placeholder: 'sk-ant-...',
                label: 'API Key de Claude',
                link: 'https://console.anthropic.com/settings/keys',
                info: 'Calidad máxima • ~$0.01-0.02/conversación'
            },
            openai: {
                key: aiConfig.getOpenAIApiKey() || '',
                placeholder: 'sk-...',
                label: 'API Key de OpenAI',
                link: 'https://platform.openai.com/api-keys',
                info: 'Alta calidad • ~$0.002-0.02/conversación'
            },
            gemini: {
                key: aiConfig.getGeminiApiKey() || '',
                placeholder: 'AIza...',
                label: 'API Key de Gemini',
                link: 'https://aistudio.google.com/apikey',
                info: 'Gratis: 60 consultas/min • Buena calidad'
            },
            qwen: {
                key: aiConfig.getQwenApiKey() || '',
                placeholder: 'sk-...',
                label: 'API Key de Qwen (DashScope)',
                link: 'https://bailian.console.alibabacloud.com/?apiKey=1#/api-key',
                info: '¡1M tokens GRATIS/mes! • Crear cuenta en Alibaba Cloud'
            },
            mistral: {
                key: aiConfig.getMistralApiKey() || '',
                placeholder: '...',
                label: 'API Key de Mistral',
                link: 'https://console.mistral.ai/api-keys',
                info: 'Muy económico • ~$0.001/conversación'
            },
            huggingface: {
                key: aiConfig.getHuggingFaceToken() || '',
                placeholder: 'hf_...',
                label: 'Token de HuggingFace',
                link: 'https://huggingface.co/settings/tokens',
                info: '100% Gratis • Crear cuenta en huggingface.co'
            },
            ollama: {
                key: aiConfig.getOllamaUrl() || 'http://localhost:11434',
                placeholder: 'http://localhost:11434',
                label: 'URL de Ollama',
                link: 'https://ollama.ai/download',
                info: 'Gratis & Privado • Ejecuta en tu PC'
            },
            local: {
                key: '',
                placeholder: '',
                label: '',
                link: '',
                info: 'Respuestas predefinidas sin IA real'
            }
        };

        const config = configs[provider];
        if (!config || provider === 'local') return '';

        return `
            <div>
                <label class="block text-sm font-semibold mb-2 text-gray-200">
                    3. ${config.label}
                    <a href="${config.link}" target="_blank" class="ml-2 text-xs text-blue-400 hover:text-blue-300">
                        (Obtener API key ${Icons.create('external-link', 12)})
                    </a>
                </label>
                <input
                    type="password"
                    id="settings-ai-key-input"
                    value="${config.key}"
                    placeholder="${config.placeholder}"
                    class="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base font-mono focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                />
                <p class="mt-2 text-xs text-gray-400">
                    ${Icons.info(12)} ${config.info}
                </p>
            </div>
        `;
    }

    renderAIUsageStats() {
        const stats = localStorage.getItem('ai_usage_stats');
        if (!stats) return '';

        try {
            const parsedStats = JSON.parse(stats);
            const totalRequests = parsedStats.totalRequests || 0;

            return `
                <div class="mt-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                    <h4 class="text-sm font-semibold text-gray-300 mb-3">📊 Estadísticas de Uso</h4>
                    <div class="grid grid-cols-2 gap-4 text-center text-sm">
                        <div>
                            <div class="text-2xl font-bold text-blue-400">${totalRequests}</div>
                            <div class="text-xs text-gray-400 mt-1">Consultas totales</div>
                        </div>
                        <div>
                            <div class="text-2xl font-bold text-green-400">${parsedStats.lastUsed ? 'Activo' : 'Inactivo'}</div>
                            <div class="text-xs text-gray-400 mt-1">Estado</div>
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            return '';
        }
    }

    isProviderConfigured(provider) {
        const aiConfig = window.aiConfig;
        if (!aiConfig) return false;

        const configs = {
            claude: () => aiConfig.getClaudeApiKey(),
            openai: () => aiConfig.getOpenAIApiKey(),
            gemini: () => aiConfig.getGeminiApiKey(),
            qwen: () => aiConfig.getQwenApiKey(),
            mistral: () => aiConfig.getMistralApiKey(),
            huggingface: () => aiConfig.getHuggingFaceToken(),
            ollama: () => aiConfig.getOllamaUrl(),
            local: () => true
        };

        const getKey = configs[provider];
        return getKey ? !!getKey() : false;
    }

    /**
     * Tab: Cuenta (Integración con Supabase Auth)
     */
    renderAccountTab() {
        // Integrar SupabaseAuthHelper
        const authHTML = window.supabaseAuthHelper?.renderSettingsPanel() ||
            '<p class="text-gray-400">Supabase Auth no disponible</p>';

        return `
            <div class="settings-section">
                <h3 class="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6">Cuenta</h3>
                ${authHTML}
            </div>
        `;
    }

    /**
     * Tab: Notificaciones
     */
    renderNotificationsTab() {
        // Integrar el panel de NotificationsHelper si existe (notificaciones locales)
        const notificationsHTML = window.notificationsHelper?.renderSettingsPanel() ||
            '<p class="text-gray-400">NotificationsHelper no disponible</p>';

        // Integrar el panel de FCMHelper si existe (notificaciones push)
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

    /**
     * Tab: Seguridad
     */
    renderSecurityTab() {
        // Integrar el panel de BiometricHelper si existe
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

    /**
     * Tab: Apariencia
     */
    renderAppearanceTab() {
        // Integrar ThemeHelper y DynamicColorsHelper
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

    /**
     * Renderiza el selector de tema
     */
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

    /**
     * Tab: Sincronización (Integración con Supabase Sync)
     */
    renderSyncTab() {
        // Integrar SupabaseSyncHelper
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

    /**
     * Tab: Acerca de
     */
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
                    <p>Creado con ❤️ por J. Irurtzun & Claude</p>
                    <p class="mt-2">© 2025 Colección Nuevo Ser</p>
                </div>
            </div>
        `;
    }

    /**
     * Adjunta todos los event listeners
     * 🔧 FIX #81: async para permitir await en attachTabListeners()
     */
    async attachListeners() {
        // 🔧 FIX v2.9.197: Memory leak cleanup - usar _addEventListener para tracking
        // Cerrar modal
        const closeBtn = document.getElementById('close-settings-modal');
        if (closeBtn) {
            this._addEventListener(closeBtn, 'click', () => {
                this.close();
            });
        }

        // Cerrar al hacer click fuera
        const modalElement = document.getElementById(this.modalId);
        if (modalElement) {
            this._addEventListener(modalElement, 'click', (e) => {
                if (e.target.id === this.modalId) {
                    this.close();
                }
            });
        }

        // 🔧 FIX #80: Limpiar handler anterior antes de crear uno nuevo
        if (this.escapeHandler) {
            document.removeEventListener('keydown', this.escapeHandler);
        }

        // Escape key para cerrar modal
        this.escapeHandler = (e) => {
            if (e.key === 'Escape') {
                this.close();
            }
        };
        this._addEventListener(document, 'keydown', this.escapeHandler);

        // Tab switching (desktop sidebar)
        document.querySelectorAll('.settings-tab').forEach((tab, index) => {
            const handler = (e) => {
                this.currentTab = e.currentTarget.dataset.tab;
                this.updateContent();
            };
            this._addEventListener(tab, 'click', handler);
        });

        // Tab switching (mobile dropdown)
        const mobileTabSelect = document.getElementById('mobile-settings-tab');
        if (mobileTabSelect) {
            this._addEventListener(mobileTabSelect, 'change', (e) => {
                this.currentTab = e.target.value;
                this.updateContent();
            });
        }

        // 🔧 FIX #81: await para attachTabListeners() cuando es async
        // Listeners específicos del tab actual
        await this.attachTabListeners();
    }

    /**
     * Adjunta listeners específicos del tab actual
     * 🔧 FIX #81: async para permitir await en attachAIListeners()
     */
    async attachTabListeners() {
        switch (this.currentTab) {
            case 'general':
                this.attachGeneralListeners();
                break;
            case 'ai':
                await this.attachAIListeners(); // 🔧 FIX #81: await para updateAudioCacheStats()
                break;
            case 'account':
                window.supabaseAuthHelper?.attachSettingsListeners();
                break;
            case 'notifications':
                window.notificationsHelper?.attachSettingsListeners();
                window.fcmHelper?.attachSettingsListeners();
                break;
            case 'security':
                window.biometricHelper?.attachSettingsListeners();
                this.attachSecurityListeners();
                break;
            case 'appearance':
                this.attachAppearanceListeners();
                window.dynamicColorsHelper?.attachSettingsListeners();
                break;
            case 'sync':
                window.supabaseSyncHelper?.attachSettingsListeners();
                this.attachSyncListeners();
                break;
        }
    }

    /**
     * Listeners del tab General
     */
    async attachGeneralListeners() {
        // Cargar voces disponibles de forma asíncrona
        this.loadVoices();

        // 🔧 FIX v2.9.197: Memory leak cleanup - usar _addEventListener para tracking
        // Cambio de idioma
        const languageSelect = document.getElementById('language-select');
        if (languageSelect) {
            this._addEventListener(languageSelect, 'change', (e) => {
                // 🔧 FIX v2.9.198: Error handling - prevent silent failures in localStorage operations
                try {
                    localStorage.setItem('app-language', e.target.value);
                    // logger.debug('[Settings] Language changed to:', e.target.value);
                } catch (error) {
                    console.error('Error guardando idioma:', error);
                    window.toast?.error('Error al guardar idioma. Intenta de nuevo.');
                }
            });
        }

        // Tamaño de fuente
        const slider = document.getElementById('font-size-slider');
        const display = document.getElementById('font-size-display');
        if (slider) {
            this._addEventListener(slider, 'input', (e) => {
                const size = e.target.value;
                // 🔧 FIX v2.9.268: Null check para display element
                if (display) display.textContent = size + 'px';
                document.documentElement.style.setProperty('--font-size-base', size + 'px');

                // 🔧 FIX #83: Debounce para guardar en localStorage (evita writes excesivos)
                this.debouncedSliderSave('font-size', size, 300);

                // Aplicar cambio inmediatamente al contenido de lectura
                const readingContent = document.querySelector('.chapter-content');
                if (readingContent) {
                    readingContent.style.fontSize = size + 'px';
                }

                // Mostrar notificación
                if (window.toast) {
                    window.toast.info(`Tamaño de fuente: ${size}px`);
                }
            });
        }

        // Auto audio
        const autoAudioToggle = document.getElementById('auto-audio-toggle');
        if (autoAudioToggle) {
            this._addEventListener(autoAudioToggle, 'change', (e) => {
                // 🔧 FIX v2.9.198: Error handling - prevent silent failures in localStorage operations
                try {
                    localStorage.setItem('auto-audio', e.target.checked);
                } catch (error) {
                    console.error('Error guardando auto-audio:', error);
                }
            });
        }

        // Notificaciones de logros
        const achievementToggle = document.getElementById('achievement-notifications-toggle');
        if (achievementToggle) {
            this._addEventListener(achievementToggle, 'change', (e) => {
                // 🔧 FIX v2.9.198: Error handling - prevent silent failures in localStorage operations
                try {
                    localStorage.setItem('show-achievement-notifications', e.target.checked);
                    if (window.toast) {
                        window.toast.info(e.target.checked ? '✅ Notificaciones de logros activadas' : '🔕 Notificaciones de logros desactivadas');
                    }
                } catch (error) {
                    console.error('Error guardando notificaciones de logros:', error);
                }
            });
        }

        // Selector de voz TTS
        const ttsVoiceSelect = document.getElementById('tts-voice-select');
        if (ttsVoiceSelect) {
            this._addEventListener(ttsVoiceSelect, 'change', (e) => {
                const voiceURI = e.target.value;
                if (window.audioReader) {
                    window.audioReader.setVoice(voiceURI);

                    // 🔧 FIX v2.9.198: Error handling - prevent silent failures in localStorage operations
                    try {
                        // Guardar preferencia
                        localStorage.setItem('preferred-tts-voice', voiceURI);

                        if (window.toast) {
                            window.toast.success('Voz cambiada correctamente');
                        }
                    } catch (error) {
                        console.error('Error guardando voz preferida:', error);
                    }
                }
            });
        }

        // ==================== OpenAI TTS Premium ====================

        // Input de API Key
        const openaiKeyInput = document.getElementById('openai-tts-key-input');
        if (openaiKeyInput) {
            this._addEventListener(openaiKeyInput, 'change', (e) => {
            const apiKey = e.target.value.trim();
            if (apiKey && apiKey !== '••••••••••••••••') {
                // 🔧 FIX v2.9.198: Error handling - prevent silent failures in localStorage operations
                try {
                    // Guardar API key
                    localStorage.setItem('openai-tts-key', apiKey);

                    // Configurar en TTSManager
                    if (window.TTSManager) {
                        const ttsManager = new window.TTSManager();
                        ttsManager.setOpenAIKey(apiKey);
                    }

                    // Mostrar confirmación
                    if (window.toast) {
                        window.toast.success('API Key guardada correctamente');
                    }

                    // Recargar UI para mostrar opciones
                    this.updateContent();
                } catch (error) {
                    console.error('Error guardando API Key de OpenAI:', error);
                    window.toast?.error('Error al guardar API Key. Intenta de nuevo.');
                }
            }
        });
        }

        // Botón "Probar"
        const testButton = document.getElementById('test-openai-voice-btn');
        // 🔧 FIX v2.9.199: Complete listener tracking migration
        if (testButton) {
            this._addEventListener(testButton, 'click', async () => {
            const apiKey = localStorage.getItem('openai-tts-key');
            if (!apiKey) {
                if (window.toast) {
                    window.toast.error('Por favor, configura tu API Key primero');
                }
                return;
            }

            // 🔧 FIX #84: Cancelar audio de test anterior si existe
            if (this.currentTestTTSManager) {
                try {
                    await this.currentTestTTSManager.stop();
                } catch (e) {
                    console.warn('[Settings] Error al detener test anterior:', e);
                }
                this.currentTestTTSManager = null;
            }

            // Deshabilitar botón durante prueba
            testButton.disabled = true;
            testButton.textContent = 'Probando...';

            try {
                // Crear TTSManager y probar voz
                const ttsManager = new window.TTSManager();
                this.currentTestTTSManager = ttsManager;
                ttsManager.setOpenAIKey(apiKey);
                ttsManager.setProvider('openai');

                const selectedVoice = document.getElementById('openai-voice-select')?.value || 'nova';
                const testText = 'Hola, soy una voz premium de OpenAI. Mi pronunciación es mucho más natural que las voces del navegador.';

                await ttsManager.speak(testText, {
                    voice: selectedVoice,
                    speed: 1.0,
                    onEnd: () => {
                        // logger.debug('✅ Prueba de voz completada');
                    },
                    onError: (error) => {
                        console.error('❌ Error en prueba de voz:', error);
                    }
                });

                if (window.toast) {
                    window.toast.success('¡Voz premium funcionando correctamente!');
                }

            } catch (error) {
                console.error('Error al probar voz:', error);
                let errorMessage = 'Error al probar la voz';

                if (error.message.includes('API key')) {
                    errorMessage = 'API Key inválida o expirada';
                } else if (error.message.includes('créditos') || error.message.includes('credits')) {
                    errorMessage = 'Sin créditos. Añade saldo a tu cuenta OpenAI';
                } else if (error.message.includes('límite') || error.message.includes('rate limit')) {
                    errorMessage = 'Límite de uso alcanzado. Intenta más tarde';
                }

                if (window.toast) {
                    window.toast.error(errorMessage);
                }
            } finally {
                // Rehabilitar botón
                testButton.disabled = false;
                testButton.textContent = 'Probar';
            }
            });
        }

        // Selector de voz OpenAI
        const openaiVoiceSelect = document.getElementById('openai-voice-select');
        // 🔧 FIX v2.9.199: Complete listener tracking migration
        if (openaiVoiceSelect) {
            this._addEventListener(openaiVoiceSelect, 'change', (e) => {
                const voice = e.target.value;
                // 🔧 FIX v2.9.198: Error handling - prevent silent failures in localStorage operations
                try {
                    localStorage.setItem('openai-voice', voice);

                    if (window.toast) {
                        window.toast.success(`Voz cambiada a ${voice}`);
                    }
                } catch (error) {
                    console.error('Error guardando voz de OpenAI:', error);
                }
            });
        }

        // Toggle de caché
        const cacheToggle = document.getElementById('tts-cache-toggle');
        // 🔧 FIX v2.9.199: Complete listener tracking migration
        if (cacheToggle) {
            this._addEventListener(cacheToggle, 'change', (e) => {
                const enabled = e.target.checked;
                // 🔧 FIX v2.9.198: Error handling - prevent silent failures in localStorage operations
                try {
                    localStorage.setItem('tts-cache-enabled', enabled.toString());

                    if (window.TTSManager) {
                        const ttsManager = new window.TTSManager();
                        ttsManager.setCacheEnabled(enabled);
                    }

                    if (window.toast) {
                        window.toast.success(enabled ? 'Caché activado' : 'Caché desactivado');
                    }
                } catch (error) {
                    console.error('Error guardando configuración de caché:', error);
                }
            });
        }

        // ==================== ElevenLabs TTS Premium ====================

        // Selector de voz ElevenLabs
        const elevenLabsVoiceSelect = document.getElementById('elevenlabs-voice-select');
        // 🔧 FIX v2.9.199: Complete listener tracking migration
        if (elevenLabsVoiceSelect) {
            this._addEventListener(elevenLabsVoiceSelect, 'change', (e) => {
                const voice = e.target.value;
                localStorage.setItem('elevenlabs-voice', voice);

                if (window.toast) {
                    const voiceName = e.target.options[e.target.selectedIndex].text.split(' (')[0];
                    window.toast.success(`Voz cambiada a ${voiceName}`);
                }
            });
        }

        // Slider de estabilidad
        const stabilitySlider = document.getElementById('elevenlabs-stability-slider');
        // 🔧 FIX v2.9.199: Complete listener tracking migration
        if (stabilitySlider) {
            this._addEventListener(stabilitySlider, 'input', (e) => {
                const value = e.target.value;
                // Actualizar label inmediatamente
                const label = stabilitySlider.parentElement?.querySelector('.text-gray-500');
                if (label) {
                    label.textContent = `(${value})`;
                }
                // 🔧 FIX #83: Debounce para guardar en localStorage
                this.debouncedSliderSave('elevenlabs-stability', value, 300);
            });
        }

        // Slider de similitud
        const similaritySlider = document.getElementById('elevenlabs-similarity-slider');
        // 🔧 FIX v2.9.199: Complete listener tracking migration
        if (similaritySlider) {
            this._addEventListener(similaritySlider, 'input', (e) => {
                const value = e.target.value;
                // Actualizar label inmediatamente
                const label = similaritySlider.parentElement?.querySelector('.text-gray-500');
                if (label) {
                    label.textContent = `(${value})`;
                }
                // 🔧 FIX #83: Debounce para guardar en localStorage
                this.debouncedSliderSave('elevenlabs-similarity', value, 300);
            });
        }

        // Botón de prueba ElevenLabs
        const testElevenLabsBtn = document.getElementById('test-elevenlabs-voice-btn');
        // 🔧 FIX v2.9.199: Complete listener tracking migration
        if (testElevenLabsBtn) {
            this._addEventListener(testElevenLabsBtn, 'click', async () => {
            // Verificar premium
            if (!window.aiPremium || !window.aiPremium.hasFeature('elevenlabs_tts')) {
                if (window.toast) {
                    window.toast.error('Requiere suscripción Premium');
                }
                return;
            }

            // 🔧 FIX #84: Cancelar audio de test anterior si existe
            if (this.currentTestTTSManager) {
                try {
                    await this.currentTestTTSManager.stop();
                } catch (e) {
                    console.warn('[Settings] Error al detener test anterior:', e);
                }
                this.currentTestTTSManager = null;
            }

            // Deshabilitar botón
            testElevenLabsBtn.disabled = true;
            testElevenLabsBtn.innerHTML = '<i data-lucide="loader" class="w-4 h-4 inline mr-1 animate-spin"></i> Generando...';

            try {
                // Obtener configuración
                const voice = localStorage.getItem('elevenlabs-voice') || 'EXAVITQu4vr4xnSDxMaL';
                const stability = parseFloat(localStorage.getItem('elevenlabs-stability') || '0.5');
                const similarity = parseFloat(localStorage.getItem('elevenlabs-similarity') || '0.75');

                const testText = 'Hola, soy una voz de ElevenLabs. Mi pronunciación es increíblemente natural y expresiva.';

                // Usar el provider de ElevenLabs
                if (window.audioReader && window.audioReader.ttsManager && window.audioReader.ttsManager.providers.elevenlabs) {
                    await window.audioReader.ttsManager.providers.elevenlabs.speak(testText, {
                        voice,
                        stability,
                        similarity_boost: similarity,
                        onEnd: () => {
                            if (window.toast) {
                                window.toast.success('¡Voz ElevenLabs funcionando!');
                            }
                        },
                        onError: (error) => {
                            console.error('Error en prueba ElevenLabs:', error);
                            if (window.toast) {
                                window.toast.error(error.message || 'Error al probar voz');
                            }
                        }
                    });
                } else {
                    throw new Error('ElevenLabs provider no disponible');
                }
            } catch (error) {
                console.error('Error al probar ElevenLabs:', error);
                if (window.toast) {
                    window.toast.error(error.message || 'Error al probar voz ElevenLabs');
                }
            } finally {
                // Rehabilitar botón
                testElevenLabsBtn.disabled = false;
                testElevenLabsBtn.innerHTML = '<i data-lucide="play" class="w-4 h-4 inline mr-1"></i> Probar Voz';
                if (window.lucide) {
                    lucide.createIcons();
                }
            }
            });
        }

        // Toggle para usar ElevenLabs como provider predeterminado
        const elevenLabsDefaultToggle = document.getElementById('elevenlabs-as-default-toggle');
        // 🔧 FIX v2.9.199: Complete listener tracking migration
        if (elevenLabsDefaultToggle) {
            this._addEventListener(elevenLabsDefaultToggle, 'change', (e) => {
                const useElevenLabs = e.target.checked;
                const usePersonalKey = localStorage.getItem('elevenlabs-use-personal-key') === 'true';

                if (useElevenLabs) {
                    // Si usa key personal, no necesita premium
                    if (!usePersonalKey) {
                        // Verificar que tenga premium
                        if (!window.aiPremium || !window.aiPremium.hasFeature('elevenlabs_tts')) {
                            e.target.checked = false;
                            if (window.toast) {
                                window.toast.error('Requiere suscripción Premium o API key personal');
                            }
                            return;
                        }
                    }

                    // Activar ElevenLabs
                    localStorage.setItem('tts-provider', 'elevenlabs');
                    if (window.audioReader) {
                        window.audioReader.ttsProvider = 'elevenlabs';
                    }
                    if (window.toast) {
                        window.toast.success('Voces ElevenLabs activadas');
                    }
                } else {
                    // Volver a navegador
                    localStorage.setItem('tts-provider', 'browser');
                    if (window.audioReader) {
                        window.audioReader.ttsProvider = 'browser';
                    }
                    if (window.toast) {
                        window.toast.info('Volviendo a voces del navegador');
                    }
                }
            });
        }

        // ==================== ElevenLabs API Key Personal ====================

        // Toggle para usar API key personal
        const usePersonalKeyToggle = document.getElementById('elevenlabs-use-personal-key-toggle');
        // 🔧 FIX v2.9.199: Complete listener tracking migration
        if (usePersonalKeyToggle) {
            this._addEventListener(usePersonalKeyToggle, 'change', (e) => {
                const usePersonal = e.target.checked;
                localStorage.setItem('elevenlabs-use-personal-key', usePersonal.toString());

                // Mostrar/ocultar sección de API key
                const keySection = document.getElementById('elevenlabs-personal-key-section');
                if (keySection) {
                    keySection.classList.toggle('hidden', !usePersonal);
                }

                // Actualizar provider si está activo
                if (window.audioReader && window.audioReader.ttsManager && window.audioReader.ttsManager.providers.elevenlabs) {
                    window.audioReader.ttsManager.providers.elevenlabs.setUsePersonalKey(usePersonal);
                }

                if (window.toast) {
                    window.toast.info(usePersonal ? 'Usando API key personal' : 'Usando servicio Premium');
                }
            });
        }

        // Input de API key personal
        const personalKeyInput = document.getElementById('elevenlabs-personal-key-input');
        // 🔧 FIX v2.9.199: Complete listener tracking migration
        if (personalKeyInput) {
            this._addEventListener(personalKeyInput, 'change', (e) => {
                const apiKey = e.target.value.trim();
                if (apiKey && apiKey !== '••••••••••••••••') {
                    localStorage.setItem('elevenlabs-personal-key', apiKey);

                    // Configurar en provider
                    if (window.audioReader && window.audioReader.ttsManager && window.audioReader.ttsManager.providers.elevenlabs) {
                        window.audioReader.ttsManager.providers.elevenlabs.setApiKey(apiKey);
                    }

                    // Habilitar botón de prueba
                    const testBtn = document.getElementById('test-elevenlabs-personal-key-btn');
                    if (testBtn) {
                        testBtn.disabled = false;
                    }

                    if (window.toast) {
                        window.toast.success('API Key personal guardada');
                    }
                }
            });
        }

        // Botón de prueba de API key personal
        const testPersonalKeyBtn = document.getElementById('test-elevenlabs-personal-key-btn');
        // 🔧 FIX v2.9.199: Complete listener tracking migration
        if (testPersonalKeyBtn) {
            this._addEventListener(testPersonalKeyBtn, 'click', async () => {
            const apiKey = localStorage.getItem('elevenlabs-personal-key');
            if (!apiKey) {
                if (window.toast) {
                    window.toast.error('Configura tu API Key primero');
                }
                return;
            }

            // 🔧 FIX #84: Cancelar audio de test anterior si existe
            if (this.currentTestTTSManager) {
                try {
                    await this.currentTestTTSManager.stop();
                } catch (e) {
                    console.warn('[Settings] Error al detener test anterior:', e);
                }
                this.currentTestTTSManager = null;
            }

            testPersonalKeyBtn.disabled = true;
            testPersonalKeyBtn.textContent = '...';

            try {
                // Crear provider temporal para probar
                const testProvider = new window.ElevenLabsTTSProvider();
                testProvider.setApiKey(apiKey);
                testProvider.setUsePersonalKey(true);

                const testText = 'Prueba de voz con tu API key personal.';
                await testProvider.speak(testText, {
                    onEnd: () => {
                        if (window.toast) {
                            window.toast.success('¡API Key válida!');
                        }
                    },
                    onError: (error) => {
                        if (window.toast) {
                            window.toast.error(error.message || 'API Key inválida');
                        }
                    }
                });
            } catch (error) {
                if (window.toast) {
                    window.toast.error(error.message || 'Error probando API Key');
                }
            } finally {
                testPersonalKeyBtn.disabled = false;
                testPersonalKeyBtn.textContent = 'Probar';
            }
            });
        }

        // === Listeners de Caché de Audio ===

        // 🔧 FIX #81: Awaitar updateAudioCacheStats() para evitar race conditions
        // Actualizar estadísticas de caché cuando se abre el tab
        await this.updateAudioCacheStats();

        // Botón de actualizar estadísticas
        const refreshCacheBtn = document.getElementById('refresh-cache-stats-btn');
        if (refreshCacheBtn) {
            this._addEventListener(refreshCacheBtn, 'click', async () => {
                refreshCacheBtn.disabled = true;
                const icon = refreshCacheBtn.querySelector('i');
                if (icon) icon.classList.add('animate-spin');

                await this.updateAudioCacheStats();

                this._setTimeout(() => {
                    refreshCacheBtn.disabled = false;
                    if (icon) icon.classList.remove('animate-spin');
                }, 500);
            });
        }

        // Botón de limpiar caché
        const clearCacheBtn = document.getElementById('clear-audio-cache-btn');
        if (clearCacheBtn) {
            this._addEventListener(clearCacheBtn, 'click', async () => {
                const cacheManager = window.audioCacheManager;
                if (!cacheManager) return;

                // Confirmar antes de borrar
                // 🔧 FIX #82: Asegurar que confirmModal exista, crear fallback si es necesario
                let confirmed = false;
                if (window.confirmModal) {
                    confirmed = await window.confirmModal.show({
                        title: 'Limpiar caché de audio',
                        message: '¿Eliminar todos los audios guardados? Tendrás que regenerarlos la próxima vez.',
                        confirmText: 'Eliminar',
                        cancelText: 'Cancelar',
                        type: 'warning'
                    });
                } else {
                    // Fallback: crear modal simple inline
                    confirmed = await this.showSimpleConfirm(
                        'Limpiar caché de audio',
                        '¿Eliminar todos los audios guardados? Tendrás que regenerarlos la próxima vez.'
                    );
                }
                if (!confirmed) return;

                clearCacheBtn.disabled = true;
                clearCacheBtn.innerHTML = '<i data-lucide="loader" class="w-3 h-3 animate-spin"></i> Limpiando...';

                try {
                    await cacheManager.clearAll();
                    await this.updateAudioCacheStats();

                    if (window.toast) {
                        window.toast.success('Caché de audio limpiado');
                    }
                } catch (error) {
                    console.error('Error limpiando caché:', error);
                    if (window.toast) {
                        window.toast.error('Error al limpiar caché');
                    }
                } finally {
                    clearCacheBtn.disabled = false;
                    clearCacheBtn.innerHTML = '<i data-lucide="trash-2" class="w-3 h-3"></i> Limpiar Caché';
                    if (window.Icons) window.Icons.init();
                }
            });
        }
    }

    /**
     * 🔧 FIX #78: Helper para auto-guardar config de AI con debounce
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

            // Guardar modelo si existe
            if (modelSelect && modelSelect.value) {
                aiConfig.setSelectedModel(modelSelect.value);
            }

            // Guardar API key si existe
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

            // Guardar configuración
            aiConfig.saveConfig();
            logger.debug('[Settings] AI configuration auto-saved');
        }, 1000); // 1 segundo de debounce
    }

    /**
     * Listeners del tab IA
     */
    async attachAIListeners() {
        const aiConfig = window.aiConfig;
        if (!aiConfig) return;

        // 🔧 FIX #78: Provider change con auto-guardado
        const providerSelect = document.getElementById('settings-ai-provider-select');
        // 🔧 FIX v2.9.199: Complete listener tracking migration
        if (providerSelect) {
            this._addEventListener(providerSelect, 'change', (e) => {
                const newProvider = e.target.value;
                logger.debug('[Settings] AI Provider changed to:', newProvider);

                // Actualizar secciones dinámicas
                const modelSection = document.getElementById('settings-ai-model-section');
                const keySection = document.getElementById('settings-ai-key-section');

                if (modelSection) {
                    modelSection.innerHTML = this.renderAIModelSelector(newProvider);
                }

                if (keySection) {
                    keySection.innerHTML = this.renderAIKeyInput(newProvider);
                }

                // Re-inicializar icons
                if (window.Icons) {
                    window.Icons.init();
                }

                // 🔧 FIX #78: Auto-guardar con debounce
                this.autoSaveAIConfig();
            });
        }

        // 🔧 FIX #78: Model change con auto-guardado
        // 🔧 FIX v2.9.199: Complete listener tracking migration - delegated event
        this._addEventListener(document, 'change', (e) => {
            if (e.target.id === 'settings-ai-model-select') {
                logger.debug('[Settings] AI Model changed to:', e.target.value);
                this.autoSaveAIConfig();
            }
        });

        // 🔧 FIX #78: API Key input con auto-guardado
        const keyInput = document.getElementById('settings-ai-key-input');
        // 🔧 FIX v2.9.199: Complete listener tracking migration
        if (keyInput) {
            this._addEventListener(keyInput, 'input', () => {
                this.autoSaveAIConfig();
            });
        }

        // Save button
        const saveButton = document.getElementById('save-ai-settings');
        // 🔧 FIX v2.9.199: Complete listener tracking migration
        if (saveButton) {
            this._addEventListener(saveButton, 'click', async () => {
            const provider = providerSelect?.value;
            const modelSelect = document.getElementById('settings-ai-model-select');
            const keyInput = document.getElementById('settings-ai-key-input');

            if (!provider) {
                if (window.toast) {
                    window.toast.error('Selecciona un proveedor de IA');
                }
                return;
            }

            // Guardar el modelo seleccionado
            if (modelSelect && modelSelect.value) {
                aiConfig.setSelectedModel(modelSelect.value);
            }

            if (keyInput && keyInput.value) {
                // Guardar API key según el proveedor
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

            // Guardar configuración
            aiConfig.saveConfig();

            // Feedback
            if (window.toast) {
                window.toast.success('✓ Configuración de IA guardada correctamente');
            }

            // logger.debug('[Settings] AI configuration saved:', {
            //     provider,
            //     model: modelSelect?.value,
            //     hasKey: !!keyInput?.value
            // });

            // Actualizar vista para mostrar nuevo estado
            this._setTimeout(() => {
                this.updateContent();
            }, 500);
            });
        }
    }

    /**
     * Listeners del tab Seguridad
     */
    attachSecurityListeners() {
        const incognitoToggle = document.getElementById('incognito-toggle');
        // 🔧 FIX v2.9.199: Complete listener tracking migration
        if (incognitoToggle) {
            this._addEventListener(incognitoToggle, 'change', (e) => {
                localStorage.setItem('incognito-mode', e.target.checked);
                // logger.debug('[Settings] Incognito mode:', e.target.checked);
            });
        }
    }

    /**
     * Listeners del tab Apariencia
     */
    attachAppearanceListeners() {
        // 🔧 FIX v2.9.199: Complete listener tracking migration
        document.querySelectorAll('.theme-option').forEach(btn => {
            this._addEventListener(btn, 'click', (e) => {
                const theme = e.currentTarget.dataset.theme;
                localStorage.setItem('theme-preference', theme);

                // Aplicar tema
                if (window.themeHelper) {
                    window.themeHelper.applyTheme(theme);
                }

                // Actualizar UI
                document.querySelectorAll('.theme-option').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
            });
        });
    }

    /**
     * Listeners del tab Sincronización
     */
    attachSyncListeners() {
        const syncNowBtn = document.getElementById('sync-now-btn');
        // 🔧 FIX v2.9.199: Complete listener tracking migration
        if (syncNowBtn) {
            this._addEventListener(syncNowBtn, 'click', async () => {
            const btn = document.getElementById('sync-now-btn');
            if (btn) {
                btn.disabled = true;
                btn.textContent = 'Sincronizando...';
            }

            try {
                // Intentar sincronizar con Supabase si está disponible
                if (window.supabaseSyncHelper && typeof window.supabaseSyncHelper.syncAll === 'function') {
                    await window.supabaseSyncHelper.syncAll();
                    this.showToast('Sincronización completada', 'success');
                } else if (window.cloudSyncHelper && typeof window.cloudSyncHelper.sync === 'function') {
                    await window.cloudSyncHelper.sync();
                    this.showToast('Sincronización completada', 'success');
                } else {
                    // Simular sincronización local (guardar timestamp)
                    localStorage.setItem('last_sync_timestamp', new Date().toISOString());
                    this.showToast('Datos guardados localmente', 'info');
                }
            } catch (error) {
                console.error('Error en sincronización:', error);
                this.showToast('Error al sincronizar', 'error');
            } finally {
                if (btn) {
                    btn.disabled = false;
                    btn.textContent = 'Sincronizar Ahora';
                }
            }
            });
        }

        const exportDataBtn = document.getElementById('export-data-btn');
        // 🔧 FIX v2.9.199: Complete listener tracking migration
        if (exportDataBtn) {
            this._addEventListener(exportDataBtn, 'click', () => {
                if (window.fileExportHelper) {
                    window.fileExportHelper.exportFullBackup();
                } else {
                    // Fallback: exportar datos manualmente
                    this.exportDataFallback();
                }
            });
        }

        const importDataBtn = document.getElementById('import-data-btn');
        // 🔧 FIX v2.9.199: Complete listener tracking migration
        if (importDataBtn) {
            this._addEventListener(importDataBtn, 'click', () => {
                this.showImportDialog();
            });
        }
    }

    /**
     * Mostrar diálogo de importación
     */
    showImportDialog() {
        // Crear input file oculto
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';

        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                const text = await file.text();
                const data = JSON.parse(text);

                // Validar estructura básica
                if (!data || typeof data !== 'object') {
                    throw new Error('Formato de archivo inválido');
                }

                // Confirmar importación
                const confirmed = confirm(
                    '¿Estás seguro de importar estos datos?\n\n' +
                    'Esto sobrescribirá tus datos actuales.\n' +
                    'Se recomienda exportar primero un backup.'
                );

                if (!confirmed) return;

                // Importar datos
                this.importData(data);
                this.showToast('Datos importados correctamente', 'success');

            } catch (error) {
                console.error('Error importando datos:', error);
                this.showToast('Error al importar: ' + error.message, 'error');
            }
        };

        input.click();
    }

    /**
     * Importar datos desde objeto
     */
    importData(data) {
        // Importar cada categoría de datos si existe
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

        // Importar settings directamente si existen
        if (data.settings) {
            Object.entries(data.settings).forEach(([key, value]) => {
                localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
            });
        }

        // Recargar la página para aplicar cambios
        this._setTimeout(() => {
            if (confirm('Los datos se han importado. ¿Deseas recargar la página para aplicar los cambios?')) {
                window.location.reload();
            }
        }, 500);
    }

    /**
     * Exportar datos (fallback si fileExportHelper no está disponible)
     */
    exportDataFallback() {
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

        // Crear y descargar archivo
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `coleccion-nuevo-ser-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showToast('Backup exportado', 'success');
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
     * 🔧 FIX #85: Actualiza el contenido del modal (al cambiar de tab)
     * Optimizado para mostrar/ocultar en lugar de re-renderizar todo el HTML
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
            await this.attachTabListeners();
        } else {
            // 🔧 FIX #85: Solo mostrar/ocultar tabs existentes (sin re-renderizar)
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

            // Solo re-adjuntar listeners del tab actual (más eficiente)
            await this.attachTabListeners();
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

    /**
     * 🔧 FIX #85: Helper para renderizar contenido de tab específico
     */
    renderTabContentByType(tabId) {
        switch (tabId) {
            case 'general':
                return this.renderGeneralTab();
            case 'ai':
                return this.renderAITab();
            case 'account':
                return this.renderAccountTab();
            case 'notifications':
                return this.renderNotificationsTab();
            case 'security':
                return this.renderSecurityTab();
            case 'appearance':
                return this.renderAppearanceTab();
            case 'sync':
                return this.renderSyncTab();
            case 'advanced':
                return this.renderAdvancedTab();
            default:
                return '';
        }
    }

    /**
     * 🔧 FIX #83: Guardar valor de slider con debounce
     * Evita writes excesivos a localStorage durante el movimiento del slider
     */
    debouncedSliderSave(key, value, delay = 300) {
        // Cancelar timer anterior si existe
        if (this.sliderDebounceTimers.has(key)) {
            this._clearTimeout(this.sliderDebounceTimers.get(key));
        }

        // Crear nuevo timer
        const timer = this._setTimeout(() => {
            localStorage.setItem(key, value);
            this.sliderDebounceTimers.delete(key);
            logger.debug(`[Settings] 💾 Slider "${key}" guardado: ${value}`);
        }, delay);

        this.sliderDebounceTimers.set(key, timer);
    }

    /**
     * 🔧 FIX #82: Modal de confirmación simple como fallback
     * Crea un modal de confirmación básico si confirmModal no está disponible
     */
    showSimpleConfirm(title, message) {
        return new Promise((resolve) => {
            // Crear modal
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

            // Event listeners
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

            // Click en backdrop para cerrar
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    cleanup();
                    resolve(false);
                }
            });

            // ESC para cerrar
            const escHandler = (e) => {
                if (e.key === 'Escape') {
                    cleanup();
                    document.removeEventListener('keydown', escHandler);
                    resolve(false);
                }
            };
            document.addEventListener('keydown', escHandler);

            // Agregar al DOM
            document.body.appendChild(modal);
        });
    }

    /**
     * Cierra el modal
     * 🔧 FIX v2.9.197: Memory leak cleanup - timer and listener tracking
     */
    close() {
        // 🔧 FIX v2.9.269: Desactivar focus trap
        if (this.focusTrap) {
            this.focusTrap.deactivate();
            this.focusTrap = null;
        }

        // 🔧 FIX #76: Cancelar carga de voces si está en progreso
        if (this.loadingVoices) {
            logger.debug('[Settings] 🛑 Cancelando carga de voces al cerrar modal');
            this.voicesLoadCancelled = true;
            this.loadingVoices = false;
        }

        // 🔧 FIX #84: Cancelar audio de test si está reproduciéndose
        if (this.currentTestTTSManager) {
            logger.debug('[Settings] 🛑 Deteniendo audio de test al cerrar modal');
            try {
                this.currentTestTTSManager.stop();
            } catch (e) {
                console.warn('[Settings] Error al detener test:', e);
            }
            this.currentTestTTSManager = null;
        }

        // 🔧 FIX v2.9.197: Limpiar todos los timers trackeados
        this.timers.forEach(id => clearTimeout(id));
        this.timers = [];

        this.intervals.forEach(id => clearInterval(id));
        this.intervals = [];

        // Limpiar timers legacy (por compatibilidad)
        if (this.aiConfigAutoSaveTimer) {
            clearTimeout(this.aiConfigAutoSaveTimer);
            this.aiConfigAutoSaveTimer = null;
        }

        // 🔧 FIX #83: Limpiar timers de debounce de sliders
        if (this.sliderDebounceTimers.size > 0) {
            logger.debug('[Settings] 🧹 Limpiando timers de sliders pendientes');
            this.sliderDebounceTimers.forEach((timer, key) => {
                clearTimeout(timer);
                logger.debug(`[Settings] Timer de "${key}" cancelado`);
            });
            this.sliderDebounceTimers.clear();
        }

        // 🔧 FIX v2.9.197: Limpiar todos los event listeners trackeados
        this.listeners.forEach(({ element, event, handler }) => {
            element.removeEventListener(event, handler);
        });
        this.listeners.clear();

        // 🔧 FIX #79: Limpiar listener de resize
        if (this.resizeHandler) {
            window.removeEventListener('resize', this.resizeHandler);
            this.resizeHandler = null;
        }

        // 🔧 FIX #86: Limpiar todos los event listeners con EventManager
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
    // Aplicar tamaño de fuente guardado
    const savedFontSize = localStorage.getItem('font-size');
    if (savedFontSize) {
        document.documentElement.style.setProperty('--font-size-base', savedFontSize + 'px');

        // Aplicar directamente al body y contenido de lectura
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
