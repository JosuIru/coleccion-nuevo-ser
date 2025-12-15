/**
 * Supabase Authentication Helper
 * Maneja autenticación de usuarios con Supabase
 */

class SupabaseAuthHelper {
    constructor() {
        this.supabase = null;
        this.user = null;
        this.session = null;
        this.initialized = false;
        this.authCallbacks = [];
    }

    /**
     * Inicializa Supabase client
     */
    async init() {
        if (this.initialized) return;

        try {
            // Verificar que la configuración existe
            if (!window.supabaseConfig || !window.supabase) {
                console.error('Supabase config o library no disponible');
                return;
            }

            const { createClient } = window.supabase;
            const config = window.supabaseConfig;

            // Crear cliente Supabase
            this.supabase = createClient(config.url, config.anonKey, {
                auth: config.auth
            });

            // Restaurar sesión si existe
            const { data: { session } } = await this.supabase.auth.getSession();
            if (session) {
                this.session = session;
                this.user = session.user;
                // console.log('✓ Sesión restaurada:', this.user.email);
            }

            // Listener para cambios de autenticación
            this.supabase.auth.onAuthStateChange((event, session) => {
                // console.log('Auth state changed:', event);
                this.session = session;
                this.user = session?.user || null;

                // Notificar a callbacks registrados
                this.authCallbacks.forEach(callback => callback(event, session));

                // Actualizar UI si existe
                if (window.settingsModal) {
                    window.settingsModal.updateContent?.();
                }
            });

            this.initialized = true;
            // console.log('✓ Supabase Auth inicializado');

        } catch (error) {
            console.error('Error inicializando Supabase Auth:', error);
        }
    }

    /**
     * Registrar callback para cambios de autenticación
     */
    onAuthStateChange(callback) {
        this.authCallbacks.push(callback);
    }

    /**
     * Registro con email y contraseña
     */
    async signUp(email, password, metadata = {}) {
        try {
            const { data, error } = await this.supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        display_name: metadata.displayName || email.split('@')[0],
                        ...metadata
                    }
                }
            });

            if (error) throw error;

            // Crear perfil en tabla profiles
            if (data.user) {
                await this.createUserProfile(data.user);
            }

            window.toast?.success('Cuenta creada. Verifica tu email.');
            return { data, error: null };

        } catch (error) {
            console.error('Error en signUp:', error);

            // Mensaje de error más descriptivo
            let errorMessage = 'Error al crear cuenta';
            if (error.message.includes('User already registered')) {
                errorMessage = '⚠️ Este email ya está registrado. Intenta iniciar sesión o recuperar tu contraseña.';
            } else if (error.message.includes('Password should be at least')) {
                errorMessage = '🔒 La contraseña debe tener al menos 6 caracteres';
            } else if (error.message.includes('Unable to validate email')) {
                errorMessage = '📧 Email inválido. Verifica el formato.';
            } else if (error.message.includes('Email rate limit exceeded')) {
                errorMessage = '⏳ Demasiados intentos. Espera unos minutos.';
            } else {
                errorMessage = error.message || errorMessage;
            }

            window.toast?.error(errorMessage);
            return { data: null, error };
        }
    }

    /**
     * Login con email y contraseña
     */
    async signIn(email, password) {
        try {
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;

            window.toast?.success(`Bienvenido ${data.user.email}`);
            return { data, error: null };

        } catch (error) {
            console.error('Error en signIn:', error);

            // Mensaje de error más descriptivo
            let errorMessage = 'Error al iniciar sesión';
            if (error.message.includes('Email not confirmed')) {
                errorMessage = '⚠️ Por favor confirma tu email antes de iniciar sesión. Revisa tu bandeja de entrada.';
            } else if (error.message.includes('Invalid login credentials')) {
                errorMessage = '❌ Email o contraseña incorrectos';
            } else if (error.message.includes('Email rate limit exceeded')) {
                errorMessage = '⏳ Demasiados intentos. Espera unos minutos.';
            } else {
                errorMessage = error.message || errorMessage;
            }

            window.toast?.error(errorMessage);
            return { data: null, error };
        }
    }

    /**
     * Login anónimo
     */
    async signInAnonymously() {
        try {
            const { data, error } = await this.supabase.auth.signInAnonymously();

            if (error) throw error;

            window.toast?.info('Sesión anónima iniciada');
            return { data, error: null };

        } catch (error) {
            console.error('Error en signInAnonymously:', error);
            window.toast?.error('Error al iniciar sesión anónima');
            return { data: null, error };
        }
    }

    /**
     * Cerrar sesión
     */
    async signOut() {
        try {
            const { error } = await this.supabase.auth.signOut();

            if (error) throw error;

            this.user = null;
            this.session = null;

            window.toast?.info('Sesión cerrada');
            return { error: null };

        } catch (error) {
            console.error('Error en signOut:', error);
            window.toast?.error('Error al cerrar sesión');
            return { error };
        }
    }

    /**
     * Recuperar contraseña
     */
    async resetPassword(email) {
        try {
            const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin
            });

            if (error) throw error;

            window.toast?.success('Email de recuperación enviado');
            return { error: null };

        } catch (error) {
            console.error('Error en resetPassword:', error);
            window.toast?.error('Error al enviar email');
            return { error };
        }
    }

    /**
     * Actualizar contraseña
     */
    async updatePassword(newPassword) {
        try {
            const { error } = await this.supabase.auth.updateUser({
                password: newPassword
            });

            if (error) throw error;

            window.toast?.success('Contraseña actualizada');
            return { error: null };

        } catch (error) {
            console.error('Error en updatePassword:', error);
            window.toast?.error('Error al actualizar contraseña');
            return { error };
        }
    }

    /**
     * Eliminar cuenta
     */
    async deleteAccount() {
        if (!this.user) {
            window.toast?.error('No hay usuario autenticado');
            return { error: new Error('No user') };
        }

        // Confirmar antes de eliminar
        const confirmed = confirm('¿Estás seguro de que quieres eliminar tu cuenta? Esta acción no se puede deshacer.');
        if (!confirmed) {
            return { error: new Error('Cancelled') };
        }

        try {
            const userId = this.user.id;

            // Eliminar todos los datos del usuario (las tablas tienen ON DELETE CASCADE)
            await this.deleteAllUserData();

            // Cerrar sesión (esto también desvincula al usuario)
            await this.supabase.auth.signOut();

            this.user = null;
            this.session = null;

            window.toast?.success('Cuenta y datos eliminados correctamente');

            // Recargar página para limpiar estado
            setTimeout(() => {
                window.location.href = '/';
            }, 1500);

            return { error: null };

        } catch (error) {
            console.error('Error en deleteAccount:', error);

            let errorMessage = 'Error al eliminar cuenta';
            if (error.message) {
                errorMessage = error.message;
            }

            window.toast?.error(errorMessage);
            return { error };
        }
    }

    /**
     * Crear perfil de usuario
     */
    async createUserProfile(user) {
        try {
            const { error } = await this.supabase
                .from(window.supabaseConfig.tables.profiles)
                .insert({
                    id: user.id,
                    email: user.email,
                    display_name: user.user_metadata?.display_name || user.email.split('@')[0],
                    created_at: new Date().toISOString(),
                });

            if (error) throw error;

        } catch (error) {
            console.error('Error creando perfil:', error);
        }
    }

    /**
     * Eliminar todos los datos del usuario
     */
    async deleteAllUserData() {
        if (!this.user) return;

        const tables = Object.values(window.supabaseConfig.tables);
        const promises = tables.map(table =>
            this.supabase.from(table).delete().eq('user_id', this.user.id)
        );

        await Promise.allSettled(promises);
    }

    /**
     * Obtener usuario actual
     */
    getCurrentUser() {
        return this.user;
    }

    /**
     * Verificar si usuario está autenticado
     */
    isAuthenticated() {
        return !!this.user;
    }

    /**
     * Obtener sesión actual
     */
    getSession() {
        return this.session;
    }

    /**
     * Renderizar panel de settings para Account tab
     */
    renderSettingsPanel() {
        if (!this.isAuthenticated()) {
            return `
                <div class="space-y-4">
                    <p class="text-gray-400">Inicia sesión para sincronizar tus datos en la nube</p>

                    <div class="flex flex-col gap-3">
                        <button id="supabase-show-login" class="btn-primary">
                            Iniciar Sesión
                        </button>
                        <button id="supabase-show-signup" class="btn-secondary">
                            Crear Cuenta
                        </button>
                        <button id="supabase-signin-anonymous" class="btn-secondary text-sm">
                            Continuar sin cuenta
                        </button>
                    </div>
                </div>
            `;
        }

        return `
            <div class="space-y-4">
                <div class="bg-slate-700 rounded-lg p-4">
                    <p class="text-sm text-gray-400 mb-2">Email</p>
                    <p class="text-white font-medium">${this.user.email}</p>
                </div>

                <div class="bg-slate-700 rounded-lg p-4">
                    <p class="text-sm text-gray-400 mb-2">ID de Usuario</p>
                    <p class="text-xs text-gray-300 font-mono">${this.user.id}</p>
                </div>

                <div class="flex flex-col gap-2">
                    <button id="supabase-change-password" class="btn-secondary">
                        Cambiar Contraseña
                    </button>
                    <button id="supabase-signout" class="btn-secondary">
                        Cerrar Sesión
                    </button>
                    <button id="supabase-delete-account" class="btn-danger text-sm">
                        Eliminar Cuenta
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Adjuntar event listeners para el panel de settings
     */
    attachSettingsListeners() {
        // Mostrar login
        document.getElementById('supabase-show-login')?.addEventListener('click', () => {
            this.showLoginModal();
        });

        // Mostrar signup
        document.getElementById('supabase-show-signup')?.addEventListener('click', () => {
            this.showSignupModal();
        });

        // Signin anónimo
        document.getElementById('supabase-signin-anonymous')?.addEventListener('click', async () => {
            await this.signInAnonymously();
        });

        // Cambiar contraseña
        document.getElementById('supabase-change-password')?.addEventListener('click', () => {
            this.showChangePasswordModal();
        });

        // Cerrar sesión
        document.getElementById('supabase-signout')?.addEventListener('click', async () => {
            const confirmed = confirm('¿Cerrar sesión?');
            if (confirmed) {
                await this.signOut();

                // Actualizar el modal de settings si está abierto
                if (window.settingsModalInstance) {
                    window.settingsModalInstance.updateContent();
                }
            }
        });

        // Eliminar cuenta
        document.getElementById('supabase-delete-account')?.addEventListener('click', async () => {
            const confirmed = confirm(
                '⚠️ ADVERTENCIA: Esto eliminará permanentemente tu cuenta y todos tus datos. ¿Estás seguro?'
            );
            if (confirmed) {
                const doubleConfirm = prompt('Escribe "ELIMINAR" para confirmar:');
                if (doubleConfirm === 'ELIMINAR') {
                    await this.deleteAccount();
                }
            }
        });
    }

    /**
     * Mostrar modal de login
     */
    showLoginModal() {
        const modal = `
            <div id="supabase-login-modal" class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                <div class="bg-slate-800 rounded-xl p-6 max-w-md w-full">
                    <h2 class="text-xl font-bold mb-4">Iniciar Sesión</h2>
                    <form id="supabase-login-form" class="space-y-4">
                        <div>
                            <label class="block text-sm text-gray-400 mb-2">Email</label>
                            <input type="email" id="login-email" required
                                   class="w-full bg-slate-700 rounded-lg px-4 py-2 text-white">
                        </div>
                        <div>
                            <label class="block text-sm text-gray-400 mb-2">Contraseña</label>
                            <input type="password" id="login-password" required
                                   class="w-full bg-slate-700 rounded-lg px-4 py-2 text-white">
                        </div>
                        <div class="flex gap-3">
                            <button type="submit" class="btn-primary flex-1">Entrar</button>
                            <button type="button" id="cancel-login" class="btn-secondary flex-1">Cancelar</button>
                        </div>
                        <button type="button" id="forgot-password" class="text-sm text-blue-400 hover:underline">
                            ¿Olvidaste tu contraseña?
                        </button>
                    </form>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modal);

        document.getElementById('supabase-login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            const result = await this.signIn(email, password);
            if (!result.error) {
                document.getElementById('supabase-login-modal').remove();

                // Actualizar el modal de settings si está abierto
                if (window.settingsModalInstance) {
                    window.settingsModalInstance.updateContent();
                }
            }
        });

        document.getElementById('cancel-login').addEventListener('click', () => {
            document.getElementById('supabase-login-modal').remove();
        });

        document.getElementById('forgot-password').addEventListener('click', () => {
            document.getElementById('supabase-login-modal').remove();
            this.showForgotPasswordModal();
        });
    }

    /**
     * Mostrar modal de signup
     */
    showSignupModal() {
        const modal = `
            <div id="supabase-signup-modal" class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                <div class="bg-slate-800 rounded-xl p-6 max-w-md w-full">
                    <h2 class="text-xl font-bold mb-4">Crear Cuenta</h2>
                    <form id="supabase-signup-form" class="space-y-4">
                        <div>
                            <label class="block text-sm text-gray-400 mb-2">Email</label>
                            <input type="email" id="signup-email" required
                                   class="w-full bg-slate-700 rounded-lg px-4 py-2 text-white">
                        </div>
                        <div>
                            <label class="block text-sm text-gray-400 mb-2">Contraseña (mínimo 6 caracteres)</label>
                            <input type="password" id="signup-password" required minlength="6"
                                   class="w-full bg-slate-700 rounded-lg px-4 py-2 text-white">
                        </div>
                        <div>
                            <label class="block text-sm text-gray-400 mb-2">Confirmar Contraseña</label>
                            <input type="password" id="signup-password-confirm" required
                                   class="w-full bg-slate-700 rounded-lg px-4 py-2 text-white">
                        </div>
                        <!-- Custom CAPTCHA -->
                        <div id="recaptcha-signup"></div>
                        <div class="flex gap-3">
                            <button type="submit" class="btn-primary flex-1">Crear Cuenta</button>
                            <button type="button" id="cancel-signup" class="btn-secondary flex-1">Cancelar</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modal);

        // Initialize Custom CAPTCHA
        this.signupCaptcha = new window.CustomCaptcha('recaptcha-signup');
        this.signupCaptcha.render();

        document.getElementById('supabase-signup-form').addEventListener('submit', async (e) => {
            e.preventDefault();

            // Check CAPTCHA verification first
            if (!this.signupCaptcha || !this.signupCaptcha.isVerified()) {
                window.toast?.error('Por favor completa la verificación de seguridad');
                return;
            }

            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;
            const confirmPassword = document.getElementById('signup-password-confirm').value;

            if (password !== confirmPassword) {
                window.toast?.error('Las contraseñas no coinciden');
                return;
            }

            const result = await this.signUp(email, password);
            if (!result.error) {
                document.getElementById('supabase-signup-modal').remove();

                // Actualizar el modal de settings si está abierto
                if (window.settingsModalInstance) {
                    window.settingsModalInstance.updateContent();
                }
            }
        });

        document.getElementById('cancel-signup').addEventListener('click', () => {
            document.getElementById('supabase-signup-modal').remove();
        });
    }

    /**
     * Mostrar modal de recuperar contraseña
     */
    showForgotPasswordModal() {
        const modal = `
            <div id="supabase-forgot-modal" class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                <div class="bg-slate-800 rounded-xl p-6 max-w-md w-full">
                    <h2 class="text-xl font-bold mb-4">Recuperar Contraseña</h2>
                    <form id="supabase-forgot-form" class="space-y-4">
                        <div>
                            <label class="block text-sm text-gray-400 mb-2">Email</label>
                            <input type="email" id="forgot-email" required
                                   class="w-full bg-slate-700 rounded-lg px-4 py-2 text-white">
                        </div>
                        <div class="flex gap-3">
                            <button type="submit" class="btn-primary flex-1">Enviar</button>
                            <button type="button" id="cancel-forgot" class="btn-secondary flex-1">Cancelar</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modal);

        document.getElementById('supabase-forgot-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('forgot-email').value;
            const result = await this.resetPassword(email);
            if (!result.error) {
                document.getElementById('supabase-forgot-modal').remove();
            }
        });

        document.getElementById('cancel-forgot').addEventListener('click', () => {
            document.getElementById('supabase-forgot-modal').remove();
        });
    }

    /**
     * Mostrar modal de cambiar contraseña
     */
    showChangePasswordModal() {
        const modal = `
            <div id="supabase-change-password-modal" class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                <div class="bg-slate-800 rounded-xl p-6 max-w-md w-full">
                    <h2 class="text-xl font-bold mb-4">Cambiar Contraseña</h2>
                    <form id="supabase-change-password-form" class="space-y-4">
                        <div>
                            <label class="block text-sm text-gray-400 mb-2">Nueva Contraseña</label>
                            <input type="password" id="new-password" required minlength="6"
                                   class="w-full bg-slate-700 rounded-lg px-4 py-2 text-white">
                        </div>
                        <div>
                            <label class="block text-sm text-gray-400 mb-2">Confirmar Contraseña</label>
                            <input type="password" id="new-password-confirm" required
                                   class="w-full bg-slate-700 rounded-lg px-4 py-2 text-white">
                        </div>
                        <div class="flex gap-3">
                            <button type="submit" class="btn-primary flex-1">Cambiar</button>
                            <button type="button" id="cancel-change" class="btn-secondary flex-1">Cancelar</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modal);

        document.getElementById('supabase-change-password-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const newPassword = document.getElementById('new-password').value;
            const confirmPassword = document.getElementById('new-password-confirm').value;

            if (newPassword !== confirmPassword) {
                window.toast?.error('Las contraseñas no coinciden');
                return;
            }

            const result = await this.updatePassword(newPassword);
            if (!result.error) {
                document.getElementById('supabase-change-password-modal').remove();
            }
        });

        document.getElementById('cancel-change').addEventListener('click', () => {
            document.getElementById('supabase-change-password-modal').remove();
        });
    }
}

// Crear instancia global
window.supabaseAuthHelper = new SupabaseAuthHelper();
