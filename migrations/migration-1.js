/**
 * Adds recentDocuments attribute to all users
 */

// recentDocuments
require("babel-register");
require('babel-polyfill');
var User = require('../lib/models/user');

function run() {
  console.info('Updating users with recentDocuments');
  User.run().then(users => {

    for (var user of users) {
      if (!user.recentDocuments) {
        user.recentDocuments = [];
        console.info('Updating user with id:', user.id);
        user.save().error(err => {
          console.error(err);
        });
      } else {
        console.info('Skipping user with id:', user.id);
      }
    }
    console.info('Finished migration.');

    process.exit();
  }).error(err => {
    console.error(err);
    process.exit();
  });

  return;
}

run();