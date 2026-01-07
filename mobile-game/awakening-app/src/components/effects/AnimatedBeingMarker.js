/**
 * AnimatedBeingMarker.js
 * Marcador animado para mostrar seres desplegados en el mapa
 *
 * @version 1.0.0
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { COLORS, ATTRIBUTES } from '../../config/constants';

/**
 * Marcador de ser con animaciones y efectos visuales
 */
const AnimatedBeingMarker = ({
  being,
  size = 50,
  onPress,
  isSelected = false,
  showStatus = true,
  style
}) => {
  // Animaciones
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.3)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // Color basado en rareza
  const getRarityGradient = () => {
    switch (being?.rarity) {
      case 'legendary':
        return ['#FFD700', '#FFA500'];
      case 'epic':
        return ['#9B59B6', '#8E44AD'];
      case 'rare':
        return ['#3498DB', '#2980B9'];
      default:
        return ['#60a5fa', '#3b82f6'];
    }
  };

  const rarityColor = getRarityGradient()[0];

  // Animación de pulso
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
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
  }, []);

  // Animación de flotación
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -5,
          duration: 1500,
          useNativeDriver: true
        }),
        Animated.timing(floatAnim, {
          toValue: 5,
          duration: 1500,
          useNativeDriver: true
        })
      ])
    ).start();
  }, []);

  // Animación de brillo
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 0.8,
          duration: 2000,
          useNativeDriver: true
        }),
        Animated.timing(glowAnim, {
          toValue: 0.3,
          duration: 2000,
          useNativeDriver: true
        })
      ])
    ).start();
  }, []);

  // Rotación lenta para legendarios
  useEffect(() => {
    if (being?.rarity === 'legendary') {
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 8000,
          useNativeDriver: true
        })
      ).start();
    }
  }, [being?.rarity]);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  // Obtener el atributo principal
  const getMainAttribute = () => {
    if (!being?.attributes) return null;
    const attrs = Object.entries(being.attributes);
    if (attrs.length === 0) return null;
    const [key] = attrs.sort((a, b) => b[1] - a[1])[0];
    return ATTRIBUTES[key];
  };

  const mainAttr = getMainAttribute();

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => onPress?.(being)}
      style={[styles.container, style]}
    >
      {/* Anillo de selección */}
      {isSelected && (
        <Animated.View
          style={[
            styles.selectionRing,
            {
              width: size + 20,
              height: size + 20,
              borderRadius: (size + 20) / 2,
              borderColor: COLORS.accent.primary,
              transform: [{ scale: pulseAnim }]
            }
          ]}
        />
      )}

      {/* Aura de brillo */}
      <Animated.View
        style={[
          styles.glowAura,
          {
            width: size + 30,
            height: size + 30,
            borderRadius: (size + 30) / 2,
            backgroundColor: rarityColor,
            opacity: glowAnim,
            transform: being?.rarity === 'legendary' ? [{ rotate: rotation }] : []
          }
        ]}
      />

      {/* Marcador principal */}
      <Animated.View
        style={[
          styles.markerContainer,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            transform: [
              { translateY: floatAnim },
              { scale: isSelected ? 1.2 : 1 }
            ]
          }
        ]}
      >
        {/* Fondo con gradiente simulado */}
        <View
          style={[
            styles.markerBackground,
            {
              backgroundColor: rarityColor,
              borderColor: being?.rarity === 'legendary' ? '#FFD700' : '#fff'
            }
          ]}
        />

        {/* Avatar del ser */}
        <Text style={[styles.avatar, { fontSize: size * 0.5 }]}>
          {being?.avatar || '🧬'}
        </Text>

        {/* Indicador de atributo principal */}
        {mainAttr && (
          <View style={[styles.attributeBadge, { backgroundColor: mainAttr.color }]}>
            <Text style={styles.attributeIcon}>{mainAttr.icon}</Text>
          </View>
        )}
      </Animated.View>

      {/* Indicador de estado */}
      {showStatus && being?.status && (
        <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(being.status) }]}>
          <Text style={styles.statusIcon}>{getStatusIcon(being.status)}</Text>
        </View>
      )}

      {/* Barra de nivel */}
      <View style={styles.levelBadge}>
        <Text style={styles.levelText}>Nv.{being?.level || 1}</Text>
      </View>

      {/* Nombre del ser (opcional) */}
      {being?.name && (
        <View style={styles.nameContainer}>
          <Text style={styles.nameText} numberOfLines={1}>
            {being.name}
          </Text>
        </View>
      )}

      {/* Partículas para legendarios */}
      {being?.rarity === 'legendary' && (
        <LegendaryParticles size={size} />
      )}
    </TouchableOpacity>
  );
};

/**
 * Partículas doradas para seres legendarios
 */
const LegendaryParticles = ({ size }) => {
  const particles = Array.from({ length: 6 }, (_, i) => ({
    id: i,
    angle: (i / 6) * Math.PI * 2
  }));

  return (
    <>
      {particles.map(particle => (
        <LegendaryParticle
          key={particle.id}
          angle={particle.angle}
          distance={size / 2 + 15}
          delay={particle.id * 200}
        />
      ))}
    </>
  );
};

const LegendaryParticle = ({ angle, distance, delay }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 2000,
          delay,
          useNativeDriver: true
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true
        })
      ])
    ).start();
  }, []);

  const x = Math.cos(angle) * distance;
  const y = Math.sin(angle) * distance;

  const opacity = anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 1, 0.3]
  });

  const scale = anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.5, 1, 0.5]
  });

  return (
    <Animated.View
      style={[
        styles.legendaryParticle,
        {
          transform: [
            { translateX: x },
            { translateY: y },
            { scale }
          ],
          opacity
        }
      ]}
    />
  );
};

// Helpers
const getStatusColor = (status) => {
  switch (status) {
    case 'available': return COLORS.status.available;
    case 'deployed': return COLORS.status.deployed;
    case 'resting': return COLORS.status.resting;
    case 'training': return COLORS.status.training;
    default: return COLORS.text.dim;
  }
};

const getStatusIcon = (status) => {
  switch (status) {
    case 'available': return '✓';
    case 'deployed': return '⚔';
    case 'resting': return '💤';
    case 'training': return '📚';
    default: return '?';
  }
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  selectionRing: {
    position: 'absolute',
    borderWidth: 3,
    borderStyle: 'dashed'
  },
  glowAura: {
    position: 'absolute'
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8
  },
  markerBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 999,
    borderWidth: 3
  },
  avatar: {
    textAlign: 'center'
  },
  attributeBadge: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff'
  },
  attributeIcon: {
    fontSize: 10
  },
  statusIndicator: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff'
  },
  statusIcon: {
    fontSize: 8,
    color: '#fff'
  },
  levelBadge: {
    position: 'absolute',
    bottom: -12,
    backgroundColor: COLORS.bg.elevated,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.accent.primary
  },
  levelText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.text.primary
  },
  nameContainer: {
    position: 'absolute',
    top: -20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    maxWidth: 80
  },
  nameText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600'
  },
  legendaryParticle: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFD700'
  }
});

export default AnimatedBeingMarker;
