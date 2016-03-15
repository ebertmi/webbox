/**
 * The auth controllers authentificates users and may update user data from
 * the authentification providers.
 */
'use strict';
const authValidate = require('../auth/simple');
const Uuid = require('uuid');
const Course = require('../models/course');
const User = require('../models/user');
const Log = require('../models/log');
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
    username = request.payload.username; // basically the email
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

          // set slugs for user
          result.credentials.slugs = slugs;

          request.server.app.cache.set(sid, {credentials: result.credentials}, 0, (err) => {
            if (err) {
              // ToDo: change this to a meaningful message
              Log.createLog('Auth.Cache', 'Caching error while setting credentials', result.credentials);
              console.error('authcontroller.login', err);
              return reply.view('login', {
                errorMessage: Config.messages.login.unknownError,
                user: ANONYMOUS_USER_CONTEXT.user,
                next: redirectPath
              });
            }

            // store cookie in your cache
            request.cookieAuth.set({sid: sid});

            // delete old auth attempts
            AuthAttempt.deleteForUsername(username);

            // update last login date
            User.updateLastLogin(username, username);

            // redirect user to the previous page
            return reply.redirect(redirectPath);
          });
        });
      } else {
        AuthAttempt.logAuthAttempt(ip, username);
        const context = {
          errorMessage: Config.messages.login.invalidCredentials,
          user: ANONYMOUS_USER_CONTEXT.user,
          next: redirectPath
        };
        return reply.view('login', context);
      }
    })
    .error((err) => {
      AuthAttempt.logAuthAttempt(ip, username);
      const context = {
        errorMessage: Config.messages.login.invalidCredentials,
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
      infoMessage: Config.messages.logout.success,
      user: ANONYMOUS_USER_CONTEXT.user
    });
  },
  signup: function (request, reply) {
    let email = request.payload.email;
    let password = request.payload.password;
    let semester = request.payload.semester;
    let newUser;

    let [username, emailDomain] = email.split('@');

    // Steps

    // check if logged in
    if (request.auth.isAuthenticated === true) {
      return reply.view('index', {
        errorMessage: Config.messages.registration.alreadyRegistered,
        user: request.pre.user
      });
    }

    // check if there are validation errors
    if (request.pre.validation !== undefined) {
      return reply.view('index', {
        errorMessage: Config.messages.registration.validationErrorMessage,
        user: ANONYMOUS_USER_CONTEXT.user
      });
    }

    // check if there is already a user with this email registered
    User.filter({email: email}).run()
    .then(users => {
      // user exists
      if (users.length > 0) {
        return reply.view('index', {
          errorMessage: Config.messages.registration.emailAlreadyExists,
          user: ANONYMOUS_USER_CONTEXT.user
        });
      } else {
        // no user with this e-mail
        if (Config.auth.validSignupEmailHosts.indexOf(emailDomain) === -1) {
          // user used an unallowed domain for signup
          return reply.view('index', {
            errorMessage: Config.messages.registration.emailNotAllowed,
            user: ANONYMOUS_USER_CONTEXT.user
          });
        }
      }

      // encryptPassword and create new user
      User.encryptPassword(password)
      .then((hashedPassword) => {
        // creating new user
        console.log('Authentication.Signup', 'Create User');
        newUser = new User({
          username: username,
          email: email,
          password: hashedPassword,
          semester: semester,
          isActive: false,
          source: emailDomain,
          roles: [],
          verification: {
            token: JWT.sign({email: email, username: username}, Config.auth.verification.secret, {
              expiresIn: "24h",
              issuer: Config.auth.verification.issuer,
              subject: Config.auth.verification.subject
            }),
            isCompleted: false
          }
        });

        return newUser.save();
      })
      .then(res => {
        console.log('Authentication.Signup', 'Created User', res);
        Log.createLog('Authentication.Signup', 'User registered', {
          email: res.email
        }, 'Info');

        // send verification link
        const confirmUrl = request.connection.info.protocol + '://' + request.info.host + request.url.path.replace('signup', 'confirm');
        const mail = VerificationTemplate.getVerificationTemplate(confirmUrl, res.verification.token);

        MailService.sendHtmlEmail(Config.messages.registration.verificationEmailSubject, mail, res.email);

        // reply
        return reply.view('index', {
          infoMessage: Config.messages.registration.verificationSendMessage,
          user: ANONYMOUS_USER_CONTEXT.user
        });
      })
      .error(err => {
        console.log('Registration.Error', err);
        // error occured while trying to save user

        // try to delete user object
        User.filter({email: email}).delete().run()
        .error(err => {
          console.log('Registration.RecoverFromError', err);
        });

        return reply.view('index', {
          errorMessage: Config.messages.registration.verificationErrorMessage,
          user: ANONYMOUS_USER_CONTEXT.user
        });
      });
    })
    .error(err => {
      return reply.view('index', {
        errorMessage: Config.messages.registration.verificationErrorMessage,
        user: request.pre.user
      });
    });
  },
  confirm: function (request, reply) {
    const token = request.params.token;
    const context = {
      user: request.pre.user
    };
    let verifiedToken;
    let email;
    let user;

    // check if logged in
    if (request.auth.isAuthenticated) {
      context.errorMessage = Config.messages.registration.signedInErrorMessage;
      return reply.view('index', context);
    }

    // verifiy
    JWT.verify(token, Config.auth.verification.secret, (err, data) => {
      if (err) {
        // invalid token!!!!
        context.errorMessage = Config.messages.registration.confirmInvalidToken;
        return reply.view('index', context);
      }

      console.log('Authentication.confirm:', 'Decoded token data', data);
      email = data.email;

      User.filter({email: email}).run()
      .then(users => {
        if (users.length === 0) {
          // no user with this email, invalid token
          console.log('Authentication.Confirm: ', 'Received token with email, that does not exist.');
          Log.createLog('Authentication.Confirm', 'Received token with email, that does not exist.', {
            data: data
          }, 'Error');
          context.errorMessage = Config.messages.registration.confirmInvalidToken;
          return reply.view('index', context);
        } else {
          // we can go on with user
          user = users[0];

          // compare tokens
          if (token !== user.verification.token) {
            console.log('Registration.Confirm: ', 'Token not same as in database.', user);
            Log.createLog('Authentication.Confirm', 'Token not same as in database.', user, 'Error');
            context.errorMessage = Config.messages.registration.confirmInvalidToken;
            return reply.view('index', context);
          }

          user.roles.push('user');

          // update user
          const updates = {
            isActive: true,
            verification: {
              isCompleted: true,
              token: undefined
            },
            roles:  user.roles
          };// add user default role

          return user.merge(updates).save();
        }
      })
      .then(res => {
        context.infoMessage = Config.messages.registration.confirmSuccessMessage;
        return reply.view('index', context);
      })
      .error(err => {
        console.log('Authentication.Confirm: ', err);
        context.errorMessage = Config.messages.registration.confirmInvalidToken;
        return reply.view('index', context);
      });
    });
  },
  forgotPasswordView: function (request, reply) {
    const context = {
      user: request.pre.user
    };

    if (!request.pre.user.isAnonymous) {
      context.infoMessage = Config.messages.resetPassword.alreadySignedInMessage;
    }

    return reply.view('password/forgot', context);
  },
  resetPasswordView: function (request, reply) {
    const token = request.params.token;
    const context = {
      user: request.pre.user
    };
    // decode and check if token is valid
    // verifiy
    JWT.verify(token, Config.auth.resetPassword.secret, (err, data) => {
      if (err) {
        // invalid token
        context.errorMessage = Config.messages.resetPassword.invalidToken;
        return reply.view('index', context);
      }

      User.get(data.id).run()
      .then(res => {

        if (token !== res.forgot.token) {
          // invalid token
          context.errorMessage = Config.messages.resetPassword.invalidToken;
          return reply.view('index', context);
        }
        // then show form with password input
        // put in token again
        context.token = token;

        // save new password for user
        return reply.view('password/reset', context);
      });
    });
  },
  reset: function (request, reply) {
    const token = request.payload.token;
    const password = request.payload.password;
    let user;
    const context = {
      user: request.pre.user
    };

    // decode and check if token is valid
    JWT.verify(token, Config.auth.resetPassword.secret, (err, data) => {
      if (err) {
        // invalid token
        context.errorMessage = Config.messages.resetPassword.invalidToken;
        return reply.view('index', context);
      }

      User.get(data.id).run()
      .then(res => {
        // found user
        user = res;

        if (token !== user.forgot.token) {
          // invalid token
          context.errorMessage = Config.messages.resetPassword.invalidToken;
          return reply.view('index', context);
        }

        User.encryptPassword(password)
        .then(hashedPassword => {
          const updates = {
            password: hashedPassword,
            forgot: {
              token: undefined,
              expires: undefined
            }
          };

          return user.merge(updates).save();
        })
        .then(res => {
          Log.createLog('Authentication.ResetPassword', 'Resetted Password for User', {
            email: user.email
          }, 'Info');
          // redirect to index
          context.infoMessage = Config.messages.resetPassword.successMessage;
          return reply.view('index', context);
        })
        .error(err => {
          // invalid token
          console.log('Authentication.ResetPassword', err);
          context.errorMessage = Config.messages.resetPassword.resetErrorMessage;
          return reply.view('index', context);
        });
      })
      .error(err => {
        // invalid token
        console.log('Authentication.ResetPassword', err);
        context.errorMessage = Config.messages.resetPassword.resetErrorMessage;
        return reply.view('index', context);
      });
    });
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
        context.errorMessage = Config.messages.resetPassword.noUserForThisEmail;
        return reply.view('password/forgot', context);
      }

      // get user
      user = users[0];

      // generate token
      token = JWT.sign({email: email, id: user.id}, Config.auth.resetPassword.secret, {
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
      MailService.sendHtmlEmail(Config.messages.resetPassword.forgotEmailSubject, mail, res.email);

      context.infoMessage = Config.messages.resetPassword.forgotSendMessage;
      return reply.view('password/forgot', context);
    })
    .error(err => {
      console.log(err);
      context.errorMessage = Config.messages.resetPassword.forgotErrorMessage;
      return reply.view('password/forgot', context);
    });
  }
};