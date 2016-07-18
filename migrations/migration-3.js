/**
 * Adds embedType attribute to all documents
 */

// recentDocuments
require("babel-register");
require('babel-polyfill');
var Document = require('../lib/models/document');

function run() {
  console.info('Updating documents with embedType attribute, default value=sourcebox');

  Document.update({
    embedType: 'sourcebox'
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