/**
 * CONSCIOUSNESS SHOP SCREEN
 * Tienda donde se gastan puntos de Consciencia
 *
 * Categorías:
 * - Energía: Boosters y recarga
 * - Piezas: Fragmentos para el laboratorio
 * - Seres: Seres únicos de la tienda
 * - Mejoras: Upgrades permanentes
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
  Animated
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import useGameStore from '../stores/gameStore';
import { COLORS } from '../config/constants';

// Catálogo de la tienda
const SHOP_CATALOG = {
  energy: [
    {
      id: 'energy_small',
      name: 'Recarga Menor',
      description: '+20 Energía',
      icon: '⚡',
      price: 25,
      effect: { type: 'energy', amount: 20 }
    },
    {
      id: 'energy_medium',
      name: 'Recarga Media',
      description: '+50 Energía',
      icon: '🔋',
      price: 50,
      effect: { type: 'energy', amount: 50 },
      popular: true
    },
    {
      id: 'energy_full',
      name: 'Recarga Completa',
      description: 'Energía al máximo',
      icon: '💎',
      price: 100,
      effect: { type: 'energy_full' }
    }
  ],
  pieces: [
    {
      id: 'piece_random',
      name: 'Fragmento Aleatorio',
      description: 'Un fragmento de atributo random',
      icon: '🧩',
      price: 30,
      effect: { type: 'piece_random' }
    },
    {
      id: 'piece_pack',
      name: 'Pack de Fragmentos',
      description: '3 fragmentos aleatorios',
      icon: '📦',
      price: 75,
      effect: { type: 'piece_pack', count: 3 },
      popular: true
    },
    {
      id: 'piece_rare',
      name: 'Fragmento Raro',
      description: 'Fragmento con rareza garantizada',
      icon: '💜',
      price: 150,
      effect: { type: 'piece_rare' }
    }
  ],
  beings: [
    {
      id: 'being_starter',
      name: 'Ser del Mercado',
      description: 'Un ser equilibrado listo para misiones',
      icon: '🌱',
      price: 200,
      effect: { type: 'being_basic' }
    },
    {
      id: 'being_specialized',
      name: 'Ser Especializado',
      description: 'Ser con atributos concentrados',
      icon: '🎯',
      price: 400,
      effect: { type: 'being_specialized' },
      popular: true
    },
    {
      id: 'being_legendary',
      name: 'Ser Legendario',
      description: 'Ser poderoso de atributos altos',
      icon: '👑',
      price: 1000,
      effect: { type: 'being_legendary' },
      limited: true
    }
  ],
  upgrades: [
    {
      id: 'upgrade_energy_cap',
      name: 'Tanque de Energía',
      description: '+10 Energía máxima (permanente)',
      icon: '🔺',
      price: 300,
      effect: { type: 'upgrade_max_energy', amount: 10 },
      oneTime: true
    },
    {
      id: 'upgrade_being_slot',
      name: 'Slot de Ser',
      description: '+1 ser máximo en colección',
      icon: '➕',
      price: 500,
      effect: { type: 'upgrade_max_beings', amount: 1 },
      oneTime: true
    },
    {
      id: 'upgrade_xp_boost',
      name: 'Boost de XP',
      description: '+25% XP por 24 horas',
      icon: '🚀',
      price: 150,
      effect: { type: 'xp_boost', duration: 24 }
    }
  ]
};

// Nombres de atributos para piezas aleatorias
const ATTRIBUTES = [
  'reflection', 'analysis', 'creativity', 'empathy', 'communication',
  'leadership', 'action', 'resilience', 'strategy', 'consciousness',
  'connection', 'wisdom', 'organization', 'collaboration', 'technical'
];

const AVATAR_MAP = {
  consciousness: '🌟', wisdom: '🦉', empathy: '💜', creativity: '🎨',
  leadership: '👑', action: '⚡', resilience: '💪', analysis: '🔬',
  reflection: '🧠', communication: '🗣️', connection: '🌍', strategy: '♟️',
  organization: '📋', collaboration: '🤝', technical: '⚙️'
};

const ConsciousnessShopScreen = ({ navigation }) => {
  const [selectedCategory, setSelectedCategory] = useState('energy');
  const [purchasedItems, setPurchasedItems] = useState({});

  const {
    user,
    addEnergy,
    addPiece,
    addPieces,
    addBeing,
    addConsciousness,
    saveToStorage
  } = useGameStore();

  // Recargar al enfocar
  useFocusEffect(
    useCallback(() => {
      // Cargar items comprados one-time desde storage si es necesario
    }, [])
  );

  const handlePurchase = (item) => {
    // Verificar fondos
    if (user.consciousnessPoints < item.price) {
      Alert.alert(
        'Consciencia Insuficiente',
        `Necesitas ${item.price} puntos de consciencia. Tienes ${user.consciousnessPoints}.`,
        [{ text: 'OK' }]
      );
      return;
    }

    // Verificar si es one-time y ya fue comprado
    if (item.oneTime && purchasedItems[item.id]) {
      Alert.alert('Ya Comprado', 'Este item solo se puede comprar una vez.');
      return;
    }

    Alert.alert(
      'Confirmar Compra',
      `¿Comprar "${item.name}" por ${item.price} 🌟?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Comprar',
          onPress: () => executePurchase(item)
        }
      ]
    );
  };

  const executePurchase = (item) => {
    // Descontar consciencia
    useGameStore.getState().addConsciousness(-item.price);

    // Aplicar efecto
    applyEffect(item.effect, item);

    // Marcar como comprado si es one-time
    if (item.oneTime) {
      setPurchasedItems(prev => ({ ...prev, [item.id]: true }));
    }

    // Guardar estado
    saveToStorage();

    Alert.alert(
      '¡Compra Exitosa!',
      `Has adquirido "${item.name}"`,
      [{ text: '¡Genial!' }]
    );
  };

  const applyEffect = (effect, item) => {
    const state = useGameStore.getState();

    switch (effect.type) {
      case 'energy':
        state.addEnergy(effect.amount);
        break;

      case 'energy_full':
        state.addEnergy(state.user.maxEnergy);
        break;

      case 'piece_random':
        const randomAttr = ATTRIBUTES[Math.floor(Math.random() * ATTRIBUTES.length)];
        state.addPiece({
          type: 'attribute_fragment',
          attribute: randomAttr,
          power: 10 + Math.floor(Math.random() * 20),
          rarity: 'common',
          icon: AVATAR_MAP[randomAttr] || '✨',
          name: `Fragmento de ${randomAttr}`,
          source: 'shop'
        });
        break;

      case 'piece_pack':
        const pieces = [];
        for (let i = 0; i < effect.count; i++) {
          const attr = ATTRIBUTES[Math.floor(Math.random() * ATTRIBUTES.length)];
          pieces.push({
            type: 'attribute_fragment',
            attribute: attr,
            power: 10 + Math.floor(Math.random() * 25),
            rarity: Math.random() > 0.7 ? 'rare' : 'common',
            icon: AVATAR_MAP[attr] || '✨',
            name: `Fragmento de ${attr}`,
            source: 'shop'
          });
        }
        state.addPieces(pieces);
        break;

      case 'piece_rare':
        const rareAttr = ATTRIBUTES[Math.floor(Math.random() * ATTRIBUTES.length)];
        state.addPiece({
          type: 'attribute_fragment',
          attribute: rareAttr,
          power: 25 + Math.floor(Math.random() * 25),
          rarity: Math.random() > 0.5 ? 'epic' : 'rare',
          icon: AVATAR_MAP[rareAttr] || '✨',
          name: `Fragmento Raro de ${rareAttr}`,
          source: 'shop'
        });
        break;

      case 'being_basic':
        state.addBeing(generateShopBeing('basic'));
        break;

      case 'being_specialized':
        state.addBeing(generateShopBeing('specialized'));
        break;

      case 'being_legendary':
        state.addBeing(generateShopBeing('legendary'));
        break;

      case 'upgrade_max_energy':
        // Incrementar energía máxima
        useGameStore.setState(s => ({
          user: { ...s.user, maxEnergy: s.user.maxEnergy + effect.amount }
        }));
        break;

      case 'upgrade_max_beings':
        // Incrementar slots de seres
        useGameStore.setState(s => ({
          user: { ...s.user, maxBeings: s.user.maxBeings + effect.amount }
        }));
        break;

      case 'xp_boost':
        // TODO: Implementar sistema de boosts temporales
        Alert.alert('Boost Activado', `+25% XP durante ${effect.duration} horas`);
        break;
    }
  };

  const generateShopBeing = (tier) => {
    const names = {
      basic: ['Aprendiz del Mercado', 'Ser Comerciante', 'Explorador Novato'],
      specialized: ['Maestro Enfocado', 'Especialista', 'Experto Dedicado'],
      legendary: ['Guardián Legendario', 'Maestro Ancestral', 'Ser Supremo']
    };

    const basePower = {
      basic: 20,
      specialized: 35,
      legendary: 60
    };

    const name = names[tier][Math.floor(Math.random() * names[tier].length)];
    const attributes = {};

    // Generar atributos según tier
    ATTRIBUTES.forEach(attr => {
      const base = basePower[tier];
      const variance = tier === 'specialized' ? 20 : 10;
      attributes[attr] = base + Math.floor(Math.random() * variance);
    });

    // Si es especializado, boost a 3 atributos
    if (tier === 'specialized') {
      const boostedAttrs = ATTRIBUTES.sort(() => Math.random() - 0.5).slice(0, 3);
      boostedAttrs.forEach(attr => {
        attributes[attr] += 25;
      });
    }

    // Si es legendario, boost general
    if (tier === 'legendary') {
      ATTRIBUTES.forEach(attr => {
        attributes[attr] += 20;
      });
    }

    const dominant = Object.entries(attributes).sort((a, b) => b[1] - a[1])[0][0];

    return {
      id: `shop_${tier}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name,
      avatar: AVATAR_MAP[dominant] || '🧬',
      status: 'available',
      currentMission: null,
      level: tier === 'legendary' ? 5 : tier === 'specialized' ? 3 : 1,
      experience: 0,
      createdAt: new Date().toISOString(),
      attributes,
      totalPower: Object.values(attributes).reduce((a, b) => a + b, 0),
      sourceApp: 'consciousness-shop',
      tier
    };
  };

  const categories = [
    { id: 'energy', name: 'Energía', icon: '⚡' },
    { id: 'pieces', name: 'Piezas', icon: '🧩' },
    { id: 'beings', name: 'Seres', icon: '🧬' },
    { id: 'upgrades', name: 'Mejoras', icon: '🔺' }
  ];

  const renderItem = (item) => {
    const canAfford = user.consciousnessPoints >= item.price;
    const alreadyPurchased = item.oneTime && purchasedItems[item.id];

    return (
      <TouchableOpacity
        key={item.id}
        style={[
          styles.itemCard,
          !canAfford && styles.itemCardDisabled,
          alreadyPurchased && styles.itemCardPurchased
        ]}
        onPress={() => handlePurchase(item)}
        disabled={alreadyPurchased}
      >
        {item.popular && (
          <View style={styles.popularBadge}>
            <Text style={styles.popularText}>Popular</Text>
          </View>
        )}
        {item.limited && (
          <View style={styles.limitedBadge}>
            <Text style={styles.limitedText}>Limitado</Text>
          </View>
        )}

        <Text style={styles.itemIcon}>{item.icon}</Text>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemDescription}>{item.description}</Text>

        <View style={styles.priceContainer}>
          <Text style={styles.priceIcon}>🌟</Text>
          <Text style={[styles.priceText, !canAfford && styles.priceTextRed]}>
            {item.price}
          </Text>
        </View>

        {alreadyPurchased && (
          <View style={styles.purchasedOverlay}>
            <Text style={styles.purchasedText}>✓ Comprado</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tienda de Consciencia</Text>
        <View style={styles.balanceContainer}>
          <Text style={styles.balanceIcon}>🌟</Text>
          <Text style={styles.balanceText}>{user.consciousnessPoints}</Text>
        </View>
      </View>

      {/* Categorías */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesScroll}
      >
        {categories.map(cat => (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.categoryButton,
              selectedCategory === cat.id && styles.categoryButtonActive
            ]}
            onPress={() => setSelectedCategory(cat.id)}
          >
            <Text style={styles.categoryIcon}>{cat.icon}</Text>
            <Text style={[
              styles.categoryText,
              selectedCategory === cat.id && styles.categoryTextActive
            ]}>
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Items */}
      <ScrollView style={styles.itemsContainer}>
        <View style={styles.itemsGrid}>
          {SHOP_CATALOG[selectedCategory]?.map(renderItem)}
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: COLORS.bg.elevated
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text.primary
  },
  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bg.card,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6
  },
  balanceIcon: {
    fontSize: 20
  },
  balanceText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.accent.primary
  },

  // Categorías
  categoriesScroll: {
    backgroundColor: COLORS.bg.elevated,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.bg.card
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 6,
    borderRadius: 20,
    backgroundColor: COLORS.bg.card,
    gap: 6
  },
  categoryButtonActive: {
    backgroundColor: COLORS.accent.primary
  },
  categoryIcon: {
    fontSize: 18
  },
  categoryText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    fontWeight: '600'
  },
  categoryTextActive: {
    color: '#fff'
  },

  // Items
  itemsContainer: {
    flex: 1,
    padding: 16
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  itemCard: {
    width: '48%',
    backgroundColor: COLORS.bg.elevated,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.bg.card
  },
  itemCardDisabled: {
    opacity: 0.6
  },
  itemCardPurchased: {
    opacity: 0.5
  },
  itemIcon: {
    fontSize: 48,
    marginBottom: 8
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    textAlign: 'center',
    marginBottom: 4
  },
  itemDescription: {
    fontSize: 12,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: 12
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bg.card,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4
  },
  priceIcon: {
    fontSize: 14
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.accent.primary
  },
  priceTextRed: {
    color: '#ef4444'
  },

  // Badges
  popularBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#22c55e',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8
  },
  popularText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff'
  },
  limitedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#ef4444',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8
  },
  limitedText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff'
  },
  purchasedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center'
  },
  purchasedText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#22c55e'
  }
});

export default ConsciousnessShopScreen;
