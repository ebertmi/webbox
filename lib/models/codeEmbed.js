/**
 * CodeEmbeds store a code examples. They contain the original authors code
 * If any non author wants to save changes for a specific @ref{CodeEmbed} they
 * need to use a @ref{CodeDocument} which stores only file changes for the CodeEmbed
 */
import Thinky from '../util/thinky';
import Slug from 'slug';
import User from '../models/user';
const Type = Thinky.type;

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
  _creatorId: Type.string().allowNull(),
  slug: Type.string().optional().default(null),
  createdAt: Type.date().default(Date.now()),
  lastUpdated: Type.date(),
  meta: Type.object().default({
    language: Type.string().default('python3'),
    embedType: Type.string().default('sourcebox'),
    name: Type.string().required(),
    origin: Type.string().default('')
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

CodeEmbed.ensureIndex('id');
CodeEmbed.ensureIndex('createdAt');
CodeEmbed.ensureIndex('slug');

CodeEmbed.defineStatic('getDefaultMeta', name => {
  return {
    name: name,
    language: 'python3',
    embedType: 'sourcebox'
  };
});

CodeEmbed.defineStatic('getBySlug', function (slug) {
  return CodeEmbed.filter({slug: slug}).nth(0).default(null).run();
});

CodeEmbed.defineStatic('getById', function (id) {
  return CodeEmbed.get(id).run();
});

CodeEmbed.defineStatic('createSlug', function (title) {
  return Slug(title, {
    lower: true,
    remove: Slug.defaults.modes['pretty'].remove
  });
});

/**
 * Assets may have a type and data
 */
CodeEmbed.define('getSourceObject', function () {
  this.code;
});

CodeEmbed.define('updateSourceObject', function () {

});

module.exports = CodeEmbed;