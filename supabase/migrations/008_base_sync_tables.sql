-- =====================================================
-- MIGRATION 008: BASE SYNC TABLES
-- =====================================================
-- Creates 8 critical tables needed for web-mobile sync
-- Required by: supabase-sync-helper.js and sync systems
-- =====================================================

-- ======================
-- 1. NOTES TABLE
-- ======================
CREATE TABLE IF NOT EXISTS public.notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    book_id TEXT NOT NULL,
    chapter_id TEXT,
    paragraph_index INTEGER,
    note_text TEXT NOT NULL,
    color TEXT DEFAULT 'yellow',
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    synced_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,

    -- Constraints
    CONSTRAINT notes_book_id_check CHECK (char_length(book_id) > 0),
    CONSTRAINT notes_color_check CHECK (color IN ('yellow', 'blue', 'green', 'red', 'purple', 'orange'))
);

-- Indexes for notes
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON public.notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_book_id ON public.notes(book_id);
CREATE INDEX IF NOT EXISTS idx_notes_chapter_id ON public.notes(chapter_id);
CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON public.notes(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_synced_at ON public.notes(synced_at);
CREATE INDEX IF NOT EXISTS idx_notes_deleted_at ON public.notes(deleted_at) WHERE deleted_at IS NOT NULL;

-- RLS for notes
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notes"
    ON public.notes FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notes"
    ON public.notes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes"
    ON public.notes FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes"
    ON public.notes FOR DELETE
    USING (auth.uid() = user_id);

-- ======================
-- 2. BOOKMARKS TABLE
-- ======================
CREATE TABLE IF NOT EXISTS public.bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    book_id TEXT NOT NULL,
    chapter_id TEXT NOT NULL,
    paragraph_index INTEGER DEFAULT 0,
    scroll_position INTEGER DEFAULT 0,
    bookmark_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    synced_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,

    -- Constraints
    CONSTRAINT bookmarks_book_id_check CHECK (char_length(book_id) > 0),
    CONSTRAINT bookmarks_chapter_id_check CHECK (char_length(chapter_id) > 0),
    CONSTRAINT bookmarks_paragraph_index_check CHECK (paragraph_index >= 0),
    CONSTRAINT bookmarks_scroll_position_check CHECK (scroll_position >= 0)
);

-- Indexes for bookmarks
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON public.bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_book_id ON public.bookmarks(book_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_chapter_id ON public.bookmarks(chapter_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_updated_at ON public.bookmarks(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookmarks_synced_at ON public.bookmarks(synced_at);
CREATE INDEX IF NOT EXISTS idx_bookmarks_deleted_at ON public.bookmarks(deleted_at) WHERE deleted_at IS NOT NULL;

-- RLS for bookmarks
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own bookmarks"
    ON public.bookmarks FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bookmarks"
    ON public.bookmarks FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookmarks"
    ON public.bookmarks FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bookmarks"
    ON public.bookmarks FOR DELETE
    USING (auth.uid() = user_id);

-- ======================
-- 3. REFLECTIONS TABLE
-- ======================
CREATE TABLE IF NOT EXISTS public.reflections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    book_id TEXT NOT NULL,
    chapter_id TEXT,
    question_id TEXT,
    reflection_text TEXT NOT NULL,
    mood TEXT,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    synced_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,

    -- Constraints
    CONSTRAINT reflections_book_id_check CHECK (char_length(book_id) > 0),
    CONSTRAINT reflections_reflection_text_check CHECK (char_length(reflection_text) > 0),
    CONSTRAINT reflections_mood_check CHECK (mood IS NULL OR mood IN ('inspired', 'curious', 'contemplative', 'challenged', 'peaceful', 'confused'))
);

-- Indexes for reflections
CREATE INDEX IF NOT EXISTS idx_reflections_user_id ON public.reflections(user_id);
CREATE INDEX IF NOT EXISTS idx_reflections_book_id ON public.reflections(book_id);
CREATE INDEX IF NOT EXISTS idx_reflections_chapter_id ON public.reflections(chapter_id);
CREATE INDEX IF NOT EXISTS idx_reflections_question_id ON public.reflections(question_id);
CREATE INDEX IF NOT EXISTS idx_reflections_updated_at ON public.reflections(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_reflections_synced_at ON public.reflections(synced_at);
CREATE INDEX IF NOT EXISTS idx_reflections_deleted_at ON public.reflections(deleted_at) WHERE deleted_at IS NOT NULL;

-- RLS for reflections
ALTER TABLE public.reflections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reflections"
    ON public.reflections FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reflections"
    ON public.reflections FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reflections"
    ON public.reflections FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reflections"
    ON public.reflections FOR DELETE
    USING (auth.uid() = user_id);

-- ======================
-- 4. USER_SETTINGS TABLE
-- ======================
CREATE TABLE IF NOT EXISTS public.user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Reading preferences
    font_size INTEGER DEFAULT 16,
    font_family TEXT DEFAULT 'serif',
    line_height DECIMAL(3,2) DEFAULT 1.6,
    theme TEXT DEFAULT 'dark',

    -- Audio preferences
    audio_speed DECIMAL(3,2) DEFAULT 1.0,
    audio_voice TEXT DEFAULT 'es-ES-Standard-A',
    audio_autoplay BOOLEAN DEFAULT false,

    -- Notification preferences
    notifications_enabled BOOLEAN DEFAULT true,
    email_notifications BOOLEAN DEFAULT true,
    daily_reminder_time TIME DEFAULT '09:00:00',

    -- Privacy preferences
    profile_public BOOLEAN DEFAULT false,
    show_reading_stats BOOLEAN DEFAULT true,

    -- Additional settings (flexible JSON)
    custom_settings JSONB DEFAULT '{}',

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    synced_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT user_settings_font_size_check CHECK (font_size BETWEEN 10 AND 32),
    CONSTRAINT user_settings_line_height_check CHECK (line_height BETWEEN 1.0 AND 3.0),
    CONSTRAINT user_settings_audio_speed_check CHECK (audio_speed BETWEEN 0.5 AND 2.0),
    CONSTRAINT user_settings_theme_check CHECK (theme IN ('light', 'dark', 'sepia', 'cosmic'))
);

-- Indexes for user_settings
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON public.user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_updated_at ON public.user_settings(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_settings_synced_at ON public.user_settings(synced_at);

-- RLS for user_settings
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own settings"
    ON public.user_settings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
    ON public.user_settings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
    ON public.user_settings FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ======================
-- 5. ACTION_PLANS TABLE
-- ======================
CREATE TABLE IF NOT EXISTS public.action_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    book_id TEXT NOT NULL,
    chapter_id TEXT,
    plan_title TEXT NOT NULL,
    plan_description TEXT,

    -- Plan structure
    goals TEXT[] DEFAULT '{}',
    steps JSONB DEFAULT '[]',
    deadline DATE,

    -- Progress tracking
    status TEXT DEFAULT 'active',
    completion_percentage INTEGER DEFAULT 0,
    completed_steps INTEGER DEFAULT 0,
    total_steps INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    synced_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,

    -- Constraints
    CONSTRAINT action_plans_book_id_check CHECK (char_length(book_id) > 0),
    CONSTRAINT action_plans_title_check CHECK (char_length(plan_title) > 0),
    CONSTRAINT action_plans_status_check CHECK (status IN ('active', 'completed', 'paused', 'abandoned')),
    CONSTRAINT action_plans_completion_check CHECK (completion_percentage BETWEEN 0 AND 100),
    CONSTRAINT action_plans_steps_check CHECK (completed_steps >= 0 AND completed_steps <= total_steps)
);

-- Indexes for action_plans
CREATE INDEX IF NOT EXISTS idx_action_plans_user_id ON public.action_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_action_plans_book_id ON public.action_plans(book_id);
CREATE INDEX IF NOT EXISTS idx_action_plans_chapter_id ON public.action_plans(chapter_id);
CREATE INDEX IF NOT EXISTS idx_action_plans_status ON public.action_plans(status);
CREATE INDEX IF NOT EXISTS idx_action_plans_deadline ON public.action_plans(deadline) WHERE deadline IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_action_plans_updated_at ON public.action_plans(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_action_plans_synced_at ON public.action_plans(synced_at);
CREATE INDEX IF NOT EXISTS idx_action_plans_deleted_at ON public.action_plans(deleted_at) WHERE deleted_at IS NOT NULL;

-- RLS for action_plans
ALTER TABLE public.action_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own action plans"
    ON public.action_plans FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own action plans"
    ON public.action_plans FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own action plans"
    ON public.action_plans FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own action plans"
    ON public.action_plans FOR DELETE
    USING (auth.uid() = user_id);

-- ======================
-- 6. KOAN_HISTORY TABLE
-- ======================
CREATE TABLE IF NOT EXISTS public.koan_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    koan_id TEXT NOT NULL,
    koan_text TEXT NOT NULL,

    -- User interaction
    user_response TEXT,
    contemplation_duration INTEGER DEFAULT 0,
    rating INTEGER,

    -- Context
    book_id TEXT,
    chapter_id TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    synced_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,

    -- Constraints
    CONSTRAINT koan_history_koan_id_check CHECK (char_length(koan_id) > 0),
    CONSTRAINT koan_history_koan_text_check CHECK (char_length(koan_text) > 0),
    CONSTRAINT koan_history_duration_check CHECK (contemplation_duration >= 0),
    CONSTRAINT koan_history_rating_check CHECK (rating IS NULL OR (rating BETWEEN 1 AND 5))
);

-- Indexes for koan_history
CREATE INDEX IF NOT EXISTS idx_koan_history_user_id ON public.koan_history(user_id);
CREATE INDEX IF NOT EXISTS idx_koan_history_koan_id ON public.koan_history(koan_id);
CREATE INDEX IF NOT EXISTS idx_koan_history_book_id ON public.koan_history(book_id);
CREATE INDEX IF NOT EXISTS idx_koan_history_chapter_id ON public.koan_history(chapter_id);
CREATE INDEX IF NOT EXISTS idx_koan_history_created_at ON public.koan_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_koan_history_updated_at ON public.koan_history(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_koan_history_synced_at ON public.koan_history(synced_at);
CREATE INDEX IF NOT EXISTS idx_koan_history_deleted_at ON public.koan_history(deleted_at) WHERE deleted_at IS NOT NULL;

-- RLS for koan_history
ALTER TABLE public.koan_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own koan history"
    ON public.koan_history FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own koan history"
    ON public.koan_history FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own koan history"
    ON public.koan_history FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own koan history"
    ON public.koan_history FOR DELETE
    USING (auth.uid() = user_id);

-- ======================
-- 7. AI_SIGNATURES TABLE
-- ======================
-- Note: This table already exists in migration 001_initial_schema.sql
-- but we'll ensure it has all necessary fields for sync
CREATE TABLE IF NOT EXISTS public.ai_signatures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Signature data
    signature_type TEXT NOT NULL,
    signature_data JSONB NOT NULL DEFAULT '{}',

    -- Metadata
    context TEXT,
    model_version TEXT DEFAULT 'v1',
    confidence_score DECIMAL(5,4),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    synced_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,

    -- Constraints
    CONSTRAINT ai_signatures_type_check CHECK (char_length(signature_type) > 0),
    CONSTRAINT ai_signatures_confidence_check CHECK (confidence_score IS NULL OR (confidence_score BETWEEN 0 AND 1))
);

-- Indexes for ai_signatures (only create if not exists)
CREATE INDEX IF NOT EXISTS idx_ai_signatures_user_id ON public.ai_signatures(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_signatures_type ON public.ai_signatures(signature_type);
CREATE INDEX IF NOT EXISTS idx_ai_signatures_created_at ON public.ai_signatures(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_signatures_updated_at ON public.ai_signatures(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_signatures_synced_at ON public.ai_signatures(synced_at);
CREATE INDEX IF NOT EXISTS idx_ai_signatures_expires_at ON public.ai_signatures(expires_at) WHERE expires_at IS NOT NULL;

-- RLS for ai_signatures
ALTER TABLE public.ai_signatures ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own signatures" ON public.ai_signatures;
CREATE POLICY "Users can view their own signatures"
    ON public.ai_signatures FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own signatures" ON public.ai_signatures;
CREATE POLICY "Users can insert their own signatures"
    ON public.ai_signatures FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own signatures" ON public.ai_signatures;
CREATE POLICY "Users can update their own signatures"
    ON public.ai_signatures FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own signatures" ON public.ai_signatures;
CREATE POLICY "Users can delete their own signatures"
    ON public.ai_signatures FOR DELETE
    USING (auth.uid() = user_id);

-- ======================
-- 8. READING_PROGRESS TABLE
-- ======================
CREATE TABLE IF NOT EXISTS public.reading_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    book_id TEXT NOT NULL,
    chapter_id TEXT NOT NULL,

    -- Progress tracking
    paragraph_index INTEGER DEFAULT 0,
    scroll_position INTEGER DEFAULT 0,
    completion_percentage INTEGER DEFAULT 0,
    time_spent_seconds INTEGER DEFAULT 0,

    -- Session tracking
    last_read_at TIMESTAMPTZ DEFAULT NOW(),
    read_count INTEGER DEFAULT 1,

    -- Flags
    is_completed BOOLEAN DEFAULT false,
    is_bookmarked BOOLEAN DEFAULT false,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    synced_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT reading_progress_book_id_check CHECK (char_length(book_id) > 0),
    CONSTRAINT reading_progress_chapter_id_check CHECK (char_length(chapter_id) > 0),
    CONSTRAINT reading_progress_paragraph_check CHECK (paragraph_index >= 0),
    CONSTRAINT reading_progress_scroll_check CHECK (scroll_position >= 0),
    CONSTRAINT reading_progress_completion_check CHECK (completion_percentage BETWEEN 0 AND 100),
    CONSTRAINT reading_progress_time_check CHECK (time_spent_seconds >= 0),
    CONSTRAINT reading_progress_count_check CHECK (read_count > 0),

    -- Unique constraint: one progress record per user+book+chapter
    CONSTRAINT unique_user_book_chapter UNIQUE (user_id, book_id, chapter_id)
);

-- Indexes for reading_progress
CREATE INDEX IF NOT EXISTS idx_reading_progress_user_id ON public.reading_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_progress_book_id ON public.reading_progress(book_id);
CREATE INDEX IF NOT EXISTS idx_reading_progress_chapter_id ON public.reading_progress(chapter_id);
CREATE INDEX IF NOT EXISTS idx_reading_progress_last_read ON public.reading_progress(last_read_at DESC);
CREATE INDEX IF NOT EXISTS idx_reading_progress_updated_at ON public.reading_progress(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_reading_progress_synced_at ON public.reading_progress(synced_at);
CREATE INDEX IF NOT EXISTS idx_reading_progress_completed ON public.reading_progress(is_completed) WHERE is_completed = true;
CREATE INDEX IF NOT EXISTS idx_reading_progress_bookmarked ON public.reading_progress(is_bookmarked) WHERE is_bookmarked = true;

-- RLS for reading_progress
ALTER TABLE public.reading_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reading progress"
    ON public.reading_progress FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reading progress"
    ON public.reading_progress FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reading progress"
    ON public.reading_progress FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reading progress"
    ON public.reading_progress FOR DELETE
    USING (auth.uid() = user_id);

-- ======================
-- TRIGGERS: AUTO-UPDATE updated_at
-- ======================

-- Helper function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for all tables
CREATE TRIGGER update_notes_updated_at
    BEFORE UPDATE ON public.notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookmarks_updated_at
    BEFORE UPDATE ON public.bookmarks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reflections_updated_at
    BEFORE UPDATE ON public.reflections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at
    BEFORE UPDATE ON public.user_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_action_plans_updated_at
    BEFORE UPDATE ON public.action_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_koan_history_updated_at
    BEFORE UPDATE ON public.koan_history
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_signatures_updated_at
    BEFORE UPDATE ON public.ai_signatures
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reading_progress_updated_at
    BEFORE UPDATE ON public.reading_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ======================
-- COMMENTS FOR DOCUMENTATION
-- ======================

COMMENT ON TABLE public.notes IS 'User notes on book content with support for highlights and annotations';
COMMENT ON TABLE public.bookmarks IS 'User bookmarks for quick navigation to specific book locations';
COMMENT ON TABLE public.reflections IS 'User reflections on questions and contemplative exercises';
COMMENT ON TABLE public.user_settings IS 'User preferences for reading, audio, and notifications';
COMMENT ON TABLE public.action_plans IS 'User-created action plans derived from book teachings';
COMMENT ON TABLE public.koan_history IS 'History of user interactions with contemplative koans';
COMMENT ON TABLE public.ai_signatures IS 'AI-generated user signatures for personalization';
COMMENT ON TABLE public.reading_progress IS 'Detailed tracking of user reading progress per chapter';

-- ======================
-- MIGRATION COMPLETE
-- ======================
-- All 8 base sync tables created successfully
-- Ready for web-mobile bidirectional synchronization
-- =====================================================
