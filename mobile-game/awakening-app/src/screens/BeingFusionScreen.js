/**
 * BEING FUSION SCREEN
 * Sistema de fusión de seres para crear seres más poderosos
 *
 * Mecánicas:
 * - Seleccionar 2 seres disponibles
 * - Fusionar para crear un nuevo ser con atributos combinados
 * - Los seres originales se pierden
 * - Posibilidad de mejorar la rareza
 *
 * @version 1.0.0
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
  Dimensions
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import useGameStore from '../stores/gameStore';
import { COLORS } from '../config/constants';

const { width } = Dimensions.get('window');

// Configuración de rareza
const RARITY_CONFIG = {
  common: { color: '#9ca3af', name: 'Común', glow: 'transparent' },
  rare: { color: '#3b82f6', name: 'Raro', glow: '#3b82f620' },
  epic: { color: '#a855f7', name: 'Épico', glow: '#a855f720' },
  legendary: { color: '#f59e0b', name: 'Legendario', glow: '#f59e0b30' }
};

const ATTRIBUTE_NAMES = {
  reflection: 'Reflexión', empathy: 'Empatía', action: 'Acción',
  knowledge: 'Conocimiento', energy: 'Energía', connection: 'Conexión',
  creativity: 'Creatividad', leadership: 'Liderazgo', resilience: 'Resiliencia',
  wisdom: 'Sabiduría', strategy: 'Estrategia', communication: 'Comunicación'
};

const BeingFusionScreen = ({ navigation }) => {
  const [selectedBeings, setSelectedBeings] = useState([]);
  const [fusionResult, setFusionResult] = useState(null);
  const [fusionAnimation] = useState(new Animated.Value(0));

  const { beings, fuseBeings, saveToStorage } = useGameStore();

  // Seres disponibles para fusión (no desplegados)
  const availableBeings = beings.filter(b => b.status === 'available');

  // Reset al entrar
  useFocusEffect(
    useCallback(() => {
      setSelectedBeings([]);
      setFusionResult(null);
    }, [])
  );

  const handleSelectBeing = (being) => {
    if (selectedBeings.find(b => b.id === being.id)) {
      // Deseleccionar
      setSelectedBeings(prev => prev.filter(b => b.id !== being.id));
    } else if (selectedBeings.length < 2) {
      // Seleccionar
      setSelectedBeings(prev => [...prev, being]);
    }
  };

  const canFuse = selectedBeings.length === 2;

  // Calcular preview del resultado
  const getPreviewStats = () => {
    if (selectedBeings.length !== 2) return null;

    const [being1, being2] = selectedBeings;
    const previewAttributes = {};
    const allAttrs = new Set([
      ...Object.keys(being1.attributes || {}),
      ...Object.keys(being2.attributes || {})
    ]);

    allAttrs.forEach(attr => {
      const val1 = being1.attributes?.[attr] || 0;
      const val2 = being2.attributes?.[attr] || 0;
      previewAttributes[attr] = Math.floor((val1 + val2) / 2 * 1.2);
    });

    return previewAttributes;
  };

  const handleFusion = () => {
    if (!canFuse) return;

    Alert.alert(
      'Confirmar Fusión',
      `¿Fusionar ${selectedBeings[0].name} y ${selectedBeings[1].name}?\n\nAmbos seres se perderán y crearás uno nuevo más poderoso.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Fusionar', style: 'destructive', onPress: executeFusion }
      ]
    );
  };

  const executeFusion = () => {
    // Animación de fusión
    Animated.sequence([
      Animated.timing(fusionAnimation, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true
      }),
      Animated.timing(fusionAnimation, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true
      })
    ]).start();

    // Ejecutar fusión
    const result = fuseBeings(selectedBeings[0].id, selectedBeings[1].id);

    if (result) {
      saveToStorage();
      setFusionResult(result);
      setSelectedBeings([]);
    } else {
      Alert.alert('Error', 'No se pudo completar la fusión');
    }
  };

  const closeFusionResult = () => {
    setFusionResult(null);
  };

  const renderBeingCard = (being, isSelected) => {
    const rarity = RARITY_CONFIG[being.rarity || 'common'];

    return (
      <TouchableOpacity
        key={being.id}
        style={[
          styles.beingCard,
          { borderColor: rarity.color },
          isSelected && styles.beingCardSelected
        ]}
        onPress={() => handleSelectBeing(being)}
      >
        <View style={[styles.beingGlow, { backgroundColor: rarity.glow }]} />

        <Text style={styles.beingAvatar}>{being.avatar || '🧬'}</Text>
        <Text style={styles.beingName} numberOfLines={1}>{being.name}</Text>
        <Text style={[styles.beingRarity, { color: rarity.color }]}>
          {rarity.name}
        </Text>
        <Text style={styles.beingLevel}>Nv. {being.level || 1}</Text>

        {/* Mini atributos */}
        <View style={styles.miniAttributes}>
          {Object.entries(being.attributes || {}).slice(0, 3).map(([attr, value]) => (
            <Text key={`${being.id}_mini_${attr}`} style={styles.miniAttr}>
              {value}
            </Text>
          ))}
        </View>

        {isSelected && (
          <View style={styles.selectedBadge}>
            <Text style={styles.selectedNumber}>
              {selectedBeings.findIndex(b => b.id === being.id) + 1}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderPreview = () => {
    if (!canFuse) return null;

    const previewStats = getPreviewStats();
    const [being1, being2] = selectedBeings;

    return (
      <View style={styles.previewContainer}>
        <Text style={styles.previewTitle}>Vista Previa de Fusión</Text>

        <View style={styles.fusionVisual}>
          <View style={styles.fusionBeing}>
            <Text style={styles.fusionAvatar}>{being1.avatar || '🧬'}</Text>
            <Text style={styles.fusionName} numberOfLines={1}>{being1.name}</Text>
          </View>

          <View style={styles.fusionPlus}>
            <Text style={styles.plusText}>+</Text>
          </View>

          <View style={styles.fusionBeing}>
            <Text style={styles.fusionAvatar}>{being2.avatar || '🧬'}</Text>
            <Text style={styles.fusionName} numberOfLines={1}>{being2.name}</Text>
          </View>

          <View style={styles.fusionEquals}>
            <Text style={styles.equalsText}>=</Text>
          </View>

          <View style={[styles.fusionBeing, styles.fusionResult]}>
            <Text style={styles.fusionResultAvatar}>✨</Text>
            <Text style={styles.fusionResultName}>Nuevo Ser</Text>
          </View>
        </View>

        {/* Atributos resultantes */}
        <View style={styles.previewAttributes}>
          <Text style={styles.previewSubtitle}>Atributos Estimados (+20% bonus)</Text>
          {Object.entries(previewStats || {}).map(([attr, value]) => (
            <View key={`preview_${attr}`} style={styles.previewAttrRow}>
              <Text style={styles.previewAttrName}>
                {ATTRIBUTE_NAMES[attr] || attr}
              </Text>
              <Text style={styles.previewAttrValue}>{value}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.previewWarning}>
          25% de probabilidad de mejorar rareza
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Fusión de Seres</Text>
          <Text style={styles.headerSubtitle}>
            Combina 2 seres para crear uno más poderoso
          </Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Contenido */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Instrucciones */}
        <View style={styles.instructions}>
          <Text style={styles.instructionItem}>1. Selecciona 2 seres disponibles</Text>
          <Text style={styles.instructionItem}>2. Revisa la vista previa</Text>
          <Text style={styles.instructionItem}>3. Confirma la fusión</Text>
          <Text style={styles.instructionWarning}>
            Los seres originales se perderán
          </Text>
        </View>

        {/* Vista previa */}
        {renderPreview()}

        {/* Lista de seres disponibles */}
        <Text style={styles.sectionTitle}>
          Seres Disponibles ({availableBeings.length})
        </Text>

        {availableBeings.length < 2 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🧬</Text>
            <Text style={styles.emptyTitle}>Seres Insuficientes</Text>
            <Text style={styles.emptyText}>
              Necesitas al menos 2 seres disponibles para fusionar.
              Crea más seres en el Laboratorio.
            </Text>
            <TouchableOpacity
              style={styles.labButton}
              onPress={() => {
                // Navegar al tab Lab y luego volver a la lista de seres
                navigation.getParent()?.navigate('Lab');
              }}
            >
              <Text style={styles.labButtonText}>Ir al Laboratorio</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.beingsGrid}>
            {availableBeings.map(being =>
              renderBeingCard(being, selectedBeings.find(b => b.id === being.id))
            )}
          </View>
        )}
      </ScrollView>

      {/* Botón de fusión */}
      {availableBeings.length >= 2 && (
        <View style={styles.fusionButtonContainer}>
          <TouchableOpacity
            style={[
              styles.fusionButton,
              !canFuse && styles.fusionButtonDisabled
            ]}
            onPress={handleFusion}
            disabled={!canFuse}
          >
            <Animated.Text
              style={[
                styles.fusionButtonText,
                {
                  transform: [{
                    scale: fusionAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.2]
                    })
                  }]
                }
              ]}
            >
              {canFuse ? '🔮 Fusionar Seres' : `Selecciona ${2 - selectedBeings.length} más`}
            </Animated.Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Modal de resultado */}
      {fusionResult && (
        <View style={styles.resultOverlay}>
          <View style={styles.resultModal}>
            <Text style={styles.resultTitle}>¡Fusión Exitosa!</Text>

            <View style={[
              styles.resultBeingCard,
              { borderColor: RARITY_CONFIG[fusionResult.rarity || 'common'].color }
            ]}>
              <Text style={styles.resultAvatar}>{fusionResult.avatar}</Text>
              <Text style={styles.resultName}>{fusionResult.name}</Text>
              <Text style={[
                styles.resultRarity,
                { color: RARITY_CONFIG[fusionResult.rarity || 'common'].color }
              ]}>
                {RARITY_CONFIG[fusionResult.rarity || 'common'].name}
              </Text>
              <Text style={styles.resultLevel}>Nivel {fusionResult.level}</Text>

              {/* Atributos */}
              <View style={styles.resultAttributes}>
                {Object.entries(fusionResult.attributes || {}).map(([attr, value]) => (
                  <View key={`result_${attr}`} style={styles.resultAttrRow}>
                    <Text style={styles.resultAttrName}>
                      {ATTRIBUTE_NAMES[attr] || attr}
                    </Text>
                    <Text style={styles.resultAttrValue}>{value}</Text>
                  </View>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={styles.resultCloseButton}
              onPress={closeFusionResult}
            >
              <Text style={styles.resultCloseText}>Continuar</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: COLORS.bg.secondary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.accent.primary + '20'
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.bg.elevated,
    justifyContent: 'center',
    alignItems: 'center'
  },
  backIcon: {
    fontSize: 24,
    color: COLORS.text.primary
  },
  headerCenter: {
    flex: 1,
    marginLeft: 12
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text.primary
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.text.secondary
  },
  headerRight: {
    width: 40
  },

  // Scroll
  scrollView: {
    flex: 1
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100
  },

  // Instrucciones
  instructions: {
    backgroundColor: COLORS.bg.elevated,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16
  },
  instructionItem: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: 4
  },
  instructionWarning: {
    fontSize: 12,
    color: COLORS.accent.warning,
    marginTop: 8,
    fontWeight: '600'
  },

  // Preview
  previewContainer: {
    backgroundColor: COLORS.bg.elevated,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.accent.primary + '40'
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 16,
    textAlign: 'center'
  },
  fusionVisual: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16
  },
  fusionBeing: {
    alignItems: 'center',
    width: 60
  },
  fusionAvatar: {
    fontSize: 32
  },
  fusionName: {
    fontSize: 10,
    color: COLORS.text.secondary,
    marginTop: 4
  },
  fusionPlus: {
    marginHorizontal: 8
  },
  plusText: {
    fontSize: 24,
    color: COLORS.text.dim
  },
  fusionEquals: {
    marginHorizontal: 8
  },
  equalsText: {
    fontSize: 24,
    color: COLORS.accent.primary
  },
  fusionResult: {
    backgroundColor: COLORS.accent.primary + '20',
    borderRadius: 8,
    padding: 8
  },
  fusionResultAvatar: {
    fontSize: 32
  },
  fusionResultName: {
    fontSize: 10,
    color: COLORS.accent.primary,
    fontWeight: '600'
  },
  previewAttributes: {
    marginTop: 8
  },
  previewSubtitle: {
    fontSize: 12,
    color: COLORS.text.dim,
    marginBottom: 8,
    textAlign: 'center'
  },
  previewAttrRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.bg.primary
  },
  previewAttrName: {
    fontSize: 13,
    color: COLORS.text.secondary
  },
  previewAttrValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.accent.success
  },
  previewWarning: {
    fontSize: 11,
    color: COLORS.accent.warning,
    textAlign: 'center',
    marginTop: 12
  },

  // Section
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 12
  },

  // Beings grid
  beingsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  beingCard: {
    width: (width - 48) / 2,
    backgroundColor: COLORS.bg.elevated,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 2,
    overflow: 'hidden'
  },
  beingCardSelected: {
    backgroundColor: COLORS.accent.primary + '15'
  },
  beingGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  },
  beingAvatar: {
    fontSize: 40,
    marginBottom: 8
  },
  beingName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4
  },
  beingRarity: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4
  },
  beingLevel: {
    fontSize: 12,
    color: COLORS.text.secondary
  },
  miniAttributes: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8
  },
  miniAttr: {
    fontSize: 11,
    color: COLORS.text.dim,
    backgroundColor: COLORS.bg.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  selectedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.accent.primary,
    justifyContent: 'center',
    alignItems: 'center'
  },
  selectedNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff'
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 8
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: 16
  },
  labButton: {
    backgroundColor: COLORS.accent.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8
  },
  labButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff'
  },

  // Fusion button
  fusionButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: COLORS.bg.primary
  },
  fusionButton: {
    backgroundColor: COLORS.accent.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center'
  },
  fusionButtonDisabled: {
    backgroundColor: COLORS.bg.elevated
  },
  fusionButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff'
  },

  // Result modal
  resultOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  resultModal: {
    backgroundColor: COLORS.bg.elevated,
    borderRadius: 20,
    padding: 24,
    width: '85%',
    alignItems: 'center'
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.accent.primary,
    marginBottom: 20
  },
  resultBeingCard: {
    backgroundColor: COLORS.bg.card,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 3,
    width: '100%',
    marginBottom: 20
  },
  resultAvatar: {
    fontSize: 56,
    marginBottom: 12
  },
  resultName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 4
  },
  resultRarity: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4
  },
  resultLevel: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: 12
  },
  resultAttributes: {
    width: '100%'
  },
  resultAttrRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.bg.primary
  },
  resultAttrName: {
    fontSize: 13,
    color: COLORS.text.secondary
  },
  resultAttrValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.accent.success
  },
  resultCloseButton: {
    backgroundColor: COLORS.accent.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8
  },
  resultCloseText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff'
  }
});

export default BeingFusionScreen;
