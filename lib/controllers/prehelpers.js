/**
 * Handler prerequisites utils
 * 
 * Prerequisites can be plugged into any route and perform
 * fetching from database and additionally work before calling
 * the actual handler.
 */
const Course = require('../models/course');
const Boom = require('boom');

module.exports = {
  getCourse: function (request, reply) {
    const courseName = encodeURIComponent(request.params.course);
    console.log('Params in pre: ', request.params);
    // fetch
    Course.getById(courseName)
    .then((c) => {
      return reply(c);
    })
    .error(() => {
      return reply(Boom.notFound(`Der Kurs ${courseName} wurde nicht gefunden!`));
    });
  },
  getChapter: function (request, reply) {
    
  }
};