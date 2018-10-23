/* global __dirname */
import Hapi from 'hapi';
import Path from 'path';
import Inert from 'inert';
import Good from 'good';
import Vision from 'vision';
import Jade from 'jade';
import Crumb from 'crumb';
import Blipp from 'blipp';
import HapiIO from './lib/io';

import HapiRateLimit from 'hapi-rate-limit';
import CatboxMemory from 'catbox-memory';
//import CatboxRedis from 'catbox-redis'; // see comment below
import Log from './lib/models/log';
import HapiPM2 from './lib/util/hapi-pm2';

import isString from 'lodash/isString';

// own imports
import config from './config/webbox.config';
import Package from './package.json';

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
  // application specific logging, throwing an error, or other logic here
});

let isProvisioned = false;

// The default context is available for every response (template)
const defaultContext = {
  webboxVersion: Package.version,
  isProd: config.isProd,
  isDev: config.isDev,
  showHelp: config.app.showHelpInFooter,
  baseTitle: config.app.baseTitle
};

// ToDo import depending on the environment
let cache;

if (config.isDev) {
  cache = { engine: CatboxMemory };
} else {
  // ToDo: add Redis for production
  //cache = {
  //  engine: CatboxRedis,
    /*database: config.cache.database,*/
  //  host: config.cache.host,
  //  port: config.cache.port,
  //  password: config.cache.password,
    /*partition: config.cache.partition*/
  //};

  // ToDo: Change this, but for now we stick with a simple in memory cache
  cache = { engine: CatboxMemory };
}

const server = new Hapi.Server({
  host: config.app.hostname,
  port: config.app.port,
  routes: {
    files: {
      relativeTo: Path.join(__dirname, '')
    }
  },
  cache: cache
});

const provision = async (shouldStart) => {
  if (isProvisioned === true) {
    console.warn('Already provisioned, called twiced!');
    return;
  }

  await server.register({
    plugin: HapiRateLimit,
    options: config.ratelimit.cacheOptions
  });

  // Add PM2 shutdown integration for graceful reloads and shutdowns
  await server.register({
    plugin: HapiPM2,
    options: {
      timeout: 4000
    }
  });

  // add the good process monitor/logging plugin
  await server.register({
    plugin: Good,
    options: config.good,
  });

  // register crumb for csrf
  await server.register({
    plugin: Crumb,
    options: {
      cookieOptions: {
        isSecure: config.crumb.isSecure // ToDo: Change this when dealing with SSL/HTTPS
      }
    }
  });

  await server.register(Vision);

  server.views({
    engines: {
      jade: Jade
    },
    path: Path.join(__dirname, '/lib/views/'),
    compileOptions: {
      cache: true,
      pretty: true,
      debug: false,
      compileDebug: false
    },
    context: defaultContext
  });

  // add WebSocket-Plugin
  server.register({
    plugin: HapiIO,
    options: {
    }
  });


  // Do the routing and auth stuff here
  // add authentification with cookie and basic username/password
  await server.register([Inert, require('./lib/auth/base.js'), require('hapi-auth-jwt2')]);

  // Now register the jwt stuff too
  server.auth.strategy('jwt', 'jwt', {
    key: config.websocket.secret,
    validate: async (decoded, request, h) => {
      console.info('in validate func', decoded);
      //callback(null, true);
      return { isValid: true };
    }
  });

  /**
   * Set default strategy for every route
   * Use route config to disable authentication
   * with `auth: false`
   * Additionally, each route is scoped only for admins,
   * which can be also overriden.
   */
  server.auth.default({
    strategy: 'session',
    scope: ['admin']
  });

  // Finally hook up the routes
  // register routes
  server.route(require('./lib/routes'));


  // blibb for server routes -> only for dev
  if (config.isDev) {
    await server.register({
      plugin: Blipp, options: {
        showStart: config.blibb.showStart,
        showAuth: config.blibb.showAuth
      }
    });
  }

  /**
   *  register named-routes-plugin
   *
   * This allows use to use "path.routename" in views as
   * all named views are passed in the context.
   */
  await server.register(require('hapi-named-routes'));

  if (shouldStart === true) {
    await server.start();
    console.info(`Server started at ${server.info.uri}`);
  }

  isProvisioned = true;
};

// register better error pages
server.ext('onPreResponse', (request, h) => {
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
    return h.continue;
  }

  if (request.response.output.statusCode >= 500) {
    console.info('Server error 500', 500);
    const errorMessage = isString(request.response) ? request.repsonse : 'Server Error 500';
    Log.createLog('Server.Error', errorMessage, {
      path: request.path,
      user: request.pre.user || {},
      data: {
        message: request.response.toString()
      }
    }, 'Error');
    console.error(`Repsonse is Error`, request.response.stack);
  } else {
    console.log(`Repsonse is Error with status ${request.response.output.statusCode}`, request.response.stack);
  }

  // We should try to do some useful logging
  let errorMessage = isString(request.response) ? request.repsonse : 'Server Error 500';
  let errorStack = request.response.stack != undefined ? request.response.stack : 'No stack available';

  //console.log('Error in request: %s', errorMessage, errorStack);

  let err;
  let errName;
  let statusCode;

  if (config.isProd) {
    err = 'Das hätte nicht passieren sollen - Wir kümmern uns darum!';
    errName = 'Fehler';
    statusCode = request.response.output.statusCode;
  } else {
    err = 'Wir kümmern ums darum.';
    errName = 'Fehler';
    statusCode = request.response.output.statusCode;
  }

  if (statusCode === 403) {
    err = 'Sie besitzen nicht die benötigten Rechte, um auf diese Seite zuzugreifen.';
  }

  return h.view('errors/default', {
    statusCode: statusCode,
    errName: errName,
    errorMessage: err,
    user: user
  }).code(statusCode);
});

server.events.on({ name: 'request', channels: 'error' }, (request, event, tags) => {
  try {
    const error = event.response.source || {};
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

module.exports = {
  server,
  provision
};