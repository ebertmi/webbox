var Hapi = require('hapi');
var Path = require('path');
var Inert = require('inert');
var good = require('good');

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

// add the good process monitor/logging plugin
server.register({
    register: good,
    options: config.good 
}, function(err) {
    if (err) {
        console.error(err);
    } else {
        server.start(function() {
            console.info('Server started at ' + server.info.uri);
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
                index: true
            }
        }
    });
}