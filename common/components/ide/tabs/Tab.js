import React from 'react';
import PureRenderMixin from 'react-addons-pure-render-mixin';
import classNames from 'classnames';

export default class Tab extends React.Component {
  constructor(props) {
    super(props);

    this.onClose = this.onClose.bind(this);
    this.onClick = this.onClick.bind(this);
    this.shouldComponentUpdate = PureRenderMixin.shouldComponentUpdate.bind(this);
  }

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
      return <a onClick={this.onClose} className="action-label icon close-editor-action" role="button" title="Schließen"><span className="fa fa-times"></span></a>;
    }
  }

  renderIcon() {
    if (this.props.icon) {
      if (this.props.useImage) {
        return <span className="tab-icon hidden-xs-down"><img className="fa" src={"/public/img/" + this.props.icon} alt={this.props.icon} /></span>;
      } else {
        return <span className={"tab-icon hidden-xs-down fa fa-" + this.props.icon}></span>;
      }
    } else {
      return null;
    }
  }

  render() {
    let classes = classNames('tab ide-editor-background', {
      active: this.props.active,
      pinned: this.props.pinned
    });

    return (
      <div title={this.props.title} onClick={this.onClick} className={classes}>
        <div className="tab-label">
          {this.renderIcon()}
          {this.props.children}
        </div>
        <div className="tab-close">
          <div className="webbox-action-bar animated">
            <ul className="actions-container">
              <li className="action-item">
                {this.renderCloseButton()}
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  }
}

Tab.defaultProps = {
  children: 'Unknown Tab',
  icon: 'question-circle'
};
