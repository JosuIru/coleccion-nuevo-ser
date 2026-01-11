/**
 * BeingCard.js
 * Componente de carta coleccionable para Seres
 * Estilo Pokémon/Hearthstone con animaciones y efectos de rareza
 */

import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
  Image
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS } from '../../config/constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.42;
const CARD_HEIGHT = CARD_WIDTH * 1.4;

// Sistema de rareza
export const RARITY = {
  COMMON: {
    name: 'Común',
    color: '#9CA3AF',
    gradient: ['#6B7280', '#4B5563'],
    borderColor: '#6B7280',
    glowColor: 'transparent',
    stars: 1
  },
  RARE: {
    name: 'Raro',
    color: '#3B82F6',
    gradient: ['#2563EB', '#1D4ED8'],
    borderColor: '#3B82F6',
    glowColor: 'rgba(59, 130, 246, 0.5)',
    stars: 2
  },
  EPIC: {
    name: 'Épico',
    color: '#8B5CF6',
    gradient: ['#7C3AED', '#6D28D9'],
    borderColor: '#8B5CF6',
    glowColor: 'rgba(139, 92, 246, 0.6)',
    stars: 3
  },
  LEGENDARY: {
    name: 'Legendario',
    color: '#F59E0B',
    gradient: ['#D97706', '#B45309'],
    borderColor: '#F59E0B',
    glowColor: 'rgba(245, 158, 11, 0.7)',
    stars: 4
  }
};

// Determinar rareza basada en power del ser
export const getRarityFromPower = (power) => {
  if (power >= 500) return RARITY.LEGENDARY;
  if (power >= 400) return RARITY.EPIC;
  if (power >= 300) return RARITY.RARE;
  return RARITY.COMMON;
};

// Iconos por tipo de ser
const BEING_ICONS = {
  default: '🧬',
  explorer: '🔭',
  warrior: '⚔️',
  healer: '💚',
  scholar: '📚',
  creator: '🎨',
  guardian: '🛡️'
};

const BeingCard = ({
  being,
  onPress,
  onLongPress,
  isNew = false,
  showFlipAnimation = false,
  size = 'normal' // 'small' | 'normal' | 'large'
}) => {
  const flipAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(showFlipAnimation ? 0.5 : 1)).current;
  const [isFlipped, setIsFlipped] = useState(showFlipAnimation);

  const rarity = getRarityFromPower(being.power || 350);

  // Escala según tamaño
  const sizeScale = size === 'small' ? 0.7 : size === 'large' ? 1.2 : 1;
  const cardWidth = CARD_WIDTH * sizeScale;
  const cardHeight = CARD_HEIGHT * sizeScale;

  useEffect(() => {
    if (showFlipAnimation) {
      // Animación de entrada + flip
      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true
        }),
        Animated.delay(500),
        Animated.timing(flipAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true
        })
      ]).start(() => setIsFlipped(false));
    }

    // Efecto de brillo para rarezas altas
    if (rarity !== RARITY.COMMON) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: false
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: false
          })
        ])
      ).start();
    }
  }, [showFlipAnimation, rarity]);

  const frontInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg']
  });

  const backInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg']
  });

  const glowIntensity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 15]
  });

  // Renderizar estrellas de rareza
  const renderStars = () => {
    return (
      <View style={styles.starsContainer}>
        {Array.from({ length: rarity.stars }).map((_, i) => (
          <Text key={i} style={[styles.star, { color: rarity.color }]}>★</Text>
        ))}
      </View>
    );
  };

  // Obtener icono del ser
  const getBeingIcon = () => {
    if (being.type && BEING_ICONS[being.type]) {
      return BEING_ICONS[being.type];
    }
    // Basado en stats más altos
    const stats = being.attributes || {};
    const maxStat = Math.max(
      stats.consciousness || 0,
      stats.action || 0,
      stats.technique || 0
    );
    if (maxStat === stats.consciousness) return '🧠';
    if (maxStat === stats.action) return '⚡';
    return '🧬';
  };

  // Renderizar frente de la carta
  const renderFront = () => (
    <Animated.View
      style={[
        styles.cardFace,
        {
          width: cardWidth,
          height: cardHeight,
          transform: [
            { perspective: 1000 },
            { rotateY: frontInterpolate },
            { scale: scaleAnim }
          ],
          shadowColor: rarity.glowColor,
          shadowRadius: glowIntensity
        }
      ]}
    >
      {/* Borde de rareza */}
      <View style={[styles.rarityBorder, { borderColor: rarity.borderColor }]}>
        {/* Gradiente de fondo */}
        <LinearGradient
          colors={rarity.gradient}
          style={styles.cardGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Header con nombre y rareza */}
          <View style={styles.cardHeader}>
            <Text style={styles.beingName} numberOfLines={1}>
              {being.name}
            </Text>
            {renderStars()}
          </View>

          {/* Área de ilustración */}
          <View style={styles.illustrationArea}>
            <Text style={[styles.beingIcon, { fontSize: cardWidth * 0.35 }]}>
              {getBeingIcon()}
            </Text>
            {/* Badge de nuevo */}
            {isNew && (
              <View style={styles.newBadge}>
                <Text style={styles.newBadgeText}>NUEVO</Text>
              </View>
            )}
          </View>

          {/* Stats */}
          <View style={styles.statsArea}>
            <View style={styles.statRow}>
              <View style={styles.stat}>
                <Text style={styles.statIcon}>⚡</Text>
                <Text style={styles.statValue}>{being.attributes?.action || 0}</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statIcon}>🧠</Text>
                <Text style={styles.statValue}>{being.attributes?.consciousness || 0}</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statIcon}>🔧</Text>
                <Text style={styles.statValue}>{being.attributes?.technique || 0}</Text>
              </View>
            </View>
          </View>

          {/* Footer con power */}
          <View style={styles.cardFooter}>
            <View style={styles.powerBadge}>
              <Text style={styles.powerLabel}>PODER</Text>
              <Text style={styles.powerValue}>{being.power || 350}</Text>
            </View>
            <View style={[styles.rarityLabel, { backgroundColor: rarity.color + '40' }]}>
              <Text style={[styles.rarityText, { color: rarity.color }]}>
                {rarity.name}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </View>
    </Animated.View>
  );

  // Renderizar reverso de la carta
  const renderBack = () => (
    <Animated.View
      style={[
        styles.cardFace,
        styles.cardBack,
        {
          width: cardWidth,
          height: cardHeight,
          transform: [
            { perspective: 1000 },
            { rotateY: backInterpolate },
            { scale: scaleAnim }
          ]
        }
      ]}
    >
      <LinearGradient
        colors={['#1a1a2e', '#16213e']}
        style={styles.cardBackGradient}
      >
        <View style={styles.cardBackPattern}>
          <Text style={styles.cardBackLogo}>🌟</Text>
          <Text style={styles.cardBackTitle}>AWAKENING</Text>
          <Text style={styles.cardBackSubtitle}>PROTOCOL</Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      onLongPress={onLongPress}
      style={[styles.cardContainer, { width: cardWidth, height: cardHeight }]}
    >
      {renderBack()}
      {renderFront()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    margin: 8
  },
  cardFace: {
    position: 'absolute',
    backfaceVisibility: 'hidden',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    elevation: 8
  },
  cardBack: {
    backgroundColor: '#1a1a2e'
  },
  rarityBorder: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 3,
    overflow: 'hidden'
  },
  cardGradient: {
    flex: 1,
    padding: 8
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  beingName: {
    flex: 1,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2
  },
  starsContainer: {
    flexDirection: 'row'
  },
  star: {
    fontSize: 10,
    marginLeft: 1
  },
  illustrationArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 8,
    marginVertical: 4
  },
  beingIcon: {
    textShadowColor: 'rgba(255,255,255,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10
  },
  newBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  newBadgeText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: 'bold'
  },
  statsArea: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 6,
    padding: 6,
    marginBottom: 4
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-around'
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  statIcon: {
    fontSize: 12,
    marginRight: 2
  },
  statValue: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#fff'
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  powerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  powerLabel: {
    fontSize: 8,
    color: '#9CA3AF',
    marginRight: 4
  },
  powerValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFD700'
  },
  rarityLabel: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  rarityText: {
    fontSize: 9,
    fontWeight: 'bold'
  },
  cardBackGradient: {
    flex: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  cardBackPattern: {
    alignItems: 'center'
  },
  cardBackLogo: {
    fontSize: 48,
    marginBottom: 8
  },
  cardBackTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700',
    letterSpacing: 4
  },
  cardBackSubtitle: {
    fontSize: 10,
    color: '#9CA3AF',
    letterSpacing: 2
  }
});

export default BeingCard;
