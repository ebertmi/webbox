/**
 * Each IDE as an status bar with messages shown at the bottom
 */

import {EventEmitter} from 'events';
import { Severity } from './../severity';

export class Status extends EventEmitter {
  constructor() {
    super();

    this.languageInformation = '';
    this.username = '';

    this.statusMessage = '';
    this.statusTitle = '';

    this.onOkay = null; // no op
    this.onCancel = null; // no op

    this.severity = Severity.Ignore; // ignore does not have any special color
  }

  setUsername(name) {
    this.username = name;

    this.emitChange();
  }

  setLanguageInformation(content) {
    this.languageInformation = content;

    this.emitChange();
  }

  setStatusMessage(message, title='', severity=Severity.Ignore, timeout=false) {
    this.statusMessage = message;
    this.statusTitle = title;
    this.severity = severity;

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
    this.severity = Severity.Ignore;
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
      username: this.username,
      severity: this.severity
    };
  }

  emitChange() {
    this.emit('change');
  }
}