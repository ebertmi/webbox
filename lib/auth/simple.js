/**
 * Basic authentification against database and or ldap
 */
var Bcrypt = require('bcrypt');
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

  // 1. lookup in database and check if is hs-coburg user
  //    or special database users
  // 2. authenticate against database or ldap
  return new Promise(function (resolve, reject) {
    User.findByUsername(username)
    .then((user) => {
      // not found
      // ToDo: try ldap next!
      if (user == null) {
        resolve(false, {});
      } else {
        credentials = {
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.name,
          source: 'database',
          scope: user.roles,
          isActive: user.isActive,
          isVerified: user.verification.completed
        };
        return user.comparePassword(password);
      }
    })
    .then((isValid) => {
      // ToDo: proper checking
      // check if not verified

      if (credentials.isActive === true) {
        credentials.scope.push('user');
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
