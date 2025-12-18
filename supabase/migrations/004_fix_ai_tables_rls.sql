-- =============================================
-- Migration 004: Fix AI Tables RLS Security
-- Coleccion Nuevo Ser
-- Date: 2024-12-16
-- =============================================
-- This migration adds missing RLS policies to AI tables
-- that were created in 003_phase5_ai_features.sql
-- =============================================

-- Enable RLS on AI tables (if not already enabled)
ALTER TABLE IF EXISTS ai_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ai_activity_log ENABLE ROW LEVEL SECURITY;

-- =============================================
-- AI_MISSIONS Policies
-- =============================================

-- Users can view their own missions
DROP POLICY IF EXISTS "Users can view own missions" ON ai_missions;
CREATE POLICY "Users can view own missions" ON ai_missions
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own missions
DROP POLICY IF EXISTS "Users can create missions" ON ai_missions;
CREATE POLICY "Users can create missions" ON ai_missions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own missions
DROP POLICY IF EXISTS "Users can update own missions" ON ai_missions;
CREATE POLICY "Users can update own missions" ON ai_missions
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own missions
DROP POLICY IF EXISTS "Users can delete own missions" ON ai_missions;
CREATE POLICY "Users can delete own missions" ON ai_missions
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- AI_CONVERSATIONS Policies
-- =============================================

-- Users can view conversations from their missions
DROP POLICY IF EXISTS "Users can view own conversations" ON ai_conversations;
CREATE POLICY "Users can view own conversations" ON ai_conversations
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert conversations
DROP POLICY IF EXISTS "Users can create conversations" ON ai_conversations;
CREATE POLICY "Users can create conversations" ON ai_conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own conversations
DROP POLICY IF EXISTS "Users can update own conversations" ON ai_conversations;
CREATE POLICY "Users can update own conversations" ON ai_conversations
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own conversations
DROP POLICY IF EXISTS "Users can delete own conversations" ON ai_conversations;
CREATE POLICY "Users can delete own conversations" ON ai_conversations
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- AI_ACTIVITY_LOG Policies
-- =============================================

-- Users can view their own activity
DROP POLICY IF EXISTS "Users can view own activity" ON ai_activity_log;
CREATE POLICY "Users can view own activity" ON ai_activity_log
  FOR SELECT USING (auth.uid() = user_id);

-- Users can log their own activity
DROP POLICY IF EXISTS "Users can log activity" ON ai_activity_log;
CREATE POLICY "Users can log activity" ON ai_activity_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Activity log should not be updated or deleted by users
-- Only admins via service_role can modify

-- =============================================
-- Nota: Admin access se maneja via service_role key
-- No se requiere política especial de admin en RLS
-- =============================================

-- =============================================
-- Indexes for Performance
-- =============================================

-- Index for faster user lookups in AI tables
CREATE INDEX IF NOT EXISTS idx_ai_missions_user_id ON ai_missions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_mission_id ON ai_conversations(mission_id);
CREATE INDEX IF NOT EXISTS idx_ai_activity_log_user_id ON ai_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_activity_log_feature ON ai_activity_log(feature);
CREATE INDEX IF NOT EXISTS idx_ai_activity_log_created_at ON ai_activity_log(created_at DESC);

-- =============================================
-- Grant permissions
-- =============================================

GRANT SELECT, INSERT, UPDATE, DELETE ON ai_missions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ai_conversations TO authenticated;
GRANT SELECT, INSERT ON ai_activity_log TO authenticated;

-- =============================================
-- Comments
-- =============================================

COMMENT ON POLICY "Users can view own missions" ON ai_missions IS 'Users can only see their own AI missions';
COMMENT ON POLICY "Users can view own conversations" ON ai_conversations IS 'Users can only see conversations from their own missions';
COMMENT ON POLICY "Users can view own activity" ON ai_activity_log IS 'Users can see their own AI usage activity';
