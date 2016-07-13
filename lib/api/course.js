/**
 * API for viewing and editing Courses (Admin Dashboard)
 */
import Course from '../models/course';
import Log from '../models/log';
import Thinky from '../util/thinky';
const Errors = Thinky.Errors;

export function getCourses (request, reply) {
  const page = request.query.page;
  const limit = request.query.limit;
  const response = {};
  const sliceStart = (page -1) * limit;
  const sliceEnd = sliceStart + limit;

  Course.orderBy({index: 'slug'}).slice(sliceStart, sliceEnd).run()
  .then(courses => {
    response.courses = courses;
    reply(response);
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