/**
 * JEST CONFIGURATION
 * Configuración para tests unitarios y de integración
 */

module.exports = {
  preset: 'react-native',

  // Setup
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],

  // Transform
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|zustand|@react-native-async-storage|react-native-geolocation-service|@react-native-community)/)'
  ],

  // Module mapping
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },

  // Coverage
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/**/*.test.{js,jsx}',
    '!src/vendor/**',
    '!src/**/__tests__/**'
  ],

  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },

  coverageDirectory: 'coverage',

  coverageReporters: ['text', 'lcov', 'html'],

  // Test environment
  testEnvironment: 'node',

  // Paths to ignore
  testPathIgnorePatterns: [
    '/node_modules/',
    '/e2e/'
  ],

  // Verbose output
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,

  // Restore mocks between tests
  restoreMocks: true
};
