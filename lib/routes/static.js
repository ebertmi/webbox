'use strict';

/**
 * This file contains the static files routes.
 *
 */

var files = require('../controllers/static');

module.exports = [
  {
    method: 'GET',
    path: '/public/{param*}',
    handler: files.public,
    config: {
      id: 'public',
      auth: false
    }
  }, {
    method: 'GET',
    path: '/media/{param*}',
    handler: files.media,
    config: {
      id: 'media',
      auth: false
    }
  }
];