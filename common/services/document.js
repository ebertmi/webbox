/**
 * Document API
 */
import { commonErrorHandler, checkStatus, getDefaultHeaders, parseJSON } from './utils';

export const DocumentAPI = {
  save(params, payload) {
    return fetch(`/d/${params.id}`, {
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
  delete(params) {
    return fetch(`/d/${params.id}`, {
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