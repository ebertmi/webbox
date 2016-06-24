import React from 'react';
import rd3 from 'rd3';

const BarChart = rd3.BarChart;

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
    this.setState({
      clusters: this.props.errorClusters.toSeries()
    });
  }

  render() {
    return (
        <div className="container-fluid">
          <div className="row">
            <div className="col-xs-12">
              <BarChart
                data={this.state.clusters}
                valuesAccessor={d => {
                  // This fixes the rendering with now series data!
                  return d != null ? d.values : [];
                }}
                width={800}
                height={300}
                title="Fehlertypen"
                xAxisLabel="Typ"
                yAxisLabel="Anzahl"
              />
            </div>
          </div>
        </div>
    );
  }
}
