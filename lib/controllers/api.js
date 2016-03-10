'use strict';

const User = require('../models/user');
const Thinky = require('../util/thinky');
const Errors = Thinky.Errors;

export function getUsers (request, reply) {
  const page = request.query.page;
  const limit = request.query.limit;
  const response = {};
  const sliceStart = (page -1) * limit;
  const sliceEnd = sliceStart + limit;

  User.orderBy({index: 'email'}).slice(sliceStart, sliceEnd).run()
  .then(users => {
    response.users = users;
    reply(response);
  })
  .error(err => {
    console.error('Api.getUsers', err);
    response.error = {
      message: 'Unbekannter Datenbankfehler.',
      type: 'Database'
    };

    reply(response);
  });
}