/**
 * LevelUpOverlay.js
 * Animaci贸n espectacular para subir de nivel
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Modal
} from 'react-native';

const { width, height } = Dimensions.get('window');

const LevelUpOverlay = ({ visible, level, onComplete }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const levelScale = useRef(new Animated.Value(3)).current;
  const ringsScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Secuencia de animaci贸n
      Animated.sequence([
        // Fase 1: Aparece el c铆rculo central
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 50,
            friction: 7,
            useNativeDriver: true
          }),
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true
          })
        ]),
        // Fase 2: Brillos y anillos
        Animated.parallel([
          Animated.loop(
            Animated.sequence([
              Animated.timing(glowAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true
              }),
              Animated.timing(glowAnim, {
                toValue: 0.5,
                duration: 500,
                useNativeDriver: true
              })
            ]),
            { iterations: 3 }
          ),
          Animated.spring(ringsScale, {
            toValue: 1,
            tension: 20,
            friction: 5,
            useNativeDriver: true
          })
        ]),
        // Fase 3: Texto del nivel
        Animated.parallel([
          Animated.timing(textOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true
          }),
          Animated.spring(levelScale, {
            toValue: 1,
            tension: 100,
            friction: 5,
            useNativeDriver: true
          })
        ]),
        // Fase 4: Mantener
        Animated.delay(1500),
        // Fase 5: Fade out
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 2,
            duration: 300,
            useNativeDriver: true
          }),
          Animated.timing(textOpacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true
          })
        ])
      ]).start(() => {
        // Reset animations
        scaleAnim.setValue(0);
        rotateAnim.setValue(0);
        glowAnim.setValue(0);
        textOpacity.setValue(0);
        levelScale.setValue(3);
        ringsScale.setValue(0);
        onComplete?.();
      });
    }
  }, [visible]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.container}>
        {/* Fondo oscuro */}
        <View style={styles.backdrop} />

        {/* Anillos expansivos */}
        {[1, 2, 3].map((ring, index) => (
          <Animated.View
            key={ring}
            style={[
              styles.ring,
              {
                transform: [
                  {
                    scale: ringsScale.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 1 + index * 0.5]
                    })
                  }
                ],
                opacity: ringsScale.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0, 0.8 - index * 0.2, 0.3 - index * 0.1]
                }),
                borderColor: index === 0 ? '#FFD700' : index === 1 ? '#FFA500' : '#FF6347'
              }
            ]}
          />
        ))}

        {/* C铆rculo central con brillo */}
        <Animated.View
          style={[
            styles.centerCircle,
            {
              transform: [{ scale: scaleAnim }, { rotate: spin }],
              shadowOpacity: glowAnim,
              shadowRadius: glowAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [10, 40]
              })
            }
          ]}
        >
          {/* Gradiente simulado */}
          <View style={styles.innerGlow} />

          {/* Texto LEVEL UP */}
          <Animated.View style={{ opacity: textOpacity }}>
            <Text style={styles.levelUpText}>LEVEL UP!</Text>
          </Animated.View>

          {/* N煤mero del nivel */}
          <Animated.Text
            style={[
              styles.levelNumber,
              { transform: [{ scale: levelScale }], opacity: textOpacity }
            ]}
          >
            {level}
          </Animated.Text>
        </Animated.View>

        {/* Part铆culas de estrellas */}
        {visible && <StarParticles />}
      </View>
    </Modal>
  );
};

// Componente de part铆culas de estrellas
const StarParticles = () => {
  const stars = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * width,
    y: Math.random() * height,
    delay: Math.random() * 1000,
    size: 10 + Math.random() * 20
  }));

  return (
    <>
      {stars.map((star) => (
        <StarParticle key={star.id} {...star} />
      ))}
    </>
  );
};

const StarParticle = ({ x, y, delay, size }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true
        }),
        Animated.spring(scale, {
          toValue: 1,
          tension: 100,
          friction: 5,
          useNativeDriver: true
        })
      ]),
      Animated.delay(500),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true
      })
    ]).start();
  }, []);

  return (
    <Animated.Text
      style={[
        styles.star,
        {
          left: x,
          top: y,
          fontSize: size,
          opacity,
          transform: [{ scale }]
        }
      ]}
    >
      鉁
    </Animated.Text>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)'
  },
  ring: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 3,
    backgroundColor: 'transparent'
  },
  centerCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    elevation: 20
  },
  innerGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 90,
    backgroundColor: 'rgba(255, 215, 0, 0.1)'
  },
  levelUpText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
    textShadowColor: '#FFA500',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    letterSpacing: 3
  },
  levelNumber: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: '#FFD700',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    marginTop: 10
  },
  star: {
    position: 'absolute',
    color: '#FFD700',
    textShadowColor: '#FFA500',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10
  }
});

export default LevelUpOverlay;
