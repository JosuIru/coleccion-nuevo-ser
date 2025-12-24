import { create } from 'zustand';
import { MISSION_TEMPLATES } from '../data/missionTemplates';
import { PLAN_TIERS } from '../config/planTiers';
import trascendenciaSyncService from '../services/TrascendenciaSyncService';
import serviceManager from '../../services/ServiceManager';
import logger from '../../utils/logger';

let pendingSyncTimer = null;
const scheduleSync = (fn, delayMs = 1500) => {
  if (pendingSyncTimer) {
    clearTimeout(pendingSyncTimer);
  }
  pendingSyncTimer = setTimeout(fn, delayMs);
};

const defaultState = {
  plan: PLAN_TIERS.free,
  planId: PLAN_TIERS.free.id,
  missions: MISSION_TEMPLATES,
  activeMissionId: null,
  checkins: [],
  ritualStreak: 0,
  missionStreak: 0,
  selectedBeingId: null,
  lastRitualAt: null,
  updatedAt: null,
  syncStatus: 'idle'
};

export const useTrascendenciaStore = create((set, get) => ({
  ...defaultState,

  async hydrateFromStorage() {
    const stored = await trascendenciaSyncService.loadLocalState();
    if (!stored) return;

    get().applySyncedState(stored);
  },

  persistLocalState() {
    const snapshot = get();
    const updatedAt = new Date().toISOString();
    set({ updatedAt });
    trascendenciaSyncService.saveLocalState({
      planId: snapshot.planId,
      checkins: snapshot.checkins,
      activeMissionId: snapshot.activeMissionId,
      missionStreak: snapshot.missionStreak,
      ritualStreak: snapshot.ritualStreak,
      selectedBeingId: snapshot.selectedBeingId,
      lastRitualAt: snapshot.lastRitualAt,
      updatedAt
    });
  },

  applySyncedState(state) {
    const planId = state.planId || PLAN_TIERS.free.id;
    set({
      activeMissionId: state.activeMissionId || null,
      checkins: state.checkins || [],
      missionStreak: state.missionStreak || 0,
      ritualStreak: state.ritualStreak || 0,
      selectedBeingId: state.selectedBeingId || null,
      lastRitualAt: state.lastRitualAt || null,
      planId,
      plan: PLAN_TIERS[planId] || PLAN_TIERS.free,
      updatedAt: state.updatedAt || null
    });
  },

  async syncWithSupabase() {
    await serviceManager.getSync();
    const snapshot = get();
    set({ syncStatus: 'syncing' });
    const result = await trascendenciaSyncService.syncWithSupabase(snapshot);
    if (result?.source === 'remote' && result.state) {
      get().applySyncedState(result.state);
    }
    if (result?.status === 'pending_migration') {
      set({ syncStatus: 'pending_migration' });
    } else if (result?.status === 'synced') {
      set({ syncStatus: 'synced' });
    } else if (result?.status === 'error') {
      set({ syncStatus: 'error' });
    }
    return result;
  },

  scheduleSync() {
    scheduleSync(async () => {
      const canSync = await trascendenciaSyncService.canSync();
      if (!canSync) {
        logger.info('TrascendenciaSync', 'Sync omitido: sin sesion valida');
        return;
      }
      const result = await get().syncWithSupabase();
      if (result?.status === 'pending_migration') {
        logger.warn('TrascendenciaSync', 'Sync pendiente: migracion Supabase requerida');
      }
    });
  },

  setPlan(planId) {
    const nextPlan = PLAN_TIERS[planId] || PLAN_TIERS.free;
    set({ plan: nextPlan, planId: nextPlan.id });
    get().persistLocalState();
    get().scheduleSync();
  },

  setActiveMission(missionId) {
    set({ activeMissionId: missionId });
    get().persistLocalState();
    get().scheduleSync();
  },

  addCheckin(checkin) {
    const nextCheckins = [checkin, ...get().checkins].slice(0, 50);
    set({ checkins: nextCheckins });
    get().persistLocalState();
    get().scheduleSync();
  },

  setSelectedBeing(beingId) {
    set({ selectedBeingId: beingId });
    get().persistLocalState();
    get().scheduleSync();
  },

  bumpMissionStreak() {
    set({ missionStreak: get().missionStreak + 1 });
    get().persistLocalState();
    get().scheduleSync();
  },

  bumpRitualStreak() {
    set({ ritualStreak: get().ritualStreak + 1 });
    get().persistLocalState();
    get().scheduleSync();
  },

  completeRitual() {
    set({
      ritualStreak: get().ritualStreak + 1,
      lastRitualAt: new Date().toISOString()
    });
    get().persistLocalState();
    get().scheduleSync();
  }
}));
