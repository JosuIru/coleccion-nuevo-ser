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
  FlatList,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { realNewsCrisisService } from '../services/RealNewsCrisisService';
import useGameStore from '../stores/gameStore';
import logger from '../utils/logger';
import { COLORS, CRISIS_TYPES, ATTRIBUTES } from '../config/constants';
import FirstMissionTutorial from '../components/FirstMissionTutorial';
import EnergyIndicator from '../components/EnergyIndicator';

// New mechanics components
import TransitionProgressCard from '../components/TransitionProgressCard';
import PowerNodesPanel from '../components/PowerNodesPanel';
import ExplorationPanel from '../components/ExplorationPanel';
import QuizModal from '../components/QuizModal';
import EvolutionModal from '../components/EvolutionModal';

// Phase 2-5: New Narrative Components
import GuardiansPanel from '../components/GuardiansPanel';
import GuardianBattleModal from '../components/GuardianBattleModal';
import InstitutionsPanel from '../components/InstitutionsPanel';
import ConsciousnessIndexPanel from '../components/ConsciousnessIndexPanel';
import RealWorldChallengesPanel from '../components/RealWorldChallengesPanel';

// New services (use named exports for instances)
import { explorationService } from '../services/ExplorationService';
import guardiansService from '../services/GuardiansService';
import institutionsService from '../services/InstitutionsService';
import transitionService from '../services/TransitionService';

// Animaciones de celebración
import { CelebrationOverlay, LevelUpOverlay } from '../components/animations';
import soundService from '../services/SoundService';

// Sistema de combate
import { BattleScreen } from '../components/combat';

// Globo 3D
import Globe3D from '../components/Globe3D';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ============================================================================
// COMPONENTES AUXILIARES
// ============================================================================

// Mapa mundial local
const WorldMapImage = require('../assets/images/world_map.png');

/**
 * Contenido del mapa (reutilizable en normal y fullscreen)
 */
const MapContent = ({ crises, onCrisisSelect, selectedCrisis, isFullscreen }) => {
  const normalizeCoords = (lat, lon) => {
    // Ajustado para imagen world_map.png (1280x836, aspect ratio 1.53:1)
    // La imagen muestra aprox latitudes -60° a 85° (no proyección equirectangular pura)
    const minLat = -60;
    const maxLat = 85;
    const latRange = maxLat - minLat; // 145°

    const x = (lon + 180) / 360;
    const y = (maxLat - lat) / latRange;

    return { x: x * 100, y: y * 100 };
  };

  const getUrgencyColor = (urgency) => {
    if (urgency >= 8) return '#ef4444';
    if (urgency >= 6) return '#f97316';
    if (urgency >= 4) return '#eab308';
    return '#22c55e';
  };

  const getUrgencySize = (urgency) => {
    const base = isFullscreen ? 18 : 14;
    return base + (urgency * (isFullscreen ? 2 : 1.5));
  };

  return (
    <>
      <Image
        source={WorldMapImage}
        style={styles.worldMapImage}
        resizeMode="cover"
      />
      <View style={styles.mapOverlay} />

      {crises.map((crisis) => {
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
                borderColor: isSelected ? '#fff' : 'rgba(255,255,255,0.5)',
                transform: [{ scale: isSelected ? 1.3 : 1 }],
                shadowColor: getUrgencyColor(crisis.urgency),
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.8,
                shadowRadius: 6,
                elevation: 5,
              }
            ]}
            onPress={() => onCrisisSelect(crisis)}
          >
            <Text style={[styles.crisisPointIcon, isFullscreen && { fontSize: 12 }]}>
              {crisis.typeIcon}
            </Text>
          </TouchableOpacity>
        );
      })}
    </>
  );
};

/**
 * Mapa mundial con imagen real y puntos de crisis
 */
const WorldMapView = ({ crises, onCrisisSelect, selectedCrisis }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  return (
    <>
      <View style={styles.mapContainer}>
        <View style={styles.mapBackground}>
          <MapContent
            crises={crises}
            onCrisisSelect={onCrisisSelect}
            selectedCrisis={selectedCrisis}
            isFullscreen={false}
          />
        </View>

        {/* Botón expandir */}
        <TouchableOpacity
          style={styles.expandButton}
          onPress={() => setIsFullscreen(true)}
        >
          <Icon name="fullscreen" size={20} color="#fff" />
        </TouchableOpacity>

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

      {/* Modal pantalla completa */}
      <Modal
        visible={isFullscreen}
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setIsFullscreen(false)}
      >
        <View style={styles.fullscreenContainer}>
          <View style={styles.fullscreenMap}>
            <MapContent
              crises={crises}
              onCrisisSelect={(crisis) => {
                onCrisisSelect(crisis);
                setIsFullscreen(false);
              }}
              selectedCrisis={selectedCrisis}
              isFullscreen={true}
            />
          </View>

          {/* Leyenda fullscreen */}
          <View style={styles.fullscreenLegend}>
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

          {/* Botón cerrar */}
          <TouchableOpacity
            style={styles.closeFullscreenButton}
            onPress={() => setIsFullscreen(false)}
          >
            <Icon name="close" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
      </Modal>
    </>
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
                <View key={`crisis_${crisis.id}_${attr}`} style={styles.attributeItem}>
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
              <View style={styles.beingsGridExpanded}>
                {beings.map(being => {
                  const isSelected = selectedBeings.find(b => b.id === being.id);
                  const isAvailable = being.status === 'available';

                  // Calcular compatibilidad del ser con la crisis
                  const calculateBeingMatch = () => {
                    if (!crisis?.requiredAttributes || !being.attributes) return 0;
                    let match = 0;
                    let total = 0;
                    Object.entries(crisis.requiredAttributes).forEach(([attr, required]) => {
                      total += required;
                      match += Math.min(being.attributes[attr] || 0, required);
                    });
                    return total > 0 ? Math.round((match / total) * 100) : 0;
                  };

                  const matchScore = calculateBeingMatch();
                  const matchColor = matchScore >= 70 ? '#22c55e' : matchScore >= 40 ? '#eab308' : '#ef4444';

                  // Obtener top 3 atributos del ser
                  const topAttributes = being.attributes
                    ? Object.entries(being.attributes)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 3)
                    : [];

                  return (
                    <TouchableOpacity
                      key={being.id}
                      style={[
                        styles.beingCardExpanded,
                        isSelected && styles.beingCardSelected,
                        !isAvailable && styles.beingCardDisabled
                      ]}
                      onPress={() => toggleBeingSelection(being)}
                      disabled={!isAvailable}
                    >
                      {/* Header con avatar y match */}
                      <View style={styles.beingCardHeader}>
                        <Text style={styles.beingAvatarLarge}>{being.avatar || '🧬'}</Text>
                        <View style={styles.beingCardInfo}>
                          <Text style={styles.beingNameExpanded} numberOfLines={1}>{being.name}</Text>
                          <Text style={[styles.beingStatusExpanded, { color: isAvailable ? '#22c55e' : '#f97316' }]}>
                            {isAvailable ? '● Disponible' : being.status === 'deployed' ? '● En misión' : '● Descansando'}
                          </Text>
                        </View>
                        {/* Indicador de compatibilidad */}
                        <View style={[styles.matchBadge, { backgroundColor: matchColor + '20', borderColor: matchColor }]}>
                          <Text style={[styles.matchText, { color: matchColor }]}>{matchScore}%</Text>
                        </View>
                      </View>

                      {/* Atributos principales */}
                      <View style={styles.beingAttributesRow}>
                        {topAttributes.map(([attr, value]) => (
                          <View key={`${being.id}_attr_${attr}`} style={styles.beingAttrItem}>
                            <Text style={styles.beingAttrIcon}>{ATTRIBUTES[attr]?.icon || '📊'}</Text>
                            <Text style={styles.beingAttrValue}>{value}</Text>
                          </View>
                        ))}
                      </View>

                      {/* Atributos requeridos que tiene este ser */}
                      {crisis?.requiredAttributes && (
                        <View style={styles.beingRequiredRow}>
                          {Object.entries(crisis.requiredAttributes).slice(0, 3).map(([attr, required]) => {
                            const hasValue = being.attributes?.[attr] || 0;
                            const isSufficient = hasValue >= required;
                            return (
                              <View key={`${being.id}_req_${attr}`} style={styles.beingReqItem}>
                                <Text style={styles.beingReqIcon}>{ATTRIBUTES[attr]?.icon || '📊'}</Text>
                                <Text style={[styles.beingReqValue, { color: isSufficient ? '#22c55e' : '#ef4444' }]}>
                                  {hasValue}/{required}
                                </Text>
                              </View>
                            );
                          })}
                        </View>
                      )}

                      {isSelected && (
                        <View style={styles.selectedBadge}>
                          <Icon name="check" size={14} color="#fff" />
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
  // Estado básico
  const [crises, setCrises] = useState([]);
  const [selectedCrisis, setSelectedCrisis] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({});
  const [viewMode, setViewMode] = useState('map'); // 'map' | 'list'
  const [filterType, setFilterType] = useState(null);
  const [showFirstMissionTutorial, setShowFirstMissionTutorial] = useState(false);

  // Modal de bienvenida para nuevos usuarios
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  // Estados para animaciones de celebración
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationType, setCelebrationType] = useState('confetti');
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [newLevel, setNewLevel] = useState(1);
  const [missionResult, setMissionResult] = useState(null);

  // Estados para combate de crisis
  const [showCrisisBattle, setShowCrisisBattle] = useState(false);
  const [battleCrisis, setBattleCrisis] = useState(null);
  const [battleBeing, setBattleBeing] = useState(null);
  const [pendingBattleRewards, setPendingBattleRewards] = useState(null);

  // Detección de orientación usando Dimensions API con listener
  const [screenDimensions, setScreenDimensions] = useState(() => {
    const { width, height } = Dimensions.get('screen');
    return { width, height };
  });

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ screen }) => {
      setScreenDimensions({ width: screen.width, height: screen.height });
    });
    return () => subscription?.remove();
  }, []);

  // Detectar landscape basado en dimensiones de pantalla
  const isLandscape = screenDimensions.width > screenDimensions.height;

  // New features state
  const [activeTab, setActiveTab] = useState('crisis'); // 'crisis' | 'explore' | 'sanctuary' | 'guardians' | 'institutions' | 'gaia'

  // Phase 2-5: New narrative states
  const [showGuardianBattle, setShowGuardianBattle] = useState(false);
  const [selectedGuardian, setSelectedGuardian] = useState(null);
  const [currentBattle, setCurrentBattle] = useState(null);
  const [gaiaStatus, setGaiaStatus] = useState(null);
  const [allGuardians, setAllGuardians] = useState([]);
  const [allInstitutions, setAllInstitutions] = useState([]);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [showEvolutionModal, setShowEvolutionModal] = useState(false);
  const [selectedBeingForEvolution, setSelectedBeingForEvolution] = useState(null);
  const [availableEvolutions, setAvailableEvolutions] = useState([]);
  const [explorationRegions, setExplorationRegions] = useState([]);
  const [selectedBeingForAction, setSelectedBeingForAction] = useState(null);

  // Store - Extended with new mechanics
  const {
    user,
    beings,
    addXP,
    addConsciousness,
    deployBeing,
    // New mechanics
    powerNodes,
    hiddenBeings,
    knowledge,
    exploration,
    transition,
    guardians,
    institutions,
    // New actions
    initializeAllSystems,
    visitSanctuary,
    enterCorruptionZone,
    startExpedition,
    completeExpedition,
    submitQuizAnswers,
    getQuizForBook,
    checkEvolutionAvailable,
    evolveBeing,
    getTransitionProgress,
    getTransitionNarrative,
    updateTransitionStat,
    // Guardian actions
    startGuardianBattle,
    executeGuardianBattleAction,
    fleeGuardianBattle,
    // Institution actions
    buildInstitution,
    upgradeInstitution,
    collectInstitutionResources
  } = useGameStore();

  // Cargar crisis y sistemas al montar
  useEffect(() => {
    loadCrises();
    checkFirstMissionTutorial();
    initializeNewSystems();
    checkWelcomeModal();
  }, []);

  // Verificar si mostrar modal de bienvenida (usuarios nuevos)
  const checkWelcomeModal = async () => {
    try {
      const welcomeShown = await AsyncStorage.getItem('welcome_modal_shown');
      // Mostrar si: no se ha mostrado antes Y tiene el ser inicial (tutorial completado)
      if (!welcomeShown && beings.length > 0 && (user.stats?.beingsCreated || 0) <= 1) {
        // Mostrar después de 1 segundo
        setTimeout(() => {
          setShowWelcomeModal(true);
        }, 1000);
      }
    } catch (error) {
      logger.warn('CommandCenter', 'Error checking welcome modal:', error);
    }
  };

  const handleWelcomeComplete = async () => {
    setShowWelcomeModal(false);
    try {
      await AsyncStorage.setItem('welcome_modal_shown', 'true');
    } catch (e) {}
  };

  // Initialize new game systems
  const initializeNewSystems = async () => {
    try {
      await initializeAllSystems();

      // Load exploration regions
      await explorationService.initialize();
      const regions = explorationService.getAvailableRegions();
      setExplorationRegions(regions);

      // Load Phase 2-5 systems
      await guardiansService.initialize();
      const guardians = guardiansService.getAllGuardians();
      setAllGuardians(guardians);

      await institutionsService.initialize();
      const institutions = institutionsService.getAllInstitutions();
      setAllInstitutions(institutions);

      await transitionService.initialize();
      const gaia = transitionService.getGaiaStatus();
      setGaiaStatus(gaia);
    } catch (error) {
      logger.error('CommandCenter', 'Error initializing new systems', error);
    }
  };

  // Verificar si debe mostrar el tutorial de primera misión
  const checkFirstMissionTutorial = async () => {
    try {
      const tutorialCompleted = await AsyncStorage.getItem('first_mission_tutorial_completed');
      const hasCompletedMissions = user.missionsCompleted > 0;

      // Mostrar tutorial si no se ha completado Y no tiene misiones completadas
      if (!tutorialCompleted && !hasCompletedMissions) {
        // Esperar 2 segundos para que la pantalla cargue
        setTimeout(() => {
          setShowFirstMissionTutorial(true);
        }, 2000);
      }
    } catch (error) {
      logger.error('CommandCenter', 'Error checking tutorial status', error);
    }
  };

  const handleTutorialComplete = () => {
    setShowFirstMissionTutorial(false);
  };

  const handleTutorialDismiss = () => {
    setShowFirstMissionTutorial(false);
  };

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
      logger.error('CommandCenter', 'Error loading crises', error);
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
      logger.error('CommandCenter', 'Error refreshing crises', error);
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
    // Cerrar modal de detalle
    setShowDetailModal(false);
    setShowFullscreenMap(false);

    // Guardar contexto de la batalla
    setBattleCrisis(crisis);
    setBattleBeing(selectedBeings[0]); // Usar el primer ser seleccionado
    setPendingBattleRewards({
      baseXp: crisis.rewards.xp,
      baseConsciousness: crisis.rewards.consciousness,
      selectedBeings,
      probability
    });

    // Iniciar combate interactivo
    setTimeout(() => {
      setShowCrisisBattle(true);
    }, 300);
  };

  // Manejar resultado del combate
  const handleBattleComplete = (success, rewards) => {
    setShowCrisisBattle(false);

    const pendingRewards = pendingBattleRewards;
    if (!pendingRewards) return;

    // Calcular recompensas finales basadas en resultado de batalla
    const multiplier = success ? 1.0 : 0.3;
    const xpGained = Math.round(pendingRewards.baseXp * multiplier);
    const consciousnessGained = Math.round(pendingRewards.baseConsciousness * multiplier);

    // Aplicar recompensas
    addXP(xpGained);
    addConsciousness(consciousnessGained);

    // Actualizar estado de seres
    pendingRewards.selectedBeings.forEach(being => {
      deployBeing(being.id, battleCrisis.id);
    });

    // Remover crisis de la lista
    setCrises(prev => prev.filter(c => c.id !== battleCrisis.id));

    // Guardar resultado y mostrar animación
    const previousLevel = user.level || 1;
    setMissionResult({
      success,
      xpGained,
      consciousnessGained
    });

    // Reproducir sonido y vibración
    if (success) {
      soundService.playSuccess();
      setCelebrationType('confetti');
    } else {
      soundService.playError();
      setCelebrationType('sparkles');
    }
    setShowCelebration(true);

    // Verificar si subió de nivel (después de actualizar el store)
    setTimeout(() => {
      const currentLevel = useGameStore.getState().user?.level || 1;
      if (currentLevel > previousLevel) {
        soundService.playLevelUp();
        setNewLevel(currentLevel);
        setShowLevelUp(true);
      }
    }, 500);

    // Update transition stats
    updateTransitionStat('crisesResolved', 1);
    updateTransitionStat('missionsCompleted', 1);

    // Limpiar estado de batalla
    setBattleCrisis(null);
    setBattleBeing(null);
    setPendingBattleRewards(null);
  };

  const handleBattleCancel = () => {
    setShowCrisisBattle(false);
    setBattleCrisis(null);
    setBattleBeing(null);
    setPendingBattleRewards(null);
    // Reabrir modal de detalle
    setShowDetailModal(true);
  };

  // ========== NEW FEATURE HANDLERS ==========

  // Handle sanctuary visit
  const handleSanctuaryPress = async (sanctuary) => {
    if (!selectedBeingForAction) {
      alert('Selecciona un ser primero para entrenar en el santuario');
      return;
    }
    const result = await visitSanctuary(sanctuary.id, selectedBeingForAction.id);
    if (result.success) {
      alert(`¡${selectedBeingForAction.name} ha entrenado en ${sanctuary.name}!`);
    }
  };

  // Handle corruption zone entry
  const handleCorruptionZonePress = async (zone) => {
    if (!selectedBeingForAction) {
      alert('Selecciona un ser primero para entrar en la zona de corrupción');
      return;
    }
    const confirm = await new Promise(resolve => {
      alert(`¿Estás seguro de enviar a ${selectedBeingForAction.name} a la zona de ${zone.type}? Podría corromperse.`);
      resolve(true); // In production, use a proper confirmation dialog
    });
    if (confirm) {
      const result = await enterCorruptionZone(zone.id, selectedBeingForAction.id);
      if (result.corrupted) {
        alert(`¡${selectedBeingForAction.name} ha sido corrompido por ${zone.type}!`);
      } else {
        alert(`¡${selectedBeingForAction.name} ha sobrevivido a la zona de corrupción!`);
      }
    }
  };

  // Handle exploration
  const handleExplore = async (region) => {
    if (!selectedBeingForAction) {
      alert('Selecciona un ser primero para explorar');
      return;
    }
    const result = await startExpedition(region.id, selectedBeingForAction.id);
    if (result?.error) {
      alert(result.error);
    } else if (result) {
      alert(`¡${selectedBeingForAction.name} ha comenzado a explorar ${region.name}!`);
    }
  };

  // Handle expedition completion
  const handleCompleteExpedition = async () => {
    const result = await completeExpedition();
    if (result?.success) {
      let message = '¡Expedición completada! ';
      if (result.discoveries?.length > 0) {
        message += `Descubrimientos: ${result.discoveries.map(d => d.type).join(', ')}`;
      }
      alert(message);
    }
  };

  // Handle quiz
  const handleStartQuiz = (bookId) => {
    const quiz = getQuizForBook(bookId);
    if (quiz) {
      setCurrentQuiz({ ...quiz, bookId });
      setShowQuizModal(true);
    }
  };

  const handleSubmitQuiz = async (answers) => {
    if (!currentQuiz) return;
    const result = await submitQuizAnswers(currentQuiz.bookId, answers);
    return result;
  };

  // Handle evolution
  const handleOpenEvolution = (being) => {
    const evolutions = checkEvolutionAvailable(being.id);
    setSelectedBeingForEvolution(being);
    setAvailableEvolutions(evolutions || []);
    setShowEvolutionModal(true);
  };

  const handleEvolveBeing = async (beingId, evolutionPathId) => {
    const result = await evolveBeing(beingId, evolutionPathId);
    return result;
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
      {/* Header siempre compacto para funcionar en ambas orientaciones */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Icon name="shield-star" size={20} color={COLORS.accent.primary} />
          <Text style={styles.headerTitle}>Comando</Text>
        </View>
        <View style={styles.headerRight}>
          <EnergyIndicator
            compact
            onPress={() => navigation.navigate('ConsciousnessShop')}
          />
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleRefresh}
          >
            <Icon name="refresh" size={18} color={COLORS.text.secondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats compactos inline */}
      <View style={styles.statsBarCompact}>
        <View style={styles.statItemCompact}>
          <Icon name="earth" size={14} color={COLORS.accent.primary} />
          <Text style={styles.statValueCompact}>{crises.length}</Text>
          <Text style={styles.statLabelCompact}>Crisis</Text>
        </View>
        <View style={styles.statItemCompact}>
          <Icon name="fire" size={14} color="#ef4444" />
          <Text style={styles.statValueCompact}>{stats.byUrgency?.critical || 0}</Text>
          <Text style={styles.statLabelCompact}>Críticas</Text>
        </View>
        <View style={styles.statItemCompact}>
          <Icon name="star" size={14} color="#eab308" />
          <Text style={styles.statValueCompact}>{user.consciousnessPoints || 0}</Text>
          <Text style={styles.statLabelCompact}>Consc.</Text>
        </View>
        <View style={styles.statItemCompact}>
          <Icon name="lightning-bolt" size={14} color="#22c55e" />
          <Text style={styles.statValueCompact}>{user.energy || 0}</Text>
          <Text style={styles.statLabelCompact}>Energía</Text>
        </View>
      </View>

      {/* Main Feature Tabs - Solo en portrait mode */}
      {!isLandscape && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.mainTabsScroll}
          contentContainerStyle={styles.mainTabs}
        >
          {/* Tab Crisis - Siempre visible (principal) */}
          <TouchableOpacity
            style={[styles.mainTab, activeTab === 'crisis' && styles.mainTabActive]}
            onPress={() => setActiveTab('crisis')}
          >
            <Icon name="earth" size={16} color={activeTab === 'crisis' ? '#fff' : COLORS.text.secondary} />
            <Text style={[styles.mainTabText, activeTab === 'crisis' && styles.mainTabTextActive]}>Crisis</Text>
          </TouchableOpacity>

          {/* Tabs avanzados - Solo visibles a partir de nivel 3 */}
          {(user.level || 1) >= 3 && (
            <>
              <TouchableOpacity
                style={[styles.mainTab, activeTab === 'guardians' && styles.mainTabActive]}
                onPress={() => setActiveTab('guardians')}
              >
                <Icon name="sword-cross" size={16} color={activeTab === 'guardians' ? '#fff' : COLORS.text.secondary} />
                <Text style={[styles.mainTabText, activeTab === 'guardians' && styles.mainTabTextActive]}>Guardianes</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.mainTab, activeTab === 'institutions' && styles.mainTabActive]}
                onPress={() => setActiveTab('institutions')}
              >
                <Icon name="domain" size={16} color={activeTab === 'institutions' ? '#fff' : COLORS.text.secondary} />
                <Text style={[styles.mainTabText, activeTab === 'institutions' && styles.mainTabTextActive]}>Instituciones</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.mainTab, activeTab === 'gaia' && styles.mainTabActive]}
                onPress={() => setActiveTab('gaia')}
              >
                <Icon name="earth-plus" size={16} color={activeTab === 'gaia' ? '#fff' : COLORS.text.secondary} />
                <Text style={[styles.mainTabText, activeTab === 'gaia' && styles.mainTabTextActive]}>Gaia</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.mainTab, activeTab === 'explore' && styles.mainTabActive]}
                onPress={() => setActiveTab('explore')}
              >
                <Icon name="compass" size={16} color={activeTab === 'explore' ? '#fff' : COLORS.text.secondary} />
                <Text style={[styles.mainTabText, activeTab === 'explore' && styles.mainTabTextActive]}>Explorar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.mainTab, activeTab === 'sanctuary' && styles.mainTabActive]}
                onPress={() => setActiveTab('sanctuary')}
              >
                <Icon name="star-four-points" size={16} color={activeTab === 'sanctuary' ? '#fff' : COLORS.text.secondary} />
                <Text style={[styles.mainTabText, activeTab === 'sanctuary' && styles.mainTabTextActive]}>Nodos</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Indicador de desbloqueo para usuarios nivel 1-2 */}
          {(user.level || 1) < 3 && (
            <View style={styles.lockedTabIndicator}>
              <Icon name="lock" size={14} color={COLORS.text.dim} />
              <Text style={styles.lockedTabText}>+5 tabs en nivel 3</Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* Being Selector for Actions (shown in explore/sanctuary tabs) */}
      {(activeTab === 'explore' || activeTab === 'sanctuary') && (
        <View style={styles.beingSelectorContainer}>
          <Text style={styles.beingSelectorLabel}>Ser activo:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {beings.filter(b => b.status === 'available').map(being => (
              <TouchableOpacity
                key={being.id}
                style={[
                  styles.beingSelectorItem,
                  selectedBeingForAction?.id === being.id && styles.beingSelectorItemActive
                ]}
                onPress={() => setSelectedBeingForAction(being)}
              >
                <Text style={styles.beingSelectorAvatar}>{being.avatar || '🧬'}</Text>
                <Text style={styles.beingSelectorName} numberOfLines={1}>{being.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Render content based on active tab */}
      {(activeTab === 'crisis' || isLandscape) && (
        <>
          {/* Toggle y filtros - Layout compacto en landscape */}
          <View style={[styles.viewToggle, isLandscape && styles.viewToggleLandscape]}>
            <TouchableOpacity
              style={[styles.toggleButton, isLandscape && styles.toggleButtonLandscape, viewMode === 'map' && styles.toggleButtonActive]}
              onPress={() => setViewMode('map')}
            >
              <Icon name="earth" size={isLandscape ? 14 : 18} color={viewMode === 'map' ? '#fff' : COLORS.text.secondary} />
              {!isLandscape && <Text style={[styles.toggleText, viewMode === 'map' && styles.toggleTextActive]}>Mapa</Text>}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, isLandscape && styles.toggleButtonLandscape, viewMode === 'list' && styles.toggleButtonActive]}
              onPress={() => setViewMode('list')}
            >
              <Icon name="format-list-bulleted" size={isLandscape ? 14 : 18} color={viewMode === 'list' ? '#fff' : COLORS.text.secondary} />
              {!isLandscape && <Text style={[styles.toggleText, viewMode === 'list' && styles.toggleTextActive]}>Lista</Text>}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, isLandscape && styles.toggleButtonLandscape, viewMode === '3d' && styles.toggleButtonActive]}
              onPress={() => setViewMode('3d')}
            >
              <Icon name="rotate-3d-variant" size={isLandscape ? 14 : 18} color={viewMode === '3d' ? '#fff' : COLORS.text.secondary} />
              {!isLandscape && <Text style={[styles.toggleText, viewMode === '3d' && styles.toggleTextActive]}>3D</Text>}
            </TouchableOpacity>

            {/* Filtros inline en landscape */}
            {isLandscape && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScrollLandscape}>
                {Object.entries(CRISIS_TYPES).slice(0, 4).map(([type, config]) => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.filterChipLandscape, filterType === type && styles.filterChipActive]}
                    onPress={() => setFilterType(filterType === type ? null : type)}
                  >
                    <Text style={styles.filterChipIcon}>{config.icon}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Filtros de tipo - Solo en portrait */}
          {!isLandscape && (
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
          )}

          {/* Contenido principal */}
          {viewMode === 'map' ? (
            <WorldMapView
              crises={filteredCrises}
              onCrisisSelect={handleCrisisSelect}
              selectedCrisis={selectedCrisis}
            />
          ) : viewMode === '3d' ? (
            <View style={styles.globe3DContainer}>
              <Globe3D
                crises={filteredCrises}
                onCrisisSelect={handleCrisisSelect}
                selectedCrisis={selectedCrisis}
              />
            </View>
          ) : (
            <FlatList
              data={filteredCrises}
              keyExtractor={item => item.id}
              numColumns={isLandscape ? 2 : 1}
              key={isLandscape ? 'landscape' : 'portrait'}
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
        </>
      )}

      {/* Exploration Tab Content */}
      {activeTab === 'explore' && (
        <ExplorationPanel
          regions={explorationRegions}
          exploredRegions={exploration?.exploredRegions || []}
          currentExpedition={exploration?.currentExpedition}
          selectedBeing={selectedBeingForAction}
          userEnergy={user.energy || 0}
          onExplore={handleExplore}
          onCompleteExpedition={handleCompleteExpedition}
        />
      )}

      {/* Sanctuary/Power Nodes Tab Content */}
      {activeTab === 'sanctuary' && (
        <PowerNodesPanel
          sanctuaries={powerNodes?.sanctuaries || []}
          corruptionZones={powerNodes?.corruptionZones || []}
          onSanctuaryPress={handleSanctuaryPress}
          onCorruptionZonePress={handleCorruptionZonePress}
          selectedBeing={selectedBeingForAction}
        />
      )}

      {/* Guardians Tab Content */}
      {activeTab === 'guardians' && (
        <GuardiansPanel
          guardians={allGuardians}
          playerLevel={user.level || 1}
          onSelectGuardian={(guardian) => {
            setSelectedGuardian(guardian);
            setShowGuardianBattle(true);
          }}
          onViewTransformation={(guardian) => {
            // Show transformation details
            logger.info('CommandCenter', `View transformation: ${guardian.transformation?.name || 'unknown'}`);
          }}
        />
      )}

      {/* Institutions Tab Content */}
      {activeTab === 'institutions' && (
        <InstitutionsPanel
          institutions={allInstitutions}
          gameState={{
            level: user.level || 1,
            completedQuizzes: knowledge?.completedQuizzes || [],
            resources: { wisdomFragments: knowledge?.wisdomFragments || 0 },
            awakenedBeings: beings || [],
            globalConsciousness: transition?.totalTranscendence || 15,
            transformedGuardians: guardians?.transformed || []
          }}
          onBuild={async (institutionId) => {
            const result = await buildInstitution(institutionId);
            if (result.success) {
              const updated = institutionsService.getAllInstitutions();
              setAllInstitutions(updated);
            }
          }}
          onUpgrade={async (institutionId) => {
            const result = await upgradeInstitution(institutionId);
            if (result.success) {
              const updated = institutionsService.getAllInstitutions();
              setAllInstitutions(updated);
            }
          }}
          onCollectResources={async () => {
            const result = await collectInstitutionResources();
            if (result.success && result.hasResources) {
              // Show collected resources feedback
              logger.info('CommandCenter', `Resources collected: ${JSON.stringify(result.collected)}`);
            }
          }}
        />
      )}

      {/* Gaia/Consciousness Tab Content */}
      {activeTab === 'gaia' && (
        <ConsciousnessIndexPanel
          gaiaStatus={gaiaStatus || {}}
          guardiansProgress={{
            transformed: guardians?.transformed?.length || 0,
            total: 7
          }}
          institutionsProgress={{
            built: institutions?.built?.length || 0,
            total: 7
          }}
          onRefreshMessage={() => {
            const newStatus = transitionService.getGaiaStatus();
            setGaiaStatus(newStatus);
          }}
          onViewDetails={() => navigation.navigate('Profile')}
        />
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

      {/* Tutorial de primera misión */}
      <FirstMissionTutorial
        visible={showFirstMissionTutorial}
        onComplete={handleTutorialComplete}
        onDismiss={handleTutorialDismiss}
      />

      {/* Quiz Modal */}
      <QuizModal
        visible={showQuizModal}
        quiz={currentQuiz}
        bookTitle={currentQuiz?.bookTitle || 'Quiz'}
        onSubmit={handleSubmitQuiz}
        onClose={() => {
          setShowQuizModal(false);
          setCurrentQuiz(null);
        }}
      />

      {/* Evolution Modal */}
      {/* Guardian Battle Modal */}
      <GuardianBattleModal
        visible={showGuardianBattle}
        guardian={selectedGuardian}
        battle={currentBattle}
        playerBeings={beings.filter(b => b.status === 'available').slice(0, 3)}
        onAction={async (actionType, details) => {
          const result = await executeGuardianBattleAction(actionType, details);
          if (result.battle) {
            setCurrentBattle(result.battle);
          }
          if (result.victory !== undefined) {
            // Battle ended
            const updatedGuardians = guardiansService.getAllGuardians();
            setAllGuardians(updatedGuardians);
            setShowGuardianBattle(false);
            setSelectedGuardian(null);
            setCurrentBattle(null);
          }
          return result;
        }}
        onFlee={async () => {
          await fleeGuardianBattle();
          setShowGuardianBattle(false);
          setSelectedGuardian(null);
          setCurrentBattle(null);
        }}
        onClose={() => {
          setShowGuardianBattle(false);
          setSelectedGuardian(null);
          setCurrentBattle(null);
        }}
        onStartBattle={async (teamBeingIds) => {
          const result = await startGuardianBattle(selectedGuardian.id, teamBeingIds);
          if (result.success) {
            setCurrentBattle(result.battle);
          }
          return result;
        }}
      />

      <EvolutionModal
        visible={showEvolutionModal}
        being={selectedBeingForEvolution}
        availableEvolutions={availableEvolutions}
        onEvolve={handleEvolveBeing}
        onClose={() => {
          setShowEvolutionModal(false);
          setSelectedBeingForEvolution(null);
          setAvailableEvolutions([]);
        }}
      />

      {/* Sistema de combate por turnos */}
      <BattleScreen
        visible={showCrisisBattle}
        being={battleBeing}
        crisis={battleCrisis}
        onComplete={handleBattleComplete}
        onCancel={handleBattleCancel}
      />

      {/* Animación de celebración (confetti/estrellas) */}
      <CelebrationOverlay
        visible={showCelebration}
        type={celebrationType}
        particleCount={celebrationType === 'confetti' ? 60 : 30}
        onComplete={() => {
          setShowCelebration(false);
          // Mostrar resultado después de la animación
          if (missionResult) {
            setTimeout(() => {
              // Toast o pequeño modal con resultado (opcional)
            }, 200);
          }
        }}
      />

      {/* Animación de Level Up */}
      <LevelUpOverlay
        visible={showLevelUp}
        level={newLevel}
        onComplete={() => setShowLevelUp(false)}
      />

      {/* Modal de bienvenida para nuevos usuarios */}
      <Modal
        visible={showWelcomeModal}
        transparent
        animationType="fade"
        onRequestClose={handleWelcomeComplete}
      >
        <View style={styles.welcomeOverlay}>
          <View style={styles.welcomeModal}>
            <Text style={styles.welcomeIcon}>🎉</Text>
            <Text style={styles.welcomeTitle}>¡Bienvenido al Despertar!</Text>

            <View style={styles.welcomeContent}>
              <Text style={styles.welcomeText}>
                Ya tienes tu primer ser: <Text style={styles.welcomeHighlight}>"Primer Despertar"</Text>
              </Text>

              <View style={styles.welcomeSteps}>
                <View style={styles.welcomeStep}>
                  <Text style={styles.welcomeStepNumber}>1</Text>
                  <Text style={styles.welcomeStepText}>Selecciona una crisis en el mapa</Text>
                </View>
                <View style={styles.welcomeStep}>
                  <Text style={styles.welcomeStepNumber}>2</Text>
                  <Text style={styles.welcomeStepText}>Elige tu ser para desplegarla</Text>
                </View>
                <View style={styles.welcomeStep}>
                  <Text style={styles.welcomeStepNumber}>3</Text>
                  <Text style={styles.welcomeStepText}>¡Resuelve la crisis y gana recompensas!</Text>
                </View>
              </View>

              <View style={styles.welcomeResources}>
                <View style={styles.welcomeResource}>
                  <Text style={styles.welcomeResourceIcon}>⚡</Text>
                  <Text style={styles.welcomeResourceValue}>{user.energy || 100}</Text>
                  <Text style={styles.welcomeResourceLabel}>Energía</Text>
                </View>
                <View style={styles.welcomeResource}>
                  <Text style={styles.welcomeResourceIcon}>💎</Text>
                  <Text style={styles.welcomeResourceValue}>{user.consciousnessPoints || 100}</Text>
                  <Text style={styles.welcomeResourceLabel}>Consciencia</Text>
                </View>
                <View style={styles.welcomeResource}>
                  <Text style={styles.welcomeResourceIcon}>🧬</Text>
                  <Text style={styles.welcomeResourceValue}>{beings.length}</Text>
                  <Text style={styles.welcomeResourceLabel}>Seres</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.welcomeButton}
              onPress={handleWelcomeComplete}
            >
              <Text style={styles.welcomeButtonText}>¡Empezar a Jugar!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.bg.elevated
  },
  headerCompact: {
    paddingVertical: 4,
    paddingHorizontal: 8
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text.primary
  },
  headerTitleCompact: {
    fontSize: 14
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
    paddingVertical: 8,
    backgroundColor: COLORS.bg.elevated,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.bg.card
  },
  statsBarCompact: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: COLORS.bg.elevated,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.bg.card
  },
  statItem: {
    alignItems: 'center',
    gap: 2
  },
  statItemCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  statValueCompact: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.text.primary
  },
  statLabelCompact: {
    fontSize: 9,
    color: COLORS.text.secondary
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
    marginHorizontal: 8,
    marginVertical: 4,
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

  // Landscape Layout Styles
  landscapeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: COLORS.bg.elevated,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.bg.card
  },
  landscapeHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  landscapeTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text.primary
  },
  landscapeStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  landscapeStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  landscapeStatValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.text.primary
  },
  landscapeActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  viewToggleLandscape: {
    margin: 6,
    padding: 2,
    flexDirection: 'row',
    alignItems: 'center'
  },
  toggleButtonLandscape: {
    flex: 0,
    paddingHorizontal: 10,
    paddingVertical: 4
  },
  filtersScrollLandscape: {
    flex: 1,
    marginLeft: 8
  },
  filterChipLandscape: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: COLORS.bg.card,
    borderRadius: 12,
    marginRight: 6
  },

  // Filters
  filtersScroll: {
    maxHeight: 36,
    paddingHorizontal: 8,
    marginBottom: 4
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
    minHeight: 250,
    margin: 6,
    marginTop: 2,
    backgroundColor: COLORS.bg.elevated,
    borderRadius: 12,
    overflow: 'hidden'
  },
  globe3DContainer: {
    flex: 1,
    minHeight: 280,
    margin: 6,
    marginTop: 2,
    backgroundColor: '#0a1628',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)'
  },
  expandButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10
  },
  fullscreenContainer: {
    flex: 1,
    backgroundColor: '#0a1628'
  },
  fullscreenMap: {
    flex: 1,
    position: 'relative'
  },
  fullscreenLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(0,0,0,0.8)',
    gap: 16
  },
  closeFullscreenButton: {
    position: 'absolute',
    top: 40,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10
  },
  mapBackground: {
    flex: 1,
    backgroundColor: '#0a1628',
    position: 'relative'
  },
  worldMapImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    opacity: 0.8
  },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 22, 40, 0.3)'
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

  // Beings Grid - Versión expandida con atributos
  beingsGridExpanded: {
    gap: 12,
    marginBottom: 16
  },
  beingCardExpanded: {
    backgroundColor: COLORS.bg.elevated,
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    borderColor: COLORS.bg.card,
    position: 'relative'
  },
  beingCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10
  },
  beingAvatarLarge: {
    fontSize: 36
  },
  beingCardInfo: {
    flex: 1
  },
  beingNameExpanded: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 2
  },
  beingStatusExpanded: {
    fontSize: 11,
    fontWeight: '500'
  },
  matchBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1
  },
  matchText: {
    fontSize: 14,
    fontWeight: 'bold'
  },
  beingAttributesRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 16,
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.bg.card
  },
  beingAttrItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  beingAttrIcon: {
    fontSize: 14
  },
  beingAttrValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text.secondary
  },
  beingRequiredRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 16
  },
  beingReqItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  beingReqIcon: {
    fontSize: 12
  },
  beingReqValue: {
    fontSize: 12,
    fontWeight: '600'
  },
  beingCardSelected: {
    borderColor: COLORS.accent.primary,
    backgroundColor: 'rgba(96,165,250,0.1)'
  },
  beingCardDisabled: {
    opacity: 0.5
  },
  selectedBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: COLORS.accent.primary,
    borderRadius: 12,
    width: 24,
    height: 24,
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
  },

  // ========== NEW FEATURE STYLES ==========

  // Main Feature Tabs
  mainTabsScroll: {
    maxHeight: 50,
    marginHorizontal: 8,
    marginTop: 8
  },
  mainTabs: {
    flexDirection: 'row',
    backgroundColor: COLORS.bg.elevated,
    borderRadius: 10,
    padding: 4,
    gap: 4
  },
  mainTab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
    borderRadius: 8
  },
  mainTabActive: {
    backgroundColor: '#8B5CF6'
  },
  mainTabText: {
    fontSize: 13,
    color: COLORS.text.secondary,
    fontWeight: '500'
  },
  mainTabTextActive: {
    color: '#fff',
    fontWeight: '600'
  },

  // Indicador de tabs bloqueados
  lockedTabIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: COLORS.bg.elevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.text.dim + '30'
  },

  lockedTabText: {
    fontSize: 11,
    color: COLORS.text.dim,
    fontStyle: 'italic'
  },

  // Being Selector
  beingSelectorContainer: {
    paddingHorizontal: 12,
    paddingBottom: 8
  },
  beingSelectorLabel: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginBottom: 8
  },
  beingSelectorItem: {
    alignItems: 'center',
    backgroundColor: COLORS.bg.elevated,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginRight: 10,
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: 80
  },
  beingSelectorItemActive: {
    borderColor: '#8B5CF6',
    backgroundColor: 'rgba(139, 92, 246, 0.1)'
  },
  beingSelectorAvatar: {
    fontSize: 28,
    marginBottom: 4
  },
  beingSelectorName: {
    fontSize: 11,
    color: COLORS.text.primary,
    textAlign: 'center',
    maxWidth: 70
  },

  // Welcome Modal Styles
  welcomeOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },

  welcomeModal: {
    backgroundColor: COLORS.bg.secondary,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.accent.primary + '40'
  },

  welcomeIcon: {
    fontSize: 64,
    marginBottom: 16
  },

  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text.primary,
    textAlign: 'center',
    marginBottom: 20
  },

  welcomeContent: {
    width: '100%'
  },

  welcomeText: {
    fontSize: 15,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22
  },

  welcomeHighlight: {
    color: COLORS.accent.primary,
    fontWeight: '600'
  },

  welcomeSteps: {
    backgroundColor: COLORS.bg.elevated,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20
  },

  welcomeStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },

  welcomeStepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.accent.primary,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 28,
    fontSize: 14,
    fontWeight: '700',
    marginRight: 12
  },

  welcomeStepText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text.primary
  },

  welcomeResources: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8
  },

  welcomeResource: {
    alignItems: 'center'
  },

  welcomeResourceIcon: {
    fontSize: 28,
    marginBottom: 4
  },

  welcomeResourceValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.accent.primary
  },

  welcomeResourceLabel: {
    fontSize: 11,
    color: COLORS.text.secondary
  },

  welcomeButton: {
    backgroundColor: COLORS.accent.primary,
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 16,
    marginTop: 16,
    shadowColor: COLORS.accent.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8
  },

  welcomeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700'
  }
});

export default CommandCenterScreen;
