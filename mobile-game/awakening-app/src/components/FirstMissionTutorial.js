/**
 * FIRST MISSION TUTORIAL
 * Tutorial interactivo paso a paso para la primera misión
 * Se activa automáticamente cuando el jugador va a hacer su primera misión
 *
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../config/constants';
import analyticsService from '../services/AnalyticsService';

const { width, height } = Dimensions.get('window');

const TUTORIAL_STEPS = [
  {
    id: 1,
    title: '¡Tu Primera Misión!',
    description: 'Vamos a resolver tu primera crisis juntos. Te guiaré paso a paso.',
    icon: '🎯',
    highlight: null, // No destacar nada aún
    action: 'Empezar Tutorial'
  },
  {
    id: 2,
    title: 'Selecciona una Crisis',
    description: 'Elige una crisis FÁCIL para empezar. Las verdes son las más sencillas.',
    icon: '🌍',
    highlight: 'crisis-list', // Destacar lista de crisis
    tip: 'Toca una crisis para ver sus detalles y requisitos',
    action: 'Siguiente'
  },
  {
    id: 3,
    title: 'Revisa los Requisitos',
    description: 'Cada crisis requiere ciertos atributos. Verás los que necesitas cumplir.',
    icon: '📋',
    highlight: 'crisis-requirements',
    tip: 'Busca crisis con requisitos bajos para empezar',
    action: 'Siguiente'
  },
  {
    id: 4,
    title: 'Selecciona tu Ser',
    description: 'Ya tienes un ser inicial "Primer Despertar". ¡Úsalo para esta misión!',
    icon: '🧬',
    highlight: 'beings-selector',
    tip: 'Toca el ser para ver sus atributos y asignarlo',
    action: 'Siguiente'
  },
  {
    id: 5,
    title: 'Confirma la Asignación',
    description: 'Revisa la probabilidad de éxito y el tiempo estimado. Si todo se ve bien, confirma.',
    icon: '✅',
    highlight: 'confirm-button',
    tip: 'Una probabilidad ≥60% es buena para empezar',
    action: 'Siguiente'
  },
  {
    id: 6,
    title: 'Espera los Resultados',
    description: 'Las misiones toman tiempo real. Recibirás una notificación cuando termine.',
    icon: '⏱️',
    highlight: 'active-missions',
    tip: 'Mientras esperas, puedes explorar el mapa o leer libros',
    action: 'Siguiente'
  },
  {
    id: 7,
    title: '¡Listo para Jugar!',
    description: 'Ya sabes lo básico. Ahora experimenta, lee libros y crea más seres.',
    icon: '🚀',
    highlight: null,
    tips: [
      '💡 Lee libros para ganar consciencia',
      '🧬 Usa consciencia para crear más seres',
      '⚡ La energía se regenera 5 puntos/minuto',
      '🏆 Compite en la Liga de Crisis semanal'
    ],
    action: '¡Empezar a Jugar!'
  }
];

const FirstMissionTutorial = ({ visible, onComplete, onDismiss }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      // Track tutorial start on first mount
      if (currentStep === 0) {
        analyticsService.trackTutorialStarted();
      }

      // Track step view
      const step = TUTORIAL_STEPS[currentStep];
      analyticsService.trackTutorialStep(currentStep + 1, step.title);

      // Animate
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true
      }).start();
    }
  }, [visible, currentStep]);

  const handleNext = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTutorial();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeTutorial = async () => {
    try {
      // Track completion
      await analyticsService.trackTutorialCompleted();

      // Save state
      await AsyncStorage.setItem('first_mission_tutorial_completed', 'true');
      onComplete();
    } catch (error) {
      console.error('Error guardando tutorial de primera misión:', error);
      onComplete();
    }
  };

  const handleSkip = async () => {
    try {
      // Track skip
      await analyticsService.trackTutorialSkipped(currentStep + 1);

      // Save state
      await AsyncStorage.setItem('first_mission_tutorial_completed', 'skipped');
      onDismiss();
    } catch (error) {
      console.error('Error saltando tutorial:', error);
      onDismiss();
    }
  };

  if (!visible) return null;

  const step = TUTORIAL_STEPS[currentStep];
  const isLastStep = currentStep === TUTORIAL_STEPS.length - 1;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        {/* Spotlight effect (semi-transparent overlay) */}
        <View style={styles.dimBackground} />

        {/* Tutorial card */}
        <Animated.View
          style={[
            styles.tutorialCard,
            { opacity: fadeAnim }
          ]}
        >
          {/* Skip button */}
          {!isLastStep && (
            <TouchableOpacity
              style={styles.skipButton}
              onPress={handleSkip}
            >
              <Text style={styles.skipText}>Saltar Tutorial</Text>
            </TouchableOpacity>
          )}

          {/* Step counter */}
          <View style={styles.stepCounter}>
            <Text style={styles.stepText}>
              Paso {currentStep + 1} de {TUTORIAL_STEPS.length}
            </Text>
          </View>

          {/* Icon */}
          <Text style={styles.icon}>{step.icon}</Text>

          {/* Title */}
          <Text style={styles.title}>{step.title}</Text>

          {/* Description */}
          <Text style={styles.description}>{step.description}</Text>

          {/* Tip */}
          {step.tip && (
            <View style={styles.tipBox}>
              <Text style={styles.tipIcon}>💡</Text>
              <Text style={styles.tipText}>{step.tip}</Text>
            </View>
          )}

          {/* Tips list (for last step) */}
          {step.tips && (
            <View style={styles.tipsList}>
              {step.tips.map((tip, index) => (
                <Text key={index} style={styles.tipsItem}>{tip}</Text>
              ))}
            </View>
          )}

          {/* Progress dots */}
          <View style={styles.progressDots}>
            {TUTORIAL_STEPS.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  index === currentStep && styles.dotActive,
                  index < currentStep && styles.dotCompleted
                ]}
              />
            ))}
          </View>

          {/* Buttons */}
          <View style={styles.buttons}>
            {currentStep > 0 && (
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={handlePrevious}
              >
                <Text style={styles.buttonSecondaryText}>← Atrás</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.button,
                styles.buttonPrimary,
                currentStep === 0 && styles.buttonFullWidth
              ]}
              onPress={handleNext}
            >
              <Text style={styles.buttonPrimaryText}>
                {step.action}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },

  dimBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)'
  },

  tutorialCard: {
    width: width - 40,
    maxWidth: 400,
    backgroundColor: COLORS.bg.elevated,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
    borderWidth: 2,
    borderColor: COLORS.accent.primary
  },

  skipButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 8,
    zIndex: 10
  },

  skipText: {
    color: COLORS.text.secondary,
    fontSize: 14,
    fontWeight: '600'
  },

  stepCounter: {
    marginBottom: 12
  },

  stepText: {
    color: COLORS.text.secondary,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1
  },

  icon: {
    fontSize: 60,
    marginBottom: 16
  },

  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    textAlign: 'center',
    marginBottom: 12
  },

  description: {
    fontSize: 16,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16
  },

  tipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bg.secondary,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.accent.warning
  },

  tipIcon: {
    fontSize: 20,
    marginRight: 8
  },

  tipText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text.primary,
    fontStyle: 'italic'
  },

  tipsList: {
    width: '100%',
    marginBottom: 16,
    gap: 8
  },

  tipsItem: {
    fontSize: 14,
    color: COLORS.text.secondary,
    lineHeight: 20,
    paddingLeft: 8
  },

  progressDots: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.bg.secondary
  },

  dotActive: {
    width: 24,
    backgroundColor: COLORS.accent.primary
  },

  dotCompleted: {
    backgroundColor: COLORS.accent.success
  },

  buttons: {
    flexDirection: 'row',
    width: '100%',
    gap: 12
  },

  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },

  buttonFullWidth: {
    flex: 1
  },

  buttonPrimary: {
    backgroundColor: COLORS.accent.primary,
    shadowColor: COLORS.accent.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6
  },

  buttonPrimaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  },

  buttonSecondary: {
    backgroundColor: COLORS.bg.secondary,
    borderWidth: 1,
    borderColor: COLORS.text.dim
  },

  buttonSecondaryText: {
    color: COLORS.text.primary,
    fontSize: 15,
    fontWeight: '600'
  }
});

export default FirstMissionTutorial;
