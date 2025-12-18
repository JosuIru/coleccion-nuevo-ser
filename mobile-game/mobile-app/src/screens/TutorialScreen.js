/**
 * TUTORIAL SCREEN
 * Onboarding interactivo para nuevos jugadores
 * Explica los conceptos core del juego en 5 pasos
 *
 * @version 1.0.0
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
  Image
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';

import { COLORS } from '../config/constants';
import useGameStore from '../stores/gameStore';

const { width, height } = Dimensions.get('window');

const TUTORIAL_STEPS = [
  {
    id: 1,
    title: '¡Bienvenido al Despertar!',
    description: 'Eres parte de un movimiento global que transforma crisis reales en oportunidades de cambio.',
    content: [
      'Tu misión: desplegar seres transformadores para resolver crisis del mundo real',
      'Cada acción cuenta para crear un futuro más consciente',
      'Lee libros, gana consciencia, evoluciona tus seres',
      '¡Puedes jugar en casa o explorando tu ciudad!'
    ],
    icon: '🌍',
    color: COLORS.accent.primary
  },
  {
    id: 2,
    title: 'Dos Modos de Juego',
    description: 'Elige cómo quieres jugar según tu situación.',
    content: [
      '🗺️ MODO EXPLORADOR (Tab "Mapa")',
      '   • Sal a explorar tu ciudad con GPS',
      '   • Encuentra fractales en lugares reales',
      '   • Crisis locales cerca de ti',
      '',
      '🛡️ MODO COMANDANTE (Tab "Comando")',
      '   • Juega desde casa sin GPS',
      '   • Crisis globales basadas en noticias reales',
      '   • Compite en la Liga de Crisis semanal'
    ],
    icon: '🎮',
    color: COLORS.accent.wisdom,
    interactive: {
      type: 'mode_selection',
      action: 'Usa "Mapa" para explorar o "Comando" para jugar en casa'
    }
  },
  {
    id: 3,
    title: 'Seres Transformadores',
    description: 'Los seres son tus agentes de cambio. Cada uno tiene atributos únicos.',
    content: [
      '🧠 15 atributos: Empatía, Análisis, Creatividad, Liderazgo...',
      '🔧 Cada ser es único con fortalezas específicas',
      '⚡ Consumen energía al ser desplegados (10 ⚡)',
      '📈 Fusiónalos para crear híbridos más poderosos',
      '💪 Mejora atributos leyendo libros'
    ],
    icon: '🧬',
    color: COLORS.accent.success,
    interactive: {
      type: 'being_preview',
      action: 'Importa seres desde Frankenstein Lab o créalos aquí'
    }
  },
  {
    id: 4,
    title: 'Crisis y Misiones',
    description: 'Resuelve crisis reales extraídas de noticias globales.',
    content: [
      '🌍 7 tipos: Ambientales, Sociales, Económicas, Humanitarias...',
      '🎯 Cada crisis requiere atributos específicos',
      '📊 Tu probabilidad de éxito = match de atributos',
      '⏱️ Las misiones toman 30-90 minutos',
      '🏆 Gana XP, consciencia y sube de nivel'
    ],
    icon: '🚨',
    color: COLORS.accent.critical,
    interactive: {
      type: 'mission_preview',
      action: 'Selecciona seres con atributos que coincidan'
    }
  },
  {
    id: 5,
    title: 'Liga de Crisis',
    description: 'Compite semanalmente contra otros jugadores resolviendo crisis globales.',
    content: [
      '🏆 Ranking semanal con recompensas',
      '📈 7 divisiones: Bronce → Leyenda',
      '🔥 Bonificaciones por rachas diarias',
      '⭐ Crisis destacadas con puntos extra',
      '🎁 Premios: XP y puntos de consciencia'
    ],
    icon: '🏆',
    color: '#FFD700',
    interactive: {
      type: 'league_preview',
      action: 'Accede desde el icono 🏆 en el Centro de Comando'
    }
  },
  {
    id: 6,
    title: '¡Comienza Tu Viaje!',
    description: 'Todo listo. Elige tu modo y comienza la transformación.',
    content: [
      '🏠 En casa: Tab "Comando" → Crisis globales',
      '🚶 Afuera: Tab "Mapa" → Explora tu ciudad',
      '📖 Lee libros para ganar consciencia',
      '🧬 Crea y mejora tus seres',
      '❓ Ayuda disponible en Perfil → Ayuda'
    ],
    icon: '🚀',
    color: COLORS.gradient.main[1],
    cta: '¡Empezar a Jugar!'
  }
];

const TutorialScreen = ({ navigation, route }) => {
  // Estado
  const [currentStep, setCurrentStep] = useState(0);
  const [canSkip, setCanSkip] = useState(true);

  // Game Store
  const initializeNewPlayer = useGameStore(state => state.initializeNewPlayer);

  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  // Animar entrada de cada step
  useEffect(() => {
    // Reset animaciones
    fadeAnim.setValue(0);
    slideAnim.setValue(50);
    scaleAnim.setValue(0.8);

    // Animar entrada
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true
      })
    ]).start();
  }, [currentStep]);

  // Manejar siguiente paso
  const handleNext = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTutorial();
    }
  };

  // Manejar paso anterior
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Saltar tutorial
  const handleSkip = async () => {
    try {
      // Inicializar jugador con ser y crisis
      initializeNewPlayer();

      if (AsyncStorage && typeof AsyncStorage.setItem === 'function') {
        await AsyncStorage.setItem('tutorial_completed', 'true');
      }
    } catch (e) {
      console.warn('[TutorialScreen] Skip setItem failed:', e.message);
    }
    navigation.replace('Main');
  };

  // Completar tutorial
  const completeTutorial = async () => {
    try {
      // Inicializar jugador con ser y crisis
      initializeNewPlayer();

      if (AsyncStorage && typeof AsyncStorage.setItem === 'function') {
        await AsyncStorage.setItem('tutorial_completed', 'true');
        await AsyncStorage.setItem('tutorial_completion_date', new Date().toISOString());
      }
      navigation.replace('Main');
    } catch (error) {
      console.error('Error guardando progreso del tutorial:', error);
      navigation.replace('Main');
    }
  };

  const step = TUTORIAL_STEPS[currentStep];
  const isLastStep = currentStep === TUTORIAL_STEPS.length - 1;

  return (
    <View style={styles.container}>
      {/* Header con progress */}
      <View style={styles.header}>
        {canSkip && !isLastStep && (
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>Saltar</Text>
          </TouchableOpacity>
        )}

        <View style={styles.progressContainer}>
          {TUTORIAL_STEPS.map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressDot,
                index === currentStep && styles.progressDotActive,
                index < currentStep && styles.progressDotCompleted
              ]}
            />
          ))}
        </View>
      </View>

      {/* Contenido del step */}
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [
              { translateY: slideAnim },
              { scale: scaleAnim }
            ]
          }
        ]}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Icono grande */}
          <Animated.Text
            style={[
              styles.icon,
              { transform: [{ scale: scaleAnim }] }
            ]}
          >
            {step.icon}
          </Animated.Text>

          {/* Título */}
          <Text style={styles.title}>{step.title}</Text>

          {/* Descripción */}
          <Text style={styles.description}>{step.description}</Text>

          {/* Contenido (bullets) */}
          <View style={styles.contentList}>
            {step.content.map((item, index) => (
              <View key={index} style={styles.contentItem}>
                <View style={[styles.bullet, { backgroundColor: step.color }]} />
                <Text style={styles.contentText}>{item}</Text>
              </View>
            ))}
          </View>

          {/* Sección interactiva (si existe) */}
          {step.interactive && (
            <View style={[styles.interactiveBox, { borderColor: step.color }]}>
              <Text style={styles.interactiveIcon}>💡</Text>
              <Text style={styles.interactiveText}>{step.interactive.action}</Text>
            </View>
          )}
        </ScrollView>
      </Animated.View>

      {/* Footer con navegación */}
      <View style={styles.footer}>
        {/* Botón atrás */}
        {currentStep > 0 && (
          <TouchableOpacity
            onPress={handlePrevious}
            style={[styles.button, styles.buttonSecondary]}
          >
            <Text style={styles.buttonSecondaryText}>← Atrás</Text>
          </TouchableOpacity>
        )}

        {/* Botón siguiente/empezar */}
        <TouchableOpacity
          onPress={handleNext}
          style={[
            styles.button,
            styles.buttonPrimary,
            { backgroundColor: step.color },
            currentStep === 0 && styles.buttonFullWidth
          ]}
        >
          <Text style={styles.buttonPrimaryText}>
            {isLastStep ? (step.cta || 'Empezar') : 'Siguiente →'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg.primary
  },

  // Header
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20
  },
  skipButton: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 16
  },
  skipText: {
    color: COLORS.text.secondary,
    fontSize: 16,
    fontWeight: '600'
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    gap: 8
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.bg.elevated
  },
  progressDotActive: {
    width: 24,
    backgroundColor: COLORS.accent.primary
  },
  progressDotCompleted: {
    backgroundColor: COLORS.accent.success
  },

  // Content
  content: {
    flex: 1,
    paddingHorizontal: 20
  },
  scrollContent: {
    paddingBottom: 40
  },
  icon: {
    fontSize: 80,
    textAlign: 'center',
    marginBottom: 20
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    textAlign: 'center',
    marginBottom: 12
  },
  description: {
    fontSize: 16,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30
  },
  contentList: {
    gap: 16
  },
  contentItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 8
  },
  contentText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text.primary,
    lineHeight: 22
  },
  interactiveBox: {
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: COLORS.bg.elevated,
    alignItems: 'center'
  },
  interactiveIcon: {
    fontSize: 32,
    marginBottom: 8
  },
  interactiveText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic'
  },

  // Footer
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 12
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  buttonFullWidth: {
    flex: 1
  },
  buttonPrimary: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8
  },
  buttonPrimaryText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold'
  },
  buttonSecondary: {
    backgroundColor: COLORS.bg.elevated,
    borderWidth: 1,
    borderColor: COLORS.text.dim
  },
  buttonSecondaryText: {
    color: COLORS.text.primary,
    fontSize: 16,
    fontWeight: '600'
  }
});

export default TutorialScreen;
