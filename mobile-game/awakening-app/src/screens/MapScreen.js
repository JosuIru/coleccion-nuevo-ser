/**
 * MAP SCREEN - Pantalla principal del juego
 * Mapa interactivo con fractales, crisis y seres
 *
 * @version 2.0.0 - Graphics Enhanced
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
  Alert,
  Dimensions
} from 'react-native';
import { SafeMapView as MapView, Marker, Circle } from '../components/SafeMapView';
import Geolocation from 'react-native-geolocation-service';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import useGameStore from '../stores/gameStore';
import logger from '../utils/logger';
import {
  MAP_CONFIG,
  COLORS,
  FRACTAL_TYPES,
  RESOURCES
} from '../config/constants';

// New enhanced components
import DeployedBeingsOverlay from '../components/DeployedBeingsOverlay';
import { AnimatedBeingMarker, RippleEffect, GlowAura } from '../components/effects';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
    logger.info(`✨ Generados ${fractals.length} fractales cercanos`, '');
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
        logger.info(`✨ Fractal activado: ${fractal.type}`, '');
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

    logger.info(`✅ Fractal ${fractal.type} recolectado con ${rewards.consciousness || 0} consciencia`, '');
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
  // SERES DESPLEGADOS
  // ═══════════════════════════════════════════════════════════

  const deployedBeings = useMemo(() =>
    beings.filter(b => b.status === 'deployed'),
    [beings]
  );

  const handleDeployedBeingSelect = useCallback((being) => {
    // Centrar mapa en la ubicación del ser si tiene coordenadas
    if (being.missionCoords && mapRef.current) {
      mapRef.current.animateToRegion({
        ...being.missionCoords,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01
      }, 1000);
    }
  }, []);

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════

  return (
    <View style={styles.container}>
      {/* MAPA */}
      <MapView
        ref={mapRef}
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
        {/* Marcadores de fractales mejorados */}
        {nearbyFractals.map(fractal => (
          <Marker
            key={fractal.id}
            coordinate={{
              latitude: fractal.latitude,
              longitude: fractal.longitude
            }}
            onPress={() => onFractalPress(fractal)}
          >
            <View style={styles.fractalMarkerContainer}>
              {/* Aura de brillo */}
              <Animated.View style={[
                styles.fractalGlow,
                {
                  backgroundColor: fractal.config.color,
                  opacity: pulseAnim.interpolate({
                    inputRange: [1, 1.3],
                    outputRange: [0.2, 0.5]
                  }),
                  transform: [{ scale: pulseAnim }]
                }
              ]} />
              {/* Marcador principal */}
              <Animated.View style={[
                styles.fractalMarker,
                { transform: [{ scale: pulseAnim }] },
                { backgroundColor: fractal.config.color }
              ]}>
                <Text style={styles.fractalIcon}>{fractal.config.icon}</Text>
              </Animated.View>
            </View>
          </Marker>
        ))}

        {/* Marcadores de crisis mejorados */}
        {crises.map(crisis => (
          <Marker
            key={crisis.id}
            coordinate={{
              latitude: crisis.lat,
              longitude: crisis.lon
            }}
            onPress={() => navigation.navigate('CrisisDetail', { crisis })}
          >
            <View style={styles.crisisMarkerContainer}>
              {/* Ondas de urgencia */}
              <Animated.View style={[
                styles.crisisRipple,
                {
                  transform: [{ scale: pulseAnim }],
                  opacity: pulseAnim.interpolate({
                    inputRange: [1, 1.3],
                    outputRange: [0.6, 0]
                  })
                }
              ]} />
              <View style={styles.crisisMarker}>
                <Text style={styles.crisisIcon}>🔥</Text>
              </View>
              {/* Badge de urgencia */}
              <View style={styles.urgencyBadge}>
                <Text style={styles.urgencyText}>{crisis.urgency || '!'}</Text>
              </View>
            </View>
          </Marker>
        ))}

        {/* Marcadores de seres desplegados en el mapa */}
        {deployedBeings.map(being => being.missionCoords && (
          <Marker
            key={`deployed_${being.id}`}
            coordinate={being.missionCoords}
            onPress={() => handleDeployedBeingSelect(being)}
          >
            <View style={styles.deployedBeingMarker}>
              <View style={styles.deployedBeingGlow} />
              <View style={styles.deployedBeingAvatar}>
                <Text style={styles.deployedBeingIcon}>{being.avatar || '🧬'}</Text>
              </View>
              <View style={styles.deployedBeingStatus}>
                <Icon name="sword-cross" size={10} color="#fff" />
              </View>
            </View>
          </Marker>
        ))}

        {/* Círculo de rango de detección mejorado */}
        {userLocation && (
          <>
            <Circle
              center={userLocation}
              radius={MAP_CONFIG.FRACTAL_ACTIVATION_RADIUS}
              strokeColor="rgba(96, 165, 250, 0.6)"
              strokeWidth={2}
              fillColor="rgba(96, 165, 250, 0.08)"
            />
            <Circle
              center={userLocation}
              radius={MAP_CONFIG.FRACTAL_ACTIVATION_RADIUS * 0.5}
              strokeColor="rgba(96, 165, 250, 0.3)"
              strokeWidth={1}
              fillColor="transparent"
            />
          </>
        )}
      </MapView>

      {/* HUD SUPERIOR - Recursos mejorado */}
      <View style={styles.topHUD}>
        <TouchableOpacity style={styles.resourceContainer} activeOpacity={0.8}>
          <View style={styles.resourceIconContainer}>
            <Text style={styles.resourceIcon}>⚡</Text>
          </View>
          <View style={styles.resourceInfo}>
            <Text style={styles.resourceLabel}>Energía</Text>
            <Text style={styles.resourceText}>{user.energy}/{user.maxEnergy}</Text>
          </View>
          {/* Barra de energía */}
          <View style={styles.miniBar}>
            <View
              style={[
                styles.miniBarFill,
                { width: `${(user.energy / user.maxEnergy) * 100}%`, backgroundColor: '#fbbf24' }
              ]}
            />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.resourceContainer} activeOpacity={0.8}>
          <View style={styles.resourceIconContainer}>
            <Text style={styles.resourceIcon}>🌟</Text>
          </View>
          <View style={styles.resourceInfo}>
            <Text style={styles.resourceLabel}>Consciencia</Text>
            <Text style={styles.resourceText}>{user.consciousnessPoints}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.levelContainer} activeOpacity={0.8}>
          <View style={styles.levelCircle}>
            <Text style={styles.levelNumber}>{user.level}</Text>
          </View>
          <Text style={styles.levelLabel}>Nivel</Text>
        </TouchableOpacity>
      </View>

      {/* OVERLAY DE SERES DESPLEGADOS */}
      <DeployedBeingsOverlay
        onBeingSelect={handleDeployedBeingSelect}
        visible={deployedBeings.length > 0}
      />

      {/* BOTÓN DE CENTRAR */}
      <TouchableOpacity
        style={styles.centerButton}
        onPress={centerOnUser}
        activeOpacity={0.8}
      >
        <Icon name="crosshairs-gps" size={24} color={COLORS.text.primary} />
      </TouchableOpacity>

      {/* BOTÓN DE SERES */}
      <TouchableOpacity
        style={styles.beingsButton}
        onPress={() => navigation.navigate('Beings')}
        activeOpacity={0.8}
      >
        <Text style={styles.beingsIcon}>🧬</Text>
        <View style={styles.beingsCountBadge}>
          <Text style={styles.beingsCount}>{beings.length}</Text>
        </View>
      </TouchableOpacity>

      {/* BOTÓN DE COMMAND CENTER */}
      <TouchableOpacity
        style={styles.commandButton}
        onPress={() => navigation.navigate('Command')}
        activeOpacity={0.8}
      >
        <Icon name="earth" size={28} color="#fff" />
        {deployedBeings.length > 0 && (
          <View style={styles.deployedCountBadge}>
            <Text style={styles.deployedCount}>{deployedBeings.length}</Text>
          </View>
        )}
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

  // HUD Superior Mejorado
  topHUD: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8
  },

  resourceContainer: {
    flex: 1,
    backgroundColor: COLORS.bg.elevated + 'E0',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.accent.primary + '30'
  },

  resourceIconContainer: {
    position: 'absolute',
    left: 8,
    top: 8
  },

  resourceIcon: {
    fontSize: 16
  },

  resourceInfo: {
    marginLeft: 24
  },

  resourceLabel: {
    fontSize: 9,
    color: COLORS.text.dim,
    fontWeight: '500'
  },

  resourceText: {
    color: COLORS.text.primary,
    fontSize: 13,
    fontWeight: '700'
  },

  miniBar: {
    height: 3,
    backgroundColor: COLORS.bg.primary,
    borderRadius: 2,
    marginTop: 4,
    overflow: 'hidden'
  },

  miniBarFill: {
    height: '100%',
    borderRadius: 2
  },

  levelContainer: {
    backgroundColor: COLORS.accent.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },

  levelCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center'
  },

  levelNumber: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fff'
  },

  levelLabel: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2
  },

  // Marcadores mejorados - Fractales
  fractalMarkerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    height: 60
  },

  fractalGlow: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25
  },

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

  // Marcadores mejorados - Crisis
  crisisMarkerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 70,
    height: 70
  },

  crisisRipple: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: COLORS.accent.critical
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

  urgencyBadge: {
    position: 'absolute',
    top: 0,
    right: 5,
    backgroundColor: '#fff',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },

  urgencyText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.accent.critical
  },

  // Marcadores de seres desplegados
  deployedBeingMarker: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
    height: 50
  },

  deployedBeingGlow: {
    position: 'absolute',
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: COLORS.accent.primary,
    opacity: 0.3
  },

  deployedBeingAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.bg.elevated,
    borderWidth: 2,
    borderColor: COLORS.accent.primary,
    alignItems: 'center',
    justifyContent: 'center'
  },

  deployedBeingIcon: {
    fontSize: 18
  },

  deployedBeingStatus: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.accent.critical,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff'
  },

  // Botones mejorados
  centerButton: {
    position: 'absolute',
    right: 16,
    bottom: 100,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.bg.elevated,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1,
    borderColor: COLORS.accent.primary + '30'
  },

  beingsButton: {
    position: 'absolute',
    right: 16,
    bottom: 160,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.accent.wisdom,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.accent.wisdom,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8
  },

  beingsIcon: {
    fontSize: 26
  },

  beingsCountBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: COLORS.accent.critical,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff'
  },

  beingsCount: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700'
  },

  commandButton: {
    position: 'absolute',
    right: 16,
    bottom: 230,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.accent.success,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.accent.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8
  },

  deployedCountBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: COLORS.accent.critical,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff'
  },

  deployedCount: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700'
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
