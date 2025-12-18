/**
 * DAILY MISSIONS SCREEN
 * Muestra las misiones diarias y permite reclamar recompensas
 *
 * @version 1.0.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Animated
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import useGameStore from '../stores/gameStore';
import dailyMissionService from '../services/DailyMissionService';
import { COLORS } from '../config/constants';

const DailyMissionsScreen = ({ navigation }) => {
  const [missions, setMissions] = useState([]);
  const [streak, setStreak] = useState(0);
  const [streakBonus, setStreakBonus] = useState(null);
  const [timeUntilReset, setTimeUntilReset] = useState({ hours: 0, minutes: 0 });
  const [allCompleted, setAllCompleted] = useState(false);
  const [allClaimed, setAllClaimed] = useState(false);
  const [dailyBonusClaimed, setDailyBonusClaimed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [claimAnimation] = useState(new Animated.Value(1));

  const gameStore = useGameStore;

  // Cargar misiones al montar y al enfocar
  useFocusEffect(
    useCallback(() => {
      loadDailyMissions();
    }, [])
  );

  // Actualizar timer cada minuto
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeUntilReset(dailyMissionService.getTimeUntilReset());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const loadDailyMissions = async () => {
    try {
      await dailyMissionService.initialize();
      const data = await dailyMissionService.getDailyMissions();

      setMissions(data.missions);
      setStreak(data.streak);
      setStreakBonus(data.streakBonus);
      setTimeUntilReset(data.timeUntilReset);
      setAllCompleted(data.allCompleted);
      setAllClaimed(data.allClaimed);
    } catch (error) {
      console.error('Error loading daily missions:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDailyMissions();
    setRefreshing(false);
  };

  const handleClaimReward = async (missionId) => {
    // Animacion
    Animated.sequence([
      Animated.timing(claimAnimation, { toValue: 0.8, duration: 100, useNativeDriver: true }),
      Animated.timing(claimAnimation, { toValue: 1, duration: 100, useNativeDriver: true })
    ]).start();

    const result = await dailyMissionService.claimReward(missionId, gameStore);

    if (result.success) {
      await loadDailyMissions();

      // Guardar estado del juego
      gameStore.getState().saveToStorage();
    }
  };

  const handleClaimDailyBonus = async () => {
    const result = await dailyMissionService.claimDailyBonus(gameStore);

    if (result.success) {
      setDailyBonusClaimed(true);
      gameStore.getState().saveToStorage();
    }
  };

  const getMissionIcon = (type) => {
    const icons = {
      resolve_crisis: '🚨',
      deploy_beings: '🧬',
      explore: '🗺️',
      lab: '🔬',
      collection: '📚',
      consciousness: '🌟'
    };
    return icons[type] || '📋';
  };

  const renderMission = (mission) => {
    const progress = Math.min(mission.progress / mission.target, 1);
    const isCompleted = mission.completed;
    const isClaimed = mission.claimed;

    return (
      <View
        key={mission.id}
        style={[
          styles.missionCard,
          isCompleted && styles.missionCardCompleted,
          isClaimed && styles.missionCardClaimed
        ]}
      >
        <View style={styles.missionHeader}>
          <Text style={styles.missionIcon}>{getMissionIcon(mission.type)}</Text>
          <View style={styles.missionInfo}>
            <Text style={styles.missionTitle}>{mission.title}</Text>
            <Text style={styles.missionDescription}>{mission.description}</Text>
          </View>
          {isClaimed ? (
            <View style={styles.claimedBadge}>
              <Text style={styles.claimedText}>✓</Text>
            </View>
          ) : isCompleted ? (
            <TouchableOpacity
              style={styles.claimButton}
              onPress={() => handleClaimReward(mission.id)}
            >
              <Text style={styles.claimButtonText}>Reclamar</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Barra de progreso */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${progress * 100}%` },
                isCompleted && styles.progressFillComplete
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {mission.progress}/{mission.target}
          </Text>
        </View>

        {/* Recompensas */}
        <View style={styles.rewardsRow}>
          {mission.rewards.xp > 0 && (
            <View style={styles.rewardBadge}>
              <Text style={styles.rewardText}>+{mission.rewards.xp} XP</Text>
            </View>
          )}
          {mission.rewards.consciousness > 0 && (
            <View style={styles.rewardBadge}>
              <Text style={styles.rewardText}>+{mission.rewards.consciousness} 🌟</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Misiones Diarias</Text>
          <View style={styles.timerBadge}>
            <Text style={styles.timerIcon}>⏱️</Text>
            <Text style={styles.timerText}>{timeUntilReset.formatted}</Text>
          </View>
        </View>

        {/* Racha */}
        {streak > 0 && (
          <View style={styles.streakContainer}>
            <Text style={styles.streakIcon}>
              {streakBonus?.badge || '🔥'}
            </Text>
            <Text style={styles.streakText}>
              {streak} días seguidos
            </Text>
            {streakBonus && (
              <Text style={styles.streakBonus}>
                +{Math.round((streakBonus.multiplier - 1) * 100)}% bonus
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Lista de misiones */}
      <View style={styles.missionsContainer}>
        {missions.map(renderMission)}
      </View>

      {/* Bonus por completar todas */}
      {allClaimed && !dailyBonusClaimed && (
        <TouchableOpacity
          style={styles.dailyBonusCard}
          onPress={handleClaimDailyBonus}
        >
          <View style={styles.dailyBonusContent}>
            <Text style={styles.dailyBonusIcon}>🏆</Text>
            <View>
              <Text style={styles.dailyBonusTitle}>Bonus del Día</Text>
              <Text style={styles.dailyBonusDesc}>
                ¡Completaste todas las misiones!
              </Text>
            </View>
          </View>
          <View style={styles.dailyBonusRewards}>
            <Text style={styles.dailyBonusRewardText}>+150 XP</Text>
            <Text style={styles.dailyBonusRewardText}>+50 🌟</Text>
            <Text style={styles.dailyBonusRewardText}>+20 ⚡</Text>
          </View>
          <Text style={styles.tapToClaim}>Toca para reclamar</Text>
        </TouchableOpacity>
      )}

      {dailyBonusClaimed && (
        <View style={styles.allDoneCard}>
          <Text style={styles.allDoneIcon}>🎉</Text>
          <Text style={styles.allDoneTitle}>¡Todo completado!</Text>
          <Text style={styles.allDoneText}>
            Vuelve mañana para nuevas misiones
          </Text>
        </View>
      )}

      {/* Espacio inferior */}
      <View style={{ height: 100 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg.primary
  },

  // Header
  header: {
    padding: 20,
    backgroundColor: COLORS.bg.elevated,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.bg.card
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text.primary
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bg.card,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6
  },
  timerIcon: {
    fontSize: 14
  },
  timerText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    fontWeight: '600'
  },

  // Racha
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accent.warning + '20',
    padding: 12,
    borderRadius: 12,
    gap: 8
  },
  streakIcon: {
    fontSize: 24
  },
  streakText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    flex: 1
  },
  streakBonus: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.accent.warning
  },

  // Misiones
  missionsContainer: {
    padding: 16
  },
  missionCard: {
    backgroundColor: COLORS.bg.elevated,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.bg.card
  },
  missionCardCompleted: {
    borderColor: COLORS.accent.success + '50'
  },
  missionCardClaimed: {
    opacity: 0.7,
    borderColor: COLORS.bg.card
  },
  missionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12
  },
  missionIcon: {
    fontSize: 32
  },
  missionInfo: {
    flex: 1
  },
  missionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 2
  },
  missionDescription: {
    fontSize: 13,
    color: COLORS.text.secondary
  },

  // Claim button
  claimButton: {
    backgroundColor: COLORS.accent.success,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8
  },
  claimButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14
  },
  claimedBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.accent.success,
    alignItems: 'center',
    justifyContent: 'center'
  },
  claimedText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16
  },

  // Progreso
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: COLORS.bg.card,
    borderRadius: 4,
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.accent.primary,
    borderRadius: 4
  },
  progressFillComplete: {
    backgroundColor: COLORS.accent.success
  },
  progressText: {
    fontSize: 13,
    color: COLORS.text.secondary,
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'right'
  },

  // Recompensas
  rewardsRow: {
    flexDirection: 'row',
    gap: 8
  },
  rewardBadge: {
    backgroundColor: COLORS.bg.card,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12
  },
  rewardText: {
    fontSize: 12,
    color: COLORS.text.secondary,
    fontWeight: '600'
  },

  // Bonus diario
  dailyBonusCard: {
    margin: 16,
    backgroundColor: COLORS.accent.primary + '20',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: COLORS.accent.primary,
    borderStyle: 'dashed'
  },
  dailyBonusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12
  },
  dailyBonusIcon: {
    fontSize: 40
  },
  dailyBonusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text.primary
  },
  dailyBonusDesc: {
    fontSize: 14,
    color: COLORS.text.secondary
  },
  dailyBonusRewards: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 12
  },
  dailyBonusRewardText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.accent.primary
  },
  tapToClaim: {
    textAlign: 'center',
    fontSize: 14,
    color: COLORS.accent.primary,
    fontWeight: '600'
  },

  // Todo completado
  allDoneCard: {
    margin: 16,
    backgroundColor: COLORS.accent.success + '20',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center'
  },
  allDoneIcon: {
    fontSize: 48,
    marginBottom: 8
  },
  allDoneTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: 4
  },
  allDoneText: {
    fontSize: 14,
    color: COLORS.text.secondary
  }
});

export default DailyMissionsScreen;
