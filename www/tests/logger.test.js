/**
 * Tests para Logger
 * Verifica el sistema de logging condicional
 */

const fs = require('fs');
const path = require('path');
const loggerCode = fs.readFileSync(
  path.join(__dirname, '../js/core/logger.js'),
  'utf8'
);

describe('Logger', () => {
  let originalConsole;

  beforeEach(() => {
    // Guardar console original
    originalConsole = { ...console };
    // Resetear window.logger
    delete window.logger;
  });

  afterEach(() => {
    // Restaurar console
    Object.assign(console, originalConsole);
  });

  describe('en desarrollo (localhost)', () => {
    beforeEach(() => {
      window.location = { hostname: 'localhost', search: '' };
      eval(loggerCode);
    });

    test('isDev es true en localhost', () => {
      expect(window.logger.isDev).toBe(true);
    });

    test('log() llama a console.log', () => {
      const spy = jest.spyOn(console, 'log').mockImplementation();
      window.logger.log('test message');
      expect(spy).toHaveBeenCalledWith('[LOG]', 'test message');
    });

    test('warn() llama a console.warn', () => {
      const spy = jest.spyOn(console, 'warn').mockImplementation();
      window.logger.warn('warning');
      expect(spy).toHaveBeenCalledWith('[WARN]', 'warning');
    });

    test('error() siempre llama a console.error', () => {
      const spy = jest.spyOn(console, 'error').mockImplementation();
      window.logger.error('error');
      expect(spy).toHaveBeenCalledWith('[ERROR]', 'error');
    });
  });

  describe('en producción', () => {
    beforeEach(() => {
      window.location = { hostname: 'example.com', search: '' };
      eval(loggerCode);
    });

    test('isDev es false en producción', () => {
      expect(window.logger.isDev).toBe(false);
    });

    test('log() no hace nada en producción', () => {
      const spy = jest.spyOn(console, 'log').mockImplementation();
      window.logger.log('test');
      expect(spy).not.toHaveBeenCalled();
    });

    test('error() sigue funcionando en producción', () => {
      const spy = jest.spyOn(console, 'error').mockImplementation();
      window.logger.error('critical error');
      expect(spy).toHaveBeenCalledWith('[ERROR]', 'critical error');
    });
  });

  describe('con parámetro debug=true', () => {
    beforeEach(() => {
      window.location = { hostname: 'example.com', search: '?debug=true' };
      eval(loggerCode);
    });

    test('isDev es true con debug=true', () => {
      expect(window.logger.isDev).toBe(true);
    });
  });

  describe('getStatus()', () => {
    test('retorna estado correcto', () => {
      window.location = { hostname: 'localhost', search: '' };
      eval(loggerCode);

      const status = window.logger.getStatus();
      expect(status).toHaveProperty('mode');
      expect(status).toHaveProperty('logsEnabled');
      expect(status.mode).toBe('development');
      expect(status.logsEnabled).toBe(true);
    });
  });
});
