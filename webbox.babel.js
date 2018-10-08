/**
 * Main entry point for starting the server. The babel register plugin
 * automatically transforms import statements to node's require function
 * calls.
 */
require('@babel/polyfill');

require('@babel/register')({
  presets: [
    ['@babel/preset-env', {
      modules: 'commonjs',
      'targets': {
        'node': 'current'
      }
    }], '@babel/preset-react'
  ],
  plugins: [
    '@babel/plugin-transform-runtime',
    '@babel/plugin-proposal-object-rest-spread',
    // Stage 2
    ['@babel/plugin-proposal-decorators', {
      'legacy': true
    }],
    '@babel/plugin-proposal-export-namespace-from',
    '@babel/plugin-proposal-throw-expressions',
    // Stage 3
    '@babel/plugin-syntax-dynamic-import',
    '@babel/plugin-syntax-import-meta',
    ['@babel/plugin-proposal-class-properties', {
      'loose': false
    }],
    '@babel/plugin-proposal-json-strings'
  ]
});

//require('@babel/polyfill');
const webbox = require('./webbox.js');

// Server start
async function bootstrap() {
  if (!module.parent) {
    await webbox.provision(true);
  } else {
    console.info('no provisioning');
  }
}
bootstrap();


module.exports = webbox;