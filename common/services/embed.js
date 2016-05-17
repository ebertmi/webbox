/**
 * Embed API
 */
import { commonErrorHandler, checkStatus, getDefaultHeaders, parseJSON } from './utils';

export const EmbedAPI = {
  ///embed/save/{id}
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
  }
};