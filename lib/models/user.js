var Promise = require('bluebird');
var bcrypt = Promise.promisifyAll(require('bcrypt'));
var config = require('../../config/webbox.config');
var thinky = require('../util/thinky');
var type = thinky.type;
var r = thinky.r;

var User = thinky.createModel('User', {
   id: type.string(),
   name: type.string().optional(),
   username: type.string(),
   email: type.string().email().required(),
   password: type.string(),
   isActive: type.boolean().default(true),
   source: type.string().default('database'),
   roles: type.array().default([]),
   lastLogin: type.date().allowNull(),
   createdAt: type.date().allowNull()
   
});

/**
 * Encrypts a user password async
 */
User.defineStatic('encryptPassword', function (password) {
    return new Promise(resolve => {
    bcrypt.genSaltAsync(10)
        .then(salt => {
        return bcrypt.hashAsync(password, salt);
        }).then(resolve);
    });
});

User.define('comparePassword', function (password) {
    console.info('Trying to compare passwords: ', password, this.password);
    return bcrypt.compareAsync(password, this.password);
});

User.ensureIndex('username');
User.ensureIndex('email');

// User.define(key, fn);
// User.defineStatic(key, fn);

/**
 * Searchs a user in the database by the username
 * @param {string} username - The username
 * @returns {Object} Promise
 */
User.defineStatic('findByUsername', function (username) {
    return new Promise(function (resolve, reject) {
        User.filter({username: username})
        .nth(0)
        .default(null)
        .run()
        .then(resolve)
        .error(reject);
    });
});

User.defineStatic('findByEmail', function (email) {
    return new Promise(function (resolve, reject) {
        User.filter({email: email})
        .nth(0)
        .default(null)
        .run()
        .then(resolve)
        .error(reject);
    });
});

User.defineStatic('findByEmailorUsername', function (username, email) {
    return new Promise(function (resolve, reject) {
        User.filter(r.row('username').eq(username).or(r.row('email').eq(email)))
        .nth(0)
        .default(null)
        .run()
        .then(resolve)
        .error(reject);
    });
});

module.exports = User;