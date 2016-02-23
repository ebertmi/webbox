/**
 * The webbox.config allows us to add and load other configuration options to the default or production ones.
 */

var config = require('config');
var goodConfig = require('./good');

// add the flags to the config
config.isDev  = !process.env.NODE_ENV || process.env.NODE_ENV === 'development';
config.isProd = process.env.NODE_ENV === 'production';
config.isTest = process.env.NODE_ENV === 'test';

// add good process monitor config
config.good = goodConfig;


module.exports = config;