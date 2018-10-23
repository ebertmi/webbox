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

// now override some configuration parameter if available as env params
const DATABASE_KEYS = [{
  envKey: 'DATABASE_HOST',
  configKey: 'host'
},{
  envKey: 'DATABASE_PORT',
  configKey: 'port'
},{
  envKey: 'DATABASE_DB',
  configKey: 'db'
},{
  envKey: 'DATABASE_USER',
  configKey: 'user'
},{
  envKey: 'DATABASE_PASSWORD',
  configKey: 'password'
}];

DATABASE_KEYS.forEach(k => {
  if (process.env[k.envKey] != null) {
    config.database[k.configKey] = process.env[k.envKey] ;
  }
});

module.exports = config;