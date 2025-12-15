/**
 * CRISIS DETAIL SCREEN - Detalle de crisis
 * Información completa, selección de seres y despliegue
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  FlatList,
  Dimensions,
  Alert
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import useGameStore from '../stores/gameStore';
import { COLORS, ATTRIBUTES, CRISIS_TYPES, RESOURCES } from '../config/constants';

const { width } = Dimensions.get('window');

const CrisisDetailScreen = ({ route, navigation }) => {
  // ═══════════════════════════════════════════════════════════
  // ESTADO
  // ═══════════════════════════════════════════════════════════

  const { crisis } = route.params || {};
  const [selectedBeings, setSelectedBeings] = useState([]);
  const [deploymentInProgress, setDeploymentInProgress] = useState(false);

  // Zustand store
  const {
    user,
    beings,
    deployBeing,
    consumeEnergy,
    addXP,
    addConsciousness,
    resolveCrisis
  } = useGameStore();

  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const timerAnim = useRef(new Animated.Value(0)).current;

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

  // Animación del timer si hay misión activa
  useEffect(() => {
    if (crisis?.active) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(timerAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true
          }),
          Animated.timing(timerAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true
          })
        ])
      ).start();
    }
  }, [crisis?.active]);

  // ═══════════════════════════════════════════════════════════
  // CÁLCULOS
  // ═══════════════════════════════════════════════════════════

  const availableBeings = beings.filter(b => b.status === 'available');

  const calculateSuccessProbability = () => {
    if (!crisis || selectedBeings.length === 0) return 0;

    let totalMatch = 0;
    let totalRequired = 0;

    // Calcular match de atributos requeridos
    if (crisis.requiredAttributes) {
      Object.entries(crisis.requiredAttributes).forEach(([attr, required]) => {
        totalRequired += required;

        const teamValue = selectedBeings.reduce((sum, being) => {
          return sum + (being.attributes?.[attr] || 0);
        }, 0);

        totalMatch += Math.min(teamValue, required);
      });
    }

    if (totalRequired === 0) return 50; // Base probability

    const probability = Math.min(95, Math.round((totalMatch / totalRequired) * 100));
    return probability;
  };

  const calculateEnergyCost = () => {
    return selectedBeings.length * RESOURCES.ENERGY.COST_DEPLOY_BEING;
  };

  const successProbability = calculateSuccessProbability();
  const energyCost = calculateEnergyCost();

  // ═══════════════════════════════════════════════════════════
  // ACCIONES
  // ═══════════════════════════════════════════════════════════

  const toggleBeingSelection = (being) => {
    const isSelected = selectedBeings.find(b => b.id === being.id);

    if (isSelected) {
      setSelectedBeings(selectedBeings.filter(b => b.id !== being.id));
    } else {
      setSelectedBeings([...selectedBeings, being]);
    }
  };

  const onConfirmDeployment = () => {
    // Validaciones
    if (selectedBeings.length === 0) {
      Alert.alert('Error', 'Debes seleccionar al menos un ser');
      return;
    }

    if (user.energy < energyCost) {
      Alert.alert('Energía insuficiente', `Necesitas ${energyCost} de energía. Tienes ${user.energy}`);
      return;
    }

    // Confirmación
    Alert.alert(
      'Confirmar despliegue',
      `¿Desplegar ${selectedBeings.length} ser(es) en esta crisis?\n\nProbabilidad de éxito: ${successProbability}%\nCosto de energía: ${energyCost}`,
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Desplegar',
          onPress: handleDeployment
        }
      ]
    );
  };

  const handleDeployment = () => {
    setDeploymentInProgress(true);

    // Desplegar cada ser
    selectedBeings.forEach(being => {
      deployBeing(being.id, crisis.id);
    });

    // Simular resolución de crisis (en una app real, esto sería asíncrono)
    setTimeout(() => {
      const success = Math.random() * 100 < successProbability;

      if (success) {
        // Crisis resuelta exitosamente
        const rewards = {
          xp: crisis.rewards?.xp || 50,
          consciousness: crisis.rewards?.consciousness || 20,
          energy: crisis.rewards?.energy || 0
        };

        resolveCrisis(crisis.id, true, rewards);

        Alert.alert(
          '¡Éxito!',
          `La crisis ha sido resuelta exitosamente.\n\n+${rewards.xp} XP\n+${rewards.consciousness} Consciencia`,
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack()
            }
          ]
        );
      } else {
        // Fallo
        Alert.alert(
          'Misión fallida',
          'Los seres no pudieron resolver la crisis. Inténtalo de nuevo con un equipo más fuerte.',
          [
            {
              text: 'OK',
              onPress: () => {
                setDeploymentInProgress(false);
                setSelectedBeings([]);
              }
            }
          ]
        );
      }
    }, 2000);
  };

  // ═══════════════════════════════════════════════════════════
  // RENDER BEING SELECTOR
  // ═══════════════════════════════════════════════════════════

  const renderBeingSelector = ({ item: being }) => {
    const isSelected = selectedBeings.find(b => b.id === being.id);

    return (
      <TouchableOpacity
        style={[
          styles.beingSelectorCard,
          isSelected && styles.beingSelectorCardSelected
        ]}
        onPress={() => toggleBeingSelection(being)}
        activeOpacity={0.7}
      >
        <View style={styles.beingSelectorHeader}>
          <Text style={styles.beingSelectorAvatar}>{being.avatar || '🧬'}</Text>
          <View style={styles.beingSelectorInfo}>
            <Text style={styles.beingSelectorName} numberOfLines={1}>
              {being.name || 'Sin nombre'}
            </Text>
            <Text style={styles.beingSelectorLevel}>Nv. {being.level || 1}</Text>
          </View>
          {isSelected && (
            <View style={styles.selectedIndicator}>
              <Text style={styles.selectedCheckmark}>✓</Text>
            </View>
          )}
        </View>

        {/* Atributos relevantes */}
        {crisis?.requiredAttributes && (
          <View style={styles.beingAttributesPreview}>
            {Object.keys(crisis.requiredAttributes).slice(0, 2).map(attr => {
              const attrConfig = ATTRIBUTES[attr];
              const value = being.attributes?.[attr] || 0;

              if (!attrConfig) return null;

              return (
                <View key={attr} style={styles.miniAttrRow}>
                  <Text style={styles.miniAttrIcon}>{attrConfig.icon}</Text>
                  <Text style={styles.miniAttrValue}>{value}</Text>
                </View>
              );
            })}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════

  if (!crisis) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Crisis no encontrada</Text>
      </View>
    );
  }

  const crisisType = CRISIS_TYPES[crisis.type] || {};

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
          <Text style={styles.headerTitle} numberOfLines={1}>
            {crisis.name || 'Crisis sin nombre'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {crisisType.icon} {crisisType.name || 'Tipo desconocido'}
          </Text>
        </View>

        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* MAPA PEQUEÑO */}
        <Animated.View style={[styles.mapContainer, { opacity: fadeAnim }]}>
          <MapView
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            initialRegion={{
              latitude: crisis.lat,
              longitude: crisis.lon,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05
            }}
            scrollEnabled={false}
            zoomEnabled={false}
            pitchEnabled={false}
            rotateEnabled={false}
          >
            <Marker
              coordinate={{
                latitude: crisis.lat,
                longitude: crisis.lon
              }}
            >
              <View style={styles.crisisMapMarker}>
                <Text style={styles.crisisMapMarkerIcon}>🔥</Text>
              </View>
            </Marker>
          </MapView>
        </Animated.View>

        {/* INFORMACIÓN DE LA CRISIS */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Descripción</Text>
          <Text style={styles.descriptionText}>
            {crisis.description || 'Crisis sin descripción disponible.'}
          </Text>

          {/* Escala y ubicación */}
          <View style={styles.metadataRow}>
            <View style={styles.metadataItem}>
              <Text style={styles.metadataLabel}>Escala</Text>
              <Text style={styles.metadataValue}>
                {crisis.scale || 'Local'}
              </Text>
            </View>
            <View style={styles.metadataItem}>
              <Text style={styles.metadataLabel}>Urgencia</Text>
              <Text style={[
                styles.metadataValue,
                { color: crisis.urgency === 'high' ? COLORS.accent.critical : COLORS.accent.warning }
              ]}>
                {crisis.urgency === 'high' ? 'Alta' : crisis.urgency === 'medium' ? 'Media' : 'Baja'}
              </Text>
            </View>
          </View>
        </View>

        {/* ATRIBUTOS REQUERIDOS */}
        {crisis.requiredAttributes && (
          <View style={styles.requirementsSection}>
            <Text style={styles.sectionTitle}>Atributos Requeridos</Text>
            {Object.entries(crisis.requiredAttributes).map(([attr, required]) => {
              const attrConfig = ATTRIBUTES[attr];
              if (!attrConfig) return null;

              const teamValue = selectedBeings.reduce((sum, being) => {
                return sum + (being.attributes?.[attr] || 0);
              }, 0);

              const percentage = Math.min(100, (teamValue / required) * 100);

              return (
                <View key={attr} style={styles.requirementRow}>
                  <View style={styles.requirementLabel}>
                    <Text style={styles.requirementIcon}>{attrConfig.icon}</Text>
                    <Text style={styles.requirementName}>{attrConfig.name}</Text>
                  </View>
                  <View style={styles.requirementBarContainer}>
                    <View style={styles.requirementBarBg}>
                      <View
                        style={[
                          styles.requirementBarFill,
                          {
                            width: `${percentage}%`,
                            backgroundColor: percentage >= 100 ? COLORS.accent.success : attrConfig.color
                          }
                        ]}
                      />
                    </View>
                    <Text style={styles.requirementValue}>
                      {teamValue}/{required}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* SELECCIÓN DE SERES */}
        <View style={styles.beingsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Seleccionar Seres ({selectedBeings.length})
            </Text>
            <Text style={styles.availableCount}>
              {availableBeings.length} disponibles
            </Text>
          </View>

          {availableBeings.length > 0 ? (
            <FlatList
              data={availableBeings}
              renderItem={renderBeingSelector}
              keyExtractor={item => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.beingsList}
            />
          ) : (
            <View style={styles.noBeingsContainer}>
              <Text style={styles.noBeingsText}>
                No hay seres disponibles. Todos están desplegados o descansando.
              </Text>
            </View>
          )}
        </View>

        {/* PROBABILIDAD DE ÉXITO */}
        {selectedBeings.length > 0 && (
          <Animated.View
            style={[
              styles.probabilitySection,
              {
                opacity: fadeAnim,
                transform: [{
                  scale: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.9, 1]
                  })
                }]
              }
            ]}
          >
            <Text style={styles.probabilityLabel}>Probabilidad de Éxito</Text>
            <Text style={[
              styles.probabilityValue,
              {
                color: successProbability >= 70
                  ? COLORS.accent.success
                  : successProbability >= 40
                  ? COLORS.accent.warning
                  : COLORS.accent.critical
              }
            ]}>
              {successProbability}%
            </Text>

            <View style={styles.probabilityBar}>
              <View
                style={[
                  styles.probabilityBarFill,
                  {
                    width: `${successProbability}%`,
                    backgroundColor: successProbability >= 70
                      ? COLORS.accent.success
                      : successProbability >= 40
                      ? COLORS.accent.warning
                      : COLORS.accent.critical
                  }
                ]}
              />
            </View>

            <View style={styles.costRow}>
              <Text style={styles.costLabel}>Costo de Energía:</Text>
              <Text style={[
                styles.costValue,
                { color: user.energy >= energyCost ? COLORS.accent.success : COLORS.accent.critical }
              ]}>
                {energyCost} / {user.energy}
              </Text>
            </View>
          </Animated.View>
        )}

        {/* TIMER DE MISIÓN ACTIVA */}
        {crisis.active && (
          <Animated.View
            style={[
              styles.activeTimerSection,
              { opacity: timerAnim }
            ]}
          >
            <Text style={styles.activeTimerIcon}>⏱️</Text>
            <Text style={styles.activeTimerText}>Misión en curso...</Text>
          </Animated.View>
        )}
      </ScrollView>

      {/* BOTÓN DE DESPLIEGUE */}
      {!crisis.active && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.deployButton,
              (selectedBeings.length === 0 || user.energy < energyCost || deploymentInProgress) &&
              styles.deployButtonDisabled
            ]}
            onPress={onConfirmDeployment}
            disabled={selectedBeings.length === 0 || user.energy < energyCost || deploymentInProgress}
          >
            <Text style={styles.deployButtonText}>
              {deploymentInProgress ? 'Desplegando...' : `Desplegar ${selectedBeings.length} Ser(es)`}
            </Text>
          </TouchableOpacity>
        </View>
      )}
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
    borderBottomColor: COLORS.accent.critical + '40'
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
    alignItems: 'center',
    paddingHorizontal: 12
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 4
  },

  headerSubtitle: {
    fontSize: 12,
    color: COLORS.text.secondary
  },

  headerRight: {
    width: 40
  },

  // Scroll
  scrollView: {
    flex: 1
  },

  scrollContent: {
    paddingBottom: 100
  },

  // Mapa
  mapContainer: {
    height: 200,
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: COLORS.accent.critical
  },

  map: {
    flex: 1
  },

  crisisMapMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.accent.critical,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff'
  },

  crisisMapMarkerIcon: {
    fontSize: 20
  },

  // Secciones
  infoSection: {
    padding: 16,
    backgroundColor: COLORS.bg.secondary,
    marginBottom: 8
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 12
  },

  descriptionText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    lineHeight: 20,
    marginBottom: 16
  },

  metadataRow: {
    flexDirection: 'row',
    gap: 16
  },

  metadataItem: {
    flex: 1,
    padding: 12,
    backgroundColor: COLORS.bg.elevated,
    borderRadius: 8
  },

  metadataLabel: {
    fontSize: 12,
    color: COLORS.text.dim,
    marginBottom: 4
  },

  metadataValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary
  },

  // Requisitos
  requirementsSection: {
    padding: 16,
    backgroundColor: COLORS.bg.secondary,
    marginBottom: 8
  },

  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12
  },

  requirementLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 0.35
  },

  requirementIcon: {
    fontSize: 18
  },

  requirementName: {
    fontSize: 14,
    color: COLORS.text.secondary,
    flex: 1
  },

  requirementBarContainer: {
    flex: 0.65,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },

  requirementBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: COLORS.bg.primary,
    borderRadius: 4,
    overflow: 'hidden'
  },

  requirementBarFill: {
    height: '100%',
    borderRadius: 4
  },

  requirementValue: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text.secondary,
    minWidth: 50,
    textAlign: 'right'
  },

  // Selección de seres
  beingsSection: {
    padding: 16,
    backgroundColor: COLORS.bg.secondary,
    marginBottom: 8
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12
  },

  availableCount: {
    fontSize: 12,
    color: COLORS.text.dim
  },

  beingsList: {
    gap: 12,
    paddingRight: 16
  },

  beingSelectorCard: {
    width: 140,
    padding: 12,
    backgroundColor: COLORS.bg.elevated,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent'
  },

  beingSelectorCardSelected: {
    borderColor: COLORS.accent.primary,
    backgroundColor: COLORS.accent.primary + '20'
  },

  beingSelectorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },

  beingSelectorAvatar: {
    fontSize: 32,
    marginRight: 8
  },

  beingSelectorInfo: {
    flex: 1
  },

  beingSelectorName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 2
  },

  beingSelectorLevel: {
    fontSize: 11,
    color: COLORS.text.dim
  },

  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.accent.success,
    justifyContent: 'center',
    alignItems: 'center'
  },

  selectedCheckmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700'
  },

  beingAttributesPreview: {
    flexDirection: 'row',
    gap: 8
  },

  miniAttrRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: COLORS.bg.primary,
    borderRadius: 6
  },

  miniAttrIcon: {
    fontSize: 12
  },

  miniAttrValue: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.text.secondary
  },

  noBeingsContainer: {
    padding: 20,
    alignItems: 'center'
  },

  noBeingsText: {
    fontSize: 14,
    color: COLORS.text.dim,
    textAlign: 'center'
  },

  // Probabilidad
  probabilitySection: {
    margin: 16,
    padding: 20,
    backgroundColor: COLORS.bg.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.accent.primary + '40'
  },

  probabilityLabel: {
    fontSize: 14,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: 8
  },

  probabilityValue: {
    fontSize: 48,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16
  },

  probabilityBar: {
    height: 12,
    backgroundColor: COLORS.bg.primary,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 16
  },

  probabilityBarFill: {
    height: '100%',
    borderRadius: 6
  },

  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },

  costLabel: {
    fontSize: 14,
    color: COLORS.text.secondary
  },

  costValue: {
    fontSize: 16,
    fontWeight: '600'
  },

  // Timer activo
  activeTimerSection: {
    margin: 16,
    padding: 20,
    backgroundColor: COLORS.accent.warning + '20',
    borderRadius: 16,
    alignItems: 'center'
  },

  activeTimerIcon: {
    fontSize: 40,
    marginBottom: 8
  },

  activeTimerText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.accent.warning
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: COLORS.bg.secondary,
    borderTopWidth: 1,
    borderTopColor: COLORS.accent.primary + '20'
  },

  deployButton: {
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: COLORS.accent.success,
    alignItems: 'center'
  },

  deployButtonDisabled: {
    backgroundColor: COLORS.text.dim,
    opacity: 0.5
  },

  deployButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text.primary
  },

  errorText: {
    fontSize: 16,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginTop: 100
  }
});

export default CrisisDetailScreen;
