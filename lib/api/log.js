/**
 * API for viewing Log Entries (Admin Dashboard)
 */
import Log from '../models/log';
import Thinky from '../util/thinky';
const Errors = Thinky.Errors;
import { escape } from '../util/stringUtils';
import { parseSearchQuery, createDynamicFilterFunction } from '../util/databaseUtils';

const SEARCH_QUERY_FIELD_MAP = {
  'level': {
    field: 'eventType',
    parser: escape
  }
};

export function getLogs (request, reply) {
  const page = request.query.page;
  const limit = request.query.limit;
  let search = request.query.q;
  const response = {};
  const sliceStart = (page -1) * limit;
  const sliceEnd = sliceStart + limit;
  let logs;

  let isSearch = search !== '';
  let query;

  // handle search query
  if (isSearch) {
    let parsedQuery = parseSearchQuery(search, SEARCH_QUERY_FIELD_MAP);

    search = parsedQuery.search.toLowerCase(); // always lower case
    search = '(?i)' + escape(search); // escape regex special characters

    query = Log.filter(log => {
      return log('eventName').match(search).or(log('eventMessage').match(search));
    });

    if (parsedQuery.hasFilters === true) {
      query = query.filter(createDynamicFilterFunction(parsedQuery.filters));
    }

    query = query.orderBy('timeStamp');
  } else {
    // normal orderBy query
    query = Log.orderBy({index: Thinky.r.desc('timeStamp')});
  }

  query.slice(sliceStart, sliceEnd).run()
  .then(res => {
    logs = res;

    if (isSearch) {
      return query.count().execute();
    } else {
      return Log.count().execute();
    }
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