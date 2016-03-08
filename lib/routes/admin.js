'use strict';

/**
 * This file contains all base routes.
 */

const Joi = require('joi');
const PreHelpers = require('../pre/prehelpers');
const Admin = require('../controllers/admin');
const Config = require('../../config/webbox.config');

const DASHBOARD_PREFIX = '/dashboard';

const pre = [
  {
    method: PreHelpers.getUserInformation,
    assign: 'user'
  }
];

module.exports = [
  {
    method: 'GET',
    path: DASHBOARD_PREFIX,
    handler: Admin.dashboard,
    config: {
      id: 'dashboard',
      pre: pre
    }
  }, {
    method: 'GET',
    path: DASHBOARD_PREFIX + '/users',
    handler: Admin.users,
    config: {
      id: 'dashboard/users',
      pre: pre
    }
  }, {
    method: 'GET',
    path: DASHBOARD_PREFIX + '/user/{id}',
    handler: Admin.user,
    config: {
      id: 'dashboard/user',
      pre: pre,
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
      pre: pre,
      validate: {
        params: {
          id: Joi.string().required()
        },
        payload: {
          modelData: Joi.string().required()
        },
      },
    }
  }, {
    method: 'DELETE',
    path: DASHBOARD_PREFIX + '/user/{id}',
    handler: Admin.deleteUser,
    config: {
      id: 'dashboard/deleteuser',
      pre: pre,
      validate: {
        params: {
          id: Joi.string().required()
        }
      }
    }
  }, {
    method: 'GET',
    path: DASHBOARD_PREFIX + '/authattempts',
    handler: Admin.authattempts,
    config: {
      id: 'dashboard/authattempts',
      pre: pre
    }
  }, {
    method: 'GET',
    path: DASHBOARD_PREFIX + '/courses',
    handler: Admin.courses,
    config: {
      id: 'dashboard/courses',
      pre: pre
    }
  }, {
    method: 'GET',
    path: DASHBOARD_PREFIX + '/course/{id}',
    handler: Admin.course,
    config: {
      id: 'dashboard/course',
      pre: pre,
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
      pre: pre,
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
      id: 'dashboard/embeds',
      pre: pre
    }
  }
];