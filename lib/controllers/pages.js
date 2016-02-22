/**
 * The pages controller handles are normal views without special logic.
 */
var User = require('../models/user');
var Markdown = require('../util/markdown');

module.exports = {
    index: function (request, reply) {
        var username = 'Nicht angemeldet';
        if (request.auth.isAuthenticated) {
            username = request.auth.credentials.username;
            console.info('Authenticated:', request.auth);
        }

        reply.view('index', {
            title: 'Webbox | Hapi ' + request.server.version,
            message: 'All your base are belong to use!',
            username: username
        });
    },
    course: function (request, reply) {
        reply.view('course', {
            title: 'Course Page',
            content: Markdown.render('## This is a heading and nothing more')
        });
    }
};