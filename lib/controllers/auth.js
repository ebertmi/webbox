/**
 * The auth controllers authentificates users and may update user data from
 * the authentification providers.
 */
'use strict';
var Boom = require('boom');
var authValidate = require('../auth/simple');
var Uuid = require('uuid');
const Course = require('../models/course');

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
    let sid;
    let username;
    let password;

    // get form data
    username = request.payload.username;
    password = request.payload.password;

    authValidate(request, username, password)
    .then((result) => {
      if (result.isValid === true) {
        console.log('Authentication successful for: ', username, result.credentials);
        // load all course slugs, if any
        return Course.getCourseSlugsForUserId(result.credentials.id).then((slugs) => {
          console.info(slugs);
          // set session id and cache credentials
          sid = Uuid.v4();
          request.server.app.cache.set(sid, {credentials: result.credentials}, 0, (err) => {
            if (err) {
              // ToDo: change this to a meaningful message
              console.error('authcontroller.login', err);
              return reply(Boom.unauthorized());
            }

            request.cookieAuth.set({sid: sid});

            // try to redirect to previous page or to index
            let redirectPath = request.query.next || '/';
            return reply.redirect(redirectPath);
          });
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