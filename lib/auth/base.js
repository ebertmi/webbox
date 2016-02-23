/**
 * hapi.js plugin for a basic form based login and session management.
 */
var config = require('../../config/webbox.config');
var Boom = require('boom');
var Promise = require('bluebird');
var Joi = require('joi');
var auth = require('../controllers/auth');

exports.register = function (server, options, next) {
  // add authentification with cookie and basic username/password
  server.register([require('hapi-auth-cookie')], (err) => {
    // set up a cache for sessions
    var cache = server.cache({segment: 'sessions', expiresIn: 3 * 24 * 60 * 60 * 1000});
    server.app.cache = cache;

    config.auth.options.validateFunc = function (request, session, callback) {
      cache.get(session.sid, (err, cached) => {
        if (err) {
          return callback(err, false);
        }

        if (!cached) {
          return callback(null, false);
        }

        return callback(null, true, cached.credentials);
      });  
    };
    server.auth.strategy('session', 'cookie', config.auth.options);
  });

  /**
   * Set default strategy for every route
   * Use route config to disable authentication
   * with `auth: false`
   * Additionally, each route is scoped only for admins,
   * which can be also overriden.
   */
  server.auth.default({
    strategy: 'session',
    scope: ['admin']
  });
  
  // now expose /login and /logout
  server.route({
    method: 'POST',
    path: '/login',
    handler: auth.login,
    config: {
      validate: {
        payload: {
          username: Joi.string().required(),
          password: Joi.string().min(2).max(200).required()
        }
      },
      auth: false
    }   
  });
  
  server.route({
    method: 'GET',
    path: '/logout',
    handler: auth.logout,
    config: {
      auth: {
        scope: ['user']
      }
    }
  });
  
  next();
};

exports.register.attributes = {
  name: 'auth'
};