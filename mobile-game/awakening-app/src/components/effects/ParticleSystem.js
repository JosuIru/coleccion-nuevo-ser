/**
 * ParticleSystem.js
 * Sistema de partículas para efectos visuales del juego
 *
 * @version 1.0.0
 */

import React, { useEffect, useRef, useMemo } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Partícula individual animada
 */
const Particle = ({
  size = 8,
  color = '#60a5fa',
  duration = 2000,
  delay = 0,
  startX = 0,
  startY = 0,
  endX = 0,
  endY = -100,
  type = 'float' // float, explode, spiral, glow
}) => {
  const animation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = () => {
      animation.setValue(0);
      Animated.timing(animation, {
        toValue: 1,
        duration,
        delay,
        useNativeDriver: true
      }).start(() => {
        if (type !== 'explode') {
          animate(); // Loop para float y spiral
        }
      });
    };
    animate();
  }, []);

  const translateX = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [startX, endX]
  });

  const translateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [startY, endY]
  });

  const opacity = animation.interpolate({
    inputRange: [0, 0.2, 0.8, 1],
    outputRange: [0, 1, 1, 0]
  });

  const scale = type === 'explode'
    ? animation.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0.5, 1.5, 0]
      })
    : animation.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0.8, 1.2, 0.8]
      });

  const rotate = type === 'spiral'
    ? animation.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg']
      })
    : '0deg';

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          transform: [
            { translateX },
            { translateY },
            { scale },
            { rotate }
          ],
          opacity
        }
      ]}
    />
  );
};

/**
 * Sistema de partículas flotantes (para fondos)
 */
export const FloatingParticles = ({
  count = 20,
  colors = ['#60a5fa', '#a78bfa', '#34d399'],
  area = { width: SCREEN_WIDTH, height: SCREEN_HEIGHT }
}) => {
  const particles = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      size: Math.random() * 6 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      duration: Math.random() * 3000 + 2000,
      delay: Math.random() * 2000,
      startX: Math.random() * area.width,
      startY: area.height + 20,
      endX: Math.random() * area.width,
      endY: -20
    }));
  }, [count, area]);

  return (
    <View style={[styles.particleContainer, { width: area.width, height: area.height }]}>
      {particles.map(particle => (
        <Particle key={particle.id} {...particle} type="float" />
      ))}
    </View>
  );
};

/**
 * Explosión de partículas (para rewards, logros)
 */
export const ParticleExplosion = ({
  count = 15,
  colors = ['#fbbf24', '#f59e0b', '#ef4444'],
  origin = { x: 0, y: 0 },
  radius = 100,
  onComplete
}) => {
  const particles = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2;
      const distance = radius * (0.5 + Math.random() * 0.5);
      return {
        id: i,
        size: Math.random() * 10 + 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        duration: Math.random() * 800 + 400,
        delay: Math.random() * 100,
        startX: origin.x,
        startY: origin.y,
        endX: origin.x + Math.cos(angle) * distance,
        endY: origin.y + Math.sin(angle) * distance
      };
    });
  }, [count, origin, radius]);

  useEffect(() => {
    const maxDuration = Math.max(...particles.map(p => p.duration + p.delay));
    const timer = setTimeout(() => {
      onComplete?.();
    }, maxDuration);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={[styles.explosionContainer, { left: 0, top: 0 }]}>
      {particles.map(particle => (
        <Particle key={particle.id} {...particle} type="explode" />
      ))}
    </View>
  );
};

/**
 * Aura brillante alrededor de un elemento
 */
export const GlowAura = ({
  size = 100,
  color = '#60a5fa',
  intensity = 0.5,
  pulseSpeed = 2000
}) => {
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: pulseSpeed,
            useNativeDriver: true
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: pulseSpeed,
            useNativeDriver: true
          })
        ])
      ).start();
    };
    animate();
  }, []);

  const scale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.3]
  });

  const opacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [intensity, intensity * 0.3]
  });

  return (
    <Animated.View
      style={[
        styles.glowAura,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          transform: [{ scale }],
          opacity
        }
      ]}
    />
  );
};

/**
 * Efecto de ondas concéntricas (para activaciones)
 */
export const RippleEffect = ({
  size = 100,
  color = '#60a5fa',
  duration = 1500,
  rippleCount = 3
}) => {
  const animations = useRef(
    Array.from({ length: rippleCount }, () => new Animated.Value(0))
  ).current;

  useEffect(() => {
    animations.forEach((anim, index) => {
      const animate = () => {
        anim.setValue(0);
        Animated.timing(anim, {
          toValue: 1,
          duration,
          delay: index * (duration / rippleCount),
          useNativeDriver: true
        }).start(() => animate());
      };
      animate();
    });
  }, []);

  return (
    <View style={[styles.rippleContainer, { width: size * 2, height: size * 2 }]}>
      {animations.map((anim, index) => {
        const scale = anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.5, 2]
        });
        const opacity = anim.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0.8, 0.4, 0]
        });

        return (
          <Animated.View
            key={index}
            style={[
              styles.ripple,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
                borderColor: color,
                transform: [{ scale }],
                opacity
              }
            ]}
          />
        );
      })}
    </View>
  );
};

/**
 * Estrellas titilantes (para fondo cósmico)
 */
export const TwinklingStars = ({
  count = 50,
  area = { width: SCREEN_WIDTH, height: SCREEN_HEIGHT }
}) => {
  const stars = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * area.width,
      y: Math.random() * area.height,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 2000 + 1000,
      delay: Math.random() * 2000
    }));
  }, [count, area]);

  return (
    <View style={[styles.starsContainer, { width: area.width, height: area.height }]}>
      {stars.map(star => (
        <TwinklingStar key={star.id} {...star} />
      ))}
    </View>
  );
};

const TwinklingStar = ({ x, y, size, duration, delay }) => {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 1,
            duration: duration / 2,
            delay,
            useNativeDriver: true
          }),
          Animated.timing(opacity, {
            toValue: 0.2,
            duration: duration / 2,
            useNativeDriver: true
          })
        ])
      ).start();
    };
    animate();
  }, []);

  return (
    <Animated.View
      style={[
        styles.star,
        {
          left: x,
          top: y,
          width: size,
          height: size,
          borderRadius: size / 2,
          opacity
        }
      ]}
    />
  );
};

/**
 * Efecto de energía/poder fluyendo
 */
export const EnergyFlow = ({
  startPoint = { x: 0, y: 0 },
  endPoint = { x: 100, y: 0 },
  color = '#60a5fa',
  particleCount = 10,
  duration = 2000
}) => {
  const particles = useMemo(() => {
    return Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      delay: (i / particleCount) * duration
    }));
  }, [particleCount, duration]);

  return (
    <View style={styles.energyFlowContainer}>
      {particles.map(particle => (
        <EnergyParticle
          key={particle.id}
          startPoint={startPoint}
          endPoint={endPoint}
          color={color}
          duration={duration}
          delay={particle.delay}
        />
      ))}
    </View>
  );
};

const EnergyParticle = ({ startPoint, endPoint, color, duration, delay }) => {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = () => {
      progress.setValue(0);
      Animated.timing(progress, {
        toValue: 1,
        duration,
        delay,
        useNativeDriver: true
      }).start(() => animate());
    };
    animate();
  }, []);

  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [startPoint.x, endPoint.x]
  });

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [startPoint.y, endPoint.y]
  });

  const opacity = progress.interpolate({
    inputRange: [0, 0.2, 0.8, 1],
    outputRange: [0, 1, 1, 0]
  });

  return (
    <Animated.View
      style={[
        styles.energyParticle,
        {
          backgroundColor: color,
          transform: [{ translateX }, { translateY }],
          opacity
        }
      ]}
    />
  );
};

const styles = StyleSheet.create({
  particleContainer: {
    position: 'absolute',
    overflow: 'hidden',
    pointerEvents: 'none'
  },
  particle: {
    position: 'absolute'
  },
  explosionContainer: {
    position: 'absolute',
    pointerEvents: 'none'
  },
  glowAura: {
    position: 'absolute'
  },
  rippleContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none'
  },
  ripple: {
    position: 'absolute',
    borderWidth: 2
  },
  starsContainer: {
    position: 'absolute',
    pointerEvents: 'none'
  },
  star: {
    position: 'absolute',
    backgroundColor: '#fff'
  },
  energyFlowContainer: {
    position: 'absolute',
    pointerEvents: 'none'
  },
  energyParticle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4
  }
});

export default {
  FloatingParticles,
  ParticleExplosion,
  GlowAura,
  RippleEffect,
  TwinklingStars,
  EnergyFlow
};
