import React from 'react';
import classNames from 'classnames';

export default function Icon(props) {
  let {className, fixedWidth, inverse, pulse, spin, size, rotate, flip, icon, name,...rest} = props;
  if (name == null && icon != null) {
    name = icon;
  }

  let classes = classNames('fa', 'fa-' + name, {
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

export function ImageIcon(props) {
  let {className, icon, ...rest} = props;
  let classes = classNames('tab-icon', className);
  return <span className={classes} {...rest}><img className="fa" src={"/public/img/icons/" + icon} alt={icon} /></span>;
}

/**
 * Tries to detect wether the specified icon prop is a path and renders it as an ImageIcon or
 * uses the default Icon Component to render font awesome icons.
 *
 * The path/image icon check is quite error prone as we only check for dots and slahses in the icon string.
 *
 * @export
 * @param {any} props
 * @returns
 */
export function AnyIcon(props) {
  // Check if the icon is basically a path
  if (props.icon && props.icon.includes('.') || props.icon.includes('/')) {
    return <ImageIcon {...props} />;
  } else {
    return <Icon {...props} />;
  }
}