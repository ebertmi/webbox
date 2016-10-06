/**
 * API for viewing Log Entries (Admin Dashboard)
 */
import Log from '../models/log';
import Thinky from '../util/thinky';
const Errors = Thinky.Errors;

export function getLogs (request, reply) {
  const page = request.query.page;
  const limit = request.query.limit;
  const response = {};
  const sliceStart = (page -1) * limit;
  const sliceEnd = sliceStart + limit;
  let logs;

  Log.orderBy({index: Thinky.r.desc('timeStamp')}).slice(sliceStart, sliceEnd).run()
  .then(res => {
    logs = res;
    return Log.count().execute();
  })
  .then(count => {
    response.logs = logs;
    response.count = count;

    // calculate the maximum pages, at least 1
    response.pages = Math.ceil(count / limit);

    return reply(response);
  })
  .error(err => {
    console.error('Api.getLogs', err);
    response.error = {
      message: 'Unknown Error',
      type: 'Database',
      error_user_title: 'Fehler',
      error_user_msg: 'Es ist leider ein unbekannter Fehler aufgetreten.'
    };

    return reply(response).code(500);
  });
}

export function getLog(request, reply) {
  const id = request.params.id;
  const response = { };

  // fetch user and render view
  Log.get(id).run()
  .then(res => {
    response.log = res;
    reply.view(response);
  })
  .error(Errors.DocumentNotFound, err => {
    console.error('Api.getLog', err);
    response.error = {
      message: 'No log found for this ID.',
      type: 'Database',
      error_user_title: 'Fehler',
      error_user_msg: 'Es existiert kein Logeintrag unter dieser ID.'
    };

    reply(response);
  })
  .error(err => {
    console.error('Api.getLog', err);
    response.error = {
      message: 'Unknown Error',
      type: 'Database',
      error_user_title: 'Fehler',
      error_user_msg: 'Es ist leider ein unbekannter Fehler aufgetreten.'
    };

    reply(response).code(500);
  });
}