/**
 * The auth controllers authentificates users and may update user data from
 * the authentification providers.
 */
'use strict';
const Boom = require('boom');
const authValidate = require('../auth/simple');
const Uuid = require('uuid');
const Course = require('../models/course');
const User = require('../models/user');
const AuthAttempt = require('../models/authattempt');
const Config = require('../../config/webbox.config');

module.exports = {
  loginview: function (request, reply) {
    const context = {
      user: request.pre.user,
      next: request.query.next || ''
    };

    reply.view('login', context);
  },
  login: function (request, reply) {
    let sid;
    let username;
    let password;
    let ip;

    // try to redirect to previous page or to index
    const redirectPath = request.query.next || '/';

    // get form data
    username = request.payload.username;
    password = request.payload.password;
    ip = request.info.remoteAddress;

    authValidate(request, username, password)
    .then((result) => {
      if (result.isValid === true) {
        console.info('Authentication successful for: ', username);
        // load all course slugs, if any
        return Course.getCourseSlugsForUserId(result.credentials.id).then((slugs) => {
          // set session id and cache credentials
          sid = Uuid.v4();
          request.server.app.cache.set(sid, {credentials: result.credentials}, 0, (err) => {
            if (err) {
              // ToDo: change this to a meaningful message
              console.error('authcontroller.login', err);
              return reply.view('login', {
                errorMessage: 'Es ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.',
                user: {
                  isAnonymous: true
                },
                next: redirectPath
              });
            }

            // store cookie in your cache
            request.cookieAuth.set({sid: sid});

            // delete old auth attempts
            AuthAttempt.deleteForUsername(username);

            // redirect user to the previous page
            return reply.redirect(redirectPath);
          });
        });
      } else {
        AuthAttempt.logAuthAttempt(ip, username);
        const context = {
          errorMessage: 'Ungültiger Benutzername oder falsches Passwort.',
          user: {
            isAnonymous: true
          },
          next: redirectPath
        };
        return reply.view('login', context);
      }
    })
    .error((err) => {
      AuthAttempt.logAuthAttempt(ip, username);
      const context = {
        errorMessage: 'Ungültiger Benutzername oder falsches Passwort.',
        user: {
          isAnonymous: true
        },
        next: redirectPath
      };
      return reply.view('login', context);
    });
  },
  logout: function (request, reply) {
    // clear session cookie
    request.cookieAuth.clear();
    reply.view('index', {
      infoMessage: 'Sie wurden abgemeldet.',
      user: {
        isAnonymous: true
      }
    });
  },
  signup: function (request, reply) {
    let email = request.payload.email;
    let password = request.payload.password;
    let semester = request.payload.semester;
    let newUser;

    let {username, emailDomain} = email.split('@');

    // Steps

    // check if logged in
    if (request.auth.isAuthenticated === true) {
      return reply.view('index', {
        errorMessage: 'Sie sind bereits registriert!'
      });
    }

    // check if there is already a user with this email registered
    User.filter({email: email}).run()
    .then(user => {
      // user exists
      return reply.view('index', {
        errorMessage: 'Ex existiert bereits ein Benutzer mit dieser E-Mail.'
      });
    })
    .error(err => {
      // no user with this e-mail
      if (Config.auth.validSignupEmailHosts.indexOf(emailDomain) === -1) {
        // user used an unallowed domain for signup
        return reply.view('index', {
          errorMessage: 'E-Mail-Adresse nicht erlaubt. Bitte verwenden Sie die Adresse der Hochschule.'
        });
      }

      // create user

    })
    .then(() => {
      newUser = new User({
        username: username,
        email: email,
        password: password,
        semester: semester,
        isActive: false,
        source: emailDomain,
        roles: [],
        createdAt: new Date(),
      });

      return newUser.save();
    })


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