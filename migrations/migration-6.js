/**
 * Updates all EventLogs with archived flag
 */

// recentDocuments
import EventLog from '../lib/models/eventLog';
var Promise = require('bluebird');
var Thinky = require('../lib/util/thinky');

function run() {
  console.info('Updating EventLogs with archived flags');

  EventLog.update({archived: false}).run().then(res => {
    console.info('done');
    process.exit();
  });
}

run();