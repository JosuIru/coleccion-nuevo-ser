/**
// 🔧 FIX v2.9.198: Migrated console.log to logger
 * AI BOOK FEATURES - IA para Lectura y Aprendizaje
 * Chat sobre libros, quizzes personalizados, resúmenes inteligentes
 *
 * @version 1.0.0
 */

class AIBookFeatures {
  constructor() {
    this.aiAdapter = window.aiAdapter || null;
    this.aiPremium = window.aiPremium;
    this.authHelper = window.authHelper;

    this.init();
  }

  /**
   * Inicializar
   */
  async init() {
    // Esperar a que AIAdapter esté disponible
    if (!this.aiAdapter && typeof window.aiAdapter !== 'undefined') {
      this.aiAdapter = window.aiAdapter;
    } else if (!this.aiAdapter) {
      setTimeout(() => this.init(), 500);
      return;
    }

    logger.debug('✅ AIBookFeatures inicializado');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CHAT SOBRE LIBROS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Chat IA contextual sobre el contenido del libro
   */
  async chatAboutBook(
    bookId,
    chapterId,
    userQuestion,
    bookContext,
    conversationHistory = []
  ) {
    try {
      // Verificar autenticación y features
      await this.aiPremium.checkCredits(250, 'ai_chat');

      logger.debug(`💬 Chat sobre ${bookContext.title} - Capítulo ${chapterId}`);

      const systemPrompt = `Eres un tutor experto sobre el libro "${bookContext.title}".
El usuario está leyendo el capítulo: "${bookContext.chapterTitle}"

═══════════════════════════════════════════════════════════
CONTEXTO DEL CAPÍTULO:
═══════════════════════════════════════════════════════════
${bookContext.chapterContent}

═══════════════════════════════════════════════════════════
TU ROL:
═══════════════════════════════════════════════════════════
- Responde preguntas sobre el contenido específico
- Proporciona explicaciones claras y profundas
- Haz conexiones con conceptos previos del libro
- Sugiere reflexiones y aplicaciones prácticas
- Mantén un tono filosófico, educativo y accesible
- Máximo 300 palabras por respuesta

═══════════════════════════════════════════════════════════
RESPONDE EN ESPAÑOL Y SÉ CONVERSACIONAL
═══════════════════════════════════════════════════════════`;

      // Construir historial de conversación
      const messages = conversationHistory.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      messages.push({
        role: 'user',
        content: userQuestion,
      });

      // Llamar a IA
      const response = await this.aiAdapter.chat(userQuestion, {
        systemPrompt,
        conversationHistory: messages,
        maxTokens: 800,
        temperature: 0.7,
      });

      if (!response) {
        throw new Error('Sin respuesta del servidor de IA');
      }

      // Estimar tokens y consumir créditos
      const estimatedTokens = Math.ceil(response.length / 4);
      await this.aiPremium.consumeCredits(
        250,
        `book_chat:${bookId}:${chapterId}`,
        this.aiAdapter.currentProvider || 'claude',
        this.aiAdapter.currentModel || 'claude-3-5-sonnet',
        estimatedTokens
      );

      logger.debug(`✅ Respuesta generada (${estimatedTokens} tokens)`);

      return {
        success: true,
        response,
        context: `${bookContext.title} - ${bookContext.chapterTitle}`,
      };
    } catch (error) {
      logger.error('❌ Error en chat:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // QUIZZES PERSONALIZADOS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Generar quiz personalizado basado en el contenido
   */
  async generatePersonalizedQuiz(
    bookId,
    chapterId,
    chapterContent,
    chapterTitle,
    difficulty = 'medium',
    numQuestions = 5
  ) {
    try {
      // Verificar permisos
      await this.aiPremium.checkCredits(400, 'ai_tutor');

      logger.debug(
        `📝 Generando quiz ${difficulty} con ${numQuestions} preguntas...`
      );

      const difficultyDescriptions = {
        easy: 'fácil (conceptos básicos, definiciones)',
        medium: 'intermedia (comprensión, análisis)',
        hard: 'difícil (aplicación, síntesis, evaluación crítica)',
      };

      const systemPrompt = `Eres un experto en crear evaluaciones educativas de alta calidad.

TAREA: Generar un quiz de ${numQuestions} preguntas de dificultad ${difficultyDescriptions[difficulty] || 'media'}.

═══════════════════════════════════════════════════════════
CONTENIDO A EVALUAR:
═══════════════════════════════════════════════════════════
Capítulo: ${chapterTitle}
${chapterContent}

═══════════════════════════════════════════════════════════
INSTRUCCIONES:
═══════════════════════════════════════════════════════════
1. Crea preguntas que evalúen comprensión profunda
2. Incluye explicaciones detalladas para cada respuesta
3. Varía los tipos de preguntas (opción múltiple, V/F)
4. Las respuestas incorrectas deben ser plausibles
5. Proporciona feedback educativo

RESPONDE ÚNICAMENTE EN JSON VÁLIDO (sin markdown):
{
  "quiz": {
    "title": "Quiz: ${chapterTitle}",
    "difficulty": "${difficulty}",
    "questions": [
      {
        "id": 1,
        "type": "multiple_choice",
        "question": "¿Pregunta aquí?",
        "options": [
          "Opción A (correcta)",
          "Opción B (plausible)",
          "Opción C (plausible)",
          "Opción D (plausible)"
        ],
        "correctAnswer": 0,
        "explanation": "Explicación detallada de por qué es correcta...",
        "difficultyLevel": "media"
      }
    ]
  }
}`;

      const quizString = await this.aiAdapter.chat(
        `Contenido del capítulo: ${chapterTitle}`,
        {
          systemPrompt,
          maxTokens: 2000,
          temperature: 0.8,
        }
      );

      // Parsear JSON
      let quiz;
      try {
        // Intentar encontrar JSON en la respuesta
        const jsonMatch = quizString.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          quiz = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No se encontró JSON válido en la respuesta');
        }
      } catch (parseError) {
        logger.error('Error parseando JSON:', parseError);
        throw new Error(
          'Respuesta inválida del servidor de IA: ' + quizString.substring(0, 100)
        );
      }

      // Consumir créditos
      const estimatedTokens = Math.ceil(quizString.length / 4);
      await this.aiPremium.consumeCredits(
        400,
        `quiz_generation:${bookId}:${chapterId}`,
        this.aiAdapter.currentProvider || 'claude',
        this.aiAdapter.currentModel || 'claude-3-5-sonnet',
        estimatedTokens
      );

      logger.debug(`✅ Quiz generado con ${quiz.quiz.questions.length} preguntas`);

      return {
        success: true,
        quiz: quiz.quiz,
        metadata: {
          bookId,
          chapterId,
          generatedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      logger.error('❌ Error generando quiz:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RESÚMENES INTELIGENTES
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Generar resumen inteligente del capítulo
   */
  async generateChapterSummary(
    chapterId,
    chapterContent,
    chapterTitle,
    length = 'medium'
  ) {
    try {
      // Feature disponible en Premium+
      await this.aiPremium.checkCredits(200, 'ai_tutor');

      logger.debug(`📚 Generando resumen ${length}...`);

      const lengthDescriptions = {
        short: '2-3 párrafos breves',
        medium: '4-5 párrafos moderados',
        long: 'análisis exhaustivo (6-8 párrafos)',
      };

      const systemPrompt = `Eres un escritor académico experto en resumir contenido complejo.

TAREA: Generar un resumen ${lengthDescriptions[length]} del siguiente capítulo.

═══════════════════════════════════════════════════════════
CAPÍTULO: ${chapterTitle}
═══════════════════════════════════════════════════════════
${chapterContent}

═══════════════════════════════════════════════════════════
INCLUYE:
═══════════════════════════════════════════════════════════
1. 📌 Ideas principales y conceptos clave
2. 🔗 Conexiones con otros temas del libro
3. 💡 Implicaciones prácticas y aplicaciones
4. ❓ Preguntas para reflexión personal
5. 🎯 Puntos de acción o aprendizajes clave

ESCRIBIR EN ESPAÑOL, ESTILO ACADÉMICO PERO ACCESIBLE`;

      const summary = await this.aiAdapter.chat(
        `Resumir: ${chapterTitle}`,
        {
          systemPrompt,
          maxTokens: length === 'long' ? 1200 : length === 'medium' ? 800 : 400,
          temperature: 0.6,
        }
      );

      // Consumir créditos
      const estimatedTokens = Math.ceil(summary.length / 4);
      await this.aiPremium.consumeCredits(
        200,
        `chapter_summary:${chapterId}`,
        this.aiAdapter.currentProvider || 'claude',
        this.aiAdapter.currentModel || 'claude-3-5-sonnet',
        estimatedTokens
      );

      return {
        success: true,
        summary,
        metadata: {
          chapterId,
          length,
          generatedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      logger.error('❌ Error generando resumen:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EJERCICIOS PERSONALIZADOS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Generar ejercicios basados en progreso del usuario
   */
  async generatePersonalizedExercises(
    bookId,
    userProgress,
    weakAreas = [],
    numExercises = 3
  ) {
    try {
      // Premium+ feature
      await this.aiPremium.checkCredits(500, 'ai_tutor');

      logger.debug(`🎯 Generando ${numExercises} ejercicios personalizados...`);

      const systemPrompt = `Eres un diseñador instruccional experto en crear ejercicios personalizados.

TAREA: Generar ${numExercises} ejercicios prácticos personalizados basados en el progreso del usuario.

═══════════════════════════════════════════════════════════
PROGRESO DEL USUARIO:
═══════════════════════════════════════════════════════════
${JSON.stringify(userProgress, null, 2)}

ÁREAS A REFORZAR:
${weakAreas.join(', ') || 'Todas las áreas'}

═══════════════════════════════════════════════════════════
CARACTERÍSTICAS DE LOS EJERCICIOS:
═══════════════════════════════════════════════════════════
1. Progresión de fácil a difícil
2. Actividades prácticas y aplicadas
3. Incluir duración estimada
4. Pasos claros y detallados
5. Indicadores de completitud

RESPONDER ÚNICAMENTE EN JSON VÁLIDO:
{
  "exercises": [
    {
      "id": 1,
      "title": "Título del ejercicio",
      "type": "reflexión|práctica|análisis|debate",
      "difficulty": "fácil|media|difícil",
      "estimatedTime": "15-20 minutos",
      "description": "Descripción breve",
      "steps": [
        "Paso 1...",
        "Paso 2..."
      ],
      "successCriteria": "Cómo saber si lo hiciste bien",
      "reflection": "Preguntas para reflexionar después"
    }
  ]
}`;

      const exercisesString = await this.aiAdapter.chat(
        `Generar ejercicios personalizados`,
        {
          systemPrompt,
          maxTokens: 2000,
          temperature: 0.75,
        }
      );

      // Parsear JSON
      let exercises;
      try {
        const jsonMatch = exercisesString.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          exercises = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No se encontró JSON válido');
        }
      } catch (error) {
        throw new Error(
          'Respuesta inválida del servidor: ' + exercisesString.substring(0, 100)
        );
      }

      // Consumir créditos
      const estimatedTokens = Math.ceil(exercisesString.length / 4);
      await this.aiPremium.consumeCredits(
        500,
        `personalized_exercises:${bookId}`,
        this.aiAdapter.currentProvider || 'claude',
        this.aiAdapter.currentModel || 'claude-3-5-sonnet',
        estimatedTokens
      );

      logger.debug(`✅ ${exercises.exercises.length} ejercicios generados`);

      return {
        success: true,
        exercises: exercises.exercises,
        metadata: {
          bookId,
          generatedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      logger.error('❌ Error generando ejercicios:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ANÁLISIS DE COMPRENSIÓN
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Analizar comprensión basada en respuestas del usuario
   */
  async analyzeComprehension(
    userAnswers,
    correctAnswers,
    chapterContent,
    chapterTitle
  ) {
    try {
      await this.aiPremium.checkCredits(300, 'ai_tutor');

      const systemPrompt = `Eres un experto en pedagogía y evaluación de comprensión.

TAREA: Analizar las respuestas del usuario y proporcionar feedback personalizado.

═══════════════════════════════════════════════════════════
RESPUESTAS DEL USUARIO:
═══════════════════════════════════════════════════════════
${JSON.stringify(userAnswers, null, 2)}

RESPUESTAS CORRECTAS:
${JSON.stringify(correctAnswers, null, 2)}

═══════════════════════════════════════════════════════════
PROPORCIONA:
═══════════════════════════════════════════════════════════
1. Calificación y porcentaje de aciertos
2. Áreas de fortaleza (preguntas acertadas)
3. Áreas de mejora (preguntas fallidas)
4. Explicaciones de conceptos no comprendidos
5. Recomendaciones de estudio personalizadas
6. Sugerencias de ejercicios adicionales`;

      const analysis = await this.aiAdapter.chat(
        'Analizar comprensión del usuario',
        {
          systemPrompt,
          maxTokens: 800,
          temperature: 0.6,
        }
      );

      const estimatedTokens = Math.ceil(analysis.length / 4);
      await this.aiPremium.consumeCredits(
        300,
        'comprehension_analysis',
        this.aiAdapter.currentProvider || 'claude',
        this.aiAdapter.currentModel || 'claude-3-5-sonnet',
        estimatedTokens
      );

      return {
        success: true,
        analysis,
      };
    } catch (error) {
      logger.error('❌ Error en análisis:', error);
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
   * Verificar si puede usar chat IA
   */
  canUseAIChat() {
    return this.aiPremium.hasFeature('ai_chat');
  }

  /**
   * Verificar si puede usar tutor IA
   */
  canUseAITutor() {
    return this.aiPremium.hasFeature('ai_tutor');
  }

  /**
   * Mostrar modal de upgrade si es necesario
   */
  showUpgradeIfNeeded(feature) {
    if (!this.aiPremium.hasFeature(feature)) {
      const modal = document.createElement('div');
      modal.className = 'upgrade-prompt-modal fade-in';
      modal.innerHTML = `
        <div class="upgrade-overlay" onclick="this.parentElement.remove()"></div>
        <div class="upgrade-content scale-in">
          <div class="upgrade-icon">✨</div>
          <h3>Función Premium</h3>
          <p>Esta característica está disponible solo en planes Premium o Pro.</p>

          <button class="btn-upgrade" onclick="window.pricingModal?.showPricingModal(); this.closest('.upgrade-prompt-modal').remove()">
            Ver Planes
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
window.aiBookFeatures = new AIBookFeatures();

logger.debug('✅ AIBookFeatures loaded. Use window.aiBookFeatures for book learning features.');
