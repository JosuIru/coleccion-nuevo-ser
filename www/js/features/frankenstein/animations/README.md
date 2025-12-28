# Frankenstein Confetti Effects

Módulo independiente para efectos visuales de celebración y animaciones de partículas.

## Características

- **Zero dependencies**: Solo usa APIs nativas del navegador
- **Memory safe**: Sistema completo de cleanup automático
- **Reusable**: Totalmente desacoplado, funciona en cualquier proyecto
- **Self-contained**: Auto-inyecta sus propios estilos CSS

## Instalación

```javascript
import ConfettiEffects from './frankenstein-confetti-effects.js';

// Crear instancia
const effects = new ConfettiEffects();
```

## Uso Básico

### Confetti Effect

```javascript
// Confetti básico (50 piezas, colores dorados, 4 segundos)
effects.playConfetti();

// Confetti personalizado
effects.playConfetti({
  count: 100,
  colors: ['#ff0000', '#00ff00', '#0000ff'],
  duration: 5000
});
```

### Lightning Effect

```javascript
// Lightning en contenedor específico
const container = document.querySelector('.my-container');
effects.playLightning(container);

// Lightning en contenedor por defecto (.frankenstein-laboratory)
effects.playLightning();
```

### Particle Burst

```javascript
const element = document.getElementById('my-button');

// Burst básico (20 partículas)
effects.createParticleBurst(element);

// Burst personalizado
effects.createParticleBurst(element, {
  particleCount: 40,
  colors: ['#ffd700', '#ff00ff', '#00ffff'],
  types: ['circle', 'star', 'energy'],
  duration: 1500
});
```

### Flight Trail

```javascript
const startRect = element1.getBoundingClientRect();
const endRect = element2.getBoundingClientRect();

effects.createFlightTrail(startRect, endRect, {
  trailCount: 20,
  duration: 800,
  color: 'rgba(255, 215, 0, 1)'
});
```

### Progress Reward

```javascript
const container = document.querySelector('.progress-card');
effects.spawnProgressReward(container, 75, 'Objetivo completado!');
```

### Floating Particles

```javascript
// Genera HTML de partículas flotantes
const particlesHTML = effects.generateFloatingParticles(30);
container.innerHTML += particlesHTML;
```

## Funciones Standalone

Para uso one-off sin gestionar una instancia:

```javascript
import { playConfettiEffect, playLightningEffect, createParticleBurstEffect }
  from './frankenstein-confetti-effects.js';

// Uso directo
playConfettiEffect({ count: 50 });
playLightningEffect();
createParticleBurstEffect(element);
```

## Cleanup

```javascript
// Detener todas las animaciones activas
effects.stopAll();

// Destruir instancia completamente
effects.destroy();
```

## Tipos de Partículas

El módulo soporta 3 tipos de partículas:

1. **Circle**: Partículas circulares simples con colores personalizables
2. **Star**: Partículas en forma de estrella con rotación
3. **Energy**: Partículas con efecto de blur y glow

## Animaciones CSS Incluidas

El módulo auto-inyecta los siguientes keyframes:

- `confetti-fall`: Caída de confetti con rotación
- `particle-burst`: Explosión radial básica
- `particle-star-burst`: Explosión de estrellas con rotación
- `particle-energy-burst`: Explosión con efecto de energía
- `celebration-float`: Texto flotante de celebración

## Ejemplo Completo

```javascript
import ConfettiEffects from './frankenstein-confetti-effects.js';

class MyApp {
  constructor() {
    this.effects = new ConfettiEffects();
  }

  celebrateVictory() {
    // 1. Confetti dorado
    this.effects.playConfetti();

    // 2. Lightning triple
    const lab = document.querySelector('.game-area');
    this.effects.playLightning(lab);
    setTimeout(() => this.effects.playLightning(lab), 300);
    setTimeout(() => this.effects.playLightning(lab), 600);

    // 3. Particle burst en el botón
    const button = document.getElementById('victory-button');
    this.effects.createParticleBurst(button, {
      particleCount: 30,
      types: ['star', 'energy']
    });
  }

  destroy() {
    this.effects.destroy();
  }
}
```

## Testing

Abre `test-confetti-effects.html` en tu navegador para un test suite interactivo con todos los efectos.

## API Reference

### Constructor

```typescript
new ConfettiEffects()
```

### Métodos Públicos

#### `playConfetti(options?: Object)`

Opciones:
- `count?: number` - Cantidad de piezas (default: 50)
- `colors?: string[]` - Array de colores hex (default: dorados)
- `duration?: number` - Duración en ms (default: 4000)

#### `playLightning(container?: HTMLElement)`

Parámetros:
- `container`: Elemento donde mostrar el lightning (default: `.frankenstein-laboratory`)

#### `generateFloatingParticles(count?: number): string`

Parámetros:
- `count`: Cantidad de partículas (default: 20)

Retorna: HTML string

#### `createParticleBurst(element: HTMLElement, options?: Object)`

Parámetros:
- `element`: Elemento origen de las partículas (requerido)

Opciones:
- `particleCount?: number` - Cantidad (default: 20)
- `colors?: string[]` - Colores (default: dorados)
- `types?: string[]` - Tipos: 'circle', 'star', 'energy' (default: todos)
- `duration?: number` - Duración en ms (default: 1000)

#### `createFlightTrail(startRect: DOMRect, endRect: DOMRect, options?: Object)`

Parámetros:
- `startRect`: Rectángulo de inicio (requerido)
- `endRect`: Rectángulo de destino (requerido)

Opciones:
- `trailCount?: number` - Cantidad de partículas (default: 15)
- `duration?: number` - Duración del vuelo (default: 600)
- `color?: string` - Color base rgba (default: dorado)

#### `spawnProgressReward(container: HTMLElement, percent: number, label: string)`

Parámetros:
- `container`: Contenedor donde mostrar (requerido)
- `percent`: Posición horizontal 0-100 (requerido)
- `label`: Texto a mostrar (requerido)

#### `stopAll()`

Detiene todas las animaciones activas.

#### `destroy()`

Destruye la instancia y libera recursos.

## Compatibilidad

- Chrome/Edge: ✅
- Firefox: ✅
- Safari: ✅
- Mobile browsers: ✅

Requiere soporte para:
- ES6 modules
- CSS animations
- getBoundingClientRect
- CSS custom properties (--tx, --ty)

## Licencia

Parte del proyecto "El Código del Despertar" - Frankenstein Lab

---

**Versión:** v2.9.200
**Autor:** J. Irurtzun & Claude Sonnet 4.5
**Última actualización:** 2025-12-28
