'use strict';

/**
 * This file contains all base routes.
 */

const Joi = require('joi');
const PreHelpers = require('../pre/prehelpers');
const Pages = require('../controllers/pages');
const Auth = require('../controllers/auth');
const Course = require('../controllers/course');
const Media = require('../controllers/media');
const Embed = require('../controllers/embed');
const Document = require('../controllers/document');
const Dashboard = require('../controllers/dashboard');
const config = require('../../config/webbox.config');

import genr from '../util/generator-route';

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
      ]
    }
  }, {
    method: 'GET',
    path: '/edit/course/{course}',
    handler: Course.edit,
    config: {
      id: 'course.edit',
      pre: [
        {
          method: PreHelpers.getCourse,
          assign: 'course'
        }, {
          method: PreHelpers.isCourseOwner,
          assign: 'isCourseOwner'
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
        scope: ['admin', 'course-{params.course}']
      }
    }
  }, {
    method: 'GET',
    path: '/p/{idOrSlug}',
    handler: genr(Document.getPresentation),
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
        }
      }
    }
  }, {
    method: 'GET',
    path: '/d/{idOrSlug}',
    handler: genr(Document.getDocument),
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
        }
      }
    }
  }, {
    method: 'PUT',
    path: '/d/{idOrSlug}',
    handler: genr(Document.saveDocument),
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
        scope: 'user'
      },
      plugins: {
        'hapi-auth-cookie': {
          redirectTo: false
        }
      }
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
      }
    }
  }, {
    method: 'GET',
    path: '/course/{course}/{chapter}',
    handler: Course.chapterview,
    config: {
      validate: {
        params: {
          course: Joi.string().min(3).required(),
          chapter: Joi.string().min(3).required()
        },
        failAction: function (request, reply) {
          reply.view('index', {
            user: {
              isAnonymous: true
            },
            errorMessage: 'Ungültige Kursangaben!'
          });
        }
      },
      auth: {
        mode: 'try',
        scope: 'user'
      }
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
      ]
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
      ]
    }
  }, {
    method: 'GET',
    path: '/images/{course}',
    handler: genr(Media.getImagesFromCourse),
    config: {
      id: 'image_course_get',
      auth: {
        mode: 'try',
        strategy: 'session',
        scope: 'user' /* TODO: change this later on depending on type */
      },
      validate: {
        params: {
          course: Joi.string().regex(/^[a-z0-9-]+$/).required()
        }
      }
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
          course: Joi.string().required(),
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
      ]
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
      }
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
      }
    }
  }, {
    method: 'GET',
    path: '/embed',
    handler: Pages.embed,
    config: {
      auth: {
        mode: 'try',
        scope: 'user'
      },
      id: 'embed',
      pre: [
        {
          method: PreHelpers.getUserInformation,
          assign: 'user'
        }
      ]
    }
  }, {
    method: 'GET',
    path: '/embed/{id}',
    handler: genr(Embed.getEmbed),
    config: {
      auth: {
        mode: 'try',
        scope: 'user' /* TODO: change this later on depending on type */
      },
      id: 'embed_with_id',
      pre: [
        {
          method: PreHelpers.getUserInformation,
          assign: 'user'
        }
      ],
      validate: {
        params: {
          id: Joi.string().guid().required(),
          showDocument: Joi.string().guid().optional(),
          showOriginal: Joi.boolean().optional().default(false, 'Let internal logic decide')
        }
      }
    }
  }, {
    method: 'GET',
    path: '/run',
    handler: genr(Embed.runEmbed),
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
          code: Joi.string().required(),
          language: Joi.string().required(),
          id: Joi.string().optional(),
          embedType: Joi.string().optional()
        }
      }
    }
  }, {
    method: 'PUT',
    path: '/embed/save/{id}',
    handler: genr(Embed.saveEmbed),
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
        }
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
    handler: genr(Embed.createEmbed),
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
        failAction: function (request, reply, source, error) {
          request.pre.validation = error.output.payload.validation;
          reply.continue();
        }
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
    path: '/signup',
    handler: Auth.signup,
    config: {
      validate: {
        payload: {
          email: Joi.string().email().required(),
          password: Joi.string().min(6).max(30).required(),
          semester: Joi.string().required()
        },
        failAction: function (request, reply, source, error) {
          request.pre.validation = error.output.payload.validation;
          reply.continue();
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
      id: 'signup',
      pre: [
        {
          method: PreHelpers.getUserInformation,
          assign: 'user'
        }
      ]
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
        failAction: function (request, reply) {
          reply.view('index', {
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
      ]
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
      ]
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
        failAction: function (request, reply) {
          reply.view('index', {
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
      ]
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
        failAction: function (request, reply) {
          reply.view('index', {
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
      ]
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
        failAction: function (request, reply) {
          reply.view('index', {
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
      ]
    }
  },  {
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
      ]
    }
  }
];
