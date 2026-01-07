/**
 * PowerNodesPanel - Shows sanctuaries and corruption zones
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView
} from 'react-native';

const PowerNodesPanel = ({
  sanctuaries = [],
  corruptionZones = [],
  onSanctuaryPress,
  onCorruptionZonePress,
  selectedBeing
}) => {
  const sanctuaryIcons = {
    reflection: '🧘',
    empathy: '💝',
    action: '⚔️',
    knowledge: '📚',
    energy: '⚡',
    connection: '🌐'
  };

  const corruptionIcons = {
    despair: '😰',
    chaos: '🌀',
    shadow: '🌑',
    void: '⚫'
  };

  const renderSanctuary = (sanctuary) => (
    <TouchableOpacity
      key={sanctuary.id}
      style={[
        styles.nodeCard,
        styles.sanctuaryCard,
        sanctuary.locked && styles.lockedCard
      ]}
      onPress={() => !sanctuary.locked && onSanctuaryPress?.(sanctuary)}
      disabled={sanctuary.locked}
    >
      <Text style={styles.nodeIcon}>
        {sanctuary.locked ? '🔒' : sanctuaryIcons[sanctuary.type] || '⛩️'}
      </Text>
      <View style={styles.nodeInfo}>
        <Text style={styles.nodeName}>{sanctuary.name}</Text>
        <Text style={styles.nodeType}>
          {sanctuary.locked ? 'Bloqueado' : `Santuario de ${sanctuary.type}`}
        </Text>
        {sanctuary.guardian && (
          <Text style={styles.guardianText}>
            Guardián: {sanctuary.guardian.name}
          </Text>
        )}
      </View>
      {!sanctuary.locked && sanctuary.canTrain && (
        <View style={styles.actionBadge}>
          <Text style={styles.actionText}>Entrenar</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderCorruptionZone = (zone) => (
    <TouchableOpacity
      key={zone.id}
      style={[styles.nodeCard, styles.corruptionCard]}
      onPress={() => onCorruptionZonePress?.(zone)}
    >
      <Text style={styles.nodeIcon}>
        {corruptionIcons[zone.type] || '☠️'}
      </Text>
      <View style={styles.nodeInfo}>
        <Text style={[styles.nodeName, styles.corruptionName]}>{zone.name}</Text>
        <Text style={styles.corruptionType}>
          Zona de {zone.type}
        </Text>
        <View style={styles.dangerLevel}>
          <Text style={styles.dangerText}>
            Peligro: {'⚠️'.repeat(zone.dangerLevel || 1)}
          </Text>
        </View>
      </View>
      <View style={[styles.actionBadge, styles.dangerBadge]}>
        <Text style={styles.dangerActionText}>Entrar</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Sanctuaries Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>⛩️ Santuarios</Text>
          <Text style={styles.sectionCount}>
            {sanctuaries.filter(s => !s.locked).length}/{sanctuaries.length}
          </Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.nodesRow}
        >
          {sanctuaries.map(renderSanctuary)}
          {sanctuaries.length === 0 && (
            <Text style={styles.emptyText}>No hay santuarios disponibles</Text>
          )}
        </ScrollView>
      </View>

      {/* Corruption Zones Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>☠️ Zonas de Corrupción</Text>
          <Text style={styles.sectionCountDanger}>
            {corruptionZones.length} activas
          </Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.nodesRow}
        >
          {corruptionZones.map(renderCorruptionZone)}
          {corruptionZones.length === 0 && (
            <Text style={styles.emptyText}>No hay zonas de corrupción</Text>
          )}
        </ScrollView>
      </View>

      {/* Warning if being is selected */}
      {selectedBeing && (
        <View style={styles.warningBanner}>
          <Text style={styles.warningIcon}>⚠️</Text>
          <Text style={styles.warningText}>
            {selectedBeing.name} está seleccionado. Las zonas de corrupción pueden corromperlo.
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(30, 41, 59, 0.95)',
    borderRadius: 16,
    padding: 12,
    margin: 8
  },
  section: {
    marginBottom: 16
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F8FAFC'
  },
  sectionCount: {
    fontSize: 14,
    color: '#10B981'
  },
  sectionCountDanger: {
    fontSize: 14,
    color: '#EF4444'
  },
  nodesRow: {
    paddingRight: 12
  },
  nodeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(51, 65, 85, 0.6)',
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    minWidth: 200,
    borderWidth: 1
  },
  sanctuaryCard: {
    borderColor: 'rgba(16, 185, 129, 0.3)'
  },
  corruptionCard: {
    borderColor: 'rgba(239, 68, 68, 0.3)',
    backgroundColor: 'rgba(127, 29, 29, 0.3)'
  },
  lockedCard: {
    opacity: 0.5,
    borderColor: 'rgba(107, 114, 128, 0.3)'
  },
  nodeIcon: {
    fontSize: 32,
    marginRight: 12
  },
  nodeInfo: {
    flex: 1
  },
  nodeName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#F8FAFC',
    marginBottom: 2
  },
  corruptionName: {
    color: '#FCA5A5'
  },
  nodeType: {
    fontSize: 12,
    color: '#94A3B8'
  },
  corruptionType: {
    fontSize: 12,
    color: '#F87171'
  },
  guardianText: {
    fontSize: 11,
    color: '#FCD34D',
    marginTop: 4
  },
  dangerLevel: {
    marginTop: 4
  },
  dangerText: {
    fontSize: 11,
    color: '#F87171'
  },
  actionBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8
  },
  dangerBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)'
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981'
  },
  dangerActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F87171'
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
    fontStyle: 'italic'
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderRadius: 8,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B'
  },
  warningIcon: {
    fontSize: 16,
    marginRight: 8
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: '#FCD34D'
  }
});

export default PowerNodesPanel;
