/**
 * Tests para Sanitizer
 * Verifica la sanitización de HTML para prevenir XSS
 */

// Cargar el módulo
const fs = require('fs');
const path = require('path');
const sanitizerCode = fs.readFileSync(
  path.join(__dirname, '../js/core/sanitizer.js'),
  'utf8'
);
eval(sanitizerCode);

describe('Sanitizer', () => {
  describe('escapeHtml', () => {
    test('escapa caracteres HTML peligrosos', () => {
      expect(Sanitizer.escapeHtml('<script>')).toBe('&lt;script&gt;');
      expect(Sanitizer.escapeHtml('&')).toBe('&amp;');
      expect(Sanitizer.escapeHtml('"')).toBe('&quot;');
      expect(Sanitizer.escapeHtml("'")).toBe('&#039;');
    });

    test('maneja valores null y undefined', () => {
      expect(Sanitizer.escapeHtml(null)).toBe('');
      expect(Sanitizer.escapeHtml(undefined)).toBe('');
    });

    test('convierte números a string', () => {
      expect(Sanitizer.escapeHtml(123)).toBe('123');
    });

    test('preserva texto normal', () => {
      expect(Sanitizer.escapeHtml('Hola mundo')).toBe('Hola mundo');
    });

    test('escapa ataques XSS comunes', () => {
      const xssAttack = '<img src=x onerror="alert(1)">';
      const escaped = Sanitizer.escapeHtml(xssAttack);
      // escapeHtml convierte < a &lt; haciendo el tag inerte
      expect(escaped).not.toContain('<img');
      expect(escaped).toContain('&lt;img');
    });
  });

  describe('sanitizeUrl', () => {
    test('permite URLs http y https', () => {
      expect(Sanitizer.sanitizeUrl('https://example.com')).toBe('https://example.com');
      expect(Sanitizer.sanitizeUrl('http://example.com')).toBe('http://example.com');
    });

    test('permite URLs relativas', () => {
      expect(Sanitizer.sanitizeUrl('/path/to/page')).toBe('/path/to/page');
      expect(Sanitizer.sanitizeUrl('./relative')).toBe('./relative');
    });

    test('bloquea URLs javascript:', () => {
      // sanitizeUrl retorna string vacío para URLs peligrosas
      expect(Sanitizer.sanitizeUrl('javascript:alert(1)')).toBe('');
    });

    test('bloquea URLs data:', () => {
      expect(Sanitizer.sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBe('');
    });

    test('maneja valores vacíos', () => {
      expect(Sanitizer.sanitizeUrl('')).toBe('');
      expect(Sanitizer.sanitizeUrl(null)).toBe('');
    });
  });

  describe('sanitizeHtml', () => {
    test('permite tags seguros', () => {
      const input = '<p>Hola <strong>mundo</strong></p>';
      const result = Sanitizer.sanitizeHtml(input);
      expect(result).toContain('<p>');
      expect(result).toContain('<strong>');
    });

    test('elimina tags peligrosos', () => {
      const input = '<script>alert(1)</script><p>Texto</p>';
      const result = Sanitizer.sanitizeHtml(input);
      expect(result).not.toContain('<script>');
      expect(result).toContain('<p>');
    });

    test('elimina atributos de eventos', () => {
      const input = '<p onclick="alert(1)">Click</p>';
      const result = Sanitizer.sanitizeHtml(input);
      expect(result).not.toContain('onclick');
    });
  });

  describe('markdownToSafeHtml', () => {
    // Nota: La implementación solo soporta bold, italic y links por diseño de seguridad

    test('convierte negrita con **', () => {
      expect(Sanitizer.markdownToSafeHtml('**negrita**')).toContain('<strong>');
    });

    test('convierte negrita con __', () => {
      expect(Sanitizer.markdownToSafeHtml('__negrita__')).toContain('<strong>');
    });

    test('convierte cursiva con *', () => {
      expect(Sanitizer.markdownToSafeHtml('*cursiva*')).toContain('<em>');
    });

    test('convierte cursiva con _', () => {
      expect(Sanitizer.markdownToSafeHtml('_cursiva_')).toContain('<em>');
    });

    test('convierte enlaces', () => {
      const result = Sanitizer.markdownToSafeHtml('[link](https://example.com)');
      expect(result).toContain('<a href');
      expect(result).toContain('target="_blank"');
      expect(result).toContain('rel="noopener noreferrer"');
    });

    test('convierte saltos de línea', () => {
      expect(Sanitizer.markdownToSafeHtml('línea1\nlínea2')).toContain('<br>');
    });

    test('sanitiza HTML inyectado en markdown', () => {
      const input = '**<script>alert(1)</script>**';
      const result = Sanitizer.markdownToSafeHtml(input);
      expect(result).not.toContain('<script>');
      expect(result).toContain('<strong>');
    });
  });
});
