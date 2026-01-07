const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const config = {
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
  resolver: {
    blockList: [
      /node_modules\/.*\/node_modules\/@react-native\/.*/,
      /node_modules\/@react-navigation\/elements\/lib\/commonjs\/assets\/back-icon\.png/,
    ],
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
