var slug = require('slug');
var datefmt = require('datefmt');
var config = require('../../config/webbox.config');
var fs = require('fs-extra');
var path = require('path');
var Boom = require('boom');

// Forces slug to use url encoding
slug.defaults.mode = 'rfc3986';

function getFileKey (filename, course) {
  var filenameSlug = slug(filename);
  var fileKey = '' + course + '/' + datefmt('%Y-%m-%d', new Date()) + filenameSlug;
  
  return fileKey;
}

module.exports = {
  imageupload: function (request, reply) {
    var file = request.payload.imageFile;
    var course = request.payload.course || 'base';
    
    // ToDo: check if course exists
    
    // ToDo: check user-rights
    // maybe use dynamic scope
    console.log('file', file.hapi);
    var fileKey = getFileKey(file.hapi.filename, course);
    var filePath = path.join(config.media.path, fileKey);
    console.log(filePath);
    var fileStream = fs.createOutputStream(filePath);
    
    fileStream.on('error', function (err) {
      console.log(err);
      reply(Boom.unsupportedMediaType('Could not save image'));
    });
    
    fileStream.on('finish', function (err) {
      var ret = {
        filename: fileKey,
        headers: file.hapi.headers
      };
      
      reply(JSON.stringify(ret));
    });
    
    request.payload.imageFile.pipe(fileStream);
  }
};