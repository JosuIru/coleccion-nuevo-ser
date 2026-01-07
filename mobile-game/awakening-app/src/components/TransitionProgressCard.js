/**
 * TransitionProgressCard - Shows progress toward La Gran Transición
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated
} from 'react-native';

const TransitionProgressCard = ({
  currentTitle,
  overallProgress,
  pillars,
  narrative,
  onPillarPress,
  compact = false
}) => {
  const getProgressColor = (progress) => {
    if (progress < 25) return '#6B7280'; // gray
    if (progress < 50) return '#F59E0B'; // amber
    if (progress < 75) return '#10B981'; // emerald
    if (progress < 100) return '#8B5CF6'; // purple
    return '#FFD700'; // gold
  };

  const pillarIcons = {
    personal: '🧘',
    collective: '🌍',
    transcendent: '✨'
  };

  if (compact) {
    return (
      <TouchableOpacity style={styles.compactContainer} onPress={() => onPillarPress?.('overview')}>
        <View style={styles.compactHeader}>
          <Text style={styles.titleBadge}>{currentTitle}</Text>
          <Text style={styles.progressText}>{overallProgress}%</Text>
        </View>
        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBar,
              { width: `${overallProgress}%`, backgroundColor: getProgressColor(overallProgress) }
            ]}
          />
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.mainTitle}>La Gran Transición</Text>
        <View style={styles.titleBadgeContainer}>
          <Text style={styles.titleBadge}>{currentTitle}</Text>
        </View>
      </View>

      {/* Overall Progress */}
      <View style={styles.overallProgressSection}>
        <Text style={styles.progressLabel}>Progreso Total</Text>
        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBar,
              { width: `${overallProgress}%`, backgroundColor: getProgressColor(overallProgress) }
            ]}
          />
        </View>
        <Text style={styles.progressPercentage}>{overallProgress}%</Text>
      </View>

      {/* Pillars */}
      <View style={styles.pillarsContainer}>
        {Object.entries(pillars || {}).map(([pillarId, pillar]) => (
          <TouchableOpacity
            key={pillarId}
            style={styles.pillarCard}
            onPress={() => onPillarPress?.(pillarId)}
          >
            <Text style={styles.pillarIcon}>{pillarIcons[pillarId] || '📊'}</Text>
            <Text style={styles.pillarName} numberOfLines={1}>{pillar.name}</Text>
            <View style={styles.pillarProgressBar}>
              <View
                style={[
                  styles.pillarProgressFill,
                  { width: `${pillar.progress}%`, backgroundColor: getProgressColor(pillar.progress) }
                ]}
              />
            </View>
            <Text style={styles.pillarCount}>
              {pillar.completedCount}/{pillar.totalCount}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Narrative */}
      {narrative && (
        <View style={styles.narrativeSection}>
          <Text style={styles.narrativeTitle}>{narrative.title}</Text>
          <Text style={styles.narrativeText}>{narrative.narrative}</Text>
          <Text style={styles.encouragement}>{narrative.encouragement}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(30, 41, 59, 0.95)',
    borderRadius: 16,
    padding: 16,
    margin: 8,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)'
  },
  compactContainer: {
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 8,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)'
  },
  compactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  mainTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F8FAFC'
  },
  titleBadgeContainer: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12
  },
  titleBadge: {
    fontSize: 14,
    fontWeight: '600',
    color: '#C4B5FD'
  },
  overallProgressSection: {
    marginBottom: 16
  },
  progressLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 8
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: 'rgba(71, 85, 105, 0.5)',
    borderRadius: 4,
    overflow: 'hidden'
  },
  progressBar: {
    height: '100%',
    borderRadius: 4
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#F8FAFC',
    textAlign: 'right',
    marginTop: 4
  },
  progressText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#C4B5FD'
  },
  pillarsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  pillarCard: {
    flex: 1,
    backgroundColor: 'rgba(51, 65, 85, 0.5)',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 4,
    alignItems: 'center'
  },
  pillarIcon: {
    fontSize: 24,
    marginBottom: 8
  },
  pillarName: {
    fontSize: 11,
    color: '#CBD5E1',
    textAlign: 'center',
    marginBottom: 8
  },
  pillarProgressBar: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(71, 85, 105, 0.5)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4
  },
  pillarProgressFill: {
    height: '100%',
    borderRadius: 2
  },
  pillarCount: {
    fontSize: 10,
    color: '#94A3B8'
  },
  narrativeSection: {
    backgroundColor: 'rgba(51, 65, 85, 0.3)',
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#8B5CF6'
  },
  narrativeTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#C4B5FD',
    marginBottom: 8
  },
  narrativeText: {
    fontSize: 13,
    color: '#E2E8F0',
    lineHeight: 20,
    marginBottom: 8
  },
  encouragement: {
    fontSize: 12,
    color: '#FCD34D',
    fontStyle: 'italic'
  }
});

export default TransitionProgressCard;
