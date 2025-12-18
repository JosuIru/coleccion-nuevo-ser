/**
 * MISSION SERVICE
 * Sistema completo de misiones para Awakening Protocol
 *
 * Características:
 * - Despliegue de seres a crisis
 * - Cálculo de probabilidad de éxito
 * - Timers en background
 * - Sistema de cooldown y recuperación de energía
 * - Bonificaciones especiales
 * - Persistencia en AsyncStorage
 */

import memoryStorage from '../utils/MemoryStorage';
const AsyncStorage = memoryStorage;
import BackgroundTimer from 'react-native-background-timer';
import PushNotification from 'react-native-push-notification';
import { RESOURCES, ATTRIBUTES } from '../config/constants';
import logger from '../utils/logger';
import rewardService from './RewardService';

// ═══════════════════════════════════════════════════════════
// CONSTANTES DE MISIONES
// ═══════════════════════════════════════════════════════════

const MISSION_CONSTANTS = {
  // Recuperación de energía
  ENERGY_RECOVERY_RATE: 1, // punto de energía cada X minutos
  ENERGY_RECOVERY_INTERVAL_MINUTES: 5,
  LOW_ENERGY_THRESHOLD: 30, // % mínimo para misiones

  // Probabilidades
  MAX_SUCCESS_PROBABILITY: 0.95, // 95% máximo
  MIN_SUCCESS_PROBABILITY: 0.05, // 5% mínimo
  CRITICAL_ATTRIBUTE_PENALTY: 0.15, // -15% por falta de atributo crítico

  // Bonificaciones
  COOPERATIVE_BONUS: 0.50, // +50% recompensas
  FIRST_TIME_BONUS_XP: 100,
  LOCAL_CRISIS_MULTIPLIER: 3.0, // x3 recompensas
  STREAK_MULTIPLIER_PER_MISSION: 0.1, // +10% por misión en racha
  MAX_STREAK_MULTIPLIER: 2.0, // x2 máximo

  // Sinergias especiales (combinaciones de atributos)
  SYNERGIES: {
    'empathy+communication': { name: 'Comunicador Empático', bonus: 0.15 },
    'leadership+strategy': { name: 'Estratega Líder', bonus: 0.20 },
    'creativity+technical': { name: 'Innovador Técnico', bonus: 0.18 },
    'wisdom+consciousness': { name: 'Sabio Consciente', bonus: 0.25 },
    'action+resilience': { name: 'Ejecutor Resiliente', bonus: 0.15 },
    'analysis+organization': { name: 'Analista Organizado', bonus: 0.12 },
    'collaboration+connection': { name: 'Conector Social', bonus: 0.15 }
  },

  // Penalizaciones por fallo
  FAILURE_REWARD_MULTIPLIER: 0.30, // 30% de recompensas en fallo

  // Distancias (para cálculo de tiempo)
  DISTANCE_TIME_MULTIPLIER: 2, // 2 minutos por km
};

class MissionService {
  constructor() {
    this.activeMissionTimers = new Map();
    this.energyRecoveryTimers = new Map();
    this.initialized = false;
  }

  // ═══════════════════════════════════════════════════════════
  // INICIALIZACIÓN
  // ═══════════════════════════════════════════════════════════

  /**
   * Inicializar servicio de misiones
   * - Recuperar misiones activas
   * - Restaurar timers
   * - Iniciar recuperación de energía
   */
  async initialize(userId) {
    if (this.initialized) {
      logger.info('⚠️ MissionService ya inicializado', '');
      return;
    }

    logger.info('🚀 Inicializando MissionService...', '');

    try {
      // Recuperar misiones activas desde AsyncStorage
      await this.recuperarMisionesActivas(userId);

      // Iniciar sistema de recuperación de energía
      await this.iniciarRecuperacionEnergia(userId);

      // Configurar notificaciones
      this.configurarNotificaciones();

      this.initialized = true;
      logger.info('✅ MissionService inicializado correctamente', '');

    } catch (error) {
      logger.error('❌ Error inicializando MissionService:', error);
      throw error;
    }
  }

  /**
   * Configurar sistema de notificaciones
   */
  configurarNotificaciones() {
    PushNotification.configure({
      onNotification: function (notification) {
        console.log('📬 Notificación recibida:', notification);
      },
      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },
      popInitialNotification: true,
      requestPermissions: true,
    });
  }

  // ═══════════════════════════════════════════════════════════
  // DESPLIEGUE DE SERES
  // ═══════════════════════════════════════════════════════════

  /**
   * Desplegar equipo de seres a una crisis
   *
   * @param {string} userId - ID del usuario
   * @param {string} crisisId - ID de la crisis
   * @param {Array<string>} beingIds - IDs de los seres a desplegar
   * @param {Object} gameStore - Store de Zustand para actualizar estado
   * @returns {Object} Resultado del despliegue
   */
  async desplegarSeres(userId, crisisId, beingIds, gameStore) {
    logger.info(`🚀 Desplegando ${beingIds.length} seres a crisis ${crisisId}...`, '');

    try {
      // 1. Validaciones previas
      const validacion = await this.validarDespliegue(userId, crisisId, beingIds, gameStore);

      if (!validacion.valido) {
        logger.warn('⚠️ Validación fallida:', validacion.razon);
        return {
          exito: false,
          error: validacion.razon,
          detalles: validacion.detalles
        };
      }

      const { crisis, seres, usuario, distanciaKm } = validacion;

      // 2. Calcular tiempo de misión
      const tiempoMision = this.calcularTiempoMision(crisis, distanciaKm);

      // 3. Calcular probabilidad de éxito
      const probabilidadCalculo = this.calcularProbabilidadExito(
        crisis.required_attributes || crisis.requiredAttributes,
        seres,
        crisis.crisis_type || crisis.type,
        crisis.scale
      );

      // 4. Consumir energía del usuario
      const energiaCosto = RESOURCES.ENERGY.COST_DEPLOY_BEING * beingIds.length;
      gameStore.consumeEnergy(energiaCosto);

      // 5. Actualizar estado de seres a "deployed"
      beingIds.forEach(beingId => {
        gameStore.updateBeing(beingId, {
          status: 'deployed',
          currentMission: crisisId,
          deployedAt: new Date().toISOString()
        });
      });

      // 6. Crear registro de misión
      const mision = await this.crearMision(
        userId,
        crisisId,
        beingIds,
        probabilidadCalculo,
        tiempoMision,
        crisis,
        seres
      );

      // 7. Iniciar timer de misión
      this.iniciarTimerMision(mision, gameStore);

      // 8. Guardar en AsyncStorage
      await this.guardarMisionActiva(userId, mision);

      logger.info(`✅ Misión creada: ${mision.id}`, '');
      logger.info(`   Probabilidad: ${(probabilidadCalculo.probabilidad * 100).toFixed(1)}%`, '');
      logger.info(`   Duración: ${tiempoMision} minutos`, '');

      return {
        exito: true,
        mision,
        probabilidad: probabilidadCalculo,
        tiempoMinutos: tiempoMision
      };

    } catch (error) {
      logger.error('❌ Error desplegando seres:', error);
      return {
        exito: false,
        error: error.message
      };
    }
  }

  /**
   * Validar que el despliegue sea posible
   */
  async validarDespliegue(userId, crisisId, beingIds, gameStore) {
    const estado = gameStore.getState();

    // Validar que hay seres seleccionados
    if (!beingIds || beingIds.length === 0) {
      return {
        valido: false,
        razon: 'Debes seleccionar al menos un ser'
      };
    }

    // Obtener crisis
    const crisis = [...estado.crises, ...estado.localCrises].find(c => c.id === crisisId);

    if (!crisis) {
      return {
        valido: false,
        razon: 'Crisis no encontrada'
      };
    }

    // Validar que los seres existan y estén disponibles
    const seres = [];

    for (const beingId of beingIds) {
      const ser = estado.beings.find(b => b.id === beingId);

      if (!ser) {
        return {
          valido: false,
          razon: `Ser ${beingId} no encontrado`
        };
      }

      if (ser.status !== 'available') {
        return {
          valido: false,
          razon: `${ser.name} no está disponible (estado: ${ser.status})`
        };
      }

      // Validar energía del ser
      const energiaSer = ser.energy || 100;

      if (energiaSer < MISSION_CONSTANTS.LOW_ENERGY_THRESHOLD) {
        return {
          valido: false,
          razon: `${ser.name} tiene energía muy baja (${energiaSer}%). Necesita descansar.`,
          detalles: { beingId: ser.id, energia: energiaSer }
        };
      }

      seres.push(ser);
    }

    // Validar energía del usuario
    const energiaCosto = RESOURCES.ENERGY.COST_DEPLOY_BEING * beingIds.length;

    if (estado.user.energy < energiaCosto) {
      return {
        valido: false,
        razon: `Energía insuficiente. Necesitas ${energiaCosto}, tienes ${estado.user.energy}`
      };
    }

    // Calcular distancia (si hay ubicación del usuario)
    let distanciaKm = 0;

    if (estado.userLocation && crisis.lat && crisis.lon) {
      distanciaKm = this.calcularDistancia(
        estado.userLocation.latitude,
        estado.userLocation.longitude,
        crisis.lat,
        crisis.lon
      );
    }

    return {
      valido: true,
      crisis,
      seres,
      usuario: estado.user,
      distanciaKm
    };
  }

  /**
   * Calcular tiempo de misión según duración base y distancia
   */
  calcularTiempoMision(crisis, distanciaKm) {
    const duracionBase = crisis.duration_minutes || crisis.durationMinutes || 60;
    const tiempoViaje = Math.round(distanciaKm * MISSION_CONSTANTS.DISTANCE_TIME_MULTIPLIER);

    return duracionBase + tiempoViaje;
  }

  /**
   * Crear objeto de misión
   */
  async crearMision(userId, crisisId, beingIds, probabilidadCalculo, tiempoMinutos, crisis, seres) {
    const ahora = new Date();
    const finalizacion = new Date(ahora.getTime() + tiempoMinutos * 60 * 1000);

    // Calcular atributos del equipo
    const atributosEquipo = this.calcularAtributosEquipo(seres);

    return {
      id: this.generarIdMision(),
      userId,
      crisisId,
      beingIds,

      // Información de la crisis
      crisisData: {
        title: crisis.title,
        type: crisis.crisis_type || crisis.type,
        scale: crisis.scale,
        urgency: crisis.urgency
      },

      // Equipo desplegado
      teamData: {
        beingNames: seres.map(s => s.name),
        teamAttributes: atributosEquipo,
        teamSize: seres.length
      },

      // Cálculos
      successProbability: probabilidadCalculo.probabilidad,
      probabilityDetails: probabilidadCalculo,

      // Timing
      startedAt: ahora.toISOString(),
      endsAt: finalizacion.toISOString(),
      durationMinutes: tiempoMinutos,

      // Estado
      completed: false,
      success: null,

      // Recompensas (se calculan al completar)
      baseRewards: crisis.rewards,
      earnedRewards: null,

      // Metadata
      isCooperative: false,
      isLocal: crisis.scale === 'local'
    };
  }

  // ═══════════════════════════════════════════════════════════
  // CÁLCULO DE PROBABILIDAD DE ÉXITO
  // ═══════════════════════════════════════════════════════════

  /**
   * Calcular probabilidad de éxito de una misión
   *
   * @param {Object} atributosRequeridos - Atributos que requiere la crisis
   * @param {Array} seres - Seres desplegados
   * @param {string} tipoCrisis - Tipo de crisis
   * @param {string} escala - Escala de la crisis
   * @returns {Object} Detalles de probabilidad
   */
  calcularProbabilidadExito(atributosRequeridos, seres, tipoCrisis, escala) {
    logger.info('🎲 Calculando probabilidad de éxito...', '');

    // 1. Sumar atributos del equipo
    const atributosEquipo = this.calcularAtributosEquipo(seres);

    // 2. Calcular ratio base (atributos equipo / atributos requeridos)
    const ratioBase = this.calcularRatioAtributos(atributosEquipo, atributosRequeridos);

    // 3. Detectar sinergias
    const sinergias = this.detectarSinergias(atributosEquipo);
    const bonusSinergia = sinergias.reduce((acc, s) => acc + s.bonus, 0);

    // 4. Penalización por atributos críticos faltantes
    const atributosCriticos = this.obtenerAtributosCriticos(tipoCrisis);
    const penalizacionCriticos = this.calcularPenalizacionCriticos(
      atributosEquipo,
      atributosRequeridos,
      atributosCriticos
    );

    // 5. Bonus por cantidad de seres (trabajo en equipo)
    const bonusEquipo = this.calcularBonusEquipo(seres.length);

    // 6. Calcular probabilidad final
    let probabilidadFinal = ratioBase + bonusSinergia + bonusEquipo - penalizacionCriticos;

    // 7. Aplicar límites (5% - 95%)
    probabilidadFinal = Math.max(
      MISSION_CONSTANTS.MIN_SUCCESS_PROBABILITY,
      Math.min(MISSION_CONSTANTS.MAX_SUCCESS_PROBABILITY, probabilidadFinal)
    );

    const detalles = {
      probabilidad: probabilidadFinal,
      ratioBase,
      bonusSinergia,
      bonusEquipo,
      penalizacionCriticos,
      sinergias,
      atributosEquipo,
      atributosRequeridos,
      desglose: {
        'Ratio Base': `${(ratioBase * 100).toFixed(1)}%`,
        'Sinergias': sinergias.length > 0 ? `+${(bonusSinergia * 100).toFixed(1)}%` : 'Ninguna',
        'Trabajo en Equipo': `+${(bonusEquipo * 100).toFixed(1)}%`,
        'Penalizaciones': penalizacionCriticos > 0 ? `-${(penalizacionCriticos * 100).toFixed(1)}%` : 'Ninguna',
        'TOTAL': `${(probabilidadFinal * 100).toFixed(1)}%`
      }
    };

    console.log('✅ Probabilidad calculada:', detalles.desglose);

    return detalles;
  }

  /**
   * Calcular suma de atributos del equipo
   */
  calcularAtributosEquipo(seres) {
    const atributos = {};

    for (const ser of seres) {
      const atributosSer = ser.attributes || {};

      for (const [atributo, valor] of Object.entries(atributosSer)) {
        atributos[atributo] = (atributos[atributo] || 0) + (valor || 0);
      }
    }

    return atributos;
  }

  /**
   * Calcular ratio: atributos_equipo / atributos_requeridos
   */
  calcularRatioAtributos(atributosEquipo, atributosRequeridos) {
    let totalRequerido = 0;
    let totalEquipo = 0;

    for (const [atributo, valorRequerido] of Object.entries(atributosRequeridos)) {
      totalRequerido += valorRequerido;
      totalEquipo += atributosEquipo[atributo] || 0;
    }

    if (totalRequerido === 0) return 0.5; // Default si no hay requisitos

    const ratio = totalEquipo / totalRequerido;

    // Convertir a probabilidad con curva suave
    // ratio 0.5 = 25% prob, ratio 1.0 = 50%, ratio 1.5 = 70%, ratio 2.0+ = 85%
    return Math.min(0.85, 0.25 + (ratio * 0.3));
  }

  /**
   * Detectar sinergias entre atributos del equipo
   */
  detectarSinergias(atributosEquipo) {
    const sinergias = [];

    for (const [combinacion, datos] of Object.entries(MISSION_CONSTANTS.SYNERGIES)) {
      const [attr1, attr2] = combinacion.split('+');

      // Verificar que ambos atributos estén presentes con valor significativo
      if ((atributosEquipo[attr1] || 0) >= 30 && (atributosEquipo[attr2] || 0) >= 30) {
        sinergias.push({
          name: datos.name,
          bonus: datos.bonus,
          attributes: [attr1, attr2]
        });
      }
    }

    return sinergias;
  }

  /**
   * Obtener atributos críticos según tipo de crisis
   */
  obtenerAtributosCriticos(tipoCrisis) {
    const criticosPorTipo = {
      environmental: ['consciousness', 'action', 'organization'],
      social: ['empathy', 'communication', 'collaboration'],
      economic: ['analysis', 'strategy', 'organization'],
      humanitarian: ['empathy', 'action', 'resilience'],
      educational: ['wisdom', 'communication', 'creativity'],
      health: ['empathy', 'organization', 'technical'],
      infrastructure: ['technical', 'organization', 'strategy']
    };

    return criticosPorTipo[tipoCrisis] || [];
  }

  /**
   * Calcular penalización por falta de atributos críticos
   */
  calcularPenalizacionCriticos(atributosEquipo, atributosRequeridos, atributosCriticos) {
    let penalizacion = 0;

    for (const atributoCritico of atributosCriticos) {
      const requerido = atributosRequeridos[atributoCritico] || 0;
      const disponible = atributosEquipo[atributoCritico] || 0;

      // Si falta un atributo crítico
      if (requerido > 0 && disponible < requerido * 0.5) {
        penalizacion += MISSION_CONSTANTS.CRITICAL_ATTRIBUTE_PENALTY;
      }
    }

    return penalizacion;
  }

  /**
   * Bonus por trabajo en equipo (más seres = mejor coordinación)
   */
  calcularBonusEquipo(cantidadSeres) {
    // 1 ser: 0%, 2 seres: +2%, 3 seres: +4%, 4+ seres: +5%
    if (cantidadSeres === 1) return 0;
    if (cantidadSeres === 2) return 0.02;
    if (cantidadSeres === 3) return 0.04;
    return 0.05;
  }

  // ═══════════════════════════════════════════════════════════
  // TIMERS Y BACKGROUND PROCESSING
  // ═══════════════════════════════════════════════════════════

  /**
   * Iniciar timer para una misión activa
   */
  iniciarTimerMision(mision, gameStore) {
    const tiempoRestanteMs = new Date(mision.endsAt).getTime() - Date.now();

    if (tiempoRestanteMs <= 0) {
      // Ya expiró, resolver inmediatamente
      this.resolverMision(mision.id, gameStore);
      return;
    }

    logger.info(`⏱️  Timer iniciado para misión ${mision.id} (${Math.round(tiempoRestanteMs / 60000)} min)`, '');

    // Usar BackgroundTimer para que continúe aunque la app esté cerrada
    const timerId = BackgroundTimer.setTimeout(() => {
      logger.info(`⏰ Misión ${mision.id} completada!`, '');
      this.resolverMision(mision.id, gameStore);
    }, tiempoRestanteMs);

    this.activeMissionTimers.set(mision.id, timerId);
  }

  /**
   * Recuperar misiones activas al iniciar la app
   */
  async recuperarMisionesActivas(userId) {
    try {
      const misionesKey = `active_missions_${userId}`;
      const stored = await AsyncStorage.getItem(misionesKey);

      if (!stored) {
        logger.info('No hay misiones activas guardadas', '');
        return [];
      }

      const misiones = JSON.parse(stored);
      logger.info(`📥 Recuperadas ${misiones.length} misiones activas`, '');

      return misiones;

    } catch (error) {
      logger.error('❌ Error recuperando misiones:', error);
      return [];
    }
  }

  /**
   * Guardar misión activa en AsyncStorage
   */
  async guardarMisionActiva(userId, mision) {
    try {
      const misionesKey = `active_missions_${userId}`;
      const stored = await AsyncStorage.getItem(misionesKey);
      const misiones = stored ? JSON.parse(stored) : [];

      // Agregar nueva misión
      misiones.push(mision);

      await AsyncStorage.setItem(misionesKey, JSON.stringify(misiones));
      logger.info(`💾 Misión ${mision.id} guardada`, '');

    } catch (error) {
      logger.error('❌ Error guardando misión:', error);
    }
  }

  /**
   * Remover misión activa de AsyncStorage
   */
  async removerMisionActiva(userId, misionId) {
    try {
      const misionesKey = `active_missions_${userId}`;
      const stored = await AsyncStorage.getItem(misionesKey);

      if (!stored) return;

      const misiones = JSON.parse(stored);
      const misionesFiltradas = misiones.filter(m => m.id !== misionId);

      await AsyncStorage.setItem(misionesKey, JSON.stringify(misionesFiltradas));
      logger.info(`🗑️  Misión ${misionId} removida`, '');

    } catch (error) {
      logger.error('❌ Error removiendo misión:', error);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // RESOLUCIÓN DE MISIONES
  // ═══════════════════════════════════════════════════════════

  /**
   * Resolver una misión (calcular éxito/fallo y dar recompensas)
   */
  async resolverMision(misionId, gameStore) {
    logger.info(`🎯 Resolviendo misión ${misionId}...`, '');

    try {
      // Obtener estado actual
      const estado = gameStore.getState();
      const userId = estado.user.id;

      // Buscar misión en AsyncStorage
      const misionesKey = `active_missions_${userId}`;
      const stored = await AsyncStorage.getItem(misionesKey);

      if (!stored) {
        console.error('No hay misiones guardadas');
        return;
      }

      const misiones = JSON.parse(stored);
      const mision = misiones.find(m => m.id === misionId);

      if (!mision) {
        console.error(`Misión ${misionId} no encontrada`);
        return;
      }

      // 1. Roll de éxito (random vs probabilidad)
      const roll = Math.random();
      const exito = roll <= mision.successProbability;

      logger.info(`🎲 Roll: ${(roll * 100).toFixed(1)}% vs Probabilidad: ${(mision.successProbability * 100).toFixed(1)}%`, '');
      console.log(exito ? '✅ ¡ÉXITO!' : '❌ FALLO');

      // 2. Calcular recompensas
      const recompensas = await this.calcularRecompensas(mision, exito, userId, gameStore);

      // 3. Aplicar recompensas
      this.aplicarRecompensas(recompensas, gameStore);

      // 4. Devolver seres a estado disponible
      this.devolverSeres(mision.beingIds, gameStore);

      // 5. Guardar en historial
      await this.guardarEnHistorial(userId, {
        ...mision,
        completed: true,
        success: exito,
        earnedRewards: recompensas,
        completedAt: new Date().toISOString(),
        rollValue: roll
      });

      // 6. Remover de misiones activas
      await this.removerMisionActiva(userId, misionId);

      // 7. Limpiar timer
      if (this.activeMissionTimers.has(misionId)) {
        BackgroundTimer.clearTimeout(this.activeMissionTimers.get(misionId));
        this.activeMissionTimers.delete(misionId);
      }

      // 8. Enviar notificación
      this.enviarNotificacionMisionCompletada(mision, exito, recompensas);

      logger.info('✅ Misión resuelta correctamente', '');

      return {
        exito,
        recompensas,
        mision
      };

    } catch (error) {
      logger.error('❌ Error resolviendo misión:', error);
      throw error;
    }
  }

  /**
   * Calcular recompensas según resultado
   */
  async calcularRecompensas(mision, exito, userId, gameStore) {
    const recompensasBase = mision.baseRewards || {};
    let multiplicador = exito ? 1.0 : MISSION_CONSTANTS.FAILURE_REWARD_MULTIPLIER;

    // Bonus por misión cooperativa
    if (mision.isCooperative) {
      multiplicador *= (1 + MISSION_CONSTANTS.COOPERATIVE_BONUS);
      logger.info(`🤝 Bonus cooperativo: +${MISSION_CONSTANTS.COOPERATIVE_BONUS * 100}%`, '');
    }

    // Bonus por crisis local
    if (mision.isLocal) {
      multiplicador *= MISSION_CONSTANTS.LOCAL_CRISIS_MULTIPLIER;
      logger.info(`📍 Bonus local: x${MISSION_CONSTANTS.LOCAL_CRISIS_MULTIPLIER}`, '');
    }

    // Bonus por racha (streak)
    const racha = await this.obtenerRacha(userId);
    if (racha > 0 && exito) {
      const bonusRacha = Math.min(
        racha * MISSION_CONSTANTS.STREAK_MULTIPLIER_PER_MISSION,
        MISSION_CONSTANTS.MAX_STREAK_MULTIPLIER - 1
      );
      multiplicador *= (1 + bonusRacha);
      logger.info(`🔥 Racha de ${racha} misiones: +${(bonusRacha * 100).toFixed(0)}%`, '');
    }

    // Bonus por primera vez resolviendo este tipo de crisis
    const esPrimeraVez = await this.esPrimeraVezTipoCrisis(userId, mision.crisisData.type);
    let bonusXPExtra = 0;

    if (esPrimeraVez && exito) {
      bonusXPExtra = MISSION_CONSTANTS.FIRST_TIME_BONUS_XP;
      logger.info(`⭐ Primera vez resolviendo crisis ${mision.crisisData.type}: +${bonusXPExtra} XP`, '');
    }

    // Calcular recompensas finales
    const recompensas = {
      xp: Math.round((recompensasBase.xp || 0) * multiplicador + bonusXPExtra),
      consciousness: Math.round((recompensasBase.consciousness || 0) * multiplicador),
      energy: Math.round((recompensasBase.energy || 0) * multiplicador),
      multiplicadorAplicado: multiplicador,
      bonuses: {
        cooperative: mision.isCooperative,
        local: mision.isLocal,
        streak: racha,
        firstTime: esPrimeraVez
      },
      // Nuevas recompensas: seres y piezas
      pieces: [],
      being: null,
      community: null
    };

    // Generar recompensas de seres/piezas usando RewardService
    if (exito) {
      const estado = gameStore.getState();
      const deployedBeings = mision.beingIds
        .map(id => estado.beings.find(b => b.id === id))
        .filter(Boolean);

      const performance = rewardService.calculatePerformance(mision.crisisData, deployedBeings);

      const specialRewards = rewardService.generateRewards(mision.crisisData, performance);

      // Añadir piezas (siempre se dan al menos algunas)
      recompensas.pieces = specialRewards.pieces || [];

      // Ser desbloqueado (raro)
      if (specialRewards.being) {
        recompensas.being = specialRewards.being;
        logger.info(`🧬 ¡SER DESBLOQUEADO! ${specialRewards.being.name}`, '');
      }

      // Comunidad desbloqueada (muy raro)
      if (specialRewards.community) {
        recompensas.community = specialRewards.community;
        logger.info(`🏛️ ¡COMUNIDAD DESBLOQUEADA! ${specialRewards.community.name}`, '');
      }
    }

    console.log('💰 Recompensas calculadas:', recompensas);

    return recompensas;
  }

  /**
   * Aplicar recompensas al usuario
   */
  aplicarRecompensas(recompensas, gameStore) {
    const state = gameStore.getState();

    // Recompensas básicas
    if (recompensas.xp > 0) {
      state.addXP(recompensas.xp);
    }

    if (recompensas.consciousness > 0) {
      state.addConsciousness(recompensas.consciousness);
    }

    if (recompensas.energy > 0) {
      state.addEnergy(recompensas.energy);
    }

    // Piezas/Fragmentos para el Laboratorio
    if (recompensas.pieces && recompensas.pieces.length > 0) {
      state.addPieces(recompensas.pieces);
      logger.info(`🧩 +${recompensas.pieces.length} fragmentos obtenidos`, '');
    }

    // Ser desbloqueado
    if (recompensas.being) {
      const newBeing = {
        id: `awakened_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        ...recompensas.being,
        currentMission: null,
        createdAt: new Date().toISOString()
      };
      state.addBeing(newBeing);
      logger.info(`🧬 ¡Nuevo ser añadido: ${newBeing.name}!`, '');
    }

    // Comunidad desbloqueada
    if (recompensas.community) {
      state.addCommunity(recompensas.community);
      logger.info(`🏛️ ¡Nueva comunidad desbloqueada: ${recompensas.community.name}!`, '');
    }

    logger.info(`✅ Recompensas aplicadas: +${recompensas.xp} XP, +${recompensas.consciousness} consciencia, +${recompensas.energy} energía`, '');
  }

  /**
   * Devolver seres a estado disponible (o resting si tienen baja energía)
   */
  devolverSeres(beingIds, gameStore) {
    beingIds.forEach(beingId => {
      const estado = gameStore.getState();
      const ser = estado.beings.find(b => b.id === beingId);

      if (!ser) return;

      // Reducir energía del ser por haber completado misión
      const nuevaEnergia = Math.max(0, (ser.energy || 100) - 20);

      // Si energía < 30%, poner en resting
      const nuevoEstado = nuevaEnergia < MISSION_CONSTANTS.LOW_ENERGY_THRESHOLD ? 'resting' : 'available';

      gameStore.updateBeing(beingId, {
        status: nuevoEstado,
        currentMission: null,
        energy: nuevaEnergia,
        deployedAt: null
      });

      logger.info(`🔙 ${ser.name} devuelto (${nuevoEstado}, ${nuevaEnergia}% energía)`, '');

      // Si está en resting, iniciar recuperación
      if (nuevoEstado === 'resting') {
        this.iniciarRecuperacionSer(beingId, gameStore);
      }
    });
  }

  // ═══════════════════════════════════════════════════════════
  // SISTEMA DE COOLDOWN Y RECUPERACIÓN
  // ═══════════════════════════════════════════════════════════

  /**
   * Iniciar sistema de recuperación de energía para todos los seres
   */
  async iniciarRecuperacionEnergia(userId) {
    logger.info('⚡ Iniciando sistema de recuperación de energía...', '');

    // Intervalo cada 5 minutos
    const intervaloMs = MISSION_CONSTANTS.ENERGY_RECOVERY_INTERVAL_MINUTES * 60 * 1000;

    BackgroundTimer.runBackgroundTimer(() => {
      this.recuperarEnergiaSeres(userId);
    }, intervaloMs);
  }

  /**
   * Recuperar energía de seres en resting
   */
  async recuperarEnergiaSeres(userId) {
    try {
      const gameStore = require('../stores/gameStore').default;
      const estado = gameStore.getState();

      const seresEnResting = estado.beings.filter(b => b.status === 'resting');

      if (seresEnResting.length === 0) return;

      logger.info(`⚡ Recuperando energía de ${seresEnResting.length} seres...`, '');

      seresEnResting.forEach(ser => {
        const energiaActual = ser.energy || 0;
        const nuevaEnergia = Math.min(100, energiaActual + MISSION_CONSTANTS.ENERGY_RECOVERY_RATE);

        gameStore.updateBeing(ser.id, { energy: nuevaEnergia });

        // Si llegó a 100%, cambiar a available
        if (nuevaEnergia >= 100) {
          gameStore.updateBeing(ser.id, { status: 'available' });
          logger.info(`✅ ${ser.name} recuperado completamente`, '');

          // Enviar notificación
          this.enviarNotificacionSerRecuperado(ser);
        }
      });

    } catch (error) {
      logger.error('❌ Error recuperando energía:', error);
    }
  }

  /**
   * Iniciar recuperación de un ser específico
   */
  iniciarRecuperacionSer(beingId, gameStore) {
    // La recuperación global ya maneja esto
    logger.info(`💤 ${beingId} entrando en período de descanso`, '');
  }

  // ═══════════════════════════════════════════════════════════
  // HISTORIAL Y ESTADÍSTICAS
  // ═══════════════════════════════════════════════════════════

  /**
   * Guardar misión completada en historial
   */
  async guardarEnHistorial(userId, misionCompletada) {
    try {
      const historialKey = `mission_history_${userId}`;
      const stored = await AsyncStorage.getItem(historialKey);
      const historial = stored ? JSON.parse(stored) : [];

      // Agregar al inicio (más recientes primero)
      historial.unshift(misionCompletada);

      // Limitar a últimas 100 misiones
      const historialLimitado = historial.slice(0, 100);

      await AsyncStorage.setItem(historialKey, JSON.stringify(historialLimitado));

      // Actualizar racha si fue exitosa
      if (misionCompletada.success) {
        await this.incrementarRacha(userId);
      } else {
        await this.resetearRacha(userId);
      }

      logger.info('📚 Misión guardada en historial', '');

    } catch (error) {
      logger.error('❌ Error guardando en historial:', error);
    }
  }

  /**
   * Obtener racha actual de misiones exitosas
   */
  async obtenerRacha(userId) {
    try {
      const rachaKey = `mission_streak_${userId}`;
      const stored = await AsyncStorage.getItem(rachaKey);
      return stored ? parseInt(stored, 10) : 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Incrementar racha
   */
  async incrementarRacha(userId) {
    const rachaActual = await this.obtenerRacha(userId);
    const nuevaRacha = rachaActual + 1;
    await AsyncStorage.setItem(`mission_streak_${userId}`, nuevaRacha.toString());
    logger.info(`🔥 Racha: ${nuevaRacha} misiones exitosas`, '');
  }

  /**
   * Resetear racha
   */
  async resetearRacha(userId) {
    await AsyncStorage.setItem(`mission_streak_${userId}`, '0');
    logger.info('💔 Racha reseteada', '');
  }

  /**
   * Verificar si es primera vez resolviendo este tipo de crisis
   */
  async esPrimeraVezTipoCrisis(userId, tipoCrisis) {
    try {
      const historialKey = `mission_history_${userId}`;
      const stored = await AsyncStorage.getItem(historialKey);

      if (!stored) return true;

      const historial = JSON.parse(stored);
      const yaResuelta = historial.some(
        m => m.success && m.crisisData.type === tipoCrisis
      );

      return !yaResuelta;

    } catch (error) {
      return true;
    }
  }

  // ═══════════════════════════════════════════════════════════
  // NOTIFICACIONES
  // ═══════════════════════════════════════════════════════════

  /**
   * Enviar notificación cuando misión completa
   */
  enviarNotificacionMisionCompletada(mision, exito, recompensas) {
    let titulo = exito ? '✅ ¡Misión Exitosa!' : '❌ Misión Fallida';
    let mensaje = '';

    if (exito) {
      mensaje = `Has resuelto "${mision.crisisData.title}".\n+${recompensas.xp} XP`;

      // Añadir info de piezas
      if (recompensas.pieces && recompensas.pieces.length > 0) {
        mensaje += `\n🧩 +${recompensas.pieces.length} fragmentos`;
      }

      // ¡Ser desbloqueado!
      if (recompensas.being) {
        titulo = '🧬 ¡NUEVO SER DESPERTADO!';
        mensaje = `"${recompensas.being.name}" se ha unido a tu colección tras resolver "${mision.crisisData.title}"`;
      }

      // ¡Comunidad desbloqueada!
      if (recompensas.community) {
        titulo = '🏛️ ¡COMUNIDAD DESBLOQUEADA!';
        mensaje = `"${recompensas.community.name}" - ${recompensas.community.beings?.length || 0} seres esperan ser activados`;
      }
    } else {
      mensaje = `La misión "${mision.crisisData.title}" no tuvo éxito, pero ganaste algo de experiencia.`;
    }

    PushNotification.localNotification({
      title: titulo,
      message: mensaje,
      playSound: true,
      soundName: 'default',
      importance: 'high',
      vibrate: true,
      vibration: 300,
    });
  }

  /**
   * Enviar notificación cuando ser se recupera
   */
  enviarNotificacionSerRecuperado(ser) {
    PushNotification.localNotification({
      title: '⚡ Ser Recuperado',
      message: `${ser.name} ha recuperado toda su energía y está listo para nuevas misiones.`,
      playSound: false,
      importance: 'low',
    });
  }

  // ═══════════════════════════════════════════════════════════
  // UTILIDADES
  // ═══════════════════════════════════════════════════════════

  /**
   * Calcular distancia entre dos coordenadas (fórmula Haversine)
   */
  calcularDistancia(lat1, lon1, lat2, lon2) {
    const radioTierraKm = 6371;
    const dLat = this.gradosARadianes(lat2 - lat1);
    const dLon = this.gradosARadianes(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.gradosARadianes(lat1)) *
        Math.cos(this.gradosARadianes(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distancia = radioTierraKm * c;

    return distancia;
  }

  gradosARadianes(grados) {
    return grados * (Math.PI / 180);
  }

  /**
   * Generar ID único para misión
   */
  generarIdMision() {
    return `mission_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Obtener todas las misiones activas del usuario
   */
  async obtenerMisionesActivas(userId) {
    return await this.recuperarMisionesActivas(userId);
  }

  /**
   * Obtener misiones activas (método sincrónico con caché)
   * Para uso en componentes que necesitan acceso inmediato
   */
  getActiveMissions() {
    // Retorna misiones en caché o array vacío
    return this._cachedActiveMissions || [];
  }

  /**
   * Obtener cantidad de misiones completadas
   */
  getCompletedMissionsCount() {
    return this._cachedCompletedCount || 0;
  }

  /**
   * Cargar datos en caché (llamar desde componentes)
   */
  async loadCachedData(userId) {
    try {
      const misiones = await this.recuperarMisionesActivas(userId);

      // Calcular tiempo transcurrido para cada misión
      const ahora = Date.now();
      this._cachedActiveMissions = misiones.map(mision => ({
        ...mision,
        elapsed_minutes: Math.floor((ahora - new Date(mision.startedAt).getTime()) / 60000),
        crisis_title: mision.crisisData?.title || 'Crisis',
        crisis_type: mision.crisisData?.type || 'unknown',
        being_id: mision.beingIds?.[0] || null,
        success_probability: mision.successProbability || 0.5,
        estimated_xp_reward: mision.baseRewards?.xp || 0,
        estimated_consciousness_reward: mision.baseRewards?.consciousness || 0,
        population_affected: 1000,
        urgency: mision.crisisData?.urgency || 5
      }));

      // Obtener historial para contar completadas
      const historial = await this.obtenerHistorial(userId);
      this._cachedCompletedCount = historial.length;

      return this._cachedActiveMissions;
    } catch (error) {
      logger.error('Error loading cached data:', error);
      return [];
    }
  }

  /**
   * Cancelar una misión activa
   */
  async cancelMission(missionId, gameStore) {
    logger.info(`🚫 Cancelando misión ${missionId}...`, '');

    try {
      const estado = gameStore ? gameStore.getState() : null;
      const userId = estado?.user?.id;

      if (!userId) {
        logger.error('No se puede cancelar: userId no encontrado');
        return { exito: false, error: 'Usuario no encontrado' };
      }

      // Buscar misión
      const misionesKey = `active_missions_${userId}`;
      const stored = await AsyncStorage.getItem(misionesKey);

      if (!stored) {
        return { exito: false, error: 'No hay misiones activas' };
      }

      const misiones = JSON.parse(stored);
      const mision = misiones.find(m => m.id === missionId);

      if (!mision) {
        return { exito: false, error: 'Misión no encontrada' };
      }

      // Devolver seres a estado disponible
      if (gameStore && mision.beingIds) {
        mision.beingIds.forEach(beingId => {
          gameStore.updateBeing(beingId, {
            status: 'available',
            currentMission: null
          });
        });
      }

      // Limpiar timer si existe
      if (this.activeMissionTimers.has(missionId)) {
        BackgroundTimer.clearTimeout(this.activeMissionTimers.get(missionId));
        this.activeMissionTimers.delete(missionId);
      }

      // Remover de misiones activas
      await this.removerMisionActiva(userId, missionId);

      // Actualizar caché
      await this.loadCachedData(userId);

      logger.info('✅ Misión cancelada correctamente', '');

      return { exito: true };

    } catch (error) {
      logger.error('❌ Error cancelando misión:', error);
      return { exito: false, error: error.message };
    }
  }

  /**
   * Obtener historial de misiones
   */
  async obtenerHistorial(userId, limite = 20) {
    try {
      const historialKey = `mission_history_${userId}`;
      const stored = await AsyncStorage.getItem(historialKey);

      if (!stored) return [];

      const historial = JSON.parse(stored);
      return historial.slice(0, limite);

    } catch (error) {
      logger.error('❌ Error obteniendo historial:', error);
      return [];
    }
  }

  /**
   * Obtener estadísticas del jugador
   */
  async obtenerEstadisticas(userId) {
    try {
      const historial = await this.obtenerHistorial(userId, 1000);
      const racha = await this.obtenerRacha(userId);

      const misionesCompletadas = historial.length;
      const misionesExitosas = historial.filter(m => m.success).length;
      const misionesFallidas = historial.filter(m => !m.success).length;
      const tasaExito = misionesCompletadas > 0
        ? (misionesExitosas / misionesCompletadas * 100).toFixed(1)
        : 0;

      // XP total ganado
      const xpTotal = historial.reduce((acc, m) => acc + (m.earnedRewards?.xp || 0), 0);

      // Tipos de crisis resueltas
      const tiposCrisis = {};
      historial.forEach(m => {
        const tipo = m.crisisData.type;
        tiposCrisis[tipo] = (tiposCrisis[tipo] || 0) + 1;
      });

      return {
        misionesCompletadas,
        misionesExitosas,
        misionesFallidas,
        tasaExito: parseFloat(tasaExito),
        rachaActual: racha,
        xpTotalGanado: xpTotal,
        tiposCrisisResueltas: tiposCrisis,
        promedioRecompensas: misionesCompletadas > 0
          ? Math.round(xpTotal / misionesCompletadas)
          : 0
      };

    } catch (error) {
      logger.error('❌ Error obteniendo estadísticas:', error);
      return null;
    }
  }

  /**
   * Cleanup al cerrar app
   */
  cleanup() {
    // Detener todos los timers
    this.activeMissionTimers.forEach(timerId => {
      BackgroundTimer.clearTimeout(timerId);
    });
    this.activeMissionTimers.clear();

    BackgroundTimer.stopBackgroundTimer();

    logger.info('🧹 MissionService limpiado', '');
  }
}

// ═══════════════════════════════════════════════════════════
// EXPORTAR SINGLETON
// ═══════════════════════════════════════════════════════════

export default new MissionService();

// ═══════════════════════════════════════════════════════════
// FUNCIONES DE TESTING
// ═══════════════════════════════════════════════════════════

export const testingHelpers = {
  /**
   * Simular resolución inmediata de misión (para testing)
   */
  async resolverMisionInmediata(misionId, gameStore) {
    const service = new MissionService();
    return await service.resolverMision(misionId, gameStore);
  },

  /**
   * Crear misión de prueba
   */
  crearMisionPrueba(userId, beingIds = ['being1', 'being2']) {
    const service = new MissionService();

    const crisisPrueba = {
      id: 'crisis_test',
      title: 'Crisis de Prueba',
      type: 'environmental',
      scale: 'local',
      urgency: 5,
      required_attributes: { empathy: 50, action: 60 },
      rewards: { xp: 100, consciousness: 30, energy: 10 },
      duration_minutes: 30,
      lat: 40.4168,
      lon: -3.7038
    };

    const seresPrueba = beingIds.map(id => ({
      id,
      name: `Ser ${id}`,
      attributes: { empathy: 40, action: 50, creativity: 30 },
      energy: 100,
      status: 'available'
    }));

    return service.crearMision(
      userId,
      crisisPrueba.id,
      beingIds,
      { probabilidad: 0.65, ratioBase: 0.5, bonusSinergia: 0.1, bonusEquipo: 0.05, penalizacionCriticos: 0 },
      30,
      crisisPrueba,
      seresPrueba
    );
  },

  /**
   * Resetear todos los datos de misiones (para testing)
   */
  async resetearDatosMisiones(userId) {
    await AsyncStorage.removeItem(`active_missions_${userId}`);
    await AsyncStorage.removeItem(`mission_history_${userId}`);
    await AsyncStorage.removeItem(`mission_streak_${userId}`);
    logger.info('🔄 Datos de misiones reseteados', '');
  },

  /**
   * Log detallado de cálculo de probabilidad
   */
  testCalculoProbabilidad() {
    const service = new MissionService();

    const atributosRequeridos = {
      empathy: 60,
      organization: 70,
      action: 50
    };

    const seres = [
      {
        id: '1',
        name: 'Ser Empático',
        attributes: { empathy: 80, communication: 60, creativity: 40 }
      },
      {
        id: '2',
        name: 'Ser Organizador',
        attributes: { organization: 90, strategy: 70, analysis: 50 }
      }
    ];

    const resultado = service.calcularProbabilidadExito(
      atributosRequeridos,
      seres,
      'social',
      'regional'
    );

    logger.info('═══════════════════════════════════════', '');
    logger.info('TEST: CÁLCULO DE PROBABILIDAD', '');
    logger.info('═══════════════════════════════════════', '');
    console.log('Atributos Requeridos:', atributosRequeridos);
    console.log('Seres desplegados:', seres.length);
    console.log('\nResultado:', JSON.stringify(resultado, null, 2));
    logger.info('═══════════════════════════════════════', '');

    return resultado;
  }
};
