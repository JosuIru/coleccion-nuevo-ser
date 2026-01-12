/**
 * ExplorationPanel - Panel for exploring regions on the map
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView
} from 'react-native';
import { RESOURCES } from '../config/constants';

const ExplorationPanel = ({
  regions = [],
  exploredRegions = [],
  currentExpedition,
  selectedBeing,
  userEnergy,
  onExplore,
  onCompleteExpedition
}) => {
  const ENERGY_COST = RESOURCES.EXPLORATION.ENERGY_COST;

  const continentColors = {
    europe: '#3B82F6',
    asia: '#F59E0B',
    africa: '#10B981',
    americas: '#EF4444',
    oceania: '#8B5CF6',
    global: '#EC4899'
  };

  const continentNames = {
    europe: 'Europa',
    asia: 'Asia',
    africa: 'África',
    americas: 'Américas',
    oceania: 'Oceanía',
    global: 'Global'
  };

  const renderExpeditionProgress = () => {
    if (!currentExpedition) return null;

    const elapsed = Date.now() - new Date(currentExpedition.startedAt).getTime();
    const duration = currentExpedition.duration || 60000;
    const progress = Math.min(100, (elapsed / duration) * 100);
    const isComplete = progress >= 100;

    return (
      <View style={styles.expeditionContainer}>
        <View style={styles.expeditionHeader}>
          <Text style={styles.expeditionTitle}>🧭 Expedición en Curso</Text>
          <Text style={styles.expeditionRegion}>{currentExpedition.regionName}</Text>
        </View>

        <View style={styles.expeditionProgressBar}>
          <View
            style={[
              styles.expeditionProgressFill,
              { width: `${progress}%` }
            ]}
          />
        </View>

        <View style={styles.expeditionInfo}>
          <Text style={styles.expeditionBeing}>
            Explorador: {currentExpedition.beingName}
          </Text>
          <Text style={styles.expeditionStatus}>
            {isComplete ? '¡Completada!' : `${Math.round(progress)}%`}
          </Text>
        </View>

        {isComplete && (
          <TouchableOpacity
            style={styles.completeButton}
            onPress={onCompleteExpedition}
          >
            <Text style={styles.completeButtonText}>🎁 Recoger Recompensas</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderRegion = (region) => {
    const isExplored = exploredRegions.includes(region.id);
    const canExplore = selectedBeing && userEnergy >= ENERGY_COST && !currentExpedition;

    return (
      <TouchableOpacity
        key={region.id}
        style={[
          styles.regionCard,
          isExplored && styles.regionExplored,
          !canExplore && styles.regionLocked
        ]}
        onPress={() => canExplore && onExplore?.(region)}
        disabled={!canExplore || currentExpedition}
      >
        <View style={styles.regionHeader}>
          <Text style={styles.regionIcon}>{region.icon || '🗺️'}</Text>
          <View style={styles.regionInfo}>
            <Text style={styles.regionName}>{region.name}</Text>
            <View style={[
              styles.continentBadge,
              { backgroundColor: `${continentColors[region.continent]}20` }
            ]}>
              <Text style={[
                styles.continentText,
                { color: continentColors[region.continent] }
              ]}>
                {continentNames[region.continent] || region.continent}
              </Text>
            </View>
          </View>
          {isExplored && (
            <View style={styles.exploredBadge}>
              <Text style={styles.exploredIcon}>✓</Text>
            </View>
          )}
        </View>

        <Text style={styles.regionDescription} numberOfLines={2}>
          {region.description}
        </Text>

        {region.specialFinds && region.specialFinds.length > 0 && (
          <View style={styles.specialFindsContainer}>
            <Text style={styles.specialFindsLabel}>Descubrimientos especiales:</Text>
            <View style={styles.specialFindsList}>
              {region.specialFinds.slice(0, 3).map((find, idx) => (
                <Text key={idx} style={styles.specialFindItem}>
                  • {find}
                </Text>
              ))}
            </View>
          </View>
        )}

        <View style={styles.regionFooter}>
          <View style={styles.energyCostContainer}>
            <Text style={styles.energyIcon}>⚡</Text>
            <Text style={styles.energyCost}>{ENERGY_COST}</Text>
          </View>
          {!isExplored && canExplore && (
            <View style={styles.exploreTag}>
              <Text style={styles.exploreTagText}>Explorar</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Group regions by continent
  const regionsByContinent = regions.reduce((acc, region) => {
    const continent = region.continent || 'global';
    if (!acc[continent]) acc[continent] = [];
    acc[continent].push(region);
    return acc;
  }, {});

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🌍 Exploración del Mundo</Text>
        <View style={styles.statsRow}>
          <Text style={styles.exploredCount}>
            {exploredRegions.length}/{regions.length} regiones
          </Text>
          <View style={styles.energyDisplay}>
            <Text style={styles.energyIcon}>⚡</Text>
            <Text style={styles.energyValue}>{userEnergy}</Text>
          </View>
        </View>
      </View>

      {currentExpedition && renderExpeditionProgress()}

      {!selectedBeing && !currentExpedition && (
        <View style={styles.warningBanner}>
          <Text style={styles.warningIcon}>👤</Text>
          <Text style={styles.warningText}>
            Selecciona un ser para comenzar una expedición
          </Text>
        </View>
      )}

      {userEnergy < ENERGY_COST && !currentExpedition && (
        <View style={styles.warningBanner}>
          <Text style={styles.warningIcon}>⚡</Text>
          <Text style={styles.warningText}>
            Necesitas {ENERGY_COST} de energía para explorar
          </Text>
        </View>
      )}

      <ScrollView
        style={styles.regionsContainer}
        showsVerticalScrollIndicator={false}
      >
        {Object.entries(regionsByContinent).map(([continent, continentRegions]) => (
          <View key={continent} style={styles.continentSection}>
            <View style={styles.continentHeader}>
              <View style={[
                styles.continentDot,
                { backgroundColor: continentColors[continent] }
              ]} />
              <Text style={styles.continentTitle}>
                {continentNames[continent] || continent}
              </Text>
              <Text style={styles.continentCount}>
                {continentRegions.filter(r => exploredRegions.includes(r.id)).length}/
                {continentRegions.length}
              </Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.regionsRow}
            >
              {continentRegions.map(renderRegion)}
            </ScrollView>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(30, 41, 59, 0.95)',
    borderRadius: 16,
    padding: 12,
    margin: 8,
    maxHeight: 500
  },
  header: {
    marginBottom: 16
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F8FAFC',
    marginBottom: 8
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  exploredCount: {
    fontSize: 14,
    color: '#10B981'
  },
  energyDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12
  },
  energyIcon: {
    fontSize: 14,
    marginRight: 4
  },
  energyValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FCD34D'
  },
  expeditionContainer: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)'
  },
  expeditionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  expeditionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#C4B5FD'
  },
  expeditionRegion: {
    fontSize: 14,
    color: '#F8FAFC'
  },
  expeditionProgressBar: {
    height: 8,
    backgroundColor: 'rgba(71, 85, 105, 0.5)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10
  },
  expeditionProgressFill: {
    height: '100%',
    backgroundColor: '#8B5CF6',
    borderRadius: 4
  },
  expeditionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  expeditionBeing: {
    fontSize: 12,
    color: '#94A3B8'
  },
  expeditionStatus: {
    fontSize: 12,
    fontWeight: '600',
    color: '#C4B5FD'
  },
  completeButton: {
    backgroundColor: '#10B981',
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 12,
    alignItems: 'center'
  },
  completeButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF'
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12
  },
  warningIcon: {
    fontSize: 20,
    marginRight: 10
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#FCD34D'
  },
  regionsContainer: {
    flex: 1
  },
  continentSection: {
    marginBottom: 20
  },
  continentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  continentDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8
  },
  continentTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#E2E8F0',
    flex: 1
  },
  continentCount: {
    fontSize: 13,
    color: '#64748B'
  },
  regionsRow: {
    paddingRight: 12
  },
  regionCard: {
    backgroundColor: 'rgba(51, 65, 85, 0.6)',
    borderRadius: 14,
    padding: 14,
    marginRight: 12,
    width: 220,
    borderWidth: 1,
    borderColor: 'rgba(71, 85, 105, 0.3)'
  },
  regionExplored: {
    borderColor: 'rgba(16, 185, 129, 0.3)',
    backgroundColor: 'rgba(16, 185, 129, 0.05)'
  },
  regionLocked: {
    opacity: 0.5
  },
  regionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10
  },
  regionIcon: {
    fontSize: 28,
    marginRight: 10
  },
  regionInfo: {
    flex: 1
  },
  regionName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#F8FAFC',
    marginBottom: 4
  },
  continentBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6
  },
  continentText: {
    fontSize: 10,
    fontWeight: '600'
  },
  exploredBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center'
  },
  exploredIcon: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: 'bold'
  },
  regionDescription: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 18,
    marginBottom: 10
  },
  specialFindsContainer: {
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderRadius: 8,
    padding: 8,
    marginBottom: 10
  },
  specialFindsLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FCD34D',
    marginBottom: 4
  },
  specialFindsList: {
    gap: 2
  },
  specialFindItem: {
    fontSize: 10,
    color: '#FDE68A'
  },
  regionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  energyCostContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  energyCost: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FCD34D'
  },
  exploreTag: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8
  },
  exploreTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#C4B5FD'
  }
});

export default ExplorationPanel;
