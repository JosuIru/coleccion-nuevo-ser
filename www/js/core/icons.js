// ============================================================================
// ICONS - Sistema de iconos SVG profesionales usando Lucide Icons
// ============================================================================
// Fuente: https://lucide.dev (MIT License)

const Icons = {
  /**
   * Crea un icono de Lucide Icons
   * @param {string} name - Nombre del icono en formato kebab-case (ej: 'arrow-left')
   * @param {number} size - Tamaño del icono (default: 20)
   * @param {string} className - Clases CSS adicionales
   * @returns {string} HTML del icono
   */
  create(name, size = 20, className = '') {
    return `<i data-lucide="${name}" class="inline-block ${className}" style="width:${size}px;height:${size}px"></i>`;
  },

  // SVG inline para iconos críticos (no dependen de Lucide init)
  // Usar stroke="currentColor" para adaptarse automáticamente a light/dark mode
  _svg: {
    x: (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`,
    arrowLeft: (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>`,
    menu: (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>`,
    chevronLeft: (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>`,
    chevronRight: (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>`,
    chevronUp: (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>`,
    chevronDown: (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>`,
    settings: (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>`,
    // Iconos del reproductor de audio (SVG inline para funcionar sin CDN)
    play: (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="6 3 20 12 6 21 6 3"/></svg>`,
    pause: (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="14" y="4" width="4" height="16" rx="1"/><rect x="6" y="4" width="4" height="16" rx="1"/></svg>`,
    stop: (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>`,
    skipBack: (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="19 20 9 12 19 4 19 20"/><line x1="5" x2="5" y1="19" y2="5"/></svg>`,
    skipForward: (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" x2="19" y1="5" y2="19"/></svg>`,
    book: (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"/></svg>`,
    check: (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`,
    volume2: (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>`,
    bookmark: (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>`,
    bookmarkFilled: (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>`,
    headphones: (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"/></svg>`,
    // 🔧 v2.9.395: Compass - solo aguja de brújula (sin círculo para mejor visibilidad)
    compass: (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 19 21 12 17 5 21 12 2"/></svg>`,
    // 🔧 v2.9.395: Help Circle - interrogación grande y visible (sin círculo exterior)
    helpCircle: (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 4c-2.8 0-5 2.2-5 5h3c0-1.1.9-2 2-2s2 .9 2 2c0 1.1-1 2-2 3s-2 2-2 4h3c0-1 .5-2 1-3s2-2 2-4c0-2.8-2.2-5-5-5zm-1 14v3h3v-3h-3z"/></svg>`,
    // 🔧 v2.9.393: Iconos faltantes para botones del menú (SVG inline)
    // Book Open - libro abierto para Prácticas
    bookOpen: (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/></svg>`,
    // Bar Chart 2 - gráfico de barras para Progreso
    barChart2: (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" x2="18" y1="20" y2="10"/><line x1="12" x2="12" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="14"/></svg>`,
    // Heart - corazón para Donar
    heart: (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`,
    // 🔧 v2.9.394: More Vertical - tres puntos elegante estilo Lucide (círculos pequeños filled)
    moreVertical: (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="5" r="1" fill="currentColor"/><circle cx="12" cy="19" r="1" fill="currentColor"/></svg>`,
    // Loader/Spinner - círculo con dash animable
    loader: (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>`,
    // Search icon - usando currentColor para adaptarse a light/dark mode
    search: (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>`,

    // Book Icons - iconos específicos para cada libro de la colección
    sparkles: (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>`,
    // 🔧 v2.9.400: Globe - globo terráqueo con meridianos visibles
    globe: (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
    flame: (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>`,
    target: (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`,
    sprout: (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 20h10"/><path d="M10 20c5.5-2.5.8-6.4 3-10"/><path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z"/><path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z"/></svg>`,
    wrench: (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`,
    circleDot: (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="1"/></svg>`,
    pencil: (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg>`,
    bot: (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>`,
    zap: (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/></svg>`,
    brain: (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/><path d="M17.599 6.5a3 3 0 0 0 .399-1.375"/><path d="M6.003 5.125A3 3 0 0 0 6.401 6.5"/><path d="M3.477 10.896a4 4 0 0 1 .585-.396"/><path d="M19.938 10.5a4 4 0 0 1 .585.396"/><path d="M6 18a4 4 0 0 1-1.967-.516"/><path d="M19.967 17.484A4 4 0 0 1 18 18"/></svg>`,
    landmark: (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" x2="21" y1="22" y2="22"/><line x1="6" x2="6" y1="18" y2="11"/><line x1="10" x2="10" y1="18" y2="11"/><line x1="14" x2="14" y1="18" y2="11"/><line x1="18" x2="18" y1="18" y2="11"/><polygon points="12 2 20 7 4 7"/></svg>`,
    // Icono calendario/timeline
    calendar: (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>`,
    // Icono bebé/nacimiento
    baby: (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12h.01"/><path d="M15 12h.01"/><path d="M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5"/><path d="M19 6.3a9 9 0 0 1 1.8 3.9 2 2 0 0 1 0 3.6 9 9 0 0 1-17.6 0 2 2 0 0 1 0-3.6A9 9 0 0 1 12 3c2 0 3.5 1.1 3.5 2.5s-.9 2.5-2 2.5c-.8 0-1.5-.4-1.5-1"/></svg>`,
    // Icono graduación/educación
    graduationCap: (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/></svg>`,
    // Iconos adicionales para libros (SVG inline)
    heartPulse: (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27"/></svg>`,
    leaf: (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>`,
    palette: (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.555C21.965 6.012 17.461 2 12 2z"/></svg>`,
    feather: (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.67 19a2 2 0 0 0 1.416-.588l6.154-6.172a6 6 0 0 0-8.49-8.49L5.586 9.914A2 2 0 0 0 5 11.328V18a1 1 0 0 0 1 1z"/><path d="M16 8 2 22"/><path d="M17.5 15H9"/></svg>`,

    // Theme Icons - iconos para el sistema de temas
    moon: (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>`,
    sun: (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`,
    monitor: (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg>`,

    // 🔧 v2.9.379: Iconos del menú Más (SVG inline para no depender de Lucide)
    user: (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    crown: (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z"/><path d="M5 21h14"/></svg>`,
    // 🔧 v2.9.396: Info - letra "i" grande y visible (sin círculo)
    info: (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="10" y="10" width="4" height="10" rx="1"/><circle cx="12" cy="6" r="2.5"/></svg>`,
    logOut: (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>`,
    shield: (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>`,
    download: (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>`,
  },

  // Navegación (usando SVG inline para mayor fiabilidad)
  back: (size = 20) => Icons._svg.arrowLeft(size),
  arrowLeft: (size = 20) => Icons._svg.arrowLeft(size),
  arrowRight: (size = 20) => Icons.create('arrow-right', size),
  menu: (size = 20) => Icons._svg.menu(size),
  close: (size = 20) => Icons._svg.x(size),
  chevronLeft: (size = 20) => Icons._svg.chevronLeft(size),
  chevronRight: (size = 20) => Icons._svg.chevronRight(size),
  chevronUp: (size = 20) => Icons._svg.chevronUp(size),
  chevronDown: (size = 20) => Icons._svg.chevronDown(size),

  // Funcionalidades principales
  bookmark: (size = 20) => Icons._svg.bookmark(size),         // Bookmark (SVG inline para audio reader)
  bookmarkFilled: (size = 20) => Icons._svg.bookmarkFilled(size),
  note: (size = 20) => Icons.create('file-text', size),
  chat: (size = 20) => Icons.create('message-circle', size),

  // Features del libro
  timeline: (size = 20) => Icons.create('clock', size),
  resources: (size = 20) => Icons._svg.bookOpen(size),        // Recursos/Prácticas (SVG inline)
  'book-open': (size = 20) => Icons._svg.bookOpen(size),     // Alias kebab-case
  bookOpen: (size = 20) => Icons._svg.bookOpen(size),        // Alias camelCase
  manual: (size = 20) => Icons.create('book', size),
  meditation: (size = 20) => Icons._svg.circleDot(size),      // 🔧 FIX v2.9.211: SVG inline (no depende de Lucide)
  radical: (size = 20) => Icons.create('zap', size),
  audio: (size = 20) => Icons.create('volume-2', size),       // Audio (usando Lucide como los demás)
  headphones: (size = 20) => Icons._svg.headphones(size),     // Headphones (SVG inline para audio reader)
  koan: (size = 20) => Icons.create('lightbulb', size),

  // Configuración y sistema
  download: (size = 20) => Icons._svg.download(size),           // Download (SVG inline)
  downloadCloud: (size = 20) => Icons.create('download-cloud', size),
  settings: (size = 20) => Icons._svg.settings(size),
  donate: (size = 20) => Icons._svg.heart(size),            // Donar (SVG inline)
  heart: (size = 20) => Icons._svg.heart(size),              // Corazón (SVG inline)
  language: (size = 20) => Icons._svg.globe(size),              // Idioma/Globe (SVG inline)
  crown: (size = 20) => Icons._svg.crown(size),                 // Premium/Corona (SVG inline)
  logOut: (size = 20) => Icons._svg.logOut(size),               // Cerrar sesión (SVG inline)
  'log-out': (size = 20) => Icons._svg.logOut(size),            // Alias kebab-case
  shield: (size = 20) => Icons._svg.shield(size),               // Admin/Escudo (SVG inline)
  list: (size = 20) => Icons.create('list', size),
  barChart2: (size = 20) => Icons._svg.barChart2(size),       // Progreso (SVG inline)
  'bar-chart-2': (size = 20) => Icons._svg.barChart2(size),  // Alias kebab-case

  // Biblioteca
  library: (size = 20) => Icons.create('library', size),
  book: (size = 20) => Icons._svg.book(size),                  // Book (SVG inline para audio)

  // Gamificación
  trophy: (size = 20) => Icons.create('trophy', size),
  award: (size = 20) => Icons.create('award', size),
  star: (size = 20) => Icons.create('star', size),

  // Estados
  check: (size = 20) => Icons._svg.check(size),                // Check (SVG inline para audio)
  checkCircle: (size = 20) => Icons.create('check-circle', size),
  circle: (size = 20) => Icons.create('circle', size),

  // Prácticas y ejercicios
  waves: (size = 20) => Icons.create('waves', size),           // Emergencia
  sparkles: (size = 20) => Icons._svg.sparkles(size),          // Phi/Misterio/Meditación (SVG inline)
  brain: (size = 20) => Icons._svg.brain(size),                // Problema difícil/Mente (SVG inline)
  smartphone: (size = 20) => Icons.create('smartphone', size), // Límite borroso
  refreshCw: (size = 20) => Icons.create('refresh-cw', size),  // Autopoiesis/Ciclos
  zap: (size = 20) => Icons._svg.zap(size),                    // Sorpresa/Energía (SVG inline)
  palette: (size = 20) => Icons._svg.palette(size),            // Creatividad (SVG inline)
  heartPulse: (size = 20) => Icons._svg.heartPulse(size),       // Emociones/Somático (SVG inline)
  eye: (size = 20) => Icons.create('eye', size),               // Observación/Umwelt
  helpCircle: (size = 20) => Icons._svg.helpCircle(size),       // Preguntas (SVG inline)
  'help-circle': (size = 20) => Icons._svg.helpCircle(size), // Alias kebab-case
  alertTriangle: (size = 20) => Icons.create('alert-triangle', size), // Miedo
  skull: (size = 20) => Icons.create('skull', size),           // Muerte
  messageSquare: (size = 20) => Icons.create('message-square', size), // Diálogo
  scale: (size = 20) => Icons.create('scale', size),           // Ética
  link: (size = 20) => Icons.create('link', size),             // Entrelazamiento
  search: (size = 20) => Icons._svg.search(size),              // Identificación/Búsqueda (SVG inline)
  filter: (size = 20) => Icons.create('filter', size),         // Filtros
  compass: (size = 20) => Icons._svg.compass(size),             // Cartografía/Navegación (SVG inline)
  clock: (size = 20) => Icons.create('clock', size),           // Tiempo
  users: (size = 20) => Icons.create('users', size),           // Colaboración
  drama: (size = 20) => Icons.create('drama', size),           // Emociones/Máscaras
  gem: (size = 20) => Icons.create('gem', size),               // Materia/Cristal
  activity: (size = 20) => Icons.create('activity', size),     // Escaneo/Vida
  feather: (size = 20) => Icons._svg.feather(size),            // Transformación/Ligereza (SVG inline)
  mail: (size = 20) => Icons.create('mail', size),             // Carta
  moonStar: (size = 20) => Icons.create('moon-star', size),    // Sombra/Noche
  fileText: (size = 20) => Icons.create('file-text', size),    // Código/Plan
  bot: (size = 20) => Icons._svg.bot(size),                    // 🔧 FIX v2.9.211: SVG inline (no depende de Lucide)
  ai: (size = 20) => Icons._svg.bot(size),                     // 🔧 FIX v2.9.211: SVG inline (no depende de Lucide)
  sunrise: (size = 20) => Icons.create('sunrise', size),       // Síntesis/Horizonte
  bookMarked: (size = 20) => Icons.create('book-marked', size), // Referencias
  infinity: (size = 20) => Icons.create('infinity', size),     // Continuo/Espiral
  target: (size = 20) => Icons._svg.target(size),              // Objetivo/Foco (SVG inline)
  flame: (size = 20) => Icons._svg.flame(size),                // Radical/Fuego (SVG inline)
  leaf: (size = 20) => Icons._svg.leaf(size),                  // Impermanencia/Naturaleza (SVG inline)
  network: (size = 20) => Icons.create('network', size),       // Conexión/Red
  lightbulb: (size = 20) => Icons.create('lightbulb', size),   // Iluminación/Idea
  route: (size = 20) => Icons.create('route', size),           // Puente/Camino

  // Acciones
  edit: (size = 20) => Icons._svg.pencil(size),                // 🔧 FIX v2.9.211: SVG inline (no depende de Lucide)
  trash: (size = 20) => Icons.create('trash-2', size),         // Eliminar
  copy: (size = 20) => Icons.create('copy', size),             // Copiar
  play: (size = 20) => Icons._svg.play(size),                  // Reproducir (SVG inline)
  stop: (size = 20) => Icons._svg.stop(size),                  // Detener (SVG inline)
  pause: (size = 20) => Icons._svg.pause(size),                // Pausar (SVG inline)
  loader: (size = 20) => Icons._svg.loader(size),              // Spinner/Cargando (SVG inline)
  info: (size = 20) => Icons._svg.info(size),                  // Información (SVG inline)
  user: (size = 20) => Icons._svg.user(size),                  // Usuario (SVG inline)
  moreVertical: (size = 20) => Icons._svg.moreVertical(size),  // Menú Más (SVG inline)
  'more-vertical': (size = 20) => Icons._svg.moreVertical(size), // Alias kebab-case
  calendar: (size = 20) => Icons._svg.calendar(size),          // Calendario (SVG inline)
  volume: (size = 20) => Icons._svg.volume2(size),             // Volumen (SVG inline)
  wrench: (size = 20) => Icons.create('wrench', size),         // Herramientas
  mapPin: (size = 20) => Icons.create('map-pin', size),        // Ubicación
  sword: (size = 20) => Icons.create('swords', size),          // Revoluciones/Conflicto
  video: (size = 20) => Icons.create('video', size),           // Video/Documental
  skipBack: (size = 20) => Icons._svg.skipBack(size),          // Anterior (SVG inline)
  skipForward: (size = 20) => Icons._svg.skipForward(size),    // Siguiente (SVG inline)

  // Theme Icons (SVG inline)
  moon: (size = 20) => Icons._svg.moon(size),                  // Tema oscuro
  sun: (size = 20) => Icons._svg.sun(size),                    // Tema claro
  monitor: (size = 20) => Icons._svg.monitor(size),            // Tema automático/sistema

  /**
   * Inicializa todos los iconos de Lucide en el DOM
   * Debe llamarse después de que el DOM esté listo y después de cada renderizado
   */
  init() {
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    } else {
      // console.warn('Lucide Icons no está cargado');
    }
  },

  // Helpers para iconos de libros (SVG inline)
  globe: (size = 20) => Icons._svg.globe(size),                // Tierra/Ecología
  sprout: (size = 20) => Icons._svg.sprout(size),              // Transición/Crecimiento
  circleDot: (size = 20) => Icons._svg.circleDot(size),        // Meditación/Práctica
  landmark: (size = 20) => Icons._svg.landmark(size),          // Instituciones/Edificio
  baby: (size = 20) => Icons._svg.baby(size),                  // Nacimiento
  graduationCap: (size = 20) => Icons._svg.graduationCap(size), // Educación

  /**
   * Obtiene el icono SVG apropiado para un libro según su ID
   * @param {string} bookId - ID del libro
   * @param {number} size - Tamaño del icono
   * @param {string} color - Color del icono (opcional, usa currentColor por defecto)
   * @returns {string} HTML del icono SVG
   */
  getBookIcon(bookId, size = 48, color = 'currentColor') {
    const iconMap = {
      'codigo-despertar': 'sparkles',
      'tierra-que-despierta': 'globe',
      'manifiesto': 'flame',
      'guia-acciones': 'target',
      'manual-transicion': 'sprout',
      'toolkit-transicion': 'wrench',
      'manual-practico': 'circleDot',
      'practicas-radicales': 'zap',
      'filosofia-nuevo-ser': 'brain',
      'ahora-instituciones': 'landmark',
      'dialogos-maquina': 'bot',
      'nacimiento': 'baby',
      'educacion-nuevo-ser': 'graduationCap',
      'arte-relacion-consciente': 'heartPulse',
      'ecologia-profunda': 'leaf',
      'revolucion-creativa': 'palette',
      'simplicidad-radical': 'feather',
    };

    const iconName = iconMap[bookId] || 'book';
    const svg = Icons[iconName](size);

    // Si se especifica un color, reemplazar currentColor
    if (color !== 'currentColor') {
      return svg.replace(/stroke="currentColor"/g, `stroke="${color}"`);
    }

    return svg;
  }
};

// Exportar globalmente
window.Icons = Icons;
