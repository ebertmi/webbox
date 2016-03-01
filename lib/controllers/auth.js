/**
 * The auth controllers authentificates users and may update user data from
 * the authentification providers.
 */
'use strict';
const Boom = require('boom');
const authValidate = require('../auth/simple');
const Uuid = require('uuid');
const Course = require('../models/course');

module.exports = {
  loginview: function (request, reply) {
    const context = {
      user: request.pre.user
    };

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
        const context = {
          errorMessage: 'Ungültiger Benutzername oder falsches Passwort.',
          user: {
            isAnonymous: true
          }
        };
        return reply.view('login', context);
      }
    })
    .error((err) => {
      const context = {
        errorMessage: 'Ungültiger Benutzername oder falsches Passwort.',
        user: {
          isAnonymous: true
        }
      };
      return reply.view('login', context);
    });
  },
  logout: function (request, reply) {
    // clear session cookie
    request.cookieAuth.clear();
    reply.view('index');
  },
  signup: function (request, reply) {
    let email = request.payload.email;
    let password = request.payload.password;

    // Steps

    // check if there is already a user with this email registered

    // check if the user's email has an allowed extension

    // create user

    // send verification link

    // reply
  },
  confirm: function (request, reply) {
    // check token with jwt

  },
  forgotPasswordView: function (request, reply) {
    // view shown, when user wants to reset the password

    // validate token and set hidden input

    // save new password for user
  },
  forgotPassword: function (request, reply) {
    // disable account

    // create token

    // send email with token

    // update user
  }
};