'use strict';

const Hoek = require('hoek');
const socketio = require('socket.io');
const auth = require('./auth');
const routes = require('./routes');
const namespaces = require('./namespaces');

// Declare internals

const internals = {
  defaults: {
    socketio: {
      path: '/socket.io'
    }
  }
};

exports.plugin = {
  register: (server, options) => {
    options = Hoek.applyToDefaults(internals.defaults, options);

    const s = options.connectionLabel ? server.select(options.connectionLabel) : server;

    if (!s) {
      throw new Error('hapi-io - no server');
    }

    const io = socketio(s.listener, options.socketio);
    const nsps = namespaces(io, options.namespaces);

    s.expose('io', io);

    s.ext('onRequest', (request, h) => {
      if (!request.plugins['hapi-io']) {
        request.plugins['hapi-io'] = {};
      }

      request.plugins['hapi-io'].io = request.server.plugins['hapi-io'].io;
      return h.continue;
    });

    if (options.auth) {
      auth(s, io, options);
    }

    Object.keys(nsps).forEach((namespace) => {
      nsps[namespace].on('connection', function(socket) {
        routes(s, socket, namespace);
      });
    });

  },
  version: '1.0.0',
  name: 'hapi-io'
};
