import trim from 'lodash/trim';

export function escape (s) {
  return String(s).replace(/[\\^$*+?.()|[\]{}]/g, '\\$&');
}

export function getFileExtension (filename) {
  return filename.substr((~-filename.lastIndexOf(".") >>> 0) + 2);
}

// from https://github.com/epeli/underscore.string
function boolMatch(s, matchers) {
  var i, matcher, down = s.toLowerCase();
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
}

/**
 * Turn strings that can be commonly considered as booleas to real booleans. Such as "true", "false", "1" and "0". This function is case insensitive.
 *
 * @export
 * @param {String} str
 * @param {Array} trueValues
 * @param {Array} falseValues
 * @returns
 */
export function toBoolean(str, trueValues, falseValues) {
  if (typeof str === 'number') {
    str = '' + str;
  }

  if (typeof str !== 'string') {
    return !!str;
  }

  str = trim(str);

  if (boolMatch(str, trueValues || ['true', '1'])) {
    return true;
  }

  if (boolMatch(str, falseValues || ['false', '0'])) {
    return false;
  }
}