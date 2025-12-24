import { MISSION_TYPES } from '../config/missionTypes';

export const MISSION_TEMPLATES = [
  {
    id: 'eco_water_check',
    type: MISSION_TYPES.ecological.id,
    title: 'Explora tu fuente de agua',
    description: 'Ubica tu fuente de agua mas cercana y registra un hallazgo.',
    checkin: 'gps',
    baseXp: 40,
    tags: ['agua', 'territorio']
  },
  {
    id: 'eco_clean_spot',
    type: MISSION_TYPES.ecological.id,
    title: 'Limpieza puntual',
    description: 'Recoge residuos en un punto concreto y registra la accion.',
    checkin: 'gps',
    baseXp: 50,
    tags: ['residuos', 'accion']
  },
  {
    id: 'social_listen',
    type: MISSION_TYPES.social.id,
    title: 'Escucha activa',
    description: 'Escucha a alguien sin interrumpir y registra una sintesis.',
    checkin: 'manual',
    baseXp: 35,
    tags: ['comunidad', 'cuidado']
  },
  {
    id: 'inner_breath',
    type: MISSION_TYPES.inner.id,
    title: 'Respiracion consciente',
    description: 'Practica 5 minutos y registra una sensacion clave.',
    checkin: 'manual',
    baseXp: 25,
    tags: ['ritual', 'consciencia']
  }
];
