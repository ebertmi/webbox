'use strict';
/**
 * Handler prerequisites utils
 *
 * Prerequisites can be plugged into any route and perform
 * fetching from database and additionally work before calling
 * the actual handler.
 */
const Course = require('../models/course');
const AuthAttempt = require('../models/authattempt');
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

    if (!user.isAnonymous) {
      _.assign(user, request.auth.credentials);
      console.info('Authenticated:', request.auth);
    }

    return reply(user);
  },
  detectAbuse: function (request, reply) {
    var ip = request.info.remoteAddress;
    var username = request.payload.username;
    console.info('PreHelpers.detectAbuse', request.auth.isAuthenticated);
    AuthAttempt.detectAbuse(ip, username)
    .then((isAbuse) => {
      if (isAbuse) {
        return reply.view('login',
          {
            user: { isAnonymous: true },
            errorMessage: 'Sie haben sich zu oft mit falschen Daten angemeldet. Um Missbrauch zu vermeiden, wurde ihr Konto gesperrt. Melden Sie sich bitte bei einem Dozenten oder Administrator, um ihr Konto wieder freizuschalten.'
          }).takeover().code(400);
      }

      AuthAttempt.deleteForUsername(username);
      return reply();
    })
    .error((err) => {
      console.error('PreHelpers.detectAbuse', err);
      return reply();
    });
  },
  logAuthAttempt: function (request, reply) {
    const ip = request.info.remoteAddress;
    const username = request.payload.username;

    if (request.auth.isAuthenticated === false) {
      const attempt = new AuthAttempt({
        ip: ip,
        username: username
      });

      // save attempt
      attempt.save().error((err) => {
        console.error('PreHelpers.logAuthAttempt', err);
      });
      return reply();
    } else {
      return reply();
    }
  }
};