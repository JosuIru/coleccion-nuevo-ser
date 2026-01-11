/**
 * CelebrationOverlay.js
 * Animaciones de celebraci贸n para eventos exitosos
 * - Confetti para misiones completadas
 * - Estrellas para level-up
 * - Brillos para obtener seres
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  Modal
} from 'react-native';

const { width, height } = Dimensions.get('window');

// Colores para confetti
const CONFETTI_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
  '#BB8FCE', '#85C1E9', '#F8B500', '#FF69B4'
];

// Componente de part铆cula individual
const Particle = ({ color, startX, delay, type }) => {
  const translateY = useRef(new Animated.Value(-50)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(type === 'star' ? 0 : 1)).current;

  useEffect(() => {
    const animations = [];

    if (type === 'confetti') {
      // Animaci贸n de confetti cayendo
      animations.push(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(translateY, {
              toValue: height + 100,
              duration: 3000 + Math.random() * 2000,
              useNativeDriver: true
            }),
            Animated.timing(translateX, {
              toValue: (Math.random() - 0.5) * 200,
              duration: 3000,
              useNativeDriver: true
            }),
            Animated.timing(rotate, {
              toValue: Math.random() * 10,
              duration: 3000,
              useNativeDriver: true
            }),
            Animated.sequence([
              Animated.delay(2000),
              Animated.timing(opacity, {
                toValue: 0,
                duration: 1000,
                useNativeDriver: true
              })
            ])
          ])
        ])
      );
    } else if (type === 'star') {
      // Animaci贸n de estrellas expandiendo
      animations.push(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.spring(scale, {
              toValue: 1,
              tension: 50,
              friction: 3,
              useNativeDriver: true
            }),
            Animated.timing(translateY, {
              toValue: -100 - Math.random() * 200,
              duration: 1500,
              useNativeDriver: true
            }),
            Animated.timing(translateX, {
              toValue: (Math.random() - 0.5) * 300,
              duration: 1500,
              useNativeDriver: true
            })
          ]),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true
          })
        ])
      );
    } else if (type === 'sparkle') {
      // Animaci贸n de brillos
      animations.push(
        Animated.sequence([
          Animated.delay(delay),
          Animated.loop(
            Animated.sequence([
              Animated.timing(scale, {
                toValue: 1.5,
                duration: 300,
                useNativeDriver: true
              }),
              Animated.timing(scale, {
                toValue: 0.5,
                duration: 300,
                useNativeDriver: true
              })
            ]),
            { iterations: 3 }
          ),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true
          })
        ])
      );
    }

    Animated.parallel(animations).start();
  }, []);

  const spin = rotate.interpolate({
    inputRange: [0, 10],
    outputRange: ['0deg', '3600deg']
  });

  const getShape = () => {
    if (type === 'star') {
      return (
        <View style={[styles.star, { backgroundColor: color }]}>
          <View style={[styles.starPoint, { backgroundColor: color }]} />
        </View>
      );
    } else if (type === 'sparkle') {
      return (
        <View style={styles.sparkle}>
          <View style={[styles.sparkleH, { backgroundColor: color }]} />
          <View style={[styles.sparkleV, { backgroundColor: color }]} />
        </View>
      );
    }
    // Default: confetti rectangle
    return (
      <View
        style={[
          styles.confetti,
          {
            backgroundColor: color,
            width: 8 + Math.random() * 8,
            height: 12 + Math.random() * 8
          }
        ]}
      />
    );
  };

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left: startX,
          transform: [
            { translateY },
            { translateX },
            { rotate: spin },
            { scale }
          ],
          opacity
        }
      ]}
    >
      {getShape()}
    </Animated.View>
  );
};

// Componente principal
const CelebrationOverlay = ({
  visible,
  type = 'confetti', // 'confetti' | 'stars' | 'sparkles'
  onComplete,
  particleCount = 50
}) => {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    if (visible) {
      // Generar part铆culas
      const newParticles = [];
      for (let i = 0; i < particleCount; i++) {
        newParticles.push({
          id: i,
          color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
          startX: Math.random() * width,
          delay: Math.random() * 500,
          type: type === 'stars' ? 'star' : type === 'sparkles' ? 'sparkle' : 'confetti'
        });
      }
      setParticles(newParticles);

      // Auto-cerrar despu茅s de la animaci贸n
      const timeout = setTimeout(() => {
        onComplete?.();
      }, type === 'confetti' ? 4000 : 2500);

      return () => clearTimeout(timeout);
    } else {
      setParticles([]);
    }
  }, [visible, type]);

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none">
      <View style={styles.container} pointerEvents="none">
        {particles.map((particle) => (
          <Particle
            key={particle.id}
            color={particle.color}
            startX={particle.startX}
            delay={particle.delay}
            type={particle.type}
          />
        ))}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    overflow: 'hidden'
  },
  particle: {
    position: 'absolute',
    top: 0
  },
  confetti: {
    borderRadius: 2
  },
  star: {
    width: 20,
    height: 20,
    backgroundColor: '#FFD700',
    transform: [{ rotate: '45deg' }]
  },
  starPoint: {
    position: 'absolute',
    width: 20,
    height: 20,
    backgroundColor: '#FFD700',
    top: 0,
    left: 0
  },
  sparkle: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center'
  },
  sparkleH: {
    position: 'absolute',
    width: 20,
    height: 4,
    borderRadius: 2
  },
  sparkleV: {
    position: 'absolute',
    width: 4,
    height: 20,
    borderRadius: 2
  }
});

export default CelebrationOverlay;
