import Debug from 'debug';

const debug = Debug('webbox:trackingUtils');

/**
 * Tries to send the current event (or action) to
 * our external event tracking data base.
 *
 * @export
 * @param {any} event - event
 * @param {any} data - data to track
 * @returns {void}
 */
export function trackUserInteraction(event, data) {
  // Record an event
  if (window.KEEN_CLIENT != null) {
    window.KEEN_CLIENT.recordEvent(event, data);
  } else {
    debug('Keen client is not available');
  }
}