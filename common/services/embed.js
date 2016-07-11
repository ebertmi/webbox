/**
 * Embed API
 */
import { commonErrorHandler, checkStatus, getDefaultHeaders, parseJSON } from './utils';

export const EmbedAPI = {
  saveEmbed(params, payload) {
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
  },
  updateEmbed(params, payload) {
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
  },
  createEmbed(params, payload) {
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
  },
  deleteEmbed(params) {
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
};