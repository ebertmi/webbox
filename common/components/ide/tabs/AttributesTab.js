import React from 'react';

import Tab from './Tab';

export default class AttributesTab extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      title: 'Eigenschaften'
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
      <Tab {...this.props} icon="info" className="info">
        {this.state.title}
      </Tab>
    );
  }
}
