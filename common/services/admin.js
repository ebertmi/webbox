/**
 * Admin API
 */
import {checkStatus, getDefaultHeaders, parseJSON} from './utils';

export const AdminAPI = {
  getUsers(query) {
    console.log('api, call');
    return fetch(`/api/users?page=${query.page}&limit=${query.limit}`, {
      credentials: 'same-origin',
      headers: getDefaultHeaders()
    })
    .then(checkStatus)
    .then(parseJSON)
    .then(data => {
      return data;
    })
    .catch(err => {
      console.log(err);
      throw err;
    });
  }
};