/**
 * TranslationService.js
 *
 * Servicio de traducción gratuito usando MyMemory API.
 * Traduce textos de inglés a español con caché para optimizar llamadas.
 *
 * API: https://mymemory.translated.net/doc/spec.php
 * Límite: 5,000 palabras/día (sin API key)
 *
 * @version 1.0.0
 * @date 2025-12-17
 */

// Caché en memoria para traducciones
const translationCache = new Map();

// Configuración
const CONFIG = {
  API_URL: 'https://api.mymemory.translated.net/get',
  SOURCE_LANG: 'en',
  TARGET_LANG: 'es',
  MAX_TEXT_LENGTH: 500, // MyMemory limit per request
  CACHE_SIZE_LIMIT: 500, // Máximo de traducciones en caché
  REQUEST_DELAY: 100, // ms entre requests para no saturar
  TIMEOUT: 10000 // 10 segundos timeout
};

/**
 * Genera una clave de caché para un texto
 */
const getCacheKey = (text, targetLang) => {
  return `${targetLang}:${text.substring(0, 100)}`;
};

/**
 * Limpia el caché si excede el límite
 */
const cleanCacheIfNeeded = () => {
  if (translationCache.size > CONFIG.CACHE_SIZE_LIMIT) {
    // Eliminar las primeras 100 entradas (más antiguas)
    const keysToDelete = Array.from(translationCache.keys()).slice(0, 100);
    keysToDelete.forEach(key => translationCache.delete(key));
    console.log('[TranslationService] Cache cleaned, removed', keysToDelete.length, 'entries');
  }
};

/**
 * Espera un tiempo determinado
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Traduce un texto de inglés a español
 * @param {string} text - Texto a traducir
 * @param {string} targetLang - Idioma destino (default: 'es')
 * @returns {Promise<string>} - Texto traducido
 */
export const translateText = async (text, targetLang = CONFIG.TARGET_LANG) => {
  // Validar entrada
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return text;
  }

  const trimmedText = text.trim();

  // Verificar caché
  const cacheKey = getCacheKey(trimmedText, targetLang);
  if (translationCache.has(cacheKey)) {
    console.log('[TranslationService] Cache hit');
    return translationCache.get(cacheKey);
  }

  try {
    // Truncar si es muy largo
    const textToTranslate = trimmedText.length > CONFIG.MAX_TEXT_LENGTH
      ? trimmedText.substring(0, CONFIG.MAX_TEXT_LENGTH) + '...'
      : trimmedText;

    // Construir URL
    const params = new URLSearchParams({
      q: textToTranslate,
      langpair: `${CONFIG.SOURCE_LANG}|${targetLang}`
    });

    const url = `${CONFIG.API_URL}?${params.toString()}`;

    // Hacer petición con timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const data = await response.json();

    // Verificar respuesta
    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      const translatedText = data.responseData.translatedText;

      // Guardar en caché
      cleanCacheIfNeeded();
      translationCache.set(cacheKey, translatedText);

      console.log('[TranslationService] Translated:', trimmedText.substring(0, 30), '...');
      return translatedText;
    }

    // Si hay error en la respuesta, devolver original
    console.warn('[TranslationService] API error:', data.responseStatus, data.responseDetails);
    return trimmedText;

  } catch (error) {
    if (error.name === 'AbortError') {
      console.warn('[TranslationService] Request timeout');
    } else {
      console.error('[TranslationService] Translation error:', error.message);
    }
    // En caso de error, devolver texto original
    return trimmedText;
  }
};

/**
 * Traduce múltiples textos con delay entre peticiones
 * @param {string[]} texts - Array de textos a traducir
 * @param {string} targetLang - Idioma destino
 * @returns {Promise<string[]>} - Array de textos traducidos
 */
export const translateBatch = async (texts, targetLang = CONFIG.TARGET_LANG) => {
  const results = [];

  for (let i = 0; i < texts.length; i++) {
    const translated = await translateText(texts[i], targetLang);
    results.push(translated);

    // Pequeño delay entre peticiones para no saturar API
    if (i < texts.length - 1) {
      await delay(CONFIG.REQUEST_DELAY);
    }
  }

  return results;
};

/**
 * Traduce un objeto de crisis (título y descripción)
 * @param {Object} crisis - Objeto de crisis con title y description
 * @returns {Promise<Object>} - Crisis con textos traducidos
 */
export const translateCrisis = async (crisis) => {
  if (!crisis) return crisis;

  try {
    const [translatedTitle, translatedDescription] = await Promise.all([
      translateText(crisis.title || ''),
      translateText(crisis.description || '')
    ]);

    return {
      ...crisis,
      title: translatedTitle,
      description: translatedDescription,
      originalTitle: crisis.title,
      originalDescription: crisis.description,
      translated: true
    };
  } catch (error) {
    console.error('[TranslationService] Crisis translation error:', error);
    return {
      ...crisis,
      translated: false
    };
  }
};

/**
 * Traduce un array de crisis
 * @param {Object[]} crises - Array de crisis
 * @param {number} maxConcurrent - Máximo de traducciones simultáneas
 * @returns {Promise<Object[]>} - Crisis traducidas
 */
export const translateCrises = async (crises, maxConcurrent = 3) => {
  if (!crises || crises.length === 0) return crises;

  console.log('[TranslationService] Translating', crises.length, 'crises...');

  const results = [];

  // Procesar en lotes para no saturar
  for (let i = 0; i < crises.length; i += maxConcurrent) {
    const batch = crises.slice(i, i + maxConcurrent);
    const translatedBatch = await Promise.all(batch.map(translateCrisis));
    results.push(...translatedBatch);

    // Delay entre lotes
    if (i + maxConcurrent < crises.length) {
      await delay(CONFIG.REQUEST_DELAY * 2);
    }
  }

  console.log('[TranslationService] Translation complete');
  return results;
};

/**
 * Detecta si un texto está en inglés (heurística simple)
 * @param {string} text - Texto a analizar
 * @returns {boolean} - true si parece estar en inglés
 */
export const isEnglish = (text) => {
  if (!text) return false;

  // Palabras comunes en inglés que rara vez aparecen en español
  const englishIndicators = [
    'the', 'and', 'for', 'with', 'from', 'have', 'has', 'been',
    'will', 'would', 'could', 'should', 'their', 'this', 'that',
    'which', 'about', 'after', 'before', 'between', 'through'
  ];

  const lowerText = text.toLowerCase();
  const words = lowerText.split(/\s+/);

  let englishWordCount = 0;
  for (const word of words) {
    if (englishIndicators.includes(word)) {
      englishWordCount++;
    }
  }

  // Si más del 10% son palabras inglesas comunes, probablemente es inglés
  return (englishWordCount / words.length) > 0.1;
};

/**
 * Obtiene estadísticas del caché
 */
export const getCacheStats = () => {
  return {
    size: translationCache.size,
    limit: CONFIG.CACHE_SIZE_LIMIT
  };
};

/**
 * Limpia el caché manualmente
 */
export const clearCache = () => {
  translationCache.clear();
  console.log('[TranslationService] Cache cleared');
};

// Exportar servicio como objeto
const translationService = {
  translateText,
  translateBatch,
  translateCrisis,
  translateCrises,
  isEnglish,
  getCacheStats,
  clearCache
};

export default translationService;
