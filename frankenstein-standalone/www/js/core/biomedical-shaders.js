/**
 * Shaders Biomédicos para Tejidos Orgánicos
 * Efectos realistas: venas pulsantes, membranas iridiscentes, bioluminiscencia
 *
 * @version 2.0.0
 * @author J. Irurtzun & Claude Sonnet 4.5
 */

class BiomedicalShaders {
  constructor() {
    // Cache de materiales para reutilización
    this.materialCache = new Map();
  }

  /**
   * Shader de Tejido Orgánico con Venas
   * Efectos: Perlin noise, red vascular, pulso sanguíneo
   */
  getOrganicTissueShader() {
    return {
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec2 vUv;

        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          vUv = uv;

          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,

      fragmentShader: `
        uniform vec3 baseColor;
        uniform vec3 veinColor;
        uniform float time;
        uniform float veinDensity;
        uniform float pulseSpeed;
        uniform float roughness;

        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec2 vUv;

        // Perlin Noise 3D simplificado
        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
        vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

        float snoise(vec3 v) {
          const vec2 C = vec2(1.0/6.0, 1.0/3.0);
          const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

          vec3 i  = floor(v + dot(v, C.yyy));
          vec3 x0 = v - i + dot(i, C.xxx);

          vec3 g = step(x0.yzx, x0.xyz);
          vec3 l = 1.0 - g;
          vec3 i1 = min(g.xyz, l.zxy);
          vec3 i2 = max(g.xyz, l.zxy);

          vec3 x1 = x0 - i1 + C.xxx;
          vec3 x2 = x0 - i2 + C.yyy;
          vec3 x3 = x0 - D.yyy;

          i = mod289(i);
          vec4 p = permute(permute(permute(
                    i.z + vec4(0.0, i1.z, i2.z, 1.0))
                  + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                  + i.x + vec4(0.0, i1.x, i2.x, 1.0));

          float n_ = 0.142857142857;
          vec3 ns = n_ * D.wyz - D.xzx;

          vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

          vec4 x_ = floor(j * ns.z);
          vec4 y_ = floor(j - 7.0 * x_);

          vec4 x = x_ *ns.x + ns.yyyy;
          vec4 y = y_ *ns.x + ns.yyyy;
          vec4 h = 1.0 - abs(x) - abs(y);

          vec4 b0 = vec4(x.xy, y.xy);
          vec4 b1 = vec4(x.zw, y.zw);

          vec4 s0 = floor(b0)*2.0 + 1.0;
          vec4 s1 = floor(b1)*2.0 + 1.0;
          vec4 sh = -step(h, vec4(0.0));

          vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
          vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;

          vec3 p0 = vec3(a0.xy, h.x);
          vec3 p1 = vec3(a0.zw, h.y);
          vec3 p2 = vec3(a1.xy, h.z);
          vec3 p3 = vec3(a1.zw, h.w);

          vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
          p0 *= norm.x;
          p1 *= norm.y;
          p2 *= norm.z;
          p3 *= norm.w;

          vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
          m = m * m;
          return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
        }

        // Worley Noise para red vascular
        float worleyNoise(vec3 p) {
          vec3 id = floor(p);
          vec3 fd = fract(p);

          float minDist = 1.0;

          for(float x = -1.0; x <= 1.0; x++) {
            for(float y = -1.0; y <= 1.0; y++) {
              for(float z = -1.0; z <= 1.0; z++) {
                vec3 neighbor = vec3(x, y, z);
                vec3 point = fract(sin(id + neighbor) * 43758.5453);

                float dist = length(neighbor + point - fd);
                minDist = min(minDist, dist);
              }
            }
          }

          return minDist;
        }

        void main() {
          // Textura base orgánica (rugosidad)
          float organicNoise = snoise(vPosition * 0.02) * 0.5 + 0.5;
          organicNoise = mix(0.5, organicNoise, roughness);

          // Red vascular (Worley noise)
          float veins = worleyNoise(vPosition * veinDensity);
          veins = smoothstep(0.0, 0.15, veins);

          // Pulso sanguíneo en las venas
          float pulse = sin(time * pulseSpeed + vPosition.y * 0.1) * 0.5 + 0.5;
          float veinPulse = mix(0.7, 1.0, pulse);

          // Color final mezclando tejido base y venas
          vec3 tissueColor = baseColor * organicNoise;
          vec3 finalColor = mix(veinColor * veinPulse, tissueColor, veins);

          // Fresnel para bordes translúcidos
          vec3 viewDirection = normalize(cameraPosition - vPosition);
          float fresnel = pow(1.0 - max(dot(vNormal, viewDirection), 0.0), 3.0);
          finalColor += fresnel * baseColor * 0.3;

          // Subsurface scattering aproximado
          float subsurface = max(0.0, dot(vNormal, vec3(0.0, 1.0, 0.0))) * 0.2;
          finalColor += baseColor * subsurface;

          gl_FragColor = vec4(finalColor, 0.85);
        }
      `
    };
  }

  /**
   * Shader de Membrana Iridiscente
   * Efectos: Iridiscencia, transparencia, efecto soap bubble
   */
  getIridescentMembraneShader() {
    return {
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewPosition;

        void main() {
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vViewPosition = -mvPosition.xyz;
          vNormal = normalMatrix * normal;

          gl_Position = projectionMatrix * mvPosition;
        }
      `,

      fragmentShader: `
        uniform vec3 color1;
        uniform vec3 color2;
        uniform vec3 color3;
        uniform float time;
        uniform float iridescence;

        varying vec3 vNormal;
        varying vec3 vViewPosition;

        void main() {
          vec3 normal = normalize(vNormal);
          vec3 viewDir = normalize(vViewPosition);

          // Fresnel para iridiscencia
          float fresnel = pow(1.0 - abs(dot(normal, viewDir)), 2.0);

          // Variación cromática basada en ángulo de visión
          float angle = acos(dot(normal, viewDir));
          float cycle = fract(angle * 3.0 + time * 0.1);

          vec3 iridColor;
          if(cycle < 0.33) {
            iridColor = mix(color1, color2, cycle * 3.0);
          } else if(cycle < 0.66) {
            iridColor = mix(color2, color3, (cycle - 0.33) * 3.0);
          } else {
            iridColor = mix(color3, color1, (cycle - 0.66) * 3.0);
          }

          // Mezclar con efecto Fresnel
          vec3 finalColor = mix(color1, iridColor, fresnel * iridescence);

          // Transparencia variable
          float alpha = 0.15 + fresnel * 0.3;

          gl_FragColor = vec4(finalColor, alpha);
        }
      `
    };
  }

  /**
   * Shader de Bioluminiscencia Pulsante
   * Efectos: Brillo interno, pulso, difusión luminosa
   */
  getBiolumShader() {
    return {
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;

        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;

          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,

      fragmentShader: `
        uniform vec3 glowColor;
        uniform float time;
        uniform float pulseSpeed;
        uniform float intensity;

        varying vec3 vNormal;
        varying vec3 vPosition;

        // Noise simple para variación
        float random(vec2 st) {
          return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
        }

        void main() {
          // Pulso global
          float pulse = sin(time * pulseSpeed) * 0.5 + 0.5;

          // Variación local con noise
          float localVariation = random(vPosition.xy) * 0.3 + 0.7;

          // Intensidad combinada
          float glowIntensity = intensity * pulse * localVariation;

          // Color con gradiente de intensidad
          vec3 finalColor = glowColor * glowIntensity;

          // Fresnel para mayor brillo en bordes
          vec3 viewDir = normalize(cameraPosition - vPosition);
          float fresnel = pow(1.0 - max(dot(vNormal, viewDir), 0.0), 2.0);
          finalColor += glowColor * fresnel * 0.5;

          gl_FragColor = vec4(finalColor, 0.9);
        }
      `
    };
  }

  /**
   * Crear material de tejido orgánico
   */
  createOrganicTissueMaterial(baseColor, veinColor, options = {}) {
    const key = `organic_${baseColor.getHexString()}_${veinColor.getHexString()}`;

    if (this.materialCache.has(key)) {
      return this.materialCache.get(key).clone();
    }

    const shader = this.getOrganicTissueShader();

    const material = new THREE.ShaderMaterial({
      uniforms: {
        baseColor: { value: baseColor },
        veinColor: { value: veinColor },
        time: { value: 0 },
        veinDensity: { value: options.veinDensity || 0.05 },
        pulseSpeed: { value: options.pulseSpeed || 1.2 },
        roughness: { value: options.roughness || 0.8 }
      },
      vertexShader: shader.vertexShader,
      fragmentShader: shader.fragmentShader,
      transparent: true,
      side: THREE.FrontSide
    });

    this.materialCache.set(key, material);
    return material.clone();
  }

  /**
   * Crear material de membrana iridiscente
   */
  createIridescentMembraneMaterial(baseColor, options = {}) {
    const shader = this.getIridescentMembraneShader();

    // Paleta de colores para iridiscencia
    const color1 = baseColor;
    const color2 = new THREE.Color().setHSL(
      (baseColor.getHSL({}).h + 0.1) % 1.0,
      0.8,
      0.6
    );
    const color3 = new THREE.Color().setHSL(
      (baseColor.getHSL({}).h + 0.2) % 1.0,
      0.9,
      0.7
    );

    const material = new THREE.ShaderMaterial({
      uniforms: {
        color1: { value: color1 },
        color2: { value: color2 },
        color3: { value: color3 },
        time: { value: 0 },
        iridescence: { value: options.iridescence || 1.0 }
      },
      vertexShader: shader.vertexShader,
      fragmentShader: shader.fragmentShader,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    return material;
  }

  /**
   * Crear material bioluminiscente
   */
  createBiolumMaterial(glowColor, options = {}) {
    const shader = this.getBiolumShader();

    const material = new THREE.ShaderMaterial({
      uniforms: {
        glowColor: { value: glowColor },
        time: { value: 0 },
        pulseSpeed: { value: options.pulseSpeed || 0.003 },
        intensity: { value: options.intensity || 1.0 }
      },
      vertexShader: shader.vertexShader,
      fragmentShader: shader.fragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    return material;
  }

  /**
   * Crear material estándar mejorado con mapas
   */
  createEnhancedStandardMaterial(color, options = {}) {
    const material = new THREE.MeshStandardMaterial({
      color: color,
      roughness: options.roughness || 0.7,
      metalness: options.metalness || 0.1,
      emissive: options.emissive || color,
      emissiveIntensity: options.emissiveIntensity || 0.3,
      transparent: options.transparent !== undefined ? options.transparent : true,
      opacity: options.opacity || 0.85,
      side: options.side || THREE.FrontSide
    });

    // Si hay texturas procedurales, aplicarlas
    if (options.normalMap) {
      material.normalMap = options.normalMap;
      material.normalScale = new THREE.Vector2(0.5, 0.5);
    }

    if (options.roughnessMap) {
      material.roughnessMap = options.roughnessMap;
    }

    return material;
  }

  /**
   * Actualizar uniformes de tiempo en materiales
   */
  updateTime(material, time) {
    if (material.uniforms && material.uniforms.time) {
      material.uniforms.time.value = time;
    }
  }

  /**
   * Actualizar todos los materiales en un objeto 3D
   */
  updateMaterials(object3D, time) {
    object3D.traverse((child) => {
      if (child.isMesh && child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(mat => this.updateTime(mat, time));
        } else {
          this.updateTime(child.material, time);
        }
      }
    });
  }

  /**
   * Factory principal - Crear material según tipo de órgano
   */
  createMaterialForOrgan(organType, baseColor) {
    const veinColor = new THREE.Color(baseColor).multiplyScalar(0.6); // Venas más oscuras

    switch (organType) {
      case 'Cerebro':
      case 'Cerebro Superior':
      case 'Cerebro Filosófico':
        // Cerebro: muchas venas, textura rugosa
        return this.createOrganicTissueMaterial(baseColor, veinColor, {
          veinDensity: 0.08,
          pulseSpeed: 0.8,
          roughness: 0.9
        });

      case 'Corazón':
        // Corazón: pulso rápido, venas prominentes
        return this.createOrganicTissueMaterial(baseColor, veinColor, {
          veinDensity: 0.06,
          pulseSpeed: 1.2,
          roughness: 0.7
        });

      case 'Pulmones':
      case 'Pulmones Conscientes':
        // Pulmones: textura esponjosa, menos venas
        return this.createOrganicTissueMaterial(baseColor, veinColor, {
          veinDensity: 0.04,
          pulseSpeed: 0.5,
          roughness: 0.85
        });

      case 'Sistema Nervioso':
        // Sistema nervioso: muy luminoso, pocas venas
        return this.createBiolumMaterial(baseColor, {
          pulseSpeed: 0.005,
          intensity: 0.8
        });

      case 'Músculos':
        // Músculos: textura fibrosa, venas longitudinales
        return this.createOrganicTissueMaterial(baseColor, veinColor, {
          veinDensity: 0.03,
          pulseSpeed: 1.0,
          roughness: 0.6
        });

      case 'Esqueleto':
        // Huesos: textura porosa, sin venas
        return this.createEnhancedStandardMaterial(baseColor, {
          roughness: 0.9,
          metalness: 0.0,
          emissiveIntensity: 0.1,
          opacity: 0.95
        });

      default:
        // Material genérico orgánico
        return this.createOrganicTissueMaterial(baseColor, veinColor, {
          veinDensity: 0.05,
          pulseSpeed: 1.0,
          roughness: 0.8
        });
    }
  }

  /**
   * Crear material para membrana
   */
  createMembraneMaterial(baseColor) {
    return this.createIridescentMembraneMaterial(baseColor, {
      iridescence: 0.8
    });
  }
}

// Exportar para uso en navegador
if (typeof window !== 'undefined') {
  window.BiomedicalShaders = BiomedicalShaders;
  // console.log('✅ BiomedicalShaders class registered globally');
}
