import AsyncStorage from '@react-native-async-storage/async-storage';
import useGameStore from '../../stores/gameStore';
import webBridgeService from '../../services/WebBridgeService';

const LOCAL_KEY = 'trascendencia_local_state_v1';
const REMOTE_TABLE = 'trascendencia_state';

class TrascendenciaSyncService {
  async loadLocalState() {
    const raw = await AsyncStorage.getItem(LOCAL_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  async saveLocalState(state) {
    const payload = this.normalizeState(state);
    await AsyncStorage.setItem(LOCAL_KEY, JSON.stringify(payload));
    return payload;
  }

  normalizeState(state) {
    if (!state) return null;
    const updatedAt = state.updatedAt || new Date().toISOString();
    return {
      planId: state.planId || 'free',
      activeMissionId: state.activeMissionId || null,
      checkins: Array.isArray(state.checkins) ? state.checkins : [],
      missionStreak: state.missionStreak || 0,
      ritualStreak: state.ritualStreak || 0,
      selectedBeingId: state.selectedBeingId || null,
      lastRitualAt: state.lastRitualAt || null,
      updatedAt
    };
  }

  getSupabaseClient() {
    return webBridgeService?.supabase || null;
  }

  async canSync() {
    const supabase = this.getSupabaseClient();
    const userId = useGameStore.getState().user?.id;
    if (!supabase || !userId) {
      return false;
    }

    try {
      const raw = await AsyncStorage.getItem('webapp_auth_session');
      if (!raw) return false;
      const session = JSON.parse(raw);
      return !!(session?.access_token || session?.accessToken);
    } catch (error) {
      return false;
    }
  }

  async ensureSession(supabase) {
    try {
      const raw = await AsyncStorage.getItem('webapp_auth_session');
      if (!raw) return false;
      const session = JSON.parse(raw);
      const accessToken = session?.access_token || session?.accessToken;
      const refreshToken = session?.refresh_token || session?.refreshToken;
      if (!accessToken || !refreshToken) return false;
      await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  resolveState(localState, remoteState) {
    if (!localState && !remoteState) return null;
    if (!localState) return remoteState;
    if (!remoteState) return localState;

    const localTime = new Date(localState.updatedAt || 0).getTime();
    const remoteTime = new Date(remoteState.updatedAt || 0).getTime();
    return localTime >= remoteTime ? localState : remoteState;
  }

  async syncWithSupabase(localState) {
    const supabase = this.getSupabaseClient();
    const userId = useGameStore.getState().user?.id;
    if (!supabase || !userId) {
      return { status: 'skipped', reason: 'no_supabase_or_user' };
    }

    await this.ensureSession(supabase);

    const { data, error } = await supabase
      .from(REMOTE_TABLE)
      .select('state,updated_at')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      const message = error.message || '';
      if (message.includes(REMOTE_TABLE) || message.includes('relation')) {
        return { status: 'pending_migration', error };
      }
      return { status: 'error', error };
    }

    const remoteState = this.normalizeState({
      ...(data?.state || {}),
      updatedAt: data?.state?.updatedAt || data?.updated_at || null
    });
    const normalizedLocal = this.normalizeState(localState);
    const resolved = this.resolveState(normalizedLocal, remoteState);

    if (!resolved) {
      return { status: 'empty' };
    }

    const localTime = new Date(normalizedLocal?.updatedAt || 0).getTime();
    const remoteTime = new Date(remoteState?.updatedAt || 0).getTime();
    const shouldPush = !remoteState || localTime >= remoteTime;

    if (shouldPush) {
      const { error: upsertError } = await supabase
        .from(REMOTE_TABLE)
        .upsert(
          {
            user_id: userId,
            state: resolved,
            updated_at: resolved.updatedAt
          },
          { onConflict: 'user_id' }
        );

      if (upsertError) {
        return { status: 'error', error: upsertError };
      }

      return { status: 'synced', source: 'local', state: resolved };
    }

    await this.saveLocalState(resolved);
    return { status: 'synced', source: 'remote', state: resolved };
  }
}

export default new TrascendenciaSyncService();
