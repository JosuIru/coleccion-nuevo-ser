/**
 * LeagueScreen.js
 *
 * Pantalla de la Liga de Crisis semanal.
 * Muestra rankings, divisiones, estadísticas y crisis destacadas.
 *
 * @version 1.0.0
 * @date 2025-12-17
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import logger from '../utils/logger';

import { leagueService } from '../services/LeagueService';
import useGameStore from '../stores/gameStore';
import { COLORS } from '../config/constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================================================
// COMPONENTES AUXILIARES
// ============================================================================

/**
 * Card de información de la temporada
 */
const SeasonInfoCard = ({ seasonInfo }) => {
  return (
    <View style={styles.seasonCard}>
      <View style={styles.seasonHeader}>
        <Icon name="calendar-star" size={24} color="#eab308" />
        <Text style={styles.seasonTitle}>{seasonInfo.seasonName}</Text>
      </View>

      <View style={styles.seasonProgress}>
        <Text style={styles.seasonWeek}>Semana {seasonInfo.weekInSeason} de {seasonInfo.totalWeeksInSeason}</Text>
        <View style={styles.seasonProgressBar}>
          <View
            style={[
              styles.seasonProgressFill,
              { width: `${(seasonInfo.weekInSeason / seasonInfo.totalWeeksInSeason) * 100}%` }
            ]}
          />
        </View>
      </View>

      <View style={styles.timeRemaining}>
        <Icon name="clock-outline" size={16} color={COLORS.text.secondary} />
        <Text style={styles.timeRemainingText}>
          {seasonInfo.daysRemainingInWeek} días restantes esta semana
        </Text>
      </View>

      {seasonInfo.isLastWeekOfSeason && (
        <View style={styles.finalWeekBadge}>
          <Icon name="flag-checkered" size={14} color="#fff" />
          <Text style={styles.finalWeekText}>¡Última semana de temporada!</Text>
        </View>
      )}
    </View>
  );
};

/**
 * Card de división del jugador
 */
const DivisionCard = ({ stats }) => {
  if (!stats) return null;

  const { division, divisionProgress } = stats;

  return (
    <View style={[styles.divisionCard, { borderColor: division.color }]}>
      <View style={styles.divisionHeader}>
        <Text style={styles.divisionIcon}>{division.icon}</Text>
        <View style={styles.divisionInfo}>
          <Text style={styles.divisionName}>{division.name}</Text>
          <Text style={styles.divisionPoints}>{stats.weeklyPoints} pts</Text>
        </View>
      </View>

      {divisionProgress.next && (
        <View style={styles.progressSection}>
          <View style={styles.progressLabels}>
            <Text style={styles.progressCurrent}>{division.name}</Text>
            <Text style={styles.progressNext}>{divisionProgress.next.name}</Text>
          </View>
          <View style={styles.divisionProgressBar}>
            <View
              style={[
                styles.divisionProgressFill,
                {
                  width: `${divisionProgress.progress}%`,
                  backgroundColor: division.color
                }
              ]}
            />
          </View>
          <Text style={styles.pointsToNext}>
            {divisionProgress.pointsToNext} pts para {divisionProgress.next.name}
          </Text>
        </View>
      )}

      {!divisionProgress.next && (
        <View style={styles.maxDivisionBadge}>
          <Icon name="crown" size={16} color="#FFD700" />
          <Text style={styles.maxDivisionText}>¡División máxima alcanzada!</Text>
        </View>
      )}
    </View>
  );
};

/**
 * Card de estadísticas del jugador
 */
const PlayerStatsCard = ({ stats }) => {
  if (!stats) return null;

  return (
    <View style={styles.statsCard}>
      <Text style={styles.statsTitle}>Tus Estadísticas</Text>

      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <Icon name="fire" size={20} color="#ef4444" />
          <Text style={styles.statValue}>{stats.streak}</Text>
          <Text style={styles.statLabel}>Racha</Text>
        </View>

        <View style={styles.statBox}>
          <Icon name="calendar-today" size={20} color={COLORS.accent.primary} />
          <Text style={styles.statValue}>{stats.crisesResolvedToday}</Text>
          <Text style={styles.statLabel}>Hoy</Text>
        </View>

        <View style={styles.statBox}>
          <Icon name="calendar-week" size={20} color="#22c55e" />
          <Text style={styles.statValue}>{stats.crisesResolvedThisWeek}</Text>
          <Text style={styles.statLabel}>Semana</Text>
        </View>

        <View style={styles.statBox}>
          <Icon name="trophy" size={20} color="#eab308" />
          <Text style={styles.statValue}>{stats.bestWeeklyRank || '-'}</Text>
          <Text style={styles.statLabel}>Mejor Pos.</Text>
        </View>
      </View>

      <View style={styles.totalPointsRow}>
        <Text style={styles.totalPointsLabel}>Puntos totales:</Text>
        <Text style={styles.totalPointsValue}>{stats.totalPoints}</Text>
      </View>
    </View>
  );
};

/**
 * Fila del leaderboard
 */
const LeaderboardRow = ({ player, isCurrentPlayer }) => {
  const getRankStyle = (rank) => {
    if (rank === 1) return { backgroundColor: '#FFD700', color: '#000' };
    if (rank === 2) return { backgroundColor: '#C0C0C0', color: '#000' };
    if (rank === 3) return { backgroundColor: '#CD7F32', color: '#fff' };
    return { backgroundColor: COLORS.bg.elevated, color: COLORS.text.primary };
  };

  const rankStyle = getRankStyle(player.rank);

  return (
    <View style={[styles.leaderboardRow, isCurrentPlayer && styles.leaderboardRowCurrent]}>
      <View style={[styles.rankBadge, { backgroundColor: rankStyle.backgroundColor }]}>
        <Text style={[styles.rankText, { color: rankStyle.color }]}>{player.rank}</Text>
      </View>

      <Text style={styles.playerAvatar}>{player.avatar}</Text>

      <View style={styles.playerInfo}>
        <Text style={[styles.playerName, isCurrentPlayer && styles.playerNameCurrent]}>
          {player.username}
          {isCurrentPlayer && ' (Tú)'}
        </Text>
        <View style={styles.playerMeta}>
          <Text style={styles.divisionBadge}>{player.division.icon} {player.division.name}</Text>
          {player.streak >= 3 && (
            <View style={styles.streakBadge}>
              <Icon name="fire" size={12} color="#ef4444" />
              <Text style={styles.streakText}>{player.streak}</Text>
            </View>
          )}
        </View>
      </View>

      <Text style={styles.playerPoints}>{player.weeklyPoints}</Text>
    </View>
  );
};

/**
 * Card de crisis destacada
 */
const ChallengeCrisisCard = ({ crisis, onPress }) => {
  return (
    <TouchableOpacity style={styles.challengeCard} onPress={() => onPress(crisis)}>
      <View style={styles.challengeHeader}>
        <View style={styles.challengeBadge}>
          <Icon name="star" size={14} color="#fff" />
          <Text style={styles.challengeBadgeText}>Destacada</Text>
        </View>
        <Text style={styles.challengeMultiplier}>x{crisis.leagueMultiplier} pts</Text>
      </View>

      <Text style={styles.challengeTypeIcon}>{crisis.typeIcon}</Text>
      <Text style={styles.challengeTitle} numberOfLines={2}>{crisis.title}</Text>
      <Text style={styles.challengeLocation}>{crisis.locationName}</Text>

      <View style={styles.challengeRewards}>
        <Text style={styles.challengeRewardText}>
          +{crisis.rewards.xp * crisis.leagueMultiplier} XP
        </Text>
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

const LeagueScreen = ({ navigation }) => {
  // Estado
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [playerStats, setPlayerStats] = useState(null);
  const [playerRank, setPlayerRank] = useState(null);
  const [seasonInfo, setSeasonInfo] = useState(null);
  const [challengeCrises, setChallengeCrises] = useState([]);
  const [activeTab, setActiveTab] = useState('ranking'); // 'ranking' | 'challenges' | 'rewards'

  // Store
  const { user } = useGameStore();

  // Cargar datos al montar
  useEffect(() => {
    initializeLeague();
  }, []);

  const initializeLeague = async () => {
    setLoading(true);
    try {
      // Inicializar jugador en la liga
      await leagueService.initializePlayer(user.id, user.username);

      // Cargar todos los datos
      await loadAllData();
    } catch (error) {
      logger.error('LeagueScreen', 'Error initializing league:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAllData = async () => {
    try {
      const [lb, stats, rank, crises] = await Promise.all([
        leagueService.getWeeklyLeaderboard(),
        Promise.resolve(leagueService.getPlayerStats()),
        leagueService.getCurrentPlayerRank(),
        leagueService.getWeeklyChallengeCrises()
      ]);

      setLeaderboard(lb);
      setPlayerStats(stats);
      setPlayerRank(rank);
      setSeasonInfo(leagueService.getSeasonInfo());
      setChallengeCrises(crises);
    } catch (error) {
      logger.error('LeagueScreen', 'Error loading league data:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  };

  const handleChallengeCrisisPress = (crisis) => {
    // Navegar al centro de comando con la crisis seleccionada
    navigation.navigate('CommandCenter', { selectedCrisis: crisis });
  };

  // Render de tabs
  const renderContent = () => {
    switch (activeTab) {
      case 'ranking':
        return (
          <FlatList
            data={leaderboard.slice(0, 100)}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <LeaderboardRow
                player={item}
                isCurrentPlayer={item.isCurrentPlayer}
              />
            )}
            contentContainerStyle={styles.leaderboardList}
            ListHeaderComponent={
              <>
                {seasonInfo && <SeasonInfoCard seasonInfo={seasonInfo} />}
                <DivisionCard stats={playerStats} />
                <Text style={styles.sectionTitle}>Ranking Semanal</Text>
              </>
            }
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={COLORS.accent.primary}
              />
            }
          />
        );

      case 'challenges':
        return (
          <ScrollView
            contentContainerStyle={styles.challengesContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={COLORS.accent.primary}
              />
            }
          >
            <Text style={styles.sectionTitle}>Crisis Destacadas de la Semana</Text>
            <Text style={styles.sectionSubtitle}>
              Resuelve estas crisis para ganar puntos extra en la liga
            </Text>

            {challengeCrises.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Icon name="trophy-outline" size={48} color={COLORS.text.dim} />
                <Text style={styles.emptyText}>No hay crisis destacadas disponibles</Text>
              </View>
            ) : (
              <View style={styles.challengesGrid}>
                {challengeCrises.map(crisis => (
                  <ChallengeCrisisCard
                    key={crisis.id}
                    crisis={crisis}
                    onPress={handleChallengeCrisisPress}
                  />
                ))}
              </View>
            )}
          </ScrollView>
        );

      case 'rewards':
        return (
          <ScrollView
            contentContainerStyle={styles.rewardsContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={COLORS.accent.primary}
              />
            }
          >
            <PlayerStatsCard stats={playerStats} />

            <Text style={styles.sectionTitle}>Recompensas Semanales</Text>
            <View style={styles.rewardsList}>
              <View style={styles.rewardRow}>
                <View style={styles.rewardRank}>
                  <Text style={styles.rewardRankIcon}>🥇</Text>
                  <Text style={styles.rewardRankText}>1º</Text>
                </View>
                <View style={styles.rewardDetails}>
                  <Text style={styles.rewardXP}>1000 XP</Text>
                  <Text style={styles.rewardConsciousness}>500 Consciencia</Text>
                  <Text style={styles.rewardTitle}>+ Título: Campeón Semanal</Text>
                </View>
              </View>

              <View style={styles.rewardRow}>
                <View style={styles.rewardRank}>
                  <Text style={styles.rewardRankIcon}>🥈</Text>
                  <Text style={styles.rewardRankText}>2º</Text>
                </View>
                <View style={styles.rewardDetails}>
                  <Text style={styles.rewardXP}>750 XP</Text>
                  <Text style={styles.rewardConsciousness}>350 Consciencia</Text>
                </View>
              </View>

              <View style={styles.rewardRow}>
                <View style={styles.rewardRank}>
                  <Text style={styles.rewardRankIcon}>🥉</Text>
                  <Text style={styles.rewardRankText}>3º</Text>
                </View>
                <View style={styles.rewardDetails}>
                  <Text style={styles.rewardXP}>500 XP</Text>
                  <Text style={styles.rewardConsciousness}>250 Consciencia</Text>
                </View>
              </View>

              <View style={styles.rewardRow}>
                <View style={styles.rewardRank}>
                  <Text style={styles.rewardRankText}>Top 10</Text>
                </View>
                <View style={styles.rewardDetails}>
                  <Text style={styles.rewardXP}>300 XP</Text>
                  <Text style={styles.rewardConsciousness}>150 Consciencia</Text>
                </View>
              </View>

              <View style={styles.rewardRow}>
                <View style={styles.rewardRank}>
                  <Text style={styles.rewardRankText}>Top 100</Text>
                </View>
                <View style={styles.rewardDetails}>
                  <Text style={styles.rewardXP}>100 XP</Text>
                  <Text style={styles.rewardConsciousness}>50 Consciencia</Text>
                </View>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Bonificaciones</Text>
            <View style={styles.bonusesList}>
              <View style={styles.bonusRow}>
                <Icon name="fire" size={20} color="#ef4444" />
                <View style={styles.bonusInfo}>
                  <Text style={styles.bonusName}>Racha de 3 días</Text>
                  <Text style={styles.bonusValue}>+100 pts</Text>
                </View>
              </View>
              <View style={styles.bonusRow}>
                <Icon name="fire" size={20} color="#f97316" />
                <View style={styles.bonusInfo}>
                  <Text style={styles.bonusName}>Racha de 7 días</Text>
                  <Text style={styles.bonusValue}>+300 pts</Text>
                </View>
              </View>
              <View style={styles.bonusRow}>
                <Icon name="fire" size={20} color="#eab308" />
                <View style={styles.bonusInfo}>
                  <Text style={styles.bonusName}>Racha de 14 días</Text>
                  <Text style={styles.bonusValue}>+1000 pts</Text>
                </View>
              </View>
              <View style={styles.bonusRow}>
                <Icon name="star" size={20} color="#eab308" />
                <View style={styles.bonusInfo}>
                  <Text style={styles.bonusName}>Crisis destacada</Text>
                  <Text style={styles.bonusValue}>+200 pts</Text>
                </View>
              </View>
              <View style={styles.bonusRow}>
                <Icon name="weather-sunny" size={20} color={COLORS.accent.primary} />
                <View style={styles.bonusInfo}>
                  <Text style={styles.bonusName}>Primera del día</Text>
                  <Text style={styles.bonusValue}>+50 pts</Text>
                </View>
              </View>
            </View>
          </ScrollView>
        );

      default:
        return null;
    }
  };

  // Loading
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.accent.primary} />
          <Text style={styles.loadingText}>Cargando liga...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Icon name="trophy" size={28} color="#eab308" />
          <Text style={styles.headerTitle}>Liga de Crisis</Text>
        </View>
        <View style={styles.headerRight}>
          {playerRank && (
            <View style={styles.yourRankBadge}>
              <Text style={styles.yourRankText}>#{playerRank.rank}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'ranking' && styles.tabActive]}
          onPress={() => setActiveTab('ranking')}
        >
          <Icon
            name="podium"
            size={18}
            color={activeTab === 'ranking' ? COLORS.accent.primary : COLORS.text.secondary}
          />
          <Text style={[styles.tabText, activeTab === 'ranking' && styles.tabTextActive]}>
            Ranking
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'challenges' && styles.tabActive]}
          onPress={() => setActiveTab('challenges')}
        >
          <Icon
            name="star-circle"
            size={18}
            color={activeTab === 'challenges' ? COLORS.accent.primary : COLORS.text.secondary}
          />
          <Text style={[styles.tabText, activeTab === 'challenges' && styles.tabTextActive]}>
            Destacadas
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'rewards' && styles.tabActive]}
          onPress={() => setActiveTab('rewards')}
        >
          <Icon
            name="gift"
            size={18}
            color={activeTab === 'rewards' ? COLORS.accent.primary : COLORS.text.secondary}
          />
          <Text style={[styles.tabText, activeTab === 'rewards' && styles.tabTextActive]}>
            Premios
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {renderContent()}
    </SafeAreaView>
  );
};

// ============================================================================
// ESTILOS
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg.primary
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.bg.elevated
  },
  backButton: {
    padding: 4
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text.primary
  },
  headerRight: {
    width: 50,
    alignItems: 'flex-end'
  },
  yourRankBadge: {
    backgroundColor: COLORS.accent.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12
  },
  yourRankText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff'
  },

  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.bg.elevated
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
    borderRadius: 8,
    backgroundColor: COLORS.bg.elevated
  },
  tabActive: {
    backgroundColor: 'rgba(96,165,250,0.15)'
  },
  tabText: {
    fontSize: 13,
    color: COLORS.text.secondary
  },
  tabTextActive: {
    color: COLORS.accent.primary,
    fontWeight: '600'
  },

  // Season Card
  seasonCard: {
    margin: 16,
    padding: 16,
    backgroundColor: COLORS.bg.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eab308'
  },
  seasonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12
  },
  seasonTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text.primary
  },
  seasonProgress: {
    marginBottom: 8
  },
  seasonWeek: {
    fontSize: 13,
    color: COLORS.text.secondary,
    marginBottom: 6
  },
  seasonProgressBar: {
    height: 6,
    backgroundColor: COLORS.bg.elevated,
    borderRadius: 3,
    overflow: 'hidden'
  },
  seasonProgressFill: {
    height: '100%',
    backgroundColor: '#eab308',
    borderRadius: 3
  },
  timeRemaining: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  timeRemainingText: {
    fontSize: 12,
    color: COLORS.text.secondary
  },
  finalWeekBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ef4444',
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 10,
    gap: 6
  },
  finalWeekText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff'
  },

  // Division Card
  divisionCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: COLORS.bg.card,
    borderRadius: 12,
    borderWidth: 2
  },
  divisionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12
  },
  divisionIcon: {
    fontSize: 36
  },
  divisionInfo: {
    flex: 1
  },
  divisionName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text.primary
  },
  divisionPoints: {
    fontSize: 14,
    color: COLORS.text.secondary
  },
  progressSection: {
    marginTop: 4
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  progressCurrent: {
    fontSize: 11,
    color: COLORS.text.secondary
  },
  progressNext: {
    fontSize: 11,
    color: COLORS.text.secondary
  },
  divisionProgressBar: {
    height: 8,
    backgroundColor: COLORS.bg.elevated,
    borderRadius: 4,
    overflow: 'hidden'
  },
  divisionProgressFill: {
    height: '100%',
    borderRadius: 4
  },
  pointsToNext: {
    fontSize: 11,
    color: COLORS.text.dim,
    textAlign: 'right',
    marginTop: 4
  },
  maxDivisionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8
  },
  maxDivisionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFD700'
  },

  // Section Title
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginHorizontal: 16,
    marginBottom: 8,
    marginTop: 8
  },
  sectionSubtitle: {
    fontSize: 13,
    color: COLORS.text.secondary,
    marginHorizontal: 16,
    marginBottom: 16
  },

  // Leaderboard
  leaderboardList: {
    paddingBottom: 20
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.bg.elevated
  },
  leaderboardRowCurrent: {
    backgroundColor: 'rgba(96,165,250,0.1)'
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10
  },
  rankText: {
    fontSize: 14,
    fontWeight: 'bold'
  },
  playerAvatar: {
    fontSize: 24,
    marginRight: 10
  },
  playerInfo: {
    flex: 1
  },
  playerName: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text.primary
  },
  playerNameCurrent: {
    color: COLORS.accent.primary,
    fontWeight: '600'
  },
  playerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2
  },
  divisionBadge: {
    fontSize: 11,
    color: COLORS.text.secondary
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2
  },
  streakText: {
    fontSize: 11,
    color: '#ef4444',
    fontWeight: '600'
  },
  playerPoints: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text.primary
  },

  // Stats Card
  statsCard: {
    margin: 16,
    padding: 16,
    backgroundColor: COLORS.bg.card,
    borderRadius: 12
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 12
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  statBox: {
    alignItems: 'center',
    flex: 1
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginTop: 4
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.text.secondary,
    marginTop: 2
  },
  totalPointsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.bg.elevated
  },
  totalPointsLabel: {
    fontSize: 14,
    color: COLORS.text.secondary
  },
  totalPointsValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.accent.primary
  },

  // Challenges
  challengesContainer: {
    padding: 16
  },
  challengesGrid: {
    gap: 12
  },
  challengeCard: {
    backgroundColor: COLORS.bg.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#eab308'
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  challengeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eab308',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4
  },
  challengeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff'
  },
  challengeMultiplier: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#eab308'
  },
  challengeTypeIcon: {
    fontSize: 32,
    marginBottom: 8
  },
  challengeTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4
  },
  challengeLocation: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginBottom: 8
  },
  challengeRewards: {
    alignItems: 'flex-end'
  },
  challengeRewardText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#22c55e'
  },

  // Rewards
  rewardsContainer: {
    paddingBottom: 20
  },
  rewardsList: {
    marginHorizontal: 16,
    marginBottom: 20
  },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bg.card,
    padding: 12,
    borderRadius: 10,
    marginBottom: 8
  },
  rewardRank: {
    width: 60,
    alignItems: 'center'
  },
  rewardRankIcon: {
    fontSize: 24
  },
  rewardRankText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text.secondary
  },
  rewardDetails: {
    flex: 1
  },
  rewardXP: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary
  },
  rewardConsciousness: {
    fontSize: 12,
    color: COLORS.text.secondary
  },
  rewardTitle: {
    fontSize: 11,
    color: '#eab308',
    marginTop: 2
  },

  // Bonuses
  bonusesList: {
    marginHorizontal: 16
  },
  bonusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bg.card,
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    gap: 12
  },
  bonusInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  bonusName: {
    fontSize: 14,
    color: COLORS.text.primary
  },
  bonusValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#22c55e'
  },

  // Empty & Loading
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.text.secondary
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.text.secondary
  }
});

export default LeagueScreen;
