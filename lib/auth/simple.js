/**
 * Basic authentification against database and or ldap
 */
var Bcrypt = require('bcrypt');
var User = require('../models/user');
var Promise = require('bluebird');

function validate (request, username, password) {
    var credentials;

    // 1. lookup in database and check if is hs-coburg user
    //    or special database users
    // 2. authenticate against database or ldap
    return new Promise(function (resolve, reject) {
        User.findByUsername(username)
        .then((user) => {
            // not found
            // ToDo: try ldap next!
            console.info('Found user ', user, ' for ', username);
            if (user == null) {
            resolve(false, {});  
            return;
            } else {
                credentials = {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    name: user.name,
                    source: 'database'
                };
                return user.comparePassword(password);
            }
        })
        .then((isValid) => {
            resolve(isValid, credentials);    
        })
        .error((err) => {
            reject(err);
        });
    });

}


 module.exports = validate;