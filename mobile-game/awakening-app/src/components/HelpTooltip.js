/**
 * HELP TOOLTIP COMPONENT
 * Componente reutilizable para mostrar ayuda contextual
 *
 * @version 1.0.0
 */

import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  Modal,
  ScrollView
} from 'react-native';
import { COLORS } from '../config/constants';

const { width } = Dimensions.get('window');

/**
 * HelpTooltip - Componente que muestra un ícono de ayuda con tooltip
 *
 * @param {string} title - Título de la ayuda
 * @param {string} content - Contenido de la ayuda
 * @param {string} icon - Ícono a mostrar (default: "?")
 * @param {string} position - Posición del tooltip ("top", "bottom", "left", "right")
 * @param {boolean} modal - Si true, abre en modal en lugar de tooltip flotante
 */
const HelpTooltip = ({
  title,
  content,
  icon = '?',
  position = 'top',
  modal = false,
  size = 'small'
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const toggleTooltip = () => {
    if (modal) {
      setShowModal(true);
    } else {
      setShowTooltip(!showTooltip);
      Animated.timing(fadeAnim, {
        toValue: showTooltip ? 0 : 1,
        duration: 300,
        useNativeDriver: true
      }).start();
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'small': return 20;
      case 'medium': return 28;
      case 'large': return 36;
      default: return 20;
    }
  };

  return (
    <>
      {/* Botón de ayuda */}
      <TouchableOpacity
        onPress={toggleTooltip}
        style={[styles.helpButton, styles[`size${size.charAt(0).toUpperCase() + size.slice(1)}`]]}
      >
        <Text style={{ fontSize: getIconSize() }}>{icon}</Text>
      </TouchableOpacity>

      {/* Tooltip flotante (si no es modal) */}
      {!modal && showTooltip && (
        <Animated.View
          style={[
            styles.tooltip,
            styles[`tooltip${position.charAt(0).toUpperCase() + position.slice(1)}`],
            { opacity: fadeAnim }
          ]}
        >
          {title && <Text style={styles.tooltipTitle}>{title}</Text>}
          <Text style={styles.tooltipContent}>{content}</Text>
        </Animated.View>
      )}

      {/* Modal de ayuda */}
      {modal && (
        <Modal
          visible={showModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalIcon}>{icon}</Text>
                <TouchableOpacity
                  onPress={() => setShowModal(false)}
                  style={styles.closeButton}
                >
                  <Text style={styles.closeText}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {title && <Text style={styles.modalTitle}>{title}</Text>}
                <Text style={styles.modalText}>{content}</Text>
              </ScrollView>

              <TouchableOpacity
                onPress={() => setShowModal(false)}
                style={styles.modalButton}
              >
                <Text style={styles.modalButtonText}>Entendido</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  // Botón de ayuda
  helpButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.accent.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.accent.primary
  },
  sizeSmall: {
    width: 24,
    height: 24,
    borderRadius: 12
  },
  sizeMedium: {
    width: 36,
    height: 36,
    borderRadius: 18
  },
  sizeLarge: {
    width: 44,
    height: 44,
    borderRadius: 22
  },

  // Tooltip flotante
  tooltip: {
    position: 'absolute',
    backgroundColor: COLORS.bg.elevated,
    borderRadius: 8,
    padding: 12,
    maxWidth: width - 40,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.accent.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000
  },
  tooltipTop: {
    bottom: 40
  },
  tooltipBottom: {
    top: 40
  },
  tooltipLeft: {
    right: 40
  },
  tooltipRight: {
    left: 40
  },
  tooltipTitle: {
    color: COLORS.text.primary,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4
  },
  tooltipContent: {
    color: COLORS.text.secondary,
    fontSize: 13,
    lineHeight: 18
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20
  },
  modalContent: {
    backgroundColor: COLORS.bg.elevated,
    borderRadius: 16,
    padding: 24,
    maxHeight: '80%',
    width: '100%',
    borderTopWidth: 3,
    borderTopColor: COLORS.accent.primary
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  modalIcon: {
    fontSize: 40
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.bg.card,
    justifyContent: 'center',
    alignItems: 'center'
  },
  closeText: {
    color: COLORS.text.primary,
    fontSize: 20,
    fontWeight: 'bold'
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: 12
  },
  modalText: {
    fontSize: 16,
    color: COLORS.text.secondary,
    lineHeight: 24
  },
  modalButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: COLORS.accent.primary,
    borderRadius: 8,
    alignItems: 'center'
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  }
});

export default HelpTooltip;
