/**
 * CRISIS EXAMPLE SCREEN
 * Ejemplo completo de integración del sistema de crisis
 *
 * Este componente muestra cómo:
 * - Cargar crisis desde el servicio
 * - Mostrar crisis en lista
 * - Filtrar por tipo
 * - Manejar estados de carga y error
 * - Completar crisis
 * - Ver estadísticas
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert
} from 'react-native';
import CrisisService from '../services/CrisisService';
import useGameStore from '../stores/gameStore';
import { CRISIS_TYPES, COLORS } from '../config/constants';
import logger from '../utils/logger';

export default function CrisisExampleScreen({ navigation }) {
  const [crises, setCrises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedType, setSelectedType] = useState(null);
  const [stats, setStats] = useState(null);

  // Obtener userId del store
  const { user } = useGameStore();

  useEffect(() => {
    loadCrises();
    loadStats();

    // Activar auto-refresh
    CrisisService.startAutoRefresh();

    return () => {
      CrisisService.stopAutoRefresh();
    };
  }, []);

  /**
   * Cargar crisis del servicio
   */
  async function loadCrises(type = null, forceRefresh = false) {
    try {
      setLoading(true);

      const data = await CrisisService.getCrises({
        type,
        limit: 20,
        forceRefresh
      });

      setCrises(data);
      setSelectedType(type);

    } catch (error) {
      logger.error('Error cargando crisis:', error);
      Alert.alert(
        'Error',
        'No se pudieron cargar las crisis. Intenta de nuevo.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  /**
   * Cargar estadísticas del usuario
   */
  async function loadStats() {
    try {
      // Obtener userId real del estado global
      const userId = user?.id || 'demo-user-123';
      const userStats = await CrisisService.getCrisisStats(userId);
      setStats(userStats);
    } catch (error) {
      logger.error('CrisisExampleScreen', 'Error cargando stats', error);
    }
  }

  /**
   * Refresh manual
   */
  async function handleRefresh() {
    setRefreshing(true);
    await loadCrises(selectedType, true);
  }

  /**
   * Seleccionar crisis para jugar
   */
  function handleSelectCrisis(crisis) {
    Alert.alert(
      crisis.title,
      `${crisis.description}\n\nUrgencia: ${crisis.urgency}/10\nDuración: ${crisis.duration_minutes} min\nAfectados: ${crisis.population_affected.toLocaleString()}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Aceptar Misión',
          onPress: () => startCrisis(crisis)
        }
      ]
    );
  }

  /**
   * Iniciar misión de crisis
   */
  function startCrisis(crisis) {
    // Navegar a pantalla de detalle de crisis para desplegar seres
    if (navigation) {
      navigation.navigate('CrisisDetail', { crisis });
    } else {
      logger.warn('CrisisExampleScreen', 'Navigation no disponible');
    }

    // Simulación alternativa: completar misión después de 2 segundos (si navegación no disponible)
    if (!navigation) {
      setTimeout(() => {
      completeCrisis(crisis);
    }, 2000);
  }

  /**
   * Completar crisis
   */
  async function completeCrisis(crisis) {
    try {
      const userId = 'demo-user-123';

      await CrisisService.completeCrisis(crisis.id, userId, {
        success: true,
        type: crisis.type,
        population_affected: crisis.population_affected,
        duration: crisis.duration_minutes
      });

      Alert.alert(
        '¡Misión Completada!',
        `Has ayudado a ${crisis.population_affected.toLocaleString()} personas.\n\n+${crisis.urgency * 100} XP`,
        [{ text: 'Continuar' }]
      );

      // Recargar stats
      await loadStats();

      // Recargar lista
      await loadCrises(selectedType);

    } catch (error) {
      logger.error('Error completando crisis:', error);
    }
  }

  /**
   * Limpiar caché
   */
  async function clearCache() {
    Alert.alert(
      'Limpiar Caché',
      '¿Quieres eliminar las crisis guardadas y cargar nuevas?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpiar',
          style: 'destructive',
          onPress: async () => {
            await CrisisService.clearCache();
            await loadCrises(null, true);
          }
        }
      ]
    );
  }

  /**
   * Renderizar una crisis
   */
  function renderCrisis({ item: crisis }) {
    const typeInfo = CRISIS_TYPES[crisis.type] || {};
    const urgencyColor = getUrgencyColor(crisis.urgency);

    return (
      <TouchableOpacity
        style={styles.crisisCard}
        onPress={() => handleSelectCrisis(crisis)}
        activeOpacity={0.7}
      >
        {/* Header */}
        <View style={styles.crisisHeader}>
          <View style={styles.crisisTypeContainer}>
            <Text style={styles.crisisTypeIcon}>{typeInfo.icon || '⚠️'}</Text>
            <Text style={styles.crisisType}>{typeInfo.name || crisis.type}</Text>
          </View>
          <View style={[styles.urgencyBadge, { backgroundColor: urgencyColor }]}>
            <Text style={styles.urgencyText}>{crisis.urgency}/10</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.crisisTitle} numberOfLines={2}>
          {crisis.title}
        </Text>

        {/* Description */}
        <Text style={styles.crisisDescription} numberOfLines={2}>
          {crisis.description}
        </Text>

        {/* Meta Info */}
        <View style={styles.crisisMeta}>
          <View style={styles.metaItem}>
            <Text style={styles.metaIcon}>📍</Text>
            <Text style={styles.metaText}>
              {crisis.location?.city}, {crisis.location?.country}
            </Text>
          </View>

          <View style={styles.metaItem}>
            <Text style={styles.metaIcon}>👥</Text>
            <Text style={styles.metaText}>
              {formatNumber(crisis.population_affected)}
            </Text>
          </View>

          <View style={styles.metaItem}>
            <Text style={styles.metaIcon}>⏱️</Text>
            <Text style={styles.metaText}>{crisis.duration_minutes} min</Text>
          </View>
        </View>

        {/* Source Badge */}
        {crisis.source === 'news' && (
          <View style={styles.sourceBadge}>
            <Text style={styles.sourceBadgeText}>📰 Noticia Real</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  /**
   * Header con filtros
   */
  function renderHeader() {
    return (
      <View style={styles.header}>
        {/* Stats */}
        {stats && (
          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{stats.total_completed}</Text>
              <Text style={styles.statLabel}>Completadas</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{stats.success_rate}%</Text>
              <Text style={styles.statLabel}>Éxito</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>
                {formatNumber(stats.total_population_helped)}
              </Text>
              <Text style={styles.statLabel}>Ayudados</Text>
            </View>
          </View>
        )}

        {/* Filtros de tipo */}
        <View style={styles.filtersContainer}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              !selectedType && styles.filterButtonActive
            ]}
            onPress={() => loadCrises(null)}
          >
            <Text style={styles.filterText}>Todas</Text>
          </TouchableOpacity>

          {Object.entries(CRISIS_TYPES).map(([key, value]) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.filterButton,
                selectedType === key && styles.filterButtonActive
              ]}
              onPress={() => loadCrises(key)}
            >
              <Text style={styles.filterIcon}>{value.icon}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => loadCrises(selectedType, true)}
          >
            <Text style={styles.actionButtonText}>🔄 Refresh</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={clearCache}
          >
            <Text style={styles.actionButtonText}>🗑️ Limpiar Caché</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  /**
   * Empty state
   */
  function renderEmpty() {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🌍</Text>
        <Text style={styles.emptyText}>No hay crisis disponibles</Text>
        <TouchableOpacity
          style={styles.reloadButton}
          onPress={() => loadCrises(null, true)}
        >
          <Text style={styles.reloadButtonText}>Recargar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading && crises.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.accent.primary} />
        <Text style={styles.loadingText}>Cargando crisis...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={crises}
        keyExtractor={item => item.id}
        renderItem={renderCrisis}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.accent.primary}
          />
        }
      />
    </View>
  );
}

// ═══════════════════════════════════════════════════════════
// UTILIDADES
// ═══════════════════════════════════════════════════════════

function getUrgencyColor(urgency) {
  if (urgency >= 9) return COLORS.accent.critical;
  if (urgency >= 7) return COLORS.accent.warning;
  return COLORS.accent.primary;
}

function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

// ═══════════════════════════════════════════════════════════
// ESTILOS
// ═══════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg.primary
  },

  listContent: {
    padding: 16,
    paddingBottom: 32
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.bg.primary
  },

  loadingText: {
    marginTop: 16,
    color: COLORS.text.secondary,
    fontSize: 16
  },

  // Header
  header: {
    marginBottom: 20
  },

  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    padding: 16,
    backgroundColor: COLORS.bg.elevated,
    borderRadius: 12
  },

  statBox: {
    alignItems: 'center'
  },

  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.accent.primary
  },

  statLabel: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginTop: 4
  },

  filtersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16
  },

  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.bg.elevated,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.bg.elevated
  },

  filterButtonActive: {
    backgroundColor: COLORS.accent.primary,
    borderColor: COLORS.accent.primary
  },

  filterText: {
    color: COLORS.text.primary,
    fontSize: 14,
    fontWeight: '600'
  },

  filterIcon: {
    fontSize: 20
  },

  actionsContainer: {
    flexDirection: 'row',
    gap: 8
  },

  actionButton: {
    flex: 1,
    padding: 12,
    backgroundColor: COLORS.bg.elevated,
    borderRadius: 8,
    alignItems: 'center'
  },

  actionButtonText: {
    color: COLORS.text.primary,
    fontSize: 14,
    fontWeight: '600'
  },

  // Crisis Card
  crisisCard: {
    backgroundColor: COLORS.bg.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155'
  },

  crisisHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },

  crisisTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },

  crisisTypeIcon: {
    fontSize: 20
  },

  crisisType: {
    color: COLORS.text.secondary,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase'
  },

  urgencyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12
  },

  urgencyText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700'
  },

  crisisTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 8
  },

  crisisDescription: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: 12,
    lineHeight: 20
  },

  crisisMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },

  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },

  metaIcon: {
    fontSize: 14
  },

  metaText: {
    fontSize: 12,
    color: COLORS.text.dim
  },

  sourceBadge: {
    backgroundColor: '#334155',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 8
  },

  sourceBadgeText: {
    fontSize: 10,
    color: COLORS.text.secondary,
    fontWeight: '600'
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60
  },

  emptyIcon: {
    fontSize: 64,
    marginBottom: 16
  },

  emptyText: {
    fontSize: 16,
    color: COLORS.text.secondary,
    marginBottom: 20
  },

  reloadButton: {
    backgroundColor: COLORS.accent.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8
  },

  reloadButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600'
  }
});
