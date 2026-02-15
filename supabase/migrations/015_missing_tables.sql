-- ═══════════════════════════════════════════════════════════════════════════════
-- MIGRACIÓN 015: TABLAS FALTANTES
-- ═══════════════════════════════════════════════════════════════════════════════
-- Crea las 3 tablas faltantes detectadas por el sistema de tests:
-- 1. user_progress - Progreso general del usuario
-- 2. reading_sessions - Sesiones de lectura
-- 3. user_achievements - Logros desbloqueados (+ achievements si no existe)
-- ═══════════════════════════════════════════════════════════════════════════════

-- ============================================================================
-- 1. TABLA: USER_PROGRESS
-- ============================================================================
-- Progreso general del usuario (resumen de actividad, nivel, puntos)

CREATE TABLE IF NOT EXISTS public.user_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Nivel y experiencia
    level INTEGER DEFAULT 1,
    experience_points INTEGER DEFAULT 0,
    total_points INTEGER DEFAULT 0,

    -- Estadísticas de lectura
    books_started INTEGER DEFAULT 0,
    books_completed INTEGER DEFAULT 0,
    chapters_read INTEGER DEFAULT 0,
    total_reading_time_minutes INTEGER DEFAULT 0,

    -- Rachas y consistencia
    current_streak_days INTEGER DEFAULT 0,
    longest_streak_days INTEGER DEFAULT 0,
    last_activity_date DATE,

    -- Quizzes y ejercicios
    quizzes_completed INTEGER DEFAULT 0,
    quizzes_perfect_score INTEGER DEFAULT 0,
    exercises_completed INTEGER DEFAULT 0,

    -- Meditaciones
    meditations_completed INTEGER DEFAULT 0,
    total_meditation_minutes INTEGER DEFAULT 0,

    -- Metadatos adicionales
    badges JSONB DEFAULT '[]'::jsonb,
    milestones JSONB DEFAULT '[]'::jsonb,
    preferences JSONB DEFAULT '{}'::jsonb,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    synced_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT user_progress_level_check CHECK (level >= 1),
    CONSTRAINT user_progress_xp_check CHECK (experience_points >= 0),
    CONSTRAINT user_progress_streak_check CHECK (current_streak_days >= 0),
    CONSTRAINT user_progress_books_check CHECK (books_completed <= books_started)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON public.user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_level ON public.user_progress(level DESC);
CREATE INDEX IF NOT EXISTS idx_user_progress_points ON public.user_progress(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_user_progress_streak ON public.user_progress(current_streak_days DESC);
CREATE INDEX IF NOT EXISTS idx_user_progress_updated ON public.user_progress(updated_at DESC);

-- RLS
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own progress" ON public.user_progress;
CREATE POLICY "Users can view their own progress"
    ON public.user_progress FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own progress" ON public.user_progress;
CREATE POLICY "Users can insert their own progress"
    ON public.user_progress FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own progress" ON public.user_progress;
CREATE POLICY "Users can update their own progress"
    ON public.user_progress FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE public.user_progress IS 'Progreso general del usuario: nivel, puntos, estadísticas de lectura y rachas';

-- ============================================================================
-- 2. TABLA: READING_SESSIONS
-- ============================================================================
-- Sesiones individuales de lectura (tracking de tiempo y contenido)

CREATE TABLE IF NOT EXISTS public.reading_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Contenido leído
    book_id TEXT NOT NULL,
    chapter_id TEXT,

    -- Duración y tiempo
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    duration_minutes INTEGER,

    -- Progreso en la sesión
    start_paragraph INTEGER DEFAULT 0,
    end_paragraph INTEGER,
    pages_read INTEGER DEFAULT 0,
    words_read INTEGER DEFAULT 0,

    -- Comportamiento
    reading_speed_wpm INTEGER,
    pauses_count INTEGER DEFAULT 0,
    highlights_count INTEGER DEFAULT 0,
    notes_count INTEGER DEFAULT 0,

    -- Dispositivo y contexto
    device_type TEXT,
    platform TEXT,
    session_source TEXT DEFAULT 'manual',

    -- Metadatos
    metadata JSONB DEFAULT '{}'::jsonb,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    synced_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT reading_sessions_book_check CHECK (char_length(book_id) > 0),
    CONSTRAINT reading_sessions_duration_check CHECK (duration_minutes IS NULL OR duration_minutes >= 0),
    CONSTRAINT reading_sessions_pages_check CHECK (pages_read >= 0),
    CONSTRAINT reading_sessions_words_check CHECK (words_read >= 0),
    CONSTRAINT reading_sessions_device_check CHECK (device_type IS NULL OR device_type IN ('mobile', 'tablet', 'desktop', 'web')),
    CONSTRAINT reading_sessions_platform_check CHECK (platform IS NULL OR platform IN ('android', 'ios', 'web', 'desktop'))
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_reading_sessions_user_id ON public.reading_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_sessions_book_id ON public.reading_sessions(book_id);
CREATE INDEX IF NOT EXISTS idx_reading_sessions_chapter_id ON public.reading_sessions(chapter_id);
CREATE INDEX IF NOT EXISTS idx_reading_sessions_started_at ON public.reading_sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_reading_sessions_user_date ON public.reading_sessions(user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_reading_sessions_synced_at ON public.reading_sessions(synced_at);

-- RLS
ALTER TABLE public.reading_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own sessions" ON public.reading_sessions;
CREATE POLICY "Users can view their own sessions"
    ON public.reading_sessions FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own sessions" ON public.reading_sessions;
CREATE POLICY "Users can insert their own sessions"
    ON public.reading_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own sessions" ON public.reading_sessions;
CREATE POLICY "Users can update their own sessions"
    ON public.reading_sessions FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own sessions" ON public.reading_sessions;
CREATE POLICY "Users can delete their own sessions"
    ON public.reading_sessions FOR DELETE
    USING (auth.uid() = user_id);

COMMENT ON TABLE public.reading_sessions IS 'Sesiones individuales de lectura con tracking de tiempo, progreso y comportamiento';

-- ============================================================================
-- 3. TABLA: ACHIEVEMENTS (Catálogo de Logros)
-- ============================================================================
-- Catálogo maestro de logros disponibles en la app

CREATE TABLE IF NOT EXISTS public.achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identificación
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,

    -- Categoría y tipo
    category TEXT NOT NULL DEFAULT 'general',
    tier TEXT DEFAULT 'bronze',

    -- Visual
    icon TEXT DEFAULT '🏆',
    badge_image_url TEXT,
    color TEXT DEFAULT '#FFD700',

    -- Requisitos
    requirement_type TEXT NOT NULL,
    requirement_value INTEGER DEFAULT 1,
    requirement_context JSONB DEFAULT '{}'::jsonb,

    -- Recompensas
    points_reward INTEGER DEFAULT 10,
    xp_reward INTEGER DEFAULT 50,

    -- Estado
    is_active BOOLEAN DEFAULT true,
    is_hidden BOOLEAN DEFAULT false,
    is_repeatable BOOLEAN DEFAULT false,

    -- Orden y metadata
    sort_order INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT achievements_slug_check CHECK (char_length(slug) > 0),
    CONSTRAINT achievements_name_check CHECK (char_length(name) > 0),
    CONSTRAINT achievements_category_check CHECK (category IN (
        'general', 'reading', 'learning', 'meditation', 'social',
        'quiz', 'streak', 'milestone', 'special', 'seasonal'
    )),
    CONSTRAINT achievements_tier_check CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum', 'diamond')),
    CONSTRAINT achievements_points_check CHECK (points_reward >= 0),
    CONSTRAINT achievements_xp_check CHECK (xp_reward >= 0)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_achievements_slug ON public.achievements(slug);
CREATE INDEX IF NOT EXISTS idx_achievements_category ON public.achievements(category);
CREATE INDEX IF NOT EXISTS idx_achievements_tier ON public.achievements(tier);
CREATE INDEX IF NOT EXISTS idx_achievements_active ON public.achievements(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_achievements_sort ON public.achievements(sort_order, category);

-- RLS - Logros son públicos para lectura
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active achievements" ON public.achievements;
CREATE POLICY "Anyone can view active achievements"
    ON public.achievements FOR SELECT
    USING (is_active = true);

COMMENT ON TABLE public.achievements IS 'Catálogo maestro de logros disponibles en la aplicación';

-- ============================================================================
-- 4. TABLA: USER_ACHIEVEMENTS
-- ============================================================================
-- Logros desbloqueados por cada usuario

CREATE TABLE IF NOT EXISTS public.user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,

    -- Estado de desbloqueo
    unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    progress_current INTEGER DEFAULT 0,
    progress_target INTEGER DEFAULT 1,
    is_completed BOOLEAN DEFAULT true,

    -- Repeticiones (para logros repetibles)
    times_earned INTEGER DEFAULT 1,

    -- Contexto del desbloqueo
    unlock_context JSONB DEFAULT '{}'::jsonb,

    -- Notificación
    is_notified BOOLEAN DEFAULT false,
    notified_at TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    synced_at TIMESTAMPTZ DEFAULT NOW(),

    -- Unique constraint: un usuario solo puede tener un registro por logro
    CONSTRAINT unique_user_achievement UNIQUE (user_id, achievement_id),

    -- Constraints
    CONSTRAINT user_achievements_progress_check CHECK (progress_current >= 0),
    CONSTRAINT user_achievements_target_check CHECK (progress_target > 0),
    CONSTRAINT user_achievements_times_check CHECK (times_earned >= 0)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON public.user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON public.user_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_unlocked_at ON public.user_achievements(unlocked_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_achievements_completed ON public.user_achievements(is_completed) WHERE is_completed = true;
CREATE INDEX IF NOT EXISTS idx_user_achievements_notified ON public.user_achievements(is_notified) WHERE is_notified = false;
CREATE INDEX IF NOT EXISTS idx_user_achievements_synced ON public.user_achievements(synced_at);

-- RLS
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own achievements" ON public.user_achievements;
CREATE POLICY "Users can view their own achievements"
    ON public.user_achievements FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own achievements" ON public.user_achievements;
CREATE POLICY "Users can insert their own achievements"
    ON public.user_achievements FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own achievements" ON public.user_achievements;
CREATE POLICY "Users can update their own achievements"
    ON public.user_achievements FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE public.user_achievements IS 'Logros desbloqueados por cada usuario con progreso y contexto';

-- ============================================================================
-- 5. TRIGGERS: AUTO-UPDATE updated_at
-- ============================================================================

DROP TRIGGER IF EXISTS update_user_progress_updated_at ON public.user_progress;
CREATE TRIGGER update_user_progress_updated_at
    BEFORE UPDATE ON public.user_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_achievements_updated_at ON public.achievements;
CREATE TRIGGER update_achievements_updated_at
    BEFORE UPDATE ON public.achievements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_achievements_updated_at ON public.user_achievements;
CREATE TRIGGER update_user_achievements_updated_at
    BEFORE UPDATE ON public.user_achievements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 6. DATOS INICIALES: LOGROS BASE
-- ============================================================================

INSERT INTO public.achievements (slug, name, description, category, tier, icon, requirement_type, requirement_value, points_reward, xp_reward, sort_order)
VALUES
    -- Logros de Lectura
    ('first-chapter', 'Primer Paso', 'Completa tu primer capítulo', 'reading', 'bronze', '📖', 'chapters_read', 1, 10, 50, 1),
    ('book-starter', 'Explorador', 'Empieza tu primer libro', 'reading', 'bronze', '🚀', 'books_started', 1, 10, 50, 2),
    ('bookworm', 'Ratón de Biblioteca', 'Lee 10 capítulos', 'reading', 'silver', '📚', 'chapters_read', 10, 25, 100, 3),
    ('first-book', 'Primera Conquista', 'Completa tu primer libro', 'reading', 'silver', '🎯', 'books_completed', 1, 50, 200, 4),
    ('avid-reader', 'Lector Ávido', 'Lee 50 capítulos', 'reading', 'gold', '⭐', 'chapters_read', 50, 100, 500, 5),
    ('library-master', 'Maestro Bibliotecario', 'Completa 5 libros', 'reading', 'platinum', '👑', 'books_completed', 5, 250, 1000, 6),

    -- Logros de Racha
    ('streak-3', 'Constante', '3 días seguidos leyendo', 'streak', 'bronze', '🔥', 'streak_days', 3, 15, 75, 10),
    ('streak-7', 'Disciplinado', '7 días seguidos leyendo', 'streak', 'silver', '💪', 'streak_days', 7, 30, 150, 11),
    ('streak-30', 'Imparable', '30 días seguidos leyendo', 'streak', 'gold', '🌟', 'streak_days', 30, 100, 500, 12),
    ('streak-100', 'Leyenda', '100 días seguidos leyendo', 'streak', 'diamond', '💎', 'streak_days', 100, 500, 2500, 13),

    -- Logros de Quiz
    ('first-quiz', 'Aprendiz', 'Completa tu primer quiz', 'quiz', 'bronze', '✏️', 'quizzes_completed', 1, 10, 50, 20),
    ('quiz-master', 'Experto', 'Completa 10 quizzes', 'quiz', 'silver', '🎓', 'quizzes_completed', 10, 50, 200, 21),
    ('perfect-score', 'Perfeccionista', 'Obtén puntuación perfecta en un quiz', 'quiz', 'gold', '💯', 'perfect_quizzes', 1, 25, 100, 22),

    -- Logros de Meditación
    ('first-meditation', 'Calma Interior', 'Completa tu primera meditación', 'meditation', 'bronze', '🧘', 'meditations_completed', 1, 10, 50, 30),
    ('zen-master', 'Maestro Zen', 'Completa 20 meditaciones', 'meditation', 'gold', '☯️', 'meditations_completed', 20, 100, 400, 31),
    ('hour-meditator', 'Meditador Profundo', '60 minutos de meditación total', 'meditation', 'silver', '🕐', 'meditation_minutes', 60, 50, 200, 32),

    -- Logros Especiales
    ('night-owl', 'Búho Nocturno', 'Lee después de medianoche', 'special', 'bronze', '🦉', 'special_condition', 1, 15, 75, 40),
    ('early-bird', 'Madrugador', 'Lee antes de las 6am', 'special', 'bronze', '🐦', 'special_condition', 1, 15, 75, 41),
    ('collection-complete', 'Coleccionista', 'Desbloquea todos los logros de bronce', 'milestone', 'gold', '🏆', 'bronze_achievements', 10, 200, 1000, 50)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- 7. FUNCIÓN: Inicializar progreso de usuario
-- ============================================================================

CREATE OR REPLACE FUNCTION initialize_user_progress()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_progress (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear progreso automáticamente al crear usuario
DROP TRIGGER IF EXISTS on_user_created_init_progress ON auth.users;
CREATE TRIGGER on_user_created_init_progress
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION initialize_user_progress();

-- ============================================================================
-- 8. VISTAS ÚTILES
-- ============================================================================

-- Vista: Estadísticas de lectura por usuario
CREATE OR REPLACE VIEW user_reading_stats AS
SELECT
    user_id,
    COUNT(*) as total_sessions,
    SUM(duration_minutes) as total_minutes,
    AVG(duration_minutes) as avg_session_minutes,
    MAX(started_at) as last_session,
    COUNT(DISTINCT book_id) as unique_books,
    SUM(words_read) as total_words
FROM reading_sessions
GROUP BY user_id;

-- Vista: Logros con detalles de usuario
CREATE OR REPLACE VIEW user_achievements_detailed AS
SELECT
    ua.id,
    ua.user_id,
    ua.achievement_id,
    ua.unlocked_at,
    ua.is_completed,
    ua.times_earned,
    a.slug,
    a.name,
    a.description,
    a.category,
    a.tier,
    a.icon,
    a.points_reward,
    a.xp_reward
FROM user_achievements ua
JOIN achievements a ON ua.achievement_id = a.id
WHERE a.is_active = true;

-- ============================================================================
-- MIGRACIÓN COMPLETADA
-- ============================================================================

-- Comentarios finales
COMMENT ON VIEW user_reading_stats IS 'Estadísticas agregadas de lectura por usuario';
COMMENT ON VIEW user_achievements_detailed IS 'Vista combinada de logros de usuario con detalles del logro';

-- ✅ Tablas creadas:
-- 1. user_progress - Progreso general del usuario
-- 2. reading_sessions - Sesiones de lectura
-- 3. achievements - Catálogo de logros
-- 4. user_achievements - Logros desbloqueados por usuario

