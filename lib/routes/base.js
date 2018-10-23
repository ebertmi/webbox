/**
 * This file contains all base routes.
 */

import Joi from 'joi';
import PreHelpers from '../pre/prehelpers';
import Pages from '../controllers/pages';
import Auth from '../controllers/auth';
import Course from '../controllers/course';
import Media from '../controllers/media';
import * as Embed from '../controllers/embed';
import Document from '../controllers/document';
import Dashboard from '../controllers/dashboard';
import config from '../../config/webbox.config';

const ROUTE_SECURITY = config.security;

import { validationfailAction } from '../util/requestUtils';

module.exports = [
  {
    method: 'GET',
    path: '/',
    handler: Pages.index,
    config: {
      id: 'index',
      auth: {
        mode: 'try',
        strategy: 'session'
      },
      plugins: {
        'hapi-auth-cookie': {
          redirectTo: false
        },
        'hapi-rate-limit': {
          pathLimit: false,
          userLimit: false
        }
      },
      pre: [
        {
          method: PreHelpers.getUserInformation,
          assign: 'user'
        }, {
          method: PreHelpers.checkAdminRole,
          assign: 'isAdmin'
        },
        [
          {
            method: PreHelpers.getRecentDocuments,
            assign: 'documents'
          },
          {
            method: PreHelpers.getRecentCodeDocuments,
            assign: 'codeDocuments'
          },
          {
            method: PreHelpers.getRecentCodeEmbeds,
            assign: 'embeds'
          }, {
            method: PreHelpers.getRecentCourses,
            assign: 'courses'
          }, {
            method: PreHelpers.getRecentlyViewedDocuments,
            assign: 'recentlyViewedDocuments'
          }
        ]
      ],
      security: ROUTE_SECURITY
    }
  },{
    method: 'GET',
    path: '/profile',
    handler: Pages.profile,
    config: {
      id: 'profile',
      auth: {
        mode: 'try',
        scope: 'user'
      },
      plugins: {
        'hapi-rate-limit': {
          pathLimit: false,
          userLimit: false
        }
      },
      pre: [
        {
          method: PreHelpers.getUserInformation,
          assign: 'user'
        }, {
          method: PreHelpers.checkAdminRole,
          assign: 'isAdmin'
        }
      ],
      security: ROUTE_SECURITY
    }
  }, {
    method: 'GET',
    path: '/p/{idOrSlug}/{slide?}',
    handler: Document.getPresentation,
    config: {
      id: 'presentation',
      pre: [
        {
          method: PreHelpers.getUserInformation,
          assign: 'user'
        }
      ],
      validate: {
        params: {
          idOrSlug: Joi.string().min(3).required(),
          slide: Joi.number().optional()
        }
      },
      auth: {
        mode: 'try',
        scope: 'user'
      },
      plugins: {
        'hapi-auth-cookie': {
          redirectTo: false
        },
        'hapi-rate-limit': {
          pathLimit: false
        }
      },
      security: ROUTE_SECURITY
    }
  }, {
    method: 'GET',
    path: '/d/{idOrSlug}',
    handler: Document.getDocument,
    config: {
      id: 'document',
      pre: [
        {
          method: PreHelpers.getUserInformation,
          assign: 'user'
        }
      ],
      validate: {
        params: {
          idOrSlug: Joi.string().min(3).required()
        }
      },
      auth: {
        mode: 'try',
        scope: 'user'
      },
      plugins: {
        'hapi-auth-cookie': {
          redirectTo: false
        },
        'hapi-rate-limit': {
          pathLimit: false
        }
      },
      security: ROUTE_SECURITY
    }
  }, {
    method: 'GET',
    path: '/documents',
    handler: Document.getDocumentsForUser,
    config: {
      id: 'document_list',
      pre: [
        {
          method: PreHelpers.getUserInformation,
          assign: 'user'
        }
      ],
      validate: {
      },
      auth: {
        mode: 'try',
        scope: 'user'
      },
      security: ROUTE_SECURITY
    }
  }, {
    method: 'GET',
    path: '/export/d/{idOrSlug}',
    handler: Document.exportDocument,
    config: {
      id: 'export_document',
      pre: [
        {
          method: PreHelpers.getUserInformation,
          assign: 'user'
        }
      ],
      validate: {
        params: {
          idOrSlug: Joi.string().min(3).required()
        }
      },
      auth: {
        mode: 'try',
        scope: 'user'
      },
      security: ROUTE_SECURITY
    }
  }, {
    method: 'PUT',
    path: '/d/{idOrSlug}',
    handler: Document.saveDocument,
    config: {
      id: 'save_document',
      pre: [
        {
          method: PreHelpers.getUserInformation,
          assign: 'user'
        }
      ],
      validate: {
        params: {
          idOrSlug: Joi.string().min(3).required()
        },
        payload: {
          document: Joi.object().required()
        }
      },
      auth: {
        mode: 'try',
        scope: 'author'
      },
      plugins: {
        'hapi-auth-cookie': {
          redirectTo: false
        }
      },
      security: ROUTE_SECURITY
    }
  }, {
    method: 'DELETE',
    path: '/d/{idOrSlug}',
    handler: Document.deleteDocument,
    config: {
      id: 'delete_document',
      pre: [
        {
          method: PreHelpers.getUserInformation,
          assign: 'user'
        }
      ],
      validate: {
        params: {
          idOrSlug: Joi.string().min(3).required()
        }
      },
      auth: {
        mode: 'try',
        scope: 'author'
      },
      plugins: {
        'hapi-auth-cookie': {
          redirectTo: false
        }
      },
      security: ROUTE_SECURITY
    }
  }, {
    method: 'POST',
    path: '/document/create',
    handler: Document.createDocument,
    config: {
      id: 'create_document',
      pre: [
        {
          method: PreHelpers.getUserInformation,
          assign: 'user'
        }
      ],
      auth: {
        mode: 'try',
        scope: 'author'
      },
      security: ROUTE_SECURITY
    }
  }, {
    method: 'GET',
    path: '/course/create',
    handler: Course.create,
    config: {
      id: 'create_course',
      pre: [
        {
          method: PreHelpers.getUserInformation,
          assign: 'user'
        }
      ],
      auth: {
        mode: 'try',
        scope: 'admin'
      },
      security: ROUTE_SECURITY
    }
  }, {
    method: 'GET',
    path: '/course/{course}',
    handler: Course.view,
    config: {
      id: 'course',
      pre: [
        {
          method: PreHelpers.getCourse,
          assign: 'course'
        }, {
          method: PreHelpers.getUserInformation,
          assign: 'user'
        }
      ],
      validate: {
        params: {
          course: Joi.string().min(3).required()
        }
      },
      auth: {
        mode: 'try',
        scope: 'user'
      },
      plugins: {
        'hapi-auth-cookie': {
          redirectTo: false
        }
      },
      security: ROUTE_SECURITY
    }
  }, {
    method: 'GET',
    path: '/autocomplete/course',
    handler: Course.getAutocomplete,
    config: {
      id: 'autocomplete-course',
      pre: [
        {
          method: PreHelpers.getUserInformation,
          assign: 'user'
        }
      ],
      validate: {
        query: {
          search: Joi.string().min(3).optional()
        }
      },
      auth: {
        scope: 'author'
      },
      plugins: {
        'hapi-auth-cookie': {
          redirectTo: false
        }
      },
      security: ROUTE_SECURITY
    }
  }, {
    method: 'GET',
    path: '/autocomplete/embed',
    handler: Embed.getAutocomplete,
    config: {
      id: 'autocomplete-embed',
      pre: [
        {
          method: PreHelpers.getUserInformation,
          assign: 'user'
        }
      ],
      auth: {
        scope: 'author'
      },
      plugins: {
        'hapi-auth-cookie': {
          redirectTo: false
        }
      },
      security: ROUTE_SECURITY
    }
  }, {
    method: 'GET',
    path: '/login',
    handler: Auth.loginview,
    config: {
      id: 'login',
      auth: {
        mode: 'try',
        strategy: 'session'
      },
      plugins: {
        'hapi-auth-cookie': {
          redirectTo: false
        }
      },
      pre: [
        {
          method: PreHelpers.getUserInformation,
          assign: 'user'
        }
      ],
      security: Object.assign({}, ROUTE_SECURITY, {
        xframe: 'sameorigin'
      })
    }
  }, {
    method: 'GET',
    path: '/courseoverview',
    handler: Course.overview,
    config: {
      id: 'courseoverview',
      auth: {
        mode: 'try',
        strategy: 'session'
      },
      plugins: {
        'hapi-auth-cookie': {
          redirectTo: false
        }
      },
      pre: [
        {
          method: PreHelpers.getUserInformation,
          assign: 'user'
        }
      ],
      security: ROUTE_SECURITY
    }
  }, {
    method: 'GET',
    path: '/images/{document}',
    handler: Media.getImagesFromDocument,
    config: {
      id: 'image_document_get',
      auth: {
        mode: 'try',
        strategy: 'session',
        scope: 'user' /* TODO: change this later on depending on type */
      },
      validate: {
        params: {
          document: Joi.string().regex(/^[a-z0-9-]+$/).required()
        }
      },
      pre: [
        {
          method: PreHelpers.getUserInformation,
          assign: 'user'
        }
      ],
      security: ROUTE_SECURITY
    }
  }, {
    method: 'POST',
    path: '/mediaupload',
    handler: Media.imageupload,
    config: {
      id: 'mediaupload',
      auth: {
        mode: 'try',
        strategy: 'session',
        scope: 'user' /* TODO: change this later on depending on type */
      },
      payload: {
        maxBytes: config.media.maxBytes,
        output: 'stream',
        parse: true,
        allow: 'multipart/form-data'
      },
      validate: {
        payload: {
          imageFile: Joi.any().required(),
          document: Joi.string().required(),
          headers: {
            'content-type' : Joi.string().valid(['image/jpeg', 'image/png', 'image/jpg']).required()
          }
        }
      },
      pre: [
        {
          method: PreHelpers.getUserInformation,
          assign: 'user'
        }
      ],
      security: ROUTE_SECURITY
    }
  }, {
    method: 'GET',
    path: '/impressum',
    handler: Pages.imprint,
    config: {
      auth: {
        mode: 'try',
        strategy: 'session'
      },
      id: 'imprint',
      pre: [
        {
          method: PreHelpers.getUserInformation,
          assign: 'user'
        }
      ],
      plugins: {
        'hapi-auth-cookie': {
          redirectTo: false
        }
      },
      security: ROUTE_SECURITY
    }
  }, {
    method: 'GET',
    path: '/datenschutz',
    handler: Pages.privacy,
    config: {
      auth: {
        mode: 'try',
        strategy: 'session'
      },
      id: 'privacy',
      pre: [
        {
          method: PreHelpers.getUserInformation,
          assign: 'user'
        }
      ],
      plugins: {
        'hapi-auth-cookie': {
          redirectTo: false
        }
      },
      security: ROUTE_SECURITY
    }
  }, {
    method: 'GET',
    path: '/embeds',
    handler: Embed.getEmbedsForUser,
    config: {
      id: 'embed_list',
      pre: [
        {
          method: PreHelpers.getUserInformation,
          assign: 'user'
        }
      ],
      validate: {
      },
      auth: {
        mode: 'try',
        scope: 'user'
      },
      security: ROUTE_SECURITY
    }
  }, {
    method: 'GET',
    path: '/codedocuments',
    handler: Embed.getCodeDocumentsForUser,
    config: {
      id: 'codedocument_list',
      pre: [
        {
          method: PreHelpers.getUserInformation,
          assign: 'user'
        }
      ],
      validate: {
      },
      auth: {
        mode: 'try',
        scope: 'user'
      },
      security: ROUTE_SECURITY
    }
  }, {
    method: 'GET',
    path: '/embed/{id}',
    handler: Embed.getEmbed,
    config: {
      auth: {
        mode: 'try',
        scope: 'user' /* TODO: change this later on depending on type */
      },
      plugins: {
        'hapi-auth-cookie': {
          redirectTo: false
        }
      },
      cors: { origin: ['*'] },
      id: 'embed_with_id',
      pre: [
        {
          method: PreHelpers.getUserInformation,
          assign: 'user'
        }
      ],
      validate: {
        params: {
          id: [Joi.string().guid().required(), Joi.string().required()],
        },
        query: {
          showDocument: Joi.string().guid().optional(),
          showOriginal: Joi.boolean().optional().default(false, 'Let internal logic decide')
        }
      },
      security: Object.assign({}, ROUTE_SECURITY, {
        xframe: false /*TODO: 'sameorigin'*/
      })
    }
  }, {
    method: 'GET',
    path: '/embed-ajax/{id}',
    handler: Embed.getEmbedAjax,
    config: {
      auth: {
        mode: 'try',
        scope: 'user'
      },
      plugins: {
        'hapi-auth-cookie': {
          redirectTo: false
        }
      },
      cors: { origin: ['*'] },
      id: 'embed_ajax_with_id',
      pre: [
        {
          method: PreHelpers.getUserInformation,
          assign: 'user'
        }
      ],
      validate: {
        params: {
          id: [Joi.string().guid().required(), Joi.string().required()],
        },
        query: {
          showDocument: Joi.string().guid().optional(),
          showOriginal: Joi.boolean().optional().default(false, 'Let internal logic decide')
        }
      },
      security: Object.assign({}, ROUTE_SECURITY, {
        xframe: false /*TODO: 'sameorigin'*/
      })
    }
  }, {
    method: 'GET',
    path: '/embed-metadata-ajax/{id}',
    handler: Embed.getEmbedMetadataAjax,
    config: {
      auth: {
        mode: 'try',
        scope: 'user'
      },
      plugins: {
        'hapi-auth-cookie': {
          redirectTo: false
        }
      },
      cors: { origin: ['*'] },
      id: 'embed_metadata-ajax_with_id',
      pre: [
        {
          method: PreHelpers.getUserInformation,
          assign: 'user'
        }
      ],
      validate: {
        params: {
          id: [Joi.string().guid().required(), Joi.string().required()],
        }
      },
      security: Object.assign({}, ROUTE_SECURITY, {
        xframe: false /*TODO: 'sameorigin'*/
      })
    }
  }, {
    method: 'GET',
    path: '/run',
    handler: Embed.runEmbed,
    config: {
      auth: {
        mode: 'try',
        scope: 'user' /* TODO: change this later on depending on type */
      },
      id: 'embed_run',
      pre: [
        {
          method: PreHelpers.getUserInformation,
          assign: 'user'
        }
      ],
      validate: {
        query: {
          code: Joi.string().allow('').default(''),
          language: Joi.string().required(),
          id: Joi.string().optional(),
          embedType: Joi.string().optional()
        },
        failAction: validationfailAction
      },
      security: ROUTE_SECURITY
    }
  }, {
    method: 'PUT',
    path: '/embed/save/{id}',
    handler: Embed.saveEmbed,
    config: {
      auth: {
        mode: 'try',
        strategy: 'session',
        scope: 'user' /* TODO: change this later on depending on type */
      },
      id: 'save_embed_with_id',
      pre: [
        {
          method: PreHelpers.getUserInformation,
          assign: 'user'
        }
      ],
      validate: {
        params: {
          id: Joi.string().guid().required()
        },
        payload: {
          data: Joi.object().required()
        },
        failAction: validationfailAction
      },
      plugins: {
        'hapi-auth-cookie': {
          redirectTo: false
        },
        'crumb': {
          restful: true
        }
      }
    }
  }, {
    method: 'POST',
    path: '/embed/create/',
    handler: Embed.createEmbed,
    config: {
      auth: {
        mode: 'try',
        strategy: 'session',
        scope: 'author'
      },
      id: 'create_embed',
      pre: [
        {
          method: PreHelpers.getUserInformation,
          assign: 'user'
        }
      ],
      validate: {
        payload: {
          embedType: Joi.string().required(),
          language: Joi.string().required(),
          name: Joi.string().required()
        },
        failAction: validationfailAction
      },
      plugins: {
        'hapi-auth-cookie': {
          redirectTo: false
        },
        'crumb': {
          restful: true
        }
      },
      security: ROUTE_SECURITY
    }
  }, {
    method: 'POST',
    path: '/embed/redirectcreate',
    handler: Embed.createEmbedAndRedirect,
    config: {
      auth: {
        mode: 'try',
        strategy: 'session',
        scope: 'author'
      },
      id: 'create_and_redirect_embed',
      pre: [
        {
          method: PreHelpers.getUserInformation,
          assign: 'user'
        }
      ],
      validate: {
        payload: {
          embedType: Joi.string().required(),
          language: Joi.string().required(),
          name: Joi.string().required()
        },
        failAction: validationfailAction
      },
      plugins: {
        'hapi-auth-cookie': {
          redirectTo: true
        }
      },
      security: ROUTE_SECURITY
    }
  }, {
    method: 'PUT',
    path: '/embed/update/{id}',
    handler: Embed.updateEmbed,
    config: {
      auth: {
        mode: 'try',
        strategy: 'session',
        scope: 'author'
      },
      id: 'update_embed',
      pre: [
        {
          method: PreHelpers.getUserInformation,
          assign: 'user'
        }
      ],
      validate: {
        params: {
          id: Joi.string().guid().required()
        },
        payload: {
          data: Joi.object().required()
        },
        failAction: validationfailAction
      },
      plugins: {
        'hapi-auth-cookie': {
          redirectTo: false
        },
        'crumb': {
          restful: true
        }
      },
      security: ROUTE_SECURITY
    }
  }, {
    method: 'DELETE',
    path: '/embed/{idOrSlug}',
    handler: Embed.deleteEmbed,
    config: {
      id: 'delete_embed',
      pre: [
        {
          method: PreHelpers.getUserInformation,
          assign: 'user'
        }
      ],
      validate: {
        params: {
          idOrSlug: Joi.string().min(3).required()
        }
      },
      auth: {
        mode: 'try',
        scope: 'author'
      },
      plugins: {
        'hapi-auth-cookie': {
          redirectTo: false
        }
      },
      security: ROUTE_SECURITY
    }
  }, {
    method: 'GET',
    path: '/embed/statistics/{idOrSlug}',
    handler: Embed.exportStatistics,
    config: {
      id: 'export_statistics',
      pre: [
        {
          method: PreHelpers.getUserInformation,
          assign: 'user'
        }
      ],
      validate: {
        params: {
          idOrSlug: Joi.string().min(3).required()
        }
      },
      auth: {
        mode: 'try',
        scope: 'user'
      },
      security: ROUTE_SECURITY
    }
  }, {
    method: 'POST',
    path: '/signup',
    handler: Auth.signup,
    config: {
      validate: {
        payload: {
          email: Joi.string().email().required(),
          password: Joi.string().min(6).max(30).required(),
          password_repeat: Joi.string().min(6).max(30).required(),
          semester: Joi.string().required(),
          terms: Joi.string().required()
        },
        failAction: validationfailAction
      },
      auth: {
        mode: 'try',
        strategy: 'session'
      },
      plugins: {
        'hapi-auth-cookie': {
          redirectTo: false
        }
      },
      id: 'signup',
      pre: [
        {
          method: PreHelpers.getUserInformation,
          assign: 'user'
        }
      ],
      security: ROUTE_SECURITY
    }
  }, {
    method: 'GET',
    path: '/signup',
    handler: Auth.signupRedirect,
    config: {
      auth: {
        mode: 'try',
        strategy: 'session'
      },
      plugins: {
        'hapi-auth-cookie': {
          redirectTo: false
        }
      },
      id: 'signup_redirect',
      pre: [
        {
          method: PreHelpers.getUserInformation,
          assign: 'user'
        }
      ],
      security: ROUTE_SECURITY,
      description: 'Redirects get requests to /signup to the index page'
    }
  }, {
    method: 'GET',
    path: '/confirm/{token}',
    handler: Auth.confirm,
    config: {
      validate: {
        params: {
          token: Joi.string().required()
        },
        failAction: function (request, h) {
          return h.view('index', {
            user: {
              isAnonymous: true
            },
            errorMessage: 'Ungültige Anfrage'
          });
        }
      },
      auth: {
        mode: 'try',
        strategy: 'session'
      },
      plugins: {
        'hapi-auth-cookie': {
          redirectTo: false
        }
      },
      id: 'confirm',
      pre: [
        {
          method: PreHelpers.getUserInformation,
          assign: 'user'
        }
      ],
      security: ROUTE_SECURITY
    }
  },{
    method: 'GET',
    path: '/forgot',
    handler: Auth.forgotPasswordView,
    config: {
      auth: {
        mode: 'try',
        strategy: 'session'
      },
      plugins: {
        'hapi-auth-cookie': {
          redirectTo: false
        }
      },
      id: 'forgotview',
      pre: [
        {
          method: PreHelpers.getUserInformation,
          assign: 'user'
        }
      ],
      security: ROUTE_SECURITY
    }
  }, {
    method: 'POST',
    path: '/forgot',
    handler: Auth.forgotPassword,
    config: {
      validate: {
        payload: {
          email: Joi.string().email().required()
        },
        failAction: function (request, h) {
          return h.view('index', {
            user: {
              isAnonymous: true
            },
            errorMessage: 'Bitte füllen Sie alle benötigten Eingabefelder aus.'
          });
        }
      },
      auth: {
        mode: 'try',
        strategy: 'session'
      },
      plugins: {
        'hapi-auth-cookie': {
          redirectTo: false
        }
      },
      id: 'forgot',
      pre: [
        {
          method: PreHelpers.getUserInformation,
          assign: 'user'
        }
      ],
      security: ROUTE_SECURITY
    }
  }, {
    method: 'GET',
    path: '/reset/{token}',
    handler: Auth.resetPasswordView,
    config: {
      validate: {
        params: {
          token: Joi.string().required()
        },
        failAction: function (request, h) {
          return h.view('index', {
            user: {
              isAnonymous: true
            },
            errorMessage: 'Ungültige Anfrage.'
          });
        }
      },
      auth: {
        mode: 'try',
        strategy: 'session'
      },
      plugins: {
        'hapi-auth-cookie': {
          redirectTo: false
        }
      },
      id: 'resetview',
      pre: [
        {
          method: PreHelpers.getUserInformation,
          assign: 'user'
        }
      ],
      security: ROUTE_SECURITY
    }
  }, {
    method: 'POST',
    path: '/reset',
    handler: Auth.reset,
    config: {
      validate: {
        payload: {
          token: Joi.string().required(),
          password: Joi.string().required()
        },
        failAction: function (request, h) {
          return h.view('index', {
            user: {
              isAnonymous: true
            },
            errorMessage: 'Bitte füllen Sie alle benötigten Eingabefelder aus.'
          });
        }
      },
      auth: {
        mode: 'try',
        strategy: 'session'
      },
      plugins: {
        'hapi-auth-cookie': {
          redirectTo: false
        }
      },
      id: 'reset',
      pre: [
        {
          method: PreHelpers.getUserInformation,
          assign: 'user'
        }
      ],
      security: ROUTE_SECURITY
    }
  }, {
    method: 'GET',
    path: '/admin/{page*}',
    handler: Dashboard.index,
    config: {
      id: 'admin',
      pre: [
        {
          method: PreHelpers.getUserInformation,
          assign: 'user'
        }, {
          method: PreHelpers.checkAdminRole,
          assign: 'isAdmin'
        }
      ],
      security: ROUTE_SECURITY
    }
  }
];
