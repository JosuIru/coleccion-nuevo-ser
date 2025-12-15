# Sistema de Quizzes Educativos - Colección Nuevo Ser

## Resumen Ejecutivo

Se ha generado un sistema completo de quizzes educativos para tres libros de la Colección Nuevo Ser, con estructura JSON, herramientas de generación, documentación completa y ejemplos de alta calidad.

### Estado Actual

| Libro | Archivo | Capítulos | Preguntas | Completadas | Progreso |
|-------|---------|-----------|-----------|-------------|----------|
| **La Tierra que Despierta** | `tierra-que-despierta/assets/quizzes.json` | 26 | 130 | 10 | 8% |
| **Manual de Transición** | `manual-transicion/assets/quizzes.json` | 22 | 110 | 0 | 0% |
| **Toolkit de Transición** | `toolkit-transicion/assets/quizzes.json` | 22 | 110 | 0 | 0% |
| **TOTAL** | - | **70** | **350** | **10** | **3%** |

---

## Archivos Generados

### 1. Archivos de Quizzes (JSON)

#### /www/books/tierra-que-despierta/assets/quizzes.json
- **Tamaño**: 90KB
- **Estructura completa** para 26 capítulos
- **10 preguntas completadas** de alta calidad (cap1: 5, cap2: 4, cap4: 1)
- **92 preguntas pendientes** con plantillas [PENDIENTE]

#### /www/books/manual-transicion/assets/quizzes.json
- **Tamaño**: 72KB
- **Estructura completa** para 22 capítulos
- **110 preguntas pendientes** con plantillas

#### /www/books/toolkit-transicion/assets/quizzes.json
- **Tamaño**: 70KB
- **Estructura completa** para 22 capítulos
- **110 preguntas pendientes** con plantillas

### 2. Scripts de Generación (Python)

#### generate_quizzes.py
**Propósito**: Generar estructura base de quizzes

**Funcionalidad**:
- Lee archivos `book.json` de cada libro
- Extrae capítulos y metadata
- Crea estructura JSON con plantillas [PENDIENTE]
- Genera archivo `REPORTE-CONTENIDOS-QUIZ.json`

**Uso**:
```bash
python3 generate_quizzes.py
```

#### populate_quizzes.py
**Propósito**: Rellenar quizzes con preguntas reales

**Funcionalidad**:
- Lee contenido de capítulos
- Genera preguntas basadas en conceptos clave
- Extrae citas textuales
- Actualiza archivos JSON con preguntas completadas

**Uso**:
```bash
python3 populate_quizzes.py
```

**Capítulos implementados**:
- La Tierra que Despierta: cap1, cap2, cap4

**Extensibilidad**:
Añadir más capítulos en la función `generar_preguntas_tierra_que_despierta()`

### 3. Documentación

#### GUIA-COMPLETAR-QUIZZES.md (25KB)
**Contenido**:
- Proceso detallado para completar capítulos
- Ejemplos de preguntas de alta calidad
- Criterios de calidad (comprensión vs memorización)
- Checklist de validación
- Plantillas de trabajo
- Casos especiales

**Secciones principales**:
1. Estado actual
2. Características de buenas preguntas
3. Proceso paso a paso
4. Plantilla de trabajo
5. Checklist de calidad

#### RESUMEN-GENERACION-QUIZZES.md (8KB)
**Contenido**:
- Resumen ejecutivo del proyecto
- Estadísticas generales
- Herramientas generadas
- Trabajo pendiente priorizado
- Estimación de tiempo (25-35 horas)
- Ejemplos de preguntas
- Próximos pasos

#### CHECKLIST-QUIZZES.md (7KB)
**Contenido**:
- Lista detallada de 70 capítulos
- Estado de completitud de cada uno
- Priorización (alta/media/baja)
- Criterios de completitud
- Registro de avances

#### REPORTE-CONTENIDOS-QUIZ.json (65KB)
**Contenido**:
- Extractos de los 70 capítulos
- Primeros 500 caracteres de cada uno
- Metadata (epígrafes, preguntas de cierre)
- Facilita referencia rápida

---

## Estructura de Preguntas

### Formato JSON

Cada pregunta sigue esta estructura:

```json
{
  "id": "q1",
  "question": "Pregunta clara y específica",
  "type": "multiple",
  "options": [
    "Opción A - incorrecta plausible",
    "Opción B - CORRECTA",
    "Opción C - incorrecta plausible",
    "Opción D - incorrecta plausible"
  ],
  "correct": 1,
  "explanation": "Explicación educativa de 2-4 oraciones",
  "bookQuote": "Cita textual literal del libro",
  "tags": ["concepto-clave", "comprensión"],
  "difficulty": "básico|intermedio|avanzado"
}
```

### Ejemplo Real de Pregunta Completada

```json
{
  "id": "q2",
  "question": "¿Qué significa el concepto de 'dualismo cartesiano' y cuáles son sus consecuencias ecológicas?",
  "type": "multiple",
  "options": [
    "La separación entre razón y emoción, que nos impide sentir la crisis ecológica",
    "La división entre res cogitans (mente) y res extensa (materia), que separó humano de naturaleza",
    "La distinción entre ciencia y religión que surgió en el siglo XVII",
    "La diferencia entre conocimiento teórico y práctico en la filosofía moderna"
  ],
  "correct": 1,
  "explanation": "El dualismo cartesiano estableció una división radical entre mente (exclusivamente humana) y materia (todo lo demás). Esta separación se filtró en el lenguaje, la economía, la política y nuestra psique, permitiendo tratar a la naturaleza como 'externalidad' que no necesita contabilizarse.",
  "bookQuote": "El dualismo cartesiano —mente separada de materia, humano separado de naturaleza— no se quedó en los libros de filosofía. Se filtró en cada rincón de la cultura occidental.",
  "tags": ["filosofía", "separación", "dualismo"],
  "difficulty": "avanzado"
}
```

---

## Criterios de Calidad

### 1. Comprensión vs Memorización

Las preguntas evalúan **entendimiento profundo**, no datos memorizados:

- ✅ BIEN: "¿Qué significa el concepto de dualismo cartesiano?"
- ❌ MAL: "¿En qué año nació René Descartes?"

### 2. Opciones Plausibles

Todas las opciones incorrectas son **creíbles** y relacionadas con el tema:

- Mantienen coherencia conceptual
- Mismo nivel de especificidad
- Formato gramatical consistente
- No hay opciones obviamente absurdas

### 3. Explicaciones Educativas

Cada explicación:
- Aclara **por qué** la correcta es correcta
- **Expande** el concepto, no solo repite
- **Conecta** con contexto más amplio del libro
- 2-4 oraciones de longitud

### 4. Citas Textuales Precisas

- Copiadas **literalmente** del libro
- Respetan comillas y puntuación original
- **Respaldan claramente** la respuesta correcta
- Permiten al lector verificar en el texto fuente

### 5. Metadatos Útiles

**Tags**: Permiten filtrar y categorizar
- concepto-clave, comprensión, aplicación
- filosofía, teoría, práctica
- historia, crítica, síntesis

**Difficulty**: Niveles progresivos
- **básico**: Comprensión literal del texto
- **intermedio**: Síntesis de múltiples ideas
- **avanzado**: Aplicación, análisis, evaluación

---

## Capítulos con Preguntas Completadas

### La Tierra que Despierta

#### Capítulo 1: La Gran Separación (5 preguntas)

1. **Revolución científica del siglo XVII** (intermedio)
   - Transformación de cosmos vivo a máquina muerta
   - Tags: historia, filosofía, cambio-paradigma

2. **Dualismo cartesiano** (avanzado)
   - División mente-materia y consecuencias ecológicas
   - Tags: filosofía, separación, dualismo

3. **Culturas premodernas** (intermedio)
   - Epistemología relacional vs científica
   - Tags: sabiduría-ancestral, epistemología, cosmovisión

4. **Síndrome línea base cambiante** (básico)
   - Aceptación progresiva del empobrecimiento
   - Tags: psicología, percepción, pérdida

5. **Colonización y separación** (intermedio)
   - Imposición de cosmovisión de separación
   - Tags: colonización, saberes-ancestrales, imposición-cultural

#### Capítulo 2: El Costo del Olvido (4 preguntas)

1. **Sexta extinción masiva** (básico)
   - Extinción causada por una sola especie
   - Tags: extinción, biodiversidad, crisis-ecológica

2. **Solastalgia** (intermedio)
   - Dolor por cambio del propio entorno
   - Tags: emociones, lugar, cambio-ambiental

3. **Lenguaje y separación** (avanzado)
   - Términos que cosifican la naturaleza
   - Tags: lenguaje, separación, percepción

4. **Cambio climático** (intermedio)
   - No hay "fuera": retroalimentación sistémica
   - Tags: cambio-climático, sistemas, retroalimentación

#### Capítulo 4: Ecología Profunda (1 pregunta)

1. **Ecología profunda vs superficial** (intermedio)
   - Cuestionamiento filosófico vs gestión técnica
   - Tags: ecología-profunda, paradigmas, filosofía-ambiental

---

## Priorización del Trabajo Pendiente

### ALTA PRIORIDAD (14 capítulos - ~11 horas)

Capítulos fundamentales que establecen conceptos base:

**La Tierra que Despierta** (5 capítulos):
- cap3: La Anestesia Moderna
- cap5: Gaia
- cap6: Thomas Berry
- cap7: Biomimética
- cap8: Pensamiento Relacional

**Manual de Transición** (5 capítulos):
- prologo: La paradoja de la transición
- cap1: Anatomía de transiciones históricas
- cap2: Teoría del cambio sistémico
- cap3: Mapa del ecosistema
- cap4: Fin del modelo empresarial

**Toolkit de Transición** (4 capítulos):
- toolkit-1: Inventario transiciones personales
- toolkit-2: Análisis transición histórica
- toolkit-3: Mapeo puntos apalancamiento
- toolkit-4: Mapeo ecosistema cambio

### MEDIA PRIORIDAD (30 capítulos - ~23 horas)

Capítulos de desarrollo conceptual y herramientas.

### BAJA PRIORIDAD (23 capítulos - ~17 horas)

Epílogos, capítulos de cierre y especializados.

---

## Estimación de Tiempo

### Por Pregunta
- Leer sección relevante: 3-5 min
- Identificar concepto clave: 2-3 min
- Redactar pregunta y opciones: 3-5 min
- Buscar y copiar cita: 1-2 min
- Escribir explicación: 2-3 min
- **Total por pregunta**: 10-15 min

### Por Capítulo
- 4-6 preguntas × 10-15 min = **45-60 min**
- Más lectura completa del capítulo: +15-20 min
- **Total por capítulo**: ~1 hora

### Proyecto Completo
- 67 capítulos pendientes × 1 hora = **67 horas**
- Con ritmo de 2 capítulos/sesión (2h/sesión)
- 3-4 sesiones/semana
- **Completar en 8-10 semanas**

---

## Flujo de Trabajo Sugerido

### Sesión de Trabajo (2 horas)

1. **Seleccionar capítulo** (5 min)
   - Priorizar según lista alta prioridad
   - Leer metadata en CHECKLIST-QUIZZES.md

2. **Leer capítulo completo** (15-20 min)
   - Identificar argumento central
   - Marcar 4-6 conceptos clave
   - Subrayar frases significativas

3. **Generar preguntas** (60-80 min)
   - 10-15 min por pregunta
   - Usar plantilla de GUIA-COMPLETAR-QUIZZES.md
   - Validar con checklist de calidad

4. **Revisar y guardar** (10-15 min)
   - Validar JSON correcto
   - Actualizar CHECKLIST-QUIZZES.md
   - Commit a git si aplica

### Ciclo Semanal (6-8 horas)

- 3-4 sesiones de 2 horas
- 6-8 capítulos completados
- ~30-40 preguntas generadas

---

## Integración con el Sistema

### Ubicación de Archivos

Los quizzes están en la ubicación correcta para ser consumidos por:

```
www/books/[libro-id]/assets/quizzes.json
```

### Componente JavaScript

El sistema usa `interactive-quiz.js` que:
- Carga `quizzes.json` de cada libro
- Renderiza preguntas con opciones
- Valida respuestas
- Muestra explicaciones
- Registra progreso

### Formato Compatible

El JSON generado es **directamente compatible** con:
- Sistema de quizzes interactivos existente
- Feature de progress tracking
- Sistema de achievements
- Exportación de datos

---

## Próximos Pasos

### Inmediato (Esta Semana)

1. Completar cap3 de La Tierra que Despierta
2. Validar que el proceso funciona bien
3. Ajustar scripts si es necesario

### Corto Plazo (Próximas 2 Semanas)

1. Completar 14 capítulos de alta prioridad
2. Establecer ritmo sostenible de 2 caps/sesión
3. Validar calidad cruzada entre capítulos

### Medio Plazo (Próximo Mes)

1. Completar 30 capítulos de media prioridad
2. Primera revisión de coherencia temática
3. Testing con usuarios beta

### Largo Plazo (Próximos 2 Meses)

1. Completar todos los capítulos
2. Revisión final de calidad
3. Documentar lecciones aprendidas
4. Lanzamiento oficial del sistema de quizzes

---

## Recursos Disponibles

### Archivos de Documentación
- `/GUIA-COMPLETAR-QUIZZES.md` - Proceso detallado
- `/RESUMEN-GENERACION-QUIZZES.md` - Visión general
- `/CHECKLIST-QUIZZES.md` - Tracking de progreso
- `/REPORTE-CONTENIDOS-QUIZ.json` - Extractos rápidos

### Scripts de Generación
- `/generate_quizzes.py` - Estructura base
- `/populate_quizzes.py` - Contenido real

### Archivos JSON
- `/www/books/*/book.json` - Contenido fuente
- `/www/books/*/assets/quizzes.json` - Quizzes generados

---

## Contacto y Soporte

Para dudas o problemas:

1. **Documentar en** `_notas_generacion` del capítulo
2. **Revisar** GUIA-COMPLETAR-QUIZZES.md
3. **Consultar** ejemplos completados (cap1, cap2, cap4)

---

## Changelog

### 2025-12-12 - Versión 1.0 (Inicial)

**Generado**:
- Estructura completa de 70 capítulos
- 10 preguntas de ejemplo de alta calidad
- Scripts de generación y población
- Documentación completa

**Pendiente**:
- 340 preguntas restantes
- Testing de integración
- Validación con usuarios

---

**Generado**: 2025-12-12
**Sistema**: Quiz Generator v1.0
**Estado**: Estructura completa, 3% de contenido
**Autor**: Claude Sonnet 4.5
