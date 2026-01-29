/**
 * Expo Config Plugin: UAE Pass
 * Combines both native module and Android queries plugins
 * 
 * This is a convenience export that applies both required plugins:
 * 1. Native module for UAE Pass app detection and launching
 * 2. Android manifest queries for Android 11+ package visibility
 */

const withUAEPassModule = require('./withUAEPassModule');
const withAndroidQueries = require('./withAndroidQueries');

/**
 * Apply both UAE Pass plugins
 * This is the recommended way to add UAE Pass support to your app
 */
function withUAEPass(config) {
  // Apply native module plugin
  config = withUAEPassModule(config);
  
  // Apply Android queries plugin
  config = withAndroidQueries(config);
  
  return config;
}

// Export individual plugins for advanced use cases
module.exports = withUAEPass;
module.exports.withUAEPassModule = withUAEPassModule;
module.exports.withAndroidQueries = withAndroidQueries;

