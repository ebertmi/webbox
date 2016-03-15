import React from 'react';
import classnames from 'classnames';

export function Alert(props) {
  const classes= classnames({
    alert: true,
    'alert-danger': props.type === 'error',
    'alert-info': props.type === 'info',
    'alert-success': props.type === 'success',
    'alert-warning': props.type === 'warning'

  });
  return (
    <div className={classes} role="alert">
      <strong>{props.title}</strong> {props.message} {props.children}
    </div>
  );
}