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

export async function getLogs (request, h) {
  const page = request.query.page;
  const limit = request.query.limit;
  let search = request.query.q;
  const response = {};
  const sliceStart = (page -1) * limit;
  const sliceEnd = sliceStart + limit;
  let logs;
  let count;

  const isSearch = search !== '';
  let query;

  // handle search query
  if (isSearch) {
    const parsedQuery = parseSearchQuery(search, SEARCH_QUERY_FIELD_MAP);

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


  try {
    logs = await query.slice(sliceStart, sliceEnd).run();

    if (isSearch) {
      count = await query.count().execute();
    } else {
      count = await Log.count().execute();
    }

    response.logs = logs;
    response.count = count;

    // calculate the maximum pages, at least 1
    response.pages = Math.ceil(count / limit);

    return response;
  } catch (err) {
    console.error('Api.getLogs', err);
    response.error = {
      message: 'Unknown Error',
      type: 'Database',
      error_user_title: 'Fehler',
      error_user_msg: 'Es ist leider ein unbekannter Fehler aufgetreten.'
    };

    return h.response(response).code(500);
  }
}

export async function getLog (request, h) {
  const id = request.params.id;
  const response = { };

  // fetch user and render view

  try {
    const log = await Log.get(id).run();
    response.log = log;
    return h.view(response);
  } catch (err) {
    if (err instanceof Errors.DocumentNotFound) {
      console.error('Api.getLog', err);
      response.error = {
        message: 'No log found for this ID.',
        type: 'Database',
        error_user_title: 'Fehler',
        error_user_msg: 'Es existiert kein Logeintrag unter dieser ID.'
      };

      return response;
    }

    console.error('Api.getLog', err);
    response.error = {
      message: 'Unknown Error',
      type: 'Database',
      error_user_title: 'Fehler',
      error_user_msg: 'Es ist leider ein unbekannter Fehler aufgetreten.'
    };

    return h.response(response).code(500);
  }
}