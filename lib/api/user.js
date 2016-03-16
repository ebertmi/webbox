'use strict';

const User = require('../models/user');
const Log = require('../models/log');
const Thinky = require('../util/thinky');
const Errors = Thinky.Errors;

export function getUsers (request, reply) {
  const page = request.query.page;
  const limit = request.query.limit;
  const response = {};
  const sliceStart = (page -1) * limit;
  const sliceEnd = sliceStart + limit;
  let users;

  User.orderBy({index: 'email'}).slice(sliceStart, sliceEnd).run()
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

export function getUser (request, reply) {
  const id = request.params.id;
  const response = {};

  User.get(id).run()
  .then(user => {
    response.user = user;
    reply(response);
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
    console.error('Api.getUser', err);
    response.error = {
      message: 'Unbekannter Datenbankfehler.',
      type: 'Database'
    };

    return reply(response).code(500);
  });
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
