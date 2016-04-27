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

var Chapter = Thinky.createModel('Chapter', {
  id: type.string(),
  title: type.string().required(),
  createdAt: type.date().default(R.now()),
  _creatorId: type.string().allowNull(),
  slug: type.string().required(),
  lastUpdate: type.date().default(R.now()),
  cells: [{
    type: type.string().required(),
    data: type.any(),
    meta: type.object()
  }]
});

Chapter.ensureIndex('slug');

Chapter.belongsTo(User, 'creator', '_creatorId', 'id');

/**
 * Pre Save Hook, to ensure the lastUpdate Hook.
 */
Chapter.pre('save', function (next) {
  this.lastUpdate = R.now();
  next();
});

module.exports = Chapter;