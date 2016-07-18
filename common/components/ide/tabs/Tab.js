import React from 'react';

import Icon from '../../Icon';
import {NavItem} from '../../bootstrap';
import classNames from 'classnames';

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

  renderTablist() {
    return (
      <div role="tablist" className="tabs-container">
      </div>
    );
  }

  renderCloseButtonNew() {
    if (this.props.onClose) {
      return <a onClick={this.onClose.bind(this)} className="action-label icon close-editor-action" role="button" title="Schließen"><span className="fa fa-times"></span></a>;
    }
  }

  render() {
    let classes = classNames('tab ide-editor-background', {
      active: this.props.active,
      pinned: this.props.pinned
    });

    let icon = this.props.icon ? <span className={"tab-icon fa fa-" + this.props.icon}></span> : null;

    return (
      <div title={this.props.title} onClick={this.onClick.bind(this)} className={classes}>
        <div className="tab-label">
          {icon}
          {this.props.children}
        </div>
        <div className="tab-close">
          <div className="ide-action-bar animated">
            <ul className="actions-container">
              <li className="action-item">
                {this.renderCloseButtonNew()}
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  renderOld() {
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
