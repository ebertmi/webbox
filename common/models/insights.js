import { EventEmitter } from 'events';
import assert from '../util/assert';

import { Action, SocketEvents } from './socketConnection';
import d3 from 'd3';

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
    this.dateMaps = this.getInitialMaps();

    this.sendInActivated = false; // is send-in active
    this.submissions = []; // send in submissions

    this.eventStartDate = null; // display only events older than this date

    this.isSubscribed = false;
  }


  /**
   * Create an object holding Maps for mapping events to dates
   *
   * @returns
   */
  getInitialMaps() {
    return {
      run: new Map(),
      failure: new Map(),
      error: new Map(),
      rest: new Map()
    };
  }

  subscribe() {
    if (this.isSubscribed) {
      return;
    }

    const embedId = this._project.data.id;
    let subscribeAction = new Action('subscribe', this._project.getUserData(), {
      embedId: embedId
    }, res => {
      if (res.error) {
        console.error(res.error);
        this.isSubscribed = false;
      } else {
        console.info('subscribed');
        this.isSubscribed = true;
        this._con.addSocketEventListener(SocketEvents.IdeEvent, msg => {
          if (!Array.isArray()) {
            msg = [msg];
          }
          this.onEvents(msg);
        });
      }
    });

    this._project.sendAction(subscribeAction, true);
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

    this.clusterDates(events);

    this.emit('change');
  }

  clusterDates(events) {
    for (let event of events) {
      let eventKey;
      let date = this.normalizeDate(event.timeStamp);
      let dateStr = date.toISOString();

      eventKey = this.dateMaps[event.name] ? event.name : 'rest';

      // Create index, if not present
      if (!this.dateMaps[eventKey].has(dateStr)) {
        this.dateMaps[eventKey].set(dateStr, 0);
      }

      // increment
      this.dateMaps[eventKey].set(dateStr, this.dateMaps[eventKey].get(dateStr) + 1);
    }
  }

  dateClustersToSeries() {
    let lineData = [];

    let names = ['Ausführungen', 'Fehler', 'Probleme', 'Sonstige'];
    let maps = [this.dateMaps.run, this.dateMaps.error, this.dateMaps.failure, this.dateMaps.rest];

    let values;
    for (let i = 0; i < names.length; i += 1) {
      values = [];

      for (let dataPoint of maps[i]) {
        values.push({
          x: new Date(dataPoint[0]),
          y: dataPoint[1]
        });
      }

      lineData.push({
        name: names[i],
        values: values
      });
    }

    console.info(lineData);
    return lineData;
  }

  /**
   * Normalize a date to return only day, month and year
   * @param {any} str
   * @returns
  */
  normalizeDate(str) {
    let dt = new Date(str);

    return new Date(
        dt.getFullYear(),
        dt.getMonth(),
        dt.getDate()
    );
  }

  getEvents() {
    let action = new Action('get-events', this._project.getUserData(), {
      startDate: this.eventStartDate
    }, res => {
      if (res.error) {
        console.error(res.error);
      } else {
        this.onEvents(res.events);
      }
    });

    this._project.sendAction(action, true);
  }

  getRecentErrors(n) {
    assert(n > 0, 'getRecentErrors n must be greater than 0');
    return this.errors.slice(-n);
  }
}