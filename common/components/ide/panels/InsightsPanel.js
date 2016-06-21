import React from 'react';

import {Button, Input} from '../../bootstrap';
import rd3 from 'rd3';
import d3 from 'd3';
import { germanTimeFormat } from '../../../util/d3Util';
const LineChart = rd3.LineChart;

export default class InsightsPanel extends React.Component {
  constructor(props) {
    super(props);

    this.onChange = this.onChange.bind(this);
  }

  onChange() {
    // Rerender
    let lineData = this.props.item.dateClustersToSeries();

    this.setState({
      lineData: lineData,
      events: this.props.item.events,
      errors: this.props.item.errors
    });
  }

  componentWillMount() {
    this.props.item.getEvents();
    this.props.item.subscribe();

    this.props.item.on('change', this.onChange);

    this.setState({
      lineData: [],
      events: [],
      errors: []
    });
  }

  componentWillUnmount() {
  }

  render() {
    return (
      <div className="options-panel" onSubmit={e => e.preventDefault()}>
        <h3>Interaktionen</h3>
        <hr/>

        <h3>Daten</h3>
        <LineChart
            legend={true}
            data={this.state.lineData}
            width='100%'
            height={400}
            viewBoxObject={{
              x: 0,
              y: 0,
              width: 800,
              height: 400
            }}
            circleRadius={4}
            title="Anzahl der Events"
            yAxisLabel="Anzahl"
            yAccessor={d => d.y}
            xAxisTickInterval={{unit: 'day', interval: 1}}
            xAxisFormatter={germanTimeFormat}
            xAccessor={d => d.x}
            xScale={d3.time.scale}
            xAxisLabel="Datum (Zeitstrahl)"
            domain={{x:d3.extent(this.state.lineData, d => d.x), y: [0,]}}
            gridHorizontal={true}
            sideOffset={200}
            tooltip={false}
          />
      </div>
    );
  }
}
