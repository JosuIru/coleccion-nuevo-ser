/**
 * QuizModal - Modal for taking knowledge quizzes from the library
 *
 * FASE 1: Actualizado para quizzes reales de los libros
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView
} from 'react-native';

// Helper para obtener texto de opción (soporta string y objeto)
const getOptionText = (option) => {
  if (typeof option === 'string') return option;
  if (option && typeof option === 'object') return option.text || option.label || '';
  return '';
};

const QuizModal = ({
  visible,
  quiz,
  bookTitle,
  onSubmit,
  onClose,
  linkedLegendary
}) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);

  const questions = quiz?.questions || [];

  // Reset state when quiz changes
  useEffect(() => {
    if (visible) {
      setCurrentQuestion(0);
      setSelectedAnswers({});
      setShowResult(false);
      setResult(null);
      setShowExplanation(false);
    }
  }, [visible, quiz?.id]);

  const handleSelectAnswer = (questionIndex, answerIndex) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [questionIndex]: answerIndex
    });
  };

  const handleSubmit = async () => {
    const answers = Object.values(selectedAnswers);
    const submitResult = await onSubmit?.(answers);
    setResult(submitResult);
    setShowResult(true);
  };

  const handleClose = () => {
    setCurrentQuestion(0);
    setSelectedAnswers({});
    setShowResult(false);
    setResult(null);
    onClose?.();
  };

  const isAllAnswered = Object.keys(selectedAnswers).length === questions.length;

  const renderQuestion = () => {
    if (questions.length === 0) return null;

    const question = questions[currentQuestion];

    return (
      <View style={styles.questionContainer}>
        <View style={styles.questionHeader}>
          <Text style={styles.questionNumber}>
            Pregunta {currentQuestion + 1} de {questions.length}
          </Text>
          <View style={styles.progressDots}>
            {questions.map((_, idx) => (
              <View
                key={idx}
                style={[
                  styles.progressDot,
                  idx === currentQuestion && styles.progressDotActive,
                  selectedAnswers[idx] !== undefined && styles.progressDotAnswered
                ]}
              />
            ))}
          </View>
        </View>

        <Text style={styles.questionText}>{question.question}</Text>

        <View style={styles.optionsContainer}>
          {question.options.map((option, idx) => (
            <TouchableOpacity
              key={idx}
              style={[
                styles.optionButton,
                selectedAnswers[currentQuestion] === idx && styles.optionSelected
              ]}
              onPress={() => handleSelectAnswer(currentQuestion, idx)}
            >
              <View style={styles.optionMarker}>
                <Text style={styles.optionLetter}>
                  {String.fromCharCode(65 + idx)}
                </Text>
              </View>
              <Text style={[
                styles.optionText,
                selectedAnswers[currentQuestion] === idx && styles.optionTextSelected
              ]}>
                {getOptionText(option)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Difficulty indicator */}
        {question.difficulty && (
          <View style={styles.difficultyBadge}>
            <Text style={styles.difficultyText}>
              {question.difficulty === 'ninos' ? '👶 Niños' :
               question.difficulty === 'principiante' ? '🌱 Principiante' :
               question.difficulty === 'iniciado' ? '🔥 Iniciado' :
               question.difficulty === 'experto' ? '⚡ Experto' : question.difficulty}
            </Text>
          </View>
        )}

        {/* Hint button */}
        {question.hint && !showExplanation && (
          <TouchableOpacity
            style={styles.hintButton}
            onPress={() => setShowExplanation(true)}
          >
            <Text style={styles.hintButtonText}>💡 Ver pista</Text>
          </TouchableOpacity>
        )}

        {/* Show hint */}
        {showExplanation && question.hint && (
          <View style={styles.hintContainer}>
            <Text style={styles.hintLabel}>💡 Pista:</Text>
            <Text style={styles.hintText}>{question.hint}</Text>
          </View>
        )}

        <View style={styles.navigationButtons}>
          <TouchableOpacity
            style={[styles.navButton, currentQuestion === 0 && styles.navButtonDisabled]}
            onPress={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
            disabled={currentQuestion === 0}
          >
            <Text style={styles.navButtonText}>← Anterior</Text>
          </TouchableOpacity>

          {currentQuestion < questions.length - 1 ? (
            <TouchableOpacity
              style={[
                styles.navButton,
                styles.navButtonNext,
                selectedAnswers[currentQuestion] === undefined && styles.navButtonDisabled
              ]}
              onPress={() => setCurrentQuestion(currentQuestion + 1)}
              disabled={selectedAnswers[currentQuestion] === undefined}
            >
              <Text style={styles.navButtonText}>Siguiente →</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.navButton,
                styles.submitButton,
                !isAllAnswered && styles.navButtonDisabled
              ]}
              onPress={handleSubmit}
              disabled={!isAllAnswered}
            >
              <Text style={styles.submitButtonText}>Enviar Respuestas</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderResult = () => {
    if (!result) return null;

    const passed = result.passed;

    return (
      <View style={styles.resultContainer}>
        <Text style={[styles.resultEmoji, !passed && styles.resultEmojiFailed]}>
          {passed ? '🎉' : '😔'}
        </Text>

        <Text style={[styles.resultTitle, !passed && styles.resultTitleFailed]}>
          {passed ? '¡Felicidades!' : 'No has aprobado'}
        </Text>

        <Text style={styles.resultScore}>
          Puntuación: {result.score}%
        </Text>

        <Text style={styles.resultMessage}>
          {passed
            ? 'Has demostrado tu conocimiento de la biblioteca.'
            : 'Necesitas 80% para aprobar. Vuelve a leer el libro e inténtalo de nuevo.'}
        </Text>

        {passed && result.rewards && (
          <View style={styles.rewardsContainer}>
            <Text style={styles.rewardsTitle}>Recompensas:</Text>
            <View style={styles.rewardsList}>
              {result.rewards.xp > 0 && (
                <View style={styles.rewardItem}>
                  <Text style={styles.rewardIcon}>⭐</Text>
                  <Text style={styles.rewardText}>+{result.rewards.xp} XP</Text>
                </View>
              )}
              {result.rewards.consciousness > 0 && (
                <View style={styles.rewardItem}>
                  <Text style={styles.rewardIcon}>🧠</Text>
                  <Text style={styles.rewardText}>+{result.rewards.consciousness} Consciencia</Text>
                </View>
              )}
              {result.rewards.wisdomFragments > 0 && (
                <View style={styles.rewardItem}>
                  <Text style={styles.rewardIcon}>📜</Text>
                  <Text style={styles.rewardText}>+{result.rewards.wisdomFragments} Fragmentos de Sabiduría</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Legendary being unlocked */}
        {passed && (result.legendaryUnlocked || linkedLegendary) && (
          <View style={styles.legendaryUnlockContainer}>
            <Text style={styles.legendaryUnlockTitle}>
              ¡SER LEGENDARIO DESBLOQUEADO!
            </Text>
            <Text style={styles.legendaryUnlockAvatar}>
              {result.legendaryUnlocked?.icon || linkedLegendary?.avatar || '🌟'}
            </Text>
            <Text style={styles.legendaryUnlockName}>
              {result.legendaryUnlocked?.legendaryName || linkedLegendary?.name || 'Guardián Mítico'}
            </Text>
            {(result.legendaryUnlocked?.powers || linkedLegendary?.powers) && (
              <Text style={styles.legendaryUnlockPowers}>
                Poderes: {(result.legendaryUnlocked?.powers || linkedLegendary?.powers || []).join(', ')}
              </Text>
            )}
          </View>
        )}

        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <Text style={styles.closeButtonText}>Cerrar</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Quiz de Conocimiento</Text>
              <Text style={styles.bookTitle}>{bookTitle}</Text>
            </View>
            {!showResult && (
              <TouchableOpacity style={styles.closeIcon} onPress={handleClose}>
                <Text style={styles.closeIconText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          <ScrollView style={styles.content}>
            {showResult ? renderResult() : renderQuestion()}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContainer: {
    width: '92%',
    maxHeight: '85%',
    backgroundColor: '#1E293B',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(139, 92, 246, 0.2)'
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F8FAFC'
  },
  bookTitle: {
    fontSize: 14,
    color: '#C4B5FD',
    marginTop: 4
  },
  closeIcon: {
    padding: 4
  },
  closeIconText: {
    fontSize: 20,
    color: '#94A3B8'
  },
  content: {
    flex: 1,
    padding: 16
  },
  questionContainer: {
    flex: 1
  },
  questionHeader: {
    marginBottom: 20
  },
  questionNumber: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 8
  },
  progressDots: {
    flexDirection: 'row',
    gap: 6
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(71, 85, 105, 0.5)'
  },
  progressDotActive: {
    backgroundColor: '#8B5CF6'
  },
  progressDotAnswered: {
    backgroundColor: '#10B981'
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F8FAFC',
    lineHeight: 26,
    marginBottom: 24
  },
  optionsContainer: {
    gap: 12
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(51, 65, 85, 0.5)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 2,
    borderColor: 'transparent'
  },
  optionSelected: {
    borderColor: '#8B5CF6',
    backgroundColor: 'rgba(139, 92, 246, 0.1)'
  },
  optionMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(71, 85, 105, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  optionLetter: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#F8FAFC'
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    color: '#E2E8F0'
  },
  optionTextSelected: {
    color: '#F8FAFC',
    fontWeight: '500'
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
    paddingBottom: 16
  },
  navButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(51, 65, 85, 0.5)'
  },
  navButtonNext: {
    backgroundColor: 'rgba(139, 92, 246, 0.3)'
  },
  navButtonDisabled: {
    opacity: 0.4
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F8FAFC'
  },
  submitButton: {
    backgroundColor: '#10B981'
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#F8FAFC'
  },
  resultContainer: {
    alignItems: 'center',
    paddingVertical: 20
  },
  resultEmoji: {
    fontSize: 64,
    marginBottom: 16
  },
  resultEmojiFailed: {
    opacity: 0.7
  },
  resultTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#10B981',
    marginBottom: 12
  },
  resultTitleFailed: {
    color: '#F87171'
  },
  resultScore: {
    fontSize: 24,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 16
  },
  resultMessage: {
    fontSize: 16,
    color: '#CBD5E1',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24
  },
  rewardsContainer: {
    width: '100%',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16
  },
  rewardsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
    marginBottom: 12
  },
  rewardsList: {
    gap: 8
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  rewardIcon: {
    fontSize: 18,
    marginRight: 8
  },
  rewardText: {
    fontSize: 14,
    color: '#F8FAFC'
  },
  legendaryUnlock: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
    marginBottom: 16
  },
  legendaryIcon: {
    fontSize: 32,
    marginRight: 12
  },
  legendaryText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#FCD34D'
  },
  closeButton: {
    backgroundColor: 'rgba(71, 85, 105, 0.5)',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC'
  },
  // Difficulty badge
  difficultyBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 12
  },
  difficultyText: {
    fontSize: 12,
    color: '#C4B5FD'
  },
  // Hint styles
  hintButton: {
    alignSelf: 'center',
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)'
  },
  hintButtonText: {
    fontSize: 13,
    color: '#FCD34D'
  },
  hintContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#FCD34D'
  },
  hintLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FCD34D',
    marginBottom: 4
  },
  hintText: {
    fontSize: 13,
    color: '#E2E8F0',
    fontStyle: 'italic',
    lineHeight: 18
  },
  // Book quote in results
  bookQuoteContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#8B5CF6'
  },
  bookQuoteText: {
    fontSize: 13,
    color: '#C4B5FD',
    fontStyle: 'italic',
    lineHeight: 18
  },
  // Legendary unlock animation
  legendaryUnlockContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    borderRadius: 16,
    padding: 20,
    marginVertical: 16,
    borderWidth: 2,
    borderColor: 'rgba(251, 191, 36, 0.4)'
  },
  legendaryUnlockTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FCD34D',
    marginBottom: 8
  },
  legendaryUnlockAvatar: {
    fontSize: 48,
    marginVertical: 12
  },
  legendaryUnlockName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F8FAFC',
    marginBottom: 4
  },
  legendaryUnlockPowers: {
    fontSize: 12,
    color: '#C4B5FD',
    textAlign: 'center'
  }
});

export default QuizModal;
