import React from 'react';
import classNames from 'classnames';

export default function Embed({id, className}) {
  className = classNames(className, 'embed');

  return (
    <iframe
      src={`/embed/${id}`}
      className={className}
      allowfullscreeen
    />
  );
}
