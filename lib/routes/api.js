'use strict';

/**
 * This file contains all API routes, that provide basic
 * CRUD Operations on Ressources
 */

const Joi = require('joi');
const Api = require('../controllers/api');
const Config = require('../../config/webbox.config');

const API_PREFIX = '/api';

module.exports = [
  {
    method: 'GET',
    path: API_PREFIX + '/users',
    handler: Api.getUsers,
    config: {
      validate: {
        query: {
          page: Joi.number().integer().min(1).default(1),
          limit: Joi.number().integer().min(1).max(100).default(10)
        }
      }
    }
  }
];