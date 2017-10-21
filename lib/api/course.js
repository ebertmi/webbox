/**
 * API for viewing and editing Courses (Admin Dashboard)
 */
import trim from 'lodash/trim';
import Course from '../models/course';
import RecycleBin from '../models/recyclebin';
import Log from '../models/log';
import Thinky from '../util/thinky';
const Errors = Thinky.Errors;
import { escape, toBoolean } from '../util/stringUtils';
import { parseSearchQuery, createDynamicFilterFunction } from '../util/databaseUtils';

const SEARCH_QUERY_FIELD_MAP = {
  'published': {
    field: 'published',
    parser: toBoolean
  },
  'description': {
    field: 'description',
    parser: s => {
      return ['match', '(?i)' + trim(escape(s))];
    }
  },
  'slug': {
    field: 'slug',
    parser: s => {
      return ['match', '(?i)' + trim(escape(s))];
    }
  }
};

export function getCourses (request, reply) {
  const page = request.query.page;
  const limit = request.query.limit;
  let search = request.query.q;
  const response = {};
  const sliceStart = (page -1) * limit;
  const sliceEnd = sliceStart + limit;

  let isSearch = search !== '';
  let query;

  // handle search query
  if (isSearch) {
    let parsedQuery = parseSearchQuery(search, SEARCH_QUERY_FIELD_MAP);

    search = parsedQuery.search.toLowerCase(); // always lower case
    search = '(?i)' + escape(search); // escape regex special characters

    query = Course.filter(embed => {
      return embed('title').match(search);
    });

    if (parsedQuery.hasFilters === true) {
      query = query.filter(createDynamicFilterFunction(parsedQuery.filters));
    }

    query = query.orderBy('createdAt');
  } else {
    // normal orderBy query
    query = Course.orderBy({index: Thinky.r.desc('createdAt')});
  }

  query.slice(sliceStart, sliceEnd).run()
  .then(courses => {
    response.courses = courses;

    if (isSearch) {
      return query.count().execute();
    } else {
      return Course.count().execute();
    }
  }).then(count => {
    response.count = count;

    return reply(response);
  })
  .error(err => {
    console.error('Api.getCourses', err);
    response.error = {
      message: 'Unbekannter Datenbankfehler.',
      type: 'Database'
    };

    reply(response);
  });
}

export function* getCourse (request, reply) {
  const id = request.params.id;
  const response = {};

  try {
    let course = yield Course.get(id).run();
    response.course = course;
    return reply(response);
  } catch (err) {
    if (err instanceof Errors.DocumentNotFound) {
      response.error = {
        message: 'No course found for this ID.',
        type: 'Database',
        error_user_title: 'Fehler',
        error_user_msg: 'Es existiert kein Kurs unter dieser ID.'
      };

      return yield reply(response).code(400);
    } else {
      // all other
      console.error('Api.getCourse', err);
      response.error = {
        message: 'Unbekannter Datenbankfehler.',
        type: 'Database'
      };

      return reply(response).code(500);
    }
  }
}

export function deleteCourse (request, reply) {
  const id = request.params.id;
  const response = {};
  let title;

  Course.get(id).run()
  .then(course => {
    // we need to add the deleted course to the recyclebin
    RecycleBin.addEntry(course, 'Course', request.auth.credentials.id);

    title = course.title;
    return course.delete();
  })
  .then(() => {
    Log.createLog('API.Course', 'Course deleted.', {
      id: id,
      title: title
    }, 'Info');
    return reply(response);
  })
  .catch(Errors.DocumentNotFound, () => {
    response.error = {
      message: 'No course found for this ID.',
      type: 'Database',
      error_user_title: 'Fehler',
      error_user_msg: 'Es existiert kein Benutzer unter dieser ID.'
    };

    return reply(response).code(400);
  })
  .error(err => {
    console.log('API.deleteCourse', err);
    response.error = {
      message: 'Unbekannter Datenbankfehler.',
      type: 'Database'
    };

    return reply(response).code(500);
  });
}

export function saveCourse (request, reply) {
  const id = request.params.id;
  const payload = request.payload.course;
  const response = {};

  Course.get(id).run()
  .then(course => {
    // update course
    delete payload.id;
    delete payload.isDirty;
    delete payload.isDeleted;

    // ToDo: validation!!!!!

    return course.merge(payload).save();
  })
  .then(res => {
    response.course = res;
    reply(response);
  })
  .catch(Errors.ValidationError, (err) => {
    console.log('API.saveCourse', err);
    response.error = {
      message: 'Received invalid payload data.',
      type: 'Validation',
      error_user_title: 'Fehler',
      error_user_msg: 'Ungültige Anfrage-Daten.'
    };

    reply(response).code(400);
  })
  .catch(Errors.DocumentNotFound, () => {
    response.error = {
      message: 'No course found for this ID.',
      type: 'Database',
      error_user_title: 'Fehler',
      error_user_msg: 'Es existiert kein Benutzer unter dieser ID.'
    };

    reply(response).code(400);
  })
  .error(err => {
    console.log('API.saveCourse', err);
    response.error = {
      message: 'Unbekannter Datenbankfehler.',
      type: 'Database'
    };

    reply(response).code(500);
  });
}