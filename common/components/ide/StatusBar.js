import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import { AnyIcon } from '../Icon';
import { StatusBarAlignment } from '../../models/project/status';

export class StatusBar extends React.Component {
  constructor(props) {
    super(props);

    this.onChange = this.onChange.bind(this);

    this.state = {
      leftDescriptors: [],
      rightDescriptors: []
    };
  }

  componentDidMount() {
    this.props.registry.on('change', this.onChange);
    this.onChange();
  }

  componentWillUnmount() {
    this.props.registry.removeListener('change', this.onChange);
  }

  onChange() {
    const orderedItems = this.orderItems(this.props.registry.getItems());

    this.setState({
      leftDescriptors: orderedItems.leftDescriptors,
      rightDescriptors: orderedItems.rightDescriptors
    });
  }

  orderItems(items) {
    const leftDescriptors = items.filter(d => d.alignment === StatusBarAlignment.Left).sort((a, b) => b.priority - a.priority);
    const rightDescriptors = items.filter(d => d.alignment === StatusBarAlignment.Right).sort((a, b) => a.priority - b.priority);

    return {
      leftDescriptors,
      rightDescriptors
    };
  }

  render() {
    return (
      <div className="part statusbar" role="contentinfo">
        {this.state.leftDescriptors.map((descriptor, index) => {
          return <StatusBarEntryItem className="left" item={descriptor.item} key={'left-' + index} />;
        })}
        {this.state.rightDescriptors.map((descriptor, index) => {
          return <StatusBarEntryItem className="right" item={descriptor.item} key={'right-' + index} />;
        })}
      </div>
    );
  }
}

export class StatusBarEntryItem extends React.Component {
  constructor(props) {
    super(props);

    this.onChange = this.onChange.bind(this);
    this.executeCommand = this.executeCommand.bind(this);
  }

  componentDidMount() {
    this.props.item.on('change', this.onChange);
  }

  componentWillUnmount() {
    this.props.item.removeListener('change', this.onChange);
  }

  onChange() {
    this.forceUpdate();
  }

  executeCommand(e) {
    this.props.item.command(e);
  }

  render() {
    let icon = null;
    let classes = classnames('statusbar-item', this.props.className, this.props.item.color);
    if (this.props.item.icon) {
      icon = <AnyIcon className="statusbar-item-icon" icon={this.props.item.icon} />;
    }

    if (this.props.item.link) {
      return <div className={classes}><a onClick={this.executeCommand} href={this.props.item.link} title={this.props.item.tooltip}>{ icon }{this.props.item.label}</a></div>;
    } else {
      return <div className={classes}><span onClick={this.executeCommand} title={this.props.item.tooltip}>{ icon }{ this.props.item.label }</span></div>;
    }
  }
}

StatusBarEntryItem.propTypes = {
  item: PropTypes.object
};
