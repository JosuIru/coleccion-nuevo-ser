/**
 * RealWorldChallengesPanel - Desafíos del Mundo Real
 *
 * Muestra los desafíos para llevar el despertar más allá del juego.
 * Se desbloquean al completar La Gran Transición.
 *
 * Conecta el juego con acciones reales en la vida del jugador.
 *
 * FASE 5: Desafíos del Mundo Real
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal
} from 'react-native';

const CHALLENGE_TYPES = {
  habit: { icon: '🔄', color: '#10B981', label: 'Hábito' },
  action: { icon: '⚡', color: '#F59E0B', label: 'Acción' },
  community: { icon: '👥', color: '#8B5CF6', label: 'Comunidad' },
  lifestyle: { icon: '🌿', color: '#22C55E', label: 'Estilo de Vida' },
  communication: { icon: '💬', color: '#22D3EE', label: 'Comunicación' },
  teaching: { icon: '📚', color: '#6366F1', label: 'Enseñanza' }
};

const STATUS_LABELS = {
  not_started: { label: 'No iniciado', color: '#64748B' },
  in_progress: { label: 'En progreso', color: '#F59E0B' },
  completed: { label: 'Completado', color: '#10B981' },
  paused: { label: 'Pausado', color: '#94A3B8' }
};

const RealWorldChallengesPanel = ({
  challenges = [],
  unlocked = false,
  onUpdateStatus,
  onViewChallenge
}) => {
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);

  const completedCount = challenges.filter(c => c.status === 'completed').length;
  const inProgressCount = challenges.filter(c => c.status === 'in_progress').length;

  const handleStatusPress = (challenge) => {
    setSelectedChallenge(challenge);
    setShowStatusModal(true);
  };

  const handleStatusUpdate = (newStatus) => {
    if (selectedChallenge && onUpdateStatus) {
      onUpdateStatus(selectedChallenge.id, newStatus);
    }
    setShowStatusModal(false);
    setSelectedChallenge(null);
  };

  const renderLockedState = () => (
    <View style={styles.lockedContainer}>
      <Text style={styles.lockedEmoji}>🔒</Text>
      <Text style={styles.lockedTitle}>Desafíos del Mundo Real</Text>
      <Text style={styles.lockedText}>
        Completa La Gran Transición para desbloquear los desafíos que llevan el despertar más allá del juego.
      </Text>
      <View style={styles.lockedRequirements}>
        <Text style={styles.lockedReqTitle}>Requisitos:</Text>
        <Text style={styles.lockedReqItem}>• Transformar los 7 Guardianes</Text>
        <Text style={styles.lockedReqItem}>• Construir las 7 Instituciones</Text>
        <Text style={styles.lockedReqItem}>• Alcanzar 100% de Consciencia Global</Text>
      </View>
    </View>
  );

  const renderIntro = () => (
    <View style={styles.introContainer}>
      <Text style={styles.introEmoji}>🌟</Text>
      <Text style={styles.introTitle}>El Verdadero Juego Comienza</Text>
      <Text style={styles.introText}>
        Has completado La Gran Transición en el juego. Ahora es momento de llevar
        este despertar a tu vida real. Estos desafíos son invitaciones a la acción
        en el mundo físico.
      </Text>
      <Text style={styles.introQuote}>
        "El Nuevo Ser no es una utopía que vendrá. Es una práctica que ya existe
        en cada momento en que eliges la conexión sobre la separación."
      </Text>
    </View>
  );

  const renderProgress = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressStats}>
        <View style={styles.progressStat}>
          <Text style={styles.progressNumber}>{completedCount}</Text>
          <Text style={styles.progressLabel}>Completados</Text>
        </View>
        <View style={styles.progressDivider} />
        <View style={styles.progressStat}>
          <Text style={[styles.progressNumber, { color: '#F59E0B' }]}>
            {inProgressCount}
          </Text>
          <Text style={styles.progressLabel}>En Progreso</Text>
        </View>
        <View style={styles.progressDivider} />
        <View style={styles.progressStat}>
          <Text style={styles.progressNumber}>{challenges.length}</Text>
          <Text style={styles.progressLabel}>Total</Text>
        </View>
      </View>
    </View>
  );

  const renderChallengeCard = (challenge) => {
    const typeInfo = CHALLENGE_TYPES[challenge.type] || CHALLENGE_TYPES.action;
    const statusInfo = STATUS_LABELS[challenge.status] || STATUS_LABELS.not_started;

    return (
      <TouchableOpacity
        key={challenge.id}
        style={[
          styles.challengeCard,
          challenge.status === 'completed' && styles.challengeCompleted
        ]}
        onPress={() => onViewChallenge?.(challenge)}
      >
        <View style={styles.challengeHeader}>
          <View style={[styles.typeTag, { backgroundColor: typeInfo.color + '20' }]}>
            <Text style={styles.typeIcon}>{typeInfo.icon}</Text>
            <Text style={[styles.typeLabel, { color: typeInfo.color }]}>
              {typeInfo.label}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.statusBadge, { backgroundColor: statusInfo.color + '20' }]}
            onPress={() => handleStatusPress(challenge)}
          >
            <Text style={[styles.statusText, { color: statusInfo.color }]}>
              {statusInfo.label}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.challengeName}>{challenge.name}</Text>
        <Text style={styles.challengeDescription}>{challenge.description}</Text>

        {challenge.duration && (
          <View style={styles.durationRow}>
            <Text style={styles.durationIcon}>⏱️</Text>
            <Text style={styles.durationText}>{challenge.duration}</Text>
          </View>
        )}

        <View style={styles.guidanceBox}>
          <Text style={styles.guidanceLabel}>Guía:</Text>
          <Text style={styles.guidanceText}>{challenge.guidance}</Text>
        </View>

        {challenge.status === 'completed' && (
          <View style={styles.completedBanner}>
            <Text style={styles.completedIcon}>✓</Text>
            <Text style={styles.completedText}>Desafío Completado</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderStatusModal = () => (
    <Modal
      visible={showStatusModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowStatusModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Actualizar Estado</Text>
          <Text style={styles.modalSubtitle}>
            {selectedChallenge?.name}
          </Text>

          {Object.entries(STATUS_LABELS).map(([key, value]) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.statusOption,
                selectedChallenge?.status === key && styles.statusOptionSelected
              ]}
              onPress={() => handleStatusUpdate(key)}
            >
              <View style={[styles.statusDot, { backgroundColor: value.color }]} />
              <Text style={styles.statusOptionText}>{value.label}</Text>
              {selectedChallenge?.status === key && (
                <Text style={styles.checkMark}>✓</Text>
              )}
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={styles.modalCancel}
            onPress={() => setShowStatusModal(false)}
          >
            <Text style={styles.modalCancelText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderActionPrompt = () => (
    <View style={styles.actionPrompt}>
      <Text style={styles.actionTitle}>¿Qué harás ahora?</Text>
      <Text style={styles.actionText}>
        Cada pequeña acción en el mundo real contribuye a La Gran Transición.
        No hay acciones pequeñas - solo hay semillas que se plantan.
      </Text>
      <View style={styles.actionTips}>
        <Text style={styles.tipItem}>💡 Empieza con un desafío pequeño</Text>
        <Text style={styles.tipItem}>🤝 Comparte tu progreso con otros</Text>
        <Text style={styles.tipItem}>📝 Lleva un diario de tu transformación</Text>
      </View>
    </View>
  );

  if (!unlocked) {
    return renderLockedState();
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {renderIntro()}
        {renderProgress()}

        <View style={styles.challengesList}>
          {challenges.map(renderChallengeCard)}
        </View>

        {renderActionPrompt()}
      </ScrollView>

      {renderStatusModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  lockedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24
  },
  lockedEmoji: {
    fontSize: 64,
    marginBottom: 16
  },
  lockedTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F8FAFC',
    marginBottom: 12
  },
  lockedText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24
  },
  lockedRequirements: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 12,
    padding: 16,
    width: '100%'
  },
  lockedReqTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#64748B',
    marginBottom: 8
  },
  lockedReqItem: {
    fontSize: 13,
    color: '#CBD5E1',
    marginBottom: 4
  },
  introContainer: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F59E0B40'
  },
  introEmoji: {
    fontSize: 40,
    textAlign: 'center',
    marginBottom: 12
  },
  introTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F59E0B',
    textAlign: 'center',
    marginBottom: 12
  },
  introText: {
    fontSize: 14,
    color: '#E2E8F0',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16
  },
  introQuote: {
    fontSize: 13,
    color: '#FCD34D',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 20
  },
  progressContainer: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center'
  },
  progressStat: {
    alignItems: 'center'
  },
  progressNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#10B981'
  },
  progressLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4
  },
  progressDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#334155'
  },
  challengesList: {
    gap: 16
  },
  challengeCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 12,
    padding: 16
  },
  challengeCompleted: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: '#10B98140'
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  typeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12
  },
  typeIcon: {
    fontSize: 14,
    marginRight: 4
  },
  typeLabel: {
    fontSize: 11,
    fontWeight: 'bold'
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold'
  },
  challengeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F8FAFC',
    marginBottom: 6
  },
  challengeDescription: {
    fontSize: 13,
    color: '#CBD5E1',
    lineHeight: 20,
    marginBottom: 10
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  durationIcon: {
    fontSize: 12,
    marginRight: 6
  },
  durationText: {
    fontSize: 12,
    color: '#94A3B8'
  },
  guidanceBox: {
    backgroundColor: 'rgba(51, 65, 85, 0.5)',
    borderRadius: 8,
    padding: 12
  },
  guidanceLabel: {
    fontSize: 10,
    color: '#64748B',
    marginBottom: 4
  },
  guidanceText: {
    fontSize: 12,
    color: '#94A3B8',
    fontStyle: 'italic'
  },
  completedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#10B98140'
  },
  completedIcon: {
    fontSize: 16,
    color: '#10B981',
    marginRight: 6
  },
  completedText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: 'bold'
  },
  actionPrompt: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
    marginBottom: 20
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#A5B4FC',
    marginBottom: 8
  },
  actionText: {
    fontSize: 13,
    color: '#C7D2FE',
    lineHeight: 20,
    marginBottom: 16
  },
  actionTips: {
    gap: 6
  },
  tipItem: {
    fontSize: 12,
    color: '#E0E7FF'
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalContent: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    width: '100%',
    maxWidth: 320,
    padding: 20
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F8FAFC',
    textAlign: 'center',
    marginBottom: 4
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 20
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: 'rgba(51, 65, 85, 0.5)'
  },
  statusOptionSelected: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)'
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12
  },
  statusOptionText: {
    flex: 1,
    fontSize: 14,
    color: '#F8FAFC'
  },
  checkMark: {
    fontSize: 16,
    color: '#10B981'
  },
  modalCancel: {
    padding: 14,
    alignItems: 'center',
    marginTop: 8
  },
  modalCancelText: {
    fontSize: 14,
    color: '#64748B'
  }
});

export default RealWorldChallengesPanel;
