/**
 * InstitutionsPanel - Panel de Instituciones del Nuevo Ser
 *
 * Muestra las 7 instituciones construibles, su estado, progreso
 * y permite construir/mejorar instituciones.
 *
 * FASE 3: Sistema de Instituciones
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

const InstitutionsPanel = ({
  institutions = [],
  gameState = {},
  onBuild,
  onUpgrade,
  onCollectResources,
  onViewDetails
}) => {
  const [selectedInstitution, setSelectedInstitution] = useState(null);
  const [showBuildModal, setShowBuildModal] = useState(false);

  const builtInstitutions = institutions.filter(i => i.isBuilt);
  const availableInstitutions = institutions.filter(i => !i.isBuilt);

  const handleBuildPress = (institution) => {
    setSelectedInstitution(institution);
    setShowBuildModal(true);
  };

  const handleConfirmBuild = () => {
    if (selectedInstitution && onBuild) {
      onBuild(selectedInstitution.id);
    }
    setShowBuildModal(false);
    setSelectedInstitution(null);
  };

  const renderStats = () => {
    const total = institutions.length;
    const built = builtInstitutions.length;
    const percentage = total > 0 ? (built / total) * 100 : 0;

    return (
      <View style={styles.statsSection}>
        <View style={styles.statsHeader}>
          <Text style={styles.statsTitle}>Instituciones del Nuevo Ser</Text>
          <Text style={styles.statsCount}>{built}/{total}</Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${percentage}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {percentage === 100
            ? '¡Todas las instituciones construidas!'
            : `${Math.round(percentage)}% del Nuevo Ser materializado`
          }
        </Text>
      </View>
    );
  };

  const renderBuiltCard = (institution) => {
    const levelData = institution.levels?.[institution.currentLevel] || {};

    return (
      <TouchableOpacity
        key={institution.id}
        style={[
          styles.builtCard,
          { borderColor: institution.color + '60', backgroundColor: institution.bgColor }
        ]}
        onPress={() => onViewDetails?.(institution)}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.avatarCircle, { backgroundColor: institution.color + '30' }]}>
            <Text style={styles.avatarEmoji}>{institution.avatar}</Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.institutionName}>{institution.shortName}</Text>
            <Text style={[styles.levelName, { color: institution.color }]}>
              {levelData.name || `Nivel ${institution.currentLevel}`}
            </Text>
          </View>
          <View style={styles.levelBadge}>
            <Text style={[styles.levelNumber, { color: institution.color }]}>
              Nv.{institution.currentLevel}
            </Text>
          </View>
        </View>

        <Text style={styles.descriptionText} numberOfLines={2}>
          {institution.description}
        </Text>

        {/* Contador guardián */}
        <View style={styles.counterRow}>
          <Text style={styles.counterLabel}>Contrarresta:</Text>
          <View style={styles.counterBadges}>
            {institution.counters?.map(guardianId => (
              <View key={guardianId} style={styles.counterBadge}>
                <Text style={styles.counterText}>
                  {guardianId.charAt(0).toUpperCase() + guardianId.slice(1)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Botones de acción */}
        <View style={styles.actionRow}>
          {institution.currentLevel < 4 && (
            <TouchableOpacity
              style={[styles.upgradeButton, { backgroundColor: institution.color }]}
              onPress={() => onUpgrade?.(institution.id)}
            >
              <Text style={styles.upgradeButtonText}>⬆️ MEJORAR</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.detailsButton}
            onPress={() => onViewDetails?.(institution)}
          >
            <Text style={styles.detailsButtonText}>Ver detalles</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderAvailableCard = (institution) => {
    const canBuild = institution.canBuild;
    const reqs = institution.requirements;

    return (
      <TouchableOpacity
        key={institution.id}
        style={[
          styles.availableCard,
          { borderColor: canBuild ? institution.color + '40' : '#475569' + '40' },
          !canBuild && styles.lockedCard
        ]}
        onPress={() => canBuild && handleBuildPress(institution)}
        disabled={!canBuild}
      >
        <View style={styles.cardHeader}>
          <View style={[
            styles.avatarCircle,
            { backgroundColor: canBuild ? institution.color + '20' : '#475569' + '20' }
          ]}>
            <Text style={[styles.avatarEmoji, !canBuild && styles.lockedEmoji]}>
              {institution.avatar}
            </Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={[styles.institutionName, !canBuild && styles.lockedText]}>
              {institution.name}
            </Text>
            <Text style={styles.counterLabel}>
              vs {institution.counters?.join(', ')}
            </Text>
          </View>
          {!canBuild && (
            <View style={styles.lockIcon}>
              <Text style={styles.lockEmoji}>🔒</Text>
            </View>
          )}
        </View>

        <Text style={[styles.descriptionText, !canBuild && styles.lockedText]} numberOfLines={2}>
          {institution.description}
        </Text>

        {/* Requisitos */}
        <View style={styles.requirementsSection}>
          <Text style={styles.requirementsLabel}>Requisitos:</Text>
          <View style={styles.requirementsList}>
            <View style={[
              styles.requirementItem,
              gameState.level >= reqs.minLevel && styles.requirementMet
            ]}>
              <Text style={styles.requirementText}>
                Nivel {reqs.minLevel}
              </Text>
            </View>
            <View style={[
              styles.requirementItem,
              (gameState.resources?.wisdomFragments || 0) >= reqs.resources.wisdomFragments && styles.requirementMet
            ]}>
              <Text style={styles.requirementText}>
                {reqs.resources.wisdomFragments} Fragmentos
              </Text>
            </View>
          </View>
          {reqs.quizzes?.length > 0 && (
            <Text style={styles.quizzesText}>
              📖 Quizzes: {reqs.quizzes.join(', ')}
            </Text>
          )}
        </View>

        {/* Botón de construcción */}
        {canBuild ? (
          <TouchableOpacity
            style={[styles.buildButton, { backgroundColor: institution.color }]}
            onPress={() => handleBuildPress(institution)}
          >
            <Text style={styles.buildButtonText}>🏗️ CONSTRUIR</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.lockedButton}>
            <Text style={styles.lockedButtonText}>Requisitos pendientes</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderBuildModal = () => {
    if (!selectedInstitution) return null;

    return (
      <Modal
        visible={showBuildModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowBuildModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={[styles.modalHeader, { backgroundColor: selectedInstitution.bgColor }]}>
              <Text style={styles.modalEmoji}>{selectedInstitution.avatar}</Text>
              <Text style={styles.modalTitle}>{selectedInstitution.name}</Text>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalDescription}>
                {selectedInstitution.description}
              </Text>

              <Text style={styles.modalLore}>
                "{selectedInstitution.lore}"
              </Text>

              <View style={styles.benefitsSection}>
                <Text style={styles.benefitsTitle}>Beneficios:</Text>
                <View style={styles.benefitsList}>
                  <Text style={styles.benefitItem}>
                    ✨ +{selectedInstitution.benefits?.globalConsciousnessBonus}% Consciencia Global
                  </Text>
                  <Text style={styles.benefitItem}>
                    ⚔️ +{selectedInstitution.counterBonus}% daño vs {selectedInstitution.counters?.join(', ')}
                  </Text>
                  {selectedInstitution.benefits?.unlocks?.map((ability, idx) => (
                    <Text key={idx} style={styles.benefitItem}>
                      🔓 Desbloquea: {ability.replace(/_/g, ' ')}
                    </Text>
                  ))}
                </View>
              </View>

              <View style={styles.costSection}>
                <Text style={styles.costTitle}>Costo:</Text>
                <Text style={styles.costItem}>
                  💎 {selectedInstitution.requirements?.resources?.wisdomFragments} Fragmentos de Sabiduría
                </Text>
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowBuildModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, { backgroundColor: selectedInstitution.color }]}
                onPress={handleConfirmBuild}
              >
                <Text style={styles.confirmButtonText}>🏗️ Construir</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      {renderStats()}

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Instituciones construidas */}
        {builtInstitutions.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                ✨ Instituciones Activas
              </Text>
              {onCollectResources && (
                <TouchableOpacity
                  style={styles.collectButton}
                  onPress={onCollectResources}
                >
                  <Text style={styles.collectButtonText}>💰 Recolectar</Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.sectionSubtitle}>
              Estructuras del Nuevo Ser generando cambio
            </Text>
            <View style={styles.institutionsList}>
              {builtInstitutions.map(renderBuiltCard)}
            </View>
          </View>
        )}

        {/* Instituciones disponibles */}
        {availableInstitutions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              🏗️ Por Construir
            </Text>
            <Text style={styles.sectionSubtitle}>
              Completa los requisitos para materializar estas estructuras
            </Text>
            <View style={styles.institutionsList}>
              {availableInstitutions.map(renderAvailableCard)}
            </View>
          </View>
        )}
      </ScrollView>

      {renderBuildModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  scrollContainer: {
    flex: 1
  },
  statsSection: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  statsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#F8FAFC'
  },
  statsCount: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: 'bold'
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(51, 65, 85, 0.5)',
    borderRadius: 4,
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4
  },
  progressText: {
    marginTop: 8,
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center'
  },
  section: {
    marginBottom: 20
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F8FAFC'
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 12
  },
  collectButton: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16
  },
  collectButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1E293B'
  },
  institutionsList: {
    gap: 12
  },
  builtCard: {
    borderRadius: 12,
    padding: 14,
    borderWidth: 1
  },
  availableCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1
  },
  lockedCard: {
    opacity: 0.7
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center'
  },
  avatarEmoji: {
    fontSize: 28
  },
  lockedEmoji: {
    opacity: 0.5
  },
  cardInfo: {
    flex: 1,
    marginLeft: 12
  },
  institutionName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F8FAFC'
  },
  lockedText: {
    color: '#64748B'
  },
  levelName: {
    fontSize: 12
  },
  levelBadge: {
    padding: 4
  },
  levelNumber: {
    fontSize: 12,
    fontWeight: 'bold'
  },
  lockIcon: {
    padding: 4
  },
  lockEmoji: {
    fontSize: 18
  },
  descriptionText: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 10,
    lineHeight: 18
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10
  },
  counterLabel: {
    fontSize: 10,
    color: '#64748B',
    marginRight: 6
  },
  counterBadges: {
    flexDirection: 'row',
    gap: 4
  },
  counterBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10
  },
  counterText: {
    fontSize: 10,
    color: '#F87171'
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8
  },
  upgradeButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center'
  },
  upgradeButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF'
  },
  detailsButton: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#475569'
  },
  detailsButtonText: {
    fontSize: 12,
    color: '#94A3B8'
  },
  requirementsSection: {
    marginBottom: 12
  },
  requirementsLabel: {
    fontSize: 10,
    color: '#64748B',
    marginBottom: 4
  },
  requirementsList: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 4
  },
  requirementItem: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10
  },
  requirementMet: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)'
  },
  requirementText: {
    fontSize: 10,
    color: '#F8FAFC'
  },
  quizzesText: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 4
  },
  buildButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  buildButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF'
  },
  lockedButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: 'rgba(71, 85, 105, 0.3)'
  },
  lockedButtonText: {
    fontSize: 12,
    color: '#64748B'
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
    maxWidth: 400,
    overflow: 'hidden'
  },
  modalHeader: {
    padding: 20,
    alignItems: 'center'
  },
  modalEmoji: {
    fontSize: 48,
    marginBottom: 8
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F8FAFC',
    textAlign: 'center'
  },
  modalBody: {
    padding: 20
  },
  modalDescription: {
    fontSize: 14,
    color: '#CBD5E1',
    marginBottom: 12,
    lineHeight: 20
  },
  modalLore: {
    fontSize: 13,
    color: '#94A3B8',
    fontStyle: 'italic',
    marginBottom: 16,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: '#475569'
  },
  benefitsSection: {
    marginBottom: 16
  },
  benefitsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#10B981',
    marginBottom: 8
  },
  benefitsList: {
    gap: 4
  },
  benefitItem: {
    fontSize: 12,
    color: '#CBD5E1'
  },
  costSection: {
    backgroundColor: 'rgba(51, 65, 85, 0.5)',
    padding: 12,
    borderRadius: 8
  },
  costTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#F8FAFC',
    marginBottom: 4
  },
  costItem: {
    fontSize: 12,
    color: '#F59E0B'
  },
  modalActions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155'
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#475569'
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#F8FAFC'
  },
  confirmButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center'
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF'
  }
});

export default InstitutionsPanel;
