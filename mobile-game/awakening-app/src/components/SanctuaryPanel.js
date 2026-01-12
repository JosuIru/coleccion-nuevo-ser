/**
 * SanctuaryPanel.js
 * Panel del Santuario - Muestra los seres del jugador con animaciones
 * Vista tipo "hogar" donde los seres descansan y están disponibles
 */

import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  Easing
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import AnimatedBeing from './AnimatedBeing';
import { COLORS, ATTRIBUTES } from '../config/constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SanctuaryPanel = ({
  beings = [],
  onBeingPress,
  onDeployPress,
  expanded = false,
  onToggleExpand
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [selectedBeing, setSelectedBeing] = useState(null);

  // Animación de entrada
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true
    }).start();
  }, []);

  // Separar seres por estado
  const availableBeings = beings.filter(b => b.status === 'available');
  const deployedBeings = beings.filter(b => b.status === 'deployed');
  const restingBeings = beings.filter(b => b.status === 'resting');

  // Calcular poder total
  const totalPower = beings.reduce((sum, b) => {
    if (!b.attributes) return sum;
    return sum + Object.values(b.attributes).reduce((s, v) => s + v, 0);
  }, 0);

  const handleBeingPress = (being) => {
    setSelectedBeing(selectedBeing?.id === being.id ? null : being);
    if (onBeingPress) onBeingPress(being);
  };

  // Renderizar un ser en el santuario
  const renderSanctuaryBeing = (being, index) => {
    const isSelected = selectedBeing?.id === being.id;
    const power = being.attributes
      ? Object.values(being.attributes).reduce((s, v) => s + v, 0)
      : 0;

    return (
      <TouchableOpacity
        key={being.id}
        style={[
          styles.beingSlot,
          isSelected && styles.beingSlotSelected
        ]}
        onPress={() => handleBeingPress(being)}
        activeOpacity={0.8}
      >
        <AnimatedBeing
          being={being}
          size="medium"
          showAura={true}
          showParticles={being.status !== 'resting'}
        />

        <Text style={styles.beingName} numberOfLines={1}>
          {being.name || `Ser ${index + 1}`}
        </Text>

        <View style={styles.beingPower}>
          <Text style={styles.beingPowerIcon}>⚡</Text>
          <Text style={styles.beingPowerValue}>{power}</Text>
        </View>

        {/* Botón de acción rápida */}
        {isSelected && being.status === 'available' && (
          <TouchableOpacity
            style={styles.quickDeployButton}
            onPress={() => onDeployPress && onDeployPress(being)}
          >
            <Text style={styles.quickDeployText}>🚀 Desplegar</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  // Vista compacta (header)
  const renderCompactView = () => (
    <TouchableOpacity
      style={styles.compactContainer}
      onPress={onToggleExpand}
      activeOpacity={0.9}
    >
      <LinearGradient
        colors={['rgba(30, 58, 138, 0.9)', 'rgba(30, 41, 59, 0.95)']}
        style={styles.compactGradient}
      >
        <View style={styles.compactHeader}>
          <Text style={styles.compactTitle}>🏛️ Santuario</Text>
          <View style={styles.compactStats}>
            <View style={styles.compactStat}>
              <Text style={styles.compactStatValue}>{beings.length}</Text>
              <Text style={styles.compactStatLabel}>Seres</Text>
            </View>
            <View style={styles.compactStatDivider} />
            <View style={styles.compactStat}>
              <Text style={[styles.compactStatValue, { color: '#22c55e' }]}>
                {availableBeings.length}
              </Text>
              <Text style={styles.compactStatLabel}>Listos</Text>
            </View>
            <View style={styles.compactStatDivider} />
            <View style={styles.compactStat}>
              <Text style={[styles.compactStatValue, { color: '#f97316' }]}>
                {deployedBeings.length}
              </Text>
              <Text style={styles.compactStatLabel}>Activos</Text>
            </View>
          </View>
          <Text style={styles.expandIcon}>{expanded ? '▼' : '▲'}</Text>
        </View>

        {/* Mini preview de seres */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.miniBeingsRow}
        >
          {beings.slice(0, 5).map((being, index) => (
            <View key={being.id} style={styles.miniBeing}>
              <AnimatedBeing
                being={being}
                size="small"
                showAura={false}
                showParticles={false}
              />
            </View>
          ))}
          {beings.length > 5 && (
            <View style={styles.moreBeings}>
              <Text style={styles.moreBeingsText}>+{beings.length - 5}</Text>
            </View>
          )}
        </ScrollView>
      </LinearGradient>
    </TouchableOpacity>
  );

  // Vista expandida (santuario completo)
  const renderExpandedView = () => (
    <Animated.View style={[styles.expandedContainer, { opacity: fadeAnim }]}>
      <LinearGradient
        colors={['rgba(30, 58, 138, 0.95)', 'rgba(15, 23, 42, 0.98)']}
        style={styles.expandedGradient}
      >
        {/* Header del Santuario */}
        <View style={styles.sanctuaryHeader}>
          <TouchableOpacity onPress={onToggleExpand} style={styles.collapseButton}>
            <Text style={styles.collapseIcon}>▼</Text>
          </TouchableOpacity>

          <View style={styles.sanctuaryTitleContainer}>
            <Text style={styles.sanctuaryTitle}>🏛️ Santuario</Text>
            <Text style={styles.sanctuarySubtitle}>
              Hogar de tus seres transformadores
            </Text>
          </View>

          <View style={styles.totalPower}>
            <Text style={styles.totalPowerLabel}>Poder Total</Text>
            <Text style={styles.totalPowerValue}>⚡ {totalPower}</Text>
          </View>
        </View>

        {/* Estadísticas rápidas */}
        <View style={styles.statsRow}>
          <View style={[styles.statBox, { borderColor: '#22c55e' }]}>
            <Text style={styles.statBoxIcon}>✓</Text>
            <Text style={[styles.statBoxValue, { color: '#22c55e' }]}>
              {availableBeings.length}
            </Text>
            <Text style={styles.statBoxLabel}>Disponibles</Text>
          </View>
          <View style={[styles.statBox, { borderColor: '#f97316' }]}>
            <Text style={styles.statBoxIcon}>🔥</Text>
            <Text style={[styles.statBoxValue, { color: '#f97316' }]}>
              {deployedBeings.length}
            </Text>
            <Text style={styles.statBoxLabel}>En Misión</Text>
          </View>
          <View style={[styles.statBox, { borderColor: '#3b82f6' }]}>
            <Text style={styles.statBoxIcon}>💤</Text>
            <Text style={[styles.statBoxValue, { color: '#3b82f6' }]}>
              {restingBeings.length}
            </Text>
            <Text style={styles.statBoxLabel}>Descansando</Text>
          </View>
        </View>

        {/* Grid de seres */}
        <ScrollView
          style={styles.beingsScrollView}
          contentContainerStyle={styles.beingsGrid}
          showsVerticalScrollIndicator={false}
        >
          {beings.length > 0 ? (
            <>
              {/* Seres disponibles primero */}
              {availableBeings.length > 0 && (
                <View style={styles.beingSection}>
                  <Text style={styles.sectionTitle}>
                    ✨ Listos para la acción ({availableBeings.length})
                  </Text>
                  <View style={styles.beingsRow}>
                    {availableBeings.map((being, index) =>
                      renderSanctuaryBeing(being, index)
                    )}
                  </View>
                </View>
              )}

              {/* Seres desplegados */}
              {deployedBeings.length > 0 && (
                <View style={styles.beingSection}>
                  <Text style={styles.sectionTitle}>
                    🔥 En misión ({deployedBeings.length})
                  </Text>
                  <View style={styles.beingsRow}>
                    {deployedBeings.map((being, index) =>
                      renderSanctuaryBeing(being, index)
                    )}
                  </View>
                </View>
              )}

              {/* Seres descansando */}
              {restingBeings.length > 0 && (
                <View style={styles.beingSection}>
                  <Text style={styles.sectionTitle}>
                    💤 Recuperándose ({restingBeings.length})
                  </Text>
                  <View style={styles.beingsRow}>
                    {restingBeings.map((being, index) =>
                      renderSanctuaryBeing(being, index)
                    )}
                  </View>
                </View>
              )}
            </>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🧬</Text>
              <Text style={styles.emptyText}>Tu santuario está vacío</Text>
              <Text style={styles.emptyHint}>
                Crea seres en el Laboratorio para poblar tu santuario
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Detalle del ser seleccionado */}
        {selectedBeing && (
          <View style={styles.selectedBeingDetail}>
            <View style={styles.selectedBeingHeader}>
              <AnimatedBeing
                being={selectedBeing}
                size="small"
                showAura={true}
                showParticles={true}
              />
              <View style={styles.selectedBeingInfo}>
                <Text style={styles.selectedBeingName}>
                  {selectedBeing.name}
                </Text>
                <Text style={styles.selectedBeingStatus}>
                  {selectedBeing.status === 'available' && '✓ Disponible'}
                  {selectedBeing.status === 'deployed' && '🔥 En misión'}
                  {selectedBeing.status === 'resting' && '💤 Descansando'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.closeDetailButton}
                onPress={() => setSelectedBeing(null)}
              >
                <Text style={styles.closeDetailIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Atributos */}
            <View style={styles.attributesRow}>
              {selectedBeing.attributes &&
                Object.entries(selectedBeing.attributes).map(([key, value]) => {
                  const config = ATTRIBUTES[key];
                  if (!config) return null;
                  return (
                    <View key={key} style={styles.attrItem}>
                      <Text style={styles.attrIcon}>{config.icon}</Text>
                      <View style={styles.attrBarBg}>
                        <View
                          style={[
                            styles.attrBarFill,
                            { width: `${value}%`, backgroundColor: config.color }
                          ]}
                        />
                      </View>
                      <Text style={styles.attrValue}>{value}</Text>
                    </View>
                  );
                })}
            </View>
          </View>
        )}
      </LinearGradient>
    </Animated.View>
  );

  return expanded ? renderExpandedView() : renderCompactView();
};

const styles = StyleSheet.create({
  // Vista compacta
  compactContainer: {
    marginHorizontal: 12,
    marginVertical: 8,
    borderRadius: 16,
    overflow: 'hidden'
  },
  compactGradient: {
    padding: 12
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  compactTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff'
  },
  compactStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  compactStat: {
    alignItems: 'center'
  },
  compactStatValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff'
  },
  compactStatLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)'
  },
  compactStatDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255,255,255,0.2)'
  },
  expandIcon: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)'
  },
  miniBeingsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 4
  },
  miniBeing: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center'
  },
  moreBeings: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 25
  },
  moreBeingsText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)'
  },

  // Vista expandida
  expandedContainer: {
    flex: 1,
    margin: 8,
    borderRadius: 20,
    overflow: 'hidden'
  },
  expandedGradient: {
    flex: 1,
    padding: 16
  },
  sanctuaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16
  },
  collapseButton: {
    padding: 8
  },
  collapseIcon: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)'
  },
  sanctuaryTitleContainer: {
    flex: 1,
    marginLeft: 8
  },
  sanctuaryTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff'
  },
  sanctuarySubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2
  },
  totalPower: {
    alignItems: 'flex-end'
  },
  totalPowerLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)'
  },
  totalPowerValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fbbf24'
  },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    borderWidth: 1
  },
  statBoxIcon: {
    fontSize: 16,
    marginBottom: 4
  },
  statBoxValue: {
    fontSize: 20,
    fontWeight: '700'
  },
  statBoxLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2
  },

  // Grid de seres
  beingsScrollView: {
    flex: 1
  },
  beingsGrid: {
    paddingBottom: 100
  },
  beingSection: {
    marginBottom: 20
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 12
  },
  beingsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12
  },
  beingSlot: {
    width: (SCREEN_WIDTH - 80) / 3,
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'transparent'
  },
  beingSlotSelected: {
    borderColor: COLORS.accent.primary,
    backgroundColor: 'rgba(96, 165, 250, 0.1)'
  },
  beingName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
    marginTop: 8,
    textAlign: 'center'
  },
  beingPower: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 2
  },
  beingPowerIcon: {
    fontSize: 10
  },
  beingPowerValue: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fbbf24'
  },
  quickDeployButton: {
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: COLORS.accent.primary,
    borderRadius: 8
  },
  quickDeployText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff'
  },

  // Empty state
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
    opacity: 0.5
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)'
  },
  emptyHint: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40
  },

  // Detalle del ser seleccionado
  selectedBeingDetail: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)'
  },
  selectedBeingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  selectedBeingInfo: {
    flex: 1,
    marginLeft: 12
  },
  selectedBeingName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff'
  },
  selectedBeingStatus: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2
  },
  closeDetailButton: {
    padding: 8
  },
  closeDetailIcon: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.6)'
  },
  attributesRow: {
    gap: 8
  },
  attrItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  attrIcon: {
    fontSize: 14,
    width: 24
  },
  attrBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden'
  },
  attrBarFill: {
    height: '100%',
    borderRadius: 3
  },
  attrValue: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    width: 30,
    textAlign: 'right'
  }
});

export default SanctuaryPanel;
