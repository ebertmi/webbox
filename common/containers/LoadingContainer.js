import React, {Component} from 'react';

import { Loader } from '../components/Loader';

/**
 * Renders loader or content.
 */
export class LoadingContainer extends Component {
  renderLoader() {
    return <Loader type="line-scale" />;
  }

  renderContent() {
    return (
      <div>
        {this.props.children}
      </div>
    );
  }

  render() {
    return this.props.isLoading ? this.renderLoader() : this.renderContent();
  }
}

LoadingContainer.propTypes = {
  isLoading: React.PropTypes.bool.isRequired
};