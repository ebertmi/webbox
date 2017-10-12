import React from 'react';

import throttle from 'lodash/throttle';
import SubmissionView from './SubmissionView';

export default class InsightsPanel extends React.Component {
  constructor(props) {
    super(props);

    this.onChange = this.onChange.bind(this);
    this.onDateClusterSettingsChange = throttle(this.onDateClusterSettingsChange.bind(this), 1000);
    this.onArchiveEvents = this.onArchiveEvents.bind(this);

    // Initial state
    this.state = {
      dateClusters: [],
      events: this.props.item.events,
      errors: this.props.item.errors,
      testResults: this.props.item.testResults,
      components: null
    };
  }

  componentWillMount() {
    this.props.item.getEvents();
    this.props.item.subscribeOnEvents();


    require.ensure(['./EventDatesClusterChart', './ErrorView', './ErrorClusterView', './TestResultOverview'], require => {
      const EventDatesClusterChart = require('./EventDatesClusterChart');
      const ErrorView = require('./ErrorView');
      const ErrorClusterView = require('./ErrorClusterView');
      const TestResultOverview = require('./TestResultOverview');

      this.setState({
        components: {
          EventDatesClusterChart: EventDatesClusterChart.default,
          ErrorView: ErrorView.default,
          ErrorClusterView: ErrorClusterView.default,
          TestResultOverview: TestResultOverview.default,
        }
      });
    });
  }

  componentDidMount() {
    this.props.item.on('change', this.onChange);
  }

  componentWillUnmount() {
    this.props.item.removeListener('change', this.onChange);
  }

  onChange() {
    // Rerender
    const dateClusters = this.props.item.dateClustersToSeries();

    this.setState({
      dateClusters: dateClusters,
      events: this.props.item.events,
      errors: this.props.item.errors,
      uniqueUsers: this.props.item.userMap.size
    });
  }

  onArchiveEvents () {
    this.props.item.archiveEvents();
  }

  /**
   * Normalize the date cluster settings from the chart component and set those on
   * the insights instance. This call may cause rerendering.
   *
   * @param {any} settings - cluster settings, e.g. start date, end date and resolution
   * @returns {undefined}
   */
  onDateClusterSettingsChange(settings) {
    let start = settings.dateClusterStart;
    let end = settings.dateClusterEnd;
    const resolution = settings.dateClusterResolution;

    if (start && start._d) {
      start = start._d;
    }

    if (end && end._d) {
      end = end._d;
    }

    this.props.item.changeDatesClusterSettings(start, end, resolution);
  }

  renderTestResults() {
    if (this.state.components != null && this.state.components.TestResultOverview != null) {
      return <this.state.components.TestResultOverview testResults={this.props.item.testResultsOverview} />;
    }
  }

  renderDatesCluster() {
    if (this.state.components != null && this.state.components.EventDatesClusterChart != null) {
      return <this.state.components.EventDatesClusterChart onSettingsChange={this.onDateClusterSettingsChange} lineData={this.state.dateClusters} dateClusterResolution={this.props.item.dateClusterResolution} />;
    }
  }

  renderErrorClusters() {
    if (this.state.components != null && this.state.components.ErrorClusterView != null) {
      return <this.state.components.ErrorClusterView errorClusters={this.props.item.errorClusters} />;
    }
  }

  renderErrorView() {
    if (this.state.components != null && this.state.components.ErrorView != null) {
      return <this.state.components.ErrorView insights={this.props.item} />;
    }
  }

  render() {
    return (
      <div className="options-panel" onSubmit={e => e.preventDefault()}>
        <h3>Interaktionen</h3>
        <SubmissionView submissions={this.props.item.submissions} />
        <hr/>
        <div className="row">
          <div className="col-12">
            <small id="passwordHelpInline" className="text-muted float-left mr-3">
              Archiviert alle Events für dieses Beispiel. Diese werden nicht gelöscht, jedoch auch nicht mehr für die Auswertungen berücksichtigt. Diese Aktion ist nicht rückgängig zu machen!
            </small>
            <button type="button" className="btn btn-sm btn-danger float-right" onClick={this.onArchiveEvents}>Alle Events archivieren</button>
          </div>
        </div>

        <h3>Daten <small className="text-muted">(von {this.state.uniqueUsers} Benutzern)</small></h3>
        { this.renderTestResults() }
        { this.renderDatesCluster() }
        { this.renderErrorClusters() }
        { this.renderErrorView() }
      </div>
    );
  }
}
