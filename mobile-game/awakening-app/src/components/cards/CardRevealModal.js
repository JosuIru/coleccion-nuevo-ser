/**
 * CardRevealModal.js
 * Modal de revelación de carta al obtener un nuevo ser
 * Animación dramática estilo gacha/lootbox
 */

import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Modal,
  TouchableOpacity,
  Dimensions
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import BeingCard, { getRarityFromPower, RARITY } from './BeingCard';
import soundService from '../../services/SoundService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const CardRevealModal = ({
  visible,
  being,
  onClose
}) => {
  const [phase, setPhase] = useState(0); // 0: intro, 1: reveal, 2: card shown
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.3)).current;
  const cardRotate = useRef(new Animated.Value(0)).current;
  const glowScale = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const particlesOpacity = useRef(new Animated.Value(0)).current;

  const rarity = being ? getRarityFromPower(being.power || 350) : RARITY.COMMON;

  useEffect(() => {
    if (visible && being) {
      runRevealAnimation();
    } else {
      // Reset
      setPhase(0);
      backdropOpacity.setValue(0);
      cardScale.setValue(0.3);
      cardRotate.setValue(0);
      glowScale.setValue(0);
      glowOpacity.setValue(0);
      textOpacity.setValue(0);
      particlesOpacity.setValue(0);
    }
  }, [visible, being]);

  const runRevealAnimation = () => {
    setPhase(0);
    soundService.playReward();

    // Fase 1: Fade in backdrop y preparar
    Animated.sequence([
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true
      }),
      // Fase 2: Carta aparece girando
      Animated.parallel([
        Animated.spring(cardScale, {
          toValue: 1.2,
          tension: 40,
          friction: 7,
          useNativeDriver: true
        }),
        Animated.timing(cardRotate, {
          toValue: 2, // 2 vueltas completas
          duration: 1000,
          useNativeDriver: true
        })
      ]),
      // Fase 3: Destello de luz
      Animated.parallel([
        Animated.sequence([
          Animated.timing(glowOpacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true
          }),
          Animated.spring(glowScale, {
            toValue: 3,
            tension: 50,
            friction: 5,
            useNativeDriver: true
          })
        ]),
        Animated.timing(particlesOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true
        })
      ])
    ]).start(() => {
      setPhase(1);
      soundService.playSuccess();

      // Fase 4: Carta se asienta y muestra rareza
      Animated.parallel([
        Animated.spring(cardScale, {
          toValue: 1,
          tension: 100,
          friction: 10,
          useNativeDriver: true
        }),
        Animated.timing(glowOpacity, {
          toValue: 0.5,
          duration: 500,
          useNativeDriver: true
        }),
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true
        })
      ]).start(() => setPhase(2));
    });
  };

  const spin = cardRotate.interpolate({
    inputRange: [0, 2],
    outputRange: ['0deg', '720deg']
  });

  // Partículas de fondo
  const renderParticles = () => {
    const particles = [];
    for (let i = 0; i < 30; i++) {
      const startX = Math.random() * SCREEN_WIDTH;
      const startY = SCREEN_HEIGHT + 50;
      const endY = -50;
      const duration = 2000 + Math.random() * 2000;
      const delay = Math.random() * 1000;
      const size = 4 + Math.random() * 8;

      particles.push(
        <Particle
          key={i}
          startX={startX}
          startY={startY}
          endY={endY}
          duration={duration}
          delay={delay}
          size={size}
          color={rarity.color}
          visible={phase >= 1}
        />
      );
    }
    return particles;
  };

  if (!visible || !being) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.container, { opacity: backdropOpacity }]}>
        {/* Fondo con gradiente */}
        <LinearGradient
          colors={['rgba(0,0,0,0.95)', 'rgba(20,20,40,0.95)']}
          style={StyleSheet.absoluteFill}
        />

        {/* Partículas ascendentes */}
        <Animated.View style={[styles.particlesContainer, { opacity: particlesOpacity }]}>
          {renderParticles()}
        </Animated.View>

        {/* Resplandor detrás de la carta */}
        <Animated.View
          style={[
            styles.glow,
            {
              backgroundColor: rarity.color,
              opacity: glowOpacity,
              transform: [{ scale: glowScale }]
            }
          ]}
        />

        {/* Carta */}
        <Animated.View
          style={[
            styles.cardContainer,
            {
              transform: [
                { scale: cardScale },
                { rotateY: spin }
              ]
            }
          ]}
        >
          <BeingCard
            being={being}
            isNew={true}
            size="large"
            onPress={() => {}}
          />
        </Animated.View>

        {/* Texto de rareza */}
        <Animated.View style={[styles.rarityTextContainer, { opacity: textOpacity }]}>
          <Text style={[styles.rarityLabel, { color: rarity.color }]}>
            {rarity.name.toUpperCase()}
          </Text>
          <Text style={styles.beingName}>{being.name}</Text>
          <Text style={styles.congratsText}>¡Has obtenido un nuevo ser!</Text>
        </Animated.View>

        {/* Botón de cerrar (solo después de revelar) */}
        {phase >= 2 && (
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[rarity.color, rarity.gradient[1]]}
              style={styles.closeButtonGradient}
            >
              <Text style={styles.closeButtonText}>¡GENIAL!</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </Animated.View>
    </Modal>
  );
};

// Componente de partícula individual
const Particle = ({ startX, startY, endY, duration, delay, size, color, visible }) => {
  const translateY = useRef(new Animated.Value(startY)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0.8,
            duration: 200,
            useNativeDriver: true
          }),
          Animated.timing(translateY, {
            toValue: endY,
            duration: duration,
            useNativeDriver: true
          })
        ])
      ]).start();
    }
  }, [visible]);

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left: startX,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          opacity,
          transform: [{ translateY }]
        }
      ]}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  particlesContainer: {
    ...StyleSheet.absoluteFillObject
  },
  particle: {
    position: 'absolute'
  },
  glow: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75
  },
  cardContainer: {
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20
  },
  rarityTextContainer: {
    position: 'absolute',
    bottom: 180,
    alignItems: 'center'
  },
  rarityLabel: {
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 6,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4
  },
  beingName: {
    fontSize: 22,
    fontWeight: '600',
    color: '#fff',
    marginTop: 8
  },
  congratsText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4
  },
  closeButton: {
    position: 'absolute',
    bottom: 60,
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8
  },
  closeButtonGradient: {
    paddingHorizontal: 50,
    paddingVertical: 15
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 2
  }
});

export default CardRevealModal;
