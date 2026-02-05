/**
 * SettingsModalGeneral - Tab General + TTS
 * v2.9.390: Arquitectura modular
 */
class SettingsModalGeneral {
    constructor(settingsModal) {
        this.settingsModal = settingsModal;
    }

    // ==========================================================================
    // TAB GENERAL
    // ==========================================================================

    renderGeneralTab() {
        const currentLanguage = localStorage.getItem('app-language') || 'es';
        const fontSize = localStorage.getItem('font-size') || '16';
        const autoAudio = localStorage.getItem('auto-audio') === 'true';

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

    // ==========================================================================
    // VOICE SELECTOR
    // ==========================================================================

    renderVoiceSelector() {
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
     * Carga las voces disponibles de forma asíncrona
     */
    async loadVoices() {
        const settingsModal = this.settingsModal;

        if (settingsModal.loadingVoices) {
            logger.debug('[Settings] Ya hay una carga de voces en progreso');
            return;
        }

        settingsModal.loadingVoices = true;
        settingsModal.voicesLoadCancelled = false;

        const audioReader = window.audioReader;
        const selectElement = document.getElementById('tts-voice-select');

        const diagnosis = {
            audioReader: !!audioReader,
            selectElement: !!selectElement,
            synthesis: !!window.speechSynthesis,
            getVoices: typeof window.speechSynthesis?.getVoices
        };

        logger.debug('[Settings] Cargando voces...', diagnosis);

        if (!audioReader || !selectElement) {
            logger.warn('[Settings] No se puede cargar voces', diagnosis);
            settingsModal.loadingVoices = false;
            return;
        }

        try {
            const directVoices = window.speechSynthesis ? window.speechSynthesis.getVoices() : [];
            logger.debug('[Settings] Voces directas de speechSynthesis:', directVoices.length);

            const availableVoices = await audioReader.getAvailableVoices();
            const selectedVoiceURI = audioReader.selectedVoiceURI || audioReader.selectedVoice?.voiceURI || '';

            logger.debug('[Settings] Voces de audioReader:', availableVoices.length);

            if (availableVoices.length === 0 && directVoices.length === 0) {
                selectElement.innerHTML = '<option value="">Esperando voces...</option>';

                let retryCount = 0;
                const maxRetries = 5;

                const retryLoad = async () => {
                    if (settingsModal.voicesLoadCancelled) {
                        logger.debug('[Settings] Carga de voces cancelada');
                        settingsModal.loadingVoices = false;
                        return;
                    }

                    retryCount++;
                    await new Promise(resolve => settingsModal._setTimeout(resolve, 1000 * retryCount));

                    if (settingsModal.voicesLoadCancelled) {
                        logger.debug('[Settings] Carga de voces cancelada durante delay');
                        settingsModal.loadingVoices = false;
                        return;
                    }

                    const retryVoices = await audioReader.getAvailableVoices();
                    const retryDirect = window.speechSynthesis ? window.speechSynthesis.getVoices() : [];

                    logger.debug(`[Settings] Reintento ${retryCount}/${maxRetries}:`, retryVoices.length, '/', retryDirect.length);

                    if (retryVoices.length > 0 || retryDirect.length > 0) {
                        const voicesToUse = retryVoices.length > 0 ? retryVoices : retryDirect.filter(v => v.lang.startsWith('es'));
                        selectElement.innerHTML = voicesToUse.map(voice => `
                            <option value="${voice.voiceURI || voice.name}">
                                ${voice.name} ${voice.lang ? `(${voice.lang})` : ''}
                            </option>
                        `).join('');
                        if (window.toast) {
                            window.toast.success(`${voicesToUse.length} voces cargadas!`);
                        }
                        settingsModal.loadingVoices = false;
                    } else if (retryCount < maxRetries) {
                        retryLoad();
                    } else {
                        selectElement.innerHTML = '<option value="">Sin voces (verificar permisos)</option>';
                        if (window.toast) {
                            window.toast.error('No se pudieron cargar voces después de 5 intentos');
                        }
                        settingsModal.loadingVoices = false;
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
            logger.debug('[Settings] Voces cargadas correctamente');
            settingsModal.loadingVoices = false;
        } catch (error) {
            logger.error('[Settings] Error loading voices:', error);
            selectElement.innerHTML = '<option value="">Error: ' + (window.sanitizer?.sanitize(error.message) || Sanitizer.escapeHtml(error.message)) + '</option>';
            if (window.toast) {
                window.toast.error('Error cargando voces: ' + (window.sanitizer?.sanitize(error.message) || Sanitizer.escapeHtml(error.message)));
            }
            settingsModal.loadingVoices = false;
        }
    }

    // ==========================================================================
    // PREMIUM TTS (OpenAI)
    // ==========================================================================

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
                            <option value="nova" ${openaiVoice === 'nova' ? 'selected' : ''}>Nova (Femenina)</option>
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

    // ==========================================================================
    // ELEVENLABS TTS
    // ==========================================================================

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

    // ==========================================================================
    // ELEVENLABS PERSONAL KEY
    // ==========================================================================

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

    // ==========================================================================
    // AUDIO CACHE
    // ==========================================================================

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
            logger.error('Error obteniendo estadísticas de caché:', error);
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
}

// Exponer globalmente
window.SettingsModalGeneral = SettingsModalGeneral;
