/**
 * The auth controllers authentificates users and may update user data from
 * the authentification providers.
 */
'use strict';
const authValidate = require('../auth/simple');
const Uuid = require('uuid');
const User = require('../models/user');
const Log = require('../models/log');
const AuthAttempt = require('../models/authattempt');
const Config = require('../../config/webbox.config');
const JWT = require('jsonwebtoken');
const MailService = require('../mail/mailservice');
import { getVerificationEmailBody } from '../mail/verification_template';
import { getForgotEmailBody } from '../mail/forgot_password_template';
import { extractClientIp } from '../util/requestUtils';
import { getGeneralEmailBody } from '../mail/general_template';

const ANONYMOUS_USER_CONTEXT = {
  user: {
    isAnonymous: true
  }
};

module.exports = {
  loginview: function loginview (request, h) {
    const context = {
      user: request.pre.user
    };

    // ToDo: Check if requesting user is already logged in and then redirect immediatelly

    let nextQuery = request.query.next;
    if (nextQuery == null || nextQuery === '' || nextQuery.length === 0) {
      nextQuery = '/';
    }

    const redirectPath = encodeURIComponent(nextQuery);
    context.next = redirectPath;

    if (request.auth.isAuthenticated === true) {
      return h.redirect(nextQuery);
    } else {
      return h.view('login', context);
    }
  },
  login: async function login (request, h) {
    let sid;
    let username;
    let password;
    let ip;

    // try to redirect to previous page or to index
    let nextQuery = request.query.next;
    if (nextQuery == null || nextQuery === '' || nextQuery.length === 0) {
      nextQuery = '/';
    }

    const redirectPath = encodeURIComponent(nextQuery);
    console.info('RedirectPath from request:', request.query.next, nextQuery);

    // get form data
    username = request.payload.username; // basically the email
    password = request.payload.password;
    ip = extractClientIp(request);

    try {
      const result = await authValidate(request, username, password);

      if (result.isValid === true) {
        // set session id and cache credentials
        sid = Uuid.v4();

        try {
          await request.server.app.cache.set(sid, {credentials: result.credentials}, 0);
        } catch (err) {
          // ToDo: change this to a meaningful message
          Log.createLog('Auth.Cache', 'Caching error while setting credentials', result.credentials);
          console.error('authcontroller.login', err);
          return h.view('login', {
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
        return h.redirect(nextQuery);
      } else {
        const reason = result.credentials.isVerified === false ? Config.messages.login.notVerified : Config.messages.login.invalidCredentials;

        AuthAttempt.logAuthAttempt(ip, username);
        const context = {
          errorMessage: reason,
          user: ANONYMOUS_USER_CONTEXT.user,
          next: redirectPath
        };
        return h.view('login', context);
      }
    } catch (err) {
      console.error(err);
      AuthAttempt.logAuthAttempt(ip, username);
      const context = {
        errorMessage: Config.messages.login.invalidCredentials,
        user: ANONYMOUS_USER_CONTEXT.user,
        next: redirectPath
      };
      return h.view('login', context);
    }
  },
  logout: async function logout (request, h) {
    // clear session cookie
    let message;
    let user;

    if (request.auth.isAuthenticated === true) {
      // clears the session cookie
      request.cookieAuth.clear();
      message = Config.messages.logout.success;
      user = ANONYMOUS_USER_CONTEXT.user;
    } else {
      user = ANONYMOUS_USER_CONTEXT.user;
      message = Config.messages.logout.alreadyLoggedOut;
    }

    return h.view('index', {
      infoMessage: message,
      user: user,
      courses: request.pre.courses,
    });
  },
  signupRedirect: function signupRedirect(request, h) {
    // Redirect to home
    return h.redirect('/');
  },
  signup: async function signup (request, h) {
    // check if there are validation errors
    if (request.pre.validation !== undefined) {
      return h.view('index', {
        errorMessage: Config.messages.registration.validationErrorMessage,
        user: ANONYMOUS_USER_CONTEXT.user
      });
    }

    let email = request.payload.email;
    let password = request.payload.password;
    let passwordRepeat = request.payload.password_repeat;
    let semester = request.payload.semester;
    let terms = request.payload.terms;
    let newUser;

    // The Email must be always lower case!
    email = email.toLowerCase();

    // This cannot fail, as Joi does already the validation for emails, so we
    // have at this point always a "valid" email address
    let [username, emailDomain] = email.split('@');

    // username should also be always lower case!
    username = username.toLowerCase();

    // Steps

    // check if logged in
    if (request.auth.isAuthenticated === true) {
      return h.view('index', {
        errorMessage: Config.messages.registration.alreadyRegistered,
        user: request.pre.user,
        registration: {
          email,
          semester
        }
      });
    }

    if (terms !== 'on') {
      return h.view('index', {
        errorMessage: Config.messages.registration.acceptTerms,
        user: request.pre.user,
        registration: {
          email,
          semester
        }
      });
    }

    try {
      // filter for users with given e-mail address
      const users = await User.filter({email: email}).run();

      // user exists
      if (users.length > 0) {
        return h.view('index', {
          errorMessage: Config.messages.registration.emailAlreadyExists,
          user: ANONYMOUS_USER_CONTEXT.user,
          registration: {
            email,
            semester
          }
        });
      } else {
        // no user with this e-mail
        if (Config.auth.validSignupEmailHosts.indexOf(emailDomain) === -1) {
          // user used an unallowed domain for signup
          return h.view('index', {
            errorMessage: Config.messages.registration.emailNotAllowed,
            user: ANONYMOUS_USER_CONTEXT.user,
            registration: {
              email,
              semester
            }
          });
        }
      }

      // Now compare the passwords
      if (password !== passwordRepeat) {
        return h.view('index', {
          errorMessage: Config.messages.registration.passwordsAreNotEqual,
          user: ANONYMOUS_USER_CONTEXT.user,
          registration: {
            email,
            semester
          }
        });
      }

      // encryptPassword and create new user
      User.encryptPassword(password)
        .then((hashedPassword) => {
        // creating new user
          console.log('Authentication.Signup', 'Createing User:', username);
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
                expiresIn: '3 days',
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
          const mail = getVerificationEmailBody(confirmUrl, res.verification.token, res.username);

          MailService.sendHtmlEmail(Config.messages.registration.verificationEmailSubject, mail, res.email);

          // reply
          return h.view('index', {
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

          return h.view('index', {
            errorMessage: Config.messages.registration.verificationErrorMessage,
            user: ANONYMOUS_USER_CONTEXT.user,
            registration: {
              email,
              semester
            }
          });
        });
    } catch (error) {
      return h.view('index', {
        errorMessage: Config.messages.registration.verificationErrorMessage,
        user: request.pre.user,
        registration: {
          email,
          semester
        }
      });
    }
  },
  confirm: function (request, reply) {
    const token = request.params.token;
    const context = {
      user: request.pre.user
    };
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

      // ToDo: should we add an extra check here, when the token was invalid or did not contain all information?
      email = data.email;
      email = email.toLowerCase();

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

            // First we need to check if the user is already confirmed
            if (user.verification != null && user.verification.isCompleted === true) {
              context.errorMessage = Config.messages.registration.alreadyConfirmed;
              return reply.view('index', context);
            }

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
        .then(() => {
          Log.createLog('Authentication.Confirm', 'Successfull', {
            data: data
          }, 'Info');
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
            .then(() => {
              Log.createLog('Authentication.ResetPassword', 'Resetted Password for User', {
                email: user.email
              }, 'Info');
              // redirect to index
              context.infoMessage = Config.messages.resetPassword.successMessage;

              // Clear session cache for the user
              request.cookieAuth.clear();

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
    const email = request.payload.email;


    User.filter({email: email}).run().
      then(users => {
      // check if there is a user with this email
        if (users.length === 0) {
          context.errorMessage = Config.messages.resetPassword.noUserForThisEmail;
          return reply.view('password/forgot', context);
        }

        // get user
        user = users[0];

        // generate token
        token = JWT.sign({email: email, id: user.id}, Config.auth.resetPassword.secret, {
          expiresIn: '24h',
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
        const mail = getForgotEmailBody(resetUrl, res.forgot.token);
        MailService.sendHtmlEmail(Config.messages.resetPassword.forgotEmailSubject, mail, res.email);

        context.infoMessage = Config.messages.resetPassword.forgotSendMessage;
        return reply.view('password/forgot', context);
      })
      .error(err => {
        console.log(err);
        context.errorMessage = Config.messages.resetPassword.forgotErrorMessage;
        return reply.view('password/forgot', context);
      });
  },
  changePassword: function (request, reply) {
    const oldPassword = request.payload.oldPassword;
    const newPassword = request.payload.newPassword;
    const newPasswordRepeat = request.payload.newPasswordRepeat;
    let user;
    const context = {
      user: request.pre.user
    };

    // Check for the validation and show error message
    if (request.pre.validation != null) {
      context.errorMessage = Config.messages.changePassword.missingFields;
      return reply.view('profile', context);
    }

    if (newPassword !== newPasswordRepeat) {
      context.errorMessage = Config.messages.changePassword.passwordsNotEqual;
      return reply.view('profile', context);
    }

    User.get(request.pre.user.id).run()
      .then(res => {
      // found user
        user = res;

        // encrypt current password and compare
        return user.comparePassword(oldPassword);
      })
      .then(isEqual => {
        if (isEqual === false) {
          context.errorMessage = Config.messages.changePassword.oldPasswordWrong;
          return reply.view('profile', context);
        } else {
        // encrypt new password
          User.encryptPassword(newPassword)
            .then(hashedPassword => {
              const updates = {
                password: hashedPassword,
              };

              return user.merge(updates).save();
            })
            .then(() => {
              // logout user and redirect to index with message
              // clears the session cookie

              // Send notification email
              // Now send a mail
              // Now send a mail
              let template = getGeneralEmailBody(Config.messages.changePassword.emailNotification, request.pre.user.email);

              MailService.sendHtmlEmail("trycoding Freischaltung", template, request.pre.user.email);

              request.cookieAuth.clear();

              reply.view('index', {
                infoMessage: Config.messages.changePassword.success,
                user: ANONYMOUS_USER_CONTEXT.user,
                courses: request.pre.courses,
              });
            })
            .error((err => {
              console.log(err);

              request.cookieAuth.clear();
              reply.view('index', {
                infoMessage: Config.messages.changePassword.error,
                user: ANONYMOUS_USER_CONTEXT.user,
                courses: request.pre.courses,
              });
            }));
        }
      })
      .error((err => {
        console.log(err);

        request.cookieAuth.clear();
        reply.view('index', {
          infoMessage: Config.messages.changePassword.error,
          user: ANONYMOUS_USER_CONTEXT.user,
          courses: request.pre.courses,
        });
      }));
  }
};