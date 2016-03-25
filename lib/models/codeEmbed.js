/**
 * CodeEmbeds store a code examples. They contain the original authors code
 * If any non author wants to save changes for a specific @ref{CodeEmbed} they
 * need to use a @ref{CodeDocument} which stores only file changes for the CodeEmbed
 */
import Thinky from '../util/thinky';
import User from '../models/user';
const Type = Thinky.type;

const CodeEmbed = Thinky.createModel('CodeEmbed', {
  id: Type.string().required(),
  title: Type.string().required(),
  lang: Type.string(),
  source: Type.string().default(''),
  createdAt: Type.date().default(Date.now()),
  lastUpdated: Type.date(),
  code: Type.object(),
  _creatorId: Type.string().allowNull(),
  _parentId: Type.string().allowNull()
});

CodeEmbed.belongsTo(CodeEmbed, 'parent', '_parentId', 'id');
CodeEmbed.belongsTo(User, 'creator', '_creatorId', 'id');

CodeEmbed.ensureIndex('id');
CodeEmbed.ensureIndex('createdAt');

// CodeEmbed.defineStatic(key, fn);
CodeEmbed.define('getSourceObject', function () {
  this.code;
});

CodeEmbed.define('updateSourceObject', function () {

});

module.exports = CodeEmbed;