/**
 * FrankensteinLabScreen.js
 *
 * Pantalla que embebe el Laboratorio Frankenstein como WebView.
 * Permite crear seres directamente en la app móvil.
 *
 * @version 1.0.0
 */

import React, { useRef, useState, useCallback } from 'react';
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

import { COLORS } from '../config/constants';
import useGameStore from '../stores/gameStore';
import { CardRevealModal } from '../components/cards';
import soundService from '../services/SoundService';

// URL del laboratorio - cargado desde assets locales
const LAB_URL = 'file:///android_asset/frankenstein/index.html';

const FrankensteinLabScreen = ({ navigation }) => {
  const webViewRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);
  const [error, setError] = useState(null);
  const [showCardReveal, setShowCardReveal] = useState(false);
  const [revealedBeing, setRevealedBeing] = useState(null);

  // Store
  const { addBeing } = useGameStore();

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

  /**
   * JavaScript inyectado para comunicación WebView -> React Native
   */
  const injectedJavaScript = `
    (function() {
      // Inyectar CSS para ajustar posición de toasts y FIX SCROLL en app embebida
      const style = document.createElement('style');
      style.textContent = \`
        .toast-container,
        .toast {
          bottom: 70px !important;
        }
        /* Ajustar modales para no quedar tapados */
        .modal-footer {
          padding-bottom: 20px !important;
        }
        /* Marcar que estamos en app embebida - añadir padding inferior */
        body {
          --embedded-app-bottom-padding: 16px;
          padding-bottom: 16px !important;
        }

        /* Asegurar que el contenedor principal tenga espacio inferior */
        #app, .app-container, .main-content, #organism-container {
          padding-bottom: 20px !important;
        }

        /* Header más compacto en modo embebido */
        .lab-header, .frankenstein-header, header {
          padding-top: 8px !important;
          padding-bottom: 8px !important;
        }

        /* ===== FIX SCROLL PARA WEBVIEW EMBEBIDO ===== */
        /* Resetear touch-action problemáticos */
        html, body {
          touch-action: auto !important;
          overscroll-behavior: auto !important;
          -webkit-overflow-scrolling: auto !important;
        }

        /* El contenedor principal debe permitir scroll nativo */
        #lab-workspace,
        .lab-workspace,
        [class*="workspace"] {
          touch-action: pan-y pan-x !important;
          -webkit-overflow-scrolling: auto !important;
          overscroll-behavior-y: auto !important;
        }

        /* Forzar scroll suave en contenedores scrollables */
        .scrollable,
        [style*="overflow"],
        .modal-body,
        .bottom-sheet-content {
          -webkit-overflow-scrolling: auto !important;
          touch-action: pan-y !important;
          overscroll-behavior: contain !important;
        }

        /* Evitar que elementos bloqueen el scroll */
        .panel, .card, .mission-card, .being-card {
          touch-action: auto !important;
        }

        /* ===== RESTAURAR ELEMENTOS OCULTOS POR MOBILE-SIMPLE.CSS ===== */
        /* Mostrar modal de requerimientos/conocimientos */
        .requirements-modal,
        .mission-requirements,
        .mission-requirements-summary,
        .requirements-summary-progress,
        .requirements-list-mini,
        .view-all-requirements,
        [class*="requirement"] {
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
        }

        /* Mostrar títulos de capítulos */
        .chapter-title,
        .mobile-chapter-title,
        .book-chapter-title,
        [class*="chapter-title"],
        .chapter-header,
        .chapter-name {
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
        }

        /* Mostrar quizzes y preguntas */
        .quiz-modal,
        .quiz-modal-overlay,
        .quiz-container,
        .quiz-question,
        .quiz-options,
        .quiz-btn,
        [class*="quiz"] {
          visibility: visible !important;
          opacity: 1 !important;
        }

        .quiz-modal-overlay.active {
          display: flex !important;
        }

        /* Asegurar que los paneles de conocimientos sean visibles */
        .knowledge-panel,
        .being-panels .mission-requirements-summary,
        .being-panels .requirements-summary-progress,
        .being-panels .requirements-list-mini {
          display: flex !important;
          visibility: visible !important;
        }

        /* Mostrar indicadores de progreso de conocimientos */
        .progress-bar,
        .knowledge-progress,
        .attribute-progress {
          display: block !important;
          visibility: visible !important;
        }
      \`;
      document.head.appendChild(style);

      // Interceptar cuando se crea un ser
      window.sendBeingToApp = function(beingData) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'BEING_CREATED',
          data: beingData
        }));
      };

      // Agregar botón de envío a la app si existe el UI
      const checkAndAddButton = () => {
        if (window.frankensteinLabUI && !window.appButtonAdded) {
          // Interceptar el guardado de seres
          const originalSave = window.frankensteinLabUI.saveBeingWithPrompt;
          if (originalSave) {
            window.frankensteinLabUI.saveBeingWithPrompt = function() {
              originalSave.call(this);
              // Enviar a la app después de guardar
              if (this.currentBeing) {
                const beingData = {
                  name: this.currentBeing.name || this.selectedMission?.name || 'Ser',
                  attributes: this.currentBeing.attributes,
                  totalPower: this.currentBeing.totalPower,
                  balance: this.currentBeing.balance,
                  missionId: this.selectedMission?.id,
                  missionName: this.selectedMission?.name,
                  createdAt: new Date().toISOString()
                };
                window.sendBeingToApp(beingData);
              }
            };
          }
          window.appButtonAdded = true;
        }
      };

      // Verificar periódicamente hasta que el UI esté listo
      const interval = setInterval(() => {
        checkAndAddButton();
        if (window.appButtonAdded) {
          clearInterval(interval);
        }
      }, 1000);

      // Limpiar después de 30 segundos
      setTimeout(() => clearInterval(interval), 30000);

      // Notificar que la app está lista
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'WEBVIEW_READY'
      }));

      true;
    })();
  `;

  /**
   * Manejar mensajes del WebView
   */
  const handleMessage = (event) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);

      switch (message.type) {
        case 'BEING_CREATED':
          handleBeingCreated(message.data);
          break;

        case 'WEBVIEW_READY':
          console.log('[FrankensteinLab] WebView ready');
          break;

        default:
          console.log('[FrankensteinLab] Unknown message:', message.type);
      }
    } catch (error) {
      console.error('[FrankensteinLab] Error parsing message:', error);
    }
  };

  /**
   * Manejar cuando se crea un ser en el lab
   */
  const handleBeingCreated = (beingData) => {
    console.log('[FrankensteinLab] Being created:', beingData);

    // Normalizar atributos
    const normalizedAttributes = normalizeAttributes(beingData.attributes || {});

    // Seleccionar avatar
    const avatar = selectAvatar(normalizedAttributes);

    // Crear el ser para el juego con sistema de progresión mejorado
    const newBeing = {
      id: beingData.id || `lab_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name: beingData.name || 'Ser del Laboratorio',
      avatar: avatar,
      status: 'available',
      currentMission: null,

      // Sistema de progresión
      level: beingData.level || 1,
      experience: beingData.xp || 0,
      xpToNextLevel: beingData.xpToNextLevel || 100,

      // Sistema de energía por ser
      energy: beingData.energy || 100,
      maxEnergy: beingData.maxEnergy || 100,
      lastEnergyUpdate: Date.now(),

      // Turnos de misión
      turnsRemaining: 0,
      turnsTotal: 0,

      // Estadísticas
      stats: beingData.stats || {
        missionsCompleted: 0,
        missionsSuccess: 0,
        missionsFailed: 0,
        totalTurnsPlayed: 0,
        challengesCompleted: 0,
        totalXpEarned: 0
      },

      // Rasgos desbloqueables
      traits: beingData.traits || [],

      // Generación (para híbridos)
      generation: beingData.generation || 1,

      createdAt: beingData.createdAt || new Date().toISOString(),
      attributes: normalizedAttributes,
      baseAttributes: beingData.baseAttributes || normalizedAttributes,
      sourceApp: 'frankenstein-lab-embedded',
      totalPower: beingData.totalPower || 0,
      balance: beingData.balance || {},
      missionName: beingData.missionName || null
    };

    // Agregar al store
    addBeing(newBeing);

    // Mostrar animación de carta en lugar de Alert
    setRevealedBeing({
      ...newBeing,
      power: newBeing.totalPower
    });
    soundService.playReward();
    setTimeout(() => setShowCardReveal(true), 200);
  };

  // Callback cuando se cierra el modal de carta
  const handleCardRevealClose = () => {
    setShowCardReveal(false);
    setRevealedBeing(null);
  };

  /**
   * Normalizar atributos
   */
  const normalizeAttributes = (attrs) => {
    const defaults = {
      reflection: 20, analysis: 20, creativity: 20,
      empathy: 20, communication: 20, leadership: 20,
      action: 20, resilience: 20, strategy: 20,
      consciousness: 20, connection: 20, wisdom: 20,
      organization: 20, collaboration: 20, technical: 20
    };
    return { ...defaults, ...attrs };
  };

  /**
   * Seleccionar avatar según atributos
   */
  const selectAvatar = (attributes) => {
    const sorted = Object.entries(attributes)
      .sort((a, b) => b[1] - a[1]);

    const top = sorted[0]?.[0];

    const avatarMap = {
      consciousness: '🌟', wisdom: '🦉', empathy: '💜',
      creativity: '🎨', leadership: '👑', action: '⚡',
      resilience: '💪', analysis: '🔬', reflection: '🧠',
      communication: '🗣️', connection: '🌍', strategy: '♟️',
      organization: '📋', collaboration: '🤝', technical: '⚙️'
    };

    return avatarMap[top] || '🧬';
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
   * Renderizar error
   */
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Error de conexión</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleReload}>
          <Text style={styles.retryButtonText}>🔄 Reintentar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.offlineButton}
          onPress={() => Alert.alert('Próximamente', 'El modo offline estará disponible pronto.')}
        >
          <Text style={styles.offlineButtonText}>📱 Usar modo offline</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header compacto */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🧬 Lab Frankenstein</Text>
        <TouchableOpacity onPress={handleReload} style={styles.reloadButton}>
          <Text style={styles.reloadIcon}>🔄</Text>
        </TouchableOpacity>
      </View>

      {/* WebView con margen inferior para tab bar */}
      <View style={styles.webviewContainer}>
        <WebView
        ref={webViewRef}
        source={{ uri: LAB_URL }}
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
          setError(nativeEvent.description || 'Error cargando el laboratorio');
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
        scalesPageToFit={true}
        allowsFullscreenVideo={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        mixedContentMode="compatibility"
        cacheEnabled={true}
        allowFileAccess={true}
        allowFileAccessFromFileURLs={true}
        allowUniversalAccessFromFileURLs={true}
        originWhitelist={['*']}
        nestedScrollEnabled={true}
        overScrollMode="always"
        scrollEnabled={true}
        showsVerticalScrollIndicator={true}
        bounces={true}
        contentInsetAdjustmentBehavior="automatic"
        automaticallyAdjustContentInsets={true}
        decelerationRate="normal"
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.accent.primary} />
            <Text style={styles.loadingText}>Cargando Laboratorio...</Text>
          </View>
        )}
      />
      </View>

      {/* Loading overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.accent.primary} />
          <Text style={styles.loadingText}>Preparando el laboratorio...</Text>
        </View>
      )}

      {/* Modal de revelación de carta */}
      <CardRevealModal
        visible={showCardReveal}
        being={revealedBeing}
        onClose={handleCardRevealClose}
      />
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

  reloadButton: {
    padding: 6
  },

  reloadIcon: {
    fontSize: 18
  },

  webviewContainer: {
    flex: 1,
    marginBottom: 0  // El tab navigator ya agrega su propio espacio
  },

  webview: {
    flex: 1,
    backgroundColor: COLORS.bg.primary
  },

  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
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

  infoBar: {
    padding: 10,
    backgroundColor: COLORS.bg.elevated,
    borderTopWidth: 1,
    borderTopColor: COLORS.accent.primary + '30'
  },

  infoText: {
    fontSize: 12,
    color: COLORS.text.secondary,
    textAlign: 'center'
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

  offlineButton: {
    backgroundColor: COLORS.bg.elevated,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8
  },

  offlineButtonText: {
    fontSize: 14,
    color: COLORS.text.secondary
  }
});

export default FrankensteinLabScreen;
