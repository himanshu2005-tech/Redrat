module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    'react-native-reanimated/plugin',
    ['module:react-native-dotenv', {
      moduleName: "@env",
      path: ".env",
      blocklist: null,
      allowlist: null,
      safe: false,
      allowUndefined: true,
      verbose: false
    }],
    // Add the plugins for private methods and class properties
    ['@babel/plugin-transform-private-methods', { loose: true }],
    ['@babel/plugin-transform-private-property-in-object', { loose: true }],
    ['@babel/plugin-transform-class-properties', { loose: true }]
  ],
};
