/**
 * Course Controller
 *
 * Handles viewing and editing courses
 */
'use strict';
import JWT from 'jsonwebtoken';
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

}

// should be put into the API
export function* saveEmbed (request, reply) {

}