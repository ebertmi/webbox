/**
 * Each IDE as an status bar with messages shown at the bottom
 */

import {EventEmitter} from 'events';

export class Status extends EventEmitter {
  constructor() {
    super();

    this.languageInformation = '';

    this.statusMessage = '';
    this.statusTitle = '';

    this.onOkay = null; // no op
    this.onCancel = null; // no op

    this.level = 'default';
  }

  setLanguageInformation(content) {
    this.languageInformation = content;

    this.emitChange();
  }

  setStatusMessage(message, title='', level='default', timeout=false) {
    this.statusMessage = message;
    this.statusTitle = title;
    this.level = level;

    this.emit('change');

    if (timeout && Number.isInteger(timeout)) {
      window.setTimeout(() => {
        this.resetStatusMessage();
      }, timeout);
    }
  }

  resetStatusMessage() {
    this.statusMessage = '';
    this.statusTitle = '';
    this.level = 'default';
    this.emit('change');
  }

  resetAll() {
    this.languageInformation = '';
    this.resetStatusMessage();
  }

  getStatusData() {
    return {
      message: this.statusMessage,
      title: this.statusTitle,
      onOkay: this.onOkay,
      onCancel: this.onCancel,
      languageInformation: this.languageInformation,
      level: this.level
    };
  }

  emitChange() {
    this.emit('change');
  }
}