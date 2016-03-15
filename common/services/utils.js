/**
 * Checks the status and either returns or throws and error.
 * Should be used with window.fetch
 */
export function checkStatus(response) {
  if (response.status >= 200 && response.status < 300) {
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

export function commonErrorHandler(err) {
  console.log(err, '');
  // check if we need to redirect
  if (err.response.status === 401) {
    throw AUTHORISATION_ERROR;
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

  const crumb = getCookie('crumb');
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