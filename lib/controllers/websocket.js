/**
 * Course Controller
 *
 * Handles viewing and editing courses
 */
'use strict';
import JWT from 'jsonwebtoken';
import UUID from 'uuid';
import Config from '../../config/webbox.config';
import { EventLog, EventLogTypes } from '../models/eventLog';

export function* onEvent (request, reply) {
  const io = request.plugins['hapi-io'];
  const username = request.auth.credentials.username;
  const userId = request.auth.credentials.userid;
  const eventData = request.payload.eventData || {};
  let type;
  let timeStamp;

  // Type required a special handling for errors,
  // this allows us to query errors easily
  if (request.payload.eventName === EventLogTypes.Error) {
    type = eventData.error || 'unknown';
  } else {
    type = '';
  }

  // TimeStamp checking
  if (request.payload.timeStamp) {
    try {
      timeStamp = new Date(request.payload.timeStamp);
    } catch (err) {
      console.warn('websocket.onEvent received malformed timeStamp from user', userId, username);
      timeStamp = new Date();
    }
  } else {
    timeStamp = new Date();
  }

  // Pluck data to create event log
  let logData = {
    name: request.payload.eventName,
    type: type,
    message: eventData.message,
    embedId: request.payload.embedId || '',
    embedName: request.payload.embedName,
    username: username,
    userId: userId,
    data: eventData,
    timeStamp: timeStamp
  };

  // Create EventLog instance
  const eventLog = new EventLog(logData);

  // Validate EventLog using our defined schema
  try {
    eventLog.validate();
  } catch (err) {
    // Validation error, invalid data provided
    console.error('websocket.onEvent received invalid event data', err);

    // Leave generator
    return reply();
  }

  // Data is valid
  try {
    yield eventLog.save();
  } catch (err) {
    console.error('websocket.onEvent failed to save EventLog', err);
  }

  // Notify listeners for this example
  if (io) {
    // push the log event to listeners
    io.to(eventLog.embedId).emit('eventlog', eventLog);
  }

  // finished
  return reply();
}

/**
 * Subscribing on room for receiving events
 */
export function* onSubscribe(request, reply) {
  const io = request.plugins['hapi-io'];
  const credentials = request.auth.credentials;
  const embedId = request.payload.embedId;
  let socket;

  // Check rights
  if (!credentials.isOwner && !(Config.websocket.notify.authorsAllowed && credentials.isAuthor)) {
    return reply({
      error: Config.messages.websocket.subscribeNotAllowed
    });
  }

  // Add user to room
  if (io) {
    socket = io.socket;

    socket.join(embedId);
  }
}

/**
 * Subscribing on room for receiving events
 */
export function* onUnsubscribe(request, reply) {
  const io = request.plugins['hapi-io'];
  const credentials = request.auth.credentials;
  const embedId = request.payload.embedId;
  let socket;

  // Check rights
  if (!credentials.isOwner && !(Config.websocket.notify.authorsAllowed && credentials.isAuthor)) {
    return reply({
      error: Config.messages.websocket.subscribeNotAllowed
    });
  }

  // Add user to room
  if (io) {
    socket = io.socket;

    socket.leave(embedId);
  }
}

export function* onAction (request, reply) {
  const actionName = request.payload.action;
  const embedId = request.payload.embedId;
  const credentials = request.auth.credentials;
  let events;

  if (!actionName) {
    return reply({error: 'Invalid action'});
  }

  switch (actionName) {
    case 'get-events':
      // Check rights
      // Check rights
      if (!credentials.isOwner && !(Config.websocket.notify.authorsAllowed && credentials.isAuthor)) {
        return reply({
          error: 'Not allowed!'
        });
      }

      // ToDo: add support for startdate
      try {
        events = yield EventLog.filter({ embedId: embedId }).run();
      } catch (err) {
        console.error('websocket.onAction EventLog filtering for embed failed', err);
      }

      return reply({ events: events });
    default:
      return reply({error: 'Invalid action'});
  }
}

/*
run event payload:
{ eventName: 'run',
  eventData: { execCommand: [ 'python3', './main.py' ] },
  timeStamp: '2016-06-20T06:41:39.584Z',
  embedName: 'PythonTest',
  embedId: 'db0cadd0-fe97-415b-96f6-90ecbd2d11e0',
  embedUser: 'test3@test.de' }

*/

/*
 error event payload:
 { eventName: 'error',
  eventData:
   { file: './main.py',
     line: '1',
     error: 'SyntaxError',
     message: 'invalid syntax',
     raw: '  File "./main.py", line 1    print(\'test on document\')sdfa                                ^SyntaxError: invalid syntax',
     fileContent: 'print(\'test on document\')sdfa' },
  timeStamp: '2016-06-20T06:42:38.734Z',
  embedName: 'PythonTest',
  embedId: 'db0cadd0-fe97-415b-96f6-90ecbd2d11e0',
  embedUser: 'test3@test.de' }
*/

/*

websocket jwt credentials:
{ username: 'test3',
  userid: '4473f918-1ea2-4b64-9c3a-308417738501',
  isAuthor: true,
  isOwner: true,
  iat: 1466406530 }

*/