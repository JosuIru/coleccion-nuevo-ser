/**
 * GaiaMessageBanner - Banner de mensajes de Gaia
 *
 * Muestra mensajes de Gaia de forma periódica y al completar acciones importantes.
 * Los mensajes varían según el nivel de consciencia global.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import transitionService from '../services/TransitionService';
import { COLORS } from '../config/constants';

const { width } = Dimensions.get('window');

// Colores por nivel de Gaia
const GAIA_COLORS = {
  dormant: '#4B5563',
  stirring: '#6366F1',
  awakening: '#8B5CF6',
  connected: '#06B6D4',
  flourishing: '#10B981',
  thriving: '#22C55E',
  transcending: '#F59E0B',
  awakened: '#FFD700'
};

// Iconos por tipo de mensaje
const MESSAGE_ICONS = {
  whisper: 'weather-windy',
  dream: 'sleep',
  intuition: 'lightbulb-on',
  synchronicity: 'infinity',
  voice: 'account-voice',
  vision: 'eye',
  emotion: 'heart',
  guidance: 'compass',
  teaching: 'book-open-variant',
  revelation: 'star-shooting',
  encouragement: 'arm-flex',
  warning: 'alert-circle',
  empowerment: 'lightning-bolt',
  gratitude: 'hand-heart',
  prophecy: 'crystal-ball',
  unity: 'earth',
  celebration: 'party-popper',
  protection: 'shield-check',
  preparation: 'flag-checkered',
  merging: 'merge',
  call: 'phone-ring',
  blessing: 'star-four-points',
  completion: 'trophy',
  invitation: 'door-open',
  milestone: 'flag-variant'
};

const GaiaMessageBanner = ({
  visible = true,
  autoShow = true,
  intervalMinutes = 5,
  onPress,
  style
}) => {
  const [message, setMessage] = useState(null);
  const [gaiaLevel, setGaiaLevel] = useState('dormant');
  const [show, setShow] = useState(false);
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  // Obtener mensaje de Gaia
  const fetchGaiaMessage = () => {
    const status = transitionService.getGaiaStatus();
    if (status) {
      setGaiaLevel(status.level);
      if (status.currentMessage) {
        setMessage(status.currentMessage);
        showBanner();
      }
    }
  };

  // Mostrar banner con animación
  const showBanner = () => {
    setShow(true);
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true
      })
    ]).start();

    // Animación de brillo
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true
        })
      ])
    ).start();

    // Auto-ocultar después de 8 segundos
    setTimeout(hideBanner, 8000);
  };

  // Ocultar banner con animación
  const hideBanner = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true
      })
    ]).start(() => setShow(false));
  };

  // Mostrar mensaje automáticamente cada X minutos
  useEffect(() => {
    if (!visible || !autoShow) return;

    // Mostrar primer mensaje al montar
    const initialTimeout = setTimeout(fetchGaiaMessage, 3000);

    // Intervalo para mensajes periódicos
    const interval = setInterval(fetchGaiaMessage, intervalMinutes * 60 * 1000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [visible, autoShow, intervalMinutes]);

  if (!visible || !show || !message) return null;

  const color = GAIA_COLORS[gaiaLevel] || GAIA_COLORS.dormant;
  const icon = MESSAGE_ICONS[message.type] || 'earth';

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7]
  });

  return (
    <Animated.View
      style={[
        styles.container,
        style,
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim
        }
      ]}
    >
      {/* Fondo con brillo */}
      <Animated.View
        style={[
          styles.glowBackground,
          {
            backgroundColor: color,
            opacity: glowOpacity
          }
        ]}
      />

      <TouchableOpacity
        style={[styles.banner, { borderColor: color }]}
        onPress={() => {
          if (onPress) onPress();
          hideBanner();
        }}
        activeOpacity={0.9}
      >
        {/* Icono de Gaia */}
        <View style={[styles.iconContainer, { backgroundColor: color + '30' }]}>
          <Icon name={icon} size={24} color={color} />
        </View>

        {/* Mensaje */}
        <View style={styles.messageContainer}>
          <Text style={styles.gaiaLabel}>
            <Icon name="earth" size={12} color={color} /> Gaia
          </Text>
          <Text style={styles.messageText} numberOfLines={2}>
            {message.text}
          </Text>
        </View>

        {/* Botón cerrar */}
        <TouchableOpacity style={styles.closeButton} onPress={hideBanner}>
          <Icon name="close" size={18} color={COLORS.text.muted} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Función para mostrar mensaje manualmente desde fuera del componente
export const showGaiaMessage = (messageObj) => {
  // Esta función se puede llamar desde cualquier parte
  // El componente escuchará eventos globales
  if (global.showGaiaMessageCallback) {
    global.showGaiaMessageCallback(messageObj);
  }
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 100,
    left: 16,
    right: 16,
    zIndex: 1000
  },
  glowBackground: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 20,
    opacity: 0.3
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bg.elevated,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  messageContainer: {
    flex: 1
  },
  gaiaLabel: {
    fontSize: 11,
    color: COLORS.text.muted,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  messageText: {
    fontSize: 14,
    color: COLORS.text.primary,
    lineHeight: 20,
    fontStyle: 'italic'
  },
  closeButton: {
    padding: 8,
    marginLeft: 8
  }
});

export default GaiaMessageBanner;
