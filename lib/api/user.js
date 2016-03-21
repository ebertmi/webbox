'use strict';

const User = require('../models/user');
const Log = require('../models/log');
const Thinky = require('../util/thinky');
const Errors = Thinky.Errors;
const Config = require('../../config/webbox.config');
const JWT = require('jsonwebtoken');
const MailService = require('../mail/mailservice');
const VerificationTemplate = require('../mail/verification_template');
import { escape } from '../util/regex';

export function getUsers (request, reply) {
  const page = request.query.page;
  const limit = request.query.limit;
  let search = request.query.q;
  let searchPattern;
  const response = {};
  const sliceStart = (page -1) * limit;
  const sliceEnd = sliceStart + limit;
  let users;

  let query;

  // handle search query
  if (search !== '') {
    search = search.toLowerCase(); // always lower case
    search = escape(search); // escape regex special characters
    searchPattern = `${search}`;
    query = User.filter( user => {
      return user('username').match(searchPattern).or(user('email').match(searchPattern));
    }).orderBy('email');
  } else {
    // normal orderBy query
    query = User.orderBy({index: 'email'});
  }

  query.slice(sliceStart, sliceEnd).run()
  .then(res => {
    users = res;
    return User.count().execute();
  })
  .then(count => {
    response.users = users;

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

export function* resendConfirmationEmail (request, reply) {
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
      expiresIn: "24h",
      issuer: Config.auth.verification.issuer,
      subject: Config.auth.verification.subject
    });

    // save token data
    user.verification.token = token;
    user.verification.isCompleted = false;
    yield user.save();

    // send e-mail verification link
    const confirmUrl = request.connection.info.protocol + '://' + request.info.host + request.url.path.replace('signup', 'confirm');
    const mail = VerificationTemplate.getVerificationTemplate(confirmUrl, user.verification.token);
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

export function* getUser (request, reply) {
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
    console.log(payload);

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
