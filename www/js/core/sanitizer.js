/**
// 🔧 FIX v2.9.198: Migrated console.log to logger
 * HTML SANITIZER - Funciones de sanitización para prevenir XSS
 *
 * Proporciona métodos seguros para manejar contenido HTML/texto
 * y prevenir ataques de Cross-Site Scripting (XSS).
 *
 * @version 1.0.0
 */

const Sanitizer = {
  /**
   * Escapa caracteres especiales HTML para inserción segura como texto
   * Usar cuando se necesita insertar texto puro en HTML
   *
   * @param {string} text - Texto a escapar
   * @returns {string} - Texto con caracteres HTML escapados
   *
   * @example
   * Sanitizer.escapeHtml('<script>alert("xss")</script>')
   * // Returns: '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
   */
  escapeHtml(text) {
    if (text == null) return '';
    if (typeof text !== 'string') text = String(text);

    const escapeMap = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
      '/': '&#x2F;',
      '`': '&#x60;',
      '=': '&#x3D;'
    };

    return text.replace(/[&<>"'`=/]/g, char => escapeMap[char]);
  },

  /**
   * Sanitiza HTML permitiendo solo tags y atributos seguros
   * Usar cuando se necesita preservar formato básico pero eliminar código malicioso
   *
   * @param {string} html - HTML a sanitizar
   * @param {Object} options - Opciones de sanitización
   * @param {Array} options.allowedTags - Tags permitidos (por defecto: tags básicos)
   * @param {Object} options.allowedAttributes - Atributos permitidos por tag
   * @returns {string} - HTML sanitizado
   *
   * @example
   * Sanitizer.sanitizeHtml('<p onclick="evil()">Hello <script>bad</script></p>')
   * // Returns: '<p>Hello </p>'
   */
  sanitizeHtml(html, options = {}) {
    if (html == null) return '';
    if (typeof html !== 'string') html = String(html);

    // Tags básicos permitidos por defecto
    const defaultAllowedTags = [
      'p', 'br', 'b', 'i', 'u', 'strong', 'em', 'span',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li',
      'blockquote', 'pre', 'code',
      'a', 'img',
      'div', 'section', 'article',
      'table', 'thead', 'tbody', 'tr', 'th', 'td'
    ];

    // Atributos permitidos por defecto
    const defaultAllowedAttributes = {
      'a': ['href', 'title', 'target', 'rel'],
      'img': ['src', 'alt', 'title', 'width', 'height'],
      '*': ['class', 'id'] // Atributos permitidos en todos los tags
    };

    const allowedTags = options.allowedTags || defaultAllowedTags;
    const allowedAttributes = options.allowedAttributes || defaultAllowedAttributes;

    // Crear elemento temporal para parsear HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    // Función recursiva para sanitizar nodos
    const sanitizeNode = (node) => {
      // Array para nodos a remover (no modificar durante iteración)
      const nodesToRemove = [];

      for (const child of node.childNodes) {
        if (child.nodeType === Node.TEXT_NODE) {
          // Nodos de texto son seguros
          continue;
        }

        if (child.nodeType === Node.ELEMENT_NODE) {
          const tagName = child.tagName.toLowerCase();

          // Verificar si el tag está permitido
          if (!allowedTags.includes(tagName)) {
            // Reemplazar con contenido de texto si tiene hijos
            if (child.childNodes.length > 0) {
              // Mover hijos antes de remover
              while (child.firstChild) {
                node.insertBefore(child.firstChild, child);
              }
            }
            nodesToRemove.push(child);
            continue;
          }

          // Sanitizar atributos
          const attrs = Array.from(child.attributes);
          for (const attr of attrs) {
            const attrName = attr.name.toLowerCase();

            // Verificar atributos globales
            const globalAttrs = allowedAttributes['*'] || [];
            const tagAttrs = allowedAttributes[tagName] || [];

            if (!globalAttrs.includes(attrName) && !tagAttrs.includes(attrName)) {
              child.removeAttribute(attr.name);
              continue;
            }

            // Sanitizar valores de href/src para prevenir javascript: URLs
            if (attrName === 'href' || attrName === 'src') {
              const value = attr.value.toLowerCase().trim();
              if (value.startsWith('javascript:') ||
                  value.startsWith('data:text/html') ||
                  value.startsWith('vbscript:')) {
                child.removeAttribute(attr.name);
              }
            }
          }

          // Forzar rel="noopener noreferrer" en links externos
          if (tagName === 'a' && child.hasAttribute('target')) {
            child.setAttribute('rel', 'noopener noreferrer');
          }

          // Sanitizar hijos recursivamente
          sanitizeNode(child);
        }
      }

      // Remover nodos marcados
      for (const nodeToRemove of nodesToRemove) {
        nodeToRemove.remove();
      }
    };

    sanitizeNode(tempDiv);

    return tempDiv.innerHTML;
  },

  /**
   * Sanitiza texto para uso seguro en atributos HTML
   *
   * @param {string} value - Valor del atributo
   * @returns {string} - Valor sanitizado para atributo
   */
  sanitizeAttribute(value) {
    if (value == null) return '';
    return String(value)
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  },

  /**
   * Sanitiza una URL para prevenir ataques via javascript: o data: URLs
   *
   * @param {string} url - URL a sanitizar
   * @param {Array} allowedProtocols - Protocolos permitidos
   * @returns {string} - URL sanitizada o cadena vacía si es peligrosa
   */
  sanitizeUrl(url, allowedProtocols = ['http:', 'https:', 'mailto:', 'tel:']) {
    if (url == null) return '';

    const cleanUrl = String(url).trim();

    // URLs relativas son seguras
    if (cleanUrl.startsWith('/') || cleanUrl.startsWith('./') || cleanUrl.startsWith('../')) {
      return cleanUrl;
    }

    // Verificar protocolo
    try {
      const parsed = new URL(cleanUrl, window.location.origin);
      if (allowedProtocols.includes(parsed.protocol)) {
        return cleanUrl;
      }
    } catch (e) {
      // URL malformada, verificar si es relativa
      if (!cleanUrl.includes(':')) {
        return cleanUrl;
      }
    }

    // URL peligrosa
    console.warn('[Sanitizer] URL bloqueada:', cleanUrl);
    return '';
  },

  /**
   * Crea un elemento HTML de forma segura usando plantilla
   *
   * @param {string} tagName - Nombre del tag
   * @param {Object} attributes - Atributos del elemento
   * @param {string|Array} children - Contenido o hijos del elemento
   * @returns {HTMLElement} - Elemento DOM creado de forma segura
   *
   * @example
   * Sanitizer.createElement('a', { href: url, class: 'link' }, 'Click me')
   */
  createElement(tagName, attributes = {}, children = '') {
    const element = document.createElement(tagName);

    // Establecer atributos de forma segura
    for (const [key, value] of Object.entries(attributes)) {
      if (key === 'href' || key === 'src') {
        const sanitizedUrl = this.sanitizeUrl(value);
        if (sanitizedUrl) {
          element.setAttribute(key, sanitizedUrl);
        }
      } else if (key === 'style') {
        // Estilos inline pueden ser peligrosos, usar con cuidado
        element.style.cssText = this.sanitizeStyle(value);
      } else if (key.startsWith('on')) {
        // No permitir event handlers inline
        console.warn('[Sanitizer] Event handler bloqueado:', key);
      } else {
        element.setAttribute(key, this.sanitizeAttribute(value));
      }
    }

    // Establecer contenido
    if (Array.isArray(children)) {
      for (const child of children) {
        if (child instanceof Node) {
          element.appendChild(child);
        } else {
          element.appendChild(document.createTextNode(String(child)));
        }
      }
    } else if (children instanceof Node) {
      element.appendChild(children);
    } else {
      element.textContent = String(children);
    }

    return element;
  },

  /**
   * Sanitiza estilos CSS inline
   * Bloquea propiedades potencialmente peligrosas
   *
   * @param {string} style - Estilos CSS inline
   * @returns {string} - Estilos sanitizados
   */
  sanitizeStyle(style) {
    if (style == null) return '';

    // Propiedades peligrosas
    const dangerousPatterns = [
      /expression\s*\(/gi,
      /javascript:/gi,
      /behavior\s*:/gi,
      /-moz-binding\s*:/gi,
      /url\s*\(\s*["']?\s*data:/gi
    ];

    let sanitized = String(style);

    for (const pattern of dangerousPatterns) {
      if (pattern.test(sanitized)) {
        console.warn('[Sanitizer] Estilo peligroso bloqueado:', style);
        return '';
      }
    }

    return sanitized;
  },

  /**
   * Convierte markdown básico a HTML sanitizado
   * Solo soporta negritas, cursivas y enlaces
   *
   * @param {string} markdown - Texto con formato markdown básico
   * @returns {string} - HTML sanitizado
   */
  markdownToSafeHtml(markdown) {
    if (markdown == null) return '';

    let html = this.escapeHtml(markdown);

    // Negritas **text** o __text__
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');

    // Cursivas *text* o _text_
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    html = html.replace(/_(.+?)_/g, '<em>$1</em>');

    // Enlaces [text](url)
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
      const sanitizedUrl = this.sanitizeUrl(url);
      if (sanitizedUrl) {
        return `<a href="${this.sanitizeAttribute(sanitizedUrl)}" target="_blank" rel="noopener noreferrer">${text}</a>`;
      }
      return text;
    });

    // Saltos de línea
    html = html.replace(/\n/g, '<br>');

    return html;
  },

  /**
   * Inserta contenido HTML de forma segura en un elemento
   * Wrapper para innerHTML que aplica sanitización
   *
   * @param {HTMLElement} element - Elemento destino
   * @param {string} html - HTML a insertar
   * @param {Object} options - Opciones de sanitización
   */
  setInnerHtml(element, html, options = {}) {
    if (!element) return;
    element.innerHTML = this.sanitizeHtml(html, options);
  },

  /**
   * Inserta texto de forma segura (como textContent)
   *
   * @param {HTMLElement} element - Elemento destino
   * @param {string} text - Texto a insertar
   */
  setTextContent(element, text) {
    if (!element) return;
    element.textContent = text;
  }
};

// Exponer globalmente
window.Sanitizer = Sanitizer;

// Alias para compatibilidad
window.sanitizer = Sanitizer;

logger.debug('[Sanitizer] HTML sanitizer loaded. Use Sanitizer.escapeHtml() or Sanitizer.sanitizeHtml()');
