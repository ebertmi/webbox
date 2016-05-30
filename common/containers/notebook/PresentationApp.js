import React, { Component } from 'react';
import { connect } from 'react-redux';

// own imports
import Presentation from '../../components/notebook/Presentation';
import { prepareCells } from '../../actions/NotebookActions';

class PresentationApp extends Component {

  componentWillMount() {
    // update cells with ids if not assigned
    this.props.dispatch(prepareCells());
  }

  render () {
    return <Presentation notebook={this.props.notebook} dispatch={this.props.dispatch} ></Presentation>;
  }
}

export default connect(state => {
  return { notebook: state.notebook };
})(PresentationApp);