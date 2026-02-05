// ============================================================================
// LEARNING PATHS DATA - Datos predefinidos y progreso
// ============================================================================
// v2.9.390: Modularizado desde learning-paths.js

class LearningPathsData {
  constructor(learningPaths) {
    this.learningPaths = learningPaths;
  }

  // ==========================================================================
  // PROGRESO
  // ==========================================================================

  loadProgress() {
    try {
      return JSON.parse(localStorage.getItem('learning-paths-progress') || '{}');
    } catch (error) {
      logger.error('Error cargando progreso de rutas de aprendizaje:', error);
      return {};
    }
  }

  saveProgress() {
    try {
      localStorage.setItem('learning-paths-progress', JSON.stringify(this.learningPaths.userProgress));
    } catch (error) {
      logger.error('Error guardando progreso de rutas de aprendizaje:', error);
      window.toast?.error('Error al guardar progreso. Intenta de nuevo.');
    }
  }

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  getBookTitle(bookId) {
    const bookTitles = {
      'tierra-que-despierta': 'Tierra que Despierta',
      'manual-transicion': 'Manual de Transicion',
      'codigo-despertar': 'Codigo del Despertar',
      'guia-acciones': 'Guia de Acciones',
      'toolkit-transicion': 'Toolkit Transicion',
      'manual-practico': 'Manual Practico',
      'practicas-radicales': 'Practicas Radicales',
      'manifiesto': 'Manifiesto',
      'filosofia-nuevo-ser': 'Filosofia Nuevo Ser',
      'dialogos-maquina': 'Dialogos con la Maquina',
      'ahora-instituciones': 'Ahora Instituciones'
    };
    return bookTitles[bookId] || bookId;
  }

  // ==========================================================================
  // PATHS PREDEFINIDOS
  // ==========================================================================

  getPredefinedPaths(bookId) {
    const pathsDatabase = {
      // ========================================================================
      // TIERRA QUE DESPIERTA - Deep Ecology & Reconnection
      // ========================================================================
      'tierra-que-despierta': [
        {
          id: 'procesar-duelo-ecologico',
          icon: '🌍',
          title: 'Procesar Duelo Ecologico',
          description: 'Atraviesa el dolor por la crisis ecologica de forma sana y transformadora',
          duration: '6-8 semanas',
          difficulty: 'Intermedio',
          steps: [
            {
              title: 'Nombrar las Perdidas',
              description: 'Identifica y reconoce las perdidas ecologicas que has presenciado',
              action: 'Completa la practica "Inventario de Perdidas" (Cap 2) y comparte con una persona de confianza',
              resources: ['Cap 2: El Costo del Olvido', 'Practica: Inventario de perdidas'],
              completionCriteria: 'Has creado tu lista personal de perdidas y la has compartido'
            },
            {
              title: 'Comprender la Solastalgia',
              description: 'Explora el dolor del lugar que cambia',
              action: 'Lee sobre solastalgia (Cap 2), identifica donde la sientes en tu vida',
              resources: ['Glenn Albrecht: Solastalgia', 'Cap 2'],
              completionCriteria: 'Puedes nombrar tu propia experiencia de solastalgia'
            },
            {
              title: 'Ritual de Duelo Colectivo',
              description: 'Procesa el duelo en comunidad',
              action: 'Participa u organiza un circulo de duelo ecologico (Work That Reconnects)',
              resources: ['Joanna Macy: The Work That Reconnects', 'Guia de circulos'],
              completionCriteria: 'Has participado en al menos un ritual colectivo de duelo'
            },
            {
              title: 'De Duelo a Accion',
              description: 'Transforma el dolor en compromiso activo',
              action: 'Identifica una accion concreta que honre tu duelo y ejecutala',
              resources: ['Guia de Acciones Transformadoras', 'Ejemplos de acciones'],
              completionCriteria: 'Has completado tu accion y registrado como se sintio'
            }
          ]
        },
        {
          id: 'recordar-pertenencia',
          icon: '🌳',
          title: 'Recordar que Somos Tierra',
          description: 'Desaprender la separacion y recordar la pertenencia fundamental',
          duration: '4-6 semanas',
          difficulty: 'Principiante',
          steps: [
            {
              title: 'Arqueologia Personal',
              description: 'Explora tu propia historia de separacion',
              action: 'Completa la practica "Arqueologia personal de la separacion" (Cap 1)',
              resources: ['Cap 1: La Gran Separacion', 'Cuaderno de practicas'],
              completionCriteria: 'Has identificado cuando aprendiste la separacion'
            },
            {
              title: 'Un Dia sin Mediacion',
              description: 'Experimenta contacto directo con el mundo vivo',
              action: 'Dedica un dia completo sin pantallas, al aire libre (Practica Cap 3)',
              resources: ['Cap 3: La Anestesia Moderna', 'Guia de practica'],
              completionCriteria: 'Has completado el dia y registrado tus observaciones'
            },
            {
              title: 'Establecer Practica de Lugar',
              description: 'Crea relacion profunda con un lugar especifico',
              action: 'Elige un lugar (arbol, rio, monte) y visitalo semanalmente durante un mes',
              resources: ['Sit Spot practice', 'Nature awareness'],
              completionCriteria: 'Has visitado tu lugar 4 veces y notas cambios sutiles'
            },
            {
              title: 'Integracion en Lo Cotidiano',
              description: 'Lleva la reconexion a tu vida diaria',
              action: 'Elige 3 practicas pequenas de reconexion y haz una diaria por 2 semanas',
              resources: ['Practicas de reconexion', 'Tracking sheet'],
              completionCriteria: 'Has practicado durante 14 dias consecutivos'
            }
          ]
        },
        {
          id: 'activismo-enraizado',
          icon: '🌱',
          title: 'Activismo desde Raices Profundas',
          description: 'Actua por el cambio sin quemarte, desde conexion profunda',
          duration: '8-10 semanas',
          difficulty: 'Avanzado',
          steps: [
            {
              title: 'Identificar tus Dones',
              description: 'Descubre que tienes para ofrecer al movimiento ecologico',
              action: 'Completa inventario de habilidades, pasiones y recursos disponibles',
              resources: ['Asset-based community development', 'Gifts inventory'],
              completionCriteria: 'Tienes lista clara de tus dones y como ofrecerlos'
            },
            {
              title: 'Encontrar tu Comunidad',
              description: 'Conecta con otros que comparten el compromiso',
              action: 'Investiga 5 iniciativas locales, visita 2, comprometete con 1',
              resources: ['Mapa de iniciativas', 'Guia de participacion'],
              completionCriteria: 'Estas participando activamente en un colectivo'
            },
            {
              title: 'Practicas de Sostenibilidad Personal',
              description: 'Cultiva practicas que te permitan actuar a largo plazo',
              action: 'Establece rutina de autocuidado para activistas (meditacion, naturaleza, comunidad)',
              resources: ['Activist burnout prevention', 'Self-care rituals'],
              completionCriteria: 'Tienes rutina semanal de renovacion y la sigues 4 semanas'
            },
            {
              title: 'Tu Primera Campana',
              description: 'Lidera o co-lidera una accion de impacto',
              action: 'Disena y ejecuta una campana local especifica (ej: salvar un arbol, presion a ayuntamiento)',
              resources: ['Campaign planning toolkit', 'Casos de exito'],
              completionCriteria: 'Has liderado una accion con resultados medibles'
            }
          ]
        }
      ],

      // ========================================================================
      // MANUAL DE TRANSICION
      // ========================================================================
      'manual-transicion': [
        {
          id: 'iniciar-comunidad-transicion',
          icon: '🌱',
          title: 'Iniciar Comunidad de Transicion',
          description: 'Crear y lanzar una iniciativa de transicion en tu ciudad',
          duration: '8-12 semanas',
          difficulty: 'Intermedio',
          steps: [
            {
              title: 'Fundamentos de la Transicion',
              description: 'Comprende los principios basicos del movimiento de transicion',
              action: 'Lee los primeros 3 capitulos del Manual y estudia 5 recursos clave sobre transicion',
              resources: ['Transition Handbook', 'Post Carbon Institute', 'Resilience.org'],
              completionCriteria: 'Puedes explicar que es la transicion y por que es necesaria'
            },
            {
              title: 'Reunir Grupo Inicial',
              description: 'Encuentra 5-10 personas interesadas en tu ciudad',
              action: 'Organiza 2 reuniones informales para presentar la idea y reclutar colaboradores',
              resources: ['Plantilla presentacion', 'Guia de reclutamiento'],
              completionCriteria: 'Tienes al menos 5 personas comprometidas para formar el nucleo'
            },
            {
              title: 'Mapeo de Recursos Locales',
              description: 'Identifica recursos, habilidades y activos comunitarios',
              action: 'Realiza mapeo participativo con el grupo usando metodologia Asset Mapping',
              resources: ['Asset Mapping Guide', 'Community Survey Template'],
              completionCriteria: 'Tienes mapa visual de recursos comunitarios (personas, lugares, organizaciones)'
            },
            {
              title: 'Primera Accion Visible',
              description: 'Lanza un proyecto piloto pequeno pero visible',
              action: 'Elige y ejecuta una accion concreta (huerto comunitario, repair cafe, etc.)',
              resources: ['Guia de primeros proyectos', 'Casos de exito'],
              completionCriteria: 'Has realizado un evento/proyecto publico que genera interes'
            }
          ]
        },
        {
          id: 'cooperativa-energetica',
          icon: '⚡',
          title: 'Crear Cooperativa Energetica',
          description: 'Lanzar una cooperativa de energias renovables',
          duration: '12-16 semanas',
          difficulty: 'Avanzado',
          steps: [
            {
              title: 'Investigacion y Modelo',
              description: 'Estudia modelos de cooperativas energeticas exitosas',
              action: 'Analiza 3 casos de estudio (Som Energia, Ecopower, Brixton Energy)',
              resources: ['REScoop.eu', 'Casos de exito'],
              completionCriteria: 'Comprendes modelos juridicos, financieros y tecnicos posibles'
            },
            {
              title: 'Grupo Promotor',
              description: 'Reune equipo con habilidades complementarias',
              action: 'Reclutar: jurista, ingeniero energetico, contador, comunicador',
              resources: [],
              completionCriteria: 'Grupo de 8-12 personas con habilidades diversas comprometido'
            },
            {
              title: 'Plan de Negocio',
              description: 'Desarrollar plan tecnico y financiero viable',
              action: 'Crear business plan con proyecciones a 5 anos',
              resources: ['Template business plan cooperativas', 'Asesoria legal'],
              completionCriteria: 'Plan de negocio validado por expertos'
            },
            {
              title: 'Constitucion Legal',
              description: 'Formalizar la cooperativa juridicamente',
              action: 'Registrar cooperativa, redactar estatutos, abrir cuenta bancaria',
              resources: ['Modelo estatutos', 'Asesoria juridica'],
              completionCriteria: 'Cooperativa legalmente constituida y registrada'
            }
          ]
        },
        {
          id: 'resiliencia-local',
          icon: '🏘️',
          title: 'Construir Resiliencia Local',
          description: 'Fortalece la capacidad de tu comunidad para enfrentar disrupciones',
          duration: '10-12 semanas',
          difficulty: 'Intermedio',
          steps: [
            {
              title: 'Evaluacion de Vulnerabilidades',
              description: 'Identifica dependencias criticas de tu comunidad',
              action: 'Mapea: alimentos (de donde vienen?), energia, agua, economia local',
              resources: ['Community resilience assessment', 'Vulnerability mapping'],
              completionCriteria: 'Tienes mapa de dependencias y puntos debiles'
            },
            {
              title: 'Sistemas Alimentarios Locales',
              description: 'Fortalece produccion y distribucion local de alimentos',
              action: 'Identifica productores locales, crea directorio, organiza mercado de proximidad',
              resources: ['Food systems mapping', 'CSA models'],
              completionCriteria: 'Has conectado productores locales con consumidores'
            },
            {
              title: 'Economia de Proximidad',
              description: 'Impulsa intercambios y monedas locales',
              action: 'Investiga bancos de tiempo o monedas locales, pilotea uno con tu grupo',
              resources: ['Timebanking guide', 'Local currencies'],
              completionCriteria: 'Has participado en al menos 5 intercambios en sistema alternativo'
            },
            {
              title: 'Red de Apoyo Mutuo',
              description: 'Crea estructuras de cuidado comunitario',
              action: 'Organiza red vecinal de apoyo (emergencias, cuidados, compartir herramientas)',
              resources: ['Mutual aid networks', 'Tool libraries'],
              completionCriteria: 'Red activa con al menos 20 vecinos participando'
            }
          ]
        }
      ],

      // ========================================================================
      // CODIGO DEL DESPERTAR
      // ========================================================================
      'codigo-despertar': [
        {
          id: 'profundizar-meditacion',
          icon: '🧘',
          title: 'Profundizar en Meditacion',
          description: 'Establece practica meditativa solida y profundiza comprension',
          duration: '8 semanas',
          difficulty: 'Principiante',
          steps: [
            {
              title: 'Fundamentos Teoricos',
              description: 'Comprende la base cientifica y contemplativa de la meditacion',
              action: 'Lee capitulos 1-3 del Codigo del Despertar y 2 libros de recursos',
              resources: ['Mindfulness in Plain English', 'The Mind Illuminated'],
              completionCriteria: 'Entiendes que es y que no es la meditacion'
            },
            {
              title: 'Establecer Practica Diaria',
              description: 'Crea habito de meditacion regular',
              action: 'Medita 10 minutos diarios durante 21 dias consecutivos',
              resources: ['Insight Timer app', 'Guided meditations'],
              completionCriteria: '21 dias consecutivos de practica registrada'
            },
            {
              title: 'Aumentar Duracion',
              description: 'Profundiza sesiones de practica',
              action: 'Incrementa a 20-30 minutos diarios durante 3 semanas',
              resources: ['Timer apps', 'Community support'],
              completionCriteria: '3 semanas de sesiones de 20-30 min'
            },
            {
              title: 'Retiro de Un Dia',
              description: 'Experiencia de practica intensiva',
              action: 'Realiza retiro personal de un dia (8 horas de practica)',
              resources: ['Guia de retiro personal', 'Centros de retiro'],
              completionCriteria: 'Has completado 1 dia de retiro (puede ser en casa)'
            }
          ]
        },
        {
          id: 'integrar-ciencia-espiritualidad',
          icon: '🔬',
          title: 'Integrar Ciencia y Espiritualidad',
          description: 'Explora el puente entre conocimiento cientifico y experiencia contemplativa',
          duration: '6-8 semanas',
          difficulty: 'Intermedio',
          steps: [
            {
              title: 'Neurociencia de la Meditacion',
              description: 'Comprende que ocurre en el cerebro durante la practica',
              action: 'Lee Seccion II del Codigo del Despertar sobre neurociencia contemplativa',
              resources: ['Altered Traits', 'The Neuroscience of Mindfulness'],
              completionCriteria: 'Puedes explicar 3 cambios cerebrales producidos por meditacion'
            },
            {
              title: 'Fisica Cuantica y Conciencia',
              description: 'Explora la relacion entre fisica moderna y experiencia subjetiva',
              action: 'Lee Seccion III sobre fisica cuantica, reflexiona sobre implicaciones',
              resources: ['The Tao of Physics', 'Quantum Mind'],
              completionCriteria: 'Comprendes principales interpretaciones de mecanica cuantica'
            },
            {
              title: 'Experimentacion Personal',
              description: 'Prueba las ideas mediante experiencia directa',
              action: 'Elige 3 experimentos contemplativos del libro y ejecutalos',
              resources: ['Practicas del Codigo del Despertar', 'Journaling'],
              completionCriteria: 'Has completado 3 experimentos y documentado resultados'
            },
            {
              title: 'Dialogo con Otros',
              description: 'Comparte y discute estas integraciones',
              action: 'Organiza o unete a grupo de estudio sobre ciencia y contemplacion',
              resources: ['Mind & Life Institute', 'Science and Nonduality'],
              completionCriteria: 'Has participado en al menos 3 conversaciones profundas'
            }
          ]
        }
      ],

      // ========================================================================
      // GUIA DE ACCIONES TRANSFORMADORAS
      // ========================================================================
      'guia-acciones': [
        {
          id: 'primera-accion-transformadora',
          icon: '💪',
          title: 'Tu Primera Accion Transformadora',
          description: 'Identifica y ejecuta una accion de impacto en tu entorno',
          duration: '4-6 semanas',
          difficulty: 'Principiante',
          steps: [
            {
              title: 'Identificar el Punto de Apalancamiento',
              description: 'Encuentra donde tu accion puede tener mayor impacto',
              action: 'Analiza tu esfera de influencia: trabajo, vecindario, familia, organizaciones',
              resources: ['Leverage points analysis', 'Sphere of influence'],
              completionCriteria: 'Has identificado 3 posibles puntos de intervencion'
            },
            {
              title: 'Disenar la Accion',
              description: 'Planifica una accion especifica, medible y alcanzable',
              action: 'Usa metodologia SMART para definir tu accion transformadora',
              resources: ['SMART goals', 'Action planning template'],
              completionCriteria: 'Tienes plan de accion claro con pasos concretos'
            },
            {
              title: 'Ejecutar con Presencia',
              description: 'Lleva a cabo la accion con atencion plena',
              action: 'Implementa tu accion, registra el proceso y los obstaculos',
              resources: ['Action log', 'Reflection prompts'],
              completionCriteria: 'Has completado la accion y documentado aprendizajes'
            },
            {
              title: 'Evaluar e Iterar',
              description: 'Aprende de la experiencia y ajusta',
              action: 'Evalua impacto, celebra logros, identifica que mejorar para proxima accion',
              resources: ['Impact assessment', 'Iteration frameworks'],
              completionCriteria: 'Tienes evaluacion escrita y plan para siguiente accion'
            }
          ]
        },
        {
          id: 'activismo-cotidiano',
          icon: '🌟',
          title: 'Activismo en lo Cotidiano',
          description: 'Transforma tus habitos diarios en actos de resistencia y creacion',
          duration: '6 semanas',
          difficulty: 'Principiante',
          steps: [
            {
              title: 'Auditoria de Habitos',
              description: 'Examina tus practicas diarias desde perspectiva de impacto',
              action: 'Registra durante 1 semana: consumo, desplazamientos, energia, residuos',
              resources: ['Habit audit worksheet', 'Carbon footprint calculator'],
              completionCriteria: 'Tienes registro detallado de una semana tipica'
            },
            {
              title: 'Cambios de Alto Impacto',
              description: 'Identifica y ejecuta los cambios mas significativos',
              action: 'Elige 3 cambios de alto impacto (ej: dieta, transporte, energia) e implementalos',
              resources: ['High-impact actions list', 'Behavior change guide'],
              completionCriteria: 'Has mantenido 3 nuevos habitos durante 3 semanas'
            },
            {
              title: 'Contagiar por Ejemplo',
              description: 'Comparte tus cambios de forma que inspire a otros',
              action: 'Documenta tu proceso y comparte (blog, redes, conversaciones)',
              resources: ['Storytelling for change', 'Social media for activism'],
              completionCriteria: 'Has inspirado a al menos 2 personas a hacer cambios similares'
            }
          ]
        }
      ],

      // ========================================================================
      // TOOLKIT DE TRANSICION
      // ========================================================================
      'toolkit-transicion': [
        {
          id: 'huerto-comunitario',
          icon: '🌻',
          title: 'Lanzar Huerto Comunitario',
          description: 'Crea espacio de cultivo colectivo en tu barrio',
          duration: '8-12 semanas',
          difficulty: 'Intermedio',
          steps: [
            {
              title: 'Encontrar el Espacio',
              description: 'Identifica y consigue terreno disponible',
              action: 'Mapea espacios vacios, negocia con ayuntamiento o propietarios',
              resources: ['Urban land access guide', 'Negotiation tips'],
              completionCriteria: 'Tienes acceso asegurado a terreno por al menos 1 ano'
            },
            {
              title: 'Formar el Grupo',
              description: 'Reune personas comprometidas con el proyecto',
              action: 'Organiza 2 reuniones abiertas, establece roles y compromisos',
              resources: ['Community organizing', 'Group dynamics'],
              completionCriteria: 'Grupo de 8-15 personas con roles definidos'
            },
            {
              title: 'Diseno Participativo',
              description: 'Co-disena el espacio con el grupo',
              action: 'Taller de diseno usando principios de permacultura',
              resources: ['Permaculture design', 'Participatory design'],
              completionCriteria: 'Plano del huerto consensuado y dibujado'
            },
            {
              title: 'Primera Siembra',
              description: 'Lanza el huerto con celebracion comunitaria',
              action: 'Evento publico de inauguracion y siembra colectiva',
              resources: ['Seasonal planting guide', 'Event organizing'],
              completionCriteria: 'Huerto inaugurado con primeras plantas en tierra'
            }
          ]
        },
        {
          id: 'repair-cafe',
          icon: '🔧',
          title: 'Organizar Repair Cafe',
          description: 'Crea espacio mensual de reparacion comunitaria',
          duration: '6-8 semanas',
          difficulty: 'Principiante',
          steps: [
            {
              title: 'Reunir Reparadores',
              description: 'Encuentra personas con habilidades de reparacion',
              action: 'Mapea habilidades en tu red: electronica, textil, carpinteria, bicicletas',
              resources: ['Skills inventory', 'Repair Cafe Foundation'],
              completionCriteria: 'Tienes al menos 4 reparadores comprometidos'
            },
            {
              title: 'Conseguir Espacio',
              description: 'Encuentra local apropiado para el evento',
              action: 'Negocia con centro civico, biblioteca o espacio comunitario',
              resources: ['Space requirements', 'Partnership templates'],
              completionCriteria: 'Local confirmado para al menos 3 meses'
            },
            {
              title: 'Primer Evento',
              description: 'Lanza el Repair Cafe piloto',
              action: 'Organiza evento de 3 horas, documenta que funciona y que no',
              resources: ['Event checklist', 'Insurance info'],
              completionCriteria: 'Primer evento realizado con al menos 10 objetos reparados'
            },
            {
              title: 'Establecer Regularidad',
              description: 'Crea calendario mensual sostenible',
              action: 'Planifica proximos 3 meses, delega responsabilidades, crea sistema',
              resources: ['Sustainability planning', 'Volunteer management'],
              completionCriteria: 'Calendario publicado y equipo rotativo organizado'
            }
          ]
        }
      ],

      // ========================================================================
      // MANUAL PRACTICO
      // ========================================================================
      'manual-practico': [
        {
          id: 'rutina-practica-diaria',
          icon: '📿',
          title: 'Establecer Rutina de Practica Diaria',
          description: 'Crea y manten un sistema personal de practicas transformadoras',
          duration: '6 semanas',
          difficulty: 'Principiante',
          steps: [
            {
              title: 'Auditoria de Tiempo',
              description: 'Comprende como usas tu tiempo actualmente',
              action: 'Registra tu dia tipico en bloques de 30 min durante 1 semana',
              resources: ['Time audit template', 'Time tracking apps'],
              completionCriteria: 'Tienes registro detallado de tu semana tipo'
            },
            {
              title: 'Disenar tu Rutina',
              description: 'Crea secuencia personalizada de practicas',
              action: 'Elige 3-5 practicas del Manual, asigna horarios especificos',
              resources: ['Habit stacking', 'Morning/evening routines'],
              completionCriteria: 'Rutina disenada con practicas, horarios y duracion'
            },
            {
              title: 'Primeras 3 Semanas',
              description: 'Establece el habito con compromiso firme',
              action: 'Sigue tu rutina diariamente, usa tracker, ajusta si necesario',
              resources: ['Habit tracker', 'Accountability partner'],
              completionCriteria: '21 dias consecutivos completados (minimo 80%)'
            },
            {
              title: 'Consolidacion',
              description: 'Refina y profundiza la practica',
              action: 'Continua 3 semanas mas, ajusta segun aprendizajes',
              resources: ['Practice refinement', 'Deepening techniques'],
              completionCriteria: '42 dias totales, rutina integrada en vida diaria'
            }
          ]
        },
        {
          id: 'dominar-tecnica-central',
          icon: '🎯',
          title: 'Dominar una Tecnica Central',
          description: 'Profundiza en UNA practica hasta alcanzar maestria basica',
          duration: '12 semanas',
          difficulty: 'Intermedio',
          steps: [
            {
              title: 'Elegir la Practica',
              description: 'Selecciona UNA tecnica que resuene profundamente',
              action: 'Explora 5-7 practicas del Manual, elige 1 para dedicarte por completo',
              resources: ['Practice descriptions', 'Selection criteria'],
              completionCriteria: 'Has elegido una practica y sabes por que'
            },
            {
              title: 'Fase Intensiva',
              description: 'Practica diariamente durante 6 semanas',
              action: 'Dedica 30-60 min diarios a tu practica, lleva diario detallado',
              resources: ['Practice journal', 'Progress markers'],
              completionCriteria: '42 dias de practica continua documentada'
            },
            {
              title: 'Estudio Profundo',
              description: 'Estudia la tradicion y teoria detras de la practica',
              action: 'Lee 2-3 libros especializados, busca maestros o comunidad',
              resources: ['Recommended readings', 'Teacher directory'],
              completionCriteria: 'Has completado estudio teorico y conectado con comunidad'
            },
            {
              title: 'Transmision',
              description: 'Comparte la practica con otros',
              action: 'Ensena la tecnica a 3 personas o guia sesion grupal',
              resources: ['Teaching basics', 'Group facilitation'],
              completionCriteria: 'Has transmitido la practica exitosamente'
            }
          ]
        }
      ],

      // ========================================================================
      // PRACTICAS RADICALES
      // ========================================================================
      'practicas-radicales': [
        {
          id: 'simplicidad-voluntaria',
          icon: '🍃',
          title: 'Camino hacia Simplicidad Voluntaria',
          description: 'Reduce complejidad y consumo, aumenta libertad y claridad',
          duration: '10-12 semanas',
          difficulty: 'Avanzado',
          steps: [
            {
              title: 'Auditoria de Posesiones',
              description: 'Examina todo lo que posees',
              action: 'Inventario completo de objetos, evalua que usas vs que acumulas',
              resources: ['Minimalism guide', 'KonMari method'],
              completionCriteria: 'Lista completa de posesiones con evaluacion de uso'
            },
            {
              title: 'Liberacion Material',
              description: 'Desprende del 50% de tus posesiones',
              action: 'Dona, regala o vende la mitad de lo que no usas regularmente',
              resources: ['Decluttering strategies', 'Donation centers'],
              completionCriteria: 'Has reducido posesiones significativamente'
            },
            {
              title: 'Dieta de Consumo',
              description: 'Reduce compras a lo esencial durante 3 meses',
              action: 'Compra solo necesidades basicas, registra cada compra y su justificacion',
              resources: ['Buy nothing challenge', 'Consumption tracker'],
              completionCriteria: '12 semanas con consumo reducido al minimo'
            },
            {
              title: 'Nuevo Estilo de Vida',
              description: 'Integra simplicidad como filosofia permanente',
              action: 'Define tus principios de simplicidad, comparte con comunidad',
              resources: ['Voluntary simplicity', 'Simple living communities'],
              completionCriteria: 'Manifesto personal escrito y compartido'
            }
          ]
        },
        {
          id: 'desobediencia-creativa',
          icon: '🎨',
          title: 'Arte como Desobediencia Creativa',
          description: 'Usa creatividad para cuestionar y transformar lo establecido',
          duration: '8 semanas',
          difficulty: 'Intermedio',
          steps: [
            {
              title: 'Identificar el Mensaje',
              description: 'Define que quieres comunicar o confrontar',
              action: 'Elige una injusticia o absurdo que te indigna, articula tu critica',
              resources: ['Culture jamming', 'Activist art examples'],
              completionCriteria: 'Mensaje claro y contundente formulado'
            },
            {
              title: 'Experimentacion Artistica',
              description: 'Prueba diferentes medios y formatos',
              action: 'Crea 3 prototipos en formatos diferentes (graffiti, performance, video, etc.)',
              resources: ['DIY art techniques', 'Guerrilla art'],
              completionCriteria: 'Tres propuestas creativas desarrolladas'
            },
            {
              title: 'Intervencion Publica',
              description: 'Lleva tu arte al espacio publico',
              action: 'Ejecuta intervencion en lugar estrategico, documenta reacciones',
              resources: ['Public art permits', 'Documentation strategies'],
              completionCriteria: 'Intervencion realizada y documentada'
            },
            {
              title: 'Viralizacion y Seguimiento',
              description: 'Amplifica el impacto de tu accion',
              action: 'Comparte documentacion, invita a otros a replicar, evalua impacto',
              resources: ['Social media strategy', 'Impact metrics'],
              completionCriteria: 'Al menos 3 personas inspiradas a crear su propia intervencion'
            }
          ]
        }
      ],

      // ========================================================================
      // MANIFIESTO DE LA CONCIENCIA COMPARTIDA
      // ========================================================================
      'manifiesto': [
        {
          id: 'escribir-tu-manifiesto',
          icon: '📜',
          title: 'Escribe tu Propio Manifiesto',
          description: 'Articula tu vision personal de transformacion',
          duration: '4-6 semanas',
          difficulty: 'Intermedio',
          steps: [
            {
              title: 'Clarificar Valores',
              description: 'Identifica tus principios fundamentales',
              action: 'Lista 10 valores esenciales, prioriza los 5 mas importantes',
              resources: ['Values clarification', 'Priority matrix'],
              completionCriteria: 'Tienes lista clara de 5 valores priorizados'
            },
            {
              title: 'Vision de Futuro',
              description: 'Imagina el mundo que quieres co-crear',
              action: 'Escribe descripcion detallada del futuro que deseas (500 palabras)',
              resources: ['Visioning exercises', 'Future scenarios'],
              completionCriteria: 'Vision de futuro articulada por escrito'
            },
            {
              title: 'Redactar Borrador',
              description: 'Escribe primera version de tu manifiesto',
              action: 'Combina valores + vision + compromisos concretos (1-2 paginas)',
              resources: ['Manifesto examples', 'Writing guide'],
              completionCriteria: 'Borrador completo de manifiesto personal'
            },
            {
              title: 'Compartir y Comprometerse',
              description: 'Declara publicamente tu manifiesto',
              action: 'Comparte con 5 personas, firma y fecha, revisa anualmente',
              resources: ['Public commitment', 'Accountability structures'],
              completionCriteria: 'Manifiesto compartido y firmado'
            }
          ]
        },
        {
          id: 'circulo-consciencia-compartida',
          icon: '⭕',
          title: 'Circulo de Conciencia Compartida',
          description: 'Crea grupo de practica y apoyo mutuo',
          duration: '8-12 semanas',
          difficulty: 'Intermedio',
          steps: [
            {
              title: 'Reunir el Circulo',
              description: 'Encuentra 4-8 personas comprometidas',
              action: 'Invita a personas afines, haz reunion inicial de intenciones',
              resources: ['Circle guidelines', 'Invitation templates'],
              completionCriteria: 'Grupo de 4-8 personas comprometido a reunirse regularmente'
            },
            {
              title: 'Establecer Estructura',
              description: 'Define formato y compromisos del circulo',
              action: 'Acuerda: frecuencia, duracion, formato, roles rotativos',
              resources: ['Circle formats', 'Facilitation guides'],
              completionCriteria: 'Acuerdos claros documentados y aceptados'
            },
            {
              title: 'Primeras 6 Sesiones',
              description: 'Establece ritmo y profundiza conexion',
              action: 'Reunanse 6 veces siguiendo formato acordado',
              resources: ['Session plans', 'Check-in prompts'],
              completionCriteria: '6 reuniones completadas con asistencia regular'
            },
            {
              title: 'Accion Colectiva',
              description: 'Del circulo a la accion en el mundo',
              action: 'El grupo identifica y ejecuta una accion transformadora conjunta',
              resources: ['Collective action', 'Group decision-making'],
              completionCriteria: 'Accion colectiva planificada y ejecutada'
            }
          ]
        }
      ],

      // ========================================================================
      // FILOSOFIA DEL NUEVO SER
      // ========================================================================
      'filosofia-nuevo-ser': [
        {
          id: 'desarrollar-pensamiento-filosofico',
          icon: '🧠',
          title: 'Desarrollar Pensamiento Filosofico',
          description: 'Cultiva capacidad de reflexion profunda y cuestionamiento radical',
          duration: '8 semanas',
          difficulty: 'Intermedio',
          steps: [
            {
              title: 'Lectura Filosofica Activa',
              description: 'Aprende a leer filosofia de forma participativa',
              action: 'Lee 3 capitulos del libro, toma notas marginales, formula 5 preguntas por capitulo',
              resources: ['Guia de lectura filosofica', 'Note-taking methods'],
              completionCriteria: 'Has leido 3 capitulos con anotaciones y preguntas formuladas'
            },
            {
              title: 'Dialogo Socratico',
              description: 'Practica el arte de preguntar y responder',
              action: 'Organiza 3 conversaciones filosoficas con amigos usando metodo socratico',
              resources: ['Socratic method', 'Dialogue guidelines'],
              completionCriteria: 'Has facilitado 3 dialogos socraticos'
            },
            {
              title: 'Escritura Reflexiva',
              description: 'Articula tu propio pensamiento filosofico',
              action: 'Escribe 3 ensayos cortos (500 palabras) sobre preguntas filosoficas que te inquietan',
              resources: ['Philosophical writing', 'Essay structure'],
              completionCriteria: 'Has escrito y revisado 3 ensayos filosoficos'
            },
            {
              title: 'Integracion Vital',
              description: 'Conecta filosofia con tu vida concreta',
              action: 'Identifica 1 idea filosofica del libro y experimenta vivirla durante 2 semanas',
              resources: ['Filosofia como forma de vida', 'Experimentos existenciales'],
              completionCriteria: 'Has vivido conscientemente segun una idea filosofica y documentado el proceso'
            }
          ]
        },
        {
          id: 'ontologia-participativa',
          icon: '🌀',
          title: 'Ontologia Participativa',
          description: 'Explora una vision del ser donde observador y observado co-surgen',
          duration: '6-8 semanas',
          difficulty: 'Avanzado',
          steps: [
            {
              title: 'Fenomenologia Personal',
              description: 'Observa como tu experiencia co-crea la realidad',
              action: 'Practica diaria: 20 min de observacion fenomenologica (sin interpretar, solo notar)',
              resources: ['Husserl: Ideas', 'Phenomenology guide'],
              completionCriteria: '21 dias de practica fenomenologica documentada'
            },
            {
              title: 'Experimentos de Co-surgimiento',
              description: 'Prueba empiricamente la no-dualidad',
              action: 'Realiza 5 experimentos del libro sobre percepcion participativa',
              resources: ['Experimentos del libro', 'Varela: The Embodied Mind'],
              completionCriteria: 'Has completado 5 experimentos con resultados documentados'
            },
            {
              title: 'Dialogo con Tradiciones',
              description: 'Estudia ontologias no-occidentales',
              action: 'Lee sobre 3 ontologias indigenas o no-dualistas (budismo, taoismo, andina)',
              resources: ['Indigenous ontologies', 'Comparative philosophy'],
              completionCriteria: 'Has estudiado 3 tradiciones y escrito comparaciones'
            },
            {
              title: 'Nueva Narrativa Personal',
              description: 'Reescribe tu historia desde ontologia participativa',
              action: 'Escribe autobiografia de 1000 palabras desde perspectiva no-dual',
              resources: ['Narrative identity', 'Post-egoic writing'],
              completionCriteria: 'Autobiografia participativa escrita y compartida'
            }
          ]
        },
        {
          id: 'etica-relacional',
          icon: '🤝',
          title: 'Etica Relacional',
          description: 'Desarrolla etica basada en interdependencia, no en individuos aislados',
          duration: '6 semanas',
          difficulty: 'Intermedio',
          steps: [
            {
              title: 'Mapeo de Interdependencias',
              description: 'Visualiza tu red de relaciones y dependencias',
              action: 'Crea mapa visual de todas tus interdependencias (humanas, ecologicas, tecnologicas)',
              resources: ['Systems mapping', 'Interdependence analysis'],
              completionCriteria: 'Mapa completo de interdependencias con al menos 50 nodos'
            },
            {
              title: 'Dilemas Eticos Relacionales',
              description: 'Analiza situaciones desde perspectiva relacional',
              action: 'Toma 3 dilemas eticos del libro, resuelvelos desde etica relacional vs individualista',
              resources: ['Care ethics', 'Ubuntu philosophy'],
              completionCriteria: 'Has analizado 3 dilemas con ambos marcos y comparado'
            },
            {
              title: 'Practicas de Cuidado Mutuo',
              description: 'Implementa etica relacional en lo cotidiano',
              action: 'Establece 3 practicas de cuidado mutuo con personas de tu red',
              resources: ['Mutual aid practices', 'Care collectives'],
              completionCriteria: '3 practicas de cuidado activas durante 4 semanas'
            },
            {
              title: 'Ensayo sobre Responsabilidad',
              description: 'Articula tu comprension de responsabilidad relacional',
              action: 'Escribe ensayo: "De que soy responsable desde una etica relacional?"',
              resources: ['Relational responsibility', 'Ethics of care'],
              completionCriteria: 'Ensayo de 1000 palabras escrito y revisado'
            }
          ]
        }
      ],

      // ========================================================================
      // DIALOGOS CON LA MAQUINA
      // ========================================================================
      'dialogos-maquina': [
        {
          id: 'dialogar-con-ia',
          icon: '🤖',
          title: 'Arte del Dialogo con IA',
          description: 'Aprende a dialogar profundamente con inteligencias artificiales',
          duration: '4-6 semanas',
          difficulty: 'Principiante',
          steps: [
            {
              title: 'Primeros Dialogos',
              description: 'Establece practica regular de conversacion con IA',
              action: 'Manten 7 conversaciones diarias con IA (diferentes temas, niveles de profundidad)',
              resources: ['Claude', 'ChatGPT', 'Prompt engineering basics'],
              completionCriteria: '7 dias de dialogos documentados con reflexiones'
            },
            {
              title: 'Preguntas Poderosas',
              description: 'Aprende a formular preguntas que generan insight',
              action: 'Practica 5 tipos de preguntas del libro (fenomenologicas, paradojicas, generativas, etc.)',
              resources: ['Question taxonomy', 'Art of questioning'],
              completionCriteria: 'Has practicado cada tipo y documentado diferencias en respuestas'
            },
            {
              title: 'Meta-Dialogo',
              description: 'Reflexiona sobre el propio proceso de dialogo',
              action: 'Conversa con IA sobre la naturaleza del dialogo humano-IA que estas teniendo',
              resources: ['Metacognition', 'Recursive dialogue'],
              completionCriteria: 'Has tenido 3 conversaciones meta-dialogicas profundas'
            },
            {
              title: 'Proyecto Colaborativo',
              description: 'Co-crea algo significativo con IA',
              action: 'Elige un proyecto (ensayo, poema, codigo, etc.) y crealo en colaboracion con IA',
              resources: ['Co-creation methods', 'Human-AI collaboration'],
              completionCriteria: 'Proyecto completado y reflexion sobre el proceso de colaboracion'
            }
          ]
        },
        {
          id: 'filosofia-ia',
          icon: '💭',
          title: 'Filosofia de la Inteligencia Artificial',
          description: 'Explora preguntas filosoficas sobre IA, conciencia y cognicion',
          duration: '8 semanas',
          difficulty: 'Avanzado',
          steps: [
            {
              title: 'Lecturas Fundamentales',
              description: 'Estudia filosofia de la mente y computacion',
              action: 'Lee 4 textos clave: Turing, Searle, Dennett, y un capitulo del libro',
              resources: ['Turing Test', 'Chinese Room', 'Consciousness Explained'],
              completionCriteria: 'Has leido los 4 textos y escrito resumenes criticos'
            },
            {
              title: 'Experimentos Mentales',
              description: 'Trabaja con los thought experiments clasicos',
              action: 'Analiza 5 experimentos mentales sobre IA y formula tu posicion en cada uno',
              resources: ['Thought experiments in AI', 'Philosophy of mind'],
              completionCriteria: 'Analisis escrito de 5 experimentos con tu posicion argumentada'
            },
            {
              title: 'Dialogos Filosoficos con IA',
              description: 'Explora estas preguntas directamente con IA',
              action: 'Conversa con IA sobre: Eres consciente? Comprendes? Que significa entender?',
              resources: ['Dialogos del libro', 'Phenomenology of AI'],
              completionCriteria: '5 conversaciones filosoficas profundas documentadas'
            },
            {
              title: 'Ensayo Final',
              description: 'Articula tu filosofia de la IA',
              action: 'Escribe ensayo de 2000 palabras sobre tu posicion respecto a mente/IA',
              resources: ['Philosophical writing', 'Argumentacion'],
              completionCriteria: 'Ensayo completo, revisado, compartido con comunidad'
            }
          ]
        },
        {
          id: 'etica-ia',
          icon: '⚖️',
          title: 'Etica de la Inteligencia Artificial',
          description: 'Desarrolla criterio etico para creacion y uso de IA',
          duration: '6 semanas',
          difficulty: 'Intermedio',
          steps: [
            {
              title: 'Casos de Estudio',
              description: 'Analiza dilemas eticos reales de IA',
              action: 'Estudia 5 casos: sesgo algoritmico, deepfakes, vigilancia, automatizacion laboral, IA militar',
              resources: ['AI ethics cases', 'IEEE ethics guidelines'],
              completionCriteria: 'Has analizado 5 casos y propuesto marcos de evaluacion'
            },
            {
              title: 'Marcos Eticos Comparados',
              description: 'Estudia diferentes enfoques de etica IA',
              action: 'Compara: utilitarismo, deontologia, etica del cuidado, etica indigena aplicados a IA',
              resources: ['Ethics frameworks', 'Comparative ethics'],
              completionCriteria: 'Matriz comparativa de 4 marcos eticos aplicados a IA'
            },
            {
              title: 'Auditoria Personal',
              description: 'Examina tu propio uso de IA',
              action: 'Registra durante 2 semanas: que IA usas, para que, con que consecuencias',
              resources: ['Digital ethics', 'Personal audit tools'],
              completionCriteria: 'Auditoria completa con analisis etico de tus usos'
            },
            {
              title: 'Manifiesto Etico Personal',
              description: 'Define tus principios para relacionarte con IA',
              action: 'Escribe tu codigo etico personal para uso y desarrollo de IA',
              resources: ['Ethical codes', 'Personal manifestos'],
              completionCriteria: 'Manifiesto etico escrito, firmado, compartido'
            }
          ]
        }
      ],

      // ========================================================================
      // PEDAGOGIA DEL DESPERTAR
      // ========================================================================
      'pedagogia-despertar': [
        {
          id: 'educacion-transformadora',
          icon: '🎓',
          title: 'Educacion Transformadora',
          description: 'Disena e implementa experiencias educativas que despiertan',
          duration: '10-12 semanas',
          difficulty: 'Avanzado',
          steps: [
            {
              title: 'Estudiar Pedagogias Criticas',
              description: 'Comprende teorias de educacion liberadora',
              action: 'Lee: Paulo Freire, bell hooks, Ivan Illich, y capitulos clave del libro',
              resources: ['Pedagogia del Oprimido', 'Teaching to Transgress'],
              completionCriteria: 'Has leido 4 textos y escrito sintesis comparativa'
            },
            {
              title: 'Diseno de Experiencia',
              description: 'Crea una experiencia educativa transformadora',
              action: 'Disena taller/curso de 4 sesiones usando principios del libro',
              resources: ['Workshop design', 'Transformative learning'],
              completionCriteria: 'Curriculo completo con objetivos, metodos, evaluacion'
            },
            {
              title: 'Piloto y Iteracion',
              description: 'Implementa tu diseno con grupo real',
              action: 'Facilita las 4 sesiones, recoge feedback, ajusta',
              resources: ['Facilitation skills', 'Feedback methods'],
              completionCriteria: '4 sesiones completadas con evaluacion de participantes'
            },
            {
              title: 'Documentacion y Compartir',
              description: 'Sistematiza aprendizajes para que otros los usen',
              action: 'Crea guia descargable de tu experiencia educativa',
              resources: ['Educational resources', 'Open pedagogy'],
              completionCriteria: 'Guia publicada y compartida con comunidad educativa'
            }
          ]
        },
        {
          id: 'aprender-a-aprender',
          icon: '🧩',
          title: 'Aprender a Aprender',
          description: 'Domina metacognicion y auto-direccion en el aprendizaje',
          duration: '8 semanas',
          difficulty: 'Principiante',
          steps: [
            {
              title: 'Auditoria de Aprendizaje',
              description: 'Comprende como aprendes actualmente',
              action: 'Registra durante 2 semanas: que aprendes, como, que funciona, que no',
              resources: ['Learning styles', 'Metacognition tools'],
              completionCriteria: 'Perfil completo de tu proceso de aprendizaje actual'
            },
            {
              title: 'Experimentos de Metodo',
              description: 'Prueba diferentes estrategias de aprendizaje',
              action: 'Elige un tema, aprendelo con 5 metodos diferentes (Feynman, spaced repetition, etc.)',
              resources: ['Learning techniques', 'Study methods'],
              completionCriteria: 'Has probado 5 metodos y evaluado efectividad de cada uno'
            },
            {
              title: 'Sistema Personal',
              description: 'Disena tu sistema de aprendizaje optimo',
              action: 'Crea tu "manual de aprendizaje" personalizado con mejores practicas',
              resources: ['Personal knowledge management', 'Learning systems'],
              completionCriteria: 'Manual escrito con tu sistema personalizado'
            },
            {
              title: 'Proyecto de Dominio',
              description: 'Aplica tu sistema a aprender algo nuevo',
              action: 'Elige habilidad nueva y aprendela durante 4 semanas usando tu sistema',
              resources: ['Skill acquisition', 'Deliberate practice'],
              completionCriteria: 'Habilidad adquirida con documentacion del proceso'
            }
          ]
        },
        {
          id: 'comunidades-aprendizaje',
          icon: '👥',
          title: 'Comunidades de Aprendizaje',
          description: 'Crea espacios colectivos de aprendizaje transformador',
          duration: '12 semanas',
          difficulty: 'Intermedio',
          steps: [
            {
              title: 'Investigacion y Modelos',
              description: 'Estudia comunidades de aprendizaje existentes',
              action: 'Investiga 5 modelos: circles of trust, study circles, learning cooperatives',
              resources: ['Community learning models', 'Peer learning'],
              completionCriteria: 'Has estudiado 5 modelos y extraido principios clave'
            },
            {
              title: 'Convocar Comunidad',
              description: 'Reune grupo comprometido con aprendizaje colectivo',
              action: 'Invita 6-12 personas, haz sesion de intenciones y acuerdos',
              resources: ['Community organizing', 'Group agreements'],
              completionCriteria: 'Grupo de 6-12 personas con acuerdos claros'
            },
            {
              title: 'Ciclo de 8 Sesiones',
              description: 'Facilita proceso de aprendizaje colectivo',
              action: 'Reunanse 8 veces, rota facilitacion, documenta aprendizajes',
              resources: ['Facilitation guides', 'Collective learning'],
              completionCriteria: '8 sesiones completadas con documentacion'
            },
            {
              title: 'Cosecha y Siguiente Ciclo',
              description: 'Sistematiza lo aprendido y planea continuidad',
              action: 'Sesion de cosecha, evalua proceso, decide si continua y como',
              resources: ['Harvest methods', 'Sustainability planning'],
              completionCriteria: 'Documento de aprendizajes y plan para siguiente ciclo'
            }
          ]
        }
      ],

      // ========================================================================
      // ECOLOGIA PROFUNDA
      // ========================================================================
      'ecologia-profunda': [
        {
          id: 'inmersion-naturaleza',
          icon: '🌲',
          title: 'Inmersion en Naturaleza',
          description: 'Desarrolla conexion profunda con el mundo natural',
          duration: '8 semanas',
          difficulty: 'Principiante',
          steps: [
            {
              title: 'Sit Spot Diario',
              description: 'Establece lugar de observacion regular en naturaleza',
              action: 'Elige un lugar natural, visitalo 20 min diarios durante 3 semanas',
              resources: ['Sit spot practice', 'Nature awareness'],
              completionCriteria: '21 dias de practica con diario de observaciones'
            },
            {
              title: 'Estudio de Lugar',
              description: 'Conoce profundamente un ecosistema local',
              action: 'Estudia ecosistema cercano: especies, relaciones, ciclos, historia',
              resources: ['Field guides', 'Local ecology'],
              completionCriteria: 'Monografia de 1000 palabras sobre tu ecosistema local'
            },
            {
              title: 'Rastreo y Senales',
              description: 'Aprende a leer huellas y senales de fauna',
              action: 'Practica identificacion de huellas, excrementos, marcas territoriales',
              resources: ['Animal tracking', 'Field guides'],
              completionCriteria: 'Has identificado 10 especies por sus senales'
            },
            {
              title: 'Solo en Naturaleza',
              description: 'Experiencia de soledad en naturaleza (24h)',
              action: 'Pasa 24 horas solo en naturaleza, ayuno opcional, diario de experiencia',
              resources: ['Vision quest', 'Wilderness solo'],
              completionCriteria: 'Has completado 24h solo y documentado la experiencia'
            }
          ]
        },
        {
          id: 'ecopsicologia',
          icon: '🌍',
          title: 'Ecopsicologia Aplicada',
          description: 'Sana la separacion psique-naturaleza',
          duration: '10 semanas',
          difficulty: 'Intermedio',
          steps: [
            {
              title: 'Trabajo con Duelo Ecologico',
              description: 'Procesa conscientemente el dolor por la crisis',
              action: 'Completa practicas de duelo del libro, participa en ritual colectivo',
              resources: ['Work That Reconnects', 'Eco-grief practices'],
              completionCriteria: 'Has participado en ritual y procesado duelo personalmente'
            },
            {
              title: 'Consejo de Todos los Seres',
              description: 'Practica de identificacion con otras especies',
              action: 'Participa u organiza Consejo de Todos los Seres (ritual ecopsicologico)',
              resources: ['Council of All Beings', 'Deep ecology practices'],
              completionCriteria: 'Has participado en Consejo y hablado como otra especie'
            },
            {
              title: 'Terapia de Lugar',
              description: 'Usa naturaleza como co-terapeuta',
              action: 'Durante 4 semanas, lleva temas personales a naturaleza para procesarlos',
              resources: ['Ecotherapy', 'Nature as therapist'],
              completionCriteria: '4 semanas de practica con documentacion de insights'
            },
            {
              title: 'Integracion Comunitaria',
              description: 'Comparte ecopsicologia con tu comunidad',
              action: 'Organiza taller de ecopsicologia para 8-15 personas',
              resources: ['Workshop facilitation', 'Ecopsychology exercises'],
              completionCriteria: 'Taller facilitado con evaluacion de participantes'
            }
          ]
        }
      ],

      // ========================================================================
      // ARTE DE LA RELACION CONSCIENTE
      // ========================================================================
      'arte-relacion-consciente': [
        {
          id: 'comunicacion-no-violenta',
          icon: '💬',
          title: 'Comunicacion No Violenta',
          description: 'Domina el arte de comunicarte desde empatia y honestidad',
          duration: '8 semanas',
          difficulty: 'Intermedio',
          steps: [
            {
              title: 'Los 4 Componentes',
              description: 'Aprende observacion, sentimientos, necesidades, peticiones',
              action: 'Estudia teoria CNV, practica cada componente durante 1 semana',
              resources: ['Rosenberg: NVC', 'CNV worksheets'],
              completionCriteria: 'Has practicado los 4 componentes y documentado ejemplos'
            },
            {
              title: 'Auto-Empatia',
              description: 'Conecta con tus propios sentimientos y necesidades',
              action: 'Practica diaria de auto-empatia durante 3 semanas',
              resources: ['Self-empathy exercises', 'Feelings & needs lists'],
              completionCriteria: '21 dias de practica con journal'
            },
            {
              title: 'Empatia hacia Otros',
              description: 'Escucha empatica sin juicio ni consejo',
              action: 'Practica escucha empatica con 5 personas diferentes',
              resources: ['Empathic listening', 'CNV dialogue'],
              completionCriteria: '5 conversaciones empaticas con reflexion sobre cada una'
            },
            {
              title: 'Conversaciones Dificiles',
              description: 'Aplica CNV en situaciones de conflicto',
              action: 'Elige 3 conflictos pendientes, abordalos con CNV',
              resources: ['Conflict resolution', 'Difficult conversations'],
              completionCriteria: '3 conversaciones dificiles completadas con CNV'
            }
          ]
        },
        {
          id: 'intimidad-autentica',
          icon: '❤️',
          title: 'Cultivar Intimidad Autentica',
          description: 'Profundiza en cercania emocional genuina',
          duration: '10 semanas',
          difficulty: 'Avanzado',
          steps: [
            {
              title: 'Vulnerabilidad Gradual',
              description: 'Practica compartir con autenticidad creciente',
              action: 'Comparte algo vulnerable con 1 persona nueva cada semana durante 5 semanas',
              resources: ['Brene Brown: Vulnerability', 'Intimacy exercises'],
              completionCriteria: '5 semanas de practica documentada'
            },
            {
              title: 'Escucha Profunda',
              description: 'Desarrolla capacidad de presencia total',
              action: 'Sesiones semanales de 1 hora de escucha profunda reciproca',
              resources: ['Deep listening', 'Presence practices'],
              completionCriteria: '5 sesiones de escucha profunda completadas'
            },
            {
              title: 'Relacion Consciente',
              description: 'Aplica principios del libro a una relacion',
              action: 'Elige 1 relacion cercana, implementa 5 practicas del libro durante 4 semanas',
              resources: ['Conscious relating', 'Relationship practices'],
              completionCriteria: '4 semanas de practica con evaluacion del cambio'
            },
            {
              title: 'Circulo de Intimidad',
              description: 'Crea espacio grupal de vulnerabilidad segura',
              action: 'Convoca circulo de 4-6 personas para 6 sesiones de intimidad autentica',
              resources: ['Intimacy circles', 'Group facilitation'],
              completionCriteria: '6 sesiones completadas con grupo'
            }
          ]
        },
        {
          id: 'relaciones-liberadoras',
          icon: '🕊️',
          title: 'Relaciones Liberadoras',
          description: 'Crea vinculos que honran libertad y autonomia mutua',
          duration: '8 semanas',
          difficulty: 'Avanzado',
          steps: [
            {
              title: 'Identificar Apegos',
              description: 'Observa patrones de apego y control en tus relaciones',
              action: 'Inventario de apegos: donde te aferras?, donde intentas controlar?',
              resources: ['Attachment theory', 'Non-attachment'],
              completionCriteria: 'Inventario completo de patrones de apego'
            },
            {
              title: 'Acuerdos Explicitos',
              description: 'Negocia acuerdos conscientes en lugar de expectativas tacitas',
              action: 'Con 3 relaciones cercanas, explicita acuerdos y expectativas',
              resources: ['Relationship agreements', 'Conscious contracts'],
              completionCriteria: '3 conjuntos de acuerdos explicitos co-creados'
            },
            {
              title: 'Soltar sin Abandonar',
              description: 'Practica no-apego manteniendo compromiso',
              action: 'Durante 4 semanas, practica estar presente sin aferrarte',
              resources: ['Non-attachment practices', 'Loving detachment'],
              completionCriteria: '4 semanas de practica con journal de observaciones'
            },
            {
              title: 'Celebrar Autonomia',
              description: 'Honra el crecimiento y cambio de quienes amas',
              action: 'Identifica crecimiento en otros y celebralo explicitamente',
              resources: ['Celebrating growth', 'Relational freedom'],
              completionCriteria: 'Has celebrado conscientemente el crecimiento de 5 personas'
            }
          ]
        }
      ],

      // ========================================================================
      // SIMPLICIDAD RADICAL
      // ========================================================================
      'simplicidad-radical': [
        {
          id: 'camino-simplicidad',
          icon: '🏔️',
          title: 'Camino hacia Simplicidad',
          description: 'Reduce complejidad, aumenta claridad y libertad',
          duration: '12 semanas',
          difficulty: 'Intermedio',
          steps: [
            {
              title: 'Auditoria de Complejidad',
              description: 'Identifica fuentes de complicacion en tu vida',
              action: 'Mapea: posesiones, compromisos, relaciones, deudas, informacion consumida',
              resources: ['Life audit tools', 'Complexity mapping'],
              completionCriteria: 'Mapa completo de areas de complejidad'
            },
            {
              title: 'Simplificacion Material',
              description: 'Reduce posesiones a lo esencial',
              action: 'Deshazte del 50% de posesiones no esenciales',
              resources: ['Minimalism', 'Decluttering methods'],
              completionCriteria: 'Has reducido posesiones en 50% documentado'
            },
            {
              title: 'Simplificacion Temporal',
              description: 'Reduce compromisos y obligaciones',
              action: 'Elimina 30% de compromisos recurrentes',
              resources: ['Essentialism', 'Time management'],
              completionCriteria: 'Agenda simplificada con 30% menos compromisos'
            },
            {
              title: 'Simplicidad Digital',
              description: 'Reduce ruido informacional',
              action: 'Elimina 80% de suscripciones, notificaciones, apps',
              resources: ['Digital minimalism', 'Information diet'],
              completionCriteria: 'Entorno digital radicalmente simplificado'
            }
          ]
        },
        {
          id: 'autosuficiencia',
          icon: '🛠️',
          title: 'Cultivar Autosuficiencia',
          description: 'Desarrolla habilidades basicas para depender menos del sistema',
          duration: '16 semanas',
          difficulty: 'Avanzado',
          steps: [
            {
              title: 'Produccion de Alimentos',
              description: 'Aprende a producir parte de tu comida',
              action: 'Inicia huerto (balcon/jardin/comunitario), produce 10% de tu alimentacion',
              resources: ['Urban farming', 'Permaculture basics'],
              completionCriteria: 'Huerto activo produciendo regularmente'
            },
            {
              title: 'Habilidades de Reparacion',
              description: 'Aprende a reparar en vez de reemplazar',
              action: 'Aprende 3 habilidades: textil, electronica basica, carpinteria',
              resources: ['Repair manuals', 'Fix-it workshops'],
              completionCriteria: 'Has reparado exitosamente 5 objetos'
            },
            {
              title: 'Produccion Artesanal',
              description: 'Crea en vez de comprar',
              action: 'Aprende a hacer 3 productos que usas regularmente',
              resources: ['DIY guides', 'Maker culture'],
              completionCriteria: 'Produces regularmente 3 items que antes comprabas'
            },
            {
              title: 'Reduccion Dependencia Monetaria',
              description: 'Reduce necesidad de dinero',
              action: 'Participa en economias alternativas: trueque, banco de tiempo, sharing',
              resources: ['Alternative economies', 'Gift economy'],
              completionCriteria: '20% de necesidades satisfechas fuera de economia monetaria'
            }
          ]
        }
      ],

      // ========================================================================
      // REVOLUCION CREATIVA
      // ========================================================================
      'revolucion-creativa': [
        {
          id: 'desbloqueo-creativo',
          icon: '🎨',
          title: 'Desbloqueo Creativo',
          description: 'Libera tu creatividad natural bloqueada',
          duration: '8 semanas',
          difficulty: 'Principiante',
          steps: [
            {
              title: 'Paginas Matutinas',
              description: 'Escritura automatica diaria para limpiar bloqueos',
              action: '3 paginas escritas a mano cada manana durante 6 semanas',
              resources: ['Julia Cameron: The Artists Way', 'Morning pages'],
              completionCriteria: '42 dias de paginas matutinas completadas'
            },
            {
              title: 'Citas de Artista',
              description: 'Tiempo regular dedicado a juego creativo',
              action: '2 horas semanales de exploracion creativa sin objetivo',
              resources: ['Artist dates', 'Creative play'],
              completionCriteria: '6 citas de artista documentadas'
            },
            {
              title: 'Experimentacion Multi-Media',
              description: 'Prueba 5 medios creativos diferentes',
              action: 'Crea en: escritura, dibujo, musica, fotografia, movimiento',
              resources: ['Creative exploration', 'Multi-media art'],
              completionCriteria: 'Has creado en 5 medios diferentes'
            },
            {
              title: 'Proyecto Creativo Personal',
              description: 'Completa una obra creativa de inicio a fin',
              action: 'Elige medio favorito y crea proyecto de 4 semanas',
              resources: ['Project management', 'Creative process'],
              completionCriteria: 'Proyecto creativo completado y compartido'
            }
          ]
        },
        {
          id: 'arte-activismo',
          icon: '✊',
          title: 'Arte como Activismo',
          description: 'Usa creatividad para transformacion social',
          duration: '10 semanas',
          difficulty: 'Intermedio',
          steps: [
            {
              title: 'Estudiar Artivismo',
              description: 'Aprende de artistas activistas',
              action: 'Estudia 5 casos: Banksy, Pussy Riot, Teatro del Oprimido, etc.',
              resources: ['Artivism examples', 'Political art'],
              completionCriteria: 'Has estudiado 5 artistas/colectivos y sus metodos'
            },
            {
              title: 'Identificar tu Mensaje',
              description: 'Define que injusticia quieres confrontar',
              action: 'Elige causa que te enciende, investiga a fondo',
              resources: ['Issue research', 'Critical analysis'],
              completionCriteria: 'Causa elegida con investigacion profunda'
            },
            {
              title: 'Crear Intervencion',
              description: 'Disena accion artistica con impacto social',
              action: 'Crea intervencion publica: performance, guerrilla art, cultura jamming',
              resources: ['Guerrilla art', 'Performance activism'],
              completionCriteria: 'Intervencion ejecutada y documentada'
            },
            {
              title: 'Amplificar Impacto',
              description: 'Difunde tu accion para multiplicar efecto',
              action: 'Documenta, comparte en redes, contacta medios, invita a replicar',
              resources: ['Media activism', 'Social media for change'],
              completionCriteria: 'Al menos 1000 personas alcanzadas con tu accion'
            }
          ]
        },
        {
          id: 'imaginacion-radical',
          icon: '🌈',
          title: 'Imaginacion Radical',
          description: 'Cultiva capacidad de imaginar futuros alternativos',
          duration: '8 semanas',
          difficulty: 'Avanzado',
          steps: [
            {
              title: 'Deconstruir Realismo Capitalista',
              description: 'Identifica limites ideologicos de tu imaginacion',
              action: 'Lee Mark Fisher, identifica que "no puedes imaginar"',
              resources: ['Capitalist Realism', 'Ideology critique'],
              completionCriteria: 'Has identificado 10 limites de tu imaginacion politica'
            },
            {
              title: 'Estudiar Utopias',
              description: 'Aprende de visiones radicales del pasado y presente',
              action: 'Estudia 5 utopias: Fourier, Rojava, Zapatistas, Solarpunk, etc.',
              resources: ['Utopian studies', 'Prefigurative politics'],
              completionCriteria: 'Has estudiado 5 experimentos utopicos'
            },
            {
              title: 'Escribir tu Utopia',
              description: 'Articula tu vision de mundo posible',
              action: 'Escribe relato de 5000 palabras describiendo tu mundo ideal',
              resources: ['Speculative fiction', 'Visionary writing'],
              completionCriteria: 'Relato utopico completo y revisado'
            },
            {
              title: 'Prefiguracion',
              description: 'Empieza a vivir el futuro que imaginas',
              action: 'Identifica 3 aspectos de tu utopia y empieza a vivirlos hoy',
              resources: ['Prefigurative politics', 'Lived utopias'],
              completionCriteria: '3 practicas prefigurativas activas durante 4 semanas'
            }
          ]
        }
      ]
    };

    // Si el libro tiene paths, devolverlos
    // Si no tiene paths especificos, devolver todos los paths disponibles
    if (bookId && pathsDatabase[bookId] && pathsDatabase[bookId].length > 0) {
      return pathsDatabase[bookId];
    }

    // Fallback: devolver todos los paths de todos los libros
    const allPaths = [];
    Object.entries(pathsDatabase).forEach(([sourceBookId, paths]) => {
      paths.forEach(path => {
        allPaths.push({
          ...path,
          sourceBook: sourceBookId  // Para saber de que libro viene
        });
      });
    });

    return allPaths;
  }

  // ==========================================================================
  // CLEANUP
  // ==========================================================================

  destroy() {
    // No hay recursos que limpiar en este modulo
  }
}

// Exportar globalmente
window.LearningPathsData = LearningPathsData;
