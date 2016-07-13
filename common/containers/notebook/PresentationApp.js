import React, { Component } from 'react';
import { connect } from 'react-redux';

// own imports
import Presentation from '../../components/presentation/Presentation';
import { addCellsFromJS } from '../../actions/NotebookActions';

class PresentationApp extends Component {

  componentWillMount() {
  }

  render () {
    return <Presentation notebook={this.props.notebook} dispatch={this.props.dispatch} ></Presentation>;
  }
}

export default connect(state => {
  return { notebook: state.notebook };
})(PresentationApp);