import generatedExcerpts from './bookExcerpts.generated.json';

const EXCERPTS = Array.isArray(generatedExcerpts) && generatedExcerpts.length > 0
  ? generatedExcerpts
  : [
      {
        id: 'filosofia_nuevo_ser_agua',
        source: 'Filosofia del Nuevo Ser',
        text: 'Las premisas invisibles determinan las preguntas que nos hacemos.',
        fullText: 'Las premisas invisibles determinan las preguntas que nos hacemos.',
        chapterId: 'prologo',
        chapterTitle: 'Prologo'
      },
      {
        id: 'codigo_despertar_codigo',
        source: 'Codigo del Despertar',
        text: 'El universo como informacion que se organiza a si misma.',
        fullText: 'El universo como informacion que se organiza a si misma.',
        chapterId: 'prologo',
        chapterTitle: 'Prologo'
      },
      {
        id: 'tierra_despierta_recordar',
        source: 'La Tierra que Despierta',
        text: 'No hay separacion real: la Tierra se recuerda a si misma.',
        fullText: 'No hay separacion real: la Tierra se recuerda a si misma.',
        chapterId: 'prologo',
        chapterTitle: 'Prologo'
      }
    ];

const PLAN_LIMITS = {
  free: 6,
  premium: 12,
  pro: EXCERPTS.length
};

const getAvailableExcerpts = (planId) => {
  const limit = PLAN_LIMITS[planId] || PLAN_LIMITS.free;
  return EXCERPTS.slice(0, Math.max(1, Math.min(limit, EXCERPTS.length)));
};

export const getExcerptForToday = (planId = 'free') => {
  const available = getAvailableExcerpts(planId);
  const today = new Date();
  const daySeed = today.getFullYear() * 1000 + Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 86400000);
  const index = Math.abs(daySeed) % available.length;
  return available[index];
};

export const getExcerptForMission = (missionId, planId = 'free') => {
  const available = getAvailableExcerpts(planId);
  const seed = missionId
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const index = Math.abs(seed) % available.length;
  return available[index];
};

export default EXCERPTS;
