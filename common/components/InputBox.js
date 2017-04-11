import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import uniqueId from 'lodash/uniqueId';

/**
 * InputBox provides a more convinent way of creating inputs and textareas and adding events.
 */
export class InputBox extends React.Component {
  componentWillMount() {
    this.id = this.props.id || uniqueId('input-');
    this.autoSelected = false;
  }

  componentWillUnmount() {
    this.autoSelected = false;
  }

  getStyleClass() {
    let bsStyle = this.props.bsStyle;

    return classNames({
      'has-success': bsStyle === 'success',
      'has-warning': bsStyle === 'warning',
      'has-error': bsStyle === 'error'
    });
  }

  renderFlexibleHeight() {
    if (this.props.flexibleHeight) {
      return <textarea ref={this.onRef.bind(this)} onKeyPress={this.onKeyPress.bind(this)} onBlur={this.onBlur.bind(this)} onFocus={this.onFocus.bind(this)} onChange={this.onChange.bind(this)} placeholder={this.props.placeholder} className="input" autoCorrect="off" autoCapitalize="off" spellCheck="false">{this.props.value}</textarea>;
    } else {
      return <input ref={this.onRef.bind(this)} onKeyPress={this.onKeyPress.bind(this)} onBlur={this.onBlur.bind(this)} onFocus={this.onFocus.bind(this)} onChange={this.onChange.bind(this)} value={this.props.value} placeholder={this.props.placeholder} wrap="off" className="input" type={this.props.type} autoCorrect="off" autoCapitalize="off" spellCheck="false" />;
    }
  }

  /**
   * onRef gets the ref of the input/textarea element after rendering or componentUnMount
   */
  onRef(ref) {
    if (ref && this.props.autoFocus) {
      ref.focus();
    }

    //  only autoselect once
    if (ref && this.props.autoSelect && ref.setSelectionRange && this.autoSelected === false) {
      ref.setSelectionRange(0, this.getValueFromElement(ref).length);
      this.autoSelected = true;
    }
  }

  /**
   * Returns the value from the element or empty string.
   */
  getValueFromElement(element){
    let value = '';
    // get value
    if (element.type === 'text') {
      value = element.value;
    } else if (element.type === 'textarea') {
      value = element.innerText;
    }

    return value;
  }

  onChange(e) {
    e.preventDefault();
    let value;

    // get value
    value = this.getValueFromElement(e.target);

    // ToDo: trigger listeners
    if (this.props.onChange) {
      this.props.onChange(value);
    }
  }

  onKeyPress(e) {
    if (this.props.onKeyPress) {
      this.props.onKeyPress(e.keyCode, e.keyChar, e.key);
    }
  }

  onBlur(e) {
    //e.preventDefault();
    if (this.props.onBlur) {
      this.props.onBlur(e);
    }
  }

  onFocus(e) {
    e.preventDefault();

    if (this.props.onFocus) {
      this.props.onFocus();
    }
  }

  render() {
    return (
      <div className="monaco-inputbox idle">
        <div className="wrapper">
          {this.renderFlexibleHeight()}
        </div>
      </div>
    );
  }
}

InputBox.propTypes = {
  value: PropTypes.string.isRequired,
  type: PropTypes.string,
  flexibleHeight: PropTypes.bool,
  autoFocus: PropTypes.bool,
  autoSelect: PropTypes.bool,
  children: PropTypes.node,
  placeholder: PropTypes.string,
  className: PropTypes.string,
  id: PropTypes.string,
  bsStyle: PropTypes.oneOf(['success', 'warning', 'error'])
};

InputBox.defaultProps = {
  type: 'text',
  flexibleHeight: false,
  placeholder: '',
  autoFocus: true,
  autoSelect: false
};