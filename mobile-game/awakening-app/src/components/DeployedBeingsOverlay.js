/**
 * DeployedBeingsOverlay.js
 * Overlay que muestra los seres desplegados en misiones activas
 *
 * @version 1.0.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
  Modal,
  Dimensions
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import useGameStore from '../stores/gameStore';
import { COLORS, ATTRIBUTES } from '../config/constants';
import AnimatedBeingMarker from './effects/AnimatedBeingMarker';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Panel colapsable de seres desplegados
 */
const DeployedBeingsOverlay = ({ onBeingSelect, visible = true }) => {
  const { beings } = useGameStore();
  const [expanded, setExpanded] = useState(false);
  const [selectedBeing, setSelectedBeing] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Animaciones
  const expandAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Filtrar seres desplegados
  const deployedBeings = beings.filter(b => b.status === 'deployed');

  // Animación de expansión
  useEffect(() => {
    Animated.spring(expandAnim, {
      toValue: expanded ? 1 : 0,
      friction: 8,
      useNativeDriver: false
    }).start();
  }, [expanded]);

  // Animación de pulso para indicador
  useEffect(() => {
    if (deployedBeings.length > 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true
          })
        ])
      ).start();
    }
  }, [deployedBeings.length]);

  const panelHeight = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [60, 200]
  });

  const handleBeingPress = (being) => {
    setSelectedBeing(being);
    setShowDetailModal(true);
    onBeingSelect?.(being);
  };

  if (!visible || deployedBeings.length === 0) return null;

  return (
    <>
      <Animated.View style={[styles.container, { height: panelHeight }]}>
        {/* Header colapsable */}
        <TouchableOpacity
          style={styles.header}
          onPress={() => setExpanded(!expanded)}
          activeOpacity={0.8}
        >
          <View style={styles.headerLeft}>
            <Animated.View
              style={[
                styles.activeIndicator,
                { transform: [{ scale: pulseAnim }] }
              ]}
            />
            <Text style={styles.headerTitle}>
              Seres Desplegados
            </Text>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{deployedBeings.length}</Text>
            </View>
          </View>

          <Icon
            name={expanded ? 'chevron-down' : 'chevron-up'}
            size={24}
            color={COLORS.text.secondary}
          />
        </TouchableOpacity>

        {/* Lista de seres */}
        <Animated.View
          style={[
            styles.beingsContainer,
            {
              opacity: expandAnim,
              transform: [{
                translateY: expandAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-20, 0]
                })
              }]
            }
          ]}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.beingsScroll}
          >
            {deployedBeings.map(being => (
              <DeployedBeingItem
                key={being.id}
                being={being}
                onPress={() => handleBeingPress(being)}
              />
            ))}
          </ScrollView>
        </Animated.View>
      </Animated.View>

      {/* Modal de detalle */}
      <Modal
        visible={showDetailModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <BeingMissionDetail
              being={selectedBeing}
              onClose={() => setShowDetailModal(false)}
            />
          </View>
        </View>
      </Modal>
    </>
  );
};

/**
 * Item individual de ser desplegado
 */
const DeployedBeingItem = ({ being, onPress }) => {
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Simular progreso de misión
  useEffect(() => {
    if (being.missionProgress) {
      Animated.timing(progressAnim, {
        toValue: being.missionProgress,
        duration: 500,
        useNativeDriver: false
      }).start();
    }
  }, [being.missionProgress]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%']
  });

  return (
    <TouchableOpacity
      style={styles.beingItem}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Mini marcador del ser */}
      <View style={styles.beingMarkerContainer}>
        <AnimatedBeingMarker
          being={being}
          size={40}
          showStatus={false}
        />
      </View>

      {/* Info */}
      <Text style={styles.beingName} numberOfLines={1}>
        {being.name || 'Ser'}
      </Text>

      {/* Barra de progreso */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBg}>
          <Animated.View
            style={[styles.progressBarFill, { width: progressWidth }]}
          />
        </View>
        <Text style={styles.progressText}>
          {being.missionProgress || 0}%
        </Text>
      </View>

      {/* Ubicación */}
      {being.missionLocation && (
        <View style={styles.locationRow}>
          <Icon name="map-marker" size={10} color={COLORS.text.dim} />
          <Text style={styles.locationText} numberOfLines={1}>
            {being.missionLocation}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

/**
 * Detalle de misión activa del ser
 */
const BeingMissionDetail = ({ being, onClose }) => {
  if (!being) return null;

  const getMainAttribute = () => {
    if (!being.attributes) return null;
    const attrs = Object.entries(being.attributes);
    if (attrs.length === 0) return null;
    const [key] = attrs.sort((a, b) => b[1] - a[1])[0];
    return ATTRIBUTES[key];
  };

  const mainAttr = getMainAttribute();

  return (
    <View style={styles.detailContainer}>
      {/* Header */}
      <View style={styles.detailHeader}>
        <View style={styles.detailHeaderLeft}>
          <AnimatedBeingMarker
            being={being}
            size={60}
            showStatus={false}
          />
        </View>
        <View style={styles.detailInfo}>
          <Text style={styles.detailName}>{being.name || 'Ser'}</Text>
          <Text style={styles.detailLevel}>Nivel {being.level || 1}</Text>
          {mainAttr && (
            <View style={[styles.attrTag, { backgroundColor: mainAttr.color + '30' }]}>
              <Text style={styles.attrIcon}>{mainAttr.icon}</Text>
              <Text style={[styles.attrName, { color: mainAttr.color }]}>
                {mainAttr.name}
              </Text>
            </View>
          )}
        </View>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Icon name="close" size={24} color={COLORS.text.secondary} />
        </TouchableOpacity>
      </View>

      {/* Misión activa */}
      <View style={styles.missionSection}>
        <View style={styles.missionHeader}>
          <Icon name="sword-cross" size={20} color={COLORS.accent.critical} />
          <Text style={styles.missionTitle}>Misión Activa</Text>
        </View>

        {being.currentMission ? (
          <>
            <Text style={styles.missionName}>
              {being.currentMission.title || 'Misión en progreso'}
            </Text>

            {/* Progreso */}
            <View style={styles.missionProgressSection}>
              <View style={styles.missionProgressBar}>
                <View
                  style={[
                    styles.missionProgressFill,
                    { width: `${being.missionProgress || 0}%` }
                  ]}
                />
              </View>
              <Text style={styles.missionProgressText}>
                {being.missionProgress || 0}% completado
              </Text>
            </View>

            {/* Tiempo restante */}
            {being.currentMission.timeRemaining && (
              <View style={styles.timeRow}>
                <Icon name="clock-outline" size={16} color={COLORS.text.secondary} />
                <Text style={styles.timeText}>
                  Tiempo restante: {being.currentMission.timeRemaining}
                </Text>
              </View>
            )}

            {/* Recompensas esperadas */}
            {being.currentMission.rewards && (
              <View style={styles.rewardsSection}>
                <Text style={styles.rewardsTitle}>Recompensas al completar:</Text>
                <View style={styles.rewardsRow}>
                  <View style={styles.rewardItem}>
                    <Text style={styles.rewardIcon}>⭐</Text>
                    <Text style={styles.rewardValue}>
                      +{being.currentMission.rewards.xp || 0} XP
                    </Text>
                  </View>
                  <View style={styles.rewardItem}>
                    <Text style={styles.rewardIcon}>🌟</Text>
                    <Text style={styles.rewardValue}>
                      +{being.currentMission.rewards.consciousness || 0}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </>
        ) : (
          <Text style={styles.noMissionText}>
            En espera de asignación de misión
          </Text>
        )}
      </View>

      {/* Acciones */}
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionBtn}>
          <Icon name="map-marker" size={20} color={COLORS.accent.primary} />
          <Text style={styles.actionText}>Ver en mapa</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.actionBtnDanger]}>
          <Icon name="arrow-left" size={20} color={COLORS.accent.warning} />
          <Text style={[styles.actionText, { color: COLORS.accent.warning }]}>
            Retirar
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 80,
    left: 16,
    right: 16,
    backgroundColor: COLORS.bg.card,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.accent.primary + '30',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.text.dim + '20'
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  activeIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.accent.success
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary
  },
  countBadge: {
    backgroundColor: COLORS.accent.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10
  },
  countText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff'
  },
  beingsContainer: {
    flex: 1,
    paddingVertical: 12
  },
  beingsScroll: {
    paddingHorizontal: 12,
    gap: 12
  },
  beingItem: {
    width: 100,
    backgroundColor: COLORS.bg.elevated,
    borderRadius: 12,
    padding: 10,
    alignItems: 'center'
  },
  beingMarkerContainer: {
    marginBottom: 8
  },
  beingName: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.text.primary,
    textAlign: 'center',
    marginBottom: 6
  },
  progressBarContainer: {
    width: '100%',
    marginBottom: 4
  },
  progressBarBg: {
    height: 4,
    backgroundColor: COLORS.bg.primary,
    borderRadius: 2,
    overflow: 'hidden'
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.accent.success,
    borderRadius: 2
  },
  progressText: {
    fontSize: 9,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginTop: 2
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2
  },
  locationText: {
    fontSize: 9,
    color: COLORS.text.dim,
    maxWidth: 70
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: COLORS.bg.secondary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%'
  },

  // Detail
  detailContainer: {
    padding: 20
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20
  },
  detailHeaderLeft: {
    marginRight: 16
  },
  detailInfo: {
    flex: 1
  },
  detailName: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 4
  },
  detailLevel: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: 8
  },
  attrTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 4
  },
  attrIcon: {
    fontSize: 12
  },
  attrName: {
    fontSize: 12,
    fontWeight: '600'
  },
  closeBtn: {
    padding: 4
  },

  // Mission section
  missionSection: {
    backgroundColor: COLORS.bg.elevated,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16
  },
  missionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12
  },
  missionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.accent.critical
  },
  missionName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 12
  },
  missionProgressSection: {
    marginBottom: 12
  },
  missionProgressBar: {
    height: 8,
    backgroundColor: COLORS.bg.primary,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4
  },
  missionProgressFill: {
    height: '100%',
    backgroundColor: COLORS.accent.success,
    borderRadius: 4
  },
  missionProgressText: {
    fontSize: 12,
    color: COLORS.text.secondary
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12
  },
  timeText: {
    fontSize: 12,
    color: COLORS.text.secondary
  },
  rewardsSection: {
    borderTopWidth: 1,
    borderTopColor: COLORS.text.dim + '20',
    paddingTop: 12
  },
  rewardsTitle: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginBottom: 8
  },
  rewardsRow: {
    flexDirection: 'row',
    gap: 16
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  rewardIcon: {
    fontSize: 14
  },
  rewardValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text.primary
  },
  noMissionText: {
    fontSize: 14,
    color: COLORS.text.dim,
    fontStyle: 'italic'
  },

  // Actions
  actionsRow: {
    flexDirection: 'row',
    gap: 12
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.bg.elevated,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.accent.primary + '40'
  },
  actionBtnDanger: {
    borderColor: COLORS.accent.warning + '40'
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.accent.primary
  }
});

export default DeployedBeingsOverlay;
