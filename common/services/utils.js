import Debug from 'debug';
const debug = Debug('webbox:services/utils');

/**
 * Checks the status and either returns or throws and error.
 * Should be used with window.fetch
 *
 * The API does only send a couple of error status codes. Especially,
 * 400 is used for bad requests with a special error message from the
 * server.
 */
export function checkStatus(response) {
  if (response.status >= 200 && response.status < 300) {
    return response;
  } else if (response.status === 400) {
    // a error with a custom message
    return response;
  } else {
    var error = new Error(response.statusText);
    error.response = response;
    throw error;
  }
}

// common network problem error
const NETWORK_ERROR = new Error('Netzwerkfehler - die Anfrage konnte nicht abgeschlossen werden.');
const AUTHORISATION_ERROR = new Error('Nicht angemeldet - Anscheinend ist ihre Session abgelaufen. Bitte laden Sie die Seite neu.');
const PERMISSION_ERROR = new Error('Sie besitzen anscheinend nicht die benötigten Rechte für diese Operation.');

export function commonErrorHandler(err) {
  console.log(err, '');
  // check if we need to redirect
  if (err.response && err.response.status === 401) {
    throw AUTHORISATION_ERROR;
  } else if (err.response && err.response.status === 403) {
    throw PERMISSION_ERROR;
  }

  throw NETWORK_ERROR;
}

/**
 * Get the cookie for the given key
 *
 * @param {string} sKey - the key of the cookie
 * @returns {string|undefined} the value of the key or null if not found
 */
export function getCookie(sKey) {
  if (!sKey) {
    return undefined;
  }
  return document.cookie.replace(new RegExp("(?:(?:^|.*;)\\s*" + encodeURIComponent(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=\\s*([^;]*).*$)|^.*$"), "$1") || undefined;
}

export function getDefaultHeaders() {
  const defaultHeaders = {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  };

  let crumb = getCookie('crumb');

  if (crumb == null) {
    crumb = window.__crumb__;
  }

  if (crumb == null) {
    debug('Failed to access crumb. Establishing websocket connection will fail.');
  }

  if (crumb) {
    defaultHeaders['X-CSRF-Token'] = crumb;
  }

  return defaultHeaders;
}

/**
 * Returns the json
 */
export function parseJSON(response) {
  return response.json();
}