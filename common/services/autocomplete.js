// http://localhost:3000/autocomplete/course
import { commonErrorHandler, checkStatus, getDefaultHeaders, parseJSON } from './utils';

export const AutocompleteAPI = {
  courses(params, query={}) {
    return fetch('/autocomplete/course', {
      method: 'GET',
      credentials: 'same-origin',
      headers: getDefaultHeaders(),
    })
    .then(checkStatus)
    .then(parseJSON)
    .then(data => {
      return data;
    })
    .catch(commonErrorHandler);
  },
  embeds(params, query={}) {
    query.search = query.search != undefined ? query.search : '';
    return fetch(`/autocomplete/embed?search=${query.search}` , {
      method: 'GET',
      credentials: 'same-origin',
      headers: getDefaultHeaders(),
    })
    .then(checkStatus)
    .then(parseJSON)
    .then(data => {
      return data;
    })
    .catch(commonErrorHandler);
  }
};