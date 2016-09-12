/**
 * Basic authentification against database and or ldap
 */
var User = require('../models/user');
var Promise = require('bluebird');

/**
 * Simple database authentication
 * @param {object} request
 * @param {string} username
 * @param {string} password
 */
function validate (request, username, password) {
  var credentials = {};

  // Check username for valid string!

  // 1. lookup in database and check if is hs-coburg user
  //    or special database users
  // 2. authenticate against database or ldap
  return new Promise(function (resolve, reject) {
    User.findByEmailorUsername(username, username)
    .then((user) => {
      // not found
      if (user == null) {
        resolve(false, {});
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
        return user.comparePassword(password);
      }
    })
    .then((isValid) => {
      // ToDo: proper checking
      // check if not verified

      if (isValid && (credentials.isVerified === false || credentials.isActive === false)) {
        return resolve({
          isValid: false,
          credentials: credentials
        });
      }

      resolve({
        isValid: isValid,
        credentials: credentials
      });
    })
    .error((err) => {
      reject(err);
    });
  });

}


module.exports = validate;
