import trim from 'lodash/trim';
import Thinky from '../util/thinky';
const R = Thinky.r;

/**
 * Matches a key:value tuple.
 */
const searchQueryPattern = /(\w+\:\s*\w+)/gi;

/**
 * Parses a string for a search string and "key:value" pairs.
 * If the key:value pair is valid and contains a valid value,
 * it is returned in the filters map.
 *
 * @param {String} str
 * @returns {Object} containing, filters map, search string and hasFilter flag
 */
export function parseSearchQuery(str, queryMappings) {
  let filters = {};
  let search = str;
  let hasFilters = false;

  let matches = str.match(searchQueryPattern);

  if (matches != null) {
    for (let match of matches) {
      let [key, value] = match.split(':');
      if (queryMappings[key] != null) {
        key = key.toLowerCase();
        value = queryMappings[key].parser(value);
        let field = queryMappings[key].field;

        if (value != null) {
          filters[field] = value;
          hasFilters = true;
        }

        // Now remove the matched expr from our string
        search = search.replace(match, '');
      }
    }
  }

  return {
    filters: filters,
    search: trim(search),
    hasFilters
  };
}

/**
 * Creates a rethinkDB row accessor. Supports dotted names.
 *
 * @param {String} key with dots
 * @returns {Object} Row Accessor
 */
export function rowtoKey(key) {
  if (key.includes('.')) {
    let row;
    let nestedKeys = key.split('.');

    for (let nested of nestedKeys) {
      if (row == null) {
        row = R.row(nested);
      } else {
        row = row(nested);
      }
    }

    return row;
  } else {
    return R.row(key);
  }
}

/**
 * Creates a dynamic filter function for a Map of filters.
 *
 * @param {any} filterObject
 * @returns {object} one or multiple chained conditions (uses logical and)
 */
export function createDynamicFilterFunction(filterObject) {
  let condition;

  for (let key in filterObject) {
    let conditionForThisKey;
    if (Array.isArray(filterObject[key]) === false) {
      conditionForThisKey = rowtoKey(key).eq(filterObject[key]);
    } else {
      conditionForThisKey = rowtoKey(key)[filterObject[key][0]](filterObject[key][1]);
    }

    if (typeof condition === 'undefined') {
      condition = conditionForThisKey;
    } else {
      condition = condition.and(conditionForThisKey);
    }
  }

  return condition;
}