/**
 * See https://github.com/jonjaques/react-loaders
 * Modiefied and removed unused code.
 */

import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

function renderDiv(n) {
  return <div key={n} />;
}

export function Loader(props) {
  const nDivs = range(Types[props.type]);
  const classes = classnames({
    loader: true,
    ['loader-' + props.size]: props.size !== 'md',
    'loader-active': props.active,
    'loader-hidden': !props.active
  }, props.className);

  return (<div className={classes}>
    <div className={`loader-inner ${props.type}`}>
      { nDivs.map(renderDiv) }
    </div>
  </div>);
}

function range(x) {
  let i = -1, arr = [];
  while(++i < x) {
    arr.push(i);
  }
  return arr;
}


export default Loader;

export var Types = {
  "ball-pulse"                  : 3,
  "ball-grid-pulse"             : 9,
  "ball-clip-rotate"            : 1,
  "ball-clip-rotate-pulse"      : 2,
  "square-spin"                 : 1,
  "ball-clip-rotate-multiple"   : 2,
  "ball-pulse-rise"             : 5,
  "ball-rotate"                 : 1,
  "cube-transition"             : 2,
  "ball-zig-zag"                : 2,
  "ball-zig-zag-deflect"        : 2,
  "ball-triangle-path"          : 3,
  "ball-scale"                  : 1,
  "line-scale"                  : 5,
  "line-scale-party"            : 4,
  "ball-scale-multiple"         : 3,
  "ball-pulse-sync"             : 3,
  "ball-beat"                   : 3,
  "line-scale-pulse-out"        : 5,
  "line-scale-pulse-out-rapid"  : 5,
  "ball-scale-ripple"           : 1,
  "ball-scale-ripple-multiple"  : 3,
  "ball-spin-fade-loader"       : 8,
  "line-spin-fade-loader"       : 8,
  "triangle-skew-spin"          : 1,
  "pacman"                      : 5,
  "ball-grid-beat"              : 9,
  "semi-circle-spin"            : 1
};

Loader.propTypes = {
  type: PropTypes.string,
  size: PropTypes.string,
  active: PropTypes.bool
};

Loader.defaultProps = {
  type: 'ball-pulse',
  size: 'md',
  active: true
};