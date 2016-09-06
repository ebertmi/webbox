/**
 * Touch input constants and helper methods for calculating distances and
 * extracting coordinates from events.
 */

/**
 * Maximum distance between two touch events.
 */
export const TOUCH_MOVE_THRESHOLD = 100;

/**
 * Maximum touch duration threshold
 */
export const TOUCH_DURATION_THRESHOLD = 250;

/**
 * Minimum touch press duration threshold
 */
export const TOUCH_PRESS_DURATION_THRESHOLD = 512;

/**
 * Calculates the x, and y absolute difference from two touch
 * objects that are retrieved from getTouchDataFromEvent.
 *
 * @export
 * @param {any} touch1
 * @param {any} touch2
 * @returns
 */
export function calculateTouchMovement(touch1, touch2) {
  return {
    x: Math.abs(touch1.clientX - touch2.clientX),
    y: Math.abs(touch1.clientY - touch2.clientY)
  };
}

/**
 * Returns object holding the clientX, clientY and a timestamp from
 * a single touch event. If there are more than one touches inside
 * the touch list, then this function returns null.
 *
 * @export
 * @param {any} event
 * @returns
 */
export function getTouchDataFromEvent(event) {
  if (event && event.touches && event.touches.length === 1) {
    return {
      clientX: event.touches[0].clientX,
      clientY: event.touches[0].clientY,
      timeStamp: Date.now()
    };
  }

  return null;
}

/**
 * Check if both x and y delta components are within the threshold (inclusive check)
 *
 * @export
 * @param {Object} delta
 * @param {Number} [threshold=TOUCH_MOVE_THRESHOLD]
 * @returns
 */
export function touchDeltaWithinThreshold(delta, threshold=TOUCH_MOVE_THRESHOLD) {
  return delta.x <= threshold && delta.y <= threshold;
}
