const fs = require('fs');

// Recursos por capítulo
const chapterResources = {
  "prologo": {
    exercises: [
      {
        id: "ex-prologo-1",
        title: "Inventario de transiciones personales",
        duration: "30 minutos",
        description: "Reflexiona sobre las transiciones que has vivido en tu vida",
        steps: [
          "Lista 3 transiciones importantes que hayas experimentado (cambio de trabajo, mudanza, cambio de relación, etc.)",
          "Para cada una, identifica: ¿Qué terminó? ¿Qué comenzó? ¿Qué hubo en medio?",
          "¿Qué recursos te ayudaron en cada transición?",
          "¿Qué aprendiste que puedas aplicar a transiciones colectivas?"
        ],
        reflection: "Las transiciones personales nos enseñan sobre las colectivas. La zona de incertidumbre entre lo viejo y lo nuevo es donde ocurre la verdadera transformación."
      }
    ],
    externalLinks: [
      {
        title: "Transition Network",
        url: "https://transitionnetwork.org/",
        type: "organización",
        description: "Red global de iniciativas de transición local"
      },
      {
        title: "The Great Transition Initiative",
        url: "https://greattransition.org/",
        type: "think tank",
        description: "Investigación sobre escenarios de transición global"
      }
    ]
  },

  "cap1": {
    exercises: [
      {
        id: "ex-cap1-1",
        title: "Análisis de una transición histórica",
        duration: "45 minutos",
        description: "Estudia en profundidad una transición histórica",
        steps: [
          "Elige una transición histórica que te interese (Revolución Industrial, caída del muro, fin del apartheid, etc.)",
          "Investiga: ¿Cuánto duró? ¿Quiénes fueron los actores clave?",
          "Identifica: ¿Qué condiciones previas la hicieron posible?",
          "¿Hubo momentos de aceleración? ¿Cuáles fueron los catalizadores?",
          "¿Qué resistencias hubo y cómo se superaron?"
        ],
        reflection: "Las transiciones históricas raramente son lineales. Hay períodos de estancamiento, aceleración, retroceso y consolidación."
      }
    ],
    externalLinks: [
      {
        title: "Multi-Level Perspective on Transitions",
        url: "https://transitionsnetwork.org/",
        type: "marco teórico",
        description: "Marco académico para entender transiciones socio-técnicas"
      },
      {
        title: "History of Social Movements (Wikipedia)",
        url: "https://en.wikipedia.org/wiki/Social_movement",
        type: "referencia",
        description: "Contexto histórico de movimientos de cambio social"
      }
    ]
  },

  "cap2": {
    exercises: [
      {
        id: "ex-cap2-1",
        title: "Mapeo de puntos de apalancamiento",
        duration: "60 minutos",
        description: "Identifica puntos de intervención en un sistema que quieras cambiar",
        steps: [
          "Elige un sistema que quieras transformar (tu organización, barrio, sector, etc.)",
          "Dibuja un diagrama simple de sus elementos y conexiones",
          "Usando los 12 puntos de apalancamiento de Donella Meadows, identifica al menos 3 puntos donde podrías intervenir",
          "Para cada punto, evalúa: ¿Qué tan accesible es? ¿Qué impacto tendría?",
          "Prioriza: ¿Dónde empezarías?"
        ],
        reflection: "Los puntos de mayor apalancamiento suelen estar en los paradigmas y reglas del sistema, no en los parámetros visibles."
      }
    ],
    externalLinks: [
      {
        title: "Leverage Points (Donella Meadows)",
        url: "https://donellameadows.org/archives/leverage-points-places-to-intervene-in-a-system/",
        type: "artículo fundacional",
        description: "El artículo original sobre puntos de apalancamiento en sistemas"
      },
      {
        title: "Systems Innovation",
        url: "https://www.systemsinnovation.io/",
        type: "plataforma educativa",
        description: "Cursos y recursos sobre pensamiento sistémico"
      },
      {
        title: "The Systems Thinker",
        url: "https://thesystemsthinker.com/",
        type: "publicación",
        description: "Artículos y herramientas sobre pensamiento sistémico"
      }
    ]
  },

  "cap3": {
    exercises: [
      {
        id: "ex-cap3-1",
        title: "Mapeo del ecosistema de cambio local",
        duration: "90 minutos",
        description: "Crea un mapa de las iniciativas de cambio en tu territorio",
        steps: [
          "Define tu territorio (barrio, ciudad, región)",
          "Lista todas las iniciativas de cambio que conozcas: cooperativas, asociaciones, proyectos comunitarios, etc.",
          "Clasifícalas: ¿En qué área trabajan? ¿Qué escala tienen?",
          "Dibuja un mapa visual con conexiones entre ellas",
          "Identifica: ¿Dónde hay huecos? ¿Dónde hay redundancia? ¿Qué conexiones faltan?"
        ],
        reflection: "El ecosistema de cambio es más rico de lo que parece. Visibilizarlo es el primer paso para fortalecerlo."
      }
    ],
    externalLinks: [
      {
        title: "Kumu - Relationship Mapping",
        url: "https://kumu.io/",
        type: "herramienta",
        description: "Plataforma para crear mapas de ecosistemas y redes"
      },
      {
        title: "Mapping Ecosystems (Nesta)",
        url: "https://www.nesta.org.uk/toolkit/ecosystem-mapping/",
        type: "guía",
        description: "Metodología para mapear ecosistemas de innovación"
      }
    ]
  },

  "cap4": {
    exercises: [
      {
        id: "ex-cap4-1",
        title: "Auditoría de impacto de tu trabajo",
        duration: "45 minutos",
        description: "Analiza críticamente el modelo de negocio donde trabajas",
        steps: [
          "Describe el modelo de negocio de tu organización en una frase",
          "¿Qué valor crea realmente? ¿Para quién?",
          "¿Qué externalidades negativas tiene? (ambientales, sociales, de salud)",
          "¿Quién se beneficia de su éxito? ¿Quién pierde?",
          "Si tuvieras que rediseñarlo para el bien común, ¿qué cambiarías?"
        ],
        reflection: "No se trata de culpa sino de claridad. Entender el modelo actual es prerequisito para cambiarlo."
      }
    ],
    externalLinks: [
      {
        title: "B Corporation",
        url: "https://www.bcorporation.net/",
        type: "certificación",
        description: "Empresas certificadas por su impacto social y ambiental"
      },
      {
        title: "Economy for the Common Good",
        url: "https://www.ecogood.org/",
        type: "movimiento",
        description: "Movimiento para una economía orientada al bien común"
      },
      {
        title: "Doughnut Economics Action Lab",
        url: "https://doughnuteconomics.org/",
        type: "think tank",
        description: "Herramientas para una economía regenerativa y distributiva"
      }
    ]
  },

  "cap5": {
    exercises: [
      {
        id: "ex-cap5-1",
        title: "Diseño de una cooperativa",
        duration: "60 minutos",
        description: "Diseña el esqueleto de una cooperativa para tu sector",
        steps: [
          "Identifica una necesidad en tu sector que podría cubrirse cooperativamente",
          "¿Quiénes serían los socios? ¿Trabajadores, consumidores, ambos?",
          "¿Cuál sería el modelo de gobernanza? ¿Cómo se tomarían las decisiones?",
          "¿Cómo se repartirían los excedentes?",
          "¿Qué ventajas tendría sobre el modelo convencional? ¿Qué desafíos?"
        ],
        reflection: "Las cooperativas no son utopía; son empresas reales con millones de socios en todo el mundo."
      }
    ],
    externalLinks: [
      {
        title: "Mondragon Corporation",
        url: "https://www.mondragon-corporation.com/",
        type: "caso de estudio",
        description: "La mayor cooperativa del mundo, en el País Vasco"
      },
      {
        title: "International Cooperative Alliance",
        url: "https://www.ica.coop/",
        type: "organización",
        description: "Organización global del movimiento cooperativo"
      },
      {
        title: "Platform Cooperativism Consortium",
        url: "https://platform.coop/",
        type: "red",
        description: "Cooperativismo de plataforma digital"
      },
      {
        title: "CECOP - Cooperativas de Europa",
        url: "https://www.cecop.coop/",
        type: "federación",
        description: "Confederación europea de cooperativas"
      }
    ]
  },

  "cap6": {
    exercises: [
      {
        id: "ex-cap6-1",
        title: "Experimento de auto-organización",
        duration: "1 semana",
        description: "Prueba un elemento de auto-organización en tu equipo",
        steps: [
          "Identifica una decisión que normalmente tome un jefe",
          "Propón al equipo tomar esa decisión colectivamente durante una semana",
          "Establece un método: ¿consenso? ¿consentimiento? ¿votación?",
          "Documenta qué pasa: ¿cómo se sienten? ¿es más lento? ¿mejor?",
          "Al final, evalúa: ¿qué funcionó? ¿qué no? ¿qué aprendiste?"
        ],
        reflection: "La auto-organización no es caos; es orden emergente basado en reglas claras y confianza."
      }
    ],
    externalLinks: [
      {
        title: "Reinventing Organizations (Wiki)",
        url: "https://reinventingorganizationswiki.com/",
        type: "wiki",
        description: "Recursos sobre organizaciones Teal y auto-organizadas"
      },
      {
        title: "Sociocracy 3.0",
        url: "https://sociocracy30.org/",
        type: "metodología",
        description: "Patrones para evolucionar organizaciones"
      },
      {
        title: "Holacracy",
        url: "https://www.holacracy.org/",
        type: "sistema",
        description: "Sistema de auto-organización para empresas"
      },
      {
        title: "Corporate Rebels",
        url: "https://corporate-rebels.com/",
        type: "blog",
        description: "Casos de empresas que experimentan con nuevos modelos"
      }
    ]
  },

  "cap7": {
    exercises: [
      {
        id: "ex-cap7-1",
        title: "Identificar commons en tu vida",
        duration: "30 minutos",
        description: "Descubre los bienes comunes que ya usas",
        steps: [
          "Lista recursos que usas que no son ni privados ni estatales",
          "Ejemplos: Wikipedia, software libre, parques, conocimiento tradicional...",
          "¿Quién los mantiene? ¿Cómo se gobiernan?",
          "¿Cuáles están amenazados? ¿Por qué?",
          "¿Hay algún commons que podrías ayudar a crear o fortalecer?"
        ],
        reflection: "Los commons no son 'de nadie'; son 'de todos los que participan en cuidarlos'."
      }
    ],
    externalLinks: [
      {
        title: "P2P Foundation Wiki",
        url: "https://wiki.p2pfoundation.net/",
        type: "wiki",
        description: "Enciclopedia del procomún y la producción entre pares"
      },
      {
        title: "Creative Commons",
        url: "https://creativecommons.org/",
        type: "licencias",
        description: "Sistema de licencias para compartir obras"
      },
      {
        title: "Ostrom Workshop",
        url: "https://ostromworkshop.indiana.edu/",
        type: "investigación",
        description: "Centro de investigación sobre gobernanza de commons"
      },
      {
        title: "Commons Transition",
        url: "https://commonstransition.org/",
        type: "think tank",
        description: "Políticas para una sociedad basada en los comunes"
      }
    ]
  },

  "cap8": {
    exercises: [
      {
        id: "ex-cap8-1",
        title: "Explorar una DAO",
        duration: "60 minutos",
        description: "Investiga una DAO real y cómo funciona",
        steps: [
          "Elige una DAO para investigar (GitcoinDAO, ENS DAO, MakerDAO, etc.)",
          "¿Cuál es su propósito? ¿Qué decisiones toma?",
          "¿Cómo se vota? ¿Quién puede participar?",
          "¿Cuáles son sus fortalezas y debilidades?",
          "¿Qué aplicación podría tener este modelo fuera de crypto?"
        ],
        reflection: "Las DAOs son experimentos imperfectos pero valiosos en gobernanza digital."
      }
    ],
    externalLinks: [
      {
        title: "DeepDAO",
        url: "https://deepdao.io/",
        type: "directorio",
        description: "Directorio y análisis de DAOs"
      },
      {
        title: "Aragon",
        url: "https://aragon.org/",
        type: "plataforma",
        description: "Plataforma para crear y gestionar DAOs"
      },
      {
        title: "Snapshot",
        url: "https://snapshot.org/",
        type: "herramienta",
        description: "Sistema de votación para DAOs"
      },
      {
        title: "DAOhaus",
        url: "https://daohaus.club/",
        type: "plataforma",
        description: "Plataforma para DAOs basadas en Moloch"
      }
    ]
  },

  "cap9": {
    exercises: [
      {
        id: "ex-cap9-1",
        title: "Auditoría financiera ética",
        duration: "45 minutos",
        description: "Revisa dónde está tu dinero y qué financia",
        steps: [
          "¿En qué banco tienes tus ahorros? Investiga qué financia",
          "¿Tienes inversiones o pensión? ¿En qué están invertidas?",
          "¿Hay alternativas de banca ética disponibles en tu país?",
          "¿Existen monedas locales o complementarias en tu zona?",
          "Define un pequeño paso: ¿qué podrías cambiar este mes?"
        ],
        reflection: "El dinero es un voto diario. Cada transacción apoya un tipo de economía."
      }
    ],
    externalLinks: [
      {
        title: "Triodos Bank",
        url: "https://www.triodos.es/",
        type: "banco ético",
        description: "Banco ético europeo"
      },
      {
        title: "Goteo",
        url: "https://www.goteo.org/",
        type: "crowdfunding",
        description: "Plataforma de crowdfunding cívico"
      },
      {
        title: "Open Food Network",
        url: "https://openfoodnetwork.org/",
        type: "plataforma",
        description: "Infraestructura para sistemas alimentarios locales"
      },
      {
        title: "Community Exchange System",
        url: "https://www.community-exchange.org/",
        type: "red",
        description: "Red global de sistemas de intercambio comunitario"
      },
      {
        title: "Timebanking",
        url: "https://timebanks.org/",
        type: "metodología",
        description: "Recursos sobre bancos de tiempo"
      }
    ]
  },

  "cap10": {
    exercises: [
      {
        id: "ex-cap10-1",
        title: "Diseño de proceso participativo",
        duration: "60 minutos",
        description: "Diseña un proceso de toma de decisiones para tu comunidad",
        steps: [
          "Elige una decisión que tu comunidad/organización deba tomar pronto",
          "¿Quién debería participar? ¿Quién se ve afectado?",
          "¿Qué información necesitan los participantes?",
          "¿Qué método usarías? (Asamblea, World Café, Círculo, etc.)",
          "¿Cómo garantizarías que todas las voces sean escuchadas?",
          "Diseña una agenda para el proceso"
        ],
        reflection: "La calidad de las decisiones depende de la calidad del proceso."
      }
    ],
    externalLinks: [
      {
        title: "Decidim",
        url: "https://decidim.org/",
        type: "plataforma",
        description: "Plataforma de democracia participativa digital"
      },
      {
        title: "Loomio",
        url: "https://www.loomio.org/",
        type: "herramienta",
        description: "Herramienta para toma de decisiones colaborativa"
      },
      {
        title: "Participedia",
        url: "https://participedia.net/",
        type: "base de datos",
        description: "Base de datos de procesos participativos"
      },
      {
        title: "NCDD (National Coalition for Dialogue & Deliberation)",
        url: "https://www.ncdd.org/",
        type: "red",
        description: "Recursos sobre diálogo deliberativo"
      },
      {
        title: "Art of Hosting",
        url: "https://artofhosting.org/",
        type: "metodología",
        description: "Prácticas de liderazgo participativo"
      }
    ]
  },

  "cap11": {
    exercises: [
      {
        id: "ex-cap11-1",
        title: "Auditoría de soberanía digital",
        duration: "45 minutos",
        description: "Evalúa tu dependencia de plataformas extractivas",
        steps: [
          "Lista las herramientas digitales que usas a diario",
          "Para cada una: ¿Es software libre? ¿Dónde están tus datos?",
          "¿De cuáles dependes críticamente? ¿Hay alternativas éticas?",
          "Identifica 2-3 cambios factibles que podrías hacer",
          "Planifica: ¿Cuál harás primero? ¿Cuándo?"
        ],
        reflection: "La soberanía digital no es todo o nada. Cada paso hacia alternativas éticas cuenta."
      }
    ],
    externalLinks: [
      {
        title: "switching.software",
        url: "https://switching.software/",
        type: "directorio",
        description: "Alternativas éticas a software propietario"
      },
      {
        title: "Framasoft",
        url: "https://framasoft.org/",
        type: "organización",
        description: "Colectivo francés con herramientas libres"
      },
      {
        title: "Nextcloud",
        url: "https://nextcloud.com/",
        type: "software",
        description: "Alternativa libre a Google Drive/Dropbox"
      },
      {
        title: "Matrix/Element",
        url: "https://element.io/",
        type: "comunicación",
        description: "Alternativa descentralizada a Slack/Discord"
      },
      {
        title: "Mastodon",
        url: "https://joinmastodon.org/",
        type: "red social",
        description: "Red social federada alternativa a Twitter"
      }
    ]
  },

  "cap12": {
    exercises: [
      {
        id: "ex-cap12-1",
        title: "Práctica de escucha profunda",
        duration: "30 minutos",
        description: "Practica escucha activa con alguien con quien tengas conflicto",
        steps: [
          "Identifica una persona con quien tengas tensión o desacuerdo",
          "Invítala a una conversación con reglas claras: turnos de 5 minutos sin interrupción",
          "Cuando te toque escuchar: solo escucha, sin preparar respuesta",
          "Al final de cada turno, resume lo que entendiste y pregunta si es correcto",
          "No busques resolver; solo entender"
        ],
        reflection: "La escucha profunda transforma más que los mejores argumentos."
      }
    ],
    externalLinks: [
      {
        title: "Comunicación No Violenta (CNV)",
        url: "https://www.cnvc.org/",
        type: "metodología",
        description: "Centro de Comunicación No Violenta de Marshall Rosenberg"
      },
      {
        title: "Restorative Circles",
        url: "https://www.restorativecircles.org/",
        type: "metodología",
        description: "Sistema de diálogo restaurativo"
      },
      {
        title: "The Work That Reconnects",
        url: "https://workthatreconnects.org/",
        type: "metodología",
        description: "Prácticas de Joanna Macy para reconexión"
      },
      {
        title: "Council of All Beings",
        url: "https://www.rainforestinfo.org.au/deep-eco/council.htm",
        type: "práctica",
        description: "Ritual de reconexión con la naturaleza"
      }
    ]
  },

  "cap13": {
    exercises: [
      {
        id: "ex-cap13-1",
        title: "Práctica contemplativa diaria",
        duration: "1 semana",
        description: "Establece una práctica contemplativa mínima",
        steps: [
          "Elige una práctica: meditación, journaling, caminar consciente, etc.",
          "Comprométete con 10 minutos diarios durante una semana",
          "Elige un momento fijo del día (mañana suele funcionar mejor)",
          "Lleva un registro breve: ¿qué notaste? ¿qué dificultades?",
          "Al final de la semana: ¿qué efecto tuvo en tu estado general?"
        ],
        reflection: "El activismo sostenible requiere cuidado interior. No es lujo; es necesidad."
      }
    ],
    externalLinks: [
      {
        title: "Plum Village (Thich Nhat Hanh)",
        url: "https://plumvillage.org/",
        type: "comunidad",
        description: "Mindfulness aplicado al activismo"
      },
      {
        title: "Insight Timer",
        url: "https://insighttimer.com/",
        type: "app",
        description: "App gratuita de meditación"
      },
      {
        title: "Focusing Institute",
        url: "https://focusing.org/",
        type: "metodología",
        description: "Práctica de atención somática"
      },
      {
        title: "Internal Family Systems",
        url: "https://ifs-institute.com/",
        type: "terapia",
        description: "Modelo terapéutico de partes internas"
      }
    ]
  },

  "cap14": {
    exercises: [
      {
        id: "ex-cap14-1",
        title: "Mapa de transición personal",
        duration: "60 minutos",
        description: "Diseña tu propia transición en las áreas clave de tu vida",
        steps: [
          "Dibuja un círculo dividido en sectores: trabajo, dinero, consumo, relaciones, tiempo, lugar",
          "Para cada sector: ¿dónde estás ahora? (1-10 en alineamiento con tus valores)",
          "¿Dónde querrías estar? ¿Qué sería un paso en esa dirección?",
          "Identifica interdependencias: ¿qué cambios facilitan otros?",
          "Elige 1-2 áreas para empezar y define acciones concretas"
        ],
        reflection: "La transición personal no es todo o nada. Es un proceso de ajuste continuo."
      }
    ],
    externalLinks: [
      {
        title: "Ikigai (concepto)",
        url: "https://en.wikipedia.org/wiki/Ikigai",
        type: "concepto",
        description: "El concepto japonés de propósito de vida"
      },
      {
        title: "Designing Your Life (Stanford)",
        url: "https://designingyour.life/",
        type: "metodología",
        description: "Design thinking aplicado a la vida personal"
      },
      {
        title: "80,000 Hours",
        url: "https://80000hours.org/",
        type: "orientación",
        description: "Guía para carreras de alto impacto"
      }
    ]
  },

  "cap15": {
    exercises: [
      {
        id: "ex-cap15-1",
        title: "Mapeo de comunidad",
        duration: "90 minutos",
        description: "Crea un mapa de tu comunidad y sus recursos",
        steps: [
          "Define tu comunidad (geográfica, de interés, etc.)",
          "Lista todos los recursos que tiene: personas con habilidades, espacios, herramientas, conocimiento",
          "Lista las necesidades no cubiertas",
          "Identifica conexiones posibles: ¿qué recurso podría cubrir qué necesidad?",
          "¿Qué falta? ¿Qué podrías aportar tú?"
        ],
        reflection: "Las comunidades tienen más recursos de los que reconocen. El mapeo los hace visibles."
      }
    ],
    externalLinks: [
      {
        title: "Asset-Based Community Development (ABCD)",
        url: "https://resources.depaul.edu/abcd-institute/",
        type: "metodología",
        description: "Desarrollo comunitario basado en activos"
      },
      {
        title: "Transition Towns",
        url: "https://transitionnetwork.org/",
        type: "movimiento",
        description: "Red global de pueblos en transición"
      },
      {
        title: "Shareable",
        url: "https://www.shareable.net/",
        type: "medio",
        description: "Noticias sobre economía colaborativa y comunitaria"
      },
      {
        title: "Community Tool Box",
        url: "https://ctb.ku.edu/",
        type: "recursos",
        description: "Recursos para trabajo comunitario"
      }
    ]
  },

  "cap16": {
    exercises: [
      {
        id: "ex-cap16-1",
        title: "Análisis de cultura organizacional",
        duration: "45 minutos",
        description: "Diagnostica la cultura de tu organización",
        steps: [
          "¿Cómo se toman realmente las decisiones? (no oficialmente, sino en la práctica)",
          "¿Qué comportamientos se premian? ¿Cuáles se castigan?",
          "¿Qué no se puede decir? ¿Qué temas son tabú?",
          "¿Quién tiene poder informal? ¿Cómo lo consiguió?",
          "Si pudieras cambiar una cosa de la cultura, ¿cuál sería? ¿Por qué?"
        ],
        reflection: "La cultura se come a la estrategia para desayunar. Sin cambio cultural, no hay transformación."
      }
    ],
    externalLinks: [
      {
        title: "Deliberately Developmental Organizations",
        url: "https://www.ddo.co/",
        type: "modelo",
        description: "Organizaciones que priorizan el desarrollo personal"
      },
      {
        title: "Enspiral",
        url: "https://www.enspiral.com/",
        type: "red",
        description: "Red de emprendedores sociales en Nueva Zelanda"
      },
      {
        title: "Happy Startups School",
        url: "https://www.thehappystartupschool.com/",
        type: "comunidad",
        description: "Comunidad de emprendimiento con propósito"
      },
      {
        title: "Greaterthan",
        url: "https://www.greaterthan.works/",
        type: "consultora",
        description: "Consultora especializada en organizaciones participativas"
      }
    ]
  },

  "cap17": {
    exercises: [
      {
        id: "ex-cap17-1",
        title: "Análisis de poder político",
        duration: "60 minutos",
        description: "Mapea el poder político en tu contexto",
        steps: [
          "Elige un tema político que te importe (vivienda, clima, educación, etc.)",
          "¿Quiénes son los actores clave que toman decisiones sobre este tema?",
          "¿Qué intereses tienen? ¿Qué presiones reciben?",
          "¿Dónde están los puntos de acceso para la ciudadanía?",
          "¿Qué estrategias de incidencia podrían ser efectivas?"
        ],
        reflection: "El poder político no es monolítico. Tiene fisuras y puntos de entrada."
      }
    ],
    externalLinks: [
      {
        title: "Beautiful Trouble",
        url: "https://beautifultrouble.org/",
        type: "toolkit",
        description: "Tácticas para activismo creativo"
      },
      {
        title: "Civicus",
        url: "https://www.civicus.org/",
        type: "alianza",
        description: "Alianza global de sociedad civil"
      },
      {
        title: "350.org",
        url: "https://350.org/",
        type: "movimiento",
        description: "Movimiento global por la justicia climática"
      },
      {
        title: "Open Secrets",
        url: "https://www.opensecrets.org/",
        type: "transparencia",
        description: "Seguimiento del dinero en política (EEUU)"
      }
    ]
  },

  "cap18": {
    exercises: [
      {
        id: "ex-cap18-1",
        title: "Plan de resiliencia personal",
        duration: "45 minutos",
        description: "Diseña tu plan de supervivencia digna",
        steps: [
          "¿Cuáles son tus necesidades básicas? (vivienda, alimentación, salud, comunidad)",
          "¿Qué tan seguras están cubiertas? ¿Qué dependencias tienes?",
          "¿Qué habilidades tienes que son útiles en crisis?",
          "¿Qué redes de apoyo mutuo tienes? ¿Cómo podrías fortalecerlas?",
          "Define 3 acciones para aumentar tu resiliencia"
        ],
        reflection: "La resiliencia no es supervivencialismo individual. Es interdependencia consciente."
      }
    ],
    externalLinks: [
      {
        title: "Mutual Aid Hub",
        url: "https://www.mutualaidhub.org/",
        type: "directorio",
        description: "Directorio de grupos de ayuda mutua"
      },
      {
        title: "Permaculture Principles",
        url: "https://permacultureprinciples.com/",
        type: "principios",
        description: "Principios de permacultura para resiliencia"
      },
      {
        title: "Low-tech Magazine",
        url: "https://www.lowtechmagazine.com/",
        type: "medio",
        description: "Tecnología apropiada y resiliente"
      },
      {
        title: "Deep Adaptation Forum",
        url: "https://www.deepadaptation.info/",
        type: "comunidad",
        description: "Comunidad de adaptación profunda al colapso"
      }
    ]
  },

  "cap19": {
    exercises: [
      {
        id: "ex-cap19-1",
        title: "Mapeo de poder prefigurativo",
        duration: "60 minutos",
        description: "Identifica espacios donde ya se ejerce poder alternativo",
        steps: [
          "Lista espacios donde ya se vive de forma diferente (cooperativas, comunidades, proyectos)",
          "¿Qué tipo de poder ejercen? ¿Poder sobre, poder con, poder desde dentro?",
          "¿Cómo protegen su autonomía? ¿Qué amenazas enfrentan?",
          "¿Cómo escalan sin perder su esencia?",
          "¿En cuál podrías participar o aprender?"
        ],
        reflection: "El poder prefigurativo demuestra que otro mundo es posible... porque ya existe en miniatura."
      }
    ],
    externalLinks: [
      {
        title: "Zapatistas",
        url: "https://enlacezapatista.ezln.org.mx/",
        type: "movimiento",
        description: "Movimiento zapatista en Chiapas"
      },
      {
        title: "Rojava Information Center",
        url: "https://rojavainformationcenter.com/",
        type: "información",
        description: "Información sobre el experimento de Rojava"
      },
      {
        title: "Cooperation Jackson",
        url: "https://cooperationjackson.org/",
        type: "proyecto",
        description: "Proyecto de economía solidaria en Mississippi"
      },
      {
        title: "Barcelona en Comú",
        url: "https://barcelonaencomu.cat/",
        type: "partido",
        description: "Partido municipalista en Barcelona"
      }
    ]
  },

  "cap20": {
    exercises: [
      {
        id: "ex-cap20-1",
        title: "Análisis de amenazas",
        duration: "45 minutos",
        description: "Evalúa amenazas a un proyecto de cambio que conozcas",
        steps: [
          "Elige un proyecto de cambio que te importe (tuyo o de otros)",
          "¿Qué amenazas externas enfrenta? (legales, económicas, de cooptación)",
          "¿Qué amenazas internas? (burnout, conflictos, pérdida de propósito)",
          "¿Qué mecanismos de protección tiene? ¿Cuáles le faltan?",
          "¿Qué podrías aportar para fortalecerlo?"
        ],
        reflection: "Proteger lo construido es tan importante como construirlo."
      }
    ],
    externalLinks: [
      {
        title: "Frontline Defenders",
        url: "https://www.frontlinedefenders.org/",
        type: "protección",
        description: "Protección de defensores de derechos humanos"
      },
      {
        title: "Electronic Frontier Foundation",
        url: "https://www.eff.org/",
        type: "defensa",
        description: "Defensa de derechos digitales"
      },
      {
        title: "The Whistle",
        url: "https://thewhistle.org/",
        type: "herramienta",
        description: "Herramienta de documentación segura"
      },
      {
        title: "Holistic Security",
        url: "https://holistic-security.tacticaltech.org/",
        type: "guía",
        description: "Guía de seguridad holística para activistas"
      }
    ]
  },

  "epilogo": {
    exercises: [
      {
        id: "ex-epilogo-1",
        title: "Carta a tu yo futuro",
        duration: "30 minutos",
        description: "Escribe una carta a ti mismo dentro de un año",
        steps: [
          "Escribe la fecha de dentro de un año",
          "Describe qué has aprendido con este manual",
          "¿Qué compromisos haces contigo mismo?",
          "¿Qué pequeños pasos darás en los próximos 30 días?",
          "Guarda la carta y pon una alarma para leerla en un año"
        ],
        reflection: "La transición no termina con el libro. Apenas comienza."
      }
    ],
    externalLinks: [
      {
        title: "FutureMe",
        url: "https://www.futureme.org/",
        type: "herramienta",
        description: "Envía cartas a tu yo futuro"
      },
      {
        title: "One Small Step",
        url: "https://onesmallstep.braverangels.org/",
        type: "iniciativa",
        description: "Iniciativa para conectar a través de diferencias"
      }
    ]
  }
};

// Leer el archivo actual
const bookPath = '/home/josu/Documentos/guiaIT/25-11-25-version/coleccion-nuevo-ser/www/books/manual-transicion/book.json';
const book = JSON.parse(fs.readFileSync(bookPath, 'utf8'));

// Añadir recursos a cada capítulo
let addedCount = 0;
book.sections.forEach(section => {
  section.chapters.forEach(chapter => {
    const resources = chapterResources[chapter.id];
    if (resources) {
      // Añadir ejercicios
      if (resources.exercises && resources.exercises.length > 0) {
        chapter.exercises = resources.exercises;
        addedCount++;
      }
      // Añadir enlaces externos
      if (resources.externalLinks && resources.externalLinks.length > 0) {
        chapter.externalLinks = resources.externalLinks;
      }
    }
  });
});

// Guardar el archivo actualizado
fs.writeFileSync(bookPath, JSON.stringify(book, null, 2));
console.log(`✅ Recursos añadidos a ${addedCount} capítulos del Manual de Transición`);
