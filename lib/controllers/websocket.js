/**
 * Course Controller
 *
 * Handles viewing and editing courses
 */
import Config from '../../config/webbox.config';
import { EventLog, EventLogTypes } from '../models/eventLog';
import TestResult from '../models/testResult';
import CodeEmbed from '../models/codeEmbed';
import Thinky from '../util/thinky';
import Promise from 'bluebird';
import { RemoteActions } from '../../common/constants/Embed';
const R = Thinky.r;

export async function onEvent (request, h) {
  const io = request.server.plugins['hapi-io'].io; // socket.io server reference
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
    return h.response({message: 'invalid event data'});
  }

  // Data is valid
  try {
    await eventLog.save();
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
  return h.response({message: 'finished'});
}


function submission(request, credentials) {
  const io = request.server.plugins['hapi-io'].io; // socket.io server reference
  const embedId = request.payload.embedId;

  if (embedId == null) {
    return { error: 'Invalid or no embedId specified.' };
  }

  // Check owner
  if (credentials.isOwner === true) {
    return {
      error: 'Dir gehört das Beispiel, du kannst nichts an dich selbst schicken.'
    };
  }
  console.info('submission', credentials);

  // Broadcast to room with embedId
  if (io) {
    // push the log event to listeners
    console.log('Broadcast submission from user %s (%s)', credentials.userid, credentials.username);
    io.to(embedId).emit('submission', request.payload);
  }

  return {};
}

function saveTestResult(request, credentials) {
  const io = request.server.plugins['hapi-io'].io; // socket.io server reference
  const embedId = request.payload.embedId;

  const username = credentials.username;
  const userId = credentials.userid;
  const actionData = request.payload.actionData || {};
  let timeStamp;

  if (embedId == null) {
    return { error: 'Invalid or no embedId specified.' };
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
  let testResultData = {
    userId: userId,
    embedId: embedId,
    score: actionData.score,
    scorePercentage: actionData.scorePercentage,
    data: actionData.data,
    timeStamp: timeStamp
  };

  // Create TestResult instance
  const testResult = new TestResult(testResultData);

  // Validate TestResult using our defined schema
  try {
    testResult.validate();
  } catch (err) {
    // Validation error, invalid data provided
    console.error('websocket.saveTestResult received invalid TestResult data', err);

    // Leave generator
    return {};
  }

  // Data is valid
  TestResult.updateOrCreate(testResultData);

  // Notify listeners for this example
  if (io) {
    // push the log event to listeners
    try {
      io.to(testResult.embedId).emit('user-testresult', testResult);
    } catch (e) {
      console.log('Failed broadcast', e);
    }
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

  if (embedId == null) {
    return { error: 'Invalid or no embedId specified.' };
  }

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
      console.error('websocket.subscribe', e);
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

  if (embedId == null) {
    return { error: 'Invalid or no embedId specified.' };
  }

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

async function getCodeEmbedMetadata(payload, credentials) {
  let embedId;
  let metadata;

  // ToDo: we might need to have a better role or permission model for code embeds
  if (!credentials.isOwner && !(Config.websocket.notify.authorsAllowed && credentials.isAuthor)) {
    return {
      error: 'Not allowed!'
    };
  }

  embedId = payload.embedId;

  if (embedId == null) {
    return { error: 'Invalid or no embedId specified.' };
  }

  try {
    let data = await CodeEmbed.get(embedId).pluck('meta', 'slug', 'id', 'createdAt', 'lastUpdate', '_creatorId').execute();
    let meta = data.meta;

    delete data.meta;

    metadata = {...data, ...meta};
    console.info('Retrieved code embed metadata (flattend)', metadata);
  } catch (err) {
    console.error('websocket.getCodeEmbedMetadata retrieving metadata for embed failed', err);
    return { error: 'Could not get metadata. See logs.'};
  }

  return { metadata };
}

async function getTestResults (payload, credentials) {
  let testResults;
  let embedId;
  let filter;
  let order;

  if (!credentials.isOwner && !(Config.websocket.notify.authorsAllowed && credentials.isAuthor)) {
    return {
      error: 'Not allowed!'
    };
  }

  embedId = payload.embedId;

  if (embedId == null) {
    return { error: 'Invalid or no embedId specified.' };
  }

  filter = { embedId: embedId };
  order = { index: 'timeStamp' };

  try {
    if (payload.startDate != null) {
      testResults = await TestResult.orderBy(order)
        .filter(filter)
        .filter(R.row('timeStamp').during(R.ISO8601(payload.startDate.startDate), R.now()), {leftBound: 'open', rightBound: 'open'})
        .run();
    } else {
      testResults = await TestResult.orderBy(order).filter(filter).run();
    }
  } catch (err) {
    console.error('websocket.getTestResults EventLog filtering for embed failed', err);
    return { error: 'Could not get test results. See logs.'};
  }

  return { testResults: testResults };
}

async function getEvents (payload, credentials) {
  let events;
  let embedId;
  let filter;
  let order;

  if (!credentials.isOwner && !(Config.websocket.notify.authorsAllowed && credentials.isAuthor)) {
    return {
      error: 'Not allowed!'
    };
  }

  embedId = payload.embedId;
  console.info('getEvents payload', payload);

  if (embedId == null) {
    return { error: 'Invalid or no embedId specified.' };
  }

  filter = {
    embedId: embedId,
    archived: false
  };
  order = { index: 'timeStamp' };


  try {
    if (payload.startDate != null) {
      events = await EventLog.orderBy(order)
        .filter(filter)
        .filter(R.row('timeStamp').during(R.ISO8601(payload.startDate.startDate), R.now()), {leftBound: 'open', rightBound: 'open'})
        .run();
    } else {
      events = await EventLog.orderBy(order).filter(filter).run();
    }
  } catch (err) {
    console.log('websocket.getEvents EventLog filtering for embed failed', err);
    return { error: 'Could not get events. See logs.'};
  }

  return { events: events };
}

async function archiveEventLogs (payload, credentials) {
  let embedId;
  let filter;

  if (!credentials.isOwner && !(Config.websocket.notify.authorsAllowed && credentials.isAuthor)) {
    return {
      error: 'Not allowed!'
    };
  }

  embedId = payload.embedId;

  if (embedId == null) {
    return { error: 'Invalid or no embedId specified.' };
  }

  filter = {
    embedId: embedId,
    archived: false
  };

  try {
    await EventLog.filter(filter).update({archived: true}).run();
    console.info('Archived events for embed', embedId);
  } catch (err) {
    console.log('websocket.archiveEventLogs EventLog filtering for embed failed', err);
    return { error: 'Could not archive events. See logs.'};
  }

  return { };
}

export async function onAction (request, h) {
  const actionName = request.payload.action;
  const credentials = request.auth.credentials;
  let response;

  if (!actionName) {
    return h({error: 'Invalid action'});
  }

  console.info('Action requested', actionName, credentials, request.payload);

  switch (actionName) {
    case RemoteActions.GetEvents:
      response = await getEvents(request.payload, credentials);
      return response;

    case RemoteActions.SubscribeToEvents:
      response = subscribe(request, credentials);
      return response;

    case RemoteActions.UnsubscribeFromEvents:
      response = unsubscribe(request, credentials);
      return response;

    case RemoteActions.ArchiveEventLogs:
      response = await archiveEventLogs(request.payload, credentials);
      return response;

    case RemoteActions.Submission:
      response = submission(request, credentials);
      return response;

    case RemoteActions.TestResult:
      response = await saveTestResult(request, credentials);
      return response;

    case RemoteActions.GetTestResults:
      response = await getTestResults(request.payload, credentials);
      return response;

    case RemoteActions.GetCodeEmbedMetadata:
      response = await getCodeEmbedMetadata(request.payload, credentials);
      return response;

    default:
      return {error: 'Invalid action'};
  }
}
