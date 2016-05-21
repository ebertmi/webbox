/**
 * Course Controller
 *
 * Handles viewing and editing courses
 */
'use strict';
const Course = require('../models/course');
const Cache = require('../util/courserendercache');
const Markdown = require('../../common/util/markdown');
const Boom = require('boom');

/**
 * Tries to get the course/chapter as rendered HTML or
 * renders, caches and returns the document as HTML
 */
function getFromCacheOrRender (course, chapter, document) {
  return Cache.has(course, chapter)
  .then((has) => {
    if (has === true) {
      // rendered version exists
      return Cache.get(course, chapter);
    } else {
      // we need to render
      return Markdown.render(document)
      .then((rendered) => {
        return Cache.set(course, chapter, rendered);
      });
    }
  });
}

module.exports = {
  overview: function (request, reply) {
    Course.run().then((courses) => {
      reply.view('courseoverview', {
        courses: courses,
        user: request.pre.user
      });
    }).error((err) => {
      console.log(err);
    });
  },
  view: function (request, reply) {
    let context = {
      user: request.pre.user
    };
    let courseObj;
    let indexChapter;

    // get Course object and get index chapter
    courseObj = request.pre.course;
    indexChapter = courseObj.getIndex();
    console.info(courseObj, indexChapter);
    context.title = courseObj.title;
    context.slug = courseObj.slug;

    // try to get rendered version from cache or store it in the cache
    getFromCacheOrRender(courseObj.slug, indexChapter.titleSlug, indexChapter.document)
    .then((rendered) => {
      context.content = rendered;
      context.chapters = courseObj.chapters;
      reply.view('course', context);
    })
    .error((err) => {
      // appearently the cache broke or
      // another unexpected error occured
      console.error(err);
      reply(Boom.badRequest());
    });
  },
  create: function (request, reply) {
    // create a new course
  },
  edit: function (request, reply) {
    // return complete course object
    reply.view('editcourse', request.pre.course);
  },
  chapterview: function (request, reply) {
    let context = {};
  },
  editchapterview: function (request, reply) {

  },
  savecourse: function (request, reply) {

  }
};