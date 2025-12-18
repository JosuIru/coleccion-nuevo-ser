# 🌍 MICROSOCIEDADES AUTÓNOMAS - DOCUMENTACIÓN

## ✨ RESUMEN EJECUTIVO

Sistema completo de **simulación evolutiva** de microsociedades de seres híbridos. Las sociedades evolucionan autónomamente mediante eventos aleatorios, selección natural, y algoritmos genéticos de hibridación.

---

## 📦 ARCHIVOS CREADOS/MODIFICADOS

### 1. `/www/js/features/frankenstein-microsocieties.js` (NUEVO - 508 líneas)
**Sistema de Simulación Evolutiva**
- Clase `MicroSociety`: representa una sociedad con métricas y evolución
- Clase `MicroSocietiesManager`: gestiona múltiples sociedades
- 15 tipos de eventos aleatorios (crisis, oportunidades, desafíos, amenazas, transformaciones)
- Algoritmo genético de hibridación cada 10 turnos
- Sistema de fitness para seres
- Culling de seres débiles
- Historia de métricas para gráficos

### 2. `/www/css/microsocieties.css` (NUEVO - 585 líneas)
**Estilos Completos para Dashboard**
- Tema victoriano coherente con Frankenstein Lab
- Dashboard responsive con 2 columnas
- 4 métricas animadas (Salud, Conocimiento, Acción, Cohesión)
- Gráfico de barras de evolución
- Lista de seres con fitness
- Log de eventos con códigos de color
- Controles de simulación (play/pause, velocidad)
- Scrollbars personalizados

### 3. `/www/index.html` (MODIFICADO)
**Integraciones Agregadas**:
- Link CSS: `css/microsocieties.css` (línea 52)
- Script JS: `js/features/frankenstein-microsocieties.js` (línea 330)
- Modal HTML completo (líneas 862-970)
- Script de integración y UI (líneas 1178-1417)
- Función global: `window.createMicroSocietyFromBeings()`

### 4. `/www/js/features/frankenstein-ui.js` (MODIFICADO)
**Conexión con Laboratorio Frankenstein**:
- Botón nuevo: "🌍 ¡Microsociedad!" (línea 917-919)
- Método `createMicroSociety()` (líneas 1194-1232)
- Método `createBeingVariation()` (líneas 1234-1255)
- Prompt interactivo para configurar población inicial (5-12 seres)

---

## 🎮 CÓMO FUNCIONA

### Flujo de Uso:

1. **Usuario crea un ser en el Laboratorio Frankenstein**
   - Selecciona piezas de conocimiento
   - Valida para una misión
   - Click en "🌍 ¡Microsociedad!"

2. **Configuración de Sociedad**
   - Sistema pregunta: ¿cuántos seres iniciales? (5-12)
   - Crea variaciones del ser original con mutaciones ±10%
   - Pregunta nombre de la sociedad
   - Pregunta objetivo de la sociedad

3. **Dashboard se Abre**
   - Vista completa con métricas, seres, gráfico, eventos
   - Botón "▶️ Iniciar" comienza la simulación

4. **Simulación Autónoma**
   - Cada 2 segundos (o más rápido): procesa 1 turno
   - Genera evento aleatorio
   - Seres responden según sus atributos
   - Aplica consecuencias (métricas suben/bajan)
   - Cada 10 turnos: hibridación de mejores seres
   - Elimina seres muy débiles (fitness < 20)

5. **Observación en Tiempo Real**
   - Métricas se actualizan dinámicamente
   - Gráfico muestra evolución histórica
   - Log muestra eventos recientes
   - Lista de seres ordena por fitness

---

## 🧬 MECÁNICAS EVOLUTIVAS

### 1. Sistema de Eventos

**15 Tipos de Eventos Predefinidos**:

#### Crisis (3 eventos)
- **Sequía de Recursos** 🏜️
  - Requiere: Resiliencia 40, Organización 30
  - Éxito: +10 salud, +15 cohesión
  - Fracaso: -25 salud, -15 acción

- **Conflicto Interno** ⚔️
  - Requiere: Sabiduría 35, Empatía 30, Comunicación 25
  - Éxito: +20 cohesión, +10 conocimiento
  - Fracaso: -30 cohesión, -10 salud

- **Epidemia de Desinformación** 🦠
  - Requiere: Análisis 40, Comunicación 35
  - Éxito: +15 conocimiento, +10 cohesión
  - Fracaso: -20 cohesión, -15 conocimiento

#### Oportunidades (3 eventos)
- **Alianza Estratégica** 🤝
- **Descubrimiento de Conocimiento** 📜
- **Recursos Abundantes** 🌾

#### Desafíos Internos (3 eventos)
- **Necesidad de Innovación** 💡
- **Crisis de Sentido** 🌀
- **Demanda de Acción Urgente** ⚡

#### Eventos Positivos (2 eventos)
- **Celebración Comunitaria** 🎉
- **Nuevo Miembro Inspirado** ✨

#### Amenazas Externas (2 eventos)
- **Presión del Sistema Dominante** 🏛️
- **Cooptación de Ideas** 🎭

#### Transformaciones (2 eventos)
- **Momento de Inflexión** 🌟
- **Regeneración Profunda** 🌱

### 2. Evaluación de Respuestas

```javascript
// La sociedad agrega atributos de todos los seres vivos
societyAttributes[attr] = aliveBeings.reduce((sum, being) => {
  return sum + (being.attributes[attr] || 0);
}, 0);

// Calcula éxito comparando atributos totales vs requeridos
const successRate = totalScore / requiredScore;
const success = successRate >= 0.7; // Necesita 70% para éxito
```

### 3. Sistema de Fitness

- **Fitness inicial**: 50 para todos
- **Al contribuir exitosamente**: +5 fitness
- **Al fallar evento**: -2 fitness para todos
- **Seres con fitness < 20**: eliminados automáticamente
- **Máximo fitness**: 100

### 4. Algoritmo Genético (Hibridación)

**Cada 10 turnos**:
1. Ordena seres por fitness
2. Toma los 2 mejores como padres
3. Crea hijo híbrido:
   - Nombre: combina nombres de ambos padres
   - Atributos: promedio de padres ± mutación 5%
   - Piezas: mitad de cada padre
   - Poder: promedio de padres
   - Fitness inicial: 50
   - Generación: max(gen_padre1, gen_padre2) + 1

```javascript
childAttributes[attr] = (parent1[attr] + parent2[attr]) / 2 + mutation;
```

### 5. Culling (Eliminación)

- Solo si población > 5 seres
- Elimina seres con fitness < 20
- Marca `being.alive = false` (no se elimina del array)
- Log evento: "💀 {nombre} se ha desvanecido"

---

## 📊 MÉTRICAS DE SOCIEDAD

### 1. 🌱 Salud (0-100)
- **Inicial**: 100
- **Representa**: Vitalidad, recursos disponibles, bienestar general
- **Crítico si**: < 30
- **Game Over si**: ≤ 0

### 2. 💡 Conocimiento (0-100)
- **Inicial**: 50
- **Representa**: Sabiduría acumulada, aprendizaje colectivo
- **Crítico si**: < 20

### 3. ⚡ Acción (0-100)
- **Inicial**: 50
- **Representa**: Capacidad de movilización, impacto práctico
- **Crítico si**: < 20

### 4. 🤝 Cohesión (0-100)
- **Inicial**: 75
- **Representa**: Unidad, confianza, colaboración interna
- **Crítico si**: < 30

---

## 🎛️ CONTROLES DE SIMULACIÓN

### Botones:

**▶️ Iniciar / ⏸️ Pausar**
- Inicia/pausa el loop de turnos
- Cambio visual del botón (clase `.playing`)

### Velocidades Disponibles:

- **1x**: 1 turno cada 2 segundos (velocidad base)
- **2x**: 1 turno cada 1 segundo
- **5x**: 1 turno cada 0.4 segundos
- **10x**: 1 turno cada 0.2 segundos (muy rápido)

### Estados:

- **running**: true/false
- **turn**: número actual del turno
- **population**: seres vivos actualmente
- **avgFitness**: fitness promedio de seres vivos

---

## 🖥️ INTERFAZ DE USUARIO

### Layout Principal (Grid 2 Columnas):

```
┌─────────────────────────────┬─────────────────┐
│  PANEL IZQUIERDO            │ PANEL DERECHO   │
│                             │                 │
│  [Métricas Grid 2x2]        │ [Seres Activos] │
│  • Salud     • Conocimiento │ - Ser 1 (95)    │
│  • Acción    • Cohesión     │ - Ser 2 (88)    │
│                             │ - Ser 3 (76)    │
│  [Gráfico de Evolución]     │ ...             │
│   ┌─┬─┬─┬─┬─┬─┬─┬─┬─┬─┐    │                 │
│   │█│█│█│█│█│█│█│█│█│█│    │ [Log Eventos]   │
│   └─┴─┴─┴─┴─┴─┴─┴─┴─┴─┘    │ T47: Crisis...  │
│                             │ T46: Hibridación│
└─────────────────────────────┴─────────────────┘
```

### Colores de Eventos:

- **success** (verde): Evento resuelto exitosamente
- **failure** (rojo): Evento fracasado
- **warning** (naranja): Advertencia
- **critical** (rojo intenso): Evento crítico (colapso, etc.)
- **info** (dorado): Información general (hibridaciones, etc.)

---

## 🔧 API / INTEGRACIÓN

### Crear Sociedad:

```javascript
// Desde JavaScript
const beings = [being1, being2, being3];
window.createMicroSocietyFromBeings(beings);
```

### Desde Frankenstein Lab:

```javascript
// En frankenstein-ui.js
this.createMicroSociety(); // Método del UI

// Flujo:
1. Verifica currentBeing existe
2. Pregunta cantidad (5-12)
3. Crea variaciones con mutaciones ±10%
4. Llama createMicroSocietyFromBeings(beings)
```

### Acceder a Sociedad Actual:

```javascript
const manager = window.microSocietiesManager;
const current = manager.getCurrentSociety();
const state = current.getState();

console.log(state);
// {
//   name, goal, turn, running, speed,
//   metrics: {health, knowledge, action, cohesion},
//   metricsHistory: [{turn, health, ...}, ...],
//   eventLog: [{turn, message, type}, ...],
//   beings: [{name, fitness, generation, totalPower}, ...],
//   population, totalPopulation, avgFitness
// }
```

### Controlar Simulación:

```javascript
const society = manager.getCurrentSociety();

society.start();           // Iniciar
society.pause();           // Pausar
society.setSpeed(5);       // Cambiar velocidad a 5x
society.processTurn();     // Procesar 1 turno manualmente
```

---

## 📈 EJEMPLO DE EVOLUCIÓN

### Turno 0:
- Población: 7 seres (1 original + 6 variaciones)
- Salud: 100, Conocimiento: 50, Acción: 50, Cohesión: 75
- Fitness promedio: 50

### Turno 10:
- Evento: "Alianza Estratégica" → Éxito
- Salud: 100, Conocimiento: 65, Acción: 70, Cohesión: 85
- **Hibridación**: Nace "Guardián Empático" (gen 2)
- Población: 8 seres

### Turno 23:
- Evento: "Sequía de Recursos" → Fracaso
- Salud: 75, Conocimiento: 65, Acción: 55, Cohesión: 70
- Ser "Pensador Débil" eliminado (fitness 18)
- Población: 7 seres

### Turno 40:
- Evento: "Momento de Inflexión" → Éxito
- Salud: 90, Conocimiento: 95, Acción: 75, Cohesión: 95
- **Hibridación x2** (turnos 30, 40)
- Población: 9 seres (3 de gen 3)
- Fitness promedio: 72

### Turno 100:
- Población: 11 seres (4 generaciones diferentes)
- Salud: 85, Conocimiento: 88, Acción: 82, Cohesión: 91
- Fitness promedio: 68
- Mejor ser: "Estratega Regenerativo" (gen 4, fitness 96)

---

## 🎯 POSIBLES GAME OVER

1. **Salud ≤ 0**: Colapso total de la sociedad
2. **Población = 0**: Todos los seres eliminados
3. **Ambos casos**: Simulación se pausa automáticamente y muestra "💀 La sociedad ha colapsado"

---

## 🔮 FUTURAS MEJORAS SUGERIDAS

1. **Guardado de Sociedades**: Serializar estado a JSON y guardar en localStorage
2. **Exportar Historia**: Descargar CSV con todos los turnos y eventos
3. **Gráfico Multi-Métrica**: Mostrar las 4 métricas superpuestas
4. **Predicciones IA**: Usar modelo de IA para predecir evolución futura
5. **Comparador de Sociedades**: Ver evolución de 2 sociedades lado a lado
6. **Eventos Personalizados**: Permitir al usuario crear eventos custom
7. **Modo "Intervención Divina"**: Usuario puede "bendecir" seres o enviar recursos
8. **Árboles Genealógicos**: Visualizar las generaciones en un árbol
9. **Leaderboard**: Mejores sociedades por salud final, turnos sobrevividos, etc.
10. **Integración con Chat IA**: Eventos narrativos generados por IA según contexto

---

## 🐛 TROUBLESHOOTING

### La simulación no inicia:
- Verificar que `window.MicroSocietiesManager` existe
- Abrir consola y buscar: "🌍 MicroSocieties Manager inicializado"

### No aparece el botón de Microsociedad:
- Verificar que el ser sea **viable** para la misión
- El botón solo aparece si `results.viable === true`

### Seres no hibridan:
- Hibridación ocurre cada 10 turnos (10, 20, 30, 40...)
- Necesita al menos 2 seres vivos
- Revisa el log de eventos para confirmar

### Métricas no se actualizan:
- Abrir consola, buscar errores JavaScript
- Verificar que el modal esté abierto (clase `.active`)
- El loop de UI se ejecuta cada 100ms

---

## ✅ CHECKLIST DE TESTING

- [x] Sistema de eventos genera correctamente
- [x] Métricas suben/bajan según eventos
- [x] Hibridación cada 10 turnos funciona
- [x] Culling elimina seres débiles
- [x] UI se actualiza en tiempo real
- [x] Controles play/pause/velocidad funcionan
- [x] Gráfico muestra evolución histórica
- [x] Log de eventos tiene colores correctos
- [x] Game Over pausa simulación
- [x] Modal se cierra correctamente
- [x] Botón en Lab Frankenstein aparece
- [x] Variaciones de seres tienen mutaciones
- [ ] Testing en diferentes navegadores

---

¡El sistema de Microsociedades Autónomas está listo para evolucionar! 🌍🧬⚡
