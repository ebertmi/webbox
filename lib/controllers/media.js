import Slug from 'speakingurl';
import datefmt from 'datefmt';
import Config from '../../config/webbox.config';
import createOutputStream from '../util/create-output-stream';
import Path from 'path';
import Boom from 'boom';
import URLHelper from '../util/urlhelper';
import glob from 'glob';
import Document from '../models/document';
import { canSaveDocument } from '../roles/documentChecks'

import { getFileExtension } from '../util/stringUtils';

const IMAGE_FILES_GLOB = '*.@(jpg|jpeg|JPG|png|PNG|gif|GIF)';

function getFileKey (filename, document) {
  let fileExtension = getFileExtension(filename);
  filename = filename.replace(`.${fileExtension}`, '');
  var filenameSlug = Slug(filename);
  let fileKey = `${document}/${datefmt('%Y-%m-%d', new Date())}${filenameSlug}.${fileExtension}`;

  return fileKey;
}

module.exports = {
  imageupload: function* (request, reply) {
    let file = request.payload.imageFile;
    let document = request.payload.document;
    let documentObj;
    //document = document.toLowerCase();

    // Receive document information
    try {
      documentObj = yield Document.get(document).pluck('_creatorId', 'authors', 'id').execute();
    } catch (err) {
      console.log(err);
      return reply(Boom.badRequest('Document not found'));
    }

    // Check user rights
    if (canSaveDocument(documentObj, request.pre.user) === false) {
      return reply(Boom.forbidden('Not allowed'));
    }

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

      return reply(ret);
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