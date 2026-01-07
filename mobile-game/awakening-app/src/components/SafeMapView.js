/**
 * SafeMapView - Wrapper seguro para react-native-maps
 * Usa Google Maps en Android con fallback a placeholder si falla
 *
 * @version 2.0.0
 */

import React, { useState, forwardRef } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

// Importar react-native-maps
let MapViewComponent = null;
let MarkerComponent = null;
let CircleComponent = null;
let PROVIDER_GOOGLE = null;

try {
  const RNMaps = require('react-native-maps');
  MapViewComponent = RNMaps.default;
  MarkerComponent = RNMaps.Marker;
  CircleComponent = RNMaps.Circle;
  PROVIDER_GOOGLE = RNMaps.PROVIDER_GOOGLE;
} catch (error) {
  console.warn('react-native-maps no disponible:', error.message);
}

// Placeholder cuando el mapa no está disponible
const MapPlaceholder = ({ style, children }) => (
  <View style={[styles.placeholder, style]}>
    <View style={styles.grid}>
      {[...Array(16)].map((_, i) => (
        <View key={i} style={styles.gridCell} />
      ))}
    </View>

    <View style={styles.overlay}>
      <Text style={styles.placeholderIcon}>🌍</Text>
      <Text style={styles.placeholderTitle}>Cargando Mapa...</Text>
      <Text style={styles.placeholderText}>
        Si el mapa no aparece, verifica tu conexión a internet.
      </Text>
    </View>

    {children}
  </View>
);

// SafeMapView - usa react-native-maps con fallback
export const SafeMapView = forwardRef(({
  children,
  style,
  initialRegion,
  onRegionChangeComplete,
  showsUserLocation,
  showsMyLocationButton,
  showsCompass,
  customMapStyle,
  ...props
}, ref) => {
  const [mapError, setMapError] = useState(false);

  // Si no hay MapView disponible o hubo error, mostrar placeholder
  if (!MapViewComponent || mapError) {
    return <MapPlaceholder style={style}>{children}</MapPlaceholder>;
  }

  return (
    <MapViewComponent
      ref={ref}
      style={[styles.map, style]}
      provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : null}
      initialRegion={initialRegion}
      onRegionChangeComplete={onRegionChangeComplete}
      showsUserLocation={showsUserLocation}
      showsMyLocationButton={showsMyLocationButton}
      showsCompass={showsCompass}
      customMapStyle={customMapStyle}
      onMapReady={() => {
        console.log('✅ Google Maps cargado correctamente');
      }}
      onError={(error) => {
        console.error('❌ Error en Google Maps:', error);
        setMapError(true);
      }}
      {...props}
    >
      {children}
    </MapViewComponent>
  );
});

// Marker - usa el real si está disponible
export const Marker = ({ children, coordinate, onPress, ...props }) => {
  if (!MarkerComponent || !coordinate) {
    return null;
  }

  return (
    <MarkerComponent
      coordinate={coordinate}
      onPress={onPress}
      {...props}
    >
      {children}
    </MarkerComponent>
  );
};

// Circle - usa el real si está disponible
export const Circle = ({ center, radius, strokeColor, fillColor, ...props }) => {
  if (!CircleComponent || !center) {
    return null;
  }

  return (
    <CircleComponent
      center={center}
      radius={radius}
      strokeColor={strokeColor}
      fillColor={fillColor}
      strokeWidth={2}
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  placeholder: {
    flex: 1,
    backgroundColor: '#0A0E1F',
    overflow: 'hidden',
  },
  grid: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    flexWrap: 'wrap',
    opacity: 0.1,
  },
  gridCell: {
    width: '25%',
    height: '25%',
    borderWidth: 1,
    borderColor: '#60A5FA',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  placeholderIcon: {
    fontSize: 80,
    marginBottom: 24,
  },
  placeholderTitle: {
    color: '#60A5FA',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    textShadowColor: '#60A5FA',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  placeholderText: {
    color: '#94A3B8',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default SafeMapView;
