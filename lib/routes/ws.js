'use strict';

/**
 * This file contains all API routes, that provide basic
 * CRUD Operations on Ressources
 */
const Joi = require('joi');
const Api = require('../ws/');
import PreHelpers from '../pre/prehelpers';
import genr from '../util/generator-route';

/**
 * WebSocket prefix
 */
const WS_PREFIX = '/ws';

/**
 * Common PreHelper Configuration for all API Routes
 */
const WS_PREHELPERS = [
  {
    method: PreHelpers.isAuthenticatedJsonResponse
  }
];

const WS_AUTH_CONFIG = {
  mode: 'try',
  strategy: 'session'
};

/**
 * Common PreHelper Plugin configurations
 */
const WS_PLUGINS = {
  'hapi-auth-cookie': {
    redirectTo: false
  }
};

module.exports = [
  {
    method: 'POST',
    path: WS_PREFIX + '/users',
    handler: Api.getUsers,
    config: {
      auth: WS_AUTH_CONFIG,
      validate: {
        query: {
          page: Joi.number().integer().min(1).default(1),
          limit: Joi.number().integer().min(1).max(100).default(10),
          q: Joi.string().allow('').default('')
        }
      },
      plugins: WS_PLUGINS,
      pre: WS_PREHELPERS
    }
  }
];