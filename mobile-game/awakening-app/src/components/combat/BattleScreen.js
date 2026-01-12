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
  Dimensions,
  Alert
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import soundService from '../../services/SoundService';
import { COLORS } from '../../config/constants';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Acciones basadas en las 5 Premisas del Nuevo Ser
const ATTACK_TYPES = {
  // Premisa 1: Abundancia vs Escasez
  ABUNDANCE: {
    name: 'Abundancia',
    icon: '🌊',
    color: '#22C55E',
    description: 'Transforma la escasez en abundancia compartida',
    statKey: 'empathy',
    premise: 'abundance',
    effectText: 'genera recursos compartidos'
  },
  // Premisa 2: Valor Intrínseco vs Valor Instrumental
  INTRINSIC: {
    name: 'Valor Intrínseco',
    icon: '💎',
    color: '#8B5CF6',
    description: 'Revela el valor inherente de cada ser',
    statKey: 'consciousness',
    premise: 'intrinsic_value',
    effectText: 'reconoce la dignidad de todo'
  },
  // Premisa 3: Unidad vs Separación
  UNITY: {
    name: 'Unidad',
    icon: '🔗',
    color: '#06B6D4',
    description: 'Conecta lo que parecía separado',
    statKey: 'connection',
    premise: 'unity',
    effectText: 'crea puentes de entendimiento'
  },
  // Premisa 4: Presencia vs Tiempo Lineal
  PRESENCE: {
    name: 'Presencia',
    icon: '⏳',
    color: '#F59E0B',
    description: 'Actúa desde el ahora eterno',
    statKey: 'reflection',
    premise: 'presence',
    effectText: 'disuelve la urgencia ilusoria'
  },
  // Acción de defensa/sanación
  REGENERATE: {
    name: 'Regenerar',
    icon: '🌱',
    color: '#10B981',
    description: 'Sana y fortalece desde la raíz',
    statKey: null,
    premise: 'creativity',
    effectText: 'regenera lo dañado'
  }
};

const BattleScreen = ({
  visible,
  being,
  crisis,
  onComplete, // (success: boolean, rewards: object) => void
  onCancel
}) => {
  // Calcular HP máximo basado en stats del ser y dificultad de la crisis
  const calculateMaxHP = useCallback(() => {
    const beingLevel = being?.level || 1;
    const beingResilience = being?.attributes?.resilience || 30;
    // HP base: 80 + nivel*5 + resiliencia/2
    const playerMaxHP = Math.floor(80 + beingLevel * 5 + beingResilience / 2);

    // HP de crisis basado en dificultad y escala
    const difficultyMultiplier = {
      easy: 0.7,
      medium: 1.0,
      hard: 1.3,
      extreme: 1.6
    };
    const scaleMultiplier = {
      local: 0.8,
      regional: 1.0,
      nacional: 1.2,
      global: 1.5
    };
    const baseCrisisHP = 100;
    const diff = difficultyMultiplier[crisis?.difficulty] || 1.0;
    const scale = scaleMultiplier[crisis?.scale] || 1.0;
    const crisisMaxHP = Math.floor(baseCrisisHP * diff * scale);

    return { playerMaxHP, crisisMaxHP };
  }, [being, crisis]);

  // Calcular turnos máximos según dificultad
  const calculateMaxTurns = useCallback(() => {
    const difficultyTurns = {
      easy: 6,
      medium: 5,
      hard: 4,
      extreme: 3
    };
    return difficultyTurns[crisis?.difficulty] || 5;
  }, [crisis]);

  const { playerMaxHP, crisisMaxHP } = calculateMaxHP();
  const calculatedMaxTurns = calculateMaxTurns();

  // Estado de batalla
  const [turn, setTurn] = useState(1);
  const [maxTurns] = useState(calculatedMaxTurns);
  const [playerHP, setPlayerHP] = useState(playerMaxHP);
  const [crisisHP, setCrisisHP] = useState(crisisMaxHP);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [battleLog, setBattleLog] = useState([]);
  const [battleEnded, setBattleEnded] = useState(false);
  const [victory, setVictory] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [defenseBonus, setDefenseBonus] = useState(0);
  const [turnsUsed, setTurnsUsed] = useState(0);

  // Animaciones
  const playerShake = useRef(new Animated.Value(0)).current;
  const crisisShake = useRef(new Animated.Value(0)).current;
  const playerScale = useRef(new Animated.Value(1)).current;
  const crisisScale = useRef(new Animated.Value(1)).current;
  const actionFlash = useRef(new Animated.Value(0)).current;
  const turnIndicator = useRef(new Animated.Value(0)).current;

  // Calcular stats base del ser (incluye nivel)
  const getBeingStats = useCallback(() => {
    const attrs = being?.attributes || {};
    const level = being?.level || 1;
    // Bonus por nivel: +10% por nivel
    const levelBonus = 1 + (level - 1) * 0.1;
    return {
      consciousness: Math.floor((attrs.consciousness || 30) * levelBonus),
      action: Math.floor((attrs.action || 30) * levelBonus),
      technique: Math.floor((attrs.technique || 30) * levelBonus),
      resilience: Math.floor((attrs.resilience || 30) * levelBonus),
      organization: Math.floor((attrs.organization || 30) * levelBonus),
      empathy: Math.floor((attrs.empathy || 30) * levelBonus),
      connection: Math.floor((attrs.connection || 30) * levelBonus),
      reflection: Math.floor((attrs.reflection || 30) * levelBonus),
      level: level
    };
  }, [being]);

  const getCrisisStats = useCallback(() => {
    const attrs = crisis?.requiredAttributes || {};
    const difficultyBonus = {
      easy: 0.8,
      medium: 1.0,
      hard: 1.3,
      extreme: 1.6
    };
    const bonus = difficultyBonus[crisis?.difficulty] || 1.0;
    return {
      consciousness: Math.floor((attrs.consciousness || 50) * bonus),
      action: Math.floor((attrs.action || 50) * bonus),
      technique: Math.floor((attrs.technique || 50) * bonus),
      difficulty: crisis?.difficulty || 'medium',
      scale: crisis?.scale || 'local'
    };
  }, [crisis]);

  // Resetear batalla cuando se abre
  useEffect(() => {
    if (visible) {
      const { playerMaxHP: newPlayerHP, crisisMaxHP: newCrisisHP } = calculateMaxHP();
      setTurn(1);
      setTurnsUsed(0);
      setPlayerHP(newPlayerHP);
      setCrisisHP(newCrisisHP);
      setIsPlayerTurn(true);
      setBattleLog([{
        text: `¡Batalla iniciada! ${being?.name || 'Tu Ser'} (Nv.${being?.level || 1}) vs ${crisis?.title || 'Crisis'}`,
        type: 'system'
      }]);
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
  }, [visible, calculateMaxHP, being, crisis]);

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
    setTurnsUsed(prev => prev + 1);
    soundService.play('tap');

    const stats = getBeingStats();
    const crisisStats = getCrisisStats();
    let damage = 0;
    let logMessage = '';

    if (attackType.statKey) {
      // Ataque basado en premisa del Nuevo Ser
      const baseStat = stats[attackType.statKey] || 30;
      const levelBonus = stats.level || 1;
      const crisisDefense = crisisStats[attackType.statKey] || 50;

      // Daño = (stat del ser * bonus de nivel) vs defensa de crisis
      // Mínimo 50% efectividad, máximo 200%
      const effectiveness = Math.max(0.5, Math.min(2, baseStat / crisisDefense));

      // Daño base + bonus por nivel + variación aleatoria
      const baseDamage = baseStat * effectiveness;
      const levelDamageBonus = levelBonus * 2; // +2 daño por nivel
      const randomMultiplier = 0.85 + Math.random() * 0.3; // 85%-115%

      damage = Math.floor((baseDamage + levelDamageBonus) * randomMultiplier);

      // Crítico si el stat es muy superior (25% chance si stat > defensa * 1.5)
      const isCritical = baseStat > crisisDefense * 1.5 && Math.random() < 0.25;
      if (isCritical) {
        damage = Math.floor(damage * 1.5);
        logMessage = `💥 ¡CRÍTICO! ${attackType.icon} ${being?.name} ${attackType.effectText}! -${damage}`;
      } else {
        logMessage = `${attackType.icon} ${being?.name} ${attackType.effectText}! -${damage}`;
      }

      // Animación de ataque
      animateAttack(crisisShake, crisisScale, () => {
        setCrisisHP(prev => Math.max(0, prev - damage));
        addBattleLog(logMessage, isCritical ? 'critical' : 'player');
        soundService.play('success');

        // Turno de la crisis
        setTimeout(() => executeCrisisTurn(), 1000);
      });
    } else {
      // Regenerar (sanación basada en resiliencia + organización)
      const resilience = stats.resilience || 30;
      const organization = stats.organization || 30;

      // Defensa escala con resiliencia
      const scaledDefense = Math.floor(20 + resilience / 3);
      setDefenseBonus(scaledDefense);

      // Sanación escala con organización
      const baseHeal = 10 + organization / 4;
      const heal = Math.floor(baseHeal + Math.random() * 10);

      setPlayerHP(prev => Math.min(playerMaxHP, prev + heal));
      logMessage = `${attackType.icon} ${being?.name} ${attackType.effectText}. +${heal} HP, +🛡️${scaledDefense}`;

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

    const stats = getBeingStats();
    const crisisStats = getCrisisStats();

    // Daño de crisis escala con dificultad
    const difficultyDamage = {
      easy: 0.6,
      medium: 0.8,
      hard: 1.0,
      extreme: 1.3
    };
    const diffMult = difficultyDamage[crisisStats.difficulty] || 0.8;

    const baseAttack = (crisisStats.action || 50) * diffMult;
    const attackPower = Math.floor(baseAttack * (0.7 + Math.random() * 0.3));

    // Reducción por resiliencia del ser
    const resilienceReduction = Math.floor(stats.resilience / 10);
    const actualDamage = Math.max(5, attackPower - defenseBonus - resilienceReduction);

    // Animación de ataque de crisis
    animateAttack(playerShake, playerScale, () => {
      setPlayerHP(prev => Math.max(0, prev - actualDamage));

      const blockText = defenseBonus > 0 ? ` (bloqueado: ${defenseBonus + resilienceReduction})` : '';
      addBattleLog(`🔥 La crisis ataca! -${actualDamage} HP${blockText}`, 'enemy');
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

    // Calcular bonus por rendimiento
    const difficultyBonus = {
      easy: 1.0,
      medium: 1.2,
      hard: 1.5,
      extreme: 2.0
    };
    const diffMult = difficultyBonus[crisis?.difficulty] || 1.0;

    // Bonus por velocidad (menos turnos = más bonus)
    const speedBonus = isVictory ? Math.max(1, 1.5 - (turnsUsed * 0.1)) : 1;

    // Bonus por HP restante
    const hpRatio = playerHP / playerMaxHP;
    const survivalBonus = isVictory ? (1 + hpRatio * 0.3) : 1;

    if (isVictory) {
      soundService.playLevelUp();
      const bonusText = speedBonus > 1.2 ? ' ¡Victoria rápida!' : (survivalBonus > 1.2 ? ' ¡Victoria dominante!' : '');
      addBattleLog(`🎉 ¡VICTORIA! Crisis resuelta${bonusText}`, 'victory');
    } else {
      soundService.play('error');
      addBattleLog('💔 Derrota... La crisis persiste', 'defeat');
    }

    // Calcular recompensas con todos los bonus
    const baseXP = crisis?.rewards?.xp || 50;
    const baseCons = crisis?.rewards?.consciousness || 25;
    const baseMultiplier = isVictory ? 1 : 0.3;
    const totalMultiplier = baseMultiplier * diffMult * speedBonus * survivalBonus;

    setTimeout(() => {
      onComplete?.(isVictory, {
        xp: Math.floor(baseXP * totalMultiplier),
        consciousness: Math.floor(baseCons * totalMultiplier),
        turnsUsed: turnsUsed,
        bonuses: {
          difficulty: diffMult,
          speed: speedBonus,
          survival: survivalBonus
        }
      });
    }, 2000);
  };

  // Renderizar barra de HP con porcentaje dinámico
  const renderHPBar = (hp, maxHP, color, label) => {
    const hpPercent = Math.max(0, Math.min(100, (hp / maxHP) * 100));
    return (
      <View style={styles.hpContainer}>
        <Text style={styles.hpLabel}>{label}</Text>
        <View style={styles.hpBarBg}>
          <Animated.View
            style={[
              styles.hpBarFill,
              {
                width: `${hpPercent}%`,
                backgroundColor: hpPercent > 50 ? color : hpPercent > 25 ? '#F59E0B' : '#EF4444'
              }
            ]}
          />
        </View>
        <Text style={styles.hpText}>{hp}/{maxHP}</Text>
      </View>
    );
  };

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
              {crisis?.title || crisis?.name || 'Crisis'}
            </Text>
            {renderHPBar(crisisHP, crisisMaxHP, '#EF4444', 'Crisis')}
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
            {renderHPBar(playerHP, playerMaxHP, '#10B981', `Ser Nv.${being?.level || 1}`)}
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
                log.type === 'defeat' && styles.logDefeat,
                log.type === 'critical' && styles.logCritical
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
  logCritical: {
    color: '#F59E0B',
    fontWeight: 'bold',
    fontSize: 14
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
