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

// Usar MemoryStorage - almacenamiento en memoria sin dependencias nativas
import memoryStorage from '../utils/MemoryStorage';
const AsyncStorage = memoryStorage;

// Screens
import {
  MapScreen,
  BeingsScreen,
  CrisisDetailScreen,
  ProfileScreen,
  LibraryScreen,
  TutorialScreen,
  ActiveMissionsScreen,
  HerramientasScreen,
  HelpScreen,
  FrankensteinLabScreen
} from '../screens';

// Nuevas pantallas - Modo Comandante Global y Liga
import CommandCenterScreen from '../screens/CommandCenterScreen';
import LeagueScreen from '../screens/LeagueScreen';

import { COLORS } from '../config/constants';
import useGameStore from '../stores/gameStore';
import logger from '../utils/logger';
import deepLinkService from '../services/DeepLinkService';
import webBridgeService from '../services/WebBridgeService';

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
  </Stack.Navigator>
);

/**
 * STACK: Navegación de biblioteca
 */
const LibraryStack = () => (
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
      name="LibraryFlow"
      component={LibraryScreen}
      options={{ title: 'Biblioteca Digital' }}
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
 */
const TabNavigator = () => (
  <Tab.Navigator
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
    {/* Mapa - Pantalla principal */}
    <Tab.Screen
      name="Map"
      component={MapStack}
      options={{
        title: 'Mapa',
        tabBarLabel: 'Mapa'
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

    {/* Centro de Comando - Modo Estrategia con Noticias Reales */}
    <Tab.Screen
      name="Command"
      component={CommandStack}
      options={{
        title: 'Comando',
        tabBarLabel: 'Comando'
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

      // Inicializar WebBridgeService para sincronización con webapp
      // NOTA: Configurar con las credenciales de Supabase reales
      const supabaseConfig = {
        url: 'https://YOUR_SUPABASE_URL.supabase.co',
        anonKey: 'YOUR_SUPABASE_ANON_KEY'
      };

      try {
        await webBridgeService.init(supabaseConfig);
        logger.info('RootNavigator', '✓ WebBridgeService initialized');

        // Opcional: Iniciar auto-sync si hay usuario autenticado
        const user = useGameStore.getState().user;
        if (user && user.id) {
          // Sincronizar al iniciar
          await webBridgeService.sync();
          // Activar auto-sync cada 10 minutos
          webBridgeService.startAutoSync(10);
        }
      } catch (bridgeError) {
        logger.warn('RootNavigator', 'WebBridge init failed, continuing without sync', bridgeError);
      }

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
