/**
 * Course Controller
 *
 * Handles viewing and editing courses
 */
import JWT from 'jsonwebtoken';
import UUID from 'uuid';
import Slug from 'speakingurl';
import Boom from 'boom';
import Joi from 'joi';
import Thinky from '../util/thinky';
import isString from 'lodash/isString';
import {
  toRelativeDate
} from '../util/dateUtils';
import CodeEmbed from '../models/codeEmbed';
import RecycleBin from '../models/recyclebin';
import EventLog from '../models/eventLog';
import CodeDocument from '../models/codeDocument';
import {
  getFileExtensionByLanguage,
  getTemplateContentByLanguage
} from '../../common/util/languageUtils';
import {
  getEmbedAndOrDocument,
  getEmbedMetadata
} from '../util/embedUtils';
import Config from '../../config/webbox.config';
import {
  MODES,
  EmbedTypes
} from '../../common/constants/Embed';
import {
  canEditEmbed,
  canDeleteEmbed,
  canUpdateEmbed,
  canViewStatistics
} from '../roles/embedChecks';
import Log from '../models/log';

/**
 * Validation schema for id specified in UUID format
 */
const SLUGORID_SCHEMA = {
  idOrSlug: Joi.string().guid()
};

export function*getEmbedsForUser(request, reply) {
  try {
    let embeds = [];
    if (request.pre.user.isAnonymous === true) {
      return reply.redirect('/');
    }

    try {
      embeds = yield CodeEmbed.orderBy(Thinky.r.desc('lastUpdate')).filter({
        _creatorId: request.pre.user.id
      }).run().map((ce) => {
        // Time-Transformation
        let relDate = toRelativeDate(ce.lastUpdate);
        return ce.merge({
          relativeDate: relDate
        });
      });
    } catch (e) {
      console.error('embed.getEmbedsForUser', e);
      embeds = [];
    }

    return reply.view('embeds', {
      user: request.pre.user,
      embeds: embeds,
      next: request.path
    });
  } catch (e) {
    console.error(e);
    return e;
  }
}

export function*getCodeDocumentsForUser(request, reply) {
  let codeDocuments = [];

  if (request.pre.user.isAnonymous === true) {
    return reply.redirect('/');
  }

  try {
    codeDocuments = yield CodeDocument.orderBy(Thinky.r.desc('lastUpdate'))
      .filter({
        '_ownerId': request.pre.user.id
      }).getJoin({
        embed: true
      })
      .pluck('id', 'codeEmbedId', 'lastUpdate', {
        'embed': ['meta']
      })
      .execute()
      .map((ce) => {
        // Time-Transformation
        let relDate = toRelativeDate(ce.lastUpdate);
        return ce.merge({
          relativeDate: relDate
        });
      });
  } catch (e) {
    console.error('embed.getCodeDocumentsForUser', e);
    codeDocuments = [];
  }

  return reply.view('codedocuments', {
    user: request.pre.user,
    codeDocuments: codeDocuments,
    next: request.path
  });
}

/**
 * Creates context data for requested embed data.
 *
 * @param {any} embed - embed
 * @param {any} userData - user data
 * @param {any} user - user object
 * @returns {object} common context data
 */
function createContextData(embed, userData) {
  let sourceboxAuthToken = '';

  if (embed.meta.embedType === EmbedTypes.Sourcebox) {
    sourceboxAuthToken = JWT.sign({
      username: userData.username
    }, Config.sourcebox.secret, {
      expiresIn: Config.sourcebox.expiresIn
    });
  }

  // Set up the jsonwebtoken for the websocket connection
  const websocketAuthToken = JWT.sign({
    username: userData.username,
    userid: userData.id,
    isAuthor: userData.scope.includes('author'),
    isOwner: userData.id === embed._creatorId
  }, Config.websocket.secret, {
    expiresIn: Config.websocket.expiresIn
  });

  // Remove the scope information, we do not need it
  delete userData.scope;

  const contextData = {
    INITIAL_DATA: embed,
    USER_DATA: userData,
    sourcebox: {
      server: Config.sourcebox.url,
      authToken: sourceboxAuthToken,
      transports: Config.sourcebox.transports
    },
    websocket: {
      server: Config.websocket.url,
      authToken: websocketAuthToken
    }
  };

  return contextData;
}

/**
 * Returns meta data information about the given embed
 * 
 * @export
 * @param {any} request - response
 * @param {any} reply - reply
 * @returns {object} - reply
 */
export function*getEmbedMetadataAjax(request, reply) {
  const id = request.params.id;
  let response = {};

  // Get the embed and or the document, or only the embed
  const embed = yield getEmbedMetadata(id);
  if (embed.isBoom) {
    response.error = {
      title: embed.output.payload.error,
      status: embed.output.statusCode,
      message: embed.output.payload.message
    };

    return reply(response);
  }

  // ToDo: should set the exposed attributes explicitly here?
  response = embed;

  return reply(response);
}

export function*getEmbedAjax(request, reply) {
  // The id can be an guid or a slug
  const id = request.params.id;
  const showOriginal = request.query.showOriginal;
  const showDocument = request.query.showDocument;
  const canAcessSourcebox = request.auth.isAuthenticated;
  let userData;
  const response = {};

  // Check if the user is authenticated or not
  if (request.auth.isAuthenticated === false) {
    userData = {
      isAnonymous: true,
      username: 'anonymous',
      scope: [],
      email: undefined,
      id: undefined
    };
  } else {
    userData = {
      isAnonymous: false,
      username: request.pre.user.username,
      scope: request.pre.user.scope,
      email: request.pre.user.email,
      id: request.pre.user.id
    };
  }

  let mode;

  // Get the embed and or the document, or only the embed
  const embed = yield getEmbedAndOrDocument(id, userData.id, showOriginal, showDocument);
  if (embed.isBoom) {
    response.error = {
      title: embed.output.payload.error,
      status: embed.output.statusCode,
      message: embed.output.payload.message
    };

    return reply(response);
  }

  // Redirect to login, if user tries to access sourcebox
  if (embed.meta.embedType === EmbedTypes.Sourcebox && canAcessSourcebox === false) {
    // show redirect to login
    const error = Boom.unauthorized();
    response.error = {
      title: error.output.payload.error,
      status: error.output.statusCode,
      message: error.output.payload.message
    };
    return reply(response);
  }

  // Is user author of the embed?
  userData.isAuthor = canEditEmbed(embed, request.pre.user);
  userData.canShowStatistics = canViewStatistics(embed, request.pre.user);
  userData.isDocumentOwner = embed._document && embed._document._ownerId === userData.id;

  // Remove creators data from object
  if (userData.isAuthor === false) {
    delete embed.creators;
  }

  if (!userData.isAuthor && !userData.isDocumentOwner && !embed._document) {
    mode = MODES.Default; //"STUDENT_WITHOUT_MODIFICATIONS";
  } else if (!userData.isAuthor && userData.isDocumentOwner) {
    mode = MODES.Default; //"STUDENT_WITH_MODIFICATIONS";
  } else if (userData.isAuthor && embed._document) {
    mode = MODES.ViewDocument; //"AUTHOR_VIEW_DOCUMENT";
  } else if (!userData.isAuthor && embed._document) {
    mode = MODES.ViewDocument; //"STUDENT_VIEW_DOCUMENT";
  } else if (userData.isAuthor && embed._document == null) {
    // Author views own embed
    mode = MODES.Default;
  } else {
    mode = MODES.Unknown;
  }

  embed._mode = mode;

  const contextData = createContextData(embed, userData);

  return reply(contextData);
}

/**
 * Handles embed requests. This involves some logic. The request may contain a showDocument or showOriginal query.
 * Additionally, with no query we try to deliver a CodeDocument for the CodeEmbed when the user has a saved version.
 *
 * @export
 * @param {any} request - request
 * @param {any} reply - reply
 * @returns {object} reply
 */
export function*getEmbed(request, reply) {
  // The id can be an guid or a slug
  const id = request.params.id;
  const showOriginal = request.query.showOriginal;
  const showDocument = request.query.showDocument;
  let embed;
  const canAcessSourcebox = request.auth.isAuthenticated;
  let userData;

  // Check if the user is authenticated or not
  if (request.auth.isAuthenticated === false) {
    userData = {
      isAnonymous: true,
      username: 'anonymous',
      scope: [],
      email: undefined,
      id: undefined
    };
  } else {
    userData = {
      isAnonymous: false,
      username: request.pre.user.username,
      scope: request.pre.user.scope,
      email: request.pre.user.email,
      id: request.pre.user.id
    };
  }

  let mode;

  // Get the embed and or the document, or only the embed
  embed = yield getEmbedAndOrDocument(id, userData.id, showOriginal, showDocument);
  if (embed.isBoom) {
    return reply(embed);
  }

  // Redirect to login, if user tries to access sourcebox
  if (embed.meta.embedType === EmbedTypes.Sourcebox && canAcessSourcebox === false) {
    // show redirect to login
    return reply.redirect(`/login?next=${request.path}`);
  }

  // Is user author of the embed?
  userData.isAuthor = canEditEmbed(embed, request.pre.user);
  userData.canShowStatistics = canViewStatistics(embed, request.pre.user);
  userData.isDocumentOwner = embed._document && embed._document._ownerId === userData.id;

  // Remove creators data from object
  if (userData.isAuthor === false) {
    delete embed.creators;
  }

  if (!userData.isAuthor && !userData.isDocumentOwner && !embed._document) {
    mode = MODES.Default; //"STUDENT_WITHOUT_MODIFICATIONS";
  } else if (!userData.isAuthor && userData.isDocumentOwner) {
    mode = MODES.Default; //"STUDENT_WITH_MODIFICATIONS";
  } else if (userData.isAuthor && embed._document) {
    mode = MODES.ViewDocument; //"AUTHOR_VIEW_DOCUMENT";
  } else if (!userData.isAuthor && embed._document) {
    mode = MODES.ViewDocument; //"STUDENT_VIEW_DOCUMENT";
  } else if (userData.isAuthor && embed._document == null) {
    // Author views own embed
    mode = MODES.Default;
  } else {
    mode = MODES.Unknown;
  }

  embed._mode = mode;

  let template = 'embed';

  // Deliever skulpt template for skulpt projects
  if (embed.meta.embedType === 'skulpt') {
    template = 'embed-skulpt';
  }

  const contextData = createContextData(embed, userData);

  contextData.INITIAL_DATA = JSON.stringify(contextData.INITIAL_DATA);
  contextData.sourcebox = JSON.stringify(contextData.sourcebox);
  contextData.websocket = JSON.stringify(contextData.websocket);
  contextData.USER_DATA = JSON.stringify(contextData.USER_DATA);
  contextData.user = request.pre.user;

  return reply.view(template, contextData);
}

/**
 * Handles update requests for attributes of an embed.
 *
 * @export
 * @param {any} request - request
 * @param {any} reply - reply
 * @returns {object} reply
 */
export function*updateEmbed(request, reply) {
  const response = {};
  const id = request.params.id;
  const data = {};
  let embed;

  if (request.pre.user.isAnonymous === true) {
    return reply({
      error: Config.messages.embed.notAuthenticated
    });
  }

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

  if (!data.meta || !data.assets) {
    response.error = 'Invalid data';
    return reply(response);
  }

  // Slug checks
  if (data.slug != null && data.slug.length > 3) {
    // Enforce slug to be a real slug!
    data.slug = Slug(data.slug);

    // Now check if the slug does already exist
    try {
      const count = yield CodeEmbed.countBySlug(data.slug, [id]);
      if (count > 0) {
        data.slug = Slug(`${data.slug}-${count}`);
      }
    } catch (e) {
      // something went wrong with the query
      console.error('embed.updateEmbed', e);
      response.error = 'Server error';
      reply(response);
    }

  } else {
    delete data.slug;
  }

  // Check mainFile and replace extension to match language
  if (data.meta.mainFile && data.meta.mainFile !== '') {
    let ext;
    let newExtension;
    // Check if current language is used by the extension
    ext = data.meta.mainFile.split('.');

    if (ext.length > 1) {
      ext = ext[ext.length - 1]; // get last item in array

      newExtension = getFileExtensionByLanguage(data.meta.language);

      if (ext !== newExtension) {
        data.meta.mainFile = data.meta.mainFile.replace(`.${ext}`, `.${newExtension}`);
      }
    }
  }

  // Check if user is author
  if (canUpdateEmbed(embed, request.pre.user)) {
    try {
      yield embed.merge(data).save(); // save changes
    } catch (e) {
      console.error(e);
      response.error = Config.messages.embed.save.saveFailed;
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
 * @param {request} request - request
 * @param {reply} reply - reply
 * @returns {object} reply
 */
export function*saveEmbed(request, reply) {
  const id = request.params.id;
  const data = request.payload.data;
  const response = {};
  let embed;
  let codeDocument;
  let codeValidationResult;

  // If any validation error has occured, reply with error
  if (request.pre.validation) {
    response.error = Config.messages.embed.save.invalid;
    return reply(response);
  }

  if (request.pre.user.isAnonymous === true) {
    return reply({
      error: Config.messages.embed.notAuthenticated
    });
  }

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
    return reply({
      error: Config.messages.embed.save.invalid
    });
  }

  try {
    // 2. gets the embed and or the document, or only the embed
    embed = yield getEmbedAndOrDocument(id, request.pre.user.id);
  } catch (e) {
    response.error = Config.messages.embed.save.getFailed;
    return reply(response);
  }

  // 3. Check if user is author
  if (canEditEmbed(embed, request.pre.user)) {
    embed.code = data.code;
    try {
      yield embed.save(); // save changes
    } catch (e) {
      console.log(e);
      response.error = Config.messages.embed.save.saveFailed;
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
 * @param {request} request - request
 * @param {reply} reply - reply
 * @returns {object} reply
 */
export function*runEmbed(request, reply) {
  let embed;
  const canAcessSourcebox = request.auth.isAuthenticated;
  const code = request.query.code;
  const language = request.query.language;
  const embedType = request.query.embedType || EmbedTypes.Sourcebox;

  // If any validation error has occured, reply with error
  if (request.pre.validation) {
    request.log(['validation', 'error'], {
      message: 'Failed validation payload',
      data: request.pre.validation
    });
    return reply(Boom.badRequest(Config.messages.embed.invalidRequest));
  }

  // Redirect to login, if user tries to access sourcebox
  if (embedType === EmbedTypes.Sourcebox && canAcessSourcebox === false) {
    // show redirect to login
    return reply.redirect(`/login?next=${encodeURIComponent(request.path)}`);
  }

  // create a new embed with this information
  const userData = {
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

  const filename = `main.${extension}`;
  const codeObj = {};
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

  // Set up the jsonwebtoken for the sourcebox server
  let sourceboxAuthToken = '';
  if (embedType === EmbedTypes.Sourcebox) {
    sourceboxAuthToken = JWT.sign({
      username: request.pre.user.username
    }, Config.sourcebox.secret);
  }

  const websocketAuthToken = JWT.sign({
    username: request.pre.user.username,
    userid: request.pre.user.id,
    isAuthor: false,
    /* Disallow all possible functionality as we do not have an id */
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

  let template = 'embed';

  // Deliever skulpt template for skulpt projects
  if (embedType === EmbedTypes.Skulpt) {
    template = 'embed-skulpt';
  }

  return yield reply.view(template, {
    user: request.pre.user,
    INITIAL_DATA: JSON.stringify(embed),
    USER_DATA: JSON.stringify(userData),
    sourcebox: JSON.stringify({
      server: Config.sourcebox.url,
      authToken: sourceboxAuthToken,
      transports: Config.sourcebox.transports
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
 * @param {any} request - hapi request
 * @param {any} reply - hapi reply
 * @returns {object} reply
 */
export function*createEmbed(request, reply) {
  const {
    name,
    embedType,
    language
  } = request.payload;
  const response = {};
  let embed;

  if (request.pre.user.isAnonymous === true) {
    return reply({
      error: Config.messages.embed.notAuthenticated
    });
  }

  // If any validation error has occured, reply with error
  if (request.pre.validation) {
    response.error = Config.messages.embed.create.invalid;
    return reply(response);
  }

  // 1. Check the payload
  if (embedType !== EmbedTypes.Sourcebox && embedType !== 'skulpt') {
    response.error = `${Config.messages.embed.create.invalidEmbedType} ${embedType}`;
    return reply(response);
  }

  // Get language extension mapping
  let extension = getFileExtensionByLanguage(language);

  if (extension == null) {
    console.warn('embed.createEmbed received invalid language.');
    extension = language;
  }

  const mainFile = `main.${extension}`;

  // 4. Create codeEmbed
  embed = new CodeEmbed({
    _creatorId: request.pre.user.id,
    meta: CodeEmbed.getDefaultMeta(name, language, embedType, mainFile),
    code: {},
    assets: []
  });

  // Create default file
  embed.code[mainFile] = getTemplateContentByLanguage(language);

  // Get id from database
  try {
    embed = yield embed.save();
    response.id = embed.id;

    // Add creator relationship
    yield CodeEmbed.addCreator(embed.id, embed._creatorId);
  } catch (e) {
    console.log(e);

    response.error = Config.messages.embed.create.saveFailed;
    return reply(response);
  }

  return reply(response);
}

/**
 * Handles the creation of new documents. Redirects to the new document if created successfully
 *
 * @export
 * @param {any} request - request
 * @param {any} reply - reply
 * @returns {object} reply
 */
export function*createEmbedAndRedirect(request, reply) {
  const {
    name,
    embedType,
    language
  } = request.payload;
  const response = {};
  let embed;
  let redirectPath;

  // If any validation error has occured, reply with error
  if (request.pre.validation) {
    request.log(['validation', 'error'], {
      message: 'Failed validation payload',
      data: request.pre.validation
    });
    return reply(Boom.badRequest(Config.messages.embed.create.invalid));
  }

  // 1. Check the payload
  if (embedType !== EmbedTypes.Sourcebox && embedType !== 'skulpt') {
    request.log(['validation', 'error'], `Invalid EmbedType: ${embedType}`);
    return reply(Boom.badRequest(`${Config.messages.embed.create.invalidEmbedType} ${embedType}`));
  }

  // Get language extension mapping
  let extension = getFileExtensionByLanguage(language);

  if (extension == null) {
    request.log(['validation', 'info'], `Invalid language: ${language}`);
    extension = language;
  }

  const mainFile = `main.${extension}`;

  // 4. Create codeEmbed
  embed = new CodeEmbed({
    _creatorId: request.pre.user.id,
    meta: CodeEmbed.getDefaultMeta(name, language, embedType, mainFile),
    code: {},
    assets: []
  });

  // Create default file
  embed.code[mainFile] = getTemplateContentByLanguage(language);

  // Save the embed
  try {
    embed = yield embed.save(); // save
    yield CodeEmbed.addCreator(embed.id, embed._creatorId);
  } catch (e) {
    console.errorlog(e);
    return reply(Boom.badRequest());
  }

  redirectPath = `/embed/${embed.id}`;

  // Everything went good, now do a redirect
  return reply.redirect(redirectPath);
}

export function*deleteEmbed(request, reply) {
  const id = request.params.idOrSlug;
  const response = {};
  let embed;
  let documents;
  let validationResult;

  if (request.pre.user.isAnonymous === true) {
    return reply({
      error: Config.messages.embed.notAuthenticated
    });
  }

  // Get embed
  try {
    // Check for uuid
    validationResult = Joi.validate({
      idOrSlug: id
    }, SLUGORID_SCHEMA);
    if (validationResult.error == null) {
      embed = yield CodeEmbed.get(id).run();
    } else {
      // not an uuid, try slug
      embed = yield CodeEmbed.getBySlug(id);
    }
  } catch (e) {
    console.warn(e);
    response.error = 'Embed not found';
    return reply(response);
  }

  // Check rights
  if (canDeleteEmbed(embed, request.pre.user) === false) {
    response.error = 'Sie besitzen nicht das Recht dieses Beispiel zu löschen.';
    return reply(response);
  }

  try {
    RecycleBin.addEntry(embed, 'CodeEmbed', request.pre.user.id);
    yield embed.delete();
  } catch (e) {
    console.error(e);
    response.error = 'Failed to delete the embed';

    return reply(response);
  }

  // try to delete all associated codeDocuments
  try {
    documents = yield CodeDocument.filter({
      codeEmbedId: embed.id
    });
    if (documents && documents.length > 0) {
      yield documents.delete();
    }
  } catch (e) {
    Log.createLog('Embed.Delete', 'Failed to delete associated code documents for embed', {
      error: e.toString(),
      embedId: embed.id
    }, 'Error');
    console.error(e);
  }

  // Everything went okay
  return reply(response);
}

export function*exportStatistics(request, reply) {
  const embedId = request.params.idOrSlug;
  let statistics;
  let embed;
  let validationResult;
  let jsonData;
  let events;
  let filter;
  let order;

  // Resolve embed and then check rights
  // Get embed
  try {
    // Check for uuid
    validationResult = Joi.validate({
      idOrSlug: embedId
    }, SLUGORID_SCHEMA);
    if (validationResult.error == null) {
      embed = yield CodeEmbed.get(embedId).run();
    } else {
      // not an uuid, try slug
      embed = yield CodeEmbed.getBySlug(embedId);
    }
  } catch (e) {
    console.warn(e);
    return reply(Boom.notFound('Es konnte kein Codebeispiel mit dieser ID/Slug gefunden werden.'));
  }

  // Check rights of the user
  if (embed._creatorId !== request.pre.user.id && !request.pre.user.scope.includes('admin')) {
    return reply(Boom.notAllowed('Sie besitzen nicht die benötigen Rechte, um die Statistiken für dieses Beispiel abzurufen.'));
  }

  filter = {
    embedId: embed.id
  };
  order = {
    index: 'timeStamp'
  };

  try {
    events = yield EventLog.orderBy(order).filter(filter).run();
  } catch (err) {
    console.error('websocket.getEvents EventLog filtering for embed failed', err);
    return reply(Boom.badData('Fehler beim Aufbereiten der Statistiken.'));
  }

  jsonData = {
    events: events
  };

  try {
    statistics = JSON.stringify(jsonData, null, 2);
  } catch (e) {
    console.error('embed.exportStatistics', e);
    return reply(Boom.badData('Die Statistiken konnte nicht exportiert werden.'));
  }

  reply(statistics).type('text/plain');
}

export function*getAutocomplete(request, reply) {
  const response = {};
  let embedsInfo;

  const user = request.pre.user;
  const search = request.query.search;

  let matcher;

  if (search != null && search != '' && isString(search)) {
    matcher = doc => {
      return doc('meta')('name').match(search);
    };
  }

  try {
    if (matcher == null) {
      embedsInfo = yield CodeEmbed.filter({
        _creatorId: user.id
      }).pluck('id', 'meta', 'slug').execute();
    } else {
      embedsInfo = yield CodeEmbed.filter({
        _creatorId: user.id
      }).filter(matcher).pluck('id', 'meta', 'slug').execute();
    }
  } catch (e) {
    console.log(e);
    response.error = 'Failed to retrieve code-embed information.';
    return reply(response);
  }

  response.embedsInfo = embedsInfo;

  return reply(response);
}