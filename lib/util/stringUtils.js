import trim from 'lodash/trim';

export function escape (s) {
  return String(s).replace(/[\\^$*+?.()|[\]{}]/g, '\\$&');
}

export function getFileExtension (filename) {
  return filename.substr((~-filename.lastIndexOf('.') >>> 0) + 2);
}

/**
 * Matches values in a string
 *
 * @param {string} s - string to check
 * @param {Array} matchers - array of matching values
 * @returns {boolean} if s matches any of values in matchers
 */
function boolMatch(s, matchers) {
  let i;
  let matcher;
  const down = s.toLowerCase();

  matchers = [].concat(matchers);
  for (i = 0; i < matchers.length; i += 1) {
    matcher = matchers[i];
    if (!matcher) {
      continue;
    }

    if (matcher.test && matcher.test(s)) {
      return true;
    }

    if (matcher.toLowerCase() === down) {
      return true;
    }
  }

  return false;
}

/**
 * Turn strings that can be commonly considered as booleans to real booleans. Such as "true", "false", "1" and "0". This function is case insensitive.
 *
 * @export
 * @param {String} str - string to check
 * @param {Array} trueValues - optional array with true strings
 * @param {Array} falseValues - optional array with false strings
 * @returns {boolean|null} boolean value
 */
export function toBoolean(str, trueValues=['true', '1'], falseValues=['false', '0']) {
  if (typeof str === 'number') {
    str = '' + str;
  }

  if (typeof str !== 'string') {
    return !!str;
  }

  str = trim(str);

  if (boolMatch(str, trueValues)) {
    return true;
  }

  if (boolMatch(str, falseValues)) {
    return false;
  }

  // return false if nothing matches
  return null;
}