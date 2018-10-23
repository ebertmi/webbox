/**
 * Permission checks for documents/notebooks
 */

import { isAdmin, isStaff } from './checks';

export function isDocumentOwner(document, user) {
  // Owner of the document
  return user.id === document._creatorId;
}

export function canViewStatistics(document, user) {
  return canEditDocument(document, user);
}

/**
 * Only the original author can delete a document.
 *
 * @export
 * @param {object} document - document to verfiy
 * @param {object} user - user to check
 * @returns {boolean} returns true if user is allowed to delete the document
 */
export function canDeleteDocument(document, user) {
  if (user == null || user.roles == null) {
    console.log('Invalid user without scope/roles attribute!');
    return false;
  }

  // Who can edit an document?

  // 1. Admins and Staff
  if (isAdmin(user) || isStaff(user)) {
    return true;
  }

  // 2. Author/Owner of the document
  if (user.id === document._creatorId) {
    return true;
  }
}

export function canSaveDocument(document, user) {
  if (user == null || user.roles == null) {
    console.log('Invalid user without scope/roles attribute!');
    return false;
  }

  // Who can edit an document?

  // 1. Admins and Staff
  if (isAdmin(user) || isStaff(user)) {
    return true;
  }

  // 2. Author/Owner of the document
  if (isDocumentOwner(document, user)) {
    return true;
  }

  // Disable the authors check here and forbid saving of changes!
  // 3. Check list of additional authors
  // This function is defined on the model (see models/document)
  //if (document.isAuthorByEmail) {
  //  return document.isAuthorByEmail(user.email);
  //}

  return false;
}

export function canEditDocument(document, user) {
  if (user == null || user.roles == null) {
    console.log('Invalid user without scope/roles attribute!');
    return false;
  }

  // Who can edit an document?

  // 1. Admins and Staff
  if (isAdmin(user) || isStaff(user)) {
    return true;
  }

  // 2. Author/Owner of the document
  if (isDocumentOwner(document, user)) {
    return true;
  }

  // 3. Check list of additional authors
  // This function is defined on the model (see models/document)
  if (document.isAuthorByEmail) {
    return document.isAuthorByEmail(user.email);
  }

  console.info('Invalid document, that does not hat isAuthorByEmail function');
  return false;
}