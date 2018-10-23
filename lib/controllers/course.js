/**
 * Course Controller
 *
 * Handles viewing and editing courses
 */
import Course from '../models/course';
import User from '../models/user';
import Document from '../models/document';
import Boom from 'boom';
import { canViewStatistics, isDocumentOwner, canEditDocument } from '../roles/documentChecks';
import JWT from 'jsonwebtoken';
import { createSourceboxContextData } from '../util/sourceboxUtils';
import Config from '../../config/webbox.config';

module.exports = {
  overview: async function overview (request, h) {
    try {
      const courses = await Course.filter({
        published: true
      }).run();

      return h.view('courseoverview', {
        courses: courses,
        user: request.pre.user
      });
    } catch (err) {
      console.log(err);
    }

    throw Boom.internal('');
  },
  view: async function view (request, h) {
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
      document = await Document.get(id).run();

    } catch (e) {
      console.error('course.view', e);
      return h(Boom.notFound('Das angeforderte Dokument wurde nicht gefunden.'));
    }

    // Check if the course is published
    if (document.published === false) {
      return Boom.notFound('Kurs nicht gefunden oder veröffentlicht.');
    }

    // Update recent documents for signed in users
    if (request.auth.isAuthenticated) {
      User.addRecentDocument({
        id: document.id,
        title: document.metadata.title
      }, request.pre.user.id);
    }

    /**
     * ToDo: We could introduce a multi document owner system or even better fine granular permissions
     */
    document.isAuthor = canEditDocument(document, request.pre.user); //document._creatorId === request.pre.user.id;

    // Right now, every user with the authors permission can view the stats
    let websocketAuthToken = JWT.sign({
      username: userData.username,
      userid: userData.id,
      isAuthor: canViewStatistics(document, request.pre.user),
      isOwner: isDocumentOwner(document, request.pre.user)
    }, Config.websocket.secret, {
      expiresIn: Config.websocket.expiresIn
    });

    // Create sourcebox context data
    let sourcebox = createSourceboxContextData(request.auth.isAuthenticated, userData.username, userData.id);

    return h.view('notebook', {
      user: request.pre.user,
      INITIAL_DATA:  JSON.stringify(document),
      USER_DATA:  JSON.stringify(userData),
      next: request.path,
      websocket: JSON.stringify({
        server: Config.websocket.url,
        authToken: websocketAuthToken
      }),
      sourcebox: JSON.stringify(sourcebox)
    });
  },
  create: async function create (request, h) {
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
      course = await course.save(); // save
    } catch (e) {
      console.log(e);
      return Boom.badRequest();
    }

    // Redirect to the admin page for editing the new course
    redirectPath = `/admin/course/${course.id}`;

    // Everything went good, now do a redirect
    return h.redirect(redirectPath);
  },
  getAutocomplete: async function getAutocomplete () {
    const response = {};
    let coursesInfo;

    try {
      coursesInfo = await Course.pluck('id', 'title', 'slug', 'published').execute();
    } catch (e) {
      console.log(e);
      response.error = 'Failed to retrieve course information.';
      return response;
    }

    response.coursesInfo = coursesInfo;

    return response;
  }
};