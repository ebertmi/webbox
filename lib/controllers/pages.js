import jwt from 'jsonwebtoken';
const Config = require('../../config/webbox.config');
import CodeEmbed from '../models/codeEmbed';
/**
 * The pages controller handles are normal views without special logic.
 */

module.exports = {
  index: function (request, reply) {

    reply.view('index', {
      user: request.pre.user,
      documents: request.pre.documents,
      embeds: request.pre.embeds,
      codeDocuments: request.pre.codeDocuments,
      courses: request.pre.courses
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
