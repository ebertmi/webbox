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
var Type = Thinky.type;
const R = Thinky.r;

var Course = Thinky.createModel('Course', {
  id: Type.string(),
  title: Type.string().required(),
  published: Type.boolean().required(),
  logo: Type.string(),
  source: Type.string().default(''),
  description: Type.string().default(''),
  createdAt: Type.date().default(() => new Date()),
  _creatorId: Type.string().allowNull(),
  slug: Type.string().required(),
  lastUpdate: Type.date().default(() => new Date()),
  document: Type.string().required()
});

Course.ensureIndex('slug');
Course.ensureIndex('published');

Course.belongsTo(User, 'creator', '_creatorId', 'id');

/**
 * Pre Save Hook, to ensure the lastUpdate Hook.
 */
Course.pre('save', function (next) {
  this.lastUpdate = new Date();
  next();
});

Course.defineStatic('getRecent', function (n) {
  return Course.filter({
    published: true
  }).limit(n).pluck('id', 'title', 'description', 'slug').execute();
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

Course.defineStatic('getBySlug', function (slug='') {
  slug = slug.toLowerCase();
  return Course.filter({
    slug: slug,
    published: true
  }).nth(0).default(null).run();
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