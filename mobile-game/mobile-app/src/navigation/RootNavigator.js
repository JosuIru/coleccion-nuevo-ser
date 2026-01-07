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
import { TutorialScreen } from '../screens';

import { COLORS } from '../config/constants';
import useGameStore from '../stores/gameStore';
import logger from '../utils/logger';
import deepLinkService from '../services/DeepLinkService';
import serviceManager from '../services/ServiceManager';

import {
  TrascendenciaHomeScreen,
  TrascendenciaRitualScreen,
  TrascendenciaMissionScreen,
  TrascendenciaBeingScreen,
  TrascendenciaProfileScreen
} from '../trascendencia';

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
 * TAB NAVIGATOR: Trascendencia
 */
const TrascendenciaTabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarShowLabel: true,
      tabBarActiveTintColor: COLORS.accent.success,
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
          case 'TrascendenciaHome':
            iconName = 'leaf';
            break;
          case 'TrascendenciaRitual':
            iconName = 'meditation';
            break;
          case 'TrascendenciaMission':
            iconName = 'map-marker-check';
            break;
          case 'TrascendenciaBeing':
            iconName = 'dna';
            break;
          case 'TrascendenciaProfile':
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
    <Tab.Screen
      name="TrascendenciaHome"
      component={TrascendenciaHomeScreen}
      options={{ title: 'Inicio', tabBarLabel: 'Inicio' }}
    />
    <Tab.Screen
      name="TrascendenciaRitual"
      component={TrascendenciaRitualScreen}
      options={{ title: 'Ritual', tabBarLabel: 'Ritual' }}
    />
    <Tab.Screen
      name="TrascendenciaMission"
      component={TrascendenciaMissionScreen}
      options={{ title: 'Misiones', tabBarLabel: 'Misiones' }}
    />
    <Tab.Screen
      name="TrascendenciaBeing"
      component={TrascendenciaBeingScreen}
      options={{ title: 'Ser', tabBarLabel: 'Ser' }}
    />
    <Tab.Screen
      name="TrascendenciaProfile"
      component={TrascendenciaProfileScreen}
      options={{ title: 'Perfil', tabBarLabel: 'Perfil' }}
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
      // NOTA: Configurar con las credenciales de Supabase reales
      const supabaseConfig = {
        url: 'https://YOUR_SUPABASE_URL.supabase.co',
        anonKey: 'YOUR_SUPABASE_ANON_KEY'
      };

      serviceManager.configure(supabaseConfig);

      // Inicializar solo servicios críticos (muy rápido, <100ms)
      // Los demás servicios se cargarán cuando se necesiten
      await serviceManager.initCritical();

      // Opcional: Activar auto-sync y realtime si hay usuario autenticado
      const user = useGameStore.getState().user;
      if (user && user.id) {
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
          component={TrascendenciaTabNavigator}
          options={{ gestureEnabled: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
