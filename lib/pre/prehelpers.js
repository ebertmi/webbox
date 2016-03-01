'use strict';
/**
 * Handler prerequisites utils
 *
 * Prerequisites can be plugged into any route and perform
 * fetching from database and additionally work before calling
 * the actual handler.
 */
const Course = require('../models/course');
const Boom = require('boom');
const _ = require('lodash');

module.exports = {
  getCourse: function (request, reply) {
    const courseName = encodeURIComponent(request.params.course);
    // fetch
    Course.getBySlug(courseName)
    .then((c) => {
      return reply(c);
    })
    .error((err) => {
      console.log(err);
      return reply(Boom.notFound(`Der Kurs ${courseName} wurde nicht gefunden!`));
    });
  },
  isCourseOwner: function (request, reply) {
    if (request.pre.course && request.auth.credentials) {
      const isOwner = request.pre.course._owner === request.auth.credentials.id;
      reply(isOwner);
    }
  },
  getChapter: function (request, reply) {

  },
  getUserInformation: function (request, reply) {
    const user = {
      isAnonymous: !request.auth.isAuthenticated
    };

    if (user.isAnonymous) {
      _.assign(user, request.auth.credentials);
      console.info('Authenticated:', request.auth);
    }

    reply(user);
  }
};