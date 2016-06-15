'use strict';

/**
 * This file contains all API routes, that provide basic
 * CRUD Operations on Ressources
 */
const Api = require('../controllers/websocket');
import genr from '../util/generator-route';

module.exports = [
  {
    method: 'POST',
    path: '/embed-event',
    handler: genr(Api.onEvent),
    config: {
      plugins: {
        'hapi-io': 'embed-event',
        'crumb': {
          source: 'query'
        }
      },
      auth: {
        strategy: 'jwt'
      }
    }
  }, {
    method: 'POST',
    path: '/embed-action',
    handler: genr(Api.onAction),
    config: {
      plugins: {
        'hapi-io': 'embed-action',
        'crumb': {
          source: 'query'
        }
      },
      auth: {
        strategy: 'jwt'
      }
    }
  }
];