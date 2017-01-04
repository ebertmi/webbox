import Joi from 'joi';
import Auth from '../controllers/auth';
import PreHelpers from '../pre/prehelpers';
import { validationfailAction } from '../util/requestUtils';

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
  }, {
    method: 'POST',
    path: '/change-password',
    handler: Auth.changePassword,
    config: {
      validate: {
        payload: {
          oldPassword: Joi.string().min(6).required(),
          newPassword: Joi.string().min(6).max(200).required(),
          newPasswordRepeat: Joi.string().min(6).max(200).required()
        },
        failAction: validationfailAction
      },
      auth: {
        strategy: 'session',
        mode: 'try',
        scope: 'user'
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
        },
        {
          method: PreHelpers.getUserInformation,
          assign: 'user'
        }
      ]
    }
  }];