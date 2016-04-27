/**
 * CodeEmbeds store a code examples. They contain the original authors code
 * If any non author wants to save changes for a specific @ref{CodeEmbed} they
 * need to use a @ref{CodeDocument} which stores only file changes for the CodeEmbed
 */
import Thinky from '../util/thinky';
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
  id: Type.string().required(),
  name: Type.string().required(),
  language: Type.string().default('python3'),
  embedType: Type.string().default('sourcebox'),
  createdAt: Type.date().default(Date.now()),
  lastUpdated: Type.date(),
  code: Type.object(),
  _creatorId: Type.string().allowNull(),
  assets: [{
    type: Type.string().required(),
    data: Type.any(),
    meta: Type.object()
  }]
});

/**
 * Assets may have a type and data
 */

// we use a different type of storing user changes: see @ref{CodeDocument}
/*CodeEmbed.belongsTo(CodeEmbed, 'parent', '_parentId', 'id');*/
CodeEmbed.belongsTo(User, 'creator', '_creatorId', 'id');

CodeEmbed.ensureIndex('id');
CodeEmbed.ensureIndex('createdAt');

CodeEmbed.define('getSourceObject', function () {
  this.code;
});

CodeEmbed.define('updateSourceObject', function () {

});

module.exports = CodeEmbed;