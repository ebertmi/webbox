import React from 'react';
import {BarChart, Bar, XAxis, YAxis, Tooltip} from 'recharts';

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

  render() {
    return (
        <div className="container-fluid">
          <div className="row">
            <div className="col-xs-12">
              <h4>Häufige Fehler</h4>
              <BarChart data={this.state.data} width={800} height={300} margin={{top: 25, right: 30, left: 20, bottom: 5}}>
                <XAxis label="Typ" dataKey="x" />
                <YAxis allowDecimals={false} label="Anzahl" />
                <Tooltip />
                <Bar name="Anzahl" dataKey="y" fill="#fc2929" />
              </BarChart>
            </div>
          </div>
        </div>
    );
  }
}
