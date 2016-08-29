import { EventEmitter } from 'events';
import Immutable from 'immutable';

import { toLogarithmicDateIntervals, clusterDataPointsByDateIntervals } from '../../util/dateUtils';
import { SocketEvents, Action as RemoteAction } from './socketConnection';

import Debug from 'debug';

// Create namespaced debug function | see https://github.com/visionmedia/debug
const debug = Debug('webbox:testResultsOverview');

const MAX_HISTORY_ITEMS = 20;

/**
 * Handles the receiving and storing of test results
 *
 * @export
 * @class TestResults
 * @extends {EventEmitter}
 */
export class TestResultsOverview extends EventEmitter {
  constructor(connection, project) {
    super();
    this._connection = connection;
    this.isActivated = false;

    this._project = project;

    this.onTestResult = this.onTestResult.bind(this);
    this.onTestResults = this.onTestResults.bind(this);

    this.testResults = [];

    this.reset();
  }

  reset() {
    this.testResults = [];
    this.squareSum = 0;
    this.sum = 0;
    this.meanHistory = new Immutable.List([]);
    this.mean = {
      result: 0,
      time: null,
      uniqueUsers: 0
    };

    //this.updateMean(0);
  }

  getHistory() {
    return this.meanHistory;
  }

  /**
   * Calculates the standard deviation
   *
   * @returns
   */
  getStdDeviation() {
    if (this.getTestResultSize() === 0) {
      return 0;
    }

    let stdD = Math.sqrt((this.squareSum / this.getTestResultSize()) - (Math.pow(this.mean.result, 2.0)));
    return isNaN(stdD) ? 0 : stdD;
  }

  /**
   * Get the current size of test results
   *
   * @returns
   */
  getTestResultSize() {
    return this.testResults.length;
  }

  setTestResults(testResults) {
    this.testResults = testResults;
    this.emit('change');
  }

  allowTestResults() {
    this.isActivated = true;
  }

  disallowTestResults() {
    this.isActivated = false;
  }

  /**
   * @returns {Boolean} submissions are accepted or not
   */
  isActive() {
    return this.isActivated;
  }

  /**
   * Toggles the acceptance of submissions.
   */
  toggle() {
    if  (this.isActive()) {
      this.unsubscribe();
    } else {
      this.subscribe();
    }

    this.emit('change');
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

    this._connection.addSocketEventListener(SocketEvents.TestResult, this.onTestResult);

    this.allowTestResults();
  }

  /**
   * Unsubscribe to test result events
   *
   * @returns
   */
  unsubscribe() {
    if (!this.isActivated) {
      return;
    }

    this._connection.removeSocketEventListener(SocketEvents.TestResult, this.onSubmission);

    this.disallowTestResults();
  }

  /**
   * Event handler for new test results
   *
   * @param {any} event
   */
  onTestResult(result) {
    let oldResultIndex = this.testResults.findIndex(item => item.userId === result.userId);
    if (oldResultIndex >= 0) {
      let oldResult = this.testResults.splice(oldResultIndex, 1)[0];

      // Update sum & mean
      this.sum -= oldResult.scorePercentage;

      // Now remove the oldResult.scorePercentage from our calculations
      this.squareSum -= Math.pow(oldResult.scorePercentage, 2);
    }

    // Add the new result
    this.testResults.push(result);

    // Update the sum and the variance sum
    this.squareSum += Math.pow(result.scorePercentage, 2);
    this.sum += result.scorePercentage;

    this.calculateMean();

    this.emit('change');
  }

  /**
   * Callback for the initial value retrieval
   *
   * @param {any} results
   */
  onTestResults(results) {
    // Replace the testResults
    // Do some reseting
    this.reset();

    this.testResults = results;
    this.emit('change');

    // Skip all of the computing, when we have no entries
    if (this.testResults.length === 0) {
      return;
    }

    let sum = this.testResults.map(item => item.scorePercentage).reduce((previous, current) => {
      return previous + current;
    }, 0);

    this.sum = sum;

    this.calculateMean();
    this.calculateSquareSum();

    let timePoints = this.testResults.map(tr => new Date(tr.timeStamp)).sort();

    let intervals = toLogarithmicDateIntervals(timePoints);
    debug('DateIntervals:', intervals, intervals.length);

    let clusters = clusterDataPointsByDateIntervals(this.testResults, dp=>new Date(dp.timeStamp), intervals);
    debug('Clustered data points using the date intervals:', clusters);

    // Now aggregate the single cluster values
    let aggregatedClusters = clusters.map((cluster, index) => {
      if (cluster.length === 0) {
        return null;
      }

      let meanEntry = {
        result: 0,
        uniqueUsers: cluster.length,
        time: intervals[index].getTime()
      };

      for (let entry of cluster) {
        meanEntry.result += entry.scorePercentage;
      }

      meanEntry.result /= meanEntry.uniqueUsers;

      return meanEntry;
    }).filter(cluster => cluster != null);


    debug('Aggregated clusters: ', aggregatedClusters);

    this.meanHistory = this.meanHistory.unshift(...aggregatedClusters);
    this.emit('change');
  }

  /**
   * Calculates the square sum over all elements of testResults
   */
  calculateSquareSum() {
    this.squareSum = this.testResults.map(i => {
      return Math.pow(i.scorePercentage, 2);
    }).reduce((prev, current) => prev + current, 0);

    this.emit('change');
  }

  calculateMean() {
    let mean = this.getTestResultSize() === 0 ? 0 : this.sum / this.getTestResultSize();

    this.updateMean(mean);
  }

  /**
   * Update the mean with the given value and stores the previous one on our history stack
   *
   * @param {any} mean
   */
  updateMean(mean) {
    if (this.mean && this.mean.time != null) {
      this.meanHistory = this.meanHistory.push(Immutable.fromJS(this.mean));
    }

    this.mean = {
      result: mean,
      uniqueUsers: this.getTestResultSize(),
      time: Date.now()
    };

    this.emit('change');
  }

  /**
   * Get the current list of test Results
   *
   * @returns {Array} of {TestResult} objects
   */
  get() {
    return this.testResults;
  }

  /**
   * Get the test results for this embed
   */
  getTestResults() {
    // Skip retrieval if we are already subscribed
    if (this.isActivated === true) {
      return;
    }

    let action = new RemoteAction('get-testresults', this._project.getUserData(), {
      startDate: this.eventStartDate
    }, res => {
      if (res.error) {
        console.error(res.error);
      } else {
        debug('Received initial test results from server: ', res.testResults);
        this.onTestResults(res.testResults);
      }
    });

    this._project.sendAction(action, true);
  }
}