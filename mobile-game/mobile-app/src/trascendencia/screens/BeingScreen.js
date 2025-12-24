import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTrascendenciaStore } from '../stores/trascendenciaStore';
import useGameStore from '../../stores/gameStore';

export default function BeingScreen() {
  const { selectedBeingId, setSelectedBeing } = useTrascendenciaStore();
  const { beings } = useGameStore();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ser Mentor</Text>
      <Text style={styles.text}>Ser activo: {selectedBeingId || 'Sin seleccionar'}</Text>

      <ScrollView style={styles.list}>
        {(beings || []).map((being) => (
          <TouchableOpacity
            key={being.id}
            style={[
              styles.item,
              being.id === selectedBeingId ? styles.itemActive : null
            ]}
            onPress={() => setSelectedBeing(being.id)}
          >
            <Text style={styles.itemTitle}>{being.name || 'Ser'}</Text>
            <Text style={styles.itemText}>Nivel {being.level || 1}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Evolucion</Text>
        <Text style={styles.cardText}>Las misiones reales incrementan atributos clave.</Text>
      </View>
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
  text: {
    color: '#aac6aa',
    marginTop: 8
  },
  list: {
    marginTop: 16,
    maxHeight: 240
  },
  item: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#122018',
    borderWidth: 1,
    borderColor: '#1e3a2a',
    marginBottom: 10
  },
  itemActive: {
    borderColor: '#2f855a',
    backgroundColor: '#153024'
  },
  itemTitle: {
    color: '#e2fbe2',
    fontWeight: '600'
  },
  itemText: {
    color: '#9bd0a9',
    marginTop: 4
  },
  card: {
    marginTop: 16,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#122018',
    borderWidth: 1,
    borderColor: '#1e3a2a'
  },
  cardTitle: {
    color: '#d5f0d5',
    fontWeight: '600'
  },
  cardText: {
    color: '#9bd0a9',
    marginTop: 6
  }
});
