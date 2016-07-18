import React from 'react';

import Tab from './Tab';
import Icon from '../../Icon';

export default class ProcessTab extends React.Component {
  constructor(props) {
    super(props);

    this.onBell = this.onBell.bind(this);
    this.onTitle = this.onTitle.bind(this);

    this.state = {
      bell: false,
      title: 'Terminal'
    };
  }

  componentDidMount() {
    this.props.item.on('bell', this.onBell);
    this.props.item.on('title', this.onTitle);
  }

  componentWillUnmount() {
    this.props.item.removeListener('bell', this.onBell);
    this.props.item.removeListener('title', this.onTitle);
  }

  componentWillReceiveProps({active}) {
    if (active) {
      this.setState({
        bell: false
      });
    }
  }

  onBell() {
    this.setState({
      bell: !this.props.active
    });
  }

  onTitle(title) {
    this.setState({ title });
  }

  renderBell() {
    if (this.state.bell) {
      return <Icon title="Bell-Signal in diesem Terminal" name="bell" className="warning"/>;
    }
  }

  render() {
    return (
      <Tab {...this.props} title="title" icon="terminal">
        {this.state.title}
        {' '}
        {this.renderBell()}
      </Tab>
    );
  }
}
