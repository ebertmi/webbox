import React from 'react';
import {
  XYPlot,
  XAxis,
  YAxis,
  DiscreteColorLegend,
  HorizontalGridLines,
  Hint,
  VerticalGridLines,
  makeWidthFlexible,
  LineMarkSeries} from 'react-vis';

const FlexibleXYPlot = makeWidthFlexible(XYPlot);

import DatePicker from 'react-datepicker';
import { normalDateFormatter, multiTimeFormat } from '../../../util/d3Util';

const LEGEND_IN_CHART_STYLES = {
  position: 'absolute',
  textAlign: 'left',
  left: '2rem',
  bottom: '1rem',
  fontWeight: 'bold'
};

export default class EventDatesClusterChart extends React.Component {
  constructor(props) {
    super(props);

    this.onDateClusterResolutionChange = this.onDateClusterResolutionChange.bind(this);
    this.onStartDateChange = this.onStartDateChange.bind(this);
    this.onEndDateChange = this.onEndDateChange.bind(this);
    this.onApply = this.onApply.bind(this);
    this.formatHint = this.formatHint.bind(this);
    this._rememberHintValue = this._rememberHintValue.bind(this);
    this._forgetHintValue = this._forgetHintValue.bind(this);
  }

  componentWillMount() {
    this.setState({
      dateClusterResolution: this.props.dateClusterResolution,
      dateClusterStart: this.props.dateClusterStart,
      dateClusterEnd: this.props.dateClusterEnd,
      hintValue: null
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

  _rememberHintValue(val) {
    this.setState({ hintValue: val });
  }

  _forgetHintValue() {
    this.setState({
      hintValue: null
    });
  }

  formatHint(value) {
    let formattedValue = [];
    formattedValue.push({
      title: 'Zeitpunkt',
      value: normalDateFormatter(new Date(value.x))
    });
    formattedValue.push({
      title: 'Anzahl',
      value: value.y
    });

    return formattedValue;
  }

  formatXAxisTicks(date) {
    return multiTimeFormat(new Date(date));
  }

  formatYAxisTicks(data) {
    if (data % 1 === 0) {
      return data;
    } else {
      return "";
    }
  }

  render() {
    if (this.props.lineData.length === 0) {
      return null;
    }

    return (
      <div className="container-fluid">
        <div className="row">
          <div className="col-md-12 col-xs-12">
            <h4>Anzahl der Events</h4>
          </div>
          <div className="col-md-7 col-xs-12">
          <div style={LEGEND_IN_CHART_STYLES}>
            <DiscreteColorLegend
              orientation="horizontal"

              items={this.props.lineData}/>
          </div>
          <FlexibleXYPlot
            xType="time"
            yType="linear"
            height={300}>
            <HorizontalGridLines />
            <VerticalGridLines />
            <XAxis title="Zeit" tickFormat={this.formatXAxisTicks} />
            <YAxis title="Anzahl" tickFormat={this.formatYAxisTicks} />
            {this.props.lineData.map(series => {
              return <LineMarkSeries
                key={series.title}
                data={series.values}
                onValueMouseOver={this._rememberHintValue}
                onValueMouseOut={this._forgetHintValue} />;
            })}
            {this.state.hintValue ?
              <Hint value={this.state.hintValue} format={this.formatHint}/> :
              null
            }
          </FlexibleXYPlot>
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