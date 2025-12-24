// ============================================================================
// RESOURCE AI HELPER - Resúmenes y análisis IA de recursos
// ============================================================================
// Genera resúmenes automáticos y recomendaciones inteligentes de recursos

class ResourceAIHelper {
  constructor() {
    this.summariesCache = new Map(); // Cache de resúmenes generados
    this.isGenerating = false;
    this.aiAdapter = window.aiAdapter;
  }

  // ==========================================================================
  // RESÚMENES AUTOMÁTICOS
  // ==========================================================================

  /**
   * Genera un resumen de un recurso externo (libro, paper, documental)
   * @param {Object} resource - Recurso a resumir {title, description, url, type}
   * @returns {Promise<Object>} - Resumen con campos: summary, relevance, difficulty, time
   */
  async generateResourceSummary(resource) {
    const cacheKey = `${resource.type}-${resource.title}`;

    // Verificar cache
    if (this.summariesCache.has(cacheKey)) {
      return this.summariesCache.get(cacheKey);
    }

    if (!this.aiAdapter) {
      return this.getFallbackSummary(resource);
    }

    try {
      const prompt = `Analiza este recurso y proporciona:

**Recurso:**
- Tipo: ${resource.type}
- Título: ${resource.title}
- Descripción: ${resource.description || 'No disponible'}
${resource.author ? `- Autor: ${resource.author}` : ''}

**Proporciona:**
1. **Resumen** (2-3 frases): ¿De qué trata? ¿Qué aporta?
2. **Relevancia** (1 frase): ¿Para quién es útil? ¿En qué contexto?
3. **Dificultad**: principiante, intermedio o avanzado
4. **Tiempo estimado**: cuánto tiempo toma consumir este recurso

**Responde SOLO en JSON:**
{
  "summary": "string",
  "relevance": "string",
  "difficulty": "principiante|intermedio|avanzado",
  "estimatedTime": "string"
}`;

      const response = await this.aiAdapter.chat([
        { role: 'user', content: prompt }
      ]);

      const summary = this.parseJSONResponse(response);

      // Guardar en cache
      this.summariesCache.set(cacheKey, summary);

      return summary;
    } catch (error) {
      console.error('Error generando resumen IA:', error);
      return this.getFallbackSummary(resource);
    }
  }

  /**
   * Genera recomendaciones personalizadas de recursos según perfil del usuario
   */
  async generateRecommendations(resources, userContext) {
    if (!this.aiAdapter) return resources.slice(0, 5);

    try {
      const resourcesList = resources.map(r => `- ${r.title} (${r.type})`).join('\n');

      const prompt = `Dado el contexto del usuario y esta lista de recursos, recomienda los 5 más relevantes en orden de prioridad.

**Contexto del usuario:**
${userContext.currentBook ? `- Leyendo: ${userContext.currentBook}` : ''}
${userContext.interests ? `- Intereses: ${userContext.interests.join(', ')}` : ''}
${userContext.level ? `- Nivel: ${userContext.level}` : ''}

**Recursos disponibles:**
${resourcesList}

**Responde SOLO en JSON:**
{
  "recommendations": [
    {
      "title": "string",
      "reason": "string (por qué es relevante para este usuario)"
    }
  ]
}`;

      const response = await this.aiAdapter.chat([
        { role: 'user', content: prompt }
      ]);

      const recommendations = this.parseJSONResponse(response);

      // Mapear recomendaciones a recursos completos
      return recommendations.recommendations.map(rec => {
        const resource = resources.find(r => r.title === rec.title);
        return { ...resource, aiReason: rec.reason };
      }).filter(r => r.title); // Filtrar nulls

    } catch (error) {
      console.error('Error generando recomendaciones:', error);
      return resources.slice(0, 5);
    }
  }

  /**
   * Explica la relación entre un recurso y el contenido del libro
   */
  async explainResourceConnection(resource, bookId, chapterId) {
    if (!this.aiAdapter) {
      return `Este recurso complementa los temas tratados en el capítulo.`;
    }

    try {
      const prompt = `Explica brevemente (1-2 frases) cómo este recurso se conecta con el libro "${bookId}" ${chapterId ? `en el capítulo ${chapterId}` : ''}.

**Recurso:** ${resource.title} - ${resource.description}

**Responde de forma concisa y clara:`;

      const response = await this.aiAdapter.chat([
        { role: 'user', content: prompt }
      ]);

      return response.trim();
    } catch (error) {
      console.error('Error explicando conexión:', error);
      return `Este recurso complementa los temas del libro.`;
    }
  }

  /**
   * Genera un learning path basado en un objetivo del usuario
   */
  async generateLearningPath(goal, availableResources, bookId) {
    if (!this.aiAdapter) {
      return this.getFallbackLearningPath(goal, availableResources);
    }

    try {
      const resourcesList = availableResources.map(r =>
        `- ${r.title} (${r.type}): ${r.description || ''}`
      ).join('\n');

      const prompt = `Crea un learning path personalizado para lograr este objetivo usando los recursos disponibles.

**Objetivo del usuario:** ${goal}

**Libro actual:** ${bookId}

**Recursos disponibles:**
${resourcesList}

**Crea un plan estructurado en 4-6 pasos, cada uno con:**
1. Qué hacer
2. Qué recursos usar
3. Cuánto tiempo tomará
4. Cómo sabrás que completaste este paso

**Responde SOLO en JSON:**
{
  "goal": "${goal}",
  "estimatedTime": "string (tiempo total)",
  "difficulty": "principiante|intermedio|avanzado",
  "steps": [
    {
      "week": number,
      "title": "string",
      "description": "string",
      "resources": ["string"],
      "action": "string (tarea concreta)",
      "completionCriteria": "string"
    }
  ]
}`;

      const response = await this.aiAdapter.chat([
        { role: 'user', content: prompt }
      ]);

      return this.parseJSONResponse(response);
    } catch (error) {
      console.error('Error generando learning path:', error);
      return this.getFallbackLearningPath(goal, availableResources);
    }
  }

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  parseJSONResponse(response) {
    try {
      // Intentar extraer JSON si viene envuelto en markdown
      const jsonMatch = response.match(/```json\n?([\s\S]*?)\n?```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }

      // Intentar parsear directamente
      return JSON.parse(response);
    } catch (error) {
      console.error('Error parseando JSON:', error);
      return null;
    }
  }

  getFallbackSummary(resource) {
    return {
      summary: resource.description || `${resource.type} sobre ${resource.title}`,
      relevance: 'Recurso complementario para profundizar en los temas del libro',
      difficulty: 'intermedio',
      estimatedTime: this.estimateTime(resource.type)
    };
  }

  estimateTime(type) {
    const times = {
      'book': '10-20 horas',
      'paper': '1-2 horas',
      'documentary': '1-2 horas',
      'podcast': '30-60 min',
      'article': '15-30 min',
      'tool': '30 min - 2 horas',
      'course': '5-10 horas',
      'organization': '15 min (exploración)'
    };
    return times[type] || '1-2 horas';
  }

  getFallbackLearningPath(goal, resources) {
    // Learning path básico sin IA
    return {
      goal: goal,
      estimatedTime: '4-6 semanas',
      difficulty: 'intermedio',
      steps: [
        {
          week: 1,
          title: 'Fundamentos',
          description: 'Familiarízate con los conceptos básicos',
          resources: resources.slice(0, 2).map(r => r.title),
          action: 'Lee los primeros 2 recursos para entender el contexto',
          completionCriteria: 'Puedes explicar los conceptos básicos con tus propias palabras'
        },
        {
          week: 2,
          title: 'Profundización',
          description: 'Explora el tema en mayor detalle',
          resources: resources.slice(2, 4).map(r => r.title),
          action: 'Estudia recursos más avanzados y toma notas',
          completionCriteria: 'Has tomado notas detalladas y puedes relacionar conceptos'
        },
        {
          week: 3,
          title: 'Práctica',
          description: 'Aplica lo aprendido',
          resources: resources.slice(4, 6).map(r => r.title),
          action: 'Realiza ejercicios prácticos y experimenta',
          completionCriteria: 'Has completado al menos un ejercicio práctico'
        },
        {
          week: 4,
          title: 'Integración',
          description: 'Conecta con tu objetivo original',
          resources: [],
          action: 'Reflexiona sobre cómo aplicar esto a tu objetivo',
          completionCriteria: 'Tienes un plan concreto de acción'
        }
      ]
    };
  }

  // ==========================================================================
  // TRACKING
  // ==========================================================================

  trackResourceViewed(resourceTitle) {
    const key = 'resources-viewed';
    const viewed = JSON.parse(localStorage.getItem(key) || '[]');

    if (!viewed.includes(resourceTitle)) {
      viewed.push(resourceTitle);
      localStorage.setItem(key, JSON.stringify(viewed));
    }
  }

  getViewedResources() {
    return JSON.parse(localStorage.getItem('resources-viewed') || '[]');
  }

  getResourceStats() {
    const viewed = this.getViewedResources();
    return {
      totalViewed: viewed.length,
      lastViewed: viewed[viewed.length - 1] || null
    };
  }
}

// ==========================================================================
// EXPORTAR
// ==========================================================================

window.ResourceAIHelper = ResourceAIHelper;
window.resourceAIHelper = new ResourceAIHelper();
