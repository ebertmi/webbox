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
const config = require('../../config/webbox.config');

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
        }
      ]
    }
  }, {
    method: 'GET',
    path: '/course',
    handler: Pages.course,
    config: {
      auth: false
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
      },
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
    method: 'POST',
    path: '/mediaupload',
    handler: Media.imageupload,
    config: {
      id: 'mediaupload',
      auth: {
        scope: 'user'
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
      auth: false,
      id: 'imprint'
    }
  }, {
    method: 'GET',
    path: '/datenschutz',
    handler: Pages.privacy,
    config: {
      auth: false,
      id: 'privacy'
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
          email: Joi.string().email().required(),
        },
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
  }
];