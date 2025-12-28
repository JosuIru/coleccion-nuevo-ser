/**
// 🔧 FIX v2.9.198: Migrated console.log to logger
 * Awakening Protocol Bridge
 * Handles communication between Colección Nuevo Ser and Awakening Protocol app
 *
 * Deep Link Schemes:
 * - awakeningprotocol://receive-being?data={base64}  (send being TO Awakening)
 * - nuevosser://receive-being?data={base64}          (receive being FROM Awakening)
 * - nuevosser://lab                                   (open Frankenstein Lab)
 *
 * @version 1.0.0
 */

const AwakeningBridge = {
    // Deep link schemes
    AWAKENING_SCHEME: 'awakeningprotocol://',
    COLECCION_SCHEME: 'nuevosser://',

    // Package IDs for store links
    AWAKENING_PACKAGE: 'com.awakeningprotocol.mobile',
    COLECCION_PACKAGE: 'com.nuevosser.coleccion',

    // Play Store URL template
    PLAY_STORE_URL: 'https://play.google.com/store/apps/details?id=',

    /**
     * Initialize the bridge (call on app start)
     */
    init() {
        this.setupDeepLinkHandler();
        logger.debug('[AwakeningBridge] Initialized');
    },

    /**
     * Setup handler for incoming deep links
     */
    setupDeepLinkHandler() {
        // Handle deep links via Capacitor App plugin
        if (window.Capacitor && window.Capacitor.Plugins.App) {
            const { App } = window.Capacitor.Plugins;

            App.addListener('appUrlOpen', (event) => {
                logger.debug('[AwakeningBridge] Deep link received:', event.url);
                this.handleIncomingDeepLink(event.url);
            });
        }

        // Also listen for web-based navigation (for testing)
        window.addEventListener('hashchange', () => {
            const hash = window.location.hash;
            if (hash.startsWith('#receive-being')) {
                const params = new URLSearchParams(hash.replace('#receive-being?', ''));
                const data = params.get('data');
                if (data) {
                    this.handleReceiveBeing(data);
                }
            }
        });
    },

    /**
     * Handle incoming deep link
     */
    handleIncomingDeepLink(url) {
        if (!url) return;

        try {
            // Parse URL
            let action, params;

            if (url.startsWith(this.COLECCION_SCHEME)) {
                const withoutScheme = url.replace(this.COLECCION_SCHEME, '');
                const [pathPart, queryPart] = withoutScheme.split('?');
                action = pathPart.split('/')[0];
                params = this.parseQueryString(queryPart);
            } else {
                // Handle https:// links
                const urlObj = new URL(url);
                action = urlObj.pathname.replace('/', '');
                params = Object.fromEntries(urlObj.searchParams);
            }

            logger.debug('[AwakeningBridge] Action:', action, 'Params:', params);

            switch (action) {
                case 'receive-being':
                    this.handleReceiveBeing(params.data);
                    break;

                case 'lab':
                    this.openFrankensteinLab();
                    break;

                case 'sync':
                    this.handleSyncRequest(params);
                    break;

                default:
                    console.warn('[AwakeningBridge] Unknown action:', action);
            }
        } catch (error) {
            console.error('[AwakeningBridge] Error handling deep link:', error);
        }
    },

    /**
     * Parse query string to object
     */
    parseQueryString(queryString) {
        if (!queryString) return {};

        const params = {};
        queryString.split('&').forEach(pair => {
            const [key, value] = pair.split('=');
            params[decodeURIComponent(key)] = decodeURIComponent(value || '');
        });
        return params;
    },

    /**
     * Handle receiving a being from Awakening Protocol
     */
    handleReceiveBeing(base64Data) {
        if (!base64Data) {
            this.showNotification('Error: No se recibieron datos del ser', 'error');
            return;
        }

        try {
            const beingData = JSON.parse(atob(base64Data));
            logger.debug('[AwakeningBridge] Received being:', beingData);

            // Validate being structure
            if (!beingData.name && !beingData.id) {
                this.showNotification('Error: Datos del ser inválidos', 'error');
                return;
            }

            // Save being to local storage
            const savedBeings = this.getSavedBeings();
            const newBeing = {
                id: beingData.id || `awakening_${Date.now()}`,
                name: beingData.name || 'Ser de Awakening',
                attributes: beingData.attributes || {},
                sourceApp: 'awakening-protocol',
                importedAt: new Date().toISOString(),
                synergy: beingData.synergy || 0
            };

            savedBeings.push(newBeing);
            localStorage.setItem('frankenstein_beings', JSON.stringify(savedBeings));

            // Show success notification
            this.showNotification(
                `"${newBeing.name}" importado desde Awakening Protocol`,
                'success'
            );

            // If Frankenstein Lab is open, refresh the list
            if (window.FrankensteinLabUI && window.FrankensteinLabUI.isInitialized) {
                window.FrankensteinLabUI.refreshBeingsList?.();
            }

        } catch (error) {
            console.error('[AwakeningBridge] Error parsing being:', error);
            this.showNotification('Error al importar el ser', 'error');
        }
    },

    /**
     * Send a being to Awakening Protocol
     */
    async sendBeingToAwakening(being) {
        if (!being) {
            this.showNotification('Selecciona un ser para enviar', 'warning');
            return false;
        }

        try {
            // Prepare being data
            const beingData = {
                id: being.id,
                name: being.name,
                attributes: being.attributes || {},
                sourceApp: 'coleccion-nuevo-ser',
                synergy: being.synergy || 0,
                createdAt: being.createdAt || new Date().toISOString()
            };

            // Encode to base64
            const base64Data = btoa(JSON.stringify(beingData));

            // Build deep link URL
            const deepLinkUrl = `${this.AWAKENING_SCHEME}receive-being?data=${encodeURIComponent(base64Data)}&name=${encodeURIComponent(being.name)}`;

            logger.debug('[AwakeningBridge] Sending being:', deepLinkUrl);

            // Try to open Awakening Protocol
            const opened = await this.openDeepLink(deepLinkUrl);

            if (opened) {
                this.showNotification(
                    `"${being.name}" enviado a Awakening Protocol`,
                    'success'
                );
                return true;
            } else {
                // Awakening Protocol not installed
                this.promptInstallAwakening();
                return false;
            }

        } catch (error) {
            console.error('[AwakeningBridge] Error sending being:', error);
            this.showNotification('Error al enviar el ser', 'error');
            return false;
        }
    },

    /**
     * Open Awakening Protocol app
     */
    async openAwakeningProtocol(screen = null) {
        let url = this.AWAKENING_SCHEME;

        if (screen) {
            url += `open?screen=${encodeURIComponent(screen)}`;
        }

        const opened = await this.openDeepLink(url);

        if (!opened) {
            this.promptInstallAwakening();
        }

        return opened;
    },

    /**
     * Open a deep link URL
     */
    async openDeepLink(url) {
        // Try Capacitor first
        if (window.Capacitor && window.Capacitor.Plugins.App) {
            try {
                const { App } = window.Capacitor.Plugins;
                await App.openUrl({ url });
                return true;
            } catch (error) {
                logger.debug('[AwakeningBridge] Capacitor openUrl failed:', error);
            }
        }

        // Try Browser plugin
        if (window.Capacitor && window.Capacitor.Plugins.Browser) {
            try {
                const { Browser } = window.Capacitor.Plugins;
                await Browser.open({ url });
                return true;
            } catch (error) {
                logger.debug('[AwakeningBridge] Browser open failed:', error);
            }
        }

        // Fallback to window.open (web)
        try {
            window.open(url, '_system');
            return true;
        } catch (error) {
            logger.debug('[AwakeningBridge] window.open failed:', error);
        }

        return false;
    },

    /**
     * Prompt user to install Awakening Protocol
     */
    promptInstallAwakening() {
        const confirmed = confirm(
            'Awakening Protocol no está instalado.\n\n' +
            '¿Deseas descargarlo desde Play Store?'
        );

        if (confirmed) {
            this.openPlayStore(this.AWAKENING_PACKAGE);
        }
    },

    /**
     * Open Play Store for app download
     */
    async openPlayStore(packageId) {
        // Try market:// first (opens Play Store app directly)
        const marketUrl = `market://details?id=${packageId}`;

        const opened = await this.openDeepLink(marketUrl);

        if (!opened) {
            // Fallback to web URL
            window.open(this.PLAY_STORE_URL + packageId, '_blank');
        }
    },

    /**
     * Open Frankenstein Lab (local navigation)
     */
    openFrankensteinLab() {
        // Navigate to lab section
        if (window.location.hash !== '#lab') {
            window.location.hash = 'lab';
        }

        // Trigger lab open event
        window.dispatchEvent(new CustomEvent('openFrankensteinLab'));
    },

    /**
     * Handle sync request from Awakening Protocol
     */
    handleSyncRequest(params) {
        logger.debug('[AwakeningBridge] Sync request:', params);

        // Get all local beings
        const beings = this.getSavedBeings();

        // Send response (in real implementation, this would use a backend)
        logger.debug('[AwakeningBridge] Syncing', beings.length, 'beings');

        this.showNotification(
            `Sincronización solicitada. ${beings.length} seres disponibles.`,
            'info'
        );
    },

    /**
     * Get saved beings from local storage
     */
    getSavedBeings() {
        try {
            const saved = localStorage.getItem('frankenstein_beings');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('[AwakeningBridge] Error loading beings:', error);
            return [];
        }
    },

    /**
     * Show notification to user
     */
    showNotification(message, type = 'info') {
        // Use app's notification system if available
        if (window.showToast) {
            window.showToast(message, type);
            return;
        }

        // Fallback to custom notification
        const notification = document.createElement('div');
        notification.className = `awakening-bridge-notification ${type}`;
        notification.innerHTML = `
            <span class="notification-icon">
                ${type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️'}
            </span>
            <span class="notification-message">${message}</span>
        `;

        // Add styles if not present
        if (!document.getElementById('awakening-bridge-styles')) {
            const styles = document.createElement('style');
            styles.id = 'awakening-bridge-styles';
            styles.textContent = `
                .awakening-bridge-notification {
                    position: fixed;
                    bottom: 80px;
                    left: 50%;
                    transform: translateX(-50%);
                    padding: 12px 20px;
                    border-radius: 12px;
                    background: rgba(30, 41, 59, 0.95);
                    color: white;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    z-index: 10000;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                    animation: slideUp 0.3s ease-out;
                    font-family: system-ui, sans-serif;
                    font-size: 14px;
                }
                .awakening-bridge-notification.success {
                    background: rgba(16, 185, 129, 0.95);
                }
                .awakening-bridge-notification.error {
                    background: rgba(239, 68, 68, 0.95);
                }
                .awakening-bridge-notification.warning {
                    background: rgba(245, 158, 11, 0.95);
                }
                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateX(-50%) translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(-50%) translateY(0);
                    }
                }
            `;
            document.head.appendChild(styles);
        }

        document.body.appendChild(notification);

        // Auto-remove after 4 seconds
        setTimeout(() => {
            notification.style.animation = 'slideUp 0.3s ease-out reverse';
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    },

    /**
     * Create UI button for sending being to Awakening
     */
    createSendToAwakeningButton(being, container) {
        const button = document.createElement('button');
        button.className = 'send-to-awakening-btn';
        button.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 5v14M5 12h14M19 12l-4-4M19 12l-4 4"/>
            </svg>
            Enviar a Awakening
        `;
        button.title = 'Enviar este ser a Awakening Protocol para usarlo en misiones';

        button.addEventListener('click', (e) => {
            e.stopPropagation();
            this.sendBeingToAwakening(being);
        });

        // Add button styles if not present
        if (!document.getElementById('send-awakening-btn-styles')) {
            const styles = document.createElement('style');
            styles.id = 'send-awakening-btn-styles';
            styles.textContent = `
                .send-to-awakening-btn {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 16px;
                    background: linear-gradient(135deg, #00D4FF, #0099CC);
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    box-shadow: 0 2px 8px rgba(0, 212, 255, 0.3);
                }
                .send-to-awakening-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0, 212, 255, 0.4);
                }
                .send-to-awakening-btn:active {
                    transform: translateY(0);
                }
                .send-to-awakening-btn svg {
                    flex-shrink: 0;
                }
            `;
            document.head.appendChild(styles);
        }

        if (container) {
            container.appendChild(button);
        }

        return button;
    },

    /**
     * Check if Awakening Protocol is installed (best effort)
     */
    async isAwakeningInstalled() {
        // This is a heuristic - we can't definitively know without trying
        try {
            if (window.Capacitor && window.Capacitor.Plugins.App) {
                const { App } = window.Capacitor.Plugins;
                // Try to check if the scheme can be handled
                // Note: This may not work on all platforms
                return true; // Assume installed, will fail gracefully if not
            }
        } catch (error) {
            logger.debug('[AwakeningBridge] Could not check app installation');
        }
        return true; // Optimistically assume installed
    }
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => AwakeningBridge.init());
} else {
    AwakeningBridge.init();
}

// Export for use in other modules
window.AwakeningBridge = AwakeningBridge;
