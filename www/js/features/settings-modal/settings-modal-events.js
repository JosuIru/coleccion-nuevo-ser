/**
 * SettingsModalEvents - Event Listeners
 * v2.9.390: Arquitectura modular
 */
class SettingsModalEvents {
    constructor(settingsModal) {
        this.settingsModal = settingsModal;
    }

    // ==========================================================================
    // ATTACH LISTENERS (MAIN)
    // ==========================================================================

    async attachListeners() {
        const settingsModal = this.settingsModal;

        // Cerrar modal
        const closeBtn = document.getElementById('close-settings-modal');
        if (closeBtn) {
            settingsModal._addEventListener(closeBtn, 'click', () => {
                settingsModal.close();
            });
        }

        // Cerrar al hacer click fuera
        const modalElement = document.getElementById(settingsModal.modalId);
        if (modalElement) {
            settingsModal._addEventListener(modalElement, 'click', (e) => {
                if (e.target.id === settingsModal.modalId) {
                    settingsModal.close();
                }
            });
        }

        // Limpiar handler anterior antes de crear uno nuevo
        if (settingsModal.escapeHandler) {
            document.removeEventListener('keydown', settingsModal.escapeHandler);
        }

        // Escape key para cerrar modal
        settingsModal.escapeHandler = (e) => {
            if (e.key === 'Escape') {
                settingsModal.close();
            }
        };
        settingsModal._addEventListener(document, 'keydown', settingsModal.escapeHandler);

        // Tab switching (desktop sidebar)
        document.querySelectorAll('.settings-tab').forEach((tab) => {
            const handler = (e) => {
                settingsModal.currentTab = e.currentTarget.dataset.tab;
                settingsModal.updateContent();
            };
            settingsModal._addEventListener(tab, 'click', handler);
        });

        // Tab switching (mobile dropdown)
        const mobileTabSelect = document.getElementById('mobile-settings-tab');
        if (mobileTabSelect) {
            settingsModal._addEventListener(mobileTabSelect, 'change', (e) => {
                settingsModal.currentTab = e.target.value;
                settingsModal.updateContent();
            });
        }

        // Listeners específicos del tab actual
        await this.attachTabListeners();
    }

    // ==========================================================================
    // ATTACH TAB LISTENERS
    // ==========================================================================

    async attachTabListeners() {
        const settingsModal = this.settingsModal;

        switch (settingsModal.currentTab) {
            case 'general':
                await this.attachGeneralListeners();
                break;
            case 'ai':
                await this.attachAIListeners();
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
            case 'about':
                this.attachAboutListeners();
                break;
        }
    }

    // ==========================================================================
    // GENERAL TAB LISTENERS
    // ==========================================================================

    async attachGeneralListeners() {
        const settingsModal = this.settingsModal;

        // Cargar voces disponibles de forma asíncrona
        settingsModal.general.loadVoices();

        // Cambio de idioma
        const languageSelect = document.getElementById('language-select');
        if (languageSelect) {
            settingsModal._addEventListener(languageSelect, 'change', (e) => {
                try {
                    localStorage.setItem('app-language', e.target.value);
                } catch (error) {
                    logger.error('Error guardando idioma:', error);
                    window.toast?.error('Error al guardar idioma. Intenta de nuevo.');
                }
            });
        }

        // Tamaño de fuente
        const slider = document.getElementById('font-size-slider');
        const display = document.getElementById('font-size-display');
        if (slider) {
            settingsModal._addEventListener(slider, 'input', (e) => {
                const size = e.target.value;
                if (display) display.textContent = size + 'px';
                document.documentElement.style.setProperty('--font-size-base', size + 'px');

                settingsModal.debouncedSliderSave('font-size', size, 300);

                const readingContent = document.querySelector('.chapter-content');
                if (readingContent) {
                    readingContent.style.fontSize = size + 'px';
                }

                if (window.toast) {
                    window.toast.info(`Tamaño de fuente: ${size}px`);
                }
            });
        }

        // Auto audio
        const autoAudioToggle = document.getElementById('auto-audio-toggle');
        if (autoAudioToggle) {
            settingsModal._addEventListener(autoAudioToggle, 'change', (e) => {
                try {
                    localStorage.setItem('auto-audio', e.target.checked);
                } catch (error) {
                    logger.error('Error guardando auto-audio:', error);
                }
            });
        }

        // Notificaciones de logros
        const achievementToggle = document.getElementById('achievement-notifications-toggle');
        if (achievementToggle) {
            settingsModal._addEventListener(achievementToggle, 'change', (e) => {
                try {
                    localStorage.setItem('show-achievement-notifications', e.target.checked);
                    if (window.toast) {
                        window.toast.info(e.target.checked ? 'Notificaciones de logros activadas' : 'Notificaciones de logros desactivadas');
                    }
                } catch (error) {
                    logger.error('Error guardando notificaciones de logros:', error);
                }
            });
        }

        // Selector de voz TTS
        const ttsVoiceSelect = document.getElementById('tts-voice-select');
        if (ttsVoiceSelect) {
            settingsModal._addEventListener(ttsVoiceSelect, 'change', (e) => {
                const voiceURI = e.target.value;
                if (window.audioReader) {
                    window.audioReader.setVoice(voiceURI);
                    try {
                        localStorage.setItem('preferred-tts-voice', voiceURI);
                        if (window.toast) {
                            window.toast.success('Voz cambiada correctamente');
                        }
                    } catch (error) {
                        logger.error('Error guardando voz preferida:', error);
                    }
                }
            });
        }

        // ==================== OpenAI TTS Premium ====================
        this.attachOpenAITTSListeners();

        // ==================== ElevenLabs TTS Premium ====================
        this.attachElevenLabsTTSListeners();

        // === Listeners de Caché de Audio ===
        await settingsModal.general.updateAudioCacheStats();

        const refreshCacheBtn = document.getElementById('refresh-cache-stats-btn');
        if (refreshCacheBtn) {
            settingsModal._addEventListener(refreshCacheBtn, 'click', async () => {
                refreshCacheBtn.disabled = true;
                const icon = refreshCacheBtn.querySelector('i');
                if (icon) icon.classList.add('animate-spin');

                await settingsModal.general.updateAudioCacheStats();

                settingsModal._setTimeout(() => {
                    refreshCacheBtn.disabled = false;
                    if (icon) icon.classList.remove('animate-spin');
                }, 500);
            });
        }

        const clearCacheBtn = document.getElementById('clear-audio-cache-btn');
        if (clearCacheBtn) {
            settingsModal._addEventListener(clearCacheBtn, 'click', async () => {
                const cacheManager = window.audioCacheManager;
                if (!cacheManager) return;

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
                    confirmed = await settingsModal.showSimpleConfirm(
                        'Limpiar caché de audio',
                        '¿Eliminar todos los audios guardados? Tendrás que regenerarlos la próxima vez.'
                    );
                }
                if (!confirmed) return;

                clearCacheBtn.disabled = true;
                clearCacheBtn.innerHTML = '<i data-lucide="loader" class="w-3 h-3 animate-spin"></i> Limpiando...';

                try {
                    await cacheManager.clearAll();
                    await settingsModal.general.updateAudioCacheStats();

                    if (window.toast) {
                        window.toast.success('Caché de audio limpiado');
                    }
                } catch (error) {
                    logger.error('Error limpiando caché:', error);
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

    // ==========================================================================
    // OPENAI TTS LISTENERS
    // ==========================================================================

    attachOpenAITTSListeners() {
        const settingsModal = this.settingsModal;

        // Input de API Key
        const openaiKeyInput = document.getElementById('openai-tts-key-input');
        if (openaiKeyInput) {
            settingsModal._addEventListener(openaiKeyInput, 'change', (e) => {
                const apiKey = e.target.value.trim();
                if (apiKey && apiKey !== '••••••••••••••••') {
                    try {
                        localStorage.setItem('openai-tts-key', apiKey);
                        if (window.TTSManager) {
                            const ttsManager = new window.TTSManager();
                            ttsManager.setOpenAIKey(apiKey);
                        }
                        if (window.toast) {
                            window.toast.success('API Key guardada correctamente');
                        }
                        settingsModal.updateContent();
                    } catch (error) {
                        logger.error('Error guardando API Key de OpenAI:', error);
                        window.toast?.error('Error al guardar API Key. Intenta de nuevo.');
                    }
                }
            });
        }

        // Botón "Probar"
        const testButton = document.getElementById('test-openai-voice-btn');
        if (testButton) {
            settingsModal._addEventListener(testButton, 'click', async () => {
                const apiKey = localStorage.getItem('openai-tts-key');
                if (!apiKey) {
                    if (window.toast) {
                        window.toast.error('Por favor, configura tu API Key primero');
                    }
                    return;
                }

                if (settingsModal.currentTestTTSManager) {
                    try {
                        await settingsModal.currentTestTTSManager.stop();
                    } catch (e) {
                        logger.warn('[Settings] Error al detener test anterior:', e);
                    }
                    settingsModal.currentTestTTSManager = null;
                }

                testButton.disabled = true;
                testButton.textContent = 'Probando...';

                try {
                    const ttsManager = new window.TTSManager();
                    settingsModal.currentTestTTSManager = ttsManager;
                    ttsManager.setOpenAIKey(apiKey);
                    ttsManager.setProvider('openai');

                    const selectedVoice = document.getElementById('openai-voice-select')?.value || 'nova';
                    const testText = 'Hola, soy una voz premium de OpenAI. Mi pronunciación es mucho más natural que las voces del navegador.';

                    await ttsManager.speak(testText, {
                        voice: selectedVoice,
                        speed: 1.0,
                        onEnd: () => {},
                        onError: (error) => {
                            logger.error('Error en prueba de voz:', error);
                        }
                    });

                    if (window.toast) {
                        window.toast.success('Voz premium funcionando correctamente!');
                    }
                } catch (error) {
                    logger.error('Error al probar voz:', error);
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
                    testButton.disabled = false;
                    testButton.textContent = 'Probar';
                }
            });
        }

        // Selector de voz OpenAI
        const openaiVoiceSelect = document.getElementById('openai-voice-select');
        if (openaiVoiceSelect) {
            settingsModal._addEventListener(openaiVoiceSelect, 'change', (e) => {
                const voice = e.target.value;
                try {
                    localStorage.setItem('openai-voice', voice);
                    if (window.toast) {
                        window.toast.success(`Voz cambiada a ${voice}`);
                    }
                } catch (error) {
                    logger.error('Error guardando voz de OpenAI:', error);
                }
            });
        }

        // Toggle de caché
        const cacheToggle = document.getElementById('tts-cache-toggle');
        if (cacheToggle) {
            settingsModal._addEventListener(cacheToggle, 'change', (e) => {
                const enabled = e.target.checked;
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
                    logger.error('Error guardando configuración de caché:', error);
                }
            });
        }
    }

    // ==========================================================================
    // ELEVENLABS TTS LISTENERS
    // ==========================================================================

    attachElevenLabsTTSListeners() {
        const settingsModal = this.settingsModal;

        // Selector de voz ElevenLabs
        const elevenLabsVoiceSelect = document.getElementById('elevenlabs-voice-select');
        if (elevenLabsVoiceSelect) {
            settingsModal._addEventListener(elevenLabsVoiceSelect, 'change', (e) => {
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
        if (stabilitySlider) {
            settingsModal._addEventListener(stabilitySlider, 'input', (e) => {
                const value = e.target.value;
                const label = stabilitySlider.parentElement?.querySelector('.text-gray-500');
                if (label) {
                    label.textContent = `(${value})`;
                }
                settingsModal.debouncedSliderSave('elevenlabs-stability', value, 300);
            });
        }

        // Slider de similitud
        const similaritySlider = document.getElementById('elevenlabs-similarity-slider');
        if (similaritySlider) {
            settingsModal._addEventListener(similaritySlider, 'input', (e) => {
                const value = e.target.value;
                const label = similaritySlider.parentElement?.querySelector('.text-gray-500');
                if (label) {
                    label.textContent = `(${value})`;
                }
                settingsModal.debouncedSliderSave('elevenlabs-similarity', value, 300);
            });
        }

        // Botón de prueba ElevenLabs
        const testElevenLabsBtn = document.getElementById('test-elevenlabs-voice-btn');
        if (testElevenLabsBtn) {
            settingsModal._addEventListener(testElevenLabsBtn, 'click', async () => {
                if (!window.aiPremium || !window.aiPremium.hasFeature('elevenlabs_tts')) {
                    if (window.toast) {
                        window.toast.error('Requiere suscripción Premium');
                    }
                    return;
                }

                if (settingsModal.currentTestTTSManager) {
                    try {
                        await settingsModal.currentTestTTSManager.stop();
                    } catch (e) {
                        logger.warn('[Settings] Error al detener test anterior:', e);
                    }
                    settingsModal.currentTestTTSManager = null;
                }

                testElevenLabsBtn.disabled = true;
                testElevenLabsBtn.innerHTML = '<i data-lucide="loader" class="w-4 h-4 inline mr-1 animate-spin"></i> Generando...';

                try {
                    const voice = localStorage.getItem('elevenlabs-voice') || 'EXAVITQu4vr4xnSDxMaL';
                    const stability = parseFloat(localStorage.getItem('elevenlabs-stability') || '0.5');
                    const similarity = parseFloat(localStorage.getItem('elevenlabs-similarity') || '0.75');

                    const testText = 'Hola, soy una voz de ElevenLabs. Mi pronunciación es increíblemente natural y expresiva.';

                    if (window.audioReader && window.audioReader.ttsManager && window.audioReader.ttsManager.providers.elevenlabs) {
                        await window.audioReader.ttsManager.providers.elevenlabs.speak(testText, {
                            voice,
                            stability,
                            similarity_boost: similarity,
                            onEnd: () => {
                                if (window.toast) {
                                    window.toast.success('Voz ElevenLabs funcionando!');
                                }
                            },
                            onError: (error) => {
                                logger.error('Error en prueba ElevenLabs:', error);
                                if (window.toast) {
                                    window.toast.error(error.message || 'Error al probar voz');
                                }
                            }
                        });
                    } else {
                        throw new Error('ElevenLabs provider no disponible');
                    }
                } catch (error) {
                    logger.error('Error al probar ElevenLabs:', error);
                    if (window.toast) {
                        window.toast.error(error.message || 'Error al probar voz ElevenLabs');
                    }
                } finally {
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
        if (elevenLabsDefaultToggle) {
            settingsModal._addEventListener(elevenLabsDefaultToggle, 'change', (e) => {
                const useElevenLabs = e.target.checked;
                const usePersonalKey = localStorage.getItem('elevenlabs-use-personal-key') === 'true';

                if (useElevenLabs) {
                    if (!usePersonalKey) {
                        if (!window.aiPremium || !window.aiPremium.hasFeature('elevenlabs_tts')) {
                            e.target.checked = false;
                            if (window.toast) {
                                window.toast.error('Requiere suscripción Premium o API key personal');
                            }
                            return;
                        }
                    }

                    localStorage.setItem('tts-provider', 'elevenlabs');
                    if (window.audioReader) {
                        window.audioReader.ttsProvider = 'elevenlabs';
                    }
                    if (window.toast) {
                        window.toast.success('Voces ElevenLabs activadas');
                    }
                } else {
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

        // Toggle para usar API key personal
        const usePersonalKeyToggle = document.getElementById('elevenlabs-use-personal-key-toggle');
        if (usePersonalKeyToggle) {
            settingsModal._addEventListener(usePersonalKeyToggle, 'change', (e) => {
                const usePersonal = e.target.checked;
                localStorage.setItem('elevenlabs-use-personal-key', usePersonal.toString());

                const keySection = document.getElementById('elevenlabs-personal-key-section');
                if (keySection) {
                    keySection.classList.toggle('hidden', !usePersonal);
                }

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
        if (personalKeyInput) {
            settingsModal._addEventListener(personalKeyInput, 'change', (e) => {
                const apiKey = e.target.value.trim();
                if (apiKey && apiKey !== '••••••••••••••••') {
                    localStorage.setItem('elevenlabs-personal-key', apiKey);

                    if (window.audioReader && window.audioReader.ttsManager && window.audioReader.ttsManager.providers.elevenlabs) {
                        window.audioReader.ttsManager.providers.elevenlabs.setApiKey(apiKey);
                    }

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
        if (testPersonalKeyBtn) {
            settingsModal._addEventListener(testPersonalKeyBtn, 'click', async () => {
                const apiKey = localStorage.getItem('elevenlabs-personal-key');
                if (!apiKey) {
                    if (window.toast) {
                        window.toast.error('Configura tu API Key primero');
                    }
                    return;
                }

                if (settingsModal.currentTestTTSManager) {
                    try {
                        await settingsModal.currentTestTTSManager.stop();
                    } catch (e) {
                        logger.warn('[Settings] Error al detener test anterior:', e);
                    }
                    settingsModal.currentTestTTSManager = null;
                }

                testPersonalKeyBtn.disabled = true;
                testPersonalKeyBtn.textContent = '...';

                try {
                    const testProvider = new window.ElevenLabsTTSProvider();
                    testProvider.setApiKey(apiKey);
                    testProvider.setUsePersonalKey(true);

                    const testText = 'Prueba de voz con tu API key personal.';
                    await testProvider.speak(testText, {
                        onEnd: () => {
                            if (window.toast) {
                                window.toast.success('API Key válida!');
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
    }

    // ==========================================================================
    // AI TAB LISTENERS
    // ==========================================================================

    async attachAIListeners() {
        const settingsModal = this.settingsModal;
        const aiConfig = window.aiConfig;
        if (!aiConfig) return;

        const providerSelect = document.getElementById('settings-ai-provider-select');
        if (providerSelect) {
            settingsModal._addEventListener(providerSelect, 'change', (e) => {
                const newProvider = e.target.value;
                logger.debug('[Settings] AI Provider changed to:', newProvider);

                const modelSection = document.getElementById('settings-ai-model-section');
                const keySection = document.getElementById('settings-ai-key-section');

                if (modelSection) {
                    modelSection.innerHTML = settingsModal.ai.renderAIModelSelector(newProvider);
                }

                if (keySection) {
                    keySection.innerHTML = settingsModal.ai.renderAIKeyInput(newProvider);
                }

                if (window.Icons) {
                    window.Icons.init();
                }

                settingsModal.autoSaveAIConfig();
            });
        }

        // Model change con auto-guardado (delegated event)
        settingsModal._addEventListener(document, 'change', (e) => {
            if (e.target.id === 'settings-ai-model-select') {
                logger.debug('[Settings] AI Model changed to:', e.target.value);
                settingsModal.autoSaveAIConfig();
            }
        });

        // API Key input con auto-guardado
        const keyInput = document.getElementById('settings-ai-key-input');
        if (keyInput) {
            settingsModal._addEventListener(keyInput, 'input', () => {
                settingsModal.autoSaveAIConfig();
            });
        }

        // Save button
        const saveButton = document.getElementById('save-ai-settings');
        if (saveButton) {
            settingsModal._addEventListener(saveButton, 'click', async () => {
                const provider = providerSelect?.value;
                const modelSelect = document.getElementById('settings-ai-model-select');
                const keyInput = document.getElementById('settings-ai-key-input');

                if (!provider) {
                    if (window.toast) {
                        window.toast.error('Selecciona un proveedor de IA');
                    }
                    return;
                }

                if (modelSelect && modelSelect.value) {
                    aiConfig.setSelectedModel(modelSelect.value);
                }

                if (keyInput && keyInput.value) {
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

                if (window.toast) {
                    window.toast.success('Configuración de IA guardada correctamente');
                }

                settingsModal._setTimeout(() => {
                    settingsModal.updateContent();
                }, 500);
            });
        }
    }

    // ==========================================================================
    // SECURITY TAB LISTENERS
    // ==========================================================================

    attachSecurityListeners() {
        const settingsModal = this.settingsModal;

        const incognitoToggle = document.getElementById('incognito-toggle');
        if (incognitoToggle) {
            settingsModal._addEventListener(incognitoToggle, 'change', (e) => {
                localStorage.setItem('incognito-mode', e.target.checked);
            });
        }
    }

    // ==========================================================================
    // APPEARANCE TAB LISTENERS
    // ==========================================================================

    attachAppearanceListeners() {
        const settingsModal = this.settingsModal;

        document.querySelectorAll('.theme-option').forEach(btn => {
            settingsModal._addEventListener(btn, 'click', (e) => {
                const theme = e.currentTarget.dataset.theme;
                localStorage.setItem('theme-preference', theme);

                if (window.themeHelper) {
                    window.themeHelper.applyTheme(theme);
                }

                document.querySelectorAll('.theme-option').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
            });
        });
    }

    // ==========================================================================
    // SYNC TAB LISTENERS
    // ==========================================================================

    attachSyncListeners() {
        const settingsModal = this.settingsModal;

        const syncNowBtn = document.getElementById('sync-now-btn');
        if (syncNowBtn) {
            settingsModal._addEventListener(syncNowBtn, 'click', async () => {
                const btn = document.getElementById('sync-now-btn');
                if (btn) {
                    btn.disabled = true;
                    btn.textContent = 'Sincronizando...';
                }

                try {
                    if (window.supabaseSyncHelper && typeof window.supabaseSyncHelper.syncAll === 'function') {
                        await window.supabaseSyncHelper.syncAll();
                        settingsModal.showToast('Sincronización completada', 'success');
                    } else if (window.cloudSyncHelper && typeof window.cloudSyncHelper.sync === 'function') {
                        await window.cloudSyncHelper.sync();
                        settingsModal.showToast('Sincronización completada', 'success');
                    } else {
                        localStorage.setItem('last_sync_timestamp', new Date().toISOString());
                        settingsModal.showToast('Datos guardados localmente', 'info');
                    }
                } catch (error) {
                    logger.error('Error en sincronización:', error);
                    settingsModal.showToast('Error al sincronizar', 'error');
                } finally {
                    if (btn) {
                        btn.disabled = false;
                        btn.textContent = 'Sincronizar Ahora';
                    }
                }
            });
        }

        const exportDataBtn = document.getElementById('export-data-btn');
        if (exportDataBtn) {
            settingsModal._addEventListener(exportDataBtn, 'click', () => {
                if (window.fileExportHelper) {
                    window.fileExportHelper.exportFullBackup();
                } else {
                    settingsModal.appearance.exportDataFallback();
                }
            });
        }

        const importDataBtn = document.getElementById('import-data-btn');
        if (importDataBtn) {
            settingsModal._addEventListener(importDataBtn, 'click', () => {
                settingsModal.appearance.showImportDialog();
            });
        }
    }

    // ==========================================================================
    // ABOUT TAB LISTENERS
    // ==========================================================================

    attachAboutListeners() {
        const settingsModal = this.settingsModal;
        const supportChatBtn = document.getElementById('open-support-chat-btn');

        if (supportChatBtn) {
            settingsModal._addEventListener(supportChatBtn, 'click', () => {
                settingsModal.close();
                settingsModal._setTimeout(() => {
                    if (window.supportChat) {
                        window.supportChat.showFab();
                        window.supportChat.open();
                    }
                }, 300);
            });
        }
    }
}

// Exponer globalmente
window.SettingsModalEvents = SettingsModalEvents;
