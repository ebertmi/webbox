import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

// own imports
import Presentation from '../../components/presentation/Presentation';

class PresentationApp  extends React.PureComponent {

  render() {
    return <Presentation notebook={this.props.notebook} dispatch={this.props.dispatch}></Presentation>;
  }
}

export default connect(state => {
  return { notebook: state.notebook };
})(PresentationApp);

PresentationApp.childContextTypes = {
  remoteDispatcher: PropTypes.object
};