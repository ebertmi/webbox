/**
 * API for viewing and editing Embeds (Admin Dashboard)
 */
import trim from 'lodash/trim';
import CodeEmbed from '../models/codeEmbed';
import Thinky from '../util/thinky';
const Errors = Thinky.Errors;
import { escape } from '../util/stringUtils';
import { parseSearchQuery, createDynamicFilterFunction } from '../util/databaseUtils';

const SEARCH_QUERY_FIELD_MAP = {
  'language': {
    field: 'meta.language',
    parser: s => {
      return ['match', `(?i)${trim(escape(s))}`];
    }
  },
  'type': {
    field: 'meta.embedType',
    parser: s => {
      return ['match', `(?i)${trim(escape(s))}`];
    }
  },
  'slug': {
    field: 'slug',
    parser: s => {
      return ['match', `(?i)${trim(escape(s))}`];
    }
  }
};

/**
 * Paginated get of all CodeEmbeds with search support.
 *
 * @export
 * @param {object} request - request
 * @param {object} h - h response toolkit 
 * @returns {object} - reply of the request
 */
export async function getEmbeds (request, h) {
  const page = request.query.page;
  const limit = request.query.limit;
  let search = request.query.q;
  const response = {};
  const sliceStart = (page -1) * limit;
  const sliceEnd = sliceStart + limit;
  let embeds;
  let count;

  const isSearch = search !== '';
  let query;

  // handle search query
  if (isSearch) {
    const parsedQuery = parseSearchQuery(search, SEARCH_QUERY_FIELD_MAP);

    search = parsedQuery.search.toLowerCase(); // always lower case
    search = `(?i)${escape(search)}`; // escape regex special characters

    query = CodeEmbed.filter(embed => {
      return embed('meta')('name').match(search);
    });

    if (parsedQuery.hasFilters === true) {
      query = query.filter(createDynamicFilterFunction(parsedQuery.filters));
    }

    query = query.orderBy('createdAt');
  } else {
    // normal orderBy query
    query = CodeEmbed.orderBy({index: Thinky.r.desc('createdAt')});
  }

  try {
    // ToDo: order requests .orderBy({index: Thinky.r.desc('createdAt')})
    embeds = await query.slice(sliceStart, sliceEnd).getJoin({creator: true}).run();
    if (isSearch) {
      count = await query.count().execute();
    } else {
      count = await CodeEmbed.count().execute();
    }

    response.embeds = embeds;
    response.count = count;

    // calculate the maximum pages, at least 1
    response.pages = Math.ceil(count / limit);

    return response;
  } catch (err) {
    console.error('Api.getEmbeds', err);
    response.error = {
      message: 'Unknown Error',
      type: 'Database',
      error_user_title: 'Fehler',
      error_user_msg: 'Es ist leider ein unbekannter Fehler aufgetreten.'
    };

    return response;
  }
}

export async function getEmbed(request, h) {
  const id = request.params.id;
  const response = { };
  let embed;

  try {
    embed = await CodeEmbed.get(id).run();
    response.embed = embed;
    return response;
  } catch (err) {
    if (err instanceof Errors.DocumentNotFound) {
      console.error('Api.getEmbed', err);
      response.error = {
        message: 'No embed found for this ID.',
        type: 'Database',
        error_user_title: 'Fehler',
        error_user_msg: 'Es existiert kein Embed unter dieser ID.'
      };

      return response;
    }

    console.error('Api.getEmbed', err);
    response.error = {
      message: 'Unknown Error',
      type: 'Database',
      error_user_title: 'Fehler',
      error_user_msg: 'Es ist leider ein unbekannter Fehler aufgetreten.'
    };

    return response;
  }
}