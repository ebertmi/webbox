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