/**
 * LeagueService.js
 *
 * Servicio para el sistema de Liga de Crisis semanal.
 * Gestiona rankings, puntuaciones, temporadas y recompensas.
 *
 * @version 1.0.0
 * @date 2025-12-17
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { realNewsCrisisService } from './RealNewsCrisisService';
import logger from '../utils/logger';

// ============================================================================
// CONFIGURACIÓN DE LA LIGA
// ============================================================================

const LEAGUE_CONFIG = {
  // Temporada
  seasonDurationWeeks: 4,
  weekStartDay: 1, // Lunes = 1

  // Puntuación
  scoring: {
    crisisResolved: 100,
    crisisFailedPartial: 30,
    bonusFirstOfDay: 50,
    bonusStreak3: 100,
    bonusStreak7: 300,
    bonusStreak14: 1000,
    bonusPerfectWeek: 500, // Resolver al menos 1 crisis cada día
    bonusLeagueCrisis: 200, // Crisis destacada de la semana
  },

  // Ligas (divisiones)
  divisions: {
    bronze: { name: 'Bronce', minPoints: 0, icon: '🥉', color: '#CD7F32' },
    silver: { name: 'Plata', minPoints: 1000, icon: '🥈', color: '#C0C0C0' },
    gold: { name: 'Oro', minPoints: 3000, icon: '🥇', color: '#FFD700' },
    platinum: { name: 'Platino', minPoints: 7000, icon: '💎', color: '#E5E4E2' },
    diamond: { name: 'Diamante', minPoints: 15000, icon: '💠', color: '#B9F2FF' },
    master: { name: 'Maestro', minPoints: 30000, icon: '👑', color: '#9B59B6' },
    legend: { name: 'Leyenda', minPoints: 60000, icon: '🌟', color: '#F1C40F' }
  },

  // Recompensas semanales por posición
  weeklyRewards: {
    1: { xp: 1000, consciousness: 500, title: 'Campeón Semanal' },
    2: { xp: 750, consciousness: 350, title: null },
    3: { xp: 500, consciousness: 250, title: null },
    top10: { xp: 300, consciousness: 150, title: null },
    top50: { xp: 150, consciousness: 75, title: null },
    top100: { xp: 100, consciousness: 50, title: null },
    participation: { xp: 50, consciousness: 25, title: null }
  },

  // Recompensas de temporada
  seasonRewards: {
    1: { xp: 5000, consciousness: 2500, badge: 'Campeón de Temporada', cosmetic: 'avatar_gold_frame' },
    2: { xp: 3500, consciousness: 1750, badge: 'Subcampeón', cosmetic: 'avatar_silver_frame' },
    3: { xp: 2500, consciousness: 1250, badge: 'Tercer Lugar', cosmetic: 'avatar_bronze_frame' },
    top10: { xp: 1500, consciousness: 750, badge: 'Top 10', cosmetic: null },
    top100: { xp: 750, consciousness: 375, badge: 'Top 100', cosmetic: null }
  }
};

// ============================================================================
// DATOS SIMULADOS PARA DEMO (sin backend)
// ============================================================================

const SIMULATED_PLAYERS = [
  { id: 'bot_1', username: 'TransformadorX', avatar: '🦸', weeklyPoints: 4520, streak: 12 },
  { id: 'bot_2', username: 'ConscienciaPura', avatar: '🧘', weeklyPoints: 4105, streak: 8 },
  { id: 'bot_3', username: 'GuardianTierra', avatar: '🌍', weeklyPoints: 3890, streak: 15 },
  { id: 'bot_4', username: 'LuzDelAlba', avatar: '☀️', weeklyPoints: 3650, streak: 5 },
  { id: 'bot_5', username: 'SabioDelNorte', avatar: '🧙', weeklyPoints: 3420, streak: 9 },
  { id: 'bot_6', username: 'RioDeEsperanza', avatar: '🌊', weeklyPoints: 3180, streak: 7 },
  { id: 'bot_7', username: 'ArbolSagrado', avatar: '🌳', weeklyPoints: 2950, streak: 11 },
  { id: 'bot_8', username: 'MaestroZen', avatar: '🧠', weeklyPoints: 2780, streak: 4 },
  { id: 'bot_9', username: 'CaminanteEstelar', avatar: '⭐', weeklyPoints: 2540, streak: 6 },
  { id: 'bot_10', username: 'VozDelPueblo', avatar: '📢', weeklyPoints: 2350, streak: 3 },
  { id: 'bot_11', username: 'SemillaNueva', avatar: '🌱', weeklyPoints: 2180, streak: 10 },
  { id: 'bot_12', username: 'FuegoInterior', avatar: '🔥', weeklyPoints: 1950, streak: 2 },
  { id: 'bot_13', username: 'MontañaCalma', avatar: '🏔️', weeklyPoints: 1780, streak: 8 },
  { id: 'bot_14', username: 'OceanoVivo', avatar: '🐋', weeklyPoints: 1620, streak: 5 },
  { id: 'bot_15', username: 'AuroraBoreal', avatar: '🌌', weeklyPoints: 1450, streak: 7 },
  { id: 'bot_16', username: 'SerDeLuz', avatar: '💫', weeklyPoints: 1280, streak: 4 },
  { id: 'bot_17', username: 'RaizProfunda', avatar: '🌿', weeklyPoints: 1120, streak: 6 },
  { id: 'bot_18', username: 'CieloAbierto', avatar: '☁️', weeklyPoints: 980, streak: 3 },
  { id: 'bot_19', username: 'TierraFertil', avatar: '🌾', weeklyPoints: 850, streak: 9 },
  { id: 'bot_20', username: 'AguaCristalina', avatar: '💧', weeklyPoints: 720, streak: 2 }
];

// ============================================================================
// SERVICIO PRINCIPAL
// ============================================================================

class LeagueService {

  constructor() {
    this.playerData = null;
    this.leaderboard = [];
    this.weeklyChallengeCrises = [];
  }

  // --------------------------------------------------------------------------
  // INICIALIZACIÓN Y DATOS DEL JUGADOR
  // --------------------------------------------------------------------------

  /**
   * Inicializa datos del jugador para la liga
   */
  async initializePlayer(userId, username) {
    const stored = await this.loadPlayerData(userId);

    if (stored) {
      this.playerData = stored;
    } else {
      this.playerData = {
        id: userId,
        username: username || 'Jugador',
        avatar: '🧬',
        weeklyPoints: 0,
        seasonPoints: 0,
        totalPoints: 0,
        streak: 0,
        lastPlayedDate: null,
        crisesResolvedToday: 0,
        crisesResolvedThisWeek: 0,
        crisesResolvedThisSeason: 0,
        bestWeeklyRank: null,
        bestSeasonRank: null,
        titles: [],
        badges: [],
        joinedAt: new Date().toISOString()
      };
      await this.savePlayerData();
    }

    return this.playerData;
  }

  async loadPlayerData(userId) {
    try {
      const data = await AsyncStorage.getItem(`league_player_${userId}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.warn('LeagueService', 'Error loading league player data:', error);
      return null;
    }
  }

  async savePlayerData() {
    if (!this.playerData) return;
    try {
      await AsyncStorage.setItem(
        `league_player_${this.playerData.id}`,
        JSON.stringify(this.playerData)
      );
    } catch (error) {
      logger.warn('LeagueService', 'Error saving league player data:', error);
    }
  }

  // --------------------------------------------------------------------------
  // PUNTUACIÓN
  // --------------------------------------------------------------------------

  /**
   * Registra una crisis resuelta y calcula puntos
   */
  async recordCrisisResolved(crisis, success, isLeagueCrisis = false) {
    if (!this.playerData) return { points: 0, bonuses: [] };

    const today = new Date().toISOString().split('T')[0];
    const bonuses = [];
    let totalPoints = 0;

    // Puntos base
    if (success) {
      totalPoints += LEAGUE_CONFIG.scoring.crisisResolved;
      bonuses.push({ type: 'base', points: LEAGUE_CONFIG.scoring.crisisResolved, label: 'Crisis resuelta' });
    } else {
      totalPoints += LEAGUE_CONFIG.scoring.crisisFailedPartial;
      bonuses.push({ type: 'partial', points: LEAGUE_CONFIG.scoring.crisisFailedPartial, label: 'Participación' });
    }

    // Bonus primera del día
    if (this.playerData.lastPlayedDate !== today) {
      totalPoints += LEAGUE_CONFIG.scoring.bonusFirstOfDay;
      bonuses.push({ type: 'firstOfDay', points: LEAGUE_CONFIG.scoring.bonusFirstOfDay, label: 'Primera del día' });

      // Actualizar racha
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (this.playerData.lastPlayedDate === yesterdayStr) {
        this.playerData.streak += 1;
      } else {
        this.playerData.streak = 1;
      }

      this.playerData.lastPlayedDate = today;
      this.playerData.crisesResolvedToday = 0;
    }

    // Bonus racha
    if (this.playerData.streak === 3) {
      totalPoints += LEAGUE_CONFIG.scoring.bonusStreak3;
      bonuses.push({ type: 'streak', points: LEAGUE_CONFIG.scoring.bonusStreak3, label: 'Racha de 3 días' });
    } else if (this.playerData.streak === 7) {
      totalPoints += LEAGUE_CONFIG.scoring.bonusStreak7;
      bonuses.push({ type: 'streak', points: LEAGUE_CONFIG.scoring.bonusStreak7, label: 'Racha de 7 días' });
    } else if (this.playerData.streak === 14) {
      totalPoints += LEAGUE_CONFIG.scoring.bonusStreak14;
      bonuses.push({ type: 'streak', points: LEAGUE_CONFIG.scoring.bonusStreak14, label: 'Racha de 14 días' });
    }

    // Bonus crisis de liga
    if (isLeagueCrisis) {
      totalPoints += LEAGUE_CONFIG.scoring.bonusLeagueCrisis;
      bonuses.push({ type: 'leagueCrisis', points: LEAGUE_CONFIG.scoring.bonusLeagueCrisis, label: 'Crisis destacada' });
    }

    // Actualizar contadores
    this.playerData.crisesResolvedToday += 1;
    this.playerData.crisesResolvedThisWeek += 1;
    this.playerData.crisesResolvedThisSeason += 1;
    this.playerData.weeklyPoints += totalPoints;
    this.playerData.seasonPoints += totalPoints;
    this.playerData.totalPoints += totalPoints;

    await this.savePlayerData();

    return { points: totalPoints, bonuses };
  }

  // --------------------------------------------------------------------------
  // LEADERBOARD
  // --------------------------------------------------------------------------

  /**
   * Obtiene el leaderboard semanal
   */
  async getWeeklyLeaderboard() {
    // Combinar jugadores simulados con el jugador real
    const allPlayers = [...SIMULATED_PLAYERS];

    if (this.playerData) {
      allPlayers.push({
        id: this.playerData.id,
        username: this.playerData.username,
        avatar: this.playerData.avatar,
        weeklyPoints: this.playerData.weeklyPoints,
        streak: this.playerData.streak,
        isCurrentPlayer: true
      });
    }

    // Ordenar por puntos
    allPlayers.sort((a, b) => b.weeklyPoints - a.weeklyPoints);

    // Asignar posiciones y divisiones
    this.leaderboard = allPlayers.map((player, index) => ({
      ...player,
      rank: index + 1,
      division: this.getDivision(player.weeklyPoints)
    }));

    return this.leaderboard;
  }

  /**
   * Obtiene la posición del jugador actual
   */
  async getCurrentPlayerRank() {
    if (!this.playerData) return null;

    const leaderboard = await this.getWeeklyLeaderboard();
    const playerEntry = leaderboard.find(p => p.isCurrentPlayer);

    return playerEntry || null;
  }

  /**
   * Obtiene jugadores cercanos al jugador actual
   */
  async getNearbyPlayers(range = 5) {
    if (!this.playerData) return [];

    const leaderboard = await this.getWeeklyLeaderboard();
    const playerIndex = leaderboard.findIndex(p => p.isCurrentPlayer);

    if (playerIndex === -1) return leaderboard.slice(0, range * 2);

    const start = Math.max(0, playerIndex - range);
    const end = Math.min(leaderboard.length, playerIndex + range + 1);

    return leaderboard.slice(start, end);
  }

  // --------------------------------------------------------------------------
  // DIVISIONES
  // --------------------------------------------------------------------------

  /**
   * Determina la división basada en puntos
   */
  getDivision(points) {
    const divisions = Object.entries(LEAGUE_CONFIG.divisions)
      .sort((a, b) => b[1].minPoints - a[1].minPoints);

    for (const [key, division] of divisions) {
      if (points >= division.minPoints) {
        return { key, ...division };
      }
    }

    return { key: 'bronze', ...LEAGUE_CONFIG.divisions.bronze };
  }

  /**
   * Obtiene progreso hacia la siguiente división
   */
  getDivisionProgress(points) {
    const currentDivision = this.getDivision(points);
    const divisions = Object.entries(LEAGUE_CONFIG.divisions)
      .sort((a, b) => a[1].minPoints - b[1].minPoints);

    const currentIndex = divisions.findIndex(d => d[0] === currentDivision.key);
    const nextDivision = divisions[currentIndex + 1];

    if (!nextDivision) {
      return {
        current: currentDivision,
        next: null,
        progress: 100,
        pointsToNext: 0
      };
    }

    const pointsInCurrentDivision = points - currentDivision.minPoints;
    const pointsNeededForNext = nextDivision[1].minPoints - currentDivision.minPoints;
    const progress = Math.min(100, (pointsInCurrentDivision / pointsNeededForNext) * 100);

    return {
      current: currentDivision,
      next: { key: nextDivision[0], ...nextDivision[1] },
      progress: Math.round(progress),
      pointsToNext: nextDivision[1].minPoints - points
    };
  }

  // --------------------------------------------------------------------------
  // CRISIS DE LIGA (DESTACADAS)
  // --------------------------------------------------------------------------

  /**
   * Obtiene las crisis destacadas de la semana
   */
  async getWeeklyChallengeCrises() {
    if (this.weeklyChallengeCrises.length > 0) {
      return this.weeklyChallengeCrises;
    }

    try {
      this.weeklyChallengeCrises = await realNewsCrisisService.getWeeklyLeagueCrises();
      return this.weeklyChallengeCrises;
    } catch (error) {
      logger.warn('LeagueService', 'Error getting weekly challenge crises:', error);
      return [];
    }
  }

  // --------------------------------------------------------------------------
  // TEMPORADA
  // --------------------------------------------------------------------------

  /**
   * Obtiene información de la temporada actual
   */
  getSeasonInfo() {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const weekNumber = Math.ceil(((now - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
    const seasonNumber = Math.ceil(weekNumber / LEAGUE_CONFIG.seasonDurationWeeks);
    const weekInSeason = ((weekNumber - 1) % LEAGUE_CONFIG.seasonDurationWeeks) + 1;

    // Calcular días restantes de la semana
    const dayOfWeek = now.getDay() || 7; // Domingo = 7
    const daysUntilMonday = 8 - dayOfWeek;
    const hoursRemaining = 24 - now.getHours();

    return {
      seasonNumber,
      seasonName: `Temporada ${seasonNumber}`,
      weekNumber,
      weekInSeason,
      totalWeeksInSeason: LEAGUE_CONFIG.seasonDurationWeeks,
      daysRemainingInWeek: daysUntilMonday,
      hoursRemainingToday: hoursRemaining,
      isLastWeekOfSeason: weekInSeason === LEAGUE_CONFIG.seasonDurationWeeks
    };
  }

  /**
   * Reinicia datos semanales (llamar al inicio de cada semana)
   */
  async resetWeeklyData() {
    if (!this.playerData) return;

    // Guardar mejor posición semanal
    const currentRank = await this.getCurrentPlayerRank();
    if (currentRank && (!this.playerData.bestWeeklyRank || currentRank.rank < this.playerData.bestWeeklyRank)) {
      this.playerData.bestWeeklyRank = currentRank.rank;
    }

    // Calcular recompensas semanales
    const weeklyRewards = this.calculateWeeklyRewards(currentRank?.rank);

    // Resetear contadores semanales
    this.playerData.weeklyPoints = 0;
    this.playerData.crisesResolvedThisWeek = 0;

    // Limpiar crisis de liga
    this.weeklyChallengeCrises = [];

    await this.savePlayerData();

    return weeklyRewards;
  }

  /**
   * Calcula recompensas semanales basadas en posición
   */
  calculateWeeklyRewards(rank) {
    if (!rank) return LEAGUE_CONFIG.weeklyRewards.participation;

    if (rank === 1) return LEAGUE_CONFIG.weeklyRewards[1];
    if (rank === 2) return LEAGUE_CONFIG.weeklyRewards[2];
    if (rank === 3) return LEAGUE_CONFIG.weeklyRewards[3];
    if (rank <= 10) return LEAGUE_CONFIG.weeklyRewards.top10;
    if (rank <= 50) return LEAGUE_CONFIG.weeklyRewards.top50;
    if (rank <= 100) return LEAGUE_CONFIG.weeklyRewards.top100;

    return LEAGUE_CONFIG.weeklyRewards.participation;
  }

  // --------------------------------------------------------------------------
  // ESTADÍSTICAS
  // --------------------------------------------------------------------------

  /**
   * Obtiene estadísticas del jugador
   */
  getPlayerStats() {
    if (!this.playerData) return null;

    const division = this.getDivision(this.playerData.weeklyPoints);
    const divisionProgress = this.getDivisionProgress(this.playerData.weeklyPoints);

    return {
      weeklyPoints: this.playerData.weeklyPoints,
      seasonPoints: this.playerData.seasonPoints,
      totalPoints: this.playerData.totalPoints,
      streak: this.playerData.streak,
      crisesResolvedToday: this.playerData.crisesResolvedToday,
      crisesResolvedThisWeek: this.playerData.crisesResolvedThisWeek,
      crisesResolvedThisSeason: this.playerData.crisesResolvedThisSeason,
      division,
      divisionProgress,
      bestWeeklyRank: this.playerData.bestWeeklyRank,
      bestSeasonRank: this.playerData.bestSeasonRank,
      titles: this.playerData.titles,
      badges: this.playerData.badges
    };
  }

  /**
   * Obtiene estadísticas generales de la liga
   */
  async getLeagueStats() {
    const leaderboard = await this.getWeeklyLeaderboard();

    const divisionCounts = {};
    Object.keys(LEAGUE_CONFIG.divisions).forEach(div => {
      divisionCounts[div] = 0;
    });

    leaderboard.forEach(player => {
      divisionCounts[player.division.key]++;
    });

    const totalPoints = leaderboard.reduce((sum, p) => sum + p.weeklyPoints, 0);
    const avgPoints = Math.round(totalPoints / leaderboard.length);

    return {
      totalPlayers: leaderboard.length,
      totalPointsThisWeek: totalPoints,
      averagePoints: avgPoints,
      topScore: leaderboard[0]?.weeklyPoints || 0,
      divisionDistribution: divisionCounts
    };
  }
}

// Exportar instancia singleton
export const leagueService = new LeagueService();
export default LeagueService;
