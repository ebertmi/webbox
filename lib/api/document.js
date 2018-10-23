/**
 * API for viewing and editing Embeds (Admin Dashboard)
 */
import trim from 'lodash/trim';
import Document from '../models/document';
import Thinky from '../util/thinky';
const Errors = Thinky.Errors;
import { escape } from '../util/stringUtils';
import { parseSearchQuery, createDynamicFilterFunction } from '../util/databaseUtils';

const SEARCH_QUERY_FIELD_MAP = {
  'language': {
    field: 'metadata.language_info.name',
    parser: s => {
      return ['match', `(?i)${trim(escape(s))}`];
    }
  },
  'type': {
    field: 'embedType',
    parser: s => {
      return ['match', `(?i)${trim(escape(s))}`];
    }
  },
  'slug': {
    field: 'slug',
    parser: s => {
      return ['match', `(?i)${trim(escape(s))}`];
    }
  },
  'author': {
    field: 'metadata.author',
    parser: s => {
      return ['match', `(?i)${trim(escape(s))}`];
    }
  }
};

export async function getDocuments (request, h) {
  const page = request.query.page;
  const limit = request.query.limit;
  let search = request.query.q;
  const response = {};
  const sliceStart = (page -1) * limit;
  const sliceEnd = sliceStart + limit;
  let documents;
  let count;
  const isSearch = search !== '';
  let query;

  // handle search query
  if (isSearch) {
    const parsedQuery = parseSearchQuery(search, SEARCH_QUERY_FIELD_MAP);

    search = parsedQuery.search.toLowerCase(); // always lower case
    search = `(?i)${escape(search)}`; // escape regex special characters

    query = Document.filter(embed => {
      return embed('metadata')('title').match(search);
    });

    if (parsedQuery.hasFilters === true) {
      query = query.filter(createDynamicFilterFunction(parsedQuery.filters));
    }

    query = query.orderBy('createdAt');
  } else {
    // normal orderBy query
    query = Document.orderBy({index: Thinky.r.desc('createdAt')});
  }

  try {
    // .orderBy({index: Thinky.r.desc('createdAt')})
    documents = await query.slice(sliceStart, sliceEnd).getJoin({creator: true}).run();
    if (isSearch) {
      count = await query.count().execute();
    } else {
      count = await Document.count().execute();
    }
    response.documents = documents;
    response.count = count;

    // calculate the maximum pages, at least 1
    response.pages = Math.ceil(count / limit);

    return response;
  } catch (err) {
    console.error('Api.getDocuments', err);
    response.error = {
      message: 'Unknown Error',
      type: 'Database',
      error_user_title: 'Fehler',
      error_user_msg: 'Es ist leider ein unbekannter Fehler aufgetreten.'
    };

    return response;
  }
}

export async function getDocument(request, h) {
  const id = request.params.id;
  const response = { };
  let document;

  try {
    // fetch user and render view
    document = await Document.get(id).run();
    response.document = document;
    return response;
  } catch (err) {
    if (err instanceof Errors.DocumentNotFound) {
      console.error('Api.getDocument', err);
      response.error = {
        message: 'No document found for this ID.',
        type: 'Database',
        error_user_title: 'Fehler',
        error_user_msg: 'Es existiert kein Dokument unter dieser ID.'
      };

      return response;
    }

    console.error('Api.getDocument', err);
    response.error = {
      message: 'Unknown Error',
      type: 'Database',
      error_user_title: 'Fehler',
      error_user_msg: 'Es ist leider ein unbekannter Fehler aufgetreten.'
    };

    return response;
  }
}