import { EventEmitter } from 'events';
import assert from '../../util/assert';
import Debug from 'debug';

import { RemoteActions } from '../../constants/Embed';
import { ErrorFilter } from './errorFilter';
import { ErrorClusters } from './errorClusters';
import { Submissions } from './submissions';
import { normalizeDate } from '../../util/dateUtils';
import { TestResultsOverview } from './testResultsOverview';
import { Action, RemoteEventTypes } from './remoteDispatcher';

import { Severity } from '../severity';
import { Action as MessageAction } from '../actions';
import { MessageWithAction } from '../messages';

const debug = Debug('webbox:insights');

/**
 * The Insights Module subscribes to all relevant events and stores the stat data
 */
export class Insights extends EventEmitter {
  constructor(remoteDispatcher, project) {
    super();
    this._project = project;
    this._connection = remoteDispatcher;
    this.errorFilter = new ErrorFilter();

    this.errors = [];
    this.events = [];
    this.dateMaps = this.getInitialDateClusterMaps();
    this.dateClusterResolution = 'day';
    this.dateClusterStart = null;
    this.dateClusterEnd = null;
    this.userMap = new Map();

    this.errorClusters = new ErrorClusters();

    this.eventStartDate = null; // display only events older than this date

    this.isSubscribed = false;

    // Submission model, submits its own change events, then we can hook this up components
    // that only need to update on submission changes
    this.submissions = new Submissions(this._connection);

    this.testResultsOverview = new TestResultsOverview(this._connection, this._project);
  }

  reset() {
    this.dateMaps = this.getInitialDateClusterMaps();
    this.errorClusters.reset();
    this.errors = [];
    this.events = [];
    this.userMap.clear();
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
      test: new Map(),
      rest: new Map()
    };
  }

  subscribeOnEvents() {
    if (this.isSubscribed) {
      return;
    }

    const embedId = this._project.getEmbedId();
    let subscribeAction = new Action(RemoteActions.SubscribeToEvents, this._project.getUserData(), {
      embedId: embedId
    }, res => {
      if (res.error) {
        console.error(res.error);
        this.isSubscribed = false;
      } else {

        this.isSubscribed = true;
        this._connection.addSocketEventListener(RemoteEventTypes.IdeEvent, msg => {
          if (!Array.isArray()) {
            msg = [msg];
          }
          this.onEvents(msg);
        });
      }
    });

    this._project.sendAction(subscribeAction, true);
  }

  addEventUserToMap(event) {
    let userId = event.userId;

    if (this.userMap.has(userId)) {
      this.userMap.set(userId, this.userMap.get(userId) + 1);
    } else {
      this.userMap.set(userId, 1);
    }
  }

  onEvents(events, reset=false) {
    assert(Array.isArray(events), 'Insights.onEvents expected array of events');

    debug('Received ide-events: ', events, reset);

    // Reset the date maps
    if (reset === true) {
      this.reset();
    }

    let hasNewErrors = false;

    for (let event of events) {
      // Skip events for other embeds
      if (event.embedId !== this._project.getEmbedId()) {
        continue;
      }

      this.addEventUserToMap(event);

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
   * @returns {undefined}
   */
  clusterEventOnDates(event) {
    assert(event != null, 'Received invalid event');

    let eventKey;
    let date = normalizeDate(event.timeStamp, this.dateClusterResolution);

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
   * @param {any} events - events to cluster
   * @returns {undefined}
   */
  clusterDates(events) {
    for (let event of events) {
      this.clusterEventOnDates(event);
    }
  }

  dateClustersToSingleSeries() {
    let series = [];
    let events = ['run', 'error', 'failure', 'test', 'rest'];
    let maps = [this.dateMaps.run, this.dateMaps.error, this.dateMaps.failure, this.dateMaps.test, this.dateMaps.rest];
    let values;

    for (let i = 0; i < events.length; i += 1) {
      values = [];

      for (let dataPoint of maps[i]) {
        values.push({
          x: new Date(dataPoint[0]).getTime(),
          [events[i]]: dataPoint[1]
        });
      }

      // Add a dummy date to force displaying of lines
      if (values.length === 1) {
        values.push({
          x: Date.now(),
          [events[i]]: 0
        });
      }

      series.push(...values);
    }

    return series;
  }

  /**
   * Returns the date clusters as series date to be consumed by the visualization. The series data
   * is an array based representation.
   *
   * @returns {Array} array of data series, that contain values
   */
  dateClustersToSeries() {
    let lineData = [];

    let names = ['Ausführungen', 'Fehler', 'Probleme', 'Testversuche', 'Sonstige'];
    let events = ['run', 'error', 'failure', 'test', 'rest'];
    let maps = [this.dateMaps.run, this.dateMaps.error, this.dateMaps.failure, this.dateMaps.test, this.dateMaps.rest];
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
          x: new Date(dataPoint[0]).getTime(),
          y: dataPoint[1]
        });
      }

      // Add a dummy date to force displaying of lines
      if (values.length === 1) {
        values.push({
          x: Date.now(),
          y: 0
        });
      }

      lineData.push({
        name: names[i],
        title: names[i],
        event: events[i],
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
   * Filter the errors
   * @param {any} subsetSize number of errors for the subset, if n = 'all', return every error
   * @param {any} [filters={}] filters
   * @returns {undefined}
   */
  filterErrors(subsetSize, filters={}) {
    if (this.errors.length > 600) {
      console.warn('High amount of errors to filter. Please contact admin.');
    }

    this.errorFilter.setFilters(filters);
    this.errorFilter.setSubsetSize(subsetSize);
    this.errorFilter.setErrors(this.errors);

    return this.errorFilter.filter();
  }

  /**
   * Get events from database
   * @returns {undefined}
   */
  getEvents() {
    let action = new Action(RemoteActions.GetEvents, this._project.getUserData(), {
      startDate: this.eventStartDate
    }, res => {
      if (res.error || res.events === undefined) {
        console.error('Failed request:', res.error, res);
      } else {
        this.onEvents(res.events, true);
      }
    });

    this._project.sendAction(action, true);
  }

  archiveEvents() {
    // Show Message and ask if this is really intended!

    let messageObj;
    const archiveAction = new MessageAction('archive.message.action', 'Archivieren', null, true, () => {
      const action = new Action(RemoteActions.ArchiveEventLogs, this._project.getUserData(), {
      }, res => {
        if (res.error) {
          console.error('Failed request:', res.error, res);
          this._project.showMessage(Severity.Error, `Archivierung fehlgeschlagen: ${res.error}`);
        } else {
          this.onEvents([], true);
          this._project.showMessage(Severity.Ignore, 'Die Events wurden erfolgreich archiviert.');
        }
      });

      this._project.sendAction(action, true);
      this._project.hideMessage(messageObj); // hide message
    });

    const cancelAction = new MessageAction('cancel.message.action', 'Abbrechen', null, true, () => {
      this._project.hideMessage(messageObj);
    });

    messageObj = new MessageWithAction('Wollen Sie die Events wirklich archivieren?',
      [archiveAction, cancelAction]);

    this._project.showMessage(Severity.Warning, messageObj);


  }
}