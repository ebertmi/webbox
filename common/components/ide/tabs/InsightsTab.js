import React from 'react';

import Tab from './Tab';

export default class InsightsTab extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      title: 'Statistiken'
    };
  }

  componentDidMount() {
  }

  componentWillUnmount() {
  }

  componentWillReceiveProps() {
  }


  render() {
    return (
      <Tab {...this.props} icon="bar-chart" className="info">
        {this.state.title}
      </Tab>
    );
  }
}
