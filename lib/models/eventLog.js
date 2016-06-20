'use strict';

/**
 * The user model.
 */

import Promise from 'bluebird';
import Config from '../../config/webbox.config';
import Thinky from '../util/thinky';
const Type = Thinky.type;
const R = Thinky.r;

export const EventLogTypes = {
  Error: 'error',
  Run: 'run',
  Failure: 'failure'
};

export const ANONYMOUS_USER = 'anonymous';

export const EventLog = Thinky.createModel('EventLog', {
  id: Type.string(),
  name: Type.string().required(),
  type: Type.string().required().default(EventLogTypes.Error),
  message: Type.string().default(''),
  embedId: Type.string().default(null),
  embedName: Type.string().default(null),
  embedDocument: Type.string().default(null),
  userId: Type.string().default(ANONYMOUS_USER),
  username: Type.string().default(ANONYMOUS_USER),
  data: Type.object().optional().default({}),
  timeStamp: Type.date().required().default(() => new Date())
});

EventLog.ensureIndex('name');
EventLog.ensureIndex('type');
EventLog.ensureIndex('username');
EventLog.ensureIndex('embedId');
EventLog.ensureIndex('timeStamp');

export default EventLog;