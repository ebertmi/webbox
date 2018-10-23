'use strict';

/**
 * This file contains all API routes, that provide basic
 * CRUD Operations on Ressources
 */
const Api = require('../controllers/websocket');

module.exports = [
  {
    method: 'POST',
    path: '/embed-event',
    handler: Api.onEvent,
    config: {
      plugins: {
        'hapi-io': 'embed-event',
        'crumb': {
          source: 'query',
          restful: false
        }
      },
      auth: {
        strategy: 'jwt'
      }
    }
  }, {
    method: 'POST',
    path: '/embed-action',
    handler: Api.onAction,
    config: {
      plugins: {
        'hapi-io': 'embed-action',
        'crumb': {
          source: 'query',
          restful: false
        }
      },
      auth: {
        strategy: 'jwt'
      }
    }
  }
];