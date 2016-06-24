import { EventEmitter } from 'events';
import assert from '../util/assert';

import { Action, SocketEvents } from './socketConnection';

export class Submissions extends EventEmitter {
  constructor(connection) {
    super();
    this._connection = connection;
    this.isActivated = false;

    this.onSubmission = this.onSubmission.bind(this);
  }

  allowSubmissions() {
    this.isActivated = true;
  }

  disallowSubmissions() {
    this.isActivated = false;
  }

  /**
   * Listens to submission events on the socket.
   *
   * @returns
   */
  subscribe() {
    if (this.isActivated) {
      return;
    }

    this._connection.addSocketEventListener(SocketEvents.Submission, msg => {
      this.onSubmission(msg);
    });

    this.allowSubmissions();
  }

  unsubscribe() {
    if (!this.isActivated) {
      return;
    }

    this._connection.removeListener(this.onSubmission);
  }

  onSubmission(submission) {
    assert(submission, 'Insights.onEvents expected array of events');

    this.submissions.push(submission);

    this.emit('change');
  }
}