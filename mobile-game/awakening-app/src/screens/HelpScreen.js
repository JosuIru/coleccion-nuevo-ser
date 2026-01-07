/**
 * HELP SCREEN - Pantalla de ayuda del juego
 * Guía completa de cómo jugar Awakening Protocol
 *
 * @version 1.0.0
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions
} from 'react-native';

import { COLORS, APP_VERSION } from '../config/constants';

const { width } = Dimensions.get('window');

// Secciones de ayuda
const HELP_SECTIONS = [
  {
    id: 'overview',
    title: 'Resumen del Juego',
    icon: '🎮',
    content: [
      {
        subtitle: '¿Qué es Awakening Protocol?',
        text: 'Un juego de estrategia donde despliegas seres transformadores para resolver crisis del mundo real. Las crisis se basan en noticias reales de fuentes como UN News, BBC y The Guardian.'
      },
      {
        subtitle: 'Objetivo',
        text: 'Sube de nivel, colecciona seres, resuelve crisis y contribuye a un mundo mejor. Compite en la Liga de Crisis semanal para ganar recompensas.'
      }
    ]
  },
  {
    id: 'modes',
    title: 'Modos de Juego',
    icon: '🗺️',
    content: [
      {
        subtitle: 'Modo Explorador (Tab "Mapa")',
        text: 'Usa el GPS para explorar tu ciudad. Encuentra fractales en lugares reales como bibliotecas, parques y centros comunitarios. Las crisis aparecen cerca de tu ubicación.'
      },
      {
        subtitle: 'Modo Comandante (Tab "Comando")',
        text: 'Juega desde casa sin necesidad de GPS. Ve un mapa mundial con crisis globales basadas en noticias reales. Ideal para jugar cuando no puedes salir.'
      },
      {
        subtitle: 'Liga de Crisis',
        text: 'Competencia semanal accesible desde el icono de trofeo en el Centro de Comando. Gana puntos resolviendo crisis, mantén rachas diarias y sube de división.'
      }
    ]
  },
  {
    id: 'beings',
    title: 'Seres Transformadores',
    icon: '🧬',
    content: [
      {
        subtitle: '¿Qué son los Seres?',
        text: 'Son tus agentes de cambio. Cada ser tiene 15 atributos únicos: Empatía, Análisis, Creatividad, Liderazgo, Resiliencia, Comunicación, Colaboración, Adaptabilidad, Visión, Integridad, Compasión, Innovación, Sabiduría, Coraje y Esperanza.'
      },
      {
        subtitle: 'Cómo obtener Seres',
        text: '• Recibes un ser inicial al empezar\n• Crea nuevos seres gastando consciencia\n• Importa desde Frankenstein Lab\n• Fusiona dos seres para crear híbridos'
      },
      {
        subtitle: 'Atributos y Niveles',
        text: 'Cada atributo va de 0 a 100. Lee libros de la biblioteca para mejorar atributos específicos según el tema del libro.'
      }
    ]
  },
  {
    id: 'crisis',
    title: 'Crisis y Misiones',
    icon: '🚨',
    content: [
      {
        subtitle: 'Tipos de Crisis',
        text: '• Ambiental: Cambio climático, contaminación\n• Social: Desigualdad, conflictos\n• Económica: Pobreza, desempleo\n• Humanitaria: Refugiados, desastres\n• Salud: Epidemias, acceso médico\n• Educativa: Acceso, calidad\n• Infraestructura: Servicios básicos'
      },
      {
        subtitle: 'Cómo resolver una Crisis',
        text: '1. Selecciona una crisis del mapa\n2. Ve los atributos requeridos\n3. Elige seres con atributos que coincidan\n4. Despliega (gasta 10 energía por ser)\n5. Espera el tiempo de la misión\n6. Recibe resultados y recompensas'
      },
      {
        subtitle: 'Probabilidad de Éxito',
        text: 'Se calcula comparando los atributos de tus seres con los requeridos por la crisis. A mayor coincidencia, mayor probabilidad de éxito.'
      }
    ]
  },
  {
    id: 'fractals',
    title: 'Fractales',
    icon: '✨',
    content: [
      {
        subtitle: '¿Qué son los Fractales?',
        text: 'Puntos de energía que aparecen en lugares reales. Acércate a 50 metros para recolectarlos (solo en Modo Explorador).'
      },
      {
        subtitle: 'Tipos de Fractales',
        text: '• Sabiduría (azul): Bibliotecas, escuelas\n• Comunidad (naranja): Centros comunitarios\n• Naturaleza (verde): Parques, bosques\n• Acción (rojo): ONGs, cooperativas\n• Consciencia (morado): Centros de meditación'
      },
      {
        subtitle: 'Beneficios',
        text: 'Cada fractal otorga energía, XP y puntos de consciencia. Los fractales raros dan mejores recompensas.'
      }
    ]
  },
  {
    id: 'league',
    title: 'Liga de Crisis',
    icon: '🏆',
    content: [
      {
        subtitle: 'Sistema de Divisiones',
        text: '• Bronce: 0+ puntos\n• Plata: 1,000+ puntos\n• Oro: 3,000+ puntos\n• Platino: 7,000+ puntos\n• Diamante: 15,000+ puntos\n• Maestro: 30,000+ puntos\n• Leyenda: 60,000+ puntos'
      },
      {
        subtitle: 'Cómo ganar Puntos',
        text: '• Crisis resuelta: 100 pts\n• Crisis fallida: 30 pts\n• Primera del día: +50 pts\n• Racha 3 días: +100 pts\n• Racha 7 días: +300 pts\n• Racha 14 días: +1000 pts\n• Crisis destacada: +200 pts'
      },
      {
        subtitle: 'Recompensas Semanales',
        text: 'Al final de cada semana, los mejores jugadores reciben XP y puntos de consciencia según su posición en el ranking.'
      }
    ]
  },
  {
    id: 'resources',
    title: 'Recursos',
    icon: '⚡',
    content: [
      {
        subtitle: 'Energía',
        text: 'Se usa para desplegar seres (10 por despliegue). Se regenera con el tiempo y al recolectar fractales. Máximo según tu nivel.'
      },
      {
        subtitle: 'Puntos de Consciencia',
        text: 'Moneda del juego. Se usa para crear seres, mejorar atributos y desbloquear funciones. Se obtiene leyendo libros y resolviendo crisis.'
      },
      {
        subtitle: 'XP (Experiencia)',
        text: 'Sube tu nivel de jugador. A mayor nivel, más energía máxima y acceso a más funciones.'
      }
    ]
  },
  {
    id: 'tips',
    title: 'Consejos',
    icon: '💡',
    content: [
      {
        subtitle: 'Para principiantes',
        text: '• Empieza con el Modo Comandante si no puedes salir\n• Lee libros para mejorar tus seres\n• No gastes toda tu energía de una vez\n• Elige crisis con atributos que coincidan con tus seres'
      },
      {
        subtitle: 'Estrategia avanzada',
        text: '• Especializa algunos seres en ciertos atributos\n• Mantén una racha diaria para bonificaciones\n• Fusiona seres complementarios\n• Enfócate en crisis destacadas de la liga'
      },
      {
        subtitle: 'Integración con Frankenstein Lab',
        text: 'Los seres que crees en Frankenstein Lab (app web) pueden importarse aquí. Así puedes diseñar seres personalizados con atributos específicos.'
      }
    ]
  }
];

const HelpScreen = ({ navigation }) => {
  // Estado
  const [expandedSection, setExpandedSection] = useState('overview');

  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true
    }).start();
  }, []);

  // Toggle sección
  const toggleSection = (sectionId) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Ayuda</Text>

        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Intro */}
        <Animated.View style={[styles.introSection, { opacity: fadeAnim }]}>
          <Text style={styles.introIcon}>📖</Text>
          <Text style={styles.introTitle}>Guía de Awakening Protocol</Text>
          <Text style={styles.introText}>
            Toca cualquier sección para expandirla y ver más información.
          </Text>
        </Animated.View>

        {/* Secciones de ayuda */}
        {HELP_SECTIONS.map((section, index) => (
          <Animated.View
            key={section.id}
            style={[
              styles.section,
              {
                opacity: fadeAnim,
                transform: [{
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20 * (index + 1), 0]
                  })
                }]
              }
            ]}
          >
            {/* Header de sección */}
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => toggleSection(section.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.sectionIcon}>{section.icon}</Text>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.expandIcon}>
                {expandedSection === section.id ? '▼' : '▶'}
              </Text>
            </TouchableOpacity>

            {/* Contenido expandido */}
            {expandedSection === section.id && (
              <View style={styles.sectionContent}>
                {section.content.map((item, itemIndex) => (
                  <View key={itemIndex} style={styles.contentItem}>
                    <Text style={styles.contentSubtitle}>{item.subtitle}</Text>
                    <Text style={styles.contentText}>{item.text}</Text>
                  </View>
                ))}
              </View>
            )}
          </Animated.View>
        ))}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Awakening Protocol v{APP_VERSION}</Text>
          <Text style={styles.footerSubtext}>
            Parte de la Colección Nuevo Ser
          </Text>
        </View>

        {/* Botón para volver al tutorial */}
        <TouchableOpacity
          style={styles.tutorialButton}
          onPress={() => {
            // Navegar al tutorial
            navigation.navigate('Tutorial');
          }}
        >
          <Text style={styles.tutorialButtonText}>🎓 Ver Tutorial Completo</Text>
        </TouchableOpacity>
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
    alignItems: 'center',
    justifyContent: 'space-between',
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

  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text.primary
  },

  placeholder: {
    width: 40
  },

  // Scroll
  scrollView: {
    flex: 1
  },

  scrollContent: {
    paddingBottom: 40
  },

  // Intro
  introSection: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: COLORS.bg.secondary,
    marginBottom: 8
  },

  introIcon: {
    fontSize: 48,
    marginBottom: 12
  },

  introTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 8,
    textAlign: 'center'
  },

  introText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    textAlign: 'center'
  },

  // Secciones
  section: {
    backgroundColor: COLORS.bg.secondary,
    marginBottom: 2
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.bg.elevated
  },

  sectionIcon: {
    fontSize: 24,
    marginRight: 12
  },

  sectionTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary
  },

  expandIcon: {
    fontSize: 12,
    color: COLORS.text.secondary
  },

  sectionContent: {
    padding: 16,
    paddingTop: 8,
    backgroundColor: COLORS.bg.primary
  },

  contentItem: {
    marginBottom: 16
  },

  contentSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.accent.primary,
    marginBottom: 6
  },

  contentText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    lineHeight: 22
  },

  // Footer
  footer: {
    alignItems: 'center',
    padding: 24,
    marginTop: 16
  },

  footerText: {
    fontSize: 14,
    color: COLORS.text.dim,
    marginBottom: 4
  },

  footerSubtext: {
    fontSize: 12,
    color: COLORS.text.dim
  },

  // Botón tutorial
  tutorialButton: {
    marginHorizontal: 16,
    marginBottom: 24,
    paddingVertical: 14,
    backgroundColor: COLORS.accent.primary,
    borderRadius: 12,
    alignItems: 'center'
  },

  tutorialButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary
  }
});

export default HelpScreen;
