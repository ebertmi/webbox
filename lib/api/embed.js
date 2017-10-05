/**
 * API for viewing and editing Embeds (Admin Dashboard)
 */
import CodeEmbed from '../models/codeEmbed';
import Thinky from '../util/thinky';
const Errors = Thinky.Errors;
import { escape } from '../util/stringUtils';
import { parseSearchQuery, createDynamicFilterFunction } from '../util/databaseUtils';

const SEARCH_QUERY_FIELD_MAP = {
  'language': {
    field: 'meta.language',
    parser: s => {
      return ['match', `(?i)${escape(s)}`];
    }
  },
  'type': {
    field: 'meta.embedType',
    parser: s => {
      return ['match', `(?i)${escape(s)}`];
    }
  },
  'slug': {
    field: 'slug',
    parser: s => {
      return ['match', `(?i)${escape(s)}`];
    }
  }
};

/**
 * Paginated get of all CodeEmbeds with search support.
 *
 * @export
 * @param {any} request - request
 * @param {any} reply - reply
 * @returns {reply} - reply of the request
 */
export function getEmbeds (request, reply) {
  const page = request.query.page;
  const limit = request.query.limit;
  let search = request.query.q;
  const response = {};
  const sliceStart = (page -1) * limit;
  const sliceEnd = sliceStart + limit;
  let embeds;

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

  // ToDo: order requests .orderBy({index: Thinky.r.desc('createdAt')})
  query.slice(sliceStart, sliceEnd).getJoin({creator: true}).run()
    .then(res => {
      embeds = res;

      if (isSearch) {
        return query.count().execute();
      } else {
        return CodeEmbed.count().execute();
      }
    })
    .then(count => {
      response.embeds = embeds;
      response.count = count;

      // calculate the maximum pages, at least 1
      response.pages = Math.ceil(count / limit);

      return reply(response);
    })
    .error(err => {
      console.error('Api.getEmbeds', err);
      response.error = {
        message: 'Unknown Error',
        type: 'Database',
        error_user_title: 'Fehler',
        error_user_msg: 'Es ist leider ein unbekannter Fehler aufgetreten.'
      };

      reply(response);
    });
}

export function getEmbed(request, reply) {
  const id = request.params.id;
  const response = { };

  // fetch user and render view
  CodeEmbed.get(id).run()
    .then(embed => {
      response.embed = embed;
      reply.view(response);
    })
    .error(Errors.DocumentNotFound, err => {
      console.error('Api.getEmbed', err);
      response.error = {
        message: 'No embed found for this ID.',
        type: 'Database',
        error_user_title: 'Fehler',
        error_user_msg: 'Es existiert kein Embed unter dieser ID.'
      };

      reply(response);
    })
    .error(err => {
      console.error('Api.getEmbed', err);
      response.error = {
        message: 'Unknown Error',
        type: 'Database',
        error_user_title: 'Fehler',
        error_user_msg: 'Es ist leider ein unbekannter Fehler aufgetreten.'
      };

      reply(response);
    });
}