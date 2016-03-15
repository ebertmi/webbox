/**
 * Placeholder model for representating a collection of files...
 */
var thinky = require('../util/thinky');
var type = thinky.type;

var User = require('./user');

var CodeEmbed = thinky.createModel('CodeEmbed', {
  id: type.string().required(),
  title: type.string().required(),
  lang: type.string(),
  source: type.string().default(''),
  createdAt: type.date().default(Date.now()),
  lastUpdated: type.date(),
  code: type.object(),
  _creatorId: type.string().allowNull()
});

CodeEmbed.belongsTo(CodeEmbed, 'parent', '_parent', 'id');
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