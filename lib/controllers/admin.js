'use strict';

/**
 * Controller for all admin actions and views
 */
const Course = require('../models/course');
const User = require('../models/user');
const Embed = require('../models/embed');
const MODELS = [Course, User, Embed];

module.exports = {
  dashboard: function (request, reply) {
    // get all models
    const context = {
      models: MODELS
    };

    reply.view('dashboard', context);
  },
  list: function (request, reply) {

  }
};