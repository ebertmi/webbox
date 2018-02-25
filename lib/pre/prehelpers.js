/**
 * Handler prerequisites utils
 *
 * Prerequisites can be plugged into any route and perform
 * fetching from database and additionally work before calling
 * the actual handler.
 */
import Boom from 'boom';
import assign from 'lodash/assign';

import CodeDocument from '../models/codeDocument';
import CodeEmbed from '../models/codeEmbed';
import Document from '../models/document';
import Course from '../models/course';
import AuthAttempt from '../models/authattempt';
import User from '../models/user';

import { extractClientIp } from '../util/requestUtils';
import { toRelativeDate } from '../util/dateUtils';


module.exports = {
  getCourse: async function getCourse (request) {
    const courseName = encodeURIComponent(request.params.course);
    // fetch

    try {
      const c = await Course.getBySlug(courseName);
      return c;
    } catch (err) {
      console.log(err);
      return Boom.notFound(`Der Kurs ${courseName} wurde nicht gefunden!`);
    }
  },
  isCourseOwner: function isCourseOwner (request, h) {
    if (request.pre.course && request.auth.credentials) {
      const isOwner = request.pre.course._owner === request.auth.credentials.id;
      return isOwner;
    }

    return false;
  },
  getUserInformation: function getUserInformation (request, h) {
    const user = {
      isAnonymous: !request.auth.isAuthenticated,
      scope: [],
      roles: []
    };

    if (!user.isAnonymous) {
      assign(user, request.auth.credentials);
      console.info(`Authenticated "${request.auth.credentials.username}" with roles: ${request.auth.credentials.scope}`);
    }

    return user;
  },
  detectAbuse: async function detectAbuse (request, h) {
    const ip = extractClientIp(request);
    const username = request.payload.username;


    try {
      const isAbuse = await AuthAttempt.detectAbuse(ip, username);
      if (isAbuse === true) {
        return h.view('login',
          {
            user: { isAnonymous: true },
            errorMessage: 'Sie haben sich zu oft mit falschen Daten angemeldet. Um Missbrauch zu vermeiden, wurde ihr Konto gesperrt. Melden Sie sich bitte bei einem Dozenten oder Administrator, um ihr Konto wieder freizuschalten.'
          }).takeover().code(400);
      }
    } catch (err) {
      console.error('PreHelpers.detectAbuse', err);
    }

    return null;
  },
  checkIfEmailExists: function checkIfEmailExists (request, h) {
    const email = request.payload.email;

    try {
      const usr = User.findByEmail(email);

      if (usr != null) {
        const response = {
          errorMessage: 'Diese Adresse wurde bereits verwendet.'
        };

        return h.response(response).takeover().code(409);
      }

      return null;
    } catch (err) {
      console.error('PreHelpers.checkEmail', err);
      const response = {
        errorMessage: 'Fehler bei der Registrierung. Versuchen Sie es erneut.'
      };
      return h.response(response).takeover().code(409);
    }
  },
  isAuthenticatedJsonResponse: function isAuthenticatedJsonResponse (request) {
    if (request.auth.isAuthenticated === false) {
      const response = {
        error: {
          message: 'User is not authenticated.',
          type: 'Authentication',
          error_user_title: 'Fehler',
          error_user_msg: 'Sie sind nicht angemeldet. Bitte laden Sie die Seite neu.'
        }
      };
      return response;
    }

    return null;
  },
  checkAdminRole: function checkAdminRole (request) {
    if (request.auth.isAuthenticated === true && request.auth.credentials.scope.indexOf('admin') !== -1) {
      return true;
    }

    return false;
  },
  getRecentCourses: async function getRecentCourses (request) {
    try {
      const courses = await Course.getRecent(10);
      return courses;
    } catch (err) {
      console.error('PreHelpers.getRecentCourses', err);
      return null;
    }
  },
  getRecentDocuments: async function getRecentDocuments (request) {
    if (request.auth.isAuthenticated === false) {
      // Skip if not authenticated
      return null;
    }

    // ToDo: Sort by date
    const userId = request.auth.credentials.id;
    let recentDocuments = null;

    try {
      recentDocuments = await Document.getRecent(userId, 10);

      for (let doc of recentDocuments) {
        if (doc.metadata.lastUpdate) {
          try {
            doc.metadata.lastUpdate = toRelativeDate(doc.metadata.lastUpdate);
          } catch (e) {
            console.error(`PreHelpers.getRecentDocuments: failed to convert lastUpdate to relative format (id: ${doc.id})`);
          }
        }
      }
    } catch (err) {
      console.error('PreHelpers.getRecentDocuments', err);
    }

    return recentDocuments;
  },
  getRecentCodeDocuments: async function getRecentCodeDocuments (request) {
    if (request.auth.isAuthenticated === false) {
      // Skip if not authenticated
      return null;
    }

    // ToDo: Sort by date
    const userId = request.auth.credentials.id;

    try {
      const cdocs = await CodeDocument.getRecent(userId, 10);
      for (let doc of cdocs) {
        if (doc.lastUpdate) {
          try {
            doc.lastUpdate = toRelativeDate(doc.lastUpdate);
          } catch (e) {
            console.error(`PreHelpers.getRecentDocuments: failed to convert lastUpdate to relative format (id: ${doc.id})`);
          }
        }

        if (doc.embed == null) {
          doc.embed = {
            meta: {
              name: 'Das Beispiel wurde vom Ersteller gelöscht'
            }
          };
        }
      }
      return cdocs;
    } catch (err) {
      console.error('PreHelpers.getRecentCodeDocuments', err);
      return null;
    }
  },
  getRecentCodeEmbeds: async function getRecentCodeEmbeds (request) {
    if (request.auth.isAuthenticated === false) {
      // Skip if not authenticated
      return null;
    }

    const userId = request.auth.credentials.id;

    try {
      const rdocs = await CodeEmbed.getRecent(userId, 10);
      for (let embed of rdocs) {
        if (embed.lastUpdate) {
          try {
            embed.lastUpdate = toRelativeDate(embed.lastUpdate);
          } catch (e) {
            console.error(`PreHelpers.getRecentDocuments: failed to convert lastUpdate to relative format (id: ${embed.id})`);
          }
        }
      }
      return rdocs;
    } catch (err) {
      console.error('PreHelpers.getRecentCodeEmbeds', err);
      return null;
    }
  },
  getRecentlyViewedDocuments: async function getRecentlyViewedDocuments (request) {
    if (request.auth.isAuthenticated === false) {
      // Skip if not authenticated
      return null;
    }

    const userId = request.auth.credentials.id;
    try {
      const user = await User.get(userId);
      return user.recentDocuments;
    } catch (err) {
      console.error('PreHelpers.getRecentlyViewedDocuments', err);
      return null;
    }
  }
};