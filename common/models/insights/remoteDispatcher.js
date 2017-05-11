/**
 * IDE-MessageBroker is a general entry point for logging all relevant events (messages) from the IDE in various places.
 * Possible events:
 *  - Run an example
 *  - Error occured during run
 *  - Stopping and example ?
 *  - Testing an example (test results)
 *
 * The collect all events and publish them to the server, once we have an active connection
 *
 * Additionally, it allows to send messages for specific actions, like sending your current code to the teacher
 */
import io from 'socket.io-client';
import { EventEmitter } from 'events';
import isFunction from 'lodash/isFunction';
import Debug from 'debug';

import { getCookie } from '../../services/utils';
import { trackUserInteraction } from '../../util/trackingUtils';

const debug = Debug('webbox:RemoteDispatcher');

export const RemoteEventTypes = {
  IdeEvent: 'ide-event',
  Submission: 'submission',
  TestResult: 'user-testresult'
};

/**
 * Encapsulates a simple event log entry.
 */
export class EventLog {
  constructor(name, data={}) {
    this._name = name;
    this._data = data;
    this._timeStamp = new Date();
    this._context = {};
  }

  /**
   * Set context information about the event. E.g.:
   *  - embed id
   *  - user
   * - ...
   */
  setContext(context) {
    this._context = context;
  }

  asObject() {
    return {
      eventName: this._name,
      eventData: this._data,
      timeStamp: this._timeStamp,
      ...this._context
    };
  }

  asJSONString() {
    return JSON.stringify(this.asObject());
  }
}

/**
 * Error from std error
 */
EventLog.NAME_ERROR = 'error';

/**
 * Run event
 */
EventLog.NAME_RUN = 'run';

/**
 * Process failures
 */
EventLog.NAME_FAILURE = 'failure';

EventLog.NAME_TEST = 'test';

/**
 * Encapsulates an action, that is triggered on the server side. E.g. sending in an example. Or starting/stopping a session.
 */
export class Action {
  constructor(action, user, data={}, callback) {
    this._action = action;
    this._user = user;
    this._data = data;
    this._timeStamp = new Date();
    this._callback = callback;
    this._context = {};
  }

  /**
   * Set context information about the event. E.g.:
   *  - embed id
   *  - user
   * - ...
   */
  setContext(context) {
    this._context = context;
  }

  asObject() {
    return {
      action: this._action,
      actionData: this._data,
      actionUser: this._user,
      timeStamp: this._timeStamp,
      ...this._context
    };
  }

  /**
   * Calls the callback function, if any
   * This is called for server responses
   */
  run(res) {
    if (isFunction(this._callback)) {
      this._callback.call(null, res);
    }
  }

  asJSONString() {
    return JSON.stringify(this.asObject());
  }
}

/**
 * Better name for Action, as it is a remotely called action
 */
export const RemoteAction = Action;

/**
 * Establishes a websocket connection to the server on demand and allows to send events and actions.
 * The SocketCommunication instance emits multiple events:
 *  - "connect" when the connection to the server is established
 *  - "disconnect" when the connection is lost
 *  - "reconnect" when the socket reconnected successfully
 *  - "reconnect_failed" when the socket could not reconnect after the specified reconnect_attempts
 */
export class RemoteDispatcher extends EventEmitter {
  constructor(connection={jwt:'', url:'', port:80}) {
    super();
    this._queue = [];
    this._socket;
    this._jwt = connection.jwt;
    this._url = connection.url;
    this._port = connection.port;

    debug('Constructor with connection: ', connection);
  }

  /**
   * Try to create a socket connection.
   * NOTE: The socket tries to reconnect automatically
   */
  connect() {
    if (this._socket) {
      return;
    }

    // CSRF token (hapi crumb plugin)
    let crumb = getCookie('crumb');

    if (crumb == null) {
      crumb = window.__crumb__;
    }

    if (crumb == null) {
      debug('Failed to access crumb. Establishing websocket connection will fail.');
    }

    // Defer the connection until we receive our first message or event
    this._socket = io(this._url,  {query : `Authorization=${this._jwt}&crumb=${crumb}`});

    this._socket.on('connect', this.onConnect.bind(this));
    this._socket.on('disconnect', this.onDisconnect.bind(this));
    this._socket.on('reconnect', this.onReconnect.bind(this));
    this._socket.on('reconnect_failed', this.onReconnectFailed.bind(this));

    debug('connect() with socket', this._socket);
  }

  onConnect() {
    this.emit('connect');
    this.purgeQueue();

    debug('onConnect()');
  }

  onReconnect() {
    this.emit('reconnect');
    this.purgeQueue();
  }

  onReconnectFailed() {
    this.emit('reconnect_failed');
  }

  onDisconnect() {
    this.emit('disconnect');
  }

  onError(err) {
    this.emit('error', err);
    debug('onError', err);
  }

  /**
   * Try to empty the queue of EventLogs and Actions. We make a copy of the current queue and remove all items that are copied.
   * Then we try to send those to server. If sending fails, those will be automatically added to the queue again.
   */
  purgeQueue() {
    // Empty queue und store items in local one. This prevents infinite loops when the connection is failing in between.
    const queue = this._queue.splice(0, this._queue.length);

    if (this.isConnected()) {
      for (let elm of queue) {
        if (elm instanceof Action) {
          this.sendAction(elm);
        } else if (elm instanceof EventLog) {
          this.sendEvent(elm);
        } else {
          throw new Error('RemoteDispatcher.purgeQueue queue contains invalid item.');
        }
      }
    }
  }

  /**
   * Send an action. If there is no socket connection, it will be established and the action will be queued.
   * If there is an connection, but the socket is currently not connected, we just discard the action.
   * Actions are immediate interactions and queuing them up during offline usage may cause side effects.
   */
  sendAction(action, useQueue=false) {
    if (!(action instanceof Action)) {
      throw new Error(`RemoteDispatcher.sendAction requires an instance of Action. Got ${typeof action}`);
    }

    // We need to establish an connection
    if (!this._socket) {
      this._queue.push(action);
      this.connect();
      return;
    }

    // Only send action if we have a valid connection
    if (!this.isConnected()) {
      if (useQueue) {
        this._queue.push(action);
      } else {
        action.run({ error: 'Keine Verbindung zum Server. Ihre Aktion kann nicht ausgeführt werden.' });
      }
    } else {
      let actionAsObject = action.asObject();

      trackUserInteraction('embed-action', actionAsObject);

      debug('sending action: ', actionAsObject);
      this._socket.emit('embed-action', actionAsObject, res => {
        action.run(res);
      });
    }
  }

  /**
   * Sends the logged event. If there is not socket connection, it will be created. Events are queued if we have not connection.
   */
  sendEvent(eventLog) {
    if (!(eventLog instanceof EventLog)) {
      throw new Error(`RemoteDispatcher.sendEvent requires an instance of EventLog. Got ${typeof eventLog}`);
    }

    if (!this._socket) {
      this.connect();
    }

    // Check if we have a open connection
    if (this.isConnected()) {
      const eventObj = eventLog.asObject();

      trackUserInteraction('embed-event', eventObj);

      this._socket.emit('embed-event', eventObj, res => {
        // ToDo:
        if (res && res.error) {
          debug.error(res.error);
        }
      });
    } else {
      this._queue.push(eventLog);
    }
  }

  /**
   * Add a listener for events from the socket connection.
   *
   * @param {String} event Event to listen on
   * @param {Function} handler Function to handle the messages for the specified event
   */
  addSocketEventListener(event, handler) {
    this._socket.on(event, handler);
  }

  removeSocketEventListener(event, handler) {
    this._socket.removeListener(event, handler);
  }

  /**
   * Returns true if we have a valid socket connection and if the socket is connected currently
   */
  isConnected() {
    return this._socket && this._socket.connected;
  }
}