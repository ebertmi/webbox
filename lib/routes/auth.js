var Joi = require('joi');
var Auth = require('../controllers/auth');
var PreHelpers = require('../pre/prehelpers');

// now expose /login and /logout
module.exports = [
  {
    method: 'POST',
    path: '/login',
    handler: Auth.login,
    config: {
      validate: {
        payload: {
          username: Joi.string().required(),
          password: Joi.string().min(2).max(200).required()
        }
      },
      auth: {
        strategy: 'session',
        mode: 'try',
        scope: ['user']
      },
      pre: [
        {
          method: PreHelpers.detectAbuse
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
    path: '/logout',
    handler: Auth.logout,
    config: {
      auth: {
        strategy: 'session',
        mode: 'try',
        scope: ['user']
      },
      plugins: {
        'hapi-auth-cookie': {
          redirectTo: false
        }
      },
      pre: [
        {
          method: PreHelpers.getRecentCourses,
          assign: 'courses'
        }
      ]
    }
  }];