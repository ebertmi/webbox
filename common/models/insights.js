import { EventEmitter } from 'events';
import assert from '../util/assert';

import { Action } from './socketConnection';

/**
 * The Insights Module subscribes to all relevant events and stores the stat data
 */
export class Insights extends EventEmitter {
  constructor(socketConnection, project) {
    super();
    this._project = project;
    this._con = socketConnection;

    this.errors = [];
    this.events = [];

    this.sendInActivated = false; // is send-in active
    this.submissions = []; // send in submissions

    this.eventStartDate = null; // display only events older than this date
  }

  subscribe() {
    const embedId = this._project.data.id;
    this._con.addSocketEventListener(embedId);
  }

  // ToDo: Maybe we need to throttle the change emitting
  onEvents(events) {
    assert(Array.isArray(events), 'Insights.onEvents expected array of events');

    for (let event of events) {
      if (event && event.name === 'error') {
        this.errors.push(event);
      } else {
        this.events.push(event);
      }
    }

    this.emit('change');
  }

  getEvents() {
    let action = new Action('get-events', this._project.getUserData(), {
      startDate: this.eventStartDate
    }, res => {
      console.log(res);
    });

    this._project.sendAction(action, true);
  }

  getRecentErrors(n) {
    assert(n > 0, 'getRecentErrors n must be greater than 0');
    return this.errors.slice(-n);
  }
}