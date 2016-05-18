import React from 'react';

import Icon from '../../Icon';
import {NavItem} from '../../bootstrap';

export default class Tab extends React.Component {
  onClick(e) {
    e.preventDefault;

    if (this.props.onClick) {
      this.props.onClick(e);
    }
  }

  onClose(e) {
    e.preventDefault;
    e.stopPropagation();

    this.props.onClose(e);
  }

  renderCloseButton() {
    if (this.props.onClose) {
      return <Icon name="times" onClick={this.onClose.bind(this)}/>;
    }
  }

  render() {
    return (
      <NavItem onClick={this.onClick.bind(this)} active={this.props.active} useHref={false}>
        <Icon name={this.props.icon}/> {this.props.children} {this.renderCloseButton()}
      </NavItem>
    );
  }
}

Tab.defaultProps = {
  children: 'Unknown Tab',
  icon: 'question-circle'
};
