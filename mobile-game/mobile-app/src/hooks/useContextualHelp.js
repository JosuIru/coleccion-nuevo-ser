/**
 * CONTEXTUAL HELP HOOK
 * Hook para mostrar ayuda contextual basada en el contexto
 *
 * @version 1.0.0
 */

import { useState, useCallback } from 'react';

/**
 * Hook para manejar ayuda contextual
 *
 * @param {string} context - Contexto actual (ej: 'mapScreen', 'beingsScreen')
 * @returns {object} - { helpContent, showHelp, hideHelp, currentHelp }
 */
export const useContextualHelp = (context) => {
  const [visibleHelp, setVisibleHelp] = useState(null);

  // Diccionario de ayuda por contexto
  const helpDictionary = {
    mapScreen: {
      fractals: {
        title: '✨ Fractales de Consciencia',
        content: 'Los fractales son puntos de energía esparcidos en tu ciudad. Acércate a 50 metros para recolectarlos. Cada tipo ofrece diferentes recompensas.\n\n📚 Sabiduría: Bibliotecas\n🤝 Comunidad: Centros cívicos\n🌳 Naturaleza: Parques\n⚡ Acción: ONGs\n🌟 Consciencia: Centros de meditación'
      },
      crises: {
        title: '🚨 Crisis del Mundo',
        content: 'Estas son crisis reales extraídas de noticias globales. Toca un marcador de crisis para ver detalles y desplegar tus seres para resolverla. La probabilidad de éxito depende de los atributos de tus seres.'
      },
      energy: {
        title: '⚡ Energía',
        content: 'Tu energía se regenera 1 punto cada minuto. Al desplegar un ser a una misión consumes 10 energía. Recolectar fractales y leer libros también repone energía.'
      },
      beings: {
        title: '🧬 Seres',
        content: 'Botón para ver y gestionar tus seres transformadores. Puedes ver sus atributos, estado, y potencial.'
      }
    },
    beingsScreen: {
      attributes: {
        title: '🧠 Atributos',
        content: 'Cada ser tiene 15 atributos diferentes:\n\n🧠 Reflexión - 🔍 Análisis - 🎨 Creatividad\n❤️ Empatía - 🗣️ Comunicación - 👑 Liderazgo\n⚡ Acción - 💪 Resiliencia - ♟️ Estrategia\n🌟 Consciencia - 🌍 Conexión - 📿 Sabiduría\n📋 Organización - 🤝 Colaboración - 🔧 Técnica'
      },
      states: {
        title: '📊 Estados',
        content: '🟢 Available: Listo para ser desplegado\n🔵 Deployed: En una misión activa\n🟡 Resting: Recuperándose después de una misión\n🟣 Training: Siendo entrenado'
      },
      fusion: {
        title: '🧬 Fusión de Seres',
        content: 'Combina dos seres para crear un híbrido más poderoso. El nuevo ser heredará los mejores atributos de ambos padres. Requiere 500 consciencia.'
      }
    },
    crisisDetailScreen: {
      probability: {
        title: '📊 Probabilidad de Éxito',
        content: 'Se calcula basándose en:\n• Match de atributos requeridos\n• Sinergias entre seres\n• Bonus por equipo cooperativo\n• Penalizaciones por atributos críticos faltantes\n\nOtra opción: intentar con más seres para mayor probabilidad.'
      },
      attributes: {
        title: '🎯 Atributos Requeridos',
        content: 'La crisis requiere estos atributos para ser resuelta. Mientras mejor el match entre tus seres y estos requerimientos, mayor será tu probabilidad de éxito.'
      },
      rewards: {
        title: '🏆 Recompensas',
        content: 'Al completar exitosamente la misión recibirás:\n• XP (para subir de nivel)\n• Consciencia (para entrenar seres)\n• Bonificación por población ayudada'
      }
    },
    profileScreen: {
      level: {
        title: '📈 Nivel',
        content: 'Tu nivel determina:\n• Máximo número de seres\n• Máxima energía\n• Nuevas funcionalidades desbloqueadas\n\nSube de nivel ganando XP en misiones.'
      },
      achievements: {
        title: '🏅 Logros',
        content: 'Desbloqueables especiales por logros:\n✓ Resolver 10 crisis\n✓ Desbloquear todos los tipos de seres\n✓ Llegar a nivel 50 (Nuevo Ser)\n✓ Y muchos más...'
      },
      statistics: {
        title: '📊 Estadísticas',
        content: 'Rastreo de tu progreso:\n• Misiones completadas\n• Tasa de éxito\n• Población ayudada\n• Tiempo total jugado'
      }
    }
  };

  const showContextualHelp = useCallback((helpKey) => {
    const help = helpDictionary[context]?.[helpKey];
    if (help) {
      setVisibleHelp(help);
      return true;
    }
    return false;
  }, [context]);

  const hideHelp = useCallback(() => {
    setVisibleHelp(null);
  }, []);

  return {
    helpContent: visibleHelp,
    showHelp: showContextualHelp,
    hideHelp,
    hasHelp: (helpKey) => !!helpDictionary[context]?.[helpKey]
  };
};

export default useContextualHelp;
