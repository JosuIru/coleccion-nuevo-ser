import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  PermissionsAndroid,
  Platform,
  Alert,
  Linking
} from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import { useTrascendenciaStore } from '../stores/trascendenciaStore';
import useGameStore from '../../stores/gameStore';
import trascendenciaAIService from '../services/TrascendenciaAIService';
import { getExcerptForMission } from '../data/bookExcerpts';

export default function MissionScreen() {
  const { missions, activeMissionId, addCheckin, selectedBeingId, bumpMissionStreak, planId } = useTrascendenciaStore();
  const { addXP, addBeingXP, setUserLocation, updateBeing } = useGameStore();
  const mission = missions.find(m => m.id === activeMissionId) || missions[0];
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [showFull, setShowFull] = useState(false);
  const excerpt = useMemo(() => getExcerptForMission(mission.id, planId), [mission.id, planId]);
  const excerptKey = `${excerpt.bookId || ''}-${excerpt.chapterId || ''}-${excerpt.text || ''}`;
  const [suggestion, setSuggestion] = useState(() =>
    trascendenciaAIService.getFallbackSuggestion({ planId, type: 'mission', excerpt })
  );

  useEffect(() => {
    let active = true;
    const fallback = trascendenciaAIService.getFallbackSuggestion({ planId, type: 'mission', excerpt });
    setSuggestion(fallback);

    (async () => {
      const response = await trascendenciaAIService.getSuggestion({ planId, type: 'mission', excerpt, mission });
      if (active) {
        setSuggestion(response);
      }
    })();

    return () => {
      active = false;
    };
  }, [planId, mission.id, excerptKey]);

  const requestLocationPermission = async () => {
    if (Platform.OS !== 'android') {
      return true;
    }

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Permiso de Ubicacion',
          message: 'Trascendencia necesita acceso a tu ubicacion para validar misiones.',
          buttonNeutral: 'Preguntar despues',
          buttonNegative: 'Cancelar',
          buttonPositive: 'OK'
        }
      );

      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (error) {
      return false;
    }
  };

  const resolveLocation = async () => new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      (position) => resolve(position),
      (error) => reject(error),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  });

  const finalizeCheckin = (payload) => {
    addCheckin(payload);
    bumpMissionStreak();

    addXP(mission.baseXp || 0);
    if (selectedBeingId) {
      addBeingXP(selectedBeingId, Math.max(10, Math.floor((mission.baseXp || 0) / 2)));
      const being = useGameStore.getState().beings.find(b => b.id === selectedBeingId);
      const prevStats = being?.trascendenciaStats || {};
      updateBeing(selectedBeingId, {
        lastTrascendenciaCheckinAt: payload.createdAt,
        trascendenciaStats: {
          ...prevStats,
          missionsCompleted: (prevStats.missionsCompleted || 0) + 1,
          lastMissionId: payload.missionId
        }
      });
    }

    setNote('');
    Alert.alert('Check-in registrado', 'Tu mision ha sido registrada.');
  };

  const handleCheckin = async () => {
    if (loading) return;
    setLoading(true);

    const basePayload = {
      id: `${mission.id}_${Date.now()}`,
      missionId: mission.id,
      type: mission.checkin,
      note: note.trim() || 'Check-in registrado',
      createdAt: new Date().toISOString()
    };

    if (mission.checkin === 'manual') {
      finalizeCheckin(basePayload);
      setLoading(false);
      return;
    }

    try {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        Alert.alert(
          'Permiso denegado',
          'No se pudo validar el GPS. Puedes registrar manualmente.',
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Registrar manual',
              onPress: () => finalizeCheckin({ ...basePayload, type: 'manual' })
            }
          ]
        );
        setLoading(false);
        return;
      }

      const position = await resolveLocation();
      const coords = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      };

      setUserLocation({
        ...coords,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01
      });

      finalizeCheckin({
        ...basePayload,
        location: coords,
        accuracy: position.coords.accuracy || null
      });
    } catch (error) {
      Alert.alert(
        'GPS no disponible',
        'No se pudo obtener la ubicacion. Puedes registrar manualmente.',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Registrar manual',
            onPress: () => finalizeCheckin({ ...basePayload, type: 'manual' })
          }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mision</Text>
      <Text style={styles.missionTitle}>{mission.title}</Text>
      <Text style={styles.description}>{mission.description}</Text>

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>Check-in: {mission.checkin.toUpperCase()}</Text>
        <Text style={styles.infoText}>XP base: {mission.baseXp}</Text>
      </View>

      <View style={styles.excerptBox}>
        <Text style={styles.excerptSource}>{excerpt.source}</Text>
        <Text style={styles.excerptChapter}>{excerpt.chapterTitle || 'Capitulo'}</Text>
        <Text style={styles.excerptText}>
          {showFull ? (excerpt.fullText || excerpt.text) : excerpt.text}
        </Text>
        <View style={styles.excerptActions}>
          <TouchableOpacity onPress={() => setShowFull(!showFull)}>
            <Text style={styles.excerptToggle}>{showFull ? 'Ver menos' : 'Ver mas'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => Linking.openURL(`nuevosser://book/${excerpt.bookId}?chapter=${encodeURIComponent(excerpt.chapterId || '')}`)}
          >
            <Text style={styles.excerptToggle}>Abrir libro</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.hintBox}>
        <Text style={styles.hintText}>IA: {suggestion}</Text>
      </View>

      <TextInput
        value={note}
        onChangeText={setNote}
        placeholder="Breve nota o evidencia"
        placeholderTextColor="#6b7f6b"
        style={styles.input}
      />

      <TouchableOpacity style={styles.cta} onPress={handleCheckin} disabled={loading}>
        <Text style={styles.ctaText}>{loading ? 'Registrando...' : 'Registrar check-in'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b1210',
    padding: 24
  },
  title: {
    color: '#e2fbe2',
    fontSize: 24,
    fontWeight: '700'
  },
  missionTitle: {
    color: '#d5f0d5',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16
  },
  description: {
    color: '#aac6aa',
    marginTop: 8
  },
  infoBox: {
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#122018',
    borderWidth: 1,
    borderColor: '#1e3a2a'
  },
  infoText: {
    color: '#9bd0a9'
  },
  hintBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#0f1c16',
    borderWidth: 1,
    borderColor: '#1f2f26'
  },
  hintText: {
    color: '#8fd3a4'
  },
  excerptBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#122018',
    borderWidth: 1,
    borderColor: '#1e3a2a'
  },
  excerptSource: {
    color: '#9bb79b',
    fontSize: 12
  },
  excerptChapter: {
    color: '#7f9c7f',
    fontSize: 12,
    marginTop: 2
  },
  excerptText: {
    color: '#d5f0d5',
    marginTop: 6
  },
  excerptActions: {
    flexDirection: 'row'
  },
  excerptToggle: {
    color: '#8fd3a4',
    marginTop: 8,
    fontSize: 12,
    marginRight: 12
  },
  input: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#1e3a2a',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#e2fbe2',
    backgroundColor: '#0f1a14'
  },
  cta: {
    marginTop: 20,
    backgroundColor: '#1f6b49',
    paddingVertical: 12,
    borderRadius: 10
  },
  ctaText: {
    color: '#ecffec',
    textAlign: 'center',
    fontWeight: '600'
  }
});
