/**
 * EJEMPLO DE USO DEL MISSION SERVICE
 * Pantalla de misiones activas con timers en tiempo real
 *
 * Este archivo es solo de referencia
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl
} from 'react-native';
import useGameStore from '../stores/gameStore';
import MissionService from '../services/MissionService';

function ActiveMissionsScreen({ navigation }) {
  const userId = useGameStore(state => state.user.id);

  const [misiones, setMisiones] = useState([]);
  const [refrescando, setRefrescando] = useState(false);
  const [tiempoActual, setTiempoActual] = useState(Date.now());

  // Cargar misiones al montar
  useEffect(() => {
    cargarMisiones();
  }, []);

  // Actualizar tiempo cada segundo para los timers
  useEffect(() => {
    const interval = setInterval(() => {
      setTiempoActual(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  /**
   * Cargar misiones activas
   */
  const cargarMisiones = async () => {
    const misionesActivas = await MissionService.obtenerMisionesActivas(userId);
    setMisiones(misionesActivas);
  };

  /**
   * Refrescar con pull-to-refresh
   */
  const handleRefresh = async () => {
    setRefrescando(true);
    await cargarMisiones();
    setRefrescando(false);
  };

  /**
   * Calcular tiempo restante para una misión
   */
  const calcularTiempoRestante = (fechaFin) => {
    const finMs = new Date(fechaFin).getTime();
    const restanteMs = finMs - tiempoActual;

    if (restanteMs <= 0) {
      return {
        completada: true,
        texto: '¡Completada!',
        porcentaje: 100
      };
    }

    const horas = Math.floor(restanteMs / (1000 * 60 * 60));
    const minutos = Math.floor((restanteMs % (1000 * 60 * 60)) / (1000 * 60));
    const segundos = Math.floor((restanteMs % (1000 * 60)) / 1000);

    let texto = '';
    if (horas > 0) {
      texto = `${horas}h ${minutos}m`;
    } else if (minutos > 0) {
      texto = `${minutos}m ${segundos}s`;
    } else {
      texto = `${segundos}s`;
    }

    // Calcular porcentaje de progreso
    const inicio = new Date(misiones.find(m => m.endsAt === fechaFin)?.startedAt).getTime();
    const duracionTotal = finMs - inicio;
    const tiempoTranscurrido = tiempoActual - inicio;
    const porcentaje = Math.min(100, (tiempoTranscurrido / duracionTotal) * 100);

    return {
      completada: false,
      texto,
      porcentaje,
      horas,
      minutos,
      segundos
    };
  };

  /**
   * Renderizar card de misión
   */
  const renderMisionCard = (mision) => {
    const tiempoRestante = calcularTiempoRestante(mision.endsAt);
    const prob = mision.successProbability * 100;
    const colorProb = prob >= 70 ? '#34d399' : prob >= 40 ? '#fbbf24' : '#ef4444';

    return (
      <View key={mision.id} style={styles.misionCard}>
        {/* Header */}
        <View style={styles.misionHeader}>
          <View style={styles.headerLeft}>
            <Text style={styles.misionTitulo}>
              {mision.crisisData.title}
            </Text>
            <View style={styles.badges}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{mision.crisisData.type}</Text>
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{mision.crisisData.scale}</Text>
              </View>
              {mision.isLocal && (
                <View style={[styles.badge, styles.badgeLocal]}>
                  <Text style={styles.badgeText}>📍 Local</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.urgenciaContainer}>
            <Text style={styles.urgenciaLabel}>Urgencia</Text>
            <Text style={styles.urgenciaValor}>{mision.crisisData.urgency}/10</Text>
          </View>
        </View>

        {/* Equipo desplegado */}
        <View style={styles.equipoSection}>
          <Text style={styles.sectionTitle}>
            👥 Equipo ({mision.teamData.teamSize} seres)
          </Text>
          <View style={styles.nombresEquipo}>
            {mision.teamData.beingNames.map((nombre, idx) => (
              <Text key={idx} style={styles.nombreSer}>• {nombre}</Text>
            ))}
          </View>
        </View>

        {/* Probabilidad */}
        <View style={styles.probabilidadRow}>
          <Text style={styles.probabilidadLabel}>Probabilidad de éxito:</Text>
          <Text style={[styles.probabilidadValor, { color: colorProb }]}>
            {prob.toFixed(1)}%
          </Text>
        </View>

        {/* Barra de progreso */}
        <View style={styles.progresoSection}>
          <View style={styles.progresoHeader}>
            <Text style={styles.progresoTexto}>
              {tiempoRestante.completada ? '✅ Completada' : `⏱️ ${tiempoRestante.texto}`}
            </Text>
            <Text style={styles.progresoTexto}>
              {tiempoRestante.porcentaje.toFixed(0)}%
            </Text>
          </View>

          <View style={styles.barraProgreso}>
            <View
              style={[
                styles.barraProgresoFill,
                {
                  width: `${tiempoRestante.porcentaje}%`,
                  backgroundColor: tiempoRestante.completada ? '#34d399' : '#60a5fa'
                }
              ]}
            />
          </View>
        </View>

        {/* Recompensas esperadas */}
        <View style={styles.recompensasSection}>
          <Text style={styles.sectionTitle}>💰 Recompensas Base</Text>
          <View style={styles.recompensas}>
            <View style={styles.recompensa}>
              <Text style={styles.recompensaLabel}>XP</Text>
              <Text style={styles.recompensaValor}>+{mision.baseRewards.xp}</Text>
            </View>
            <View style={styles.recompensa}>
              <Text style={styles.recompensaLabel}>Consciencia</Text>
              <Text style={styles.recompensaValor}>+{mision.baseRewards.consciousness}</Text>
            </View>
            <View style={styles.recompensa}>
              <Text style={styles.recompensaLabel}>Energía</Text>
              <Text style={styles.recompensaValor}>+{mision.baseRewards.energy}</Text>
            </View>
          </View>
        </View>

        {/* Sinergias */}
        {mision.probabilityDetails?.sinergias?.length > 0 && (
          <View style={styles.sinergiasSection}>
            <Text style={styles.sectionTitle}>✨ Sinergias Activas</Text>
            {mision.probabilityDetails.sinergias.map((sinergia, idx) => (
              <Text key={idx} style={styles.sinergiaTexto}>
                • {sinergia.name}
              </Text>
            ))}
          </View>
        )}

        {/* Botones de acción */}
        {tiempoRestante.completada && (
          <TouchableOpacity
            style={styles.botonCobrar}
            onPress={() => handleCobrarRecompensas(mision.id)}
          >
            <Text style={styles.botonTexto}>🎁 Cobrar Recompensas</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  /**
   * Cobrar recompensas (esto lo hace automáticamente el servicio,
   * pero podemos forzarlo manualmente)
   */
  const handleCobrarRecompensas = async (misionId) => {
    const gameStore = useGameStore.getState();

    await MissionService.resolverMision(misionId, gameStore);
    await cargarMisiones(); // Recargar lista
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.titulo}>Misiones Activas</Text>
        <Text style={styles.subtitulo}>
          {misiones.length} {misiones.length === 1 ? 'misión' : 'misiones'} en progreso
        </Text>
      </View>

      {/* Lista de misiones */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={handleRefresh}
            tintColor="#60a5fa"
          />
        }
      >
        {misiones.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🌍</Text>
            <Text style={styles.emptyTitulo}>No hay misiones activas</Text>
            <Text style={styles.emptyTexto}>
              Explora el mapa y despliega seres a las crisis para comenzar
            </Text>
            <TouchableOpacity
              style={styles.botonExplorar}
              onPress={() => navigation.navigate('Map')}
            >
              <Text style={styles.botonTexto}>🗺️ Explorar Mapa</Text>
            </TouchableOpacity>
          </View>
        ) : (
          misiones.map(mision => renderMisionCard(mision))
        )}
      </ScrollView>

      {/* Botón flotante para ver historial */}
      <TouchableOpacity
        style={styles.botonFlotante}
        onPress={() => navigation.navigate('MissionHistory')}
      >
        <Text style={styles.botonFlotanteTexto}>📚</Text>
      </TouchableOpacity>
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
    marginBottom: 4
  },
  subtitulo: {
    fontSize: 14,
    color: '#64748b'
  },
  scrollView: {
    flex: 1,
    padding: 16
  },
  misionCard: {
    backgroundColor: '#151a24',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1e2530'
  },
  misionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  headerLeft: {
    flex: 1,
    marginRight: 12
  },
  misionTitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f1f5f9',
    marginBottom: 8
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6
  },
  badge: {
    backgroundColor: '#1e2530',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12
  },
  badgeLocal: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#34d399'
  },
  badgeText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500'
  },
  urgenciaContainer: {
    alignItems: 'center'
  },
  urgenciaLabel: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 4
  },
  urgenciaValor: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ef4444'
  },
  equipoSection: {
    marginBottom: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#1e2530'
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#94a3b8',
    marginBottom: 8
  },
  nombresEquipo: {
    gap: 4
  },
  nombreSer: {
    fontSize: 13,
    color: '#f1f5f9'
  },
  probabilidadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#1e2530',
    borderRadius: 8
  },
  probabilidadLabel: {
    fontSize: 14,
    color: '#94a3b8'
  },
  probabilidadValor: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  progresoSection: {
    marginBottom: 16
  },
  progresoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  progresoTexto: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '500'
  },
  barraProgreso: {
    height: 8,
    backgroundColor: '#1e2530',
    borderRadius: 4,
    overflow: 'hidden'
  },
  barraProgresoFill: {
    height: '100%',
    borderRadius: 4
  },
  recompensasSection: {
    marginBottom: 16
  },
  recompensas: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#1e2530',
    padding: 12,
    borderRadius: 8
  },
  recompensa: {
    alignItems: 'center'
  },
  recompensaLabel: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 4
  },
  recompensaValor: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fbbf24'
  },
  sinergiasSection: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#1e2530',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#a78bfa'
  },
  sinergiaTexto: {
    fontSize: 12,
    color: '#f1f5f9',
    marginBottom: 4
  },
  botonCobrar: {
    backgroundColor: '#34d399',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12
  },
  botonTexto: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold'
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16
  },
  emptyTitulo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f1f5f9',
    marginBottom: 8,
    textAlign: 'center'
  },
  emptyTexto: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20
  },
  botonExplorar: {
    backgroundColor: '#60a5fa',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12
  },
  botonFlotante: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#60a5fa',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8
  },
  botonFlotanteTexto: {
    fontSize: 24
  }
});

export default ActiveMissionsScreen;
