/**
 * KnowledgeQuizService.js
 *
 * Gestiona los quizzes de conocimiento basados en los libros
 * de la Colección Nuevo Ser. Los quizzes se usan para desbloquear
 * seres legendarios, acceder a santuarios especiales, etc.
 *
 * FASE 1: Integración de quizzes reales de los libros
 *
 * @version 2.0.0
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { REAL_QUIZ_DATA, LEGENDARY_BEINGS } from '../data/realQuizzes';
import { logger } from '../utils/logger';

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

const QUIZ_CONFIG = {
  QUESTIONS_PER_QUIZ: 5,           // Preguntas por quiz
  PASS_THRESHOLD: 0.8,             // 80% para pasar
  PERFECT_SCORE_BONUS: 50,         // XP extra por puntuación perfecta
  WISDOM_FRAGMENT_THRESHOLD: 0.8,  // Umbral para ganar fragmento de sabiduría
  DIFFICULTY_WEIGHTS: {
    ninos: 1,
    principiante: 2,
    iniciado: 3,
    experto: 4
  }
};

// ============================================================================
// SERVICIO PRINCIPAL
// ============================================================================

class KnowledgeQuizService {
  constructor() {
    this.quizHistory = [];
    this.bestScores = {};
    this.unlockedRewards = {};
    this.unlockedLegendaries = {};
    this.wisdomFragments = 0;
  }

  async initialize() {
    await this.loadState();
    logger.info('KnowledgeQuizService', `Inicializado con ${Object.keys(REAL_QUIZ_DATA).length} libros`);
    return true;
  }

  // --------------------------------------------------------------------------
  // GESTIÓN DE LIBROS Y QUIZZES
  // --------------------------------------------------------------------------

  /**
   * Obtener libros disponibles para quiz
   */
  getAvailableBooks() {
    return Object.entries(REAL_QUIZ_DATA).map(([bookId, book]) => ({
      id: bookId,
      title: book.bookTitle,
      icon: book.icon,
      totalQuestions: book.totalQuestions,
      questionsAvailable: book.questions.length,
      bestScore: this.bestScores[bookId] || null,
      completed: this.isBookCompleted(bookId),
      legendary: book.legendary,
      legendaryUnlocked: this.unlockedLegendaries[bookId] || false
    }));
  }

  /**
   * Obtener información de un libro específico
   */
  getBookInfo(bookId) {
    const book = REAL_QUIZ_DATA[bookId];
    if (!book) return null;

    return {
      id: bookId,
      title: book.bookTitle,
      icon: book.icon,
      totalQuestions: book.totalQuestions,
      legendary: book.legendary,
      bestScore: this.bestScores[bookId] || null,
      completed: this.isBookCompleted(bookId),
      legendaryUnlocked: this.unlockedLegendaries[bookId] || false,
      difficultyDistribution: this.getDifficultyDistribution(bookId)
    };
  }

  /**
   * Obtener distribución de dificultad de un libro
   */
  getDifficultyDistribution(bookId) {
    const book = REAL_QUIZ_DATA[bookId];
    if (!book) return null;

    const distribution = { ninos: 0, principiante: 0, iniciado: 0, experto: 0 };
    for (const q of book.questions) {
      const diff = q.difficulty || 'principiante';
      distribution[diff] = (distribution[diff] || 0) + 1;
    }
    return distribution;
  }

  // --------------------------------------------------------------------------
  // GENERACIÓN DE QUIZZES
  // --------------------------------------------------------------------------

  /**
   * Generar un quiz para un libro específico
   */
  generateQuiz(bookId, questionCount = QUIZ_CONFIG.QUESTIONS_PER_QUIZ, difficulty = null) {
    const book = REAL_QUIZ_DATA[bookId];
    if (!book) throw new Error('Libro no encontrado: ' + bookId);

    // Filtrar por dificultad si se especifica
    let availableQuestions = [...book.questions];
    if (difficulty) {
      availableQuestions = availableQuestions.filter(q => q.difficulty === difficulty);
    }

    if (availableQuestions.length === 0) {
      throw new Error('No hay preguntas disponibles para los criterios especificados');
    }

    // Seleccionar preguntas aleatorias
    const shuffled = availableQuestions.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(questionCount, shuffled.length));

    // Mezclar opciones de cada pregunta
    const quizQuestions = selected.map(q => {
      // Guardar respuesta correcta antes de mezclar
      const correctOption = q.options[q.correctAnswer];

      // Mezclar opciones
      const shuffledOptions = [...q.options].sort(() => Math.random() - 0.5);

      // Encontrar nuevo índice de la respuesta correcta
      const newCorrectIndex = shuffledOptions.findIndex(opt =>
        (typeof opt === 'string' ? opt : opt.text) ===
        (typeof correctOption === 'string' ? correctOption : correctOption.text)
      );

      return {
        ...q,
        options: shuffledOptions,
        correctAnswer: newCorrectIndex
      };
    });

    return {
      id: `quiz_${bookId}_${Date.now()}`,
      bookId,
      bookTitle: book.bookTitle,
      bookIcon: book.icon,
      legendary: book.legendary,
      questions: quizQuestions,
      totalQuestions: quizQuestions.length,
      startedAt: Date.now()
    };
  }

  /**
   * Alias para generateQuiz (compatibilidad con gameStore)
   */
  getQuiz(bookId) {
    try {
      return this.generateQuiz(bookId, QUIZ_CONFIG.QUESTIONS_PER_QUIZ);
    } catch (error) {
      logger.error('KnowledgeQuizService', 'Error getting quiz:', error);
      return null;
    }
  }

  /**
   * Generar quiz mixto de varios libros
   */
  generateMixedQuiz(bookIds = null, questionCount = 10) {
    const targetBooks = bookIds || Object.keys(REAL_QUIZ_DATA);
    const allQuestions = [];

    for (const bookId of targetBooks) {
      const book = REAL_QUIZ_DATA[bookId];
      if (book) {
        allQuestions.push(...book.questions.map(q => ({ ...q, sourceBook: bookId })));
      }
    }

    const shuffled = allQuestions.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(questionCount, shuffled.length));

    return {
      id: `quiz_mixed_${Date.now()}`,
      bookId: 'mixed',
      bookTitle: 'Quiz de la Colección',
      bookIcon: '📚',
      questions: selected,
      totalQuestions: selected.length,
      startedAt: Date.now()
    };
  }

  // --------------------------------------------------------------------------
  // EVALUACIÓN DE QUIZZES
  // --------------------------------------------------------------------------

  /**
   * Evaluar respuestas de un quiz
   */
  async evaluateQuiz(quizId, bookId, answers) {
    const book = REAL_QUIZ_DATA[bookId];
    if (!book && bookId !== 'mixed') {
      throw new Error('Libro no encontrado');
    }

    let correct = 0;
    let totalDifficultyWeight = 0;
    let earnedDifficultyWeight = 0;
    const results = [];

    for (const answer of answers) {
      const question = book
        ? book.questions.find(q => q.id === answer.questionId)
        : null;

      if (!question) continue;

      const isCorrect = answer.selectedOption === question.correctAnswer;
      if (isCorrect) {
        correct++;
        earnedDifficultyWeight += QUIZ_CONFIG.DIFFICULTY_WEIGHTS[question.difficulty] || 2;
      }
      totalDifficultyWeight += QUIZ_CONFIG.DIFFICULTY_WEIGHTS[question.difficulty] || 2;

      results.push({
        questionId: answer.questionId,
        question: question.question,
        selectedOption: answer.selectedOption,
        correctAnswer: question.correctAnswer,
        isCorrect,
        explanation: question.explanation,
        bookQuote: question.bookQuote || null
      });
    }

    const score = answers.length > 0 ? correct / answers.length : 0;
    const weightedScore = totalDifficultyWeight > 0 ? earnedDifficultyWeight / totalDifficultyWeight : 0;
    const passed = score >= QUIZ_CONFIG.PASS_THRESHOLD;

    // Actualizar mejores puntuaciones
    const isNewBestScore = !this.bestScores[bookId] || score > this.bestScores[bookId];
    if (isNewBestScore) {
      this.bestScores[bookId] = score;
    }

    // Registrar en historial
    this.quizHistory.push({
      quizId,
      bookId,
      score,
      weightedScore,
      correct,
      total: answers.length,
      passed,
      timestamp: Date.now()
    });

    // Calcular recompensas
    const rewards = this.calculateRewards(bookId, score, passed, isNewBestScore);

    // Verificar desbloqueo de legendario
    let legendaryUnlocked = null;
    if (passed && !this.unlockedLegendaries[bookId]) {
      const legendary = LEGENDARY_BEINGS[bookId];
      if (legendary) {
        this.unlockedLegendaries[bookId] = {
          unlockedAt: Date.now(),
          score: score
        };
        legendaryUnlocked = legendary;
        rewards.legendaryUnlocked = legendary;
      }
    }

    await this.saveState();

    return {
      score,
      weightedScore,
      correct,
      total: answers.length,
      passed,
      results,
      isNewBestScore,
      bestScore: this.bestScores[bookId],
      rewards,
      legendaryUnlocked
    };
  }

  /**
   * Enviar quiz y obtener resultados (compatibilidad con gameStore)
   */
  async submitQuiz(bookId, answers) {
    const book = REAL_QUIZ_DATA[bookId];
    if (!book) return { passed: false, score: 0 };

    // Convertir array de respuestas a formato esperado
    const formattedAnswers = answers.map((answerIndex, idx) => {
      const question = book.questions[idx];
      return {
        questionId: question ? question.id : `q${idx + 1}`,
        selectedOption: answerIndex
      };
    });

    // Calcular puntuación directamente
    let correct = 0;
    formattedAnswers.forEach((answer, idx) => {
      if (idx < book.questions.length) {
        const question = book.questions[idx];
        if (answer.selectedOption === question.correctAnswer) {
          correct++;
        }
      }
    });

    const total = Math.min(answers.length, book.questions.length);
    const score = Math.round((correct / total) * 100);
    const passed = score >= 80;

    // Actualizar mejor puntuación
    if (!this.bestScores[bookId] || score / 100 > this.bestScores[bookId]) {
      this.bestScores[bookId] = score / 100;
    }

    // Verificar desbloqueo de legendario
    let legendaryUnlocked = null;
    if (passed && !this.unlockedLegendaries[bookId]) {
      const legendary = LEGENDARY_BEINGS[bookId];
      if (legendary) {
        this.unlockedLegendaries[bookId] = {
          unlockedAt: Date.now(),
          score: score / 100
        };
        legendaryUnlocked = legendary;
      }
    }

    await this.saveState();

    const rewards = passed ? this.calculateRewards(bookId, score / 100, passed, false) : { xp: 0, consciousness: 0, wisdomFragments: 0 };

    return {
      score,
      passed,
      correct,
      total,
      rewards,
      legendaryUnlocked
    };
  }

  /**
   * Calcular recompensas por quiz
   */
  calculateRewards(bookId, score, passed, isNewBestScore) {
    const rewards = {
      xp: Math.round(score * 100),
      consciousness: Math.round(score * 50),
      wisdomFragments: 0
    };

    // Fragmento de sabiduría por aprobar
    if (passed && !this.unlockedRewards[bookId]) {
      rewards.wisdomFragments = 1;
      this.wisdomFragments++;
    }

    // Bonus por puntuación perfecta
    if (score === 1.0) {
      rewards.xp += QUIZ_CONFIG.PERFECT_SCORE_BONUS;
      rewards.consciousness += 25;
      rewards.perfectBonus = true;
    }

    // Bonus por nuevo récord
    if (isNewBestScore && passed) {
      rewards.xp += 20;
      rewards.newRecordBonus = true;
    }

    return rewards;
  }

  // --------------------------------------------------------------------------
  // SERES LEGENDARIOS
  // --------------------------------------------------------------------------

  /**
   * Obtener ser legendario vinculado a un libro
   */
  getLinkedLegendary(bookId) {
    return LEGENDARY_BEINGS[bookId] || null;
  }

  /**
   * Verificar si un legendario está desbloqueado
   */
  isLegendaryUnlocked(bookId) {
    return !!this.unlockedLegendaries[bookId];
  }

  /**
   * Obtener todos los legendarios (desbloqueados y bloqueados)
   */
  getAllLegendaries() {
    return Object.entries(LEGENDARY_BEINGS).map(([bookId, legendary]) => ({
      ...legendary,
      bookId,
      unlocked: !!this.unlockedLegendaries[bookId],
      unlockedAt: this.unlockedLegendaries[bookId]?.unlockedAt || null,
      unlockScore: this.unlockedLegendaries[bookId]?.score || null,
      requiredBook: REAL_QUIZ_DATA[bookId]?.bookTitle || bookId
    }));
  }

  /**
   * Obtener legendarios desbloqueados
   */
  getUnlockedLegendaries() {
    return this.getAllLegendaries().filter(l => l.unlocked);
  }

  // --------------------------------------------------------------------------
  // PROGRESO Y ESTADÍSTICAS
  // --------------------------------------------------------------------------

  /**
   * Verificar si un libro ha sido "completado" (quiz pasado)
   */
  isBookCompleted(bookId) {
    return (this.bestScores[bookId] || 0) >= QUIZ_CONFIG.PASS_THRESHOLD;
  }

  /**
   * Obtener número de libros completados
   */
  getCompletedBooksCount() {
    return Object.values(this.bestScores).filter(score => score >= QUIZ_CONFIG.PASS_THRESHOLD).length;
  }

  /**
   * Obtener progreso general
   */
  getProgress() {
    const completedBooks = Object.keys(this.bestScores)
      .filter(id => this.bestScores[id] >= QUIZ_CONFIG.PASS_THRESHOLD);

    return {
      completedQuizzes: completedBooks,
      scores: this.bestScores,
      wisdomFragments: this.wisdomFragments,
      unlockedLegendaries: Object.keys(this.unlockedLegendaries),
      totalBooks: Object.keys(REAL_QUIZ_DATA).length,
      completionPercentage: (completedBooks.length / Object.keys(REAL_QUIZ_DATA).length) * 100
    };
  }

  /**
   * Obtener estadísticas detalladas
   */
  getQuizStats() {
    const totalBooks = Object.keys(REAL_QUIZ_DATA).length;
    const completedBooks = this.getCompletedBooksCount();
    const totalQuizzes = this.quizHistory.length;
    const averageScore = this.quizHistory.length > 0
      ? this.quizHistory.reduce((sum, q) => sum + q.score, 0) / this.quizHistory.length
      : 0;

    // Calcular total de preguntas disponibles
    const totalQuestions = Object.values(REAL_QUIZ_DATA)
      .reduce((sum, book) => sum + book.totalQuestions, 0);

    return {
      totalBooks,
      completedBooks,
      completionPercentage: (completedBooks / totalBooks) * 100,
      totalQuizzesTaken: totalQuizzes,
      averageScore,
      bestScores: this.bestScores,
      wisdomFragments: this.wisdomFragments,
      unlockedLegendaries: Object.keys(this.unlockedLegendaries).length,
      totalLegendaries: Object.keys(LEGENDARY_BEINGS).length,
      totalQuestions,
      recentQuizzes: this.quizHistory.slice(-10)
    };
  }

  // --------------------------------------------------------------------------
  // RECOMPENSAS
  // --------------------------------------------------------------------------

  /**
   * Obtener recompensas base por pasar quiz
   */
  getQuizRewards(bookId, score) {
    return this.calculateRewards(bookId, score, score >= QUIZ_CONFIG.PASS_THRESHOLD, false);
  }

  /**
   * Marcar recompensa como reclamada
   */
  async claimBookReward(bookId) {
    if (!this.isBookCompleted(bookId)) {
      return { success: false, error: 'Quiz no completado' };
    }
    if (this.unlockedRewards[bookId]) {
      return { success: false, error: 'Recompensa ya reclamada' };
    }

    this.unlockedRewards[bookId] = {
      claimedAt: Date.now(),
      score: this.bestScores[bookId]
    };

    await this.saveState();

    return {
      success: true,
      unlocked: true,
      bookId,
      legendary: LEGENDARY_BEINGS[bookId] || null
    };
  }

  // --------------------------------------------------------------------------
  // PERSISTENCIA
  // --------------------------------------------------------------------------

  async saveState() {
    try {
      await AsyncStorage.setItem('knowledge_quiz_state_v2', JSON.stringify({
        quizHistory: this.quizHistory.slice(-100), // Últimos 100 quizzes
        bestScores: this.bestScores,
        unlockedRewards: this.unlockedRewards,
        unlockedLegendaries: this.unlockedLegendaries,
        wisdomFragments: this.wisdomFragments
      }));
    } catch (error) {
      logger.error('KnowledgeQuizService', 'Error saving state:', error);
    }
  }

  async loadState() {
    try {
      // Intentar cargar v2 primero
      let data = await AsyncStorage.getItem('knowledge_quiz_state_v2');

      if (!data) {
        // Migrar desde v1 si existe
        data = await AsyncStorage.getItem('knowledge_quiz_state');
      }

      if (data) {
        const parsed = JSON.parse(data);
        this.quizHistory = parsed.quizHistory || [];
        this.bestScores = parsed.bestScores || {};
        this.unlockedRewards = parsed.unlockedRewards || {};
        this.unlockedLegendaries = parsed.unlockedLegendaries || {};
        this.wisdomFragments = parsed.wisdomFragments || 0;
      }
    } catch (error) {
      logger.error('KnowledgeQuizService', 'Error loading state:', error);
    }
  }

  /**
   * Resetear progreso (para testing)
   */
  async resetProgress() {
    this.quizHistory = [];
    this.bestScores = {};
    this.unlockedRewards = {};
    this.unlockedLegendaries = {};
    this.wisdomFragments = 0;
    await AsyncStorage.removeItem('knowledge_quiz_state_v2');
    await AsyncStorage.removeItem('knowledge_quiz_state');
  }
}

export const knowledgeQuizService = new KnowledgeQuizService();
export { REAL_QUIZ_DATA, LEGENDARY_BEINGS };
export default knowledgeQuizService;
