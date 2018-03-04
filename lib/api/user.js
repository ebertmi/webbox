/**
 * API for viewing and editing Users (Admin Dashboard)
 */
import trim from 'lodash/trim';
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
      return ['contains', trim(escape(s))];
    }
  },
  'semester': {
    field: 'semester',
    parser: escape
  }
};

export async function getUsers (request, h) {
  const page = request.query.page;
  const limit = request.query.limit;
  let search = request.query.q;
  const response = {};
  const sliceStart = (page -1) * limit;
  const sliceEnd = sliceStart + limit;
  let users;
  let count;

  const isSearch = search !== '';

  let query;

  // handle search query
  if (isSearch) {
    let parsedQuery = parseSearchQuery(search, SEARCH_QUERY_FIELD_MAP);

    search = parsedQuery.search.toLowerCase(); // always lower case
    search = `(?i)${escape(search)}`; // escape regex special characters

    query = User.orderBy({index: Thinky.r.desc('lastLogin')}).filter( user => {
      return user('username').match(search).or(user('email').match(search));
    });

    if (parsedQuery.hasFilters === true) {
      query = query.filter(createDynamicFilterFunction(parsedQuery.filters));
    }

    //query = query.orderBy({index: Thinky.r.desc('lastLogin')});
  } else {
    // normal orderBy query
    query = User.orderBy({index: Thinky.r.desc('lastLogin')});
  }

  try {
    users = await query.slice(sliceStart, sliceEnd).run();

    if (isSearch) {
      count = await query.count().execute();
    } else {
      count = await User.count().execute();
    }

    response.users = users;
    response.count = count;

    // calculate the maximum pages, at least 1
    response.pages = Math.ceil(count / limit);

    return response;
  } catch (err) {
    console.error('Api.getUsers', err);
    response.error = {
      message: 'Unbekannter Datenbankfehler.',
      type: 'Database'
    };

    return response;
  }
}

export async function resendConfirmationEmail (request, h) {
  const id = request.params.id;
  const response = {};
  let user;
  let token;

  try {
    user = await User.get(id).run();

    // now check if the user if the verification is already completed
    if (user.verification.isCompleted === true) {
      response.error = {
        message: 'User email address has been already confirmed.',
        type: 'Logic',
        level: 'warning',
        error_user_title: 'Hinweis',
        error_user_msg: 'Die E-Mail-Adresse des Benutzers wurde bereits bestätigt. Es wird keine weitere E-Mail verschickt.'
      };

      return response;
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
    await user.save();

    // send e-mail verification link
    const confirmUrl = `${request.connection.info.protocol  }://${  request.info.host  }${request.url.path.replace('signup', 'confirm')}`;
    const mail = getResendVerificationEmailBody(confirmUrl, user.verification.token);
    MailService.sendHtmlEmail(Config.messages.registration.verificationEmailSubject, mail, user.email);

    // send success (Status 200)
    return response;
  } catch (err) {
    if (err instanceof Errors.DocumentNotFound) {
      response.error = {
        message: 'No user found for this ID.',
        type: 'Database',
        error_user_title: 'Fehler',
        error_user_msg: 'Es existiert kein Benutzer unter dieser ID.'
      };

      return h.response(response).code(400);
    } else {
      // all other
      console.error('Api.resendConfirmationEmail', err);
      response.error = {
        message: 'Unbekannter Datenbankfehler.',
        type: 'Database'
      };

      return h.response(response).code(500);
    }
  }
}

export async function getUser (request, h) {
  const id = request.params.id;
  const response = {};

  try {
    const user = await User.get(id).run();
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

      return h.response(response).code(400);
    } else {
      // all other
      console.error('Api.getUser', err);
      response.error = {
        message: 'Unbekannter Datenbankfehler.',
        type: 'Database'
      };

      return h.response(response).code(500);
    }
  }
}

export async function deleteUser (request, h) {
  const id = request.params.id;
  const response = {};
  let email;
  let user;

  try {
    user = await User.get(id).run();
    email = user.email;
    RecycleBin.addEntry(user, 'User', request.auth.credentials.id);
    await user.delete();
    await Log.createLog('API.User', 'User deleted.', {
      id: id,
      email: email
    }, 'Info');

    return response;
  } catch (err) {
    if (err instanceof Errors.DocumentNotFound) {
      response.error = {
        message: 'No user found for this ID.',
        type: 'Database',
        error_user_title: 'Fehler',
        error_user_msg: 'Es existiert kein Benutzer unter dieser ID.'
      };

      return h.response(response).code(400);
    }

    console.log('API.deleteUser', err);
    response.error = {
      message: 'Unbekannter Datenbankfehler.',
      type: 'Database'
    };

    return h.resonse(response).code(500);
  }
}

export async function saveUser (request, h) {
  const id = request.params.id;
  const payload = request.payload.user;
  const response = {};

  let user;

  try {
    user = await User.get(id).run();
    // update user
    delete payload.id;
    delete payload.password;
    delete payload.isDirty;
    delete payload.isDeleted;

    // we should check if there is already a user with the email
    //console.log(payload);

    user = await user.merge(payload).save();
    response.user = user;
    return response;
  } catch (err) {
    if (err instanceof Errors.DocumentNotFound) {
      response.error = {
        message: 'No user found for this ID.',
        type: 'Database',
        error_user_title: 'Fehler',
        error_user_msg: 'Es existiert kein Benutzer unter dieser ID.'
      };

      return h.response(response).code(400);
    } else if (err instanceof Errors.ValidationError) {
      console.log('API.saveUser', err);
      response.error = {
        message: 'Received invalid payload data.',
        type: 'Validation',
        error_user_title: 'Fehler',
        error_user_msg: 'Ungültige Anfrage-Daten.'
      };

      return h.response(response).code(400);
    }

    console.log('API.saveUser', err);
    response.error = {
      message: 'Unbekannter Datenbankfehler.',
      type: 'Database'
    };

    return h.resonse(response).code(500);
  }
}

export async function unblockUser (request, h) {
  const id = request.params.id;
  const response = {};
  let email;
  let username;
  let user;

  try {
    user = await User.get(id).run();
  } catch (e) {
    if (e instanceof Errors.DocumentNotFound) {
      response.error = {
        message: 'No user found for this ID.',
        type: 'Database',
        error_user_title: 'Fehler',
        error_user_msg: 'Es existiert kein Benutzer unter dieser ID.'
      };

      return h.response(response).code(400);
    } else {
      console.log('API.unblockUser', e);
      response.error = {
        message: 'Unbekannter Datenbankfehler.',
        type: 'Database'
      };

      return h.response(response).code(500);
    }
  }

  email = user.email;
  username = user.username;

  try {
    await AuthAttempt.filter({ username: email }).delete().execute();
    await AuthAttempt.filter({ username: username }).delete().execute();
  } catch (e) {
    console.error(e);
    response.error = {
      message: 'Unbekannter Datenbankfehler.',
      type: 'Database'
    };

    return h.response(response).code(500);
  }

  return response;
}

export async function confirmUser (request, h) {
  const id = request.params.id;
  const response = {};
  let email;
  let user;

  try {
    user = await User.get(id).run();

    if (user.verification == null || user.verification.isCompleted === false) {
      // Update User and set the right role
      if (user.roles.includes('user') === false) {
        user.roles.push('user');
      }

      email = user.email;

      user = await user.merge({
        isActive: true,
        verification: {
          isCompleted: true,
          token: undefined
        },
        roles: user.roles
      }).save();
    }

    response.user = user;
    Log.createLog('API.User', 'Confirmed user manually.', {
      id: id,
      email: email
    }, 'Info');

    // Now send a mail
    const template = getGeneralEmailBody(Config.messages.registration.manualConfirmMessage, email);

    MailService.sendHtmlEmail('trycoding.io Freischaltung', template, email);

    return response;
  } catch (err) {
    if (err instanceof Errors.DocumentNotFound) {
      response.error = {
        message: 'No user found for this ID.',
        type: 'Database',
        error_user_title: 'Fehler',
        error_user_msg: 'Es existiert kein Benutzer unter dieser ID.'
      };

      return h.response(response).code(400);
    }

    console.log('API.confirmUser', err);
    response.error = {
      message: 'Unbekannter Datenbankfehler.',
      type: 'Database'
    };

    return h.response(response).code(500);
  }
}

export async function resetUserPasswordManually(request, h) {
  const id = request.params.id;
  const response = {};
  let email;
  let user;
  let newPassword;
  let hashedPassword;

  try {
    user = await User.get(id).run();

    // Generate random secure password, use configured length and if to create memorable passwords
    newPassword = generatePassword(Config.auth.resetPassword.passwordLength, Config.auth.resetPassword.memorablePassword);

    // encrypt password
    hashedPassword = await User.encryptPassword(newPassword);
    const updates = {
      password: hashedPassword,
      forgot: {
        token: undefined,
        expires: undefined
      }
    };

    // save new password
    await user.merge(updates).save();
    Log.createLog('Authentication.ManualResetPassword', 'Admin Resetted Password for User', {
      email: user.email
    }, 'Info');

    // Now send a mail
    const baseRoute = `${request.headers['x-forwarded-proto'] || request.connection.info.protocol}://${request.info.host}`;
    const template = getManualPasswordResetBody(baseRoute, newPassword);

    MailService.sendHtmlEmail('trycoding.io  - Password wurde zurückgesetzt', template, email);

    return response;
  } catch (err) {
    console.log('Authentication.ManualResetPassword', err);
    context.errorMessage = Config.messages.resetPassword.resetErrorMessage;
    return response;
  }
}