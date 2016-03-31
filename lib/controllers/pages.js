import jwt from 'jsonwebtoken';
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
  },
  embed: function (request, reply) {
    // just a quick test
    const secret = 'ItsASecretToEverybody!';

    let authToken = jwt.sign({
      username: request.pre.user.username
    }, secret);

    reply.view('embed', {
      authToken,
      server: 'http://52.58.54.59/'
    });
  }
};
