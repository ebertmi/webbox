import React from 'react';
import PureRenderMixin from 'react-addons-pure-render-mixin';
import classNames from 'classnames';

import { calculateTouchMovement, getTouchDataFromEvent, touchDeltaWithinThreshold, TOUCH_DURATION_THRESHOLD } from '../../../util/touchUtils';

export default class Tab extends React.Component {
  constructor(props) {
    super(props);

    this.clearTimer = this.clearTimer.bind(this);
    this.onPress = this.onPress.bind(this);
    this.onClose = this.onClose.bind(this);
    this.onClick = this.onClick.bind(this);
    this.onTouchStart = this.onTouchStart.bind(this);
    this.onTouchEnd = this.onTouchEnd.bind(this);
    this.onTouchCancel = this.onTouchCancel.bind(this);
    this.onTouchMove = this.onTouchMove.bind(this);
    this.onPressTimer = null;

    this._initialTouch = null;
    this._lastTouch = null;
    this._canPress = false;

    this.shouldComponentUpdate = PureRenderMixin.shouldComponentUpdate.bind(this);
  }

  clearTimer() {
    if (this.onPressTimer != null) {
      window.clearTimeout(this.onPressTimer);
      this.onPressTimer = null;
    }
  }

  onClick(e) {
    e.preventDefault;

    if (this.props.onClick) {
      this.props.onClick(e);
    }
  }

  onPress(e) {
    if (this.props.onPress) {
      this.props.onPress.apply(null, e);
    }
  }

  onClose(e) {
    e.preventDefault;
    e.stopPropagation();

    this.props.onClose(e);
  }

  onTouchStart(e) {
    // Check if we have a single touch event, else it could be pinch
    this._initialTouch = getTouchDataFromEvent(e);
    e.preventDefault();
  }

  onTouchMove(e) {
    if (this._initialTouch != null) {
      this._lastTouch = getTouchDataFromEvent(e);
      e.preventDefault();
    }
  }

  onTouchCancel(e) {
    this._initialTouch = null;
    this._lastTouch = null;

    e.preventDefault();
  }

  onTouchEnd(e) {
    if (this._initialTouch != null) {
      let timeDifference = Math.abs(this._initialTouch.timeStamp - Date.now());

      // Check the time delta between the start and end event
      if (this._lastTouch && timeDifference <= TOUCH_DURATION_THRESHOLD) {
        const movement = calculateTouchMovement(this._initialTouch, this._lastTouch);
        if (touchDeltaWithinThreshold(movement)) {
          this.onClick(e); // handle click
        }
      } else if (timeDifference <= TOUCH_DURATION_THRESHOLD){
        // Rare case, when there is no user movement at all
        this.onClick(e);
      }
    }

    this._initialTouch = null;
    this._lastTouch = null;
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
      <div title={this.props.title} onClick={this.onClick} onTouchMove={this.onTouchMove} onTouchStart={this.onTouchStart} onTouchCancel={this.onTouchCancel} onTouchEnd={this.onTouchEnd} className={classes}>
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
