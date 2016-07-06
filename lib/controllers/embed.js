/**
 * Course Controller
 *
 * Handles viewing and editing courses
 */
import JWT from 'jsonwebtoken';
import UUID from 'uuid';
import Slug from 'slug';
import CodeEmbed from '../models/codeEmbed';
import CodeDocument from '../models/codeDocument';
import { getEmbedAndOrDocument, getFileExtensionByLanguage } from '../util/embedUtils';
import Config from '../../config/webbox.config';
import { MODES } from '../../common/constants/Embed';

// Enforce url compatible slugs
Slug.defaults.mode = 'rfc3986';

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
 * Handles embed requests. This involves some logic. The request may contain a showDocument or showOriginal query.
 * Additionally, with no query we try to deliver a CodeDocument for the CodeEmbed when the user has a saved version.
 *
 * @export
 * @param {any} request
 * @param {any} reply
 * @returns
 */
export function* getEmbed (request, reply) {
  const id = request.params.id;
  const showOriginal = request.query.showOriginal;
  const showDocument = request.query.showDocument;
  let embed;
  let userData = {
    username: request.pre.user.username,
    email: request.pre.user.email,
    id: request.pre.user.id
  };
  let mode;

  // Get the embed and or the document, or only the embed
  embed = yield getEmbedAndOrDocument(id, request.pre.user.id, showOriginal, showDocument);
  if (embed.isBoom) {
    return reply(embed);
  }

  // Is user author of the embed?
  userData.isAuthor = embed._creatorId === request.pre.user.id;
  userData.isDocumentOwner = embed._document && embed._document._ownerId === request.pre.user.id;

  if (!userData.isAuthor && !userData.isDocumentOwner && !embed._document) {
    mode = MODES.Default; //"STUDENT_WITHOUT_MODIFICATIONS";
  } else if (!userData.isAuthor && userData.isDocumentOwner) {
    mode = MODES.Default; //"STUDENT_WITH_MODIFICATIONS";
  } else if (userData.isAuthor && embed._document) {
    mode = MODES.ViewDocument; //"AUTHOR_VIEW_DOCUMENT";
  } else if (!userData.isAuthor && embed._document) {
    mode = MODES.ViewDocument; //"STUDENT_VIEW_DOCUMENT";
  } else {
    mode = MODES.Unknown;
  }

  embed._mode = mode;

  // Set up the jsonwebtoken for the sourcebox server
  let sourceboxAuthToken = JWT.sign({
    username: request.pre.user.username
  }, Config.sourcebox.secret);

  // Set up the jsonwebtoken for the websocket connection
  let websocketAuthToken = JWT.sign({
    username: request.pre.user.username,
    userid: request.pre.user.id,
    isAuthor: request.pre.user.scope.includes('author'),
    isOwner: request.pre.user.id === embed._creatorId
  }, Config.websocket.secret);

  let template = 'embed';

  // Deliever skulpt template for skulpt projects
  if (embed.meta.embedType === 'skulpt') {
    template = 'embed.skulpt';
  }

  return reply.view(template, {
    user: request.pre.user,
    INITIAL_DATA:  JSON.stringify(embed),
    USER_DATA:  JSON.stringify(userData),
    sourcebox: JSON.stringify({
      server: Config.sourcebox.url,
      authToken: sourceboxAuthToken
    }),
    websocket: JSON.stringify({
      server: Config.websocket.url,
      authToken: websocketAuthToken
    })
  });
}

export function* getEmbedBySlug(request, reply) {
  // ToDo!
  throw new Error('Not implemented!');
}

/**
 * Handles update requests for attributes of an embed.
 *
 * @export
 * @param {any} request
 * @param {any} reply
 * @returns
 */
export function* updatEmbed(request, reply) {
  let response = {};
  const id = request.params.id;
  let data = {};
  let embed;

  // If any validation error has occured, reply with error
  if (request.pre.validation) {
    response.error = Config.messages.embed.create.invalid;
    return reply(response);
  }

  // Get embed without any logic
  try {
    embed = yield CodeEmbed.get(id).run();
  } catch (e) {
    response.error = 'Invalid embed id';
  }

  // Only use allowed attributes, ignore anything else
  data.slug = request.payload.data.slug;

  data.assets = request.payload.data.assets || [];
  data.meta = request.payload.data.meta;

  if (!data.slug || !data.meta || !data.assets) {
    response.error = 'Invalid data';
    return reply(response);
  }

  // Enforce slug to be a real slug!
  data.slug = Slug(data.slug);

  // Check if user is author
  if (embed._creatorId === request.pre.user.id) {
    try {
      yield embed.merge(data).save(); // save changes
    } catch (e) {
      console.error(e);
      response.error =  Config.messages.embed.save.saveFailed;
      return reply(response);
    }

    return reply(response);
  }

  return reply(response);
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
      response.error = Config.messages.embed.save.invalidCodeData;
      response.errorData = codeValidationResult.errors;

      return reply(response);
    }
  } catch (e) {
    // error while validating
    return reply({ error: Config.messages.embed.save.invalid });
  }

  try {
    // 2. gets the embed and or the document, or only the embed
    embed = yield getEmbedAndOrDocument(id, request.pre.user.id);
  } catch (e) {
    response.error =  Config.messages.embed.save.getFailed;
    return reply(response);
  }

  // 3. Check if user is author
  if (embed._creatorId === request.pre.user.id) {
    embed.code = data.code;
    try {
      yield embed.save(); // save changes
    } catch (e) {
      console.log(e);
      response.error =  Config.messages.embed.save.saveFailed;
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

      response.error = Config.messages.embed.save.saveFailed;
      return reply(response);
    }

    response.document = codeDocument;
    return reply(response);
  }

  // No previous codeDocumen to update, ow we need to create a new codeDocument
  codeDocument = new CodeDocument({
    codeEmbedId: id,
    code: data.code,
    _ownerId: request.pre.user.id
  });

  // get id from database
  try {
    codeDocument = yield codeDocument.save();
    response.document = codeDocument;
  } catch (e) {
    console.log(e);

    response.error = Config.messages.embed.save.saveFailed;
    return reply(response);
  }

  return reply(response);
}

/**
 * Creates a new dummy Embed and tries to run it
 */
export function* runEmbed(request, reply) {
  // ToDo: create new Embed
  // need id
  // set mode to disable saving
  let embed;
  const code = request.query.code;
  const language = request.query.language;
  const embedType = request.query.embedType || 'sourcebox';

  // create a new embed with this information
  let userData = {
    username: request.pre.user.username,
    email: request.pre.user.email,
    id: request.pre.user.id
  };

  let nonpersistentId = request.query.id; // we do not store this embed on the disk!
  if (nonpersistentId == null) {
    nonpersistentId = UUID.v4();
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

  embed = new CodeEmbed({
    code: codeObj,
    id: nonpersistentId,
    meta: {
      language: language,
      embedType: embedType,
      name: 'Schnellausführung',
      mainFile: filename
    },
    assets: []
  });
  // error occured

  // is user author of the embed
  userData.isAuthor = embed._creatorId === request.pre.user.id;

  // students cannot save/change this
  const mode = MODES.RunMode;

  embed._mode = mode;

  let sourceboxAuthToken = JWT.sign({
    username: request.pre.user.username
  }, Config.sourcebox.secret);

  let websocketAuthToken = JWT.sign({
    username: request.pre.user.username,
    userid: request.pre.user.id,
    isAuthor: false, /* Disallow all possible functionality as we do not have an id */
    isOwner: false
  }, Config.websocket.secret);

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
  return reply.view('embed', {
    user: request.pre.user,
    INITIAL_DATA:  JSON.stringify(embed),
    USER_DATA:  JSON.stringify(userData),
    sourcebox: JSON.stringify({
      server: Config.sourcebox.url,
      authToken: sourceboxAuthToken
    }),
    websocket: JSON.stringify({
      server: Config.websocket.url,
      authToken: websocketAuthToken
    })
  });

}

/**
 * Handler for creating new embeds. This handler does only create an empty embed without any code files or assets.
 *
 * @export
 * @param {any} request
 * @param {any} reply
 * @returns
 */
export function* createEmbed (request, reply) {
  let {name, embedType, language} = request.payload;
  let response = { };
  let embed;

  // If any validation error has occured, reply with error
  if (request.pre.validation) {
    response.error = Config.messages.embed.create.invalid;
    return reply(response);
  }

  // 1. Check the payload
  if (embedType !== 'sourcebox' && embedType !== 'skulpt') {
    response.error = `${Config.messages.embed.create.invalidEmbedType} ${embedType}`;
    return reply(response);
  }

  // Get language extension mapping
  let extension = getFileExtensionByLanguage(language);

  if (extension == null) {
    console.warn('embed.createEmbed received invalid language.');
    extension = language;
  }

  let mainFile = `main.${extension}`;

  // 4. Create codeEmbed
  embed = new CodeEmbed({
    _creatorId: request.pre.user.id,
    meta: CodeEmbed.getDefaultMeta(name, language, embedType, mainFile),
    code: {},
    assets: []
  });

  // Get id from database
  try {
    embed = yield embed.save();
    response.id = embed.id;
  } catch (e) {
    console.log(e);

    response.error = Config.messages.embed.create.saveFailed;
    return reply(response);
  }

  return reply(response);
}