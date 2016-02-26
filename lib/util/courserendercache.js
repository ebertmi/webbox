/**
 * Cache for rendered chapters. The cache returns a rendered version
 * of the course/chapter pair.
 *
 * All cache methods return a promise to allow switching to a redis store later.
 */
'use strict';

// Load Modules
const _ = require('lodash');
const Promise = require('bluebird');

// Declare internals
class CourseRenderCache {
  constructor () {
    this.cache = new Map();
  }

  get (course, chapter) {
    const key = CourseRenderCache.toKey(course, chapter);

    return new Promise((resolve, reject) => {
      resolve(this.cache.get(key));
    });
  }

  set (course, chapter, value) {
    const key = CourseRenderCache.toKey(course, chapter);

    return new Promise((resolve, reject) => {
      this.cache.set(key, value);
      resolve(value);
    });
  }

  delete (course, chapter) {
    const key = CourseRenderCache.toKey(course, chapter);

    return new Promise((resolve, reject) => {
      this.cache.delete(key);
      resolve();
    });
  }

  /**
   * @param {string} course
   * @param {string} chapter
   *
   * @returns {Promise} resolves to boolean
   */
  has (course, chapter) {
    const key = CourseRenderCache.toKey(course, chapter);

    return new Promise((resolve, reject) => {
      resolve(this.cache.has(key));
    });
  }

  /**
   * Generates a key from a course and chapter
   *
   * @param {string} course
   * @param {string} chapter
   *
   * @returns {string} generated key
   */
  static toKey (course, chapter) {
    if (!_.isString(course) || !_.isString(chapter)) {
      throw new Error('"course" and "chapter" must be of type string!');
    }

    return `${course}:${chapter}`;
  }
}

// export as Singleton
module.exports = new CourseRenderCache();