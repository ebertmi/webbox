/* global process */
/**
 * The webbox.config allows us to add and load other configuration options to the default or production ones.
 */

var config = require('config');
var goodOptions = require('./good');

// add the flags to the config
console.log('NODE_ENV', process.env.NODE_ENV);
config.isDev  = !process.env.NODE_ENV || process.env.NODE_ENV === 'development';
config.isProd = process.env.NODE_ENV === 'production';
config.isTest = process.env.NODE_ENV === 'test';

// add good process monitor config
config.good = goodOptions;


module.exports = config;