/**
 * Sistema de Conexiones Neuronales
 * Crea redes de axones conectando órganos relacionados
 * Basado en afinidad temática (tags compartidos, categorías similares)
 *
 * @version 2.0.0
 * @author J. Irurtzun & Claude Sonnet 4.5
 */

class NeuralConnectionsSystem {
  constructor() {
    this.connections = [];
    this.activeConnections = new Set();
  }

  /**
   * Calcular afinidad entre dos libros
   * @param {Object} book1 - Primer libro
   * @param {Object} book2 - Segundo libro
   * @returns {Object} Información de afinidad
   */
  calculateAffinity(book1, book2) {
    let score = 0;
    const sharedTags = [];
    const reasons = [];

    // Comparar tags si existen
    if (book1.tags && book2.tags) {
      const tags1 = new Set(book1.tags.map(t => t.toLowerCase()));
      const tags2 = new Set(book2.tags.map(t => t.toLowerCase()));

      tags1.forEach(tag => {
        if (tags2.has(tag)) {
          sharedTags.push(tag);
          score += 10;
        }
      });
    }

    // Categoría similar
    if (book1.category === book2.category) {
      score += 15;
      reasons.push('same_category');
    }

    // Mismo autor
    if (book1.author === book2.author) {
      score += 5;
      reasons.push('same_author');
    }

    // Comparar títulos/subtítulos para palabras clave comunes
    const getKeywords = (text) => {
      if (!text) return [];
      return text.toLowerCase()
        .split(/\s+/)
        .filter(word => word.length > 4) // Solo palabras de más de 4 letras
        .filter(word => !['sobre', 'para', 'como', 'desde', 'hasta'].includes(word));
    };

    const keywords1 = new Set([
      ...getKeywords(book1.title),
      ...getKeywords(book1.subtitle || '')
    ]);

    const keywords2 = new Set([
      ...getKeywords(book2.title),
      ...getKeywords(book2.subtitle || '')
    ]);

    let sharedKeywords = 0;
    keywords1.forEach(kw => {
      if (keywords2.has(kw)) {
        sharedKeywords++;
        score += 3;
      }
    });

    if (sharedKeywords > 0) {
      reasons.push('shared_keywords');
    }

    return {
      score,
      sharedTags,
      reasons,
      strength: Math.min(100, score) / 100 // Normalizar a [0, 1]
    };
  }

  /**
   * Crear conexión neuronal entre dos órganos
   * @param {THREE.Vector3} posA - Posición del órgano A
   * @param {THREE.Vector3} posB - Posición del órgano B
   * @param {Number} strength - Fuerza de la conexión [0, 1]
   * @param {Object} options - Opciones de configuración
   * @returns {THREE.Group} Grupo con la conexión
   */
  createNeuralConnection(posA, posB, strength, options = {}) {
    const group = new THREE.Group();

    // Calcular punto medio elevado para crear arco
    const midPoint = new THREE.Vector3().addVectors(posA, posB).multiplyScalar(0.5);
    const distance = posA.distanceTo(posB);

    // Elevar el punto medio (arco más pronunciado para conexiones largas)
    const arcHeight = options.arcHeight || Math.min(200, distance * 0.3);
    midPoint.y += arcHeight;

    // Crear curva Bezier cuadrática para el axon
    const curve = new THREE.QuadraticBezierCurve3(posA, midPoint, posB);

    // Grosor basado en fuerza de conexión
    const thickness = options.thickness || (1 + strength * 3);

    // Geometría del axon
    const tubeGeometry = new THREE.TubeGeometry(
      curve,
      50, // segmentos de la curva
      thickness,
      8, // segmentos radiales
      false
    );

    // Color basado en fuerza
    const baseColor = options.color || new THREE.Color(0x00ffcc);
    const finalColor = baseColor.clone().multiplyScalar(0.5 + strength * 0.5);

    const material = new THREE.MeshPhongMaterial({
      color: finalColor,
      emissive: finalColor,
      emissiveIntensity: 0.4 + strength * 0.4,
      transparent: true,
      opacity: 0.3 + strength * 0.4,
      side: THREE.DoubleSide
    });

    const axonMesh = new THREE.Mesh(tubeGeometry, material);
    group.add(axonMesh);

    // Sinapsis (puntos brillantes en los extremos)
    const synapseGeometry = new THREE.SphereGeometry(thickness * 2, 8, 8);
    const synapseMaterial = new THREE.MeshPhongMaterial({
      color: finalColor,
      emissive: finalColor,
      emissiveIntensity: 1.0,
      transparent: true,
      opacity: 0.8
    });

    const synapse1 = new THREE.Mesh(synapseGeometry, synapseMaterial);
    synapse1.position.copy(posA);

    const synapse2 = new THREE.Mesh(synapseGeometry, synapseMaterial.clone());
    synapse2.position.copy(posB);

    group.add(synapse1, synapse2);

    // Metadatos
    group.userData = {
      type: 'neural_connection',
      axon: axonMesh,
      synapses: [synapse1, synapse2],
      curve: curve,
      strength: strength,
      active: false,
      pulsePhase: Math.random() * Math.PI * 2
    };

    this.connections.push(group);
    return group;
  }

  /**
   * Crear red completa de conexiones entre órganos
   * @param {Array} organs - Array de órganos con sus libros
   * @param {Object} options - Opciones
   * @returns {THREE.Group} Grupo con todas las conexiones
   */
  createNetworkFromOrgans(organs, options = {}) {
    const network = new THREE.Group();
    const minAffinity = options.minAffinity || 15; // Afinidad mínima para crear conexión

    // Analizar todas las combinaciones de órganos
    for (let i = 0; i < organs.length; i++) {
      for (let j = i + 1; j < organs.length; j++) {
        const organA = organs[i];
        const organB = organs[j];

        // Calcular afinidad
        const affinity = this.calculateAffinity(organA.book, organB.book);

        if (affinity.score >= minAffinity) {
          // Crear conexión
          const connection = this.createNeuralConnection(
            organA.group.position,
            organB.group.position,
            affinity.strength,
            {
              arcHeight: options.arcHeight,
              color: options.connectionColor
            }
          );

          // Guardar metadata de afinidad
          connection.userData.organA = organA;
          connection.userData.organB = organB;
          connection.userData.affinity = affinity;

          network.add(connection);
        }
      }
    }

    // console.log(`🧠 Red neuronal creada: ${network.children.length} conexiones`);

    network.userData = {
      type: 'neural_network',
      connectionCount: network.children.length
    };

    return network;
  }

  /**
   * Activar conexión (visualizar flujo de información)
   * @param {THREE.Group} connection - Conexión a activar
   */
  activateConnection(connection) {
    if (connection.userData.type !== 'neural_connection') return;

    connection.userData.active = true;
    this.activeConnections.add(connection);

    // Aumentar brillo
    if (connection.userData.axon && connection.userData.axon.material) {
      connection.userData.axon.material.emissiveIntensity = 1.0;
      connection.userData.axon.material.opacity = 0.9;
    }

    connection.userData.synapses.forEach(synapse => {
      if (synapse.material) {
        synapse.material.emissiveIntensity = 1.5;
      }
    });
  }

  /**
   * Desactivar conexión
   * @param {THREE.Group} connection - Conexión a desactivar
   */
  deactivateConnection(connection) {
    if (connection.userData.type !== 'neural_connection') return;

    connection.userData.active = false;
    this.activeConnections.delete(connection);

    const strength = connection.userData.strength;

    if (connection.userData.axon && connection.userData.axon.material) {
      connection.userData.axon.material.emissiveIntensity = 0.4 + strength * 0.4;
      connection.userData.axon.material.opacity = 0.3 + strength * 0.4;
    }

    connection.userData.synapses.forEach(synapse => {
      if (synapse.material) {
        synapse.material.emissiveIntensity = 1.0;
      }
    });
  }

  /**
   * Activar conexiones de un órgano específico
   * @param {Object} organ - Órgano cuyos conexiones activar
   */
  activateOrganConnections(organ) {
    this.connections.forEach(connection => {
      if (connection.userData.organA === organ || connection.userData.organB === organ) {
        this.activateConnection(connection);
      }
    });
  }

  /**
   * Desactivar todas las conexiones
   */
  deactivateAllConnections() {
    this.activeConnections.forEach(connection => {
      this.deactivateConnection(connection);
    });
  }

  /**
   * Animar conexiones neuronales
   * @param {Number} time - Tiempo actual
   */
  animate(time) {
    this.connections.forEach(connection => {
      if (connection.userData.type !== 'neural_connection') return;

      const isActive = connection.userData.active;
      const strength = connection.userData.strength;

      // Pulso en sinapsis
      const pulse = Math.sin(time * 0.003 + connection.userData.pulsePhase) * 0.5 + 0.5;

      connection.userData.synapses.forEach((synapse, i) => {
        if (synapse.material) {
          const basePulse = isActive ? 1.5 : 1.0;
          synapse.material.emissiveIntensity = basePulse + pulse * 0.5;

          // Escala pulsante solo si está activa
          if (isActive) {
            const scale = 1.0 + pulse * 0.3;
            synapse.scale.setScalar(scale);
          } else {
            synapse.scale.setScalar(1.0);
          }
        }
      });

      // Ondulación en axon activo (efecto de señal viajando)
      if (isActive && connection.userData.axon && connection.userData.axon.material) {
        const wavePhase = (time * 0.002) % 1.0;
        const waveEffect = Math.sin(wavePhase * Math.PI * 2) * 0.3;
        connection.userData.axon.material.emissiveIntensity = 1.0 + waveEffect;
      }
    });
  }

  /**
   * Obtener estadísticas de la red
   */
  getNetworkStats() {
    const totalConnections = this.connections.length;
    const activeConnections = this.activeConnections.size;

    const strengthDistribution = {
      weak: 0,    // 0-0.33
      medium: 0,  // 0.33-0.66
      strong: 0   // 0.66-1.0
    };

    this.connections.forEach(conn => {
      const strength = conn.userData.strength;
      if (strength < 0.33) strengthDistribution.weak++;
      else if (strength < 0.66) strengthDistribution.medium++;
      else strengthDistribution.strong++;
    });

    return {
      total: totalConnections,
      active: activeConnections,
      distribution: strengthDistribution
    };
  }

  /**
   * Limpiar todas las conexiones
   */
  clear() {
    this.connections.forEach(connection => {
      connection.traverse(child => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(mat => mat.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    });

    this.connections = [];
    this.activeConnections.clear();
  }
}

// Exportar para uso en navegador
if (typeof window !== 'undefined') {
  window.NeuralConnectionsSystem = NeuralConnectionsSystem;
  // console.log('✅ NeuralConnectionsSystem class registered globally');
}
