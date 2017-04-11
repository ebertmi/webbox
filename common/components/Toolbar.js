import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

const STANDARD_CSS_CLASS = "webbox-action-bar";
/**
 * Toolbar
 */
export function Toolbar (props) {
  let {className, animated, children, ...rest} = props;
  const classes = classnames(STANDARD_CSS_CLASS, className, {
    'animated': animated
  });
  return (
    <div className={classes} {...rest}>
      <ul className="actions-container">
        {React.Children.map(children, (action, index) => {
          return action != null ? <li key={index} className="action-item">{action}</li> : null;
        })}
      </ul>
    </div>
  );
}

Toolbar.propTypes = {
  animated: PropTypes.bool
};

Toolbar.defaultProps = {
  animated: true
};

/**
 * Single ActionItem inside a Toolbar.
 *
 * @export
 * @param {any} props
 * @returns
 */
export function ActionItem (props) {
  let {className, children, isIcon, ...rest} = props;
  const classes = classnames('action-label', className, {
    'icon': isIcon
  });
  return (
    <a className={classes} {...rest} role="button" tabIndex="0">{children}</a>
  );
}

ActionItem.propTypes = {
  isIcon: PropTypes.bool,
  title: PropTypes.string
};

ActionItem.defaultProps = {
  isIcon: true,
  title: "",
};