import Slug from 'slug';
import datefmt from 'datefmt';
import Config from '../../config/webbox.config';
import createOutputStream from 'create-output-stream';
import Path from 'path';
import Boom from 'boom';
import URLHelper from '../util/urlhelper';
import glob from 'glob';

// Forces slug to use url encoding
Slug.defaults.mode = 'rfc3986';

const IMAGE_FILES_GLOB = '*.@(jpg|jpeg|JPG|png|PNG|gif|GIF)';

function getFileKey (filename, document) {
  var filenameSlug = Slug(filename);
  var fileKey = '' + document + '/' + datefmt('%Y-%m-%d', new Date()) + filenameSlug;

  return fileKey;
}

module.exports = {
  imageupload: function (request, reply) {
    let file = request.payload.imageFile;
    let document = request.payload.document || 'base';
    document = document.toLowerCase();

    // ToDo: check if document exists
    // Get document here
    // ToDo: check user-rights
    // easy to do as we we can check the author/creator of the document or admin

    // maybe use dynamic scope
    var fileKey = getFileKey(file.hapi.filename, document);
    var filePath = Path.join(Config.media.path, fileKey);
    var fileStream = createOutputStream(filePath);

    fileStream.on('error', function (err) {
      console.log(err);
      reply(Boom.unsupportedMediaType('Could not save image'));
    });

    fileStream.on('finish', function () {
      // we return the url where the images has been uploaded to
      var ret = {
        path: '/' + URLHelper.join(filePath),
        filename: fileKey,
        originalFilename: file.hapi.filename,
        headers: file.hapi.headers
      };

      reply(ret);
    });

    request.payload.imageFile.pipe(fileStream);
  },
  getImagesFromDocument: function (request, reply) {
    const document = request.params.document;

    // escape path, so that it can only contain a string no path changing elements like ../ or ./../
    // Replace all illegal characters
    let nDocument = document.toLowerCase().replace(/([^a-z0-9-]+)/gi, '');
    let filePath = Path.join(Config.media.path, '' + nDocument + '/');
    let response = {};

    glob(filePath + IMAGE_FILES_GLOB, {}, (err, files) => {

      if (err) {
        response.error = 'Error during image locating.';
      } else {
        response.files = JSON.stringify(files);
      }

      reply(response);
    });
  },
  getImagesFromCourse: function (request, reply) {
    reply(Boom.badRequest());
/*    const course = request.params.course;

    // escape path, so that it can only contain a string no path changing elements like ../ or ./../
    // Replace all illegal characters
    let nCourse = course.toLowerCase().replace(/([^a-z0-9-]+)/gi, '');
    let filePath = Path.join(Config.media.path, '' + nCourse + '/');
    let response = {};

    glob(filePath + IMAGE_FILES_GLOB, {}, (err, files) => {

      if (err) {
        response.error = 'Error during image locating.';
      } else {
        response.files = JSON.stringify(files);
      }

      reply(response);
    });*/
  }
};