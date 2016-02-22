/**
 * The pages controller handles are normal views without special logic.
 */
var User = require('../models/user');
var Markdown = require('../util/markdown');

module.exports = {
    index: function (request, reply) {
        // check if there is any user
        User.run().then(function (users) {
            reply.view('index', {
                title: 'Webbox | Hapi ' + request.server.version,
                message: 'All your base are belong to use!',
                users: users
            });
        });
    },
    course: function (request, reply) {
        reply.view('course', {
            title: 'Course Page',
            content: Markdown.render('## This is a heading and nothing more')
        });
    }
};