/**
// 🔧 FIX v2.9.198: Migrated console.log to logger
 * SISTEMA DE EVENTOS CON OPCIONES MÚLTIPLES
 * Eventos interactivos donde el usuario elige la respuesta
 */

class EventsSystem {
  constructor() {
    this.eventTemplates = this.createEventTemplates();
    this.eventHistory = [];
  }

  /**
   * Crear plantillas de eventos
   */
  createEventTemplates() {
    return {
      // ========== CRISIS ==========
      crisis: [
        {
          id: 'resource-scarcity',
          name: 'Escasez de Recursos',
          description: 'Los recursos disponibles se agotan rápidamente. La sociedad debe decidir cómo proceder.',
          icon: '🏜️',
          type: 'crisis',
          difficulty: 'medium',
          narrative: 'Las reservas comunitarias están al 30%. Se escuchan voces de preocupación. Algunos proponen racionar, otros buscar nuevas fuentes.',
          options: [
            {
              label: 'Racionar Estrictamente',
              description: 'Implementar racionamiento equitativo para todos',
              requiredAttributes: { organization: 30, cohesion: 25 },
              consequences: {
                success: { health: +5, cohesion: +15, action: -5 },
                failure: { health: -15, cohesion: -20, action: -10 }
              },
              successMessage: 'La disciplina colectiva preserva recursos. La unidad se fortalece.',
              failureMessage: 'El racionamiento genera descontento. Surgen conflictos por la distribución.'
            },
            {
              label: 'Búsqueda de Recursos',
              description: 'Enviar expediciones a buscar nuevas fuentes',
              requiredAttributes: { action: 35, resilience: 30, courage: 25 },
              consequences: {
                success: { health: +20, action: +10, knowledge: +5 },
                failure: { health: -25, action: -15, cohesion: -10 }
              },
              successMessage: '¡Eureka! La expedición encuentra recursos abundantes. Moral alta.',
              failureMessage: 'La expedición regresa con las manos vacías, agotada y desmoralizada.'
            },
            {
              label: 'Innovación Tecnológica',
              description: 'Desarrollar métodos para usar menos recursos',
              requiredAttributes: { creativity: 40, technical: 35, wisdom: 30 },
              consequences: {
                success: { health: +15, knowledge: +20, action: +10 },
                failure: { health: -10, knowledge: -5, action: -15 }
              },
              successMessage: 'Innovaciones brillantes permiten hacer más con menos. Nuevo paradigma.',
              failureMessage: 'Los experimentos fracasan. Recursos desperdiciados en el intento.'
            },
            {
              label: 'Llamado a Aliados',
              description: 'Buscar ayuda de comunidades vecinas',
              requiredAttributes: { communication: 30, empathy: 25, collaboration: 30 },
              consequences: {
                success: { health: +10, cohesion: +20, knowledge: +10 },
                failure: { health: -5, cohesion: -15, knowledge: +5 }
              },
              successMessage: 'Aliados responden generosamente. Redes de apoyo fortalecidas.',
              failureMessage: 'Nadie puede ayudar. La sociedad está sola en su crisis.'
            }
          ]
        },
        {
          id: 'internal-conflict',
          name: 'Conflicto Interno Profundo',
          description: 'Dos facciones emergen con visiones opuestas sobre el futuro.',
          icon: '⚔️',
          type: 'crisis',
          difficulty: 'hard',
          narrative: 'La tensión es palpable. "Progresistas" vs "Tradicionalistas". Cada grupo tiene argumentos válidos. La sociedad espera liderazgo.',
          options: [
            {
              label: 'Mediación Sabia',
              description: 'Facilitar diálogo profundo entre ambas partes',
              requiredAttributes: { wisdom: 40, empathy: 35, communication: 30 },
              consequences: {
                success: { cohesion: +25, knowledge: +15, wisdom: +10 },
                failure: { cohesion: -30, health: -15, action: -10 }
              },
              successMessage: 'El diálogo revela valores compartidos. Síntesis emergente integra ambas visiones.',
              failureMessage: 'La mediación fracasa. Posiciones se endurecen. División profunda.'
            },
            {
              label: 'Decisión Democrática',
              description: 'Votación abierta, mayoría decide',
              requiredAttributes: { organization: 30, leadership: 25, communication: 25 },
              consequences: {
                success: { cohesion: +10, action: +15, knowledge: +5 },
                failure: { cohesion: -25, health: -10, action: -15 }
              },
              successMessage: 'El proceso democrático genera legitimidad. Minoría acepta resultado.',
              failureMessage: 'Minoría se siente ignorada. Resentimiento crece. Posible escisión.'
            },
            {
              label: 'Experimento Piloto',
              description: 'Probar ambas ideas en pequeña escala y ver resultados',
              requiredAttributes: { strategy: 35, creativity: 30, organization: 25 },
              consequences: {
                success: { knowledge: +20, cohesion: +15, action: +10 },
                failure: { health: -15, action: -20, cohesion: -10 }
              },
              successMessage: 'Los datos hablan. Evidencia guía decisión. Pragmatismo triunfa.',
              failureMessage: 'Experimentos inconcluyentes. Confusión aumenta. Recursos malgastados.'
            },
            {
              label: 'Separación Temporal',
              description: 'Permitir que cada grupo siga su camino por un tiempo',
              requiredAttributes: { courage: 35, wisdom: 30, resilience: 25 },
              consequences: {
                success: { cohesion: +5, knowledge: +10, action: +15 },
                failure: { cohesion: -35, health: -20, action: -15 }
              },
              successMessage: 'La distancia trae claridad. Reencuentro eventual con renovado respeto.',
              failureMessage: 'La separación se vuelve permanente. Sociedad fragmentada.'
            }
          ]
        },
        {
          id: 'misinformation-epidemic',
          name: 'Epidemia de Desinformación',
          description: 'Información falsa circula rápidamente, erosionando confianza.',
          icon: '🦠',
          type: 'crisis',
          difficulty: 'medium',
          narrative: 'Rumores y teorías conspirativas se propagan viralmente. ¿Qué es real? La confusión reina.',
          options: [
            {
              label: 'Educación Crítica',
              description: 'Enseñar pensamiento crítico y verificación de fuentes',
              requiredAttributes: { wisdom: 35, communication: 30, analysis: 30 },
              consequences: {
                success: { knowledge: +20, cohesion: +15, consciousness: +10 },
                failure: { knowledge: -10, cohesion: -15, action: -5 }
              },
              successMessage: 'Alfabetización mediática se expande. Inmunidad epistémica lograda.',
              failureMessage: 'Mensaje es complejo. Audiencia confundida. Desinformación persiste.'
            },
            {
              label: 'Transparencia Radical',
              description: 'Publicar toda información relevante sin filtros',
              requiredAttributes: { courage: 40, communication: 35, organization: 25 },
              consequences: {
                success: { cohesion: +20, knowledge: +15, trust: +15 },
                failure: { cohesion: -20, health: -10, confusion: +20 }
              },
              successMessage: 'Transparencia restaura confianza. Verdad prevalece sobre ruido.',
              failureMessage: 'Sobrecarga de información. Incapaces de procesar. Caos informativo.'
            },
            {
              label: 'Líderes de Opinión',
              description: 'Identificar y empoderar voces confiables',
              requiredAttributes: { strategy: 30, communication: 35, empathy: 25 },
              consequences: {
                success: { cohesion: +18, knowledge: +12, action: +8 },
                failure: { cohesion: -15, knowledge: -8, action: -10 }
              },
              successMessage: 'Mensajeros confiables corrigen narrativas. Comunidad se recalibra.',
              failureMessage: 'Voces elegidas pierden credibilidad. Cinismo aumenta.'
            }
          ]
        }
      ],

      // ========== OPORTUNIDADES ==========
      opportunity: [
        {
          id: 'strategic-alliance',
          name: 'Propuesta de Alianza',
          description: 'Una comunidad vecina propone colaboración profunda.',
          icon: '🤝',
          type: 'opportunity',
          difficulty: 'medium',
          narrative: 'Emisarios llegan con oferta: "Juntos somos más fuertes. Compartamos conocimiento, recursos, visión."',
          options: [
            {
              label: 'Alianza Total',
              description: 'Integración completa, recursos y decisiones compartidas',
              requiredAttributes: { trust: 40, collaboration: 35, courage: 30 },
              consequences: {
                success: { cohesion: +20, knowledge: +20, action: +15, health: +15 },
                failure: { cohesion: -25, health: -15, autonomy: -20 }
              },
              successMessage: 'Fusión armoniosa. Sinergias inesperadas. Nueva civilización emerge.',
              failureMessage: 'Incompatibilidades culturales. Conflictos de poder. Separación dolorosa.'
            },
            {
              label: 'Colaboración Selectiva',
              description: 'Cooperar en áreas específicas, mantener autonomía',
              requiredAttributes: { strategy: 30, communication: 28, wisdom: 25 },
              consequences: {
                success: { knowledge: +15, action: +12, cohesion: +10 },
                failure: { knowledge: +5, action: -5, cohesion: -8 }
              },
              successMessage: 'Balance perfecto. Lo mejor de ambos mundos. Relación sostenible.',
              failureMessage: 'Expectativas desalineadas. Beneficios limitados. Relación fría.'
            },
            {
              label: 'Intercambio Cultural',
              description: 'Enfoque en aprendizaje mutuo sin compromisos políticos',
              requiredAttributes: { curiosity: 30, empathy: 28, communication: 25 },
              consequences: {
                success: { knowledge: +18, cohesion: +12, consciousness: +10 },
                failure: { knowledge: +8, cohesion: -5, confusion: +5 }
              },
              successMessage: 'Horizontes expandidos. Perspectivas enriquecidas. Amistad profunda.',
              failureMessage: 'Intercambio superficial. Turismo cultural. Poco impacto real.'
            },
            {
              label: 'Declinar Respetuosamente',
              description: 'Agradecer pero mantener independencia total',
              requiredAttributes: { courage: 25, wisdom: 25, autonomy: 30 },
              consequences: {
                success: { cohesion: +10, autonomy: +15, clarity: +10 },
                failure: { cohesion: +5, isolation: +15, opportunities: -10 }
              },
              successMessage: 'Camino propio reafirmado. Fuerza en independencia. Respeto mutuo.',
              failureMessage: 'Oportunidad perdida. Vecinos ofendidos. Aislamiento crece.'
            }
          ]
        },
        {
          id: 'knowledge-discovery',
          name: 'Hallazgo de Sabiduría Ancestral',
          description: 'Se descubre archivo con conocimiento profundo olvidado.',
          icon: '📜',
          type: 'opportunity',
          difficulty: 'easy',
          narrative: 'Excavando, encuentran biblioteca enterrada. Textos antiguos, mapas, diagramas. ¿Cómo proceder?',
          options: [
            {
              label: 'Estudio Académico',
              description: 'Análisis sistemático y riguroso del contenido',
              requiredAttributes: { analysis: 30, wisdom: 28, patience: 25 },
              consequences: {
                success: { knowledge: +25, consciousness: +15, wisdom: +10 },
                failure: { knowledge: +10, time: -10, frustration: +5 }
              },
              successMessage: 'Décadas de sabiduría destiladas. Paradigma expandido. Iluminación.',
              failureMessage: 'Textos crípticos resisten análisis. Frustración. Conocimiento parcial.'
            },
            {
              label: 'Aplicación Inmediata',
              description: 'Implementar técnicas descritas directamente',
              requiredAttributes: { action: 35, courage: 30, technical: 25 },
              consequences: {
                success: { action: +20, health: +15, knowledge: +10 },
                failure: { health: -15, action: -10, caution: +10 }
              },
              successMessage: 'Técnicas ancestrales funcionan! Saltos de progreso. Eficiencia aumentada.',
              failureMessage: 'Aplicación prematura causa problemas. Contexto importa. Lección aprendida.'
            },
            {
              label: 'Divulgación Pública',
              description: 'Compartir conocimiento ampliamente con todos',
              requiredAttributes: { communication: 30, generosity: 28, trust: 25 },
              consequences: {
                success: { cohesion: +20, knowledge: +15, empowerment: +15 },
                failure: { chaos: +15, knowledge: -5, overwhelm: +10 }
              },
              successMessage: 'Democratización del saber. Florecimiento colectivo. Renacimiento.',
              failureMessage: 'Información sin guía abruma. Malinterpretaciones. Confusión masiva.'
            }
          ]
        }
      ],

      // ========== DILEMAS ÉTICOS ==========
      dilemma: [
        {
          id: 'pioneer-departure',
          name: 'El Dilema del Pionero',
          description: 'Un ser brillante quiere abandonar la comunidad para explorar solo.',
          icon: '🚶',
          type: 'dilemma',
          difficulty: 'medium',
          narrative: '"He aprendido todo lo posible aquí. Mi destino está más allá. Déjenme ir, o me consumiré en frustración."',
          options: [
            {
              label: 'Bendecir su Partida',
              description: 'Despedir con gratitud y recursos para el viaje',
              requiredAttributes: { wisdom: 30, generosity: 28, courage: 25 },
              consequences: {
                success: { cohesion: +10, knowledge: +15, network: +10 },
                failure: { cohesion: -15, loss: +10, nostalgia: +5 }
              },
              successMessage: 'Pionero regresa eventualmente con tesoros de sabiduría. Inversión retornada.',
              failureMessage: 'Nunca más se supo de él. Talento perdido. Melancolía colectiva.'
            },
            {
              label: 'Convencer de Quedarse',
              description: 'Apelar a responsabilidad comunitaria y necesidad',
              requiredAttributes: { empathy: 35, communication: 32, leadership: 28 },
              consequences: {
                success: { cohesion: +20, knowledge: +10, retention: +15 },
                failure: { cohesion: -20, resentment: +15, productivity: -10 }
              },
              successMessage: 'Pionero encuentra propósito renovado. Lidera innovación interna.',
              failureMessage: 'Se queda por obligación, no convicción. Energía apagada. Todos pierden.'
            },
            {
              label: 'Expedición Grupal',
              description: 'Organizar misión de exploración colectiva',
              requiredAttributes: { leadership: 35, organization: 30, strategy: 28 },
              consequences: {
                success: { action: +20, cohesion: +15, knowledge: +15, health: +10 },
                failure: { health: -20, cohesion: -10, action: -15 }
              },
              successMessage: 'Expedición exitosa. Nuevos horizontes. Todos crecen juntos.',
              failureMessage: 'Misión mal preparada. Pérdidas. Regreso prematuro. Traumático.'
            }
          ]
        },
        {
          id: 'resource-inequality',
          name: 'Desigualdad Emergente',
          description: 'Algunos seres acumulan más recursos que otros. Tensión social crece.',
          icon: '⚖️',
          type: 'dilemma',
          difficulty: 'hard',
          narrative: 'La meritocracia ha creado élite. ¿Es justo? ¿Inevitable? ¿Peligroso? Voces demandan cambio.',
          options: [
            {
              label: 'Redistribución Radical',
              description: 'Igualar recursos inmediatamente por decreto',
              requiredAttributes: { courage: 40, justice: 35, organization: 30 },
              consequences: {
                success: { cohesion: +25, equality: +20, controversy: +10 },
                failure: { cohesion: -30, productivity: -20, rebellion: +15 }
              },
              successMessage: 'Igualdad restaurada. Élite cede pacíficamente. Nueva era de cooperación.',
              failureMessage: 'Élite resiste. Conflicto abierto. Sociedad fracturada. Caos.'
            },
            {
              label: 'Impuesto Progresivo',
              description: 'Los que más tienen contribuyen más al bien común',
              requiredAttributes: { strategy: 35, communication: 30, mathematics: 25 },
              consequences: {
                success: { cohesion: +15, health: +15, sustainability: +10 },
                failure: { cohesion: -10, elite_flight: +15, resources: -10 }
              },
              successMessage: 'Sistema justo implementado. Redistribución gradual. Consenso logrado.',
              failureMessage: 'Élite emigra con recursos. Fuga de talento. Economía debilitada.'
            },
            {
              label: 'Meritocracia con Redes',
              description: 'Mantener meritocracia pero con red de seguridad social robusta',
              requiredAttributes: { wisdom: 38, empathy: 32, organization: 30 },
              consequences: {
                success: { cohesion: +18, productivity: +15, safety_net: +20 },
                failure: { cohesion: -15, inequality: +10, dissatisfaction: +15 }
              },
              successMessage: 'Balance logrado. Incentivos + seguridad. Todos ganan. Modelo sostenible.',
              failureMessage: 'Red de seguridad insuficiente. Desigualdad persiste. Resentimiento crece.'
            }
          ]
        }
      ],

      // ========== TRANSFORMACIONES ==========
      transformation: [
        {
          id: 'collective-awakening',
          name: 'Despertar Colectivo',
          description: 'La sociedad alcanza un nuevo nivel de conciencia simultáneamente.',
          icon: '🌟',
          type: 'transformation',
          difficulty: 'hard',
          narrative: 'Como si un velo cayera. Todos ven con claridad. Interconexión. Propósito. ¿Qué hacer con esta gracia?',
          options: [
            {
              label: 'Integración Silenciosa',
              description: 'Permitir que el cambio se asimile naturalmente sin forzar',
              requiredAttributes: { wisdom: 45, patience: 40, consciousness: 38 },
              consequences: {
                success: { consciousness: +30, knowledge: +20, cohesion: +20, peace: +25 },
                failure: { consciousness: +15, impatience: +10, confusion: +5 }
              },
              successMessage: 'El cambio se enraiza profundo. Transformación auténtica. Nueva era.',
              failureMessage: 'Momento fugaz. Retorno a lo ordinario. Melancolía post-despertar.'
            },
            {
              label: 'Acción Inmediata',
              description: 'Canalizar el insight hacia cambios estructurales urgentes',
              requiredAttributes: { action: 45, courage: 40, leadership: 35 },
              consequences: {
                success: { action: +30, cohesion: +20, revolution: +25, health: +15 },
                failure: { action: -20, cohesion: -15, burnout: +20 }
              },
              successMessage: 'Transformación radical implementada. Sistemas renovados. Potencial liberado.',
              failureMessage: 'Acción prematura. Insight perdido en activismo frenético. Agotamiento.'
            },
            {
              label: 'Documentación Sagrada',
              description: 'Registrar la experiencia para futuras generaciones',
              requiredAttributes: { wisdom: 42, communication: 38, reflection: 35 },
              consequences: {
                success: { knowledge: +25, legacy: +30, consciousness: +15, cohesion: +10 },
                failure: { knowledge: +10, attachment: +15, living: -10 }
              },
              successMessage: 'Texto sagrado creado. Sabiduría preservada. Faro para el futuro.',
              failureMessage: 'Obsesión por documentar mata el momento. Vivir > describir.'
            }
          ]
        }
      ]
    };
  }

  /**
   * Obtener evento aleatorio
   */
  getRandomEvent(type = null, difficulty = null) {
    let pool = [];

    if (type) {
      pool = this.eventTemplates[type] || [];
    } else {
      // Mezclar todos los tipos
      Object.values(this.eventTemplates).forEach(typeEvents => {
        pool = pool.concat(typeEvents);
      });
    }

    // Filtrar por dificultad si se especifica
    if (difficulty) {
      pool = pool.filter(e => e.difficulty === difficulty);
    }

    if (pool.length === 0) {
      // logger.warn('No events found for criteria');
      return null;
    }

    return pool[Math.floor(Math.random() * pool.length)];
  }

  /**
   * Evaluar opción elegida
   */
  evaluateChoice(event, optionIndex, society) {
    const option = event.options[optionIndex];
    if (!option) return null;

    // Calcular atributos de la sociedad
    const societyAttributes = this.calculateSocietyAttributes(society);

    // Verificar si cumple requerimientos
    let totalRequired = 0;
    let totalHas = 0;

    Object.entries(option.requiredAttributes).forEach(([attr, required]) => {
      totalRequired += required;
      totalHas += Math.min(societyAttributes[attr] || 0, required);
    });

    const successRate = totalHas / totalRequired;
    const success = successRate >= 0.7;

    // Aplicar consecuencias
    const consequences = success ? option.consequences.success : option.consequences.failure;
    const message = success ? option.successMessage : option.failureMessage;

    // Registrar en historia
    this.eventHistory.push({
      timestamp: Date.now(),
      turn: society.turn,
      eventId: event.id,
      eventName: event.name,
      optionChosen: option.label,
      success,
      successRate,
      consequences
    });

    return {
      success,
      successRate,
      consequences,
      message,
      option: option.label
    };
  }

  /**
   * Calcular atributos agregados de la sociedad
   */
  calculateSocietyAttributes(society) {
    const aliveBeings = society.beings.filter(b => b.alive);
    const aggregated = {};

    aliveBeings.forEach(being => {
      Object.entries(being.attributes || {}).forEach(([attr, value]) => {
        aggregated[attr] = (aggregated[attr] || 0) + value;
      });
    });

    return aggregated;
  }

  /**
   * Obtener historia de eventos
   */
  getHistory(limit = 20) {
    return this.eventHistory.slice(-limit).reverse();
  }

  /**
   * Estadísticas de eventos
   */
  getStats() {
    const total = this.eventHistory.length;
    const successful = this.eventHistory.filter(e => e.success).length;
    const failed = total - successful;

    return {
      total,
      successful,
      failed,
      successRate: total > 0 ? (successful / total) * 100 : 0
    };
  }
}

// Exportar
window.EventsSystem = EventsSystem;
// logger.debug('🎲 Sistema de Eventos con Opciones cargado');
