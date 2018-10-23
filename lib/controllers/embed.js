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
import Promise from 'bluebird';

import {
  toRelativeDate
} from '../util/dateUtils';
import CodeEmbed from '../models/codeEmbed';
import User from '../models/user';
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

const EMAIL_SCHEMA = {
  email: Joi.string().email()
};

export async function getEmbedsForUser(request, h) {
  try {
    let embeds = [];
    if (request.pre.user.isAnonymous === true) {
      return h.redirect('/');
    }

    try {
      embeds = await CodeEmbed.orderBy(Thinky.r.desc('lastUpdate')).filter({
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

    return h.view('embeds', {
      user: request.pre.user,
      embeds: embeds,
      next: request.path
    });
  } catch (e) {
    console.error(e);
    return e;
  }
}

export async function getCodeDocumentsForUser(request, h) {
  let codeDocuments = [];

  if (request.pre.user.isAnonymous === true) {
    return h.redirect('/');
  }

  try {
    codeDocuments = await CodeDocument.orderBy(Thinky.r.desc('lastUpdate'))
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

  return h.view('codedocuments', {
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
 * @param {any} h - reply toolkit
 * @returns {object} - reply
 */
export async function getEmbedMetadataAjax(request, h) {
  const id = request.params.id;
  let response = {};

  // Get the embed and or the document, or only the embed
  const embed = await getEmbedMetadata(id);
  if (embed.isBoom) {
    response.error = {
      title: embed.output.payload.error,
      status: embed.output.statusCode,
      message: embed.output.payload.message
    };

    return response;
  }

  // ToDo: should set the exposed attributes explicitly here?
  response = embed;

  return response;
}

export async function getEmbedAjax(request, h) {
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
  const embed = await getEmbedAndOrDocument(id, userData.id, showOriginal, showDocument);
  if (embed.isBoom) {
    response.error = {
      title: embed.output.payload.error,
      status: embed.output.statusCode,
      message: embed.output.payload.message
    };

    return response;
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
    return response;
  }

  // Is user author of the embed?
  userData.isAuthor = canEditEmbed(embed, request.pre.user) || canUpdateEmbed(embed, request.pre.user);
  userData.canShowStatistics = canViewStatistics(embed, request.pre.user);

  userData.isDocumentOwner = embed._document && embed._document._ownerId === userData.id;

  // If we grant more rights to user that already has a document, we need to remove any document
  if (userData.isAuthor && userData.isDocumentOwner) {
    userData.isDocumentOwner = false;
    delete embed._document;
  }

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

  return contextData;
}

/**
 * Handles embed requests. This involves some logic. The request may contain a showDocument or showOriginal query.
 * Additionally, with no query we try to deliver a CodeDocument for the CodeEmbed when the user has a saved version.
 *
 * @export
 * @param {any} request - request
 * @param {any} h - reply toolkit
 * @returns {object} reply
 */
export async function getEmbed(request, h) {
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
  embed = await getEmbedAndOrDocument(id, userData.id, showOriginal, showDocument);
  if (embed.isBoom) {
    return embed;
  }

  console.log(embed);
  // Redirect to login, if user tries to access sourcebox
  if (embed.meta.embedType === EmbedTypes.Sourcebox && canAcessSourcebox === false) {
    // show redirect to login
    return h.redirect(`/login?next=${request.path}`);
  }

  // Is user author of the embed?
  userData.isAuthor = userData.isAuthor = canEditEmbed(embed, request.pre.user) || canUpdateEmbed(embed, request.pre.user);
  userData.canShowStatistics = canViewStatistics(embed, request.pre.user);
  userData.isDocumentOwner = embed._document && embed._document._ownerId === userData.id;

  // If we grant more rights to user that already has a document, we need to remove any document
  if (userData.isAuthor && userData.isDocumentOwner) {
    userData.isDocumentOwner = false;
    delete embed._document;
  }

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

  return h.view(template, contextData);
}

/**
 * Handles update requests for attributes of an embed.
 *
 * @export
 * @param {any} request - request
 * @param {any} h - reply toolkit
 * @returns {object} reply
 */
export async function updateEmbed(request, h) {
  const response = {};
  const id = request.params.id;
  const data = {};
  let embed;

  if (request.pre.user.isAnonymous === true) {
    return {
      error: Config.messages.embed.notAuthenticated
    };
  }

  // If any validation error has occured, reply with error
  if (request.pre.validation) {
    response.error = Config.messages.embed.create.invalid;
    return response;
  }

  // Get embed without any logic
  try {
    embed = await CodeEmbed.get(id).run();
  } catch (e) {
    response.error = 'Invalid embed id';
  }

  // Only use allowed attributes, ignore anything else
  data.slug = request.payload.data.slug;

  data.assets = request.payload.data.assets || [];
  data.meta = request.payload.data.meta;

  if (!data.meta || !data.assets) {
    response.error = 'Invalid data';
    return response;
  }

  // Slug checks
  if (data.slug != null && data.slug.length > 3) {
    // Enforce slug to be a real slug!
    data.slug = Slug(data.slug);

    // Now check if the slug does already exist
    try {
      const count = await CodeEmbed.countBySlug(data.slug, [id]);
      if (count > 0) {
        data.slug = Slug(`${data.slug}-${count}`);
      }
    } catch (e) {
      // something went wrong with the query
      console.error('embed.updateEmbed', e);
      response.error = 'Server error';
      return response;
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

  // Creators list
  const rawCreators = request.payload.data.creators; // data from client
  let creatorsWithValidEmail = [];


  creatorsWithValidEmail = rawCreators.filter(item => {
    const email = item.email != null ? item.email : item;
    const result = Joi.validate({ email: email }, EMAIL_SCHEMA);
    return result.error == null;
  });


  if (creatorsWithValidEmail.length !== rawCreators.length) {
    response.error = 'Please use email addresses for designating creators!';
    return response;
  }

  let newCreators;
  try {
    newCreators = await Promise.map(creatorsWithValidEmail, (item) => {
      const email = item.email != null ? item.email : item;
      const emailLower = email.toLowerCase();
      return User.filter({email: emailLower})
        .nth(0)
        .pluck({email: true, id: true})
        .default(null)
        .execute();
    });
  } catch (err) {
    console.error(err);
    response.error = Config.messages.embed.save.saveFailed;
    return response;
  }

  if (newCreators.includes(null)) {
    response.error = 'One or more email address is wrong and not in the user database.';
    return response;
  }

  // Check if user is author
  if (canUpdateEmbed(embed, request.pre.user)) {
    try {
      await embed.merge(data).save(); // save changes

      // First clear all relations
      await embed.removeRelation('creators');
      console.info('Removed all creators relations');

      // now add new creators by creating the relationships between the embed and user
      await Promise.map(newCreators, (creator) => {
        embed.addRelation('creators', {id: creator.id});
      });

      console.info('Added new relationships');

    } catch (e) {
      console.error(e);
      response.error = Config.messages.embed.save.saveFailed;
      return response;
    }

    return response;
  }

  return response;
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
 * @param {reply} h - reply toolkit
 * @returns {object} reply
 */
export async function saveEmbed(request, h) {
  const id = request.params.id;
  const data = request.payload.data;
  const response = {};
  let embed;
  let codeDocument;
  let codeValidationResult;

  // If any validation error has occured, reply with error
  if (request.pre.validation) {
    response.error = Config.messages.embed.save.invalid;
    return response;
  }

  if (request.pre.user.isAnonymous === true) {
    return {
      error: Config.messages.embed.notAuthenticated
    };
  }

  // 1. Check the code
  try {
    codeValidationResult = CodeEmbed.validateCodeData(data.code);
    if (codeValidationResult.valid === false) {
      // exit early
      response.error = Config.messages.embed.save.invalidCodeData;
      response.errorData = codeValidationResult.errors;

      return response;
    }
  } catch (e) {
    // error while validating
    return {
      error: Config.messages.embed.save.invalid
    };
  }

  try {
    // 2. gets the embed and or the document, or only the embed
    embed = await getEmbedAndOrDocument(id, request.pre.user.id);
  } catch (e) {
    response.error = Config.messages.embed.save.getFailed;
    return response;
  }

  // 3. Check if user is author
  if (canEditEmbed(embed, request.pre.user)) {
    embed.code = data.code;
    try {
      // get the object and update accordingly
      let embedObj = await CodeEmbed.get(embed.id).run();

      // Do explicit replace old code, .merge() would never delete files!
      embedObj.code = data.code;
      await embedObj.save();
    } catch (e) {
      console.log(e);
      response.error = Config.messages.embed.save.saveFailed;
      return response;
    }

    response.document = null;

    return response;
  }

  // 4. Check if there is an associated codeDocument for the user
  try {
    codeDocument = await CodeDocument.filter({
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
      codeDocument = await codeDocument.save();
    } catch (e) {
      console.log(e);

      response.error = Config.messages.embed.save.saveFailed;
      return response;
    }

    response.document = codeDocument;
    return response;
  }

  // No previous codeDocumen to update, ow we need to create a new codeDocument
  codeDocument = new CodeDocument({
    codeEmbedId: id,
    code: data.code,
    _ownerId: request.pre.user.id
  });

  // get id from database
  try {
    codeDocument = await codeDocument.save();
    response.document = codeDocument;
  } catch (e) {
    console.log(e);

    response.error = Config.messages.embed.save.saveFailed;
    return response;
  }

  return response;
}

/**
 * Creates a new dummy Embed and tries to run it
 * @param {request} request - request
 * @param {reply} h - reply toolkit
 * @returns {object} reply
 */
export async function runEmbed(request, h) {
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
    return Boom.badRequest(Config.messages.embed.invalidRequest);
  }

  // Redirect to login, if user tries to access sourcebox
  if (embedType === EmbedTypes.Sourcebox && canAcessSourcebox === false) {
    // show redirect to login
    return h.redirect(`/login?next=${encodeURIComponent(request.path)}`);
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

  return h.view(template, {
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
 * @param {any} h - reply toolkit
 * @returns {object} reply
 */
export async function createEmbed(request, h) {
  const {
    name,
    embedType,
    language
  } = request.payload;
  const response = {};
  let embed;

  if (request.pre.user.isAnonymous === true) {
    return {
      error: Config.messages.embed.notAuthenticated
    };
  }

  // If any validation error has occured, reply with error
  if (request.pre.validation) {
    response.error = Config.messages.embed.create.invalid;
    return response;
  }

  // 1. Check the payload
  if (embedType !== EmbedTypes.Sourcebox && embedType !== 'skulpt') {
    response.error = `${Config.messages.embed.create.invalidEmbedType} ${embedType}`;
    return response;
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
    embed = await embed.save();
    response.id = embed.id;

    // Add creator relationship
    await CodeEmbed.addCreator(embed.id, embed._creatorId);
  } catch (e) {
    console.log(e);

    response.error = Config.messages.embed.create.saveFailed;
    return response;
  }

  return response;
}

/**
 * Handles the creation of new documents. Redirects to the new document if created successfully
 *
 * @export
 * @param {any} request - request
 * @param {any} h - reply toolkit
 * @returns {object} reply
 */
export async function createEmbedAndRedirect(request, h) {
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
    return Boom.badRequest(Config.messages.embed.create.invalid);
  }

  // 1. Check the payload
  if (embedType !== EmbedTypes.Sourcebox && embedType !== 'skulpt') {
    request.log(['validation', 'error'], `Invalid EmbedType: ${embedType}`);
    return Boom.badRequest(`${Config.messages.embed.create.invalidEmbedType} ${embedType}`);
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
    embed = await embed.save(); // save
    await CodeEmbed.addCreator(embed.id, embed._creatorId);
  } catch (e) {
    console.error(e);
    return Boom.badRequest();
  }

  redirectPath = `/embed/${embed.id}`;

  // Everything went good, now do a redirect
  return h.redirect(redirectPath);
}

export async function deleteEmbed(request, h) {
  const id = request.params.idOrSlug;
  const response = {};
  let embed;
  let documents;
  let validationResult;

  if (request.pre.user.isAnonymous === true) {
    return {
      error: Config.messages.embed.notAuthenticated
    };
  }

  // Get embed
  try {
    // Check for uuid
    validationResult = Joi.validate({
      idOrSlug: id
    }, SLUGORID_SCHEMA);
    if (validationResult.error == null) {
      embed = await CodeEmbed.get(id).run();
    } else {
      // not an uuid, try slug
      embed = await CodeEmbed.getBySlug(id);
    }
  } catch (e) {
    console.warn(e);
    response.error = 'Embed not found';
    return response;
  }

  // Check rights
  if (canDeleteEmbed(embed, request.pre.user) === false) {
    response.error = 'Sie besitzen nicht das Recht dieses Beispiel zu löschen.';
    return response;
  }

  try {
    RecycleBin.addEntry(embed, 'CodeEmbed', request.pre.user.id);
    await embed.delete();
  } catch (e) {
    console.error(e);
    response.error = 'Failed to delete the embed';

    return response;
  }

  // try to delete all associated codeDocuments
  try {
    documents = await CodeDocument.filter({
      codeEmbedId: embed.id
    });
    if (documents && documents.length > 0) {
      await documents.delete();
    }
  } catch (e) {
    Log.createLog('Embed.Delete', 'Failed to delete associated code documents for embed', {
      error: e.toString(),
      embedId: embed.id
    }, 'Error');
    console.error(e);
  }

  // Everything went okay
  return response;
}

export async function exportStatistics(request, h) {
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
      embed = await CodeEmbed.get(embedId).run();
    } else {
      // not an uuid, try slug
      embed = await CodeEmbed.getBySlug(embedId);
    }
  } catch (e) {
    console.warn(e);
    return Boom.notFound('Es konnte kein Codebeispiel mit dieser ID/Slug gefunden werden.');
  }

  // Check rights of the user
  if (embed._creatorId !== request.pre.user.id && !request.pre.user.scope.includes('admin')) {
    return Boom.notAllowed('Sie besitzen nicht die benötigen Rechte, um die Statistiken für dieses Beispiel abzurufen.');
  }

  filter = {
    embedId: embed.id,
    archived: false
  };
  order = {
    index: 'timeStamp'
  };

  try {
    events = await EventLog.orderBy(order).filter(filter).run();
  } catch (err) {
    console.error('websocket.getEvents EventLog filtering for embed failed', err);
    return Boom.badData('Fehler beim Aufbereiten der Statistiken.');
  }

  jsonData = {
    events: events
  };

  try {
    statistics = JSON.stringify(jsonData, null, 2);
  } catch (e) {
    console.error('embed.exportStatistics', e);
    return Boom.badData('Die Statistiken konnte nicht exportiert werden.');
  }

  return h.response(statistics).type('text/plain');
}

export async function getAutocomplete(request, h) {
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
      embedsInfo = await CodeEmbed.filter({
        _creatorId: user.id
      }).pluck('id', 'meta', 'slug').execute();
    } else {
      embedsInfo = await CodeEmbed.filter({
        _creatorId: user.id
      }).filter(matcher).pluck('id', 'meta', 'slug').execute();
    }
  } catch (e) {
    console.log(e);
    response.error = 'Failed to retrieve code-embed information.';
    return response;
  }

  response.embedsInfo = embedsInfo;

  return response;
}