import React from 'react';
//import rd3 from 'rd3';

import { scaleTime } from 'd3-scale';
import { timeDay } from 'd3-time';

import {LineChart, Line, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend} from 'recharts';

import d3 from 'd3';
import DatePicker from 'react-datepicker';

import { germanTimeFormat } from '../../../util/d3Util';
//const LineChart = rd3.LineChart;

export default class EventDatesClusterChart extends React.Component {
  constructor(props) {
    super(props);

    this.onDateClusterResolutionChange = this.onDateClusterResolutionChange.bind(this);
    this.onStartDateChange = this.onStartDateChange.bind(this);
    this.onEndDateChange = this.onEndDateChange.bind(this);
    this.onApply = this.onApply.bind(this);
    this.getTicks = this.getTicks.bind(this);
  }

  componentWillMount() {
    this.setState({
      dateClusterResolution: this.props.dateClusterResolution,
      dateClusterStart: this.props.dateClusterStart,
      dateClusterEnd: this.props.dateClusterEnd
    });
  }

  componentWillUnmount() {

  }

  onDateClusterResolutionChange(e) {
    const value = e.target.value;
    this.setState({ dateClusterResolution: value });
  }

  onStartDateChange(value) {
    this.setState({ dateClusterStart: value });
  }

  onEndDateChange(value) {
    if (value != null) {
      this.setState({ dateClusterEnd: value });
    }
  }

  /**
   * Callback to apply the current date cluster settings.
   *
   * @param {any} e
   */
  onApply(e) {
    e.preventDefault();

    if (this.props.onSettingsChange) {
      this.props.onSettingsChange(this.state);
    }
  }

  onReset(e) {
    e.preventDefault();

    this.setState({
      dateClusterStart: null,
      dateClusterEnd: null,
      dateClusterResolution: 'day'
    });
  }

  getXAxisTickInterval() {
    // This allows d3 to automatically pick a good scale
    return undefined;
  }

  getXAxisScale() {
    return d3.time.scale;
  }

  formatXAxisTicks(value) {
    let formattedTime = germanTimeFormat(new Date(value));
    return formattedTime;
  }

  getTicks() {
    if (!this.props.lineData || !this.props.lineData.length ) {
      return [];
    }

    let xValues = this.props.lineData;
    xValues = xValues.map(point => point.x);
    xValues = [].concat(...xValues).sort();

    const domain = [xValues[0], xValues[xValues.length - 1]];
    const scale = scaleTime().domain(domain).range([0, 1]);
    const ticks = scale.ticks();
    const tickVals = ticks.map(entry => +entry);

    return tickVals;
  }

  getData() {
    if (!this.props.lineData || !this.props.lineData.length ) {
      return [];
    } else {
      return this.props.lineData;
    }
  }

  tooltipFormatter(val) {
    console.info('tooltipFormatter:', val);

    return val;
  }

  render() {
    console.info(this.props.lineData);
    if (this.props.lineData.length === 0) {
      return null;
    }

    const data = this.getData();
    const ticks = this.getTicks();

    return (
      <div className="container-fluid">
        <div className="row">
          <div className="col-md-12 col-xs-12">
            <h4>Anzahl der Events</h4>
          </div>
          <div className="col-md-7 col-xs-12">
            <LineChart width={800} height={400}
                  margin={{top: 25, right: 35, left: 20, bottom: 5}} data={data}>
              <XAxis name="Zeitpunkt" label="Zeit" type="category" dataKey="x" ticks={ticks} tickFormatter={this.formatXAxisTicks} />
              <YAxis label="Anzahl" allowDecimals={false} />
              <CartesianGrid strokeDasharray="3 3"/>
              <Tooltip formatter={this.tooltipFormatter}/>
              <Legend />
              <Line connectNulls={true} strokeWidth={2} name="Ausführungen" type="monotone" dataKey="run" stroke="#8884d8"/>
              <Line connectNulls={true} strokeWidth={3} name="Fehler" type="monotone" dataKey="error" stroke="#e74c3c" strokeDasharray="3 4 5 2"/>
            </LineChart>
          </div>
          <div className="col-md-4 col-xs-12">
            <form>
              <div className="form-group">
                <label htmlFor="dateClusterResolution">Cluster-Einstellung</label>
                <select className="form-control" id="dateClusterResolution" value={this.state.dateClusterResolution} onChange={this.onDateClusterResolutionChange}>
                  <option value="day">Tagesweise</option>
                  <option value="hour">Stundenweise</option>
                  <option value="month">Monatsweise</option>
                </select>
                <p className="text-muted">Hiermit können Sie die das Intervall der Cluster bestimmen. Bei jeder Veränderung werden die Cluster neu berechnet.</p>
              </div>
              <div className="form-group">
                <label htmlFor="dateClusterStartDate">Anfang</label>
                <div style={{display: "block"}}><DatePicker style={{display: "block"}} className="form-control" selected={this.state.dateClusterStart} onChange={this.onStartDateChange} locale="de-DE" placeholderText="Kein Datum gewählt" /></div>
                <p className="text-muted">Anfangszeitpunkt ab dem die Daten geclustered werden sollen. Ältere Datenpunkte werden ignoriert.</p>
              </div>
              <div className="form-group">
                <label htmlFor="dateClusterEndDate">Ende</label>
                <div style={{display: "block"}}><DatePicker className="form-control" selected={this.state.dateClusterEnd} onChange={this.onEndDateChange} locale="de-DE" placeholderText="Kein Datum gewählt" /></div>
                <p className="text-muted">Endzeitpunkt bis zu dem die Daten geclustered werden sollen. Jüngere Datenpunkte werden ignoriert.</p>
              </div>
              <button className="btn btn-success btn-sm" onClick={this.onApply}>Anwenden</button>
              <button className="btn btn-warning btn-sm" title="Setzt alle Eigenschaften zurück.">Zurücksetzen</button>
            </form>
          </div>
        </div>
      </div>
    );
  }
}

EventDatesClusterChart.propTypes = {
  lineData: React.PropTypes.array,
  dateClusterResolution: React.PropTypes.string,
  dateClusterStart: React.PropTypes.object,
  dateClusterEnd: React.PropTypes.object,
  onSettingsChange: React.PropTypes.func
};

EventDatesClusterChart.defaultProps = {
  lineData: [],
  dateClusterResolution: 'day'
};