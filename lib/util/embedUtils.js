/**
 * Util for retrieving a embed with or without associated document based on parameters
 */
import Boom from 'boom';
import CodeEmbed from '../models/codeEmbed';
import CodeDocument from '../models/codeDocument';

/**
 * Querys the meta data of an embed that is identified by either its id or a slug.
 * 
 * @export
 * @param {string} embedId - id of the embed
 * @returns {Object|Boom} embed meta data object or Boom error
 */
export function*getEmbedMetadata(embedId) {
  let embed;

  // retriev embed first
  try {
    embed = yield CodeEmbed.get(embedId).pluck('id', 'slug', {'meta': ['name', 'language', 'embedType']}, 'lastUpdate').execute();
  } catch (e) {

    // Try slug next
    try {
      embed = yield CodeEmbed.filter({slug: embedId}).nth(0).pluck('id', 'slug', {'meta': ['name', 'language', 'embedType']}, 'lastUpdate').execute();
    } catch (ex) {
      return Boom.notFound('Es exisitiert kein Codebeispiel unter diesem Namen bzw. ID.');
    }
  }

  return embed;
}

export function*getEmbedAndOrDocument(embedId, userId, showOriginal = false, documentId) {
  let embed;
  let document;
  let id = embedId;

  // retriev embed first
  try {
    embed = yield CodeEmbed.get(embedId).getJoin({creators: true}).pluck({
      id: true, code: true, _creatorId: true, slug: true, createdAt: true, lastUpdate: true, meta: true, assets: true,
      creators: ['id', 'email']
    }).execute();
  } catch (e) {

    // Try slug next
    try {
      embed = yield CodeEmbed.filter({slug: embedId}).getJoin({creators: true}).nth(0).pluck({
        id: true, code: true, _creatorId: true, slug: true, createdAt: true, lastUpdate: true, meta: true, assets: true,
        creators: ['id', 'email']
      }).execute();
      id = embed.id;
    } catch (ex) {
      return Boom.notFound('Es exisitiert kein Codebeispiel unter diesem Namen bzw. ID.');
    }
  }

  // we are done
  if (showOriginal === true) {
    return embed;
  }

  // check for specified documents
  if (documentId != null) {
    try {
      document = yield CodeDocument.get(documentId).run();
    } catch (e) {
      return Boom.notFound('Unter dieser ID existiert kein gespeicherter Stand des Beispiels.');
    }

    // update the embed code object that contains the saved files
    embed._document = document;

    return embed;
  }

  // last case we try to lookup a document, might fail
  try {
    document = yield CodeDocument.filter({
      codeEmbedId: id,
      _ownerId: userId
    }).nth(0).run();

  } catch (e) {
    // might fail as we might have users without a saved version
    return embed;
  }

  embed._document = document;
  return embed;
}