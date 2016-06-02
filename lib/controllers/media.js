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
    var file = request.payload.imageFile;
    var course = request.payload.course || 'base';

    // ToDo: check if course exists
    // Get course here
    // ToDo: check user-rights
    // easy to do as we we can check the author/creator of the course or admin

    // maybe use dynamic scope
    console.log('file', file.hapi);
    var fileKey = getFileKey(file.hapi.filename, course);
    var filePath = Path.join(Config.media.path, fileKey);
    console.log(filePath);
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
    var filePath = Path.join(Config.media.path, '' + course + '/');

    glob(filePath + IMAGE_FILES_GLOB, {}, (err, files) => {
      console.log(files, err);
      reply();
    });
  }
};