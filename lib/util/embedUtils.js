/**
 * Util for retrieving a embed with or without associated document based on parameters
 */
import Boom from 'boom';
import CodeEmbed from '../models/codeEmbed';
import CodeDocument from '../models/codeDocument';

export function* getEmbedAndOrDocument (embedId, userId, showOriginal, documentId) {
  let embed;
  let document;

  // retriev embed first
  try {
    embed = yield CodeEmbed.get(embedId).run();
  } catch (e) {
    return Boom.notFound('Es exisitiert kein Codebeispiel unter dieser ID.');
  }

  // we are done
  if (showOriginal === true) {
    return embed;
  }

  // check for specified documents
  if (documentId) {
    try {
      document = yield CodeDocument.get(documentId).run();
    } catch (e) {
      return Boom.notFound('Unter dieser ID existiert kein gespeicherter Stand des Beispiels.');
    }

    // update the embed code object that contains the saved files
    embed.code = document.code;
    embed._document = document;

    return embed;
  }

  // last case we try to lookup a document, might fail
  try {
    document = yield CodeDocument.filter({
      codeEmbedId: embedId,
      _ownerId: userId
    }).nth(0).run();
  } catch (e) {
    // might fail as we might have users without a saved version
    return embed;
  }

  embed.code = document.code;
  embed._document = document;
  return embed;
}