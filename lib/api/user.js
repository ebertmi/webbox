/**
 * API for viewing and editing Users (Admin Dashboard)
 */
import User from '../models/user';
import Log from '../models/log';
import AuthAttempt from '../models/authattempt';
import RecycleBin from '../models/recyclebin';
import Thinky from '../util/thinky';
const Errors = Thinky.Errors;
import Config from '../../config/webbox.config';
import JWT from 'jsonwebtoken';
import MailService from '../mail/mailservice';
import { getResendVerificationEmailBody } from '../mail/verification_template';
import { getManualPasswordResetBody } from '../mail/manual_password_reset_template';
import { getGeneralEmailBody } from '../mail/general_template';
import { escape, toBoolean } from '../util/stringUtils';
import { parseSearchQuery, createDynamicFilterFunction } from '../util/databaseUtils';
import { generatePassword } from '../util/passwordUtils';

const SEARCH_QUERY_FIELD_MAP = {
  'active': {
    field: 'isActive',
    parser: toBoolean
  },
  'verified': {
    field: 'verification.isCompleted',
    parser: toBoolean
  },
  'role': {
    field: 'roles',
    parser: s => {
      return ['contains', escape(s)];
    }
  },
  'semester': {
    field: 'semester',
    parser: escape
  }
};

export function getUsers (request, reply) {
  const page = request.query.page;
  const limit = request.query.limit;
  let search = request.query.q;
  const response = {};
  const sliceStart = (page -1) * limit;
  const sliceEnd = sliceStart + limit;
  let users;

  const isSearch = search !== '';

  let query;

  // handle search query
  if (isSearch) {
    let parsedQuery = parseSearchQuery(search, SEARCH_QUERY_FIELD_MAP);

    search = parsedQuery.search.toLowerCase(); // always lower case
    search = '(?i)' + escape(search); // escape regex special characters

    query = User.filter( user => {
      return user('username').match(search).or(user('email').match(search));
    });

    if (parsedQuery.hasFilters === true) {
      query = query.filter(createDynamicFilterFunction(parsedQuery.filters));
    }

    //console.info(parsedQuery);

    query = query.orderBy('createdAt');
  } else {
    // normal orderBy query
    query = User.orderBy({index: 'createdAt'});
  }

  query.slice(sliceStart, sliceEnd).run()
    .then(res => {
      users = res;

      if (isSearch) {
        return query.count().execute();
      } else {
        return User.count().execute();
      }

    })
    .then(count => {
      response.users = users;
      response.count = count;

      // calculate the maximum pages, at least 1
      response.pages = Math.ceil(count / limit);

      return reply(response);
    })
    .error(err => {
      console.error('Api.getUsers', err);
      response.error = {
        message: 'Unbekannter Datenbankfehler.',
        type: 'Database'
      };

      return reply(response);
    });
}

export function*resendConfirmationEmail (request, reply) {
  const id = request.params.id;
  const response = {};
  let user;
  let token;

  try {
    user = yield User.get(id).run();

    // now check if the user if the verification is already completed
    if (user.verification.isCompleted === true) {
      response.error = {
        message: 'User email address has been already confirmed.',
        type: 'Logic',
        level: 'warning',
        error_user_title: 'Hinweis',
        error_user_msg: 'Die E-Mail-Adresse des Benutzers wurde bereits bestätigt. Es wird keine weitere E-Mail verschickt.'
      };

      return reply(response);
    }

    // generate new token
    token = JWT.sign({email: user.email, username: user.username}, Config.auth.verification.secret, {
      expiresIn: '24h',
      issuer: Config.auth.verification.issuer,
      subject: Config.auth.verification.subject
    });

    // save token data, this also invalidates all previous tokens
    user.verification.token = token;
    user.verification.isCompleted = false;
    yield user.save();

    // send e-mail verification link
    const confirmUrl = request.connection.info.protocol + '://' + request.info.host + request.url.path.replace('signup', 'confirm');
    const mail = getResendVerificationEmailBody(confirmUrl, user.verification.token);
    MailService.sendHtmlEmail(Config.messages.registration.verificationEmailSubject, mail, user.email);

    // send success (Status 200)
    return reply(response);
  } catch (err) {
    if (err instanceof Errors.DocumentNotFound) {
      response.error = {
        message: 'No user found for this ID.',
        type: 'Database',
        error_user_title: 'Fehler',
        error_user_msg: 'Es existiert kein Benutzer unter dieser ID.'
      };

      return reply(response).code(400);
    } else {
      // all other
      console.error('Api.resendConfirmationEmail', err);
      response.error = {
        message: 'Unbekannter Datenbankfehler.',
        type: 'Database'
      };

      return reply(response).code(500);
    }
  }
}

export function*getUser (request, reply) {
  const id = request.params.id;
  const response = {};

  try {
    let user = yield User.get(id).run();
    response.user = user;
    return reply(response);
  } catch (err) {
    if (err instanceof Errors.DocumentNotFound) {
      response.error = {
        message: 'No user found for this ID.',
        type: 'Database',
        error_user_title: 'Fehler',
        error_user_msg: 'Es existiert kein Benutzer unter dieser ID.'
      };

      return yield reply(response).code(400);
    } else {
      // all other
      console.error('Api.getUser', err);
      response.error = {
        message: 'Unbekannter Datenbankfehler.',
        type: 'Database'
      };

      return reply(response).code(500);
    }
  }
}

export function deleteUser (request, reply) {
  const id = request.params.id;
  const response = {};
  let email;

  User.get(id).run()
    .then(user => {
      email = user.email;
      RecycleBin.addEntry(user, 'User', request.auth.credentials.id);
      return user.delete();
    })
    .then(() => {
      Log.createLog('API.User', 'User deleted.', {
        id: id,
        email: email
      }, 'Info');
      return reply(response);
    })
    .catch(Errors.DocumentNotFound, () => {
      response.error = {
        message: 'No user found for this ID.',
        type: 'Database',
        error_user_title: 'Fehler',
        error_user_msg: 'Es existiert kein Benutzer unter dieser ID.'
      };

      return reply(response).code(400);
    })
    .error(err => {
      console.log('API.deleteUser', err);
      response.error = {
        message: 'Unbekannter Datenbankfehler.',
        type: 'Database'
      };

      return reply(response).code(500);
    });
}

export function saveUser (request, reply) {
  const id = request.params.id;
  const payload = request.payload.user;
  const response = {};

  User.get(id).run()
    .then(user => {
    // update user
      delete payload.id;
      delete payload.password;
      delete payload.isDirty;
      delete payload.isDeleted;

      // we should check if there is already a user with the email
      //console.log(payload);

      return user.merge(payload).save();
    })
    .then(res => {
      response.user = res;
      reply(response);
    })
    .catch(Errors.ValidationError, (err) => {
      console.log('API.saveUser', err);
      response.error = {
        message: 'Received invalid payload data.',
        type: 'Validation',
        error_user_title: 'Fehler',
        error_user_msg: 'Ungültige Anfrage-Daten.'
      };

      reply(response).code(400);
    })
    .catch(Errors.DocumentNotFound, () => {
      response.error = {
        message: 'No user found for this ID.',
        type: 'Database',
        error_user_title: 'Fehler',
        error_user_msg: 'Es existiert kein Benutzer unter dieser ID.'
      };

      reply(response).code(400);
    })
    .error(err => {
      console.log('API.saveUser', err);
      response.error = {
        message: 'Unbekannter Datenbankfehler.',
        type: 'Database'
      };

      reply(response).code(500);
    });
}

export function*unblockUser (request, reply) {
  const id = request.params.id;
  const response = {};
  let email;
  let username;
  let user;

  try {
    user = yield User.get(id).run();
  } catch (e) {
    if (e instanceof Errors.DocumentNotFound) {
      response.error = {
        message: 'No user found for this ID.',
        type: 'Database',
        error_user_title: 'Fehler',
        error_user_msg: 'Es existiert kein Benutzer unter dieser ID.'
      };

      return reply(response).code(400);
    } else {
      console.log('API.unblockUser', e);
      response.error = {
        message: 'Unbekannter Datenbankfehler.',
        type: 'Database'
      };

      return reply(response).code(500);
    }
  }

  email = user.email;
  username = user.username;

  try {
    yield AuthAttempt.filter({ username: email }).delete().execute();
    yield AuthAttempt.filter({ username: username }).delete().execute();
  } catch (e) {
    console.error(e);
    response.error = {
      message: 'Unbekannter Datenbankfehler.',
      type: 'Database'
    };

    return reply(response).code(500);
  }

  return reply(response);
}

export function confirmUser (request, reply) {
  const id = request.params.id;
  const response = {};
  let email;

  User.get(id).run()
    .then(user => {
      if (user.verification != null && user.verification.isCompleted === true) {
      // already confirmed
      } else {
      // Update User and set the right role
        if (user.roles.includes('user') === false) {
          user.roles.push('user');
        }

        email = user.email;

        return user.merge({
          isActive: true,
          verification: {
            isCompleted: true,
            token: undefined
          },
          roles: user.roles
        }).save();
      }
    })
    .then((res) => {
      response.user = res;
      Log.createLog('API.User', 'Confirmed user manually.', {
        id: id,
        email: email
      }, 'Info');

      // Now send a mail
      const template = getGeneralEmailBody(Config.messages.registration.manualConfirmMessage, email);

      MailService.sendHtmlEmail('trycoding.io Freischaltung', template, email);

      return reply(response);
    })
    .catch(Errors.DocumentNotFound, () => {
      response.error = {
        message: 'No user found for this ID.',
        type: 'Database',
        error_user_title: 'Fehler',
        error_user_msg: 'Es existiert kein Benutzer unter dieser ID.'
      };

      return reply(response).code(400);
    })
    .error(err => {
      console.log('API.confirmUser', err);
      response.error = {
        message: 'Unbekannter Datenbankfehler.',
        type: 'Database'
      };

      return reply(response).code(500);
    });
}

export function resetUserPasswordManually(request, reply) {
  const id = request.params.id;
  const response = {};
  let email;
  let user;
  let newPassword;

  User.get(id).run()
    .then(res => {
      // found user
      user = res;

      // Generate random secure password, use configured length and if to create memorable passwords
      try {
        newPassword = generatePassword(Config.auth.resetPassword.passwordLength, Config.auth.resetPassword.memorablePassword);
      } catch (e) {
        console.log(e);
      }
      console.log(newPassword);
      User.encryptPassword(newPassword)
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
          Log.createLog('Authentication.ManualResetPassword', 'Admin Resetted Password for User', {
            email: user.email
          }, 'Info');

          // Now send a mail
          const baseRoute = `${request.headers['x-forwarded-proto'] || request.connection.info.protocol}://${request.info.host}`;
          const template = getManualPasswordResetBody(baseRoute, newPassword);

          MailService.sendHtmlEmail('trycoding.io  - Password wurde zurückgesetzt', template, email);

          reply(response);
        })
        .error(err => {
          console.log('Authentication.ManualResetPassword', err);
          context.errorMessage = Config.messages.resetPassword.resetErrorMessage;
          return reply(response);
        });
    }).error(err => {
      console.log('Authentication.ManualResetPassword', err);
      context.errorMessage = Config.messages.resetPassword.resetErrorMessage;
      return reply(response);
    });
}