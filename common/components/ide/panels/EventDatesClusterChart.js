import React from 'react';
import rd3 from 'rd3';
import d3 from 'd3';
import DatePicker from 'react-datepicker';

import { germanTimeFormat } from '../../../util/d3Util';
const LineChart = rd3.LineChart;

export default class EventDatesClusterChart extends React.Component {
  constructor(props) {
    super(props);

    this.onDateClusterResolutionChange = this.onDateClusterResolutionChange.bind(this);
    this.onStartDateChange = this.onStartDateChange.bind(this);
    this.onEndDateChange = this.onEndDateChange.bind(this);
    this.onApply = this.onApply.bind(this);
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

  render() {
    return (
      <div className="container-fluid">
        <div className="row">
          <div className="col-md-12 col-xs-12">
            <h4>Anzahl der Events</h4>
          </div>
          <div className="col-md-7 col-xs-12">
            <LineChart
                legend={true}
                data={this.props.lineData}
                width='100%'
                height={400}
                viewBoxObject={{
                  x: 0,
                  y: 0,
                  width: 800,
                  height: 400
                }}
                circleRadius={4}
                yAxisLabel="Anzahl"
                yAccessor={d => d.y}
                xAxisTickInterval={this.getXAxisTickInterval()}
                xAxisFormatter={germanTimeFormat}
                xAccessor={d => {
                  return d.x;
                }}
                xScale={this.getXAxisScale()}
                xAxisLabel="Datum (Zeitstrahl)"
                domain={{x:d3.extent(this.props.lineData, d => d.x), y: [0,]}}
                gridHorizontal={true}
                sideOffset={200}
                colors={d3.scale.category10()}
              />
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
                <div styles={{display: "block"}}><DatePicker styles={{display: "block"}} className="form-control" selected={this.state.dateClusterStart} onChange={this.onStartDateChange} locale="de-DE" placeholderText="Kein Datum gewählt" /></div>
                <p className="text-muted">Anfangszeitpunkt ab dem die Daten geclustered werden sollen. Ältere Datenpunkte werden ignoriert.</p>
              </div>
              <div className="form-group">
                <label htmlFor="dateClusterEndDate">Ende</label>
                <div styles={{display: "block"}}><DatePicker className="form-control" selected={this.state.dateClusterEnd} onChange={this.onEndDateChange} locale="de-DE" placeholderText="Kein Datum gewählt" /></div>
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