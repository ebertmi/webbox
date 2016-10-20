import React from 'react';

import throttle from 'lodash/throttle';
import EventDatesClusterChart from './EventDatesClusterChart';
import ErrorView from './ErrorView';
import ErrorClusterView from './ErrorClusterView';
import SubmissionView from './SubmissionView';
import TestResultOverview from './TestResultOverview';

export default class InsightsPanel extends React.Component {
  constructor(props) {
    super(props);

    this.onChange = this.onChange.bind(this);
    this.onDateClusterSettingsChange = throttle(this.onDateClusterSettingsChange.bind(this), 1000);

    // Initial state
    this.state = {
      dateClusters: [],
      events: this.props.item.events,
      errors: this.props.item.errors,
      testResults: this.props.item.testResults
    };
  }

  onChange() {
    // Rerender
    let dateClusters = this.props.item.dateClustersToSeries();

    this.setState({
      dateClusters: dateClusters,
      events: this.props.item.events,
      errors: this.props.item.errors,
      uniqueUsers: this.props.item.userMap.size
    });
  }

  componentWillMount() {
    this.props.item.getEvents();
    this.props.item.subscribeOnEvents();

    this.props.item.on('change', this.onChange);
  }

  componentWillUnmount() {
    this.props.item.removeListener('change', this.onChange);
  }

  /**
   * Normalize the date cluster settings from the chart component and set those on
   * the insights instance. This call may cause rerendering.
   *
   * @param {any} settings
   */
  onDateClusterSettingsChange(settings) {
    let start = settings.dateClusterStart;
    let end = settings.dateClusterEnd;
    let resolution = settings.dateClusterResolution;

    if (start && start._d) {
      start = start._d;
    }

    if (end && end._d) {
      end = end._d;
    }

    this.props.item.changeDatesClusterSettings(start, end, resolution);
  }

  render() {
    return (
      <div className="options-panel" onSubmit={e => e.preventDefault()}>
        <h3>Interaktionen</h3>
        <SubmissionView submissions={this.props.item.submissions} />
        <hr/>

        <h3>Daten <small className="text-muted">(von {this.state.uniqueUsers} Benutzern)</small></h3>
        <TestResultOverview testResults={this.props.item.testResultsOverview} />
        <EventDatesClusterChart onSettingsChange={this.onDateClusterSettingsChange} lineData={this.state.dateClusters} dateClusterResolution={this.props.item.dateClusterResolution} />
        <ErrorClusterView errorClusters={this.props.item.errorClusters}/>

        <ErrorView insights={this.props.item} />
      </div>
    );
  }
}
