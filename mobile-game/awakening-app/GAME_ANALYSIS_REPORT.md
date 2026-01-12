# Awakening App - Informe de Lógica de Juego y Engagement

**Fecha:** 12 de Enero 2026
**Versión analizada:** 2.9.x
**Plataforma:** React Native (Android/iOS)

---

## 1. Resumen Ejecutivo

Awakening App es un juego móvil de colección y gestión donde los jugadores despliegan "Seres" para resolver crisis del mundo real. El juego tiene mecánicas sólidas de retención diaria pero carece de profundidad social y competitiva.

### Puntuación General de Engagement

| Categoría | Puntuación | Estado |
|-----------|------------|--------|
| Loop diario | 9/10 | Excelente |
| Progresión | 7/10 | Bueno |
| Colección | 8/10 | Muy bueno |
| Social | 4/10 | Crítico |
| Monetización | 2/10 | No implementado |
| End-game | 6/10 | Mejorable |

**Veredicto:** Juego mid-core con fuerte retención individual pero sin características multijugador desarrolladas.

---

## 2. Loop Principal de Juego

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   Desplegar Seres → Resolver Crisis → Ganar Recompensas    │
│         ↑                                    │              │
│         │                                    ↓              │
│   Evolucionar ← Subir Nivel ← XP/Consciencia/Fragmentos    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2.1 Mecánica de Resolución de Crisis

- **Costo:** Energía variable según escala de crisis
- **Duración:** 15-120 minutos según urgencia
- **Cálculo de éxito:**
  - Atributos del equipo vs requisitos de crisis
  - Bonus de sinergia (hasta +25%)
  - Penalización por atributos críticos faltantes (-15%)
  - Bonus por tamaño de equipo (+5% con 4+ seres)

### 2.2 Sistema de Sinergias

| Combinación | Nombre | Bonus |
|-------------|--------|-------|
| Sabiduría + Consciencia | Sabio Consciente | +25% |
| Liderazgo + Estrategia | Estratega Líder | +20% |
| Empatía + Comunicación | Comunicador Empático | +15% |
| Acción + Coraje | Guerrero Valiente | +15% |
| Creatividad + Innovación | Innovador Creativo | +15% |
| Técnico + Análisis | Analista Técnico | +10% |
| Sanación + Protección | Guardián Sanador | +20% |

---

## 3. Sistemas de Progresión

### 3.1 Niveles del Jugador (1-50)

| Nivel | Título | XP Requerido | Energía Máx | Slots Seres |
|-------|--------|--------------|-------------|-------------|
| 1 | Despertar | 100 | 100 | 5 |
| 10 | Buscador | 1,000 | 200 | 20 |
| 25 | Consciente | 10,000 | 500 | 60 |
| 40 | Iluminado | 50,000 | 1,000 | 120 |
| 50 | Nuevo Ser | 100,000 | 1,500 | 150 |

### 3.2 Niveles de Seres (1-50)

- **Fórmula XP:** 100 × nivel^1.5
- **Por nivel:** +2 a todos los atributos, +3 al atributo dominante
- **Milestone nivel 10:** Desbloquea caminos de evolución avanzados

### 3.3 Sistema de Evolución (5 Tiers)

```
TIER 0: Ser Iniciado (Base)
    │
    ├── TIER 1: Despertar (Nivel 5+, stat mínimo 40)
    │   ├── Sabio 📚
    │   ├── Guerrero ⚔️
    │   ├── Sanador 💚
    │   └── Tejedor 🔗
    │
    ├── TIER 2: Especialización (Nivel 15+, stat mínimo 60)
    │   ├── Maestro Sabio 🧙 / Oráculo 👁️
    │   ├── Campeón 🏆 / Guardián 🛡️
    │   ├── Maestro Sanador ✚ / Empático 💫
    │   └── Diplomático 🤝 / Armonizador ☮️
    │
    ├── TIER 3: Maestría (Nivel 30+, stat mínimo 80)
    │   └── 8 especializaciones trascendentes
    │
    └── TIER 4: Trascendencia (Nivel 50+)
        └── Aspecto del Nuevo Ser ✨
```

---

## 4. Mecánicas de Retención

### 4.1 Misiones Diarias

- **Cantidad:** 3 misiones auto-generadas
- **Reset:** Medianoche (hora local)
- **Tipos:** Resolver crisis, desplegar seres, explorar, visitar laboratorio
- **Bonus por completar las 3:** +150 XP, +50 consciencia, +20 energía

### 4.2 Sistema de Rachas (Streaks)

| Días Consecutivos | Multiplicador | Insignia |
|-------------------|---------------|----------|
| 3 días | +25% | 🔥 |
| 7 días | +50% | 🔥🔥 |
| 14 días | +75% | 💎 |
| 30 días | +100% | 👑 |

**Nota:** Perder un día resetea la racha completamente.

### 4.3 Racha de Misiones Exitosas

- +10% bonus por cada misión consecutiva exitosa
- Máximo: +100% (10+ misiones seguidas)
- Bonus primera vez por tipo de crisis: +100 XP

### 4.4 Liga Semanal

| Rango | Puntos Requeridos | Recompensa Semanal |
|-------|-------------------|-------------------|
| Bronce | 0-499 | 100 XP, 50 consciencia |
| Plata | 500-999 | 200 XP, 100 consciencia |
| Oro | 1,000-1,999 | 350 XP, 175 consciencia |
| Platino | 2,000-3,499 | 500 XP, 250 consciencia |
| Diamante | 3,500-4,999 | 700 XP, 350 consciencia |
| Maestro | 5,000-7,499 | 850 XP, 425 consciencia |
| Leyenda | 7,500+ | 1,000 XP, 500 consciencia |

**Puntuación:**
- Crisis exitosa: +100 pts
- Crisis fallida: +30 pts
- Primera misión del día: +50 pts bonus
- Rachas: +100 a +1,000 pts

---

## 5. Sistemas de Colección

### 5.1 Seres

| Rareza | Probabilidad Base | Multiplicador Stats |
|--------|-------------------|---------------------|
| Común | 60% | 1.0x |
| Raro | 25% | 1.2x |
| Épico | 12% | 1.5x |
| Legendario | 3% | 2.0x |

**Fuentes de obtención:**
- Resolución de crisis (probabilidad base)
- Fusión de 2 seres (25% chance upgrade rareza)
- Quizzes de conocimiento (legendarios, requiere 80%+)
- Descubrimientos ocultos (exploración)
- Comunidades (grupos de 3-5 seres)

### 5.2 Fragmentos de Atributos

15 tipos de fragmentos:
- Consciencia, Sabiduría, Empatía, Acción, Creatividad
- Técnico, Liderazgo, Estrategia, Comunicación, Análisis
- Coraje, Innovación, Sanación, Protección, Conexión

**Obtención por misión:** 1-4 fragmentos (70% relevante al tipo de crisis)

### 5.3 Comunidades

- Probabilidad de aparición: ~0.5% en misiones de alto rendimiento
- Cada comunidad contiene 3-5 seres pre-creados
- Temáticas: "Guardianes de Gaia", "Red de Conexiones", etc.

---

## 6. Contenido End-Game

### 6.1 Los 7 Guardianes del Viejo Paradigma

Sistema de combate tipo jefe con mecánicas estratégicas:

| Guardián | Tipo | Recompensa |
|----------|------|------------|
| Guardián del Miedo | Emocional | Transformación + título |
| Guardián de la Ignorancia | Mental | Transformación + título |
| Guardián del Ego | Espiritual | Transformación + título |
| Guardián de la Separación | Social | Transformación + título |
| Guardián del Control | Poder | Transformación + título |
| Guardián de la Escasez | Material | Transformación + título |
| Guardián del Tiempo | Temporal | Transformación + título |

### 6.2 Las 7 Instituciones del Nuevo Ser

Construcción progresiva usando fragmentos de sabiduría:

1. Centro de Sabiduría
2. Santuario de Sanación
3. Academia de Liderazgo
4. Hub de Innovación
5. Torre de Comunicación
6. Jardín de Empatía
7. Templo de Consciencia

### 6.3 Sistema de Transición/Trascendencia

Milestones interconectados:
- Quizzes completados
- Seres legendarios desbloqueados
- Guardianes transformados
- Instituciones construidas
- Regiones exploradas

**Progresión de títulos:** "Dormido" → ... → "Nuevo Ser"

### 6.4 El Nuevo Ser (Meta Final)

**Requisitos para desbloquear:**
- 5 seres legendarios
- Todos los guardianes transformados
- 100 crisis resueltas
- 10 corrupciones purificadas
- Progreso de transición completo

---

## 7. Features Sociales

### 7.1 Implementados

| Feature | Estado | Notas |
|---------|--------|-------|
| Liga/Ranking | ✅ Funcional | 20 bots simulados |
| Clanes | ⚠️ Infraestructura | No integrado |
| Crisis Real-World | ✅ Funcional | RSS feeds de noticias |

### 7.2 No Implementados

- PvP directo
- Chat/mensajería
- Trading de seres
- Misiones cooperativas
- Sistema de amigos

---

## 8. Análisis de Gaps

### 8.1 Críticos (Prioridad Alta)

| Gap | Impacto | Solución Propuesta |
|-----|---------|-------------------|
| Sin PvP real | Baja retención competitiva | Implementar batallas asíncronas |
| Social limitado | Aislamiento del jugador | Activar clanes, chat, trading |
| Mid-game difuso | Abandono 50-100hrs | Tracker de milestones visible |

### 8.2 Importantes (Prioridad Media)

| Gap | Impacto | Solución Propuesta |
|-----|---------|-------------------|
| Sin monetización | Sin ingresos | Tienda cosmética, battle pass |
| Sin eventos temporales | Contenido repetitivo | Eventos estacionales con RSS |
| Instituciones abstractas | Baja satisfacción | UI visual de construcción |

### 8.3 Menores (Prioridad Baja)

| Gap | Impacto | Solución Propuesta |
|-----|---------|-------------------|
| Lab desconectado | UX confusa | Integrar en flujo principal |
| Exploración sin tutorial | Feature ignorada | Guía de onboarding |
| Sin estados de fallo | Bajo riesgo percibido | Modos "hardship" opcionales |

---

## 9. Recomendaciones de Mejora

### 9.1 Corto Plazo (1-2 semanas)

1. **Milestone Tracker UI**
   - Mostrar "próximos 5 objetivos" en pantalla principal
   - Progress bars visuales para cada sistema

2. **Eventos con Noticias Reales**
   - Activar RealNewsCrisisService para eventos especiales
   - Recompensas exclusivas por tiempo limitado

3. **Tooltips y Onboarding**
   - Explicar sinergias en selección de equipo
   - Tutorial de exploración

### 9.2 Mediano Plazo (1-2 meses)

1. **Sistema PvP Asíncrono**
   - Batallas contra equipos de otros jugadores (defensas IA)
   - Ranking PvP separado de liga semanal

2. **Clanes Funcionales**
   - Misiones de clan cooperativas
   - Chat de clan
   - Bonus por actividad grupal

3. **Battle Pass Estacional**
   - Track gratuito + premium
   - Cosméticos exclusivos (frames, títulos)
   - Duración: 4 semanas por temporada

### 9.3 Largo Plazo (3+ meses)

1. **Trading de Seres**
   - Mercado entre jugadores
   - Sistema de ofertas

2. **Raids Cooperativos**
   - Jefes de clan que requieren múltiples jugadores
   - Recompensas compartidas

3. **Modo Historia**
   - Campaña narrativa con los libros de la colección
   - Desbloqueos progresivos de lore

---

## 10. Arquitectura Técnica

### 10.1 Servicios Principales

```
src/services/
├── MissionService.js      # Loop principal de misiones
├── EvolutionService.js    # Sistema de evolución
├── LeagueService.js       # Liga semanal
├── GuardiansService.js    # Sistema de guardianes
├── InstitutionsService.js # Construcción de instituciones
├── KnowledgeQuizService.js # Quizzes de conocimiento
├── HiddenBeingsService.js # Descubrimientos ocultos
├── ExplorationService.js  # Sistema de exploración
├── PowerNodesService.js   # Santuarios y zonas corruptas
├── CorruptionService.js   # Sistema de corrupción
├── RealNewsCrisisService.js # Crisis del mundo real
└── TransitionService.js   # Progreso de trascendencia
```

### 10.2 Estado del Juego

```
src/stores/gameStore.js (Zustand)
├── beings[]           # Colección de seres
├── pieces[]           # Fragmentos de atributos
├── communities[]      # Comunidades desbloqueadas
├── consciousness      # Moneda principal
├── energy            # Energía actual/máxima
├── level/xp          # Progresión del jugador
├── activeMissions[]  # Misiones en curso
└── dailyMissions[]   # Misiones diarias
```

### 10.3 Deuda Técnica Identificada

- Múltiples servicios de sync (SyncService, UnifiedSyncService, BidirectionalSyncService)
- Servicios construidos pero no integrados (Clans, Corruption, PowerNodes)
- Console.log residuales en archivos de integración

---

## 11. Métricas Sugeridas para Tracking

### 11.1 Retención

- **D1/D7/D30:** Retención día 1, 7, 30
- **DAU/MAU:** Usuarios activos diarios/mensuales
- **Session Length:** Duración promedio de sesión
- **Sessions/Day:** Sesiones por día por usuario

### 11.2 Engagement

- **Daily Mission Completion Rate:** % que completa las 3 diarias
- **Streak Length Distribution:** Distribución de rachas
- **Crisis Success Rate:** % éxito en misiones
- **League Participation:** % que participa en liga

### 11.3 Progresión

- **Time to Level X:** Tiempo para alcanzar niveles clave
- **Beings per Player:** Promedio de seres por jugador
- **Evolution Rate:** % seres evolucionados
- **Quiz Completion Rate:** % quizzes aprobados

### 11.4 Monetización (Futura)

- **ARPU:** Ingreso promedio por usuario
- **Conversion Rate:** % free-to-paid
- **IAP Distribution:** Distribución de compras

---

## 12. Conclusión

Awakening App tiene una base sólida de mecánicas de juego con sistemas de progresión bien diseñados y mecánicas de retención diaria efectivas. Sin embargo, para maximizar el engagement a largo plazo y preparar el juego para monetización, es crítico:

1. **Desarrollar el componente social** (PvP, clanes, trading)
2. **Clarificar objetivos mid/late-game** (milestone tracker)
3. **Implementar eventos temporales** para contenido fresco
4. **Preparar infraestructura de monetización** (battle pass, cosméticos)

El juego está bien posicionado para crecer si se abordan estas áreas prioritarias.

---

*Informe generado el 12 de Enero 2026*
