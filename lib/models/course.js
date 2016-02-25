/**
 * The course model.
 * 
 * A course consists of multiple markdown documents. Each document is converted to HTML after
 * changing the rendered hash.
 */
var User = require('./user');
var slug = require('slug');
var thinky = require('../util/thinky');
var type = thinky.type;

var Course = thinky.createModel('Course', {
  id: type.string().required(),
  title: type.string().required(),
  source: type.string().default(''),
  createdAt: type.date().allowNull(),
  _creatorId: type.string().allowNull(),
  chapters: [{
    document: type.string().required(),
    title: type.string().optional(),
    isIndex: type.boolean().default(false),
    source: type.string().optional(),
    titleSlug: type.string(),
    lastUpdate: type.date().default(Date.now()),
    history: [{
      document: type.string(),
      createdAt: type.date()
    }]
  }]
});

Course.belongsTo(User, 'creator', '_creatorId', 'id');

Course.define('getIndex', function () {
  var indexChapter;
  for (var c in this.chapters) {
    if (c.isIndex === true) {
      indexChapter = c;
      break;
    }
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

Course.defineStatic('getById', function (id) {
  return Course.get(id).run();
});

Course.defineStatic('createSlug', function (title) {
  return slug(title, {
    lower: true,
    remove: slug.defaults.modes['pretty'].remove
  });
});


module.exports = Course;