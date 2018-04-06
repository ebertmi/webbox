import isFunction from 'lodash/isFunction';

/**
 * Basic manager for terminal (xterm.js) instances that
 * are hold in a map structure.
 *
 * Automatically tries to destroy the terminal instance when
 * the key gets removed.
 *
 * @class TerminalManager
 */
class TerminalManager {
  constructor () {
    this.instances = new Map();
  }

  /**
   * Try to get the instance for the given
   *
   * @param {string|number} key of the instance
   * @returns {Terminal|undefined} instance for the key
   * @memberof TerminalManager
   */
  get(key) {
    return this.instances.get(key);
  }

  /**
   * Set a new instance for the given key
   *
   * @param {string|number} key of the instance
   * @param {Terminal} instance to use as a value
   * @returns {void}
   * @memberof TerminalManager
   */
  set(key, instance) {
    this.instances.set(key, instance);
  }

  /**
   * Checks if the manager holds currently a value for the given key.
   *
   * @param {string|number} key to check
   * @returns {boolean} true if the key exists
   * @memberof TerminalManager
   */
  has(key) {
    return this.instances.has(key);
  }

  /**
   * Removes the instance for the given key.
   * If the given instance has an destroy method, it will be called.
   *
   * @param {string|number} key to remove
   * @returns {boolean} true if there was an instance
   * @memberof TerminalManager
   */
  remove(key) {
    const term = this.instances.get(key);

    // Destroy the term if it still exists
    if (term != null && isFunction(term.destroy)) {
      term.destroy();
    }

    return this.instances.delete(key);
  }
}

export default new TerminalManager();