/**
 * Adds published attribute to all courses
 */

// recentDocuments
require("babel-register");
require('babel-polyfill');
var Course = require('../lib/models/course');

function run() {
  console.info('Updating courses with published attribute');

  Course.update({
    published: true
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