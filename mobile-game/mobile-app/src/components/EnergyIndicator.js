/**
 * ENERGY INDICATOR
 * Indicador de energía con regeneración visible en tiempo real
 * Muestra barra de progreso, nivel actual, y tiempo hasta recuperación completa
 *
 * @version 1.0.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Animated,
  TouchableOpacity
} from 'react-native';

import { COLORS, RESOURCES } from '../config/constants';
import useGameStore from '../stores/gameStore';
import analyticsService from '../services/AnalyticsService';

const EnergyIndicator = ({ compact = false, onPress }) => {
  const user = useGameStore(state => state.user);
  const updateEnergy = useGameStore(state => state.updateEnergy);

  const [currentEnergy, setCurrentEnergy] = useState(user.energy || 0);
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [timeToFull, setTimeToFull] = useState(null);

  // Animation
  const fillAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Constants
  const maxEnergy = user.maxEnergy || RESOURCES.ENERGY.MAX_BASE;
  const regenPerMinute = RESOURCES.ENERGY.REGEN_PER_MINUTE; // 5 puntos/min
  const regenPerSecond = regenPerMinute / 60; // ~0.083 puntos/segundo

  // Calculate energy and time
  useEffect(() => {
    const calculateEnergy = () => {
      const now = Date.now();
      const elapsedSeconds = (now - lastUpdate) / 1000;
      const energyToAdd = Math.floor(elapsedSeconds * regenPerSecond);

      if (energyToAdd > 0 && currentEnergy < maxEnergy) {
        const newEnergy = Math.min(currentEnergy + energyToAdd, maxEnergy);
        setCurrentEnergy(newEnergy);
        setLastUpdate(now);

        // Update store
        updateEnergy(newEnergy);
      }

      // Calculate time to full
      if (currentEnergy < maxEnergy) {
        const energyNeeded = maxEnergy - currentEnergy;
        const minutesNeeded = Math.ceil(energyNeeded / regenPerMinute);
        setTimeToFull(minutesNeeded);
      } else {
        setTimeToFull(null);
      }
    };

    // Update every second
    const interval = setInterval(calculateEnergy, 1000);

    return () => clearInterval(interval);
  }, [currentEnergy, lastUpdate, maxEnergy, updateEnergy]);

  // Animate energy fill
  useEffect(() => {
    const percentage = (currentEnergy / maxEnergy) * 100;

    Animated.timing(fillAnim, {
      toValue: percentage,
      duration: 500,
      useNativeDriver: false
    }).start();

    // Pulse animation when regenerating
    if (currentEnergy < maxEnergy) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
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
    } else {
      pulseAnim.setValue(1);
    }
  }, [currentEnergy, maxEnergy]);

  // Sync with store when it changes
  useEffect(() => {
    if (user.energy !== currentEnergy) {
      setCurrentEnergy(user.energy || 0);
      setLastUpdate(Date.now());
    }
  }, [user.energy]);

  // Track energy viewed on mount
  useEffect(() => {
    analyticsService.trackEnergyViewed(currentEnergy, maxEnergy);
  }, []);

  // Track energy depleted
  useEffect(() => {
    if (currentEnergy === 0) {
      analyticsService.trackEnergyDepleted();
    }
  }, [currentEnergy]);

  const fillWidth = fillAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%']
  });

  const energyPercentage = Math.round((currentEnergy / maxEnergy) * 100);

  // Color based on energy level
  let energyColor = COLORS.accent.critical;
  if (energyPercentage >= 60) {
    energyColor = COLORS.accent.success;
  } else if (energyPercentage >= 30) {
    energyColor = COLORS.accent.warning;
  }

  // Format time to full
  const formatTimeToFull = (minutes) => {
    if (!minutes) return null;
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  // Handle press with analytics
  const handlePress = () => {
    analyticsService.trackEnergyShopOpened(compact ? 'header' : 'profile');
    if (onPress) onPress();
  };

  if (compact) {
    return (
      <TouchableOpacity
        onPress={handlePress}
        style={styles.compactContainer}
        activeOpacity={0.7}
      >
        <View style={styles.compactIcon}>
          <Text style={styles.compactIconText}>⚡</Text>
        </View>
        <View style={styles.compactInfo}>
          <Text style={styles.compactValue}>
            {Math.floor(currentEnergy)}/{maxEnergy}
          </Text>
          {currentEnergy < maxEnergy && (
            <Text style={styles.compactRegen}>
              +{regenPerMinute}/min
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={styles.container}
      activeOpacity={0.9}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.labelContainer}>
          <Animated.Text
            style={[
              styles.icon,
              { transform: [{ scale: pulseAnim }] }
            ]}
          >
            ⚡
          </Animated.Text>
          <Text style={styles.label}>Energía</Text>
        </View>

        <View style={styles.valueContainer}>
          <Text style={[styles.value, { color: energyColor }]}>
            {Math.floor(currentEnergy)}
          </Text>
          <Text style={styles.maxValue}>/{maxEnergy}</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBackground}>
          <Animated.View
            style={[
              styles.progressBarFill,
              {
                width: fillWidth,
                backgroundColor: energyColor
              }
            ]}
          />
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        {currentEnergy < maxEnergy ? (
          <>
            <View style={styles.regenInfo}>
              <Text style={styles.regenIcon}>↑</Text>
              <Text style={styles.regenText}>
                +{regenPerMinute} por minuto
              </Text>
            </View>
            {timeToFull && (
              <View style={styles.timeInfo}>
                <Text style={styles.timeIcon}>⏱️</Text>
                <Text style={styles.timeText}>
                  {formatTimeToFull(timeToFull)} hasta lleno
                </Text>
              </View>
            )}
          </>
        ) : (
          <View style={styles.fullInfo}>
            <Text style={styles.fullIcon}>✓</Text>
            <Text style={styles.fullText}>Energía completa</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Full display
  container: {
    backgroundColor: COLORS.bg.elevated,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },

  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },

  icon: {
    fontSize: 24
  },

  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.secondary
  },

  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline'
  },

  value: {
    fontSize: 24,
    fontWeight: 'bold'
  },

  maxValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.dim,
    marginLeft: 2
  },

  progressBarContainer: {
    marginBottom: 12
  },

  progressBarBackground: {
    height: 12,
    backgroundColor: COLORS.bg.secondary,
    borderRadius: 6,
    overflow: 'hidden'
  },

  progressBarFill: {
    height: '100%',
    borderRadius: 6,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4
  },

  footer: {
    gap: 6
  },

  regenInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },

  regenIcon: {
    fontSize: 14,
    color: COLORS.accent.success
  },

  regenText: {
    fontSize: 13,
    color: COLORS.text.secondary,
    fontWeight: '500'
  },

  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },

  timeIcon: {
    fontSize: 14
  },

  timeText: {
    fontSize: 13,
    color: COLORS.text.dim,
    fontStyle: 'italic'
  },

  fullInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },

  fullIcon: {
    fontSize: 16,
    color: COLORS.accent.success
  },

  fullText: {
    fontSize: 13,
    color: COLORS.accent.success,
    fontWeight: '600'
  },

  // Compact display
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.bg.elevated,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.2)'
  },

  compactIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.accent.primary,
    justifyContent: 'center',
    alignItems: 'center'
  },

  compactIconText: {
    fontSize: 18
  },

  compactInfo: {
    gap: 2
  },

  compactValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text.primary
  },

  compactRegen: {
    fontSize: 11,
    color: COLORS.accent.success,
    fontWeight: '600'
  }
});

export default EnergyIndicator;
