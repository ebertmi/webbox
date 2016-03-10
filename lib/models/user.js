'use strict';

/**
 * The user model.
 */

const Promise = require('bluebird');
const bcrypt = Promise.promisifyAll(require('bcrypt'));
const config = require('../../config/webbox.config');
const Thinky = require('../util/thinky');
const type = Thinky.type;
const R = Thinky.r;

const User = Thinky.createModel('User', {
  id: type.string(),
  name: type.string().optional(),
  username: type.string(),
  email: type.string().email().required(),
  password: type.string(),
  isActive: type.boolean().default(true),
  source: type.string().default('database'),
  roles: type.array().default([]),
  semester: type.string().optional(),
  lastLogin: type.date().allowNull(),
  createdAt: type.date().allowNull(),
  verification: type.object().schema({
    token: type.string(),
    isCompleted: type.boolean().default(false),
  }).default({
    token: undefined,
    isCompleted: false
  }),
  forgot: type.object().schema({
    token: type.string(),
    expires: type.date()
  }).default({
    token: undefined,
    expires: undefined
  })
});

/**
 * Encrypts a user password async
 */
User.defineStatic('encryptPassword', function (password) {
  return bcrypt.genSaltAsync(10)
  .then(salt => {
    return bcrypt.hashAsync(password, salt);
  });
});

User.define('comparePassword', function (password) {
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
  return User.filter({username: username})
  .nth(0)
  .default(null)
  .run();
});

User.defineStatic('findByEmail', function (email) {
  return User.filter({email: email})
  .nth(0)
  .default(null)
  .run();
});

User.defineStatic('findByEmailorUsername', function (username, email) {
  return User.filter(R.row('username').eq(username).or(R.row('email').eq(email)))
  .nth(0)
  .default(null)
  .run();
});

/**
 * Update the last login date to now for a user identified by email address
 */
User.defineStatic('updateLastLogin', function (username, email) {
  return User.filter(R.row('username').eq(username).or(R.row('email').eq(email)))
  .nth(0)
  .run()
  .then(user => {
    user.lastLogin = R.now();
    return user.save();
  });
});

User.define('updateLastVisits', function (course) {

});

module.exports = User;