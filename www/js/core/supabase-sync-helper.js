/**
// 🔧 FIX v2.9.284: Migrated all console.* to logger
 * Supabase Sync Helper
 * Maneja sincronización de datos entre dispositivos
 */

class SupabaseSyncHelper {
    constructor() {
        this.supabase = null;
        this.lastSyncTime = null;
        this.syncInProgress = false;
        this.realtimeChannel = null;
        this.syncCallbacks = [];
    }

    /**
     * Inicializa el helper
     */
    async init() {
        // Esperar a que auth esté inicializado
        if (!window.supabaseAuthHelper?.supabase) {
            logger.error('Supabase Auth no inicializado');
            return;
        }

        this.supabase = window.supabaseAuthHelper.supabase;

        // Setup realtime si usuario autenticado
        if (window.supabaseAuthHelper.isAuthenticated()) {
            await this.setupRealtime();
        }

        // Listener para cambios de autenticación
        window.supabaseAuthHelper.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN') {
                await this.setupRealtime();

                // PRIMERO: Sincronizar desde la nube (importar datos existentes)
                await this.syncFromCloud();

                // SEGUNDO: Migrar datos locales que no existan en la nube
                await this.migrateLocalStorageToCloud();
            } else if (event === 'SIGNED_OUT') {
                this.cleanupRealtime();
            }
        });

        // logger.debug('✓ Supabase Sync inicializado');
    }

    /**
     * Setup de real-time subscriptions
     */
    async setupRealtime() {
        if (!window.supabaseConfig.realtime.enabled) return;

        const userId = window.supabaseAuthHelper.user?.id;
        if (!userId) return;

        // Crear canal de realtime
        this.realtimeChannel = this.supabase
            .channel(window.supabaseConfig.realtime.channel)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    filter: `user_id=eq.${userId}`
                },
                (payload) => {
                    // logger.debug('Realtime update:', payload);
                    this.handleRealtimeUpdate(payload);
                }
            )
            .subscribe();

        // logger.debug('✓ Realtime activado');
    }

    /**
     * Limpiar realtime
     */
    cleanupRealtime() {
        if (this.realtimeChannel) {
            this.supabase.removeChannel(this.realtimeChannel);
            this.realtimeChannel = null;
        }
    }

    /**
     * Manejar actualizaciones en tiempo real
     */
    handleRealtimeUpdate(payload) {
        const { table, eventType, new: newRecord, old: oldRecord } = payload;

        // Actualizar localStorage según la tabla
        switch (table) {
            case window.supabaseConfig.tables.readingProgress:
                this.updateLocalProgress(newRecord);
                break;
            case window.supabaseConfig.tables.notes:
                this.updateLocalNotes(newRecord);
                break;
            case window.supabaseConfig.tables.achievements:
                this.updateLocalAchievements(newRecord);
                break;
            // ... más tablas
        }

        // Notificar a callbacks
        this.syncCallbacks.forEach(cb => cb(table, eventType, newRecord));
    }

    /**
     * Registrar callback para cambios de sync
     */
    onSync(callback) {
        this.syncCallbacks.push(callback);
    }

    /**
     * Verificar si el usuario está autenticado
     */
    isAuthenticated() {
        return window.supabaseAuthHelper?.isAuthenticated();
    }

    /**
     * Migrar datos de localStorage a Supabase
     */
    async migrateLocalStorageToCloud() {
        if (!window.supabaseAuthHelper.isAuthenticated()) return;

        try {
            window.toast?.info('Migrando datos locales a la nube...');

            // Migrar progreso de lectura
            await this.migrateReadingProgress();

            // Migrar notas
            await this.migrateNotes();

            // Migrar achievements
            await this.migrateAchievements();

            // Migrar bookmarks
            await this.migrateBookmarks();

            // Migrar reflexiones
            await this.migrateReflections();

            // Migrar planes de acción
            await this.migrateActionPlans();

            // Migrar historial de koans
            await this.migrateKoanHistory();

            // Migrar settings
            await this.migrateSettings();

            this.lastSyncTime = Date.now();
            localStorage.setItem('last-cloud-sync', this.lastSyncTime.toString());

            window.toast?.success('Datos migrados correctamente');

        } catch (error) {
            logger.error('Error en migración:', error);
            window.toast?.error('Error al migrar datos');
        }
    }

    /**
     * Migrar progreso de lectura
     * CORREGIDO: Usar formato correcto de coleccion-nuevo-ser-data
     */
    async migrateReadingProgress() {
        const userId = window.supabaseAuthHelper.user.id;

        try {
            // Obtener datos del formato correcto usado por BookEngine
            const savedData = localStorage.getItem('coleccion-nuevo-ser-data');
            if (!savedData) {
                // logger.debug('No hay datos locales para migrar');
                return;
            }

            const { readProgress, lastUpdate } = JSON.parse(savedData);
            if (!readProgress) return;

            // logger.debug('Migrando progreso de lectura:', Object.keys(readProgress));

            // Migrar cada libro
            for (const [bookId, progress] of Object.entries(readProgress)) {
                try {
                    // 🔧 FIX v2.9.384: Supabase v2 devuelve {data, error}, no soporta .catch()
                    const { data: existing, error: selectError } = await this.supabase
                        .from(window.supabaseConfig.tables.readingProgress)
                        .select('*')
                        .eq('user_id', userId)
                        .eq('book_id', bookId)
                        .maybeSingle();

                    if (selectError) {
                        logger.error('Error verificando progreso existente:', selectError);
                    }

                    const chaptersRead = progress.chaptersRead || [];
                    const record = {
                        user_id: userId,
                        book_id: bookId,
                        chapters_read: chaptersRead,
                        total_chapters: chaptersRead.length,
                        progress_percentage: 0,
                        last_chapter_id: progress.lastChapter || null,
                        updated_at: progress.lastReadAt || lastUpdate || new Date().toISOString(),
                    };

                    if (existing) {
                        const localTime = new Date(progress.lastReadAt || lastUpdate || 0).getTime();
                        const remoteTime = new Date(existing.updated_at).getTime();

                        if (localTime > remoteTime) {
                            const { error: updateError } = await this.supabase
                                .from(window.supabaseConfig.tables.readingProgress)
                                .update(record)
                                .eq('id', existing.id);

                            if (updateError) {
                                logger.error(`Error actualizando progreso de ${bookId}:`, updateError);
                                window.toast?.error('Error al sincronizar progreso de lectura');
                            }
                        }
                    } else {
                        const { error: insertError } = await this.supabase
                            .from(window.supabaseConfig.tables.readingProgress)
                            .insert(record);

                        if (insertError) {
                            logger.error(`Error insertando progreso de ${bookId}:`, insertError);
                            window.toast?.error('Error al guardar progreso en la nube');
                        }
                    }

                } catch (error) {
                    logger.error(`Error migrando progreso de ${bookId}:`, error);
                }
            }

        } catch (error) {
            logger.error('Error general en migración de progreso:', error);
        }
    }

    /**
     * Migrar notas
     * CORREGIDO: Usar formato correcto de coleccion-nuevo-ser-data
     */
    async migrateNotes() {
        const userId = window.supabaseAuthHelper.user.id;

        try {
            const savedData = localStorage.getItem('coleccion-nuevo-ser-data');
            if (!savedData) return;

            const { notes } = JSON.parse(savedData);
            if (!notes || Object.keys(notes).length === 0) {
                // logger.debug('No hay notas locales para migrar');
                return;
            }

            // logger.debug('Migrando notas:', Object.keys(notes));

            // Notas están en formato: { "bookId:chapterId": [note1, note2, ...] }
            for (const [key, notesList] of Object.entries(notes)) {
                const [bookId, chapterId] = key.split(':');

                for (const note of notesList) {
                    try {
                        // 🔧 FIX v2.9.384: Supabase v2 devuelve {data, error}
                        const { data: existing, error: selectError } = await this.supabase
                            .from(window.supabaseConfig.tables.notes)
                            .select('*')
                            .eq('user_id', userId)
                            .eq('note_id', note.id)
                            .maybeSingle();

                        if (selectError) {
                            logger.error('Error verificando nota existente:', selectError);
                        }

                        if (!existing) {
                            const { error: insertError } = await this.supabase
                                .from(window.supabaseConfig.tables.notes)
                                .insert({
                                    user_id: userId,
                                    note_id: note.id,
                                    book_id: bookId,
                                    chapter_id: chapterId,
                                    content: note.text || note.content,
                                    created_at: note.createdAt || new Date().toISOString(),
                                });

                            if (insertError) {
                                logger.error(`Error insertando nota ${note.id}:`, insertError);
                                window.toast?.error('Error al sincronizar notas');
                            }
                        }
                    } catch (error) {
                        logger.error(`Error migrando nota ${note.id}:`, error);
                    }
                }
            }

        } catch (error) {
            logger.error('Error general en migración de notas:', error);
        }
    }

    /**
     * Migrar achievements
     */
    async migrateAchievements() {
        const achievementsData = localStorage.getItem('achievements');
        if (!achievementsData) return;

        try {
            const achievements = JSON.parse(achievementsData);
            const userId = window.supabaseAuthHelper.user.id;

            // 🔧 FIX v2.9.384: Supabase v2 devuelve {data, error}
            const { data: existing, error: selectError } = await this.supabase
                .from(window.supabaseConfig.tables.achievements)
                .select('*')
                .eq('user_id', userId)
                .maybeSingle();

            if (selectError) {
                logger.error('Error verificando achievements existentes:', selectError);
            }

            const record = {
                user_id: userId,
                unlocked_ids: achievements.unlockedIds || [],
                stats: achievements.stats || {},
                updated_at: new Date().toISOString(),
            };

            if (existing) {
                const { error: updateError } = await this.supabase
                    .from(window.supabaseConfig.tables.achievements)
                    .update(record)
                    .eq('id', existing.id);

                if (updateError) {
                    logger.error('Error actualizando achievements:', updateError);
                    window.toast?.error('Error al sincronizar logros');
                }
            } else {
                const { error: insertError } = await this.supabase
                    .from(window.supabaseConfig.tables.achievements)
                    .insert(record);

                if (insertError) {
                    logger.error('Error insertando achievements:', insertError);
                    window.toast?.error('Error al guardar logros en la nube');
                }
            }

        } catch (error) {
            logger.error('Error migrando achievements:', error);
        }
    }

    /**
     * Migrar bookmarks
     * CORREGIDO: Usar formato correcto de coleccion-nuevo-ser-data
     */
    async migrateBookmarks() {
        const userId = window.supabaseAuthHelper.user.id;

        try {
            const savedData = localStorage.getItem('coleccion-nuevo-ser-data');
            if (!savedData) return;

            const { bookmarks } = JSON.parse(savedData);
            if (!bookmarks || bookmarks.length === 0) {
                // logger.debug('No hay bookmarks locales para migrar');
                return;
            }

            // logger.debug('Migrando bookmarks:', bookmarks.length);

            for (const bookmark of bookmarks) {
                try {
                    // bookmarks pueden ser objetos {book, chapter} o strings
                    const chapterId = typeof bookmark === 'string' ? bookmark : bookmark.chapter;
                    const bookId = typeof bookmark === 'string' ? null : bookmark.book;

                    if (!chapterId) {
                        // logger.warn('Bookmark inválido:', bookmark);
                        continue;
                    }

                    // 🔧 FIX v2.9.244: Supabase v2 no soporta .catch() encadenado
                    const { data: existing, error: selectError } = await this.supabase
                        .from(window.supabaseConfig.tables.bookmarks)
                        .select('*')
                        .eq('user_id', userId)
                        .eq('chapter_id', chapterId)
                        .maybeSingle();

                    if (selectError) {
                        logger.error('Error verificando bookmark existente:', selectError);
                    }

                    if (!existing) {
                        // Insertar nuevo bookmark
                        const { error: insertError } = await this.supabase
                            .from(window.supabaseConfig.tables.bookmarks)
                            .insert({
                                user_id: userId,
                                chapter_id: chapterId,
                                book_id: bookId,
                                created_at: new Date().toISOString(),
                            });

                        if (insertError) {
                            logger.error(`Error insertando bookmark ${chapterId}:`, insertError);
                        }
                    }
                } catch (error) {
                    logger.error(`Error migrando bookmark:`, error);
                }
            }

        } catch (error) {
            logger.error('Error general en migración de bookmarks:', error);
        }
    }

    /**
     * Migrar settings (solo en el primer login)
     */
    async migrateSettings() {
        const settingsKeys = [
            'theme',
            'language',
            'biometric-enabled',
            'notifications-enabled',
            'preferred-tts-voice',
            'ai_config',
            'ai_usage_stats'
        ];
        const userId = window.supabaseAuthHelper.user.id;

        try {
            const settings = {};
            settingsKeys.forEach(key => {
                const value = localStorage.getItem(key);
                if (value) settings[key] = value;
            });

            // No migrar si no hay settings locales
            if (Object.keys(settings).length === 0) {
                // logger.debug('ℹ️ No hay settings locales para migrar');
                return;
            }

            // 🔧 FIX v2.9.384: Supabase v2 devuelve {data, error}
            const { data: existing, error: selectError } = await this.supabase
                .from(window.supabaseConfig.tables.settings)
                .select('*')
                .eq('user_id', userId)
                .maybeSingle();

            if (selectError) {
                logger.error('Error verificando settings existentes:', selectError);
            }

            const record = {
                user_id: userId,
                settings: settings,
                updated_at: new Date().toISOString(),
            };

            if (existing) {
                const existingSettings = existing.settings || {};
                if (Object.keys(existingSettings).length === 0) {
                    const { error: updateError } = await this.supabase
                        .from(window.supabaseConfig.tables.settings)
                        .update(record)
                        .eq('id', existing.id);

                    if (updateError) {
                        logger.error('Error actualizando settings:', updateError);
                        window.toast?.error('Error al sincronizar configuración');
                    }
                }
            } else {
                const { error: insertError } = await this.supabase
                    .from(window.supabaseConfig.tables.settings)
                    .insert(record);

                if (insertError) {
                    logger.error('Error insertando settings:', insertError);
                    window.toast?.error('Error al guardar configuración en la nube');
                }
            }

        } catch (error) {
            logger.error('Error migrando settings:', error);
        }
    }

    /**
     * Sincronizar settings específicos a la nube (para cambios en tiempo real)
     * Usar cuando el usuario cambia configuración de IA, tema, etc.
     */
    async syncSettingsToCloud(settingsKeys = null) {
        // logger.debug('[SyncHelper] syncSettingsToCloud() called with keys:', settingsKeys);

        if (!window.supabaseAuthHelper.isAuthenticated()) {
            // logger.warn('[SyncHelper] ⚠️ Usuario no autenticado, abortando sync');
            return;
        }

        const keysToSync = settingsKeys || [
            'theme',
            'language',
            'biometric-enabled',
            'notifications-enabled',
            'preferred-tts-voice',
            'ai_config',
            'ai_usage_stats'
        ];

        // logger.debug('[SyncHelper] Keys a sincronizar:', keysToSync);

        const userId = window.supabaseAuthHelper.user.id;
        // logger.debug('[SyncHelper] User ID:', userId);

        try {
            const settings = {};
            keysToSync.forEach(key => {
                const value = localStorage.getItem(key);
                if (value) {
                    settings[key] = value;
                    // logger.debug(`[SyncHelper] ✓ ${key}: ${value.substring(0, 50)}...`);
                } else {
                    // logger.debug(`[SyncHelper] ⚠️ ${key}: no encontrado en localStorage`);
                }
            });

            // logger.debug('[SyncHelper] Settings a enviar:', Object.keys(settings));

            // 🔧 FIX v2.9.383: Corregido - Supabase no usa .catch(), devuelve {data, error}
            let existing = null;
            let queryError = null;

            try {
                const result = await this.supabase
                    .from(window.supabaseConfig.tables.settings)
                    .select('*')
                    .eq('user_id', userId)
                    .maybeSingle();

                existing = result.data;
                queryError = result.error;
            } catch (error) {
                logger.error('Error buscando settings existentes:', error);
                return;
            }

            if (queryError) {
                logger.warn('⚠️ Error buscando settings:', queryError.message);
                return;
            }

            const record = {
                user_id: userId,
                settings: settings,
                updated_at: new Date().toISOString(),
            };

            if (existing) {
                // Actualizar settings existentes
                try {
                    const { error: updateError } = await this.supabase
                        .from(window.supabaseConfig.tables.settings)
                        .update(record)
                        .eq('id', existing.id);

                    if (updateError) {
                        logger.error('Error actualizando settings:', updateError);
                    }
                } catch (error) {
                    logger.error('Error actualizando settings:', error);
                }
            } else {
                // Crear nuevo registro
                try {
                    const { error: insertError } = await this.supabase
                        .from(window.supabaseConfig.tables.settings)
                        .insert(record);

                    if (insertError) {
                        logger.error('Error creando settings:', insertError);
                    }
                } catch (error) {
                    logger.error('Error creando settings:', error);
                }
            }

        } catch (error) {
            logger.error('Exception sincronizando settings:', error);
        }
    }

    /**
     * Sincronizar todo desde la nube a local
     */
    async syncFromCloud() {
        if (!window.supabaseAuthHelper.isAuthenticated()) {
            window.toast?.warning('Debes iniciar sesión para sincronizar');
            return;
        }

        if (this.syncInProgress) {
            window.toast?.info('Sincronización en progreso...');
            return;
        }

        try {
            this.syncInProgress = true;
            window.toast?.info('Sincronizando desde la nube...');

            const userId = window.supabaseAuthHelper.user.id;

            // Sincronizar progreso de lectura
            await this.syncProgressFromCloud(userId);

            // Sincronizar notas
            await this.syncNotesFromCloud(userId);

            // Sincronizar achievements
            await this.syncAchievementsFromCloud(userId);

            // Sincronizar bookmarks
            await this.syncBookmarksFromCloud(userId);

            // Sincronizar reflexiones
            await this.syncReflectionsFromCloud(userId);

            // Sincronizar planes de acción
            await this.syncActionPlansFromCloud(userId);

            // Sincronizar historial de koans
            await this.syncKoansFromCloud(userId);

            // Sincronizar settings
            await this.syncSettingsFromCloud(userId);

            this.lastSyncTime = Date.now();
            localStorage.setItem('last-cloud-sync', this.lastSyncTime.toString());

            window.toast?.success('Sincronización completada');

            // Recargar UI
            if (window.biblioteca) window.biblioteca?.render();

        } catch (error) {
            logger.error('Error en syncFromCloud:', error);
            window.toast?.error('Error al sincronizar');
        } finally {
            this.syncInProgress = false;
        }
    }

    /**
     * Sincronizar progreso desde la nube
     * CORREGIDO: Actualizar formato correcto de coleccion-nuevo-ser-data
     */
    async syncProgressFromCloud(userId) {
        // 🔧 FIX v2.9.384: Supabase v2 devuelve {data, error}
        const { data, error } = await this.supabase
            .from(window.supabaseConfig.tables.readingProgress)
            .select('*')
            .eq('user_id', userId);

        if (error) {
            logger.error('Error sincronizando progreso desde la nube:', error);
            window.toast?.error('Error al cargar progreso. Verifica tu conexión.');
            throw error;
        }

        if (!data || data.length === 0) {
            // logger.debug('No hay progreso en la nube');
            return;
        }

        // Obtener datos locales actuales
        const savedData = localStorage.getItem('coleccion-nuevo-ser-data');
        let localData = savedData ? JSON.parse(savedData) : { readProgress: {}, bookmarks: [], notes: {} };

        // Actualizar progreso de cada libro desde la nube
        data.forEach(progress => {
            const remoteTime = new Date(progress.updated_at).getTime();
            const localProgress = localData.readProgress[progress.book_id];
            const localTime = localProgress?.lastReadAt ? new Date(localProgress.lastReadAt).getTime() : 0;

            // Solo actualizar si la nube es más reciente o no existe localmente
            if (!localProgress || remoteTime > localTime) {
                localData.readProgress[progress.book_id] = {
                    chaptersRead: progress.chapters_read || [],
                    lastChapter: progress.last_chapter_id,
                    lastReadAt: progress.updated_at,
                    startedAt: localProgress?.startedAt || progress.updated_at
                };
                // logger.debug(`✓ Progreso de "${progress.book_id}" actualizado desde nube`);
            }
        });

        // Guardar datos actualizados
        localData.lastUpdate = new Date().toISOString();
        localStorage.setItem('coleccion-nuevo-ser-data', JSON.stringify(localData));

        // Recargar datos en BookEngine si está disponible
        if (window.bookEngine) {
            window.bookEngine.loadUserData();
        }
    }

    /**
     * Sincronizar notas desde la nube
     * CORREGIDO: Actualizar formato correcto de coleccion-nuevo-ser-data
     */
    async syncNotesFromCloud(userId) {
        // 🔧 FIX v2.9.384: Supabase v2 devuelve {data, error}
        const { data, error } = await this.supabase
            .from(window.supabaseConfig.tables.notes)
            .select('*')
            .eq('user_id', userId);

        if (error) {
            logger.error('Error sincronizando notas desde la nube:', error);
            window.toast?.error('Error al cargar notas. Intenta de nuevo.');
            throw error;
        }

        if (!data || data.length === 0) {
            // logger.debug('No hay notas en la nube');
            return;
        }

        // Obtener datos locales actuales
        const savedData = localStorage.getItem('coleccion-nuevo-ser-data');
        let localData = savedData ? JSON.parse(savedData) : { readProgress: {}, bookmarks: [], notes: {} };

        // Agrupar notas por "bookId:chapterId"
        const notesByKey = {};
        data.forEach(note => {
            const key = `${note.book_id}:${note.chapter_id}`;
            if (!notesByKey[key]) notesByKey[key] = [];
            notesByKey[key].push({
                id: note.note_id,
                text: note.content,
                createdAt: note.created_at,
            });
        });

        // Actualizar notas en datos locales
        localData.notes = notesByKey;
        // logger.debug(`✓ ${data.length} notas sincronizadas desde nube`);

        // Guardar datos actualizados
        localData.lastUpdate = new Date().toISOString();
        localStorage.setItem('coleccion-nuevo-ser-data', JSON.stringify(localData));

        // Recargar datos en BookEngine
        if (window.bookEngine) {
            window.bookEngine.loadUserData();
        }
    }

    /**
     * Sincronizar achievements desde la nube
     */
    async syncAchievementsFromCloud(userId) {
        try {
            const { data, error } = await this.supabase
                .from(window.supabaseConfig.tables.achievements)
                .select('*')
                .eq('user_id', userId)
                .maybeSingle(); // Cambiado de .single() a .maybeSingle() para evitar error si no existe

            if (error) {
                // logger.warn('⚠️ Error al sincronizar achievements desde nube:', error.message);
                return; // No propagar el error
            }

            if (data) {
                localStorage.setItem('achievements', JSON.stringify({
                    unlockedIds: data.unlocked_ids,
                    stats: data.stats,
                }));
                // logger.debug('✓ Achievements sincronizados desde nube');
            } else {
                // logger.debug('No hay achievements en la nube (primera vez)');
            }
        } catch (err) {
            // logger.warn('⚠️ Exception al sincronizar achievements:', err.message);
            // No propagar para no romper el flujo de sync
        }
    }

    /**
     * Sincronizar bookmarks desde la nube
     * CORREGIDO: Actualizar formato correcto de coleccion-nuevo-ser-data
     */
    async syncBookmarksFromCloud(userId) {
        // 🔧 FIX v2.9.384: Supabase v2 devuelve {data, error}
        const { data, error } = await this.supabase
            .from(window.supabaseConfig.tables.bookmarks)
            .select('chapter_id')
            .eq('user_id', userId);

        if (error) {
            logger.error('Error sincronizando marcadores desde la nube:', error);
            window.toast?.error('Error al cargar marcadores. Verifica tu conexión.');
            throw error;
        }

        if (!data || data.length === 0) {
            // logger.debug('No hay bookmarks en la nube');
            return;
        }

        // Obtener datos locales actuales
        const savedData = localStorage.getItem('coleccion-nuevo-ser-data');
        let localData = savedData ? JSON.parse(savedData) : { readProgress: {}, bookmarks: [], notes: {} };

        // Actualizar bookmarks (solo los chapter_ids)
        localData.bookmarks = data.map(b => b.chapter_id);
        // logger.debug(`✓ ${data.length} bookmarks sincronizados desde nube`);

        // Guardar datos actualizados
        localData.lastUpdate = new Date().toISOString();
        localStorage.setItem('coleccion-nuevo-ser-data', JSON.stringify(localData));

        // Recargar datos en BookEngine
        if (window.bookEngine) {
            window.bookEngine.loadUserData();
        }
    }

    /**
     * Sincronizar settings desde la nube
     */
    async syncSettingsFromCloud(userId) {
        try {
            const { data, error } = await this.supabase
                .from(window.supabaseConfig.tables.settings)
                .select('*')
                .eq('user_id', userId)
                .maybeSingle();

            if (error) {
                // logger.warn('⚠️ Error al sincronizar settings desde nube:', error.message);
                return;
            }

            if (data?.settings) {
                Object.entries(data.settings).forEach(([key, value]) => {
                    // Restaurar directamente sin re-stringify (ya vienen como strings de la DB)
                    localStorage.setItem(key, value);
                });

                // Reinicializar configuración de IA si se sincronizó
                if (data.settings.ai_config && window.aiConfig) {
                    window.aiConfig.loadConfig();
                    // logger.debug('✓ Configuración de IA recargada desde la nube');
                }

                // Aplicar tema si se sincronizó
                if (data.settings.theme && window.themeHelper) {
                    window.themeHelper.applyTheme(data.settings.theme);
                }

                // Recargar voz TTS si se sincronizó
                if (data.settings['preferred-tts-voice'] && window.audioReader) {
                    window.audioReader.selectBestVoice();
                }

                // logger.debug('✓ Settings sincronizados desde la nube');
            } else {
                // logger.debug('No hay settings en la nube (primera vez)');
            }
        } catch (err) {
            // logger.warn('⚠️ Exception al sincronizar settings:', err.message);
        }
    }

    /**
     * Migrar reflexiones a la nube
     */
    async migrateReflections() {
        const userId = window.supabaseAuthHelper.user.id;
        try {
            const reflections = JSON.parse(localStorage.getItem('user-reflections') || '{}');
            if (Object.keys(reflections).length === 0) {
                // logger.debug('No hay reflexiones para migrar');
                return;
            }

            // logger.debug('Migrando reflexiones:', Object.keys(reflections));

            for (const [key, reflection] of Object.entries(reflections)) {
                const [bookId, chapterId] = key.split(':');

                // 🔧 FIX v2.9.384: Supabase v2 devuelve {data, error}
                const { data: existing, error: selectError } = await this.supabase
                    .from(window.supabaseConfig.tables.reflections)
                    .select('updated_at')
                    .eq('user_id', userId)
                    .eq('book_id', bookId)
                    .eq('chapter_id', chapterId)
                    .maybeSingle();

                if (selectError) {
                    logger.error('Error verificando reflexión existente:', selectError);
                }

                const localTime = new Date(reflection.timestamp || Date.now()).getTime();
                const remoteTime = existing ? new Date(existing.updated_at).getTime() : 0;

                if (!existing || localTime > remoteTime) {
                    const { error: upsertError } = await this.supabase
                        .from(window.supabaseConfig.tables.reflections)
                        .upsert({
                            user_id: userId,
                            book_id: bookId,
                            chapter_id: chapterId,
                            question: reflection.question,
                            answer: reflection.answer,
                            created_at: reflection.timestamp || new Date().toISOString(),
                            updated_at: reflection.timestamp || new Date().toISOString(),
                        });

                    if (upsertError) {
                        logger.error(`Error guardando reflexión ${key}:`, upsertError);
                        window.toast?.error('Error al sincronizar reflexiones');
                    }
                }
            }
        } catch (error) {
            logger.error('Error migrando reflexiones:', error);
            throw error;
        }
    }

    /**
     * Sincronizar reflexiones desde la nube
     */
    async syncReflectionsFromCloud(userId) {
        // 🔧 FIX v2.9.384: Supabase v2 devuelve {data, error}
        const { data, error } = await this.supabase
            .from(window.supabaseConfig.tables.reflections)
            .select('*')
            .eq('user_id', userId);

        if (error) {
            logger.error('Error sincronizando reflexiones desde la nube:', error);
            window.toast?.error('Error al cargar reflexiones. Intenta de nuevo.');
            throw error;
        }

        const reflections = {};
        data.forEach(refl => {
            const key = `${refl.book_id}:${refl.chapter_id}`;
            reflections[key] = {
                question: refl.question,
                answer: refl.answer,
                timestamp: refl.updated_at
            };
        });

        localStorage.setItem('user-reflections', JSON.stringify(reflections));
        // logger.debug(`✓ ${data.length} reflexiones sincronizadas desde la nube`);
    }

    /**
     * Migrar planes de acción a la nube
     */
    async migrateActionPlans() {
        const userId = window.supabaseAuthHelper.user.id;
        try {
            const plans = JSON.parse(localStorage.getItem('action-plans') || '{}');
            if (Object.keys(plans).length === 0) {
                // logger.debug('No hay planes de acción para migrar');
                return;
            }

            // logger.debug('Migrando planes de acción:', Object.keys(plans));

            for (const [actionId, plan] of Object.entries(plans)) {
                // 🔧 FIX v2.9.384: Supabase v2 devuelve {data, error}
                const { data: existing, error: selectError } = await this.supabase
                    .from(window.supabaseConfig.tables.actionPlans)
                    .select('updated_at')
                    .eq('user_id', userId)
                    .eq('action_id', actionId)
                    .maybeSingle();

                if (selectError) {
                    logger.error('Error verificando plan de acción existente:', selectError);
                }

                const localTime = plan.updatedAt ? new Date(plan.updatedAt).getTime() : Date.now();
                const remoteTime = existing ? new Date(existing.updated_at).getTime() : 0;

                if (!existing || localTime > remoteTime) {
                    const { error: upsertError } = await this.supabase
                        .from(window.supabaseConfig.tables.actionPlans)
                        .upsert({
                            user_id: userId,
                            action_id: actionId,
                            status: plan.status,
                            notes: plan.notes || '',
                            started_at: plan.startedAt || null,
                            completed_at: plan.completedAt || null,
                            created_at: plan.createdAt || new Date().toISOString(),
                            updated_at: plan.updatedAt || new Date().toISOString(),
                        });

                    if (upsertError) {
                        logger.error(`Error guardando plan ${actionId}:`, upsertError);
                        window.toast?.error('Error al sincronizar planes de acción');
                    }
                }
            }
        } catch (error) {
            logger.error('Error migrando planes de acción:', error);
            throw error;
        }
    }

    /**
     * Sincronizar planes de acción desde la nube
     */
    async syncActionPlansFromCloud(userId) {
        // 🔧 FIX v2.9.384: Supabase v2 devuelve {data, error}
        const { data, error } = await this.supabase
            .from(window.supabaseConfig.tables.actionPlans)
            .select('*')
            .eq('user_id', userId);

        if (error) {
            logger.error('Error sincronizando planes de acción desde la nube:', error);
            window.toast?.error('Error al cargar planes. Verifica tu conexión.');
            throw error;
        }

        const plans = {};
        data.forEach(plan => {
            plans[plan.action_id] = {
                status: plan.status,
                notes: plan.notes,
                startedAt: plan.started_at,
                completedAt: plan.completed_at,
                createdAt: plan.created_at,
                updatedAt: plan.updated_at
            };
        });

        localStorage.setItem('action-plans', JSON.stringify(plans));
        // logger.debug(`✓ ${data.length} planes de acción sincronizados desde la nube`);
    }

    /**
     * Migrar historial de koans a la nube
     */
    async migrateKoanHistory() {
        const userId = window.supabaseAuthHelper.user.id;
        try {
            const history = JSON.parse(localStorage.getItem('koan_history') || '[]');
            if (history.length === 0) {
                // logger.debug('No hay historial de koans para migrar');
                return;
            }

            // logger.debug('Migrando historial de koans:', history.length, 'koans');

            for (const koan of history) {
                const koanId = `${koan.timestamp || Date.now()}`;

                // 🔧 FIX v2.9.384: Supabase v2 devuelve {data, error}
                const { data: existing, error: selectError } = await this.supabase
                    .from(window.supabaseConfig.tables.koans)
                    .select('id')
                    .eq('user_id', userId)
                    .eq('koan_id', koanId)
                    .maybeSingle();

                if (selectError) {
                    logger.error('Error verificando koan existente:', selectError);
                }

                if (!existing) {
                    const { error: insertError } = await this.supabase
                        .from(window.supabaseConfig.tables.koans)
                        .insert({
                            user_id: userId,
                            koan_id: koanId,
                            text: koan.text,
                            category: koan.category || 'general',
                            created_at: koan.timestamp || new Date().toISOString(),
                        });

                    if (insertError) {
                        logger.error(`Error guardando koan ${koanId}:`, insertError);
                        window.toast?.error('Error al sincronizar historial de koans');
                    }
                }
            }
            // logger.debug(`✓ ${history.length} koans migrados`);
        } catch (error) {
            logger.error('Error migrando historial de koans:', error);
            throw error;
        }
    }

    /**
     * Sincronizar historial de koans desde la nube
     */
    async syncKoansFromCloud(userId) {
        // 🔧 FIX v2.9.384: Supabase v2 devuelve {data, error}
        const { data, error } = await this.supabase
            .from(window.supabaseConfig.tables.koans)
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            logger.error('Error sincronizando koans desde la nube:', error);
            window.toast?.error('Error al cargar historial de koans. Intenta de nuevo.');
            throw error;
        }

        const history = data.map(koan => ({
            text: koan.text,
            category: koan.category,
            timestamp: koan.created_at
        }));

        localStorage.setItem('koan_history', JSON.stringify(history));
        // logger.debug(`✓ ${data.length} koans sincronizados desde la nube`);
    }

    /**
     * Actualizar progreso local desde realtime
     */
    updateLocalProgress(record) {
        localStorage.setItem(`reading-progress-${record.book_id}`, JSON.stringify({
            chaptersRead: record.chapters_read,
            totalChapters: record.total_chapters,
            progressPercentage: record.progress_percentage,
            lastChapterId: record.last_chapter_id,
            updatedAt: record.updated_at,
        }));

        // Actualizar UI si está visible
        if (window.biblioteca) window.biblioteca.render();
    }

    /**
     * Actualizar notas locales desde realtime
     */
    updateLocalNotes(record) {
        const key = `notes-${record.book_id}`;
        const notes = JSON.parse(localStorage.getItem(key) || '[]');

        const index = notes.findIndex(n => n.id === record.note_id);
        const note = {
            id: record.note_id,
            chapterId: record.chapter_id,
            content: record.content,
            color: record.color,
            createdAt: record.created_at,
        };

        if (index >= 0) {
            notes[index] = note;
        } else {
            notes.push(note);
        }

        localStorage.setItem(key, JSON.stringify(notes));
    }

    /**
     * Actualizar achievements locales desde realtime
     */
    updateLocalAchievements(record) {
        localStorage.setItem('achievements', JSON.stringify({
            unlockedIds: record.unlocked_ids,
            stats: record.stats,
        }));

        // Actualizar UI si está visible
        if (window.achievementsSystem) {
            window.achievementsSystem.render();
        }
    }

    /**
     * Obtener última sincronización
     */
    getLastSyncTime() {
        const stored = localStorage.getItem('last-cloud-sync');
        return stored ? parseInt(stored) : null;
    }

    /**
     * Renderizar panel para Sync tab en settings
     */
    renderSettingsPanel() {
        const isAuth = window.supabaseAuthHelper?.isAuthenticated();
        const lastSync = this.getLastSyncTime();
        const lastSyncStr = lastSync ? new Date(lastSync).toLocaleString('es-ES') : 'Nunca';

        if (!isAuth) {
            return `
                <div class="space-y-4">
                    <p class="text-gray-400">Inicia sesión para habilitar sincronización en la nube</p>
                </div>
            `;
        }

        return `
            <div class="space-y-4">
                <div class="bg-slate-700 rounded-lg p-4">
                    <p class="text-sm text-gray-400 mb-2">Estado</p>
                    <p class="text-green-400 font-semibold">✓ Activo</p>
                </div>

                <div class="bg-slate-700 rounded-lg p-4">
                    <p class="text-sm text-gray-400 mb-2">Última Sincronización</p>
                    <p class="text-white">${lastSyncStr}</p>
                </div>

                <button id="supabase-sync-now" class="btn-primary w-full">
                    Sincronizar Ahora
                </button>

                <div class="border-t border-slate-700 pt-4">
                    <h4 class="font-semibold mb-3">Opciones</h4>
                    <label class="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                        <span>Sincronización automática</span>
                        <input type="checkbox" id="auto-sync-toggle" checked>
                    </label>
                </div>

                <div class="border-t border-slate-700 pt-4">
                    <h4 class="font-semibold mb-3">Backup Local</h4>
                    <div class="flex gap-2">
                        <button id="export-data-btn" class="btn-secondary flex-1">
                            Exportar
                        </button>
                        <button id="import-data-btn" class="btn-secondary flex-1">
                            Importar
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Adjuntar listeners para el panel de settings
     */
    attachSettingsListeners() {
        document.getElementById('supabase-sync-now')?.addEventListener('click', async () => {
            await this.syncFromCloud();
        });

        document.getElementById('auto-sync-toggle')?.addEventListener('change', (e) => {
            localStorage.setItem('auto-sync', e.target.checked ? 'true' : 'false');
        });

        document.getElementById('export-data-btn')?.addEventListener('click', () => {
            if (window.fileExportHelper) {
                window.fileExportHelper.exportFullBackup();
            }
        });

        document.getElementById('import-data-btn')?.addEventListener('click', () => {
            if (window.fileExportHelper) {
                window.fileExportHelper.importBackup();
            }
        });
    }
}

// Crear instancia global
window.supabaseSyncHelper = new SupabaseSyncHelper();
