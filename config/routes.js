/**
 * routes.js contains all routes and their configuration
 */

var Joi = require('joi');
var PreHelpers = require('../lib/controllers/prehelpers');
var pages = require('../lib/controllers/pagescontroller');
var auth = require('../lib/controllers/authcontroller');
var course = require('../lib/controllers/coursecontroller');
var media = require('../lib/controllers/mediacontroller');
var config = require('./webbox.config');

module.exports = [
  {
    method: 'GET',
    path: '/',
    handler: pages.index,
    config: {
      auth: {
        mode: 'try',
        strategy: 'session'
      },
      plugins: {
        'hapi-auth-cookie': {
          redirectTo: false
        }
      }
    }
  }, {
    method: 'GET',
    path: '/course',
    handler: pages.course, 
    config: {
      auth: false
    }
  }, {
    method: 'GET',
    path: '/course/{course}',
    handler: course.view,
    config: {
      pre: [{
        method: PreHelpers.getCourse,
        assign: 'course'
      }],
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
    handler: course.chapterview,
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
    handler: auth.loginview,
    config: {
      auth: {
        mode: 'try',
        strategy: 'session'
      },
      plugins: {
        'hapi-auth-cookie': {
          redirectTo: false
        }
      }
    }
  }, {
    method: 'GET',
    path: '/courseoverview',
    handler: course.overview,
    config: {
      auth: {
        scope: 'user'
      }
    }
  }, {
    method: 'POST',
    path: '/mediaupload',
    handler: media.imageupload,
    config: {
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
      }
    }
  }
];