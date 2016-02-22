/* global __dirname */
var Hapi = require('hapi');
var Path = require('path');
var Inert = require('inert');
var Good = require('good');
var Vision = require('vision');
var Jade = require('jade');
var Crumb = require('crumb');
var hratelimit = require('hapi-ratelimit');

var config = require('./config/webbox.config');

var server = new Hapi.Server();
server.connection({
    host: config.app.hostname, 
    port: config.app.port,
    routes: {
        files: {
            relativeTo: Path.join(__dirname, 'public')
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
server.register([require('hapi-auth-cookie')], (err) => {
    // set up a cache for sessions
    var cache = server.cache({segment: 'sessions', expiresIn: 3 * 24 * 60 * 60 * 1000});
    server.app.cache = cache;

    config.auth.options.validateFunc = function (request, session, callback) {
      cache.get(session.sid, (err, cached) => {
          if (err) {
              return callback(err, false);
          }
          
          if (!cached) {
              return callback(null, false);
          }
          
          return callback(null, true, cached.credentials);
      });  
    };
    server.auth.strategy('session', 'cookie', config.auth.options);
});

// add ratelimiting middleware
server.register({
    register: hratelimit,
    options: config.ratelimit
  },
  function (err) {
    console.log(err);
  }
);


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
    server.register(Inert, () => {});
    server.route({
        method: 'GET',
        path: '/{param*}',
        handler: {
            directory: {
                path: '.',
                redirectToSlash: true,
                index: false
            }
        }
    });
}

// register routes
server.route(require('./config/routes'));