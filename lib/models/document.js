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
import { EmbedTypes } from '../../common/constants/Embed';

var Document = Thinky.createModel('Document', {
  id: type.string(),
  createdAt: type.date().default(() => new Date()),
  _creatorId: type.string().required(),
  slug: type.string().required(),
  embedType: type.string().required().default(EmbedTypes.Sourcebox),
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
  authors: type.array().default([]) /* List of additional authors */,
  nbformat: type.number().default(4),
  nbformat_minor: type.number().default(0)
});

Document.ensureIndex('slug');
Document.ensureIndex('createdAt');
Document.ensureIndex('_creatorId');
Document.belongsTo(User, 'creator', '_creatorId', 'id');

Document.defineStatic('getBySlug', function (slug) {
  return Document.filter({slug: slug}).nth(0).default(null).run();
});

/**
 * Count number of documents for the given slug and ignore all documents that
 * have one of the given ids in the array.
 */
Document.defineStatic('countBySlug', function (slug, ignore=[]) {
  return Document.filter({slug: slug})
  .filter(d => {
    return Thinky.r.expr(ignore)
              .contains(d("id"))
              .not();
  })
  .count().execute();
});

Document.defineStatic('getById', function (id) {
  return Document.get(id).run();
});

/**
 * Returns the n recent documents for the user
 */
Document.defineStatic('getRecent', function (userId, n) {
  const count = n <= 0 ? 1 : n;

  return Document.orderBy(Thinky.r.desc('createdAt')).filter({'_creatorId': userId}).limit(count).pluck('id', 'slug', {'metadata': ['title', 'lastUpdate']}).execute();
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