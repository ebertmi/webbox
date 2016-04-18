/**
 * Course Controller
 *
 * Handles viewing and editing courses
 */
'use strict';
import CodeEmbed from '../models/codeEmbed';
import CodeDocument from '../models/codeDocument';


/**
 * We need a similar function inside the API
 */
export function* getEmbed (request, reply) {
  const id = request.params.id;
  const showOriginal = request.query.showOriginal;
  const userId = request.pre.user.id;
  let embed;
  let document;

  try {
    embed = yield CodeEmbed.get(id).run();
  } catch (e) {
    // not found
  }

  // if showOriginal is true, we just display the original embed
  if (showOriginal === false) {
    // we need to look for any changes in the CodeDocument Table
    try {
      document = yield CodeDocument.filter({
        codeEmbedId: id,
        _ownerId: userId
      }).nth(0).run();
    } catch (e) {
      // todo
    }
  }

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
  return reply.view('index', {
    user: request.pre.user
  });
}

// should be put into the API
export function* saveEmbed (request, reply) {

}