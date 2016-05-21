import React, { Component } from 'react';
import { connect } from 'react-redux';

// own imports
import Notebook from '../../components/notebook/Notebook';
import { prepareCells } from '../../actions/NotebookActions';

class NotebookApp extends Component {

  componentWillMount() {
    // update cells with ids if not assigned
    this.props.dispatch(prepareCells());
  }

  render () {
    return (
      <Notebook notebook={this.props.notebook} dispatch={this.props.dispatch}></Notebook>
    );
  }
}

export default connect(state => {
  return { notebook: state.notebook };
})(NotebookApp);