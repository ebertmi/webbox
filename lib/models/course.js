'use strict';
/**
 * The course model.
 *
 * A course consists of multiple markdown documents. Each document is converted to HTML after
 * changing the rendered hash.
 */
var User = require('./user');
var slug = require('slug');
var Thinky = require('../util/thinky');
var type = Thinky.type;
const R = Thinky.r;

var Course = Thinky.createModel('Course', {
  id: type.string(),
  title: type.string().required(),
  source: type.string().default(''),
  description: type.string().default(''),
  createdAt: type.date().default(R.now()),
  _creatorId: type.string().allowNull(),
  slug: type.string().required(),
  lastUpdate: type.date().default(R.now()),
  chapters: [{
    document: type.string().required(),
    title: type.string().optional(),
    isIndex: type.boolean().default(false),
    source: type.string().optional(),
    titleSlug: type.string(),
    lastUpdate: type.date().default(R.now()),
    history: type.array().schema({
      document: type.string(),
      createdAt: type.date()
    }).default([])
  }]
});

Course.ensureIndex('slug');

Course.belongsTo(User, 'creator', '_creatorId', 'id');

/**
 * Pre Save Hook, to ensure the lastUpdate Hook.
 */
Course.pre('save', function (next) {
  this.lastUpdate = R.now();
  next();
});

Course.define('getIndex', function () {
  var indexChapter;
  for (var c of this.chapters) {
    if (c.isIndex === true) {
      indexChapter = c;
      break;
    }
  }

  if (indexChapter === undefined) {
    throw new Error('A course must have a index chapter');
  }

  return indexChapter;

});

/**
 * Gets the Chapter from the course
 */
Course.define('getChapter', function (titleSlug) {
  for (var c in this.chapters) {
    if (c.titleSlug === titleSlug) {
      return c;
    }
  }
});

Course.defineStatic('getBySlug', function (slug) {
  return Course.filter({slug: slug}).nth(0).default(null).run();
});

Course.defineStatic('getById', function (id) {
  return Course.get(id).run();
});

Course.defineStatic('createSlug', function (title) {
  return slug(title, {
    lower: true,
    remove: slug.defaults.modes['pretty'].remove
  });
});

Course.defineStatic('getCourseSlugsForUserId', function (userId) {
  return Course.filter({_creatorId: userId}).pluck('slug');
});

module.exports = Course;