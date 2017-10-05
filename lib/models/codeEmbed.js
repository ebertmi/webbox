/**
 * CodeEmbeds store a code examples. They contain the original authors code
 * If any non author wants to save changes for a specific @ref{CodeEmbed} they
 * need to use a @ref{CodeDocument} which stores only file changes for the CodeEmbed
 */
import Thinky from '../util/thinky';
import Slug from 'speakingurl';
import User from '../models/user';
import _ from 'lodash';
const Type = Thinky.type;
import { EmbedTypes } from '../../common/constants/Embed';

/**
 * A CodeEmbed represents an code example that may consist of multiple files and
 * assets. The assets are stored as an array of objects, that have a type, data and metadata.
 *
 * The code files are stores in the 'code' attribute, which is basically an object holding key, value
 * pairs. Each key represents a file[path] and either an string or an object with an content, hidden and meta properties.
 */
const CodeEmbed = Thinky.createModel('CodeEmbed', {
  id: Type.string(),
  code: Type.object(),
  _creatorId: Type.string().required(),
  slug: Type.string().optional().default(null),
  createdAt: Type.date().default(Date.now()),
  lastUpdate: Type.date().default(Date.now()),
  meta: Type.object().default({
    language: Type.string().default('python3'),
    embedType: Type.string().default(EmbedTypes.Sourcebox),
    name: Type.string().required(),
    origin: Type.string().default(''),
    mainFile: Type.string().default('main.py')
  }),
  assets: [{
    type: Type.string().required(),
    data: Type.any(),
    meta: Type.object()
  }]
});

// we use a different type of storing user changes: see @ref{CodeDocument}
/*CodeEmbed.belongsTo(CodeEmbed, 'parent', '_parentId', 'id');*/
CodeEmbed.belongsTo(User, 'creator', '_creatorId', 'id');

// ToDo: implement n-m relationship to allow multiple owners for a code embed!
CodeEmbed.hasAndBelongsToMany(User, 'creators', 'id', 'id', {
  type: 'creators',
});
//User.hasAndBelongsToMany(CodeEmbed, 'codeEmbeds', 'id', 'id');

CodeEmbed.ensureIndex('id');
CodeEmbed.ensureIndex('createdAt');
CodeEmbed.ensureIndex('slug');

/**
 * Update lastUpdate date when saving
 */
CodeEmbed.pre('save', function saveHook(next) {
  this.lastUpdate = Date.now();

  // Remove unwanted key here
  if (this._document) {
    delete this._document;
  }

  next();
});

/**
 * Adds a new user as an creator to the embed
 */
CodeEmbed.defineStatic('addCreator', (embedId, userId) => {
  let query = CodeEmbed.get(embedId).addRelation('creators', {id: userId});
  //console.info(query, query.run);
  return query;
});

/**
 * Removes the user as a creator from the embed
 */
CodeEmbed.defineStatic('removeCreator', (embedId, userId) => {
  return CodeEmbed.get(embedId).removeRelation('creators', {id: userId}).run();
});

/**
 * Returns default metadata for an embed. Utility for creating new embeds.
 */
CodeEmbed.defineStatic('getDefaultMeta', (name, langauge='python3', embedType=EmbedTypes.Sourcebox, mainFile='main.py') => {
  return {
    name: name,
    language: langauge,
    embedType: embedType,
    mainFile: mainFile
  };
});

/**
 * Filter and retrieve embeds by a slug.
 * Returns the first result.
 */
CodeEmbed.defineStatic('getBySlug', (slug) => {
  return CodeEmbed.filter({slug: slug}).getJoin({creators: true}).nth(0).run();
});

/**
 * Returns the number of embeds with the same slug.
 * (Helper utility)
 */
CodeEmbed.defineStatic('countBySlug', (slug, ignore=[]) => {
  return CodeEmbed.filter({slug: slug})
    .filter(ce => {
      return Thinky.r.expr(ignore)
        .contains(ce('id'))
        .not();
    })
    .count().execute();
});

CodeEmbed.defineStatic('getById', (id) => {
  return CodeEmbed.get(id).run();
});

/**
 * Creates a slug for the given title for the embed
 * @returns {String} the generated slug
 */
CodeEmbed.defineStatic('createSlug', (title) => {
  return Slug(title, {
    lower: true,
    remove: Slug.defaults.modes['pretty'].remove
  });
});

/**
 * Returns the n recent documents for the user
 */
CodeEmbed.defineStatic('getRecent', (userId, n) => {
  const count = n <= 0 ? 1 : n;

  return CodeEmbed.orderBy(Thinky.r.desc('createdAt')).filter({'_creatorId': userId})
    .limit(count).pluck('id', 'slug', {'meta': ['name', 'language', 'embedType']}, 'lastUpdate').execute();
});

/**
 * Validates the passed object
 */
CodeEmbed.defineStatic('validateCodeData', (code) => {
  let validationResult = {
    valid: true,
    errors: []
  };

  // code must be of type object
  if (!_.isObject(code)) {
    validationResult.valid = false;
    validationResult.errors.push('argument "code" must be an object');
  }

  // check own property in there
  for (let file in code) {
    if (!_.isString(file)) {
      validationResult.valid = false;
      validationResult.errors.push(`filename "${file + ''}" must be a string`);
    }

    // check file content
    if (!_.isString(code[file])) {
      validationResult.valid = false;
      validationResult.errors.push(`file "${file + ''}" does not contain a string`);
    }
  }

  return validationResult;
});

CodeEmbed.defineStatic('validateAssetData', (assets) => {
  // ToDo: Implement asset validation
  return true;
});

module.exports = CodeEmbed;