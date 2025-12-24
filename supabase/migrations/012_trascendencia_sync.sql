-- ============================================================================
-- MIGRATION 012: Trascendencia sync state
-- Stores Trascendencia local state for web-mobile sync.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.trascendencia_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  state JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trascendencia_state_user_id
  ON public.trascendencia_state(user_id);

CREATE INDEX IF NOT EXISTS idx_trascendencia_state_updated_at
  ON public.trascendencia_state(updated_at DESC);

ALTER TABLE public.trascendencia_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own trascendencia state"
  ON public.trascendencia_state
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trascendencia state"
  ON public.trascendencia_state
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trascendencia state"
  ON public.trascendencia_state
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
