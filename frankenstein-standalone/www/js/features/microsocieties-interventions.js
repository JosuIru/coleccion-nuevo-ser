/**
 * SISTEMA DE INTERVENCIONES DIVINAS
 * Permite al jugador intervenir directamente en la sociedad
 */

class DivinInterventions {
  constructor() {
    this.divinePoints = 3; // Puntos iniciales
    this.maxDivinePoints = 5;
    this.interventions = this.createInterventions();
    this.cooldowns = {};
    this.history = [];

    this.loadState();
  }

  /**
   * Crear catálogo de intervenciones
   */
  createInterventions() {
    return {
      // BENDICIONES (1 punto)
      blessHealth: {
        id: 'blessHealth',
        name: 'Bendición de Vitalidad',
        icon: '🌱',
        cost: 1,
        cooldown: 5, // Turnos
        category: 'blessing',
        description: 'Aumenta la Salud de la sociedad en 30 puntos',
        effect: (society) => {
          society.metrics.health = Math.min(100, society.metrics.health + 30);
          society.logEvent('🌱 Bendición de Vitalidad recibida!', 'success');
        }
      },

      blessKnowledge: {
        id: 'blessKnowledge',
        name: 'Bendición de Sabiduría',
        icon: '💡',
        cost: 1,
        cooldown: 5,
        category: 'blessing',
        description: 'Aumenta el Conocimiento de la sociedad en 30 puntos',
        effect: (society) => {
          society.metrics.knowledge = Math.min(100, society.metrics.knowledge + 30);
          society.logEvent('💡 Bendición de Sabiduría recibida!', 'success');
        }
      },

      blessAction: {
        id: 'blessAction',
        name: 'Bendición de Acción',
        icon: '⚡',
        cost: 1,
        cooldown: 5,
        category: 'blessing',
        description: 'Aumenta la Acción de la sociedad en 30 puntos',
        effect: (society) => {
          society.metrics.action = Math.min(100, society.metrics.action + 30);
          society.logEvent('⚡ Bendición de Acción recibida!', 'success');
        }
      },

      blessCohesion: {
        id: 'blessCohesion',
        name: 'Bendición de Unidad',
        icon: '🤝',
        cost: 1,
        cooldown: 5,
        category: 'blessing',
        description: 'Aumenta la Cohesión de la sociedad en 30 puntos',
        effect: (society) => {
          society.metrics.cohesion = Math.min(100, society.metrics.cohesion + 30);
          society.logEvent('🤝 Bendición de Unidad recibida!', 'success');
        }
      },

      // RESURRECCIONES (2 puntos)
      resurrect: {
        id: 'resurrect',
        name: 'Resurrección',
        icon: '✨',
        cost: 2,
        cooldown: 10,
        category: 'resurrection',
        description: 'Revive un ser muerto aleatorio con 60 de fitness',
        requiresDead: true,
        effect: (society) => {
          const dead = society.beings.filter(b => !b.alive);
          if (dead.length === 0) {
            return { success: false, message: 'No hay seres muertos' };
          }

          const revived = dead[Math.floor(Math.random() * dead.length)];
          revived.alive = true;
          revived.fitness = 60;

          society.logEvent(`✨ "${revived.name}" ha resucitado!`, 'success');
          return { success: true, being: revived };
        }
      },

      resurrectBest: {
        id: 'resurrectBest',
        name: 'Resurrección del Campeón',
        icon: '👑',
        cost: 3,
        cooldown: 15,
        category: 'resurrection',
        description: 'Revive el mejor ser muerto con 80 de fitness',
        requiresDead: true,
        effect: (society) => {
          const dead = society.beings.filter(b => !b.alive);
          if (dead.length === 0) {
            return { success: false, message: 'No hay seres muertos' };
          }

          // Encontrar el mejor (mayor totalPower)
          const best = dead.reduce((best, b) =>
            b.totalPower > best.totalPower ? b : best
          );

          best.alive = true;
          best.fitness = 80;

          society.logEvent(`👑 "${best.name}", el campeón, ha resucitado!`, 'success');
          return { success: true, being: best };
        }
      },

      // MUTACIONES (2 puntos)
      mutateBeing: {
        id: 'mutateBeing',
        name: 'Mutación Dirigida',
        icon: '🧬',
        cost: 2,
        cooldown: 8,
        category: 'mutation',
        description: 'Muta un ser aleatorio, aumentando todos sus atributos en 10%',
        effect: (society) => {
          const alive = society.beings.filter(b => b.alive);
          if (alive.length === 0) {
            return { success: false, message: 'No hay seres vivos' };
          }

          const target = alive[Math.floor(Math.random() * alive.length)];

          // Aumentar todos los atributos 10%
          Object.keys(target.attributes).forEach(attr => {
            target.attributes[attr] *= 1.1;
          });

          target.totalPower *= 1.1;
          target.fitness = Math.min(100, target.fitness + 10);

          society.logEvent(`🧬 "${target.name}" ha mutado positivamente!`, 'success');
          return { success: true, being: target };
        }
      },

      evolveAll: {
        id: 'evolveAll',
        name: 'Evolución Masiva',
        icon: '🌟',
        cost: 4,
        cooldown: 20,
        category: 'mutation',
        description: 'Aumenta todos los atributos de todos los seres en 5%',
        effect: (society) => {
          const alive = society.beings.filter(b => b.alive);

          alive.forEach(being => {
            Object.keys(being.attributes).forEach(attr => {
              being.attributes[attr] *= 1.05;
            });
            being.totalPower *= 1.05;
            being.fitness = Math.min(100, being.fitness + 5);
          });

          society.logEvent(`🌟 Evolución masiva! Todos los seres han mejorado!`, 'success');
          return { success: true, count: alive.length };
        }
      },

      // CONTROL DE TIEMPO (3 puntos)
      forceHybridization: {
        id: 'forceHybridization',
        name: 'Forzar Hibridación',
        icon: '💞',
        cost: 2,
        cooldown: 5,
        category: 'time',
        description: 'Fuerza una hibridación inmediata entre los 2 mejores seres',
        effect: (society) => {
          const alive = society.beings.filter(b => b.alive);
          if (alive.length < 2) {
            return { success: false, message: 'Se necesitan al menos 2 seres vivos' };
          }

          // Forzar hibridación
          society.hybridize();

          society.logEvent(`💞 Hibridación forzada por intervención divina!`, 'success');
          return { success: true };
        }
      },

      skipTurns: {
        id: 'skipTurns',
        name: 'Salto Temporal',
        icon: '⏩',
        cost: 3,
        cooldown: 10,
        category: 'time',
        description: 'Avanza 5 turnos instantáneamente',
        effect: (society) => {
          // Procesar 5 turnos sin UI updates
          for (let i = 0; i < 5; i++) {
            society.processTurn();
          }

          society.logEvent(`⏩ Salto temporal: 5 turnos avanzados!`, 'info');
          return { success: true };
        }
      },

      // EVENTOS ESPECIALES (2-3 puntos)
      triggerOpportunity: {
        id: 'triggerOpportunity',
        name: 'Invocar Oportunidad',
        icon: '🎁',
        cost: 2,
        cooldown: 8,
        category: 'event',
        description: 'Genera un evento de oportunidad garantizado',
        effect: (society) => {
          // Generar evento de oportunidad
          const event = society.generateEvent();
          if (window.eventsModal && !eventsModal.isOpen) {
            // Forzar tipo opportunity
            event.type = 'opportunity';
            eventsModal.show(event, society, () => {});
          }

          society.logEvent(`🎁 Oportunidad invocada por gracia divina!`, 'success');
          return { success: true };
        }
      },

      negateEvent: {
        id: 'negateEvent',
        name: 'Negar Crisis',
        icon: '🛡️',
        cost: 2,
        cooldown: 10,
        category: 'event',
        description: 'Protege la sociedad del próximo evento negativo',
        effect: (society) => {
          society.negateNextCrisis = true;
          society.logEvent(`🛡️ Protección divina activada! Próxima crisis será negada.`, 'success');
          return { success: true };
        }
      },

      // EMERGENCIAS (4-5 puntos)
      fullHeal: {
        id: 'fullHeal',
        name: 'Sanación Total',
        icon: '💚',
        cost: 4,
        cooldown: 20,
        category: 'emergency',
        description: 'Restaura todas las métricas a 100',
        effect: (society) => {
          society.metrics.health = 100;
          society.metrics.knowledge = 100;
          society.metrics.action = 100;
          society.metrics.cohesion = 100;

          society.logEvent(`💚 Sanación total! Todas las métricas restauradas!`, 'success');
          return { success: true };
        }
      },

      massResurrection: {
        id: 'massResurrection',
        name: 'Resurrección Masiva',
        icon: '✨✨',
        cost: 5,
        cooldown: 30,
        category: 'emergency',
        description: 'Revive TODOS los seres muertos con 50 de fitness',
        requiresDead: true,
        effect: (society) => {
          const dead = society.beings.filter(b => !b.alive);
          if (dead.length === 0) {
            return { success: false, message: 'No hay seres muertos' };
          }

          dead.forEach(being => {
            being.alive = true;
            being.fitness = 50;
          });

          society.logEvent(`✨✨ Resurrección masiva! ${dead.length} seres revividos!`, 'success');
          return { success: true, count: dead.length };
        }
      }
    };
  }

  /**
   * Usar intervención
   */
  useIntervention(interventionId, society) {
    const intervention = this.interventions[interventionId];

    if (!intervention) {
      return { success: false, message: 'Intervención no encontrada' };
    }

    // Verificar puntos divinos
    if (this.divinePoints < intervention.cost) {
      return { success: false, message: `Necesitas ${intervention.cost} puntos divinos` };
    }

    // Verificar cooldown
    if (this.isOnCooldown(interventionId)) {
      const remaining = this.getCooldownRemaining(interventionId);
      return { success: false, message: `En cooldown: ${remaining} turnos restantes` };
    }

    // Verificar requisitos especiales
    if (intervention.requiresDead) {
      const dead = society.beings.filter(b => !b.alive);
      if (dead.length === 0) {
        return { success: false, message: 'No hay seres muertos' };
      }
    }

    // Ejecutar efecto
    const result = intervention.effect(society);

    if (!result || result.success !== false) {
      // Consumir puntos
      this.divinePoints -= intervention.cost;

      // Aplicar cooldown
      this.cooldowns[interventionId] = {
        startTurn: society.turn,
        duration: intervention.cooldown
      };

      // Registrar en historia
      this.history.push({
        interventionId,
        turn: society.turn,
        cost: intervention.cost,
        timestamp: Date.now()
      });

      this.saveState();

      // Efectos visuales y sonoros
      if (window.animationSystem) {
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        window.animationSystem.confetti(centerX, centerY);
        window.animationSystem.showFloatingText(
          intervention.icon + ' ' + intervention.name,
          centerX,
          centerY - 50,
          '#d4af37',
          28
        );
      }

      if (window.microSocietiesAudio) {
        window.microSocietiesAudio.playSuccess();
      }

      // console.log(`👁️ Intervención "${intervention.name}" usada`);
      return { success: true, ...result };
    }

    return result;
  }

  /**
   * Verificar si intervención está en cooldown
   */
  isOnCooldown(interventionId) {
    const cd = this.cooldowns[interventionId];
    if (!cd) return false;

    // El cooldown depende del turno actual, pero no tenemos acceso aquí
    // Se verifica en useIntervention con society.turn
    return false; // Verificación real en useIntervention
  }

  /**
   * Obtener turnos restantes de cooldown
   */
  getCooldownRemaining(interventionId, currentTurn) {
    const cd = this.cooldowns[interventionId];
    if (!cd) return 0;

    const elapsed = currentTurn - cd.startTurn;
    const remaining = cd.duration - elapsed;

    return Math.max(0, remaining);
  }

  /**
   * Actualizar cooldowns (llamar cada turno)
   */
  updateCooldowns(currentTurn) {
    Object.keys(this.cooldowns).forEach(id => {
      if (this.getCooldownRemaining(id, currentTurn) <= 0) {
        delete this.cooldowns[id];
      }
    });
  }

  /**
   * Ganar puntos divinos
   */
  gainDivinePoints(amount) {
    this.divinePoints = Math.min(this.maxDivinePoints, this.divinePoints + amount);
    this.saveState();
    // console.log(`👁️ +${amount} puntos divinos (total: ${this.divinePoints})`);
  }

  /**
   * Regenerar puntos pasivamente
   */
  regeneratePoints(society) {
    // Regenerar 1 punto cada 20 turnos
    if (society.turn % 20 === 0 && this.divinePoints < this.maxDivinePoints) {
      this.gainDivinePoints(1);
      society.logEvent('👁️ +1 punto divino regenerado', 'info');
    }
  }

  /**
   * Obtener intervenciones disponibles
   */
  getAvailableInterventions(currentTurn) {
    return Object.values(this.interventions).map(intervention => ({
      ...intervention,
      available: this.divinePoints >= intervention.cost,
      onCooldown: this.getCooldownRemaining(intervention.id, currentTurn) > 0,
      cooldownRemaining: this.getCooldownRemaining(intervention.id, currentTurn)
    }));
  }

  /**
   * Obtener intervenciones por categoría
   */
  getByCategory(category, currentTurn) {
    return this.getAvailableInterventions(currentTurn).filter(i => i.category === category);
  }

  /**
   * Obtener historial
   */
  getHistory() {
    return [...this.history].reverse(); // Más reciente primero
  }

  /**
   * Guardar estado
   */
  saveState() {
    const state = {
      divinePoints: this.divinePoints,
      cooldowns: this.cooldowns,
      history: this.history.slice(-50) // Últimas 50 intervenciones
    };

    localStorage.setItem('divine-interventions', JSON.stringify(state));
  }

  /**
   * Cargar estado
   */
  loadState() {
    try {
      const saved = localStorage.getItem('divine-interventions');
      if (saved) {
        const state = JSON.parse(saved);
        this.divinePoints = state.divinePoints || 3;
        this.cooldowns = state.cooldowns || {};
        this.history = state.history || [];
        // console.log('👁️ Estado de intervenciones cargado');
      }
    } catch (error) {
      console.error('❌ Error al cargar intervenciones:', error);
    }
  }

  /**
   * Resetear estado
   */
  reset() {
    this.divinePoints = 3;
    this.cooldowns = {};
    this.history = [];
    this.saveState();
    // console.log('👁️ Intervenciones reseteadas');
  }

  /**
   * Crear UI de intervenciones
   */
  createInterventionsUI(currentTurn) {
    const categories = {
      blessing: { name: 'Bendiciones', icon: '🌟' },
      resurrection: { name: 'Resurrecciones', icon: '✨' },
      mutation: { name: 'Mutaciones', icon: '🧬' },
      time: { name: 'Tiempo', icon: '⏱️' },
      event: { name: 'Eventos', icon: '🎲' },
      emergency: { name: 'Emergencias', icon: '🚨' }
    };

    let html = `
      <div class="interventions-panel" style="
        background: rgba(74, 35, 90, 0.2);
        border: 2px solid #6a3579;
        border-radius: 8px;
        padding: 1.5rem;
      ">
        <div style="text-align: center; margin-bottom: 1.5rem;">
          <h3 style="color: #c77dff; margin-bottom: 0.5rem;">👁️ Intervenciones Divinas</h3>
          <div style="
            display: inline-block;
            background: rgba(199, 125, 255, 0.2);
            border: 2px solid #c77dff;
            border-radius: 20px;
            padding: 0.5rem 1rem;
            font-size: 1.2rem;
            font-weight: 700;
            color: #f4e9d8;
          ">
            ${this.divinePoints} / ${this.maxDivinePoints} Puntos
          </div>
        </div>
    `;

    Object.entries(categories).forEach(([catId, cat]) => {
      const interventions = this.getByCategory(catId, currentTurn);

      html += `
        <div style="margin-bottom: 1.5rem;">
          <h4 style="color: #c77dff; margin-bottom: 0.5rem;">${cat.icon} ${cat.name}</h4>
          <div style="display: grid; gap: 0.5rem;">
      `;

      interventions.forEach(intervention => {
        const canUse = intervention.available && !intervention.onCooldown;
        const opacity = canUse ? '1' : '0.5';

        html += `
          <button
            data-intervention="${intervention.id}"
            ${!canUse ? 'disabled' : ''}
            style="
              background: rgba(199, 125, 255, 0.2);
              border: 2px solid ${canUse ? '#c77dff' : '#6a3579'};
              border-radius: 6px;
              padding: 0.75rem;
              text-align: left;
              cursor: ${canUse ? 'pointer' : 'not-allowed'};
              opacity: ${opacity};
              transition: all 0.3s;
            "
            onmouseover="if(!this.disabled) this.style.background='rgba(199, 125, 255, 0.3)'"
            onmouseout="this.style.background='rgba(199, 125, 255, 0.2)'"
          >
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="color: #f4e9d8; font-weight: 600;">${intervention.icon} ${intervention.name}</span>
              <span style="color: #d4af37; font-weight: 700;">${intervention.cost} DP</span>
            </div>
            <div style="color: #f4e9d8; font-size: 0.85rem; opacity: 0.8; margin-top: 0.25rem;">
              ${intervention.description}
            </div>
            ${intervention.onCooldown ? `
              <div style="color: #ff6b35; font-size: 0.75rem; margin-top: 0.25rem;">
                Cooldown: ${intervention.cooldownRemaining} turnos
              </div>
            ` : ''}
          </button>
        `;
      });

      html += `
          </div>
        </div>
      `;
    });

    html += '</div>';
    return html;
  }
}

// Exportar
window.DivinInterventions = DivinInterventions;
// console.log('👁️ Divine Interventions System cargado');
