import Slug from 'slug';
import datefmt from 'datefmt';
import Config from '../../config/webbox.config';
import fse from 'fs-extra';
import createOutputStream from 'create-output-stream';
import Path from 'path';
import Boom from 'boom';
import URLHelper from '../util/urlhelper';
import glob from 'glob';

// Forces slug to use url encoding
Slug.defaults.mode = 'rfc3986';

const IMAGE_FILES_GLOB = '*.@(jpg|jpeg|JPG|png|PNG|gif|GIF)';

function getFileKey (filename, course) {
  var filenameSlug = Slug(filename);
  var fileKey = '' + course + '/' + datefmt('%Y-%m-%d', new Date()) + filenameSlug;

  return fileKey;
}

module.exports = {
  imageupload: function (request, reply) {
    let file = request.payload.imageFile;
    let course = request.payload.course || 'base';
    course = course.toLowerCase();

    // ToDo: check if course exists
    // Get course here
    // ToDo: check user-rights
    // easy to do as we we can check the author/creator of the course or admin

    // maybe use dynamic scope
    var fileKey = getFileKey(file.hapi.filename, course);
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
  getImagesFromCourse: function (request, reply) {
    const course = request.params.course;

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
    });
  }
};