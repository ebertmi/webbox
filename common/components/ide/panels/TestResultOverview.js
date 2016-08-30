import React from 'react';
import { normalDateFormatter, multiTimeFormat } from '../../../util/d3Util';

import {
  XYPlot,
  XAxis,
  YAxis,
  HorizontalGridLines,
  Hint,
  VerticalGridLines,
  LineMarkSeries} from 'react-vis';

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
      stdDeviation: 0,
      hintValue: null,
      hintValueObj: null
    };

    this.onChange = this.onChange.bind(this);
    this.formatHint = this.formatHint.bind(this);
    this._rememberHintValue = this._rememberHintValue.bind(this);
    this._forgetHintValue = this._forgetHintValue.bind(this);
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

  renderXAxisLabel(props) {
    const { x, y, width } = props;
    return (
      <text x={x + width / 2} y={y + 40}>Zeitpunkt</text>
    );
  }

  formatHint(val) {
    let meanObj = this.state.history.find(item => item.time === val.x);

    return [{
      title: 'Zeitpunkt',
      value: normalDateFormatter(new Date(val.x))
    }, {
      title: 'Durchschnitt',
      value: meanObj.result
    }, {
      title: 'Personen',
      value: meanObj.uniqueUsers
    }];
  }

  formatXAxisTicks(date) {
    return multiTimeFormat(new Date(date));
  }

  _rememberHintValue(val) {
    this.setState({ hintValue: val });
  }

  _forgetHintValue() {
    this.setState({
      hintValue: null
    });
  }

  render() {
    // Avoid rendering if there are not results.
    if (this.props.testResults.getTestResultSize() === 0) {
      return null;
    }

    const uniqueUsersData = [];
    const meanData = [];

    this.state.history.map(entry => {
      meanData.push({
        x: entry.time,
        y: entry.result
      });
      uniqueUsersData.push({
        x: entry.time,
        y: entry.uniqueUsers
      });
    });

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
            <XYPlot
              xType="time"
              width={600}
              height={150}
              margin={{left: 40, right: 40, top: 20, bottom: 40}} >
              <HorizontalGridLines />
              <VerticalGridLines />
              <XAxis title="Zeit" tickFormat={this.formatXAxisTicks} />
              <YAxis title="Durchschnitt" />
              <LineMarkSeries data={meanData} onValueMouseOver={this._rememberHintValue}
              onValueMouseOut={this._forgetHintValue} />
              <LineMarkSeries data={uniqueUsersData} onValueMouseOver={this._rememberHintValue}
              onValueMouseOut={this._forgetHintValue}/>
              {this.state.hintValue ?
                <Hint value={this.state.hintValue} format={this.formatHint}/> :
                null
              }
            </XYPlot>
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