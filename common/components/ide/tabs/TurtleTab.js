import React from 'react';

import Tab from './Tab';
import Icon from '../../Icon';

export default class TurtleTab extends React.Component {
  constructor(props) {
    super(props);

    this.onTitle = this.onTitle.bind(this);

    this.state = {
      title: 'Turtle'
    };
  }

  componentDidMount() {
    this.props.item.on('title', this.onTitle);
  }

  componentWillUnmount() {
    this.props.item.removeListener('title', this.onTitle);
  }

  componentWillReceiveProps() {
  }

  onTitle(title) {
    this.setState({ title });
  }

  renderRunning() {
    if (this.state.bell) {
      return <Icon title="Turtle läuft gerade" name="turtle" className="warning"/>;
    }
  }

  render() {
    return (
      <Tab {...this.props} icon="turtle">
        {this.state.title}
        {' '}
        {this.renderRunning()}
      </Tab>
    );
  }
}
