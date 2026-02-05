/**
 * Global test setup - Mocks for browser environment
 *
 * Provides mocks for window globals, localStorage, logger,
 * fetch, observers, and other browser APIs used throughout the project.
 */

// ---------------------------------------------------------------------------
// localStorage mock (Map-based)
// ---------------------------------------------------------------------------
const localStorageStore = new Map();

const localStorageMock = {
  getItem: jest.fn((key) => {
    return localStorageStore.has(key) ? localStorageStore.get(key) : null;
  }),
  setItem: jest.fn((key, value) => {
    localStorageStore.set(key, String(value));
  }),
  removeItem: jest.fn((key) => {
    localStorageStore.delete(key);
  }),
  clear: jest.fn(() => {
    localStorageStore.clear();
  }),
  get length() {
    return localStorageStore.size;
  },
  key: jest.fn((index) => {
    const keys = Array.from(localStorageStore.keys());
    return keys[index] !== undefined ? keys[index] : null;
  })
};

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// ---------------------------------------------------------------------------
// sessionStorage mock (reuse pattern)
// ---------------------------------------------------------------------------
const sessionStorageStore = new Map();

const sessionStorageMock = {
  getItem: jest.fn((key) => sessionStorageStore.has(key) ? sessionStorageStore.get(key) : null),
  setItem: jest.fn((key, value) => sessionStorageStore.set(key, String(value))),
  removeItem: jest.fn((key) => sessionStorageStore.delete(key)),
  clear: jest.fn(() => sessionStorageStore.clear()),
  get length() { return sessionStorageStore.size; },
  key: jest.fn((index) => {
    const keys = Array.from(sessionStorageStore.keys());
    return keys[index] !== undefined ? keys[index] : null;
  })
};

Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock });

// ---------------------------------------------------------------------------
// Logger mock
// ---------------------------------------------------------------------------
const loggerMock = {
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  group: jest.fn(),
  groupEnd: jest.fn(),
  table: jest.fn(),
  getStatus: jest.fn(() => ({ level: 'debug', enabled: true }))
};

// Expose as both window.logger and global logger
window.logger = loggerMock;
global.logger = loggerMock;

// ---------------------------------------------------------------------------
// fetch mock
// ---------------------------------------------------------------------------
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve('')
  })
);

// ---------------------------------------------------------------------------
// window.supabaseConfig placeholder
// ---------------------------------------------------------------------------
window.supabaseConfig = {
  url: 'https://placeholder.supabase.co',
  anonKey: 'placeholder-anon-key',
  auth: {
    autoRefreshToken: true,
    persistSession: true
  }
};

// ---------------------------------------------------------------------------
// window.bookEngine placeholder
// ---------------------------------------------------------------------------
window.bookEngine = null;

// ---------------------------------------------------------------------------
// window.eventBus mock
// ---------------------------------------------------------------------------
window.eventBus = {
  emit: jest.fn(),
  on: jest.fn(),
  off: jest.fn()
};

// ---------------------------------------------------------------------------
// window.toast mock
// ---------------------------------------------------------------------------
window.toast = {
  success: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  warning: jest.fn()
};

// ---------------------------------------------------------------------------
// ResizeObserver mock
// ---------------------------------------------------------------------------
class ResizeObserverMock {
  constructor(callback) {
    this.callback = callback;
    this.observations = [];
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver = ResizeObserverMock;

// ---------------------------------------------------------------------------
// IntersectionObserver mock
// ---------------------------------------------------------------------------
class IntersectionObserverMock {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.IntersectionObserver = IntersectionObserverMock;

// ---------------------------------------------------------------------------
// MutationObserver mock
// ---------------------------------------------------------------------------
class MutationObserverMock {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {}
  disconnect() {}
  takeRecords() { return []; }
}
window.MutationObserver = MutationObserverMock;

// ---------------------------------------------------------------------------
// window.matchMedia mock
// ---------------------------------------------------------------------------
window.matchMedia = jest.fn().mockImplementation((query) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: jest.fn(),
  removeListener: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn()
}));

// ---------------------------------------------------------------------------
// SpeechSynthesis mocks (needed for TTS tests)
// ---------------------------------------------------------------------------
const speechSynthesisMock = {
  speak: jest.fn(),
  cancel: jest.fn(),
  pause: jest.fn(),
  resume: jest.fn(),
  getVoices: jest.fn(() => []),
  speaking: false,
  paused: false,
  pending: false,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
};
window.speechSynthesis = speechSynthesisMock;

window.SpeechSynthesisUtterance = jest.fn().mockImplementation((text) => ({
  text,
  voice: null,
  rate: 1,
  pitch: 1,
  volume: 1,
  lang: 'es-ES',
  onstart: null,
  onend: null,
  onerror: null,
  onboundary: null
}));

// ---------------------------------------------------------------------------
// history mock
// ---------------------------------------------------------------------------
if (!window.history.pushState) {
  window.history.pushState = jest.fn();
}

// ---------------------------------------------------------------------------
// Cleanup between tests
// ---------------------------------------------------------------------------
afterEach(() => {
  jest.clearAllMocks();
  localStorageStore.clear();
  sessionStorageStore.clear();
});
