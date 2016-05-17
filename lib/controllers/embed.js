/**
 * Course Controller
 *
 * Handles viewing and editing courses
 */
'use strict';
import JWT from 'jsonwebtoken';
import CodeEmbed from '../models/codeEmbed';
import CodeDocument from '../models/codeDocument';
import { getEmbedAndOrDocument } from '../util/embedUtils';
import Config from '../../config/webbox.config';


/**
 * Getting a embed is complex as we need to consider a few cases:
 *
 * 1. Showing a embed as author
 * 2. Showing a embed as student without modifications
 * 3. Showing a embed as student with modifications
 * 4. Showing a embed as author with student modifications
 * 5. Showing a embed as student with student modifications
 *
 *
 * 4 + 5. can be reduced to one case: Show embed with codeDocument:
 *  - codeDocument is not owned by the requesting user
 *  - codeDocument is owned by the requesting user
 */



/**
 * We need a similar function inside the API
 */
export function* getEmbed (request, reply) {
  const id = request.params.id;
  const showOriginal = request.query.showOriginal;
  const showDocument = request.query.showDocument;
  let embed;
  let userData = {
    username: request.pre.user.username,
    id: request.pre.user.id
  };
  let mode;

  // gets the embed and or the document, or only the embed
  embed = yield getEmbedAndOrDocument(id, request.pre.user.id, showOriginal, showDocument);
  // error occured

  // is user author of the embed
  userData.isAuthor = embed._creatorId === request.pre.user.id;
  userData.isDocumentOwner = embed._document && embed._document._ownerId === request.pre.user.id;

  if (!userData.isAuthor && !userData.isDocumentOwner && !embed._document) {
    mode = "STUDENT_WITHOUT_MODIFICATIONS";
  } else if (!userData.isAuthor && userData.isDocumentOwner) {
    mode = "STUDENT_WITH_MODIFICATIONS";
  } else if (userData.isAuthor && embed._document) {
    mode = "AUTHOR_VIEW_DOCUMENT";
  } else if (!userData.isAuthor && embed._document) {
    mode = "STUDENT_VIEW_DOCUMENT";
  } else {
    mode = "UNKOWN_MODE";
  }

  embed._mode = mode;

  // ToDo: just a quick test
  const secret = 'ItsASecretToEverybody!';

  let authToken = JWT.sign({
    username: request.pre.user.username
  }, secret);

  /**
   * Cases:
   * - display embed
   * - display embed as owner
   * - display embed as student with modifications
   *
   * We do only create a fork if the students clicks the save button
   * Then we create a copy of the embed and update our client state
   * The next loading of the page will load the modified version
   */
  // ready for returning
  reply.view('embed', {
    user: request.pre.user,
    INITIAL_DATA:  JSON.stringify(embed),
    USER_DATA:  JSON.stringify(userData),
    server: Config.sourcebox.url,
    authToken: authToken
  });
}

export function* getEmbedBySlug(request, reply) {
  // ToDo!
  throw new Error('Not implemented!');
}


/**
 * Controller for saving embeds. Though, it allows only to
 * change files and assets (if it is the author).
 *
 * Following cases are handled:
 *  - Author saves (changes are made to the embed)
 *  - User saves and has already a document (change the document)
 *  - User saves and has no document (create new document and save)
 */
export function* saveEmbed (request, reply) {
  const id = request.params.id;
  let data = request.payload.data;
  let response = { };
  let embed;
  let codeDocument;
  let codeValidationResult;

  // 1. Check the code
  try {
    codeValidationResult = CodeEmbed.validateCodeData(data.code);
    if (codeValidationResult.valid === false) {
      // exit early
      response.error = 'Invalid "code" data.';
      response.errorData = codeValidationResult.errors;

      return reply(response);
    }
  } catch (e) {
    // error while validating
    return reply('Invalid request data provided');
  }

  try {
    // 2. gets the embed and or the document, or only the embed
    embed = yield getEmbedAndOrDocument(id, request.pre.user.id);
  } catch (e) {
    response.error = 'An error occured while saving';
    return reply(response);
  }

  // 3. Check if user is author
  if (embed._creatorId === request.pre.user.id) {
    embed.code = data.code;
    try {
      yield embed.save(); // save changes
    } catch (e) {
      console.log(e);
      response.error = 'An error occured while saving';
      return reply(response);
    }

    response.document = null;

    return reply(response);
  }

  // 4. Check if there is an associated codeDocument for the user
  try {
    codeDocument = yield CodeDocument.filter({
      codeEmbedId: id,
      _ownerId: request.pre.user.id
    }).nth(0).run();
  } catch (e) {
    // its okay, just go on
  }

  if (codeDocument) {
    // update document and we are done
    codeDocument.code = data.code;


    try {
      codeDocument = yield codeDocument.save();
    } catch (e) {
      console.log(e);

      response.error = 'An error occured while saving';
      return reply(response);
    }

    response.document = codeDocument.id;
    return reply(response);
  }

  // okay, now we need to create a new codeDocument
  codeDocument = new CodeDocument({
    codeEmbedId: id,
    code: data.code,
    _ownerId: request.pre.user.id
  });

  // get id from database
  try {
    codeDocument = yield codeDocument.save();
    response.document = codeDocument.id;
  } catch (e) {
    console.log(e);

    response.error = 'An error occured while saving';
    return reply(response);
  }

  return reply(response);
}