/**
 * HERRAMIENTAS SCREEN
 * Pantalla de acceso a herramientas del ecosistema
 * Enlaza a: Colección, TRUK, Cosmos, Frankenstein Lab
 *
 * @version 1.0.0
 */

import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS } from '../config/constants';
import logger from '../utils/logger';

const { width } = Dimensions.get('window');

const HERRAMIENTAS = [
  {
    id: 'coleccion',
    name: 'Colección del Nuevo Ser',
    description: 'Biblioteca interactiva con 7 libros sobre conciencia y transformación social',
    icon: 'library',
    color: '#EC4899',
    url: 'https://coleccion-nuevo-ser.vercel.app/',
    tags: ['Lectura', 'Aprendizaje', 'Biblioteca'],
    badge: '📚'
  },
  {
    id: 'frankenstein',
    name: 'Frankenstein Lab',
    description: 'Juego educativo: crea seres conscientes combinando conocimientos de los libros',
    icon: 'lightning-bolt',
    color: '#8B5CF6',
    url: 'https://coleccion-nuevo-ser.vercel.app/test-frankenstein.html',
    tags: ['Juego', 'Educativo', 'Quiz'],
    badge: '⚡'
  },
  {
    id: 'cosmos',
    name: 'Cosmos',
    description: 'Navegación cósmica 3D: explora los libros como sistemas planetarios',
    icon: 'telescope',
    color: '#6366F1',
    url: 'https://coleccion-nuevo-ser.vercel.app/codigo-cosmico.html',
    tags: ['3D', 'Exploración', 'Visualización'],
    badge: '🌌'
  },
  {
    id: 'truk',
    name: 'TRUK',
    description: 'Red social de economía colaborativa local para transformar tu comunidad',
    icon: 'handshake',
    color: '#3B82F6',
    url: 'https://truk-production.up.railway.app/',
    tags: ['Comunidad', 'Colaborativa', 'Economía'],
    badge: '🤝'
  }
];

export default function HerramientasScreen() {
  const [loadingUrl, setLoadingUrl] = useState(null);

  const handleOpenUrl = async (url, herramientaName) => {
    try {
      setLoadingUrl(url);

      logger.info('HerramientasScreen', `Intentando abrir: ${herramientaName}`);

      const supported = await Linking.canOpenURL(url);

      if (supported) {
        await Linking.openURL(url);
        logger.success('HerramientasScreen', `Abierto: ${herramientaName}`);
      } else {
        logger.error('HerramientasScreen', `No se puede abrir URL: ${url}`);
        Alert.alert(
          'Error',
          `No se puede abrir ${herramientaName}. Verifica tu conexión a internet.`
        );
      }
    } catch (error) {
      logger.error('HerramientasScreen', `Error abriendo ${herramientaName}`, error);
      Alert.alert(
        'Error',
        'No se pudo abrir la herramienta. Intenta más tarde.'
      );
    } finally {
      setLoadingUrl(null);
    }
  };

  const renderCard = (herramienta) => (
    <TouchableOpacity
      key={herramienta.id}
      style={[
        styles.card,
        {
          borderLeftColor: herramienta.color,
          shadowColor: herramienta.color
        }
      ]}
      activeOpacity={0.8}
      onPress={() => handleOpenUrl(herramienta.url, herramienta.name)}
    >
      {/* Badge */}
      <View style={[styles.badge, { backgroundColor: herramienta.color }]}>
        <Text style={styles.badgeText}>{herramienta.badge}</Text>
      </View>

      {/* Icono */}
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: herramienta.color + '20' }
        ]}
      >
        <MaterialCommunityIcons
          name={herramienta.icon}
          size={32}
          color={herramienta.color}
        />
      </View>

      {/* Nombre */}
      <Text style={styles.title}>{herramienta.name}</Text>

      {/* Descripción */}
      <Text style={styles.description} numberOfLines={3}>
        {herramienta.description}
      </Text>

      {/* Tags */}
      <View style={styles.tagsContainer}>
        {herramienta.tags.map((tag, index) => (
          <View
            key={index}
            style={[styles.tag, { backgroundColor: herramienta.color + '20' }]}
          >
            <Text style={[styles.tagText, { color: herramienta.color }]}>
              #{tag}
            </Text>
          </View>
        ))}
      </View>

      {/* Botón de acción */}
      <View
        style={[
          styles.actionButton,
          {
            backgroundColor: herramienta.color,
            opacity: loadingUrl === herramienta.url ? 0.7 : 1
          }
        ]}
      >
        {loadingUrl === herramienta.url ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <MaterialCommunityIcons
              name="open-in-new"
              size={16}
              color="#fff"
            />
            <Text style={styles.actionButtonText}>Abrir</Text>
          </>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Header */}
      <View style={styles.header}>
        <MaterialCommunityIcons
          name="toolbox"
          size={48}
          color={COLORS.accent.primary}
        />
        <Text style={styles.headerTitle}>Herramientas del Ecosistema</Text>
        <Text style={styles.headerSubtitle}>
          Accede a aplicaciones complementarias para potenciar tu aprendizaje
        </Text>
      </View>

      {/* Cards Grid */}
      <View style={styles.grid}>
        {HERRAMIENTAS.map(herramienta => renderCard(herramienta))}
      </View>

      {/* Footer Info */}
      <View style={styles.footerInfo}>
        <MaterialCommunityIcons
          name="information-outline"
          size={20}
          color={COLORS.accent.primary}
        />
        <Text style={styles.footerText}>
          Necesita conexión a internet para acceder a estas herramientas
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg.primary
  },

  contentContainer: {
    padding: 16,
    paddingTop: 20
  },

  header: {
    alignItems: 'center',
    marginBottom: 32,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.bg.card
  },

  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginTop: 12,
    marginBottom: 8
  },

  headerSubtitle: {
    fontSize: 14,
    color: COLORS.text.secondary,
    textAlign: 'center',
    maxWidth: '90%',
    lineHeight: 20
  },

  grid: {
    gap: 16,
    marginBottom: 24
  },

  card: {
    backgroundColor: COLORS.bg.card,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3
  },

  badge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#8B5CF6'
  },

  badgeText: {
    fontSize: 20
  },

  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    marginRight: 12
  },

  title: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 8,
    marginRight: 40
  },

  description: {
    fontSize: 13,
    color: COLORS.text.secondary,
    lineHeight: 18,
    marginBottom: 12
  },

  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12
  },

  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#8B5CF6' + '20'
  },

  tagText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#8B5CF6'
  },

  actionButton: {
    flexDirection: 'row',
    backgroundColor: '#8B5CF6',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8
  },

  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff'
  },

  footerInfo: {
    flexDirection: 'row',
    backgroundColor: COLORS.bg.card,
    borderRadius: 12,
    padding: 12,
    gap: 12,
    alignItems: 'center',
    borderLeftWidth: 3,
    borderLeftColor: COLORS.accent.primary,
    marginTop: 16
  },

  footerText: {
    fontSize: 12,
    color: COLORS.text.secondary,
    flex: 1,
    lineHeight: 16
  }
});
