/**
 * hapi.js plugin for a basic form based login and session management.
 */
var config = require('../../config/webbox.config');
var Joi = require('joi');
var Auth = require('../controllers/auth');
var PreHelpers = require('../pre/prehelpers');

exports.register = function (server, options, next) {
  // add authentification with cookie and basic username/password
  server.register([require('hapi-auth-cookie')], () => {
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
    handler: Auth.login,
    config: {
      validate: {
        payload: {
          username: Joi.string().required(),
          password: Joi.string().min(2).max(200).required()
        }
      },
      auth: {
        strategy: 'session',
        mode: 'try',
        scope: ['user']
      },
      pre: [
        {
          method: PreHelpers.detectAbuse
        }
      ],
      plugins: {
        'hapi-auth-cookie': {
          redirectTo: false
        }
      }
    }
  });

  server.route({
    method: 'GET',
    path: '/logout',
    handler: Auth.logout,
    config: {
      auth: {
        strategy: 'session',
        mode: 'try',
        scope: ['user']
      },
      plugins: {
        'hapi-auth-cookie': {
          redirectTo: false
        }
      }
    }
  });

  next();
};

exports.register.attributes = {
  name: 'auth'
};