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

export async function getCourses (request, h) {
  const page = request.query.page;
  const limit = request.query.limit;
  let search = request.query.q;
  const response = {};
  const sliceStart = (page -1) * limit;
  const sliceEnd = sliceStart + limit;

  const isSearch = search !== '';
  let query;
  let count;

  // handle search query
  if (isSearch) {
    const parsedQuery = parseSearchQuery(search, SEARCH_QUERY_FIELD_MAP);

    search = parsedQuery.search.toLowerCase(); // always lower case
    search = `(?i)${escape(search)}`; // escape regex special characters

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

  try {
    const courses = await query.slice(sliceStart, sliceEnd).run();
    response.courses = courses;

    if (isSearch) {
      count = await query.count().execute();
    } else {
      count = await Course.count().execute();
    }

    response.count = count;

    return response;
  } catch (err) {
    console.error('Api.getCourses', err);
    response.error = {
      message: 'Unbekannter Datenbankfehler.',
      type: 'Database'
    };

    return response;
  }
}

export async function getCourse (request, h) {
  const id = request.params.id;
  const response = {};

  try {
    const course = await Course.get(id).run();
    response.course = course;
    return response;
  } catch (err) {
    if (err instanceof Errors.DocumentNotFound) {
      response.error = {
        message: 'No course found for this ID.',
        type: 'Database',
        error_user_title: 'Fehler',
        error_user_msg: 'Es existiert kein Kurs unter dieser ID.'
      };

      return h.response(response).code(400);
    } else {
      // all other
      console.error('Api.getCourse', err);
      response.error = {
        message: 'Unbekannter Datenbankfehler.',
        type: 'Database'
      };

      return h.response(response).code(500);
    }
  }
}

export async function deleteCourse (request, h) {
  const id = request.params.id;
  const response = {};
  let title;

  try {
    const course = await Course.get(id).run();
    // we need to add the deleted course to the recyclebin
    RecycleBin.addEntry(course, 'Course', request.auth.credentials.id);

    title = course.title;
    await course.delete();

    Log.createLog('API.Course', 'Course deleted.', {
      id: id,
      title: title
    }, 'Info');

    return response;
  } catch (err) {
    if (err instanceof Errors.DocumentNotFound) {
      response.error = {
        message: 'No course found for this ID.',
        type: 'Database',
        error_user_title: 'Fehler',
        error_user_msg: 'Es existiert kein Benutzer unter dieser ID.'
      };

      return h.response(response).code(400);
    } else {
      console.log('API.deleteCourse', err);
      response.error = {
        message: 'Unbekannter Datenbankfehler.',
        type: 'Database'
      };

      return h.response(response).code(500);
    }
  }
}

export async function saveCourse (request, h) {
  const id = request.params.id;
  const payload = request.payload.course;
  const response = {};

  try {
    const course = await Course.get(id).run();
    // update course
    delete payload.id;
    delete payload.isDirty;
    delete payload.isDeleted;

    // ToDo: validation!!!!!

    await course.merge(payload).save();

    response.course = course;
    return response;
  } catch (err) {
    if (err instanceof Errors.ValidationError) {
      console.log('API.saveCourse', err);
      response.error = {
        message: 'Received invalid payload data.',
        type: 'Validation',
        error_user_title: 'Fehler',
        error_user_msg: 'Ungültige Anfrage-Daten.'
      };

      return h.response(response).code(400);
    } else if (err instanceof Errors.DocumentNotFound) {
      response.error = {
        message: 'No course found for this ID.',
        type: 'Database',
        error_user_title: 'Fehler',
        error_user_msg: 'Es existiert kein Benutzer unter dieser ID.'
      };

      return h.response(response).code(400);
    } else {
      console.log('API.saveCourse', err);
      response.error = {
        message: 'Unbekannter Datenbankfehler.',
        type: 'Database'
      };

      return h.response(response).code(500);
    }
  }
}