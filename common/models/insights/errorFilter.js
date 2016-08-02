/**
 * Filters an array of error objects by a subset size limit,
 * username and error type.
 *
 * @export
 * @class ErrorFilter
 */
export class ErrorFilter {
  constructor(errors=[], n=10, filters={}) {
    this.subsetSize = n;
    this.filters = filters;
    this.errors = errors;

    this.isDirty = false;
    this.subsetCache = [];

    this._filter = this._filter.bind(this);
  }

  /**
   * Set array of errors
   *
   * @param {any} errors
   * @returns
   */
  setErrors(errors) {
    // Check if the new errors have the same length and the last object is the same
    if (this.errors.length === errors.length && ErrorFilter.equalsErrorObjects(ErrorFilter.lastErrorInArray(this.errors), ErrorFilter.lastErrorInArray(errors))) {
      return;
    }

    this.errors = errors;
    this.isDirty = true;
  }

  /**
   * Set filters:
   * - isActive boolean
   * - filterType string
   * - filterUsername string
   *
   * @param {any} filters
   * @returns
   */
  setFilters(filters) {
    if (filters.isActive === this.filters.isActive &&
      filters.filterType === this.filters.filterType &&
      filters.filterUsername === this.filters.filterUsername) {
      return;
    }

    this.filters = filters;
    this.isDirty = true;
  }

  /**
   * Returns only a subset of the filtered errors or all
   *
   * @param {any} subsetSize
   * @returns
   */
  setSubsetSize(subsetSize) {
    if (this.subsetSize === subsetSize) {
      return;
    }

    this.subsetSize = subsetSize;
    this.isDirty = true;
  }

  /**
   * Internal filtering function using the filters
   *
   * @param {any} success, callback or resolving function
   * @returns
   */
  _filter(success) {
    // Return cached subset to avoid recalculation
    if (this.isDirty === false) {
      return success(this.subsetCache);
    }

    // Need to do some data crunching
    let subset = this.errors;

    if (this.filters.isActive === true) {
      subset = subset.filter(error => {
        if (this.filters.filterType != null && this.filters.filterType !== '' && error.type.toLowerCase() !== this.filters.filterType.toLowerCase()) {
          return false;
        }

        if (this.filters.filterUsername != null && this.filters.filterUsername !== '' && error.username.toLowerCase() !== this.filters.filterUsername.toLowerCase()) {
          return false;
        }

        return true;
      });
    }

    if (this.subsetSize !== 'all') {
      this.subsetCache = subset.slice(-this.subsetSize).reverse();
    } else {
      this.subsetCache = subset.reverse();
    }

    // Done filtering, now set dirty flag to false
    this.isDirty = false;
    return success(this.subsetCache);
  }

  filter() {
    return new Promise(this._filter);
  }
}

/**
 * Returns the last element in the array or undefined
 *
 * @param {any} arr
 * @returns
 */
ErrorFilter.lastErrorInArray = function (arr) {
  if (arr && arr.length) {
    return arr[arr.length - 1];
  }

  return undefined;
};

/**
 * Equals 2 error objects by id. Returns false, if one of the objects is null/undefined
 *
 * @param {any} err1
 * @param {any} err2
 * @returns
 */
ErrorFilter.equalsErrorObjects = function (err1, err2) {
  if (err1 == null || err2 == null) {
    return false;
  }

  return err1.id === err2.id;
};