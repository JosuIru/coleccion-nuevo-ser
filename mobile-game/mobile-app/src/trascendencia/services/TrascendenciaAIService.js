import AsyncStorage from '@react-native-async-storage/async-storage';
import { AI_PROXY_URL } from '../../config/constants';
import { PLAN_TIERS } from '../config/planTiers';

const BASIC_HINTS = {
  ritual: 'Respira lento y registra una palabra clave de lo que sientes.',
  mission: 'Elige un gesto concreto y deja evidencia breve.'
};

const GUIDED_HINTS = {
  ritual: 'Nombra una sensacion corporal y una idea que surgio durante el ritual.',
  mission: 'Describe el impacto observable y una accion siguiente posible.'
};

const ADAPTIVE_HINTS = {
  ritual: 'Conecta el ritual con un tema del libro que estas leyendo.',
  mission: 'Relaciona la mision con tu territorio y un ser de tu comunidad.'
};

class TrascendenciaAIService {
  getFallbackSuggestion({ planId, type, excerpt }) {
    const plan = PLAN_TIERS[planId] || PLAN_TIERS.free;
    const source = excerpt?.source ? ` (${excerpt.source})` : '';
    const chapter = excerpt?.chapterTitle ? ` - ${excerpt.chapterTitle}` : '';
    const snippet = excerpt?.text ? ` "${excerpt.text}"` : '';

    switch (plan.aiLevel) {
      case 'guided':
        return `${GUIDED_HINTS[type] || GUIDED_HINTS.ritual}${source}${chapter}${snippet}`;
      case 'adaptive':
        return `${ADAPTIVE_HINTS[type] || ADAPTIVE_HINTS.ritual}${source}${chapter}${snippet}`;
      default:
        return `${BASIC_HINTS[type] || BASIC_HINTS.ritual}${source}${chapter}${snippet}`;
    }
  }

  async getSuggestion({ planId, type, excerpt, mission, ritual }) {
    const plan = PLAN_TIERS[planId] || PLAN_TIERS.free;
    const fallback = this.getFallbackSuggestion({ planId: plan.id, type, excerpt });

    if (!['premium', 'pro'].includes(plan.id)) {
      return fallback;
    }

    const token = await this.getAccessToken();
    if (!token) {
      return fallback;
    }

    const payload = this.buildPayload({ planId: plan.id, type, excerpt, mission, ritual });

    try {
      const response = await fetch(AI_PROXY_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        return fallback;
      }

      const data = await response.json();
      const text = data?.content?.[0]?.text?.trim();
      return text || fallback;
    } catch (error) {
      return fallback;
    }
  }

  async getAccessToken() {
    try {
      const raw = await AsyncStorage.getItem('webapp_auth_session');
      if (!raw) {
        return null;
      }
      const session = JSON.parse(raw);
      return session?.access_token || session?.accessToken || null;
    } catch (error) {
      return null;
    }
  }

  buildPayload({ planId, type, excerpt, mission, ritual }) {
    const model = planId === 'pro'
      ? 'claude-3-5-sonnet-20241022'
      : 'claude-3-5-haiku-20241022';
    const title = mission?.title || ritual?.title || 'Ritual';
    const description = mission?.description || ritual?.description || '';
    const source = excerpt?.source || '';
    const chapter = excerpt?.chapterTitle || '';
    const snippet = excerpt?.text || '';

    return {
      model,
      max_tokens: 160,
      system: 'Eres un guia breve y practico del juego Trascendencia. Responde en espanol neutro, con 1-2 frases y una accion concreta.',
      messages: [
        {
          role: 'user',
          content: `Tipo: ${type}. Titulo: ${title}. Descripcion: ${description}. Libro: ${source}. Capitulo: ${chapter}. Cita: "${snippet}". Sugiere un paso accionable y consciente.`
        }
      ]
    };
  }
}

export default new TrascendenciaAIService();
