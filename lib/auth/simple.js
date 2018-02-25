/**
 * Basic authentification against database and or ldap
 */
const User = require('../models/user');
const Promise = require('bluebird');

/**
 * Simple database authentication
 * @param {object} request
 * @param {string} username
 * @param {string} password
 *
 * @returns {object} credentials
 */
async function validate (request, username, password) {
  let credentials = {};

  // Check username for valid string!

  // 1. lookup in database and check if is hs-coburg user
  //    or special database users
  // 2. authenticate against database or ldap

  try {
    const user = await User.findByEmailorUsername(username, username);

    // not found
    if (user == null) {
      return false;
    } else {
      credentials = {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        source: 'database',
        scope: user.roles, // Required for routes
        roles: user.roles, // Less confusing in controllers
        isActive: user.isActive,
        isVerified: user.verification.isCompleted
      };

      const isValid = await user.comparePassword(password);
      // ToDo: proper checking
      // check if not verified

      if (isValid && (credentials.isVerified === false || credentials.isActive === false)) {
        return {
          isValid: false,
          credentials: credentials
        };
      }

      return {
        isValid: isValid,
        credentials: credentials
      };
    }
  } catch (err) {
    return err;
  }
}

module.exports = validate;
