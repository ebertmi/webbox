/**
 * The auth controllers authentificates users and may update user data from
 * the authentification providers.
 */
var Boom = require('boom');
var authValidate = require('../auth/simple');
var uuid = require('uuid');

module.exports = {
    loginview: function (request, reply) {
        reply.view('login');
    },
    login: function (request, reply) {
        var sid;
        var username;
        var password;
      
        // get form data
        username = request.payload.username;
        password = request.payload.password;

        authValidate(request, username, password)
        .then((isValid, credentials) => {
            if (isValid === true) {
                // set session id and cache credentials
                sid = uuid.v4();
                request.server.app.cache.set(sid, {credentials: credentials}, 0, (err) => {
                        if (err) {
                            // ToDo: change this to a meaningful message
                            return reply(err);
                        }

                        request.cookieAuth.set({sid: sid});
                        return reply.redirect('/');
                    });
                request.cookieAuth.set(credentials);
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