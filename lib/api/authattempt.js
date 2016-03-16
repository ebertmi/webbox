'use strict';

const AuthAttempt = require('../models/authattempt');
import Thinky from '../util/thinky';

export function getAuthAttempts (request, reply) {
  const page = request.query.page;
  const limit = request.query.limit;
  const response = {};
  const sliceStart = (page -1) * limit;
  const sliceEnd = sliceStart + limit;
  let attempts;

  AuthAttempt.orderBy({index: Thinky.r.desc('time')}).slice(sliceStart, sliceEnd).run()
  .then(res => {
    attempts = res;
    return AuthAttempt.count().execute();
  })
  .then(count => {
    response.attempts = attempts;

    // calculate the maximum pages, at least 1
    response.pages = Math.ceil(count / limit);

    return reply(response);
  })
  .error(err => {
    console.error('Api.getAuthAttempts', err);
    response.error = {
      message: 'Unknown Error',
      type: 'Database',
      error_user_title: 'Fehler',
      error_user_msg: 'Es ist leider ein unbekannter Fehler aufgetreten.'
    };

    reply(response);
  });
}