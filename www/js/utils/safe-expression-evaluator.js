/**
// 🔧 FIX v2.9.198: Migrated console.log to logger
 * SAFE EXPRESSION EVALUATOR
 * Evaluador seguro de expresiones sin usar new Function() o eval()
 * Soluciona problema de seguridad #59 y #71
 *
 * Soporta:
 * - Comparadores: >=, <=, >, <, ===, !==, ==, !=
 * - Operadores lógicos: &&, ||, !
 * - Variables numéricas y booleanas
 * - Paréntesis para agrupar
 *
 * @version 1.0.0
 */

class SafeExpressionEvaluator {
  constructor(debugMode = false) {
    this.debugMode = debugMode;
  }

  /**
   * Evalúa una expresión de forma segura
   * @param {string} expression - Expresión a evaluar (ej: "visits >= 3 && !hasUsedSearch")
   * @param {Object} context - Variables disponibles para la evaluación
   * @returns {boolean} Resultado de la evaluación
   */
  evaluate(expression, context) {
    try {
      if (typeof expression !== 'string') {
        this.log('warn', 'Expression must be a string');
        return false;
      }

      if (!context || typeof context !== 'object') {
        this.log('warn', 'Context must be an object');
        return false;
      }

      // Sanitizar expresión
      const sanitized = this.sanitizeExpression(expression);
      this.log('debug', 'Sanitized expression:', sanitized);

      // Tokenizar
      const tokens = this.tokenize(sanitized);
      this.log('debug', 'Tokens:', tokens);

      // Evaluar tokens
      const result = this.evaluateTokens(tokens, context);
      this.log('debug', 'Result:', result);

      return !!result;
    } catch (e) {
      this.log('error', 'Error evaluating expression:', e);
      return false;
    }
  }

  /**
   * Sanitiza la expresión eliminando caracteres peligrosos
   */
  sanitizeExpression(expr) {
    // Eliminar espacios extra y normalizar
    return expr.trim()
      .replace(/\s+/g, ' ')
      // Normalizar operadores compuestos
      .replace(/\s*>=\s*/g, ' >= ')
      .replace(/\s*<=\s*/g, ' <= ')
      .replace(/\s*===\s*/g, ' === ')
      .replace(/\s*!==\s*/g, ' !== ')
      .replace(/\s*==\s*/g, ' == ')
      .replace(/\s*!=\s*/g, ' != ')
      .replace(/\s*>\s*/g, ' > ')
      .replace(/\s*<\s*/g, ' < ')
      .replace(/\s*&&\s*/g, ' && ')
      .replace(/\s*\|\|\s*/g, ' || ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Tokeniza la expresión en partes manejables
   */
  tokenize(expr) {
    const tokens = [];
    let current = '';
    let i = 0;

    while (i < expr.length) {
      const char = expr[i];
      const next = expr[i + 1];
      const next2 = expr[i + 2];

      // Operadores de 3 caracteres
      if (char + next + next2 === '===') {
        if (current) tokens.push(current.trim());
        tokens.push('===');
        current = '';
        i += 3;
        continue;
      }

      if (char + next + next2 === '!==') {
        if (current) tokens.push(current.trim());
        tokens.push('!==');
        current = '';
        i += 3;
        continue;
      }

      // Operadores de 2 caracteres
      if (char + next === '>=') {
        if (current) tokens.push(current.trim());
        tokens.push('>=');
        current = '';
        i += 2;
        continue;
      }

      if (char + next === '<=') {
        if (current) tokens.push(current.trim());
        tokens.push('<=');
        current = '';
        i += 2;
        continue;
      }

      if (char + next === '==') {
        if (current) tokens.push(current.trim());
        tokens.push('==');
        current = '';
        i += 2;
        continue;
      }

      if (char + next === '!=') {
        if (current) tokens.push(current.trim());
        tokens.push('!=');
        current = '';
        i += 2;
        continue;
      }

      if (char + next === '&&') {
        if (current) tokens.push(current.trim());
        tokens.push('&&');
        current = '';
        i += 2;
        continue;
      }

      if (char + next === '||') {
        if (current) tokens.push(current.trim());
        tokens.push('||');
        current = '';
        i += 2;
        continue;
      }

      // Operadores de 1 carácter
      if (char === '>') {
        if (current) tokens.push(current.trim());
        tokens.push('>');
        current = '';
        i++;
        continue;
      }

      if (char === '<') {
        if (current) tokens.push(current.trim());
        tokens.push('<');
        current = '';
        i++;
        continue;
      }

      if (char === '!') {
        if (current) tokens.push(current.trim());
        tokens.push('!');
        current = '';
        i++;
        continue;
      }

      if (char === '(') {
        if (current) tokens.push(current.trim());
        tokens.push('(');
        current = '';
        i++;
        continue;
      }

      if (char === ')') {
        if (current) tokens.push(current.trim());
        tokens.push(')');
        current = '';
        i++;
        continue;
      }

      if (char === ' ') {
        if (current) {
          tokens.push(current.trim());
          current = '';
        }
        i++;
        continue;
      }

      // Acumular caracteres
      current += char;
      i++;
    }

    if (current) tokens.push(current.trim());

    return tokens.filter(t => t.length > 0);
  }

  /**
   * Evalúa los tokens de izquierda a derecha respetando precedencia
   */
  evaluateTokens(tokens, context) {
    // Primero resolver paréntesis
    tokens = this.resolveParentheses(tokens, context);

    // Resolver operador NOT (!)
    tokens = this.resolveNot(tokens, context);

    // Resolver comparaciones
    tokens = this.resolveComparisons(tokens, context);

    // Resolver AND (&&) antes que OR (||) - precedencia
    tokens = this.resolveAnd(tokens);

    // Resolver OR (||)
    tokens = this.resolveOr(tokens);

    // Debería quedar un solo token con el resultado
    if (tokens.length !== 1) {
      // 🔧 FIX v2.9.303: Silenciar warning, retornar false silenciosamente
      // Solo loggear en modo debug
      if (this.debugMode) {
        this.log('warn', 'Invalid expression, multiple tokens remaining:', tokens);
      }
      return false;
    }

    return this.getValue(tokens[0], context);
  }

  /**
   * Resuelve paréntesis recursivamente
   */
  resolveParentheses(tokens, context) {
    while (tokens.includes('(')) {
      const openIndex = tokens.lastIndexOf('(');
      const closeIndex = tokens.indexOf(')', openIndex);

      if (closeIndex === -1) {
        throw new Error('Unmatched parentheses');
      }

      // Extraer contenido entre paréntesis
      const innerTokens = tokens.slice(openIndex + 1, closeIndex);

      // Evaluar contenido
      const result = this.evaluateTokens(innerTokens, context);

      // Reemplazar paréntesis y contenido con resultado
      tokens = [
        ...tokens.slice(0, openIndex),
        result,
        ...tokens.slice(closeIndex + 1)
      ];
    }

    return tokens;
  }

  /**
   * Resuelve operador NOT (!)
   */
  resolveNot(tokens, context) {
    const result = [];
    let i = 0;

    while (i < tokens.length) {
      if (tokens[i] === '!') {
        const nextValue = this.getValue(tokens[i + 1], context);
        result.push(!nextValue);
        i += 2;
      } else {
        result.push(tokens[i]);
        i++;
      }
    }

    return result;
  }

  /**
   * Resuelve comparaciones (>, <, >=, <=, ===, !==, ==, !=)
   */
  resolveComparisons(tokens, context) {
    const operators = ['===', '!==', '>=', '<=', '==', '!=', '>', '<'];
    const result = [];
    let i = 0;

    while (i < tokens.length) {
      if (i + 2 < tokens.length && operators.includes(tokens[i + 1])) {
        const left = this.getValue(tokens[i], context);
        const operator = tokens[i + 1];
        const right = this.getValue(tokens[i + 2], context);

        const comparisonResult = this.compare(left, operator, right);
        result.push(comparisonResult);
        i += 3;
      } else {
        result.push(tokens[i]);
        i++;
      }
    }

    return result;
  }

  /**
   * Resuelve operador AND (&&)
   */
  resolveAnd(tokens) {
    while (tokens.includes('&&')) {
      const andIndex = tokens.indexOf('&&');
      const left = tokens[andIndex - 1];
      const right = tokens[andIndex + 1];

      const result = left && right;

      tokens = [
        ...tokens.slice(0, andIndex - 1),
        result,
        ...tokens.slice(andIndex + 2)
      ];
    }

    return tokens;
  }

  /**
   * Resuelve operador OR (||)
   */
  resolveOr(tokens) {
    while (tokens.includes('||')) {
      const orIndex = tokens.indexOf('||');
      const left = tokens[orIndex - 1];
      const right = tokens[orIndex + 1];

      const result = left || right;

      tokens = [
        ...tokens.slice(0, orIndex - 1),
        result,
        ...tokens.slice(orIndex + 2)
      ];
    }

    return tokens;
  }

  /**
   * Obtiene el valor de un token (variable, número, booleano)
   */
  getValue(token, context) {
    // Ya es un valor evaluado
    if (typeof token === 'boolean' || typeof token === 'number') {
      return token;
    }

    // Convertir string a valor
    const str = String(token);

    // Booleanos
    if (str === 'true') return true;
    if (str === 'false') return false;

    // Números
    if (/^-?\d+(\.\d+)?$/.test(str)) {
      return parseFloat(str);
    }

    // Variable del contexto
    if (context.hasOwnProperty(str)) {
      return context[str];
    }

    // 🔧 FIX v2.9.303: Silenciar warning para operadores mal parseados
    // Solo loggear si no es un operador conocido
    if (str !== '=' && str !== '==' && str !== '!') {
      this.log('warn', `Unknown variable: ${str}`);
    }
    return undefined;
  }

  /**
   * Compara dos valores con un operador
   */
  compare(left, operator, right) {
    switch (operator) {
      case '===': return left === right;
      case '!==': return left !== right;
      case '==': return left == right;
      case '!=': return left != right;
      case '>': return left > right;
      case '<': return left < right;
      case '>=': return left >= right;
      case '<=': return left <= right;
      default:
        this.log('warn', 'Unknown operator:', operator);
        return false;
    }
  }

  /**
   * Logging interno
   */
  log(level, ...args) {
    if (!this.debugMode && level === 'debug') return;

    const prefix = '[SafeExpressionEvaluator]';

    switch (level) {
      case 'debug':
        logger.debug(prefix, ...args);
        break;
      case 'warn':
        logger.warn(prefix, ...args);
        break;
      case 'error':
        logger.error(prefix, ...args);
        break;
    }
  }
}

// Exportar
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SafeExpressionEvaluator;
} else {
  window.SafeExpressionEvaluator = SafeExpressionEvaluator;
}
