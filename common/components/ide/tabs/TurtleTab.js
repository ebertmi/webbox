import React from 'react';

import Tab from './Tab';

export default class TurtleTab extends React.Component {
  constructor(props) {
    super(props);

  }

  componentDidMount() {
  }

  componentWillUnmount() {
  }

  componentWillReceiveProps() {
  }

  render() {
    return (
      <Tab {...this.props} icon="turtle">
        Turtle-Asugabe
      </Tab>
    );
  }
}
