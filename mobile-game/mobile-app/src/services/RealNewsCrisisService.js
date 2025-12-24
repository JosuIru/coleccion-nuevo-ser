/**
 * RealNewsCrisisService.js
 *
 * Servicio para obtener crisis basadas en noticias reales de RSS feeds.
 * Convierte noticias del mundo real en crisis jugables para el modo
 * Comandante Global.
 *
 * @version 1.0.0
 * @date 2025-12-17
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import translationService from './TranslationService';

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

const TRANSLATION_ENABLED = true; // Activar/desactivar traducción automática

// ============================================================================
// CONFIGURACIÓN DE FUENTES RSS
// ============================================================================

const RSS_SOURCES = {
  // ========== FUENTES OFICIALES ==========
  un_news: {
    name: 'Naciones Unidas',
    url: 'https://news.un.org/feed/subscribe/en/news/all/rss.xml',
    icon: '🇺🇳',
    reliability: 'high',
    focus: ['humanitarian', 'social', 'environmental']
  },
  bbc_world: {
    name: 'BBC World',
    url: 'http://feeds.bbci.co.uk/news/world/rss.xml',
    icon: '🌍',
    reliability: 'high',
    focus: ['social', 'humanitarian', 'health']
  },

  // ========== FUENTES ALTERNATIVAS / INDEPENDIENTES ==========

  // Medio ambiente y activismo
  grist: {
    name: 'Grist',
    url: 'https://grist.org/feed/',
    icon: '🌿',
    reliability: 'medium',
    focus: ['environmental', 'social'],
    description: 'Periodismo climático independiente'
  },
  mongabay: {
    name: 'Mongabay',
    url: 'https://news.mongabay.com/feed/',
    icon: '🌳',
    reliability: 'high',
    focus: ['environmental'],
    description: 'Noticias de conservación y medio ambiente'
  },
  commondreams: {
    name: 'Common Dreams',
    url: 'https://www.commondreams.org/rss.xml',
    icon: '✊',
    reliability: 'medium',
    focus: ['social', 'humanitarian', 'economic'],
    description: 'Noticias progresistas independientes'
  },

  // Tecnología y sociedad
  techdirt: {
    name: 'Techdirt',
    url: 'https://www.techdirt.com/feed/',
    icon: '💻',
    reliability: 'medium',
    focus: ['infrastructure', 'social'],
    description: 'Tecnología, privacidad y derechos digitales'
  },
  eff: {
    name: 'EFF Deeplinks',
    url: 'https://www.eff.org/rss/updates.xml',
    icon: '🔐',
    reliability: 'high',
    focus: ['social', 'infrastructure'],
    description: 'Derechos digitales y libertad en internet'
  },
  restofworld: {
    name: 'Rest of World',
    url: 'https://restofworld.org/feed/',
    icon: '🌐',
    reliability: 'medium',
    focus: ['social', 'infrastructure', 'economic'],
    description: 'Tecnología fuera del mundo occidental'
  },

  // Justicia social y derechos humanos
  democracynow: {
    name: 'Democracy Now',
    url: 'https://www.democracynow.org/democracynow.rss',
    icon: '📢',
    reliability: 'medium',
    focus: ['social', 'humanitarian'],
    description: 'Noticias independientes de movimientos sociales'
  },
  theintercept: {
    name: 'The Intercept',
    url: 'https://theintercept.com/feed/?rss',
    icon: '🔍',
    reliability: 'medium',
    focus: ['social', 'humanitarian'],
    description: 'Periodismo de investigación'
  },
  opendemocracy: {
    name: 'OpenDemocracy',
    url: 'https://www.opendemocracy.net/en/rss/',
    icon: '🗳️',
    reliability: 'medium',
    focus: ['social', 'humanitarian'],
    description: 'Democracia y derechos humanos globales'
  },

  // Economía alternativa y cooperativismo
  shareable: {
    name: 'Shareable',
    url: 'https://www.shareable.net/feed/',
    icon: '🤝',
    reliability: 'medium',
    focus: ['economic', 'social'],
    description: 'Economía colaborativa y compartida'
  },
  yesmagazine: {
    name: 'YES! Magazine',
    url: 'https://www.yesmagazine.org/feed',
    icon: '💚',
    reliability: 'medium',
    focus: ['social', 'environmental', 'economic'],
    description: 'Soluciones para un mundo justo y sostenible'
  },

  // Ciencia y tecnología
  arstechnica: {
    name: 'Ars Technica',
    url: 'https://feeds.arstechnica.com/arstechnica/index',
    icon: '🔬',
    reliability: 'high',
    focus: ['infrastructure', 'health'],
    description: 'Tecnología y ciencia'
  },

  // Noticias regionales / Sur Global
  aljazeera: {
    name: 'Al Jazeera',
    url: 'https://www.aljazeera.com/xml/rss/all.xml',
    icon: '📺',
    reliability: 'medium',
    focus: ['humanitarian', 'social']
  },
  guardian_global_dev: {
    name: 'Guardian Global Development',
    url: 'https://www.theguardian.com/global-development/rss',
    icon: '🌍',
    reliability: 'high',
    focus: ['humanitarian', 'economic', 'health'],
    description: 'Desarrollo global y pobreza'
  },

  // Fuentes en español
  eldiario: {
    name: 'elDiario.es',
    url: 'https://www.eldiario.es/rss/',
    icon: '🇪🇸',
    reliability: 'medium',
    focus: ['social', 'humanitarian'],
    description: 'Noticias en español',
    language: 'es'
  },
  lamarea: {
    name: 'La Marea',
    url: 'https://www.lamarea.com/feed/',
    icon: '🌊',
    reliability: 'medium',
    focus: ['social', 'economic', 'humanitarian'],
    description: 'Periodismo independiente en español',
    language: 'es'
  },
  veinteminutos: {
    name: '20 Minutos',
    url: 'https://www.20minutos.es/rss/',
    icon: '📰',
    reliability: 'medium',
    focus: ['social', 'humanitarian'],
    description: 'Noticias generales en español',
    language: 'es'
  }
};

// ============================================================================
// CLASIFICADORES DE CRISIS
// ============================================================================

const CRISIS_CLASSIFIERS = {
  environmental: {
    keywords: [
      'climate', 'fire', 'wildfire', 'flood', 'drought', 'pollution',
      'deforestation', 'extinction', 'emissions', 'warming', 'glacier',
      'hurricane', 'typhoon', 'earthquake', 'tsunami', 'volcano',
      'incendio', 'inundación', 'sequía', 'contaminación', 'clima',
      'forest', 'ocean', 'species', 'biodiversity', 'carbon'
    ],
    icon: '🌍',
    color: '#059669',
    baseAttributes: {
      action: 80,
      consciousness: 70,
      organization: 60,
      resilience: 65,
      technical: 50
    }
  },
  social: {
    keywords: [
      'protest', 'rights', 'discrimination', 'inequality', 'justice',
      'democracy', 'freedom', 'election', 'corruption', 'reform',
      'protesta', 'derechos', 'discriminación', 'justicia', 'libertad',
      'community', 'civil', 'movement', 'activism', 'vote'
    ],
    icon: '👥',
    color: '#3b82f6',
    baseAttributes: {
      empathy: 75,
      communication: 80,
      leadership: 70,
      collaboration: 65,
      strategy: 55
    }
  },
  economic: {
    keywords: [
      'inflation', 'recession', 'unemployment', 'poverty', 'debt',
      'crisis', 'market', 'bank', 'currency', 'trade',
      'inflación', 'desempleo', 'pobreza', 'economía', 'mercado',
      'investment', 'growth', 'gdp', 'fiscal', 'monetary'
    ],
    icon: '💰',
    color: '#f59e0b',
    baseAttributes: {
      strategy: 85,
      organization: 80,
      analysis: 75,
      collaboration: 60,
      communication: 55
    }
  },
  humanitarian: {
    keywords: [
      'refugee', 'displaced', 'famine', 'hunger', 'war', 'conflict',
      'aid', 'humanitarian', 'victims', 'casualties', 'crisis',
      'refugiado', 'hambre', 'guerra', 'víctimas', 'ayuda',
      'migration', 'asylum', 'shelter', 'rescue', 'relief'
    ],
    icon: '❤️',
    color: '#ef4444',
    baseAttributes: {
      empathy: 90,
      action: 80,
      resilience: 85,
      organization: 70,
      connection: 75
    }
  },
  health: {
    keywords: [
      'pandemic', 'epidemic', 'outbreak', 'virus', 'disease',
      'vaccine', 'hospital', 'health', 'medical', 'covid',
      'pandemia', 'virus', 'enfermedad', 'vacuna', 'salud',
      'mental health', 'healthcare', 'doctors', 'treatment', 'cure'
    ],
    icon: '🏥',
    color: '#ec4899',
    baseAttributes: {
      empathy: 80,
      technical: 85,
      organization: 75,
      wisdom: 60,
      resilience: 70
    }
  },
  educational: {
    keywords: [
      'education', 'school', 'university', 'literacy', 'learning',
      'students', 'teachers', 'curriculum', 'scholarship', 'research',
      'educación', 'escuela', 'estudiantes', 'aprendizaje', 'universidad'
    ],
    icon: '📚',
    color: '#8b5cf6',
    baseAttributes: {
      wisdom: 80,
      communication: 75,
      creativity: 70,
      organization: 65,
      empathy: 60
    }
  },
  infrastructure: {
    keywords: [
      'infrastructure', 'transport', 'energy', 'power', 'grid',
      'construction', 'housing', 'road', 'bridge', 'building',
      'infraestructura', 'transporte', 'energía', 'vivienda', 'construcción',
      'collapse', 'blackout', 'supply', 'water', 'sanitation'
    ],
    icon: '🏗️',
    color: '#64748b',
    baseAttributes: {
      technical: 90,
      organization: 85,
      strategy: 75,
      action: 70,
      collaboration: 60
    }
  }
};

// ============================================================================
// EXTRACTOR DE UBICACIONES
// ============================================================================

const LOCATION_PATTERNS = {
  // Países con coordenadas aproximadas (centro del país)
  countries: {
    'spain': { lat: 40.4168, lon: -3.7038, name: 'España' },
    'españa': { lat: 40.4168, lon: -3.7038, name: 'España' },
    'france': { lat: 48.8566, lon: 2.3522, name: 'Francia' },
    'germany': { lat: 52.5200, lon: 13.4050, name: 'Alemania' },
    'italy': { lat: 41.9028, lon: 12.4964, name: 'Italia' },
    'uk': { lat: 51.5074, lon: -0.1278, name: 'Reino Unido' },
    'united kingdom': { lat: 51.5074, lon: -0.1278, name: 'Reino Unido' },
    'usa': { lat: 38.9072, lon: -77.0369, name: 'Estados Unidos' },
    'united states': { lat: 38.9072, lon: -77.0369, name: 'Estados Unidos' },
    'mexico': { lat: 19.4326, lon: -99.1332, name: 'México' },
    'méxico': { lat: 19.4326, lon: -99.1332, name: 'México' },
    'brazil': { lat: -15.7801, lon: -47.9292, name: 'Brasil' },
    'brasil': { lat: -15.7801, lon: -47.9292, name: 'Brasil' },
    'argentina': { lat: -34.6037, lon: -58.3816, name: 'Argentina' },
    'colombia': { lat: 4.7110, lon: -74.0721, name: 'Colombia' },
    'chile': { lat: -33.4489, lon: -70.6693, name: 'Chile' },
    'peru': { lat: -12.0464, lon: -77.0428, name: 'Perú' },
    'perú': { lat: -12.0464, lon: -77.0428, name: 'Perú' },
    'china': { lat: 39.9042, lon: 116.4074, name: 'China' },
    'india': { lat: 28.6139, lon: 77.2090, name: 'India' },
    'japan': { lat: 35.6762, lon: 139.6503, name: 'Japón' },
    'australia': { lat: -33.8688, lon: 151.2093, name: 'Australia' },
    'russia': { lat: 55.7558, lon: 37.6173, name: 'Rusia' },
    'ukraine': { lat: 50.4501, lon: 30.5234, name: 'Ucrania' },
    'israel': { lat: 31.7683, lon: 35.2137, name: 'Israel' },
    'palestine': { lat: 31.9522, lon: 35.2332, name: 'Palestina' },
    'gaza': { lat: 31.5, lon: 34.47, name: 'Gaza' },
    'syria': { lat: 33.5138, lon: 36.2765, name: 'Siria' },
    'iran': { lat: 35.6892, lon: 51.3890, name: 'Irán' },
    'turkey': { lat: 39.9334, lon: 32.8597, name: 'Turquía' },
    'egypt': { lat: 30.0444, lon: 31.2357, name: 'Egipto' },
    'south africa': { lat: -33.9249, lon: 18.4241, name: 'Sudáfrica' },
    'nigeria': { lat: 9.0820, lon: 7.4951, name: 'Nigeria' },
    'kenya': { lat: -1.2921, lon: 36.8219, name: 'Kenia' },
    'ethiopia': { lat: 9.1450, lon: 40.4897, name: 'Etiopía' },
    'venezuela': { lat: 10.4806, lon: -66.9036, name: 'Venezuela' },
    'cuba': { lat: 23.1136, lon: -82.3666, name: 'Cuba' },
    'canada': { lat: 45.4215, lon: -75.6972, name: 'Canadá' },
    'global': { lat: 0, lon: 0, name: 'Global', isGlobal: true }
  },

  // Regiones
  regions: {
    'europe': { lat: 50.1109, lon: 8.6821, name: 'Europa', scale: 'continental' },
    'asia': { lat: 34.0479, lon: 100.6197, name: 'Asia', scale: 'continental' },
    'africa': { lat: -8.7832, lon: 34.5085, name: 'África', scale: 'continental' },
    'latin america': { lat: -14.2350, lon: -51.9253, name: 'Latinoamérica', scale: 'continental' },
    'middle east': { lat: 29.2985, lon: 42.5510, name: 'Medio Oriente', scale: 'regional' },
    'amazon': { lat: -3.4653, lon: -62.2159, name: 'Amazonas', scale: 'regional' },
    'arctic': { lat: 71.7069, lon: -42.6043, name: 'Ártico', scale: 'regional' },
    'antarctic': { lat: -82.8628, lon: 135.0000, name: 'Antártida', scale: 'regional' }
  }
};

// ============================================================================
// SERVICIO PRINCIPAL
// ============================================================================

class RealNewsCrisisService {

  constructor() {
    this.cache = {
      crises: [],
      lastFetch: null,
      cacheLifetime: 2 * 60 * 60 * 1000 // 2 horas
    };
  }

  // --------------------------------------------------------------------------
  // MÉTODOS PÚBLICOS PRINCIPALES
  // --------------------------------------------------------------------------

  /**
   * Obtiene crisis del mundo real basadas en noticias
   * @param {Object} options - Opciones de filtrado
   * @returns {Promise<Array>} Lista de crisis
   */
  async getRealWorldCrises(options = {}) {
    const {
      limit = 20,
      types = null, // null = todos los tipos
      minUrgency = 1,
      maxUrgency = 10,
      forceRefresh = false
    } = options;

    // Verificar caché
    if (!forceRefresh && this.isCacheValid()) {
      return this.filterCrises(this.cache.crises, { limit, types, minUrgency, maxUrgency });
    }

    try {
      // Intentar obtener noticias reales
      const crises = await this.fetchAndProcessNews();

      // Guardar en caché
      this.cache.crises = crises;
      this.cache.lastFetch = Date.now();
      await this.persistCache();

      return this.filterCrises(crises, { limit, types, minUrgency, maxUrgency });

    } catch (error) {
      console.warn('Error fetching real news, using fallback:', error);

      // Si falla, intentar cargar caché persistido
      const cached = await this.loadPersistedCache();
      if (cached.length > 0) {
        return this.filterCrises(cached, { limit, types, minUrgency, maxUrgency });
      }

      // Último recurso: crisis procedurales
      return this.generateProceduralCrises(limit);
    }
  }

  /**
   * Obtiene una crisis específica por ID
   * @param {string} crisisId
   * @returns {Object|null}
   */
  async getCrisisById(crisisId) {
    const crises = await this.getRealWorldCrises({ limit: 100 });
    return crises.find(c => c.id === crisisId) || null;
  }

  /**
   * Obtiene crisis para el modo Liga (las más importantes de la semana)
   * @param {number} weekNumber
   * @returns {Promise<Array>}
   */
  async getWeeklyLeagueCrises(weekNumber = null) {
    const crises = await this.getRealWorldCrises({ limit: 50 });

    // Ordenar por urgencia y seleccionar top 5 para la liga
    return crises
      .sort((a, b) => b.urgency - a.urgency)
      .slice(0, 5)
      .map(crisis => ({
        ...crisis,
        isLeagueCrisis: true,
        leagueMultiplier: 2.0,
        weekNumber: weekNumber || this.getCurrentWeekNumber()
      }));
  }

  /**
   * Obtiene estadísticas de crisis activas
   * @returns {Object}
   */
  async getCrisisStats() {
    const crises = await this.getRealWorldCrises({ limit: 100 });

    const byType = {};
    const byUrgency = { low: 0, medium: 0, high: 0, critical: 0 };

    crises.forEach(crisis => {
      byType[crisis.type] = (byType[crisis.type] || 0) + 1;

      if (crisis.urgency <= 3) byUrgency.low++;
      else if (crisis.urgency <= 5) byUrgency.medium++;
      else if (crisis.urgency <= 7) byUrgency.high++;
      else byUrgency.critical++;
    });

    return {
      total: crises.length,
      byType,
      byUrgency,
      averageUrgency: crises.reduce((sum, c) => sum + c.urgency, 0) / crises.length,
      mostCommonType: Object.entries(byType).sort((a, b) => b[1] - a[1])[0]?.[0],
      lastUpdate: this.cache.lastFetch
    };
  }

  // --------------------------------------------------------------------------
  // OBTENCIÓN Y PROCESAMIENTO DE NOTICIAS
  // --------------------------------------------------------------------------

  async fetchAndProcessNews() {
    const allArticles = [];

    // Fetch de todas las fuentes en paralelo
    const fetchPromises = Object.entries(RSS_SOURCES).map(async ([sourceId, source]) => {
      try {
        const articles = await this.fetchRSSFeed(source.url, sourceId);
        return articles.map(article => ({
          ...article,
          sourceId,
          sourceName: source.name,
          sourceLanguage: source.language || 'en', // Por defecto inglés
          sourceIcon: source.icon
        }));
      } catch (error) {
        console.warn(`Error fetching ${sourceId}:`, error);
        return [];
      }
    });

    const results = await Promise.all(fetchPromises);
    results.forEach(articles => allArticles.push(...articles));

    // Deduplicar por título similar
    const deduplicated = this.deduplicateArticles(allArticles);

    // Convertir a crisis
    let crises = deduplicated.map(article => this.articleToCrisis(article));

    // Traducir al español solo las que no están ya en español
    if (TRANSLATION_ENABLED) {
      try {
        // Separar crisis por idioma
        const crisesEnIngles = crises.filter(c => c.sourceLanguage !== 'es');
        const crisesEnEspanol = crises.filter(c => c.sourceLanguage === 'es');

        console.log(`[RealNewsCrisisService] ${crisesEnEspanol.length} crisis ya en español, ${crisesEnIngles.length} para traducir`);

        // Solo traducir las que están en inglés
        if (crisesEnIngles.length > 0) {
          const traducidas = await translationService.translateCrises(crisesEnIngles);
          crises = [...traducidas, ...crisesEnEspanol.map(c => ({ ...c, translated: true }))];
        } else {
          crises = crisesEnEspanol.map(c => ({ ...c, translated: true }));
        }

        console.log('[RealNewsCrisisService] Traducción completada');
      } catch (translationError) {
        console.warn('[RealNewsCrisisService] Error en traducción:', translationError);
        // Continuar con textos originales si falla la traducción
      }
    }

    // Ordenar por urgencia
    return crises.sort((a, b) => b.urgency - a.urgency);
  }

  async fetchRSSFeed(url, sourceId) {
    // En producción, esto debería ir a través de un backend PHP/Node
    // Por ahora, simulamos con datos procesados

    // Intentar fetch directo (funciona en algunos feeds con CORS habilitado)
    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/rss+xml, application/xml, text/xml'
        }
      });

      if (!response.ok) throw new Error('RSS fetch failed');

      const xmlText = await response.text();
      return this.parseRSSXML(xmlText, sourceId);

    } catch (error) {
      // Fallback: usar backend proxy
      return this.fetchViaProxy(url, sourceId);
    }
  }

  async fetchViaProxy(url, sourceId) {
    try {
      const proxyUrl = `https://coleccion-nuevo-ser.com/api/rss-proxy.php?feed=${encodeURIComponent(url)}`;
      const response = await fetch(proxyUrl);

      if (!response.ok) throw new Error('Proxy fetch failed');

      const data = await response.json();
      return data.articles || [];

    } catch (error) {
      console.warn(`Proxy fetch failed for ${sourceId}`);
      return [];
    }
  }

  parseRSSXML(xmlText, sourceId) {
    // Parser básico de RSS XML
    const articles = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
    let match;

    while ((match = itemRegex.exec(xmlText)) !== null) {
      const itemXml = match[1];

      const title = this.extractXMLTag(itemXml, 'title');
      const description = this.extractXMLTag(itemXml, 'description');
      const link = this.extractXMLTag(itemXml, 'link');
      const pubDate = this.extractXMLTag(itemXml, 'pubDate');
      const guid = this.extractXMLTag(itemXml, 'guid') || link;

      if (title) {
        articles.push({
          title: this.cleanHTMLEntities(title),
          description: this.cleanHTMLEntities(description || ''),
          link,
          pubDate: pubDate ? new Date(pubDate) : new Date(),
          guid
        });
      }
    }

    return articles.slice(0, 20); // Max 20 por fuente
  }

  extractXMLTag(xml, tagName) {
    const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)</${tagName}>`, 'i');
    const match = xml.match(regex);
    return match ? match[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1').trim() : null;
  }

  cleanHTMLEntities(text) {
    return text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/<[^>]*>/g, '') // Remover tags HTML
      .trim();
  }

  deduplicateArticles(articles) {
    const seen = new Set();
    return articles.filter(article => {
      const normalizedTitle = article.title.toLowerCase().substring(0, 50);
      if (seen.has(normalizedTitle)) return false;
      seen.add(normalizedTitle);
      return true;
    });
  }

  // --------------------------------------------------------------------------
  // CONVERSIÓN DE ARTÍCULOS A CRISIS
  // --------------------------------------------------------------------------

  articleToCrisis(article) {
    const type = this.classifyCrisisType(article);
    const location = this.extractLocation(article);
    const urgency = this.calculateUrgency(article, type);
    const classifier = CRISIS_CLASSIFIERS[type];

    // Generar atributos requeridos con variación
    const requiredAttributes = this.generateRequiredAttributes(classifier.baseAttributes, urgency);

    // Calcular recompensas basadas en urgencia
    const rewards = this.calculateRewards(urgency, location.scale || 'regional');

    // Calcular tiempo de expiración
    const expiresAt = this.calculateExpiration(article.pubDate, urgency);

    return {
      id: `real_${this.hashString(article.guid || article.title)}`,

      // Información de la noticia
      title: article.title,
      description: article.description.substring(0, 300),
      source: article.sourceName,
      sourceIcon: article.sourceIcon || '📰',
      sourceUrl: article.link,
      sourceLanguage: article.sourceLanguage || 'en',
      publishedAt: article.pubDate,

      // Clasificación del juego
      type,
      typeIcon: classifier.icon,
      typeColor: classifier.color,
      urgency,
      scale: location.scale || this.determineScale(urgency),

      // Ubicación
      lat: location.lat,
      lon: location.lon,
      locationName: location.name,
      isGlobal: location.isGlobal || false,

      // Mecánicas de juego
      requiredAttributes,
      rewards,

      // Temporalidad
      expiresAt,
      isExpired: new Date() > new Date(expiresAt),

      // Metadata
      isRealNews: true,
      createdAt: new Date().toISOString()
    };
  }

  classifyCrisisType(article) {
    const text = `${article.title} ${article.description}`.toLowerCase();

    let bestMatch = { type: 'social', score: 0 };

    for (const [type, classifier] of Object.entries(CRISIS_CLASSIFIERS)) {
      const score = classifier.keywords.filter(kw => text.includes(kw)).length;
      if (score > bestMatch.score) {
        bestMatch = { type, score };
      }
    }

    return bestMatch.type;
  }

  extractLocation(article) {
    const text = `${article.title} ${article.description}`.toLowerCase();

    // Buscar países
    for (const [pattern, location] of Object.entries(LOCATION_PATTERNS.countries)) {
      if (text.includes(pattern)) {
        return { ...location, scale: 'national' };
      }
    }

    // Buscar regiones
    for (const [pattern, location] of Object.entries(LOCATION_PATTERNS.regions)) {
      if (text.includes(pattern)) {
        return location;
      }
    }

    // Default: ubicación global con coordenadas aleatorias
    return {
      lat: (Math.random() - 0.5) * 120, // -60 a 60
      lon: (Math.random() - 0.5) * 300, // -150 a 150
      name: 'Ubicación no especificada',
      scale: 'regional'
    };
  }

  calculateUrgency(article, type) {
    let urgency = 5; // Base

    const text = `${article.title} ${article.description}`.toLowerCase();

    // Palabras que aumentan urgencia
    const urgentWords = ['crisis', 'emergency', 'urgent', 'critical', 'disaster',
                         'deaths', 'killed', 'catastrophe', 'escalating', 'outbreak',
                         'emergencia', 'urgente', 'crítico', 'muertos', 'catástrofe'];

    const veryUrgentWords = ['war', 'pandemic', 'famine', 'genocide', 'massacre',
                             'guerra', 'pandemia', 'hambruna', 'genocidio'];

    urgentWords.forEach(word => {
      if (text.includes(word)) urgency += 1;
    });

    veryUrgentWords.forEach(word => {
      if (text.includes(word)) urgency += 2;
    });

    // Recencia aumenta urgencia
    const hoursAgo = (Date.now() - new Date(article.pubDate).getTime()) / (1000 * 60 * 60);
    if (hoursAgo < 6) urgency += 2;
    else if (hoursAgo < 24) urgency += 1;

    // Clamp entre 1 y 10
    return Math.max(1, Math.min(10, urgency));
  }

  generateRequiredAttributes(baseAttributes, urgency) {
    const attributes = {};
    const multiplier = 0.5 + (urgency / 10) * 0.8; // 0.5 a 1.3

    for (const [attr, value] of Object.entries(baseAttributes)) {
      const variation = (Math.random() - 0.5) * 20; // ±10
      attributes[attr] = Math.round(Math.max(10, Math.min(100, value * multiplier + variation)));
    }

    return attributes;
  }

  calculateRewards(urgency, scale) {
    const baseXP = 30;
    const baseConsciousness = 15;
    const baseEnergy = 5;

    const scaleMultipliers = {
      local: 1,
      regional: 2,
      national: 3,
      continental: 5,
      global: 8
    };

    const scaleMultiplier = scaleMultipliers[scale] || 2;
    const urgencyMultiplier = 0.5 + (urgency / 10) * 1.5; // 0.5 a 2.0

    return {
      xp: Math.round(baseXP * scaleMultiplier * urgencyMultiplier),
      consciousness: Math.round(baseConsciousness * scaleMultiplier * urgencyMultiplier),
      energy: Math.round(baseEnergy * urgencyMultiplier)
    };
  }

  calculateExpiration(publishedAt, urgency) {
    // Crisis más urgentes expiran más rápido
    const hoursToExpire = Math.max(6, 72 - (urgency * 6)); // 6 a 66 horas
    const expirationDate = new Date(publishedAt);
    expirationDate.setHours(expirationDate.getHours() + hoursToExpire);
    return expirationDate.toISOString();
  }

  determineScale(urgency) {
    if (urgency >= 9) return 'global';
    if (urgency >= 7) return 'continental';
    if (urgency >= 5) return 'national';
    if (urgency >= 3) return 'regional';
    return 'local';
  }

  // --------------------------------------------------------------------------
  // CRISIS PROCEDURALES (FALLBACK)
  // --------------------------------------------------------------------------

  generateProceduralCrises(count = 20) {
    const crises = [];
    const types = Object.keys(CRISIS_CLASSIFIERS);

    for (let i = 0; i < count; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      const classifier = CRISIS_CLASSIFIERS[type];
      const urgency = Math.floor(Math.random() * 7) + 3; // 3-9

      const templates = this.getProceduralTemplates(type);
      const template = templates[Math.floor(Math.random() * templates.length)];

      const locations = Object.values(LOCATION_PATTERNS.countries);
      const location = locations[Math.floor(Math.random() * locations.length)];

      crises.push({
        id: `procedural_${Date.now()}_${i}`,
        title: template.title,
        description: template.description,
        source: 'Generado proceduralmente',
        sourceUrl: null,
        publishedAt: new Date().toISOString(),
        type,
        typeIcon: classifier.icon,
        typeColor: classifier.color,
        urgency,
        scale: this.determineScale(urgency),
        lat: location.lat + (Math.random() - 0.5) * 5,
        lon: location.lon + (Math.random() - 0.5) * 5,
        locationName: location.name,
        isGlobal: false,
        requiredAttributes: this.generateRequiredAttributes(classifier.baseAttributes, urgency),
        rewards: this.calculateRewards(urgency, this.determineScale(urgency)),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        isExpired: false,
        isRealNews: false,
        createdAt: new Date().toISOString()
      });
    }

    return crises;
  }

  getProceduralTemplates(type) {
    const templates = {
      environmental: [
        { title: 'Incendios forestales amenazan región', description: 'Las llamas se extienden rápidamente debido a condiciones de sequía extrema.' },
        { title: 'Contaminación del agua afecta a comunidades', description: 'Residuos industriales han contaminado fuentes de agua potable.' },
        { title: 'Deforestación acelera en zona protegida', description: 'Actividades ilegales de tala amenazan ecosistema único.' },
        { title: 'Sequía prolongada causa emergencia agrícola', description: 'Agricultores enfrentan pérdidas devastadoras de cultivos.' }
      ],
      social: [
        { title: 'Protestas masivas exigen cambios', description: 'Miles de ciudadanos se movilizan en demanda de reformas.' },
        { title: 'Comunidad denuncia discriminación sistemática', description: 'Grupos marginados enfrentan barreras en acceso a servicios.' },
        { title: 'División social crece en la región', description: 'Tensiones entre grupos aumentan preocupantemente.' }
      ],
      economic: [
        { title: 'Crisis económica golpea a familias', description: 'El aumento de precios afecta la capacidad adquisitiva.' },
        { title: 'Desempleo alcanza niveles récord', description: 'Miles de personas buscan oportunidades laborales.' },
        { title: 'Pequeños negocios luchan por sobrevivir', description: 'La situación económica amenaza el tejido comercial local.' }
      ],
      humanitarian: [
        { title: 'Ola de desplazados necesita ayuda urgente', description: 'Miles de personas huyen de la violencia sin recursos.' },
        { title: 'Escasez de alimentos en zona de conflicto', description: 'Comunidades vulnerables enfrentan hambruna.' },
        { title: 'Refugiados esperan asistencia internacional', description: 'Campamentos al límite de capacidad.' }
      ],
      health: [
        { title: 'Brote de enfermedad preocupa a autoridades', description: 'Sistemas de salud se preparan para responder.' },
        { title: 'Crisis de salud mental afecta a jóvenes', description: 'Expertos piden más recursos para atención psicológica.' },
        { title: 'Hospitales saturados piden refuerzos', description: 'Personal médico trabaja al límite de sus capacidades.' }
      ],
      educational: [
        { title: 'Miles de niños sin acceso a educación', description: 'Comunidades rurales carecen de escuelas adecuadas.' },
        { title: 'Brecha digital limita aprendizaje', description: 'Estudiantes sin recursos tecnológicos quedan rezagados.' },
        { title: 'Maestros exigen mejores condiciones', description: 'El sistema educativo necesita inversión urgente.' }
      ],
      infrastructure: [
        { title: 'Apagón masivo afecta a millones', description: 'Fallas en la red eléctrica causan caos.' },
        { title: 'Infraestructura vial en estado crítico', description: 'Puentes y carreteras requieren reparación urgente.' },
        { title: 'Crisis de vivienda se agudiza', description: 'Familias no pueden acceder a hogares dignos.' }
      ]
    };

    return templates[type] || templates.social;
  }

  // --------------------------------------------------------------------------
  // UTILIDADES
  // --------------------------------------------------------------------------

  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  isCacheValid() {
    return this.cache.lastFetch &&
           (Date.now() - this.cache.lastFetch) < this.cache.cacheLifetime &&
           this.cache.crises.length > 0;
  }

  filterCrises(crises, { limit, types, minUrgency, maxUrgency }) {
    let filtered = crises.filter(c => !c.isExpired);

    if (types && types.length > 0) {
      filtered = filtered.filter(c => types.includes(c.type));
    }

    filtered = filtered.filter(c => c.urgency >= minUrgency && c.urgency <= maxUrgency);

    return filtered.slice(0, limit);
  }

  async persistCache() {
    try {
      await AsyncStorage.setItem('real_news_cache', JSON.stringify({
        crises: this.cache.crises,
        lastFetch: this.cache.lastFetch
      }));
    } catch (error) {
      console.warn('Error persisting cache:', error);
    }
  }

  async loadPersistedCache() {
    try {
      const data = await AsyncStorage.getItem('real_news_cache');
      if (data) {
        const parsed = JSON.parse(data);
        this.cache.crises = parsed.crises || [];
        this.cache.lastFetch = parsed.lastFetch;
        return this.cache.crises;
      }
    } catch (error) {
      console.warn('Error loading cache:', error);
    }
    return [];
  }

  getCurrentWeekNumber() {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const diff = now - start;
    const oneWeek = 604800000;
    return Math.ceil(diff / oneWeek);
  }
}

// Exportar instancia singleton
export const realNewsCrisisService = new RealNewsCrisisService();
export default RealNewsCrisisService;
