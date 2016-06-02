'use strict';

/**
 * The user model.
 */

const Promise = require('bluebird');
const config = require('../../config/webbox.config');
const Thinky = require('../util/thinky');
const type = Thinky.type;
const R = Thinky.r;

const Log = Thinky.createModel('Log', {
  id: type.string(),
  eventName: type.string().required(),
  eventMessage: type.string().default(''),
  eventData: type.object().optional().default({}),
  eventType: type.string().required().default('Error'),
  timeStamp: type.date().required().default(() => new Date())
});

Log.ensureIndex('eventName');
Log.ensureIndex('timeStamp');

/**
 * Create and save a new log entry in the database
 * @param {string} eventName - Name of the Event, may be a dotted name
 * @param {string} eventMessage - An optional event message
 * @param {object} eventData - Any event related data to store
 */
Log.defineStatic('createLog', function (eventName, eventMessage, eventData, eventType) {
  const log = new Log({
    eventName: eventName,
    eventMessage: eventMessage,
    eventData: eventData,
    eventType: eventType
  });

  log.save().error(err => {
    console.log('Log.createLog', err);
  });
});


module.exports = Log;