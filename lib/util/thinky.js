/**
 * thinky util creates and thinky ORM singleton instance which maintains a thread/connection pool.
 * just require util/thinky in your models.
 */
var config = require('../../config/webbox.config');

// create instance and pass in options
var thinky = require('thinky')({
    host: config.database.host,
    port: config.database.port,
    db: config.database.db,
    authKey: config.database.authKey
});

module.exports = thinky;