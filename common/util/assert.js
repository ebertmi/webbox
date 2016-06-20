export const IS_PRODUCTION = process.env.NODE_ENV === 'production';
console.log(IS_PRODUCTION, process.env.NODE_ENV);
let _assert;

if (IS_PRODUCTION) {
  _assert = () => {};
} else {
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