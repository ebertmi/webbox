/**
 * Chapter Controller
 *
 * Handles viewing and editing of chapters
 */
import Config from '../../config/webbox.config';
import Document from '../models/document';
import Joi from 'joi';
import Boom from 'boom';

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
 * Returns the document (notebook) requested by id or slug.
 * Important notice: Slugs are not unique, so the database will always return the first
 * document having this slug.
 */
export function* getDocument (request, reply) {
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
   * ToDo: add authors field to metadata, which is basically a list of emails that identify users
   */
  document.isAuthor = document._creatorId === request.pre.user.id;
  document.canToggleEditMode = document.isAuthor;

  reply.view('notebook', {
    user: request.pre.user,
    INITIAL_DATA:  JSON.stringify(document),
    USER_DATA:  JSON.stringify(userData),
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
  if ((document._creatorId !== request.pre.user.id) && !document.isAuthorByEmail(request.pre.user.email)) {
    console.log(e);
    response.error = 'No rights to edit this document';
    return reply(response);
  }

  // 3. Validate the user data
  // We pluck the properties that we want to update
  mergeData.metadata = data.metadata;
  mergeData.cells = data.cells;
  mergeData.slug = data.slug;
  mergeData.nbformat = data.nbformat;
  mergeData.nbformat_minor = data.nbformat_minor;
  mergeData.course = data.course;

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
   * ToDo: add authors field to metadata, which is basically a list of emails that identify users
   */
  document.isAuthor = document._creatorId === request.pre.user.id;
  document.canToggleEditMode = document.isAuthor;

  reply.view('presentation', {
    user: request.pre.user,
    INITIAL_DATA:  JSON.stringify(document),
    USER_DATA:  JSON.stringify(userData),
    next: request.path
  });
}