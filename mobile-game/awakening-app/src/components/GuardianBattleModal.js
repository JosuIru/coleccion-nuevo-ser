/**
 * GuardianBattleModal - Modal para batallas contra los Guardianes del Viejo Ser
 *
 * FASE 2: Sistema de Guardianes
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Animated
} from 'react-native';

const GuardianBattleModal = ({
  visible,
  battle,
  guardian: guardianProp, // Puede venir por separado
  onAction, // Renombrado para coincidir con CommandCenterScreen
  onFlee,
  onClose,
  playerBeings = [],
  newPremises = []
}) => {
  const [selectedAction, setSelectedAction] = useState(null);
  const [animating, setAnimating] = useState(false);
  const [lastLog, setLastLog] = useState(null);
  const [shakeAnim] = useState(new Animated.Value(0));
  const [error, setError] = useState(null);

  useEffect(() => {
    if (battle?.log?.length > 0) {
      setLastLog(battle.log[battle.log.length - 1]);
    }
  }, [battle?.log]);

  const triggerShake = useCallback(() => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true })
    ]).start();
  }, [shakeAnim]);

  const handleAction = async (actionType, details = {}) => {
    if (animating || battle?.phase !== 'player') return;

    setAnimating(true);
    setSelectedAction(actionType);
    setError(null);

    try {
      const result = await onAction?.(actionType, details);

      if (result?.guardianAttack) {
        triggerShake();
      }

      if (result?.error) {
        setError(result.error);
      }
    } catch (err) {
      setError('Error al ejecutar acción');
      console.error('Guardian battle action error:', err);
    } finally {
      setAnimating(false);
      setSelectedAction(null);
    }
  };

  // Obtener guardian de battle o del prop directo
  const guardian = battle?.guardian || guardianProp;

  if (!visible || !guardian) return null;

  // Calcular salud con valores por defecto seguros
  const currentHealth = guardian.currentHealth ?? guardian.stats?.health ?? 100;
  const maxHealth = guardian.stats?.health ?? 100;
  const healthPercentage = Math.max(0, Math.min(100, (currentHealth / maxHealth) * 100));
  const isPlayerTurn = battle.phase === 'player';

  const renderHealthBar = () => (
    <View style={styles.healthBarContainer}>
      <View style={styles.healthBarBackground}>
        <View
          style={[
            styles.healthBarFill,
            {
              width: `${healthPercentage}%`,
              backgroundColor: healthPercentage > 50 ? '#EF4444' : healthPercentage > 25 ? '#F59E0B' : '#DC2626'
            }
          ]}
        />
      </View>
      <Text style={styles.healthText}>
        {currentHealth} / {maxHealth}
      </Text>
    </View>
  );

  const renderGuardian = () => (
    <Animated.View
      style={[
        styles.guardianContainer,
        { transform: [{ translateX: shakeAnim }] }
      ]}
    >
      <View style={[styles.guardianAvatar, { backgroundColor: guardian.color + '30' }]}>
        <Text style={styles.guardianEmoji}>{guardian.avatar}</Text>
      </View>
      <Text style={styles.guardianName}>{guardian.name}</Text>
      <Text style={styles.guardianTitle}>{guardian.title}</Text>
      {renderHealthBar()}

      {/* Premisas que defiende */}
      <View style={styles.premisesContainer}>
        <Text style={styles.premisesLabel}>Defiende:</Text>
        <View style={styles.premisesTags}>
          {guardian.premises.map((premise, idx) => (
            <View key={idx} style={styles.premiseTag}>
              <Text style={styles.premiseText}>
                {premise.replace('_', ' ')}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </Animated.View>
  );

  const renderBattleLog = () => (
    <View style={styles.logContainer}>
      {lastLog && (
        <View style={[
          styles.logEntry,
          lastLog.type === 'guardian_action' ? styles.logEntryEnemy : styles.logEntryPlayer
        ]}>
          <Text style={styles.logMessage}>{lastLog.message}</Text>
          {lastLog.damage > 0 && (
            <Text style={[
              styles.logDamage,
              lastLog.type === 'guardian_action' ? styles.damageEnemy : styles.damagePlayer
            ]}>
              -{lastLog.damage}
            </Text>
          )}
        </View>
      )}
    </View>
  );

  const renderActions = () => (
    <View style={styles.actionsContainer}>
      <Text style={styles.actionsTitle}>
        {isPlayerTurn ? 'Tu turno - Elige acción:' : 'Turno del Guardián...'}
      </Text>

      {isPlayerTurn && (
        <View style={styles.actionButtons}>
          {/* Ataque básico */}
          <TouchableOpacity
            style={[styles.actionButton, styles.actionAttack]}
            onPress={() => handleAction('attack')}
            disabled={animating}
          >
            <Text style={styles.actionEmoji}>⚔️</Text>
            <Text style={styles.actionName}>Atacar</Text>
            <Text style={styles.actionDesc}>Daño básico</Text>
          </TouchableOpacity>

          {/* Explotar debilidad */}
          {battle.weaknessBonus?.exploited?.length > 0 && (
            <TouchableOpacity
              style={[styles.actionButton, styles.actionExploit]}
              onPress={() => handleAction('exploit_weakness', {
                weakness: battle.weaknessBonus.exploited[0]
              })}
              disabled={animating}
            >
              <Text style={styles.actionEmoji}>🎯</Text>
              <Text style={styles.actionName}>Explotar</Text>
              <Text style={styles.actionDesc}>+{Math.round((battle.weaknessBonus.damageMultiplier - 1) * 100)}% daño</Text>
            </TouchableOpacity>
          )}

          {/* Usar premisa */}
          {newPremises.length > 0 && (
            <TouchableOpacity
              style={[styles.actionButton, styles.actionPremise]}
              onPress={() => handleAction('use_premise', { premiseId: newPremises[0]?.id })}
              disabled={animating}
            >
              <Text style={styles.actionEmoji}>✨</Text>
              <Text style={styles.actionName}>Premisa</Text>
              <Text style={styles.actionDesc}>Poder especial</Text>
            </TouchableOpacity>
          )}

          {/* Curar */}
          <TouchableOpacity
            style={[styles.actionButton, styles.actionHeal]}
            onPress={() => handleAction('heal')}
            disabled={animating}
          >
            <Text style={styles.actionEmoji}>💚</Text>
            <Text style={styles.actionName}>Sanar</Text>
            <Text style={styles.actionDesc}>Recupera HP</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderTeam = () => (
    <View style={styles.teamContainer}>
      <Text style={styles.teamLabel}>Tu equipo:</Text>
      <View style={styles.teamBeings}>
        {battle.team?.slice(0, 4).map((being, idx) => (
          <View key={idx} style={styles.teamBeing}>
            <Text style={styles.teamBeingAvatar}>{being.avatar || '👤'}</Text>
            <Text style={styles.teamBeingName}>{being.name?.substring(0, 8)}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderWeaknessInfo = () => {
    if (!battle.weaknessBonus || battle.weaknessBonus.exploited.length === 0) return null;

    return (
      <View style={styles.weaknessInfo}>
        <Text style={styles.weaknessTitle}>Debilidades detectadas:</Text>
        <View style={styles.weaknessList}>
          {battle.weaknessBonus.exploited.map((weakness, idx) => (
            <View key={idx} style={styles.weaknessItem}>
              <Text style={styles.weaknessIcon}>🎯</Text>
              <Text style={styles.weaknessText}>{weakness.replace('_', ' ')}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.weaknessBonus}>{battle.weaknessBonus.description}</Text>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onFlee}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { borderColor: guardian.color + '50' }]}>
          {/* Header */}
          <View style={[styles.header, { backgroundColor: (guardian.color || '#EF4444') + '20' }]}>
            <View style={styles.headerInfo}>
              <Text style={styles.headerTitle}>BATALLA</Text>
              <Text style={styles.turnInfo}>Turno {battle?.turn || 1}</Text>
            </View>
            <TouchableOpacity style={styles.fleeButton} onPress={onFlee}>
              <Text style={styles.fleeText}>Huir</Text>
            </TouchableOpacity>
          </View>

          {/* Error display */}
          {error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
            </View>
          )}

          {/* Loading indicator */}
          {animating && (
            <View style={styles.loadingBanner}>
              <Text style={styles.loadingText}>⏳ Ejecutando acción...</Text>
            </View>
          )}

          <ScrollView style={styles.content}>
            {/* Guardián */}
            {renderGuardian()}

            {/* Info de debilidades */}
            {renderWeaknessInfo()}

            {/* Log de batalla */}
            {renderBattleLog()}

            {/* Equipo del jugador */}
            {renderTeam()}

            {/* Acciones */}
            {renderActions()}
          </ScrollView>

          {/* Stats del guardián */}
          <View style={styles.statsBar}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>POW</Text>
              <Text style={styles.statValue}>{guardian.stats?.power ?? '?'}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>DEF</Text>
              <Text style={styles.statValue}>{guardian.stats?.defense ?? '?'}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>SPD</Text>
              <Text style={styles.statValue}>{guardian.stats?.speed ?? '?'}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Daño Total</Text>
              <Text style={styles.statValue}>{battle?.damage?.toGuardian || 0}</Text>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ============================================================================
// ESTILOS
// ============================================================================

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContainer: {
    width: '95%',
    maxHeight: '90%',
    backgroundColor: '#0F172A',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16
  },
  headerInfo: {
    flex: 1
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F8FAFC'
  },
  turnInfo: {
    fontSize: 14,
    color: '#94A3B8'
  },
  fleeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.5)'
  },
  fleeText: {
    color: '#EF4444',
    fontWeight: '600'
  },
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(239, 68, 68, 0.5)'
  },
  errorText: {
    color: '#EF4444',
    textAlign: 'center',
    fontWeight: '600'
  },
  loadingBanner: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(59, 130, 246, 0.5)'
  },
  loadingText: {
    color: '#3B82F6',
    textAlign: 'center',
    fontWeight: '500'
  },
  content: {
    flex: 1,
    padding: 16
  },
  guardianContainer: {
    alignItems: 'center',
    marginBottom: 20
  },
  guardianAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12
  },
  guardianEmoji: {
    fontSize: 48
  },
  guardianName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F8FAFC'
  },
  guardianTitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 12
  },
  healthBarContainer: {
    width: '100%',
    alignItems: 'center'
  },
  healthBarBackground: {
    width: '80%',
    height: 20,
    backgroundColor: 'rgba(51, 65, 85, 0.5)',
    borderRadius: 10,
    overflow: 'hidden'
  },
  healthBarFill: {
    height: '100%',
    borderRadius: 10
  },
  healthText: {
    marginTop: 4,
    fontSize: 12,
    color: '#94A3B8'
  },
  premisesContainer: {
    marginTop: 16,
    alignItems: 'center'
  },
  premisesLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 6
  },
  premisesTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6
  },
  premiseTag: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12
  },
  premiseText: {
    fontSize: 11,
    color: '#F87171',
    textTransform: 'capitalize'
  },
  weaknessInfo: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)'
  },
  weaknessTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#10B981',
    marginBottom: 8
  },
  weaknessList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  weaknessItem: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  weaknessIcon: {
    marginRight: 4
  },
  weaknessText: {
    fontSize: 12,
    color: '#34D399',
    textTransform: 'capitalize'
  },
  weaknessBonus: {
    marginTop: 8,
    fontSize: 11,
    color: '#6EE7B7',
    fontStyle: 'italic'
  },
  logContainer: {
    minHeight: 50,
    marginBottom: 16
  },
  logEntry: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10
  },
  logEntryPlayer: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)'
  },
  logEntryEnemy: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)'
  },
  logMessage: {
    flex: 1,
    fontSize: 13,
    color: '#E2E8F0'
  },
  logDamage: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8
  },
  damagePlayer: {
    color: '#10B981'
  },
  damageEnemy: {
    color: '#EF4444'
  },
  teamContainer: {
    marginBottom: 16
  },
  teamLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 8
  },
  teamBeings: {
    flexDirection: 'row',
    gap: 12
  },
  teamBeing: {
    alignItems: 'center'
  },
  teamBeingAvatar: {
    fontSize: 24,
    marginBottom: 4
  },
  teamBeingName: {
    fontSize: 10,
    color: '#94A3B8'
  },
  actionsContainer: {
    marginBottom: 16
  },
  actionsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#F8FAFC',
    marginBottom: 12
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  actionButton: {
    width: '47%',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center'
  },
  actionAttack: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)'
  },
  actionExploit: {
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.4)'
  },
  actionPremise: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.4)'
  },
  actionHeal: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)'
  },
  actionEmoji: {
    fontSize: 24,
    marginBottom: 4
  },
  actionName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#F8FAFC'
  },
  actionDesc: {
    fontSize: 10,
    color: '#94A3B8'
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 12,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(71, 85, 105, 0.3)'
  },
  statItem: {
    alignItems: 'center'
  },
  statLabel: {
    fontSize: 10,
    color: '#64748B'
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#F8FAFC'
  }
});

export default GuardianBattleModal;
