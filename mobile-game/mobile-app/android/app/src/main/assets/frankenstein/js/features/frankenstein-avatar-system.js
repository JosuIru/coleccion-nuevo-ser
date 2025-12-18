/**
 * FRANKENSTEIN AVATAR SYSTEM
 * Sistema de visualización mejorada de seres con avatares procedurales
 *
 * @version 1.0.0
 * @author J. Irurtzun & Claude Sonnet 4.5
 */

class FrankensteinAvatarSystem {
  constructor() {
    this.dicebearStyles = [
      'adventurer',
      'adventurer-neutral',
      'avataaars',
      'big-ears',
      'big-smile',
      'bottts',
      'croodles',
      'fun-emoji',
      'icons',
      'identicon',
      'lorelei',
      'micah',
      'miniavs',
      'notionists',
      'open-peeps',
      'personas',
      'pixel-art',
      'shapes',
      'thumbs'
    ];
  }

  /**
   * Generar URL de avatar para un ser
   * @param {Object} being - El ser
   * @param {string} style - Estilo del avatar (opcional)
   * @returns {string} URL del avatar
   */
  generateAvatarUrl(being, style = null) {
    const avatarStyle = style || this.selectStyleByBalance(being);

    // Crear seed único basado en nombre + atributos para variación
    const attrHash = this.createAttributeHash(being);
    const seed = encodeURIComponent(`${being.name || being.id || 'being'}-${attrHash}`);

    // URL base de DiceBear API
    const baseUrl = 'https://api.dicebear.com/7.x';

    // Generar parámetros personalizados basados en atributos
    const customParams = this.generateStyleParams(being, avatarStyle);

    return `${baseUrl}/${avatarStyle}/svg?seed=${seed}&${customParams}`;
  }

  /**
   * Crear hash de atributos para variación única
   */
  createAttributeHash(being) {
    if (!being.attributes) return '0';

    const attrs = being.attributes;
    // Combinar atributos principales en un número único
    const hash = (attrs.wisdom || 0) * 1000 +
                 (attrs.empathy || 0) * 100 +
                 (attrs.action || 0) * 10 +
                 (attrs.creativity || 0);

    return hash.toString(36); // Base 36 para hash corto
  }

  /**
   * Generar parámetros de estilo personalizados basados en atributos
   */
  generateStyleParams(being, style) {
    const params = ['backgroundColor=transparent', 'scale=100'];

    if (!being.attributes) return params.join('&');

    const attrs = being.attributes;

    // Configurar parámetros según el estilo y atributos
    switch(style) {
      case 'adventurer':
      case 'adventurer-neutral':
        // Configurar basado en acción y resiliencia
        if (attrs.action > 70) {
          params.push('eyes=variant26'); // Ojos decididos
        } else if (attrs.wisdom > 70) {
          params.push('eyes=variant04'); // Ojos sabios
        }

        if (attrs.resilience > 60) {
          params.push('mouth=variant26'); // Sonrisa confiada
        }
        break;

      case 'lorelei':
        // Configurar basado en empatía y balance emocional
        if (attrs.empathy > 70) {
          params.push('eyes=variant08'); // Ojos empáticos
        }
        break;

      case 'micah':
        // Configurar basado en espiritualidad
        if (being.balance?.spiritual > 70) {
          params.push('eyes=variant01'); // Ojos serenos
        }
        break;

      case 'bottts':
        // Configurar basado en organización y técnica
        if (attrs.organization > 70) {
          params.push('eyes=sensor'); // Ojos técnicos
        }

        if (attrs.technical > 60) {
          params.push('mouth=square'); // Boca estructurada
        }
        break;

      case 'notionists':
        // Configurar basado en sabiduría e intelectualidad
        if (attrs.wisdom > 70) {
          params.push('eyes=variant05'); // Ojos pensativos
        }
        break;
    }

    // Aplicar colores basados en atributos dominantes
    const colors = this.getColorsFromAttributes(attrs);
    const hue = this.calculateHue(attrs);

    // Diferentes tonos para diferentes rangos de hue
    if (hue >= 0 && hue < 60) {
      // Rojos/Naranjas (coraje/acción)
      params.push('hairColor=d2691e,ff6347,ff4500');
    } else if (hue >= 60 && hue < 180) {
      // Verdes (empatía/balance)
      params.push('hairColor=228b22,32cd32,90ee90');
    } else if (hue >= 180 && hue < 270) {
      // Azules (sabiduría)
      params.push('hairColor=4169e1,1e90ff,87ceeb');
    } else {
      // Violetas (creatividad)
      params.push('hairColor=8b4789,9370db,ba55d3');
    }

    return params.join('&');
  }

  /**
   * Seleccionar estilo de avatar basado en el balance del ser
   */
  selectStyleByBalance(being) {
    if (!being.balance) return 'adventurer';

    const balance = being.balance;

    // Ser intelectual
    if (balance.intellectual > 80) {
      return 'notionists'; // Estilo moderno, limpio
    }

    // Ser emocional/empático
    if (balance.emotional > 80) {
      return 'lorelei'; // Estilo suave, orgánico
    }

    // Ser de acción
    if (balance.action > 80) {
      return 'adventurer'; // Estilo dinámico
    }

    // Ser espiritual
    if (balance.spiritual > 80) {
      return 'micah'; // Estilo sereno
    }

    // Ser práctico
    if (balance.practical > 80) {
      return 'bottts'; // Estilo robótico, eficiente
    }

    // Por defecto
    return 'open-peeps';
  }

  /**
   * Obtener paleta de colores basada en atributos
   */
  getColorsFromAttributes(attributes) {
    if (!attributes) {
      return {
        primary: '#8b5cf6',
        secondary: '#ec4899',
        background: 'transparent'
      };
    }

    // Calcular color dominante basado en atributos
    const hue = this.calculateHue(attributes);
    const saturation = Math.min(100, attributes.balance || 70);
    const lightness = 50;

    return {
      primary: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
      secondary: `hsl(${(hue + 60) % 360}, ${saturation}%, ${lightness}%)`,
      background: `hsl(${hue}, ${saturation}%, 95%)`
    };
  }

  /**
   * Calcular HUE basado en atributos dominantes
   */
  calculateHue(attributes) {
    // Mapear atributos a colores
    const wisdom = attributes.wisdom || 0;
    const empathy = attributes.empathy || 0;
    const resilience = attributes.resilience || 0;
    const creativity = attributes.creativity || 0;
    const action = attributes.action || 0;

    // Azul (sabiduría): 200-240
    // Verde (empatía): 120-160
    // Rojo (resiliencia): 0-30
    // Violeta (creatividad): 270-310
    // Naranja (acción): 30-60

    let totalHue = 0;
    let totalWeight = 0;

    if (wisdom > 0) {
      totalHue += 220 * wisdom;
      totalWeight += wisdom;
    }

    if (empathy > 0) {
      totalHue += 140 * empathy;
      totalWeight += empathy;
    }

    if (resilience > 0) {
      totalHue += 15 * resilience;
      totalWeight += resilience;
    }

    if (creativity > 0) {
      totalHue += 290 * creativity;
      totalWeight += creativity;
    }

    if (action > 0) {
      totalHue += 45 * action;
      totalWeight += action;
    }

    return totalWeight > 0 ? Math.round(totalHue / totalWeight) : 270;
  }

  /**
   * Generar gradiente dinámico para fondo de card
   */
  generateBeingGradient(being) {
    const colors = this.getColorsFromAttributes(being.attributes);

    return `linear-gradient(135deg,
      ${colors.primary}15 0%,
      ${colors.secondary}15 100%)`;
  }

  /**
   * Obtener emoji representativo del ser
   */
  getBeingEmoji(being) {
    if (!being.balance) return '🧬';

    const balance = being.balance;
    const maxCategory = Object.entries(balance)
      .filter(([key]) => key !== 'harmony')
      .reduce((max, curr) => curr[1] > max[1] ? curr : max);

    const emojiMap = {
      intellectual: '🧠',
      emotional: '❤️',
      action: '⚡',
      spiritual: '🌟',
      practical: '🔧'
    };

    return emojiMap[maxCategory[0]] || '🧬';
  }

  /**
   * Crear visualización de atributos como gráfico radial SVG
   */
  generateRadarChart(attributes, size = 200) {
    const attrs = [
      { name: 'Sabiduría', value: attributes.wisdom || 0 },
      { name: 'Empatía', value: attributes.empathy || 0 },
      { name: 'Resiliencia', value: attributes.resilience || 0 },
      { name: 'Creatividad', value: attributes.creativity || 0 },
      { name: 'Organización', value: attributes.organization || 0 },
      { name: 'Acción', value: attributes.action || 0 }
    ];

    const center = size / 2;
    const maxRadius = size / 2 - 20;
    const angleStep = (Math.PI * 2) / attrs.length;

    // Calcular puntos
    const points = attrs.map((attr, i) => {
      const angle = angleStep * i - Math.PI / 2; // Empezar desde arriba
      const radius = (attr.value / 100) * maxRadius;
      const x = center + radius * Math.cos(angle);
      const y = center + radius * Math.sin(angle);
      return `${x},${y}`;
    }).join(' ');

    // Puntos de referencia (círculos concéntricos)
    const gridCircles = [25, 50, 75, 100].map(percent => {
      const r = (percent / 100) * maxRadius;
      return `<circle cx="${center}" cy="${center}" r="${r}"
        fill="none" stroke="rgba(139, 92, 246, 0.1)" stroke-width="1"/>`;
    }).join('');

    // Líneas radiales
    const radialLines = attrs.map((_, i) => {
      const angle = angleStep * i - Math.PI / 2;
      const x = center + maxRadius * Math.cos(angle);
      const y = center + maxRadius * Math.sin(angle);
      return `<line x1="${center}" y1="${center}" x2="${x}" y2="${y}"
        stroke="rgba(139, 92, 246, 0.15)" stroke-width="1"/>`;
    }).join('');

    return `
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        ${gridCircles}
        ${radialLines}
        <polygon points="${points}"
          fill="rgba(139, 92, 246, 0.3)"
          stroke="rgba(139, 92, 246, 0.8)"
          stroke-width="2"/>
      </svg>
    `;
  }

  /**
   * Generar partículas flotantes basadas en poder del ser
   */
  generateParticles(totalPower) {
    const particleCount = Math.min(20, Math.floor(totalPower / 50));
    const particles = [];

    for (let i = 0; i < particleCount; i++) {
      const size = Math.random() * 4 + 2;
      const left = Math.random() * 100;
      const delay = Math.random() * 5;
      const duration = Math.random() * 10 + 10;

      particles.push({
        size,
        left,
        delay,
        duration
      });
    }

    return particles;
  }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
  window.FrankensteinAvatarSystem = FrankensteinAvatarSystem;
}
