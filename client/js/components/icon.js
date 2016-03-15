import React from 'react';
import classNames from 'classnames';

export default function Icon(props) {
  let classes = classNames('fa', 'fa-' + props.name, {
    'fa-fw': props.fixedWidth,
    'fa-inverse': props.inverse,
    'fa-pulse': props.pulse,
    'fa-spin': props.spin,
    [`fa-size-${props.size}`]: props.size,
    [`fa-rotate-${props.rotate}`]: props.rotate,
    [`fa-flip-${props.flip}`]: props.flip
  });

  return <span className={classes}/>;
}
