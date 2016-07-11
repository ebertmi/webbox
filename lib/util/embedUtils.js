/**
 * Util for retrieving a embed with or without associated document based on parameters
 */
import Boom from 'boom';
import CodeEmbed from '../models/codeEmbed';
import CodeDocument from '../models/codeDocument';

const LANGUAGE_EXT = new Map([
  ['python', 'py'],
  ['python2', 'py'],
  ['python3', 'py'],
  ['c#', 'cs'],
  ['cs', 'cs'],
  ['cpp', 'cpp'],
  ['c', 'c'],
  ['java', 'java'],
  ['ruby', 'rb']
]);

const LANGUAGE_TEMPLATES = new Map([
  ['python', 'print "Hi"'],
  ['python2', 'print "Hi"'],
  ['python3', 'print("Hi")'],
  ['c#', ''],
  ['cs', ''],
  ['cpp', ''],
  ['c', '#include <stdio.h>\n#include <stdlib.h>\n\nint main(void) {\nprintf("Hi");\nreturn 0;\n}'],
  ['java', ''],
  ['ruby', '']
]);

export function getFileExtensionByLanguage (language) {
  return LANGUAGE_EXT.get(language);
}

/**
 * Returns a template code file (source content) for the given language.
 *
 * @export
 * @param {any} language
 * @returns String with template source
 */
export function getTemplateContentByLanguage (language) {
  let ret = LANGUAGE_TEMPLATES.get(language);
  return ret != undefined ? ret : '';
}

export function* getEmbedAndOrDocument (embedId, userId, showOriginal=false, documentId) {
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
      codeEmbedId: embedId,
      _ownerId: userId
    }).nth(0).run();

  } catch (e) {
    // might fail as we might have users without a saved version
    return embed;
  }

  embed._document = document;
  return embed;
}