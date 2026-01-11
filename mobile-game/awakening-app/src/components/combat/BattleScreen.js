/**
 * BattleScreen.js
 * Sistema de mini-combate por turnos para resolver crisis
 * Reemplaza la resolución instantánea con gameplay interactivo
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Modal,
  Dimensions
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import soundService from '../../services/SoundService';
import { COLORS } from '../../config/constants';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Tipos de ataques disponibles
const ATTACK_TYPES = {
  CONSCIOUSNESS: {
    name: 'Despertar',
    icon: '🧠',
    color: '#8B5CF6',
    description: 'Eleva la consciencia',
    statKey: 'consciousness'
  },
  ACTION: {
    name: 'Acción',
    icon: '⚡',
    color: '#F59E0B',
    description: 'Actúa con determinación',
    statKey: 'action'
  },
  TECHNIQUE: {
    name: 'Técnica',
    icon: '🔧',
    color: '#3B82F6',
    description: 'Aplica conocimiento',
    statKey: 'technique'
  },
  DEFEND: {
    name: 'Defender',
    icon: '🛡️',
    color: '#10B981',
    description: 'Protege y recupera',
    statKey: null
  }
};

const BattleScreen = ({
  visible,
  being,
  crisis,
  onComplete, // (success: boolean, rewards: object) => void
  onCancel
}) => {
  // Estado de batalla
  const [turn, setTurn] = useState(1);
  const [maxTurns] = useState(5);
  const [playerHP, setPlayerHP] = useState(100);
  const [crisisHP, setCrisisHP] = useState(100);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [battleLog, setBattleLog] = useState([]);
  const [battleEnded, setBattleEnded] = useState(false);
  const [victory, setVictory] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [defenseBonus, setDefenseBonus] = useState(0);

  // Animaciones
  const playerShake = useRef(new Animated.Value(0)).current;
  const crisisShake = useRef(new Animated.Value(0)).current;
  const playerScale = useRef(new Animated.Value(1)).current;
  const crisisScale = useRef(new Animated.Value(1)).current;
  const actionFlash = useRef(new Animated.Value(0)).current;
  const turnIndicator = useRef(new Animated.Value(0)).current;

  // Calcular stats base
  const getBeingStats = useCallback(() => {
    const attrs = being?.attributes || {};
    return {
      consciousness: attrs.consciousness || 30,
      action: attrs.action || 30,
      technique: attrs.technique || 30,
      resilience: attrs.resilience || 30,
      organization: attrs.organization || 30
    };
  }, [being]);

  const getCrisisStats = useCallback(() => {
    const attrs = crisis?.requiredAttributes || {};
    return {
      consciousness: attrs.consciousness || 50,
      action: attrs.action || 50,
      technique: attrs.technique || 50,
      difficulty: crisis?.difficulty || 'medium'
    };
  }, [crisis]);

  // Resetear batalla cuando se abre
  useEffect(() => {
    if (visible) {
      setTurn(1);
      setPlayerHP(100);
      setCrisisHP(100);
      setIsPlayerTurn(true);
      setBattleLog([{ text: '¡La batalla comienza!', type: 'system' }]);
      setBattleEnded(false);
      setVictory(false);
      setSelectedAction(null);
      setDefenseBonus(0);

      // Animación de entrada
      Animated.timing(turnIndicator, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true
      }).start();
    }
  }, [visible]);

  // Verificar fin de batalla
  useEffect(() => {
    if (!visible) return;

    if (crisisHP <= 0) {
      endBattle(true);
    } else if (playerHP <= 0 || turn > maxTurns) {
      endBattle(false);
    }
  }, [playerHP, crisisHP, turn]);

  // Ejecutar acción del jugador
  const executePlayerAction = (attackType) => {
    if (!isPlayerTurn || isAnimating || battleEnded) return;

    setIsAnimating(true);
    setSelectedAction(attackType);
    soundService.play('tap');

    const stats = getBeingStats();
    const crisisStats = getCrisisStats();
    let damage = 0;
    let logMessage = '';

    if (attackType.statKey) {
      // Ataque
      const baseDamage = stats[attackType.statKey] || 30;
      const crisisDefense = crisisStats[attackType.statKey] || 50;
      const effectiveness = Math.max(0.5, Math.min(2, baseDamage / crisisDefense));
      damage = Math.floor(baseDamage * effectiveness * (0.8 + Math.random() * 0.4));

      logMessage = `${attackType.icon} ${being?.name} usa ${attackType.name}! -${damage} HP`;

      // Animación de ataque
      animateAttack(crisisShake, crisisScale, () => {
        setCrisisHP(prev => Math.max(0, prev - damage));
        addBattleLog(logMessage, 'player');
        soundService.play('success');

        // Turno de la crisis
        setTimeout(() => executeCrisisTurn(), 1000);
      });
    } else {
      // Defender
      setDefenseBonus(30);
      const heal = Math.floor(10 + Math.random() * 10);
      setPlayerHP(prev => Math.min(100, prev + heal));
      logMessage = `${attackType.icon} ${being?.name} defiende y recupera +${heal} HP`;

      animateDefend(() => {
        addBattleLog(logMessage, 'player');
        soundService.play('collect');
        setTimeout(() => executeCrisisTurn(), 1000);
      });
    }
  };

  // Turno de la crisis
  const executeCrisisTurn = () => {
    if (battleEnded || crisisHP <= 0) {
      setIsAnimating(false);
      return;
    }

    setIsPlayerTurn(false);

    const crisisStats = getCrisisStats();
    const attackPower = Math.floor(
      (crisisStats.action || 50) * (0.3 + Math.random() * 0.4)
    );
    const actualDamage = Math.max(5, attackPower - defenseBonus);

    // Animación de ataque de crisis
    animateAttack(playerShake, playerScale, () => {
      setPlayerHP(prev => Math.max(0, prev - actualDamage));
      addBattleLog(`🔥 La crisis ataca! -${actualDamage} HP`, 'enemy');
      soundService.play('error');

      setDefenseBonus(0); // Reset defensa
      setTurn(prev => prev + 1);
      setIsPlayerTurn(true);
      setIsAnimating(false);
      setSelectedAction(null);
    });
  };

  // Animación de ataque
  const animateAttack = (shakeAnim, scaleAnim, callback) => {
    Animated.sequence([
      // Flash de acción
      Animated.timing(actionFlash, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true
      }),
      Animated.timing(actionFlash, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true
      }),
      // Shake del objetivo
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true })
      ]),
      // Scale down momentáneo
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 0.9, duration: 100, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, tension: 100, friction: 5, useNativeDriver: true })
      ])
    ]).start(callback);
  };

  // Animación de defensa
  const animateDefend = (callback) => {
    Animated.sequence([
      Animated.timing(playerScale, { toValue: 1.1, duration: 200, useNativeDriver: true }),
      Animated.spring(playerScale, { toValue: 1, tension: 50, friction: 5, useNativeDriver: true })
    ]).start(callback);
  };

  // Añadir mensaje al log
  const addBattleLog = (text, type) => {
    setBattleLog(prev => [...prev.slice(-4), { text, type }]);
  };

  // Finalizar batalla
  const endBattle = (isVictory) => {
    setBattleEnded(true);
    setVictory(isVictory);

    if (isVictory) {
      soundService.playLevelUp();
      addBattleLog('🎉 ¡VICTORIA! Crisis resuelta', 'victory');
    } else {
      soundService.play('error');
      addBattleLog('💔 Derrota... La crisis persiste', 'defeat');
    }

    // Calcular recompensas
    const baseXP = crisis?.rewards?.xp || 50;
    const baseCons = crisis?.rewards?.consciousness || 25;
    const multiplier = isVictory ? 1 : 0.3;

    setTimeout(() => {
      onComplete?.(isVictory, {
        xp: Math.floor(baseXP * multiplier),
        consciousness: Math.floor(baseCons * multiplier),
        turnsUsed: turn
      });
    }, 2000);
  };

  // Renderizar barra de HP
  const renderHPBar = (hp, maxHP, color, label) => (
    <View style={styles.hpContainer}>
      <Text style={styles.hpLabel}>{label}</Text>
      <View style={styles.hpBarBg}>
        <Animated.View
          style={[
            styles.hpBarFill,
            {
              width: `${hp}%`,
              backgroundColor: hp > 50 ? color : hp > 25 ? '#F59E0B' : '#EF4444'
            }
          ]}
        />
      </View>
      <Text style={styles.hpText}>{hp}/{maxHP}</Text>
    </View>
  );

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.container}>
        <LinearGradient
          colors={['#0f0f23', '#1a1a2e', '#16213e']}
          style={StyleSheet.absoluteFill}
        />

        {/* Header con turno */}
        <View style={styles.header}>
          <Text style={styles.turnText}>Turno {turn}/{maxTurns}</Text>
          <Text style={[styles.turnIndicator, { color: isPlayerTurn ? '#10B981' : '#EF4444' }]}>
            {isPlayerTurn ? '🎮 Tu turno' : '⚠️ Turno enemigo'}
          </Text>
        </View>

        {/* Área de batalla */}
        <View style={styles.battleArea}>
          {/* Crisis (enemigo) */}
          <Animated.View
            style={[
              styles.crisisContainer,
              {
                transform: [
                  { translateX: crisisShake },
                  { scale: crisisScale }
                ]
              }
            ]}
          >
            <Text style={styles.crisisIcon}>🔥</Text>
            <Text style={styles.crisisName} numberOfLines={2}>
              {crisis?.title || 'Crisis'}
            </Text>
            {renderHPBar(crisisHP, 100, '#EF4444', 'Crisis')}
          </Animated.View>

          {/* VS */}
          <Animated.Text
            style={[
              styles.vsText,
              { opacity: actionFlash.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) }
            ]}
          >
            ⚔️
          </Animated.Text>

          {/* Jugador (ser) */}
          <Animated.View
            style={[
              styles.playerContainer,
              {
                transform: [
                  { translateX: playerShake },
                  { scale: playerScale }
                ]
              }
            ]}
          >
            <Text style={styles.playerIcon}>🧬</Text>
            <Text style={styles.playerName}>{being?.name || 'Tu Ser'}</Text>
            {renderHPBar(playerHP, 100, '#10B981', 'Ser')}
            {defenseBonus > 0 && (
              <View style={styles.defenseBadge}>
                <Text style={styles.defenseBadgeText}>🛡️ +{defenseBonus}</Text>
              </View>
            )}
          </Animated.View>
        </View>

        {/* Log de batalla */}
        <View style={styles.battleLog}>
          {battleLog.slice(-3).map((log, index) => (
            <Text
              key={index}
              style={[
                styles.logText,
                log.type === 'player' && styles.logPlayer,
                log.type === 'enemy' && styles.logEnemy,
                log.type === 'victory' && styles.logVictory,
                log.type === 'defeat' && styles.logDefeat
              ]}
            >
              {log.text}
            </Text>
          ))}
        </View>

        {/* Acciones */}
        {!battleEnded && isPlayerTurn && !isAnimating && (
          <View style={styles.actionsContainer}>
            <Text style={styles.actionsTitle}>Elige tu acción:</Text>
            <View style={styles.actionsGrid}>
              {Object.values(ATTACK_TYPES).map((attack) => (
                <TouchableOpacity
                  key={attack.name}
                  style={[
                    styles.actionButton,
                    { borderColor: attack.color },
                    selectedAction?.name === attack.name && styles.actionButtonSelected
                  ]}
                  onPress={() => executePlayerAction(attack)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.actionIcon}>{attack.icon}</Text>
                  <Text style={[styles.actionName, { color: attack.color }]}>
                    {attack.name}
                  </Text>
                  <Text style={styles.actionDesc}>{attack.description}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Resultado final */}
        {battleEnded && (
          <View style={styles.resultContainer}>
            <Text style={[styles.resultText, victory ? styles.victoryText : styles.defeatText]}>
              {victory ? '🎉 ¡VICTORIA!' : '💔 Derrota'}
            </Text>
            <Text style={styles.resultSubtext}>
              {victory
                ? 'Has resuelto la crisis exitosamente'
                : 'La crisis persiste, pero ganaste experiencia'}
            </Text>
          </View>
        )}

        {/* Botón de cancelar/salir */}
        {!battleEnded && (
          <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
            <Text style={styles.cancelText}>Huir</Text>
          </TouchableOpacity>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50
  },
  header: {
    alignItems: 'center',
    paddingVertical: 10
  },
  turnText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff'
  },
  turnIndicator: {
    fontSize: 14,
    marginTop: 4
  },
  battleArea: {
    flex: 1,
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20
  },
  crisisContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    width: '80%'
  },
  crisisIcon: {
    fontSize: 60
  },
  crisisName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginVertical: 8
  },
  vsText: {
    fontSize: 40
  },
  playerContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    width: '80%'
  },
  playerIcon: {
    fontSize: 60
  },
  playerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginVertical: 8
  },
  defenseBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12
  },
  defenseBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold'
  },
  hpContainer: {
    width: '100%',
    marginTop: 10
  },
  hpLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4
  },
  hpBarBg: {
    height: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 6,
    overflow: 'hidden'
  },
  hpBarFill: {
    height: '100%',
    borderRadius: 6
  },
  hpText: {
    fontSize: 12,
    color: '#fff',
    textAlign: 'right',
    marginTop: 2
  },
  battleLog: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 10,
    marginHorizontal: 20,
    borderRadius: 8,
    minHeight: 80
  },
  logText: {
    fontSize: 13,
    color: '#9CA3AF',
    marginVertical: 2
  },
  logPlayer: {
    color: '#10B981'
  },
  logEnemy: {
    color: '#EF4444'
  },
  logVictory: {
    color: '#FFD700',
    fontWeight: 'bold'
  },
  logDefeat: {
    color: '#EF4444',
    fontWeight: 'bold'
  },
  actionsContainer: {
    padding: 20
  },
  actionsTitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 10
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  actionButton: {
    width: '48%',
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 10,
    alignItems: 'center'
  },
  actionButtonSelected: {
    backgroundColor: 'rgba(59, 130, 246, 0.3)'
  },
  actionIcon: {
    fontSize: 28
  },
  actionName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 4
  },
  actionDesc: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
    textAlign: 'center'
  },
  resultContainer: {
    alignItems: 'center',
    padding: 30
  },
  resultText: {
    fontSize: 32,
    fontWeight: 'bold'
  },
  victoryText: {
    color: '#FFD700'
  },
  defeatText: {
    color: '#EF4444'
  },
  resultSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 10,
    textAlign: 'center'
  },
  cancelButton: {
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 30,
    marginBottom: 30
  },
  cancelText: {
    color: '#EF4444',
    fontSize: 14
  }
});

export default BattleScreen;
