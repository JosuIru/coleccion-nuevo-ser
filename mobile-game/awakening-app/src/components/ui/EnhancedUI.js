/**
 * EnhancedUI.js
 * Componentes de UI mejorados con efectos visuales
 *
 * @version 1.0.0
 */

import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ActivityIndicator
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS } from '../../config/constants';

/**
 * Botón con gradiente y efectos
 */
export const GradientButton = ({
  title,
  onPress,
  variant = 'primary', // primary, success, warning, danger, outline
  size = 'medium', // small, medium, large
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = false,
  style
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const variants = {
    primary: {
      gradient: ['#60a5fa', '#3b82f6'],
      textColor: '#fff'
    },
    success: {
      gradient: ['#34d399', '#10b981'],
      textColor: '#fff'
    },
    warning: {
      gradient: ['#fbbf24', '#f59e0b'],
      textColor: '#000'
    },
    danger: {
      gradient: ['#ef4444', '#dc2626'],
      textColor: '#fff'
    },
    wisdom: {
      gradient: ['#a78bfa', '#7c3aed'],
      textColor: '#fff'
    },
    outline: {
      gradient: ['transparent', 'transparent'],
      textColor: COLORS.accent.primary
    }
  };

  const sizes = {
    small: { paddingV: 8, paddingH: 16, fontSize: 13, iconSize: 16 },
    medium: { paddingV: 12, paddingH: 24, fontSize: 15, iconSize: 20 },
    large: { paddingV: 16, paddingH: 32, fontSize: 17, iconSize: 24 }
  };

  const variantConfig = variants[variant] || variants.primary;
  const sizeConfig = sizes[size] || sizes.medium;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true
    }).start();
  };

  return (
    <Animated.View
      style={[
        { transform: [{ scale: scaleAnim }] },
        fullWidth && { width: '100%' },
        style
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={disabled ? ['#64748b', '#475569'] : variantConfig.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.gradientButton,
            {
              paddingVertical: sizeConfig.paddingV,
              paddingHorizontal: sizeConfig.paddingH,
              opacity: disabled ? 0.5 : 1
            },
            variant === 'outline' && {
              borderWidth: 2,
              borderColor: COLORS.accent.primary
            }
          ]}
        >
          {loading ? (
            <ActivityIndicator color={variantConfig.textColor} />
          ) : (
            <View style={styles.buttonContent}>
              {icon && iconPosition === 'left' && (
                <Icon
                  name={icon}
                  size={sizeConfig.iconSize}
                  color={variantConfig.textColor}
                  style={styles.buttonIconLeft}
                />
              )}
              <Text
                style={[
                  styles.buttonText,
                  {
                    fontSize: sizeConfig.fontSize,
                    color: variantConfig.textColor
                  }
                ]}
              >
                {title}
              </Text>
              {icon && iconPosition === 'right' && (
                <Icon
                  name={icon}
                  size={sizeConfig.iconSize}
                  color={variantConfig.textColor}
                  style={styles.buttonIconRight}
                />
              )}
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

/**
 * Tarjeta con efecto de brillo
 */
export const GlowCard = ({
  children,
  glowColor = COLORS.accent.primary,
  intensity = 0.3,
  style
}) => {
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: false
        })
      ])
    ).start();
  }, []);

  const shadowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [intensity * 0.5, intensity]
  });

  return (
    <Animated.View
      style={[
        styles.glowCard,
        {
          shadowColor: glowColor,
          shadowOpacity
        },
        style
      ]}
    >
      {children}
    </Animated.View>
  );
};

/**
 * Badge con pulso animado
 */
export const PulseBadge = ({
  value,
  color = COLORS.accent.critical,
  size = 24
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 500,
          useNativeDriver: true
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true
        })
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.pulseBadge,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          transform: [{ scale: pulseAnim }]
        }
      ]}
    >
      <Text style={styles.pulseBadgeText}>{value}</Text>
    </Animated.View>
  );
};

/**
 * Indicador de progreso circular
 */
export const CircularProgress = ({
  progress = 0, // 0-100
  size = 80,
  strokeWidth = 8,
  color = COLORS.accent.primary,
  showValue = true,
  label
}) => {
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animValue, {
      toValue: progress,
      duration: 1000,
      useNativeDriver: false
    }).start();
  }, [progress]);

  const circumference = 2 * Math.PI * ((size - strokeWidth) / 2);

  const strokeDashoffset = animValue.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0]
  });

  return (
    <View style={[styles.circularProgress, { width: size, height: size }]}>
      {/* Background circle */}
      <View
        style={[
          styles.circularBg,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: COLORS.bg.elevated
          }
        ]}
      />

      {/* Progress arc - simplified version */}
      <View
        style={[
          styles.circularFill,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: color,
            borderTopColor: 'transparent',
            borderRightColor: 'transparent',
            transform: [{ rotate: `${(progress / 100) * 360 - 90}deg` }]
          }
        ]}
      />

      {/* Center content */}
      <View style={styles.circularCenter}>
        {showValue && (
          <Text style={styles.circularValue}>{Math.round(progress)}%</Text>
        )}
        {label && <Text style={styles.circularLabel}>{label}</Text>}
      </View>
    </View>
  );
};

/**
 * Separador con gradiente
 */
export const GradientDivider = ({
  colors = [COLORS.accent.primary, COLORS.accent.wisdom],
  height = 2,
  style
}) => (
  <LinearGradient
    colors={colors}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 0 }}
    style={[styles.gradientDivider, { height }, style]}
  />
);

/**
 * Tooltip animado
 */
export const AnimatedTooltip = ({
  visible,
  message,
  position = 'top', // top, bottom
  style
}) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true
        })
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true
        }),
        Animated.timing(translateY, {
          toValue: 10,
          duration: 200,
          useNativeDriver: true
        })
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.tooltip,
        position === 'bottom' && styles.tooltipBottom,
        { opacity, transform: [{ translateY }] },
        style
      ]}
    >
      <Text style={styles.tooltipText}>{message}</Text>
      <View
        style={[
          styles.tooltipArrow,
          position === 'bottom' && styles.tooltipArrowBottom
        ]}
      />
    </Animated.View>
  );
};

/**
 * Etiqueta con icono
 */
export const IconTag = ({
  icon,
  label,
  color = COLORS.accent.primary,
  size = 'medium'
}) => {
  const sizeConfig = {
    small: { padding: 4, fontSize: 10, iconSize: 12 },
    medium: { padding: 8, fontSize: 12, iconSize: 16 },
    large: { padding: 12, fontSize: 14, iconSize: 20 }
  };

  const cfg = sizeConfig[size] || sizeConfig.medium;

  return (
    <View style={[styles.iconTag, { backgroundColor: color + '20', padding: cfg.padding }]}>
      <Icon name={icon} size={cfg.iconSize} color={color} />
      {label && (
        <Text style={[styles.iconTagLabel, { fontSize: cfg.fontSize, color }]}>
          {label}
        </Text>
      )}
    </View>
  );
};

/**
 * Contador animado
 */
export const AnimatedCounter = ({
  value,
  duration = 1000,
  prefix = '',
  suffix = '',
  style
}) => {
  const animValue = useRef(new Animated.Value(0)).current;
  const [displayValue, setDisplayValue] = React.useState(0);

  useEffect(() => {
    animValue.setValue(0);
    Animated.timing(animValue, {
      toValue: value,
      duration,
      useNativeDriver: false
    }).start();

    const listener = animValue.addListener(({ value: v }) => {
      setDisplayValue(Math.round(v));
    });

    return () => animValue.removeListener(listener);
  }, [value]);

  return (
    <Text style={[styles.animatedCounter, style]}>
      {prefix}{displayValue}{suffix}
    </Text>
  );
};

const styles = StyleSheet.create({
  // Gradient Button
  gradientButton: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  buttonText: {
    fontWeight: '600'
  },
  buttonIconLeft: {
    marginRight: 8
  },
  buttonIconRight: {
    marginLeft: 8
  },

  // Glow Card
  glowCard: {
    backgroundColor: COLORS.bg.card,
    borderRadius: 16,
    padding: 16,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 20,
    elevation: 10
  },

  // Pulse Badge
  pulseBadge: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  pulseBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700'
  },

  // Circular Progress
  circularProgress: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center'
  },
  circularBg: {
    position: 'absolute'
  },
  circularFill: {
    position: 'absolute'
  },
  circularCenter: {
    alignItems: 'center'
  },
  circularValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary
  },
  circularLabel: {
    fontSize: 10,
    color: COLORS.text.secondary,
    marginTop: 2
  },

  // Gradient Divider
  gradientDivider: {
    width: '100%',
    borderRadius: 1
  },

  // Tooltip
  tooltip: {
    position: 'absolute',
    backgroundColor: COLORS.bg.elevated,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    bottom: '100%',
    marginBottom: 8
  },
  tooltipBottom: {
    bottom: 'auto',
    top: '100%',
    marginTop: 8,
    marginBottom: 0
  },
  tooltipText: {
    color: COLORS.text.primary,
    fontSize: 12
  },
  tooltipArrow: {
    position: 'absolute',
    bottom: -6,
    left: '50%',
    marginLeft: -6,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: COLORS.bg.elevated
  },
  tooltipArrowBottom: {
    bottom: 'auto',
    top: -6,
    borderTopWidth: 0,
    borderBottomWidth: 6,
    borderBottomColor: COLORS.bg.elevated
  },

  // Icon Tag
  iconTag: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    gap: 4
  },
  iconTagLabel: {
    fontWeight: '600'
  },

  // Animated Counter
  animatedCounter: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text.primary
  }
});

export default {
  GradientButton,
  GlowCard,
  PulseBadge,
  CircularProgress,
  GradientDivider,
  AnimatedTooltip,
  IconTag,
  AnimatedCounter
};
