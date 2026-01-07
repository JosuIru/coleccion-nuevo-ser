/**
 * BibliotecaScreen - Prueba de Concepto v1.0
 * Embebe la webapp completa de Colección Nuevo Ser en la mobile app
 *
 * IMPORTANTE: Este es un archivo POC (Proof of Concept)
 * Para usarlo:
 * 1. Renombrar a BibliotecaScreen.js
 * 2. Preparar assets con prepare-biblioteca-assets.sh
 * 3. Agregar al RootNavigator
 *
 * @version 1.0.0
 * @author Claude Sonnet 4.5
 * @date 2025-12-20
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  BackHandler
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { COLORS } from '../config/constants';
import useGameStore from '../stores/gameStore';
import unifiedSyncService from '../services/UnifiedSyncService';
import logger from '../utils/logger';

// URL local de la biblioteca (después de preparar assets)
const BIBLIOTECA_URL = 'file:///android_asset/coleccion/index.html';

const BibliotecaScreen = ({ navigation }) => {
  const webViewRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);
  const [error, setError] = useState(null);
  const [readingStats, setReadingStats] = useState({
    chaptersRead: 0,
    timeSpent: 0,
    xpEarned: 0
  });

  // Store
  const {
    user,
    addXP,
    addFragments,
    updateReadingProgress
  } = useGameStore();

  // Manejar botón back de Android
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (canGoBack && webViewRef.current) {
          webViewRef.current.goBack();
          return true;
        }
        return false;
      };

      BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [canGoBack])
  );

  // Cargar stats y configurar sincronización al montar
  useEffect(() => {
    initializeComponent();

    return () => {
      // Detener auto-sync al desmontar
      unifiedSyncService.stopAutoSync();
    };
  }, []);

  /**
   * Inicializar componente y servicios
   */
  const initializeComponent = async () => {
    logger.info('BibliotecaScreen', '🚀 Inicializando componente...');

    // Inicializar servicio de sincronización
    await unifiedSyncService.initialize();

    // Cargar estadísticas
    await loadReadingStats();

    logger.info('BibliotecaScreen', '✓ Componente inicializado');
  };

  /**
   * Cargar estadísticas de lectura
   */
  const loadReadingStats = async () => {
    try {
      const stats = await AsyncStorage.getItem('reading_stats');
      if (stats) {
        setReadingStats(JSON.parse(stats));
      }
    } catch (error) {
      console.error('[Biblioteca] Error loading stats:', error);
    }
  };

  /**
   * JavaScript inyectado para integración completa
   */
  const injectedJavaScript = `
    (function() {
      console.log('[Biblioteca] 🚀 Inyectando bridge de comunicación...');

      // =====================================================
      // 1. INYECTAR DATOS DEL USUARIO
      // =====================================================
      window.MOBILE_USER = ${JSON.stringify(user)};
      window.IS_MOBILE_APP = true;
      window.GAME_STORE_AVAILABLE = true;

      console.log('[Biblioteca] ✅ Usuario inyectado:', window.MOBILE_USER?.email);

      // =====================================================
      // 2. AJUSTES CSS PARA APP EMBEBIDA
      // =====================================================
      const style = document.createElement('style');
      style.textContent = \`
        /* Ocultar elementos no necesarios en app */
        .app-header-nav,
        .external-links,
        .download-app-buttons,
        .web-only {
          display: none !important;
        }

        /* Padding para tab bar (evitar que quede tapado) */
        body {
          padding-bottom: 80px !important;
        }

        /* Ajustar toasts para que no queden tapados */
        .toast-container,
        #toast-container,
        [class*="toast"] {
          bottom: 100px !important;
        }

        /* Header más compacto en mobile */
        .biblioteca-header,
        .app-header,
        header {
          padding-top: 8px !important;
          padding-bottom: 8px !important;
        }

        /* Fix scroll en WebView */
        html, body {
          touch-action: auto !important;
          -webkit-overflow-scrolling: auto !important;
          overscroll-behavior: auto !important;
        }

        /* Contenedor principal scrollable */
        #app,
        .app-container,
        .main-content {
          touch-action: pan-y !important;
          -webkit-overflow-scrolling: auto !important;
        }

        /* Modales con padding correcto */
        .modal-content,
        .modal-body {
          padding-bottom: 20px !important;
        }

        /* Botones más grandes para touch */
        .btn,
        button {
          min-height: 44px;
          padding: 12px 20px;
        }
      \`;
      document.head.appendChild(style);
      console.log('[Biblioteca] ✅ CSS ajustado para mobile');

      // =====================================================
      // 3. INTERCEPTAR EVENTOS DE LECTURA
      // =====================================================

      // Helper para enviar mensajes a React Native
      const sendToNative = (type, data) => {
        try {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type, data }));
          console.log(\`[Biblioteca] 📤 Mensaje enviado: \${type}\`, data);
        } catch (error) {
          console.error('[Biblioteca] ❌ Error enviando mensaje:', error);
        }
      };

      // Interceptar apertura de capítulo
      window.addEventListener('chapter-opened', (event) => {
        sendToNative('CHAPTER_OPENED', event.detail);
      });

      // Interceptar progreso de lectura
      window.addEventListener('reading-progress-updated', (event) => {
        sendToNative('READING_PROGRESS', event.detail);
      });

      // Interceptar capítulo completado
      window.addEventListener('chapter-completed', (event) => {
        sendToNative('CHAPTER_COMPLETED', event.detail);
      });

      // Interceptar bookmark
      window.addEventListener('bookmark-added', (event) => {
        sendToNative('BOOKMARK_ADDED', event.detail);
      });

      // Interceptar quiz completado
      window.addEventListener('quiz-completed', (event) => {
        sendToNative('QUIZ_COMPLETED', event.detail);
      });

      // Interceptar nota creada
      window.addEventListener('note-created', (event) => {
        sendToNative('NOTE_CREATED', event.detail);
      });

      console.log('[Biblioteca] ✅ Event listeners configurados');

      // =====================================================
      // 4. BRIDGE DE STORAGE (localStorage ↔ AsyncStorage)
      // =====================================================

      // Sincronizar claves importantes a React Native
      const syncStorage = (key, value) => {
        sendToNative('SYNC_STORAGE', { key, value });
      };

      // Interceptar setItem de localStorage
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = function(key, value) {
        originalSetItem.call(this, key, value);

        // Sincronizar solo claves importantes
        if (key.startsWith('reading_progress_') ||
            key.startsWith('bookmarks_') ||
            key.startsWith('quiz_results_') ||
            key.startsWith('user_preferences_') ||
            key.startsWith('notes_')) {
          syncStorage(key, value);
        }
      };

      console.log('[Biblioteca] ✅ Storage bridge configurado');

      // =====================================================
      // 5. FUNCIONES DE UTILIDAD
      // =====================================================

      // Recibir datos desde React Native
      window.updateFromNative = function(key, value) {
        try {
          localStorage.setItem(key, JSON.stringify(value));
          window.dispatchEvent(new CustomEvent('native-data-updated', {
            detail: { key, value }
          }));
          console.log(\`[Biblioteca] 📥 Datos recibidos de native: \${key}\`);
        } catch (error) {
          console.error('[Biblioteca] Error updating from native:', error);
        }
      };

      // Obtener estado actual para debug
      window.getBibliotecaState = function() {
        return {
          user: window.MOBILE_USER,
          isMobileApp: window.IS_MOBILE_APP,
          gameStoreAvailable: window.GAME_STORE_AVAILABLE,
          storageKeys: Object.keys(localStorage).filter(k =>
            k.startsWith('reading_') ||
            k.startsWith('bookmarks_') ||
            k.startsWith('quiz_')
          )
        };
      };

      // Función para recolectar todos los datos sincronizables
      window.collectSyncData = function() {
        const syncData = {};
        const syncKeys = [
          'reading_progress',
          'completed_chapters',
          'bookmarks',
          'reading_time',
          'current_book',
          'chapter_notes',
          'highlights',
          'app_settings',
          'theme_preference',
          'audio_settings'
        ];

        for (const baseKey of syncKeys) {
          // Buscar todas las claves que empiecen con baseKey
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(baseKey)) {
              try {
                const value = localStorage.getItem(key);
                syncData[key] = JSON.parse(value);
              } catch {
                syncData[key] = localStorage.getItem(key);
              }
            }
          }
        }

        return syncData;
      };

      // =====================================================
      // 6. LISTENER PARA MENSAJES DESDE REACT NATIVE
      // =====================================================
      document.addEventListener('message', function(event) {
        try {
          const message = JSON.parse(event.data);
          console.log('[WebView] 📨 Mensaje recibido de RN:', message.type);

          if (message.type === 'SYNC_REQUEST' || message.type === 'FORCE_SYNC') {
            // Enviar todos los datos sincronizables
            const syncData = window.collectSyncData();
            sendToNative('SYNC_DATA', syncData);
          }
        } catch (error) {
          console.error('[WebView] Error procesando mensaje de RN:', error);
        }
      });

      console.log('[Biblioteca] ✅ Listener de mensajes configurado');

      // =====================================================
      // 7. NOTIFICAR QUE WEBVIEW ESTÁ LISTO
      // =====================================================
      sendToNative('WEBVIEW_READY', {
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight
      });

      console.log('[Biblioteca] ✅✅✅ Bridge completamente inyectado y funcional');
      true;
    })();
  `;

  /**
   * Manejar mensajes del WebView
   */
  const handleMessage = (event) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      console.log('[Biblioteca] 📨 Mensaje recibido:', message.type);

      switch (message.type) {
        case 'WEBVIEW_READY':
          handleWebViewReady(message.data);
          break;

        case 'CHAPTER_OPENED':
          handleChapterOpened(message.data);
          break;

        case 'READING_PROGRESS':
          handleReadingProgress(message.data);
          break;

        case 'CHAPTER_COMPLETED':
          handleChapterCompleted(message.data);
          break;

        case 'BOOKMARK_ADDED':
          handleBookmarkAdded(message.data);
          break;

        case 'QUIZ_COMPLETED':
          handleQuizCompleted(message.data);
          break;

        case 'NOTE_CREATED':
          handleNoteCreated(message.data);
          break;

        case 'SYNC_STORAGE':
          handleStorageSync(message.data);
          break;

        case 'SYNC_REQUEST':
        case 'FORCE_SYNC':
          handleSyncRequest(message.data);
          break;

        case 'SYNC_DATA':
          handleSyncData(message.data);
          break;

        default:
          console.log('[Biblioteca] ⚠️ Mensaje desconocido:', message.type);
      }
    } catch (error) {
      console.error('[Biblioteca] ❌ Error procesando mensaje:', error);
    }
  };

  /**
   * WebView listo
   */
  const handleWebViewReady = async (data) => {
    logger.info('BibliotecaScreen', '✅ WebView listo:', data);

    // Inyectar datos iniciales del usuario usando UnifiedSyncService
    await injectUserData();

    // Activar sincronización automática
    unifiedSyncService.startAutoSync(webViewRef);

    logger.info('BibliotecaScreen', '🔄 Auto-sync activado');
  };

  /**
   * Inyectar datos del usuario en el WebView
   */
  const injectUserData = async () => {
    try {
      logger.info('BibliotecaScreen', '💉 Inyectando datos iniciales...');

      // Obtener todos los datos sincronizables desde UnifiedSyncService
      const webViewData = await unifiedSyncService.syncToWebView();

      if (webViewRef.current && Object.keys(webViewData).length > 0) {
        // Inyectar datos en batch
        const js = `
          (function() {
            const data = ${JSON.stringify(webViewData)};

            for (const [key, value] of Object.entries(data)) {
              try {
                window.updateFromNative(key, value);
              } catch (error) {
                console.error('[WebView] Error updating ' + key, error);
              }
            }

            console.log('[WebView] ✅ ' + Object.keys(data).length + ' items sincronizados desde native');
            true;
          })();
        `;

        webViewRef.current.injectJavaScript(js);
        logger.info('BibliotecaScreen', `✓ ${Object.keys(webViewData).length} items inyectados`);
      } else {
        logger.info('BibliotecaScreen', 'Sin datos para inyectar');
      }
    } catch (error) {
      logger.error('BibliotecaScreen', 'Error inyectando datos', error);
    }
  };

  /**
   * Solicitud de sincronización desde WebView
   */
  const handleSyncRequest = async (data) => {
    logger.info('BibliotecaScreen', '🔄 Solicitud de sync recibida');

    // Enviar datos actuales al WebView
    await injectUserData();
  };

  /**
   * Datos completos de sincronización desde WebView
   */
  const handleSyncData = async (data) => {
    logger.info('BibliotecaScreen', '📦 Datos de sync recibidos desde WebView');

    // Sincronizar con UnifiedSyncService
    await unifiedSyncService.syncFromWebView(data);
  };

  /**
   * Sincronizar item individual de storage
   */
  const handleStorageSync = async (data) => {
    const { key, value } = data;

    try {
      // Guardar en AsyncStorage con prefijo
      await AsyncStorage.setItem(`webapp_${key}`, value);
      logger.info('BibliotecaScreen', `📝 Storage sync: ${key}`);

      // Sincronizar también con UnifiedSyncService si es clave importante
      if (key.startsWith('reading_progress_') ||
          key.startsWith('bookmarks_') ||
          key.startsWith('quiz_results_')) {
        await unifiedSyncService.syncFromWebView({ [key]: JSON.parse(value) });
      }
    } catch (error) {
      logger.error('BibliotecaScreen', `Error sync storage ${key}`, error);
    }
  };

  /**
   * Capítulo abierto
   */
  const handleChapterOpened = (data) => {
    console.log('[Biblioteca] 📖 Capítulo abierto:', data);

    // Track con analytics
    if (window.analyticsHelper) {
      window.analyticsHelper.trackChapterStart(
        data.bookId,
        data.chapterId,
        data.chapterTitle
      );
    }
  };

  /**
   * Progreso de lectura actualizado
   */
  const handleReadingProgress = async (data) => {
    const { bookId, chapterId, progress, timeSpent } = data;

    // Actualizar gameStore
    updateReadingProgress({
      bookId,
      chapterId,
      progress,
      timeSpent
    });

    // Guardar en AsyncStorage
    const key = `reading_progress_${bookId}_${chapterId}`;
    await AsyncStorage.setItem(key, JSON.stringify(data));

    console.log('[Biblioteca] 📊 Progreso guardado:', `${progress}%`);
  };

  /**
   * Capítulo completado - ⭐ SISTEMA DE RECOMPENSAS
   */
  const handleChapterCompleted = async (data) => {
    const { bookId, chapterId, chapterTitle, totalTime } = data;

    console.log('[Biblioteca] 🎉 ¡Capítulo completado!', data);

    // ========================================
    // CALCULAR RECOMPENSAS
    // ========================================

    // 1. XP Base por capítulo (50)
    const baseXP = 50;

    // 2. Bonus por tiempo dedicado (más tiempo = más engagement)
    //    1 min = +1 XP, max +30 XP
    const timeBonus = Math.min(Math.floor(totalTime / 60), 30);

    // 3. Bonus por racha consecutiva de lectura
    const streakBonus = await calculateReadingStreak();

    // 4. XP TOTAL
    const totalXP = baseXP + timeBonus + streakBonus;

    // 5. Fragmentos de atributos según temática del libro
    const fragments = getBookFragments(bookId);

    // ========================================
    // APLICAR RECOMPENSAS AL GAME STORE
    // ========================================

    // Agregar XP
    addXP(totalXP);

    // Agregar fragmentos de atributos
    if (fragments && fragments.length > 0) {
      addFragments(fragments);
    }

    // Actualizar estadísticas de lectura
    const newStats = {
      ...readingStats,
      chaptersRead: readingStats.chaptersRead + 1,
      timeSpent: readingStats.timeSpent + totalTime,
      xpEarned: readingStats.xpEarned + totalXP
    };
    setReadingStats(newStats);
    await AsyncStorage.setItem('reading_stats', JSON.stringify(newStats));

    // ========================================
    // MOSTRAR NOTIFICACIÓN DE RECOMPENSA
    // ========================================

    const fragmentNames = fragments.map(f => formatFragmentName(f)).join('\n   • ');

    Alert.alert(
      '🎉 ¡Capítulo Completado!',
      `"${chapterTitle}"\n\n` +
      `⭐ +${totalXP} XP ganados\n` +
      `   • Base: ${baseXP} XP\n` +
      `   • Tiempo dedicado: +${timeBonus} XP\n` +
      (streakBonus > 0 ? `   • Racha de lectura: +${streakBonus} XP\n` : '') +
      `\n🧩 Fragmentos obtenidos:\n   • ${fragmentNames}\n\n` +
      `📊 Total capítulos leídos: ${newStats.chaptersRead}`,
      [
        {
          text: 'Ver Mi Progreso',
          onPress: () => navigation.navigate('Profile')
        },
        {
          text: 'Seguir Leyendo',
          style: 'cancel'
        }
      ]
    );

    // Track analytics
    if (window.analyticsHelper) {
      window.analyticsHelper.trackChapterComplete(
        bookId,
        chapterId,
        totalTime
      );
    }

    console.log('[Biblioteca] ⭐ Recompensas aplicadas:', { totalXP, fragments });
  };

  /**
   * Bookmark agregado
   */
  const handleBookmarkAdded = async (data) => {
    const { bookId, chapterId, text } = data;

    // Guardar bookmark en AsyncStorage
    const key = `bookmarks_${bookId}`;
    const existing = await AsyncStorage.getItem(key);
    const bookmarks = existing ? JSON.parse(existing) : [];

    bookmarks.push({
      chapterId,
      text,
      createdAt: new Date().toISOString()
    });

    await AsyncStorage.setItem(key, JSON.stringify(bookmarks));

    console.log('[Biblioteca] 🔖 Bookmark guardado');
  };

  /**
   * Quiz completado
   */
  const handleQuizCompleted = async (data) => {
    const { quizId, score, totalQuestions } = data;

    const percentage = (score / totalQuestions) * 100;

    // Bonus XP por quiz perfecto (100%)
    if (percentage === 100) {
      const bonusXP = 20;
      addXP(bonusXP);

      Alert.alert(
        '🏆 ¡Quiz Perfecto!',
        `Has respondido ${score}/${totalQuestions} correctamente\n\n` +
        `⭐ +${bonusXP} XP de bonus`
      );
    }

    // Guardar resultado
    const key = `quiz_result_${quizId}`;
    await AsyncStorage.setItem(key, JSON.stringify({
      score,
      totalQuestions,
      percentage,
      completedAt: new Date().toISOString()
    }));

    console.log('[Biblioteca] 📝 Quiz completado:', `${percentage}%`);
  };

  /**
   * Nota creada
   */
  const handleNoteCreated = async (data) => {
    const { bookId, chapterId, note } = data;

    const key = `notes_${bookId}_${chapterId}`;
    const existing = await AsyncStorage.getItem(key);
    const notes = existing ? JSON.parse(existing) : [];

    notes.push({
      note,
      createdAt: new Date().toISOString()
    });

    await AsyncStorage.setItem(key, JSON.stringify(notes));

    console.log('[Biblioteca] 📝 Nota guardada');
  };

  /**
   * Calcular racha de lectura consecutiva (días)
   */
  const calculateReadingStreak = async () => {
    try {
      const key = 'reading_streak_data';
      const data = await AsyncStorage.getItem(key);

      if (!data) return 0;

      const streakData = JSON.parse(data);
      const today = new Date().toDateString();
      const lastRead = new Date(streakData.lastReadDate).toDateString();

      // Si es el mismo día, mantener racha
      if (today === lastRead) {
        return streakData.currentStreak * 5; // +5 XP por día de racha
      }

      // Si es día consecutivo, incrementar racha
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      if (lastRead === yesterday.toDateString()) {
        const newStreak = streakData.currentStreak + 1;
        await AsyncStorage.setItem(key, JSON.stringify({
          currentStreak: newStreak,
          maxStreak: Math.max(newStreak, streakData.maxStreak || 0),
          lastReadDate: new Date().toISOString()
        }));
        return newStreak * 5;
      }

      // Racha rota, reiniciar
      await AsyncStorage.setItem(key, JSON.stringify({
        currentStreak: 1,
        maxStreak: streakData.maxStreak || 0,
        lastReadDate: new Date().toISOString()
      }));
      return 0;
    } catch (error) {
      console.error('[Biblioteca] Error calculando racha:', error);
      return 0;
    }
  };

  /**
   * Obtener fragmentos de atributos según libro
   */
  const getBookFragments = (bookId) => {
    const fragmentMap = {
      'manual-practico': ['compassion', 'wisdom'],
      'toolkit-transicion': ['creativity', 'resilience'],
      'guia-acciones': ['courage', 'determination'],
      'practicas-radicales': ['mindfulness', 'presence'],
      'filosofia-nuevo-ser': ['wisdom', 'understanding'],
      'tierra-que-despierta': ['connection', 'awareness'],
      'dialogos-maquina': ['curiosity', 'integration'],
      'frankenstein-nuevo-ser': ['creation', 'responsibility'],
      'ahora-instituciones': ['organization', 'collaboration']
    };

    return fragmentMap[bookId] || ['awareness'];
  };

  /**
   * Formatear nombre de fragmento en español
   */
  const formatFragmentName = (fragment) => {
    const names = {
      compassion: 'Compasión',
      wisdom: 'Sabiduría',
      creativity: 'Creatividad',
      resilience: 'Resiliencia',
      courage: 'Coraje',
      determination: 'Determinación',
      mindfulness: 'Atención Plena',
      presence: 'Presencia',
      understanding: 'Comprensión',
      connection: 'Conexión',
      awareness: 'Consciencia',
      curiosity: 'Curiosidad',
      integration: 'Integración',
      creation: 'Creación',
      responsibility: 'Responsabilidad',
      organization: 'Organización',
      collaboration: 'Colaboración'
    };

    return names[fragment] || fragment;
  };

  /**
   * Recargar WebView
   */
  const handleReload = () => {
    setError(null);
    setLoading(true);
    webViewRef.current?.reload();
  };

  /**
   * Renderizar pantalla de error
   */
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>📚</Text>
        <Text style={styles.errorTitle}>Error cargando biblioteca</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleReload}>
          <Text style={styles.retryButtonText}>🔄 Reintentar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.helpButton}
          onPress={() => navigation.navigate('Help')}
        >
          <Text style={styles.helpButtonText}>❓ Ver Ayuda</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header con stats de lectura */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📚 Biblioteca</Text>
        <View style={styles.statsRow}>
          <Text style={styles.statText}>{readingStats.chaptersRead} caps</Text>
          <Text style={styles.statText}>⭐ {readingStats.xpEarned} XP</Text>
        </View>
        <TouchableOpacity onPress={handleReload} style={styles.reloadButton}>
          <Text style={styles.reloadIcon}>🔄</Text>
        </TouchableOpacity>
      </View>

      {/* WebView principal */}
      <View style={styles.webviewContainer}>
        <WebView
          ref={webViewRef}
          source={{ uri: BIBLIOTECA_URL }}
          style={styles.webview}
          injectedJavaScript={injectedJavaScript}
          onMessage={handleMessage}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onNavigationStateChange={(navState) => {
            setCanGoBack(navState.canGoBack);
          }}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            setError(nativeEvent.description || 'Error cargando la biblioteca');
            setLoading(false);
          }}
          onHttpError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            if (nativeEvent.statusCode >= 400) {
              setError(`Error HTTP: ${nativeEvent.statusCode}`);
            }
          }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          cacheEnabled={true}
          allowFileAccess={true}
          allowFileAccessFromFileURLs={true}
          allowUniversalAccessFromFileURLs={true}
          originWhitelist={['*']}
          nestedScrollEnabled={true}
          scrollEnabled={true}
          showsVerticalScrollIndicator={true}
          bounces={true}
          contentInsetAdjustmentBehavior="automatic"
          automaticallyAdjustContentInsets={true}
          decelerationRate="normal"
        />
      </View>

      {/* Loading overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.accent.primary} />
          <Text style={styles.loadingText}>Cargando biblioteca...</Text>
          <Text style={styles.loadingSubtext}>
            {readingStats.chaptersRead > 0
              ? `Has leído ${readingStats.chaptersRead} capítulos`
              : 'Tu viaje comienza aquí'}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg.primary
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 36,
    paddingBottom: 8,
    paddingHorizontal: 12,
    backgroundColor: COLORS.bg.elevated,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.accent.primary + '30'
  },

  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text.primary
  },

  statsRow: {
    flexDirection: 'row',
    gap: 12
  },

  statText: {
    fontSize: 12,
    color: COLORS.text.secondary
  },

  reloadButton: {
    padding: 6
  },

  reloadIcon: {
    fontSize: 18
  },

  webviewContainer: {
    flex: 1
  },

  webview: {
    flex: 1,
    backgroundColor: COLORS.bg.primary
  },

  loadingOverlay: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    bottom: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.bg.primary + 'EE'
  },

  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: COLORS.text.secondary
  },

  loadingSubtext: {
    marginTop: 8,
    fontSize: 12,
    color: COLORS.text.tertiary
  },

  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: COLORS.bg.primary
  },

  errorIcon: {
    fontSize: 64,
    marginBottom: 16
  },

  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 8
  },

  errorText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: 24
  },

  retryButton: {
    backgroundColor: COLORS.accent.primary,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    marginBottom: 12
  },

  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff'
  },

  helpButton: {
    backgroundColor: COLORS.bg.elevated,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8
  },

  helpButtonText: {
    fontSize: 14,
    color: COLORS.text.secondary
  }
});

export default BibliotecaScreen;
