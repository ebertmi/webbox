/**
 * Course Controller
 * 
 * Handles viewing and editing courses
 */
'use strict';
const Course = require('../models/course');
const Cache = require('../util/courserendercache');
const Markdown = require('../util/markdown');

/**
 * Tries to get the course/chapter as rendered HTML or
 * renders, caches and returns the document as HTML
 */
function getFromCacheOrRender (course, chapter, document) {
  Cache.has(course, chapter).
  then((has) => {
    
    if (has === true) {
      // rendered version exists
      return Cache.get(course, chapter);
    } else {
      // we need to render
      Markdown.render(document)
      .then((rendered) => {
        Cache.set(course, chapter, rendered);
        return rendered;
      });
    }
  });
}

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
  view: function (request, reply) {
    let context = {};
    
    const courseObj = request.pre.course;
    context.course = courseObj;
    
    reply('course', context);
  },
  editview: function (request, reply) {
    
  },
  chapterview: function (request, reply) {
    let context = {};
  },
  editchapterview: function (request, reply) {
    
  },
  savecourse: function (request, reply) {
    
  }
};