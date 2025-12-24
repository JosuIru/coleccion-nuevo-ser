export const MISSION_TYPES = {
  ecological: {
    id: 'ecological',
    name: 'Ecologica',
    icon: '🌿',
    color: '#2f855a',
    attributes: ['connection', 'action', 'wisdom']
  },
  social: {
    id: 'social',
    name: 'Social',
    icon: '🤝',
    color: '#2563eb',
    attributes: ['empathy', 'communication', 'collaboration']
  },
  inner: {
    id: 'inner',
    name: 'Interior',
    icon: '🧘',
    color: '#7c3aed',
    attributes: ['consciousness', 'reflection', 'resilience']
  }
};

export const CHECKIN_TYPES = {
  gps: {
    id: 'gps',
    name: 'GPS',
    requiresLocation: true
  },
  manual: {
    id: 'manual',
    name: 'Manual',
    requiresLocation: false
  }
};
