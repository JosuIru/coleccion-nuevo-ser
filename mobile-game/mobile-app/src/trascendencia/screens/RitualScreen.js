import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Linking } from 'react-native';
import { useTrascendenciaStore } from '../stores/trascendenciaStore';
import { RITUAL_TEMPLATES } from '../data/ritualTemplates';
import useGameStore from '../../stores/gameStore';
import trascendenciaAIService from '../services/TrascendenciaAIService';
import { getExcerptForToday } from '../data/bookExcerpts';

export default function RitualScreen() {
  const { completeRitual, lastRitualAt, selectedBeingId, planId } = useTrascendenciaStore();
  const { addXP, addBeingXP, updateBeing } = useGameStore();
  const [note, setNote] = useState('');

  const ritual = useMemo(() => RITUAL_TEMPLATES[0], []);
  const excerpt = useMemo(() => getExcerptForToday(planId), [planId]);
  const excerptKey = `${excerpt.bookId || ''}-${excerpt.chapterId || ''}-${excerpt.text || ''}`;
  const [showFull, setShowFull] = useState(false);
  const [suggestion, setSuggestion] = useState(() =>
    trascendenciaAIService.getFallbackSuggestion({ planId, type: 'ritual', excerpt })
  );

  useEffect(() => {
    let active = true;
    const fallback = trascendenciaAIService.getFallbackSuggestion({ planId, type: 'ritual', excerpt });
    setSuggestion(fallback);

    (async () => {
      const response = await trascendenciaAIService.getSuggestion({ planId, type: 'ritual', excerpt, ritual });
      if (active) {
        setSuggestion(response);
      }
    })();

    return () => {
      active = false;
    };
  }, [planId, ritual.id, excerptKey]);
  const ritualDate = lastRitualAt ? new Date(lastRitualAt) : null;
  const isSameDay = ritualDate
    ? ritualDate.toDateString() === new Date().toDateString()
    : false;

  const handleComplete = () => {
    if (isSameDay) return;

    completeRitual();
    addXP(ritual.baseXp);

    if (selectedBeingId) {
      addBeingXP(selectedBeingId, Math.max(5, Math.floor(ritual.baseXp / 2)));
      updateBeing(selectedBeingId, {
        lastTrascendenciaRitualAt: new Date().toISOString(),
        trascendenciaStats: {
          ...(useGameStore.getState().beings.find(b => b.id === selectedBeingId)?.trascendenciaStats || {}),
          ritualsCompleted: (useGameStore.getState().beings.find(b => b.id === selectedBeingId)?.trascendenciaStats?.ritualsCompleted || 0) + 1
        }
      });
    }

    setNote('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ritual diario</Text>
      <Text style={styles.ritualTitle}>{ritual.title}</Text>
      <Text style={styles.description}>{ritual.description}</Text>

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>Duracion: {ritual.duration}</Text>
        <Text style={styles.infoText}>XP base: {ritual.baseXp}</Text>
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
        placeholder="Reflexion breve"
        placeholderTextColor="#6b7f6b"
        style={styles.input}
      />

      <TouchableOpacity
        style={[styles.cta, isSameDay ? styles.ctaDisabled : null]}
        onPress={handleComplete}
        disabled={isSameDay}
      >
        <Text style={styles.ctaText}>{isSameDay ? 'Ritual completado' : 'Completar ritual'}</Text>
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
  ritualTitle: {
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
    backgroundColor: '#2b7a4b',
    paddingVertical: 12,
    borderRadius: 10
  },
  ctaDisabled: {
    backgroundColor: '#234a35'
  },
  ctaText: {
    color: '#ecffec',
    textAlign: 'center',
    fontWeight: '600'
  }
});
