import React from  'react';

import Tab from './Tab';
export default class MatplotlibTab extends React.Component {
  constructor(props) {
    super(props);

  }

  componentWillMount() {
  }

  componentWillUnmount() {
  }

  render() {
    return (
      <Tab {...this.props} icon="chart">
        Matplotlib-Ausgabe
      </Tab>
    );
  }
}
