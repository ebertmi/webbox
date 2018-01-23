'use strict';

var Hoek = require('hoek');
var socketio = require('socket.io');
var auth = require('./auth');
var routes = require('./routes');
var namespaces = require('./namespaces');

// Declare internals

var internals = {
  defaults: {
    socketio: {
      path: '/socket.io'
    }
  }
};

exports.plugin = {
  register: (server, options) => {
    options = Hoek.applyToDefaults(internals.defaults, options);

    var s = options.connectionLabel ? server.select(options.connectionLabel) : server;

    if (!s) {
      throw new Error('hapi-io - no server');
    }

    var io = socketio(s.listener, options.socketio);
    var nsps = namespaces(io, options.namespaces);

    s.expose('io', io);

    s.ext('onRequest', function(request, reply) {
      if (!request.plugins['hapi-io']) {
        request.plugins['hapi-io'] = {};
      }

      request.plugins['hapi-io'].io = request.server.plugins['hapi-io'].io;
      return reply.continue();
    });

    if (options.auth) {
      auth(s, io, options);
    }

    Object.keys(nsps).forEach(function(namespace) {
      nsps[namespace].on('connection', function(socket) {
        routes(s, socket, namespace);
      });
    });

  },
  version: '1.0.0',
  name: 'hapi-io'
};
