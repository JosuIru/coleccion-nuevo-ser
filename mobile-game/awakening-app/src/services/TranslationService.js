/**
 * TranslationService.js
 *
 * Servicio de traducción con múltiples APIs de respaldo.
 * Intenta varios proveedores gratuitos para asegurar la traducción.
 *
 * APIs utilizadas (en orden de prioridad):
 * 1. Lingva Translate (proxy gratuito de Google Translate)
 * 2. MyMemory API (5,000 palabras/día gratis)
 * 3. LibreTranslate (instancias públicas gratuitas)
 *
 * @version 2.0.0
 * @date 2025-12-23
 */

import { logger } from '../utils/logger';

// Caché en memoria para traducciones
const translationCache = new Map();

// Configuración
const CONFIG = {
  SOURCE_LANG: 'en',
  TARGET_LANG: 'es',
  MAX_TEXT_LENGTH: 500,
  CACHE_SIZE_LIMIT: 500,
  REQUEST_TIMEOUT: 8000,
  RETRY_DELAY: 200
};

// APIs de traducción disponibles
const TRANSLATION_APIS = {
  // Lingva - Proxy gratuito de Google Translate (sin límites)
  lingva: {
    name: 'Lingva',
    translate: async (text, sourceLang, targetLang) => {
      const url = `https://lingva.ml/api/v1/${sourceLang}/${targetLang}/${encodeURIComponent(text)}`;
      const response = await fetchWithTimeout(url, CONFIG.REQUEST_TIMEOUT);
      const data = await response.json();
      if (data.translation) {
        return data.translation;
      }
      throw new Error('Lingva: No translation in response');
    }
  },

  // Lingva alternativo (otro servidor)
  lingva_alt: {
    name: 'Lingva Alt',
    translate: async (text, sourceLang, targetLang) => {
      const url = `https://translate.plausibility.cloud/api/v1/${sourceLang}/${targetLang}/${encodeURIComponent(text)}`;
      const response = await fetchWithTimeout(url, CONFIG.REQUEST_TIMEOUT);
      const data = await response.json();
      if (data.translation) {
        return data.translation;
      }
      throw new Error('Lingva Alt: No translation in response');
    }
  },

  // MyMemory - 5,000 palabras/día gratis
  mymemory: {
    name: 'MyMemory',
    translate: async (text, sourceLang, targetLang) => {
      const params = new URLSearchParams({
        q: text,
        langpair: `${sourceLang}|${targetLang}`
      });
      const url = `https://api.mymemory.translated.net/get?${params.toString()}`;
      const response = await fetchWithTimeout(url, CONFIG.REQUEST_TIMEOUT);
      const data = await response.json();
      if (data.responseStatus === 200 && data.responseData?.translatedText) {
        // MyMemory a veces devuelve el texto original si alcanza el límite
        const translated = data.responseData.translatedText;
        if (translated.toUpperCase() === text.toUpperCase()) {
          throw new Error('MyMemory: Possible rate limit (returned original text)');
        }
        return translated;
      }
      throw new Error(`MyMemory: ${data.responseDetails || 'Unknown error'}`);
    }
  },

  // LibreTranslate - Instancia pública gratuita
  libretranslate: {
    name: 'LibreTranslate',
    translate: async (text, sourceLang, targetLang) => {
      const url = 'https://libretranslate.com/translate';
      const response = await fetchWithTimeout(url, CONFIG.REQUEST_TIMEOUT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          q: text,
          source: sourceLang,
          target: targetLang
        })
      });
      const data = await response.json();
      if (data.translatedText) {
        return data.translatedText;
      }
      throw new Error('LibreTranslate: No translation in response');
    }
  }
};

// Orden de prioridad de APIs
const API_PRIORITY = ['lingva', 'lingva_alt', 'mymemory', 'libretranslate'];

/**
 * Fetch con timeout
 */
async function fetchWithTimeout(url, timeout, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

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
    const keysToDelete = Array.from(translationCache.keys()).slice(0, 100);
    keysToDelete.forEach(key => translationCache.delete(key));
    logger.debug('TranslationService', 'Cache cleaned');
  }
};

/**
 * Espera un tiempo determinado
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Traduce un texto intentando múltiples APIs
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

  // Si el texto ya parece estar en español, no traducir
  if (!isEnglish(trimmedText)) {
    return trimmedText;
  }

  // Verificar caché
  const cacheKey = getCacheKey(trimmedText, targetLang);
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey);
  }

  // Truncar si es muy largo
  const textToTranslate = trimmedText.length > CONFIG.MAX_TEXT_LENGTH
    ? trimmedText.substring(0, CONFIG.MAX_TEXT_LENGTH) + '...'
    : trimmedText;

  // Intentar cada API en orden de prioridad
  let lastError = null;

  for (const apiKey of API_PRIORITY) {
    const api = TRANSLATION_APIS[apiKey];

    try {
      logger.debug('TranslationService', `Trying ${api.name}...`);

      const translatedText = await api.translate(
        textToTranslate,
        CONFIG.SOURCE_LANG,
        targetLang
      );

      // Éxito - guardar en caché
      cleanCacheIfNeeded();
      translationCache.set(cacheKey, translatedText);

      logger.debug('TranslationService', `Success with ${api.name}`);
      return translatedText;

    } catch (error) {
      logger.warn('TranslationService', `${api.name} failed:`, error.message);
      lastError = error;

      // Pequeño delay antes de intentar siguiente API
      await delay(CONFIG.RETRY_DELAY);
    }
  }

  // Si todas las APIs fallan, devolver texto original
  logger.error('TranslationService', 'All APIs failed, returning original text');
  return trimmedText;
};

/**
 * Traduce un objeto de crisis (título y descripción)
 * @param {Object} crisis - Objeto de crisis con title y description
 * @returns {Promise<Object>} - Crisis con textos traducidos
 */
export const translateCrisis = async (crisis) => {
  if (!crisis) return crisis;

  try {
    // Traducir título y descripción en paralelo
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
    logger.error('TranslationService', 'Crisis translation error:', error);
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
export const translateCrises = async (crises, maxConcurrent = 2) => {
  if (!crises || crises.length === 0) return crises;

  logger.debug('TranslationService', `Translating ${crises.length} crises...`);

  const results = [];

  // Procesar en lotes pequeños para no saturar
  for (let i = 0; i < crises.length; i += maxConcurrent) {
    const batch = crises.slice(i, i + maxConcurrent);
    const translatedBatch = await Promise.all(batch.map(translateCrisis));
    results.push(...translatedBatch);

    // Delay entre lotes
    if (i + maxConcurrent < crises.length) {
      await delay(300);
    }

    // Log progreso
    logger.debug('TranslationService', `Progress: ${results.length}/${crises.length}`);
  }

  const successCount = results.filter(c => c.translated).length;
  logger.info('TranslationService', `Complete: ${successCount}/${crises.length} translated`);

  return results;
};

/**
 * Detecta si un texto está en inglés (heurística mejorada)
 * @param {string} text - Texto a analizar
 * @returns {boolean} - true si parece estar en inglés
 */
export const isEnglish = (text) => {
  if (!text) return false;

  // Palabras muy comunes en inglés que rara vez aparecen en español
  const englishIndicators = [
    'the', 'and', 'for', 'with', 'from', 'have', 'has', 'been',
    'will', 'would', 'could', 'should', 'their', 'this', 'that',
    'which', 'about', 'after', 'before', 'between', 'through',
    'said', 'says', 'according', 'people', 'government', 'report'
  ];

  // Palabras comunes en español
  const spanishIndicators = [
    'el', 'la', 'los', 'las', 'de', 'del', 'que', 'en', 'es',
    'por', 'con', 'para', 'como', 'más', 'pero', 'sus', 'una', 'uno'
  ];

  const lowerText = text.toLowerCase();
  const words = lowerText.split(/\s+/);

  let englishCount = 0;
  let spanishCount = 0;

  for (const word of words) {
    if (englishIndicators.includes(word)) englishCount++;
    if (spanishIndicators.includes(word)) spanishCount++;
  }

  // Si hay más palabras españolas, no es inglés
  if (spanishCount > englishCount) return false;

  // Si más del 8% son palabras inglesas comunes, probablemente es inglés
  return (englishCount / words.length) > 0.08;
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
  logger.debug('TranslationService', 'Cache cleared');
};

/**
 * Prueba todas las APIs disponibles
 * @returns {Promise<Object>} - Estado de cada API
 */
export const testAPIs = async () => {
  const testText = 'Hello world';
  const results = {};

  for (const [key, api] of Object.entries(TRANSLATION_APIS)) {
    try {
      const start = Date.now();
      const translated = await api.translate(testText, 'en', 'es');
      const duration = Date.now() - start;

      results[key] = {
        name: api.name,
        status: 'ok',
        result: translated,
        duration: `${duration}ms`
      };
    } catch (error) {
      results[key] = {
        name: api.name,
        status: 'error',
        error: error.message
      };
    }
  }

  return results;
};

// Exportar servicio como objeto
const translationService = {
  translateText,
  translateCrisis,
  translateCrises,
  isEnglish,
  getCacheStats,
  clearCache,
  testAPIs
};

export default translationService;
