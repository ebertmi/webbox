'use strict';
/**
 * The pages controller handles are normal views without special logic.
 */

module.exports = {
  index: function (request, reply) {
    reply.view('index', {
      user: request.pre.user
    });
  },
  imprint: function (request, reply) {
    reply.view('imprint', {
      user: request.pre.user
    });
  },
  privacy: function (request, reply) {
    reply.view('privacy', {
      user: request.pre.user
    });
  }
};