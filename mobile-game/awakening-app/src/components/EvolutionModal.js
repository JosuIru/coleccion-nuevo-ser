/**
 * EvolutionModal - Modal for evolving beings
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView
} from 'react-native';

const EvolutionModal = ({
  visible,
  being,
  availableEvolutions = [],
  onEvolve,
  onClose
}) => {
  const [selectedEvolution, setSelectedEvolution] = useState(null);
  const [evolving, setEvolving] = useState(false);
  const [evolutionResult, setEvolutionResult] = useState(null);

  const tierColors = {
    1: '#6B7280', // Base - gray
    2: '#10B981', // Awakening - emerald
    3: '#3B82F6', // Specialization - blue
    4: '#8B5CF6', // Mastery - purple
    5: '#FFD700'  // Transcendence - gold
  };

  const tierNames = {
    1: 'Base',
    2: 'Despertar',
    3: 'Especialización',
    4: 'Maestría',
    5: 'Trascendencia'
  };

  const handleEvolve = async () => {
    if (!selectedEvolution) return;

    setEvolving(true);
    try {
      const result = await onEvolve?.(being.id, selectedEvolution.id);
      setEvolutionResult(result);
    } catch (error) {
      console.error('Evolution error:', error);
    } finally {
      setEvolving(false);
    }
  };

  const handleClose = () => {
    setSelectedEvolution(null);
    setEvolutionResult(null);
    onClose?.();
  };

  const renderEvolutionPath = (evolution) => {
    const isSelected = selectedEvolution?.id === evolution.id;
    const canEvolve = evolution.canEvolve;

    return (
      <TouchableOpacity
        key={evolution.id}
        style={[
          styles.evolutionCard,
          isSelected && styles.evolutionCardSelected,
          !canEvolve && styles.evolutionCardLocked
        ]}
        onPress={() => canEvolve && setSelectedEvolution(evolution)}
        disabled={!canEvolve}
      >
        <View style={styles.evolutionHeader}>
          <Text style={styles.evolutionIcon}>{evolution.icon || '🌟'}</Text>
          <View style={styles.evolutionTitleContainer}>
            <Text style={styles.evolutionName}>{evolution.name}</Text>
            <View style={[
              styles.tierBadge,
              { backgroundColor: `${tierColors[evolution.tier]}20` }
            ]}>
              <Text style={[styles.tierText, { color: tierColors[evolution.tier] }]}>
                {tierNames[evolution.tier]}
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.evolutionDescription}>
          {evolution.description}
        </Text>

        {/* Stat Boosts */}
        {evolution.statBoosts && (
          <View style={styles.statBoostsContainer}>
            <Text style={styles.statBoostsTitle}>Mejoras de Atributos:</Text>
            <View style={styles.statBoostsList}>
              {Object.entries(evolution.statBoosts).slice(0, 4).map(([stat, boost]) => (
                <View key={stat} style={styles.statBoostItem}>
                  <Text style={styles.statBoostName}>{stat}</Text>
                  <Text style={styles.statBoostValue}>+{boost}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* New Traits */}
        {evolution.newTraits && evolution.newTraits.length > 0 && (
          <View style={styles.traitsContainer}>
            <Text style={styles.traitsTitle}>Nuevos Rasgos:</Text>
            <View style={styles.traitsList}>
              {evolution.newTraits.map((trait, idx) => (
                <View key={idx} style={styles.traitBadge}>
                  <Text style={styles.traitText}>{trait}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Requirements if locked */}
        {!canEvolve && evolution.missingRequirements && (
          <View style={styles.requirementsContainer}>
            <Text style={styles.requirementsTitle}>Requisitos faltantes:</Text>
            {evolution.missingRequirements.map((req, idx) => (
              <Text key={idx} style={styles.requirementText}>• {req}</Text>
            ))}
          </View>
        )}

        {/* Selection indicator */}
        {isSelected && (
          <View style={styles.selectedIndicator}>
            <Text style={styles.selectedText}>✓ Seleccionado</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderEvolutionResult = () => {
    if (!evolutionResult) return null;

    const success = evolutionResult.success;

    return (
      <View style={styles.resultContainer}>
        <Text style={styles.resultEmoji}>
          {success ? '🌟' : '❌'}
        </Text>

        <Text style={[styles.resultTitle, !success && styles.resultTitleFailed]}>
          {success ? '¡Evolución Exitosa!' : 'Evolución Fallida'}
        </Text>

        {success && (
          <>
            <Text style={styles.newEvolutionName}>
              {being.name} ha evolucionado a:
            </Text>
            <Text style={styles.evolutionPathName}>
              {selectedEvolution?.name}
            </Text>

            {evolutionResult.newTraits && evolutionResult.newTraits.length > 0 && (
              <View style={styles.newTraitsSection}>
                <Text style={styles.newTraitsTitle}>Nuevos rasgos adquiridos:</Text>
                {evolutionResult.newTraits.map((trait, idx) => (
                  <View key={idx} style={styles.newTraitBadge}>
                    <Text style={styles.newTraitText}>{trait}</Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        <TouchableOpacity style={styles.resultButton} onPress={handleClose}>
          <Text style={styles.resultButtonText}>Continuar</Text>
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
            <View style={styles.headerLeft}>
              <Text style={styles.beingAvatar}>{being?.avatar || '🌱'}</Text>
              <View>
                <Text style={styles.headerTitle}>Evolución</Text>
                <Text style={styles.beingName}>{being?.name}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeIcon} onPress={handleClose}>
              <Text style={styles.closeIconText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Current Evolution Info */}
          {!evolutionResult && being && (
            <View style={styles.currentEvolutionInfo}>
              <Text style={styles.currentLabel}>Estado actual:</Text>
              <View style={[
                styles.currentTierBadge,
                { backgroundColor: `${tierColors[being.evolutionTier || 1]}20` }
              ]}>
                <Text style={[
                  styles.currentTierText,
                  { color: tierColors[being.evolutionTier || 1] }
                ]}>
                  Tier {being.evolutionTier || 1}: {tierNames[being.evolutionTier || 1]}
                </Text>
              </View>
            </View>
          )}

          <ScrollView style={styles.content}>
            {evolutionResult ? (
              renderEvolutionResult()
            ) : (
              <>
                {availableEvolutions.length > 0 ? (
                  <>
                    <Text style={styles.sectionTitle}>Caminos de Evolución Disponibles:</Text>
                    {availableEvolutions.map(renderEvolutionPath)}
                  </>
                ) : (
                  <View style={styles.noEvolutionsContainer}>
                    <Text style={styles.noEvolutionsIcon}>🔒</Text>
                    <Text style={styles.noEvolutionsText}>
                      No hay evoluciones disponibles todavía.
                    </Text>
                    <Text style={styles.noEvolutionsHint}>
                      Sigue entrenando a tu ser y completando misiones para desbloquear nuevas evoluciones.
                    </Text>
                  </View>
                )}
              </>
            )}
          </ScrollView>

          {/* Evolve Button */}
          {!evolutionResult && selectedEvolution && (
            <View style={styles.footer}>
              <TouchableOpacity
                style={[styles.evolveButton, evolving && styles.evolveButtonDisabled]}
                onPress={handleEvolve}
                disabled={evolving}
              >
                <Text style={styles.evolveButtonText}>
                  {evolving ? 'Evolucionando...' : '✨ Evolucionar'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContainer: {
    width: '94%',
    maxHeight: '90%',
    backgroundColor: '#1E293B',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(139, 92, 246, 0.2)'
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  beingAvatar: {
    fontSize: 36,
    marginRight: 12
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F8FAFC'
  },
  beingName: {
    fontSize: 14,
    color: '#C4B5FD'
  },
  closeIcon: {
    padding: 4
  },
  closeIconText: {
    fontSize: 20,
    color: '#94A3B8'
  },
  currentEvolutionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(51, 65, 85, 0.3)'
  },
  currentLabel: {
    fontSize: 14,
    color: '#94A3B8',
    marginRight: 10
  },
  currentTierBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12
  },
  currentTierText: {
    fontSize: 13,
    fontWeight: '600'
  },
  content: {
    flex: 1,
    padding: 16
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F8FAFC',
    marginBottom: 16
  },
  evolutionCard: {
    backgroundColor: 'rgba(51, 65, 85, 0.5)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'transparent'
  },
  evolutionCardSelected: {
    borderColor: '#8B5CF6',
    backgroundColor: 'rgba(139, 92, 246, 0.1)'
  },
  evolutionCardLocked: {
    opacity: 0.6
  },
  evolutionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  evolutionIcon: {
    fontSize: 40,
    marginRight: 12
  },
  evolutionTitleContainer: {
    flex: 1
  },
  evolutionName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F8FAFC',
    marginBottom: 4
  },
  tierBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8
  },
  tierText: {
    fontSize: 12,
    fontWeight: '600'
  },
  evolutionDescription: {
    fontSize: 14,
    color: '#CBD5E1',
    lineHeight: 20,
    marginBottom: 16
  },
  statBoostsContainer: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12
  },
  statBoostsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#10B981',
    marginBottom: 8
  },
  statBoostsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  statBoostItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8
  },
  statBoostName: {
    fontSize: 12,
    color: '#A7F3D0',
    marginRight: 4,
    textTransform: 'capitalize'
  },
  statBoostValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#10B981'
  },
  traitsContainer: {
    marginBottom: 12
  },
  traitsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FCD34D',
    marginBottom: 8
  },
  traitsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6
  },
  traitBadge: {
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8
  },
  traitText: {
    fontSize: 12,
    color: '#FCD34D'
  },
  requirementsContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#EF4444'
  },
  requirementsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F87171',
    marginBottom: 8
  },
  requirementText: {
    fontSize: 12,
    color: '#FCA5A5',
    marginBottom: 4
  },
  selectedIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12
  },
  selectedText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF'
  },
  noEvolutionsContainer: {
    alignItems: 'center',
    padding: 40
  },
  noEvolutionsIcon: {
    fontSize: 48,
    marginBottom: 16,
    opacity: 0.6
  },
  noEvolutionsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 8
  },
  noEvolutionsHint: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(71, 85, 105, 0.3)'
  },
  evolveButton: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center'
  },
  evolveButtonDisabled: {
    opacity: 0.6
  },
  evolveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF'
  },
  resultContainer: {
    alignItems: 'center',
    paddingVertical: 30
  },
  resultEmoji: {
    fontSize: 80,
    marginBottom: 20
  },
  resultTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#10B981',
    marginBottom: 16
  },
  resultTitleFailed: {
    color: '#F87171'
  },
  newEvolutionName: {
    fontSize: 16,
    color: '#CBD5E1',
    marginBottom: 8
  },
  evolutionPathName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#C4B5FD',
    marginBottom: 24
  },
  newTraitsSection: {
    alignItems: 'center',
    marginBottom: 24
  },
  newTraitsTitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 12
  },
  newTraitBadge: {
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 8
  },
  newTraitText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FCD34D'
  },
  resultButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 12
  },
  resultButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF'
  }
});

export default EvolutionModal;
