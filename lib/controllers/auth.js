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
const JWT = require('jsonwebtoken');
const MailService = require('../mail/mailservice');
const VerificationTemplate = require('../mail/verification_template');
const ForgotPasswordTemplate = require('../mail/forgot_password_template');

const ANONYMOUS_USER_CONTEXT = {
  user: {
    isAnonymous: true
  }
};

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
                user: ANONYMOUS_USER_CONTEXT.user,
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
          user: ANONYMOUS_USER_CONTEXT.user,
          next: redirectPath
        };
        return reply.view('login', context);
      }
    })
    .error((err) => {
      AuthAttempt.logAuthAttempt(ip, username);
      const context = {
        errorMessage: 'Ungültiger Benutzername oder falsches Passwort.',
        user: ANONYMOUS_USER_CONTEXT.user,
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
      user: ANONYMOUS_USER_CONTEXT.user,
    });
  },
  signup: function (request, reply) {
    let email = request.payload.email;
    let password = request.payload.password;
    let semester = request.payload.semester;
    let newUser;

    let [username, emailDomain] = email.split('@');

    // Steps
    console.log('Starting signup process', email);

    // check if logged in
    if (request.auth.isAuthenticated === true) {
      return reply.view('index', {
        errorMessage: 'Sie sind bereits registriert!',
        user: request.pre.user
      });
    }

    // check if there is already a user with this email registered
    User.filter({email: email}).run()
    .then(users => {
      // user exists
      if (users.length > 0) {
        return reply.view('index', {
          errorMessage: 'Es existiert bereits ein Benutzer mit dieser E-Mail.',
          user: ANONYMOUS_USER_CONTEXT.user,
        });
      } else {
        // no user with this e-mail
        if (Config.auth.validSignupEmailHosts.indexOf(emailDomain) === -1) {
          // user used an unallowed domain for signup
          return reply.view('index', {
            errorMessage: 'E-Mail-Adresse nicht erlaubt. Bitte verwenden Sie die Adresse der Hochschule.',
            user: ANONYMOUS_USER_CONTEXT.user,
          });
        }
      }
    })
    .then(() => {
      // creating new user
      console.log('creating new user');
      newUser = new User({
        username: username,
        email: email,
        password: password,
        semester: semester,
        isActive: false,
        source: emailDomain,
        roles: [],
        verification: {
          token: JWT.sign({email: email, username: username}, Config.auth.verificationSecret, {
            expiresIn: "24h",
            issuer: 'webbox',
            subject: 'email-verification'
          }),
          isCompleted: false
        }
      });

      return newUser.save();
    })
    .then(res => {
      console.log('Created User', res);

      // send verification link
      const confirmUrl = request.connection.info.protocol + '://' + request.info.host + request.url.path.replace('signup', 'confirm');
      const mail = VerificationTemplate.getVerificationTemplate(confirmUrl, res.verification.token);

      MailService.sendHtmlEmail('Webbox - Verifikation Ihrer Registrierung', mail, res.email);

      // reply
      return reply.view('index', {
        infoMessage: 'Wir haben Ihnen eine E-Mail zur Verifikation zugeschickt. Sie sollten diese innerhalb der nächsten 10 Minuten erhalten. Bitte klicken Sie dort auf den Aktivierungslink, um die Registrierung abzuschließen.',
        user: ANONYMOUS_USER_CONTEXT.user,
      });
    })
    .error(err => {
      console.log(err);
      // error occured while trying to save user
      return reply.view('index', {
        errorMessage: 'Es ist ein Fehler bei der Registrierung aufgetreten. Bitte versuchen Sie es erneut oder kontaktieren Sie uns.',
        user: ANONYMOUS_USER_CONTEXT.user,
      });
    });
  },
  confirm: function (request, reply) {
    const token = request.params.token;
    let verifiedToken;

    // verifiy
    JWT.verify(token, Config.auth.verificationSecret, (err, data) => {
      if (err) {
        // invalid token!!!!
        return reply.view('registration/success');
      }
      // check token with jwt
      // verify/decode token
      // get email
      // get user for email
      // if not expired
      // isActive = true and verification = true
      // compare Token from database with the send one?

      // notify user

      // render index with successmessage
    });
  },
  forgotPasswordView: function (request, reply) {
    const context = {
      user: request.pre.user
    };

    if (!request.pre.user.isAnonymous) {
      context.infoMessage = 'Sie sind bereits angemeldet. Wollen Sie wirklich ihr Passwort zurücksetzen?';
    }

    return reply.view('password/forgot', context);
  },
  resetPasswordView: function (request, reply) {
    const token = request.params.token;
    const context = {
      user: request.pre.user
    };
    // decode and check if token is valid

    // then show form with password input
    // put in token again

    // view shown, when user wants to reset the password

    // validate token and set hidden input

    // save new password for user
    reply.view('password/reset', context);
  },
  forgotPassword: function (request, reply) {
    // base context
    const context = {
      user: request.pre.user
    };

    let user;
    let token;
    let expiresIn;
    const email = request.payload.email;


    User.filter({email: email}).run().
    then(users => {
      console.log(users);
      // check if there is a user with this email
      if (users.length === 0) {
        context.errorMessage = 'Es existiert kein Benutzer mit dieser E-Mail-Adresse.';
        return reply.view('password/forgot', context);
      }

      // get user
      user = users[0];

      // generate token
      token = JWT.sign({email: email}, Config.auth.verificationSecret, {
        expiresIn: "24h",
        issuer: 'webbox',
        subject: 'forgot-password'
      });
      // expire date

      user.forgot.token = token;
      return user.save();
    })
    .then((res) => {
      // send forgot link
      const resetUrl = request.connection.info.protocol + '://' + request.info.host + request.url.path.replace('forgot', 'reset');
      const mail = ForgotPasswordTemplate.getForgotPasswordTemplate(resetUrl, res.forgot.token);
      MailService.sendHtmlEmail('Webbox - Passwort zurücksetzen', mail, res.email);

      context.infoMessage = 'Sie sollten innerhalb der nächsten 10 Minuten eine E-Mail mit weiteren Instruktionen erhalten.';
      return reply.view('password/forgot', context);
    })
    .error(err => {
      console.log(err);
      context.errorMessage = 'Es ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.';
      return reply.view('password/forgot', context);
    });
  }
};