/**
 * API for viewing and editing Courses (Admin Dashboard)
 */
const Course = require('../models/course');

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