import React from 'react';
import PropTypes from 'prop-types';

import { Loader } from '../components/Loader';

/**
 * Renders loader or content.
 */
export function LoadingContainer(props) {
  if (props.isLoading) {
    return <Loader type="line-scale" />;
  } else {
    return (
      <div>
        {props.children}
      </div>
    );
  }
}

LoadingContainer.propTypes = {
  isLoading: PropTypes.bool.isRequired
};