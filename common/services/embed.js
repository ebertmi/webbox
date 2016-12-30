/**
 * Embed API
 */
import { commonErrorHandler, checkStatus, getDefaultHeaders, parseJSON } from './utils';

/**
 * Retrieves the embed data for a given embed id or slug
 *
 * Here is a full example:
 *
    API.embed.getEmbed({ id: this.projectData.embed.id }).then(data => {
      console.log('got ajax embed data', data);
    }).catch(err => {
      console.error(err);
    });
 *
 * @param {Object} params - should contain an id e.g. { id: '1234-1234-1234-1234'}
 * @returns
 */
function getEmbed(params) {
  return fetch(`/embed-ajax/${params.id}`, {
    method: 'get',
    credentials: 'same-origin',
    headers: getDefaultHeaders()
  })
  .then(checkStatus)
  .then(parseJSON)
  .then(data => {
    return data;
  })
  .catch(commonErrorHandler);
}

/**
 * Save the code/file changes to the embed. This call
 * will either save the authors version, if the current user is the author,
 * or create/update a new code document for any other users.
 *
 * @param {Object} params
 * @param {Object} payload - expects a 'code' which is an object with filenames/paths as keys and source as values
 * @returns
 */
function saveEmbed(params, payload) {
  return fetch(`/embed/save/${params.id}`, {
    method: 'PUT',
    credentials: 'same-origin',
    headers: getDefaultHeaders(),
    body: JSON.stringify(payload)
  })
  .then(checkStatus)
  .then(parseJSON)
  .then(data => {
    return data;
  })
  .catch(commonErrorHandler);
}

/**
 * Update the embed attributes (embed owner only)
 *
 * @param {any} params
 * @param {any} payload
 * @returns
 */
function updateEmbed(params, payload) {
  return fetch(`/embed/update/${params.id}`, {
    method: 'PUT',
    credentials: 'same-origin',
    headers: getDefaultHeaders(),
    body: JSON.stringify(payload)
  })
  .then(checkStatus)
  .then(parseJSON)
  .then(data => {
    return data;
  })
  .catch(commonErrorHandler);
}

/**
 * Create a new embed.
 *
 * @param {Object} params - not required
 * @param {Object} payload - object containing title, embedType, language, etc..
 * @returns
 */
function createEmbed(params, payload) {
  return fetch(`/embed/create/`, {
    method: 'POST',
    credentials: 'same-origin',
    headers: getDefaultHeaders(),
    body: JSON.stringify(payload)
  })
  .then(checkStatus)
  .then(parseJSON)
  .then(data => {
    return data;
  })
  .catch(commonErrorHandler);
}

/**
 * Delete the embed, will delete the associated code documents
 *
 * @param {Object} params - should contain and id key
 * @returns
 */
function deleteEmbed(params) {
  return fetch(`/embed/${params.id}`, {
    method: 'delete',
    credentials: 'same-origin',
    headers: getDefaultHeaders()
  })
  .then(checkStatus)
  .then(parseJSON)
  .then(data => {
    return data;
  })
  .catch(commonErrorHandler);
}

/**
 * API for embed interaction inside the IDE
 */
export const EmbedAPI = {
  saveEmbed,
  updateEmbed,
  createEmbed,
  deleteEmbed,
  getEmbed
};