import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTrascendenciaStore } from '../stores/trascendenciaStore';
import useGameStore from '../../stores/gameStore';
import { RITUAL_TEMPLATES } from '../data/ritualTemplates';

export default function HomeScreen() {
  const {
    missions,
    activeMissionId,
    setActiveMission,
    selectedBeingId,
    hydrateFromStorage,
    syncWithSupabase,
    completeRitual,
    lastRitualAt,
    syncStatus
  } = useTrascendenciaStore();
  const { beings, addXP } = useGameStore();
  const activeMission = missions.find(m => m.id === activeMissionId) || missions[0];
  const selectedBeing = (beings || []).find(b => b.id === selectedBeingId);
  const ritual = RITUAL_TEMPLATES[0];
  const ritualDate = lastRitualAt ? new Date(lastRitualAt) : null;
  const isSameDay = ritualDate
    ? ritualDate.toDateString() === new Date().toDateString()
    : false;

  useEffect(() => {
    const run = async () => {
      await hydrateFromStorage();
      await syncWithSupabase();
    };
    run();
  }, [hydrateFromStorage, syncWithSupabase]);

  const handleRitual = () => {
    if (isSameDay) return;
    completeRitual();
    addXP(ritual.baseXp);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Trascendencia</Text>
      <Text style={styles.subtitle}>Mision real activa</Text>

      {syncStatus !== 'idle' && syncStatus !== 'pending_migration' && (
        <View style={styles.syncStatusPill}>
          <Text style={styles.syncStatusText}>
            {syncStatus === 'syncing' ? 'Sincronizando...' : syncStatus === 'synced' ? 'Sync ok' : 'Sync con error'}
          </Text>
        </View>
      )}

      {syncStatus === 'pending_migration' && (
        <View style={styles.syncBanner}>
          <Text style={styles.syncBannerText}>Sync pendiente: falta migracion en Supabase.</Text>
          <TouchableOpacity style={styles.syncRetry} onPress={syncWithSupabase}>
            <Text style={styles.syncRetryText}>Reintentar sync</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.miniCard}>
        <Text style={styles.miniLabel}>Ser mentor</Text>
        <Text style={styles.miniValue}>{selectedBeing?.name || 'Sin seleccionar'}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{ritual.title}</Text>
        <Text style={styles.cardText}>{ritual.description}</Text>
        <TouchableOpacity
          style={[styles.cta, isSameDay ? styles.ctaDisabled : null]}
          onPress={handleRitual}
          disabled={isSameDay}
        >
          <Text style={styles.ctaText}>{isSameDay ? 'Ritual completado' : 'Completar ritual'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{activeMission.title}</Text>
        <Text style={styles.cardText}>{activeMission.description}</Text>
        <TouchableOpacity
          style={styles.cta}
          onPress={() => setActiveMission(activeMission.id)}
        >
          <Text style={styles.ctaText}>Activar mision</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.pulse}>
        <Text style={styles.pulseText}>Pulso planetario: 37%</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b1210',
    padding: 24
  },
  title: {
    color: '#e2fbe2',
    fontSize: 28,
    fontWeight: '700'
  },
  subtitle: {
    color: '#9bb79b',
    marginTop: 8,
    marginBottom: 16
  },
  card: {
    backgroundColor: '#122018',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e3a2a'
  },
  cardTitle: {
    color: '#e5f5e5',
    fontSize: 18,
    fontWeight: '600'
  },
  cardText: {
    color: '#aac6aa',
    marginTop: 8
  },
  cta: {
    marginTop: 12,
    backgroundColor: '#2b7a4b',
    paddingVertical: 10,
    borderRadius: 10
  },
  ctaDisabled: {
    backgroundColor: '#234a35'
  },
  ctaText: {
    color: '#eaffea',
    textAlign: 'center',
    fontWeight: '600'
  },
  pulse: {
    marginTop: 20,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#0f1c16',
    borderWidth: 1,
    borderColor: '#1f2f26'
  },
  pulseText: {
    color: '#8fd3a4'
  },
  miniCard: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#0f1c16',
    borderWidth: 1,
    borderColor: '#1f2f26'
  },
  miniLabel: {
    color: '#9bb79b',
    fontSize: 12
  },
  miniValue: {
    color: '#e2fbe2',
    marginTop: 4,
    fontWeight: '600'
  },
  syncBanner: {
    marginBottom: 12,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#2a2f17',
    borderWidth: 1,
    borderColor: '#4c4b1c'
  },
  syncBannerText: {
    color: '#e8e2a7',
    fontSize: 12
  },
  syncRetry: {
    marginTop: 8,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#40521d'
  },
  syncRetryText: {
    color: '#ecf1b9',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600'
  },
  syncStatusPill: {
    alignSelf: 'flex-start',
    marginBottom: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#1c2a22',
    borderWidth: 1,
    borderColor: '#2f4638'
  },
  syncStatusText: {
    color: '#9fd3b4',
    fontSize: 11,
    fontWeight: '600'
  }
});
