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
      return ['match', '(?i)' + trim(escape(s))];
    }
  },
  'type': {
    field: 'embedType',
    parser: s => {
      return ['match', '(?i)' + trim(escape(s))];
    }
  },
  'slug': {
    field: 'slug',
    parser: s => {
      return ['match', '(?i)' + trim(escape(s))];
    }
  },
  'author': {
    field: 'metadata.author',
    parser: s => {
      return ['match', '(?i)' + trim(escape(s))];
    }
  }
};

export function getDocuments (request, reply) {
  const page = request.query.page;
  const limit = request.query.limit;
  let search = request.query.q;
  const response = {};
  const sliceStart = (page -1) * limit;
  const sliceEnd = sliceStart + limit;
  let documents;

  let isSearch = search !== '';
  let query;

  // handle search query
  if (isSearch) {
    let parsedQuery = parseSearchQuery(search, SEARCH_QUERY_FIELD_MAP);

    search = parsedQuery.search.toLowerCase(); // always lower case
    search = '(?i)' + escape(search); // escape regex special characters

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

  // .orderBy({index: Thinky.r.desc('createdAt')})
  query.slice(sliceStart, sliceEnd).getJoin({creator: true}).run()
  .then(res => {
    documents = res;
    if (isSearch) {
      return query.count().execute();
    } else {
      return Document.count().execute();
    }
  })
  .then(count => {
    response.documents = documents;
    response.count = count;

    // calculate the maximum pages, at least 1
    response.pages = Math.ceil(count / limit);

    return reply(response);
  })
  .error(err => {
    console.error('Api.getDocuments', err);
    response.error = {
      message: 'Unknown Error',
      type: 'Database',
      error_user_title: 'Fehler',
      error_user_msg: 'Es ist leider ein unbekannter Fehler aufgetreten.'
    };

    reply(response);
  });
}

export function getDocument(request, reply) {
  const id = request.params.id;
  const response = { };

  // fetch user and render view
  Document.get(id).run()
  .then(document => {
    response.document = document;
    reply.view(response);
  })
  .error(Errors.DocumentNotFound, err => {
    console.error('Api.getDocument', err);
    response.error = {
      message: 'No document found for this ID.',
      type: 'Database',
      error_user_title: 'Fehler',
      error_user_msg: 'Es existiert kein Dokument unter dieser ID.'
    };

    reply(response);
  })
  .error(err => {
    console.error('Api.getDocument', err);
    response.error = {
      message: 'Unknown Error',
      type: 'Database',
      error_user_title: 'Fehler',
      error_user_msg: 'Es ist leider ein unbekannter Fehler aufgetreten.'
    };

    reply(response);
  });
}