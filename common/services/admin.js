/**
 * Admin API
 */
import { commonErrorHandler, checkStatus, getDefaultHeaders, parseJSON } from './utils';


export const AdminAPI = {
  getUsers(query) {
    return fetch(`/api/users?page=${query.page}&limit=${query.limit}`, {
      credentials: 'same-origin',
      headers: getDefaultHeaders()
    })
    .then(checkStatus)
    .then(parseJSON)
    .then(data => {
      return data;
    })
    .catch(commonErrorHandler);
  },
  getUser(params) {
    return fetch(`/api/user/${params.id}`, {
      credentials: 'same-origin',
      headers: getDefaultHeaders()
    })
    .then(checkStatus)
    .then(parseJSON)
    .then(data => {
      return data;
    })
    .catch(commonErrorHandler);
  },
  saveUser(params, payload) {
    return fetch(`/api/user/${params.id}`, {
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
  deleteUser(params) {
    return fetch(`/api/user/${params.id}`, {
      method: 'DELETE',
      credentials: 'same-origin',
      headers: getDefaultHeaders()
    })
    .then(checkStatus)
    .then(parseJSON)
    .then(data => {
      return data;
    })
    .catch(commonErrorHandler);
  },
  getCourses(query) {
    return fetch(`/api/courses?page=${query.page}&limit=${query.limit}`, {
      credentials: 'same-origin',
      headers: getDefaultHeaders()
    })
    .then(checkStatus)
    .then(parseJSON)
    .then(data => {
      return data;
    })
    .catch(commonErrorHandler);
  },
  getEmbeds(query) {
    return fetch(`/api/embeds?page=${query.page}&limit=${query.limit}`, {
      credentials: 'same-origin',
      headers: getDefaultHeaders()
    })
    .then(checkStatus)
    .then(parseJSON)
    .then(data => {
      return data;
    })
    .catch(commonErrorHandler);
  },
  getLogs(query) {
    return fetch(`/api/logs?page=${query.page}&limit=${query.limit}`, {
      credentials: 'same-origin',
      headers: getDefaultHeaders()
    })
    .then(checkStatus)
    .then(parseJSON)
    .then(data => {
      return data;
    })
    .catch(commonErrorHandler);
  },
  getAuthAttempts(query) {
    return fetch(`/api/authattempts?page=${query.page}&limit=${query.limit}`, {
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