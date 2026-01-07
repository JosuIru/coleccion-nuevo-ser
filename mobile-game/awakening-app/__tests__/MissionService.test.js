/**
 * MISSION SERVICE TESTS
 * Unit tests for mission deployment and resolution
 *
 * Coverage:
 * - Being deployment to crises
 * - Success probability calculation
 * - Mission resolution
 * - Cooldown management
 * - Rewards calculation
 * - Edge cases
 */

import { CRISIS_TYPES, ATTRIBUTES } from '../src/config/constants';

/**
 * MISSION SERVICE
 * This service would handle mission logic
 * Creating it here for testing purposes
 */
class MisionService {
  /**
   * Calcular probabilidad de éxito de una misión
   * @param {Object} ser - El ser desplegado
   * @param {Object} crisis - La crisis a resolver
   * @returns {number} Probabilidad de 0-100
   */
  calcularProbabilidadExito(ser, crisis) {
    if (!ser || !crisis) {
      throw new Error('Ser y crisis son requeridos');
    }

    // Atributos requeridos según tipo de crisis
    const atributosRequeridos = {
      environmental: ['consciousness', 'action', 'technical'],
      social: ['empathy', 'communication', 'leadership'],
      economic: ['strategy', 'organization', 'analysis'],
      humanitarian: ['empathy', 'action', 'resilience'],
      educational: ['reflection', 'communication', 'wisdom'],
      health: ['empathy', 'technical', 'resilience'],
      infrastructure: ['technical', 'organization', 'strategy']
    };

    const atributos = atributosRequeridos[crisis.type] || [];

    // Calcular puntuación promedio de atributos relevantes
    let puntuacionTotal = 0;
    let atributosContados = 0;

    atributos.forEach(atributo => {
      if (ser.attributes && ser.attributes[atributo] !== undefined) {
        puntuacionTotal += ser.attributes[atributo];
        atributosContados++;
      }
    });

    if (atributosContados === 0) {
      return 30; // Probabilidad base si no hay atributos
    }

    const promedioAtributos = puntuacionTotal / atributosContados;

    // Ajustar por severidad de la crisis
    const ajustePorSeveridad = {
      low: 1.2,
      medium: 1.0,
      high: 0.8,
      critical: 0.6
    };

    const multiplicador = ajustePorSeveridad[crisis.severity] || 1.0;

    // Probabilidad final (capped entre 10-95%)
    const probabilidad = Math.min(95, Math.max(10, promedioAtributos * multiplicador));

    return Math.round(probabilidad);
  }

  /**
   * Desplegar un ser a una crisis
   * @param {Object} ser - El ser a desplegar
   * @param {Object} crisis - La crisis objetivo
   * @param {number} energiaDisponible - Energía disponible del jugador
   * @returns {Object} Resultado del despliegue
   */
  desplegarSer(ser, crisis, energiaDisponible) {
    const costoDepliegue = 10;

    // Validaciones
    if (!ser) {
      return { success: false, error: 'Ser no encontrado' };
    }

    if (ser.status === 'deployed') {
      return { success: false, error: 'Ser ya está desplegado' };
    }

    if (energiaDisponible < costoDepliegue) {
      return { success: false, error: 'Energía insuficiente' };
    }

    if (!crisis) {
      return { success: false, error: 'Crisis no encontrada' };
    }

    // Calcular probabilidad de éxito
    const probabilidadExito = this.calcularProbabilidadExito(ser, crisis);

    // Calcular tiempo de misión (basado en severidad)
    const tiemposMision = {
      low: 5 * 60 * 1000, // 5 minutos
      medium: 15 * 60 * 1000, // 15 minutos
      high: 30 * 60 * 1000, // 30 minutos
      critical: 60 * 60 * 1000 // 1 hora
    };

    const duracion = tiemposMision[crisis.severity] || 15 * 60 * 1000;
    const tiempoCompletado = Date.now() + duracion;

    return {
      success: true,
      mision: {
        id: `mission-${Date.now()}`,
        beingId: ser.id,
        crisisId: crisis.id,
        successProbability: probabilidadExito,
        startedAt: Date.now(),
        completesAt: tiempoCompletado,
        status: 'active'
      },
      energiaCosumida: costoDepliegue
    };
  }

  /**
   * Resolver una misión (cuando se completa el tiempo)
   * @param {Object} mision - La misión a resolver
   * @param {Object} ser - El ser desplegado
   * @param {Object} crisis - La crisis
   * @returns {Object} Resultado de la misión
   */
  resolverMision(mision, ser, crisis) {
    if (Date.now() < mision.completesAt) {
      return {
        success: false,
        error: 'La misión aún no ha terminado'
      };
    }

    // Determinar éxito basado en probabilidad
    const exitoso = Math.random() * 100 < mision.successProbability;

    // Calcular recompensas
    let recompensas = { xp: 0, consciousness: 0, energy: 0 };

    if (exitoso) {
      const multiplicadorSeveridad = {
        low: 1,
        medium: 1.5,
        high: 2,
        critical: 3
      };

      const multiplicador = multiplicadorSeveridad[crisis.severity] || 1;

      recompensas = {
        xp: Math.round(50 * multiplicador),
        consciousness: Math.round(25 * multiplicador),
        energy: Math.round(10 * multiplicador)
      };

      // Bonus si probabilidad era baja
      if (mision.successProbability < 50) {
        recompensas.consciousness += 20;
      }
    }

    return {
      success: true,
      misionExitosa: exitoso,
      recompensas,
      mensaje: exitoso
        ? `¡Misión completada! Crisis ${crisis.type} resuelta.`
        : 'La misión no tuvo éxito. El ser regresa sin haber resuelto la crisis.'
    };
  }

  /**
   * Verificar si un ser está en cooldown
   * @param {Object} ser - El ser a verificar
   * @returns {Object} Estado de cooldown
   */
  verificarCooldown(ser) {
    if (!ser.cooldownUntil) {
      return { enCooldown: false };
    }

    const tiempoRestante = ser.cooldownUntil - Date.now();

    if (tiempoRestante <= 0) {
      return { enCooldown: false };
    }

    return {
      enCooldown: true,
      tiempoRestante, // en ms
      minutos: Math.ceil(tiempoRestante / (60 * 1000))
    };
  }

  /**
   * Aplicar cooldown a un ser después de una misión
   * @param {Object} ser - El ser
   * @param {boolean} exitoso - Si la misión fue exitosa
   * @returns {number} Timestamp de fin de cooldown
   */
  aplicarCooldown(ser, exitoso) {
    // Cooldown menor si la misión fue exitosa
    const duracionCooldown = exitoso ? 10 * 60 * 1000 : 20 * 60 * 1000; // 10 o 20 minutos

    return Date.now() + duracionCooldown;
  }
}

const misionService = new MisionService();

describe('MissionService', () => {
  // ═══════════════════════════════════════════════════════════
  // TESTS DE CÁLCULO DE PROBABILIDAD
  // ═══════════════════════════════════════════════════════════

  describe('calcularProbabilidadExito', () => {
    test('should calculate high success probability for matching attributes', () => {
      const ser = {
        id: 'being-1',
        name: 'Empathetic Being',
        attributes: {
          empathy: 90,
          communication: 85,
          leadership: 80
        }
      };

      const crisis = {
        id: 'crisis-1',
        type: 'social',
        severity: 'medium'
      };

      const probabilidad = misionService.calcularProbabilidadExito(ser, crisis);

      expect(probabilidad).toBeGreaterThan(70);
      expect(probabilidad).toBeLessThanOrEqual(95);
    });

    test('should calculate lower probability for high severity crisis', () => {
      const ser = {
        id: 'being-1',
        attributes: {
          empathy: 70,
          communication: 70,
          leadership: 70
        }
      };

      const crisisFacil = {
        id: 'crisis-easy',
        type: 'social',
        severity: 'low'
      };

      const crisisDificil = {
        id: 'crisis-hard',
        type: 'social',
        severity: 'critical'
      };

      const probFacil = misionService.calcularProbabilidadExito(ser, crisisFacil);
      const probDificil = misionService.calcularProbabilidadExito(ser, crisisDificil);

      expect(probFacil).toBeGreaterThan(probDificil);
    });

    test('should return base probability if being has no relevant attributes', () => {
      const ser = {
        id: 'being-1',
        attributes: {
          creativity: 80, // Not relevant for social crisis
          action: 75
        }
      };

      const crisis = {
        id: 'crisis-1',
        type: 'social',
        severity: 'medium'
      };

      const probabilidad = misionService.calcularProbabilidadExito(ser, crisis);

      expect(probabilidad).toBe(30); // Base probability
    });

    test('should cap probability at 95% maximum', () => {
      const ser = {
        id: 'being-1',
        attributes: {
          empathy: 100,
          communication: 100,
          leadership: 100
        }
      };

      const crisis = {
        id: 'crisis-1',
        type: 'social',
        severity: 'low' // Easy crisis with multiplier 1.2
      };

      const probabilidad = misionService.calcularProbabilidadExito(ser, crisis);

      expect(probabilidad).toBe(95); // Capped
    });

    test('should ensure minimum probability of 10%', () => {
      const ser = {
        id: 'being-1',
        attributes: {
          empathy: 5,
          communication: 5,
          leadership: 5
        }
      };

      const crisis = {
        id: 'crisis-1',
        type: 'social',
        severity: 'critical' // Hard crisis
      };

      const probabilidad = misionService.calcularProbabilidadExito(ser, crisis);

      expect(probabilidad).toBeGreaterThanOrEqual(10);
    });

    test('should throw error if being or crisis is missing', () => {
      expect(() => {
        misionService.calcularProbabilidadExito(null, { type: 'social' });
      }).toThrow('Ser y crisis son requeridos');

      expect(() => {
        misionService.calcularProbabilidadExito({ id: 'being-1' }, null);
      }).toThrow('Ser y crisis son requeridos');
    });

    test('should handle all crisis types correctly', () => {
      const ser = {
        id: 'being-1',
        attributes: {
          consciousness: 80,
          action: 75,
          technical: 70,
          empathy: 85,
          communication: 80,
          leadership: 75,
          strategy: 70,
          organization: 65,
          analysis: 70,
          resilience: 75,
          reflection: 80,
          wisdom: 75
        }
      };

      const tiposCrisis = Object.keys(CRISIS_TYPES);

      tiposCrisis.forEach(tipo => {
        const crisis = { id: 'crisis-test', type: tipo, severity: 'medium' };
        const probabilidad = misionService.calcularProbabilidadExito(ser, crisis);

        expect(probabilidad).toBeGreaterThanOrEqual(10);
        expect(probabilidad).toBeLessThanOrEqual(95);
      });
    });
  });

  // ═══════════════════════════════════════════════════════════
  // TESTS DE DESPLIEGUE
  // ═══════════════════════════════════════════════════════════

  describe('desplegarSer', () => {
    const serDisponible = {
      id: 'being-1',
      name: 'Test Being',
      status: 'available',
      attributes: { empathy: 80 }
    };

    const crisis = {
      id: 'crisis-1',
      type: 'social',
      severity: 'medium'
    };

    test('should successfully deploy being to crisis', () => {
      const resultado = misionService.desplegarSer(serDisponible, crisis, 100);

      expect(resultado.success).toBe(true);
      expect(resultado.mision).toBeDefined();
      expect(resultado.mision.beingId).toBe('being-1');
      expect(resultado.mision.crisisId).toBe('crisis-1');
      expect(resultado.mision.status).toBe('active');
      expect(resultado.energiaCosumida).toBe(10);
    });

    test('should calculate mission duration based on crisis severity', () => {
      const crisisBaja = { ...crisis, severity: 'low' };
      const crisisAlta = { ...crisis, severity: 'high' };

      const resultadoBaja = misionService.desplegarSer(serDisponible, crisisBaja, 100);
      const resultadoAlta = misionService.desplegarSer(serDisponible, crisisAlta, 100);

      const duracionBaja = resultadoBaja.mision.completesAt - resultadoBaja.mision.startedAt;
      const duracionAlta = resultadoAlta.mision.completesAt - resultadoAlta.mision.startedAt;

      expect(duracionBaja).toBeLessThan(duracionAlta);
    });

    test('should fail if being is already deployed', () => {
      const serDesplegado = { ...serDisponible, status: 'deployed' };

      const resultado = misionService.desplegarSer(serDesplegado, crisis, 100);

      expect(resultado.success).toBe(false);
      expect(resultado.error).toBe('Ser ya está desplegado');
    });

    test('should fail if not enough energy', () => {
      const resultado = misionService.desplegarSer(serDisponible, crisis, 5);

      expect(resultado.success).toBe(false);
      expect(resultado.error).toBe('Energía insuficiente');
    });

    test('should fail if being is not found', () => {
      const resultado = misionService.desplegarSer(null, crisis, 100);

      expect(resultado.success).toBe(false);
      expect(resultado.error).toBe('Ser no encontrado');
    });

    test('should fail if crisis is not found', () => {
      const resultado = misionService.desplegarSer(serDisponible, null, 100);

      expect(resultado.success).toBe(false);
      expect(resultado.error).toBe('Crisis no encontrada');
    });

    test('should include success probability in mission', () => {
      const resultado = misionService.desplegarSer(serDisponible, crisis, 100);

      expect(resultado.mision.successProbability).toBeGreaterThanOrEqual(10);
      expect(resultado.mision.successProbability).toBeLessThanOrEqual(95);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // TESTS DE RESOLUCIÓN DE MISIÓN
  // ═══════════════════════════════════════════════════════════

  describe('resolverMision', () => {
    const ser = {
      id: 'being-1',
      attributes: { empathy: 80 }
    };

    const crisis = {
      id: 'crisis-1',
      type: 'social',
      severity: 'medium'
    };

    test('should not resolve mission before completion time', () => {
      const mision = {
        id: 'mission-1',
        beingId: 'being-1',
        crisisId: 'crisis-1',
        successProbability: 70,
        startedAt: Date.now(),
        completesAt: Date.now() + 10000, // 10 seconds in future
        status: 'active'
      };

      const resultado = misionService.resolverMision(mision, ser, crisis);

      expect(resultado.success).toBe(false);
      expect(resultado.error).toBe('La misión aún no ha terminado');
    });

    test('should resolve completed mission successfully', () => {
      const mision = {
        id: 'mission-1',
        beingId: 'being-1',
        crisisId: 'crisis-1',
        successProbability: 100, // Guaranteed success for test
        startedAt: Date.now() - 20000,
        completesAt: Date.now() - 1000, // Completed 1 second ago
        status: 'active'
      };

      const resultado = misionService.resolverMision(mision, ser, crisis);

      expect(resultado.success).toBe(true);
      expect(resultado.misionExitosa).toBe(true);
      expect(resultado.recompensas).toBeDefined();
      expect(resultado.recompensas.xp).toBeGreaterThan(0);
    });

    test('should give higher rewards for higher severity crises', () => {
      const misionFacil = {
        id: 'mission-1',
        successProbability: 100,
        startedAt: Date.now() - 20000,
        completesAt: Date.now() - 1000
      };

      const crisisFacil = { ...crisis, severity: 'low' };
      const crisisDificil = { ...crisis, severity: 'critical' };

      const resultadoFacil = misionService.resolverMision(misionFacil, ser, crisisFacil);
      const resultadoDificil = misionService.resolverMision(misionFacil, ser, crisisDificil);

      expect(resultadoDificil.recompensas.xp).toBeGreaterThan(resultadoFacil.recompensas.xp);
      expect(resultadoDificil.recompensas.consciousness).toBeGreaterThan(resultadoFacil.recompensas.consciousness);
    });

    test('should give bonus consciousness for low probability success', () => {
      const misionDificil = {
        id: 'mission-1',
        successProbability: 30, // Low probability
        startedAt: Date.now() - 20000,
        completesAt: Date.now() - 1000
      };

      // Mock Math.random to ensure success
      const originalRandom = Math.random;
      Math.random = jest.fn(() => 0.1); // Will succeed

      const resultado = misionService.resolverMision(misionDificil, ser, crisis);

      Math.random = originalRandom;

      expect(resultado.misionExitosa).toBe(true);
      // Should have bonus consciousness
      expect(resultado.recompensas.consciousness).toBeGreaterThan(25 * 1.5); // Base + bonus
    });

    test('should give no rewards on failure', () => {
      const mision = {
        id: 'mission-1',
        successProbability: 0, // Guaranteed failure
        startedAt: Date.now() - 20000,
        completesAt: Date.now() - 1000
      };

      const resultado = misionService.resolverMision(mision, ser, crisis);

      expect(resultado.success).toBe(true);
      expect(resultado.misionExitosa).toBe(false);
      expect(resultado.recompensas.xp).toBe(0);
      expect(resultado.recompensas.consciousness).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // TESTS DE COOLDOWN
  // ═══════════════════════════════════════════════════════════

  describe('Cooldown Management', () => {
    test('verificarCooldown should return false if no cooldown', () => {
      const ser = {
        id: 'being-1',
        cooldownUntil: null
      };

      const resultado = misionService.verificarCooldown(ser);

      expect(resultado.enCooldown).toBe(false);
    });

    test('verificarCooldown should return true if in cooldown', () => {
      const ser = {
        id: 'being-1',
        cooldownUntil: Date.now() + 10 * 60 * 1000 // 10 minutes from now
      };

      const resultado = misionService.verificarCooldown(ser);

      expect(resultado.enCooldown).toBe(true);
      expect(resultado.tiempoRestante).toBeGreaterThan(0);
      expect(resultado.minutos).toBeGreaterThan(0);
    });

    test('verificarCooldown should return false if cooldown expired', () => {
      const ser = {
        id: 'being-1',
        cooldownUntil: Date.now() - 1000 // 1 second ago
      };

      const resultado = misionService.verificarCooldown(ser);

      expect(resultado.enCooldown).toBe(false);
    });

    test('aplicarCooldown should apply shorter cooldown for successful mission', () => {
      const ser = { id: 'being-1' };

      const cooldownExito = misionService.aplicarCooldown(ser, true);
      const cooldownFallo = misionService.aplicarCooldown(ser, false);

      const duracionExito = cooldownExito - Date.now();
      const duracionFallo = cooldownFallo - Date.now();

      expect(duracionExito).toBeLessThan(duracionFallo);
    });

    test('aplicarCooldown should return future timestamp', () => {
      const ser = { id: 'being-1' };

      const cooldownHasta = misionService.aplicarCooldown(ser, true);

      expect(cooldownHasta).toBeGreaterThan(Date.now());
    });
  });

  // ═══════════════════════════════════════════════════════════
  // TESTS DE INTEGRACIÓN
  // ═══════════════════════════════════════════════════════════

  describe('Integration Tests', () => {
    test('complete mission flow: deploy → resolve → cooldown', () => {
      const ser = {
        id: 'being-1',
        name: 'Test Being',
        status: 'available',
        attributes: {
          empathy: 85,
          communication: 80,
          leadership: 75
        }
      };

      const crisis = {
        id: 'crisis-1',
        type: 'social',
        severity: 'medium'
      };

      // 1. Deploy being
      const despliegue = misionService.desplegarSer(ser, crisis, 100);
      expect(despliegue.success).toBe(true);

      const mision = despliegue.mision;

      // 2. Fast-forward time (mock)
      mision.completesAt = Date.now() - 1000; // Already completed

      // 3. Resolve mission
      const resolucion = misionService.resolverMision(mision, ser, crisis);
      expect(resolucion.success).toBe(true);

      // 4. Apply cooldown
      const cooldownHasta = misionService.aplicarCooldown(
        ser,
        resolucion.misionExitosa
      );

      ser.cooldownUntil = cooldownHasta;

      // 5. Verify cooldown
      const estadoCooldown = misionService.verificarCooldown(ser);
      expect(estadoCooldown.enCooldown).toBe(true);
    });

    test('should handle edge case: deploy at exactly minimum energy', () => {
      const ser = {
        id: 'being-1',
        status: 'available',
        attributes: { empathy: 70 }
      };

      const crisis = {
        id: 'crisis-1',
        type: 'social',
        severity: 'low'
      };

      const resultado = misionService.desplegarSer(ser, crisis, 10); // Exactly enough

      expect(resultado.success).toBe(true);
      expect(resultado.energiaCosumida).toBe(10);
    });

    test('should handle multiple crisis severities', () => {
      const ser = {
        id: 'being-1',
        status: 'available',
        attributes: { empathy: 80, communication: 75, leadership: 70 }
      };

      const severidades = ['low', 'medium', 'high', 'critical'];
      const resultados = [];

      severidades.forEach(severidad => {
        const crisis = {
          id: `crisis-${severidad}`,
          type: 'social',
          severity: severidad
        };

        const resultado = misionService.desplegarSer(ser, crisis, 100);
        resultados.push(resultado);
      });

      // All should succeed
      resultados.forEach(r => {
        expect(r.success).toBe(true);
      });

      // Higher severity = longer duration
      const duraciones = resultados.map(r =>
        r.mision.completesAt - r.mision.startedAt
      );

      for (let i = 0; i < duraciones.length - 1; i++) {
        expect(duraciones[i]).toBeLessThan(duraciones[i + 1]);
      }
    });
  });
});
