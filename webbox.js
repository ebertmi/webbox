/* global __dirname */
var Hapi = require('hapi');
var Path = require('path');
var Inert = require('inert');
var Good = require('good');
var Vision = require('vision');
var Jade = require('jade');
var Crumb = require('crumb');
var Blipp = require('blipp');
var hratelimit = require('hapi-ratelimit');

var config = require('./config/webbox.config');

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
      isSecure: false
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
        jade: Jade,
      },
      path: __dirname + '/lib/views',
      compileOptions: config.views.compileOptions
    });
  }
});

// serve static files, maybe only on dev
if (config.isDev || config.isTest) {
  console.log('Attaching /public and /media routes.');
  server.register(Inert, (err) => {
    if (err) {
      console.log('inert', err);
    }
  });

  server.route({
    method: 'GET',
    path: '/public/{param*}',
    handler: {
      directory: {
        path: './public/',
        redirectToSlash: true,
        index: false,
      }
    },
    config: {
      auth: false
    }
  });

  // init media files
  server.route({
    method: 'GET',
    path: '/media/{param*}',
    handler: {
      directory: {
        path: './media/',
        redirectToSlash: true,
        index: false
      }
    },
    config: {
      auth: false
    }
  });
}

// register routes
server.route(require('./config/routes'));

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