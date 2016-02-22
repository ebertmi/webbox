/**
 * Course Controller
 * 
 * Handles viewing and editing courses
 */
var Course = require('../models/course');

module.exports = {
    overview: function (request, reply) {
        Course.run().then((courses) => {
            reply.view('courseoverview', {
                courses: courses            
            });
        }).error((err) => {
            console.log(err);
        });
    },
    editview: function (request, reply) {
        
    },
    savecourse: function (request, reply) {
        
    }
};