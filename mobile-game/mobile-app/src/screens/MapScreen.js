/**
 * MAP SCREEN - Pantalla principal del juego
 * Mapa interactivo con fractales, crisis y seres
 *
 * @version 1.1.0
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Animated,
  Platform,
  PermissionsAndroid,
  Alert
} from 'react-native';
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import Geolocation from 'react-native-geolocation-service';
import useGameStore from '../stores/gameStore';
import logger from '../utils/logger';
import {
  MAP_CONFIG,
  COLORS,
  FRACTAL_TYPES,
  RESOURCES
} from '../config/constants';

const MapScreen = ({ navigation }) => {
  // ═══════════════════════════════════════════════════════════
  // ESTADO
  // ═══════════════════════════════════════════════════════════

  const mapRef = useRef(null);
  const watchIdRef = useRef(null); // Para cleanup del watchPosition
  const animationRef = useRef(null); // Para cleanup de animaciones
  const [region, setRegion] = useState(MAP_CONFIG.DEFAULT_REGION);
  const [following, setFollowing] = useState(true);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);

  // Zustand store
  const {
    user,
    userLocation,
    setUserLocation,
    nearbyFractals,
    setNearbyFractals,
    crises,
    beings,
    addEnergy,
    addConsciousness,
    consumeEnergy,
    collectFractal
  } = useGameStore();

  // Animaciones
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // ═══════════════════════════════════════════════════════════
  // PERMISOS DE UBICACIÓN
  // ═══════════════════════════════════════════════════════════

  useEffect(() => {
    requestLocationPermission();

    // Cleanup al desmontar
    return () => {
      logger.info('🧹 Cleaning up MapScreen...', '');

      // Limpiar watch position
      if (watchIdRef.current !== null) {
        Geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }

      // Detener animaciones
      if (animationRef.current) {
        animationRef.current.stop();
        animationRef.current = null;
      }
    };
  }, []);

  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Permiso de Ubicación',
            message: 'Awakening Protocol necesita acceso a tu ubicación para encontrar fractales cercanos.',
            buttonNeutral: 'Preguntar después',
            buttonNegative: 'Cancelar',
            buttonPositive: 'OK',
          }
        );

        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          logger.info('✅ Permiso de ubicación concedido', '');
          setHasLocationPermission(true);
          startLocationTracking();
        } else {
          logger.info('❌ Permiso de ubicación denegado', '');
          setHasLocationPermission(false);
          handleLocationPermissionDenied();
        }
      } catch (err) {
        logger.error('Error requesting location permission:', err);
        setHasLocationPermission(false);
      }
    } else {
      // iOS
      setHasLocationPermission(true);
      startLocationTracking();
    }
  };

  const handleLocationPermissionDenied = () => {
    Alert.alert(
      'Permiso Denegado',
      'La ubicación es necesaria para encontrar fractales cercanos. Puedes activarlo en Configuración.',
      [
        { text: 'OK', style: 'default' }
      ]
    );
  };

  // ═══════════════════════════════════════════════════════════
  // TRACKING DE UBICACIÓN
  // ═══════════════════════════════════════════════════════════

  const startLocationTracking = () => {
    // Limpiar watch anterior si existe
    if (watchIdRef.current !== null) {
      Geolocation.clearWatch(watchIdRef.current);
    }

    // Obtener ubicación inicial
    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        const newLocation = {
          latitude,
          longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01
        };

        setUserLocation(newLocation);
        setRegion(newLocation);

        // Generar fractales cercanos
        generateNearbyFractals(latitude, longitude);
      },
      (error) => {
        logger.error('Error obteniendo ubicación:', error);
        Alert.alert(
          'Error de Ubicación',
          'No se pudo obtener tu ubicación. Verifica que el GPS esté activado.',
          [{ text: 'OK' }]
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );

    // Actualizar ubicación periódicamente
    watchIdRef.current = Geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        const newLocation = {
          latitude,
          longitude,
          latitudeDelta: region.latitudeDelta,
          longitudeDelta: region.longitudeDelta
        };

        setUserLocation(newLocation);

        if (following) {
          setRegion(newLocation);
          mapRef.current?.animateToRegion(newLocation, 1000);
        }

        // Verificar fractales cercanos
        checkNearbyFractals(latitude, longitude);
      },
      (error) => {
        logger.error('Error tracking ubicación:', error.code, error.message);
      },
      {
        enableHighAccuracy: true,
        distanceFilter: 10, // Actualizar cada 10 metros
        interval: 10000, // Cada 10 segundos
        fastestInterval: 5000
      }
    );
  };

  // ═══════════════════════════════════════════════════════════
  // GENERACIÓN DE FRACTALES
  // ═══════════════════════════════════════════════════════════

  const generateNearbyFractals = (centerLat, centerLon) => {
    const fractals = [];
    const radiusKm = MAP_CONFIG.FRACTAL_SPAWN_RADIUS / 1000;

    // Generar 5-10 fractales aleatorios alrededor del usuario
    const count = Math.floor(Math.random() * 6) + 5;

    for (let i = 0; i < count; i++) {
      // Posición aleatoria dentro del radio
      const angle = Math.random() * 2 * Math.PI;
      const distance = Math.random() * radiusKm;

      const deltaLat = (distance / 111) * Math.cos(angle);
      const deltaLon = (distance / (111 * Math.cos(centerLat * Math.PI / 180))) * Math.sin(angle);

      const lat = centerLat + deltaLat;
      const lon = centerLon + deltaLon;

      // Tipo aleatorio de fractal
      const types = Object.keys(FRACTAL_TYPES);
      const randomType = types[Math.floor(Math.random() * types.length)];
      const fractalConfig = FRACTAL_TYPES[randomType];

      fractals.push({
        id: `fractal_${Date.now()}_${i}`,
        type: randomType,
        latitude: lat,
        longitude: lon,
        config: fractalConfig,
        active: true,
        cooldownUntil: null
      });
    }

    setNearbyFractals(fractals);
    logger.info("`✨ Generados ${fractals.length} fractales cercanos`", "");
  };

  // ═══════════════════════════════════════════════════════════
  // INTERACCIÓN CON FRACTALES
  // ═══════════════════════════════════════════════════════════

  const checkNearbyFractals = (userLat, userLon) => {
    nearbyFractals.forEach(fractal => {
      if (!fractal.active) return;

      const distance = calculateDistance(
        userLat,
        userLon,
        fractal.latitude,
        fractal.longitude
      );

      // Si está dentro del radio de activación (50m)
      if (distance <= MAP_CONFIG.FRACTAL_ACTIVATION_RADIUS) {
        logger.info("`✨ Fractal activado: ${fractal.type}`", "");
        // Mostrar notificación/modal para recolectar
      }
    });
  };

  const onFractalPress = useCallback((fractal) => {
    if (!fractal || !fractal.active) {
      return;
    }

    if (!userLocation) {
      Alert.alert('Error', 'No se pudo obtener tu ubicación');
      return;
    }

    const distance = calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      fractal.latitude,
      fractal.longitude
    );

    if (distance > MAP_CONFIG.FRACTAL_ACTIVATION_RADIUS) {
      Alert.alert(
        'Demasiado Lejos',
        `Debes estar a menos de ${MAP_CONFIG.FRACTAL_ACTIVATION_RADIUS}m para recolectar este fractal`
      );
      return;
    }

    // Recolectar fractal
    const rewards = fractal.config?.rewards || {};

    collectFractal(fractal.id, rewards);

    // Mostrar recompensas
    Alert.alert(
      '¡Fractal Recolectado!',
      `+${rewards.consciousness || 0} Consciencia\n+${rewards.energy || 0} Energía`,
      [{ text: 'Genial!', style: 'default' }]
    );

    console.log(`✅ Fractal ${fractal.type} recolectado:`, rewards);
  }, [userLocation, collectFractal]);

  // ═══════════════════════════════════════════════════════════
  // UTILIDADES
  // ═══════════════════════════════════════════════════════════

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    // Fórmula de Haversine (metros)
    const R = 6371e3; // Radio de la Tierra en metros
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distancia en metros
  };

  const centerOnUser = () => {
    if (userLocation) {
      setFollowing(true);
      mapRef.current?.animateToRegion(userLocation, 1000);
    }
  };

  // ═══════════════════════════════════════════════════════════
  // ANIMACIÓN DE PULSO
  // ═══════════════════════════════════════════════════════════

  useEffect(() => {
    animationRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 1000,
          useNativeDriver: true
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true
        })
      ])
    );

    animationRef.current.start();

    return () => {
      if (animationRef.current) {
        animationRef.current.stop();
      }
    };
  }, [pulseAnim]);

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════

  return (
    <View style={styles.container}>
      {/* MAPA */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={region}
        onRegionChangeComplete={(newRegion) => {
          setRegion(newRegion);
          setFollowing(false);
        }}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={true}
        customMapStyle={darkMapStyle}
      >
        {/* Marcadores de fractales */}
        {nearbyFractals.map(fractal => (
          <Marker
            key={fractal.id}
            coordinate={{
              latitude: fractal.latitude,
              longitude: fractal.longitude
            }}
            onPress={() => onFractalPress(fractal)}
          >
            <Animated.View style={[
              styles.fractalMarker,
              { transform: [{ scale: pulseAnim }] },
              { backgroundColor: fractal.config.color }
            ]}>
              <Text style={styles.fractalIcon}>{fractal.config.icon}</Text>
            </Animated.View>
          </Marker>
        ))}

        {/* Marcadores de crisis */}
        {crises.map(crisis => (
          <Marker
            key={crisis.id}
            coordinate={{
              latitude: crisis.lat,
              longitude: crisis.lon
            }}
            onPress={() => navigation.navigate('CrisisDetail', { crisis })}
          >
            <View style={styles.crisisMarker}>
              <Text style={styles.crisisIcon}>🔥</Text>
            </View>
          </Marker>
        ))}

        {/* Círculo de rango de detección */}
        {userLocation && (
          <Circle
            center={userLocation}
            radius={MAP_CONFIG.FRACTAL_ACTIVATION_RADIUS}
            strokeColor="rgba(96, 165, 250, 0.5)"
            fillColor="rgba(96, 165, 250, 0.1)"
          />
        )}
      </MapView>

      {/* HUD SUPERIOR - Recursos */}
      <View style={styles.topHUD}>
        <View style={styles.resourceContainer}>
          <Text style={styles.resourceIcon}>⚡</Text>
          <Text style={styles.resourceText}>{user.energy}/{user.maxEnergy}</Text>
        </View>

        <View style={styles.resourceContainer}>
          <Text style={styles.resourceIcon}>🌟</Text>
          <Text style={styles.resourceText}>{user.consciousnessPoints}</Text>
        </View>

        <View style={styles.resourceContainer}>
          <Text style={styles.resourceIcon}>⭐</Text>
          <Text style={styles.resourceText}>Nv.{user.level}</Text>
        </View>
      </View>

      {/* BOTÓN DE CENTRAR */}
      <TouchableOpacity
        style={styles.centerButton}
        onPress={centerOnUser}
      >
        <Text style={styles.centerIcon}>📍</Text>
      </TouchableOpacity>

      {/* BOTÓN DE SERES */}
      <TouchableOpacity
        style={styles.beingsButton}
        onPress={() => navigation.navigate('Beings')}
      >
        <Text style={styles.beingsIcon}>🧬</Text>
        <Text style={styles.beingsCount}>{beings.length}/{user.maxBeings}</Text>
      </TouchableOpacity>
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

  map: {
    flex: 1
  },

  // HUD Superior
  topHUD: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between'
  },

  resourceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bg.elevated,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.accent.primary + '40'
  },

  resourceIcon: {
    fontSize: 18,
    marginRight: 6
  },

  resourceText: {
    color: COLORS.text.primary,
    fontSize: 14,
    fontWeight: '600'
  },

  // Marcadores
  fractalMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5
  },

  fractalIcon: {
    fontSize: 20
  },

  crisisMarker: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.accent.critical,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5
  },

  crisisIcon: {
    fontSize: 24
  },

  // Botones
  centerButton: {
    position: 'absolute',
    right: 16,
    bottom: 100,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.bg.elevated,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5
  },

  centerIcon: {
    fontSize: 24
  },

  beingsButton: {
    position: 'absolute',
    right: 16,
    bottom: 160,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.accent.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5
  },

  beingsIcon: {
    fontSize: 28
  },

  beingsCount: {
    color: COLORS.text.primary,
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2
  }
});

// Estilo oscuro del mapa (Google Maps)
const darkMapStyle = [
  {
    "elementType": "geometry",
    "stylers": [{ "color": "#212121" }]
  },
  {
    "elementType": "labels.icon",
    "stylers": [{ "visibility": "off" }]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#757575" }]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [{ "color": "#212121" }]
  },
  {
    "featureType": "road",
    "elementType": "geometry",
    "stylers": [{ "color": "#2c2c2c" }]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [{ "color": "#000000" }]
  }
];

export default MapScreen;
