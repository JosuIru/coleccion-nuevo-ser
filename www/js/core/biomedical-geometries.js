/**
// 🔧 FIX v2.9.198: Migrated console.log to logger
 * Sistema de Geometrías Biomédicas
 * Crea geometrías orgánicas realistas para cada tipo de órgano
 *
 * @version 2.0.0
 * @author J. Irurtzun & Claude Sonnet 4.5
 */

class BiomedicalGeometries {
  constructor() {
    this.perlinSeed = Math.random() * 1000;
  }

  /**
   * Perlin Noise 3D simplificado para deformaciones orgánicas
   */
  perlinNoise3D(x, y, z) {
    // Implementación simplificada de Perlin noise
    const xi = Math.floor(x) & 255;
    const yi = Math.floor(y) & 255;
    const zi = Math.floor(z) & 255;

    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);
    const zf = z - Math.floor(z);

    const u = this.fade(xf);
    const v = this.fade(yf);
    const w = this.fade(zf);

    const aaa = this.grad(this.p[this.p[this.p[xi] + yi] + zi], xf, yf, zf);
    const aba = this.grad(this.p[this.p[this.p[xi] + yi + 1] + zi], xf, yf - 1, zf);
    const aab = this.grad(this.p[this.p[this.p[xi] + yi] + zi + 1], xf, yf, zf - 1);
    const abb = this.grad(this.p[this.p[this.p[xi] + yi + 1] + zi + 1], xf, yf - 1, zf - 1);
    const baa = this.grad(this.p[this.p[this.p[xi + 1] + yi] + zi], xf - 1, yf, zf);
    const bba = this.grad(this.p[this.p[this.p[xi + 1] + yi + 1] + zi], xf - 1, yf - 1, zf);
    const bab = this.grad(this.p[this.p[this.p[xi + 1] + yi] + zi + 1], xf - 1, yf, zf - 1);
    const bbb = this.grad(this.p[this.p[this.p[xi + 1] + yi + 1] + zi + 1], xf - 1, yf - 1, zf - 1);

    const x1 = this.lerp(aaa, baa, u);
    const x2 = this.lerp(aba, bba, u);
    const y1 = this.lerp(x1, x2, v);

    const x3 = this.lerp(aab, bab, u);
    const x4 = this.lerp(abb, bbb, u);
    const y2 = this.lerp(x3, x4, v);

    return this.lerp(y1, y2, w);
  }

  fade(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  lerp(a, b, t) {
    return a + t * (b - a);
  }

  grad(hash, x, y, z) {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  // Tabla de permutación para Perlin noise
  get p() {
    if (!this._p) {
      this._p = [];
      for (let i = 0; i < 256; i++) {
        this._p[i] = Math.floor(Math.random() * 256);
      }
      this._p = this._p.concat(this._p);
    }
    return this._p;
  }

  /**
   * CEREBRO - Dos hemisferios con circunvoluciones
   */
  createBrainGeometry(radius = 150, detail = 2) {
    const group = new THREE.Group();

    // Hemisferio izquierdo
    const leftHemisphere = new THREE.SphereGeometry(radius * 0.9, 32, 32, 0, Math.PI);
    const leftPositions = leftHemisphere.attributes.position;

    // Aplicar circunvoluciones (surcos y giros)
    for (let i = 0; i < leftPositions.count; i++) {
      const x = leftPositions.getX(i);
      const y = leftPositions.getY(i);
      const z = leftPositions.getZ(i);

      // Noise para circunvoluciones
      const noise = this.perlinNoise3D(x * 0.03, y * 0.03, z * 0.03) * 20;
      const length = Math.sqrt(x * x + y * y + z * z);
      const factor = (radius + noise) / length;

      leftPositions.setXYZ(i, x * factor, y * factor, z * factor);
    }
    leftPositions.needsUpdate = true;
    leftHemisphere.computeVertexNormals();

    const leftMesh = new THREE.Mesh(leftHemisphere);
    leftMesh.position.x = -radius * 0.05;

    // Hemisferio derecho (espejo)
    const rightHemisphere = leftHemisphere.clone();
    const rightMesh = new THREE.Mesh(rightHemisphere);
    rightMesh.position.x = radius * 0.05;
    rightMesh.rotation.y = Math.PI;

    // Corpus callosum (conexión entre hemisferios)
    const corpusGeometry = new THREE.BoxGeometry(radius * 0.2, radius * 0.3, radius * 0.6);
    const corpusMesh = new THREE.Mesh(corpusGeometry);
    corpusMesh.position.y = -radius * 0.2;

    group.add(leftMesh, rightMesh, corpusMesh);

    // Metadatos
    group.userData = {
      type: 'brain',
      parts: { left: leftMesh, right: rightMesh, corpus: corpusMesh }
    };

    return group;
  }

  /**
   * CORAZÓN - 4 cámaras anatómicas
   */
  createHeartGeometry(radius = 150) {
    const group = new THREE.Group();

    // Forma base de corazón usando LatheGeometry
    const heartCurve = new THREE.CubicBezierCurve3(
      new THREE.Vector3(0, -radius * 1.2, 0),
      new THREE.Vector3(radius * 0.6, -radius * 0.6, 0),
      new THREE.Vector3(radius * 0.6, radius * 0.3, 0),
      new THREE.Vector3(0, radius * 0.6, 0)
    );

    const points = heartCurve.getPoints(20);
    const heartShape = new THREE.LatheGeometry(
      points.map(p => new THREE.Vector2(Math.abs(p.x), p.y)),
      24
    );

    const heartMesh = new THREE.Mesh(heartShape);

    // Aurículas (cámaras superiores)
    const leftAtrium = new THREE.SphereGeometry(radius * 0.4, 16, 16);
    const leftAtriumMesh = new THREE.Mesh(leftAtrium);
    leftAtriumMesh.position.set(-radius * 0.4, radius * 0.4, 0);
    leftAtriumMesh.scale.set(1, 0.8, 1);

    const rightAtrium = leftAtrium.clone();
    const rightAtriumMesh = new THREE.Mesh(rightAtrium);
    rightAtriumMesh.position.set(radius * 0.4, radius * 0.4, 0);
    rightAtriumMesh.scale.set(1, 0.8, 1);

    // Válvulas (cilindros pequeños)
    const valves = [];
    for (let i = 0; i < 4; i++) {
      const valveGeometry = new THREE.CylinderGeometry(radius * 0.1, radius * 0.1, radius * 0.15, 8);
      const valveMesh = new THREE.Mesh(valveGeometry);
      const angle = (i / 4) * Math.PI * 2;
      valveMesh.position.set(
        Math.cos(angle) * radius * 0.3,
        radius * 0.1,
        Math.sin(angle) * radius * 0.3
      );
      valves.push(valveMesh);
      group.add(valveMesh);
    }

    // Aorta (tubo principal)
    const aortaCurve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(0, radius * 0.6, 0),
      new THREE.Vector3(radius * 0.3, radius * 0.9, 0),
      new THREE.Vector3(radius * 0.2, radius * 1.2, radius * 0.2)
    );
    const aortaGeometry = new THREE.TubeGeometry(aortaCurve, 20, radius * 0.15, 8, false);
    const aortaMesh = new THREE.Mesh(aortaGeometry);

    group.add(heartMesh, leftAtriumMesh, rightAtriumMesh, aortaMesh);

    // Metadatos
    group.userData = {
      type: 'heart',
      parts: {
        ventricles: heartMesh,
        leftAtrium: leftAtriumMesh,
        rightAtrium: rightAtriumMesh,
        valves: valves,
        aorta: aortaMesh
      }
    };

    return group;
  }

  /**
   * PULMONES - Estructura bronquial con alvéolos
   */
  createLungsGeometry(radius = 150) {
    const group = new THREE.Group();

    // Función recursiva para crear árbol bronquial
    const createBronchialTree = (startPos, direction, length, depth, maxDepth) => {
      if (depth >= maxDepth) {
        // Alvéolo terminal
        const alveolus = new THREE.SphereGeometry(radius * 0.05, 6, 6);
        const alveolusMesh = new THREE.Mesh(alveolus);
        alveolusMesh.position.copy(startPos);
        return alveolusMesh;
      }

      // Bronquio
      const endPos = startPos.clone().add(direction.clone().multiplyScalar(length));
      const bronchiusCurve = new THREE.LineCurve3(startPos, endPos);
      const bronchiusGeometry = new THREE.TubeGeometry(
        bronchiusCurve,
        2,
        radius * 0.05 * (1 - depth / maxDepth),
        6,
        false
      );
      const bronchiusMesh = new THREE.Mesh(bronchiusGeometry);
      group.add(bronchiusMesh);

      // Ramificación
      const angle1 = Math.PI / 6;
      const angle2 = -Math.PI / 6;

      const dir1 = direction.clone().applyAxisAngle(new THREE.Vector3(0, 0, 1), angle1);
      const dir2 = direction.clone().applyAxisAngle(new THREE.Vector3(0, 0, 1), angle2);

      const branch1 = createBronchialTree(endPos, dir1, length * 0.7, depth + 1, maxDepth);
      const branch2 = createBronchialTree(endPos, dir2, length * 0.7, depth + 1, maxDepth);

      if (branch1) group.add(branch1);
      if (branch2) group.add(branch2);

      return bronchiusMesh;
    };

    // Pulmón izquierdo (2 lóbulos)
    const leftLungGroup = new THREE.Group();
    const leftLobe1 = new THREE.SphereGeometry(radius * 0.7, 16, 16);
    const leftLobe1Mesh = new THREE.Mesh(leftLobe1);
    leftLobe1Mesh.scale.set(0.8, 1.2, 0.7);
    leftLobe1Mesh.position.set(0, radius * 0.3, 0);

    const leftLobe2 = new THREE.SphereGeometry(radius * 0.6, 16, 16);
    const leftLobe2Mesh = new THREE.Mesh(leftLobe2);
    leftLobe2Mesh.scale.set(0.8, 1, 0.7);
    leftLobe2Mesh.position.set(0, -radius * 0.3, 0);

    leftLungGroup.add(leftLobe1Mesh, leftLobe2Mesh);
    leftLungGroup.position.set(-radius * 0.6, 0, 0);

    // Bronquios izquierdos
    createBronchialTree(
      new THREE.Vector3(-radius * 0.2, radius * 0.3, 0),
      new THREE.Vector3(-1, 0.2, 0).normalize(),
      radius * 0.4,
      0,
      3
    );

    // Pulmón derecho (3 lóbulos)
    const rightLungGroup = new THREE.Group();
    const rightLobe1 = new THREE.SphereGeometry(radius * 0.6, 16, 16);
    const rightLobe1Mesh = new THREE.Mesh(rightLobe1);
    rightLobe1Mesh.scale.set(0.8, 1, 0.7);
    rightLobe1Mesh.position.set(0, radius * 0.5, 0);

    const rightLobe2 = new THREE.SphereGeometry(radius * 0.65, 16, 16);
    const rightLobe2Mesh = new THREE.Mesh(rightLobe2);
    rightLobe2Mesh.scale.set(0.8, 1.1, 0.7);
    rightLobe2Mesh.position.set(0, 0, 0);

    const rightLobe3 = new THREE.SphereGeometry(radius * 0.55, 16, 16);
    const rightLobe3Mesh = new THREE.Mesh(rightLobe3);
    rightLobe3Mesh.scale.set(0.8, 0.9, 0.7);
    rightLobe3Mesh.position.set(0, -radius * 0.5, 0);

    rightLungGroup.add(rightLobe1Mesh, rightLobe2Mesh, rightLobe3Mesh);
    rightLungGroup.position.set(radius * 0.6, 0, 0);

    // Bronquios derechos
    createBronchialTree(
      new THREE.Vector3(radius * 0.2, radius * 0.3, 0),
      new THREE.Vector3(1, 0.2, 0).normalize(),
      radius * 0.4,
      0,
      3
    );

    group.add(leftLungGroup, rightLungGroup);

    // Metadatos
    group.userData = {
      type: 'lungs',
      parts: {
        leftLobe: leftLungGroup,
        rightLobe: rightLungGroup
      }
    };

    return group;
  }

  /**
   * SISTEMA NERVIOSO - Red neuronal 3D
   */
  createNeuralNetworkGeometry(radius = 150, neuronCount = 20) {
    const group = new THREE.Group();
    const neurons = [];
    const connections = [];

    // Crear neuronas en posiciones aleatorias dentro de esfera
    for (let i = 0; i < neuronCount; i++) {
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = Math.random() * Math.PI * 2;
      const r = radius * Math.cbrt(Math.random());

      const position = new THREE.Vector3(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      );

      // Soma (cuerpo celular)
      const somaGeometry = new THREE.SphereGeometry(radius * 0.08, 8, 8);
      const somaMesh = new THREE.Mesh(somaGeometry);
      somaMesh.position.copy(position);

      // Dendritas (ramificaciones)
      const dendrites = [];
      const dendriteCount = 3 + Math.floor(Math.random() * 3);

      for (let j = 0; j < dendriteCount; j++) {
        const dendriteDir = new THREE.Vector3(
          Math.random() - 0.5,
          Math.random() - 0.5,
          Math.random() - 0.5
        );

        // Validar que no sea vector cero antes de normalizar
        if (dendriteDir.length() > 0.001) {
          dendriteDir.normalize();
        } else {
          dendriteDir.set(1, 0, 0); // Vector por defecto
        }

        const dendriteEnd = position.clone().add(
          dendriteDir.multiplyScalar(radius * 0.2)
        );

        const dendriteCurve = new THREE.LineCurve3(position, dendriteEnd);
        const dendriteGeometry = new THREE.TubeGeometry(
          dendriteCurve, 2, radius * 0.01, 4, false
        );
        const dendriteMesh = new THREE.Mesh(dendriteGeometry);
        dendrites.push(dendriteMesh);
        group.add(dendriteMesh);
      }

      neurons.push({
        soma: somaMesh,
        dendrites: dendrites,
        position: position
      });

      group.add(somaMesh);
    }

    // Crear axones (conexiones entre neuronas cercanas)
    for (let i = 0; i < neurons.length; i++) {
      for (let j = i + 1; j < neurons.length; j++) {
        const distance = neurons[i].position.distanceTo(neurons[j].position);

        if (distance < radius * 0.6 && Math.random() < 0.3) {
          // Axon con curva suave
          const midPoint = neurons[i].position.clone()
            .add(neurons[j].position)
            .multiplyScalar(0.5);

          midPoint.add(new THREE.Vector3(
            (Math.random() - 0.5) * radius * 0.2,
            (Math.random() - 0.5) * radius * 0.2,
            (Math.random() - 0.5) * radius * 0.2
          ));

          const axonCurve = new THREE.QuadraticBezierCurve3(
            neurons[i].position,
            midPoint,
            neurons[j].position
          );

          const axonGeometry = new THREE.TubeGeometry(
            axonCurve, 20, radius * 0.015, 4, false
          );
          const axonMesh = new THREE.Mesh(axonGeometry);

          connections.push({
            axon: axonMesh,
            from: neurons[i],
            to: neurons[j]
          });

          group.add(axonMesh);
        }
      }
    }

    // Metadatos
    group.userData = {
      type: 'nervous_system',
      neurons: neurons,
      connections: connections
    };

    return group;
  }

  /**
   * MANOS - Manos en posición mudra/creativa
   */
  createHandsGeometry(radius = 150) {
    const group = new THREE.Group();

    const createHand = () => {
      const handGroup = new THREE.Group();

      // Palma
      const palmGeometry = new THREE.BoxGeometry(
        radius * 0.5,
        radius * 0.05,
        radius * 0.6
      );
      const palmMesh = new THREE.Mesh(palmGeometry);
      handGroup.add(palmMesh);

      // 5 dedos
      const fingerPositions = [
        { x: -radius * 0.25, z: -radius * 0.25, angle: -0.3 }, // Pulgar
        { x: -radius * 0.15, z: radius * 0.3, angle: 0 },      // Índice
        { x: 0, z: radius * 0.35, angle: 0 },                  // Medio
        { x: radius * 0.15, z: radius * 0.3, angle: 0 },       // Anular
        { x: radius * 0.25, z: radius * 0.25, angle: 0.2 }     // Meñique
      ];

      fingerPositions.forEach((pos, i) => {
        const fingerGroup = new THREE.Group();

        // 3 falanges por dedo
        for (let j = 0; j < 3; j++) {
          const phalanxLength = radius * 0.15 * (1 - j * 0.15);
          const phalanxGeometry = new THREE.CylinderGeometry(
            radius * 0.03,
            radius * 0.03,
            phalanxLength,
            8
          );
          const phalanxMesh = new THREE.Mesh(phalanxGeometry);
          phalanxMesh.position.y = phalanxLength / 2 + j * phalanxLength;
          phalanxMesh.rotation.z = j * 0.1; // Ligera curvatura
          fingerGroup.add(phalanxMesh);
        }

        fingerGroup.position.set(pos.x, radius * 0.025, pos.z);
        fingerGroup.rotation.x = pos.angle;
        handGroup.add(fingerGroup);
      });

      return handGroup;
    };

    // Mano izquierda
    const leftHand = createHand();
    leftHand.position.set(-radius * 0.6, 0, 0);
    leftHand.rotation.y = Math.PI / 4;

    // Mano derecha
    const rightHand = createHand();
    rightHand.position.set(radius * 0.6, 0, 0);
    rightHand.rotation.y = -Math.PI / 4;
    rightHand.scale.x = -1; // Espejo

    group.add(leftHand, rightHand);

    // Metadatos
    group.userData = {
      type: 'hands',
      parts: { left: leftHand, right: rightHand }
    };

    return group;
  }

  /**
   * MÚSCULOS - Bundle de fibras musculares
   */
  createMuscleGeometry(radius = 150, fiberCount = 30) {
    const group = new THREE.Group();
    const fibers = [];

    // Crear bundle de fibras paralelas
    for (let i = 0; i < fiberCount; i++) {
      const angle = (i / fiberCount) * Math.PI * 2;
      const bundleRadius = radius * 0.5;
      const x = Math.cos(angle) * bundleRadius;
      const z = Math.sin(angle) * bundleRadius;

      // Fibra muscular (cilindro con textura estriada)
      const fiberGeometry = new THREE.CylinderGeometry(
        radius * 0.05,
        radius * 0.05,
        radius * 1.8,
        8
      );
      const fiberMesh = new THREE.Mesh(fiberGeometry);
      fiberMesh.position.set(x, 0, z);

      fibers.push(fiberMesh);
      group.add(fiberMesh);
    }

    // Tendones en extremos (color blanquecino)
    const tendonTopGeometry = new THREE.CylinderGeometry(
      radius * 0.6,
      radius * 0.4,
      radius * 0.3,
      16
    );
    const tendonTopMesh = new THREE.Mesh(tendonTopGeometry);
    tendonTopMesh.position.y = radius * 1.05;

    const tendonBottomGeometry = new THREE.CylinderGeometry(
      radius * 0.4,
      radius * 0.6,
      radius * 0.3,
      16
    );
    const tendonBottomMesh = new THREE.Mesh(tendonBottomGeometry);
    tendonBottomMesh.position.y = -radius * 1.05;

    group.add(tendonTopMesh, tendonBottomMesh);

    // Metadatos
    group.userData = {
      type: 'muscle',
      fibers: fibers,
      parts: {
        fibers: fibers,
        tendonTop: tendonTopMesh,
        tendonBottom: tendonBottomMesh
      }
    };

    return group;
  }

  /**
   * ESQUELETO - Vértebra/hueso
   */
  createBoneGeometry(radius = 150) {
    const group = new THREE.Group();

    // Cuerpo vertebral
    const bodyGeometry = new THREE.CylinderGeometry(
      radius * 0.6,
      radius * 0.6,
      radius * 0.4,
      16
    );

    // Aplicar textura porosa (trabecular)
    const bodyPositions = bodyGeometry.attributes.position;
    for (let i = 0; i < bodyPositions.count; i++) {
      const x = bodyPositions.getX(i);
      const y = bodyPositions.getY(i);
      const z = bodyPositions.getZ(i);

      const noise = this.perlinNoise3D(x * 0.1, y * 0.1, z * 0.1) * 5;
      bodyPositions.setXYZ(i, x + noise, y, z + noise);
    }
    bodyPositions.needsUpdate = true;
    bodyGeometry.computeVertexNormals();

    const bodyMesh = new THREE.Mesh(bodyGeometry);
    group.add(bodyMesh);

    // Apófisis transversas (protuberancias laterales)
    const processGeometry = new THREE.BoxGeometry(
      radius * 0.5,
      radius * 0.15,
      radius * 0.15
    );

    const leftProcess = new THREE.Mesh(processGeometry);
    leftProcess.position.set(-radius * 0.5, radius * 0.1, 0);

    const rightProcess = new THREE.Mesh(processGeometry);
    rightProcess.position.set(radius * 0.5, radius * 0.1, 0);

    // Apófisis espinosa (posterior)
    const spinousProcess = new THREE.Mesh(
      new THREE.BoxGeometry(radius * 0.15, radius * 0.6, radius * 0.15)
    );
    spinousProcess.position.set(0, radius * 0.1, -radius * 0.3);

    group.add(leftProcess, rightProcess, spinousProcess);

    // Agujero vertebral (canal medular)
    const foramenGeometry = new THREE.TorusGeometry(radius * 0.25, radius * 0.08, 8, 16);
    const foramenMesh = new THREE.Mesh(foramenGeometry);
    foramenMesh.rotation.x = Math.PI / 2;
    group.add(foramenMesh);

    // Metadatos
    group.userData = {
      type: 'bone',
      parts: {
        body: bodyMesh,
        processes: [leftProcess, rightProcess, spinousProcess],
        foramen: foramenMesh
      }
    };

    return group;
  }

  /**
   * SISTEMA DIGESTIVO - Tubo intestinal con pliegues
   */
  createDigestiveGeometry(radius = 150) {
    const group = new THREE.Group();

    // Estómago (parte superior)
    const stomachGeometry = new THREE.SphereGeometry(radius * 0.7, 16, 16);
    stomachGeometry.scale(1.2, 1, 0.8);
    const stomachMesh = new THREE.Mesh(stomachGeometry);
    stomachMesh.position.y = radius * 0.5;
    group.add(stomachMesh);

    // Intestino delgado (TorusKnot para simular plegamiento)
    const smallIntestineCurve = new THREE.CurvePath();

    // Crear curva espiral para intestino
    const turns = 4;
    const segments = 100;
    for (let i = 0; i < segments; i++) {
      const t = i / segments;
      const angle = t * Math.PI * 2 * turns;
      const spiralRadius = radius * 0.6 * (1 - t * 0.3);

      const point = new THREE.Vector3(
        Math.cos(angle) * spiralRadius,
        -t * radius * 1.5,
        Math.sin(angle) * spiralRadius
      );

      if (i === 0) {
        smallIntestineCurve.moveTo(point.x, point.y);
      }
    }

    // Usar TorusKnotGeometry modificado
    const intestineGeometry = new THREE.TorusKnotGeometry(
      radius * 0.6,
      radius * 0.08,
      64,
      8,
      3,
      2
    );
    const intestineMesh = new THREE.Mesh(intestineGeometry);
    intestineMesh.position.y = -radius * 0.3;
    intestineMesh.scale.set(0.8, 1.2, 0.8);
    group.add(intestineMesh);

    // Intestino grueso (toroide)
    const colonGeometry = new THREE.TorusGeometry(radius * 0.6, radius * 0.12, 12, 24);
    const colonMesh = new THREE.Mesh(colonGeometry);
    colonMesh.rotation.x = Math.PI / 2;
    colonMesh.position.y = -radius * 0.8;
    group.add(colonMesh);

    // Metadatos
    group.userData = {
      type: 'digestive',
      parts: {
        stomach: stomachMesh,
        smallIntestine: intestineMesh,
        colon: colonMesh
      }
    };

    return group;
  }

  /**
   * Factory principal - Retorna geometría según tipo
   */
  createGeometry(organType, radius = 150, detail = 2) {
    switch (organType) {
      case 'Cerebro':
      case 'Cerebro Superior':
      case 'Cerebro Filosófico':
        return this.createBrainGeometry(radius, detail);

      case 'Corazón':
        return this.createHeartGeometry(radius);

      case 'Pulmones':
      case 'Pulmones Conscientes':
        return this.createLungsGeometry(radius);

      case 'Sistema Nervioso':
        return this.createNeuralNetworkGeometry(radius, 15);

      case 'Manos':
      case 'Manos Creadoras':
      case 'Manos Artísticas':
        return this.createHandsGeometry(radius);

      case 'Músculos':
        return this.createMuscleGeometry(radius, 25);

      case 'Esqueleto':
        return this.createBoneGeometry(radius);

      case 'Sistema Digestivo':
        return this.createDigestiveGeometry(radius);

      case 'Sistema Circulatorio':
        // Usar corazón con énfasis en venas
        return this.createHeartGeometry(radius);

      case 'Sistema Vocal':
        // Usar parte de tráquea/laringe (cilindro con anillos)
        const vocalGroup = new THREE.Group();
        const tracheaGeometry = new THREE.CylinderGeometry(
          radius * 0.3, radius * 0.3, radius * 1.5, 16
        );
        const tracheaMesh = new THREE.Mesh(tracheaGeometry);

        // Anillos cartilaginosos
        for (let i = 0; i < 8; i++) {
          const ring = new THREE.Mesh(
            new THREE.TorusGeometry(radius * 0.32, radius * 0.05, 8, 16)
          );
          ring.rotation.x = Math.PI / 2;
          ring.position.y = -radius * 0.7 + i * (radius * 0.2);
          vocalGroup.add(ring);
        }

        vocalGroup.add(tracheaMesh);
        vocalGroup.userData = { type: 'vocal', parts: { trachea: tracheaMesh } };
        return vocalGroup;

      default:
        // Geometría genérica para categorías no mapeadas
        return new THREE.IcosahedronGeometry(radius, detail);
    }
  }
}

// Exportar para uso en navegador
if (typeof window !== 'undefined') {
  window.BiomedicalGeometries = BiomedicalGeometries;
  // logger.debug('✅ BiomedicalGeometries class registered globally');
}
