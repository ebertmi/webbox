/**
 * hapi.js plugin for a basic form based login and session management.
 */
var config = require('../../config/webbox.config');

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

    // Create auth strategy session
    server.auth.strategy('session', 'cookie', config.auth.options);
  });

  next();
};

exports.register.attributes = {
  name: 'auth'
};