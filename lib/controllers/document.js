/**
 * Chapter Controller
 *
 * Handles viewing and editing of chapters
 */
import Slug from 'speakingurl';
import Joi from 'joi';
import JWT from 'jsonwebtoken';
import Boom from 'boom';
import { toRelativeDate } from '../util/dateUtils';
import Thinky from '../util/thinky';
import Config from '../../config/webbox.config';
import Document from '../models/document';
import User from '../models/user';
import { canDeleteDocument, canSaveDocument, canEditDocument, canViewStatistics, isDocumentOwner } from '../roles/documentChecks';
import { EmbedTypes } from '../../common/constants/Embed';

/**
 * Validation schema for id specified in UUID format
 */
const SLUGORID_SCHEMA = {
  idOrSlug: Joi.string().guid()
};

const EMAIL_SCHEMA = {
  email: Joi.string().email()
};

/**
 * Exports a document in the Juypter Notebook format. Strips out
 * all internal document attributes, that are not relevant for ipynb files
 *
 * @export
 * @param {any} request
 * @param {any} reply
 * @returns
 */
export function* exportDocument (request, reply) {
  const idOrSlug = request.params.idOrSlug;
  let ipynb;
  let document;

  let jsonData;

  try {
    // check for uuid
    let validationResult = Joi.validate({idOrSlug: idOrSlug}, SLUGORID_SCHEMA);
    if (validationResult.error == null) {
      document = yield Document.get(idOrSlug).run();
    } else {
      // not an uuid, try slug
      document = yield Document.getBySlug(idOrSlug);
    }
  } catch (e) {
    return reply(Boom.notFound('Das angeforderte Dokument wurde nicht gefunden.'));
  }

  jsonData = {
    cells: document.cells,
    metadata: document.metadata,
    nbformat: document.nbformat,
    nbformat_minor: document.nbformat_minor
  };

  // Add empty cells if not present
  if (jsonData.cells == null) {
    jsonData.cells = [];
  }

  // Remove all ids
  for (let i = 0; i < jsonData.cells.length; i++) {
    if (jsonData.cells[i].id) {
      delete jsonData.cells[i].id;
      //console.log('remove id from cell', jsonData.cells[i]);
    }
  }

  try {
    ipynb = JSON.stringify(jsonData, null, 2);
  } catch (e) {
    console.error('document.exportDocument', e);
    return reply(Boom.badData('Das Dokument konnte nicht exportiert werden.'));
  }

  let title = document.metadata.title;

  if (title == null) {
    title = 'Ohne Title';
  }

  // This "forces" - suggests - the browser to download the file.
  reply(ipynb).type('text/plain').header('Content-Disposition', `attachment; filename=${encodeURIComponent(title)}.ipynb`);
}

/**
 * Returns the document (notebook) requested by id or slug.
 * Important notice: Slugs are not unique, so the database will always return the first
 * document having this slug.
 */
export function* getDocument (request, reply) {
  const idOrSlug = request.params.idOrSlug;

  let document;
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

  try {
    // check for uuid
    let validationResult = Joi.validate({idOrSlug: idOrSlug}, SLUGORID_SCHEMA);
    if (validationResult.error == null) {
      document = yield Document.get(idOrSlug).run();
    } else {
      // not an uuid, try slug
      document = yield Document.getBySlug(idOrSlug);
    }
  } catch (e) {
    return reply(Boom.notFound('Das angeforderte Dokument wurde nicht gefunden.'));
  }

  // Update recent documents for signed in users
  if (request.auth.isAuthenticated) {
    User.addRecentDocument({
      id: document.id,
      title: document.metadata.title
    }, request.pre.user.id);
  }

  // Right now, every user with the authors permission can view the stats
  let websocketAuthToken = JWT.sign({
    username: userData.username,
    userid: userData.id,
    isAuthor: canViewStatistics(document, request.pre.user),
    isOwner: isDocumentOwner(document, request.pre.user)
  }, Config.websocket.secret, {
    expiresIn: Config.websocket.expiresIn
  });

  /**
   * ToDo: add authors field to metadata, which is basically a list of emails that identify users
   */
  document.isAuthor = canEditDocument(document, request.pre.user); //document._creatorId === request.pre.user.id;

  let courseId = null;

  if (document.course != null) {
    courseId = document.course;
  }

  reply.view('notebook', {
    user: request.pre.user,
    INITIAL_DATA:  JSON.stringify(document),
    USER_DATA:  JSON.stringify(userData),
    next: request.path,
    websocket: JSON.stringify({
      server: Config.websocket.url,
      authToken: websocketAuthToken
    }),
    courseId
  });
}

export function* getDocumentsForUser (request, reply) {
  let documents = [];

  if (request.pre.user.isAnonymous === true) {
    return reply.redirect('/');
  }

  try {
    documents = yield Document.orderBy(Thinky.r.desc('createdAt'))
    .filter({
      _creatorId: request.pre.user.id
    }).run()
    .map(function(d) {
      // Time-Transformation
      let relDate = toRelativeDate(d.metadata.lastUpdate);
      return d.merge({
        relativeDate: relDate
      });
    });
  } catch (e) {
    documents = [];
  }

  return reply.view('documentlist', {
    user: request.pre.user,
    documents: documents,
    next: request.path
  });
}

/**
 * Saves a document provided via post:
 *  - check user rights, allow creator, admin and people with the right group <document-id> to edit the document
 *  - validate request.document
 *  -
 */
export function* saveDocument (request, reply) {
  const id = request.params.idOrSlug;
  let data = request.payload.document;
  let mergeData = {};
  let response = { };
  let document;
  let validationResult;

  if (request.pre.user.isAnonymous === true) {
    return reply({ error: Config.messages.embed.notAuthenticated });
  }

  // 1. Get document (notebook)
  try {
    // check for uuid
    validationResult = Joi.validate({idOrSlug: id}, SLUGORID_SCHEMA);
    if (validationResult.error == null) {
      document = yield Document.get(id).run();
    } else {
      // not an uuid, try slug
      document = yield Document.getBySlug(id);
    }
  } catch (e) {
    console.log(e);
    response.error = 'Document not found';
    return reply(response);
  }

  // 2. Check rights
  if (canSaveDocument(document, request.pre.user) === false) {
    response.error = 'No rights to edit this document';
    return reply(response);
  }

  // Check the slug
  // Slug checks
  if (data.slug != null && data.slug.length > 3) {
    // Enforce slug to be a real slug!
    data.slug = Slug(data.slug);

    // Now check if the slug does already exist
    try {
      let count = yield Document.countBySlug(data.slug, [id]);
      if (count > 0) {
        data.slug = Slug(`${data.slug}-${count}`);
      }
    } catch (e) {
      // something went wrong with the query
      console.error('document.saveDocument', e);
      response.error = 'Server error';
      reply(response);
    }

  } else {
    delete data.slug;
    data.slug = '';
  }

  // 3. Validate the user data
  // We pluck the properties that we want to update
  mergeData.metadata = data.metadata;
  mergeData.cells = data.cells;
  mergeData.slug = data.slug;
  mergeData.nbformat = data.nbformat;
  mergeData.nbformat_minor = data.nbformat_minor;
  mergeData.course = data.course;
  mergeData.embedType = data.embedType;

  // Validate all authors, specified as email address
  if (data.authors && Array.isArray(data.authors)) {
    mergeData.authors = [];
    for (let author of data.authors) {
      validationResult = Joi.validate({email: author}, EMAIL_SCHEMA);
      if (validationResult.error == null) {
        mergeData.authors.push(author.toLowerCase());
      }
    }
  }

  // 4. Merge the data and save the changes
  try {
    document = yield document.merge(mergeData).save(); // save changes
  } catch (e) {
    console.log(e);
    response.error = 'An error occured while saving';
    return reply(response);
  }

  response.document = document;

  return reply(response);
}

export function* getPresentation (request, reply) {
  const idOrSlug = request.params.idOrSlug;

  let document;
  let userData = {
    username: request.pre.user.username,
    email: request.pre.user.email,
    id: request.pre.user.id
  };

  try {
    // check for uuid
    let validationResult = Joi.validate({idOrSlug: idOrSlug}, SLUGORID_SCHEMA);
    if (validationResult.error == null) {
      document = yield Document.get(idOrSlug).run();
    } else {
      // not an uuid, try slug
      document = yield Document.getBySlug(idOrSlug);
    }
  } catch (e) {
    return reply(Boom.notFound('Das angeforderte Dokument wurde nicht gefunden.'));
  }

  /**
   * ToDo: We could introduce a multi document owner system or even better fine granular permissions
   */
  document.isAuthor = canEditDocument(document, request.pre.user);

  reply.view('presentation', {
    user: request.pre.user,
    INITIAL_DATA:  JSON.stringify(document),
    USER_DATA:  JSON.stringify(userData),
    next: request.path
  });
}

/**
 * Handles the creation of new documents. Redirects to the new document if created successfully.
 * We handle the permissions inside the route configuration, see attribute "scope" there.
 *
 * @export
 * @param {any} request
 * @param {any} reply
 * @returns
 */
export function* createDocument (request, reply) {
  let document;
  let documentObj;
  let redirectPath;

  documentObj = {
    _creatorId: request.pre.user.id,
    slug: '',
    course: '',
    embedType: EmbedTypes.Sourcebox,
    cells: [
      Config.document.sampleCell
    ],
    metadata: {
      kernelspec: {
        display_name: 'Python 3',
        language: 'python',
        name: 'webbox'
      },
      language_info: {
        name: 'python',
        version: 3
      },
      title: 'Neues Dokument',
      author: request.pre.user.username
    },
    authors: [],
    nbformat: 4,
    nbformat_minor: 0
  };

  document = new Document(documentObj);

  // Save the document
  try {
    document = yield document.save(); // save
  } catch (e) {
    console.log(e);
    return reply(Boom.badRequest());
  }

  redirectPath = `/d/${document.id}`;

  // Everything went good, now do a redirect
  return reply.redirect(redirectPath);
}

export function* deleteDocument (request, reply) {
  const id = request.params.idOrSlug;
  let response = { };
  let document;
  let validationResult;

  if (request.pre.user.isAnonymous === true) {
    return reply({ error: Config.messages.embed.notAuthenticated });
  }

  // Get document (notebook)
  try {
    // Check for uuid
    validationResult = Joi.validate({idOrSlug: id}, SLUGORID_SCHEMA);
    if (validationResult.error == null) {
      document = yield Document.get(id).run();
    } else {
      // not an uuid, try slug
      document = yield Document.getBySlug(id);
    }
  } catch (e) {
    console.warn(e);
    response.error = 'Document not found';
    return reply(response);
  }

  // Check rights
  if (canDeleteDocument(document, request.pre.user) === false) {
    response.error = 'No rights to delete this document';
    return reply(response);
  }

  try {
    yield document.delete();
  } catch (e) {
    console.error(e);
    response.error = 'Failed to delete the document';

    return reply(response);
  }

  // Everything went okay
  return reply(response);
}

export default {
  getDocument,
  getPresentation,
  saveDocument,
  createDocument,
  deleteDocument,
  exportDocument,
  getDocumentsForUser
};