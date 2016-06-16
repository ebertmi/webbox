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
import { getCookie } from '../services/utils';

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

export class SocketCommunication extends EventEmitter {
  constructor(connection={jwt:'', url:'', port:80}) {
    super();
    this._queue = [];
    this._socket;
    this._jwt = connection.jwt;
    this._url = connection.url;
    this._port = connection.port;
  }

  connect() {
    if (this._socket) {
      return;
    }

    let crumb = getCookie('crumb');

    // Defer the connection until we receive our first message or event
    this._socket = io(this._url,  {query : `Authorization=${this._jwt}&crumb=${crumb}`});

    this._socket.on('connect', this.onConnect.bind(this));
    this._socket.on('disconnect', this.onDisconnect.bind(this));
    this._socket.on('reconnect', this.onReconnect.bind(this));
    this._socket.on('reconnect_failed', this.onReconnectFailed.bind(this));
  }

  onConnect() {
    this.emit('connect');
    this.purgeQueue();
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
  }

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
          throw new Error('SocketCommunication.purgeQueue queue contains invalid item.');
        }
      }
    }
  }

  /**
   * Send an action
   */
  sendAction(action) {
    if (!(action instanceof Action)) {
      throw new Error(`SocketCommunication.sendAction requires an instance of Action. Got ${typeof action}`);
    }

    // We need to establish an connection
    if (!this._socket) {
      this._queue.push(action);
      this.connect();
    }

    // Only send action if we have a valid connection
    if (!this.isConnected()) {
      action.run({ error: 'Keine Verbindung zum Server. Ihre Aktion kann nicht ausgeführt werden.' });
    } else {
      this._socket.emit('embed-action',action.asObject(), res => {
        action.run(res);
      });
    }
  }

  sendEvent(eventLog) {
    if (!(eventLog instanceof EventLog)) {
      throw new Error(`SocketCommunication.sendEvent requires an instance of EventLog. Got ${typeof eventLog}`);
    }

    if (!this._socket) {
      this.connect();
    }

    // Check if we have a open connection
    if (this.isConnected()) {
      this._socket.emit('embed-event', eventLog.asObject(), res => {
        console.info(res);
      });
    } else {
      this._queue.push(eventLog);
    }
  }

  isConnected() {
    return this._socket && this._socket.connected;
  }
}