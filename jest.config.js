/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/www/tests'],
  testMatch: ['**/*.test.js'],
  moduleFileExtensions: ['js'],
  collectCoverageFrom: [
    'www/js/core/**/*.js',
    '!www/js/core/vendor/**',
    '!**/*.min.js'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  verbose: true,
  setupFilesAfterEnv: ['<rootDir>/www/tests/setup.js']
};
