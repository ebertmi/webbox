/**
 * EmbedDocuments store only user modifications of the source code.
 * This allows users to save their individual changes for an embed without
 * duplicating the embed.
 */
import Thinky from '../util/thinky';
import User from '../models/user';
const Type = Thinky.type;

const CodeDocument = Thinky.createModel('CodeDocument', {
  id: Type.string().required(),
  codeEmbedId: Type.string().required(),
  code: Type.object().default({ }),
  _ownerId: Type.string().required()
});

CodeDocument.belongsTo(User, 'owner', '_ownerId', 'id');

export default CodeDocument;