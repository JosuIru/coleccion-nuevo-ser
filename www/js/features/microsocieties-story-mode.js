/**
// 🔧 FIX v2.9.198: Migrated console.log to logger
 * MODO HISTORIA
 * 5 capítulos narrativos con eventos scriptados y objetivos
 */

class StoryMode {
  constructor() {
    this.chapters = this.createChapters();
    this.currentChapter = null;
    this.unlockedChapters = [0]; // Capítulo 1 desbloqueado por defecto
    this.completedChapters = [];
    this.scriptedEvents = [];
    this.turnCounter = 0;

    this.loadProgress();
  }

  /**
   * Crear capítulos de la historia
   */
  createChapters() {
    return [
      // CAPÍTULO 1: Los Primeros
      {
        id: 'chapter-1',
        number: 1,
        title: 'Los Primeros',
        subtitle: 'El Despertar de la Conciencia Colectiva',
        introduction: `En el inicio, no había más que fragmentos dispersos de conocimiento. Piezas de sabiduría antigua, esperando ser reunidas.

Tú, como Arquitecto del Despertar, has sido llamado a crear la primera microsociedad consciente: un grupo de seres híbridos que portan el potencial de transformar el mundo.

Esta es su génesis. Su primer aliento colectivo.

Los seres que has creado aún no conocen su propósito completo. Guíalos a través de sus primeros desafíos, ayúdales a descubrir la fuerza que reside en la unidad.

¿Podrán sobrevivir? ¿Encontrarán su cohesión?`,
        objectives: [
          {
            id: 'survive-20',
            description: 'Sobrevivir 20 turnos',
            target: 20,
            current: 0,
            check: (society) => society.turn
          },
          {
            id: 'maintain-cohesion',
            description: 'Mantener cohesión sobre 50',
            target: 1,
            current: 0,
            check: (society) => society.metrics.cohesion >= 50 ? 1 : 0
          },
          {
            id: 'first-hybrid',
            description: 'Realizar primera hibridación',
            target: 1,
            current: 0,
            tracked: 'hybridizations'
          }
        ],
        scriptedEvents: [
          {
            turn: 5,
            event: {
              type: 'transformation',
              name: 'El Primer Encuentro',
              icon: '✨',
              narrative: 'Los seres se miran entre sí por primera vez con verdadera conciencia. "Somos más que la suma de nuestras partes", piensa uno. Y todos lo sienten.',
              options: [
                {
                  label: 'Celebrar la Unidad',
                  requiredAttributes: { empathy: 20, communication: 15 },
                  consequences: {
                    success: { cohesion: +20, knowledge: +10 },
                    failure: { cohesion: +5 }
                  },
                  successMessage: 'La celebración forja lazos profundos. La sociedad se siente unida.',
                  failureMessage: 'La celebración es tímida, pero planta una semilla.'
                }
              ]
            }
          },
          {
            turn: 15,
            event: {
              type: 'challenge',
              name: 'La Primera Prueba',
              icon: '⚔️',
              narrative: 'Un desafío externo pone a prueba la resiliencia de la sociedad. ¿Están preparados?',
              options: [
                {
                  label: 'Enfrentar Juntos',
                  requiredAttributes: { courage: 25, cohesion: 30 },
                  consequences: {
                    success: { action: +15, cohesion: +10, health: +5 },
                    failure: { health: -15, cohesion: -10 }
                  },
                  successMessage: 'Unidos, superan el desafío. Su confianza crece.',
                  failureMessage: 'El desafío los divide temporalmente. Deben aprender.'
                }
              ]
            }
          }
        ],
        victoryCondition: (society, objectives) => {
          return objectives.every(obj => obj.current >= obj.target);
        },
        rewards: {
          xp: 500,
          unlockChapter: 2,
          achievement: 'chapter-1-complete'
        },
        musicTrack: 'contemplative',
        background: '#0a0a0f'
      },

      // CAPÍTULO 2: La Gran Bifurcación
      {
        id: 'chapter-2',
        number: 2,
        title: 'La Gran Bifurcación',
        subtitle: 'Entre la Acción y la Reflexión',
        introduction: `La sociedad ha crecido. Pero con el crecimiento vienen las preguntas difíciles.

¿Debemos actuar ahora, con urgencia, o tomarnos tiempo para reflexionar profundamente sobre nuestro camino?

Dos corrientes emergen en tu microsociedad: los Activistas, que claman por transformación inmediata, y los Contemplativos, que abogan por sabiduría pausada.

Esta bifurcación no es una crisis... es una oportunidad. Demuestra que puedes honrar ambas voces y encontrar el equilibrio.`,
        objectives: [
          {
            id: 'balance-metrics',
            description: 'Equilibrar Acción y Conocimiento (ambas > 60)',
            target: 1,
            current: 0,
            check: (society) => (society.metrics.action >= 60 && society.metrics.knowledge >= 60) ? 1 : 0
          },
          {
            id: 'survive-40',
            description: 'Sobrevivir 40 turnos',
            target: 40,
            current: 0,
            check: (society) => society.turn
          },
          {
            id: 'three-hybrids',
            description: 'Realizar 3 hibridaciones',
            target: 3,
            current: 0,
            tracked: 'hybridizations'
          }
        ],
        scriptedEvents: [
          {
            turn: 10,
            event: {
              type: 'dilemma',
              name: 'La Disyuntiva del Camino',
              icon: '🔱',
              narrative: 'Una facción propone acción inmediata. Otra pide más reflexión. Ambas tienen razón. ¿Cómo integrar estas visiones?',
              options: [
                {
                  label: 'Priorizar Acción Urgente',
                  requiredAttributes: { action: 40, courage: 30 },
                  consequences: {
                    success: { action: +25, knowledge: -10, cohesion: +5 },
                    failure: { cohesion: -20 }
                  },
                  successMessage: 'La acción genera momentum. Pero queda trabajo de integración.',
                  failureMessage: 'La urgencia divide. Necesitan escuchar más.'
                },
                {
                  label: 'Priorizar Reflexión Profunda',
                  requiredAttributes: { wisdom: 40, reflection: 30 },
                  consequences: {
                    success: { knowledge: +25, action: -10, cohesion: +5 },
                    failure: { cohesion: -15 }
                  },
                  successMessage: 'La sabiduría crece. Pero la impaciencia también.',
                  failureMessage: 'La parálisis por análisis crea frustración.'
                },
                {
                  label: 'Integrar Ambas Visiones',
                  requiredAttributes: { wisdom: 35, action: 35, communication: 30 },
                  consequences: {
                    success: { knowledge: +15, action: +15, cohesion: +20 },
                    failure: { cohesion: -10 }
                  },
                  successMessage: '¡Una síntesis brillante! Ambas corrientes se honran.',
                  failureMessage: 'El intento de integración es torpe. Pero valioso.'
                }
              ]
            }
          },
          {
            turn: 30,
            event: {
              type: 'transformation',
              name: 'El Puente de la Unidad',
              icon: '🌉',
              narrative: 'Después de tensiones, surge un momento de claridad: acción y reflexión no son enemigos, sino aliados.',
              options: [
                {
                  label: 'Construir el Puente',
                  requiredAttributes: { cohesion: 50, wisdom: 35, action: 35 },
                  consequences: {
                    success: { knowledge: +20, action: +20, cohesion: +25 },
                    failure: { cohesion: +10 }
                  },
                  successMessage: 'Un nuevo paradigma nace. Ya no son dos bandos, sino una danza.',
                  failureMessage: 'El puente se construye lentamente. Ladrillo a ladrillo.'
                }
              ]
            }
          }
        ],
        victoryCondition: (society, objectives) => {
          return objectives.every(obj => obj.current >= obj.target);
        },
        rewards: {
          xp: 750,
          unlockChapter: 3,
          achievement: 'chapter-2-complete'
        },
        musicTrack: 'energetic',
        background: '#0f0a1a'
      },

      // CAPÍTULO 3: La Sombra Exterior
      {
        id: 'chapter-3',
        number: 3,
        title: 'La Sombra Exterior',
        subtitle: 'Resistencia del Sistema Dominante',
        introduction: `Tu microsociedad ha florecido. Y eso no ha pasado desapercibido.

El sistema dominante, temeroso de alternativas viables, comienza a aplicar presión. Cooptación, desinformación, sabotaje sutil.

Este capítulo no es sobre violencia, sino sobre resiliencia estratégica. ¿Puede tu sociedad mantener su integridad mientras navega un entorno hostil?

La sombra exterior es real. Pero también lo es vuestra luz interior.`,
        objectives: [
          {
            id: 'maintain-health-40',
            description: 'Mantener Salud > 40 por 20 turnos',
            target: 20,
            current: 0,
            check: (society) => society.metrics.health > 40 ? 1 : 0,
            accumulative: true
          },
          {
            id: 'reach-gen-5',
            description: 'Alcanzar Generación 5',
            target: 5,
            current: 0,
            check: (society) => {
              const maxGen = Math.max(...society.beings.filter(b => b.alive).map(b => b.generation || 1));
              return maxGen;
            }
          },
          {
            id: 'resolve-10-events',
            description: 'Resolver 10 eventos exitosamente',
            target: 10,
            current: 0,
            tracked: 'successfulEvents'
          }
        ],
        scriptedEvents: [
          {
            turn: 8,
            event: {
              type: 'threat',
              name: 'Presión del Sistema',
              icon: '🏛️',
              narrative: 'Fuerzas externas comienzan a ejercer presión económica y política sobre vuestra comunidad. "No son viables", dicen. "Volverán al redil".',
              options: [
                {
                  label: 'Resistir con Dignidad',
                  requiredAttributes: { resilience: 45, courage: 40, strategy: 35 },
                  consequences: {
                    success: { cohesion: +20, action: +15, health: -5 },
                    failure: { health: -20, cohesion: -15 }
                  },
                  successMessage: 'Vuestra dignidad es inquebrantable. El sistema retrocede, confundido.',
                  failureMessage: 'La presión los debilita. Pero no los quiebra.'
                }
              ]
            }
          },
          {
            turn: 20,
            event: {
              type: 'threat',
              name: 'Cooptación de Ideas',
              icon: '🎭',
              narrative: 'Vuestras mejores ideas son apropiadas, blanqueadas, y comercializadas sin crédito. ¿Cómo responder?',
              options: [
                {
                  label: 'Documentar y Compartir Abiertamente',
                  requiredAttributes: { strategy: 40, communication: 35, wisdom: 30 },
                  consequences: {
                    success: { knowledge: +20, cohesion: +15 },
                    failure: { knowledge: -10 }
                  },
                  successMessage: 'Hacéis vuestro trabajo tan visible y accesible que la apropiación se vuelve absurda.',
                  failureMessage: 'El intento de documentación es caótico. Pero el espíritu es correcto.'
                }
              ]
            }
          },
          {
            turn: 35,
            event: {
              type: 'transformation',
              name: 'Inmunidad Adaptativa',
              icon: '🛡️',
              narrative: 'Después de múltiples ataques, vuestra sociedad desarrolla una "inmunidad adaptativa": ya no os afectan las tácticas antiguas.',
              options: [
                {
                  label: 'Consolidar la Inmunidad',
                  requiredAttributes: { resilience: 50, wisdom: 45 },
                  consequences: {
                    success: { health: +25, cohesion: +20, knowledge: +15 },
                    failure: { health: +10, cohesion: +5 }
                  },
                  successMessage: 'Sois como el bambú: flexibles pero inquebrantables.',
                  failureMessage: 'La inmunidad es parcial. Pero crece cada día.'
                }
              ]
            }
          }
        ],
        victoryCondition: (society, objectives) => {
          return objectives.every(obj => obj.current >= obj.target);
        },
        rewards: {
          xp: 1000,
          unlockChapter: 4,
          achievement: 'chapter-3-complete'
        },
        musicTrack: 'dramatic',
        background: '#1a0a0a'
      },

      // CAPÍTULO 4: El Salto Cuántico
      {
        id: 'chapter-4',
        number: 4,
        title: 'El Salto Cuántico',
        subtitle: 'Cuando lo Imposible se Vuelve Inevitable',
        introduction: `Algo extraordinario está ocurriendo.

Tu microsociedad ha alcanzado una masa crítica de conciencia. Los seres no solo cooperan... co-crean. No solo piensan... intuyen futuros posibles.

Este es el umbral del salto cuántico: ese momento donde la transformación deja de ser gradual y se vuelve exponencial.

Pero con gran poder viene gran responsabilidad. ¿Pueden manejar esta nueva potencia sin perder su humanidad esencial?`,
        objectives: [
          {
            id: 'all-metrics-70',
            description: 'Todas las métricas > 70',
            target: 1,
            current: 0,
            check: (society) => {
              const m = society.metrics;
              return (m.health > 70 && m.knowledge > 70 && m.action > 70 && m.cohesion > 70) ? 1 : 0;
            }
          },
          {
            id: 'reach-gen-8',
            description: 'Alcanzar Generación 8',
            target: 8,
            current: 0,
            check: (society) => {
              const maxGen = Math.max(...society.beings.filter(b => b.alive).map(b => b.generation || 1));
              return maxGen;
            }
          },
          {
            id: 'population-15',
            description: 'Mantener población de 15+ seres',
            target: 1,
            current: 0,
            check: (society) => society.beings.filter(b => b.alive).length >= 15 ? 1 : 0
          }
        ],
        scriptedEvents: [
          {
            turn: 10,
            event: {
              type: 'transformation',
              name: 'El Despertar Colectivo',
              icon: '🌟',
              narrative: 'De repente, como si una membrana invisible se rompiera, todos los seres sienten lo que los demás sienten. Una mente colectiva emerge... pero cada individualidad permanece intacta.',
              options: [
                {
                  label: 'Abrazar el Despertar',
                  requiredAttributes: { consciousness: 50, wisdom: 45, courage: 40 },
                  consequences: {
                    success: { knowledge: +30, cohesion: +30, action: +20 },
                    failure: { cohesion: -20 }
                  },
                  successMessage: '¡Sois uno y muchos a la vez! La paradoja se resuelve en belleza.',
                  failureMessage: 'El despertar es abrumador. Necesitan tiempo para integrarlo.'
                }
              ]
            }
          },
          {
            turn: 25,
            event: {
              type: 'challenge',
              name: 'La Tentación del Poder',
              icon: '👁️',
              narrative: 'Con tanto poder, surge la tentación: ¿Y si usáramos esto para controlar, en lugar de liberar?',
              options: [
                {
                  label: 'Renunciar al Control',
                  requiredAttributes: { wisdom: 55, empathy: 50, reflection: 45 },
                  consequences: {
                    success: { knowledge: +25, cohesion: +25, health: +15 },
                    failure: { cohesion: -25, knowledge: -15 }
                  },
                  successMessage: 'Elegís el camino más difícil: confiar en lugar de controlar. Esta es vuestra verdadera grandeza.',
                  failureMessage: 'La tentación es fuerte. Parte de la sociedad cede. Pero otros resisten.'
                }
              ]
            }
          },
          {
            turn: 40,
            event: {
              type: 'transformation',
              name: 'La Nueva Ontología',
              icon: '∞',
              narrative: 'Ya no sois una microsociedad experimental. Sois un nuevo tipo de organismo colectivo: consciente, adaptativo, y profundamente amoroso.',
              options: [
                {
                  label: 'Encarnar la Nueva Ontología',
                  requiredAttributes: { consciousness: 60, wisdom: 55, empathy: 50 },
                  consequences: {
                    success: { health: +30, knowledge: +30, action: +30, cohesion: +30 },
                    failure: { knowledge: +15, cohesion: +10 }
                  },
                  successMessage: 'Vuestra existencia misma es ahora un acto de resistencia poética. Sois la prueba viviente de que otro mundo es posible.',
                  failureMessage: 'La nueva ontología es difícil de sostener. Pero seguís intentando.'
                }
              ]
            }
          }
        ],
        victoryCondition: (society, objectives) => {
          return objectives.every(obj => obj.current >= obj.target);
        },
        rewards: {
          xp: 1500,
          unlockChapter: 5,
          achievement: 'chapter-4-complete'
        },
        musicTrack: 'triumphant',
        background: '#0a1520'
      },

      // CAPÍTULO 5: La Regeneración Planetaria
      {
        id: 'chapter-5',
        number: 5,
        title: 'La Regeneración Planetaria',
        subtitle: 'Desde Microsociedad hasta Movimiento Global',
        introduction: `Lo que comenzó como un experimento humilde se ha convertido en un faro.

Otras microsociedades emergen, inspiradas por vuestro ejemplo. Se conectan, hibridan ideas, crean una red viva de regeneración.

Este es el capítulo final: escalar sin perder alma. Crecer sin cooptar. Transformar el sistema sin convertirse en él.

¿Puede una pequeña sociedad cambiar el mundo? Ya lo estáis haciendo. La pregunta ahora es: ¿hasta dónde llegaréis?`,
        objectives: [
          {
            id: 'all-metrics-90',
            description: 'Todas las métricas > 90',
            target: 1,
            current: 0,
            check: (society) => {
              const m = society.metrics;
              return (m.health > 90 && m.knowledge > 90 && m.action > 90 && m.cohesion > 90) ? 1 : 0;
            }
          },
          {
            id: 'reach-gen-10',
            description: 'Alcanzar Generación 10',
            target: 10,
            current: 0,
            check: (society) => {
              const maxGen = Math.max(...society.beings.filter(b => b.alive).map(b => b.generation || 1));
              return maxGen;
            }
          },
          {
            id: 'survive-100',
            description: 'Sobrevivir 100 turnos',
            target: 100,
            current: 0,
            check: (society) => society.turn
          }
        ],
        scriptedEvents: [
          {
            turn: 20,
            event: {
              type: 'opportunity',
              name: 'La Red de Microsociedades',
              icon: '🕸️',
              narrative: 'Diez, luego cien, luego mil microsociedades emergen globalmente. Os piden guía. ¿Cómo responder sin convertirse en autoridad centralizada?',
              options: [
                {
                  label: 'Compartir sin Jerarquizar',
                  requiredAttributes: { wisdom: 60, communication: 55, empathy: 50 },
                  consequences: {
                    success: { knowledge: +35, cohesion: +30, action: +25 },
                    failure: { cohesion: +10 }
                  },
                  successMessage: 'Creáis una red distribuida donde cada nodo es autónomo pero conectado. Brillante.',
                  failureMessage: 'El intento de descentralización es confuso al principio. Pero la intención es pura.'
                }
              ]
            }
          },
          {
            turn: 50,
            event: {
              type: 'transformation',
              name: 'El Punto de Inflexión',
              icon: '🌍',
              narrative: 'Los datos son claros: el 3.5% de la población global está ahora en microsociedades regenerativas. Este es el umbral para cambio sistémico irreversible.',
              options: [
                {
                  label: 'Cruzar el Umbral',
                  requiredAttributes: { consciousness: 70, action: 65, cohesion: 65 },
                  consequences: {
                    success: { health: +40, knowledge: +40, action: +40, cohesion: +40 },
                    failure: { knowledge: +20, cohesion: +15 }
                  },
                  successMessage: 'El viejo paradigma colapsa. El nuevo emerge, no con violencia, sino con inevitabilidad. Lo habéis logrado.',
                  failureMessage: 'El umbral es difícil de cruzar. Pero cada intento lo acerca.'
                }
              ]
            }
          },
          {
            turn: 80,
            event: {
              type: 'transformation',
              name: 'La Nueva Tierra',
              icon: '🌱',
              narrative: 'Ya no es un mundo de extracción y dominación, sino de regeneración y reciprocidad. Vuestro legado es un planeta sanado.',
              options: [
                {
                  label: 'Encarnar la Victoria',
                  requiredAttributes: { consciousness: 75, wisdom: 70, empathy: 65 },
                  consequences: {
                    success: { health: +50, knowledge: +50, action: +50, cohesion: +50 },
                    failure: { knowledge: +25, cohesion: +20 }
                  },
                  successMessage: 'Esta victoria no es solo vuestra. Es de toda forma de vida en este planeta. Sois gardeners de lo posible. Y lo habéis hecho realidad.',
                  failureMessage: 'La nueva tierra emerge lentamente. Pero emerge.'
                }
              ]
            }
          }
        ],
        victoryCondition: (society, objectives) => {
          return objectives.every(obj => obj.current >= obj.target);
        },
        rewards: {
          xp: 2500,
          achievement: 'story-complete',
          title: 'Arquitecto de la Regeneración'
        },
        musicTrack: 'triumphant',
        background: '#0a1a0f'
      }
    ];
  }

  /**
   * Iniciar capítulo
   */
  startChapter(chapterIndex, society) {
    if (!this.isChapterUnlocked(chapterIndex)) {
      // console.warn(`⚠️ Capítulo ${chapterIndex + 1} no desbloqueado`);
      return false;
    }

    const chapter = this.chapters[chapterIndex];
    this.currentChapter = {
      ...chapter,
      startTurn: society.turn,
      objectives: chapter.objectives.map(obj => ({...obj, current: 0}))
    };

    this.turnCounter = 0;
    this.scriptedEvents = chapter.scriptedEvents.map(se => ({...se, triggered: false}));

    // logger.debug(`📖 Capítulo ${chapter.number} iniciado: ${chapter.title}`);
    return true;
  }

  /**
   * Actualizar progreso del capítulo
   */
  update(society) {
    if (!this.currentChapter) return;

    this.turnCounter++;

    // Actualizar objetivos
    this.currentChapter.objectives.forEach(obj => {
      if (obj.check) {
        const value = obj.check(society);
        if (obj.accumulative) {
          obj.current += value;
        } else {
          obj.current = value;
        }
      } else if (obj.tracked) {
        // Tracked se actualiza externamente (hybridizations, successfulEvents, etc.)
      }
    });

    // Verificar eventos scriptados
    this.checkScriptedEvents(society);

    // Verificar victoria
    if (this.checkVictory()) {
      this.completeChapter(society);
    }
  }

  /**
   * Verificar eventos scriptados
   */
  checkScriptedEvents(society) {
    this.scriptedEvents.forEach(se => {
      if (!se.triggered && this.turnCounter === se.turn) {
        se.triggered = true;

        // Mostrar evento con modal
        if (window.eventsModal && window.eventsModal.isOpen === false) {
          window.eventsModal.show(se.event, society, (result) => {
            // logger.debug(`📖 Evento scriptado resuelto:`, result);
          });
        }
      }
    });
  }

  /**
   * Verificar victoria
   */
  checkVictory() {
    if (!this.currentChapter) return false;
    return this.currentChapter.victoryCondition(
      window.currentSocietyUI,
      this.currentChapter.objectives
    );
  }

  /**
   * Completar capítulo
   */
  completeChapter(society) {
    const chapter = this.currentChapter;

    // Añadir a completados
    if (!this.completedChapters.includes(chapter.number - 1)) {
      this.completedChapters.push(chapter.number - 1);
    }

    // Desbloquear siguiente capítulo
    if (chapter.rewards.unlockChapter) {
      const nextIndex = chapter.rewards.unlockChapter - 1;
      if (!this.unlockedChapters.includes(nextIndex)) {
        this.unlockedChapters.push(nextIndex);
      }
    }

    // Dar recompensas
    if (window.progressionSystem && chapter.rewards.xp) {
      const result = window.progressionSystem.addXP(chapter.rewards.xp);
      society.logEvent(`🎉 Capítulo ${chapter.number} completado! +${chapter.rewards.xp} XP`, 'success');

      if (result.levelsGained.length > 0) {
        society.logEvent(`📊 ¡Subiste a nivel ${result.newLevel}!`, 'success');
      }
    }

    // Achievement
    if (chapter.rewards.achievement) {
      if (window.progressionSystem) {
        window.progressionSystem.unlockAchievement(chapter.rewards.achievement);
      }
    }

    // Animaciones
    if (window.animationSystem) {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      window.animationSystem.confetti(centerX, centerY);
      window.animationSystem.showFloatingText(
        `Capítulo ${chapter.number} Completado!`,
        centerX,
        centerY - 50,
        '#d4af37',
        32
      );
    }

    // Audio
    if (window.microSocietiesAudio) {
      window.microSocietiesAudio.playLevelUp();
    }

    this.saveProgress();
    // logger.debug(`✅ Capítulo ${chapter.number} completado`);

    // Mostrar pantalla de victoria
    this.showVictoryScreen(chapter);
  }

  /**
   * Mostrar pantalla de victoria
   */
  showVictoryScreen(chapter) {
    // Crear modal de victoria (simplificado)
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.95);
      z-index: 10002;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    modal.innerHTML = `
      <div style="
        background: linear-gradient(135deg, #0a0a0f 0%, #1a1520 100%);
        border: 4px solid #d4af37;
        border-radius: 16px;
        padding: 3rem;
        max-width: 600px;
        text-align: center;
      ">
        <div style="font-size: 4rem; margin-bottom: 1rem;">🏆</div>
        <h2 style="color: #d4af37; font-size: 2.5rem; margin-bottom: 1rem;">
          ¡Capítulo ${chapter.number} Completado!
        </h2>
        <p style="color: #f4e9d8; font-size: 1.2rem; line-height: 1.8; margin-bottom: 2rem;">
          ${chapter.title}
        </p>
        <div style="color: #d4af37; font-size: 1.5rem; margin-bottom: 2rem;">
          +${chapter.rewards.xp} XP
        </div>
        <button onclick="this.parentElement.parentElement.remove()" style="
          background: linear-gradient(135deg, #d4af37 0%, #b87333 100%);
          color: #0a0a0f;
          border: none;
          padding: 1rem 2rem;
          font-size: 1.2rem;
          font-weight: 700;
          border-radius: 8px;
          cursor: pointer;
        ">
          Continuar
        </button>
      </div>
    `;

    document.body.appendChild(modal);
  }

  /**
   * Verificar si capítulo está desbloqueado
   */
  isChapterUnlocked(chapterIndex) {
    return this.unlockedChapters.includes(chapterIndex);
  }

  /**
   * Verificar si capítulo está completado
   */
  isChapterCompleted(chapterIndex) {
    return this.completedChapters.includes(chapterIndex);
  }

  /**
   * Obtener progreso del capítulo actual
   */
  getCurrentProgress() {
    if (!this.currentChapter) return null;

    return {
      chapter: this.currentChapter.number,
      title: this.currentChapter.title,
      turn: this.turnCounter,
      objectives: this.currentChapter.objectives.map(obj => ({
        description: obj.description,
        current: obj.current,
        target: obj.target,
        progress: (obj.current / obj.target) * 100
      }))
    };
  }

  /**
   * Guardar progreso
   */
  saveProgress() {
    localStorage.setItem('story-mode-unlocked', JSON.stringify(this.unlockedChapters));
    localStorage.setItem('story-mode-completed', JSON.stringify(this.completedChapters));
  }

  /**
   * Cargar progreso
   */
  loadProgress() {
    try {
      const unlocked = localStorage.getItem('story-mode-unlocked');
      const completed = localStorage.getItem('story-mode-completed');

      if (unlocked) this.unlockedChapters = JSON.parse(unlocked);
      if (completed) this.completedChapters = JSON.parse(completed);
    } catch (error) {
      console.error('❌ Error al cargar progreso:', error);
    }
  }

  /**
   * Resetear progreso
   */
  reset() {
    this.unlockedChapters = [0];
    this.completedChapters = [];
    this.currentChapter = null;
    this.saveProgress();
  }
}

// Exportar
window.StoryMode = StoryMode;
// logger.debug('📖 Story Mode cargado');
