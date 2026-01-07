/**
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
            console.error('Supabase Auth no inicializado');
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

        // console.log('✓ Supabase Sync inicializado');
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
                    // console.log('Realtime update:', payload);
                    this.handleRealtimeUpdate(payload);
                }
            )
            .subscribe();

        // console.log('✓ Realtime activado');
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
            console.error('Error en migración:', error);
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
                // console.log('No hay datos locales para migrar');
                return;
            }

            const { readProgress, lastUpdate } = JSON.parse(savedData);
            if (!readProgress) return;

            // console.log('Migrando progreso de lectura:', Object.keys(readProgress));

            // Migrar cada libro
            for (const [bookId, progress] of Object.entries(readProgress)) {
                try {
                    // Verificar si ya existe en Supabase
                    const { data: existing } = await this.supabase
                        .from(window.supabaseConfig.tables.readingProgress)
                        .select('*')
                        .eq('user_id', userId)
                        .eq('book_id', bookId)
                        .single();

                    const chaptersRead = progress.chaptersRead || [];
                    const record = {
                        user_id: userId,
                        book_id: bookId,
                        chapters_read: chaptersRead,
                        total_chapters: chaptersRead.length, // Actualizar según lo leído
                        progress_percentage: 0, // Se calculará en el cliente
                        last_chapter_id: progress.lastChapter || null,
                        updated_at: progress.lastReadAt || lastUpdate || new Date().toISOString(),
                    };

                    if (existing) {
                        // Actualizar si el local es más reciente
                        const localTime = new Date(progress.lastReadAt || lastUpdate || 0).getTime();
                        const remoteTime = new Date(existing.updated_at).getTime();

                        if (localTime > remoteTime) {
                            await this.supabase
                                .from(window.supabaseConfig.tables.readingProgress)
                                .update(record)
                                .eq('id', existing.id);
                            // console.log(`✓ Progreso de "${bookId}" actualizado en nube`);
                        }
                    } else {
                        // Insertar nuevo
                        await this.supabase
                            .from(window.supabaseConfig.tables.readingProgress)
                            .insert(record);
                        // console.log(`✓ Progreso de "${bookId}" creado en nube`);
                    }

                } catch (error) {
                    console.error(`Error migrando progreso de ${bookId}:`, error);
                }
            }

        } catch (error) {
            console.error('Error general en migración de progreso:', error);
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
                // console.log('No hay notas locales para migrar');
                return;
            }

            // console.log('Migrando notas:', Object.keys(notes));

            // Notas están en formato: { "bookId:chapterId": [note1, note2, ...] }
            for (const [key, notesList] of Object.entries(notes)) {
                const [bookId, chapterId] = key.split(':');

                for (const note of notesList) {
                    try {
                        // Verificar si ya existe
                        const { data: existing } = await this.supabase
                            .from(window.supabaseConfig.tables.notes)
                            .select('*')
                            .eq('user_id', userId)
                            .eq('note_id', note.id)
                            .single();

                        if (!existing) {
                            await this.supabase
                                .from(window.supabaseConfig.tables.notes)
                                .insert({
                                    user_id: userId,
                                    note_id: note.id,
                                    book_id: bookId,
                                    chapter_id: chapterId,
                                    content: note.text || note.content,
                                    created_at: note.createdAt || new Date().toISOString(),
                                });
                            // console.log(`✓ Nota migrada: ${bookId}:${chapterId}`);
                        }
                    } catch (error) {
                        console.error(`Error migrando nota ${note.id}:`, error);
                    }
                }
            }

        } catch (error) {
            console.error('Error general en migración de notas:', error);
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

            // Verificar si ya existen
            const { data: existing } = await this.supabase
                .from(window.supabaseConfig.tables.achievements)
                .select('*')
                .eq('user_id', userId)
                .single();

            const record = {
                user_id: userId,
                unlocked_ids: achievements.unlockedIds || [],
                stats: achievements.stats || {},
                updated_at: new Date().toISOString(),
            };

            if (existing) {
                await this.supabase
                    .from(window.supabaseConfig.tables.achievements)
                    .update(record)
                    .eq('id', existing.id);
            } else {
                await this.supabase
                    .from(window.supabaseConfig.tables.achievements)
                    .insert(record);
            }

        } catch (error) {
            console.error('Error migrando achievements:', error);
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
                // console.log('No hay bookmarks locales para migrar');
                return;
            }

            // console.log('Migrando bookmarks:', bookmarks.length);

            for (const bookmark of bookmarks) {
                try {
                    // bookmarks pueden ser objetos {book, chapter} o strings
                    const chapterId = typeof bookmark === 'string' ? bookmark : bookmark.chapter;
                    const bookId = typeof bookmark === 'string' ? null : bookmark.book;

                    if (!chapterId) {
                        // console.warn('Bookmark inválido:', bookmark);
                        continue;
                    }

                    const { data: existing } = await this.supabase
                        .from(window.supabaseConfig.tables.bookmarks)
                        .select('*')
                        .eq('user_id', userId)
                        .eq('chapter_id', chapterId)
                        .single();

                    if (!existing) {
                        await this.supabase
                            .from(window.supabaseConfig.tables.bookmarks)
                            .insert({
                                user_id: userId,
                                chapter_id: chapterId,
                                book_id: bookId,
                                created_at: new Date().toISOString(),
                            });
                        // console.log(`✓ Bookmark migrado: ${chapterId}`);
                    }
                } catch (error) {
                    console.error(`Error migrando bookmark:`, error);
                }
            }

        } catch (error) {
            console.error('Error general en migración de bookmarks:', error);
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
                // console.log('ℹ️ No hay settings locales para migrar');
                return;
            }

            const { data: existing } = await this.supabase
                .from(window.supabaseConfig.tables.settings)
                .select('*')
                .eq('user_id', userId)
                .single();

            const record = {
                user_id: userId,
                settings: settings,
                updated_at: new Date().toISOString(),
            };

            if (existing) {
                // Solo actualizar si los settings en la nube están vacíos o si no existen
                const existingSettings = existing.settings || {};
                if (Object.keys(existingSettings).length === 0) {
                    await this.supabase
                        .from(window.supabaseConfig.tables.settings)
                        .update(record)
                        .eq('id', existing.id);
                    // console.log('✓ Settings locales migrados (nube estaba vacía)');
                } else {
                    // console.log('ℹ️ Settings ya existen en la nube, no se sobrescriben');
                }
            } else {
                // No existe registro, crear uno nuevo
                await this.supabase
                    .from(window.supabaseConfig.tables.settings)
                    .insert(record);
                // console.log('✓ Settings locales migrados (nuevo registro)');
            }

        } catch (error) {
            console.error('Error migrando settings:', error);
        }
    }

    /**
     * Sincronizar settings específicos a la nube (para cambios en tiempo real)
     * Usar cuando el usuario cambia configuración de IA, tema, etc.
     */
    async syncSettingsToCloud(settingsKeys = null) {
        // console.log('[SyncHelper] syncSettingsToCloud() called with keys:', settingsKeys);

        if (!window.supabaseAuthHelper.isAuthenticated()) {
            // console.warn('[SyncHelper] ⚠️ Usuario no autenticado, abortando sync');
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

        // console.log('[SyncHelper] Keys a sincronizar:', keysToSync);

        const userId = window.supabaseAuthHelper.user.id;
        // console.log('[SyncHelper] User ID:', userId);

        try {
            const settings = {};
            keysToSync.forEach(key => {
                const value = localStorage.getItem(key);
                if (value) {
                    settings[key] = value;
                    // console.log(`[SyncHelper] ✓ ${key}: ${value.substring(0, 50)}...`);
                } else {
                    // console.log(`[SyncHelper] ⚠️ ${key}: no encontrado en localStorage`);
                }
            });

            // console.log('[SyncHelper] Settings a enviar:', Object.keys(settings));

            const { data: existing, error: queryError } = await this.supabase
                .from(window.supabaseConfig.tables.settings)
                .select('*')
                .eq('user_id', userId)
                .maybeSingle();

            if (queryError) {
                // console.warn('⚠️ Error buscando settings existentes:', queryError.message);
                return;
            }

            const record = {
                user_id: userId,
                settings: settings,
                updated_at: new Date().toISOString(),
            };

            if (existing) {
                // Actualizar settings existentes (merge con los actuales)
                const { error: updateError } = await this.supabase
                    .from(window.supabaseConfig.tables.settings)
                    .update(record)
                    .eq('id', existing.id);

                if (updateError) {
                    console.error('Error actualizando settings:', updateError);
                } else {
                    // console.log('✓ Settings sincronizados a la nube');
                }
            } else {
                // Crear nuevo registro
                const { error: insertError } = await this.supabase
                    .from(window.supabaseConfig.tables.settings)
                    .insert(record);

                if (insertError) {
                    console.error('Error creando settings:', insertError);
                } else {
                    // console.log('✓ Settings creados en la nube');
                }
            }

        } catch (error) {
            console.error('Exception sincronizando settings:', error);
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
            if (window.biblioteca) window.biblioteca.render();

        } catch (error) {
            console.error('Error en syncFromCloud:', error);
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
        const { data, error } = await this.supabase
            .from(window.supabaseConfig.tables.readingProgress)
            .select('*')
            .eq('user_id', userId);

        if (error) throw error;

        if (!data || data.length === 0) {
            // console.log('No hay progreso en la nube');
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
                // console.log(`✓ Progreso de "${progress.book_id}" actualizado desde nube`);
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
        const { data, error } = await this.supabase
            .from(window.supabaseConfig.tables.notes)
            .select('*')
            .eq('user_id', userId);

        if (error) throw error;

        if (!data || data.length === 0) {
            // console.log('No hay notas en la nube');
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
        // console.log(`✓ ${data.length} notas sincronizadas desde nube`);

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
                // console.warn('⚠️ Error al sincronizar achievements desde nube:', error.message);
                return; // No propagar el error
            }

            if (data) {
                localStorage.setItem('achievements', JSON.stringify({
                    unlockedIds: data.unlocked_ids,
                    stats: data.stats,
                }));
                // console.log('✓ Achievements sincronizados desde nube');
            } else {
                // console.log('No hay achievements en la nube (primera vez)');
            }
        } catch (err) {
            // console.warn('⚠️ Exception al sincronizar achievements:', err.message);
            // No propagar para no romper el flujo de sync
        }
    }

    /**
     * Sincronizar bookmarks desde la nube
     * CORREGIDO: Actualizar formato correcto de coleccion-nuevo-ser-data
     */
    async syncBookmarksFromCloud(userId) {
        const { data, error } = await this.supabase
            .from(window.supabaseConfig.tables.bookmarks)
            .select('chapter_id')
            .eq('user_id', userId);

        if (error) throw error;

        if (!data || data.length === 0) {
            // console.log('No hay bookmarks en la nube');
            return;
        }

        // Obtener datos locales actuales
        const savedData = localStorage.getItem('coleccion-nuevo-ser-data');
        let localData = savedData ? JSON.parse(savedData) : { readProgress: {}, bookmarks: [], notes: {} };

        // Actualizar bookmarks (solo los chapter_ids)
        localData.bookmarks = data.map(b => b.chapter_id);
        // console.log(`✓ ${data.length} bookmarks sincronizados desde nube`);

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
                // console.warn('⚠️ Error al sincronizar settings desde nube:', error.message);
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
                    // console.log('✓ Configuración de IA recargada desde la nube');
                }

                // Aplicar tema si se sincronizó
                if (data.settings.theme && window.themeHelper) {
                    window.themeHelper.applyTheme(data.settings.theme);
                }

                // Recargar voz TTS si se sincronizó
                if (data.settings['preferred-tts-voice'] && window.audioReader) {
                    window.audioReader.selectBestVoice();
                }

                // console.log('✓ Settings sincronizados desde la nube');
            } else {
                // console.log('No hay settings en la nube (primera vez)');
            }
        } catch (err) {
            // console.warn('⚠️ Exception al sincronizar settings:', err.message);
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
                // console.log('No hay reflexiones para migrar');
                return;
            }

            // console.log('Migrando reflexiones:', Object.keys(reflections));

            for (const [key, reflection] of Object.entries(reflections)) {
                const [bookId, chapterId] = key.split(':');

                // Verificar si ya existe
                const { data: existing } = await this.supabase
                    .from(window.supabaseConfig.tables.reflections)
                    .select('updated_at')
                    .eq('user_id', userId)
                    .eq('book_id', bookId)
                    .eq('chapter_id', chapterId)
                    .single();

                const localTime = new Date(reflection.timestamp || Date.now()).getTime();
                const remoteTime = existing ? new Date(existing.updated_at).getTime() : 0;

                // Solo subir si local es más reciente o no existe
                if (!existing || localTime > remoteTime) {
                    await this.supabase
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
                    // console.log(`✓ Reflexión migrada: ${key}`);
                }
            }
        } catch (error) {
            console.error('Error migrando reflexiones:', error);
            throw error;
        }
    }

    /**
     * Sincronizar reflexiones desde la nube
     */
    async syncReflectionsFromCloud(userId) {
        const { data, error } = await this.supabase
            .from(window.supabaseConfig.tables.reflections)
            .select('*')
            .eq('user_id', userId);

        if (error) throw error;

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
        // console.log(`✓ ${data.length} reflexiones sincronizadas desde la nube`);
    }

    /**
     * Migrar planes de acción a la nube
     */
    async migrateActionPlans() {
        const userId = window.supabaseAuthHelper.user.id;
        try {
            const plans = JSON.parse(localStorage.getItem('action-plans') || '{}');
            if (Object.keys(plans).length === 0) {
                // console.log('No hay planes de acción para migrar');
                return;
            }

            // console.log('Migrando planes de acción:', Object.keys(plans));

            for (const [actionId, plan] of Object.entries(plans)) {
                // Verificar si ya existe
                const { data: existing } = await this.supabase
                    .from(window.supabaseConfig.tables.actionPlans)
                    .select('updated_at')
                    .eq('user_id', userId)
                    .eq('action_id', actionId)
                    .single();

                const localTime = plan.updatedAt ? new Date(plan.updatedAt).getTime() : Date.now();
                const remoteTime = existing ? new Date(existing.updated_at).getTime() : 0;

                // Solo subir si local es más reciente o no existe
                if (!existing || localTime > remoteTime) {
                    await this.supabase
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
                    // console.log(`✓ Plan de acción migrado: ${actionId}`);
                }
            }
        } catch (error) {
            console.error('Error migrando planes de acción:', error);
            throw error;
        }
    }

    /**
     * Sincronizar planes de acción desde la nube
     */
    async syncActionPlansFromCloud(userId) {
        const { data, error } = await this.supabase
            .from(window.supabaseConfig.tables.actionPlans)
            .select('*')
            .eq('user_id', userId);

        if (error) throw error;

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
        // console.log(`✓ ${data.length} planes de acción sincronizados desde la nube`);
    }

    /**
     * Migrar historial de koans a la nube
     */
    async migrateKoanHistory() {
        const userId = window.supabaseAuthHelper.user.id;
        try {
            const history = JSON.parse(localStorage.getItem('koan_history') || '[]');
            if (history.length === 0) {
                // console.log('No hay historial de koans para migrar');
                return;
            }

            // console.log('Migrando historial de koans:', history.length, 'koans');

            for (const koan of history) {
                const koanId = `${koan.timestamp || Date.now()}`;

                // Verificar si ya existe
                const { data: existing } = await this.supabase
                    .from(window.supabaseConfig.tables.koans)
                    .select('id')
                    .eq('user_id', userId)
                    .eq('koan_id', koanId)
                    .single();

                // Solo subir si no existe
                if (!existing) {
                    await this.supabase
                        .from(window.supabaseConfig.tables.koans)
                        .insert({
                            user_id: userId,
                            koan_id: koanId,
                            text: koan.text,
                            category: koan.category || 'general',
                            created_at: koan.timestamp || new Date().toISOString(),
                        });
                }
            }
            // console.log(`✓ ${history.length} koans migrados`);
        } catch (error) {
            console.error('Error migrando historial de koans:', error);
            throw error;
        }
    }

    /**
     * Sincronizar historial de koans desde la nube
     */
    async syncKoansFromCloud(userId) {
        const { data, error } = await this.supabase
            .from(window.supabaseConfig.tables.koans)
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        const history = data.map(koan => ({
            text: koan.text,
            category: koan.category,
            timestamp: koan.created_at
        }));

        localStorage.setItem('koan_history', JSON.stringify(history));
        // console.log(`✓ ${data.length} koans sincronizados desde la nube`);
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
