import React from 'react';

import {Button, Input} from '../../bootstrap';
import throttle from 'lodash/throttle';
import EventDatesClusterChart from './EventDatesClusterChart';
import ErrorView from './ErrorView';
import rd3 from 'rd3';
const BarChart = rd3.BarChart;

export default class InsightsPanel extends React.Component {
  constructor(props) {
    super(props);

    this.onChange = this.onChange.bind(this);
    this.onDateClusterSettingsChange = throttle(this.onDateClusterSettingsChange.bind(this), 1000);
  }

  onChange() {
    // Rerender
    let dateClusters = this.props.item.dateClustersToSeries();
    let errorClusters = this.props.item.errorClustersToSeries();

    this.setState({
      dateClusters: dateClusters,
      errorClusters: errorClusters,
      events: this.props.item.events,
      errors: this.props.item.errors
    });
  }

  componentWillMount() {
    this.props.item.getEvents();
    this.props.item.subscribe();

    this.props.item.on('change', this.onChange);

    this.setState({
      dateClusters: [],
      errorClusters: [],
      events: this.props.item.events,
      errors: this.props.item.errors
    });
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
        <hr/>

        <h3>Daten</h3>
        <div className="container-fluid">
          <EventDatesClusterChart onSettingsChange={this.onDateClusterSettingsChange} lineData={this.state.dateClusters} dateClusterResolution={this.props.item.dateClusterResolution} />
        </div>
        <div className="container-fluid">
          <div className="row">
            <div className="col-xs-12">
              <BarChart
                data={this.state.errorClusters}
                valuesAccessor={d => {
                  // This fixes the rendering with now series data!
                  return d != null ? d.values : [];
                }}
                width={800}
                height={300}
                title="Fehlertypen"
                xAxisLabel="Typ"
                yAxisLabel="Anzahl"
              />
            </div>
          </div>
        </div>
        <div className="container-fluid">
          <div className="row">
            <div className="col-xs-12">
              <ErrorView errors={this.state.errors} />
            </div>
          </div>
        </div>
      </div>
    );
  }
}
