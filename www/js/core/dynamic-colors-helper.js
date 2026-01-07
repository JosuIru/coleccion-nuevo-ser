/**
// 🔧 FIX v2.9.198: Migrated console.log to logger
 * DynamicColorsHelper - Material You Integration para JavaScript
 *
 * Obtiene los colores dinámicos del sistema Android (wallpaper-based) y los aplica
 * a la interfaz web usando CSS variables.
 *
 * Requiere:
 * - Android 12+ (API 31)
 * - DynamicColorsHelper.kt en el lado nativo
 *
 * Los colores se sincronizan automáticamente cuando:
 * - La app se inicia
 * - El usuario cambia el wallpaper
 * - El usuario activa/desactiva los colores dinámicos en settings
 */
class DynamicColorsHelper {
    constructor() {
        this.isCapacitor = typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform();
        this.isAndroid12Plus = false;
        this.systemColors = null;
        this.enabled = false;

        this.init();
    }

    async init() {
        // logger.debug('[DynamicColors] Initializing...');

        // Verificar si estamos en Android 12+
        this.isAndroid12Plus = await this.checkAndroidVersion();

        if (!this.isAndroid12Plus) {
            // logger.debug('[DynamicColors] Not available (requires Android 12+)');
            window.dynamicColorsHelper = this;
            return;
        }

        // Cargar preferencia guardada
        this.enabled = localStorage.getItem('dynamic-colors-enabled') === 'true';

        // Obtener colores del sistema
        await this.fetchSystemColors();

        // Aplicar si está habilitado
        if (this.enabled && this.systemColors) {
            this.applyDynamicColors();
        }

        // Exponer globalmente
        window.dynamicColorsHelper = this;
        // logger.debug('[DynamicColors] Ready', {
        //     enabled: this.enabled,
        //     systemColors: this.systemColors
        // });
    }

    /**
     * Verifica si el dispositivo es Android 12+
     * @returns {Promise<boolean>}
     */
    async checkAndroidVersion() {
        if (!this.isCapacitor) {
            return false;
        }

        try {
            if (window.Capacitor?.Plugins?.Device) {
                const { Device } = window.Capacitor.Plugins;
                const info = await Device.getInfo();

                // Android 12 = SDK 31
                const isAndroid12Plus = info.platform === 'android' &&
                                       info.androidSDKVersion >= 31;

                // logger.debug('[DynamicColors] Device info:', {
                //     platform: info.platform,
                //     androidSDK: info.androidSDKVersion,
                //     materialYouAvailable: isAndroid12Plus
                // });

                return isAndroid12Plus;
            }
        } catch (error) {
            // logger.warn('[DynamicColors] Error checking Android version:', error);
        }

        return false;
    }

    /**
     * Obtiene los colores del sistema desde el helper nativo
     * @returns {Promise<void>}
     */
    async fetchSystemColors() {
        if (!this.isAndroid12Plus || !this.isCapacitor) {
            return;
        }

        try {
            // Llamar al plugin nativo DynamicColorsPlugin
            if (window.Capacitor?.Plugins?.DynamicColors) {
                const colors = await window.Capacitor.Plugins.DynamicColors.getSystemColors();

                if (colors && (colors.accent1 || colors.accent2 || colors.accent3)) {
                    this.systemColors = colors;
                    // logger.debug('[DynamicColors] System colors obtained from plugin:', this.systemColors);
                    return;
                }
            }

            // Fallback: intentar obtenerlos via CSS
            const coloresExtraidos = this.extractColorsFromCSS();

            if (coloresExtraidos) {
                this.systemColors = coloresExtraidos;
                // logger.debug('[DynamicColors] System colors obtained from CSS:', this.systemColors);
            } else {
                // logger.debug('[DynamicColors] Using fallback colors');
                this.systemColors = {
                    accent1: '#3b82f6', // Azul por defecto
                    accent2: '#8b5cf6', // Púrpura por defecto
                    accent3: '#06b6d4'  // Cyan por defecto
                };
            }
        } catch (error) {
            logger.error('[DynamicColors] Error fetching system colors:', error);
            // Usar colores por defecto en caso de error
            this.systemColors = {
                accent1: '#3b82f6',
                accent2: '#8b5cf6',
                accent3: '#06b6d4'
            };
        }
    }

    /**
     * Intenta extraer colores dinámicos desde CSS variables del sistema
     * @returns {Object|null}
     */
    extractColorsFromCSS() {
        try {
            const rootStyles = getComputedStyle(document.documentElement);

            // Intentar leer variables CSS del sistema si están disponibles
            const accent1 = rootStyles.getPropertyValue('--system-accent1').trim();
            const accent2 = rootStyles.getPropertyValue('--system-accent2').trim();
            const accent3 = rootStyles.getPropertyValue('--system-accent3').trim();

            if (accent1 || accent2 || accent3) {
                return {
                    accent1: accent1 || '#3b82f6',
                    accent2: accent2 || '#8b5cf6',
                    accent3: accent3 || '#06b6d4'
                };
            }
        } catch (error) {
            // logger.warn('[DynamicColors] Could not extract CSS colors:', error);
        }

        return null;
    }

    /**
     * Aplica los colores dinámicos a la interfaz
     */
    applyDynamicColors() {
        if (!this.systemColors) {
            // logger.warn('[DynamicColors] No system colors available');
            return;
        }

        // logger.debug('[DynamicColors] Applying dynamic colors...');

        const root = document.documentElement;

        // Aplicar colores a CSS variables
        root.style.setProperty('--color-primary', this.systemColors.accent1);
        root.style.setProperty('--color-secondary', this.systemColors.accent2);
        root.style.setProperty('--color-tertiary', this.systemColors.accent3);

        // Variaciones de los colores primarios (más claros/oscuros)
        root.style.setProperty('--color-primary-light', this.lightenColor(this.systemColors.accent1, 20));
        root.style.setProperty('--color-primary-dark', this.darkenColor(this.systemColors.accent1, 20));

        // Guardar preferencia
        localStorage.setItem('dynamic-colors-enabled', 'true');
        this.enabled = true;

        // logger.debug('[DynamicColors] Colors applied successfully');

        // Disparar evento para que otros componentes se actualicen
        window.dispatchEvent(new CustomEvent('dynamic-colors-changed', {
            detail: { colors: this.systemColors }
        }));
    }

    /**
     * Desactiva los colores dinámicos y vuelve a los colores por defecto
     */
    disable() {
        // logger.debug('[DynamicColors] Disabling dynamic colors...');

        const root = document.documentElement;

        // Remover las variables CSS personalizadas
        root.style.removeProperty('--color-primary');
        root.style.removeProperty('--color-secondary');
        root.style.removeProperty('--color-tertiary');
        root.style.removeProperty('--color-primary-light');
        root.style.removeProperty('--color-primary-dark');

        // Guardar preferencia
        localStorage.setItem('dynamic-colors-enabled', 'false');
        this.enabled = false;

        // logger.debug('[DynamicColors] Colors disabled, using defaults');

        // Disparar evento
        window.dispatchEvent(new CustomEvent('dynamic-colors-changed', {
            detail: { colors: null }
        }));
    }

    /**
     * Alterna los colores dinámicos on/off
     */
    toggle() {
        if (this.enabled) {
            this.disable();
        } else {
            this.applyDynamicColors();
        }
    }

    /**
     * Aclara un color en formato hexadecimal
     * @param {string} color - Color en formato #RRGGBB
     * @param {number} percent - Porcentaje a aclarar (0-100)
     * @returns {string}
     */
    lightenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.min(255, (num >> 16) + amt);
        const G = Math.min(255, (num >> 8 & 0x00FF) + amt);
        const B = Math.min(255, (num & 0x0000FF) + amt);
        return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
    }

    /**
     * Oscurece un color en formato hexadecimal
     * @param {string} color - Color en formato #RRGGBB
     * @param {number} percent - Porcentaje a oscurecer (0-100)
     * @returns {string}
     */
    darkenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.max(0, (num >> 16) - amt);
        const G = Math.max(0, (num >> 8 & 0x00FF) - amt);
        const B = Math.max(0, (num & 0x0000FF) - amt);
        return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
    }

    /**
     * Renderiza el panel de configuración para el modal de settings
     * @returns {string} HTML del panel
     */
    renderSettingsPanel() {
        if (!this.isAndroid12Plus) {
            return `
                <div class="dynamic-colors-settings">
                    <h3 class="text-lg font-semibold mb-4">Material You</h3>
                    <div class="bg-slate-700/50 rounded-lg p-4">
                        <p class="text-sm text-gray-400">
                            <i class="lucide-info mr-2"></i>
                            Material You requiere Android 12 o superior
                        </p>
                    </div>
                </div>
            `;
        }

        return `
            <div class="dynamic-colors-settings">
                <h3 class="text-lg font-semibold mb-4">Material You</h3>

                <div class="settings-group">
                    <label class="flex items-center justify-between">
                        <div class="flex-1">
                            <span class="block font-medium">Colores dinámicos</span>
                            <span class="text-sm text-gray-400 mt-1">
                                Adapta los colores de la app a tu wallpaper
                            </span>
                        </div>
                        <input
                            type="checkbox"
                            id="dynamic-colors-toggle"
                            ${this.enabled ? 'checked' : ''}
                            class="toggle-switch">
                    </label>
                </div>

                ${this.systemColors ? `
                    <div class="mt-6">
                        <h4 class="text-sm font-semibold mb-3 text-gray-400">Vista previa de colores</h4>
                        <div class="flex gap-4">
                            <div class="flex-1 text-center">
                                <div class="w-16 h-16 rounded-full mx-auto mb-2"
                                     style="background-color: ${this.systemColors.accent1}"></div>
                                <span class="text-xs text-gray-400">Primario</span>
                            </div>
                            <div class="flex-1 text-center">
                                <div class="w-16 h-16 rounded-full mx-auto mb-2"
                                     style="background-color: ${this.systemColors.accent2}"></div>
                                <span class="text-xs text-gray-400">Secundario</span>
                            </div>
                            <div class="flex-1 text-center">
                                <div class="w-16 h-16 rounded-full mx-auto mb-2"
                                     style="background-color: ${this.systemColors.accent3}"></div>
                                <span class="text-xs text-gray-400">Terciario</span>
                            </div>
                        </div>
                    </div>
                ` : ''}

                <div class="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                    <p class="text-sm text-blue-300">
                        <i class="lucide-lightbulb mr-2"></i>
                        Los colores se extraen del wallpaper de tu dispositivo
                    </p>
                </div>
            </div>
        `;
    }

    /**
     * Adjunta los event listeners al panel de settings
     */
    attachSettingsListeners() {
        const toggle = document.getElementById('dynamic-colors-toggle');

        if (toggle) {
            toggle.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.applyDynamicColors();
                } else {
                    this.disable();
                }
            });
        }
    }
}

// Auto-inicialización
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new DynamicColorsHelper();
    });
} else {
    new DynamicColorsHelper();
}
