/**
 * PROFILE SCREEN - Perfil del jugador
 * Estadísticas, logros, configuración y logout
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  Switch,
  Alert,
  Dimensions
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';

import useGameStore from '../stores/gameStore';
import { COLORS, LEVELS, APP_VERSION } from '../config/constants';

const { width } = Dimensions.get('window');

const ProfileScreen = ({ navigation }) => {
  // ═══════════════════════════════════════════════════════════
  // ESTADO
  // ═══════════════════════════════════════════════════════════

  const [showSettings, setShowSettings] = useState(false);

  // Zustand store
  const {
    user,
    beings,
    settings,
    updateSettings,
    reset,
    saveToStorage,
    syncing
  } = useGameStore();

  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const avatarScaleAnim = useRef(new Animated.Value(1)).current;

  // ═══════════════════════════════════════════════════════════
  // EFECTOS
  // ═══════════════════════════════════════════════════════════

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true
    }).start();

    // Animación de pulso del avatar
    Animated.loop(
      Animated.sequence([
        Animated.timing(avatarScaleAnim, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true
        }),
        Animated.timing(avatarScaleAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true
        })
      ])
    ).start();
  }, []);

  // ═══════════════════════════════════════════════════════════
  // CÁLCULOS
  // ═══════════════════════════════════════════════════════════

  const currentLevelData = LEVELS[user.level] || LEVELS[1];
  const nextLevelData = LEVELS[user.level + 1];

  const xpProgress = nextLevelData
    ? ((user.xp - currentLevelData.xpRequired) / (nextLevelData.xpRequired - currentLevelData.xpRequired)) * 100
    : 100;

  // Estadísticas
  const totalBeings = beings.length;
  const deployedBeings = beings.filter(b => b.status === 'deployed').length;
  const availableBeings = beings.filter(b => b.status === 'available').length;

  // Mock de estadísticas (en una app real vendrían del store)
  const stats = {
    crisesResolved: 12,
    fractalsCollected: 45,
    beingsCreated: totalBeings,
    totalEnergy: user.energy,
    totalConsciousness: user.consciousnessPoints,
    daysActive: 7
  };

  // Mock de logros
  const achievements = [
    { id: 1, name: 'Primer Despertar', description: 'Crea tu primer ser', icon: '🌟', unlocked: totalBeings >= 1 },
    { id: 2, name: 'Coleccionista', description: 'Recolecta 10 fractales', icon: '💎', unlocked: stats.fractalsCollected >= 10 },
    { id: 3, name: 'Héroe Local', description: 'Resuelve 5 crisis', icon: '🦸', unlocked: stats.crisesResolved >= 5 },
    { id: 4, name: 'Transformador', description: 'Alcanza nivel 10', icon: '⚡', unlocked: user.level >= 10 },
    { id: 5, name: 'Maestro de Seres', description: 'Posee 10 seres', icon: '🧬', unlocked: totalBeings >= 10 },
    { id: 6, name: 'Consciencia Elevada', description: 'Acumula 1000 puntos de consciencia', icon: '🌌', unlocked: user.consciousnessPoints >= 1000 }
  ];

  const unlockedAchievements = achievements.filter(a => a.unlocked);

  // ═══════════════════════════════════════════════════════════
  // ACCIONES
  // ═══════════════════════════════════════════════════════════

  const onLogout = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro de que quieres cerrar sesión? Los datos locales se mantendrán.',
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: async () => {
            await saveToStorage(); // Guardar antes de salir
            reset();
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }]
            });
          }
        }
      ]
    );
  };

  const onClearData = () => {
    Alert.alert(
      'Borrar datos',
      '¿Estás seguro? Esta acción no se puede deshacer. Perderás todo tu progreso.',
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Borrar todo',
          style: 'destructive',
          onPress: async () => {
            try {
              if (AsyncStorage && typeof AsyncStorage.clear === 'function') {
                await AsyncStorage.clear();
              }
            } catch (e) {
              console.warn('[ProfileScreen] clear failed:', e.message);
            }
            reset();
            Alert.alert('Datos borrados', 'Todos los datos han sido eliminados.');
          }
        }
      ]
    );
  };

  const onSyncNow = async () => {
    Alert.alert('Sincronización', 'Función de sincronización en desarrollo. Próximamente podrás sincronizar con la app web.');
  };

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════

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

        <Text style={styles.headerTitle}>Perfil</Text>

        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => setShowSettings(!showSettings)}
        >
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* PERFIL */}
        <Animated.View
          style={[
            styles.profileSection,
            {
              opacity: fadeAnim,
              transform: [{ scale: avatarScaleAnim }]
            }
          ]}
        >
          <View style={styles.avatarContainer}>
            <Text style={styles.avatar}>👤</Text>
            <View style={styles.levelBadge}>
              <Text style={styles.levelBadgeText}>{user.level}</Text>
            </View>
          </View>

          <Text style={styles.username}>{user.username || 'Usuario'}</Text>
          <Text style={styles.levelName}>{currentLevelData.name}</Text>
        </Animated.View>

        {/* BARRA DE XP */}
        <View style={styles.xpSection}>
          <View style={styles.xpHeader}>
            <Text style={styles.xpLabel}>Nivel {user.level}</Text>
            {nextLevelData && (
              <Text style={styles.xpText}>
                {user.xp} / {nextLevelData.xpRequired} XP
              </Text>
            )}
          </View>

          <View style={styles.xpBarContainer}>
            <Animated.View
              style={[
                styles.xpBarFill,
                {
                  width: `${Math.min(100, xpProgress)}%`,
                  opacity: fadeAnim
                }
              ]}
            />
          </View>

          {nextLevelData && (
            <Text style={styles.nextLevelText}>
              Siguiente: {nextLevelData.name}
            </Text>
          )}
        </View>

        {/* ESTADÍSTICAS */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Estadísticas</Text>

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statIcon}>🔥</Text>
              <Text style={styles.statValue}>{stats.crisesResolved}</Text>
              <Text style={styles.statLabel}>Crisis resueltas</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statIcon}>💎</Text>
              <Text style={styles.statValue}>{stats.fractalsCollected}</Text>
              <Text style={styles.statLabel}>Fractales</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statIcon}>🧬</Text>
              <Text style={styles.statValue}>{stats.beingsCreated}</Text>
              <Text style={styles.statLabel}>Seres creados</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statIcon}>⚡</Text>
              <Text style={styles.statValue}>{stats.totalEnergy}</Text>
              <Text style={styles.statLabel}>Energía</Text>
            </View>

            <TouchableOpacity
              style={styles.statCard}
              onPress={() => navigation.navigate('Command', { screen: 'Shop' })}
            >
              <Text style={styles.statIcon}>🌟</Text>
              <Text style={styles.statValue}>{stats.totalConsciousness}</Text>
              <Text style={styles.statLabel}>Tienda</Text>
            </TouchableOpacity>

            <View style={styles.statCard}>
              <Text style={styles.statIcon}>📅</Text>
              <Text style={styles.statValue}>{stats.daysActive}</Text>
              <Text style={styles.statLabel}>Días activo</Text>
            </View>
          </View>
        </View>

        {/* LOGROS */}
        <View style={styles.achievementsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Logros</Text>
            <Text style={styles.achievementCount}>
              {unlockedAchievements.length}/{achievements.length}
            </Text>
          </View>

          <View style={styles.achievementsList}>
            {achievements.map(achievement => (
              <View
                key={achievement.id}
                style={[
                  styles.achievementCard,
                  !achievement.unlocked && styles.achievementCardLocked
                ]}
              >
                <Text style={[
                  styles.achievementIcon,
                  !achievement.unlocked && styles.achievementIconLocked
                ]}>
                  {achievement.icon}
                </Text>
                <View style={styles.achievementInfo}>
                  <Text style={[
                    styles.achievementName,
                    !achievement.unlocked && styles.achievementTextLocked
                  ]}>
                    {achievement.name}
                  </Text>
                  <Text style={[
                    styles.achievementDescription,
                    !achievement.unlocked && styles.achievementTextLocked
                  ]}>
                    {achievement.description}
                  </Text>
                </View>
                {achievement.unlocked && (
                  <View style={styles.achievementCheckmark}>
                    <Text style={styles.checkmarkText}>✓</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* CONFIGURACIÓN */}
        {showSettings && (
          <Animated.View
            style={[
              styles.settingsSection,
              { opacity: fadeAnim }
            ]}
          >
            <Text style={styles.sectionTitle}>Configuración</Text>

            {/* Sincronización */}
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Modo de sincronización</Text>
                <Text style={styles.settingDescription}>
                  {settings.syncMode === 'read-only' ? 'Solo lectura' : settings.syncMode === 'two-way' ? 'Bidireccional' : 'Desactivado'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.syncButton}
                onPress={onSyncNow}
              >
                <Text style={styles.syncButtonText}>Sincronizar</Text>
              </TouchableOpacity>
            </View>

            {/* Notificaciones */}
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Notificaciones</Text>
                <Text style={styles.settingDescription}>
                  Recibe alertas de crisis y fractales
                </Text>
              </View>
              <Switch
                value={settings.notificationsEnabled}
                onValueChange={(value) => updateSettings({ notificationsEnabled: value })}
                trackColor={{ false: COLORS.text.dim, true: COLORS.accent.primary }}
              />
            </View>

            {/* Sonido */}
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Sonido</Text>
                <Text style={styles.settingDescription}>
                  Efectos de sonido
                </Text>
              </View>
              <Switch
                value={settings.soundEnabled}
                onValueChange={(value) => updateSettings({ soundEnabled: value })}
                trackColor={{ false: COLORS.text.dim, true: COLORS.accent.primary }}
              />
            </View>

            {/* Hápticos */}
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Vibración</Text>
                <Text style={styles.settingDescription}>
                  Retroalimentación háptica
                </Text>
              </View>
              <Switch
                value={settings.hapticsEnabled}
                onValueChange={(value) => updateSettings({ hapticsEnabled: value })}
                trackColor={{ false: COLORS.text.dim, true: COLORS.accent.primary }}
              />
            </View>

            {/* Versión */}
            <View style={styles.versionRow}>
              <Text style={styles.versionText}>Versión {APP_VERSION}</Text>
            </View>

            {/* Acciones peligrosas */}
            <View style={styles.dangerZone}>
              <Text style={styles.dangerZoneTitle}>Zona de peligro</Text>

              <TouchableOpacity
                style={styles.dangerButton}
                onPress={onClearData}
              >
                <Text style={styles.dangerButtonText}>Borrar todos los datos</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {/* BOTÓN DE AYUDA */}
        <TouchableOpacity
          style={styles.helpButton}
          onPress={() => navigation.navigate('HelpFlow')}
        >
          <Text style={styles.helpButtonText}>❓ Ayuda - Cómo Jugar</Text>
        </TouchableOpacity>

        {/* BOTÓN DE HERRAMIENTAS */}
        <TouchableOpacity
          style={styles.herramientasButton}
          onPress={() => navigation.navigate('HerramientasFlow')}
        >
          <Text style={styles.herramientasButtonText}>🛠️ Herramientas del Ecosistema</Text>
        </TouchableOpacity>

        {/* BOTÓN DE LOGOUT */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={onLogout}
        >
          <Text style={styles.logoutButtonText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════
// ESTILOS
// ═══════════════════════════════════════════════════════════

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

  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.bg.elevated,
    justifyContent: 'center',
    alignItems: 'center'
  },

  settingsIcon: {
    fontSize: 20
  },

  // Scroll
  scrollView: {
    flex: 1
  },

  scrollContent: {
    paddingBottom: 40
  },

  // Perfil
  profileSection: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: COLORS.bg.secondary,
    marginBottom: 8
  },

  avatarContainer: {
    position: 'relative',
    marginBottom: 16
  },

  avatar: {
    fontSize: 80
  },

  levelBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.accent.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.bg.secondary
  },

  levelBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text.primary
  },

  username: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 4
  },

  levelName: {
    fontSize: 16,
    color: COLORS.accent.primary,
    fontWeight: '600'
  },

  // XP
  xpSection: {
    padding: 16,
    backgroundColor: COLORS.bg.secondary,
    marginBottom: 8
  },

  xpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },

  xpLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary
  },

  xpText: {
    fontSize: 12,
    color: COLORS.text.secondary
  },

  xpBarContainer: {
    height: 12,
    backgroundColor: COLORS.bg.primary,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8
  },

  xpBarFill: {
    height: '100%',
    backgroundColor: COLORS.accent.primary,
    borderRadius: 6
  },

  nextLevelText: {
    fontSize: 12,
    color: COLORS.text.dim,
    textAlign: 'center'
  },

  // Estadísticas
  statsSection: {
    padding: 16,
    backgroundColor: COLORS.bg.secondary,
    marginBottom: 8
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 16
  },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12
  },

  statCard: {
    width: (width - 56) / 3, // 3 columnas con gaps
    padding: 12,
    backgroundColor: COLORS.bg.elevated,
    borderRadius: 12,
    alignItems: 'center'
  },

  statIcon: {
    fontSize: 32,
    marginBottom: 8
  },

  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 4
  },

  statLabel: {
    fontSize: 11,
    color: COLORS.text.secondary,
    textAlign: 'center'
  },

  // Logros
  achievementsSection: {
    padding: 16,
    backgroundColor: COLORS.bg.secondary,
    marginBottom: 8
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },

  achievementCount: {
    fontSize: 14,
    color: COLORS.text.secondary,
    fontWeight: '600'
  },

  achievementsList: {
    gap: 12
  },

  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: COLORS.bg.elevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.accent.success + '40'
  },

  achievementCardLocked: {
    backgroundColor: COLORS.bg.primary,
    borderColor: COLORS.text.dim + '20',
    opacity: 0.6
  },

  achievementIcon: {
    fontSize: 32,
    marginRight: 12
  },

  achievementIconLocked: {
    opacity: 0.4
  },

  achievementInfo: {
    flex: 1
  },

  achievementName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 2
  },

  achievementDescription: {
    fontSize: 12,
    color: COLORS.text.secondary
  },

  achievementTextLocked: {
    color: COLORS.text.dim
  },

  achievementCheckmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.accent.success,
    justifyContent: 'center',
    alignItems: 'center'
  },

  checkmarkText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700'
  },

  // Configuración
  settingsSection: {
    padding: 16,
    backgroundColor: COLORS.bg.secondary,
    marginBottom: 8
  },

  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.bg.primary
  },

  settingInfo: {
    flex: 1
  },

  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4
  },

  settingDescription: {
    fontSize: 12,
    color: COLORS.text.secondary
  },

  syncButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: COLORS.accent.primary,
    borderRadius: 8
  },

  syncButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text.primary
  },

  versionRow: {
    paddingVertical: 16,
    alignItems: 'center'
  },

  versionText: {
    fontSize: 12,
    color: COLORS.text.dim
  },

  dangerZone: {
    marginTop: 24,
    padding: 16,
    backgroundColor: COLORS.accent.critical + '10',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.accent.critical + '40'
  },

  dangerZoneTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.accent.critical,
    marginBottom: 12
  },

  dangerButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.accent.critical,
    borderRadius: 8,
    alignItems: 'center'
  },

  dangerButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary
  },

  // Ayuda
  helpButton: {
    margin: 16,
    marginBottom: 8,
    paddingVertical: 14,
    backgroundColor: COLORS.accent.primary,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.accent.primary
  },

  helpButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff'
  },

  // Herramientas
  herramientasButton: {
    margin: 16,
    marginTop: 0,
    marginBottom: 8,
    paddingVertical: 14,
    backgroundColor: '#6366F1',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#6366F1'
  },

  herramientasButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff'
  },

  // Logout
  logoutButton: {
    margin: 16,
    paddingVertical: 14,
    backgroundColor: COLORS.bg.elevated,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.text.dim
  },

  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.secondary
  }
});

export default ProfileScreen;
