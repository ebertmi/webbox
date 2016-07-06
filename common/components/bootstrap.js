// a few wrapper components around common bootstrap elements

import React from 'react';
import classNames from 'classnames';
import uniqueId from 'lodash/uniqueId';

import Dropdown from '../util/dropdown.native';

export function Label(props) {
  let style = props.bsStyle || 'default';

  let classes = classNames('label', `label-${style}`, {
    'label-pill': props.pill
  });

  return (
    <span className={classes}>
      {props.children}
    </span>
  );
}

// navs and menus

export function Nav(props) {
  let classes = classNames('nav', {
    [`nav-${props.bsStyle}`]: props.bsStyle
  }, props.className);

  return (
    <nav className={classes}>
      {props.children}
    </nav>
  );
}

export function NavItem(props) {
  let { useHref, active, ...rest } = props;

  let classes = classNames('nav-item nav-link', {
    active: active
  });

  if (!useHref) {
    return (
      <a {...rest} className={classes}>
        {props.children}
      </a>
    );
  } else {
    return (
    <a {...props} href={props.href || '#'} className={classes}>
      {props.children}
    </a>
  );
  }
}

export function DropdownItem(props) {
  let classes = classNames('dropdown-item', {
    disabled: props.disabled
  });

  return (
    <a {...props} className={classes} href={props.href || '#'}>
      {props.children}
    </a>
  );
}

export function DropdownDivider() {
  return <div className="dropdown-divider"/>;
}

export class NavDropdown extends React.Component {
  componentDidMount() {
    new Dropdown(this.a);
  }

  render() {
    let menuClasses = classNames('dropdown-menu', {
      'dropdown-menu-right': this.props.right
    });

    return (
      <div href='#' className="nav-item dropdown">
        <a className="nav-link" href="#" ref={a => this.a = a}>
          {this.props.title}
        </a>
        <nav className={menuClasses}>
          {this.props.children}
        </nav>
      </div>
    );
  }
}

// forms & inputs

export class Input extends React.Component {
  componentWillMount() {
    this.id = this.props.id || uniqueId('input-');
  }

  getStyleClass() {
    let bsStyle = this.props.bsStyle;

    return classNames({
      'has-success': bsStyle === 'success',
      'has-warning': bsStyle === 'warning',
      'has-error': bsStyle === 'error'
    });
  }

  renderNormalInput() {
    let classes = classNames(this.getStyleClass(), 'form-group');
    let element;

    switch (this.props.type) {
      case 'textarea':
        element = <textarea {...this.props} id={this.id} className="form-control"/>;
        break;
      case 'select':
        element = (
          <select {...this.props} id={this.id} className="form-control c-select">
            {this.props.children}
          </select>
        );
        break;
      default:
        element = <input {...this.props} id={this.id} className="form-control"/>;
    }


    return (
      <fieldset className={classes}>
        {this.props.label ? <label htmlFor={this.id}>{this.props.label}</label> : undefined}
        {element}
        {this.renderMuted()}
      </fieldset>
    );
  }

  renderCheckboxRadio() {
    let classes = classNames(this.props.type, this.getStyleClass());

    return (
      <div className={classes}>
        <label>
          <input {...this.props}/>
          {this.props.label}
          {this.renderMuted()}
        </label>
      </div>
    );
  }

  renderMuted() {
    if (this.props.muted) {
      return <small className="text-muted">{this.props.muted}</small>;
    }
  }

  render() {
    return ['checkbox', 'radio'].includes(this.props.type) ? this.renderCheckboxRadio() : this.renderNormalInput();
  }
}

Input.propTypes = {
  type: React.PropTypes.string.isRequired,
  children: React.PropTypes.node,
  label: React.PropTypes.node,
  className: React.PropTypes.string,
  id: React.PropTypes.string,
  muted: React.PropTypes.string,
  bsStyle: React.PropTypes.oneOf(['success', 'warning', 'error'])
};

export function Button(props) {
  let { className, bsStyle, ...rest } = props;

  let classes = classNames('btn', {
    ['btn-' + bsStyle]: bsStyle
  }, className);

  return (
    <button type="button" {...rest} className={classes}>
      {props.children}
    </button>
  );
}
