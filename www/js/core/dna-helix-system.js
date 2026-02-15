/**
// 🔧 FIX v2.9.198: Migrated console.log to logger
 * Sistema de Hélices de ADN
 * Crea dobles hélices conectando núcleos en organismos híbridos
 * Representa la fusión genética visual entre células
 *
 * @version 2.0.0
 * @author J. Irurtzun & Claude Sonnet 4.5
 */

class DNAHelixSystem {
  constructor() {
    this.helices = [];
  }

  /**
   * Crear doble hélice de ADN conectando dos puntos
   * @param {THREE.Vector3} startPos - Posición inicial (núcleo 1)
   * @param {THREE.Vector3} endPos - Posición final (núcleo 2)
   * @param {THREE.Color} color1 - Color de célula padre 1
   * @param {THREE.Color} color2 - Color de célula padre 2
   * @param {Object} options - Opciones de configuración
   * @returns {THREE.Group} Grupo con la hélice completa
   */
  createDNAHelix(startPos, endPos, color1, color2, options = {}) {
    const group = new THREE.Group();

    // Parámetros de la hélice
    const height = startPos.distanceTo(endPos);
    const radius = options.radius || 15;
    const turns = options.turns || Math.max(2, Math.floor(height / 50));
    const segments = options.segments || 100;
    const baseSpacing = options.baseSpacing || 5; // Espaciado entre pares de bases

    // Crear curva para la primera cadena (strand 1)
    const strand1Points = [];
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const angle = t * Math.PI * 2 * turns;

      strand1Points.push(new THREE.Vector3(
        Math.cos(angle) * radius,
        t * height,
        Math.sin(angle) * radius
      ));
    }

    const strand1Curve = new THREE.CatmullRomCurve3(strand1Points);
    const strand1Geometry = new THREE.TubeGeometry(
      strand1Curve,
      segments,
      2, // grosor del tubo
      8,
      false
    );

    const strand1Material = new THREE.MeshPhongMaterial({
      color: color1,
      emissive: color1,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.9
    });

    const strand1Mesh = new THREE.Mesh(strand1Geometry, strand1Material);
    group.add(strand1Mesh);

    // Crear segunda cadena (strand 2) - 180° desfasada
    const strand2Points = [];
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const angle = t * Math.PI * 2 * turns + Math.PI; // +180°

      strand2Points.push(new THREE.Vector3(
        Math.cos(angle) * radius,
        t * height,
        Math.sin(angle) * radius
      ));
    }

    const strand2Curve = new THREE.CatmullRomCurve3(strand2Points);
    const strand2Geometry = new THREE.TubeGeometry(
      strand2Curve,
      segments,
      2,
      8,
      false
    );

    const strand2Material = new THREE.MeshPhongMaterial({
      color: color2,
      emissive: color2,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.9
    });

    const strand2Mesh = new THREE.Mesh(strand2Geometry, strand2Material);
    group.add(strand2Mesh);

    // Crear pares de bases (líneas conectando las dos cadenas)
    const basePairs = [];
    const basePairCount = Math.floor(height / baseSpacing);

    for (let i = 0; i < basePairCount; i++) {
      const t = i / (basePairCount - 1);
      const angle = t * Math.PI * 2 * turns;

      // Punto en strand 1
      const point1 = new THREE.Vector3(
        Math.cos(angle) * radius,
        t * height,
        Math.sin(angle) * radius
      );

      // Punto en strand 2 (opuesto)
      const point2 = new THREE.Vector3(
        Math.cos(angle + Math.PI) * radius,
        t * height,
        Math.sin(angle + Math.PI) * radius
      );

      // Crear línea conectora
      const basePairGeometry = new THREE.BufferGeometry().setFromPoints([point1, point2]);

      // Alternar colores de pares de bases (A-T, C-G)
      const basePairColor = i % 2 === 0
        ? new THREE.Color(0x00ffaa) // Verde cyan (A-T)
        : new THREE.Color(0xff6b9d); // Rosa (C-G)

      const basePairMaterial = new THREE.LineBasicMaterial({
        color: basePairColor,
        transparent: true,
        opacity: 0.7,
        linewidth: 2
      });

      const basePairLine = new THREE.Line(basePairGeometry, basePairMaterial);

      // Añadir pequeñas esferas en los extremos (bases nitrogenadas)
      const baseGeometry = new THREE.SphereGeometry(3, 6, 6);
      const baseMaterial = new THREE.MeshPhongMaterial({
        color: basePairColor,
        emissive: basePairColor,
        emissiveIntensity: 0.8
      });

      const base1 = new THREE.Mesh(baseGeometry, baseMaterial);
      base1.position.copy(point1);

      const base2 = new THREE.Mesh(baseGeometry, baseMaterial.clone());
      base2.position.copy(point2);

      basePairs.push({ line: basePairLine, base1, base2 });

      group.add(basePairLine, base1, base2);
    }

    // Posicionar y orientar la hélice
    const midPoint = new THREE.Vector3().addVectors(startPos, endPos).multiplyScalar(0.5);
    group.position.copy(midPoint);

    // Orientar hacia el punto final
    const direction = new THREE.Vector3().subVectors(endPos, startPos).normalize();
    const up = new THREE.Vector3(0, 1, 0);

    if (Math.abs(direction.dot(up)) > 0.99) {
      // Si está casi vertical, usar otro vector de referencia
      up.set(1, 0, 0);
    }

    const quaternion = new THREE.Quaternion().setFromUnitVectors(up, direction);
    group.quaternion.copy(quaternion);

    // Ajustar posición para que empiece en startPos
    group.position.copy(startPos);
    group.translateY(height / 2);

    // Metadatos para animación
    group.userData = {
      type: 'dna_helix',
      strand1: strand1Mesh,
      strand2: strand2Mesh,
      basePairs: basePairs,
      height: height,
      turns: turns,
      rotationSpeed: options.rotationSpeed || 0.002
    };

    this.helices.push(group);
    return group;
  }

  /**
   * Crear hélice simplificada (más rápida, para muchas conexiones)
   */
  createSimpleDNAHelix(startPos, endPos, color, options = {}) {
    const group = new THREE.Group();

    const height = startPos.distanceTo(endPos);
    const radius = options.radius || 10;
    const turns = options.turns || Math.max(1, Math.floor(height / 80));

    // Solo una cadena en espiral
    const points = [];
    const segments = 50;

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const angle = t * Math.PI * 2 * turns;

      points.push(new THREE.Vector3(
        Math.cos(angle) * radius,
        t * height,
        Math.sin(angle) * radius
      ));
    }

    const curve = new THREE.CatmullRomCurve3(points);
    const geometry = new THREE.TubeGeometry(curve, segments, 1.5, 6, false);

    const material = new THREE.MeshPhongMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.7
    });

    const mesh = new THREE.Mesh(geometry, material);
    group.add(mesh);

    // Posicionar
    const midPoint = new THREE.Vector3().addVectors(startPos, endPos).multiplyScalar(0.5);
    group.position.copy(midPoint);

    const direction = new THREE.Vector3().subVectors(endPos, startPos).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const quaternion = new THREE.Quaternion().setFromUnitVectors(up, direction);
    group.quaternion.copy(quaternion);

    group.position.copy(startPos);
    group.translateY(height / 2);

    group.userData = {
      type: 'simple_dna_helix',
      mesh: mesh,
      rotationSpeed: options.rotationSpeed || 0.003
    };

    this.helices.push(group);
    return group;
  }

  /**
   * Crear conexiones DNA entre múltiples núcleos (para híbridos complejos)
   */
  createMultiNucleusConnections(nuclei, colors, options = {}) {
    const connections = new THREE.Group();

    // Conectar cada núcleo con los demás
    for (let i = 0; i < nuclei.length; i++) {
      for (let j = i + 1; j < nuclei.length; j++) {
        const helix = this.createSimpleDNAHelix(
          nuclei[i],
          nuclei[j],
          colors[i],
          {
            radius: options.radius || 8,
            rotationSpeed: 0.001 + Math.random() * 0.002
          }
        );

        connections.add(helix);
      }
    }

    connections.userData = {
      type: 'multi_nucleus_dna',
      nucleiCount: nuclei.length
    };

    return connections;
  }

  /**
   * Animar todas las hélices
   */
  animate(_deltaTime = 0.016) {
    this.helices.forEach(helix => {
      if (helix.userData.type === 'dna_helix') {
        // Rotar la hélice completa
        helix.rotation.y += helix.userData.rotationSpeed;

        // Pulso de brillo en pares de bases
        helix.userData.basePairs.forEach((pair, i) => {
          const phase = (i / helix.userData.basePairs.length) * Math.PI * 2;
          const localPulse = Math.sin(Date.now() * 0.003 + phase) * 0.3 + 0.7;

          if (pair.base1.material) {
            pair.base1.material.emissiveIntensity = 0.5 + localPulse * 0.5;
          }
          if (pair.base2.material) {
            pair.base2.material.emissiveIntensity = 0.5 + localPulse * 0.5;
          }
        });

      } else if (helix.userData.type === 'simple_dna_helix') {
        // Rotar hélice simple
        helix.rotation.y += helix.userData.rotationSpeed;

        // Pulso de brillo
        if (helix.userData.mesh && helix.userData.mesh.material) {
          const pulse = Math.sin(Date.now() * 0.002) * 0.3 + 0.7;
          helix.userData.mesh.material.emissiveIntensity = 0.5 + pulse * 0.5;
        }
      }
    });
  }

  /**
   * Limpiar todas las hélices
   */
  clear() {
    this.helices.forEach(helix => {
      helix.traverse(child => {
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
    this.helices = [];
  }

  /**
   * Remover hélice específica
   */
  removeHelix(helix) {
    const index = this.helices.indexOf(helix);
    if (index > -1) {
      this.helices.splice(index, 1);
      helix.traverse(child => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(mat => mat.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    }
  }
}

// Exportar para uso en navegador
if (typeof window !== 'undefined') {
  window.DNAHelixSystem = DNAHelixSystem;
  // logger.debug('✅ DNAHelixSystem class registered globally');
}
