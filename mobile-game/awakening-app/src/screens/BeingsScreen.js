/**
 * BEINGS SCREEN - Gestión de seres transformadores
 * Lista, gestión, fusión y despliegue de seres
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  FlatList,
  Animated,
  Modal,
  ScrollView,
  Dimensions
} from 'react-native';
import useGameStore from '../stores/gameStore';
import { COLORS, ATTRIBUTES } from '../config/constants';

const { width } = Dimensions.get('window');

const BeingsScreen = ({ navigation }) => {
  // ═══════════════════════════════════════════════════════════
  // ESTADO
  // ═══════════════════════════════════════════════════════════

  const [filterStatus, setFilterStatus] = useState('all'); // all, available, deployed, resting
  const [selectedBeing, setSelectedBeing] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showFusionModal, setShowFusionModal] = useState(false);
  const [showPiecesModal, setShowPiecesModal] = useState(false);
  const [activeTab, setActiveTab] = useState('beings'); // beings, pieces, communities

  // Zustand store
  const {
    user,
    beings,
    pieces,
    communities,
    updateBeing,
    recallBeing,
    addBeing,
    activateCommunity
  } = useGameStore();

  // Animación de entrada
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // ═══════════════════════════════════════════════════════════
  // EFECTOS
  // ═══════════════════════════════════════════════════════════

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true
    }).start();
  }, []);

  // ═══════════════════════════════════════════════════════════
  // FILTRADO DE SERES
  // ═══════════════════════════════════════════════════════════

  const filteredBeings = beings.filter(being => {
    if (filterStatus === 'all') return true;
    return being.status === filterStatus;
  });

  // ═══════════════════════════════════════════════════════════
  // ACCIONES
  // ═══════════════════════════════════════════════════════════

  const onBeingPress = (being) => {
    setSelectedBeing(being);
    setShowDetailModal(true);
  };

  const onRecallBeing = (beingId) => {
    recallBeing(beingId);
    setShowDetailModal(false);
  };

  const onFusionPress = () => {
    setShowFusionModal(true);
  };

  // ═══════════════════════════════════════════════════════════
  // ESTADÍSTICAS DEL SER
  // ═══════════════════════════════════════════════════════════

  const getBeingPowerLevel = (being) => {
    if (!being.attributes) return 0;
    return Object.values(being.attributes).reduce((sum, val) => sum + val, 0);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available':
        return COLORS.status.available;
      case 'deployed':
        return COLORS.status.deployed;
      case 'resting':
        return COLORS.status.resting;
      case 'training':
        return COLORS.status.training;
      default:
        return COLORS.text.dim;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'available':
        return 'Disponible';
      case 'deployed':
        return 'Desplegado';
      case 'resting':
        return 'Descansando';
      case 'training':
        return 'Entrenando';
      default:
        return 'Desconocido';
    }
  };

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'legendary':
        return '#FFD700'; // Dorado
      case 'epic':
        return '#9B59B6'; // Púrpura
      case 'rare':
        return '#3498DB'; // Azul
      default:
        return '#95A5A6'; // Gris
    }
  };

  // ═══════════════════════════════════════════════════════════
  // RENDER BEING CARD
  // ═══════════════════════════════════════════════════════════

  const renderBeingCard = ({ item: being, index }) => {
    const powerLevel = getBeingPowerLevel(being);
    const statusColor = getStatusColor(being.status);

    return (
      <Animated.View
        style={[
          styles.beingCard,
          {
            opacity: fadeAnim,
            transform: [{
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0]
              })
            }]
          }
        ]}
      >
        <TouchableOpacity
          onPress={() => onBeingPress(being)}
          activeOpacity={0.8}
        >
          {/* Header del Card */}
          <View style={styles.beingCardHeader}>
            <View style={styles.beingAvatarContainer}>
              <Text style={styles.beingAvatar}>{being.avatar || '🧬'}</Text>
              <View style={[styles.statusIndicator, { backgroundColor: statusColor }]} />
            </View>

            <View style={styles.beingInfo}>
              <Text style={styles.beingName} numberOfLines={1}>
                {being.name || `Ser ${index + 1}`}
              </Text>
              <Text style={[styles.statusText, { color: statusColor }]}>
                {getStatusText(being.status)}
              </Text>
            </View>

            <View style={styles.powerLevelContainer}>
              <Text style={styles.powerLevelLabel}>Power</Text>
              <Text style={styles.powerLevelValue}>{powerLevel}</Text>
            </View>
          </View>

          {/* Atributos principales */}
          <View style={styles.attributesPreview}>
            {being.attributes && Object.entries(being.attributes).slice(0, 3).map(([key, value]) => {
              const attrConfig = ATTRIBUTES[key];
              if (!attrConfig) return null;

              return (
                <View key={key} style={styles.attributeItem}>
                  <Text style={styles.attributeIcon}>{attrConfig.icon}</Text>
                  <View style={styles.attributeBarContainer}>
                    <View style={styles.attributeBarBg}>
                      <View
                        style={[
                          styles.attributeBarFill,
                          {
                            width: `${value}%`,
                            backgroundColor: attrConfig.color
                          }
                        ]}
                      />
                    </View>
                    <Text style={styles.attributeValue}>{value}</Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Misión actual (si está desplegado) */}
          {being.status === 'deployed' && being.currentMission && (
            <View style={styles.missionBadge}>
              <Text style={styles.missionBadgeText}>
                🔥 En misión
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Mi Colección</Text>
          <Text style={styles.headerSubtitle}>
            {beings.length} seres • {(pieces || []).length} piezas • {(communities || []).length} comunidades
          </Text>
        </View>

        <TouchableOpacity
          style={styles.fusionButton}
          onPress={onFusionPress}
        >
          <Text style={styles.fusionIcon}>⚗️</Text>
        </TouchableOpacity>
      </View>

      {/* TABS: SERES / PIEZAS / COMUNIDADES */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'beings' && styles.tabButtonActive]}
          onPress={() => setActiveTab('beings')}
        >
          <Text style={[styles.tabText, activeTab === 'beings' && styles.tabTextActive]}>
            🧬 Seres ({beings.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'pieces' && styles.tabButtonActive]}
          onPress={() => setActiveTab('pieces')}
        >
          <Text style={[styles.tabText, activeTab === 'pieces' && styles.tabTextActive]}>
            🧩 Piezas ({(pieces || []).length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'communities' && styles.tabButtonActive]}
          onPress={() => setActiveTab('communities')}
        >
          <Text style={[styles.tabText, activeTab === 'communities' && styles.tabTextActive]}>
            🏛️ ({(communities || []).length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* FILTROS - Solo para seres */}
      {activeTab === 'beings' && <View style={styles.filtersContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContent}
        >
          {['all', 'available', 'deployed', 'resting'].map(status => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterButton,
                filterStatus === status && styles.filterButtonActive
              ]}
              onPress={() => setFilterStatus(status)}
            >
              <Text style={[
                styles.filterButtonText,
                filterStatus === status && styles.filterButtonTextActive
              ]}>
                {status === 'all' ? 'Todos' : getStatusText(status)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>}

      {/* LISTA DE SERES */}
      {activeTab === 'beings' && (
        filteredBeings.length > 0 ? (
          <FlatList
            data={filteredBeings}
            renderItem={renderBeingCard}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>🧬</Text>
            <Text style={styles.emptyStateText}>
              {filterStatus === 'all'
                ? 'Aún no tienes seres'
                : `No hay seres en estado "${getStatusText(filterStatus)}"`
              }
            </Text>
            {filterStatus === 'all' && (
              <>
                <Text style={styles.emptyStateHint}>
                  Los seres son tus agentes de cambio para resolver crisis mundiales
                </Text>

                {/* Botón prominente para crear ser */}
                <TouchableOpacity
                  style={styles.createBeingButton}
                  onPress={() => navigation.navigate('Lab')}
                >
                  <Text style={styles.createBeingIcon}>🔬</Text>
                  <Text style={styles.createBeingText}>Crear mi primer Ser</Text>
                </TouchableOpacity>

                {/* Opción alternativa: tienda */}
                <TouchableOpacity
                  style={styles.alternativeButton}
                  onPress={() => navigation.navigate('Command', { screen: 'Shop' })}
                >
                  <Text style={styles.alternativeText}>
                    💫 O comprar en la Tienda ({user.consciousnessPoints || 0} pts disponibles)
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )
      )}

      {/* LISTA DE PIEZAS */}
      {activeTab === 'pieces' && (
        <View style={{ flex: 1 }}>
          {/* Botón de Fusión */}
          {(pieces || []).length >= 3 && (
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: COLORS.accent.primary,
                marginHorizontal: 16,
                marginVertical: 12,
                paddingVertical: 14,
                borderRadius: 12,
                gap: 8
              }}
              onPress={() => navigation.navigate('Command', { screen: 'PieceFusion' })}
            >
              <Text style={{ fontSize: 20 }}>🔮</Text>
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
                Fusionar Fragmentos
              </Text>
            </TouchableOpacity>
          )}

          {(pieces || []).length > 0 ? (
            <FlatList
              data={pieces || []}
              renderItem={({ item }) => (
                <View style={styles.pieceCard}>
                  <Text style={styles.pieceIcon}>{item.icon || '✨'}</Text>
                  <View style={styles.pieceInfo}>
                    <Text style={styles.pieceName}>{item.name}</Text>
                    <Text style={styles.pieceDescription}>{item.description}</Text>
                    <View style={styles.pieceRarityBadge}>
                      <Text style={[styles.pieceRarity, { color: getRarityColor(item.rarity) }]}>
                        {item.rarity?.toUpperCase() || 'COMÚN'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.piecePower}>+{item.power}</Text>
                </View>
              )}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>🧩</Text>
              <Text style={styles.emptyStateText}>
                Aún no tienes piezas. ¡Resuelve crisis para obtener fragmentos!
              </Text>
              <Text style={styles.emptyStateHint}>
                Las piezas se usan en el Laboratorio Frankenstein para crear seres más poderosos
              </Text>
            </View>
          )}
        </View>
      )}

      {/* LISTA DE COMUNIDADES */}
      {activeTab === 'communities' && (
        (communities || []).length > 0 ? (
          <FlatList
            data={communities || []}
            renderItem={({ item }) => (
              <View style={styles.communityCard}>
                <Text style={styles.communityIcon}>{item.icon || '🏛️'}</Text>
                <View style={styles.communityInfo}>
                  <Text style={styles.communityName}>{item.name}</Text>
                  <Text style={styles.communityDescription}>{item.description}</Text>
                  <Text style={styles.communityBeings}>
                    {item.beings?.length || 0} seres incluidos
                  </Text>
                </View>
                {!item.activated ? (
                  <TouchableOpacity
                    style={styles.activateButton}
                    onPress={() => {
                      activateCommunity(item.id);
                    }}
                  >
                    <Text style={styles.activateButtonText}>Activar</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.activatedBadge}>
                    <Text style={styles.activatedText}>✓ Activa</Text>
                  </View>
                )}
              </View>
            )}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>🏛️</Text>
            <Text style={styles.emptyStateText}>
              Aún no tienes comunidades. ¡Son muy raras!
            </Text>
            <Text style={styles.emptyStateHint}>
              Resuelve crisis críticas con excelente rendimiento para desbloquear comunidades
            </Text>
          </View>
        )
      )}

      {/* MODAL DE DETALLE DEL SER */}
      <Modal
        visible={showDetailModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedBeing && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{selectedBeing.name || 'Ser sin nombre'}</Text>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setShowDetailModal(false)}
                  >
                    <Text style={styles.closeIcon}>✕</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalBody}>
                  {/* Avatar grande */}
                  <View style={styles.modalAvatarContainer}>
                    <Text style={styles.modalAvatar}>{selectedBeing.avatar || '🧬'}</Text>
                    <View style={[
                      styles.modalStatusBadge,
                      { backgroundColor: getStatusColor(selectedBeing.status) }
                    ]}>
                      <Text style={styles.modalStatusText}>
                        {getStatusText(selectedBeing.status)}
                      </Text>
                    </View>
                  </View>

                  {/* Estadísticas */}
                  <View style={styles.statsContainer}>
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>Nivel</Text>
                      <Text style={styles.statValue}>{selectedBeing.level || 1}</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>Poder</Text>
                      <Text style={styles.statValue}>{getBeingPowerLevel(selectedBeing)}</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>XP</Text>
                      <Text style={styles.statValue}>{selectedBeing.experience || 0}</Text>
                    </View>
                  </View>

                  {/* Todos los atributos */}
                  <View style={styles.allAttributesContainer}>
                    <Text style={styles.sectionTitle}>Atributos</Text>
                    {selectedBeing.attributes && Object.entries(selectedBeing.attributes).map(([key, value]) => {
                      const attrConfig = ATTRIBUTES[key];
                      if (!attrConfig) return null;

                      return (
                        <View key={key} style={styles.attributeRow}>
                          <View style={styles.attributeLabel}>
                            <Text style={styles.attributeIcon}>{attrConfig.icon}</Text>
                            <Text style={styles.attributeName}>{attrConfig.name}</Text>
                          </View>
                          <View style={styles.attributeBarContainer}>
                            <View style={styles.attributeBarBg}>
                              <View
                                style={[
                                  styles.attributeBarFill,
                                  {
                                    width: `${value}%`,
                                    backgroundColor: attrConfig.color
                                  }
                                ]}
                              />
                            </View>
                            <Text style={styles.attributeValue}>{value}</Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>

                  {/* Acciones */}
                  <View style={styles.actionsContainer}>
                    {selectedBeing.status === 'deployed' && (
                      <TouchableOpacity
                        style={[styles.actionButton, styles.actionButtonRecall]}
                        onPress={() => onRecallBeing(selectedBeing.id)}
                      >
                        <Text style={styles.actionButtonText}>Retirar de misión</Text>
                      </TouchableOpacity>
                    )}

                    {selectedBeing.status === 'available' && (
                      <TouchableOpacity
                        style={[styles.actionButton, styles.actionButtonDeploy]}
                        onPress={() => {
                          setShowDetailModal(false);
                          // Navegar al mapa o lista de crisis
                          navigation.navigate('Map');
                        }}
                      >
                        <Text style={styles.actionButtonText}>Desplegar en crisis</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* MODAL DE FUSIÓN */}
      <Modal
        visible={showFusionModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFusionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>⚗️ Laboratorio de Fusión</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowFusionModal(false)}
              >
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {/* Opción disponible: Fusión de Piezas */}
              <View style={styles.fusionOptionAvailable}>
                <Text style={styles.fusionOptionIcon}>🧩</Text>
                <Text style={styles.fusionOptionTitle}>Fusión de Fragmentos</Text>
                <Text style={styles.fusionOptionDesc}>
                  Combina 3 fragmentos del mismo atributo para crear uno más poderoso
                </Text>
                <TouchableOpacity
                  style={styles.fusionOptionButton}
                  onPress={() => {
                    setShowFusionModal(false);
                    navigation.navigate('Command', { screen: 'PieceFusion' });
                  }}
                >
                  <Text style={styles.fusionOptionButtonText}>Ir a Fusión de Fragmentos</Text>
                </TouchableOpacity>
              </View>

              {/* Opción: Fusión de Seres */}
              <View style={styles.fusionOptionAvailable}>
                <Text style={styles.fusionOptionIcon}>🧬</Text>
                <Text style={styles.fusionOptionTitle}>Fusión de Seres</Text>
                <Text style={styles.fusionOptionDesc}>
                  Fusiona dos seres para crear uno con atributos combinados (+20% bonus)
                </Text>
                <TouchableOpacity
                  style={styles.fusionOptionButton}
                  onPress={() => {
                    setShowFusionModal(false);
                    navigation.navigate('BeingFusion');
                  }}
                >
                  <Text style={styles.fusionOptionButtonText}>Ir a Fusión de Seres</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════
// ESTILOS
// ═══════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg.primary
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: COLORS.bg.secondary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.accent.primary + '20'
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.bg.elevated,
    justifyContent: 'center',
    alignItems: 'center'
  },

  backIcon: {
    fontSize: 24,
    color: COLORS.text.primary
  },

  headerCenter: {
    flex: 1,
    alignItems: 'center'
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 4
  },

  headerSubtitle: {
    fontSize: 12,
    color: COLORS.text.secondary
  },

  fusionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.accent.primary,
    justifyContent: 'center',
    alignItems: 'center'
  },

  fusionIcon: {
    fontSize: 20
  },

  // Filtros
  filtersContainer: {
    backgroundColor: COLORS.bg.secondary,
    paddingVertical: 12
  },

  filtersContent: {
    paddingHorizontal: 16,
    gap: 8
  },

  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: COLORS.bg.elevated,
    marginRight: 8
  },

  filterButtonActive: {
    backgroundColor: COLORS.accent.primary
  },

  filterButtonText: {
    color: COLORS.text.secondary,
    fontSize: 14,
    fontWeight: '600'
  },

  filterButtonTextActive: {
    color: COLORS.text.primary
  },

  // Lista
  listContent: {
    padding: 16,
    gap: 16
  },

  // Being Card
  beingCard: {
    backgroundColor: COLORS.bg.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.accent.primary + '20',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },

  beingCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },

  beingAvatarContainer: {
    position: 'relative',
    marginRight: 12
  },

  beingAvatar: {
    fontSize: 40
  },

  statusIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.bg.card
  },

  beingInfo: {
    flex: 1
  },

  beingName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 4
  },

  statusText: {
    fontSize: 12,
    fontWeight: '600'
  },

  powerLevelContainer: {
    alignItems: 'center',
    paddingLeft: 12,
    borderLeftWidth: 1,
    borderLeftColor: COLORS.accent.primary + '20'
  },

  powerLevelLabel: {
    fontSize: 10,
    color: COLORS.text.secondary,
    marginBottom: 2
  },

  powerLevelValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.accent.primary
  },

  // Atributos preview
  attributesPreview: {
    gap: 8
  },

  attributeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },

  attributeIcon: {
    fontSize: 16,
    width: 24
  },

  attributeBarContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },

  attributeBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: COLORS.bg.primary,
    borderRadius: 3,
    overflow: 'hidden'
  },

  attributeBarFill: {
    height: '100%',
    borderRadius: 3
  },

  attributeValue: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text.secondary,
    minWidth: 30,
    textAlign: 'right'
  },

  missionBadge: {
    marginTop: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: COLORS.accent.critical + '20',
    borderRadius: 8,
    alignItems: 'center'
  },

  missionBadgeText: {
    color: COLORS.accent.critical,
    fontSize: 12,
    fontWeight: '600'
  },

  // Estado vacío
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32
  },

  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
    opacity: 0.5
  },

  emptyStateText: {
    fontSize: 16,
    color: COLORS.text.secondary,
    textAlign: 'center'
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end'
  },

  modalContent: {
    backgroundColor: COLORS.bg.secondary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    minHeight: '50%'
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.accent.primary + '20'
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text.primary
  },

  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.bg.elevated,
    justifyContent: 'center',
    alignItems: 'center'
  },

  closeIcon: {
    fontSize: 20,
    color: COLORS.text.primary
  },

  modalBody: {
    padding: 20
  },

  modalAvatarContainer: {
    alignItems: 'center',
    marginBottom: 24
  },

  modalAvatar: {
    fontSize: 80,
    marginBottom: 12
  },

  modalStatusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 16
  },

  modalStatusText: {
    color: COLORS.text.primary,
    fontSize: 14,
    fontWeight: '600'
  },

  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
    padding: 16,
    backgroundColor: COLORS.bg.elevated,
    borderRadius: 12
  },

  statItem: {
    alignItems: 'center'
  },

  statLabel: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginBottom: 4
  },

  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.accent.primary
  },

  allAttributesContainer: {
    marginBottom: 24
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 12
  },

  attributeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12
  },

  attributeLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 0.4
  },

  attributeName: {
    fontSize: 14,
    color: COLORS.text.secondary,
    flex: 1
  },

  actionsContainer: {
    gap: 12
  },

  actionButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center'
  },

  actionButtonDeploy: {
    backgroundColor: COLORS.accent.success
  },

  actionButtonRecall: {
    backgroundColor: COLORS.accent.warning
  },

  actionButtonText: {
    color: COLORS.text.primary,
    fontSize: 16,
    fontWeight: '600'
  },

  // Fusión modal - Opciones
  fusionOptionAvailable: {
    backgroundColor: COLORS.bg.elevated,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: COLORS.accent.primary,
    alignItems: 'center'
  },

  fusionOptionComingSoon: {
    backgroundColor: COLORS.bg.elevated,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    opacity: 0.6
  },

  fusionOptionIcon: {
    fontSize: 48,
    marginBottom: 12
  },

  fusionOptionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 8
  },

  fusionOptionDesc: {
    fontSize: 14,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20
  },

  fusionOptionButton: {
    backgroundColor: COLORS.accent.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12
  },

  fusionOptionButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600'
  },

  comingSoonBadge: {
    backgroundColor: COLORS.bg.card,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 12
  },

  comingSoonBadgeText: {
    fontSize: 13,
    color: COLORS.text.dim,
    fontWeight: '600'
  },

  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.bg.secondary,
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8
  },

  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: COLORS.bg.elevated,
    alignItems: 'center'
  },

  tabButtonActive: {
    backgroundColor: COLORS.accent.primary
  },

  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text.secondary
  },

  tabTextActive: {
    color: COLORS.text.primary
  },

  // Piezas
  pieceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bg.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.accent.primary + '20'
  },

  pieceIcon: {
    fontSize: 32,
    marginRight: 12
  },

  pieceInfo: {
    flex: 1
  },

  pieceName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4
  },

  pieceDescription: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginBottom: 6
  },

  pieceRarityBadge: {
    alignSelf: 'flex-start'
  },

  pieceRarity: {
    fontSize: 10,
    fontWeight: '700'
  },

  piecePower: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.accent.primary
  },

  // Comunidades
  communityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bg.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.accent.secondary + '30'
  },

  communityIcon: {
    fontSize: 40,
    marginRight: 12
  },

  communityInfo: {
    flex: 1
  },

  communityName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 4
  },

  communityDescription: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginBottom: 6
  },

  communityBeings: {
    fontSize: 11,
    color: COLORS.accent.primary,
    fontWeight: '600'
  },

  activateButton: {
    backgroundColor: COLORS.accent.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8
  },

  activateButtonText: {
    color: COLORS.text.primary,
    fontWeight: '600',
    fontSize: 14
  },

  activatedBadge: {
    backgroundColor: COLORS.accent.success + '30',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8
  },

  activatedText: {
    color: COLORS.accent.success,
    fontWeight: '600',
    fontSize: 12
  },

  emptyStateHint: {
    fontSize: 12,
    color: COLORS.text.dim,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32
  },

  // Botón crear ser prominente
  createBeingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accent.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    marginTop: 24,
    gap: 12,
    shadowColor: COLORS.accent.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8
  },

  createBeingIcon: {
    fontSize: 28
  },

  createBeingText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff'
  },

  alternativeButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24
  },

  alternativeText: {
    fontSize: 14,
    color: COLORS.accent.secondary,
    textAlign: 'center'
  }
});

export default BeingsScreen;
