/**
// 🔧 FIX v2.9.198: Migrated console.log to logger
 * Sistema de Partículas de Flujo de Energía
 * Partículas que viajan a lo largo de conexiones neuronales y DNA
 * Representa el flujo de información y energía vital
 *
 * @version 2.0.0
 * @author J. Irurtzun & Claude Sonnet 4.5
 */

class EnergyFlowSystem {
  constructor() {
    this.flows = [];
  }

  /**
   * Crear flujo de partículas en una conexión
   * @param {THREE.Curve} curve - Curva por la que fluirán las partículas
   * @param {Object} options - Opciones de configuración
   * @returns {Object} Sistema de flujo
   */
  createFlow(curve, options = {}) {
    const particleCount = options.particleCount || 20;
    const color = options.color || new THREE.Color(0xffff00);
    const size = options.size || 3;
    const speed = options.speed || 0.002;
    const direction = options.direction || 1; // 1 = adelante, -1 = atrás

    const particles = [];

    for (let i = 0; i < particleCount; i++) {
      // Crear partícula esférica
      const geometry = new THREE.SphereGeometry(size, 8, 8);
      const material = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.8,
        fog: false
      });

      const particle = new THREE.Mesh(geometry, material);

      // Posición inicial distribuida a lo largo de la curva
      const initialT = i / particleCount;
      const position = curve.getPointAt(initialT);
      particle.position.copy(position);

      // Metadata de la partícula
      particle.userData = {
        t: initialT, // Posición en la curva [0, 1]
        speed: speed * (0.8 + Math.random() * 0.4), // Variación de velocidad
        baseSize: size,
        pulsePhase: Math.random() * Math.PI * 2
      };

      particles.push(particle);
    }

    const flow = {
      curve: curve,
      particles: particles,
      direction: direction,
      color: color,
      active: options.active !== undefined ? options.active : true,
      bidirectional: options.bidirectional || false
    };

    this.flows.push(flow);
    return flow;
  }

  /**
   * Crear flujo bidireccional (partículas en ambas direcciones)
   */
  createBidirectionalFlow(curve, options = {}) {
    const color1 = options.color1 || new THREE.Color(0x00ffff);
    const color2 = options.color2 || new THREE.Color(0xff00ff);

    const flow1 = this.createFlow(curve, {
      ...options,
      color: color1,
      direction: 1,
      particleCount: (options.particleCount || 20) / 2
    });

    const flow2 = this.createFlow(curve, {
      ...options,
      color: color2,
      direction: -1,
      particleCount: (options.particleCount || 20) / 2
    });

    // Vincular flujos bidireccionales
    flow1.bidirectionalPair = flow2;
    flow2.bidirectionalPair = flow1;

    return { forward: flow1, backward: flow2 };
  }

  /**
   * Añadir flujo a una escena
   */
  addFlowToScene(flow, scene) {
    flow.particles.forEach(particle => {
      scene.add(particle);
    });
  }

  /**
   * Remover flujo de una escena
   */
  removeFlowFromScene(flow, scene) {
    flow.particles.forEach(particle => {
      scene.remove(particle);
      if (particle.geometry) particle.geometry.dispose();
      if (particle.material) particle.material.dispose();
    });
  }

  /**
   * Activar flujo
   */
  activateFlow(flow) {
    flow.active = true;
    flow.particles.forEach(particle => {
      if (particle.material) {
        particle.material.opacity = 0.8;
      }
    });
  }

  /**
   * Desactivar flujo
   */
  deactivateFlow(flow) {
    flow.active = false;
    flow.particles.forEach(particle => {
      if (particle.material) {
        particle.material.opacity = 0.3;
      }
    });
  }

  /**
   * Animar flujos
   */
  animate(_deltaTime = 0.016) {
    this.flows.forEach(flow => {
      if (!flow.active) return;

      flow.particles.forEach(particle => {
        const userData = particle.userData;

        // Avanzar en la curva
        userData.t += userData.speed * flow.direction;

        // Hacer loop cuando llega al final
        if (userData.t > 1.0) userData.t = 0.0;
        if (userData.t < 0.0) userData.t = 1.0;

        // Actualizar posición en la curva
        try {
          const position = flow.curve.getPointAt(userData.t);
          particle.position.copy(position);
        } catch (e) {
          // Si hay error, resetear t
          userData.t = 0.0;
        }

        // Pulso de tamaño
        const pulse = Math.sin(Date.now() * 0.005 + userData.pulsePhase) * 0.5 + 0.5;
        const scale = 0.7 + pulse * 0.6;
        particle.scale.setScalar(scale);

        // Pulso de brillo
        if (particle.material) {
          particle.material.opacity = 0.5 + pulse * 0.5;
        }
      });
    });
  }

  /**
   * Crear "explosión" de partículas en un punto
   * Útil para visualizar fusión celular o sinapsis
   */
  createParticleBurst(position, options = {}) {
    const particleCount = options.count || 30;
    const color = options.color || new THREE.Color(0xffffff);
    const speed = options.speed || 2;
    const lifetime = options.lifetime || 2000; // ms

    const particles = [];
    const startTime = Date.now();

    for (let i = 0; i < particleCount; i++) {
      const geometry = new THREE.SphereGeometry(2, 6, 6);
      const material = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 1.0
      });

      const particle = new THREE.Mesh(geometry, material);
      particle.position.copy(position);

      // Dirección aleatoria
      const direction = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2
      ).normalize();

      particle.userData = {
        velocity: direction.multiplyScalar(speed),
        startTime: startTime,
        lifetime: lifetime,
        type: 'burst_particle'
      };

      particles.push(particle);
    }

    return {
      particles: particles,
      startTime: startTime,
      lifetime: lifetime,
      active: true
    };
  }

  /**
   * Añadir burst a escena
   */
  addBurstToScene(burst, scene) {
    burst.particles.forEach(particle => {
      scene.add(particle);
    });
  }

  /**
   * Animar bursts (y limpiar expirados)
   */
  animateBursts(bursts, scene, deltaTime = 0.016) {
    if (!bursts || !Array.isArray(bursts)) return;

    const now = Date.now();
    const expired = [];

    bursts.forEach((burst, index) => {
      const age = now - burst.startTime;
      const progress = age / burst.lifetime;

      if (progress >= 1.0) {
        // Expiró - marcar para remover
        expired.push(index);
        burst.particles.forEach(particle => {
          scene.remove(particle);
          if (particle.geometry) particle.geometry.dispose();
          if (particle.material) particle.material.dispose();
        });
        return;
      }

      // Animar partículas
      burst.particles.forEach(particle => {
        // Mover
        particle.position.add(particle.userData.velocity.clone().multiplyScalar(deltaTime));

        // Fade out
        if (particle.material) {
          particle.material.opacity = 1.0 - progress;
        }

        // Shrink
        const scale = 1.0 - progress * 0.5;
        particle.scale.setScalar(scale);

        // Gravedad suave
        particle.userData.velocity.y -= 0.05 * deltaTime;
      });
    });

    // Remover bursts expirados (en orden inverso para no afectar índices)
    for (let i = expired.length - 1; i >= 0; i--) {
      bursts.splice(expired[i], 1);
    }
  }

  /**
   * Obtener estadísticas
   */
  getStats() {
    const totalFlows = this.flows.length;
    const activeFlows = this.flows.filter(f => f.active).length;
    const totalParticles = this.flows.reduce((sum, flow) => sum + flow.particles.length, 0);

    return {
      flows: totalFlows,
      activeFlows: activeFlows,
      particles: totalParticles
    };
  }

  /**
   * Limpiar todos los flujos
   */
  clear(scene) {
    this.flows.forEach(flow => {
      if (scene) {
        this.removeFlowFromScene(flow, scene);
      } else {
        flow.particles.forEach(particle => {
          if (particle.geometry) particle.geometry.dispose();
          if (particle.material) particle.material.dispose();
        });
      }
    });

    this.flows = [];
  }
}

// Exportar para uso en navegador
if (typeof window !== 'undefined') {
  window.EnergyFlowSystem = EnergyFlowSystem;
  // logger.debug('✅ EnergyFlowSystem class registered globally');
}
