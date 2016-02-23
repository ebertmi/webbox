/**
 * routes.js contains all routes and their configuration
 */

var Joi = require('joi');
var pages = require('../lib/controllers/pages');
var auth = require('../lib/controllers/auth');
var course = require('../lib/controllers/course');
var media = require('../lib/controllers/media');
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
       handler: pages.course 
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