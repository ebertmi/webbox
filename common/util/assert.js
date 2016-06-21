export const IS_PRODUCTION = process.env.NODE_ENV === 'production';
let _assert;

if (IS_PRODUCTION) {
  _assert = () => {};
} else {
  console.info('asserts in developmend mode');
  _assert = function (test, ...args) {
    if (!test) {
      throw new Error(...args);
    }
  };
}

/**
 * Development only assert function
 */
export default _assert;