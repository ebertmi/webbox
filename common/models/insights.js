import { EventEmitter } from 'events';
import assert from '../util/assert';

import { Submissions } from './submissions';
import { Action, SocketEvents } from './socketConnection';

class ErrorClusters extends EventEmitter {
  constructor() {
    super();

    this._errorClusters = new Map();
  }

  clusterErrorOnType(error){
    assert(error != null, 'clusterErrorOnType failed due to invalid error');

    let key = error.type || 'unknown';

    if (!this._errorClusters.has(key)) {
      this._errorClusters.set(key, 0);
    }

    // Increment cluster by one
    this._errorClusters.set(key, this._errorClusters.get(key) + 1);
  }

  cluster(events) {
    let hasChanged = false;

    for (let event of events) {
      if (event && event.name === 'error') {
        this.clusterErrorOnType(event);
        hasChanged = true;
      }
    }

    if (hasChanged) {
      this.emit('change');
    }
  }

  reset() {
    this._errorCluster = new Map();

    this.emit('change');
  }

  getClusters() {
    return this._errorClusters;
  }

  toSeries(name="Fehlertypen") {
    let barData = [];

    let series = {
      name: name,
      values: []
    };

    for (let cluster of this._errorClusters) {
      series.values.push({
        x: cluster[0],
        y: cluster[1]
      });
    }

    barData.push(series);

    return barData;
  }
}

/**
 * The Insights Module subscribes to all relevant events and stores the stat data
 */
export class Insights extends EventEmitter {
  constructor(socketConnection, project) {
    super();
    this._project = project;
    this._connection = socketConnection;

    this.errors = [];
    this.events = [];
    this.dateMaps = this.getInitialDateClusterMaps();
    this.dateClusterResolution = 'day';
    this.dateClusterStart = null;
    this.dateClusterEnd = null;

    this.errorClusters = new ErrorClusters();

    this.eventStartDate = null; // display only events older than this date

    this.isSubscribed = false;

    // Submission model, submits its own change events, then we can hook this up components
    // that only need to update on submission changes
    this.submissions = new Submissions(this._connection);
  }

  /**
   * Create an object holding Maps for mapping events to dates
   *
   * @returns
   */
  getInitialDateClusterMaps() {
    return {
      run: new Map(),
      failure: new Map(),
      error: new Map(),
      rest: new Map()
    };
  }



  subscribeOnEvents() {
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

        this.isSubscribed = true;
        this._connection.addSocketEventListener(SocketEvents.IdeEvent, msg => {
          if (!Array.isArray()) {
            msg = [msg];
          }
          this.onEvents(msg);
        });
      }
    });

    this._project.sendAction(subscribeAction, true);
  }

  onEvents(events) {
    assert(Array.isArray(events), 'Insights.onEvents expected array of events');

    let hasNewErrors = false;

    for (let event of events) {
      if (event && event.name === 'error') {
        this.errors.push(event);
        hasNewErrors = true;
      } else {
        this.events.push(event);
      }
    }

    // Update the clusters
    if (hasNewErrors) {
      this.errorClusters.cluster(events);
      this.emit('newErrors');
    }

    this.clusterDates(events);

    this.emit('change');
  }

  changeDatesClusterSettings(startDate, endDate, resolution) {
    let isChange = startDate !== this.dateClusterStart || resolution !== this.dateClusterResolution || endDate !== this.dateClusterEnd;

    if (isChange) {
      this.dateClusterStart = startDate;
      this.dateClusterResolution = resolution;
      this.dateClusterEnd = endDate;

      // Recluster
      this.dateMaps = this.getInitialDateClusterMaps();
      this.clusterDates(this.events.concat(this.errors));
      this.emit('change');
    }
  }

  /**
   * Clusters a event to the dates maps. The clustering is based on the event name and
   * the current cluster interval (day, hour, month) and date bounds.
   *
   * @param {EventLog} event Event to cluster
   * @returns
   */
  clusterEventOnDates(event) {
    assert(event != null, 'Received invalid event');

    let eventKey;
    let date = this.normalizeDate(event.timeStamp);

    // Check if date is outside the date bounds
    if (this.dateClusterStart && date < this.dateClusterStart) {
      return;
    } else if (this.dateClusterEnd && date > this.dateClusterEnd) {
      return;
    }

    let dateStr = date.toISOString();

    eventKey = this.dateMaps[event.name] != null ? event.name : 'rest';

    // Create index, if not present
    if (!this.dateMaps[eventKey].has(dateStr)) {
      this.dateMaps[eventKey].set(dateStr, 0);
    }

    // Increment count of the event on date cluster
    this.dateMaps[eventKey].set(dateStr, this.dateMaps[eventKey].get(dateStr) + 1);
  }



  /**
   * Clusters all given events to the current date clusters.
   *
   * @param {any} events
   */
  clusterDates(events) {
    for (let event of events) {
      this.clusterEventOnDates(event);
    }
  }

  /**
   * Returns the date clusters as series date to be consumed by the visualization. The series data
   * is an array based representation.
   *
   * @returns {Array} array of data series, that contain values
   */
  dateClustersToSeries() {
    let lineData = [];

    let names = ['Ausführungen', 'Fehler', 'Probleme', 'Sonstige'];
    let maps = [this.dateMaps.run, this.dateMaps.error, this.dateMaps.failure, this.dateMaps.rest];
    let lineStyles = [{
      strokeWidth: 3,
      strokeDashArray: "5,5"
    }, {
      strokeWidth: 2,
      stroke: '#e74c3c'
    }];

    let values;
    for (let i = 0; i < names.length; i += 1) {
      values = [];

      for (let dataPoint of maps[i]) {
        values.push({
          x: new Date(dataPoint[0]),
          y: dataPoint[1]
        });
      }

      // Add a dummy date to force displaying of lines
      if (values.length === 1) {
        values.push({
          x: new Date(),
          y: 0
        });
      }

      lineData.push({
        name: names[i],
        values: values
      });

      // Apply line styles if available
      if (lineStyles[i] != null) {
        lineData[i] = Object.assign({}, lineData[i], lineStyles[i]);
      }
    }

    return lineData;
  }

  /**
   * Normalize a date depending on the current "dateClusterResolution"
   * @param {any} str
   * @returns
  */
  normalizeDate(str) {
    let dt = new Date(str);

    switch (this.dateClusterResolution) {
      case 'month':
        return new Date(
          dt.getFullYear(),
          dt.getMonth()
        );
      case 'hour':
        return new Date(
            dt.getFullYear(),
            dt.getMonth(),
            dt.getDate(),
            dt.getHours()
        );
      case 'day':
      default:
        return new Date(
            dt.getFullYear(),
            dt.getMonth(),
            dt.getDate()
        );
    }
  }

  // ToDo: Maybe improve the filtering by maintaing the last result and see if a
  // new event just needs to be filtered and appended to the last result
  // This would prevent us from iterating everytime!
  filterErrors(n, filter={}) {
    if (this.errors.length > 600) {
      console.warn('High amount of errors to filter. Please contact admin.');
    }

    console.info('filterErrors', n, filter);

    return new Promise((resolve, reject) => {
      let subset = this.errors;

      // ToDo: make this more generic
      // Maybe we should iterate over all filter elements and check each
      if (filter.isActive === true) {
        subset = subset.filter(error => {
          if (filter.filterType != null && filter.filterType !== '' && error.type.toLowerCase() !== filter.filterType.toLowerCase()) {
            return false;
          }

          if (filter.filterUsername != null && filter.filterUsername !== '' && error.username.toLowerCase() !== filter.filterUsername.toLowerCase()) {
            return false;
          }

          return true;
        });
      }

      if (n !== 'all') {
        resolve(subset.slice(-n).reverse());
      }

      resolve(subset.reverse());
    });
  }

  getEvents() {
    let action = new Action('get-events', this._project.getUserData(), {
      startDate: this.eventStartDate
    }, res => {
      if (res.error) {
        console.error(res.error);
      } else {
        this.errorClusters.reset();
        this.onEvents(res.events);
      }
    });

    this._project.sendAction(action, true);
  }
}