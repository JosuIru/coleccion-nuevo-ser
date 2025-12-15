/**
 * DeepLinkService - Handles deep links from Colección Nuevo Ser
 *
 * Supported URLs:
 * - awakeningprotocol://receive-being?data={base64_encoded_being}
 * - awakeningprotocol://open?screen={screenName}
 * - nuevosser://lab (outgoing - opens Frankenstein Lab)
 */

import { Linking, Alert, Platform } from 'react-native';
import { useGameStore } from '../stores/gameStore';

const COLECCION_DEEP_LINK = 'nuevosser://lab';
const AWAKENING_SCHEME = 'awakeningprotocol://';

class DeepLinkService {
    constructor() {
        this.initialized = false;
        this.navigationRef = null;
        this.pendingDeepLink = null;
    }

    /**
     * Initialize deep link handling
     * Call this in App.js after navigation is ready
     */
    async initialize(navigationRef) {
        if (this.initialized) return;

        this.navigationRef = navigationRef;
        this.initialized = true;

        // Handle initial URL (app opened via deep link)
        try {
            const initialUrl = await Linking.getInitialURL();
            if (initialUrl) {
                this.handleDeepLink(initialUrl);
            }
        } catch (error) {
            console.error('[DeepLinkService] Error getting initial URL:', error);
        }

        // Listen for incoming deep links while app is running
        Linking.addEventListener('url', ({ url }) => {
            this.handleDeepLink(url);
        });

        console.log('[DeepLinkService] Initialized');
    }

    /**
     * Parse and handle incoming deep link
     */
    handleDeepLink(url) {
        if (!url) return;

        console.log('[DeepLinkService] Received deep link:', url);

        try {
            // Parse URL
            const parsed = this.parseDeepLink(url);
            if (!parsed) {
                console.warn('[DeepLinkService] Invalid deep link format:', url);
                return;
            }

            const { action, params } = parsed;

            switch (action) {
                case 'receive-being':
                    this.handleReceiveBeing(params);
                    break;

                case 'open':
                    this.handleOpenScreen(params);
                    break;

                case 'sync':
                    this.handleSync(params);
                    break;

                default:
                    console.warn('[DeepLinkService] Unknown action:', action);
            }
        } catch (error) {
            console.error('[DeepLinkService] Error handling deep link:', error);
            Alert.alert(
                'Error',
                'No se pudo procesar el enlace. Por favor intenta de nuevo.'
            );
        }
    }

    /**
     * Parse deep link URL into action and params
     */
    parseDeepLink(url) {
        if (!url.startsWith(AWAKENING_SCHEME)) {
            return null;
        }

        const withoutScheme = url.replace(AWAKENING_SCHEME, '');
        const [pathPart, queryPart] = withoutScheme.split('?');

        const action = pathPart.split('/')[0];
        const params = {};

        if (queryPart) {
            queryPart.split('&').forEach(pair => {
                const [key, value] = pair.split('=');
                params[decodeURIComponent(key)] = decodeURIComponent(value || '');
            });
        }

        return { action, params };
    }

    /**
     * Handle receiving a being from Colección Nuevo Ser (Frankenstein Lab)
     */
    handleReceiveBeing(params) {
        const { data, name, id } = params;

        if (!data) {
            Alert.alert('Error', 'No se recibieron datos del ser.');
            return;
        }

        try {
            // Decode base64 being data
            const beingData = JSON.parse(atob(data));

            // Validate being structure
            if (!this.validateBeingData(beingData)) {
                Alert.alert('Error', 'Los datos del ser son inválidos.');
                return;
            }

            // Add being to game store
            const gameStore = useGameStore.getState();
            const newBeing = {
                id: beingData.id || `web_${Date.now()}`,
                name: beingData.name || name || 'Ser Importado',
                attributes: beingData.attributes || {},
                sourceApp: 'coleccion-nuevo-ser',
                webBeingId: beingData.id,
                importedAt: new Date().toISOString(),
                level: 1,
                experience: 0,
                synergy: beingData.synergy || 0,
                deployed: false
            };

            gameStore.addBeing(newBeing);

            // Show success feedback
            Alert.alert(
                '¡Ser Recibido!',
                `"${newBeing.name}" ha sido importado desde el Laboratorio Frankenstein.\n\nAhora puedes desplegarlo a resolver crisis.`,
                [
                    {
                        text: 'Ver Mis Seres',
                        onPress: () => this.navigateToScreen('BeingsScreen')
                    },
                    { text: 'Continuar', style: 'cancel' }
                ]
            );

            console.log('[DeepLinkService] Being imported successfully:', newBeing.id);
        } catch (error) {
            console.error('[DeepLinkService] Error parsing being data:', error);
            Alert.alert('Error', 'No se pudo importar el ser. Formato de datos inválido.');
        }
    }

    /**
     * Validate being data structure
     */
    validateBeingData(data) {
        if (!data || typeof data !== 'object') return false;

        // Must have at least name or id
        if (!data.name && !data.id) return false;

        // Attributes should be object if present
        if (data.attributes && typeof data.attributes !== 'object') return false;

        return true;
    }

    /**
     * Handle navigation to specific screen
     */
    handleOpenScreen(params) {
        const { screen, ...screenParams } = params;

        if (screen) {
            this.navigateToScreen(screen, screenParams);
        }
    }

    /**
     * Handle sync request
     */
    async handleSync(params) {
        const { SyncService } = require('./SyncService');

        Alert.alert(
            'Sincronización',
            '¿Deseas sincronizar con Colección Nuevo Ser?',
            [
                {
                    text: 'Sincronizar',
                    onPress: async () => {
                        try {
                            await SyncService.syncFromWeb();
                            Alert.alert('Éxito', 'Sincronización completada.');
                        } catch (error) {
                            Alert.alert('Error', 'No se pudo sincronizar.');
                        }
                    }
                },
                { text: 'Cancelar', style: 'cancel' }
            ]
        );
    }

    /**
     * Navigate to a screen
     */
    navigateToScreen(screenName, params = {}) {
        if (this.navigationRef?.current) {
            this.navigationRef.current.navigate(screenName, params);
        } else {
            // Store for later if navigation not ready
            this.pendingDeepLink = { screen: screenName, params };
        }
    }

    /**
     * Process pending deep link (call when navigation is ready)
     */
    processPendingDeepLink() {
        if (this.pendingDeepLink && this.navigationRef?.current) {
            const { screen, params } = this.pendingDeepLink;
            this.navigationRef.current.navigate(screen, params);
            this.pendingDeepLink = null;
        }
    }

    /**
     * Open Colección Nuevo Ser app at Frankenstein Lab
     */
    async openFrankensteinLab() {
        try {
            const canOpen = await Linking.canOpenURL(COLECCION_DEEP_LINK);

            if (canOpen) {
                await Linking.openURL(COLECCION_DEEP_LINK);
                return true;
            } else {
                Alert.alert(
                    'App No Instalada',
                    'Colección Nuevo Ser no está instalada. ¿Deseas descargarla?',
                    [
                        {
                            text: 'Descargar',
                            onPress: () => this.openPlayStore('com.nuevosser.coleccion')
                        },
                        { text: 'Cancelar', style: 'cancel' }
                    ]
                );
                return false;
            }
        } catch (error) {
            console.error('[DeepLinkService] Error opening Frankenstein Lab:', error);
            return false;
        }
    }

    /**
     * Send a being to Colección Nuevo Ser
     */
    async sendBeingToColeccion(being) {
        try {
            const beingData = btoa(JSON.stringify({
                id: being.id,
                name: being.name,
                attributes: being.attributes,
                sourceApp: 'awakening-protocol',
                createdAt: being.createdAt || new Date().toISOString()
            }));

            const url = `nuevosser://receive-being?data=${encodeURIComponent(beingData)}`;

            const canOpen = await Linking.canOpenURL('nuevosser://');

            if (canOpen) {
                await Linking.openURL(url);
                return true;
            } else {
                Alert.alert(
                    'App No Instalada',
                    'Colección Nuevo Ser no está instalada.'
                );
                return false;
            }
        } catch (error) {
            console.error('[DeepLinkService] Error sending being:', error);
            return false;
        }
    }

    /**
     * Open Play Store for app download
     */
    openPlayStore(packageName) {
        const url = Platform.select({
            android: `market://details?id=${packageName}`,
            ios: `itms-apps://apps.apple.com/app/${packageName}`
        });

        Linking.openURL(url).catch(() => {
            // Fallback to web URL
            Linking.openURL(`https://play.google.com/store/apps/details?id=${packageName}`);
        });
    }

    /**
     * Generate deep link URL for sharing
     */
    generateShareLink(action, params = {}) {
        const queryString = Object.entries(params)
            .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
            .join('&');

        return `${AWAKENING_SCHEME}${action}${queryString ? '?' + queryString : ''}`;
    }
}

// Singleton instance
export const deepLinkService = new DeepLinkService();
export default deepLinkService;
