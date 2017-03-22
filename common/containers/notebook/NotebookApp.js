import React from 'react';
import { connect } from 'react-redux';

// own imports
import Notebook from '../../components/notebook/Notebook';
import {RemoteDispatcher} from '../../models/insights/remoteDispatcher';

function NotebookApp (props) {
  return <Notebook notebook={props.notebook} dispatch={props.dispatch} remoteDispatcher={new RemoteDispatcher()}></Notebook>;
}

export default connect(state => {
  return { notebook: state.notebook };
})(NotebookApp);