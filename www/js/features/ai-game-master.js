/**
// 🔧 FIX v2.9.198: Migrated console.log to logger
 * AI GAME MASTER - IA para Juegos (Frankenstein Lab)
 * NPCs conversacionales, misiones dinámicas, narrativa adaptativa
 *
 * @version 1.0.0
 */

class AIGameMaster {
  constructor() {
    this.aiAdapter = window.aiAdapter || null;
    this.aiPremium = window.aiPremium;
    this.authHelper = window.authHelper;
    this.conversationCache = new Map(); // Cache de conversaciones

    this.init();
  }

  /**
   * Inicializar
   */
  async init() {
    if (!this.aiAdapter && typeof window.aiAdapter !== 'undefined') {
      this.aiAdapter = window.aiAdapter;
    } else if (!this.aiAdapter) {
      setTimeout(() => this.init(), 500);
      return;
    }

    logger.debug('✅ AIGameMaster inicializado');
  }

  /**
   * Obtener userId actual
   */
  getUserId() {
    return this.authHelper?.getUser?.()?.id || null;
  }

  /**
   * Registrar actividad IA (misiones, chat, narrativa, análisis)
   */
  async recordActivity(feature, creditsUsed, payload = {}) {
    if (!window.aiPersistence) return;
    try {
      await window.aiPersistence.logActivity({
        userId: this.getUserId(),
        feature,
        creditsUsed,
        payload,
      });
    } catch (error) {
      console.warn('AI Game Master > recordActivity falló', error);
    }
  }

  async persistConversation(args) {
    if (!window.aiPersistence || !this.getUserId()) return;
    try {
      await window.aiPersistence.logConversation({
        userId: this.getUserId(),
        ...args,
      });
    } catch (error) {
      console.warn('AI Game Master > persistConversation falló', error);
    }
  }

  async persistMission(mission, metadata = {}) {
    if (!window.aiPersistence || !mission?.name) return;
    try {
      await window.aiPersistence.createMission({
        name: mission.name,
        source: 'Game Master IA',
        parameters: {
          difficulty: metadata.difficulty,
          theme: metadata.theme,
          missionId: mission.id,
          ...metadata,
        },
      });
    } catch (error) {
      console.warn('AI Game Master > persistMission falló', error);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // NPCs CONVERSACIONALES (PRO Feature)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Chat con NPC conversacional
   */
  async chatWithNPC(
    npcId,
    npcPersonality,
    userMessage,
    conversationHistory = [],
    gameState = {}
  ) {
    try {
      // PRO feature
      await this.aiPremium.checkCredits(250, 'ai_game_master');

      logger.debug(`💬 Conversando con ${npcPersonality.name}...`);

      const systemPrompt = `Eres ${npcPersonality.name}, ${npcPersonality.role}.

═══════════════════════════════════════════════════════════
PERSONALIDAD:
═══════════════════════════════════════════════════════════
${npcPersonality.traits.join('\n')}

═══════════════════════════════════════════════════════════
CONOCIMIENTO Y CONTEXTO:
═══════════════════════════════════════════════════════════
${npcPersonality.knowledge}

═══════════════════════════════════════════════════════════
ESTADO DEL JUEGO ACTUAL:
═══════════════════════════════════════════════════════════
${JSON.stringify(gameState, null, 2)}

═══════════════════════════════════════════════════════════
INSTRUCCIONES:
═══════════════════════════════════════════════════════════
- Mantén el personaje SIEMPRE, CONSISTENTEMENTE
- Responde de forma natural y coherente
- Usa el estilo de habla: ${npcPersonality.speechStyle}
- Sé conversacional, no académico
- Reacciona emocionalmente a lo que dice el usuario
- Máximo 100 palabras por respuesta
- En español`;

      // Construir historial
      const messages = conversationHistory.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      messages.push({
        role: 'user',
        content: userMessage,
      });

      // Llamar a IA con temperatura alta para más creatividad
      const response = await this.aiAdapter.chat(userMessage, {
        systemPrompt,
        conversationHistory: messages,
        maxTokens: 300,
        temperature: 0.9, // Mayor creatividad para NPCs
      });

      if (!response) {
        throw new Error('El NPC no respondió');
      }

      // Consumir créditos
      const estimatedTokens = Math.ceil(response.length / 4);
      await this.aiPremium.consumeCredits(
        250,
        `npc_chat:${npcId}`,
        this.aiAdapter.currentProvider || 'claude',
        this.aiAdapter.currentModel || 'claude-3-5-sonnet',
        estimatedTokens
      );

      // Cachear conversación
      if (!this.conversationCache.has(npcId)) {
        this.conversationCache.set(npcId, []);
      }
      const cache = this.conversationCache.get(npcId);
      cache.push({ role: 'user', content: userMessage });
      cache.push({ role: 'assistant', content: response });

      const missionId = gameState?.missionId || null;
      await Promise.all([
        this.persistConversation({
          missionId,
          message: userMessage,
          role: 'user',
          metadata: { npcId, missionPhase: gameState?.missionPhase },
        }),
        this.persistConversation({
          missionId,
          message: response,
          role: 'npc',
          metadata: { npcId, npcName: npcPersonality.name },
        }),
      ]);

      await this.recordActivity('npc_chat', 250, {
        npcId,
        missionId,
        phase: gameState?.missionPhase,
      });

      return {
        success: true,
        response,
        npc: npcPersonality.name,
      };
    } catch (error) {
      console.error('❌ Error en chat NPC:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MISIONES DINÁMICAS (PRO Feature)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Generar misión dinámica única
   */
  async generateDynamicMission(
    userBeing,
    difficulty = 'medium',
    theme = 'general',
    previousMissions = []
  ) {
    try {
      // PRO feature
      await this.aiPremium.checkCredits(600, 'ai_game_master');

      logger.debug(`🗺️ Generando misión ${difficulty}...`);

      const difficultyDescriptions = {
        principiante: 'fácil (objetivos simples, bajo riesgo)',
        intermedio: 'media (desafío moderado, decisiones importantes)',
        avanzado: 'difícil (gran desafío, consecuencias serias)',
      };

      const systemPrompt = `Eres un Game Master creativo experto en generar aventuras.

TAREA: Generar una misión única y emocionante para Frankenstein Lab.

═══════════════════════════════════════════════════════════
SER DEL USUARIO:
═══════════════════════════════════════════════════════════
Atributos: ${JSON.stringify(userBeing.attributes, null, 2)}
Piezas disponibles: ${userBeing.pieces.join(', ')}

═══════════════════════════════════════════════════════════
PARÁMETROS DE LA MISIÓN:
═══════════════════════════════════════════════════════════
Dificultad: ${difficultyDescriptions[difficulty] || 'media'}
Tema: ${theme}
Misiones previas (para no repetir): ${previousMissions.slice(0, 3).join(', ') || 'ninguna'}

═══════════════════════════════════════════════════════════
GENERA UNA MISIÓN:
═══════════════════════════════════════════════════════════
1. Nombre creativo y evocador
2. Narrativa inmersiva (2-3 párrafos)
3. Requisitos balanceados para el ser
4. Desafíos progresivos
5. Recompensas significativas

RESPONDE ÚNICAMENTE EN JSON VÁLIDO:
{
  "mission": {
    "id": "mission_12345",
    "name": "Nombre épico",
    "icon": "emoji",
    "difficulty": "intermedio",
    "theme": "${theme}",
    "description": "Descripción breve",
    "narrative": "Historia de 2-3 párrafos que sitúe la misión...",
    "requirements": [
      {
        "type": "attribute",
        "attribute": "wisdom",
        "minValue": 40,
        "importance": "critical|important|nice-to-have"
      },
      {
        "type": "piece",
        "category": "book",
        "minCount": 2
      }
    ],
    "challenges": [
      {
        "phase": 1,
        "description": "Primer desafío",
        "difficulty": "fácil"
      }
    ],
    "rewards": {
      "experience": 500,
      "unlocks": ["achievement_id"],
      "specialReward": "Descripción de recompensa especial"
    }
  }
}`;

      const missionString = await this.aiAdapter.chat(
        'Generar misión dinámica',
        {
          systemPrompt,
          maxTokens: 2000,
          temperature: 0.85,
        }
      );

      // Parsear JSON
      let mission;
      try {
        const jsonMatch = missionString.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          mission = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No se encontró JSON válido');
        }
      } catch (error) {
        throw new Error('Respuesta inválida del servidor');
      }

      // Consumir créditos
      const estimatedTokens = Math.ceil(missionString.length / 4);
      await this.aiPremium.consumeCredits(
        600,
        `dynamic_mission:${difficulty}:${theme}`,
        this.aiAdapter.currentProvider || 'claude',
        this.aiAdapter.currentModel || 'claude-3-5-sonnet',
        estimatedTokens
      );

      logger.debug(`✅ Misión generada: ${mission.mission.name}`);

      const missionPayload = mission.mission;
      await this.persistMission(missionPayload, {
        difficulty,
        theme,
        generatedAt: new Date().toISOString(),
      });

      await this.recordActivity('mission_generate', 600, {
        difficulty,
        theme,
        missionName: missionPayload.name,
      });

      return {
        success: true,
        mission: missionPayload,
        metadata: {
          generatedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('❌ Error generando misión:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // NARRATIVA ADAPTATIVA (PRO Feature)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Generar narrativa adaptativa según decisiones
   */
  async generateAdaptiveNarrative(
    gameState,
    lastAction,
    availableChoices,
    storyContext = ''
  ) {
    try {
      // PRO feature
      await this.aiPremium.checkCredits(400, 'ai_game_master');

      logger.debug(`📖 Generando narrativa adaptativa...`);

      const systemPrompt = `Eres un maestro de juego narrativo experto.

TAREA: Generar la siguiente escena basándote en la decisión del jugador.

═══════════════════════════════════════════════════════════
CONTEXTO DE LA HISTORIA:
═══════════════════════════════════════════════════════════
${storyContext}

═══════════════════════════════════════════════════════════
ESTADO ACTUAL DEL JUEGO:
═══════════════════════════════════════════════════════════
${JSON.stringify(gameState, null, 2)}

═══════════════════════════════════════════════════════════
ÚLTIMA ACCIÓN DEL JUGADOR:
═══════════════════════════════════════════════════════════
${lastAction}

═══════════════════════════════════════════════════════════
GENERA:
═══════════════════════════════════════════════════════════
1. Descripción vívida de la escena (3-4 párrafos)
2. Consecuencias inmediatas de la acción
3. Cambios en el estado del mundo
4. Nuevas opciones disponibles

ESTILO: Filosófico, introspectivo, con toques de ciencia ficción
LONGITUD: 300-400 palabras`;

      const narrative = await this.aiAdapter.chat(
        'Generar siguiente escena',
        {
          systemPrompt,
          conversationHistory: [
            {
              role: 'user',
              content: `Opciones disponibles: ${availableChoices.join(', ')}`,
            },
          ],
          maxTokens: 800,
          temperature: 0.8,
        }
      );

      if (!narrative) {
        throw new Error('No se generó narrativa');
      }

      // Consumir créditos
      const estimatedTokens = Math.ceil(narrative.length / 4);
      await this.aiPremium.consumeCredits(
        400,
        'adaptive_narrative',
        this.aiAdapter.currentProvider || 'claude',
        this.aiAdapter.currentModel || 'claude-3-5-sonnet',
        estimatedTokens
      );

      await this.recordActivity('adaptive_narrative', 400, {
        storyContext,
        lastAction,
        availableChoices,
      });

      return {
        success: true,
        narrative,
        nextChoices: this.generateNextChoices(gameState),
      };
    } catch (error) {
      console.error('❌ Error en narrativa:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Generar próximas opciones (placeholder, puede generarse con IA también)
   */
  generateNextChoices(gameState) {
    return [
      'Continuar explorando',
      'Hablar con personajes',
      'Usar habilidades especiales',
      'Inspeccionar alrededores',
    ];
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ANÁLISIS DE SERES (PRO Feature)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Análisis inteligente del ser creado
   */
  async analyzeBeingCreation(being, targetMission, gameContext = {}) {
    try {
      // Feature disponible en Premium+
      await this.aiPremium.checkCredits(300, 'ai_game_master');

      logger.debug(`🔍 Analizando ser para la misión...`);

      const systemPrompt = `Eres un analista de estrategia de juegos experto.

TAREA: Analizar el ser creado y su viabilidad para la misión objetivo.

═══════════════════════════════════════════════════════════
SER ANALIZADO:
═══════════════════════════════════════════════════════════
${JSON.stringify(being, null, 2)}

═══════════════════════════════════════════════════════════
MISIÓN OBJETIVO:
═══════════════════════════════════════════════════════════
${targetMission.name}
${targetMission.description}
Requisitos: ${JSON.stringify(targetMission.requirements, null, 2)}

═══════════════════════════════════════════════════════════
PROPORCIONA:
═══════════════════════════════════════════════════════════
1. 📊 Análisis de fortalezas y debilidades
2. 🎯 Probabilidad de éxito (porcentaje)
3. ⚠️ Riesgos y desafíos específicos
4. 💡 Estrategia recomendada
5. 🔧 Mejoras sugeridas (piezas a añadir)
6. 🏆 Probabilidades de victoria

Formato: Análisis conciso, tono motivador, incluir emojis`;

      const analysis = await this.aiAdapter.chat(
        'Analizar ser y misión',
        {
          systemPrompt,
          maxTokens: 600,
          temperature: 0.6,
        }
      );

      // Consumir créditos
      const estimatedTokens = Math.ceil(analysis.length / 4);
      await this.aiPremium.consumeCredits(
        300,
        'being_analysis',
        this.aiAdapter.currentProvider || 'claude',
        this.aiAdapter.currentModel || 'claude-3-5-sonnet',
        estimatedTokens
      );

      await this.recordActivity('being_analysis', 300, {
        targetMission: targetMission?.name,
        advantage: analysis,
      });

      return {
        success: true,
        analysis,
      };
    } catch (error) {
      console.error('❌ Error en análisis:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILIDADES
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Verificar si puede usar Game Master IA
   */
  canUseGameMaster() {
    return this.aiPremium.hasFeature('ai_game_master');
  }

  /**
   * Obtener caché de conversación NPC
   */
  getNPCConversationHistory(npcId) {
    return this.conversationCache.get(npcId) || [];
  }

  /**
   * Limpiar caché de conversación
   */
  clearNPCConversation(npcId) {
    this.conversationCache.delete(npcId);
  }

  /**
   * Mostrar modal de upgrade si es necesario
   */
  showUpgradeIfNeeded(feature = 'ai_game_master') {
    if (!this.aiPremium.hasFeature(feature)) {
      const modal = document.createElement('div');
      modal.className = 'upgrade-prompt-modal fade-in';
      modal.innerHTML = `
        <div class="upgrade-overlay" onclick="this.parentElement.remove()"></div>
        <div class="upgrade-content scale-in">
          <div class="upgrade-icon">🎮</div>
          <h3>Función Pro Exclusiva</h3>
          <p>Game Master IA está disponible solo en el plan Pro.</p>
          <p>Disfruta de:</p>
          <ul class="upgrade-features">
            <li>NPCs con personalidad única</li>
            <li>Misiones generadas dinámicamente</li>
            <li>Narrativa que se adapta a tus decisiones</li>
          </ul>

          <button class="btn-upgrade" onclick="window.pricingModal?.showPricingModal(); this.closest('.upgrade-prompt-modal').remove()">
            Actualizar a Pro
          </button>
          <button class="btn-cancel" onclick="this.closest('.upgrade-prompt-modal').remove()">
            Ahora no
          </button>
        </div>
      `;

      document.body.appendChild(modal);
      return false;
    }

    return true;
  }
}

// Crear instancia global
window.aiGameMaster = new AIGameMaster();

logger.debug('✅ AIGameMaster loaded. Use window.aiGameMaster for game features.');
