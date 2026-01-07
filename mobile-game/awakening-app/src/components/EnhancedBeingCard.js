/**
 * EnhancedBeingCard.js
 * Tarjeta de ser mejorada con efectos visuales según rareza
 *
 * @version 1.0.0
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS, ATTRIBUTES } from '../config/constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 32;

/**
 * Tarjeta de ser con efectos visuales mejorados
 */
const EnhancedBeingCard = ({
  being,
  onPress,
  onLongPress,
  showActions = false,
  compact = false,
  style
}) => {
  // Animaciones
  const shineAnim = useRef(new Animated.Value(-1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Configuración por rareza
  const getRarityConfig = () => {
    switch (being?.rarity) {
      case 'legendary':
        return {
          gradient: ['#FFD700', '#FFA500', '#FF8C00'],
          borderColor: '#FFD700',
          glowColor: 'rgba(255, 215, 0, 0.4)',
          shine: true,
          particles: true
        };
      case 'epic':
        return {
          gradient: ['#9B59B6', '#8E44AD', '#7D3C98'],
          borderColor: '#9B59B6',
          glowColor: 'rgba(155, 89, 182, 0.3)',
          shine: true,
          particles: false
        };
      case 'rare':
        return {
          gradient: ['#3498DB', '#2980B9', '#1F618D'],
          borderColor: '#3498DB',
          glowColor: 'rgba(52, 152, 219, 0.2)',
          shine: false,
          particles: false
        };
      default:
        return {
          gradient: [COLORS.bg.card, COLORS.bg.elevated, COLORS.bg.secondary],
          borderColor: COLORS.accent.primary + '40',
          glowColor: 'transparent',
          shine: false,
          particles: false
        };
    }
  };

  const rarityConfig = getRarityConfig();

  // Efecto de brillo para épicos y legendarios
  useEffect(() => {
    if (rarityConfig.shine) {
      Animated.loop(
        Animated.timing(shineAnim, {
          toValue: 2,
          duration: 3000,
          useNativeDriver: true
        })
      ).start();
    }
  }, [rarityConfig.shine]);

  // Animación de glow
  useEffect(() => {
    if (being?.rarity === 'legendary' || being?.rarity === 'epic') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: false
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: false
          })
        ])
      ).start();
    }
  }, [being?.rarity]);

  // Handlers de interacción
  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true
    }).start();
  };

  // Calcular poder total
  const getTotalPower = () => {
    if (!being?.attributes) return 0;
    return Object.values(being.attributes).reduce((sum, val) => sum + val, 0);
  };

  // Obtener atributos top 3
  const getTopAttributes = () => {
    if (!being?.attributes) return [];
    return Object.entries(being.attributes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([key, value]) => ({
        ...ATTRIBUTES[key],
        key,
        value
      }));
  };

  const topAttrs = getTopAttributes();

  // Animación del brillo
  const shineTranslate = shineAnim.interpolate({
    inputRange: [-1, 2],
    outputRange: [-CARD_WIDTH, CARD_WIDTH * 2]
  });

  // Interpolación del glow
  const shadowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.1, 0.4]
  });

  if (compact) {
    return (
      <CompactBeingCard
        being={being}
        onPress={onPress}
        rarityConfig={rarityConfig}
      />
    );
  }

  return (
    <Animated.View
      style={[
        styles.cardContainer,
        {
          transform: [{ scale: scaleAnim }],
          shadowColor: rarityConfig.borderColor,
          shadowOpacity: shadowOpacity
        },
        style
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => onPress?.(being)}
        onLongPress={() => onLongPress?.(being)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <View
          style={[
            styles.card,
            {
              borderColor: rarityConfig.borderColor,
              backgroundColor: COLORS.bg.card
            }
          ]}
        >
          {/* Fondo con gradiente para raros+ */}
          {being?.rarity && being.rarity !== 'common' && (
            <View style={styles.gradientOverlay}>
              <LinearGradient
                colors={[...rarityConfig.gradient.map(c => c + '20'), 'transparent']}
                style={styles.gradientFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
            </View>
          )}

          {/* Efecto de brillo deslizante */}
          {rarityConfig.shine && (
            <Animated.View
              style={[
                styles.shineEffect,
                { transform: [{ translateX: shineTranslate }] }
              ]}
            />
          )}

          {/* Header de la tarjeta */}
          <View style={styles.cardHeader}>
            {/* Avatar con aura */}
            <View style={styles.avatarSection}>
              <View style={[styles.avatarGlow, { backgroundColor: rarityConfig.glowColor }]} />
              <View
                style={[
                  styles.avatarContainer,
                  { borderColor: rarityConfig.borderColor }
                ]}
              >
                <Text style={styles.avatar}>{being?.avatar || '🧬'}</Text>
              </View>
              <StatusBadge status={being?.status} />
            </View>

            {/* Info del ser */}
            <View style={styles.infoSection}>
              <View style={styles.nameRow}>
                <Text style={styles.name} numberOfLines={1}>
                  {being?.name || 'Ser sin nombre'}
                </Text>
                <RarityBadge rarity={being?.rarity} />
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Nivel</Text>
                  <Text style={styles.statValue}>{being?.level || 1}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Poder</Text>
                  <Text style={[styles.statValue, styles.powerValue]}>
                    {getTotalPower()}
                  </Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>XP</Text>
                  <Text style={styles.statValue}>{being?.experience || 0}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Barras de atributos */}
          <View style={styles.attributesSection}>
            {topAttrs.map((attr, index) => (
              <AttributeBar
                key={attr.key}
                attribute={attr}
                delay={index * 100}
              />
            ))}
          </View>

          {/* Footer con estado de misión */}
          {being?.status === 'deployed' && being?.currentMission && (
            <View style={styles.missionFooter}>
              <View style={styles.missionIndicator} />
              <Text style={styles.missionText}>
                ⚔️ En misión activa
              </Text>
            </View>
          )}

          {/* Acciones */}
          {showActions && (
            <View style={styles.actionsSection}>
              <ActionButton
                icon="📍"
                label="Desplegar"
                color={COLORS.accent.success}
                disabled={being?.status !== 'available'}
              />
              <ActionButton
                icon="📖"
                label="Entrenar"
                color={COLORS.accent.wisdom}
                disabled={being?.status !== 'available'}
              />
              <ActionButton
                icon="⚗️"
                label="Mejorar"
                color={COLORS.accent.warning}
              />
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

/**
 * Badge de rareza
 */
const RarityBadge = ({ rarity }) => {
  const config = {
    legendary: { label: 'LEGENDARIO', color: '#FFD700', bg: '#FFD70020' },
    epic: { label: 'ÉPICO', color: '#9B59B6', bg: '#9B59B620' },
    rare: { label: 'RARO', color: '#3498DB', bg: '#3498DB20' },
    common: { label: 'COMÚN', color: '#95A5A6', bg: '#95A5A620' }
  };

  const cfg = config[rarity] || config.common;

  return (
    <View style={[styles.rarityBadge, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.rarityText, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
};

/**
 * Badge de estado
 */
const StatusBadge = ({ status }) => {
  const getConfig = () => {
    switch (status) {
      case 'available':
        return { icon: '✓', color: COLORS.status.available };
      case 'deployed':
        return { icon: '⚔', color: COLORS.status.deployed };
      case 'resting':
        return { icon: '💤', color: COLORS.status.resting };
      case 'training':
        return { icon: '📚', color: COLORS.status.training };
      default:
        return { icon: '?', color: COLORS.text.dim };
    }
  };

  const cfg = getConfig();

  return (
    <View style={[styles.statusBadge, { backgroundColor: cfg.color }]}>
      <Text style={styles.statusIcon}>{cfg.icon}</Text>
    </View>
  );
};

/**
 * Barra de atributo animada
 */
const AttributeBar = ({ attribute, delay = 0 }) => {
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: attribute.value,
      duration: 800,
      delay,
      useNativeDriver: false
    }).start();
  }, [attribute.value]);

  const width = widthAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%']
  });

  return (
    <View style={styles.attributeRow}>
      <View style={styles.attributeLabel}>
        <Text style={styles.attributeIcon}>{attribute.icon}</Text>
        <Text style={styles.attributeName}>{attribute.name}</Text>
      </View>
      <View style={styles.attributeBarContainer}>
        <View style={styles.attributeBarBg}>
          <Animated.View
            style={[
              styles.attributeBarFill,
              {
                width,
                backgroundColor: attribute.color
              }
            ]}
          />
        </View>
        <Text style={styles.attributeValue}>{attribute.value}</Text>
      </View>
    </View>
  );
};

/**
 * Botón de acción
 */
const ActionButton = ({ icon, label, color, disabled, onPress }) => (
  <TouchableOpacity
    style={[
      styles.actionButton,
      { borderColor: color },
      disabled && styles.actionButtonDisabled
    ]}
    onPress={onPress}
    disabled={disabled}
  >
    <Text style={styles.actionIcon}>{icon}</Text>
    <Text style={[styles.actionLabel, { color: disabled ? COLORS.text.dim : color }]}>
      {label}
    </Text>
  </TouchableOpacity>
);

/**
 * Versión compacta de la tarjeta
 */
const CompactBeingCard = ({ being, onPress, rarityConfig }) => (
  <TouchableOpacity
    style={[styles.compactCard, { borderColor: rarityConfig.borderColor }]}
    onPress={() => onPress?.(being)}
    activeOpacity={0.8}
  >
    <View style={[styles.compactAvatar, { borderColor: rarityConfig.borderColor }]}>
      <Text style={styles.compactAvatarText}>{being?.avatar || '🧬'}</Text>
    </View>
    <View style={styles.compactInfo}>
      <Text style={styles.compactName} numberOfLines={1}>
        {being?.name || 'Ser'}
      </Text>
      <Text style={styles.compactLevel}>Nv.{being?.level || 1}</Text>
    </View>
    <StatusBadge status={being?.status} />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  cardContainer: {
    marginBottom: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 8
  },
  card: {
    borderRadius: 16,
    borderWidth: 2,
    overflow: 'hidden'
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  },
  gradientFill: {
    flex: 1
  },
  shineEffect: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    transform: [{ skewX: '-20deg' }]
  },
  cardHeader: {
    flexDirection: 'row',
    padding: 16
  },
  avatarSection: {
    position: 'relative',
    marginRight: 16
  },
  avatarGlow: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 40
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    backgroundColor: COLORS.bg.elevated,
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatar: {
    fontSize: 32
  },
  statusBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.bg.card
  },
  statusIcon: {
    fontSize: 10,
    color: '#fff'
  },
  infoSection: {
    flex: 1
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary,
    flex: 1
  },
  rarityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  rarityText: {
    fontSize: 10,
    fontWeight: '700'
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  statItem: {
    alignItems: 'center',
    flex: 1
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: COLORS.text.dim + '30'
  },
  statLabel: {
    fontSize: 10,
    color: COLORS.text.secondary,
    marginBottom: 2
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text.primary
  },
  powerValue: {
    color: COLORS.accent.primary
  },
  attributesSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8
  },
  attributeRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  attributeLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 100
  },
  attributeIcon: {
    fontSize: 14,
    marginRight: 6
  },
  attributeName: {
    fontSize: 12,
    color: COLORS.text.secondary
  },
  attributeBarContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  attributeBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: COLORS.bg.primary,
    borderRadius: 4,
    overflow: 'hidden'
  },
  attributeBarFill: {
    height: '100%',
    borderRadius: 4
  },
  attributeValue: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text.secondary,
    minWidth: 28,
    textAlign: 'right'
  },
  missionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accent.critical + '20',
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 8
  },
  missionIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.accent.critical
  },
  missionText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.accent.critical
  },
  actionsSection: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.text.dim + '20'
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
    borderRightWidth: 1,
    borderRightColor: COLORS.text.dim + '20'
  },
  actionButtonDisabled: {
    opacity: 0.4
  },
  actionIcon: {
    fontSize: 16
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '600'
  },
  // Compact styles
  compactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bg.card,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8
  },
  compactAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    backgroundColor: COLORS.bg.elevated,
    alignItems: 'center',
    justifyContent: 'center'
  },
  compactAvatarText: {
    fontSize: 20
  },
  compactInfo: {
    flex: 1,
    marginLeft: 12
  },
  compactName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary
  },
  compactLevel: {
    fontSize: 11,
    color: COLORS.text.secondary
  }
});

export default EnhancedBeingCard;
