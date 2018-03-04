/**
 * Main entry point for starting the server. The babel register plugin
 * automatically transforms import statements to node's require function
 * calls.
 */
require('babel-register')({
  'presets': ['es2015', 'react'],
  'plugins': ['transform-object-rest-spread']
});

require('babel-polyfill');
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