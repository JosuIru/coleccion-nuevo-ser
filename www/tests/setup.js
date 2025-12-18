/**
 * Jest Test Setup
 * Configura el entorno de testing para los módulos del proyecto
 */

// Mock de APIs del navegador no disponibles en jsdom
global.localStorage = {
  store: {},
  getItem: function(key) {
    return this.store[key] || null;
  },
  setItem: function(key, value) {
    this.store[key] = value;
  },
  removeItem: function(key) {
    delete this.store[key];
  },
  clear: function() {
    this.store = {};
  }
};

// Mock de console para tests silenciosos
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  debug: jest.fn()
};

// Mock de window.location
delete window.location;
window.location = {
  hostname: 'localhost',
  href: 'http://localhost:8000',
  search: '',
  pathname: '/'
};

// Mock de matchMedia para prefers-reduced-motion
window.matchMedia = jest.fn().mockImplementation(query => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: jest.fn(),
  removeListener: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn()
}));

// Limpiar mocks después de cada test
afterEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
});
