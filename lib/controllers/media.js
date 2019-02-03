import Slug from 'speakingurl';
import format from 'date-fns/format';
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
  const fileExtension = getFileExtension(filename);
  filename = filename.replace(`.${fileExtension}`, '');
  const filenameSlug = Slug(filename);
  const fileKey = `${document}/${format(new Date(), 'Y-m-d')}${filenameSlug}.${fileExtension}`;

  return fileKey;
}

module.exports = {
  imageupload: async function imageupload (request, h) {
    const file = request.payload.imageFile;
    const document = request.payload.document;
    let documentObj;
    //document = document.toLowerCase();

    // Receive document information
    try {
      documentObj = await Document.get(document).pluck('_creatorId', 'authors', 'id').execute();
    } catch (err) {
      console.log(err);
      return Boom.badRequest('Document not found');
    }

    // Check user rights
    if (canSaveDocument(documentObj, request.pre.user) === false) {
      return Boom.forbidden('Not allowed');
    }

    // maybe use dynamic scope
    const fileKey = getFileKey(file.hapi.filename, document);
    const filePath = Path.join(Config.media.path, fileKey);
    const fileStream = createOutputStream(filePath);

    return new Promise((resolve, reject) => {
      fileStream.on('error', (err) => {
        console.log(err);
        return reject(Boom.unsupportedMediaType('Could not save image'));
      });

      fileStream.on('finish', () => {
        // we return the url where the images has been uploaded to
        const ret = {
          path: '/' + URLHelper.join(filePath),
          filename: fileKey,
          originalFilename: file.hapi.filename,
          headers: file.hapi.headers
        };

        return resolve(ret);
      });

      request.payload.imageFile.pipe(fileStream);
    });
  },
  getImagesFromDocument: async function getImagesFromDocument (request, h) {
    const document = request.params.document;

    // escape path, so that it can only contain a string no path changing elements like ../ or ./../
    // Replace all illegal characters
    const nDocument = document.toLowerCase().replace(/([^a-z0-9-]+)/gi, '');
    const filePath = Path.join(Config.media.path, '' + nDocument + '/');
    const response = {};

    return new Promise((resolve, reject) => {
      glob(filePath + IMAGE_FILES_GLOB, {}, (err, files) => {

        if (err) {
          response.error = 'Error during image locating.';
        } else {
          response.files = JSON.stringify(files);
        }

        return resolve(response);
      });
    });
  },
  getImagesFromCourse: function (request, h) {
    return Boom.badRequest();
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