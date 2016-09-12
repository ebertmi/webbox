/**
 * Course Controller
 *
 * Handles viewing and editing courses
 */
import Course from '../models/course';
import Document from '../models/document';
import Boom from 'boom';
import { canViewStatistics, isDocumentOwner } from '../roles/documentChecks';
import JWT from 'jsonwebtoken';
import Config from '../../config/webbox.config';

module.exports = {
  overview: function (request, reply) {
    Course.filter({
      published: true
    }).run().then((courses) => {
      reply.view('courseoverview', {
        courses: courses,
        user: request.pre.user
      });
    }).error((err) => {
      console.log(err);
    });
  },
  view: function* (request, reply) {
    // The course object is automatically injected into the request by
    // a prehelper
    const id = request.pre.course.document;

    let document;
    let userData;

    // Check if the user is authenticated or not
    if (request.auth.isAuthenticated === false) {
      userData = {
        isAnonymous: true,
        username: 'anonymous',
        scope: [],
        email: undefined,
        id: undefined
      };
    } else {
      userData = {
        isAnonymous: false,
        username: request.pre.user.username,
        scope: request.pre.user.scope,
        email: request.pre.user.email,
        id: request.pre.user.id
      };
    }

    try {
      // check for uuid
      document = yield Document.get(id).run();

    } catch (e) {
      console.error('course.view', e);
      return reply(Boom.notFound('Das angeforderte Dokument wurde nicht gefunden.'));
    }

    // Check if the course is published
    if (document.published === false) {
      return Boom.notFound('Kurs nicht gefunden oder veröffentlicht.');
    }

    /**
     * ToDo: We could introduce a multi document owner system or even better fine granular permissions
     */
    document.isAuthor = document._creatorId === request.pre.user.id;

    // Right now, every user with the authors permission can view the stats
    let websocketAuthToken = JWT.sign({
      username: userData.username,
      userid: userData.id,
      isAuthor: canViewStatistics(document, request.pre.user),
      isOwner: isDocumentOwner(document, request.pre.user)
    }, Config.websocket.secret, {
      expiresIn: Config.websocket.expiresIn
    });

    return reply.view('notebook', {
      user: request.pre.user,
      INITIAL_DATA:  JSON.stringify(document),
      USER_DATA:  JSON.stringify(userData),
      next: request.path,
      websocket: JSON.stringify({
        server: Config.websocket.url,
        authToken: websocketAuthToken
      })
    });
  },
  create: function* (request, reply) {
    let course;
    let courseObj;
    let redirectPath;

    courseObj = {
      _creatorId: request.pre.user.id,
      slug: '',
      title: 'Neuer Kurs',
      document: '',
      published: false,
      logo: '',
      description: '',
    };

    course = new Course(courseObj);

    // Save the course
    try {
      course = yield course.save(); // save
    } catch (e) {
      console.log(e);
      return reply(Boom.badRequest());
    }

    // Redirect to the admin page for editing the new course
    redirectPath = `/admin/course/${course.id}`;

    // Everything went good, now do a redirect
    return reply.redirect(redirectPath);
  }
};