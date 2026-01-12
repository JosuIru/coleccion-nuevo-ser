/**
 * AnimatedBeing.js
 * Componente de ser animado para el santuario
 * Muestra seres con animaciones según su estado: disponible, desplegado, descansando
 */

import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { COLORS, ATTRIBUTES } from '../config/constants';

const AnimatedBeing = ({
  being,
  size = 'medium', // small, medium, large
  showAura = true,
  showParticles = true,
  showStats = false
}) => {
  // Animaciones
  const floatAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const auraAnim = useRef(new Animated.Value(0.3)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const particleAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0)
  ]).current;

  // Tamaños según prop
  const sizes = {
    small: { avatar: 40, container: 60, particles: 4 },
    medium: { avatar: 60, container: 90, particles: 6 },
    large: { avatar: 80, container: 120, particles: 8 }
  };
  const currentSize = sizes[size] || sizes.medium;

  // Colores según estado
  const getStatusColors = () => {
    switch (being?.status) {
      case 'available':
        return {
          primary: '#22c55e',
          secondary: '#86efac',
          aura: 'rgba(34, 197, 94, 0.3)'
        };
      case 'deployed':
        return {
          primary: '#f97316',
          secondary: '#fdba74',
          aura: 'rgba(249, 115, 22, 0.4)'
        };
      case 'resting':
        return {
          primary: '#3b82f6',
          secondary: '#93c5fd',
          aura: 'rgba(59, 130, 246, 0.25)'
        };
      case 'training':
        return {
          primary: '#a855f7',
          secondary: '#d8b4fe',
          aura: 'rgba(168, 85, 247, 0.3)'
        };
      default:
        return {
          primary: '#6b7280',
          secondary: '#9ca3af',
          aura: 'rgba(107, 114, 128, 0.2)'
        };
    }
  };

  const colors = getStatusColors();

  // Efecto de flotación continua
  useEffect(() => {
    const floatAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true
        })
      ])
    );
    floatAnimation.start();
    return () => floatAnimation.stop();
  }, []);

  // Animaciones según estado
  useEffect(() => {
    let animations = [];

    if (being?.status === 'available') {
      // Pulso suave cuando está disponible
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true
          })
        ])
      );
      animations.push(pulseAnimation);

      // Aura brillante
      const auraAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(auraAnim, {
            toValue: 0.6,
            duration: 2000,
            useNativeDriver: true
          }),
          Animated.timing(auraAnim, {
            toValue: 0.3,
            duration: 2000,
            useNativeDriver: true
          })
        ])
      );
      animations.push(auraAnimation);
    }

    if (being?.status === 'deployed') {
      // Rotación lenta cuando está desplegado (trabajando)
      const rotateAnimation = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 8000,
          easing: Easing.linear,
          useNativeDriver: true
        })
      );
      animations.push(rotateAnimation);

      // Glow intermitente
      const glowAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true
          }),
          Animated.timing(glowAnim, {
            toValue: 0.3,
            duration: 800,
            useNativeDriver: true
          })
        ])
      );
      animations.push(glowAnimation);
    }

    if (being?.status === 'resting') {
      // Pulso muy lento (respiración mientras descansa)
      const restAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 3000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true
          }),
          Animated.timing(pulseAnim, {
            toValue: 0.95,
            duration: 3000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true
          })
        ])
      );
      animations.push(restAnimation);

      // Aura calmada
      const calmAura = Animated.loop(
        Animated.sequence([
          Animated.timing(auraAnim, {
            toValue: 0.4,
            duration: 3000,
            useNativeDriver: true
          }),
          Animated.timing(auraAnim, {
            toValue: 0.2,
            duration: 3000,
            useNativeDriver: true
          })
        ])
      );
      animations.push(calmAura);
    }

    // Animar partículas
    if (showParticles) {
      particleAnims.forEach((anim, index) => {
        const particleAnimation = Animated.loop(
          Animated.sequence([
            Animated.delay(index * 400),
            Animated.timing(anim, {
              toValue: 1,
              duration: 2500 + index * 200,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true
            }),
            Animated.timing(anim, {
              toValue: 0,
              duration: 0,
              useNativeDriver: true
            })
          ])
        );
        animations.push(particleAnimation);
      });
    }

    animations.forEach(anim => anim.start());

    return () => {
      animations.forEach(anim => anim.stop());
    };
  }, [being?.status, showParticles]);

  // Transformaciones
  const floatTranslate = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8]
  });

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  // Renderizar partículas
  const renderParticles = () => {
    if (!showParticles) return null;

    return particleAnims.map((anim, index) => {
      const angle = (index / particleAnims.length) * 2 * Math.PI;
      const radius = currentSize.container * 0.5;

      const translateX = anim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, Math.cos(angle) * radius]
      });

      const translateY = anim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, Math.sin(angle) * radius - 20]
      });

      const opacity = anim.interpolate({
        inputRange: [0, 0.3, 0.7, 1],
        outputRange: [0, 0.8, 0.6, 0]
      });

      const scale = anim.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0.3, 1, 0.5]
      });

      return (
        <Animated.View
          key={index}
          style={[
            styles.particle,
            {
              backgroundColor: colors.secondary,
              width: currentSize.particles,
              height: currentSize.particles,
              borderRadius: currentSize.particles / 2,
              opacity,
              transform: [
                { translateX },
                { translateY },
                { scale }
              ]
            }
          ]}
        />
      );
    });
  };

  // Obtener atributo dominante para color de aura
  const getDominantAttribute = () => {
    if (!being?.attributes) return null;
    const entries = Object.entries(being.attributes);
    if (entries.length === 0) return null;
    const sorted = entries.sort((a, b) => b[1] - a[1]);
    return sorted[0][0];
  };

  const dominantAttr = getDominantAttribute();
  const attrConfig = dominantAttr ? ATTRIBUTES[dominantAttr] : null;

  return (
    <View style={[styles.container, { width: currentSize.container, height: currentSize.container }]}>
      {/* Aura exterior */}
      {showAura && (
        <Animated.View
          style={[
            styles.aura,
            {
              width: currentSize.container,
              height: currentSize.container,
              borderRadius: currentSize.container / 2,
              backgroundColor: attrConfig?.color || colors.aura,
              opacity: auraAnim,
              transform: [{ scale: pulseAnim }]
            }
          ]}
        />
      )}

      {/* Anillo de energía (solo desplegado) */}
      {being?.status === 'deployed' && (
        <Animated.View
          style={[
            styles.energyRing,
            {
              width: currentSize.container * 0.85,
              height: currentSize.container * 0.85,
              borderRadius: currentSize.container * 0.425,
              borderColor: colors.primary,
              opacity: glowAnim,
              transform: [{ rotate }]
            }
          ]}
        />
      )}

      {/* Partículas flotantes */}
      {renderParticles()}

      {/* Avatar del ser */}
      <Animated.View
        style={[
          styles.avatarContainer,
          {
            width: currentSize.avatar,
            height: currentSize.avatar,
            transform: [
              { translateY: floatTranslate },
              { scale: pulseAnim }
            ]
          }
        ]}
      >
        {/* Glow detrás del avatar */}
        <View
          style={[
            styles.avatarGlow,
            {
              width: currentSize.avatar * 1.3,
              height: currentSize.avatar * 1.3,
              borderRadius: currentSize.avatar * 0.65,
              backgroundColor: colors.primary,
              opacity: 0.2
            }
          ]}
        />

        {/* Emoji del avatar */}
        <Text style={[styles.avatar, { fontSize: currentSize.avatar * 0.7 }]}>
          {being?.avatar || being?.emoji || '🧬'}
        </Text>

        {/* Indicador de estado */}
        <View
          style={[
            styles.statusDot,
            {
              backgroundColor: colors.primary,
              width: currentSize.avatar * 0.25,
              height: currentSize.avatar * 0.25,
              borderRadius: currentSize.avatar * 0.125,
              bottom: 0,
              right: 0
            }
          ]}
        />
      </Animated.View>

      {/* Stats mini (opcional) */}
      {showStats && being?.attributes && (
        <View style={styles.miniStats}>
          {Object.entries(being.attributes).slice(0, 3).map(([key, value]) => {
            const config = ATTRIBUTES[key];
            if (!config) return null;
            return (
              <View key={key} style={styles.miniStatItem}>
                <Text style={styles.miniStatIcon}>{config.icon}</Text>
                <View style={[styles.miniStatBar, { backgroundColor: config.color + '40' }]}>
                  <View
                    style={[
                      styles.miniStatFill,
                      { width: `${value}%`, backgroundColor: config.color }
                    ]}
                  />
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Efecto de "zzz" cuando descansa */}
      {being?.status === 'resting' && (
        <Animated.Text
          style={[
            styles.sleepText,
            {
              opacity: auraAnim,
              transform: [{ translateY: floatTranslate }]
            }
          ]}
        >
          💤
        </Animated.Text>
      )}

      {/* Efecto de fuego cuando está desplegado */}
      {being?.status === 'deployed' && (
        <Animated.Text
          style={[
            styles.deployedIcon,
            {
              opacity: glowAnim,
              transform: [{ scale: pulseAnim }]
            }
          ]}
        >
          🔥
        </Animated.Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative'
  },
  aura: {
    position: 'absolute'
  },
  energyRing: {
    position: 'absolute',
    borderWidth: 2,
    borderStyle: 'dashed'
  },
  particle: {
    position: 'absolute'
  },
  avatarContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative'
  },
  avatarGlow: {
    position: 'absolute'
  },
  avatar: {
    textAlign: 'center'
  },
  statusDot: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: COLORS.bg.card
  },
  miniStats: {
    position: 'absolute',
    bottom: -20,
    flexDirection: 'row',
    gap: 4
  },
  miniStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2
  },
  miniStatIcon: {
    fontSize: 10
  },
  miniStatBar: {
    width: 20,
    height: 3,
    borderRadius: 1.5,
    overflow: 'hidden'
  },
  miniStatFill: {
    height: '100%',
    borderRadius: 1.5
  },
  sleepText: {
    position: 'absolute',
    top: -5,
    right: -5,
    fontSize: 16
  },
  deployedIcon: {
    position: 'absolute',
    bottom: -5,
    fontSize: 14
  }
});

export default AnimatedBeing;
