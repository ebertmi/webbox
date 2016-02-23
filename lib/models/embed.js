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
  _creator: type.string().allowNull()
});

CodeEmbed.belongsTo(CodeEmbed, '_parent', 'id');
CodeEmbed.belongsTo(User, '_owner', 'id');

// CodeEmbed.defineStatic(key, fn);
CodeEmbed.define('getSourceObject', function () {
  this.code; 
});

CodeEmbed.define('updateSourceObject', function () {
  
});

module.exports = CodeEmbed;