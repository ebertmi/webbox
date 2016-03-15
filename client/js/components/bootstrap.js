// a few wrapper components around common bootstrap elements

import React from 'react';
import classNames from 'classnames';

import Dropdown from '../util/dropdown.native';

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
  let classes = classNames('nav-item nav-link', {
    active: props.active
  });

  return (
    <a {...props} href={props.href || '#'} className={classes}>
      {props.children}
    </a>
  );
}

export function DropdownItem(props) {
  return (
    <a {...props} className="dropdown-item" href={props.href || '#'}>
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
    let itemClasses = classNames('nav-item dropdown', {
      'pull-xs-right': this.props.right
    });

    let menuClasses = classNames('dropdown-menu', {
      'dropdown-menu-right': this.props.right
    });

    return (
      <div href='#' className={itemClasses}>
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
  isCheckbox() {
    return this.props.type === 'checkbox';
  }

  renderLabel() {
    if (this.props.label && (this.grid || !this.isCheckbox())) {
      let classes = classNames(this.props.labelClassName, {
        'form-control-label': this.grid
      });

      return <label htmlFor={this.props.id} className={classes}>{this.props.label}</label>;
    }
  }

  renderInput() {
    switch (this.props.type) {
      case 'textarea':
        return <textarea {...this.props} className="form-control" ref={input => this.input = input}/>;
      case 'select':
        return (
          <select {...this.props} className="form-control c-select" ref={input => this.input = input}>
            {this.props.children}
          </select>
        );
      default: {
        let input = <input {...this.props} className="form-control" ref={input => this.input = input}/>;

        if (this.isCheckbox()) {
          return (
            <label className="c-input c-checkbox">
              {input}
              <span className="c-indicator"/>
              {this.grid ? null : this.props.label}
            </label>
          );
        } else {
          return input;
        }
      }
    }
  }

  render() {
    this.grid = this.props.className && this.props.className.split(' ').some(c => c.startsWith('col-'));

    let bsStyle = this.props.bsStyle;

    let classes = classNames('form-group', {
      'checkbox': this.isCheckbox() && !this.grid,
      'row': this.grid,
      'has-success': bsStyle === 'success',
      'has-warning': bsStyle === 'warning',
      'has-error': bsStyle === 'error'
    });

    let offsets;

    if (this.grid && !this.props.label && this.props.labelClassName) {
      offsets = this.props.labelClassName.split(' ').map(c => {
        let match = c.match(/(col-\w{2})-(\d*)/);

        if (match) {
          return match[1] + '-offset-' + match[2];
        }
      });
    }

    let muted = this.props.muted ? <small className="text-muted">{this.props.muted}</small> : null;

    return (
      <div className={classes}>
        {this.renderLabel()}
        <div className={classNames(offsets, this.props.className)}>
          {this.renderInput()}
          {muted}
        </div>
      </div>
    );
  }
}

Input.propTypes = {
  type: React.PropTypes.string.isRequired,
  children: React.PropTypes.node,
  label: React.PropTypes.node,
  className: React.PropTypes.string,
  labelClassName: React.PropTypes.string,
  id: React.PropTypes.string,
  muted: React.PropTypes.string,
  bsStyle: React.PropTypes.oneOf(['success', 'warning', 'error'])
};

export class InputButton extends Input {
  renderLabel() {
  }

  renderInput() {
    let classes = classNames('btn', {
      ['btn-' + this.props.bsStyle]: this.props.bsStyle
    });

    return <input {...this.props} type="button" className={classes}/>;
  }
}
