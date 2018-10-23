/**
 * hapi.js plugin for a basic form based login and session management.
 */
const config = require('../../config/webbox.config');

async function _register (server) {
  await server.register(require('hapi-auth-cookie'));

  // set up a cache for sessions
  const cache = server.cache({segment: 'sessions', expiresIn: 3 * 24 * 60 * 60 * 1000});
  server.app.cache = cache;

  config.auth.options.validateFunc = async function validateFunc(request, session) {
    let cached;

    try {
      cached = await cache.get(session.sid);
    } catch (err) {
      console.error(err);
      return { valid: false };
    }

    if (!cached) {
      return { valid: false };
      //return callback(null, false);
    }

    return { valid: true, credentials: cached.credentials };
  };

  // Create auth strategy session
  server.auth.strategy('session', 'cookie', config.auth.options);
}

exports.plugin = {
  register: _register,
  name: 'auth',
  version: '1.0.0'
};
