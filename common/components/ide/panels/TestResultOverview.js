import React from 'react';
import { LineChart, Line, CartesianGrid, YAxis, XAxis, Tooltip } from 'recharts/es6/index';
import { scaleTime } from 'd3-scale';
import { timeDay } from 'd3-time';
import moment from 'moment';

import { Time } from '../../Time';

const GERMAN_DATE_LOCALE = 'DE';

/**
 * Shows the Test Results
 *
 * @export
 * @class TestResultOverview
 * @extends {React.Component}
 */
export default class TestResultOverview extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      mean: 0,
      meanTime: null,
      history: [],
      uniqueUsers: 0,
      stdDeviation: 0
    };

    this.onChange = this.onChange.bind(this);
    this.getTicks = this.getTicks.bind(this);
  }

  componentWillMount() {
    this.props.testResults.on('change', this.onChange);
    this.onChange();

    // Initial fetch
    this.props.testResults.getTestResults();
    this.props.testResults.subscribe();
  }

  componentWillUnmount() {
    this.props.testResults.removeListener('change', this.onChange);
  }

  onChange() {
    this.setState({
      mean: this.props.testResults.mean.result,
      meanTime: this.props.testResults.mean.time,
      uniqueUsers: this.props.testResults.getTestResultSize(),
      stdDeviation: this.props.testResults.getStdDeviation(),
      history: this.props.testResults.getHistory().toJS()
    });
  }

  getTicks() {
    if (!this.state.history || !this.state.history.length ) {return [];}

    const domain = [new Date(this.state.history[0].time), new Date(this.state.history[this.state.history.length - 1].time)];
    const scale = scaleTime().domain(domain).range([0, 1]);
    const ticks = scale.ticks(timeDay, 1);

    return ticks.map(entry => +entry);
  }

  renderXAxisLabel(props) {
    const { x, y, width, height } = props;
    console.info(props);
    return (
      <text x={x + width / 2} y={y + 30}>Zeitpunkt</text>
    );
  }

  dateFormat(time) {
    let value = time;

    if (!moment.isMoment(value)) {
      value = moment(value, null, true);
    }

    value = value.locale(GERMAN_DATE_LOCALE);

    //return `${value.day()}.${value.month()}`;

    return value.format('DD.MM.YYYY');

    //return value.fromNow();
  }

  render() {
    // Avoid rendering if there are not results.
    if (this.props.testResults.getTestResultSize() === 0) {
      return null;
    }

    return (
      <div className="container-fluid">
        <div className="row">
          <div className="col-xs-12">
            <h4>Test-Ergebnisse</h4>
          </div>
          <div className="col-xs-12">
            <p><strong>Aktueller Durchschnitt:</strong> { this.state.mean }% <Time locale="de" relative={true} value={this.state.meanTime} invalidDateString="noch nie berechnet..." /> bei { this.state.uniqueUsers } Person(en)</p>
            <p><small>Standardabweichung: <span>{this.state.stdDeviation}</span></small></p>
          </div>
          <div className="col-xs-12">
            <LineChart width={600} height={150} data={this.state.history}>
              <CartesianGrid strokeDasharray="3 3"/>
              <Tooltip />
              <YAxis label="Durchschnitt" yAxisId="left" orientation="left" />
              <YAxis label="Personen" yAxisId="right" orientation="right" />
              <XAxis label={this.renderXAxisLabel} ticks={this.getTicks()} dataKey="time" tickFormatter={this.dateFormat}/>
              <Line type="monotone" yAxisId="left" name="Durchschnitt" isAnimationActive={false} dataKey="result" stroke="#8884d8" strokeWidth={2} />
              <Line type="monotone" yAxisId="right" name="Personen" dataKey="uniqueUsers" stroke="#82ca9d" strokeWidth={2} />
            </LineChart>
            <p className="text-muted">Alle Ergebnisse werden automatisch auf Intervalle eingeteilt und aggregiert. Die Intervalleinteilung ist logarithmisch, sucht sich jedoch automatisch die passenden Abstände aus.</p>
          </div>
        </div>
      </div>
    );
  }
}

TestResultOverview.propTypes = {
};

TestResultOverview.defaultProps = {
};