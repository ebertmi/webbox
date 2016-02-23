/**
 * The auth controllers authentificates users and may update user data from
 * the authentification providers.
 */
var Boom = require('boom');
var authValidate = require('../auth/simple');
var uuid = require('uuid');

module.exports = {
  loginview: function (request, reply) {
    var context = {};

    if (request.auth.isAuthenticated) {
      context.username = request.auth.credentials.username;
      console.info('Authenticated:', request.auth);
    }

    reply.view('login', context);
  },
  login: function (request, reply) {
    var sid;
    var username;
    var password;
    
    // get form data
    username = request.payload.username;
    password = request.payload.password;

    authValidate(request, username, password)
    .then((result) => {
      if (result.isValid === true) {
        console.log('Authentication successful for: ', username, result.credentials);
        // set session id and cache credentials
        sid = uuid.v4();
        request.server.app.cache.set(sid, {credentials: result.credentials}, 0, (err) => {
          if (err) {
            // ToDo: change this to a meaningful message
            return reply(err);
          }

          request.cookieAuth.set({sid: sid});
          return reply.redirect('/');
        });
      } else {
        return reply(Boom.unauthorized('Bad Email or Password'));
      }
    })
    .error((err) => {
      console.error('Authentication failed due to:', err);
      return reply('Authentication failed.');
    });
  },
  logout: function (request, reply) {
    // clear session cookie
    request.cookieAuth.clear();
    reply.view('index');
  }
};