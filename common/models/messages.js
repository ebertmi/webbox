/**
 * Each IDE as an status bar with messages shown at the bottom. Inspired by VS Code by ported
 * to our internal data model and React.
 */

/*---------------------------------------------------------------------------------------------
  Copyright (c) Microsoft Corporation

  All rights reserved.

  MIT License

  Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation
  files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy,
  modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software
  is furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
  OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS
  BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT
  OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *--------------------------------------------------------------------------------------------*/

import { EventEmitter } from 'events';
import { Action } from './actions';
import Promise from 'bluebird';
import isString from 'lodash/isString';

/**
 * Severity of Messages.
 */
export const Severity = {
  "Info": "info",
  "Warning": "warning",
  "Error": "danger"
};

export class MessageWithAction {
  constructor(message, actions) {
    this.message = message;
    this.actions = actions || [];
  }
}

let _internalMessageCounter = 1000;

export class MessageEntry extends EventEmitter {
  constructor(data) {
    super();

    this.id = data.id || null;
    this.text = data.text || '';
    this.severity = data.severity || Severity.Info;
    this.time = data.time || null;
    this.count = data.count || 1;
    this.actions = data.actions || null;
    this.key = data.key;
  }


  emitChange() {
    this.emit('change');
  }
}

/**
 * Maintains a list of messages
 */
export class MessageList extends EventEmitter {
  constructor(usageLogger, options = { purgeInterval: MessageList.DEFAULT_MESSAGE_PURGER_INTERVAL, maxMessages: MessageList.DEFAULT_MAX_MESSAGES }) {
    super();

    this.messages = [];
    this.messageListPurger = null;
    this.usageLogger = usageLogger;
    this.options = options;
  }

  /**
   * Adds the message to the list and triggers a UI change.
   * The @param{message} may be a string, Error, string[] or Error[].
   */
  showMessage(severity, message) {
    // translate multiple messages into to single calls
    if (Array.isArray(message)) {
      let closeFns = [];
      message.forEach(msg => closeFns.push(this.showMessage(severity, msg)));
      return () => closeFns.forEach(fn => fn());
    }

    let messageText = this.getMessageText(message);
    if (!messageText || typeof messageText !== 'string') {
      return () => {/* empty message */};
    }

    // show the message
    this.usageLogger.log(message, messageText, severity);
    return this.doShowMessage(message, messageText, severity);
  }

  getMessageText(message) {
    if (isString(message)) {
      return message;
    }

    if (message instanceof Error) {
      return message.message; // return errror message (could be better)
    }

    if (message instanceof MessageWithAction) {
      return message.message;
    }

    // unsupported message argument
    return null;
  }

  doShowMessage(id, message, severity) {
    // try to remove undismissed messages
    this.purgeMessages();

    // new messages come first so that they show up on top
    this.messages.unshift(new MessageEntry({
      id: id,
      text: message,
      severity: severity,
      time: new Date().getTime(),
      actions: id.actions,
      key: 'ME' + _internalMessageCounter++
    }));

    // trigger change
    this.prepareRenderMessages(true, 1);

    return () => {
      this.hideMessage(id);
    };
  }

  getMessageActions(message) {
    let messageActions = [];

    if (message.actions && message.actions.length > 0) {
      messageActions = message.actions;
    } else {
      messageActions = [
        new Action('close.message.action', 'Schließen', null, true, () => {
          this.hideMessage(message.text); // hide all messsage with same text

          return Promise.resolve(true);
        })
      ];
    }

    return messageActions;
  }

  prepareRenderMessages(animate) {
    let messages = this.prepareMessages();
    this.animate = animate;

    messages.forEach((message) => {
      // Messages with Actions, whe none provided we provide a close message action
      let messageActions = this.getMessageActions(message);
      message.actions = messageActions;
    });

    this.emitChange();
  }

  prepareMessages() {
    let messages = [];
    let handledMessages = {};

    let offset = 0;

    for (let i = 0; i < this.messages.length; i++) {
      let message = this.messages[i];
      if (handledMessages[message.text] === null || handledMessages[message.text] === undefined) {
        message.count = 1;
        messages.push(message);
        handledMessages[message.text] = offset++;
      } else {
        handledMessages[message.text].count++;
      }
    }

    if (messages.length > this.options.maxMessages) {
      return messages.splice(messages.length - this.options.maxMessages, messages.length);
    }

    return messages;
  }

  disposeMessages(messages) {
    messages.forEach(message => {
      if (message.actions) {
        message.actions.forEach(action => {
          action.dispose();
        });
      }
    });
  }

  hideMessages() {
    this.hideMessage();
  }

  hideMessage(messageObj) {
    let messageFound = false;

    for (let i = 0; i < this.messages.length; i++) {
      let message = this.messages[i];
      let hide = false;

      // hide message with text
      if (messageObj) {
        hide = (isString(messageObj) && message.text === messageObj) || message.id === messageObj;
      } else {
        // hide all messages
        hide = true;
      }

      if (hide) {
        this.disposeMessages(this.messages.splice(i, 1));
        i--;
        messageFound = true;
      }
    }

    if (messageFound) {
      this.prepareRenderMessages(false);
    }
  }

  /**
   * Remove info and warning messages if the spam the UI and
   * are not dismissed by the user.
   */
  purgeMessages() {
    if (this.messageListPurger) {
      this.messageListPurger.cancel();
    }

    this.messageListPurger = Promise.delay(this.options.purgeInterval).then(() => {
      let needsUpdate = false;
      let counter = 0;
      for (let i = 0; i < this.messages.length; i++) {
        let message = this.messages[i];

        // only remove infos and warnings
        if (message.severity !== Severity.Error && !message.actions) {
          this.disposeMessages(this.messages.splice(i, 1));
          counter--;
          i--;
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        this.prepareRenderMessages(false);
      }
    });
  }

  getMessages() {
    return this.messages;
  }

  emitChange() {
    this.emit('change');
  }
}

// defaults
MessageList.DEFAULT_MESSAGE_PURGER_INTERVAL = 10000;
MessageList.DEFAULT_MAX_MESSAGES = 5;