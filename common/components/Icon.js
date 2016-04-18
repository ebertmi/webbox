import React from 'react';
import classNames from 'classnames';

export default function Icon(props) {
  let {className, ...rest} = props;

  let classes = classNames('fa', 'fa-' + props.name, {
    'fa-fw': props.fixedWidth,
    'fa-inverse': props.inverse,
    'fa-pulse': props.pulse,
    'fa-spin': props.spin,
    [`fa-${props.size}`]: props.size,
    [`fa-rotate-${props.rotate}`]: props.rotate,
    [`fa-flip-${props.flip}`]: props.flip
  }, className);

  return <span {...rest} className={classes}/>;
}
