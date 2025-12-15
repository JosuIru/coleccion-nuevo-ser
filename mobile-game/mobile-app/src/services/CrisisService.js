/**
 * CRISIS SERVICE
 * Gestión de crisis dinámicas desde noticias reales
 *
 * FLUJO:
 * 1. Fetch de noticias desde RSS Parser
 * 2. Clasificación mediante AI Classifier
 * 3. Caché local de crisis
 * 4. Generación procedural si offline
 *
 * @version 1.0.0
 */

// Usar MemoryStorage - almacenamiento en memoria sin dependencias nativas
import memoryStorage from '../utils/MemoryStorage';
const AsyncStorage = memoryStorage;

import { API_BASE_URL } from '../config/constants';
import logger from '../utils/logger';

class CrisisService {
  constructor() {
    this.rssParserUrl = API_BASE_URL.replace('mobile-bridge.php', 'rss-parser.php');
    this.aiClassifierUrl = API_BASE_URL.replace('mobile-bridge.php', 'ai-classifier.php');
    this.cacheKey = 'crisis_cache';
    this.cacheLifetime = 6 * 60 * 60 * 1000; // 6 horas
    this.refreshInterval = null;
  }

  // ═══════════════════════════════════════════════════════════
  // OBTENCIÓN DE CRISIS
  // ═══════════════════════════════════════════════════════════

  /**
   * Obtener crisis activas (desde caché o red)
   *
   * @param {Object} options Opciones de filtrado
   * @returns {Promise<Array>} Lista de crisis
   */
  async getCrises(options = {}) {
    const { forceRefresh = false, type = null, limit = 10 } = options;

    try {
      // Intentar obtener de caché
      if (!forceRefresh) {
        const cachedCrises = await this.getFromCache();

        if (cachedCrises && cachedCrises.length > 0) {
          console.log('✅ Crisis cargadas desde caché:', cachedCrises.length);
          return this.filterCrises(cachedCrises, type, limit);
        }
      }

      // Verificar conectividad
      const isOnline = await this.checkConnection();

      if (isOnline) {
        // Fetch desde red
        const newCrises = await this.fetchCrisesFromNetwork();

        if (newCrises && newCrises.length > 0) {
          await this.saveToCache(newCrises);
          return this.filterCrises(newCrises, type, limit);
        }
      }

      // Fallback: Crisis procedurales locales
      logger.info('⚠️ Modo offline: Generando crisis procedurales', '');
      const proceduralCrises = this.generateProceduralCrises();
      await this.saveToCache(proceduralCrises);

      return this.filterCrises(proceduralCrises, type, limit);

    } catch (error) {
      logger.error('❌ Error obteniendo crisis:', error);

      // Fallback en caso de error
      const fallback = this.generateProceduralCrises();
      return this.filterCrises(fallback, type, limit);
    }
  }

  /**
   * Fetch de crisis desde red (RSS + AI)
   */
  async fetchCrisesFromNetwork() {
    logger.info('🌐 Fetching crisis desde red...', '');

    try {
      // 1. Obtener noticias del RSS Parser
      const newsResponse = await fetch(
        `${this.rssParserUrl}?action=get_news&limit=20`,
        { timeout: 15000 }
      );

      if (!newsResponse.ok) {
        throw new Error(`RSS Parser error: ${newsResponse.status}`);
      }

      const newsData = await newsResponse.json();

      if (newsData.status !== 'success' || !newsData.data.news) {
        throw new Error('Invalid news data');
      }

      const news = newsData.data.news;
      logger.info("`📰 Noticias obtenidas: ${news.length}`", "");

      // 2. Clasificar noticias en crisis (máximo 10)
      const crises = [];
      const maxToClassify = Math.min(10, news.length);

      for (let i = 0; i < maxToClassify; i++) {
        const newsItem = news[i];

        try {
          const crisis = await this.classifyNewsItem(newsItem);

          if (crisis) {
            crises.push(crisis);
          }

          // Pausa entre clasificaciones para respetar rate limit
          await this.sleep(500);

        } catch (error) {
          logger.error('Error clasificando noticia:', error);
          continue;
        }
      }

      logger.info("`✅ Crisis clasificadas: ${crises.length}`", "");

      return crises;

    } catch (error) {
      logger.error('❌ Error fetching crisis desde red:', error);
      return null;
    }
  }

  /**
   * Clasificar una noticia en crisis
   */
  async classifyNewsItem(newsItem) {
    try {
      const response = await fetch(
        `${this.aiClassifierUrl}?action=classify`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(newsItem),
          timeout: 30000
        }
      );

      if (!response.ok) {
        throw new Error(`AI Classifier error: ${response.status}`);
      }

      const data = await response.json();

      if (data.status !== 'success') {
        throw new Error(data.message || 'Classification failed');
      }

      const crisis = data.data;

      // Agregar campos adicionales
      crisis.id = this.generateCrisisId();
      crisis.createdAt = new Date().toISOString();
      crisis.expiresAt = this.calculateExpirationDate();
      crisis.status = 'active';
      crisis.source = 'news';
      crisis.newsUrl = newsItem.url;
      crisis.newsSource = newsItem.source;

      return crisis;

    } catch (error) {
      logger.error('Error en clasificación:', error);
      return null;
    }
  }

  // ═══════════════════════════════════════════════════════════
  // CRISIS PROCEDURALES (OFFLINE)
  // ═══════════════════════════════════════════════════════════

  /**
   * Generar crisis procedurales cuando no hay conexión
   */
  generateProceduralCrises() {
    const proceduralTemplates = [
      {
        type: 'environmental',
        titles: [
          'Contaminación del río local',
          'Deforestación amenaza bosque',
          'Sequía afecta cultivos',
          'Incendio forestal cerca de ciudad'
        ],
        urgencyRange: [6, 9],
        populationRange: [10000, 500000]
      },
      {
        type: 'social',
        titles: [
          'Protestas por derechos civiles',
          'Discriminación en comunidad',
          'Desigualdad económica creciente',
          'Violencia en barrios marginales'
        ],
        urgencyRange: [5, 8],
        populationRange: [50000, 300000]
      },
      {
        type: 'humanitarian',
        titles: [
          'Refugiados necesitan asistencia',
          'Familias sin hogar por desastres',
          'Falta de alimentos en comunidad',
          'Crisis de desplazados'
        ],
        urgencyRange: [7, 10],
        populationRange: [20000, 1000000]
      },
      {
        type: 'health',
        titles: [
          'Brote de enfermedad infecciosa',
          'Colapso de sistema de salud',
          'Falta de medicamentos esenciales',
          'Crisis de salud mental'
        ],
        urgencyRange: [8, 10],
        populationRange: [100000, 500000]
      },
      {
        type: 'economic',
        titles: [
          'Desempleo masivo en región',
          'Crisis financiera local',
          'Desahucios por crisis económica',
          'Pobreza extrema en aumento'
        ],
        urgencyRange: [6, 9],
        populationRange: [50000, 2000000]
      },
      {
        type: 'educational',
        titles: [
          'Escuelas cerradas por crisis',
          'Falta de acceso a educación',
          'Deserción escolar masiva',
          'Crisis de infraestructura educativa'
        ],
        urgencyRange: [5, 8],
        populationRange: [30000, 500000]
      },
      {
        type: 'infrastructure',
        titles: [
          'Colapso de puente principal',
          'Apagón eléctrico masivo',
          'Falta de agua potable',
          'Red de transporte colapsada'
        ],
        urgencyRange: [7, 9],
        populationRange: [100000, 5000000]
      }
    ];

    const crises = [];
    const numberOfCrises = 10;

    for (let i = 0; i < numberOfCrises; i++) {
      const template = proceduralTemplates[i % proceduralTemplates.length];

      const crisis = {
        id: this.generateCrisisId(),
        type: template.type,
        title: template.titles[Math.floor(Math.random() * template.titles.length)],
        description: this.generateDescription(template.type),
        location: this.generateRandomLocation(),
        urgency: this.randomInRange(template.urgencyRange[0], template.urgencyRange[1]),
        scale: this.randomScale(),
        attributes: this.generateAttributes(template.type),
        population_affected: this.randomInRange(
          template.populationRange[0],
          template.populationRange[1]
        ),
        duration_minutes: this.randomInRange(20, 60),
        createdAt: new Date().toISOString(),
        expiresAt: this.calculateExpirationDate(),
        status: 'active',
        source: 'procedural'
      };

      crises.push(crisis);
    }

    return crises;
  }

  /**
   * Generar descripción genérica
   */
  generateDescription(type) {
    const descriptions = {
      environmental: 'Crisis ambiental requiere intervención urgente para proteger ecosistema',
      social: 'Situación social compleja necesita mediación y organización comunitaria',
      humanitarian: 'Emergencia humanitaria requiere asistencia inmediata',
      health: 'Crisis de salud pública necesita respuesta coordinada',
      economic: 'Crisis económica afecta sustento de comunidades',
      educational: 'Acceso a educación en riesgo, acción necesaria',
      infrastructure: 'Infraestructura crítica dañada, requiere reparación urgente'
    };

    return descriptions[type] || 'Crisis requiere atención inmediata';
  }

  /**
   * Generar ubicación aleatoria
   */
  generateRandomLocation() {
    const cities = [
      { country: 'México', city: 'Ciudad de México', lat: 19.4326, lon: -99.1332 },
      { country: 'España', city: 'Madrid', lat: 40.4168, lon: -3.7038 },
      { country: 'Argentina', city: 'Buenos Aires', lat: -34.6037, lon: -58.3816 },
      { country: 'Colombia', city: 'Bogotá', lat: 4.7110, lon: -74.0721 },
      { country: 'Chile', city: 'Santiago', lat: -33.4489, lon: -70.6693 },
      { country: 'Perú', city: 'Lima', lat: -12.0464, lon: -77.0428 },
      { country: 'Brasil', city: 'São Paulo', lat: -23.5505, lon: -46.6333 },
      { country: 'Ecuador', city: 'Quito', lat: -0.1807, lon: -78.4678 }
    ];

    return cities[Math.floor(Math.random() * cities.length)];
  }

  /**
   * Generar atributos según tipo
   */
  generateAttributes(type) {
    const baseAttributes = {
      environmental: { empathy: 70, action: 85, organization: 75, technical: 60 },
      social: { empathy: 80, communication: 85, leadership: 70, organization: 65 },
      humanitarian: { empathy: 95, organization: 80, action: 75, resilience: 85 },
      health: { organization: 90, technical: 80, empathy: 75, action: 70 },
      economic: { strategy: 85, organization: 80, collaboration: 75, communication: 70 },
      educational: { empathy: 75, creativity: 80, organization: 70, communication: 75 },
      infrastructure: { technical: 90, organization: 85, action: 80, strategy: 70 }
    };

    const base = baseAttributes[type] || {};

    // Añadir variación aleatoria ±10
    const varied = {};
    for (const [key, value] of Object.entries(base)) {
      varied[key] = Math.max(1, Math.min(100, value + this.randomInRange(-10, 10)));
    }

    return varied;
  }

  /**
   * Escala aleatoria
   */
  randomScale() {
    const scales = ['local', 'regional', 'national', 'continental'];
    const weights = [0.4, 0.35, 0.2, 0.05]; // Más probable local/regional

    const random = Math.random();
    let cumulative = 0;

    for (let i = 0; i < scales.length; i++) {
      cumulative += weights[i];
      if (random <= cumulative) {
        return scales[i];
      }
    }

    return 'local';
  }

  // ═══════════════════════════════════════════════════════════
  // FILTRADO Y UTILIDADES
  // ═══════════════════════════════════════════════════════════

  /**
   * Filtrar crisis
   */
  filterCrises(crises, type, limit) {
    let filtered = crises;

    // Filtrar por tipo
    if (type) {
      filtered = filtered.filter(c => c.type === type);
    }

    // Filtrar por vigencia
    filtered = filtered.filter(c => {
      if (!c.expiresAt) return true;
      return new Date(c.expiresAt) > new Date();
    });

    // Ordenar por urgencia (descendente)
    filtered.sort((a, b) => (b.urgency || 0) - (a.urgency || 0));

    // Limitar
    return filtered.slice(0, limit);
  }

  /**
   * Calcular fecha de expiración (24-72 horas)
   */
  calculateExpirationDate() {
    const hours = this.randomInRange(24, 72);
    const expiration = new Date();
    expiration.setHours(expiration.getHours() + hours);
    return expiration.toISOString();
  }

  /**
   * Generar ID único para crisis
   */
  generateCrisisId() {
    return 'crisis_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Número aleatorio en rango
   */
  randomInRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Sleep/delay
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ═══════════════════════════════════════════════════════════
  // CACHÉ
  // ═══════════════════════════════════════════════════════════

  /**
   * Obtener crisis del caché
   */
  async getFromCache() {
    try {
      const cached = await AsyncStorage.getItem(this.cacheKey);

      if (!cached) {
        return null;
      }

      const data = JSON.parse(cached);

      // Verificar vigencia del caché
      if (Date.now() - data.timestamp > this.cacheLifetime) {
        logger.info('⏰ Caché expirado', '');
        return null;
      }

      return data.crises;

    } catch (error) {
      logger.error('Error leyendo caché:', error);
      return null;
    }
  }

  /**
   * Guardar crisis en caché
   */
  async saveToCache(crises) {
    try {
      const data = {
        crises,
        timestamp: Date.now()
      };

      await AsyncStorage.setItem(this.cacheKey, JSON.stringify(data));
      console.log('💾 Crisis guardadas en caché:', crises.length);

    } catch (error) {
      logger.error('Error guardando en caché:', error);
    }
  }

  /**
   * Limpiar caché
   */
  async clearCache() {
    try {
      await AsyncStorage.removeItem(this.cacheKey);
      logger.info('🗑️ Caché limpiado', '');
    } catch (error) {
      logger.error('Error limpiando caché:', error);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // REFRESH AUTOMÁTICO
  // ═══════════════════════════════════════════════════════════

  /**
   * Iniciar refresh automático cada 6 horas
   */
  startAutoRefresh() {
    if (this.refreshInterval) {
      return;
    }

    logger.info('🔄 Auto-refresh de crisis activado (cada 6h)', '');

    this.refreshInterval = setInterval(async () => {
      logger.info('⏰ Ejecutando refresh automático...', '');

      try {
        await this.getCrises({ forceRefresh: true });
      } catch (error) {
        logger.error('Error en auto-refresh:', error);
      }
    }, this.cacheLifetime);
  }

  /**
   * Detener refresh automático
   */
  stopAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
      logger.info('⏸️ Auto-refresh detenido', '');
    }
  }

  // ═══════════════════════════════════════════════════════════
  // CONECTIVIDAD
  // ═══════════════════════════════════════════════════════════

  /**
   * Verificar conexión a internet
   */
  async checkConnection() {
    try {
      const response = await fetch(`${this.rssParserUrl}?action=health`, {
        timeout: 5000
      });

      const data = await response.json();
      return data.status === 'success';

    } catch (error) {
      logger.info('⚠️ Sin conexión a internet', '');
      return false;
    }
  }

  // ═══════════════════════════════════════════════════════════
  // GESTIÓN DE CRISIS COMPLETADAS
  // ═══════════════════════════════════════════════════════════

  /**
   * Marcar crisis como completada
   */
  async completeCrisis(crisisId, userId, result) {
    try {
      const completedKey = `crisis_completed_${userId}`;
      const stored = await AsyncStorage.getItem(completedKey);
      const completed = stored ? JSON.parse(stored) : [];

      completed.push({
        crisisId,
        completedAt: new Date().toISOString(),
        result
      });

      await AsyncStorage.setItem(completedKey, JSON.stringify(completed));

      console.log('✅ Crisis marcada como completada:', crisisId);

    } catch (error) {
      logger.error('Error guardando crisis completada:', error);
    }
  }

  /**
   * Obtener crisis completadas
   */
  async getCompletedCrises(userId) {
    try {
      const completedKey = `crisis_completed_${userId}`;
      const stored = await AsyncStorage.getItem(completedKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      logger.error('Error obteniendo crisis completadas:', error);
      return [];
    }
  }

  // ═══════════════════════════════════════════════════════════
  // ESTADÍSTICAS
  // ═══════════════════════════════════════════════════════════

  /**
   * Obtener estadísticas de crisis
   */
  async getCrisisStats(userId) {
    try {
      const completed = await this.getCompletedCrises(userId);

      const stats = {
        total_completed: completed.length,
        by_type: {},
        success_rate: 0,
        total_population_helped: 0
      };

      let successful = 0;

      for (const crisis of completed) {
        const type = crisis.result?.type || 'unknown';

        if (!stats.by_type[type]) {
          stats.by_type[type] = 0;
        }
        stats.by_type[type]++;

        if (crisis.result?.success) {
          successful++;
        }

        stats.total_population_helped += crisis.result?.population_affected || 0;
      }

      stats.success_rate = completed.length > 0
        ? Math.round((successful / completed.length) * 100)
        : 0;

      return stats;

    } catch (error) {
      logger.error('Error obteniendo estadísticas:', error);
      return null;
    }
  }
}

export default new CrisisService();
