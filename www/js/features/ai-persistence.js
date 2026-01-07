(() => {
  const SUPABASE_TABLES = {
    missions: 'ai_missions',
    conversations: 'ai_conversations',
    activity: 'ai_activity_log',
  };

  function getUserId() {
    return window.authHelper?.getUser?.()?.id || null;
  }

  async function createMission({
    userId = getUserId(),
    name,
    source,
    parameters = {},
    status = 'generated',
  }) {
    if (!userId) {
      logger.warn('AI Persistence: usuario no autenticado, la misión no se guardará');
      return null;
    }
    const { data, error } = await window.supabase
      .from(SUPABASE_TABLES.missions)
      .insert({
        user_id: userId,
        mission_name: name,
        source,
        parameters,
        status,
      })
      .select()
      .single();

    if (error) {
      logger.error('AI Persistence > createMission:', error);
      return null;
    }

    return data;
  }

  async function logConversation({ missionId = null, userId = getUserId(), message, role = 'user', metadata = {} }) {
    if (!userId) {
      logger.warn('AI Persistence: usuario no autenticado, la conversación no se guarda');
      return;
    }
    const { error } = await window.supabase
      .from(SUPABASE_TABLES.conversations)
      .insert({
        mission_id: missionId,
        user_id: userId,
        message,
        role,
        metadata,
      });

    if (error) {
      logger.error('AI Persistence > logConversation:', error);
    }
  }

  async function logActivity({ userId = getUserId(), feature, creditsUsed, outcome = 'success', payload = {} }) {
    if (!userId) {
      logger.warn('AI Persistence: usuario no autenticado, la actividad no se guarda');
      return;
    }
    const { error } = await window.supabase
      .from(SUPABASE_TABLES.activity)
      .insert({
        user_id: userId,
        feature,
        credits_used: creditsUsed,
        outcome,
        payload,
      });

    if (error) {
      logger.error('AI Persistence > logActivity:', error);
    }
  }

  async function fetchMissionSummary(limit = 5) {
    const { data, error } = await window.supabase
      .from('ai_missions_summary')
      .select('*')
      .order('last_update', { ascending: false })
      .limit(limit);
    if (error) {
      logger.error('AI Persistence > fetchMissionSummary:', error);
      return [];
    }
    return data;
  }

  async function fetchRecentActivity(limit = 10) {
    const { data, error } = await window.supabase
      .from(SUPABASE_TABLES.activity)
      .select('feature, credits_used, outcome, payload, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) {
      logger.error('AI Persistence > fetchRecentActivity:', error);
      return [];
    }
    return data;
  }

  async function fetchActiveUsers() {
    const { data, error } = await window.supabase
      .from('ai_active_users')
      .select('*')
      .order('mission_count', { ascending: false });
    if (error) {
      logger.error('AI Persistence > fetchActiveUsers:', error);
      return [];
    }
    return data;
  }

  window.aiPersistence = {
    createMission,
    logConversation,
    logActivity,
    fetchMissionSummary,
    fetchRecentActivity,
    fetchActiveUsers,
  };
})();
