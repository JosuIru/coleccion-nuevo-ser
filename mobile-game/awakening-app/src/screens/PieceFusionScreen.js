/**
 * PIECE FUSION SCREEN
 * Sistema de fusión de piezas para crear fragmentos más poderosos
 *
 * Mecánicas:
 * - Combinar 3 piezas del mismo atributo = 1 pieza mejorada
 * - Rareza de salida depende de la rareza de entrada
 * - Bonus por combinar diferentes rarezas
 *
 * @version 1.0.0
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import useGameStore from '../stores/gameStore';
import { COLORS } from '../config/constants';

// Configuración de fusión
const FUSION_CONFIG = {
  requiredPieces: 3, // Piezas necesarias para fusionar
  rarityUpgradeChance: {
    'common': 0.3,    // 30% de subir a rare
    'rare': 0.25,     // 25% de subir a epic
    'epic': 0.15      // 15% de subir a legendary
  },
  powerMultiplier: {
    'common': 1.5,
    'rare': 1.75,
    'epic': 2.0
  }
};

// Mapa de colores por rareza
const RARITY_COLORS = {
  common: '#9ca3af',    // Gris
  rare: '#3b82f6',      // Azul
  epic: '#a855f7',      // Púrpura
  legendary: '#f59e0b'  // Dorado
};

const RARITY_NAMES = {
  common: 'Común',
  rare: 'Raro',
  epic: 'Épico',
  legendary: 'Legendario'
};

const AVATAR_MAP = {
  consciousness: '🌟', wisdom: '🦉', empathy: '💜', creativity: '🎨',
  leadership: '👑', action: '⚡', resilience: '💪', analysis: '🔬',
  reflection: '🧠', communication: '🗣️', connection: '🌍', strategy: '♟️',
  organization: '📋', collaboration: '🤝', technical: '⚙️'
};

const ATTRIBUTE_NAMES = {
  reflection: 'Reflexión', analysis: 'Análisis', creativity: 'Creatividad',
  empathy: 'Empatía', communication: 'Comunicación', leadership: 'Liderazgo',
  action: 'Acción', resilience: 'Resiliencia', strategy: 'Estrategia',
  consciousness: 'Consciencia', connection: 'Conexión', wisdom: 'Sabiduría',
  organization: 'Organización', collaboration: 'Colaboración', technical: 'Técnico'
};

const PieceFusionScreen = ({ navigation }) => {
  const [selectedPieces, setSelectedPieces] = useState([]);
  const [groupedPieces, setGroupedPieces] = useState({});
  const [selectedAttribute, setSelectedAttribute] = useState(null);
  const [fusionResult, setFusionResult] = useState(null);

  const { pieces, usePieces, addPiece, saveToStorage } = useGameStore();

  // Agrupar piezas por atributo
  useFocusEffect(
    useCallback(() => {
      const grouped = {};
      pieces.forEach(piece => {
        const attr = piece.attribute || 'unknown';
        if (!grouped[attr]) {
          grouped[attr] = [];
        }
        grouped[attr].push(piece);
      });

      // Ordenar por cantidad descendente
      const sortedGrouped = Object.fromEntries(
        Object.entries(grouped).sort((a, b) => b[1].length - a[1].length)
      );

      setGroupedPieces(sortedGrouped);
      setSelectedPieces([]);
      setSelectedAttribute(null);
    }, [pieces])
  );

  const handleSelectAttribute = (attribute) => {
    setSelectedAttribute(attribute);
    setSelectedPieces([]);
  };

  const handleSelectPiece = (piece) => {
    if (selectedPieces.find(p => p.id === piece.id)) {
      // Deseleccionar
      setSelectedPieces(prev => prev.filter(p => p.id !== piece.id));
    } else if (selectedPieces.length < FUSION_CONFIG.requiredPieces) {
      // Seleccionar
      setSelectedPieces(prev => [...prev, piece]);
    }
  };

  const canFuse = selectedPieces.length === FUSION_CONFIG.requiredPieces;

  const handleFusion = () => {
    if (!canFuse) return;

    Alert.alert(
      'Confirmar Fusión',
      `¿Fusionar ${FUSION_CONFIG.requiredPieces} fragmentos de ${ATTRIBUTE_NAMES[selectedAttribute] || selectedAttribute}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Fusionar', onPress: executeFusion }
      ]
    );
  };

  const executeFusion = () => {
    // Calcular poder total de las piezas seleccionadas
    const totalPower = selectedPieces.reduce((sum, p) => sum + (p.power || 10), 0);

    // Determinar rareza de entrada más alta
    const rarityOrder = ['common', 'rare', 'epic', 'legendary'];
    const highestRarity = selectedPieces.reduce((highest, p) => {
      const pieceRarityIndex = rarityOrder.indexOf(p.rarity || 'common');
      const currentHighestIndex = rarityOrder.indexOf(highest);
      return pieceRarityIndex > currentHighestIndex ? (p.rarity || 'common') : highest;
    }, 'common');

    // Calcular rareza de salida
    let outputRarity = highestRarity;
    const upgradeChance = FUSION_CONFIG.rarityUpgradeChance[highestRarity] || 0;

    if (Math.random() < upgradeChance && highestRarity !== 'legendary') {
      const currentIndex = rarityOrder.indexOf(highestRarity);
      outputRarity = rarityOrder[currentIndex + 1];
    }

    // Calcular poder de salida
    const powerMultiplier = FUSION_CONFIG.powerMultiplier[highestRarity] || 1.5;
    const outputPower = Math.floor((totalPower / FUSION_CONFIG.requiredPieces) * powerMultiplier);

    // Crear nueva pieza
    const newPiece = {
      type: 'attribute_fragment',
      attribute: selectedAttribute,
      power: outputPower,
      rarity: outputRarity,
      icon: AVATAR_MAP[selectedAttribute] || '✨',
      name: `Fragmento ${outputRarity === 'legendary' ? 'Legendario' : outputRarity === 'epic' ? 'Épico' : outputRarity === 'rare' ? 'Raro' : ''} de ${ATTRIBUTE_NAMES[selectedAttribute] || selectedAttribute}`,
      source: 'fusion',
      fusedFrom: selectedPieces.map(p => p.id)
    };

    // Eliminar piezas usadas y agregar nueva
    const pieceIds = selectedPieces.map(p => p.id);
    usePieces(pieceIds);
    addPiece(newPiece);
    saveToStorage();

    // Mostrar resultado
    setFusionResult({
      piece: newPiece,
      upgraded: outputRarity !== highestRarity
    });

    // Reset selección
    setSelectedPieces([]);
  };

  const closeFusionResult = () => {
    setFusionResult(null);
  };

  const renderAttributeGroup = (attribute, piecesInGroup) => {
    const isSelected = selectedAttribute === attribute;
    const count = piecesInGroup.length;
    const canFuseThis = count >= FUSION_CONFIG.requiredPieces;

    return (
      <TouchableOpacity
        key={attribute}
        style={[
          styles.attributeCard,
          isSelected && styles.attributeCardSelected,
          !canFuseThis && styles.attributeCardDisabled
        ]}
        onPress={() => canFuseThis && handleSelectAttribute(attribute)}
      >
        <Text style={styles.attributeIcon}>{AVATAR_MAP[attribute] || '✨'}</Text>
        <Text style={styles.attributeName}>{ATTRIBUTE_NAMES[attribute] || attribute}</Text>
        <View style={styles.countBadge}>
          <Text style={[
            styles.countText,
            canFuseThis && styles.countTextReady
          ]}>
            {count}
          </Text>
        </View>
        {canFuseThis && (
          <Text style={styles.readyText}>Listo</Text>
        )}
      </TouchableOpacity>
    );
  };

  const renderPieceForSelection = (piece) => {
    const isSelected = selectedPieces.find(p => p.id === piece.id);

    return (
      <TouchableOpacity
        key={piece.id}
        style={[
          styles.pieceCard,
          isSelected && styles.pieceCardSelected,
          { borderColor: RARITY_COLORS[piece.rarity || 'common'] }
        ]}
        onPress={() => handleSelectPiece(piece)}
      >
        <Text style={styles.pieceIcon}>{piece.icon || '✨'}</Text>
        <Text style={styles.piecePower}>+{piece.power || 10}</Text>
        <Text style={[
          styles.pieceRarity,
          { color: RARITY_COLORS[piece.rarity || 'common'] }
        ]}>
          {RARITY_NAMES[piece.rarity || 'common']}
        </Text>
        {isSelected && (
          <View style={styles.selectedBadge}>
            <Text style={styles.selectedText}>✓</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Fusión de Fragmentos</Text>
        <Text style={styles.headerSubtitle}>
          Combina 3 fragmentos del mismo tipo
        </Text>
      </View>

      {/* Instrucciones */}
      <View style={styles.instructions}>
        <Text style={styles.instructionText}>
          1. Selecciona un atributo con 3+ fragmentos
        </Text>
        <Text style={styles.instructionText}>
          2. Elige 3 fragmentos para fusionar
        </Text>
        <Text style={styles.instructionText}>
          3. Obtén un fragmento más poderoso
        </Text>
      </View>

      {!selectedAttribute ? (
        // Vista de grupos de atributos
        <ScrollView style={styles.attributeList}>
          <Text style={styles.sectionTitle}>Selecciona un Atributo</Text>
          <View style={styles.attributeGrid}>
            {Object.entries(groupedPieces).map(([attr, pcs]) =>
              renderAttributeGroup(attr, pcs)
            )}
          </View>

          {Object.keys(groupedPieces).length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🧩</Text>
              <Text style={styles.emptyTitle}>Sin Fragmentos</Text>
              <Text style={styles.emptyText}>
                Completa misiones para obtener fragmentos
              </Text>
            </View>
          )}
        </ScrollView>
      ) : (
        // Vista de selección de piezas
        <View style={styles.selectionView}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setSelectedAttribute(null)}
          >
            <Text style={styles.backButtonText}>← Volver</Text>
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>
            {AVATAR_MAP[selectedAttribute]} {ATTRIBUTE_NAMES[selectedAttribute]}
          </Text>
          <Text style={styles.selectionCount}>
            {selectedPieces.length} / {FUSION_CONFIG.requiredPieces} seleccionados
          </Text>

          <ScrollView style={styles.pieceList}>
            <View style={styles.pieceGrid}>
              {groupedPieces[selectedAttribute]?.map(renderPieceForSelection)}
            </View>
          </ScrollView>

          {/* Botón de fusión */}
          <TouchableOpacity
            style={[
              styles.fusionButton,
              !canFuse && styles.fusionButtonDisabled
            ]}
            onPress={handleFusion}
            disabled={!canFuse}
          >
            <Text style={styles.fusionButtonText}>
              {canFuse ? '🔮 Fusionar' : `Selecciona ${FUSION_CONFIG.requiredPieces - selectedPieces.length} más`}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Modal de resultado */}
      {fusionResult && (
        <View style={styles.resultOverlay}>
          <View style={styles.resultModal}>
            <Text style={styles.resultTitle}>
              {fusionResult.upgraded ? '✨ ¡Mejora de Rareza!' : '🔮 Fusión Exitosa'}
            </Text>
            <View style={[
              styles.resultPiece,
              { borderColor: RARITY_COLORS[fusionResult.piece.rarity] }
            ]}>
              <Text style={styles.resultIcon}>{fusionResult.piece.icon}</Text>
              <Text style={styles.resultName}>{fusionResult.piece.name}</Text>
              <Text style={styles.resultPower}>+{fusionResult.piece.power}</Text>
              <Text style={[
                styles.resultRarity,
                { color: RARITY_COLORS[fusionResult.piece.rarity] }
              ]}>
                {RARITY_NAMES[fusionResult.piece.rarity]}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.resultButton}
              onPress={closeFusionResult}
            >
              <Text style={styles.resultButtonText}>Continuar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg.primary
  },

  // Header
  header: {
    padding: 20,
    paddingTop: 50,
    backgroundColor: COLORS.bg.elevated,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.bg.card
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text.primary
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginTop: 4
  },

  // Instrucciones
  instructions: {
    padding: 16,
    backgroundColor: COLORS.bg.card,
    gap: 4
  },
  instructionText: {
    fontSize: 13,
    color: COLORS.text.secondary
  },

  // Sección
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 12,
    paddingHorizontal: 16
  },

  // Lista de atributos
  attributeList: {
    flex: 1,
    padding: 16
  },
  attributeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  attributeCard: {
    width: '48%',
    backgroundColor: COLORS.bg.elevated,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.bg.card
  },
  attributeCardSelected: {
    borderColor: COLORS.accent.primary,
    borderWidth: 2
  },
  attributeCardDisabled: {
    opacity: 0.5
  },
  attributeIcon: {
    fontSize: 36,
    marginBottom: 8
  },
  attributeName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4
  },
  countBadge: {
    backgroundColor: COLORS.bg.card,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12
  },
  countText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text.secondary
  },
  countTextReady: {
    color: COLORS.accent.success
  },
  readyText: {
    fontSize: 12,
    color: COLORS.accent.success,
    fontWeight: '600',
    marginTop: 4
  },

  // Vista de selección
  selectionView: {
    flex: 1
  },
  backButton: {
    padding: 16
  },
  backButtonText: {
    fontSize: 16,
    color: COLORS.accent.primary
  },
  selectionCount: {
    fontSize: 14,
    color: COLORS.text.secondary,
    paddingHorizontal: 16,
    marginBottom: 12
  },
  pieceList: {
    flex: 1,
    paddingHorizontal: 16
  },
  pieceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  pieceCard: {
    width: '31%',
    backgroundColor: COLORS.bg.elevated,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    alignItems: 'center',
    borderWidth: 2
  },
  pieceCardSelected: {
    backgroundColor: COLORS.accent.primary + '30'
  },
  pieceIcon: {
    fontSize: 28,
    marginBottom: 4
  },
  piecePower: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text.primary
  },
  pieceRarity: {
    fontSize: 10,
    fontWeight: '600'
  },
  selectedBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: COLORS.accent.success,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  selectedText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold'
  },

  // Botón de fusión
  fusionButton: {
    margin: 16,
    backgroundColor: COLORS.accent.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center'
  },
  fusionButtonDisabled: {
    backgroundColor: COLORS.bg.card
  },
  fusionButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff'
  },

  // Estado vacío
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: 8
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.text.secondary
  },

  // Modal de resultado
  resultOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  resultModal: {
    backgroundColor: COLORS.bg.elevated,
    borderRadius: 20,
    padding: 24,
    width: '80%',
    alignItems: 'center'
  },
  resultTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: 20
  },
  resultPiece: {
    backgroundColor: COLORS.bg.card,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 3,
    marginBottom: 20
  },
  resultIcon: {
    fontSize: 56,
    marginBottom: 12
  },
  resultName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    textAlign: 'center',
    marginBottom: 8
  },
  resultPower: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.accent.primary,
    marginBottom: 4
  },
  resultRarity: {
    fontSize: 14,
    fontWeight: '600'
  },
  resultButton: {
    backgroundColor: COLORS.accent.primary,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8
  },
  resultButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff'
  }
});

export default PieceFusionScreen;
