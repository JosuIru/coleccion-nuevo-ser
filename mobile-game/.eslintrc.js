module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es2021: true,
    'react-native/react-native': true
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'prettier'
  ],
  plugins: [
    'react',
    'react-native',
    'react-hooks'
  ],
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    }
  },
  settings: {
    react: {
      version: 'detect'
    }
  },
  rules: {
    // Errores críticos
    'no-console': ['warn', { allow: ['warn', 'error', 'log'] }],
    'no-debugger': 'error',
    'no-unused-vars': ['warn', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_'
    }],
    'no-undef': 'error',

    // Best practices
    'eqeqeq': ['error', 'always'],
    'no-var': 'error',
    'prefer-const': 'warn',
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-return-await': 'warn',
    'require-await': 'warn',

    // React
    'react/prop-types': 'off', // Usar TypeScript en el futuro
    'react/react-in-jsx-scope': 'off', // No necesario en React 17+
    'react/display-name': 'off',
    'react/no-unescaped-entities': 'warn',

    // React Hooks
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',

    // React Native
    'react-native/no-unused-styles': 'warn',
    'react-native/no-inline-styles': 'off',
    'react-native/no-color-literals': 'off',

    // Estilo de código
    'quotes': ['warn', 'single', { avoidEscape: true }],
    'semi': ['warn', 'always'],
    'comma-dangle': ['warn', 'never'],
    'no-trailing-spaces': 'warn',
    'object-curly-spacing': ['warn', 'always'],
    'array-bracket-spacing': ['warn', 'never'],

    // Seguridad
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-script-url': 'error'
  },
  overrides: [
    {
      files: ['*.js', '*.jsx'],
      rules: {
        // Reglas específicas para archivos JS/JSX
      }
    }
  ]
};
