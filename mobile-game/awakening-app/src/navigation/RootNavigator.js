/**
 * ROOT NAVIGATOR
 * Configuración centralizada de navegación de la app
 * Define la estructura de flujo entre pantallas
 *
 * @version 1.0.0
 */

import React, { useEffect, useState, useRef } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import AsyncStorage from '@react-native-async-storage/async-storage';

// Screens
import {
  MapScreen,
  BeingsScreen,
  CrisisDetailScreen,
  ProfileScreen,
  TutorialScreen,
  ActiveMissionsScreen,
  DailyMissionsScreen,
  ConsciousnessShopScreen,
  PieceFusionScreen,
  BeingFusionScreen,
  HerramientasScreen,
  HelpScreen,
  FrankensteinLabScreen
} from '../screens';

// Nuevas pantallas - Modo Comandante Global y Liga
import CommandCenterScreen from '../screens/CommandCenterScreen';
import LeagueScreen from '../screens/LeagueScreen';

// Biblioteca - Webapp embebida de Colección Nuevo Ser
import BibliotecaScreen from '../screens/BibliotecaScreen';

import { COLORS } from '../config/constants';
import useGameStore from '../stores/gameStore';
import logger from '../utils/logger';
import deepLinkService from '../services/DeepLinkService';
import serviceManager from '../services/ServiceManager';
import soundService from '../services/SoundService';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

/**
 * STACK: Navegación de tutorial
 * Se muestra en el primer inicio
 */
const TutorialStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      animationEnabled: true,
      cardStyle: { backgroundColor: COLORS.bg.primary }
    }}
  >
    <Stack.Screen
      name="TutorialFlow"
      component={TutorialScreen}
      options={{
        gestureEnabled: false // Prevenir back gesture durante tutorial
      }}
    />
  </Stack.Navigator>
);

/**
 * STACK: Navegación principal
 * Pantalla de mapa es la base, con pantallas modales
 */
const MapStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      animationEnabled: true,
      cardStyle: { backgroundColor: COLORS.bg.primary }
    }}
  >
    <Stack.Screen
      name="MapFlow"
      component={MapScreen}
      options={{ gestureEnabled: false }}
    />
    <Stack.Screen
      name="CrisisDetail"
      component={CrisisDetailScreen}
      options={{
        cardOverlayEnabled: true,
        animationEnabled: true
      }}
    />
  </Stack.Navigator>
);

/**
 * STACK: Navegación de seres
 */
const BeingsStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: true,
      headerTintColor: COLORS.text.primary,
      headerStyle: {
        backgroundColor: COLORS.bg.elevated,
        borderBottomColor: COLORS.bg.card,
        borderBottomWidth: 1
      },
      headerTitleStyle: {
        color: COLORS.text.primary,
        fontSize: 20,
        fontWeight: 'bold'
      },
      cardStyle: { backgroundColor: COLORS.bg.primary }
    }}
  >
    <Stack.Screen
      name="BeingsList"
      component={BeingsScreen}
      options={{ title: 'Mis Seres' }}
    />
    <Stack.Screen
      name="BeingFusion"
      component={BeingFusionScreen}
      options={{ headerShown: false }}
    />
  </Stack.Navigator>
);

/**
 * STACK: Navegación de misiones (legacy)
 */
const MissionsStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: true,
      headerTintColor: COLORS.text.primary,
      headerStyle: {
        backgroundColor: COLORS.bg.elevated,
        borderBottomColor: COLORS.bg.card,
        borderBottomWidth: 1
      },
      headerTitleStyle: {
        color: COLORS.text.primary,
        fontSize: 20,
        fontWeight: 'bold'
      },
      cardStyle: { backgroundColor: COLORS.bg.primary }
    }}
  >
    <Stack.Screen
      name="MissionsList"
      component={ActiveMissionsScreen}
      options={{ title: 'Misiones Activas' }}
    />
  </Stack.Navigator>
);

/**
 * STACK: Centro de Comando Global (Modo Estrategia con Noticias Reales)
 * Incluye CommandCenter y Liga de Crisis
 */
const CommandStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      animationEnabled: true,
      cardStyle: { backgroundColor: COLORS.bg.primary }
    }}
  >
    <Stack.Screen
      name="CommandCenter"
      component={CommandCenterScreen}
      options={{ gestureEnabled: false }}
    />
    <Stack.Screen
      name="League"
      component={LeagueScreen}
      options={{
        headerShown: false,
        animationEnabled: true
      }}
    />
    <Stack.Screen
      name="ActiveMissions"
      component={ActiveMissionsScreen}
      options={{
        headerShown: true,
        headerTintColor: COLORS.text.primary,
        headerStyle: {
          backgroundColor: COLORS.bg.elevated,
          borderBottomColor: COLORS.bg.card,
          borderBottomWidth: 1
        },
        title: 'Misiones Activas'
      }}
    />
    <Stack.Screen
      name="DailyMissions"
      component={DailyMissionsScreen}
      options={{
        headerShown: true,
        headerTintColor: COLORS.text.primary,
        headerStyle: {
          backgroundColor: COLORS.bg.elevated,
          borderBottomColor: COLORS.bg.card,
          borderBottomWidth: 1
        },
        title: 'Misiones Diarias'
      }}
    />
    <Stack.Screen
      name="Shop"
      component={ConsciousnessShopScreen}
      options={{
        headerShown: false,
        animationEnabled: true
      }}
    />
    <Stack.Screen
      name="PieceFusion"
      component={PieceFusionScreen}
      options={{
        headerShown: false,
        animationEnabled: true
      }}
    />
  </Stack.Navigator>
);

/**
 * STACK: Navegación de biblioteca (Webapp embebida)
 * Carga la webapp completa de Colección Nuevo Ser desde assets locales
 */
const LibraryStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false, // BibliotecaScreen tiene su propio header
      animationEnabled: true,
      cardStyle: { backgroundColor: COLORS.bg.primary }
    }}
  >
    <Stack.Screen
      name="LibraryFlow"
      component={BibliotecaScreen}
      options={{ gestureEnabled: false }}
    />
  </Stack.Navigator>
);

/**
 * STACK: Navegación de perfil
 */
const ProfileStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: true,
      headerTintColor: COLORS.text.primary,
      headerStyle: {
        backgroundColor: COLORS.bg.elevated,
        borderBottomColor: COLORS.bg.card,
        borderBottomWidth: 1
      },
      headerTitleStyle: {
        color: COLORS.text.primary,
        fontSize: 20,
        fontWeight: 'bold'
      },
      cardStyle: { backgroundColor: COLORS.bg.primary }
    }}
  >
    <Stack.Screen
      name="ProfileFlow"
      component={ProfileScreen}
      options={{ title: 'Mi Perfil' }}
    />
    <Stack.Screen
      name="HelpFlow"
      component={HelpScreen}
      options={{ title: 'Ayuda' }}
    />
    <Stack.Screen
      name="HerramientasFlow"
      component={HerramientasScreen}
      options={{ title: 'Herramientas del Ecosistema' }}
    />
  </Stack.Navigator>
);

/**
 * STACK: Laboratorio Frankenstein
 */
const LabStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      animationEnabled: true,
      cardStyle: { backgroundColor: COLORS.bg.primary }
    }}
  >
    <Stack.Screen
      name="LabFlow"
      component={FrankensteinLabScreen}
      options={{ gestureEnabled: false }}
    />
  </Stack.Navigator>
);

/**
 * TAB NAVIGATOR: Navegación principal con tabs
 * NOTA: El tab por defecto es "Command" (Centro de Comando) para que usuarios
 * nuevos puedan jugar sin necesidad de GPS/ubicación.
 */
const TabNavigator = () => (
  <Tab.Navigator
    initialRouteName="Command"
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarShowLabel: true,
      tabBarActiveTintColor: COLORS.accent.primary,
      tabBarInactiveTintColor: COLORS.text.secondary,
      tabBarStyle: {
        backgroundColor: COLORS.bg.elevated,
        borderTopColor: COLORS.bg.card,
        borderTopWidth: 1,
        paddingBottom: 5,
        paddingTop: 5
      },
      tabBarIcon: ({ color, size }) => {
        let iconName;

        switch (route.name) {
          case 'Map':
            iconName = 'map';
            break;
          case 'Beings':
            iconName = 'dna';
            break;
          case 'Library':
            iconName = 'book-open-page-variant'; // Icono de Biblioteca
            break;
          case 'Lab':
            iconName = 'flask'; // Icono del Laboratorio
            break;
          case 'Command':
            iconName = 'shield-star'; // Icono del Centro de Comando
            break;
          case 'Profile':
            iconName = 'account-circle';
            break;
          default:
            iconName = 'help-circle';
        }

        return (
          <MaterialCommunityIcons name={iconName} size={size} color={color} />
        );
      }
    })}
  >
    {/* Centro de Comando - PRIMERO: Modo Estrategia con Noticias Reales (no requiere GPS) */}
    <Tab.Screen
      name="Command"
      component={CommandStack}
      options={{
        title: 'Comando',
        tabBarLabel: 'Comando'
      }}
    />

    {/* Seres */}
    <Tab.Screen
      name="Beings"
      component={BeingsStack}
      options={{
        title: 'Seres',
        tabBarLabel: 'Seres'
      }}
    />

    {/* Laboratorio Frankenstein */}
    <Tab.Screen
      name="Lab"
      component={LabStack}
      options={{
        title: 'Lab',
        tabBarLabel: 'Lab'
      }}
    />

    {/* Mapa - Requiere GPS */}
    <Tab.Screen
      name="Map"
      component={MapStack}
      options={{
        title: 'Mapa',
        tabBarLabel: 'Mapa'
      }}
    />

    {/* Perfil */}
    <Tab.Screen
      name="Profile"
      component={ProfileStack}
      options={{
        title: 'Perfil',
        tabBarLabel: 'Perfil'
      }}
    />
  </Tab.Navigator>
);

/**
 * ROOT NAVIGATOR
 * Determina si mostrar tutorial o app principal
 */
export default function RootNavigator() {
  const [initialRoute, setInitialRoute] = useState(null);
  const [loading, setLoading] = useState(true);
  const { loadFromStorage } = useGameStore();
  const navigationRef = useRef(null);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Cargar estado del juego desde storage
      const gameStateLoaded = await loadFromStorage();

      // Configurar ServiceManager con credenciales de Supabase
      // Las credenciales se cargan desde variables de entorno o Config
      // Por ahora, el sync está deshabilitado si no hay credenciales configuradas
      const supabaseUrl = process.env.SUPABASE_URL || null;
      const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || null;

      const isSupabaseConfigured = supabaseUrl && supabaseAnonKey &&
        !supabaseUrl.includes('YOUR_') && !supabaseAnonKey.includes('YOUR_');

      if (isSupabaseConfigured) {
        serviceManager.configure({
          url: supabaseUrl,
          anonKey: supabaseAnonKey
        });
        logger.info('RootNavigator', '☁️ Supabase sync enabled');
      } else {
        logger.info('RootNavigator', '📱 Running in offline mode (no Supabase config)');
      }

      // Inicializar solo servicios críticos (muy rápido, <100ms)
      // Los demás servicios se cargarán cuando se necesiten
      await serviceManager.initCritical();

      // Inicializar servicio de sonido
      await soundService.initialize();
      logger.info('RootNavigator', '🔊 Sound service initialized');

      // Opcional: Activar auto-sync y realtime si hay usuario autenticado y Supabase configurado
      const user = useGameStore.getState().user;
      if (isSupabaseConfigured && user && user.id) {
        serviceManager.setAutoSyncEnabled(true);
        // Realtime se activará automáticamente cuando se acceda por primera vez
      }

      logger.info('RootNavigator', '✓ App initialized with lazy loading');

      // Verificar si es la primera vez (con fallback si AsyncStorage no existe)
      let tutorialCompleted = null;
      try {
        if (AsyncStorage && AsyncStorage.getItem) {
          tutorialCompleted = await AsyncStorage.getItem('tutorial_completed');
        }
      } catch (storageError) {
        logger.warn('RootNavigator', 'AsyncStorage not available, skipping');
        // Si AsyncStorage no funciona, mostrar app principal directamente
        tutorialCompleted = 'true';
      }

      // Determinar ruta inicial
      if (!tutorialCompleted) {
        // Primera vez: mostrar tutorial
        setInitialRoute('Tutorial');
        logger.info('RootNavigator', '🎬 Showing tutorial for new user');
      } else {
        // Usuario retornado: mostrar app principal
        setInitialRoute('Main');
        logger.info('RootNavigator', '📱 Loading main app');
      }

      // Inicializar deep link service
      if (navigationRef.current) {
        await deepLinkService.initialize(navigationRef);
      }
    } catch (error) {
      logger.error('RootNavigator', 'Error initializing app', error);
      // En caso de error, mostrar app principal
      setInitialRoute('Main');
    } finally {
      setLoading(false);
    }
  };

  const handleNavigationReady = () => {
    // Procesar deep links pendientes cuando la navegación esté lista
    deepLinkService.processPendingDeepLink();
  };

  // Loading screen mientras se inicializa
  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: COLORS.bg.primary,
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <ActivityIndicator size="large" color={COLORS.accent.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={handleNavigationReady}
    >
      <Stack.Navigator
        screenOptions={{ headerShown: false }}
        initialRouteName={initialRoute}
      >
        {/* Tutorial (solo primera vez) */}
        {!initialRoute || initialRoute === 'Tutorial' ? (
          <Stack.Screen
            name="Tutorial"
            component={TutorialStack}
            options={{ gestureEnabled: false }}
          />
        ) : null}

        {/* App Principal */}
        <Stack.Screen
          name="Main"
          component={TabNavigator}
          options={{ gestureEnabled: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
