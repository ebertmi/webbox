'use strict';
/**
 * The course model.
 *
 * A course consists of multiple markdown documents. Each document is converted to HTML after
 * changing the rendered hash.
 */
import isString from 'lodash/isString';
var User = require('./user');
var slug = require('slug');
var Thinky = require('../util/thinky');
var type = Thinky.type;
const R = Thinky.r;


var Document = Thinky.createModel('Document', {
  id: type.string(),
  createdAt: type.date().default(() => new Date()),
  _creatorId: type.string().required(),
  slug: type.string().required(),
  course: type.string().required(),
  cells: [{
    cell_type: type.string().required(),
    source: type.any(),
    meta: type.object()
  }],
  metadata: type.object({
    kernelspec: type.object,
    language_info: type.object,
    title: type.string().required(),
    author: type.string(),
    lastUpdate: type.date().default(() => new Date())
  }).required(),
  authors: type.array().default([]) /* List of additional authors */
});

Document.ensureIndex('slug');
Document.belongsTo(User, 'creator', '_creatorId', 'id');

Document.defineStatic('getBySlug', function (slug) {
  return Document.filter({slug: slug}).nth(0).default(null).run();
});

Document.defineStatic('getById', function (id) {
  return Document.get(id).run();
});

/**
 * Check if the document has an author for the passed email.
 */
Document.define('isAuthorByEmail', function (email) {
  if (!email || !isString(email)) {
    return false;
  }

  return this.authors.includes(email.toLowerCase());

});

/**
 * Pre Save Hook, to ensure the lastUpdate Hook.
 */
Document.pre('save', function (next) {
  this.metadata.lastUpdate = R.now();
  next();
});

module.exports = Document;