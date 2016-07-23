import React from 'react';

import { Loader } from '../components/Loader';

/**
 * Renders loader or content.
 */
function LoadingContainer(props) {
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
  isLoading: React.PropTypes.bool.isRequired
};