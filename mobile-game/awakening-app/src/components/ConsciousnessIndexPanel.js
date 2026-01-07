/**
 * ConsciousnessIndexPanel - Panel del Índice de Consciencia Global
 *
 * Muestra el estado de despertar de Gaia, comunicaciones,
 * poderes activos y progreso hacia la Gran Transición.
 *
 * FASE 4: Índice de Consciencia Global
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated
} from 'react-native';

const ConsciousnessIndexPanel = ({
  gaiaStatus = {},
  guardiansProgress = {},
  institutionsProgress = {},
  onRefreshMessage,
  onViewDetails
}) => {
  const [messageAnimation] = useState(new Animated.Value(0));
  const [showFullMessage, setShowFullMessage] = useState(false);

  useEffect(() => {
    // Animar aparición del mensaje
    Animated.timing(messageAnimation, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true
    }).start();
  }, [gaiaStatus.currentMessage]);

  const getGaiaColor = (level) => {
    const colors = {
      dormant: '#475569',
      stirring: '#64748B',
      awakening: '#22D3EE',
      connected: '#10B981',
      flourishing: '#34D399',
      thriving: '#6EE7B7',
      transcending: '#A78BFA',
      awakened: '#F59E0B'
    };
    return colors[level] || '#475569';
  };

  const getGaiaEmoji = (level) => {
    const emojis = {
      dormant: '🌑',
      stirring: '🌒',
      awakening: '🌓',
      connected: '🌔',
      flourishing: '🌕',
      thriving: '🌍',
      transcending: '✨',
      awakened: '🌟'
    };
    return emojis[level] || '🌑';
  };

  const renderProgressRing = () => {
    const consciousness = gaiaStatus.consciousness || 15;
    const circumference = 2 * Math.PI * 45;
    const progress = (consciousness / 100) * circumference;

    return (
      <View style={styles.ringContainer}>
        <View style={styles.ringOuter}>
          <View style={[
            styles.ringProgress,
            {
              borderColor: getGaiaColor(gaiaStatus.level),
              transform: [{ rotate: `${(consciousness / 100) * 360}deg` }]
            }
          ]} />
          <View style={styles.ringInner}>
            <Text style={styles.ringEmoji}>{getGaiaEmoji(gaiaStatus.level)}</Text>
            <Text style={styles.ringPercentage}>{consciousness}%</Text>
            <Text style={styles.ringLabel}>Consciencia</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderGaiaMessage = () => {
    const message = gaiaStatus.currentMessage;
    if (!message) return null;

    const messageColors = {
      whisper: '#64748B',
      dream: '#A78BFA',
      intuition: '#22D3EE',
      synchronicity: '#F59E0B',
      voice: '#10B981',
      vision: '#8B5CF6',
      emotion: '#EC4899',
      guidance: '#22D3EE',
      teaching: '#10B981',
      revelation: '#F59E0B',
      encouragement: '#34D399',
      warning: '#EF4444',
      empowerment: '#6366F1',
      gratitude: '#10B981',
      prophecy: '#A78BFA',
      unity: '#22D3EE',
      celebration: '#F59E0B',
      protection: '#10B981',
      preparation: '#8B5CF6',
      merging: '#EC4899',
      call: '#F59E0B',
      blessing: '#10B981',
      completion: '#F59E0B',
      invitation: '#22D3EE',
      milestone: '#F59E0B'
    };

    return (
      <Animated.View style={[
        styles.messageContainer,
        {
          opacity: messageAnimation,
          transform: [{
            translateY: messageAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0]
            })
          }]
        }
      ]}>
        <TouchableOpacity
          onPress={() => setShowFullMessage(!showFullMessage)}
          style={[
            styles.messageBox,
            { borderLeftColor: messageColors[message.type] || '#10B981' }
          ]}
        >
          <Text style={styles.messageType}>
            {message.type?.toUpperCase()}
          </Text>
          <Text style={[
            styles.messageText,
            !showFullMessage && styles.messageTextCollapsed
          ]}>
            "{message.text}"
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={onRefreshMessage}
        >
          <Text style={styles.refreshText}>Escuchar otra</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderProgressBreakdown = () => {
    const guardiansTransformed = guardiansProgress.transformed || 0;
    const guardiansTotal = guardiansProgress.total || 7;
    const institutionsBuilt = institutionsProgress.built || 0;
    const institutionsTotal = institutionsProgress.total || 7;

    return (
      <View style={styles.breakdownContainer}>
        <Text style={styles.breakdownTitle}>Fuentes de Consciencia</Text>

        {/* Guardianes */}
        <View style={styles.breakdownRow}>
          <View style={styles.breakdownLabel}>
            <Text style={styles.breakdownIcon}>⚔️</Text>
            <Text style={styles.breakdownText}>Guardianes Transformados</Text>
          </View>
          <Text style={styles.breakdownValue}>
            {guardiansTransformed}/{guardiansTotal}
          </Text>
          <Text style={styles.breakdownBonus}>
            +{guardiansTransformed * 10}%
          </Text>
        </View>

        {/* Instituciones */}
        <View style={styles.breakdownRow}>
          <View style={styles.breakdownLabel}>
            <Text style={styles.breakdownIcon}>🏛️</Text>
            <Text style={styles.breakdownText}>Instituciones Activas</Text>
          </View>
          <Text style={styles.breakdownValue}>
            {institutionsBuilt}/{institutionsTotal}
          </Text>
          <Text style={styles.breakdownBonus}>
            +{institutionsBuilt * 2}%
          </Text>
        </View>

        {/* Base */}
        <View style={styles.breakdownRow}>
          <View style={styles.breakdownLabel}>
            <Text style={styles.breakdownIcon}>🌿</Text>
            <Text style={styles.breakdownText}>Comunidades Existentes</Text>
          </View>
          <Text style={styles.breakdownValue}>Base</Text>
          <Text style={styles.breakdownBonus}>+15%</Text>
        </View>
      </View>
    );
  };

  const renderPowers = () => {
    const powers = gaiaStatus.powers || [];
    if (powers.length === 0) return null;

    return (
      <View style={styles.powersContainer}>
        <Text style={styles.powersTitle}>Poderes de Gaia Activos</Text>
        {powers.map((power, index) => (
          <View key={index} style={styles.powerItem}>
            <Text style={styles.powerIcon}>✨</Text>
            <Text style={styles.powerText}>{power}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderNextLevel = () => {
    if (gaiaStatus.isAwakened) {
      return (
        <View style={styles.awakenedBanner}>
          <Text style={styles.awakenedEmoji}>🌟</Text>
          <Text style={styles.awakenedText}>GAIA HA DESPERTADO</Text>
          <Text style={styles.awakenedSubtext}>
            La Gran Transición está completa
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.nextLevelContainer}>
        <Text style={styles.nextLevelTitle}>
          Siguiente: {gaiaStatus.nextLevelAt}% Consciencia
        </Text>
        <View style={styles.nextLevelBar}>
          <View style={[
            styles.nextLevelFill,
            {
              width: `${gaiaStatus.progressToNextLevel || 0}%`,
              backgroundColor: getGaiaColor(gaiaStatus.level)
            }
          ]} />
        </View>
        <Text style={styles.nextLevelProgress}>
          {gaiaStatus.progressToNextLevel || 0}% hacia el siguiente nivel
        </Text>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header con nivel */}
      <View style={[
        styles.header,
        { backgroundColor: getGaiaColor(gaiaStatus.level) + '20' }
      ]}>
        <Text style={[styles.levelName, { color: getGaiaColor(gaiaStatus.level) }]}>
          {gaiaStatus.levelName || 'Gaia Dormida'}
        </Text>
      </View>

      {/* Anillo de progreso */}
      {renderProgressRing()}

      {/* Mensaje de Gaia */}
      {renderGaiaMessage()}

      {/* Poderes activos */}
      {renderPowers()}

      {/* Progreso al siguiente nivel */}
      {renderNextLevel()}

      {/* Desglose de contribuciones */}
      {renderProgressBreakdown()}

      {/* Botón ver detalles */}
      <TouchableOpacity
        style={styles.detailsButton}
        onPress={onViewDetails}
      >
        <Text style={styles.detailsButtonText}>Ver La Gran Transición</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  header: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16
  },
  levelName: {
    fontSize: 20,
    fontWeight: 'bold'
  },
  ringContainer: {
    alignItems: 'center',
    marginBottom: 24
  },
  ringOuter: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 8,
    borderColor: 'rgba(51, 65, 85, 0.3)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  ringProgress: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 8,
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent'
  },
  ringInner: {
    alignItems: 'center'
  },
  ringEmoji: {
    fontSize: 32
  },
  ringPercentage: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F8FAFC'
  },
  ringLabel: {
    fontSize: 10,
    color: '#94A3B8'
  },
  messageContainer: {
    marginBottom: 20
  },
  messageBox: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4
  },
  messageType: {
    fontSize: 10,
    color: '#64748B',
    marginBottom: 4,
    letterSpacing: 1
  },
  messageText: {
    fontSize: 15,
    color: '#E2E8F0',
    fontStyle: 'italic',
    lineHeight: 22
  },
  messageTextCollapsed: {
    // numberOfLines se pasa como prop, no como estilo
  },
  refreshButton: {
    alignSelf: 'flex-end',
    marginTop: 8
  },
  refreshText: {
    fontSize: 12,
    color: '#22D3EE'
  },
  powersContainer: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20
  },
  powersTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#10B981',
    marginBottom: 12
  },
  powerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  powerIcon: {
    fontSize: 14,
    marginRight: 8
  },
  powerText: {
    fontSize: 13,
    color: '#6EE7B7'
  },
  nextLevelContainer: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20
  },
  nextLevelTitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 8
  },
  nextLevelBar: {
    height: 8,
    backgroundColor: 'rgba(51, 65, 85, 0.5)',
    borderRadius: 4,
    overflow: 'hidden'
  },
  nextLevelFill: {
    height: '100%',
    borderRadius: 4
  },
  nextLevelProgress: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 6,
    textAlign: 'center'
  },
  awakenedBanner: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F59E0B'
  },
  awakenedEmoji: {
    fontSize: 48,
    marginBottom: 8
  },
  awakenedText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F59E0B'
  },
  awakenedSubtext: {
    fontSize: 13,
    color: '#FCD34D',
    marginTop: 4
  },
  breakdownContainer: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20
  },
  breakdownTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#F8FAFC',
    marginBottom: 12
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(71, 85, 105, 0.3)'
  },
  breakdownLabel: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center'
  },
  breakdownIcon: {
    fontSize: 16,
    marginRight: 8
  },
  breakdownText: {
    fontSize: 13,
    color: '#CBD5E1'
  },
  breakdownValue: {
    fontSize: 13,
    color: '#94A3B8',
    width: 40,
    textAlign: 'center'
  },
  breakdownBonus: {
    fontSize: 13,
    color: '#10B981',
    width: 50,
    textAlign: 'right'
  },
  detailsButton: {
    backgroundColor: '#6366F1',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20
  },
  detailsButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF'
  }
});

export default ConsciousnessIndexPanel;
