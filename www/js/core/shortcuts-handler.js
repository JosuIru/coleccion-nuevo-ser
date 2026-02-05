/**
// 🔧 FIX v2.9.284: Migrated all console.* to logger
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
        this._timers = [];
        this._intervals = [];
        this._appUrlOpenListener = null;
        this.init();
    }

    /**
     * setTimeout wrapper con tracking para cleanup
     */
    _trackTimeout(fn, delay) {
        const id = setTimeout(() => {
            this._timers = this._timers.filter(t => t !== id);
            fn();
        }, delay);
        this._timers.push(id);
        return id;
    }

    /**
     * setInterval wrapper con tracking para cleanup
     */
    _trackInterval(fn, delay) {
        const id = setInterval(fn, delay);
        this._intervals.push(id);
        return id;
    }

    /**
     * Limpia todos los timers, intervals y event listeners
     */
    destroy() {
        this._timers.forEach(id => clearTimeout(id));
        this._intervals.forEach(id => clearInterval(id));
        this._timers = [];
        this._intervals = [];

        if (this._appUrlOpenListener && window.Capacitor?.Plugins?.App) {
            this._appUrlOpenListener.remove?.();
            this._appUrlOpenListener = null;
        }

        if (window.shortcutsHandler === this) {
            window.shortcutsHandler = null;
        }

        logger.log('[ShortcutsHandler] Destroyed');
    }

    async init() {
        logger.log('[ShortcutsHandler] Initializing... isCapacitor:', this.isCapacitor);

        if (this.isCapacitor) {
            // Detectar deep link inicial (al abrir la app)
            await this.checkInitialDeepLink();

            // Setup listener para deep links mientras la app está abierta
            this.setupDeepLinkListener();
        }

        // Exponer globalmente
        window.shortcutsHandler = this;
        logger.log('[ShortcutsHandler] Ready');
    }

    /**
     * Verifica si la app fue abierta con un deep link
     */
    async checkInitialDeepLink() {
        try {
            if (window.Capacitor?.Plugins?.App) {
                const { App } = window.Capacitor.Plugins;
                const launchUrl = await App.getLaunchUrl();

                if (launchUrl && launchUrl.url) {
                    this.pendingDeepLink = launchUrl.url;
                    this._trackTimeout(() => this.handleDeepLink(launchUrl.url), 1000);
                }
            }
        } catch (error) {
            logger.warn('[ShortcutsHandler] Error checking initial deep link:', error);
        }
    }

    /**
     * Configura listener para deep links recibidos mientras la app está abierta
     */
    setupDeepLinkListener() {
        if (window.Capacitor?.Plugins?.App) {
            const { App } = window.Capacitor.Plugins;

            this._appUrlOpenListener = App.addListener('appUrlOpen', (data) => {
                logger.log('[ShortcutsHandler] Deep link received');
                this.handleDeepLink(data.url);
            });
        }
    }

    /**
     * Procesa el deep link y ejecuta la acción correspondiente
     * @param {string} url - URL del deep link (ej: nuevosser://continue-reading)
     */
    handleDeepLink(url) {
        if (!url) return;

        // DEBUG: Ver qué URL llega
        logger.log('[ShortcutsHandler] handleDeepLink called with:', url);

        // Manejar OAuth callback (com.nuevosser.coleccion://auth/callback#access_token=...)
        if (url.includes('com.nuevosser.coleccion://auth/callback') ||
            url.includes('auth/callback#access_token') ||
            url.includes('auth/callback')) {
            this.handleOAuthCallback(url);
            return;
        }

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

        // logger.debug('[ShortcutsHandler] Handling action:', action);

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
                // logger.warn('[ShortcutsHandler] Unknown action:', action);
                this.showLibrary(); // Fallback a biblioteca
                break;
        }
    }

    /**
     * Maneja el callback de OAuth (Google login)
     * @param {string} url - URL con tokens (com.nuevosser.coleccion://auth/callback#access_token=...)
     */
    async handleOAuthCallback(url) {
        logger.log('[ShortcutsHandler] OAuth callback received');

        try {
            // Extraer el hash fragment con los tokens
            const hashIndex = url.indexOf('#');
            if (hashIndex === -1) {
                logger.warn('[ShortcutsHandler] No hash fragment in OAuth callback');
                return;
            }

            const hashFragment = url.substring(hashIndex + 1);
            const params = new URLSearchParams(hashFragment);

            const accessToken = params.get('access_token');
            const refreshToken = params.get('refresh_token');

            if (!accessToken) {
                logger.error('[ShortcutsHandler] No access_token in OAuth callback');
                window.toast?.error('Error en autenticación: token no recibido');
                return;
            }

            // Establecer la sesión en Supabase
            const supabase = window.supabaseClient || window.supabase;

            if (supabase) {
                const { data, error } = await supabase.auth.setSession({
                    access_token: accessToken,
                    refresh_token: refreshToken
                });

                if (error) {
                    logger.error('[ShortcutsHandler] Error setting session:', error);
                    window.toast?.error('Error al establecer sesión');
                    return;
                }

                logger.log('[ShortcutsHandler] Session established for:', data?.user?.email);

                // Cerrar TODOS los modales abiertos
                document.querySelectorAll('.modal, .modal-overlay, [id*="modal"]').forEach(el => {
                    el.style.display = 'none';
                    el.remove();
                });

                // Cerrar my-account-modal si está abierto
                if (window.myAccountModal) {
                    window.myAccountModal.close?.();
                }

                // Cerrar auth modal
                if (window.authModal) {
                    window.authModal.closeAllModals?.();
                }

                // Recargar la página para mostrar estado logueado
                // (el mensaje de bienvenida lo muestra auth-modal automáticamente)
                this._trackTimeout(() => {
                    window.location.reload();
                }, 500);
            }
        } catch (error) {
            logger.error('[ShortcutsHandler] Error handling OAuth callback:', error);
            window.toast?.error('Error procesando autenticación');
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
            logger.error('[ShortcutsHandler] Error opening book:', error);
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
                // logger.debug('[ShortcutsHandler] Opening last book:', data);

                // Verificar que exista la función global openBook
                if (typeof window.openBook === 'function') {
                    window.openBook(data.bookId, data.chapter || 0);
                } else {
                    // Fallback: navegar manualmente
                    const url = `/?book=${data.bookId}&chapter=${data.chapter || 0}`;
                    window.location.href = url;
                }
            } else {
                // logger.debug('[ShortcutsHandler] No last book found, showing library');
                this.showLibrary();
            }
        } catch (error) {
            logger.error('[ShortcutsHandler] Error opening last book:', error);
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
                this._trackTimeout(() => {
                    window.koansModal.show();
                    // logger.debug('[ShortcutsHandler] Koan modal shown');
                }, 500);
            } else {
                // logger.warn('[ShortcutsHandler] Koans modal not available');
                this.showLibrary();
            }
        } catch (error) {
            logger.error('[ShortcutsHandler] Error showing koan:', error);
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
                this._trackTimeout(() => {
                    window.progressDashboard.show();
                    // logger.debug('[ShortcutsHandler] Progress dashboard shown');
                }, 500);
            } else {
                // logger.warn('[ShortcutsHandler] Progress dashboard not available');
                this.showLibrary();
            }
        } catch (error) {
            logger.error('[ShortcutsHandler] Error showing progress:', error);
            this.showLibrary();
        }
    }

    /**
     * Navega a la biblioteca (pantalla principal)
     */
    showLibrary() {
        // logger.debug('[ShortcutsHandler] Navigating to library');

        // Si ya estamos en la biblioteca, no hacer nada
        if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
            // logger.debug('[ShortcutsHandler] Already in library');
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
            this._trackTimeout(() => this.showDailyKoan(), 1000);
        }

        // Verificar si hay que mostrar el progreso
        if (sessionStorage.getItem('show-progress-on-load') === 'true') {
            sessionStorage.removeItem('show-progress-on-load');
            this._trackTimeout(() => this.showProgressDashboard(), 1000);
        }
    }
}

// Auto-inicialización
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        const handler = new ShortcutsHandler();

        // Verificar acciones pendientes después de que todo esté cargado
        handler._trackTimeout(() => handler.checkPendingActions(), 2000);
    });
} else {
    const handler = new ShortcutsHandler();
    handler._trackTimeout(() => handler.checkPendingActions(), 2000);
}
