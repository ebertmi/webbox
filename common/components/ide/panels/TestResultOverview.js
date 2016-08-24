import React from 'react';
import { LineChart, Line, CartesianGrid, YAxis, Tooltip } from 'recharts/es6/index';


import { Time } from '../../Time';

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

  render() {
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
            <LineChart width={300} height={100} data={this.state.history}>
              <CartesianGrid strokeDasharray="3 3"/>
              <Tooltip />
              <YAxis yAxisId="left" orientation="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Line type="monotone" yAxisId="left" name="Durchschnitt" isAnimationActive={false} dataKey="result" stroke="#8884d8" strokeWidth={2} />
              <Line type="monotone" yAxisId="right" name="Personen" dataKey="uniqueUsers" stroke="#82ca9d" strokeWidth={2} />
            </LineChart>
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