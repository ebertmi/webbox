import React from 'react';
import Debug from 'debug';

import {
  XYPlot,
  XAxis,
  YAxis,
  VerticalGridLines,
  HorizontalGridLines,
  VerticalBarSeries} from 'react-vis';

const debug = Debug('webbox:ErrorClusterView');

/**
 * Displays a chart of the error clusters with the error name and the number of
 * occurences.
 *
 * @export
 * @class ErrorClusterView
 * @extends {React.Component}
 */
export default class ErrorClusterView extends React.Component {
  constructor(props) {
    super(props);

    this.onChange = this.onChange.bind(this);

    this.state = {
      clusters: []
    };
  }

  componentWillMount() {
    this.props.errorClusters.on('change', this.onChange);
    this.onChange();
  }

  componentWillUnmount() {
    this.props.errorClusters.removeListener('change', this.onChange);
  }

  onChange() {
    let data = this.props.errorClusters.toSeries();
    this.setState({
      data: data
    });
  }

  formatYAxisTicks(data) {
    if (data % 1 === 0) {
      return data;
    } else {
      return "";
    }
  }

  render() {
    debug('render with state:', this.state);
    return (
        <div className="container-fluid">
          <div className="row">
            <div className="col-xs-12">
              <h4>Häufige Fehler</h4>
              <XYPlot
                xType="ordinal"
                width={800}
                height={300}>
                <VerticalGridLines />
                <HorizontalGridLines />
                <XAxis title="Typ" />
                <YAxis title="Anzahl" tickFormat={this.formatYAxisTicks} />
                <VerticalBarSeries data={this.state.data}/>
              </XYPlot>
            </div>
          </div>
        </div>
    );
  }
}
