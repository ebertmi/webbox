import jwt from 'jsonwebtoken';
const Config = require('../../config/webbox.config');
import CodeEmbed from '../models/codeEmbed';
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
    // ToDo: just a quick test
    const secret = 'ItsASecretToEverybody!';

    let authToken = jwt.sign({
      username: request.pre.user.username
    }, secret);

    let meta = CodeEmbed.getDefaultMeta('PythonTest');
    let ce = new CodeEmbed({
      meta: meta,
      code: {
        'main.py': 'print("hello ")',
        'data.txt': 'test\ntest2\ntest3\n'
      }
    });

    let INITIAL_DATA = ce;
    let USER_DATA = {
      username: request.pre.user.username
    };

    reply.view('embed', {
      authToken,
      server: Config.sourcebox.url,
      INITIAL_DATA: JSON.stringify(INITIAL_DATA),
      USER_DATA: JSON.stringify(USER_DATA)
    });
  }
};
