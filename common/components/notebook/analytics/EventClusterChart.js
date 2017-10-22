import React from 'react';
import PropTypes from 'prop-types';

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

import { normalDateFormatter, multiTimeFormat } from '../../../util/d3Util';

const LEGEND_IN_CHART_STYLES = {
  position: 'absolute',
  textAlign: 'left',
  right: 0,
  fontWeight: 'bold'
};

export default class EventClusterChart extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      hintValue: null
    };

    // Bindings
    this.formatHint = this.formatHint.bind(this);
    this._rememberHintValue = this._rememberHintValue.bind(this);
    this._forgetHintValue = this._forgetHintValue.bind(this);
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
    return (
      <div className="col-12">
        <div style={LEGEND_IN_CHART_STYLES}>
          <DiscreteColorLegend
            width={180}
            items={this.props.series}/>
        </div>
        <FlexibleXYPlot
          xType="time"
          yType="linear"
          height={300}>
          <HorizontalGridLines />
          <VerticalGridLines />
          <XAxis title="Zeit" tickFormat={this.formatXAxisTicks} />
          <YAxis title="Anzahl" tickFormat={this.formatYAxisTicks} />
          {this.props.series.map(series => {
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
    );
  }
}

EventClusterChart.propTypes = {
  series: PropTypes.array.isRequired
};