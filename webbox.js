/* global __dirname */
import Hapi from 'hapi';
import Path from 'path';
import Inert from 'inert';
import Good from 'good';
import Vision from 'vision';
import Jade from 'jade';
import Crumb from 'crumb';
import Blipp from 'blipp';
import HapiIO from 'hapi-io';
//import hratelimit from 'hapi-ratelimit';
import Log from './lib/models/log';

// own imports
import config from './config/webbox.config';
import Package from './package.json';

const defaultContext = {
  webboxVersion: Package.version,
  isProd: config.isProd,
  isDev: config.isDev
};

var server = new Hapi.Server();
server.connection({
  host: config.app.hostname,
  port: config.app.port,
  routes: {
    files: {
      relativeTo: Path.join(__dirname, '')
    }
  }
});

// Todo
/**
 *     cache: [{
    name: config.cache.name,
    engine: require('catbox-redis'),
    host: config.cache.host,
    partition: config.cache.partition
  }]
 */

// add the good process monitor/logging plugin
server.register({
  register: Good,
  options: config.good
}, function (err) {
  if (err) {
    console.error(err);
  } else {
    server.start (function () {
      console.info('Server started at ' + server.info.uri);
    });
  }
});

// register crumb for csrf
server.register({
  register: Crumb,
  options: {
    cookieOptions: {
      isSecure: false // ToDo: Change this when dealing with SSL/HTTPS
    }
  }
}, (err) => {
  if (err) {
    throw err;
  }
});

// add authentification with cookie and basic username/password
server.register({
  register: require('./lib/auth/base.js')
});


// Add jwt auth plugin
server.register(require('hapi-auth-jwt2'), (err) => {
  if(err){
    console.log(err);
  }

  server.auth.strategy('jwt', 'jwt', {
    key: config.websocket.secret,
    validateFunc: (decoded, request, callback) => {
      console.info(decoded);
      callback(null, true);
    }
  });
});

// add ratelimiting middleware
// requires redis
/*server.register({
  register: hratelimit,
  options: config.ratelimit
  },
  function (err) {
  console.log(err);
  }
);*/


// add vision template engine support
server.register(Vision, (err) => {
  if (err) {
    console.log('Failed to load vision.');
  } else {
    server.views({
      engines: {
        jade: Jade
      },
      path: __dirname + '/lib/views',
      compileOptions: {
        cache: false,
        pretty: true,
        debug: false,
        compileDebug: false
      },
      context: defaultContext
    });
  }
});

// serve static files, maybe only on dev
server.register(Inert, (err) => {
  if (err) {
    console.log('inert', err);
  }
});

// register better error pages
server.ext('onPreResponse', function (request, reply) {
  let user;

  if (request.pre.user === undefined) {
    user = {
      isAnonymous: true
    };
  } else {
    user = request.pre.user;
  }

  // ToDo: change this to hide information in production mode
  if (!request.response.isBoom) {
    return reply.continue();
  }

  if (request.response.output.statusCode >= 500) {
    console.info('Server error 500', 500);
    Log.createLog('Server.Error', request.response, {
      path: request.path,
      user: request.pre.user || {}
    }, 'Error');
    console.error(`Repsonse is Error`, request.response.stack);
  } else {
    console.log(`Repsonse is Error with status ${request.response.output.statusCode}`);
  }


  let err = request.response;
  const errName = err.output.payload.error;
  const statusCode = err.output.payload.statusCode;

  if (statusCode === 403) {
    err = 'Sie besitzten nicht die benötigten Rechte, um auf diese Seite zuzugreifen.';
  }

  return reply.view('errors/default', {
    statusCode: statusCode,
    errName: errName,
    errorMessage: err,
    user: user
  })
  .code(statusCode);
});

server.on('request-error', function (event) {
  console.log(event);
  try {
    let error = event.response.source || {};
    error._error = event.response. _error.toString();
    error.stack = event.response._error.stack || '';

    Log.createLog('Server.Error', 'Response Error', {
      path: event.path,
      user: event.auth,
      error: error,
    }, 'Error');
  } catch (e) {
    Log.createLog('Server.Error', 'Error while loggin server error', {
      error: e.toString(),
    }, 'Error');
  }
});

// add WebSocket-Plugin
server.register({
  register: HapiIO,
  options: {
  }
});

// register routes
server.route(require('./lib/routes'));

// blibb for server routes -> only for dev
if (config.isDev) {
  server.register({
    register: Blipp, options: {
      showStart: config.blibb.showStart,
      showAuth: config.blibb.showAuth
    }
  }, function (err) {
    if (err) {
      console.log(err);
    }
  });
}

/**
 *  register named-routes-plugin
 *
 * This allows use to use "path.routename" in views as
 * all named views are passed in the context.
 */
server.register(require('hapi-named-routes'), (err) => {
  if (err) {
    console.log('inert', err);
  }
});