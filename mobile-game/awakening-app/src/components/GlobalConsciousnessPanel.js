/**
 * GlobalConsciousnessPanel - Panel del Índice de Consciencia Global
 *
 * Muestra el progreso hacia La Gran Transición:
 * - Índice de Consciencia Global (0-100%)
 * - Nivel de conexión con Gaia
 * - Mensaje actual de Gaia
 * - Poderes desbloqueados
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Modal,
  ScrollView,
  Dimensions
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import useGameStore from '../stores/gameStore';
import transitionService from '../services/TransitionService';
import { COLORS } from '../config/constants';

const { width } = Dimensions.get('window');

// Colores por nivel de Gaia
const GAIA_COLORS = {
  dormant: '#4B5563',      // Gris
  stirring: '#6366F1',     // Índigo
  awakening: '#8B5CF6',    // Púrpura
  connected: '#06B6D4',    // Cyan
  flourishing: '#10B981',  // Esmeralda
  thriving: '#22C55E',     // Verde
  transcending: '#F59E0B', // Ámbar
  awakened: '#FFD700'      // Dorado
};

const GAIA_ICONS = {
  dormant: 'sleep',
  stirring: 'eye-outline',
  awakening: 'eye',
  connected: 'link-variant',
  flourishing: 'flower',
  thriving: 'tree',
  transcending: 'star-four-points',
  awakened: 'white-balance-sunny'
};

/**
 * Componente compacto para la barra superior
 */
export const GlobalConsciousnessCompact = ({ onPress }) => {
  const { transition } = useGameStore();
  const [gaiaStatus, setGaiaStatus] = useState(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const status = transitionService.getGaiaStatus();
    setGaiaStatus(status);

    // Animación de pulso sutil
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 2000,
          useNativeDriver: true
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true
        })
      ])
    ).start();
  }, [transition]);

  if (!gaiaStatus) return null;

  const color = GAIA_COLORS[gaiaStatus.level] || GAIA_COLORS.dormant;

  return (
    <TouchableOpacity style={styles.compactContainer} onPress={onPress}>
      <Animated.View style={[styles.compactGlow, {
        backgroundColor: color + '30',
        transform: [{ scale: pulseAnim }]
      }]} />
      <View style={styles.compactContent}>
        <Icon name="earth" size={16} color={color} />
        <Text style={[styles.compactPercentage, { color }]}>
          {gaiaStatus.consciousness}%
        </Text>
        <View style={styles.compactBar}>
          <View style={[styles.compactBarFill, {
            width: `${gaiaStatus.consciousness}%`,
            backgroundColor: color
          }]} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

/**
 * Panel completo expandible
 */
const GlobalConsciousnessPanel = ({ visible, onClose }) => {
  const { transition, guardians, institutions } = useGameStore();
  const [gaiaStatus, setGaiaStatus] = useState(null);
  const [progressReport, setProgressReport] = useState(null);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      const status = transitionService.getGaiaStatus();
      const report = transitionService.getProgressReport();
      setGaiaStatus(status);
      setProgressReport(report);

      // Animación de entrada
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true
        }),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 20000,
          useNativeDriver: true
        })
      ]).start();
    } else {
      scaleAnim.setValue(0);
      rotateAnim.setValue(0);
    }
  }, [visible]);

  if (!gaiaStatus) return null;

  const color = GAIA_COLORS[gaiaStatus.level] || GAIA_COLORS.dormant;
  const icon = GAIA_ICONS[gaiaStatus.level] || 'earth';

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Animated.View style={[
          styles.panelContainer,
          { transform: [{ scale: scaleAnim }] }
        ]}>
          {/* Header con Gaia */}
          <View style={[styles.header, { backgroundColor: color + '20' }]}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Icon name="close" size={24} color={COLORS.text.primary} />
            </TouchableOpacity>

            {/* Círculo central animado */}
            <View style={styles.centerCircle}>
              <Animated.View style={[
                styles.outerRing,
                {
                  borderColor: color,
                  transform: [{ rotate: spin }]
                }
              ]} />
              <View style={[styles.innerCircle, { backgroundColor: color + '30' }]}>
                <Icon name={icon} size={48} color={color} />
                <Text style={[styles.percentageText, { color }]}>
                  {gaiaStatus.consciousness}%
                </Text>
              </View>
            </View>

            <Text style={styles.levelName}>{gaiaStatus.levelName}</Text>
            <Text style={styles.consciousnessLabel}>Consciencia Global</Text>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Mensaje de Gaia */}
            {gaiaStatus.currentMessage && (
              <View style={[styles.messageBox, { borderLeftColor: color }]}>
                <Text style={styles.messageType}>
                  {gaiaStatus.currentMessage.type === 'whisper' ? '🌬️' :
                   gaiaStatus.currentMessage.type === 'dream' ? '💭' :
                   gaiaStatus.currentMessage.type === 'intuition' ? '✨' :
                   gaiaStatus.currentMessage.type === 'voice' ? '🗣️' :
                   gaiaStatus.currentMessage.type === 'vision' ? '👁️' :
                   gaiaStatus.currentMessage.type === 'teaching' ? '📚' :
                   gaiaStatus.currentMessage.type === 'prophecy' ? '🔮' : '🌍'}
                  {' '}Gaia dice:
                </Text>
                <Text style={styles.messageText}>
                  "{gaiaStatus.currentMessage.text}"
                </Text>
              </View>
            )}

            {/* Poderes activos */}
            {gaiaStatus.powers?.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Poderes Activos</Text>
                {gaiaStatus.powers.map((power, index) => (
                  <View key={index} style={styles.powerItem}>
                    <Icon name="star-four-points" size={16} color={color} />
                    <Text style={styles.powerText}>{power}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Progreso hacia siguiente nivel */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Progreso al Siguiente Nivel</Text>
              <View style={styles.progressBar}>
                <View style={[
                  styles.progressFill,
                  {
                    width: `${gaiaStatus.progressToNextLevel}%`,
                    backgroundColor: color
                  }
                ]} />
              </View>
              <Text style={styles.progressText}>
                {gaiaStatus.progressToNextLevel}% hacia {gaiaStatus.nextLevelAt}%
              </Text>
            </View>

            {/* Contribuciones */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tus Contribuciones</Text>

              <View style={styles.contributionGrid}>
                <View style={styles.contributionItem}>
                  <Icon name="shield-sword" size={24} color="#EF4444" />
                  <Text style={styles.contributionValue}>
                    {guardians?.progress?.transformed || 0}/7
                  </Text>
                  <Text style={styles.contributionLabel}>Guardianes</Text>
                </View>

                <View style={styles.contributionItem}>
                  <Icon name="bank" size={24} color="#8B5CF6" />
                  <Text style={styles.contributionValue}>
                    {institutions?.progress?.built || 0}/7
                  </Text>
                  <Text style={styles.contributionLabel}>Instituciones</Text>
                </View>

                <View style={styles.contributionItem}>
                  <Icon name="book-open-variant" size={24} color="#F59E0B" />
                  <Text style={styles.contributionValue}>
                    {transition?.completedMilestones?.length || 0}
                  </Text>
                  <Text style={styles.contributionLabel}>Hitos</Text>
                </View>
              </View>
            </View>

            {/* Próximos hitos */}
            {progressReport?.nextMilestones?.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Próximos Hitos</Text>
                {progressReport.nextMilestones.slice(0, 3).map((milestone, index) => (
                  <View key={index} style={styles.milestoneItem}>
                    <Text style={styles.milestoneIcon}>{milestone.pillarIcon}</Text>
                    <View style={styles.milestoneInfo}>
                      <Text style={styles.milestoneName}>{milestone.name}</Text>
                      <Text style={styles.milestoneDesc}>{milestone.description}</Text>
                      {milestone.currentProgress && Object.entries(milestone.currentProgress).map(([key, prog]) => (
                        <View key={key} style={styles.milestoneProgress}>
                          <View style={styles.milestoneProgressBar}>
                            <View style={[
                              styles.milestoneProgressFill,
                              { width: `${prog.percentage}%` }
                            ]} />
                          </View>
                          <Text style={styles.milestoneProgressText}>
                            {prog.current}/{prog.required}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Llamada a la acción */}
            <View style={[styles.callToAction, { backgroundColor: color + '20' }]}>
              <Icon name="lightbulb-on" size={32} color={color} />
              <Text style={styles.ctaText}>
                {gaiaStatus.consciousness < 25
                  ? 'Resuelve crisis y completa quizzes para aumentar la consciencia global.'
                  : gaiaStatus.consciousness < 50
                  ? 'Desafía a los Guardianes y construye Instituciones del Nuevo Ser.'
                  : gaiaStatus.consciousness < 75
                  ? 'Estás cerca del punto de inflexión. ¡Sigue adelante!'
                  : gaiaStatus.consciousness < 100
                  ? 'La Gran Transición está cerca. Prepárate para el mundo real.'
                  : '¡Has completado La Gran Transición! Los desafíos del mundo real te esperan.'}
              </Text>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  // Compact styles
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.bg.elevated,
    position: 'relative',
    overflow: 'hidden'
  },
  compactGlow: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    left: -10,
    top: -10
  },
  compactContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  compactPercentage: {
    fontSize: 14,
    fontWeight: 'bold'
  },
  compactBar: {
    width: 60,
    height: 4,
    backgroundColor: COLORS.bg.primary,
    borderRadius: 2,
    overflow: 'hidden'
  },
  compactBarFill: {
    height: '100%',
    borderRadius: 2
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  panelContainer: {
    width: width - 40,
    maxHeight: '85%',
    backgroundColor: COLORS.bg.secondary,
    borderRadius: 24,
    overflow: 'hidden'
  },
  header: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 24,
    position: 'relative'
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 8
  },
  centerCircle: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10
  },
  outerRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    borderStyle: 'dashed'
  },
  innerCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    justifyContent: 'center',
    alignItems: 'center'
  },
  percentageText: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 4
  },
  levelName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginTop: 12
  },
  consciousnessLabel: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginTop: 4
  },

  // Content styles
  content: {
    padding: 20
  },
  messageBox: {
    backgroundColor: COLORS.bg.elevated,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4
  },
  messageType: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginBottom: 8
  },
  messageText: {
    fontSize: 16,
    color: COLORS.text.primary,
    fontStyle: 'italic',
    lineHeight: 24
  },

  section: {
    marginBottom: 24
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: 12
  },

  powerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: COLORS.bg.elevated,
    borderRadius: 8,
    marginBottom: 8
  },
  powerText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text.secondary
  },

  progressBar: {
    height: 8,
    backgroundColor: COLORS.bg.elevated,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8
  },
  progressFill: {
    height: '100%',
    borderRadius: 4
  },
  progressText: {
    fontSize: 12,
    color: COLORS.text.secondary,
    textAlign: 'center'
  },

  contributionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around'
  },
  contributionItem: {
    alignItems: 'center',
    padding: 12,
    backgroundColor: COLORS.bg.elevated,
    borderRadius: 12,
    minWidth: 90
  },
  contributionValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginTop: 8
  },
  contributionLabel: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginTop: 4
  },

  milestoneItem: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    backgroundColor: COLORS.bg.elevated,
    borderRadius: 12,
    marginBottom: 12
  },
  milestoneIcon: {
    fontSize: 24
  },
  milestoneInfo: {
    flex: 1
  },
  milestoneName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text.primary
  },
  milestoneDesc: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginTop: 4
  },
  milestoneProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8
  },
  milestoneProgressBar: {
    flex: 1,
    height: 4,
    backgroundColor: COLORS.bg.primary,
    borderRadius: 2,
    overflow: 'hidden'
  },
  milestoneProgressFill: {
    height: '100%',
    backgroundColor: COLORS.accent.primary,
    borderRadius: 2
  },
  milestoneProgressText: {
    fontSize: 11,
    color: COLORS.text.muted
  },

  callToAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    borderRadius: 16,
    marginTop: 8,
    marginBottom: 20
  },
  ctaText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text.primary,
    lineHeight: 22
  }
});

export default GlobalConsciousnessPanel;
