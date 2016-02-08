var Hapi = require('hapi');
var config = require('./config/webbox.config');
var good = require('good');

var server = new Hapi.Server();
server.connection({host: config.app.hostname, port: config.app.port});

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