/**
 * API for viewing authentification attempts (Admin Dashboard)
 */
const AuthAttempt = require('../models/authattempt');
import Thinky from '../util/thinky';

export async function getAuthAttempts (request) {
  const page = request.query.page;
  const limit = request.query.limit;
  const response = {};
  const sliceStart = (page -1) * limit;
  const sliceEnd = sliceStart + limit;
  let attempts;
  let count;

  try {
    attempts = await AuthAttempt.orderBy({index: Thinky.r.desc('time')}).slice(sliceStart, sliceEnd).run();
    count = await AuthAttempt.count().execute();

    response.attempts = attempts;
    response.count = count;

    // calculate the maximum pages, at least 1
    response.pages = Math.ceil(count / limit);

    return response;
  } catch (err) {
    console.error('Api.getAuthAttempts', err);
    response.error = {
      message: 'Unknown Error',
      type: 'Database',
      error_user_title: 'Fehler',
      error_user_msg: 'Es ist leider ein unbekannter Fehler aufgetreten.'
    };

    return response;
  }

}

export async function deleteAllAuthAttempts () {
  const response = {};
  let attempts;

  try {
    await AuthAttempt.delete().run();
    response.attempts = attempts;
    response.count = 0;

    // calculate the maximum pages, at least 1
    response.pages = 1;

    return response;
  } catch (err) {
    if (err instanceof Thinky.Errors.ValidationError) {
      response.attempts = [];
      response.count = 0;
      response.pages = 1;

      return response;
    }

    console.error('Api.deleteAllAuthAttempts', err);
    response.error = {
      message: 'Unknown Error',
      type: 'Database',
      error_user_title: 'Fehler',
      error_user_msg: 'Es ist leider ein unbekannter Fehler aufgetreten.'
    };

    return response;
  }
}