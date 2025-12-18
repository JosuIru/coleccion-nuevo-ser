/**
 * ACTIVE MISSIONS SCREEN
 * Muestra misiones activas y su progreso en tiempo real
 *
 * @version 1.0.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Animated,
  Alert
} from 'react-native';
import useGameStore from '../stores/gameStore';
import MissionService from '../services/MissionService';
import { COLORS, CRISIS_TYPES } from '../config/constants';
import logger from '../utils/logger';

const ActiveMissionsScreen = ({ navigation }) => {
  const [activeMissions, setActiveMissions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [completedCount, setCompletedCount] = useState(0);

  const { user, beings } = useGameStore();
  const timerRef = useRef(null);

  // Cargar misiones activas
  useEffect(() => {
    loadActiveMissions();
    return () => clearTimeout(timerRef.current);
  }, []);

  // Actualizar misiones cada 5 segundos
  useEffect(() => {
    timerRef.current = setInterval(() => {
      loadActiveMissions();
    }, 5000);

    return () => clearInterval(timerRef.current);
  }, []);

  const loadActiveMissions = async () => {
    try {
      setLoading(true);
      // Cargar datos en caché primero
      await MissionService.loadCachedData(user?.id);
      const missions = MissionService.getActiveMissions();
      setActiveMissions(missions);
      setCompletedCount(MissionService.getCompletedMissionsCount());
    } catch (error) {
      logger.error('ActiveMissionsScreen', 'Error loading missions', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadActiveMissions().finally(() => setRefreshing(false));
  };

  const handleCancelMission = (missionId) => {
    Alert.alert(
      'Cancelar Misión',
      '¿Realmente quieres cancelar esta misión? No recibirás recompensas.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          onPress: async () => {
            await MissionService.cancelMission(missionId, useGameStore);
            loadActiveMissions();
          },
          style: 'destructive'
        }
      ]
    );
  };

  const getMissionIcon = (crisisType) => {
    return CRISIS_TYPES[crisisType]?.icon || '🚨';
  };

  const getProgressColor = (progress) => {
    if (progress < 0.33) return COLORS.accent.critical;
    if (progress < 0.66) return COLORS.accent.warning;
    return COLORS.accent.success;
  };

  const renderMissionCard = ({ item: mission }) => {
    const progress = mission.elapsed_minutes / (mission.duration_minutes || mission.durationMinutes || 60);
    const progressColor = getProgressColor(progress);
    const beingName = beings.find(b => b.id === mission.being_id)?.name ||
                      (mission.teamData?.beingNames?.[0]) || 'Ser desplegado';

    return (
      <View style={styles.missionCard}>
        {/* Header */}
        <View style={[styles.missionHeader, { backgroundColor: progressColor }]}>
          <Text style={styles.missionIcon}>{getMissionIcon(mission.crisis_type)}</Text>
          <View style={styles.missionTitleContainer}>
            <Text style={styles.missionTitle} numberOfLines={2}>
              {mission.crisis_title}
            </Text>
            <Text style={styles.missionBeing}>{beingName}</Text>
          </View>
          <Text style={styles.urgencyBadge}>{mission.urgency}/10</Text>
        </View>

        {/* Progreso */}
        <View style={styles.missionBody}>
          <View style={styles.progressSection}>
            <View style={styles.progressLabels}>
              <Text style={styles.progressLabel}>
                {mission.elapsed_minutes} / {mission.duration_minutes || mission.durationMinutes} min
              </Text>
              <Text style={styles.probabilityLabel}>
                {(mission.success_probability * 100).toFixed(0)}% éxito
              </Text>
            </View>
            {/* Barra de progreso simple */}
            <View style={styles.progressBarContainer}>
              <View style={[
                styles.progressBarFill,
                { width: `${Math.min(progress * 100, 100)}%`, backgroundColor: progressColor }
              ]} />
            </View>
          </View>

          {/* Info de recompensas */}
          <View style={styles.rewardsSection}>
            <View style={styles.rewardItem}>
              <Text style={styles.rewardIcon}>⭐</Text>
              <Text style={styles.rewardText}>
                {mission.estimated_xp_reward} XP
              </Text>
            </View>
            <View style={styles.rewardItem}>
              <Text style={styles.rewardIcon}>🌟</Text>
              <Text style={styles.rewardText}>
                {mission.estimated_consciousness_reward} Consciencia
              </Text>
            </View>
            <View style={styles.rewardItem}>
              <Text style={styles.rewardIcon}>👥</Text>
              <Text style={styles.rewardText}>
                {mission.teamData?.teamSize || 1} ser(es)
              </Text>
            </View>
          </View>
        </View>

        {/* Footer con botones */}
        <View style={styles.missionFooter}>
          {progress >= 1 ? (
            <View style={styles.completeIndicator}>
              <Text style={styles.completeText}>✓ Misión completada</Text>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => handleCancelMission(mission.id)}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>🎯</Text>
      <Text style={styles.emptyTitle}>Sin Misiones Activas</Text>
      <Text style={styles.emptyText}>
        Selecciona una crisis en el mapa para comenzar una misión
      </Text>
      <TouchableOpacity
        onPress={() => navigation.navigate('Map')}
        style={styles.emptyButton}
      >
        <Text style={styles.emptyButtonText}>Ver Crisis en Mapa</Text>
      </TouchableOpacity>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View>
        <Text style={styles.headerTitle}>Misiones Activas</Text>
        <Text style={styles.headerSubtitle}>
          {activeMissions.length} en progreso • {completedCount} completadas
        </Text>
      </View>
      <View style={styles.headerStats}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{activeMissions.length}</Text>
          <Text style={styles.statLabel}>Activas</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{user.level}</Text>
          <Text style={styles.statLabel}>Nivel</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={activeMissions}
        renderItem={renderMissionCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        scrollIndicatorInsets={{ right: 1 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg.primary
  },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    backgroundColor: COLORS.bg.elevated,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.bg.card
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: 4
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: 12
  },
  headerStats: {
    flexDirection: 'row',
    gap: 12
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.bg.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.accent.primary
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginTop: 2
  },

  // Lista
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12
  },

  // Misión Card
  missionCard: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: COLORS.bg.elevated,
    borderWidth: 1,
    borderColor: COLORS.bg.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  missionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12
  },
  missionIcon: {
    fontSize: 32
  },
  missionTitleContainer: {
    flex: 1
  },
  missionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2
  },
  missionBeing: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)'
  },
  urgencyBadge: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 6
  },

  // Body
  missionBody: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.bg.card
  },
  progressSection: {
    marginBottom: 12
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  progressLabel: {
    fontSize: 13,
    color: COLORS.text.secondary
  },
  probabilityLabel: {
    fontSize: 13,
    color: COLORS.accent.success,
    fontWeight: '600'
  },
  progressBarContainer: {
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.bg.card,
    overflow: 'hidden'
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4
  },
  rewardsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around'
  },
  rewardItem: {
    alignItems: 'center',
    gap: 4
  },
  rewardIcon: {
    fontSize: 20
  },
  rewardText: {
    fontSize: 12,
    color: COLORS.text.secondary,
    textAlign: 'center'
  },

  // Footer
  missionFooter: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.bg.card
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: COLORS.accent.critical,
    borderRadius: 6,
    alignItems: 'center'
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600'
  },
  completeIndicator: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: COLORS.accent.success,
    borderRadius: 6,
    alignItems: 'center'
  },
  completeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600'
  },

  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: 8,
    textAlign: 'center'
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24
  },
  emptyButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: COLORS.accent.primary,
    borderRadius: 8
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  }
});

export default ActiveMissionsScreen;
