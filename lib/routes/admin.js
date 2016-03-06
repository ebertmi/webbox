'use strict';

/**
 * This file contains all base routes.
 */

const Joi = require('joi');
const PreHelpers = require('../pre/prehelpers');
const Admin = require('../controllers/admin');
const Config = require('../../config/webbox.config');

const DASHBOARD_PREFIX = '/dashboard';

module.exports = [
  {
    method: 'GET',
    path: DASHBOARD_PREFIX,
    handler: Admin.dashboard,
    config: {
      id: 'dashboard'
    }
  }, {
    method: 'GET',
    path: DASHBOARD_PREFIX + '/users',
    handler: Admin.users,
    config: {
      id: 'dashboard/users'
    }
  }, {
    method: 'GET',
    path: DASHBOARD_PREFIX + '/user/{id}',
    handler: Admin.user,
    config: {
      id: 'dashboard/user',
      validate: {
        params: {
          id: Joi.string().required()
        }
      }
    }
  },  {
    method: 'POST',
    path: DASHBOARD_PREFIX + '/user/{id}',
    handler: Admin.saveUser,
    config: {
      id: 'dashboard/saveuser',
      validate: {
        params: {
          id: Joi.string().required()
        },
        payload: {
          modelData: Joi.string().required()
        },
      },
    }
  },{
    method: 'GET',
    path: DASHBOARD_PREFIX + '/authattempts',
    handler: Admin.authattempts,
    config: {
      id: 'dashboard/authattempts'
    }
  }, {
    method: 'GET',
    path: DASHBOARD_PREFIX + '/courses',
    handler: Admin.courses,
    config: {
      id: 'dashboard/courses'
    }
  }, {
    method: 'GET',
    path: DASHBOARD_PREFIX + '/course/{id}',
    handler: Admin.course,
    config: {
      id: 'dashboard/course',
      validate: {
        params: {
          id: Joi.string().required()
        }
      }
    }
  }, {
    method: 'GET',
    path: DASHBOARD_PREFIX + '/embed/{id}',
    handler: Admin.embed,
    config: {
      id: 'dashboard/embed',
      validate: {
        params: {
          id: Joi.string().required()
        }
      }
    }
  }, {
    method: 'GET',
    path: DASHBOARD_PREFIX + '/embeds',
    handler: Admin.embeds,
    config: {
      id: 'dashboard/embeds'
    }
  }
];