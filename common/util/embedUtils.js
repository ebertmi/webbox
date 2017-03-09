import uuidV4 from 'uuid/v4';

import {
  MODES,
  EmbedTypes
} from '../constants/Embed';

import { getFileExtensionByLanguage } from './languageUtils';

/**
 * Creates a valid embed object like being delivered by the server for 
 * passing into projects.
 * 
 * @export
 * @param {string} code - code to execute (single file)
 * @param {string} language - language to use
 * @param {string} embedType - embed type
 */
export function createEmbedObject(code, language, embedType, id) {
  // check code
  if (code == null) {
    throw new Error('createEmbedObject called with code: ' + code);
  }

  // set embedType if not present
  if (EmbedTypes[embedType] == null) {
    embedType = EmbedTypes.Sourcebox;
  }

  // get language extension mapping
  let extension = getFileExtensionByLanguage(language);

  if (extension == null) {
    // ToDo: error, unsupported language
    extension = language;
  }

  let filename = `main.${extension}`;
  let codeObj = {};
  codeObj[filename] = code;

  let nonpersistentId = id; // we do not store this embed on the disk!
  if (nonpersistentId == null) {
    nonpersistentId = uuidV4();
  }

  let embed = {
    code: codeObj,
    id: nonpersistentId,
    meta: {
      language: language,
      embedType: embedType,
      name: 'Schnellausführung',
      mainFile: filename
    },
    assets: []
  };

  // students cannot save/change this
  const mode = MODES.RunMode;

  embed._mode = mode;


  return embed;
}