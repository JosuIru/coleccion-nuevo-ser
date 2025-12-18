/**
 * CommandCenterScreen.js
 *
 * Pantalla principal del Modo Comandante Global.
 * Muestra un mapa mundial con crisis basadas en noticias reales
 * y permite desplegar seres para resolverlas sin necesidad de GPS.
 *
 * @version 1.0.0
 * @date 2025-12-17
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Animated,
  Dimensions,
  RefreshControl,
  Linking,
  ActivityIndicator,
  FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { realNewsCrisisService } from '../services/RealNewsCrisisService';
import useGameStore from '../stores/gameStore';
import { COLORS, CRISIS_TYPES, ATTRIBUTES } from '../config/constants';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ============================================================================
// COMPONENTES AUXILIARES
// ============================================================================

/**
 * Mapa mundial simplificado con puntos de crisis
 */
const WorldMapView = ({ crises, onCrisisSelect, selectedCrisis }) => {
  // Mapa simplificado usando coordenadas normalizadas
  const normalizeCoords = (lat, lon) => {
    // Convertir lat/lon a posición en el mapa (0-1)
    const x = (lon + 180) / 360;
    const y = (90 - lat) / 180;
    return { x: x * 100, y: y * 100 };
  };

  const getUrgencyColor = (urgency) => {
    if (urgency >= 8) return '#ef4444'; // Crítico - rojo
    if (urgency >= 6) return '#f97316'; // Alto - naranja
    if (urgency >= 4) return '#eab308'; // Medio - amarillo
    return '#22c55e'; // Bajo - verde
  };

  const getUrgencySize = (urgency) => {
    return 12 + (urgency * 1.5); // 12-27px
  };

  return (
    <View style={styles.mapContainer}>
      {/* Fondo del mapa */}
      <View style={styles.mapBackground}>
        {/* Líneas de referencia */}
        <View style={[styles.mapLine, { top: '25%' }]} />
        <View style={[styles.mapLine, { top: '50%' }]} />
        <View style={[styles.mapLine, { top: '75%' }]} />
        <View style={[styles.mapLineVertical, { left: '25%' }]} />
        <View style={[styles.mapLineVertical, { left: '50%' }]} />
        <View style={[styles.mapLineVertical, { left: '75%' }]} />

        {/* Etiquetas de regiones */}
        <Text style={[styles.regionLabel, { top: '15%', left: '15%' }]}>América</Text>
        <Text style={[styles.regionLabel, { top: '15%', left: '45%' }]}>Europa</Text>
        <Text style={[styles.regionLabel, { top: '15%', left: '70%' }]}>Asia</Text>
        <Text style={[styles.regionLabel, { top: '60%', left: '45%' }]}>África</Text>
        <Text style={[styles.regionLabel, { top: '75%', left: '75%' }]}>Oceanía</Text>

        {/* Puntos de crisis */}
        {crises.map((crisis, index) => {
          const pos = normalizeCoords(crisis.lat, crisis.lon);
          const isSelected = selectedCrisis?.id === crisis.id;
          const size = getUrgencySize(crisis.urgency);

          return (
            <TouchableOpacity
              key={crisis.id}
              style={[
                styles.crisisPoint,
                {
                  left: `${Math.min(95, Math.max(5, pos.x))}%`,
                  top: `${Math.min(90, Math.max(10, pos.y))}%`,
                  width: size,
                  height: size,
                  borderRadius: size / 2,
                  backgroundColor: getUrgencyColor(crisis.urgency),
                  borderWidth: isSelected ? 3 : 1,
                  borderColor: isSelected ? '#fff' : 'rgba(255,255,255,0.3)',
                  transform: [{ scale: isSelected ? 1.3 : 1 }]
                }
              ]}
              onPress={() => onCrisisSelect(crisis)}
            >
              <Text style={styles.crisisPointIcon}>{crisis.typeIcon}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Leyenda */}
      <View style={styles.mapLegend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} />
          <Text style={styles.legendText}>Crítico</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#f97316' }]} />
          <Text style={styles.legendText}>Alto</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#eab308' }]} />
          <Text style={styles.legendText}>Medio</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#22c55e' }]} />
          <Text style={styles.legendText}>Bajo</Text>
        </View>
      </View>
    </View>
  );
};

/**
 * Card de crisis en la lista
 */
const CrisisCard = ({ crisis, onPress, isSelected }) => {
  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 1) return 'Hace menos de 1 hora';
    if (diffHours < 24) return `Hace ${diffHours} horas`;
    const diffDays = Math.floor(diffHours / 24);
    return `Hace ${diffDays} días`;
  };

  return (
    <TouchableOpacity
      style={[
        styles.crisisCard,
        isSelected && styles.crisisCardSelected
      ]}
      onPress={() => onPress(crisis)}
      activeOpacity={0.7}
    >
      <View style={styles.crisisCardHeader}>
        <View style={[styles.crisisTypeTag, { backgroundColor: crisis.typeColor }]}>
          <Text style={styles.crisisTypeIcon}>{crisis.typeIcon}</Text>
          <Text style={styles.crisisTypeText}>{CRISIS_TYPES[crisis.type]?.name || crisis.type}</Text>
        </View>
        <View style={styles.urgencyBadge}>
          <Text style={styles.urgencyText}>{crisis.urgency}/10</Text>
        </View>
      </View>

      <Text style={styles.crisisTitle} numberOfLines={2}>{crisis.title}</Text>

      <Text style={styles.crisisDescription} numberOfLines={2}>
        {crisis.description}
      </Text>

      <View style={styles.crisisCardFooter}>
        <View style={styles.crisisLocation}>
          <Icon name="map-marker" size={14} color={COLORS.text.secondary} />
          <Text style={styles.crisisLocationText}>{crisis.locationName}</Text>
        </View>
        <View style={styles.crisisTime}>
          <Icon name="clock-outline" size={14} color={COLORS.text.secondary} />
          <Text style={styles.crisisTimeText}>{getTimeAgo(crisis.publishedAt)}</Text>
        </View>
      </View>

      {crisis.source && (
        <Text style={styles.crisisSource}>Fuente: {crisis.source}</Text>
      )}

      {/* Recompensas */}
      <View style={styles.rewardsRow}>
        <View style={styles.rewardItem}>
          <Text style={styles.rewardIcon}>⭐</Text>
          <Text style={styles.rewardValue}>{crisis.rewards.xp} XP</Text>
        </View>
        <View style={styles.rewardItem}>
          <Text style={styles.rewardIcon}>🌟</Text>
          <Text style={styles.rewardValue}>{crisis.rewards.consciousness}</Text>
        </View>
        <View style={styles.rewardItem}>
          <Text style={styles.rewardIcon}>⚡</Text>
          <Text style={styles.rewardValue}>{crisis.rewards.energy}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

/**
 * Modal de detalle de crisis y despliegue
 */
const CrisisDetailModal = ({ crisis, visible, onClose, onDeploy, beings }) => {
  const [selectedBeings, setSelectedBeings] = useState([]);
  const [successProbability, setSuccessProbability] = useState(0);

  useEffect(() => {
    if (selectedBeings.length > 0 && crisis) {
      const probability = calculateSuccessProbability(selectedBeings, crisis);
      setSuccessProbability(probability);
    } else {
      setSuccessProbability(0);
    }
  }, [selectedBeings, crisis]);

  const toggleBeingSelection = (being) => {
    if (being.status !== 'available') return;

    setSelectedBeings(prev => {
      const isSelected = prev.find(b => b.id === being.id);
      if (isSelected) {
        return prev.filter(b => b.id !== being.id);
      } else if (prev.length < 4) { // Máximo 4 seres
        return [...prev, being];
      }
      return prev;
    });
  };

  const calculateSuccessProbability = (selectedBeings, crisis) => {
    if (!crisis.requiredAttributes) return 50;

    let totalMatch = 0;
    let totalRequired = 0;

    // Sumar atributos de todos los seres seleccionados
    const combinedAttributes = {};
    selectedBeings.forEach(being => {
      Object.entries(being.attributes || {}).forEach(([attr, value]) => {
        combinedAttributes[attr] = (combinedAttributes[attr] || 0) + value;
      });
    });

    // Comparar con requerimientos
    Object.entries(crisis.requiredAttributes).forEach(([attr, required]) => {
      const available = combinedAttributes[attr] || 0;
      totalMatch += Math.min(available, required);
      totalRequired += required;
    });

    const baseProb = totalRequired > 0 ? (totalMatch / totalRequired) * 100 : 50;

    // Bonus por equipo
    const teamBonus = selectedBeings.length > 1 ? (selectedBeings.length - 1) * 5 : 0;

    return Math.min(95, Math.max(5, Math.round(baseProb + teamBonus)));
  };

  const handleDeploy = () => {
    if (selectedBeings.length === 0) return;
    onDeploy(crisis, selectedBeings, successProbability);
    setSelectedBeings([]);
    onClose();
  };

  if (!crisis) return null;

  const availableBeings = beings.filter(b => b.status === 'available');

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={[styles.modalTypeTag, { backgroundColor: crisis.typeColor }]}>
              <Text style={styles.modalTypeIcon}>{crisis.typeIcon}</Text>
              <Text style={styles.modalTypeText}>{CRISIS_TYPES[crisis.type]?.name}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color={COLORS.text.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScroll}>
            {/* Título y descripción */}
            <Text style={styles.modalTitle}>{crisis.title}</Text>
            <Text style={styles.modalDescription}>{crisis.description}</Text>

            {/* Fuente */}
            {crisis.sourceUrl && (
              <TouchableOpacity
                style={styles.sourceLink}
                onPress={() => Linking.openURL(crisis.sourceUrl)}
              >
                <Icon name="link" size={16} color={COLORS.accent.primary} />
                <Text style={styles.sourceLinkText}>Ver noticia original ({crisis.source})</Text>
              </TouchableOpacity>
            )}

            {/* Atributos requeridos */}
            <Text style={styles.sectionTitle}>Atributos Requeridos</Text>
            <View style={styles.attributesGrid}>
              {Object.entries(crisis.requiredAttributes || {}).map(([attr, value]) => (
                <View key={attr} style={styles.attributeItem}>
                  <Text style={styles.attributeIcon}>{ATTRIBUTES[attr]?.icon || '📊'}</Text>
                  <Text style={styles.attributeName}>{ATTRIBUTES[attr]?.name || attr}</Text>
                  <Text style={styles.attributeValue}>{value}</Text>
                </View>
              ))}
            </View>

            {/* Recompensas */}
            <Text style={styles.sectionTitle}>Recompensas</Text>
            <View style={styles.rewardsGrid}>
              <View style={styles.rewardBox}>
                <Text style={styles.rewardBoxIcon}>⭐</Text>
                <Text style={styles.rewardBoxValue}>{crisis.rewards.xp}</Text>
                <Text style={styles.rewardBoxLabel}>XP</Text>
              </View>
              <View style={styles.rewardBox}>
                <Text style={styles.rewardBoxIcon}>🌟</Text>
                <Text style={styles.rewardBoxValue}>{crisis.rewards.consciousness}</Text>
                <Text style={styles.rewardBoxLabel}>Consciencia</Text>
              </View>
              <View style={styles.rewardBox}>
                <Text style={styles.rewardBoxIcon}>⚡</Text>
                <Text style={styles.rewardBoxValue}>{crisis.rewards.energy}</Text>
                <Text style={styles.rewardBoxLabel}>Energía</Text>
              </View>
            </View>

            {/* Selección de seres */}
            <Text style={styles.sectionTitle}>Selecciona Seres ({selectedBeings.length}/4)</Text>

            {/* Debug info */}
            <Text style={styles.debugText}>
              Total seres: {beings.length} | Disponibles: {availableBeings.length}
            </Text>

            {beings.length === 0 ? (
              <View style={styles.noBeingsContainer}>
                <Text style={styles.noBeingsText}>No tienes seres creados</Text>
                <Text style={styles.noBeingsHint}>Ve a la pestaña "Seres" para crear uno</Text>
              </View>
            ) : availableBeings.length === 0 ? (
              <View style={styles.noBeingsContainer}>
                <Text style={styles.noBeingsText}>Todos tus seres están en misión</Text>
                <Text style={styles.noBeingsHint}>Espera a que terminen sus misiones actuales</Text>
              </View>
            ) : (
              <View style={styles.beingsGrid}>
                {beings.map(being => {
                  const isSelected = selectedBeings.find(b => b.id === being.id);
                  const isAvailable = being.status === 'available';

                  return (
                    <TouchableOpacity
                      key={being.id}
                      style={[
                        styles.beingCard,
                        isSelected && styles.beingCardSelected,
                        !isAvailable && styles.beingCardDisabled
                      ]}
                      onPress={() => toggleBeingSelection(being)}
                      disabled={!isAvailable}
                    >
                      <Text style={styles.beingAvatar}>{being.avatar || '🧬'}</Text>
                      <Text style={styles.beingName} numberOfLines={1}>{being.name}</Text>
                      <Text style={styles.beingStatus}>
                        {isAvailable ? 'Disponible' : being.status === 'deployed' ? 'En misión' : 'Descansando'}
                      </Text>
                      {isSelected && (
                        <View style={styles.selectedBadge}>
                          <Icon name="check" size={12} color="#fff" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Probabilidad de éxito */}
            {selectedBeings.length > 0 && (
              <View style={styles.probabilitySection}>
                <Text style={styles.probabilityLabel}>Probabilidad de éxito</Text>
                <View style={styles.probabilityBar}>
                  <View
                    style={[
                      styles.probabilityFill,
                      {
                        width: `${successProbability}%`,
                        backgroundColor: successProbability >= 70 ? '#22c55e' :
                                         successProbability >= 40 ? '#eab308' : '#ef4444'
                      }
                    ]}
                  />
                </View>
                <Text style={styles.probabilityValue}>{successProbability}%</Text>
              </View>
            )}
          </ScrollView>

          {/* Botón de despliegue */}
          <TouchableOpacity
            style={[
              styles.deployButton,
              selectedBeings.length === 0 && styles.deployButtonDisabled
            ]}
            onPress={handleDeploy}
            disabled={selectedBeings.length === 0}
          >
            <Icon name="rocket-launch" size={20} color="#fff" />
            <Text style={styles.deployButtonText}>
              {selectedBeings.length === 0
                ? 'Selecciona al menos 1 ser'
                : `Desplegar ${selectedBeings.length} ser${selectedBeings.length > 1 ? 'es' : ''}`}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

/**
 * Barra de estadísticas superior
 */
const StatsBar = ({ stats, user }) => {
  return (
    <View style={styles.statsBar}>
      <View style={styles.statItem}>
        <Icon name="earth" size={18} color={COLORS.accent.primary} />
        <Text style={styles.statValue}>{stats.total || 0}</Text>
        <Text style={styles.statLabel}>Crisis</Text>
      </View>
      <View style={styles.statItem}>
        <Icon name="fire" size={18} color="#ef4444" />
        <Text style={styles.statValue}>{stats.byUrgency?.critical || 0}</Text>
        <Text style={styles.statLabel}>Críticas</Text>
      </View>
      <View style={styles.statItem}>
        <Icon name="star" size={18} color="#eab308" />
        <Text style={styles.statValue}>{user.consciousnessPoints || 0}</Text>
        <Text style={styles.statLabel}>Consciencia</Text>
      </View>
      <View style={styles.statItem}>
        <Icon name="lightning-bolt" size={18} color="#22c55e" />
        <Text style={styles.statValue}>{user.energy || 0}</Text>
        <Text style={styles.statLabel}>Energía</Text>
      </View>
    </View>
  );
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

const CommandCenterScreen = ({ navigation }) => {
  // Estado
  const [crises, setCrises] = useState([]);
  const [selectedCrisis, setSelectedCrisis] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({});
  const [viewMode, setViewMode] = useState('map'); // 'map' | 'list'
  const [filterType, setFilterType] = useState(null);

  // Store
  const { user, beings, addXP, addConsciousness, deployBeing } = useGameStore();

  // Cargar crisis al montar
  useEffect(() => {
    loadCrises();
  }, []);

  const loadCrises = async () => {
    setLoading(true);
    try {
      const [crisesData, statsData] = await Promise.all([
        realNewsCrisisService.getRealWorldCrises({ limit: 30 }),
        realNewsCrisisService.getCrisisStats()
      ]);
      setCrises(crisesData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading crises:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const [crisesData, statsData] = await Promise.all([
        realNewsCrisisService.getRealWorldCrises({ limit: 30, forceRefresh: true }),
        realNewsCrisisService.getCrisisStats()
      ]);
      setCrises(crisesData);
      setStats(statsData);
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleCrisisSelect = (crisis) => {
    setSelectedCrisis(crisis);
    if (viewMode === 'map') {
      setShowDetailModal(true);
    }
  };

  const handleDeploy = async (crisis, selectedBeings, probability) => {
    // Simular resultado de misión
    const roll = Math.random() * 100;
    const success = roll <= probability;

    // Calcular recompensas
    const multiplier = success ? 1.0 : 0.3;
    const xpGained = Math.round(crisis.rewards.xp * multiplier);
    const consciousnessGained = Math.round(crisis.rewards.consciousness * multiplier);

    // Aplicar recompensas
    addXP(xpGained);
    addConsciousness(consciousnessGained);

    // Actualizar estado de seres
    selectedBeings.forEach(being => {
      deployBeing(being.id, crisis.id);
    });

    // Remover crisis de la lista
    setCrises(prev => prev.filter(c => c.id !== crisis.id));

    // Mostrar resultado (en producción, esto sería un modal/toast)
    alert(
      success
        ? `¡Misión exitosa! Ganaste ${xpGained} XP y ${consciousnessGained} consciencia.`
        : `Misión fallida. Ganaste ${xpGained} XP y ${consciousnessGained} consciencia (parcial).`
    );
  };

  // Filtrar crisis por tipo
  const filteredCrises = filterType
    ? crises.filter(c => c.type === filterType)
    : crises;

  // Render
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.accent.primary} />
          <Text style={styles.loadingText}>Cargando crisis mundiales...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Icon name="shield-star" size={28} color={COLORS.accent.primary} />
          <Text style={styles.headerTitle}>Centro de Comando</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate('DailyMissions')}
          >
            <Icon name="calendar-check" size={24} color="#22c55e" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate('League')}
          >
            <Icon name="trophy" size={24} color="#eab308" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleRefresh}
          >
            <Icon name="refresh" size={24} color={COLORS.text.secondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Barra de estadísticas */}
      <StatsBar stats={stats} user={user} />

      {/* Toggle de vista */}
      <View style={styles.viewToggle}>
        <TouchableOpacity
          style={[styles.toggleButton, viewMode === 'map' && styles.toggleButtonActive]}
          onPress={() => setViewMode('map')}
        >
          <Icon name="earth" size={18} color={viewMode === 'map' ? '#fff' : COLORS.text.secondary} />
          <Text style={[styles.toggleText, viewMode === 'map' && styles.toggleTextActive]}>Mapa</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, viewMode === 'list' && styles.toggleButtonActive]}
          onPress={() => setViewMode('list')}
        >
          <Icon name="format-list-bulleted" size={18} color={viewMode === 'list' ? '#fff' : COLORS.text.secondary} />
          <Text style={[styles.toggleText, viewMode === 'list' && styles.toggleTextActive]}>Lista</Text>
        </TouchableOpacity>
      </View>

      {/* Filtros de tipo */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
        <TouchableOpacity
          style={[styles.filterChip, !filterType && styles.filterChipActive]}
          onPress={() => setFilterType(null)}
        >
          <Text style={[styles.filterChipText, !filterType && styles.filterChipTextActive]}>Todas</Text>
        </TouchableOpacity>
        {Object.entries(CRISIS_TYPES).map(([type, config]) => (
          <TouchableOpacity
            key={type}
            style={[styles.filterChip, filterType === type && styles.filterChipActive]}
            onPress={() => setFilterType(filterType === type ? null : type)}
          >
            <Text style={styles.filterChipIcon}>{config.icon}</Text>
            <Text style={[styles.filterChipText, filterType === type && styles.filterChipTextActive]}>
              {config.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Contenido principal */}
      {viewMode === 'map' ? (
        <WorldMapView
          crises={filteredCrises}
          onCrisisSelect={handleCrisisSelect}
          selectedCrisis={selectedCrisis}
        />
      ) : (
        <FlatList
          data={filteredCrises}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <CrisisCard
              crisis={item}
              onPress={handleCrisisSelect}
              isSelected={selectedCrisis?.id === item.id}
            />
          )}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.accent.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="check-circle" size={48} color={COLORS.accent.success} />
              <Text style={styles.emptyText}>¡No hay crisis pendientes!</Text>
            </View>
          }
        />
      )}

      {/* Crisis seleccionada en vista lista */}
      {viewMode === 'list' && selectedCrisis && (
        <TouchableOpacity
          style={styles.floatingButton}
          onPress={() => setShowDetailModal(true)}
        >
          <Icon name="rocket-launch" size={24} color="#fff" />
          <Text style={styles.floatingButtonText}>Desplegar</Text>
        </TouchableOpacity>
      )}

      {/* Modal de detalle */}
      <CrisisDetailModal
        crisis={selectedCrisis}
        visible={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedCrisis(null);
        }}
        onDeploy={handleDeploy}
        beings={beings}
      />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.bg.elevated
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text.primary
  },
  headerRight: {
    flexDirection: 'row',
    gap: 12
  },
  headerButton: {
    padding: 8
  },

  // Stats Bar
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    backgroundColor: COLORS.bg.elevated,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.bg.card
  },
  statItem: {
    alignItems: 'center',
    gap: 2
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text.primary
  },
  statLabel: {
    fontSize: 10,
    color: COLORS.text.secondary
  },

  // View Toggle
  viewToggle: {
    flexDirection: 'row',
    margin: 12,
    backgroundColor: COLORS.bg.elevated,
    borderRadius: 8,
    padding: 4
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 6,
    borderRadius: 6
  },
  toggleButtonActive: {
    backgroundColor: COLORS.accent.primary
  },
  toggleText: {
    fontSize: 14,
    color: COLORS.text.secondary
  },
  toggleTextActive: {
    color: '#fff',
    fontWeight: '600'
  },

  // Filters
  filtersScroll: {
    maxHeight: 44,
    paddingHorizontal: 12,
    marginBottom: 8
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: COLORS.bg.elevated,
    borderRadius: 16,
    marginRight: 8,
    gap: 4
  },
  filterChipActive: {
    backgroundColor: COLORS.accent.primary
  },
  filterChipIcon: {
    fontSize: 14
  },
  filterChipText: {
    fontSize: 12,
    color: COLORS.text.secondary
  },
  filterChipTextActive: {
    color: '#fff',
    fontWeight: '600'
  },

  // Map
  mapContainer: {
    flex: 1,
    margin: 12,
    backgroundColor: COLORS.bg.elevated,
    borderRadius: 12,
    overflow: 'hidden'
  },
  mapBackground: {
    flex: 1,
    backgroundColor: '#1a2744',
    position: 'relative'
  },
  mapLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)'
  },
  mapLineVertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.1)'
  },
  regionLabel: {
    position: 'absolute',
    fontSize: 10,
    color: 'rgba(255,255,255,0.3)',
    fontWeight: '600'
  },
  crisisPoint: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4
  },
  crisisPointIcon: {
    fontSize: 8
  },
  mapLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.bg.card
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5
  },
  legendText: {
    fontSize: 10,
    color: COLORS.text.secondary
  },

  // List
  listContainer: {
    padding: 12
  },

  // Crisis Card
  crisisCard: {
    backgroundColor: COLORS.bg.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.bg.elevated
  },
  crisisCardSelected: {
    borderColor: COLORS.accent.primary,
    borderWidth: 2
  },
  crisisCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  crisisTypeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4
  },
  crisisTypeIcon: {
    fontSize: 12
  },
  crisisTypeText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600'
  },
  urgencyBadge: {
    backgroundColor: 'rgba(239,68,68,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  urgencyText: {
    fontSize: 12,
    color: '#ef4444',
    fontWeight: 'bold'
  },
  crisisTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 6
  },
  crisisDescription: {
    fontSize: 13,
    color: COLORS.text.secondary,
    lineHeight: 18,
    marginBottom: 8
  },
  crisisCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6
  },
  crisisLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  crisisLocationText: {
    fontSize: 11,
    color: COLORS.text.secondary
  },
  crisisTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  crisisTimeText: {
    fontSize: 11,
    color: COLORS.text.secondary
  },
  crisisSource: {
    fontSize: 10,
    color: COLORS.text.dim,
    marginBottom: 8
  },
  rewardsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 16
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  rewardIcon: {
    fontSize: 12
  },
  rewardValue: {
    fontSize: 12,
    color: COLORS.text.secondary,
    fontWeight: '500'
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: COLORS.bg.primary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.bg.elevated
  },
  modalTypeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6
  },
  modalTypeIcon: {
    fontSize: 16
  },
  modalTypeText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600'
  },
  closeButton: {
    padding: 4
  },
  modalScroll: {
    padding: 16
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: 12
  },
  modalDescription: {
    fontSize: 14,
    color: COLORS.text.secondary,
    lineHeight: 20,
    marginBottom: 16
  },
  sourceLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20
  },
  sourceLinkText: {
    fontSize: 13,
    color: COLORS.accent.primary
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 12,
    marginTop: 8
  },

  // Attributes Grid
  attributesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16
  },
  attributeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bg.elevated,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6
  },
  attributeIcon: {
    fontSize: 14
  },
  attributeName: {
    fontSize: 12,
    color: COLORS.text.secondary
  },
  attributeValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.text.primary
  },

  // Rewards Grid
  rewardsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20
  },
  rewardBox: {
    alignItems: 'center',
    backgroundColor: COLORS.bg.elevated,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12
  },
  rewardBoxIcon: {
    fontSize: 24,
    marginBottom: 4
  },
  rewardBoxValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text.primary
  },
  rewardBoxLabel: {
    fontSize: 11,
    color: COLORS.text.secondary
  },

  // Beings Grid
  beingsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16
  },
  beingCard: {
    width: (SCREEN_WIDTH - 64) / 3 - 7,
    backgroundColor: COLORS.bg.elevated,
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent'
  },
  beingCardSelected: {
    borderColor: COLORS.accent.primary,
    backgroundColor: 'rgba(96,165,250,0.1)'
  },
  beingCardDisabled: {
    opacity: 0.5
  },
  beingAvatar: {
    fontSize: 28,
    marginBottom: 4
  },
  beingName: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.text.primary,
    textAlign: 'center'
  },
  beingStatus: {
    fontSize: 9,
    color: COLORS.text.secondary,
    marginTop: 2
  },
  selectedBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: COLORS.accent.primary,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center'
  },
  noBeingsText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    textAlign: 'center',
    padding: 20
  },

  noBeingsContainer: {
    padding: 20,
    alignItems: 'center'
  },

  noBeingsHint: {
    fontSize: 12,
    color: COLORS.text.dim,
    textAlign: 'center',
    marginTop: 8
  },

  debugText: {
    fontSize: 11,
    color: COLORS.accent.primary,
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: 'monospace'
  },

  // Probability
  probabilitySection: {
    marginBottom: 16
  },
  probabilityLabel: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: 8
  },
  probabilityBar: {
    height: 12,
    backgroundColor: COLORS.bg.elevated,
    borderRadius: 6,
    overflow: 'hidden'
  },
  probabilityFill: {
    height: '100%',
    borderRadius: 6
  },
  probabilityValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    textAlign: 'right',
    marginTop: 4
  },

  // Deploy Button
  deployButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accent.primary,
    margin: 16,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8
  },
  deployButtonDisabled: {
    backgroundColor: COLORS.bg.elevated
  },
  deployButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff'
  },

  // Floating Button
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accent.primary,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 30,
    gap: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8
  },
  floatingButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff'
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.text.secondary
  },

  // Empty
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.text.secondary
  }
});

export default CommandCenterScreen;
