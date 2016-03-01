'use strict';

/**
 * This file contains all base routes.
 */

var Joi = require('joi');
var PreHelpers = require('../pre/prehelpers');
var Pages = require('../controllers/pages');
var Auth = require('../controllers/auth');
var Course = require('../controllers/course');
var Media = require('../controllers/media');
var config = require('../../config/webbox.config');

module.exports = [
  {
    method: 'GET',
    path: '/',
    handler: Pages.index,
    config: {
      id: 'root',
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
  }
];