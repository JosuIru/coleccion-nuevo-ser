/**
 * GuardiansPanel - Panel de Guardianes del Viejo Ser
 *
 * Muestra los 7 Guardianes, su estado y permite iniciar batallas
 *
 * FASE 2: Sistema de Guardianes
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView
} from 'react-native';

const GuardiansPanel = ({
  guardians = [],
  playerLevel = 1,
  onSelectGuardian,
  onViewTransformation
}) => {
  const activeGuardians = guardians.filter(g => !g.isTransformed);
  const transformedGuardians = guardians.filter(g => g.isTransformed);

  const renderGuardianCard = (guardian) => {
    const isLocked = guardian.requiredLevel > playerLevel;
    const healthPercentage = guardian.state
      ? (guardian.state.currentHealth / guardian.state.maxHealth) * 100
      : 100;

    return (
      <TouchableOpacity
        key={guardian.id}
        style={[
          styles.guardianCard,
          { borderColor: guardian.color + '40' },
          isLocked && styles.guardianLocked
        ]}
        onPress={() => !isLocked && !guardian.isTransformed && onSelectGuardian?.(guardian)}
        disabled={isLocked || guardian.isTransformed}
      >
        {/* Avatar y nombre */}
        <View style={styles.cardHeader}>
          <View style={[styles.avatarCircle, { backgroundColor: guardian.color + '30' }]}>
            <Text style={styles.avatarEmoji}>{guardian.avatar}</Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.guardianName}>{guardian.name}</Text>
            <Text style={[styles.guardianTitle, { color: guardian.color }]}>
              {guardian.title}
            </Text>
          </View>
          {isLocked && (
            <View style={styles.lockBadge}>
              <Text style={styles.lockIcon}>🔒</Text>
              <Text style={styles.lockLevel}>Nv.{guardian.requiredLevel}</Text>
            </View>
          )}
        </View>

        {/* Estructura que representa */}
        <Text style={styles.structureText}>{guardian.structure}</Text>

        {/* Barra de vida */}
        <View style={styles.healthSection}>
          <View style={styles.healthBar}>
            <View
              style={[
                styles.healthFill,
                {
                  width: `${healthPercentage}%`,
                  backgroundColor: healthPercentage > 50 ? '#EF4444' :
                                  healthPercentage > 25 ? '#F59E0B' : '#DC2626'
                }
              ]}
            />
          </View>
          <Text style={styles.healthText}>
            {Math.round(healthPercentage)}%
          </Text>
        </View>

        {/* Premisas que defiende */}
        <View style={styles.premisesRow}>
          {guardian.premises?.slice(0, 2).map((premise, idx) => (
            <View key={idx} style={styles.premiseBadge}>
              <Text style={styles.premiseText}>
                {premise.replace('_', ' ')}
              </Text>
            </View>
          ))}
        </View>

        {/* Debilidades */}
        <View style={styles.weaknessSection}>
          <Text style={styles.weaknessLabel}>Debilidades:</Text>
          <Text style={styles.weaknessText} numberOfLines={1}>
            {guardian.weaknesses?.slice(0, 2).join(', ').replace(/_/g, ' ')}
          </Text>
        </View>

        {/* Botón de batalla */}
        {!isLocked && !guardian.isTransformed && (
          <TouchableOpacity
            style={[styles.battleButton, { backgroundColor: guardian.color }]}
            onPress={() => onSelectGuardian?.(guardian)}
          >
            <Text style={styles.battleButtonText}>⚔️ BATALLA</Text>
          </TouchableOpacity>
        )}

        {/* Stats de batalla */}
        {guardian.state?.battlesWon > 0 && (
          <View style={styles.statsRow}>
            <Text style={styles.statsText}>
              Victorias: {guardian.state.battlesWon}
            </Text>
            <Text style={styles.statsText}>
              Daño total: {guardian.state.damageDealt}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderTransformedCard = (guardian) => (
    <TouchableOpacity
      key={guardian.id}
      style={[styles.transformedCard, { borderColor: '#10B981' + '40' }]}
      onPress={() => onViewTransformation?.(guardian)}
    >
      <View style={styles.transformedHeader}>
        <Text style={styles.transformedEmoji}>
          {guardian.transformation?.avatar || '✨'}
        </Text>
        <View style={styles.transformedInfo}>
          <Text style={styles.transformedName}>
            {guardian.transformation?.name || 'Transformado'}
          </Text>
          <Text style={styles.transformedOrigin}>
            Antes: {guardian.name}
          </Text>
        </View>
        <View style={styles.checkBadge}>
          <Text style={styles.checkIcon}>✓</Text>
        </View>
      </View>
      <Text style={styles.transformedDesc}>
        {guardian.transformation?.description}
      </Text>
    </TouchableOpacity>
  );

  const renderProgressBar = () => {
    const total = guardians.length;
    const transformed = transformedGuardians.length;
    const percentage = total > 0 ? (transformed / total) * 100 : 0;

    return (
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>Transformación del Sistema</Text>
          <Text style={styles.progressCount}>{transformed}/{total}</Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${percentage}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {percentage === 100
            ? '¡Todos los guardianes han sido transformados!'
            : `${Math.round(percentage)}% del viejo paradigma transformado`
          }
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Barra de progreso global */}
      {renderProgressBar()}

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Guardianes activos */}
        {activeGuardians.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              🏛️ Guardianes del Viejo Paradigma
            </Text>
            <Text style={styles.sectionSubtitle}>
              Estructuras que perpetúan el sistema actual
            </Text>
            <View style={styles.guardiansList}>
              {activeGuardians.map(renderGuardianCard)}
            </View>
          </View>
        )}

        {/* Guardianes transformados */}
        {transformedGuardians.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              ✨ Estructuras Transformadas
            </Text>
            <Text style={styles.sectionSubtitle}>
              El Nuevo Ser emergiendo del Viejo
            </Text>
            <View style={styles.transformedList}>
              {transformedGuardians.map(renderTransformedCard)}
            </View>
          </View>
        )}
      </ScrollView>
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
  progressSection: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#F8FAFC'
  },
  progressCount: {
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F8FAFC',
    marginBottom: 4
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 12
  },
  guardiansList: {
    gap: 12
  },
  guardianCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1
  },
  guardianLocked: {
    opacity: 0.6
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
  cardInfo: {
    flex: 1,
    marginLeft: 12
  },
  guardianName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F8FAFC'
  },
  guardianTitle: {
    fontSize: 12
  },
  lockBadge: {
    alignItems: 'center',
    padding: 4
  },
  lockIcon: {
    fontSize: 16
  },
  lockLevel: {
    fontSize: 10,
    color: '#94A3B8'
  },
  structureText: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 10
  },
  healthSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10
  },
  healthBar: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(51, 65, 85, 0.5)',
    borderRadius: 3,
    overflow: 'hidden',
    marginRight: 8
  },
  healthFill: {
    height: '100%',
    borderRadius: 3
  },
  healthText: {
    fontSize: 12,
    color: '#F87171',
    width: 40,
    textAlign: 'right'
  },
  premisesRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8
  },
  premiseBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10
  },
  premiseText: {
    fontSize: 10,
    color: '#F87171',
    textTransform: 'capitalize'
  },
  weaknessSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  weaknessLabel: {
    fontSize: 10,
    color: '#64748B',
    marginRight: 4
  },
  weaknessText: {
    flex: 1,
    fontSize: 10,
    color: '#10B981',
    textTransform: 'capitalize'
  },
  battleButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  battleButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF'
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(71, 85, 105, 0.3)'
  },
  statsText: {
    fontSize: 10,
    color: '#64748B'
  },
  transformedList: {
    gap: 10
  },
  transformedCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1
  },
  transformedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  transformedEmoji: {
    fontSize: 32
  },
  transformedInfo: {
    flex: 1,
    marginLeft: 12
  },
  transformedName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#10B981'
  },
  transformedOrigin: {
    fontSize: 11,
    color: '#64748B'
  },
  checkBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center'
  },
  checkIcon: {
    color: '#FFFFFF',
    fontWeight: 'bold'
  },
  transformedDesc: {
    fontSize: 12,
    color: '#6EE7B7',
    lineHeight: 18
  }
});

export default GuardiansPanel;
