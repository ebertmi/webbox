'use strict';

/**
 * The user model.
 */

const Promise = require('bluebird');
const bcrypt = Promise.promisifyAll(require('bcrypt'));
const Thinky = require('../util/thinky');
const type = Thinky.type;
const R = Thinky.r;

const User = Thinky.createModel('User', {
  id: type.string(),
  name: type.string().optional(),
  username: type.string().required(),
  email: type.string().email().required(),
  password: type.string(),
  isActive: type.boolean().default(true),
  source: type.string().default('database'),
  roles: type.array().default([]),
  semester: type.string().optional(),
  recentDocuments: type.array().default([]),
  lastLogin: type.date().allowNull(),
  createdAt: type.date().default(R.now),
  verification: type.object().schema({
    token: type.string(),
    isCompleted: type.boolean().default(false)
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

User.ensureIndex('username');
User.ensureIndex('email');
User.ensureIndex('createdAt');
User.ensureIndex('lastLogin');

/**
 * Make username and email lowercase
 */
User.pre('save', function(next) {
  this.username = this.username.toLowerCase();
  this.email = this.email.toLowerCase();

  if (this.createdAt == null) {
    this.createdAt = R.now();
  }

  next();
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

/**
 * Circular buffer for storing recent documents. Eliminates duplicates.
 */
User.defineStatic('addRecentDocument', (document, userId) => {
  User.get(userId).then(user => {
    let searchIndex = user.recentDocuments.findIndex(element => element.id === document.id);

    if (searchIndex > -1) {
      // found duplicate and remove it
      user.recentDocuments.splice(searchIndex, 1);
    }

    // push to the head of the array
    user.recentDocuments.unshift(document);

    // Delete elements after the 10th element
    if (user.recentDocuments.length > 10) {
      user.recentDocuments.splice(10, user.recentDocuments.length - 10);
    }

    // save changes to the user
    user.save().error(err => {
      console.error('user.addRecentDocument', err);
    });
  })
  .error(err => {
    console.error('user.addRecentDocument', err);
  });
});

/**
 * Searchs a user in the database by the username
 * @param {string} username - The username
 * @returns {Object} Promise
 */
User.defineStatic('findByUsername', function (username) {
  const usernameLower = username.toLowerCase();
  return User.filter({username: usernameLower})
  .nth(0)
  .default(null)
  .run();
});

User.defineStatic('findByEmail', function (email) {
  const emailLower = email.toLowerCase();
  return User.filter({email: emailLower})
  .nth(0)
  .default(null)
  .run();
});

User.defineStatic('findByEmailorUsername', function (username, email='') {
  const usernameLower = username.toLowerCase();
  const emailLower = email.toLowerCase();
  return User.filter(R.row('username').eq(usernameLower).or(R.row('email').eq(emailLower)))
  .nth(0)
  .default(null)
  .run();
});

/**
 * Update the last login date to now for a user identified by email address
 */
User.defineStatic('updateLastLogin', function (username, email) {
  const usernameLower = username.toLowerCase();
  const emailLower = email.toLowerCase();
  return User.filter(R.row('username').eq(usernameLower).or(R.row('email').eq(emailLower)))
  .nth(0)
  .run()
  .then(user => {
    user.lastLogin = R.now();
    return user.save();
  });
});

module.exports = User;