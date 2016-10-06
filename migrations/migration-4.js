/**
 * Adds embedType attribute to all documents
 */

// recentDocuments
require("babel-register");
require('babel-polyfill');
var User = require('../lib/models/user');
var Thinky = require('../lib/util/thinky');

function run() {
  console.info('Updating user with createdAt');

  User.filter(d => {
    return d.hasFields('createdAt').not();
  }).update({
    createdAt: Thinky.r.now()
  }).run()
  .then(() => {
    console.info('Finished migration.');
    process.exit();
  })
  .error(err => {
    console.error(err);
    process.exit();
  });

  return;
}

run();