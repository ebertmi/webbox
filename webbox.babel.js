/**
 * Main entry point for starting the server. The babel register plugin
 * automatically transforms import statements to node's require function
 * calls.
 */
require("babel-register");
require('babel-polyfill');
require('./webbox.js');