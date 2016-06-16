/**
 * EmbedDocuments store only user modifications of the source code.
 * This allows users to save their individual changes for an embed without
 * duplicating the embed.
 */
import Thinky from '../util/thinky';
import User from './user';
import CodeEmbed from './codeEmbed';
const Type = Thinky.type;

const CodeDocument = Thinky.createModel('CodeDocument', {
  id: Type.string(),
  codeEmbedId: Type.string().required(),
  code: Type.object().default({ }),
  _ownerId: Type.string().required(),
  lastUpdate: Type.date().default(Date.now())
});

CodeDocument.belongsTo(User, 'owner', '_ownerId', 'id');
CodeDocument.belongsTo(CodeEmbed, 'embed', 'codeEmbedId', 'id');

CodeDocument.ensureIndex('codeEmbedId');
CodeDocument.ensureIndex('_ownerId');

/**
 * Update lastUpdate date when saving
 */
CodeDocument.pre('save', function(next) {
  this.lastUpdate = Date.now();

  next();
});

/**
 * Returns the n recent documents for the user
 */
CodeDocument.defineStatic('getRecent', function (userId, n) {
  const count = n <= 0 ? 1 : n;

  return CodeDocument.filter({'_ownerId': userId}).limit(count).getJoin({embed: true}).pluck('id', 'codeEmbedId', 'lastUpdate', {'embed': ['meta']}).execute();
});

export default CodeDocument;