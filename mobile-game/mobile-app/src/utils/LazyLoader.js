/**
 * AWAKENING PROTOCOL - LAZY LOADER
 * Implementa code splitting y lazy loading para reducir bundle size inicial
 */

import React, { Suspense, lazy } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import logger from '../utils/logger';

/**
 * Loading fallback component
 */
const LoadingFallback = ({ text = 'Cargando...' }) => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#00D4FF" />
    {text && <Text style={styles.loadingText}>{text}</Text>}
  </View>
);

/**
 * HOC para lazy loading con error boundary
 */
export const lazyLoadScreen = (importFunc, fallbackText) => {
  const LazyComponent = lazy(importFunc);

  return (props) => (
    <Suspense fallback={<LoadingFallback text={fallbackText} />}>
      <LazyComponent {...props} />
    </Suspense>
  );
};

/**
 * Lazy loaded screens
 */
export const MapScreen = lazyLoadScreen(
  () => import('../screens/MapScreen'),
  'Cargando mapa...'
);

export const BeingsScreen = lazyLoadScreen(
  () => import('../screens/BeingsScreen'),
  'Cargando seres...'
);

export const CrisisDetailScreen = lazyLoadScreen(
  () => import('../screens/CrisisDetailScreen'),
  'Cargando crisis...'
);

export const LibraryScreen = lazyLoadScreen(
  () => import('../screens/LibraryScreen'),
  'Cargando biblioteca...'
);

export const ProfileScreen = lazyLoadScreen(
  () => import('../screens/ProfileScreen'),
  'Cargando perfil...'
);

export const SettingsScreen = lazyLoadScreen(
  () => import('../screens/SettingsScreen'),
  'Cargando configuración...'
);

/**
 * Preload screens in background
 */
export const preloadScreens = async () => {
  const screens = [
    import('../screens/MapScreen'),
    import('../screens/BeingsScreen'),
    import('../screens/LibraryScreen'),
  ];

  try {
    await Promise.all(screens);
    logger.info('[LazyLoader] Screens preloaded successfully', '');
  } catch (error) {
    logger.error('[LazyLoader] Error preloading screens:', error);
  }
};

/**
 * Lazy load heavy libraries
 */
export const loadMapLibrary = () => import('react-native-maps');
export const loadGestureHandler = () => import('react-native-gesture-handler');
export const loadReanimated = () => import('react-native-reanimated');

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0E1F',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#00D4FF',
    fontWeight: '600',
  },
});
