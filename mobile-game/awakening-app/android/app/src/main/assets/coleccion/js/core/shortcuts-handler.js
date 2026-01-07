/**
 * ShortcutsHandler - Manejo de deep links desde Android Shortcuts y Quick Settings Tile
 *
 * Detecta cuando la app es abierta desde:
 * - Android App Shortcuts (long-press en el ícono)
 * - Quick Settings Tile
 * - URLs personalizadas (nuevosser://)
 *
 * Y navega automáticamente a la funcionalidad solicitada.
 */
class ShortcutsHandler {
    constructor() {
        this.isCapacitor = typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform();
        this.pendingDeepLink = null;
        this.init();
    }

    async init() {
        // console.log('[ShortcutsHandler] Initializing...');

        if (this.isCapacitor) {
            // Detectar deep link inicial (al abrir la app)
            await this.checkInitialDeepLink();

            // Setup listener para deep links mientras la app está abierta
            this.setupDeepLinkListener();
        }

        // Exponer globalmente
        window.shortcutsHandler = this;
        // console.log('[ShortcutsHandler] Ready');
    }

    /**
     * Verifica si la app fue abierta con un deep link
     */
    async checkInitialDeepLink() {
        try {
            if (window.Capacitor?.Plugins?.App) {
                const { App } = window.Capacitor.Plugins;

                // Obtener URL de lanzamiento
                const launchUrl = await App.getLaunchUrl();

                if (launchUrl && launchUrl.url) {
                    // console.log('[ShortcutsHandler] App launched with URL:', launchUrl.url);
                    this.pendingDeepLink = launchUrl.url;

                    // Esperar a que la app esté lista antes de procesar
                    setTimeout(() => this.handleDeepLink(launchUrl.url), 1000);
                }
            }
        } catch (error) {
            // console.warn('[ShortcutsHandler] Error checking initial deep link:', error);
        }
    }

    /**
     * Configura listener para deep links recibidos mientras la app está abierta
     */
    setupDeepLinkListener() {
        if (window.Capacitor?.Plugins?.App) {
            const { App } = window.Capacitor.Plugins;

            App.addListener('appUrlOpen', (data) => {
                // console.log('[ShortcutsHandler] Deep link received:', data.url);
                this.handleDeepLink(data.url);
            });

            // console.log('[ShortcutsHandler] Deep link listener registered');
        }
    }

    /**
     * Procesa el deep link y ejecuta la acción correspondiente
     * @param {string} url - URL del deep link (ej: nuevosser://continue-reading)
     */
    handleDeepLink(url) {
        if (!url) return;

        // Extraer la acción del deep link
        // Formato: nuevosser://action
        const withoutScheme = url.replace(/^nuevosser:\/\//, '');
        const [pathPart, queryPart] = withoutScheme.split('?');
        const action = pathPart;
        const params = this.parseQueryString(queryPart);

        if (action.startsWith('book/')) {
            const bookId = action.split('/')[1];
            this.openBookById(bookId, params.chapter);
            return;
        }

        // console.log('[ShortcutsHandler] Handling action:', action);

        switch (action) {
            case 'continue-reading':
                this.openLastBook();
                break;

            case 'daily-koan':
                this.showDailyKoan();
                break;

            case 'progress':
                this.showProgressDashboard();
                break;

            case 'library':
                this.showLibrary();
                break;

            default:
                // console.warn('[ShortcutsHandler] Unknown action:', action);
                this.showLibrary(); // Fallback a biblioteca
                break;
        }
    }

    parseQueryString(queryString) {
        if (!queryString) return {};

        const params = {};
        queryString.split('&').forEach(pair => {
            const [key, value] = pair.split('=');
            params[decodeURIComponent(key)] = decodeURIComponent(value || '');
        });
        return params;
    }

    openBookById(bookId, chapterId) {
        try {
            if (!bookId) {
                this.showLibrary();
                return;
            }

            if (typeof window.openBook === 'function') {
                window.openBook(bookId, chapterId || 0);
            } else {
                const chapterQuery = chapterId ? `&chapter=${encodeURIComponent(chapterId)}` : '';
                const url = `/?book=${encodeURIComponent(bookId)}${chapterQuery}`;
                window.location.href = url;
            }
        } catch (error) {
            console.error('[ShortcutsHandler] Error opening book:', error);
            this.showLibrary();
        }
    }

    /**
     * Abre el último libro leído en el último capítulo
     */
    openLastBook() {
        try {
            const lastBookData = localStorage.getItem('last-book-read');

            if (lastBookData) {
                const data = JSON.parse(lastBookData);
                // console.log('[ShortcutsHandler] Opening last book:', data);

                // Verificar que exista la función global openBook
                if (typeof window.openBook === 'function') {
                    window.openBook(data.bookId, data.chapter || 0);
                } else {
                    // Fallback: navegar manualmente
                    const url = `reader.html?book=${data.bookId}&chapter=${data.chapter || 0}`;
                    window.location.href = url;
                }
            } else {
                // console.log('[ShortcutsHandler] No last book found, showing library');
                this.showLibrary();
            }
        } catch (error) {
            console.error('[ShortcutsHandler] Error opening last book:', error);
            this.showLibrary();
        }
    }

    /**
     * Muestra el modal de Koan del día
     */
    showDailyKoan() {
        try {
            // Primero asegurar que estamos en la biblioteca
            if (!window.location.pathname.includes('index.html') && window.location.pathname !== '/') {
                window.location.href = '/';
                // Guardar para mostrar después de navegar
                sessionStorage.setItem('show-koan-on-load', 'true');
                return;
            }

            // Mostrar modal de koans si existe
            if (window.koansModal && typeof window.koansModal.show === 'function') {
                setTimeout(() => {
                    window.koansModal.show();
                    // console.log('[ShortcutsHandler] Koan modal shown');
                }, 500);
            } else {
                // console.warn('[ShortcutsHandler] Koans modal not available');
                this.showLibrary();
            }
        } catch (error) {
            console.error('[ShortcutsHandler] Error showing koan:', error);
            this.showLibrary();
        }
    }

    /**
     * Muestra el dashboard de progreso
     */
    showProgressDashboard() {
        try {
            // Asegurar que estamos en la biblioteca
            if (!window.location.pathname.includes('index.html') && window.location.pathname !== '/') {
                window.location.href = '/';
                sessionStorage.setItem('show-progress-on-load', 'true');
                return;
            }

            // Mostrar dashboard de progreso si existe
            if (window.progressDashboard && typeof window.progressDashboard.show === 'function') {
                setTimeout(() => {
                    window.progressDashboard.show();
                    // console.log('[ShortcutsHandler] Progress dashboard shown');
                }, 500);
            } else {
                // console.warn('[ShortcutsHandler] Progress dashboard not available');
                this.showLibrary();
            }
        } catch (error) {
            console.error('[ShortcutsHandler] Error showing progress:', error);
            this.showLibrary();
        }
    }

    /**
     * Navega a la biblioteca (pantalla principal)
     */
    showLibrary() {
        // console.log('[ShortcutsHandler] Navigating to library');

        // Si ya estamos en la biblioteca, no hacer nada
        if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
            // console.log('[ShortcutsHandler] Already in library');
            return;
        }

        // Navegar a la biblioteca
        window.location.href = '/';
    }

    /**
     * Verifica si hay acciones pendientes al cargar la página
     * (Útil cuando se navega de reader → biblioteca para mostrar un modal)
     */
    checkPendingActions() {
        // Verificar si hay que mostrar el koan
        if (sessionStorage.getItem('show-koan-on-load') === 'true') {
            sessionStorage.removeItem('show-koan-on-load');
            setTimeout(() => this.showDailyKoan(), 1000);
        }

        // Verificar si hay que mostrar el progreso
        if (sessionStorage.getItem('show-progress-on-load') === 'true') {
            sessionStorage.removeItem('show-progress-on-load');
            setTimeout(() => this.showProgressDashboard(), 1000);
        }
    }
}

// Auto-inicialización
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        const handler = new ShortcutsHandler();

        // Verificar acciones pendientes después de que todo esté cargado
        setTimeout(() => handler.checkPendingActions(), 2000);
    });
} else {
    const handler = new ShortcutsHandler();
    setTimeout(() => handler.checkPendingActions(), 2000);
}
