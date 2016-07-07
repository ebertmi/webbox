/**
 * thinky util creates and thinky ORM singleton instance which maintains a thread/connection pool.
 * just require util/thinky in your models.
 */
var config = require('../../config/webbox.config');

// Create instance and pass in options
// See https://github.com/neumino/rethinkdbdash#importing-the-driver
var thinky = require('thinky')({
  host: config.database.host,
  port: config.database.port,
  db: config.database.db,
  user: config.database.user,
  password: config.database.password,
  //authKey: config.database.authKey // old way, disabled for now
});

module.exports = thinky;