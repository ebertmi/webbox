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
import Thinky from '../util/thinky';
const R = Thinky.r;

export function* onEvent (request, reply) {
  const io = request.server.plugins["hapi-io"].io; // socket.io server reference
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
    try {
      io.to(eventLog.embedId).emit('ide-event', eventLog);
    } catch (e) {
      console.log('failed broadcast', e);
    }
  }

  // finished
  return reply();
}


function submission(request, credentials) {
  const io = request.server.plugins["hapi-io"].io; // socket.io server reference
  const embedId = request.payload.embedId;

  // Check rights
  // ToDo:

  // Broadcast to room with embedId
  if (io) {
    // push the log event to listeners
    io.to(embedId).emit('submission', request.payload);
  }

  return {};
}

/**
 * Subscribing on room for receiving events
 */
function subscribe(request, credentials) {
  const io = request.plugins['hapi-io'];
  const embedId = request.payload.embedId;
  let socket;

  // Check rights
  if (!credentials.isOwner && !(Config.websocket.notify.authorsAllowed && credentials.isAuthor)) {
    return {
      error: Config.messages.websocket.subscribeNotAllowed
    };
  }

  // Add user to room
  if (io) {
    socket = io.socket;
    try {
      socket.join(embedId);
    } catch (e) {
      console.log(e);
    }
  }

  return {};
}

/**
 * Subscribing on room for receiving events
 */
function unsubscribe(request, credentials) {
  const io = request.plugins['hapi-io'];
  const embedId = request.payload.embedId;
  let socket;

  // Check rights
  if (!credentials.isOwner && !(Config.websocket.notify.authorsAllowed && credentials.isAuthor)) {
    return {
      error: Config.messages.websocket.subscribeNotAllowed
    };
  }

  // Add user to room
  if (io) {
    socket = io.socket;

    socket.leave(embedId);
  }

  return {};
}

function* getEvents (payload, credentials) {
  let events;
  let embedId;
  let filter;
  let order;

  if (!credentials.isOwner && !(Config.websocket.notify.authorsAllowed && credentials.isAuthor)) {
    return yield {
      error: 'Not allowed!'
    };
  }

  embedId = payload.embedId;

  filter = { embedId: embedId };
  order = { index: 'timeStamp' };


  try {
    if (payload.startDate != null) {
      events = yield EventLog.orderBy(order)
      .filter(filter)
      .filter(R.row('timeStamp').during(R.ISO8601(payload.startDate.startDate), R.now()), {leftBound: "open", rightBound: "open"})
      .run();
    } else {
      events = yield EventLog.orderBy(order).filter(filter).run();
    }
  } catch (err) {
    console.error('websocket.getEvents EventLog filtering for embed failed', err);
    return { error: 'Could not get events. See logs.'};
  }

  return yield { events: events };
}

export function* onAction (request, reply) {
  const actionName = request.payload.action;
  const credentials = request.auth.credentials;
  let response;

  if (!actionName) {
    return reply({error: 'Invalid action'});
  }

  switch (actionName) {
    case 'get-events':
      response = yield getEvents(request.payload, credentials);
      return reply(response);

    case 'subscribe':
      response = subscribe(request, credentials);
      return reply(response);

    case 'unsubscribe':
      response = unsubscribe(request, credentials);
      return reply(response);

    case 'submission':
      response = submission(request, credentials);
      return reply(response);

    default:
      return reply({error: 'Invalid action'});
  }
}
