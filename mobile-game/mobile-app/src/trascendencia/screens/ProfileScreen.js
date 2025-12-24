import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTrascendenciaStore } from '../stores/trascendenciaStore';
import { PLAN_TIERS } from '../config/planTiers';

export default function ProfileScreen() {
  const { plan, ritualStreak, missionStreak, checkins, setPlan } = useTrascendenciaStore();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Perfil</Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Plan</Text>
        <Text style={styles.cardText}>{plan.name}</Text>
        <Text style={styles.cardText}>IA: {plan.aiLevel}</Text>
        <View style={styles.planRow}>
          {Object.values(PLAN_TIERS).map((tier) => (
            <TouchableOpacity
              key={tier.id}
              style={[styles.planButton, plan.id === tier.id ? styles.planActive : null]}
              onPress={() => setPlan(tier.id)}
            >
              <Text style={styles.planText}>{tier.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Rachas</Text>
        <Text style={styles.cardText}>Ritual: {ritualStreak}</Text>
        <Text style={styles.cardText}>Mision: {missionStreak}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Check-ins recientes</Text>
        <ScrollView style={styles.feed}>
          {(checkins || []).slice(0, 5).map((item) => (
            <View key={item.id} style={styles.feedItem}>
              <Text style={styles.cardText}>{item.note}</Text>
              <Text style={styles.feedMeta}>{new Date(item.createdAt).toLocaleString()}</Text>
            </View>
          ))}
          {(checkins || []).length === 0 ? (
            <Text style={styles.cardText}>Sin check-ins aun.</Text>
          ) : null}
        </ScrollView>
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
  },
  feed: {
    marginTop: 10,
    maxHeight: 200
  },
  feedItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#1e3a2a',
    paddingBottom: 8,
    marginBottom: 8
  },
  feedMeta: {
    color: '#6f8e6f',
    fontSize: 12,
    marginTop: 4
  },
  planRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10
  },
  planButton: {
    borderWidth: 1,
    borderColor: '#1e3a2a',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#0f1a14',
    marginRight: 8,
    marginBottom: 8
  },
  planActive: {
    borderColor: '#2f855a',
    backgroundColor: '#153024'
  },
  planText: {
    color: '#cfe8cf',
    fontSize: 12
  }
});
