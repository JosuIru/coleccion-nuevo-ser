/**
 * EJEMPLO DE USO DEL MISSION SERVICE
 * Pantalla para desplegar seres a una crisis
 *
 * Este archivo es solo de referencia, muestra cómo usar MissionService
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator
} from 'react-native';
import useGameStore from '../stores/gameStore';
import MissionService from '../services/MissionService';
import logger from '../utils/logger';

function DeployMissionScreen({ route, navigation }) {
  const { crisis } = route.params;

  const gameStore = useGameStore();
  const { beings, user } = useGameStore();

  const [seresSeleccionados, setSeresSeleccionados] = useState([]);
  const [probabilidad, setProbabilidad] = useState(null);
  const [desplegando, setDesplegando] = useState(false);

  // Filtrar seres disponibles
  const seresDisponibles = beings.filter(ser =>
    ser.status === 'available' && (ser.energy || 100) >= 30
  );

  // Calcular probabilidad cada vez que cambia la selección
  useEffect(() => {
    if (seresSeleccionados.length > 0) {
      calcularProbabilidadPrevia();
    } else {
      setProbabilidad(null);
    }
  }, [seresSeleccionados]);

  /**
   * Calcular probabilidad antes de desplegar (preview)
   */
  const calcularProbabilidadPrevia = () => {
    const seres = beings.filter(b => seresSeleccionados.includes(b.id));

    const resultado = MissionService.calcularProbabilidadExito(
      crisis.required_attributes || crisis.requiredAttributes,
      seres,
      crisis.crisis_type || crisis.type,
      crisis.scale
    );

    setProbabilidad(resultado);
  };

  /**
   * Toggle selección de ser
   */
  const toggleSer = (serId) => {
    setSeresSeleccionados(prev => {
      if (prev.includes(serId)) {
        return prev.filter(id => id !== serId);
      } else {
        return [...prev, serId];
      }
    });
  };

  /**
   * Desplegar seres a la crisis
   */
  const handleDesplegar = async () => {
    if (seresSeleccionados.length === 0) {
      Alert.alert('Error', 'Debes seleccionar al menos un ser');
      return;
    }

    setDesplegando(true);

    try {
      const resultado = await MissionService.desplegarSeres(
        user.id,
        crisis.id,
        seresSeleccionados,
        gameStore
      );

      if (resultado.exito) {
        // Mostrar resumen
        Alert.alert(
          '✅ ¡Misión Iniciada!',
          `Probabilidad de éxito: ${(resultado.probabilidad.probabilidad * 100).toFixed(1)}%\n` +
          `Duración estimada: ${resultado.tiempoMinutos} minutos\n\n` +
          `Tus seres están en camino...`,
          [
            {
              text: 'Ver Misiones Activas',
              onPress: () => navigation.navigate('ActiveMissions')
            },
            {
              text: 'OK',
              style: 'cancel'
            }
          ]
        );
      } else {
        Alert.alert('Error', resultado.error);
      }

    } catch (error) {
      Alert.alert('Error', 'Hubo un problema al desplegar los seres');
      console.error(error);
    } finally {
      setDesplegando(false);
    }
  };

  /**
   * Renderizar card de ser
   */
  const renderSerCard = (ser) => {
    const seleccionado = seresSeleccionados.includes(ser.id);
    const energia = ser.energy || 100;
    const energiaBaja = energia < 30;

    return (
      <TouchableOpacity
        key={ser.id}
        style={[
          styles.serCard,
          seleccionado && styles.serCardSeleccionado,
          energiaBaja && styles.serCardDisabled
        ]}
        onPress={() => !energiaBaja && toggleSer(ser.id)}
        disabled={energiaBaja}
      >
        <View style={styles.serHeader}>
          <Text style={styles.serName}>{ser.name}</Text>
          <Text style={styles.serEnergia}>⚡ {energia}%</Text>
        </View>

        <View style={styles.atributos}>
          {Object.entries(ser.attributes || {}).map(([attr, valor]) => (
            <View key={attr} style={styles.atributo}>
              <Text style={styles.atributoNombre}>{attr}</Text>
              <Text style={styles.atributoValor}>{valor}</Text>
            </View>
          ))}
        </View>

        {energiaBaja && (
          <Text style={styles.energiaBajaTexto}>
            💤 Descansando (energía muy baja)
          </Text>
        )}

        {seleccionado && (
          <View style={styles.checkmark}>
            <Text style={styles.checkmarkIcon}>✓</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  /**
   * Renderizar panel de probabilidad
   */
  const renderProbabilidadPanel = () => {
    if (!probabilidad) return null;

    const prob = probabilidad.probabilidad * 100;
    const color = prob >= 70 ? '#34d399' : prob >= 40 ? '#fbbf24' : '#ef4444';

    return (
      <View style={styles.probabilidadPanel}>
        <Text style={styles.probabilidadTitulo}>Probabilidad de Éxito</Text>

        <View style={styles.probabilidadValor}>
          <Text style={[styles.probabilidadPorcentaje, { color }]}>
            {prob.toFixed(1)}%
          </Text>
        </View>

        {/* Desglose */}
        <View style={styles.desglose}>
          {Object.entries(probabilidad.desglose || {}).map(([key, value]) => (
            <View key={key} style={styles.desgloseItem}>
              <Text style={styles.desgloseKey}>{key}</Text>
              <Text style={styles.desgloseValue}>{value}</Text>
            </View>
          ))}
        </View>

        {/* Sinergias detectadas */}
        {probabilidad.sinergias && probabilidad.sinergias.length > 0 && (
          <View style={styles.sinergias}>
            <Text style={styles.sinergiasTitle}>✨ Sinergias Detectadas:</Text>
            {probabilidad.sinergias.map((sinergia, idx) => (
              <Text key={idx} style={styles.sinergiaItem}>
                • {sinergia.name} (+{(sinergia.bonus * 100).toFixed(0)}%)
              </Text>
            ))}
          </View>
        )}
      </View>
    );
  };

  /**
   * Calcular costo de energía
   */
  const costoEnergia = seresSeleccionados.length * 10;
  const tieneEnergía = user.energy >= costoEnergia;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.titulo}>Desplegar Seres</Text>
        <Text style={styles.crisisNombre}>{crisis.title}</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Información de la Crisis */}
        <View style={styles.crisisInfo}>
          <Text style={styles.sectionTitle}>Crisis</Text>
          <Text style={styles.crisisDescripcion}>{crisis.description}</Text>

          <View style={styles.crisisStats}>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Tipo</Text>
              <Text style={styles.statValue}>{crisis.crisis_type || crisis.type}</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Urgencia</Text>
              <Text style={styles.statValue}>{crisis.urgency}/10</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Escala</Text>
              <Text style={styles.statValue}>{crisis.scale}</Text>
            </View>
          </View>

          {/* Atributos requeridos */}
          <Text style={styles.sectionTitle}>Atributos Requeridos</Text>
          <View style={styles.atributosRequeridos}>
            {Object.entries(crisis.required_attributes || {}).map(([attr, valor]) => (
              <View key={attr} style={styles.atributoRequerido}>
                <Text style={styles.atributoNombre}>{attr}</Text>
                <Text style={styles.atributoValor}>{valor}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Panel de Probabilidad */}
        {renderProbabilidadPanel()}

        {/* Seres Disponibles */}
        <View style={styles.seresSection}>
          <Text style={styles.sectionTitle}>
            Seres Disponibles ({seresDisponibles.length})
          </Text>
          <Text style={styles.sectionSubtitle}>
            Selecciona los seres que deseas desplegar
          </Text>

          {seresDisponibles.length === 0 ? (
            <Text style={styles.noSeresTexto}>
              No hay seres disponibles en este momento
            </Text>
          ) : (
            seresDisponibles.map(ser => renderSerCard(ser))
          )}
        </View>
      </ScrollView>

      {/* Footer con botón de acción */}
      <View style={styles.footer}>
        <View style={styles.footerInfo}>
          <Text style={styles.footerTexto}>
            Seres seleccionados: {seresSeleccionados.length}
          </Text>
          <Text style={[
            styles.footerTexto,
            !tieneEnergía && styles.footerTextoError
          ]}>
            Costo de energía: {costoEnergia} ⚡
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.botonDesplegar,
            (seresSeleccionados.length === 0 || !tieneEnergía || desplegando) &&
              styles.botonDesplegarDisabled
          ]}
          onPress={handleDesplegar}
          disabled={seresSeleccionados.length === 0 || !tieneEnergía || desplegando}
        >
          {desplegando ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.botonTexto}>
              🚀 Desplegar Seres
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0e14'
  },
  header: {
    padding: 20,
    backgroundColor: '#151a24',
    borderBottomWidth: 1,
    borderBottomColor: '#1e2530'
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f1f5f9',
    marginBottom: 8
  },
  crisisNombre: {
    fontSize: 16,
    color: '#94a3b8'
  },
  scrollView: {
    flex: 1
  },
  crisisInfo: {
    padding: 20,
    backgroundColor: '#151a24',
    marginBottom: 10
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f1f5f9',
    marginBottom: 12,
    marginTop: 16
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16
  },
  crisisDescripcion: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 20
  },
  crisisStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#1e2530'
  },
  stat: {
    alignItems: 'center'
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#60a5fa'
  },
  atributosRequeridos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  atributoRequerido: {
    backgroundColor: '#1e2530',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8
  },
  probabilidadPanel: {
    backgroundColor: '#151a24',
    padding: 20,
    marginBottom: 10
  },
  probabilidadTitulo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f1f5f9',
    marginBottom: 12
  },
  probabilidadValor: {
    alignItems: 'center',
    marginBottom: 20
  },
  probabilidadPorcentaje: {
    fontSize: 48,
    fontWeight: 'bold'
  },
  desglose: {
    backgroundColor: '#1e2530',
    padding: 12,
    borderRadius: 8
  },
  desgloseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4
  },
  desgloseKey: {
    color: '#94a3b8',
    fontSize: 14
  },
  desgloseValue: {
    color: '#f1f5f9',
    fontSize: 14,
    fontWeight: '500'
  },
  sinergias: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#1e2530',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#a78bfa'
  },
  sinergiasTitle: {
    color: '#a78bfa',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8
  },
  sinergiaItem: {
    color: '#f1f5f9',
    fontSize: 13,
    marginBottom: 4
  },
  seresSection: {
    padding: 20
  },
  noSeresTexto: {
    textAlign: 'center',
    color: '#64748b',
    fontSize: 14,
    marginTop: 20
  },
  serCard: {
    backgroundColor: '#1e2530',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative'
  },
  serCardSeleccionado: {
    borderColor: '#60a5fa',
    backgroundColor: '#1e293b'
  },
  serCardDisabled: {
    opacity: 0.5
  },
  serHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  serName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f1f5f9'
  },
  serEnergia: {
    fontSize: 14,
    color: '#fbbf24'
  },
  atributos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  atributo: {
    backgroundColor: '#0a0e14',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  atributoNombre: {
    fontSize: 12,
    color: '#94a3b8'
  },
  atributoValor: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#60a5fa'
  },
  energiaBajaTexto: {
    marginTop: 8,
    fontSize: 12,
    color: '#fbbf24',
    fontStyle: 'italic'
  },
  checkmark: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#60a5fa',
    alignItems: 'center',
    justifyContent: 'center'
  },
  checkmarkIcon: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold'
  },
  footer: {
    backgroundColor: '#151a24',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#1e2530'
  },
  footerInfo: {
    marginBottom: 12
  },
  footerTexto: {
    color: '#94a3b8',
    fontSize: 14,
    marginBottom: 4
  },
  footerTextoError: {
    color: '#ef4444'
  },
  botonDesplegar: {
    backgroundColor: '#60a5fa',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  botonDesplegarDisabled: {
    backgroundColor: '#334155',
    opacity: 0.5
  },
  botonTexto: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  }
});

export default DeployMissionScreen;
