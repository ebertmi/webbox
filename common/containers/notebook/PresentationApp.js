import React, { Component } from 'react';
import { connect } from 'react-redux';

// own imports
import Presentation from '../../components/presentation/Presentation';
import {RemoteDispatcher} from '../../models/insights/remoteDispatcher';

function PresentationApp(props) {
  return <Presentation notebook={props.notebook} dispatch={props.dispatch} remoteDispatcher={new RemoteDispatcher()}></Presentation>;
}

export default connect(state => {
  return { notebook: state.notebook };
})(PresentationApp);