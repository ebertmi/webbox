import React, { Component } from 'react';
import { connect } from 'react-redux';

// own imports
import Presentation from '../../components/presentation/Presentation';

function PresentationApp(props) {
  return <Presentation notebook={props.notebook} dispatch={props.dispatch} ></Presentation>;
}

export default connect(state => {
  return { notebook: state.notebook };
})(PresentationApp);