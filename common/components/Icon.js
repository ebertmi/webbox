import React from 'react';
import classNames from 'classnames';

export default function Icon(props) {
  let {className, fixedWidth, inverse, pulse, spin, size, rotate, flip, ...rest} = props;

  let classes = classNames('fa', 'fa-' + props.name, {
    'fa-fw': fixedWidth,
    'fa-inverse': inverse,
    'fa-pulse': pulse,
    'fa-spin': spin,
    [`fa-${props.size}`]: size,
    [`fa-rotate-${props.rotate}`]: rotate,
    [`fa-flip-${props.flip}`]: flip
  }, className);

  return <span {...rest} className={classes}/>;
}
